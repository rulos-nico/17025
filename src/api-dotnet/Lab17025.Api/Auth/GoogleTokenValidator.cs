using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Lab17025.Api.Auth;

/// <summary>
/// Información del usuario devuelta por Google para un access_token válido.
/// Paridad con la respuesta de https://www.googleapis.com/oauth2/v2/userinfo
/// (mismo endpoint que usaba el backend Rust legacy).
/// </summary>
public sealed class GoogleUserInfo
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("verified_email")] public bool VerifiedEmail { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("given_name")] public string? GivenName { get; set; }
    [JsonPropertyName("family_name")] public string? FamilyName { get; set; }
    [JsonPropertyName("picture")] public string? Picture { get; set; }
}

public interface IGoogleTokenValidator
{
    /// <summary>
    /// Valida un access_token de Google contra el endpoint userinfo. Devuelve
    /// null si el token es inválido / la cuenta no tiene email verificado.
    /// </summary>
    Task<GoogleUserInfo?> ValidateAsync(string accessToken, CancellationToken ct = default);
}

public sealed class GoogleTokenValidator(
    IHttpClientFactory httpFactory,
    ILogger<GoogleTokenValidator> logger) : IGoogleTokenValidator
{
    public const string HttpClientName = "google-oauth";
    private const string UserInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

    public async Task<GoogleUserInfo?> ValidateAsync(string accessToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(accessToken)) return null;

        var client = httpFactory.CreateClient(HttpClientName);
        using var req = new HttpRequestMessage(HttpMethod.Get, UserInfoUrl);
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        try
        {
            using var res = await client.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                logger.LogWarning("Google userinfo respondió {Status}", res.StatusCode);
                return null;
            }

            var info = await res.Content.ReadFromJsonAsync<GoogleUserInfo>(cancellationToken: ct);
            if (info is null || string.IsNullOrWhiteSpace(info.Email))
            {
                logger.LogWarning("Google userinfo devolvió cuerpo inválido");
                return null;
            }

            if (!info.VerifiedEmail)
            {
                logger.LogWarning("Email Google {Email} no verificado", info.Email);
                return null;
            }

            return info;
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "Fallo HTTP validando access_token Google");
            return null;
        }
    }
}
