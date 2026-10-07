# RoleScout

RoleScout is an AI-powered job discovery and matching platform. Phase 4 adds durable asynchronous resume processing and job discovery on top of the Phase 1–3 foundation.

## Features

- Secure email/password registration and login
- HTTP-only cookie sessions
- Protected dashboard and logout
- Express health endpoint
- PostgreSQL persistence through Prisma migrations
- Redis connection ready for future background work
- Responsive React frontend
- PDF and DOCX resume upload up to 10 MB
- Local private resume storage and server-side text extraction
- Candidate profile persistence and editing
- Optional OpenAI resume parsing with deterministic fallback
- Real Google Jobs search through the SerpApi adapter
- Normalized, persisted job feed with pagination and search history
- BullMQ/Redis workers for resume processing and job discovery
- Durable pending, processing, completed, and failed states with status endpoints
- Deterministic candidate-to-job match scoring with explainable breakdowns
- Saved jobs and user-owned application tracking
- User-specific analytics for applications, statuses, funnel rates, trends, and searches

## Tech Stack

React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Node.js, Express, Prisma, PostgreSQL, Redis, BullMQ, IORedis, Zod, bcryptjs, JWT, pdf-parse, Mammoth, and SerpApi's HTTP API.

## Prerequisites

Node.js 20+, npm 10+, and Docker Desktop.

## Installation

```bash
cp .env.example .env
npm install
```

## Environment Variables

Set `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET` (at least 32 characters), `CLIENT_URL`, `RESUME_STORAGE_PATH`, `MAX_RESUME_SIZE_BYTES`, and `WORKER_CONCURRENCY` in `.env`. `OPENAI_API_KEY` and `OPENAI_MODEL` are optional. Without an API key, deterministic parsing is used.

Authentication uses an HTTP-only JWT cookie with a seven-day expiration and a server-side per-user session version. Logging out increments that version and invalidates all active sessions for the user, including sessions on other devices. Existing tokens are never logged.

For job discovery, configure `JOB_SEARCH_API_KEY` with a SerpApi key and keep `JOB_SEARCH_PROVIDER=serpapi`. The key is server-side only and is never sent to the frontend. Without it, job searches return a clear configuration error rather than fake jobs.

## Starting PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

## Database Migrations

```bash
npm run prisma:generate --workspace server
npx prisma migrate deploy --schema server/prisma/schema.prisma
```

For local schema development, use `npm run prisma:migrate --workspace server`.

## Resume Processing

Authenticated users can upload PDF or DOCX files from `/resume`. Uploads return `202 Accepted` after the file and pending database record are created. The API enqueues only the resume ID; a separate worker extracts text, parses it, and saves the validated `CandidateProfile`. Poll `GET /api/v1/resumes/:id/status` until processing is complete. Files are held in the private local directory configured by `RESUME_STORAGE_PATH`; only safe storage keys are persisted in PostgreSQL.

Resume uploads are limited to 10 MB by default. MIME type, extension, and basic file signatures are checked. Resume contents, extracted text, prompts, and secrets are not logged. External links found in resumes are stored but never fetched.

## Resume and Profile API

- `POST /api/v1/resumes` — upload a multipart `resume` file
- `GET /api/v1/resumes` — list the authenticated user's resume metadata
- `GET /api/v1/resumes/:id` — read owned resume metadata
- `GET /api/v1/resumes/:id/status` — read asynchronous processing status and error code
- `DELETE /api/v1/resumes/:id` — delete an owned resume
- `GET /api/v1/profile` — read the authenticated user's candidate profile
- `PUT /api/v1/profile` — validate and update the candidate profile
- `POST /api/v1/profile/reparse` — explicitly regenerate the profile from the latest resume

## Job Discovery

The `/jobs` page sends an authenticated search request to `POST /api/v1/jobs/search`. The API creates a pending search and returns `202 Accepted`; the job-discovery worker runs the deterministic planner, queries SerpApi, validates and normalizes provider responses, deduplicates them, and upserts jobs into PostgreSQL. Poll `GET /api/v1/searches/:id/status` until complete, then read the persisted feed through `GET /api/v1/jobs`. `GET /api/v1/jobs/:id` serves job details and the original provider URL.

Jobs use `source + externalId` as their primary identity. When a provider does not supply an ID, RoleScout uses a conservative fingerprint based on source, company, title, location, and job URL. Provider fields remain isolated from the internal `Job` model.

## Matching

