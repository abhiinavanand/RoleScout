# RoleScout

### Find jobs that fit you, not jobs you have to dig through.

RoleScout is a full-stack job discovery and matching platform that turns a user's resume and preferences into personalized job recommendations.

It searches external job listings, normalizes and deduplicates results, evaluates candidate-job compatibility using an explainable matching engine, and provides tools for saving jobs, tracking applications, and understanding job-search activity.

---

## Features

### Resume-powered candidate profile

Upload a resume and automatically extract relevant candidate information such as:

- Skills and technologies
- Experience
- Education
- Job preferences
- Location preferences
- Salary expectations

The extracted information is used throughout the platform to personalize job discovery and matching.

### Personalized job discovery

Search for jobs using:

- Role/title
- Location
- Remote or hybrid preferences
- Employment type
- Salary preferences
- Candidate profile

Job listings from external providers are converted into a consistent internal format before being stored and displayed.

### Explainable job matching

Instead of returning an unexplained recommendation score, RoleScout breaks down why a job matches a candidate.

The matching engine evaluates:

| Dimension | Weight |
|---|---:|
| Skills | 40% |
| Experience | 20% |
| Role relevance | 15% |
| Location / work mode | 10% |
| Salary | 10% |
| Employment type | 5% |

Unavailable information is handled without incorrectly penalizing the candidate.

Each match can provide:

- Overall compatibility score
- Matching skills
- Missing skills
- Experience alignment
- Role relevance
- Location compatibility
- Salary compatibility

### Job management

- Save interesting jobs
- Remove saved jobs
- View detailed job information
- Track application status
- Manage the job-search pipeline

### Application tracking

Track applications through different stages such as:

```text
Saved → Applied → Interview → Offer / Rejected
```

### Personalized recommendations

RoleScout uses the candidate profile, job history, saved jobs, and matching information to surface relevant opportunities.

### Job-search analytics

Track useful job-search activity including:

- Jobs discovered
- Saved jobs
- Applications
- Application pipeline
- Matching trends
- Search activity

---

# Architecture

RoleScout uses a modular full-stack architecture with asynchronous background processing for operations that involve external services or potentially long-running work.

```text
                         ┌─────────────────────┐
                         │    React Client     │
                         │   TypeScript/Vite   │
                         └──────────┬──────────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌─────────────────────┐
                         │    Express API      │
                         │      REST API       │
                         └───────┬─────┬───────┘
                                 │     │
                    ┌────────────┘     └─────────────┐
                    ▼                                ▼
             ┌─────────────┐                  ┌─────────────┐
             │ PostgreSQL  │                  │    Redis     │
             │   Prisma    │                  │    BullMQ    │
             └─────────────┘                  └──────┬──────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │ Background      │
                                            │ Workers         │
                                            └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │ External Job    │
                                            │ Provider        │
                                            └─────────────────┘
```

### Request flow

A job search does not require the API server to wait for the external provider to finish.

```text
Client
  │
  │ POST /jobs/search
  ▼
Express API
  │
  ├── Create search record
  │
  └── Enqueue background job
          │
          ▼
       BullMQ
          │
          ▼
       Worker
          │
          ├── Query provider
          ├── Normalize listings
          ├── Deduplicate jobs
          ├── Persist results
          └── Update search status
```

The API can return `202 Accepted` while the search continues in the background.

---

# Matching Engine

RoleScout separates **matching** from external AI services.

The numerical compatibility score is deterministic and based on candidate and job attributes.

```text
Candidate Profile
       │
       ├── Skills
       ├── Experience
       ├── Role
       ├── Location
       ├── Salary
       └── Employment Preferences
                │
                ▼
         Matching Engine
                │
                ▼
        Compatibility Score
                │
        ┌───────┴────────┐
        ▼                ▼
   Match Details    Explanation
```

AI-assisted processing can be used for unstructured tasks such as extracting information from resumes, understanding job requirements, generating search queries, and producing natural-language explanations.

Deterministic logic remains responsible for the actual matching and ranking calculations.

---

# Job Provider Architecture

External job providers are isolated behind a provider abstraction.

```text
                 Job Search Service
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       External Provider      Mock Provider
```

This keeps provider-specific API formats out of the core application and allows additional providers to be introduced without changing the rest of the job-discovery system.

