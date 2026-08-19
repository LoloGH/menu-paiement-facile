#!/bin/sh
# Applies pending migrations, then starts the server. Running them here rather
# than in a separate step means a deploy can never leave the code ahead of the
# schema.
set -e
node apps/api/dist/db/migrate.js
exec node apps/api/dist/server.js
