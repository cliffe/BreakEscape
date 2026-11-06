# E20 remote and mobile working — confirmation design + dialogue review, cycle 3

Episode: `e20_remote_and_mobile_working` (full) and `e20_remote_and_mobile_working_defend` (defend-only).
Company Tarrowby Logistics, host Zainab Hussain, module core_09, role `mobile`. Consequence-flip shape
(ENG-04) with the `wifiList` page state (ENG-14).

This is the confirmation round after a long fix history: design C1 (`E20_DESIGN_C1.md`), design C2 +
dialogue C1 (`E20_DESIGN_C2_DIALOG_C1.md`), the Sam persona playtest (`E19_E20_PLAYTEST_P1.md`), two blind
runs (`E20_BLIND_B1.md`, `E20_BLIND_B2.md`) and the engine/content batches logged in `BUILD_LOG.md`
(1d7b0af93, 5c0307af9, 863934bc1, 6ee2f4195, the batch 3/5/6/8 key wirings and the end-screen sweep).
Read-only; nothing edited but this file.

**Judged from code and authored data**, not a fresh render. The C1/C2 passes and both blind runs already
rendered the cards, montage, Wi-Fi list and debrief; nothing I checked here changed the rendering, and the
last E20 bridge in the log is 17/17. I confirm the earlier fixes are present in the current shells and read
each changed learner-facing string.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 0 | 1 | 1 |
| **Total** | **2** | **0** | **1** | **1** |

Shape confirmed: full `brief, mistake, flip, defend, debrief`; defend-only `brief, defend, debrief`. Defend
set six items, 3 genuine (1, 4, 5) / 3 fake (2, 3, 6), three mirror pairs. Full concept panel now **six**
cards; defend-only trimmed to **four**.

**Validators (both shells, this pass):**
- `validate_scenario.rb --strict-social --no-graph --skip-ink`: both exit 0, schema clean, only the standard
  m01-shaped SUGGESTION noise.
- `dialoguelint.mjs`: full `lines=8 median=21 max=25`, defend `lines=3 median=30 max=30`, no rule hits, no
  printed variables. The defend host set sits at the 30-word cap (not over); recorded as accepted in B2.

## Prior-finding closure

| Finding | Source | Ruling | Verified this pass |
|---|---|---|---|
| MA1 red/green Wi-Fi palette | C1 | engine fix | Closed in C2; palette neutral. Not re-checked (CSS, no content effect). |
| MI1 one aim vs two | C1 | intended | Closed. Single `tell_them_apart_aim`, matches E11. |
| MI2 dense card-3 note | C1 | fixed | Closed in C2 (byte-identical across fragment and both shells). |
| **MA2 home working promised, not delivered** | C2 | add sixth concept card | **Closed.** `conceptPanel` is now six cards; the sixth is "At home, mind the camera and what's behind you" (camera in shot, share a window, work devices for work), the spec's debrief concept card. The brief was also reworded (below), so nothing is now promised-but-absent. |
| MI3 full host done-line clipped | C2 | fixed | **Closed.** `zainab_hussain.ink:41` reads "...and when you're not sure, use your phone's hotspot." Grammatical, 20 words. |
| MI4 stale montage dev comment | C2 | fix at leisure | Not re-checked (doc-only, `mistake.json` author note; no learner effect). May still read the old way. |
| MI5 "VPN" never glossed | C2 | optional gloss | **Closed.** Concept card 5 now reads "a VPN (a secure tunnel back to the company)". |
| B1-M1 café list has no clear thing to judge | blind B1 | fixed (5c0307af9) | **Closed.** Card 1's second network is now "The Daily Grind" next door, a differently named neighbour, not a look-alike of the café's name; the card states "Trust here means joining the network the café names"; one answer (join the board-named network). |
| B2-F2 brief promises a hotel and a home morning as decisions | blind B2 / P1 F-E20-5 | fixed (863934bc1) | **Closed.** `scenario_brief` now names only the five road calls (train, café and its queue, lost tablet) as decisions, and puts the hotel in the sort ("a hotel's among them"). No home decision promised. |
| B2-F5 Trust undefined on a two-network list | blind B2 | fixed | **Closed.** Card 1 body spells out what Trust means. |
| B1-m1 "See how little it took?" after all-safe picks | blind B1 | fixed | **Closed.** The string is gone from the shell. |
| B1-m5 "the one the attackers were counting on" reads backwards | blind B1 | fixed | **Closed.** The `venue_or_hotspot` outcome now reads "...the look-alike with the stronger signal was the one the attackers were hoping you'd pick, and it got nothing from you" — outcome-neutral. |
| B1-m4 defend-only debrief carried home/out-of-earshot panels it never showed | blind B1 | fixed (5c0307af9) | **Closed.** Defend-only `conceptPanel` is four cards (Wi-Fi in proportion, look-alike/over-asking page, devices/lost, Tarrowby controls); the home and out-of-sight cards are dropped, matching its sort. |
| Montage heading "Through their eyes" | P1 F-E20-6 | fixed | **Closed.** `flipHeading` is "Later that day". |
| P1 engine set (URL font, mid-word wrap, "Web page" sender, "Inbox check" on non-email, tick boxes, autofill note) | P1 / B1 | engine batch 3A/5 | Wired per log (7ade65769, 411c555bd); not re-rendered here. Engine-owned, not E20-content. |

