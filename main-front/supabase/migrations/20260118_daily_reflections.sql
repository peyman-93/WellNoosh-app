-- Daily Reflections table for tracking mood, energy, sleep, and journal entries
CREATE TABLE IF NOT EXISTS daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_date DATE NOT NULL,
  mood_rating INTEGER DEFAULT 3 CHECK (mood_rating >= 1 AND mood_rating <= 5),
  energy_level INTEGER DEFAULT 3 CHECK (energy_level >= 1 AND energy_level <= 5),
  sleep_quality INTEGER DEFAULT 3 CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  water_intake INTEGER DEFAULT 0 CHECK (water_intake >= 0),
  notes TEXT DEFAULT '',
  wins TEXT DEFAULT '',
  gratitude TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reflection_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON daily_reflections(user_id, reflection_date DESC);

ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reflections"
  ON daily_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections"
  ON daily_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
  ON daily_reflections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections"
  ON daily_reflections FOR DELETE
  USING (auth.uid() = user_id);
