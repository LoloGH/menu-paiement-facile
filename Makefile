# Deployment shortcuts for the VPS.
# The front-end is served by Apache from disk; only the API runs in Docker.

COMPOSE := docker compose -f infra/docker-compose.yml
WEB_ROOT ?= /var/www/menu

.PHONY: help deploy build-web api-up api-down api-logs migrate seed-admin backup ps

help:
	@grep -E '^[a-z-]+:.*?##' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  %-12s %s\n", $$1, $$2}'

deploy: build-web api-up ## Build the front-end, publish it, rebuild and restart the API
	@echo "Déploiement terminé."

build-web: ## Build the SPA and publish it where Apache serves it
	npm ci
	npm run build -w @menu/shared
	npm run build -w @menu/web
	install -d $(WEB_ROOT)
	# --delete removes assets from the previous build; index.html is written
	# last so a visitor never gets a page referencing chunks that are gone.
	rsync -a --delete --exclude index.html apps/web/dist/ $(WEB_ROOT)/
	install -m 644 apps/web/dist/index.html $(WEB_ROOT)/index.html

api-up: ## Rebuild and restart the API container (migrations run on start)
	$(COMPOSE) up -d --build

api-down: ## Stop the stack
	$(COMPOSE) down

api-logs: ## Follow the API logs
	$(COMPOSE) logs -f api

migrate: ## Apply migrations without restarting
	$(COMPOSE) exec api node apps/api/dist/db/migrate.js

seed-admin: ## Create the first administrator
	$(COMPOSE) exec -it api node apps/api/dist/scripts/seed-admin.js

backup: ## Dump the database now
	./infra/backup.sh

ps: ## Show container status
	$(COMPOSE) ps
