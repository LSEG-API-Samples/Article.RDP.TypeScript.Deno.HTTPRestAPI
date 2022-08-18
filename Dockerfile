ARG DENO_VERSION=1.24.3
ARG VARIANT=alpine
FROM denoland/deno:${VARIANT}-${DENO_VERSION}

LABEL maintainer="Developer Advocate"

# Create app directory
WORKDIR /app

# Copy source code
COPY src ./src

# Run application
ENTRYPOINT [ "deno", "run", "--allow-env", "--allow-net", "./src/main.ts"]

