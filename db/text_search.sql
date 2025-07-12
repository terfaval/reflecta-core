-- 1. Teljes szövegindexeléshez tsvector oszlop hozzáadása
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'content_tsv'
  ) THEN
    ALTER TABLE entries
    ADD COLUMN content_tsv tsvector
    GENERATED ALWAYS AS (
      to_tsvector('hungarian', coalesce(content, ''))
    ) STORED;
  END IF;
END $$;

-- 2. GIN index a tsvector oszlopon (full-text search gyorsítására)
CREATE INDEX IF NOT EXISTS entries_content_tsv_idx
  ON entries USING GIN (content_tsv);

-- 3. Kompozit B-tree index: session_id + created_at
CREATE INDEX IF NOT EXISTS entries_session_time_idx
  ON entries (session_id, created_at);

-- 4. Opcionális: index session_id + role alapján (gyakori szűrés esetén)
CREATE INDEX IF NOT EXISTS entries_session_role_idx
  ON entries (session_id, role);

-- 5. Opcionális: ILIKE keresések gyorsításához trigram index (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS entries_content_trgm_idx
  ON entries USING GIN (content gin_trgm_ops);
