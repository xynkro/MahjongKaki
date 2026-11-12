// Explainers for "Meet the tiles", "Seats and winds" and "Scoring".
import type { ReactNode } from 'react';
import { tileToIndex, suit, wind, dragon } from '@mahjongkaki/engine';
import { Felt, Pop, Tile, at, ease, lerp, type SceneData } from './kit';
import { Abs, Label } from './wall';
import { Group } from './sets';
import { Follow, Round, Seat, Table, WindBadges } from './east';
import { Checklist, Fly, Hand, HAND_Y, Note, POND, SeatTag, WallStrip, handX } from './play';

type V = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const b = (v: V) => tileToIndex(suit('bamboo', v));
const c = (v: V) => tileToIndex(suit('character', v));
const d = (v: V) => tileToIndex(suit('dot', v));
const E = tileToIndex(wind('east')), S = tileToIndex(wind('south')), W = tileToIndex(wind('west')), N = tileToIndex(wind('north'));
const RED = tileToIndex(dragon('red')), GREEN = tileToIndex(dragon('green')), WHITE = tileToIndex(dragon('white'));
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as V[];
const CX = 328;

const BONUS = {
  flowers: [['梅', 'Plum'], ['蘭', 'Orchid'], ['菊', 'Chrysanthemum'], ['竹', 'Bamboo']],
  seasons: [['春', 'Spring'], ['夏', 'Summer'], ['秋', 'Autumn'], ['冬', 'Winter']],
  animals: [['猫', 'Cat'], ['鼠', 'Rat'], ['雞', 'Rooster'], ['蜈', 'Centipede']],
} as const;

/** A bonus tile as the board draws it: the character on ivory, with its English name under it. */
function BonusTile({ ch, en, w = 56, showName = true }: { ch: string; en: string; w?: number; showName?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="rounded-[8px] grid place-items-center border border-[#C6AE84]"
        style={{ width: w, height: w * 1.39, backgroundImage: 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)', boxShadow: '0 3px 0 #C6AE84, 0 6px 14px rgba(0,0,0,0.35)' }}>
        <span className="font-bold text-[#b45309] leading-none" style={{ fontSize: w * 0.55 }}>{ch}</span>
      </div>
      {showName && <span className="text-[16px] font-semibold text-[#f2f0ea]/85 whitespace-nowrap">{en}</span>}
    </div>
  );
}

function Rows({ children, top = 90, gap = 34 }: { children: ReactNode; top?: number; gap?: number }) {
  return <div className="absolute inset-x-0 flex flex-col items-center" style={{ top, gap }}>{children}</div>;
}
function Fade({ t, from, children }: { t: number; from: number; children: ReactNode }) {
  const k = ease(t, from, 0.35);
  return <div style={{ opacity: k, transform: `translateY(${(1 - k) * 14}px)` }}>{children}</div>;
}
function Big({ index, w = 120 }: { index: number; w?: number }) {
  return <Tile index={index} w={w} />;
}

/* =================== The three suits =================== */

const Su1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={110} gap={40}>
    {[b, c, d].map((f, i) => (
      <Fade key={i} t={t} from={at(s, 'three') + i * 0.4}><div className="flex gap-1">{NINE.map(v => <Tile key={v} index={f(v)} w={42} />)}</div></Fade>
    ))}
    <Pop t={t} from={at(s, 'nine')}><Label size={36} color="#f2c14e">1 to 9 in each suit</Label></Pop>
  </Rows></Felt>
);
const SuitCard = ({ s, t, tile, word, label }: { s: SceneData; t: number; tile: number; word: string; label: ReactNode }) => (
  <Felt><Rows top={150} gap={36}>
    <Pop t={t} from={at(s, word)}><Big index={tile} /></Pop>
    <Pop t={t} from={at(s, word) + 0.6}><Label size={38}>{label}</Label></Pop>
  </Rows></Felt>
);
const Su2 = ({ s, t }: { s: SceneData; t: number }) => <SuitCard s={s} t={t} tile={b(3)} word="bamboo" label={<>Bamboo: <span className="text-[#3ccf8e]">green sticks</span></>} />;
const Su3 = ({ s, t }: { s: SceneData; t: number }) => <SuitCard s={s} t={t} tile={c(5)} word="character" label={<>Characters: <span className="text-[#ef6b5a]">red number over 萬</span></>} />;
const Su4 = ({ s, t }: { s: SceneData; t: number }) => <SuitCard s={s} t={t} tile={d(7)} word="dot" label={<>Dots: <span className="text-[#8fa6ff]">count the circles</span></>} />;
const Su5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={200} gap={22}>
    <Pop t={t} from={at(s, 'three')}><Label size={54}>3 suits</Label></Pop>
    <Pop t={t} from={at(s, 'nine')}><Label size={54}>× 9 numbers</Label></Pop>
    <Pop t={t} from={at(s, 'four')}><Label size={54} color="#f2c14e">× 4 of each</Label></Pop>
  </Rows></Felt>
);
export const SUITS_SCENES = [Su1, Su2, Su3, Su4, Su5];

