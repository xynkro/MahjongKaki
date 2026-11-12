// Renders an explainer's animated middle section to MP4, frame by frame, with the narration laid in.
// Needs the dev server running (npm run dev -w @mahjongkaki/app, port 5174 or set URL).
// Usage: node scripts/render-explainer.mjs wall [fps]
//   → media-src/explainers/<id>/<id>_main.mp4
import { spawn, execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const id = process.argv[2] ?? 'wall';
const fps = Number(process.argv[3] ?? 30);
const base = process.env.URL ?? 'http://localhost:5174';
const dir = `media-src/explainers/${id}`;
const silent = `${dir}/${id}_frames.mp4`;
const out = `${dir}/${id}_main.mp4`;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 720, height: 1280, deviceScaleFactor: 1 });
await page.goto(`${base}/explainer.html?id=${id}&t=0`, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const { total, starts, audio } = await page.evaluate(() => ({ total: window.__total, starts: window.__starts, audio: window.__audio }));
const frames = Math.ceil(total * fps);
console.log(`${id}: ${total.toFixed(1)} s, ${frames} frames`);

const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-crf', '20', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < frames; f++) {
  await page.evaluate(t => window.__seek(t), f / fps);
  const png = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % (fps * 10) === 0) process.stdout.write(`  ${Math.round(f / fps)} s\n`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();

// Narration: each scene's clip delayed to its start time, mixed, padded to the video length.
const inputs = audio.flatMap(a => ['-i', `${dir}/${a}`]);
const delays = audio.map((_, i) => `[${i + 1}:a]adelay=${Math.round(starts[i] * 1000)}:all=1[a${i}]`).join(';');
const mix = `${delays};${audio.map((_, i) => `[a${i}]`).join('')}amix=inputs=${audio.length}:normalize=0,apad[aout]`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, ...inputs, '-filter_complex', mix,
  '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', out], { stdio: 'inherit' });
console.log(`wrote ${out}`);
