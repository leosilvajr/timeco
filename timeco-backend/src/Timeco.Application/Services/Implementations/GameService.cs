using Timeco.Application.Common;
using Timeco.Application.DTOs.Game;
using Timeco.Application.DTOs.Player;
using Timeco.Application.DTOs.Sport;
using Timeco.Application.DTOs.Team;
using Timeco.Application.Services.Interfaces;
using Timeco.Domain.Entities;
using Timeco.Domain.Interfaces;

namespace Timeco.Application.Services.Implementations;

public class GameService : IGameService
{
    private readonly IUnitOfWork _unitOfWork;

    public GameService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<GameDto>>> GetGamesByUserAsync(Guid userId)
    {
        var games = await _unitOfWork.Games.GetByUserIdAsync(userId);
        
        var gameDtos = games.Select(MapToGameDto);

        return Result<IEnumerable<GameDto>>.Ok(gameDtos);
    }

    public async Task<Result<GameDto>> GetGameByIdAsync(Guid id, Guid userId)
    {
        var game = await _unitOfWork.Games.GetByIdWithTeamsAsync(id);
        
        if (game == null)
            return Result<GameDto>.Fail("Jogo não encontrado");

        if (game.UserId != userId)
            return Result<GameDto>.Fail("Sem permissão para visualizar este jogo");

        return Result<GameDto>.Ok(MapToGameDto(game));
    }

    public async Task<Result<GameDto>> CreateGameAsync(Guid userId, CreateGameRequest request)
    {
        var sport = await _unitOfWork.Sports.GetByIdAsync(request.SportId);
        if (sport == null)
            return Result<GameDto>.Fail("Esporte não encontrado");

        if (request.Players.Count < request.NumberOfTeams)
            return Result<GameDto>.Fail("Número de jogadores insuficiente para a quantidade de times");

        var distributedTeams = DistributePlayersToTeams(request.Players, request.NumberOfTeams);

        var game = new Game
        {
            UserId = userId,
            SportId = request.SportId,
            NumberOfTeams = request.NumberOfTeams,
            PlayedAt = DateTime.UtcNow
        };

        await _unitOfWork.Games.AddAsync(game);
        await _unitOfWork.SaveChangesAsync();

        return Result<GameDto>.Ok(new GameDto
        {
            Id = game.Id,
            Sport = new SportDto
            {
                Id = sport.Id,
                Name = sport.Name,
                Emoji = sport.Emoji,
                Gradient = sport.Gradient
            },
            NumberOfTeams = game.NumberOfTeams,
            PlayedAt = game.PlayedAt,
            Teams = distributedTeams
        }, "Jogo criado com sucesso");
    }

    public Task<Result<DistributeTeamsResponse>> DistributeTeamsAsync(DistributeTeamsRequest request)
    {
        if (request.Players.Count < request.NumberOfTeams)
            return Task.FromResult(Result<DistributeTeamsResponse>.Fail("Número de jogadores insuficiente para a quantidade de times"));

        var distributedTeams = DistributePlayersToTeams(request.Players, request.NumberOfTeams);

        return Task.FromResult(Result<DistributeTeamsResponse>.Ok(new DistributeTeamsResponse
        {
            Teams = distributedTeams
        }));
    }

    public async Task<Result<bool>> DeleteGameAsync(Guid id, Guid userId)
    {
        var game = await _unitOfWork.Games.GetByIdAsync(id);
        
        if (game == null)
            return Result<bool>.Fail("Jogo não encontrado");

        if (game.UserId != userId)
            return Result<bool>.Fail("Sem permissão para excluir este jogo");

        await _unitOfWork.Games.DeleteAsync(game);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Ok(true, "Jogo excluído com sucesso");
    }

    private static List<TeamDto> DistributePlayersToTeams(List<PlayerDto> players, int numberOfTeams)
    {
        var sortedPlayers = players.OrderByDescending(p => p.SkillLevel).ToList();
        
        var teams = new List<TeamDto>();
        for (int i = 0; i < numberOfTeams; i++)
        {
            teams.Add(new TeamDto
            {
                Id = Guid.NewGuid(),
                Name = $"Time {i + 1}",
                TeamNumber = i + 1,
                Players = new List<PlayerDto>(),
                AverageSkillLevel = 0
            });
        }

        foreach (var player in sortedPlayers)
        {
            var teamWithLowestSkill = teams.OrderBy(t => t.Players.Sum(p => p.SkillLevel)).First();
            teamWithLowestSkill.Players.Add(player);
        }

        foreach (var team in teams)
        {
            ShufflePlayers(team.Players);
            team.AverageSkillLevel = team.Players.Count > 0 
                ? (decimal)team.Players.Average(p => p.SkillLevel) 
                : 0;
        }

        return teams;
    }

    private static void ShufflePlayers(List<PlayerDto> players)
    {
        var random = new Random();
        int n = players.Count;
        while (n > 1)
        {
            n--;
            int k = random.Next(n + 1);
            (players[k], players[n]) = (players[n], players[k]);
        }
    }

    private static GameDto MapToGameDto(Game game)
    {
        return new GameDto
        {
            Id = game.Id,
            Sport = game.Sport != null ? new SportDto
            {
                Id = game.Sport.Id,
                Name = game.Sport.Name,
                Emoji = game.Sport.Emoji,
                Gradient = game.Sport.Gradient
            } : null,
            NumberOfTeams = game.NumberOfTeams,
            PlayedAt = game.PlayedAt,
            Teams = game.Teams.Select(t => new TeamDto
            {
                Id = t.Id,
                Name = t.Name,
                TeamNumber = t.TeamNumber,
                AverageSkillLevel = t.AverageSkillLevel,
                Players = t.TeamPlayers.Select(tp => new PlayerDto
                {
                    Id = tp.Player?.Id ?? Guid.Empty,
                    Name = tp.Player?.Name ?? string.Empty,
                    SkillLevel = tp.Player?.SkillLevel ?? 0
                }).ToList()
            }).ToList()
        };
    }
}
