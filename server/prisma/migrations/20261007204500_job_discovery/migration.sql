CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyUrl" TEXT,
    "jobUrl" TEXT NOT NULL,
    "location" TEXT,
    "employmentType" TEXT,
    "workplaceType" TEXT,
    "description" TEXT NOT NULL,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "salaryCurrency" TEXT,
    "salaryPeriod" TEXT,
    "postedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobSearch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Job_source_externalId_key" ON "Job"("source", "externalId");
CREATE INDEX "Job_source_idx" ON "Job"("source");
CREATE INDEX "Job_postedAt_idx" ON "Job"("postedAt");
CREATE INDEX "Job_companyName_idx" ON "Job"("companyName");
CREATE INDEX "Job_location_idx" ON "Job"("location");
CREATE INDEX "Job_workplaceType_idx" ON "Job"("workplaceType");
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX "JobSearch_userId_createdAt_idx" ON "JobSearch"("userId", "createdAt");

ALTER TABLE "JobSearch" ADD CONSTRAINT "JobSearch_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
