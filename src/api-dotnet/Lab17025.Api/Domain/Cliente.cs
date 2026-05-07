namespace Lab17025.Api.Domain;

/// <summary>
/// Entidad Cliente (paridad con src/api/src/models/cliente.rs).
/// Mapea la tabla dbo.clientes.
/// </summary>
public sealed class Cliente
{
    public Guid Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Rut { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? ContactoNombre { get; set; }
    public string? ContactoCargo { get; set; }
    public string? ContactoEmail { get; set; }
    public string? ContactoTelefono { get; set; }
    public bool Activo { get; set; } = true;
    public string? DriveFolderId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? SyncedAt { get; set; }
    public string? SyncSource { get; set; }
}
