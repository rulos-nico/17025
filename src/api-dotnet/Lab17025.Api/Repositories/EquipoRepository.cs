using Dapper;
using Lab17025.Api.Domain;
using Lab17025.Api.Dtos;

namespace Lab17025.Api.Repositories;

public interface IEquipoRepository
{
    Task<IReadOnlyList<Equipo>> ListAsync(CancellationToken ct = default);
    Task<Equipo?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Equipo> CreateAsync(Guid id, string codigo, CreateEquipoDto dto, CancellationToken ct = default);
    Task<Equipo?> UpdateAsync(Guid id, UpdateEquipoDto dto, CancellationToken ct = default);
    Task<bool> SoftDeleteAsync(Guid id, CancellationToken ct = default);
}

/// <summary>
/// Repositorio Dapper para dbo.equipos. Replica el comportamiento de
/// src/api/src/repositories/equipo_repo.rs traduciendo SQLx -> SqlClient.
/// PKs son UNIQUEIDENTIFIER (Guid en C#).
/// </summary>
public sealed class EquipoRepository(ISqlConnectionFactory factory) : IEquipoRepository
{
    private const string Columns = """
        id, codigo, nombre, serie, placa, descripcion, marca, modelo, ubicacion,
        estado, fecha_calibracion, proxima_calibracion, incertidumbre, error_maximo,
        certificado_id, responsable, observaciones, activo,
        created_at, updated_at, synced_at, sync_source
        """;

