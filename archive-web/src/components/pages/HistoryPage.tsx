'use client';

import React from 'react';
import { Icon } from '../shared/Icon';
import { EmptyState } from '../shared/EmptyState';
import { bookTitle, bookCover, bookAuthor, bookKey } from '../shared/constants';

interface HistoryPageProps {
  history: any[];
  onOpen: (book: any) => void;
}

export function HistoryPage({ history, onOpen }: HistoryPageProps) {
  return (
    <div className="page-content">
      <section className="page-intro compact-intro">
        <span className="eyebrow">Your activity</span>
        <h1>Reading history.</h1>
        <p>Your recently read records and notes.</p>
      </section>
      {history.length > 0 ? (
        <div className="timeline">
          {history.map((book, index) => (
            <button
              key={bookKey(book, index)}
              className="timeline-entry"
              onClick={() => onOpen(book)}
            >
              <span className="timeline-index">{index + 1}</span>
              <img src={bookCover(book)} alt={`Cover of ${bookTitle(book)}`} />
              <span>
                <b>{bookTitle(book)}</b>
                <small>{bookAuthor(book)}</small>
              </span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="clock"
          title="No reading history yet"
          text="Books you've read will appear here."
        />
      )}
    </div>
  );
}
