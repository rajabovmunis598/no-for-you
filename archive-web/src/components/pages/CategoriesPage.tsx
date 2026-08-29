'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../shared/Icon';
import { categories } from '../shared/constants';

interface CategoriesPageProps {
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

export function CategoriesPage({ onCategory }: CategoriesPageProps) {
  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">Explore by subject</span>
        <h1>Collections for every curiosity.</h1>
        <p>Dive into curated collections spanning timeless classics, cutting-edge science, and everything in between.</p>
      </section>
      <div className="collection-grid">
        {categories.map((item, index) => {
          const [name, description, count, key] = item;
          const icon = collectionIcons[key] || 'book';
          return (
            <motion.button
              key={key}
              className="collection-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              onClick={() => onCategory(key)}
            >
              <span className="collection-icon">
                <Icon name={icon} size={24} />
              </span>
              <div className="collection-name">{name}</div>
              <div className="collection-description">{description}</div>
              <div className="collection-count">{count}</div>
              <span className="collection-arrow">
                <Icon name="arrow" size={17} />
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
