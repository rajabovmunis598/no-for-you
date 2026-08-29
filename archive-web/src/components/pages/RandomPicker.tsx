'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../shared/Icon';
import { bookTitle, bookAuthor, bookCover, bookCategory } from '../shared/constants';

const iconPaths = {
  sparkle: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2zm7 14 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',
  arrow: 'm9 18 6-6-6-6',
  chevron: 'm15 18-6-6 6-6',
  shuffle: 'M4 7h3l10 10h3M17 7h3v3M20 7l-4 4M4 17h3l2-2',
};

function PickerIcon({ name, size = 19 }: { name: string; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[name as keyof typeof iconPaths]} /></svg>;
}

interface Props { books: any[]; onOpen: (b: any) => void; }

export function RandomPicker({ books, onOpen }: Props) {
  const records = books;
  const count = records.length || 1;
  const [position, setPosition] = React.useState(count + 2);
  const [spinning, setSpinning] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => { setPosition(count + 2); }, [count]);
  const selected = records[position % count] || records[0];
  const ribbon = Array.from({ length: 7 }, (_, r) => records.map((book, i) => ({ book, key: `${r}-${book?.id || book?.title || i}` }))).flat();
  const offset = position * 122 + 56;

  const move = (step: number) => { if (spinning || !records.length) return; setPosition((v) => Math.max(count + 2, v + step)); };
  const chooseRandom = () => {
    if (spinning || !records.length) return;
    let start = position;
    if (start > count * 5) start = count * 2 + (start % count);
    const target = Math.floor(Math.random() * count);
    const distance = count * 2 + ((target - (start % count) + count) % count);
    let remaining = distance;
    setSpinning(true);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setPosition((v) => v + 1);
      remaining -= 1;
      if (remaining <= 0) { if (timer.current) window.clearInterval(timer.current); setSpinning(false); }
    }, 86);
  };

  return (
    <div className="page-content random-page">
      <section className="random-picker panel">
        <div className="random-glow glow-one" /><div className="random-glow glow-two" />
        <div className="random-copy"><span className="eyebrow">Archive roulette</span>
          <h1>Let the archive<br /><em>choose for you.</em></h1>
          <p>Every spin travels across the shelves and lands on one unexpected book.</p>
          <button className={`random-button ${spinning ? 'is-spinning' : ''}`} onClick={chooseRandom} disabled={spinning}>
            <PickerIcon name="shuffle" size={18} />{spinning ? 'Searching the shelves…' : 'Choose a random book'}
          </button>
        </div>
        <div className="random-result">
          <span className="result-label"><i /> SELECTED RECORD</span>
          <button className="result-card" onClick={() => selected && onOpen(selected)}>
            <img src={bookCover(selected)} alt={selected ? `Cover of ${bookTitle(selected)}` : ''} />
            <span><small>{bookCategory(selected)}</small><b>{bookTitle(selected)}</b><em>{bookAuthor(selected)}</em></span>
            <PickerIcon name="arrow" size={17} />
          </button>
        </div>
        <div className="roulette-stage">
          <span className="roulette-marker"><i /></span>
          <div className="roulette-window">
            <motion.div className={`roulette-track ${spinning ? 'is-spinning' : ''}`} animate={{ x: -offset }} transition={{ duration: spinning ? 0.08 : 0.32, ease: spinning ? 'linear' : [0.22, 1, 0.36, 1] }}>
              {ribbon.map(({ book, key }, index) => (
                <button className={`roulette-book ${book === selected && index === position ? 'is-selected' : ''}`} key={key} onClick={() => onOpen(book)}>
                  <img src={bookCover(book)} alt="" /><span>{bookTitle(book)}</span>
                </button>
              ))}
            </motion.div>
          </div>
          <div className="roulette-controls">
            <button onClick={() => move(-1)} disabled={spinning} aria-label="Previous"><PickerIcon name="chevron" size={20} /></button>
            <span>{spinning ? 'SCANNING ARCHIVE' : 'ALL BOOKS · RANDOM SELECTION'}</span>
            <button onClick={() => move(1)} disabled={spinning} aria-label="Next"><PickerIcon name="arrow" size={20} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
