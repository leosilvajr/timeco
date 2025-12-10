using Timeco.Application.Common;
using Timeco.Application.DTOs.Auth;

namespace Timeco.Application.Services.Interfaces;

public interface IAuthService
{
    Task<Result<LoginResponse>> LoginAsync(LoginRequest request);
    Task<Result<UserDto>> RegisterAsync(RegisterRequest request);
    Task<Result<UserDto>> GetCurrentUserAsync(Guid userId);
}
