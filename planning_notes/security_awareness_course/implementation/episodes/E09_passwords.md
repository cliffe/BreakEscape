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

- **ENG-02** (passphrase and guessing stage). The attack-half guesser/reuse rig and the defend-half password-practice cards are both new surfaces this packet owns. E9 cannot build its full variant without it. §9 and §11 state the config ENG-02 must accept.
- **The E3 authenticator demo** (built) for the flood flip and the push defend cards. No new work there; reuse the `e3_push_early` / `mfaDecision.pushTemplate` shapes.
- **ENG-08** (schema and validator) if ENG-02 adds a new stage id to `STAGE_IDS` or relaxes the stage-order lint so an attack half can end in the guesser rather than a `write` stage (see §7).
- One new channel tell `mfa_number_relay` for the fake-"IT" card (see §11), which belongs in the shared library (ENG-08) because E3 and E9 both use the fake-IT lever.

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
- The new supplier portal in the sign-up card: reuse the built Tarrowby third party **FuelWise** (`fuelwise.example`, the E6 fuel-card service) rather than inventing one. Confirm FuelWise's domain against `e6/defend.json` `_brandAdditions` before use.

All people and companies are fictional; every address and domain ends `.example`. No homographs.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | Notes |
|---|---|---|
| brief | 1.0 | Nilesh's welcome, scope note. |
| osint | 2.5 | Collect Colin's public details as facts. |
| build (guesser/reuse rig, ENG-02) | 3.5 | Assemble a guess list from the facts; the guesser ticker strikes them through; the reuse step opens the work account. |
| flip | 1.5 | The learner's own account under a prompt flood, then the fake "IT" message. Reuses the authenticator flood (watch-only). |
| defend | 4.5 | About 6 to 7 cards: push triage (authenticator) plus password-practice cards (ENG-02), Verify on. |
| debrief | 2.0 | Reasoning cards, the tally, the habit, the "On Monday" card (three things to do at home tonight), the report route, the no-blame line. |

Defend-only variant: brief, defend, debrief, about 8 minutes.

## 7. Stages (runner stage ids)

Proposed full episode: `["brief", "osint", "build", "flip", "defend", "debrief"]`.

- `build` carries the guesser/reuse rig. Currently `childLaunch` maps `build` to the landing-page builder, so **ENG-02 must make the `build` stage launch the password/guesser surface when the episode carries a guesser config** (analogous to how the `mfa` stage is driven by the top-level `mfa` config block in E3). E9 passes an `awarenessEpisode.guess` config block (new; ENG-02 owns the exact key). Alternatively ENG-02 adds a dedicated stage id; the content does not care which, only that the guesser runs as the attack artefact.
- There is **no `write` stage**: E9 sends no email or call, the guesser is the attack artefact. The stage-order lint today expects `write`; ENG-02/ENG-08 must allow `osint -> build -> flip` with no `write`. State this to the ENG-02 owner.
- `flip` reuses the authenticator demo in its watch-only flood shape (the `mfaDecision` note in `e3/attack.json` confirms the scene still supports `{ pushes[...], approvesAt }` when `choice` is absent). No new flip engine needed.
- `defend` runs the push/authenticator triage cards and the ENG-02 password-practice cards together, recording into `se_awareness_records` like any defend half.

Defend-only: `["brief", "defend", "debrief"]`. **The defend-only variant still needs ENG-02** (the password-practice cards are the core of the defend half), so unlike E8, E9's defend-only cannot ship before the packet.

## 8. Brief and scope note (host's draft lines)

- **Episode id:** `e9_passwords`. Defend-only shell id: `e9_passwords_defend`.
- **`strings.brief`:** "You're on an authorised exercise at Tarrowby Logistics, a fictional haulier, in the depot office. First you're on the red team: look at what a colleague has put online, build a guess list from it, and watch how fast a reused password opens his work account. Then it's your own account under attack, and you lock it down. Only the lock-down part is scored."
- **`scopeNote`:** "Authorised exercise at Tarrowby Logistics, a fictional company. In scope: a guess list built from one colleague's public details, and your own sign-in choices. No real password is ever typed or stored; the guesses and codes are made up."
- **Nilesh's welcome (host ink, hub pattern):** "Welcome to the Tarrowby exercise. Most passwords aren't cracked. They're guessed, reused or handed over. Start at the kiosk: I'll show you how, on a made-up colleague, then you shut it down on your own account. Nothing you touch here is a real password."

