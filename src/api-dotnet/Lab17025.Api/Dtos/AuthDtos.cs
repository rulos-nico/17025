using System.Text.Json.Serialization;

namespace Lab17025.Api.Dtos;

public sealed class LoginRequestDto
{
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("password")] public string Password { get; set; } = string.Empty;
}

public sealed class GoogleLoginRequestDto
{
    [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
}

public sealed class RefreshRequestDto
{
    [JsonPropertyName("refresh_token")] public string RefreshToken { get; set; } = string.Empty;
}

public sealed class LogoutRequestDto
{
    [JsonPropertyName("refresh_token")] public string? RefreshToken { get; set; }
}

public sealed class LoginResponseDto
{
    [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
    [JsonPropertyName("token_type")] public string TokenType { get; set; } = "Bearer";
    [JsonPropertyName("expires_in")] public int ExpiresIn { get; set; }
    [JsonPropertyName("refresh_token")] public string RefreshToken { get; set; } = string.Empty;
    [JsonPropertyName("refresh_expires_at")] public DateTimeOffset RefreshExpiresAt { get; set; }
    [JsonPropertyName("user")] public UserInfoDto User { get; set; } = new();
}

public sealed class UserInfoDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("nombre")] public string Nombre { get; set; } = string.Empty;
    [JsonPropertyName("apellido")] public string? Apellido { get; set; }
    [JsonPropertyName("avatar")] public string? Avatar { get; set; }
    [JsonPropertyName("rol")] public string Rol { get; set; } = "TECNICO";
}
