import { useState, useCallback } from 'react';
import {
  generatePushFoldDrill,
  gradePushFold,
  type PushFoldDrill as DrillData,
  type PushFoldChoice,
} from '@mahjongkaki/game';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';

interface Props {
  onBack: () => void;
}

const CHOICES: { key: PushFoldChoice; label: string; sub: string; color: string }[] = [
  { key: 'push', label: 'Push', sub: 'Keep attacking', color: 'bg-emerald-700 active:bg-emerald-600' },
  { key: 'sidestep', label: 'Sidestep', sub: 'Safe + attack', color: 'bg-amber-700 active:bg-amber-600' },
  { key: 'fold', label: 'Fold', sub: 'Bail to safety', color: 'bg-slate-700 active:bg-slate-600' },
];

export function PushFoldDrill({ onBack }: Props) {
  const [drill, setDrill] = useState<DrillData | null>(() => generatePushFoldDrill());
  const [result, setResult] = useState<ReturnType<typeof gradePushFold> | null>(null);
  const [streak, setStreak] = useState(0);

  const newDrill = useCallback(() => {
    setDrill(generatePushFoldDrill());
    setResult(null);
  }, []);

  function answer(choice: PushFoldChoice) {
    if (!drill || result) return;
    const grade = gradePushFold(drill, choice);
    setResult(grade);
    grade.correct ? haptics.success() : haptics.error();
    if (grade.correct) setStreak(s => s + 1);
    else setStreak(0);

    db.trainerStats.add({
      drillType: 'pushfold',
      timestamp: Date.now(),
      isCorrect: grade.correct ? 1 : 0,
      score: grade.correct ? 1 : 0,
    });
  }

  if (!drill) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 text-sm">Failed to generate drill. Try again.</p>
        <button onClick={newDrill} className="mt-4 px-4 py-2 btn-primary rounded-lg text-sm">
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
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Push or Fold?</h3>
        <p className="text-xs text-slate-400 mb-3">
          Read the danger. Do you push for the win, sidestep with safe tiles, or fold?
        </p>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] text-slate-500 w-16 shrink-0">Opponent</span>
          <span className={`text-xs font-semibold ${drill.threatLevel === 'high' ? 'text-red-400' : 'text-slate-400'}`}>
            {drill.threatLevel === 'high' ? 'Looks dangerous' : 'No clear threat'}
          </span>
        </div>

        {drill.opponentExposed.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-slate-500 w-16 shrink-0">Exposed</span>
            <TileRow tiles={drill.opponentExposed} size="sm" sortTiles={false} />
          </div>
        )}

        <div className="flex items-start gap-2 mb-3">
          <span className="text-[12px] text-slate-500 w-16 shrink-0 mt-1">Discards</span>
          <TileRow tiles={drill.opponentDiscards} size="sm" sortTiles={false} />
        </div>

        <h4 className="text-xs font-semibold text-slate-500 mb-1">
          Your hand · {drill.yourShanten === 0 ? 'tenpai' : `${drill.yourShanten}-shanten`}
        </h4>
        <TileRow tiles={drill.hand} sortTiles={true} />
      </div>

      {!result && (
        <div className="flex gap-2">
          {CHOICES.map(c => (
            <button
              key={c.key}
              onClick={() => answer(c.key)}
              className={`flex-1 py-3 ${c.color} text-white rounded-lg text-sm font-semibold flex flex-col items-center`}
            >
              <span>{c.label}</span>
              <span className="text-[12px] font-normal opacity-80">{c.sub}</span>
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="card p-4 space-y-2">
          <div className={`text-lg font-bold ${result.correct ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.correct ? 'Correct!' : 'Not the best play'}
          </div>
          <div className="text-xs text-slate-300">
            Recommended: <span className="font-semibold capitalize">{result.recommendation}</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <button
            onClick={newDrill}
            className="w-full mt-3 py-2 btn-primary rounded-lg text-sm font-medium active:bg-emerald-600"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
