namespace VebQuiz.Model
{
    public enum QuestionType
    {
        SingleChoice,
        MultipleChoice,
        TrueFalse,
        FillInTheBlank
    }
    public class Question
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public QuestionType Type { get; set; } // Enum: SingleChoice, MultipleChoice, TrueFalse, etc.
        public ICollection<Answer> Answers { get; set; }
        public int QuizId { get; set; }
        public Quiz Quiz { get; set; }
    }
}
