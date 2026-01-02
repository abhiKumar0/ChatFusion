-- Test queries for debugging friend request deletion
-- Run these in Supabase SQL Editor to check if the data exists

-- 1. Check all friend requests in the database
SELECT * FROM "FriendRequest";

-- 2. Check friend requests for a specific user (replace 'YOUR_USER_ID' with actual user ID)
-- SELECT * FROM "FriendRequest" 
-- WHERE "senderId" = 'YOUR_USER_ID' OR "receiverId" = 'YOUR_USER_ID';

-- 3. Check if Row Level Security (RLS) is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'FriendRequest';

-- 4. Check RLS policies on FriendRequest table
SELECT * FROM pg_policies WHERE tablename = 'FriendRequest';

-- 5. Test delete without RLS (as superuser)
-- WARNING: Only use this to test, uncomment to run
-- DELETE FROM "FriendRequest" WHERE id = 'SOME_ID';
