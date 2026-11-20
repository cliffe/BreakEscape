# P3-W: wire inbox triage and the defender board

Done 2026-10-21. Not committed.

## Blocks

- `public/break_escape/js/minigames/index.js`: export, import and `registerScene('inbox-triage', InboxTriageMinigame)`, next to the OSINT browser lines.
- `public/break_escape/js/systems/minigame-starters.js`: `import { startInboxTriageMinigame } from './triage-starter.js'`, `export { startInboxTriageMinigame }`, and `window.startInboxTriageMinigame = startInboxTriageMinigame` after the OSINT starter.
- `public/break_escape/js/systems/interactions.js`: `triage-workstation` branch immediately after `osint-workstation`. It calls `window.startInboxTriageMinigame(sprite)`.
- `app/views/break_escape/games/show.html.erb`: stylesheet link for `/break_escape/css/inbox-triage-minigame.css` after the OSINT browser link.
- `public/break_escape/js/core/game.js` `preload()`: `this.load.image('triage-workstation', 'objects/triage-workstation.png')` after the OSINT workstation line.
- `public/break_escape/assets/objects/triage-workstation.png`: `cp -n` from `workstation.png` (the target did not exist). Same file size, 388 bytes. No new art.
- `scripts/minigame-data-schemas.json`: `triage-workstation` with optional `triageSetId`, `stage`, `conclusionTaskId`. The existing `case-file` `mode` entry is unchanged.
- `scripts/validate_scenario.rb`: `carry_over_json_writes` now calls `carry_over_record_triage_writes`, which records `<setGlobalPrefix>percent`, `reportRate`, `done` and `pass` as writes. A `{stage}` token is filled from the workstation's stage, else the set's stage, else `mission`. The same file's three walks that treat any `setGlobal*` string as a global name now skip `setGlobalPrefix`, so the prefix itself is not reported as a global.
- `scenarios/test_social_slice/scenario.json.erb`:
  - `social.triageSets` id `slice_inbox` (analyst, feedback at the end, header panel open, prefix `slice_triage_`, `passPercent` 0, no stage). Four messages: authored phish `pay_today`, `playerSent` `own_hampshire` (target `hampshire`, the second phish), real `parking`, real `laptop`. Auth rows for accounts `guest` and `freemail`. No `domainFrom`.
  - Object `slice_triage` (`triage-workstation`) at (6, 4), `minigameData` `{ triageSetId: slice_inbox, conclusionTaskId: triage_sorted }`.
  - Globals `slice_triage_percent`, `slice_triage_reportRate` (numbers), `slice_triage_done`, `slice_triage_pass` (booleans).
  - Aim `triage_round`, task `triage_sorted`. Host NPC `slice_host` completes it on `global_variable_changed:slice_triage_done`.
  - `social.engagement.defender`: facts `hampshire_careers` and `teague_role` (each gained a `reduceNote`), two options each, one `good`. `onCompleteGlobal` `defender_profile_done` (declared, no task). Object `slice_defender_board` (`case-file`, `mode: defender`) at (8, 4).

## Commands

- `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social --no-graph --skip-ink`: exit 0. No social lint errors. The `callId` warning on `quinn_desk`, the ink VAR warnings, and the pretext "set but unread" suggestions were already on the slice.
- `bundle exec node --test --test-concurrency=1 test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 527 pass, 0 fail, exit 0.

## Judgements

- The four messages are three authored plus the Hampshire `playerSent` row. That row is the second phish, so the set is two phish and two real.
- `passPercent` is 0 and the set has no stage, so the host mapping on the done global does not raise the non-zero-`passPercent` warning. The starter still treats a missing stage as `mission`, so the round can be run again.
- The authored phish is from `payroll@ledgerwell.example`. Its link text says `ledgerwell.example/payroll` and the destination is `https://pay-desk.example/login`. The account auth rows keep the slice's existing `workstation.example` and `freemail.example` domains.
- `playerSent` has no `domainFrom`. The slice has no landing-page menu.

## Left undone

- The overlay was not opened in a browser. The two commands above are what was run.
- The workstation sprite is the existing workstation image, copied.
