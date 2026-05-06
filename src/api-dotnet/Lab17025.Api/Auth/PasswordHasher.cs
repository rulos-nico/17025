using System.Security.Cryptography;
using System.Text;

namespace Lab17025.Api.Auth;

/// <summary>
/// Hash de contraseñas para PoC.
/// Usa SHA-256 hex sin salt (suficiente para validar el pipeline).
/// PRODUCCIÓN: reemplazar por BCrypt.Net-Next o Argon2 antes del cutover.
/// </summary>
public static class PasswordHasher
{
    public static string Hash(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static bool Verify(string password, string hash)
        => string.Equals(Hash(password), hash, StringComparison.OrdinalIgnoreCase);
}
