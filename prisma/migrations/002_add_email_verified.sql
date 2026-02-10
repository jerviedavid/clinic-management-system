-- Add emailVerified field to User table for Google OAuth support
-- This field tracks if a user's email has been verified (automatically true for Google sign-ins)

ALTER TABLE User ADD COLUMN emailVerified BOOLEAN DEFAULT 0;