## 9. Attack half (the guesser and reuse rig)

Not scored. The learner runs an authored guesser and reuse rig against Colin Mather, from his own public details. **No real password is ever typed; the guesser is authored data and uses game words and made-up strings.** The engine surface is ENG-02; this section gives the content ENG-02's config must carry.

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
2. Local patterns from the facts: `{team}{year}` (Pennington1994), `{pet}!` (Bramble!), the company name plus a year (Tarrowby2024), `{pet}{year}` (Bramble1994).
3. **The reuse step:** Colin's RiverReach Angling password (from a breach of that forum) is tried on the Tarrowby work account and works. The red-flag meter notes reuse is the multiplier: one breach of a small site opens the work account.
4. A three-random-words passphrase (game words, e.g. "otter-ladder-crimson") is still being tried when the rig is switched off, to make the length point. It never "lands".

ENG-02 config E9 passes (shape to be finalised by the packet): `awarenessEpisode.guess = { target: "colin", commonList: [...], patternSlots: [{id:"team",...},{id:"year",...},{id:"pet",...}], reuseStep: { site: "RiverReach Angling", domain: "riverreachangling.example", landsOn: "work", note: "..." }, passphraseDemo: { words: ["otter","ladder","crimson"], neverLands: true } }`. The guesser's ticker and reasoning text are authored here, in the core_03 voice; no tool, method or working credential is shown.

### The one consequential choice quoted in the flip (aw2)

The lever the flip leans on is **reuse**: the same password on a hobby forum and the work account. The flip says a stolen password, not a clever crack, is what opened the account, and that a different password per account is what would have stopped it.

## 10. Flip

The learner's own account comes under a prompt flood, then a fake "IT" message offers a number to type "to make them stop". Reuse the authenticator demo's watch-only flood (the `mfaDecision` watch-only shape, `{ pushes, approvesAt }`, from `e3/attack.json`; `pushTemplate` copied with the account swapped to the learner). The flip shows that someone now has a password (the one the reuse step found), which sets up the defend half.

- `flipHeading`: "Now it's your phone." `flipIntro`: "You watched a reused password open a colleague's account. Here is the other end: your own phone, buzzing with sign-in prompts you didn't start, and a message from 'IT' telling you how to make them stop." Draft `flipDefenderLine`: "Someone has a password of yours, from a breach of a site you forgot you used. They can't get past your phone, so they are leaning on it: prompt after prompt, then a message dressed up as IT with a number 'to stop the prompts'. The number is on their screen, not IT's. Deny what you didn't start, and report it." Author `flipNoSend`/`flipMissed` variants in the E3 voice, ending "next, you lock the account down."

No new flip engine is needed; the flood is the existing authenticator watch-only mode.

## 11. Defend set

