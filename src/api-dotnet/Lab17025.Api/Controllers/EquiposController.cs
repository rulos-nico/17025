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
public sealed class EquiposController(IEquipoRepository repo) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EquipoDto>>> List(CancellationToken ct)
    {
        var equipos = await repo.ListAsync(ct);
        return Ok(equipos.Select(e => e.ToDto()));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EquipoDto>> Get(string id, CancellationToken ct)
    {
        var equipo = await repo.GetByIdAsync(id, ct);
        return equipo is null ? NotFound() : Ok(equipo.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<EquipoDto>> Create([FromBody] CreateEquipoDto body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Nombre) || string.IsNullOrWhiteSpace(body.Serie))
            return Problem(statusCode: 400, title: "nombre y serie son obligatorios");

        var id = Guid.NewGuid().ToString();
        var codigo = $"EQP-{DateTime.UtcNow:yyyyMMddHHmmss}";

        var created = await repo.CreateAsync(id, codigo, body, ct);
        return Created($"/api/equipos/{created.Id}", created.ToDto());
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EquipoDto>> Update(string id, [FromBody] UpdateEquipoDto body, CancellationToken ct)
    {
        var updated = await repo.UpdateAsync(id, body, ct);
        return updated is null ? NotFound() : Ok(updated.ToDto());
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var ok = await repo.SoftDeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}
