# Writer notes — HaX calls (Part B ink)

Writer owns HaX's ink: every HaX call, ring, callback/slow-answer line, bring-in and the hub choices that place them, in m01, m03, m04, m05, m06, m07 (HaX bring-in only), m08. Ink and ERB-reword text only; no config keys, no event mappings (a later implementer does config per 7.2). Each new call knot is unreached on this branch until config exists.

Order worked: m01 (M8), m03 (M7), m04 (M4), m05 (M5), m06+m08 (M10), m07 bring-in (M6).

Line tables below: V = voiced (call knot), T = text thread (not voiced). "Config needed" = what the implementer must add for the knot to be reached (from 7.2).

---

## m01 (M8) — DONE, committed

File: `scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink`

### first_ring (new call knot, incoming)

| Line | Before | After | V/T |
|---|---|---|---|
| opener (callback) | — | "You rang back. Good habit." | V (new) |
| opener (slow, `call_answer_seconds > 10`) | — | "Took your time. Fine, nothing's on fire yet." | V (new) |
| opener (plain) | — | "You're in. I wanted the line tested before you go dark." | V (new) |
| body 1 | — | "A voice carries down those corridors. Someone hears one where there shouldn't be, and the cover's gone." | V (new) |
| body 2 | — | "So from here it's texts. Quiet, deniable. Message me the moment you're stuck and I'll walk you through it." | V (new) |
| reply (fast?) | — | "Then you message me fast. I'm on the thread the whole way. Go." | V (new) |

Declared `VAR call_answer_seconds = 0`, `VAR call_is_callback = false` at file top. Ends `#exit_conversation` then `-> DONE` on both choices. `// lint: call-knot`.

Voiced new: 6.

### closing_debrief (rewritten existing knot → bring-in hand-off)

| Line | Before | After | V/T |
|---|---|---|---|
| opener (launched) | "Operation Shatter went through — the attack hit. Let's review what happened." | "It went through. Not on an open line. Come back to HQ." | V (re-key) |
| opener (else, neutralised) | "Operation Shatter is neutralized. Let's review what happened." | "Shatter's dead in the water. Pack up and come in. We'll do it properly at HQ." | V (re-key) |
| last line | — | "Walk out the way you came in. As far as Viral Dynamics knows, you were never here." | V (new) |

`// lint: call-knot` added. Last line sits **after** `#ending_check` + `#set_global:start_debrief_cutscene:true` inside `[On my way]`, so "Keep going" drops the global and the line (ending-check.js line-level form). Kept `-> END` (mission-ending debrief).

Hub choice `[Operation Shatter resolved — I'm ready for debrief]`: body changed from `-> closing_debrief` to `#place_call:closing_debrief` / `-> DONE`.

Voiced new: 1; re-key (openers change wording so really new clips): 2 openers.

### Text reword

`:417` (knot `mission_commitment`) "Call me if you need support." → "Message me if you need support." (T, no audio).

### Config the implementer must add (M8), else the branch flow is broken
- `agent_0x99` gets `call: [{ knot: "closing_debrief", button: false }]` — the hub choice now dials via `#place_call`; without the `call` entry the choice ends the story with no call. The in-person debrief mapping (`start_debrief_cutscene`) still waits for the call (2.9).
- New ring mapping on `agent_0x99` for the first office entry (`main_office_area`): `conversationMode: "phone-chat"`, `targetKnot: "first_ring"`, `ring: { onMissed: "callback" }`, suitable `delayMs`.
- Decline/miss follow-up text mapping on `phone_call_declined:agent_0x99` / `phone_call_missed:agent_0x99` → a one-line text, **"Texting from here, then."** (not voiced).
- `first_call` and `support_hub` untouched; the 3 s timed first message stays.

### Checks
- Compile OK (only pre-existing END warnings on the debrief). dialoguelint: no new warnings from my lines. Validator: 0 errors; warnings/suggestions all pre-existing.

Voiced lines this mission: **9 new** (6 first_ring + 1 last line + 2 re-worded openers), 0 pure re-key.

---

## m03 (M7) — DONE, committed

File: `scenarios/m03_ghost_in_the_machine/ink/m03_phone_agent0x99.ink`; ERB `scenario.json.erb`.

Declared `VAR call_answer_seconds = 0`, `VAR call_is_callback = false` at file top.

### m2_revelation_call (outgoing call, fallback ring) — rewrite

