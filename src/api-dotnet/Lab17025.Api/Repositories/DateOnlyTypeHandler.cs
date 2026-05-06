using System.Data;
using Dapper;

namespace Lab17025.Api.Repositories;

/// <summary>
/// Dapper TypeHandler para System.DateOnly. Dapper aún no lo soporta out-of-the-box.
/// SQL Server: columna DATE <-> DateOnly.
/// </summary>
public sealed class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override DateOnly Parse(object value) => value switch
    {
        DateTime dt => DateOnly.FromDateTime(dt),
        DateOnly d => d,
        string s => DateOnly.Parse(s),
        _ => throw new DataException($"No se puede convertir {value?.GetType().Name} a DateOnly")
    };

    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value.ToDateTime(TimeOnly.MinValue);
    }
}

/// <summary>Maneja DateOnly? como nullable.</summary>
public sealed class NullableDateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly?>
{
    public override DateOnly? Parse(object? value) => value switch
    {
        null => null,
        DBNull => null,
        DateTime dt => DateOnly.FromDateTime(dt),
        DateOnly d => d,
        string s => string.IsNullOrWhiteSpace(s) ? null : DateOnly.Parse(s),
        _ => throw new DataException($"No se puede convertir {value.GetType().Name} a DateOnly?")
    };

    public override void SetValue(IDbDataParameter parameter, DateOnly? value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value.HasValue ? value.Value.ToDateTime(TimeOnly.MinValue) : (object)DBNull.Value;
    }
}
