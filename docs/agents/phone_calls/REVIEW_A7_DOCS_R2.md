# Review A7 docs, round 2

Reviewer: Opus, 2026-11-12. Read-only review of `build/phone-calls` at `b136b4b10` (docs as fixed in `daee2a8d3`; A6 R2 voicemail change in `adc5169de`).

Scope: `README_scenario_design.md` 1601-1630 (timed conversations table), 1631-1700 (event mappings table), 1740-1780 (Phone NPCs), 1821-2072 (forced calls to "What the validator checks for phone calls"); `README_ink_best_practices.md` 547-700 ("Writing call and voicemail knots") and 1060-1080 (mode table). Checked against `phone-ring-config.js`, `phone-ringer.js`, `phone-ringer-dom.js`, `npc-manager.js` (`runVoicemail`, `_threadOpenOn`, the slot restore), `npc-conversation-state.js` and `scripts/validate_phone_calls.rb`. Author pass from `WRITER_HAX_CALLS.md` and `WRITER_CALLERS.md` on `build/phone-calls-writing` (m04, m05, m07 config lists).

## Verdict

**Accept once M1 is applied. No further round needed for it**: the text is given below and the orchestrator can check it lands. The minors are worth doing but don't block.

Every R1 finding is fixed: M1 (1977, ink 662), M2 (2016 and the ink bring-in at 671-683), m1 (1910), m2 (1914), m3 (1936), m4 (1974, 1981), m5 (both tables), m6 (1771), m7 (ink 1071), m8, m9, and n1 to n12 as the outcomes file says. The fixes match the code (`replace`, `pickPlacedCall`, `_placeCallFromTags`, the ringer constants). `A7_DOCS_NOTES.md` marks the merge to-do done (n12).

The docs describe what an author sees of the voicemail hold and say nothing of the save format, as asked. What they don't yet say is what A6 R2 added: several voicemails can be held, and one can land after the same contact's next call (M1).

Ink examples in the ink README (555, 602 wrapped in a hub, 620, 632 with its `VAR` lines, 651, 671 wrapped in a knot) compile with `bin/inklecate`. The 632 fragment gives a "loose end" warning only because it is the opening of a call, not a whole knot. JSON examples at 1605, 1635, 1707, 1744, 1786, 1803, 1825, 1858, 1892, 1900 and 2028 parse. Writing in the touched passages: UK English, plain, no banned words or filler.

## Major

**M1. Held voicemails stack and can land after the next call** (`README_scenario_design.md:1977`, `README_ink_best_practices.md:662`). Since `adc5169de` the ringer keeps a list of held voicemails per contact (`holdVoicemail` appends, `runVoicemail` chains runs per contact through `_voicemailRuns`), and a reload delivers each of them once, in order, quietly (the restore loop in `npc-manager.js`). `_threadOpenOn` now counts any open phone-chat on that contact, so a call with the same contact also holds a voicemail: declined with the thread open, then the contact rings again and is answered, and the voicemail runs when that call closes. The docs say "the voicemail waits", singular, and "when that thread closes". An m07 author writing six withheld taunts with voicemails (whose knots set `heard_*` flags that later taunts fold on) needs to know a voicemail can arrive after a later taunt has run. The plan tells authors to write for this ("Write voicemail knots so that reads right"); the docs don't. A held voicemail also shows no toast once the ending has closed the phone (A6 R2 n3).

Replace the hold sentences in the `onMissed: "voicemail"` bullet at 1977 ("While the contact's own thread is open ... A reload otherwise runs it with no toast.") with:

> While anything of that contact is open on the phone (its thread, or a call with it), the voicemail waits: the Missed call row shows at once, and the knot runs, with its row, lines, toast and any globals it sets, when that closes. Several can wait at once; each runs once, in the order the calls were missed. So a voicemail can arrive after the same contact's next call: declined with the thread open, the contact rings again and is answered, and the voicemail runs when that call ends. A reload delivers every waiting voicemail after the load, in order, with no toast and no second Missed call row. A call missed because of a reload also leaves its voicemail with no toast, and once the mission's ending has closed the phone a voicemail still runs but shows no toast.

Replace the bullet at ink 662 with:

> - It runs only when nothing of that contact is open (its thread, or a call with it). If the player declined with the thread open, the knot, and anything it sets, waits until they leave, and it may run after the contact's next call. Write it so it reads right then: set only flags that no later call depends on having been set first, or give the later call a branch for both orders. Don't make a hub choice in the same thread depend on a voicemail global at once.

