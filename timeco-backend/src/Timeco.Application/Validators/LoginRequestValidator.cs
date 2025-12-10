using FluentValidation;
using Timeco.Application.DTOs.Auth;

namespace Timeco.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Usuário é obrigatório")
            .MinimumLength(3).WithMessage("Usuário deve ter pelo menos 3 caracteres");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha é obrigatória");
    }
}
