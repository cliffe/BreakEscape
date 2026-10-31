# E16 "Insider risk": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E16 is a consequence-flip plus defend episode (ENG-04): five unscored sandbox beats across a leaver's last week, a montage flip showing where each led, then the built six-item inbox-triage defend half with an unscored "raise a concern" step (ENG-12), and the built debrief. Company Quayholt Insurance; host the information security analyst Anjali Rao; module core_14 (insider risk). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the E8/E9/E11 pilot reviews in this folder.

Scope read end to end: both shells `scenarios/awareness_e16_insider_risk{,_defend}/{scenario.json.erb, ink/anjali_rao.ink}`; the fragments `e16/{full_only.json, defend.json, BRAND_ADDITIONS.md}`; the spec `.../episodes/E16_insider_risk.md`; E16's block in `gen_e8_e17_shells.py`; the module `core_14_insider_risk/concepts.md`; and the engine the findings depend on (`episode-runner/flip-view.js`, `minigames/concern-form/{concern-form-minigame.js, concern-form-model.js, css}`, `minigames/inbox-triage/{inbox-triage-minigame.js, triage-scoring.js}`).

How the screens were judged: this pass **ran the flip and the concern form**. A keyless `:3001` bridge run (`ONLY="e16-full"`, game 4859) passed 17/17. From that render I judged the **montage** (all five beats, order, the `outside_offer` headline first and the `samira` beat last, every beat `.aw-montage-taken` and carrying a `.aw-montage-line`) and the **concern form** (the `facts_verdict` tone shows the new affirming line and the guidance under the first check; removing the conclusion chip flips to the `facts` tone and the affirming "Facts, routed to the right person" line). The defend-set bodies, the debrief copy and the tag/line layering below are judged from the authored data plus `flip-view.js`/the scoring code.

