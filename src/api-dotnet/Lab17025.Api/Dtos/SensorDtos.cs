using System.Text.Json.Serialization;

namespace Lab17025.Api.Dtos;

public sealed class SensorDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("codigo")] public string Codigo { get; set; } = string.Empty;
    [JsonPropertyName("tipo")] public string Tipo { get; set; } = "general";
    [JsonPropertyName("marca")] public string? Marca { get; set; }
    [JsonPropertyName("modelo")] public string? Modelo { get; set; }
    [JsonPropertyName("numero_serie")] public string NumeroSerie { get; set; } = string.Empty;
    [JsonPropertyName("rango_medicion")] public string? RangoMedicion { get; set; }
    [JsonPropertyName("precision")] public string? Precision { get; set; }
    [JsonPropertyName("ubicacion")] public string? Ubicacion { get; set; }
    [JsonPropertyName("estado")] public string Estado { get; set; } = "activo";
    [JsonPropertyName("fecha_calibracion")] public string? FechaCalibracion { get; set; }
    [JsonPropertyName("proxima_calibracion")] public string? ProximaCalibracion { get; set; }
    [JsonPropertyName("error_maximo")] public string? ErrorMaximo { get; set; }
    [JsonPropertyName("certificado_id")] public string? CertificadoId { get; set; }
    [JsonPropertyName("responsable")] public string? Responsable { get; set; }
    [JsonPropertyName("observaciones")] public string? Observaciones { get; set; }
    [JsonPropertyName("activo")] public bool Activo { get; set; } = true;
    [JsonPropertyName("equipo_id")] public Guid? EquipoId { get; set; }
    [JsonPropertyName("created_at")] public string CreatedAt { get; set; } = string.Empty;
    [JsonPropertyName("updated_at")] public string UpdatedAt { get; set; } = string.Empty;
}

public sealed class CreateSensorDto
{
    [JsonPropertyName("tipo")] public string Tipo { get; set; } = "general";
    [JsonPropertyName("marca")] public string? Marca { get; set; }
    [JsonPropertyName("modelo")] public string? Modelo { get; set; }
    [JsonPropertyName("numero_serie")] public string NumeroSerie { get; set; } = string.Empty;
    [JsonPropertyName("ubicacion")] public string? Ubicacion { get; set; }
    [JsonPropertyName("equipo_id")] public Guid? EquipoId { get; set; }
}

public sealed class UpdateSensorDto
{
    [JsonPropertyName("tipo")] public string? Tipo { get; set; }
    [JsonPropertyName("marca")] public string? Marca { get; set; }
    [JsonPropertyName("modelo")] public string? Modelo { get; set; }
    [JsonPropertyName("ubicacion")] public string? Ubicacion { get; set; }
    [JsonPropertyName("estado")] public string? Estado { get; set; }
    [JsonPropertyName("responsable")] public string? Responsable { get; set; }
    [JsonPropertyName("observaciones")] public string? Observaciones { get; set; }
    [JsonPropertyName("activo")] public bool? Activo { get; set; }
    [JsonPropertyName("equipo_id")] public Guid? EquipoId { get; set; }
}

public static class SensorMapper
{
    public static SensorDto ToDto(this Domain.Sensor s) => new()
    {
        Id = s.Id,
        Codigo = s.Codigo,
        Tipo = s.Tipo,
        Marca = s.Marca,
        Modelo = s.Modelo,
        NumeroSerie = s.NumeroSerie,
        RangoMedicion = s.RangoMedicion,
        Precision = s.Precision,
        Ubicacion = s.Ubicacion,
        Estado = s.Estado,
        FechaCalibracion = s.FechaCalibracion?.ToString("yyyy-MM-dd"),
        ProximaCalibracion = s.ProximaCalibracion?.ToString("yyyy-MM-dd"),
        ErrorMaximo = s.ErrorMaximo?.ToString("0.######", System.Globalization.CultureInfo.InvariantCulture),
        CertificadoId = s.CertificadoId,
        Responsable = s.Responsable,
        Observaciones = s.Observaciones,
        Activo = s.Activo,
        EquipoId = s.EquipoId,
        CreatedAt = s.CreatedAt.ToString("o"),
        UpdatedAt = s.UpdatedAt.ToString("o"),
    };
}