| Line | Before | After | V/T |
|---|---|---|---|
| guard (already heard) | `{ revelation_heard: -> hub }` | `{ revelation_heard: #exit_conversation / -> DONE }` | — |
| opener (callback) | — | "Good, you rang back. Your distcc flag landed while you were busy -- open your copy and read along." | V (new) |
| opener (slow, `>10`) | — | "There you are. Your distcc flag landed, and the whole log came with it. Open your copy and read along." | V (new) |
| opener (plain) | "{player_name()}, your distcc flag just landed -- the whole transaction log came through with it. Open your copy and read along." | "Your distcc flag just landed -- the whole transaction log came through with it. Open your copy and read along." | V (re-key, name dropped) |
| m2_revelation_impact | "And {player_name()} -- the logs point at a Phase 2. ..." | "And listen -- the logs point at a Phase 2. ..." | V (re-key, name dropped) |
| m2_revelation_end | ends `-> hub` | ends `#exit_conversation` / `-> DONE` | V (text unchanged) |

Call knots marked `// lint: call-knot`: m2_revelation_call, _choices, _impact, _impact_choices, _end. No knot diverts to hub/start. Mid-call reply/impact lines unchanged in wording.
Call-VAR openers added per 3.6 (the ring can be missed → callback; incoming ring can be answered slowly). On the common outgoing path both VARs are default → plain opener.

### extract_call (bring-in, renamed from extract_offer) — rewrite (7.6 m03 row)

| Line | Before | After | V/T |
|---|---|---|---|
| opening | "Once you're out, you don't go back in. Anything you haven't read stays for the search team." | "Last look. Once you're out, the search team has that building." | V (re-key) |
| safe line (conditional) | "The server room safe's still shut, for one." | (unchanged) | V |
| [Bring me in.] reply | "Car's at the side door. Two minutes." | "Side door, two minutes. Don't use the lobby." | V (re-key) |
| "Not yet" reply | "Take your time. She isn't going anywhere." (`-> hub`) | "Go on, then. She's not leaving her desk tonight." (`#exit_conversation` / `-> DONE`) | V (re-key) |
| [On my way.] | plain | `[On my way. #ending_check]` (bracket form) | — |
| last line | "See you at HQ." | "Leave her to us." | V (re-key) |

`#complete_task:call_in_after_sweep` moved from extract_go onto the [Bring me in.] reply. `#set_global:victoria_choice_made:true` + `~ victoria_choice_made = true` stay in extract_go. Knots marked `// lint: call-knot`.

### Hub choices → place_call
- `[I'm done in here. Bring me in.]`: `-> extract_offer` → `#place_call:extract_call` / `-> DONE`.
- `[You wanted to talk about the distcc logs.]`: `-> m2_revelation_call` → `#place_call:m2_revelation_call` / `-> DONE`.

### ERB rewords (7.3)
- `:947`, `:955`: "...Call me when you've had a look." → "...Message me when you've had a look." (T)
- `:972`: "...Call me when you've read it." → "...Message me when you've read it." (T)
- `:978`: "A drive in her desk? Call me." → "A drive in her desk? Tell me what's on it." (T)
- `:1016` "Got the distcc logs. Call me when you're done at the drop-site." — **stays** (she is callable).

### Ink reword (7.3)
- `directive_later` (`:564`): "...Call me when it reads." → "...Message me when it reads." (T, text topic).

### Config the implementer must add (M7)
- `agent_0x99` `call` list: `{ knot: "m2_revelation_call", when: "globalVars.flag_distcc_submitted && !globalVars.revelation_heard", unavailable: "hidden" }` first, then `{ knot: "extract_call", button: false }`.
- Remove `targetKnot` from the `:1016` distcc text so it no longer opens the thread at the call knot; add the fallback ring mapping on `global_variable_changed:flag_distcc_submitted` (`delayMs: 120000`, `onMissed: "callback"`, `targetKnot: "m2_revelation_call"`) plus a `game_loaded` twin to re-arm after reload (7.2).
- Update stale `_comment`s at ERB `:1094`, `:1211` (they name `extract_offer`, now `extract_call`).

### Checks
Compile OK. dialoguelint: pre-existing line-len errors at :230/:354/:1004 only (unchanged knots); my new lines under cap. Validator: Schema passed, Validation complete; no new structural errors.

Voiced lines this mission: ~**18** touched (3 revelation openers incl. 2 new VAR branches; 1 impact reword; revelation_end unchanged text; 4 extract lines re-keyed). New clips: 2 revelation VAR branches + the 4 re-keyed bring-in lines + 2 name-dropped revelation lines.