/* =================== Winds and dragons =================== */

const Ho1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={130} gap={44}>
    <Fade t={t} from={at(s, 'winds')}><div className="flex gap-2">{[E, S, W, N].map(x => <Tile key={x} index={x} w={74} />)}</div></Fade>
    <Fade t={t} from={at(s, 'dragons')}><div className="flex gap-2">{[RED, GREEN, WHITE].map(x => <Tile key={x} index={x} w={74} />)}</div></Fade>
    <Pop t={t} from={at(s, 'numbers')}><Label size={36} color="#f2c14e">No numbers</Label></Pop>
  </Rows></Felt>
);
const Named = ({ t, from, tile, en, py }: { t: number; from: number; tile: number; en: string; py: string }) => (
  <Fade t={t} from={from}>
    <div className="flex flex-col items-center gap-2">
      <Tile index={tile} w={92} />
      <div className="font-display font-bold text-[26px] text-[#f2f0ea]">{en}</div>
      <div className="font-display font-bold text-[30px] text-[#f2c14e]">{py}</div>
    </div>
  </Fade>
);
const Ho2 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><div className="absolute inset-x-0 top-[170px] flex justify-center gap-5">
    <Named t={t} from={at(s, 'east')} tile={E} en="East" py="dōng" />
    <Named t={t} from={at(s, 'south')} tile={S} en="South" py="nán" />
    <Named t={t} from={at(s, 'west')} tile={W} en="West" py="xī" />
    <Named t={t} from={at(s, 'north')} tile={N} en="North" py="běi" />
  </div></Felt>
);
const Ho3 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><div className="absolute inset-x-0 top-[170px] flex justify-center gap-8">
    <Named t={t} from={at(s, 'red')} tile={RED} en="Red" py="zhōng" />
    <Named t={t} from={at(s, 'green')} tile={GREEN} en="Green" py="fā" />
    <Named t={t} from={at(s, 'white')} tile={WHITE} en="White" py="bái" />
  </div></Felt>
);
const Ho4 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={110} gap={60}>
    <Group tiles={[RED, RED, RED]} from={at(s, 'pung')} t={t} w={76} label="A pung" mark={{ ok: true, at: at(s, 'pung') + 0.6 }} />
    <Group tiles={[E, S, W]} from={at(s, 'never')} t={t} w={76} label="Never a run" mark={{ ok: false, at: at(s, 'run') }} />
  </Rows></Felt>
);
const Ho5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={170} gap={30}>
    <Pop t={t} from={at(s, 'labels')}><Big index={E} w={150} /></Pop>
    <Pop t={t} from={at(s, 'name')}><Label size={34}>Name on top, how to say it below</Label></Pop>
  </Rows></Felt>
);
export const HONOURS_SCENES = [Ho1, Ho2, Ho3, Ho4, Ho5];

/* =================== Flowers and animals =================== */

