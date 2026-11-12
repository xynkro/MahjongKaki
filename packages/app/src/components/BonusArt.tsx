// Picture faces for the four animal bonus tiles, drawn for this app in the ink-and-colour style
// of a real tile (no copied tile sets). 60 × 84 viewBox, the same as TileFace.
import type { AnimalName, FlowerName, SeasonName } from '@mahjongkaki/engine';

const INK = '#2c2820';
const RED = '#b5392a';
const GREEN = '#1d6b46';
const BLUE = '#36468a';
const S = { stroke: INK, strokeWidth: 1.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export function AnimalArt({ animal, className = 'w-full h-full' }: { animal: AnimalName; className?: string }) {
  return (
    <svg viewBox="0 0 60 84" className={className} aria-label={animal} role="img">
      {animal === 'cat' && <Cat />}
      {animal === 'rat' && <Rat />}
      {animal === 'rooster' && <Rooster />}
      {animal === 'centipede' && <Centipede />}
    </svg>
  );
}

/** A tabby cat sitting, tail curled round its feet. */
function Cat() {
  return (
    <g>
      {/* tail, outline then fill */}
      <path d="M40 68 C52 66 54 77 43 78 C37 78.5 32 77 27 75" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M40 68 C52 66 54 77 43 78 C37 78.5 32 77 27 75" fill="none" stroke="#eab765" strokeWidth={3.4} strokeLinecap="round" />
      {/* body */}
      <path d="M23 38 C13 45 12 62 17 72 C22 75 38 75 43 72 C47 62 45 46 37 38 Z" fill="#eab765" {...S} />
      {/* stripes */}
      <path d="M16 54 q4 1 6 -2 M15 62 q4 1 6 -2 M44 54 q-4 1 -6 -2 M45 62 q-4 1 -6 -2" fill="none" stroke={RED} strokeWidth={1.6} strokeLinecap="round" />
      {/* chest and front legs */}
      <path d="M25 48 C27 56 26 64 25 73 M35 48 C33 56 34 64 35 73" fill="none" {...S} />
      <path d="M22 73 q3 -2 6 0 M32 73 q3 -2 6 0" fill="none" {...S} />
      {/* ears */}
      <path d="M20.5 25 L21 12.5 L28 19 Z M39.5 25 L39 12.5 L32 19 Z" fill="#eab765" {...S} />
      <path d="M22.3 21 L22.6 16 L25.6 19 Z M37.7 21 L37.4 16 L34.4 19 Z" fill="#e7a0a0" />
      {/* head */}
      <ellipse cx={30} cy={28} rx={11} ry={10} fill="#eab765" {...S} />
      <path d="M26 19.5 q4 3 8 0 M30 18.5 v4" fill="none" stroke={RED} strokeWidth={1.4} strokeLinecap="round" />
      {/* eyes, nose, mouth */}
      <ellipse cx={25.5} cy={27} rx={2.4} ry={2.8} fill={GREEN} stroke={INK} strokeWidth={1} />
      <ellipse cx={34.5} cy={27} rx={2.4} ry={2.8} fill={GREEN} stroke={INK} strokeWidth={1} />
      <ellipse cx={25.5} cy={27} rx={0.8} ry={2} fill={INK} />
      <ellipse cx={34.5} cy={27} rx={0.8} ry={2} fill={INK} />
      <path d="M28.6 31 L31.4 31 L30 32.8 Z" fill={RED} />
      <path d="M30 32.8 q-1.6 2.2 -3.4 1.2 M30 32.8 q1.6 2.2 3.4 1.2" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
      {/* whiskers */}
      <path d="M23 32 L13 30 M23 33.5 L13.5 35 M37 32 L47 30 M37 33.5 L46.5 35" stroke={INK} strokeWidth={0.8} strokeLinecap="round" />
    </g>
  );
}

/** A grey rat side on, long tail curling under it. */
function Rat() {
  return (
    <g>
      {/* tail */}
      <path d="M46 50 C56 52 57 64 48 67 C40 70 38 76 46 78" fill="none" stroke="#c98b8b" strokeWidth={2.2} strokeLinecap="round" />
      {/* body and head as one shape, nose to the left */}
      <path d="M7 44 C9 40 13 37 18 36 C25 29 40 30 47 39 C51 45 49 52 43 54 L20 54 C14 53 10 49 7 44 Z" fill="#b8bfcd" {...S} />
      {/* belly */}
      <path d="M22 54 C26 50 36 50 42 54" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
      {/* back fur marks */}
      <path d="M30 34 q2 2 4 0 M37 35 q2 2 4 0" fill="none" stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
      {/* ear */}
      <circle cx={20} cy={34} r={5} fill="#e7a0a0" {...S} />
      <circle cx={20.4} cy={34.4} r={2.4} fill="#d97f7f" />
      {/* eye and nose */}
      <circle cx={14.5} cy={40.5} r={1.5} fill={INK} />
      <circle cx={7.4} cy={44} r={1.4} fill={RED} />
      {/* whiskers */}
      <path d="M10 43 L3 40 M10 45 L3 46.5 M11 46 L5 50" stroke={INK} strokeWidth={0.8} strokeLinecap="round" />
      {/* feet */}
      <path d="M21 54 l-2.5 4 M27 54 l1 4 M38 54 l-2 4 M43 53.5 l1.5 4" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      {/* a grain of rice in its paws, for luck */}
      <ellipse cx={12} cy={53} rx={3.2} ry={2} fill="#f2c14e" stroke={INK} strokeWidth={1} transform="rotate(-20 12 53)" />
    </g>
  );
}

/** A rooster standing, tail feathers sweeping up behind. */
function Rooster() {
  const feather = (d: string, c: string) => (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={4.6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
    </>
  );
  return (
    <g>
      {/* tail */}
      {feather('M40 48 C44 34 52 26 50 14', GREEN)}
      {feather('M42 50 C50 40 57 36 56 24', BLUE)}
      {feather('M43 53 C52 50 58 52 57 42', GREEN)}
      {feather('M42 55 C50 58 55 62 54 54', RED)}
      {/* legs */}
      <path d="M27 60 L25 72 M34 60 L35 72" stroke="#c98a2b" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M25 72 l-4 2 M25 72 l0 3 M25 72 l3 2 M35 72 l-4 2 M35 72 l0 3 M35 72 l3 2" stroke="#c98a2b" strokeWidth={1.4} strokeLinecap="round" />
      {/* body */}
      <path d="M17 26 C13 36 14 50 22 57 C30 63 42 60 45 51 C42 46 36 44 31 43 C26 41 24 35 24 27 Z" fill="#ecc673" {...S} />
      {/* neck feathers */}
      <path d="M17 32 q3 4 7 2 M16.5 38 q3.5 4 8 2 M18 44 q3.5 3 8 1" fill="none" stroke={RED} strokeWidth={1.6} strokeLinecap="round" />
      {/* wing */}
      <path d="M26 47 C30 56 40 57 43 51 C38 52 32 50 26 47 Z" fill={RED} {...S} />
      {/* head */}
      <circle cx={20} cy={23} r={6} fill="#ecc673" {...S} />
      {/* comb */}
      <path d="M15.5 19 C15 14 18.5 13.5 19 17 C19 12 23 12 22.8 17 C24 13.5 27 15 25 19.5 Z" fill={RED} {...S} />
      {/* beak */}
      <path d="M14.5 21.5 L9 24 L14.5 25.5 Z" fill="#e0a52f" {...S} />
      {/* wattle */}
      <path d="M15 26 C14 30 16.5 32 18 29.5 C18.5 28 17.5 26.5 15 26 Z" fill={RED} stroke={INK} strokeWidth={1} />
      <circle cx={19} cy={22} r={1.3} fill={INK} />
    </g>
  );
}

/** A centipede winding down the tile, legs out each side. */
function Centipede() {
  const n = 13;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { x: 30 + 11 * Math.sin(t * Math.PI * 2), y: 18 + 56 * t, a: Math.atan2(56, 11 * Math.PI * 2 * Math.cos(t * Math.PI * 2)) };
  });
  return (
    <g>
      {/* legs: short strokes square to the body */}
      {pts.slice(1).map((p, i) => {
        const nx = Math.cos(p.a + Math.PI / 2), ny = Math.sin(p.a + Math.PI / 2);
        return (
          <path key={i} d={`M${p.x - nx * 3} ${p.y - ny * 3} L${p.x - nx * 8.5} ${p.y - ny * 8.5 + 1.5} M${p.x + nx * 3} ${p.y + ny * 3} L${p.x + nx * 8.5} ${p.y + ny * 8.5 + 1.5}`}
            stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
        );
      })}
      {/* body segments, tail first so the head sits on top */}
      {[...pts].reverse().map((p, j) => {
        const i = n - 1 - j;
        if (i === 0) return null;
        return <circle key={i} cx={p.x} cy={p.y} r={i === n - 1 ? 2.8 : 3.8} fill={i % 2 ? RED : '#d9853b'} stroke={INK} strokeWidth={1.1} />;
      })}
      {/* head, feelers and pincers */}
      <path d={`M${pts[0].x - 2} ${pts[0].y - 3} C${pts[0].x - 6} ${pts[0].y - 9} ${pts[0].x - 10} ${pts[0].y - 10} ${pts[0].x - 13} ${pts[0].y - 8}`} fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
      <path d={`M${pts[0].x + 2} ${pts[0].y - 3} C${pts[0].x + 6} ${pts[0].y - 9} ${pts[0].x + 10} ${pts[0].y - 10} ${pts[0].x + 13} ${pts[0].y - 8}`} fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
      <circle cx={pts[0].x} cy={pts[0].y} r={4.6} fill={GREEN} stroke={INK} strokeWidth={1.2} />
      <circle cx={pts[0].x - 1.7} cy={pts[0].y - 1} r={0.9} fill="#fbf7ec" />
      <circle cx={pts[0].x + 1.7} cy={pts[0].y - 1} r={0.9} fill="#fbf7ec" />
    </g>
  );
}

