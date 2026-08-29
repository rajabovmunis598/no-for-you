'use client';

import React from 'react';
import { motion } from 'framer-motion';

function PageImage({ bookId, pageNumber, thumbnail = false }: { bookId: number; pageNumber: number; thumbnail?: boolean }) {
  const scale = thumbnail ? 0.22 : 1.25;
  return <img src={`/api/books/${bookId}/page/?page=${pageNumber}&scale=${scale}`} className={thumbnail ? 'pdf-thumb-canvas' : 'pdf-page-canvas'} alt={`Page ${pageNumber}`} loading={thumbnail ? 'lazy' : 'eager'} />;
}

interface Props { book: any; onClose: () => void; }

export function PdfReader({ book, onClose }: Props) {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [zoom, setZoom] = React.useState(1);
  const [direction, setDirection] = React.useState(1);
  const [showThumbs, setShowThumbs] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const file = book.book_file || book.files?.[0]?.file;
  const bookId = Number(book.id);

  React.useEffect(() => {
    if (!file) { setError('PDF file is missing.'); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}/page/?page=1&scale=0.5`, { credentials: 'include' });
        if (!res.ok) throw new Error(`PDF request failed (${res.status}).`);
        setTotalPages(Number(res.headers.get('X-PDF-Page-Count')) || 1);
        if (cancelled) return;
        if (!cancelled) setLoading(false);
      } catch (e: any) { if (!cancelled) { console.error(e); setError(e?.message || 'PDF could not be opened.'); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, [file, bookId]);

  const normalizePage = React.useCallback((n: number) => { const b = Math.max(1, Math.min(totalPages || 1, Number(n) || 1)); return b === 1 ? 1 : b % 2 === 0 ? b : b - 1; }, [totalPages]);
  const goTo = React.useCallback((n: number) => { const t = normalizePage(n); setDirection(t >= page ? 1 : -1); setPage(t); }, [normalizePage, page]);
  const next = React.useCallback(() => goTo(page === 1 ? 2 : page + 2), [goTo, page]);
  const previous = React.useCallback(() => goTo(page <= 2 ? 1 : page - 2), [goTo, page]);

  React.useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') previous(); if (e.key === 'Escape' && !document.fullscreenElement) onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [next, previous, onClose]);

  const toggleFullscreen = () => { if (document.fullscreenElement) document.exitFullscreen(); else shellRef.current?.requestFullscreen?.(); };
  const visiblePages = page === 1 ? [1] : [page, page + 1].filter((n) => n <= totalPages);
  const atEnd = visiblePages.includes(totalPages);

  return (
    <div className="pdf-reader" ref={shellRef} role="dialog" aria-modal="true" aria-label={`Reading ${book.title}`}>
      <header className="pdf-reader-header">
        <div className="reader-title"><span className="reader-logo">DA</span><div><b>{book.title}</b><small>{book.author || 'Digital Archive'}</small></div></div>
        <div className="reader-header-actions">
          <button type="button" onClick={() => setShowThumbs((v) => !v)} title="Pages">▤</button>
          <button type="button" onClick={toggleFullscreen} title="Fullscreen">⛶</button>
          <button type="button" onClick={onClose} title="Close">×</button>
        </div>
      </header>
      <div className="pdf-reader-body">
        {showThumbs && (
          <aside className="pdf-thumbnails"><span>Pages</span>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button type="button" key={n} className={n === page || (page > 1 && n === page + 1) ? 'is-active' : ''} onClick={() => goTo(n)}>
                {Math.abs(n - page) < 9 ? <PageImage bookId={bookId} pageNumber={n} thumbnail /> : <i>{n}</i>}<small>{n}</small>
              </button>
            ))}
          </aside>
        )}
        <main className="pdf-stage">
          {loading && <div className="reader-state"><span /><b>Opening your book…</b></div>}
          {error && <div className="reader-state error"><b>{error}</b><p>Check that the PDF file is available.</p></div>}
          {totalPages > 0 && (
            <>
              <button className="reader-arrow previous" type="button" onClick={previous} disabled={page === 1} aria-label="Previous">‹</button>
              <motion.div key={page} className={`pdf-spread ${visiblePages.length === 1 ? 'single-page' : ''}`} initial={{ opacity: 0.45, rotateY: direction * 14, x: direction * 35, scale: zoom * 0.98 }} animate={{ opacity: 1, rotateY: 0, x: 0, scale: zoom }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
                {visiblePages.map((n) => <div className="pdf-paper" key={n}><PageImage bookId={bookId} pageNumber={n} /><span>{n}</span></div>)}
              </motion.div>
              <button className="reader-arrow next" type="button" onClick={next} disabled={atEnd} aria-label="Next">›</button>
            </>
          )}
        </main>
      </div>
      <footer className="pdf-reader-controls">
        <button type="button" onClick={previous} disabled={page === 1}>‹</button>
        <label><input type="number" min={1} max={totalPages || 1} value={page} onChange={(e) => goTo(Number(e.target.value))} /><span>/ {totalPages || '—'}</span></label>
        <button type="button" onClick={next} disabled={atEnd}>›</button>
        <i />
        <button type="button" onClick={() => setZoom((v) => Math.max(0.7, +(v - 0.1).toFixed(1)))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((v) => Math.min(1.8, +(v + 0.1).toFixed(1)))}>+</button>
      </footer>
    </div>
  );
}
