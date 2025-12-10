using Microsoft.EntityFrameworkCore;
using Timeco.Domain.Entities;
using Timeco.Domain.Interfaces;
using Timeco.Infrastructure.Data;

namespace Timeco.Infrastructure.Repositories;

public class GameRepository : Repository<Game>, IGameRepository
{
    public GameRepository(TimecoDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Game>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Include(g => g.Sport)
            .Include(g => g.Teams)
                .ThenInclude(t => t.TeamPlayers)
                    .ThenInclude(tp => tp.Player)
            .Where(g => g.UserId == userId)
            .OrderByDescending(g => g.PlayedAt)
            .ToListAsync();
    }

    public async Task<Game?> GetByIdWithTeamsAsync(Guid id)
    {
        return await _dbSet
            .Include(g => g.Sport)
            .Include(g => g.Teams)
                .ThenInclude(t => t.TeamPlayers)
                    .ThenInclude(tp => tp.Player)
            .FirstOrDefaultAsync(g => g.Id == id);
    }
}
