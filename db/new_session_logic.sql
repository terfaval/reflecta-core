-- A. sessions tábla módosítások
ALTER TABLE sessions
ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE sessions
ADD COLUMN recent_strategies TEXT[] DEFAULT '{}';

ALTER TABLE sessions
ADD COLUMN active_function_state JSONB DEFAULT NULL;

-- B. Új session_summaries tábla
CREATE TABLE session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  summary_text TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- C. profiles tábla bővítés
ALTER TABLE profiles
ADD COLUMN tone_examples TEXT[] DEFAULT '{}';
