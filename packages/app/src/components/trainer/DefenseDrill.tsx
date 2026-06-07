import { useState, useCallback } from 'react';
import {
  generateDefenseDrill,
  gradeDefense,
  type DefenseDrill as DrillData,
} from '@mahjongkaki/game';
import { indexToTile, tileKey } from '@mahjongkaki/engine';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';

interface Props {
  onBack: () => void;
}

export function DefenseDrill({ onBack }: Props) {
  const [drill, setDrill] = useState<DrillData | null>(() => generateDefenseDrill());
  const [result, setResult] = useState<ReturnType<typeof gradeDefense> | null>(null);
  const [chosenTile, setChosenTile] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const newDrill = useCallback(() => {
    setDrill(generateDefenseDrill());
    setResult(null);
    setChosenTile(null);
  }, []);

  function handleTileClick(tile: number) {
    if (!drill || result) return;
    setChosenTile(tile);
    const grade = gradeDefense(drill, tile);
    setResult(grade);

    grade.isOptimal ? haptics.success() : haptics.error();

    if (grade.isOptimal) setStreak(s => s + 1);
    else setStreak(0);

    db.trainerStats.add({
      drillType: 'defense',
      timestamp: Date.now(),
      isCorrect: grade.isOptimal ? 1 : 0,
      score: grade.safety,
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
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Defense Training</h3>
        <p className="text-xs text-slate-400 mb-3">
          An opponent may be tenpai. Pick the safest discard.
        </p>

        <div className="space-y-2 mb-3">
          {drill.opponentDiscards.map((pond, i) => (
            <div key={i} className="flex items-start gap-1">
              <span className="text-[12px] text-slate-600 w-6 shrink-0 mt-1">P{i + 1}</span>
              {pond.length > 0 ? (
                <TileRow tiles={pond} size="sm" sortTiles={false} />
              ) : (
                <span className="text-[12px] text-slate-700">--</span>
              )}
            </div>
          ))}
        </div>

        <h4 className="text-xs font-semibold text-slate-500 mb-1">Your hand</h4>
        <TileRow
          tiles={drill.hand}
          onTileClick={!result ? handleTileClick : undefined}
          sortTiles={true}
        />
      </div>

      {result && chosenTile !== null && (
        <div className="card p-4 space-y-2">
          <div className={`text-lg font-bold ${result.isOptimal ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.isOptimal ? 'Safest choice!' : 'Not optimal'}
          </div>
          <div className="text-xs text-slate-400">
            Your pick: {tileKey(indexToTile(chosenTile))} (safety: {Math.round(result.safety * 100)}%)
          </div>
          {!result.isOptimal && (
            <div className="text-xs text-slate-400">
              Safest: {drill.safestTiles.map(t => tileKey(indexToTile(t))).join(', ')} (safety: {Math.round(result.bestSafety * 100)}%)
            </div>
          )}

          <div className="mt-3">
            <h4 className="text-xs font-semibold text-slate-500 mb-1">Safety ranking</h4>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {drill.tileRanking.slice(0, 6).map((r, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-500">
                  <span>{tileKey(indexToTile(r.tile))}</span>
                  <span>{Math.round(r.safety * 100)}%</span>
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
