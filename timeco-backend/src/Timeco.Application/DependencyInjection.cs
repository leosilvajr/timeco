using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Timeco.Application.Services.Implementations;
using Timeco.Application.Services.Interfaces;

namespace Timeco.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ISportService, SportService>();
        services.AddScoped<IPlayerService, PlayerService>();
        services.AddScoped<IGameService, GameService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
