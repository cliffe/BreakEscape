# Chatter pool gate: live proof

Result: PASS for (a), (b) and (c). Headless, keyless server on port 3190 (PID 291683, stopped by PID; port closed afterwards).

## Games

- 9153: first run. The flip was never made (see script fix 1), so its phases are not evidence. Kept for the record.
- 9180: proof run. All numbers below come from this game.

Mission: test_chatter_pool_gate (id 276). No VM flags.

## Phases (game 9180)

| Phase | Gate (`chatter_gate_open`) | Gated lines | Plain lines | Chatted | Used (npc_used) | Use started |
|---|---|---|---|---|---|---|
| a. Gate open, before the flip (about 2 min) | true | 4 (ann x3, bob x1) | 2 (bob x2) | 16 | 2 (bob@45, ann@45) | 4 |
| b. After flipping gate_switch by play (about 2.5 min) | false | 0 | 6 (ann x3, bob x3) | 14 | 4 (bob@146, ann@150, bob@248, ann@252) | 2 |
| c. After page.reload() (about 2.5 min) | false | 0 | 8 (ann x4, bob x4) | 22 (total from the reload page) | 4 (bob@45, ann@46, bob@147, ann@149) | 4 |

Counts are per phase, from the window events after the throttle and the object-state read. Chatted counts include picture-only chatter (phase a: 10 picture-only, b: 8, c: 14).

## Checks

- (a) Gate open: PASS. Gated lines spoke (4) and Plain lines spoke (2). The cooler pair used it (2 use events).
- (b) After the flip by play: PASS. The gate read false after `interact('gate_switch')` and the "Close it" confirm. No Gated line in about 2.5 min. Plain lines continued (6). The pair kept walking to the cooler and using it (4 use events, 2 use starts).
- (c) After reload: PASS. The gate still read false after the reload. No Gated line in about 2.5 min. Plain lines continued (8), and the pair kept using the cooler (4 use events).

The gate was flipped only through the wall switch. No globals were set in the page and no game rows were edited.

## Script fixes (tools/playtest/chatter-pool-gate-proof.mjs)

1. Opening "Mission Brief" notes minigame. `interact('gate_switch')` was refused with `minigame-active` (game 9153), so the flip never happened and phases b and c were not a real test. Fix: `open()` now calls `window.__test.minigame.close()` up to 4 times after the blocking-UI dismissal, before `throttleFps(20)`. It runs on every load, including after the reload. Checks and assertions are unchanged.

No other changes. The script still has no pass/fail assertions. The pass/fail above comes from reading its output against the three checks.

## Environment notes

- Worktree: /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-chatter-gate, branch feat/chatter-pool-gate.
- Server: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true ... bundle exec rails s -p 3190`. Log at tmp/cg/server.log.
- Game creation: `tools/playtest/new-game.rb test_chatter_pool_gate` with PLAYTEST_PORT=3190, run as `bundle exec rails runner`.
- TTS blocked by the pathname predicate in the script (`/tts$`). Throttle after each load: fps 20, fixedStep true.
