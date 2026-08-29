'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface AuthModalProps {
  mode: 'login' | 'register';
  setMode: (mode: 'login' | 'register') => void;
  verificationStep: boolean;
  code: string;
  setCode: (code: string) => void;
  form: Record<string, string>;
  change: (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  message: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  t: Record<string, string>;
}

export function AuthModal({ mode, setMode, verificationStep, code, setCode, form, change, message, submitting, onClose, onSubmit, t }: AuthModalProps) {
  const title = verificationStep ? 'Verify your email' : mode === 'login' ? 'Welcome back' : 'Join the archive';
  const registering = mode === 'register' && !verificationStep;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <motion.form
        className="auth-modal"
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close" disabled={submitting}>
          <Icon name="close" size={19} />
        </button>
        <div className="brand">
          <span className="brand-mark"><span /></span>
          <span>Digital<br /><b>Archive</b></span>
        </div>
        <span className="eyebrow">Secure archive access</span>
        <h2 id="auth-title">{title}</h2>
        <p className="auth-subtitle">
          {verificationStep
            ? 'Enter the six-digit code sent to your email.'
            : mode === 'login'
              ? 'Sign in to open your personal reading space.'
              : 'Every account needs its own username, email and phone number.'}
        </p>
        {registering && (
          <div className="auth-row">
            <input required autoComplete="given-name" value={form.first_name} onChange={change('first_name')} placeholder="First name" />
            <input required autoComplete="family-name" value={form.last_name} onChange={change('last_name')} placeholder="Last name" />
          </div>
        )}
        {registering && <input required type="email" autoComplete="email" value={form.email} onChange={change('email')} placeholder="Unique email address" />}
        {registering && <input required type="tel" autoComplete="tel" value={form.phone} onChange={change('phone')} placeholder="Unique phone number" />}
        {!verificationStep && <input required autoComplete="username" value={form.username} onChange={change('username')} placeholder="Unique username" />}
        {mode === 'login' && <input required type="password" autoComplete="current-password" value={form.password} onChange={change('password')} placeholder="Password" />}
        {registering && <input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={change('password')} placeholder="Password (8+ characters)" />}
        {verificationStep && (
          <input
            required
            className="code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
          />
        )}
        {message && <p className="form-error">{message}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : verificationStep ? 'Verify email' : mode === 'login' ? t.signIn : t.createAccount}
          <Icon name="arrow" size={17} />
        </button>
        {!verificationStep && (
          <button type="button" className="auth-switch" disabled={submitting} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        )}
      </motion.form>
    </div>
  );
}
