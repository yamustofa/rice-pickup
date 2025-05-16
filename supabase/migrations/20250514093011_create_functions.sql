-- Function to automatically create month records if they don't exist
CREATE OR REPLACE FUNCTION create_month_if_not_exists(
  year_val INTEGER,
  month_val INTEGER
) RETURNS UUID AS $$
DECLARE
  month_id UUID;
BEGIN
  -- Check if month record already exists
  SELECT id INTO month_id FROM months WHERE year = year_val AND month = month_val;
  
  -- If not, create it
  IF month_id IS NULL THEN
    INSERT INTO months (year, month)
    VALUES (year_val, month_val)
    RETURNING id INTO month_id;
  END IF;
  
  RETURN month_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate pickup against user's quota
CREATE OR REPLACE FUNCTION validate_pickup_quota() RETURNS TRIGGER AS $$
DECLARE
  user_quota INTEGER;
  current_total INTEGER;
BEGIN
  -- Get user's quota
  SELECT quota INTO user_quota FROM profiles WHERE id = NEW.user_id;
  
  -- Get current total pickups for this month
  SELECT COALESCE(SUM(quantity), 0) INTO current_total
  FROM pickups
  WHERE user_id = NEW.user_id AND month_id = NEW.month_id;
  
  -- Check if new pickup would exceed quota
  IF (current_total + NEW.quantity) > user_quota THEN
    RAISE EXCEPTION 'Pickup exceeds monthly quota of % sacks', user_quota;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate pickups against quota
CREATE TRIGGER check_pickup_quota
BEFORE INSERT ON pickups
FOR EACH ROW
EXECUTE FUNCTION validate_pickup_quota();

-- Create default profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, quota)
  VALUES (NEW.id, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
