import { type ReactNode } from 'react';
import { indexToTile } from '@mahjongkaki/engine';
import { useDisplay } from '../../lib/display';

// Original mahjong tile faces (no copied tile sets):
//  索 bamboo  → jade green sticks
//  萬 character → vermilion numeral + 萬
//  筒 dot     → indigo concentric circles
//  winds 東南西北 · dragons 中(red) 發(green) 白(blank framed)

const INK = {
  bamboo: '#1d6b46',
  character: '#b5392a',
  dot: '#36468a',
} as const;

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

// pip/stick centres in a 60 × 84 viewBox
const LAYOUTS: Record<number, [number, number][]> = {
  1: [[30, 42]],
  2: [[30, 24], [30, 60]],
  3: [[18, 22], [30, 42], [42, 62]],
  4: [[20, 26], [40, 26], [20, 58], [40, 58]],
  5: [[20, 24], [40, 24], [30, 42], [20, 60], [40, 60]],
  6: [[20, 20], [40, 20], [20, 42], [40, 42], [20, 64], [40, 64]],
  7: [[30, 15], [20, 34], [40, 34], [20, 50], [40, 50], [20, 66], [40, 66]],
  8: [[20, 17], [40, 17], [20, 33], [40, 33], [20, 50], [40, 50], [20, 66], [40, 66]],
  9: [[16, 22], [30, 22], [44, 22], [16, 42], [30, 42], [44, 42], [16, 62], [30, 62], [44, 62]],
};

interface FaceProps {
  index: number;
  size?: 'sm' | 'md' | 'lg';
  /** Corner number on suit tiles: undefined follows the beginner setting, false hides it, true forces it (reading quizzes). */
  tag?: boolean;
}