Provider responses are normalized into the application's canonical job model before persistence.

---

# Data Flow

### Resume processing

```text
Resume Upload
     │
     ▼
Validation
     │
     ▼
Background Processing
     │
     ▼
Resume Extraction
     │
     ▼
Candidate Profile
     │
     ▼
PostgreSQL
```

### Job discovery

```text
Search Request
     │
     ▼
Search Parameters
     │
     ▼
Background Queue
     │
     ▼
External Provider
     │
     ▼
Normalize
     │
     ▼
Deduplicate
     │
     ▼
Match
     │
     ▼
PostgreSQL
     │
     ▼
Frontend
```

---

# Security

RoleScout implements several application-level security controls:

- HTTP-only authentication cookies
- Password hashing
- Session/version-based authentication invalidation
- Resource ownership checks
- Server-side API key management
- Request rate limiting
- Helmet security headers
- Strict CORS configuration
- File type and upload-size validation
- Centralized error handling
- Request IDs for tracing
- Server-side authorization checks

External API credentials are kept on the server and are never exposed to the browser.

---

# API

RoleScout exposes a versioned REST API.

Example resource groups:

```text
/api/v1/auth
/api/v1/profile
/api/v1/resumes
/api/v1/jobs
/api/v1/saved-jobs
/api/v1/applications
/api/v1/recommendations
/api/v1/analytics
```

An OpenAPI specification is included in the repository for the API contract.

---

# Testing

The backend includes automated tests covering core application behavior, including:

- Authentication
- Session invalidation
- Authorization and resource ownership
- Job matching
- Job normalization
- Job deduplication
- Recommendation logic
- Analytics
- Queue payloads
- Provider failure handling
- Job discovery boundaries

The project also uses automated CI checks for validation.

---

# Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript

### Data

- PostgreSQL
- Prisma ORM
- Redis

### Background Processing

- BullMQ

### Integrations

- External job-search provider
- Resume processing
- AI-assisted extraction and reasoning

### Engineering

- REST API
- OpenAPI
- Automated testing
- GitHub Actions
- Docker

---

# Project Structure

```text
RoleScout/
├── client/                 # React frontend
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── modules/
│   │   ├── middleware/
│   │   ├── workers/
│   │   └── ...
│   └── prisma/
│
├── docs/                   # API and technical documentation
│
├── .github/
│   └── workflows/          # CI
│
├── docker-compose.yml
├── PROJECT_SPEC.md
└── README.md
```

---

# Local Development

## Requirements

- Node.js 20+
- npm
- Docker
- PostgreSQL
- Redis

## Installation

Clone the repository:

```bash
git clone https://github.com/abhiinavanand/RoleScout.git
cd RoleScout
```

Install dependencies:

```bash
npm install
```

Configure environment variables using the provided example environment files.

Start the required infrastructure:

```bash
docker compose up -d
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the development environment using the project's configured development scripts.

---

# Environment Variables

Create the required environment files from the provided examples.

Typical configuration includes:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
AI_API_KEY
JOB_PROVIDER_API_KEY
```

Secrets should never be committed to the repository.

---

# Engineering Highlights

### Asynchronous processing

Long-running resume and job-discovery operations are handled through BullMQ workers instead of blocking HTTP requests.

### Explainable matching

Job compatibility is calculated using explicit weighted dimensions rather than an opaque recommendation score.

### Data normalization

Provider-specific job responses are transformed into a canonical internal job representation.

### Deduplication

Jobs are identified using provider-specific identifiers where available, with fallback identity handling for listings without reliable external IDs.

### Secure authentication

Authentication uses server-managed HTTP-only cookies with session invalidation support.

### Modular architecture

Domain functionality is separated into modules while keeping the application deployable as a modular monolith.

---

# Why RoleScout?

Most job-search platforms leave candidates with hundreds of listings and little context about which opportunities actually fit.

RoleScout focuses on the candidate rather than just the job listing:

```text
Resume
  ↓
Candidate Profile
  ↓
Personalized Search
  ↓
Normalized Jobs
  ↓
Explainable Matching
  ↓
Recommendations
  ↓
Application Tracking
```

The goal is to reduce the gap between **finding jobs** and **finding relevant jobs**.

---

# License

This project is intended for educational and portfolio purposes.
