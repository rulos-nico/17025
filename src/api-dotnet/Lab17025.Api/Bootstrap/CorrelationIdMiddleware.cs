namespace Lab17025.Api.Bootstrap;

/// <summary>
/// Middleware que asegura que cada request tenga un correlation-id estable.
///
///   * Si el cliente envía <c>X-Correlation-Id</c>, se respeta.
///   * Si no, se genera uno (Guid N-format, 32 chars).
///
/// El valor se:
///   * inyecta en <see cref="HttpContext.Items"/> con la clave <see cref="ItemsKey"/>;
///   * agrega como header de respuesta <c>X-Correlation-Id</c>;
///   * empuja al <c>LogContext</c> de Serilog como propiedad <c>CorrelationId</c>
///     (gracias a <c>app.UseSerilogRequestLogging()</c> queda en cada log line).
/// </summary>
public sealed class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-Id";
    public const string ItemsKey = "CorrelationId";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx)
    {
        var incoming = ctx.Request.Headers[HeaderName].ToString();
        var correlationId = string.IsNullOrWhiteSpace(incoming)
            ? Guid.NewGuid().ToString("N")
            : incoming.Trim();

        ctx.Items[ItemsKey] = correlationId;
        ctx.Response.Headers[HeaderName] = correlationId;

        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
        using (Serilog.Context.LogContext.PushProperty("UserId",
            ctx.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value))
        {
            await _next(ctx);
        }
    }
}

public static class CorrelationIdMiddlewareExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
        => app.UseMiddleware<CorrelationIdMiddleware>();
}
