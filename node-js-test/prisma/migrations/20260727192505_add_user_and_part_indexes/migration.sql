-- DropIndex
DROP INDEX "parts_companyId_idx";

-- CreateIndex
CREATE INDEX "parts_companyId_name_idx" ON "parts"("companyId", "name");

-- CreateIndex
CREATE INDEX "users_companyId_name_idx" ON "users"("companyId", "name");
