# Review M1 R4: m09 post-sweep light round (Nightshade, Torres, Gary, HaX)

Reviewer: Opus, 2026-11-12. Keyless server on :3026 (own pidfile), headless, stopped afterwards. Proofs in `proofs/PS_m09/`: run logs (`*_run.txt`), the extra routes `m09_ps_extra.sh` and `hax_label.sh` (both source `tools/phone_calls/routes/m09_m1_live.sh`), and `keys_diff.txt`.

**The engine moved during this round.** I started on ff4f929 (sweep part 2 plus dd2ba4ae5). At 21:07 `45ece8b8a` landed: the item-8 ring re-check now covers `!globalVars.x` terms and the global half of mixed `data.* && globalVars.*` conditions (M4 R3 m1). Runs started before 21:07 used the old re-check: `readout_full`, `gate_direct`, `first_choice_close`, `readout_reload`, `torres_once`, `gary_hold` and `victoria`. Runs started after it used the new one: `file_held`, `torres_ring_open`, `torres_hold_open`, `gate_ring_readout` and `hax_label`. Each run log after 21:07 prints `engine HEAD: 9b1b6e524`. The Major below comes from `45ece8b8a`, not from m09.

## Verdict

**1 blocker: none. 1 major, 0 minor, 4 nits.** Every case the brief asked for passes. The one problem above a nit is new: since `45ece8b8a`, Torres's call is dropped without a trace if the player opens the lid while he rings, or after Answer has put him on hold. That is the most likely thing a player does at that moment.

## What I ran (real path from the drop terminal unless stated)

| Route (game) | Result |
|---|---|
| `readout_full` (2205) | Read-out played to [Got it]. One Nightshade ring after the card line (`flag1_read_done` true), played as `nightshade_phone`. No second ring after a room move. **PASS.** |
| `gate_direct` (2213) | Read-out never opened. Timeline: terminal closed at 0.5 s, HaX toast at 6.1 s, gate tried at 6.4 s, **Nightshade rang at 16.5 s**. That is 10.4 s after the toast and 10.1 s after the gate try, so nothing rang within 10 s of the toast. The fallback rang once and played the else arm ("Sorensen's card is on custom keys"). No ring after walking back. **PASS.** |
| `first_choice_close` (2222) | Closed at the three-option menu (`read_heard` true, `read_done` false). No ring for 8 s. Walking to the reading room rang him once (backstop). No second ring. **PASS.** |
| `readout_reload` (2234, then 2242) | Run 1 was a harness flake. Crossing into the stacks took about 10 s, so HaX's read-out toast came and went before the tap (see n3). Run 2: card line played, then sync, close and reload inside the 3 s delay. One ring after the reload, played through, none after moving rooms. **PASS.** |
| `file_held` (2270) | `nightshade_file_held` seeded with `--set` (the late arm). Real path otherwise: read-out, ring, Decline (leaves a Call back), Call back from his thread. The call played and **/tts was asked for "So you've found my file. Never mind the boy in it. Look at the handwriting."** as `nightshade_phone`. No clip yet, as expected. |
| `torres_once` (2251) | One ring over the lid. Decline: `torres_rang` true and only a Call back (`{knot: call}`), one Missed call row. Opening the lid did not ring again within 8 s. The Call back plays his call. **PASS** (old re-check; decline-first is not touched by `45ece8b8a`). |
| `gary_hold` (2254) | Rings over the salvage keypad ("Answer puts them on hold until you close this"). Answer gives the on-hold pill with the keypad still open. Closing the keypad connects the call ("It's Gary. Whitlock, from St. Catherine's…"), which plays to the end. **PASS.** Its condition is `data.* && globalVars.m02_gary_protected`, and an import cannot change mid-ring, so `45ece8b8a` cannot drop it. |
| `hax_label` (2279) | Seeded `flag1/flag3_submitted` and `nightshade_file_held`, so HaX's identity scene opens on load as her voiced call. A recorder installed before bootstrap logged the call screen: **caption "SAFETYNET secure line"** on `PhoneChatMinigame:agent_0x99, voiced=true`. **PASS** (see n4). |
| `victoria` (2269), `cage_opened` path | Imports add `m03_victoria_fate: recruited`. Terminal, stacks, HaX's thread from the contact list. The dock choices came first, because `--start-room` skipped the dock call. Then the hub diverted to the read-out (`flag1_read_heard` true), then "Something else.", the card line and the hub, then "Can Victoria's people get me through that gate?". The code cage opened (`maintenance_code_used`, `cage_opened` true). Closing HaX rang Nightshade 2.8 s later through **mapping 1**, playing the "You're past her gate" arm. No second ring in 12 s, which is past the cage_opened mapping's 10 s, or after a room move. **PASS, but the new mapping never took part** (n1). |
| `torres_ring_open` (2271), new engine | Lid open, Torres rings, the player types the lid code without answering. The **ring vanished when the lid opened**: no Missed call row, no Call back. `torres_rang` stayed true, so no later mapping can ring. **FAIL** (M1). |
| `torres_hold_open` (2272), new engine | Torres rings, Answer puts him on hold, the player types the lid code. The **held call vanished**: no call, row or Call back. Here `torres_rang` came back false, so the `room_exited:sorensen_office` fallback could still ring later. The lid-moment call is lost either way. **FAIL** (M1). |
| `gate_ring_readout` (2273), new engine | Nightshade's gate fallback rings, and the player opens the phone and HaX's contact instead of answering. The phone showed the ring inside the handset (row 10), so the read-out never started and `flag1_read_heard` stayed false. The ring rang out and left a Missed call row and a Call back. The new re-check did not drop it (n2). |
| Key diff (`keys_diff.txt`) | Against `d54c62fe0^`: **411 → 411, one re-key**, `89cf88a1…` → `1276af28…` ("Never mind the boy in it. Look at the handwriting."), both `nightshade_phone`. Against `dd2ba4ae5^`: 411 → 411, nothing moved (callLabel is not spoken). |