const Bo1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={50} gap={26}>
    {(['flowers', 'seasons', 'animals'] as const).map(k => (
      <Fade key={k} t={t} from={at(s, k)}>
        <div className="flex gap-3">{BONUS[k].map(([ch, en]) => <BonusTile key={ch} ch={ch} en={en} w={60} />)}</div>
      </Fade>
    ))}
  </Rows></Felt>
);
const Bo2 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><div className="absolute inset-x-0 top-[210px] flex justify-center gap-6">
    {BONUS.animals.map(([ch, en]) => (
      <Fade key={ch} t={t} from={at(s, en.toLowerCase())}><BonusTile ch={ch} en={en} w={96} /></Fade>
    ))}
  </div></Felt>
);
const BHAND = [c(1), c(2), c(3), d(4), d(4), b(5), b(6), b(7), RED, RED, E, N, N];
function Bo3({ s, t }: { s: SceneData; t: number }) {
  const tFace = at(s, 'face');
  const k = ease(t, tFace, 0.7);
  return (
    <Felt>
      <Hand tiles={BHAND} />
      <Abs x={lerp(handX(14, 13), 120, k)} y={lerp(HAND_Y + 28, 470, k)}><BonusTile ch="梅" en="Plum" w={48} showName={k > 0.9} /></Abs>
      <Note t={t} from={tFace} y={360} color="#f2c14e">Face up beside you</Note>
    </Felt>
  );
}
function Bo4({ s, t }: { s: SceneData; t: number }) {
  const tRep = at(s, 'replacement');
  const got = t >= tRep + 0.7;
  return (
    <Felt>
      <WallStrip glowLast={!got} />
      <Abs x={120} y={470}><BonusTile ch="梅" en="Plum" w={48} /></Abs>
      <Hand tiles={got ? [...BHAND, d(9)] : BHAND} glow={got ? [13] : []} />
      {!got && <Fly tile={d(9)} a={{ x: CX + 4 * 38, y: 120 }} b={{ x: handX(14, 13), y: HAND_Y + 28 }} t={t} from={tRep} len={0.7} back />}
      <Note t={t} from={at(s, 'back')} y={230} color="#f2c14e">Replacement from the back</Note>
    </Felt>
  );
}
const Bo5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={190} gap={30}>
    <div className="flex gap-3">{[BONUS.flowers[0], BONUS.seasons[1], BONUS.animals[0]].map(([ch, en]) => <BonusTile key={ch} ch={ch} en={en} w={80} />)}</div>
    <Pop t={t} from={at(s, 'tai')}><Label size={48} color="#f2c14e">+1 tai each</Label></Pop>
  </Rows></Felt>
);
export const BONUS_SCENES = [Bo1, Bo2, Bo3, Bo4, Bo5];

/* =================== Your seat wind =================== */

const Se1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt>
    <Table />{[0, 1, 2, 3].map(i => <Seat key={i} i={i} glow={i === 0 ? ease(t, at(s, 'east'), 0.4) : 0} />)}
    {t >= at(s, 'east') && <WindBadges eastAt={0} show={1} k={ease(t, at(s, 'east'), 0.4)} />}
    <Note t={t} from={at(s, 'wind')} y={36}>Every seat has a wind</Note>
  </Felt>
);
const Se3 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt>
    <Table />{[0, 1, 2, 3].map(i => <Seat key={i} i={i} glow={i === 0 ? 1 : 0} />)}
    <WindBadges eastAt={0} show={4} />
    <Note t={t} from={at(s, 'first')} y={36} color="#f2c14e">East plays first</Note>
  </Felt>
);
const Se4 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={160} gap={30}>
    <Pop t={t} from={at(s, 'seat')}><Label size={36}>You sit South</Label></Pop>
    <Group tiles={[S, S, S]} from={at(s, 'pung')} t={t} w={90} />
    <Pop t={t} from={at(s, 'tai')}><Label size={46} color="#f2c14e">Your own wind: +1 tai</Label></Pop>
  </Rows></Felt>
);
const Se5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Checklist t={t} items={[
    { from: at(s, 'east'), text: 'East deals and starts' },
    { from: at(s, 'winds'), text: 'Winds go to the right' },
  ]} /></Felt>
);
export const SEATS_SCENES = [Se1, Follow, Se3, Se4, Se5];