## What works (re-verified on the current shells)

- **MA2 is genuinely resolved, both ways.** The missing module LO (C09-LO6, home working) now has its debrief
  concept card, and the brief no longer over-promises. The learner is told they make five road calls and then
  sort; the hotel appears where it actually is, in the sort. No promised-but-absent beat remains.
- **Card 1 is now a fair awkward-genuine item.** With "The Daily Grind" as the neighbour (no longer a
  look-alike of BeanBarrow), the card has a single defensible answer: join the board-named network. The
  `whyFine` carries the reasoning and the `falseAlarmCost` carries the pressure against blanket refusal. The
  stronger-signal temptation survives without the muddle B1 flagged.
- **Proportionate, current Wi-Fi, intact.** Concept card 1, the VPN gloss and card 5 retire the "anyone on the
  café Wi-Fi can read your email" scare and narrow risk to the look-alike network and the over-asking page,
  matching `concepts.md`.
- **No-blame register holds.** "She wasn't being nosy; the screen was just there", the `noBlameLine`, and
  Zainab's "Nobody's ever in trouble for reporting."
- **Defend-only shell is coherent.** Four concept cards that match its sort, no over-promise in its brief, no
  dead `flip*` strings (generator pass 2), globals internally consistent.

## Findings

### MI-a — minor — engine / needs-user — round score below pass still records a pass and `score 100`
Blind B2 F7 and the P1 verify-run: a 35% round still sets `episode_e20_remote_and_mobile_working_defend_pass`
and the verifier reports `score 100`. `passPercent` for these awareness episodes is low by design (completion,
not mark), so this is probably intended, but it is the one thing a human should rule on before ship. Engine
behaviour shared across the awareness set, not E20-content; already flagged for a human in the blind reports.
No fix proposed here.

### MI-b — minor — needs-user (product) — the title screen shows the internal code and "(full episode)"
Blind B2 F1: the title reads "Awareness E20: Remote and mobile working (full episode)", from the mission.json
`display_name`. This is the convention on every built episode, already logged to DECISIONS_PENDING as a
product-wide question, so it is not an E20 defect. Recorded here for completeness.

## Dialogue pass (voiced host lines)

Every host line read as spoken. The full done-line (MI3) now voices cleanly. The defend welcome sits at 30
words in four short sentences ("...Nothing's real."); terse but voiceable, and recorded as a keep in B2. No
change.

## Verdict

**Ship-ready.** 0 blocker, 0 major. Every design finding from C1 and C2 (MA1, MA2, MI1–MI5) and every blind
finding that was E20-content (the café-list muddle, the over-promising brief, the backwards outcome line, the
"See how little it took?" opener, the defend-only over-carried panels, the montage heading) is closed and
present in the current shells. Both shells validate clean and dialoguelint is clean. The two remaining items
are a shared engine/product ruling (score-vs-pass) and the product-wide title convention, neither E20-local;
MI4 (a stale dev comment) is doc-only. E20 meets the blind-run done bar and nothing here holds it back.
