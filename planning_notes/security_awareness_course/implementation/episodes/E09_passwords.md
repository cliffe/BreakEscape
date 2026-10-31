# E9 passwords and password managers (implementation spec)

Status: draft for a Sonnet implementer. E9 is a new awareness episode at Tarrowby Logistics. It leans on a new engine surface, **ENG-02** (the passphrase and guessing stage), which does not yet exist, so the full episode cannot be built until ENG-02 lands. This spec gives the content in full and states exactly what ENG-02 must provide, so authoring is ready the moment the packet is in.

Writer: opus48 agent. Never run a generator into the repo. Never `git stash`. No attribution lines in commits.

---

## 1. Goal and module(s)

Teach that most passwords are not cracked but guessed, reused or handed over, and that the defences are a different password for every account kept in a manager, three random words for the few you must remember, MFA with a passkey where you can, and "if you didn't start it, deny it and report it". Module: **core_03** (passwords, passphrases and MFA). The E3 help-desk episode already carries the MFA-fatigue beat; E9 carries the password and reuse content and repeats the deny-and-report rule from the receiving end.

Learning outcomes (from `modules/core_03_passwords_and_mfa/`): LO1 (a different password per account, a manager), LO2 (three random words), LO3 (made-up security answers, unique sign-ups), LO4 (the MFA ladder, passkeys), LO5 (deny and report an unstarted prompt), LO6 (shared PCs and written-down passwords).

## 2. Read first (exact paths)

- `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md`.
- Teaching source of truth: `modules/core_03_passwords_and_mfa/concepts.md` (the whole file; the guessing/reuse/manager/MFA/passkey content) and `modules/core_03_.../game_design.md` (the E9 design, the decisions table, the password surface). Also `modules/core_03_.../assessment.md` for the scored behaviours and mirror pairs.
- The nearest built episode: **E3** `scenarios/awareness_e3_helpdesk_reset/` end to end (the MFA stage, the authenticator demo, the push defend card), plus the fragments `planning_notes/phishing_and_social_engineering/awareness/e3/{attack,defend}.json`. E3 is the model for the flood flip and the push cards. Also read **E6** `scenarios/awareness_e6_texts_and_qr/` for the Tarrowby room wiring and the Tarrowby cast.
- Shapes and ids: `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` (the shared channel-tell library, the triageSet `truth` shape, the `push` card from E3) and `designs/11_awareness_product_episodes.md`.
- Companies and cast: `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` (Tarrowby Logistics roster, the E2 and E6 `_brandAdditions`); `modules/.../03_WORLD_AND_CAST.md` (hosts; the E9 row names Nilesh Solanki).
- Runner: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS`, `childLaunch`, the `mfa` attack-stage pattern); `public/break_escape/js/minigames/authenticator/` (the mock authenticator the flood and the push cards use).
- Engine packet: `implementation/02_ENGINE_WORK.md`, packet **ENG-02** (and ENG-08 for any schema/stage-order change).

## 3. Depends on

- **ENG-02** (password guessing stage `guess`). This packet owns the **attack-half** guesser/reuse rig only, in a new stage id `guess` (not a reuse of `build`). E9 cannot build its full variant's attack half without it. §9 states the `awarenessEpisode.guess` config ENG-02 must accept.
- **ENG-09a** (authored-choice triage kind `choice`). E9's **defend-half** password-practice cards (§11 rows 4 to 8) are scored `choice` items delivered by this kind, not by ENG-02. The defend-only variant needs ENG-09a (not ENG-02), because the password cards are the core of its defend half (§13). ENG-02 is attack-half only (`02_ENGINE_WORK.md` ENG-02 scope line and Stop-and-ask).
- **ENG-09b** (debrief panel list). E9's debrief shows several short concept cards (§12), and the built `strings.conceptPanel` is a single panel; ENG-09b adds the array form.
- **The E3 authenticator demo** (built) for the flood flip and the push defend cards. No new work there; reuse the `e3_push_early` / `mfaDecision.pushTemplate` shapes.
- **ENG-08** (schema and validator): adds the `guess` stage id to `STAGE_IDS`/`ATTACK_STAGES`, the `brief osint guess flip defend debrief` stage order (so the attack half can end in the guesser with no `write` stage, see §7), the `awarenessEpisode.guess` schema key, and the `choice` kind for ENG-09a. All owned by the respective packets; ENG-08 collects them.
- One new channel tell `mfa_number_relay` for the fake-"IT" card (see §11). It is **scenario-local to E9**: only E9 scores it today (the shipped E3 defend set does not carry it, and it is not in the shared `CHANNEL_TELLS`), and no `10` check item scores it, so it stays local rather than being appended to the shared library. Declare it in E9's `channelTells` with a `flagChips` label and a `factorStrings.mfa_number_relay.redFlag` sentence; the validator accepts a scenario-local id that `flagChips` labels and that is not a factor (`triage.rb` `flag_universe`). Promote it to the shared library (with a `SKILL_NAMES` entry, ENG-08) only if a second set later uses it, or a check item scores it.

## 4. Owner models

- Content and dialogue: `opus48`.
- ENG-02 engine surface and the shell wiring: general-purpose or Sonnet, after ENG-02 is built.

## 5. Company, room and host

- **Company:** Tarrowby Logistics (`tarrowby_logistics`). Brand block, copied exactly from a built Tarrowby shell: `{ "name": "Tarrowby Logistics", "logoText": "TARROWBY", "accent": "#3b5b8c" }`.
- **Room:** reuse the built `room_aw_tarrowby`, exactly as `scenarios/awareness_e6_texts_and_qr/scenario.json.erb` wires it (`"type": "room_aw_tarrowby"`, `chatBackground": "assets/backgrounds/rooms/aw_tarrowby_blended.png"`, the same lighting and kiosk object). No new room.
- **Host:** **Nilesh Solanki**, IT service desk analyst, `nilesh.solanki@tarrowby.example` (built Tarrowby cast, renamed from Dev Mistry in the E6 shells; 30s, Gujarati-British, grew up in Leicester). Placeholder host sprite `male_telecom_v2` / `male_telecom_talk.png` / `male_telecom_visemes.png` (as Chidi Okeke uses in E6); host art follows the PixelLab reset. No new cast member for the host.
- **Role:** `general_staff` with a depot flavour (shared PCs, warehouse logins). E9 feeds the general or mobile check forms (the push item is already in the helpdesk form from E3).
- **Attack target (the colleague the guesser runs against):** **Colin Mather**, warehouse manager, `colin.mather@tarrowby.example` (built Tarrowby cast: the hiring manager whose vacancy is public in E2; late 50s, white, West Yorkshire). He fits the game design's "supervisor who uses one password for everything". No new cast member.

