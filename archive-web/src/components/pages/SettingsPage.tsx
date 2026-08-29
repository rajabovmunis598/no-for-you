'use client';

import React from 'react';
import { Icon } from '../shared/Icon';

interface Props {
  language: string;
  setLanguage: (l: string) => void;
  compact: boolean;
  setCompact: (c: boolean) => void;
  theme: string;
  setTheme: (t: string) => void;
  motionEnabled: boolean;
  setMotionEnabled: (m: boolean) => void;
}

export function SettingsPage({ language, setLanguage, compact, setCompact, theme, setTheme, motionEnabled, setMotionEnabled }: Props) {
  const [notifications, setNotifications] = React.useState(true);
  return (
    <div className="page-content settings-page">
      <section className="page-intro compact-intro">
        <span className="eyebrow">Preferences</span>
        <h1>Make the archive<br /><em>feel like yours.</em></h1>
      </section>
      <div className="settings-stack">
        <section className="setting-panel panel">
          <div><span className="setting-icon"><Icon name="grid" size={20} /></span>
            <div><h2>Interface</h2><p>Choose how the archive is displayed on this device.</p></div></div>
          <div className="theme-picker">
            <span>Color mode</span>
            <div>
              <button type="button" className={theme === 'dark' ? 'is-active' : ''} onClick={() => setTheme('dark')}>☾ Dark</button>
              <button type="button" className={theme === 'light' ? 'is-active' : ''} onClick={() => setTheme('light')}>☀ Light</button>
            </div>
          </div>
          <label className="setting-select">Language
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="tj">Тоҷикӣ</option>
            </select>
          </label>
          <Toggle title="Compact navigation" description="Keep the sidebar in its smaller form." checked={compact} onChange={() => setCompact(!compact)} />
          <Toggle title="Ambient motion" description="Disable this on slower devices." checked={motionEnabled} onChange={() => setMotionEnabled(!motionEnabled)} />
        </section>
        <section className="setting-panel panel">
          <div><span className="setting-icon violet"><Icon name="bell" size={20} /></span>
            <div><h2>Notifications</h2><p>Control the messages you receive from the archive.</p></div></div>
          <Toggle title="Archive updates" description="New books, collections and curated recommendations." checked={notifications} onChange={() => setNotifications(!notifications)} />
        </section>
      </div>
    </div>
  );
}

function Toggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="toggle-row">
      <div><b>{title}</b><p>{description}</p></div>
      <button className={`switch ${checked ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={checked}><span /></button>
    </div>
  );
}