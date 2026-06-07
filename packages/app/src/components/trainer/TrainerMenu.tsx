import { useState, useEffect } from 'react';
import { db } from '../../lib/db';

export type DrillType =
  | 'efficiency' | 'waits' | 'defense'
  | 'call' | 'pushfold' | 'direction' | 'reading';

interface TrainerMenuProps {
  onSelect: (drill: DrillType) => void;
}

interface DrillDef { type: DrillType; label: string; description: string }

const FUNDAMENTALS: DrillDef[] = [
  { type: 'efficiency', label: 'Tile Efficiency', description: 'Pick the discard that keeps the most winning tiles' },
  { type: 'waits', label: 'Wait Training', description: 'Identify which tiles complete a tenpai hand' },
  { type: 'defense', label: 'Safe Tiles', description: 'Find the safest tile to discard' },
];

const STRATEGY: DrillDef[] = [
  { type: 'call', label: 'Eat or Pass', description: 'Decide whether to claim a discard (pung/chow)' },
  { type: 'pushfold', label: 'Push or Fold', description: 'Attack, sidestep, or bail when an opponent is close' },
  { type: 'direction', label: 'Hand Direction', description: 'Pick the most valuable target your tiles can reach' },
  { type: 'reading', label: 'Read Discards', description: 'Work out what an opponent is collecting' },
];

export function TrainerMenu({ onSelect }: TrainerMenuProps) {
  const [stats, setStats] = useState<Record<string, { total: number; correct: number }>>({});

  useEffect(() => {
    db.trainerStats.toArray().then(rows => {
      const grouped: Record<string, { total: number; correct: number }> = {};
      for (const r of rows) {
        if (!grouped[r.drillType]) grouped[r.drillType] = { total: 0, correct: 0 };
        grouped[r.drillType].total++;
        if (r.isCorrect) grouped[r.drillType].correct++;
      }
      setStats(grouped);
    });
  }, []);

  const renderDrill = (d: DrillDef) => {
    const s = stats[d.type];
    return (
      <button
        key={d.type}
        onClick={() => onSelect(d.type)}
        className="w-full text-left bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 active:bg-slate-700/50"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">{d.label}</span>
          {s && s.total > 0 && (
            <span className="text-xs text-slate-500">
              {Math.round((s.correct / s.total) * 100)}% ({s.total})
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{d.description}</p>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-200">Training Drills</h2>
      <p className="text-xs text-slate-400">Practice specific mahjong skills</p>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-2">Fundamentals</h3>
      {FUNDAMENTALS.map(renderDrill)}

      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-2">Strategy</h3>
      {STRATEGY.map(renderDrill)}
    </div>
  );
}
