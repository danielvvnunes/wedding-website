-- Likes and comments for the public wedding gallery.
-- Guests do not need accounts; the app stores a random browser id locally.

ALTER TABLE wedding_gallery
ADD COLUMN IF NOT EXISTS anonymous_id text;

ALTER TABLE wedding_gallery
ADD COLUMN IF NOT EXISTS caption text;

CREATE TABLE IF NOT EXISTS wedding_gallery_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id text NOT NULL,
  anonymous_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wedding_gallery_likes_once_per_visitor
ON wedding_gallery_likes (gallery_item_id, anonymous_id);

CREATE INDEX IF NOT EXISTS wedding_gallery_likes_gallery_item_id_idx
ON wedding_gallery_likes (gallery_item_id);

CREATE TABLE IF NOT EXISTS wedding_gallery_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id text NOT NULL,
  anonymous_id text,
  commenter_name text NOT NULL DEFAULT 'Convidado',
  comment_text text NOT NULL CHECK (length(trim(comment_text)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wedding_gallery_comments_gallery_item_id_created_at_idx
ON wedding_gallery_comments (gallery_item_id, created_at);

ALTER TABLE wedding_gallery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_gallery_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS wedding_gallery_anonymous_id_idx
ON wedding_gallery (anonymous_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wedding_gallery_likes'
      AND policyname = 'Allow public read on gallery likes'
  ) THEN
    CREATE POLICY "Allow public read on gallery likes"
    ON wedding_gallery_likes
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wedding_gallery_likes'
      AND policyname = 'Allow public insert on gallery likes'
  ) THEN
    CREATE POLICY "Allow public insert on gallery likes"
    ON wedding_gallery_likes
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wedding_gallery_likes'
      AND policyname = 'Allow public delete on gallery likes'
  ) THEN
    CREATE POLICY "Allow public delete on gallery likes"
    ON wedding_gallery_likes
    FOR DELETE
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wedding_gallery_comments'
      AND policyname = 'Allow public read on gallery comments'
  ) THEN
    CREATE POLICY "Allow public read on gallery comments"
    ON wedding_gallery_comments
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wedding_gallery_comments'
      AND policyname = 'Allow public insert on gallery comments'
  ) THEN
    CREATE POLICY "Allow public insert on gallery comments"
    ON wedding_gallery_comments
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wedding_gallery_comments'
      AND policyname = 'Allow public delete on gallery comments'
  ) THEN
    CREATE POLICY "Allow public delete on gallery comments"
    ON wedding_gallery_comments
    FOR DELETE
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wedding_gallery'
      AND policyname = 'Allow public delete on own gallery posts'
  ) THEN
    CREATE POLICY "Allow public delete on own gallery posts"
    ON wedding_gallery
    FOR DELETE
    USING (true);
  END IF;
END $$;
