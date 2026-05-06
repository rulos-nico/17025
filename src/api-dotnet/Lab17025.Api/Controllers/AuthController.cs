using Lab17025.Api.Auth;
using Lab17025.Api.Domain;
using Lab17025.Api.Dtos;
using Lab17025.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lab17025.Api.Controllers;

/// <summary>
/// Sub-fase A.1 — Auth híbrido:
///   POST /api/auth/login    → email + password (BCrypt) → JWT + refresh
///   POST /api/auth/google   → access_token Google → JWT + refresh
///   POST /api/auth/refresh  → rota refresh, emite nuevo JWT + refresh
///   POST /api/auth/logout   → revoca refresh token
///   GET  /api/auth/me       → usuario autenticado
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IUsuarioRepository usuarios,
    IRefreshTokenRepository refreshTokens,
    IJwtTokenService jwt,
    IGoogleTokenValidator google,
    JwtOptions jwtOptions,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login(
        [FromBody] LoginRequestDto body,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            return Problem(statusCode: 400, title: "Email y password son requeridos");

        var user = await usuarios.FindByEmailAsync(body.Email.Trim(), ct);
        if (user is null || string.IsNullOrEmpty(user.PasswordHash) ||
            !PasswordHasher.Verify(body.Password, user.PasswordHash))
        {
            logger.LogWarning("Intento de login fallido para {Email}", body.Email);
            return Problem(statusCode: 401, title: "Credenciales inválidas");
        }

        return Ok(await IssuePairAsync(user, ct));
    }

    /// <summary>
    /// POST /api/auth/google — recibe { access_token } emitido por GIS al
    /// frontend, lo valida contra Google y emite credenciales propias.
    /// Si el usuario no existe se crea con rol TECNICO por defecto.
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<LoginResponseDto>> GoogleLogin(
        [FromBody] GoogleLoginRequestDto body,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.AccessToken))
            return Problem(statusCode: 400, title: "access_token requerido");

        var info = await google.ValidateAsync(body.AccessToken, ct);
        if (info is null)
            return Problem(statusCode: 401, title: "Token Google inválido o email no verificado");

        var user = await usuarios.UpsertFromGoogleAsync(
            info.Email.Trim().ToLowerInvariant(),
            info.GivenName ?? info.Name ?? info.Email,
            info.FamilyName,
            info.Picture,
            ct);

        if (!user.Activo)
            return Problem(statusCode: 403, title: "Usuario deshabilitado");

        return Ok(await IssuePairAsync(user, ct));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponseDto>> Refresh(
        [FromBody] RefreshRequestDto body,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.RefreshToken))
            return Problem(statusCode: 400, title: "refresh_token requerido");

        var hash = jwt.HashRefreshToken(body.RefreshToken);
        var stored = await refreshTokens.FindByHashAsync(hash, ct);

        if (stored is null)
            return Problem(statusCode: 401, title: "refresh_token inválido");

        if (!stored.IsActive)
        {
            // Si fue revocado, política conservadora: revocar TODA la familia
            // del usuario (posible reuse → robo del token).
            logger.LogWarning("Reuse o token expirado del usuario {UserId}", stored.UserId);
            await refreshTokens.RevokeAllForUserAsync(stored.UserId, ct);
            return Problem(statusCode: 401, title: "refresh_token inválido");
        }

        var user = await usuarios.FindByIdAsync(stored.UserId, ct);
        if (user is null || !user.Activo)
            return Problem(statusCode: 401, title: "Usuario inválido");

        // Rota: emite nuevo par, marca el anterior como revocado y enlaza.
        var pair = await IssuePairAsync(user, ct);
        var newHash = jwt.HashRefreshToken(pair.RefreshToken);
        var newRecord = await refreshTokens.FindByHashAsync(newHash, ct);
        await refreshTokens.RevokeAsync(stored.Id, newRecord?.Id, ct);

        return Ok(pair);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(
        [FromBody] LogoutRequestDto body,
        CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(body.RefreshToken))
        {
            var hash = jwt.HashRefreshToken(body.RefreshToken);
            var stored = await refreshTokens.FindByHashAsync(hash, ct);
            if (stored is not null && stored.IsActive)
                await refreshTokens.RevokeAsync(stored.Id, null, ct);
        }
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserInfoDto>> Me(CancellationToken ct)
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(idClaim, out var id)) return Unauthorized();

        var user = await usuarios.FindByIdAsync(id, ct);
        if (user is null) return Unauthorized();

        return Ok(ToUserInfo(user));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private async Task<LoginResponseDto> IssuePairAsync(Usuario user, CancellationToken ct)
    {
        var accessToken = jwt.CreateToken(user, out var expiresIn);
        var (refreshPlain, refreshHash) = jwt.CreateRefreshToken();
        var refreshExpiresAt = DateTimeOffset.UtcNow.AddDays(jwtOptions.RefreshExpirationDays);

        await refreshTokens.InsertAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = refreshExpiresAt,
            UserAgent = Request.Headers.UserAgent.ToString() is { Length: > 0 } ua ? ua : null,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        }, ct);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            TokenType = "Bearer",
            ExpiresIn = expiresIn,
            RefreshToken = refreshPlain,
            RefreshExpiresAt = refreshExpiresAt,
            User = ToUserInfo(user)
        };
    }

    private static UserInfoDto ToUserInfo(Usuario u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        Nombre = u.Nombre,
        Apellido = u.Apellido,
        Avatar = u.Avatar,
        Rol = u.Rol
    };
}
