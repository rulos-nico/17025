using Dapper;
using Lab17025.Api.Domain;
using Lab17025.Api.Dtos;

namespace Lab17025.Api.Repositories;

public interface IClienteRepository
{
    Task<IReadOnlyList<Cliente>> ListAsync(CancellationToken ct = default);
    Task<Cliente?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Cliente> CreateAsync(Guid id, string codigo, CreateClienteDto dto, CancellationToken ct = default);
    Task<Cliente?> UpdateAsync(Guid id, UpdateClienteDto dto, CancellationToken ct = default);
    Task<bool> SoftDeleteAsync(Guid id, CancellationToken ct = default);
}

/// <summary>
/// Repositorio Dapper para dbo.clientes. Replica la lógica del repo Rust
/// (src/api/src/repositories/cliente_repo.rs) y el contrato de columnas
/// definido en la migración 001.
/// </summary>
public sealed class ClienteRepository(ISqlConnectionFactory factory) : IClienteRepository
{
    private const string Columns = """
        id, codigo, nombre, rut, direccion, ciudad, telefono, email,
        contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
        activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
        """;

    public async Task<IReadOnlyList<Cliente>> ListAsync(CancellationToken ct = default)
    {
        using var conn = factory.Create();
        var rows = await conn.QueryAsync<ClienteRow>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.clientes WHERE activo = 1 ORDER BY nombre",
            cancellationToken: ct));
        return rows.Select(MapRow).ToList();
    }

    public async Task<Cliente?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        var row = await conn.QuerySingleOrDefaultAsync<ClienteRow>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.clientes WHERE id = @id",
            new { id },
            cancellationToken: ct));
        return row is null ? null : MapRow(row);
    }

    public async Task<Cliente> CreateAsync(Guid id, string codigo, CreateClienteDto dto, CancellationToken ct = default)
    {
        const string sql = $"""
            INSERT INTO dbo.clientes (id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                                      contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                                      sync_source)
            OUTPUT INSERTED.id, INSERTED.codigo, INSERTED.nombre, INSERTED.rut, INSERTED.direccion,
                   INSERTED.ciudad, INSERTED.telefono, INSERTED.email,
                   INSERTED.contacto_nombre, INSERTED.contacto_cargo, INSERTED.contacto_email,
                   INSERTED.contacto_telefono, INSERTED.activo, INSERTED.drive_folder_id,
                   INSERTED.created_at, INSERTED.updated_at, INSERTED.synced_at, INSERTED.sync_source
            VALUES (@id, @codigo, @Nombre, @Rut, @Direccion, @Ciudad, @Telefono, @Email,
                    @ContactoNombre, @ContactoCargo, @ContactoEmail, @ContactoTelefono, 'db');
            """;

        using var conn = factory.Create();
        var row = await conn.QuerySingleAsync<ClienteRow>(new CommandDefinition(sql, new
        {
            id,
            codigo,
            dto.Nombre,
            dto.Rut,
            dto.Direccion,
            dto.Ciudad,
            dto.Telefono,
            dto.Email,
            dto.ContactoNombre,
            dto.ContactoCargo,
            dto.ContactoEmail,
            dto.ContactoTelefono
        }, cancellationToken: ct));

        return MapRow(row);
    }

    public async Task<Cliente?> UpdateAsync(Guid id, UpdateClienteDto dto, CancellationToken ct = default)
    {
        // Trigger trg_clientes_updated_at fuerza UPDATE+SELECT (ver patrón Equipos).
        const string sql = $"""
            UPDATE dbo.clientes
            SET nombre             = COALESCE(@Nombre,             nombre),
                rut                = COALESCE(@Rut,                rut),
                direccion          = COALESCE(@Direccion,          direccion),
                ciudad             = COALESCE(@Ciudad,             ciudad),
                telefono           = COALESCE(@Telefono,           telefono),
                email              = COALESCE(@Email,              email),
                contacto_nombre    = COALESCE(@ContactoNombre,     contacto_nombre),
                contacto_cargo     = COALESCE(@ContactoCargo,      contacto_cargo),
                contacto_email     = COALESCE(@ContactoEmail,      contacto_email),
                contacto_telefono  = COALESCE(@ContactoTelefono,   contacto_telefono),
                activo             = COALESCE(@Activo,             activo),
                sync_source        = 'db',
                updated_at         = SYSUTCDATETIME()
            WHERE id = @id;

            SELECT {Columns} FROM dbo.clientes WHERE id = @id;
            """;

        using var conn = factory.Create();
        var row = await conn.QuerySingleOrDefaultAsync<ClienteRow>(new CommandDefinition(sql, new
        {
            id,
            dto.Nombre,
            dto.Rut,
            dto.Direccion,
            dto.Ciudad,
            dto.Telefono,
            dto.Email,
            dto.ContactoNombre,
            dto.ContactoCargo,
            dto.ContactoEmail,
            dto.ContactoTelefono,
            dto.Activo
        }, cancellationToken: ct));

        return row is null ? null : MapRow(row);
    }

    public async Task<bool> SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE dbo.clientes
            SET activo = 0,
                sync_source = 'db',
                updated_at = SYSUTCDATETIME()
            WHERE id = @id AND activo = 1;
            """;

        using var conn = factory.Create();
        var affected = await conn.ExecuteAsync(new CommandDefinition(sql, new { id }, cancellationToken: ct));
        return affected > 0;
    }

    private static Cliente MapRow(ClienteRow r) => new()
    {
        Id = r.id,
        Codigo = r.codigo,
        Nombre = r.nombre,
        Rut = r.rut,
        Direccion = r.direccion,
        Ciudad = r.ciudad,
        Telefono = r.telefono,
        Email = r.email,
        ContactoNombre = r.contacto_nombre,
        ContactoCargo = r.contacto_cargo,
        ContactoEmail = r.contacto_email,
        ContactoTelefono = r.contacto_telefono,
        Activo = r.activo,
        DriveFolderId = r.drive_folder_id,
        CreatedAt = r.created_at,
        UpdatedAt = r.updated_at,
        SyncedAt = r.synced_at,
        SyncSource = r.sync_source
    };

#pragma warning disable IDE1006
    private sealed record ClienteRow(
        Guid id,
        string codigo,
        string nombre,
        string? rut,
        string? direccion,
        string? ciudad,
        string? telefono,
        string? email,
        string? contacto_nombre,
        string? contacto_cargo,
        string? contacto_email,
        string? contacto_telefono,
        bool activo,
        string? drive_folder_id,
        DateTimeOffset created_at,
        DateTimeOffset updated_at,
        DateTimeOffset? synced_at,
        string? sync_source);
#pragma warning restore IDE1006
}
