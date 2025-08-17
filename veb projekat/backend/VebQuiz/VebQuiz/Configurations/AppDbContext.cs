using Microsoft.EntityFrameworkCore;
using VebQuiz.Model;


namespace VebQuiz.Configurations
{
    public class AppDbContext:DbContext

    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }

        public DbSet<QuizResult> QuizResults { get; set; }

        public DbSet<QuizUserAnswer> QuizUserAnswers { get; set; }

    }
}
