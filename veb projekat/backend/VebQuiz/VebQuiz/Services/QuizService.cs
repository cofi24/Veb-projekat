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



        public async Task<List<QuizDTO>> FilterQuizzesAsync(string? category, string? difficulty, string? search)
        {
            var query = _context.Quizzes
                .Include(q => q.Questions)
                    .ThenInclude(q => q.Answers)
                .AsQueryable();

            if (!string.IsNullOrEmpty(category))
                query = query.Where(q => q.Category.ToLower().Contains(category.ToLower()));

            if (!string.IsNullOrEmpty(difficulty))
                query = query.Where(q => q.Difficulty.ToLower() == difficulty.ToLower());

            if (!string.IsNullOrEmpty(search))
                query = query.Where(q =>
                    q.Title.ToLower().Contains(search.ToLower()) ||
                    q.Description.ToLower().Contains(search.ToLower()));

            var filteredQuizzes = await query.ToListAsync();

            return _mapper.Map<List<QuizDTO>>(filteredQuizzes);
        }

        public async Task<List<LeaderboardEntryDTO>> GetLeaderboardAsync(int? quizId, string? period)
        {
            var query = _context.QuizResults
                .AsNoTracking()
                .Include(r => r.User) // da dobijemo Username
                .AsQueryable();

            if (quizId.HasValue)
                query = query.Where(q => q.QuizId == quizId.Value);

            var nowUtc = DateTime.UtcNow;
            switch (period?.Trim().ToLowerInvariant())
            {
                case "daily":
                    query = query.Where(q => q.CompletedAt >= nowUtc.Date);
                    break;
                case "monthly":
                    var monthStartUtc = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    query = query.Where(q => q.CompletedAt >= monthStartUtc);
                    break;
            }

            // 1) Agregati (MATERIJALIZUJ pre base64)
            var aggregates = await query
                .GroupBy(x => new { x.UserId, x.User.Username })
                .Select(g => new
                {
                    g.Key.UserId,
                    g.Key.Username,
                    TotalScore = g.Sum(x => x.Score),
                    AchievedAt = g.Max(x => x.CompletedAt)
                })
                .ToListAsync();

            if (aggregates.Count == 0)
                return new List<LeaderboardEntryDTO>();

            // 2) Slike za te korisnike
            var userIds = aggregates.Select(a => a.UserId).Distinct().ToList();

            var photos = await _context.Users
                .AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.ProfilePictureData,
                    u.ProfilePictureContentType
                })
                .ToListAsync();

            var photoMap = photos.ToDictionary(p => p.Id, p => p);

            // 3) Sastavi DTO + data-URL (fallback na SVG inicijale po želji)
            var result = aggregates
                .Select(a =>
                {
                    photoMap.TryGetValue(a.UserId, out var p);
                    string? dataUrl = null;

                    if (p?.ProfilePictureData != null && p.ProfilePictureData.Length > 0)
                    {
                        var ct = string.IsNullOrWhiteSpace(p.ProfilePictureContentType)
                            ? "image/png"
                            : p.ProfilePictureContentType!;
                        var b64 = Convert.ToBase64String(p.ProfilePictureData);
                        dataUrl = $"data:{ct};base64,{b64}";
                    }
                    // else: ostavi null, ili ubaci fallback SVG ako želiš da front UVEK dobije nešto

                    return new LeaderboardEntryDTO
                    {
                        UserId = a.UserId,
                        Username = a.Username,
                        TotalScore = a.TotalScore,
                        AchievedAt = a.AchievedAt,
                        ProfilePictureDataUrl = dataUrl
                    };
                })
                .OrderByDescending(x => x.TotalScore)
                .ThenBy(x => x.AchievedAt)
                .ThenBy(x => x.Username)
                .ToList();

            return result;
        }






        public async Task<List<QuizUserResultDTO>> GetUserResultsAsync(string username)
        {
            return await _context.QuizResults
         .AsNoTracking()
         .Where(r => r.User.Username == username)
         .OrderByDescending(r => r.CompletedAt)
         .Select(r => new QuizUserResultDTO
         {
             QuizResultId = r.Id,                            // ✅ bitno za front
             QuizTitle = r.Quiz.Title,
             Score = r.Score,
             TotalQuestions = r.TotalQuestions,
             Percentage = Math.Round((double)r.Score * 100.0 / (r.TotalQuestions == 0 ? 1 : r.TotalQuestions), 2),
             DurationSeconds = r.DurationSeconds,
             CompletedAt = r.CompletedAt
         })
         .ToListAsync();
        }



        public async Task<QuizResultDetailsDto?> GetUserQuizResultAsync(int quizResultId, string username)
        {
            var result = await _context.QuizResults
                .Include(r => r.Quiz)
                .Include(r => r.UserAnswers)
                    .ThenInclude(ua => ua.Question)
                        .ThenInclude(q => q.Answers)
                .Where(r => r.Id == quizResultId && r.User.Username == username)
                .FirstOrDefaultAsync();

            if (result == null)
                return null;

            // Svi pokušaji istog korisnika za isti kviz (za grafikon)
            var attempts = await _context.QuizResults
                .Where(r => r.UserId == result.UserId && r.QuizId == result.QuizId)
                .OrderBy(r => r.CompletedAt)
                .Select(r => new QuizResultAttemptDto
                {
                    QuizResultId = r.Id,
                    CompletedAt = r.CompletedAt,
                    Score = r.Score,
                    TotalQuestions = r.TotalQuestions,
                    DurationSeconds = r.DurationSeconds,
                    Percentage = Math.Round(100.0 * (double)r.Score / Math.Max(1, r.TotalQuestions), 2)
                })
                .ToListAsync();

            var dto = new QuizResultDetailsDto
            {
                QuizResultId = result.Id,
                QuizTitle = result.Quiz.Title,
                Score = result.Score,
                TotalQuestions = result.TotalQuestions,
                DurationSeconds = result.DurationSeconds, // ako je int?, može: result.DurationSeconds ?? 0
                StartedAt = result.StartedAt,
                CompletedAt = result.CompletedAt,

                Answers = result.UserAnswers.Select(ua => new QuizUserAnswerDto
                {
                    QuestionId = ua.QuestionId,
                    QuestionText = ua.Question.Text,
                    Type = ua.Question.Type,

                    // ⬇️ Izvuci tekstove iz odgovarajućih Answer entiteta
                    UserSelectedAnswers = ua.Question.Answers
                        .Where(a => ua.SelectedAnswerIds.Contains(a.Id))
                        .Select(a => a.Text)
                        .ToList(),

                    FreeTextAnswer = ua.FreeTextAnswer,

                    CorrectAnswers = ua.Question.Answers
                        .Where(a => a.IsCorrect)
                        .Select(a => a.Text)
                        .ToList(),

                    IsCorrect = ua.Question.Type == QuestionType.FillInTheBlank
                        ? string.Equals(
                            ua.FreeTextAnswer?.Trim(),
                            ua.Question.Answers.FirstOrDefault(a => a.IsCorrect)?.Text.Trim(),
                            StringComparison.OrdinalIgnoreCase)
                        : ua.Question.Answers
                            .Where(a => a.IsCorrect).Select(a => a.Id).OrderBy(id => id)
                            .SequenceEqual(ua.SelectedAnswerIds.OrderBy(id => id))
                }).ToList(),

                Attempts = attempts,
                AttemptCount = attempts.Count
            };

            return dto;
        }

    }
}
