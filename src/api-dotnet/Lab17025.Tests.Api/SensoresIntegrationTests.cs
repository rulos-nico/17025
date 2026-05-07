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
/// Tests integración del módulo Sensores (Fase A.3).
/// Cubre CRUD + filtro por equipo + relación con Equipos (FK equipo_id).
/// </summary>
public sealed class SensoresIntegrationTests : IAsyncLifetime
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

    private async Task AuthenticateAsync()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "demo@ingetec.cl",
            password = "demo1234"
        });
        var body = await res.Content.ReadFromJsonAsync<LoginResponseDto>();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", body!.AccessToken);
    }

    [Fact]
    public async Task Sensores_RequireAuth()
    {
        var res = await _client.GetAsync("/api/sensores");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Sensores_FullCrudCycle()
    {
        await AuthenticateAsync();

        // Lista inicial
        var initial = await _client.GetFromJsonAsync<SensorDto[]>("/api/sensores");
        initial.Should().NotBeNull();

        // Create
        var create = await _client.PostAsJsonAsync("/api/sensores", new
        {
            tipo = "termometro",
            marca = "Fluke",
            modelo = "1523",
            numero_serie = "SN-001",
            ubicacion = "Lab 1"
        });
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<SensorDto>();
        created!.Id.Should().NotBe(Guid.Empty);
        created.Codigo.Should().StartWith("SEN-");
        created.Tipo.Should().Be("termometro");
        created.NumeroSerie.Should().Be("SN-001");

        // Update
        var upd = await _client.PutAsJsonAsync($"/api/sensores/{created.Id}", new
        {
            estado = "mantenimiento",
            ubicacion = "Lab 2"
        });
        upd.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await upd.Content.ReadFromJsonAsync<SensorDto>();
        updated!.Estado.Should().Be("mantenimiento");
        updated.Ubicacion.Should().Be("Lab 2");

        // Get
        var got = await _client.GetFromJsonAsync<SensorDto>($"/api/sensores/{created.Id}");
        got!.Codigo.Should().Be(created.Codigo);

        // Delete (soft)
        var del = await _client.DeleteAsync($"/api/sensores/{created.Id}");
        del.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);

        var after = await _client.GetFromJsonAsync<SensorDto[]>("/api/sensores");
        after!.Should().NotContain(s => s.Id == created.Id);
    }

    [Fact]
    public async Task Sensores_AsociadosAEquipo_FilterPorEquipoId()
    {
        await AuthenticateAsync();

        // Crea un equipo (semilla del seeder existe pero queremos uno controlado).
        var eqRes = await _client.PostAsJsonAsync("/api/equipos", new { nombre = "Eq Sensor Test" });
        eqRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var equipo = await eqRes.Content.ReadFromJsonAsync<EquipoDto>();

        // Crea sensor asociado.
        var senRes = await _client.PostAsJsonAsync("/api/sensores", new
        {
            tipo = "presion",
            numero_serie = "PSN-100",
            equipo_id = equipo!.Id
        });
        senRes.StatusCode.Should().Be(HttpStatusCode.Created);

        // Filtro por equipo.
        var filtered = await _client.GetFromJsonAsync<SensorDto[]>($"/api/sensores/equipo/{equipo.Id}");
        filtered.Should().NotBeNull();
        filtered!.Should().Contain(s => s.NumeroSerie == "PSN-100" && s.EquipoId == equipo.Id);
    }

    [Fact]
    public async Task Sensores_Create_SinTipo_Returns400()
    {
        await AuthenticateAsync();

        var res = await _client.PostAsJsonAsync("/api/sensores", new
        {
            tipo = "",
            numero_serie = "X-1"
        });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
