# E20 remote and mobile working (implementation spec)

Status: draft for a Sonnet implementer. E20 is a new awareness episode at Tarrowby Logistics, the cut-down
build of module core_09 (remote and mobile working). The full module design (`../modules/
core_09_remote_and_mobile_working/`) is size L because it wants four new rooms with art (a train carriage, a
café, a hotel room and a home office). This episode deliberately needs **no new place**: it reuses the built
Tarrowby training room and the built triage card kinds, and adds **one** small new card state (a Wi-Fi
network list). Everything outside the training room is shown through the kiosk, the way every built awareness
episode does it.

It leans on three engine surfaces that already have packets, **ENG-04** (the consequence-flip `mistake` stage
and the montage flip, drafted for E11, E15 and E16), **ENG-09b** (the debrief concept-card array) and
**ENG-08** (the schema and validator collection), plus one small new surface written under "Engine needs" at
the end of this file (the Wi-Fi network list card state). The full episode's attack half cannot be built until
ENG-04 lands; the defend half and both debriefs need ENG-09b and the Wi-Fi card state. This spec gives the
content in full and states exactly what each surface must provide, so authoring is ready the moment the
packets are in.

Writer: opus48 agent. Never run a generator into the repo. Never `git stash`. No attribution lines in commits.

The episode covers public Wi-Fi the way the NCSC sees it today (with HTTPS on nearly everything, ordinary
browsing on a venue's own network is mostly fine; the real risks are a hotspot named to look like the venue,
a Wi-Fi page that asks for more than the terms, and being overlooked or overheard), the "Not secure" sign-in
page, locking a screen and keeping a device with you, shoulder surfing, calls in public, and reporting a lost
device straight away. It does **not** repeat E6 (texts and QR on a work phone) or E10 (downloads and fake
checks); it cross-references them.

---

## 1. Goal and module(s)

Teach that working away from the office is normal and allowed, and that almost everything that goes wrong is
ordinary rather than technical: someone reads a screen, someone hears a call, a device is left behind, or a
password is typed into a fake Wi-Fi page. Module: **core_09** (remote and mobile working), the **mobile** role.
There is no companion role module; core_09 is a core topic delivered for the mobile role.

The one habit that carries most of it is the built rule of thumb (stop and check through a route you already
trust). Public Wi-Fi is taught in proportion: on the venue's own network, with the VPN, ordinary work is
mostly fine; the giveaways are a look-alike hotspot and a page that wants your work sign-in. Lost or stolen
devices are reported at once. The organisation's controls (the VPN, device encryption, remote lock and wipe)
are **organisation-slot debrief lines, not staff duties** (§12): a member of staff cannot turn on device
encryption or remote wipe, so those lines say "what Tarrowby has set up", not "what you must do".

Learning outcomes drawn on (from `modules/core_09_remote_and_mobile_working/concepts.md` and `assessment.md`):

- C09-LO1 keep client details out of other people's sight (shoulder surfing, choose your seat, lock the
  screen when you look away, a privacy screen);
- C09-LO2 keep client details out of other people's hearing (no names, codes or client details on a call in
  public; "I'll call you back" is a complete answer);
