using Lab17025.Api.Auth;
using Lab17025.Api.Dtos;
using Lab17025.Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Lab17025.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IUsuarioRepository usuarios,
    IJwtTokenService jwt,
    ILogger<AuthController> logger) : ControllerBase
{
    /// <summary>
    /// POST /api/auth/login — Autenticación con email + password.
    /// </summary>
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

        var token = jwt.CreateToken(user, out var expiresIn);

        return Ok(new LoginResponseDto
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = expiresIn,
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                Nombre = user.Nombre,
                Apellido = user.Apellido,
                Rol = user.Rol
            }
        });
    }

    /// <summary>GET /api/auth/me — Info del usuario autenticado.</summary>
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<UserInfoDto>> Me(CancellationToken ct)
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(idClaim, out var id)) return Unauthorized();

        var user = await usuarios.FindByIdAsync(id, ct);
        if (user is null) return Unauthorized();

        return Ok(new UserInfoDto
        {
            Id = user.Id,
            Email = user.Email,
            Nombre = user.Nombre,
            Apellido = user.Apellido,
            Rol = user.Rol
        });
    }
}
