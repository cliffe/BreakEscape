# m05 Insider Trading: puzzle chains review, pass 5 round 2

Reviewer: Opus, read-only (this file is the only write). Date: 2026-10-13. Skill: `mission-puzzle-chains`, run against the working tree after commit `158b2a60` (round-1 fixes). Probe routes are in the session scratchpad under `m05-puzzle-r2-reviewer/`.

Kind of game: SAFETYNET campaign mission, a TV spy thriller. Aim for this stage: the locks chain, the player earns what they get, the deduction isn't handed over, red herrings cost something, kit is cumulative, and the VM flags are required and woven in.

## Checks run (static; no browser session started)

- **Routes:** all 21 (`scripts/ink_runtime_check/m05_routes/r1`–`r21`) print `[result] all expectations met`.
- **Validator** `--skip-ink --no-graph`: schema, geometry and door alignment pass. 10 same-pattern wiring warnings (the intended ones, including the two new ones the fixer logged: `flag4_submitted` and `fingerprint_collected:david_torres`). Issue 12 (timed texts on `object_interacted` less than 4 s apart) is discussed under the findings.
- **dialoguelint:** 0 errors; the same pre-existing check (Recruiter L87) and warning (L352).
- **Working tree:** `git diff 158b2a60 -- scenarios/m05_insider_trading scripts/ink_runtime_check/m05_routes` is empty, so this review reads exactly what round 1's fixer committed.

## Confirmation of round 1

Each claim checked against the file, not the log.

| # | Round-1 outcome | Checked | Verdict |
|---|---|---|---|
| P1 / D-D | Hint ladder re-tiered; `door_log_hinted` bars the reward | `phone.ink:934-940`: tiers read "The badge log's in your kit. Read it." → "That log says Halloran's spare. Ask her where it lives." → (Halloran asked *and* `torres_reason_guessed`) "Her spare goes in at night. Look at who comes through the front door just before it." with `~ door_log_hinted = true`. The term is in all four reward conditions: `erb:178`, catch-all `erb:183`, `torres_confrontation.ink:105`, `closing_debrief.ink:266`. Global declared `erb:686`; VARs in the inks that read it. r18 (reward kept after tiers 1-2) and r19 (no reward after tier 3) pass | ✅ Implemented. See note N1: the flag can't change anything today |
| P2 | Halloran after her alibi is a guess | `~ torres_reason_guessed = true` in all three alibi branches: `patricia.ink:340`, `phone_patricia.ink:154`, `phone.ink:425` | ✅ |
| P3 | Flag texts name the flag, no counts; every flag ticks the portal task | `erb:938-971`: "Login / Foothold / Manifest / Root flag" texts; `completeTask: access_bludit_vm` on flags 1-3 and a separate unconditional flag-4 mapping (`erb:967-971`). Out-of-order flags added to D3 for the user | ✅ |
| P4 | The print toast splits on `data.identified` | `erb:1146-1161`. `identified` is top-level in the payload and sticky once true (`biometrics.js:79-96`), so a second lift can only move from "didn't match" to "That's Torres' print.", never back | ✅ |
| P5 | Status asks whether the player is in, not how | `phone.ink:896`: `not server_password_obtained and not server_room_entered`. r21 passes | ✅ |
| P6 | Patricia's sign-off waits for Owen's refusal | `owen_refused_password` set at the top of `request_password` (`owen.ink:243`); gated in `patricia.ink:298` and `phone_patricia.ink:110`; declared `erb:687`. r20 passes. Owen's knot always asks for a reason first (`owen.ink:245-250`), so "refused" is honest. See R2-3 for one hint that now runs ahead of it | ✅ |
| P7 / D-C | Clone and Halloran's ask before the reader | Rejected by the coordinator and logged as D11 for the user (pass 3 made the clone fast on purpose). The coordinator's check holds: the staff directory and Patricia both name the badge-only hallway before either ask | ✅ Rightly deferred. It reverses a recorded earlier decision, and its cost is pace, not solvability or fairness |
| P8 | The visitor spare story | Halloran's hand-over and the variant line (`halloran.ink:203-232`), the item renamed "Visitor Spare (#4471)" (`erb:1670-1675`), the Lab Rules notice line 3 (`erb:1690`) | ✅ Implemented. It opens a new gap: R2-2 |
| P9 / D-A | Why the second print can't be lifted | Halloran's `ask_vault` (`halloran.ink:150-151`, `:193-198`), shown once the vault is heard of; the Lab Rules notice, rule 1 (`erb:1686-1692`), readable with her down | ✅ Implemented. Does it end the hunt? See "Probes" |
| P10 | HaX's hub can show 14 choices | Deferred to the dialogue phase | ✅ Deferred, correctly (a menu-length fix, not a puzzle one) |
| D-B | Journal in the locked briefcase | `erb:1605-1626`: the journal in `torres_briefcase.contents`, "zipped into the briefcase's inside pocket"; the briefcase "locked and heavy with papers. Pin tumbler."; `find_journal` optional (`erb:379-387`); HaX's "A personal journal…" still keyed on type + `data.itemId` (`erb:931-935`) | ✅ Implemented. The no-picks fallback has a hole: R2-1 |
| D-E | D1 (flag-3 manifest) | Unchanged, with the user | ✅ Carried |

