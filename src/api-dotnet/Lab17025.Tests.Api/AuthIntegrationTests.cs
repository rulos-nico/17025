using FluentAssertions;
using Lab17025.Api.Auth;
using Lab17025.Api.Dtos;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Testcontainers.MsSql;
using Xunit;
using System.Net;
using System.Net.Http.Json;

namespace Lab17025.Tests.Api;

/// <summary>
/// Tests del flujo de autenticación A.1: refresh, logout, Google (mock).
/// Comparten contenedor MSSQL con EquiposIntegrationTests cuando ambos
/// xUnit collections corren — para evitarlo cada clase usa su propia DB.
/// </summary>
public sealed class AuthIntegrationTests : IAsyncLifetime
{
    private readonly MsSqlContainer _mssql = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .WithPassword("Strong!Passw0rd")
        .Build();

    private WebApplicationFactory<Program>? _factory;
    private HttpClient _client = default!;
    private FakeGoogleValidator _fakeGoogle = default!;

    public async Task InitializeAsync()
    {
        await _mssql.StartAsync();
        var connStr = _mssql.GetConnectionString().Replace("Database=master", "Database=lab17025_auth_test");
        _fakeGoogle = new FakeGoogleValidator();

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
                    ["Jwt:Audience"] = "lab-17025-test",
                    ["Jwt:RefreshExpirationDays"] = "30"
                });
            });
            b.ConfigureServices(services =>
            {
                // Reemplaza el validator real por el fake.
                var d = services.Single(s => s.ServiceType == typeof(IGoogleTokenValidator));
                services.Remove(d);
                services.AddSingleton<IGoogleTokenValidator>(_fakeGoogle);
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

    private async Task<LoginResponseDto> LoginDemoAsync()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "demo@ingetec.cl",
            password = "demo1234"
        });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await res.Content.ReadFromJsonAsync<LoginResponseDto>())!;
    }

    [Fact]
    public async Task Login_ReturnsAccessAndRefresh()
    {
        var pair = await LoginDemoAsync();
        pair.AccessToken.Should().NotBeNullOrEmpty();
        pair.RefreshToken.Should().NotBeNullOrEmpty();
        pair.RefreshExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);
        pair.User.Rol.Should().Be("ADMIN"); // DemoSeeder eleva a ADMIN
    }

    [Fact]
    public async Task Refresh_RotatesToken_AndOldOneIsRejected()
    {
        var pair1 = await LoginDemoAsync();

        var res = await _client.PostAsJsonAsync("/api/auth/refresh", new
        {
            refresh_token = pair1.RefreshToken
        });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var pair2 = (await res.Content.ReadFromJsonAsync<LoginResponseDto>())!;
        pair2.RefreshToken.Should().NotBe(pair1.RefreshToken);

        // Reuse del refresh viejo → 401
        var reuse = await _client.PostAsJsonAsync("/api/auth/refresh", new
        {
            refresh_token = pair1.RefreshToken
        });
        reuse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // Y al reusar también revoca el nuevo (política familia) → 401
        var afterReuse = await _client.PostAsJsonAsync("/api/auth/refresh", new
        {
            refresh_token = pair2.RefreshToken
        });
        afterReuse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_WithUnknownToken_Returns401()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/refresh", new
        {
            refresh_token = "totally-bogus"
        });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_RevokesRefreshToken()
    {
        var pair = await LoginDemoAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", pair.AccessToken);

        var logout = await _client.PostAsJsonAsync("/api/auth/logout", new
        {
            refresh_token = pair.RefreshToken
        });
        logout.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var refresh = await _client.PostAsJsonAsync("/api/auth/refresh", new
        {
            refresh_token = pair.RefreshToken
        });
        refresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GoogleLogin_CreatesUserAndIssuesPair()
    {
        _fakeGoogle.NextResult = new GoogleUserInfo
        {
            Id = "g-123",
            Email = "nuevo.user@ingetec.cl",
            VerifiedEmail = true,
            GivenName = "Nuevo",
            FamilyName = "User",
            Picture = "https://avatar/x.png"
        };

        var res = await _client.PostAsJsonAsync("/api/auth/google", new
        {
            access_token = "fake-google-token"
        });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var pair = (await res.Content.ReadFromJsonAsync<LoginResponseDto>())!;
        pair.User.Email.Should().Be("nuevo.user@ingetec.cl");
        pair.User.Rol.Should().Be("TECNICO"); // default para nuevos
        pair.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GoogleLogin_WithInvalidToken_Returns401()
    {
        _fakeGoogle.NextResult = null;
        var res = await _client.PostAsJsonAsync("/api/auth/google", new
        {
            access_token = "x"
        });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task EquiposWrite_AsTecnico_Returns403()
    {
        // 1) Crea usuario TECNICO vía Google y obtiene su JWT
        _fakeGoogle.NextResult = new GoogleUserInfo
        {
            Id = "g-tec",
            Email = "tec@ingetec.cl",
            VerifiedEmail = true,
            GivenName = "Tec",
            FamilyName = "Nico"
        };
        var res = await _client.PostAsJsonAsync("/api/auth/google", new { access_token = "x" });
        var pair = (await res.Content.ReadFromJsonAsync<LoginResponseDto>())!;
        pair.User.Rol.Should().Be("TECNICO");

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", pair.AccessToken);

        // 2) Lectura permitida
        var list = await _client.GetAsync("/api/equipos");
        list.StatusCode.Should().Be(HttpStatusCode.OK);

        // 3) Escritura denegada (403)
        var create = await _client.PostAsJsonAsync("/api/equipos", new
        {
            nombre = "X", serie = "S-1", estado = "operativo"
        });
        create.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private sealed class FakeGoogleValidator : IGoogleTokenValidator
    {
        public GoogleUserInfo? NextResult { get; set; }
        public Task<GoogleUserInfo?> ValidateAsync(string accessToken, CancellationToken ct = default)
            => Task.FromResult(NextResult);
    }
}
