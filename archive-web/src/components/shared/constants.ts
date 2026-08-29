'use client';

import React from 'react';
import { motion } from 'framer-motion';

const FALLBACK_COVER = '/static/images/book-cover-fallback.svg';

const bookTitle = (book: any) => book?.title || 'Untitled record';
const bookAuthor = (book: any) => book?.author_name || book?.author?.name || book?.author || book?.authors?.map((item: any) => item.name || item).join(', ') || 'Unknown author';
const bookCover = (book: any) => book?.cover_url || book?.cover || FALLBACK_COVER;
const bookCategory = (book: any) => book?.category_name || book?.category?.name || book?.category || 'Archive';
const bookKey = (book: any, index = 0) => String(book?.id || book?.slug || `${bookTitle(book)}-${index}`);

export { FALLBACK_COVER, bookTitle, bookAuthor, bookCover, bookCategory, bookKey };