    public async Task<IReadOnlyList<Equipo>> ListAsync(CancellationToken ct = default)
    {
        using var conn = factory.Create();
        var rows = await conn.QueryAsync<EquipoRow>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.equipos WHERE activo = 1 ORDER BY nombre",
            cancellationToken: ct));
        return rows.Select(MapRow).ToList();
    }

    public async Task<Equipo?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        var row = await conn.QuerySingleOrDefaultAsync<EquipoRow>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.equipos WHERE id = @id",
            new { id },
            cancellationToken: ct));
        return row is null ? null : MapRow(row);
    }

    public async Task<Equipo> CreateAsync(Guid id, string codigo, CreateEquipoDto dto, CancellationToken ct = default)
    {
        const string sql = $"""
            INSERT INTO dbo.equipos (id, codigo, nombre, serie, placa, descripcion, marca, modelo, ubicacion, estado, sync_source)
            OUTPUT INSERTED.id, INSERTED.codigo, INSERTED.nombre, INSERTED.serie, INSERTED.placa,
                   INSERTED.descripcion, INSERTED.marca, INSERTED.modelo, INSERTED.ubicacion,
                   INSERTED.estado, INSERTED.fecha_calibracion, INSERTED.proxima_calibracion,
                   INSERTED.incertidumbre, INSERTED.error_maximo, INSERTED.certificado_id,
                   INSERTED.responsable, INSERTED.observaciones, INSERTED.activo,
                   INSERTED.created_at, INSERTED.updated_at, INSERTED.synced_at, INSERTED.sync_source
            VALUES (@id, @codigo, @nombre, @serie, @placa, @descripcion, @marca, @modelo, @ubicacion, 'disponible', 'db');
            """;

        using var conn = factory.Create();
        var row = await conn.QuerySingleAsync<EquipoRow>(new CommandDefinition(sql, new
        {
            id,
            codigo,
            dto.Nombre,
            dto.Serie,
            dto.Placa,
            dto.Descripcion,
            dto.Marca,
            dto.Modelo,
            dto.Ubicacion
        }, cancellationToken: ct));

        return MapRow(row);
    }

    public async Task<Equipo?> UpdateAsync(Guid id, UpdateEquipoDto dto, CancellationToken ct = default)
    {
        DateOnly? fechaCal = TryParseDate(dto.FechaCalibracion);
        DateOnly? proximaCal = TryParseDate(dto.ProximaCalibracion);

        // SQL Server no permite OUTPUT sin INTO cuando la tabla tiene triggers
        // (trg_equipos_updated_at). Hacemos UPDATE + SELECT en la misma conexión.
        const string sql = $"""
            UPDATE dbo.equipos
            SET nombre              = COALESCE(@Nombre,              nombre),
                descripcion         = COALESCE(@Descripcion,         descripcion),
                ubicacion           = COALESCE(@Ubicacion,           ubicacion),
                estado              = COALESCE(@Estado,              estado),
                fecha_calibracion   = COALESCE(@FechaCalibracion,    fecha_calibracion),
                proxima_calibracion = COALESCE(@ProximaCalibracion,  proxima_calibracion),
                incertidumbre       = COALESCE(@Incertidumbre,       incertidumbre),
                error_maximo        = COALESCE(@ErrorMaximo,         error_maximo),
                certificado_id      = COALESCE(@CertificadoId,       certificado_id),
                responsable         = COALESCE(@Responsable,         responsable),
                observaciones       = COALESCE(@Observaciones,       observaciones),
                activo              = COALESCE(@Activo,              activo),
                sync_source         = 'db',
                updated_at          = SYSUTCDATETIME()
            WHERE id = @id;

            SELECT {Columns} FROM dbo.equipos WHERE id = @id;
            """;

        using var conn = factory.Create();
        var row = await conn.QuerySingleOrDefaultAsync<EquipoRow>(new CommandDefinition(sql, new
        {
            id,
            dto.Nombre,
            dto.Descripcion,
            dto.Ubicacion,
            dto.Estado,
            FechaCalibracion = fechaCal,
            ProximaCalibracion = proximaCal,
            dto.Incertidumbre,
            dto.ErrorMaximo,
            dto.CertificadoId,
            dto.Responsable,
            dto.Observaciones,
            dto.Activo
        }, cancellationToken: ct));

        return row is null ? null : MapRow(row);
    }

    public async Task<bool> SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE dbo.equipos
            SET activo = 0,
                sync_source = 'db',
                updated_at = SYSUTCDATETIME()
            WHERE id = @id AND activo = 1;
            """;

        using var conn = factory.Create();
        var affected = await conn.ExecuteAsync(new CommandDefinition(sql, new { id }, cancellationToken: ct));
        return affected > 0;
    }

    private static Equipo MapRow(EquipoRow r) => new()
    {
        Id = r.id,
        Codigo = r.codigo,
        Nombre = r.nombre,
        Serie = r.serie,
        Placa = r.placa,
        Descripcion = r.descripcion,
        Marca = r.marca,
        Modelo = r.modelo,
        Ubicacion = r.ubicacion,
        Estado = r.estado,
        FechaCalibracion = r.fecha_calibracion is null ? null : DateOnly.FromDateTime(r.fecha_calibracion.Value),
        ProximaCalibracion = r.proxima_calibracion is null ? null : DateOnly.FromDateTime(r.proxima_calibracion.Value),
        Incertidumbre = r.incertidumbre,
        ErrorMaximo = r.error_maximo,
        CertificadoId = r.certificado_id,
        Responsable = r.responsable,
        Observaciones = r.observaciones,
        Activo = r.activo,
        CreatedAt = r.created_at,
        UpdatedAt = r.updated_at,
        SyncedAt = r.synced_at,
        SyncSource = r.sync_source
    };

    private static DateOnly? TryParseDate(string? s)
        => DateOnly.TryParse(s, out var d) ? d : null;

    /// <summary>
    /// Modelo plano alineado con columnas de dbo.equipos. Usa snake_case
    /// para que Dapper haga match directo con los nombres de columna.
    /// </summary>
#pragma warning disable IDE1006
    private sealed record EquipoRow(
        Guid id,
        string codigo,
        string nombre,
        string serie,
        string? placa,
        string? descripcion,
        string? marca,
        string? modelo,
        string? ubicacion,
        string estado,
        DateTime? fecha_calibracion,
        DateTime? proxima_calibracion,
        decimal? incertidumbre,
        decimal? error_maximo,
        string? certificado_id,
        string? responsable,
        string? observaciones,
        bool activo,
        DateTimeOffset created_at,
        DateTimeOffset updated_at,
        DateTimeOffset? synced_at,
        string? sync_source);
#pragma warning restore IDE1006
}
