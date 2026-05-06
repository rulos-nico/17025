# Lab 17025 — PoC Stack .NET 9 + Vue 3 + SQL Server

Proof-of-concept de la migración del proyecto desde Rust/Axum + React + PostgreSQL hacia
**ASP.NET Core 9 + Dapper + DbUp + Vue 3 + SQL Server 2022**.

Scope de la PoC: módulo **Equipos** + autenticación con JWT (login + me).
El resto de módulos se portará en fases posteriores.

## Estructura

```
src/api-dotnet/
├── Lab17025.sln
├── Lab17025.Api/                 # ASP.NET Core 9 (controllers, DI, JWT, Swagger)
│   ├── Auth/                     # JwtTokenService, PasswordHasher
│   ├── Controllers/              # AuthController, EquiposController
│   ├── Domain/                   # Equipo, Usuario
│   ├── Dtos/                     # DTOs con JsonPropertyName snake_case
│   ├── Repositories/             # Dapper repos + ISqlConnectionFactory
│   ├── Program.cs
│   ├── appsettings.json
│   └── appsettings.Development.json
├── Lab17025.Migrations/          # DbUp + scripts T-SQL embebidos
│   └── Scripts/
│       ├── 001_initial_schema.sql
│       ├── 002_add_equipo_id_to_sensores.sql
│       ├── 003_seed_equipos_demo.sql
│       └── 004_add_usuarios_table.sql
└── Lab17025.Tests.Api/           # xUnit + Testcontainers SQL Server

src/web-vue/                      # Vite + Vue 3 + TS + Pinia + TanStack Query
├── src/
│   ├── api/                      # axios client + endpoints tipados
│   ├── composables/              # useEquiposData (TanStack Query)
│   ├── stores/                   # auth (Pinia)
│   ├── pages/                    # Login, Equipos, Dashboard
│   ├── components/               # Sidebar, PageLayout
│   └── router/
├── package.json
└── vite.config.ts

docker/
├── Dockerfile.dotnet.api
├── Dockerfile.vue
├── nginx.vue.conf
└── docker-compose.dotnet.dev.yml
```

## Requisitos

- .NET 9 SDK ([download](https://dotnet.microsoft.com/download/dotnet/9.0))
- Node 20+
- Docker + Docker Compose (para correr SQL Server)

## Arranque rápido — Docker (recomendado)

```bash
docker compose -f docker/docker-compose.dotnet.dev.yml up --build
```

Servicios:

- SQL Server 2022: `localhost:1433` (sa / `ChangeMe!Dev123`)
- API .NET: http://localhost:5080 (Swagger: http://localhost:5080/swagger)
- Web Vue: http://localhost:5173

Las migraciones DbUp se ejecutan automáticamente al arrancar el API.

## Arranque local (sin Docker para API/Web)

### 1. Levantar SQL Server (solo el contenedor)

```bash
docker run -d --name lab17025-mssql \
  -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='ChangeMe!Dev123' -e MSSQL_PID=Developer \
  -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
```

### 2. Backend .NET

```bash
cd src/api-dotnet
dotnet restore
dotnet run --project Lab17025.Api
```

API queda en http://localhost:5080. Swagger en `/swagger`.

### 3. Frontend Vue

```bash
cd src/web-vue
npm install
npm run dev
```

Vite dev server en http://localhost:5173 con proxy `/api` → `localhost:5080`.

## Credenciales demo

- email: `demo@ingetec.cl`
- password: `demo1234`

> ⚠️ El hash es SHA-256 hex sin salt (placeholder PoC).
> Reemplazar por **BCrypt** en producción.

## Tests

```bash
cd src/api-dotnet
dotnet test
```

Los tests usan Testcontainers para levantar SQL Server real. Requieren Docker en marcha.

Cobertura PoC:

- Login válido → 200 + token
- Login inválido → 401
- `GET /api/equipos` sin token → 401
- Ciclo CRUD completo de Equipo (list, create, update, get, soft-delete)

## Endpoints implementados

| Método | Ruta              | Auth | Descripción          |
| ------ | ----------------- | ---- | -------------------- |
| POST   | /api/auth/login   | —    | Login email+password |
| GET    | /api/auth/me      | ✓    | Info usuario actual  |
| GET    | /api/equipos      | ✓    | Lista de equipos     |
| GET    | /api/equipos/{id} | ✓    | Equipo por id        |
| POST   | /api/equipos      | ✓    | Crear equipo         |
| PUT    | /api/equipos/{id} | ✓    | Actualizar equipo    |
| DELETE | /api/equipos/{id} | ✓    | Soft delete          |
| GET    | /health           | —    | Healthcheck          |
| GET    | /metrics          | —    | Prometheus metrics   |

## Convenciones de diseño

- **PKs**: `UNIQUEIDENTIFIER` (mapeado a `System.Guid` en C#) con `DEFAULT NEWSEQUENTIALID()`.
  Los códigos legibles (`EQ-BAL-001`, `EQP-20260101…`) viven en columnas separadas `codigo NVARCHAR(...) UNIQUE`.
- **Triggers `updated_at`**: por trigger AFTER UPDATE T-SQL. Ojo: SQL Server no permite
  `OUTPUT … INSERTED.*` sin `INTO` cuando la tabla tiene triggers, así que los repos
  que actualizan hacen `UPDATE` + `SELECT` en el mismo batch.
- **`DateOnly`**: Dapper aún no lo soporta nativamente; se registran `DateOnlyTypeHandler` y
  `NullableDateOnlyTypeHandler` en `Program.cs`.
- **JSON snake_case** para preservar contrato con el frontend Vue.

## Próximas fases

- **Fase 2**: portar 23 migraciones T-SQL restantes + repos/controllers de los 13 módulos.
- **Fase 3**: Google Drive/Sheets clients + scheduler `BackgroundService`.
- **Fase 4**: páginas Vue restantes + Gantt + ECharts + formularios.
- **Fase 5**: Docker prod + Grafana + Tailscale + paridad Postman en CI.

Estimación total: 56-76 días para 1 dev senior.
