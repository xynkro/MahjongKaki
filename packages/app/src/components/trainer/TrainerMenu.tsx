import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';

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
        onClick={() => { haptics.tap(); onSelect(d.type); }}
        className="w-full text-left card p-4 active:bg-slate-700/50"
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

  const all = Object.values(stats).reduce(
    (a, s) => ({ total: a.total + s.total, correct: a.correct + s.correct }),
    { total: 0, correct: 0 },
  );

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-200">Training Drills</h2>
      <p className="text-xs text-slate-400">Practice specific mahjong skills</p>

      {all.total > 0 ? (
        <div className="card p-4">
          <AccuracyRing pct={Math.round((all.correct / all.total) * 100)} total={all.total} />
        </div>
      ) : (
        <div className="card p-4 text-sm text-slate-400">Answer a few drills to track your accuracy here.</div>
      )}

      <h3 className="section-title pt-2">Fundamentals</h3>
      {FUNDAMENTALS.map(renderDrill)}

      <h3 className="section-title pt-2">Strategy</h3>
      {STRATEGY.map(renderDrill)}
    </div>
  );
}

function AccuracyRing({ pct, total }: { pct: number; total: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - pct / 100);
  return (
    <div className="flex items-center gap-4">
      <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0 -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="#3c372e" strokeWidth="7" />
        <circle
          cx="34" cy="34" r={r} fill="none" stroke="#3FB683" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
        />
        <text
          x="34" y="34" transform="rotate(90 34 34)" textAnchor="middle" dominantBaseline="central"
          className="fill-slate-100" fontSize="15" fontWeight="700"
        >{pct}%</text>
      </svg>
      <div>
        <div className="text-sm font-semibold text-slate-200">Overall accuracy</div>
        <div className="text-xs text-slate-500">{total} drill{total === 1 ? '' : 's'} answered</div>
      </div>
    </div>
  );
}
