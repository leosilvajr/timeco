using Timeco.Domain.Entities;

namespace Timeco.Domain.Interfaces;

public interface IPlayerRepository : IRepository<Player>
{
    Task<IEnumerable<Player>> GetByUserIdAsync(Guid userId);
}
