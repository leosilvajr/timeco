using Timeco.Domain.Entities;

namespace Timeco.Domain.Interfaces;

public interface IGameRepository : IRepository<Game>
{
    Task<IEnumerable<Game>> GetByUserIdAsync(Guid userId);
    Task<Game?> GetByIdWithTeamsAsync(Guid id);
}
