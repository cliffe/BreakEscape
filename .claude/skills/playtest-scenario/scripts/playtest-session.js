#!/usr/bin/env node
/**
 * playtest-session.js — a long-lived, watchable Break Escape playtest session.
 *
 * Launches a HEADED browser, opens a game, and then reads one JSON command per
 * line on stdin, writing one JSON result per line on stdout. The browser stays
 * open across commands, so a playtest is one continuous run a human can watch,
 * and the agent spends one command per decision rather than relaunching a
 * browser per step.
 *
 *   node playtest-session.js --url <game-url> [--speed fast|human] [--headless]
 *                            [--vw 1400] [--vh 1000]     (or env VW / VH)
 *
 * Commands (one JSON object per line):
 *   {"cmd":"bootstrap","tutorial":"decline","resume":"new"}   (stops at an open briefing: briefingPending:true,
 *                                            settled:false; add "autoBrief":true to auto-drive it)
 *   {"cmd":"converse","id":"npc","choices":["^Yes"]}   (takes only named options; stops at an unnamed
 *                                            choice with ok:false stopped-at-choice; "explore":true takes
 *                                            unvisited options, "close":true closes at a stop)
 *   {"cmd":"openInventoryItem","item":"phone"}   (tray index | id | exact name | type | name substring)
 *   {"cmd":"inventory"}                      → the tray, in order
 *   {"cmd":"doorways"}                       → doorways of the current room (or {"room":"id"})
 *   {"cmd":"cyberchef","input":"text","recipe":"ROT13(true,true,false,13)"}  (laptop must be open)
 *   {"cmd":"cyberchefOutput"}
 *   {"cmd":"state"}                          → full getState()
 *   {"cmd":"brief"}                          → compact decision-sized state
 *   {"cmd":"moveTo","x":210,"y":190}
 *   {"cmd":"interact","id":"receptionist"}
 *   {"cmd":"interactNearest"}
 *   {"cmd":"pressKey","key":"e"}
 *   {"cmd":"walk","direction":"up","ms":300}
 *   {"cmd":"debugKO","id":"derek_lawson"}    → KO a hostile NPC (combat NOT played)
 *   {"cmd":"dismiss","label":"Resume"}
 *   {"cmd":"mg","action":"getState"}
 *   {"cmd":"mg","action":"choose","args":[2]}                  (by number)
 *   {"cmd":"mg","action":"choose","args":["^I'm the security"]} (by regex — preferred)
 *   {"cmd":"mg","action":"matchDialogue","args":["ransomware"]}
 *   {"cmd":"mg","action":"clickText","args":["Continue"]}
 *   {"cmd":"mg","action":"clickCanvas","args":[420,300]}   (nested Phaser canvas)
 *   {"cmd":"mg","action":"type","args":[0,"Hospital1987",{"submit":true}]}
 *   {"cmd":"select","field":"template","option":"urgent"}    (set a <select>; also mg action "select")
 *   {"cmd":"waitFor","kind":"global","name":"bernie_gave_key"}
 *   {"cmd":"waitFor","kind":"task","id":"sign_in_at_reception"}
 *   {"cmd":"waitFor","kind":"minigame","id":"person-chat"}
 *   {"cmd":"waitFor","kind":"minigameClosed"}
 *   {"cmd":"waitFor","kind":"event","name":"room_entered:it_department"}
 *   {"cmd":"drain"}                          → action + event log, then clears
 *   {"cmd":"toasts"}                         → text of every toast shown since the last call
 *   {"cmd":"screenshot","path":"/tmp/x.png"} → ONLY for diagnosing a failure
 *   {"cmd":"eval","fn":"() => window.__test.scan(400)"}
 *   {"cmd":"quit"}
 *
 * Speed presets control only pacing, never correctness — waits stay
 * deterministic either way:
 *   fast  (default) — no added delay; run as quickly as the game allows
 *   human           — a beat between steps and after each dialogue line, so a
 *                     person can follow along
 */

const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { briefTasks } = require('./brief-tasks');

const args = process.argv.slice(2);
const argv = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const k = args[i].slice(2);
    const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    argv[k] = v;
  }
}

const SPEEDS = {
  fast:  { step: 0,    dialogue: 120, settleFrames: 3 },
  human: { step: 900,  dialogue: 850, settleFrames: 12 }
};
const speed = SPEEDS[argv.speed] || SPEEDS.fast;

/* ---------------------------------------------------------------------------
 * Session log — the record of what actually ran.
 *
 * A playtest report is a document an agent writes, so on its own it is not
 * evidence that anything was played. This log is written by the harness, one
 * JSON line per command and per result, and is the artefact a report cites.
 * A report with no matching log did not happen. Off only with --no-log.
 * ------------------------------------------------------------------------- */
const logPath = argv['no-log'] ? null
  : (typeof argv.log === 'string' ? argv.log
     : path.join('tools', 'playtest', `session-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`));
let logStream = null;
if (logPath) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  logStream = fs.createWriteStream(logPath, { flags: 'a' });
}
let seq = 0;
function logLine(dir, obj) {
  if (!logStream) return;
  logStream.write(JSON.stringify({ seq: ++seq, t: new Date().toISOString(), dir, ...obj }) + '\n');
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
  logLine('out', obj);
}

/* ---------------------------------------------------------------------------
 * Flag values, supplied once at session start.
 *
 * --flags accepts a comma-separated list, or a path to a SecGen flag-hints XML
 * whose flag values are read in document order. Traces then write the portable
 * token <flag:1>, <flag:2>, … and the harness substitutes the configured value
 * before dispatch. The log records both the token and the substitution, so a
 * report cannot quietly claim a flag was earned in-game when it came from here.
 * ------------------------------------------------------------------------- */