/* =================== The round wind =================== */

function RoundBox({ tile, label }: { tile: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[24px] font-semibold text-[#9aa0a6]">Round wind</div>
      <Tile index={tile} w={110} />
      <Label size={40}>{label}</Label>
    </div>
  );
}
const Ro1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={180}><Pop t={t} from={at(s, 'east')}><RoundBox tile={E} label="East round" /></Pop></Rows></Felt>
);
const Ro2 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={190} gap={40}>
    <Pop t={t} from={at(s, 'stays')}><Label size={40}>Win or draw: <span className="text-[#f2c14e]">dealer stays</span></Label></Pop>
    <Pop t={t} from={at(s, 'passes')}><Label size={40}>Someone else wins: <span className="text-[#f2c14e]">passes right</span></Label></Pop>
  </Rows></Felt>
);
const Ro4 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={170} gap={30}>
    <Group tiles={[S, S, S]} from={at(s, 'pung')} t={t} w={90} />
    <Pop t={t} from={at(s, 'tai')}><Label size={44} color="#f2c14e">+1 tai, for anyone</Label></Pop>
  </Rows></Felt>
);
const Ro5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Checklist t={t} items={[
    { from: at(s, 'seat'), text: 'Seat wind: yours' },
    { from: at(s, 'round'), text: 'Round wind: everyone’s' },
  ]} /></Felt>
);
export const ROUND_SCENES = [Ro1, Ro2, Round, Ro4, Ro5];

/* =================== What tai means =================== */

const Ta1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={230} gap={20}>
    <Pop t={t} from={at(s, 'tai')}><Label size={70} color="#f2c14e">Tai</Label></Pop>
    <Pop t={t} from={at(s, 'points')}><Label size={38}>points for what’s in your hand</Label></Pop>
  </Rows></Felt>
);
const Ta2 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={120} gap={56}>
    <Group tiles={[RED, RED, RED]} from={at(s, 'pung')} t={t} w={70} label={<span className="text-[#f2c14e]">1 tai</span>} />
    <Fade t={t} from={at(s, 'flower')}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-3"><BonusTile ch="梅" en="Plum" w={60} /><BonusTile ch="猫" en="Cat" w={60} /></div>
        <Label size={28}><span className="text-[#f2c14e]">1 tai each</span></Label>
      </div>
    </Fade>
  </Rows></Felt>
);
const Ta3 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={210} gap={40}>
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map(n => (
        <Fade key={n} t={t} from={0.1 + n * 0.1}>
          <div className="w-20 h-20 rounded-2xl grid place-items-center font-display font-bold text-[40px]"
            style={{ background: (n === 1 && t >= at(s, 'least')) || (n === 5 && t >= at(s, 'five')) ? '#f2c14e' : 'rgba(255,255,255,0.1)', color: (n === 1 && t >= at(s, 'least')) || (n === 5 && t >= at(s, 'five')) ? '#16181b' : '#f2f0ea' }}>{n}</div>
        </Fade>
      ))}
    </div>
    <div className="flex gap-16">
      <Pop t={t} from={at(s, 'least')}><Label size={30}>At least 1 to win</Label></Pop>
      <Pop t={t} from={at(s, 'five')}><Label size={30}>Most stop at 5</Label></Pop>
    </div>
  </Rows></Felt>
);
const Ta4 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={230} gap={20}>
    <Pop t={t} from={at(s, 'hand')}><Label size={50}>The <span className="text-[#3ccf8e]">Hand</span> tab</Label></Pop>
    <Pop t={t} from={at(s, 'adds')}><Label size={36}>adds up the tai for you</Label></Pop>
  </Rows></Felt>
);
const Ta5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={270}><Pop t={t} from={at(s, 'more')}><Label size={56}>More tai, <span className="text-[#f2c14e]">bigger win</span></Label></Pop></Rows></Felt>
);
export const TAI_SCENES = [Ta1, Ta2, Ta3, Ta4, Ta5];

