using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VebQuiz.Configurations;
using VebQuiz.DTO;
using VebQuiz.Interface;
using VebQuiz.Model;

namespace VebQuiz.Services
{
    public class QuizService : IQuizService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public QuizService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task CreateQuizAsync(QuizDTO quizDto)
        {
            var quiz = _mapper.Map<Quiz>(quizDto);
            await _context.Quizzes.AddAsync(quiz);
            await _context.SaveChangesAsync();
        }


        public async Task<List<QuizPreviewDTO>> GetAllQuizzesAsync()
        {
            var quizzes = await _context.Quizzes.ToListAsync();
            return _mapper.Map<List<QuizPreviewDTO>>(quizzes);
        }

        public async Task<QuizDetailDTO> GetQuizByIdAsync(int id)
        {
            var quiz = await _context.Quizzes
               .Include(q => q.Questions)
               .ThenInclude(q => q.Answers)
               .FirstOrDefaultAsync(q => q.Id == id);

            if (quiz == null)
                throw new Exception("Kviz nije pronađen.");

            return _mapper.Map<QuizDetailDTO>(quiz);
        }

      

        public async Task<QuizResultDTO> SolveQuizAsync(int quizId, QuizSolveDTO submission, string username)
        {
            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                    .ThenInclude(q => q.Answers)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null)
                throw new Exception("Kviz ne postoji.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                throw new Exception("Korisnik ne postoji.");
            // 1) Validacija vremena (pod pretpostavkom da front šalje StartedAt iz trenutka otvaranja kviza)
            var startedUtc = submission.StartedAt.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(submission.StartedAt, DateTimeKind.Utc)
                : submission.StartedAt.ToUniversalTime();

            var nowUtc = DateTime.UtcNow;
            var elapsedSeconds = (nowUtc - submission.StartedAt).TotalSeconds;
            if (elapsedSeconds > quiz.TimeLimitSeconds)
                throw new Exception("Vreme za rešavanje kviza je isteklo.");

            var attempts = await _context.QuizResults
                .CountAsync(r => r.UserId == user.Id && r.QuizId == quiz.Id);

            if (quiz.MaxAttempts.HasValue && attempts >= quiz.MaxAttempts.Value)
                throw new Exception("Prekoračen maksimalan broj pokušaja za ovaj kviz.");

            return null;


        }

        public async Task UpdateQuizAsync(int id, UpdateQuizDTO dto)
        {
            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null)
                throw new Exception("Kviz nije pronađen.");

            quiz.Title = dto.Title;
            quiz.Description = dto.Description;
            quiz.Category = dto.Category;
            quiz.TimeLimitSeconds = dto.TimeLimitSeconds;
            quiz.Difficulty = dto.Difficulty;

            await _context.SaveChangesAsync();
        }

        public async Task UpdateQuizQuestionsAsync(int id, QuizDTO dto)
        {
            if (dto?.Questions == null) throw new Exception("Nije poslata lista pitanja.");
            var exists = await _context.Quizzes.AnyAsync(q => q.Id == id);
            if (!exists) throw new Exception("Kviz nije pronađen.");

            using var tx = await _context.Database.BeginTransactionAsync();

            // 1) PRVO obriši sve korisničke odgovore na pitanja ovog kviza
            await _context.QuizUserAnswers
                .Where(ua => ua.Question.QuizId == id)
                .ExecuteDeleteAsync();

            // 2) Onda obriši odgovore i pitanja
            await _context.Answers
                .Where(a => a.Question.QuizId == id)
                .ExecuteDeleteAsync();

            await _context.Questions
                .Where(q => q.QuizId == id)
                .ExecuteDeleteAsync();

            // 3) Ubaci novu listu pitanja/odgovora (eksplicitno setuj QuizId)
            var toInsert = dto.Questions.Select(q => new Question
            {
                QuizId = id,
                Text = q.Text?.Trim() ?? "",
                Type = Enum.Parse<QuestionType>(q.Type, true),
                Answers = (q.Answers ?? new()).Select(a => new Answer
                {
                    Text = (a.Text ?? "").Trim(),
                    IsCorrect = a.IsCorrect
                }).ToList()
            }).ToList();

            await _context.Questions.AddRangeAsync(toInsert);
            await _context.SaveChangesAsync();

            await tx.CommitAsync();
        }


        public async Task DeleteQuestionAsync(int questionId)
        {
            var question = await _context.Questions
               .Include(q => q.Answers)
               .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null)
                throw new Exception("Pitanje nije pronađeno.");

            _context.Answers.RemoveRange(question.Answers);
            _context.Questions.Remove(question);

            await _context.SaveChangesAsync();
        }

        public async Task DeleteQuizAsync(int id)
        {
            var quiz = await _context.Quizzes
               .Include(q => q.Questions)
               .ThenInclude(q => q.Answers)
               .FirstOrDefaultAsync(q => q.Id == id);

            if (quiz == null)
                throw new Exception("Kviz nije pronađen.");

            _context.Answers.RemoveRange(quiz.Questions.SelectMany(q => q.Answers));
            _context.Questions.RemoveRange(quiz.Questions);
            _context.Quizzes.Remove(quiz);

            await _context.SaveChangesAsync();
        }

        public async Task<List<QuizResultForAdminDTO>> GetResultsByQuizIdAsync(int quizId)
        {
            var quiz = await _context.Quizzes.FindAsync(quizId);
            if (quiz == null)
                throw new Exception("Kviz ne postoji.");

            var results = await _context.QuizResults
                .Where(r => r.QuizId == quizId)
                .Include(r => r.User)
                .OrderByDescending(r => r.CompletedAt)
                .ToListAsync();

            return results.Select(r => new QuizResultForAdminDTO
            {
                Username = r.User.Username,
                Score = r.Score,
                TotalQuestions = r.TotalQuestions,
                Percentage = Math.Round((double)r.Score / r.TotalQuestions * 100, 2),
                CompletedAt = r.CompletedAt
            }).ToList();
        }
    }
}