## Minor

**m1. A replaced offer leaves nothing** (`README_scenario_design.md:1966`). `replace` (`phone-ringer.js:874-900`) swaps the new offer in with no row, no voicemail, no callback and no event, and the replaced mapping's effects ran when it was offered. For m07, a T-5 taunt still queued when T-1 arrives never leaves its voicemail, so `taunt_t5_vm`'s `heard_*` flags are never set. Add after "(a connected call is never replaced: the new offer queues)":

> The replaced call leaves no row, voicemail or event, but its mapping's `setGlobal` and other effects have already run.

**m2. A knot can be both a ring and a `call` entry** (`README_scenario_design.md:1920-1928`, `:1976`; `README_ink_best_practices.md:579`, `:618`). m04's `on_anomaly_confirmed` and m05's `topic_architect` are ring `targetKnot`s and also `button: false` call entries, so a hub choice can dial the same beat. The validator allows this, and `pickPlacedCall` (`phone-ring-config.js:177-187`) treats `#place_call:<knot>` naming a pending callback's knot as the callback: it skips `when` and sets `call_is_callback` true. The docs say only that a bare `#place_call` dials the callback, and the ink example keeps the two knots apart, so an author can't tell whether the m04/m05 shape is allowed or what the call VARs read on it. Add to the `#place_call` paragraph at 1928:

> A ring's `targetKnot` can also be a `call` entry (usually `"button": false`), so a hub choice can dial the beat the player missed. While that contact has a pending callback for the knot, `#place_call:<knot>` connects it as the callback (skipping `when`, `call_is_callback` true); otherwise it is an ordinary outgoing call.

And in the ink README `call_is_callback` row, change "or `#place_call` dialling a pending callback" to "or `#place_call` (bare, or naming the callback's knot) dialling a pending callback".

## Nits

- **n1** `README_scenario_design.md:2055` (validator errors, `call.when`). m05's Recruiter `when: "!globalVars.recruiter_line_dead"` reads a flag the ink sets with `~`. That reaches `globalVars` only when the name is in `globalVariables` (`npc-conversation-state.js:522`), and the validator doesn't count an ink `~` as a setter (`known_globals`), so it errors, correctly. The writer found this the hard way (WRITER_CALLERS R2 M4). One clause on the `call` table's `when` row would save the next author the trip: "A flag the ink sets with `~` must be declared in `globalVariables`, or the condition never sees it."
- **n2** `:1987` (events). A decline follow-up text needs two mappings (`phone_call_declined` and `phone_call_missed`), and the `missed` one also fires on a reload (`data.reload`). Both m04 and m05 add one. Suggest: "A follow-up for a call the player didn't take maps both events; add `!data.reload` to the `missed` one if the text should not follow a reload."
- **n3** `:1977`. A pending Call back now survives a reload beside held voicemails or a live offer from the same contact (the slot's `callback`). The docs never said otherwise, so nothing is wrong; mention it only if the paragraph is being rewritten anyway.

## Author pass: m04, m05, m07 from the docs alone

| Need (from the writer notes) | Docs | |
|---|---|---|
| m04 Vance `call` with `when` + `unavailable: "no_answer"`, contact `callLabel` | 1906-1914 | yes |
| m04/m05 HaX: ring knot also a `button: false` call entry, hub dials it | 1920-1928 | m2 |
| m04/m05 decline/miss follow-up text on `phone_call_declined`/`missed` | 1979, 1985-1989 | yes (n2) |
| m05 root-flag ring with `untilAnswered` and a `call_answer_seconds` line | 1878, ink 618-643 | yes |
| m05 Recruiter: three ring mappings, effects at ring time, `onceOnly` | 1882 | yes |
| m05 Recruiter `when` on an ink-set flag | 1910, 2055 | n1 |
| m07 withheld rings with voicemail, terminal theme | 1877, 1978, 2024 | yes |
| m07 several taunt voicemails, late arrival | 1977, ink 662 | M1 |
| m07 T-1 replacing T-5 | 1966 | m1 |
| m07 forced withheld sign-off from `minigame_completed`/`failed` | 1877, 1882, 1968 | yes |
| Bring-in `#ending_check` (bracket and line forms) | 2016, ink 671-683 | yes |
| `delay` on old `sendTimedMessage` becomes `delayMs` on the ring mapping | 1880 | yes |
