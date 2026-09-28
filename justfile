default:
    @just --list

# npm ci when node_modules is missing or older than package.json / the lockfile
install:
    #!/usr/bin/env bash
    set -euo pipefail
    stamp=node_modules/.package-lock.json
    if [ ! -f "$stamp" ] || [ package.json -nt "$stamp" ] || [ package-lock.json -nt "$stamp" ]; then
        npm ci
    fi

# Build locally into dist/
build: install
    npm run build

# Serve the production build at http://localhost:4173/
preview: build
    npx vite preview

# Build to catch errors, push main, and wait for the Pages deploy
deploy: build
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -n "$(git status --porcelain)" ]; then
        echo "Uncommitted changes; Pages builds from the pushed commit. Commit first." >&2
        git status --short >&2
        exit 1
    fi
    git push origin main
    sleep 5
    gh run watch "$(gh run list --workflow pages.yml --branch main --limit 1 --json databaseId -q '.[0].databaseId')" --exit-status
    echo "Live: https://myran.github.io/winx-pixie-pop/"

# Redeploy the current main without a new commit
redeploy:
    gh workflow run pages.yml
    sleep 5
    gh run watch "$(gh run list --workflow pages.yml --event workflow_dispatch --limit 1 --json databaseId -q '.[0].databaseId')" --exit-status
    @echo "Live: https://myran.github.io/winx-pixie-pop/"
