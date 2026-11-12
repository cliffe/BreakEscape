# Review A7 docs, round 1

Reviewer: Opus, 2026-11-12. Read-only review of `build/phone-calls` at `2fdb990ef`.

Scope: `README_scenario_design.md` 1601-1616 (timed conversations table), 1629-1690 (event mappings table), 1736-1780 (Phone NPCs), 1817-2066 (forced calls, "Voiced phone calls" to "What the validator checks for phone calls"); `README_ink_best_practices.md` 547-679 ("Writing call and voicemail knots") and 1046-1067 ("Remote conversations: write for the mode"); `docs/agents/phone_calls/A7_DOCS_NOTES.md`. Checked against `phone-ring-config.js`, `phone-ringer.js`, `phone-ringer-dom.js`, `phone-chat-minigame.js`, `phone-chat-conversation.js`, `npc-manager.js`, `scripts/validate_phone_calls.rb`, `dialoguelint.mjs`, and the A5 R1 and A6 R1 outcomes.

## Verdict

**Accept after the M and m fixes. No blockers.** An author could write a mission's rings, rangeable contacts, `#place_call` hub choices, callbacks and voicemails from these two READMEs without opening the plan or the code. Field names, defaults and allowed values match `normaliseRing` and `normaliseCall`. The timings match the ringer constants (20 s ring-out, 6 s auto-answer, 4 s hit quiet, 90 s hold, 2.5 s dial, 6 s ring-out, 3 s re-ring after a reload, 0.5 s open). The validator list matches `validate_phone_calls.rb` on error versus warning for every check. The old forms are described correctly, apart from one wrong example (m3). Two behaviours that landed after the docs, the voicemail hold (A6 R1 M1) and the call-side behaviour of `#ending_check` (A5 R1 m1), are missing. Plan 9.1 (a reload cuts an outgoing call, no row) is covered at 1977. The A5 Call-button refresh is missing (m1) and the dial caption is only partly covered (m2).

Every plan 6 "A7" docs item is present (see the tick list at the end). Writing: UK English, plain, no banned words or filler found, no em dashes in these sections. JSON examples at 1855-1864, 1889-1893, 1897-1900, 1822-1830 and 2023-2025 parse. Ink examples were compiled with `bin/inklecate` in the scratchpad: all compile apart from the voicemail example (m8).

## Major

**M1. The voicemail hold is not documented** (`README_scenario_design.md:1973`, `README_ink_best_practices.md:641-654`). Since a2f44896c, `NPCManager.runVoicemail` waits while the contact's own thread is the open phone-chat (`_threadOpenOn`, `_whileThreadOpen`) and runs only after `conversation_closed:<npcId>`. The "Missed call" row shows at once. The voicemail's row, lines, toast and any `~` or `#set_global` it runs come later. The slot carries a held voicemail, and a reload delivers it quietly with no second Missed call row. This is the common case for the in-phone panel: the player has the caller's thread open, the call rings inside the phone, and they press Decline. An author whose voicemail knot sets a global that a mapping or a hub choice waits on needs to know that it is delayed. Add to the `onMissed: "voicemail"` bullet at 1973:

> While the contact's own thread is open (for example the player declined from the panel inside that thread), the voicemail waits: the Missed call row shows at once, and the knot runs, with its row, lines, toast and any globals it sets, when that thread closes. A reload before then delivers it after the load, with no toast and no second Missed call row.

Add to the ink README voicemail bullets (after 652):

> - It runs only when the contact's thread is closed. If the player declined with that thread open, the knot, and anything it sets, waits until they leave the thread. Don't make a hub choice in the same thread depend on a voicemail global at once.

