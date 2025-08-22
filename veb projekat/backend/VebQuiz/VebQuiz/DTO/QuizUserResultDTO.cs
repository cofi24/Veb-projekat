namespace VebQuiz.DTO
{
    public class QuizUserResultDTO
    {
        public int QuizResultId { get; set; }
        public string QuizTitle { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }
        public double DurationSeconds { get; set; }  // trajanje u sekundama

        public DateTime CompletedAt { get; set; }
    }
}
