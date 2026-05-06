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
    /// <summary>Roles autorizados a mutar equipos. TECNICO/CLIENTE/DISENO solo lectura.</summary>
    private const string WriteRoles = "ADMIN,COORDINADOR";

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
    [Authorize(Roles = WriteRoles)]
    public async Task<ActionResult<EquipoDto>> Create([FromBody] CreateEquipoDto body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Nombre) || string.IsNullOrWhiteSpace(body.Serie))
            return Problem(statusCode: 400, title: "nombre y serie son obligatorios");

        var id = Guid.NewGuid();
        // TODO Fase A.3: reemplazar por SEQUENCE T-SQL para garantizar unicidad
        // y formato consecutivo (paridad con generación de códigos en Rust).
        var codigo = $"EQP-{DateTime.UtcNow:yyyyMMddHHmmss}";

        var created = await repo.CreateAsync(id, codigo, body, ct);
        return Created($"/api/equipos/{created.Id}", created.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = WriteRoles)]
    public async Task<ActionResult<EquipoDto>> Update(Guid id, [FromBody] UpdateEquipoDto body, CancellationToken ct)
    {
        var updated = await repo.UpdateAsync(id, body, ct);
        return updated is null ? NotFound() : Ok(updated.ToDto());
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = WriteRoles)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await repo.SoftDeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}
