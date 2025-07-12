-- USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  anon_token text not null,
  wp_user_id text unique,
  email text,
  created_at timestamp default now(),
  role text DEFAULT 'basic',
  feature_flags jsonb DEFAULT '{}'
);

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  profile_name text references profiles(name)
);

create table if not exists profiles (
  name TEXT PRIMARY KEY,
  color TEXT,
  role TEXT, -- ÚJ oszlop: a profil szerepe, pl. "érzelmi kísérő"
  description TEXT,
  prompt_core TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- PROFILE_METADATA: szemlélet, világkép, inspirációk, zárási logika
create table if not exists profile_metadata (
  profile TEXT PRIMARY KEY,
  domain TEXT,
  worldview TEXT,
  inspirations JSONB,
  not_suitable_for JSONB,
  closing_trigger TEXT,
  closing_style TEXT,
  preferred_context JSONB,
  response_focus TEXT,
  question_archetypes JSONB,
  interaction_rhythm TEXT,
  connects_well_after JSONB,
  connects_well_before JSONB,
  avoidance_logic JSONB,
  style_pace TEXT,
  style_tone TEXT,
  style_rhythm TEXT,
  style_structure TEXT,
  style_visuality TEXT,
  style_directiveness TEXT,
  style_absorption_style TEXT
);


-- PROFILE REACTIONS TABLE
create table IF NOT EXISTS profile_reactions (
  id SERIAL PRIMARY KEY,
  profile TEXT,
  rarity TEXT,
  trigger_context TEXT,
  reaction TEXT,
  activation_condition JSONB,
  priority_score NUMERIC,
  response_block_type TEXT,
  cooldown_seconds INTEGER,
  min_session_span INTEGER
);

-- PROFILE RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS profile_recommendations (
  id SERIAL PRIMARY KEY,
  profile TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  trigger_text TEXT,
  activation_tags TEXT,
  guidance_direction TEXT,
  target_mode TEXT,
  intensity TEXT,
  can_lead BOOLEAN
);

-- PROFILE RECOMMENDATION STEPS
CREATE TABLE IF NOT EXISTS recommendation_steps (
  id SERIAL PRIMARY KEY,
  recommendation_id INTEGER NOT NULL REFERENCES profile_recommendations(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  completion_condition TEXT
);

-- PROFILE STARTING PROMPTS
CREATE TABLE IF NOT EXISTS profile_starting_prompts (
  id SERIAL PRIMARY KEY,
  profile TEXT,
  label TEXT,
  message TEXT,
  priority INTEGER,
  prompt_type TEXT
);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  profile text REFERENCES profiles(name),
  started_at timestamp DEFAULT now(),
  title text,
  is_archived boolean DEFAULT false,
  conversation_participants text[] DEFAULT ARRAY[]::text[]
);

-- SESSIONS
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  profile text references profiles(name),
  started_at timestamp default now(),
  ended_at timestamp,
  label text,
  conversation_id uuid references conversations(id) on delete cascade,
  label_confidence numeric -- opcionális bizalomérték (0–1)
);

-- ENTRIES (frissített)
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text,
  created_at timestamp default now(),
  reaction_tag text,
  recommendation_tag text
);

-- SYSTEM EVENTS
create table if not exists system_events (
  id serial primary key,
  session_id uuid references sessions(id) on delete cascade,
  event_type text,
  timestamp timestamp default now(),
  note text
);

-- ÚJ TÁBLA: entry_labels
create table if not exists entry_labels (
  entry_id uuid references entries(id) on delete cascade,
  label_type text,  -- pl. "emotion", "theme", "strategy"
  label_value text,
  confidence float,
  added_by text  -- "system" vagy user_id
);

-- ÚJ TÁBLA: conversation_arcs
create table if not exists conversation_arcs (
  session_id uuid references sessions(id) on delete cascade,
  arc_type text,            -- pl. "elmélyülő", "spirális", "átfordító"
  pivot_points jsonb,       -- fontos entry_id-k
  depth_estimate text,      -- "felszínes", "közepes", "mély", "archetípusos"
  depth_confidence numeric,
  strategy_summary jsonb,
  profile_sequence jsonb    -- résztvevő profilok
);

-- új tábla: aktív funkciók
create table if not exists active_functions (
  session_id uuid primary key references sessions(id) on delete cascade,
  function_name text not null,
  history jsonb default '[]',
  is_closed boolean default false,
  closure_question text,
  session_prefix text,
  updated_at timestamp default now()
);

-- Reflecta: login_tokens table migration
create table if not exists login_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  expires_at timestamp not null,
  used boolean default false,
  created_at timestamp default now()
);

create index if not exists login_tokens_user_idx on login_tokens(user_id);
