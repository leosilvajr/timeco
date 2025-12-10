using Timeco.Domain.Common;

namespace Timeco.Domain.Entities;

public class TeamPlayer : BaseEntity
{
    public Guid TeamId { get; set; }
    public Guid PlayerId { get; set; }
    
    public virtual Team? Team { get; set; }
    public virtual Player? Player { get; set; }
}