/* =================== Each tai doubles =================== */

function Bars({ show, highlight = [] as number[] }: { show: number[]; highlight?: number[] }) {
  const pts = [2, 4, 8, 16, 32];
  return (
    <div className="absolute left-[60px] right-[60px] bottom-[70px] flex items-end justify-between" style={{ height: 520 }}>
      {pts.map((p, i) => {
        const k = show[i] ?? 0;
        return (
          <div key={i} className="flex flex-col items-center gap-2" style={{ width: 92, opacity: k > 0 ? 1 : 0 }}>
            <div className="font-display font-bold text-[30px]" style={{ color: highlight.includes(i) ? '#f2c14e' : '#f2f0ea' }}>{p}</div>
            <div className="w-full rounded-t-xl" style={{ height: (p / 32) * 400 * k + 6, background: highlight.includes(i) ? '#f2c14e' : '#3ccf8e' }} />
            <div className="text-[22px] font-semibold text-[#9aa0a6]">{i + 1} tai</div>
          </div>
        );
      })}
    </div>
  );
}
const Do1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={250}><Pop t={t} from={at(s, 'doubles')}><Label size={64}>Each tai <span className="text-[#f2c14e]">× 2</span></Label></Pop></Rows></Felt>
);
const Do2 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Bars show={[ease(t, at(s, 'one'), 0.5), ease(t, at(s, 'two'), 0.5), ease(t, at(s, 'three'), 0.5)]} /></Felt>
);
const Do3 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Bars show={[1, 1, 1, ease(t, at(s, 'four'), 0.5), ease(t, at(s, 'five'), 0.5)]} /></Felt>
);
const Do4 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt>
    <Bars show={[1, 1, 1, 1, 1]} highlight={t >= at(s, 'three') ? [0, 2] : []} />
    <Note t={t} from={at(s, 'four')} y={60} color="#f2c14e">3 tai = 4 × 1 tai</Note>
  </Felt>
);
const Do5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={270}><Pop t={t} from={at(s, 'small')}><Label size={56}>Small steps, <span className="text-[#f2c14e]">big jumps</span></Label></Pop></Rows></Felt>
);
export const DOUBLING_SCENES = [Do1, Do2, Do3, Do4, Do5];

/* =================== Who pays =================== */

const WIN = [c(1), c(2), c(3), d(6), d(6), d(6), b(4), b(5), b(6), N, N, N, RED, RED];
const tag = (text: string, gold = false) => <span className={`text-[26px] font-bold ${gold ? 'text-[#f2c14e]' : 'text-[#f2f0ea]'}`}>{text}</span>;

function Wp1({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <SeatTag k="right" glow={1} note={<Pop t={t} from={at(s, 'shooter')}>{tag('shooter', true)}</Pop>} />
      <SeatTag k="across" /><SeatTag k="left" />
      <Fly tile={RED} a={{ x: 560, y: 300 }} b={POND} t={t} from={0.2} w={56} />
      <Hand tiles={WIN.slice(0, 13)} />
    </Felt>
  );
}
function Wp2({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <SeatTag k="right" glow={1} note={<Pop t={t} from={at(s, 'double')}>{tag('pays ×2', true)}</Pop>} />
      <SeatTag k="across" note={<Pop t={t} from={at(s, 'single')}>{tag('pays ×1')}</Pop>} />
      <SeatTag k="left" note={<Pop t={t} from={at(s, 'single')}>{tag('pays ×1')}</Pop>} />
      <Hand tiles={WIN} />
    </Felt>
  );
}
function Wp3({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      {(['left', 'across', 'right'] as const).map(k => <SeatTag key={k} k={k} glow={ease(t, at(s, 'all'), 0.3)} note={<Pop t={t} from={at(s, 'all')}>{tag('pays ×2', true)}</Pop>} />)}
      <Hand tiles={WIN} glow={[13]} />
      <Note t={t} from={at(s, 'drew')} y={420} color="#f2c14e">Self-drawn</Note>
    </Felt>
  );
}
function Wp4({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <Note t={t} from={at(s, 'worth')} y={160}>Your win: 2 points</Note>
      <SeatTag k="right" glow={1} note={<Pop t={t} from={at(s, 'four')}>{tag('pays 4', true)}</Pop>} />
      <SeatTag k="across" note={<Pop t={t} from={at(s, 'two', 1)}>{tag('pays 2')}</Pop>} />
      <SeatTag k="left" note={<Pop t={t} from={at(s, 'two', 1)}>{tag('pays 2')}</Pop>} />
      <Hand tiles={WIN} />
    </Felt>
  );
}
const Wp5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={250} gap={20}>
    <Pop t={t} from={at(s, 'throw')}><Label size={56}>Throw carefully</Label></Pop>
    <Pop t={t} from={at(s, 'careless')}><Label size={36} color="#f2c14e">A careless throw costs double</Label></Pop>
  </Rows></Felt>
);
export const WHO_PAYS_SCENES = [Wp1, Wp2, Wp3, Wp4, Wp5];

