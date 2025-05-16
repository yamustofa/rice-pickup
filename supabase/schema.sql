-- IMPORTANT: This file is for reference only.
-- The actual schema is now managed through migration files in supabase/migrations/
-- Please make changes to the migration files instead of this file.

-- Migration files:
-- 1. 20250514092914_create_base_schema.sql - Base tables
-- 2. 20250514092934_create_views.sql - Views
-- 3. 20250514093005_enable_rls.sql - RLS policies
-- 4. 20250514093011_create_functions.sql - Functions and triggers

-- For reference, below is the complete schema:

-- Create tables for the Rice Pickup Tracking application

-- Enable Row-Level Security (RLS)
ALTER DATABASE postgres SET "anon.quota" TO '1';

-- Users Profile Extension
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  "name" TEXT,
  "division_id" UUID,
  "quota" INTEGER DEFAULT 1 CHECK (quota >= 1 AND quota <= 3),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "avatar_config" jsonb
);

-- Divisions
CREATE TABLE IF NOT EXISTS "divisions" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "created_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key relationship to profiles table
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_division_id_fkey" 
  FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE SET NULL;

-- Months (for tracking pickup status)
CREATE TABLE IF NOT EXISTS "months" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE("year", "month")
);

-- Pickup Logs
CREATE TABLE IF NOT EXISTS "pickups" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "month_id" UUID REFERENCES "months"("id") ON DELETE CASCADE NOT NULL,
  "quantity" INTEGER NOT NULL CHECK (quantity > 0),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "pickup_date" DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create a view to calculate total pickups per user per month
CREATE OR REPLACE VIEW "user_monthly_pickups" AS
SELECT 
  p.user_id,
  p.month_id,
  m.year,
  m.month,
  SUM(p.quantity) AS total_quantity,
  prof.quota,
  CASE WHEN SUM(p.quantity) >= prof.quota THEN TRUE ELSE FALSE END AS is_completed
FROM 
  "pickups" p
JOIN 
  "months" m ON p.month_id = m.id
JOIN 
  "profiles" prof ON p.user_id = prof.id
GROUP BY 
  p.user_id, p.month_id, m.year, m.month, prof.quota;

-- Enable Row-Level Security (RLS)
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "divisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "months" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pickups" ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON "profiles" FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON "profiles" FOR UPDATE
  USING (auth.uid() = id);

-- Divisions Policies
CREATE POLICY "Divisions are viewable by everyone"
  ON "divisions" FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create divisions"
  ON "divisions" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only division creators can update divisions"
  ON "divisions" FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Only division creators can delete divisions"
  ON "divisions" FOR DELETE
  USING (auth.uid() = created_by);

-- Months Policies
CREATE POLICY "Months are viewable by everyone"
  ON "months" FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create months"
  ON "months" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Pickups Policies
CREATE POLICY "Users can view all pickups"
  ON "pickups" FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own pickups"
  ON "pickups" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create month records if they don't exist
CREATE OR REPLACE FUNCTION create_month_if_not_exists(
  year_val INTEGER,
  month_val INTEGER
) RETURNS UUID AS $$
DECLARE
  month_id UUID;
BEGIN
  SET search_path = public;
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
  SET search_path = public;
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
  SET search_path = public;
  INSERT INTO public.profiles (id, quota)
  VALUES (NEW.id, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 