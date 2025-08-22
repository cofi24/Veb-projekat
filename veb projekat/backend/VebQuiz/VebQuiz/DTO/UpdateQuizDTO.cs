namespace VebQuiz.DTO
{
    public class UpdateQuizDTO
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public int TimeLimitSeconds { get; set; }
        public string Difficulty { get; set; }
    }
}
