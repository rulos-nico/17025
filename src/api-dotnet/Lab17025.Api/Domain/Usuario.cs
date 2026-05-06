namespace Lab17025.Api.Domain;

/// <summary>
/// Usuario del sistema (paridad parcial con tabla dbo.usuarios).
/// </summary>
public sealed class Usuario
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Apellido { get; set; }
    public string? Avatar { get; set; }
    public string Rol { get; set; } = "tecnico";
    public bool Activo { get; set; } = true;
    public string? PasswordHash { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