## Probes

Route files in the session scratchpad, `m05-puzzle-r2-reviewer/`. Each was run with the m05 driver.

**p1, the hint ladder against the reward** (`p1_ladder_max_without_guess.json`). Climb the ladder as far as it goes without a wrong answer: badge log from Owen, status, Halloran asked, Lab Rules read, status twice more.
- HaX gives "Ask her where it lives." and then "You've got a pattern on that sheet. Take it to Patricia…". No rung says "front door". `door_log_hinted` stays false.
- The method rung needs `torres_reason_guessed` (`phone.ink:938`), and that flag already bars the reward on its own. So **no hint that gives the method can coexist with the reward.** The answer to the brief's question is no: "NAMED ON THE EVIDENCE" can't be earned with a method hint.
- Other places the method is spoken, checked by grep for "front door" and "six minutes": all are after a naming (`patricia.ink:411`, `:494`; `phone.ink:478`, `:535`), after an accusation (`phone.ink:930`, `erb:1065`), or are the reason-menu option itself (settled in round 1). None comes before a first-time naming.
- Side finding (N2): the first rung, "The badge log's in your kit. Read it.", can't show. A note handed over by an NPC fires its `onRead` before `item_picked_up` (`npc-game-bridge.js:30-37`, then `:40`), so `found_door_log` is true before the mapping at `erb:1022` sets `door_log_held`. The probe went straight to rung 2.

**p2, the no-picks motive on the VM-first route** (`p2_vm_first_no_picks.json`). Patricia met, flags 1–3 in, badge log never fetched, Halloran never asked, briefcase never picked.
- Flag 3 sets `torres_suspected` and `case_exfil` (`erb:1045-1052`). HaX's status: "You can see it leaving under his name. Now find out why: his office, the break room, Patricia's files." (`phone.ink:955`).
- The break room: Lisa tells the Elena story ("the insurer won't touch it"), and no motive flag changes. `has_motive()` reads only the bills, the journal and the vetting file (`patricia.ink:65-66`).
- Patricia's files: "Vetting files are restricted. Bring me a name or a pattern and I'll pull the ones that matter." The gate is `found_door_log or halloran_questioned` (`patricia.ink:279`). It ignores `torres_suspected`, though the player now has the name and the server has "his staging manifest, under his own name".
- His office: the journal and the bills are both in the locked briefcase now.
- So this player's motive needs the picks, or a detour HaX no longer mentions (incident log → Owen → badge log, or Halloran asked on the log). That's **R2-1**. Before D-B it couldn't happen, because the journal lay on the desk.

