-- Migration to add verification token fields to User table
ALTER TABLE User ADD COLUMN verificationToken TEXT;
ALTER TABLE User ADD COLUMN verificationExpires DATETIME;
