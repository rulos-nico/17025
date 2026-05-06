namespace Lab17025.Api.Domain;

/// <summary>
/// Entidad Equipo (paridad con src/api/src/models/equipos.rs).
/// Mapea la tabla dbo.equipos.
/// </summary>
public sealed class Equipo
{
    public string Id { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Serie { get; set; } = string.Empty;
    public string? Placa { get; set; }
    public string? Descripcion { get; set; }
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public string? Ubicacion { get; set; }
    public string Estado { get; set; } = "disponible";
    public DateOnly? FechaCalibracion { get; set; }
    public DateOnly? ProximaCalibracion { get; set; }
    public decimal? Incertidumbre { get; set; }
    public decimal? ErrorMaximo { get; set; }
    public string? CertificadoId { get; set; }
    public string? Responsable { get; set; }
    public string? Observaciones { get; set; }
    public bool Activo { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? SyncedAt { get; set; }
    public string? SyncSource { get; set; }
}
