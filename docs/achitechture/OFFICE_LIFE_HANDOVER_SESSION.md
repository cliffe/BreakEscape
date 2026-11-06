# Office life: handover to a dedicated session

Written 2026-11-06, after slice 5. This session owns the office-life NPC work from here on: the remaining
slices and the `test_needs_sims` showcase. Another Claude session keeps working on `lab_physical_pentest`,
m07, server code and the review rounds in the same tree. Read `AGENTS.md` and `CLAUDE.md` first; they hold the
standing rules. This file adds only what is specific to office life.

## 1. What the user wants

In the user's words (2026-11-05): the Sims-style scenario should "build some behaviour that we can reuse to
bring NPCs to life, especially behaviour for office spaces and tasks. Interacting with PCs, printers, coffee
machines, etc." `scenarios/test_needs_sims` is the showcase and test bed. Keep it neutral, with no security
story. The security payoff (opportunity windows, things left behind) shows up in `lab_physical_pentest` and,
later, in the awareness course.

User design inputs that every slice must honour:

- **Social compatibility (slices 8 and 10).** Not every pair of NPCs chats. If the others don't trust someone
  (the user's example is Derek in m01), nobody joins him at the water cooler. Avoidance applies both ways.
  Design in plan section 7.3: `needsCompany: {groups, avoids}`, plus a `requireGlobal` hook.
- **Room leash, fixed per NPC (built in slice 2a).** Some NPCs are confined to certain rooms. For example,
  Derek must not walk into Maya's private office for a glass of water. Answer to OQ24: "Some NPCs (fixed per
  NPC)".
- **Presets apply only to objects the scenario declares (built in slice 4).** A preset never makes undeclared
  map furniture usable, and an object's own fields always override the preset.
- **Every feature gets tested properly:** unit tests, an addition to the showcase, and live browser proof on
  the real code path. Memory note: `new-features-need-full-tests`.

## 2. State of the slices

The plan is `docs/achitechture/OFFICE_LIFE_PLAN.md`. It went through three review rounds and an amendment
review, and every finding is folded in. The user chose slices 1, 2, 2a, 3, 4, 5, 7, 8, 10 and 11. Build them
in order, one at a time: they all touch `npc-needs.js`.

