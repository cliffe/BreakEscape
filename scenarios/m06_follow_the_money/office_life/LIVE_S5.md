# m06 office life: slice 5 live checks

Server: keyless (boot warning confirmed in tmp/server-3096.log), port 3096, worktree build/ol-m06, puma PID 2986396. Games from new-game.rb `m06_follow_the_money --unlock security_checkpoint --unlock trading_floor --unlock blockchain_lab --unlock irina_office`. Headless, setFPS(20), fixed steps on. Scripts: build scratchpad `live/` (s5c1.mjs, s5c1b.mjs, s5c2.mjs, s5c3.mjs, probes s5probe*.mjs). No scenario file changed, no globals set.

## 1. Coffee pair talk

Natural run, not seen. Game 7912, two windows of 8 min each (boot reloads the needs clock and the timeline repeats). Tomasz used the floor coffee alone at 176 s, Lerato alone at about 310 s, then hunger trips. They never overlapped. Chatter log empty.

Forced overlap (deviation from the brief, which asked for a natural break). `__test.needs.set` put caffeine at 5 on both NPCs at once, from idle at post, on a fresh game (7982). Not a global. Result:
- Both at floor_coffee within about 1 s (job_start, windup, pair_side_swap at about 3 s).
- 3.7 s: Tomasz bubble "Someone left a mug. Mine, I think."
- 8.8 s: Lerato bubble "Somebody has to answer the phones."
- Both returned to post by 16 s and idle by 24 s.

The bubbles are the world bubble layer (`npcWorldBubbles.bubbles`), not `.npc-bark` DOM, so the bubble check reads `npcWorldBubbles`. Games 7962, 7970 and 7977 show the same two lines in `npcChatterVoice.log` (spoken: true; no audio on a keyless server).

Plan levers (pizza, spare phone) not used. The pizza drop pulls both to the lab-floor magnet, not the coffee point.

## 2. Talk to Lerato and Tomasz

- Lerato (game 7987): interact ok, person-chat opens, 11 lines, 3 choices (choose 1 each), the game closes the chat itself after "I'll let you get on." Post state idle, atPost true, trading_floor, back at post immediately.
- Tomasz (game 8006): interact ok, 11 lines, exit via "I'll leave you to it." then "Thank you. Back to my queue." and the game closes the chat. Post state idle, atPost true.

Anomaly, not fixed, cause unknown. Game 7989 (Tomasz, first interact): `interact` returned `ok:false, reason:no-effect-confirmed`. Later probes on 7989 showed `minigame.isActive()` true with no `#person-chat-root` and no readable dialogue for 8 s. The same probe on Lerato (7987) also showed no DOM root after 4 s, yet the dialogue read fine, so the root check is not a reliable signal headless. Tomasz opened and ran cleanly on a fresh game (8006). Game 7989 had been booted about five times by probes before this, which may matter; not tested.

## 3. Exchange ex_dani_tomasz_late_shift

Dani talked to first (trader_npc, 48 dialogue steps, closed by game). Three fresh games:

| Game | Watch | Dani | Tomasz | heard_ex_dani_tomasz_late_shift |
|---|---|---|---|---|
| 8007 | 300 s | coffee 0 to 19 s (first-talk break), then idle | coffee alone at 151 s, hunger at 246 s | not true |
| 8021 | 420 s | same | coffee alone at 153 s, hunger at 245 s | not true |
| 8043 | 420 s | same | coffee alone at 155 s, hunger at 249 s | not true |

Dani's break ends by 19 s, and Tomasz's caffeine trip starts about 135 s later, so they do not meet at the coffee point. No exchange line, no chatter lines. The timeline matches across the three games.

## 4. Other two exchanges

Not reachable in a short run (story states needed). Not attempted, no globals set.

## Not run / open
- A natural coffee pair was not seen in 16 min of play. Whether a pair happens within an hour is unmeasured.
- The exchange needs a second Dani coffee need near Tomasz's trip. Not forced, to respect the brief.
- The no-DOM-root anomaly on game 7989 needs a repeat on a fresh game if it matters.
