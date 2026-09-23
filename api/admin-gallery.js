import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const clean = value => String(value || '').trim().replace(/^['"]|['"]$/g, '');
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const expected = clean(process.env.GALLERY_ADMIN_PASSWORD);
    if (!expected) return res.status(503).json({ error: 'Falta configurar GALLERY_ADMIN_PASSWORD no servidor.' });
    const supplied = String(req.headers['x-gallery-password'] || '');
    const a = Buffer.from(expected), b = Buffer.from(supplied);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ error: 'Password incorreta.' });
    const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!key) return res.status(503).json({ error: 'Falta configurar o acesso do servidor à galeria.' });
    const db = createClient(clean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL), key, { auth: { persistSession: false } });
    const check = ({ data, error }) => { if (error) throw error; return data; };
    if (req.method === 'GET') {
      const offset = Number(new URL(req.url, 'https://local.test').searchParams.get('offset') || 0);
      if (!Number.isSafeInteger(offset) || offset < 0) return res.status(400).json({ error: 'Página inválida.' });
      const page = columns => db.from('wedding_gallery').select(columns).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 23);
      let result = await page('id,file_url,file_path,file_type,uploaded_by,caption,created_at');
      if (result.error?.code === '42703' && result.error.message?.includes('caption')) result = await page('id,file_url,file_path,file_type,uploaded_by,created_at');
      const items = check(result);
      return res.status(200).json({ items, hasMore: items.length === 24 });
    }
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: 'Pedido inválido.' }); }
    if (body?.action !== 'delete' || typeof body.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.id)) return res.status(400).json({ error: 'Publicação inválida.' });
    const item = check(await db.from('wedding_gallery').select('id,file_path,file_type,file_url').eq('id', body.id).maybeSingle());
    if (!item) return res.status(200).json({ deleted: body.id });
    // Resolve all paths on the server: the client can never supply a storage path.
    if (item.file_path) {
      const path = item.file_path;
      if (path.startsWith('/') || path.split('/').includes('..')) throw new Error('Invalid stored path');
      const original = path.match(/^(.*\/)?([^/]+)\/original\.[^/.]+$/);
      const base = original ? `${original[1] || ''}${original[2]}` : path.replace(/\.[^/.]+$/, '');
      const paths = [path];
      if (item.file_type?.startsWith('image/')) paths.push(...['feed.jpg','thumb.jpg','feed.webp','thumb.webp'].map(name => `${base}/${name}`));
      check(await db.storage.from('wedding-gallery').remove(paths));
    }
    const galleryId = String(item.file_path || item.id || item.file_url);
    check(await db.from('wedding_gallery_comments').delete().eq('gallery_item_id', galleryId));
    check(await db.from('wedding_gallery_likes').delete().eq('gallery_item_id', galleryId));
    check(await db.from('wedding_gallery').delete().eq('id', item.id));
    return res.status(200).json({ deleted: String(item.id) });
  } catch {
    return res.status(500).json({ error: 'Não foi possível concluir a operação. Se estavas a apagar, parte da limpeza pode ter sido feita; tenta novamente para concluir.' });
  }
}
