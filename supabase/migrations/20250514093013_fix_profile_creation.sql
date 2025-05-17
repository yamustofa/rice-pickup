-- Add RLS policy for profile insertion
CREATE POLICY "System can create profiles"
  ON "profiles" FOR INSERT
  WITH CHECK (true);

-- Modify the handle_new_user function to handle existing profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, quota)
    VALUES (NEW.id, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 