**M2. `#ending_check` inside a call is not described** (`README_scenario_design.md:2010-2012`, `README_ink_best_practices.md:656-668`). The general ending-check table (2281-2282) says a line-level tag "skips the rest of that line's tags ... The story carries on". In a phone-chat the behaviour is different (`phone-chat-minigame.js:916-921`, `1285-1289`, `_endingKeptGoing`). On "Keep going", every NPC line in that batch is dropped, not just the tagged line, and so are all its tags, including `#exit_conversation`. A call whose story has then run out hangs up 2 s later through the story-end branch (`_releaseForcedCall`, `FORCED_CALL_END_CLOSE_MS`). The bracket form `[On my way. #ending_check]` leaves the same choices on the call screen. Every bring-in call is written to this shape (m01, m03 in plan 7.2), and the bring-in section never says where the tag goes. Add to "Endings and calls" after 2012:

> **`#ending_check` in a call.** In the brackets (`+ [On my way. #ending_check]`), "Keep going" leaves the call on the same choices. On a line or after the brackets, "Keep going" drops every NPC line and every tag of that reply, `#exit_conversation` included. The call then ends 2 s after its story runs out, and the thread is back on its home knot. Either way the hand-off line is not heard. Put `#ending_check` before the `#set_global` that starts the debrief.

Add to "A bring-in hand-off" in the ink README, with the example changed to:

```ink
+ [I'm done here. Bring me in.]
    #ending_check
    #set_global:debrief_go:true
    Bringing you in now.
    Stay sharp in there, and say nothing you don't have to.
    #exit_conversation
    -> DONE
```

> `#ending_check` comes first. If the player chooses "Keep going", the reply's lines and tags are all dropped and the call hangs up, so the debrief global is never set.

(Compiled with `bin/inklecate`. It needs no `VAR` lines, because `#set_global` is a tag.)

## Minor

**m1. The Call button now updates while the thread is open** (`README_scenario_design.md:1906`, 1912). A5 R1 m2: `_watchCallButton` re-asks the button on every `global_variable_changed:*` while a thread is open, and a stale button that dials nothing hides itself. The docs say only that `when` decides "whether the button shows". Add to 1912:

> The button is worked out again whenever a global changes while the thread is open, so it appears or goes without the player leaving the thread.

**m2. Where the captions come from** (`README_scenario_design.md:1910`, 1946). The banner and the in-phone panel show only the mapping's or `timedConversation`'s `callLabel` (`phone-ringer-dom.js:108`, `144`). They don't fall back to the contact's `callLabel`, so a ring with no `callLabel` on its mapping has no caption on the banner, even when the contact has one. The call screen does fall back (`callLabelFor`). For dialling, a callback uses the ring's `callLabel` and an entry uses the contact's (`phone-ringer-dom.js:498`). Replace 1910 with:

> The caption under the name: on the incoming banner, the mapping's or `timedConversation`'s `callLabel` and nothing else (put it on the ring mapping); on the call screen and while dialling, the call's `callLabel` (a callback keeps the ring's), else the contact's `callLabel`, else "Voice call".

**m3. Ruth is not a contact-level voiced contact** (`README_scenario_design.md:1932`). In `lab_social_engineering` only `dev_service_desk` has `voiced: true` and `callLabel` (`scenario.json.erb:1795-1796`). `ruth_phone` (`:1631`) is a plain text contact. Her saved-state hash is a regression check, which is probably where the mix-up came from. Change "(lab Dev, Ruth)" to "(lab Dev)".

**m4. A call that is cut short never leaves a voicemail** (`README_scenario_design.md:1970`, 1977). `leaveMissed(o, { answered: true })` (`phone-ringer.js:428-438`, `577`, `697`; `missedOffline` at `1140` with `answered: rec.state === 'connected'`) always leaves a callback for a call that had been answered and was then dropped. That covers a reload while connected, and a non-forced call closed by a knockout or by another minigame. A withheld call leaves nothing. The docs say "then `onMissed` applies". Replace the first sentence of 1977 with:

> A reload turns every non-forced call that was queued, ringing, held or connected into a missed call (a row, no toast, `phone_call_missed` with `reload: true` once the game has loaded). A call that had not been answered then follows `onMissed`. One that was connected leaves a callback even with `onMissed: "voicemail"`, because the player had picked up, and a withheld one leaves nothing. A non-forced call closed some other way while connected (a knockout) is treated the same way.

Add "a connected call cut short" to the list of what leaves a Missed call row at 1970.

**m5. `voiced` and `callLabel` have no rows in the two tables** (`README_scenario_design.md:1615-1624`, `1667-1690`). Both fields are read on mappings and timed conversations (`npc-manager.js:364-365`, `1041-1042`), and the ring example uses `callLabel`. The table rows that explained `voiced` were removed in c09600b2c, and both tables now name only `ring`. Add to each table:

> | `voiced: true` | `phone-chat` only: the conversation opens at once as a voiced call (the older form; see "Every form, old and new"). Not needed with `ring`. |
> | `callLabel` | With `ring` or `voiced`: the caption under the caller's name, as the phone would show it ("SAFETYNET secure line"). |

**m6. The Phone NPCs rule on `targetKnot` contradicts `ring`** (`README_scenario_design.md:1771`). "`targetKnot` in event mappings does **not** work after first conversation" is true only of the bare `targetKnot` action (a jump with no `conversationMode`). A `phone-chat` mapping opens at its `targetKnot` (`npc-manager.js:1653`), and `ring` requires one. Replace with:

> - A bare `targetKnot` (no `conversationMode`) does **not** move a phone NPC's thread after the first conversation; use `setGlobal` and an Ink conditional hub choice. A `phone-chat` mapping (with or without `ring`) does open at its `targetKnot`.

**m7. The mode table has no row for a ring voicemail** (`README_ink_best_practices.md:1056`). The only "Voicemail or recording" configuration listed is a `type: "phone"` object. Change the row's middle cell to:

> `type: "phone"` object with `voice` and `ttsVoice`; or a missed `ring` with `onMissed: "voicemail"` and `voicemailKnot` (its `voice:` lines). See "A voicemail knot".

**m8. The voicemail example does not compile** (`README_ink_best_practices.md:643-649`). `~ heard_vm = true` with no declaration: inklecate gives "Variable could not be found to assign to: 'heard_vm'". Add `VAR heard_vm = false` above `=== ring_vm ===`. With it, the example compiles.

**m9. The first call-knot example dials a knot it doesn't contain** (`README_ink_best_practices.md:561-563`). `start` dials `#place_call:extract_call`, but the example's only call knot is `first_call` (an incoming ring). It compiles, but the validator would report an error unless the contact lists `extract_call`, and a reader can't tell which knot is the placed call. Either rename the choice to `+ [Ring me back.]` with `#place_call:first_call` and a note that `first_call` is also a `call` entry, or add a two-line `=== extract_call ===` knot (`// lint: call-knot`, a line, `#exit_conversation`, `-> DONE`) and say in one sentence that `first_call` rings and `extract_call` is dialled.

## Nits

