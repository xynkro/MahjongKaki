// Picture faces for the four animal bonus tiles, drawn for this app in the ink-and-colour style
// of a real tile (no copied tile sets). 60 × 84 viewBox, the same as TileFace.
import type { AnimalName } from '@mahjongkaki/engine';

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
