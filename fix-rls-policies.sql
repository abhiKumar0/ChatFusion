-- TEMPORARY: Disable RLS on FriendRequest table to test deletion
-- This is for debugging purposes only - you should set up proper RLS policies instead

-- Disable RLS (run this in Supabase SQL Editor)
ALTER TABLE "FriendRequest" DISABLE ROW LEVEL SECURITY;

-- After testing, you should re-enable RLS and set up proper policies:
-- ALTER TABLE "FriendRequest" ENABLE ROW LEVEL SECURITY;

-- Proper RLS policies for FriendRequest (uncomment and modify as needed):
/*
-- Allow users to view friend requests they're involved in
CREATE POLICY "Users can view their own friend requests"
ON "FriendRequest"
FOR SELECT
USING (
  auth.uid() = "senderId" OR auth.uid() = "receiverId"
);

-- Allow users to insert friend requests they send
CREATE POLICY "Users can send friend requests"
ON "FriendRequest"
FOR INSERT
WITH CHECK (
  auth.uid() = "senderId"
);

-- Allow users to update friend requests they receive  
CREATE POLICY "Users can update received friend requests"
ON "FriendRequest"
FOR UPDATE
USING (
  auth.uid() = "receiverId"
);

-- Allow users to delete friend requests they're involved in
CREATE POLICY "Users can delete their friend requests"
ON "FriendRequest"
FOR DELETE
USING (
  auth.uid() = "senderId" OR auth.uid() = "receiverId"
);
*/
