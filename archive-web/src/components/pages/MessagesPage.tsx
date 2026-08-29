'use client';

import React from 'react';
import { Icon } from '../shared/Icon';

const conversations = [
  ['Archive team', 'Your collection has been updated.', 'now', 'AT'],
  ['Read together', 'Nora shared a new note with you.', '12m', 'RT'],
  ['Mira Hassan', 'That chapter is beautiful.', '1h', 'MH'],
];

interface Props {
  onOpenChat?: (name: string) => void;
}

export function MessagesPage({ onOpenChat }: Props) {
  const [selected, setSelected] = React.useState(0);
  const [draft, setDraft] = React.useState('');
  const [sent, setSent] = React.useState<string[]>([]);
  const conversation = conversations[selected];
  const submitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSent((items) => [...items, draft.trim()]);
    setDraft('');
  };
  return (
    <div className="page-content messages-page">
      <div className="message-shell panel">
        <aside className="conversation-list">
          <div className="conversation-title">
            <span className="eyebrow">Inbox</span>
            <button aria-label="New message"><Icon name="plus" size={18} /></button>
          </div>
          {conversations.map((item, index) => (
            <button key={item[0]} className={`conversation ${selected === index ? 'is-active' : ''}`} onClick={() => { setSelected(index); onOpenChat?.(item[0]); }}>
              <span className="conversation-avatar">{item[3]}</span>
              <span><b>{item[0]}</b><small>{item[1]}</small></span>
              <i>{item[2]}</i>
            </button>
          ))}
        </aside>
        <section className="chat-panel">
          <header>
            <span className="conversation-avatar">{conversation[3]}</span>
            <div><b>{conversation[0]}</b><small><i /> online now</small></div>
            <button aria-label="Options">•••</button>
          </header>
          <div className="chat-history">
            <div className="bubble incoming">Welcome to your archive. What are you reading today?</div>
            <div className="bubble outgoing">I am looking for something memorable.</div>
            {sent.map((m, i) => (<div key={i} className="bubble outgoing">{m}</div>))}
          </div>
          <form className="message-composer" onSubmit={submitMessage}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" />
            <button aria-label="Send"><Icon name="send" size={18} /></button>
          </form>
        </section>
      </div>
    </div>
  );
}