FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install System Dependencies required by Tauri
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libwebkit2gtk-4.1-dev \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config \
    nsis \
    xdg-utils \
    file \
    patchelf \
    && rm -rf /var/lib/apt/lists/*

# Fix for linuxdeploy failing inside Docker due to missing FUSE
ENV APPIMAGE_EXTRACT_AND_RUN=1

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Node.js v22 and pnpm 9
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm@9 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm", "tauri", "build"]
