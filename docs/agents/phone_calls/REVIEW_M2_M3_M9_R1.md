# Review R1: M2, M3, M9 (and the m09 lab sheet)

Reviewer: Opus, fresh context, 2026-11-12. Findings only; no files edited except this one.

Commits read: M2 6a4838075; M3 e9dcb1b34, 03fbf81dc, f518e5a79, 582f008b3, 29bec8a40 (proofs in 2f0d855cf); M9 a341c0978; HacktivityLabSheets 327a32b, f8bf9ed.

## Verdicts

| Slice | Verdict | Why |
|---|---|---|
| M2 | **accept** | Key diff is exactly what step 5 allows; styles are m01's byte for byte; the art copy without `spriteSheet` is right. One proof gap (m5), not a defect. |
| M3 | **revise** | One major: a read-out can play twice, and its text lands after it (M1). Small fix. The routing otherwise holds. |
| M9 | **accept** | No line reads as a call inside a thread. Two objective titles still say "Call" (m6, m7): fix them in this slice or log them for the next. |
| Lab sheet | **revise** | Two sentences in the m09 sheet don't match what the player now sees (m8, m9). |

## Checks run

- **Key dump** (`dump_tts_keys.rb`, plain and with `TTS_DUMP_LABELS=1`) against `keys_baseline_a1/`: only `m09_digital_archaeology` (-58 / +58) and `m10_full_disclosure` (-18 / +22) move. With labels, every added key belongs to its expected speaker: m09 58/58 `hax_voice`; m10 12 `hax_post` and 10 `hearing`, the same rows as `M2_KEYS.md`. No added key belongs to `agent_0x99` or to anyone else, so no co-speaker line moved, `m10_ghost_phone.ink:109` included. `compare_tts_keys.rb` exits 1 only because no allow file was passed.
- **Prefixes:** the 14 m10 files have 0 `Agent HaX:` left. Their `agent_0x99:` counts match the 7.2 row exactly (tesseract 56, six_oclock 21, netherton 15, nightshade 6, gary/imran/kowalczyk 2, the other seven 1 each). Only `m10_hax_post.ink` (12) and `m10_hearing.ink` (10) keep `Agent HaX:`. `m09_briefing.ink` has 59 `hax_voice:` and 0 `Agent HaX:`. The other m09 files are untouched.
- **Styles:** `hax_briefing` / m09 `hax_voice` are identical to m01 `briefing_cutscene` (`m01_first_contact/scenario.json.erb:559`). `hax_debrief` is identical to m01 `closing_debrief_person` (`:1136`). Name `Aoede` and `en-GB` match too.
- **Art:** `spriteTalk`, `spriteVisemes` and `spriteConfig` were copied onto both `agent_0x99` records; `spriteSheet` was not. That is right. `validate_scenario.rb:3263-3265` warns on `spriteSheet` on a phone NPC. `person-chat-portraits.js:376` takes the explicit `spriteTalk` first and only derives one from `spriteSheet` when it is missing (`:378-387`), so the portrait is the same. Proof: `proofs/M2/m10_hax_portrait.png` (Netherton's scene, name "Agent HaX", her portrait, requested under `agent_0x99`, 200).
- **Validator:** m09 0 errors, 26 warnings; m10 0 errors, 64 warnings, plus one dialoguelint word-cap line at `m10_phone_agent0x99.ink:584`, which is pre-existing in a file nobody touched; lab_physical_pentest 0 errors, 5 warnings. None of the warnings concerns the changed lines.
- **dialoguelint:** no finding on any changed line in the three scenarios.
- **Ink JSON** recompiled with inklecate for `m09_phone_agent0x99`, `ruth` and `m10_tesseract`: identical to the committed JSON.
- **`tts_mission_lines_test.rb`** under `flock /tmp/be-test-suite.lock`: 5 runs, 44 assertions, 0 failures.

## Findings

### M3

**M1 (major): a read-out can play twice, and its text arrives after it.** `scenarios/m09_digital_archaeology/scenario.json.erb:139-154` (`read_text`), `:224`, `:300`, `:320`, `:359-360`; `ink/m09_phone_agent0x99.ink:216-217, 250-253, 298-299, 599-604`.
- Failure: flag 1 goes in at the drop terminal. The 2.5 s `delayMs` waits until the terminal closes (`npc-manager.js:646-650`), then the mapping fires and schedules the text 5 s out. The player opens the phone and HaX's thread inside those 5 s. `support_hub`'s guard diverts to `flag1_read`, which plays, gives `catalogue_salvage_line` and ends on "Got it.".
  - With the phone closed, the text "First box is in… Open this." is delivered with a toast. Tapping it calls `goToKnot('flag1_read')` unconditionally (`npc-barks.js:781-782`), so the read-out plays a second time and `#give_item` runs again.
  - With the thread still open, the text lands in the thread after the read-out. The toast is dropped (`npc-barks.js:150`), but "Open this." now sits below a read-out the player has already read.
- The same 5 s window exists for `ledger_read`, `afterwards` and `hour_read`. Their mapping conditions do re-check a heard global when the delay ends (`_handleEventMapping`). But `sendTimedMessage` is built with no `skipIfGlobal` (`npc-manager.js:1285`), so once a text is scheduled, nothing cancels it.
- `flag1_read` has no global at all (`flag1_read_heard` is ink-local), so even its mapping condition can't see that the read-out was heard.
- The proofs cover "toast tapped first" and "toast ignored, thread opened after delivery", not "thread opened before delivery".
- Fix, both parts small:
  1. Make each read-out knot idempotent. As its first line, before the shadow is set, add `{flag1_read_heard: -> support_hub}`, `{ledger_read_here or ledger_read_heard: -> support_hub}`, `{afterwards_here or afterwards_heard: -> support_hub}` and, in `hour_read` before `-> body`, `{hour_read_here or hour_read_started: -> support_hub}`. `hour_read_resume` diverts to `hour_read.body` directly, so the resume path is not affected. A stale toast tap then shows the hub.
  2. Give `read_text` a `skip:` argument that emits `"skipIfGlobal"` inside `sendTimedMessage`. Pass `ledger_read_heard`, `afterwards_heard` and `hour_read_started`. For flag 1, add a global (for example `#set_global:flag1_read_heard:true` on the knot's first line, declared in `globalVariables`) and pass it. `skipIfGlobal` also drives the toast's `stillValid`, so a toast that is already queued closes as well.
  3. Prove it live: open HaX's thread inside the 5 s window, close it, wait out the delay, and show that no text or toast arrives and that a forced tap shows the hub.

**m1 (minor): the backstops could have stayed; "not possible" is wrong.** `scenario.json.erb:300-303` (comment), handover `HANDOVER_M2_M3cfg.md` Open 3.
- `read_text` already takes a `latch`, a global set when the mapping fires, which is exactly when the text is scheduled. A pending text survives a reload (E12). So `game_loaded` with `!<latch>` means "never scheduled", which is the only case a backstop needs to cover. `hour_read_texted` already does this for the hour read.
- Failure: the player submits flag 2 (or flag 4) and stays in the drop terminal. The delayed mapping waits for it to close (`npc-manager.js:646-650`). If they reload or end the session there, the text is never sent: there is no toast, no badge and no forced open.
  - `ledger_read_heard` gates the Recruiter's ring.
  - `hour_read` gates `tesseract_call`, which gates `[Bring me in.]`.
  - The hub routing still delivers both when the player opens HaX's thread, so nothing is locked for good. But nothing on screen tells them to open it.
- Fix: give flag1, ledger and afterwards a latch (`*_texted`), as `hour_read` has. Add one `game_loaded` `read_text` per read-out with the condition `<event global> && !<latch> && !<heard global>`, plus the `skipIfGlobal` from M1. The reload proof should then show one copy when the text is pending, one when it is delivered, and one when the reload came before the mapping fired.

**m2 (minor): "Hear her out first. I'll be here after." is wrong for this scene.** `ink/m09_phone_agent0x99.ink:138`.
- HaX is on the Recruiter's call (`m09_phone_recruiter.ink`: 28 `Agent HaX:` lines, for example `:92`, `:137`, `:148`), so "I'll be here after" tells the player she won't be. "Hear her out" also reads as HaX endorsing an ENTROPY recruiter's pitch, which is softer than she is.
- The old line's only fault was the promise of a ring.
- Fix: "Her call first. I'll be on it with you." It stays terse and makes no ring promise.

**m3 (minor): "Open this." in two of the four toasts.** `scenario.json.erb:224` (flag 1) and `:359-360` (hour read).
- In the thread history the line sits above the read-out and points at nothing, because a text can't ask to be opened once it has been. The two toasts also share a shape in one mission (3.6, "vary the shape").
- The ledger text ("There's an entry you need to see.") and the afterwards text ("A word when you can.") read well.
- Fix: drop "Open this." from both. Suggested texts: "First box is in. It came with a list." and "The job on his box has a clock on it." The toast is the call to action.

**Known gap (closing mid-knot): acceptable.**
- A reopen re-runs the knot that owns the first choice, so a player who closes inside `flag1_read` reopens at its choice. They finish with one click, and the next read-out comes on the following open.
- The toast still goes straight to the newer knot. Each read-out is one or two choices long. Nothing is gated on the order.
- No change asked. It is worth one line in the README's phone section when A5 lands.

**Guards and ordering (no defect found).**
- `hax_scene_pending()` (`:713-714`) is the exact union of the two `start` guards. Every voiced scene, the Recruiter's ring and the forced re-rings keep their own mappings, and none of them reads a read-out shadow.
- A read-out can't block them. The only scene that waits on a read-out is `tesseract_call`, via `hour_read_done`, which the old design also had.
- The m09 ending (`[Bring me in.]` on `tesseract_call_done`) is reached on the hand path in `proofs/M3/hand_hour_read_4_reopen.png`.
- The shadows (`*_here`, `flag1_read_heard`) are sound. Ink-local VARs persist in `storyState` (plan 1.7). None of them shares a name with a scenario global, so global sync never overwrites them. The contact has no `livePreview`, so a contact-list preview never runs the router.
- Dropping the `room_entered` and then the `game_loaded` backstops is sound apart from m1.

**n1 (nit):** `start` (`:134-142`) repeats the conditions instead of calling `hax_scene_pending()`, so the two can drift. Call the function in guard 1. Guard 2 stays separate because its text differs.

**n2 (nit):** the comment at `:130-131` says "the forced voiced call opens at once when this thread closes". That is wrong for guard 2 (the Recruiter rings on the next room exit) and for `hour_read_resume` (a silent re-ring).

**n3 (nit):** hub topic `[Afterwards.]` (`:819`, `deck_choice_made and not afterwards_heard`) can now show only when `afterwards_here` is set and `afterwards_heard` isn't. That can't happen from the thread, because the knot has no choice before its last line. Drop it, or note why it stays.

**n4 (nit):** dialoguelint reports m09 "[timed texts] texts=0". It doesn't read texts built by the `read_text` helper, so the four new texts go unlinted. Log this for A7.

**n5 (nit):** `flag1_read_heard` is ink-local, but `_heard` names a global elsewhere in this file (`ledger_read_heard`, `afterwards_heard`), and the other shadows end `_here`. If M1 adds a global of that name, keep both. Otherwise rename the local to `flag1_read_here`.

### M2

**m5 (minor): proof gap against step 6.**
- There is no screenshot of an m09 on-the-line scene (Sorensen door, Noor) drawing HaX's art. That is the change logged for the user as "m09 now looks different".
- There is no m10 Tesseract-scene screenshot compared with A0; only request ids were captured, because the scene ran during autoBrief. `m09_briefing_hax.png` shows `hax_voice`, which had its art already.
- The config is right (the m10 Netherton proof shows the same mechanism), so this doesn't block acceptance.
- Fix: one route each that reaches Noor's counter or the Sorensen door (not `--start-room`, which strips phone records) and the Tesseract scene outside autoBrief. Screenshot a HaX line in each.

**n6 (nit):** m09's on-the-line scenes still pick the voice by order: `agent_0x99` comes before `hax_voice` in the `loading_dock` npcs array, `scenario.json.erb:854` vs `:1030`.
- Arrays keep their order through jsonb, so this holds in a stored game. Plan 3.5 still prefers the id prefix.
- Prefixing `agent_0x99:` in `m09_sorensen_door`, `m09_sorensen_hatch`, `m09_noor_haddad`, `m09_alpha_recording` and `m09_closing_debrief` moves no key, and the order would no longer matter. Optional.

**n7 (doc):** the log (2026-11-12 A1 R2 entry) says M9 makes `lab_physical_pentest` flag against `keys_baseline_a1/`. It doesn't. That baseline was cut at a7c55d436, after a341c0978, so Ruth's re-key is already in it: `keys_baseline` → `keys_baseline_a1`, `lab_physical_pentest`, -`e4838cbb…` +`9cb4d78a…`. Only m09 and m10 flag. The audio top-up still has to voice Ruth's line.

### M9

The Ruth line (`lab_physical_pentest/ink/ruth.ink:72`) reads naturally in person, and her contact is a text thread.

None of the sis02 or sis03 lines reads as a call inside a text thread. Every sis02 "ring" is a call somewhere else: Marcus `:139`, `:162`, `:263`, `:279`, `:292`, `:355`; Tom `:143`, `:149`, `:170`. The sis03 `call_initial` openings (James, Hartley, Ngata) read as messages, and their "call" uses are idioms. I agree with the writer.

The player still sees "call" in two objective titles and one item description:

**m6 (minor):** `sis02_energy/scenario.json.erb:247`. The objective title "Call Marcus Webb and Investigate" contradicts its own description ("Message Marcus Webb…", `:248`) and the text thread. Fix: "Message Marcus Webb and Investigate". The task id `call_marcus_initial` can stay.

**m7 (minor):** `sis03_cyber_insurance/scenario.json.erb:296`. The task title "Call Robert Ngata (NCSC) — assess Trent Water third-party exposure" belongs to a text contact. Fix: "Message Robert Ngata (NCSC) — …". There is no lab sheet to update.

**n8 (nit):** `lab_physical_pentest/scenario.json.erb:58`. The phone's description, "with Ruth on speed dial for a nudge", implies a call, while Ruth now says "Message me". Fix: "with Ruth a message away for a nudge when you're stuck."

### Lab sheet (HacktivityLabSheets `_labs/safetynet/m09_digital_archaeology.md`)

The three edited sentences (`:63`, `:364`, `:478`) are right about texts. `:63` holds because the dock is still a forced unvoiced thread, which opens the phone.

**m8 (minor): `:369`.** The Nudge for the same step still says "Submit the ledger flag… Soon after, the recruiter rings". The ring now waits until the ledger read-out has been heard (`ledger_read_heard`), which the hint above it (`:364`) now says. Fix: "Submit the ledger flag at the drop terminal, then open HaX's text about the ledger. Soon after, the recruiter rings…".

**m9 (minor): `:488`, and `:478` "the Architect's own call".** f8bf9ed's "listen to the Architect's call" reads as if the player hears him. In `tesseract_call` he rings HaX and the player hears only her side (`m09_phone_agent0x99.ink:687-688`). The old step said "listen to the hour read and the call". Fix `:488`: "open HaX's text about the hour read, and stay on while HaX takes the Architect's call." Change `:478` to match: "then the Architect ringing HaX".

Nothing else in the m09 sheet is now wrong. The flag-1 steps (`:262-264`, `:433`) place the salvage line on the drop terminal screen and in your notes. The note comes from the flag-1 read-out, which the hub routing guarantees once HaX's thread is opened. The m10 sheet describes nothing M2 changed: voice styles and a portrait the player already saw. VM companions not opened.

## Counts

0 blocker, 1 major (M1), 9 minor (m1–m9), 8 nits (n1–n8).