**p3, Patricia's sign-off before Owen refuses** (`p3_patricia_signoff_hint.json`). Door and notice seen, Owen never asked.
- HaX: "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off." (`phone.ink:903`).
- Patricia's request menu offers only the vetting files. The sign-off is gated on `owen_refused_password` (`patricia.ink:298`). That's **R2-3**.

**p4, the second print and the visitor spare** (`p4_vault_hunt_and_spare.json`). The password from Owen on the incident log, the vault reader tried, nothing suspected.
- Bark: "Two prints enrolled: Dr Halloran's and David Torres'. You've got the kit." Halloran then offers "[The key vault takes your thumbprint. Could someone have lifted it?]" and answers "Off me? Not in this lab. Gloves at the bench…". The Lab Rules notice says the same. `torres_suspected` stays false.
- **Does it kill the hunt for a second print?** Yes, where the player would hunt. The lab is the only place Halloran works and the only room a player would dust for her. Both her answer and the notice are there, and the notice works with her knocked out. The only print surface in the scenario is still Torres' mug (`erb:1596-1597`).
- It doesn't hand over the who. It tells the player that a way into the vault runs through Torres' print, but his office is behind `torres_suspected` (the office-card asks, `owen.ink:137`; `patricia.ink:291`). Naming still needs a reason from the menu.
- One leftover line: HaX's last fallback, "Work out which you're after before you hunt for a print." (`phone.ink:959`), now asks the player to choose between two prints when only one can be lifted. That's R2-4.

## Fresh pass with the skill

Five cycles over the changed pieces: the boss-key table, the four design questions, the bug sweep, softlocks (S1 and S2 in `docs/agents/SOFTLOCK_PATTERNS.md`), and reloads.

- **Boss-key table.** Unchanged except the briefcase, which is now the main motive container. That's still ✅ by design (m01 picks), and it now spends that kit on the route most players take. The briefcase's observation ("locked and heavy with papers") and HaX's guide on the first try signpost it. The leaflet's "small neat capitals and blue ink" (`erb:1413`) still matches the journal's (`erb:1622`), so the handwriting link now pays off only for a player who picks the lock. That's a fair reward.
- **Would each object exist anyway?** The journal in his own locked briefcase: yes. The Lab Rules notice: yes, a lab lead writes house rules. Rule 3, though, now tells the player where a server-hallway key hangs, and nothing hangs there (R2-2).
- **Wiring.** The journal is read from a container: `handleInteractiveItem` fires its `onRead` and then `item_picked_up:notes` with `itemId` (`container-minigame.js:476-503`). So `find_journal` ticks and HaX's "A personal journal…" text fires, exactly as the bills do. All new conditions are `&&`-only with single-level `data.` keys. The new globals are declared (`erb:686-687`) and given `VAR`s in every ink that reads them.
- **Validator issue 12** (the lockpicking-guide text and the VM-launcher text on `object_interacted` less than 4 s apart): a false positive, as in round 1. Their conditions differ on `data.objectName`, so one interaction can't fire both.
- **Softlocks.**
  - `owen_refused_password`: if Owen goes down before he's asked, the relay authorises the password (`phone.ink:574-594`). If Patricia goes down, she authorises it automatically (`phone.ink:549`). Owen's ask re-offers until `password_handed`. No S1 or S2 problem.
  - The optional `find_journal` leaves the "Find Out Why" aim finishable on the card and the room alone.
  - No new gate can strand a player.
- **Reloads.** `gave_spare` and `asked_vault` are ink-local, and NPC story state is held in memory only (`npc-conversation-state.js:12`, `:60`, `:113`; the backlog item "save conversation state with the game" exists because of this). After a page reload `asked_vault` just re-offers a harmless topic. `gave_spare` resetting brings back the line P8 removed (folded into R2-2).

