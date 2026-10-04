BEGIN;

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL,
  title_es text,
  author text NOT NULL,
  shelf text NOT NULL CHECK (shelf IN ('currently_reading', 'want_to_read', 'read')),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  page_count integer CHECK (page_count BETWEEN 1 AND 20000),
  cover_url text,
  cover_texture_url text,
  cover_aspect double precision NOT NULL DEFAULT 0.625 CHECK (cover_aspect BETWEEN 0.2 AND 2),
  back_cover_url text,
  accent_color text NOT NULL DEFAULT '#b99a5b' CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  spine_color text NOT NULL DEFAULT '#b99a5b' CHECK (spine_color ~ '^#[0-9a-fA-F]{6}$'),
  spine_text_color text CHECK (spine_text_color ~ '^#[0-9a-fA-F]{6}$'),
  back_color text NOT NULL DEFAULT '#b99a5b' CHECK (back_color ~ '^#[0-9a-fA-F]{6}$'),
  spine_title_override text,
  spine_author_override text,
  goodreads_url text,
  description_en text NOT NULL DEFAULT '',
  description_es text NOT NULL DEFAULT '',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);
CREATE INDEX IF NOT EXISTS books_shelf_order_idx ON books (shelf, sort_order);

CREATE OR REPLACE FUNCTION touch_book_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS books_updated_at ON books;
CREATE TRIGGER books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION touch_book_updated_at();

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL CHECK (username = lower(username)),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_hash text
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  ip_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS login_attempts_limit_idx ON login_attempts (username, ip_hash, attempted_at);
CREATE INDEX IF NOT EXISTS login_attempts_cleanup_idx ON login_attempts (attempted_at);

-- Serialize reservations before password hashing. Parallel requests cannot race past five attempts.
CREATE OR REPLACE FUNCTION reserve_login_attempt(p_username text, p_ip_hash text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE attempt_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_username || ':' || p_ip_hash, 0));
  IF (SELECT count(*) FROM login_attempts
      WHERE username = p_username AND ip_hash = p_ip_hash AND NOT success
      AND attempted_at > now() - interval '15 minutes') >= 5 THEN
    RETURN NULL;
  END IF;
  INSERT INTO login_attempts (username, ip_hash) VALUES (p_username, p_ip_hash) RETURNING id INTO attempt_id;
  RETURN attempt_id;
END;
$$;
COMMIT;
