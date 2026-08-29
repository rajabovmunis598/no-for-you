'use client';

import React from 'react';
import { Icon } from '../shared/Icon';
import { BookCard } from '../shared/BookCard';
import { SectionHeader } from '../shared/SectionHeader';
import { EmptyState } from '../shared/EmptyState';
import { bookAuthor, bookCategory, bookCover, bookKey } from '../shared/constants';

interface Props {
  books: any[];
  loading: boolean;
  error: string;
  carouselIndex: number;
  setCarouselIndex: (i: number) => void;
  onOpen: (b: any) => void;
  onExplore: () => void;
  saved: Set<string>;
  onToggleSaved: (b: any) => void;
  t: Record<string, string>;
  user: any;
}

export function HomePage({ books, loading, error, carouselIndex, setCarouselIndex, onOpen, onExplore, saved, onToggleSaved, t, user }: Props) {
  const catalogue = books;
  const collectionCount = new Set(catalogue.map(bookCategory).filter(Boolean)).size;
  const primary = catalogue.length ? catalogue[carouselIndex % catalogue.length] : null;
  const previous = catalogue.length ? catalogue[(carouselIndex - 1 + catalogue.length) % catalogue.length] : null;
  const next = catalogue.length ? catalogue[(carouselIndex + 1) % catalogue.length] : null;
  const advance = (step: number) => { if (catalogue.length) setCarouselIndex((carouselIndex + step + catalogue.length) % catalogue.length); };
  return (
    <div className="page-content home-page">
      <section className="hero-panel">
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <div className="hero-copy">
          <span className="hero-status"><i /> LIVE COLLECTION · {catalogue.length} RECORDS</span>
          <p className="eyebrow">{user ? `Welcome back, ${user.first_name || user.username}` : t.welcome}</p>
          <h1>{t.archive}<br /><em>for curious minds.</em></h1>
          <p className="hero-description">A quiet space for books, ideas and the stories that stay with you.</p>
          <button className="primary-button" onClick={onExplore}>{t.explore}<Icon name="arrow" size={17} /></button>
        </div>
        {primary && previous && next ? (
          <div className="hero-shelf" aria-label="Featured books">
            <button className="shelf-control previous" onClick={() => advance(-1)} aria-label="Previous"><Icon name="chevron" size={22} /></button>
            <button className="shelf-book shelf-book-side" onClick={() => onOpen(previous)}><img src={bookCover(previous)} alt="" /></button>
            <button className="shelf-book shelf-book-main" onClick={() => onOpen(primary)}>
              <img src={bookCover(primary)} alt={primary.title} />
              <span className="shelf-glow" />
              <span className="shelf-info"><b>{primary.title}</b><small>{bookAuthor(primary)}</small></span>
            </button>
            <button className="shelf-book shelf-book-side" onClick={() => onOpen(next)}><img src={bookCover(next)} alt="" /></button>
            <button className="shelf-control next" onClick={() => advance(1)} aria-label="Next"><Icon name="arrow" size={22} /></button>
          </div>
        ) : <div className="hero-shelf-state" aria-live="polite">{loading ? 'Loading library…' : 'The first book will appear here.'}</div>}
        <div className="hero-stats"><span><b>{catalogue.length}</b> books</span><span><b>{collectionCount}</b> collections</span><span><b>24/7</b> open</span></div>
      </section>
      <section className="home-grid">
        <div className="continue-panel panel">
          <div className="continue-art"><span className="reading-line line-a" /><span className="reading-line line-b" /><Icon name="book" size={33} /></div>
          <div>
            <span className="eyebrow">Continue your journey</span>
            <h2>Make room for a new idea.</h2>
            <p>Keep your favorite books, notes and discoveries in one calm place.</p>
            <button className="soft-button" onClick={onExplore}>Open the library <Icon name="arrow" size={16} /></button>
          </div>
        </div>
        <div className="mini-stat-grid">
          <div className="mini-stat panel"><span>YOUR SHELF</span><b>{saved.size}</b><small>saved books</small></div>
          <div className="mini-stat panel"><span>LIBRARY</span><b>{catalogue.length}</b><small>available books</small></div>
          <div className="mini-stat panel"><span>COLLECTIONS</span><b>{collectionCount}</b><small>subjects</small></div>
        </div>
      </section>
      <section>
        <SectionHeader eyebrow="Curated for you" title={t.featured} action={t.browse} onAction={onExplore} />
        <div className="book-grid book-grid-featured">
          {books.slice(0, 20).map((book, index) => (
            <BookCard key={bookKey(book, index)} book={book} index={index} onOpen={onOpen} saved={saved.has(bookKey(book, index))} onToggleSaved={onToggleSaved} compact />
          ))}
        </div>
        {!loading && !books.length && <EmptyState icon="book" title={error ? 'Library unavailable' : 'The library is empty'} text={error || 'Books added to the server will appear here automatically.'} />}
      </section>
    </div>
  );
}
