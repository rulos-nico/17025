using FluentValidation;
using Lab17025.Api.Dtos;

namespace Lab17025.Api.Validators;

public sealed class CreateClienteValidator : AbstractValidator<CreateClienteDto>
{
    public CreateClienteValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("nombre es obligatorio")
            .MaximumLength(255);
        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
            .MaximumLength(255);
        RuleFor(x => x.ContactoEmail)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.ContactoEmail))
            .MaximumLength(255);
        RuleFor(x => x.Rut).MaximumLength(20);
        RuleFor(x => x.Telefono).MaximumLength(50);
    }
}

public sealed class UpdateClienteValidator : AbstractValidator<UpdateClienteDto>
{
    public UpdateClienteValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().When(x => x.Nombre is not null)
            .MaximumLength(255);
        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
            .MaximumLength(255);
        RuleFor(x => x.ContactoEmail)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.ContactoEmail))
            .MaximumLength(255);
    }
}
