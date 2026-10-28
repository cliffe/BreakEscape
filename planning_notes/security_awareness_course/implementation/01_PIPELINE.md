# The new-episode pipeline

**Goal:** build one new awareness episode (full shell, defend-only shell, check items, bridge, course entries) the way E1 to E7 were built, so that it passes every check in `00_README.md` §8 without hand fixes afterwards.

**Read first:** `00_README.md`; `planning_notes/phishing_and_social_engineering/awareness/HANDOVER.md` §4; `BRAND_SET.md` (same folder); the episode's brief in `episodes/`; the module's `concepts.md` (the source of truth for teaching content).

**Depends on:** the engine packets your episode's brief names (`02_ENGINE_WORK.md`). Do not author a key that a packet adds until that packet has landed: the schema rejects unknown keys (`scripts/scenario-schema.json` uses `"additionalProperties": false` on `socialAwarenessEpisode` and `socialTriageSet`).

**Owner model:** content steps (P1, P2 content, P3) go to `opus48`. Wiring steps (P2 skeleton, P4 to P12) go to `general-purpose` with `model: "sonnet"`. Playtests go to Sonnet (`00_README.md` §6).

Paths below are relative to the repo root. `AW` means `planning_notes/phishing_and_social_engineering/awareness`. `SCRATCH` means your own scratch subfolder inside the session scratchpad, for example `<scratchpad>/e8-wiring/`. Give its full path in every agent prompt.

**E8 is the pilot.** Whoever runs E8 records every step below that was wrong or missing, and fixes this file before E9 starts.

## P0. The safe regeneration procedure (used by P4 and P5)

Every generator and room script writes files. Never point one at the repo.

1. Copy the script and the modules it imports into `SCRATCH/tools/`. For the shell generators these are `training_room.py`, `awareness_deploy.py` and `training_room_lighting.json` from `AW`.
2. **Set the repo the generator reads, by one rule.** A generator needs two paths: the repo it reads source and existing shells from, and the output folder it writes to. Always pass the output folder (step 3 on). For the repo:
   - **The built generators** (`gen_e6_e7_shells.py` and the like) hard-code `REPO = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'` and default their output to `REPO + '/scenarios'`. In the scratch copy only, change `REPO` to the checkout you are in (`/home/user/BreakEscape` in this container), and restore it before copying the script back (step 6).
   - **The new generator (P4)** does not hard-code a home folder and takes no source edit. It reads the repo from the `BREAKESCAPE_REPO` environment variable or a `--repo` argument, and falls back to its own path (`Path(__file__).resolve().parents[3]`, correct only when it is run from `AW/` in the real checkout). Because P0 runs it from `SCRATCH/tools/`, where the path fallback would resolve to a scratch folder, **export `BREAKESCAPE_REPO=<checkout>` (or pass `--repo <checkout>`) when you run it from scratch**. No source edit, so step 6's "restore REPO" does not apply to it.
3. **No-change run first.** Run the unchanged scratch copy into `SCRATCH/out-before/`. Every file it writes must be byte-identical to the repo's:

   ```
   REPO=/home/user/BreakEscape          # the checkout you are in
   cd SCRATCH && python3 -I tools/gen_e6_e7_shells.py SCRATCH/out-before
   for d in SCRATCH/out-before/*; do m=$(basename "$d")
     for f in scenario.json.erb mission.json; do cmp -s "$d/$f" "$REPO/scenarios/$m/$f" || echo "DIFF $m/$f"; done
     for i in "$d"/ink/*.ink; do cmp -s "$i" "$REPO/scenarios/$m/ink/$(basename "$i")" || echo "DIFF $m/ink"; done
   done
   ```

   Expected: no `DIFF` line. This was confirmed for `gen_e6_e7_shells.py` on 2026-10-27, with `REPO` patched in a scratch copy. If anything differs, stop: someone has edited a shell by hand, and that must be settled before you regenerate.
4. Make your change in the scratch copy, run it into `SCRATCH/out-after/`, and diff `out-before` against `out-after`. Only the files you meant to change may differ.
5. Copy only those files into the repo: `scenario.json.erb`, `mission.json` and the `.ink`. Then compile the ink in place (P3).
6. Copy a changed **built** generator back to `AW`, with its hard-coded `REPO` restored to the original value, so that the committed script still matches the user's machine. The **new** generator (P4) has no hard-coded `REPO` to restore: it reads `BREAKESCAPE_REPO`/`--repo`, so the committed script is used unchanged on every machine.
7. Restore any `dungeon_graph.*` churn on shells you did not mean to touch with `git show HEAD:<path> > <path>`.

## P1. The fragments: `AW/eN/attack.json` and `AW/eN/defend.json`

**What they are.** The source of record for the episode's shared content (HANDOVER §4). `defend.json` feeds the defend-only shell and the check shells through the generator. The parity test compares it with the full erb. `attack.json` is the attack-side content that is copied into the full erb by hand.

**Shape of `defend.json`.** Copy `AW/e1/defend.json` (a mail episode) or `AW/e5/defend.json` (an episode with a `_brandAdditions` block). The top-level keys are:

- `_about`: an authoring note.
- `triageSets`: the episode set first (`e1_payments_inbox` in E1), then any new check forms (`10_CHECK_FORMS.md` says which). New forms go in the new episode's own fragment, never in E1 to E7's.
- `awarenessEpisode`, with `role`, `company`, `brand` (`{ "name", "logoText", "accent" }`), `scopeNote`, `defend` (`{ "setId", "stage", "reportAlwaysVisible" }`), `debrief` (`{ "mondayCard": "slot:customer_report_route", "noBlameLine": true }` in every built episode), `strings` and `_defendOnly` (`{ "_use", "brief", "scopeNote" }`, read by the generator for the defend-only shell).

