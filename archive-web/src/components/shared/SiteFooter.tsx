import React from 'react';

export function SiteFooter() {
  return <footer className="site-footer"><span>Digital Archive</span><span>Read · Discover · Share</span><span>© {new Date().getFullYear()}</span></footer>;
}
