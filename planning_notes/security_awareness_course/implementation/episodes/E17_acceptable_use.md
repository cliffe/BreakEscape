# E17 — Acceptable use and your responsibilities

Buildable by a fresh Sonnet implementer from this spec plus "Read first". All companies, people and
domains are fictional; `.example` domains only. UK spelling; "cyber security" two words; no em or en
dashes.

E17 is **defend-only by the user's decision**: acceptable use has no single attacker, so it ships only
the defend-only shape, with no attack half, no consequence flip and no flip stage. It does **not** use
ENG-04. Section 13 explains how "ships both versions" is honoured when the full version equals the
defend-only version.

## 1. Goal and module(s)

Teach **core_16 (acceptable use and your responsibilities)**: the small print has good reasons; three
answers (Allowed, Not allowed, Ask first), and "Ask first" is never the wrong answer; your five
responsibilities; work systems are monitored within rules, and messages are records; read before you
acknowledge; and if a rule gets in your way, say so rather than work round it. Target length about 15
minutes. Shape: **defend-only** (brief, defend, debrief), by user decision.

Source of truth: `modules/core_16_acceptable_use_and_your_responsibilities/concepts.md`. Shape and the
"can I?" card bank from `.../game_design.md` ("Small Print").

## 2. Read first (exact paths)

- `modules/core_16_acceptable_use_and_your_responsibilities/concepts.md` (source of truth),
  `.../game_design.md` (the full card bank S01 to S22 is there), `.../assessment.md`.
- `designs/00_data_contract.md` sections 2 (channel tells) and 11 (`awarenessEpisode`, and the
  defend-only shape and `_defendOnly` string split).
- `designs/11_awareness_product_episodes.md` sections 3.1 (defend-only variant), 4.1 (scoring), 5.1, the
  "Built note".
- `awareness/BRAND_SET.md`, the Tarrowby Logistics cast (the chosen company; see section 5).
- Nearest built episodes: the defend-only shells `scenarios/awareness_e2_cv_lures_defend/` and
  `awareness_e6_texts_and_qr_defend/` (a defend-only shell with no attack), and `awareness/e6/defend.json`
  / `awareness/e4/defend.json` (the `triageSets` item shape and the `awarenessEpisode` block).
- Engine: `episode-runner/` (`debrief-view.js`; the runner drops the attack stages for `defendOnly`),
  `systems/episode-starter.js`, `awareness-measure.js`, the inbox-triage defender, the organisation
  answer key (organisation profile).
- Validators as E11 section 2.

## 3. Depends on

- **Built, no new packet:** the inbox-triage defender under the `awareness` profile (the scored six-item
  set), the `Verify` verdict, the organisation answer key (the "can I?" answers, built on the
  organisation profile), the measurement store, the debrief view, the shared rule of thumb. Not ENG-04:
  E17 has no `mistake` stage and no flip.
- **Needs a new ENG packet (small):** the **three-way "sort" surface** for the "can I?" cards (Allowed /
  Not allowed / Ask first against the organisation answer key, with the reason on screen and **locked**
  cards that cannot be changed). `game_design.md` lists it as "new (small)". Fold into E17's engine work
  or raise it. Note core_12/E14's "Post or Not?" feed drill is a sibling three-way sort; if ENG builds
  one reusable three-way sort surface it serves both.
- **ENG-09:** the new "acceptable use" topic check forms (section 14). Do not edit the six built role
  forms.

## 4. Owner models

Content to `opus48`; engine (the sort surface, the answer key wiring, the check forms) to general-purpose
or Sonnet.

## 5. Company, room and host

