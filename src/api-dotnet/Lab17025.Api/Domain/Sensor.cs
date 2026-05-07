namespace Lab17025.Api.Domain;

/// <summary>
/// Entidad Sensor (paridad con src/api/src/models/sensores.rs).
/// Mapea la tabla dbo.sensores. Las columnas calibración-dependientes
/// existen en la tabla pero hoy se rellenan vacías (la calibración real
/// vendrá de la tabla `calibracion` en Ola B/C).
/// </summary>
public sealed class Sensor
{
    public Guid Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Tipo { get; set; } = "general";
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public string? RangoMedicion { get; set; }
    public string? Precision { get; set; }
    public string? Ubicacion { get; set; }
    public string Estado { get; set; } = "activo";
    public DateOnly? FechaCalibracion { get; set; }
    public DateOnly? ProximaCalibracion { get; set; }
    public decimal? ErrorMaximo { get; set; }
    public string? CertificadoId { get; set; }
    public string? Responsable { get; set; }
    public string? Observaciones { get; set; }
    public bool Activo { get; set; } = true;
    public Guid? EquipoId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? SyncedAt { get; set; }
    public string? SyncSource { get; set; }
}
