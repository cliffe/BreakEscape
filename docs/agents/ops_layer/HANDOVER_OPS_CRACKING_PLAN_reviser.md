# Handover: OPS_CRACKING_PLAN reviser (stopped at the 150k context limit)

**Status 2026-11-19: finished by a second reviser.** Sections 6 to 15 are rewritten to match 1 to 5;
`reviews/OPS_CRACKING_DECISIONS.md` exists. Changes beyond the notes below: a `grant_fact` flag
reward is a third fact source (sections 2, 4, 5, 9, 11, 12); the salt model is section 15 question
1; section 14 asks the privilege plan to fix its `account` object and add `crack.facts`. Nothing is
open. The notes below are kept as the record of the first pass.

Brief: `docs/agents/ops_layer/BRIEF_cracking_reviser.md`, plus two orchestrator updates:
R2-2 keeps both server checks (server-granted facts, proof the hash was collected); R2-3 the
realism look now shows simulated scanner-style and exploit-framework-style output generated from
host data by separate modules. The crack scene sits outside the network view and has one look, so
section 14 asks the skin plan (SKIN) what output a crack would want if it ever shows one there
(per run: record label and token, the fact labels picked, a progress line while running, the
status; built from the `POST /crack` answer only). Do not design the generator.

Edit only `docs/achitechture/OPS_CRACKING_PLAN.md` and create
`docs/agents/ops_layer/reviews/OPS_CRACKING_DECISIONS.md`. Do not commit. Edit tool only.

## Done (rewritten, standalone, no review references)

- Header, section 1 (play), section 2 (code today, re-verified pointers), section 3 (stages C1/C2
  table), section 4 (fields: `account` string, string proofs, `salted`, `crackSeconds` 10-600
  default 60, recipe `crack: { password, facts, passwordPattern }`, class `common` recipe-only,
  `revealsFacts` on items, share file as plain `text_file` with `credential`), section 5 (server:
  token HMAC, earned facts union + per-source author table, class resolution fail-closed
  `no_recipe`, one-run rules per class, salt = server-timed wait + unsalted batch by equal token,
  grant `crackedAccounts` + builder `cracked_keyring_entries` id `<npcId>.cracked`, hash row shape
  with `status` and `crackFacts`; client: scene, launch points, keyring.js / signin-rows.js
  changes, client `grantFact` on `revealsFacts` items).

## Open: sections 6 to 15 still hold the first draft and must be rewritten to match section 5

- **6 Route** `POST /games/:id/crack`, `games#crack`, policy `crack?` (mirrors `sync_state?`).
  Params snake_case: `hash_id`, `facts` (array, 0-4 strings matching the registry id pattern; body
  cap). No `reuse_from` (reused ignores the pick). Checks in order: policy/game (403/404 as today);
  `bad_request` 400 (shape); `no_hash` 404 (unknown id, non-hash, or proof not holding, same body);
  `no_recipe` 422; `fact_not_held` 422 (any picked id not in the earned set; unknown ids answer the
  same); then the run (section 5) under `with_lock`. Success `200 { success: true, status, runs?,
  missingCount?, readyInSeconds?, credentialIds? }`; `cracked` carries account id and new keyring
  ids, never the password (it comes via `GET /keyring`). `Cache-Control: no-store`. Refusal codes
  closed list: `bad_request no_hash no_recipe fact_not_held`; add to SKIN's `ops_refusal_codes.json`
  if SKIN lists them.
- **7 Browser**: reaches: token, salted, status, missingCount (count of unearned recipe facts),
  readyInSeconds, `crackFacts` (earned ids), username on hash row, password only after grant via
  keyring. Never: recipe facts, `passwordPattern`, the class before runs, creds.password before
  grant, the HMAC key. Say honestly: `infeasible` and `needMoreFacts` reveal the class after runs;
  the class is not a secret (CRACK-4 a).