- **Company: Tarrowby Logistics** (an existing brand-set company; built `tarrowby.example`, look-alikes
  `tarrowby-careers.example`, `tarrowbey.example`, the E6 additions `tarrowby-parking`, `-charging`,
  `-wifi`; wordmark `TARROWBY`, accent `#3b5b8c`).
  - **Why Tarrowby instead of the proposed Marrowdale (to save art, as the task asks):** `core_16`
    proposes a new company, Marrowdale Facilities, which would need a new `BRAND_SET.md` entry, a new
    room type and new cast art, all held behind the PixelLab queue. Tarrowby is already built: it has the
    `room_aw_tarrowby` room type, a wordmark, an accent and a full cast, and it fits `core_16`'s own
    description of the target firm ("a facilities firm with a mixed, non-technical workforce"): Tarrowby
    is a haulier and warehousing firm with drivers, warehouse and office staff. Reusing it stands E17 up
    with no new art. Marrowdale stays a proposal in `core_16/game_design.md`; E17 does not add it to the
    brand set.
- **Room: `room_aw_tarrowby`** (built). The sort surface and the triage are overlays; no new room.
- **Host: Nilesh Solanki**, IT service desk analyst (`nilesh.solanki@tarrowby.example`), built Tarrowby
  cast. He gives the reason behind each answer and carries the conclusion `eventMappings`. The service
  desk is the natural "ask first" voice for acceptable use. **Deliberate reuse with E15** (also Tarrowby,
  also Nilesh): it saves art, which is the point; if E15 and E17 ship in one course the same host appears
  twice, which is realistic (one firm, one service desk). Flagged in section 20.
- No new cast is required, so no new `BRAND_SET.md` entry. If a second voice is wanted for the two
  worked-example colleagues in `game_design.md` (one who guesses "allowed" for everything, one who
  guesses "not allowed" for anything with a computer in it), reuse built Tarrowby cast (for example
  Colin Mather and Shauna Lofthouse); do not invent new names.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | What happens |
|-------|---------|--------------|
| brief | 1 | Nilesh welcomes, reads the scope and the three answers |
| defend | 11 to 12 | The "can I?" three-way sort (the signature activity) and the scored six-item triage set (section 11) |
| debrief | 1 to 2 | Per-item cards, the three answers and five responsibilities panel, the habit to keep, the Monday card, the no-blame line (section 12); then where the policy is acknowledged |

There is no attack stage and no flip, so the whole 15 minutes sits in brief, defend and debrief.

## 7. Stages (runner stage ids)

Only one shape exists (defend-only): `"stages": ["brief", "defend", "debrief"]`. The "can I?" sort and
the scored triage set both run inside the `defend` stage; they are not separate stage ids.

## 8. Brief and scope note (host draft lines)

- **Scope note** (`scopeNote`): "Authorised exercise at Tarrowby Logistics, a fictional firm. Everyday
  'can I?' moments, answered from our own rules. Ask first is never the wrong answer."
- **Brief** (`strings.brief`): "You're on an authorised exercise at Tarrowby Logistics, a fictional firm.
  Three answers: Allowed, Not allowed, Ask first. You'll sort a set of everyday 'can I?' moments against
  the firm's own rules, with the reason on screen, and handle a few messages that arrive in the inbox.
  When you're not sure, ask first."
- **Host welcome (draft):** "Nilesh, service desk. Every rule here has a 'because', and I'll give you the
  because. Three answers: Allowed, Not allowed, Ask first. Ask first is never the wrong answer, and the
  software portal usually answers the same day."

Because E17 is defend-only only, `strings.brief` and `scopeNote` are the defend-only text. `_defendOnly`
(if the schema requires it present) carries the same two strings; there are no flip strings.

## 9. Attack half, or the consequence stage

**None.** E17 is defend-only by user decision: no attack, no `mistake` stage, no flip. This is the only
episode in the set that ships the defend-only shape alone.

## 10. Flip

**None** (see section 9).

## 11. Defend set

Two activities in the `defend` stage.

### 11a. The "can I?" three-way sort (the signature activity; new surface)

