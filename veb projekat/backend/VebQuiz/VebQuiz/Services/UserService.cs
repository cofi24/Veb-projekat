using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using VebQuiz.Configurations;
using VebQuiz.DTO;
using VebQuiz.Interface;
using VebQuiz.Model;

namespace VebQuiz.Services
{
    public class UserService : IUserService

    {

        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IConfigurationSection _secretKey;

        public UserService(AppDbContext context, IMapper mapper, IConfiguration config)
        {
            _context = context;
            _mapper = mapper;
            _secretKey = config.GetSection("SecretKey");
        }

        public async Task<string> LoginAsync(LoginDTO dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username == dto.UsernameOrEmail
            || u.Email == dto.UsernameOrEmail);

            if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid credentials");

            return GenerateJwtToken(user); // tvoja metoda
        }
        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
               // new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey.Value));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "https://localhost:7178",
                //audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private bool VerifyPassword(string password, string passwordHash)
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        public async Task RegisterAsync(RegisterDTO dto)
        {
            // proveri da li korisnik već postoji
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                throw new Exception("Username already taken.");

            var user = _mapper.Map<User>(dto);
            user.PasswordHash = HashPassword(dto.Password); // ti implementiraš hash
            user.Role = "user";

            if (dto.ProfilePicture != null)
            {
                using var ms = new MemoryStream();
                await dto.ProfilePicture.CopyToAsync(ms);
                user.ProfilePictureData = ms.ToArray();
                user.ProfilePictureSize = dto.ProfilePicture.Length;
                user.ProfilePictureContentType = dto.ProfilePicture.ContentType;
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }


        public Task<string> TestAsync(string username)
        {
            throw new NotImplementedException();
        }
    }
}
