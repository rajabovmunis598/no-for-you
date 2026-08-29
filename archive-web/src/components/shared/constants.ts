'use client';

import React from 'react';
import { motion } from 'framer-motion';

const FALLBACK_COVER = '/static/images/book-cover-fallback.svg';
const demoBooks = [
  { id: '1984', title: '1984', author: 'George Orwell', category: 'Classics', year: '1949', cover_url: FALLBACK_COVER },
  { id: 'alchemist', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', year: '1988', cover_url: FALLBACK_COVER },
  { id: 'pride', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', year: '1813', cover_url: FALLBACK_COVER },
  { id: 'sherlock', title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'Mystery', year: '1892', cover_url: FALLBACK_COVER },
  { id: 'little-prince', title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', category: 'Fiction', year: '1943', cover_url: FALLBACK_COVER },
  { id: 'moby-dick', title: 'Moby-Dick', author: 'Herman Melville', category: 'Classics', year: '1851', cover_url: FALLBACK_COVER },
  { id: 'hobbit', title: 'The Hobbit', author: 'J. R. R. Tolkien', category: 'Fantasy', year: '1937', cover_url: FALLBACK_COVER },
  { id: 'frankenstein', title: 'Frankenstein', author: 'Mary Shelley', category: 'Classics', year: '1818', cover_url: FALLBACK_COVER },
];

const categories = [
  ['Classics', 'Books that shaped generations', '12.8k', 'classics'],
  ['Science & technology', 'Ideas that build the future', '8.4k', 'science'],
  ['Literature', 'Stories, poetry and voices', '16.2k', 'literature'],
  ['Art & design', 'Visual culture and craft', '5.7k', 'art'],
  ['History', 'Records of our shared past', '9.3k', 'history'],
  ['Philosophy', 'Questions worth returning to', '4.1k', 'philosophy'],
];

const conversations = [
  ['Archive team', 'Your collection has been updated.', 'now', 'AT'],
  ['Read together', 'Nora shared a new note with you.', '12m', 'RT'],
  ['Mira Hassan', 'That chapter is beautiful.', '1h', 'MH'],
];

const bookTitle = (book: any) => book?.title || 'Untitled record';
const bookAuthor = (book: any) => book?.author_name || book?.author?.name || book?.author || book?.authors?.map((item: any) => item.name || item).join(', ') || 'Unknown author';
const bookCover = (book: any) => book?.cover_url || book?.cover || FALLBACK_COVER;
const bookCategory = (book: any) => book?.category_name || book?.category?.name || book?.category || 'Archive';
const bookKey = (book: any, index = 0) => String(book?.id || book?.slug || `${bookTitle(book)}-${index}`);

export { FALLBACK_COVER, demoBooks, categories, conversations, bookTitle, bookAuthor, bookCover, bookCategory, bookKey };