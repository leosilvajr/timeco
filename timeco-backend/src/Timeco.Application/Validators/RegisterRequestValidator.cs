using FluentValidation;
using Timeco.Application.DTOs.Auth;

namespace Timeco.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Usuário é obrigatório")
            .MinimumLength(3).WithMessage("Usuário deve ter pelo menos 3 caracteres")
            .MaximumLength(50).WithMessage("Usuário deve ter no máximo 50 caracteres");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email é obrigatório")
            .EmailAddress().WithMessage("Email inválido");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha é obrigatória")
            .MinimumLength(3).WithMessage("Senha deve ter pelo menos 3 caracteres");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("As senhas não conferem");
    }
}
