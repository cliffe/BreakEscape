# E11 "Misdirected data": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E11 is a consequence-flip episode (ENG-04): four unscored sandbox choices, a montage flip showing where each led, then the built inbox-triage defend half and the built debrief. Company Carrholme Services; host the DPO Tomasz Wiśniewski; modules core_05 (data protection and privacy) and core_06 (handling information). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the E8 pilot reviews in this folder.

Scope read end to end: both shells `scenarios/awareness_e11_misdirected_data{,_defend}/{scenario.json.erb, ink/tomasz_wisniewski.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e11/{mistake.json, defend.json}`; the spec `.../episodes/E11_misdirected_data.md`; E11's lines in `gen_e8_e17_shells.py`; the modules `core_05.../concepts.md` and `core_06.../concepts.md`; and the engine the montage and tag depend on (`episode-runner/episode-model.js` `montageProps`, `flip-view.js` `renderMontage` + the new `flipMontageTagSafe/Unsafe` defaults, `awareness-skin.css`).

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both exit 0; **no social warnings**, only the generic one-room-kiosk suggestions every awareness shell draws); `dialoguelint.mjs` on both (no rule hits; `lines=0`, the host lines sit inside `{ }` conditional blocks so no length rule fires, as C1 noted, so word counts below are counted by hand); `node --test validator-social-mistake` + `social-awareness-fragment-erb-parity` (E11's rows pass: `ok 12 - E11: fragment and full erb share the same learner-facing copy`, plus the clean-consequence-shell and `flipMontageByChoice` key checks). The one parity failure in the shared tree is **E8**, not E11 and not the E12/E13/E14 C1 named; it is other in-progress awareness work. **No screen was rendered** — the montage/tag finding below is read off `flip-view.js` + `episode-model.js`.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 1 | 0 | 0 |
| Minor | 3 | 1 | 0 | 2 |
| **Total** | **4** | **2** | **0** | **2** |

## C1 closure table

| C1 finding | Claimed fix | Verified | Status |
|---|---|---|---|
| **MA1** 72-hour line misstated the clock | montage `overtime_sheet/send_wrong_sam` reworded off the statutory clock | `mistake.json:54` and full erb `:383` now read "...Three days the DPO never had, to warn the staff and limit the harm." No "72 hours" string remains in either file. | **Closed** |
| **MA2** Bernadette montage said desk was told "he was her brother" | `caller_bernadette/give_details` reworded | `mistake.json:58` / full erb `:387` now read "...a stranger was waiting for Bernadette outside her school. The birthday-surprise call was how he learned where a lone worker would be, and when." No "brother" claim remains; cause and effect hold. | **Closed** |
| **MI1** item 6 "the one he's emailing you from today" | plain number instead | `defend.json:136` and both shells (`:250`) now read "...a new mobile number for the claim, 07700 900412, so please update the contact on file." Ofcom drama-range number, no channel conflation. | **Closed** |
| **MI2** spec §12 overstated the debrief | spec §12 corrected | `E11_misdirected_data.md:458` now reads "A per-item reasoning card for each item the learner got wrong (`reviewNeeded`); on a clean run this is a single 'you read every one the right way' line, with no per-item cards. The reasoning...is carried in the immediate per-item feedback." | **Closed** |
| **MA3** montage amber "taken" stripe on correct calls | fixed in engine on main (safe/unsafe styling + "Your call" tag) | `flip-view.js:147` styles `.aw-montage-safe`/`.aw-montage-unsafe` from `b.safe`; `:148` adds a words-not-colour tag. Confirmed on main. **But the content was not updated to sit beside the new tag — see D1.** | **Closed in engine; opened D1** |
| **MI3** "refusing everything" still scores 100% | known shared-scorer limitation, unchanged | Still true (`scoringProfile: "awareness"`). Documented in `defend.json` `_scorerLimit` and spec §11/§20; met pedagogically by item 4 (awkward genuine SAR) and item 6 (Trust is correct) in immediate feedback. | **Unchanged, as expected** |

All six C1 items are accounted for. The only live consequence is D1 below, which the MA3 engine fix created rather than closed.

## What works

- **The consequence-flip still earns its place and the facts still track the modules.** Spot-checked afresh against `core_05`: item 1 breach-to-DPO (§84, "say it involves personal data"), item 2 police impersonation (§60 + the "if the police ask we have to tell them" misconception §121), item 4 any-form SAR (§67, §70), item 5 someone-else's-mistake-in-your-inbox (§84), item 6 front-line contact-detail update (§70 and the "Data front-line staff may update directly" slot). The marketing-export sandbox beat is core_05's own purpose-limitation example; the redaction beat is core_06's "check what is hidden inside a file before it leaves".
- **The MA3 engine fix helps the safe-pick lines.** A learner who chose well now sees the tag "Your call: the safe route" above a line that opens "The version where it went to the first Sam instead:..." — the tag frames the paragraph as the cost they avoided, which reads cleanly. The amber-on-a-correct-call problem C1 raised is gone.
- **Both shells validate with no social warnings; wiring is unchanged and sound** (double-suffix prefix, done global, host `eventMappings`, byte-identical rule of thumb). The narrative thread across items 1/4/6 (Sam Whitlow, the Hale family, the cardigan) is consistent and gives the set a spine.
- **No-blame register is clean** across cards, montage, Monday card and `noBlameLine`.

## Design findings

**D1. The four unsafe-option montage lines open with "Your choice.", which now duplicates the engine's rendered "Your call" tag.** Major, episode-local; judged from code, not a render.
This is the one live thing the MA3 engine fix created. `flip-view.js:59` sets the unsafe tag default to `"Your call"` and `:148` renders it as a `.aw-montage-tag` above every taken beat's line; because E11 authors a line for both options, `montageProps` makes `taken` true for every beat (`episode-model.js:493-496`), so the tag shows on all four. On a full run, each beat the learner handled badly renders:

> **Your call** *(tag)*
> Your choice. The overtime sheet, with the back-injury and union-meeting notes... *(body)*

"Your call" and "Your choice." say the same thing, stacked. The `mistake.json` note and spec §10a both say the framing "is in the text, not applied by the engine" — that was true when written, but the engine now applies it, so the authored prefix is redundant. The safe lines are unaffected (they open "The version where...", which pairs well with "Your call: the safe route"). Fix (drop the prefix from the four unsafe lines only), old → new, in `mistake.json` `flipMontageByChoice` and the full erb `strings.flipMontageByChoice`:

- `overtime_sheet/send_wrong_sam`: `"Your choice. The overtime sheet, with the back-injury..."` → `"The overtime sheet, with the back-injury..."`
- `caller_bernadette/give_details`: `"Your choice. Two weeks on, a stranger was waiting..."` → `"Two weeks on, a stranger was waiting..."`
- `marketing_export/export_list`: `"Your choice. A month on, three families complained..."` → `"A month on, three families complained..."`
- `redaction_send/send_as_is`: `"Your choice. Mr Hale opened the report..."` → `"Mr Hale opened the report..."`

(Alternative, if the authored "Your choice." is preferred as the voice: override `strings.flipMontageTagUnsafe` to drop the duplicate. Dropping the prefix is the smaller change and keeps the tag consistent with the other consequence-flip episodes.) This is episode-local content, not an engine bug; the engine shape in §10a still matches what is built, so no §19 stop-and-ask.

**D2. The brief's "the ordinary calls anyone would under a busy morning" has a wrong preposition and undersells the sandbox.** Minor, episode-local.
`scenario_brief` and `strings.brief` (full shell `:4` / `:371`, and the full `mission.json` description): "...First you make some of the ordinary calls anyone would under a busy morning..." You do not do something "under" a morning, and the four beats are not all "calls" (a phone call, an email send, a chat request, a report send). Fix, old → new: `"the ordinary calls anyone would under a busy morning"` → `"the ordinary choices anyone would make on a busy morning"`. Defend-only brief is unaffected (it has its own text).

**D3. The spec drifted from the shipped files in several places; only §12 was corrected at C1.** Minor, needs-user (doc). No shipped file is wrong.
`E11_misdirected_data.md` still carries the pre-C1 content in places the C1 fixer did not touch:
- §10 montage text (`:338`) still has "...By the time it reached the DPO, the first 72 hours were gone." (the MA1 text) and (`:342-343`) "a man was waiting for Bernadette at her school. He had told the desk he was her brother." (the MA2 text).
- §5 cast list (`:133`) and §11 item 2 (`:435`) still name "DC Hendry"; the shipped files and `BRAND_ADDITIONS.md` use **DC Rowley** (the C1 rename, Hendry clashing with built Pauline Hendry).
- §8b's drafted generator `LINES` (`:291-294`) differs from the shipped `gen_e8_e17_shells.py:270-273` (the shipped lines were trimmed to the word cap).
Correct §10, §5 and §11 to the shipped wording (and note §8b lines were trimmed) so no later edition rebuilds E11 from the stale spec. This is the companion to C1's MI2 doc fix.

**D4. The defend-only host welcome runs to 31 words, just over the brief's "under 30" voicing guide, and `dialoguelint` cannot catch it.** Minor, needs-user (shared generator line).
Defend-only ink `:24` and `gen_e8_e17_shells.py:271`: "You're covering the Care Laundry desk inbox. Some of it is routine, some belongs with me as DPO, some was sent to catch you out. Report anything that doesn't sit right." = 31 words. Every other host line is ≤24. `dialoguelint` reports `lines=0` (the line sits in a `{ }` block), so the 30-word cap the generator comment claims to honour is not actually enforced here. Harmless to read, borderline to voice. Optional trim, e.g. drop "with me": "...some belongs with the DPO, some was sent to catch you out..." (29 words). Fix in the generator `LINES[('e11','defend')]` first element, then regenerate the defend-only ink.

## Dialogue findings (old → new per line)

Lines reviewed: host ink (both shells), both briefs, scope notes, defend-set brief, `defendIntro`, all four sandbox situations and their eight option labels, all eight montage lines, all six defend-item bodies and their `whyFine`/`perFlagNote`/`headerNote`/`ifTrusted`/`reportReply`, the debrief `mondayCard`/`noBlameLine`/`conceptPanel`/`defendOnly`, and the rule of thumb. The register is a calm colleague throughout; no printed variables; UK English; no em/en dashes. Only the lines below would change — everything else reads well on first pass and is left as is.

| Line | Old | New |
|---|---|---|
| `strings.flipMontageByChoice.overtime_sheet.send_wrong_sam` (D1) | "Your choice. The overtime sheet, with the back-injury and union-meeting notes, sat in a care home manager's inbox for three days before anyone noticed. Three days the DPO never had, to warn the staff and limit the harm." | "The overtime sheet, with the back-injury and union-meeting notes, sat in a care home manager's inbox for three days before anyone noticed. Three days the DPO never had, to warn the staff and limit the harm." |
| `...caller_bernadette.give_details` (D1) | "Your choice. Two weeks on, a stranger was waiting for Bernadette outside her school. The birthday-surprise call was how he learned where a lone worker would be, and when." | "Two weeks on, a stranger was waiting for Bernadette outside her school. The birthday-surprise call was how he learned where a lone worker would be, and when." |
| `...marketing_export.export_list` (D1) | "Your choice. A month on, three families complained and one wrote to the regulator. The contacts had been given to sort out a lost cardigan, not to hear about offers." | "A month on, three families complained and one wrote to the regulator. The contacts had been given to sort out a lost cardigan, not to hear about offers." |
| `...redaction_send.send_as_is` (D1) | "Your choice. Mr Hale opened the report and read another resident's continence-care note and a driver's mobile number. One mistake, two more people's data exposed." | "Mr Hale opened the report and read another resident's continence-care note and a driver's mobile number. One mistake, two more people's data exposed." |
| `strings.brief` / `scenario_brief` (D2) | "...First you make some of the ordinary calls anyone would under a busy morning; then you see, six months on, where each one led." | "...First you make some of the ordinary choices anyone would make on a busy morning; then you see, six months on, where each one led." |
| Defend-only host welcome (D4, optional) | "...Some of it is routine, some belongs with me as DPO, some was sent to catch you out. Report anything that doesn't sit right." (31 words) | "...Some of it is routine, some belongs with the DPO, some was sent to catch you out. Report anything that doesn't sit right." (29 words) |

Two observations I looked at and chose not to raise as findings:
- Full-shell completion line 2, "nobody here is ever in trouble for reporting, including their own slip", has a slightly compressed construction, but it deliberately mirrors `noBlameLine` and reads correctly ("including reporting their own slip"). Leave.
- Item 6 ("the cardigan has turned up...you can close that one") sits two items after the item-4 SAR about the same family; "close that one" refers only to the cardigan complaint, not the still-live SAR, and the learner has already routed the SAR by then. Low risk, correct as the calibration item; leave.

## Voiced host lines I would change

Only one: the **defend-only welcome** (D4), for length (31 → ~29 words), and only if the voicing guide is being held strictly. The full-shell welcome, both completion lines, the defend-only completion line and the "Thanks, Tomasz." / "Any time." exchange are all ≤24 words, sound like a calm colleague, and carry no printed variable; I would leave them. (The montage "Your choice." change in D1 is on-screen flip text, not a voiced host line.)

## Verdict per stage

- **brief** — ship after D2 (one-word preposition/"calls"→"choices" fix); otherwise clean.
- **mistake (sandbox)** — ship. Four beats map cleanly to core_05/core_06; exactly one safe option each; situations and labels read well.
- **flip (montage)** — ship after D1 (drop "Your choice." from the four unsafe lines so they don't duplicate the engine's "Your call" tag). This is the one change I would hold ship on; it is trivial and content-only. The montage facts are correct post-C1.
- **defend** — ship. Six items, fair and matched, one mirror pair (items 3/4), immediate feedback carries the DPO-routing nuance; MI3 is the known shared-scorer limitation, not an E11 defect.
- **debrief** — ship. Cards, rule of thumb, Monday card, concept panel and no-blame line all correct and in register.

**Overall: ship-worthy after D1 (montage "Your choice." dedup) and D2 (brief wording).** D3 and D4 are doc/shared-generator tidy-ups that touch no shipped learner copy except the optional D4 trim. The C1 content fixes are all genuinely closed; the only new episode-local work is the montage prefix the MA3 engine fix left stranded.
