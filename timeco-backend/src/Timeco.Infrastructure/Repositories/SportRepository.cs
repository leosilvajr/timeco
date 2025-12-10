using Microsoft.EntityFrameworkCore;
using Timeco.Domain.Entities;
using Timeco.Domain.Interfaces;
using Timeco.Infrastructure.Data;

namespace Timeco.Infrastructure.Repositories;

public class SportRepository : Repository<Sport>, ISportRepository
{
    public SportRepository(TimecoDbContext context) : base(context)
    {
    }

    public async Task<Sport?> GetByNameAsync(string name)
    {
        return await _dbSet.FirstOrDefaultAsync(s => s.Name.ToLower() == name.ToLower());
    }
}
