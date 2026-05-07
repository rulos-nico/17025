using FluentValidation;
using Lab17025.Api.Dtos;

namespace Lab17025.Api.Validators;

public sealed class CreateSensorValidator : AbstractValidator<CreateSensorDto>
{
    public CreateSensorValidator()
    {
        RuleFor(x => x.Tipo)
            .NotEmpty().WithMessage("tipo es obligatorio")
            .MaximumLength(100);
        RuleFor(x => x.NumeroSerie)
            .NotNull().WithMessage("numero_serie es obligatorio")
            .MaximumLength(100);
        RuleFor(x => x.Marca).MaximumLength(100);
        RuleFor(x => x.Modelo).MaximumLength(100);
        RuleFor(x => x.Ubicacion).MaximumLength(255);
    }
}

public sealed class UpdateSensorValidator : AbstractValidator<UpdateSensorDto>
{
    public UpdateSensorValidator()
    {
        RuleFor(x => x.Tipo)
            .NotEmpty().When(x => x.Tipo is not null)
            .MaximumLength(100);
        RuleFor(x => x.Estado)
            .Must(s => s is null ||
                s == "activo" || s == "inactivo" || s == "mantenimiento" ||
                s == "fuera_servicio" || s == "calibracion")
            .WithMessage("estado inválido");
    }
}
