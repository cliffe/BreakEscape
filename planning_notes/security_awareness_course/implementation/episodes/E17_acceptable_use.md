# E17: Acceptable use and your responsibilities

Buildable by a fresh Sonnet implementer from this spec plus "Read first". All companies, people and
domains are fictional; `.example` domains only. UK spelling; "cyber security" two words; no em or en
dashes.

E17 is **defend-only by the user's decision**: acceptable use has no single attacker, so it ships only
the defend-only shape, with no attack half, no consequence flip and no flip stage. It does **not** use
ENG-04. E17 ships **one** defend-only shell, listed in **both** seeded courses (not two identical
shells); section 13.

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
- **ENG-11** (reusable sort drill): the "can I?" three-way sort uses ENG-11's `sortDrill` surface, with
  `bins` Allowed / Not allowed / Ask first, `scored: true` against the organisation answer key
  (`answerKeyProfile: "organisation"`), locked cards and `alwaysScoresBin: "ask"` ("Ask first" always
  earns a point). ENG-11 is the one reusable sort surface; E14's "Post or Not?" feed drill is the sibling
  it also serves. Section 11a.
- **Check forms (no engine packet):** E17's topic (acceptable use, core_16) is a judgement topic, so it
  feeds the shared **`data_conduct`** pair built per `10_CHECK_FORMS.md`, not a per-topic form. Do not
  edit the six built role forms. Section 14.

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

### 11a. The "can I?" three-way sort (the signature activity; ENG-11 `sortDrill`)

