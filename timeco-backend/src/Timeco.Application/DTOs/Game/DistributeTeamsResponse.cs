using Timeco.Application.DTOs.Team;

namespace Timeco.Application.DTOs.Game;

public class DistributeTeamsResponse
{
    public List<TeamDto> Teams { get; set; } = new();
}
