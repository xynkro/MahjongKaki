import { useState, useCallback } from 'react';
import {
  generateDirectionDrill,
  gradeDirection,
  type DirectionDrill as DrillData,
} from '@mahjongkaki/game';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';

interface Props {
  onBack: () => void;
}

// Fixed render order so the correct answer isn't leaked by ordering.
const ORDER = ['full_flush', 'half_flush', 'all_pungs', 'all_chows', 'flexible'];

export function DirectionDrill({ onBack }: Props) {
  const [drill, setDrill] = useState<DrillData | null>(() => generateDirectionDrill());
  const [result, setResult] = useState<ReturnType<typeof gradeDirection> | null>(null);
  const [streak, setStreak] = useState(0);

  const newDrill = useCallback(() => {
    setDrill(generateDirectionDrill());
    setResult(null);
  }, []);

  function answer(key: string) {
    if (!drill || result) return;
    const grade = gradeDirection(drill, key);
    setResult(grade);
    grade.correct ? haptics.success() : haptics.error();
    if (grade.correct) setStreak(s => s + 1);
    else setStreak(0);

    db.trainerStats.add({
      drillType: 'direction',
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

  const ordered = ORDER
    .map(k => drill.options.find(o => o.key === k))
    .filter((o): o is DrillData['options'][number] => !!o);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400">← Back</button>
        <span className="text-xs text-slate-500">Streak: {streak}</span>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">What's the plan?</h3>
        <p className="text-xs text-slate-400 mb-3">
          You were dealt this hand. Which target gives the best value you can realistically reach?
        </p>
        <TileRow tiles={drill.hand} sortTiles={true} />
      </div>

      {!result && (
        <div className="grid grid-cols-1 gap-2">
          {ordered.map(o => (
            <button
              key={o.key}
              onClick={() => answer(o.key)}
              className="w-full text-left bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 active:bg-slate-700/50 flex items-center justify-between"
            >
              <span className="text-sm text-slate-200">{o.label}</span>
              <span className="text-[10px] text-slate-500">{o.tai} tai</span>
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="card p-4 space-y-2">
          <div className={`text-lg font-bold ${result.correct ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.correct ? 'Correct!' : 'Not the best target'}
          </div>
          <div className="text-xs text-slate-300">
            Recommended: <span className="font-semibold">{result.recommendedLabel}</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>

          <div className="mt-3">
            <h4 className="text-xs font-semibold text-slate-500 mb-1">How each target scored</h4>
            <div className="space-y-0.5">
              {result.options.map(o => (
                <div key={o.key} className="flex justify-between text-xs">
                  <span className={o.key === result.recommendation ? 'text-emerald-400' : 'text-slate-500'}>{o.label}</span>
                  <span className="text-slate-500">{o.tai} tai × {Math.round(o.feasibility * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

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
