-- Create a unique index for email with case insensitivity
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "User_email_key" ON "User" (LOWER("email"));

-- Add a database-level constraint to enforce case-insensitive uniqueness
ALTER TABLE "User" ADD CONSTRAINT "User_email_case_insensitive" 
UNIQUE USING INDEX "User_email_key";