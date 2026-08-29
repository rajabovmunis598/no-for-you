'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Icon } from '../components/shared/Icon';
import { Avatar } from '../components/shared/Avatar';
import { AuthModal } from '../components/shared/AuthModal';
import { BookModal } from '../components/shared/BookModal';
import { BookAddOverlay } from '../components/shared/BookAddOverlay';
import { HomePage } from '../components/pages/HomePage';
import { LibraryPage } from '../components/pages/LibraryPage';
import { CategoriesPage } from '../components/pages/CategoriesPage';
import { SavedPage } from '../components/pages/SavedPage';
import { HistoryPage } from '../components/pages/HistoryPage';
import { GroupsPage } from '../components/pages/GroupsPage';
import { MessagesPage } from '../components/pages/MessagesPage';
import { NotificationsPage } from '../components/pages/NotificationsPage';
import { SettingsPage } from '../components/pages/SettingsPage';
import { ProfilePage } from '../components/pages/ProfilePage';
import { SiteFooter } from '../components/shared/SiteFooter';
import dynamic from 'next/dynamic';
import { bookCategory, bookKey } from '../components/shared/constants';
import { csrfFetch, ensureCsrfToken, readApiResponse } from '../lib/api';

const RandomPicker = dynamic(() => import('../components/pages/RandomPicker').then((m) => m.RandomPicker), { ssr: false });
const LibraryGamesPage = dynamic(() => import('../components/pages/LibraryGamesPage').then((m) => m.LibraryGamesPage), { ssr: false });
const LiveMessagesPage = dynamic(() => import('../components/pages/LiveMessagesPage').then((m) => m.LiveMessagesPage), { ssr: false });
const PdfReader = dynamic(() => import('../components/pages/PdfReader').then((m) => m.PdfReader), { ssr: false });

const copy: Record<string, any> = {
  en: { home: 'Home', library: 'Library', random: 'Random pick', categories: 'Collections', favorites: 'Saved', history: 'History', groups: 'Circles', messages: 'Messages', notifications: 'Alerts', settings: 'Settings', profile: 'My profile', search: 'Search titles, authors, subjects…', welcome: 'Your private reading space', archive: 'Digital archive', signIn: 'Sign in', createAccount: 'Create account', logout: 'Log out', explore: 'Explore library', continue: 'Continue reading', featured: 'Featured in the archive', recent: 'Recently added', browse: 'Browse all books' },
  ru: { home: 'Главная', library: 'Библиотека', random: 'Случайная книга', categories: 'Коллекции', favorites: 'Сохранённые', history: 'История', groups: 'Сообщества', messages: 'Сообщения', notifications: 'Уведомления', settings: 'Настройки', profile: 'Мой профиль', search: 'Поиск книг, авторов, тем…', welcome: 'Ваше личное пространство для чтения', archive: 'Цифровой архив', signIn: 'Войти', createAccount: 'Создать аккаунт', logout: 'Выйти', explore: 'Открыть библиотеку', continue: 'Продолжить чтение', featured: 'Избранное архива', recent: 'Недавно добавлено', browse: 'Все книги' },
  tj: { home: 'Асосӣ', library: 'Китобхона', random: 'Интихоби тасодуфӣ', categories: 'Маҷмӯаҳо', favorites: 'Нигоҳдоштаҳо', history: 'Таърих', groups: 'Гурӯҳҳо', messages: 'Паёмҳо', notifications: 'Огоҳӣ', settings: 'Танзимот', profile: 'Профили ман', search: 'Ҷустуҷӯи китоб, муаллиф, мавзӯъ…', welcome: 'Фазои шахсии мутолиаи шумо', archive: 'Архиви рақамӣ', signIn: 'Даромад', createAccount: 'Сохтани ҳисоб', logout: 'Баромад', explore: 'Кушодани китобхона', continue: 'Идомаи мутолиа', featured: 'Интихоби архив', recent: 'Нав илова шуд', browse: 'Ҳамаи китобҳо' },
};
copy.en.games = 'Games'; copy.ru.games = 'Игры'; copy.tj.games = 'Бозиҳо';

const navItems = [['home', 'home'], ['library', 'library'], ['random', 'sparkles'], ['games', 'game'], ['categories', 'grid'], ['favorites', 'bookmark'], ['history', 'clock'], ['groups', 'users'], ['messages', 'message'], ['notifications', 'bell'], ['settings', 'settings']];

