using Timeco.Application.Common;
using Timeco.Application.DTOs.Player;

namespace Timeco.Application.Services.Interfaces;

public interface IPlayerService
{
    Task<Result<IEnumerable<PlayerDto>>> GetPlayersByUserAsync(Guid userId);
    Task<Result<PlayerDto>> GetPlayerByIdAsync(Guid id);
    Task<Result<PlayerDto>> CreatePlayerAsync(Guid userId, CreatePlayerRequest request);
    Task<Result<PlayerDto>> UpdatePlayerAsync(Guid id, Guid userId, UpdatePlayerRequest request);
    Task<Result<bool>> DeletePlayerAsync(Guid id, Guid userId);
}
