'use client';

import React from 'react';

const paths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9v11h14V9M9 20v-6h6v6',
  library: 'M4 5h16v15H4zM8 5v15M12 8h5M12 12h5M12 16h4',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  clock: 'M3 12a9 9 0 1 0 3-6.7M3 4v6h6M12 7v5l3 2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 7.75M22 21v-2a4 4 0 0 0-3-3.87',
  message: 'M20 15a4 4 0 0 1-4 4H8l-5 3V8a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.9 1.9-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.7v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.9-1.9.06-.06A1.7 1.7 0 0 0 7.8 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.7h.24A1.7 1.7 0 0 0 7.8 10a1.7 1.7 0 0 0-.34-1.88L7.4 8.06l1.9-1.9.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.7v.1A1.7 1.7 0 0 0 16 6.66a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.9 1.9-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03H21v2.7h-.1A1.7 1.7 0 0 0 19.4 15z',
  game: 'M8 8V5m8 3V5M7 9h10a4 4 0 0 1 3.8 5.2l-1 3A2.6 2.6 0 0 1 15 18l-1.2-2h-3.6L9 18a2.6 2.6 0 0 1-4.8-.8l-1-3A4 4 0 0 1 7 9zm0 4h4m-2-2v4m6-2h.01m3 2h.01',
  search: 'm21 21-4.7-4.7M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  plus: 'M12 5v14M5 12h14',
  sparkles: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2zm7 14 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',
  arrow: 'm9 18 6-6-6-6',
  chevron: 'm15 18-6-6 6-6',
  heart: 'm12 20-1.6-1.45C5 13.55 2 10.8 2 7.5A4.5 4.5 0 0 1 6.5 3c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 15.5 3 4.5 4.5 0 0 1 20 7.5c0 3.3-3 6.05-8.4 11.05z',
  close: 'M6 6l12 12M18 6 6 18',
  upload: 'M12 16V4m0 0L7 9m5-5 5 5M5 20h14',
  book: 'M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5zm0 0V4.5M8 7h8M8 11h8M8 15h8',
  check: 'm5 12 4 4L19 6',
  filter: 'M4 5h16M7 12h10m-7 7h4',
  send: 'm21 3-7.5 18-3.8-7.7L2 9.5zM9.7 13.3 21 3',
};

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
}

export function Icon({ name, size = 20, stroke = 1.8 }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}