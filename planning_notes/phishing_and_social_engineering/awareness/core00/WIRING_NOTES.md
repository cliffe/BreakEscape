# core_00 first-play brief: wiring notes

WP-12 Part A (`11_WP12_FIRST_PLAY_AND_ANNUAL.md`). This folder holds the content a wiring agent
pastes into a built shell. core_00 is a **brief-only episode on ENG-10** (`variant: "brief"`,
`stages: ["brief"]`): the kiosk runs the brief stage, shows the seven cards with Next and a final
Got-it card, writes the done global, and finishes. There is **no** defend set, attack block or
scored decision, so `defend.json` here despite its name holds only the `awarenessEpisode` block.

The content proved to validate under `--strict-social` by building a scratch shell from the ENG-10
fixture `test/js/fixtures/social_awareness/clean_brief_only.json` with this block swapped in (the
scratch run is `✓ Validation complete!`, no `❌ INVALID`). The ink compiles with `bin/inklecate`.

## Files

- `defend.json`: the `awarenessEpisode` block (variant `brief`, the seven `strings.briefCards`,
  `briefDone`, `alreadySeen`, `doneGlobal`, `oncePerLearner`). Paste into the shell's
  `social.awarenessEpisode`.
- `ink/anjali_rao.ink`: the host's one welcome line (hub pattern). Move to
  `scenarios/awareness_core_00_first_play/ink/anjali_rao.ink`, compile to `anjali_rao.json`, and
  point the host NPC `storyPath` at the compiled JSON with `currentKnot: "start"`.

## The shell: `scenarios/awareness_core_00_first_play/scenario.json.erb`

Copy the skeleton from a built `awareness_*_defend` shell (or the ENG-10 fixture) and
`gen_e3_e5_shells.py` `scenario()`. Set:

- `scenario_id: "awareness_core_00_first_play"`, `disableAttacks: true`, `startRoom: "training_room"`.
- The standard `player` block (reuse the `female_office_worker_v2` learner block the built checks use).
- One training room `training_room` of type **`room_aw_quayholt`** (the shipped default company), with:
  - the host NPC **Anjali Rao** (`id: "anjali_rao"`, `npcType: "person"`), placeholder sprite until
    PixelLab (reuse `female_scientist` as the built checks do for Anjali, or the room default),
    `storyPath` the compiled `ink/anjali_rao.json`, `currentKnot: "start"`, and the completion
    mapping below;
  - one `kiosk` object whose `minigameData.episodeId` is **`core_00_first_play`** (it must equal
    `awarenessEpisode.id`, or the runner alerts and does not start).

### Completing the mission (the one wiring decision)

Ship the **clean ENG-10 path**: the runner writes `episode_core_00_first_play_done = true` when the
brief-only episode reaches its last stage. The objective concludes on that done global, exactly as
the built defend/check shells do. The host NPC carries the mapping (a global cannot complete a task
by itself):

```json
"eventMappings": [
  { "eventPattern": "global_variable_changed:episode_core_00_first_play_done",
    "condition": "value === true", "onceOnly": true, "completeTask": "complete_brief" }
]
```

One objective with `missionConclusion: true`:

```json
{
  "aimId": "finish_brief_aim", "title": "Read the brief",
  "description": "Read the brief at the kiosk.", "status": "active", "order": 0,
  "missionConclusion": true,
  "concludeRequires": { "globals": ["episode_core_00_first_play_done"] },
  "conclusionScreen": { "type": "success", "title": "You're set",
    "body": "That's the brief. Start your first episode whenever you're ready." },
  "tasks": [ { "taskId": "complete_brief", "title": "Read the brief", "type": "custom", "status": "active" } ]
}
```

`conclusionTaskId` in the block is `complete_brief`; it must be a task of this aim and the mapping's
`completeTask`. Add a `conclusionScreen` (type `success`): a `missionConclusion` aim without one
raises a validator warning (mission-ending convention).

### globalVariables (declare all; ENG-10 lints the done global)

```json
"globalVariables": {
  "se_awareness_records": [],
  "episode_core_00_first_play_state": {},
  "episode_core_00_first_play_done": false
}
```

`doneGlobal` must start `false`. No `triage_*` globals and no `phish_*` global (no defend set, no
triage round). The state global is written once by the runner and is lint-required for a brief
episode.

### social.awareness (the rule-of-thumb test)

Carry `social.awareness` via `awareness_deploy.awareness_block()` so the shared rule of thumb is
present and `test/js/social-awareness-rule-of-thumb.test.mjs` passes. (Card 6 of the brief also
quotes the rule of thumb word for word, which must stay identical to
`awareness_deploy.AWARENESS_RULE_OF_THUMB_TEXT`.)

## mission.json

```json
{
  "display_name": "Before you start: how this works",
  "description": "A short brief shown before your first episode at Quayholt Insurance, a fictional company. It covers how the course works, that nothing real is asked for, what is recorded and who sees it, the habit to keep, and how to report. There is nothing to get wrong. Organiser note: place this as the opening mission so a learner meets it before their first episode.",
  "difficulty_level": 1,
  "scoring": "completion",
  "secgen_scenario": null,
  "collection": "training",
  "ui_theme": "general",
  "estimated_duration_minutes": 5,
  "cybok": [ { "ka": "HF", "topic": "Human Factors",
    "keywords": ["Security awareness", "Phishing", "Reporting"] } ]
}
```

## Course placement (organiser / Hacktivity, not this brief)

Place core_00 **first** in both seeded Hacktivity courses, as the opening mission, so a learner
meets it before their first episode. This is a Hacktivity edit; name it, do not do it without the
user's go-ahead on any Hacktivity change.

## Engine gaps to flag (not this brief's work)

- The multi-card brief, the Got-it gate, once-per-learner play and the brief-only done global are
  all **ENG-10** and are used above.
- **Host adoption:** the module intends the brief to adopt the first episode's host. ENG-10 does not
  do this; it stays a later engine gap. For the shipped shell the host is fixed to Anjali Rao at
  Quayholt.
- **BE-20** (authorable title and tutorial, so the opening shows the course title, not the
  platform's) is out of scope here and not part of ENG-10, but needed for the first impression.

## Questions for the wiring agent

- `durationTargetMin`/`estimated_duration_minutes` are set to 5 (the spec's "about 5 minutes"); the
  module's game_design says 2 to 3. The content is short, so either is fine; shipped at 5 unless the
  user says otherwise.
- The default company/host is Quayholt Insurance / Anjali Rao / `room_aw_quayholt`. If an organiser
  opens a different company first, swap the room type, brand and host once host adoption lands.
