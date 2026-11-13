# Review M1 R5: m09 light round after engine R1 (Torres, Nightshade, Gary, HaX)

Reviewer: Opus, 2026-11-12. Code under test: `7fecbed08` (engine `464c42064`, `d05dad42d`; m09 `2b95f6e70`). HEAD moved to `239ca247d` during the round, docs only, so no code changed under the runs (the route logs print `engine HEAD: 239ca247d`). Keyless server on :3028 with its own pid file, headless, stopped afterwards. Proofs in `proofs/R_m07_m09/` (`m09_*_run.txt`, screenshots, session and `/tts` logs, `m09_r5.sh`). Routes: `tools/phone_calls/routes/m09_m1_live.sh`, `proofs/PS_m09/m09_ps_extra.sh` and `proofs/PS_m09/hax_label.sh`, all with `OUT=proofs/R_m07_m09`.

**Verdict: accept. 0 B, 0 M, 0 m, 2 n. Nothing is above a nit.** The M1 R4 Major is fixed: Torres survives the lid opening, ringing or on hold.

## What I ran (real path unless stated)

| Route (game) | Result |
|---|---|
| `torres_ring_open` (2313) | Torres rings over the lid. Lid code typed while he rings: the ring **carries on** over the open container (`hl_box_opened` true), keeps ringing after the container closes, then rings out into one `Missed call` row and a Call back (`{knot: call}`). No second ring. **PASS** (M1 R4 Major fixed). |
| `torres_hold_open` (2316) | Answer puts him on hold (`held`). Lid code typed: still `held` over the container. Closing the container **connects the call** ("I gave you this address back in October…") and it plays on. **PASS.** |
| `torres_once` (2320) | One ring over the lid, Decline: `torres_rang` true, Call back only, one Missed call row. Opening the lid rang nothing in 8 s. The Call back plays his call to the end. **PASS.** |
| `readout_full` (2332) | Read-out to [Got it], then one Nightshade ring after the card line, played through. No ring after a room move. **PASS.** |
| `first_choice_close` (2342) | Closed at the first choice (`read_heard` true, `read_done` false): no ring for 8 s; the backstop rang once on the move to the reading room; none on the way back. **PASS.** |
| `readout_reload` (2343) | Card line heard, then sync, close and reload inside the 3 s delay. One ring after the reload, played through, none after a room move. **PASS.** |
| `gate_direct` (2344) | Read-out never opened. Toast at 6.5 s, gate tried at 7.0 s, **ring at 17.1 s** (the 10 s fallback). One ring; none after walking back. **PASS.** |
| `gary_hold` (2325) | Rings over the salvage keypad ("Answer puts them on hold until you close this"). Answer gives the on-hold pill with the keypad open; closing the keypad connects ("It's Gary. Whitlock, from St. Catherine's…"), which plays to the end. **PASS.** |
| `hax_label` (2348) | Seeded flag 1, flag 3 and file held, so the identity scene opens on load as her voiced call. Recorder installed before bootstrap: caption **"SAFETYNET secure line"** on `PhoneChatMinigame:agent_0x99, voiced=true`. **PASS** (see n1). |
| `hax_banner` (2347), synthetic | m09 has no HaX ring mapping: all her calls are forced. To read the banner I offered one ring on her contact by hand (`_handleEventMapping`, `m09_r5.sh hax_banner`). Banner: **"Agent HaX / SAFETYNET secure line / Incoming call"**; answered, the call caption read the same. **PASS** for the `d05dad42d` fallback. |

The four Nightshade orders are the read-out heard in full, closed at the first choice, reloaded inside the delay, and skipped for the gate. Each rang exactly once. With the `cage_opened` mapping gone (`2b95f6e70`), mappings 1 to 3 cover every path I can find, as R4 n1 argued.

## Lab sheet (`m09_digital_archaeology.md`)

Matches play. The sheet doesn't walk through the optional carry-over calls (Torres, Nightshade, Gary), so none of this round's changes touch it. The recruiter's forced call (line 364 onward), the identity scene (478) and "[Bring me in.]" (512) read as they play. The Victoria maintenance-code warning (344) says nothing about a Nightshade ring, so removing that mapping needs no edit.

## Nits

- **n1 (UI, carried from R4 n4).** The call screen still shows "Voice call" for about 500 ms (0.8 s to 1.3 s in `m09_hax_label_run.txt`) before the caption becomes "SAFETYNET secure line". It is the template default in `phone-call-ui.js`, set before `callLabelFor` runs, and is the same in every mission. Starting it empty would fix it.
- **n2 (route hygiene).** The R4 `hax_label` route relies on bootstrap playing the identity scene through. A recorder installed after bootstrap sees nothing, and closing her thread did not re-ring `identity_resume` in that run (2346, `m09_r5.sh hax_label`; the bootstrap had already finished the scene). Not a game fault. Future label checks should use `PRE_EV`, as `PS_m09/hax_label.sh` does.

## Asked, answered

- Torres rings once, and opening the lid while he rings or is on hold doesn't drop him: yes, both.
- Nightshade's four orders each ring once: yes.
- Gary rings over the keypad: yes, and holds until it closes.
- HaX's ring banner and calls show "SAFETYNET secure line": the call caption, live, yes. The banner, yes, on a hand-offered ring, because m09 never rings HaX.