### New names and brands E9 introduces (need the pre-ship web search and a BRAND_SET `_brandAdditions` note)

- A hobby forum Colin once used, breached, whose password he reused at work: **RiverReach Angling**, `riverreachangling.example`. Fictional; pre-ship web-search check required.
- The new supplier portal in the sign-up card: reuse the built Tarrowby third party **Fuelr** (`fuelr.example`, the E6 fuel-card service) rather than inventing one. Confirm Fuelr's domain against `e6/defend.json` `_brandAdditions` before use.

All people and companies are fictional; every address and domain ends `.example`. No homographs.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | Notes |
|---|---|---|
| brief | 1.0 | Nilesh's welcome, scope note. |
| osint | 2.5 | Collect Colin's public details as facts. |
| guess (guesser/reuse rig, ENG-02) | 3.5 | Assemble a guess list from the facts; the guesser ticker strikes them through; the reuse step opens the work account. |
| flip | 1.5 | The learner's own account under a prompt flood, then the fake "IT" message. Reuses the authenticator flood (watch-only). |
| defend | 4.5 | About 6 to 8 cards: push triage (authenticator) plus password-practice `choice` cards (ENG-09a), Verify on. |
| debrief | 2.0 | Reasoning cards, the tally, the habit, the "On Monday" card (three things to do at home tonight), the report route, the no-blame line. |

Defend-only variant: brief, defend, debrief, about 8 minutes.

## 7. Stages (runner stage ids)

Full episode: `["brief", "osint", "guess", "flip", "defend", "debrief"]`.

- `guess` carries the guesser/reuse rig. This is a **new stage id** that ENG-02 adds to `STAGE_IDS` and `ATTACK_STAGES`; it is **not** a reuse of `build`. `build` today launches the landing-page builder (`childLaunch`, `episode-model.js:187`), so reusing it would open the wrong child; ENG-02's decision is a dedicated `guess` stage (`02_ENGINE_WORK.md` ENG-02, "a new stage id, `guess`, not a reuse of `build`"). E9 passes an `awarenessEpisode.guess` config block (ENG-02 owns the exact key; §9 gives the content).
- There is **no `write` stage**: E9 sends no email or call, the guesser is the attack artefact. ENG-08 adds the stage order `brief osint guess flip defend debrief` (guess after osint, before flip, no `write`), so the lint accepts it.
- `flip` reuses the authenticator demo in its watch-only flood shape (the `mfaDecision` note in `e3/attack.json` confirms the scene still supports `{ pushes[...], approvesAt }` when `choice` is absent). ENG-01's `flipAftermath` carries the prompt flood after the landed guess; no new flip engine is needed.
- `defend` runs the push/authenticator triage cards (ordinary triageSet messages) and the password-practice `choice` cards (ENG-09a) together, recording into `se_awareness_records` like any defend half.

Defend-only: `["brief", "defend", "debrief"]`. **The defend-only variant needs ENG-09a** (the password-practice `choice` cards are the core of the defend half), **not** ENG-02: ENG-02 is attack-half only, and `guess` is an `ATTACK_STAGES` id that `stagesFor` drops from a `defendOnly` shell. So, unlike E8, E9's defend-only cannot ship before ENG-09a lands (`02_ENGINE_WORK.md` ENG-02's Stop-and-ask says the same: E9's defend-only needs ENG-09a, not ENG-02).

## 8. Brief and scope note (host's draft lines)

- **Episode id:** `e9_passwords`. Defend-only shell id: `e9_passwords_defend`.
- **`strings.brief`:** "You're on an authorised exercise at Tarrowby Logistics, a fictional haulier, in the depot office. First you're on the red team: look at what a colleague has put online, build a guess list from it, and watch how fast a reused password opens his work account. Then it's your own account under attack, and you lock it down. Only the lock-down part is scored."
- **`scopeNote`:** "Authorised exercise at Tarrowby Logistics, a fictional company. In scope: a guess list built from one colleague's public details, and your own sign-in choices. No real password is ever typed or stored; the guesses and codes are made up."
- **Nilesh's welcome (host ink, hub pattern):** "Welcome to the Tarrowby exercise. Most passwords aren't cracked. They're guessed, reused or handed over. Start at the kiosk: I'll show you how, on a made-up colleague, then you shut it down on your own account. Nothing you touch here is a real password."