export function TileFace({ index, size = 'md', tag: tagOverride }: FaceProps) {
  const { tileMode } = useDisplay();
  const t = indexToTile(index);

  let face: ReactNode;
  if (t.kind === 'suit' && t.suit === 'dot') face = <DotFace value={t.value} />;
  else if (t.kind === 'suit' && t.suit === 'bamboo') face = <BambooFace value={t.value} />;
  else if (t.kind === 'suit') face = <CharacterFace value={t.value} size={size} />;
  else if (t.kind === 'wind') face = <HonorFace char={{ east: '東', south: '南', west: '西', north: '北' }[t.wind]} color="#2c2820" size={size} />;
  else if (t.dragon === 'red') face = <HonorFace char="中" color="#b5392a" size={size} />;
  else if (t.dragon === 'green') face = <HonorFace char="發" color="#1d6b46" size={size} />;
  else face = <WhiteDragonFace />;

  if (tileMode !== 'beginner' && tagOverride !== true) return <>{face}</>;

  // Beginner mode, winds and dragons: the English name on top and the pinyin underneath,
  // so a new player can both read the tile and say it. Small tiles only fit the English.
  const honour = honourName(t);
  if (honour) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-between leading-none" style={{ color: honour.color }}>
        <span className={`font-extrabold ${size === 'sm' ? 'text-[8.5px] mt-[2px]' : size === 'lg' ? 'text-[12px] mt-[4px]' : 'text-[10px] mt-[3px]'}`}>{honour.en}</span>
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          {honour.char
            ? <span className={`font-bold ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-[38px]' : 'text-[28px]'}`} style={{ textShadow: '0 1px 0.5px rgba(255,255,255,0.55)' }}>{honour.char}</span>
            : <div className="w-3/4 h-full"><WhiteDragonFace /></div>}
        </div>
        {size !== 'sm' && <span className={`italic font-semibold opacity-80 ${size === 'lg' ? 'text-[12px] mb-[4px]' : 'text-[10px] mb-[3px]'}`}>{honour.pinyin}</span>}
      </div>
    );
  }

  // Suits: a small readable corner number so non-Chinese readers know each tile.
  if (tagOverride === false) return <>{face}</>;
  const tag = beginnerTag(t);
  // Character numerals fill the top of the tile (二 and 三 run edge to edge), so their number sits
  // bottom-right beside the narrower 萬 instead of covering a stroke.
  const isChar = t.kind === 'suit' && t.suit === 'character';
  return (
    <div className="relative w-full h-full">
      {face}
      <span
        className={`absolute bg-[#FBF4E4]/85 px-[2px] font-extrabold leading-none ${isChar
          ? `bottom-0 right-0 rounded-tl-[3px] ${size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-[15px]' : 'text-[13px]'}`
          : `top-0 left-0 rounded-br-[3px] ${size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[13px]' : 'text-[11px]'}`}`}
        style={{ color: tag.color }}
      >
        {tag.label}
      </span>
    </div>
  );
}

const WIND_NAMES = {
  east: { en: 'East', pinyin: 'dōng', char: '東' },
  south: { en: 'South', pinyin: 'nán', char: '南' },
  west: { en: 'West', pinyin: 'xī', char: '西' },
  north: { en: 'North', pinyin: 'běi', char: '北' },
} as const;

/** English name and Mandarin pinyin for winds and dragons; null for suit tiles. */
export function honourName(t: ReturnType<typeof indexToTile>): { en: string; pinyin: string; char: string; color: string } | null {
  if (t.kind === 'wind') return { ...WIND_NAMES[t.wind], color: '#2c2820' };
  if (t.kind === 'dragon') {
    if (t.dragon === 'red') return { en: 'Red', pinyin: 'zhōng', char: '中', color: '#b5392a' };
    if (t.dragon === 'green') return { en: 'Green', pinyin: 'fā', char: '發', color: '#1d6b46' };
    return { en: 'White', pinyin: 'bái', char: '', color: '#36468a' };
  }
  return null;
}

function beginnerTag(t: ReturnType<typeof indexToTile>): { label: string; color: string } {
  if (t.kind === 'suit') return { label: String(t.value), color: '#26201a' };
  if (t.kind === 'wind') return { label: { east: 'E', south: 'S', west: 'W', north: 'N' }[t.wind], color: '#26201a' };
  if (t.dragon === 'red') return { label: 'Rd', color: '#b5392a' };
  if (t.dragon === 'green') return { label: 'Gn', color: '#1d6b46' };
  return { label: 'Wt', color: '#36468a' };
}

function DotFace({ value }: { value: number }) {
  const ink = INK.dot;
  return (
    <svg viewBox="0 0 60 84" className="w-full h-full p-0.5">
      {LAYOUTS[value].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={value === 1 ? 11 : 7.5} fill="#fbf7ec" stroke={ink} strokeWidth={value === 1 ? 3 : 2.4} />
          <circle cx={x} cy={y} r={value === 1 ? 4 : 2.8} fill={ink} />
        </g>
      ))}
    </svg>
  );
}

function BambooFace({ value }: { value: number }) {
  const ink = INK.bamboo;
  if (value === 1) {
    // 1 bamboo — a single ornate stalk with a leaf
    return (
      <svg viewBox="0 0 60 84" className="w-full h-full p-0.5">
        <rect x={26} y={20} width={8} height={44} rx={4} fill={ink} />
        <line x1={26} y1={34} x2={34} y2={34} stroke="#fbf7ec" strokeWidth={2} />
        <line x1={26} y1={50} x2={34} y2={50} stroke="#fbf7ec" strokeWidth={2} />
        <path d="M30 20 q10 -8 16 2 q-10 4 -16 -2" fill={ink} />
      </svg>
    );
  }
  // Shorter sticks at dense counts (7-9) so rows don't merge into a blob.
  const h = value >= 7 ? 14 : 18;
  const top = -h / 2;
  return (
    <svg viewBox="0 0 60 84" className="w-full h-full p-0.5">
      {LAYOUTS[value].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 3.2} y={y + top} width={6.4} height={h} rx={3} fill={ink} />
          <line x1={x - 3.2} y1={y + top + h * 0.36} x2={x + 3.2} y2={y + top + h * 0.36} stroke="#fbf7ec" strokeWidth={1.3} />
          <line x1={x - 3.2} y1={y + top + h * 0.64} x2={x + 3.2} y2={y + top + h * 0.64} stroke="#fbf7ec" strokeWidth={1.3} />
        </g>
      ))}
    </svg>
  );
}

function CharacterFace({ value, size }: { value: number; size: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex flex-col items-center justify-center leading-none" style={{ color: INK.character, textShadow: '0 1px 0.5px rgba(255,255,255,0.55)' }}>
      <span className={size === 'sm' ? 'text-base' : size === 'lg' ? 'text-[34px]' : 'text-2xl'} style={{ fontWeight: 700 }}>
        {CN_NUM[value]}
      </span>
      <span className={size === 'sm' ? 'text-[12px]' : size === 'lg' ? 'text-xl' : 'text-base'} style={{ fontWeight: 700, marginTop: 1 }}>
        萬
      </span>
    </div>
  );
}

function HonorFace({ char, color, size }: { char: string; color: string; size: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={`flex items-center justify-center leading-none font-bold ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-[44px]' : 'text-[34px]'}`}
      style={{ color, textShadow: '0 1px 0.5px rgba(255,255,255,0.55)' }}
    >
      {char}
    </div>
  );
}

function WhiteDragonFace() {
  // White dragon is traditionally a framed blank tile.
  return (
    <svg viewBox="0 0 60 84" className="w-full h-full p-1">
      <rect x={10} y={14} width={40} height={56} rx={4} fill="none" stroke={INK.dot} strokeWidth={2.6} />
    </svg>
  );
}
