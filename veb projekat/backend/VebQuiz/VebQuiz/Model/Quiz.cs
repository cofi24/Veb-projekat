namespace VebQuiz.Model
{
    public class Quiz
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public int TimeLimitSeconds { get; set; }
        public string Difficulty { get; set; } // "lako", "srednje", "teško"
        public ICollection<Question> Questions { get; set; }
        public int? MaxAttempts { get; set; }
    }
}
