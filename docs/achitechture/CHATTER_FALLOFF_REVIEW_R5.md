# Chatter falloff (D34), implementation review round 5 (final)

Scope: the R4 fix commit e21d243ee (after 1687f66de) and the main merge bd9fb13e0 (main 9ab53f57b), read against the "R4 fixes" section of `CHATTER_FALLOFF.md` and `CHATTER_FALLOFF_REVIEW_R4.md`. Review only; no code was changed.

Line numbers are at bd9fb13e0. Paths under `public/break_escape/` unless stated.

**Counts: blocking 0, major 0, minor 3.**

## R4 findings: status

| R4 | Status | Notes |
|---|---|---|
| m1 `call` clause in `_speak` | Fixed | `js/systems/npc-needs.js:2945` is now `!info?.overheard && !info?.faint`. The only caller that passes `call` is the desk call at `:4773`, with `overheard: true`, so no live path changed. The new case at `test/js/npc-chatter-faint.test.mjs:617-619` (`{ call: true, overheard: false }` expects `unheard`) fails if the clause comes back, since the old expression would give false. `npc-needs.js:5512` (the bubble layer) still reads `info.call`, which is a separate use (an exchange or call line is toasted, not deferred) and is untouched. |
| m2 credential rule | Fixed | Rule in `docs/achitechture/NPC_NEEDS_SYSTEM.md:665` and `README_scenario_design.md:49`; V11 in `scripts/validate_office_life.rb:743-758`, wired at `:100`, with a test at `test/js/validator-office-life.test.mjs:455-465`. See m1 below for its reach. |
| m3 "password" wording | Fixed | `js/systems/npc-needs-chatter.js:349-351` and `npc-needs.js:2941-2943` now say cue, not password. The walk-in case is written at `NPC_NEEDS_SYSTEM.md:665`. The test string is now "Heard cue." (`test/js/npc-chatter-faint.test.mjs:662`). |
| m4 plain-skin on state | Fixed | `css/music-widget.css:197-199` keeps accent text only. See "The switch" and m2. |

## `_speak` without `!info?.call`

Four callers of `_speak` at the tip: `:2267` (mutters and grumbles), `:4413` (exchange lines), `:4467` (chat turns) and `:4773` (desk calls). Only the last sets `call`, and it sets `overheard: true` in the same object, after the `voiced` gate (`:4766`). With the clause removed, a call line is not `unheard` because `overheard` is true, exactly as before. Nothing else in `public/` reads `info.unheard` except the voice (`js/systems/npc-needs-chatter.js:356`, `background = faint || !!info.unheard`). Node run: `npc-chatter-faint` 44/44, `validator-office-life` 33/33.

## V11: corpus run

`ruby scripts/validate_scenario.rb` over all 184 `scenarios/*/scenario.json*` files at the tip, each to its own log.

- **V11 warnings: 0.** No scenario fires it, so there is no false positive and no real authoring problem to list.
- The reach is small: chatter pools exist in 6 scenarios (`m02_ransomed_trust`, `lab_physical_pentest`, `test_access_social`, `test_access_work`, `test_needs_attack`, `test_needs_sims`), 135 pool lines in total. A separate scan of all 135 lines (scenario-level and per NPC) with a much looser pattern (password, passcode, PIN, login, log in, credential, username, code, sign in) found none either, so the check does not miss anything today either.
- The run rewrote `dungeon_graph` files as expected. Tracked ones were restored with `git checkout -- <path>`; the untracked ones were moved to `tmp/delete/r5_dungeon_graphs/` (gitignored). `git status` was clean before the review file was added.

## The switch

`chatter-switch-plain-on.png` (read at the scratchpad path): the Background voices button has a grey 2px border, a filled accent square and accent text. The panel frame is the accent border, and the SKIP, PAUSE and VISUALISER buttons beside it have grey borders. By the CSS, a hovered SKIP gets an accent border and accent text (`music-widget.css:169-172`). So on is now distinct from hover: hover changes the border, on does not, and on has the filled marker. Themed skin is unchanged (`css/ui-themes.css:1007-1013`, text colour only). One residue is m2.

## The main merge bd9fb13e0

Main brings K3c, E0 and the folder fixes (keyring, pc-sessions, container minigame, unlock-system, `validate_capture_log.rb`, `validate_network.rb`). Between e21d243ee and the merge there is no change to `npc-needs.js`, `npc-needs-chatter.js`, `tts-manager.js`, `music-widget.js`, `music-widget.css`, `ui-themes.css` or `validate_office_life.rb`. The `scripts/validate_scenario.rb` change (`check_item_type` gets an `in_contents` flag so a nested `folder` needs no sprite) does not touch the `ValidateOfficeLife` call at `:8671-8672`. The needs validator (`validate_npc_needs.rb`) is unchanged by the merge. No conflict with the voice, needs or office-life validator code; the corpus run above completed on the merged tree without a check failing to run.

## Doc and comment changes

The comments at `npc-needs-chatter.js:349-351` and `npc-needs.js:2941-2943` are accurate. The `NPC_NEEDS_SYSTEM.md:665` sentence matches the code (credential arrives on a heard listening tick, `js/systems/npc-workarounds.js:45-58`). `README_scenario_design.md:49` places V11 between V7 and V8, and the script header lists it before V10 (`scripts/validate_office_life.rb:13-14`); the number is not used by another office-life rule. Two rows of the R3 table are now stale (m3 below).

## Minor

### m1. V11 matches on bare "password" but not on other credential phrasings

`scripts/validate_office_life.rb:747`: `password`, `passcode` and `passphrase` match anywhere, while `PIN`, `login` and `username` match only in the forms "pin is", "login is/details" and "username is". So "Ugh, another password reset" (harmless) would warn, and "The pin's 4411" or "It's under the keyboard" would not. The README line (`README_scenario_design.md:49`) says "PIN or login details" without the "is" restriction. Today the corpus has 0 hits either way, so nothing is wrong; but the first awareness-style pool line that says "password" will draw a warning that needs a human to clear. Either say in the README that V11 is a keyword hint, not a proof, or match a credential-looking value as well (digits or a quoted word after the keyword). Not worth blocking the branch.

### m2. On the plain skin, hover on the off switch still shows accent border over grey text

`css/music-widget.css:169-172` (`.mw-btn:hover`, specificity 0,2,0) and `:202-204` (`.mw-toggle-btn[aria-pressed="false"] { color: #ccc }`, also 0,2,0, later in the file) mean the switch's off text never takes the hover colour, while its border does. A hovered SKIP goes accent on both; a hovered off switch goes accent on the border only, with a hollow marker. It reads as hover, not as on, so R4 m4 is met. It is a small inconsistency between the switch and its neighbours,. If wanted, scope the grey rule to `:not(:hover)`.

### m3. Two R3 rows in `CHATTER_FALLOFF.md` describe the pre-R4 code

`docs/achitechture/CHATTER_FALLOFF.md:162` says `_speak` sets `unheard` "from `!overheard && !faint && !call`"; `:163` says the switch's on state is "accent text and border". Both were changed by R4 (m1, m4). The R4 section at `:188-194` records the changes, so nothing is lost, but a reader of the R3 table gets the old behaviour. Add "(R4: no `call` clause)" and "(R4: text only on the plain skin)" to the two rows, or leave a pointer. `:138` (the R1 row) is older still and already superseded by R3 M2.

## Design judgement

Nothing further. The derivation is one expression with one reader; the secret guard is narrow and documented; the authoring rule is written where authors look and has a validator that stays silent on the real corpus. The branch is ready to merge on this review: no blocking or major findings remain, and the three minors can be taken or left.
