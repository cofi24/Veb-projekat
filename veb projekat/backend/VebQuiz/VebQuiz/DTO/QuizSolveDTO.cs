namespace VebQuiz.DTO
{
    public class QuizSolveDTO
    {
        public List<AnsweredQuestionDTO> Answers { get; set; } = new();
        public DateTime StartedAt { get; set; }
    }
    public class AnsweredQuestionDTO
    {
        public int QuestionId { get; set; }
        public List<int> SelectedAnswerIds { get; set; } = new(); // podržava i više odgovora
        public string? FreeText { get; set; }
    }
}
