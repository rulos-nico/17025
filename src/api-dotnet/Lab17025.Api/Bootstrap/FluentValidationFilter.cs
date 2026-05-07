using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;

namespace Lab17025.Api.Bootstrap;

/// <summary>
/// Filtro que ejecuta los validators FluentValidation de los argumentos
/// `[FromBody]` antes de invocar la acción del controller. Si la validación
/// falla, devuelve un ProblemDetails 400 con las violaciones agrupadas por
/// propiedad (formato `ValidationProblemDetails` estándar de ASP.NET).
///
/// Decisión Fase A.3:
///   * No usamos AddFluentValidationAutoValidation (paquete deprecated por
///     el equipo de FluentValidation). En su lugar, registramos los validators
///     en DI con AddValidatorsFromAssemblyContaining<Program> y los invocamos
///     desde este filtro global.
///   * El filtro se omite si no hay validator registrado para el tipo
///     (compatibilidad con DTOs sin validator, ej. EquipoDto temporalmente).
/// </summary>
public sealed class FluentValidationFilter(IServiceProvider services) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var (_, value) in context.ActionArguments)
        {
            if (value is null) continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(value.GetType());
            if (services.GetService(validatorType) is not IValidator validator) continue;

            var ctxValidate = new ValidationContext<object>(value);
            ValidationResult result = await validator.ValidateAsync(ctxValidate, context.HttpContext.RequestAborted);

            if (!result.IsValid)
            {
                var errors = result.Errors
                    .GroupBy(e => string.IsNullOrEmpty(e.PropertyName) ? "_" : e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray());

                context.Result = new ObjectResult(new ValidationProblemDetails(errors)
                {
                    Title = "Validation failed",
                    Status = StatusCodes.Status400BadRequest,
                    Type = "https://httpstatuses.com/400"
                })
                {
                    StatusCode = StatusCodes.Status400BadRequest
                };
                return;
            }
        }

        await next();
    }
}