## Findings

Counts: **0 blockers, 0 majors, 4 minors**, plus four notes.

| # | Sev. | Where | Finding | Concrete fix |
|---|---|---|---|---|
| R2-1 | minor | `m05_npc_patricia_morgan.ink:279`, `m05_phone_agent_0x99.ink:955` | **The no-picks motive fallback fails on the VM-first route** (probe p2). D-B moved the journal into the locked briefcase, so this gate now matters. A player who reaches suspicion through flag 3, without the badge log or Halloran, is told by HaX to look in "his office, the break room, Patricia's files". The office's papers are all behind the picks. The break room (Lisa) sets no motive flag. Patricia refuses the files with "Bring me a name or a pattern", though the player has the name and the server has his manifest. Not a softlock: the picks are in the start kit and HaX offers the guide on the first try, and the badge-log detour still works. But the log's claim that "the motive doesn't depend on the briefcase" holds only for badge-log players. | (1) Add `torres_suspected` to Patricia's vetting gate (in person only; her phone has no vetting ask): `{not (found_door_log or halloran_questioned or torres_suspected): …}`. Suspicion already exists by then, so this doesn't break round 2's "the files answer the badge log" rule (M1). (2) In HaX's line, swap "the break room" for something that pays off: "Now find out why: what he keeps in his office, or Patricia's vetting files." (3) Promote p2 to a route (r22): VM-first, no picks, the files given on suspicion, named on the vetting file and the manifest |
| R2-2 | minor | `scenario.json.erb:1690` (Lab Rules, rule 3), `:1675` (the item's observation), `m05_npc_dr_halloran.ink:229-233` | **The visitor spare is now advertised on a hook that isn't there.** Rule 3 says "The visitor spare (#4471) lives on the hook by the door." The badge's observation says "It hangs on the hook by the lab door." Halloran says "nobody signs it out". That's exactly how Torres took it. A player who reads the notice before winning Halloran over goes to the door, finds no hook and no badge, and gets no reason why: the same dead-end hunt that D-A fixed for the print. The observation is also wrong once the badge is in the kit, or lying by Halloran after a KO (it drops from her `itemsHeld`). And after a page reload, `gave_spare` resets, so a player carrying the badge hears "It hangs on the hook… I haven't touched it in months." | Make the notice and the item honest about where the badge is tonight, without adding a free route. Recommended: rule 3 → "3. The visitor spare (#4471) is signed out through me. Visitors only." Observation → "The research lab's visitor spare, badge #4471, registered to Dr Halloran. It opens the server hallway." For the reload case, key the variant on a synced global set when the badge is taken (a separate `item_picked_up:keycard` mapping for `research_lab_badge` beside the shared one at `erb:907-914`), not on the ink-local `gave_spare`. Then tell room dressing (m12) the hook is a prop: empty, or not interactive. Don't make the badge takeable from it. That would give a third free hallway route and undercut Halloran's rapport route and D11 |
| R2-3 | minor | `m05_phone_agent_0x99.ink:903` | **HaX names Patricia's sign-off before it exists** (probe p3). "…Patricia's incident log has one, or ask Patricia to sign it off." shows once the door or notice is seen. Since P6, Patricia offers the sign-off only after Owen refuses, so a player who goes straight to her finds nothing. | Two whole-line variants on `owen_refused_password`. Not yet asked: "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one." Asked and refused: "Owen wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off." One spoken line changed, one added |
| R2-4 | minor | `m05_phone_agent_0x99.ink:959` | **"Work out which you're after before you hunt for a print"** offers a choice that D-A has taken away. Only Torres' print can be lifted (Halloran's gloves rule, the notice). | "The vault takes one of two prints, Halloran's or Torres'. Don't go hunting until you know whose door you'll be knocking on." Or drop the second sentence. One spoken line |

