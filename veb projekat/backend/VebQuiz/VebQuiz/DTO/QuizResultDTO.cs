namespace VebQuiz.DTO
{
    public class QuizResultDTO
    {
        public int Id { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }
        public string QuizTitle { get; set; }        // naziv kviza
        public double DurationSeconds { get; set; }  // trajanje kviza
        public DateTime CompletedAt { get; set; }    // kada je rešeno
        public List<QuestionResultDTO> QuestionResults { get; set; }
    }
    public class QuestionResultDTO
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public string Type { get; set; }
        public List<AnswerResultDTO> Answers { get; set; }
        public List<int> UserAnswerIds { get; set; }
        public bool IsCorrect { get; set; }
        // NOVO → tekstualni odgovor za FillInTheBlank
        public string? UserTextAnswer { get; set; }
    }

    public class AnswerResultDTO
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public bool IsCorrect { get; set; }
    }
    public class QuizSolveAnswerDTO
    {
        public int QuestionId { get; set; }
        public List<int> SelectedAnswerIds { get; set; } = new();
        public string? FreeText { get; set; } // ← NOVO za FillInTheBlan
    }
}
