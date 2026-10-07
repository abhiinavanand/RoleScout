# RoleScout — Project Specification

## 1. Product Overview

**RoleScout** is an AI-powered job discovery and matching platform.

The user provides their resume, skills, experience, preferences, and optionally a target role. RoleScout searches external job sources, collects relevant jobs, normalizes and deduplicates the results, evaluates how well each job matches the user's profile, and presents a ranked job feed.

The goal is not to build another generic job board.

> **Find the right jobs for me instead of making me search through thousands of jobs myself.**

---

## 2. Core User Flow

```text
User
  |
  v
Upload Resume
  |
  v
Resume Processing / Profile Extraction
  |
  v
Candidate Profile
  |
  v
Search Planner Agent
  |
  v
Search Queries
  |
  v
External Job Search APIs
  |
  v
Raw Job Results
  |
  v
Normalize + Deduplicate
  |
  v
Job Requirement Extraction
  |
  v
Matching Engine
  |
  v
Match Scores
  |
  v
Ranked Job Feed
  |
  +------------------+
  |                  |
  v                  v
Apply / Save     Analyze Match
                     |
                     v
               AI Explanation
```

---

## 3. Primary Goals

RoleScout should demonstrate strong full-stack engineering.

The project should showcase:

- React
- TypeScript
- Node.js
- Express
- PostgreSQL
- Prisma
- Redis
- Background jobs
- External API integration
- AI/LLM integration
- Agent/tool architecture
- Search
- Data normalization
- Deduplication
- Recommendation/ranking
- File processing
- REST API design
- Caching
- Authentication
- Analytics
- Application tracking
- Testing
- Logging
- Production deployment

---

## 4. MVP Priorities

### Priority 1 — Job Discovery

The most important feature.

Users should be able to:

- Search for jobs
- Enter a target role
- Enter skills
- Select location
- Select remote/hybrid/on-site
- Set experience level
- View relevant jobs

### Priority 2 — Resume Intelligence

Users can upload a resume.

RoleScout extracts:

- Skills
- Technologies
- Experience
- Education
- Job titles
- Projects
- Certifications
- Industries
- Experience level

The extracted information becomes the user's candidate profile.

### Priority 3 — Personalized Matching

Each job receives a match score.

Example:

```text
Backend Engineer
Acme Technologies

92% Match

██████████████████░░

Strong matches:
✓ Node.js
✓ PostgreSQL
✓ REST APIs
✓ TypeScript

Missing:
• AWS
• Kubernetes
```

### Priority 4 — AI Explanations

Users can ask:

> Why am I a good match for this job?

RoleScout should provide a concise explanation.

### Priority 5 — Application Tracking

Users can save jobs and track applications.

Statuses:

```text
SAVED
APPLIED
SCREENING
INTERVIEW
OFFER
REJECTED
WITHDRAWN
```

Provide both list and Kanban views.

---

## 5. Authentication

Authentication is useful but is **not the primary feature**.

Implement authentication because it enables:

- Persistent profiles
- Resume storage
- Saved jobs
- Application tracking
- Personal statistics
- Search history
- Personalized recommendations

Users should be able to:

- Register
- Login
- Logout
- View profile
- Update profile

Authentication should use secure password hashing and HTTP-only cookies.

Do not spend excessive development time on authentication.

Social login is optional and should not be part of the initial MVP.

---

## 6. User Dashboard

After logging in, the user should see a personalized dashboard.

Example:

```text
+-----------------------------------------------------+
| Welcome back                                        |
|                                                     |
| 47 Jobs Found      12 Saved      8 Applied          |
|                                                     |
| Average Match      Interviews       Offers          |
| 82%                3                1               |
|                                                     |
| Recommended Jobs                                    |
|                                                     |
| Backend Engineer                  94% Match         |
| Full Stack Developer              91% Match         |
| Software Engineer                 87% Match         |
+-----------------------------------------------------+
```

---

## 7. User Statistics

Store user-specific statistics.

### Job Discovery

- Total jobs discovered
- Jobs discovered this week
- Jobs discovered this month
- Unique companies discovered
- Number of job sources

### Matching

- Average match score
- Highest match score
- Jobs above 80%
- Jobs above 90%
- Most common required skills

### Applications

- Total saved
- Total applied
- Interviews
- Offers
- Rejections

### Application Rate

```text
Applications / Saved Jobs
```

### Interview Rate

```text
Interviews / Applications
```

### Offer Rate

```text
Offers / Applications
```

These statistics must be calculated from actual stored data.

Do not create fake analytics.

---

## 8. Resume Management

Users can upload a resume.

