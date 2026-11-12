# Review: A7a (validator check, dialoguelint rule), round 1

Reviewer: Opus, 2026-11-12. Work under review: 18eee5c44 on `build/phone-calls`. Read against plan 3, 4.3, 4.4, 6 A7 and 7.3, and the engine's `phone-ring-config.js` and `npc-manager.js` ring path.

How I checked: re-ran the validator (`--no-graph`) and `dialoguelint.mjs --json` over all 28 scenarios with a phone record, in scratch copies of both trees (A7a scripts from p-phone-calls; scenario files copied from each worktree so no compile touched either tree). The p-phone-calls numbers match the baseline table exactly. `lab_social_engineering`: validator output identical to the parent commit's apart from the path header lines. `test_phone_calls`: the only differences from the parent are fewer warnings (the `ring` unknown-field and VAR-never-set warnings gone); 0 phone-calls lines, 0 lint hits. `node --test` on both test files: 60/60.

## Verdict: revise

The check covers every 4.3 bullet with the engine's field names, values and defaults, and error versus warning follows the plan. Three things need fixing before the writers depend on it: a ring with no `targetKnot` passes although the engine opens the thread knot (M1), the call-knot marker covers one knot while every written call spans several (M2), and ink functions show up as "shared" knots (M3).

## Findings

### M1. A ring with no `targetKnot` passes, but the engine opens the thread's current knot (plan gap 4)

`scripts/validate_phone_calls.rb:249-261`. With no `targetKnot`/`knot`, nothing is checked. The engine does `config.targetKnot || config.knot || npc.currentKnot` (`npc-manager.js:1520`) and offers that knot to the ringer, so the call opens on the home knot, or on whatever knot an earlier non-ring mapping last set. That breaks plan 3.1 ("must not be the contact's home knot"). The extractor (4.2) also adds no call start knot for it, so the call would play with no audio.

Failure scenario: a writer adds `"ring": true` to an existing `phone-chat` mapping that had no `targetKnot`. The validator stays clean, and in game the phone rings and then voices the text hub.

Fix: when a `ring` mapping or ringing `timedConversation` has no target and the contact is not `voiced: true`, raise an error: "ring needs a targetKnot: the call's own knot (plan 3.1, 3.5)". `timedConversation` is already required to have `targetKnot` (`validate_scenario.rb:3139`), so in practice this is the mapping case. Add a test.

### M2. `// lint: call-knot` marks one knot, but every written call spans several

`scripts/ink_runtime_check/dialoguelint.mjs` `callKnotSet` (new, about line 147). The writers marked each call's start knot, as plan 4.4 reads. Their calls go on through `*_choices` and `*_close` knots, and those carry no mark. On the writing branch:

- the rule fires on real call text inside calls: `m07_architect_comms.ink:107` (`t30_close`, "The line drops"), `:368` and `:370` (`t1_close`, "He hangs up first");
- the `#delivery:` target checks, which the marker turns on, stay off for the rest of each call. Unmarked knots reached from a marked one: m07 Architect 14 (`taunt_t*_choices`, `t*_close`, `sign_off_choices`, `signoff_close`, `seattle_*`), m05 Recruiter 25, m05 Patricia 15, m04 Vance 1 (`crew_offer_choices`), and `test_phone_calls/caller_basic.ink` `after_choice`.

Failure scenario: writers either mark 50-odd extra knots by hand or learn to ignore the rule. Delivery-note mistakes inside those knots go unseen either way.

