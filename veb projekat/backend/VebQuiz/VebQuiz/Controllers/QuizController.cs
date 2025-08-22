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


        [HttpGet("{id}/results")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetResultsForQuiz(int id)
        {
            var results = await _quizService.GetResultsByQuizIdAsync(id);
            return Ok(results);
            // za admina rezultati
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _quizService.DeleteQuizAsync(id);
                return Ok("Kviz je uspešno obrisan.");
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }


        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateQuizDTO dto)
        {
            try
            {
                await _quizService.UpdateQuizAsync(id, dto);
                return Ok("Kviz je uspešno izmenjen.");
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }
        [HttpPut("{id}/questions")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateQuestions(int id, [FromBody] QuizDTO dto)
        {
            try
            {
                await _quizService.UpdateQuizQuestionsAsync(id, dto);
                return Ok("Pitanja i odgovori su uspešno izmenjeni.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete("/api/question/{questionId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteQuestion(int questionId)
        {
            try
            {
                await _quizService.DeleteQuestionAsync(questionId);
                return Ok("Pitanje je uspešno obrisano.");
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("filter")]
        [Authorize] // ili [AllowAnonymous] ako želiš da svako vidi kvizove
        public async Task<IActionResult> FilterQuizzes([FromQuery] string? category, [FromQuery] string? difficulty, [FromQuery] string? search)
        {
            var result = await _quizService.FilterQuizzesAsync(category, difficulty, search);
            return Ok(result);
        }

        [HttpGet("leaderboard")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLeaderboard([FromQuery] int? quizId, [FromQuery] string? period)
        {
            var leaderboard = await _quizService.GetLeaderboardAsync(quizId, period);
            return Ok(leaderboard);
        }



        [HttpGet("{id}/details")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetQuizResultDetails(int id)
        {
            var username = User.Identity?.Name;
            if (username == null)
                return Unauthorized();

            var result = await _quizService.GetUserQuizResultAsync(id, username);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

    }
}
