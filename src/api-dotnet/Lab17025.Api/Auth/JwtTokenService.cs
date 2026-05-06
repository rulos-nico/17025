using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Lab17025.Api.Domain;
using Microsoft.IdentityModel.Tokens;

namespace Lab17025.Api.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "lab-17025";
    public string Audience { get; set; } = "lab-17025-clients";
    public string Secret { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 480; // 8h JWT
    public int RefreshExpirationDays { get; set; } = 30; // 30d refresh
}

public sealed record IssuedTokenPair(
    string AccessToken,
    int ExpiresInSeconds,
    string RefreshToken,
    DateTimeOffset RefreshExpiresAt);

public interface IJwtTokenService
{
    string CreateToken(Usuario user, out int expiresInSeconds);

    /// <summary>
    /// Genera un refresh token opaco (256 bits base64-url). Devuelve el valor
    /// plano (entregar al cliente UNA vez) y su SHA-256 hex (a persistir).
    /// </summary>
    (string Plain, string Hash) CreateRefreshToken();

    /// <summary>SHA-256 hex en lowercase de un string (helper para validación).</summary>
    string HashRefreshToken(string plain);
}

public sealed class JwtTokenService(JwtOptions options) : IJwtTokenService
{
    public string CreateToken(Usuario user, out int expiresInSeconds)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var now = DateTime.UtcNow;
        var exp = now.AddMinutes(options.ExpirationMinutes);
        expiresInSeconds = (int)(exp - now).TotalSeconds;

        var sub = user.Id.ToString();
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, sub),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, sub),
            new(ClaimTypes.Role, user.Rol),
            new("nombre", user.Nombre),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims: claims,
            notBefore: now,
            expires: exp,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string Plain, string Hash) CreateRefreshToken()
    {
        Span<byte> buffer = stackalloc byte[32];
        RandomNumberGenerator.Fill(buffer);
        var plain = Base64UrlEncoder.Encode(buffer.ToArray());
        return (plain, HashRefreshToken(plain));
    }

    public string HashRefreshToken(string plain)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plain));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