`GET /api/v1/jobs/:id/match` calculates an authenticated user's match on demand from their candidate profile and the normalized job. The deterministic score uses centralized weights: skills 40%, experience 20%, role relevance 15%, location/work mode 10%, employment type 5%, and salary 10%. Dimensions unavailable in the profile or provider data are marked unavailable and excluded from the weighted average rather than treated as mismatches. The job details page displays the overall score, matched/missing skills, component scores, and explanations.

Matching is intentionally not persisted in Phase 5; the same profile and job always produce the same result. No LLM, external call, client-provided score, saved job, or recommendation feed is involved.

## Application Management

The authenticated application tracker is available at `/applications` as a Kanban-style pipeline. Users can save jobs independently through `POST /api/v1/saved-jobs/:jobId`, or track an application from a job detail page. Application statuses are `SAVED`, `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`, and `WITHDRAWN`; new tracked applications start as `SAVED`. Notes, applied dates, status updates, pagination, filtering, deletion, and ownership checks are supported. Moving an application to `APPLIED` automatically records the current date when no date is supplied, while later status changes preserve that date.

Application endpoints:

- `POST /api/v1/applications`
- `GET /api/v1/applications?status=INTERVIEW&page=1&pageSize=20`
- `GET /api/v1/applications/:id`
- `PATCH /api/v1/applications/:id`
- `DELETE /api/v1/applications/:id`
- `GET /api/v1/saved-jobs`
- `POST /api/v1/saved-jobs/:jobId`
- `DELETE /api/v1/saved-jobs/:jobId`

Applications and saved jobs use user/job uniqueness constraints so duplicate records cannot be created, including under concurrent requests. Automated submission, reminders, and notifications are intentionally outside Phase 6.

## Personalized Recommendations

Authenticated users can open `/recommendations` or call `GET /api/v1/recommendations/jobs?page=1&pageSize=20` to see persisted jobs ranked against their CandidateProfile. Recommendations reuse the deterministic matching engine used by the job-detail match panel; no LLM is used for ranking or explanations.

The endpoint evaluates a bounded set of up to 500 persisted jobs, sorts by match score, then posted date, then stable job ID, and paginates the ranked results. It does not call SerpApi or create recommendation records. Saved-job and application state is loaded for the authenticated user and included with each result. A profile with no meaningful headline, skills, or experience receives a safe profile-completion response instead of fabricated recommendations. If no persisted jobs are available, the response is an empty result and the UI directs the user to search for jobs.

## Analytics

Authenticated analytics are available at `GET /api/v1/analytics/overview?range=7d|30d|90d|all` and in the `/analytics` UI. Metrics are calculated from the authenticated user's persisted saved jobs, applications, and job searches. The dashboard includes status counts, daily application activity, saved-job/application/search summaries, and rates.

Rate formulas use the selected range and current application records: application rate is applications divided by saved jobs; interview, offer, and rejection rates are the corresponding current-status counts divided by applications. Rates return `null` and display “Not enough data” when the denominator is zero. The current schema does not associate persisted jobs with individual searches, so global job rows are never incorrectly presented as user-specific “jobs discovered”; that metric is returned as unavailable.

Search history is user-owned and available at `/searches`, with rerun and delete actions. `GET /api/v1/searches/:id/status` enforces search ownership. Queue payloads contain only durable IDs, use deterministic job IDs, retry three times with exponential backoff, and retain completed/failed BullMQ records for bounded periods. `WORKER_CONCURRENCY` controls each worker's concurrency.

## Running Backend

```bash
npm run dev --workspace server
```

The API runs at `http://localhost:4000`.

## Running the Worker

Run the API and worker as separate processes:

```bash
npm run worker --workspace server
```

The worker handles `resume-processing` and `job-discovery`, logs failures, marks final failures durably, and shuts down gracefully on `SIGTERM`/`SIGINT`. Redis and PostgreSQL must be available before starting either process.

## Running Frontend

```bash
npm run dev --workspace client
```

The client runs at `http://localhost:5173`.

## Testing

```bash
npm test
npm run build
npm run lint --workspace server
npm run lint --workspace client
cd server && npx prisma validate --schema prisma/schema.prisma
cd .. && npm run openapi:validate
```

The server suite covers deterministic matching, normalization, provider failures, queue payloads, authentication/session revocation, repository ownership, analytics, recommendations, and a critical job-discovery workflow integration boundary. Provider tests mock `fetch`; no test requires a live SerpApi key. Database-backed end-to-end integration tests require an isolated PostgreSQL/Redis environment and are intentionally not run by the default unit suite.

## API documentation

