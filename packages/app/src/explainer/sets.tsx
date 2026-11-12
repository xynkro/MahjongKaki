// Explainers for the Sets unit: pung (three of a kind), chow (three in a row), the winning hand.
import type { ReactNode } from 'react';
import { tileToIndex, suit, wind, dragon } from '@mahjongkaki/engine';
import { Felt, Pop, Tile, at, ease, type SceneData } from './kit';
import { Label } from './wall';

type V = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const b = (v: V) => tileToIndex(suit('bamboo', v));
const c = (v: V) => tileToIndex(suit('character', v));
const d = (v: V) => tileToIndex(suit('dot', v));
const E = tileToIndex(wind('east')), S = tileToIndex(wind('south')), W = tileToIndex(wind('west'));
const RED = tileToIndex(dragon('red')), GREEN = tileToIndex(dragon('green')), WHITE = tileToIndex(dragon('white'));

/** Tiles that drop in one after another from `from`. */
export function Group({ tiles, from, t, w = 62, label, mark }: {
  tiles: number[]; from: number; t: number; w?: number; label?: ReactNode;
  /** Tick or cross shown over the group at that time. */
  mark?: { ok: boolean; at: number };
}) {
  const m = mark ? ease(t, mark.at, 0.3) : 0;
  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="flex gap-1.5" style={{ opacity: mark && !mark.ok ? 1 - 0.45 * m : 1 }}>
        {tiles.map((tile, i) => {
          const k = ease(t, from + i * 0.12, 0.3);
          return <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * -26}px)` }}><Tile index={tile} w={w} /></div>;
        })}
      </div>
      {label && <div style={{ opacity: ease(t, from + tiles.length * 0.12, 0.3) }}><Label size={28}>{label}</Label></div>}
      {mark && m > 0 && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none" style={{ transform: `scale(${0.6 + 0.4 * m})`, opacity: m }}>
          <span className="w-20 h-20 rounded-full grid place-items-center text-[50px] font-bold"
            style={{ background: mark.ok ? '#3ccf8e' : '#ef6b5a', color: mark.ok ? '#0c2a1d' : '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.45)' }}>
            {mark.ok ? '✓' : '✗'}
          </span>
        </div>
      )}
    </div>
  );
}

function Stack({ children, gap = 34, top = 90 }: { children: ReactNode; gap?: number; top?: number }) {
  return <div className="absolute inset-x-0 flex flex-col items-center" style={{ top, gap }}>{children}</div>;
}

function Recap({ t, from, text }: { t: number; from: number; text: string }) {
  return (
    <Pop t={t} from={from}>
      <div className="flex items-center gap-4 justify-center">
        <span className="w-14 h-14 rounded-full bg-[#3ccf8e] text-[#0c2a1d] grid place-items-center text-[34px] font-bold">✓</span>
        <Label size={44}>{text}</Label>
      </div>
    </Pop>
  );
}

/* =================== Pung =================== */

const PungIntro = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={230}>
    <Group tiles={[b(3), b(3), b(3)]} from={at(s, 'three')} t={t} w={96} />
    <Pop t={t} from={at(s, 'pung')}><Label size={56} color="#f2c14e">A pung</Label></Pop>
  </Stack></Felt>
);

const PungAny = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={60} gap={26}>
    <Group tiles={[d(5), d(5), d(5)]} from={at(s, 'dots')} t={t} w={56} />
    <Group tiles={[c(7), c(7), c(7)]} from={at(s, 'characters')} t={t} w={56} />
    <Group tiles={[E, E, E]} from={at(s, 'winds')} t={t} w={56} />
    <Group tiles={[RED, RED, RED]} from={at(s, 'dragons')} t={t} w={56} />
  </Stack></Felt>
);

const PungNot = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={200}>
    <Group tiles={[b(3), d(3), c(3)]} from={at(s, 'same')} t={t} w={90} mark={{ ok: false, at: at(s, 'not') }} />
    <Pop t={t} from={at(s, 'match')}><Label size={36}>All three must match exactly</Label></Pop>
  </Stack></Felt>
);

const PungDragons = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={70} gap={26}>
    <Group tiles={[RED, RED, RED]} from={at(s, 'red')} t={t} w={58} />
    <Group tiles={[GREEN, GREEN, GREEN]} from={at(s, 'green')} t={t} w={58} />
    <Group tiles={[WHITE, WHITE, WHITE]} from={at(s, 'white')} t={t} w={58} />
    <Pop t={t} from={at(s, 'tai')}><Label size={44} color="#f2c14e">+1 tai</Label></Pop>
  </Stack></Felt>
);

const PungRecap = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={210}>
    <Group tiles={[b(3), b(3), b(3)]} from={0} t={t} w={80} />
    <Recap t={t} from={at(s, 'pung')} text="Three the same: a pung" />
  </Stack></Felt>
);

export const PUNG_SCENES = [PungIntro, PungAny, PungNot, PungDragons, PungRecap];

/* =================== Chow =================== */

const ChowIntro = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={230}>
    <Group tiles={[d(4), d(5), d(6)]} from={at(s, 'numbers')} t={t} w={96} />
    <Pop t={t} from={at(s, 'chow')}><Label size={56} color="#f2c14e">A chow</Label></Pop>
  </Stack></Felt>
);

const ChowExamples = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={110} gap={40}>
    <Group tiles={[d(4), d(5), d(6)]} from={at(s, 'four')} t={t} w={64} />
    <Group tiles={[c(1), c(2), c(3)]} from={at(s, 'one')} t={t} w={64} />
    <Group tiles={[b(7), b(8), b(9)]} from={at(s, 'seven')} t={t} w={64} />
  </Stack></Felt>
);

const ChowSuits = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={200}>
    <Group tiles={[c(4), d(5), b(6)]} from={at(s, 'four')} t={t} w={90} mark={{ ok: false, at: at(s, 'not') }} />
    <Pop t={t} from={at(s, 'suits')}><Label size={36}>The suits must match</Label></Pop>
  </Stack></Felt>
);

const ChowNever = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={110} gap={60}>
    <Group tiles={[b(8), b(9), b(1)]} from={at(s, 'eight')} t={t} w={72} label="No wrapping round" mark={{ ok: false, at: at(s, 'count') }} />
    <Group tiles={[E, S, W]} from={at(s, 'winds')} t={t} w={72} label="Honours have no numbers" mark={{ ok: false, at: at(s, 'never') }} />
  </Stack></Felt>
);

const ChowRecap = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={210}>
    <Group tiles={[d(4), d(5), d(6)]} from={0} t={t} w={80} />
    <Recap t={t} from={at(s, 'row')} text="In a row, one suit: a chow" />
  </Stack></Felt>
);

export const CHOW_SCENES = [ChowIntro, ChowExamples, ChowSuits, ChowNever, ChowRecap];

/* =================== The winning hand =================== */

const PairIntro = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={230} gap={20}>
    <Pop t={t} from={at(s, 'four')}><Label size={60}>4 sets</Label></Pop>
    <Pop t={t} from={at(s, 'pair')}><Label size={60}>+ 1 pair</Label></Pop>
    <Pop t={t} from={at(s, 'fourteen')}><Label size={60} color="#f2c14e">= 14 tiles</Label></Pop>
  </Stack></Felt>
);

const PairWhat = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={230}>
    <Group tiles={[GREEN, GREEN]} from={at(s, 'two')} t={t} w={100} />
    <Pop t={t} from={at(s, 'green')}><Label size={50} color="#f2c14e">A pair</Label></Pop>
  </Stack></Felt>
);

const PairHand = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt>
    <div className="absolute inset-x-0 top-[110px] flex justify-center gap-6">
      <Group tiles={[c(1), c(2), c(3)]} from={at(s, 'chow', 0)} t={t} w={52} label="chow" />
      <Group tiles={[d(6), d(6), d(6)]} from={at(s, 'pung', 0)} t={t} w={52} label="pung" />
      <Group tiles={[b(4), b(5), b(6)]} from={at(s, 'another')} t={t} w={52} label="chow" />
    </div>
    <div className="absolute inset-x-0 top-[350px] flex justify-center gap-10">
      <Group tiles={[W, W, W]} from={at(s, 'west')} t={t} w={52} label="pung" />
      <Group tiles={[GREEN, GREEN]} from={at(s, 'pair')} t={t} w={52} label={<span className="text-[#f2c14e]">pair</span>} />
    </div>
  </Felt>
);

const PairCount = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Stack top={250}>
    <div className="flex items-baseline gap-4">
      <Pop t={t} from={at(s, 'twelve')}><Label size={70}>12</Label></Pop>
      <Pop t={t} from={at(s, 'two')}><Label size={70}>+ 2</Label></Pop>
      <Pop t={t} from={at(s, 'fourteen')}><Label size={70} color="#f2c14e">= 14</Label></Pop>
    </div>
  </Stack></Felt>
);

const PairRecap = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt>
    <div className="absolute inset-x-0 top-[150px] flex justify-center gap-1">
      {[c(1), c(2), c(3), d(6), d(6), d(6), b(4), b(5), b(6), W, W, W, GREEN, GREEN].map((tile, i) => (
        <div key={i} style={{ marginLeft: i && i % 3 === 0 && i < 13 ? 8 : 0 }}><Tile index={tile} w={38} /></div>
      ))}
    </div>
    <div className="absolute inset-x-0 top-[330px]"><Recap t={t} from={at(s, 'four')} text="Four sets + a pair" /></div>
  </Felt>
);

export const PAIR_SCENES = [PairIntro, PairWhat, PairHand, PairCount, PairRecap];
