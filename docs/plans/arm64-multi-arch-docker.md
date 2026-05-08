# Plan: ARM64 / Multi-Arch Docker Support

> Source PRD: Fix `setup.sh` failure on Apple Silicon Macs and ARM Windows due to missing `linux/arm64` manifest

## Architectural decisions

- **Image registry**: Docker Hub — `jorgetroya/donations-frontend`
- **CI build tool**: `docker/build-push-action` with `docker/setup-buildx-action` (already in workflow)
- **Compose workaround pattern**: `platform: linux/amd64` — already used by `api` service

---

## Phase 1: Compose platform workaround

**User stories**: ARM64 user runs `setup.sh` and gets `no matching manifest for linux/arm64/v8` error

### What to build

Add `platform: linux/amd64` to the `frontend` service in `docker-compose.yml`. This mirrors the existing pattern on the `api` service and instructs Docker to pull the amd64 image on ARM hosts (runs via Rosetta/QEMU emulation). No rebuild or new release needed — the fix takes effect as soon as the updated `docker-compose.yml` is on the main branch, because `setup.sh` downloads it fresh from GitHub each run.

### Acceptance criteria

- [ ] `frontend` service in `docker-compose.yml` has `platform: linux/amd64`
- [ ] Running `setup.sh` on Apple Silicon Mac completes without manifest error
- [ ] App loads at `http://localhost:8080` after setup on ARM host

---

## Phase 2: Multi-arch CI build

**User stories**: ARM64 users get native (non-emulated) performance; Docker Hub manifest includes both amd64 and arm64

### What to build

Add `linux/arm64` to the `platforms` field in `.github/workflows/docker-publish.yml`. `docker/setup-buildx-action` is already present so buildx multi-arch is ready. Next release will push a manifest list containing both `linux/amd64` and `linux/arm64` images. After this ships, the `platform: linux/amd64` override on the `frontend` service in `docker-compose.yml` can be removed (arm64 image will be natively available).

### Acceptance criteria

- [ ] `platforms` in `docker-publish.yml` is `linux/amd64,linux/arm64`
- [ ] After next release, Docker Hub shows both amd64 and arm64 manifests for `jorgetroya/donations-frontend`
- [ ] ARM64 host pulls and runs native arm64 image (no emulation layer)
- [ ] `platform: linux/amd64` override removed from `frontend` service in `docker-compose.yml`