Supported formats:

- PDF
- DOCX

The backend should:

1. Validate file type
2. Validate file size
3. Extract text
4. Process the text
5. Generate structured candidate information
6. Store the candidate profile

The frontend should display the extracted profile so the user can correct mistakes.

---

## 9. Candidate Profile

The candidate profile should contain:

```text
Candidate
├── Name
├── Email
├── Education
├── Experience
├── Years of Experience
├── Skills
├── Languages
├── Frameworks
├── Databases
├── Cloud
├── Tools
├── Job Titles
├── Industries
├── Projects
├── Certifications
├── Preferred Locations
├── Remote Preference
└── Target Roles
```

Skills should be normalized.

For example:

```text
JS
Javascript
javascript
```

should become:

```text
JavaScript
```

---

## 10. Job Search

RoleScout should use external job-search APIs.

The application should NOT depend directly on one provider.

Create an abstraction:

```ts
interface JobSearchProvider {
  searchJobs(
    params: JobSearchParams
  ): Promise<ExternalJob[]>;
}
```

The initial provider can be a Google Jobs/search API.

A mock provider should also exist for development and testing.

---

## 11. Search Inputs

Users should be able to search using:

### Role

```text
Backend Developer
```

### Skills

```text
Node.js
PostgreSQL
Redis
TypeScript
```

### Location

```text
Bangalore
Hyderabad
Remote
India
```

### Work Mode

```text
Remote
Hybrid
On-site
Any
```

### Experience

```text
Internship
Entry Level
Junior
Mid Level
Senior
```

### Date Posted

```text
24 hours
3 days
7 days
30 days
Any
```

---

## 12. AI Search Planner

When a resume/profile exists, RoleScout should generate multiple search queries.

Example candidate:

```text
Node.js
React
PostgreSQL
Redis
TypeScript
```

The Search Planner could generate:

```text
backend developer Node.js PostgreSQL
full stack developer React Node.js
software engineer TypeScript Node.js
junior backend engineer Node.js
Node.js developer PostgreSQL Redis
```

The output must be structured JSON.

The system should not rely on parsing arbitrary LLM prose.

---

## 13. Job Collection Pipeline

The job collection process should be asynchronous.

```text
User Search
    |
    v
Create Search
    |
    v
Generate Queries
    |
    v
Queue Jobs
    |
    v
Search Providers
    |
    v
Collect Results
    |
    v
Normalize
    |
    v
Deduplicate
    |
    v
Extract Requirements
    |
    v
Match Against User
    |
    v
Store Results
    |
    v
Return Ranked Feed
```

Use:

- Redis
- BullMQ
- Background workers

Long-running searches should not block HTTP requests.

---

## 14. Job Data Model

A normalized job should contain approximately:

```ts
Job {
  id
  title
  company
  location
  workMode
  description
  salaryMin
  salaryMax
  currency
  experienceLevel
  skills
  source
  sourceJobId
  applyUrl
  postedAt
  discoveredAt
}
```

Additional provider-specific information may be stored as JSON.

---

## 15. Job Normalization

External providers return different formats.

Every provider result must be converted into RoleScout's internal job format.

Provider-specific fields must not leak throughout the application.

Use:

```text
Provider
   |
   v
Adapter
   |
   v
Normalized Job
```

---

## 16. Job Deduplication

The same job may appear multiple times.

Deduplicate using:

1. Provider job ID
2. Canonical URL
3. Company + title + location
4. Similarity when necessary

Example:

```text
Google Jobs
LinkedIn
Indeed
Company Website

        |
        v
   Deduplication
        |
        v
 One Canonical Job
```

---

## 17. Job Requirement Extraction

Extract important job requirements.

Example:

```json
{
  "requiredSkills": [
    "Node.js",
    "PostgreSQL",
    "REST APIs"
  ],
  "preferredSkills": [
    "AWS",
    "Kubernetes"
  ],
  "experienceYears": 2,
  "seniority": "junior"
}
```

The extraction can use an LLM.

The output must be validated with Zod.

---

## 18. Matching Engine

The match score should primarily be deterministic.

Example:

```text
Skills             50%
Experience         20%
Location           10%
Seniority          10%
Education           5%
Preferences         5%
```

Weights should be configurable.

Example:

```text
Skill match:        92%
Experience match:   80%
Location match:    100%
Seniority match:    90%
Education match:   100%

Final:              90%
```

Do not ask the LLM to directly decide the final numerical score.

The backend should calculate the score.

---

## 19. Skill Matching

Skill matching should account for equivalent terms.

Examples:

