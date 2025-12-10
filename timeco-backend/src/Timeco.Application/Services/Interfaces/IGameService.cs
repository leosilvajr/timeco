using Timeco.Application.Common;
using Timeco.Application.DTOs.Game;

namespace Timeco.Application.Services.Interfaces;

public interface IGameService
{
    Task<Result<IEnumerable<GameDto>>> GetGamesByUserAsync(Guid userId);
    Task<Result<GameDto>> GetGameByIdAsync(Guid id, Guid userId);
    Task<Result<GameDto>> CreateGameAsync(Guid userId, CreateGameRequest request);
    Task<Result<DistributeTeamsResponse>> DistributeTeamsAsync(DistributeTeamsRequest request);
    Task<Result<bool>> DeleteGameAsync(Guid id, Guid userId);
}
