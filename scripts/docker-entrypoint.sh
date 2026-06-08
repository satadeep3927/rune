#!/bin/bash
set -e

echo "=> Installing dependencies inside container..."
pnpm install --frozen-lockfile

echo "=> Executing: $@"
exec "$@"
