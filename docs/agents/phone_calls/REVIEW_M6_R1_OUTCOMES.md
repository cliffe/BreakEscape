# M6 (m07 Architect) review round 1 — outcomes

Fixer: opus48, 2026-11-12. Review: `REVIEW_M6_R1.md` (0 B, 2 M, 2 m, 7 n). Server: keyless :3028, headless,
stopped after. Proofs: `proofs/M6_r1/`. No m07 ink or config changed this round.

## Scope split (engine, not me)
- **M2** (the closing narration of every Architect call shows for under a frame) and **m2** (his hand-opened
  thread's look) are the engine sweep / part 2. Part 2 is in flight in this shared tree: `phone-call-lock.js`,
  `phone-chat-minigame.js` and `phone-ringer*.js` are uncommitted while these proofs ran. The terminal read
  beat (`TERMINAL_CALL_END_READ_MS = 2600`, `_waitForCallClipThen`) is already on disk there.

## Done

### M1 — route and proof docs (the "parked phone")
There is no parked phone. Walking a taunt's reply choices to `#exit_conversation` the way a player does ends
the call, closes the phone and frees the ringer, so the next taunt rings. The fault was the route's `IN_CALL`
(`m10_lib.sh`: `!!document.getElementById('call-end-button')`), which the terminal look never draws
(`phone-call-ui.js`), so `wait_call` timed out and `drive_taunt` left on its first check without ever clicking
a reply; the call stayed connected on its choices and a taunt coming due behind it queued — read as "the
ringer holds".

Route (`tools/phone_calls/routes/m6_live.sh`):
- Override `IN_CALL` to `window.phoneRinger.callActive() || #call-end-button` after sourcing `m10_lib.sh`
  (the shared lib is untouched).
- `drive_taunt` hardened (30 × ~2 s, returns the moment the call ends) so it walks each reply set to the end;
  added `tscreen` (terminal-look calls draw no `call-status-bar`/subtitles, so read `.message-text` /
  `.choice-button` directly).
- `replay` walks the replies to `#exit_conversation` (no back arrow). `signoff` no longer force-closes
  (`endMinigame(false)` removed) and no longer presets `debrief_requested`.
- Corrected `proofs/M6/PROOF.md` (driver note struck through + replaced, replay/replace/signoff bullets, the
  heard_* review), `HANDOVER_M6.md`, and `PHONE_CALLS_LOG.md` (a dated correction line; line 184 left intact).

### m1 — the `replace` case behind a real person-chat (reviewer's game 2158, reproduced 2191)
`replace` now holds a real **person-chat** (`ray_hollis`, via `player_spotted:ray_hollis`) rather than HaX's
phone thread. Game 2191: T-5 queued (q 1), T-1 **replaced** it (q 1), only T-1 rang on close, the thread holds
one `Call`. The old "behind a held HaX chat" was a phone-chat, so the taunt rang **inside the phone**
(`state: ringing`) rather than queuing. Recorded in PROOF.md.

### n1 — the heard_* claim (docs corrected, no ink change)
The taunts do not all re-assert every prior `heard_*`: `taunt_t1`/`_vm` omit `heard_t20` and `heard_t10`;
`taunt_t5`/`_vm` omit `heard_t10`. Nothing is stranded: only `heard_t30` (the later openers), `heard_t20` (the
T-10 fold, `:206`/`:589`) and `t1_first_contact` (`t1_close`) are read downstream, and T-10 cannot ring after
T-5/T-1. Making the full claim true needs several ink lines across `taunt_t1`, `taunt_t5` and the `_vm` twins,
not one line, so per the brief's preference I corrected the docs instead. No voiced line changed.

### n6 — `seattle` route case (added and proved)
Added a `seattle` subcommand. Game 2192: T-1 ringing, `countdown_expired` fired, `seattle_call` **replaced**
the ringing T-1; answered, walked to its end, one `Call` row; `/tts` carried seattle's own three lines.

### n7 — lab sheet clause
HacktivityLabSheets `_labs/safetynet/m07_architects_gambit.md:525` — the `[Bring me in.]` nudge now says HaX
puts you through "once all four flags are in; if a flag is still outstanding she tells you to finish the relay
first and call again", so the nudge stays true for a player who calls early. **Edited, uncommitted in HLS**
(outside this worktree) — commit left for the orchestrator. VM companion not opened.

## Re-run (keyless :3028, `proofs/M6_r1/`)
| Case | Game | Result |
|---|---|---|
| replay | 2188 | full answered T-30…T-1; each answered, **reply walked to `#exit_conversation`**, closes itself (`mg: null`), one `Call` row each (5), next taunt rings after each; each taunt's own `/tts` in order |
| replace | 2191 | behind a real person-chat; T-5 queued (q 1), T-1 replaced it, only T-1 rang, one `Call` row |
| seattle | 2192 | `countdown_expired` → `seattle_call` replaced the ringing T-1; walked, one `Call` row |
| signoff | 2195 | `sign_off` forced auto-answer, **no force-close** — reply walked to `signoff_close`/`#exit_conversation`; `architect_signoff_done=true`; **debrief stays shut** (no `debrief_requested`, `heldRecord=null`). Its self-close runs through the engine terminal read beat (part 2, uncommitted); `mg` had not gone null on that WIP — re-verify the self-close after part 2 commits |
| bring | 2196 | hub `[Bring me in.]` → CALLING → "Putting you through. He's waiting."; `debrief_requested=true`, `Outgoing call` row, Netherton ending armed (`heldRecord` names `closing_debrief`) |
| bring_notyet | 2194 | a flag out → "Not yet. Put the rest of the flags through the relay…"; `debrief_requested=true`, ending unarmed (`null`) |

Carried from the M6 run (unchanged by the route fix): decline_vm, vm_play, back_row, reload, later_first.

## Validators / keys (re-confirmed, nothing changed)
- `validate_scenario.rb` on m07: ✓ 0 errors (regenerates `dungeon_graph.*`, left unstaged).
- node `validator-phone-calls`: 0 fail.
- TTS key diff vs `keys_baseline/m07_architects_gambit.txt`: **+72 / −0**, no cross-mission clash.

## Left (reviewer deemed defensible; each would change a voiced line, so left to keep +72/−0)
- **n2** a late `taunt_t20_vm` can echo the T-10 fold (rare: needs his thread held from the decline to T-10).
- **n3** `t1_close` "He has hung up first every time" is untrue if the player cut earlier calls with the back
  arrow — left as his conceit.
- **n4** seattle's "You'll have the figure by morning" near-echoes the sign-off's "…by morning" (two calls ~10
  min apart) — left.

## For the orchestrator / part 2
- Commit the HLS lab sheet edit (path above).
- Re-verify the forced sign-off's own self-close (`mg: null`) once part 2 commits the terminal read-beat path.
- m2 look: `phoneTheme: "terminal"` is set on `the_architect`; part 2 confirms the engine lets it win for a
  withheld, hand-opened thread.
- Audio pass still owed: 72 clips (70 Architect/Sadaltager+voice-distortion, 2 HaX/Aoede).
