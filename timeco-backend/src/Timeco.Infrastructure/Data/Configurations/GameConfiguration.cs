using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Timeco.Domain.Entities;

namespace Timeco.Infrastructure.Data.Configurations;

public class GameConfiguration : IEntityTypeConfiguration<Game>
{
    public void Configure(EntityTypeBuilder<Game> builder)
    {
        builder.HasKey(g => g.Id);
        
        builder.Property(g => g.NumberOfTeams)
            .IsRequired();

        builder.HasOne(g => g.User)
            .WithMany(u => u.Games)
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(g => g.Sport)
            .WithMany(s => s.Games)
            .HasForeignKey(g => g.SportId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
