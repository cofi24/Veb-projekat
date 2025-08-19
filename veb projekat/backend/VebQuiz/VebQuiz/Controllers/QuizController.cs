using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VebQuiz.DTO;
using VebQuiz.Interface;

namespace VebQuiz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizController:ControllerBase
    {
        private readonly IQuizService _quizService;

        public QuizController(IQuizService quizService)
        {
            _quizService = quizService;
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateQuiz([FromBody] QuizDTO quizDto)
        {
            await _quizService.CreateQuizAsync(quizDto);
            return Ok("Kviz uspešno kreiran.");
        }
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var quizzes = await _quizService.GetAllQuizzesAsync();
            return Ok(quizzes);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var quiz = await _quizService.GetQuizByIdAsync(id);
                return Ok(quiz);
            }
            catch (Exception e)
            {
                return NotFound(e.Message);
            }
        }
        [HttpPost("{id}/solve")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> Solve(int id, [FromBody] QuizSolveDTO dto)
        {
            var username = User.Identity?.Name!;
            var result = await _quizService.SolveQuizAsync(id, dto, username);
            return Ok(result);
        }
    }
}
