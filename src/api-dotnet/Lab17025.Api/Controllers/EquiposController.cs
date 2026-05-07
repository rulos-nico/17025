using Lab17025.Api.Auth;
using Lab17025.Api.Dtos;
using Lab17025.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lab17025.Api.Controllers;

/// <summary>
/// Paridad con src/api/src/routes/equipos.rs:
///   GET    /api/equipos
///   GET    /api/equipos/{id}
///   POST   /api/equipos
///   PUT    /api/equipos/{id}
///   DELETE /api/equipos/{id}
/// </summary>
[ApiController]
[Authorize]
[Route("api/equipos")]
public sealed class EquiposController(
    IEquipoRepository repo,
    ICodigoGenerator codigos) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EquipoDto>>> List(CancellationToken ct)
    {
        var equipos = await repo.ListAsync(ct);
        return Ok(equipos.Select(e => e.ToDto()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EquipoDto>> Get(Guid id, CancellationToken ct)
    {
        var equipo = await repo.GetByIdAsync(id, ct);
        return equipo is null ? NotFound() : Ok(equipo.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = Roles.Write)]
    public async Task<ActionResult<EquipoDto>> Create([FromBody] CreateEquipoDto body, CancellationToken ct)
    {
        // Defensa en profundidad: CreateEquipoValidator (FluentValidation) ya
        // rechazaría nombre vacío con 400; este guard cubre el caso de que el
        // filtro fuera removido en el futuro.
        if (string.IsNullOrWhiteSpace(body.Nombre))
            return Problem(statusCode: 400, title: "nombre es obligatorio");

        var id = Guid.NewGuid();
        var codigo = await codigos.NextAsync("EQP", "seq_equipos", ct);

        var created = await repo.CreateAsync(id, codigo, body, ct);
        return Created($"/api/equipos/{created.Id}", created.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Write)]
    public async Task<ActionResult<EquipoDto>> Update(Guid id, [FromBody] UpdateEquipoDto body, CancellationToken ct)
    {
        var updated = await repo.UpdateAsync(id, body, ct);
        return updated is null ? NotFound() : Ok(updated.ToDto());
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Write)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await repo.SoftDeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}
