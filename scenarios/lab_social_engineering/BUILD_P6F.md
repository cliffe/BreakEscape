# P6-F — Lab ink (build results)

Packet P6-F, written 2026-10-21. Owner: Opus. Runs beside P6-E (scenario data), which owns
`scenario.json.erb`, `mission.json` and all the data this ink reads and writes. The PLAN
(`scenarios/lab_social_engineering/PLAN.md`), the contract (`designs/00_data_contract.md`) and
design `10`/`06` are the shared source; where the PLAN left an id open, this file records the choice
so P6-E can match it.

## Files written

Seven ink stories and their compiled JSON under `scenarios/lab_social_engineering/ink/`:

| File | Record id (P6-E) | Channel | What it carries |
|------|------------------|---------|-----------------|
| `ruth.ink` | `ruth` | person | Opening briefing (on load); per-stage check-in hub; the three door-key hand-overs; backup `#complete_task` for every completing global already true |
| `ruth_phone.ink` | `ruth_phone` | phone | Progress-gated hint hub, three sticky rungs per stage, under ten choices |
| `fairbairn.ink` | `fairbairn` | person | Authorisation scene (his "no names" condition) on `roe_signed`; pay-off line on `report_filed` |
| `tomasz.ink` | `tomasz` | person | Triage briefing; closing debrief gated on `triage_pass` and `profile_done`, ends the mission-conclusion aim |
| `dev_service_desk.ink` | `dev_service_desk` (character `dev`) | phone | The pretext call: opening line, four say lines, two asks |
| `pierce_mail.ink` | emailRecord for character `pierce` | email (headless) | `on_email` reply; sets `phish_pierce_landed` |
| `lord_mail.ink` | emailRecord for character `lord` | email (headless) | `on_email` reply; sets `phish_lord_landed` |

Nothing outside `scenarios/lab_social_engineering/ink/` was touched (`git status --porcelain` limited to
that dir shows only the new files).

## Contract P6-E must match

These are the ids this ink depends on. All come from the PLAN §4/§6, `10` §4 "Global variables",
`00` §8/§10 and `06` §4.8, except the three key item ids, which the PLAN left open and this packet
chose.

**Key items Ruth hands over** (P6-E: give Ruth these in `itemsHeld`, `type: "key"`, each with the
matching `opens_lock`/`keyPins` for its door; the Tesseract pattern):

- `recon_key` — handed on `plan_done`
- `operations_key` — handed on `osint_done` AND `se_intel_username_convention`
- `blue_team_key` — handed on `report_filed`

The ink gives each with `#give_item:key:<id>` and guards re-giving with a local VAR, so the key is
handed once.

**Display names** (must match the character registry exactly; inline `Name:` prefixes resolve against
`id`/`displayName`): "Ruth Adeyemi", "Gareth Fairbairn", "Tomasz", "Dev", "Melanie Pierce",
"Sofia Lord".

**Ruth's record needs** a `timedConversation` with `targetKnot: "start"`,
`waitForEvent: "game_loaded"`, `skipIfGlobal: "briefing_heard"`, `setGlobalOnStart: "briefing_heard"`,
`currentKnot: "start"` (PLAN §5 "Opening", Q3). The ink's `start` guards the briefing with a local
`greeted` VAR, so a manual re-open after the auto-play goes straight to the hub.

**Task completion.** P6-E's `eventMappings` on Ruth's record do the live completion
(`global_variable_changed:<name>`, `condition: "value === true"`, `onceOnly: true`). Ruth's ink
re-issues `#complete_task:<taskId>` for every completing global already true as the out-of-order
backup (PLAN §4). The 19 backup tags and their globals:

`roe_scope_done`→scope_cards, `roe_stoprule_done`→stop_rule, `plan_objective_done`→pick_objectives,
`plan_measures_done`→pick_measures, `se_intel_email_pattern`→email_pattern_found,
`se_intel_username_convention`→metadata_read, `target_ready_hampshire`→ready_hampshire,
`target_ready_pierce`→ready_pierce, `target_ready_lord`→ready_lord, `acct_freemail`→test_account,
`phish_hampshire_landed`→hampshire_landed, `phish_pierce_landed`→pierce_landed,
`landing_payroll_login_built`→payroll_page_attached, `pretext_call_done`→call_dev,
`phish_lord_landed`→lord_landed, `report_results_done`→results_reviewed,
`report_findings_done`→findings_paired, `triage_pass`→triage_passed, `profile_done`→profile_done.

`closing_debrief` is completed by Tomasz's `#complete_task:closing_debrief` (not by Ruth).

**Mail stories** set the landing global on the landed branch: `pierce_mail` →
`#set_global:phish_pierce_landed:true`, `lord_mail` → `#set_global:phish_lord_landed:true`. Each
declares `VAR <character>_influence` and the run-scoped `email_*` VARs it reads, and calls
`se_influence` with an ink fallback on both the landing (+10) and the failing (-10) branch (00 §8,
§10; P1-M lints). Hampshire has no ink (data-only target, P6-E).

- `pierce_mail` reads: `email_landed`, `email_opened`, `email_first_fail`, `email_attachment`.
- `lord_mail` reads: `email_landed`, `email_opened`, `email_first_fail`, `email_link`.

Their `storyPath`s (00 §8) are `scenarios/lab_social_engineering/ink/pierce_mail.json` and
`.../lord_mail.json`.

**Dev's call** (`social.pretextNpcs` entry, `character: "dev"`, `callId: "service_desk_call"`, per
`06` §4.8). The ink references these ids, which P6-E's call data must define:

- Say line ids: `open_buddy` (blanks `intern`, `team`), `repair_team` (blank `team`),
  `urgent_payslip` (no blanks), `name_drop_manager` (no blanks).
