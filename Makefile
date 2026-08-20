# Deployment for the VPS.
#
# Two environments live side by side on the same machine, told apart by the env
# file they read:
#
#   make deploy              # production, reads infra/.env
#   make deploy ENV=staging  # pre-production, reads infra/.env.staging
#
# Each has its own Docker project, so its own containers, network and database
# volume. The front-end is served by Apache from disk; only the API is in Docker.

ENV ?= production

ifeq ($(ENV),production)
  ENV_FILE := infra/.env
else
  ENV_FILE := infra/.env.$(ENV)
endif

COMPOSE := docker compose --env-file $(ENV_FILE) -f infra/docker-compose.yml
# Read straight from the env file so a target cannot act on the wrong
# environment because a variable was exported in the shell.
WEB_ROOT := $(shell grep -E '^WEB_ROOT=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-)
BASE_URL := $(shell grep -E '^PUBLIC_ORIGIN=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-)

.PHONY: help check-env deploy build-web api-up api-down api-logs migrate seed-admin backup smoke ps

help:
	@grep -E '^[a-z-]+:.*?##' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  %-12s %s\n", $$1, $$2}'
	@echo ""
	@echo "  Ajouter ENV=staging pour viser la préproduction."

check-env:
	@test -f $(ENV_FILE) || { echo "fichier d'environnement absent : $(ENV_FILE)"; exit 1; }
	@test -n "$(WEB_ROOT)" || { echo "WEB_ROOT non défini dans $(ENV_FILE)"; exit 1; }
	@echo "environnement : $(ENV)  ·  $(ENV_FILE)  ·  $(WEB_ROOT)  ·  $(BASE_URL)"

deploy: check-env build-web api-up ## Build and publish the front-end, rebuild and restart the API
	@echo "Déploiement $(ENV) terminé. Vérifiez avec : make smoke ENV=$(ENV)"

build-web: check-env ## Build the SPA and publish it where Apache serves it
	npm ci
	npm run build -w @menu/shared
	npm run build -w @menu/web
	install -d $(WEB_ROOT)
	# --delete removes assets from the previous build; index.html is written
	# last so a visitor never gets a page referencing chunks that are gone.
	rsync -a --delete --exclude index.html apps/web/dist/ $(WEB_ROOT)/
	install -m 644 apps/web/dist/index.html $(WEB_ROOT)/index.html

api-up: check-env ## Rebuild and restart the API container (migrations run on start)
	$(COMPOSE) up -d --build

api-down: check-env ## Stop the stack
	$(COMPOSE) down

api-logs: check-env ## Follow the API logs
	$(COMPOSE) logs -f api

migrate: check-env ## Apply migrations without restarting
	$(COMPOSE) exec api node apps/api/dist/db/migrate.js

seed-admin: check-env ## Create the first administrator
	$(COMPOSE) exec -it api node apps/api/dist/scripts/seed-admin.js

backup: check-env ## Dump the database now
	ENV_FILE=$(ENV_FILE) ./infra/backup.sh

smoke: check-env ## Check a deployed instance end to end
	./infra/smoke-test.sh $(BASE_URL)

ps: check-env ## Show container status
	$(COMPOSE) ps