Everyday situations sorted **Allowed / Not allowed / Ask first** against the organisation answer key,
with the reason on screen. The card bank is `core_16/game_design.md`'s S01 to S22 (reproduced below in
full for the implementer). The organisation confirms or edits each card; **cards it has not confirmed are
never drawn**; **locked cards (S04, S16, S17, S18, S19, S21, S22) cannot be changed**, and no
organisation can make any of them "Allowed" or make reporting optional. Each play draws at least one of
each answer; when the policy changes, cards linked to the changed sections are drawn first with a "new"
badge. Scored by the organisation answer key (not the `awareness` profile); "Ask first" always scores at
least a point, because punishing caution stops people asking. Cards are everyday situations, never
"what does section 4.3 say"; the section is a pointer, not asked for.

Full card bank (from `core_16/game_design.md`; Tarrowby defaults, each `id | situation | default answer
| reason on screen | locked`):

- S01 | Stream the football on your work laptop at lunch | Allowed | Reasonable personal use in your own time is fine |
- S02 | Check your own bank account on the work laptop at lunch | Allowed | Personal use in your own time; type the bank's address yourself |
- S03 | Install a free PDF editor you found online | Ask first (service desk) | There's an approved one; unknown software can carry malware |
- S04 | Lend your badge to a colleague who left theirs at home | Not allowed | Everything done with your badge looks like you; reception issues day passes | Locked
- S05 | Use your work email to sign up to a personal shopping site | Not allowed | Work accounts are for work; if the shop leaks, your work address gets the scams |
- S06 | Forward a client file to your personal email to finish at home | Not allowed | It leaves the firm's protection; use approved remote access (core_13) |
- S07 | Post a photo of the team's new depot on social media | Allowed | As long as no screens, whiteboards or badges are in shot (core_12) |
- S08 | Use the company's AI assistant to summarise a public report | Allowed | It's approved, and public information is fine (core_15) |
- S09 | Paste a customer's complaint into a free public chatbot | Not allowed | Personal data to a firm we have no contract with; use the approved assistant without names (core_15) |
- S10 | Connect your own phone to the guest Wi-Fi | Allowed | That's what the guest network is for |
- S11 | Plug in a USB stick a supplier handed you at a fair | Not allowed | Hand it to IT to check (core_13) |
- S12 | Take your work laptop on holiday abroad | Ask first (manager, then service desk) | Some countries and some data need extra care (core_09) |
- S13 | Use the team chat to moan about a colleague | Not allowed | Messages are records and the colleague could read it; talk to your manager |
- S14 | Install a game on your work phone | Ask first (service desk) | Only apps from the company app store go on work devices |
- S15 | Set an out-of-office saying you're away for a fortnight | Allowed | Fine, but say less: your return date and who to contact, not where you are (core_12) |
- S16 | Log in as a colleague who's off sick, with their permission | Not allowed | It hides who did what; the service desk can give you access | Locked
- S17 | Read out the code from your phone to "IT" on a call | Not allowed | IT never asks for codes; hang up and ring the service desk (core_03) | Locked
- S18 | Turn off the antivirus because it slows your laptop | Not allowed | It's there to stop malware; ask the service desk to fix the slowness | Locked
- S19 | Look up a famous customer's address, just to see | Not allowed | Looking without a work reason can be a crime (Data Protection Act 2018, s.170) | Locked
- S20 | Use your own laptop for work while yours is repaired | Ask first (service desk) | Only through the remote desktop service |
- S21 | You think you've sent a file to the wrong customer | Report it | Reporting suspected incidents is a duty; the sooner the better (core_04) | Locked
- S22 | Tell a colleague your password to watch your inbox while you're off | Not allowed | Ask the service desk for shared access; your password is yours alone (core_03) | Locked

### 11b. The scored six-item triage set (awareness profile, with a mirror pair)

Six items on the built inbox-triage defender, `scoringProfile: "awareness"`, `verifyVerdict: true` (ask
the service desk is a real move), `feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary:
"closed"`. Set id `e17_acceptable_use_inbox`. `outcome.setGlobalPrefix:
"episode_e17_acceptable_use_defend_"`, `passPercent: 0`. `channelTells`: `["lookalike_domain",
"secrecy_or_bypass"]` plus the scenario-local tell `unapproved_tool`. This is the measured set, so E17
matches the other episodes' measurement (the brief's "about 6 defend items with a mirror pair"); it sits
alongside the "can I?" sort, which is the module's signature but is scored by the answer key, not the
awareness profile.

