# E20 "Remote and mobile working": design + dialogue confirmation review C4

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E20 is a
consequence-flip episode (ENG-04) with the `wifiList` page state (ENG-14). Full = 5 stages
(`brief, mistake, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Company Tarrowby
Logistics; host Zainab Hussain; module core_09, role `mobile`.

Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted to the
awareness kind, and `E20_DESIGN_C3.md` plus the `BUILD_LOG.md` lines since. E20 was **unchanged since C3**
(both erbs still at 2026-10-30 00:05, before the C3 round): the cross-episode critical-penalty pass left E20
untouched ("E14 (50), E18 (20), E20 (35) already fair, unchanged", 8939d2bba) and batch 12's content pass did
not touch E20.

How the screens were judged: **from the file read and the engine code**, cross-checked against the C3 review,
both blind runs and the Sam persona playtest. No fresh render; the last E20 bridge in the log was 17/17.
Ran green:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: clean, only the generic
  `timedConversation` note.
- `dialoguelint.mjs` on both: full `lines=8 median=21 p90=25 max=25`; defend `lines=3 median=30 p90=30
  max=30` (at the cap, not over; recorded as accepted in B2). No rule hits, no printed variables.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 0 | 1 | 1 |
| **Total** | **2** | **0** | **1** | **1** |

Shape confirmed: full `brief, mistake, flip, defend, debrief`; defend-only `brief, defend, debrief`. Defend
set six items, 3 genuine / 3 fake, three mirror pairs. Full concept panel six cards; defend-only four.

## C3 closure

E20 is byte-for-byte as C3 reviewed it (no edit since), so every C3 ruling stands. Re-spot-checked the items
C3 marked closed and the de-jargoning:

| Item | Verified this pass | Status |
|---|---|---|
| C3: 0 blocker / 0 major, every design + E20-content blind finding closed | Files unchanged since C3; MA2 (sixth home-working concept card), MI3 (full done-line), MI5 (VPN gloss), B1 café-list, B2 over-promising brief, B1 backwards outcome line, B1 "See how little it took?", B1 over-carried defend panels, montage heading all still present/absent as C3 recorded | **Closed** |
| De-phish completeness (the E18 gap, checked against E20) | E20 sets a per-item `kindLine` on all three fakes (`:206/:244/:348`), `labels.phishCaughtLabel` "Traps spotted" (`:82`), `teamBadge` "Traps stopped for the team: {n}", `bands` "Sharp: you spotted the traps...", a set + per-item `reportReply`, `strings.teamLine` (`:500`) and `strings.allPhishRight` (`:498`). None of the engine "phish" defaults is reachable; the `phishCaughtLabel`/`isPhish`/`allPhishRight` tokens are schema key names, not player text | **Clean** |

## What works (re-verified on the current shells)

- **No "phish" reaches any E20 player-facing surface.** Risk reads as "traps"/"look-alike"/"fake page"
  throughout, including the per-item Trust/Verify feedback (the three fakes carry `kindLine`), the team line
  and the all-correct line.
- **MA2 stays resolved both ways** - the home-working LO has its debrief concept card, the brief no longer
  over-promises, the hotel sits in the sort where it belongs.
- **Card 1 is a fair awkward-genuine item** ("The Daily Grind" neighbour, not a look-alike of BeanBarrow; one
  defensible answer, join the board-named network), with `whyFine` and `falseAlarmCost` carrying the pressure
  against blanket refusal.
- **Proportionate, current Wi-Fi advice** (the VPN gloss, the retired "anyone on the café Wi-Fi can read your
  email" scare), no-blame register, and a coherent four-card defend-only shell.

## Findings

### MI-1 - a sub-pass round still records a pass and `score 100`. Minor, engine / needs-user. Carried.

Blind B2 F7 and the P1 verify-run: a 35% round still sets `episode_..._defend_pass` and the verifier reports
`score 100`. `passPercent` for these awareness episodes is low by design (completion, not mark), so this is
probably intended, but it is the one thing a human should rule on before ship. Engine behaviour shared across
the awareness set, not E20-content. Unchanged from C3 MI-a.

### MI-2 - the title screen shows the internal code and "(full episode)". Minor, needs-user (product). Carried.

The title reads "Awareness E20: Remote and mobile working (full episode)", from `mission.json`
`display_name`. The convention on every built episode, already logged to DECISIONS_PENDING as a product-wide
question. Not an E20 defect. Unchanged from C3 MI-b.

(C3 MI4, a stale montage dev comment in `mistake.json`, is doc-only with no learner effect; not re-checked,
not re-raised.)

## Voiced host lines I would change

None. Every host line reads as spoken; the full done-line voices cleanly; the defend welcome sits at the
30-word cap in four short sentences, terse but voiceable (recorded as a keep in B2). No change.

## Verdict

**Ship-ready.** 0 blocker, 0 major. E20 is unchanged since the C3 confirmation round, both shells validate
clean and dialoguelint is clean, and its de-jargoning is complete (unlike E18, E20 already sets the per-item
`kindLine`, `teamLine` and `allPhishRight` that keep "phish" off every screen). The two remaining items are a
shared engine/product ruling (score-vs-pass) and the product-wide title convention, neither E20-local. On the
course-wide top-band wording question raised in E18 C4: E20's top band is "Sharp: you spotted the traps and
knew why" (`:102`); if the course standardises on "Well done:" it should change here too. A timed full run to
confirm the ~15-minute budget is still worth doing, as for every episode.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor (1 engine, 1 needs-user; both carried).
- Prior closure: E20 unchanged since C3, so every C3 ruling stands; re-spot-checked - de-phish complete
  (kindLine on all three fakes, teamLine, allPhishRight all set), MA2 and every E20-content blind finding
  still closed.
- Blocker: none.
- Major: none.
- Verdict: ship-ready as-is; MI-1 (sub-pass still records a pass / score 100) and MI-2 (title shows the
  internal code) are carried engine/product items, the top band ("Sharp:") follows the E18 C4 course-wide
  decision, and a timed run confirms the budget.
