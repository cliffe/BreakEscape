# m02 voice tidy: code review, round 2

Branch `build/m02-voice-tidy`, head 6b053d266 (the round 1 fixes are f96e2299e and e4bff134f; 6b053d266 merges main in). Read only; nothing fixed. HaX's 308 missing and 308 unused clips, caused by main's voice-style change in 1fd322e67, are left out here because the user is deciding on them separately.

## What was checked

- **Ink.** `m02_phone_ghost.ink` recompiled with `bin/inklecate` into a scratch file. The result is identical to the committed `m02_phone_ghost.json`. The compiled JSON holds the new narrator line four times (ink lines 617, 633, 659 and 670) and no copy of the old one.
- **The line in each medium.** I read the four endings and the path into `act3_deal_accepted` from the terminal device: `mid_mission_contact`, line 259, then `act3_accept`. `phone-chat-speaker.js` treats a line starting `Narrator:` as narration in phone chat, so on the terminal path the line shows as narration, not as a Ghost bubble.
- **TTS cache.**
  - `tts:wasted[m02_ransomed_trust]` expects 1087 lines and finds 0 sidecars on older keys. Its 308 unrequested clips are all HaX (out of scope).
  - The `prune_cache` dry run lists 333 orphans: the same 308 HaX clips, plus 25 MP3s with no sidecar. All 25 date from e424c2f96 (2026-07-19) and are already on main, so they predate this branch.
  - The new clip, `f9805ba2eb7049cdc78732de3c3656b3`, is matched and is not an orphan.
  - Its sidecar text is the ink line without the `Narrator:` prefix, with speaker narrator, voice Algenib, m02's narrator style, en-GB and the current model.
  - The old `f823da1dd62931244d6228b9a38ddde6` MP3 and sidecar are both gone. Nothing else in m02's ink or cache contains "Ghost protocol".
- **Validator over all 175 scenarios.**
  - Setup: main (1ba8c5cd7), the round 1 head (86ba7768e) and this head, each run from its own extracted `scripts/` folder against the same scenario files, `--no-graph`.
  - 86ba7768e against head: the error and warning lines are identical in every scenario (106 errors, 1026 warnings in both). The `_dispatch` change makes no difference to any scenario today.
  - Main against head: only removals. m02 goes from 63 errors to 0, m06 from 11 to 0, sis01 from 17 to 1 (the leftover is the unrelated `interactionWarning` shape error), and sis03 from 4 to 0. Each "Found N unknown field(s)" header goes along with its errors. Nothing is added anywhere.
- **Dispatch keys.** Every schema in `minigame-data-schemas.json` against the engine code that opens it (`interactions.js`, `unlock-system.js`, `minigame-registry.js`). Results are under m1.
- **The test.**
  - Run against this head's validator: 1 of 1 passes.
  - The same test file run against 86ba7768e's validator: it fails at the first new assertion (`notes`: expected 1 error, got 0). The `kiosk` row would fail there too, with the false "missing required field 'episodeId'", so both new negative rows tell the old code from the new.
  - The `ehr_terminal` row passes on both and guards the id path, which is what it is for.
- **Backlog entry** at `docs/IDEAS_BACKLOG.md:41`. Its claims match the code: the generic gate at `interactions.js:1335` to 1345 and at 1664, and the only schemas declaring `requiresGlobal` are `pc` and `report-workstation`.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. `_dispatch` holds one key, but `sis_config_panel` is dispatched on id as well as type.** `scripts/minigame-data-schemas.json:29` (no `_dispatch`), read at `scripts/validate_scenario.rb:489` to 495.

`interactions.js:1451` opens the SIS config minigame when `id === 'sis_config_panel'` or `type === 'sis_config_panel'`. Before this branch, the validator's id lookup was a fallback for any schema. Now an id counts only for schemas marked `"_dispatch": "id"`, and `sis_config_panel` has no `_dispatch`, so it is matched by type alone. Here the change can hide a real error. Two failure scenarios:

- An object `{ "type": "workstation", "id": "sis_config_panel", "minigameData": { "title": "..." } }` opens the minigame in game. The validator now reports only "no schema is defined for 'workstation'", a warning, and skips the field checks. The missing required `rows` (which the minigame needs) is no longer reported. Main's validator, through the id fallback, reported it.
- With `"type": "pc"`, the same object gets false "undeclared field" errors for `title` and the other optional fields, and still no error for the missing `rows`.

No scenario does this today: the one `sis_config_panel` object, sis02 `scenario.json.erb:2075`, has type and id the same. That is why the full-scenario comparison shows no change.

`backup_recovery` has the same dual dispatch (type at `interactions.js:1507`, lockType at `unlock-system.js:811`). It is safe, because the validator takes `type` for any schema whatever its `_dispatch`.

Fix: let `_dispatch` take a list, for example `"_dispatch": ["type", "id"]` on `sis_config_panel`, and have `dispatched_on` test membership. Or, smaller, mark `sis_config_panel` `"_dispatch": "id"` (type is matched anyway). Then add a test row for a `pc` with id `sis_config_panel` that is missing `rows`, expecting the missing-field error.

### Nit

**n1. The schema file's header comment still says every `lockType` match counts.** `scripts/minigame-data-schemas.json:2` (`_comment`). It reads "every schema its 'type', 'lockType', 'id' (for objects whose dispatch is id-based) ...". It ends by saying the `_dispatch` entries "document which key is used at runtime", but `_dispatch` now decides whether a match counts.

Failure: someone adding a lockType-dispatched schema without `_dispatch` would expect it to match by lockType, and it silently does not. The validator then checks only the type's schema, which gives false errors on a real layer's fields.

Fix: reword it to say "'lockType' and 'id' count only for entries whose `_dispatch` names that key; 'type' and 'interactionType' always count."

**n2. The backlog entry sits under "Engine and UI", in the list headed "From the PIN cracker fix (2026-10-10)".** `docs/IDEAS_BACKLOG.md:41`. It is a validator change, and `## Tooling` (line 117) is where validator and lint items live.

Failure: someone looking for validator work in Tooling misses it.

Fix: move it to Tooling. The wording itself is accurate and complete.

## The narrator line in context

"The screen cuts to black. One line of text holds: Ghost protocol, closed." works in all three settings:

- **Video calls** (`on_recovery_console`, `on_console_again`): "the screen" is the call picture. The line lands after Ghost's last spoken line ("This device reaches me if you change your mind.", "It can wait a few more minutes.") the way the round 1 wording did.
- **Terminal phone chat** (`mid_mission_contact` to `act3_accept` to `act3_deal_accepted`): "the screen" is the device's terminal. The line no longer claims a video window the player never saw.

It also matches the opening narration's vocabulary ("The terminal text goes dark. A video window opens in its place"), so the two bookend each other. Dropping "on the screen" from the second sentence avoids saying "screen" twice, and "holds" still reads clearly after "cuts to black". It is one shared clip for four endings, which keeps the cache small.

## Verdict

Ready to merge. Both round 1 findings are fixed. M1: the wording fits the terminal path, the ink and compiled JSON agree, the new clip and sidecar match, and the old pair is gone. m1 from round 1: `_dispatch` gates id and lockType, the reverted re-indent is clean, and the test separates old from new.

The full-scenario comparison shows no change between round 1 and this head, and only false errors removed compared with main. m1 here is latent, since no scenario hits it today, and is worth a two-line follow-up. n1 and n2 are wording and placement.