| # | Id | Kind / from | Subject or line | Tells and flags | Correct verdict | Reason text |
|---|----|-------------|-----------------|-----------------|-----------------|-------------|
| 1 | `e17_meeting_app` | email, a client contact | "Join our meeting, install this app first" with an install link | `unapproved_tool` | **Verify** (ask the service desk; suggest our own meeting tool) or **Report** | "A client meeting is fine, but installing an app you were sent is not: ask the service desk, or suggest our own meeting tool. Unknown software can carry malware. (The normal-looking phish half of the mirror pair.)" |
| 2 | `e17_data_lookup` | chat/email, a colleague | "Look up this contact's mobile in the system for a personal thing, would you?" | `secrecy_or_bypass` | **Verify** (decline, suggest another way) or **Report** | "Look only at data your job needs; a personal lookup has no work reason, and obtaining it can be an offence (Data Protection Act 2018, s.170). Decline and suggest another way." |
| 3 | `e17_shared_login` | email, a colleague off sick | "Log in as me to watch my inbox; you have my password" | `secrecy_or_bypass` | **Report** or **Verify** (ask the service desk for shared access) | "Your login is you; a shared password hides who did what and can breach access controls. Ask the service desk for proper shared access." |
| 4 | `e17_monitoring_notice` | email, the intranet, genuine | "What we monitor and why: email and web filtering, sign-in records, data leaving our systems" | none (genuine) | **Trust** | "It reads like a warning, but it's the firm telling you plainly what it checks and why, which is exactly what the rules require. Nothing to report. (The suspicious-looking genuine half of the mirror pair.)" |
| 5 | `e17_personal_use_ok` | email, HR, genuine | "Reminder: reasonable personal use of work kit in your own time is fine, within the policy" | none (genuine) | **Trust** | "A genuine, ordinary policy reminder. Reasonable personal use in your own time is allowed. Handle it." |
| 6 | `e17_free_tool` | email, "everyone uses this", a free online tool link | "Convert the file here, free, no install" | `unapproved_tool` | **Verify** (ask the service desk) or **Report** | "A free online tool hands the file to a provider we haven't checked; there's an approved way. Ask first, the service desk usually answers the same day." |

**Mirror pair (aw5):** item 1 (normal-looking unapproved-install lure, Verify/Report) and item 4
(suspicious-looking genuine monitoring notice, Trust).

## 12. Debrief cards

Built debrief view: per-item cards for the six triage items and the drawn "can I?" cards (the answer, the
reason and the policy section on screen, from the answer key); feedback on the genuine items (the
monitoring notice, the personal-use reminder, a genuinely fine personal-use case); the short panels on
**the three answers and five responsibilities** and on **monitoring and its limits**; the team-protected
tally; then

- **The habit to keep** (shared rule of thumb, verbatim): "When a message pressures you to move money,
  grant access, sign in or read back a code, stop and check it yourself through a route you already
  trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair
  thing to do." The debrief adds the plain line: "Not sure? Ask first. Made a mistake? Report it."
- **The "On Monday" card:** "Pick the one person you'd ask when you're unsure: the service desk for
  software and devices, the security team for anything suspicious, the DPO for personal data, your
  manager for how your team works." Report route from `slot:customer_report_route`.
- **The no-blame line** (`noBlameLine: true`): "Honest mistakes reported quickly are fixed, not punished.
  Deliberate misuse is different, and the policy says what happens. The difference is intent and
  openness."

Then the host points to where the policy is read and acknowledged (a later platform option, not built
here): the summary first, the full policy one click away, and "I have a question first" as prominent as
"I agree". No forced scrolling, no countdown, no pre-ticked box.

Because E17 has no flip, the no-blame line lives only in the debrief (there is no flip from which to move
it), and there is no `defendOnly` flip string.

## 13. Defend-only variant, and how "ships both versions" is honoured

