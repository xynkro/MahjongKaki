import { useState, useCallback } from 'react';
import {
  generateCallDrill,
  gradeCall,
  type CallDrill as DrillData,
} from '@mahjongkaki/game';
import type { Wind } from '@mahjongkaki/engine';
import { TileRow } from '../game/TileRow';
import { db } from '../../lib/db';
import { haptics } from '../../lib/haptics';

const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };

interface Props {
  onBack: () => void;
}

export function CallDrill({ onBack }: Props) {
  const [drill, setDrill] = useState<DrillData | null>(() => generateCallDrill());
  const [result, setResult] = useState<ReturnType<typeof gradeCall> | null>(null);
  const [streak, setStreak] = useState(0);

  const newDrill = useCallback(() => {
    setDrill(generateCallDrill());
    setResult(null);
  }, []);

  function answer(choice: 'call' | 'pass') {
    if (!drill || result) return;
    const grade = gradeCall(drill, choice);
    setResult(grade);
    grade.correct ? haptics.success() : haptics.error();
    if (grade.correct) setStreak(s => s + 1);
    else setStreak(0);

    db.trainerStats.add({
      drillType: 'call',
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

  const callLabel = drill.callKind === 'pung' ? 'Pung' : 'Chow';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400">← Back</button>
        <span className="text-xs text-slate-500">Streak: {streak}</span>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Eat or Pass?</h3>
        <p className="text-xs text-slate-400 mb-3">
          An opponent discarded this tile. You can <span className="text-emerald-400 font-semibold">{callLabel}</span> it.
          Should you call, or pass and stay concealed?
        </p>

        <div className="flex items-end gap-3 mb-3">
          <div>
            <span className="text-[12px] text-slate-500 block mb-1">Discard</span>
            <TileRow tiles={[drill.discardTile]} sortTiles={false} />
          </div>
          <div>
            <span className="text-[12px] text-slate-500 block mb-1">Would form</span>
            <TileRow tiles={drill.meldTiles} size="sm" sortTiles={false} />
          </div>
        </div>

        <h4 className="text-xs font-semibold text-slate-500 mb-1">Your hand</h4>
        <TileRow tiles={drill.hand} sortTiles={true} />

        <div className="flex gap-3 mt-3 text-xs text-slate-400">
          <span>Seat: {WIND_CHARS[drill.seatWind]}</span>
          <span>Prevailing: {WIND_CHARS[drill.prevailingWind]}</span>
        </div>
      </div>

      {!result && (
        <div className="flex gap-2">
          <button
            onClick={() => answer('call')}
            className="flex-1 py-3 btn-primary rounded-lg text-sm font-semibold active:bg-emerald-600"
          >
            {callLabel} it
          </button>
          <button
            onClick={() => answer('pass')}
            className="flex-1 py-3 bg-slate-700 text-white rounded-lg text-sm font-semibold active:bg-slate-600"
          >
            Pass
          </button>
        </div>
      )}

      {result && (
        <div className="card p-4 space-y-2">
          <div className={`text-lg font-bold ${result.correct ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.correct ? 'Correct!' : 'Not the best play'}
          </div>
          <div className="text-xs text-slate-300">
            Recommended: <span className="font-semibold">{result.recommendation === 'call' ? `${callLabel} it` : 'Pass'}</span>
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
