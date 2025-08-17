namespace VebQuiz.Model
{
    public class QuizResult
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int QuizId { get; set; }
        public Quiz Quiz { get; set; }

        public int Score { get; set; } // broj tačnih odgovora
        public int TotalQuestions { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime CompletedAt { get; set; }
        public double DurationSeconds { get; set; }
        public List<QuizUserAnswer> UserAnswers { get; set; } = new();
    }
}
