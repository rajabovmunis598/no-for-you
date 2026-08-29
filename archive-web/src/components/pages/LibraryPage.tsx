'use client';

import React from 'react';
import { BookCard } from '../shared/BookCard';
import { SectionHeader } from '../shared/SectionHeader';
import { EmptyState } from '../shared/EmptyState';
import { Icon } from '../shared/Icon';
import { bookCategory, bookKey } from '../shared/constants';

interface Props {
  books: any[];
  query: string;
  setQuery: (q: string) => void;
  genre: string;
  setGenre: (g: string) => void;
  onOpen: (b: any) => void;
  saved: Set<string>;
  onToggleSaved: (b: any) => void;
  t: Record<string, string>;
}

export function LibraryPage({ books, query, setQuery, genre, setGenre, onOpen, saved, onToggleSaved, t }: Props) {
  const [sort, setSort] = React.useState('recommended');
  const categoriesInBooks = ['All', ...Array.from(new Set(books.map(bookCategory))).slice(0, 6)];
  const sorted = [...books].sort((a, b) => {
    if (sort === 'title') return (a.title || '').localeCompare(b.title || '');
    if (sort === 'year') return String(b.year || '').localeCompare(String(a.year || ''));
    return 0;
  });
  return (
    <div className="page-content library-page">
      <section className="library-hero panel">
        <div>
          <span className="eyebrow">Explore the catalogue</span>
          <h1>Find your next<br /><em>good book.</em></h1>
          <p>Every shelf begins with a question. Search our growing archive by title, author or subject.</p>
        </div>
        <div className="library-orb"><span /><Icon name="search" size={34} /></div>
      </section>
      <div className="library-toolbar">
        <label className="wide-search"><Icon name="search" size={19} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} />
        </label>
        <label className="sort-select"><Icon name="filter" size={17} />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="title">Title A–Z</option>
            <option value="year">Newest first</option>
          </select>
        </label>
      </div>
      <div className="chip-row">
        {categoriesInBooks.map((name) => (
          <button key={name} className={`filter-chip ${(!genre && name === 'All') || genre === name ? 'is-active' : ''}`} onClick={() => setGenre(name === 'All' ? '' : name)}>{name}</button>
        ))}
      </div>
      <SectionHeader eyebrow={`${sorted.length} records available`} title="All books" />
      <div className="book-grid">
        {sorted.map((book, index) => (
          <BookCard key={bookKey(book, index)} book={book} index={index} onOpen={onOpen} saved={saved.has(bookKey(book, index))} onToggleSaved={onToggleSaved} />
        ))}
      </div>
      {!sorted.length && <EmptyState icon="search" title="No records found" text="Try another title, author or category." />}
    </div>
  );
}