The user's standing decision is that **every new episode ships a full version and a defend-only version,
and joins both seeded Hacktivity courses**. For E17 there is no attack half by design, so **the full
version equals the defend-only version**: both have `stages: ["brief","defend","debrief"]` and the same
`defend` activities. E17 is therefore shipped as **two shells with identical content**, differing only
in id, global prefix and the `variant` field:

- **Full shell:** id `e17_acceptable_use`, `variant: "full"`, set prefix
  `episode_e17_acceptable_use_defend_`. Listed in the **both-versions** seeded course as the full
  version.
- **Defend-only shell:** id `e17_acceptable_use_defend`, `variant: "defendOnly"`, set prefix
  `episode_e17_acceptable_use_defend_defend_` (the built double-suffix rule for an id ending `_defend`).
  Listed in the **defend-only** seeded course.

Both use the same `defend.setId` (`e17_acceptable_use_inbox`) and the same "can I?" bank, so measurement
is identical and the two courses show the same content under the two labels. The `_defendOnly.brief` and
`_defendOnly.scopeNote` equal `strings.brief` and `scopeNote` (there is nothing to strip, because there
is no attack beat). State this equality in the fragment's `_about` note so a reviewer does not read the
duplication as an error.

If the platform would rather list one shell in both courses than ship two identical shells, that is a
host/seeding decision (A7 is out of scope); this spec ships two shells so the "both versions" decision is
met literally and each course has its own id and prefix (no shared global). Flagged in section 20.

## 14. Check-form items it feeds (new "acceptable use" topic forms; see `10_CHECK_FORMS.md`)

New topic, so **new** forms `aup_form_a` and `aup_form_b` (ENG-09), 10 items each (4 phish, 6 genuine),
`awareness` profile, `feedbackMode: "end"`, `headerPanel: "collapsed"`, `pairedWith`, prefix
`triage_{stage}_`, `passPercent: 0`, `verifyVerdict: true`. Do not edit the six built role forms. Item n
in A matches item n in B. The acceptable-use check items (install an app, a data lookup, a shared login,
a monitoring fact-or-myth) join as mirror pairs (per `core_16/assessment.md`). The E17 contribution, in
full:

| # | Form A (`aup_form_a`) | Form B (`aup_form_b`) | Phish | Flags (both) | Difficulty |
|---|-----------------------|-----------------------|-------|--------------|------------|
| 1 | `aa_install_app`: a meeting invite wanting an app install | `ab_free_tool`: a link to a free online converter | yes | `unapproved_tool` | medium |
| 2 | `aa_monitoring`: the firm's genuine monitoring notice | `ab_personal_use`: the genuine reasonable-personal-use reminder | no | | medium (suspicious-looking genuine) |
| 3 | `aa_data_lookup`: a colleague asks for a personal-reason lookup | `ab_famous_lookup`: "look up a famous customer, just to see" | yes | `secrecy_or_bypass` | easy |
| 4 | `aa_shared_login`: "log in as me while I'm off, I've said yes" | `ab_badge_lend`: "lend me your badge, I left mine at home" | yes | `secrecy_or_bypass` | easy |
| 5 | `aa_monitoring_myth`: "IT reads all my emails whenever they like" (a myth to spot as false) | `ab_private_chat_myth`: "my work chat is private" (a myth) | n/a (a fact-or-myth item; see `assessment.md` for the item kind) | | medium |
| 6 | `aa_ask_first`: a new tool you're unsure about (Ask first) | `ab_ask_first`: a laptop abroad question (Ask first) | no (Ask first / genuine) | | easy |

Each form carries a mirror pair (row 1 phish against row 2 suspicious-looking genuine). Rows 5 and 6 use
the fact-or-myth and Ask-first item kinds from `assessment.md`; confirm the kinds exist before authoring,
else drop to standard triage rows. The `triage.rb` balance lint must pass on the pair.

## 15. Files to create or change

