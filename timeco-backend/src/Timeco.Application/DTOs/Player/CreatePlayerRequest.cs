namespace Timeco.Application.DTOs.Player;

public class CreatePlayerRequest
{
    public string Name { get; set; } = string.Empty;
    public int SkillLevel { get; set; }
}
