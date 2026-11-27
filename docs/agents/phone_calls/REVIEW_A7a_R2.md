# Review: A7a (validator check, dialoguelint rule), round 2

Reviewer: Opus, 2026-11-12. Work under review: 21fb3d1a2 on `build/phone-calls` (the R1 fixes). Read against plan 3, 4.3, 4.4, `REVIEW_A7a_R1.md`, its outcomes, the baseline's "Round 1 update", and the engine's `phone-chat-ui.js`, `phone-chat-minigame.js`, `phone-chat-history.js` and `npc-manager.js`.

How I checked, all in scratch copies (scripts from this worktree, scenario files copied from each worktree, so nothing compiled into either tree):

- Validator and `dialoguelint.mjs --json` over the 28 scenarios with a phone record, on both trees. I also called `ValidatePhoneCalls.check` directly on each rendered scenario to get the phone-call lines on their own.
- Mutation runs. I broke each fix in a copy of the scripts and ran the two test files to see whether a test fails.
- The three marker edits: I compiled each `.ink` at 21fb3d1a2 and at its parent with `bin/inklecate`, with the INCLUDE files in place, and compared them with the committed `.json`.
- Home knots: I compared dialoguelint's `currentKnot` guess (`scenarioInfo`, ERB regex) with the rendered JSON for all 67 phone records on both trees.
- Spread: for every marked knot in both trees, I worked out the spread set and checked it against the knots reachable from home.

Writers' branch: I copied scenario files at **c6883e2ac**. The branch moved to c010fbc31 while I worked: one dialogue-review commit, one caller-review commit, and some m01 rewording already in the live tree. Line numbers below are at c6883e2ac.

## Verdict: revise (small)

