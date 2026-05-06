using System.Text.Json.Serialization;

namespace Lab17025.Api.Dtos;

/// <summary>
/// Representación serializable de Equipo (paridad con CRUD JSON del API Rust).
/// Se serializa en snake_case para mantener el contrato actual del frontend.
/// </summary>
public sealed class EquipoDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("codigo")] public string Codigo { get; set; } = string.Empty;
    [JsonPropertyName("nombre")] public string Nombre { get; set; } = string.Empty;
    [JsonPropertyName("serie")] public string Serie { get; set; } = string.Empty;
    [JsonPropertyName("placa")] public string? Placa { get; set; }
    [JsonPropertyName("descripcion")] public string? Descripcion { get; set; }
    [JsonPropertyName("marca")] public string? Marca { get; set; }
    [JsonPropertyName("modelo")] public string? Modelo { get; set; }
    [JsonPropertyName("ubicacion")] public string? Ubicacion { get; set; }
    [JsonPropertyName("estado")] public string Estado { get; set; } = "disponible";
    [JsonPropertyName("fecha_calibracion")] public string? FechaCalibracion { get; set; }
    [JsonPropertyName("proxima_calibracion")] public string? ProximaCalibracion { get; set; }
    [JsonPropertyName("incertidumbre")] public decimal? Incertidumbre { get; set; }
    [JsonPropertyName("error_maximo")] public decimal? ErrorMaximo { get; set; }
    [JsonPropertyName("certificado_id")] public string? CertificadoId { get; set; }
    [JsonPropertyName("responsable")] public string? Responsable { get; set; }
    [JsonPropertyName("observaciones")] public string? Observaciones { get; set; }
    [JsonPropertyName("activo")] public bool Activo { get; set; } = true;
    [JsonPropertyName("created_at")] public string CreatedAt { get; set; } = string.Empty;
    [JsonPropertyName("updated_at")] public string UpdatedAt { get; set; } = string.Empty;

    /// <summary>Sensores asociados (vacío en PoC). Se rellena en fase 2.</summary>
    [JsonPropertyName("sensores_asociados")]
    public IReadOnlyList<object> SensoresAsociados { get; set; } = Array.Empty<object>();
}

public sealed class CreateEquipoDto
{
    [JsonPropertyName("nombre")] public string Nombre { get; set; } = string.Empty;
    [JsonPropertyName("serie")] public string Serie { get; set; } = string.Empty;
    [JsonPropertyName("placa")] public string? Placa { get; set; }
    [JsonPropertyName("descripcion")] public string? Descripcion { get; set; }
    [JsonPropertyName("marca")] public string? Marca { get; set; }
    [JsonPropertyName("modelo")] public string? Modelo { get; set; }
    [JsonPropertyName("ubicacion")] public string? Ubicacion { get; set; }
}

public sealed class UpdateEquipoDto
{
    [JsonPropertyName("nombre")] public string? Nombre { get; set; }
    [JsonPropertyName("descripcion")] public string? Descripcion { get; set; }
    [JsonPropertyName("ubicacion")] public string? Ubicacion { get; set; }
    [JsonPropertyName("estado")] public string? Estado { get; set; }
    [JsonPropertyName("fecha_calibracion")] public string? FechaCalibracion { get; set; }
    [JsonPropertyName("proxima_calibracion")] public string? ProximaCalibracion { get; set; }
    [JsonPropertyName("incertidumbre")] public decimal? Incertidumbre { get; set; }
    [JsonPropertyName("error_maximo")] public decimal? ErrorMaximo { get; set; }
    [JsonPropertyName("certificado_id")] public string? CertificadoId { get; set; }
    [JsonPropertyName("responsable")] public string? Responsable { get; set; }
    [JsonPropertyName("observaciones")] public string? Observaciones { get; set; }
    [JsonPropertyName("activo")] public bool? Activo { get; set; }
}

public static class EquipoMapper
{
    public static EquipoDto ToDto(this Domain.Equipo e) => new()
    {
        Id = e.Id,
        Codigo = e.Codigo,
        Nombre = e.Nombre,
        Serie = e.Serie,
        Placa = e.Placa,
        Descripcion = e.Descripcion,
        Marca = e.Marca,
        Modelo = e.Modelo,
        Ubicacion = e.Ubicacion,
        Estado = e.Estado,
        FechaCalibracion = e.FechaCalibracion?.ToString("yyyy-MM-dd"),
        ProximaCalibracion = e.ProximaCalibracion?.ToString("yyyy-MM-dd"),
        Incertidumbre = e.Incertidumbre,
        ErrorMaximo = e.ErrorMaximo,
        CertificadoId = e.CertificadoId,
        Responsable = e.Responsable,
        Observaciones = e.Observaciones,
        Activo = e.Activo,
        CreatedAt = e.CreatedAt.ToString("o"),
        UpdatedAt = e.UpdatedAt.ToString("o"),
        SensoresAsociados = Array.Empty<object>()
    };
}