- Ask ids: `portal_name` (gated in ink on `not se_intel_lord_portal_name`; grants `lord_portal_name`
  + `lord_trusts_portal_sender` + `pretext_call_done`), `payslip_date` (gated on
  `not se_intel_lord_payslip_date`; grants `lord_payslip_date` + `pretext_call_done`).
- Blank VARs filled by the engine from the pretext card: `pretext_intern_name`/`_value`,
  `pretext_team_name`/`_value` (the `pretext_<blankKey>_name/_value` convention, confirmed from the
  slice's `brandt_desk`). The `team` blank offers `finance` (right) and the stale `accounts`
  (`old_org_chart`); the reaction knot reads `pretext_team_value` to answer in character.
- Dev's influence declared at `-10` (00 §8).

**Tomasz's debrief** reads `dev_reported`, `pretext_service_desk_call_outcome` (values `got_it` /
`reported` / `walked_away`) and `phish_pierce_attempts` for its fixed-string branches (no printed
variables, as Tomasz is voiced). Gated on `triage_pass` and `profile_done`.

## Checks run (this packet's gate)

The scenario does not exist yet (P6-E concurrent), so the scenario validator, the social ink↔data
lints and `reopencheck` cannot run here. They are P6-E's gate and the Phase-6 review; see "Blocked on
P6-E" below. The ink-only checks all pass.

- **Compile.** `bin/inklecate` compiles all seven files with no errors or warnings.
- **dialoguelint.** `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_social_engineering/ink/*.ink`
  → `Totals by rule: none`. Line lengths within caps (person max 22 words; phone files max 16,
  under the 25 cap). Two findings in the first pass were fixed: a Dev hang-up with no reply (added a
  sign-off), and a negative-parallelism line in Tomasz's debrief (rephrased; also a house-style rule).
- **inkcheck** (DFS from the entry knot) over the state matrix below: every run
  `runaway=0 failing=0`, no errors, no unreachable content. Looping person/phone hubs report
  `paths=0` (never reach `END`), which is correct for a hub — confirmed against the known-good
  `npc_oleg` and `brandt_desk`.
- **loopcheck** (200 steps × 6 strategies) on every hub knot: `no runtime errors`. All hubs use
  sticky `+` choices, so none empties out. `tomasz`/`dev` reach a clean `END` on the debrief/hang-up
  path, as intended.
- **Runtime tag trace** (a scratch harness against the vendored ink runtime) confirmed the
  load-bearing tags fire on the right gates:
  - `pierce_mail` landed → `set_global:phish_pierce_landed:true`; `lord_mail` landed →
    `set_global:phish_lord_landed:true`.
  - `ruth` hands `recon_key`/`operations_key`/`blue_team_key` on the correct globals and emits the
    backup `complete_task` tags for the globals set.
  - `tomasz` debrief → `complete_task:closing_debrief` + `exit_conversation`, with the Pierce
    first-try and `dev_reported` branches firing.
  - `fairbairn` auto-plays the sign scene on `roe_signed` and the pay-off on `report_filed` (a bug
    where the `quiet` flag ate the first hub pass was fixed by checking pending scenes on entry).

## State matrix (inkcheck / loopcheck)

| Story | Entry | States exercised |
|-------|-------|------------------|
| `ruth` | `start`, `resume`, `hub` | fresh; `plan_done`+scope/plan steps; `osint_done`+`se_intel_username_convention`; `report_filed`; all-done |
| `ruth_phone` | `hub` | fresh (stage 0); `roe_signed`+`plan_done` (stage 2); all-done |
| `fairbairn` | `start`, `resume`, `hub` | fresh; `roe_signed`; `roe_signed`+`report_filed` |
| `tomasz` | `start`, `hub`, `debrief` | fresh; `triage_pass`+`profile_done`+`dev_reported`+`phish_pierce_attempts=1` |
| `dev_service_desk` | `start`, `desk` | fresh (fallback asks return 0 = refused; real binding exercised in the browser playtest) |
| `pierce_mail` | `on_email` | landed; `first_fail` ∈ {senderTrust, pretextRelevant, attachmentPlausible+missing}; not opened |
| `lord_mail` | `on_email` | landed; `first_fail` ∈ {senderTrust, linkCredible+none, linkCredible+fail}; not opened |

## Blocked on P6-E (and the Phase-6 review)

- `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering --strict-social --no-graph
  --skip-ink` — needs `scenario.json.erb`. Will exercise the ink↔data lints: `on_email` knots and
  their declared `email_*` VARs; `se_influence` on both branches; pretext say/ask ids and per-line
  blanks matching the JSON; synced `VAR`s matching the channel stories; declared globals.
- `reopencheck.mjs` with the lab's block added to `scripts/ink_runtime_check/missions.json` — needs
  the scenario and its records. `missions.json` is a shared file; the block should be added once the
  scenario exists (not done here).
- Browser playtests (L1–L6, F1–F17) exercise the real `se_influence`/`pretext_say`/`pretext_ask`
  bindings and the live task mappings.

## Notes for the orchestrator / P6-E

- The opening choice (honest vs reassuring-but-wrong) is paid off inside the opening scene
  (Fairbairn's trust line vs Ruth's correction) and sets no global, per the PLAN (it "sets no gate").
- `dev_service_desk.ink` and `tomasz.ink` contain `-> END` (a pretext hang-up; a mission-conclusion
  debrief). `compile-ink.sh` prints a cosmetic END warning for these; it is correct here, as the slice's
  `brandt_desk` does the same.
- The three mail/pretext stories rely on P6-E authoring matching ids (keys, say/ask lines, blanks,
  globals) exactly as listed above. A grep of the finished `scenario.json.erb` against this list is the
  cheap cross-check before the first playtest.
