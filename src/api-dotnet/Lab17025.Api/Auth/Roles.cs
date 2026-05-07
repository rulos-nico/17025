namespace Lab17025.Api.Auth;

/// <summary>
/// Roles del sistema (paridad con frontend legacy `src/config.ts` y backend Rust).
/// Centralizado para evitar repetir literales en cada controller.
/// </summary>
public static class Roles
{
    public const string Admin        = "ADMIN";
    public const string Coordinador  = "COORDINADOR";
    public const string Tecnico      = "TECNICO";
    public const string Cliente      = "CLIENTE";
    public const string Diseno       = "DISENO";

    /// <summary>Roles autorizados a mutar catálogos y entidades de operación.</summary>
    public const string Write = Admin + "," + Coordinador;
}
