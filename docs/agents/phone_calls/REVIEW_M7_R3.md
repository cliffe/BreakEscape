# Review M7 round 3 (m03: revelation call, fallback ring, bring-in, after the engine sweep)

Reviewer: Opus 5.5, 2026-11-12. Light post-sweep round. Code under test: `ff4f929ee` (branch `build/phone-calls`, engine sweep `752d9d612`, `88862563c`, `40a15667c` committed; no uncommitted engine edits in the tree). Inputs: `REVIEW_M7_R2.md`, `ENGINE_SWEEP.md`.

**Verdict: accept with one config fix. 0 B, 0 M, 1 m, 1 n.** All the requested cases pass live. The one minor finding predates the sweep: the fallback ring's banner has no "SAFETYNET secure line" caption.

## Live check (keyless :3023, headless, server stopped afterwards)

Logs, TTS logs, game ids and a few screenshots are in `proofs/PS_m01_m03/` (`m03_*.txt`). Route: `tools/phone_calls/routes/m07_live.sh`, plus `proofs/PS_m01_m03/m03_caption.sh` for the call-screen caption.

| Case | Game | Result |
|---|---|---|
| `call_button`: HaX called from her thread | 2202 | The header shows "Call" after the distcc flag. CALLING, then "Logs are up on my side." The call plays to the end. `revelation_heard` true, the header button gone, one row "Outgoing call, 0:22", one `conversation_closed`. There was no fallback ring in the 125 s after the call. |
| `hub_topic`: called through the hub choice | 2218 | The same call and the same result. One `conversation_closed`, nothing ringing afterwards. |
| `fallback_ring` | 2230 | Rang 121 s after the flag (`m2_revelation_call`). This confirms the sweep's 8b fix on m03: the mapping's own `revelation_ring_offered` latch no longer drops the ring. Decline left one Missed call row and "Call back", which opened on "Knew you'd get back to me." |
| `decline_reload` | 2244 | Ring at 121 s, `offered` true. Decline, then reload: `offered` true, `heard` false, nothing ringing and no banner for 150 s, still one row. Call back works and opens on the callback line. |
| `bring_clear` | 2262 | "Bring me in" dials. "Not yet" ends the call with `call_in_after_sweep:locked`. The redial opens "Still in there...". Bring me in completes the task. On my way shows no overlay. "Leave her to us." plays, then the person-chat debrief. One `conversation_closed` per call. |
| `bring_optional` | 2266 | The overlay lists only "Talk to the consultant, Danny Foster". Keep going leaves the call open on "On my way." with no last line requested. End returns to the hub. On the second redial, End the mission now plays the last line and the debrief opens. |
| Caption (`m03_caption.sh`) | 2232, 2240 | The hub topic call and the bring-in call both show `call-caption` "SAFETYNET secure line", while dialling and on the call (`cap_topic_call.png`, `cap_bring_call.png`). |

## Findings

### m1. The fallback ring banner has no caption
The banner read "Agent HaX | Incoming call | Answer | Decline" (`fallback_ring_banner.png`, games 2230, 2244). m01 and m04 show "Agent HaX | SAFETYNET secure line | Incoming call". The README (`README_scenario_design.md:1915`) says the incoming banner takes only the mapping's `callLabel` ("put it on the ring mapping"). The contact-level `callLabel` (`scenario.json.erb:745`) covers the call screen but not the banner. m01 has it on its ring mapping (`:761`). This predates the sweep. Fix (config only): add `"callLabel": "SAFETYNET secure line"` to both ring mappings: the `global_variable_changed:flag_distcc_submitted` ring (around `:1025`) and its `game_loaded` twin (around `:1036`).

### n1. Route: `glob start_debrief_cutscene` still prints the eval envelope
R2 n3, unchanged: `m07_live.sh` prints `debrief={"ok":true,"cmd":"eval"}` (and `mission_complete=` in `bring_optional`), because m03 has neither global. The debrief is still proven by `mg="PersonChatMinigame person-chat"` and `victoria_choice_made`. Change it when the route is next edited.

## Checks that passed (no finding)
- **Item 1 (`conversation_closed` once):** exactly one per call in every case, including the two calls in each bring-in run. The doubled `global_variable_changed:revelation_heard` / `victoria_choice_made` events also appear in R1/R2 proofs and come from the global being set twice at the same instant. They are not a sweep change, and the mappings on them are latched.
- **Items 8/8b (re-check ignoring self-set terms):** the fallback ring and its decline/reload path behave as in R2.
- **Item 7 (`callbackWhen`), item 10 (terminal read beat):** m03 sets no `callbackWhen` and no terminal theme, so neither applies.
