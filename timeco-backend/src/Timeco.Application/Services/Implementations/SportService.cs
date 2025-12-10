using Timeco.Application.Common;
using Timeco.Application.DTOs.Sport;
using Timeco.Application.Services.Interfaces;
using Timeco.Domain.Interfaces;

namespace Timeco.Application.Services.Implementations;

public class SportService : ISportService
{
    private readonly IUnitOfWork _unitOfWork;

    public SportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<SportDto>>> GetAllSportsAsync()
    {
        var sports = await _unitOfWork.Sports.GetAllAsync();
        
        var sportDtos = sports.Select(s => new SportDto
        {
            Id = s.Id,
            Name = s.Name,
            Emoji = s.Emoji,
            Gradient = s.Gradient
        });

        return Result<IEnumerable<SportDto>>.Ok(sportDtos);
    }

    public async Task<Result<SportDto>> GetSportByIdAsync(Guid id)
    {
        var sport = await _unitOfWork.Sports.GetByIdAsync(id);
        
        if (sport == null)
            return Result<SportDto>.Fail("Esporte não encontrado");

        return Result<SportDto>.Ok(new SportDto
        {
            Id = sport.Id,
            Name = sport.Name,
            Emoji = sport.Emoji,
            Gradient = sport.Gradient
        });
    }
}
