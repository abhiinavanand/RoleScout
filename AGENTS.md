# RoleScout — AGENTS.md

## Project Context

RoleScout is an AI-powered job discovery and matching platform.

Core product flow:

Resume/Profile
→ Search Planning
→ External Job Search
→ Normalize
→ Deduplicate
→ Extract Requirements
→ Match
→ Rank
→ Explain
→ Save/Apply
→ Track

Read `PROJECT_SPEC.md` before making architectural or feature decisions.

The project is a portfolio-quality full-stack application. Code must be human-readable, secure, maintainable, testable, and suitable for discussion in a technical interview.

---

# 1. Core Engineering Principles

These rules apply to every phase of the project.

- Use TypeScript strict mode.
- Write human-readable code.
- Prefer simple, explicit solutions over clever abstractions.
- Use meaningful variable, function, class, route, and file names.
- Keep functions small and focused.
- Follow single responsibility where practical.
- Avoid duplicated business logic.
- Avoid giant files.
- Avoid unnecessary dependencies.
- Avoid premature microservices.
- Do not rewrite working code without a reason.
- Do not implement future phases unless explicitly requested.
- Do not create fake production functionality.
- Do not silently ignore errors.
- Do not disable security checks just to make development easier.

Code should look like it was written and maintained by a professional developer, not generated as a disposable prototype.

---

# 2. Architecture

RoleScout uses a modular monolith.

Do not create microservices unless explicitly requested.

Recommended backend flow:

Route
→ Controller
→ Service
→ Repository

AI flow:

Agent
→ Tool
→ Service
→ Provider

External integration flow:

Service
→ Provider Interface
→ Provider Implementation

Frontend flow:

Page
→ Feature Components
→ API Layer
→ Backend API

Keep boundaries clear.

Do not put database queries directly into route handlers.

Do not put business logic directly into React components.

Do not let AI agents directly manipulate the database.

---

# 3. Recommended Project Structure

Backend:

```text
server/
└── src/
    ├── config/
    ├── controllers/
    ├── routes/
    ├── services/
    ├── repositories/
    ├── middleware/
    ├── validators/
    ├── agents/
    ├── providers/
    ├── workers/
    ├── queues/
    ├── ai/
    ├── utils/
    ├── types/
    ├── app.ts
    └── server.ts
```

Frontend:

```text
client/
└── src/
    ├── components/
    ├── layouts/
    ├── pages/
    ├── hooks/
    ├── api/
    ├── features/
    │   ├── auth/
    │   ├── jobs/
    │   ├── resume/
    │   ├── profile/
    │   ├── applications/
    │   └── dashboard/
    ├── types/
    └── utils/
```

Do not blindly follow this structure if a simpler structure is more appropriate for a specific feature, but maintain the same architectural boundaries.

---

# 4. Human-Readable Code

Code must be understandable without requiring the reader to decode it.

Prefer:

```ts
const authenticatedUser = await userService.getById(userId);
```

over:

```ts
const x = await s.g(id);
```

Avoid meaningless names such as:

```text
x
y
tmp
obj
data
foo
bar
res2
```

unless their meaning is genuinely obvious from the local context.

Use names that describe intent.

Prefer:

```ts
const normalizedSkills = normalizeSkills(candidate.skills);
```

over:

```ts
const result = normalize(candidate.skills);
```

---

# 5. No Giant Files

Do not create unnecessarily large files.

Avoid files containing unrelated:

- routes
- controllers
- services
- database logic
- AI prompts
- validation schemas
- frontend components

Split code when responsibilities become difficult to understand.

Do not go to the opposite extreme and create dozens of tiny files for trivial functions.

Use practical module boundaries.

---

# 6. No Copy-Paste Architecture

Do not duplicate business logic.

If multiple parts of the application perform the same operation, extract a reusable function, service, or utility.

Examples:

- Password validation
- Skill normalization
- Match scoring
- Job canonicalization
- Authorization checks
- API error formatting

There should be one authoritative implementation of important business rules.

---

# 7. TypeScript

Use strict TypeScript.

`tsconfig.json` should use strict mode.

Avoid `any`.

Do not use:

```ts
const data: any = response;
```

as a shortcut.

Do not use type assertions merely to silence compiler errors:

