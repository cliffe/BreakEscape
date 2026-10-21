# P4-C: pretext-prep

Done 2026-10-21. Not committed.

## What landed

Beats 1 and 2 (`06` N5, N6). The overlay is `PretextPrepMinigame` in `public/break_escape/js/minigames/pretext-prep/`.

- Brief: authored `brief.scope` (else `scope`, else `engagement.scopeNote`), authored `brief.objectives`, an ethics line (`brief.ethics` or `ethics`, else "Use only details you have found. Do not invent one."), and the board `text` of each held `se_intel_*` fact. Unheld facts are not listed.
- Pretext card: one control per fact any line's `blanks` map feeds. The picker lists held `provides` only, including a `stale` value, and uses the mail composer's `optionsForSlot` (`01` N10). A blank with nothing held is disabled and reads "nothing held yet". A line with optional `text` shows `{factId}` as the chosen label or `____`. The slice's lines have no `text`; the spoken wording stays in the ink.
- Begin replaces this overlay with `phone-chat` (npcType `phone`) or `person-chat` (anything else). Params are `{ npcId, startKnot, pretextCallId, blanks, requiresKeyboardInput: true, title }`. `blanks` is `{ factId: { value, label } }`. `startKnot` is the call's `startKnot`, else the record's `currentKnot`, else `start`. No `channel` field.
- Close and Esc abort with `{ aborted: true }`. Esc closes an open picker first (`pushLayer` name `blank-picker`). `start()` calls `pauseKeyboardInput`, because `startPretextCall` in `interactions.js` does not pass `requiresKeyboardInput` before the manager reads params. The stylesheet is loaded from `pretext-prep.css` beside the module.

## Tests

`bundle exec node --test test/js/social-pretext-prep.test.mjs`

12 pass, 0 fail, exit 0.

Covered: untagged `finance` / `payroll` dropped from a team blank while intern-tagged `accounts` (stale) is offered; a manager blank prefers `about: "manager"` over a recipient form of the same value; contact offers `shah_full` and not a recipient name; an empty gap still allows Begin; Esc closes the picker only; Close aborts; Space and `E` do not start or close; phone opens `phone-chat` and a person record opens `person-chat` at the authored knot; a blank named `name` that feeds fact `manager` is stored under `manager`, and `fillPretextVars` sets `pretext_manager_name` / `_value`.

`tools/playtest/se/bridge-4.jsonl` is not in the tree. The plan gates that script on P4-T0, after this packet. Not run.

## Judgements

- The JSON stores blank name → fact id and does not store type or about (`scripts/validate_social/pretext.rb` treats the value as a fact id). The slot is taken from `provides` entries whose `value` is `knows[fact].value`. Tagged entries win over untagged ones, and if several abouts remain the one equal to the fact id wins. That is the Dev rule in `06` §5 (team stays on `about: "intern"`).
- A blank with no held option does not block Begin. The call still has lines with no blanks. A blank that has options and is unfilled does block, with "Choose an option for the Contact blank", which names the blank and not a value.
- Close is an abort, same shape as a mail client closed with nothing sent. Handing over calls `startMinigame`, which ends this overlay with success false and result null and does not emit `minigame_completed`. The call result stays on `pretext_<callId>_outcome`.
- No company name is invented when the call authors no scope line. The slice's Brandt and Quinn entries have no `brief`, so they get the ethics fallback and the board list only.

## Left undone

- Not registered. `minigames/index.js`, the starter and `show.html.erb` are P4-T0. Until that packet adds `registerScene('pretext-prep', PretextPrepMinigame)`, `startPretextCall` logs that the scene is not registered and the desk phone does nothing. Do not add a second `callId` branch; P4-D already has it (`interactions.js` `startPretextCall`).
- No browser run. The bridge rows were not run.
- The hint ladder (`06` §4.5) is not on the card. There is no persisted attempt count to advance it.
- When a blank's name is not the fact id, the judge still looks the value up by blank name (`pretext-judge.js` `claimValue`, `from: "blank:<name>"`), while this card and `fillPretextVars` key by fact id. The slice and the Dev example use the same string for both (`contact`, `intern`, `team`), so those calls score. Priya's `{ name: "manager" }` would fill `pretext_manager_name` and the judge would not see the value. Not changed here; the judge is P4-A / P4-B.
