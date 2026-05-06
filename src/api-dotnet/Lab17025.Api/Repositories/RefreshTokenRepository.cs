using Dapper;
using Lab17025.Api.Domain;

namespace Lab17025.Api.Repositories;

public interface IRefreshTokenRepository
{
    Task InsertAsync(RefreshToken token, CancellationToken ct = default);
    Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken ct = default);
    Task RevokeAsync(Guid id, Guid? replacedBy, CancellationToken ct = default);
    Task RevokeAllForUserAsync(Guid userId, CancellationToken ct = default);
}

public sealed class RefreshTokenRepository(ISqlConnectionFactory factory) : IRefreshTokenRepository
{
    private const string Columns = """
        id, user_id, token_hash, expires_at, revoked_at, replaced_by,
        user_agent, ip_address, created_at
        """;

    public async Task InsertAsync(RefreshToken token, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        const string sql = """
            INSERT INTO dbo.refresh_tokens
                (id, user_id, token_hash, expires_at, user_agent, ip_address)
            VALUES
                (@Id, @UserId, @TokenHash, @ExpiresAt, @UserAgent, @IpAddress);
            """;
        await conn.ExecuteAsync(new CommandDefinition(sql, token, cancellationToken: ct));
    }

    public async Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        return await conn.QuerySingleOrDefaultAsync<RefreshToken>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.refresh_tokens WHERE token_hash = @tokenHash",
            new { tokenHash },
            cancellationToken: ct));
    }

    public async Task RevokeAsync(Guid id, Guid? replacedBy, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        const string sql = """
            UPDATE dbo.refresh_tokens
               SET revoked_at = SYSUTCDATETIME(),
                   replaced_by = @replacedBy
             WHERE id = @id AND revoked_at IS NULL;
            """;
        await conn.ExecuteAsync(new CommandDefinition(sql, new { id, replacedBy }, cancellationToken: ct));
    }

    public async Task RevokeAllForUserAsync(Guid userId, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        const string sql = """
            UPDATE dbo.refresh_tokens
               SET revoked_at = SYSUTCDATETIME()
             WHERE user_id = @userId AND revoked_at IS NULL;
            """;
        await conn.ExecuteAsync(new CommandDefinition(sql, new { userId }, cancellationToken: ct));
    }
}
