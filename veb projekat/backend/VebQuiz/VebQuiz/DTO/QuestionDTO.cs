namespace VebQuiz.DTO
{
    public class QuestionDTO
    {
        public int Id { get; set; }  // Id pitanja
        public string Text { get; set; }  // Tekst pitanja
        public string Type { get; set; }  // Tip pitanja (SingleChoice, MultipleChoice, itd.)
        public List<AnswerDTO> Answers { get; set; }  // Lista odgovora
    }
}
