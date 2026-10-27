# 10 WP-11: check forms for the new topics (E8 to E17)

## Goal

Add pre and post check coverage for the ten new episodes (E8 to E17) without touching the six
built role check forms. Leave `finance`, `hr`, `helpdesk`, `executive`, `general` and `mobile`
exactly as they are: they are the measured baseline (`WRITER_BRIEF.md` "What the user decided",
`awareness/CHECK_PARITY_AUDIT.md`). Build the new coverage as **two new topic check pairs** that
reuse the built shell machinery.

## Read first (exact paths)

- `planning_notes/phishing_and_social_engineering/awareness/CHECK_PARITY_AUDIT.md` (the whole file:
  item count, phish count, flag multiset, disjoint phish slots, B1 permute fix).
- `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` section 6 (the built
  finance forms A/B and the per-form counts) and section 3 (cast per company).
- `planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py` (the generator;
  `check()`, `clean_set()`, `PERMUTE`, `host_npc()`, `scenario()`, `CHECK_LINES`, the `EPISODES`
  config). This is the template to copy.
- `planning_notes/phishing_and_social_engineering/awareness/e3/defend.json` and
  `awareness/e5/defend.json` (a built form fragment pair: `helpdesk_form_a`/`_b`,
  `general_form_a`/`_b`, with `_formPairing`, `perFlagNote`, `whyFine`, `flagAlternatives`).
- A built shell, read in full: `scenarios/awareness_pre_general_ab/scenario.json.erb` and
  `scenarios/awareness_post_general_ab/scenario.json.erb` (the pre export block, the post
  `importGlobals` block with `pre_check_completed`, `awarenessEpisode`, the `training_room`).
- `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` section 2 (the
  factor library and the channel-tell library: the exact scored flag ids you may use).
- `public/break_escape/js/minigames/inbox-triage/triage-flags.js` (which tells are offered per card
  kind: `KIND_TELL_EXCLUDE`; a scenario-local tell is never filtered) and
  `.../triage-kinds.js` (card kinds: `email`, `playerSent`, `sms`, `voicemail`, `qr`, `page`,
  `call`, `push`; call verdicts need Verify on).
- `planning_notes/security_awareness_course/TODO.md` section 2 (which modules each episode teaches)
  and the episode-to-module map repeated below.

## Depends on

- The E8 to E17 episode briefs (01 to 09 in this folder) for the topic wording, the brand companies
  and the cast each episode introduces. This brief does **not** wait on them: the items below are
  self-contained and cite the module `concepts.md` section each one teaches. Where an episode brief
  later names a different sender or company for the same topic, align to it.
- Carrholme Services must be in `BRAND_SET.md` before the `data_conduct` pair ships, because its
  form is set at Carrholme (the E11 company). That brand-set addition and its room are E11's work
  (`TODO.md` section 1). If Carrholme is not ready, the fallback is to set `data_conduct` at
  Quayholt Insurance (see "Stop and ask if").
- No engine packet is required. Every scored flag below is an existing id in the `00` library. If a
  later author wants a dedicated tell (for example a "need to know" or "remote access" chip), that
  is a `02_ENGINE_WORK.md` addition to the shared library in `systems/phish-rules.js`; this brief
  avoids it.

## Owner model

Content writing and review: `opus48`. The generator edit and the shell regen are mechanical and can
go to general-purpose or Sonnet, but the forms themselves (items, flags, feedback) are
phishing/social-engineering content and go to `opus48`.

## The episode-to-module map (for reference)

| Episode | Teaches (module) | Company |
|---|---|---|
| E8 after the click | core_04 (and core_01 LO6) | Quayholt |
| E9 passwords and password managers | core_03 | Tarrowby |
| E10 fake downloads, "verify you are human" pages | core_08, core_07 | Quayholt |
| E11 misdirected and overshared data | core_05, core_06 | Carrholme |
| E12 the visitor and the tailgater | core_10 | Merrin & Sallow |
| E13 the AI assistant | core_15 | Brightwell |
| E14 social media and oversharing | core_12 | (module company) |
| E15 removable media, cloud, shadow IT | core_13 | (module company) |
| E16 insider risk | core_14 | (module company) |
| E17 acceptable use | core_16 | (module company) |

