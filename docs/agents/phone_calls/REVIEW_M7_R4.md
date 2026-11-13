# Review M7 round 4 (m03: fallback ring, bring-in, after ringWhile and the banner caption fix)

Reviewer: Opus 5.5, 2026-11-12. Light round. Code under test: committed `7fecbed08` (engine `464c42064` ringWhile, `45ece8b8a`/`d05dad42d` banner falls back to the contact `callLabel`). No uncommitted engine or m03 scenario change (only m03's regenerated dungeon graph). Inputs: `REVIEW_M7_R3.md`, the latest log entries.

**Verdict: accept. 0 B, 0 M, 0 m, 2 n. Nothing is above a nit.** R3 m1 (no caption on the fallback ring banner) is fixed on the real path by the engine fallback.

## Live check (keyless :3023, headless, server stopped afterwards)

Proofs in `proofs/R4_m01_m03_m04/` (`m03_*.txt`, `decline_reload_*`, `bring_clear_*`, `bring_optional_*`). Route: `tools/phone_calls/routes/m07_live.sh`.

| Case | Game | Result |
|---|---|---|
| `decline_reload` | 2301 | Ring 121 s after the distcc flag, knot `m2_revelation_call`. **Banner: "Agent HaX / SAFETYNET secure line / Incoming call / Answer / Decline"** (`decline_reload_banner.png`). Decline leaves one "Missed call" row. Reload: `revelation_ring_offered` true, `revelation_heard` false, nothing ringing and no banner for 150 s, still one row. Call back in the header opens on "Knew you'd get back to me. Open your copy and read along." and plays the ledger. |
| `bring_clear` | 2326 | "Bring me in" dials. "Not yet" plays "Go on, then. She's not leaving her desk tonight." and leaves `call_in_after_sweep` locked. The redial opens "Still in there...". Bring me in completes the task; On my way shows no overlay; "Leave her to us." then the person-chat debrief. One `conversation_closed` per call. |
| `bring_optional` | 2338 | Same first call. The overlay lists only "Talk to the consultant, Danny Foster". Keep going leaves the call open on "On my way." with no last line requested; End returns to the hub. On the second redial, End the mission now plays "Leave her to us." and the debrief opens. One `conversation_closed` per call. |

m03 does not use `ringWhile`, so its rings now follow rule 7 (no re-check after firing). The decline/reload path shows no second ring, which is what the latch is for.

## Lab sheet

`HacktivityLabSheets/_labs/safetynet/m03_ghost_in_the_machine.md:87` (ring her from the thread or the topic; after two minutes she rings; Call back if missed; bring-in, Not yet ends the call) and `:457` (Bring me in, On my way, the optional-objectives question, Keep going leaves the call open) match.

## Findings

### n1. Route: `glob start_debrief_cutscene` still prints the eval envelope
Carried from R2 n3 / R3 n1. `m07_live.sh` prints `debrief={"ok":true,"cmd":"eval"}` and `mission_complete=...` the same way, because m03 sets neither global. The debrief is proven by `mg="PersonChatMinigame person-chat"` and `victoria_choice_made`. Change it when the route is next edited.

### n2. `decline_reload` logs no events
The route installs its event listener again after the reload, so `evs` returns `[]` for a run that spans a reload. Rows and globals carry the proof here. Route nit only.