Fix (pick one, and update plan 4.4's wording to match): (a) dialoguelint spreads the mark along diverts and tunnels from a marked knot, stopping at the contact's home knot. It already reads the scenario for `npcType`, so it can read `currentKnot` (default `start`). The validator's "shared knot" and "diverts home" warnings already catch a call that wrongly runs into the thread. (b) The validator, which knows the call set, warns on any call-set knot without the mark. I'd take (a), since it costs writers nothing. Test: a marked knot that diverts to an unmarked `_close` knot leaves no hit in `_close`, and the delivery checks run there.

### M3. Ink functions are reported as knots the thread and the call share

`validate_phone_calls.rb:24` (`f()` in `DIVERT_KEYS`), `:121-137`, `:338-340`. `reachable_knots` follows function calls, so a function used both in the thread and in a call is reported as shared. To find this I simulated the writers' config on the writing branch, giving each contact a `call` entry for every `#place_call` target and every marked knot. With that config, m05 reports `knot "all_flags_in" is in the call and also reachable from the home knot`, and `all_flags_in` is `=== function all_flags_in()` (`m05_phone_agent_0x99.ink:124`). This is a false positive, and it will appear as soon as M5's config lands.

Fix: collect the `f()` targets and leave them out of the start-reachable, shared and divert-home warnings. Keep following them for the voiced-line checks. Add a test with a function called from both sides.

### m1. "on this line" is too broad: it hits the channel-security idiom

dialoguelint `CALL_IN_TEXT[1]`, `/\bon (?:this|the|my|her|his) line\b/`. "Not on this line." and "Careful what you say on this line." mean "not over this channel", and that reads correctly in a text thread. Hits: lab_tesseract `phone_agent_0x99.ink:69`, `:153`, `:181`; m07 `m07_phone_agent_0x99.ink:804` (writing `:806`). Fix: drop `this` from the alternation (`on (?:the|my|her|his) line`). That clears those four and keeps every hit that should stay (table below). Add a negative test for "Not on this line."

### m2. The old-voiced-form exemption (plan gap 1) is wider than the reason for it

`validate_phone_calls.rb:309-310` and `:356`. Exempting a contact-level `voiced: true` contact is right, because the player can ring Dev through `callLaunch`. A contact whose only voiced form is a mapping or `timedConversation` can't be rung, so "Ring me" in its thread is the broken promise the check exists to catch. The exemption is there because the `test_phone_calls/ink/legacy_voiced.ink:8` fixture says "Ring me when it matters." Today it hides nothing real: no m09 or m10 phone ink or ERB says "call me" or "ring me". Fix: limit the call-me exemption to contact-level `voiced: true`, and change the fixture line to "Text me when it matters." (a silent home-knot line, so no audio key). The unused-VAR exemption can stay for all old forms if `legacy_voiced` is there to prove the engine writes the VARs on an old call. Otherwise narrow that too.

### m3. Phone listing check: the default proc makes its guard dead code

`validate_phone_calls.rb:58`, `:317`, `:320`. `phones[...]` on `:317` creates the key, so `phones.key?` on `:320` is always true. A contact whose `phoneId` names no phone item would warn "never appears" when it should be skipped. Fix: `listed = phones.fetch(pid, nil)`, and skip when it is nil.

### m4. "picked up" will hit ordinary prose

`/\b(?:you|she|he)\s+picked up\b/`: "she picked up the drive" would fire. There are no hits today. Fix: add a negative lookahead for an object (`(?!\s+(?:the|a|an|it|them|that|this|his|her|my|your|some)\b)`), plus a test.

### m5. The CLI test runs with `--no-lint`

`test/js/validator-phone-calls.test.mjs:291-299`. "`test_phone_calls` clean" and "lab SE nothing new" are not asserted for dialoguelint, so a lint regression on either would pass. Fix: also run `dialoguelint.mjs scenarios/<name> --json` for both and assert there are no `call-in-text-thread` findings.

### m6. "Nothing gives it history" ignores non-ring `phone-chat` mappings

`validate_phone_calls.rb:318-319`. A plain or old-voiced `phone-chat` mapping also opens the thread. Plan 4.3 lists only ring, `timedMessages` and `sendTimedMessage`, so this follows the plan. Check whether a conversation opened by a mapping lists the contact (`phone-chat-ui.js:506-530`). If it does, add those mappings to `gives_history`.

### Nit

The engine warns when `onMissed: "voicemail"` is set on a forced call (`phone-ring-config.js:73`); the validator says nothing. The plan doesn't list this check, so it's optional: a warning would match `untilAnswered`.

### The implementer's six plan-gap decisions

1. Old voiced forms exempt from the call-me and unused-VAR warnings: accept for contact-level `voiced: true`. Narrow it for mapping and timed forms (m2).
2. Call-me check on phone NPCs only: accept. The validator can't link an in-person record to its phone record. One real case goes unseen because of this: `m10_hax_post.ink:27` "I'm on your phone now. Ring me." (person NPC `hax_post`; the m10 phone HaX has no `call` entry). Plan 7.2 leaves m10 unchanged, so this is an orchestrator call: reword it to "Message me." in M9, or give m10 HaX a call.
3. Identical texts folded into one warning with a count: accept.
4. A missing `targetKnot` not read as the home knot: reject (M1).
5. Texts the 7.3 grep missed (`ring me`, ERB-built) listed as unexpected: accept. Owners are in the table below.
6. `call_answer_seconds` and `call_is_callback` exempt from "read but never set": accept. The engine writes them on every load (2.11).

## Unexpected hits in the baseline: decision for each

| Hit | Decision | Owner |
|---|---|---|
| m03 `m03_phone_agent0x99.ink:99` (writing `:102`) "On the line, {player_name()}." | Text should change. It's a phone pick-up greeting in a text thread. Use "Here, {player_name()}." or similar. | M7 (HaX writer, m03) |
| m06 `m06_phone_agent_0x99.ink:141` "I'm on the line. Call anytime." | Text should change: "I'm here. Call anytime." "Call anytime" is right once M10 gives HaX a `call` entry. | M10 (HaX writer) |
| m07 `m07_phone_agent_0x99.ink:798` (writing `:800`) "Narrator: A long pause on the line." | Text should change. `topic_mole` is a text knot, so the pause should read as a gap between messages (or be cut). | M6 (HaX writer) |
| m07 `m07_phone_agent_0x99.ink:804` (writing `:806`) "Not on this line." | The check is too broad (m1). | A7a fix |
| lab_tesseract `phone_agent_0x99.ink:69`, `:153`, `:181` ("on this line" ×3) | The check is too broad (m1). | A7a fix |
| lab_tesseract ERB `:468`, `:470`, `:472` and ink `:220` ("call me" ×4) | Real: HaX can't be called there. Reword to "message me" (text only, no audio). 7.2 calls the lab unchanged, so the orchestrator confirms. | M9 (small wording) |
| m09 `m09_phone_recruiter.ink:37` "[Ring back.]" then "The number rings out." | Real: a choice that fakes a call (plan 3.5). Drop the choice from the home stub, or give the Recruiter a `call` entry with `unavailable: "no_answer"`. Home stub only, so no audio. | M1 (callers writer, m09) |
| m10 `m10_phone_agent0x99.ink:763` "Sterling's still on the line." | Correct hit inside a voiced call (`gallery_open_call` is a voiced mapping target) whose knot has no mark. Add `// lint: call-knot` to it (comment only, no key change). | A7a fix |
| m10 `m10_ghost_phone.ink:123` "...said on this line." | Inside Ghost's voiced call (`selling_menu`, reached from `ghost_call`). m1 clears it; mark `ghost_call` too, which with M2 (a) covers `selling_menu`. | A7a fix |
| m10 `m10_phone_agent0x99.ink:302` "I had Malhotra, on the line." | Text knot (`alibi`, outside every voiced call), reporting a past call. A true reading, but the text is easy to change: "I had Malhotra on the phone." Text only. | M9 |
| test_finale_calls_credits `hax_call.ink:15` "Don't hang up." | Correct hit in a forced voiced call: mark `forced_call`. | A7a fix |
| m05 ERB `:1114`, `:1250`, `:1364` (call-me) | Real; the bring-in family. Clears when M5 gives HaX her call. | M5 |
| m06 ERB `:1628` (26 mappings) | Real; the bring-in. Clears with M10's call entry. | M10 |
| m07 ink `:177` "Call me when you hit something you can't open." | Real, and still there on the writing branch. Reword like `:167` ("Message me when ..."). | M6 (HaX writer) |
| m08 ERB `:827` to `:839` | Real; the door-audit beat. Clears with M10's call entry. | M10 |
| m08 ERB `:1035` "... I'm done talking in person tonight. Ring me." | A fight reaction, not the door audit. Reword to "Message me." once M10's call entry exists, because the check will go quiet then even though this beat isn't a call. | M10 |
| sis02 `npc_marcus_webb.ink:139` "Tell Tom to ring me" | Tom rings Marcus, not the player, so the line is fine. Leave it as a known warning, or let M9 reword it ("Have Tom phone me"). | M9 (optional) |

## The writing branch (`build/phone-calls-writing`, bc9543517) under the A7a scripts

Same run as above, on the writing branch's scenario files. Totals (errors / call-me and VAR warnings / lint hits), main → writing: m01 0/7/0 → 1/8/0; m03 0/9/1 → 2/7/1; m04 0/5/0 → 2/6/0; m05 0/26/8 → 2/22/0; m06 0/6/1 → 2/6/1; m07 0/8/11 → 1/5/5; m08 0/6/0 → 1/6/0; m09 0/0/6 → 0/0/1; m10, lab_tesseract, sis02, test_finale unchanged; lab SE and test_phone_calls 0/0/0 on both.

### Cleared by the writing

| Mission | What cleared |
|---|---|
| m01 | ink `:417` "Call me if you need support." |
| m03 | ERB `:947`/`:955`, `:972`, `:978`; ink `:564` |
| m04 | ink `:652` "Call me when you've got a real reading." |
| m05 | ERB `:1064`, `:1070`, `:1457`, `:1484`; ink `:901`, `:936`; all 8 Recruiter lint hits |
| m07 | ERB `:896`, `:904` (with `:912`, `:919`); ink `:167`; 6 of the 9 Architect lint hits (handset lights, line drops at `:124`, rings anyway) |
| m09 | Nightshade, Torres, Gary: all 5 hits (`start` stubs and the `call` knot) |

### Remaining, which clear when the slice's config lands (a `call` or `ring` for the contact)

m01 ERB `:925`, `:1019`, `:1028`, `:1064`/`:1073`/`:1082`, `:1091`, `:1100`; m03 ERB `:1016`, `:1100`, `:1107`/`:1132`, `:1113`/`:1138`, ink `:396`; m04 ERB `:898`, `:1080`, Vance ERB `:1520` and ink `:279`; m05 ERB `:1101`, `:1114`, `:1250`, `:1364`, `:1379`, `:1386`, ink `:796`-`:802`, `:1030`-`:1034`, Patricia ERB `:1552` and ink `:130`, `:162`, `:348`, `:365`; m06 ERB `:1246`/`:1253`, `:1628`, ink `:588`, `:593`; m07 ERB `:1314`, `:1322`, `:1329`, ink `:344`; m08 ERB `:827`-`:839`, `:867`, ink `:243`, `:264`. With the simulated config (above), all of these go quiet.

### Remaining that need text, a marker or a check fix

| Hit | Action |
|---|---|
| m03 `:102` "On the line" | M7 rewords (table above) |
| m06 `:141` "I'm on the line" | M10 rewords |
| m07 `:177` call-me | M6 rewords |
| m07 `:800` "pause on the line" | M6 rewords |
| m07 `:806` "Not on this line" | m1 |
| m07 Architect `:107` (`t30_close`), `:368`, `:370` (`t1_close`) | M2: these are inside the calls |
| m08 ERB `:1035` "Ring me." | M10 rewords |
| m09 Recruiter `:37` | M1 writer |
| m10 ×3, lab_tesseract ×7, sis02 ×1, test_finale ×1 | as in the table above |

### New on the writing branch: expected until config

`#place_call:<knot>` with no `call` entry (error, 11): m01 `:143` `closing_debrief`; m03 `:116` `extract_call`, `:121` `m2_revelation_call`; m04 `:146` `extract_call`, `:150` `on_anomaly_confirmed`; m05 `:186` `extract_call`, `:220` `topic_architect`; m06 `:162` `extract_call`, `:175` `on_architects_fund_discovered`; m07 `:229` `bring_me_in`; m08 `:93` `hax_read_1`.

VAR declared with no `ring` or `call` (warning, 8): m01 `:19`/`:20`, m03 `:9`/`:10`, m04 `:10`/`:11`, m05 `:25`/`:26`.

With the simulated config, both groups clear. The voiced-line checks (printed variables, stage directions) find nothing in the writers' call knots. The one new warning is the M3 false positive on m05 `all_flags_in`.