Uses ENG-11's reusable `sortDrill` surface, with `bins` Allowed / Not allowed / Ask first, `scored:
true`, `answerKeyProfile: "organisation"` and `alwaysScoresBin: "ask"`. Everyday situations are sorted
against the organisation answer key, with the reason on screen. The card bank is
`core_16/game_design.md`'s S01 to S22 (reproduced below in full as ENG-11 `sortDrill.cards`). The
organisation confirms or edits each card (`confirmed`); **cards it has not confirmed are never drawn**;
**locked cards (S04, S16, S17, S18, S19, S21, S22) have `locked: true`** and cannot be reparented, so no
organisation can make any of them "Allowed" or make reporting optional. `drawRules`
(`oneOfEachAnswer: true`, `newFirst: true`) draw at least one of each answer, and when the policy changes
draw the changed-section cards first with a "new" badge. Scored by the organisation answer key (not the
`awareness` profile); `alwaysScoresBin: "ask"` gives "Ask first" at least a point, because punishing
caution stops people asking. Cards are everyday situations, never "what does section 4.3 say"; the
section is a pointer, not asked for.

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
"episode_e17_acceptable_use_defend_defend_"` (the single defend-only shell's prefix, section 13),
`passPercent: 0`. `channelTells`: `["secrecy_or_bypass"]` plus the scenario-local tell `unapproved_tool`.
`lookalike_domain` is **not** declared: no item in this set flags it, so listing it would leave an unused
tell (matching E8 §11's convention of not declaring a tell no item flags).
`secrecy_or_bypass` is a shared-library tell, already labelled in `CHANNEL_TELLS`.

**`unapproved_tool` is scenario-local in both E17 and E15.** It is a scenario-local tell
declared on E17's set with a short `flagChips` label ("Unapproved tool or app"), which the validator
accepts (`triage.rb` `flag_universe` allows a `channelTells` id that `flagChips` labels and that is not a
factor), so no shared-library change is needed. The same id is also used by E15's set
(`e15_shortcuts_inbox`), but a tell is shared only when a `10` check-form item scores it,
even when two sets use the same id: the sets are never merged, each declares `unapproved_tool` on its own
set, and nothing is appended to the shared `CHANNEL_TELLS` / `SKILL_NAMES`. No `10` item scores it, so it
stays local in both (the tell table and this rule are in `02` ENG-08). The full sentence per flagging message is carried as
`truth.factorStrings.unapproved_tool.redFlag` ("a free app or online service with no contract, handing
the firm's data to a provider we haven't checked").

This is the measured set, so E17
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

## 13. Defend-only variant (one shell, listed in both courses)

E17 ships **one** defend-only shell and that one shell is listed in **both** seeded
Hacktivity courses. Acceptable use has no attack half, so there is nothing a "full" shell would add over
the defend-only shape; two byte-identical shells would only add a second global prefix and a maintenance
trap for no learner benefit. `00`, `01` and this spec all say the same: one shell.

- **The one shell:** folder `scenarios/awareness_e17_acceptable_use_defend/`, episode id
  `e17_acceptable_use_defend`, `variant: "defendOnly"`, `stages: ["brief","defend","debrief"]`, set
  prefix `episode_e17_acceptable_use_defend_defend_` (the built double-suffix rule for an id ending
  `_defend`, matching the built E6 defend-only shell), defend set id `e17_acceptable_use_inbox`.
- **Seeding (01 P12):** this one shell joins both courses, the defend-only course and the
  both-versions course, through 01 P12. The user's "joins both seeded Hacktivity courses" decision is met
  by listing the single defend-only shell in both; there is no separate full shell.

`_defendOnly.brief` and `_defendOnly.scopeNote` equal `strings.brief` and `scopeNote` (there is nothing
to strip, because there is no attack beat); state this in the fragment's `_about` note so a reviewer does
not read it as an error.

## 14. Check-form items it feeds (`data_conduct`; see `10_CHECK_FORMS.md`)

E17's topic (acceptable use, core_16) is a judgement topic, so it feeds the shared **`data_conduct`**
pair (Carrholme, Verify on), defined and built in `10_CHECK_FORMS.md`; there is no per-topic form. The
six built role forms are the measured baseline and are not edited. (The trade-off the orchestrator
reports to the user is that two broad pairs give no per-topic pre/post figure.)

`data_conduct` scores only `00`-library tells, so E17's scenario-local tell (`unapproved_tool`) stays in
E17's own defend set, never in a form; the tell table and the shared-vs-local rule are in `02` ENG-08.
The fact-or-myth and Ask-first item kinds are taught by E17's own "can I?" sort (section 11a), not by
check-form rows.

E17's contribution is the core_16 rows of `10`'s `data_conduct` pair (see `10`'s item list): the
new-acceptable-use / annual-training genuine reminder (`dca_aup_reminder` / `dcb_training_reminder`) and
the "send it from your personal email, don't flag it" unsafe push (`dca_personal_email_push` /
`dcb_skip_dlp`). These are authored as part of `10`, aligned to E17's framing; they are not a separate
E17 form.

## 15. Files to create or change

Writer: this spec only.
Implementer: `awareness/e17/defend.json` (the `triageSets` entry `e17_acceptable_use_inbox`, the "can I?"
card bank wired to the organisation answer key with the locked set, the `awarenessEpisode`
defend/debrief/strings/_defendOnly keys, by analogy with `e6/defend.json`; no attack fragment, since E17
has no attack); **one** shell `scenarios/awareness_e17_acceptable_use_defend/` (defend-only, listed in
both courses; section 13), a one-room `room_aw_tarrowby` kiosk, host Nilesh, kiosk
`{ episodeId }`; the "can I?" sort as ENG-11's `sortDrill` config (section 11a); the `unapproved_tool`
scenario-local tell. No BRAND_SET entry (Tarrowby is built). The `data_conduct` check shells are built by
`10`'s check generator, not here (section 14). Never run a generator into the repo.

## 16. Bridge script outline

`tools/playtest/se/bridge-e17-defend.jsonl` (one shell, so one bridge): open kiosk; brief; the "can I?"
sort (assert at least one of each answer is drawn, that a locked card cannot be set to Allowed, and that
each shows a reason); the six triage items (one verdict each, assert immediate feedback and the mirror
pair); debrief (assert the three-answers panel, the habit-to-keep box and the Monday card); conclusion
global `episode_e17_acceptable_use_defend_defend_done` set (the single defend-only shell's prefix,
section 13).

## 17. Acceptance checks

As E11 section 17, for the one E17 defend-only shell (the `data_conduct` pair's parity is `10`'s
acceptance, not E17's). Additionally: the shell validates as `variant: "defendOnly"` with `stages:
["brief","defend","debrief"]`; a locked "can I?" card cannot be set to Allowed and `alwaysScoresBin`
earns a point on "Ask first"; `social.awareness.ruleOfThumb` byte-identical to the other shells. There
are no flip or `mistake` keys to lint.

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

- The "can I?" sort (ENG-11 `sortDrill`) is wanted scored by the awareness profile rather than the
  organisation answer key (this changes section 11b).

## 20. Open questions

- **Host and company reuse with E15:** E17 and E15 are both Tarrowby with host Nilesh Solanki. This is
  deliberate (it saves art, the stated reason for choosing an existing company), but if E15 and E17 ship
  in the same course the same host and company appear twice. If that is unwanted, give E17 a different
  built Tarrowby host (for example Chidi Okeke, fleet coordinator), still saving the room and brand art.
- **The "can I?" sort scoring:** scored by the organisation answer key, not the awareness profile, so the
  measured parity set is the six-item triage set (11b). If the product wants the sort scored for
  measurement, that is a request to `05`.
- The organisation answer key's defaults are suggestions; only confirmed cards are drawn, and the six
  locked cards cannot be changed.
