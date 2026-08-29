'use client';

import React from 'react';

interface User {
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
}

interface AvatarProps {
  user: User;
  className?: string;
}

export function Avatar({ user, className = '' }: AvatarProps) {
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}` || user?.username?.[0] || 'G';
  if (user?.avatar_url) {
    return <img className={`avatar ${className}`} src={user.avatar_url} alt="Profile" />;
  }
  return <span className={`avatar avatar-fallback ${className}`}>{initials.toUpperCase()}</span>;
}