function loadFlags(spec) {
  if (typeof spec !== 'string' || !spec) return [];
  if (spec.includes(',') || !fs.existsSync(spec)) return spec.split(',').map(f => f.trim()).filter(Boolean);
  const xml = fs.readFileSync(spec, 'utf8');
  return [...xml.matchAll(/<flag>([^<]+)<\/flag>/g)].map(m => m[1].trim());
}
const FLAGS = loadFlags(argv.flags);
const flagUses = [];

/** Replace <flag:N> anywhere in a command, recording every substitution. */
function substituteFlags(node, at) {
  if (typeof node === 'string') {
    return node.replace(/<flag:(\d+)>/g, (whole, n) => {
      const v = FLAGS[Number(n) - 1];
      if (v === undefined) return whole;
      flagUses.push({ token: whole, index: Number(n), at });
      logLine('flag', { token: whole, index: Number(n), source: 'session --flags', earnedInGame: false });
      return v;
    });
  }
  if (Array.isArray(node)) return node.map(v => substituteFlags(v, at));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = substituteFlags(v, at);
    return out;
  }
  return node;
}

(async () => {
  if (!argv.url) { emit({ ok: false, error: 'missing --url' }); process.exit(1); }

  // Headed by default: the point is that a person can watch the playtest.
  // Viewport defaults to 1400x1000; --vw/--vh or VW/VH override it (e.g. 600
  // to check a narrow layout).
  const pickDim = (a, e, d) => { const n = parseInt(a !== undefined && a !== true ? a : e, 10); return n > 0 ? n : d; };
  const VW = pickDim(argv.vw, process.env.VW, 1400);
  const VH = pickDim(argv.vh, process.env.VH, 1000);
  const browser = await chromium.launch({
    headless: argv.headless === true || argv.headless === 'true',
    args: [`--window-size=${VW},${VH}`]
  });
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });

  // Toast capture. Installed before any page script runs, so it sees toasts
  // raised during load. Watches the whole document for added .notification
  // nodes (the container, #notification-container, may not exist yet) and
  // records their text; the `toasts` command returns and clears the list.
  await page.addInitScript(() => {
    window.__toastLog = [];
    const grab = (el) => {
      if (!el || el.nodeType !== 1 || window.__toastSeen?.has(el)) return;
      const list = el.matches?.('.notification') ? [el] : [...(el.querySelectorAll?.('.notification') || [])];
      for (const n of list) {
        (window.__toastSeen ||= new WeakSet());
        if (window.__toastSeen.has(n)) continue;
        window.__toastSeen.add(n);
        const q = (sel) => n.querySelector(sel)?.innerText?.trim() || '';
        window.__toastLog.push({
          at: Date.now(),
          type: ['success', 'warning', 'error', 'info'].find(t => n.classList.contains(t)) || undefined,
          title: q('.notification-title'),
          message: q('.notification-message') || (n.innerText || '').trim()
        });
      }
    };
    const start = () => new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(grab)))
      .observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
  });

  // Disable HTTP cache. A game JS file edited between runs (e.g. a bridge fix
  // applied while iterating) can otherwise be served from a prior Playwright
  // profile's disk cache, so the browser silently runs stale code that no
  // longer matches disk — confirmed by comparing a captured interact() error
  // shape against `curl`ing the same file straight from the dev server.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  // Auto-accept native JS dialogs (window.confirm/alert/prompt). At least one
  // real game handler gates on confirm() (the ENTROPY launch device's abort/
  // launch buttons) — Playwright auto-dismisses unhandled dialogs, so the
  // synthetic click reaches the button and fires the handler, but confirm()
  // silently returns false and the handler no-ops. Without this, that choice
  // is unreachable from the bridge no matter how correctly it is clicked.
  page.on('dialog', dialog => dialog.accept().catch(() => {}));

  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });

  // ?skip_resume=1 suppresses the session-resume overlay entirely.
  //
  // This is not an optimisation, it is a correctness fix. A brand-new game
  // already reports has_progress? == true (Game#has_progress? counts
  // encounteredNPCs, which the scenario seeds at creation), so the overlay
  // ALWAYS appears — and it lists every other session for that mission as
  // "Load session #N" links. Those links navigate to a DIFFERENT GAME. A
  // bootstrap that clicks the wrong one silently abandons the fresh game and
  // plays somebody else's half-finished save, which looks like a working run
  // until the state makes no sense.
  const gotoUrl = argv.url + (argv.url.includes('?') ? '&' : '?') + 'skip_resume=1';
  await page.goto(gotoUrl, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction(() => !!window.__test, null, { timeout: 120000 });
  } catch {
    emit({ ok: false, error: 'window.__test never appeared — is testBridge enabled (non-production)?' });
    await browser.close(); process.exit(1);
  }
  const ready = await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 60000 }));
  emit({ ok: true, event: 'session-open', ready, speed: argv.speed || 'fast', url: argv.url,
         flagsConfigured: FLAGS.length, logPath, pid: process.pid });

  const pause = (ms) => ms ? page.waitForTimeout(ms) : Promise.resolve();

  /** Compact state: everything needed for one decision, without the bulk. */
  /**
   * Wait (bounded) for the player sprite. Right after a reload getState() throws
   * "Cannot read properties of null (reading 'x')" until it exists.
   */
  async function waitForPlayer(timeoutMs = 15000) {
    const t0 = Date.now();
    let last = null;
    for (;;) {
      const r = await page.evaluate(() => {
        try {
          if (!window.__test) return { ok: false, why: 'no __test yet' };
          const s = window.__test.getState();
          return s && s.player ? { ok: true } : { ok: false, why: 'no player in state' };
        } catch (e) { return { ok: false, why: String(e.message || e) }; }
      }).catch(e => ({ ok: false, why: String(e.message || e) }));
      if (r.ok) return { ready: true };
      last = r.why;
      if (Date.now() - t0 >= timeoutMs) return { ready: false, reason: last, waitedMs: Date.now() - t0 };
      await page.waitForTimeout(400);
    }
  }

  async function brief() {
    const w = await waitForPlayer();
    if (!w.ready) return { ready: false, reason: 'player-not-ready', detail: w.reason, waitedMs: w.waitedMs };
    const { _aims, ...b } = await page.evaluate(() => {
      const s = window.__test.getState();
      return {
        room: s.room,
        player: { x: Math.round(s.player.x), y: Math.round(s.player.y), hp: s.player.hp },
        // Present only once the mission-end credits are up. It means stop
        // playing -- not wait, not dismiss. Confirm the real outcome against
        // the server's game record (status / mission_concluded_at).
        missionEnd: s.missionEnd || undefined,
        activeMinigame: s.activeMinigame,
        blockingUi: s.blockingUi && { classes: s.blockingUi.classes,
                                      text: s.blockingUi.text.split('\n')[0],
                                      buttons: s.blockingUi.buttons.map(b => b.label) },
        dialogue: s.dialogue && { speaker: s.dialogue.speaker,
                                  text: s.dialogue.text,
                                  awaitingChoice: s.dialogue.awaitingChoice,
                                  canContinue: s.dialogue.canContinue,
                                  choices: (s.dialogue.choices || []).map(c => `${c.number}. ${c.text}`) },
        nearby: s.nearby.map(e => ({ id: e.id, kind: e.kind, name: e.name,
                                     d: e.distance, inRange: e.inRange,
                                     locked: e.state.locked ?? undefined })),
        inventory: s.inventory.map(i => i.name),
        _aims: s.objectives.aims.map(a => ({ status: a.status,
          tasks: a.tasks.map(t => ({ id: t.id, status: t.status, optional: t.optional })) })),
        recentGlobals: Object.entries(s.globals).filter(([, v]) => v === true).map(([k]) => k).slice(-12)
      };
    });
    // openTasks matches the objectives panel (locked tasks hidden); see brief-tasks.js
    const { recentGlobals, ...rest } = b;
    return { ...rest, ...briefTasks(_aims), recentGlobals };
  }

  /**
   * Clear the overlays that stand between page load and playable overworld:
   * the session-resume prompt, the tutorial prompt, the title screen, the
   * mission brief, and the opening cutscene conversation.
   *
   * Every dismissal is a click or keypress on a real control — see
   * docs/test-bridge.md. `resume` and `tutorial` are explicit because the
   * bridge refuses to guess between destructive options.
   *
   * It does NOT play the opening briefing: choices there commit the story.
   * When a dialogue is on screen it stops and returns briefingPending:true
   * with the dialogue in `state`, and `settled:false` (the run is not ready to play
   * until the briefing is done; call bootstrap again afterwards). `autoBrief:true` opts in to the old
   * behaviour (choice 1 at each menu, hubs exit on a repeat).
   */
  async function bootstrap({ tutorial = 'decline', resume = 'new', maxSteps = 400,
                             settleChecks = 4, settleMs = 900, autoBrief = false } = {}) {
    const trace = [];
    // Overlays here are staggered: the mission brief and the opening cutscene
    // each open a beat after the previous one closes. A single "nothing is
    // open" reading is therefore not proof the overworld is ready — require
    // several consecutive clear checks before returning.
    let clear = 0;
    // A hub that offers the same menu again would otherwise loop on choice 1.
    const seenMenus = new Map();
    const exitRe = /\b(bye|goodbye|leave|later|that's all|that's it|nothing|done|go|thanks)\b/i;
    const pw = await waitForPlayer();
    if (!pw.ready) return { trace, settled: false, ready: false, reason: 'player-not-ready', detail: pw.reason };
    // An ending screen is a terminal state: credits (state.missionEnd) or an end
    // card whose only buttons leave the game. Stop there rather than click it.
    const endCheck = () => page.evaluate(() => {
      const s = window.__test.getState();
      if (s.missionEnd) return { kind: 'credits', text: String(s.missionEnd.creditsText || '').slice(0, 200),
                                 closable: !!s.missionEnd.closable };
      const bl = s.blockingUi;
      if (!bl) return null;
      const labels = bl.buttons.map(b => b.label);
      const head = String(bl.text || '').split('\n')[0];
      const leaveRe = /return to missions|back to missions|exit (game|mission)|main menu|leave game/i;
      const endRe = /engagement closed|mission (complete|ended|over|concluded)|the end\b|case closed|credits/i;
      const resumeRe = /tutorial|resume|session/i;
      if (resumeRe.test(bl.classes || '') || resumeRe.test(bl.text || '')) return null;
      const onlyLeaves = labels.length > 0 && labels.every(l => leaveRe.test(l));
      const hasEndText = endRe.test(bl.text || '') || endRe.test(bl.classes || '');
      if (onlyLeaves || (hasEndText && labels.some(l => leaveRe.test(l)))) {
        return { kind: 'end-card', text: head, buttons: labels };
      }
      return null;
    }).catch(() => null);
    for (let i = 0; i < maxSteps; i++) {
      const ended = await endCheck();
      if (ended) {
        trace.push(`ending screen (${ended.kind}): left alone`);
        return { trace, settled: true, ended: true, endKind: ended.kind, endScreen: ended, state: await brief() };
      }
      const mg = await page.evaluate(() => window.__test.getState().activeMinigame);
      if (mg) {
        clear = 0;
        const d = await page.evaluate(() => window.__test.minigame.getState()?.dialogue);
        // Between a line finishing and the next being actionable (the typewriter
        // gap) a dialogue reports neither awaitingChoice nor canContinue. It is
        // still a dialogue: never close it, wait for it to become actionable.
        if (d && !d.awaitingChoice && !d.canContinue) {
          await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 8000 })).catch(() => {});
          if (!autoBrief) {
            trace.push(`briefing dialogue left for the tester (${mg.id}); pass autoBrief:true to auto-drive it`);
            return { trace, settled: false, briefingPending: true, state: await brief() };
          }
          // A finished story that stays open (ended, nothing left to choose or
          // continue) is closed here, as it was before the gap check existed.
          const after = await page.evaluate(() => window.__test.minigame.getState()?.dialogue).catch(() => null);
          if (after && after.ended && !after.awaitingChoice && !after.canContinue) {
            trace.push(`close ended dialogue ${mg.id}`);
            await page.evaluate(() => window.__test.minigame.close());
            await pause(400 + speed.step);
            continue;
          }
          await pause(speed.dialogue);
          continue;
        }
        if (d && (d.awaitingChoice || d.canContinue) && !autoBrief) {
          // The opening briefing is story the tester must play: its choices are
          // real and commit the run. Leave it open and hand it over. Pass
          // {"autoBrief":true} to have bootstrap drive it (choice 1, hubs exit).
          trace.push(`briefing dialogue left for the tester (${mg.id}); pass autoBrief:true to auto-drive it`);
          return { trace, settled: false, briefingPending: true, state: await brief() };
        }
        if (d && (d.awaitingChoice || d.canContinue)) {
          if (d.awaitingChoice) {
            // choices are objects ({number, text}); tolerate plain strings too.
            const texts = d.choices.map(ch => (typeof ch === 'string' ? ch : ch.text) || '');
            const key = texts.join('|');
            let n = 1;
            if (seenMenus.has(key)) {
              const ix = texts.findIndex(t => exitRe.test(t));
              n = ix >= 0 ? ix + 1 : texts.length;
              trace.push(`repeat menu, choice ${n} of ${texts.length}`);
            } else {
              seenMenus.set(key, true);
              trace.push(`cutscene choice 1 of ${texts.length}`);
            }
            await page.evaluate(k => window.__test.minigame.choose(k), n);
          } else {
            await page.evaluate(() => window.__test.minigame.continue());
          }
          await pause(speed.dialogue);
        } else {
          trace.push(`close ${mg.id}`);
          await page.evaluate(() => window.__test.minigame.close());
          await pause(400 + speed.step);
        }
        continue;
      }
      const bl = await page.evaluate(() => window.__test.getState().blockingUi);
      if (bl) {
        clear = 0;
        const labels = bl.buttons.map(b => b.label);
        let pick;
        if (/tutorial/i.test(bl.classes) || /tutorial/i.test(bl.text)) {
          pick = labels.find(l => tutorial === 'accept' ? /yes/i.test(l) : /no|figure/i.test(l));
        } else if (/resume|session/i.test(bl.id || '') || /RESUME SESSION/i.test(bl.text)) {
          // The overlay's own button can carry an icon or arrow ("▶ Resume"), so match the word,
          // not the whole label; "Resume session" headings are not buttons. Never paginate the
          // OTHER SESSIONS list (Prev/Next): that is what looped for minutes after a reload.
          const want = { resume: /\bresume\b/i, restart: /\brestart\b/i, new: /new session/i }[resume];
          pick = labels.find(l => want.test(l) && !/prev|next|load session/i.test(l));
          if (!pick) {
            throw new Error(`bootstrap: the resume overlay has no "${resume}" button (buttons: ${labels.join(' | ')}). `
              + `Click it with dismiss or eval, then call bootstrap again.`);
          }
        }
        // NEVER fall back to a "Load session #N" entry: those are links to
        // other games, and clicking one abandons the game under test.
        const safe = labels.filter(l => !/^\s*load session/i.test(l));
        pick = pick || safe[0] || labels[0];
        if (/^\s*load session/i.test(pick)) {
          throw new Error(`bootstrap refused to click "${pick}" — that would navigate to a different game. `
            + `The session-resume overlay was not suppressed; check that skip_resume=1 reached the page.`);
        }
        trace.push(`dismiss "${bl.text.split('\n')[0]}" → "${pick}"`);
        await page.evaluate(l => window.__test.dismissBlockingUi(l), pick);
        await pause(900);
        // A "New Session" or "Restart" click reloads the page.
        await page.waitForFunction(() => !!window.__test, null, { timeout: 120000 }).catch(() => {});
        await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 120000 })).catch(() => {});
        continue;
      }
      clear++;
      if (clear >= settleChecks) break;
      await pause(settleMs);
    }
    await pause(600);
    return { trace, settled: clear >= settleChecks, state: await brief() };
  }

  const handlers = {
    bootstrap: (c) => bootstrap(c),
    state: () => page.evaluate(() => window.__test.getState()),
    brief: () => brief(),

    moveTo: async (c) => {
      const r = await page.evaluate(([x, y]) => window.__test.moveTo(x, y), [c.x, c.y]);
      await pause(speed.step);
      return r;
    },
    moveToNear: async (c) => {
      const r = await page.evaluate(id => window.__test.moveToNear(id), c.id);
      await pause(speed.step);
      return r;
    },
    interact: async (c) => {
      const r = await page.evaluate(id => window.__test.interact(id), c.id);
      await page.evaluate(n => window.__test.waitFrames(n), speed.settleFrames);
      await pause(speed.step);
      return r;
    },
    interactNearest: async () => {
      const r = await page.evaluate(() => window.__test.interactNearest());
      await pause(speed.step);
      return r;
    },
    pressKey: async (c) => {
      const r = await page.evaluate(k => window.__test.pressKey(k), c.key);
      await pause(speed.step);
      return r;
    },
    walk: async (c) => {
      const r = await page.evaluate(([d, ms]) => window.__test.walk(d, ms), [c.direction, c.ms || 300]);
      await pause(speed.step);
      return r;
    },
    // Debug shortcut: KO a hostile NPC without fighting it. Combat is a
    // dexterity test synthetic input cannot pass, so a hostile NPC otherwise
    // walls off everything behind it. Consequences still fire for real; only
    // the swinging is skipped. Logged as debugKO so a run can never be read as
    // having fought the NPC — say so in the report whenever you use it.
    debugKO: async (c) => {
      const r = await page.evaluate(id => window.__test.debugKO(id), c.id);
      await pause(speed.step);
      return r;
    },
    dismiss: async (c) => {
      const r = await page.evaluate(l => window.__test.dismissBlockingUi(l), c.label || null);
      await pause(speed.step);
      return r;
    },

    // Set a <select> in the open minigame: {"cmd":"select","field":"template","option":"urgent"}
    // field = index among mg getState().fields, or text matching the select's
    // id/name/class/label; option = value, or option text (exact, then substring).
    select: async (c) => {
      const r = await page.evaluate(([f, o]) => window.__test.minigame.select(f, o), [c.field, c.option]);
      await pause(speed.step);
      return r;
    },

    mg: async (c) => {
      // Containers render "Loading contents..." for a beat. A getState during
      // that window reports an empty container, and a caller concludes the
      // safe is empty. Wait it out first.
      if (c.action === 'getState') {
        for (let i = 0; i < 12; i++) {
          const loading = await page.evaluate(() => {
            const st = window.__test.minigame.getState();
            return !!(st && typeof st.text === 'string' && /loading/i.test(st.text));
          });
          if (!loading) break;
          await page.waitForTimeout(250);
        }
      }
      const r = await page.evaluate(([action, cargs]) => {
        const m = window.__test.minigame;
        if (typeof m[action] !== 'function') return { ok: false, reason: `no-such-action:${action}` };
        return m[action](...(cargs || []));
      }, [c.action, c.args || []]);
      if (['choose', 'chooseIndex', 'chooseMatching', 'continue', 'continue_',
           'pressKey', 'clickText', 'clickControl'].includes(c.action)) {
        // Deterministic: wait for the typewriter to finish and the dialogue to
        // become actionable again, rather than sleeping and hoping.
        await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 15000 })).catch(() => {});
        await pause(speed.dialogue);
      }
      return r;
    },

    waitFor: async (c) => {
      const t = c.timeoutMs || 20000;
      switch (c.kind) {
        case 'global':        return page.evaluate(([n, e, t]) => window.__test.waitForGlobal(n, e, { timeoutMs: t }), [c.name, c.expected, t]);
        case 'task':          return page.evaluate(([i, t]) => window.__test.waitForTask(i, { timeoutMs: t }), [c.id, t]);
        case 'minigame':      return page.evaluate(([i, t]) => window.__test.waitForMinigame(i || null, { timeoutMs: t }), [c.id, t]);
        case 'minigameClosed':return page.evaluate(t => window.__test.waitForMinigameClosed({ timeoutMs: t }), t);
        case 'event':         return page.evaluate(([n, t]) => window.__test.waitForEvent(n, { timeoutMs: t }), [c.name, t]);
        case 'movement':      return page.evaluate(t => window.__test.waitForMovementEnd({ timeoutMs: t }), t);
        case 'dialogue':      return page.evaluate(t => window.__test.waitForDialogue({ timeoutMs: t }), t);
        case 'condition':     return page.evaluate(([src, t]) => window.__test.waitUntil(src, { timeoutMs: t }), [c.fn, t]);
        default:              return { ok: false, reason: `unknown-wait-kind:${c.kind}` };
      }
    },

    /**
     * Open a conversation and drive it to the end in one command.
     *
     * Dialogue is where scripted runs die: an unfinished chat leaves the main
     * world input-locked, so every later movement or interaction is refused and
     * a run that isn't reading its results marches on regardless. This closes
     * the loop internally — continue while it continues, choose when it asks —
     * and returns the transcript plus what the conversation left behind.
     *
     * `choices` are regexes tried against the visible options; the first
     * option that matches any of them is taken. With no match it STOPS at that
     * choice point, leaves the conversation open and returns the options in
     * `stoppedAtChoice` (choices are real story decisions, so converse never
     * makes one nobody named). `explore:true` opts in to taking unvisited
     * options itself; `close:true` closes the conversation at a stop.
     * `maxTurns` bounds it so a genuine dialogue loop in a scenario surfaces as
     * a finding, not a hang.
     */
    converse: async (c) => {
      const patterns = c.choices || [];
      // Exploring (taking options nobody named) is opt-in: it commits real story choices.
      const explore = c.explore === true;
      let pendingChoice = null;
      const maxTurns = c.maxTurns || 60;
      const transcript = [];
      const picked = [];

      if (c.id) {
        const opened = await page.evaluate(id => window.__test.interact(id), c.id);
        if (!opened || opened.ok === false) return { ok: false, stage: 'open', opened };
      }
      await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 10000 })).catch(() => {});

      const seen = new Set();
      const seenLines = new Set();
      let staleLines = 0;
      let exhaustedBranches = false;
      let turns = 0;
      for (; turns < maxTurns; turns++) {
        const d = await page.evaluate(() => {
          const st = window.__test.minigame.getState();
          return st && st.dialogue ? st.dialogue : null;
        });
        if (!d) break;
        if (d.text) {
          const line = `${d.speaker || ''}: ${d.text}`.trim();
          // Hub conversations re-tell the same lines forever. Once nothing new
          // has been said for a while, the branches are spent — leave, rather
          // than burning the whole turn budget as Maya and Derek both did.
          if (seenLines.has(line)) { staleLines += 1; } else { staleLines = 0; seenLines.add(line); }
          transcript.push(line);
          if (staleLines >= 8) { exhaustedBranches = true; break; }
        }

        if (d.awaitingChoice && (d.choices || []).length) {
          const labels = d.choices.map(ch => ch.text || '');
          // Preference order: an explicit pattern; then an option not taken
          // before. Hub conversations keep offering the same options, so always
          // taking the first one loops forever — exhaust the branches instead.
          let idx = labels.findIndex(l => patterns.some(rx => new RegExp(rx, 'i').test(l)));
          if (idx < 0 && !explore) {
            // Never commit a choice the caller did not name: choices are real
            // story decisions (m01 took the fight option with Derek). Stop here,
            // leave the conversation open, and list the options.
            pendingChoice = { speaker: d.speaker || null,
                              options: labels.map((t, i) => `${i + 1}. ${t}`) };
            break;
          }
          if (idx < 0) idx = labels.findIndex(l => !seen.has(l));
          if (idx < 0) {
            // Everything on offer has been taken: the conversation is a hub with
            // nothing new left. Leave rather than circling.
            exhaustedBranches = true;
            break;
          }
          seen.add(labels[idx]);
          picked.push(labels[idx]);
          await page.evaluate(n => window.__test.minigame.chooseIndex(n), idx + 1);
        } else if (d.canContinue) {
          await page.evaluate(() => window.__test.minigame.continue());
        } else {
          break;
        }
        await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 15000 })).catch(() => {});
        await pause(speed.dialogue);
      }

      // Always leave the main world usable, whatever happened above, except
      // when stopped at an unnamed choice: that conversation stays open for the
      // caller to answer (close:true closes it anyway).
      const keepOpen = !!pendingChoice && c.close !== true;
      const closed = keepOpen ? { leftOpen: true } : await page.evaluate(() => {
        if (!window.MinigameFramework?.currentMinigame) return { alreadyClosed: true };
        return window.__test.minigame.close();
      });
      const after = await page.evaluate(() => {
        const st = window.__test.getState();
        return { activeMinigame: st.activeMinigame, inventory: st.inventory.map(i => i.name) };
      });
      // Zero turns means nothing was ever said: the target opened something
      // that is not a conversation, or opened nothing at all. That is not a
      // conversation driven to completion, so do not report it as one.
      const nothingHappened = turns === 0 && transcript.length === 0 && !pendingChoice;
      return {
        // ok:false at a stop: the run's rule is that ok:false means "stop and
        // decide", and a stop at an unnamed choice is exactly that (with the
        // conversation still open and the world input-locked unless close:true).
        ok: !pendingChoice && !after.activeMinigame && !nothingHappened,
        stoppedAtChoice: pendingChoice || undefined,
        turns,
        exhaustedBranches,
        hitTurnLimit: turns >= maxTurns,
        chose: picked,
        transcript,
        closed,
        inventory: after.inventory,
        reason: pendingChoice ? (keepOpen ? 'stopped-at-choice' : 'closed-at-choice')
          : after.activeMinigame ? 'still-open-after-close'
          : (nothingHappened ? 'no-dialogue-appeared' : undefined),
        hint: !keepOpen && pendingChoice
          ? 'Reached a choice nobody named and closed the conversation without answering it (close:true). Nothing was '
            + 'chosen. Run converse again with "choices":["<regex>"] to answer it, or "explore":true to let it pick.'
          : keepOpen
          ? 'Stopped at a choice nobody named (ok:false on purpose); the conversation is still open. Answer it with '
            + '{"cmd":"converse","choices":["<regex of the option>"]} (no id continues the open dialogue), '
            + 'or {"cmd":"mg","action":"chooseIndex","args":[n]}. Pass "explore":true to let converse '
            + 'pick unvisited options itself (that commits real choices), or "close":true to leave.'
          : nothingHappened
          ? 'The target opened no dialogue. Some interactables (phones, terminals) '
            + 'need a selection first — interact, inspect the minigame state, and drive it '
            + 'with `mg` rather than `converse`.'
          : undefined
      };
    },

    /**
     * Solve a lock minigame end to end.
     *
     * Key locks are a two-stage canvas interaction: click the key, then click
     * the keyhole that appears. The coordinates are reported as CENTRES, and
     * reading them as top-left corners silently does nothing — a mistake that
     * has cost a full run and half of one investigation. Nobody should have to
     * get that right by hand.
     *
     * `code` supplies the value for PIN and password locks.
     */
    lock: async (c) => {
      const read = () => page.evaluate(() => window.__test.minigame.getState());
      const steps = [];
      let lastInsert = null;
      const tried = new Set();
      let st = await read();
      if (!st) return { ok: false, reason: 'no-active-minigame' };

      // The lock renders its controls a beat after opening, so the first read
      // can show nothing to act on. Wait for it to become actionable rather
      // than concluding there is nothing to do.
      for (let i = 0; i < 24 && st; i++) {
        const ready = (st.keySelection && st.keySelection.length) || st.keyTarget
          || ((st.fields || []).length && c.code)
          || (st.pinLength !== undefined && c.code) || st.isComplete;
        if (ready) break;
        await page.waitForTimeout(250);
        st = await read();
      }
      if (st && !((st.keySelection && st.keySelection.length) || st.keyTarget
                  || ((st.fields || []).length && c.code)
                  || (st.pinLength !== undefined && c.code) || st.isComplete)) {
        return { ok: false, reason: 'lock-never-became-actionable',
                 finalState: { text: st.text, keyMode: st.keyMode, fields: st.fields },
                 hint: 'No key list, no keyhole, and no field to type into. If this is a PIN or '
                     + 'password lock, pass {"code":"..."}. Otherwise read `mg getState` and drive it by hand.' };
      }

      // 40 iterations: a wrong-key insert animation takes about 4s and the red
      // flash about 2s before the key list returns.
      for (let i = 0; i < 40; i++) {
        // Key lock, stage 1: choose a key. A named `key` wins. With none named,
        // try each held key in turn (first one not yet tried), else the first.
        if (st.keySelection && st.keySelection.length) {
          const want = (c.key || '').toLowerCase();
          const pick = (want && st.keySelection.find(k => (k.label || '').toLowerCase().includes(want)))
            || st.keySelection.find(k => !tried.has(k.label))
            || st.keySelection[0];
          tried.add(pick.label);
          lastInsert = null;
          steps.push(`select key "${pick.label || '?'}" at ${pick.x},${pick.y}`);
          await page.evaluate(([x, y]) => window.__test.minigame.clickCanvas(x, y), [pick.x, pick.y]);
        // Key lock, stage 2: insert it.
        } else if (st.keyTarget) {
          // Insertion plays an animation; the keyhole stays on screen while it
          // runs. Click it once and wait, rather than hammering it.
          const at = `${st.keyTarget.x},${st.keyTarget.y}`;
          if (at === lastInsert) { await page.waitForTimeout(400); st = await read(); continue; }
          lastInsert = at;
          steps.push(`insert key at ${at}`);
          await page.evaluate(([x, y]) => window.__test.minigame.clickCanvas(x, y),
                              [st.keyTarget.x, st.keyTarget.y]);
        // Password locks with a real text field: type it and submit.
        } else if ((st.fields || []).length && c.code) {
          steps.push('type code into field 0');
          await page.evaluate(code => window.__test.minigame.type(0, code, { submit: true }), c.code);
        // Keypad PIN locks have no field at all — they are tapped digit by
        // digit, exactly as a player does it.
        } else if (st.pinLength !== undefined && c.code) {
          steps.push(`tap ${c.code} on the keypad`);
          for (const digit of String(c.code)) {
            await page.evaluate(d => window.__test.minigame.clickText(d, { exact: true }), digit);
            await page.waitForTimeout(120);
          }
          // Some keypads submit on the last digit, others want a confirm key.
          const st2 = await read();
          if (st2 && !st2.isComplete) {
            await page.evaluate(() => window.__test.minigame.clickControl('enter'))
              .catch(() => {});
          }
        } else {
          break;
        }

        await page.waitForTimeout(400);
        st = await read();
        if (!st || st.isComplete || st.result) break;
      }

      // Let any success animation finish and the overlay close itself.
      for (let i = 0; i < 20 && st && !st.isComplete; i++) {
        await page.waitForTimeout(250);
        st = await read();
        if (!st) break;
      }
      const after = await page.evaluate(() => {
        const s2 = window.__test.getState();
        return { activeMinigame: s2.activeMinigame, room: s2.room };
      });
      return {
        ok: !!(st?.isComplete || st?.result === 'success' || !after.activeMinigame),
        steps,
        finalState: st ? { isComplete: st.isComplete, result: st.result, text: st.text } : null,
        activeMinigame: after.activeMinigame,
        room: after.room
      };
    },

    /** Everything interactable in a room, at any distance — for finding things. */
    room: async (c) => {
      return page.evaluate(id => window.__test.roomContents(id || null), c.id || null);
    },

    /**
     * Walk into an adjacent room: {"cmd":"enter","room":"<room id>"}.
     *
     * The work is done by window.__test.enterRoom (test-bridge/index.js), which
     * takes the doorway from the engine's own door placement, so it works in
     * both directions and after the door sprite has gone (opening a door
     * removes it on both sides). It opens a shut door, lines the feet up on the
     * gap and walks straight through, and reports each attempt's feet position
     * against the gap. A locked door comes back as `door-locked`: solve it
     * (moveToNear the door, interact, lock) and enter again.
     */
    enter: async (c) => {
      const target = c.room || c.id;
      if (!target) return { ok: false, reason: 'no-room-given' };
      return page.evaluate(t => window.__test.enterRoom(t), target);
    },

    /**
     * Open an inventory-tray item the way a click does: {"cmd":"openInventoryItem","item":"phone"}.
     * `item` is a tray index, item id, type or name (see __test.openInventoryItem).
     */
    openInventoryItem: async (c) => {
      const r = await page.evaluate(i => window.__test.openInventoryItem(i), c.item ?? c.id ?? c.name ?? c.type);
      await pause(speed.step);
      return r;
    },

    /**
     * Set CyberChef's input (and optionally recipe) and read the output:
     * {"cmd":"cyberchef","input":"Uryyb","recipe":"ROT13(true,true,false,13)"}.
     * The Crypto Analysis Station must be open (openInventoryItem "workstation").
     * Uses a paste event; do NOT hand-build `#input=<base64>` URLs (raw `=` padding breaks them).
     */
    cyberchef: async (c) => {
      const r = await page.evaluate(([t, rc]) => window.__test.setCyberChefInput(t, { recipe: rc || null }), [c.input ?? '', c.recipe || null]);
      await pause(speed.step);
      return r;
    },
    cyberchefOutput: () => page.evaluate(() => window.__test.readCyberChefOutput()),

    /** What is in the inventory tray, in order, with the ids/types openInventoryItem accepts. */
    inventory: () => page.evaluate(() => Array.from(document.querySelectorAll('.inventory-item')).map((img, index) => ({
      index, id: img.scenarioData?.id || img.objectId || null,
      type: img.getAttribute('data-type'), name: img.scenarioData?.name || img.alt || null
    }))),

    /** Doorways of a room (default: the current one), with gap, direction and lock state. */
    doorways: (c) => page.evaluate(id => window.__test.doorways(id || null), c.room || c.id || null),

    /** Text of every notification/toast shown since the last call. */
    toasts: async () => {
      const list = await page.evaluate(() => { const l = window.__toastLog || []; window.__toastLog = []; return l; });
      return { count: list.length, toasts: list, messages: list.map(t => t.title ? `${t.title}: ${t.message}` : t.message) };
    },

    drain: async () => ({ log: await page.evaluate(() => window.__test.drainLog()),
                          pageErrors: pageErrors.splice(0) }),
    note: (c) => page.evaluate(m => window.__test.note(m), c.message),

    screenshot: async (c) => {
      const path = c.path || `/tmp/playtest-${Date.now()}.png`;
      await page.screenshot({ path });
      return { ok: true, path };
    },

    // `fn` must be a function expression, e.g. "() => window.__test.scan(400)" or
    // "async () => { ... }". An async IIFE string ("(async () => {...})()") would
    // run here in Node instead of the page, so it is refused. Any error comes back
    // as ok:false rather than crashing the session.
    eval: async (c) => {
      const bad = (reason, message, hint) => Object.assign(new Error(message), { reason, hint });
      let f;
      try { f = new Function(`return (${c.fn})`)(); }
      catch (e) { throw bad('eval-failed', String(e && e.message || e).slice(0, 500)); }
      if (f && typeof f.then === 'function') {
        f.catch(() => {});
        throw bad('eval-not-a-function', 'fn evaluated to a promise',
          'An async IIFE ran in Node, not the page. Pass a function expression: "async () => { ... }".');
      }
      if (typeof f !== 'function') {
        throw bad('eval-not-a-function', 'fn is not a function', 'fn must be a function expression, e.g. "() => window.__test.scan(400)".');
      }
      try { return await page.evaluate(f); }
      catch (e) { throw bad('eval-failed', String(e && e.message || e).slice(0, 500)); }
    },

    speed: (c) => { Object.assign(speed, SPEEDS[c.value] || speed); return { ok: true, speed: c.value }; },

    /** What --flags supplied, and every <flag:N> used so far. Never earned in-game. */
    flags: () => ({ ok: true, configured: FLAGS.length, used: flagUses, logPath }),

    /**
     * Force the periodic state sync now. Globals and notes are otherwise
     * flushed on a 30s timer, so verify-run.rb can read a game that looks less
     * far along than it is. Call this before quitting.
     */
    sync: async () => {
      const ok = await page.evaluate(async () => {
        if (!window.stateSync) return false;
        await window.stateSync.sync();
        return true;
      });
      return { ok, synced: ok };
    }
  };

  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    const text = line.trim();
    if (!text) continue;
    let cmd;
    try { cmd = JSON.parse(text); }
    catch (e) { emit({ ok: false, error: 'bad-json', line: text.slice(0, 200) }); continue; }

    logLine('in', { cmd });
    if (cmd.cmd === 'quit') { logLine('out', { event: 'quit', commands: seq, flagsUsed: flagUses.length }); break; }
    cmd = substituteFlags(cmd, cmd.cmd);
    const handler = handlers[cmd.cmd];
    if (!handler) { emit({ ok: false, error: `unknown-cmd:${cmd.cmd}` }); continue; }

    try {
      const result = await handler(cmd);
      emit({ ok: true, cmd: cmd.cmd, result });
    } catch (err) {
      emit({ ok: false, cmd: cmd.cmd, error: String(err && err.message || err), ...(err && err.reason ? { reason: err.reason } : {}), ...(err && err.hint ? { hint: err.hint } : {}) });
    }
  }

  await browser.close();
  emit({ ok: true, event: 'session-closed', commands: seq, flagsUsed: flagUses.length, logPath });
  process.exit(0);
})();
