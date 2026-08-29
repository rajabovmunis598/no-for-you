'use client';

import React from 'react';
import { csrfFetch, readApiResponse } from '../../lib/api';

interface Props { currentUser?: any; }

const initials = (u: any) => `${u?.first_name?.[0] || ''}${u?.last_name?.[0] || ''}`.trim() || u?.username?.slice(0, 2).toUpperCase() || 'U';
const displayName = (u: any) => `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.username || 'Reader';

export function LiveMessagesPage({ currentUser }: Props) {
  const [users, setUsers] = React.useState<any[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [chat, setChat] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const historyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch('/api/users/', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(readApiResponse)
      .then((data) => setUsers(Array.isArray(data) ? data : data?.results || []))
      .catch((reason) => setError(reason?.message || 'Readers could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  const loadMessages = React.useCallback(async (id: number) => {
    const response = await fetch(`/api/chats/${id}/messages/`, { credentials: 'include', headers: { Accept: 'application/json' } });
    const data = await readApiResponse(response);
    setMessages(Array.isArray(data) ? data : data?.results || []);
  }, []);

  const selectUser = async (user: any) => {
    setSelectedUser(user); setError(''); setMessages([]);
    try {
      const response = await csrfFetch(`/api/users/${user.id}/chat/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const nextChat = await readApiResponse(response);
      setChat(nextChat); await loadMessages(nextChat.id);
    } catch (e: any) { setError(e.message); }
  };

  React.useEffect(() => { if (!chat?.id) return; const t = setInterval(() => loadMessages(chat.id).catch(() => {}), 3500); return () => clearInterval(t); }, [chat?.id, loadMessages]);
  React.useEffect(() => { historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !chat?.id) return;
    setDraft('');
    try {
      const response = await csrfFetch(`/api/chats/${chat.id}/messages/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const m = await readApiResponse(response);
      setMessages((items) => [...items, m]);
    } catch (e: any) { setDraft(text); setError(e.message); }
  };

  return (
    <div className="page-content messages-page live-messages-page">
      <section className="social-heading">
        <div><span className="eyebrow">Reader network</span><h1>Real conversations.</h1><p>Choose a registered reader and start a private conversation.</p></div>
        <span className="social-count">{users.length} readers</span>
      </section>
      <div className="message-shell panel live-message-shell">
        <aside className="conversation-list user-directory">
          <div className="conversation-title"><span className="eyebrow">People</span><i>{users.length}</i></div>
          {loading && <p className="social-placeholder">Loading readers…</p>}
          {!loading && !users.length && <p className="social-placeholder">No other accounts yet.</p>}
          {users.map((u) => (
            <button type="button" key={u.id} className={`conversation ${selectedUser?.id === u.id ? 'is-active' : ''}`} onClick={() => selectUser(u)}>
              {u.avatar_url ? <img className="social-avatar" src={u.avatar_url} alt="" /> : <span className="conversation-avatar">{initials(u)}</span>}
              <span><b>{displayName(u)}</b><small>@{u.username}</small></span>
              <i className={u.is_online ? 'online' : ''}>{u.is_online ? 'online' : 'reader'}</i>
            </button>
          ))}
        </aside>
        <section className="chat-panel">
          {selectedUser ? (
            <>
              <header>
                {selectedUser.avatar_url ? <img className="social-avatar" src={selectedUser.avatar_url} alt="" /> : <span className="conversation-avatar">{initials(selectedUser)}</span>}
                <div><b>{displayName(selectedUser)}</b><small><i /> @{selectedUser.username}</small></div>
                <button type="button" aria-label="Options">•••</button>
              </header>
              <div className="chat-history" ref={historyRef}>
                {!messages.length && <div className="chat-welcome"><b>Start the conversation</b><span>Your messages are saved to this private chat.</span></div>}
                {messages.map((m) => (
                  <div key={m.id} className={`bubble ${m.sender?.id === currentUser?.id ? 'outgoing' : 'incoming'}`}>
                    <span>{m.text}</span>
                    <time>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                ))}
              </div>
              <form className="message-composer" onSubmit={submit}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" maxLength={4000} />
                <button aria-label="Send">➤</button>
              </form>
            </>
          ) : (
            <div className="select-reader-state"><span>💬</span><h2>Select a reader</h2><p>Your conversation will appear here.</p></div>
          )}
          {error && <p className="social-error">{error}</p>}
        </section>
      </div>
    </div>
  );
}