## Recommendation: two topic pairs, not one per episode

The `WRITER_BRIEF.md` offers two shapes: a small number of topic pairs, or one pair per episode.
**Build two topic pairs.** Reasons:

- Each "pair" is one new role in the built machinery: two forms (A and B), reused across four shells
  (`pre_*_ab`, `post_*_ab`, `pre_*_ba`, `post_*_ba`). Two pairs is 8 new shells and 2 new fragments.
  One pair per episode is ten roles, 40 shells and 20 forms, each a 10-item form standing behind a
  6-item episode: far more build and more measurement surface to keep matched, for no extra learning.
- The built pattern is a small set of broad role forms (`general`, `mobile` already carry several
  core topics each). Two topic forms extend that pattern; ten narrow forms break it.
- The measurement claim is the pre/post change on matched parallel items. Fewer, well-matched forms
  are easier to keep parallel (the audit's whole method is per-form parity), so two pairs protect the
  claim better than ten.

The two pairs:

1. **`general_v2`** ("everyday threats, part two") at **Quayholt Insurance**, Verify **off** (as the
   built `general` form is). Covers the message-triage-friendly new topics: E8 reporting loop
   (core_04), E9 passwords and MFA (core_03), E10 downloads and fake pages (core_08/core_07), E13 AI
   and deepfakes (core_15), E15 shadow IT and removable media (core_13), with one physical-pretext
   item for E12 (core_10).
2. **`data_conduct`** ("data and conduct") at **Carrholme Services**, Verify **on** (the topic is
   "check before you act"). Covers the judgement topics: E11 data protection and handling
   (core_05/core_06), E14 social media and oversharing (core_12), E16 insider risk (core_14), E17
   acceptable use (core_16).

E12 (physical security) is a person-chat, in-world episode; a message inbox is a poor instrument for
tailgating and badges, so E12's main measurement stays in its own episode. One E12-flavoured pretext
item (a visitor or courier talking their way to access by message) sits in `general_v2`; the rest of
E12 is not checked by a form, and that is deliberate.

## Files to create or change

- Create `planning_notes/phishing_and_social_engineering/awareness/checks_v2/general_v2.json` (a
  defend fragment holding `general_v2_form_a`, `general_v2_form_b` and a minimal `awarenessEpisode`
  block with role/company/brand/scope for the generator to read).
- Create `planning_notes/phishing_and_social_engineering/awareness/checks_v2/data_conduct.json`
  (same shape, `data_conduct_form_a`/`_b`, set at Carrholme).
- Create `planning_notes/phishing_and_social_engineering/awareness/gen_checks_v2_shells.py`, a copy
  of `gen_e3_e5_shells.py` cut down to the `check()` path only (no `defend_only()`), with two new
  `EPISODES`-style entries, `PERMUTE` entries for the four new forms, `HOSTS` and `CHECK_LINES` for
  the new hosts.
- The generator writes eight new shell folders under `scenarios/`:
  `awareness_{pre,post}_general_v2_{ab,ba}` and `awareness_{pre,post}_data_conduct_{ab,ba}`.

Do not touch the 24 built shells, the four built generators, `BRAND_SET.md` section 6, or
`awareness_deploy.py`.

## Shell specification (so a Sonnet agent builds them without guessing)

Everything here mirrors the built forms. Read a built pre and post shell alongside this.

### Form size and split

- **10 items per form.** 4 phish, 6 genuine (as `general`, `hr`, `helpdesk` and `mobile`; not the
  executive 5/5). For `data_conduct`, "phish" means "an unsafe request you should report, refuse,
  verify or deny"; "genuine" means "fine, act normally". The `awareness` profile scores a genuine
  item the same whether trusted or reported, so the four unsafe items are the ones that discriminate.

### Matched A/B items with difficulty

- Item *n* in form A matches item *n* in form B on **kind, phish-or-genuine, the scored flag
  multiset and difficulty**; only the lure content differs (different sender, subject, company
  detail), so B cannot be answered from memory of A. This is the built rule (`BRAND_SET.md` section
  6, `CHECK_PARITY_AUDIT.md` "Method").
- Difficulty is the author's rating, same scale as the built forms: **easy** (one plain tell or
  nothing odd), **medium** (the tell needs one look at the address, link or request), **hard** (the
  From looks right and the tell sits in the reply-to or the detail). Target mix per form: **5 easy,
  4 medium, 1 hard**, identical in A and B (matches the built forms).