Every R1 finding is fixed, and every fix except the `home` plumbing has a test that fails if the fix is undone. The m6 decision matches the engine. The marker edits leave the compiled ink byte-identical. `lab_social_engineering` and `test_phone_calls` are clean. The M2 spread clears the m07 Architect hits and exposes no delivery problems (the writers' call knots carry no `#delivery:` notes yet).

What keeps this at revise is the orchestrator's three gaps. Two are cheap checks with no false positives on either tree today (N1, N2), and the third is a lint phrase (N3). Five minors follow: four in the R1 fixes, one older.

## R1 findings: status

| R1 | Status | Fails if undone? |
|---|---|---|
| M1 ring with no `targetKnot` | Fixed (`validate_phone_calls.rb:257-261`) | Yes: test "M1" |
| M2 mark spreads | Fixed (`dialoguelint.mjs:151-186`) | Spread and home stop: yes, tests 45 and 46. The `home` option, `deliveryFindings`' `home` and the CLI `homes` map: **no** (m2 below) |
| M3 functions not shared | Fixed (`:140`, `:348-356`) | Yes, if `function_names` returns nothing (test "M3"). The three `- fns` exclusions overlap, so dropping one alone fails nothing. That's harmless, because each one alone gives the right answer |
| m1 "on this line" | Fixed | Yes |
| m2 call-me exemption | Fixed; fixture reworded | Yes |
| m3 dead guard | Fixed | Yes |
| m4 "picked up" | Fixed | Yes |
| m5 CLI lint | Fixed | Guards later regressions (passes today) |
| m6 mapping history | Fixed | Yes |
| Nit voicemail on forced | Fixed | Yes |

**m6 decision ("any phone-chat mapping gives history"): accept.** Every NPC line the thread types goes into the NPC manager's history (`phone-chat-minigame.js:968-971`, `this.history.addMessage` → `npcManager.addMessage`), including lines on a voiced call (the line is added before `_speakCallLine`). Every choice goes in too (`:1158`). The contact list keeps a contact outside `npcIds` once it has any history (`phone-chat-ui.js:524-534`), and the unread badge uses the same rule (`npc-manager.js:574-579`). One edge: a mapping whose knot types nothing and offers no choice before it exits writes no history. That is rare and not worth modelling.

**Byte-identical:** `m10_ghost_phone`, `m10_phone_agent0x99` and `test_finale_calls_credits/hax_call` compile to the same bytes at 21fb3d1a2 and at its parent. Both match the committed `.json` and the files in the worktree. No audio keys move.

**`lab_social_engineering`:** 0 phone-call lines and 0 lint hits. **`test_phone_calls`:** 0 phone-call lines and 0 lint hits. The warnings that remain (8 each) don't come from the phone-call check. This tree's totals match the Round 1 update: 72 call-me, 0 errors, 27 lint hits.

**Spread containment:** dialoguelint's home knot agrees with the rendered `currentKnot` for all 67 phone records. On both trees, no knot marked by hand or reached by the spread is reachable from the contact's home knot. A divert to `start.some_stitch` parses as `start`, so the spread stops there. Function calls (`{f()}`, `~ f()`) are not diverts, so the spread never follows them. The spread has no path into a function or into the home knot, but it can run into a knot that the home knot also reaches (m4).

## Findings

### N1 (M). "Call anytime", "Call if you get stuck" and "Phone me when" slip past the call-me rule

`scripts/validate_phone_calls.rb:21` `CALL_ME = /\b(?:call|ring) me\b/i`. HaX's sign-off lines promise a call without saying "call me". The check was meant to catch exactly that promise, made by a contact the player can't ring.

Failure scenario: the player reads "Call if you hit a wall." in m01, looks for a call button, and finds none. This happens on every mission where HaX has no `call` entry, and the validator stays quiet.

Fix: one more pattern, used in the same places (`message_texts` and the ink source scan, choice brackets already stripped):

```ruby
CALL_PROMISE = /\b(?:call|ring|phone)(?:\s+me)?\s+(?:anytime|any\s+time|whenever|if|when|once)\b/i
CALL_NOUN    = /\b(?:a|the|your|my|his|her|our|their|that|this|next|last|first|one|whose|on)\s+(?:call|ring|phone)\b/i
SELF_RING    = /\b(?:I'll|I will|we'll|she'll|he'll|they'll|I'd)\s+(?:call|ring|phone)\b/i
```

A line warns when it matches `CALL_ME` or `CALL_PROMISE`, unless the match sits inside a `CALL_NOUN` ("your call if") or a `SELF_RING` ("I'll ring when you're at the isolator"; plan 4.4 already treats "I'll ring" as fine). Add "phone me" to `CALL_ME` too.

I ran this over every phone ink and ERB message on the writers' branch. It finds 16 new lines, all real:

- m01 `m01_phone_agent0x99.ink` `:170`, `:213`, `:290`, `:312`, `:334`
- m02 `m02_phone_agent0x99.ink` `:117`, `:204` (not on the orchestrator's list)
- m03 `:158`, `:449`
- m04 `m04_phone_agent0x99.ink:746` "Call when you've got something."
- m05 `m05_phone_agent_0x99.ink:237` "Line's open. Call when you have something."
- m06 `:141`, `:219`
- m07 ERB `:869` "Phone me when you've decided."
- m08 ERB `:874` "Call when you've got both." (door audit; clears with M10's call entry)

The phone-NPC scope and the two exclusions remove the four false positives the bare pattern gives: m04 `:680` and m10 `:797`, `:814` ("I'll ring ..."), and m04 Vance `:406` (a player choice on an in-person NPC). One more, m01 ERB `:1286`, is a note's text, not a phone text, so `message_texts` never reads it.

Tests: one positive per form ("Call anytime.", "Call if you get stuck.", "Phone me when you've decided."); negatives for "I'll ring when you're at the isolator.", "waiting on your call", "the call if it comes", and "[I'll call if I need you.]" (choice). Plan 4.3's call-me bullet gets the wider wording.

Not caught, and I'd leave it: m04 `:201` "Call it in when you have something." ("call it in" means report it, which a text can do).

A limit to note for the orchestrator: once a contact has any `call` entry, the rule goes quiet, even when every entry has a `when` that is false at the point of the text. The validator can't evaluate `when` statically, so writers still need to check that "Call anytime" lines only show when the call is live.

### N2 (M). `globalVars.<name>` in `call.when` or a mapping `condition` that is not in `globalVariables`

`scripts/validate_phone_calls.rb:301-305` checks `call.when` only for `value`, `name` and `data.` (`when_misuse`, `:381`). `validate_scenario.rb` checks an undeclared global only in `global_variable_changed:` patterns (`:3468`, `:3557`), not in conditions. The writers' planned Recruiter entry `{ knot: "return_contact", when: "!globalVars.recruiter_line_dead", unavailable: "no_answer" }` (WRITER_CALLERS.md:182) reads an ink VAR (`m05_phone_recruiter.ink:25`, set by `~ recruiter_line_dead = true` at `:396` and `:408`). An ink VAR reaches `window.gameState.globalVariables` only when the scenario declares it there. The condition reads `undefined`, so `!undefined` is always true.

Failure scenario: the Recruiter's line stays live after her final statement. The Call button rings her again, and `return_contact` replays a call that should ring out.

Fix: for every phone contact, scan `call.when` and the `condition` of each `ring` or `phone-chat` mapping and the ringing `timedConversation` for `globalVars\.(\w+)`. Each name must be in `globalVariables` or written somewhere (`setGlobal` keys, `#set_global:<name>` tags in the mission's ink), since those write `window.gameState.globalVariables` even when the name is undeclared (`npc-manager.js:1086-1089`). Skip names of the form `m\d\d_\w+`, the carryover globals Hacktivity supplies at run time (m09 has 40-odd in conditions).

- `call.when`: error ("reads globalVars.X, which is not in globalVariables and nothing sets it: the condition sees undefined").
- Mapping conditions: warn.
- When X is also a VAR in the contact's ink, say so: "declare X in globalVariables so the ink VAR syncs to it".

I ran this on both trees: with the carryover names skipped, nothing fires on any phone contact today, and the Recruiter entry fires once its config lands. Tests: an undeclared name errors; a declared name, a `setGlobal` name and an `m05_x` name pass; the ink-VAR wording appears.

### N3 (m). Narration of a call's silence in a text knot: "The line stays quiet"

`scripts/ink_runtime_check/dialoguelint.mjs:131`. On the writers' branch, `m07_phone_agent_0x99.ink:781-782` (`topic_teacher`, a text knot) has "...Read me that again." then "Narrator: You read it back to her. The line stays quiet for longer than she usually lets it." This is call narration in a text thread. The rule's `the line (?:drops|goes dead|is dead)` misses it.

Fix: widen to `\bthe line (?:drops|goes dead|is dead|(?:stays|goes|went|falls|fell) (?:quiet|silent|still))\b`, and add `\byou read it (?:back|out) to (?:her|him|them)\b` for narration only. Across all phone ink this finds m07 HaX `:782`, plus Architect `:456` and `:535`, which sit in `signoff_close` and `seattle_close`. Those are inside the spread, so they don't fire.

I would not add "Line's open" (HaX `m04:201`, `m05:237`, `m08:77`, `m09:952`, `m10:112`). Like "on this line", it reads as the channel idiom. If the orchestrator wants it gone from text threads, that's a writing call, not a lint rule. The text fix for `:782` belongs to M6 (HaX writer), e.g. "Narrator: You send it again. Nothing comes back for longer than she usually leaves it."

### m1. The spread stops only at the exact home knot

`dialoguelint.mjs:180`. If a call knot diverts to a knot that the home knot also reaches, the spread marks that knot and everything after it. Say `start` diverts to `hub` and a call's close does `-> hub`: then the whole text thread is silenced.

For contacts with `ring` or `call` config, the validator's shared-knot warning covers this. It does not cover old voiced mappings (m10 `gallery_open_call`, `ghost_call`) or contacts whose config hasn't landed (most of the writers' work today). No leak exists in either tree now.

Failure scenario: a writer ends a call with `-> hub` instead of `-> DONE`. Lint goes quiet for every text knot after `hub`, and the validator says nothing until the config lands.

Fix: work out the set reachable from home with the same divert graph, and stop the spread at any knot in it. Better still, report it: "the call reaches X, which the thread also reaches". Test: `start -> hub`, a marked call `-> hub`, and `hub` diverts to an idle text knot that holds "He hangs up." That line must still fire.

### m2. The `home` plumbing has no test that would catch a break

`test/js/dialoguelint.test.mjs:580-582`. The custom-home assertion passes with `home` ignored. After `start` is renamed to `hub`, `-> start` no longer names a knot, so nothing reaches `hub` either way.

Three mutations pass every test: dropping `home` from `lintInk`'s `callKnotSet` call, from `deliveryFindings`, and from the CLI (`home: 'start'`). This matters for real data: m01's HaX home is `first_call` and test_finale's is `hub`.

Fix: a test where the marked knot diverts to the custom home and the custom home diverts to a text knot with a call phrase (it must fire). Add the same shape through `structureFindings` for the delivery checks, and a `scenarioInfo` test where `currentKnot` sits before and after `storyPath`.

### m3. `function_names` reads only the top-level `.ink`

`validate_phone_calls.rb:140`, `:174`. Functions in an INCLUDE'd file are missed. All four m10 phone inks include `m10_carryover_vars.ink`, which has 5 functions. This is latent: no m10 contact has `ring` or `call`, so the shared check doesn't run there.

Failure scenario: m10 HaX gets a `call` entry, and every carryover helper called from both the thread and the call warns as a shared knot. That is the R1 M3 false positive coming back.

Fix: take the names from the compiled ink, which already holds the includes: the targets of `f()` diverts (R1's suggestion). Or follow `INCLUDE` lines. Test with a function defined in an included file.

### m4. An empty `npcIds` reads as "lists nobody"

`validate_phone_calls.rb:62-64` makes the key for an empty list, and `:335` then warns. The engine filters only when the list is non-empty (`phone-chat-ui.js:525`, `allowedNpcIds.length > 0`), so `npcIds: []` lists every contact on that phone. No scenario has `npcIds: []` today. Fix: skip the check when the set is empty; one assertion in the m3 test.

### Nit

`legacy_voiced.json` was recompiled for the fixture rewording. That is the only `.json` content change in 21fb3d1a2, and it is a test fixture, so no audio is involved.

## The writing branch (c6883e2ac) under the R2 scripts

Totals: 11 errors, 53 call-me warnings, 10 VAR warnings, 6 lint hits (this worktree: 0, 72, 0, 27).

| Item | Result | Owner / action |
|---|---|---|
| m07 Architect `t30_close` (was `:107`), `t1_close` (was `:368`, `:370`) | **Cleared.** The writers marked the 13 call starts and voicemails, and the spread adds the 14 `_choices`/`_close` knots (`taunt_t*_choices`, `t*_close`, `sign_off_choices`, `signoff_close`, `seattle_call_choices`, `seattle_close`). The text is still there (`:119` "The line drops", `:392`, `:394` "He hangs up first") and no longer fires | none |
| Delivery checks in the newly covered call knots | **Nothing exposed.** No writers' call knot carries a `#delivery:` note (m04 Vance, m05 Recruiter/Patricia/HaX, m06, m07 Architect/HaX, m08: 0 notes). m09's few notes lint clean | Writers: plan 2.8 notes are optional. If any calls want them (the Architect's taunts, the Recruiter's deal), add them now, while the checks are on |
| m05 Recruiter, Patricia, m09 ×5, m09 Recruiter `:37` | Cleared (marks, rewrites) | none |
| m03 `m03_phone_agent0x99.ink:102` "On the line" | Still fires | M7 rewords |
| m06 `m06_phone_agent_0x99.ink:141` "I'm on the line. Call anytime." | Still fires (and N1) | M10 rewords |
| m07 `m07_phone_agent_0x99.ink:800` "A long pause on the line." | Still fires | M6 rewords |
| m07 `m07_phone_agent_0x99.ink:782` "The line stays quiet ..." | Missed today (N3) | M6 rewords |
| m10 `:302` "on the line" | Still fires | M9 |
| m10 `:763`, test_finale `hax_call.ink:15` | Fire on this branch only: it lacks 21fb3d1a2's markers. Clear on merge | merge |
| test_phone_calls `legacy_voiced.ink:8` "Ring me" | Fires on this branch only (old fixture). Clears on merge | merge |
| `#place_call` with no `call` entry (11 errors): m01 `:146`; m03 `:116`, `:121`; m04 `:146`, `:150`; m05 `:186`, `:220`; m06 `:162`, `:174`; m07 `:229`; m08 `:93` | Expected until config | slice config (M4-M8, M10) |
| VAR declared with no ring/call (10): m01 `:19`/`:20`, m03 `:9`/`:10`, m04 `:10`/`:11`, m05 HaX `:25`/`:26`, m05 Recruiter `:28`/`:29` | Expected until config | slice config |
| Call-me (53) | Same families as R1. All clear when the contacts get `call` entries, except the lab_tesseract ×4 and sis02 ×1 already routed to M9 | slice config; M9 |
| N1 lines (16, listed under N1) | Not caught today | Writers reword ("Message me ...", "I'm a message away") wherever the contact has no live call at that point; m04 `:746`, m05 `:237`, m08 ERB `:874` can stay if that mission's call entry is live then |
| m05 Recruiter `return_contact` `when: "!globalVars.recruiter_line_dead"` (planned) | Not caught today (N2). Always true as planned | Callers' writer: declare `recruiter_line_dead: false` in m05 `globalVariables` (the ink VAR then syncs), or set it with `#set_global:recruiter_line_dead:true` beside the two `~` lines |
| New delivery problems in call knots | None | none |
