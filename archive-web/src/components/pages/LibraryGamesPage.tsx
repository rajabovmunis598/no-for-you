'use client';

import React from 'react';
import { Icon } from '../shared/Icon';

const GAME_COPY: Record<string, any> = {
  tj: { eyebrow: 'Бозии зеҳнӣ бо AI', title: 'Китобро мешиносед?', description: 'AI барои китобҳои китобхона савол месозад.', start: '🤖 Оғози бозӣ', loading: '✨ Саволҳо тайёр мешаванд…', question: 'Савол', points: 'хол', visualQuiz: 'Санҷиши муқова', correct: 'Офарин, дуруст! 🎉', wrong: 'Қариб ёфтед 🙂', next: 'Саволи дигар', result: 'Натиҷаро бинед', excellent: 'Аъло! 🏆', keepGoing: 'Оғози хуб! 😊', again: '🔄 Боз як бор', ai: 'AI фаъол', fallback: 'Ҳолати эҳтиётӣ' },
  ru: { eyebrow: 'Интеллектуальная игра с AI', title: 'Узнаете книгу?', description: 'AI готовит вопросы по книгам библиотеки.', start: '🤖 Начать игру', loading: '✨ Готовим вопросы…', question: 'Вопрос', points: 'очков', visualQuiz: 'Викторина по обложке', correct: 'Верно, отлично! 🎉', wrong: 'Почти получилось 🙂', next: 'Следующий вопрос', result: 'Посмотреть результат', excellent: 'Отлично! 🏆', keepGoing: 'Хорошее начало! 😊', again: '🔄 Играть снова', ai: 'AI активен', fallback: 'Резервный режим' },
  en: { eyebrow: 'AI book challenge', title: 'Know the book?', description: 'AI prepares questions from the library.', start: '🤖 Start game', loading: '✨ Preparing questions…', question: 'Question', points: 'points', visualQuiz: 'Cover challenge', correct: 'That is right! 🎉', wrong: 'Almost there 🙂', next: 'Next question', result: 'See result', excellent: 'Excellent! 🏆', keepGoing: 'A good start! 😊', again: '🔄 Play again', ai: 'AI active', fallback: 'Backup mode' },
};

interface Props { language?: string; }

export function LibraryGamesPage({ language = 'tj' }: Props) {
  const labels = GAME_COPY[language] || GAME_COPY.tj;
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [index, setIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [answer, setAnswer] = React.useState('');
  const [finished, setFinished] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [source, setSource] = React.useState('');
  const question = questions[index];
  const isCorrect = Boolean(answer && answer === question?.answer);

  const start = async () => {
    setLoading(true); setError(''); setScore(0); setIndex(0); setAnswer(''); setFinished(false);
    try {
      const res = await fetch(`/api/games/quick/?language=${encodeURIComponent(language)}`, { credentials: 'include' });
      const data = await res.json();
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setSource(data.source || 'fallback');
    } catch (e: any) { setQuestions([]); setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };
  const choose = (opt: string) => { if (answer) return; setAnswer(opt); if (opt === question.answer) setScore((v) => v + 1); };
  const next = () => { if (index + 1 >= questions.length) { setFinished(true); return; } setIndex((v) => v + 1); setAnswer(''); };

  return (
    <div className="page-content games-page">
      <section className="game-hero panel">
        <div className="game-orbit" aria-hidden="true"><i /><i /><span>🤖</span></div>
        <div className="game-hero-copy">
          <div className="game-kicker-row"><span className="eyebrow">{labels.eyebrow}</span>
            {source && <span className={`ai-source-pill ${source === 'ai' ? 'is-ai' : ''}`}>{source === 'ai' ? `✨ ${labels.ai}` : `🧠 ${labels.fallback}`}</span>}
          </div>
          <h1>{labels.title}</h1><p>{labels.description}</p>
          {!questions.length && <button type="button" className="primary-button" onClick={start} disabled={loading}>{loading ? labels.loading : labels.start}</button>}
        </div>
      </section>
      {error && <p className="social-error game-error">⚠️ {error}</p>}
      {question && !finished && (
        <section className="quiz-shell panel">
          <header><span>{labels.question} {index + 1} / {questions.length}</span><b>⭐ {score} {labels.points}</b></header>
          <div className="quiz-progress"><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
          <div className="quiz-content">
            <div className="quiz-cover"><span className="cover-emoji">{question.emoji || '📚'}</span><img src={question.cover_url} alt="Mystery book cover" /></div>
            <div className="quiz-question">
              <span className="eyebrow">{labels.visualQuiz}</span>
              <h2>{question.prompt}</h2>
              <div className="quiz-options">
                {question.options.map((opt: string, i: number) => {
                  let state = '';
                  if (answer && opt === question.answer) state = 'correct';
                  else if (answer && opt === answer) state = 'wrong';
                  return (
                    <button type="button" key={`${question.id}-${i}`} className={state} onClick={() => choose(opt)} disabled={Boolean(answer)} aria-pressed={answer === opt}>
                      <i>{String.fromCharCode(65 + i)}</i><span>{opt}</span>{state === 'correct' && <strong>✓</strong>}{state === 'wrong' && <strong>×</strong>}
                    </button>
                  );
                })}
              </div>
              {answer && <div className={`quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`} aria-live="polite"><span>{isCorrect ? '🥳' : '🙂'}</span><div><b>{isCorrect ? labels.correct : labels.wrong}</b><p>{question.explanation}</p></div></div>}
              {answer && <button type="button" className="primary-button quiz-next" onClick={next}>{index + 1 === questions.length ? labels.result : labels.next} →</button>}
            </div>
          </div>
        </section>
      )}
      {finished && (
        <section className="game-result panel">
          <span>{score >= questions.length * 0.7 ? '🏆' : '😊'}</span>
          <small>{labels.result}</small>
          <h2>{score} / {questions.length}</h2>
          <p>{score >= questions.length * 0.7 ? labels.excellent : labels.keepGoing}</p>
          <button type="button" className="primary-button" onClick={start}>{labels.again}</button>
        </section>
      )}
    </div>
  );
}