```ts
const data = response as SomeType;
```

If data comes from an external source, validate it.

Prefer:

```ts
const result = ExternalJobSchema.parse(response);
```

Use explicit types for:

- API inputs
- API outputs
- database-facing service boundaries
- provider responses
- AI outputs
- queue payloads

---

# 8. Validation

Never trust external input.

Validate:

- request bodies
- query parameters
- route parameters
- uploaded files
- external API responses
- LLM responses
- queue payloads where appropriate

Use Zod for runtime validation.

Frontend validation is useful for UX.

Backend validation is mandatory for security.

Example:

```ts
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});
```

---

# 9. Security

Security must be considered during implementation.

Never:

- hardcode secrets
- commit API keys
- log passwords
- log authentication tokens
- return password hashes
- expose stack traces in production
- trust client-provided ownership information
- allow users to access another user's resources
- construct unsafe SQL
- bypass authorization
- disable security checks to make development easier

Use environment variables for secrets.

---

# 10. Authentication Security

Passwords must be securely hashed using a modern password hashing algorithm such as Argon2id or bcrypt.

Never store plaintext passwords.

Authentication cookies should be appropriately configured with:

```text
HttpOnly
Secure in production
SameSite appropriately configured
```

Authentication configuration must be environment-aware.

Do not store authentication tokens in localStorage unless there is a documented security reason.

Never return password hashes through the API.

---

# 11. Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> Is this user allowed to access this resource?

Every protected resource must enforce authorization.

For example:

```text
GET /api/v1/applications/:id
```

must verify that the application belongs to the authenticated user.

Never trust a client-provided `userId` to determine ownership.

Use the authenticated user identity established by the backend.

Users must only be able to access their own:

- profile
- resume
- saved jobs
- applications
- application notes
- search history
- statistics
- preferences

---

# 12. Database

Use PostgreSQL and Prisma.

Use Prisma for normal database operations.

Do not construct unsafe SQL.

Avoid raw SQL unless there is a demonstrated technical reason.

Use:

- foreign keys
- unique constraints
- indexes
- appropriate relations
- transactions where required

Every schema change requires a Prisma migration.

Do not use `prisma db push` as a replacement for migrations.

Never reset or destroy a production database.

Avoid N+1 queries.

Paginate potentially large collections.

---

# 13. Database Transactions

Use transactions when multiple related writes must succeed or fail together.

Example:

```text
Create Application
+
Create Application Event
```

should be atomic when required.

Do not use transactions unnecessarily for simple independent reads.

---

# 14. API Design

Use versioned APIs:

```text
/api/v1/...
```

