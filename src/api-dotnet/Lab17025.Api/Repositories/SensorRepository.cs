using Dapper;
using Lab17025.Api.Domain;
using Lab17025.Api.Dtos;

namespace Lab17025.Api.Repositories;

public interface ISensorRepository
{
    Task<IReadOnlyList<Sensor>> ListAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Sensor>> ListByEquipoAsync(Guid equipoId, CancellationToken ct = default);
    Task<Sensor?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Sensor> CreateAsync(Guid id, string codigo, CreateSensorDto dto, CancellationToken ct = default);
    Task<Sensor?> UpdateAsync(Guid id, UpdateSensorDto dto, CancellationToken ct = default);
    Task<bool> SoftDeleteAsync(Guid id, CancellationToken ct = default);
}

/// <summary>
/// Repositorio Dapper para dbo.sensores. Usa [precision] (palabra reservada
/// en T-SQL) entre brackets en el SELECT.
/// </summary>
public sealed class SensorRepository(ISqlConnectionFactory factory) : ISensorRepository
{
    private const string Columns = """
        id, codigo, tipo, marca, modelo, numero_serie, rango_medicion,
        [precision] AS precision_, ubicacion, estado, fecha_calibracion,
        proxima_calibracion, error_maximo, certificado_id, responsable,
        observaciones, activo, equipo_id,
        created_at, updated_at, synced_at, sync_source
        """;

    public async Task<IReadOnlyList<Sensor>> ListAsync(CancellationToken ct = default)
    {
        using var conn = factory.Create();
        var rows = await conn.QueryAsync<SensorRow>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.sensores WHERE activo = 1 ORDER BY codigo",
            cancellationToken: ct));
        return rows.Select(MapRow).ToList();
    }

    public async Task<IReadOnlyList<Sensor>> ListByEquipoAsync(Guid equipoId, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        var rows = await conn.QueryAsync<SensorRow>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.sensores WHERE activo = 1 AND equipo_id = @equipoId ORDER BY codigo",
            new { equipoId },
            cancellationToken: ct));
        return rows.Select(MapRow).ToList();
    }

    public async Task<Sensor?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        using var conn = factory.Create();
        var row = await conn.QuerySingleOrDefaultAsync<SensorRow>(new CommandDefinition(
            $"SELECT {Columns} FROM dbo.sensores WHERE id = @id",
            new { id },
            cancellationToken: ct));
        return row is null ? null : MapRow(row);
    }

    public async Task<Sensor> CreateAsync(Guid id, string codigo, CreateSensorDto dto, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO dbo.sensores (id, codigo, tipo, marca, modelo, numero_serie, ubicacion, equipo_id, sync_source)
            OUTPUT INSERTED.id, INSERTED.codigo, INSERTED.tipo, INSERTED.marca, INSERTED.modelo,
                   INSERTED.numero_serie, INSERTED.rango_medicion, INSERTED.[precision] AS precision_,
                   INSERTED.ubicacion, INSERTED.estado, INSERTED.fecha_calibracion, INSERTED.proxima_calibracion,
                   INSERTED.error_maximo, INSERTED.certificado_id, INSERTED.responsable, INSERTED.observaciones,
                   INSERTED.activo, INSERTED.equipo_id,
                   INSERTED.created_at, INSERTED.updated_at, INSERTED.synced_at, INSERTED.sync_source
            VALUES (@id, @codigo, @Tipo, @Marca, @Modelo, @NumeroSerie, @Ubicacion, @EquipoId, 'db');
            """;

        using var conn = factory.Create();
        var row = await conn.QuerySingleAsync<SensorRow>(new CommandDefinition(sql, new
        {
            id,
            codigo,
            dto.Tipo,
            dto.Marca,
            dto.Modelo,
            dto.NumeroSerie,
            dto.Ubicacion,
            dto.EquipoId
        }, cancellationToken: ct));

        return MapRow(row);
    }

    public async Task<Sensor?> UpdateAsync(Guid id, UpdateSensorDto dto, CancellationToken ct = default)
    {
        const string sql = $"""
            UPDATE dbo.sensores
            SET tipo          = COALESCE(@Tipo,          tipo),
                marca         = COALESCE(@Marca,         marca),
                modelo        = COALESCE(@Modelo,        modelo),
                ubicacion     = COALESCE(@Ubicacion,     ubicacion),
                estado        = COALESCE(@Estado,        estado),
                responsable   = COALESCE(@Responsable,   responsable),
                observaciones = COALESCE(@Observaciones, observaciones),
                activo        = COALESCE(@Activo,        activo),
                equipo_id     = COALESCE(@EquipoId,      equipo_id),
                sync_source   = 'db',
                updated_at    = SYSUTCDATETIME()
            WHERE id = @id;

            SELECT {Columns} FROM dbo.sensores WHERE id = @id;
            """;

        using var conn = factory.Create();
        var row = await conn.QuerySingleOrDefaultAsync<SensorRow>(new CommandDefinition(sql, new
        {
            id,
            dto.Tipo,
            dto.Marca,
            dto.Modelo,
            dto.Ubicacion,
            dto.Estado,
            dto.Responsable,
            dto.Observaciones,
            dto.Activo,
            dto.EquipoId
        }, cancellationToken: ct));

        return row is null ? null : MapRow(row);
    }

    public async Task<bool> SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE dbo.sensores
            SET activo = 0,
                sync_source = 'db',
                updated_at = SYSUTCDATETIME()
            WHERE id = @id AND activo = 1;
            """;

        using var conn = factory.Create();
        var affected = await conn.ExecuteAsync(new CommandDefinition(sql, new { id }, cancellationToken: ct));
        return affected > 0;
    }

    private static Sensor MapRow(SensorRow r) => new()
    {
        Id = r.id,
        Codigo = r.codigo,
        Tipo = r.tipo,
        Marca = r.marca,
        Modelo = r.modelo,
        NumeroSerie = r.numero_serie,
        RangoMedicion = r.rango_medicion,
        Precision = r.precision_,
        Ubicacion = r.ubicacion,
        Estado = r.estado ?? "activo",
        FechaCalibracion = r.fecha_calibracion is null ? null : DateOnly.FromDateTime(r.fecha_calibracion.Value),
        ProximaCalibracion = r.proxima_calibracion is null ? null : DateOnly.FromDateTime(r.proxima_calibracion.Value),
        ErrorMaximo = r.error_maximo,
        CertificadoId = r.certificado_id,
        Responsable = r.responsable,
        Observaciones = r.observaciones,
        Activo = r.activo,
        EquipoId = r.equipo_id,
        CreatedAt = r.created_at,
        UpdatedAt = r.updated_at,
        SyncedAt = r.synced_at,
        SyncSource = r.sync_source,
    };

#pragma warning disable IDE1006
    private sealed record SensorRow(
        Guid id,
        string codigo,
        string tipo,
        string? marca,
        string? modelo,
        string numero_serie,
        string? rango_medicion,
        string? precision_,
        string? ubicacion,
        string? estado,
        DateTime? fecha_calibracion,
        DateTime? proxima_calibracion,
        decimal? error_maximo,
        string? certificado_id,
        string? responsable,
        string? observaciones,
        bool activo,
        Guid? equipo_id,
        DateTimeOffset created_at,
        DateTimeOffset updated_at,
        DateTimeOffset? synced_at,
        string? sync_source);
#pragma warning restore IDE1006
}
