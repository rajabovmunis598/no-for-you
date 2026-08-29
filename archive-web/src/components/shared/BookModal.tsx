'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface Book {
  title?: string;
  author?: string;
  book_file?: string;
  files?: { file: string }[];
  cover_url?: string;
  cover?: string;
  category?: string;
  category_name?: string;
  year?: number | string;
}

interface BookModalProps {
  book: Book | null;
  saved: boolean;
  onToggleSaved: (book: Book) => void;
  onClose: () => void;
  onStartReading: (book: Book) => void;
}

export function BookModal({ book, saved, onToggleSaved, onClose, onStartReading }: BookModalProps) {
  const [readerOpen, setReaderOpen] = React.useState(false);

  if (!book) return null;

  const startReading = () => {
    const file = book.book_file || book.files?.[0]?.file;
    if (!file) { alert('This book does not have a PDF file yet.'); return; }
    setReaderOpen(true);
    onStartReading(book);
  };

  return (
    <>
      <div className="modal-backdrop book-modal-backdrop">
        <motion.article
          className="book-modal"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={19} />
          </button>
          <img src={book.cover_url || book.cover || '/static/images/book-cover-fallback.svg'} alt={`Cover of ${book.title}`} />
          <div>
            <span className="eyebrow">{book.category || book.category_name || 'Archive'} · {book.year || 'Archive edition'}</span>
            <h2>{book.title}</h2>
            <p className="book-modal-author">by {book.author || 'Digital Archive'}</p>
            <p className="book-modal-copy">A carefully preserved record from the Digital Archive. Add it to your shelf and return whenever the moment is right.</p>
            <div className="book-modal-actions">
              <button className="primary-button" onClick={startReading}>Start reading <Icon name="arrow" size={17} /></button>
              <button className={`round-save ${saved ? 'is-saved' : ''}`} onClick={() => onToggleSaved(book)} aria-label="Save book">
                <Icon name="bookmark" size={19} />
              </button>
            </div>
          </div>
        </motion.article>
      </div>
    </>
  );
}