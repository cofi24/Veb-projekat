using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VebQuiz.DTO;
using VebQuiz.Interface;

namespace VebQuiz.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class UserController:ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromForm] RegisterDTO dto)
        {
            await _userService.RegisterAsync(dto);
            return Ok("Uspešna registracija.");
        }
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            var token = await _userService.LoginAsync(dto);
            return Ok(token);
        }

        /// <summary>
        /// Endpoint za proveru da li si ulogovan kao korisnik
        /// </summary>
        [HttpGet("test-user")]
        [Authorize(Roles = "user")]
        public IActionResult TestUser()
        {
            var username = User.Identity?.Name;
            return Ok($"Zdravo korisniče {username}, uspešno si pristupio user-only endpointu.");
        }

        /// <summary>
        /// Endpoint za proveru da li si ulogovan kao admin
        /// </summary>
        [HttpGet("test-admin")]
        [Authorize(Roles = "admin")]
        public IActionResult TestAdmin()
        {
            var username = User.Identity?.Name;
            return Ok($"Zdravo admin {username}, imaš pristup admin-only delu.");
        }
    }
}
