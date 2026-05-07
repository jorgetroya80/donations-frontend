# PRD: End-User Setup Scripts and README Update

## Problem Statement

Two groups of people need to run the donations app locally, but the README does not serve either well:

1. **Frontend developers** are told "no environment variables required" — now incorrect after adding the Postgres service. They hit a broken setup with no guidance on the `.env` file.
2. **End users** (admins, treasurers, and other non-technical staff) have no supported way to run the app at all. The README assumes Node.js knowledge and git familiarity that most church staff do not have.

## Solution

Fix the developer section of the README to reflect the new `.env` requirement, and add a new end-user section backed by five shell scripts. End users run a single `curl` command to bootstrap everything, then use named scripts (`start.sh`, `stop.sh`, `update.sh`, `reset.sh`) for day-to-day operation. The only prerequisite for end users is Docker.

## User Stories

1. As a frontend developer, I want the README to tell me to copy `.env.example` to `.env` before running the stack, so that I don't hit a broken setup with missing environment variables.
2. As a frontend developer, I want the README to remove the incorrect "no environment variables required" line, so that I am not misled about what the stack needs.
3. As a frontend developer, I want a clear table of `docker compose` commands in the README, so that I can stop, rebuild, update, and reset the stack without guessing.
4. As a church admin, I want to run a single command in my terminal to set up the app for the first time, so that I don't need to understand git, Node.js, or Docker Compose configuration.
5. As a church admin, I want the setup script to check that Docker is installed and give me a clear message if it isn't, so that I know exactly what to install before retrying.
6. As a church admin, I want the setup script to create a dedicated folder on my machine for the app files, so that my home directory stays organized.
7. As a church admin, I want the setup script to download all necessary configuration files automatically, so that I never have to manually locate or copy files from GitHub.
8. As a church admin, I want the setup script to create my local settings file only if one doesn't exist yet, so that re-running setup never overwrites my existing configuration.
9. As a church admin, I want the setup script to pre-download the Docker images so that starting the app for the first time is fast, so that I don't sit waiting for a download on first launch.
10. As a church admin, I want the setup script to also download the other management scripts, so that I have everything I need after running setup once.
11. As a church admin, I want to run `./scripts/start.sh` to start the app, so that I don't need to remember Docker Compose commands.
12. As a church admin, I want `start.sh` to run the app in the background (detached), so that I can close the terminal window without stopping the app.
13. As a church admin, I want `start.sh` to print the URL where the app is running, so that I know where to open my browser.
14. As a church admin, I want to run `./scripts/stop.sh` to stop the app, so that I can shut it down without losing my data.
15. As a church admin, I want `stop.sh` to confirm that data is preserved after stopping, so that I don't worry about losing records.
16. As a church admin, I want to run `./scripts/update.sh` to get the latest version of the app, so that I benefit from bug fixes and new features without reinstalling everything.
17. As a church admin, I want `update.sh` to restart the app automatically after updating, so that I don't need to manually start it again.
18. As a church admin, I want to run `./scripts/reset.sh` to wipe the database and start fresh, so that I can recover from a corrupted state or start a new financial period cleanly.
19. As a church admin, I want `reset.sh` to warn me and give me time to cancel before deleting data, so that I don't accidentally lose records.
20. As a church admin, I want the README end-user section to be written in plain language without developer jargon, so that I can follow it without technical knowledge.
21. As a church admin, I want the README to list all available scripts and what they do in a simple table, so that I can quickly find the command I need.

## Implementation Decisions

### README changes

- Add "Running the App (End Users)" section placed before the developer "Getting Started" section — different audience, higher priority for most visitors.
- Section contains: single `curl | bash` setup command, link to Docker install page as the only prerequisite, table of scripts and their plain-language descriptions.
- Fix "Running Locally (Full Stack)" section: insert `cp .env.example .env` as step 1, remove the now-incorrect "no environment variables required" sentence, add a reference table of `docker compose` commands.

### `scripts/setup.sh`

- Verify Docker is installed; print an actionable error and exit if not.
- Create `~/donations/` as the working directory for end-user files.
- Download `docker-compose.yml` and `.env.example` from the raw GitHub URL into `~/donations/`.
- Copy `.env.example` → `.env` only when `.env` does not already exist — never overwrite.
- Download all four remaining scripts into `~/donations/scripts/` and mark them executable.
- Run `docker compose pull` to pre-fetch images.
- Print a success message with the next step (`./scripts/start.sh`).

### `scripts/start.sh`

- Run `docker compose up -d` (detached mode).
- Print the app URL: `http://localhost:8080`.

### `scripts/stop.sh`

- Run `docker compose down`.
- Print confirmation that data is preserved.

### `scripts/update.sh`

- Run `docker compose pull` to fetch latest images.
- Run `docker compose up -d` to restart with new images.
- Print confirmation.

### `scripts/reset.sh`

- Print a clear data-loss warning.
- Sleep 5 seconds to give the user time to press `Ctrl+C`.
- Run `docker compose down -v` to remove containers and the named volume.
- Run `docker compose up -d` to start fresh.
- Print the app URL.

### Script delivery

- All scripts committed to the `scripts/` folder in this repository.
- `setup.sh` is the entry point delivered via `curl -fsSL <raw-url> | bash`.
- `setup.sh` downloads the other scripts so the end user never needs to interact with the repo directly after setup.

## Testing Decisions

Shell scripts have no automated test suite in this codebase. Manual verification is the testing strategy:

- Run `curl | bash` on a machine with Docker installed and confirm `~/donations/` is created with all expected files.
- Run `setup.sh` a second time and confirm `.env` is not overwritten.
- Run `setup.sh` without Docker installed and confirm the error message is clear and the script exits cleanly.
- Run each script in sequence (`start`, `stop`, `update`, `reset`) and verify the described behavior.
- Verify `reset.sh` cancellable by pressing `Ctrl+C` during the 5-second wait.

## Out of Scope

- Windows or macOS-native (non-Docker) installation paths.
- GUI installer or packaged app (e.g. Electron).
- Automated script testing (shell unit tests).
- Multi-user or networked deployment (scripts target a single local machine).
- Custom `.env` values beyond the defaults — scripts use defaults that work out of the box.
- Uninstall script.

## Further Notes

- The `curl | bash` pattern has known security implications. Since this is an internal church tool from a known GitHub repository, the risk is acceptable. The README should note that users should verify the URL matches the official repository before running.
- Scripts assume `docker-compose.yml` lives one level above the `scripts/` directory, i.e. `~/donations/docker-compose.yml` with scripts at `~/donations/scripts/`.
- If the user already has port 8080 or 5432 in use, Docker Compose will fail with a port conflict. This is out of scope for the scripts but worth noting in the README troubleshooting section in a future iteration.
