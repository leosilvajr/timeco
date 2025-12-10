using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Timeco.Domain.Entities;

namespace Timeco.Infrastructure.Data.Configurations;

public class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.HasKey(t => t.Id);
        
        builder.Property(t => t.Name)
            .HasMaxLength(50);
            
        builder.Property(t => t.AverageSkillLevel)
            .HasPrecision(5, 2);

        builder.HasOne(t => t.Game)
            .WithMany(g => g.Teams)
            .HasForeignKey(t => t.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
