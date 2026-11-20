# P-H1 handover (ca02, ca03, ca04, ca05) — COMPLETE (2026-11-20 Sonnet pass)

All P-H1 content is written (`W2_LINES_H1.md`) and now fully applied. All checks run, 0 errors.

## Applied
- conceptPanel layers 0/1 in all four full-shell erbs:
  - ca02 `scenarios/ca02_cv_lures/scenario.json.erb` (prior commit).
  - ca03 `scenarios/ca03_helpdesk_reset/scenario.json.erb` (prior commit).
  - ca04 `scenarios/ca04_exec_whaling/scenario.json.erb` (prior commit, new panel after voicePanel).
  - ca05 `scenarios/ca05_signin_pages/scenario.json.erb` (THIS pass — new panel after `defendIntro`,
    heading "What the address bar settles", layer 0 + layer 1).
- Host blocks spliced into all four host inks (`.ink` + recompiled `.json`): `fatima_begum`,
  `darren_price`, `thandiwe_moyo`, `niamh_doherty`. Kit VARs added (`kit_defend_done`, `kit_caught`,
  `kit_key_caught`, `kit_ca0<n>_host_said`); three-way CATCH/PARTIAL/MISS on `kit_key_caught`/`kit_caught`
  above the existing defend-complete branch, gated `kit_defend_done && not kit_ca0<n>_host_said`,
  `~ kit_ca0<n>_host_said = true`. ca01 pattern.
- Twin fragment layer-1 `conceptPanel` in `e2`–`e5/defend.json` (awareness folder): e2/e4/e5 added to
  `awarenessEpisode.strings`, e3 replaced its old teaching panel. Cost-framed headings in the e1 model's
  style. e4 keeps its separate `_voicePanel`.
- `W2_LINES_H1.md`: `(VOICE_CAST)` resolved — Fatima=Vindemiatrix, Darren=Orus, Thandiwe=Pulcherrima,
  Niamh=Leda (from VOICE_CAST.md). keyMessage ids confirmed. `// D225 pending` kept in the lines file only
  (ca02/ca03/ca05). ca04/ca05 D9-moot note added. New "H1 Sonnet-pass applied state" section with the full
  check results and the e2 generator flag.

## keyMessage ids (confirmed; I writes to episodes.json, D13)
- ca02 `e2_enable_content` (set `e2_recruitment_inbox`)
- ca03 `e3_push_early` (set `e3_service_desk_queue`; `e3_helpdesk_reset` is the episode id, not the set)
- ca04 `e4_boarding_payment` (set `e4_pa_inbox`)
- ca05 `e5_sso_lookalike` (set `e5_links_inbox`)
Each sits in the scored defend set carrying `outcome.setGlobalPrefix = episode_<id>_defend_`, the set
`office_kit.message_globals` writes `kit_key_caught` onto; all `isPhish: true`.

## Checks (all 0 errors)
- `bin/inklecate` on the four host inks: clean.
- `validate_scenario.rb --strict-social --no-graph` on ca02–ca05: 0 errors. Only warnings are the expected
  `kit_*` "read but never set" (I's splice/office_kit sets these at runtime).
- `dialoguelint.mjs --json` on ca02–ca05: clean.
- `node --test` social-*/validator-social-*/office-kit-quiet-and-stub: pass in isolation (2 fails only in the
  big combined run, the "deserialize cloned data" worker flake; social-mail-ink-runner passes alone 23/23).
- `test_office_kit`: 74 OK. `proof5.py`: 17 diffs, all pre-existing stale twin outputs in HEAD awaiting I's
  regen (proof5 reads `git archive HEAD`, not the working tree); ca00 expected; none a regression.

## Open flag for P-GEN / I
- **e2 twin conceptPanel:** `gen_e2_e4_shells.py panels()` sources e2's conceptPanel from the top-level
  `_conceptPanel` (hardcoded lead `"Why 'enable content' matters. "`), overriding `strings.conceptPanel`.
  The e2 twin (ca02_cv_lures_defend) will therefore carry the OLD macro panel, not the living-office
  layer-1, and parity would fail once regenerated. Fix is P-GEN's (read `strings.conceptPanel` like e3/e5)
  or an e2 `_conceptPanel` contract change — outside P-H1. e3/e4/e5 twins are correct.

## D225
ca02, ca03, ca05 layer 1 carry option-A UK GDPR duty wording (placeholder, `// D225 pending` in the lines
file only). ca04 is a payment shell, no duty claim. Revisit when O1 is answered.