- **8 State** (all server-written in `ACCESS_STATE_DEFAULTS`, never a sync section, never sent):
  `earnedFacts` (array, grow-only, ids from authored `revealsFacts`, cap 64), `crackRuns`
  ({hashId=>int} capped at 2, strong only, keys only registry hash ids), `crackStarted`
  ({hashId=>server ms}, at most 64), `crackedAccounts` (array of npc ids, grow-only, at most 64).
  Token not stored. Reload: status comes back on the hash row. Add to SYNC_DELTAS_PLAN growth
  table when built. Strip new empty keys in `bin/ops-golden-compare` (L1a's job).
- **9 Validator** own file `scripts/validate_cracking.rb`, one hook line in `validate_scenario.rb`
  (beside `require_relative 'validate_network'`, `VS:24-28`). Rules: hash `account` is an account
  holder; class resolvable (habit or `crack.password`; habit-needed rule only when no
  `crack.password`); guessable needs 1-4 `facts`, each a `social.intelFacts` id with a
  server-visible source (an item with `revealsFacts` naming it, or a feed post `fact`) else error;
  `facts` on non-guessable refused; warn when record class differs from habit; `crackSeconds` only
  with `salted`; `connectsTo` on hash refused; `accepts: ["hash"]` on a policy refused;
  `revealsFacts` ids exist. In `check_credentials` only: flip message `VS:7469`, `CM:26` to
  `built: true, connects: false`, update comments. Widen CORE's `grants.credential` rule to
  `saved_connection` or `hash` with a test (CORE:1280, :1868-1870). Schema: hash fields in the
  closed entry (`SCH:281-310`), `crack` object, `revealsFacts` in `definitions.item`, habit
  description at `SCH:4420`. Graph: built hash already draws a key node
  (`generate_dungeon_graph.rb:1626-1634`); add edges source item -> hash node, hash + fact-source
  item/post nodes -> `<npcId> password` labelled "crack" (PRIV asks for this so its
  `admin@<pcId>` -> hash edge continues). No password text in labels.
- **10 Unchanged**: fixtures `test/fixtures/files/ops_unchanged/cracking_<scenario>.json` via
  `bin/ops-golden-compare` (L1a): `GET /keyring` for `test_access_networks`, bootstrap for
  `test_simple_success`, full validator output for every scenario before/after. Tests
  `test/unit/credential_model_test.rb`, `test/models/break_escape/credential_keyring_test.rb` may
  assert hash unbuilt: list as tests to change.
- **11 Tests**: add forged `se_intel_*` ignored, forged `crackRuns`/`earnedFacts` in sync ignored,
  parallel posts (one grant), lost habit -> `no_recipe`, captured+cracked one row, token stable and
  uninformative and equal for equal unsalted passwords, unsalted batch, salted wait with frozen
  clock, `revealsFacts` stamped on take/give/flag reward, scanner rule for `cracked` entries.
  Feature scenario `test_ops_crack`: strong, guessable (one item fact, one feed fact), reused,
  common recipe, salted + two unsalted equal. Scripted playtest + live proof (crack then sign in).
  JS test `test/js/ops-cracker.test.mjs`; harness copy lists (`test/js/exercise-station.test.mjs:31`
  and any harness copying `minigames/index.js`).
- **12 Shared files**: add keyring.js, signin-rows.js, remote-host-text.js, access_leak_scanner.rb,
  game.rb (`add_inventory_item!`, ACCESS_STATE_DEFAULTS), social-intel callers, minigames/index.js,
  README_scenario_design.md feature index, docs/ACCESS_AND_NETWORKS.md, validate_cracking.rb.
  Drop the S5a admin-dump and share `hash_file` items.
- **13 Log rows**: replace table with one paragraph: cracking writes no rows (offline, nothing on
  the target); obtaining a hash is logged where it happens (`credentials_harvested`,
  `share_folder_opened`, LOG:1158-1160). S7 stores no secret value outside the keyring (the
  cracked password is read from `creds.password`, which L1a registers; the token is not a secret
  and is never stored), so it registers no `OpsLog.register_secret_source`; a later change that
  stores one registers it.
- **14 Requests**: PRIV: answer each of its S7 requests (PRIV:1292-1329): `harvested` proof keyed
  by PC id agreed; `crack` read when present, habit otherwise (done); username on hash row (done);
  second record of a held account shows `cracked` with no Crack button (done); S5b after S7
  (agreed); scene opens for any hashId (yes); graph edge (yes); reset -> scenario's password
  (confirmed). Ask PRIV to change its examples to `"account": "<npcId>"` (string; its lines 246-249,
  288 use `{ "npc": ... }`, which fails `SCH:290` and `CM` account_npc) and `crack.facts` (its
  `passwordPattern`-only guessable recipe at :289 needs `facts`). CORE: widen rule (S7 does it).
  MFA/LOCK: a cracked password is a first factor and meets the step; joins MFA's "keep authored
  value" list (X16). LOG: no rows, no secret source. SKIN: the R2-3 output request above. Intel
  owner / scenario authors: dialogue-only facts need an item or post (section 5 table).
- **15 Questions**: remove answered (CRACK-1 a, CRACK-3 a, CRACK-4 a, BLOCK-2 both checks, game
  minutes). Keep open with recommendation: salt model (a) server-timed wait + batch [recommended,
  as written], (b) run count, (c) batch only. Possibly: add `common` to the habit enum too
  (recommend no).

## DECISIONS file (not yet created): one line per R1 finding

B1 accepted (`crack.facts`); B2 accepted (server-granted facts, ruling); B3 accepted
(`crackedAccounts`, own builder, `<npcId>.cracked`); B4 accepted (string account/proof); M1
accepted (no runtime clues.rb, fail closed `no_recipe`); M2 accepted (plain text_file); M3
accepted (own row branch, client files, validator rules); M4 accepted (cracked tag, scanner); M5
accepted (missingCount from earned set, exact-set pick, class not secret); M6 accepted (no
reuse_from); M7 accepted (HMAC token, not stored, equal for equal unsalted); M8 accepted
(server-only state); M9 partly (server-timed wait + batch, no game minutes per BLOCK-3; run count
kept only for strong's infeasible); m1 accepted (lock, caps, idempotent, no-store, codes); m2
accepted (repeats change nothing); m3 accepted (no slotGuess); m4 accepted (row + collect panel, no
tool item); m5 accepted (copy lists named, no import from guesser); m6 accepted (fixtures); m7
accepted (C1/C2 with named tests); m8 superseded (no rows); n1 fixed; n2 fixed (section 9 wording
still to write); n3 fixed in rewritten sections.

## Files touched

- `docs/achitechture/OPS_CRACKING_PLAN.md` (sections 1-5 rewritten; 6-15 still first draft)
- this note
