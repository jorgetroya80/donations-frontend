# Plan: End-User Setup Scripts and README Update

> Source PRD: docs/PRD-end-user-setup.md

## Architectural decisions

- **Script location**: `scripts/` folder in repo root, committed and executable.
- **End-user working dir**: `~/donations/` — setup.sh creates this and downloads all files there.
- **Script delivery**: `setup.sh` is the curl entry point; it downloads the other 4 scripts into `~/donations/scripts/`.
- **Docker mode**: all scripts use detached mode (`docker compose up -d`) so the app runs in background.
- **No-overwrite rule**: setup.sh never overwrites an existing `.env` file.
- **Raw GitHub URLs**: scripts download files from `raw.githubusercontent.com/jorgetroya80/donations-frontend/main/`.

---

## Phase 1: Fix developer README

**User stories**: 1, 2, 3

### What to build

Update the existing "Running Locally (Full Stack)" section in `README.md`:
- Add `cp .env.example .env` as step 1 before `docker compose up --build`
- Note that defaults work out of the box — no edits needed
- Remove the now-incorrect "The API image is always pulled fresh from Docker Hub on each `up`. No environment variables required." sentence
- Add a reference table of `docker compose` commands (up --build, down, down -v, pull)

### Acceptance criteria

- [ ] README "Running Locally" section includes `cp .env.example .env` as the first step
- [ ] The "no environment variables required" line is gone
- [ ] A docker compose command table is present with at minimum: `up --build`, `down`, `down -v`, `pull`
- [ ] `docker compose up --build` still works correctly after following the updated instructions

---

## Phase 2: Management scripts

**User stories**: 11, 12, 13, 14, 15, 16, 17, 18, 19

### What to build

Create four scripts in `scripts/` — each does one operation and prints a plain-language confirmation:

- `start.sh` — runs `docker compose up -d`, prints `http://localhost:8080`
- `stop.sh` — runs `docker compose down`, confirms data is preserved
- `update.sh` — runs `docker compose pull` then `docker compose up -d`, confirms update
- `reset.sh` — prints data-loss warning, sleeps 5s for cancellation, runs `docker compose down -v` then `docker compose up -d`, prints app URL

All scripts must be marked executable (`chmod +x`). Each script operates relative to the directory where `docker-compose.yml` lives (one level above `scripts/`).

### Acceptance criteria

- [ ] `./scripts/start.sh` starts all services in detached mode and prints `http://localhost:8080`
- [ ] `./scripts/stop.sh` stops the stack and confirms data is preserved
- [ ] `./scripts/update.sh` pulls latest images and restarts the stack
- [ ] `./scripts/reset.sh` prints warning, waits 5s, wipes volume, restarts stack, prints app URL
- [ ] `Ctrl+C` during `reset.sh` wait cancels the operation without data loss
- [ ] All four scripts are executable (`ls -la scripts/` shows `x` bit set)

---

## Phase 3: Setup script + end-user README section

**User stories**: 4, 5, 6, 7, 8, 9, 10, 20, 21

### What to build

Create `scripts/setup.sh` — the curl entry point for end users:
- Check Docker is installed; print actionable error and exit if not
- Create `~/donations/` directory
- Download `docker-compose.yml` and `.env.example` from raw GitHub into `~/donations/`
- Copy `.env.example` → `.env` only if `.env` does not already exist
- Download all four management scripts into `~/donations/scripts/` and mark them executable
- Run `docker compose pull` to pre-fetch images
- Print success message and next step: `./scripts/start.sh`

Add "Running the App (End Users)" section to `README.md`, placed before the developer "Getting Started" section:
- Single `curl -fsSL ... | bash` command as the entry point
- Docker as the only prerequisite (with install link)
- Plain-language numbered steps
- Table of scripts and their plain-language descriptions
- Security note: verify URL matches official repository before running

### Acceptance criteria

- [ ] Running `curl -fsSL <raw-url>/scripts/setup.sh | bash` on a clean machine with Docker creates `~/donations/` with `docker-compose.yml`, `.env`, `.env.example`, and all four scripts
- [ ] Running setup a second time does not overwrite an existing `.env`
- [ ] Running setup without Docker installed exits with a clear, actionable error message
- [ ] `docker compose pull` runs during setup and pre-fetches all images
- [ ] README has a new "Running the App (End Users)" section before "Getting Started"
- [ ] README section contains the `curl` command, script table, and security note
- [ ] After setup, `./scripts/start.sh` brings the app up at `http://localhost:8080`
