'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { bookTitle, bookAuthor, bookCover, bookCategory, bookKey } from '../shared/constants';

interface Book {
  id?: string | number;
  title?: string;
  author?: string;
  author_name?: string;
  category?: string;
  category_name?: string;
  year?: number | string;
  cover_url?: string;
  cover?: string;
  book_file?: string;
  files?: { file: string }[];
}

interface BookCardProps {
  book: Book;
  index: number;
  onOpen: (book: Book) => void;
  saved: boolean;
  onToggleSaved: (book: Book) => void;
  compact?: boolean;
}

export function BookCard({ book, index, onOpen, saved, onToggleSaved, compact = false }: BookCardProps) {
  return (
    <motion.article
      className={`book-card ${compact ? 'book-card-compact' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.035, 0.22) }}
    >
      <button className="cover-button" onClick={() => onOpen(book)} aria-label={`Open ${bookTitle(book)}`}>
        <img src={bookCover(book)} alt={`Cover of ${bookTitle(book)}`} />
        <span className="cover-sheen" />
      </button>
      <div className="book-card-meta">
        <div>
          <span className="book-category">{bookCategory(book)}</span>
          <h3>{bookTitle(book)}</h3>
          <p>{bookAuthor(book)}</p>
        </div>
        <button
          className={`save-button ${saved ? 'is-saved' : ''}`}
          onClick={() => onToggleSaved(book)}
          aria-label={saved ? 'Remove from saved books' : 'Save book'}
        >
          <Icon name="bookmark" size={17} />
        </button>
      </div>
    </motion.article>
  );
}