Use consistent response structures.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable message."
  }
}
```

Use appropriate HTTP status codes.

Examples:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

Do not return HTTP 200 for every situation.

---

# 15. Error Handling

Use centralized backend error handling.

Never silently swallow errors.

Bad:

```ts
try {
  await something();
} catch {}
```

Prefer:

```ts
try {
  await something();
} catch (error) {
  logger.error({ error }, "Failed to process request");
  throw error;
}
```

User-facing errors should be useful but safe.

Never expose:

- stack traces
- SQL queries
- internal filesystem paths
- database credentials
- provider secrets

in production responses.

---

# 16. Logging

Use structured logging.

Useful logs should include:

- request ID
- operation
- resource ID where appropriate
- error information
- duration where useful

Never log:

- passwords
- authentication tokens
- session cookies
- API keys
- private credentials
- entire resume contents
- unnecessary sensitive personal data

Important events include:

```text
User registered
User logged in
Resume uploaded
Resume processed
Search created
Search completed
Provider request failed
Job normalized
Job deduplicated
Job matched
AI request failed
Application created
```

---

# 17. Environment Configuration

Centralize environment configuration.

Do not scatter raw `process.env` access throughout the codebase.

Prefer:

```text
config/
└── env.ts
```

Validate required environment variables at startup.

Fail fast if required configuration is missing.

Expected variables include:

```text
NODE_ENV
PORT
DATABASE_URL
REDIS_URL
OPENAI_API_KEY
JOB_SEARCH_API_KEY
AUTH_SECRET
CLIENT_URL
```

Never expose server-only environment variables to the frontend.

---

# 18. Secrets

Never commit:

```text
.env
.env.local
*.pem
*.key
credentials.json
API keys
private tokens
```

Ensure `.gitignore` protects secret files.

Provide:

```text
.env.example
```

with placeholders only.

Never put real credentials in `.env.example`.

---

# 19. External APIs

Treat external API responses as untrusted data.

Validate provider responses before using them.

Handle:

- timeout
- rate limiting
- invalid response
- provider outage
- malformed data
- authentication failure
- unexpected schema changes

A provider failure must not crash the entire application.

Use provider adapters.

---

# 20. Job Provider Architecture

Never tightly couple RoleScout to one job provider.

Use:

```ts
interface JobSearchProvider {
  searchJobs(
    params: JobSearchParams
  ): Promise<ExternalJob[]>;
}
```

Provider-specific response formats must be converted into the RoleScout internal job format.

Recommended structure:

```text
providers/
├── job-search/
│   ├── job-search-provider.ts
│   ├── mock-provider.ts
│   └── serpapi-provider.ts
```

A mock provider is allowed for:

- automated tests
- local development when explicitly configured

Do not use fake data in production.

---

# 21. Job Data

A normalized job should have a stable internal representation.

Provider-specific fields must not leak throughout the application.

Normalize:

- title
- company
- location
- work mode
- description
- salary
- skills
- experience level
- source
- source job ID
- apply URL
- posted date

---

# 22. Job Deduplication

The same job can appear from multiple providers.

Deduplication should consider:

1. Provider job ID
2. Canonical apply URL
3. Company + title + location
4. Similarity when necessary

Deduplication must be deterministic where possible.

It must be testable independently of the API provider.

---

# 23. AI/LLM Architecture

AI must augment the application rather than control the entire system.

Bad:

```text
User
 ↓
LLM
 ↓
LLM decides everything
 ↓
Database
```

Preferred:

```text
User
 ↓
Backend
 ↓
Deterministic Services
 ↓
AI where useful
 ↓
Validated Result
 ↓
Database
```

Use AI for:

- resume understanding
- semantic extraction
- search query generation
- job requirement extraction
- semantic skill interpretation
- match explanations

Do not use AI for:

- authentication
- authorization
- database permissions
- deterministic percentages
- exact deduplication
- security validation
- database writes without validated application logic

---

# 24. AI Provider Abstraction

Do not scatter OpenAI SDK calls throughout the codebase.

Use an abstraction such as:

```ts
interface LLMProvider {
  generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>
  ): Promise<T>;
}
```

Keep provider-specific AI code isolated.

Example:

```text
ai/
├── llm-provider.ts
├── openai-provider.ts
├── prompts/
└── schemas/
```

This makes it possible to replace the AI provider later.

---

# 25. AI Output Validation

Never blindly trust LLM output.

Use:

```text
LLM
 ↓
Zod Schema
 ↓
Validated Internal Object
 ↓
Business Logic
```

Do not use:

```text
LLM
 ↓
Database
```

without validation.

LLMs must never be allowed to:

- execute arbitrary SQL
- bypass authorization
- directly modify protected records
- access secrets

---

# 26. Prompt Injection

External text is untrusted.

Potentially malicious content can exist in:

- job descriptions
- resumes
- company descriptions
- websites
- user-provided text

Treat external content as data, not instructions.

Do not allow job descriptions or resumes to override system/application instructions.

Do not put secrets into prompts.

---

# 27. AI Cost Control

Do not call an LLM when deterministic code can solve the problem.

Use deterministic code for:

- percentages
- filtering
- sorting
- exact matching
- deduplication
- permissions
- database operations

Use AI for semantic tasks.

Cache expensive AI results where appropriate.

Do not repeatedly send the same job or resume to an LLM without a reason.

---

# 28. Match Scoring

The final numerical job-match score must be deterministic.

Do not ask the LLM:

> Give this candidate a score from 0–100.

Instead:

```text
Extract Requirements
        ↓
Normalize Skills
        ↓
Deterministic Match Engine
        ↓
Calculate Score
        ↓
