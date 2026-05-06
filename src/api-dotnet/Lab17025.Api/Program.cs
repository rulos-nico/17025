using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dapper;
using Lab17025.Api.Auth;
using Lab17025.Api.Repositories;
using Lab17025.Migrations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Prometheus;
using Serilog;

// ----------------------------------------------------------------------------
// Bootstrap logger (Serilog) — reemplazado luego por configuración del host.
// ----------------------------------------------------------------------------
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ----- Serilog desde configuración -------------------------------------
    builder.Host.UseSerilog((ctx, services, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    // ----- Dapper: snake_case -> PascalCase ---------------------------------
    DefaultTypeMap.MatchNamesWithUnderscores = true;
    SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());
    SqlMapper.AddTypeHandler(new NullableDateOnlyTypeHandler());

    // ----- Configuración / opciones ----------------------------------------
    var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
        ?? throw new InvalidOperationException("Falta sección Jwt en configuración");
    if (string.IsNullOrWhiteSpace(jwtOptions.Secret) || jwtOptions.Secret.Length < 32)
        throw new InvalidOperationException("Jwt:Secret debe tener al menos 32 caracteres");

    var connectionString = builder.Configuration.GetConnectionString("SqlServer")
        ?? throw new InvalidOperationException("Falta ConnectionStrings:SqlServer");

    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:5173" };

    // ----- DI ---------------------------------------------------------------
    builder.Services.AddSingleton(jwtOptions);
    builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
    builder.Services.AddSingleton<ISqlConnectionFactory>(_ => new SqlConnectionFactory(connectionString));
    builder.Services.AddScoped<IEquipoRepository, EquipoRepository>();
    builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
    builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
    builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
    builder.Services.AddHttpClient(GoogleTokenValidator.HttpClientName, c =>
    {
        c.Timeout = TimeSpan.FromSeconds(8);
    });

    // ----- Controllers + JSON snake_case -----------------------------------
    builder.Services
        .AddControllers()
        .AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
            o.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;
        });

    builder.Services.AddProblemDetails();
    builder.Services.AddEndpointsApiExplorer();

    // ----- Swagger ----------------------------------------------------------
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Lab 17025 API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            In = ParameterLocation.Header,
            Description = "JWT Bearer token",
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });

    // ----- JWT --------------------------------------------------------------
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                ClockSkew = TimeSpan.FromSeconds(30)
            };
        });
    builder.Services.AddAuthorization();

    // ----- CORS -------------------------------------------------------------
    builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
        .WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    var app = builder.Build();

    // ----- Migraciones al arrancar -----------------------------------------
    var migrationLogger = app.Services.GetRequiredService<ILogger<Program>>();
    migrationLogger.LogInformation("Ejecutando migraciones DbUp...");
    var migrationResult = MigrationRunner.Run(connectionString, migrationLogger);
    if (!migrationResult.Successful)
    {
        migrationLogger.LogCritical("Migración falló: {Error}", migrationResult.ErrorMessage);
        throw new InvalidOperationException($"Migration failed: {migrationResult.ErrorMessage}");
    }
    migrationLogger.LogInformation("Migraciones aplicadas: {Count}", migrationResult.ScriptsApplied.Length);

    // ----- Seeder demo (BCrypt + rol ADMIN, idempotente) -------------------
    using (var scope = app.Services.CreateScope())
    {
        await Lab17025.Api.Bootstrap.DemoSeeder.EnsureAsync(
            scope.ServiceProvider, migrationLogger);
    }

    // ----- Pipeline ---------------------------------------------------------
    app.UseSerilogRequestLogging();
    app.UseExceptionHandler();
    app.UseStatusCodePages();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseRouting();
    app.UseCors();
    app.UseHttpMetrics(); // prometheus-net
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapMetrics(); // /metrics
    app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminó inesperadamente");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }
