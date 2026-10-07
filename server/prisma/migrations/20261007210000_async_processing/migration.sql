CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "Resume"
  ADD COLUMN "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "processingCompletedAt" TIMESTAMP(3),
  ADD COLUMN "processingFailedAt" TIMESTAMP(3),
  ADD COLUMN "processingErrorCode" TEXT;

ALTER TABLE "JobSearch"
  ADD COLUMN "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "processingCompletedAt" TIMESTAMP(3),
  ADD COLUMN "processingFailedAt" TIMESTAMP(3),
  ADD COLUMN "processingErrorCode" TEXT;
