namespace VebQuiz.DTO
{
    public class QuizDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public int TimeLimitSeconds { get; set; }
        public string Difficulty { get; set; }

        public List<QuestionDTO> Questions { get; set; } = new();
    }
}
