using Lab17025.Api.Auth;
using Lab17025.Api.Repositories;

namespace Lab17025.Api.Bootstrap;

/// <summary>
/// Garantiza que el usuario demo PoC tenga un hash BCrypt válido y rol ADMIN.
/// Se ejecuta una sola vez al arrancar (post-migraciones). Idempotente:
///   * Si el hash actual es BCrypt válido para "demo1234" → no toca BD.
///   * Si está vacío o es legacy SHA-256 → reescribe con BCrypt + rol ADMIN.
/// Esto evita hardcodear un BCrypt (no determinista) en SQL.
/// </summary>
public static class DemoSeeder
{
    private const string DemoEmail = "demo@ingetec.cl";
    private const string DemoPassword = "demo1234";
    private const string DemoRol = "ADMIN";

    public static async Task EnsureAsync(IServiceProvider services, ILogger logger, CancellationToken ct = default)
    {
        var usuarios = services.GetRequiredService<IUsuarioRepository>();
        var user = await usuarios.FindByEmailAsync(DemoEmail, ct);
        if (user is null)
        {
            logger.LogWarning("Usuario demo {Email} no existe; saltando seeder", DemoEmail);
            return;
        }

        var hashOk = !string.IsNullOrEmpty(user.PasswordHash)
                     && user.PasswordHash.StartsWith("$2", StringComparison.Ordinal)
                     && PasswordHasher.Verify(DemoPassword, user.PasswordHash);
        var rolOk = string.Equals(user.Rol, DemoRol, StringComparison.Ordinal);

        if (hashOk && rolOk)
        {
            logger.LogInformation("Usuario demo OK (BCrypt + rol {Rol})", user.Rol);
            return;
        }

        var newHash = PasswordHasher.Hash(DemoPassword);
        await usuarios.UpdatePasswordHashAsync(user.Id, newHash, DemoRol, ct);
        logger.LogInformation("Usuario demo actualizado a BCrypt + rol {Rol}", DemoRol);
    }
}
