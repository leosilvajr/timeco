using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Timeco.Domain.Entities;

namespace Timeco.Infrastructure.Data.Configurations;

public class SportConfiguration : IEntityTypeConfiguration<Sport>
{
    public void Configure(EntityTypeBuilder<Sport> builder)
    {
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.Property(s => s.Emoji)
            .HasMaxLength(10);
            
        builder.Property(s => s.Gradient)
            .HasMaxLength(200);

        builder.HasIndex(s => s.Name).IsUnique();
    }
}
