namespace VebQuiz.DTO
{
    public class LeaderboardEntryDTO
    {
        public int UserId { get; set; }               
        public string Username { get; set; }
        public int TotalScore { get; set; }
        public DateTime AchievedAt { get; set; }
        public string? ProfilePictureDataUrl { get; set; } = string.Empty;
    }
}
