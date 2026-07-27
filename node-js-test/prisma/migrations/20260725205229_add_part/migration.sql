-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "minimumStock" INTEGER NOT NULL,
    "averageDailySales" DOUBLE PRECISION NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "criticalityLevel" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parts_companyId_idx" ON "parts"("companyId");

-- CreateIndex
CREATE INDEX "parts_companyId_category_idx" ON "parts"("companyId", "category");

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
