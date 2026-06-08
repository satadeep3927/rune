#!/bin/bash
set -e

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo -e "\e[36mBuilding Docker image rune-linux-builder...\e[0m"
docker build -t rune-linux-builder -f scripts/Dockerfile.builder scripts/

echo -e "\e[36mRunning container to build Linux binaries...\e[0m"
# We use named volumes for node_modules and target to prevent cross-os binary conflicts and improve IO speed
docker run --rm \
    -e TAURI_SIGNING_PRIVATE_KEY="$TAURI_SIGNING_PRIVATE_KEY" \
    -e TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$TAURI_SIGNING_PRIVATE_KEY_PASSWORD" \
    -v "$(pwd):/app" \
    -v rune_linux_node_modules:/app/node_modules \
    -v rune_linux_target:/app/src-tauri/target \
    -it rune-linux-builder

echo -e "\e[32mBuild complete! Check src-tauri/target/release/bundle/ for your binaries.\e[0m"