/* =================== Flowers and seasons =================== */
// Singapore sets: two sets of four, numbered 1-4 to match the seats (1 East … 4 North).
// Seasons 春夏秋冬 are marked in red, number on the left; the flowers 梅蘭菊竹 in blue, number on the right.


const PINK = '#f3b5b0';
const LEAF = '#3f8f4f';

export const FLOWER_NO: Record<FlowerName, number> = { plum: 1, orchid: 2, chrysanthemum: 3, bamboo_flower: 4 };
export const SEASON_NO: Record<SeasonName, number> = { spring: 1, summer: 2, autumn: 3, winter: 4 };
const FLOWER_CH: Record<FlowerName, string> = { plum: '梅', orchid: '蘭', chrysanthemum: '菊', bamboo_flower: '竹' };
const SEASON_CH: Record<SeasonName, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

type Bonus = { kind: 'flower'; name: FlowerName } | { kind: 'season'; name: SeasonName };

export function FlowerArt({ tile, className = 'w-full h-full' }: { tile: Bonus; className?: string }) {
  const season = tile.kind === 'season';
  const no = season ? SEASON_NO[tile.name as SeasonName] : FLOWER_NO[tile.name as FlowerName];
  const ch = season ? SEASON_CH[tile.name as SeasonName] : FLOWER_CH[tile.name as FlowerName];
  const ink = season ? RED : BLUE;
  return (
    <svg viewBox="0 0 60 84" className={className} aria-label={`${tile.name} ${no}`} role="img">
      <text x={season ? 6 : 54} y={20} textAnchor={season ? 'start' : 'end'} fontSize={17} fontWeight={700} fill={ink} fontFamily="'Times New Roman', Times, serif" style={{ fontVariantNumeric: 'lining-nums' }}>{no}</text>
      <text x={season ? 54 : 6} y={19} textAnchor={season ? 'end' : 'start'} fontSize={14} fontWeight={700} fill={ink} fontFamily="'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', serif">{ch}</text>
      <g transform="translate(0 2)">
        {tile.kind === 'season' && tile.name === 'spring' && <Spring />}
        {tile.kind === 'season' && tile.name === 'summer' && <Summer />}
        {tile.kind === 'season' && tile.name === 'autumn' && <Autumn />}
        {tile.kind === 'season' && tile.name === 'winter' && <Winter />}
        {tile.kind === 'flower' && tile.name === 'plum' && <Plum />}
        {tile.kind === 'flower' && tile.name === 'orchid' && <Orchid />}
        {tile.kind === 'flower' && tile.name === 'chrysanthemum' && <Chrysanthemum />}
        {tile.kind === 'flower' && tile.name === 'bamboo_flower' && <Bamboo />}
      </g>
    </svg>
  );
}

