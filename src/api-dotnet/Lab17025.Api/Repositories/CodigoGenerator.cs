using Dapper;
using Microsoft.Data.SqlClient;

namespace Lab17025.Api.Repositories;

/// <summary>
/// Genera códigos legibles atómicos por entidad (CLI-NNNNNN, EQP-NNNNNN, ...)
/// usando la stored procedure `dbo.sp_next_codigo` (ver migración 006).
///
/// Reemplaza la generación legacy `nanos % 10000` del backend Rust
/// (`src/api/src/utils/id.rs`) que tenía riesgo de colisión bajo carga.
/// </summary>
public interface ICodigoGenerator
{
    /// <summary>Devuelve `<prefix>-NNNNNN` (6 dígitos cero-padded).</summary>
    Task<string> NextAsync(string prefix, string sequence, CancellationToken ct = default);

    /// <summary>Devuelve `<prefix>-YYYYMMDD-NNNNNN`. Usado por proyectos/perforaciones.</summary>
    Task<string> NextDatedAsync(string prefix, string sequence, DateTimeOffset? fecha = null, CancellationToken ct = default);
}

public sealed class CodigoGenerator(ISqlConnectionFactory factory) : ICodigoGenerator
{
    public Task<string> NextAsync(string prefix, string sequence, CancellationToken ct = default)
        => InvokeAsync(prefix, sequence, dated: false, fecha: null, ct);

    public Task<string> NextDatedAsync(string prefix, string sequence, DateTimeOffset? fecha = null, CancellationToken ct = default)
        => InvokeAsync(prefix, sequence, dated: true, fecha: fecha, ct);

    private async Task<string> InvokeAsync(string prefix, string sequence, bool dated, DateTimeOffset? fecha, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            throw new ArgumentException("prefix requerido", nameof(prefix));
        if (string.IsNullOrWhiteSpace(sequence))
            throw new ArgumentException("sequence requerido", nameof(sequence));

        var p = new DynamicParameters();
        p.Add("@prefix", prefix);
        p.Add("@sequence", sequence);
        p.Add("@dated", dated);
        p.Add("@fecha", fecha);
        p.Add("@codigo", dbType: System.Data.DbType.String, direction: System.Data.ParameterDirection.Output, size: 50);

        using var conn = factory.Create();
        await ((SqlConnection)conn).OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition(
            "dbo.sp_next_codigo",
            p,
            commandType: System.Data.CommandType.StoredProcedure,
            cancellationToken: ct));

        return p.Get<string>("@codigo")
            ?? throw new InvalidOperationException("sp_next_codigo no devolvió código");
    }
}