## Findings

### Major

**M1 (engine, from `45ece8b8a`; m09 config shape). Torres's call is dropped silently when the lid opens under it.**
The lid ring is `object_interacted … && !globalVars.torres_called && !globalVars.torres_rang && !globalVars.hl_box_opened` (`scenario.json.erb:1020`).
- Since `45ece8b8a`, the ring re-check keeps the global-only terms of a mixed condition and drops the `torres_rang` latch. That leaves `!torres_called && !hl_box_opened`.
- `hl_box_opened` is set by HaX's `item_unlocked:hl_box` mapping (`:405`), and the ring is shown over the lid's password screen. So the moment the player types the code, which is the very task he rings over, the ring or the held call is dropped. The player sees no row, no `phone_call_missed` and no Call back.
- In the ringing case the latch stays set, so the `item_unlocked` and `room_exited` mappings never ring him again. His call, and the sleeper-shortlist lead it carries, are gone for that playthrough.
- In the held case the player has already pressed Answer, and the call still disappears.
- Proven live: `torres_ring_open_run.txt` and `torres_hold_open_run.txt`.

The term was only ever meant to gate the first offer: "the lid ring over the shut box". His knot already branches on `hl_box_opened`, so the call is still right after the lid opens. Two ways to fix it (the orchestrator picks):
- *m09 config:* drop `&& !globalVars.hl_box_opened` from `:1020`. `!torres_rang` already stops a ring at an opened box once the `item_unlocked` ring (`:1022`) has latched, and the lid takes the file number from flag 2 (`:1487`), so flag 2 is in by then. Re-prove with `X=torres_ring_open` and `X=torres_hold_open` in `proofs/PS_m09/m09_ps_extra.sh`: expect the ring to survive the lid opening and the held call to open when the container closes.
- *Engine (the general shape):* never drop a call the player has answered and put on hold. When the re-check drops an offer whose mapping latched at offer time, leave a Missed call row and a Call back rather than nothing. The m05, m03 and m04 rounds should scan for the same shape: a ring with a `!globalVars.x` term that the action it rings over will flip.

### Nits

- **n1 (config, dead mapping). The fourth Nightshade mapping (`global_variable_changed:cage_opened`, `:990`) can't fire, and the R3 n3 gap it was added for does not exist.** Victoria's code is a HaX hub topic (`m09_phone_agent0x99.ink:896`). The hub diverts to `flag1_read` whenever `flag1_submitted && !flag1_read_heard` (`:754`), and the stacks, where the topic needs `stacks_entered`, open only on flag 1 (`scenario.json.erb:228`). So the player has always heard the read-out before the code, and `!flag1_read_heard` is false by the time `cage_opened` changes. Mapping 1 or the backstop rings him instead, which the `victoria` run shows. The mapping is harmless and could stay as a guard in case the hub guard ever changes. If it stays, its comment (`:987-989`) should say so rather than describe a path that can't happen.
- **n2 (engine shape, no effect seen).** The gate fallback (`:982`) is mixed too. After `45ece8b8a` its kept terms are `flag1_submitted && !flag1_read_heard && m08_nightshade_triple_agent`, so if the read-out played while he rang, the ring would drop and the latch would hold: never. Live, opening the phone during his ring shows the incoming call in the handset, so the read-out can't start until he is answered or declined (`gate_ring_readout`). The ring rang out normally. I see no path to it. Covered if the engine half of M1 keeps a Call back for a dropped latched ring.
- **n3 (harness).** Twice, crossing into the stacks took about 10 s under load, and by the time the route tapped HaX's "First box is in" toast it had been replaced by later HaX texts: the Victoria line, then the field-guide offer at 15 s (`diag_victoria_run.txt`). The text stays in her thread, so a player loses nothing. `tap_readout` could fall back to opening her thread from the contact list.
- **n4 (UI, one frame).** The call screen shows "Voice call" for about 100 ms before the caption becomes "SAFETYNET secure line" (`hax_label_run.txt`: 1.5 s, then 1.6 s). That is the template default in `phone-call-ui.js:67`, set before `callLabelFor` runs, and it is the same for every mission. It could start empty.

## Asked, answered

- Nightshade: full read-out, one ring after the card line; gate route, nothing within 10 s of the toast (10.4 s), then the fallback; first-choice close, the backstop on the next move; reload, one ring. All pass.
- The new file-held line was requested from /tts (seeded late arm, real Call back).
- Torres: rings once; Decline leaves only the Call back. Passes, but see M1 for the lid-open case on the new engine.
- Gary: rings over the keypad and holds. Passes.
- HaX: the voiced call shows "SAFETYNET secure line". Passes.
- `cage_opened` ring: the Victoria path was reached live. It rings once through mapping 1, and the new mapping is unreachable (n1).
- Keys: 411, with the one re-key.

Some proof files from the later runs (session logs and screenshots for `victoria` runs 2–4, `file_held`, the Torres drop routes, `gate_ring_readout` and `hax_label`) never reached `proofs/PS_m09/`, although the harness reported writing them. The `*_run.txt` logs are the record for those runs.