/** Five round petals round a gold centre. */
function Blossom({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map(i => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return <circle key={i} cx={x + Math.cos(a) * r * 0.62} cy={y + Math.sin(a) * r * 0.62} r={r * 0.5} fill={PINK} stroke={RED} strokeWidth={1.1} />;
      })}
      <circle cx={x} cy={y} r={r * 0.3} fill="#f2c14e" stroke={RED} strokeWidth={0.9} />
    </g>
  );
}
function Leaf({ x, y, a, l = 9 }: { x: number; y: number; a: number; l?: number }) {
  return <path d={`M0 0 C${l * 0.3} ${-l * 0.32} ${l * 0.75} ${-l * 0.3} ${l} 0 C${l * 0.75} ${l * 0.3} ${l * 0.3} ${l * 0.32} 0 0 Z`} transform={`translate(${x} ${y}) rotate(${a})`} fill={LEAF} stroke={GREEN} strokeWidth={0.8} />;
}
const stem = { fill: 'none', stroke: GREEN, strokeWidth: 1.4, strokeLinecap: 'round' as const };
const root = { fill: 'none', stroke: BLUE, strokeWidth: 1.4, strokeLinecap: 'round' as const };

function Spring() {
  return (
    <g>
      <path d="M30 76 C29 66 31 58 30 48 M30 62 C24 58 20 52 19 46 M30 56 C36 50 41 46 43 38" {...stem} />
      <path d="M30 76 l-4 3 M30 76 l4 3 M30 76 v3" {...root} />
      <Leaf x={30} y={66} a={200} /><Leaf x={30} y={60} a={-25} /><Leaf x={22} y={52} a={230} l={7} />
      <Blossom x={30} y={44} r={9} />
      <Blossom x={43} y={35} r={5.5} />
      <circle cx={19} cy={44} r={2.6} fill={PINK} stroke={RED} strokeWidth={1} />
    </g>
  );
}
function Summer() {
  // lotus: layered pointed petals over blue stems
  const petal = (a: number, l: number) => <path d={`M0 0 C${-l * 0.35} ${-l * 0.5} ${-l * 0.2} ${-l * 0.9} 0 ${-l} C${l * 0.2} ${-l * 0.9} ${l * 0.35} ${-l * 0.5} 0 0 Z`} transform={`translate(30 52) rotate(${a})`} fill={PINK} stroke={RED} strokeWidth={1.1} />;
  return (
    <g>
      <path d="M30 54 C30 62 29 68 30 76 M30 66 C24 66 18 62 16 58 M30 66 C36 66 42 62 44 58" {...root} />
      <Leaf x={16} y={58} a={200} l={10} /><Leaf x={44} y={58} a={-20} l={10} />
      {petal(-55, 16)}{petal(55, 16)}{petal(-28, 19)}{petal(28, 19)}{petal(0, 21)}
      <ellipse cx={30} cy={51} rx={5} ry={2.4} fill="#f2c14e" stroke={RED} strokeWidth={0.9} />
    </g>
  );
}
function Autumn() {
  // a round pomegranate-like bloom, cross-hatched, with leaves
  return (
    <g>
      <path d="M30 76 C30 70 29 64 30 58 M30 70 C24 70 20 66 18 62 M30 66 C36 64 40 60 42 56" {...stem} />
      <path d="M30 76 l-4 3 M30 76 l4 3" {...root} />
      <Leaf x={18} y={62} a={210} /><Leaf x={42} y={56} a={-30} /><Leaf x={30} y={62} a={150} l={7} />
      <circle cx={30} cy={45} r={11} fill={PINK} stroke={RED} strokeWidth={1.2} />
      <path d="M22 41 L38 41 M20 46 L40 46 M22 51 L38 51 M26 35 L26 55 M31 34 L31 56 M36 36 L36 54" stroke={RED} strokeWidth={0.8} />
      <path d="M25 34 l2 -4 l3 3 l3 -3 l2 4" fill={LEAF} stroke={GREEN} strokeWidth={0.9} strokeLinejoin="round" />
    </g>
  );
}
function Winter() {
  return (
    <g>
      <path d="M30 76 C30 68 30 62 30 56 M30 68 C22 66 18 60 17 54 M30 64 C38 62 42 56 43 50" {...stem} />
      <path d="M30 76 l-4 3 M30 76 l4 3 M30 76 v3" {...root} />
      <Leaf x={17} y={54} a={230} l={10} /><Leaf x={43} y={50} a={-50} l={10} /><Leaf x={30} y={60} a={20} l={8} /><Leaf x={30} y={64} a={160} l={8} />
      <Blossom x={30} y={45} r={11} />
    </g>
  );
}
function Plum() {
  // a gnarled branch with two blossoms and buds
  return (
    <g>
      <path d="M22 78 C24 70 28 66 30 58 C32 50 30 42 33 34 M30 58 C36 56 40 52 44 48 M31 46 C26 44 22 40 20 36" fill="none" stroke="#6b4a2b" strokeWidth={2} strokeLinecap="round" />
      <Leaf x={33} y={64} a={-20} l={8} /><Leaf x={28} y={52} a={200} l={7} />
      <Blossom x={30} y={50} r={8.5} />
      <Blossom x={44} y={45} r={5.5} />
      <circle cx={33.5} cy={33} r={2.6} fill={PINK} stroke={RED} strokeWidth={1} />
      <circle cx={19.5} cy={35} r={2.4} fill={PINK} stroke={RED} strokeWidth={1} />
    </g>
  );
}
function Orchid() {
  // long arching blades from a blue root, two small red buds
  return (
    <g>
      <path d="M30 76 C26 60 18 48 14 36" fill="none" stroke={LEAF} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M30 76 C30 60 32 46 38 30" fill="none" stroke={LEAF} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M30 76 C34 64 42 56 48 52" fill="none" stroke={LEAF} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M30 76 C27 66 26 58 26 48" fill="none" stroke={LEAF} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M30 76 C22 68 16 66 12 64" fill="none" stroke={LEAF} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M30 76 l-4 3 M30 76 l4 3 M30 76 v3" {...root} />
      <path d="M22 62 C20 58 18 56 15 55" {...stem} /><path d="M38 64 C41 60 44 58 46 58" {...stem} />
      <circle cx={14} cy={54} r={3.4} fill={PINK} stroke={RED} strokeWidth={1.1} />
      <circle cx={47} cy={57} r={3.4} fill={PINK} stroke={RED} strokeWidth={1.1} />
    </g>
  );
}
function Chrysanthemum() {
  return (
    <g>
      <path d="M30 76 C30 70 29 64 30 56 M30 70 C23 69 19 65 17 60 M30 64 C37 62 41 58 43 54" {...stem} />
      <path d="M30 76 l-4 3 M30 76 l4 3" {...root} />
      <Leaf x={17} y={60} a={210} l={10} /><Leaf x={43} y={54} a={-35} l={10} /><Leaf x={30} y={66} a={160} l={8} />
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse key={i} cx={30} cy={37.5} rx={2.2} ry={6.5} transform={`rotate(${i * 22.5} 30 44)`} fill={PINK} stroke={RED} strokeWidth={0.9} />
      ))}
      <circle cx={30} cy={44} r={4.5} fill="#f2c14e" stroke={RED} strokeWidth={1} />
    </g>
  );
}
function Bamboo() {
  return (
    <g>
      {/* stalk */}
      <path d="M36 78 L36 26" stroke={GREEN} strokeWidth={4.4} strokeLinecap="round" />
      <path d="M36 78 L36 26" stroke="#7fbf86" strokeWidth={2} strokeLinecap="round" />
      <path d="M33.5 40 h5 M33.5 54 h5 M33.5 68 h5" stroke={GREEN} strokeWidth={1.4} strokeLinecap="round" />
      {/* leaves */}
      <Leaf x={36} y={40} a={-35} l={12} /><Leaf x={36} y={54} a={200} l={13} /><Leaf x={36} y={54} a={170} l={11} />
      <Leaf x={36} y={30} a={-70} l={9} />
      {/* small blooms on a side sprig */}
      <path d="M22 76 C22 68 20 62 18 56" {...stem} />
      <path d="M22 76 l-3 3 M22 76 l3 3" {...root} />
      <Leaf x={21} y={66} a={200} l={7} />
      <circle cx={18} cy={54} r={3} fill={PINK} stroke={RED} strokeWidth={1} />
      <circle cx={23} cy={60} r={2.2} fill={PINK} stroke={RED} strokeWidth={0.9} />
    </g>
  );
}