Ran (all E16-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, no social errors or warnings (only the generic m01-style "add a hostile NPC / puzzle graph / timedConversation" suggestions, which do not apply to an awareness kiosk).
- `validate_social.rb` on both shells: no output.
- `dialoguelint.mjs` both shells: full `lines=6 median=24 p90=25 max=25`; defend `lines=3 median=26 p90=30 max=30`. No rule hits. (The defend-only host welcome sits on the 30-word ceiling, same borderline as E9/E11.)
- Parity subtest `E16: fragment and full erb share the same learner-facing copy`: pass (20/20 in the file). No em/en dashes anywhere in the E16 files (house style).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 1 | 0 | 0 |
| Minor | 3 | 1 | 0 | 2 |
| **Total** | **4** | **2** | **0** | **2** |

Episode shape unchanged: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Mistake = 5 beats, each 2 options, exactly 1 safe. Montage = 10 authored lines (both options × 5 beats). Defend set `e16_leaver_week_inbox`, 6 items, 1 genuine (`isPhish:false`, item 6). Concern form: 6 fact chips, 3 conclusion chips.

## C1 closure

Each C1 finding checked against the live files, and for the montage and the concern form against the render.

| C1 finding | Claimed fix | Verified | Evidence |
|---|---|---|---|
| **MAJOR-1** concern form prints the feedback twice (`.cf-live` not hidden) | engine: clip `.cf-live` like `.sd-live` | **Closed** | `css/concern-form-minigame.css:37` now `.cf-live { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); ... }`; the visible feedback renders once in `.cf-feedback-line` (`concern-form-minigame.js:216`), the announcement goes to the clipped `.cf-live` (`:84`) |
| **MAJOR-2** three verdict tones flattened into one cold line | episode: `feedbackFactsVerdict` gets its own affirming line, firmer line kept for the no-facts cases | **Closed for `facts_verdict`** — render shows the affirming line; **residual on `thin_verdict`, see D2** | `full_only.json:106` / erb `:432` affirming line; render tone `facts_verdict` text contains "leave the conclusion out". But `feedbackThinVerdict` was left identical to `feedbackVerdictOnly` (D2) |
| **MINOR-1** "the lender's record" reads as a financial lender | episode: reword | **Closed in the shipped files** (spec still stale, see D3) | `full_only.json:69` / erb `:460` now "went on the record of whoever's login it was"; no "lender" string in either shipped file |
| **MINOR-2** guidance paragraph shown under every feedback check | engine: show once | **Closed** | `concern-form-minigame.js:217-221` guards with `!this._guidanceShown` and `!…querySelector('.cf-guidance')`; render shows the guidance once, under the first check |
| **MINOR-3** stale `_notes` about `concernForm` not being copied | doc tidy | **Closed** | `full_only.json:2,9` now state `concernForm` is a `DEFEND_HALF_KEY` carried into the defend-only shell and `guidance` is a string |
| **kindLine/missLabel** added to rows 2 (Reuben) and 4 (Ross) | episode: so a genuine colleague is not labelled a phish | **Closed and honoured by the engine** | `defend.json:70,113` carry `kindLine`/`missLabel`; `inbox-triage-minigame.js:789` uses `truth.kindLine` instead of "This one was a phish.", `triage-scoring.js:294` uses `truth.missLabel` per critical miss |

All C1 items are genuinely closed in the files; the two engine fixes (MAJOR-1, MINOR-2) are confirmed in the CSS/JS and on-screen. The one residue is D2: the MAJOR-2 fix corrected `feedbackFactsVerdict` but left `feedbackThinVerdict` carrying the same cold line it replaced.

## What works

- **The register holds, and that is the load-bearing thing for this episode.** No suspicion meter, no snooping reward, no "investigate" ask; "you are not being asked to investigate anyone" is in the scope note, both briefs, the host welcome and the defend brief. The host's done line closes it perfectly: "Nobody's in trouble for being approached, and nobody's a suspect for having a hard week." The Samira thread clears her everywhere it appears (the `kind` montage beat, the "Seen, said, true" card, `noBlameLine`), and the two genuine colleagues whose *ask* is unsafe (Reuben row 2, Ross row 4) are framed as genuine with a safe way to help them, not as culprits.
- **One clear, repeatable lesson:** "Your login is you. Offers get reported. Concerns go to the right person, as facts." The Monday card reduces it to one habit plus one named person.
- **Facts track core_14.** All five key messages are present: login is you (rows 2, 3; `shared_login`); report offers of money for access (`insider_offer`, row 1); deny unrequested prompts (`unrequested_mfa_push`, row 3); notice/note/pass fairly (the concern form); unusual isn't wrong (the Samira thread). s170 DPA ("taking data to a new job can be a crime"), deny-all-and-ring-any-hour, and "the same message goes to several people, one report warns everyone" are faithful to the module.
- **Fair defend set, matched to the lesson.** The mirror pair (item 5 look-alike IT priming MFA approval → Report; item 6 genuine, pushy locked-out colleague → Verify-not-refuse) puts a similar genuine item right after the likely miss. Rows 2 and 4 carry the nuance (a genuine colleague's unsafe ask) in the feedback, not a trap. Every declared `channelTell` is used.
- **The concern form does the register work rather than just talking about it.** Facts chips vs conclusion chips, the feedback favours facts, the guidance names a route per concern and ends "Posting it in the team chat counts as spreading it, not raising it." Render-confirmed: picking the offer facts plus a conclusion gives the affirming `facts_verdict` line; dropping the conclusion flips to the `facts` affirmation.
- **Both shells validate clean; wiring is sound** (one-aim conclusion on `episode_e16_insider_risk_defend_done`, host `eventMappings`, double-suffix defend-only prefix, byte-identical rule of thumb, parity green).

## Design findings

**D1. Every unsafe montage line opens "Your choice.", which duplicates the engine's rendered "Your call" tag. Major, episode-local; judged from code with the render confirming all five beats are tagged.**
This is the same defect E11's C2 raised as D1 and fixed there, not carried into E16. `flip-view.js:148` renders an `.aw-montage-tag` above every `taken` beat: `flipMontageTagUnsafe` (default `"Your call"`) for an unsafe beat, `flipMontageTagSafe` (`"Your call: the safe route"`) for a safe one. E16 overrides neither tag string, so the defaults fire. The render confirms all five beats carry `.aw-montage-taken` (and so the tag). On a beat where the learner chose the unsafe option, the line E16 authors opens "Your choice.", so the learner sees:

> **Your call** *(tag)*
> Your choice. A reply drew more pressure, then a flood of sign-in prompts that night... *(line)*

"Your call" and "Your choice." stack and say the same thing. The safe lines are unaffected (they open "The version where...", which reads cleanly under "Your call: the safe route"). E11's shipped erb now has zero "Your choice." strings; E16 (and E15/E19, out of scope) still have five. Fix (episode-local): drop the "Your choice. " prefix from the five unsafe lines in `flipMontageByChoice`, in `full_only.json` and the full erb `strings.flipMontageByChoice`. (Alternative: override `strings.flipMontageTagUnsafe` to drop the duplicate; dropping the prefix is the smaller change and matches the fixed E11.) old → new:

- `outside_offer/engage`: `"Your choice. A reply drew more pressure..."` → `"A reply drew more pressure..."`
- `shared_login/log_in_for_him`: `"Your choice. Reuben clicked the wrong shortcut..."` → `"Reuben clicked the wrong shortcut..."`
- `rumour/add`: `"Your choice. The theory reached Samira..."` → `"The theory reached Samira..."`
- `leaver_favour/personal_email`: `"Your choice. The client list sat in a personal inbox..."` → `"The client list sat in a personal inbox..."`
- `samira/confront`: `"Your choice. Samira, whose father was in hospital..."` → `"Samira, whose father was in hospital..."`

**D2. `feedbackThinVerdict` was left identical to `feedbackVerdictOnly`, so a learner who included a fact and a conclusion is told "not something you saw". Minor, episode-local (residual of MAJOR-2).**
The model (`concern-form-model.js:124-127`) grades `verdict_only` (a conclusion and *no* facts) and `thin_verdict` (a conclusion *plus some facts*, fewer than `minFacts`, which defaults to 2) as different situations; its own defaults steer them differently ("Add what you saw" vs "Add more facts and leave the conclusion out"). The MAJOR-2 fix corrected `feedbackFactsVerdict` but set `feedbackVerdictOnly` and `feedbackThinVerdict` to the same line (`full_only.json:107-108`, erb `:433-434`): "That's a conclusion, not something you saw...". For `thin_verdict` the learner *did* pick a fact (one), so "not something you saw... give them what you actually noticed instead" is both inaccurate and colder than the surface warrants, the exact problem MAJOR-2 named, just on the narrower path. Fix (episode-local): leave `feedbackVerdictOnly` as the firmer line (accurate when no facts are picked), and either drop the `feedbackThinVerdict` override so the engine default stands, or give it its own line that credits the facts. Suggested new `feedbackThinVerdict`: "Those facts are a good start. Add a couple more of the things you saw yourself, and leave the conclusion out for whoever looks into it."

**D3. The spec drifted from the shipped files; MINOR-1 and (if D1 is applied) D1 are not reflected. Minor, needs-user (doc). No shipped file is wrong.**
`E16_insider_risk.md` section 10 still carries the pre-C1 wording: `:321` has "whatever was opened went on the lender's record" (the MINOR-1 text the fixer already changed to "the record of whoever's login it was"), and `:307-330` still show all five "Your choice." prefixes. Correct section 10 to the shipped wording (and to the D1 result once applied) so a later edition does not rebuild E16 from the stale spec. This is the companion to E11's D3.

**D4. The defend-only host welcome runs to exactly 30 words, the brief's "under 30" ceiling, and `dialoguelint` will not catch a breach. Minor, needs-user (shared generator line).**
Defend-only ink and `gen_e8_e17_shells.py:288`: "Anjali Rao, information security. It's a leaver's week. You're not here to catch anyone: keep your login yours, tell me what you're offered, and bring me facts, not a theory." = 30 words. `dialoguelint` reports it at the ceiling, not over, so nothing fires, but it is the one host line that is a mouthful to voice. Same borderline as E9's and E11's defend-only welcomes. Optional trim, e.g. drop "information security" is load-bearing, so instead drop "It's a leaver's week." (the brief already sets the scene): "Anjali Rao, information security. You're not here to catch anyone: keep your login yours, tell me what you're offered, and bring me facts, not a theory." (26 words). Fix in the generator `LINES[('e16','defend')]` first element, then regenerate the defend-only ink.

## Dialogue findings (voiced host lines)

Every host line read as spoken, in both shells. The register is a calm colleague throughout; no printed variables; UK English; no em/en dashes; word counts within the limit. I would change **none** of the voiced host lines for wording, only trim the defend-only welcome for length (D4). For completeness, the lines judged fine:

- **Full welcome (3 lines):** "Anjali Rao, information security. This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone." / "Keep your login yours, tell me what gets offered to you, and if something genuinely gives you pause, bring me the facts, not a theory." / "Start at the kiosk: make this week's calls first, then sort the messages and raise a concern. You are not being asked to investigate anyone." — calm, in register, each under 25 words.
- **Full done (2 lines):** "That's them handled. Your login is you, offers get reported, and an honest concern that turns out to be nothing is never a failure." / "Nobody's in trouble for being approached, and nobody's a suspect for having a hard week." — the second line is the register in one sentence; keep it exactly.
- **Defend-only done:** "That's them sorted, thanks. Your login is you, offers get reported, and a concern goes to the right person as facts, never a verdict on anyone." — good.
- **The "Thanks, Anjali." / "Any time." exchange** — fine.

D1's "Your choice." change is on-screen montage text, not a voiced host line. D2's change is on-screen concern-form feedback, not voiced.

## What I examined on the register, and judged acceptable (not findings)

- **The wellbeing fact chips (`fc_care_what`, `fc_care_who`).** The form lets the learner include "A colleague has seemed to be having a hard week" / "I don't know why, and it may well be nothing" and route it. This is the closest the episode comes to "reporting a colleague", so I looked hard. It stays in register: the chip is framed "may well be nothing", the guidance routes a wellbeing worry to the manager or HR as welfare (matching the module's "worried about their wellbeing, tell their manager or HR privately"), and the debrief's "Seen, said, true" card clears Samira. It models a kind, private welfare concern, not suspicion. Leave as is. (Minor latent risk only: a learner could build one report mixing the security offer with the welfare worry and pick a single route; the form is unscored teaching and the guidance explains routing, so this is acceptable.)
- **The conclusion chip `cc_craig` ("Craig reckons Samira's involved").** Classing it as a conclusion-to-avoid is right (passing on a theory is spreading it). The generic `feedbackVerdictOnly` line "not something you saw" fits `cc_ross`/`cc_samira` better than `cc_craig` (the learner *did* hear Craig say it), but the point the form teaches, do not forward a theory, is correct and the mismatch is slight. Not worth a bespoke line.
- **"Make this week's ordinary calls" in the brief and welcome.** "Calls" reads as judgement calls (decisions), consistent with the montage tag "Your call", not phone calls. E11's C2 flagged the near-identical "calls" but there it was paired with a wrong preposition; here the phrasing is clean. Leave.
- **"Refusing everything" still scores full.** The set has one genuine item (row 6) and under `scoringProfile: "awareness"` with `passPercent: 0`, denying/reporting everything is not marked down. This is the known shared-scorer limitation carried by every episode; met pedagogically by row 6's feedback ("Refusing flat, with no safe route offered, helps nobody") and the modelled Verify. Conscious product choice, not an E16 defect.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass (register strong; D4 welcome at the word ceiling) | pass (D4) |
| mistake (sandbox) | pass (5 beats, one safe each, safe position varied) | — |
| flip (montage) | **pass after D1** (drop the "Your choice." prefixes so they don't double the "Your call" tag) | — |
| defend | pass (fair, mirror pair, genuine items framed kindly; D2 is a narrow concern-form path) | pass |
| debrief | pass (Seen/said/true, Monday card, no-blame line, rule of thumb all correct and in register) | pass |

**Overall: ship-worthy after D1 (montage tag dedup).** No blockers; the register, the thing section 18 makes load-bearing, holds cleanly, the facts track core_14, and the shells are structurally sound. D1 is the one change I would hold ship on, and it is trivial content work; D2 is a small concern-form wording fix on a narrow path; D3 and D4 are doc and shared-generator tidy-ups that touch no shipped learner copy except the optional D4 trim. All C1 fixes are genuinely closed; the only new episode-local work is the montage prefix (which the C1 pass never checked against the engine tag) and the `thin_verdict` residue of MAJOR-2. Recommend applying D1/D2, correcting the spec (D3), and running one timed full-episode playtest to close the ~15-minute budget check that no pass has yet confirmed.

---

### Return (one line each)

- Counts: 0 blocker, 1 major, 3 minor (4 total; 2 episode-local, 0 engine, 2 needs-user).
- C1 closure: all six items genuinely closed (MAJOR-1/MINOR-2 engine fixes confirmed in CSS/JS and on-screen; MAJOR-2 closed for `facts_verdict` but left a residue on `thin_verdict`, D2; MINOR-1/MINOR-3 and the kindLine/missLabel additions verified, the latter honoured by the triage engine).
- Blockers: none.
- Major (D1, episode-local): every unsafe montage line opens "Your choice.", duplicating the engine's "Your call" tag (`flip-view.js:148`); drop the prefix from the five unsafe lines in `full_only.json`/full erb `strings.flipMontageByChoice` (E11 fixed this; E16 did not).
- Verdict: ship-worthy after D1; apply D2 and fix the spec (D3), trim the defend-only welcome (D4) if a wording pass is cheap, and run one timed playtest. Pre-ship still owed (from BRAND_ADDITIONS.md, not a review finding): web-search the three new names (Ross Garside, Samira Nawaz, Craig Pickering).
