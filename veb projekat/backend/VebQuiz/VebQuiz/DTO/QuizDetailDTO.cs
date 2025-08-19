namespace VebQuiz.DTO
{
    public class QuizDetailDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public int TimeLimitSeconds { get; set; }
        public string Difficulty { get; set; }
        public List<QuestionForSolveDTO> Questions { get; set; } = new();
    }

    public class QuestionForSolveDTO
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public string Type { get; set; }
        public List<AnswerForSolveDTO> Answers { get; set; } = new();
    }

    public class AnswerForSolveDTO
    {
        public int Id { get; set; }
        public string Text { get; set; }
        // Nema isCorrect — to ne vidi korisnik!
    }
}
