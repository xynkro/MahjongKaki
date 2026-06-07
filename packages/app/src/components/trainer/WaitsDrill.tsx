import { useState, useCallback } from 'react';
import {
  generateWaitsDrill,
  gradeWaits,
  type WaitsDrill as DrillData,
} from '@mahjongkaki/game';
import { indexToTile, tileKey } from '@mahjongkaki/engine';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';

interface Props {
  onBack: () => void;
}

const ALL_TILES = Array.from({ length: 34 }, (_, i) => i);

export function WaitsDrill({ onBack }: Props) {
  const [drill, setDrill] = useState<DrillData | null>(() => generateWaitsDrill());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<ReturnType<typeof gradeWaits> | null>(null);
  const [streak, setStreak] = useState(0);

  const newDrill = useCallback(() => {
    setDrill(generateWaitsDrill());
    setSelected(new Set());
    setResult(null);
  }, []);

  function toggleTile(tile: number) {
    if (result) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(tile)) next.delete(tile);
      else next.add(tile);
      return next;
    });
  }

  function handleSubmit() {
    if (!drill || result) return;
    const grade = gradeWaits(drill, [...selected]);
    setResult(grade);

    const isCorrect = grade.score === 1;
    isCorrect ? haptics.success() : haptics.error();
    if (isCorrect) setStreak(s => s + 1);
    else setStreak(0);

    db.trainerStats.add({
      drillType: 'waits',
      timestamp: Date.now(),
      isCorrect: isCorrect ? 1 : 0,
      score: grade.score,
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
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Wait Training</h3>
        <p className="text-xs text-slate-400 mb-3">
          This hand is tenpai. Select all tiles that complete it.
        </p>
        <TileRow tiles={drill.hand} sortTiles={true} />
      </div>

      <div className="card p-4">
        <h4 className="text-xs font-semibold text-slate-500 mb-2">Tap waiting tiles</h4>
        <TileRow
          tiles={ALL_TILES}
          onTileClick={!result ? toggleTile : undefined}
          selectedTiles={selected.size > 0 ? selected : undefined}
          size="sm"
          sortTiles={false}
        />
        {!result && (
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="w-full mt-3 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium active:bg-emerald-600 disabled:opacity-40"
          >
            Check ({selected.size} selected)
          </button>
        )}
      </div>

      {result && (
        <div className="card p-4 space-y-2">
          <div className={`text-lg font-bold ${result.score === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.score === 1 ? 'Perfect!' : `${Math.round(result.score * 100)}%`}
          </div>
          {result.correct.length > 0 && (
            <div className="text-xs text-emerald-400">
              Correct: {result.correct.map(t => tileKey(indexToTile(t))).join(', ')}
            </div>
          )}
          {result.missed.length > 0 && (
            <div className="text-xs text-amber-400">
              Missed: {result.missed.map(t => tileKey(indexToTile(t))).join(', ')}
            </div>
          )}
          {result.wrong.length > 0 && (
            <div className="text-xs text-red-400">
              Wrong: {result.wrong.map(t => tileKey(indexToTile(t))).join(', ')}
            </div>
          )}
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
