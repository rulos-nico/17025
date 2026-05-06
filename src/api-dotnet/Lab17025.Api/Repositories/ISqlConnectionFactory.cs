using System.Data;
using Microsoft.Data.SqlClient;

namespace Lab17025.Api.Repositories;

/// <summary>
/// Factory de conexiones SQL Server. Inyectada vía DI como singleton.
/// Cada operación crea su propia conexión (Microsoft.Data.SqlClient hace
/// connection pooling internamente).
/// </summary>
public interface ISqlConnectionFactory
{
    IDbConnection Create();
}

public sealed class SqlConnectionFactory(string connectionString) : ISqlConnectionFactory
{
    public IDbConnection Create() => new SqlConnection(connectionString);
}
