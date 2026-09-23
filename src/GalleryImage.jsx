import { memo, useEffect, useRef, useState } from "react";

// Native lazy loading can fetch several screens ahead on mobile. Keep the URL
// detached until this image is near the viewport, while prioritising the first post.
export default memo(function GalleryImage({ src, fallbackSrc, alt, className, priority = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(priority);
  useEffect(() => {
    if (visible) return;
    if (!globalThis.IntersectionObserver) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "350px 0px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  return <img ref={ref} src={visible ? src : undefined} alt={alt}
    className={className} decoding="async" fetchPriority={priority ? "high" : "low"}
    onError={(event) => {
      if (fallbackSrc && event.currentTarget.src !== fallbackSrc) event.currentTarget.src = fallbackSrc;
    }} />;
});
