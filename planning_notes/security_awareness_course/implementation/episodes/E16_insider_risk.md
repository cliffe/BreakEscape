# E16: Insider risk

Buildable by a fresh Sonnet implementer from this spec plus "Read first". All companies, people,
domains and figures are fictional; `.example` domains only. UK spelling; "cyber security" two words; no
em or en dashes.

**Tone is load-bearing for this episode: no blame, and no surveillance framing.** The episode never
rewards snooping, never shows a "suspicion meter", and never asks the learner to investigate anyone. The
temptations to search a desk or photograph a screen exist only so they can be explained. Every mention
of grievance, debt or illness comes with support. See section 18.

E16 is a **consequence-flip plus defend** episode. It asks ENG-04 for the config shape **defined once in
`E11_misdirected_data.md` section 10a**; do not redefine it here.

## 1. Goal and module(s)

Teach **core_14 (insider risk)**: your login is you; report offers of money or favours for access; deny
unrequested sign-in prompts; notice facts, note them, pass them to the right person while staying fair,
including to a colleague the office is whispering about; and know that most insider risk is ordinary
mistakes, not spies. The learner's own habits are most of the topic, so there is no write-a-phish beat:
the week is a short sandbox of everyday choices, the flip shows the chain each one started, and the
scored defend half drills the recognise-and-report behaviours. Target length about 15 minutes. Shape:
the **consequence flip, plus a defend half** with a short "raise a concern" step.

