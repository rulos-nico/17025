# =============================================================================
# Makefile - Comandos de conveniencia para desarrollo con Docker
# =============================================================================

COMPOSE_DEV = docker compose -f docker/docker-compose.dev.yml
COMPOSE_PROD = docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml

# Colores para output
GREEN  = \033[0;32m
YELLOW = \033[0;33m
RED    = \033[0;31m
NC     = \033[0m # No Color

.PHONY: help dev dev-full dev-monitoring dev-db down down-clean \
        logs logs-api logs-frontend logs-db \
        restart-api restart-frontend rebuild-api rebuild-frontend \
        db-shell db-dump status health build prod

# -------------------------------------------
# Ayuda
# -------------------------------------------
help: ## Mostrar esta ayuda
	@echo "$(GREEN)Lab 17025 - Comandos de desarrollo$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# -------------------------------------------
# Desarrollo
# -------------------------------------------
dev: ## Levantar servicios core (DB + API + Frontend)
	$(COMPOSE_DEV) up -d
	@echo "$(GREEN)Stack de desarrollo levantado$(NC)"
	@echo "  Frontend: http://localhost:5173"
	@echo "  API:      http://localhost:3000"
	@echo "  DB:       localhost:5434"

dev-full: ## Levantar todo (core + monitoreo + admin DB)
	$(COMPOSE_DEV) --profile monitoring --profile dbadmin up -d
	@echo "$(GREEN)Stack completo levantado$(NC)"
	@echo "  Frontend:   http://localhost:5173"
	@echo "  API:        http://localhost:3000"
	@echo "  DB:         localhost:5434"
	@echo "  Adminer:    http://localhost:8080"
	@echo "  Grafana:    http://localhost:3001 (admin/admin)"
	@echo "  Prometheus: http://localhost:9090"

dev-monitoring: ## Levantar core + monitoreo (Prometheus, Grafana, Loki)
	$(COMPOSE_DEV) --profile monitoring up -d

dev-db: ## Levantar core + Adminer (panel de DB)
	$(COMPOSE_DEV) --profile dbadmin up -d

# -------------------------------------------
# Detener
# -------------------------------------------
down: ## Detener todos los servicios
	$(COMPOSE_DEV) --profile monitoring --profile dbadmin down

down-clean: ## Detener y eliminar volumenes (CUIDADO: borra datos)
	$(COMPOSE_DEV) --profile monitoring --profile dbadmin down -v
	@echo "$(RED)Volumenes eliminados (incluida la base de datos)$(NC)"

# -------------------------------------------
# Logs
# -------------------------------------------
logs: ## Ver logs de todos los servicios (follow)
	$(COMPOSE_DEV) logs -f

logs-api: ## Ver logs del API
	$(COMPOSE_DEV) logs -f api

logs-frontend: ## Ver logs del frontend
	$(COMPOSE_DEV) logs -f frontend

logs-db: ## Ver logs de PostgreSQL
	$(COMPOSE_DEV) logs -f db

# -------------------------------------------
# Gestion de servicios
# -------------------------------------------
restart-api: ## Reiniciar solo el API
	$(COMPOSE_DEV) restart api

restart-frontend: ## Reiniciar solo el frontend
	$(COMPOSE_DEV) restart frontend

rebuild-api: ## Rebuild y reiniciar el API (tras cambiar Cargo.toml)
	$(COMPOSE_DEV) up -d --build api

rebuild-frontend: ## Rebuild y reiniciar frontend (tras cambiar package.json)
	$(COMPOSE_DEV) up -d --build frontend

# -------------------------------------------
# Base de datos
# -------------------------------------------
db-shell: ## Conectarse a psql en el container
	docker exec -it lab17025-dev-db psql -U lab17025 -d lab17025

db-dump: ## Exportar dump de la base de datos
	docker exec lab17025-dev-db pg_dump -U lab17025 lab17025 > dump_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Dump creado$(NC)"

# -------------------------------------------
# Estado
# -------------------------------------------
status: ## Ver estado de todos los containers
	$(COMPOSE_DEV) --profile monitoring --profile dbadmin ps

health: ## Ver health checks de los servicios
	@echo "$(YELLOW)Health status:$(NC)"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' lab17025-dev-db 2>/dev/null || echo "  db: not running"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' lab17025-dev-api 2>/dev/null || echo "  api: not running"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' lab17025-dev-frontend 2>/dev/null || echo "  frontend: not running"

# -------------------------------------------
# Produccion
# -------------------------------------------
build: ## Build imagenes de produccion
	docker compose -f docker/docker-compose.yml build

prod: ## Levantar stack de produccion
	$(COMPOSE_PROD) up -d
