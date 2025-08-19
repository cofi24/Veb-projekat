using VebQuiz.DTO;

namespace VebQuiz.Interface
{
    public interface IQuizService
    {
        Task CreateQuizAsync(QuizDTO quizDto);
        Task<List<QuizPreviewDTO>> GetAllQuizzesAsync();
        Task<QuizDetailDTO> GetQuizByIdAsync(int id);
        Task<QuizResultDTO> SolveQuizAsync(int quizId, QuizSolveDTO submission, string username);


    }
}
