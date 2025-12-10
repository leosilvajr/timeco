using Timeco.Domain.Common;

namespace Timeco.Domain.Entities;

public class Game : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid SportId { get; set; }
    public int NumberOfTeams { get; set; }
    public DateTime PlayedAt { get; set; }
    
    public virtual User? User { get; set; }
    public virtual Sport? Sport { get; set; }
    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