export default function ClientApp() {
  const [books, setBooks] = React.useState<any[]>([]);
  const [booksLoading, setBooksLoading] = React.useState(true);
  const [booksError, setBooksError] = React.useState('');
  const [booksRevision, setBooksRevision] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [genre, setGenre] = React.useState('');
  const [activePage, setActivePage] = React.useState('home');
  const [language, setLanguage] = React.useState('tj');
  const [compactNav, setCompactNav] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [modal, setModal] = React.useState<string | null>(null);
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  const [message, setMessage] = React.useState('');
  const [verificationStep, setVerificationStep] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');
  const [selectedBook, setSelectedBook] = React.useState<any>(null);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [saved, setSaved] = React.useState<Set<string>>(new Set());
  const [history, setHistory] = React.useState<any[]>([]);
  const [avatarFile, setAvatarFile] = React.useState<any>(null);
  const [avatarPreview, setAvatarPreview] = React.useState('');
  const [form, setForm] = React.useState<Record<string, string>>({ username: '', email: '', password: '', first_name: '', last_name: '', phone: '', bio: '' });
  const [theme, setTheme] = React.useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('archive-theme') || 'dark' : 'dark'));
  const [motionEnabled, setMotionEnabled] = React.useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('archive-motion') !== 'off' : true));
  const [readerBook, setReaderBook] = React.useState<any>(null);
  const [bookAddOpen, setBookAddOpen] = React.useState(false);
  const [authSubmitting, setAuthSubmitting] = React.useState(false);

  const t = copy[language];
  // Render only records returned by the API; demo records must never appear in production.
  const catalogue = books;

  React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('archive-theme', theme); }, [theme]);
  React.useEffect(() => { document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off'; localStorage.setItem('archive-motion', motionEnabled ? 'on' : 'off'); }, [motionEnabled]);
  React.useEffect(() => {
    const ctrl = new AbortController();
    setBooksLoading(true);
    setBooksError('');
    fetch('/api/books/', { signal: ctrl.signal, credentials: 'include', headers: { Accept: 'application/json' } })
      .then(readApiResponse)
      .then((data) => {
        const records = Array.isArray(data) ? data : data?.results;
        setBooks(Array.isArray(records) ? records : []);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setBooks([]);
          setBooksError(error?.message || 'The library could not be loaded.');
        }
      })
      .finally(() => { if (!ctrl.signal.aborted) setBooksLoading(false); });
    return () => ctrl.abort();
  }, [booksRevision]);
  React.useEffect(() => {
    ensureCsrfToken().catch(() => {});
    fetch('/api/auth/profile/', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? readApiResponse(response) : null)
      .then((data) => {
        if (data) {
          setUser(data);
          setForm((value) => ({ ...value, ...data, password: '' }));
        }
      })
      .catch(() => {});
  }, []);
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.allSettled([
      fetch('/api/favorites/', { credentials: 'include', headers: { Accept: 'application/json' } }).then(readApiResponse),
      fetch('/api/reading/history/', { credentials: 'include', headers: { Accept: 'application/json' } }).then(readApiResponse),
    ]).then(([favoritesResult, historyResult]) => {
      if (cancelled) return;
      const favoritesData = favoritesResult.status === 'fulfilled' ? favoritesResult.value : [];
      const historyData = historyResult.status === 'fulfilled' ? historyResult.value : [];
      const favorites = Array.isArray(favoritesData) ? favoritesData : favoritesData?.results || [];
      const readingHistory = Array.isArray(historyData) ? historyData : historyData?.results || [];
      setSaved(new Set(favorites.map((item: any) => bookKey(item.book)).filter(Boolean)));
      setHistory(readingHistory.map((item: any) => item.book).filter(Boolean));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const change = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((v) => ({ ...v, [field]: e.target.value }));
  const openAuth = (mode: 'login' | 'register' = 'login') => { setAuthMode(mode); setVerificationStep(false); setVerificationCode(''); setMessage(''); setModal('auth'); };
  const requireAuth = (cb?: () => void) => { if (!user) { openAuth(); return; } cb?.(); };
  const navigate = (page: string) => {
    const publicPages = new Set(['home', 'library', 'random', 'categories']);
    if (!user && !publicPages.has(page)) { openAuth(); return; }
    setActivePage(page); setModal(null); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const selectGenre = (category: string) => { setGenre(category); setActivePage('library'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openBook = (book: any) => setSelectedBook(book);
  const toggleSaved = (book: any) => requireAuth(() => {
    const key = bookKey(book);
    const wasSaved = saved.has(key);
    setSaved((items) => {
      const next = new Set(items);
      wasSaved ? next.delete(key) : next.add(key);
      return next;
    });
    (async () => {
      try {
        if (!book?.id) throw new Error('This book cannot be saved.');
        const response = await csrfFetch(`/api/books/${book.id}/favorite/`, { method: wasSaved ? 'DELETE' : 'POST' });
        await readApiResponse(response);
      } catch (error: any) {
        setSaved((items) => {
          const next = new Set(items);
          wasSaved ? next.add(key) : next.delete(key);
          return next;
        });
        setMessage(error?.message || 'The saved books list could not be updated.');
      }
    })();
  });
  const selectAvatar = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); };
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = new FormData();
    ['email', 'first_name', 'last_name', 'phone', 'bio'].forEach((k) => body.append(k, form[k] || ''));
    if (avatarFile) body.append('avatar', avatarFile);
    try {
      const response = await csrfFetch('/api/auth/profile/', { method: 'PATCH', body });
      const data = await readApiResponse(response);
      setUser(data); setAvatarPreview(data.avatar_url || ''); setAvatarFile(null); setMessage('Profile updated successfully.');
    } catch (error: any) { setMessage(error?.message || 'Could not save your profile.'); }
  };
  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = verificationStep ? 'verify-email' : authMode === 'login' ? 'login' : 'register';
    const body = verificationStep ? { email: form.email, code: verificationCode } : form;
    setAuthSubmitting(true);
    setMessage('');
    try {
      const response = await csrfFetch(`/api/auth/${endpoint}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await readApiResponse(response);
      if (d.verification_required) { setVerificationStep(true); setMessage(''); return; }
      setUser(d); setForm((v) => ({ ...v, ...d, password: '' })); setModal(null); setVerificationStep(false);
    } catch (error: any) { setMessage(error?.message || 'Something went wrong.'); }
    finally { setAuthSubmitting(false); }
  };
  const logout = async () => {
    try { const response = await csrfFetch('/api/auth/logout/', { method: 'POST' }); await readApiResponse(response); }
    finally { setUser(null); setActivePage('home'); setModal(null); setSaved(new Set()); setHistory([]); }
  };

  const startReading = (book: any) => {
    if (!user) { setSelectedBook(null); openAuth(); return; }
    setReaderBook(book);
  };
  const updateReadingProgress = React.useCallback(async (book: any, currentPage: number, totalPages: number) => {
    if (!user || !book?.id || !totalPages) return;
    const progressPercent = Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));
    try {
      const response = await csrfFetch('/api/reading/progress/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: book.id, current_page: currentPage, progress_percent: progressPercent }),
      });
      await readApiResponse(response);
      setHistory((items) => [book, ...items.filter((item) => bookKey(item) !== bookKey(book))]);
    } catch { /* Reading remains available even if progress sync is temporarily unavailable. */ }
  }, [user]);

  const filteredBooks = catalogue.filter((b) => {
    const val = `${b.title || ''} ${b.author || ''} ${bookCategory(b)}`.toLowerCase();
    return val.includes(query.toLowerCase()) && (!genre || bookCategory(b) === genre);
  });
  const pageTitles: Record<string, string> = { home: t.home, library: t.library, random: t.random, games: t.games, categories: t.categories, favorites: t.favorites, history: t.history, groups: t.groups, messages: t.messages, notifications: t.notifications, settings: t.settings, profile: t.profile };

  let page = null;
  if (activePage === 'home') page = <HomePage books={catalogue} loading={booksLoading} error={booksError} carouselIndex={carouselIndex} setCarouselIndex={setCarouselIndex} onOpen={openBook} onExplore={() => navigate('library')} saved={saved} onToggleSaved={toggleSaved} t={t} user={user} />;
  if (activePage === 'library') page = <LibraryPage books={filteredBooks} query={query} setQuery={setQuery} genre={genre} setGenre={setGenre} onOpen={openBook} saved={saved} onToggleSaved={toggleSaved} t={t} />;
  if (activePage === 'random') page = <RandomPicker books={catalogue} onOpen={openBook} />;
  if (activePage === 'games') page = <LibraryGamesPage language={language} />;
  if (activePage === 'categories') page = <CategoriesPage books={catalogue} onCategory={selectGenre} />;
  if (activePage === 'favorites') page = <SavedPage books={catalogue} saved={saved} onOpen={openBook} onToggleSaved={toggleSaved} />;
  if (activePage === 'history') page = <HistoryPage history={history} onOpen={openBook} />;
  if (activePage === 'groups') page = <GroupsPage onCreate={() => setMessage('Circle creation will be available soon.')} />;
  if (activePage === 'messages') page = <LiveMessagesPage currentUser={user} />;
  if (activePage === 'notifications') page = <NotificationsPage />;
  if (activePage === 'settings') page = <SettingsPage language={language} setLanguage={setLanguage} compact={compactNav} setCompact={setCompactNav} theme={theme} setTheme={setTheme} motionEnabled={motionEnabled} setMotionEnabled={setMotionEnabled} />;
  if (activePage === 'profile') page = <ProfilePage user={user} form={form} change={change} onSave={saveProfile} avatarPreview={avatarPreview} onAvatar={selectAvatar} message={message} onLogout={logout} onAddBook={() => setBookAddOpen(true)} />;

  return (
    <main className={`archive-app ${compactNav ? 'nav-compact' : ''}`}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grain" />
      <aside className="sidebar">
        <button type="button" className="brand" aria-label="Digital Archive home" onClick={() => navigate('home')}>
          <span className="brand-mark"><span /></span>
          <span>Digital<br /><b>Archive</b></span>
        </button>
        <nav aria-label="Main navigation">
          {navItems.map(([id, icon]) => (
            <button key={id} className={`nav-button ${activePage === id ? 'is-active' : ''}`} onClick={() => navigate(id)} title={t[id]}>
              <Icon name={icon} size={20} /><span>{t[id]}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={`profile-button ${activePage === 'profile' ? 'is-active' : ''}`} onClick={() => requireAuth(() => navigate('profile'))}>
            <Avatar user={user} />
            <span><b>{user ? (user.first_name || user.username) : t.signIn}</b><small>{user ? t.profile : 'Member access'}</small></span>
            <Icon name="arrow" size={16} />
          </button>
          <button className="nav-collapse" onClick={() => setCompactNav((v) => !v)} aria-label="Toggle sidebar"><Icon name="chevron" size={18} /><span>Collapse</span></button>
        </div>
      </aside>
      <section className="app-main">
        <header className="topbar">
          <button className="mobile-brand" onClick={() => navigate('home')}><span className="brand-mark"><span /></span></button>
          <label className="top-search"><Icon name="search" size={18} />
            <input value={query} onChange={(e) => { setQuery(e.target.value); if (e.target.value) navigate('library'); }} placeholder={t.search} />
          </label>
          <div className="topbar-actions">
            <label className="language-select"><span>Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="tj">TJ</option><option value="ru">RU</option><option value="en">EN</option></select>
            </label>
            <button className="bell-button" onClick={() => navigate('notifications')} aria-label="Notifications"><Icon name="bell" size={20} /><i /></button>
            {user ? <button className="top-avatar" onClick={() => navigate('profile')}><Avatar user={user} /></button> : <button className="login-button" onClick={() => openAuth()}>{t.signIn}</button>}
          </div>
        </header>
        <div className="mobile-page-label"><span className="eyebrow">Digital archive</span><b>{pageTitles[activePage]}</b></div>
        <AnimatePresence mode="wait">
          <div className="page-shell" key={activePage}>{page}</div>
        </AnimatePresence>
        <SiteFooter />
      </section>
      {modal === 'auth' && <AuthModal mode={authMode} setMode={setAuthMode} verificationStep={verificationStep} code={verificationCode} setCode={setVerificationCode} form={form} change={change} message={message} submitting={authSubmitting} onClose={() => setModal(null)} onSubmit={submitAuth} t={t} />}
      {selectedBook && <BookModal book={selectedBook} saved={saved.has(bookKey(selectedBook))} onToggleSaved={toggleSaved} onClose={() => setSelectedBook(null)} onStartReading={startReading} />}
      {readerBook && <PdfReader book={readerBook} onClose={() => setReaderBook(null)} onProgress={updateReadingProgress} />}
      {bookAddOpen && <BookAddOverlay open={bookAddOpen} onClose={() => setBookAddOpen(false)} onAdded={() => setBooksRevision((value) => value + 1)} />}
    </main>
  );
}
