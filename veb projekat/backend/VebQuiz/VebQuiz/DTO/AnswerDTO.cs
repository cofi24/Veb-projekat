namespace VebQuiz.DTO
{
    public class AnswerDTO
    {
        public int Id { get; set; }  // Id odgovora
        public string Text { get; set; }  // Tekst odgovora
        public bool IsCorrect { get; set; }  // Da li je odgovor tačan
    }
}
