using Lab17025.Api.Auth;
using Lab17025.Api.Dtos;
using Lab17025.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lab17025.Api.Controllers;

/// <summary>
/// Paridad con src/api/src/routes/clientes.rs:
///   GET    /api/clientes
///   GET    /api/clientes/{id}
///   GET    /api/clientes/{id}/proyectos  (placeholder, se completa en Ola B)
///   POST   /api/clientes
///   PUT    /api/clientes/{id}
///   DELETE /api/clientes/{id}
/// </summary>
[ApiController]
[Authorize]
[Route("api/clientes")]
public sealed class ClientesController(
    IClienteRepository repo,
    ICodigoGenerator codigos) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> List(CancellationToken ct)
    {
        var rows = await repo.ListAsync(ct);
        return Ok(rows.Select(c => c.ToDto()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClienteDto>> Get(Guid id, CancellationToken ct)
    {
        var c = await repo.GetByIdAsync(id, ct);
        return c is null ? NotFound() : Ok(c.ToDto());
    }

    /// <summary>
    /// Lista proyectos del cliente. Placeholder hasta que se porte ProyectoRepository
    /// (Ola B). Devuelve array vacío para mantener contrato con el frontend legacy.
    /// </summary>
    [HttpGet("{id:guid}/proyectos")]
    public async Task<ActionResult<IEnumerable<object>>> ListProyectos(Guid id, CancellationToken ct)
    {
        var c = await repo.GetByIdAsync(id, ct);
        if (c is null) return NotFound();
        return Ok(Array.Empty<object>());
    }

    [HttpPost]
    [Authorize(Roles = Roles.Write)]
    public async Task<ActionResult<ClienteDto>> Create([FromBody] CreateClienteDto body, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        var codigo = await codigos.NextAsync("CLI", "seq_clientes", ct);
        var created = await repo.CreateAsync(id, codigo, body, ct);
        return Created($"/api/clientes/{created.Id}", created.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Write)]
    public async Task<ActionResult<ClienteDto>> Update(Guid id, [FromBody] UpdateClienteDto body, CancellationToken ct)
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
