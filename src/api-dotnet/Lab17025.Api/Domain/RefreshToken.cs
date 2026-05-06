namespace Lab17025.Api.Domain;

/// <summary>
/// Token de refresco emitido al cliente. El valor plano se entrega una vez y
/// nunca se persiste; en BD solo guardamos el SHA-256 hex.
/// </summary>
public sealed class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public Guid? ReplacedBy { get; set; }
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public bool IsActive =>
        RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;
}
