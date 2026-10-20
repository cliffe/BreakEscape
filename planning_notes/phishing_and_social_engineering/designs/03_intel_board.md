# 03 — Intel board (evidence & target-profile tracker)

Status: plan, 2026-10-20. Records what the OSINT browser (`02`) and physical recon turn up, and
turns scattered facts into a target profile the player builds the attack from. Doubles as the
progress tracker and, in defender mode, the threat-intelligence view (book Ch. 12).
Round 1 reviewed (REVIEW_03_R1.md: 0 blockers, 2 majors, 4 minors) and reconciled against
`00_data_contract.md` (readiness rule in §4, join key in §1); R1 items folded in below.

## Purpose & audience

A **board the player returns to** that collects discovered facts, groups them by person/company,
and shows what's still missing. It makes the recon→pretext link explicit: the player sees "I know
Melanie trusts Jed and expects a Friday balance sheet" and *then* goes to compose. All three
audiences. Maps to book Ch. 3 (preparing/planning — the scoping worksheet becomes the board's
frame), Ch. 6 (people OSINT), Ch. 12 (threat intel, defender mode).

## Player goal in their own words

"Keep track of what I've found, and see what I still need before I can hit this person."

## The loop

A corkboard/case-file overlay (house style). Intel facts arrive automatically as the player finds
them (from `02`'s intel events, and from physical-recon interactions in a mission). Layout:

- **People cards:** one per target — name, role, address, and the facts found about them (trusts,
  expectations, interests), with empty slots for facts not yet found ("Expects: ???").
- **Company panel:** email pattern, tech stack, key dates, processes.
- **Attack-readiness:** per target, a small checklist of the **recon prerequisites** a credible
  approach needs — derived from the OSINT intel that *backs* the recon-fed factors, **not** from
  04's craft factors (several of which, `addressedTo`/`urgencyCalibrated`/`senderAuth`, are about
  what the player *writes*, not what they *collect*, so they can never tick off intel). The map and
  rule are in `00_data_contract.md` §4. Slots are phrased as **intel gaps, not factor names**, so the
  board nudges without handing over the pretext recipe (REVIEW_03 M1, M2).

**Readiness rule and worked example** (BRIEF §4; fixes REVIEW_03 M2, minor-3). Melanie Pierce's card
has two recon slots. As `02` intel lands:

```
Melanie Pierce — Finance                          [ Not ready ]
  ✗ You don't yet know who she'd open an email from.      (needs: pierce_trusts_jed, email_pattern)
  ✗ You don't know what she expects to receive.           (needs: pierce_expects_balance_sheet)
```
(Two slots, matching the two authored `readinessSlots` below. The expected *file type* rides along
with `pierce_expects_balance_sheet` — "a balance sheet" implies a spreadsheet — so it isn't a third
slot.) After the player collects `intel_email_pattern`, `intel_pierce_trusts_jed` and
`intel_pierce_expects_balance_sheet`, both slots tick and the card flips:
```
Melanie Pierce — Finance                          [ Ready to approach ]
  ✓ She trusts Jed Baker; you know the email pattern.
  ✓ She expects a Q3 balance sheet from Jed, on Fridays.
```
The literal "ready" line is "Ready to approach — you have enough to craft something she'll believe."
It never names the factors or spells out the message.

The player does light work here, not just reading: optionally **link** a fact to a target ("who does
this post belong to?"), or **derive** the email pattern into the company panel. Keeps it active.

## Scenario-authored data

Mostly derived — the board reads the `intelFacts` from `02` and the `requiredFactors`/`primedFor`
from `04`, so an author doesn't duplicate content. A scenario can add framing:

```jsonc
"intelBoard": {
  "title": "Operation / engagement name",
  "scopeNote": "Authorised engagement against FICTIONAL AccountingNow. In-scope: email, OSINT.",
  "people": ["pierce","lord","hampshire"],   // staff/target ids; join key is the shared `id` from 02 §1 + 04
  "readinessSlots": {                          // explicit prerequisite map per target (00 §4); NOT 04's factors
    "pierce": [
      { "label": "Who she trusts", "needsIntel": ["pierce_trusts_jed","email_pattern"],
        "goalString": "You don't yet know who she'd open an email from.",
        "doneString": "She trusts Jed Baker; you know the email pattern." },
      { "label": "What she expects", "needsIntel": ["pierce_expects_balance_sheet"],
        "goalString": "You don't know what she expects to receive.",
        "doneString": "She expects a Q3 balance sheet from Jed, on Fridays." }
    ]
  }
}
```

The cards merge company-site staff (`02`), the social profile (`02` `person:`) and the `04` target on
the shared **`id`** — so every staff entry must carry one (required in `00` §1; REVIEW_03 minor-4).

`scopeNote` carries the ethics/authorisation beat (book Ch. 2) on the board the player sees most.

## Engine wiring

New component `public/break_escape/js/minigames/intel-board/`, an **openable overlay** started via
`startMinigame` (like the notes minigame — there is no always-on tab framework, so "persistent
panel" means the *data* persists, not that the panel stays on screen; REVIEW_03 minor-6). Listens for the intel-collected events from `02`, reads `04`'s target definitions to
build readiness checklists, persists to game state so facts survive a reload (the fingerprint W1
lesson). Setting a target "ready" can set a global (`set_global`, `apply-actions.js:33`) a scenario
uses to open the composer or prompt HaX.

### New engine work

| # | Item |
|---|------|
| N1 | `intel-board` overlay: people cards, company panel, readiness checklist |
| N2 | Subscribe to intel events; persist collected intel in game state across reloads |
| N3 | Read `04` target factors to render readiness; emit "target ready" global |
| N4 | Optional light interactions (link fact→person, derive pattern) with their own feedback |

## Reuse across audiences

- **Student lab:** full board; the scoping/readiness framing; **defender mode** turns it into a real
  threat-intel product (book Ch. 12), not just a reskin — each leaked fact is paired with a one-line
  "reduce this" note (e.g. "Friday balance-sheet routine posted publicly → keep internal process off
  the public site"), so it reads as recommendations, not a relabel (REVIEW_03 minor-5).
- **Awareness:** a simplified "what we found about you" reveal at the episode's end — the gut-punch.
- **Mission:** the case file HaX references; readiness gates the next objective.

## Assets

- Corkboard/case-file background, pinned-card and string pixel art (PixelLab), empty-slot markers.
- Reuses character portraits for people cards.

## Open questions

- OQ1: persistent panel (always a tab, like the notebook) vs an object you open? Default: openable
  from a "case file" object and from the phone, persistent data either way.
- OQ2: how much manual linking before it's busywork? Default: auto-collect facts; one or two
  satisfying manual deductions per scenario (email pattern, "whose post is this?"), not every fact.
