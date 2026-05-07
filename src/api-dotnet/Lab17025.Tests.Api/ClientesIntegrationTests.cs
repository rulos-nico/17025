using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Lab17025.Api.Dtos;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.MsSql;
using Xunit;

namespace Lab17025.Tests.Api;

/// <summary>
/// Tests integración del módulo Clientes (Fase A.3).
/// Mismo patrón que EquiposIntegrationTests: Testcontainers MsSql +
/// WebApplicationFactory; las migraciones DbUp + seeder corren al arrancar.
/// </summary>
public sealed class ClientesIntegrationTests : IAsyncLifetime
{
    private readonly MsSqlContainer _mssql = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .WithPassword("Strong!Passw0rd")
        .Build();

    private WebApplicationFactory<Program>? _factory;
    private HttpClient _client = default!;

    public async Task InitializeAsync()
    {
        await _mssql.StartAsync();
        var connStr = _mssql.GetConnectionString().Replace("Database=master", "Database=lab17025_test");

        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
        {
            b.UseEnvironment("Development");
            b.ConfigureAppConfiguration((_, cfg) =>
            {
                cfg.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:SqlServer"] = connStr,
                    ["Jwt:Secret"] = "test-secret-very-long-and-secure-for-tests-only-xxx",
                    ["Jwt:Issuer"] = "lab-17025-test",
                    ["Jwt:Audience"] = "lab-17025-test"
                });
            });
        });

        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        if (_factory is not null) await _factory.DisposeAsync();
        await _mssql.DisposeAsync();
    }

    private async Task<string> LoginAsync()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "demo@ingetec.cl",
            password = "demo1234"
        });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<LoginResponseDto>();
        return body!.AccessToken;
    }

    [Fact]
    public async Task Clientes_RequireAuth()
    {
        var res = await _client.GetAsync("/api/clientes");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Clientes_FullCrudCycle()
    {
        var token = await LoginAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Lista inicial (vacía o con seed)
        var initial = await _client.GetFromJsonAsync<ClienteDto[]>("/api/clientes");
        initial.Should().NotBeNull();

        // Create
        var create = await _client.PostAsJsonAsync("/api/clientes", new
        {
            nombre = "Cliente Test SpA",
            rut = "76.123.456-7",
            email = "test@cliente.cl"
        });
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<ClienteDto>();
        created!.Id.Should().NotBe(Guid.Empty);
        created.Codigo.Should().StartWith("CLI-");
        created.Nombre.Should().Be("Cliente Test SpA");

        // Update
        var upd = await _client.PutAsJsonAsync($"/api/clientes/{created.Id}", new
        {
            nombre = "Cliente Test Modificado",
            ciudad = "Santiago"
        });
        upd.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await upd.Content.ReadFromJsonAsync<ClienteDto>();
        updated!.Nombre.Should().Be("Cliente Test Modificado");
        updated.Ciudad.Should().Be("Santiago");

        // Get
        var got = await _client.GetFromJsonAsync<ClienteDto>($"/api/clientes/{created.Id}");
        got!.Ciudad.Should().Be("Santiago");

        // Proyectos placeholder (vacío)
        var proys = await _client.GetFromJsonAsync<object[]>($"/api/clientes/{created.Id}/proyectos");
        proys.Should().NotBeNull();
        proys!.Length.Should().Be(0);

        // Delete (soft)
        var del = await _client.DeleteAsync($"/api/clientes/{created.Id}");
        del.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);

        // Ya no en list
        var after = await _client.GetFromJsonAsync<ClienteDto[]>("/api/clientes");
        after!.Should().NotContain(c => c.Id == created.Id);
    }

    [Fact]
    public async Task Clientes_Create_WithoutNombre_Returns400()
    {
        var token = await LoginAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var res = await _client.PostAsJsonAsync("/api/clientes", new { rut = "76.000.000-0" });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Clientes_Create_WithInvalidEmail_Returns400()
    {
        var token = await LoginAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var res = await _client.PostAsJsonAsync("/api/clientes", new
        {
            nombre = "X",
            email = "not-an-email"
        });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
