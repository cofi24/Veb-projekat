using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VebQuiz.Interface;
using VebQuiz.Model;

namespace VebQuiz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "user")]
    public class ResultController : ControllerBase
    {
        private readonly IQuizService _quizService;

        public ResultController(IQuizService quizService)
        {
            _quizService = quizService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyResults()
        {
            var username = User.Identity?.Name!;
            var results = await _quizService.GetUserResultsAsync(username);
            return Ok(results);
        }
    }
}
