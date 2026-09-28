// Renders render.html frame by frame with headless Chromium, then encodes the loop with ffmpeg.
// Usage: node render.mjs [--fps 60] [--seed 7] [--workers 6] [--width 1920] [--height 1080] [--only 0,600,1200]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { homedir, cpus } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
}, []));

const fps = Number(args.fps || 60);
const seed = Number(args.seed || 7);
const width = Number(args.width || 1920);
const height = Number(args.height || 1080);
const workers = Number(args.workers || Math.max(2, Math.floor(cpus().length / 2)));
const only = args.only ? args.only.split(',').map(Number) : null;
const framesDir = join(here, only ? 'stills' : 'frames');
const outDir = join(here, 'out');

// Playwright's own browser cache; the revision is whichever headless shell is installed
const executablePath = process.env.CHROMIUM_PATH || join(homedir(),
    'Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell');

rmSync(framesDir, {recursive: true, force: true});
mkdirSync(framesDir, {recursive: true});
mkdirSync(outDir, {recursive: true});

const browser = await chromium.launch({executablePath});
const url = `${pathToFileURL(join(here, 'render.html'))}?fps=${fps}&seed=${seed}${args.debug ? "&debug" : ""}`;

async function openPage() {
    const page = await browser.newPage({viewport: {width, height}});
    await page.goto(url);
    await page.evaluate(() => window.ready);
    return page;
}

const probe = await openPage();
const LOOP = await probe.evaluate(() => window.LOOP);
const total = LOOP.duration * LOOP.fps;
await probe.close();

const queue = only || Array.from({length: total}, (_, i) => i);
let done = 0;
const started = Date.now();

async function work() {
    const page = await openPage();
    while (queue.length) {
        const i = queue.shift();
        await page.evaluate((n) => window.renderFrame(n), i);
        await page.screenshot({path: join(framesDir, `${String(i).padStart(5, '0')}.png`), omitBackground: true});
        if (++done % 120 === 0) {
            const rate = done / ((Date.now() - started) / 1000);
            console.log(`${done}/${only ? only.length : total} frames, ${rate.toFixed(1)} fps, ~${Math.round((total - done) / rate)}s left`);
        }
    }
    await page.close();
}

await Promise.all(Array.from({length: only ? 1 : workers}, work));
await browser.close();
console.log(`Rendered ${done} frames in ${((Date.now() - started) / 1000).toFixed(0)}s`);

if (!only) {
    const input = ['-y', '-v', 'error', '-framerate', String(fps), '-i', join(framesDir, '%05d.png')];
    const name = `nothing-logo-loop-${width}x${height}-${fps}fps`;

    // ProRes 4444 keeps the transparency for placing the logo over other footage
    execFileSync('ffmpeg', [...input,
        '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le',
        join(outDir, `${name}-alpha.mov`)], {stdio: 'inherit'});

    console.log(`Wrote ${join(outDir, name)}-alpha.mov`);
}
