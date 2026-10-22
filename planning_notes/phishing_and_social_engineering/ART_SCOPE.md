# Art scope for approval: lab and awareness episodes

Inventory taken 2026-10-22 from the scenario files, `public/break_escape/assets/`, `ASSETS.md`,
`awareness/BRAND_SET.md`, `designs/11` §8, `SE_BUILD_LOG.md` and `scenarios/lab_social_engineering/ROOMS_REVIEW_C1.md`.
Nothing was generated. Metered Gemini calls are marked; everything else is PixelLab (flat subscription).

## 1. Short version

- The lab (`lab_social_engineering`) has 4 on-screen characters, all on shared generic sprites. Its rooms are done: own maps,
  dressed, lit, and POV backgrounds for the two rooms where someone talks. Tomasz is the one visible problem (hi-vis).
- The 37 `awareness_*` scenarios use 19 NPC identities on 7 generic sprite keys, and every learner is `female_office_worker_v2`,
  which is also Ruth. Every awareness scenario has one stock room (`training_room`, m01's `room_office` plus a kiosk): no lighting, no
  POV background, no dressing.
- The awareness QR, SMS and push surfaces, the step strip and the four brand wordmarks are CSS today. There is no icon or logo art
  for them.
- Proposed minimum: 15 characters (10 full, 2 bust-only, 3 headshot-only), 4 awareness POV backgrounds, 4 icons, 3 builder logos.
  Gemini is needed for 12 character concepts and 4 background concepts. Everything else is PixelLab only.

## 2. What "v2 set" means here

The v2 pipeline (`pixellab-character-pipeline`) gives each character `<key>.png` + `<key>.json` (8-direction walk atlas),
`<key>_talk.png` or `<key>_visemes.png` + `.json`, `<key>_headshot.png` (32x32) and the `<key>_nonpixelart.png` concept.

The seven generic `*_v2` keys in use each have walk atlas, headshot and concept. Their **talk sheet and visemes sit under the
older base key** (`male_telecom_talk.png`, `male_telecom_visemes.png`, and so on), and scenarios point `spriteTalk` at those. So
no placeholder has a full v2 set under its own key. I did not compare the old talk face with the v2 walk sprite by eye.

Each generic concept prompt is a single fixed look, and all of them say "light skin" except `female_scientist_v2` (East Asian).
BRAND_SET's cast diversity is therefore not on screen at all yet.

| Generic key | Look (from its concept prompt) | Used by |
|---|---|---|
| `female_office_worker_v2` | young woman, blonde, white shirt and tie | Ruth; the learner in all 37 awareness scenarios |
| `male_office_worker_v2` | man in his 40s, dark hair, stubble, shirt and tie | Fairbairn, Julian Sallow, Graham Whitfield, Owen Treharne, Jun Watanabe |
| `male_telecom_v2` | **neon yellow hi-vis shirt**, cap, tool belt | Tomasz, Darren Price, Chidi Okeke |
| `female_telecom_v2` | **orange hi-vis vest**, ponytail, work boots | Niamh Doherty, Lerato Dlamini |
| `female_blowse_v2` | long wavy black hair, blue blouse | Adaeze Okafor, Fatima Begum, Agnieszka Duda, Yasmin Chaudhry, Pauline Hendry, Sofia Marchetti |
| `female_scientist_v2` | young East Asian woman, lab coat | Thandiwe Moyo, Farah Qureshi, Anjali Rao |
| `male_nerd_v2` | young bearded man, glasses, red tee | Ibrahim Diallo |

The hi-vis keys put IT, helpdesk and security staff in site-worker clothes, the stereotype `ROOMS_REVIEW_C1.md` flags for Tomasz.
It also hits Darren Price (service desk lead), Niamh Doherty (E5 SSO) and Chidi Okeke (fleet coordinator, where it may fit).

## 3. NPC inventory

Columns: sprite key in use; placeholder (shared generic key, hi-vis, or shared between characters); v2 set present under that key
(walk / talk / visemes / headshot). "talk-v1" means the talk sheet and visemes exist only under the base key.

### 3a. Lab (`lab_social_engineering`)

| NPC | Channel | Sprite key | Placeholder? | v2 set under that key |
|---|---|---|---|---|
| Ruth Adeyemi (`ruth`) | person | `female_office_worker_v2` | Yes: generic, shared with the awareness learner | walk yes, headshot yes, talk-v1, visemes-v1 |
| Ruth Adeyemi (`ruth_phone`) | phone | none | Needs the same portrait as Ruth | none |
| Gareth Fairbairn (`fairbairn`) | person | `male_office_worker_v2` | Yes: generic, shared with 4 awareness hosts | walk, headshot, talk-v1, visemes-v1 |
| Tomasz (`tomasz`) | person | `male_telecom_v2` | **Yes: hi-vis, shared with Darren Price and Chidi Okeke** | walk, headshot, talk-v1, visemes-v1 |
| Dev (`dev_service_desk`) | phone | none | No sprite key; no portrait art. (`dev_malhotra` is another mission's character, not for reuse) | none |
| Chris Hampshire | mail / OSINT card | `hampshire_headshot` (32x32) | No. Done in art batch 1 | headshot only, as designed |
| Melanie Pierce, Sofia Lord, Jed Baker | mail / OSINT cards | none | Missing: no avatar set, so cards use the default | none |
| Player | person | `female_hacker_hood_v2` | Generic player sprite, fine | walk, headshot, talk-v1, visemes-v1 |

Mail filler senders use `npc_helper` and `npc_neutral` from `assets/npc/avatars/` as ASSETS NPC10 intends. No work needed.

### 3b. Awareness (37 scenarios; all learners `female_office_worker_v2`)

Episodes E1 to E7, 13 scenarios (E7 has a defend-only shell). The 24 check missions are 6 roles x pre/post x AB/BA, and each
host appears in both the pre and post shell.

| NPC | Where | Sprite key | Placeholder reasons |
|---|---|---|---|
| Adaeze Okafor | E1 attack and defend | `female_blowse_v2` | shared by 6 characters; look does not match "Nigerian-British, 40s" |
| Fatima Begum | E2 both | `female_blowse_v2` | shared |
| Darren Price | E3 both | `male_telecom_v2` | hi-vis; shared with Tomasz |
| Leila Nassar | E3 attack (phone) | none | no portrait |
| Thandiwe Moyo | E4 both | `female_scientist_v2` | shared by 3 |
| Niamh Doherty | E5 both | `female_telecom_v2` | hi-vis; shared |
| Chidi Okeke | E6 both | `male_telecom_v2` | hi-vis; shared |
| Agnieszka Duda | E7 defend | `female_blowse_v2` | shared |
| Yasmin Chaudhry | executive checks (AB, pre and post) | `female_blowse_v2` | shared |
| Julian Sallow | executive checks (BA) | `male_office_worker_v2` | shared |
| Graham Whitfield | finance checks (AB) | `male_office_worker_v2` | shared |
| Farah Qureshi | finance checks (BA) | `female_scientist_v2` | shared |
| Owen Treharne | general checks (AB) | `male_office_worker_v2` | shared |
| Pauline Hendry | general checks (BA) | `female_blowse_v2` | shared |
| Anjali Rao | helpdesk checks (AB) | `female_scientist_v2` | shared |
| Sofia Marchetti | helpdesk checks (BA) | `female_blowse_v2` | shared |
| Jun Watanabe | HR checks (AB) and mobile checks (BA): 4 scenarios | `male_office_worker_v2` | shared; the one recurring host |
| Ibrahim Diallo | HR checks (BA) | `male_nerd_v2` | shared |
| Lerato Dlamini | mobile checks (AB) | `female_telecom_v2` | hi-vis; shared |

All 18 people with a sprite have walk, headshot and concept under the generic key and talk-v1 and visemes-v1 under the base key.
Leila has nothing. Ravinder Sandhu (CEO) and the other named people in the emails never appear on screen, so they need no art.

## 4. Rooms

### 4a. Lab

| Room (map type) | Dressing | Lighting | POV chat background | Needs one? |
|---|---|---|---|---|
| `engagement_office` (`room_se_engagement`) | Done (own map, fixtures, NPCs off the boards) | Done (day office) | Yes: two views by x, `lab_se_engagement_office_left_blended.png` and `lab_se_engagement_office_blended.png` | Ruth, Fairbairn talk here |
| `recon_room` (`room_se_recon`) | Done | Done (motion) | No | No NPC |
| `operations_room` (`room_se_ops`) | Done | Done (motion) | No | No NPC; Dev is a phone call |
| `blue_team_room` (`room_se_blueteam`) | Done | Done (`#b2b8c8`, SIEM and DVR glow) | Yes: `lab_se_blue_team_blended.png` | Tomasz talks here |

Source: `SE_BUILD_LOG.md` "Lab rooms, group (a)" and "group (b)". Known leftovers recorded there: the seed maps keep their own
brand-line wall colours, the Engagement Office concept has the table running front to back, and Tomasz's hi-vis clashes with the
Blue Team room. The user has deferred the full multi-skill polish until the mechanics are finished. I did not re-render the rooms.

### 4b. Awareness (all 37 scenarios)

One room each: `training_room`, type `room_office` (m01's map, unchanged), one `kiosk` object, one NPC. No `lighting` block, no
`chatBackground`. Dressing, lighting and POV are all not done; the host's conversation opens on the plain frame. The same room is
used for all four companies, so the brand shows only in the CSS wordmark and accent colour.

Hosts by company, using BRAND_SET's episode mapping (general checks are Quayholt per `awareness_pre_general_ab/mission.json`; the other
check roles are mapped from the roster and not checked in each file):

| Company | Scenarios | Hosts |
|---|---|---|
| Brightwell Foods | E1 x2, E7, finance checks x4 | Adaeze, Agnieszka, Graham, Farah |
| Tarrowby Logistics | E2 x2, E6 x2, HR checks x4, mobile checks x4 | Fatima, Chidi, Jun, Ibrahim, Lerato |
| Quayholt Insurance | E3 x2, E5 x2, general checks x4, helpdesk checks x4 | Darren, Leila (phone), Niamh, Owen, Pauline, Anjali, Sofia |
| Merrin & Sallow | E4 x2, executive checks x4 | Thandiwe, Yasmin, Julian |

## 5. Awareness art that `designs/11` §8 calls for, and what stands in today

| §8 item | Today |
|---|---|
| Fictional-company office backgrounds, 3 to 4 at 400px (finance floor, HR office, helpdesk, exec suite) | None. Plain frame over a stock `room_office`. Existing m01 POV backgrounds could stand in but belong to another company |
| Neutral-skin chrome: logo placeholder, generic badge, step strip | CSS only (`css/awareness-skin.css`: `.aw-wordmark`, `.aw-step`). Reads fine; no art exists or is needed for the minimum |
| Brand logos (Brightwell, Tarrowby, Quayholt, Merrin & Sallow) | CSS wordmark from `logoText` on the brand accent colour. No image files |
| Cast: about 10 portraits plus busts, varied, recurring ones with own keys | 18 people on 7 generic keys (section 3b). No awareness character has a key of their own |
| Padlock with "myth" overlay (E5) | `icons/padlock_32.png` exists and is used by the landing-page builder; no overlay variant |
| QR poster | CSS (`tri-kind-qr tri-poster` in `inbox-triage/triage-kinds.js`); no image |
| SMS bubble | CSS (`tri-kind-sms tri-phone-frame`); no image |
| Authenticator push card | CSS (`tri-kind-push tri-phone`); no image |
| Report-button animation and sting | None. `message_received.mp3` and `GASP_UI_*` sounds could serve the sting |
| Landing-page builder brand logos (E5, and the lab) | `assets/social/landing/` does not exist. `landing-page-render.js` points there and the CSS shows a labelled empty box |
| Voice (E3, E4, E7) | Out of scope here (TTS, last stage) |

The only awareness page the builder needs is Quayholt's, look `generic`. I only saw that brand in the first lines of the E5
scenario's brand list, so confirm there is not a second one before generating.

## 6. Proposed minimum art set

Rules applied (AGENTS.md and memory): each recurring or named character gets a key of their own; across a mission's cast vary
ethnicity, age and look, and say what was chosen in the concept prompt; sprites are made at target size; props and rooms stay
orthogonal top-down; one image at a time with sign-off unless the user says to batch.

### 6a. Characters

Own keys, named for the person (`ruth_adeyemi`, `gareth_fairbairn`, `tomasz`, and so on). Ruth moving off
`female_office_worker_v2` also frees that key to remain the generic learner. Tomasz moving off `male_telecom_v2` keeps m04 untouched.

| Group | Characters | Count | Work per character | Gemini? |
|---|---|---|---|---|
| Lab, full | Ruth Adeyemi, Gareth Fairbairn, Tomasz | 3 | concept, bust, talk, visemes, 8-direction walk with six animations, headshot, facing check | Concept: 3 |
| Awareness, full (episode hosts) | Adaeze Okafor, Fatima Begum, Darren Price, Thandiwe Moyo, Niamh Doherty, Chidi Okeke, Agnieszka Duda | 7 | as above | Concept: 7 |
| Bust-only (phone, no walk) | Dev (lab), Leila Nassar (E3). Ruth's phone reuses Ruth's set | 2 | concept, bust, talk, visemes, headshot | Concept: 2 |
| Headshot-only | Melanie Pierce, Sofia Lord, Jed Baker | 3 | 32x32 at that size | No: PixelLab only |
| **Total** | | **15** | | **12 concepts** |

Gemini concept budget: 12 calls minimum; allow roughly 18 to 24 for re-rolls and the one reframe each concept usually needs. The
PixelLab load is the larger cost: 10 full walk sets of 8 directions x 6 animations, plus 12 talk and viseme runs.

Diversity brief for the concept prompts, taken from BRAND_SET: Ruth (Tarnside engagement lead; surname Adeyemi, so pick a
background and age that fit and differ from the awareness cast), Fairbairn (the client MD, an older man), Tomasz (a security lead who is not in hi-vis, so
not the site-guard stereotype), Adaeze (40s, Nigerian-British), Fatima (30s, British Bangladeshi), Darren (40s, white, Bristol),
Thandiwe (to be set; BRAND_SET lists the E4 cast but not her age), Niamh (Northern Irish), Chidi (Nigerian name, fleet coordinator),
Agnieszka (30s, Polish, part-time), Leila (mid 20s, Lebanese-British), Dev (pick an age and background that differ from Tomasz and Ruth). Ages and backgrounds for Dev, Thandiwe, Niamh and Chidi need checking against their ink before
the concepts are written; I did not confirm them.

### 6b. Check-mission hosts: decision needed (11 more characters)

The 24 check missions use 11 more host identities (Yasmin, Julian, Graham, Farah, Owen, Pauline, Anjali, Sofia, Jun, Ibrahim, Lerato),
all on shared placeholders, three of the five hi-vis. Options:

1. **Leave them as placeholders** (0 new art). Cheapest; the hi-vis and mismatched faces remain in the checks, which are the
   shortest, least narrative missions.
2. **Reuse the episode hosts of the same company** (0 new art, but 24 scenarios and their ink change: NPC id, display name,
   sprite, per the "rename ids with NPCs" note). Needs a content pass.
3. **Make all 11** (11 full sets, 11 more concepts; total 26 characters, 23 concepts). Only if the checks ship as a product on
   their own. Jun Watanabe goes first, since he appears in 4 scenarios.

I recommend option 1 for now and option 2 if the hi-vis hosts bother you. This choice does not affect the minimum.

### 6c. POV backgrounds and room work

| Item | Count | Work | Gemini? |
|---|---|---|---|
| Lab POV backgrounds | 0 new | Engagement Office (2 views) and Blue Team are done. Recon and Operations need none | No |
| One awareness training-room map, dressed and lit | 1 | Lab-owned map type copied from a shipped office, dressed with `room_edit.py`, lit (day office), no art generation. Needed first because the POV copies the final layout | No |
| Awareness POV backgrounds, one per company | 4 | Brightwell finance floor, Tarrowby HR/ops office, Quayholt service desk, Merrin & Sallow exec suite. 400x400, wired as `chatBackground` | Yes: 4 concepts, plus roughly 4 to 8 relight or fix edits |
| Awareness PIL company wall signs (optional) | 4 | Small signs on the map so the brand shows in the world | No |

Floor option: one neutral POV shared by all four companies (1 concept) loses the brand but halves the Gemini use. The same
dressed map would be used for all four, so a different wall sign per company is the only world difference.

Order, as in AGENTS.md: dress, then light, then POV last. Gemini is used only for background concepts (and for character concepts).

### 6d. Icons and logos (all PixelLab only)

| Item | Count | Notes |
|---|---|---|
| Awareness surface icons: QR poster, SMS bubble, push card, padlock "myth" overlay (adapt `padlock_32.png`) | 4 | Replace CSS-only stand-ins in the inbox-triage cards and E5 |
| Builder logos: Ledgerwell (LOGO1), CloudBoxy (LOGO5), Quayholt generic (E5) | 3 | One crisp 32x32 source each; the renderer draws the blurry and stretched variants. Lab needs the first two even without awareness |
| **Total** | **7** | |

Not in the minimum: awareness brand logos (CSS wordmarks are fine), step-strip icons, report-button animation, Tarnside (LOGO2) and
friendface (LOGO3) logos, the page-look layouts LOGO4 and LOGO6, and the rest of ASSETS section 4b.

### 6e. Totals

| | PixelLab only | Needs Gemini concept first (metered) | Total |
|---|---|---|---|
| Characters | 3 headshots | 12 (10 full, 2 bust-only) | 15 |
| POV backgrounds | 0 | 4 | 4 |
| Icons and logos | 7 | 0 | 7 |
| Room dressing and lighting (one map) | 1 | 0 | 1 |

Gemini: 16 concepts minimum, about 28 to 40 calls with retries and relights. If the user prefers, a character's concept could
be written straight in PixelLab, but the pipeline skill expects the Gemini concept (it makes the reframed face the later
steps copy), so that is a quality trade, not a free swap.

## 7. Open points for the user

1. Approve the 15 characters, or name a smaller first cut (for example the lab's three plus E1 and E3, 7 characters).
2. Pick a check-host option (6b).
3. Four company backgrounds or one shared neutral one (6c).
4. Confirm the order and cadence: one image at a time with sign-off, or a batch (batch 1 had a standing exception on 2026-10-21;
   it covered only the Slice rows).
5. Confirm ages and backgrounds for Dev, Thandiwe Moyo, Niamh Doherty and Chidi Okeke, which BRAND_SET does not pin down.

## 8. Method notes

- Scenario data came from parsing each `scenario.json.erb` with its ERB tags stripped (all 38 parsed). Sprite sets come from file
  presence in `public/break_escape/assets/characters/`. Lighting and `chatBackground` come from the scenario blocks.
- Not checked: whether each v1 talk sheet matches the v2 walk sprite's face; the per-role company mapping of check missions
  other than "general"; ages and backgrounds of the unpinned cast.

## User decisions (2026-10-22)
- **Characters:** all 26: the 15 core plus the 11 check-mission hosts.
- **Generation:** batch all; no sign-off on a first image.
- **Awareness POV backgrounds:** four, one per company. Each training room gets the full polish passes (dressing and lighting, five cycles) before its background is made.
- **Cast diversity:** concept prompts must state each character's ethnicity and age, taken from BRAND_SET.md. Never default to "light skin".

## Character batches (pixellab-character-pipeline, run in parallel)
- **A, lab (7):** Ruth Adeyemi, Gareth Fairbairn and Tomasz in full sets; Dev, bust only; Melanie Pierce, Sofia Lord and Jed Baker, headshots only.
- **B, episode hosts (7):** Adaeze Okafor, Fatima Begum, Darren Price, Thandiwe Moyo, Niamh Doherty, Chidi Okeke and Agnieszka Duda. Leila Nassar, bust only, makes 8.
- **C, check hosts 1:** Yasmin Chaudhry, Julian Sallow, Graham Whitfield, Farah Qureshi, Owen Treharne and Pauline Hendry.
- **D, check hosts 2:** Anjali Rao, Sofia Marchetti, Jun Watanabe, Ibrahim Diallo and Lerato Dlamini.
- **Scope change (user, later on 2026-10-22):** for now, make only the Gemini concepts. PixelLab characters wait until the user has reviewed the concepts.
