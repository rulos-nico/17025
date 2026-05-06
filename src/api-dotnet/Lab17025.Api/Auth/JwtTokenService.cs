using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Lab17025.Api.Domain;
using Microsoft.IdentityModel.Tokens;

namespace Lab17025.Api.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "lab-17025";
    public string Audience { get; set; } = "lab-17025-clients";
    public string Secret { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 480; // 8h
}

public interface IJwtTokenService
{
    string CreateToken(Usuario user, out int expiresInSeconds);
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

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id),
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
}
