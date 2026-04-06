/*
  Warnings:

  - You are about to drop the `application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "application" DROP CONSTRAINT "application_job_id_fkey";

-- DropTable
DROP TABLE "application";

-- DropTable
DROP TABLE "job";
