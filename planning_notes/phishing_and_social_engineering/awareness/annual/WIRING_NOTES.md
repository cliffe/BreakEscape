# core_17 annual edition: wiring notes for the shell agent

WP-12 Part B. The content (the combined 8-message set `annual_2027_mixed`, the "what changed this
year" brief, and the defend/debrief strings) is finished in `annual/defend.json`. This file tells the
wiring agent (Sonnet) everything else needed to build the one shell. The content agent did **not**
build the shell or a generator; follow the handover rules (never run a generator into the repo).

A scratch copy that proves the set and the episode block validate under `--strict-social` was built
from the E6 defend shell with this set swapped in; see "Proof it validates" at the end.

## The one shell

- **Folder:** `scenarios/awareness_core_17_annual_2027_defend/` with `scenario.json.erb`,
  `mission.json`, `ink/`. One shell only (a `defendOnly` variant). No pre/post check shell is built
  for core_17: the role post-check that follows the edition is one of the already-built role check
  shells, placed after it by the organiser.
- **scenario_id:** `awareness_core_17_annual_2027_defend`.
- **Skeleton:** copy the shape of `scenarios/awareness_e6_texts_and_qr_defend/scenario.json.erb`
  (top-level keys: `scenario_id`, `scenario_name`, `scenario_brief`, `endGoal`, `version`,
  `disableAttacks: true`, `startRoom: "training_room"`, `startPosition`, `player`, `objectives`,
  `globalVariables`, `social`, `lighting`, `rooms`).

## awarenessEpisode and the set (copy verbatim from the fragment)

- Copy `annual/defend.json` `triageSets[0]` (`annual_2027_mixed`, 8 messages) into
  `social.triageSets`, and `annual/defend.json` `awarenessEpisode` into `social.awarenessEpisode`.
  Strip the `_`-prefixed authoring notes (`_about`, `_sources`, the set's `_prefix`/`_order`) when
  you copy, as the built shells carry none.
- `awarenessEpisode` fields already set in the fragment: `id: "core_17_annual_2027_defend"`,
  `role: "general_staff"`, `company: "brightwell_foods"`, Brightwell `brand`, `variant: "defendOnly"`,
  `durationTargetMin: 10`, `scopeNote`, `stages: ["brief","defend","debrief"]`,
  `conclusionTaskId: "check_annual_edition"`, `defend: { setId: "annual_2027_mixed", stage: null,
  reportAlwaysVisible: true }`, `debrief: { mondayCard: "slot:customer_report_route",
  noBlameLine: true }`, and `strings` (`brief`, `defendIntro`, `defendOnly`, `noBlameLine`,
  `mondayCard`). These are the strings the spec says to rewrite from the E6 defend shell; they are
  already rewritten to neutral year-review wording in the fragment, so copy them as-is. The two
  `flip*` strings are never shown in a `defendOnly` shell, so do not add them.
- Set internals (already in the fragment, do not change): `scoringProfile: "awareness"`,
  `verifyVerdict: true` (calls and a voicemail need the ring-back verdict), `feedbackMode:
  "immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `realLabel: "Real messages"`,
  `title: "The year in review"`, the 7-id `channelTells` union, and
  `outcome: { setGlobalPrefix: "episode_core_17_annual_2027_defend_defend_", passPercent: 0 }`.
- Keep `social.awareness` (the shared `ruleOfThumb` block) exactly as the E6 shell has it, so the
  rule-of-thumb test passes. Carry it via `awareness_deploy.awareness_block()` if you use a
  generator.

## globalVariables (declare all six, defaults as shown)

```
"episode_core_17_annual_2027_defend_state": {},
"se_awareness_records": [],
"episode_core_17_annual_2027_defend_defend_percent": 0,
"episode_core_17_annual_2027_defend_defend_reportRate": 0,
"episode_core_17_annual_2027_defend_defend_done": false,
"episode_core_17_annual_2027_defend_defend_pass": false
```

No `phish_*` global and no `triage_pre_*` globals (core_17 is not a check mission). No `defend.calls`
key (the two E3 calls are reshaped into `messages` in the fragment).

## The conclusion wiring (the built defend way)

- One objective with `missionConclusion: true`, `concludeRequires.globals:
  ["episode_core_17_annual_2027_defend_defend_done"]`, and a task `check_annual_edition`
  (this matches `awarenessEpisode.conclusionTaskId`). Model it on
  `awareness_e6_texts_and_qr_defend`'s `work_phone_aim` objective.
- The set's `outcome.setGlobalPrefix` writes `episode_core_17_annual_2027_defend_defend_done` when
  the run ends; the host NPC's `eventMappings` entry completes the task on it:
  `{ eventPattern: "global_variable_changed:episode_core_17_annual_2027_defend_defend_done",
  condition: "value === true", onceOnly: true, completeTask: "check_annual_edition" }`.
- The kiosk object's `minigameData.episodeId` is `"core_17_annual_2027_defend"` (the episode id,
  without the `awareness_` scenario prefix).

## Host and room

- **Host: Graham Whitfield**, a neutral proctor (a built Brightwell finance check host, `BRAND_SET.md`).
- Graham exists today only with check-form welcome ink (`awareness_pre_finance_ab/ink/graham_pre.ink`),
  which is the wrong shape for a defend host. So **copy the defend-host ink
  `ink/chidi_okeke.ink` from `scenarios/awareness_e6_texts_and_qr_defend/`**, rename it to
  `ink/graham_whitfield.ink` (knot `start`; the NPC's `storyPath` points at the compiled
  `ink/graham_whitfield.json`), and replace Chidi's Tarrowby lines with Graham's generic
  year-review proctor lines (no company-specific detail, since the run spans three companies).
  Compile the ink to `.json` as the other defend shells do.
- **Company:** `brightwell_foods` (matches Graham and the Brightwell default `brand` in the fragment).
  **Room:** `room_aw_brightwell`, dressed neutrally per the module (the run is cross-company, so no
  single-company dressing). Use `training_room.room_fields(company)` / `scenario_lighting(company)`
  if you build via a generator, the way the E-shells do.
- NPC id `graham_whitfield`, `npcType: "person"`, with the `eventMappings` above. Give it a built
  Brightwell-appropriate `spriteSheet`/`spriteTalk`/`spriteVisemes` (reuse an existing sprite; host
  art is a later step).

## mission.json

Copy the block from `scenarios/awareness_e7_voice_ceo_defend/mission.json` (a built `defendOnly`
shell) and change only `display_name`, `description` and the `cybok` keywords; keep the rest:

- `display_name: "Year End: the annual mixed edition"`
- `description`: say it is about 10 minutes, all staff, defending side only; a mixed run of the year's
  messages across channels and three fictional companies; and that the organiser places the learner's
  existing role post-check after it (it compares against the role pre-check through the built
  `pre_check_completed` / `triage_pre_*` import mechanism, which is the post shell's own wiring, not
  core_17's).
- Keep: `difficulty_level: 1`, `scoring: "completion"`, `secgen_scenario: null`,
  `collection: "training"`, `ui_theme: "general"`, `estimated_duration_minutes: 10`,
  `cybok` ka `HF` (keywords e.g. Security awareness, Phishing, Vishing, Annual assessment).

A validated scratch `mission.json` is at
`<scratch>/awareness_core_17_annual_2027_defend/mission.json` (see below).

## Generator

Optional. The set is hand-assembled in the fragment, so the simplest path is to author the erb by
hand (copy the set and episode block from the fragment). If you add a generator, model it on
`gen_e3_e5_shells.py` (`scenario()`, `host_npc()`), carry `social.awareness` via
`awareness_deploy.awareness_block()`, and **never run it into the repo**: regenerate into a scratch
folder, confirm a no-change regen of the existing shells is byte-identical to HEAD, then copy in only
the new `core_17` files. Restore any `dungeon_graph.*` churn to HEAD.

## Tests to update

- **Shell-count test** (`test/js/social-awareness-rule-of-thumb.test.mjs`): it asserts the count of
  `scenarios/awareness_*` folders and that every one carries an identical `social.awareness.ruleOfThumb`.
  Adding this shell makes one more folder, so bump the asserted count by 1 **against the real
  committed count at build time**. CAUTION (2026-10-29): the working tree already carries an
  untracked `scenarios/awareness_e8_after_the_click/` (another agent's in-progress E8, only an empty
  `ink/`), so on disk the test already sees 39 and fails the `== 38` assertion before core_17 exists.
  Do not treat that as your failure; reconcile the number with whatever `awareness_*` shells are
  actually committed when you build (count `git ls-files` not the dirty tree), and make sure the new
  shell's `ruleOfThumb` is byte-identical to the others (copy from `awareness_deploy.awareness_block()`
  or an existing shell).
- **Fragment-erb parity test** (`test/js/social-awareness-fragment-erb-parity.test.mjs`): its
  `EPISODES` list is a fixed E1-E7 set and does **not** enumerate defend shells, so core_17 needs no
  entry there and no allow-list change.

## Course placement (ask first)

Place the mission in both seeded courses as the year-end item **through 01 P12**. Do **not** hand-edit
Hacktivity or use `awareness_deploy.py`, and get the user's explicit go-ahead before any Hacktivity
change (standing rule).

## Proof it validates (scratch)

The content agent built a scratch copy of the E6 defend shell with this set and episode block swapped
in, at `<scratch>/awareness_core_17_annual_2027_defend/` (scratch dir
`.../scratchpad/aw2/content-wp/`), retargeting ids/globals/host/kiosk to the core_17 names above, and
ran:

```
bundle exec ruby scripts/validate_scenario.rb <scratch>/awareness_core_17_annual_2027_defend/scenario.json.erb --strict-social --no-graph --skip-ink
```

Result: `✓ Validation complete!` with no errors (only the standard "no timedConversation" recommended
hint). Specifically confirmed: the `defendOnly` stage order `["brief","defend","debrief"]` is allowed;
the 8-item set is within `EPISODE_MESSAGES = (4..8)`; `attack_checks` does not run; the id ends
`_defend` and the prefix is `episode_core_17_annual_2027_defend_defend_`; the done global is declared
and gates the conclusion aim; the two reshaped E3 `call` messages validate (verifyVerdict is on); the
cloned voicemail keeps `truth.critical: true`; message ids stay unique. The scratch copy is
throwaway: build the real shell fresh at `scenarios/awareness_core_17_annual_2027_defend/`.
