// Plays one lesson: a short run of info, tap-the-tiles and multiple-choice steps.
import { useState } from 'react';
import { TileRow } from '../components/game/TileRow';
import { haptics } from '../lib/haptics';
import type { Lesson, Task } from './curriculum';

interface Props { lesson: Lesson; onExit: () => void; onComplete: () => void; nextTitle?: string; onNextLesson?: () => void }

export function LessonPlayer({ lesson, onExit, onComplete, nextTitle, onNextLesson }: Props) {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const task = lesson.tasks[step];

  const next = () => {
    if (step + 1 < lesson.tasks.length) setStep(step + 1);
    else { haptics.success(); setFinished(true); onComplete(); }
  };

  return (
    <div className="app-full z-40 bg-bg flex flex-col">
      <header
        className="shrink-0 px-4 pb-3 flex items-center gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button onClick={onExit} aria-label="Close lesson" className="w-9 h-9 grid place-items-center rounded-full text-mute active:scale-90">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={finished ? lesson.tasks.length : step} aria-valuemax={lesson.tasks.length}>
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${((finished ? lesson.tasks.length : step) / lesson.tasks.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-lg mx-auto">
          {finished ? (
            <Finished title={lesson.title} onDone={onExit} nextTitle={nextTitle} onNextLesson={onNextLesson} />
          ) : (
            <TaskView key={step} task={task} onNext={next} />
          )}
        </div>
      </main>
    </div>
  );
}

function Finished({ title, onDone, nextTitle, onNextLesson }: { title: string; onDone: () => void; nextTitle?: string; onNextLesson?: () => void }) {
  return (
    <div className="pt-16 text-center anim-pop">
      <div className="mx-auto w-16 h-16 rounded-full bg-accent-soft grid place-items-center text-accent">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      </div>
      <h2 className="font-display text-2xl text-ink mt-5">Lesson done</h2>
      <p className="text-mute mt-1">{title}</p>
      {onNextLesson && nextTitle ? (
        <>
          <button onClick={onNextLesson} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10">Next: {nextTitle}</button>
          <button onClick={onDone} className="btn-ghost w-full h-12 rounded-xl text-[16px] mt-3">Back to lessons</button>
        </>
      ) : (
        <button onClick={onDone} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10">Back to lessons</button>
      )}
    </div>
  );
}

function TaskView({ task, onNext }: { task: Task; onNext: () => void }) {
  if (task.kind === 'info') {
    return (
      <div className="pt-8 anim-pop">
        <h2 className="font-display text-2xl text-ink">{task.title}</h2>
        {task.tiles && <div className="mt-6"><TileRow tiles={task.tiles} sortTiles={false} /></div>}
        <p className="text-ink text-[17px] leading-relaxed mt-6">{task.body}</p>
        <button onClick={() => { haptics.tap(); onNext(); }} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10">Got it</button>
      </div>
    );
  }
  if (task.kind === 'pick') return <PickTask task={task} onNext={onNext} />;
  return <ChooseTask task={task} onNext={onNext} />;
}

type Verdict = null | 'right' | 'wrong';

function Feedback({ verdict, explain, onNext, onRetry }: { verdict: Verdict; explain: string; onNext: () => void; onRetry: () => void }) {
  if (!verdict) return null;
  const right = verdict === 'right';
  return (
    <div className={`mt-6 rounded-2xl p-4 anim-pop ${right ? 'bg-accent-soft' : 'bg-surface-2'}`}>
      <div className={`font-semibold ${right ? 'text-accent' : 'text-ink'}`}>{right ? 'That’s it.' : 'Not quite.'}</div>
      <p className="text-ink mt-1 leading-snug">{explain}</p>
      {right
        ? <button onClick={onNext} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-4">Next</button>
        : <button onClick={onRetry} className="btn-ghost w-full h-12 rounded-xl text-[16px] mt-4">Try again</button>}
    </div>
  );
}

function PickTask({ task, onNext }: { task: Extract<Task, { kind: 'pick' }>; onNext: () => void }) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [verdict, setVerdict] = useState<Verdict>(null);

  const toggle = (_tile: number, i: number) => {
    if (verdict) return;
    haptics.select();
    const s = new Set(picked);
    if (s.has(i)) s.delete(i); else s.add(i);
    setPicked(s);
  };

  const check = () => {
    const ok = picked.size === task.correct.length && task.correct.every(i => picked.has(i));
    if (ok) haptics.success(); else haptics.error();
    setVerdict(ok ? 'right' : 'wrong');
  };

  return (
    <div className="pt-8 anim-pop">
      <h2 className="font-display text-xl text-ink">{task.prompt}</h2>
      <div className="mt-6"><TileRow tiles={task.tiles} sortTiles={false} selectedTiles={picked} onTileClick={toggle} /></div>
      {!verdict && (
        <button onClick={check} disabled={picked.size === 0} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10 disabled:opacity-40">Check</button>
      )}
      <Feedback verdict={verdict} explain={task.explain} onNext={onNext} onRetry={() => { setPicked(new Set()); setVerdict(null); }} />
    </div>
  );
}

function ChooseTask({ task, onNext }: { task: Extract<Task, { kind: 'choose' }>; onNext: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const verdict: Verdict = chosen === null ? null : chosen === task.answer ? 'right' : 'wrong';

  const choose = (i: number) => {
    if (chosen !== null) return;
    if (i === task.answer) haptics.success(); else haptics.error();
    setChosen(i);
  };

  return (
    <div className="pt-8 anim-pop">
      <h2 className="font-display text-xl text-ink">{task.prompt}</h2>
      {task.tiles && <div className="mt-6"><TileRow tiles={task.tiles} sortTiles={false} /></div>}
      <div className="mt-6 flex flex-col gap-2">
        {task.options.map((o, i) => {
          const state = chosen === null ? 'border-line bg-surface' : i === chosen ? (i === task.answer ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2') : 'border-line bg-surface opacity-50';
          return (
            <button
              key={o}
              onClick={() => choose(i)}
              className={`min-h-[52px] text-left px-4 rounded-xl border text-ink text-[16px] transition-colors ${state}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <Feedback verdict={verdict} explain={task.explain} onNext={onNext} onRetry={() => setChosen(null)} />
    </div>
  );
}
