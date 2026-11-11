// The Learn tab: one path of units, each a short list of lessons. Nothing locks; the next lesson is highlighted.
import { useState } from 'react';
import { CURRICULUM, lessonKey, type Lesson, type Unit } from './curriculum';
import { LessonPlayer } from './LessonPlayer';
import { UNIT_VIDEOS } from './VideoIntro';
import { markDone, useProgress } from '../lib/progress';
import { haptics } from '../lib/haptics';

export function LearnTab() {
  const { done } = useProgress();
  const [open, setOpen] = useState<{ unit: Unit; lesson: Lesson } | null>(null);

  const all = CURRICULUM.flatMap(u => u.lessons.map(l => ({ unit: u, lesson: l })));
  const nextUp = all.find(x => !done.includes(lessonKey(x.unit, x.lesson)));
  const total = all.length;
  const after = (x: { unit: Unit; lesson: Lesson }) => all[all.findIndex(y => y.lesson === x.lesson) + 1];
  const doneCount = all.filter(x => done.includes(lessonKey(x.unit, x.lesson))).length;

  return (
    <div className="max-w-lg mx-auto pb-6">
      <section className="pt-2">
        <h1 className="font-display text-[28px] leading-tight text-ink">
          {doneCount === 0 ? 'Learn mahjong, one tile at a time' : doneCount === total ? 'You’ve done every lesson' : 'Pick up where you left off'}
        </h1>
        <p className="text-mute mt-1">{doneCount} of {total} lessons done · about 2 minutes each</p>
        {nextUp && (
          <button
            onClick={() => { haptics.tap(); setOpen(nextUp); }}
            className="mt-5 w-full card p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <span className="w-12 h-12 rounded-full bg-accent text-accent-ink grid place-items-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 ml-0.5" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-mute">{doneCount === 0 ? 'Start here' : 'Next lesson'} · {nextUp.unit.title}</span>
              <span className="block text-lg font-semibold text-ink truncate">{nextUp.lesson.title}</span>
            </span>
          </button>
        )}
      </section>

      <ol className="mt-8 flex flex-col gap-6">
        {CURRICULUM.map((unit, ui) => {
          const unitDone = unit.lessons.filter(l => done.includes(lessonKey(unit, l))).length;
          return (
            <li key={unit.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-ink">
                  <span className="text-mute mr-2 tabular-nums">{ui + 1}</span>{unit.title}
                </h2>
                <span className="text-sm text-mute tabular-nums shrink-0">{unitDone}/{unit.lessons.length}</span>
              </div>
              <p className="text-mute text-sm">{unit.blurb}</p>
              <div className="mt-3 card divide-y divide-[color:var(--line)]">
                {unit.lessons.map(lesson => {
                  const key = lessonKey(unit, lesson);
                  const isDone = done.includes(key);
                  const isNext = nextUp && lessonKey(nextUp.unit, nextUp.lesson) === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { haptics.tap(); setOpen({ unit, lesson }); }}
                      className="w-full min-h-[56px] px-4 flex items-center gap-3 text-left active:bg-surface-2"
                    >
                      <span
                        className={`w-6 h-6 rounded-full grid place-items-center shrink-0 border ${
                          isDone ? 'bg-accent border-accent text-accent-ink' : isNext ? 'border-accent' : 'border-line'
                        }`}
                      >
                        {isDone && <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
                      </span>
                      <span className={`flex-1 ${isDone ? 'text-mute' : 'text-ink'}`}>{lesson.title}</span>
                      <span className="text-sm text-mute tabular-nums">{lesson.minutes} min</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {open && (
        <LessonPlayer
          key={lessonKey(open.unit, open.lesson)}
          lesson={open.lesson}
          unitTitle={open.unit.lessons.every(l => l === open.lesson || done.includes(lessonKey(open.unit, l))) ? open.unit.title : undefined}
          intro={open.unit.video && open.unit.lessons[0] === open.lesson && UNIT_VIDEOS.has(open.unit.video) ? open.unit.video : undefined}
          nextTitle={after(open)?.lesson.title}
          onNextLesson={after(open) ? () => setOpen(after(open)!) : undefined}
          onExit={() => setOpen(null)}
          onComplete={() => markDone(lessonKey(open.unit, open.lesson))}
        />
      )}
    </div>
  );
}
