using Timeco.Application.Common;
using Timeco.Application.DTOs.Auth;
using Timeco.Application.Services.Interfaces;
using Timeco.Domain.Entities;
using Timeco.Domain.Interfaces;

namespace Timeco.Application.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;

    public AuthService(IUnitOfWork unitOfWork, ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
    }

    public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _unitOfWork.Users.GetByUsernameAsync(request.Username);
        
        if (user == null)
            return Result<LoginResponse>.Fail("Usuário ou senha inválidos");

        if (!user.IsActive)
            return Result<LoginResponse>.Fail("Usuário inativo");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<LoginResponse>.Fail("Usuário ou senha inválidos");

        var token = _tokenService.GenerateToken(user);

        return Result<LoginResponse>.Ok(new LoginResponse
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        });
    }

    public async Task<Result<UserDto>> RegisterAsync(RegisterRequest request)
    {
        if (await _unitOfWork.Users.UsernameExistsAsync(request.Username))
            return Result<UserDto>.Fail("Nome de usuário já existe");

        if (await _unitOfWork.Users.EmailExistsAsync(request.Email))
            return Result<UserDto>.Fail("Email já cadastrado");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "User",
            IsActive = true
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return Result<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        }, "Usuário criado com sucesso");
    }

    public async Task<Result<UserDto>> GetCurrentUserAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null)
            return Result<UserDto>.Fail("Usuário não encontrado");

        return Result<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }
}
