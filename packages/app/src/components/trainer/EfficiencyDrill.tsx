import { useState, useCallback } from 'react';
import {
  generateEfficiencyDrill,
  gradeEfficiency,
  type EfficiencyDrill as DrillData,
} from '@mahjongkaki/game';
import { indexToTile, tileKey } from '@mahjongkaki/engine';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';

interface Props {
  onBack: () => void;
}

export function EfficiencyDrill({ onBack }: Props) {
  const [drill, setDrill] = useState<DrillData | null>(() => generateEfficiencyDrill());
  const [result, setResult] = useState<ReturnType<typeof gradeEfficiency> | null>(null);
  const [streak, setStreak] = useState(0);

  const newDrill = useCallback(() => {
    setDrill(generateEfficiencyDrill());
    setResult(null);
  }, []);

  function handleTileClick(tile: number) {
    if (!drill || result) return;
    const grade = gradeEfficiency(drill, tile);
    setResult(grade);
    if (grade.isOptimal) setStreak(s => s + 1);
    else setStreak(0);

    db.trainerStats.add({
      drillType: 'efficiency',
      timestamp: Date.now(),
      isCorrect: grade.isOptimal ? 1 : 0,
      score: grade.ratio,
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

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">
          Tile Efficiency ({drill.shantenValue}-shanten)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Tap the tile you would discard to maximize acceptance
        </p>
        <TileRow
          tiles={drill.hand}
          onTileClick={!result ? handleTileClick : undefined}
          sortTiles={true}
        />
      </div>

      {result && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-2">
          <div className={`text-lg font-bold ${result.isOptimal ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.isOptimal ? 'Optimal!' : `${Math.round(result.ratio * 100)}% efficiency`}
          </div>
          <div className="text-xs text-slate-400">
            Your acceptance: {result.acceptance} | Best: {result.optimalAcceptance}
          </div>
          {!result.isOptimal && (
            <div className="text-xs text-slate-400">
              Optimal discard: {tileKey(indexToTile(drill.optimalDiscard))}
            </div>
          )}

          <div className="mt-3">
            <h4 className="text-xs font-semibold text-slate-500 mb-1">All candidates</h4>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {drill.allCandidates.slice(0, 8).map((c, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-500">
                  <span>{tileKey(indexToTile(c.tileIndex))}</span>
                  <span>{c.totalAcceptance} acceptance</span>
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
