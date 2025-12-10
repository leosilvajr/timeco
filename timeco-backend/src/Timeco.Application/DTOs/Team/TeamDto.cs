using Timeco.Application.DTOs.Player;

namespace Timeco.Application.DTOs.Team;

public class TeamDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TeamNumber { get; set; }
    public decimal AverageSkillLevel { get; set; }
    public List<PlayerDto> Players { get; set; } = new();
}
