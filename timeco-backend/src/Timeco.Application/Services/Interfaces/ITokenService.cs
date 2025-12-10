using Timeco.Domain.Entities;

namespace Timeco.Application.Services.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}
