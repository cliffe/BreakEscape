#!/usr/bin/env node
/**
 * launch.mjs - headed full Chromium on an Xvfb display, for video capture.
 *
 * Library:  import { launchGame } from './launch.mjs'
 *   const { browser, context, page, close } = await launchGame({ display: 97, url, ... })
 * CLI:      NODE_PATH=/opt/node-tools/node_modules node launch.mjs --display 97 --url <game-url> [--hold 30]
 *
 * Options (library keys = CLI flags):
 *   display   X display number (required)       sink     PulseAudio sink (default be_rec_<display>)
 *   url       game URL (skip_resume=1 is added) mode     'kiosk' (default) | 'app'
 *   width, height   window size (default 1920x1080)
 *   noSandbox true/false (default: auto - only when running as root)
 *   volumes   { music, sfx, voice, master } 0..1 -> localStorage be_*_vol
 *   zoomStep  number -> be_display_settings.zoomStep (+1 = 3x scale for overworld shots)
 *   hideHud   true -> inject CSS hiding HUD overlays (see HUD_CSS); minigame and dialogue overlays stay visible
 *   profileDir  fresh dir per run (default: mkdtemp under $VIDEO_STATE_DIR or os tmpdir)
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.NODE_PATH ? path.join(process.env.NODE_PATH.split(':')[0], 'playwright') : 'playwright');

export const CHROMIUM = process.env.BE_CHROMIUM
  || '/opt/pw-browsers/chromium-1243/chrome-linux/chrome';

function findChromium() {
  if (fs.existsSync(CHROMIUM)) return CHROMIUM;
  const base = '/opt/pw-browsers/chromium-1243';
  for (const rel of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
    const p = path.join(base, rel);
    if (fs.existsSync(p)) return p;
  }
  throw new Error('full Chromium not found under ' + base);
}

// HUD elements hidden by --hide-hud (ids/classes from ui/*.js, systems/notifications.js, systems/npc-barks.js, show.html.erb).
// Not touched: minigame overlays, person-chat/phone-chat, game-confirm dialogs, tutorial prompts, the subtitle bar.
export const HUD_CSS = [
  '#objectives-panel', '.objectives-panel',               // objectives panel
  '#notification-container',                              // toasts
  '#npc-bark-container', '.npc-bark-clear-all',           // HaX / NPC message popups and "Clear all"
  '#inventory-container',                                 // inventory bar
  '#health-ui-container',                                 // hearts
  '#combat-buttons',                                      // Block / Punch
  '#player-hud-buttons',                                  // top-right buttons (avatar etc.)
  '#hud-info-label',                                      // the "A chair." / object description text box
  '#music-widget-btn-anchor', '#scenario-timer-display', '#toggle-buttons-container',
].join(',') + '{display:none !important}';

export function withSkipResume(url) {
  return url + (url.includes('?') ? '&' : '?') + 'skip_resume=1';
}

export async function launchGame(opts) {
  const {
    display, url, mode = 'kiosk', width = 1920, height = 1080,
    volumes = {}, zoomStep, profileDir, hideHud = false,
  } = opts;
  if (display === undefined) throw new Error('launchGame: display required');
  const sink = opts.sink || `be_rec_${display}`;
  const noSandbox = opts.noSandbox ?? (typeof process.getuid === 'function' && process.getuid() === 0);
  const gameUrl = url ? withSkipResume(url) : null;

  const base = process.env.VIDEO_STATE_DIR || os.tmpdir();
  const profile = profileDir || fs.mkdtempSync(path.join(base, 'profile-'));

  const args = [
    '--window-position=0,0', `--window-size=${width},${height}`,
    '--autoplay-policy=no-user-gesture-required',
    '--no-first-run', '--no-default-browser-check',
    '--disable-infobars', '--disable-features=Translate,MediaRouter',
    '--disable-session-crashed-bubble', '--hide-crash-restore-bubble',
    '--password-store=basic', '--use-mock-keychain',
    // keep timers and rAF at full rate even if the window is judged occluded
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ];
  if (mode === 'app' && gameUrl) args.push(`--app=${gameUrl}`); else args.push('--kiosk');
  if (noSandbox) args.push('--no-sandbox');

  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    chromiumSandbox: !noSandbox,   // Playwright adds --no-sandbox itself unless this is true
    executablePath: findChromium(),
    viewport: null,
    env: { ...process.env, DISPLAY: `:${display}`, PULSE_SINK: sink },
    args,
    ignoreDefaultArgs: ['--enable-automation', '--mute-audio'],
    acceptDownloads: false,
  });

  // Settings must exist before any game script runs.
  const vols = {};
  for (const k of ['music', 'sfx', 'voice', 'master']) if (volumes[k] !== undefined) vols[`be_${k}_vol`] = String(volumes[k]);
  if (hideHud) {
    await context.addInitScript((css) => {
      const add = () => { const st = document.createElement('style'); st.id = 'be-hide-hud'; st.textContent = css; (document.head || document.documentElement).appendChild(st); };
      if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add);
    }, HUD_CSS);
  }
  await context.addInitScript(({ vols, zoomStep }) => {
    try {
      for (const [k, v] of Object.entries(vols)) localStorage.setItem(k, v);
      if (zoomStep !== undefined && zoomStep !== null) {
        let s = {};
        try { s = JSON.parse(localStorage.getItem('be_display_settings') || '{}') || {}; } catch (_) {}
        s.zoomStep = zoomStep;
        localStorage.setItem('be_display_settings', JSON.stringify(s));
      }
    } catch (_) {}
  }, { vols, zoomStep });

  let page = context.pages()[0];
  if (!page) page = await context.newPage();
  // Auto-accept native dialogs (as the playtest harness does).
  page.on('dialog', d => d.accept().catch(() => {}));
  if (opts.noGoto) { /* caller navigates (title-screen take) */ }
  else if (gameUrl && mode !== 'app') await page.goto(gameUrl, { waitUntil: 'domcontentloaded' });
  else if (gameUrl) await page.waitForLoadState('domcontentloaded').catch(() => {});

  const close = async () => {
    try { await context.close(); } catch (_) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  };
  return { context, page, profile, close, browserPid: null };
}

// ---- CLI ----
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const a = {};
  const av = process.argv.slice(2);
  for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) a[av[i].slice(2)] = (av[i + 1] && !av[i + 1].startsWith('--')) ? av[++i] : true;
  if (!a.display || !a.url) { console.error('usage: launch.mjs --display N --url URL [--mode kiosk|app] [--no-sandbox true|false] [--hold seconds]'); process.exit(2); }
  const g = await launchGame({
    display: a.display, url: a.url, mode: a.mode || 'kiosk', width: Number(a.width) || 1920, height: Number(a.height) || 1080,
    noSandbox: a['no-sandbox'] === undefined ? undefined : a['no-sandbox'] === 'true',
    volumes: a.music !== undefined ? { music: a.music } : {},
  });
  const info = await g.page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, ow: outerWidth, oh: outerHeight, sw: screen.width, sh: screen.height }));
  console.log(JSON.stringify(info));
  await new Promise(r => setTimeout(r, (Number(a.hold) || 5) * 1000));
  await g.close();
}
