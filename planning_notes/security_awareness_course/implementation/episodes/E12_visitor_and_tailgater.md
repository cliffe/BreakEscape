# E12, Visitor and tailgater

Implementation brief for a Sonnet agent with a fresh context. Follow it exactly. Use the real keys
quoted here; do not invent config. Where a key does not exist yet, this brief names the engine packet
(`02_ENGINE_WORK.md`) that adds it and states the config E12 needs from it.

---

## 1. Goal and module(s)

Teach **core_10 (physical security)** and the **in-person half of core_02 (social engineering beyond
email)** as one attack-then-defend episode at a fictional architecture practice. The attack half is the
first awareness episode played **in the game world** (not entirely at the kiosk): the learner, on an
authorised red-team day, puts on a hi-vis courier costume, carries a parcel, walks the lobby, and talks
the front-of-house coordinator into buzzing them through the badge door with an **in-person pretext**
(person-chat on the influence bar, exactly as E3 does by phone). The defend half puts the learner on the
reception desk, where they challenge politely, verify and escort visitors, and report.

Teaching source of truth: `modules/core_10_physical_security/concepts.md` (physical) and
`modules/core_02_social_engineering_beyond_email/concepts.md` (the in-person pretext and the shared
"check back on a route you trust" habit). `concepts.md` wins over `game_design.md` where they differ.

This episode's scope is cut hard to fit ~15 minutes (section 6). The full `core_10` game_design draft
(RFID badge-clone, lockpicking, spot-the-risk drill, MG-25 document inspector, five rooms) is **not**
built here; its content is reduced to one in-person pretext and a six-item reception triage.

## 2. Read first (exact paths)

- `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md` (engine packet ids; spec layout).
- `modules/core_10_physical_security/concepts.md`, `modules/core_02_social_engineering_beyond_email/concepts.md`.
- `modules/core_10_physical_security/game_design.md` (content draft; reparent to Merrin & Sallow).
- Built nearest-neighbour episodes:
  - `scenarios/awareness_e3_helpdesk_reset/scenario.json.erb` and `ink/leila_servicedesk.ink`,
    `ink/darren_price.ink`, the pretext-call pattern, the influence bar (`social.characters`,
    `social.pretextNpcs`), the triage `call` kind, the host NPC with the done-event mapping.
  - `scenarios/awareness_e7_voice_ceo/scenario.json.erb`, the full `awarenessEpisode` block, the
    `triageSets` entry with directly-authored non-email items, `strings`, `debrief`.
- `planning_notes/phishing_and_social_engineering/designs/11_awareness_product_episodes.md`
  (defend-set rules §4, host NPC + flushed done event N16, defend-only variant §3.1/§5.1).
- `planning_notes/phishing_and_social_engineering/designs/06_pretext_dialogue_system.md` (the pretext
  judge, techniques, thresholds, asks).
- `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` §2 (shared tell
  library), §8 (influence), §11 (the awareness-episode block, strings keys).
- `awareness/BRAND_SET.md` (Merrin & Sallow entry and E4 cast; the "Gallagher is not used" note).
- Engine: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS`,
  `writeKind`, `childLaunch`, and the call watcher in `episode-runner-minigame.js`),
  `public/break_escape/js/minigames/pretext-prep/pretext-prep-minigame.js` and `pretext-card.js`
  (`callLaunch` picks person-chat for a `person` NPC), `public/break_escape/js/minigames/person-chat/
  person-chat-pretext.js`, `public/break_escape/js/utils/player-avatar.js`,
  `public/break_escape/js/utils/npc-lookalike.js`, `public/break_escape/js/systems/apply-actions.js`
  (`unlock_door`), `public/break_escape/js/systems/npc-game-bridge.js` (`unlockDoor`),
  `public/break_escape/js/minigames/helpers/chat-helpers.js` (`# unlock_door`, `# trigger_minigame`).
- Rooms: `scripts/room_gen/build_aw_rooms.py`, `planning_notes/phishing_and_social_engineering/
  awareness/training_room.py`, `apply_training_room.py`.

## 3. Depends on

| Packet | What E12 needs from it |
|---|---|
| **ENG-05a** (world-play attack modifier) | The whole attack half: the `world` modifier on the call `write` stage places the player in the lobby in the costume before the pretext and reverts on the flip, handing back through the built `watchCall` (no `#trigger_minigame`). With ENG-05b (costume, aw9), ENG-05c (lobby, door, NPC door opening), ENG-05d (parcel sprite art). Precise needs in section 9.1. |
| **ENG-08** (schema and validator) | Accept the `awarenessEpisode.world` block (`room`, `startRoom`, `costume`); accept a lobby room type and a locked connection between `lobby` and `training_room`; keep the N16 host-NPC lint happy for a two-room shell. The four scenario-local tells (section 11) need **no** library change: the validator already accepts a `channelTells` id that `flagChips` labels and that is not a factor, so they are declared on the set, not added to ENG-08's shared library. |
| **Check forms (no engine packet)** | E12 does not get its own check form. Its one message-triage-friendly pretext item sits in the shared `general_v2` pair (`10_CHECK_FORMS.md`); section 14. |
| (existing) | The pretext call path (`write` stage with `attack.callId`, pretext-prep → person-chat), the influence service, the triage `call` kind, the host-NPC done-event mechanism (N16), and `watchCall` (`episode-runner-minigame.js:760`) for the flip hand-back. No change needed; cited so the implementer reuses, not rebuilds. |

Build order: **E12 needs
ENG-05a, ENG-05b, ENG-05c and ENG-08 before it is wired; it does not need ENG-05d (parcel art, baked into
the costume sprite and not a wiring prerequisite), ENG-05e (the optional `#trigger_minigame`, since the
hand-back reuses `watchCall`) or ENG-09c.** If ENG-05a slips, E12 cannot ship: the attack half has no
fallback (unlike E3, whose phone pretext is already built). The parcel art (ENG-05d) can follow; E12 is
wired and bridged with the stock costume sprite and gets the baked-in parcel later.

## 4. Owner models

- Content writing and review: `opus48` (phishing / social-engineering content).
- Engine packets ENG-05a (with 05b to 05d) and ENG-08: general-purpose or Sonnet. The check-form item
  E12 feeds is built as part of `10_CHECK_FORMS.md` (no E12-specific engine packet).
- Shell wiring (this spec), ink, strings: Sonnet following this brief.
- **Content gate.** Section 8b (all shell and generator metadata), section 11's six `call` items as
  final JSON, and the section 10 flip strings are the content the `opus48` writer completes before any
  P2 shell wiring starts; a Sonnet implementer invents nothing from them.

## 5. Company, room and host

- **Company:** Merrin & Sallow Architects, a London architecture practice (`BRAND_SET.md` roster).
  `brand` block: `{ "name": "Merrin & Sallow Architects", "logoText": "MERRIN & SALLOW", "accent": "#8a5a2b" }`.
  Domain `merrinsallow.example`; look-alikes `merrin-sallow.example`, `merrinsallow-studio.example`.
