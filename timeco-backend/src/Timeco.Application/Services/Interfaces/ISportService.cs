using Timeco.Application.Common;
using Timeco.Application.DTOs.Sport;

namespace Timeco.Application.Services.Interfaces;

public interface ISportService
{
    Task<Result<IEnumerable<SportDto>>> GetAllSportsAsync();
    Task<Result<SportDto>> GetSportByIdAsync(Guid id);
}
