using System.Text.Json.Serialization;

namespace Lab17025.Api.Dtos;

public sealed class ClienteDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("codigo")] public string Codigo { get; set; } = string.Empty;
    [JsonPropertyName("nombre")] public string Nombre { get; set; } = string.Empty;
    [JsonPropertyName("rut")] public string? Rut { get; set; }
    [JsonPropertyName("direccion")] public string? Direccion { get; set; }
    [JsonPropertyName("ciudad")] public string? Ciudad { get; set; }
    [JsonPropertyName("telefono")] public string? Telefono { get; set; }
    [JsonPropertyName("email")] public string? Email { get; set; }
    [JsonPropertyName("contacto_nombre")] public string? ContactoNombre { get; set; }
    [JsonPropertyName("contacto_cargo")] public string? ContactoCargo { get; set; }
    [JsonPropertyName("contacto_email")] public string? ContactoEmail { get; set; }
    [JsonPropertyName("contacto_telefono")] public string? ContactoTelefono { get; set; }
    [JsonPropertyName("activo")] public bool Activo { get; set; } = true;
    [JsonPropertyName("drive_folder_id")] public string? DriveFolderId { get; set; }
    [JsonPropertyName("created_at")] public string CreatedAt { get; set; } = string.Empty;
    [JsonPropertyName("updated_at")] public string UpdatedAt { get; set; } = string.Empty;
}

public sealed class CreateClienteDto
{
    [JsonPropertyName("nombre")] public string Nombre { get; set; } = string.Empty;
    [JsonPropertyName("rut")] public string? Rut { get; set; }
    [JsonPropertyName("direccion")] public string? Direccion { get; set; }
    [JsonPropertyName("ciudad")] public string? Ciudad { get; set; }
    [JsonPropertyName("telefono")] public string? Telefono { get; set; }
    [JsonPropertyName("email")] public string? Email { get; set; }
    [JsonPropertyName("contacto_nombre")] public string? ContactoNombre { get; set; }
    [JsonPropertyName("contacto_cargo")] public string? ContactoCargo { get; set; }
    [JsonPropertyName("contacto_email")] public string? ContactoEmail { get; set; }
    [JsonPropertyName("contacto_telefono")] public string? ContactoTelefono { get; set; }
}

public sealed class UpdateClienteDto
{
    [JsonPropertyName("nombre")] public string? Nombre { get; set; }
    [JsonPropertyName("rut")] public string? Rut { get; set; }
    [JsonPropertyName("direccion")] public string? Direccion { get; set; }
    [JsonPropertyName("ciudad")] public string? Ciudad { get; set; }
    [JsonPropertyName("telefono")] public string? Telefono { get; set; }
    [JsonPropertyName("email")] public string? Email { get; set; }
    [JsonPropertyName("contacto_nombre")] public string? ContactoNombre { get; set; }
    [JsonPropertyName("contacto_cargo")] public string? ContactoCargo { get; set; }
    [JsonPropertyName("contacto_email")] public string? ContactoEmail { get; set; }
    [JsonPropertyName("contacto_telefono")] public string? ContactoTelefono { get; set; }
    [JsonPropertyName("activo")] public bool? Activo { get; set; }
}

public static class ClienteMapper
{
    public static ClienteDto ToDto(this Domain.Cliente c) => new()
    {
        Id = c.Id,
        Codigo = c.Codigo,
        Nombre = c.Nombre,
        Rut = c.Rut,
        Direccion = c.Direccion,
        Ciudad = c.Ciudad,
        Telefono = c.Telefono,
        Email = c.Email,
        ContactoNombre = c.ContactoNombre,
        ContactoCargo = c.ContactoCargo,
        ContactoEmail = c.ContactoEmail,
        ContactoTelefono = c.ContactoTelefono,
        Activo = c.Activo,
        DriveFolderId = c.DriveFolderId,
        CreatedAt = c.CreatedAt.ToString("o"),
        UpdatedAt = c.UpdatedAt.ToString("o"),
    };
}