`strings` holds `brief`, `noBlameLine`, `mondayCard`, `defendOnly` and the flip lines (`flipHeading`, `flipIntro`, `flipDefenderLine`, `flipNoSend`, `flipMissed`, `flipMissedHeading`, `flipLandedNoTells`). See `AW/e1/defend.json` `awarenessEpisode.strings`. A triage message's shape is the episode set's own: copy `scenarios/awareness_e5_signin_pages/scenario.json.erb` `social.triageSets[0].messages[1]` for a `page` card, and the E1 set for email.

**Shape of `attack.json`.** Copy `AW/e1/attack.json` for a mail attack: `people`, `intelFacts`, `templates`, `mailClient`, `osint`, `phishTargets`. Copy `AW/e3/attack.json` for a call attack: `characters`, `pretextNpcs` and `_episodeAttack`. Copy `AW/e5/attack.json` for a page attack: `landingPages` and `conceptCards`. An attack shape added by an engine packet (`guess`, `mistake`, `world`, `assistant`) takes the fragment shape that packet gives.

**Full-episode-only episode keys (`flipAftermath`, `stepLabels`, `guess`, `mistake`, `flip.mode`, `world`, `assistant`, `privacyPanel`, `sortDrill`, `concernForm`).** These are episode-level (not in `strings`) and are not shared with the defend-only shell. The generator's `defend_only()` builds the defend-only `awarenessEpisode` from named fields, so it never copies them, and the parity test does not compare them. Author each one by hand into the **full erb** `social.awarenessEpisode` (P2). Record it in `AW/eN/defend.json` `awarenessEpisode` as well if you want the fragment to hold the full record; the generator ignores it either way. `flipAftermath` (ENG-01) follows this rule: hand-authored into the full erb, inline (`heading`, `victimName`, `intro`, `items[]`, `line`), not pointed at a defend-set id.

**Check:** `python3 -m json.tool AW/eN/defend.json >/dev/null && python3 -m json.tool AW/eN/attack.json >/dev/null`. Expected: no output.

**Note.** No test compares `attack.json` with the erb. In E1 and E5 `phishTargets` has already drifted (the erb is newer). Keep the two in step by hand, and treat the erb as the truth if they disagree.

## P2. The full shell: `scenarios/awareness_eN_<slug>/scenario.json.erb` and `mission.json`

The full shells are hand-authored plain JSON with no ERB tags (the parity test parses them with `JSON.parse`). Copy the nearest built episode:

| New episode's attack | Copy | Why |
|---|---|---|
| a mail write (E8, E14) | `scenarios/awareness_e1_invoice_fraud/` | stages `brief, osint, write, flip, defend, debrief` |
| a page build (E10) | `scenarios/awareness_e5_signin_pages/` | adds `build`, `landingPages`, `conceptCards` |
| a call (E12, if its brief adds one) | `scenarios/awareness_e3_helpdesk_reset/` | `attack.callId`, `pretextNpcs`, `characters`, a phone NPC ink |
| a new stage (E9, E11, E13, E15, E16) | `scenarios/awareness_e1_invoice_fraud/` for the frame, plus the block the packet defines | |

**Keys to set, in the order E1 has them:**

