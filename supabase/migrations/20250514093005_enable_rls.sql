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

CREATE POLICY "Users can update their own pickups"
  ON "pickups" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pickups"
  ON "pickups" FOR DELETE
  USING (auth.uid() = user_id);
