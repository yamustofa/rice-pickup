-- Add RLS policy for users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON "profiles" FOR DELETE
  USING (auth.uid() = id);

-- Add RLS policy for users to delete their own pickups
CREATE POLICY "Users can delete their own pickups"
  ON "pickups" FOR DELETE
  USING (auth.uid() = user_id); 