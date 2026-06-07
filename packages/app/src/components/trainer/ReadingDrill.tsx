import { useState, useCallback } from 'react';
import {
  generateReadingDrill,
  gradeReading,
  type ReadingDrill as DrillData,
  type ReadingSuit,
} from '@mahjongkaki/game';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';

interface Props {
  onBack: () => void;
}

export function ReadingDrill({ onBack }: Props) {
  const [drill, setDrill] = useState<DrillData | null>(() => generateReadingDrill());
  const [result, setResult] = useState<ReturnType<typeof gradeReading> | null>(null);
  const [streak, setStreak] = useState(0);

  const newDrill = useCallback(() => {
    setDrill(generateReadingDrill());
    setResult(null);
  }, []);

  function answer(choice: ReadingSuit) {
    if (!drill || result) return;
    const grade = gradeReading(drill, choice);
    setResult(grade);
    grade.correct ? haptics.success() : haptics.error();
    if (grade.correct) setStreak(s => s + 1);
    else setStreak(0);

    db.trainerStats.add({
      drillType: 'reading',
      timestamp: Date.now(),
      isCorrect: grade.correct ? 1 : 0,
      score: grade.correct ? 1 : 0,
    });
  }

  if (!drill) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 text-sm">Failed to generate drill. Try again.</p>
        <button onClick={newDrill} className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400">← Back</button>
        <span className="text-xs text-slate-500">Streak: {streak}</span>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Read the Discards</h3>
        <p className="text-xs text-slate-400 mb-3">
          Here is one opponent's discard pond. Which suit are they collecting?
        </p>
        <TileRow tiles={drill.opponentDiscards} size="sm" sortTiles={true} />
      </div>

      {!result && (
        <div className="grid grid-cols-2 gap-2">
          {drill.options.map(o => (
            <button
              key={o.key}
              onClick={() => answer(o.key)}
              className="py-3 bg-slate-800/50 rounded-lg border border-slate-700/50 active:bg-slate-700/50 text-sm text-slate-200"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="card p-4 space-y-2">
          <div className={`text-lg font-bold ${result.correct ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.correct ? 'Correct!' : 'Misread'}
          </div>
          <div className="text-xs text-slate-300">
            Answer: <span className="font-semibold">{result.answerLabel}</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <button
            onClick={newDrill}
            className="w-full mt-3 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium active:bg-emerald-600"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
