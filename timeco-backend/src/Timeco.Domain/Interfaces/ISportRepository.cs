using Timeco.Domain.Entities;

namespace Timeco.Domain.Interfaces;

public interface ISportRepository : IRepository<Sport>
{
    Task<Sport?> GetByNameAsync(string name);
}
