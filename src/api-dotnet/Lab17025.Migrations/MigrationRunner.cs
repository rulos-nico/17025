using System.Reflection;
using DbUp;
using DbUp.Engine;
using Microsoft.Extensions.Logging;

namespace Lab17025.Migrations;

/// <summary>
/// Runner de migraciones T-SQL embebidas en este assembly.
///
/// Las migraciones se aplican en orden alfabético de nombre de recurso.
/// Cada script se ejecuta una sola vez (DbUp registra los aplicados en
/// la tabla SchemaVersions).
/// </summary>
public static class MigrationRunner
{
    public static MigrationResult Run(string connectionString, ILogger? logger = null)
    {
        EnsureDatabase.For.SqlDatabase(connectionString);

        var upgrader = DeployChanges.To
            .SqlDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(
                Assembly.GetExecutingAssembly(),
                name => name.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
            .WithTransactionPerScript()
            .LogTo(new DbUpLoggerAdapter(logger))
            .Build();

        var result = upgrader.PerformUpgrade();

        return new MigrationResult(
            Successful: result.Successful,
            ErrorMessage: result.Error?.Message,
            ScriptsApplied: result.Scripts.Select(s => s.Name).ToArray());
    }

    private sealed class DbUpLoggerAdapter(ILogger? logger) : DbUp.Engine.Output.IUpgradeLog
    {
        public void LogTrace(string format, params object[] args)
            => logger?.LogTrace(format, args);
        public void LogDebug(string format, params object[] args)
            => logger?.LogDebug(format, args);
        public void LogInformation(string format, params object[] args)
            => logger?.LogInformation(format, args);
        public void LogWarning(string format, params object[] args)
            => logger?.LogWarning(format, args);
        public void LogError(string format, params object[] args)
            => logger?.LogError(format, args);
        public void LogError(Exception ex, string format, params object[] args)
            => logger?.LogError(ex, format, args);
    }
}

public sealed record MigrationResult(bool Successful, string? ErrorMessage, string[] ScriptsApplied);
