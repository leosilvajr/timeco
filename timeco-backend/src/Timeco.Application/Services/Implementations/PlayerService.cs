using Timeco.Application.Common;
using Timeco.Application.DTOs.Player;
using Timeco.Application.Services.Interfaces;
using Timeco.Domain.Entities;
using Timeco.Domain.Interfaces;

namespace Timeco.Application.Services.Implementations;

public class PlayerService : IPlayerService
{
    private readonly IUnitOfWork _unitOfWork;

    public PlayerService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<PlayerDto>>> GetPlayersByUserAsync(Guid userId)
    {
        var players = await _unitOfWork.Players.GetByUserIdAsync(userId);
        
        var playerDtos = players.Select(p => new PlayerDto
        {
            Id = p.Id,
            Name = p.Name,
            SkillLevel = p.SkillLevel
        });

        return Result<IEnumerable<PlayerDto>>.Ok(playerDtos);
    }

    public async Task<Result<PlayerDto>> GetPlayerByIdAsync(Guid id)
    {
        var player = await _unitOfWork.Players.GetByIdAsync(id);
        
        if (player == null)
            return Result<PlayerDto>.Fail("Jogador não encontrado");

        return Result<PlayerDto>.Ok(new PlayerDto
        {
            Id = player.Id,
            Name = player.Name,
            SkillLevel = player.SkillLevel
        });
    }

    public async Task<Result<PlayerDto>> CreatePlayerAsync(Guid userId, CreatePlayerRequest request)
    {
        var player = new Player
        {
            Name = request.Name,
            SkillLevel = request.SkillLevel,
            UserId = userId
        };

        await _unitOfWork.Players.AddAsync(player);
        await _unitOfWork.SaveChangesAsync();

        return Result<PlayerDto>.Ok(new PlayerDto
        {
            Id = player.Id,
            Name = player.Name,
            SkillLevel = player.SkillLevel
        }, "Jogador criado com sucesso");
    }

    public async Task<Result<PlayerDto>> UpdatePlayerAsync(Guid id, Guid userId, UpdatePlayerRequest request)
    {
        var player = await _unitOfWork.Players.GetByIdAsync(id);
        
        if (player == null)
            return Result<PlayerDto>.Fail("Jogador não encontrado");

        if (player.UserId != userId)
            return Result<PlayerDto>.Fail("Sem permissão para editar este jogador");

        player.Name = request.Name;
        player.SkillLevel = request.SkillLevel;

        await _unitOfWork.Players.UpdateAsync(player);
        await _unitOfWork.SaveChangesAsync();

        return Result<PlayerDto>.Ok(new PlayerDto
        {
            Id = player.Id,
            Name = player.Name,
            SkillLevel = player.SkillLevel
        }, "Jogador atualizado com sucesso");
    }

    public async Task<Result<bool>> DeletePlayerAsync(Guid id, Guid userId)
    {
        var player = await _unitOfWork.Players.GetByIdAsync(id);
        
        if (player == null)
            return Result<bool>.Fail("Jogador não encontrado");

        if (player.UserId != userId)
            return Result<bool>.Fail("Sem permissão para excluir este jogador");

        await _unitOfWork.Players.DeleteAsync(player);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Ok(true, "Jogador excluído com sucesso");
    }
}
