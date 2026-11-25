# CA engine review: schema and validator, round 1 (commits 1afed46d0, 232628857)

Result: 0 Blocker, 0 Major, 4 minor.

## Runs

- `node --test test/js/validator-social-holds-beats.test.mjs`: 14 pass, 0 fail.
- `ruby scripts/validate_scenario.rb scenarios/ca12_visitor_tailgater/scenario.json.erb`: `Result: 0 errors (0 known), 6 warnings`.
- `ruby scripts/validate_scenario.rb scenarios/ca15_shadow_it/scenario.json.erb`: `Result: 0 errors (0 known), 26 warnings`. None of the warnings is about give_item or the stick tag.

## 232628857 (ca15 give_item tag): correct

- `chat-helpers.js:126-135` splits the tag param on `[|:]`, so `usb_storage_swivel:ca15_red_stick` gives itemType `usb_storage_swivel` and itemSelector `ca15_red_stick`.
- `npc-game-bridge.js:236-251` matches `item.type === itemType`, then the selector against `id`, `opens_lock`, `key_id` or `name`, lowercased.
- Nilesh's `itemsHeld` (`scenarios/ca15_shadow_it/scenario.json.erb:845-851`) has `type: usb_storage_swivel` and `id: ca15_red_stick`, so it matches. The old tag `ca15_red_stick` alone would have failed, because `item.type !== itemType`.
- The compiled `nilesh_solanki.json` carries the same tag string.
- `validate_scenario.rb` gave no give_item error or placement warning (the tag sits above a text line).

## Findings

### minor 1: `strings.stepAwayReadyWait` is allowed by the schema and never read for the post-defend beat

- Schema: `scripts/scenario-schema.json` (the `stepAwayReadyWait` entry, described as "the post-defend beat's line while Look up is not ready yet").
- Engine: `episode-runner-minigame.js:653-655` uses `STEP_AWAY_COPY.wait` whenever `!beat || beat.after === 'defend'`. It reads `${beat.strings}ReadyWait` only for a beat that is not after defend.
- Failing case: an author sets `strings.stepAwayReadyWait: "Wait for the result."` on a post-defend beat. Schema and validator accept it, and the kiosk still shows "Look up is ready once your result has saved."
- The engine also reads `stepAwayReadyWait` for a non-defend beat whose `strings` is `"stepAway"`, so the key is not dead.
- Fix: either read it for the post-defend beat (`isStr(strings.stepAwayReadyWait) ? ... : STEP_AWAY_COPY.wait`), or reword the schema description to say it applies only to a non-defend beat that borrows the `stepAway` prefix. The plan (CA_PILOT_MECHANICS_PLAN.md line 353) only describes ReadyWait for a mid beat, so the schema text goes beyond the plan.

### minor 2: schema `holdMaxMs` has `exclusiveMinimum: 0`, but the json-schema gem in use does not enforce it

- Schema: `scripts/scenario-schema.json` (`holdMaxMs`).
- Probe on a scratch copy of clean_full: `holdMaxMs: -5` and `holdMaxMs: 0` both give no schema error. A string and a non-string `holdUntil` are rejected.
- The awareness validator does catch both (`world_hold_checks`, "holdUntil needs a positive world.holdMaxMs", and the test covers it). So `holdMaxMs: 0` with no `holdUntil` raises no error and, since the warning only fires for a positive cap, `holdMaxMs: -5` alone is silent. This is harmless, as the engine ignores a cap with no hold.
- Fix: use `"minimum": 0` plus the validator's strict check, or accept that the validator owns this rule and drop the claim of a schema check. The other 9 `exclusiveMinimum` uses in the schema may have the same gap.

### minor 3: a custom `strings` prefix on a beat cannot be authored

- Schema: the beat's `strings` property accepts any string, but the `strings` block has `additionalProperties: false` and lists only `stepAway*` and `worldBeat*` keys. The `worldBeat` description admits this ("Custom prefixes are not in this schema").
- Failing case: two non-defend beats, `after: 'flip'` and `after: 'write'`, each wanting its own copy. A prefix such as `lobbyBeat` makes the schema reject `strings.lobbyBeat`. Both beats can only share `worldBeat*` or use `stepAway*`. The validator also warns that `strings.lobbyBeat` has no text, so the per-beat `strings` field has no usable value beyond the two defaults.
- Fix: add a `patternProperties` entry for `^[A-Za-z][A-Za-z0-9]*(Heading|Waiting|ReadyWait)?$` with string values, or document that only two prefixes work. Fine to defer if the pilot uses one world beat.

### minor 4: validator warns "no text" for the post-defend beat when the engine has default copy, and does not check `doneGlobal` against server-owned globals

- `awareness.rb`, `step_aways_checks` last `issues <<` in the loop: for `after: 'defend'` with no `strings.stepAway`, the warning says "falls back to its generic step-away copy". The engine has a purpose-written default there (`STEP_AWAY_COPY.text`, the schema documents it). So it warns on a valid legacy-equivalent beat, and the legacy `stepAway: true` path never warns. Skip the warning when `pre == 'stepAway'`.
- The engine writes `doneGlobal` from the client (`_carryOn`, `deps.write`). The E2 check uses `server_owned_globals` for `holdUntil`, but `step_aways_global_checks` does not for `doneGlobal`. Failing case: `doneGlobal: "worn_hivis"` (a worn-costume global) passes the validator, then the sync refuses the write. Low risk, since a beat's done global is normally an author flag.

## Checked and correct

- E2: `worldFor` reads `holdUntil` as a string and `holdMaxMs` as a finite number above 0, and drops the hold otherwise. The validator errors in the same cases. Without `holdUntil`, `holdMaxMs` warns. The 90 s warning, the server-owned check and the costume plus wearable warning behave as intended. The hold checks run from the world block, after the call-attack and room checks.
- E3: `stepAwayBeats` drops a beat for the same reasons the validator reports (`after` not a stage or the last stage, a defend beat without a later debrief, duplicate id, `after` or pickedKey, reserved or `Via` pickedKey, `episode_step_away` off defend, `resumeOnDone` without `doneGlobal`). `RESERVED_STATE_KEYS` equals `PICKED_KEYS_RESERVED`. Defaults for `pickedKey`, `strings`, `event` and `facilitated` match the schema text. The validator also requires `variant`, as the schema already does, so the engine's looser `variantOf` default does not matter.
- E5: `globalEntry` (flip-view.js:104-111) needs `global` and `line` as strings and a truthy value, with the heading used on the missed path only. The schema matches (`global` and `line` required, `heading` optional), and the line is not placeholder-filled, so the `{var}` error is right. Precedence in the schema text matches `defenderLine`.
- Test coverage: each new check has a valid case and a broken case. Gaps, all small: the validator's "more than 6 beats" message (the schema check is tested), a null `readyGlobal` as a valid beat, a schema rejection of a non-string `holdUntil`, and a direct case for `doneGlobal` in the post-defend path.
