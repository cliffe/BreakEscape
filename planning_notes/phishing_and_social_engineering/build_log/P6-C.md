# P6-C: board scope and plan modes

Done 2026-10-21. Not committed.

## What landed

`03` N4's remaining modes, in `public/break_escape/js/minigames/intel-board/`.

- `board-model.js`: `buildEngagementModel(social, globals, mode)`, `readEngagementState`, `ENGAGEMENT_MODES`. Pure. Items are `sort` cards (`inScope`), `question` cards (`options[]`), `pick` lists and `confirm` items. Plan picks come from `objectives[]` and `measures[]` (as in `10` section 5) or a generic `picks[{id, step, text, options}]`. Step binding and block completion follow `00` §11, the same rule as defender. `toSet` lists due globals, steps first.
- `intel-board-minigame.js`: `scope` and `plan` render a brief, `scopeNote`, a rules sheet (`engagement.roe`, scope only), the sort cards with In scope / Out of scope buttons and two piles, then question and pick cards. Methods `placeCard`, `choose`, `confirmItem`. A wrong pile sends the card back with its `why`; a wrong question or pick shows its `why` and can be changed; a right one locks. Globals go through `writeGlobal` on the flip, and are re-applied on open if the saved answers were complete but the global never landed. Close result carries `completed` from the model. `getTestState().board.engagement` exposes items, steps and `live`.
- `public/break_escape/css/intel-board-minigame.css`: appended block for the brief, rules sheet, piles.

State is `se_board_state.<mode>` = `{ sorted: {cardId: 'in'|'out'}, answers, picks, confirmed }`, ids only. Only right sorts are saved.

## Tests

`bundle exec node --test test/js/social-intel-board-engagement.test.mjs test/js/social-intel-board.test.mjs test/js/social-intel-board-defender.test.mjs`

33 pass, 0 fail (10 of them new). New files: `test/js/social-intel-board-engagement.test.mjs`, `test/js/fixtures/social/intel-board-engagement.json`.

## Not done

- `tools/playtest/se/bridge-6.jsonl` does not exist yet (P6-T0 writes it). The bridge gate was not run, and there was no browser run.
- No registration, starter, schema or interaction branch changes (P6-W). `scripts/minigame-data-schemas.json` may need `scope` and `plan` in the `mode` enum.
- No validator rules for `step` and `correct` counts (P6-G).

## Judgements and notes

- Wrong sorts are not persisted, so their feedback is lost on reload. Question and pick answers, wrong ones included, are persisted so the `why` shows again.
- The `plan` pick prompts come from optional `objectivesPrompt` and `measuresPrompt` (or a pick's `text`). `10` does not author these; P6-E should add them or the cards show no heading text.
- The scope sheet's heading text comes from `engagement.roe`; the "sheet's text shown first" in `10` stage 0 is `scope.intro` (or `brief`) plus that sheet. P6-E needs to author `scope.intro`.
- Writing board state adds a `recon.seenReady` key to `se_board_state` (existing `readBoardState` behaviour, also true of defender).