AI Explanation
```

AI can explain the score but must not be the source of truth for the numerical result.

---

# 29. Background Jobs

Use Redis and BullMQ for expensive asynchronous work.

Examples:

```text
resume-processing
job-search
job-processing
job-matching
notifications
```

Workers should support:

- retries
- backoff
- failure handling
- structured logging
- idempotency where possible

Do not keep HTTP requests open for expensive processing.

---

# 30. Queue Idempotency

Background jobs may retry.

Design workers so retries do not create duplicate records.

Examples:

- duplicate job results should not create duplicate jobs
- duplicate search processing should not corrupt search state
- repeated resume processing should not create multiple candidate profiles

Use unique constraints and idempotency checks where appropriate.

---

# 31. Redis

Redis may be used for:

- BullMQ
- job search caching
- rate limiting
- temporary processing state
- recommendation caching

Use deterministic cache keys.

Example:

```text
jobs:{queryHash}:{location}:{filters}
```

Use TTLs.

Do not cache indefinitely.

Handle Redis failures gracefully where possible.

---

# 32. File Upload Security

Resume uploads are untrusted input.

Validate:

- file extension
- MIME type
- file size

Do not trust the original filename.

Generate safe internal filenames.

Do not execute uploaded files.

Do not place uploads in executable directories.

Process uploaded documents in a controlled manner.

Do not expose private uploaded files publicly unless explicitly intended.

---

# 33. Frontend Security

Frontend checks are for UX.

Backend checks are for security.

Never trust client-controlled:

- user ID
- role
- permissions
- application ownership
- profile ownership

Authorization must be enforced server-side.

---

# 34. React Architecture

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query

Keep components focused.

Avoid giant components.

Prefer:

```text
JobCard
JobList
JobFilters
MatchScore
SkillBadge
```

over a single component containing the entire job page.

Do not put complex business logic directly in JSX.

---

# 35. Frontend State

Use the appropriate state mechanism.

Server state:

```text
TanStack Query
```

Local UI state:

```text
React state
```

Do not duplicate server state unnecessarily.

Do not introduce a global state manager unless there is a real need.

---

# 36. API Layer

Create a centralized frontend API layer.

Do not scatter raw `fetch()` calls throughout components.

Example:

```text
client/src/api/
├── auth.ts
├── jobs.ts
├── resumes.ts
├── applications.ts
└── statistics.ts
```

Keep API-specific logic out of presentational components.

---

# 37. Loading, Error, and Empty States

Every data-driven feature should consider:

```text
Loading
Success
Empty
Error
```

Do not leave users staring at blank screens.

Provide useful feedback when:

- searches are processing
- resumes are being parsed
- AI processing fails
- no jobs are found
- saved jobs are empty
- applications are empty

---

# 38. Accessibility

Use:

- semantic HTML
- labels for inputs
- keyboard navigation
- accessible buttons
- useful focus states
- readable error messages

Do not rely solely on color to communicate status.

---

# 39. Human-Readable Comments

Do not comment obvious code.

Bad:

```ts
// Increment count
count++;
```

Good:

```ts
// Cache provider searches because the same query can be
// generated by multiple profile-based search strategies.
```

Comments should explain why something exists or why a non-obvious decision was made.

---

# 40. Dependency Discipline

Before adding a dependency:

1. Check whether the functionality already exists.
2. Check whether the dependency is actually necessary.
3. Prefer well-maintained packages.
4. Avoid abandoned packages.
5. Avoid duplicate libraries solving the same problem.

Do not install a package just to save a few lines of code.

---

# 41. Performance

Do not prematurely optimize.

Avoid obvious performance problems:

- N+1 queries
- unbounded database queries
- unbounded API responses
- unnecessary LLM calls
- unnecessary frontend requests
- repeated database reads
- missing pagination
- processing large jobs synchronously

Use indexes where appropriate.

Use pagination for large collections.

Use background processing for expensive work.

---

# 42. Testing

Important business logic must be tested.

Unit test:

- match scoring
- skill normalization
- job normalization
- deduplication
- search query generation
- profile completeness
- statistics calculations
- validation schemas

Integration test:

- authentication
- resume processing
- job search
- saved jobs
- applications
- authorization

Frontend tests should focus on important user interactions.

Do not chase meaningless 100% coverage.

---

# 43. Testing Standards

Before declaring a feature complete:

- TypeScript must pass
- ESLint must pass
- Relevant tests must pass
- Prisma validation must pass
- Build must pass

Do not ignore failing tests unless the failure is explicitly documented and understood.

---

# 44. Documentation

Keep `README.md` accurate.

Document:

- setup
- environment variables
- development commands
- database migrations
- testing
- architecture where useful

Document important architectural decisions in:

```text
docs/
```

or an appropriate architecture/decision document.

Do not create unnecessary documentation for trivial code.

---

# 45. No Fake Implementations

Do not make features appear complete by hardcoding fake results.

Do not hardcode:

- fake jobs
- fake match percentages
- fake statistics
- fake applications
- fake AI responses

Mocks are acceptable only for:

- automated tests
- local development when explicitly configured

Production code must use real implementations.

---

# 46. Maintainability Over Cleverness

Prefer understandable code over clever code.

Good:

```ts
const jobs = await jobService.searchJobs(searchParams);
```

Avoid unnecessary abstractions that make simple code difficult to understand.

Do not introduce unnecessary:

- factories
- event buses
- generic frameworks
- design patterns
- service layers
- microservices

Use abstractions when they solve an actual problem.

---

# 47. No Blind Code Generation

Before modifying code:

1. Inspect the existing repository.
2. Understand related modules.
3. Identify existing abstractions.
4. Reuse existing code where appropriate.
5. Identify side effects.
6. Make the smallest clean change.

Do not replace entire modules simply because rewriting them is easier.

Do not modify unrelated files.

---

# 48. Refactoring

When modifying existing code:

- preserve working behavior
- avoid unrelated changes
- maintain existing contracts where possible
- update tests
- update types
- update documentation when necessary
- remove dead code only when safe

Do not perform large refactors while implementing unrelated features.

---

# 49. Development Workflow

The user will provide phase-specific prompts.

Before implementing a phase:

1. Read `PROJECT_SPEC.md`.
2. Read this `AGENTS.md`.
3. Inspect the existing repository.
4. Determine what has already been implemented.
5. Identify affected files/modules.
6. Reuse existing abstractions.
7. Implement only the requested phase.
8. Run tests and checks.
9. Fix errors.
10. Update documentation if necessary.

Do not automatically continue to the next phase.

---

# 50. Phase Boundaries

The project is intentionally developed incrementally.

Do not implement future features just because they are described in `PROJECT_SPEC.md`.

If the current prompt says:

> Implement Phase 1

do not implement Phase 2.

If a later feature requires a placeholder interface for architectural reasons, create the smallest appropriate abstraction without implementing the future feature.

---

# 51. Completion Standard

A feature is NOT complete merely because the application compiles.

Before considering a feature complete:

- implementation works
- TypeScript passes
- lint passes
- relevant tests pass
- validation exists
- errors are handled
- authorization is enforced
- security implications are considered
- loading state exists
- empty state exists where appropriate
- error state exists
- environment variables are documented
- documentation is updated where necessary

---

# 52. Final Review Checklist

Before finishing a significant task, review:

## Code Quality

- Are names meaningful?
- Is the code easy to read?
- Are functions reasonably small?
- Are modules appropriately separated?
- Is business logic duplicated?
- Are abstractions justified?

## Security

- Can an unauthenticated user access protected resources?
- Can one user access another user's data?
- Are secrets exposed?
- Is input validated?
- Are uploaded files handled safely?
- Are external inputs treated as untrusted?
- Are authentication cookies secure?

## Reliability

- What happens if PostgreSQL fails?
- What happens if Redis fails?
- What happens if the external API fails?
- What happens if the LLM fails?
- What happens if a queue job retries?
- What happens if an external response is malformed?

## Performance

- Are large collections paginated?
- Are there N+1 queries?
- Are expensive operations asynchronous?
- Are unnecessary AI calls avoided?
- Are appropriate indexes present?
- Is caching used where appropriate?

## Frontend

- Is there a loading state?
- Is there an error state?
- Is there an empty state?
- Is the UI responsive?
- Are important interactions accessible?

## Maintainability

- Would another developer understand this code?
- Is the implementation unnecessarily complex?
- Were unrelated files changed?
- Were existing abstractions reused?

Only consider the task complete after this review.