| Slice | What | Plan section | State |
|---|---|---|---|
| 0 | Own-desk work doesn't count as leaving the post | 2.11 | Built |
| 1 | Tick-cost hygiene | 2.0 | Built (5b1749a05) |
| 2 | Caught at the desk (`npc_caught_at_post`, `expectedAwayMs`) | 2.11 | Built (b670d2fcd, b6b579e39); reload reset e74fb409d |
| 2a | Room leash, private objects | 7.2 | Built (42575dda0, a80dbb358, 02f304b7c); leash proven live, game 630 |
| 3 | What the player sees: icons, carried items, typing bob, use sounds | 2.12 | Built (845dadb4c, 804e8dfde) |
| 4 | Affordance presets by object type | 2.1 | Built (aab2943c1); live games 599 and 601 |
| fix | Walk home stops yielding after 3 s; seat found from the home cell; icon anchored to the head | NPC_NEEDS_SYSTEM.md | Built (8d3520267, 80c2a8dd5) |
| 5 | Workstation indicators (away-open white dot that breathes, away-locked steady blue dot) | 2.3 | Built (b820a5d24, b2577fac1, b14016be1, fb3383de6); lab game 636 scores 100 |
| 7 | Carry outcomes and reveal slots | 2.2 Part A | Built (fcb8817a4, 3ff1efa29, f97960f2e); live game 643; leash (game 645) and lab (game 646, score 100) regressions done 2026-11-06 (`HANDOVER_OFFICE_S7.md`) |
| 8 | Speech bubbles and social pairing, with compatibility | 2.4, 7.3 | To do |
| 10 | Queues at shared machines, and chatter | 2.5, 7.3 | To do |
| 11 | Left behind (scoped: `leftBehindChance`; piles wait for slice 9, which wasn't chosen) | 2.10 | To do |

Not chosen: 6 (traits), 9 (routines), 12 (schedules), 13 (consumables). Don't build them unless the user asks.

Per-slice handover notes, all marked done, record the gotchas: `HANDOVER_OFFICE_S2A.md`, `_S3.md`, `_S4.md`.
The live-proof tables are in `scenarios/test_needs_sims/README.md`. Behaviour reference:
`docs/achitechture/NPC_NEEDS_SYSTEM.md`. Seating: `docs/achitechture/SEATING.md`.

Tests at handover: node suite 387 of 387 files; Rails 943 runs, 0 failures, 1 skip.

## 3. Files: who owns what

The two sessions share one working tree and the `:3001` server.

**This session (office life):**

- `public/break_escape/js/systems/npc-needs*.js`, `npc-office-visuals.js`, `npc-action-icons.js`,
  `workstation-state.js`, `room-hearing.js`, `office-presets.js`
- `public/break_escape/js/data/office-presets.json`
- the needs-related parts of `seating.js`, and the workstation-indicator part of `lighting.js`
- `scenarios/test_needs_sims`, `scenarios/test_needs_leash`
- office-life docs: the plan, the handovers, `NPC_NEEDS_SYSTEM.md`, and `SEATING.md` where you change seating

**The other session:** `scenarios/lab_physical_pentest`, m07 and other missions, server code, room maps and
props, and the review rounds.

Don't edit lab files. If a slice needs something in the lab (expansion step 9 needs slices 7 and 11), write it
up in the slice's report. The other session makes the lab change.

Other engine files outside this list (`npc-behavior.js`, `rooms.js`, `game.js` and so on) are shared. Change
them only as far as a slice needs, and name them in the slice report.

## 4. The lab regression after every slice

Every slice changes how the lab's NPCs behave. On the accounts floor, staff sit at their PCs, take coffee
breaks and leave their screens open or locked, and that is what opens the keylogger and USB windows. End every
slice with one lab run:

- Recipe: the "Expansion build — run 2" section and the later entries in
  `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md`. A Haiku agent runs it well.
- Pass: `verify-run.rb` reports score 100. Len's route unlocks secure_area and the player tailgates in.
  There are no "No path found" or "Failed to escape wall" warnings for staff, and no console errors (call
  `drain` before stopping).
- If the lab is broken for a reason outside your slice (the other session may be mid-edit), say so and don't
  chase it.

Add one line per slice to the "Office-life slices" note at the end of the lab's `IMPROVEMENT_LOOP_LOG.md`: the
commits, the lab game id and the score. That is how the other session picks up your changes.

## 5. Brief template that has worked

Each slice goes to one fresh agent: `general-purpose` with `model: "opus"`. Engine design work stays on Opus.
Give it the following:

1. Read `AGENTS.md`, the slice's plan sections, the Built lines, `NPC_NEEDS_SYSTEM.md` and the previous
   slice's handover.
2. Scope: this slice only. If the plan leaves a real design choice open, stop and report it rather than guess.
3. Requirements: unit tests, a neutral addition to the showcase, live proof headless on `:3001` with
   screenshots in the session scratchpad, then the regressions (`test_needs_leash` and the lab).
4. Any new static import in an engine module must be added to every JS test-harness copy list, or
   `bin/test-js` fails with ERR_MODULE_NOT_FOUND. The five lighting harness lists are the usual ones.
5. Start every playtest with `bootstrap {"tutorial":"decline","resume":"new"}`. Without it, a tutorial modal
   blocks every `__test` action (`dismissBlockingUi()` reports `ambiguous-blocking-ui` and clicks nothing).
6. Commit only your own files, with explicit paths (`git commit -m "..." -- <paths>`), after checking
   `git diff --cached --stat`. Never `git stash`, `git checkout --`, `git reset` or a whole-index commit.
   Commit before tests and live checks.
7. Never run `db:create`, `schema:load`, `migrate`, `reset`, `drop`, `setup`, or `db/seeds.rb`. The dev
   database is shared and has no backup. If a new scenario needs registering, report it.
8. Use `:3001` as it is: never restart it, and never touch `:3000`. Stop the browsers you start, by their
   own PIDs.
9. No paid art. Never rescale pixel art. Don't touch `test_seating`.
10. UK English, no attribution lines.
11. At about 150k tokens or 80 tool calls, write `HANDOVER_OFFICE_S<n>.md`, commit it and stop. Most slices
    needed two agents, so plan for a finisher.

Use a Sonnet agent to finish live checks once the code is committed. Use Haiku for the lab regression run.

## 6. Machine load

Live tests are sensitive to timing. On 2026-11-06 three stray headless browsers pushed the load average to
about 30. Playtests ran at 1.3 fps and the leash test timed out, which looked like a failure but wasn't.

- Keep at most two headless browsers running at once, across both sessions.
- Check `uptime` before a timing-sensitive check. Above about 12, wait and retry.
- If headless browsers from earlier agents are left running, ask the user before killing anything you didn't
  start.

## 7. Open findings

- **Closed (slice 7, game 643): a carry heading south.** Amara carried a printout on `walk-down-right`;
  the item draws in front of her body.
- **Minor: "leashed" vs "private_skipped".** `leashed` now fires only when a room rule removed a target.
  Passing over another owner's object logs `private_skipped` and fires no event. Mappings that care about a
  use should listen for that use, filtered by `data.npcId`. Event-mapping conditions support `&&` but not
  `||`.
- **Minor: event mappings when several NPCs share a use.** `onUse` fires for any finished use of an object by
  that NPC, whether the job was a need or a carry (sims README, engine findings 3–4).
- **Minor: "Cannot update door pathfinding - room X not initialized".** It logs about 9 times as rooms load
  in the lab, with no visible effect. It isn't in the office-life files, so leave it unless a slice runs into
  it.
- **Accounts floor pick-one menus.** Where an NPC's home is its PC tile, the tap menu offers both while the
  owner is seated. The other session accepted this, because the player uses a PC while its owner is away.

## 8. First step

Build slice 7 (plan 2.2 Part A: carry outcomes and reveal slots), then 8, 10 and 11. After each slice, report
to the user in the format of `AGENTS.md` "Reporting progress by stage".
