# E18 credential stuffing and password spraying at scale (implementation spec)

Status: draft for a Sonnet implementer. E18 is a new awareness episode at Merrin & Sallow Architects. It is
the organisation-scale companion to E9: where E9 guesses one colleague's password from his personal facts,
E18 runs an authored campaign against the **whole practice**, harvesting staff names and the email address
pattern from public sources, building a word list from the company's own website, then showing password
spraying and credential stuffing as authored, abstract models. It leans on a new engine surface, **ENG-02b**
(organisation-scale `guess.mode`: `spray` and `stuff`), which extends ENG-02's `guess` stage and does not
yet exist, so the full episode's attack half cannot be built until ENG-02 and ENG-02b land. This spec gives
the content in full and states exactly what ENG-02b must provide, so authoring is ready the moment the
packet is in.

Writer: opus48 agent. Never run a generator into the repo. Never `git stash`. No attribution lines in commits.

The user asked for coverage of (a) credential stuffing and (b) CeWL / theHarvester-style password guessing
from public information, where the course does not already cover them. E9 covers single-person guessing and a
single reuse step; E18 covers the organisation-scale attack: harvesting the roster and the address pattern,
building a word list from the website, password spraying (one likely password tried once across many accounts,
so no single account locks) and credential stuffing at scale (a breach list of address and password pairs tried
automatically across many services). The attack half must **not** repeat E9's single-person guesser. This is a
planning document: the on-screen text never names a tool; the planning prose may say the request was about
CeWL/theHarvester-style attacks, but the game content shows no tool, command or working technique.

---

## 1. Goal and module(s)

Teach that attackers do not need to crack passwords one account at a time: they harvest who works somewhere and
the address pattern from public pages, build a word list from the organisation's own website, then try one
likely password across every account at once (spraying, so no single account locks), and feed breach lists of
address and password pairs across many services (stuffing). The one habit that stops both is a different
password for every account, not a company word, kept in a manager; the organisation's job is lockout, MFA
everywhere, a banned-password list that blocks company words, and breach monitoring. Modules: **core_03**
(passwords, passphrases and MFA; the second core_03 episode, at organisation scale, after E9) and **role_03**
(IT administrators and service desk; the organisation-scale signals and controls). The organisation controls
are **organisation-slot debrief lines, not staff duties** (§12): a non-technical learner cannot turn on lockout
or a banned-password list, so those lines say "what the practice has arranged", not "what you must do".

Learning outcomes drawn on:

- core_03 (`modules/core_03_passwords_and_mfa/concepts.md`): "Why reuse is the big one" and the credential
  stuffing glossary entry; "How passwords get stolen" (the guessing and reuse-and-credential-stuffing rows);
  "The usual guesses" (common passwords and local patterns); LO1 (a different password per account, a manager),
  LO2 (three random words, leave out names, dates, teams and the organisation's name plus a year), LO3
  (made-up answers, unique sign-ups). The guesser/reuse rig in E9 is this module's single-person demonstration;
  E18 is the organisation-scale one.
- role_03 (`modules/role_03_it_admins_and_service_desk/concepts.md`): the organisation-scale view, "enhance
  monitoring against unauthorised account misuse" including risky sign-ins, several resets or the same caller
  trying different analysts, and the organisation controls (lockout, MFA everywhere, a banned-password list,
  breach monitoring). These are surfaced as the host's organisation-slot lines and the debrief, not as staff
  duties.

## 2. Read first (exact paths)

- `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md`.
- Teaching source of truth: `modules/core_03_passwords_and_mfa/concepts.md` (the whole file; "Why reuse is the
  big one", "How passwords get stolen", "The usual guesses", the "Credential stuffing" glossary entry and the
  organisation slots) and `modules/role_03_it_admins_and_service_desk/concepts.md` ("Why service desks are a
  target", "Alerts you shouldn't ignore", "Enhance monitoring", the organisation slots). Also
  `modules/core_03_.../game_design.md` and `modules/core_03_.../assessment.md` for the mirror-pair convention.
- **The nearest built episode: E9** `implementation/episodes/E09_passwords.md` end to end (the closest sibling;
  copy its structure, its `guess`-stage wiring, its §8b, and its no-blame handling of reuse). E18 is the
  organisation-scale twin of E9 and reuses its engine packets (ENG-01 flip aftermath, ENG-09b debrief panels)
  plus the new ENG-02b.
- **The Merrin & Sallow built shells and cast:** `scenarios/awareness_e4_exec_whaling/` end to end (the built
  Merrin & Sallow room wiring, the two-aim shape, the host NPC done event), its fragments
  `planning_notes/phishing_and_social_engineering/awareness/e4/{attack,defend}.json`; and the E12 and E14 specs
  (`implementation/episodes/E12_visitor_and_tailgater.md`, `E14_social_media.md`) for the built and proposed
  Merrin & Sallow cast and the new-cast conventions.
- Shapes and ids: `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` (the shared
  channel-tell library, the triageSet `truth` shape, the `page` card from E5, the `email` card) and
  `designs/11_awareness_product_episodes.md`.
- Companies and cast: `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` (Merrin & Sallow
  roster and the E4 `_brandAdditions`); `planning_notes/security_awareness_course/03_WORLD_AND_CAST.md` (hosts
  and the no-clash name pool; E18's host is drawn from it).
- Runner and engine: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS`,
  `ATTACK_STAGES`, `childLaunch`, `cleanSent`; verified 2026-10-28); `public/break_escape/js/minigames/
  inbox-triage/` (the built `email` and `page` triage cards); `public/break_escape/js/systems/phish-rules.js`
  (`CHANNEL_TELLS`); `scripts/validate_social/awareness.rb` and `triage.rb`.
- Engine packets: `implementation/02_ENGINE_WORK.md`, **ENG-02** (the `guess` stage), **ENG-02b** (the new
  org-scale modes; drafted alongside this spec), **ENG-01** (`flipAftermath`), **ENG-09b** (debrief panel list),
  and **ENG-08** (schema/validator).

## 3. Depends on

- **ENG-02** (the `guess` stage) **and ENG-02b** (organisation-scale `guess.mode` `spray`/`stuff`). E18's
  attack half is one `guess` stage in `mode: "spray"`: the campaign console that harvests the roster, builds the
  word list, sprays one password across all accounts and runs the credential-stuffing panel. E18 cannot build
  its full variant's attack half without both. §9 gives the `awarenessEpisode.guess` config ENG-02b must accept.
  ENG-02b is guarded so E9's single-target config (no `mode`) is byte-for-byte unaffected.
- **ENG-01** (`flipAftermath`). E18's flip reuses the victim's-seat aftermath exactly as E9 does: after the
  campaign lands, the learner is put in their own seat and sees the first signals (a sign-in alert and a lockout
  notice), which sets up the defend half. No new flip engine. `flipAftermathFor(episode, { landed })` shows it
  only when `landedGlobal` is true (ENG-02b writes it).
- **ENG-09b** (debrief panel list). E18's debrief shows several short concept cards (§12), and the built
  `strings.conceptPanel` is a single panel; ENG-09b adds the array form. E18's **defend-only variant also needs
  ENG-09b** (the concept cards are in the debrief of both variants), but **not** ENG-02b (the `guess` stage is an
  `ATTACK_STAGES` id, dropped from a `defendOnly` shell; the defend half is ordinary `email`/`page` triage).
- **ENG-08** (schema and validator): adds `guess.mode` and the `spray`/`stuff`/`roster`/`wordList` sub-objects
  to the `guess` object (ENG-02b owns the shape; ENG-08 collects the keys), and accepts E18's three
  scenario-local tells (labelled in `channelTells`, not added to the shared library). E18 adds **no** new stage
  id and **no** new stage order: it authors the same stage list as E9 (`brief osint guess flip defend debrief`),
  which ENG-08 already allows for ENG-02.
- **No ENG-09a.** E18's defend half is six ordinary `email` and `page` triage cards with a mirror pair; there
  are no authored-choice (`choice`) cards, so E18 does not depend on ENG-09a.

## 4. Owner models

- Content and dialogue: `opus48`.
- ENG-02b engine surface, the schema/validator additions and the shell wiring: general-purpose or Sonnet,
  after ENG-02 and ENG-02b are built.

## 5. Company, room and host

- **Company:** Merrin & Sallow Architects (`merrin_sallow`), chosen because an architecture practice's website
  is full of project names, which suits the word-list point, and because it reuses a built brand, room and (for
  the roster) cast, so E18 adds the fewest new episodes and the least art. Brand block, copied exactly from the
  built E4 shell: `{ "name": "Merrin & Sallow Architects", "logoText": "MERRIN & SALLOW", "accent": "#8a5a2b" }`.
  Domain `merrinsallow.example`; look-alikes `merrin-sallow.example`, `merrinsallow-studio.example` (E4/E12/E14).
- **Room:** reuse the built `room_aw_merrin_sallow`, exactly as `scenarios/awareness_e4_exec_whaling/
  scenario.json.erb` wires it (`"type": "room_aw_merrin_sallow"`, `chatBackground:
  "assets/backgrounds/rooms/aw_merrin_sallow_blended.png"`, the same lighting and kiosk object). No new room.
  The campaign console, the OSINT board and the triage cards are full-screen overlays, as at every company.
- **Host:** **Ama Owusu**, the security lead on Merrin & Sallow's outsourced IT and security contract (the
  practice is small and uses a managed provider; Ama is the provider's named security lead for the account).
  Drawn from the `03_WORLD_AND_CAST.md` no-clash name pool ("Ama Owusu, information security manager; 40s, Black
  British, Ghanaian heritage; warm, practical"), repositioned here as the practice's security contact. She
  welcomes the learner, frames the campaign as an authorised test she arranged, carries the per-item feedback and
  the debrief, holds the N16 conclusion `eventMappings`, and voices the organisation-slot lines (lockout, MFA
  everywhere, the banned-password list, breach monitoring) as the provider's controls, which is exactly why they
  are organisation-slot debrief lines and not staff duties (role_03). **Placeholder host sprite** reusing a built
  female host sprite (for example `female_scientist` / `female_scientist_talk.png` / `female_scientist_visemes.png`,
  as Anjali Rao uses at Quayholt; confirm the chosen built sprite with the art schedule); host art follows the
  PixelLab reset. Ama is a **new named character** at Merrin & Sallow: one new character art set, flagged below.
  - **Why not an existing Merrin & Sallow host.** The built M&S hosts are a studio manager (Thandiwe Moyo), a
    finance controller (Yasmin Chaudhry) and a co-founding partner (Julian Sallow); E12 adds a reception/facilities
    lead (Lorna Easton). None is an IT or security voice, and role_03's organisation-scale controls read oddly
    from a studio or finance host. A dedicated security contact feeds role_03 cleanly and lets the controls be the
    provider's, not the learner's. The user can overrule this and reuse Lorna Easton (facilities, zero new art),
    with the controls voiced as "what our IT provider has set up"; see §20.
- **Role:** `general_staff` (all staff) with a role_03 flavour carried by the host and the debrief. E18 feeds the
  `general_v2` check-form pair (§14), the same pair E9 feeds.
- **Attack targets (the roster):** reuse the **built** Merrin & Sallow cast by name only, as the harvested staff
  list: Catherine Merrin, Julian Sallow, Yasmin Chaudhry, Thandiwe Moyo (E4) and Dani Fenwick (E14). No new cast,
  no art for these; they are names on a team page, assembled into `firstname.lastname@merrinsallow.example`
  addresses by the harvester. The accounts that "open" in the spray and stuff panels are shown as a **count**,
  never pinned on a named colleague (no-blame, §12).

### New names and brands E18 introduces (need the pre-ship web search and a BRAND_SET `_brandAdditions` note)

- **Ama Owusu**, security lead at Merrin & Sallow's managed IT and security provider, **Fenlow Managed IT**
  (`fenlow.example`). Both fictional; pre-ship web-search check required. (If the user prefers reusing Northlight
  Security, the E12 red-team firm, as the provider, that avoids one new company name; see §20.)
- The practice's website words used for the word list: two fictional project names **Calderbank Mills** and
  **Elmgate Pavilion**, the practice strapline **"Design that lasts"**, and the studio street **Verrow Street**.
  All fictional; pre-ship web-search check required (projects and the strapline especially, as they read as names).

All people and companies are fictional; every address and domain ends `.example`. No homographs. The roster
names are the built E4/E14 cast, which already carry BRAND_SET entries.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | Notes |
|---|---|---|
| brief | 1.0 | Ama's welcome and scope note (the authorised campaign). |
| osint | 2.5 | Collect the practice's public details: the team-page roster, the address pattern, and the website words (projects, motto, place). |
| guess (campaign console, ENG-02b `spray`) | 3.5 | Assemble the roster and the word list; spray one password across every account (no account locks); the credential-stuffing panel; a passphrase account holds out. |
| flip | 1.5 | The learner's own seat: the first signals the campaign produced (a sign-in alert, a lockout notice). Reuses ENG-01 `flipAftermath`. |
| defend | 4.5 | Six cards: genuine security notices against their fake look-alikes (lockout, sign-in alert, breach alert), Verify on. |
| debrief | 2.0 | Concept cards (spraying, stuffing, one unique password per account, the organisation's controls), the tally, the habit, the "On Monday" card, the report route, the no-blame line. |

Defend-only variant: brief, defend, debrief, about 8 minutes.

## 7. Stages (runner stage ids)

Full episode: `["brief", "osint", "guess", "flip", "defend", "debrief"]` (the same stage list E9 authors).

- `guess` carries the organisation-scale campaign console, in `mode: "spray"` (ENG-02b). It is **not** a reuse of
  `build`; it is ENG-02's `guess` stage with the new `spray` render mode. E18 passes an `awarenessEpisode.guess`
  config block with `mode: "spray"` (ENG-02b owns the shape; §9 gives the content).
- There is **no `write` stage**: E18 sends no email or call; the campaign console is the attack artefact. ENG-08's
  `brief osint guess flip defend debrief` order (added for ENG-02) is reused unchanged.
- `flip` reuses ENG-01's `flipAftermath`: after the campaign lands, the learner is put in their own seat and
  shown the first signals. No new flip engine (E9 §10 does the same).
- `defend` runs six ordinary `email` and `page` triage cards, recording into `se_awareness_records` like any
  defend half.

Defend-only: `["brief", "defend", "debrief"]`. **The defend-only variant needs ENG-09b** (the debrief concept
cards) but **not** ENG-02b: `guess` is an `ATTACK_STAGES` id that `stagesFor` drops from a `defendOnly` shell
(`episode-model.js:68`), and the defend half is ordinary `email`/`page` triage. So, unlike E9 (whose defend-only
needs ENG-09a for its `choice` cards), E18's defend-only has no attack-half engine dependency; it can ship once
ENG-09b lands.

## 8. Brief and scope note (host's draft lines)

- **Episode id:** `e18_credential_attacks_at_scale`. Defend-only shell id: `e18_credential_attacks_at_scale_defend`.
- **`strings.brief`:** "You're on an authorised exercise at Merrin & Sallow Architects, a fictional London
  architecture practice. First you're on the red team: you don't attack one person, you go after the whole
  practice at once. Gather who works here and how their email addresses are built, make a word list out of the
  practice's own website, then try one likely password against every account in one go, and a stolen breach list
  across lots of services. Then it's your own seat: the alerts start arriving, and you tell the real ones from
  the fakes. Only that part is scored."
- **`scopeNote`:** "Authorised exercise at Merrin & Sallow Architects, a fictional company. In scope: a staff
  list and word list built from the practice's public pages, and the security alerts you handle afterwards. No
  real password is ever typed or stored; every account, word and pair is made up."
- **Ama's welcome (host ink, hub pattern):** "Welcome to the Merrin & Sallow exercise. I look after security for
  the practice. Attackers rarely pick one person and crack them; they scoop up everyone's names and a few words
  off the website, then try one password across the lot, quietly, so nothing locks. I'll show you how on a safe
  copy, then you're in your own seat telling the real alerts from the fakes. Nothing you touch here is a real
  password."

## 8b. Shell and generator metadata (every value final; no guessing)

Every metadata value the shell wiring (01 P2/P3) and the generator (01 P4, `gen_e8_e17_shells.py`) need, as final
strings, so a Sonnet implementer invents nothing. Copy the shapes from the built **E4** erb and `mission.json`
(same company and room) and the generator helper scaffolding; E4's host entry is Julian's/Thandiwe's, so E18's
host entry (Ama) is authored new here, with the name-clash search in P11. The `opus48` content step fills §8b,
§9's `guess` content, §10's flip strings and §11's defend items before any Sonnet begins P2. **The full episode
also needs ENG-02 and ENG-02b (`guess` in `spray` mode) and both variants' debrief needs ENG-09b; §8b is the
generator and shell metadata, which does not itself wait on those packets.**

### Host and learner sprites

- **Ama Owusu's `HOSTS['ama']` entry** (authored new in `gen_e8_e17_shells.py`, Merrin & Sallow addition;
  `sprite` is the base key, the in-scenario `spriteSheet` adds `_v2`): `{ 'id': 'ama_owusu', 'displayName':
  'Ama Owusu', 'sprite': 'female_scientist', 'about': "Security lead on Merrin & Sallow's outsourced IT and
  security contract (Fenlow Managed IT), 40s, Black British of Ghanaian heritage (BRAND_SET.md, E18 additions).
  Welcomes the learner, carries the feedback and debrief, and voices the organisation's controls. Reuses a built
  sprite (placeholder until the PixelLab reset)." }`.
- **Ama's in-scenario host NPC sprite keys** (full erb `rooms.training_room.npcs[]`, following the E4 host NPC
  shape): `"spriteSheet": "female_scientist_v2"`, `"spriteTalk": "assets/characters/female_scientist_talk.png"`,
  `"spriteVisemes": "assets/characters/female_scientist_visemes.png"`, `"npcType": "person"`, `"id": "ama_owusu"`,
  `"displayName": "Ama Owusu"`, `"storyPath": "scenarios/awareness_e18_credential_attacks_at_scale/ink/
  ama_owusu.json"`, `"currentKnot": "start"`, plus the N16 done-event `eventMappings`. Host art is a placeholder
  (a reused built sprite) until the PixelLab reset.
- **Learner avatar** (full erb `player`), as E4: `"spriteSheet": "female_office_worker_v2"`, `"spriteTalk":
  "assets/characters/female_office_worker_talk.png"`.

### Full-episode objectives (full erb `objectives[]`, copy the E4/E9 two-aim shape)

| field | aim 1 (red team) | aim 2 (defend, `missionConclusion: true`) |
|---|---|---|
| `aimId` | `red_team_campaign_aim` | `tell_them_apart_aim` |
| `title` | "Run the campaign" | "Tell the real alerts from the fakes" |
| `description` | "Build a staff list and a word list from the practice's public pages, then spray one password across every account and run a stolen breach list across many services." | "Work through the security alerts at the training kiosk." |
| `order` | 0 | 1 |
| task `taskId` / `title` / `type` | `run_the_campaign` / "Run the campaign against the practice" / `manual` | `handle_the_alerts` / "Handle the security alerts" / `custom` |

Aim 2 `concludeRequires.globals`: `["episode_e18_credential_attacks_at_scale_defend_done"]`. Aim 2
`conclusionScreen`: `{ "type": "success", "title": "Credential attacks at scale episode done", "body": "You've
seen a whole practice sprayed and stuffed from its public pages, then handled the alerts from your own seat, so
this episode is finished." }`. `awarenessEpisode.conclusionTaskId: "handle_the_alerts"`.

### Full-episode training kiosk (full erb `rooms.training_room.objects[]` kiosk, copy the E4 shape)

- `observations`: "A touch-screen training kiosk for the Merrin & Sallow credential exercise: first a campaign
  built from the practice's public pages, then the security alerts to handle from your own seat."
- `observationVariants[0]`: `{ "condition": "globalVars.episode_e18_credential_attacks_at_scale_defend_done",
  "value": "A touch-screen training kiosk for the Merrin & Sallow credential exercise. The campaign has run and
  the alerts are all handled." }`
- `minigameData.episodeId`: `e18_credential_attacks_at_scale`.

### Full-episode `mission.json` (copy the E4 mission.json shape)

- `display_name`: "Awareness E18: Credential stuffing and password spraying (full episode)"
- `description`: "An awareness episode of about 15 minutes for all staff. On an authorised exercise at Merrin &
  Sallow Architects, a fictional architecture practice, you first play the attacker at scale: build a staff list
  and a word list from the practice's public pages, spray one password across every account at once, and run a
  stolen breach list across many services. Then it's your own seat, telling the genuine security alerts from the
  fakes. Only that part is scored, and reporting when you're unsure is always fine and never marked down. No real
  password is ever typed."
- `difficulty_level`: 1; `scoring`: "completion"; `secgen_scenario`: null; `collection`: "training";
  `ui_theme`: "general"; `estimated_duration_minutes`: 15.
- `cybok`: `[ { "ka": "HF", "topic": "Human Factors", "keywords": ["Passwords", "Credential stuffing", "Password
  spraying", "Security awareness", "Multi-factor authentication"] } ]`.

Top-level erb strings (copy E4's): `scenario_id` `awareness_e18_credential_attacks_at_scale`; `scenario_name`
"Credential stuffing and password spraying: both sides"; `scenario_brief` = `strings.brief` (§8); `endGoal`
"Run the campaign, then handle the security alerts at the training kiosk."; `version` "1.0"; `disableAttacks`
true; `startRoom` `training_room`; `startPosition` as E4.

### Defend-only shell: generator `EPISODES['e18']` entry (`gen_e8_e17_shells.py`, following the `gen_e6_e7_shells.py` `EPISODES` shape)

```python
'e18': {
    'frag': f'{AW}/e18/defend.json',
    'full_id': 'e18_credential_attacks_at_scale',
    'role_word': 'general',
    'role_label': 'all staff',
    'defend_set': 'e18_atscale_inbox',
    'defend_host': 'ama',
    # No 'forms'/'check_hosts': E18 feeds general_v2, built by 10's own generator, not this one (see §14).
    'cybok': [{'ka': 'HF', 'topic': 'Human Factors',
               'keywords': ['Passwords', 'Credential stuffing', 'Password spraying', 'Security awareness', 'Multi-factor authentication']}],
    'defend': {
        'name': 'Credential alerts: tell the real from the fake',
        'brief': "You're on an authorised exercise at Merrin & Sallow Architects, a fictional company. A campaign has swept the practice, and the alerts are arriving: your account locked, a new sign-in, a breach warning. Some are genuine and some are fakes built to catch you. Handle each one, and never type a password to 'check' or 'unlock' anything. No real password is ever typed here.",
        'endGoal': 'Handle the security alerts at the training kiosk.',
        'aim': ('tell_them_apart_aim', 'Tell the real alerts from the fakes', 'Work through the security alerts at the training kiosk.'),
        'task': ('handle_the_alerts', 'Handle the security alerts'),
        'kiosk': ("A touch-screen kiosk showing the alerts after a credential sweep of the practice: some genuine, some fakes to catch you.",
         "A touch-screen kiosk showing the alerts after a credential sweep. They are all handled."),
        'display': 'Awareness E18: Credential stuffing and password spraying (defend only)',
        'desc': "An awareness episode of about 8 minutes for all staff, on the defending side only. A campaign has swept Merrin & Sallow Architects, a fictional practice, and the alerts are arriving: a lockout, a sign-in alert, a breach warning, some genuine and some fakes. Each answer is explained, and reporting when you're unsure is always fine and never marked down. No real password is ever typed.",
        'minutes': 8,
        'defendIntro': "Go through the security alerts and decide what to do with each one. Genuine notices never need you to type a password to unlock or check anything; the ones that do are fakes. Report the fakes, act on the real ones the safe way, and there's no clock on you here.",
        'conclusion': ('Alerts handled', "You've sorted the genuine alerts from the fakes and finished this episode."),
    },
},
```

The entry uses the real `gen_e6_e7_shells.py` keys (`conclusion`, `defendIntro`), not the `ending` spelling of
`gen_e3_e5_shells.py` (01 P4 lists the required keys once). This `brief` is the same text as §13's defend-only
brief (keep them identical). The defend-only shell id is `e18_credential_attacks_at_scale_defend`, prefix
`episode_e18_credential_attacks_at_scale_defend_defend_` (§13). The defend-only `scopeNote` and `_defendOnly`
strings are in the fragment (§13). The defend set `e18_atscale_inbox` carries only built `email`/`page` cards, so
the generated shell validates with no ENG-02b dependency; it needs ENG-09b only for the debrief panels.

### Defend-host lines: generator `LINES[('e18', 'defend')]` (the tuple `(before, after, choice, reply)`, Ama's voice)

```python
('e18', 'defend'): (
    "Right, this is your own seat now. After a sweep like that the alerts come thick and fast, and the attackers send fakes dressed up as the real ones. Handle each one, report the fakes, and never type a password to unlock or check anything. No rush, and nothing here is real.",
    "That's them all sorted, thanks. A genuine alert never asks for your password; the fakes always do. Report the fakes and change a reused password on the real site, and that's the whole of it.",
    'Thanks, Ama.', 'Any time.'),
```

### Host spoken lines for the full shell (ink, Ama)

- **Welcome** (at the hub): the §8 welcome line.
- **After the attack half** (on the kiosk hand-off into the defend half): "See how little it took: a staff list,
  a few words off the website, one password tried across everyone, and a stolen list from somewhere else. The
  accounts that opened were the predictable ones. Now it's your seat, and the alerts are arriving: some real,
  some fakes meant to finish the job."
- **On completion** (defend done): "That's both sides done. A different password for every account, not a word
  off the website, kept in a manager, is what breaks the spray. On our side we lock accounts after a few bad
  tries, put MFA on everything, block the obvious words and watch the breach lists. Nobody's ever in trouble for
  reporting."

## 9. Attack half (the organisation-scale campaign console)

Not scored. The learner runs an authored campaign console against the whole practice, from the practice's own
public pages, in the `guess` stage in `mode: "spray"` (ENG-02b). **No real password is ever typed; every account,
word and breach-list row is authored data; the console shows no tool and no method.** The engine surface is
ENG-02b; this section gives the content its config carries. The attack half **must not repeat E9's single-person
guesser**: E18 never guesses one named colleague's personal facts; it harvests a roster and sprays and stuffs at
scale.

### OSINT facts (ids, sources)

Reuse a Merrin & Sallow `merrin_site` and `merrin_social` in `osint` (profile `awareness`), modelled on E4's
sites. Each `se_intel_*` global declared `false`.

| fact id | subject | source | fact text | feeds |
|---|---|---|---|---|
| `ms_team_roster` | company | `blk_people` (People page, `kind: staff`) | "The 'People' page lists the practice's staff by full name: Catherine Merrin, Julian Sallow, Yasmin Chaudhry, Thandiwe Moyo, Dani Fenwick and others." | the roster of names |
| `ms_email_pattern` | company | `post_contact` (a contact address in a published PDF) | "Staff email addresses are built as firstname.lastname@merrinsallow.example." | the address pattern, so the roster becomes real addresses |
| `ms_projects` | company | `blk_projects` (Projects page) | "The 'Projects' page names current schemes, among them Calderbank Mills and Elmgate Pavilion." | word list: project names |
| `ms_motto` | company | `blk_home` (home page) | "The practice's strapline is 'Design that lasts'." | word list: motto words |
| `ms_place` | company | `blk_visit` (Visit us page) | "The studio is on Verrow Street." | word list: place names |

(All invented; "Calderbank Mills", "Elmgate Pavilion", "Design that lasts" and "Verrow Street" need the pre-ship
web search with the other new names. The roster names are the built E4/E14 cast.)

### Campaign config (ENG-02b `guess` with `mode: "spray"`)

The console assembles four panels from the collected facts, in the order an attacker works. Each `wordList` slot
reads **one** collected OSINT fact by `factId` and interpolates only its own brace token (ENG-02b resolves one
`factId` per slot, exactly as ENG-02's `patternSlots` do); the season and year are baked literals; nothing crosses
slots. The roster reads the two named facts. The config E18 passes (field names match ENG-02b's `guess` shape):

```jsonc
"guess": {
  "mode": "spray",
  "roster": {
    "namesFactId": "ms_team_roster",
    "patternFactId": "ms_email_pattern",
    "domain": "merrinsallow.example",
    "sample": ["catherine.merrin", "julian.sallow", "yasmin.chaudhry", "thandiwe.moyo", "dani.fenwick"],
    "note": "The staff list and address pattern came off the practice's public pages, not from any password."
  },
  "wordList": {
    "slots": [
      { "id": "project", "factId": "ms_projects", "template": "{project}2026" },
      { "id": "motto",   "factId": "ms_motto",    "template": "{motto}1" },
      { "id": "place",   "factId": "ms_place",    "template": "{place}!" }
    ],
    "seasonYear": ["Autumn2026"],
    "note": "Candidate passwords built from the practice's own website words plus the season and the year; all made up."
  },
  "spray": {
    "passes": [
      { "id": "pass_project", "fromSlot": "project" },
      { "id": "pass_season",  "literal": "Autumn2026" }
    ],
    "opensCount": 3,
    "note": "One candidate tried once against every account in a pass, so no single account ever locks."
  },
  "stuff": {
    "rows": [
      { "label": "A work address, with a password reused from a breached shopping site", "opens": true },
      { "label": "A work address, with a password reused from an old forum", "opens": true },
      { "label": "A work address, with a password used nowhere else", "opens": false }
    ],
    "note": "A list of address and password pairs from a breach of another site, tried automatically across many services; the ones that open are where someone reused that password at work."
  },
  "passphraseDemo": { "words": ["harbour", "ladder", "crimson"], "neverLands": true },
  "landedGlobal": "guess_e18_landed",
  "note": "No real password is typed here; every account, word and pair is made up."
}
```

Panel behaviour (ENG-02b owns the render):

1. **Roster.** Built from `ms_team_roster` (the names) and `ms_email_pattern` (the pattern) into
   `firstname.lastname@merrinsallow.example`. If either fact is uncollected, its half renders struck through as
   "not found" (as ENG-02 does for uncollected facts).
2. **Word list.** Each slot interpolates its one fact (`{project}` from `ms_projects`, `{motto}` from `ms_motto`,
   `{place}` from `ms_place`), plus the baked `seasonYear` literals, giving the candidate passwords the website
   handed over (for example `Calderbank2026`, `DesignThatLasts1`, `Verrow!`, `Autumn2026`; the exact assembled
   strings depend on the fact values authored in `attack.json`).
3. **Spray.** Each pass tries one candidate against every roster account once; `opensCount` accounts open
   (authored; the predictable company-word ones). The reasoning line: one password, one try per account, so no
   single account locks. The opened accounts are a **count**, never a named colleague.
4. **Stuff.** The credential-stuffing panel shows masked address-and-password rows (`......` for the password),
   the `opens: true` ones being reuse-at-work. The reasoning line explains stuffing as a concept and names the
   defence (a different password for every account).
5. A three-random-words passphrase account holds out and never lands, to make the length-and-uniqueness point.

The console's ticker and reasoning text are authored here, in the core_03 voice; no tool, method, command, rule
syntax, lockout threshold or working credential is shown.

### The one consequential choice quoted in the flip (aw2)

The lever the flip leans on is **predictable passwords at scale**: a word off the website, or a password reused
from a breached site. The flip says the accounts that opened were the predictable ones, not the result of any
clever cracking, and that a different password per account, not a company word, is what would have stopped the
sweep. Because the attack is an authored campaign (no pretext-template choice and no mail send record), aw2 is
carried in the flip prose (`flipDefenderLine`), not in `flipDefenderLineByChoice` (as E9 and E12 do; a `guess`
record has no `templateId`).

## 10. Flip

After the campaign lands, the learner is put in their own seat and shown the first signals the sweep produced:
a sign-in alert and a lockout notice. This reuses ENG-01's `flipAftermath` exactly as E9's prompt flood does;
`flipAftermathFor(episode, { landed })` shows it only when `guess_e18_landed` is true. The flip shows that the
practice has been swept and that alerts, genuine and fake, are now arriving, which sets up the defend half.

- `strings.flipHeading`: "Now it's your inbox." `strings.flipIntro`: "You watched one password open the
  predictable accounts across the whole practice. Here is the other end: your own seat, a few minutes later, with
  the alerts starting to arrive."
- `awarenessEpisode.flipAftermath` (ENG-01 shape): `heading` "A few minutes later, at your desk"; `victimName`
  null (the learner is in their own seat, not a named colleague's); `intro` "The sweep set alarms ringing across
  the practice. Here are the first two that reached you."; `items`: an `email` sign-in alert
  (`{ id: "fa_signin", kind: "email", folder: "inbox", subject: "New sign-in to your account", time: "08:50",
  note: "An alert about a sign-in; genuine ones send you to the real site, fakes to a look-alike." }`) and a
  `push`-or-`email` lockout notice (`{ id: "fa_lockout", kind: "email", folder: "inbox", subject: "Some accounts
  were briefly locked", time: "08:52", note: "The practice locks accounts after a run of bad sign-ins." }`);
  `line` "Most of the harm comes from acting on the fake alert instead of the real one."
- Draft `flipDefenderLine` (the landed case): "One password off the website, tried once across everyone, opened
  the predictable accounts. No clever cracking, just reuse and words anyone could read. A different password for
  every account, and not a word off the website, is what would have stopped it. Now the alerts are arriving, and
  some are fakes." Author `flipNoSend`/`flipMissed` variants in the E9 voice, ending "next, you tell the real
  alerts from the fakes."

No new flip engine is needed; the aftermath is ENG-01's existing surface.

## 11. Defend set

The defend half is six ordinary triage cards: three genuine security notices and the three fake look-alikes that
try to finish the sweep. Both the genuine and the fake record into `se_awareness_records`. Verify on, so "check
it yourself through a route you already trust" is a scored safe move. The triageSet id is `e18_atscale_inbox`;
episode prefix `episode_e18_credential_attacks_at_scale_defend_`.

The triageSet config follows E9: `scoringProfile: "awareness"`, `verifyVerdict: true`, `feedbackMode:
"immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `reportAlwaysVisible: true`, `outcome.passPercent: 0`.
`channelTells`: `["lookalike_domain", "secrecy_or_bypass", "fake_lockout_notice", "fake_signin_alert",
"fake_breach_alert"]`. `lookalike_domain` and `secrecy_or_bypass` are shared-library tells. **The three
`fake_*` ids are scenario-local to E18** (no `10` check item scores them, so by the ENG-08 rule they stay local
to this set): declare each in `channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence
on each flagging message (a message-level `factorStrings` object, a sibling of `truth`, never inside it); do not
append them to the shared `CHANNEL_TELLS`. The validator accepts a labelled, non-factor local id. The `flagChips`
labels and `redFlag` sentences are in §15's ENG-08 reference and the ENG-02b draft's "ENG-08 additions" block.

### Cards (id, kind, from/line, verdict, reasoning)

| # | id | kind | content | correct move | reasoning |
|---|---|---|---|---|---|
| 1 | `e18_lockout_genuine` | email | From the practice's IT provider (Fenlow Managed IT, `fenlow.example`): "After a run of unusual sign-in attempts this morning, some staff accounts were briefly locked as a precaution. You don't need to do anything unless you can't sign in, in which case use the usual service-desk route. We will never ask for your password." | Trust (or Verify) | A genuine precautionary notice from the provider, asking for nothing and naming the usual route. Trusting it, or checking with the service desk, both score full. (The genuine half of the mirror pair.) |
| 2 | `e18_lockout_fake` | email | From "Merrin & Sallow Security" on a look-alike address (`merrin-sallow.example`): "Your account is locked. Unlock it now or it will be deleted," with an "Unlock account" link to a look-alike page. | Report | No genuine lockout message makes you unlock through a link under threat; the host is a look-alike and the urgency is the lever. `lookalike_domain`, `fake_lockout_notice`, `secrecy_or_bypass`. (Mirror of row 1.) |
| 3 | `e18_signin_genuine` | email | A genuine new-sign-in alert from a service the learner uses: "A new sign-in to your account from a Windows PC in London. If this was you, no action is needed. If it wasn't, go to the service yourself and change your password." It sends you to the real site, not a link to confirm. | Trust (or Verify) | A real alert tells you what happened and sends you to the real site; it never asks you to confirm by signing in through its link. Trust it, or go to the real site to check. |
| 4 | `e18_signin_fake` | email | From a look-alike sign-in service: "We blocked a suspicious sign-in. Review it now to keep your account," with a "Review sign-in" link to a credential-capture page on a look-alike host. | Report | A genuine alert never makes you "review" by signing in through its link; this one harvests the password. `fake_signin_alert`, `lookalike_domain`. |
| 5 | `e18_breach_fake` | page | A page opened from a link: a "Free breach checker: type your password to see if it has leaked" form, on a look-alike host. | Report (never type a password to "check") | Nothing genuine asks for your password to tell you whether it has leaked; a real check uses your email address, never your password. `fake_breach_alert`, `secrecy_or_bypass`. |
| 6 | `e18_breach_genuine` | email | From the practice's IT provider's breach monitoring: "We found your work address in a breach of another website. Change that password on the real site, and anywhere you reused it. Don't reply with any password; this is for your information." | Trust / act on it the safe way | A genuine breach notice names the site, tells you to change the password on the real site and asks for nothing. The safe action is to change a reused password, not to reply or click. |

Rows 1 and 2 are the explicit mirror pair (aw5): the same surface (an email about a lockout), one genuine (Trust)
and one fake (Report), so "a lockout alert arrived" is not itself the tell. Rows 3 and 4 (sign-in alert) and rows
5 and 6 (breach alert) are supporting contrasts in the same shape; they are not the required mirror pair but keep
the "real against fake" structure throughout. Under the `awareness` profile, trusting a genuine notice scores full
(60), reporting a fake scores full (60), and trusting a fake scores zero, so the discriminator is telling the fake
from the real, and a cautious learner who reports a genuine one is never marked down (E9 §11 convention).

Rows 1, 3 and 6 are genuine (`truth.isPhish: false`, `flags: []`, with a `whyFine` and a `falseAlarmCost`); rows
2, 4 and 5 are phish (`truth.isPhish: true`, with `flags`, `perFlagNote`, `ifTrusted`, `reportReply`). Copy the
built `email` card shape from `e9/defend.json` or `e5/defend.json`, and the built `page` card shape from
`e5/defend.json` (row 5 uses the ordinary built `page`, not an ENG-03a state; no ENG-03a dependency). Cut to six
exactly as listed; keep rows 1 and 2 (the mirror pair), at least one fake-alert card and one genuine breach
notice.

## 12. Debrief cards

Built debrief view, core_03 order:

1. A reasoning card per card above.
2. Genuine-item feedback (rows 1, 3 and 6: the real lockout, the real sign-in alert and the real breach notice).
3. The team-protected tally (aw6).
4. **The habit to keep** (shared, word for word, copied from the built shell via `awareness_deploy.awareness_block()`,
   not rewritten): "When a message pressures you to move money, grant access, sign in or read back a code, stop and
   check it yourself through a route you already trust, not the link, number or page the message gives you. Taking
   a minute to confirm is always a fair thing to do." ("sign in" and "grant access" are the credential case directly.)
5. **The "On Monday" card as three things to do at home tonight** (core_03 game_design): "On Monday, three things
   at home: switch on a password manager and let it make a different password for every account, starting with your
   email; check your personal email address on a breach-checking site (the NCSC suggests Have I Been Pwned); and
   turn on 2-step verification, or a passkey, for your email first. Report anything at work using the route in the
   box below." (`debrief.mondayCard: "slot:customer_report_route"` fills the final clause.)
6. The customer report route (slot).
7. **The no-blame line** (`debrief.noBlameLine: true`). Draft: "Reusing a password, or using a word off the
   website, is ordinary and common; this is how accounts are opened at scale, not a sign anyone was careless. A
   miss here just shows what to change tonight."

**Concept cards** (short, ENG-09b array form of `strings.conceptPanel`, in order):

- **Spraying:** "One likely password, tried just once against every account, so no single account locks. The
  accounts that open are the predictable ones: a company word, a project name, a season and a year."
- **Credential stuffing:** "A list of address and password pairs stolen from one website, tried automatically
  across many others. Where someone reused that password at work, the attacker is straight in."
- **The one habit:** "A different password for every account, not a word off the website, kept in a manager,
  breaks both: the spray has nothing predictable to try, and a stolen pair opens nothing else."
- **What the practice does (organisation slots, role_03):** "On the practice's side: accounts lock after a run of
  bad sign-ins, MFA is on everything, the obvious words are blocked from passwords, and a monitoring partner
  watches the breach lists for the practice's addresses. These are set up for you; you don't have to switch them
  on." (This is the role_03 organisation-slot content, voiced as the provider's controls, not as a staff duty.)

The built `strings.conceptPanel` is a single panel, so more than one card needs **ENG-09b**'s array form. Author
the cards in the concepts.md voice (core_03 "Why reuse is the big one" and the glossary; role_03 "Alerts you
shouldn't ignore" and the organisation slots).

## 13. Defend-only variant

Shell id `e18_credential_attacks_at_scale_defend`, stages `["brief", "defend", "debrief"]`, same defend set
`e18_atscale_inbox`, prefix `episode_e18_credential_attacks_at_scale_defend_defend_`. Put the defend-only `brief`
and `scopeNote` under `awarenessEpisode._defendOnly`. Draft defend-only brief (identical to §8b's generator
`brief`): "You're on an authorised exercise at Merrin & Sallow Architects, a fictional company. A campaign has
swept the practice, and the alerts are arriving: your account locked, a new sign-in, a breach warning. Some are
genuine and some are fakes built to catch you. Handle each one, and never type a password to 'check' or 'unlock'
anything. No real password is ever typed here." Draft defend-only scope note: "Authorised exercise at Merrin &
Sallow Architects, a fictional company. In scope: the security alerts you handle after a credential sweep. No
real password is ever typed." Both variants join both seeded Hacktivity courses (follow `01_PIPELINE.md` P12 for
the seeding; do not use `awareness_deploy.py`). **The defend-only variant needs ENG-09b** (the debrief concept
cards), **not** ENG-02b: `guess` is dropped from a `defendOnly` shell and the defend half is ordinary
`email`/`page` triage.

## 14. Check-form items it feeds (see 10_CHECK_FORMS.md)

E18's topic (core_03 passwords and MFA, at organisation scale) feeds the new **`general_v2`** check-form pair,
the same pair E9 feeds, built by `10_CHECK_FORMS.md` (the settled two-pair scheme; there is no separate credential
form). Do not edit the six built role forms. `general_v2` item 3 (MFA/password-manager rollout) and item 4 (the
unrequested push) already carry the measurable core_03 content, and item 2 (the fake "verify/update" page on a
look-alike host, scored `lookalike_domain`/`padlock_myth`) matches E18's fake-page tells, so E18's content is
already represented by the pair's existing items. E18's three scenario-local tells (`fake_lockout_notice`,
`fake_signin_alert`, `fake_breach_alert`) are an episode defend-half surface and are **not** carried into a check
form: `general_v2` scores only shared-library flags, and those three are not among them, so the lockout, sign-in
and breach-alert cards stay defend-set only. There is no form-building engine packet; `general_v2` is built by
`10`'s generator. Keep `passPercent` 0. **Report to the user:** E18 adds no new check items (its measurable
content is the same core_03 content E9 feeds into `general_v2`); if a per-topic "credential attacks at scale"
pre/post figure is wanted, that is the only reason to add a pair, which is the general trade-off `10` already
flags.

## 15. Files to create or change

- `planning_notes/phishing_and_social_engineering/awareness/e18/attack.json` (new): people (the roster names,
  display only), intelFacts (the five OSINT facts), osint sites (`merrin_site`, `merrin_social`), and the `guess`
  config with `mode: "spray"` (the roster, the word list, the spray passes, the stuff rows, the passphrase demo).
- `planning_notes/phishing_and_social_engineering/awareness/e18/defend.json` (new): the triageSet
  `e18_atscale_inbox` (the six `email`/`page` cards), the `awarenessEpisode` block (`strings`, `flipAftermath`,
  `_defendOnly`, `debrief` with the ENG-09b `conceptPanel` array), the three scenario-local tells declared in
  `channelTells` with `flagChips` labels and per-message `factorStrings.<id>.redFlag` sentences, and a
  `_brandAdditions` note for Ama Owusu, Fenlow Managed IT, Calderbank Mills, Elmgate Pavilion, "Design that lasts"
  and Verrow Street.
- `scenarios/awareness_e18_credential_attacks_at_scale/scenario.json.erb`, `mission.json`, `ink/ama_owusu.ink`
  (new): the full-episode shell. Frame it from E1 (the `01_PIPELINE.md` P2 rule: a mail/OSINT episode copies the
  E1 shell frame and host-ink structure), add the Merrin & Sallow room from P5a (reuse `room_aw_merrin_sallow` as
  E4 wires it), and take the `guess` attack block from ENG-02/ENG-02b; E4 is the reference for the built Merrin &
  Sallow room wiring and cast, not the stage shape (E4 has no `guess` stage). Globals to declare:
  `episode_e18_credential_attacks_at_scale_state: {}`, `se_awareness_records: []`,
  `episode_e18_credential_attacks_at_scale_defend_{percent,reportRate,done,pass}`, `se_osint_state: {}`,
  `se_intel_ms_team_roster/_ms_email_pattern/_ms_projects/_ms_motto/_ms_place`, plus the `guess_e18_landed` global
  (ENG-02b's `landedGlobal`) and any other `guess_*` state globals ENG-02/ENG-02b define. The host ink completes
  the attack task on `guess_e18_landed` and the conclusion task on
  `episode_e18_credential_attacks_at_scale_defend_done === true`.
- `scenarios/awareness_e18_credential_attacks_at_scale_defend/` (new): the defend-only shell.
- The two seeded Hacktivity courses: follow `01_PIPELINE.md` P12 (feature level only); do not use
  `awareness_deploy.py` for seeding.
- `BRAND_SET.md`: a Merrin & Sallow `_brandAdditions` note for Ama Owusu and Fenlow Managed IT, and the website
  words, with the name-clash search recorded (P11).
- ENG-02 (the `guess` stage), ENG-02b (the `spray`/`stuff` modes) and ENG-09b (debrief panels) engine work:
  owned by those packets. The ENG-08 schema/validator additions and the three scenario-local tell rows are in the
  ENG-02b draft's "ENG-08 additions" block.

## 16. Bridge script outline

`tools/playtest/se/bridge-e18-full.jsonl` (and defend-only), modelled on the E9 bridge and whatever test hooks
ENG-02b exposes for the campaign console. Steps: brief; OSINT collects the five facts; the campaign console
assembles the roster and the word list, runs the spray (assert `opensCount` accounts open and no account locks)
and the stuff panel (assert masked rows, the reuse rows open), and the passphrase holds out; the flip plays the
aftermath (assert `flipAftermath` renders when `guess_e18_landed` is true); defend handles each card on the
critical path (Trust rows 1, 3, 6; Report rows 2, 4, 5); conclude on
`episode_e18_credential_attacks_at_scale_defend_done`. Run through `check-bridge.mjs` and `run-suite.sh`. The
bridge depends on ENG-02b's test bridge for the campaign console.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e18_credential_attacks_at_scale/scenario.json.erb`
  passes (and the defend-only shell).
- The social validators pass, including the ENG-02b `guess.mode: "spray"` additions and the three scenario-local
  tells (`fake_lockout_notice`, `fake_signin_alert`, `fake_breach_alert`) being accepted as labelled, non-factor
  local ids.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` passes (E18's shells added to the list).
- The shared rule-of-thumb test passes (habit string byte-identical).
- The bridge suite passes including `bridge-e18-full.jsonl`.
- Manual: no free-text password field appears anywhere; the spray console never shows a working credential and
  the stuff panel never shows a password value (masked rows only); the opened accounts are shown as a count, not
  a named colleague; the campaign is calm (no alarms, and under reduced motion nothing shakes); the episode runs
  in about 15 minutes.

## 18. Do not

- Never collect or store a real password, address list or breach dump; authored data only, with masked
  passwords in the stuff panel; say so on screen.
- No real password lists, tool names, commands, rule syntax, lockout thresholds or timing advice, and no working
  technique: explain spraying and stuffing as concepts only.
- Do not repeat E9's single-person guesser in the attack half: E18 is the organisation-scale attack, never one
  named colleague's personal facts.
- Do not name the opened accounts as careless colleagues; show a count, and keep the no-blame line.
- Do not turn the organisation controls (lockout, MFA everywhere, the banned-password list, breach monitoring)
  into staff duties: they are organisation-slot debrief lines, voiced as the provider's controls.
- Do not reward complexity rules; a company word plus a year plus a symbol is near the top of the spray list.
- Don't edit the six built role check forms, the generators, or the shared rule-of-thumb string.
- Don't run a generator into the repo, `git stash`, or add attribution lines.
- No real brands, people or non-`.example` domains; no homographs; no Hacktivity internals.

## 19. Stop and ask if

- ENG-02 or ENG-02b is not available (the full variant needs both for the `guess` attack half; the defend-only
  variant needs only ENG-09b and can ship first, as E8's defend-only did).
- ENG-09b is not available (both variants' debrief need the concept-card array).
- The stage-order lint will not allow `brief osint guess flip defend debrief` with no `write` (it should: ENG-08
  added it for ENG-02, and E18 reuses it unchanged).
- ENG-02b's `mode: "spray"` cannot show both spraying and stuffing in one console (it should: the `spray` mode
  carries a `stuff` panel; see the ENG-02b draft). If the orchestrator wants spraying and stuffing as two separate
  attack artefacts, stop: the brief is one attack artefact.

## 20. Open questions

1. **Host choice.** Ama Owusu (new named security lead at the practice's managed provider, one new character art
   set) is used so that role_03's organisation-scale controls have a natural voice. The user may overrule this and
   reuse **Lorna Easton** (E12's reception/facilities lead, zero new art), with the controls voiced as "what our IT
   provider has set up", or reuse **Julian Sallow** (E4/E14 host, art exists) as a partner who had a wake-up call.
   Either removes the one new art set at the cost of a less natural role_03 voice.
2. **Provider name.** Fenlow Managed IT (`fenlow.example`) is a new fictional company. The user may prefer reusing
   **Northlight Security** (the E12 red-team firm) as the provider to avoid one new company name, though Northlight
   is a testing firm, not a managed IT provider.
3. **New names.** Ama Owusu, Fenlow Managed IT, Calderbank Mills, Elmgate Pavilion, "Design that lasts" and Verrow
   Street all need the pre-ship web search and a BRAND_SET note. The roster names are the built E4/E14 cast.
4. **ENG-02b template model.** The `wordList` slots use one `factId` per slot with the season and year baked in,
   as ENG-02's `patternSlots` do. If ENG-02b would rather support multi-fact templates, that is its decision;
   E18's content works either way.
5. **Check coverage.** E18 adds no new check items (its measurable content is the same core_03 content E9 feeds
   into `general_v2`). If the user wants a per-topic "credential attacks at scale" pre/post figure, that needs a
   new pair, which is the trade-off `10_CHECK_FORMS.md` already flags; do not build one without the user's go-ahead.