- C09-LO3 public Wi-Fi in proportion (the venue's real network and the VPN are mostly fine; a look-alike
  hotspot and a page asking for your work password are the risks; the phone's hotspot when unsure);
- C09-LO4 with you, or locked away (never leave a device unattended; take only what the trip needs);
- C09-LO5 report a lost or stolen device straight away, day or night, even if it is locked;
- C09-LO6 (home working: camera and screen share) is touched only in a debrief concept card and the montage,
  not as a scored card, to keep the cut-down episode tight.

## 2. Read first (exact paths)

- `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md`.
- Teaching source of truth: `modules/core_09_remote_and_mobile_working/concepts.md` (the whole file: "Public
  Wi-Fi, in proportion", "Being overlooked", "Being overheard", "Devices and papers on the move", "Lost or
  stolen devices and papers", the misconceptions table and the organisation-specific slots) and
  `modules/core_09_.../assessment.md` (the assessed behaviours C09-B1 to C09-B11, the "Check and defend items
  (mirror pairs)" table and the knowledge-check bank). `modules/core_09_.../game_design.md` is the content
  starting point only: its four new rooms, its named bystanders (Jerome, Bryony, Grace, Ellis) and its new
  minigames (MG-14, BE-10, MG-04, MG-09) are **out of scope** here, by the user's "no new place" instruction;
  this episode reparents the teaching into the built training room.
- **The nearest built episode at the same company: E6** `scenarios/awareness_e6_texts_and_qr/` end to end
  (the built Tarrowby room wiring, the two-aim shape, the host NPC done event, the learner avatar, the kiosk
  object), plus its fragments `planning_notes/phishing_and_social_engineering/awareness/e6/{attack,defend}.json`
  (the Tarrowby cast, the `_brandAdditions`, the built `tarrowby-wifi.example` look-alike and the guest-Wi-Fi
  notice). E6 is the reference for the built Tarrowby room and cast, **not** the stage shape (E6 has a mail
  attack half; E20 has a consequence `mistake` half).
- **The built `page` triage card: E5** `scenarios/awareness_e5_signin_pages/` and
  `planning_notes/phishing_and_social_engineering/awareness/e5/defend.json` (the `page` card with the padlock
  / "Not secure" address bar and the sign-in `fields`). E5 taught the padlock myth (core_08 LO2); E20's
  "Not secure" card cross-references it so the two do not contradict (§11, card 3).
- **The nearest ENG-04 consequence-flip episode: E11** `implementation/episodes/E11_misdirected_data.md`
  (§10a, the worked `mistake` block and montage; copy its config shape and its two-aim objective wiring; E20
  is its sibling in shape). Also **E18** `implementation/episodes/E18_credential_attacks_at_scale.md` and
  **E9** `implementation/episodes/E09_passwords.md` for the §8b shell/generator metadata shape (copy it here).
- Shapes and ids: `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` (the triageSet
  `truth` shape, the built `page` card, the shared channel-tell library) and
  `designs/11_awareness_product_episodes.md`.
- Companies and cast: `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` (the Tarrowby
  roster, the E6 `_brandAdditions`, the look-alikes `tarrowby-careers`, `tarrowbey`, `tarrowby-wifi`);
  `planning_notes/security_awareness_course/03_WORLD_AND_CAST.md` (the hosts table, the no-clash name pool;
  Zainab Hussain is drawn from it).
- Runner and engine: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS:27`,
  `ATTACK_STAGES:28`, `stagesFor:60`, `childLaunch:180`; verified 2026-10-28); `public/break_escape/js/
  minigames/inbox-triage/triage-kinds.js` (the built `email` and `page` cards; `page()` draws "Not secure"
  when `padlock !== true` and the padlock button says "The padlock means the connection ... is encrypted. It
  says nothing about who runs [the host].", verified 2026-10-28; `NON_EMAIL_KINDS:23` is
  `sms, voicemail, qr, page, call, push`); `scripts/validate_social/awareness.rb` and `triage.rb`.
- Engine packets: `implementation/02_ENGINE_WORK.md`, **ENG-04** (the `mistake` stage and montage flip),
  **ENG-09b** (the debrief panel list), **ENG-08** (schema and validator). The Wi-Fi network list card state
  is drafted under "Engine needs" at the end of this file (it has no packet yet).

## 3. Depends on

- **ENG-04** (the consequence-flip `mistake` stage and the montage flip). E20's attack half is one `mistake`
  stage: the learner makes a handful of everyday choices on the road in a safe sandbox (unscored), then the
  flip runs as a montage showing where each choice led ("through their eyes", the module's debrief idea).
  E20 cannot build its full variant's attack half without ENG-04. §9 gives the `awarenessEpisode.mistake`
  config and `strings.flipMontageByChoice` ENG-04 must accept. ENG-04 is guarded so the built shells, which
  author no `mistake`, are byte-for-byte unaffected.
- **ENG-09b** (the debrief panel list). E20's debrief shows several short concept cards (§12), and the built
  `strings.conceptPanel` is a single panel; ENG-09b widens it to accept an array. **Both variants need
  ENG-09b** (the concept cards are in the debrief of both).
- **The Wi-Fi network list card state** (new; see "Engine needs"). The defend-half mirror pair (cards 1 and 2,
  §11) is a Wi-Fi network list, which no built kind renders. It is **one small new card state** on the built
  `page` kind (`page.state: "wifiList"` plus a `page.networks` list), scored by the ordinary page verdicts.
  **Both variants need it** (the pair is in the defend half of both). The three built `page` cards (card 3's
  "Not secure" sign-in page, card 4's genuine captive portal) and the two `email` cards (cards 5 and 6) need
  no new surface.
- **ENG-08** (schema and validator): adds the `mistake` stage to the enum and `STAGES`, the
  `brief mistake flip defend debrief` stage order (ENG-04 owns this), the `awarenessEpisode.mistake`, `flip`
  and `strings.flipMontageByChoice` keys (ENG-04), the `page.state`/`page.networks` schema keys for the Wi-Fi
  card (the Engine-needs packet), and accepts E20's three scenario-local tells (labelled in `channelTells`,
  not added to the shared library). E20 adds **no** new stage id itself and authors the ENG-04 stage order
  unchanged.
- **No osint, no build, no write, no guess.** E20 has no recon, no page builder, no mail send and no guesser;
  its attack artefact is the consequence sandbox. So it depends on **neither** ENG-02/ENG-02b (the guesser)
  **nor** ENG-03a/ENG-03b (the browser-screen states and the fake-check builder): the "Not secure" page is
  the plain built `page` card (`padlock: false`), not an ENG-03a state.

## 4. Owner models

- Content and dialogue: `opus48`.
- ENG-04 engine surface, the Wi-Fi card state, the schema/validator additions and the shell wiring:
  general-purpose or Sonnet, after ENG-04 and the Wi-Fi card state are built.
- The opus48 content step fills §8b, §9's `mistake` content, §10's montage strings and §11's defend items
  before any Sonnet begins the shell wiring (01 P2).

## 5. Company, room and host

- **Company:** Tarrowby Logistics (`tarrowby_logistics`), the module's company and the company the built
  **mobile** check pair is set at, so E20 reuses a built brand, room and cast and adds the least art. Brand
  block, copied exactly from the built E6 shell: `{ "name": "Tarrowby Logistics", "logoText": "TARROWBY",
  "accent": "#3b5b8c" }`. Domain `tarrowby.example`; look-alikes `tarrowby-careers.example`,
  `tarrowbey.example` and the E6 Wi-Fi look-alike `tarrowby-wifi.example` (reused for the fake captive portal
  host, card 3).
- **Room:** reuse the built `room_aw_tarrowby`, exactly as `scenarios/awareness_e6_texts_and_qr/
  scenario.json.erb` wires it (`"type": "room_aw_tarrowby"`, `chatBackground:
  "assets/backgrounds/rooms/aw_tarrowby_blended.png"`, the same lighting and kiosk object). **No new room.**
  The consequence sandbox, the montage and the triage cards are full-screen overlays, as at every company;
  the train, the café, the hotel and the home office are shown only inside those overlays, never as game
  rooms.
- **Host:** **Zainab Hussain**, Tarrowby field service engineer, the module's on-the-road explainer (eight
  years working from vans, cafés and trains; once left a tablet on a train herself and says so). Drawn from
  the `03_WORLD_AND_CAST.md` no-clash name pool ("Zainab Hussain, field service engineer; 30s, British
  Bangladeshi, hijab; works from her van"). She welcomes the learner, frames the two days as an authorised
  exercise, carries the per-item feedback and the debrief, and voices the organisation-slot lines (the VPN
  Tarrowby Connect, device encryption, remote lock and wipe, the 24/7 lost-device line) as Tarrowby's
  controls, which is why they are organisation-slot debrief lines and not staff duties. **Placeholder host
  sprite** reusing a built female sprite: `female_blowse` (base key), in-scenario `female_blowse_v2` with
  `female_blowse_talk.png` and `female_blowse_visemes.png` (a listed placeholder host key, BRAND_SET E6/E7
  additions; confirm the chosen built sprite with the art schedule). Host art follows the PixelLab reset.
  Zainab is a **new named character** at Tarrowby: one new character art set, flagged below.
  - **Host clash check across E8 to E18 (and the built E1 to E7):** the Tarrowby hosts in play are Chidi
    Okeke (E6 fleet coordinator), Nilesh Solanki (E9 IT service desk analyst), Fatima Begum (E2) and the
    mobile check hosts Lerato Dlamini and Jun Watanabe. None is a field-engineer / on-the-road voice, and the
    module names Zainab (or Chidi) as the explainer. Zainab had no clash in the 2026-10-27 pool check. The
    user can overrule this and reuse **Chidi Okeke** (E6 host, fleet coordinator, zero new art) or **Nilesh
    Solanki** (E9 host, IT service desk analyst, zero new art), with the controls voiced as Tarrowby's; see §20.
- **Role:** `mobile` (staff who work away from the office). E20 feeds the built `mobile` check pair (§14); it
  does not add a new check form.
- **No attack target and no cast beyond the host.** The consequence sandbox has no attacker and no named
  victim; the bystanders who "could see or hear" in the montage are generic and unnamed (no-blame, §12), so
  E20 introduces no new cast except Zainab.

### New names and brands E20 introduces (need the pre-ship web search and a BRAND_SET `_brandAdditions` note)

- **Zainab Hussain**, Tarrowby field service engineer. Fictional; pre-ship web-search check required.
- The fictional venues named only as on-screen context in the sandbox and the Wi-Fi cards: a café **The Bean
  and Barrow** (its guest network **BeanBarrow Guest**, the look-alike **BeanBarrow Free**) and a hotel
  **Haverbridge Lodge** (its guest network **Haverbridge Lodge Guest**). All fictional; pre-ship web-search
  check required (the café name and the network names especially, as they read as brand names). No Wi-Fi SSID
  is a real network name; none is typeable.

All people, venues and networks are fictional; every address and domain ends `.example`. No homographs. The
Tarrowby company, room, brand and the `tarrowby-wifi.example` look-alike are the built E6 ones.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | Notes |
|---|---|---|
| brief | 1.0 | Zainab's welcome and scope note (the authorised two days). |
| mistake (consequence sandbox, ENG-04) | 4.0 | Five everyday choices on the road: the seat and the screen, a call in a café queue, minding the laptop, the café Wi-Fi, and the missing tablet that evening. Unscored. |
| flip (montage, ENG-04) | 2.0 | "Through their eyes": where each choice led. The Wi-Fi choice is the one quoted back (aw2). |
| defend | 6.0 | Six cards: two Wi-Fi network lists (the venue's real network against a look-alike), a "Not secure" sign-in page against a genuine captive portal, and a genuine lost-device notice against a "locate your device" lure. Verify on. |
| debrief | 2.0 | Concept cards (public Wi-Fi in proportion, the look-alike and the over-asking page, with you or locked away, lost it report it now, what Tarrowby has set up), the tally, the habit, the "On Monday" card, the report route, the module line, the no-blame line. |

Defend-only variant: brief, defend, debrief, about 8 minutes.

## 7. Stages (runner stage ids)

Full episode: `["brief", "mistake", "flip", "defend", "debrief"]` (the ENG-04 consequence-flip stage list).

- `mistake` carries the consequence sandbox (ENG-04). It is **not** a reuse of `build` or `write`; it is
  ENG-04's `mistake` stage launching the `consequence-sandbox` child scene. There is no `osint`, no `build`,
  no `write` and no `guess`. ENG-08's `brief mistake flip defend debrief` order (added for ENG-04) is reused
  unchanged; E20 adds no new stage id and no new stage order.
- `flip` runs ENG-04's montage mode (`flip.mode: "montage"`), reading the learner's beat choices and showing
  one `.aw-montage-beat` per beat, the `flipBeat` as the headline. No new flip engine.
- `defend` runs six ordinary triage cards (two `page` cards in the new `wifiList` state, two built `page`
  cards, two `email` cards), recording into `se_awareness_records` like any defend half.

Defend-only: `["brief", "defend", "debrief"]`. **The defend-only variant needs ENG-09b** (the debrief concept
cards) and the **Wi-Fi card state** (the mirror pair is in its defend half), but **not** ENG-04: `mistake`
and `flip` are `ATTACK_STAGES` ids that `stagesFor` drops from a `defendOnly` shell (`episode-model.js:68`),
and the defend half is ordinary triage.

## 8. Brief and scope note (host's draft lines)

- **Episode id:** `e20_remote_and_mobile_working`. Defend-only shell id:
  `e20_remote_and_mobile_working_defend`.
- **`strings.brief`:** "You're on an authorised exercise at Tarrowby Logistics, a fictional haulier. First you
  spend two days working away from the depot: a train, a café, a hotel, a morning at home. You make the
  everyday calls anyone makes on the road, then you see where each one led. After that you tell the safe
  public networks and sign-in pages from the look-alikes. Only that last part is scored. Nothing you tap is a
  real network, and no real password is ever typed."
- **`scopeNote`:** "Authorised exercise at Tarrowby Logistics, a fictional company. In scope: the everyday
  choices you make working away from the office, and the public networks and sign-in pages you sort
  afterwards. No real network is joined and no real password is ever typed; every network, page, venue and
  message is made up."
- **Zainab's welcome (host ink, hub pattern):** "Welcome to the Tarrowby exercise. I'm out of the office more
  than I'm in it, so this one's close to my heart. Working on the road is normal and fine; it's the small
  things that catch people, a screen someone reads, a call someone hears, a bag left for a minute, a password
  typed into the wrong Wi-Fi page. I'll walk you through two days, then you sort the real networks from the
  fakes. Nothing here is a real password."

## 8b. Shell and generator metadata (every value final; no guessing)

Every metadata value the shell wiring (01 P2/P3) and the generator (01 P4, `gen_e8_e17_shells.py`) need, as
final strings, so a Sonnet implementer invents nothing. Copy the shapes from the built **E6** erb,
`mission.json` and the generator helper scaffolding (same company and room); E6's host entry is Chidi's, so
E20's host entry (Zainab) is authored new here, with the name-clash search in P11. For the `mistake`/`flip`
stage shape and the two-aim consequence objectives, copy **E11** (the ENG-04 reference), not E6. The `opus48`
content step fills §8b, §9's `mistake` content, §10's montage strings and §11's defend items before any Sonnet
begins P2. **The full episode also needs ENG-04 and the Wi-Fi card state, and both variants' debrief needs
ENG-09b; §8b is the generator and shell metadata, which does not itself wait on those packets.**

### Host and learner sprites

- **Zainab Hussain's `HOSTS['zainab']` entry** (authored new in `gen_e8_e17_shells.py`, Tarrowby addition;
  `sprite` is the base key, the in-scenario `spriteSheet` adds `_v2`): `{ 'id': 'zainab_hussain',
  'displayName': 'Zainab Hussain', 'sprite': 'female_blowse', 'about': "Tarrowby field service engineer, 30s,
  British Bangladeshi, wears a hijab; eight years working from vans, cafés and trains (BRAND_SET.md, E20
  additions). The on-the-road explainer; welcomes the learner, carries the feedback and debrief, and voices
  Tarrowby's controls. Reuses a built sprite (placeholder until the PixelLab reset)." }`.
- **Zainab's in-scenario host NPC sprite keys** (full erb `rooms.training_room.npcs[]`, following the E6 host
  NPC shape): `"spriteSheet": "female_blowse_v2"`, `"spriteTalk": "assets/characters/female_blowse_talk.png"`,
  `"spriteVisemes": "assets/characters/female_blowse_visemes.png"`, `"npcType": "person"`, `"id":
  "zainab_hussain"`, `"displayName": "Zainab Hussain"`, `"storyPath": "scenarios/
  awareness_e20_remote_and_mobile_working/ink/zainab_hussain.json"`, `"currentKnot": "start"`, plus the N16
  done-event `eventMappings`. Host art is a placeholder (a reused built sprite) until the PixelLab reset.
- **Learner avatar** (full erb `player`), as E6: `"spriteSheet": "female_office_worker_v2"`, `"spriteTalk":
  "assets/characters/female_office_worker_talk.png"`.

### Full-episode objectives (full erb `objectives[]`, copy the E11 ENG-04 two-aim shape)

| field | aim 1 (the two days) | aim 2 (defend, `missionConclusion: true`) |
|---|---|---|
| `aimId` | `two_days_aim` | `tell_them_apart_aim` |
| `title` | "Walk the two days" | "Tell the safe networks and pages from the fakes" |
| `description` | "Make the everyday choices working away from the office, then see where each one led." | "Work through the public networks and sign-in pages at the training kiosk." |
| `order` | 0 | 1 |
| task `taskId` / `title` / `type` | `make_the_choices` / "Walk the two days" / `manual` | `tell_them_apart` / "Sort the networks and pages" / `custom` |

Aim 2 `concludeRequires.globals`: `["episode_e20_remote_and_mobile_working_defend_done"]`. Aim 2
`conclusionScreen`: `{ "type": "success", "title": "Remote and mobile working episode done", "body": "You've
walked two days on the road and seen where each choice led, then sorted the safe networks and pages from the
look-alikes, so this episode is finished." }`. `awarenessEpisode.conclusionTaskId: "tell_them_apart"`.
Aim 1's task completes when the consequence sandbox is done (the runner marks the `mistake` stage complete);
ENG-04 defines no "landed" global (unlike ENG-02's `landedGlobal`), so the host ink gates aim 1 on the
`mistake` stage being complete, the way E11's shell does (confirm the exact gating global against E11's built
shell, §20).

### Full-episode training kiosk (full erb `rooms.training_room.objects[]` kiosk, copy the E6 shape)

- `observations`: "A touch-screen training kiosk for the Tarrowby remote-working exercise: first two days on
  the road to walk through, then the public networks and sign-in pages to sort."
- `observationVariants[0]`: `{ "condition":
  "globalVars.episode_e20_remote_and_mobile_working_defend_done", "value": "A touch-screen training kiosk for
  the Tarrowby remote-working exercise. The two days are done and the networks and pages are all sorted." }`
- `minigameData.episodeId`: `e20_remote_and_mobile_working`.

### Full-episode `mission.json` (copy the E6 mission.json shape)

- `display_name`: "Awareness E20: Remote and mobile working (full episode)"
- `description`: "An awareness episode of about 15 minutes for staff who work away from the office. On an
  authorised exercise at Tarrowby Logistics, a fictional haulier, you first walk two days on the road, a
  train, a café, a hotel and a morning at home, making the everyday choices and seeing where each one led.
  Then you sort the safe public networks and sign-in pages from the look-alikes. Only that part is scored, and
  reporting when you're unsure is always fine and never marked down. No real network is joined and no real
  password is ever typed."
- `difficulty_level`: 1; `scoring`: "completion"; `secgen_scenario`: null; `collection`: "training";
  `ui_theme`: "general"; `estimated_duration_minutes`: 15.
- `cybok`: `[ { "ka": "HF", "topic": "Human Factors", "keywords": ["Remote working", "Mobile devices",
  "Public Wi-Fi", "Shoulder surfing", "Security awareness"] } ]`.

Top-level erb strings (copy E6's): `scenario_id` `awareness_e20_remote_and_mobile_working`; `scenario_name`
"Remote and mobile working: two days on the road"; `scenario_brief` = `strings.brief` (§8); `endGoal` "Walk
the two days, then sort the networks and pages at the training kiosk."; `version` "1.0"; `disableAttacks`
true; `startRoom` `training_room`; `startPosition` as E6.

### Defend-only shell: generator `EPISODES['e20']` entry (`gen_e8_e17_shells.py`, following the `gen_e6_e7_shells.py` `EPISODES` shape)

```python
'e20': {
    'frag': f'{AW}/e20/defend.json',
    'full_id': 'e20_remote_and_mobile_working',
    'role_word': 'mobile',
    'role_label': 'staff who work away from the office',
    'defend_set': 'e20_on_the_road_inbox',
    'defend_host': 'zainab',
    # No 'forms'/'check_hosts': E20 feeds the built mobile check pair, not a form built by this
    # generator (see §14).
    'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
               'keywords': ['Remote working', 'Mobile devices', 'Public Wi-Fi', 'Shoulder surfing', 'Security awareness']}],
    'defend': {
        'name': 'On the road: tell the safe networks and pages from the fakes',
        'brief': "You're on an authorised exercise at Tarrowby Logistics, a fictional company. You're working away from the depot and the public networks and sign-in pages keep coming up: the café's Wi-Fi and a look-alike, a page that wants your work password, a notice about a lost device. Some are safe and some are built to catch you. Handle each one, and never type your work password into a Wi-Fi page. No real network is joined and no real password is typed here.",
        'endGoal': 'Sort the networks and pages at the training kiosk.',
        'aim': ('tell_them_apart_aim', 'Tell the safe networks and pages from the fakes', 'Work through the public networks and sign-in pages at the training kiosk.'),
        'task': ('tell_them_apart', 'Sort the networks and pages'),
        'kiosk': ("A touch-screen kiosk showing the public networks and sign-in pages you meet on the road: some safe, some look-alikes to catch you.",
         "A touch-screen kiosk showing the public networks and sign-in pages. They are all sorted."),
        'display': 'Awareness E20: Remote and mobile working (defend only)',
        'desc': "An awareness episode of about 8 minutes for staff who work away from the office, on the sorting side only. Working away from Tarrowby Logistics, a fictional haulier: the café's real Wi-Fi and a look-alike, a page that wants your work password, a genuine lost-device notice and a fake one. Each answer is explained, and reporting when you're unsure is always fine and never marked down. No real network is joined and no real password is typed.",
        'minutes': 8,
        'defendIntro': "Go through the public networks and sign-in pages and decide what to do with each one. On the venue's own network, with the VPN, ordinary work is fine; a page that wants your work password, or a network named to look like the venue's, is the trap. Ask the venue for the network's name if you're unsure, and there's no clock on you here.",
        'conclusion': ('Networks and pages sorted', "You've sorted the safe networks and pages from the look-alikes and finished this episode."),
    },
},
```

The entry uses the real `gen_e6_e7_shells.py` keys (`conclusion`, `defendIntro`), not the `ending` spelling of
`gen_e3_e5_shells.py` (01 P4 lists the required keys once). This `brief` is the same text as §13's defend-only
brief (keep them identical). The defend-only shell id is `e20_remote_and_mobile_working_defend`, prefix
`episode_e20_remote_and_mobile_working_defend_defend_` (§13). The defend-only `scopeNote` and `_defendOnly`
strings are in the fragment (§13). The defend set `e20_on_the_road_inbox` carries only built `page`/`email`
cards plus the Wi-Fi card state, so the generated shell validates with no ENG-04 dependency; it needs ENG-09b
(the debrief panels) and the Wi-Fi card state only.

### Defend-host lines: generator `LINES[('e20', 'defend')]` (the tuple `(before, after, choice, reply)`, Zainab's voice)

```python
('e20', 'defend'): (
    "Right, the kiosk's got the networks and pages you meet on the road. For each one, decide whether you'd connect, close it and report, or ask the venue first. On their own network with the VPN you're fine; it's a page wanting your work password, or a network dressed up as the venue's, that you walk away from. No rush, and nothing here is real.",
    "That's them all sorted, thanks. On the venue's real network with the VPN, ordinary work is fine; a Wi-Fi page asking for your work password is always a fake. When you're not sure, ask the venue for the name, or use your phone's hotspot.",
    'Thanks, Zainab.', 'Any time.'),
```

### Host spoken lines for the full shell (ink, Zainab)

- **Welcome** (at the hub): the §8 welcome line.
- **After the attack half** (on the kiosk hand-off into the defend half): "See how little it took? A screen
  someone read on the train, a code someone heard in the queue, a bag left for a minute, and one password
  typed into a network that wasn't the café's. None of it was clever. Now it's the kiosk: tell the safe
  networks and pages from the look-alikes."
- **On completion** (defend done): "That's both sides done. On the venue's own network with the VPN, ordinary
  work is fine; a Wi-Fi page wanting your work password is always a fake, and when you're not sure it's the
  phone's hotspot. Keep your devices with you, and if you lose one, ring the service desk straight away, day
  or night. Nobody's ever in trouble for reporting."

## 9. Attack half (the consequence stage)

Not scored. E20 has no attacker and no target to judge: in place of an attack half the learner makes a few
everyday choices on the road in a safe sandbox (`mistake`, ENG-04), then the flip runs as a montage (§10).
**No real network is joined and no real password is typed; every situation, option and venue is authored
data.** The engine surface is ENG-04; this section gives the content its config carries. The sandbox is
`scored: false` (always), so the measurement lives entirely in the defend half.

### The `mistake` block (ENG-04 `awarenessEpisode.mistake`)

Five beats, each one everyday choice with exactly one safe option (ENG-04 lints exactly one `safe: true` per
beat). The field names match ENG-04's normative shape (`id`, `situation`, `options[]` with `id`, `label`,
`safe`, optional `approvedRoute`). The `flipBeat` is `cafe_wifi` (the one with a real adversary, which sets
up the defend half, aw2).

```jsonc
"mistake": {
  "scored": false,
  "beats": [
    {
      "id": "train_screen",
      "situation": "On the 07:42, you open the client list to check it before the meeting. Where do you work on it?",
      "options": [
        { "id": "aisle_open",   "label": "Here, in the aisle seat, with people in the row behind", "safe": false },
        { "id": "back_to_wall", "label": "Move to the seat with its back to the wall, privacy screen on, and leave the sensitive bits for later", "safe": true, "approvedRoute": true }
      ]
    },
    {
      "id": "cafe_call",
      "situation": "In the café queue, a client rings and asks you to read out the building's alarm code and the room list. What do you say?",
      "options": [
        { "id": "read_it_out", "label": "Read it out quietly over the phone", "safe": false },
        { "id": "call_back",   "label": "\"I'll call you back from somewhere private,\" or send it through the approved route", "safe": true, "approvedRoute": true }
      ]
    },
    {
      "id": "mind_laptop",
      "situation": "You go to the counter. The friendly person at the next table offers to watch your laptop. What do you do?",
      "options": [
        { "id": "leave_it",   "label": "Thank them and leave it with them, you'll only be a minute", "safe": false },
        { "id": "take_it",    "label": "Thank them, and take the laptop and tablet with you", "safe": true, "approvedRoute": true }
      ]
    },
    {
      "id": "cafe_wifi",
      "situation": "The café Wi-Fi list shows two networks that look like the venue's. The stronger one's page asks for your work email and password to get online. What do you do?",
      "options": [
        { "id": "sign_in_fake", "label": "Join the stronger one and sign in with your work account", "safe": false },
        { "id": "venue_or_hotspot", "label": "Join the network the staff name, wait for the VPN, or use your phone's hotspot", "safe": true, "approvedRoute": true }
      ]
    },
    {
      "id": "lost_tablet",
      "situation": "That evening the survey tablet isn't in your bag. It's locked. What do you do?",
      "options": [
        { "id": "wait_morning", "label": "Wait until the morning, it's locked and might turn up", "safe": false },
        { "id": "ring_now",     "label": "Ring the service desk now, day or night, and say what it was and where you last had it", "safe": true, "approvedRoute": true }
      ]
    }
  ],
  "flipBeat": "cafe_wifi"
}
```

Each beat is one choice; nothing is scored, and the chosen option id per beat is stored in
`episode_e20_remote_and_mobile_working_state.mistakeChoices` and discarded after the flip (ENG-04). The
sandbox shows no tool, no network configuration and no method; the fake Wi-Fi page is pre-filled with the
in-game account and nothing is typeable (ENG-04 and the Engine-needs safety rules).

### The one consequential choice quoted in the flip (aw2)

The lever the flip leans on is the **café Wi-Fi** (`cafe_wifi`): a password typed into a network named to look
like the venue's. The montage says the harm came from a look-alike network and an over-asking page, not from
any clever attack, and that joining the venue's own network (or the phone's hotspot) and never giving a
Wi-Fi page your work password is what would have stopped it. Because the attack is a consequence sandbox (no
pretext template, no mail send), aw2 is carried in the montage line for the `flipBeat` (§10), not in
`flipDefenderLineByChoice`.

## 10. Flip

After the sandbox, the flip runs as a montage (ENG-04 `flip.mode: "montage"`): "through their eyes", one beat
at a time, showing where each choice led, with the `flipBeat` (`cafe_wifi`) as the headline. It shows the two
days as ordinary people seeing or hearing what they had no reason to, and one network that captured a sign-in,
which sets up the defend half. The montage shows every beat; for a beat the learner took the safe option on,
ENG-04 shows the "taken instead" line (the version where it went wrong), so a careful learner still sees the
cost. No bystander is shown stealing or misusing anything (no-blame, §12).

- `strings.flipHeading`: "Through their eyes."
- `strings.flipMontageByChoice` (ENG-04 shape; the outer key is the beat id, the inner key the option id):

```jsonc
"flipMontageByChoice": {
  "train_screen": {
    "aisle_open":   "The student in the row behind read three clients' names off your screen before you closed it. She wasn't being nosy; the screen was just there.",
    "back_to_wall": "With your back to the wall and the privacy screen on, the names stayed yours. The student behind you saw a spreadsheet of nothing in particular."
  },
  "cafe_call": {
    "read_it_out": "Everyone in the queue heard the alarm code and which rooms to go to. By the next day the client had changed the code, and every cleaner needed the new one.",
    "call_back":   "\"I'll call you back\" was a complete answer. You rang from outside, and nobody in the queue heard a thing."
  },
  "mind_laptop": {
    "leave_it":    "The stranger was lovely and touched nothing. The couple at the next table, though, could read your open inbox for the whole four minutes you were at the counter.",
    "take_it":     "The laptop and tablet came with you to the counter, so there was nothing on the table for anyone to read, and nothing to walk off."
  },
  "cafe_wifi": {
    "sign_in_fake":    "The stronger network wasn't the café's; it was named to look like it. Your work password went to whoever set it up, and by mid-afternoon someone had signed in as you from across town.",
    "venue_or_hotspot": "You joined the network the staff named and waited for the VPN. The look-alike with the stronger signal got nothing from you. This is the one the attackers were counting on."
  },
  "lost_tablet": {
    "wait_morning": "The tablet sat in the café overnight, still signed in to the survey app. By the time you reported it next morning, it had been out of your hands for twelve hours.",
    "ring_now":     "You rang the service desk that evening. They locked the tablet within minutes, and when the café found it the next day it was switched back on. The hours that matter never happened."
  }
}
```

ENG-04's montage reads the stored beat choices; no landed global is needed. Author the lines in the core_09
voice (calm, no blame, the harm shown as information reaching people with no reason to see it, and as the work
it caused). The `cafe_wifi` headline is the aw2 line.

No new flip engine is needed beyond ENG-04's montage mode.

## 11. Defend set

The defend half is six ordinary triage cards: a Wi-Fi network list mirror pair, a sign-in-page pair and a
lost-device pair, each a safe item against a look-alike. All record into `se_awareness_records`. Verify on
(the mobile role has Verify on, as the built mobile check pair does), so "ask the venue for the network's
name" or "ask the service desk" is a scored safe move. The triageSet id is `e20_on_the_road_inbox`; episode
prefix `episode_e20_remote_and_mobile_working_defend_`.

The triageSet config follows the built page sets: `scoringProfile: "awareness"`, `verifyVerdict: true`,
`feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `reportAlwaysVisible: true`,
`outcome.passPercent: 0`. `channelTells`: `["lookalike_domain", "lookalike_network", "wifi_page_credentials",
"found_device_lure"]`. `lookalike_domain` is a shared-library tell (reused for the look-alike host in card 6).
**The three `lookalike_network`, `wifi_page_credentials` and `found_device_lure` ids are scenario-local to
E20** (no `10` check item scores them, so by the ENG-08 rule they stay local to this set): declare each in
`channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence on each flagging message
(a message-level `factorStrings` object, a sibling of `truth`, never inside it); do not append them to the
shared `CHANNEL_TELLS` and add no `SKILL_NAMES` entry. The validator accepts a labelled, non-factor local id
(`triage.rb` `flag_universe`). The `flagChips` labels and `redFlag` sentences are given below and collected in
the "Engine needs" ENG-08 additions.

Scenario-local tell wording (the set authors it inline):

- `lookalike_network`: "A public Wi-Fi network named to look like the venue's, often with a stronger signal"
- `wifi_page_credentials`: "A Wi-Fi sign-in page asking for your work password, or for more than accepting the terms"
- `found_device_lure`: "A message offering to locate or recover a lost device if you sign in"

### Cards (id, kind, content, verdict, reasoning)

| # | id | kind | content | correct move | reasoning |
|---|---|---|---|---|---|
| 1 | `e20_wifi_venue` | page (`state: "wifiList"`) | At The Bean and Barrow. The chalkboard by the till says the guest network is "BeanBarrow Guest". The network list shows "BeanBarrow Guest" (ordinary signal) and a stronger "BeanBarrow Free". | Trust (connect to BeanBarrow Guest), or Verify (ask staff for the name) | The network the staff named, joined and then left to the VPN, is the right one; ordinary work on it is fine. Connecting to it, or asking staff to confirm the name, both score full. (The genuine half of the mirror pair.) |
| 2 | `e20_wifi_eviltwin` | page (`state: "wifiList"`) | At Haverbridge Lodge. No staff sign names the network. The list shows "Haverbridge Lodge Guest" and a stronger "Haverbridge Lodge FREE", and the stronger one is already selected. | Report (don't join; ask the venue; use the hotspot) | You can't tell who runs a hotspot, and a look-alike with the strongest signal is the classic trick. Ask the venue for the real name, or use your phone's hotspot; don't just pick the strongest. `lookalike_network`. (Mirror of card 1.) |
| 3 | `e20_wifi_page_fake` | page | A Wi-Fi sign-in page, address bar "Not secure", on `tarrowby-wifi.example`: "Sign in with your work account to get free Wi-Fi," with Work email and Work password boxes (nothing typeable). | Report (never type your work password into a Wi-Fi page) | A venue's Wi-Fi page asks you to accept the terms, sometimes an email or a room number. It has no reason to want your work password. "Not secure" here means others on the network could read what you send, so this page is doubly wrong; but even with a padlock, a Wi-Fi page asking for your work sign-in is a fake (see E5: a padlock only means the connection is encrypted, not that the site is honest). `wifi_page_credentials`. |
| 4 | `e20_wifi_page_genuine` | page | A genuine captive portal on `thebeanandbarrow.example`, "Welcome to The Bean and Barrow. Tick to accept the terms and connect," with a single "I accept the terms" tick and a Connect button. | Trust (Carry on) | A real venue page asks you to accept the terms, and nothing more. Tick and connect; the VPN covers the rest. (The genuine contrast to card 3: a Wi-Fi page appearing is not itself the tell; what it asks for is.) |
| 5 | `e20_lost_device_genuine` | email | From Tarrowby's IT service desk (`it-servicedesk@tarrowby.example`): "A reminder for everyone on the road: if you lose a work phone, tablet or laptop, ring the 24/7 service desk straight away, day or night, even if it's locked and even if you think it'll turn up. Tell us what it was, when and where you last had it, and what was on it. We can lock or wipe it, but only once you tell us. We'll never ask for your password." | Trust (and act on it: keep the number to hand) | A genuine reminder from the service desk, asking for nothing and naming the usual route. The lock buys time; reporting at once is what lets them lock, wipe and sign the device out. Trusting it scores full. |
| 6 | `e20_lost_device_fake` | email | From "Device Recovery" on a look-alike (`tarrowbey.example`): "We've detected your lost work device. Sign in here within 24 hours to locate it, or it will be wiped," with a "Locate my device" link to a sign-in page on a look-alike host. | Report | You find a lost device by ringing the service desk, never by signing in to a link that found you first. The host is a look-alike and the clock is the lever; the link harvests your password. `found_device_lure`, `lookalike_domain`. |

Cards 1 and 2 are the explicit mirror pair (aw5): the same surface (a public Wi-Fi network list), one genuine
(Trust) and one look-alike (Report), so "a network list appeared" is not itself the tell. Cards 3 and 4 (the
Wi-Fi sign-in page) and cards 5 and 6 (the lost-device notice) are supporting contrasts in the same shape;
they keep the "real against fake" structure throughout. Under the `awareness` profile, trusting a genuine item
scores full (60), reporting a fake scores full (60), and trusting a fake scores zero, so the discriminator is
telling the fake from the real, and a cautious learner who reports a genuine one (or Verifies) is never marked
down (the built convention; E18 §11).

Cards 1, 4 and 5 are genuine (`truth.isPhish: false`, `flags: []`, with a `whyFine` and a `falseAlarmCost`);
cards 2, 3 and 6 are the fakes (`truth.isPhish: true`, with `flags`, `perFlagNote`, `ifTrusted`,
`reportReply`). Copy the built `email` card shape from `e6/defend.json` or `e5/defend.json`, and the built
`page` card shape from `e5/defend.json` (card 3's "Not secure" page is the ordinary built `page` with
`padlock: false`, and card 4's accept-terms portal is the built `page` with a single tick `fields: ["I accept
the terms"]`, no password box and so no autofill cue; no new state for cards 3 and 4). Cards 1 and 2 are the
built `page` kind with the new `page.state: "wifiList"` and a `page.networks` list (Engine needs). Cut to six
exactly as listed; keep cards 1 and 2 (the mirror pair), card 3 (the over-asking page) and card 5 (the lost
device report route).

**Do not repeat E6 or E10 (§18).** No text, QR or work-phone lure (that is E6); no download, fake update,
fake check, fake alarm or extension card (that is E10). Card 6 is a lost-device sign-in lure, a topic neither
E6 nor E10 covers; its tell is `found_device_lure`, and it cross-references E5 (the look-alike) and E10 (never
sign in to an unexpected page), not reused from them.

## 12. Debrief cards

Built debrief view, core_09 order:

1. A reasoning card per card above.
2. Genuine-item feedback (cards 1, 4 and 5: the venue's real network, the accept-terms portal and the real
   lost-device reminder).
3. The team-protected tally (aw6).
4. **The habit to keep** (shared, word for word, copied from the built shell via
   `awareness_deploy.awareness_block()`, not rewritten): "When a message pressures you to move money, grant
   access, sign in or read back a code, stop and check it yourself through a route you already trust, not the
   link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."
   ("sign in" is the Wi-Fi-page case directly.)
5. **The module line** (core_09, from `game_design.md` debrief): "Out of sight, out of earshot, never out of
   reach. Lost it? Report it now."
6. **The "On Monday" card as three things to do tonight** (core_09): "On Monday, three things: turn on the
   screen lock and auto-lock on your own phone if they're not on already; set your devices to forget public
   Wi-Fi networks and turn off auto-join, so they don't rejoin a look-alike by themselves; and save the 24/7
   service desk number in your phone, so if you lose a work device you can report it on the spot. Report
   anything at work using the route in the box below." (`debrief.mondayCard: "slot:customer_report_route"`
   fills the final clause.)
7. The customer report route (slot).
8. **The no-blame line** (`debrief.noBlameLine: true`). Draft: "Reading a screen over someone's shoulder,
   joining a network named like the café, or leaving a bag for a minute are ordinary slips that happen to
   careful people; the harm is in the hours before anyone says so, not in the slip. A miss here just shows
   what to change."

**Concept cards** (short, ENG-09b array form of `strings.conceptPanel`, in order):

- **Public Wi-Fi, in proportion:** "Nearly everything you do now is encrypted, and Tarrowby's laptops add a
  VPN on top, so ordinary work on the venue's own network is mostly fine. The old 'anyone on the café Wi-Fi
  can read your email' is out of date. What still catches people is a network named to look like the venue's,
  and a page that asks for your work password."
- **The look-alike and the over-asking page:** "You can't tell who runs a hotspot, so ask the venue for the
  network's name, and don't just pick the strongest signal. A venue's page asks you to accept the terms,
  sometimes an email or a room number. It never needs your work password; if one asks, close it, use your
  phone's hotspot, and report it."
- **Out of sight, out of earshot:** "In public, someone can see your screen and hear your call. Sit with your
  back to a wall, use a privacy screen, and lock the screen whenever you look away. On a call, no names,
  codes or client details; 'I'll call you back' is a complete answer."
- **With you, or locked away. Lost it? Report it now:** "A device never sits unattended in a café, a train or
  a car, even for two minutes. If you lose one, ring the service desk straight away, day or night, even if
  it's locked: the lock buys time, and the hours before you report are what matter."
- **What Tarrowby has set up (organisation slots):** "On Tarrowby's side: the laptops carry a VPN that
  connects by itself (Tarrowby Connect), every phone, tablet and laptop is encrypted and can be locked or
  wiped remotely, and the 24/7 service desk can sort a lost device the moment you ring. These are set up for
  you; your part is to keep the device with you and ring straight away if it goes missing." (This is the
  organisation-slot content, voiced as Tarrowby's controls, not a staff duty.)

The built `strings.conceptPanel` is a single panel, so more than one card needs **ENG-09b**'s array form.
Author the cards in the concepts.md voice.

## 13. Defend-only variant

Shell id `e20_remote_and_mobile_working_defend`, stages `["brief", "defend", "debrief"]`, same defend set
`e20_on_the_road_inbox`, prefix `episode_e20_remote_and_mobile_working_defend_defend_`. Put the defend-only
`brief` and `scopeNote` under `awarenessEpisode._defendOnly`. Draft defend-only brief (identical to §8b's
generator `brief`): "You're on an authorised exercise at Tarrowby Logistics, a fictional company. You're
working away from the depot and the public networks and sign-in pages keep coming up: the café's Wi-Fi and a
look-alike, a page that wants your work password, a notice about a lost device. Some are safe and some are
built to catch you. Handle each one, and never type your work password into a Wi-Fi page. No real network is
joined and no real password is typed here." Draft defend-only scope note: "Authorised exercise at Tarrowby
Logistics, a fictional company. In scope: the public networks and sign-in pages you meet working away from
the office. No real network is joined and no real password is typed." Both variants join both seeded
Hacktivity courses (follow `01_PIPELINE.md` P12 for the seeding; do not use `awareness_deploy.py`). **The
defend-only variant needs ENG-09b** (the debrief concept cards) and the **Wi-Fi card state** (the mirror
pair), **not** ENG-04: `mistake` and `flip` are `ATTACK_STAGES` ids dropped from a `defendOnly` shell, and
the defend half is ordinary triage.

## 14. Check-form items it feeds (see 10_CHECK_FORMS.md)

E20's topic (core_09 remote and mobile working) is the **mobile** role, whose measurable content is carried
by the **built `mobile` check pair** (the AB pair hosted by Lerato Dlamini, the BA pair by Jun Watanabe),
built for E6 and the module and held as the measured baseline. `10_CHECK_FORMS.md` adds only the two new pairs
`general_v2` and `data_conduct`; neither covers core_09, and there is no `mobile_v2`. The built `mobile` pair
already carries the module's mobile content (the assessment's C09-B2 mirror pair, "a 'wants your work password'
page against a look-alike network item", and the channel items E6 fed), so E20's Wi-Fi and public-sign-in
content is already represented by the pair's existing items.

- **Do not edit the six built role forms,** `mobile` included: they are the measured baseline. E20 adds **no
  new check items**; its three scenario-local tells (`lookalike_network`, `wifi_page_credentials`,
  `found_device_lure`) are an episode defend-half surface and are not carried into any check form (the built
  `mobile` pair scores only its own built flags, not these three), so the Wi-Fi-list, sign-in-page and
  lost-device cards stay defend-set only.
- There is no form-building engine packet for E20. Keep `passPercent` 0.
- **Report to the user:** E20 adds no new check items; its measurable content is the same mobile content the
  built `mobile` pair already measures. If a per-topic "remote and mobile working" pre/post figure is wanted,
  that is a new pair (a `mobile_v2`), which is the general trade-off `10_CHECK_FORMS.md` flags for adding a
  pair; do not build one without the user's go-ahead. Confirm against the built `mobile` forms that the Wi-Fi
  / work-password item the assessment expects is actually present (§20).

## 15. Files to create or change

- `planning_notes/phishing_and_social_engineering/awareness/e20/attack.json` (new): the `mistake` block (the
  five beats, their options, the `flipBeat`) and `strings.flipMontageByChoice` (§9, §10). There are no people,
  intelFacts, osint sites or phish targets (no attacker); the "attack" fragment is just the consequence
  sandbox and the montage lines. (Confirm against E11's built `attack.json` whether the `mistake` block and
  `flipMontageByChoice` live in `attack.json` or the erb; follow E11 exactly.)
- `planning_notes/phishing_and_social_engineering/awareness/e20/defend.json` (new): the triageSet
  `e20_on_the_road_inbox` (the six cards, cards 1 and 2 in the `wifiList` state), the `awarenessEpisode` block
  (`strings`, `_defendOnly`, `debrief` with the ENG-09b `conceptPanel` array), the three scenario-local tells
  declared in `channelTells` with `flagChips` labels and per-message `factorStrings.<id>.redFlag` sentences,
  and a `_brandAdditions` note for Zainab Hussain, The Bean and Barrow (and its networks) and Haverbridge
  Lodge (and its network). Reuse the built `tarrowby-wifi.example` and `tarrowbey.example` look-alikes; do not
  redeclare them.
- `scenarios/awareness_e20_remote_and_mobile_working/scenario.json.erb`, `mission.json`,
  `ink/zainab_hussain.ink` (new): the full-episode shell. Frame the room and host-ink structure from the
  Tarrowby room as E6 wires it (`01_PIPELINE.md` P5a, reuse `room_aw_tarrowby`), and take the `mistake`/`flip`
  stage shape and the two-aim consequence objectives from E11 (the ENG-04 reference), **not** E6's mail stage
  shape. Globals to declare: `episode_e20_remote_and_mobile_working_state: {}` (holds `mistakeChoices`, ENG-04),
  `se_awareness_records: []`, `episode_e20_remote_and_mobile_working_defend_{percent,reportRate,done,pass}`,
  plus any `mistake` stage-completion global E11's shell uses to gate aim 1. There are **no** `se_osint_state`,
  `se_intel_*`, `se_landing_pages` or `guess_*` globals (no osint, build, write or guess stage). The host ink
  completes aim 1 when the `mistake` stage is done and the conclusion task on
  `episode_e20_remote_and_mobile_working_defend_done === true`.
- `scenarios/awareness_e20_remote_and_mobile_working_defend/` (new): the defend-only shell.
- The two seeded Hacktivity courses: follow `01_PIPELINE.md` P12 (feature level only); do not use
  `awareness_deploy.py` for seeding.
- `BRAND_SET.md`: a Tarrowby `_brandAdditions` note for Zainab Hussain, The Bean and Barrow (networks
  BeanBarrow Guest, BeanBarrow Free) and Haverbridge Lodge (network Haverbridge Lodge Guest / FREE), with the
  name-clash search recorded (P11).
- ENG-04 (the `mistake` stage and montage) and ENG-09b (the debrief panels) engine work: owned by those
  packets. The Wi-Fi network list card state and its ENG-08 schema/validator additions, and the three
  scenario-local tell rows, are drafted under "Engine needs" below (no packet exists yet).

## 16. Bridge script outline

`tools/playtest/se/bridge-e20-full.jsonl` (and defend-only), modelled on the E11 bridge for the `mistake`/
montage half and on `bridge-e6-full.jsonl` / `bridge-e5-full.jsonl` for the triage defend half, plus whatever
test hooks the Wi-Fi card state exposes. Steps: brief; the sandbox makes each of the five choices (assert each
beat stores its option; take the unsafe `cafe_wifi` option so the montage headline fires); the montage plays
(assert one `.aw-montage-beat` per beat, the `cafe_wifi` headline first); defend handles each card on the
critical path (Trust cards 1, 4, 5; Report cards 2, 3, 6; and a Verify pass on card 1 to confirm "ask staff"
scores full); conclude on `episode_e20_remote_and_mobile_working_defend_done`. Run through `check-bridge.mjs`
and `run-suite.sh`. The bridge depends on ENG-04's test hooks for the sandbox and the Wi-Fi card state's for
cards 1 and 2.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e20_remote_and_mobile_working/scenario.json.erb`
  passes (and the defend-only shell).
- The social validators pass, including the ENG-04 `mistake` stage and `brief mistake flip defend debrief`
  order, the Wi-Fi `page.state: "wifiList"` card, and the three scenario-local tells (`lookalike_network`,
  `wifi_page_credentials`, `found_device_lure`) being accepted as labelled, non-factor local ids.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` passes (E20's shells added to the list).
- The shared rule-of-thumb test passes (habit string byte-identical).
- The bridge suite passes including `bridge-e20-full.jsonl`.
- Manual: no free-text password field appears anywhere; the Wi-Fi card shows network names and signal only,
  nothing typeable; the fake Wi-Fi page shows "Not secure" and the work-password boxes are not typeable; the
  montage is calm (no alarms, and under reduced motion nothing shakes); no bystander is shown stealing
  anything; the opened account in the `cafe_wifi` montage is shown as "someone", not a named colleague; the
  episode runs in about 15 minutes.

## 18. Do not

- Do not add a new place: reuse `room_aw_tarrowby`; the train, café, hotel and home office appear only inside
  the sandbox, montage and triage overlays.
- Do not add more than one new card state: the Wi-Fi network list (`wifiList`) is the only one; cards 3 and 4
  are the built `page` (`padlock: false` and an accept-terms tick), cards 5 and 6 are built `email`.
- Do not repeat E6 (texts and QR on a work phone) or E10's cards (downloads, fake updates, fake checks, fake
  alarms, extension prompts): cross-reference them instead. The one lure in the set (card 6) is a lost-device
  sign-in lure, a core_09 topic, not an E6/E10 card.
- Do not frighten people off public Wi-Fi: the venue's own network with the VPN is mostly fine; the tell is a
  look-alike network and a page asking for your work password, not Wi-Fi itself.
- Do not make bystanders villains: in the montage they are ordinary and harmless; the harm is where the
  information went.
- Do not turn the organisation controls (the VPN, device encryption, remote lock and wipe) into staff duties:
  they are organisation-slot debrief lines, voiced as Tarrowby's controls.
- No working technique: no network configuration, no SSID spoofing method, no tool names, no commands. Explain
  the look-alike network and the fake page as concepts only.
- No real network name, brand, person or non-`.example` domain; no homographs; no Hacktivity internals.
- Don't edit the six built role check forms (the `mobile` pair included), the generators, or the shared
  rule-of-thumb string.
- Don't run a generator into the repo, `git stash`, or add attribution lines.

## 19. Stop and ask if

- ENG-04 is not available (the full variant needs it for the `mistake`/montage half; the defend-only variant
  needs only ENG-09b and the Wi-Fi card state, and can ship first).
- ENG-09b is not available (both variants' debrief need the concept-card array).
- The Wi-Fi network list card state cannot be added as a small `page.state` (see Engine needs). If it cannot
  be built at all, stop: the Wi-Fi mirror pair is the required aw5 pair and there is no built kind for a
  network list. Do not substitute a plain `page` sign-in card for the list, because the learner would then
  not meet the look-alike-network recognition the pair exists to teach.
- ENG-04's montage cannot quote one beat as the headline (`flipBeat`): it should (the montage shows every
  beat, the `flipBeat` first). If the montage must score the beats, stop: the `mistake` sandbox is unscored.
- The built `mobile` check pair does not actually carry a Wi-Fi / work-password item (§14): if the assessment's
  C09-B2 mirror pair is not present in the built forms, the "already represented" claim fails and a new pair
  question goes to the user (do not edit the built forms).

## 20. Open questions

1. **Host choice.** Zainab Hussain (new named field service engineer, one new character art set) is used
   because she is the module's on-the-road explainer and a natural mobile-role voice, and because the Tarrowby
   hosts already in play are not field or on-the-road voices. The user may overrule this and reuse **Chidi
   Okeke** (E6 host, fleet coordinator, zero new art) or **Nilesh Solanki** (E9 host, IT service desk analyst,
   zero new art), with the controls voiced as Tarrowby's. Either removes the one new art set at the cost of a
   less natural on-the-road voice, and of reusing a host across two episodes at the same company (as E10
   reuses E5's Niamh).
2. **New names.** Zainab Hussain, The Bean and Barrow (and its networks BeanBarrow Guest / Free), and
   Haverbridge Lodge (and its network) all need the pre-ship web search and a BRAND_SET note. The Tarrowby
   company, brand, room and the `tarrowby-wifi.example` / `tarrowbey.example` look-alikes are built.
3. **The Wi-Fi card state.** This spec proposes one small new card state, `page.state: "wifiList"` with a
   `page.networks` list, scored by the ordinary page verdicts (Engine needs). The engine owner may prefer a
   different small shape (a dedicated tiny `wifi` kind, or a `networks` block without a `state`); E20's content
   works with any shape that renders a short network list and scores on the standard verdicts. Confirm the
   shape before authoring the fragment.
4. **The `mistake`/montage location.** This spec puts the `mistake` block and `flipMontageByChoice` in
   `e20/attack.json`. Confirm against E11's built shell whether ENG-04 episodes carry them in `attack.json` or
   in the erb, and follow E11 exactly.
5. **Check coverage.** E20 adds no new check items; its measurable content is the mobile content the built
   `mobile` pair already measures. Confirm the built `mobile` forms carry the Wi-Fi / work-password item the
   assessment's C09-B2 expects; if a per-topic figure is wanted, that is a new `mobile_v2` pair, the
   `10_CHECK_FORMS.md` trade-off, not to be built without the user's go-ahead.
6. **Home working (C09-LO6).** The camera-in-shot and screen-share content is carried only by the montage
   (`home` is not a sandbox beat here) and a debrief mention, to keep the cut-down episode tight. If the user
   wants a scored home-working card, it needs either a seventh defend card or a sixth sandbox beat; flagged
   rather than added.

## Engine needs

E20 needs **one** small new engine surface that has no packet in `02_ENGINE_WORK.md` yet: the Wi-Fi network
list card. Everything else E20 uses has a packet (ENG-04, ENG-09b, ENG-08) and is cited above. Draft the new
surface as a packet in the ENG-08 / triage style (do not edit `02_ENGINE_WORK.md`; this draft is the spec for
whoever adds it).

### ENG-NEW Wi-Fi network list card state (`page.state: "wifiList"`)

**Goal.** E20's defend-half mirror pair (cards 1 and 2, §11) is a public Wi-Fi network list: a short list of
nearby networks with signal strength, one of them a look-alike named like the venue's. No built triage kind
renders a network list. Add it as **one small new state on the built `page` kind**, so it reuses the page
card's chrome container, its verdict buttons (Trust / Report / Delete / Verify) and the `awareness` scoring
unchanged. It is authored, abstract data: no real network, nothing typeable, no network configuration or
method shown.

**Read first.** `inbox-triage/triage-kinds.js` (`page()` `:364`, `renderKindSurface()`, `NON_EMAIL_KINDS:23`,
`actionsFor()`); `triage-flags.js` (`chipIdsFor`, `redFlagString`); `scripts/scenario-schema.json` (the `page`
object, `additionalProperties: false`, `required: ["url"]`); `scripts/validate_social/triage.rb` (the `page`
checks); E20 §11. If ENG-03a (E10's `page.state`) has landed, add `wifiList` as one more enum value to the
existing `page.state`; if not, this packet adds the `page.state` key itself with the single `wifiList` value,
and the two are compatible (ENG-03a adds its seven values beside it).

**Change.**

1. **New optional `page.state: "wifiList"` and `page.networks`.** `page()` reads `p.state`; when it is
   `"wifiList"` it draws, inside the existing card container (not the browser address bar: a network list is
   not a web page, so no `url` is drawn and `url` is not required for this state), an authored network list
   from `p.networks` (an array of `{ ssid, signal, note? }`, each a static row with the SSID and a signal
   indicator, every string via `textContent`). An optional `p.venueNote` line (for example "The staff sign by
   the till names the network 'BeanBarrow Guest'") sets the context. Nothing is typeable and no network is
   actually joined; the learner's answer is the ordinary verdict (Trust = connect to the right one, Report =
   the look-alike, Verify = ask the venue for the name). Absent `state` renders the ordinary page as today.
2. **Verdicts and scoring unchanged.** A `wifiList` card is scored exactly as any `page` card under the
   `awareness` profile (`verdictPoints`), with no new verdict and no bespoke points. Verify is on for E20's
   set (`verifyVerdict: true`), so "ask the venue" (Verify) scores as a safe route.
3. **Tells.** The three E20 tells are scenario-local (§11): `lookalike_network`, `wifi_page_credentials` and
   `found_device_lure`, declared in the set's `channelTells` with a `flagChips` label and a per-message
   `factorStrings.<id>.redFlag` sentence; no shared-library or `SKILL_NAMES` change (the ENG-08 Rule). Make
   sure the `wifiList` surface offers the flag chips the way a `page` card does (the local ids are not in any
   `KIND_TELL_EXCLUDE` list, so no exclude change is needed).

**Schema and validator (ENG-08).** Add to the `page` object (`additionalProperties: false`): `state`
(if ENG-03a has not added it, an enum that includes `wifiList`; if it has, add `wifiList` to the enum) and
`networks` (array of `{ ssid (string), signal (string or number), note (string, optional) }`,
`additionalProperties: false`) and an optional `venueNote` (string). **Relax the `page.url` requirement** for
the `wifiList` state (as ENG-03a relaxes it for its chrome/overlay states): `url` is required only for the
web-page states and optional for `wifiList`. Lint that a `wifiList` card has a non-empty `networks` array and
that no `networks` entry carries a credential-like field.

**Tests to add.** `test/js/social-triage-wifi-list.test.mjs` (jsdom, copy the staging block from
`social-triage-kinds.test.mjs`): a `wifiList` card renders the network list and the venue note, with no
address bar and nothing typeable; a card with no `state` renders exactly as the built page; the card scores on
the chosen verdict through the shared `verdictPoints` path (no bespoke value); extend
`validator-social-triage.test.mjs` (a clean `wifiList` card; failing cases: no `networks`, a `networks` entry
with a password-like field).

**How it is guarded.** `page.state` and `page.networks` are new optional keys; absent, the built page renders
unchanged. No built page card authors them, so E5, E6, E10 and the lab are byte-for-byte unaffected.

### ENG-08 additions E20 needs (collected, to fold into ENG-08)

- **Stage order:** none new. E20 authors `brief mistake flip defend debrief` (ENG-04's order) and the
  defend-only `brief defend debrief` (the built `defendOnly` order). No new `stage_orders` branch for E20.
- **Schema keys:** the `page.state`/`page.networks`/`venueNote` keys above (shared with ENG-03a's `page.state`
  if it has landed). No new `socialAwarenessEpisode` or `socialTriageSet` key beyond what ENG-04 (`mistake`,
  `flip`, `flipMontageByChoice`) and ENG-09b (`conceptPanel` array) already add.
- **Tells:** E20's three ids are **local** (no check item scores them), declared only in E20's `channelTells`
  with `flagChips` labels and per-message `factorStrings.<id>.redFlag` sentences; no `CHANNEL_TELLS` or
  `SKILL_NAMES` append. Wording in §11.