Source of truth: `modules/core_14_insider_risk/concepts.md`. Shape from `.../game_design.md` ("Notice
Period").

## 2. Read first (exact paths)

- `modules/core_14_insider_risk/concepts.md` (source of truth), `.../game_design.md`, `.../assessment.md`.
- **`E11_misdirected_data.md` section 10a** (the ENG-04 config shape; required reading).
- `designs/00_data_contract.md` sections 2 (channel tells, `unrequested_mfa_push`), 8 (NPC influence)
  and 11 (`awarenessEpisode`).
- `designs/11_awareness_product_episodes.md` sections 3.1, 4.1, 5.1, the "Built note"; and the built
  `mfa` authenticator (E3's `mfa` stage, reused here as a defend `push` card).
- `designs/12_deduction_board.md` **use case B (the night-shift insider), as a later, richer option
  only** (section 20). E16 does **not** build it; it is noted so the richer deduction-board version is
  not confused with this episode.
- `awareness/BRAND_SET.md`, the Quayholt Insurance cast (Leila Nassar, Darren Price, Gordon McLeish,
  Anjali Rao, Hana Novak) and the E3 additions (Reuben Ofori).
- Nearest built episode: E3 (Quayholt, helpdesk/MFA) `awareness/e3/{attack,defend}.json` (the role-swap
  `call` kind and the `mfa`/`push` surfaces) and E4 `awareness/e4/defend.json` (the `triageSets` item
  shape, the `awarenessEpisode` block, the defend-only split). Shells `scenarios/awareness_e3_helpdesk_reset*/`.
- Engine: `episode-runner/`, `systems/episode-starter.js`, `awareness-measure.js`, the authenticator
  (`mfa` stage / `push` kind), the inbox-triage defender with `Verify`.
- Validators as E11 section 2.

## 3. Depends on

- **ENG-04** (the consequence-flip `mistake` stage + montage flip), config shape per `E11` section 10a.
- **ENG-08** schema/validator for the ENG-04 keys (if not carried by ENG-04).
- **Built, no new packet:** the inbox-triage defender under the `awareness` profile with `Verify`; the
  built authenticator `push` card (`unrequested_mfa_push`); the NPC influence global and thresholds (how
  Ross and Samira respond); the montage flip (ENG-04); the measurement store; the debrief view; the
  shared rule of thumb.
- **ENG-12** (the "raise a concern" fact-chip form): build a short report from fact chips (what, when,
  where, who) and conclusion chips, where the feedback favours facts over a verdict. ENG-12 owns this
  surface (`awarenessEpisode.concernForm`); it is a chip-composition interaction, not a sort, so it does
  not fold into ENG-11. The route picker (security team, manager, HR, Speak Up line, DPO) is part of the
  form's guidance. Unscored teaching, not scored by the `awareness` profile. Section 11.
- **Check forms (no engine packet):** E16's topic (insider risk, core_14) is a judgement topic, so it
  feeds the shared **`data_conduct`** pair built per `10_CHECK_FORMS.md`, not a per-topic form. Do not
  edit the six built role forms. Section 14.

## 4. Owner models

Content to `opus48` (and a dialogue reviewer sensitive to the tone rules); engine (ENG-04 reuse, the
raise-a-concern form, check-form wiring) to general-purpose or Sonnet.

## 5. Company, room and host

- **Company: Quayholt Insurance** (the company the module design names; built brand,
  `quayholt.example`, look-alikes `quayholt-sso.example`, `quayho1t.example`, `quayholt-support.example`,
  plus `quayholt-benefits` and `quayholt-learning`; wordmark `QUAYHOLT`, accent `#6b4c9a`). A commercial
  insurer with an in-house IT service desk.
- **Room: `room_aw_quayholt`** (the built Quayholt training-room type). The week plays out in desktop,
  chat and phone overlays; no new room.
- **Host: Anjali Rao**, information security analyst (`anjali.rao@quayholt.example`), built Quayholt
  cast. She welcomes the learner, teaches through the per-item feedback, takes the concern, and holds the
  conclusion `eventMappings`.
- **Cast:**
  - **Ross Garside**, senior account manager on his notice period (new). Liked, passed over last spring,
    joining a competitor; "they're my contacts". Not a villain.
  - **Samira Nawaz**, a long-serving colleague, the false lead, whose father is in hospital this week
    (new). Use Nawaz, not the `game_design.md` default "Samira Haddad": "Haddad" clashes with a
    character in the deduction sidecar fixture B (`planning_notes/.../deduction/.../fixture_B*`).
  - **Craig Pickering**, a colleague who loves a theory (new); the rumour, not malicious.
  - **Reuben Ofori** (built Quayholt, from E3) as the locked-out colleague who asks to borrow a login.
  - An **HR partner** and the **DPO** as concern routes; a **line manager** who sets the week's work by
    chat; an unknown messaging contact for the offer (handle "Opportunities", a stock-style avatar, text
    only, never voiced, never a real brand). Keep the offer contact's handle distinct from E14's
    "Jordan Vale".
  - **Names:** Ross Garside, Samira Nawaz and Craig Pickering are new; Anjali Rao and Reuben Ofori are
    built Quayholt cast. Pre-ship web search for the new names owed.

### BRAND_SET.md additions (Quayholt Insurance)

Add to the Quayholt cast, following the format and standing rules (web-search each new name pre-ship;
state the diversity choice):

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Ross Garside | Senior account manager (leaver) | 50s, white, north-east England | `ross.garside@quayholt.example` | The leaver; the favour and last-day login beats |
| Samira Nawaz | Account handler (the false lead) | 40s, British Pakistani | `samira.nawaz@quayholt.example` | The colleague the office whispers about; innocent |
| Craig Pickering | Account handler (the rumour) | 30s, white, Bristol | `craig.pickering@quayholt.example` | The lunch-room theory |

Diversity note: the new cast spans 30s to 50s and mixes white north-east English, British Pakistani and
white Bristol backgrounds, beside the built Quayholt cast (Lebanese-British, Scottish, Indian, Czech-
British). Pre-ship: Garside, Nawaz, Pickering web search owed.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | What happens |
|-------|---------|--------------|
| brief | 1 | Anjali welcomes, reads the scope, and the line "you are not being asked to investigate anyone" |
| mistake | 4 to 5 | Five everyday choices across a leaver's last week (section 9); unscored |
| flip | 1 to 2 | The chain: where each choice led, the offer first; ends on the discreet, fair resolution (section 10) |
| defend | 4 to 6 | A six-item triage set (scored) plus the unscored "raise a concern" step (section 11) |
| debrief | 1 to 2 | Per-item cards, the "seen/said/true" row for Samira, the habit to keep, the Monday card, the no-blame line (section 12) |

## 7. Stages (runner stage ids)

Full: `"stages": ["brief", "mistake", "flip", "defend", "debrief"]`. Defend-only: `"stages":
["brief", "defend", "debrief"]`. The "raise a concern" form runs inside `defend` as an unscored
sub-activity.

## 8. Brief and scope note (host draft lines)

- **Scope note** (`scopeNote`): "Authorised exercise at Quayholt Insurance, a fictional firm. It's a
  leaver's last week. In scope: your own choices, and what you notice. You are not being asked to
  investigate anyone."
- **Brief** (`strings.brief`): "You're on an authorised exercise at Quayholt Insurance, a fictional
  firm. A colleague is leaving on Friday, and the office is talking. Your job is not to solve anything:
  keep your access to yourself, report what's offered to you, notice what you actually see, and pass
  facts to the right person, fairly, including about the colleague everyone is whispering about. First
  you make this week's ordinary calls; then you see where each led. Then a short set of messages, and a
  fair way to raise a concern. Only the set is scored."
- **Defend-only brief** (`_defendOnly.brief`): "You're on an authorised exercise at Quayholt Insurance, a
  fictional firm, during a leaver's last week. Messages are waiting: an offer, a request to borrow a
  login, some sign-in prompts, a favour. Sort them, and learn to raise a concern as facts, not a verdict
  on anyone. Reporting or checking when you're unsure is always fine and never marked down. You are not
  being asked to investigate anyone."
- **Defend-only scope note** (`_defendOnly.scopeNote`): "Authorised exercise at Quayholt Insurance, a
  fictional firm. In scope: a short set of messages, and a fair way to raise a concern."
- **Host welcome (draft):** "Anjali Rao, information security. This week someone's leaving and there's a
  bit of talk going round. You're not here to catch anyone. Keep your login yours, tell me what gets
  offered to you, and if something genuinely gives you pause, bring me the facts, not a theory."

## 9. The consequence stage (the `mistake` sandbox)

Five everyday choices across the week, one at a time, inside ordinary work; nothing is scored. Exactly
one `safe: true` option per beat. Config shape: `E11` section 10a.

| Beat id | Situation (on screen) | Unsafe option | Safe option (approved route) | Teaches |
|---------|-----------------------|---------------|------------------------------|---------|
| `shared_login` | Reuben is locked out, a report due at ten: "Can I just use yours? Two minutes." | "Log in for him" | "Ring the service desk with him; they reset it in minutes" | Your login is you (core_14) |
| `rumour` | At lunch Craig floats that Samira is leaving with Ross and taking the client list. | "Add to the theory" | "If he's actually seen something, point him to the security team or his manager, not the kitchen; otherwise leave it" | Rumours land on people already under strain (core_14) |
| `outside_offer` | An unknown contact: "We pay people at firms like yours for remote access. 25% of what we make. Totally anonymous. Interested?" | "Reply to find out how it works" | "Screenshot it and report it to the security team, without replying" | Criminals recruiting insiders (core_14). **This is the `flipBeat`.** |
| `leaver_favour` | Ross asks you to export his accounts to his personal email "for the handover". | "Send them to his personal email" | "Ask what the handover actually needs; put handover notes in the shared place; route anything else to his manager" | Company data stays with the company; leavers and data (core_14) |
| `samira` | Samira has been in early, taking calls in the stairwell, and visiting HR. | "Ask her outright if she's going with Ross, or report her as a suspect" | "Offer a kind word; if you're worried about her, tell her manager or HR privately" | Unusual isn't wrong; a kind word first (core_14) |

The one consequential choice quoted in the flip (aw2) is `outside_offer` (`flipBeat`).

## 10. Flip (the montage)

Montage mode (ENG-04), showing every beat, the taken option framed "Your choice" and an untaken one as
"the version where it happened instead". `outside_offer` first; the montage **ends on the Samira beat's
resolution** so the fair, kind outcome is the last thing seen. `strings.flipMontageByChoice` (full
text):

- `outside_offer` / `engage`: "Your choice. A reply drew more pressure, then a flood of sign-in prompts
  that night. The same message had gone to several people; the one who reported it warned everyone."
- `outside_offer` / `report`: "The version where someone replied instead: the pressure grew and the
  sign-in prompts came that night. Reporting it, without a word back, stopped it and warned the team. You
  are not in trouble for being approached."
- `shared_login` / `log_in_for_him`: "Your choice. Reuben clicked the wrong shortcut and opened the HR
  drive, under your name, on the record until it was explained. Harmless this time; a reset would have
  cost two minutes."
- `shared_login` / `service_desk`: "The version where a login was shared: whatever was opened went on the
  lender's record. The service desk reset it in minutes instead."
- `rumour` / `add`: "Your choice. The theory reached Samira, who had been at the hospital every night.
  It wasn't true, and it landed on someone already having the worst week."
- `rumour` / `route`: "The version where the theory spread: it reached Samira, and it wasn't true. Facts
  to the right person help; a theory in the kitchen only hurts."
- `leaver_favour` / `personal_email`: "Your choice. The client list sat in a personal inbox outside the
  firm. Company data belongs to the company, and the people in it belong to themselves."
- `leaver_favour` / `handover`: "The version where accounts went to a personal inbox: the firm's data
  left its protection. Handover notes in the shared place did the job and kept it in."
- `samira` / `confront`: "Your choice. Samira, whose father was in hospital, was asked if she was
  'in on it'. She wasn't. The question made a hard week harder."
- `samira` / `kind`: "A kind word, and a quiet word to her manager because you were worried: Samira's
  father was in hospital. Nobody was accused, and she got support. That is what good looks like."

`flipHeading` = "A week later". For where `flipHeading` and `flipMontageByChoice` live (the heading in
the `defend.json` fragment, only `flipMontageByChoice` erb-only and on the parity allow-list), see `E11`
section 10a and `02` ENG-04; E16 follows the same rule.

## 11. Defend set

**Scored set:** six items on the built inbox-triage defender, `scoringProfile: "awareness"`,
`verifyVerdict: true` (routing to the service desk is a real move), `feedbackMode: "immediate"`,
`headerPanel: "off"`, `glossary: "closed"`. Set id `e16_leaver_week_inbox`.
`outcome.setGlobalPrefix: "episode_e16_insider_risk_defend_"`, `passPercent: 0`. `channelTells`:
`["unrequested_mfa_push", "secrecy_or_bypass", "borrowed_authority"]` plus the scenario-local tell
`insider_offer` ("an offer of money or favours for access or data"). Use the built authenticator `push`
card for item 3.

| # | Id | Kind / from | Subject or line | Tells and flags | Correct verdict | Reason text |
|---|----|-------------|-----------------|-----------------|-----------------|-------------|
| 1 | `e16_offer` | sms/DM, unknown contact "Opportunities" | "We pay people at firms like yours for remote access. 25%. Anonymous. Interested?" | `insider_offer`, `secrecy_or_bypass` | **Report** (screenshot and report, without replying) | "Don't reply, negotiate or play along. Screenshot it and report it; the same message often goes to several people, and one report warns everyone. You're not in trouble for being asked." |
| 2 | `e16_shared_login_req` | email/call, Reuben Ofori (built), genuine colleague, bad ask | "Can I use your login for ten minutes? I'm locked out." | `borrowed_authority` (none, really; a colleague's convenience ask) | **Verify** (route to the service desk with him) or **Report** | "Your login is you; sharing it puts his actions on your record and may show him more than he should see. Ring the service desk with him; a reset takes minutes. Say no, but offer the safe route." |
| 3 | `e16_mfa_storm` | push card (built authenticator) | A run of sign-in prompts you didn't start, late at night | `unrequested_mfa_push` | **Report** (Deny and report; deny them all) | "You didn't start these. Deny every one and ring the service desk now, any hour. A flood of prompts is someone trying to wear you into tapping approve." |
| 4 | `e16_leaver_favour` | email, Ross Garside | "Export my accounts to my personal email for the handover, would you?" | `secrecy_or_bypass` | **Verify** (ask what the handover needs; route to his manager) or **Report** | "Handover notes go in the shared place, not a personal inbox; the client list belongs to the firm. Decline the personal-email export and route it. Taking data to a new job can be a crime, but here you just help him do the handover properly." |
| 5 | `e16_it_approve` | email, "IT Service Desk" on a look-alike (`quayholt-support.example`) | "We're migrating your account tonight; approve the sign-in prompt when it arrives" | `secrecy_or_bypass`, `lookalike_domain` | **Report** | "This primes you to approve a prompt you didn't start; real IT never asks that, and the address is on quayholt-support.example, not quayholt.example. Report it. (The normal-looking phish half of the mirror pair.)" |
| 6 | `e16_genuine_lockout` | call, a colleague locked out before a client deadline, genuine, a bit pushy | "I'm really stuck, can you not just sort me out?" | none (genuine; isPhish false) | **Verify** (ring the service desk / confirm on the number on file) | "Genuine and awkward, not a trick. The safe route still serves him: the service desk, or a manager for temporary access. Refusing flat, with no safe route offered, helps nobody. (The suspicious-looking genuine half of the mirror pair.)" |

**Mirror pair (aw5):** item 5 (normal-looking phish priming MFA approval, Report) and item 6
(suspicious-looking genuine locked-out colleague, Verify, not refuse).

Add `lookalike_domain` to `channelTells` for item 5.

**Unscored teaching step in the defend stage (ENG-12 `concernForm`):** **"Raise a concern"** uses
ENG-12's `awarenessEpisode.concernForm` surface, a short report built from fact chips the learner noticed
this week (`factChips` of kind what / when / where / who) and `conclusionChips` from the rumour ("Ross is
stealing", "Craig thinks Samira's involved"); the authored feedback favours facts over a verdict and
gently discourages jumping to a conclusion, and the guidance offers a route (security team, manager, HR,
Speak Up line, DPO). Posting it in the team chat counts as spreading it, not raising it. Unscored
teaching (not the `awareness` profile).

## 12. Debrief cards

Built debrief view: per-item cards (section 11); a **"seen, said, true" row for Samira** (seen: in
early, calls in the stairwell, visits to HR; said: "going with Ross"; true: her father was in
hospital); feedback on the genuine items (the real locked-out colleague, an honest concern that turned
out to be nothing); the team-protected tally; then

- **The habit to keep** (shared rule of thumb, verbatim): "When a message pressures you to move money,
  grant access, sign in or read back a code, stop and check it yourself through a route you already
  trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair
  thing to do." The debrief adds the plain line: "Your login is you. Offers get reported. Concerns go to
  the right person, as facts."
- **The "On Monday" card:** "Think of the one person here you'd tell if you noticed something, and keep
  your login and your prompts to yourself." Report route from `slot:customer_report_route`.
- **The no-blame line** (`noBlameLine: true`): "A well-made offer or a plausible rumour fools decent
  people. Raising an honest concern that turns out to be nothing is never a failure, and nobody is in
  trouble for being approached."

`defendOnly` string (where the flip would have been): "The offers and the rumours here are the kind that
catch decent people. The ones you were caught out by are shown below, with what good looks like, and a
fair way to raise a concern."

## 13. Defend-only variant

Own shell, id `e16_insider_risk_defend`, `variant: "defendOnly"`, same `defend.setId`
(`e16_leaver_week_inbox`), stages `["brief","defend","debrief"]`, set prefix
`episode_e16_insider_risk_defend_defend_`. Keeps the scored set and the ENG-12 "raise a concern" step, so
measurement is unchanged; drops the week sandbox and the chain montage. Ships alongside the full shell;
both join the two seeded Hacktivity courses (full in the both-versions course, defend-only in the
defend-only course) **through 01 P12**.

## 14. Check-form items it feeds (`data_conduct`; see `10_CHECK_FORMS.md`)

E16's topic (insider risk, core_14) is a judgement topic, so it feeds the shared **`data_conduct`** pair
(Carrholme, Verify on), defined and built in `10_CHECK_FORMS.md`; there is no per-topic form. The six
built role forms are the measured baseline and are not edited. (The trade-off the orchestrator reports to
the user is that two broad pairs give no per-topic pre/post figure.)

`data_conduct` scores only `00`-library tells, so E16's scenario-local tell (`insider_offer`) stays in
E16's own defend set, never in a form; the tell table and the shared-vs-local rule are in `02` ENG-08.

E16's contribution is the core_14 rows of `10`'s `data_conduct` pair (see `10`'s item list): the
"use your login / approve under your account" leaver-favour call (`dca_login_favour` /
`dcb_approve_under_you`) and the within-need-to-know manager report that could be mistaken for a data
risk (`dca_manager_report` / `dcb_access_review`). These are authored as part of `10`, aligned to E16's
framing; they are not a separate E16 form. The "fair concern" item is taught by E16's own ENG-12 concern
form, not by a check-form row.

## 15. Files to create or change

Writer: this spec only.
Implementer: `awareness/e16/mistake.json` (the sandbox beats and the `awarenessEpisode` block, no `04`
target) and `awareness/e16/defend.json` (the `triageSets` entry `e16_leaver_week_inbox`, the
`_brandAdditions` for the three new Quayholt cast, the `awarenessEpisode` defend/debrief/strings/_defendOnly
keys, by analogy with `e3/`/`e4/`); shells `scenarios/awareness_e16_insider_risk/` and `.../_defend/`
(one-room `room_aw_quayholt` kiosk, host Anjali, kiosk `{ episodeId }`); the "raise a concern" step as
ENG-12's `concernForm` config (section 11); `BRAND_SET.md` (Ross Garside, Samira Nawaz, Craig
Pickering); the `insider_offer` scenario-local tell; ENG-04 schema/validator/parity updates (shared with
E11). The `data_conduct` check shells are built by `10`'s check generator, not here (section 14). Never
run a generator into the repo.

## 16. Bridge script outline

`tools/playtest/se/bridge-e16-full.jsonl`: open kiosk; brief (assert the "not being asked to investigate
anyone" line); the five `mistake` beats (take at least one unsafe option so the montage headline has a
"your choice" branch); the montage flip (assert the `outside_offer` headline, every beat shows a line,
and the Samira resolution is last); the six defend items (one verdict each, including Deny on the push
card, assert immediate feedback); the "raise a concern" form (assert facts are favoured over
conclusions); debrief (assert the "seen/said/true" Samira row, the habit-to-keep box, the Monday card);
conclusion global `episode_e16_insider_risk_defend_done` set. A second bridge for the defend-only shell.

## 17. Acceptance checks

As E11 section 17, for the E16 shells (the `data_conduct` pair's parity is `10`'s acceptance, not E16's).
The montage renders every beat and ends on Samira; the push card uses the built authenticator;
`flipHeading` is in the fragment and `flipMontageByChoice` is erb-only; the ENG-12 concern form favours
facts over a verdict; `social.awareness.ruleOfThumb` byte-identical. Tone review (section 18) signed off
by the
dialogue reviewer.

## 18. Do not (tone rules are blockers here)

- Do not build a culture of watching each other: no "suspicion meter", never reward snooping, never ask
  the learner to investigate. The search-a-desk and photograph-a-screen temptations exist only to be
  explained (the photo put customer data on the learner's own phone).
- Do not make stress a risk factor to be watched: every mention of grievance, debt or illness comes with
  support, and Samira's thread teaches kindness and fairness.
- Do not let who is suspected and who is guilty echo stereotypes: the gossip is likeable and ordinary,
  and the debrief notes rumours tend to land on people already under strain. Ross is not a monster;
  Craig is not malicious; Samira is innocent and easy to clear with a kind word, never marked as a
  failure for being suspected.
- Do not explain any technique in the offer: it offers money and asks for "access", nothing technical.
- Do not mark down an honest concern that turns out to be nothing.
- Do not redefine the ENG-04 shape here; reference `E11` section 10a.
- Do not build design 12's night-shift deduction board; it is a later, richer option (section 20).
- Do not edit the six built role check forms; no real brands or real names in the game; `.example` only;
  never run a generator into the repo; never `git stash`; no attribution lines in commits.

## 19. Stop and ask if

- The ENG-04 shape as built differs from `E11` section 10a.
- The "raise a concern" form is wanted scored (this changes section 11), or as a larger build than a
  simple fact-chip form.
- The orchestrator wants the richer design 12 use case B deduction board instead of this episode (a
  separate, later build).

## 20. Open questions

- **Design 12 use case B (night-shift insider deduction board):** a separate, later, richer build on the
  intel board, not part of E16 (`core_14/game_design.md` alt concept 3; `designs/12` section B). Noted so
  the two are not confused; E16 ships the consequence-flip-plus-defend shape above.
- **"Raise a concern" scoring:** kept unscored so the measured set is a standard six-item triage set with
  a mirror pair. If the product wants the concern step scored (favouring facts over conclusions), that is
  a request to `05`.
- **Samira surname:** this spec uses Nawaz (not the `game_design.md` default Haddad, which clashes with
  the deduction fixture B). If the orchestrator prefers Haddad, the deduction fixture must be checked
  first.
- Pre-ship web search for Garside, Nawaz and Pickering is owed.
