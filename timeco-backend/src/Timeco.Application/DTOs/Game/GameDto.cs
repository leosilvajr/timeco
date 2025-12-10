using Timeco.Application.DTOs.Sport;
using Timeco.Application.DTOs.Team;

namespace Timeco.Application.DTOs.Game;

public class GameDto
{
    public Guid Id { get; set; }
    public SportDto? Sport { get; set; }
    public int NumberOfTeams { get; set; }
    public DateTime PlayedAt { get; set; }
    public List<TeamDto> Teams { get; set; } = new();
}
