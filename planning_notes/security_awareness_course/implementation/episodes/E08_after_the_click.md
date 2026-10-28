# E8 after the click (implementation spec)

Status: draft for a Sonnet implementer. This is the **pilot**: the first new awareness episode, chosen because it fits the built runner stages almost exactly and proves the new-episode pipeline end to end. Keep it as close to the built E1 and E5 shells as possible. The one engine dependency is **ENG-01** (the flip variant); everything else is content the implementer authors by copying built keys.

Writer: opus48 agent. Never run a generator into the repo. Never `git stash`. No attribution lines in commits (the orchestrator commits).

---

## 1. Goal and module(s)

Teach what to do in the first minutes after a click, and the signs that an account is already being used by someone else. E8 carries **core_04** (spotting and reporting incidents) and **core_01 LO6** (the first steps after clicking a link, opening an attachment or typing a password) together. The lesson is the module title: most of the damage happens between noticing and reporting, so the right first move for every real sign is the same, report it through a route you trust and leave the device as it is.

Behaviours scored (from `modules/core_01_phishing_email/assessment.md`): C01-B6 (takes the first steps after a click), C01-B7 (reports their own click or sign-in), plus core_04 LO1, LO2, LO5, LO6.

## 2. Read first (exact paths)

- This folder's shared brief: `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md`.
- Teaching source of truth: `planning_notes/security_awareness_course/modules/core_04_spotting_and_reporting_incidents/concepts.md` (the whole file); `modules/core_04_.../game_design.md` (the E8 design); `modules/core_01_phishing_email/game_design.md` (the E8 section) and `modules/core_01_.../assessment.md` (C01-B6, C01-B7, C01-Q4, C01-Q7).
- The nearest built episode, end to end: **E1** `scenarios/awareness_e1_invoice_fraud/` (same stage list, same "attack with no built link" shape) and **E5** `scenarios/awareness_e5_signin_pages/` (same company, same host room). Read their `scenario.json.erb`, `mission.json` and `ink/*.ink`, and the fragments `planning_notes/phishing_and_social_engineering/awareness/e1/{attack,defend}.json` and `.../e5/{attack,defend}.json`.
- Shapes and ids: `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` (factor library and the shared channel-tell library, around the "Channel tells" table; triageSet `truth` shape; `EvalResult`; §10a email identity).
- Companies and cast: `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` (Quayholt Insurance roster and `_brandAdditions`); `planning_notes/security_awareness_course/03_WORLD_AND_CAST.md` (hosts table; the E8 row names Anjali Rao).
- The runner stage list: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS`, `DEFAULT_STAGES`, `flipPage`/`flipCall`).
- Engine packet: `planning_notes/security_awareness_course/implementation/02_ENGINE_WORK.md`, packet **ENG-01**.

## 3. Depends on

- **ENG-01** (flip aftermath: the learner sits in the seat of the victim whose account is now in use). This is the only hard engine dependency. See §10 for exactly what it must do and what config E8 passes it. E8 uses ENG-01's `flipAftermath` (inline items) and `stepLabels`, plus ENG-01's optional `flipAftermath.victimName` (Round 1 ruling 3).
- **ENG-09b** (debrief panel list). E8's debrief shows two concept cards (§12), and the built `strings.conceptPanel` is a single panel; ENG-09b adds the array form that lets E8 author both. Add it to the build order before E8's full variant.
- **ENG-08** (shared channel-tell additions) for the three account-takeover and malware signs (see §11). `unexpected_sent_item`, `unrequested_reset` and `ransomware_note` are in the **shared library** (`CHANNEL_TELLS` in both `systems/phish-rules.js` and `scripts/validate_social/triage.rb`, append only); they are already listed in ENG-08's tell table (added in Round 1) with the canonical strings quoted in §11. Per Round 1 ruling 1, whether these feed `general_v2` is `10`'s balance decision (§14); the shared id makes it possible either way.

## 4. Owner models

- Content writing and dialogue review: `opus48`.
- The shell wiring (copying the fragment into `scenario.json.erb`, `mission.json`, the host ink, globals, objectives, the Hacktivity deploy) and ENG-01: general-purpose or Sonnet, after the content is approved.
- **Gate before wiring starts (01 P2):** §8b (shell and generator metadata), §9's attack-fragment skeleton, §11's defend items and §10's flip block must all be final strings before a Sonnet begins P2. They are given in full here, so the pilot needs no guessing (Round 2 ruling 5).

## 5. Company, room and host

- **Company:** Quayholt Insurance (`quayholt_insurance`). Brand block, copied exactly from the built E5 shell: `{ "name": "Quayholt Insurance", "logoText": "QUAYHOLT", "accent": "#6b4c9a" }`.
- **Room:** reuse the built `room_aw_quayholt` training room, exactly as `scenarios/awareness_e5_signin_pages/scenario.json.erb` wires it (`"type": "room_aw_quayholt"`, `chatBackground": "assets/backgrounds/rooms/aw_quayholt_blended.png"`, the same lighting block, the kiosk object). No new room.
- **Host:** **Anjali Rao**, information security analyst, `anjali.rao@quayholt.example` (built Quayholt cast; she is the genuine sender of `hb_policy_refresh` in `e3/defend.json` and is named in BRAND_SET §3 Quayholt). She is the analyst who receives reports, which is why she hosts an incident-reporting episode. No new cast member for the host.
- **Role:** `general_staff` (as E5).
- **Victim seat / attack target:** **Ayaan Warsame**, claims handler, `ayaan.warsame@quayholt.example` (built Quayholt cast: a claims handler who appears in the E5 check forms and is the genuine caller of `ha_call_printer` in `e3/defend.json`, so his role and address are established). Note the E5 `_brandAdditions` note describes him as "the colleague fooled in the flip line", but the shipped E5 flip strings (`e5/defend.json` `flipDefenderLine`/`flipIntro`) actually name **Hana Novak** as the colleague the page was sent to, so that note is stale; E8 does not rely on it, and uses Ayaan only because he is an established Quayholt claims handler. The learner phishes Ayaan in the attack half, and after the flip sits in Ayaan's seat for the defend half. Reusing Ayaan avoids a new name and keeps Hana Novak (E5's victim) from being phished twice across the product. (Ayaan is not an `e3` voicemail caller; he is a genuine `call` caller. The two E3 voicemails are `ha_vm_locked` from Hana Novak and `hb_vm_locked` from Reuben Ofori, who is reused as the genuine colleague in defend-set row 4.)

