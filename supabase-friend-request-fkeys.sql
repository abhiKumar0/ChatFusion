-- Add foreign key constraints for FriendRequest table
-- This will fix the PGRST200 error by creating the proper relationships

-- First, check if constraints already exist and drop them if needed
ALTER TABLE "FriendRequest" 
  DROP CONSTRAINT IF EXISTS "FriendRequest_senderId_fkey";

ALTER TABLE "FriendRequest" 
  DROP CONSTRAINT IF EXISTS "FriendRequest_receiverId_fkey";

-- Add foreign key constraint for senderId
ALTER TABLE "FriendRequest"
  ADD CONSTRAINT "FriendRequest_senderId_fkey"
  FOREIGN KEY ("senderId")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- Add foreign key constraint for receiverId
ALTER TABLE "FriendRequest"
  ADD CONSTRAINT "FriendRequest_receiverId_fkey"
  FOREIGN KEY ("receiverId")
  REFERENCES "User"("id")
  ON DELETE CASCADE;

-- Verify the constraints were created
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'FriendRequest';
