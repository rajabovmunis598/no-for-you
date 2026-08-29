'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../shared/Icon';
import { BookCard } from '../shared/BookCard';
import { SectionHeader } from '../shared/SectionHeader';
import { demoBooks } from '../shared/constants';

interface Props {
  books: any[];
  carouselIndex: number;
  setCarouselIndex: (i: number) => void;
  onOpen: (b: any) => void;
  onExplore: () => void;
  saved: Set<string>;
  onToggleSaved: (b: any) => void;
  t: Record<string, string>;
  user: any;
}

export function HomePage({ books, carouselIndex, setCarouselIndex, onOpen, onExplore, saved, onToggleSaved, t, user }: Props) {
  const catalogue = books.length ? books : demoBooks;
  const primary = catalogue[carouselIndex % catalogue.length] || demoBooks[0];
  const previous = catalogue[(carouselIndex - 1 + catalogue.length) % catalogue.length] || demoBooks[1];
  const next = catalogue[(carouselIndex + 1) % catalogue.length] || demoBooks[2];
  const advance = (step: number) => setCarouselIndex((carouselIndex + step + catalogue.length) % catalogue.length);
  return (
    <div className="page-content home-page">
      <section className="hero-panel">
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <div className="hero-copy">
          <span className="hero-status"><i /> LIVE COLLECTION · 48,291 RECORDS</span>
          <p className="eyebrow">{user ? `Welcome back, ${user.first_name || user.username}` : t.welcome}</p>
          <h1>{t.archive}<br /><em>for curious minds.</em></h1>
          <p className="hero-description">A quiet space for books, ideas and the stories that stay with you.</p>
          <button className="primary-button" onClick={onExplore}>{t.explore}<Icon name="arrow" size={17} /></button>
        </div>
        <div className="hero-shelf" aria-label="Featured books">
          <button className="shelf-control previous" onClick={() => advance(-1)} aria-label="Previous"><Icon name="chevron" size={22} /></button>
          <button className="shelf-book shelf-book-side" onClick={() => onOpen(previous)}><img src={previous.cover_url || previous.cover || '/static/images/book-cover-fallback.svg'} alt="" /></button>
          <button className="shelf-book shelf-book-main" onClick={() => onOpen(primary)}>
            <img src={primary.cover_url || primary.cover || '/static/images/book-cover-fallback.svg'} alt={primary.title} />
            <span className="shelf-glow" />
            <span className="shelf-info"><b>{primary.title}</b><small>{primary.author}</small></span>
          </button>
          <button className="shelf-book shelf-book-side" onClick={() => onOpen(next)}><img src={next.cover_url || next.cover || '/static/images/book-cover-fallback.svg'} alt="" /></button>
          <button className="shelf-control next" onClick={() => advance(1)} aria-label="Next"><Icon name="arrow" size={22} /></button>
        </div>
        <div className="hero-stats"><span><b>48K</b> books</span><span><b>192</b> collections</span><span><b>24/7</b> open</span></div>
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
          <div className="mini-stat panel"><span>READING TIME</span><b>08<span>h</span></b><small>this week</small></div>
          <div className="mini-stat panel"><span>NEW TODAY</span><b>12</b><small>archive records</small></div>
        </div>
      </section>
      <section>
        <SectionHeader eyebrow="Curated for you" title={t.featured} action={t.browse} onAction={onExplore} />
        <div className="book-grid book-grid-featured">
          {(books.length ? books : demoBooks).slice(0, 20).map((book, index) => (
            <BookCard key={book.id || book.title || index} book={book} index={index} onOpen={onOpen} saved={saved.has(book.id || book.title)} onToggleSaved={onToggleSaved} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
