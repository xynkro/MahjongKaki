import { useState, useCallback } from 'react';
import {
  generateEfficiencyDrill,
  gradeEfficiency,
  type EfficiencyDrill as DrillData,
} from '@mahjongkaki/game';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';
import { readyDistance, winningTiles } from '../../lib/drill-copy';

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
    grade.isOptimal ? haptics.success() : haptics.error();
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
        <h3 className="text-sm font-semibold text-slate-300 mb-1">
          Tile Efficiency: {readyDistance(drill.shantenValue)}
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Tap the tile to discard that keeps the most winning tiles
        </p>
        <TileRow
          tiles={drill.hand}
          onTileClick={!result ? handleTileClick : undefined}
          sortTiles={true}
        />
      </div>

      {result && (
        <div className="card p-4 space-y-2">
          <div className={`text-lg font-bold ${result.ratio >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.isOptimal ? 'Best discard!' : `${Math.round(result.ratio * 100)}% as good as the best`}
          </div>
          <div className="text-xs text-slate-400">
            Your discard keeps {winningTiles(result.acceptance)}. The best keeps {result.optimalAcceptance}.
          </div>
          {result.ratio < 1 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Best discard:</span>
              <TileRow tiles={[drill.optimalDiscard]} size="sm" sortTiles={false} animateEntrance={false} />
            </div>
          )}

          <div className="mt-3">
            <h4 className="text-xs font-semibold text-slate-500 mb-1">Discards, best first</h4>
            <div className="space-y-1">
              {drill.allCandidates.slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-500">
                  <TileRow tiles={[c.tileIndex]} size="sm" sortTiles={false} animateEntrance={false} />
                  <span>keeps {winningTiles(c.totalAcceptance)}</span>
                </div>
              ))}
            </div>
          </div>

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
