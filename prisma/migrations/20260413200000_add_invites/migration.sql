-- Create Invite table for email-based user invitations
CREATE TABLE "Invite" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "roles"     "Role"[] NOT NULL DEFAULT '{}',
    "token"     TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
