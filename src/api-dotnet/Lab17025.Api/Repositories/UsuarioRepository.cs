using Dapper;
using Lab17025.Api.Domain;

namespace Lab17025.Api.Repositories;

public interface IUsuarioRepository
{
    Task<Usuario?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<Usuario?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<Usuario> UpsertFromGoogleAsync(
        string email, string nombre, string? apellido, string? avatar,
        CancellationToken ct = default);
    Task UpdatePasswordHashAsync(Guid id, string passwordHash, string? rol, CancellationToken ct = default);
}

public sealed class UsuarioRepository(ISqlConnectionFactory factory) : IUsuarioRepository
{
    private const string Columns = """
        id, email, nombre, apellido, avatar, rol, activo, password_hash,
        created_at, updated_at
        """;

    public async Task<Usuario?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        return await conn.QuerySingleOrDefaultAsync<Usuario>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.usuarios WHERE email = @email AND activo = 1",
            new { email },
            cancellationToken: ct));
    }

    public async Task<Usuario?> FindByIdAsync(Guid id, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        return await conn.QuerySingleOrDefaultAsync<Usuario>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.usuarios WHERE id = @id",
            new { id },
            cancellationToken: ct));
    }

    /// <summary>
    /// Inserta o actualiza un usuario tras login con Google. La política es:
    ///   * si existe por email: refresca nombre/apellido/avatar (no toca rol/activo).
    ///   * si no existe: crea con rol 'TECNICO' por defecto.
    /// Retorna el registro resultante.
    /// </summary>
    public async Task<Usuario> UpsertFromGoogleAsync(
        string email, string nombre, string? apellido, string? avatar,
        CancellationToken ct = default)
    {
        using var conn = factory.Create();
        const string sql = $"""
            MERGE dbo.usuarios AS target
            USING (VALUES (@email, @nombre, @apellido, @avatar)) AS src(email, nombre, apellido, avatar)
               ON target.email = src.email
            WHEN MATCHED THEN
                UPDATE SET nombre = src.nombre,
                           apellido = COALESCE(src.apellido, target.apellido),
                           avatar = COALESCE(src.avatar, target.avatar),
                           updated_at = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (email, nombre, apellido, avatar, rol, activo)
                VALUES (src.email, src.nombre, src.apellido, src.avatar, 'TECNICO', 1);

            SELECT {Columns} FROM dbo.usuarios WHERE email = @email;
            """;
        return await conn.QuerySingleAsync<Usuario>(new CommandDefinition(
            sql,
            new { email, nombre, apellido, avatar },
            cancellationToken: ct));
    }

    public async Task UpdatePasswordHashAsync(Guid id, string passwordHash, string? rol, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        const string sql = """
            UPDATE dbo.usuarios
               SET password_hash = @passwordHash,
                   rol = COALESCE(@rol, rol),
                   updated_at = SYSUTCDATETIME()
             WHERE id = @id;
            """;
        await conn.ExecuteAsync(new CommandDefinition(sql, new { id, passwordHash, rol }, cancellationToken: ct));
    }
}
