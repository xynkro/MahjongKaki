// Dev-only page that draws one explainer frame at a time for scripts/render-explainer.mjs.
// Not part of the app build (vite only builds index.html). Open /explainer.html?id=wall&t=12 to look at a frame.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '../styles/index.css';
import { Captions, H, W, sceneStarts, totalDuration, type ExplainerData } from './kit';
import wall from './data/wall.json';
import { WALL_SCENES } from './wall';
import east from './data/east.json';
import { EAST_SCENES } from './east';
import dice from './data/dice.json';
import deal from './data/deal.json';
import drawing from './data/drawing.json';
import { DEAL_SCENES, DICE_SCENES, DRAWING_SCENES } from './setup';
import pung from './data/pung.json';
import chow from './data/chow.json';
import pair from './data/pair.json';
import { CHOW_SCENES, PAIR_SCENES, PUNG_SCENES } from './sets';
import drawThrow from './data/draw-throw.json';
import kong from './data/kong.json';
import pungClaim from './data/pung-claim.json';
import chowClaim from './data/chow-claim.json';
import winning from './data/winning.json';
import d_suits from './data/suits.json';
import d_honours from './data/honours.json';
import d_bonus from './data/bonus.json';
import d_seats from './data/seats.json';
import d_round from './data/round.json';
import d_tai from './data/tai.json';
import d_doubling from './data/doubling.json';
import d_who_pays from './data/who-pays.json';
import d_common_tai from './data/common-tai.json';
import { SUITS_SCENES, HONOURS_SCENES, BONUS_SCENES, SEATS_SCENES, ROUND_SCENES, TAI_SCENES, DOUBLING_SCENES, WHO_PAYS_SCENES, COMMON_TAI_SCENES } from './basics';
import { CHOW_CLAIM_SCENES, DRAW_THROW_SCENES, KONG_SCENES, PUNG_CLAIM_SCENES, WINNING_SCENES } from './play';

const EXPLAINERS: Record<string, { data: ExplainerData; scenes: typeof WALL_SCENES }> = {
  wall: { data: wall as ExplainerData, scenes: WALL_SCENES },
  east: { data: east as ExplainerData, scenes: EAST_SCENES },
  dice: { data: dice as ExplainerData, scenes: DICE_SCENES },
  deal: { data: deal as ExplainerData, scenes: DEAL_SCENES },
  drawing: { data: drawing as ExplainerData, scenes: DRAWING_SCENES },
  pung: { data: pung as ExplainerData, scenes: PUNG_SCENES },
  chow: { data: chow as ExplainerData, scenes: CHOW_SCENES },
  pair: { data: pair as ExplainerData, scenes: PAIR_SCENES },
  'draw-throw': { data: drawThrow as ExplainerData, scenes: DRAW_THROW_SCENES },
  kong: { data: kong as ExplainerData, scenes: KONG_SCENES },
  'pung-claim': { data: pungClaim as ExplainerData, scenes: PUNG_CLAIM_SCENES },
  'chow-claim': { data: chowClaim as ExplainerData, scenes: CHOW_CLAIM_SCENES },
  winning: { data: winning as ExplainerData, scenes: WINNING_SCENES },
  'suits': { data: d_suits as ExplainerData, scenes: SUITS_SCENES },
  'honours': { data: d_honours as ExplainerData, scenes: HONOURS_SCENES },
  'bonus': { data: d_bonus as ExplainerData, scenes: BONUS_SCENES },
  'seats': { data: d_seats as ExplainerData, scenes: SEATS_SCENES },
  'round': { data: d_round as ExplainerData, scenes: ROUND_SCENES },
  'tai': { data: d_tai as ExplainerData, scenes: TAI_SCENES },
  'doubling': { data: d_doubling as ExplainerData, scenes: DOUBLING_SCENES },
  'who-pays': { data: d_who_pays as ExplainerData, scenes: WHO_PAYS_SCENES },
  'common-tai': { data: d_common_tai as ExplainerData, scenes: COMMON_TAI_SCENES },
};

const params = new URLSearchParams(location.search);
const ex = EXPLAINERS[params.get('id') ?? 'wall'];
const starts = sceneStarts(ex.data);
const total = totalDuration(ex.data);

let setTime: (t: number) => void = () => {};

function Frame() {
  const [t, setT] = useState(Number(params.get('t') ?? 0));
  setTime = setT;
  let i = 0;
  while (i + 1 < starts.length && t >= starts[i + 1]) i++;
  const local = t - starts[i];
  const Scene = ex.scenes[i];
  // Cross-fade the first 0.3 s of each scene.
  const fade = i === 0 ? Math.min(1, t / 0.4) : Math.min(1, local / 0.3 + 0.0001);
  return (
    <div className="relative overflow-hidden text-ink" style={{ width: W, height: H, background: 'radial-gradient(ellipse at 50% 0%, #22262b 0%, #16181b 60%)' }}>
      <div className="absolute left-0 top-0 h-[6px] bg-[#3ccf8e]" style={{ width: `${(t / total) * 100}%` }} />
      <div className="absolute left-12 right-12 top-[56px]">
        <div className="text-[24px] font-semibold text-[#3ccf8e] tracking-wide">{ex.data.unit}</div>
        <div className="font-display font-bold leading-[1.05] text-[#f2f0ea] mt-1 whitespace-nowrap" style={{ fontSize: ex.data.title.length > 18 ? 50 : 60 }}>{ex.data.title}</div>
      </div>
      <div style={{ opacity: fade }}>
        <Scene s={ex.data.scenes[i]} t={Math.max(0, local)} />
        {local >= 0 && <Captions scene={ex.data.scenes[i]} t={local} />}
      </div>
      <div className="absolute bottom-[40px] inset-x-0 text-center text-[22px] text-[#9aa0a6] font-semibold">MahjongKaki</div>
    </div>
  );
}

declare global { interface Window { __seek: (t: number) => Promise<void>; __total: number; __starts: number[]; __audio: string[] } }
window.__total = total;
window.__starts = starts;
window.__audio = ex.data.scenes.map(s => s.audio);
window.__seek = async (t: number) => {
  flushSync(() => setTime(t));
  await new Promise(r => requestAnimationFrame(() => r(null)));
};

createRoot(document.getElementById('root')!).render(<Frame />);
