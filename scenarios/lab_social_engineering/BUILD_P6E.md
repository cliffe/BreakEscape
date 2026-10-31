# P6-E — Lab scenario build (results)

Packet P6-E, 2026-10-21. Owner: Opus. Built the lab scenario data (rooms, objects, `social` block,
objectives, globals) from `PLAN.md`, `designs/00_data_contract.md` and design `10`. Ran beside P6-F
(ink) and reconciled against its id contract (`BUILD_P6F.md`).

## Files written / changed

- `scenarios/lab_social_engineering/mission.json` — new. `collection: "lab_games"`,
  `secgen_scenario: null`, CyBOK (HF, AB, LR), difficulty 2.
- `scenarios/lab_social_engineering/scenario.json.erb` — new. The whole scenario: four rooms, the
  full `social` block, 8 aims / 23 tasks, `globalVariables`.
- `public/break_escape/assets/objects/report-workstation.png` — new placeholder (copy of
  `case-file.png`). **This file is P6-W's to own** (it copies placeholder object sprites and adds the
  preload line + schema entry). I created it only because the validator's social-object sprite lint
  (an error under `--strict-social`) needs `assets/objects/report-workstation.png` to exist, and P6-W
  runs after me. P6-W's rule is "never overwrite a file that already exists", so it will skip this one;
  it still owns the `core/game.js` preload line and the schema entry (neither is needed for the
  validator). If you would rather P6-W own the sprite too, delete this file and let P6-W copy it.

Scope check: `git status --porcelain` for my scope shows only `mission.json`, `scenario.json.erb` and
the `report-workstation.png` placeholder (plus P6-F's `ink/` and `BUILD_P6F.md`, which I did not
touch).

## Gate result

`ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --strict-social
--no-graph --skip-ink` → **exit 0**, 0 errors (`❌` count 0), 25 warnings/suggestions (none blocking).

The CLI takes the `scenario.json.erb` path, not the directory — passing the directory fails the
structure check (`File.dirname` resolves to `scenarios/`), exactly as the slice's done-when notes.

`python3 scripts/check_door_alignment.py scenarios/lab_social_engineering/scenario.json.erb` → all
three connections aligned (the validator also runs it: "Door alignment OK"). All four rooms are
`room_office` (same dimensions), so the hub's west/east/north doors meet their spokes.

The social ink↔data lints read P6-F's `.ink` sources directly even under `--skip-ink` (external
fallbacks, each channel story's influence `VAR`, `on_email` knots + `email_*` VARs + `se_influence`
on both branches, pretext say/ask ids and per-line blanks, synced VARs). All passed with 0 errors,
which confirms P6-E and P6-F reconcile.

## Reconciliation with P6-F (`BUILD_P6F.md`)

Matched exactly after reading its contract:
- Key item ids renamed to `recon_key`, `operations_key`, `blue_team_key` (Ruth's `itemsHeld`,
  `type: "key"`, with the door `opens_lock`/`keyPins`).
- Display names: `ruth_phone` → "Ruth Adeyemi", `dev_service_desk` → "Dev" (were "Ruth (phone)" /
  "Dev (service desk)"), so inline `Name:` attribution resolves.
- Ruth's `timedConversation` (`waitForEvent: game_loaded`, `skipIfGlobal`/`setGlobalOnStart:
  briefing_heard`, `targetKnot`/`currentKnot: start`) and the 19 `eventMappings` match the backup map.
- Dev call: say-line ids `open_buddy`, `repair_team`, `urgent_payslip`, `name_drop_manager`; ask ids
  `portal_name`, `payslip_date`. `knows`/blank keys are `intern` and `team` (not `person`), so the
  engine fills `pretext_intern_name/_value` and `pretext_team_name/_value` — the names P6-F's ink
  declares, and what the pretext lint expects (VAR name is keyed on the fact the blank feeds).
- Mail `storyPath`s point at `ink/pierce_mail.json` and `ink/lord_mail.json`; Hampshire is data-only
  (`outcome.setGlobal: { phish_hampshire_landed: true }`, no `character`).

## Data authored (from `00` / `10`)

- Cast directory (`social.people`), 3 `characters` (pierce/lord email, dev phone), 14 contract intel
  facts + 2 stale, templates (13), mail client (guest + created freemail, 3 contacts, 4 seeded
  benign messages, payload kit incl. `kit_payroll_page`), 10 concept cards, the OSINT sites (company
  team/notes/careers/apply/archive, friendface ×3 profiles with the Hampshire `showIf` trap, the PDF
  properties panel), the intel board (readiness slots per `00` §4), 3 phish targets, the Dev
  `pretextNpcs` call, the 8-message triage set (6 authored + 2 `playerSent`, `playerSentAuth` for both
  accounts and all six domain ids), the `payroll_login` landing page (six domain tiers incl. the
  homograph `е` written as a `\u` escape), and the `engagement` block (scope/plan/report/defender).
- Orchestrator additions made: `engagement.scope.intro`, `engagement.plan.objectivesPrompt`,
  `engagement.plan.measuresPrompt` (short plain UK English), as P6-C needs them.

## Things I was unsure about / left for others

- **`report-workstation.png`** — created as a placeholder (above); strictly P6-W's file. Flagged so
  P6-W doesn't duplicate and can take ownership of the sprite + preload line + schema entry.
- **`pretext_call_reported`** — set by Dev's `reported` outcome (contract `00` §13, `10` globals
  table) but P6-F's Tomasz branches on `pretext_service_desk_call_outcome` and `dev_reported`, so the
  validator flags it as set-but-unread (a 💡 suggestion, not an error). Kept it because the contract
  mandates the setter and the lab sheet / review may use it; drop the setter later if it stays unused.
- **No `conclusionScreen`** on the mission-conclusion aim — a warning only (I added
  `concludeRequires: {}` to make the "reaching the end is the whole condition" intent explicit). A
  closing screen is a polish item for P6-S / the Phase-6 review.
- **Phone-NPC avatars and `music`** — recommended-field warnings only; left for the art/P6-S stages.
- The `redFlagMeter` live meter is unbuilt (P6-M). I authored `redFlagMeter: true` on Hampshire and
  `false`/absent on Pierce and Lord, and `mailClient.showRedFlagMeter: false`, per `00` §1 / R2-M1; if
  P6-M never lands, the `onSend` checklist carries the on-ramp for everyone with no solvability change.
- Cut-order ERB variants (`SE_LAB_CUTS`) are P6-U's; the file is plain JSON-in-`.erb` for now.
