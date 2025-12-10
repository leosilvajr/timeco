using Timeco.Domain.Interfaces;
using Timeco.Infrastructure.Data;

namespace Timeco.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly TimecoDbContext _context;
    private IUserRepository? _users;
    private ISportRepository? _sports;
    private IPlayerRepository? _players;
    private IGameRepository? _games;

    public UnitOfWork(TimecoDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => _users ??= new UserRepository(_context);
    public ISportRepository Sports => _sports ??= new SportRepository(_context);
    public IPlayerRepository Players => _players ??= new PlayerRepository(_context);
    public IGameRepository Games => _games ??= new GameRepository(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
