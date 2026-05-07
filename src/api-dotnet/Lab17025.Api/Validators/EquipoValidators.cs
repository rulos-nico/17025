using FluentValidation;
using Lab17025.Api.Dtos;

namespace Lab17025.Api.Validators;

/// <summary>
/// Validadores FluentValidation para Equipo (Fase A.3 — completa el patrón
/// estándar adoptado para Cliente y Sensor). El controller mantiene un guard
/// imperativo extra de "nombre" como defensa en profundidad.
///
/// `serie` se valida sólo en longitud, NO obligatorio: la columna SQL es
/// NOT NULL pero acepta cadena vacía y los tests existentes (y el frontend
/// legacy) crean equipos sin enviar `serie`.
/// </summary>
public sealed class CreateEquipoValidator : AbstractValidator<CreateEquipoDto>
{
    public CreateEquipoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("nombre es obligatorio")
            .MaximumLength(255);
        RuleFor(x => x.Serie).MaximumLength(100);
        RuleFor(x => x.Placa).MaximumLength(50);
        RuleFor(x => x.Marca).MaximumLength(100);
        RuleFor(x => x.Modelo).MaximumLength(100);
        RuleFor(x => x.Ubicacion).MaximumLength(100);
    }
}

public sealed class UpdateEquipoValidator : AbstractValidator<UpdateEquipoDto>
{
    private static readonly string[] EstadosValidos =
    [
        "disponible", "operativo", "en_uso", "mantenimiento",
        "fuera_servicio", "calibracion", "baja"
    ];

    public UpdateEquipoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().When(x => x.Nombre is not null)
            .MaximumLength(255);
        RuleFor(x => x.Ubicacion).MaximumLength(100);
        RuleFor(x => x.Estado)
            .Must(s => s is null || EstadosValidos.Contains(s))
            .WithMessage($"estado inválido (valores: {string.Join(", ", EstadosValidos)})");
    }
}