### Disjoint phish slots and the AB/BA shells

- Author each form in teaching order first (a likely miss followed by a similar item), then set a
  `PERMUTE` array per form in the generator so the phish land in **disjoint ordinal slots** across A
  and B: no ordinal slot is a phish in both forms of a pair, and no slot carries the same flag
  signature in both (`CHECK_PARITY_AUDIT.md` B1, and the `PERMUTE` comment in `gen_e3_e5_shells.py`).
  A pure reorder changes no counts and no flag multiset, so parity holds. Example arrays
  (`new[i] = old[order[i]]`, lists of 10 indices), to be checked for disjointness by the audit step:
  - `general_v2_form_a`: `[0, 1, 3, 2, 4, 5, 6, 7, 8, 9]` is **not** disjoint; use e.g.
    `[2, 0, 1, 4, 3, 6, 5, 9, 7, 8]` for A and `[7, 3, 0, 6, 1, 8, 5, 2, 9, 4]` for B, then run the
    disjointness check and adjust until no slot is a phish in both.
- Each pair becomes four shells, exactly as the built roles (`gen_e3_e5_shells.py` `check()` and
  `main()`): `pre_*_ab` carries form A at stage `pre`; `post_*_ab` carries form B at stage `post`;
  `pre_*_ba` carries form B at stage `pre`; `post_*_ba` carries form A at stage `post`. The form
  selection map in `check()` is `{('ab','pre'): fa, ('ab','post'): fb, ('ba','pre'): fb,
  ('ba','post'): fa}`. Copy it unchanged.

### Verify settings

The scenario files are the source of truth, and the user ruled they are right (`BRAND_SET.md`
section 6, corrected note; four role forms have Verify on: finance, executive, helpdesk, mobile).

- **`general_v2`: Verify off** (`"verifyVerdict": false`, and do not set it, matching `general` and
  `hr`). It carries no call or voicemail items, so no verdict needs the "ring back" action.
- **`data_conduct`: Verify on** (`"verifyVerdict": true`), because its lesson is "check back before
  you act" and it carries a call item (item 4). A and B must match, so Verify is on in both; the
  pre/post comparison still compares like with like (same verdicts offered in both forms of a pair),
  which is the only parity requirement for Verify (`BRAND_SET.md` section 6 corrected note).

Both forms: `"scoringProfile": "awareness"`, `"feedbackMode": "end"`, `"headerPanel": "collapsed"`,
`"glossary": "closed"`, `"outcome": { "setGlobalPrefix": "triage_{stage}_", "passPercent": 0 }`.
Set `channelTells` to the scored flags the form uses (see item tables).

### Pre/post export and import globals

Identical to the built checks (`gen_e3_e5_shells.py` `check()`, and
`scenarios/awareness_post_general_ab/scenario.json.erb`). The global names are reused across every
role, which is safe because each post shell imports from a named pre mission; a learner does one
pair's pre+post in a session.

- `globalVariables` per shell: `episode_<ep_id>_state: {}`, `se_awareness_records: []`,
  `triage_<stage>_percent: 0`, `triage_<stage>_reportRate: 0`, `triage_<stage>_done: false`,
  `triage_<stage>_pass: false`, where `<stage>` is `pre` or `post` and `<ep_id>` is
  `<stage>_<word>_<pair>` (e.g. `pre_general_v2_ab`).
