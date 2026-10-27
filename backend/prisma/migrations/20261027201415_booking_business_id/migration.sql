/*
  Warnings:

  - Added the required column `businessId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Booking_serviceId_startTime_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "businessId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_businessId_startTime_idx" ON "Booking"("businessId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
