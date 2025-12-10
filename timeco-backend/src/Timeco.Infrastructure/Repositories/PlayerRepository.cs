using Microsoft.EntityFrameworkCore;
using Timeco.Domain.Entities;
using Timeco.Domain.Interfaces;
using Timeco.Infrastructure.Data;

namespace Timeco.Infrastructure.Repositories;

public class PlayerRepository : Repository<Player>, IPlayerRepository
{
    public PlayerRepository(TimecoDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Player>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.Where(p => p.UserId == userId).ToListAsync();
    }
}
