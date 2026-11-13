import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDisplay } from '../lib/display';
import { POINTS_STAKE } from './game/match';
import type {
  PlayTile, Meld, Hand, WinContext, Wind, ScoringResult, PayoutResult,
  FlowerTile, SeasonTile, AnimalTile,
} from '@mahjongkaki/engine';
import {
  scoreHand, calculatePayout, STAKE_PRESETS,
} from '@mahjongkaki/engine';
import { detectHandFromTiles } from '@mahjongkaki/game';
import { HandDisplay } from './HandDisplay';
import { MeldBuilder } from './MeldBuilder';
import { QuickHand } from './QuickHand';
import { BonusTiles } from './BonusTiles';
import { WinContextPanel } from './WinContext';
import { ScorePanel } from './ScorePanel';
import { haptics } from '../lib/haptics';
import { useRules } from '../lib/settings';
import { roundWind } from '../lib/table-state';

interface CalculatorProps {
  /** Bridge to the chip tracker: pre-fill a round with this hand's tai + win-type. */
  onSendToChips?: (round: { tai: number; winType: 'zimo' | 'discard' }) => void;
}

export function Calculator({ onSendToChips }: CalculatorProps = {}) {
  const { money } = useDisplay();
  const [adding, setAdding] = useState(false);
  const [quickEntry, setQuickEntry] = useState(false);
  // The tiles behind a quick-entry hand. Kept so the best reading is re-picked if a
  // flower, wind or win type changes which split scores highest.
  const [quickSource, setQuickSource] = useState<{ tiles: number[]; concealed: boolean } | null>(null);
  const [quickReadings, setQuickReadings] = useState(0);

  const [melds, setMelds] = useState<Meld[]>([]);
  const [flowers, setFlowers] = useState<FlowerTile[]>([]);
  const [seasons, setSeasons] = useState<SeasonTile[]>([]);
  const [animals, setAnimals] = useState<AnimalTile[]>([]);

  const [seatWind, setSeatWind] = useState<Wind>('east');
  // Default the round wind from the shared Table tracker (Score remounts on tab
  // switch, so this reflects the current round each time you open it).
  const [prevailingWind, setPrevailingWind] = useState<Wind>(() => roundWind());
  const [winType, setWinType] = useState<'zimo' | 'discard'>('discard');
  const [isKongReplacement, setKongReplacement] = useState(false);
  const [isLastTile, setLastTile] = useState(false);
  const [isRobbingKong, setRobbingKong] = useState(false);

  const [stakeIndex, setStakeIndex] = useState(0);
  const [playerNames, setPlayerNames] = useState<[string, string, string, string]>(['East', 'South', 'West', 'North']);
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [shooterIndex, setShooterIndex] = useState<number | undefined>(1);

  const rules = useRules();

  const readQuickHand = useCallback((tiles: number[], concealed: boolean) => detectHandFromTiles(tiles, {
    concealed,
    bonus: { flowers, seasons, animals },
    ctx: { seatWind, prevailingWind, winType, isKongReplacement, isLastTile, isRobbingKong },
    rules,
  }), [flowers, seasons, animals, seatWind, prevailingWind, winType,
      isKongReplacement, isLastTile, isRobbingKong, rules]);

  useEffect(() => {
    if (!quickSource) return;
    const detected = readQuickHand(quickSource.tiles, quickSource.concealed);
    if (detected) {
      setMelds(detected.melds);
      setQuickReadings(detected.readings);
    }
  }, [quickSource, readQuickHand]);

  const detectQuickHand = useCallback((tiles: number[], concealed: boolean) => {
    if (!readQuickHand(tiles, concealed)) return false;
    haptics.success();
    setQuickSource({ tiles, concealed });
    setQuickEntry(false);
    return true;
  }, [readQuickHand]);

  const addMeld = useCallback((meld: Meld) => {
    setQuickSource(null);
    setMelds(prev => {
      const eyesCount = prev.filter(m => m.type === 'eyes').length;
      const setCount = prev.filter(m => m.type !== 'eyes').length;
      if (meld.type === 'eyes' && eyesCount >= 1) return prev;
      if (meld.type !== 'eyes' && setCount >= 4) return prev;
      haptics.select();
      return [...prev, meld];
    });
  }, []);

  const removeMeld = useCallback((index: number) => {
    setQuickSource(null);
    setMelds(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleFlower = useCallback((tile: FlowerTile) => {
    setFlowers(prev => {
      const exists = prev.some(f => f.flower === tile.flower);
      return exists ? prev.filter(f => f.flower !== tile.flower) : [...prev, tile];
    });
  }, []);

  const toggleSeason = useCallback((tile: SeasonTile) => {
    setSeasons(prev => {
      const exists = prev.some(f => f.season === tile.season);
      return exists ? prev.filter(f => f.season !== tile.season) : [...prev, tile];
    });
  }, []);

  const toggleAnimal = useCallback((tile: AnimalTile) => {
    setAnimals(prev => {
      const exists = prev.some(f => f.animal === tile.animal);
      return exists ? prev.filter(f => f.animal !== tile.animal) : [...prev, tile];
    });
  }, []);

  const setPlayerName = useCallback((index: number, name: string) => {
    setPlayerNames(prev => {
      const next = [...prev] as [string, string, string, string];
      next[index] = name;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setMelds([]);
    setFlowers([]);
    setSeasons([]);
    setAnimals([]);
    setAdding(false);
    setQuickEntry(false);
    setQuickSource(null);
  }, []);

  const scoring = useMemo(() => {
    if (melds.length === 0) return null;
    // The last set added is taken as the one the winning tile finished, so it counts as concealed.
    // Ping hu depends on which of its tiles won, so try each and keep the best.
    const last = melds[melds.length - 1];
    const scored = last.type === 'chow' ? [...melds.slice(0, -1), { ...last, exposed: false }] : melds;
    const hand: Hand = { melds: scored, flowers, seasons, animals };
    let best: ReturnType<typeof scoreHand> | null = null;
    for (const winTile of last.tiles) {
      const ctx: WinContext = { seatWind, prevailingWind, winType, winTile, isKongReplacement, isLastTile, isRobbingKong };
      const res = scoreHand(hand, ctx, rules);
      if (!best || res.totalTai > best.totalTai) best = res;
    }
    return best;
  }, [melds, flowers, seasons, animals,
      seatWind, prevailingWind, winType,
      isKongReplacement, isLastTile, isRobbingKong, rules]);

  const payout = useMemo(() => {
    if (!scoring || !scoring.isValid) return null;
    return calculatePayout({
      scoring,
      stake: money ? STAKE_PRESETS[stakeIndex] : POINTS_STAKE,
      winnerIndex,
      shooterIndex: winType === 'zimo' ? undefined : shooterIndex,
      playerNames,
      rules,
    });
  }, [scoring, stakeIndex, money, winnerIndex, shooterIndex,
      winType, playerNames, rules]);

  const hasEyes = melds.some(m => m.type === 'eyes');
  const setCount = melds.filter(m => m.type !== 'eyes').length;
  const isWonders = melds.some(m => m.type === 'wonders');
  const handFull = isWonders || (setCount >= 4 && hasEyes);

  // Plain-language "what's still missing" so an incomplete hand never silently
  // shows a settlement (a complete win is 4 sets + a pair).
  const incompleteMsg = (() => {
    if (melds.length === 0 || handFull) return null;
    const missing: string[] = [];
    if (setCount < 4) missing.push(`${4 - setCount} more set${4 - setCount > 1 ? 's' : ''}`);
    if (!hasEyes) missing.push('a pair');
    return `Add ${missing.join(' and ')} to complete the hand.`;
  })();

  return (
    <div className="space-y-4 pb-4">
      <section className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title">
            Hand
            <span className="text-slate-500 ml-1 font-normal normal-case">
              {isWonders ? '(Thirteen Wonders)' : `(${setCount}/4 sets${hasEyes ? ' + eyes' : ''})`}
            </span>
          </h3>
          <div className="flex gap-2">
            {!adding && !quickEntry && melds.length === 0 && (
              <button
                type="button"
                onClick={() => { haptics.tap(); setQuickEntry(true); }}
                className="px-3 py-1 text-xs font-medium seg-off rounded-md"
              >
                Quick entry
              </button>
            )}
            {!adding && !quickEntry && !handFull && (
              <button
                type="button"
                onClick={() => { haptics.tap(); setAdding(true); }}
                className="px-3 py-1 text-xs font-medium btn-primary rounded-md active:bg-emerald-600"
              >
                + Add
              </button>
            )}
            {melds.length > 0 && (
              <button
                type="button"
                onClick={() => { haptics.tap(); reset(); }}
                className="px-3 py-1 text-xs text-slate-400 rounded-md active:bg-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {!quickEntry && (
          <HandDisplay
            melds={melds}
            flowers={flowers}
            seasons={seasons}
            animals={animals}
            onRemoveMeld={removeMeld}
          />
        )}

        {quickSource && (
          <p className="mt-2 text-[11px] text-amber-200/80">
            Read from your 14 tiles{quickReadings > 1 ? `, best of ${quickReadings} ways to split them` : ''}.{' '}
            {isWonders
              ? 'Thirteen Wonders is always concealed.'
              : quickSource.concealed ? 'Counted as fully concealed.' : 'Counted as exposed, so no concealed bonus.'}
          </p>
        )}

        {quickEntry && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <QuickHand onDetect={detectQuickHand} onCancel={() => setQuickEntry(false)} />
          </div>
        )}

        {adding && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <MeldBuilder
              onAdd={(meld) => { addMeld(meld); setAdding(false); }}
              onCancel={() => setAdding(false)}
              hasEyes={hasEyes}
              setCount={setCount}
            />
          </div>
        )}
      </section>

      <BonusTiles
        flowers={flowers}
        seasons={seasons}
        animals={animals}
        onToggleFlower={toggleFlower}
        onToggleSeason={toggleSeason}
        onToggleAnimal={toggleAnimal}
      />

      <WinContextPanel
        seatWind={seatWind}
        prevailingWind={prevailingWind}
        winType={winType}
        isKongReplacement={isKongReplacement}
        isLastTile={isLastTile}
        isRobbingKong={isRobbingKong}
        onSeatWind={setSeatWind}
        onPrevailingWind={setPrevailingWind}
        onWinType={setWinType}
        onKongReplacement={setKongReplacement}
        onLastTile={setLastTile}
        onRobbingKong={setRobbingKong}
      />

      <ScorePanel
        money={money}
        scoring={scoring}
        payout={payout}
        stakeIndex={stakeIndex}
        onStakeChange={setStakeIndex}
        playerNames={playerNames}
        winnerIndex={winnerIndex}
        shooterIndex={shooterIndex}
        winType={winType}
        onWinnerChange={setWinnerIndex}
        onShooterChange={setShooterIndex}
        onPlayerNameChange={setPlayerName}
        handFull={handFull}
        incompleteMsg={incompleteMsg}
        onSendToChips={
          onSendToChips && handFull && scoring?.isValid
            ? () => { haptics.success(); onSendToChips({ tai: scoring.cappedTai, winType }); }
            : undefined
        }
      />
    </div>
  );
}
