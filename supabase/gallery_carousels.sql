begin;
alter table public.wedding_gallery add column if not exists media jsonb;
alter table public.wedding_gallery add column if not exists caption text;
comment on column public.wedding_gallery.media is 'Ordered media files in a single post. Null preserves legacy single-file posts.';
notify pgrst, 'reload schema';
commit;
