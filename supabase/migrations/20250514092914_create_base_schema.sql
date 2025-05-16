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