```text
JS → JavaScript
TS → TypeScript
Node → Node.js
Postgres → PostgreSQL
ReactJS → React
```

A normalized skill dictionary should be maintained.

Semantic similarity may optionally be used for less obvious matches.

---

## 20. Match Explanation

The Match Explanation Agent should generate:

- Why the candidate matches
- Strongest matching skills
- Missing skills
- Relevant experience
- Potential concerns
- Recommendation

Example:

```text
Match Score: 88%

Why:
You have strong experience with Node.js, PostgreSQL and
REST APIs, which are core requirements for this role.

Missing:
AWS and Kubernetes.

Recommendation:
Apply. The missing technologies are listed as preferred
rather than required.
```

---

## 21. Job Feed

The main job feed is the primary UI.

Sort options:

- Best Match
- Newest
- Highest Salary
- Most Relevant

Default:

```text
Best Match
```

Each card should show:

- Title
- Company
- Location
- Work mode
- Match score
- Top skills
- Missing skills
- Salary if available
- Posted date
- Source
- Save button
- Apply button

---

## 22. Job Details

A job details page should show:

```text
Job title
Company
Location
Salary
Work mode
Experience
Posted date
Source

Description

Required skills
Preferred skills

Your Match

Matching skills
Missing skills

AI explanation

[Apply]
[Save Job]
[Track Application]
```

---

## 23. Save Jobs

Users can save jobs.

Saved jobs should persist between sessions.

A saved job should record:

```text
User
Job
Saved At
```

---

## 24. Application Tracker

Users can create an application from a saved/discovered job.

Example:

```text
+------------+------------+------------+------------+
| Saved      | Applied    | Interview  | Offer      |
+------------+------------+------------+------------+
| Job A      | Job C      | Job E      | Job H      |
| Job B      | Job D      |            |            |
+------------+------------+------------+------------+
```

Application records should contain:

```text
Job
Status
Applied At
Notes
Last Updated
```

---

## 25. Application Notes

Users should be able to attach notes.

Examples:

```text
Recruiter contacted me on Monday.

Technical interview scheduled for Friday.

Need to prepare system design.
```

---

## 26. Search History

Store searches made by authenticated users.

Example:

```text
Backend Developer
Node.js
Remote
India

Created:
October 7, 2026
```

Users should be able to repeat previous searches.

---

## 27. Search Results Persistence

Searches should be persisted so the system can provide:

- Search history
- Statistics
- Job discovery metrics
- Cached results
- Re-ranking

Avoid storing unnecessary duplicate copies of the same job.

Use relationships between searches and jobs.

---

## 28. Personalized Recommendations

After the user has a candidate profile, RoleScout should recommend jobs automatically.

Recommendations should consider:

- Resume
- Skills
- Target roles
- Location
- Remote preference
- Experience
- Previous saved jobs
- Previous applications

Do not implement a complex machine-learning recommendation system initially.

Use the existing matching engine.

---

## 29. Dashboard Analytics

Dashboard metrics:

```text
Jobs Discovered
Jobs Saved
Applications
Interviews
Offers
Average Match
Highest Match
```

Additional charts can include:

### Applications Over Time

```text
Date → Applications
```

### Match Distribution

```text
0-50%
50-70%
70-80%
80-90%
90-100%
```

### Top Requested Skills

```text
JavaScript
React
Node.js
Python
SQL
AWS
```

---

## 30. Profile Completeness

Calculate profile completeness.

Example:

```text
Profile Completeness

████████████████░░░░ 82%

✓ Resume
✓ Skills
✓ Experience
✓ Education
✓ Target Role
✓ Location
✗ Salary Preference
```

This should be calculated from actual profile fields.

---

## 31. Job Alerts

Optional feature.

Users can create saved searches.

Example:

```text
Backend Developer
Remote
India
Node.js
```

RoleScout can periodically search for new jobs matching the saved search.

This feature should use background workers.

---

## 32. Notifications

Optional notification system.

Possible notifications:

```text
New high-match job found

"3 new jobs match your profile above 90%."
```

Application reminders:

```text
Follow up with Company X
```

Notifications should not spam users.

---

## 33. AI Architecture

Use agents only where they provide useful reasoning.

Recommended agents:

```text
ResumeAgent
SearchPlannerAgent
JobRequirementAgent
MatchExplanationAgent
```

The matching score itself should remain deterministic.

Agents should interact with tools/services rather than directly manipulating the database.

Example:

```text
SearchPlannerAgent
       |
       v
SearchJobTool
       |
       v
JobSearchService
       |
       v
JobSearchProvider
```

---

## 34. AI Provider Abstraction