- **Pre shells** carry `"exportGlobals": ["triage_pre_percent", "triage_pre_reportRate",
  "triage_pre_done"]`.
- **Post shells** carry `importGlobals` from the matching pre mission
  (`awareness_pre_<word>_<pair>`): the three `triage_pre_*` vars `as` themselves with defaults, plus
  `{ "from": "<pre mission>", "completed": "pre_check_completed" }`. The post form's triage set adds
  `"comparison": { "requireGlobal": "pre_check_completed" }` (set by `clean_set(..., comparison=...)`).
  Imported names are **not** redeclared in `globalVariables` (the validator rejects the collision;
  `gen_e3_e5_shells.py` line note).

### Durations

`durationTargetMin: 9` in `awarenessEpisode`, and `estimated_duration_minutes: 9` in `mission.json`
(the built checks are 9; finance is 8 to 10). A 10-item `end`-feedback form runs about 9 minutes.

### Hosts

New host NPCs, placeholder sprite keys until PixelLab (as the built checks did; see
`gen_e3_e5_shells.py` `HOSTS` and the P7-Z3 notes). One host for the AB pair, another for the BA
pair, each with pre and post lines (`CHECK_LINES`), drawn from `BRAND_SET.md` cast:

- `general_v2` at Quayholt: AB host **Anjali Rao** (information security analyst, already the
  general AB host); BA host **Darren Price** (service desk lead). Both are in `BRAND_SET.md` section
  3. Reuse their existing sprite keys from `gen_e3_e5_shells.py`.
- `data_conduct` at Carrholme Services: AB and BA hosts are two Carrholme cast members that the E11
  brief adds to `BRAND_SET.md` (for example a data protection officer and an information security
  lead). Name them in the E11 brand-set addition first; if Carrholme is deferred, host at Quayholt
  with Anjali Rao and Sofia Marchetti (see "Stop and ask if").

Host NPC shape, ink and the `eventMappings` that complete `finish_check` on `triage_<stage>_done`:
copy `host_npc()` and `ink_source()` from `gen_e3_e5_shells.py` unchanged. The room is the company's
training room via `training_room.room_fields(company)`; no new room art.

### Mission titles, names and collection

Follow the built strings exactly (`gen_e3_e5_shells.py` `check()`):

- `scenario_name`: `"<check name>: before (AB)"` / `"<check name>: after (AB)"` and the BA variants.
  Check name: `general_v2` -> "Everyday threats check (part two)"; `data_conduct` -> "Data and
  conduct check".
- `mission.json` `display_name`: `"Awareness check: <word>, before (AB)"` etc.
- `mission.json`: `difficulty_level: 1`, `scoring: "completion"`, `secgen_scenario: null`,
  `collection: "training"`, `ui_theme: "general"`, `estimated_duration_minutes: 9`, and a `cybok`
  block (Human Factors KA; see the built checks for the shape).
