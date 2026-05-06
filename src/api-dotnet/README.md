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
│   ├── Auth/                     # JwtTokenService (JWT+refresh), GoogleTokenValidator, PasswordHasher (BCrypt)
│   ├── Bootstrap/                # DemoSeeder (idempotente)
│   ├── Controllers/              # AuthController, EquiposController
│   ├── Domain/                   # Equipo, Usuario, RefreshToken
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
│       ├── 004_add_usuarios_table.sql
│       └── 005_refresh_tokens.sql
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
- rol: `ADMIN` (asignado por `DemoSeeder` en cada arranque)

> El hash en BD se genera/normaliza a **BCrypt (work factor 12)** automáticamente
> al arrancar (`DemoSeeder`). El SQL seed deja un placeholder; el seeder lo
> reescribe si detecta hash legacy o rol distinto a `ADMIN`. Idempotente.

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

| Método | Ruta                | Auth          | Descripción                                            |
| ------ | ------------------- | ------------- | ------------------------------------------------------ |
| POST   | /api/auth/login     | —             | Login email+password (BCrypt) → JWT + refresh          |
| POST   | /api/auth/google    | —             | Login con `access_token` Google → JWT + refresh        |
| POST   | /api/auth/refresh   | —             | Rota refresh token, emite nuevo par                    |
| POST   | /api/auth/logout    | ✓             | Revoca el refresh token enviado                        |
| GET    | /api/auth/me        | ✓             | Info usuario actual                                    |
| GET    | /api/equipos        | ✓             | Lista de equipos                                       |
| GET    | /api/equipos/{id}   | ✓             | Equipo por id                                          |
| POST   | /api/equipos        | ADMIN/COORD   | Crear equipo                                           |
| PUT    | /api/equipos/{id}   | ADMIN/COORD   | Actualizar equipo                                      |
| DELETE | /api/equipos/{id}   | ADMIN/COORD   | Soft delete                                            |
| GET    | /health             | —             | Healthcheck                                            |
| GET    | /metrics            | —             | Prometheus metrics                                     |

### Auth híbrido (Sub-fase A.1)

- **Login local (`/api/auth/login`)**: valida email + password contra BCrypt.
- **Login Google (`/api/auth/google`)**: el frontend obtiene un `access_token`
  de Google Identity Services y lo envía al backend; éste lo valida contra
  `https://www.googleapis.com/oauth2/v2/userinfo`. Si la cuenta no existe se
  crea con rol `TECNICO` por defecto (upsert por email).
- **Refresh tokens**: opacos (256 bits, base64-url). En BD se persiste solo el
  SHA-256 hex (`refresh_tokens.token_hash`). En cada `/refresh` el token viejo
  se marca `revoked_at` y se enlaza con el nuevo (`replaced_by`). Si llega un
  reuse de token revocado se revoca **toda la familia** del usuario (defensa
  contra robo).
- **Roles** propagados como claim `role` en el JWT. `[Authorize(Roles="…")]`
  en controllers.

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
