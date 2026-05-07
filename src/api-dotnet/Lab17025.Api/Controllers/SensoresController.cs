using Lab17025.Api.Auth;
using Lab17025.Api.Dtos;
using Lab17025.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lab17025.Api.Controllers;

/// <summary>
/// Paridad con src/api/src/routes/sensores.rs:
///   GET    /api/sensores
///   GET    /api/sensores/{id}
///   GET    /api/sensores/equipo/{equipoId}
///   POST   /api/sensores
///   PUT    /api/sensores/{id}
///   DELETE /api/sensores/{id}
/// </summary>
[ApiController]
[Authorize]
[Route("api/sensores")]
public sealed class SensoresController(
    ISensorRepository repo,
    ICodigoGenerator codigos) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SensorDto>>> List(CancellationToken ct)
    {
        var rows = await repo.ListAsync(ct);
        return Ok(rows.Select(s => s.ToDto()));
    }

    [HttpGet("equipo/{equipoId:guid}")]
    public async Task<ActionResult<IEnumerable<SensorDto>>> ListByEquipo(Guid equipoId, CancellationToken ct)
    {
        var rows = await repo.ListByEquipoAsync(equipoId, ct);
        return Ok(rows.Select(s => s.ToDto()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SensorDto>> Get(Guid id, CancellationToken ct)
    {
        var s = await repo.GetByIdAsync(id, ct);
        return s is null ? NotFound() : Ok(s.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = Roles.Write)]
    public async Task<ActionResult<SensorDto>> Create([FromBody] CreateSensorDto body, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        var codigo = await codigos.NextAsync("SEN", "seq_sensores", ct);
        var created = await repo.CreateAsync(id, codigo, body, ct);
        return Created($"/api/sensores/{created.Id}", created.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Write)]
    public async Task<ActionResult<SensorDto>> Update(Guid id, [FromBody] UpdateSensorDto body, CancellationToken ct)
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
