# 11 WP-12: the core_00 first-play brief and the core_17 annual edition

Two small missions built on the existing runner. Neither needs new content systems; both need their
content drawn from the module designs and checked against the code.

## Owner model

Content: `opus48` (it is awareness content). The one engine question in core_00 (a completion signal
for a brief-only mission) is noted and routed; do not let it block the content.

---

# Part A: core_00, the first-play brief

## Goal

A short brief inside the kiosk frame, about 5 minutes, shown before a learner's first episode: the
scope note, how the product works, that nothing real is asked for, what is recorded and who sees it,
why anyone is targeted, the habit to keep, how to report, and the no-blame line. It is practice, it
is safe, nobody is caught out.

## Read first

- `planning_notes/security_awareness_course/modules/core_00_first_day/game_design.md` (the whole
  file: it defines the brief, retires the old Larkspur "First Day", and lists the seven cards).
- `modules/core_00_first_day/concepts.md` (the source of truth for the wording: key messages, "The
  habit to keep", "How to report here", "No blame", "What's recorded and who sees it" in "How the
  course works").
- `public/break_escape/js/minigames/episode-runner/episode-model.js` (`stagesFor`, `STAGE_IDS`,
  `DEFAULT_STAGES`): what a brief-only stage list runs.
- `public/break_escape/js/minigames/episode-runner/episode-runner-minigame.js` lines 327 to 395 and
  532 to 545: `_render`, `_renderBrief`, `_renderFinished`, `_complete`, `_saveState`. Read these:
  they decide the recommendation below.
- `scripts/validate_social/awareness.rb` (`stage_checks`, `STAGES_BY_VARIANT`): the validator accepts
  only the `full` and `defendOnly` stage orders, so `stages: ["brief"]` is **rejected** today even
  though the runner model would run it. This is what ENG-10 fixes.
- **Engine packet: `02_ENGINE_WORK.md`, packet ENG-10** (core_00 brief-only episode: a `variant:
  "brief"` with the `["brief"]` validator allowance, a multi-card brief `strings.briefCards`, a
  completion global `doneGlobal`, and `oncePerLearner`). This is the clean path for Part A; see below.
- A built shell for the `scenario.json.erb` skeleton, host NPC and kiosk: any
  `scenarios/awareness_*_defend/scenario.json.erb`, plus `gen_e3_e5_shells.py` `scenario()`.

## What the runner supports today (checked in the code)

- `stagesFor(episode)` keeps any authored stage id in `STAGE_IDS`, so `stages: ["brief"]` runs the
  brief stage only and then finishes. A brief-only episode is therefore valid to the runner **model**.
- **But the validator rejects it today.** `awareness.rb` `stage_checks` accepts only the `full` and
  `defendOnly` stage orders (and `["check"]` for a check mission), so a `full` episode with
  `stages: ["brief"]` fails `--strict-social` (which Part A's acceptance runs). The allowance is
  ENG-10's work (a new `variant: "brief"`), so even the stopgap below needs ENG-10's validator change.
- **But `_renderBrief` draws exactly one panel**: a heading, `strings.brief` as one paragraph, the
  optional `scopeNote`, and a **Start** button (`episode-runner-minigame.js:384`). It does **not**
  render a sequence of concept cards, and there is no **Got it** gate and no once-per-learner play.
  So the module's seven-card flow and the "what we record" Got-it card are not available as authored
  cards in the brief stage as it stands.
- When the brief completes, `nextStage` is `null`, so `_render` calls `_renderFinished`, which shows
  a plain "Finished" panel (`:532`). **The runner writes no completion global for a no-triage
  episode**: `_saveState` only writes `episode_<id>_state` (`:255`). The built defend and check
  shells conclude their objective on a `*_done` global that the triage set's
  `outcome.setGlobalPrefix` writes; a brief-only episode has no triage set, so no such global fires.

## Recommendation: a brief-only episode on ENG-10

Ship core_00 as a **brief-only episode shell** built on **ENG-10** (`02_ENGINE_WORK.md`): a
`variant: "brief"` with `stages: ["brief"]`, a multi-card brief `strings.briefCards`, a completion
global `awarenessEpisode.doneGlobal`, and `oncePerLearner: true`. ENG-10 is the clean path and it
lands the module's card-by-card flow, the Got-it gate, once-per-learner play, and a proper done
global for the objective, all at once. It also supplies the validator allowance that `stages:
["brief"]` needs (the validator rejects it today without ENG-10).

If ENG-10 slips and core_00 must ship first, the stopgap (below) is a single rich `strings.brief`
panel concluded on the state global, but it **still needs ENG-10's validator allowance** for
`["brief"]`, so ENG-10's validator change is a hard dependency either way. Do not ship core_00 before
that change.

Why not a bespoke new shell type: a new concept-card runner is more engine work than the content
warrants, and the module itself says "no new minigame is needed; the brief is authored cards in the
existing frame"; ENG-10 adds exactly the small pieces the existing frame lacks.

### Files to create or change

- `scenarios/awareness_core_00_first_play/scenario.json.erb` and `mission.json` and `ink/`.
- Place it first in both seeded Hacktivity courses (as the opening mission), so a learner meets it
  before their first episode. (Course placement is an organiser/Hacktivity edit; name it, do not do
  it without the user's go-ahead on any Hacktivity change.)

### The shell

- `scenario_id: "awareness_core_00_first_play"`, `disableAttacks: true`, `startRoom: "training_room"`,
  the standard `player` block, one training room with a host NPC and a kiosk (copy the shape from a
  built shell and `gen_e3_e5_shells.py` `scenario()`).
- Host and room: whichever company the organiser opens first. For the shipped shell pick one default
  (Quayholt Insurance, host Anjali Rao, `room_aw_quayholt`), and note that the module intends the
  brief to adopt the first episode's host (a later once-per-learner engine piece, below).
- `awarenessEpisode`: `id: "core_00_first_play"`, `role: "general_staff"`, `company:
  "quayholt_insurance"`, the Quayholt `brand` block, **`variant: "brief"`** (ENG-10), `durationTargetMin: 5`,
  `stages: ["brief"]`, `conclusionTaskId: "<the task>"`, a `scopeNote`, **`doneGlobal:
  "episode_core_00_first_play_done"`** and **`oncePerLearner: true`** (ENG-10), and the brief content
  as **`strings.briefCards`** (an array of `{ heading?, text }`, the seven cards below) with an
  optional `strings.briefDone` ("Got it") and `strings.alreadySeen`. A single rich `strings.brief`
  panel is the degraded stopgap only if ENG-10's multi-card brief is not ready. Declare `doneGlobal`
  in `globalVariables` (ENG-10 lints this). Carry `social.awareness` via
  `awareness_deploy.awareness_block()` so the shared rule of thumb is present and the rule-of-thumb
  test passes. No `defend` block.
- `mission.json`: `display_name: "Before you start: how this works"`, `collection: "training"`,
  `ui_theme: "general"`, `difficulty_level: 1`, `scoring: "completion"`, `secgen_scenario: null`,
  `estimated_duration_minutes: 5`, a Human Factors `cybok` block.

### Completing the mission (the one wiring decision)

Because the built runner writes no `*_done` global for a no-triage episode, the objective cannot
conclude the built way without ENG-10. Two options:

1. **Clean (ship this, ENG-10):** ENG-10's `awarenessEpisode.doneGlobal` writes
   `episode_core_00_first_play_done = true` when the brief-only episode reaches its last stage, so the
   objective concludes exactly as the defend and check shells do (on a `*_done` global). ENG-10 also
   lands the multi-card brief and once-per-learner gating. This is the recommended path, and the
   `["brief"]` validator allowance it carries is needed regardless.
2. **Stopgap (only if ENG-10 is not ready):** conclude on the state global becoming truthy. The
   runner writes `episode_core_00_first_play_state` once, when the brief stage completes
   (`_complete('brief')` -> `_saveState`). Give the objective `concludeRequires` an event the host
   NPC maps: `eventPattern: "global_variable_changed:episode_core_00_first_play_state"` with a
   condition that the value is set, `onceOnly: true`, `completeTask: "<the task>"`. This still needs
   ENG-10's validator allowance for `stages: ["brief"]`, so it is not truly zero-engine. Verify in a
   bridge that the task completes on Start.

### The seven cards (draft; the dialogue reviewer polishes)

Seven cards, one per beat, in `strings.briefCards` (ENG-10's multi-card brief: an array of
`{ heading?, text }`, stepped through with Next and a final Got-it card). Each beat below is **one entry
of `strings.briefCards`**, a short paragraph, about 5 minutes to read in all, covering the module's seven
points in order. This is the recommended path and matches "Recommendation" and "The shell" above: the
brief is seven cards, not one panel. Draw the wording from `concepts.md`; keep it plain, UK spelling, no
dashes, no effectiveness claims. `scopeNote`: "An authorised exercise at <company>, a fictional company.
Everything here is practice; nothing you do leaves the game."

If ENG-10's multi-card brief is not ready, the degraded stopgap folds the same seven beats into one rich
`strings.brief` panel (see "Recommendation"); the content is identical, only the presentation differs.

Card beats (one `strings.briefCards` entry each, in this order):

1. **Welcome and scope.** This is practice at a fictional company. You will not be caught out.
2. **How it works.** The kiosk steps through a brief, an attack half where you build one message from
   a company's public details, a flip where you meet it in an inbox, a scored defend half where you
   sort the post (Trust, Report, Delete, and sometimes Verify) and name the tells, and a debrief.
   Only the defend half is scored; the attack half never is.
3. **Nothing real.** The product never asks for your real password, bank details or personal
   information. Sign-in pages and forms are models that capture nothing.
4. **What we record, and who sees it.** The items, your verdicts, the flags and times; no free text
   and no identity. Results go to you and to an organiser-only group figure. Your choices are
   practice and are never used for discipline. (Module "How the course works".)
5. **Why you.** Most attackers are criminals after money; they want what your access opens; most
   attacks begin with a message, a call or a stolen password. (Key messages 1 and 2.)
6. **The habit to keep.** Quote the rule of thumb word for word (below). "Pause. Check. Report." is
   not used.
7. **Report, and no blame.** Emails: the Report button. Anything else: the security team or service
   desk. Reporting is never wrong, and reporting a mistake quickly is thanked, not blamed. The
   customer's reporting route shows in every debrief.

The rule of thumb, quoted exactly (it must match `awareness_deploy.AWARENESS_RULE_OF_THUMB_TEXT` and
the test `test/js/social-awareness-rule-of-thumb.test.mjs`):

> When a message pressures you to move money, grant access, sign in or read back a code, stop and
> check it yourself through a route you already trust, not the link, number or page the message gives
> you. Taking a minute to confirm is always a fair thing to do.

### Engine gaps to flag (not this brief's work)

The first three of these are **ENG-10** (`02_ENGINE_WORK.md`), the packet this part depends on; the
last is a separate, later engine piece:

- a multi-card brief (a run of concept cards with Next and a Got-it card) in the brief stage: **ENG-10**
  (`strings.briefCards`);
- once-per-learner play of the first-play brief (`oncePerLearner`, so it shows once then is skipped):
  **ENG-10**. The module's "adopt the first episode's host" behaviour is not in ENG-10; it stays a
  later gap, flagged here.
- a brief-only completion global: **ENG-10** (`doneGlobal`, option 1 above);
- BE-20, the authorable title and tutorial, so the opening shows the course title, not the platform's
  (the module calls this the one engine piece; it is out of scope here and not part of ENG-10, but
  needed for the first impression).

### Acceptance checks

- `ruby scripts/validate_scenario.rb scenarios/awareness_core_00_first_play/scenario.json.erb
  --strict-social --no-graph --skip-ink` passes (requires ENG-10's `variant: "brief"` /
  `stages: ["brief"]` validator allowance; it fails without it).
- `node --test test/js/social-*.test.mjs` stays green, including the rule-of-thumb test.
- A bridge run (model it on a built `bridge-e*-full.jsonl`): opening the kiosk shows the brief panel,
  Start finishes it, and the objective concludes. One bridge at a time on :3001 (HANDOVER.md
  section 4).

### Do not

- Do not rebuild the retired Larkspur "First Day" (no reception, no walk, no cast).
- Do not add a scored decision; there is nothing to get wrong.
- Do not claim effectiveness, and do not promise no-blame handling the organisation has not set (it
  is an organisation slot).

### Stop and ask if

- ENG-10 is not available when core_00 must ship: the stopgap (one `strings.brief` panel, state-global
  conclusion) still needs ENG-10's `["brief"]` validator allowance, so core_00 cannot validate or ship
  without at least that part of ENG-10. Confirm the sequencing with the orchestrator; do not build a
  bespoke card runner.
- The module's "2 to 3 minutes" (game_design) and this brief's "about 5 minutes" (`WRITER_BRIEF.md`)
  need reconciling: the content is short, so either is fine; ship at `durationTargetMin: 5` unless
  the user says otherwise.

---

# Part B: core_17, the annual mixed edition

## Goal

An annual mixed edition built from the existing defend sets: a mixed run of the year's threats across
channels and companies, through the built inbox-triage defender. core_17 is a
**`defendOnly` variant whose defend set holds 8 messages** (8 is the `EPISODE_MESSAGES` cap in
`awareness.rb`). The annual sitting is that shell (about 8 to 10 minutes) **followed by the learner's
existing role post-check** (about 9 minutes), so about 17 to 20 minutes in total. This shape validates
under `--strict-social` with **no new engine packet**. No new content systems; the only new work is the
8-message combined set and the "what changed this year" brief.

## Read first

- `modules/core_17_capstone_annual_assessment/game_design.md` (the whole file: "assembled from
  pieces that already exist", the 2027 mix, the brief, the debrief, the pitfalls).
- `modules/core_17_capstone_annual_assessment/concepts.md` (the "what changed this year" source).
- The episode defend fragments, for the exact item objects to draw:
  `awareness/e1/defend.json` (`e1_payments_inbox`), `awareness/e3/defend.json`
  (`e3_service_desk_queue` and `awarenessEpisode.defend.calls`), `awareness/e5/defend.json`
  (`e5_links_inbox`), `awareness/e6/defend.json` (`e6_phone_messages`), `awareness/e7/defend.json`
  (`e7_finance_line`).
- `scripts/validate_social/awareness.rb`: `STAGES_BY_VARIANT['defendOnly']` is
  `["brief","defend","debrief"]`; `EPISODE_MESSAGES = (4..8)` (so a defend set has 4 to 8 messages);
  `full?` is `variant == 'full'`, so a `defendOnly` episode never runs `attack_checks` (no attack block
  is needed or allowed); `id_suffix_checks` requires a `defendOnly` id to end in `_defend`;
  `set_checks` requires `outcome.setGlobalPrefix == "episode_<id>_defend_"`, which for an id ending
  `_defend` reads `..._defend_defend_`.
- `public/break_escape/js/minigames/episode-runner/episode-model.js` (`childLaunch` returns a single
  `triageSetId`: the runner runs **one** defend set per mission).
- A built defend-only shell for the skeleton: `scenarios/awareness_e6_texts_and_qr_defend/`.

## The item ids the edition reuses (8 messages; all confirmed to exist, 2026-10-28)

The runner runs one triage set, so the edition is **one new combined set** of exactly **8** `messages`,
each a copy of an item object below drawn from the episode defend sets. The 8 cover the year's channels
(email, call, voicemail, SMS, push, and a sign-in page) and three companies (Brightwell, Quayholt,
Tarrowby), and include one mirror pair. Every id exists today (grep-confirmed 2026-10-28):

| # | Source (episode, company) | Item id | kind | phish? | note |
|---|---|---|---|---|---|
| 1 | `e1_payments_inbox` (E1, Brightwell) | `e1_lookalike_bank` | email | phish | a normal-looking bank-detail-change phish |
| 2 | `e1_payments_inbox` (E1, Brightwell) | `e1_bank_confirmed` | email | genuine | the bank's genuine confirmation |
| 3 | `e3_service_desk_queue` (E3, Quayholt) | `e3_push_early` | push | phish | an unrequested MFA push (`unrequested_mfa_push`) |
| 4 | `e3` calls (E3, Quayholt) | `e3_call_gordon_impostor` | call | phish | a plausible impersonator; **mirror pair A** |
| 5 | `e3` calls (E3, Quayholt) | `e3_call_gordon_real` | call | genuine | the real, awkward Gordon; **mirror pair B** |
| 6 | `e5_links_inbox` (E5, Quayholt) | `e5_sso_lookalike` | page | phish | a look-alike sign-in page |
| 7 | `e6_phone_messages` (E6, Tarrowby) | `e6_shift_moved` | sms | genuine | a genuine shift-change text |
| 8 | `e7_finance_line` (E7, Brightwell) | `e7_vm_ravinder_cloned` | voicemail | phish | a cloned-voice voicemail |

That is 8 items (5 phish, 3 genuine) across email, call, voicemail, SMS, push and a sign-in page, and
across Brightwell, Quayholt and Tarrowby: the year's channels and brands in one short sitting. Keep the
three genuine items in (module pitfall "a gotcha festival"). **Channel coverage:** email (1, 2), call
(4, 5), voicemail (8), SMS (7), push (3), plus a sign-in page (6): email, call,
voicemail, SMS-or-QR and push. **Mirror pair (aw5):** item 4 (the normal-looking impostor call) and item
5 (the suspicious-looking genuine call), the two sides of Gordon's line.

This is a selection, not all available items; it fits about 8 to 10 minutes with immediate feedback. For
a different year's mix, swap ids from the same pools (keeping 8, the cap, and keeping the channel spread
and one mirror pair): `e1_payments_inbox` 6, `e3_service_desk_queue` 1 message + 3 calls, `e5_links_inbox`
5, `e6_phone_messages` 6, `e7_finance_line` 5.

### The one non-trivial step: E3's calls, reshaped as data only

Items 4 and 5 are E3 calls that live in `awarenessEpisode.defend.calls`, not in a set's `messages`; in
E3 the role swap merges them into the queue at runtime (P7-P). The annual edition has **no** role swap
and **no** `defend.calls` key (so `awareness.rb` `call_checks` does not run and no `pretextNpcs` are
needed). Instead, reshape each E3 call into a plain triage `call` **message** authored as data, matching
the shape of the built call items in `helpdesk_form_a` (for example `ha_call_facilities`: `kind: "call"`,
`callerId`, `from`, `time`, `transcript: [{who, text}]`, `truth: { isPhish, flags, perFlagNote,
ifTrusted, reportReply }`; a genuine call uses `whyFine`/`falseAlarmCost` in `truth`). Map the call's
`tells` to `truth.flags`, its `notes.perFlagNote`/`whyFine` to `truth`, and **drop the `claims`** (a
triage call message does not read them). Keep the ids (`e3_call_gordon_impostor`, `e3_call_gordon_real`).
Both reshaped calls go in `messages`, so the set is a flat 8-message array, not a messages-plus-calls
split. (If reshaping the pair is unwanted, the ready-made `ha_call_facilities`/`ha_call_printer` cards
are already triage `call` data; but prefer the episode calls so the Gordon mirror pair carries the beat.)

## Files to create or change

- Create `awareness/core17/annual_2027.json` (a fragment holding the combined set `annual_2027_mixed`
  and a minimal `awarenessEpisode` block with the "what changed this year" brief strings). **Not
  `awareness/e17/`**: that folder is E17's (acceptable use), whose fragment follows the built
  `awareness/e${n}/defend.json` parity pattern; core_17 is not episode 17, so it gets its own
  `core17/` folder.
- Create the shell `scenarios/awareness_core_17_annual_2027_defend/scenario.json.erb`, `mission.json`,
  `ink/`. A generator is optional (the set is hand-assembled); if you add one, model it on
  `gen_e3_e5_shells.py` and never run it into the repo.
- Place the mission in both seeded courses as the year-end item, through **01 P12**; do not
  hand-edit Hacktivity or use `awareness_deploy.py`.

## The shell and the combined set

- `awarenessEpisode`: `id: "core_17_annual_2027_defend"` (ends in `_defend`, so the `defendOnly` id
  suffix lint passes), `role: "general_staff"`, **`variant: "defendOnly"`**, `durationTargetMin: 10`,
  **`stages: ["brief", "defend", "debrief"]`** (the only order a `defendOnly` variant may author; no
  attack, no flip), `conclusionTaskId: "<task>"`, a neutral `scopeNote`, a `brand` (neutral, or
  Brightwell as a default; the room is dressed neutrally per the module),
  `debrief: { mondayCard: "slot:customer_report_route", noBlameLine: true }`, and `strings.brief` =
  the "year in three changes" brief (below). No `attack` block (a `defendOnly` episode never carries
  one, and `attack_checks` does not run).
- Host: a neutral proctor, **Graham Whitfield** by default (a built Brightwell finance check host,
  `BRAND_SET.md`), who carries the `eventMappings` completing the task on the combined set's done global
  (`global_variable_changed:episode_core_17_annual_2027_defend_defend_done`). Graham exists today only
  with check-form welcome ink (`awareness_pre_finance_ab/ink/graham_pre.ink`), which is the wrong shape
  for a defend host, so **copy the defend-host ink `ink/chidi_okeke.ink` from
  `scenarios/awareness_e6_texts_and_qr_defend/`**, rename it to `ink/graham_whitfield.ink` (knot
  `start`, `storyPath` pointing at the renamed file) and replace Chidi's Tarrowby lines with Graham's
  generic proctor lines.
- The combined set `annual_2027_mixed`:
  - `scoringProfile: "awareness"`, `verifyVerdict: true` (it contains calls and a voicemail, which
    need the ring-back verdict), `feedbackMode: "immediate"` (matches how the learner met these items
    all year; `end` is an option if the user wants it exam-style), `headerPanel: "off"`,
    `glossary: "closed"`. (`reportAlwaysVisible` is a `defend`-block key, not a set key; put it on the
    `awarenessEpisode.defend` block, below, not on the set.)
  - Set labels: `title: "The year in review"`, `brief: "A mixed run of the year's messages across
    email, calls, a voicemail, a text, a sign-in prompt and a page, from Brightwell, Quayholt and
    Tarrowby. Some are real; some are the year's scams. For each, decide and say why. The sitting moves
    you between seats: a payments inbox, then a service-desk queue, then a phone."`,
    `realLabel: "Real messages"` (the built E6 set uses "Real texts and notices"; this queue is mixed,
    so "Real messages" reads better). The brief's "moves you between seats" line is the note the
    general_staff learner needs, because items 1 and 2 are payments-team emails and items 4 and 5 are
    service-desk calls.
  - Message order: each impostor before its genuine twin, which the §"item ids" table already does
    (item 4 impostor Gordon before item 5 real Gordon).
  - `channelTells`: the union of the channel tells the 8 copied items use, all `00`-library ids, so no
    new tell is introduced: `["unrequested_mfa_push", "vish_callback_pressure", "borrowed_authority",
    "lookalike_domain", "padlock_myth", "changed_bank_details", "secrecy_or_bypass"]`. Because the set
    holds non-email kinds (push, call, voicemail, page), the flag universe must include channel tells,
    which these do (`triage.rb`).
  - `outcome: { setGlobalPrefix: "episode_core_17_annual_2027_defend_defend_", passPercent: 0 }`, the
    built double-suffix for an id that already ends `_defend` (the runner's `defendPrefix()` builds it
    the same way). It writes `episode_core_17_annual_2027_defend_defend_done`, and the objective
    concludes on that (the built defend way).
  - `messages`: copies of the 8 item objects above (the two E3 calls reshaped, as data). Keep each
    item's `id`, `truth`, `perFlagNote`, `whyFine`, `ifTrusted`, `reportReply` and any
    `flagAlternatives` unchanged, so the measurement is the same measurement.
- `defend: { setId: "annual_2027_mixed", reportAlwaysVisible: true }` in `awarenessEpisode`. No
  `defend.calls` key (the calls are reshaped into `messages`).
- `globalVariables` (declare all; defaults as shown; copy the shape from
  `awareness_e6_texts_and_qr_defend`): `episode_core_17_annual_2027_defend_state: {}`,
  `se_awareness_records: []`, `episode_core_17_annual_2027_defend_defend_percent: 0`,
  `episode_core_17_annual_2027_defend_defend_reportRate: 0`,
  `episode_core_17_annual_2027_defend_defend_done: false`,
  `episode_core_17_annual_2027_defend_defend_pass: false`. No `phish_*` global and no `triage_pre_*`
  globals (core_17 is not a check mission). One objective with `missionConclusion: true`, its
  `concludeRequires.globals` listing `episode_core_17_annual_2027_defend_defend_done`, and
  `conclusionTaskId` a task of that aim, completed by the host NPC's `eventMappings` entry on
  `global_variable_changed:episode_core_17_annual_2027_defend_defend_done` (the built defend conclusion
  wiring; see `awareness_e6_texts_and_qr_defend`).
- `mission.json`: `display_name: "Year End: the annual mixed edition"`, `collection: "training"`,
  `ui_theme: "general"`, `difficulty_level: 1`, `scoring: "completion"`, `secgen_scenario: null`,
  `estimated_duration_minutes: 10`, a Human Factors `cybok` block.
- Carry `social.awareness` via `awareness_deploy.awareness_block()` (the rule-of-thumb test). The
  debrief adds the module's plain line "Break the chain at the first link." as debrief copy, not in
  place of the rule of thumb.

## The post-check that follows (no new shell)

The annual sitting is this `defendOnly` shell **then the learner's existing role
post-check**, about 9 minutes, so 17 to 20 minutes in total. The post-check is one of the built role
check shells (the 24 built shells, and the two new pairs from `10_CHECK_FORMS.md` where a role uses
them); **no new check shell is built for core_17**. The organiser places the learner's role post-check
after the edition; it compares against the role pre-check the learner took earlier in the year through
the built `pre_check_completed` / `triage_pre_*` export-and-import mechanism, which is the post shell's
own wiring, not core_17's. Say this in the mission description and the organiser note. core_17 itself is
not a check mission and declares no `triage_pre_*` globals.

## Timing

About 8 to 10 minutes for the edition shell: a short brief, an 8-item mixed run with immediate feedback,
and a short debrief. The following role post-check is a separate ~9-minute mission, giving about 17 to 20
minutes in all. Keep all three genuine items so the lesson is not "everything is an attack".

## The "what changed this year" brief (draft)

Three short changes, from **`modules/core_17_capstone_annual_assessment/concepts.md` lines 66 to 70**
("The proctor's three headline changes for the 2027 brief"), each one aid, rewritten each year,
authored into `strings.brief` (the built brief stage renders `strings.brief`; this is not the
brief-only `briefCards` variant of Part A). The three, verbatim from that range:

1. "Scams switch channels." A text, then a call, then an email. Check another way, every time.
2. "A voice isn't proof." A voice note or call from someone you know can be faked. Call back on the
   number you already have.
3. "Your login is the prize." A prompt you didn't start, a caller who wants a code, a colleague who
   wants your password: all the same request.

Spoken lines are generic; any figures are on screen only (no voiced line prints a variable). Keep it
to three beats plus the habit; the dialogue reviewer polishes.

### Strings to rewrite, missions.json, and the shell-count test

- **Strings copied from the E6 defend shell and rewritten.** The `awareness_e6_texts_and_qr_defend`
  shell carries `defendOnly`, `defendIntro`, `flipMissedHeading`, `flipLandedNoTells`, `noBlameLine`
  and `mondayCard` strings worded for Tarrowby phones. The validator does not read most of them, but
  the debrief prints `noBlameLine` and the Monday card, and the defend intro shows at the start, so
  **rewrite `defendOnly`, `defendIntro`, `noBlameLine` and `mondayCard`** to the neutral year-review
  wording (the Monday card is `"slot:customer_report_route"`, so only its lead sentence is authored).
  The two `flip*` strings are never shown in a `defendOnly` shell (there is no flip stage); leave them
  or drop them, either validates.
- **`mission.json`.** Copy the block from `scenarios/awareness_e7_voice_ceo_defend/mission.json`
  (a built `defendOnly` shell) and change `display_name`, `description` and the `cybok` keywords; keep
  `difficulty_level: 1`, `scoring: "completion"`, `secgen_scenario: null`, `collection: "training"`,
  `ui_theme: "general"`, `estimated_duration_minutes: 10`.
- **Shell-count test.** core_17 adds **one** shell folder, so bump the count the rule-of-thumb test
  reads by 1 (P6; `test/js/social-awareness-rule-of-thumb.test.mjs` counts the `awareness_*` folders),
  and add the shell to the fragment-erb parity row set if that test enumerates defend shells. Confirm
  the new count against the test before calling it done.

## Acceptance checks

- **Every reused id exists.** Confirm each of the 8 ids is present in its source fragment (done above on
  2026-10-28; re-confirm at build time with a grep over the fragments).
- `ruby scripts/validate_scenario.rb scenarios/awareness_core_17_annual_2027_defend/scenario.json.erb
  --strict-social --no-graph --skip-ink` passes with **no new engine packet**. Specifically: the
  `defendOnly` stage order `["brief","defend","debrief"]` is allowed by `STAGES_BY_VARIANT`; the 8-item
  set is within `EPISODE_MESSAGES = (4..8)`; `attack_checks` does not run (not `full?`); the id ends
  `_defend` and the prefix is `episode_core_17_annual_2027_defend_defend_`; the done global
  `episode_core_17_annual_2027_defend_defend_done` is declared and gates the conclusion aim; watch for
  duplicate message ids (the source ids are unique across sets, so a verbatim copy stays unique).
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` stays green, including
  the rule-of-thumb test.
- A bridge run: the mixed run plays all 8 items with the right verdicts offered per kind (page has
  no Verify; call and voicemail do), the debrief shows a card per item and the team-protected tally,
  and the objective concludes on the done global. One bridge at a time on :3001.
- Confirm the two reshaped E3 call messages render and score (the flags map correctly from the source
  calls' `tells`).

## Do not

- Do not try to run five defend sets in sequence; the runner runs one set, so assemble one combined
  set of 8 messages.
- Do not exceed 8 messages (the `EPISODE_MESSAGES` cap) or ship it as `variant: "full"` (a full
  episode needs an attack block, which this has none); it is `defendOnly`.
- Do not add a `defend.calls` key; the E3 calls are reshaped into `messages` as data.
- Do not change any reused item's `truth`, flags or feedback; copy them exactly so the measurement
  matches the year's episodes.
- Do not set a default pass mark (`passPercent: 0`).
- Do not edit the source fragments or their shells.

## Stop and ask if

- The reshape of E3's calls is unwanted and the user prefers drawing the voice channel only from E7's
  voicemails (dropping the E3 calls, and finding a different mirror pair): that is a valid lighter mix;
  confirm.
- The user wants more than 8 items in one sitting: that needs an engine change to lift the
  `EPISODE_MESSAGES` cap (a new packet), which the 8-message design rules out; confirm before raising it.
- The user wants the later extensions (single-day narrative, chain view, private year profile, team
  event): those are proposed, later, and need new engine and art (`core_17` game_design "Proposed,
  later extensions"); not this brief.
