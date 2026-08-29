'use client';

import React from 'react';
import { csrfFetch, readApiResponse } from '../../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export function BookAddOverlay({ open, onClose, onAdded }: Props) {
  const [output, setOutput] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (open) { setOutput(''); }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setOutput('Publishing…');
    try {
      const response = await csrfFetch('/api/books/', { method: 'POST', body: new FormData(form) });
      await readApiResponse(response);
      setOutput('Book added successfully.');
      form.reset();
      onAdded?.();
      setTimeout(onClose, 650);
    } catch (error: any) {
      setOutput(error?.message || 'The book could not be published.');
    }
  };

  return (
    <div id="book-add-overlay">
      <div className="book-add-dialog">
        <form ref={formRef} onSubmit={submit}>
          <button type="button" className="book-add-close" aria-label="Close" onClick={onClose}>&times;</button>
          <small>COMMUNITY LIBRARY</small>
          <h2>Add a book</h2>
          <p>Publish a book to the shared digital archive.</p>
          <label>Cover image *<input name="cover" type="file" accept="image/*" required /></label>
          <label>Title *<input name="title" required /></label>
          <label>Author *<input name="author" required /></label>
          <div className="book-add-pair">
            <label>Publication year *<input name="publication_year" type="number" min="1" required /></label>
            <label>Category *<input name="genre" defaultValue="Literature" required /></label>
          </div>
          <label>Description *<textarea name="description" required></textarea></label>
          <label>Book PDF *<input name="book_file" type="file" accept="application/pdf,.pdf" required /></label>
          <div className="book-add-pair">
            <label>Language<input name="language" /></label>
            <label>Pages<input name="pages" type="number" min="1" /></label>
          </div>
          <div className="book-add-pair">
            <label>ISBN<input name="isbn" /></label>
            <label>Publisher<input name="publisher" /></label>
          </div>
          <output>{output}</output>
          <button className="book-add-submit" type="submit">Publish book</button>
        </form>
      </div>
    </div>
  );
}
