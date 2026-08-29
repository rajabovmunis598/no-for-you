'use client';

import React from 'react';
import { Icon } from './Icon';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ eyebrow, title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-action" onClick={onAction}>
          {action}
          <Icon name="arrow" size={16} />
        </button>
      )}
    </div>
  );
}