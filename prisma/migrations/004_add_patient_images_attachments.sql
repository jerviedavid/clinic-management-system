-- Add profile image and attachments fields to Patient table
-- For patient profile photos and document attachments

ALTER TABLE Patient ADD COLUMN profileImage TEXT;
ALTER TABLE Patient ADD COLUMN attachments TEXT;
