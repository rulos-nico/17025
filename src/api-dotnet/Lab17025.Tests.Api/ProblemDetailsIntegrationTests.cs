using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.MsSql;
using Xunit;

namespace Lab17025.Tests.Api;

/// <summary>
/// Tests del pipeline de errores de la Sub-fase A.2:
///   * ProblemDetails RFC 7807 con title/status/type/instance.
///   * traceId y correlationId en extensions.
///   * Header X-Correlation-Id propagado (entrante respetado, saliente generado).
/// </summary>
public sealed class ProblemDetailsIntegrationTests : IAsyncLifetime
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
        var connStr = _mssql.GetConnectionString().Replace("Database=master", "Database=lab17025_pd_test");

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

    [Fact]
    public async Task Unauthorized_Returns_ProblemDetails_With_TraceId()
    {
        var res = await _client.GetAsync("/api/equipos");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        res.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetInt32().Should().Be(401);
        json.GetProperty("title").GetString().Should().NotBeNullOrEmpty();
        json.GetProperty("traceId").GetString().Should().NotBeNullOrEmpty();
        json.GetProperty("instance").GetString().Should().Be("/api/equipos");
        json.GetProperty("type").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task BadLogin_Returns_ProblemDetails_With_CorrelationId_From_Caller()
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/auth/login")
        {
            Content = JsonContent.Create(new { email = "demo@ingetec.cl", password = "wrong" })
        };
        req.Headers.Add("X-Correlation-Id", "caller-corr-123");

        var res = await _client.SendAsync(req);
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // El correlation-id que envió el cliente debe respetarse en respuesta y body.
        res.Headers.GetValues("X-Correlation-Id").Single().Should().Be("caller-corr-123");

        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("correlationId").GetString().Should().Be("caller-corr-123");
    }

    [Fact]
    public async Task NoCorrelationIdHeader_Generates_One_In_Response()
    {
        var res = await _client.GetAsync("/health");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        res.Headers.GetValues("X-Correlation-Id").Single().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task NotFound_Equipo_Returns_404_ProblemDetails()
    {
        // Login primero
        var login = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "demo@ingetec.cl", password = "demo1234"
        });
        login.EnsureSuccessStatusCode();
        var token = (await login.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("access_token").GetString()!;
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var res = await _client.GetAsync($"/api/equipos/{Guid.NewGuid()}");
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
        // StatusCodePages convierte 404 sin body en ProblemDetails.
        res.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetInt32().Should().Be(404);
        json.GetProperty("traceId").GetString().Should().NotBeNullOrEmpty();
    }
}