No new cast names are introduced by E8. All people and the company are fictional; every address ends `.example`.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | Notes |
|---|---|---|
| brief | 1.0 | Anjali's welcome and the scope note. |
| osint | 3.0 | Two public sources; four facts. As E1's OSINT, lighter. |
| write | 3.5 | One credential-phish email in the mail client, template mode, red-flag meter. No build stage, no working link (as E1). |
| flip | 1.5 | ENG-01: the click, then the learner becomes Ayaan and sees the first odd sign. |
| defend | 4.0 | The signs-that-follow set, about 6 to 7 items, Verify on, immediate feedback. |
| debrief | 2.0 | Reasoning cards, the two E8 concept cards, the tally, the habit, the "On Monday" card, the report route, the no-blame line. |

Defend-only variant: brief, defend, debrief, about 8 minutes.

## 7. Stages (runner stage ids)

Full episode: `["brief", "osint", "write", "flip", "defend", "debrief"]`. This is **identical to the built E1 stage list** (`awareness_e1_invoice_fraud` uses the same, via `DEFAULT_STAGES.full`), which is why E8 is the pilot: no `build` stage, no `mfa` stage. The only stage that behaves differently from E1 is `flip`, handled by ENG-01 (§10).

Defend-only: `["brief", "defend", "debrief"]`.

All ids are from the frozen `STAGE_IDS` in `episode-model.js`. E8 adds no new stage id.

## 8. Brief and scope note (the host's draft lines; the dialogue reviewer polishes)

- **Episode id:** `e8_after_the_click`. Defend-only shell id: `e8_after_the_click_defend`.
- **`awarenessEpisode.strings.brief`:** "You're on an authorised exercise at Quayholt Insurance, a fictional company. First you're on the red team: look at what's public about a Quayholt colleague, then write one email, dressed up as the IT service desk, that asks them to sign in again. Then you swap seats. The colleague clicked, and now you're the one whose account is being used. Sort the signs that follow. Only that second part is scored."
- **`scopeNote`:** "Authorised exercise at Quayholt Insurance, a fictional company. In scope: one email to a Quayholt colleague, and the signs that follow in that colleague's inbox. Nothing you write leaves the game."
- **Anjali's welcome (host ink, resting at the hub, following the E5 `niamh_doherty.ink` pattern):** "Welcome to the Quayholt exercise. Everyone clicks something eventually, so today is about the ten minutes after, and how one quick report changes the ending. Start at the kiosk: write the email first, then take the other seat and sort what turns up."
- **Red team lead seeded brief** (the `brief` message in `mailClient.seededMessages`, copy the E1/E5 shape and the `avatar": "npc_neutral"`): from "Red team lead" `lead@redteam.example`, to `analyst@quayholt.example`, subject "Authorised exercise: Quayholt Insurance", body: "Hello,\n\nThis is the authorised Quayholt Insurance exercise. In scope: this inbox and the colleague on it. Research the service desk notices staff act on, then write one message asking a colleague to sign in again. Nothing leaves this account.\n\nRed team lead".

## 8b. Shell and generator metadata (every value final; no guessing)

