# Forma · Enterprise EMS

A decoupled employee management monorepo with a Spring Boot/PostgreSQL API and independent Electron/React applications. The cream dashboard follows the provided absence-calendar reference, with soft shadows, self-hosted Plus Jakarta Sans, amber events, onboarding cards, and a blue glass workspace helper.

```text
ems-backend/           Java 21 · Spring Boot · PostgreSQL · Flyway
ems-admin-client/      React · Vite · Electron → Admin.exe
ems-employee-client/   React · Vite · Electron → Employee.exe
packages/shared/      Design system, types, API client, Zustand cache
scripts/              Setup, desktop builds, telemetry, capacity probe
tests/                Browser workflow tests
```

## Quick start

Requires Node 24+, npm, Java **JDK** 21, Docker with Compose, curl, and OpenSSL. Use this existing checkout; each cloud task already has an isolated workspace and does not need a Git worktree.

```bash
npm ci
npm run dev                 # admin browser workspace, port 5173
npm run dev:employee        # employee browser workspace, port 5174
```

The frontends default to an explicitly labelled, populated **demo workspace**. Demo changes persist in that browser only. The sample calendar uses December 2025 to match the supplied reference. No credentials or API are needed to review it.

## Live API and database

```bash
bash scripts/local-env.sh   # creates private .env; preserves an existing file
python scripts/maven-network.py  # cloud proxy support; optional on normal machines
docker compose up -d postgres
npm run api                # port 8080
```

`local-env.sh` generates random local database and JWT secrets. Credentials are never embedded in source. In the `demo` server profile, `emily@forma.team` is the administrator and `sophia@forma.team` is an employee. Their local password is the private `EMS_DEMO_PASSWORD` value in `.env`. Read it privately in your editor; do not commit or publish this file. Demo users are created only when the database is empty.

Connect each browser client to the live API by launching it with `VITE_API_URL=http://127.0.0.1:8080`. On PowerShell, set `$env:VITE_API_URL` first. This build-time setting enables password login and live data. Requests fail visibly rather than silently falling back to demo data. Tokens remain in memory and expire after one hour by default. Logging out revokes all current tokens for that account.

The Bash Maven launcher downloads Maven 3.9.11 and verifies its published SHA-512 digest. In this cloud environment it can activate the verified JDK under `/workspace/.tools`. On Windows, use an installed JDK 21 and `mvn -f ems-backend/pom.xml spring-boot:run` with the required process environment variables.

## Desktop applications and Windows executables

```bash
npm run desktop:admin
npm run desktop:employee
# For a live desktop development session, set both VITE_API_URL and EMS_API_URL.

EMS_API_URL=https://your-api.example.com npm run package:admin
EMS_API_URL=https://your-api.example.com npm run package:employee
```

PowerShell example: `$env:EMS_API_URL='https://your-api.example.com'; npm run package:admin`. Build scripts require an explicit API address so live installers cannot accidentally contain an unlabelled demo. Output installers are `release/admin/Admin.exe` and `release/employee/Employee.exe`. Package on Windows or in the official `electronuserland/builder:wine` Linux image. Windows x64 input-hook prebuilds ship with `uiohook-napi`. `EMS_UNSIGNED=1` produces unsigned local test installers; configure Electron Builder code-signing credentials privately for distribution. The GitHub workflow can create both Windows artifacts, but has not been executed on GitHub by this task.

Desktop renderers use a sandbox, context isolation, disabled Node integration, narrow IPC, blocked external navigation, and a production Content Security Policy. The employee hook runs in Electron's main process, outside React. Activity sharing is off by default, requires a live login and explicit consent, and stops on clock-out, sign-out, navigation, or application exit. It counts input events without recording key identities, typed content, screenshots, or browsing history. Mouse movements are sampled at most once per second. Aggregate JSON batches are sent every five minutes and queued locally for retries, isolated by user, bounded to 288 batches/two days. Database retention is 30 days.

Password login works on all supported platforms. Optional Touch ID is an existing-session unlock on supported macOS hardware. Windows Hello integration and actual OS hook execution on Windows/macOS require platform validation; they are not simulated.

## Validation

```bash
npm run typecheck
npm run build
npm test                   # 10 Chromium workflows; set CHROMIUM_PATH as needed
npm run test:api            # 7 API integration tests, including concurrent clock-in
npm audit
```

`npm test` uses `/usr/bin/chromium` by default in this environment. Tests exercise real interactions, persistence, downloads, mobile navigation, leave review, attendance, and onboarding. API tests cover JWT revocation, role restrictions, ownership, capped pagination, overlapping requests, atomic clock-in, telemetry validation/deduplication, and absent storage configuration. Tests use H2; normal development uses PostgreSQL and Flyway.

For a local concurrency probe, securely set `LOAD_EMAIL`, `LOAD_PASSWORD`, and optionally `EMS_API_URL`, then `npm run test:load`. It sends one burst of 500 simultaneous paginated API requests against seeded data. This verifies a particular local workload, not sustained production capacity for 500 people. Production sizing also needs representative database volumes, hardware, network latency, authentication storms, and sustained traffic.

## Production configuration and scope

Use `.env.example` to see variable names. Supply `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, a random base64 `JWT_SECRET` of at least 32 bytes, and exact `CORS_ORIGINS`. Remove the `demo` profile. A bootstrap administrator is created only when both `ADMIN_EMAIL` and a 12–72 character `ADMIN_PASSWORD` are supplied. Store values in a secret manager or deployment environment. Use HTTPS, database backups, monitoring, a shared gateway rate limit, and platform signing for deployment.

The connection pool starts at 30, not 500: concurrent desktop sessions do not require one reserved database connection each. Java virtual threads, a 1,000-connection HTTP limit, short transactions, paginated queries, per-employee attendance locks, optimistic leave versioning, and indexed employee/date fields provide the baseline. Tune `DB_POOL_SIZE` against actual database resources. Lists default to 20 items and cap at 100. Reports and assistant summaries clearly describe the loaded records; the UI directory and backend support pagination for larger workspaces.

The glass assistant is a deterministic workspace helper, not an external LLM service. Its answers use loaded team data. Attachments remain local and are not read or uploaded. Event saving is a personal local preference; calendar export is a real `.ics` download.

Optional asset storage uses `S3_BUCKET`, `AWS_REGION`, and the AWS SDK credential provider chain. The API returns a short-lived presigned upload URL and required headers, and PostgreSQL stores only the resulting address. Configure a private bucket, scoped IAM, size restrictions, storage CORS, and lifecycle rules before using it. No AWS account or screenshot capture was enabled during setup.

Complete unsigned Windows app bundles are also available in `/workspace/artifacts/Admin-Windows-x64.zip` and `/workspace/artifacts/Employee-Windows-x64.zip`. Extract the entire folder; its `Admin.exe` or `Employee.exe` depends on the adjacent Electron resources. These local bundles point to `http://127.0.0.1:8080`; rebuild with your HTTPS API for distribution. The Linux build container lacked space to finish NSIS installers.

For cloud recovery, `scripts/setup-cloud.sh` refreshes dependencies and builds into a writable `.local/web` cache, and `scripts/start-cloud.sh` starts PostgreSQL, the packaged API, and both demo frontends. The source-only archive at `/workspace/artifacts/EMP-source.zip` includes the lockfile and excludes credentials.

See [API contract](docs/API.md), [architecture](docs/ARCHITECTURE.md), and [verification record](docs/VERIFICATION.md). This is a functional implementation with deployment work clearly identified; it is not a claim that signed Windows distribution, external services, or production capacity have been certified.