- Keep the organiser note the built checks carry ("each role's check tests the channel that role
  meets ... only the learner's primary-role check is recorded"), adapting "channel" to "topics".

### Which seeded course each form joins

**Neither seeded course.** The two seeded Hacktivity courses carry *episodes*: one the defend-only
episodes, one both versions (`phishing_and_social_engineering/FUN_DECISIONS.md` q_aw7). None of the
24 built check shells is a member of those courses; checks are standalone missions in the `training`
collection that organisers place around the episodes (the learner's role pre-check first, the post
after). The new `general_v2` and `data_conduct` shells follow the same rule: `collection: "training"`,
not added to either seeded course. (If the user later wants checks bundled into a course, that is a
separate Hacktivity decision; flag it, do not do it here.)

## Item list: `general_v2` (Quayholt, Verify off)

Author in teaching order below; the generator's `PERMUTE` then disjoints the phish slots. Senders
end `.example`; look-alikes use a swapped character or an added word (`BRAND_SET.md` section 1). Each
phish item needs `perFlagNote` per scored flag and `ifTrusted` and `reportReply`; each genuine item
needs `whyFine` (default plus any per-flag key). Quote the shapes from `e5/defend.json` and
`e3/defend.json`.

| n | kind | from (archetype) | subject / line | phish | scored flags | verdict | difficulty | A id / B id | source concept (`concepts.md` section) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | email | Quayholt security team, `quayholt.example` | "Thanks for your report, here's what we did" / "Your report has been actioned" | no | - | Trust | easy | `gva_report_thanks` / `gvb_report_closed` | core_04 "What happens after a report" |
| 2 | page | a page opened from a link | a "Verify you are human" / "update required" page on a look-alike host with a padlock | yes | `lookalike_domain`, `padlock_myth` | Report | medium | `gva_verify_human` (host `quayho1t-check.example`) / `gvb_flash_update` (host `quayholt-update.example`) | core_08 "Pages that try to make you do things to your computer", "Reading the address" |
| 3 | email | Quayholt IT, `quayholt.example` | "We've turned on 2-step verification: how it works" / "Your new password manager is ready" | no | - | Trust | easy | `gva_mfa_rollout` / `gvb_passmgr_rollout` | core_03 "MFA, or 2-step verification", "Password managers" |
| 4 | push | Quayholt Sign-in | an unrequested MFA prompt at an odd hour, from an unknown location | yes | `unrequested_mfa_push` | Deny and report | easy | `gva_push_0238` (02:38) / `gvb_push_sunday` (Sun 23:10) | core_03 "Prompt floods and the fake IT message" |
| 5 | email | Quayholt IT, `quayholt.example`, honest link | a genuine software-update notice with a link to the real intranet update page | no | - (whyFine on `linkCredible`) | Trust | medium | `gva_update_tuesday` / `gvb_patch_notice` | core_07 "Updates", core_08 "Browser warnings" |
| 6 | email | "exec office" / "new tool" on a look-alike or freemail | "Message from the CEO: watch this short video" (deepfake link) / "Your new AI assistant: sign in with your Quayholt account" | yes | `senderTrust`, `linkCredible` | Report | medium | `gva_ceo_video` / `gvb_ai_assistant` | core_15 "Deepfakes: cloned voices and fake video", "AI-written phishing" |
| 7 | email | Quayholt IT, `quayholt.example` | "Need to move a big file or use a new tool? Ask us, here's the approved way" | no | - | Trust | easy | `gva_approved_tools` / `gvb_cloud_howto` | core_13 "Asking IT: the quicker yes" |
| 8 | email | a name that looks internal, From right, reply-to on freemail | "Quick workaround: run the client file through this free converter, don't wait for IT" / "Our engineer posted you a USB, plug it in and run setup" | yes | `senderTrust`, `reply_to_differs` | Report | hard | `gva_free_converter` / `gvb_usb_courier` | core_13 "Free online tools and file transfer sites", "Removable media"; B also core_10 "Visitors ... with a story" |
| 9 | email | a known colleague, `quayholt.example` | "Please confirm you've read the new starter guide" / a genuine staff survey with an honest intranet link | no | - | Trust | medium | `gva_guide_ack` / `gvb_survey_real` | core_04 "How to report", core_16 "Acknowledging a policy" |
| 10 | email | Quayholt Facilities, `quayholt.example` | "Contractors on site Thursday: badged and escorted at reception" / "Fire drill Friday" | no | - | Trust | easy | `gva_contractors` / `gvb_fire_drill` | core_10 "Visitors, contractors and people with a story" |

Phish at slots 2, 4, 6, 8 (before permute). Per-form flag multiset: `lookalike_domain` 1,
`padlock_myth` 1, `unrequested_mfa_push` 1, `senderTrust` 2, `linkCredible` 1, `reply_to_differs` 1
(7 scored flags). `channelTells`: `["lookalike_domain", "padlock_myth", "unrequested_mfa_push",
"senderTrust", "linkCredible", "reply_to_differs"]`.

Note on card kinds: item 2 is a `page` (verdicts Trust/Report/Delete; `padlock_myth` is offered only
on a page, `triage-flags.js` `KIND_TELL_EXCLUDE`). Item 4 is a `push` (verdicts Approve/Deny/Deny and
report; scored only on `unrequested_mfa_push`). No calls or voicemails, so Verify stays off.

## Item list: `data_conduct` (Carrholme, Verify on)

Same rules. "phish" = an unsafe request to report, verify, refuse or deny. Item 4 is a `call` so the
Verify/"ring back" verdict is used; the rest are emails. Scored flags stay within the `00` library;
data-handling judgement maps onto `pretextRelevant` ("no good reason I'd be asked this"),
`senderTrust`, `secrecy_or_bypass` and `borrowed_authority`. If the user wants a dedicated "need to
know" or "overshare" chip, that is a later `02_ENGINE_WORK.md` library addition, not this brief.

| n | kind | from (archetype) | subject / line | phish | scored flags | verdict | difficulty | A id / B id | source concept (`concepts.md` section) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | email | a known colleague, Carrholme domain | shares a folder the right way through the approved system | no | - | Trust | easy | `dca_folder_share` / `dcb_portal_share` | core_06 "Sharing links and folders" |
| 2 | email | an outside "auditor" / "IT vendor" | "Reply with the full customer list / staff records to this address for the audit" | yes | `senderTrust`, `pretextRelevant` | Report | medium | `dca_customer_list` / `dcb_hr_records` | core_05 "Need to know", "Personal data breaches" |
| 3 | email | a known colleague, Carrholme domain, legitimate data ask within need-to-know | "Can you send me the team's figures for the review?" (genuine, routed right) | no | - (whyFine on `pretextRelevant`) | Trust / Verify | medium | `dca_team_report` / `dcb_payroll_file` | core_06 "Need to know" |
| 4 | call | a "leaver" or a colleague on a mobile | "Use your login to pull my old records / approve this under your account, I've lost access" | yes | `vish_callback_pressure`, `secrecy_or_bypass` | Ring back / Refuse | easy | `dca_login_favour` / `dcb_approve_under_you` | core_14 "Your login is you", "Leavers and data" |
| 5 | email | Carrholme comms team | "Here's what's approved to share about the new office" (genuine) | no | - | Trust | easy | `dca_comms_ok` / `dcb_press_line` | core_12 "Who speaks for the organisation" |
| 6 | email | a "recruiter" / fake profile on freemail | asks for the org chart, who does what, when the boss is away | yes | `senderTrust`, `pretextRelevant` | Report | medium | `dca_recruiter_probe` / `dcb_journalist_probe` | core_12 "Fake profiles and recruiters", "What attackers learn from public posts" |
| 7 | email | Carrholme, genuine | "New acceptable-use policy: read and acknowledge" / "Annual data training due" | no | - | Trust | easy | `dca_aup_reminder` / `dcb_training_reminder` | core_16 "Acknowledging a policy" |
| 8 | email | a name that looks internal, From right, reply-to differs | "Send it from your personal email to get it out quickly, don't wait for IT / don't flag it" | yes | `senderTrust`, `reply_to_differs`, `secrecy_or_bypass` | Report | hard | `dca_personal_email_push` / `dcb_skip_dlp` | core_16 "Personal use", "If the rules are broken"; core_13 "Personal email and personal cloud storage" |
| 9 | email | the learner's manager, Carrholme domain | asks for a report that is within need-to-know and routed normally (genuine, could be mistaken for a data risk) | no | - (whyFine on `pretextRelevant`) | Trust | medium | `dca_manager_report` / `dcb_access_review` | core_14 "Unusual isn't wrong: supporting colleagues", core_06 "Need to know" |
| 10 | email | Carrholme DPO / records team | a subject-access-request acknowledgement routed correctly | no | - | Trust | easy | `dca_sar_routed` / `dcb_retention_notice` | core_05 "People's rights, and recognising a request" |

Phish at slots 2, 4, 6, 8 (before permute). Per-form flag multiset: `senderTrust` 3,
`pretextRelevant` 2, `secrecy_or_bypass` 2, `vish_callback_pressure` 1, `reply_to_differs` 1 (9
scored flags; counts identical in A and B). `channelTells`: `["senderTrust", "pretextRelevant",
"secrecy_or_bypass", "vish_callback_pressure", "reply_to_differs"]`. Item 4 is a `call`: its verdicts
are Comply/Ring back/Escalate/Refuse, so Verify must be on (it is).

## Parity audit steps (run before the forms are called done)

Apply `CHECK_PARITY_AUDIT.md`'s method to each new pair:

1. **Counts.** Confirm each form has 10 items, 4 phish, 6 genuine; confirm A and B share the full
   scored-flag multiset (the counts above) and the difficulty mix (5 easy, 4 medium, 1 hard).
2. **Disjoint phish slots.** After `PERMUTE`, confirm no ordinal slot is a phish in both A and B, and
   no slot carries the same flag signature in both forms (B1). Adjust the `PERMUTE` arrays until this
   holds; a reorder changes no counts.
3. **No message reuse.** No sender address plus subject appears in both forms of a pair (and none
   appears in a built form or in an episode defend set). Reuse a *named person* only on one side of
   the phish/genuine line within a pair (audit m7): do not make a name the fraudster in A and genuine
   in B.
4. **Matched register.** For each phish slot, A and B are the same archetype at the same hardness
   (audit M1/M2: avoid one form using a cartoon trope while the other is a plausible ask).
5. **Scored tells are taught.** Every scored flag on an item is surfaced by the episode whose topic
   the item draws from (audit M3). Each scored flag is a real `00` library id (section 2). A
   scenario-local tell, if any, is declared with a `flagChips` label; none is used here.
6. **Feedback parity.** Every scored flag has a parallel `perFlagNote` in A and B; every genuine item
   has a `whyFine` (default plus any per-flag key), parallel between forms.
7. **Validator and tests.** Run, with the new fragments and shells in place:
   - `ruby scripts/validate_scenario.rb <each new erb> --strict-social --no-graph --skip-ink`
     (all 8 new shells pass).
   - the balance lint in `scripts/validate_social/triage.rb` (`balance`) passes on each new pair.
   - `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` stays green.
   - the rule-of-thumb test `test/js/social-awareness-rule-of-thumb.test.mjs` passes (the shells
     carry the shared rule of thumb via `awareness_deploy.awareness_block()`; the generator must call
     it, as `gen_e3_e5_shells.py` `scenario()` does).
   - A regen into a scratch folder is byte-identical to the committed shells on a no-change re-run
     (HANDOVER.md section 4 "Never run a generator into the repo").

## Do not

- Do not edit the six built role forms or their fragments, shells or `BRAND_SET.md` section 6.
- Do not reuse the global names in a way that drops the explicit `importGlobals.from`; the post shell
  must import from its own pre mission by name.
- Do not invent flag ids. Use the `00` section 2 library. If a topic needs a new reusable tell, stop
  and point to `02_ENGINE_WORK.md`.
- Do not run the generator into the repo; regen into a scratch folder, confirm no-change parity,
  then copy only changed files (HANDOVER.md section 4).
- Do not add the new checks to either seeded Hacktivity course.
- Do not make effectiveness claims in any copy.

## Stop and ask if

- Carrholme Services is not yet in `BRAND_SET.md` when `data_conduct` is built. Fallback (confirm
  with the orchestrator): set `data_conduct` at Quayholt Insurance with hosts Anjali Rao (AB) and
  Sofia Marchetti (BA), and move the E11-specific items to Quayholt framing. Flag that the form then
  shares a company with `general_v2`, which is acceptable (both are "all staff" forms) but should be
  revisited when Carrholme ships.
- The user prefers one pair per episode after all, or a different grouping (for example splitting
  E9/E10 into their own pair). The two-pair grouping is a default; the grouping is the user's to set.
- A topic genuinely needs a card kind the engine does not have (there is none here: every item is
  email, page, push or call). If one appears, stop and point to the engine packet.
