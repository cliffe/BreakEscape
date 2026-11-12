# Writer notes — HaX calls (Part B ink)

Writer owns HaX's ink: every HaX call, ring, callback/slow-answer line, bring-in and the hub choices that place them, in m01, m03, m04, m05, m06, m07 (HaX bring-in only), m08. Ink and ERB-reword text only; no config keys, no event mappings (a later implementer does config per 7.2). Each new call knot is unreached on this branch until config exists.

Order worked: m01 (M8), m03 (M7), m04 (M4), m05 (M5), m06+m08 (M10), m07 bring-in (M6).

**Expected validator warning (every mission where a call knot reads the engine VARs):** the pre-A7 validator reports `VAR call_answer_seconds/call_is_callback is read but never set`. This is a false positive: the engine writes them run-scoped via `applyEngineVariables` (2.11), never from ink. The A7/validator slice teaches the validator about them. Declaring + reading them is mandated by 7.2/2.11, so these warnings are accepted. Not a defect in the ink.

Line tables below: V = voiced (call knot), T = text thread (not voiced). "Config needed" = what the implementer must add for the knot to be reached (from 7.2).

---

## m01 (M8) — DONE, committed

File: `scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink`

### first_ring (new call knot, incoming)

| Line | Before | After | V/T |
|---|---|---|---|
| opener (callback) | — | "You rang back. Good habit." | V (new) |
| opener (slow, `call_answer_seconds > 10`) | — | "Took your time. Fine, nothing's on fire yet." | V (new) |
| opener (plain) | — | "You're in." *(R1: shortened; reason moved to shared line, m1)* | V (new) |
| shared line (all 3 paths) | — | "One test call before it's texts only." *(R1: m1, so callback/slow get the reason too)* | V (new) |
| body 1 | — | "A contractor on the phone is nothing. A contractor overheard talking to me is the end of your cover." *(R1: M6, fits the IT-contractor cover)* | V (new) |
| body 2 | — | "So: quiet, deniable. Message me the moment you're stuck and I'll walk you through it." *(R2 m1: dropped "from here it's texts", the second "texts" in three lines)* | V (new/re-key) |
| reply [Understood. Texts it is.] | — | "Good. Off you go." *(R1: m1, no longer closes on the player's line)* | V (new) |
| reply [What if I need you fast?] | — | "Then you message me fast. I'm on the thread the whole way. Go." | V (new) |

Declared `VAR call_answer_seconds = 0`, `VAR call_is_callback = false` at file top. Ends `#exit_conversation` then `-> DONE` on both choices. `// lint: call-knot`.

Voiced new: 8 (R1: was 6; +shared "One test call…" line, +"Good. Off you go." reply).

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

**R2 M1** (support_hub text replies, T, no audio — none of these knots is callable): `:170` "Copy that. Call anytime." → "Copy that. I'm a message away."; `:213` "Call if you hit a wall." → "Message me if you hit a wall."; `:290` "Call if you get stuck." → "Message me if you get stuck."; `:312` "Call if you hit anything unexpected." → "Tell me if you hit anything unexpected."; `:334` "and call if you need a steer." → "and message me if you need a steer."

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
| opener (callback) | — | "Knew you'd get back to me. Open your copy and read along." *(R1 m2: dropped "distcc flag landed", already in the preceding text)* | V (new) |
| opener (slow, `>10`) | — | "Thought I'd lost you. Open your copy and read along." *(R1 m2)* | V (new) |
| opener (plain) | "{player_name()}, your distcc flag just landed -- ..." | "Logs are up on my side. Open your copy and read along." *(R1 m2: dropped the restated flag-landing and "just")* | V (re-key) |
| m2_revelation_choices / _impact_choices | `*` choices | `+` choices *(R1 m3: redialable call must not run out of once-only choices)* | — |
| m2_revelation_impact | "And {player_name()} -- the logs point at a Phase 2. ..." | "And listen -- the logs point at a Phase 2. ..." | V (re-key, name dropped) |
| m2_revelation_end | ends `-> hub` | ends `#exit_conversation` / `-> DONE` | V (text unchanged) |

Call knots marked `// lint: call-knot`: m2_revelation_call, _choices, _impact, _impact_choices, _end. No knot diverts to hub/start. Mid-call reply/impact lines unchanged in wording.
Call-VAR openers added per 3.6 (the ring can be missed → callback; incoming ring can be answered slowly). On the common outgoing path both VARs are default → plain opener.

### extract_call (bring-in, renamed from extract_offer) — rewrite (7.6 m03 row)

| Line | Before | After | V/T |
|---|---|---|---|
| opening (first dial) | "Once you're out, you don't go back in. Anything you haven't read stays for the search team." | "Last look. Once you're out, the search team has that building." | V (re-key) |
| opening (redial, `extract_choices > 0`) | — | "Still in there. That search team's getting restless." *(R1 m4: redial no longer replays the opener)* | V (new) |
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

### R2 rewords (T, no audio)
- M1 `:158` (hub `[Nothing right now]`) "Copy. Call anytime, {player_name()}." → "Copy. I'm here, {player_name()}."; `:449` (report_end) "Call if you need me." → "Message me if you need me."
- m5 `:102` (hub greeting) "On the line, {player_name()}." → "Here, {player_name()}." (clears the `call-in-text-thread` lint on a text knot).

### Config the implementer must add (M7)
- `agent_0x99` `call` list: `{ knot: "m2_revelation_call", when: "globalVars.flag_distcc_submitted && !globalVars.revelation_heard", unavailable: "hidden" }` first, then `{ knot: "extract_call", button: false }`.
- Remove `targetKnot` from the `:1016` distcc text so it no longer opens the thread at the call knot; add the fallback ring mapping on `global_variable_changed:flag_distcc_submitted` (`delayMs: 120000`, `onMissed: "callback"`, `targetKnot: "m2_revelation_call"`) plus a `game_loaded` twin to re-arm after reload (7.2).
- Update stale `_comment`s at ERB `:1094`, `:1211` (they name `extract_offer`, now `extract_call`).

### Checks
Compile OK. dialoguelint: pre-existing line-len errors at :230/:354/:1004 only (unchanged knots); my new lines under cap. Validator: Schema passed, Validation complete; no new structural errors.

Voiced lines this mission: ~**18** touched (3 revelation openers incl. 2 new VAR branches; 1 impact reword; revelation_end unchanged text; 4 extract lines re-keyed). New clips: 2 revelation VAR branches + the 4 re-keyed bring-in lines + 2 name-dropped revelation lines.

---

## m04 (M4) — DONE, committed (HaX only; Vance is the other writer's)

File: `scenarios/m04_critical_failure/ink/m04_phone_agent0x99.ink`. Declared both call VARs at top.

### on_anomaly_confirmed (HaX dial ring, incoming) — openers added (7.2/3.6)

| Line | Before | After | V/T |
|---|---|---|---|
| opener (callback) | — | "You rang. Good. Straight to it." *(R1 M3: dropped the thrice-told "Nightshade's read it")* | V (new) |
| opener (slow, `>10`) | — | "There you are. No time for hello." *(R1 M3: dropped "That dial won't wait" echo)* | V (new) |
| opener (plain) | — | "Sixty-one. You were right not to trust their screens." | V (new) |
| body :518 | "Nightshade's got your reading. Sixty-one degrees … against twenty-eight …" | "Nightshade's had a look at your reading. Thirty-three degrees over what the screens show." *(R1 M3: no "Sixty-one" echo, no "screens" double)* | V (re-key) |
| body :520 | "The screens lie because ENTROPY feed them. That dial isn't on ENTROPY's network." | "ENTROPY feed the control room. That dial isn't on their network." *(R1 M3; R2 m3: third "screens" in four lines removed)* | V (re-key) |
| body (middle line) | — | unchanged | V |
| on_anomaly_confirmed_choices | three `#exit_conversation ... -> support_hub` | `... -> DONE`; **R1 M5: `~ anomaly_call_heard = true` moved here** (set once content heard) | V |
| hub choice label | `[You wanted to talk about the dial reading.]` | `[About the dial reading.]` *(R1 m7: no longer quotes a call not yet had)* | — (text choice) |

Marked `// lint: call-knot`. Opener goes in front of the existing first body line (number echoes the body's "Sixty-one degrees" deliberately).

### extract_call (bring-in, renamed from the extract_offer router) — rewrite (7.6 m04)

| Line | Before | After | V/T |
|---|---|---|---|
| opening (extract_offer_text, first dial) | "Once you're out, you don't go back in. Whatever you haven't read stays for forensics." | "Past the gate it's forensics' site, not ours. Anything you want, take it now." | V (re-key) |
| opening (redial, `extract_choices > 0`) | — | "Forensics are almost on-site. Last chance." *(R1 m4; R2 m2: "Time to go." contradicted the "take it now" lines that follow)* | V (new) |
| conditional lines (Voltage log, go-bag) | — | unchanged | V |
| [Bring me in.] reply | "Car's at the loading dock. Two minutes." | "Loading dock. The van with no livery." | V (re-key) |
| "Not yet" reply | "Take your time. The banks aren't going anywhere." (`-> support_hub`) | "Fine. The banks will keep." (`#exit_conversation` / `-> DONE`) | V (re-key) |
| [On my way.] | plain | `[On my way. #ending_check]` | — |
| last line | "See you at HQ." | "Albion's grid is someone else's problem now." | V (re-key) |
| [Understood.] (extract_blocked_choices) | `-> support_hub` | `#exit_conversation` / `-> DONE` | — |

`extract_blocked` five lines: m04's own, unchanged. `#complete_task:call_in_after_sweep` moved from extract_go onto [Bring me in.] reply; `#set_global:mission_complete` + assignment stay in extract_go. All extract knots marked `// lint: call-knot`. (Router renamed `extract_offer` → `extract_call`; `extract_offer_text` is a separate kept knot.)

### Hub choices → place_call
- `[I'm done here. Bring me in.]`: `-> extract_offer` → `#place_call:extract_call` / `-> DONE`.
- `[You wanted to talk about the dial reading.]`: `-> on_anomaly_confirmed` → `#place_call:on_anomaly_confirmed` / `-> DONE`.

### Ink reword (7.3)
- `first_call_end` (`:652`): "Call me when you've got a real reading." → "I'll ring once you've got a real reading." (T).

### Config the implementer must add (M4)
- `agent_0x99` `call`: `[{ knot: "on_anomaly_confirmed", button: false }, { knot: "extract_call", button: false }]`.
- Drop `sendTimedMessage` on the `:898` anomaly mapping; add `conversationMode: "phone-chat"`, `targetKnot: "on_anomaly_confirmed"`, `ring: { onMissed: "callback" }`, `delayMs: 6000` (7.2).
- Decline/miss follow-up text on `phone_call_declined/missed:agent_0x99`: **"Got your reading. Ring me back."** (not voiced). *(R1 M3: was "Nightshade's got your reading. Ring me back." — trimmed so the callback route stops saying it a third time.)*
- (Vance callable config + his ink are the other writer's.)

### Checks
Compile OK. dialoguelint: pre-existing line-len errors at :258 (and ERB :1129) only. Validator: Schema passed; two expected call-VAR warnings (see top). No structural errors, no dangling refs.

Voiced new/re-keyed: **~12** — 3 anomaly openers (new) + 4 bring-in lines (re-key).

---

## m05 (M5) — DONE, committed (HaX only; Recruiter + Patricia are the other writer's)

File: `scenarios/m05_insider_trading/ink/m05_phone_agent_0x99.ink`; ERB. Declared both call VARs at top.

### topic_architect (root-flag ring, untilAnswered) — openers added

| Line | Before | After | V/T |
|---|---|---|---|
| opener (callback) | — | "Thank you. Listen." | V (new) |
| opener (slow, `>10`) | — | "Finally. Sit down for this." | V (new) |
| body / plain opening | "Read it twice. A casualty projection, reviewed, and signed off as an acceptable cost." | "The Architect's own authorisation. I've read it twice. A casualty projection, reviewed, and signed off as an acceptable cost." *(R1 M2: names whose authorisation; "I've read it twice" not an order on the cold-open path)* | V (re-key) |
| topic_architect_choices | three `-> support_hub` | `#exit_conversation` / `-> DONE`; **R1 M5: `~ architect_discussed = true` moved here** (set once content heard) | V |

No else branch: prompt/placed answer goes straight to "Read it twice..." (the plain opening). Marked `// lint: call-knot`.

### extract_call (bring-in, renamed from extract_offer) — rewrite (7.6 m05)

| Line | Before | After | V/T |
|---|---|---|---|
| guard (not all flags) | "Not yet. The research server..." (`-> support_hub`) | same text, now `#exit_conversation` / `-> DONE` | V |
| opening "Once you're out, QDC's own..." (first dial) | — | unchanged (m05's own, stays) | V |
| opening (redial, `extract_choices > 0`) | — | "QDC's people are nearly at the vault. Say when." *(R1 m4)* | V (new) |
| find-lines + recruiter_texted line | — | unchanged | V |
| [Bring me in.] reply | "Car's at the front entrance. Two minutes." | "Front entrance. Walk like you work there." | V (re-key) |
| "Not yet" lethal branch | "Your call. He hasn't got long." | unchanged (m05's own) | V |
| "Not yet" else branch | "Take your time. The vault isn't going anywhere." | "Then look. The vault's yours till someone notices." | V (re-key) |
| [On my way.] | plain | `[On my way. #ending_check]` | — |
| last line | "See you at HQ." | "Thursday, nine o'clock. My office." | V (re-key) |

`#complete_task:call_in_after_sweep` moved from extract_go onto [Bring me in.] reply; `#set_global:mission_complete` + assignment stay. All extract knots marked `// lint: call-knot`.

### Hub choices → place_call
- `[I'm done here. Bring me in.]`: `-> extract_offer` → `#place_call:extract_call` / `-> DONE`.
- `[The Architect signed off...]`: `-> topic_architect` → `#place_call:topic_architect` / `-> DONE`.

### ERB rewords (7.3)
- `:1064`: "...Call me if you want to talk it through." → "...Message me..." (T)
- `:1070`: "A personal journal. Call me once you've read it." → "...Message me once you've read it." (T)
- `:1457`: "...then call me for Security: ...on the phone." → "...then message me for Security: ...on your phone." (T)
- `:1484`: "...Or get clear and call me for Security." → "...message me for Security." (T)

### Ink rewords (7.3)
- `:901` (confrontation_advice): "...then call me." → "...then message me." (T)
- `:936` (moral_sounding_board): "Call me again if it helps." → "Message me again if it helps." (T)

### Config the implementer must add (M5)
- `agent_0x99_handler` `call`: `[{ knot: "topic_architect", button: false }, { knot: "extract_call", button: false }]`.
- Root-flag mapping (`:1101`): drop `sendTimedMessage`, keep event/condition/`setGlobal`, add `conversationMode: "phone-chat"`, `targetKnot: "topic_architect"`, `ring: { onMissed: "callback", untilAnswered: true }`, `delayMs: 1500`; decline text "Root flag's in. Ring me back. You need to hear this." (not voiced). *(R1 M2 note for the implementer: this decline text still doesn't name the Architect; consider naming it so the fact the removed text carried isn't lost on a decline.)*
- (Recruiter first-call ring + ring-back, Patricia callable: the other writer's.)

### Checks
Compile OK; `extract_offer` now only in a comment. dialoguelint: pre-existing line-len error at :1077 only. Validator: Schema passed; two expected call-VAR warnings. No structural errors.

Voiced new/re-keyed: **~10** — 2 architect openers (new) + ~4 bring-in lines (re-key).

---

## m06 + m08 (M10) — DONE, committed

Both calls are **placed** (button: false), so no call VARs declared in either file.

### m06 `scenarios/m06_follow_the_money/ink/m06_phone_agent_0x99.ink`

**Fund call** (on_architects_fund_discovered → on_fund_choices → coordinated_attack / casualty_numbers → critical_choice_preview → critical_choice_choices → handler_recommendation): marked `// lint: call-knot`; the two call-internal `-> hub` (critical_choice_choices `[Let me think about it.]`, handler_recommendation) now `#exit_conversation` / `-> DONE`. No line rewrites (texts "Call me about it" stay). `on_blockchain_choices` is a separate text topic — left as `-> hub`.
Hub choice `[I've found The Architect's Fund.]`: now `#place_call:on_architects_fund_discovered` / `-> DONE`. **R1 M5: `~ reacted_fund = true` removed from the hub choice and set at both fund-call exits** (`critical_choice_choices` "[Let me think about it.]" and the end of `handler_recommendation`), so an early hang-up keeps the hub choice and the call can be replayed.
R1 M4: the two `satoshi_ko_choice` texts (a text topic, no call entry for the beat) changed "Call me when you've opened it." / "Call me when you have them." → "Message me when you've opened it." / "Message me when you have them." (text, no audio).

**Bring-in** extract_call (renamed from extract_offer) — 7.6 m06:

| Line | Before | After |
|---|---|---|
| opening (first dial) | "Once you're out, you don't go back in. Whatever you haven't read stays for forensics." | "Police are twenty minutes out. Whatever you leave in there is their evidence." |
| opening (redial, `extract_choices > 0`) | — | "Police are close now. Ready?" *(R1 m4)* |
| safe line | "His safe's still shut, for one." | unchanged |
| [Bring me in.] reply | "Car's round the back of the building. Two minutes." | "Round the back. They'll flash the headlights twice." |
| "Not yet" reply | "Take your time. The police can wait a few minutes." (`-> hub`) | "Then be quick. They won't wait for you." (`#exit_conversation` / `-> DONE`) *(R2 m4: dropped "A few minutes", which clashed with the "twenty minutes" opener; plan 7.6 line was wrong — flagged to orchestrator)* |
| [On my way.] | plain | `[On my way. #ending_check]` |
| last line | "See you at HQ." | "We'll talk about the money at HQ, not on a phone." *(R1 M1: was "We'll decide…"; the choice is already made by `ready_to_extract`, so "decide" contradicted the state)* |

`#complete_task:call_in_after_sweep` moved to [Bring me in.] reply; `#set_variable:start_debrief_cutscene` + assignment stay in extract_go. Hub choice `[I'm done here. Bring me in.]` → `#place_call:extract_call`. All extract/fund knots marked `// lint: call-knot`.

### m08 `scenarios/m08_the_mole/ink/m08_phone_agent_0x99.ink`

**Door audit call** (hax_read_1 → hax_read_2 → hax_read_right / wrong knots): the player reads the minute and names the leak. All `-> hub` in the chain now `#exit_conversation` / `-> DONE` (both `{ mole_identified: ... }` guards, both `[Let me read it again.]`, both wrong-answer returns, and hax_read_right). "Read it again and call me back." stays (×2, 7.3 — the hub choice re-dials). No VAR openers (placed). Knots marked `// lint: call-knot`.
R1 fixes:
- m5: both `[Let me read it again.]` now reply before closing — hax_read_1 "Take your time. I'm not going anywhere.", hax_read_2 "Go on. The minute's there." (V, new).
- m5: hax_read_1 redial opener on `{ hax_read_1 > 1: … }` — "Again, then. When was the plan opened?" (V, new); first open keeps "Two questions, the ones he'd ask. When was the plan opened?".
- m6: hax_read_right's inline `{netherton_ko:…|…} You finish the chain.` split into a `{ - netherton_ko: … - else: … }` block with "You finish the chain." as its own line (same words, re-key — the extractor now sees clean whole lines).
- A7a (orchestrator): `scenario.json.erb:1035` hostile-state text "…Ring me. Q until…" → "…Message me. Q until…" (text; the only call here is the placed door audit, not a free ring).
Hub choice `[I can name the leak.]` (was inline `-> hax_read_1`): now `#place_call:hax_read_1` / `-> DONE`.

### Config the implementer must add (M10)
- m06 `agent_0x99_handler` `call`: `[{ knot: "on_architects_fund_discovered", button: false }, { knot: "extract_call", button: false }]`.
- m08 `agent_0x99` `call`: `[{ knot: "hax_read_1", button: false }]`.

### Checks
Both compile, "All ink files valid", Schema passed, Validation complete.
- m06: pre-existing validator `❌ ERROR`s on `rooms/data_center/objects[0](transaction_server)` minigameData (undeclared fields `mode`/`title`/… for `pc`) — **not mine** (m06 ERB untouched); flagged for the orchestrator. Pre-existing lint error at :238.
- m08: pre-existing lint error at :190. No new call-set issues.

Voiced new/re-keyed: m06 ~6 (4 bring-in re-key + fund call lines keep wording); m08 ~10 (door-audit lines keep wording, now voiced).

---

## m07 bring-in (M6) — DONE, committed (HaX's bring-in ONLY)

File: `scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.ink`.

Scope per brief: m07 is "HaX's bring-in only". The Architect taunts/sign-off/voicemails/narration are the other writer's (file `m07_architect_comms.ink`). Both bring_me_in lines are "today" (already unique, 7.6) — no rewrites.

| Line | Before | After |
|---|---|---|
| bring_me_in (grid saved) | "Putting you through. He's waiting." | unchanged (now voiced) |
| bring_me_in (else) | "Not yet. Put the rest of the flags through the relay and he's on straight after." | unchanged (now voiced) |
| end | `#exit_conversation` / `-> hub` | `#exit_conversation` / `-> DONE` |

Marked `// lint: call-knot`. Hub choice `[Bring me in.]`: `-> bring_me_in` → `#place_call:bring_me_in` / `-> DONE`. No `#ending_check` (one-shot hand-off to Netherton's secure link via `debrief_requested`).

### Config the implementer must add (M6)
- m07 `agent_0x99` `call`: `[{ knot: "bring_me_in", button: false }]`.

### HaX text rewords (7.3) — DONE (orchestrator confirmed these are mine)
- ink `:167`: "Call me the second you hit something you can't open." → "Message me the second you hit something you can't open." (T)
- ERB `:896`: "...call me and say which." → "...message me and say which." (T, `skipIfGlobal: projection_revised` unchanged)
- ERB `:904`: "...call me before you log in on their host." → "...tell me before you log in on their host." (T)
- ink `:177` (R1, A7a — first_call_open, phone-preload text thread, HaX's): "...Call me when you hit something you can't open." → "...Message me when you hit something you can't open." (T). *(Observed, not actioned: ERB `:869` "...Phone me when you've decided..." is the same class; left for the orchestrator as it was outside the three named A7a lines.)*

### Checks
Compile OK. "All ink files valid", Schema passed, Validation complete.

Voiced new/re-keyed: **2** (bring_me_in lines gain a voice).

---

## R3 fixes (round 3) — DONE, committed `29dae9f30`

Review `REVIEW_WRITER_HAX_R3.md`, outcomes `REVIEW_WRITER_HAX_R3_OUTCOMES.md`. All text, no
audio: no voiced line, tag, divert or config touched. Every changed line is under its cap; the
five changed inks compile; the A7a validator is "Validation complete" on all six missions with
no new error.

- **M1** `m08_the_mole/scenario.json.erb:874` (netherton-hostile door-audit text): "…won't hear
  it from you, so read it to me:…" → "…won't hear it from you. Read it to me:…" — 31→30 words,
  clears the R2/N1 length regression. Sibling `:867` ("Call me when you've got both.") kept.
- **M2** two more HaX texts promising a call with no free call entry:
  `m04_phone_agent0x99.ink:201` "Line's open. Call it in when you have something." → "Line's open.
  Send me whatever you find."; `m05_phone_agent_0x99.ink:461` and `:476` "Don't guess at me. Call
  back when you're sure." → "…Come back when you're sure."
- **m1** m02/m03 sign-offs made distinct: `m03_phone_agent0x99.ink:158` "Copy. I'm here,
  {player_name()}." → "Copy. Go carefully, {player_name()}."; `:449` "Message me if you need me."
  → "Good. Back to it." (m02 unchanged).
- **m2** m01's thread no longer says "Message me if…" four times:
  `m01_phone_agent0x99.ink:290` dropped "Message me if you get stuck." → "Good. Work the pins one
  at a time."
- **m3** `m07_phone_agent_0x99.ink:802` "Slowly. I want to be sure I've read this right." →
  "Wait. …" (a text thread has no spoken pace).
- **m4** m10 `hax_post` `:49`/`:53`: left unchanged. Both are pre-existing and voiced; the only
  candidate reword re-keys a voiced line (costs a clip), so per the task it stays. Logged for
  m10's next dialogue pass.

## Totals (this writer)

Pre-R1 figures left for reference; R1 column is the new/re-key delta from fix round 1; R2
column is the delta from fix round 2 (full breakdowns in `REVIEW_WRITER_HAX_R1_OUTCOMES.md`
and `REVIEW_WRITER_HAX_R2_OUTCOMES.md`). R2 touched no new voiced lines beyond the re-keys
noted; every M1/M2/m5 wording change is a text line with no audio cost.

| Mission | Slice | Voiced (pre-R1) | R1 new | R1 re-key | R2 new | R2 re-key | R2 text (no audio) |
|---|---|---|---|---|---|---|---|
| m01 | M8 | 9 | 2 | 2 | 0 | 1 (first_ring body 2, m1) | 5 (M1) |
| m03 | M7 | 18 | 1 | 3 | 0 | 0 | 3 (M1 ×2, m5 greeting) |
| m04 | M4 | 12 | 1 | 4 | 0 | 2 (m2 redial opener, m3 body) | 1 (N1 :746) |
| m05 | M5 | 10 | 1 | 1 | 0 | 0 | 1 (N1 :237) |
| m06 | M10 | 6 | 1 | 1 | 0 | 1 (m4 "Not yet" reply) | 3 (M1) |
| m08 | M10 | 10 | 3 | 3 | 0 | 0 | 1 (N1 ERB :874) |
| m07 | M6 | 2 | 0 | 0 (ink :177 is a text reword) | 0 | 0 | 6 (M1 choice, M2 ERB :869, m5 ×4) |
| m10 | A7a | — | 0 | 1 (hax_post "Open it up.") | 0 | 1 (hax_post, m6) | 0 |
| m02 | N1 only | — | — | — | 0 | 0 | 2 (N1 ×2 hub texts) |

R2 totals: 0 new voiced, 5 re-keyed voiced (m01 ×1, m04 ×2, m06 ×1, m10 ×1), 22 text lines
with no audio (17 from the R2 review's M1/M2/m5, plus 5 from the A7a round-2 N1 sweep across
m02, m04, m05, m08). The m07 hub crowded-hub CHECK (R2 m7) is pre-existing, unchanged this
branch, logged for m07's next dialogue pass.

### A7a round 2, finding N1 — further "call" promises in HaX texts (all text, no audio)

The A7a round-2 review (`REVIEW_A7a_R2.md`, N1) found more HaX texts telling the player to
call a contact with no free call entry. All are HaX's (`agent_0x99` / `agent_0x99_handler`),
reworded as texts; m02 came into scope for this sweep only (text rewords, no new calls):
- m02 `m02_phone_agent0x99.ink:117` "Copy. Call when you need me." → "Copy. Message me when you need me."; `:204` "Copy that. Call anytime, {player_name()}." → "Copy that. I'm here, {player_name()}."
- m04 `m04_phone_agent0x99.ink:746` (server_room_event_end) "Call when you've got something." → "Message me when you've got something."
- m05 `m05_phone_agent_0x99.ink:237` (support_hub) "Line's open. Call when you have something." → "Line's open. Message me when you have something."
- m08 `scenario.json.erb:874` (door-audit, netherton-hostile branch) "…Call when you've got both." → "…Message me when you've got both."

N1's "still firing" m03 :102, m06 :141, m07 :800 are the same lines as R2 M1/m5 above,
already fixed in this round (the A7a review predates those commits). No N1 line belonged to
another caller.

All call knots marked `// lint: call-knot`; the engine also auto-discovers them by traversal (`voicedCallKnots`). The A7a validator is now call-aware, so the old "call VAR read but never set" warnings no longer appear.

---

## Merge rule (B1) — this branch merges mission-by-mission with A5 + config

On today's engine `#place_call:<knot>` is an unknown tag and `-> DONE` ends the story, so the
hub choices below play nothing until A5 (the `#place_call`/`call` engine support) **and** each
mission's own `call` entries and ring mappings land. **Do not merge `build/phone-calls-writing`
into `build/phone-calls` or `main` except one mission at a time, each with A5 and that mission's
config in the same merge.** Each mission's dead-end choices, to verify after config lands:

| Mission | Choices / beats dead-ended without config | Config each needs (from 7.2, see per-mission notes above) |
|---|---|---|
| m01 | `[Operation Shatter resolved — I'm ready for debrief]` (closing_debrief bring-in) | `call: [{ knot: "closing_debrief", button: false }]`; `first_ring` ring mapping on `main_office_area`; decline/miss text |
| m03 | `[You wanted to talk about the distcc logs.]` (m2_revelation_call), `[I'm done in here. Bring me in.]` (extract_call); the `:1016` distcc text's `targetKnot` must be removed and a fallback ring + `game_loaded` twin added | `call: [m2_revelation_call (when flag_distcc_submitted && !revelation_heard), extract_call (button:false)]` |
| m04 | `[About the dial reading.]` (on_anomaly_confirmed), `[I'm done here. Bring me in.]` (extract_call); drop `sendTimedMessage` on the `:898` anomaly mapping, add the ring | `call: [on_anomaly_confirmed (button:false), extract_call (button:false)]`; decline text "Got your reading. Ring me back." |
| m05 | `[The Architect signed off…]` (topic_architect), `[I'm done here. Bring me in.]` (extract_call); root-flag ring (`untilAnswered`) mapping | `call: [topic_architect (button:false), extract_call (button:false)]`; decline text |
| m06 | `[I've found The Architect's Fund.]` (fund call), `[I'm done here. Bring me in.]` (extract_call) | `call: [on_architects_fund_discovered (button:false), extract_call (button:false)]` |
| m07 | `[Bring me in.]` (bring_me_in) — survives only because the fallback timer also sets `debrief_requested`, but still needs config to voice | `call: [{ knot: "bring_me_in", button: false }]` |
| m08 | `[I can name the leak.]` (hax_read_1, the door audit) — the only way to name the mole when Netherton is down/hostile; the "call me back" / door-audit setup texts also warn until this lands | `call: [{ knot: "hax_read_1", button: false }]` |

The A7a validator warnings "contact has no call entry and no ring, so the player can't call"
on these contacts are exactly this state and clear once the config is in.

---

## Variety listing (3.6) — opening + last HaX line of every call (R1, all seven missions)

Redone after the R1 rewrites; checked side by side. No whole-line repeat in any HaX voice
block (greps confirmed). Repeat (redial) openers added in R1 are listed under each call.

### Callback openers (each opens differently)
- m01 first_ring: "You rang back. Good habit."
- m03 revelation: "Knew you'd get back to me. Open your copy and read along." *(R1)*
- m04 anomaly: "You rang. Good. Straight to it." *(R1)*
- m05 architect: "Thank you. Listen."

m01 and m04 share a "You rang / Good" cadence; different sentences and clips. Noted.

### Slow-answer openers (`call_answer_seconds > 10`, each differs)
- m01: "Took your time. Fine, nothing's on fire yet."
- m03: "Thought I'd lost you. Open your copy and read along." *(R1)*
- m04: "There you are. No time for hello." *(R1)*
- m05: "Finally. Sit down for this."

### Plain / placed openers (and R1 redial openers)
- m01 first_ring: "You're in." + shared "One test call before it's texts only." *(R1)*
- m01 bring-in: "It went through. Not on an open line. Come back to HQ." / "Shatter's dead in the water. Pack up and come in…"
- m03 revelation: "Logs are up on my side. Open your copy and read along." *(R1)*
- m03 bring-in: "Last look. Once you're out, the search team has that building." — redial: "Still in there. That search team's getting restless." *(R1)*
- m04 anomaly: "Sixty-one. You were right not to trust their screens."
- m04 bring-in: "Past the gate it's forensics' site, not ours. Anything you want, take it now." — redial: "Forensics are almost on-site. Last chance." *(R2 m2: "Time to go." contradicted the "take it now" lines that follow)*
- m05 architect: "The Architect's own authorisation. I've read it twice. A casualty projection, reviewed, and signed off as an acceptable cost." *(R1)*
- m05 bring-in: "Once you're out, QDC's own people go through that vault before ours do…" — redial: "QDC's people are nearly at the vault. Say when." *(R1)*
- m06 fund: "I've got it in front of me."
- m06 bring-in: "Police are twenty minutes out. Whatever you leave in there is their evidence." — redial: "Police are close now. Ready?" *(R1)*
- m07 bring-in: "Putting you through. He's waiting."
- m08 door audit: "Two questions, the ones he'd ask. When was the plan opened?" — redial: "Again, then. When was the plan opened?" *(R1)*

m03 and m05 bring-ins both open "…Once you're out…" — both plan-sanctioned in 7.6; rest of each line differs. The four redial openers no longer share a shape (m04/m05 reshaped off "Still …" in R1).

### Last HaX lines (bring-ins all differ, none is "See you at HQ.")
- m01 first_ring: "Then you message me fast. I'm on the thread the whole way. Go." / "Good. Off you go." *(R1: the second reply gained a line)*
- m01 bring-in: "Walk out the way you came in. As far as Viral Dynamics knows, you were never here."
- m03 revelation end: "Finish up, then Sterling. And be careful. Reasonable as she sounds, she signed that invoice."
- m03 bring-in: "Leave her to us."
- m04 bring-in: "Albion's grid is someone else's problem now."
- m05 bring-in: "Thursday, nine o'clock. My office."
- m06 bring-in: "We'll talk about the money at HQ, not on a phone." *(R1)*
- m07 bring-in: "Putting you through. He's waiting." (one-shot: opening is the last line)
- m08 door audit (right answer): "…Nightshade. I trained with him. … You finish the chain."

### [Bring me in.] replies (all differ)
m03 "Side door, two minutes. Don't use the lobby." / m04 "Loading dock. The van with no livery." / m05 "Front entrance. Walk like you work there." / m06 "Round the back. They'll flash the headlights twice."