## 8b. Shell and generator metadata (every value final; no guessing)

Every metadata value the shell wiring (01 P2/P3) and the generator (01 P4, `gen_e8_e17_shells.py`) need, as final strings, so a Sonnet implementer invents nothing. Copy the shapes from the built **E6** erb, `mission.json` and the generator helper scaffolding (E6 is the same company and room; its host entry is Chidi's, so E9's host entry is authored new here, with the name-clash search in P11). The `opus48` content step fills §8b, §9's `guess` content, §10's flip strings and §11's defend items before any Sonnet begins P2. **The full episode also needs ENG-02 (`guess`) and the defend-only shell needs ENG-09a (`choice` cards); §8b is the generator and shell metadata, which does not itself wait on those packets.**

### Host and learner sprites

- **Nilesh Solanki's `HOSTS['nilesh']` entry** (authored new in `gen_e8_e17_shells.py`, Tarrowby cast; `sprite` is the base key, the in-scenario `spriteSheet` adds `_v2`): `{ 'id': 'nilesh_solanki', 'displayName': 'Nilesh Solanki', 'sprite': 'male_telecom', 'about': "Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in Leicester (BRAND_SET.md, E6/E9 additions). Placeholder sprite until the PixelLab reset." }`.
- **Nilesh's in-scenario host NPC sprite keys** (full erb `rooms.training_room.npcs[]`, following the E6 host NPC shape): `"spriteSheet": "male_telecom_v2"`, `"spriteTalk": "assets/characters/male_telecom_talk.png"`, `"spriteVisemes": "assets/characters/male_telecom_visemes.png"`, `"npcType": "person"`, `"id": "nilesh_solanki"`, `"displayName": "Nilesh Solanki"`, `"storyPath": "scenarios/awareness_e9_passwords/ink/nilesh_solanki.json"`, `"currentKnot": "start"`. Host art is a placeholder until the PixelLab reset.
- **Learner avatar** (full erb `player`), as E5/E6: `"spriteSheet": "female_office_worker_v2"`, `"spriteTalk": "assets/characters/female_office_worker_talk.png"`.

### Full-episode objectives (full erb `objectives[]`, copy the E6/E1 two-aim shape)

| field | aim 1 (red team) | aim 2 (defend, `missionConclusion: true`) |
|---|---|---|
| `aimId` | `red_team_guess_aim` | `lock_down_aim` |
| `title` | "Run the guesser" | "Lock your account down" |
| `description` | "Build a guess list from a colleague's public details and watch how fast a reused password opens his work account." | "Work through the sign-in prompts and password choices at the training kiosk." |
| `order` | 0 | 1 |
| task `taskId` / `title` / `type` | `run_the_guesser` / "Run the guesser against the colleague" / `manual` | `lock_the_account` / "Lock your account down" / `custom` |

Aim 2 `concludeRequires.globals`: `["episode_e9_passwords_defend_done"]`. Aim 2 `conclusionScreen`: `{ "type": "success", "title": "After passwords episode done", "body": "You've seen both sides: a reused password opening a colleague's account, then your own account locked down, so this episode is finished." }`. `conclusionTaskId` is `lock_the_account`.

### Full-episode training kiosk (full erb `rooms.training_room.objects[]` kiosk, copy the E6 shape)

- `observations`: "A touch-screen training kiosk for the Tarrowby passwords exercise: first a guess list built from a colleague's public details, then your own account to lock down."
- `observationVariants[0]`: `{ "condition": "globalVars.episode_e9_passwords_defend_done", "value": "A touch-screen training kiosk for the Tarrowby passwords exercise. The guesser has run and your account is locked down." }`
- `minigameData.episodeId`: `e9_passwords`.

### Full-episode `mission.json` (copy the E6 mission.json shape)

- `display_name`: "Awareness E9: Passwords and password managers (full episode)"
- `description`: "An awareness episode of about 15 minutes for all staff. On an authorised exercise at Tarrowby Logistics, a fictional haulier, you first play the attacker: build a guess list from a colleague's public details and watch a reused password open his work account. Then it's your own account under attack, and you lock it down. Only the lock-down part is scored, and reporting when you're unsure is always fine and never marked down. No real password is ever typed."
- `difficulty_level`: 1; `scoring`: "completion"; `secgen_scenario`: null; `collection`: "training"; `ui_theme`: "general"; `estimated_duration_minutes`: 15.
- `cybok`: `[ { "ka": "HF", "topic": "Human Factors", "keywords": ["Passwords", "Passphrases", "Multi-factor authentication", "Security awareness", "Usable security"] } ]`.

