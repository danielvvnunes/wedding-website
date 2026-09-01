CREATE INDEX IF NOT EXISTS wedding_gallery_created_at_desc_idx
ON wedding_gallery (created_at DESC);

CREATE INDEX IF NOT EXISTS wedding_gallery_created_at_id_desc_idx
ON wedding_gallery (created_at DESC, id DESC);
