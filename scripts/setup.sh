#!/usr/bin/env bash
set -euo pipefail

# Check Docker is installed
if ! command -v docker &>/dev/null; then
  echo "Docker is not installed. Please install it from https://www.docker.com/get-started and try again."
  exit 1
fi

INSTALL_DIR="$HOME/donations"

# Create install directory
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/scripts"

BASE_URL="https://raw.githubusercontent.com/jorgetroya80/donations-frontend/main"

# Download core files
echo "Downloading configuration files..."
curl -fsSL "$BASE_URL/docker-compose.yml" -o "$INSTALL_DIR/docker-compose.yml"
curl -fsSL "$BASE_URL/.env.example" -o "$INSTALL_DIR/.env.example"

# Copy .env only if it does not already exist
if [ ! -f "$INSTALL_DIR/.env" ]; then
  cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
else
  echo "Existing .env file kept — not overwritten."
fi

# Download management scripts
echo "Downloading management scripts..."
for script in start.sh stop.sh update.sh reset.sh; do
  curl -fsSL "$BASE_URL/scripts/$script" -o "$INSTALL_DIR/scripts/$script"
  chmod +x "$INSTALL_DIR/scripts/$script"
done

# Pull Docker images
echo "Pulling Docker images..."
cd "$INSTALL_DIR" && docker compose pull

echo ""
echo "Setup complete! To start the app, run:"
echo "  cd ~/donations && ./scripts/start.sh"
echo ""
echo "Then open http://localhost:8080 in your browser."
