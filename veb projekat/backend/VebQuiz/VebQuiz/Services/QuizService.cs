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
    }
}
