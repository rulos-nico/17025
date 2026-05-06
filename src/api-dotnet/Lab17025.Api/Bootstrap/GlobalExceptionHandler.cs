using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Lab17025.Api.Bootstrap;

/// <summary>
/// Manejador global de excepciones. Convierte errores no controlados en
/// respuestas <see cref="ProblemDetails"/> con:
///   * <c>title</c>/<c>status</c>/<c>type</c> RFC 7807,
///   * <c>traceId</c> de Activity (para correlación con OpenTelemetry futuro),
///   * <c>correlationId</c> propagado por <see cref="CorrelationIdMiddleware"/>,
///   * <c>instance</c> con la ruta del request.
///
/// Excepciones esperables (<see cref="ApiException"/>) usan su propio
/// status/title; el resto se mapea a 500.
/// </summary>
public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment env) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title, detail) = exception switch
        {
            ApiException api => (api.StatusCode, api.Title, api.Message),
            BadHttpRequestException bad => (StatusCodes.Status400BadRequest, "Solicitud inválida", bad.Message),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "No autorizado", "Acceso requerido"),
            OperationCanceledException when cancellationToken.IsCancellationRequested
                => (StatusCodes.Status499ClientClosedRequest, "Cliente canceló la solicitud", string.Empty),
            _ => (StatusCodes.Status500InternalServerError, "Error interno del servidor",
                  env.IsDevelopment() ? exception.ToString() : "Ha ocurrido un error inesperado")
        };

        var correlationId = httpContext.Items.TryGetValue(CorrelationIdMiddleware.ItemsKey, out var cid)
            ? cid?.ToString()
            : null;

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = string.IsNullOrEmpty(detail) ? null : detail,
            Instance = httpContext.Request.Path,
            Type = $"https://httpstatuses.com/{status}"
        };
        problem.Extensions["traceId"] = Activity.Current?.Id ?? httpContext.TraceIdentifier;
        if (!string.IsNullOrEmpty(correlationId))
            problem.Extensions["correlationId"] = correlationId;

        if (status >= 500)
            logger.LogError(exception, "Excepción no manejada {Status} en {Path}", status, httpContext.Request.Path);
        else
            logger.LogWarning(exception, "Excepción {Status} en {Path}: {Message}",
                status, httpContext.Request.Path, exception.Message);

        httpContext.Response.StatusCode = status;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken: cancellationToken);
        return true;
    }
}

/// <summary>
/// Excepción "esperable" para reglas de negocio. Se mapea 1:1 a ProblemDetails
/// con el status/title indicados (sin stack trace al cliente).
/// </summary>
public sealed class ApiException : Exception
{
    public int StatusCode { get; }
    public string Title { get; }

    public ApiException(int statusCode, string title, string? detail = null)
        : base(detail ?? title)
    {
        StatusCode = statusCode;
        Title = title;
    }

    public static ApiException NotFound(string what) =>
        new(StatusCodes.Status404NotFound, $"{what} no encontrado");

    public static ApiException BadRequest(string detail) =>
        new(StatusCodes.Status400BadRequest, "Solicitud inválida", detail);

    public static ApiException Conflict(string detail) =>
        new(StatusCodes.Status409Conflict, "Conflicto", detail);
}
