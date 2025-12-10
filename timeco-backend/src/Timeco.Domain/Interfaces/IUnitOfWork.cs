namespace Timeco.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    ISportRepository Sports { get; }
    IPlayerRepository Players { get; }
    IGameRepository Games { get; }
    Task<int> SaveChangesAsync();
}
