namespace VebQuiz.Model
{
    public class QuizUserAnswer
    {
        public int Id { get; set; }

       
        public int QuizResultId { get; set; }
        public QuizResult QuizResult { get; set; }

        
        public int? QuestionId { get; set; }
        public Question Question { get; set; }


     
        public string FreeTextAnswer { get; set; }

       
        public List<int> SelectedAnswerIds { get; set; } = new List<int>();
    }
}
