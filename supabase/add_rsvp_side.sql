-- Add side assignment for admin RSVP panel (Daniel / Francisca)
ALTER TABLE rsvp
ADD COLUMN IF NOT EXISTS side text
CHECK (side IN ('noivo', 'noiva') OR side IS NULL);

-- Allow updates from the admin dashboard (anon key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rsvp'
      AND policyname = 'Allow update on rsvp'
  ) THEN
    CREATE POLICY "Allow update on rsvp"
    ON rsvp
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
