import { useState, useMemo, useCallback } from 'react';
import type {
  PlayTile, Meld, Hand, WinContext, Wind, ScoringResult, PayoutResult,
  FlowerTile, SeasonTile, AnimalTile,
} from '@mahjongkaki/engine';
import {
  scoreHand, calculatePayout, STAKE_PRESETS,
} from '@mahjongkaki/engine';
import { HandDisplay } from './HandDisplay';
import { MeldBuilder } from './MeldBuilder';
import { BonusTiles } from './BonusTiles';
import { WinContextPanel } from './WinContext';
import { ScorePanel } from './ScorePanel';
import { haptics } from '../lib/haptics';
import { useRules } from '../lib/settings';

export function Calculator() {
  const [adding, setAdding] = useState(false);

  const [melds, setMelds] = useState<Meld[]>([]);
  const [flowers, setFlowers] = useState<FlowerTile[]>([]);
  const [seasons, setSeasons] = useState<SeasonTile[]>([]);
  const [animals, setAnimals] = useState<AnimalTile[]>([]);

  const [seatWind, setSeatWind] = useState<Wind>('east');
  const [prevailingWind, setPrevailingWind] = useState<Wind>('east');
  const [winType, setWinType] = useState<'zimo' | 'discard'>('discard');
  const [isKongReplacement, setKongReplacement] = useState(false);
  const [isLastTile, setLastTile] = useState(false);
  const [isRobbingKong, setRobbingKong] = useState(false);

  const [stakeIndex, setStakeIndex] = useState(0);
  const [playerNames, setPlayerNames] = useState<[string, string, string, string]>(['East', 'South', 'West', 'North']);
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [shooterIndex, setShooterIndex] = useState<number | undefined>(1);

  const rules = useRules();

  const addMeld = useCallback((meld: Meld) => {
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
  }, []);

  const scoring = useMemo(() => {
    if (melds.length === 0) return null;
    const hand: Hand = { melds, flowers, seasons, animals };
    const ctx: WinContext = {
      seatWind, prevailingWind, winType,
      winTile: melds[melds.length - 1].tiles[0],
      isKongReplacement, isLastTile, isRobbingKong,
    };
    return scoreHand(hand, ctx, rules);
  }, [melds, flowers, seasons, animals,
      seatWind, prevailingWind, winType,
      isKongReplacement, isLastTile, isRobbingKong, rules]);

  const payout = useMemo(() => {
    if (!scoring || !scoring.isValid) return null;
    return calculatePayout({
      scoring,
      stake: STAKE_PRESETS[stakeIndex],
      winnerIndex,
      shooterIndex: winType === 'zimo' ? undefined : shooterIndex,
      playerNames,
      rules,
    });
  }, [scoring, stakeIndex, winnerIndex, shooterIndex,
      winType, playerNames, rules]);

  const hasEyes = melds.some(m => m.type === 'eyes');
  const setCount = melds.filter(m => m.type !== 'eyes').length;
  const handFull = setCount >= 4 && hasEyes;

  return (
    <div className="space-y-4 pb-4">
      <section className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title">
            Hand
            <span className="text-slate-500 ml-1 font-normal normal-case">
              ({setCount}/4 sets{hasEyes ? ' + eyes' : ''})
            </span>
          </h3>
          <div className="flex gap-2">
            {!adding && !handFull && (
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

        <HandDisplay
          melds={melds}
          flowers={flowers}
          seasons={seasons}
          animals={animals}
          onRemoveMeld={removeMeld}
        />

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
      />
    </div>
  );
}
