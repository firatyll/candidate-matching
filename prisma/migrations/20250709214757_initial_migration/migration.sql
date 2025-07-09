-- CreateEnum
CREATE TYPE "candidate_availability" AS ENUM ('immediate', 'within_week', 'within_month', 'not_available');

-- CreateEnum
CREATE TYPE "experience_level" AS ENUM ('entry', 'mid', 'senior', 'lead');

-- CreateEnum
CREATE TYPE "employment_type" AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('active', 'inactive', 'filled');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('pending', 'reviewed', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "skills" TEXT[],
    "experience" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "availability" "candidate_availability" NOT NULL,
    "salary_expectation" INTEGER,
    "resume_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "required_skills" TEXT[],
    "preferred_skills" TEXT[],
    "experience_level" "experience_level" NOT NULL,
    "location" TEXT NOT NULL,
    "remote_ok" BOOLEAN NOT NULL DEFAULT false,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "employment_type" "employment_type" NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_position_id" TEXT NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'pending',
    "cover_letter" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_candidate_id_job_position_id_key" ON "job_applications"("candidate_id", "job_position_id");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