- **Two front-of-house NPCs.** An NPC is
  declared inside exactly one room (`scenario-schema.json`: `rooms[].npcs`), and a `person` pretext NPC
  is resolved as a placed world NPC via `cfg.channels.person` (`episode-runner-minigame.js:640`). The
  lobby pretext target must therefore be a world NPC in the **lobby**, while the kiosk host that carries
  the brief, the per-item feedback and the N16 done-event `eventMappings` is a world NPC at the kiosk in
  the **studio**. One NPC record cannot be in both rooms, so E12 uses two front-of-house people:
  - **Lobby pretext mark:** **Delphine Arvanitis**, Front-of-House Coordinator, 50s, Greek-Cypriot
    British, fifteen years on the desk. Address `reception@merrinsallow.example`. She is the person the
    courier talks past and who buzzes the door (`character: "delphine"`, section 9.3); she does **not**
    carry the brief or the done event.
  - **Studio kiosk host:** **Lorna Easton**, Reception & Facilities Lead, 40s, white, north-west England.
    Address `lorna.easton@merrinsallow.example`. She welcomes the learner, reads the scope, carries the
    per-item feedback and the debrief, and holds the N16 conclusion `eventMappings`. Both are
    front-of-house, so either satisfies the brief's "host: a front-of-house staff member", and the "con
    one front-desk colleague, then do the front-desk job yourself" empathy structure holds.
  - **Art load (stated explicitly; this episode costs more than a one-NPC episode).** E12 needs, behind
    the PixelLab queue: (1) **the hi-vis courier costume** sprite `aw_hivis_courier_v2`, with the parcel
    **baked into its `walk` and `breathing-idle` frames** (no separate carry animation, section 9.1
    item 2), plus the costume talk portrait `aw_hivis_courier_talk.png`; (2) **Delphine Arvanitis**, the
    lobby pretext mark, who needs a person-chat portrait/bust for the influence conversation and a world
    sprite placed in the lobby; (3) **the new lobby map** `room_aw_merrin_lobby` (section 5 rooms,
    ENG-05); and (4) **Lorna Easton**, the studio kiosk host. That is two new M&S character art sets,
    one costume, and one map, which is a larger budget than the other episodes (a single reused room and
    a single reused host). Flag the tally to the orchestrator for the art schedule.
  - **Lorna Easton can reuse an existing sprite (to save one art set).** The kiosk host only needs a
    world sprite and a talk portrait for the welcome and debrief; she does **not** carry a person-chat
    influence conversation (that is Delphine's), so she needs no influence bust. So Lorna reuses a built
    sprite rather than a new walk atlas: take a built M&S / office-worker host sprite and talk portrait
    already in `assets/characters/` (for example a built Merrin & Sallow cast sprite that is not a named
    on-screen mark here) as Lorna's placeholder, saving a full character art set. **Delphine cannot**
    reuse in the same way: as the pretext mark she needs a distinct person-chat portrait. So the true
    new-character art cost is **one** set (Delphine) plus the costume, not two. Confirm the chosen reuse
    sprite with the art schedule; the name Lorna Easton stays either way.
  - **Clash check (done 2026-10-28):** `Arvanitis`, `Delphine`, `Easton` and `Lorna` have no conflicting
    hits in `scenarios/`, `planning_notes/phishing_and_social_engineering/`, `docs/` or
    `public/break_escape/js` (`Easton` and `Lorna`: zero hits on 2026-10-28). Neither reuses the retired
    `core_10` draft name **Maureen Gallagher**; `BRAND_SET.md` bars `Gallagher` ("clashes with an
    existing scenario"). Both are new M&S cast members, distinct from the E4 M&S cast (Catherine Merrin,
    Tomás Carvalho, Yasmin Chaudhry, Julian Sallow, Thandiwe Moyo, Oskar Berglund, Leah Abramson).
- **Red-team lead (brief and debrief framing):** **Jo Fairweather**, Northlight Security, the
  authorised ethical social engineer who recurs as the course's red-team persona across the module
  `game_design.md` files (consistent use, not a clash). She frames the attack as an authorised test and
  carries the "what would have stopped me" line. She appears only in the seeded brief and strings, not
  as a world NPC, to keep the cast small.
- **Genuine visitors in the defend set** reuse one existing M&S client firm as a client and invent one
  `.example` contractor and one fire-safety firm (section 11). Pre-ship: web-search "Arvanitis",
  "Easton", "Northlight Security", and the invented firms for a real business of the same name.
- **Rooms:** two. **The kiosk room is named `training_room`** (not `studio`), because every awareness
  tool and bridge assumes `rooms.training_room` (for example `apply_training_room.py` reads
  `rooms['training_room']['type']` unguarded, so `--refresh` crashes on a shell with no `training_room`
  key), and the generated defend-only shell uses `training_room` too, so full and defend-only must agree.
  The design-studio fiction is carried by the room's `door_sign` ("Studio"), not by the room id.
  - `training_room` (the design-studio room: the defend seat and the kiosk, and Lorna the kiosk host):
    map type `room_aw_merrin_sallow`, built by `build_aw_rooms.py` and wired by `training_room.py`
    (`merrin_sallow` entry, `chatBackground: assets/backgrounds/rooms/aw_merrin_sallow_blended.png`).
    Reuse unchanged. **This is the scenario `startRoom`** (section 9.1 item 3), so the learner spawns at
    the kiosk and can always start the episode.
  - `lobby` (the attack world-play, where Delphine is): a **new** reception/lobby map,
    `room_aw_merrin_lobby`, with a reception desk, the entrance, and a badge door to `training_room`.
    Added as a new entry in `build_aw_rooms.py` (ENG-05c owns the build recipe, following 01 P5b's steps
    for a new map type). Owned by ENG-05 (section 9.1). Cast diversity and props follow `ROOMS_REVIEW`
    conventions.

## 6. Timing budget per stage (~15 minutes)

| Stage | Minutes | Note |
|---|---|---|
| brief | 1.5 | Jo's authorised-test framing; scope; the hi-vis costume handed over. |
| osint | 2.0 | 3 facts on a stripped M&S "Visit us" page that make the courier pretext work. |
| write (world-play attack) | 4.5 | Costume + parcel, walk the lobby, in-person pretext on the influence bar, the desk buzzes the door. |
| flip | 0.5 | The con replayed as Delphine experienced it, with the lines that worked. |
| defend | 5.0 | Six reception `call` items, Verify on, immediate feedback. |
| debrief | 1.5 | Concept panel, Monday card, no-blame, the module line, the habit to keep. |
| **Total** | **15.0** | |

**If it overruns** (the world-play attack is the risk): cut the **osint** stage and move its three
facts into the brief as given context (Jo tells the learner what is public). That saves ~2 minutes and
leaves ["brief","write","flip","defend","debrief"]. Do not cut the defend set below six items or drop a
mirror pair; measurement and aw5 depend on them.

## 7. Stages (runner stage ids)

Full episode: `"stages": ["brief","osint","write","flip","defend","debrief"]` (all ids are in
`STAGE_IDS`, `episode-model.js:27`). `write` is the attack: because `attack.callId` is set,
`writeKind(episode)` returns `'call'` (`episode-model.js:166`), so the runner opens **pretext-prep**,
whose Begin opens **person-chat** (the pretext NPC is `npcType: "person"`, so `callLaunch` picks
`person-chat`, `pretext-card.js:240`). ENG-05 wraps this so the pretext is played in the lobby world
(section 9.1). `conclusionTaskId` is the defend task.

Defend-only variant: `"stages": ["brief","defend","debrief"]` (the runner drops attack stages for a
`defendOnly` variant whatever is authored, `episode-model.js:68`).

## 8. Brief and scope note (host's draft lines; dialogue reviewer polishes)

- `strings.brief` (full): "You're on an authorised exercise at Merrin & Sallow Architects, a fictional
  London architecture practice. First you're on the red team with Jo Fairweather of Northlight Security,
  who the practice has hired to test the building. You'll pull on a hi-vis jacket, pick up a parcel, and
  see how far a friendly courier gets at the front desk. Then you swap seats: you're on reception
  yourself, and the same kinds of visitor arrive. Only the reception seat is scored. Nothing you do
  leaves the game."
- `scopeNote` (full): "Authorised exercise at Merrin & Sallow Architects, a fictional company. In scope:
  one practice approach to the front desk in a courier's hi-vis, and six visitors to handle on the
  reception seat. Jo's test is authorised and the costume is handed back afterwards."
- Seeded brief message (pattern from E7 `seededMessages[brief]`), from Jo:
  "This is Merrin & Sallow's red-team day. In scope: the lobby and the front desk. Pull on the hi-vis by
  the door, take the parcel, and try to get past reception to the studio without a badge. However it
  goes, you'll be on the desk next, with the same visitors. Jo Fairweather, Northlight Security."
- Ethics line (pretext-prep brief, `brief.ethics`): "Authorised test only. You never deceive a real
  person, and the costume comes off the moment you're through."

## 8b. Shell and generator metadata (every value final; no guessing)

Every metadata value the shell wiring and the generator need, as final strings, copying the two-aim
call-attack shape from the built **E3** (`awareness_e3_helpdesk_reset`)
and the generator shape from `gen_e3_e5_shells.py` (E12's defend-only shell is added to
`gen_e8_e17_shells.py` with the same field shape). E12 is a **call-attack** episode like E3 (not a
consequence flip), so it carries **two** aims.

### NPC and costume sprites

- **Delphine Arvanitis** (lobby pretext mark, `rooms.lobby.npcs[]`): `"id": "delphine_reception"`,
  `"displayName": "Delphine Arvanitis"`, `"npcType": "person"`, `"unlockable": ["training_room"]`,
  `"storyPath": "scenarios/awareness_e12_visitor_tailgater/ink/delphine_reception.json"`,
  `"currentKnot": "start"`. She needs a **new** person-chat portrait/bust (the influence conversation);
  world sprite and talk/viseme keys follow the E3 host-NPC shape (`<key>_v2` / `<key>_talk.png` /
  `<key>_visemes.png`), placeholder until the PixelLab queue produces her art.
- **Lorna Easton** (kiosk host, `rooms.training_room.npcs[]`): `"id": "lorna_easton"`,
  `"displayName": "Lorna Easton"`, `"npcType": "person"`,
  `"storyPath": "scenarios/awareness_e12_visitor_tailgater/ink/lorna_easton.json"`,
  `"currentKnot": "start"`, carrying the N16 done-event `eventMappings`. **She reuses a built sprite**
  (no influence bust needed): use a built Merrin & Sallow / office-worker host sprite and talk portrait
  already in `assets/characters/` as her placeholder, for example `"spriteSheet": "female_office_worker_v2"`,
  `"spriteTalk": "assets/characters/female_office_worker_talk.png"`,
  `"spriteVisemes": "assets/characters/female_office_worker_visemes.png"` (confirm the chosen built sprite
  with the art schedule; the name Lorna Easton stays either way). This saves one full character art set
  (section 5).
- **Hi-vis courier costume** (ENG-05b, under `world.costume`, section 9.1 item 1): sprite
  `aw_hivis_courier_v2` (parcel baked into `walk`/`breathing-idle`), talk portrait
  `assets/characters/aw_hivis_courier_talk.png`.
- **Learner avatar** (full erb `player`, as E3): `"spriteSheet": "female_office_worker_v2"`,
  `"spriteTalk": "assets/characters/female_office_worker_talk.png"`.

### Full-episode objectives (full erb `objectives[]`, copy the E3 two-aim shape)

| field | aim 1 (red team) | aim 2 (defend, `missionConclusion: true`) |
|---|---|---|
| `aimId` | `red_team_aim` | `reception_desk_aim` |
| `title` | "Run the front-desk pretext" | "Cover the reception desk" |
| `description` | "Put on the courier's hi-vis, carry the parcel, and try to talk the front desk into buzzing you through the badge door without a badge." | "Work through the visitors at the reception desk at the training kiosk." |
| `order` | 0 | 1 |
| task `taskId` / `title` / `type` | `run_front_desk_pretext` / "Approach the front desk as the courier" / `manual` | `work_reception_desk` / "Work through the reception desk" / `custom` |

Aim 2 `concludeRequires.globals`: `["episode_e12_visitor_tailgater_defend_done"]`. Aim 2
`conclusionScreen`: `{ "type": "success", "title": "Visitor and tailgater episode done", "body": "You've
tried the front desk in a courier's hi-vis, then sat on reception and handled the visitors yourself, so
this episode is finished." }`. `awarenessEpisode.conclusionTaskId: "work_reception_desk"`.

### Full-episode training kiosk (full erb `rooms.training_room.objects[]` kiosk, copy the E3 shape)

- `observations`: "A touch-screen training kiosk for the Merrin & Sallow visitor exercise: first the
  red-team brief and the front-desk approach, then the visitors to handle on the reception seat."
- `observationVariants[0]`: `{ "condition": "globalVars.episode_e12_visitor_tailgater_defend_done",
  "value": "A touch-screen training kiosk for the Merrin & Sallow visitor exercise. The approach is done
  and the reception desk is all handled." }`
- `minigameData.episodeId`: `e12_visitor_tailgater`.

### Full-episode `mission.json` (copy the E3 mission.json shape)

- `display_name`: "Awareness E12: Visitor and tailgater (full episode)"
- `description`: "An awareness episode of about 15 minutes for all staff. On an authorised exercise at
  Merrin & Sallow Architects, a fictional architecture practice, you first play the red team: in a
  courier's hi-vis you try to talk the front desk into buzzing you through a badge door. Then you swap
  seats onto reception and handle the visitors yourself. Only the reception seat is scored, and checking
  or reporting when you're unsure is always fine and never marked down."
- `difficulty_level`: 1; `scoring`: "completion"; `secgen_scenario`: null; `collection`: "training";
  `ui_theme`: "general"; `estimated_duration_minutes`: 15.
- `cybok`: `[ { "ka": "HF", "topic": "Human Factors", "keywords": ["Physical security", "Social engineering", "Security awareness", "Tailgating"] } ]`.

Top-level erb strings (copy E3's): `scenario_id` `awareness_e12_visitor_tailgater`; `scenario_name`
"Visitor and tailgater: both sides"; `scenario_brief` = `strings.brief` (§8); `endGoal` "Run the
front-desk pretext, then work the reception desk at the training kiosk."; `version` "1.0";
`disableAttacks` true; `startRoom` `training_room` (section 9.1 item 3); `startPosition` as E3.

### Defend-only shell: generator `EPISODES['e12']` entry (`gen_e8_e17_shells.py`, following the `gen_e3_e5_shells.py` `EPISODES` shape)

```python
'e12': {
    'frag': f'{AW}/e12/defend.json',
    'full_id': 'e12_visitor_tailgater',
    'role_word': 'general',
    'role_label': 'all staff',
    'defend_set': 'e12_reception_desk',
    'defend_host': 'lorna',
    # No 'forms'/'check_hosts': E12 feeds one item into general_v2, built by 10's own generator (§14).
    'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
               'keywords': ['Physical security', 'Social engineering', 'Security awareness', 'Tailgating']}],
    'defend': {
        'name': 'Visitor and tailgater: the reception desk',
        'brief': "You're on an authorised exercise at Merrin & Sallow Architects, a fictional architecture practice. You're covering the reception desk, and visitors arrive one at a time: some are expected, some are not, and one or two are trying to talk their way in. Handle each one, and check or report anyone who pushes past a check. Checking or reporting when you're unsure is always fine and never marked down.",
        'endGoal': 'Work the reception desk at the training kiosk.',
        'aim': ('reception_desk_aim', 'Cover the reception desk', 'Work through the visitors at the reception desk at the training kiosk.'),
        'task': ('work_reception_desk', 'Work through the reception desk'),
        'kiosk': ("A touch-screen kiosk showing the Merrin & Sallow reception desk: a handful of visitors to handle.",
         "A touch-screen kiosk showing the Merrin & Sallow reception desk. The visitors are all handled."),
        'display': 'Awareness E12: Visitor and tailgater (defend only)',
        'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Cover the reception desk at Merrin & Sallow Architects, a fictional architecture practice: some visitors are expected, some are not, and one or two are trying to talk their way in. Each answer is explained, and checking or reporting when you're unsure is always fine and never marked down.",
        'minutes': 8,
        'defendIntro': "Work through the visitors at the reception desk and decide what to do with each one. A genuine visitor never minds being signed in and escorted; the one who pushes to skip a check is the one to report. There's no clock on you here.",
        'conclusion': ('Reception desk handled', "You've handled the visitors at the reception desk and finished this episode."),
    },
},
```

The generator entry uses the real `gen_e6_e7_shells.py` keys (`conclusion`, `defendIntro`), not the
`ending` spelling of `gen_e3_e5_shells.py`; `01_PIPELINE.md` P4 lists the required keys once.

The host Lorna's generator `HOSTS['lorna']` entry (new in `gen_e8_e17_shells.py`, following the E6/E7
`HOSTS` shape; `defend_host: 'lorna'` above points to it):

```python
'lorna': {
    'id': 'lorna_easton', 'displayName': 'Lorna Easton', 'sprite': 'female_office_worker',
    'about': "Merrin & Sallow's reception and facilities lead, 40s, white, north-west England (BRAND_SET.md, E12 additions). The studio kiosk host: she welcomes the learner and receives the reports. Reuses a built sprite (no influence bust needed). Placeholder sprite until the PixelLab reset.",
},
```

The defend-only shell id is `e12_visitor_tailgater_defend`, prefix
`episode_e12_visitor_tailgater_defend_defend_` (§13). The defend-only `scopeNote`/`_defendOnly` strings
are in the fragment (§13).

### Defend-host lines: generator `LINES[('e12', 'defend')]` (the tuple `(before, after, choice, reply)`, Lorna's voice)

```python
('e12', 'defend'): (
    "You're on reception this morning. Visitors come one at a time: some are on the list, some aren't, and one or two will try it on. Take each as it comes, sign people in and escort them, and check or report anyone who pushes past a check.",
    "That's the desk cleared, thanks. The move that works for every pushy visitor is the same: check the list, escort them, and report anyone who won't be checked.",
    'Thanks, Lorna.', 'Any time.'),
```

### Host spoken lines for the full shell (ink, Lorna, the kiosk host)

- **Welcome** (at the kiosk): the §8 welcome framing (Jo sets the red-team scope in the seeded brief;
  Lorna welcomes the learner to the kiosk and the reception seat).
- **After the attack half** (on the hand-off into the defend half): "However that went at the door, now
  you're the one being asked. Same visitors, your desk. Sign people in, walk them up, and if someone
  won't be checked, that's your answer."
- **On completion** (defend done): "That's the desk done. A busy front of house that signs people in and
  walks them up stops nearly all of this; nobody's in trouble for slowing a pushy visitor down."

## 9. Attack half (the world-play pretext)

The one attack artefact is an **in-person pretext conversation** on the influence bar. It reuses the
built pretext machinery exactly as E3 does, but with a `person` NPC in a lobby room, plus the ENG-05
world dressing.

### 9.1 What ENG-05 must provide (config E12 needs)

ENG-05 is the "world-play attack stage" packet. E12 needs, as configuration on the `awarenessEpisode`:

1. **A hi-vis costume swap that respects aw9.** At the start of the attack the player's **world sprite
   and talk portrait** swap to a hi-vis courier; on leaving the attack (flip, or any early exit) they
   revert to `chosenPlayerSprite()` (`utils/player-avatar.js:26`), never to the scenario's
   `player.spriteSheet`. aw9 ("the chosen avatar always wins") means the costume is a **temporary
   override**, not a new chosen avatar: ENG-05 stores the pre-attack sprite and restores it, and
   `syncScenarioPlayer` (`player-avatar.js:55`) is called with the restored key so person-chat's
   self-view and the HUD agree. **The costume lives under `awarenessEpisode.world.costume`, not under
   `attack`** (02 ENG-05a change 1; the schema's `attack` is `additionalProperties: false` and has no
   `costume` key, so a costume under `attack` would fail `--strict-social`). Author the full `world`
   block and the call `attack` block once, as follows:

   ```jsonc
   "world": {
     "room": "lobby",                 // the room the in-world attack is PLAYED in
     "startRoom": "training_room",    // the room the learner STARTS and RETURNS to; equals the scenario startRoom (item 3)
     "costume": {
       "sprite": "aw_hivis_courier_v2",
       "talk": "assets/characters/aw_hivis_courier_talk.png"
     }
   },
   "attack": {
     "callId": "merrin_front_desk",   // makes writeKind return 'call' (section 7)
     "siteIds": ["merrin_site", "merrin_social"],
     "scored": false                  // the attack half is never scored (11 §4.1)
   }
   ```

   The two room fields match ENG-05a exactly: `world.startRoom` = `training_room` = the scenario's
   top-level `startRoom` (the kiosk room, where the learner starts and returns); `world.room` = `lobby`
   (the room the attack is played in, a temporary placement, never the scenario's `startRoom`). "Studio"
   appears only as a narrative description, never as a room id (item 3).
2. **A parcel the player carries.** There is **no stock "carry" animation**: the six house templates are
   `breathing-idle, walk, cross-punch, lead-jab, taking-punch, falling-back-death`
   (`.claude/skills/pixellab-character-animations/SKILL.md`), and the pipeline forbids `action_description`
   custom animations as off-model and costly. So "carrying a parcel" is **baked into the costume
   sprite's design**: `aw_hivis_courier_v2` is drawn holding a parcel across its `walk` and
   `breathing-idle` frames (made with the standard `pixellab_pipeline.py` route, parcel as part of the
   character, not as a separate animation state). This is an art note for ENG-05/PixelLab, not new
   engine code. (Hand edits go in `tools/pixellab_overrides/`, never on the atlas, CLAUDE.md.)
3. **A lobby room, a badge door, and the start-room flow.** `rooms.lobby`
   (type `room_aw_merrin_lobby`, section 5) connected to `rooms.training_room` (the kiosk room) by a
   badge door that starts **locked**. The scenario's top-level `startRoom` is **`training_room`**, so the
   learner always spawns at the kiosk and can start the brief; they never need to walk through the locked
   door (defend is played at the kiosk, section 20.3). The `world` modifier (item 1) places the player in
   `lobby` for the world-play attack only, via `window.loadRoom`; **on any `write` outcome (`got_it`,
   `reported` or `walked_away`) ENG-05a moves the player back to `training_room`** (again via
   `window.loadRoom`) before `watchCall` reopens the runner for the flip (item 5). So a failed con and a
   reload both land the learner at the kiosk, never stranded behind the locked door. The room-move half
   of the world modifier (the `window.loadRoom` calls) is owned by **02 ENG-05a**; E12 only authors
   `world.room` (`lobby`), `world.startRoom` (`training_room`) and the matching top-level `startRoom`.

   The locked badge door's keys follow `02` ENG-05c exactly: a room lock lives on the **room block being
   entered**, not on a connection, so the lock keys go on **`rooms.training_room`** (the studio the lobby
   opens onto), copied verbatim from m02's `security_office` room block
   (`m02_ransomed_trust/scenario.json.erb:3104-3122`):
   `"locked": true, "lockType": "key", "requires": "merrin_studio_badge", "keyPins": [40, 30, 55, 35],
   "difficulty": "easy"`. `requires` names a key id that **no object in the scenario holds**, so there is
   no key to pick up; the only in-fiction opener is Delphine buzzing the door (item 4). The learner is
   given no lockpick and never needs to traverse the door, so pickability does not matter here; the door
   is the attack's success/empathy beat, not a traversal puzzle. (The exact keys and the on-which-block
   placement are owned by `02` ENG-05c; this is E12's filled-in instance of them.)
4. **An NPC opening the door, reuse the existing mechanism, do not build a new one.** NPCs already open
   doors: an ink line carrying the tag `# unlock_door:training_room` is handled at
   `minigames/helpers/chat-helpers.js:71`, which calls `NPCGameBridge.unlockDoor(roomId)`
   (`systems/npc-game-bridge.js:77`); that server-validates the NPC's permission and then clears
   `doorProperties.locked` on every door sprite to the room (`:117-118`) and emits
   `door_unlocked_by_npc`. (`apply-actions.js:102` `unlock_door` is the action-list equivalent.) The
   server only honours the tag if the NPC record carries `"unlockable": ["training_room"]` (copy the m02
   guard's shape, `scenario.json.erb:3238` `"unlockable": ["security_office"]`); so **Delphine's NPC
   record (`delphine_reception`) must declare `"unlockable": ["training_room"]`**. On a successful
   pretext her ink speaks the buzzed-in line tagged `# unlock_door:training_room` and the door opens. The
   opening itself is built; ENG-05c only needs the lobby room to honour the locked connection.
5. **The flip hand-back: `watchCall`, no `#trigger_minigame`.** The hand-back reuses `watchCall`
   (`episode-runner-minigame.js:760`, 02 ENG-05a), which already waits for `pretext_<callId>_outcome` to
   change and every overlay to close, then reopens the runner for the flip. So **E12 needs no real
   `#trigger_minigame`**: the optional `#trigger_minigame` engine fix (ENG-05e) is not a dependency of
   E12; do not wire it. (If the hand-back cannot reuse `watchCall`, stop and ask, section 19.)

### 9.2 OSINT facts (ids, source, what they unlock)

`social.osint.profile: "awareness"`, one `company-site` and one `social` site
(`attack.siteIds: ["merrin_site","merrin_social"]`). Three facts (each declares `se_intel_<id>: false`
in `globalVariables`):

| fact id | source block | fact text (board) | provides / unlocks |
|---|---|---|---|
| `merrin_badge_door` | `blk_visit` (company-site "Visit us") | "The design studio sits behind a badge door; front-of-house buzz expected visitors and couriers through." | the pretext premise (there is a door to be buzzed through); no blank. |
| `merrin_partner_travel` | `post_merrin_site` (social, a partner's post) | "Catherine Merrin, a partner, is often out at project sites, so parcels for her pile up at reception." | `name`/`recipient` `merrin_partner` "Catherine Merrin" (the name the courier drops). |
| `merrin_courier_routine` | `blk_deliveries` (company-site) | "The studio takes frequent material-sample deliveries; the desk signs couriers in." | the delivery pretext flavour; no blank. |

`Catherine Merrin` is the E4 managing partner (`BRAND_SET.md`); reused by name only, not met. Keep the
three facts shallow (11 §7: three to five facts, one page).

### 9.3 The pretext (person-chat, influence bar)

Modelled on E3's `social.pretextNpcs[0]` (`quayholt_helpdesk_reset`). One call,
`callId: "merrin_front_desk"`, `character: "delphine"`, the host `npcType: "person"` so pretext-prep's
Begin opens person-chat. `social.characters.delphine` carries the influence config:
`influence { global: "delphine_influence", min: -100, max: 100, start: 0 }`, `channels: { person:
"delphine_reception" }` (the runner reads `cfg.channels.person` to find the NPC,
`episode-runner-minigame.js:640`), `syncedVars: ["delphine_influence"]`, and thresholds mirroring E3:
`wary` at -30, `refuses` at -50, `reports` at -70 (`reports` sets `delphine_alerted` and ends the
conversation).

Pretext lines (ids, techniques, gating fact, draft text). `blanks`/`claims` as E3:

| line id | technique / also | requires fact | claims (blank) | draft text |
|---|---|---|---|---|
| `open_parcel` | (none) | `merrin_courier_routine` | (none) | "Parcel for the studio, needs a signature from someone up there." |
| `name_drop_partner` | `authority_borrowed` | `merrin_partner_travel` | `recipient` (blank `recipient`) | "It's the sample box for {recipient}, she's expecting it today." |
| `hands_full` | `deflect` | `merrin_badge_door` | (none) | "My hands are full and the badge is back in the van, could you just buzz me through?" |
| `double_parked` | `urgency`, also `deflect` | (always) | (none) | "I'm double-parked with a full run on, any chance you can be quick?" |
| `no_need_to_sign` | `deflect`, also `urgency` | (always) | (none) | "No need to sign me in, I'll be thirty seconds and straight back out." |

**The ask is grantable through the fact Delphine `knows`.** Following
the built E3 pattern (`asks.reset_password.verification: ["manager","staffId"]`, facts the agent `knows`
and the caller claims through blanks, `scenario.json.erb:776-789`), Delphine `knows` the parcel's
recipient, and the one ask gates on the courier naming that recipient correctly:

- `knows`: `{ "recipient": { "value": "merrin_partner", "grade": "identity" } }`.
  `labels`: `{ "merrin_partner": "Catherine Merrin" }`. (`merrin_partner` comes from the OSINT fact
  `merrin_partner_travel`, section 9.2; a learner who skipped the recon has nothing to type in the
  `recipient` blank and cannot clear the verification.)
- The `name_drop_partner` line claims `recipient` from its `recipient` blank (`blanks: { "recipient":
  "recipient" }`, `claims: [{ "fact": "recipient", "from": "blank:recipient" }]`), exactly as E3's
  `give_manager` claims `manager`. When the learner fills in "Catherine Merrin" the fact matches
  Delphine's `knows.recipient.value` and is **proven** (`pretext-judge.js` adds it to `provenFacts`).
- One ask, `buzz_door`: `pressure: -10`, `floor: 0`, `verification: ["recipient"]`,
  `grants: { setGlobal: { delphine_buzzed_through: true } }`. `judgeAsk` grants it once the pressure
  leaves influence at or above the floor **and** `recipient` is in `provenFacts`
  (`pretext-judge.js:366-390`); a courier who never names the partner leaves it `pending`, which is the
  correct "she wants to know who it's for" beat, not a dead end. The granting line in the ink is tagged
  `# unlock_door:training_room` so the desk physically opens the door (section 9.1 item 4).

The two honest checks Delphine **should** make, is this delivery on today's expected list, and will she
walk the courier up rather than buzz the door blind, are **not** verification facts (she cannot confirm
either from what the courier says, which is the whole lesson). They live only in `defenderNotes` and the
flip text (section 10), and they are the mirror to defend item 5. So the con works when the learner
supplies a real partner's name and enough pressure, and the flip explains that the name proving nothing
is exactly why the list-and-escort check is what a genuine courier never minds and this one could not
survive.

`susceptibility` (how far each technique moves her, E3 shape): `{ "authority_borrowed": -15,
"urgency": -10, "deflect": -10 }`; `unverifiableCost: -10`.

`outcomes`: `got_it` (buzzed through), `reported` (she stops and rings facilities), `walked_away`.
`defenderNotes.buzz_door`: "The name on the parcel and the hurry were both easy to supply. A quick look
at the day's expected-deliveries list, and walking the courier to the desk rather than buzzing the door
blind, is what a genuine courier never minds and this one could not survive."

Ink: one new file `ink/delphine_reception.ink`, modelled line-for-line on
`ink/leila_servicedesk.ink`, the two `EXTERNAL pretext_say/pretext_ask` fallbacks, the `se_intel_*`
and `pretext_*` VAR declarations, a `desk` knot offering the fact-gated lines, a `reaction` knot that
routes on band, and an `ask_reaction` knot where result `1` speaks the buzzed-in line **with the
`# unlock_door:training_room` tag** (and Delphine's NPC record carries `"unlockable": ["training_room"]`,
section 9.1 item 4). This is Delphine's lobby ink only. The welcome/brief and the N16 done-event
`eventMappings` live on the kiosk host **Lorna Easton**, a separate NPC record in the `training_room`
(the studio room; section 5, section 15), not on Delphine.

### 9.4 Red-flag meter

The pretext uses the live influence bar and tells (person-chat-ui), not the mail red-flag meter.
`showRedFlagMeter` is not set on a call attack. The crossing "factors" the learner sees are the
techniques (`authority_borrowed`, `urgency`, `deflect`) and the two skipped checks (expected, escort),
surfaced by the `tells`/`defenderNotes`, exactly as E3 surfaces them.

### 9.5 The one consequential choice quoted in the flip (aw2)

The pretext choice the flip shows is whether the learner **asked Delphine to skip signing them in and
buzz the door** (`hands_full` + `no_need_to_sign` + `buzz_door`) versus a line that kept the normal
process. E12 does **not** use `flipDefenderLineByChoice` to name it: that key maps pretext **template**
ids and is read from the saved send record, but a call attack's record is `{ kind: 'call', callId,
outcome }` with no `templateId` (`episode-model.js`), so a by-choice line would never show. The choice
is instead surfaced through the single `flipDefenderLine` plus the pretext
`defenderNotes.buzz_door` (section 9.3), which name the skipped list-and-escort check in the landed case.

## 10. Flip

`strings.flipHeading`: "Now you're the one on the desk". `flipIntro`: "This is how your approach looked
from Delphine's side of the counter. The lines picked out below are what got the door open." A single
`flipDefenderLine` for the landed case (the courier got buzzed through) and `flipNoSend` / `flipMissed`
for the walked-away/reported cases; **no `flipDefenderLineByChoice`** (see section 9.5).
`flipDefenderLine` carries the consequential-choice point in prose ("You asked her to skip the sign-in
and buzz you through, and the name did the rest"), backed by `defenderNotes.buzz_door`. No-blame
throughout (aw culture, 11 §4.3): "A full-handed courier in a hi-vis with the right name is exactly what
a busy desk waves through; getting caught by one is no lapse of sense." The flip reverts the costume
(section 9.1 item 1).

## 11. Defend set

`social.triageSets[0]`, id `e12_reception_desk`, `scoringProfile: "awareness"`, `verifyVerdict: true`,
`feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `outcome.setGlobalPrefix:
"episode_e12_visitor_tailgater_defend_"`, `outcome.passPercent: 0`. `awarenessEpisode.defend`:
`{ "setId": "e12_reception_desk", "reportAlwaysVisible": true, "stage": null }`.

All six items are `kind: "call"`, the built triage `call` surface (`triage-kinds.js`
`NON_EMAIL_KINDS`, `CALL_ACTIONS`). A visitor at the desk maps cleanly onto the four call actions:
**Comply = trust** (let them in), **Escalate = report** (tell facilities/security), **Refuse = delete**
(turn away), **Ring back = verify** (check the expected-visitors list / ring the host). This is the
engine-true, scored, measurement-clean choice; person-chat is unscored so it is **not** used for the
defend beat (same decision E3 took, 11 N15: "person-chat is not used for the defend beat"). Author each
item directly as a `call` message in `triageSet.messages` (the way E3 authors `ha_call_facilities`
inline), with `id`, `kind: "call"`, `callerId`, `from { name, address }`, `time`, `transcript[{who,
text}]` and `truth`. **A `call` message has no `tells` field; the flags live in `truth.flags`**, so read
the "tells" column of the table below as `truth.flags`. `truth` carries `isPhish`,
`flags`, `perFlagNote`, `ifTrusted`, `reportReply` for phish, and `isPhish: false`, `flags: []`,
`whyFine`, `falseAlarmCost` for genuine. The built `call` reasoning defaults (`triage-kinds.js:105-117`)
back up the authored per-flag notes. The six items are given as final JSON below ("Items as final JSON").

`channelTells` for the set (the closed chip list): `["tailgating","no_escort","uniform_pretext",
"not_expected","borrowed_authority","secrecy_or_bypass"]`. `borrowed_authority` and `secrecy_or_bypass`
are the shared-library tells (`00` §2) reused in-person, already labelled in `CHANNEL_TELLS`; the other
four are **scenario-local tells** (11 §5.1). **No ENG-08 library change is needed for
these four:** the validator accepts a `channelTells` id when the set gives it a `flagChips` label and it
is not a factor (`scripts/validate_social/triage.rb` `flag_universe`; proven in scratch, section 17). So
declare the four with **short `flagChips` labels** on the set (a chip label is a short noun phrase, like
the built `CHANNEL_TELLS` labels, not a full sentence); do not add them to the shared
`CHANNEL_TELLS` library. The full explanatory sentence for each flag is carried on a **message-level
`factorStrings` object (a sibling of `truth`, never inside it)**, keyed `factorStrings.<id>.redFlag`, so
the debrief shows a sentence, not a raw id (`triage-flags.js` `redFlagString` reads `message.factorStrings`;
`truth` is `additionalProperties: false`, so a `factorStrings` under `truth` fails `--strict-social`).
(ENG-08 is still needed for the `world` block and the lobby room, not for the tells.) `flagChips` labels
and the per-message `redFlag` sentences:

- `tailgating`: `flagChips` "Tailgating"; `redFlag` "Someone followed an authorised person through a secure door without badging in."
- `no_escort`: `flagChips` "No escort"; `redFlag` "A visitor or contractor left to move around unescorted."
- `uniform_pretext`: `flagChips` "Uniform or job title as proof"; `redFlag` "A hi-vis jacket, a clipboard or a job title used in place of being expected."
- `not_expected`: `flagChips` "Not on today's list"; `redFlag` "The visitor is not on today's list and their paperwork does not match."

### Items (3 impostor, 3 genuine; mirror pairs)

| # | id | genuine | callerId (at the desk) | line / what they want | tells | correct verdict | Verify | reason text |
|---|----|---------|------------------------|-----------------------|-------|-----------------|--------|-------------|
| 1 | `e12_call_tailgater` | no | "A visitor, no badge, following a staff member in" | Slips in behind a badge-holder at the gate and heads for the stairs: "Cheers, I'm with them." | `tailgating`, `no_escort` | Escalate (report) or Ring back | on | `perFlagNote.tailgating`: "They badged in on someone else's card, which is exactly what a wedge or a held door lets happen." `perFlagNote.no_escort`: "Heading up alone, with nobody signing for them." `ifTrusted`: "An unbadged stranger is loose on the studio floor, where client plans and screens are open." `reportReply`: "Thanks, we caught them on the stairs; they weren't expected." Mirrors #2. |
| 2 | `e12_call_expected_client` | yes | "Client, here for a 10:00 with Yasmin Chaudhry" | On today's list, gives their name, happy to sign in and wait. | (none) | Comply or Ring back (sign in, badge, escort) | on | `whyFine.default`: "They're on the day's list for a named meeting and happy to be signed in and walked up. Checking the list or calling Yasmin is a fine Verify." `falseAlarmCost`: "Turn them away and a real client is left in the lobby and the meeting is missed." Mirror of #1 (arrival: unknown-and-pushing vs expected-and-patient). |
| 3 | `e12_call_fire_inspector` | no | "'Fire-safety inspector', wants the comms room" | "Annual check, I just need five minutes in your comms room. I can let myself in." Not on the list; firm name doesn't match the service contract. | `uniform_pretext`, `not_expected`, `secrecy_or_bypass` | Ring back (check list + contract), then Escalate | on | `perFlagNote.uniform_pretext`: "A hi-vis and a clipboard are easy to get; neither proves he's expected." `perFlagNote.not_expected`: "No entry on today's list and the firm on his order isn't the one on the maintenance contract." `perFlagNote.secrecy_or_bypass`: "'I can let myself in' asks to skip the escort into a secure room." `ifTrusted`: "He'd be alone in the comms room with the building's network." `reportReply`: "Thanks, facilities confirmed no inspection was booked and the firm's name was wrong." Mirrors #4. |
| 4 | `e12_call_real_contractor` | yes | "Lift engineer, on today's list" | From the firm on the service contract, on the day's list, happy to wait at the desk to be signed in and escorted. | (none) | Comply or Ring back | on | `whyFine.default`: "On the list, from the contracted firm, and content to wait and be escorted, a genuine engineer never minds that." `whyFine.secrecy_or_bypass`: "He asks to be signed in, not to skip it." `falseAlarmCost`: "Send him away and the lift stays out of service." Mirror of #3 (contractor: unverifiable-and-pushy vs verifiable-and-patient). |
| 5 | `e12_call_courier_push` | no | "Courier with a parcel, badge 'in the van'" | The exact con the learner just ran: "Sample box for one of your partners, hands full, could you buzz me through? Don't worry about signing me in." | `tailgating`, `borrowed_authority`, `secrecy_or_bypass` | Refuse the buzz-through / Ring back (take the parcel at the desk) | on | `perFlagNote.borrowed_authority`: "Dropping a partner's name doesn't make the delivery expected." `perFlagNote.secrecy_or_bypass`: "'Don't bother signing me in' is the ask to skip the one check." `perFlagNote.tailgating`: "Buzzing the door without a badge is letting them tailgate on your say-so." `ifTrusted`: "A stranger is through the badge door and onto the studio floor." `reportReply`: "Thanks, real couriers leave the parcel at the desk; we logged it." Mirrors #6, and closes the loop with the attack. |
| 6 | `e12_call_forgot_badge` | yes | "Staff member back from leave, no badge" | "First day back, I've left my pass at home, can you let me in?" A real colleague the desk can place on the staff list. | (none) | Ring back (check staff list, issue a temp pass), **not** Refuse | on | `whyFine.default`: "A genuine colleague the desk can confirm. Check the staff list and issue a day pass, don't lend your own badge, and don't leave them stuck." `whyFine.tailgating`: "The safe answer is a temporary pass of their own, so the record stays right." `falseAlarmCost`: "Refuse flatly and you've left a colleague locked out on their first day back; the courtesy is to verify and help." Mirror of #5 (the badge problem: a stranger pushing through vs a known colleague to verify and help). |

Scoring note: both impostor and genuine items reward **Verify** (Ring back) as the safe default (11
§4.1: reporting/verifying when unsure is never penalised), so "refuse everyone" loses points on the
genuine items (#2, #4, #6), exactly as E3's single genuine caller prevents "refuse everything" from
winning. **Comply on a genuine visitor scores only half:** `KIND_VERDICT_POINTS.call`
scores `real.trust` at 30 of 60, while Ring back (verify) and Escalate score the full 60
(`triage-scoring.js`). So on the genuine items (#2, #4, #6) the natural "just let the expected client in"
answer earns half marks, and Ring back is the full-mark habit. Word each genuine item's `whyFine` so
Comply is explained but the check is the modelled move ("a quick look at the list is still the habit, and
costs the client nothing"), and the per-item feedback says the full-mark move is to check the list or
ring the host first.

### Items as final JSON

The six `call` messages, as final `triageSet.messages` JSON. This exact set was validated in scratch
(section 17). Flags are in `truth.flags`; the four scenario-local tells are labelled in the set
`flagChips` (above) and sentence-explained per message on a **message-level `factorStrings` object (a
sibling of `truth`, never inside it)**, keyed `factorStrings.<id>.redFlag`. The `factorStrings` object is
shown below for the three messages that raise a local tell (items 1, 3, 5); it uses the `redFlag`
sentences listed above, one entry per local flag the message raises. (The shared tells
`borrowed_authority` and `secrecy_or_bypass` take their sentence from the `CHANNEL_TELLS` library, so they
need no `factorStrings` entry.)

```json
[
  { "id": "e12_call_tailgater", "kind": "call",
    "callerId": "A visitor, no badge, following a staff member in",
    "from": { "name": "Unknown visitor", "address": "At the gate, no badge" }, "time": "09:12",
    "transcript": [
      { "who": "Visitor", "text": "Cheers, I'm with them." },
      { "who": "Visitor", "text": "(slips in behind a badge-holder at the gate and heads for the stairs)" }
    ],
    "truth": { "isPhish": true, "flags": ["tailgating", "no_escort"],
      "perFlagNote": {
        "tailgating": "They badged in on someone else's card, which is exactly what a wedge or a held door lets happen.",
        "no_escort": "Heading up alone, with nobody signing for them." },
      "ifTrusted": "An unbadged stranger is loose on the studio floor, where client plans and screens are open.",
      "reportReply": "Thanks, we caught them on the stairs; they weren't expected." },
    "factorStrings": {
      "tailgating": { "redFlag": "Someone followed an authorised person through a secure door without badging in." },
      "no_escort": { "redFlag": "A visitor or contractor left to move around unescorted." } } },
  { "id": "e12_call_expected_client", "kind": "call",
    "callerId": "Client, here for a 10:00 with Yasmin Chaudhry",
    "from": { "name": "Expected client", "address": "At the desk" }, "time": "09:55",
    "transcript": [
      { "who": "Client", "text": "Morning, I've a ten o'clock with Yasmin Chaudhry." },
      { "who": "Client", "text": "Happy to sign in and wait, no rush." }
    ],
    "truth": { "isPhish": false, "flags": [],
      "whyFine": {
        "default": "They're on the day's list for a named meeting and happy to be signed in and walked up. A quick look at the list or a call to Yasmin is the full-mark move; just letting them in scores half.",
        "not_expected": "They are on today's list, which a quick glance confirms." },
      "falseAlarmCost": "Turn them away and a real client is left in the lobby and the meeting is missed." } },
  { "id": "e12_call_fire_inspector", "kind": "call",
    "callerId": "'Fire-safety inspector', wants the comms room",
    "from": { "name": "'Fire-safety inspector'", "address": "At the desk, clipboard" }, "time": "11:20",
    "transcript": [
      { "who": "Inspector", "text": "Annual check, I just need five minutes in your comms room." },
      { "who": "Inspector", "text": "I can let myself in, no need to trouble anyone." }
    ],
    "truth": { "isPhish": true, "flags": ["uniform_pretext", "not_expected", "secrecy_or_bypass"],
      "perFlagNote": {
        "uniform_pretext": "A hi-vis and a clipboard are easy to get; neither proves he's expected.",
        "not_expected": "No entry on today's list and the firm on his order isn't the one on the maintenance contract.",
        "secrecy_or_bypass": "'I can let myself in' asks to skip the escort into a secure room." },
      "ifTrusted": "He'd be alone in the comms room with the building's network.",
      "reportReply": "Thanks, facilities confirmed no inspection was booked and the firm's name was wrong." },
    "factorStrings": {
      "uniform_pretext": { "redFlag": "A hi-vis jacket, a clipboard or a job title used in place of being expected." },
      "not_expected": { "redFlag": "The visitor is not on today's list and their paperwork does not match." } } },
  { "id": "e12_call_real_contractor", "kind": "call",
    "callerId": "Lift engineer, on today's list",
    "from": { "name": "Lift engineer", "address": "At the desk" }, "time": "13:05",
    "transcript": [
      { "who": "Engineer", "text": "Lift engineer, I'm down for the service this afternoon." },
      { "who": "Engineer", "text": "Happy to wait at the desk to be signed in and escorted." }
    ],
    "truth": { "isPhish": false, "flags": [],
      "whyFine": {
        "default": "On the list, from the contracted firm, and content to wait and be escorted, a genuine engineer never minds that; a quick list check is the full-mark move.",
        "secrecy_or_bypass": "He asks to be signed in, not to skip it." },
      "falseAlarmCost": "Send him away and the lift stays out of service." } },
  { "id": "e12_call_courier_push", "kind": "call",
    "callerId": "Courier with a parcel, badge 'in the van'",
    "from": { "name": "Courier", "address": "At the badge door" }, "time": "14:30",
    "transcript": [
      { "who": "Courier", "text": "Sample box for one of your partners, hands full, could you buzz me through?" },
      { "who": "Courier", "text": "Don't worry about signing me in, I'll be thirty seconds." }
    ],
    "truth": { "isPhish": true, "flags": ["tailgating", "borrowed_authority", "secrecy_or_bypass"],
      "perFlagNote": {
        "borrowed_authority": "Dropping a partner's name doesn't make the delivery expected.",
        "secrecy_or_bypass": "'Don't bother signing me in' is the ask to skip the one check.",
        "tailgating": "Buzzing the door without a badge is letting them tailgate on your say-so." },
      "ifTrusted": "A stranger is through the badge door and onto the studio floor.",
      "reportReply": "Thanks, real couriers leave the parcel at the desk; we logged it." },
    "factorStrings": {
      "tailgating": { "redFlag": "Someone followed an authorised person through a secure door without badging in." } } },
  { "id": "e12_call_forgot_badge", "kind": "call",
    "callerId": "Staff member back from leave, no badge",
    "from": { "name": "Colleague back from leave", "address": "At the desk" }, "time": "15:40",
    "transcript": [
      { "who": "Colleague", "text": "First day back, I've left my pass at home, can you let me in?" },
      { "who": "Colleague", "text": "You can check me on the staff list, I don't mind waiting." }
    ],
    "truth": { "isPhish": false, "flags": [],
      "whyFine": {
        "default": "A genuine colleague the desk can confirm. Check the staff list and issue a day pass, don't lend your own badge, and don't leave them stuck.",
        "tailgating": "The safe answer is a temporary pass of their own, so the record stays right." },
      "falseAlarmCost": "Refuse flatly and you've left a colleague locked out on their first day back; the courtesy is to verify and help." } }
]
```

## 12. Debrief cards

`debrief: { "mondayCard": "slot:customer_report_route", "noBlameLine": true }`. Strings:

- `conceptPanel`: heading "Why the courier got in"; text: "The parcel, the partner's name and the hurry
  were all easy to supply, and none of them proved the courier was expected. The one thing that would
  have stopped it costs nothing: a glance at the day's list and walking the visitor to the desk instead
  of buzzing the door blind. A genuine visitor never minds being signed in and escorted; the one who
  pushes to skip it is the one to report."
- `strings.mondayCard`: "On Monday: if you don't recognise someone, help them, 'Can I help you find
  someone? I'll walk you to reception.' Don't hold a secure door for a stranger, everyone badges in for
  themselves, and report anyone who pushes past a check, using the route in the box below."
- The module line (core_10): "If you don't know them, help them: 'Can I help you find someone? I'll
  walk you to reception.'"
- `noBlameLine`: "A busy desk that tries to help a full-handed courier is doing its job; a miss just
  shows which visitor to slow down for next time."
- **The habit to keep** is shared and quoted **verbatim**; do not rewrite it. `social.awareness.ruleOfThumb`:
  heading "The habit to keep", text: "When a message pressures you to move money, grant access, sign in
  or read back a code, stop and check it yourself through a route you already trust, not the link,
  number or page the message gives you. Taking a minute to confirm is always a fair thing to do."

## 13. Defend-only variant

A second shell, id `e12_visitor_tailgater_defend`, `variant: "defendOnly"`, `stages:
["brief","defend","debrief"]`, same `defend.setId: "e12_reception_desk"`. Its set prefix becomes
`episode_e12_visitor_tailgater_defend_defend_` (the id already ends `_defend`, 11 §5.1 / §10). The
`brief` and `debrief` carry `_defendOnly` strings under `awarenessEpisode._defendOnly` (the defend-only
shell copies them over `strings.brief`/`scopeNote`; `BRAND_SET.md` §7). `defendOnly` string (moves the
empathy line to the debrief since there is no flip): "These visitors were played by people whose job is
to look like they belong, and a busy desk can be caught by any of them. Any you were caught out by are
shown below, with what gave each one away." Both the full and the defend-only shell join the two seeded
Hacktivity courses (the full shell in the both-versions course, the defend-only shell in the defend-only
course) **through 01 P12**, per the user's decision in `WRITER_BRIEF.md`.

## 14. Check-form items it feeds (`general_v2`; see `10_CHECK_FORMS.md`)

E12 does **not** get its own physical-security check form. A message inbox is a
poor instrument for tailgating and badges, so E12's main measurement stays inside the episode (the scored
reception `call` set, section 11), and `10_CHECK_FORMS.md` deliberately leaves the rest of E12 unchecked
by a form. E12 contributes just **one physical-pretext item** to the shared **`general_v2`** pair (the
message-triage-friendly topics; Quayholt, Verify off): a visitor or courier talking their way to access
by message, the kind of "visitor with a story" that core_10 teaches (`10`'s `general_v2` item 8B
`gvb_usb_courier` and the contractors/fire-drill genuine item 10 already carry this flavour). That item
is authored as part of `10`, not as an E12 form; the six built role forms are the measured baseline and
are not edited. There is no per-topic physical-security form and no new flag ids in the check forms (the
four scenario-local tells in section 11 stay in E12's own set, never in a form).

## 15. Files to create or change

Create:

- `scenarios/awareness_e12_visitor_tailgater/scenario.json.erb` (full shell: two rooms, the
  `awarenessEpisode`, the `triageSet`, `social.characters.delphine`, `social.pretextNpcs[merrin_front_desk]`,
  `social.osint`, `social.people`, `globalVariables`). Top-level `startRoom: "training_room"` (the kiosk
  room, section 9.1 item 3). The **`lobby`** room holds the Delphine pretext NPC (`delphine_reception`,
  with `"unlockable": ["training_room"]`) and a connection to `training_room`; the **`training_room`**
  room (the design studio, the room the lobby opens onto) carries the badge-door **lock keys on its own
  room block** (section 9.1 item 3, `02` ENG-05c), the kiosk and the kiosk host NPC **Lorna Easton** with
  the welcome ink and the N16 done-event `eventMappings` (section 5). Model on E3 + E7.
- `scenarios/awareness_e12_visitor_tailgater/ink/delphine_reception.ink` (+ compiled `.json`), and the
  kiosk host ink for **Lorna Easton** (the welcome/brief and debrief lines; the N16 mapping is on
  her NPC record).
- `scenarios/awareness_e12_visitor_tailgater/mission.json` (pattern from E3/E7).
- `scenarios/awareness_e12_visitor_tailgater_defend/` (the defend-only shell).
- Lobby map `public/break_escape/assets/rooms/room_aw_merrin_lobby.json` / `.tmj` via a new entry in
  `scripts/room_gen/build_aw_rooms.py` (there is no top-level `assets/`; the real path is under
  `public/break_escape/assets/`, 01 P5c). ENG-05 owns the dressing; this spec owns the wiring.

Change:

- `scripts/room_gen/build_aw_rooms.py`: add the `room_aw_merrin_lobby` build (ENG-05).
- `planning_notes/phishing_and_social_engineering/awareness/training_room.py`: if the studio map wiring
  needs a lobby entry, add it (ENG-05).
- `awareness/BRAND_SET.md`: add Delphine Arvanitis (lobby mark) and Lorna Easton (studio kiosk host),
  the lobby, the invented contractor and fire-safety firm, under an E12 additions block (follow the
  existing "_brandAdditions" convention).
- Hacktivity course seeds: both shells join the defend-only and both-versions courses **through 01 P12**,
  not by hand-editing Hacktivity or through `awareness_deploy.py`.

Do **not** edit the six built role check forms, the shared `ruleOfThumb` test string, the existing
`room_aw_*` maps, or any other episode's fragments.

Required `globalVariables` (declare all, defaults as shown): `episode_e12_visitor_tailgater_state: {}`,
`se_awareness_records: []`, `episode_e12_visitor_tailgater_defend_percent: 0`,
`..._defend_reportRate: 0`, `..._defend_done: false`, `..._defend_pass: false`, `se_osint_state: {}`,
`se_intel_merrin_badge_door: false`, `se_intel_merrin_partner_travel: false`,
`se_intel_merrin_courier_routine: false`, `delphine_influence: 0`, `delphine_latched: ""`,
`delphine_wary: false`, `delphine_refusing: false`, `delphine_alerted: false`,
`delphine_buzzed_through: false`, `pretext_merrin_front_desk_state: {}`,
`pretext_merrin_front_desk_outcome: ""`, `pretext_merrin_front_desk_lowest: 0`,
`pretext_merrin_front_desk_reports: 0`.

## 16. Bridge script outline

A `tools/playtest/se/bridge-e12-full.jsonl` (pattern from the existing `bridge-e*-full.jsonl`) driving:
the standard opening (the learner spawns in `training_room`, `moveToNear training_kiosk`, interact) →
brief → find the three OSINT facts (so the `recipient` blank can be filled) → open pretext-prep, fill the
parcel/partner blanks, Approach →
run the person-chat lines to `got_it` (door opens) → flip → work the six reception `call` items
(mixing verdicts to exercise Verify) → debrief → assert `episode_e12_visitor_tailgater_defend_done`.
Validate with `check-bridge.mjs` / `run-suite.sh`.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb scenarios/awareness_e12_visitor_tailgater/scenario.json.erb
  --strict-social --no-graph --skip-ink` passes (the validator takes the `scenario.json.erb` file path
  per shell, not the folder, README §8.3); same for the defend-only shell. The four scenario-local tells
  pass because each has a `flagChips` label on the set (no library change); the shell otherwise needs
  ENG-08 for the `awarenessEpisode.world` block, the lobby room type and the locked
  lobby-to-`training_room` connection. **Defend set proven:** the six `call` items
  (section 11) with `channelTells` `["tailgating","no_escort","uniform_pretext","not_expected",
  "borrowed_authority","secrecy_or_bypass"]` and the four local tells labelled in `flagChips` were built
  into a throwaway copy of the `awareness_e6_texts_and_qr_defend` shell and run through
  `validate_scenario.rb --strict-social`: exit 0, no social lint error. The `world`/lobby/door keys
  themselves need ENG-05a and ENG-08 (not built yet), so that half of the shell was not scratch-validated
  here; it is validated when those packets land.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` and the `validator-social-*` and
  `social-*` suites pass with E12 added.
- The ink compiles: `inklecate` on `delphine_reception.ink` produces the `.json`; the `# unlock_door:training_room`
  tag is present on the granting line.
- The bridge suite (section 16) reaches `..._defend_done` and the conclusion screen.
- Manual: the costume reverts to the player's chosen avatar after the flip (aw9); the lobby door is
  locked until `got_it`.

## 18. Do not

- Do not build RFID, lockpicking, spot-the-risk or MG-25; they are cut (section 1, 6).
- Do not use person-chat for the scored defend beat (11 N15); defend is triage `call` items.
- Do not reuse "Maureen Gallagher" or any barred name (`BRAND_SET.md` §Additions).
- Do not make the costume a new chosen avatar; it is a temporary override that restores
  `chosenPlayerSprite` (aw9).
- Do not rewrite the shared `ruleOfThumb` or the per-episode habit test; quote it verbatim.
- Do not run any generator into the repo; do not `git stash`; no attribution lines in commits
  (`WRITER_BRIEF.md`). (The writer never runs git at all.)
- Do not use real brands; `.example` domains only; no working intrusion detail (it is an authorised,
  non-instructional test, core_10 pitfalls).

## 19. Stop and ask if

- ENG-05a's world-play handoff turns out **not** to reuse `watchCall` for the flip (02 has settled that
  it does), so E12 would need a real `#trigger_minigame` (ENG-05e, section 9.1 item 5): confirm the route
  before wiring the ink.
- The implementer reads the code and finds a single NPC record **can** be in two rooms after all (it
  cannot today; section 5 and section 20.1 split into two front-of-house NPCs on that basis): if so, one
  NPC could serve as both the lobby mark and the studio host.
- ENG-08 cannot accept the `awarenessEpisode.world` block, the lobby room type or the locked
  lobby-to-`training_room` connection. (The four scenario-local tells need no ENG-08 change; they use `flagChips`
  labels, section 11.)

## 20. Open questions

1. **One NPC or two for the host: two (decided from the code).** An NPC is declared inside one room
   (`scenario-schema.json` `rooms[].npcs`), and the `person` pretext target is resolved as a placed world
   NPC via `cfg.channels.person` (`episode-runner-minigame.js:640`). The lobby pretext mark must be a
   world NPC in the lobby; the kiosk host carrying the N16 done-event `eventMappings` must be a world NPC
   at the studio kiosk. One NPC record cannot be in both rooms, so E12 uses **two** front-of-house NPCs:
   **Delphine Arvanitis** on the desk as the mark, and **Lorna Easton** as the studio kiosk host (section
   5). Both are front-of-house, so either satisfies the brief's "host: a front-of-house staff member",
   and the "con one front-desk colleague, then do the front-desk job yourself" empathy structure holds.
2. **Call-action labels for a reception context.** The built `CALL_ACTIONS` read "Comply / Escalate /
   Refuse / Ring back"; "Ring back" is slightly off for a visitor at a desk (the equivalent is "check
   the list / call the host"). The per-set action relabel is **ENG-03a's `triageSet.verdictLabels`**
   (02 ENG-03a), not ENG-07 (ENG-07 is only the person-chat/triage `call` video-call bar label); it is
   cosmetic and the verdict mapping is unchanged, so E12 ships without it, but note it as a polish item.
3. **Does the learner physically walk through the opened door? No.** The door
   opening is the attack's success and empathy beat (the con worked); defend is played at the kiosk in
   `training_room`, which is also the scenario `startRoom`, so the learner starts there and ENG-05a
   returns them there on any `write` outcome (section 9.1 item 3). The runner reopens as an overlay
   wherever the player stands (it needs no proximity), so nothing requires walking into the opened door.
   A failed con and a reload both land at the kiosk, never stranded.
4. Whether the osint stage survives the timing budget or is cut into the brief (section 6).
