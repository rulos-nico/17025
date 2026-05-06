namespace Lab17025.Api.Auth;

/// <summary>
/// Hash de contraseñas usando BCrypt (work factor 12).
/// Reemplaza al SHA-256 placeholder del PoC en Sub-fase A.1.
/// </summary>
public static class PasswordHasher
{
    private const int WorkFactor = 12;

    public static string Hash(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public static bool Verify(string password, string hash)
    {
        if (string.IsNullOrEmpty(hash)) return false;
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Hash malformado o de otro algoritmo (p.ej. SHA-256 legacy).
            return false;
        }
    }
}
