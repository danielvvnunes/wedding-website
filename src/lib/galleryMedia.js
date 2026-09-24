// Flat exports/wall retain every file; the app and moderation keep one row per post.
export function flattenGalleryMedia(rows) {
  return rows.flatMap(row => row.media?.length ? row.media.map(file => ({ ...row, ...file, media: null })) : [row]);
}