/* =================== Tai worth knowing =================== */

const Ct1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={260}><Pop t={t} from={at(s, 'one')}><Label size={60}><span className="text-[#f2c14e]">1 tai</span> each</Label></Pop></Rows></Felt>
);
function Line({ t, from, children, label }: { t: number; from: number; children: ReactNode; label: string }) {
  return (
    <Fade t={t} from={from}>
      <div className="flex items-center gap-5 w-[560px]">
        <div className="flex gap-1 w-[230px] justify-end">{children}</div>
        <span className="font-display font-bold text-[28px] text-[#f2f0ea]">{label}</span>
      </div>
    </Fade>
  );
}
const Ct2 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={70} gap={34}>
    <Line t={t} from={at(s, 'dragon')} label="Dragon pung">{[RED, RED, RED].map((x, i) => <Tile key={i} index={x} w={46} />)}</Line>
    <Line t={t} from={at(s, 'seat')} label="Seat or round wind pung">{[E, E, E].map((x, i) => <Tile key={i} index={x} w={46} />)}</Line>
    <Line t={t} from={at(s, 'flower')} label="Each flower or animal"><BonusTile ch="梅" en="" w={46} showName={false} /><BonusTile ch="猫" en="" w={46} showName={false} /></Line>
    <Line t={t} from={at(s, 'chows')} label="Only chows">{[c(1), c(2), c(3)].map((x, i) => <Tile key={i} index={x} w={46} />)}</Line>
  </Rows></Felt>
);
const Ct3 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={90} gap={50}>
    <Line t={t} from={at(s, 'pungs')} label="All pungs: 2 tai">{[d(6), d(6), d(6)].map((x, i) => <Tile key={i} index={x} w={46} />)}</Line>
    <Line t={t} from={at(s, 'half')} label="Half flush: 2 tai">{[b(2), b(3), b(4), N].map((x, i) => <Tile key={i} index={x} w={46} />)}</Line>
  </Rows></Felt>
);
const Ct4 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={170} gap={30}>
    <Fade t={t} from={at(s, 'full')}><div className="flex gap-1">{NINE.map(v => <Tile key={v} index={b(v)} w={56} />)}</div></Fade>
    <Pop t={t} from={at(s, 'four')}><Label size={50}>Full flush: <span className="text-[#f2c14e]">4 tai</span></Label></Pop>
  </Rows></Felt>
);
const Ct5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Rows top={250} gap={20}>
    <Pop t={t} from={at(s, 'worry')}><Label size={46}>No need to memorise</Label></Pop>
    <Pop t={t} from={at(s, 'app')}><Label size={34} color="#f2c14e">Every win lists each tai</Label></Pop>
  </Rows></Felt>
);
export const COMMON_TAI_SCENES = [Ct1, Ct2, Ct3, Ct4, Ct5];