Top-level erb strings (copy E6's): `scenario_id` `awareness_e9_passwords`; `scenario_name` "Passwords and password managers: both sides"; `scenario_brief` = `strings.brief` (§8); `endGoal` "Run the guesser, then lock your own account down at the training kiosk."; `version` "1.0"; `disableAttacks` true; `startRoom` `training_room`; `startPosition` as E6.

### Defend-only shell: generator `EPISODES['e9']` entry (`gen_e8_e17_shells.py`, following the `gen_e6_e7_shells.py` `EPISODES['e6']` shape)

```python
'e9': {
    'frag': f'{AW}/e9/defend.json',
    'full_id': 'e9_passwords',
    'role_word': 'general',
    'role_label': 'all staff',
    'defend_set': 'e9_lock_it_down',
    'defend_host': 'nilesh',
    # No 'forms'/'check_hosts': E9 feeds general_v2, built by 10's own generator, not this one (see §14).
    'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
               'keywords': ['Passwords', 'Passphrases', 'Multi-factor authentication', 'Security awareness', 'Usable security']}],
    'defend': {
        'name': 'Passwords and sign-in: lock the account down',
        'brief': "You're on an authorised exercise at Tarrowby Logistics, a fictional company. Someone has a password of yours, from a breach of a site you forgot you used, and your phone is buzzing with prompts. Lock the account down: handle the prompts, choose stronger passwords, and don't hand anything to a message dressed up as IT. No real password is ever typed here.",
        'endGoal': 'Lock the account down at the training kiosk.',
        'aim': ('lock_down_aim', 'Lock your account down', 'Work through the sign-in prompts and password choices at the training kiosk.'),
        'task': ('lock_the_account', 'Lock your account down'),
        'kiosk': ("A touch-screen kiosk set up as your Tarrowby account under attack: sign-in prompts to handle and password choices to make.",
         "A touch-screen kiosk set up as your Tarrowby account. The prompts are handled and the account is locked down."),
        'display': 'Awareness E9: Passwords and password managers (defend only)',
        'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Your own account at Tarrowby Logistics, a fictional haulier, is under attack: sign-in prompts you didn't start, a message dressed up as IT, and password choices to make. Each answer is explained, and reporting when you're unsure is always fine and never marked down. No real password is ever typed.",
        'minutes': 8,
        'defendIntro': "Go through the sign-in prompts and password choices and decide what to do with each one. If you didn't start a prompt, deny it and report it. Pick the stronger option each time. There's no clock on you, and no real password is typed here.",
        'conclusion': ('Account locked down', "You've handled the prompts and chosen the stronger options, and finished this episode."),
    },
},
```

This `brief` is the same text as §13's defend-only brief (keep them identical). The defend-only shell id is `e9_passwords_defend`, prefix `episode_e9_passwords_defend_defend_` (§13). The defend-only `scopeNote` and `_defendOnly` strings are in the fragment (§13). The defend set `e9_lock_it_down` carries the ENG-09a `choice` cards (§11), so the generated shell validates only once ENG-09a lands; the generator itself invents nothing and raises no `KeyError`.

### Defend-host lines: generator `LINES[('e9', 'defend')]` (the tuple `(before, after, choice, reply)`, Nilesh's voice, as `gen_e6_e7_shells.py` `LINES`)

```python
('e9', 'defend'): (
    "Right, the kiosk's your own account now, with prompts coming in and a few password choices to make. Deny anything you didn't start, and pick the stronger option each time. No rush, and nothing you type here is real.",
    "That's it locked down, thanks. A different password for every account, kept in a manager, and deny what you didn't start: that's the whole of it.",
    'Thanks, Nilesh.', 'Any time.'),
```

### Host spoken lines for the full shell (ink, Nilesh)

- **Welcome** (at the hub): the §8 welcome line.
- **After the attack half** (on the kiosk hand-off into the defend half): "Good. One reused password opened his account, no clever cracking at all. Now it's your turn in the seat: your phone's buzzing, and someone has a password of yours."
- **On completion** (defend done): "That's both sides done. A different password for every account, kept in a manager, three random words where you must remember one, and deny what you didn't start. Nobody's ever in trouble for reporting."

## 9. Attack half (the guesser and reuse rig)

Not scored. The learner runs an authored guesser and reuse rig against Colin Mather, from his own public details, in the `guess` stage (ENG-02). **No real password is ever typed; the guesser is authored data and uses game words and made-up strings.** The engine surface is ENG-02; this section gives the content ENG-02's config must carry.

### OSINT facts (ids, sources)

Reuse a Tarrowby `tarrowby_site` and `tarrowby_social` in `osint` (profile `awareness`), modelled on E6's sites. Each `se_intel_*` global declared `false`.

| fact id | subject | source | fact text | feeds guess slot |
|---|---|---|---|---|
| `tarrowby_mather_role` | `colin` | `blk_warehouse_mgr` (team page, `kind: staff`) | "Colin Mather is Tarrowby's warehouse manager." | identifies the target |
| `tarrowby_mather_team` | `colin` | `post_mather_team` (social) | "Colin posts about supporting Pennington Rangers every Saturday." | `team` -> `pennington_rangers` |
| `tarrowby_mather_pet` | `colin` | `post_mather_pet` (social) | "Colin's photos of his dog Bramble." | `pet` -> `bramble` |
| `tarrowby_founded` | `company` | `blk_about` (about page) | "Tarrowby Logistics has run from the same West Yorkshire depot since 1994." | `year` -> `1994` |
| `tarrowby_mather_forum` | `colin` | `post_mather_forum` (social) | "Colin mentions he has been on the RiverReach Angling forum for years." | the reuse step: a breached forum password |

(All invented; "Pennington Rangers" is a fictional club, pre-ship web-search check with the other new names.)

### Guesser templates and slots (ENG-02 config, not the mail-template schema)

The guess list is assembled from slots that take only the collected facts, in the order attackers guess:

1. The common list first, struck through as "already tried": `123456`, `password`, `qwerty`, `tarrowby` (shown as the starting point, never a real credential).
2. Local patterns from the facts, one fact per slot (ENG-02 resolves one `factId` per slot): `{team}1994` (Pennington1994, from the team fact), `{pet}!` (Bramble!, from the pet fact), `Tarrowby{year}` (Tarrowby1994, from the founding-year fact). The fixed digits are baked into each template; a guess that needs two found facts at once is written as two slots.
3. **The reuse step:** Colin's RiverReach Angling password (from a breach of that forum) is tried on the Tarrowby work account and works. The red-flag meter notes reuse is the multiplier: one breach of a small site opens the work account.
4. A three-random-words passphrase (game words, e.g. "otter-ladder-crimson") is still being tried when the rig is switched off, to make the length point. It never "lands".

ENG-02 config E9 passes (field names match `02_ENGINE_WORK.md` ENG-02's `awarenessEpisode.guess` shape): each pattern slot reads **one** collected OSINT fact by `factId`, and `reuseStep.factId` and `landedGlobal` are declared ids.

```jsonc
"guess": {
  "target": "colin",
  "commonList": ["123456", "password", "qwerty", "tarrowby"],
  "patternSlots": [
    { "id": "team", "factId": "tarrowby_mather_team", "template": "{team}1994" },
    { "id": "pet",  "factId": "tarrowby_mather_pet",  "template": "{pet}!" },
    { "id": "year", "factId": "tarrowby_founded",     "template": "Tarrowby{year}" }
  ],
  "reuseStep": {
    "site": "RiverReach Angling", "domain": "riverreachangling.example",
    "factId": "tarrowby_mather_forum", "landsOn": "work",
    "note": "One breach of a small site opened the work account."
  },
  "passphraseDemo": { "words": ["otter", "ladder", "crimson"], "neverLands": true },
  "landedGlobal": "guess_e9_landed",
  "note": "No real password is typed here; every guess is made up."
}
```

Each slot's `template` interpolates **only its own fact** (ENG-02 resolves one `factId` per slot). A pattern that needs two facts at once (for example "team plus year") is written as two slots, or the fixed part is baked into the template, as above; do not reference another slot's token. The guesser's ticker and reasoning text are authored here, in the core_03 voice; no tool, method or working credential is shown. (If ENG-02 wants multi-fact templates instead, that is its decision; see the note to the ENG-02 owner in §20.)

### The one consequential choice quoted in the flip (aw2)

The lever the flip leans on is **reuse**: the same password on a hobby forum and the work account. The flip says a stolen password, not a clever crack, is what opened the account, and that a different password per account is what would have stopped it.

## 10. Flip

The learner's own account comes under a prompt flood, then a fake "IT" message offers a number to type "to make them stop". Reuse the authenticator demo's watch-only flood (the `mfaDecision` watch-only shape, `{ pushes, approvesAt }`, from `e3/attack.json`; `pushTemplate` copied with the account swapped to the learner). The flip shows that someone now has a password (the one the reuse step found), which sets up the defend half.

- `flipHeading`: "Now it's your phone." `flipIntro`: "You watched a reused password open a colleague's account. Here is the other end: your own phone, buzzing with sign-in prompts you didn't start, and a message from 'IT' telling you how to make them stop." Draft `flipDefenderLine`: "Someone has a password of yours, from a breach of a site you forgot you used. They can't get past your phone, so they are leaning on it: prompt after prompt, then a message dressed up as IT with a number 'to stop the prompts'. The number is on their screen, not IT's. Deny what you didn't start, and report it." Author `flipNoSend`/`flipMissed` variants in the E3 voice, ending "next, you lock the account down."

No new flip engine is needed; the flood is the existing authenticator watch-only mode.

## 11. Defend set

The defend half is a mix of **push/authenticator triage cards** (ordinary triageSet messages, like E3's push item) and **password-practice `choice` cards** (ENG-09a, the authored-choice triage kind). Both are messages in the one triage set and both record into `se_awareness_records`. Verify on where a card has a "check it" route. About 6 to 8 decisions. The triageSet id is `e9_lock_it_down`; episode prefix `episode_e9_passwords_defend_`.

The triageSet config follows E3: `scoringProfile: "awareness"`, `verifyVerdict: true`, `feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `reportAlwaysVisible: true`. `channelTells`: `["unrequested_mfa_push", "mfa_number_relay", "secrecy_or_bypass"]`. `unrequested_mfa_push` and `secrecy_or_bypass` are shared-library tells. **`mfa_number_relay` is scenario-local to E9**: only E9 scores it today, so declare it in `channelTells` with the `flagChips` label "A message asking you to type or read back a sign-in number or code" and a `factorStrings.mfa_number_relay.redFlag` sentence on the fake-IT card; do not append it to the shared `CHANNEL_TELLS`. The validator accepts it as a labelled, non-factor local id.

### Cards (id, kind, from/line, verdict, reasoning; which surface owns it)

| # | id | kind / surface | content | correct move | reasoning |
|---|---|---|---|---|---|
| 1 | `e9_push_own` | push (authenticator triage) | "Quayholt"-style push, account `you@tarrowby.example`, location "Leeds, UK", device "your own phone", immediately after you entered your password on the real depot sign-in | Approve | A prompt you started yourself, from where you are, is the normal second step. Approve it. (The genuine half of the mirror pair.) |
| 2 | `e9_push_unstarted` | push (authenticator triage) | Same app, account `you@tarrowby.example`, location "Unknown location, outside the UK", device "Windows PC", 02:40, when you were asleep | Deny and report | A prompt you did not start means someone has your password and is trying to get in. Deny it and report it; the service desk changes the password. `unrequested_mfa_push`. (Mirror of row 1.) |
| 3 | `e9_fake_it_number` | email or text (triage) | from a fake "Tarrowby IT" on a look-alike/freemail address: "We're getting failed sign-ins on your account. To stop the prompts, read back the number on your screen or tap Approve." | Deny / don't reply / report | No genuine IT team asks you to type a number, read back a code or approve a prompt. The number is on the attacker's screen. `mfa_number_relay`, `secrecy_or_bypass`. |
| 4 | `e9_passphrase` | `choice` (ENG-09a) | "Which is stronger?" Option A `words`: three random words (game words, e.g. "otter-ladder-crimson"); Option B `complex`: `Tarrowby2026!` (company name plus a year plus a symbol). | `words` (safe -> Report); `complex` (unsafe -> Trust). `truth.correct: "report"`, `isPhish: true` | Length and unpredictability beat complexity rules. `Tarrowby2026!` is on the guessers' patterns (the company name, a year, a `!`); another random word adds far more than a swap or a symbol. The strength meter is drawn as static authored bands (no live scoring of typed input, ENG-09a Stop-and-ask); the attack-half guesser shows why. |
| 5 | `e9_signup_password` | `choice` (ENG-09a) | A new Fuelr supplier portal sign-up asks for a password. Option A `unique`: a unique generated password from the manager; Option B `reuse`: "use my usual one". | `unique` (safe -> Report); `reuse` (unsafe -> Trust). `truth.correct: "report"`, `isPhish: true` | A unique generated password means a breach of Fuelr can't open anything else; the reuse rig in the attack half is the mirror. Reusing your usual password is exactly what the attack half exploited on Colin. |
| 6 | `e9_security_answer` | `choice` (ENG-09a) | The same Fuelr sign-up asks a security question, "mother's maiden name". Option A `madeup`: a made-up answer stored in the manager; Option B `true`: your real maiden name. | `madeup` (safe -> Report); `true` (unsafe -> Trust). `truth.correct: "report"`, `isPhish: true` | A true security answer can be found online or guessed from what you've posted, so a made-up one kept in the manager is safer. (A separate card from row 5 so each `choice` card holds one decision.) |
| 7 | `e9_signin_ladder` | `choice` (ENG-09a) | "This service offers three ways to sign in: a passkey, the authenticator app with number matching, or a text code. Pick the strongest it offers." Option `passkey` (safe); options `app` and `sms` (weaker). | `passkey` (safe -> Report); `app`/`sms` (weaker -> Trust). `truth.correct: "report"`, `isPhish: true` | A passkey only works on the real site, so it can't be phished or relayed; the app with number matching is next; a text code is a last resort but still better than a password alone. (Three options; only the passkey maps to Report, so choosing the app or the text code scores as a miss. Refresh as NCSC advice moves; passkeys became the first choice in April 2026.) |
| 8 | `e9_shared_pc` | `choice` (ENG-09a) | A depot PC with its password on a sticky note on the monitor, readable from the loading bay. Option `ask`: ask for your own account or the service desk; option `use_note`: use the note to sign in. | `ask` (safe -> Report); `use_note` (unsafe -> Trust). `truth.correct: "report"`, `isPhish: true` | A shared login means nobody knows who did what, the password spreads to anyone who walks past, and leavers keep access. Don't use a found password; ask the service desk. (Remaps the old warehouse scene; LO6.) |

Rows 1 and 2 are the explicit mirror pair (aw5): the same app and account, one started by you (Approve) and one you didn't (Deny and report), so "a prompt arrived" is not itself the tell. For every `choice` card (rows 4 to 8) the safe option maps to `report` (`truth.correct`), the unsafe option(s) to `trust`, and `truth.isPhish: true`, so the right move scores full and a wrong one scores zero (the mapping paragraph above). Cut row 7 or row 8 to reach six if the orchestrator prefers; keep rows 1 and 2 (the pair), at least one password card, and the fake-IT card.

**ENG-09a** owns the data shape for the `choice` cards (rows 4, 5, 6, 7, 8): each is a `choice` triage message, `rec.choice = { prompt, options: [{ id, label, verdict }], note? }` (ENG-09a's exact shape; **no `choice.correct`**, which ENG-09a does not define: the right option is the one whose `verdict` equals `truth.correct`, and ENG-09a lints that exactly one option matches), with a `truth` block, scored under the `awareness` profile. No free text. Any strength meter or vault-health view is drawn as static authored bands, not a live score of typed input (ENG-09a Stop-and-ask).

**Choice-to-verdict mapping and `truth`.** Each option maps to **one built verdict** (`trust`/`report`/`delete`/`verify`), and the chosen option is scored **exactly as that verdict scores** under `VERDICT_POINTS`/`KIND_VERDICT_POINTS` for the card's `truth.isPhish`. The card's `truth` carries the **correct verdict** in `truth.correct`, and `truth.isPhish` selects the scoring column. Every E9 `choice` card uses the same vehicle so a right move earns full marks and a wrong one scores zero (a clean miss): set `truth.isPhish: true`, map the **safe** option to `report` (phish Report = 60, full marks, the protective move) and the **unsafe** option to `trust` (phish Trust = 0, the miss), and set `truth.correct: "report"`. This is the same convention the defend set uses (Report the risky thing scores full; Trust it scores zero), so the measurement stays consistent; `truth.isPhish: true` is only the scoring vehicle and marks the unsafe option, not a claim that the card is a phishing message. No Verify button shows on a `choice` card (it is a two-option decision, not a message to ring back). A card holds **one** decision only, which is why the sign-up decisions are split into rows 5 and 6 below.

Worked example (row 4), using **ENG-09a's exact field names**: `choice` is `{ prompt, options: [{ id, label, verdict }], note? }` with no `correct`; `truth` carries only schema-legal keys (`scenario-schema.json` `truth` is `additionalProperties: false` and ENG-09a adds just `truth.correct`), so there is no `truth.whyRight`/`truth.ifWrong`. The "why right" copy goes in `truth.reportReply` (the safe option maps to `report`) and the "if wrong" copy in `truth.ifTrusted` (the unsafe option maps to `trust`), exactly as an ordinary defend item carries them:

```jsonc
{
  "id": "e9_passphrase",
  "kind": "choice",
  "choice": {
    "prompt": "Which is stronger?",
    "options": [
      { "id": "words",   "label": "otter-ladder-crimson (three random words)", "verdict": "report" },
      { "id": "complex", "label": "Tarrowby2026! (company name, year, symbol)", "verdict": "trust" }
    ],
    "note": "These are made up; no real password is typed."
  },
  "truth": {
    "isPhish": true,
    "flags": [],
    "correct": "report",
    "reportReply": "Length and unpredictability beat complexity rules. Tarrowby2026! is on the guessers' patterns; another random word adds far more than a symbol.",
    "ifTrusted": "A company-name-plus-year-plus-symbol password is near the top of every guess list."
  }
}
```

ENG-09a lints that exactly one option's `verdict` equals `truth.correct` ("report", the `words` option here) and that `truth.correct` is the full-marks verdict for `truth.isPhish`, so the engine derives the right option from `truth.correct` and the option verdicts; the card needs no `choice.correct`. This spec gives the content; ENG-09a gives the fields. Rows 1 to 3 are ordinary triageSet messages (copy the `e3_push_early` `push` shape for the push cards).

## 12. Debrief cards

Built debrief view, core_03 order:

1. A reasoning card per card above.
2. Genuine-item feedback (row 1, the started prompt; row 5's generated-password choice shown as vault health).
3. The team-protected tally (aw6).
4. **The habit to keep** (shared, word for word, copied from the built shell, not rewritten): "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do." ("read back a code" and "grant access" are the password/MFA case directly.)
5. **The "On Monday" card as three things to do at home tonight** (core_03 game_design): "On Monday, three things at home: turn on 2-step verification, or a passkey, for your personal email first; check your personal email address on a breach-checking site (the NCSC suggests Have I Been Pwned); and switch on a password manager, starting with your email. Report anything at work using the route in the box below." (`debrief.mondayCard: "slot:customer_report_route"` fills the final clause.)
6. The customer report route (slot).
7. **The no-blame line** (`debrief.noBlameLine: true`). Draft: "Reusing a password is ordinary and common; this is how most accounts are broken into, not a sign anyone was careless. A miss here just shows what to change tonight."

Concept cards (short, core_03): how passwords are stolen; the sign-in ladder; browsers, notes and managers; what a passkey is. Author in the concepts.md voice, as entries in **ENG-09b**'s array form of `strings.conceptPanel` (the built `conceptPanel` is a single panel, so more than one card needs ENG-09b).

## 13. Defend-only variant

Shell id `e9_passwords_defend`, stages `["brief", "defend", "debrief"]`, same defend set `e9_lock_it_down`, prefix `episode_e9_passwords_defend_defend_`. Put the defend-only `brief` and `scopeNote` under `awarenessEpisode._defendOnly`. Draft defend-only brief: "You're on an authorised exercise at Tarrowby Logistics, a fictional company. Someone has a password of yours, from a breach of a site you forgot you used, and your phone is buzzing with prompts. Lock the account down: handle the prompts, choose stronger passwords, and don't hand anything to a message dressed up as IT. No real password is ever typed here." Both variants join both seeded Hacktivity courses (follow `01_PIPELINE.md` P12 for the seeding; do not use `awareness_deploy.py`). **The defend-only variant needs ENG-09a** (the `choice` password cards), not ENG-02; the full variant also needs ENG-02 for its `guess` attack half.

## 14. Check-form items it feeds (see 10_CHECK_FORMS.md)

E9's topic (core_03 passwords and MFA) feeds the new **`general_v2`** check-form pair, built by `10_CHECK_FORMS.md` (the settled two-pair scheme; there is no separate password form). Do not edit the six built role forms. `general_v2` item 3 (MFA/password-manager rollout) and item 4 (the unrequested push) already carry E9's measurable content as ordinary `email`/`push` triage items. The password-practice `choice` cards (rows 4 to 8) are an episode defend-half surface and are **not** carried into a check form: `general_v2` scores only the shared-library flags on triage-shaped items, and a `choice` card's "right move" is not one of those flags, so the passphrase/sign-up/ladder cards stay defend-set only. There is no form-building engine packet; `general_v2` is built by `10`'s generator. Keep `passPercent` 0.

## 15. Files to create or change

- `planning_notes/phishing_and_social_engineering/awareness/e9/attack.json` (new): people, intelFacts, osint sites, and the `guess` config (the guesser templates, the reuse step, the passphrase demo).
- `planning_notes/phishing_and_social_engineering/awareness/e9/defend.json` (new): the triageSet `e9_lock_it_down` (push and fake-IT cards as ordinary messages, plus the ENG-09a `choice` cards rows 4 to 8), the `awarenessEpisode` block (`strings`, `_defendOnly`, `debrief`), and a `_brandAdditions` note for RiverReach Angling and Pennington Rangers.
- `scenarios/awareness_e9_passwords/scenario.json.erb`, `mission.json`, `ink/nilesh_solanki.ink` (new): the full-episode shell. Frame it from E1 (the `01_PIPELINE.md` P2 rule: a mail/OSINT episode copies the E1 shell frame and host-ink structure), add the Tarrowby room from P5a, and take the `guess` attack block from ENG-02; E6 is the reference only for the built Tarrowby room wiring and cast, not the stage shape (E6 has no `guess` stage). Globals to declare: `episode_e9_passwords_state: {}`, `se_awareness_records: []`, `episode_e9_passwords_defend_{percent,reportRate,done,pass}`, `se_osint_state: {}`, `se_intel_tarrowby_mather_role/_team/_pet/_forum`, `se_intel_tarrowby_founded`, plus the `guess_e9_landed` global (ENG-02's `landedGlobal`) and any other `guess_*` state globals ENG-02 defines. The host ink completes the attack task on `guess_e9_landed` and the conclusion task on `episode_e9_passwords_defend_done === true`.
- `scenarios/awareness_e9_passwords_defend/` (new): the defend-only shell.
- The two seeded Hacktivity courses: follow `01_PIPELINE.md` P12 (feature level only); do not use `awareness_deploy.py` for seeding.
- ENG-02 (attack-half `guess`) and ENG-09a (`choice` cards) engine work: owned by those packets.

## 16. Bridge script outline

`tools/playtest/se/bridge-e9-full.jsonl` (and defend-only), modelled on the existing bridges and whatever test hooks ENG-02 exposes for the guesser and ENG-09a for the `choice` cards. Steps: brief; OSINT collects Colin's five facts; the guesser assembles the list and the reuse step lands; the flip plays the flood; defend handles each card on the critical path (Approve row 1, Deny-and-report rows 2 and 3, the strong choice on rows 4 to 8); conclude on `episode_e9_passwords_defend_done`. Run through `check-bridge.mjs` and `run-suite.sh`. The bridge depends on ENG-02's test bridge for the guesser and ENG-09a's for the `choice` cards.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e9_passwords/scenario.json.erb` passes (and the defend-only shell).
- The social validators pass, including any ENG-02 additions and the scenario-local `mfa_number_relay` tell (declared in `channelTells` with a `flagChips` label) being accepted.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` passes.
- The shared rule-of-thumb test passes (habit string byte-identical).
- The bridge suite passes including `bridge-e9-full.jsonl`.
- Manual: no free-text password field appears anywhere; the strength meter does not score `P@ssw0rd!` as strong for symbols; the flood is calm (no alarms, and under reduced motion the phone does not shake); the guesser never shows a working credential; the episode runs in about 15 minutes.

## 18. Do not

- Never collect or store a real password; word tiles and made-up strings only; say so on screen.
- No fake precision on the strength meter ("3.4 billion years"); use an established estimator's rough bands.
- Don't reward complexity rules, and don't blame the player for past reuse.
- Don't add a cold caller asking for codes (that is core_02); the only IT pressure is the one fake-IT message, as in E3.
- Don't edit the six built role check forms, the generators, or the shared rule-of-thumb string.
- Don't run a generator into the repo, `git stash`, or add attribution lines.
- No real brands, people or non-`.example` domains; no homographs; no Hacktivity internals.

## 19. Stop and ask if

- ENG-09a is not available (both the full and defend-only variants need it for the `choice` cards; the full variant also needs ENG-02 for the `guess` attack half). There is no partial ship as there is for E8.
- The stage-order lint will not allow `brief osint guess flip defend debrief` with no `write`, and ENG-08 cannot relax it.
- ENG-02's single-fact-per-slot template model cannot express a needed guess pattern and multi-fact templates are refused (see §20).

## 20. Open questions

1. **ENG-02 template model.** The `awarenessEpisode.guess` block uses ENG-02's shape (§9), with one `factId` per pattern slot and the fixed digits baked into each template. If ENG-02 would rather support multi-fact templates (a token from another slot's fact), that is its decision; E9's content works either way.
2. **Attack target.** Colin Mather (built cast) is used as the guess target. Confirm, or pick another Tarrowby depot colleague (Kaylee Dunford, Callum Whiteley).
3. **New names.** RiverReach Angling (`riverreachangling.example`) and Pennington Rangers need the pre-ship web search and a BRAND_SET note; Fuelr is reused from E6 (confirm its domain).
4. **Item count.** Eight decisions drafted (rows 1 to 3 plus the five `choice` cards after splitting the sign-up card, §11); the floor of six keeps rows 1 and 2 (the pair), one password card, and the fake-IT card.