Writer: this spec only.
Implementer: `awareness/e17/defend.json` (the `triageSets` entry `e17_acceptable_use_inbox`, the "can I?"
card bank wired to the organisation answer key with the locked set, the `awarenessEpisode`
defend/debrief/strings/_defendOnly keys, by analogy with `e6/defend.json`; no attack fragment, since E17
has no attack); shells `scenarios/awareness_e17_acceptable_use/` (full) and `.../_defend/` (defend-only),
both one-room `room_aw_tarrowby` kiosks, host Nilesh, kiosk `{ episodeId }`, both with identical defend
content (section 13); the three-way sort surface; new check shells
`awareness_{pre,post}_aup_{ab,ba}`; the `unapproved_tool` scenario-local tell. No BRAND_SET entry
(Tarrowby is built). Never run a generator into the repo.

## 16. Bridge script outline

`tools/playtest/se/bridge-e17-defend.jsonl` (there is no "full" bridge distinct from this, since the two
shells are identical): open kiosk; brief; the "can I?" sort (assert at least one of each answer is drawn,
that a locked card cannot be set to Allowed, and that each shows a reason); the six triage items (one
verdict each, assert immediate feedback and the mirror pair); debrief (assert the three-answers panel,
the habit-to-keep box and the Monday card); conclusion global `episode_e17_acceptable_use_defend_done`
set. Run it against both shells (the full shell's prefix is `episode_e17_acceptable_use_defend_`, the
defend-only shell's is `episode_e17_acceptable_use_defend_defend_`).

## 17. Acceptance checks

As E11 section 17, for both E17 shells and the `aup_form_a`/`aup_form_b` pair. Additionally: the full and
defend-only shells are identical in `stages` and `defend.setId` (section 13); a locked "can I?" card
cannot be set to Allowed; `social.awareness.ruleOfThumb` byte-identical to the other shells. There are no
flip or `mistake` keys to lint.

## 18. Do not

- Do not give E17 an attack half, a `mistake` stage or a flip; it is defend-only by user decision and
  does not use ENG-04.
- Do not add Marrowdale to the brand set; use the built Tarrowby company and cast (section 5).
- Do not let any organisation make a locked card (S04, S16, S17, S18, S19, S21, S22) "Allowed" or make
  reporting optional; do not draw a card the organisation has not confirmed.
- Do not punish caution: "Ask first" always scores at least a point.
- Do not make monitoring sound sinister or harmless: cover both the checks and the limits that protect
  staff.
- Do not blur mistakes and misuse: honest mistakes reported quickly are fixed; deliberate misuse is
  handled differently.
- Do not teach policy trivia ("what does section 4.3 say?"); cards are everyday situations, the section
  is a pointer.
- Do not edit the six built role check forms; no real brands; `.example` only; never run a generator into
  the repo; never `git stash`; no attribution lines in commits.

## 19. Stop and ask if

- The fact-or-myth and Ask-first check-item kinds (rows 5, 6) do not exist in `05`/`assessment.md`.
- The platform wants one shell listed in both courses rather than two identical shells (section 13).
- The "can I?" sort is wanted scored by the awareness profile rather than the organisation answer key
  (this changes section 11b).

## 20. Open questions

- **Two identical shells vs one listed twice:** this spec ships a `full` and a `defendOnly` shell with
  identical content so the "both versions" decision is met literally and each course has its own id and
  prefix. If the platform can list one shell in both courses, that would avoid the duplication; it is a
  seeding decision (A7 out of scope).
- **Host and company reuse with E15:** E17 and E15 are both Tarrowby with host Nilesh Solanki. This is
  deliberate (it saves art, the stated reason for choosing an existing company), but if E15 and E17 ship
  in the same course the same host and company appear twice. If that is unwanted, give E17 a different
  built Tarrowby host (for example Chidi Okeke, fleet coordinator), still saving the room and brand art.
- **The "can I?" sort scoring:** scored by the organisation answer key, not the awareness profile, so the
  measured parity set is the six-item triage set (11b). If the product wants the sort scored for
  measurement, that is a request to `05`.
- The organisation answer key's defaults are suggestions; only confirmed cards are drawn, and the six
  locked cards cannot be changed.
