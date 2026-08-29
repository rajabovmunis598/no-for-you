'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../shared/Icon';
import { EmptyState } from '../shared/EmptyState';
import { bookCategory } from '../shared/constants';

interface CategoriesPageProps {
  books: any[];
  onCategory: (category: string) => void;
}

const collectionIcons: Record<string, string> = {
  classics: 'book',
  science: 'sparkles',
  literature: 'book',
  art: 'sparkles',
  history: 'clock',
  philosophy: 'users',
};

export function CategoriesPage({ books, onCategory }: CategoriesPageProps) {
  const categoryCounts = new Map<string, number>();
  books.forEach((book) => {
    const name = bookCategory(book);
    categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
  });
  const categories = Array.from(categoryCounts.entries());
  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">Explore by subject</span>
        <h1>Collections for every curiosity.</h1>
        <p>Dive into curated collections spanning timeless classics, cutting-edge science, and everything in between.</p>
      </section>
      <div className="collection-grid">
        {categories.map(([name, count], index) => {
          const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const icon = collectionIcons[key] || (index % 3 === 1 ? 'sparkles' : 'book');
          return (
            <motion.button
              key={key}
              className="collection-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              onClick={() => onCategory(name)}
            >
              <span className="collection-icon">
                <Icon name={icon} size={24} />
              </span>
              <div className="collection-name">{name}</div>
              <div className="collection-description">Browse every book filed under {name.toLowerCase()}.</div>
              <div className="collection-count">{count} book{count === 1 ? '' : 's'}</div>
              <span className="collection-arrow">
                <Icon name="arrow" size={17} />
              </span>
            </motion.button>
          );
        })}
      </div>
      {!categories.length && <EmptyState icon="grid" title="No collections yet" text="Collections appear automatically when books are added." />}
    </div>
  );
}
