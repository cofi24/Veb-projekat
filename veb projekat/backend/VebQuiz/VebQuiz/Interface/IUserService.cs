using VebQuiz.DTO;

namespace VebQuiz.Interface
{
    public interface IUserService
    {
        Task RegisterAsync(RegisterDTO dto);
        Task<string> LoginAsync(LoginDTO dto);

        Task<string> TestAsync(string username);
    }
}
