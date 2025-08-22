namespace VebQuiz.DTO
{
    public class QuizResultForAdminDTO
    {
        public string Username { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }
        public DateTime CompletedAt { get; set; }
    }
}
