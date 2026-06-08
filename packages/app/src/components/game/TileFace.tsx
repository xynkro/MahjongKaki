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
  size?: 'sm' | 'md';
}

export function TileFace({ index, size = 'md' }: FaceProps) {
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

  if (tileMode !== 'beginner') return <>{face}</>;

  // Beginner mode: a small readable corner tag so non-Chinese readers know each tile.
  const tag = beginnerTag(t);
  return (
    <div className="relative w-full h-full">
      {face}
      <span
        className={`absolute top-0 left-0 rounded-br-[3px] bg-[#FBF4E4]/85 px-[2px] font-extrabold leading-none ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}
        style={{ color: tag.color }}
      >
        {tag.label}
      </span>
    </div>
  );
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
  return (
    <svg viewBox="0 0 60 84" className="w-full h-full p-0.5">
      {LAYOUTS[value].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 3} y={y - 9} width={6} height={18} rx={3} fill={ink} />
          <line x1={x - 3} y1={y - 2} x2={x + 3} y2={y - 2} stroke="#fbf7ec" strokeWidth={1.4} />
          <line x1={x - 3} y1={y + 4} x2={x + 3} y2={y + 4} stroke="#fbf7ec" strokeWidth={1.4} />
        </g>
      ))}
    </svg>
  );
}

function CharacterFace({ value, size }: { value: number; size: 'sm' | 'md' }) {
  return (
    <div className="flex flex-col items-center justify-center leading-none" style={{ color: INK.character }}>
      <span className={size === 'sm' ? 'text-sm' : 'text-xl'} style={{ fontWeight: 700 }}>
        {CN_NUM[value]}
      </span>
      <span className={size === 'sm' ? 'text-[12px]' : 'text-sm'} style={{ fontWeight: 700, marginTop: 1 }}>
        萬
      </span>
    </div>
  );
}

function HonorFace({ char, color, size }: { char: string; color: string; size: 'sm' | 'md' }) {
  return (
    <div
      className={`flex items-center justify-center leading-none font-bold ${size === 'sm' ? 'text-lg' : 'text-3xl'}`}
      style={{ color }}
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
