# Default execution image for Forge sandboxes. Built once; containers run it
# read-only, as a non-root user, with no network unless explicitly allowlisted.
FROM python:3.12-slim-bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends git procps ca-certificates build-essential \
 && rm -rf /var/lib/apt/lists/* \
 && pip install --no-cache-dir pytest

# Fallback identity. Sandboxes normally run with --user set to the host uid so
# the bind-mounted workspace is writable; either way never root.
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin forge \
 && mkdir -p /workspace && chown 10001:10001 /workspace

ENV HOME=/tmp \
    LANG=C.UTF-8 \
    PYTHONDONTWRITEBYTECODE=1

USER 10001:10001
WORKDIR /workspace
