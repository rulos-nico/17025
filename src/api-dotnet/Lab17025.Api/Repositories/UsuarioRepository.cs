using Dapper;
using Lab17025.Api.Domain;

namespace Lab17025.Api.Repositories;

public interface IUsuarioRepository
{
    Task<Usuario?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<Usuario?> FindByIdAsync(Guid id, CancellationToken ct = default);
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
}
