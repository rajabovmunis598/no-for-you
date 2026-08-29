'use client';

import React from 'react';
import { Icon } from '../shared/Icon';

interface Props {}

export function NotificationsPage({}: Props) {
  const [alerts, setAlerts] = React.useState([
    ['Archive update', '12 new titles were added to Science & technology.', 'Today', 'book', true],
    ['New note', 'Mira Hassan left a note in The Little Prince.', 'Yesterday', 'message', true],
    ['Reading circle', 'Quiet readers has a new discussion waiting for you.', '2 days ago', 'users', false],
  ]);
  return (
    <div className="page-content">
      <section className="page-intro split-intro">
        <div>
          <span className="eyebrow">Archive activity</span>
          <h1>Stay in<br /><em>the loop.</em></h1>
          <p>Small updates from your library and reading circles.</p>
        </div>
        <button className="soft-button" onClick={() => setAlerts((items) => items.map((item) => [...item.slice(0, 4), false]))}>
          <Icon name="check" size={17} />Mark all read
        </button>
      </section>
      <div className="alert-list">
        {alerts.map(([title, text, time, icon, unread]) => (
          <article className={`alert-row ${unread ? 'unread' : ''}`} key={String(title)}>
            <span className="alert-icon"><Icon name={icon as string} size={19} /></span>
            <div><b>{title}</b><p>{text}</p></div>
            <time>{time}</time>
            {unread && <i />}
          </article>
        ))}
      </div>
    </div>
  );
}