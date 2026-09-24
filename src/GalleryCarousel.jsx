import { useRef, useState } from 'react';
import GalleryImage from './GalleryImage';

export default function GalleryCarousel({ item, priority = false, expanded = false, initialIndex = 0, onOpen }) {
  const media = item.media?.length ? item.media : [item];
  const [index, setIndex] = useState(Math.min(initialIndex, media.length - 1));
  const touch = useRef(null);
  const suppressClick = useRef(false);
  const active = media[Math.min(index, media.length - 1)];
  const move = step => setIndex(current => Math.max(0, Math.min(media.length - 1, current + step)));
  return <section aria-label={`Fotografias da publicação de ${item.uploadedBy || 'Convidado'}`} className="relative">
    <div className={`${expanded ? 'h-[75vh]' : 'album-post-media aspect-[4/5]'} relative flex w-full items-center justify-center overflow-hidden bg-[#f8f5ee]`}
      onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; suppressClick.current = false; }}
      onTouchEnd={event => {
        if (!touch.current) return;
        const dx = event.changedTouches[0].clientX - touch.current.x;
        const dy = event.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { suppressClick.current = true; move(dx < 0 ? 1 : -1); }
        touch.current = null;
      }}>
      {active.type?.startsWith('video/') ? <video key={active.url} src={active.url} controls playsInline preload="none" className="h-full w-full object-contain" /> :
        <button type="button" disabled={expanded} className="h-full w-full" aria-label={`Abrir memória de ${item.uploadedBy || 'Convidado'}, imagem ${index + 1}`} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } onOpen?.(index); }}>
          <GalleryImage key={active.url} src={expanded ? active.url : active.feedUrl} fallbackSrc={active.url} alt={item.caption || `Fotografia ${index + 1} de ${media.length}`} priority={priority || expanded || index > 0} className="h-full w-full object-contain" />
        </button>}
      {media.length > 1 && <>
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white" aria-live="polite">{index + 1} / {media.length}</span>
        <button type="button" aria-label="Fotografia anterior" disabled={index === 0} onClick={() => move(-1)} className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-[#64715f] shadow disabled:invisible">‹</button>
        <button type="button" aria-label="Fotografia seguinte" disabled={index === media.length - 1} onClick={() => move(1)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-[#64715f] shadow disabled:invisible">›</button>
      </>}
    </div>
    {media.length > 1 && <div className="flex flex-wrap justify-center gap-1 py-2" aria-label="Escolher fotografia">{media.map((file, i) => <button type="button" key={file.url} aria-label={`Ver fotografia ${i + 1}`} aria-pressed={index === i} onClick={() => setIndex(i)} className="grid h-6 w-6 place-items-center"><span className={`h-1.5 w-1.5 rounded-full ${index === i ? 'bg-[#64715f]' : 'bg-[#ddd4c0]'}`} /></button>)}</div>}
  </section>;
}