The OpenAPI 3.0 document is available at [docs/openapi.json](./docs/openapi.json). It documents authentication, ownership-protected resources, validation and common error responses, health/readiness, and the Prometheus metrics endpoint. Validate it with `npm run openapi:validate`. A Swagger UI is not bundled so the API runtime remains dependency-light; import the document into Swagger Editor or another OpenAPI viewer.

## Architecture and deployment

```text
React/Vite frontend
        | HTTPS
        v
Express API ---- PostgreSQL
        |
        +-------- Redis
                     |
                     v
                  BullMQ
                     |
                     v
                  Worker ---- SerpApi
```

Deploy the frontend, API, and worker as independent processes. PostgreSQL and Redis should be managed external services in production. The API and worker share `DATABASE_URL`, `REDIS_URL`, and the validated environment configuration; only the API needs `CLIENT_URL`, while only the provider adapter needs the server-side job provider key. Run migrations as a release step before starting API/worker processes. The API's `TRUST_PROXY` value must match the number of trusted reverse-proxy hops so secure cookies and rate limiting observe the original request safely.

The production environment requires `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, and `CLIENT_URL`. Optional configuration includes `JOB_SEARCH_API_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `RESUME_STORAGE_PATH`, `MAX_RESUME_SIZE_BYTES`, `WORKER_CONCURRENCY`, rate limits, `TRUST_PROXY`, and `SHUTDOWN_TIMEOUT_MS`. Do not copy local secrets into deployment configuration or expose server-only values to the frontend.

`GET /api/v1/metrics` exposes bounded Prometheus text metrics for HTTP requests, HTTP errors, durations, queue outcomes, search attempts/failures, and resume attempts/failures. Labels are limited to method, route, status code, and job type; credentials, personal data, and resource IDs are never labels. Metrics are process-local, so production deployments should scrape each API/worker process or aggregate them at the infrastructure layer.

SerpApi requests have a 15-second timeout and at most one conservative retry for transient network, rate-limit, or 5xx failures. BullMQ remains the durable retry boundary with three attempts and exponential backoff; provider retries are deliberately bounded to avoid retry multiplication. Provider errors are classified without exposing raw responses or API keys.

Redis is currently used for BullMQ and readiness checks. A shared job-search response cache was not added: search results are already persisted asynchronously, and adding a cache would require an explicit freshness/invalidation policy across independently deployed workers and users. This avoids serving stale or incorrectly scoped results.

## Engineering trade-offs and limitations

RoleScout remains a modular monolith because its workflows share authentication, persistence, and matching boundaries. BullMQ isolates expensive resume/provider work from HTTP requests. Matching and recommendation ranking remain deterministic and explainable rather than LLM-controlled. Recommendation evaluation is capped at 500 persisted jobs, lists are paginated with a maximum page size of 50, uploads default to 10 MB, JSON requests are capped at 1 MB, and worker concurrency is configurable.

The local Docker Compose file provisions development dependencies, but live deployment, managed-service failover, and production HTTPS have not been verified in this workspace. The default CI validates Docker Compose configuration rather than launching a production stack. A real SerpApi key is required for live job discovery; tests use provider-boundary mocks.

## Production hardening

Production configuration is validated at startup. Use a generated `AUTH_SECRET`, set `NODE_ENV=production`, configure `TRUST_PROXY` only for the number of trusted reverse-proxy hops, and keep `RESUME_STORAGE_PATH` on private durable storage. The API disables the Express signature header, uses Helmet and strict CORS, applies JSON/file limits, and rate-limits API and authentication requests. For horizontally scaled deployments, replace the default process-local limiter store with a shared store at the infrastructure layer.

Use `/api/v1/health` for liveness and `/api/v1/health/ready` for readiness. Readiness checks PostgreSQL and Redis and returns HTTP 503 until both dependencies are available. API and worker shutdowns close HTTP/queue/Redis/Prisma resources with a bounded timeout.

Production images are defined by [server/Dockerfile](./server/Dockerfile) and [client/Dockerfile](./client/Dockerfile). Run Prisma migrations as a release step with `npx prisma migrate deploy --schema server/prisma/schema.prisma`; do not use `prisma db push` in production. CI runs builds, lint, tests, Prisma validation, and Docker Compose validation.

## Project Structure

`server/` contains the modular Express API, Prisma schema, authentication services, repositories, middleware, and configuration. `client/` contains the Vite React application, API layer, authentication state, routes, and pages. `docker-compose.yml` provides PostgreSQL and Redis for local development.

Matching, deterministic scores, saved jobs, applications, recommendations, notifications, and analytics are intentionally not implemented. The code and automated tests validate queue configuration and processing boundaries, but live Redis/PostgreSQL worker execution has not been verified when Docker Desktop is unavailable.
