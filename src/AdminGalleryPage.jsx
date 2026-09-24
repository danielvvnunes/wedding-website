import { useState } from 'react';
import GalleryCarousel from './GalleryCarousel';
import { Link } from 'react-router-dom';

const button = 'rounded-full border border-[#cdb892] px-4 py-2 text-sm font-bold disabled:opacity-40';
export default function AdminGalleryPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function api(offset = 0, body) {
    const response = await fetch(`/api/admin-gallery?offset=${offset}`, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-gallery-password': password },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (response.status === 401) setAuthenticated(false);
    if (!response.ok) throw new Error(data.error || 'Não foi possível contactar o servidor.');
    return data;
  }
  async function load(more = false) {
    setBusy(true); setError('');
    try {
      const data = await api(more ? items.length : 0);
      setItems(current => more ? [...current, ...data.items.filter(item => !current.some(old => old.id === item.id))] : data.items);
      setHasMore(data.hasMore); setAuthenticated(true);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Apagar definitivamente esta publicação de ${item.uploaded_by || 'Convidado'}?\nSerão eliminados todos os ficheiros desta publicação, as miniaturas, os gostos e os comentários. Esta ação não pode ser desfeita.`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await api(0, { action: 'delete', id: String(item.id) });
      setItems(current => current.filter(old => old.id !== item.id));
      setMessage('Publicação apagada.');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#fbfaf5] px-4 py-8 text-[#64715f]">
    <div className="mx-auto max-w-5xl">
      <Link to="/admin" className="text-sm underline">← Voltar ao admin</Link>
      <h1 className="mb-3 mt-6 text-3xl font-extrabold">Gerir galeria</h1>
      <p className="mb-6 text-sm">Fotos e vídeos publicados pelos convidados.</p>
      {!authenticated ? <form className="max-w-md space-y-4 rounded-2xl border border-[#ddd4c0] bg-white p-6" onSubmit={event => { event.preventDefault(); load(); }}>
        <label className="block text-sm">Password de gestão da galeria<input className="mt-2 w-full rounded-xl border border-[#ddd4c0] p-3" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <button className={button} disabled={busy}>{busy ? 'A verificar…' : 'Entrar'}</button>
      </form> : <>
        <div className="mb-5 flex gap-3"><button className={button} disabled={busy} onClick={() => load()}>Atualizar</button><button className={button} disabled={busy} onClick={() => { setAuthenticated(false); setPassword(''); setItems([]); setMessage(''); }}>Sair</button></div>
        {!items.length && <p>A galeria está vazia.</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border border-[#ddd4c0] bg-white">
          <GalleryCarousel item={{ uploadedBy: item.uploaded_by, caption: item.caption, media: (item.media?.length ? item.media : [item]).map(file => ({ url: file.file_url, feedUrl: file.file_url, type: file.file_type })) }} onOpen={index => window.open((item.media?.length ? item.media : [item])[index].file_url, '_blank', 'noopener,noreferrer')} />
          <div className="space-y-3 p-4"><p className="font-bold">{item.uploaded_by || 'Convidado'}</p>{item.caption && <p className="text-sm">{item.caption}</p>}<button className={`${button} text-red-700`} disabled={busy} onClick={() => remove(item)}>Apagar publicação</button></div>
        </article>)}</div>
        {hasMore && <button className={`${button} mt-6`} disabled={busy} onClick={() => load(true)}>Carregar mais</button>}
      </>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl bg-[#b7c4b0]/20 p-4">{message}</p>}
    </div>
  </main>;
}
