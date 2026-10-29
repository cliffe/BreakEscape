# E20 remote and mobile working — design review, cycle 1

Episode: `e20_remote_and_mobile_working` (full) and `e20_remote_and_mobile_working_defend` (defend-only).
Company Tarrowby Logistics, host Zainab Hussain, module core_09, role `mobile`. Consequence-flip shape
(ENG-04), with a new `wifiList` page state (ENG-14) for the Wi-Fi mirror pair.

Reviewed against `REVIEWER_BRIEF.md`, `episodes/E20_remote_and_mobile_working.md`,
`modules/core_09_remote_and_mobile_working/concepts.md`, and the E5/E6 overlap in `00_COURSE_OVERVIEW.md`.
Read-only review; nothing edited but this file.

**Judged from:** the two fragments (`e20/mistake.json`, `e20/defend.json`), both built shells, the host ink,
the validators below, and five rendered screenshots (`scratchpad/aw2/wire-e20/shots/`: sandbox, montage, the
two Wi-Fi cards, the debrief). The two Wi-Fi cards, the montage and the debrief are judged from renders; cards
3–6 and the brief/scope copy are judged from code. The montage's styling of a safe pick as a mistake is the
known engine issue flagged in the task and is not raised here.

## Counts

| Thing | Count | Notes |
|---|---|---|
| Full stages | 5 | `brief, mistake, flip, defend, debrief` |
| Defend-only stages | 3 | `brief, defend, debrief` (attack stages correctly dropped) |
| `mistake` beats | 5 | each one everyday choice, one `safe: true`, position varied beat to beat |
| Defend cards | 6 | 3 genuine (1, 4, 5), 3 fake (2, 3, 6); three mirror pairs |
| Concept cards | 5 | ENG-09b array; all five carried into both variants' debrief |
| Scenario-local tells | 3 | `lookalike_network`, `wifi_page_credentials`, `found_device_lure` |
| Host ink lines | full 8 / defend 3 | dialoguelint max 25 (full) / 30 (defend), no rule hits |
| New named cast | 1 | Zainab Hussain (name-clash check recorded 2026-10-29) |

**Validators (all clean for E20):**
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both `.json.erb` shells: schema passes; only
  the standard m01-shaped SUGGESTION noise (22 items) that applies to any one-room awareness kiosk.
- `dialoguelint.mjs` on both folders: full `lines=8 max=25`, defend `lines=3 max=30`, no rule hits, all host
  lines under 30 words, no printed variables.
- `social-awareness-fragment-erb-parity` + `rule-of-thumb`: E20's own parity subtest passes (`ok 19`), and
  E20's two shells sit inside the registered set carrying `ruleOfThumb`. The three red subtests are **not
  E20**: they name `awareness_e18_credential_attacks_at_scale` (and its defend shell), an unregistered
  episode already in the git working tree. Flagged so the orchestrator does not read the red as E20's.

## What works

- **Public Wi-Fi is taught in proportion, in the text.** The "Public Wi-Fi, in proportion" concept card, card
  1's `whyFine` ("ordinary work on it is fine"), and card 4 all match `concepts.md` and retire the old "anyone
  on the café Wi-Fi can read your email" scare. The risks are correctly narrowed to the look-alike network
  and the over-asking page. This is the thing the brief told me to check hardest, and the authored copy is
  right. (One rendering caveat below undercuts it: major MA1.)
- **One repeatable lesson.** "Check the network's name, let the VPN do its job, and never type your work
  password into a Wi-Fi page" is the spine, carried by the shared rule of thumb and restated across the
  sandbox, the montage headline (`cafe_wifi`), the defend cards and the Monday card.
- **Fair defend set.** Three genuine items so refusing everything is the wrong instinct: card 1 is the awkward
  genuine item (a stronger look-alike sits right beside the real network, so trusting needs the board), and
  card 4 is the genuine portal placed straight after the fake page (card 3), the "similar genuine item after a
  likely miss". Each genuine item carries a `falseAlarmCost`; each fake a `perFlagNote`, `ifTrusted` and
  `reportReply`. Verify is on, so "ask the venue / ring the desk" scores. (The product-wide convention that a
  reported genuine item still scores full is in play here as everywhere; the teaching pressure against
  over-caution is the `falseAlarmCost` text, not the score.)
- **No-blame register is clean throughout** — the montage lines show harm as information reaching people with
  no reason to see it, no bystander steals anything, and the `noBlameLine` plus Zainab's "Nobody's ever in
  trouble for reporting" close it out.
- **Overlap handled.** Card 3 cross-references E5 (padlock only means encrypted, not honest) in its
  `perFlagNote`, so the two episodes do not contradict. The E6 look-alikes `tarrowby-wifi.example` and
  `tarrowbey.example` are reused, not redeclared. No text/QR/work-phone lure (E6) and no
  download/update/fake-check (E10); card 6's lost-device sign-in lure is a topic neither covers.
