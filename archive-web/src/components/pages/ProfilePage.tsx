'use client';

import React from 'react';
import { Icon } from '../shared/Icon';
import { Avatar } from '../shared/Avatar';
import { BookAddOverlay } from '../shared/BookAddOverlay';

interface Props {
  user: any;
  form: Record<string, string>;
  change: (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (e: React.FormEvent) => void;
  avatarPreview: string;
  onAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  message: string;
  onLogout: () => void;
  onAddBook: () => void;
}

const csrf = () => decodeURIComponent(document.cookie.split('; ').find((i) => i.startsWith('csrftoken='))?.split('=')[1] || '');

export function ProfilePage({ user, form, change, onSave, avatarPreview, onAvatar, message, onLogout, onAddBook }: Props) {
  const [dashboard, setDashboard] = React.useState<any>(null);
  const [dashError, setDashError] = React.useState('');

  const loadDashboard = React.useCallback(async () => {
    try {
      const res = await fetch('/api/profile/dashboard/', { credentials: 'include' });
      if (!res.ok) throw new Error('Could not load your profile library.');
      const data = await res.json();
      setDashboard(data);
    } catch (e: any) { setDashError(e.message); }
  }, []);

  React.useEffect(() => { if (user) loadDashboard(); }, [user, loadDashboard]);

  const deleteBook = async (id: number, btn: HTMLButtonElement) => {
    if (!window.confirm('Delete this book permanently?')) return;
    btn.disabled = true;
    const res = await fetch(`/api/books/${id}/`, { method: 'DELETE', credentials: 'include', headers: { 'X-CSRFToken': csrf() } });
    if (!res.ok) { btn.disabled = false; alert('Could not delete this book.'); return; }
    loadDashboard();
  };

  const escapeHtml = (v = '') => String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] as string));
  const stats = dashboard?.stats;
  const books = dashboard?.books || [];

  return (
    <div className="page-content profile-page">
      <section className="profile-cover">
        <div className="profile-cover-light" />
        <span className="eyebrow">Account space</span>
        <h1>{form.first_name || user?.first_name || 'Archive'}<br /><em>{form.last_name || user?.last_name || 'member'}</em></h1>
      </section>
      <section className="profile-layout">
        <aside className="profile-summary panel">
          <div className="avatar-editor">
            <Avatar user={{ ...user, avatar_url: avatarPreview || user?.avatar_url, first_name: form.first_name, last_name: form.last_name, username: form.username }} className="profile-avatar" />
            <label className="avatar-upload" title="Upload a profile photo"><Icon name="upload" size={16} />
              <input type="file" accept="image/*" onChange={onAvatar} />
            </label>
          </div>
          <h2>{`${form.first_name || ''} ${form.last_name || ''}`.trim() || form.username || user?.username}</h2>
          <p>@{form.username || user?.username}</p>
          <span className="online-pill"><i /> ARCHIVE MEMBER</span>
          <dl>
            <div><dt>Saved books</dt><dd>{stats?.saved_books ?? 0}</dd></div>
            <div><dt>Reading circles</dt><dd>{stats?.following ?? 0}</dd></div>
          </dl>
          <button className="profile-add-book" type="button" onClick={onAddBook}><span aria-hidden="true">+</span> Add book</button>
          <button className="danger-text" onClick={onLogout}>Log out <Icon name="arrow" size={15} /></button>
        </aside>
        <form className="profile-form panel" onSubmit={onSave}>
          <div className="form-heading">
            <div><span className="eyebrow">Personal details</span><h2>Your profile</h2></div>
            <span className="verified"><Icon name="check" size={15} /> verified account</span>
          </div>
          <div className="form-grid">
            <label>First name<input value={form.first_name || ''} onChange={change('first_name')} placeholder="First name" /></label>
            <label>Last name<input value={form.last_name || ''} onChange={change('last_name')} placeholder="Last name" /></label>
            <label className="span-two">Email address<input type="email" value={form.email || ''} onChange={change('email')} placeholder="you@example.com" /></label>
            <label>Phone number<input value={form.phone || ''} onChange={change('phone')} placeholder="Phone" /></label>
            <label>Bio<input value={form.bio || ''} onChange={change('bio')} placeholder="Short bio" /></label>
          </div>
          {message && <p className="form-error">{message}</p>}
          <button className="primary-button auth-submit" type="submit">Save profile <Icon name="arrow" size={17} /></button>
        </form>
      </section>
      {dashboard && (
        <section className="profile-dashboard panel">
          <div className="profile-dashboard-heading">
            <div><span className="eyebrow">Your archive</span><h2>Books & activity</h2></div>
            <span>{stats?.books ?? books.length} book{(stats?.books ?? books.length) === 1 ? '' : 's'}</span>
          </div>
          <div className="profile-stat-grid">
            <div><b>{stats?.following ?? 0}</b><span>Following</span></div>
            <div><b>{stats?.followers ?? 0}</b><span>Followers</span></div>
            <div><b>{stats?.readers ?? 0}</b><span>Readers</span></div>
            <div><b>{stats?.likes_received ?? 0}</b><span>Likes</span></div>
            <div><b>{stats?.reviews_received ?? 0}</b><span>Reviews</span></div>
            <div><b>{stats?.comments_received ?? 0}</b><span>Comments</span></div>
          </div>
          <div className="profile-book-heading"><h3>My books</h3><span>{stats?.books_read ?? 0} completed · {stats?.saved_books ?? 0} saved</span></div>
          <div className="profile-book-list">
            {books.length ? books.map((book: any) => (
              <article className="profile-book-card" key={book.id}>
                <img src={book.cover_url || book.cover || ''} alt="" />
                <div><span>{book.genre || 'Book'}</span><h3>{escapeHtml(book.title)}</h3><p>{escapeHtml(book.author)}</p><small>{book.publication_year || '—'} · {book.pages || '—'} pages</small></div>
                <button type="button" className="profile-delete-book" data-book-id={book.id} onClick={(e) => deleteBook(book.id, e.currentTarget)}>Delete</button>
              </article>
            )) : <div className="profile-empty-books"><b>Your shelf is empty.</b><p>Add your first PDF book and it will appear here.</p></div>}
          </div>
        </section>
      )}
      {dashError && <p className="dashboard-error">{dashError}</p>}
    </div>
  );
}
