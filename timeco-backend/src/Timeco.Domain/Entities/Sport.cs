using Timeco.Domain.Common;

namespace Timeco.Domain.Entities;

public class Sport : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string Gradient { get; set; } = string.Empty;
    
    public virtual ICollection<Game> Games { get; set; } = new List<Game>();
}