Do not scatter OpenAI API calls throughout the codebase.

Create:

```ts
interface LLMProvider {
  generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>
  ): Promise<T>;
}
```

Possible implementation:

```text
ai/
├── llm-provider.ts
├── openai-provider.ts
├── prompts/
└── schemas/
```

This allows the AI provider to be replaced later.

---

## 35. Redis

Use Redis for:

- BullMQ
- Job search caching
- Rate limiting
- Temporary processing state
- Optional recommendation caching

Example:

```text
jobs:{queryHash}:{location}:{filters}
```

Use TTLs.

Do not cache indefinitely.

---

## 36. Background Jobs

Use BullMQ.

Recommended queues:

```text
resume-processing
job-search
job-processing
job-matching
notifications
```

Workers should support:

- Retries
- Backoff
- Failure handling
- Logging
- Idempotency where possible

---

## 37. API

Use versioned REST APIs.

Example:

```text
/api/v1/auth
/api/v1/users
/api/v1/profile
/api/v1/resumes
/api/v1/jobs
/api/v1/searches
/api/v1/saved-jobs
/api/v1/applications
/api/v1/statistics
/api/v1/notifications
```

---

## 38. Backend Architecture

Use a modular monolith.

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

Do not create microservices unless there is a demonstrated need.

---

## 39. Frontend Architecture

Use:

- React
- TypeScript
- Vite
- Tailwind
- React Router
- TanStack Query

Structure:

```text
client/src/
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

---

## 40. Main Pages

```text
/
Landing page

/login
Login

/register
Registration

/dashboard
Personal dashboard

/jobs
Job discovery

/jobs/:id
Job details

/resume
Resume/profile management

/applications
Application tracker

/saved
Saved jobs

/profile
Candidate profile

/settings
Settings
```

---

## 41. Landing Page

The landing page should explain the product simply.

Primary message:

> Find jobs that actually match you.

Explain:

```text
Upload your resume
        |
        v
Understand your skills
        |
        v
Search thousands of jobs
        |
        v
Rank by your fit
        |
        v
Apply smarter
```

Include:

- Product explanation
- Example job card
- Match score demonstration
- Feature overview
- CTA

---

## 42. UI Principles

The UI should feel like a modern SaaS product.

Prioritize:

- Clean typography
- Strong hierarchy
- Useful whitespace
- Clear match scores
- Fast navigation
- Responsive layout
- Good loading states
- Useful empty states

Avoid excessive animations.

The job feed should remain the visual focus.

---

## 43. Error Handling

Implement:

- Global backend error handler
- Typed application errors
- Validation errors
- External API failures
- LLM failures
- Database errors
- Queue failures

Never expose stack traces in production.

---

## 44. Security

Implement:

- Password hashing
- Authentication
- Authorization
- HTTP-only cookies
- CORS
- Rate limiting
- Security headers
- Input validation
- File validation
- Upload size limits
- Environment variables for secrets

Never expose these to the frontend:

```text
OPENAI_API_KEY
JOB_SEARCH_API_KEY
DATABASE_URL
AUTH_SECRET
```

---

## 45. Logging

Use structured logging.

Important events:

```text
User registered
User logged in
Resume uploaded
Resume processed
Search created
Search completed
Provider failed
Job normalized
Job deduplicated
Job matched
AI request failed
Application created
```

Include request IDs where possible.

---

## 46. Testing

Prioritize tests for business logic.

### Unit Tests

- Match scoring
- Skill normalization
- Job normalization
- Deduplication
- Search query generation
- Profile completeness
- Statistics calculations

### Integration Tests

- Authentication
- Resume processing
- Job search
- Saved jobs
- Applications

### Frontend Tests

Focus on important interactions:

- Job filtering
- Save job
- Application status
- Resume upload
- Authentication state

Do not chase meaningless 100% coverage.

---

## 47. Database Models

Initial models should include approximately:

```text
User
CandidateProfile
Resume
Skill
CandidateSkill
Job
JobSkill
Search
SearchJob
SavedJob
Application
ApplicationNote
```

Optional later:

```text
SavedSearch
Notification
JobAlert
```

Use Prisma relations.

Avoid unnecessary duplication.

---

## 48. Environment Variables

Create `.env.example`.

Expected variables:

```env
NODE_ENV=development

PORT=4000

DATABASE_URL=

REDIS_URL=

OPENAI_API_KEY=

JOB_SEARCH_API_KEY=

AUTH_SECRET=