**Notes (no fix needed):**
- **N1.** `door_log_hinted` is inert today. The only rung that sets it needs `torres_reason_guessed`, which bars the reward by itself. The fixer logged this as deliberate, a guard in case the ladder changes. That's fine. Keep it.
- **N2.** The first ladder rung ("The badge log's in your kit. Read it.", `phone.ink:934-935`) can't show. Owen's hand-over and the KO pickup both fire the log's `onRead` before `door_log_held` is set (`npc-game-bridge.js:30-40`; `erb:1022`). It's harmless dead text. Drop it in the dialogue phase or leave it.
- **N3.** `TESTING_WALKTHROUGH.md:49` still says the journal is on the "(desk)". Steps 12 and 14 there are current.
- **N4.** The `research_lab_badge` item has two `_comment` keys (`erb:1668` and `:1674`). JSON keeps the last one, so the first is silently lost. Merge them.

## Severity summary

| Round | Blockers | Majors | Minors | Notes |
|---|---|---|---|---|
| 1 | 0 | 1 | 9 | — |
| 2 (this) | 0 | 0 | 4 | 4 |

## Verdict

**Converging. Nothing above minor.** Round 1's major (P1) is closed: no hint that gives the method away can coexist with the reward (probe p1). P2–P6, P8, P9, D-A, D-B and D-D are implemented as logged. D-C was rightly deferred to the user as D11, and P10 to the dialogue phase.

Round 2's four minors are text and gate tweaks, each a line or two. None needs a new mechanic.
- R2-1 is the only one that touches the puzzle. It's a gap in the D-B fallback for one entry order. One condition closes it.
- R2-2 to R2-4 are honesty fixes: a hint ahead of its gate, a choice that no longer exists, and a hook that isn't there.

**Recommendation: fix R2-1 to R2-4, confirm them statically (routes plus a new r22 for R2-1), then close the puzzle-chains stage with the browser check below.** A third review round isn't needed unless the fixes go beyond what's listed. If the coordinator wants the usual round-3 confirmation, it should be a confirmation only.

Spoken lines the fixes touch: R2-3 (one changed, one new), R2-4 (one changed), and R2-1's HaX line (one changed). R2-2 changes documents only, unless the Halloran variant's wording changes.

### Browser checks before closing

Sonnet, keyless server on :3001, one or two short runs with a mid-mission reload. These are round 1's open checks (no browser session has covered them yet) plus round 2's:

1. **Reward kept after rungs 1–2.** Badge log from Owen → "Where do I stand?" (expect "Ask her where it lives.", no front-door words) → Halloran → front-door reason first time → early naming → Torres' "You're early…", the debrief line, and NAMED ON THE EVIDENCE in the credits.
2. **No reward after the method rung.** A wrong reason (or Halloran named after her alibi: "Try again."), then "Where do I stand?" gives "Her spare goes in at night…". The right reason → no "You're early", no reward credit.
3. **Journal from the briefcase.** Pick it: `find_journal` ticks, and HaX's "A personal journal. Call me once you've read it." arrives.
4. **No-picks, VM-first motive (after R2-1).** Flag 3 first, briefcase left shut: Patricia gives the vetting files on suspicion; naming goes through.
5. **Patricia's sign-off.** Hidden before Owen's ask, shown after. HaX's status line matches (after R2-3).
6. **Unidentified lift.** Pick a wrong name in the dusting game: "Print's lifted off his mug. You didn't match it…"; the vault still opens.
7. **Second print.** Vault reader first, then the lab: Halloran's gloves topic and the Lab Rules notice; the notice no longer points at a hook (after R2-2).
8. **Visitor spare across a reload.** Halloran hands it over → reload → "Your spare badge…": the line agrees that the player holds it (after R2-2).
9. **Typed password.** Enter the server room without Owen's note → "Where do I stand?" doesn't send the player back to Owen.

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 2 of the pass-5 puzzle-chains stage.
