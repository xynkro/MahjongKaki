// Rasterises a tile face (the same art TileFace draws) onto a transparent 2D
// canvas, to be used as a three.js texture. Lazy chunk only.
//
// TileFace has two kinds of art, so there are two paths:
//  - SVG faces (dots, bamboo, white dragon): TileFace itself is rendered to a
//    static SVG string and drawn as an image, so the art is single-sourced.
//  - Glyph faces (characters, winds, red/green dragon) are HTML text in
//    TileFace. An SVG-as-image cannot use page web fonts, so these are drawn
//    straight on the canvas with fillText, which resolves the same CJK fallback
//    fonts as the page. Ink colours and glyphs mirror TileFace.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { indexToTile, type PlayTile } from '@mahjongkaki/engine';
import { TileFace } from '../game/TileFace';

export const FACE_W = 504;
export const FACE_H = 720;

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WIND_CHAR = { east: '東', south: '南', west: '西', north: '北' } as const;
const CHAR_INK = '#b5392a';

export async function drawTileFace(index: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d canvas unavailable');

  const t = indexToTile(index);
  const isSvgFace = (t.kind === 'suit' && t.suit !== 'character') || (t.kind === 'dragon' && t.dragon === 'white');
  if (isSvgFace) await drawSvgFace(ctx, index);
  else drawGlyphFace(ctx, t);
  return canvas;
}

async function drawSvgFace(ctx: CanvasRenderingContext2D, index: number): Promise<void> {
  // Beginner mode wraps the svg with a tag span: take just the <svg>.
  const svg = renderToStaticMarkup(createElement(TileFace, { index })).match(/<svg[\s\S]*?<\/svg>/)?.[0];
  if (!svg) throw new Error('tile face has no svg');
  // The Tailwind classes do not exist inside an image, so size it explicitly.
  const sized = svg
    .replace(/ class="[^"]*"/, '')
    .replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${FACE_W}" height="${FACE_H}" `);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('tile svg failed to load'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  });
  // TileFace art is authored in a 60 x 84 box (ratio 0.714); inset to keep that ratio.
  const w = FACE_W * 0.94;
  const h = w * (84 / 60);
  ctx.drawImage(img, (FACE_W - w) / 2, (FACE_H - h) / 2, w, h);
}

function drawGlyphFace(ctx: CanvasRenderingContext2D, t: PlayTile): void {
  const family = getComputedStyle(document.body).fontFamily;
  if (t.kind === 'suit') {
    glyph(ctx, CN_NUM[t.value], CHAR_INK, 700, 300, family, FACE_H * 0.35);
    glyph(ctx, '萬', CHAR_INK, 700, 270, family, FACE_H * 0.68);
  } else if (t.kind === 'wind') {
    glyph(ctx, WIND_CHAR[t.wind], '#2c2820', 800, 470, family, FACE_H * 0.5);
  } else if (t.kind === 'dragon') {
    glyph(ctx, t.dragon === 'green' ? '發' : '中', t.dragon === 'green' ? '#1d6b46' : '#b5392a', 800, 470, family, FACE_H * 0.5);
  }
}

/** Draws one glyph centred on (W/2, cy), using its measured ink box so it is optically centred. */
function glyph(ctx: CanvasRenderingContext2D, ch: string, color: string, weight: number, size: number, family: string, cy: number): void {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(ch);
  const y = cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  // Same faint top highlight TileFace gives its glyphs.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(ch, FACE_W / 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(ch, FACE_W / 2, y);
}
