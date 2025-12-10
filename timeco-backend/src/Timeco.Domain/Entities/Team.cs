using Timeco.Domain.Common;

namespace Timeco.Domain.Entities;

public class Team : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int TeamNumber { get; set; }
    public decimal AverageSkillLevel { get; set; }
    public Guid GameId { get; set; }
    
    public virtual Game? Game { get; set; }
    public virtual ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
}
