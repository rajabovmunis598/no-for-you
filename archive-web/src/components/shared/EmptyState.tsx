'use client';

import React from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  text: string;
}

export function EmptyState({ icon, title, text }: EmptyStateProps) {
  return (
    <section className="empty-state panel">
      <span>
        <Icon name={icon} size={28} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}