CLIENT_URL=http://localhost:5173
```

Never commit real credentials.

---

## 49. Docker

Provide Docker Compose for local infrastructure.

Services:

```text
PostgreSQL
Redis
```

Frontend/backend may initially run locally.

---

## 50. Deployment

Recommended deployment architecture:

```text
React/Vite
      |
      v
Vercel

Node API
      |
      v
Render / Railway / Fly.io

PostgreSQL
      |
      v
Neon

Redis
      |
      v
Upstash
```

The exact providers may change.

The architecture should remain provider-independent.

---

## 51. Performance

Important considerations:

- Cache repeated job searches
- Paginate job results
- Index frequently queried database fields
- Avoid N+1 queries
- Use background jobs for expensive processing
- Avoid unnecessary LLM calls
- Batch operations where appropriate
- Do not send entire job databases to the LLM

---

## 52. Cost Control

AI calls should be minimized.

Do not send the same job to an LLM repeatedly.

Cache:

- Extracted job requirements
- Candidate profile
- AI explanations where appropriate

Prefer deterministic code whenever possible.

---

## 53. Important AI Constraint

RoleScout should NOT be an application where an LLM controls the entire system.

Bad architecture:

```text
User
 |
 v
LLM
 |
 v
LLM decides everything
 |
 v
Database
```

Preferred architecture:

```text
User
 |
 v
Backend
 |
 v
Deterministic Services
 |
 v
AI where useful
 |
 v
Validated Result
 |
 v
Database
```

AI should augment the system rather than replace normal software engineering.

---

## 54. MVP Definition

The MVP is complete when a user can:

1. Register/login
2. Upload a resume
3. Get a structured candidate profile
4. Edit their profile
5. Search for jobs
6. Retrieve real jobs from an external provider
7. See normalized jobs
8. See match scores
9. See matching/missing skills
10. View AI explanations
11. Save jobs
12. Apply externally
13. Track applications
14. View dashboard statistics

---

## 55. Future Features

Possible future additions:

- Multiple resume versions
- Resume improvement suggestions
- Job-specific resume tailoring
- Cover letter generation
- Interview preparation
- Skill-gap analysis
- Learning recommendations
- Salary analysis
- Company research
- Company comparison
- Job alerts
- Email notifications
- Browser extension
- LinkedIn/job-site import
- Application deadline reminders
- AI career roadmap
- Personalized job-search strategy

These should NOT be implemented until the core product is stable.

---

## 56. Development Phases

### Phase 1 — Foundation

- Project setup
- React frontend
- Node backend
- PostgreSQL
- Prisma
- Redis
- Docker Compose
- Authentication
- Basic dashboard

### Phase 2 — Resume Intelligence

- Resume upload
- PDF/DOCX extraction
- Candidate profile
- Resume Agent
- Profile editing

### Phase 3 — Job Discovery

- Job provider interface
- External API integration
- Job normalization
- Job persistence
- Deduplication
- Search UI

### Phase 4 — Async Processing

- BullMQ
- Search workers
- Resume workers
- Job processing workers
- Redis caching

### Phase 5 — Matching

- Skill normalization
- Requirement extraction
- Deterministic match scoring
- Match explanations
- Ranked job feed

### Phase 6 — Application Management

- Saved jobs
- Application tracker
- Kanban board
- Application notes
- Search history

### Phase 7 — Analytics

- User statistics
- Match distribution
- Application funnel
- Top skills
- Profile completeness
- Dashboard charts

### Phase 8 — Production

- Testing
- Rate limiting
- Logging
- Error monitoring
- Security review
- Performance optimization
- Deployment

---

## 57. Definition of Done

A feature is only considered complete when:

- Frontend works
- Backend API works
- Database changes are implemented
- Validation exists
- Error handling exists
- Loading states exist
- Empty states exist
- Tests exist where appropriate
- Environment variables are documented
- Documentation is updated

Do not mark a feature complete simply because the UI exists.

---

## 58. Engineering Principles

1. Build a modular monolith.
2. Keep business logic out of route handlers.
3. Keep provider-specific code isolated.
4. Keep AI-provider-specific code isolated.
5. Prefer deterministic logic over unnecessary AI.
6. Validate all external input.
7. Validate all AI output.
8. Never expose secrets.
9. Avoid unnecessary complexity.
10. Avoid premature microservices.
11. Use background processing for expensive operations.
12. Make important operations observable.
13. Write tests for important business logic.
14. Keep the codebase maintainable.
15. Build features incrementally.

---

## 59. Product Identity

**Product Name:** RoleScout

**Tagline:** Find jobs that actually match you.

**Positioning:** AI-powered job discovery and career matching.

The product should feel like a personal job-search engine rather than another job listing website.