- **Fonts and sizes.** SSIDs render in the address font at 15px, the meta row at 13px, nothing below 13px.
  Domains in the page cards use the address font. The `wifiList` card reads as English on both renders.
- **Defend-only shell is correct**: `mistake`/`flip` dropped, all five concept cards and the rule of thumb
  carried, brief/scope identical to the full shell's `_defendOnly` block.

## Findings

### MA1 — major — engine — the Wi-Fi card paints open networks red and secured networks green
`public/break_escape/css/inbox-triage-minigame.css:405-406` (`.tri-wifi-secured { color:#1f5d33 }` green,
`.tri-wifi-open { color:#8f2a1f }` red), rendering the `wifiList` state's `secured`/`open` labels.

The `wifiList` state colours "Open (no password)" in warning red and "Secured (password needed)" in reassuring
green. That is the visual claim *password = safe, open = risky* — the exact misconception `concepts.md` sets
out to debunk ("The café's Wi-Fi has a password, so it's private → Everyone in the café has the same password.
Treat it as public.") and the opposite of E20's proportionate lesson. In E20 every network is open, so the
concrete effect on the screen is that the **correct-to-trust** network (BeanBarrow Guest, card 1) is painted
red (visible in `4_wifi_venue.png`). Mitigations: both networks in each card share the same colour, so the red
is not the discriminator within a card, and the board note and `whyFine` carry the right lesson in words — so
a careful reader still learns correctly. But this is the single axis the brief told me to scrutinise, and the
colour quietly pushes the wrong model.

Fix (engine, owned by the `wifiList`/ENG-14 surface, not E20-local — it affects any future `wifiList` card):
render the open/secured labels in a neutral colour (e.g. reuse the 13px meta grey) rather than red/green, so
"open" is stated as fact, not flagged as danger. If a secured/open contrast is ever wanted as a tell, it
should be opt-in per card, not the default palette.

### MI1 — minor — needs-user — the spec's two-aim shape was built as one aim
`scenarios/awareness_e20_remote_and_mobile_working/scenario.json.erb:24-50`.

The spec (§8b) tabulates two aims (`two_days_aim` "Walk the two days", then `tell_them_apart_aim`). The build
has a single aim, `tell_them_apart_aim` (order 0, `missionConclusion: true`), with the two days folded into
its `description` only. This **matches the actual built E11 reference** (`desk_inbox_aim`, one aim), which the
spec told the implementer to confirm against (§20, "confirm the exact gating global against E11's built
shell"), so it is defensible and probably the right call. Effect: the sandbox half has no objective line of its
own, and the aim title names only the sorting. No functional problem; the `mistake` stage still completes and
the defend-done global drives conclusion. Confirm the single-aim decision was intended, since it departs from
the written §8b table while following the real E11.

### MI2 — minor — episode-local — card 3's per-flag note is dense for a first read
`planning_notes/phishing_and_social_engineering/awareness/e20/defend.json:114` (mirrored in the full erb).

The `wifi_page_credentials` note packs three ideas into ~70 words (over-asking → "Not secure" → the padlock
myth / E5). It is accurate and well written, but long for a non-technical learner skimming immediate feedback.
Optional tighten, e.g. split the padlock point into its own sentence or lean on the concept card for the E5
link:
old → "...The bar here also reads 'Not secure', so others on the network could read what you send. Even behind
a padlock, a Wi-Fi page asking for your work sign-in is a fake: a padlock only means the connection is
encrypted, not that the page is honest (see E5)."
new → "...The bar here also reads 'Not secure'. Even with a padlock, no Wi-Fi page needs your work password —
a padlock only means the connection is encrypted, not that the page is honest (see E5)."
Not a blocker; the current text reads fine.

## Verdict

**Ship-worthy; no episode-local blockers.** E20's authored content is clean: the Wi-Fi advice is proportionate
and current, the lesson is single and repeatable, the defend set is fair with a genuine awkward item and a
genuine item after the likely miss, the no-blame register holds, facts match core_09 `concepts.md`, the E5/E6
overlap is handled without contradiction or repeat, both shells validate, and parity and dialoguelint pass.

One major finding (MA1) is an **engine** concern on the shared `wifiList` card state, not E20 content: the
red/green open/secured palette works against the proportionate-Wi-Fi lesson and should go to the ENG-14 owner
for a neutral restyle before this card state ships widely. MI1 (one aim vs the spec's two) needs a yes/no from
the user but matches the real E11 reference. MI2 is an optional wording tighten.

Recommend: route MA1 to the engine owner, confirm MI1 with the user, and this episode is done for C1.
