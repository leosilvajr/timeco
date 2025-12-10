using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Timeco.Domain.Entities;

namespace Timeco.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TimecoDbContext>();
        
        await context.Database.MigrateAsync();
        
        await SeedSportsAsync(context);
        await SeedAdminUserAsync(context);
    }

    private static async Task SeedSportsAsync(TimecoDbContext context)
    {
        if (await context.Sports.AnyAsync())
            return;

        var sports = new List<Sport>
        {
            new Sport
            {
                Id = Guid.NewGuid(),
                Name = "Futebol",
                Emoji = "⚽",
                Gradient = "from-green-500 to-emerald-600",
                CreatedAt = DateTime.UtcNow
            },
            new Sport
            {
                Id = Guid.NewGuid(),
                Name = "Vôlei",
                Emoji = "🏐",
                Gradient = "from-yellow-500 to-orange-500",
                CreatedAt = DateTime.UtcNow
            },
            new Sport
            {
                Id = Guid.NewGuid(),
                Name = "Basquete",
                Emoji = "🏀",
                Gradient = "from-orange-500 to-red-500",
                CreatedAt = DateTime.UtcNow
            },
            new Sport
            {
                Id = Guid.NewGuid(),
                Name = "Futsal",
                Emoji = "⚽",
                Gradient = "from-blue-500 to-cyan-500",
                CreatedAt = DateTime.UtcNow
            },
            new Sport
            {
                Id = Guid.NewGuid(),
                Name = "Handball",
                Emoji = "🤾",
                Gradient = "from-purple-500 to-pink-500",
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Sports.AddRangeAsync(sports);
        await context.SaveChangesAsync();
    }

    private static async Task SeedAdminUserAsync(TimecoDbContext context)
    {
        if (await context.Users.AnyAsync(u => u.Username == "admin"))
            return;

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            Email = "admin@timeco.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123"),
            Role = "Admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await context.Users.AddAsync(adminUser);
        await context.SaveChangesAsync();
    }
}
