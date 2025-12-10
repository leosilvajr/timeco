using FluentValidation;
using Timeco.Application.DTOs.Player;

namespace Timeco.Application.Validators;

public class CreatePlayerRequestValidator : AbstractValidator<CreatePlayerRequest>
{
    public CreatePlayerRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres");

        RuleFor(x => x.SkillLevel)
            .InclusiveBetween(0, 5).WithMessage("Nível deve estar entre 0 e 5");
    }
}
