using VebQuiz.Model;

namespace VebQuiz.DTO
{
    public class QuizUserAnswerDto
    {
        public int? QuestionId { get; set; }
        public string QuestionText { get; set; }
        public QuestionType Type { get; set; }

        public List<string> UserSelectedAnswers { get; set; } = new();
        public string FreeTextAnswer { get; set; }

        public List<string> CorrectAnswers { get; set; } = new();
        public bool IsCorrect { get; set; }
    }

    public class QuizResultDetailsDto
    {
        public int QuizResultId { get; set; }
        public string QuizTitle { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double DurationSeconds { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime CompletedAt { get; set; }

        public List<QuizUserAnswerDto> Answers { get; set; } = new();

        public int AttemptCount { get; set; }
        public List<QuizResultAttemptDto> Attempts { get; set; } = new();
    }

    public class QuizResultAttemptDto
    {
        public int QuizResultId { get; set; }
        public DateTime CompletedAt { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double DurationSeconds { get; set; }
        public double Percentage { get; set; } // 0–100
    }
}
