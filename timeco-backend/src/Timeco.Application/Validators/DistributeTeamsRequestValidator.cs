using FluentValidation;
using Timeco.Application.DTOs.Game;

namespace Timeco.Application.Validators;

public class DistributeTeamsRequestValidator : AbstractValidator<DistributeTeamsRequest>
{
    public DistributeTeamsRequestValidator()
    {
        RuleFor(x => x.SportId)
            .NotEmpty().WithMessage("Esporte é obrigatório");

        RuleFor(x => x.NumberOfTeams)
            .InclusiveBetween(2, 5).WithMessage("Número de times deve estar entre 2 e 5");

        RuleFor(x => x.Players)
            .NotEmpty().WithMessage("Lista de jogadores é obrigatória")
            .Must((request, players) => players.Count >= request.NumberOfTeams)
            .WithMessage("Número de jogadores deve ser maior ou igual ao número de times");
    }
}
