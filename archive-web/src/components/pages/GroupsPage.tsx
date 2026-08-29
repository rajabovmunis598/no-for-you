'use client';

import React from 'react';
import { Icon } from '../shared/Icon';

interface GroupsPageProps {
  onCreate: () => void;
}

export function GroupsPage({ onCreate }: GroupsPageProps) {
  return (
    <div className="page-content">
      <section className="page-intro split-intro">
        <div>
          <span className="eyebrow">Read together</span>
          <h1>Find your reading circle.</h1>
          <p>Join small groups built around themes, authors, and shared curiosity.</p>
        </div>
        <button className="primary-button" onClick={onCreate}>
          Create a circle <Icon name="plus" size={17} />
        </button>
      </section>
      <div className="circle-grid">
        <article className="circle-card violet">
          <span className="circle-stack">
            <i />
            <i />
            <i />
          </span>
          <span className="eyebrow">Quiet readers</span>
          <h2>Quiet readers</h2>
          <p>A space for slow, thoughtful reading and quiet discussion.</p>
          <button className="text-action">
            Visit circle <Icon name="arrow" size={14} />
          </button>
        </article>
        <article className="circle-card orange">
          <span className="circle-stack">
            <i />
            <i />
            <i />
          </span>
          <span className="eyebrow">Future classics</span>
          <h2>Future classics</h2>
          <p>Books being read today that will define tomorrow.</p>
          <button className="text-action">
            Visit circle <Icon name="arrow" size={14} />
          </button>
        </article>
        <article className="circle-card">
          <span className="circle-stack">
            <i />
            <i />
            <i />
          </span>
          <span className="eyebrow">Designing ideas</span>
          <h2>Designing ideas</h2>
          <p>Where design thinkers share insights and inspiration.</p>
          <button className="text-action">
            Visit circle <Icon name="arrow" size={14} />
          </button>
        </article>
      </div>
    </div>
  );
}
