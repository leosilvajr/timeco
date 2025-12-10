using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Timeco.Domain.Entities;

namespace Timeco.Infrastructure.Data.Configurations;

public class TeamPlayerConfiguration : IEntityTypeConfiguration<TeamPlayer>
{
    public void Configure(EntityTypeBuilder<TeamPlayer> builder)
    {
        builder.HasKey(tp => tp.Id);

        builder.HasOne(tp => tp.Team)
            .WithMany(t => t.TeamPlayers)
            .HasForeignKey(tp => tp.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(tp => tp.Player)
            .WithMany(p => p.TeamPlayers)
            .HasForeignKey(tp => tp.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(tp => new { tp.TeamId, tp.PlayerId }).IsUnique();
    }
}