- **n1** `README_scenario_design.md:1958`. The rang-off toast has two other forms: "The caller rang off." when withheld, and none when the call leaves a voicemail (the voicemail toast replaces it, `phone-ringer.js:502-509`).
- **n2** `:1992` and `README_ink_best_practices.md:577`. Add: "A ringer call whose story ends without the tag hangs up 2 s after its last line." That is the fallback, so readers know what a forgotten tag does.
- **n3** `:1962`. "On a different knot it replaces the first" applies only while the first is queued, ringing or held. A connected call is never replaced: the new offer queues (`phone-ringer.js:850-851`). When the player rings a contact, a queued incoming offer of that contact on the same knot is dropped (row 31). Neither is stated.
- **n4** `:1972`. A callback "dials and connects at once" still shows CALLING for the 2.5 s dial (`phone-chat-minigame.js:1402-1419`). It only skips `when`. Suggest "connects after the dial, skipping `when`".
- **n5** `:1983`. A plain outgoing call (button or `#place_call`, not a callback) emits no `phone_call_answered`. Say so, so no author maps a placed call's effects to it.
- **n6** `:1916`/`:1924`. `#place_call` inside a call, or in a `disableClose` thread, does nothing. If it can't dial (a call is already on), the thread stays on its choices. One sentence each.
- **n7** `:1873`/`:1974`. `withheld` hides the caller only on the banner, the rows and the toasts. The answered call screen and the contact list still show the contact's `displayName`, so give a withheld caller a neutral display name if the name would give it away.
- **n8** `:2045`. "`ring` with no `targetKnot`" is not an error on a contact with `voiced: true` (`validate_phone_calls.rb:347`). `:2048`: the list leaves out the error for a `call.when` that is not a string (`:398`).
- **n9** `:2063`. "Contacts using the old `voiced` forms are exempt for the contact-level form only" is hard to parse. Suggest: "A contact with contact-level `voiced: true` is exempt. A contact whose only calls are `voiced: true` mappings is not."
- **n10** `README_ink_best_practices.md:582`. "Scenario order no longer decides who speaks" is true for an id prefix only. A display-name prefix still picks the first registered record (`NPCManager.resolveSpeakerId`), as 1064 says. Suggest "With an id prefix, scenario order doesn't decide who speaks."
- **n11** `README_ink_best_practices.md:619`. Ringing from an offer that a newer one replaced also counts toward `call_answer_seconds` (`replace`, `phone-ringer.js:871`). Could be a clause in the table cell.
- **n12** `A7_DOCS_NOTES.md:11-14`. "To do after merging main" is done: the mode table row at `README_ink_best_practices.md:1053` already names `ring`, `call` and the new section. Mark it done so the orchestrator doesn't redo it. The skill-change lists check out: the tts-audio lines 17, 21 and 36 and npc-dialog-review 2j are where the notes say.
- **n13** (not a docs fix, for the orchestrator) The engine dials `#place_call:<knot>` for a pending callback's knot even with no `call` entry for it (`pickPlacedCall`, A6). The validator errors on that tag. The docs follow the validator, which is the safer rule, so leave the docs. The validator could accept a ring knot with `onMissed: "callback"` if a mission ever wants it.

## Plan 6 "A7" tick list

| Item | Where | |
|---|---|---|
| Voiced phone calls: new forms 3.1-3.5 | 1844-1942 | yes |
| Events | 1979-1987 | yes |
| Hold, and the `minigame_failed` caveat | 1958-1960 | yes (plus M1 for the voicemail) |
| Popup behaviour | 1954 | yes |
| End with `#exit_conversation` and `-> DONE` | 1992 | yes |
| `#place_call` | 1916-1924 | yes |
| "Call me" rule | 1993 | yes |
| Event mappings table `ring` | 1679 | yes (m5 for `voiced`, `callLabel`) |
| Timed conversations table `ring` | 1624 | yes (m5) |
| Phone NPCs: `call` entries; the stale `conversationMode` rule fixed | 1772-1774 | yes (m6 for the `targetKnot` rule) |
| `ring.untilAnswered` | 1874 | yes |
| Busy rule (beat waits, `*_in_view` dropped, toasts held) | 1999-2008 | yes |
| Ink: call knot, voicemail knot | 551-582, 639-654 | yes (m8, m9) |
| Ink: `#place_call` on a hub choice | 590-606 | yes |
| Ink: "Call me" rule | 584-588 | yes |
| Ink: id prefixes for same-named records | 582, 1064-1067 | yes |
| Ink: `call_answer_seconds`, `call_is_callback`, conditional-line pattern | 608-637 | yes |
| Ink: bring-in hand-off | 656-668 | yes (M2) |
| Ink: call-opening rules of 3.6 | 670-679 | yes, all seven |
| Log the tts-audio skill changes | `A7_DOCS_NOTES.md` | yes |
