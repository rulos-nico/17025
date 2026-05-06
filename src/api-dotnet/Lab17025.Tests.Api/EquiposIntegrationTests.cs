using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Lab17025.Api.Dtos;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.MsSql;
using Xunit;

namespace Lab17025.Tests.Api;

/// <summary>
/// Tests de integración del módulo Equipos contra una instancia real de
/// SQL Server levantada con Testcontainers + WebApplicationFactory.
///
/// Las migraciones DbUp se ejecutan al arranque del host, por lo que los
/// tests parten siempre de un estado limpio + seed PoC.
/// </summary>
public sealed class EquiposIntegrationTests : IAsyncLifetime
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
        body!.AccessToken.Should().NotBeNullOrEmpty();
        return body.AccessToken;
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var token = await LoginAsync();
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "demo@ingetec.cl",
            password = "wrong"
        });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Equipos_RequireAuth()
    {
        var res = await _client.GetAsync("/api/equipos");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Equipos_FullCrudCycle()
    {
        var token = await LoginAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // List inicial (debe traer al menos los 3 del seed)
        var list = await _client.GetFromJsonAsync<EquipoDto[]>("/api/equipos");
        list.Should().NotBeNull();
        list!.Length.Should().BeGreaterThanOrEqualTo(3);

        // Create
        var create = await _client.PostAsJsonAsync("/api/equipos", new
        {
            nombre = "Equipo Test",
            marca = "TestBrand",
            estado = "operativo"
        });
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<EquipoDto>();
        created!.Id.Should().NotBeNullOrEmpty();
        created.Codigo.Should().StartWith("EQP-");

        // Update
        var upd = await _client.PutAsJsonAsync($"/api/equipos/{created.Id}", new
        {
            nombre = "Equipo Test Modificado"
        });
        upd.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await upd.Content.ReadFromJsonAsync<EquipoDto>();
        updated!.Nombre.Should().Be("Equipo Test Modificado");

        // Get
        var get = await _client.GetFromJsonAsync<EquipoDto>($"/api/equipos/{created.Id}");
        get!.Nombre.Should().Be("Equipo Test Modificado");

        // Delete (soft)
        var del = await _client.DeleteAsync($"/api/equipos/{created.Id}");
        del.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);

        // Ya no aparece en list
        var listAfter = await _client.GetFromJsonAsync<EquipoDto[]>("/api/equipos");
        listAfter!.Should().NotContain(e => e.Id == created.Id);
    }
}
