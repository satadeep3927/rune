# Ensure we are in the project root
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Set-Location $ProjectRoot

Write-Host "Building Docker image rune-linux-builder..." -ForegroundColor Cyan
docker build -t rune-linux-builder -f scripts/Dockerfile.builder scripts/

Write-Host "Running container to build Linux binaries..." -ForegroundColor Cyan
# We use named volumes for node_modules and target to prevent Windows/Linux binary conflicts and improve IO speed
docker run --rm `
    -e TAURI_SIGNING_PRIVATE_KEY=$env:TAURI_SIGNING_PRIVATE_KEY `
    -e TAURI_SIGNING_PRIVATE_KEY_PASSWORD=$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD `
    -v "${PWD}:/app" `
    -v rune_linux_node_modules:/app/node_modules `
    -v rune_linux_target:/app/src-tauri/target `
    -it rune-linux-builder

Write-Host "Extracting Linux bundles to local filesystem..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path src-tauri/target/release/bundle/linux | Out-Null
docker run --rm -v rune_linux_target:/target -v "${PWD}/src-tauri/target/release/bundle/linux:/host" alpine sh -c "cp -r /target/release/bundle/* /host/"

Write-Host "Build complete! Check src-tauri/target/release/bundle/ for your binaries." -ForegroundColor Green
