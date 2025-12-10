using Timeco.Application.DTOs.Player;

namespace Timeco.Application.DTOs.Game;

public class DistributeTeamsRequest
{
    public Guid SportId { get; set; }
    public int NumberOfTeams { get; set; }
    public List<PlayerDto> Players { get; set; } = new();
}
