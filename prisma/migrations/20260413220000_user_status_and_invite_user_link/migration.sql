-- Add UserStatus enum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE');

-- Add status to User (all existing users are ACTIVE)
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- Add userId to Invite (nullable — old invites without a pre-created user are left as NULL)
ALTER TABLE "Invite" ADD COLUMN "userId" TEXT;

ALTER TABLE "Invite" ADD CONSTRAINT "Invite_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