The defend half is a mix of **push/authenticator triage cards** (a triageSet, like E3's push item) and **password-practice cards** (ENG-02). Both record into `se_awareness_records`. Verify on where a card has a "check it" route. About 6 to 7 decisions. The triageSet id is `e9_lock_it_down`; episode prefix `episode_e9_passwords_defend_`.

The triageSet config follows E3: `scoringProfile: "awareness"`, `verifyVerdict: true`, `feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `reportAlwaysVisible: true`. `channelTells`: `["unrequested_mfa_push", "mfa_number_relay", "secrecy_or_bypass"]`. `unrequested_mfa_push` and `secrecy_or_bypass` are shared-library tells. **`mfa_number_relay` is new** ("A message asking you to type or read back a sign-in number or code"): add it to the shared library (ENG-08), because E3 and E9 both use the fake-IT-number lever.

### Cards (id, kind, from/line, verdict, reasoning; which surface owns it)

| # | id | kind / surface | content | correct move | reasoning |
|---|---|---|---|---|---|
| 1 | `e9_push_own` | push (authenticator triage) | "Quayholt"-style push, account `you@tarrowby.example`, location "Leeds, UK", device "your own phone", immediately after you entered your password on the real depot sign-in | Approve | A prompt you started yourself, from where you are, is the normal second step. Approve it. (The genuine half of the mirror pair.) |
| 2 | `e9_push_unstarted` | push (authenticator triage) | Same app, account `you@tarrowby.example`, location "Unknown location, outside the UK", device "Windows PC", 02:40, when you were asleep | Deny and report | A prompt you did not start means someone has your password and is trying to get in. Deny it and report it; the service desk changes the password. `unrequested_mfa_push`. (Mirror of row 1.) |
| 3 | `e9_fake_it_number` | email or text (triage) | from a fake "Tarrowby IT" on a look-alike/freemail address: "We're getting failed sign-ins on your account. To stop the prompts, read back the number on your screen or tap Approve." | Deny / don't reply / report | No genuine IT team asks you to type a number, read back a code or approve a prompt. The number is on the attacker's screen. `mfa_number_relay`, `secrecy_or_bypass`. |
| 4 | `e9_passphrase` | password-practice (ENG-02) | "Which is stronger?" Option A: three random words (game words, e.g. "otter-ladder-crimson"); Option B: `Tarrowby2026!` (company name plus a year plus a symbol). | Choose the three words | Length and unpredictability beat complexity rules. `Tarrowby2026!` is on the guessers' patterns (the company name, a year, a `!`); another random word adds far more than a swap or a symbol. The strength meter and the attack-half guesser show why. |
| 5 | `e9_signup` | password-practice (ENG-02) | A new FuelWise supplier portal sign-up: (a) a unique generated password vs "use my usual one"; (b) a security answer "mother's maiden name" with a true answer vs a made-up one stored in the manager. | Choose generate; choose the made-up answer | A unique generated password means a breach of FuelWise can't open anything else; the reuse rig in the attack half is the mirror. A true security answer can be found online, so a made-up one kept in the manager is safer. |
| 6 | `e9_signin_ladder` | password-practice (ENG-02) | "This service offers three ways to sign in: a passkey, the authenticator app with number matching, or a text code. Pick the strongest it offers." | Choose the passkey | A passkey only works on the real site, so it can't be phished or relayed; the app with number matching is next; a text code is a last resort but still better than a password alone. (Refresh as NCSC advice moves; passkeys became the first choice in April 2026.) |
| 7 | `e9_shared_pc` | password-practice / card (ENG-02) | A depot PC with its password on a sticky note on the monitor, readable from the loading bay. Options: use the note to sign in / ask for your own account or the service desk. | Ask for your own account or the service desk | A shared login means nobody knows who did what, the password spreads to anyone who walks past, and leavers keep access. Don't use a found password; ask the service desk. (Remaps the old warehouse scene; LO6.) |

Rows 1 and 2 are the explicit mirror pair (aw5): the same app and account, one started by you (Approve) and one you didn't (Deny and report), so "a prompt arrived" is not itself the tell. Cut row 6 or row 7 to reach six if the orchestrator prefers; keep rows 1 and 2 (the pair) and at least one password card and the fake-IT card.

ENG-02 owns the exact data shape for rows 4 to 7 (word tiles, the strength meter bands, the vault-health view, the sign-up fill test, the sign-in ladder). This spec gives the content; the packet gives the fields. Rows 1 to 3 are ordinary triageSet messages (copy the `e3_push_early` `push` shape for the push cards).

## 12. Debrief cards

Built debrief view, core_03 order:

1. A reasoning card per card above.
2. Genuine-item feedback (row 1, the started prompt; row 5's generated-password choice shown as vault health).
3. The team-protected tally (aw6).
4. **The habit to keep** (shared, word for word, copied from the built shell, not rewritten): "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do." ("read back a code" and "grant access" are the password/MFA case directly.)
5. **The "On Monday" card as three things to do at home tonight** (core_03 game_design): "On Monday, three things at home: turn on 2-step verification, or a passkey, for your personal email first; check your personal email address on a breach-checking site (the NCSC suggests Have I Been Pwned); and switch on a password manager, starting with your email. Report anything at work using the route in the box below." (`debrief.mondayCard: "slot:customer_report_route"` fills the final clause.)
6. The customer report route (slot).
7. **The no-blame line** (`debrief.noBlameLine: true`). Draft: "Reusing a password is ordinary and common; this is how most accounts are broken into, not a sign anyone was careless. A miss here just shows what to change tonight."

Concept cards (short, core_03): how passwords are stolen; the sign-in ladder; browsers, notes and managers; what a passkey is. Author in the concepts.md voice.

## 13. Defend-only variant

Shell id `e9_passwords_defend`, stages `["brief", "defend", "debrief"]`, same defend set `e9_lock_it_down`, prefix `episode_e9_passwords_defend_defend_`. Put the defend-only `brief` and `scopeNote` under `awarenessEpisode._defendOnly`. Draft defend-only brief: "You're on an authorised exercise at Tarrowby Logistics, a fictional company. Someone has a password of yours, from a breach of a site you forgot you used, and your phone is buzzing with prompts. Lock the account down: handle the prompts, choose stronger passwords, and don't hand anything to a message dressed up as IT. No real password is ever typed here." Both variants join both seeded Hacktivity courses. **Both variants need ENG-02.**

## 14. Check-form items it feeds (see 10_CHECK_FORMS.md)

E9 feeds the **general or mobile** check-form pair at Tarrowby; the unstarted-push item is already in the helpdesk form from E3, so do not duplicate it. Do not edit the six built role forms. New items with mirror pairs for the password content (a stronger-passphrase pick, a reuse-vs-unique sign-up, a made-up-vs-true security answer) likely need a new topic check form (ENG-09), because the existing role forms are email-triage shaped and cannot score a password-practice card. Flag this to the check-forms spec: E9's password cards may not fit any existing check-form surface at all, which is itself an ENG-02/ENG-09 question.

## 15. Files to create or change

- `planning_notes/phishing_and_social_engineering/awareness/e9/attack.json` (new): people, intelFacts, osint sites, and the `guess` config (the guesser templates, the reuse step, the passphrase demo).
- `planning_notes/phishing_and_social_engineering/awareness/e9/defend.json` (new): the triageSet `e9_lock_it_down` (push and fake-IT cards), the ENG-02 password-card config, the `awarenessEpisode` block (`strings`, `_defendOnly`, `debrief`), and a `_brandAdditions` note for RiverReach Angling and Pennington Rangers.
- `scenarios/awareness_e9_passwords/scenario.json.erb`, `mission.json`, `ink/nilesh_solanki.ink` (new): the full-episode shell, wired like E6 (Tarrowby room). Globals to declare: `episode_e9_passwords_state: {}`, `se_awareness_records: []`, `episode_e9_passwords_defend_{percent,reportRate,done,pass}`, `se_osint_state: {}`, `se_intel_tarrowby_mather_role/_team/_pet/_forum`, `se_intel_tarrowby_founded`, plus any `guess_*` state globals ENG-02 defines. The host ink completes the attack task on the guesser-done global and the conclusion task on `episode_e9_passwords_defend_done === true`.
- `scenarios/awareness_e9_passwords_defend/` (new): the defend-only shell.
- The two seeded Hacktivity courses, through `awareness_deploy.py` (feature level only).
- ENG-02 engine work: owned by the ENG-02 packet.

## 16. Bridge script outline

`tools/playtest/se/bridge-e9-full.jsonl` (and defend-only), modelled on the existing bridges and whatever test hooks ENG-02 exposes for the guesser and the password cards. Steps: brief; OSINT collects Colin's five facts; the guesser assembles the list and the reuse step lands; the flip plays the flood; defend handles each card on the critical path (Approve row 1, Deny-and-report rows 2 and 3, the strong choice on rows 4 to 7); conclude on `episode_e9_passwords_defend_done`. Run through `check-bridge.mjs` and `run-suite.sh`. The bridge depends on ENG-02's test bridge for the new surfaces.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e9_passwords/scenario.json.erb` passes (and the defend-only shell).
- The social validators pass, including any ENG-02 additions and the new `mfa_number_relay` tell being accepted.
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

- ENG-02 is not available (the full and defend-only variants both need it; there is no partial ship as there is for E8).
- The stage-order lint will not allow `osint -> build -> flip` with no `write`, and ENG-02/ENG-08 cannot relax it.
- No check-form surface can score the password-practice cards and the check-forms spec has not decided on a new topic form.
- The orchestrator wants the guesser in a dedicated new stage id rather than repurposing `build`.

## 20. Open questions

1. **ENG-02 config shape.** The `awarenessEpisode.guess` block and the password-card data shapes (rows 4 to 7) are this spec's content proposals; the ENG-02 packet owns the final keys and whether the guesser lives in `build` or a new stage.
2. **Attack target.** Colin Mather (built cast) is used as the guess target. Confirm, or pick another Tarrowby depot colleague (Kaylee Dunford, Callum Whiteley).
3. **New names.** RiverReach Angling (`riverreachangling.example`) and Pennington Rangers need the pre-ship web search and a BRAND_SET note; FuelWise is reused from E6 (confirm its domain).
4. **Check forms.** Whether E9's password cards feed the general/mobile forms or a new topic form, and whether they can be scored on any existing check surface at all.
5. **Item count.** Seven decisions drafted; the floor of six keeps rows 1 and 2 (the pair), one password card, and the fake-IT card.
