# E14: Social media and oversharing

Buildable by a fresh Sonnet implementer from this spec plus "Read first". All companies, people,
domains and figures are fictional; every domain ends `.example`. UK spelling; "cyber security" two
words; no em or en dashes. No scraping tools or techniques: the board only ever shows what the subject
posted, and the defence is always named.

E14 is the one attack-first episode in this set. It is **not** a consequence flip, so it does **not**
use ENG-04: it keeps the built attack stages `osint` and `write` and the built defender-inbox flip.

## 1. Goal and module(s)

Teach **core_12 (social media and oversharing)**: what public posts give away, how attackers join the
pieces up, and how to leave out the parts that help them. The learner first does the attacker's work by
hand (OSINT on one colleague's public posts, then one pretext message), sees it land in a colleague's
inbox, then turns the same board into a checklist for tightening posts and settings. Target length
about 15 minutes. Signature move: **attack-first OSINT on a colleague's posts, then fix the settings.**

Source of truth: `modules/core_12_social_media_and_oversharing/concepts.md`. Shape from
`.../game_design.md` ("Open Book"), with the Oskar reconciliation in section 5.

## 2. Read first (exact paths)

- `modules/core_12_social_media_and_oversharing/concepts.md` (source of truth), `.../game_design.md`,
  `.../assessment.md`.
- `designs/00_data_contract.md`: section 1 (intel fact schema, `provides`, `reduceNote`, slot types),
  section 2 (factor library and channel tells), section 4 (readiness slots), section 10/10a (templates,
  slots, the email identity model), section 11 (`awarenessEpisode`).
- `designs/02_osint_browser.md`, `designs/03_intel_board.md`, `designs/04_phish_rules_engine.md`.
- `designs/11_awareness_product_episodes.md`: sections 3.1, 4.1, 5.1, the "Built note (2026-10-22)".
- `awareness/BRAND_SET.md`, especially the Merrin & Sallow section 3 and the "E2 and E4 defend"
  additions (Oskar Berglund, Thandiwe Moyo, Julian Sallow, Leah Abramson).
- **The nearest built episode: E4 (Merrin & Sallow).** `awareness/e4/attack.json` is the model for the
  `people`/`intelFacts`/`templates`/`mailClient`/`osint`/`phishTargets` shape and the OSINT-then-write
  attack beat; `awareness/e4/defend.json` is the model for the `triageSets` item shape, the
  `awarenessEpisode` block and the flip strings. Shells: `scenarios/awareness_e4_exec_whaling*/`.
- Engine: `episode-runner/flip-view.js` (the built defender-inbox flip and `defenderLine(strings,
  templateId)` for aw2), `systems/phish-rules.js`, the OSINT browser and intel board minigames, the
  look-alike NPC guard, `systems/awareness-measure.js`.
- Validators as E11 section 2.

## 3. Depends on

- **Built, no new packet:** OSINT browser + intel board (the board of a colleague's public posts, with
  a `reduceNote` per fact), the template composer + phish rules engine + red-flag meter (one pretext
  message), the built flip view with `flipDefenderLineByChoice` (aw2), the inbox-triage defender under
  the `awareness` profile, the look-alike NPC guard (the fake senior-profile connection request), the
  measurement store, the debrief view and the shared rule of thumb.
- **Two small unscored surfaces in the defend stage, each now owned by a packet in `02_ENGINE_WORK.md`:**
  - **The privacy-settings panel** (tighten a profile; each change visibly closes a found fact on the
    board, the subject's and then the learner's own) uses **ENG-13**'s `awarenessEpisode.privacyPanel`
    block (a board-linked panel over the OSINT board; each setting names the `se_intel_*` facts it
    closes). Section 11.
  - **The "Post or Not?" feed drill** (mark draft posts Post, Tweak or Hold) uses **ENG-11**'s reusable
    `sortDrill` surface with its own `bins` (Post / Tweak / Hold), `scored: false` (teaching). It is not a
    bespoke surface and not a scoring row of its own. Section 11.
- **Check forms (no engine packet):** E14's topic (social media and oversharing, core_12) is a judgement
  topic, so it feeds the shared **`data_conduct`** pair built per `10_CHECK_FORMS.md` (ruling 1), not a
  per-topic form. Do not edit the six built role forms. Section 14.

## 4. Owner models

As E11 section 4: content to `opus48`; engine (the two new surfaces, the check-form wiring) to
general-purpose or Sonnet.

## 5. Company, room and host

- **Company: Merrin & Sallow Architects** (the company the module design names; built brand set,
  `merrinsallow.example`, look-alikes `merrin-sallow.example` and `merrinsallow-studio.example`,
  wordmark `MERRIN & SALLOW`, accent `#8a5a2b`). A London practice whose partners travel and speak at
  events, so diaries are partly public (which is what makes OSINT land).
- **Room: `room_aw_merrin_sallow`** (the built Merrin & Sallow training-room type used by E4). The feed,
  the OSINT board, the privacy panel and the triage are full-screen overlays; no new room.
- **Host: Julian Sallow** (`julian.sallow@merrinsallow.example`), the built Merrin & Sallow co-founding
  partner (built E4 cast; already hosts the E4 executive BA check pair, so his art exists), here
  welcoming the learner, carrying the per-item feedback and the debrief, and holding the conclusion
  `eventMappings`. Reuse of the built E4 cast; no new host art.
  - **Host rename (round 1 ruling 7):** E14 formerly reused Tomás Carvalho (the E4 PA) as host, but
    "Tomás" read as confusable with E11's "Tomasz" Wiśniewski if the two episodes ship in one course.
    Ruling 7 renames E14's host. Rather than invent a new name (and new art), E14 now hosts with another
    built M&S cast member, **Julian Sallow**, which clashes with nothing and still saves art: "Julian"
    does not clash with "Tomasz"; `BRAND_SET.md` and `awareness/e4/defend.json` already carry Julian
    Sallow, and the e4 `nameCheck` records "Sallow appears only in BRAND_SET". So E11 keeps Tomasz and
    E14 keeps a built, art-ready host. Julian is otherwise unused in E14 (the subject is Dani, the
    pretext target Yasmin, the impersonated senior Catherine Merrin), so there is no in-episode clash.
- **OSINT subject: Dani Fenwick**, a junior architect at Merrin & Sallow, friendly and oversharing, in
  on the exercise and thanked at the end (`dani.fenwick@merrinsallow.example`; public profile on the
  invented professional network). Late 20s, mixed heritage, two years qualified.
  - **Why not Oskar Berglund (cast reconciliation; the code wins over `game_design.md`):**
    `core_12/game_design.md` proposes reusing "Oskar Berglund, a junior architect" as the subject, but
    the **built** `awareness/e4/defend.json` fixes Oskar Berglund as a project manager at Brackenmoor
    Homes, a *client* (`oskar.berglund@brackenmoorhomes.example`), genuine in the E4 check forms. The
    subject must be an internal colleague (the learner tightens "his profile and yours"), and a client
    contact cannot be that. Per the WRITER_BRIEF rule that the code wins over `game_design.md`, Oskar
    stays a Brackenmoor client and E14 introduces a new internal junior, Dani Fenwick.
  - **Name-clash check (corrected 2026-10-28; round 2 ruling 4).** The earlier claim "'Fenwick' had no
    repo hits" was wrong. **"Fenwick" is already in the repo as Arthur Fenwick**, a patient / care-home
    resident (bed-sprite-only background character, no sender, no email, no dialogue) in the **unbuilt**
    `modules/sector_01_healthcare/game_design.md` and `03_WORLD_AND_CAST.md`. **E14 keeps Dani Fenwick**:
    Arthur Fenwick is a different person (different first name), in a different company and a different,
    unbuilt sector module (a hospital patient, not an architecture-practice colleague), so a learner on
    the core awareness course never meets both as the same name and the two cannot be confused. This is
    acceptable (the two are in separate modules), and is stated here so the clash is on the record rather
    than hidden behind a false "no hits" line. The other half of ruling 4 (E8's one-off client firm
    `fenwick-brandt.example`, which had shared the surname) is already resolved by the E8 fixer, who
    renamed it to **Marsden Holloway** (`marsden-holloway.example`), so there is no awareness-episode
    Fenwick clash left. "Dani" is a first name only and does not clash as a surname. (Avoided "Doyle",
    which has many repo hits.) Pre-ship web search for "Fenwick" as a real business is still owed where
    it reads as a company (it does not here).
- **Impersonated senior: Catherine Merrin**, managing partner (built), as a **fake** connection request
  in the defend half, flagged by the look-alike NPC guard. Her real profile is genuine.
- **Fake recruiter and the system-fishing stranger:** generic avatars, thin new accounts, no real
  brand. The genuine agency recruiter is **Roseanne Wadsworth** at **Kettlewick Talent**
  (`kettlewick.example`), the built genuine agency (`BRAND_SET.md`, renamed from Clarke).

### BRAND_SET.md additions (Merrin & Sallow)

Add to the Merrin & Sallow cast, following the format and the standing rules (web-search every new name
pre-ship; state the diversity choice):

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Dani Fenwick | Junior architect (OSINT subject; in on the exercise) | late 20s, mixed heritage (British/Filipino), two years qualified | `dani.fenwick@merrinsallow.example` | The oversharing colleague whose public posts the learner pins |

The invented professional network and feed are fictional, with `.example` domains (reuse E4's social
host name if one exists, else `friendface.example` as E4's attack fragment uses). State in the cast
block: the cast now spans the built Merrin & Sallow ages (20s to 60s) and mixed backgrounds; Dani adds
a late-20s mixed British/Filipino junior. Pre-ship: "Fenwick" web search owed.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | What happens |
|-------|---------|--------------|
| brief | 1 | Julian welcomes, reads the scope note |
| osint | 3 to 4 | Pin Dani's five public posts to the board; each shows its reduce note (section 9) |
| write | 2 to 3 | Compose one pretext message from a template, blanks filled from found facts; red-flag meter on; one send ends the beat |
| flip | under 1 | The learner's own message lands in a colleague's inbox with its tells highlighted (built flip) |
| defend | 4 to 5 | A six-item triage set (scored), plus the unscored feed drill and the privacy panel (section 11) |
| debrief | 1 to 2 | Per-item cards, the habit to keep, the "On Monday" card, the no-blame line (section 12) |

## 7. Stages (runner stage ids)

Full: `"stages": ["brief", "osint", "write", "flip", "defend", "debrief"]` (the built E4 stage list).
Defend-only: `"stages": ["brief", "defend", "debrief"]`. The feed drill and privacy panel run inside the
`defend` stage as unscored sub-activities; they are not separate stage ids.

## 8. Brief and scope note (host draft lines)

- **Scope note** (`scopeNote`): "Authorised exercise at Merrin & Sallow Architects, a fictional
  practice. In scope: Dani Fenwick's public posts and your own profile. Nothing you do here leaves this
  room." (The built scope-note pattern; Dani is in on it.)
- **Brief** (`strings.brief`): "You're on an authorised exercise at Merrin & Sallow Architects, a
  fictional practice. First you're on the red team: look at what one colleague, Dani Fenwick, has posted
  in public, pin what an attacker would use, then write one short message built from it. Then you swap
  sides: you spot the same tricks in a feed and an inbox, and close the gaps, on Dani's profile and your
  own. Only the inbox is scored."
- **Scope line (host, after the brief):** "See what one colleague's public posts give away, then close
  the gaps, on his profile and on yours."
- **Defend-only brief** (`_defendOnly.brief`): "You're on an authorised exercise at Merrin & Sallow
  Architects, a fictional practice. A feed and an inbox are waiting: some posts are fine, some give too
  much away, and some messages were made to pull work details out of you. Sort them, close the gaps,
  and report the fakes. Reporting or checking when you're unsure is always fine and never marked down."
- **Defend-only scope note** (`_defendOnly.scopeNote`): "Authorised exercise at Merrin & Sallow
  Architects, a fictional practice. In scope: a feed, an inbox and your own profile settings."

## 9. Attack half (OSINT and write)

No real brands, no scraping; the board only shows what Dani posted. Follow `e4/attack.json` keys.

### OSINT facts (the pins), with ids and reduce notes

Each is a post Dani made; collecting it sets `se_intel_<id>` and fills the board card. `provides` lists
the blank values it unlocks (slot types from `00` section 1). `reduceNote` is the one-line "leave this
off" prompt the board's defender mode shows (and the privacy panel acts on).

| fact id | Source (a Dani post) | Fact | provides | reduceNote |
|---------|----------------------|------|----------|------------|
| `df_profile` | professional-network profile | Dani is a junior architect at Merrin & Sallow; his team and his manager (Thandiwe Moyo, studio manager) are named | `name`/sender `df_full` "Dani Fenwick" distinctive; `name`/manager `moyo_full` "Thandiwe Moyo" distinctive; `team` `studio` "the studio team" generic | "Lock your profile down: an attacker reads your employer, team and manager straight off a public profile." |
| `df_system` | a shared job advert he reposted | names the practice's new finance system by name | `reference` `ms_finance_system` "the new finance system" distinctive | "Don't name internal systems, security tools or suppliers; a hiring post can give one away." |
| `df_badge` | a "new kit" photo | a lanyard and a whiteboard in shot confirm the system and his level of access | `reference` `df_access` "his access to the system" distinctive | "No badge, pass or screen in a photo; check what's behind you before you post." |
| `df_leave` | a leave countdown | Dani is away all next week | `date` `next_week` "next week" distinctive | "Keep leave private: 'away all week' tells an attacker when to strike and who's covering." |
| `df_pet` | a dog photo, captioned as a 'name a pet' answer | his dog's name (a common security-question answer) | (none; readiness/teaching) | "Keep pet, school, birthday and first car out of public view; use a made-up security answer kept in your manager." |

### The pretext message (one send)

The composer offers one From (the learner's exercise account), a greeting, and a choice of **pretext
template** (the aw2 consequential lever), with blanks filled only from facts on the board. The target is
a covering colleague, **Yasmin Chaudhry**, finance controller (built), who might action a finance-system
access request while Dani is away. The learner writes as Dani (senderTrust uses `df_full`).

Pretext templates (`part: "pretext"`, blanks take only found facts):
- `df_pretext_access_now` (urgency `high`): "I'm off all {when} and forgot to get {system} access
  sorted before I went. Thandiwe said it was fine. Can you set it up for me today so I'm not stuck when
  I'm back? Easiest if you just confirm it here." Blanks: `when` (date), `system` (reference).
- `df_pretext_access_calm` (urgency `low`): "I'm away {when}. When you get a chance, could you sort my
  {system} access for when I'm back? No rush." Blanks as above.
- `df_pretext_catchup` (urgency `low`): "How's the studio while I'm away {when}?" Blank: `when`. (A
  message that asks for nothing; the ask is what bites.)

`phishTargets` entry `df_cover` (Yasmin as the covering colleague): `interests.topics: ["access"]`;
`subjects`: `{ id: "s_access", text: "Quick favour while I'm off", topic: "access", requires:
["df_leave"] }` and `{ id: "s_other", text: "Hello", topic: "general" }`; `primedFor.distinctiveValues:
["ms_finance_system","next_week"]`, `minDistinct: 1`, `trusts: ["dani"]`, story: "a colleague she knows
is away and has asked her to set up access before he's back"; `requiredFactors: ["senderTrust",
"pretextRelevant"]`; `advisoryFactors: ["urgencyCalibrated"]`; `emailReplyDelay: 6`; one-send cap via
the runner. Factor strings follow the E4 pattern (open/senderTrust/pretextRelevant/urgencyCalibrated).

### The flip (built defender-inbox flip, aw2)

The learner's own message arrives in Yasmin's inbox with its `tells` highlighted (built flip view;
reads `tells`, not `redFlags`). The defender line is keyed to the chosen pretext via
`strings.flipDefenderLineByChoice[templateId]` (aw2, built):
- `df_pretext_access_now`: "Yasmin read it between two things. It named Dani's leave, the new system and
  Thandiwe, so it fitted the week, and the rush left no room to check. When a message fits the week, a
  colleague acting on it is the ordinary thing to do."
- `df_pretext_access_calm`: "No deadline and no secrecy, just an easy favour that matched a week she
  knew about. The ease is exactly what slipped it past her."
- `df_pretext_catchup`: "A catch-up asks for nothing, so there was nothing to question. It is the ask
  for access that turns a friendly note into a way in."

`flipDefenderLineByChoice` is erb-only (built rule; the defend-only shell has no write/flip and does not
carry it). The no-blame line lands here (section 12): a well-made profile of a person is built from
scraps anyone could find.

## 10. Flip

As section 9 (the built defender-inbox flip, aw2 by choice). No montage: E14 is not a consequence flip
and does not use ENG-04.

## 11. Defend set

**Scored set (the measured defend half):** six items on the built inbox-triage defender,
`scoringProfile: "awareness"`, `verifyVerdict: false` (the moves here are Report, Delete, Trust; there
is no "ring a number" item), `feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"`.
Set id `e14_social_dms`. `outcome.setGlobalPrefix: "episode_e14_social_media_defend_"`, `passPercent:
0`. `channelTells`: `["lookalike_domain", "secrecy_or_bypass"]` plus the scenario-local tell
`fake_profile` (a thin, new, impersonating account; add it as a scenario-local tell, not to `00`, since
it is specific to this episode) and `recon_request` ("a stranger asking for your firm's systems, org
chart or who runs IT"). The look-alike NPC guard handles item 2.

| # | Id | Kind / from | Subject or line | Tells and flags | Correct verdict | Reason text |
|---|----|-------------|-----------------|-----------------|-----------------|-------------|
| 1 | `e14_fake_recruiter` | DM, "Jordan Vale, Talent Partner" (thin new account) | "Great role for you. To tailor the application, could you send an overview of your firm's systems and who runs IT?" | `fake_profile`, `recon_request` | **Report** | "A genuine recruiter never needs a breakdown of your firm's systems or who runs IT. That is reconnaissance. Share nothing and report it. (The normal-looking phish half of the mirror pair.)" |
| 2 | `e14_fake_merrin` | connection request, "Catherine Merrin" (new, thin account; look-alike NPC guard) | "Let's connect" from a second account in the managing partner's name | `fake_profile` | **Report** | "A connection request in a senior leader's name from a new, thin account is a fake used to connect to staff and lend weight to later scams. Catherine's real profile is the established one. Report it." |
| 3 | `e14_real_recruiter` | DM, Roseanne Wadsworth, Kettlewick Talent (`kettlewick.example`), genuine | "A practice is hiring a Part 3 architect; shall I send the brief?" | none (genuine) | **Trust** | "A real agency recruiter with a role and no questions about your systems. Nothing to report; 'report everything' is not the win." |
| 4 | `e14_system_fisher` | DM, a stranger, genuine-looking account | "Loved your bridge model! Out of interest, what software does the studio run day to day?" | `recon_request` | **Report** | "A friendly opener that steers to your tools is still reconnaissance. You don't owe a stranger your firm's systems. Report it." |
| 5 | `e14_colleague_dm` | DM, Thandiwe Moyo (built), genuine | "Can you send me the studio floor plan for the client visit?" | none (genuine) | **Trust** | "A colleague you know, asking for something ordinary through a normal channel. Handle it." |
| 6 | `e14_old_colleague` | DM, a former colleague now elsewhere, genuine | "Good to reconnect! We've a junior role opening if you fancy it, happy to put your name forward." | none (genuine; reads like a recruiter pitch but asks nothing about systems) | **Trust** | "It reads like a recruiter pitch, but it's a real former colleague offering a lead and asking nothing about your work. The tell is what they ask for, not how friendly they are. (The suspicious-looking genuine half of the mirror pair.)" |

**Mirror pair (aw5):** item 1 (normal-looking phish, Report) and item 6 (suspicious-looking genuine,
Trust).

**Unscored teaching activities in the same defend stage (ENG-11 and ENG-13; section 3):**

- **"Post or Not?" feed drill (ENG-11 `sortDrill`):** uses ENG-11's reusable `sortDrill` surface with
  `bins: [{id:"post",label:"Post"},{id:"tweak",label:"Tweak"},{id:"hold",label:"Hold"}]`, `scored:
  false`. Draft posts to mark Post, Tweak or Hold, with one line of feedback each (an ENG-11 card's
  `reason`): a lanyard selfie (Tweak); a post naming the finance system (Hold); a team photo with a
  client whiteboard in shot (Tweak); a two-week leave post (Tweak or Hold); a genuinely fine pet photo
  with tight privacy (Post); a desk photo with a screen in shot (Tweak); a child's first-day photo
  tagging the school (Tweak, a security-question reminder). Unscored (not the `awareness` profile, and
  `scored: false` in the drill).
- **Tighten the settings (privacy panel, ENG-13 `privacyPanel`):** uses ENG-13's
  `awarenessEpisode.privacyPanel` block, each setting naming the found fact(s) it closes via
  `closesFacts: ["se_intel_df_..."]`. Set posts to connections only, hide the connections list, turn off
  location tags, crop or remove the risky posts, and change the pet-name security answer to a made-up
  one. Each change visibly closes a found fact on the board (a view-only teaching effect, ENG-13), Dani's
  first, then the learner's own. Unscored.

## 12. Debrief cards

Built debrief view, in order: per-item reasoning card for each of the six scored items; feedback on the
genuine items (the real recruiter, the colleague DM, the safe pet photo); the team-protected tally; then

- **The habit to keep** (shared rule of thumb, verbatim; do not rewrite): "When a message pressures you
  to move money, grant access, sign in or read back a code, stop and check it yourself through a route
  you already trust, not the link, number or page the message gives you. Taking a minute to confirm is
  always a fair thing to do."
- **The "On Monday" card:** "Tighten one privacy setting today, and check what's behind you before your
  next post or video call." Report route rendered under it from `slot:customer_report_route`.
- **The no-blame line** (`noBlameLine: true`): "A convincing profile of a person is built from scraps
  anyone could find. Nobody is foolish for having posted them; the fix is a setting and a pause, not
  shame."

The board is shown again at the end, most found facts now closed, each annotated with the setting or the
post change that closed it.

`defendOnly` string (where the flip would have been): "A well-made message is built from scraps anyone
could find online, and anyone can be pulled in by one. The ones you were caught out by are shown below,
with what gave each one away."

## 13. Defend-only variant

Own shell, id `e14_social_media_defend`, `variant: "defendOnly"`, same `defend.setId`
(`e14_social_dms`), stages `["brief","defend","debrief"]`, set prefix
`episode_e14_social_media_defend_defend_`. Drops the OSINT/write/flip beats; keeps the same scored set
and the ENG-11 feed drill and the ENG-13 privacy panel, so measurement is unchanged. Ships alongside the
full shell; both join the two seeded Hacktivity courses (full in the both-versions course, defend-only in
the defend-only course) **through 01 P12** (ruling 8).

## 14. Check-form items it feeds (`data_conduct`; see `10_CHECK_FORMS.md`)

Per round 1 ruling 1, there is no per-topic `social_form_a/b` pair. E14's topic (social media and
oversharing, core_12) is a judgement topic, so it feeds the shared **`data_conduct`** pair (Carrholme,
Verify on), defined and built in `10_CHECK_FORMS.md`. The earlier per-topic table is dropped. The six
built role forms are the measured baseline and are not edited. (The trade-off the orchestrator reports to
the user is that two broad pairs give no per-topic pre/post figure.)

Do not add new flag ids to the check forms: `data_conduct` scores only `00`-library tells, and E14's
scenario-local tells (`fake_profile`, `recon_request`) stay in E14's own defend set, never in a form (a
tell scored in a form must be in the shared library, ruling 1). The post-reading / "what does this give
away" item kind (which the old row 4 used) is an in-episode drill, handled by the ENG-11 feed drill, not
a check-form item.

E14's contribution is the core_12 rows of `10`'s `data_conduct` pair (see `10`'s item list): the
recruiter / fake-profile reconnaissance probe (`dca_recruiter_probe` / `dcb_journalist_probe`) and the
"what's approved to share" genuine comms item (`dca_comms_ok` / `dcb_press_line`). These are authored as
part of `10`, aligned to E14's framing; they are not a separate E14 form.

## 15. Files to create or change

Writer: this spec only.
Implementer: `awareness/e14/attack.json` and `awareness/e14/defend.json` (modelled on `e4/`); shells
`scenarios/awareness_e14_social_media/` and `.../_defend/` (one-room `room_aw_merrin_sallow` kiosk, host
Julian Sallow, kiosk `{ episodeId }`); the **"Post or Not?" feed drill as ENG-11's `sortDrill` surface**
and the **privacy panel as ENG-13's `privacyPanel`** (section 11); `BRAND_SET.md` (Dani Fenwick); the
`fake_profile`/`recon_request` scenario-local tells; parity/validator updates as needed. The
`data_conduct` check shells are built by `10`'s check generator, not here (section 14). Never run a
generator into the repo.

## 16. Bridge script outline

`tools/playtest/se/bridge-e14-full.jsonl`: open kiosk; brief; pin the five OSINT facts (assert each
reduce note); compose one pretext (pick `df_pretext_access_now`) and send once; flip (assert the
by-choice defender line for `df_pretext_access_now` renders); the six triage items (one verdict each,
assert immediate feedback); the feed drill and privacy panel (assert at least one found fact closes);
debrief (assert the habit-to-keep box and Monday card); conclusion global
`episode_e14_social_media_defend_done` set. A second bridge for the defend-only shell.

## 17. Acceptance checks

As E11 section 17, for the E14 shells (the `data_conduct` pair's parity is `10`'s acceptance, not E14's).
Plus: the attack beat caps at one send (`maxSends: 1`); the board shows a `reduceNote` for each of the
five facts; the flip uses the built defender-inbox view (not a montage); `flipDefenderLineByChoice` is
erb-only (parity test); the ENG-11 feed drill renders its Post/Tweak/Hold bins and the ENG-13 privacy
panel closes at least one found fact. `social.awareness.ruleOfThumb` byte-identical to the other shells.

## 18. Do not

- Do not teach scraping tools or techniques; the board shows only what Dani posted, and the defence is
  always named.
- Do not build the attack on a real person or the learner's real accounts; Dani is fictional and in on
  it.
- Do not teach fake-profile signs as proof: they are hints; the reliable move is to share nothing
  sensitive and report.
- Do not make the OSINT subject an internal Merrin & Sallow employee named Oskar Berglund (he is a
  Brackenmoor client in built E4). Use Dani Fenwick.
- Do not use ENG-04 or a montage flip; E14 is attack-first, not a consequence flip.
- Do not edit the six built role check forms; do not use real brands; `.example` only.
- Do not run a generator into the repo; never `git stash`; no attribution lines in commits.

## 19. Stop and ask if

- ENG-11's `sortDrill` or ENG-13's `privacyPanel` are wanted scored rather than unscored teaching (for
  example, the feed drill is meant to be the scored set): this changes section 11.
- The orchestrator wants the OSINT subject kept as Oskar Berglund despite the built E4 conflict (section
  5 resolves this to Dani Fenwick; reopening it needs built E4 data changed, out of E14's scope).

## 20. Open questions

- **Oskar vs Dani (resolved):** the OSINT subject is the new internal junior **Dani Fenwick**, because
  built E4 fixes Oskar Berglund as a Brackenmoor client (section 5) and the code wins over
  `game_design.md`. This is settled; keeping Oskar would require changing built E4 data, which is out of
  E14's scope.
- **Feed drill and privacy panel scoring:** kept unscored here (ENG-11 `scored: false`, ENG-13 view-only)
  so the measured defend set is a standard six-item triage set with a mirror pair. If the product wants
  the feed drill scored, that is a request to `05` and changes the measurement.
- **Host first-name clash with E11 (resolved, ruling 7):** E14's host is renamed from Tomás Carvalho to
  the built M&S partner **Julian Sallow** (section 5), so E11 keeps Tomasz Wiśniewski and there is no
  first-name clash.
- The pre-ship web search for "Fenwick" (as a name) is owed.
