using Timeco.Domain.Common;

namespace Timeco.Domain.Entities;

public class Player : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int SkillLevel { get; set; }
    public Guid UserId { get; set; }
    
    public virtual User? User { get; set; }
    public virtual ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
}
