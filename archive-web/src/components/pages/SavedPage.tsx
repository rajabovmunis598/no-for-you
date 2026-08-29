'use client';

import React from 'react';
import { BookCard } from '../shared/BookCard';
import { EmptyState } from '../shared/EmptyState';
import { bookKey } from '../shared/constants';

interface SavedPageProps {
  books: any[];
  saved: Set<string>;
  onOpen: (book: any) => void;
  onToggleSaved: (book: any) => void;
}

export function SavedPage({ books, saved, onOpen, onToggleSaved }: SavedPageProps) {
  const savedBooks = books.filter((book, index) => saved.has(bookKey(book, index)));

  return (
    <div className="page-content">
      <section className="page-intro compact-intro">
        <span className="eyebrow">Your shelf</span>
        <h1>Saved for later.</h1>
        <p>Books you've saved live here, ready whenever you are.</p>
      </section>
      {savedBooks.length > 0 ? (
        <div className="book-grid">
          {savedBooks.map((book, index) => (
            <BookCard
              key={bookKey(book, index)}
              book={book}
              index={index}
              onOpen={onOpen}
              saved={saved.has(bookKey(book, index))}
              onToggleSaved={onToggleSaved}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="bookmark"
          title="Your shelf is waiting"
          text="Save books you come across and they'll gather here."
        />
      )}
    </div>
  );
}
