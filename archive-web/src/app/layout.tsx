import type { Metadata } from 'next';
import './globals.css';
import './theme-layer.css';
import './pdf-reader.css';
import './random-picker.css';
import './social-pages.css';
import './reference-ui.css';
import './book-add-overlay.css';

export const metadata: Metadata = {
  title: 'Digital Archive',
  description: 'Your private reading space',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="archive-app">
          {children}
        </main>
      </body>
    </html>
  );
}