- `scenario_id` (the folder name), `scenario_name`, `scenario_brief`, `endGoal`, `"version": "1.0"`, `"disableAttacks": true`, `"startRoom": "training_room"`, `startPosition` (`{ "x": 6, "y": 6.2 }`, which is `training_room.START_POSITION`).
- `player`: copy E1's block unchanged. The chosen avatar overrides it at runtime (aw9, `public/break_escape/js/utils/player-avatar.js`).
- `objectives`: two aims, as E1. The first aim's task is `"type": "manual"`, completed by the host's event mapping. The second aim has `"missionConclusion": true`, `"concludeRequires": { "globals": ["episode_<id>_defend_done"] }` and a `success` `conclusionScreen`, and its task id equals `awarenessEpisode.conclusionTaskId`.
- `globalVariables`: `episode_<id>_state: {}`, `se_awareness_records: []`, the four `episode_<id>_defend_{percent,reportRate,done,pass}`, plus the attack's own: `se_osint_state`, one `se_intel_<factId>: false` per `intelFacts` id, and `phish_<targetId>_landed` and `phish_<targetId>_attempts` for a mail target. See E1's block.
- `social.awareness`: exactly `{ "ruleOfThumb": { "heading": "The habit to keep", "text": <AWARENESS_RULE_OF_THUMB_TEXT> } }`. Copy it from E1. Do not retype it.
- `social.triageSets`: only the episode set, copied from the fragment. Add `playerSentAuth` here only (it is erb-only and allow-listed).
- `social.awarenessEpisode`: `id` (`eN_<slug>`), `role`, `company`, `brand`, `"variant": "full"`, `durationTargetMin` (15), `scopeNote`, `stages`, `conclusionTaskId`, `attack` (E1: `target`, `siteIds`, `accountIds`, `defaultAccount`, `showRedFlagMeter`, `"maxMessages": 1`, `"scored": false`), `defend`, `strings`, `debrief`. `strings` and `debrief` must equal the fragment's, apart from the allow-listed erb-only strings (P7).
- The attack-side `social` keys from `attack.json`, with the `_` notes stripped.
- `lighting` and `rooms.training_room`: generate them from `training_room.py` (P5). Do not copy another company's.
- `rooms.training_room.npcs[0]` (the host): `id`, `displayName`, `"npcType": "person"`, `"position": { "x": 5.5, "y": 3.8 }`, `spriteSheet`, `spriteTalk`, `spriteVisemes`, `storyPath: "scenarios/<folder>/ink/<host_id>.json"`, `"currentKnot": "start"` and two `eventMappings` (E1: one on `phish_<target>_attempts` with `"condition": "value > 0"` completing the first task, one on `episode_<id>_defend_done` with `"condition": "value === true"` completing the second).
- `rooms.training_room.objects[0]`: the kiosk, as E1 (`"type": "kiosk"`, `"id": "training_kiosk"`, no `position`, because the map's kiosk slot places it), `observations`, `observationVariants` on `globalVars.episode_<id>_defend_done`, and `"minigameData": { "episodeId": "<id>" }`.

**`mission.json`:** copy `scenarios/awareness_e1_invoice_fraud/mission.json`. Keep `"scoring": "completion"`, `"secgen_scenario": null`, `"collection": "training"`, `"ui_theme": "general"` and `"difficulty_level": 1`. Set `display_name` as `"Awareness EN: <Topic> (full episode)"`, `description`, `estimated_duration_minutes` and `cybok` (`ka` `"HF"`, `topic` `"Human Factors"`, keywords).

**Check:**

```
python3 -c "import json;json.load(open('scenarios/awareness_eN_<slug>/scenario.json.erb'))"
bundle exec ruby scripts/validate_scenario.rb scenarios/awareness_eN_<slug>/scenario.json.erb --strict-social
python3 scripts/check_door_alignment.py scenarios/awareness_eN_<slug>/scenario.json.erb   # E12 only (it has a door)
```

Expected: the JSON parses; the validator exits 0 with no `SOCIAL:` error; the door check exits 0.

## P3. Ink

- **Where it lives:** `scenarios/<folder>/ink/<host_id>.ink`, compiled to `<host_id>.json` beside it. Each shell has its own copy (the defend-only shell's is generated).
- **The full episode's host ink is hand-authored.** Copy `scenarios/awareness_e1_invoice_fraud/ink/adaeze_okafor.ink`. It has a header comment, `VAR` declarations for exactly the globals it reads (the attack's attempts global and `episode_<id>_defend_done`), a `start` knot that diverts to `hub`, and the m03 `hub_quiet` pattern (one welcome line chosen by progress, one choice, `#exit_conversation`, back to `hub`).
- **Any other NPC** (a phone NPC for a call, or a world NPC for E12) gets its own ink file. Copy `scenarios/awareness_e3_helpdesk_reset/ink/leila_servicedesk.ink` for a call target. For an NPC who opens a door on influence, copy the turnstile pattern in `scenarios/m02_ransomed_trust/ink/m02_npc_security_guard.ink` (around line 309: `#unlock_door:<roomId>`, honoured for an NPC whose record lists the room in `unlockable`).
- **Rules:** no printed variables in voiced lines. Lines are attributed `Name: text`. Follow `README_ink_best_practices.md`.

**Check:**

```
./scripts/compile-ink.sh awareness_eN_<slug>
node scripts/ink_runtime_check/dialoguelint.mjs scenarios/awareness_eN_<slug>/
```

Then add the shell's block to `scripts/ink_runtime_check/missions.json` (copy the `awareness_e1_invoice_fraud` block: its `globals` and its `npcs` with `id`, `npcType`, `storyPath`, `currentKnot` and `room`), and run `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`. Expected: it compiles with no errors, gives no unexplained lint finding, and reopencheck passes.

## P4. The generator for the defend-only shell (and the new check shells)

**Decision: add one new script, `AW/gen_e8_e17_shells.py`.** Do not extend `gen_e6_e7_shells.py`. The built generators each copy their helpers rather than importing them, "so the two can change separately" (header of `gen_e6_e7_shells.py`), and editing a built one would risk regenerating E1 to E7 shells.

Build it from `AW/gen_e6_e7_shells.py`, whose helper scaffolding matches the fields below (it has `meta_for`; `gen_e3_e5_shells.py` instead has `success_screen` and inline cybok, a different shape). **But take E8's host data from `gen_e3_e5_shells.py`, not from `gen_e6_e7_shells.py`:** E8's host is Anjali Rao, and her `HOSTS['anjali']` entry already exists in `gen_e3_e5_shells.py` (`'id': 'anjali_rao', 'displayName': 'Anjali Rao', 'sprite': 'female_scientist'`), together with her `LINES[('e5', 'defend')]` style; `gen_e6_e7_shells.py` has no Anjali, so do not look for her there. Copy Anjali's `HOSTS` entry and line shape across; keep her sprite `female_scientist`.

- Copy the helpers unchanged: `strip_private`, `clean_set`, `host_npc`, `kiosk`, `scenario`, `ink_source`, `meta_for`, `defend_only` and `check`.
- **Required `EPISODES` keys (the single authoritative list; taken from the real `gen_e6_e7_shells.py` `'e6'` entry).** Keep one `EPISODES` dict entry per new episode. `defend_only()` and `load()` read exactly these top-level keys: `frag`, `full_id`, `defend_set`, `defend_host`, `cybok` and `defend`. The `defend` dict holds `name`, `brief`, `endGoal`, `aim`, `task`, `kiosk`, `display`, `desc`, `minutes`, `defendIntro` and `conclusion` (plus optional `voicePanel` and `stage`). Spell them exactly as the generator reads them: the closing-screen key is `conclusion` (a `(heading, text)` tuple), **not** `ending`, and `defendIntro` (the kiosk lead line) is **required**; omitting either, or using `ending`, raises a `KeyError` when the generator runs (R5 proved this in scratch). Each episode spec's filled entry must use this shape.
- **Check shells are not built here.** The new topics are measured by the **two** shared pairs `general_v2` and `data_conduct` only, not by one form per episode, so no new-episode entry carries `role_word`/`role_label`/`forms`/`check_hosts`/`check`. The two pairs and their pre/post check shells are built by the check-forms generator that `10_CHECK_FORMS.md` defines (its own `gen_checks_v2_shells.py`), from the `triageSets` in `defend.json`. `gen_e8_e17_shells.py` builds only the episode full and defend-only shells. If a later topic genuinely needs its own check role, add the `check()` fields then, but that is not the plan for E8 to E17.
- **A `HOSTS` entry is required for every episode host** that any `EPISODES` entry names in `defend_host` (`defend_only()` reads `HOSTS[cfg['defend_host']]`, so a missing one raises a `KeyError`). Each `HOSTS` entry has `id`, `displayName`, `sprite` and `about`, plus a `LINES[('eN', 'defend')]` entry. For E8 the host entry is Anjali's, copied from `gen_e3_e5_shells.py` (`sprite: 'female_scientist'`) as above, not re-invented; each later episode's host entry is copied from whichever built generator already holds that host, or authored new with the name-clash search (P11). An episode that introduces a new host (for example E12's kiosk colleague) must add its own `HOSTS` entry, naming a real built sprite. The `CHECK_LINES` and `PERMUTE` entries (an explicit permutation with the phish in disjoint slots across A and B, as `CHECK_PARITY_AUDIT.md` requires) belong to the check-forms generator in `10_CHECK_FORMS.md`, not here, since this generator builds no check shells.
- **Differences from the template, to make it safe by construction:**
  - take the repo from the `BREAKESCAPE_REPO` environment variable or a `--repo <path>` argument, falling back to the script's own path (`REPO = str(Path(__file__).resolve().parents[3])`) only when neither is set, instead of a hard-coded home folder. The path fallback is right when the script is run from `AW/` in the real checkout; P0 runs it from `SCRATCH/tools/`, where the fallback resolves to a scratch folder, so P0 sets `BREAKESCAPE_REPO` (P0 step 2). This one rule means the committed script runs unpatched everywhere;
  - require the output folder as an argument (exit with a usage line when it is missing), so the script can never default into `scenarios/`;
  - `main()` builds every new episode each run, so a later run must regenerate the earlier ones byte-identically (P0 step 3).
- The defend-only shell keeps the built rules in `defend_only()`. Its id is `<full_id>_defend`. Its done prefix is the doubled `episode_<id>_defend_defend_`. `strings.brief` comes from `_defendOnly.brief`, and `defend.stage` is `None`. **The flip strings that `defend_only()` pops are exactly these seven** (as in `gen_e6_e7_shells.py`): `flipHeading`, `flipIntro`, `flipDefenderLine`, `flipNoSend`, `flipMissed`, `flipPageIntro`, `flipCallIntro`. `flipMissedHeading` and `flipLandedNoTells` are **not** popped; they are harmless in a defend-only shell (never shown, no flip stage) but carry over, so do not describe the defend-only shell as having "no flip strings". `flipAftermath`, `stepLabels`, `flip.mode` and `flipMontageByChoice` are episode-level or erb-only and are never in the fragment the generator reads, so the defend-only shell never carries them.
- For reference, a check role (built by the check-forms generator, not this one) uses `check()` with mission names `awareness_{pre,post}_<role_word>_{ab,ba}`, `exportGlobals` on the pre shell and `importGlobals` on the post shell. `PERMUTE` (above) and the `CHECK_LINES` entries belong with whichever generator builds the check shells.

**Check:** P0 steps 3 to 5, then compile the generated ink (`./scripts/compile-ink.sh awareness_eN_<slug>_defend`) and validate each new shell with `--strict-social`. Expected: no-change runs are byte-identical, and each new shell validates.

## P5. Room, host and lighting wiring (`AW/training_room.py`)

### P5a. An existing company (Quayholt, Tarrowby, Merrin & Sallow, Brightwell)

Nothing to build. The generator calls `training_room.room_fields(company)` and `training_room.scenario_lighting(company)`. For the hand-authored full erb, print the same fields and paste them:

```
python3 AW/training_room.py quayholt_insurance
```

The output gives `scenario.lighting`, `startPosition`, `host.position` and `rooms.training_room` (`type`, `chatBackground`, `lighting`). Expected: it matches E3's or E5's erb for Quayholt. The script does **not** print the room's other keys: copy `door_sign` (`"Training Room"`) and `connections` (`{}`) for a one-room shell from the E5 room block as well, so `rooms.training_room` is complete. (E12 is the only episode with a real door, a second room and a non-empty `connections`: its kiosk room is still `training_room` (a P5a Merrin & Sallow room) and it adds a `lobby`; see P5c and ENG-05c.)

### P5b. A new brand's room (Carrholme Services for E11)

**Only E11 (Carrholme) needs P5b.** E17 uses the built Tarrowby company and room, so it is a P5a episode with no new room. **"Reuse an existing map" means no new layout.** Carrholme does not get a hand-drawn map; it gets its own branding through the existing room-gen scripts, over the **shared training-room skeleton** (`room_uni_seminar` plus `SKELETON_*` in `scripts/room_gen/build_aw_rooms.py`): the company's own floor and wall sheet, logo plate, report poster, accent and lighting. The inputs are the accent hex and the two-line wordmark from the brand set (step 1). P5b and E11 §5 must say the same thing: E11 points at P5b for the room work and adds no layout of its own. The company id follows the built pattern: `carrholme_services`, map type `room_aw_carrholme`, short key `carrholme`. Steps:

1. **Brand set first (P11).** You need the accent hex and the two-line wordmark before you can draw anything.
2. **`scripts/room_gen/make_aw_tileset.py`:** add `"room_aw_carrholme": (<back wall rgb>, <side wall rgb>, hexrgb("<accent>"), <floor painter>)` to `SHEETS`. Reuse a floor painter that already exists (`CARPET_OATMEAL`, `vinyl_pixel`, `CARPET_BLUE`, `concrete_pixel`). The script has a fixed `OUT_DIR` and no `--out`, so it rewrites every company's sheet in place (you cannot point it at a scratch dir without copying the whole output tree). So: record the checksums of the existing `room_aw_*` PNGs first (`md5sum public/break_escape/assets/tiles/rooms/room_aw_*.png > SCRATCH/before.md5`, the real location; there is no top-level `assets/`), run the script, then `md5sum -c SCRATCH/before.md5` and confirm every existing sheet is unchanged and only `room_aw_carrholme.png` is new. Restore any existing PNG that changed with `git show HEAD:<path> > <path>`.
3. **`scripts/room_gen/make_aw_props.py`:** add `"carrholme": ("<accent>", ("CARRHOLME", "SERVICES"), <mark function>)` to `COMPANIES`. Reuse a mark function that exists, or add one small `mark_*` function in the style of `mark_chevron`. It writes the PNGs `aw_logo_carrholme1` and `aw_poster_report_carrholme1` into `public/break_escape/assets/objects/` but **does not register them** (its own docstring: "they are registered with `register_object.py --wall`"). Confirm that only the new files changed, as in step 2.
3a. **Register the two wall props: `python3 scripts/room_gen/register_object.py --wall aw_logo_carrholme1 aw_poster_report_carrholme1`** (run `--dry-run` first: `register_object.py --dry-run --wall aw_logo_carrholme1 aw_poster_report_carrholme1`). Without this, step 4's `build_aw_rooms.py` cannot place the logo and poster (their tiles are not in the reference tilesets, so `room_edit.py`'s `ensure_sprite` fails), and even if forced they would never preload in the game. `register_object.py --wall` edits **five** places (its docstring lists them): `scripts/room_gen/catalog.json`, `scripts/room_gen/tilesets_ref.json`, `public/break_escape/assets/rooms/objects_hospital_extras.tsx`, `public/break_escape/js/core/game.js` (the `this.load.image('aw_logo_carrholme1', ...)` / `aw_poster_report_carrholme1` loads, inserted after the last extras-tile load), and `scripts/generate_rooms.py` `WALL_MOUNTED_EXTRAS` (so the validator treats them as back-wall items). **Check it ran:** `grep -n "aw_logo_carrholme1" scripts/room_gen/catalog.json scripts/room_gen/tilesets_ref.json public/break_escape/assets/rooms/objects_hospital_extras.tsx public/break_escape/js/core/game.js` and `grep -n "aw_logo_carrholme1\|aw_poster_report_carrholme1" scripts/generate_rooms.py` each return a hit; the tool also prints `{name}: tile {tid}, gid {...} (wall)` per prop. So the prop loads in game.js and the `WALL_MOUNTED_EXTRAS` edit are made here, not in step 5. Because this edits shared files (`game.js`, `generate_rooms.py`, `catalog.json`), re-read each just before and confirm `git status` shows only these five plus your new PNGs/tiles changed.
4. **`scripts/room_gen/build_aw_rooms.py`:** add `"carrholme": [ ... ]` to `COMPANY_OPS`, starting from the Quayholt list minus its company props (`aw_quayholt_queue1`). Build with `python3 scripts/room_gen/build_aw_rooms.py carrholme`, then `python3 scripts/room_gen/build_aw_rooms.py --check`. Expected: `room_aw_carrholme.json` and `.tmj` are written, and `--check` prints `same` for all five maps.
5. **`public/break_escape/js/core/game.js`:** add the **tilemap and tile-sheet** loads beside the four existing pairs (around lines 145 and 241, the `room_aw_merrin_sallow` loads):
   `this.load.tilemapTiledJSON('room_aw_carrholme', 'rooms/room_aw_carrholme.json');` and `this.load.image('room_aw_carrholme', 'tiles/rooms/room_aw_carrholme.png');`. (The `aw_logo_carrholme1` / `aw_poster_report_carrholme1` object-image loads were already added by step 3a's `register_object.py`; do not add them again.)
6. **`scripts/scenario-schema.json`:** add `"room_aw_carrholme"` to the room `type` enum after `"room_aw_merrin_sallow"`. Update the comment in `scripts/generate_rooms.py` (around line 4688), which lists the `room_aw_*` types.
7. **`AW/training_room_lighting.json`:** add a `carrholme_services` entry shaped like `quayholt_insurance`'s (`mood`, `scenario`, `room`), but **drop Quayholt's `aw_quayholt_queue` light emitter**: that emitter lights a Quayholt queue prop that Carrholme does not have (step 4 builds Carrholme's `COMPANY_OPS` from the Quayholt list minus `aw_quayholt_queue1`), so a copied emitter would point at an absent object. Keep only the room/mood fields. The lighting skill (`mission-room-lighting`) reviews it later.
8. **`AW/training_room.py`:** add `'carrholme_services': {'type': 'room_aw_carrholme', 'chatBackground': ''}` to `ROOMS`. `room_fields()` leaves `chatBackground` out while it is empty. The POV background comes later (P13, `room-pov-background`).
9. **`AW/apply_training_room.py`:** nothing to add. `--refresh` finds every `scenarios/awareness_*` shell by glob. Run it only as `--refresh SCRATCH/out` (P0), never in place.

**Check:** `python3 AW/training_room.py carrholme_services` prints the new fields. A new shell using the room validates. A quick browser load of the shell on :3001 shows the room with the kiosk in its slot and the host at 5.5, 3.8 (`playtest-scenario` skill, one screenshot). Look at the screenshot yourself.

### P5c. A second room for E12 (the Merrin & Sallow lobby)

**Only E12 needs P5c.** E12 breaks the one-room, no-doors frame: it has the kiosk room **and** a lobby the attack is played in (`02_ENGINE_WORK.md` ENG-05a, ENG-05c). This recipe adds the lobby map and states the room naming the awareness tooling depends on.

1. **The kiosk room id stays `training_room`.** Name E12's kiosk room `training_room` (its map type is the built `room_aw_merrin_sallow`, a P5a room, so no new sheet for it) and the second room `lobby`. The scenario top-level `startRoom` is `training_room`; `world.startRoom` (ENG-05a) equals it. **This is required so `apply_training_room.py --refresh` (the P13 lighting stage) still works.** `--refresh` globs `scenarios/awareness_*` and reads `rooms.training_room.type` unguarded (`AW/apply_training_room.py:204`); a shell whose kiosk room is not `training_room` raises `KeyError`. `refresh_text` (`:159-196`) then re-splices **only** `rooms.training_room`'s lighting, chatBackground and host position, by text anchors. So: keep the kiosk room named `training_room`, and place the `training_room` block **before** the `lobby` block in the erb so the room-lighting anchor (`'      "lighting": '`) resolves to `training_room`. `--refresh` leaves the `lobby` block untouched (it re-splices `training_room` only); light the lobby by hand in the lighting stage if wanted. Both E12 shells use `training_room`, so the full and defend-only shells agree on the kiosk room id.
2. **Build the lobby map `room_aw_merrin_lobby`** by the P5b steps, with these differences:
   - **Skip step 2** (`make_aw_tileset.py`) and **step 3/3a** (`make_aw_props.py` / `register_object.py`): the lobby reuses the existing Merrin & Sallow tile sheet (`public/break_escape/assets/tiles/rooms/room_aw_merrin_sallow.png`) and adds no company props.
   - **Step 4 (`build_aw_rooms.py`):** add a `merrin_lobby` layout dressed as a reception/lobby (desk, entrance, a badge door to `training_room`), with **no kiosk or host slot** (those live in `training_room`). Build with `python3 scripts/room_gen/build_aw_rooms.py merrin_lobby`, then `--check` prints `same` for every map including `room_aw_merrin_lobby`.
   - **Step 5 (`game.js`):** add the `room_aw_merrin_lobby` tilemap load beside the others; the tile-image load reuses `room_aw_merrin_sallow.png` (no new PNG).
   - **Step 6:** add `room_aw_merrin_lobby` to the schema room `type` enum and to the `generate_rooms.py` type comment.
   - **Step 7 (lighting):** add a lobby entry only if the lighting stage wants it; `--refresh` does not touch it.
   - Do not hand-draw a map. The locked badge-door keys (`locked`, `lockType`, `requires`, `keyPins`) on `training_room` and the lobby NPC's `unlockable` are in ENG-05c.

**Check:** `python3 scripts/room_gen/build_aw_rooms.py --check` prints `same` for every map; `python3 scripts/check_door_alignment.py scenarios/awareness_e12_visitor_tailgater/scenario.json.erb` exits `OK`; `python3 AW/apply_training_room.py --refresh SCRATCH/out` writes both E12 shells with no `KeyError` (because the kiosk room is `training_room`).

## P6. The shared rule of thumb (`AW/awareness_deploy.py`) and its test

- Generated shells get the rule from `awareness_deploy.awareness_block()`. The hand-authored full erb carries the same literal (P2). Never change the text.
- `test/js/social-awareness-rule-of-thumb.test.mjs` asserts that every `scenarios/awareness_*` folder carries the identical `social.awareness.ruleOfThumb`, **and that there are exactly 38 such folders** (`assert.equal(shells.length, 38, ...)`). Each new shell changes that count. Either update the number in the same change that adds the shells (each new episode adds 2 folders, E17 adds 1, and each new check role adds 4), or land ENG-09d first, which replaces the bare number with a checked list.

**Check:** `node --test test/js/social-awareness-rule-of-thumb.test.mjs`. Expected: pass, with the new total.

## P7. The parity test and its allow-list

`test/js/social-awareness-fragment-erb-parity.test.mjs` compares the fragment with the full erb for `awarenessEpisode.strings`, `awarenessEpisode.debrief` and the episode triage set (set-level keys and every message by id), after stripping `_` keys.

- Add the episode to `EPISODES`: `{ n: 8, dir: 'awareness_e8_<slug>' }`. The fragment path is built as `.../awareness/e${n}/defend.json`, so the folder must be `AW/e8/`. The template literal `e${n}` already gives `e10` for `n: 10`, so the path logic needs **no code change** to cover E10 to E17; ENG-09d's only job here is to add each new episode's row to this `EPISODES` list (and the count/allow-list guards below), not to change how `n` is formatted.
- **Allow-listed differences today:** `STRINGS_VALUE_EXEMPT` (`defendIntro`, `conceptPanel`), `STRINGS_ERB_ONLY_OK` (`conceptPanel`, `flipCallIntro`, `flipPageIntro`, `voicePanel`, `defendIntro`, `flipDefenderLineByChoice`) and `SET_ERB_ONLY_OK` (`playerSentAuth`). A new erb-only string key needs a new entry with a one-line reason in the header comment. Engine packets put full-episode-only data outside `strings` where they can (for example `awarenessEpisode.flipAftermath` in ENG-01), so that no allow-list entry is needed.

**Check:** `node --test test/js/social-awareness-fragment-erb-parity.test.mjs`. Expected: one more passing test than before.

## P8. The validator

```
bundle exec ruby scripts/validate_scenario.rb scenarios/awareness_eN_<slug>/scenario.json.erb --strict-social
bundle exec ruby scripts/validate_scenario.rb scenarios/awareness_eN_<slug>_defend/scenario.json.erb --strict-social
```

- `--strict-social` makes any social error line (`SOCIAL:` with the error marker; this includes a schema error under `/social`) exit 1 (`README_scenario_design.md`, around line 2497).
- The awareness lints are in `scripts/validate_social/awareness.rb`. A full episode must use one of the stage orders `stage_orders('full', ...)` allows (today: `brief, osint, write, flip, defend, debrief`, with `build` after `osint` and/or `mfa` after `write` or `flip`). A new attack stage needs ENG-08 first. An episode set holds 4 to 8 messages (`EPISODE_MESSAGES`); a check form holds exactly 10 (`CHECK_MESSAGES`).
- Run once without `--no-graph --skip-ink` on your own shells, so the ink compiles and `dungeon_graph.*` is refreshed. Run with them on anyone else's.
- The CI job (`.github/workflows/ci.yml`, "Validator over scenarios with a social key") finds every scenario with a `social` key by itself, so the new shells are covered without a list edit.

Expected: exit 0, with no `SOCIAL:` error and no unexplained warning.

## P9. The bridge: `tools/playtest/se/bridge-eN-full.jsonl`

A bridge is a JSONL script for `.claude/skills/playtest-scenario/scripts/playtest-session.js`. It asserts with `{"cmd": "eval", "fn": "() => <boolean>"}` lines, and `check-bridge.mjs --expect` fails the run if any eval is not exactly `true` or if fewer evals ran than the script holds.

**Copy** the bridge of the episode you copied in P2: `bridge-e1-full.jsonl` (mail), `bridge-e3-full.jsonl` (call and MFA), `bridge-e5-full.jsonl` (build). Keep its skeleton:

1. `{"cmd": "note", "message": "RUN"}` and `{"cmd": "bootstrap", "tutorial": "decline", "resume": "new", "autoBrief": true}`;
2. an eval that the state global is `{}` and the done global is `false`;
3. `moveToNear` and `interact` on `training_kiosk`, then `waitFor` the minigame `episode-runner`;
4. for each stage: an eval on `getTestState().episode` (`id`, `variant`, `stage`, `done`), the `clickText` on the stage button (the button labels are in `STAGE_COPY` in `episode-runner-minigame.js`: "Open the browser", "Open the mail client" and so on), the child's `waitFor`, the driving eval, and `Escape` or the child's own close;
5. the flip eval: `.aw-flip` is present and the expected tells are listed (`.aw-tell[data-flag=...]`);
6. the defend round: start `.tri-start`, a plan of `[messageId, verdict, flags]` played through the triage test hooks, then an eval that `triage.step === 'result'`;
7. `waitFor` the global `episode_<id>_defend_done` set to `true`; an eval on the debrief (`.aw-card`, `.aw-monday`, `.aw-no-blame`, a record in `se_awareness_records`); `clickText` "Finish"; `waitFor` both tasks;
8. the closing eval that no `minigame_failed` event fired after the `RUN` note; then `sync`, `drain` and `quit`.

Change every id (episode, globals, set, messages, selectors) to the new episode's. Drive OSINT by clicking the site's own `data-id` and `data-focus` selectors, as E1 does, never by setting globals.

**Register and run it:**

- Add `eN-full:awareness_eN_<slug>` to the `JOBS` array in `tools/playtest/se/run-suite.sh`, beside `e7-full:awareness_e7_voice_ceo`.
- Run it alone: `ONLY="eN-full" tools/playtest/se/run-suite.sh tmp/se-eN` (it starts the keyless server on :3001 if needed, makes a fresh game with `tools/playtest/new-game.rb` and scores the log). Use Node 24: `NODE=$HOME/.cache/ms-playwright-go/1.57.0/node` on the user's machine.

**Check:** `tmp/se-eN/table.md` shows `| bridge-eN-full | awareness_eN_<slug> | <id> | n/n | PASS |`. Then run the seven built bridges one at a time (`00_README.md` §8 step 5), to show nothing else moved.

## P10. TTS (only when the user asks)

Use the `tts-audio` skill, and only once the episode's dialogue is signed off and the user agrees to the cost. List every voiced line first (`scripts/ink_runtime_check/voicelines.mjs` exists for this). No printed variables in voiced lines. Draft playtests run on the keyless :3001 server, which generates no audio.

## P11. The brand set entry (`AW/BRAND_SET.md`)

- **Existing company:** add an "Additions from EN (date)" section at the end, in the style of "Additions from E6 defend (2026-10-22)": new cast (name, role, age, background, as the cast-diversity rule asks), new domains and look-alikes (the learnable shapes only: a swapped character, an added hyphen, an added word; no homographs) and the name-clash search you ran.
- **New company (Carrholme only; E17 stays on built Tarrowby):** add a row to the §2 roster table (id, company, domain, look-alikes, `logoText`, accent hex, what it is, episodes), a §3 cast subsection, and a note that the name needs a web search for a real business before release.
- **Name-clash search:** grep each new surname across `scenarios/`, `planning_notes/` and `docs/` and record the result. The lab's brands stay in the lab.

**Check:** `grep -rn "<surname>" scenarios planning_notes docs | grep -v BRAND_SET` returns only the new episode's own files.

## P12. Mission ordering, collection and the two seeded Hacktivity courses

**This is the single home of the seeding instructions.** Every episode spec points here for how a new episode joins the two seeded courses and does not repeat the steps. In particular, seeding is **not** done through `awareness_deploy.py`: that script holds only the shared rule of thumb (`AWARENESS_RULE_OF_THUMB_TEXT` and `awareness_block()`) and no course logic, so an episode spec that says "seed through `awareness_deploy.py`" is wrong. The seeding happens in the Hacktivity repository (below).

**In Break Escape:** `mission.json` `"collection": "training"` puts the mission in the training collection when `db/seeds.rb` loads the scenarios (`bin/rails db:seed` reads every `scenarios/*/mission.json`). There is no order field in `mission.json`. The organiser orders missions in Hacktivity.

**In Hacktivity (feature level only; the implementer reads the Hacktivity code directly):** Hacktivity is a **separate private repository, `cliffe/hacktivity`**, not part of this checkout; attach it with `add_repo` before starting. Two courses were seeded for aw7, one with the defend-only episodes and one with both versions (HANDOVER status block: Hacktivity f8b4ad9e). Each new episode must be added to both:

- the defend-only course gains `awareness_eN_<slug>_defend`;
- the both-versions course gains `awareness_eN_<slug>` and `awareness_eN_<slug>_defend`;
- **E17 is the exception:** it has only `awareness_e17_<slug>_defend`, and that one shell is listed in both courses;
- the new check missions (the `general_v2` and `data_conduct` pairs) are **not** added to either seeded course; they are separate pre and post missions, placed as the built checks are.

Before changing anything, the implementer reads how E6 and E7 were seeded and copies that exactly: the same seed mechanism, the episode order, and the organiser guidance text. The user's 2026-10-27 decision ("joins both seeded Hacktivity courses") covers adding the new episodes. Any other Hacktivity change, including WP-02, needs its own go-ahead. Do not write Hacktivity paths, endpoints or credentials into this repo.

**Check:** in a Hacktivity development instance, both courses list the new shells in episode order, and each opens and plays on its first stage.

## P13. Review and playtest stages (the AGENTS.md loop, as it was run for awareness)

Run these after P1 to P9 are clean, in this order. Each round uses a fresh reviewer, a fixer resumed between rounds, and a severity table in the episode's log. Stop when a round finds nothing above minor, at five rounds at most (AGENTS.md "How a round works").

| Stage | Skill | Agent | Notes |
|---|---|---|---|
| Design review | `scenario-design-review` | opus48 reviewer, Sonnet or opus48 fixer | as `AW/DESIGN_REVIEW_C1.md` to `C3`; checks topic boundaries against `../00_COURSE_OVERVIEW.md` |
| Dialogue review | `npc-dialog-review` | opus48 | as `AW/DIALOG_REVIEW_C1_A.md` to `C5`; snapshot the ink first so `tagdiff.mjs --old` proves the structure; keep a list of changed voiced lines |
| Light puzzle-chain pass | `mission-puzzle-chains` (gating only) | Opus | as the built pass; mainly for E12, which has a door and a world stage |
| Room dressing (new rooms only) | `mission-room-dressing` | Opus reviewer, Sonnet fixer | as `AW/ROOMS_REVIEW_C1.md` to `C3`; fixes go through `build_aw_rooms.py` and `make_aw_props.py` |
| Lighting (new rooms only) | `mission-room-lighting` | as the skill says | edits `training_room_lighting.json`, then `apply_training_room.py --refresh` into scratch (P0) |
| POV background (new rooms only) | `room-pov-background` | as the skill says | last of the art stages; sets `chatBackground` in `training_room.py` |
| Playtests | `playtest-scenario` | Sonnet | full and defend-only shells, 10 to 15 minute runs, one with a mid-episode reload, then a blind run; `tools/playtest/verify-run.rb` must show progress; as `AW/playtests/P1_*` to `P2_*` |
| Characters | `pixellab-character-pipeline` | after 3 Nov, with the user's approval | placeholder stock sprites until then |
| Audio | `tts-audio` | only when the user asks | P10 |

Log every round in the episode's log, every design decision in `AW/DESIGN_LOG.md` and every dialogue round in `AW/DIALOG_LOG.md`, as HANDOVER §4 says.