This section gives, as final strings, every metadata value the shell wiring (01 P2/P3) and the generator (01 P4, `gen_e8_e17_shells.py`) need, so a Sonnet implementer invents nothing (Round 2 ruling 5, R2_sonnet M1 / R1_sonnet M4, m8). Copy the shapes from the built **E5** erb and **`gen_e3_e5_shells.py`**, which is the generator that actually holds Anjali's `HOSTS` entry; 01 P4's "copy the e6/e7 generator" pointer is to be corrected to `gen_e3_e5_shells.py` for the Anjali/Quayholt helpers (a request to the 01 fixer, since 01 is out of this file's scope).

### Host and learner sprites (m8)

- **Anjali Rao's `HOSTS['anjali']` entry already exists in `gen_e3_e5_shells.py`** and is copied verbatim into `gen_e8_e17_shells.py`: `{ 'id': 'anjali_rao', 'displayName': 'Anjali Rao', 'sprite': 'female_scientist', 'about': "Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the reports (BRAND_SET.md). Placeholder sprite until the PixelLab reset." }`.
- **Anjali's in-scenario host NPC sprite keys** (full erb `rooms.training_room.npcs[]`, following the E5 host NPC shape): `"spriteSheet": "female_scientist_v2"`, `"spriteTalk": "assets/characters/female_scientist_talk.png"`, `"spriteVisemes": "assets/characters/female_scientist_visemes.png"`, `"npcType": "person"`, `"id": "anjali_rao"`, `"displayName": "Anjali Rao"`, `"storyPath": "scenarios/awareness_e8_after_the_click/ink/anjali_rao.json"`, `"currentKnot": "start"`. Host art is a placeholder until the PixelLab reset.
- **Learner avatar** (full erb `player`), as E5: `"spriteSheet": "female_office_worker_v2"`, `"spriteTalk": "assets/characters/female_office_worker_talk.png"`.

### Full-episode objectives (full erb `objectives[]`, copy the E5 two-aim shape)

| field | aim 1 (red team) | aim 2 (defend, `missionConclusion: true`) |
|---|---|---|
| `aimId` | `red_team_aim` | `used_account_aim` |
| `title` | "Send the takeover email" | "Sort the signs that follow" |
| `description` | "Research a Quayholt colleague, then write one email dressed up as the IT service desk asking them to sign in again." | "Work through the signs in the colleague's account at the training kiosk." |
| `order` | 0 | 1 |
| task `taskId` / `title` / `type` | `send_takeover_phish` / "Send your email to the colleague" / `manual` | `sort_the_signs` / "Sort the signs that follow" / `custom` |

Aim 2 `concludeRequires.globals`: `["episode_e8_after_the_click_defend_done"]`. Aim 2 `conclusionScreen`: `{ "type": "success", "title": "After the click episode done", "body": "You've seen both sides of a click: you sent one email, then sat in the colleague's seat and sorted the signs that followed in their account, so this episode is finished." }`.

### Full-episode training kiosk (full erb `rooms.training_room.objects[]` kiosk, copy the E5 shape)

- `observations`: "A touch-screen training kiosk for the Quayholt after-the-click exercise: first the red-team brief, research and the one email to write, then the signs to sort in the colleague's account."
- `observationVariants[0]`: `{ "condition": "globalVars.episode_e8_after_the_click_defend_done", "value": "A touch-screen training kiosk for the Quayholt after-the-click exercise. The email is sent and all the signs are sorted." }`
- `minigameData.episodeId`: `e8_after_the_click`.

### Full-episode `mission.json` (copy the E5 mission.json shape)

- `display_name`: "Awareness E8: After the click (full episode)"
- `description`: "An awareness episode of about 15 minutes for all staff. On an authorised exercise at Quayholt Insurance, a fictional company, you first play the attacker: research a colleague and send one email dressed up as the IT service desk. Then you swap seats into that colleague's account, now being used by someone else, and sort the signs that follow. Only the second part is scored, and reporting when you're unsure is always fine and never marked down."
- `difficulty_level`: 1; `scoring`: "completion"; `secgen_scenario`: null; `collection`: "training"; `ui_theme`: "general"; `estimated_duration_minutes`: 15.
- `cybok`: `[ { "ka": "HF", "topic": "Human Factors", "keywords": ["Phishing", "Incident reporting", "Security awareness", "Usable security"] } ]`.

Top-level erb strings (copy E5's): `scenario_id` `awareness_e8_after_the_click`; `scenario_name` "After the click: both sides"; `scenario_brief` = `strings.brief` (§8); `endGoal` "Send the email, then sort the signs in the colleague's account at the training kiosk."; `version` "1.0"; `disableAttacks` true; `startRoom` `training_room`; `startPosition` as E5.

### Defend-only shell: generator `EPISODES['e8']` entry (`gen_e8_e17_shells.py`, following the `gen_e3_e5_shells.py` `EPISODES['e5']` shape)

```python
'e8': {
    'frag': f'{AW}/e8/defend.json',
    'full_id': 'e8_after_the_click',
    'role_word': 'general',
    'role_label': 'all staff',
    'defend_set': 'e8_used_account',
    'defend_host': 'anjali',
    # No 'forms'/'check_hosts': E8 feeds general_v2, built by 10's own generator, not this one (ruling 1, §14).
    'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
               'keywords': ['Phishing', 'Incident reporting', 'Security awareness', 'Usable security']}],
    'defend': {
        'name': 'After the click: the signs that follow',
        'brief': "You're on an authorised exercise at Quayholt Insurance, a fictional company. A colleague clicked a convincing email and signed in, and now their account is being used. You're covering their inbox. Some of what turns up is a real sign that something is wrong, and some is ordinary. Sort it, and report or check anything that doesn't sit right. Reporting when you're unsure is always fine and never marked down.",
        'endGoal': 'Sort the signs in the colleague\'s inbox at the training kiosk.',
        'aim': ('used_account_aim', 'Sort the signs that follow', 'Work through the signs in the colleague\'s inbox at the training kiosk.'),
        'task': ('sort_the_signs', 'Sort the signs that follow'),
        'kiosk': ("A touch-screen kiosk showing the colleague's Quayholt inbox after a click: a handful of signs to sort.",
         "A touch-screen kiosk showing the colleague's Quayholt inbox after a click. The signs are all sorted."),
        'display': 'Awareness E8: After the click (defend only)',
        'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. Sit in a colleague's seat at Quayholt Insurance, a fictional company, after they clicked a convincing email: some of what turns up in their account is a real sign that something is wrong, and some is ordinary. Each answer is explained, and reporting when you're unsure is always fine and never marked down.",
        'minutes': 8,
        'ending': ('Signs sorted', "You've sorted the signs in the colleague's inbox and finished this episode."),
    },
},
```

This `brief` is the same text as §13's defend-only brief (keep them identical). The defend-only shell id is `e8_after_the_click_defend`, prefix `episode_e8_after_the_click_defend_defend_` (§13). The defend-only `scopeNote` and `_defendOnly` strings are in the fragment (§13).

### Defend-host lines: generator `LINES[('e8', 'defend')]` (the tuple `(before, after, choice, reply)`, Anjali's voice, as `gen_e3_e5_shells.py` `LINES`)

```python
('e8', 'defend'): (
    "You're covering a colleague's inbox this morning. They clicked a convincing email and signed in, and now someone else is using their account. Some of what's turned up is a real sign; some is ordinary. Take each one as it comes, and report or check anything that doesn't sit right.",
    "That's the inbox sorted, thanks. The one move that works for every real sign is the same: report it and leave it be.",
    'Thanks, Anjali.', 'Any time.'),
```

### Host spoken lines for the full shell (ink, Anjali)

- **Welcome** (at the hub): the §8 welcome line.
- **After the attack half** (on the kiosk hand-off into the defend half): "Good. The email's gone, and your colleague fell for it, the way most people eventually do. Now take their seat and see what someone else is doing with their account."
- **On completion** (defend done): "That's both sides done: you sent the email, then you sorted what it set off. The one move that works for every real sign is the same, report it and leave it be. Nobody's ever in trouble for reporting."

## 9. Attack half

E1-shaped: OSINT, then one email in the mail client (template mode, red-flag meter), no build stage and no working link. The learner impersonates the Quayholt IT service desk and emails Ayaan a "sign in again" credential phish. Scored: false.

### OSINT facts (ids, sources, provides)

Reuse the E5 Quayholt sites `quayholt_site` and `quayholt_social` (`osint.profile: "awareness"`). Four facts, modelled on `e5/attack.json`. New `se_intel_*` globals must each be declared `false` in `globalVariables` (see §15).

| fact id | subject | source element | fact text | provides |
|---|---|---|---|---|
| `quayholt_it_desk` | `itdesk` | `blk_itdesk` (IT page, `kind: field`) | "Quayholt's IT notices to staff come from the service desk, it-servicedesk@quayholt.example." | `name`/sender `itdesk_full` "Quayholt IT Service Desk" distinctive; `address` fixed `itdesk_address` "it-servicedesk@quayholt.example" distinctive |
| `quayholt_sso_migration` | `itdesk` | `blk_news` (news page) | "Quayholt is moving single sign-on to a new provider this month; staff were told they may be asked to sign in again." | `reference` `sso_migration` "the SSO move this month" distinctive |
| `quayholt_staff_claims` | `ayaan` | `blk_staff` (team page, `kind: staff`) | "Ayaan Warsame is a claims handler at Quayholt, ayaan.warsame@quayholt.example." | (none; identifies the target) |
| `quayholt_ayaan_busy` | `ayaan` | `post_ayaan` (social) | "Ayaan posted that the claims team is flat out clearing a backlog this week." | (none; supplies the hurry) |

`quayholt_it_desk` and `quayholt_sso_migration` are the same two facts the built E5 attack uses (copy their `reduceNote` text verbatim from `e5/attack.json`). `people`: `ayaan` (cast), `itdesk` (outside, display "Quayholt IT Service Desk", address `it-servicedesk@quayholt.example`), as in E5.

### Templates and slots

Copy the E5 template shapes (`e5/attack.json`). From line names a sender name and address; the pretext references the SSO move; the ask says "sign in again". Provide a calm variant and an off-topic decoy so the red-flag meter has something to flag.

- `e8_from` (part `from`): `"{sender_name} <{sender_address}>"`, slots `sender_name` (name, about sender), `sender_address` (address).
- `e8_greet` (part `greeting`): `"Hello,"`, no slots.
- `e8_pretext_reauth` (part `pretext`, urgency high): "We are moving the {portal} to a new provider and your session has ended. Please sign in again today to keep your access while the claims backlog is cleared." slot `portal` (reference, about portal) taking `sso_migration`.
- `e8_pretext_reauth_calm` (part `pretext`, urgency low): "We are moving the {portal} to a new provider this month, so you may be asked to sign in again. When you have a moment, please sign in to confirm your access." slot `portal`.
- `e8_pretext_newsletter` (part `pretext`, urgency low): "Here is this month's staff newsletter from around Quayholt." no slots. (the off-topic decoy)
- `e8_ask` (part `ask`, urgency medium): "Sign in through the link before the end of the day." no slots.
- `e8_ask_calm` (part `ask`, urgency low): "There's no rush: sign in when it next suits you." no slots.

Note: because E8 has no `build` stage and no landing page, the ask names "the link" in prose only; there is no payload-kit link item and `linkCredible` is not a factor here (contrast E5, which does build a page). Keep the mail client config as E1's (`"bodyMode": "templates"`, `"freeTextFlavour": false`, `"showRedFlagMeter": true`, `"checklistTiming": "onSend"`).

### phishTarget `takeover_victim` (the attack target; copy the E5 `sso_staff` shape, drop the link factor)

- `id`: `takeover_victim`; `address`: `ayaan.warsame@quayholt.example`; `displayName`: "Ayaan Warsame"; `role`: "Claims handler".
- `subjects`: `{ "id": "s_signin", "text": "Action needed: sign in again", "topic": "it" }` and `{ "id": "s_other", "text": "Quick note", "topic": "general" }`.
- `interests`: `{ "topics": ["it"] }`. `emailReplyDelay`: 6. `redFlagMeter`: true. `urgency`: `{ "advisoryMax": "medium" }`.
- `templateSets`: from `["e8_from"]`, greeting `["e8_greet"]`, pretext `["e8_pretext_reauth", "e8_pretext_reauth_calm", "e8_pretext_newsletter"]`, ask `["e8_ask", "e8_ask_calm"]`.
- `primedFor`: `{ "distinctiveValues": ["sso_migration"], "minDistinct": 1, "trusts": ["itdesk"], "story": "an IT notice to sign in again while single sign-on is moved to a new provider" }`.
- `requiredFactors`: `["senderTrust", "pretextRelevant"]`. `advisoryFactors`: `["urgencyCalibrated"]`. (No `linkCredible`, no `senderAuth` build; this keeps E8 at E1's complexity.)
- `factorStrings`: author `open`, `senderTrust`, `pretextRelevant`, `urgencyCalibrated` in the E5/E1 voice. Draft `senderTrust.redFlag`: "The From line carries the service desk's real address, so it reads as the IT notice Ayaan acts on, but it was forged: the service desk never sent it."
- `replies`: `landed`: "Thanks, I'll sign in now before the backlog meeting." `missed`: "I don't sign in from an email link. I'll go to the portal the normal way and check with the service desk."
- `hints`: three, in the E5 voice (which address staff trust for IT notices; what change makes an unexpected sign-in read as expected; keep the ask calm so the meter does not flag urgency).
- `outcome`: `{ "setGlobal": { "phish_takeover_victim_landed": true } }`.

### Red-flag meter factors

`senderTrust` (spoofing the IT service desk), `pretextRelevant` (tie to the SSO move), `urgencyCalibrated` (advisory; the "today" push). No `linkCredible`, no `senderAuth`.

### The one consequential choice quoted in the flip (aw2)

The choice the flip replays is the **sender**: setting the From line to the Quayholt IT service desk's real address (`itdesk_full` + `itdesk_address`) rather than the learner's own, so it reads as the IT notice Ayaan already acts on. That is the single lever that made Ayaan sign in, and the flip quotes it.

### Attack fragment skeleton (`e8/attack.json`): the exact changes against `e5/attack.json` (R2_sonnet M2)

Copy `e5/attack.json` and make exactly these changes, so no block is left dangling and nothing is invented. E8 has **no landing page and no build stage**, so delete E5's `landingPages`, `payloadKit`, `conceptCards`, the `expectedLink`/`linkCredible`/`senderAuth` build parts, and crucially **the `quayholt_sso_portal` fact and the `blk_sso` block that references it** (without this deletion, copying E5's OSINT site leaves `blk_sso` pointing at a fact E8 does not carry, R2_sonnet M2's dangling reference).

- **`people`**: replace E5's Hana with Ayaan; keep `itdesk`.
  - `{ "id": "ayaan", "kind": "cast", "address": "ayaan.warsame@quayholt.example", "forms": { "first": "Ayaan", "formal": "Mr Warsame", "full": "Ayaan Warsame" } }`
  - `{ "id": "itdesk", "kind": "outside", "address": "it-servicedesk@quayholt.example", "forms": { "first": "IT Service Desk", "full": "Quayholt IT Service Desk" } }` (copied verbatim from E5)
- **`intelFacts`** (exactly four; §9's fact table is the source for the strings): `quayholt_it_desk` and `quayholt_sso_migration` copied **verbatim from E5** (text, subject `itdesk`, source, `provides`, `reduceNote`); `quayholt_staff_claims` with `subject: "ayaan"`, `source: "blk_staff"`, text "Ayaan Warsame is a claims handler at Quayholt, ayaan.warsame@quayholt.example.", `provides: []`; `quayholt_ayaan_busy` with `subject: "ayaan"`, `source: "post_ayaan"`, text "Ayaan posted that the claims team is flat out clearing a backlog this week.", `provides: []`. **Delete `quayholt_sso_portal`.**
- **`templates`**: the seven E8 templates in §9 ("Templates and slots"), replacing E5's `e5_*` ids with the `e8_*` ids (same `part`/`slots`/`urgency` shape).
- **`osint.sites`**: `quayholt_site` with three pages, each block's `fact` present in `intelFacts`:
  - page `team`, block `blk_staff` (`kind: "staff"`, `person: "ayaan"`, `name: "Ayaan Warsame"`, `role: "Claims handler"`, `address: "ayaan.warsame@quayholt.example"`, `fact: "quayholt_staff_claims"`).
  - page `it`, block `blk_itdesk` (`kind: "field"`, the E5 service-desk text, `fact: "quayholt_it_desk"`). **No `blk_sso` block** (deleted with its fact).
  - page `news`, block `blk_news` (the E5 SSO-move text, `fact: "quayholt_sso_migration"`).
  - `quayholt_social` (`type: "social"`) with one profile for `ayaan`: `post_ayaan` (`id: "post_ayaan"`, text "Flat out clearing the claims backlog this week, roll on Friday.", `fact: "quayholt_ayaan_busy"`), plus one off-topic decoy post with no `fact` (as E5's `post_hana_other`).
- **`mailClient`**: copy E5's `accounts` (`analyst`, `spoofsFrom: true`), `mailboxes`, `checklistTiming: "onSend"`, `bodyMode: "templates"`, `freeTextFlavour: false`, `showRedFlagMeter: true`, and the `seededMessages` `brief` (§8). **Delete `payloadKit`** (no link kit). `contacts`: one row `{ "id": "ayaan", "person": "ayaan", "name": "Ayaan Warsame", "addresses": ["ayaan.warsame@quayholt.example"], "role": "Claims handler", "revealedBy": "se_intel_quayholt_staff_claims", "targetId": "takeover_victim" }`.
- **`phishTargets`**: the single `takeover_victim` block from §9 (drop `expectedLink`, `linkCredible`, `senderAuth`; `requiredFactors: ["senderTrust", "pretextRelevant"]`, `advisoryFactors: ["urgencyCalibrated"]`).
- **`playerSentAuth`**: copy E5's block for the `analyst` account (the flip's auth read of the sent email): `{ "accounts": { "analyst": { "spf": "pass", "dkim": "fail", "dmarc": "fail", "envelopeFrom": "bounce.quayholt.example", "replyTo": "{account_address}" } } }`. (01 P2 only says "add `playerSentAuth`"; this is the value.)

## 10. Flip (where ENG-01 is needed)

This is the episode's only new engine behaviour, and the reason to note it precisely.

In the built episodes the `flip` stage replays the learner's own artefact to its recipient and shows a scripted defender line. E1's flip shows the email as the payments team saw it (`flipDefenderLine`); E5's flip shows the built page as Hana met it (`flipPage` in `episode-model.js`). **ENG-01 makes the flip go one beat further for E8: after the recipient (Ayaan) reads it and signs in, an aftermath section shows the first odd signs from the seat of the person whose account is now being used.** The aftermath hands straight into the defend half.

ENG-01's shape (the authority is `02_ENGINE_WORK.md` ENG-01; use its key names, not a new `flip` block). E8 authors **`awarenessEpisode.flipAftermath`** (episode level, not in `strings`, so the parity test needs no allow-list entry and the defend-only generator never copies it) and **`awarenessEpisode.stepLabels`**. The aftermath items are authored **inline**; E8 does not point at a defend-set id. The sent-items sign appears here as its own inline item with its own id (`fa_sent`), separate from the defend-set row 1 (`e8_sent_invoice`), which carries an inline copy of the same situation with a different id (Round 1 ruling 3).

Draft block E8 authors:

```json
"flipAftermath": {
  "heading": "Now you are Ayaan, and it is ten past three",
  "victimName": "Ayaan Warsame",
  "intro": "Ayaan read it between two claims, in the week his team was clearing a backlog. The service desk's own address was on it, and it only asked him to sign in again, which IT had said would happen while single sign-on moved. So he did. That was not carelessness: it was built to pass for the notice he acts on. Here is his account a few minutes later.",
  "items": [
    { "id": "fa_sent", "kind": "email", "folder": "sent", "to": "claims-client@marsden-holloway.example", "subject": "Updated payment details for your settlement", "time": "15:08", "note": "Ayaan did not write this; it is in his Sent folder, sent while someone else was signed in as him." },
    { "id": "fa_push", "kind": "push", "push": { "app": "Quayholt Sign-in", "account": "ayaan.warsame@quayholt.example", "location": "Unknown location, outside the UK", "device": "Windows PC" }, "note": "A sign-in prompt he did not start, from a device that is not his." }
  ],
  "line": "Most of the damage happens between noticing and reporting."
}
```

`items[].kind` is `email` (drawn as one read-only sent-items row from the inline fields: folder, to, subject, time and the `note`; no body, no link) or any `NON_EMAIL_KINDS` kind (here `push`). The aftermath shows only when the attack landed (ENG-01: never on `missed`, `noSend` or `landedNoTells`).

`stepLabels`: `{ "flip": "The click" }` labels the flip step. The built shells author none, so they are unchanged.

Other flip strings E8 authors (in `awarenessEpisode.strings`, same keys as E1/E5): `flipHeading` "Now it lands on you"; `flipIntro` "This is your email as Ayaan, the claims handler you sent it to, met it, and this time he signed in."; `flipDefenderLine` (draft, shown before the aftermath) "The service desk never sends sign-in requests by email, whatever address they come from; that is the one thing that would have given it away."; plus `flipNoSend`, `flipMissed`, `flipMissedHeading`, `flipLandedNoTells` in the E5 voice, each ending "next, you're the one whose account is being used, sorting the signs that follow."

E8 passes no `flip` config block, no `variant`/`victimTarget`/`firstSign`, and no `becomeVictimIntro` string: those were a pre-ENG-01 proposal and are dropped. `flipAftermath.victimName` is an optional field ENG-01 already defines (added in Round 1; see `02_ENGINE_WORK.md` ENG-01 point 1).

If ENG-01 is not ready, E8 cannot ship its full variant. The **defend-only variant needs no ENG-01** (it skips the flip), so the defend-only shell and its Hacktivity course can ship first and prove the rest of the pipeline. Note this to the orchestrator.

## 11. Defend set

Set id `e8_used_account`; episode prefix `episode_e8_after_the_click_defend_`. `scoringProfile: "awareness"`, `verifyVerdict: true`, `feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"` (the E1 episode-set config). Verdicts: Trust, Report, Delete, Verify (ring the service desk or Anjali on a number already held). `reportAlwaysVisible: true`.

The set is Ayaan's inbox, seen as "you" after the flip. The teaching point: every real sign gets the same first move, report it and leave it. About 6 to 7 items; the parcel item (row 7) may be cut to reach six.

`channelTells` array: `["unexpected_sent_item", "unrequested_reset", "unrequested_mfa_push", "ransomware_note", "secrecy_or_bypass"]`. `unrequested_mfa_push` and `secrecy_or_bypass` are in the shared library already (`00_data_contract.md`). **The three new ids `unexpected_sent_item`, `unrequested_reset` and `ransomware_note` are account-takeover and malware signs with no built equivalent.** They are in the **shared library via ENG-08** (already added to the ENG-08 tell table in Round 1, append-only to `CHANNEL_TELLS` in both `phish-rules.js` and `triage.rb`). Use ENG-08's canonical strings verbatim as the library entries:

- `unexpected_sent_item`: "A message or item in your own Sent folder that you did not send"
- `unrequested_reset`: "A password reset or security change you did not ask for"
- `ransomware_note`: "A message or on-screen note claiming your files are locked and demanding payment"

Each message that flags one still carries its own `factorStrings.<id>.redFlag` sentence (the per-item wording, which may be more specific than the library line); the shared-library entry is the fallback and the single source for a check form that later scores the same sign. (`lookalike_domain` is not listed: no item in this set flags it.)

### Items (id, kind, from/caller, subject/line, tells and flags, verdict, Verify, reason)

| # | id | kind | from / sign | subject or line | phish? | flags | verdict | Verify | reason (perFlagNote / whyFine) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `e8_sent_invoice` | `email` (your own address; the copy in Sent) | `ayaan.warsame@quayholt.example` (your own address), to `claims-client@marsden-holloway.example` | "Updated payment details for your settlement" | yes (takeover; `truth.isPhish: true`) | `unexpected_sent_item`, `secrecy_or_bypass` | Report | on | A message in your own Sent folder, to a client, that you never wrote, asking them to pay a new account and keep it quiet; it means someone is in your mailbox now. (Built as an ordinary `email` card from your own address with a clear subject, ruling 4; an inline copy of the flip's `fa_sent` sign with a distinct id. `isPhish: true`, so Report scores full and Trust scores zero.) |
| 2 | `e8_reset_confirm` | `email` | "Quayholt IT" `it-servicedesk@quayholt.example` (genuine system address, but unrequested) | "Your password was changed" | yes (takeover sign; `truth.isPhish: true`) | `unrequested_reset` | Report | on | The address is really Quayholt's, but you did not change your password. A confirmation for a change you did not make means someone else made it. Report it and let the service desk lock the account. (Uses the built service-desk address, not a second IT mailbox.) |
| 3 | `e8_push_abroad` | `push` (authenticator card) | "Quayholt Sign-in", account `ayaan.warsame@quayholt.example`, location "Unknown location, outside the UK", device "Windows PC", time "11:48" | "Are you trying to sign in?" | yes (`truth.isPhish: true`) | `unrequested_mfa_push` | Deny and report (engine verdict Report: the push `deny_report` action scores as Report) | n/a | A prompt you did not start means someone has your password and is trying to get in. Deny it and report it. (Reuses the E3 push card exactly; copy `e3_push_early`'s `push` shape.) |
| 4 | `e8_colleague_slip` | `email` | Reuben Ofori `reuben.ofori@quayholt.example` (genuine colleague; the `hb_vm_locked` voicemail caller in E3, reused here) | "I think I've sent something to the wrong client" | no (genuine; a colleague's own mistake; `truth.isPhish: false`) | (none) | Trust or Report (both score full) | on | Reuben really did make a mistake: he sent a claims spreadsheet to the wrong client and is asking what to do. Under the `awareness` profile a genuine email scores full marks whether you Trust it (read it and help him as normal) or Report it, so you are not penalised either way; the teaching is to help him report it now rather than say nothing, because a misdirected record reported in minutes can be contained. Nobody is in trouble for owning up. |
| 5 | `e8_locked_files` | `page` (a full-screen note; built `page` shape, no ENG-03 states) | On-screen note shown on the shared drive; `page: { "url": "README_UNLOCK (shared drive)", "padlock": false, "heading": "Your files are locked" }`, `body` the note | "Read README_UNLOCK.txt" | yes (malware sign; `truth.isPhish: true`) | `ransomware_note` | Report | on | Files that will not open and a note demanding payment is a sign to report at once and leave the device as it is: do not restart it, do not delete the note, do not try to open the files again. Follow the service desk. (No ransom amount, no countdown, no "pay" button; E8 stops at "report and leave it", core_07 owns the rest.) |
| 6 | `e8_maintenance` | `email` | "Quayholt IT" `it-servicedesk@quayholt.example` (genuine) | "Planned maintenance on the claims system, Saturday 08:00 to 12:00" | no (genuine; the calibration mirror; `truth.isPhish: false`) | (none) | Trust, Verify or Report (all score full) | on | A planned-outage notice from IT's real address, announced on the intranet too, asking you to do nothing. This is the benign look-alike: after a run of real signs it is tempting to report everything. Trusting it is right, and Verifying it (a quick look at the intranet notice) or reporting it both still score full, so a cautious learner is never marked down. |
| 7 | `e8_parcel` | `email` | "Quayholt Reception" `reception@quayholt.example` (genuine) | "A parcel is waiting for you at the front desk" | no (genuine; plain-ordinary; `truth.isPhish: false`) | (none) | Trust | on | An ordinary reception notice from Quayholt's own address, nothing to sign in to or pay. Not everything in a bad hour is an attack. (Cut this to reach six items if needed.) |

Each phish item carries `truth.ifTrusted` and `truth.reportReply` in the E1 voice; each genuine item carries `truth.whyFine` with a `default` and, where a factor could be misread, a per-factor key (copy the E1/E5 pattern). The push item (row 3) copies the `e3_push_early` card verbatim (same `push` object fields, same `perFlagNote`/`ifTrusted`/`reportReply`).

### Mirror pair (aw5)

Rows 5 and 6 are the pair: the **locked-files note** (a real sign that looks alarming and is a Report) against the **maintenance notice** (a genuine, planned IT message that could be mistaken for a sign and is a Trust/Verify). Both involve "IT and your systems", so the learner cannot win on "anything to do with IT is bad". A second soft pair is row 2 (unrequested reset, a Report) against row 6 (genuine IT notice, a Trust), both from IT's real address.

## 12. Debrief cards

Built debrief view, in the E1/E5 order, plus the two concept cards E8 owns (core_01 and core_04 game designs). The two cards use **ENG-09b**'s array form of `strings.conceptPanel` (an array of `{ heading, text }`), because the built `conceptPanel` is a single panel; author them as two array entries, shared (shown in both the full and defend-only shells):

1. A reasoning card per item (from each item's `truth`).
2. **Concept card A, "The five questions a report answers"** (core_04): what, when, where, who, and what you have done. Draft text: "A useful report answers five questions, as far as you know: what you noticed, when, where (which account, device or system), who is affected, and what you have done so far. Be honest about the last one: 'I clicked the link', 'I signed in', 'I restarted it'. A rough report now beats a perfect one later; the team will ask for the rest."
3. **Concept card B, "First steps and recovery"** (core_01 LO6 and core_04): "If you clicked or signed in: report it, change the password on the real site (not through any link), then change it anywhere you used the same one, and follow the service desk. For anything on a device: leave it as it is. Do not switch it off unless you are told to, do not delete the evidence, and do not try to fix it. If the service desk asks, unplug the network cable or turn off Wi-Fi and leave it on."
4. Genuine-item feedback (rows 4, 6, 7).
5. The team-protected tally (aw6; `teamProtectedOf`).
6. **The habit to keep** (shared, word for word, under heading "The habit to keep"; copy from the built E1 `social.awareness.ruleOfThumb` / `awareness_deploy.py`, do not rewrite): "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."
7. **The "On Monday" card** (`debrief.mondayCard: "slot:customer_report_route"`; the default string below, with the customer route filling the final clause): "On Monday: if you think you have clicked, signed in or spotted something odd on your account or a colleague's, report it straight away, change your password on the real site, and leave the device as it is. Reporting fast, even your own slip, is what limits the damage, and report it using the route in the box below."
8. The customer report route (the slot).
9. **The no-blame line** (`debrief.noBlameLine: true`). Draft: "Everyone clicks something eventually, and a colleague who reports their own slip is doing exactly the right thing. A miss here just shows where to look next time; nobody is in trouble for reporting."

## 13. Defend-only variant

Shell id `e8_after_the_click_defend`, stages `["brief", "defend", "debrief"]`, same defend set `e8_used_account` so the measurement is unchanged, prefix `episode_e8_after_the_click_defend_defend_` (the double-`defend_` pattern the built E1/E5 defend-only shells use). Put the defend-only `brief` and `scopeNote` under `awarenessEpisode._defendOnly` (the `_defendOnly` pinned-strings convention, BRAND_SET §7; the generator copies the keys listed under `_defendOnly` over the shared `strings`, so do not rely on a fixed count: the schema `strings` carries about twenty keys, not eight); the shell copies `brief` over `strings.brief` and `scopeNote` over `scopeNote`, and every other string is shared (the flip strings are simply never shown). Draft defend-only brief: "You're on an authorised exercise at Quayholt Insurance, a fictional company. A colleague clicked a convincing email and signed in, and now their account is being used. You're covering their inbox. Some of what turns up is a real sign that something is wrong, and some is ordinary. Sort it, and report or check anything that doesn't sit right. Reporting when you're unsure is always fine and never marked down." Defend-only `scopeNote`: "Authorised exercise at Quayholt Insurance, a fictional company. In scope: the signs that follow in a colleague's inbox after a click." **The defend-only variant needs no ENG-01 and can ship first.**

Both variants join both seeded Hacktivity courses (the defend-only course and the both-versions course), as every new episode does (WRITER_BRIEF §Shape).

## 14. Check-form items it feeds (see 10_CHECK_FORMS.md)

E8's topic (core_04 reporting) feeds the new **`general_v2`** check-form pair at Quayholt, built by `10_CHECK_FORMS.md` (Round 1 ruling 1 adopts `10`'s two-pair scheme, `general_v2` and `data_conduct`, and drops the per-topic forms). Do not edit the existing six role forms, including the built `general` form (the measured baseline, WRITER_BRIEF defaults): `general_v2` is a separate new pair.

E8's account-takeover signs (C01-B6) and own-report (C01-B7) feed `general_v2` **only where they fit its balance** (ruling 1). The tells `unrequested_reset` and `unexpected_sent_item` are in the shared library (ENG-08, §3 and §11), so a `general_v2` item could score them; but as `10` currently balances `general_v2` (10 items, a fixed scored-flag multiset), there is no slot for an unrequested-reset item or a sent-items item, so **E8's reset and sent-item signs stay defend-set items only** for now. `10`'s author may add such a slot (the shared tell ids make it possible); E8 does not require it. E8 supplies no new check items beyond what `general_v2` already carries for core_04 (item 1, the reporting-loop pair). There is no form-building engine packet; `general_v2` is built by `10`'s generator (the stale `ENG-09` reference is dropped, Round 1 R1_content M5). Do not change `passPercent` (0) or the `triage_{stage}_` prefix convention.

## 15. Files to create or change

- `planning_notes/phishing_and_social_engineering/awareness/e8/attack.json` (new): the attack fragment (people, intelFacts, templates, mailClient, osint, phishTargets), modelled on `e5/attack.json` minus the landing-page and `build` parts.
- `planning_notes/phishing_and_social_engineering/awareness/e8/defend.json` (new): the defend fragment (triageSets with `e8_used_account`; the `awarenessEpisode` block with `strings`, `_defendOnly`, `debrief`; a `_brandAdditions` note recording the one new `.example` recipient, the client firm **Marsden Holloway** (`marsden-holloway.example`), a fictional settlement client, used by the sent-item sign and defend row 1. This name was chosen under Round 2 ruling 4 to replace the earlier `fenwick-brandt.example`, which collided with E14's subject Dani Fenwick and with Arthur Fenwick in the healthcare sector module; "Marsden" and "Holloway" each return zero repo hits (checked 2026-10-28). E8 adds no cast and no new sender brands; pre-ship web-search the firm name with the usual check.
- `scenarios/awareness_e8_after_the_click/scenario.json.erb`, `mission.json`, `ink/anjali_rao.ink` (new): the full-episode shell. **Frame it from E1** (the `01_PIPELINE.md` P2 rule: a mail/OSINT episode with no built page copies the E1 shell frame, and the host ink is E1's `adaeze_okafor.ink` structure with Anjali's lines). Take only the Quayholt names, sites, templates and the Quayholt globals/`eventMappings` shape from E5 (E5 is the same company and room); E8 has no `build` stage or landing page, so do not copy E5's `se_landing_pages`/`landing_*` globals. Globals to declare in `globalVariables` (all defaults as shown): `episode_e8_after_the_click_state: {}`, `se_awareness_records: []`, `episode_e8_after_the_click_defend_percent: 0`, `..._reportRate: 0`, `..._done: false`, `..._pass: false`, `se_osint_state: {}`, `se_intel_quayholt_it_desk: false`, `se_intel_quayholt_sso_migration: false`, `se_intel_quayholt_staff_claims: false`, `se_intel_quayholt_ayaan_busy: false`, `phish_takeover_victim_landed: false`, `phish_takeover_victim_attempts: 0`. The host ink completes `send_takeover_phish` on `phish_takeover_victim_attempts > 0` and the conclusion task on `episode_e8_after_the_click_defend_done === true` (copy the E5 `eventMappings`).
- `scenarios/awareness_e8_after_the_click_defend/` (new): the defend-only shell.
- The two seeded Hacktivity courses: add E8 (full) and E8 (defend-only) following **`01_PIPELINE.md` P12** (Round 1 ruling 8), which holds the one seeding procedure at feature level. Do not use `awareness_deploy.py` for course seeding: it holds only the shared rule of thumb, not course logic. Describe at feature level only.
- ENG-01 engine work: owned by the ENG-01 packet, not by this content writer.

## 16. Bridge script outline

Add `tools/playtest/se/bridge-e8-full.jsonl` only, modelled on the existing `bridge-e*-full.jsonl`. There is **no** defend-only bridge: `run-suite.sh` `JOBS` holds only `*-full` entries and no built defend-only bridge exists to copy, and README §9 requires only `bridge-eN-full` (Round 2 m5 / R1_sonnet m5). If the orchestrator wants a defend-only bridge later, that needs a new `JOBS` key and skeleton defined in `01_PIPELINE.md` P9 first. Steps: brief advances; OSINT collects the four facts; write composes the credential phish (From set to `itdesk_full`+`itdesk_address`, pretext `e8_pretext_reauth_calm` with `sso_migration`, ask `e8_ask_calm`) and sends; the flip plays, showing Ayaan's seat and the first signs through `flipAftermath`; defend triages all items on the critical path (Report the four sign items, rows 1, 2, 3 and 5; Trust or Verify the genuine ones, rows 4, 6 and 7); the episode concludes on `episode_e8_after_the_click_defend_done`. Run through `check-bridge.mjs` and `run-suite.sh`.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e8_after_the_click/scenario.json.erb` passes with no errors (and the defend-only shell).
- The social validators under `scripts/validate_social/` pass, including the balance lint on any check-form pair E8 touches.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` passes (the fragment and the shell agree).
- The shared rule-of-thumb test passes (the habit-to-keep string is byte-identical to the built one).
- The bridge suite passes: `tools/playtest/se/run-suite.sh` including `bridge-e8-full.jsonl`.
- `node --test test/js/social-*.test.mjs` and `test/js/validator-social-*.test.mjs` pass.
- Manual: the full episode runs end to end in about 15 minutes; the flip seats the learner as Ayaan and shows the first sign; Report is available and never penalised on every card; the two concept cards and the habit, Monday card, report route and no-blame line all show in the debrief.

## 18. Do not

- Do not add a `build` stage or a landing-page builder: E8 has no built page and no `linkCredible` factor. That is what keeps it the pilot.
- Do not edit the six built role check forms, the generators, `BRAND_SET.md` cast (E8 adds none), or the shared rule-of-thumb string.
- Do not introduce ransom amounts, countdowns or a "pay" button on the locked-files card; E8 stops at "report it and leave it" (core_07 owns the rest).
- Do not run a generator into the repo, `git stash`, or add attribution lines to commits.
- Do not include any real brand, real person or any domain that is not `.example`; no homographs.
- Do not include Hacktivity internal paths, endpoints or credentials.

## 19. Stop and ask if

- ENG-01 is not available and the orchestrator needs the full variant now (the defend-only variant can proceed without it).
- ENG-08 has not added `unexpected_sent_item`, `unrequested_reset` and `ransomware_note` to the shared `CHANNEL_TELLS` in both files; then the full and defend-only sets cannot score them. (As a stopgap only, they validate scenario-local with a `flagChips` label, but the settled home is the shared library.)

## 20. Open questions

1. **Victim seat name.** This spec uses Ayaan Warsame (built cast) as the attack target and victim seat, to avoid a new name and to avoid phishing Hana Novak in both E5 and E8. Confirm, or pick another Quayholt general-staff colleague.
2. **Item count.** Seven items as drafted; cut the parcel (row 7) to hit "about six" if the orchestrator prefers.
3. **The colleague-slip card kind.** Drafted as an email from Reuben Ofori; if a person-chat card reads better for a confession, that is a small defender-card variant to confirm against the inbox-triage card kinds (the `person` kind is ENG-09c, optional).

(Resolved in Round 1: the flip config is ENG-01's `flipAftermath`/`stepLabels`, not a `flip` block, §10; the three new tells are shared via ENG-08, §3 and §11.)
