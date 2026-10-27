# Stage 0 review, round 4: final confirmation (design and accuracy)

## Scope and method

Reviewer: fresh, read-only (Opus), 2026-10-21, round 4. Read: `docs/agents/FINALE_BRIEF.md`; `.claude/skills/mission-alignment-plan/SKILL.md`; `finale/FINALE_ARC.md` (ARC) in full, with §12 (round 3 outcomes) and §13 (handover); `m09_digital_archaeology/stages/stage_0_initialization.md` (S0-m09); `m10_full_disclosure/stages/stage_0_initialization.md` (S0-m10); `finale/REVIEW_STAGE0_R3_DESIGN.md` and `REVIEW_STAGE0_R3_ACCURACY.md`. VM material was not opened.

- Every R3 finding was checked at the location §12 gives, then grepped across all three documents for stale copies (terms: "from custody", "secure line", "on comms at the bench", "plant", "save one", "saves", "shelf mark", "restricted stacks/cage", "armed", "wall-clock", "TalentStack", "seven years", the §9 round-2 lines).
- Imports added or changed in round 3 were checked against the source: m10's new `m05_final_choice` (m05 `exportGlobals` L610 includes `final_choice`; default `""` L668; values `arrest`, `combat_nonlethal`, `combat_lethal`, `public_exposure`, `turn_double_agent` in the closing card L181–218). m10 Tier 1 recounted to 37 and Tier 2 to 26 (63 total), matching §3.2, §8 r1 and §9.
- The C1 canon was checked against m07 (`m07_opening_briefing.ink:45, 104` four sites, three operations for one team; `m07_closing_debrief.ink:336, 365` two unanswered, "Two of ours"; `:133, 153, 202, 222` Fracture = Ghost Protocol and Social Fabric, Meltdown = Digital Vanguard, Trojan Horse = Walsh) and m08 (`m08_opening_briefing.ink:41`). C6's quote checked at `m08_nightshade_confrontation.ink:214`.
- One engine check: the companion staging (an NPC who walks with the player between rooms). `public/break_escape/js` has no follow or escort behaviour; NPCs move between rooms only by `setVisible` and removal (`npc-game-bridge.js:740`, `room-state-sync.js:308`).

Severity as in rounds 1–3: **blocker** can't be built as written; **major** a design hole or a cross-document contradiction a later stage builds on; **minor** wording, precision or a stage-1 detail.

## 1. Round 3 confirmation

### Design (R3-01 to R3-19)

| R3 | Status | Evidence / what's left |
|---|---|---|
| R3-01 won branches thinner | **Partly** | Every won branch now has a decision and a face-to-face beat (rows 23, 44, §4.4, §5.3). The fix left four stale copies that still give the old staging (N-01). It also moved most of the beats to the forward post, which is now overloaded (N-02). Triple-agent Nightshade who was shown his file still has no m10 decision (N-16). |
| R3-02 raid clock | **Fixed** | §1.2 L28, §4.2 L526–530, §4.6 L612, §8 r7 L763, S0-m10 L45, L95. The "leaves the server hall" trigger has a small hole (N-05). |
| R3-03 alibi and timeline | **Fixed** | §4.0 L485–489, §4.4 L568–570, S0-m10 L43. The innocent tunnel partner is a witness, which needs one line (N-07). |
| R3-04 purge choices | **Partly** | The event now takes the other item (§6.1 L725–727; S0-m09 L38). Stopping the person *before* the event still skips the choice (N-03). §8 r18 still says stopping saves "that side's pair" (N-09). The office and print/card details don't hold together (N-10). |
| R3-05 disclose is paper | **Partly** | The branch costs are now on-screen beats (§4.6 L607–610). The default "handler watch" is not live on most branches and contradicts the `named` epilogue (N-04). The branch operations may already be burned by the raid (N-15). |
| R3-06 Nightshade names WREN | Fixed | §3.2 L371, §5.1 L628, row 104 L231. |
| R3-07 double-cross dominates | Fixed | Row 60 L171, §4.6 L614. A new domination appeared on the refuse side (N-06). |
| R3-08 casualty sheet | Fixed | §4.1 L513; S0-m10 L46. |
| R3-09 who Tesseract is | Fixed | §4.0 L483. |
| R3-10 "plant" | Fixed for player-facing text | §4.0 L491; S0-m10 L154–155. Design prose still uses "plant room" (row 46 L152, row 44 L150 "a route through the plant"). These are harmless, but stage 7 should lint for them. |
| R3-11 seven/nine | Fixed | §1.3 L40, §3.2 L430. |
| R3-12 Ghost's handset | Fixed | Row 13, §4.0, §4.4 L559, §5.1, §5.3. The §9 round-2 line still says "server hall" (N-13). |
| R3-13 suspects are names | Handed over | §13 item 4, with an owner. |
| R3-14 WREN edge cases | Fixed | §4.1 L500, §4.4 L569, L576, L579, L581. The Join path is not covered (N-17). |
| R3-15 recall walk | Fixed | §4.4 L576. |
| R3-16 honest answer punished | Fixed | §4.1 L515, §5.4 L698. The line doesn't fit the safe-opened branch (N-11). |
| R3-17 flag 4 in his room | Fixed | §4.1 L497. |
| R3-18 checklist lines | Fixed | S0-m09 L182–186, S0-m10 L196–200; §6.2 L739. |
| R3-19 paper or tape | Fixed | Row 60, §6.1 L727. |

### Accuracy (C1–C20)

| C | Status | Evidence / what's left |
|---|---|---|
| C1 m07 never-played canon | Fixed | §3 L288, §1.5 L72, §4.6 L616. Matches m07's four sites and three operations, and m08 L41. |
| C2 Recruiter's network by m05 | Fixed | Rows 60, 63; §3.2 L419; §4.6 L614. The import was checked by script: exported by m05, default `""`, value names exact. |
| C3 purge order | Fixed | One order in §6.1 L723, §1.3, row 60, S0-m09 L38, L52. |
| C4 alibi vs positions | Fixed | §4.0 L485 (pre-breach) and L487 (post-breach) are now distinct; §4.4 L569. |
| C5 Torres in place | Fixed | Rows 63, 64, 64a, §5.1 L638. |
| C6 "no deals" | Fixed | §4.4 L555, §5.1 L628. |
| C7–C8 | Fixed | Row 13; row 23, §5.1. |
| C9 `m07_completed` | Fixed | Rows 85, 103, §4.6 L616, §9 L802. |
| C10 Task Force Null placement; refit money | Fixed | S0-m09 L66, L68. |
| C11, C12 | Fixed | §1.3, §3.2; row 70. |
| C13 decision log | **Partly** | The four named lines were fixed. Other round-2 lines that round 3 superseded are not marked (N-13). |
| C14 one rule for naming her | Fixed | §3.4 L467, §4.6 L614, §8 r15. "Pull nothing" has no value (N-06). |
| C15 locations and media | Fixed | §6.1 L726–727; S0-m09 L52. |
| C16 L+ | Fixed | §3 L274; §3.1 L314–316. |
| C17 core host terminal | Fixed | §4.1 L495–497. |
| C18 safe-opened confession | Fixed | §3.4 L469, §5.4 L697. See N-11. |
| C19 Maya's list | **Fixed in row 6; residue** | §3.1 L324 still reads "When false, HaX warns…" with no `m01_completed` or cold-start wording (N-12). |
| C20 day 12/13 | Fixed | §1.5 L69, §4.0 L485, S0-m10 L15. |

**Not fully resolved:** R3-01, R3-04, R3-05 (design); C13, C19 (residue). Everything else is fixed as asked, or handed over in §13 with an owner (R3-13). All of the R3 design reviewer's 23 handover items appear in §13, plus item 24.

## 2. New findings

| ID | Sev | Location | Evidence | Problem | Fix |
|---|---|---|---|---|---|
| N-01 | major | ARC §2 intro L85; row 34 L135; §3.2 L374 (`m03_victoria_fate`); §3.2 L382 (`m02_gary_protected`) | L85: "a captured Voltage talks the player through his own plant … an arrested Victoria bargains from custody on the line". L135: "Victoria rings the player on a secure line before the gallery". L374: "on the line from custody (arrested: the deal)". L382: protected Gary "on comms at the bench". Against these: §4.4 L558, §5.1 L634, §5.3 L679, S0-m10 L44, L54 (arrested Victoria face to face at the forward post); row 23 L119, §4.4 L561, §5.1 L631 (Gary in person at the workshop); row 44 (Voltage walked or kept on the phone). | The R3-01 fix changed the staging in §4.4, §5.1 and §5.3 but not in the rows and import table that stage 1 writes from. A writer starting from row 34 or §3.2 gets the round-2 scene. | Settle N-02 first, then make rows 23, 34 and 44, the §2 intro bullet and the two §3.2 rows say the same thing as §4.4 and §5.3. |
| N-02 | major | ARC row 23, §4.4 L558/L560, §5.3 L678–679; S0-m10 §2.3 L54 | On a careful run the forward-post briefing holds: the door slot's full scene (Nightshade's deal), arrested Victoria's deal over Vos, captured Voltage's walk-or-phone choice, protected Gary's "You saved my career", WREN detained, Netherton's "You watch them" and, on `hardened`, the Council line. | Four of the five won-branch beats now happen in one cutscene before flag 1. The careful player gets a long prisoner parade at the start, and the bunker rooms that were meant to hold those scenes get thinner (the gallery's won branch is now Vos holding information the player was given outside). It is R3-12's server-hall overload moved to the forward post, and it eats into a time budget R3 already called tight. It also strains belief: a remanded UK defendant in a CPS case (m03), Voltage and a police-custody Nightshade all flown to a covert raid in Montana. | Keep only the door slot at the forward post. Put arrested Victoria back on a secure line, ringing in the server hall or media room before the jam (no other non-HaX voice is there); her face-to-face beat becomes Vos in the gallery, where the player uses or withholds her information (a decision). Bring a captured Voltage up after the breach and meet him at the power room (a `setVisible` presence). Move Gary's "You saved my career" to the workshop, where he appears. Use the 01:50–02:20 wait at the fence as one short playable beat with Arakawa: it gives him his R3-13 beat, and the player lives clue 2 instead of being told it. |
| N-03 | major | S0-m09 §2.3 L52 ("flag 1 … and the purge starts"), §5 L116 ("Sorensen is in late … bluff her"), design notes L148 ("a downed Sorensen stops the shredder and a downed Tran stops the tape wipe"); ARC §5.2 L655 (Tran "calls in a guard if he sees the player first"); S0-m09 §7 L173 | S0-m09 §7 claims "Each is forced by an event, so stopping Sorensen or Tran first can't skip it." | That is only true once the event has started. Sorensen can be met and bluffed before flag 1 starts the purge, then knocked out or arrested; then nobody feeds the shredder, and both cage bins survive. Nothing gates the server closet before the Recruiter's call, and Tran moves about. Down him early, and "a downed Tran stops the tape wipe", so both tapes survive. The R3-04 hole survives for a player who moves fast or fights. | Have the purge already running when the player arrives (the intercepted order is why tonight). Sorensen is behind the mesh from the start, reachable only by talk until the cage opens. The deck wipe is a job the Recruiter fires herself as she hangs up; Tran runs only the rest of the tape side. Then stopping Tran early saves the rest but never the deck. Also say what happens if the player opens the cage without using the hatch (recommend: the hatch bin is still there; the other is gone). |
| N-04 | major | ARC §4.1 L503 (disclose's defaults), §4.6 L609 vs L614; §3.4 L467 | Default operations: "the standing watch on the Initiative's handlers (the network the Recruiter's file maps)". `recruiter_offer`: on `taken` / `refused` her file is wiped; on `named` "her network rolled up". Disclose's beat: "the handler watch loses its marks". | The default isn't live on most branches. On `taken` or `refused`, SAFETYNET never had the file that maps the handlers, so there is nothing to watch. On `named`, the epilogue rolls the network up while disclose's beat says the watch lost its marks, and both lines play on named + disclosed, a likely pair for a careful player. On a cold start (m09 never played) the watch has no source. R3-05's ask (defaults live after the raid, a real cost) is met only by the Zero Day tap. | Replace the handler watch with an operation every player meets in m10 that outlives the raid: the watch on Ghost's resale buyers (every player hears Ghost selling, row 13), or the trace on the buyers of the PIN-cracker bench (row 29). Keep the Zero Day tap. If the handler watch stays, gate it to `double_crossed` (the warned rest) and state which line wins against `named`. |
| N-05 | minor | ARC §1.2 L28, §4.2 L526, L530; S0-m10 L45 | The head start "goes out when the player leaves the server hall"; the route runs server hall → media room (optional) → gallery (L491, S0-m10 L54). Flag 3 is also taken in the server hall. | A player who steps out between flags 2 and 3, or goes to the optional media room meaning to come back, loses the head start by walking, not by choosing. "Armed when the player submits flag 2" also reads as though the player's own VM work arms ENTROPY's push. | Trigger it at the gallery door (the display reads 04:00 as it opens), with HaX's warning as the player leaves the server hall. Reword "armed" to "found": it was always set for 04:00, and flag 2 shows it. |
| N-06 | minor | ARC row 60 L171, §3.4 L467; S0-m09 L44, L48 | Take the offer: the name, plus the Alpha tapes; she stays at large. Refuse and pull the Alpha tapes: the tapes only; she stays at large. | **Is merging the Recruiter's offer and the tape deck a loss?** Mostly no: it ties her offer to a real cost and keeps one decision for every player. But refuse-and-pull-Alpha is strictly worse than taking the offer: the same outcome for her, minus the name. The Alpha tapes are optional lore with no later use, so the only reason to pick that line is principle with nothing to show for it. "Pull nothing" (both wiped) has no `recruiter_offer` value. | Give the Alpha tapes a later use: for example, Tesseract's first draft of "Let it hurt afterwards…" in his hand, exported (`alpha_tapes_saved`) as a record answer under the third claim. Refusing her for the tapes then buys something. Map "pull nothing" to `refused`. Owner: stage 3. |
| N-07 | minor | ARC §4.0 L485, §4.4 L569–570 | Quintero and Kowalczyk "recon the service tunnel" together at 02:10. | The innocent partner is a witness. Either Quintero saw Kowalczyk at the service door, and asking her solves the case, or the two split up, which no document says. Post-breach, Kowalczyk "leap-frogs ahead" with Arakawa but reaches the core by the service door, and Arakawa would notice. | State that they split at a fork in the tunnel ("I took the drain, she took the door end"). Quintero says so if asked, which is a fair nudge and not the answer. Arakawa gets one line when Kowalczyk peels off. |
| N-08 | minor | ARC §13 item 3 L1072 vs §4.4 clue 3 L570 | Default: "only the crackers Nightshade signed out came from the bench". Clue 3: the bench logs a cracker "issued to WREN". | The handover default contradicts the whodunit's deciding clue. | "The crackers Nightshade signed out, and the one issued to WREN." |
| N-09 | minor | ARC §8 r18 L774 | "stopping Sorensen or Tran saves that side's pair" | A stale copy of the round-2 rule, contradicting §1.3 L42 and §6.1 (stopping saves only what is left). | Reword to match §6.1. |
| N-10 | minor | ARC §6.1 L725–726; S0-m09 §2.2 L37, L41–42; §2.3 L52 | The safe holds the Reading's shelf mark (L37). Stopping Sorensen saves "her office files, so the Reading's shelf mark comes the easy way" (L725), but no purge event touches her office. The printed ledger is shredded by Sorensen at flag 2 even if she was already stopped. Opening the cage needs her print (mug or stamp) and her card ("cloned at her side"), while she is behind the mesh and before the route reaches her office. | Three small contradictions in the purge's paper side. | Drop the office-files clause, or add the office as an event target. Have the ledger shred only if she is free. Give the cage's print and card sources that exist before her office: the stamp at the hatch, and the card cloned through the mesh while she talks. Owner: stage 5 for the lock order. |
| N-11 | minor | ARC §4.1 L515, §5.4 L698; §3.4 L469 | HaX's unasked line: "My agent told me I should have told them." On the safe-opened branch `should_have_told` means the player said "You should have pushed." | The line is wrong for one of the two branches that set the value. | One line that fits both ("My agent told me I sat on it. They were right."), or two fixed strings. |
| N-12 | minor | ARC §3.1 L324 (`m01_maya_ko`) | "When false, HaX warns the player about him first" | C19 residue: row 6 and S0-m09 L146 have `m01_completed` and the neutral cold-start warning; the import table doesn't. | Copy row 6's condition. |
| N-13 | minor | ARC §9 L834, L836, L840, L849 | "Captured Voltage on the plant phone … arrested Victoria bargaining from custody"; "the clock presses on the raid only"; "The head start goes out at 04:00, on the same clock"; "Ghost rings the server hall". | Round-2 decisions that round 3 replaced, with no marker. The C13 precedent asked for exactly this. | Add "(superseded, round 3: …)" to each. |
| N-14 | minor | ARC §4.0 L487 ("Quintero stays with the player"), row 23 ("comes in behind the player"), row 44 ("walked to his own switchgear"); S0-m10 L54 ("gallery, alone"); §4.4 L581 (Quintero stops WREN at the core) | No follow or escort behaviour in `public/break_escape/js`. | Several beats assume an NPC who walks with the player across rooms (Voltage across four rooms). Quintero "stays with the player" but the gallery is "alone", and she must then be at the core. | State that companions are presences shown per room (`setVisible` on entry, with one line that covers the move), and that Quintero catches up at the outer lock after the gallery. Owner: stage 5. |
| N-15 | minor | ARC §4.1 L503, §4.6 L609; rows 32, 104 | Disclose burns "the triple-agent channel to Nightshade" and "the watch on a recruited Victoria". | Both may already be blown by the raid: the triple agent works openly at SAFETYNET's forward post, and a recruited Victoria opens the core's outer lock for the player. If the raid burns them, disclose costs nothing on those branches either. | Stage 3 states why each survives the night (for example, Nightshade kept in the van out of the guards' sight; Victoria opens the lock with the gallery clear and HaX jammed). |
| N-16 | minor | ARC row 105, §4.4 L555, §5.3 L676 | Triple agent, shown his file: "he gives the override he was saving". | This is the one won branch with no m10 decision (R3-01's rule); the decision was made in m09. | One choice at the door: take the override and leave him at the post, or take him in with the team (he asks to see Tesseract's face). |
| N-17 | minor | ARC §4.1 L500, §4.3, §4.4 L581 | WREN enters "as the player reaches for Stop it". | Not covered: what WREN does on the Join path ("Show me how it works"), where "Stop it" is never pressed. | One line in §4.4: on Join she does not come through (he has the hand he wanted), or she comes through and he refuses her as written. |

## 3. The round-3 changes, judged fresh

**Won branches.** Each now has a decision and a face-to-face beat, and the workshop is the best of them: protected Gary recognising a technician he trained gives the careful player a harder scene than the careless one gets. The cost is placement (N-02): three of the new beats were put at the forward post, so a careful run front-loads them into the briefing. Spread them back into their rooms and the R3-01 aim is met.

**The story-event countdown.** It's right, and §8 r7 now says what the design does. The display moving with beats and people's lines carries the pressure. The only hole is the trigger point (N-05).

**The recon-split whodunit.** It is still fair and solvable from three clues. Clue 1 points at Malhotra (the red herring). Clue 2 clears him, Arakawa and the m08 pair, leaving the two in the tunnel. Clue 3 ties the player's own cracker to the woman who handed it over. Each clue is on the main path (security office, the line, workshop), and HaX nudges after each. Two lines would make it tighter. The tunnel pair must split, or Quintero is a witness (N-07). The fence wait should be lived rather than told, so the player remembers who stood beside them (N-02's fix). The readers' explanation (loaded from the stolen database) and the purpose at 02:10 (her own exit) both work.

**The forced purge choices.** The cage is a good moment: one bin through the hatch, and the act of opening takes the other. The rule fails only before the event starts (N-03), and that is a one-sentence fix: the purge is already running when the player arrives. **The merged Recruiter/tape decision** is mostly a gain. Her offer now costs something physical, and every player meets it at one moment. It isn't a loss of a choice, because the cage is still a separate save-one. The weak spot is that refusing her for the Alpha tapes buys nothing (N-06).

**Disclose's live costs and epilogue beats.** Much better: each option now has a scene beat, secure gets a payoff on screen, and the burned operations go dark on screen. The defaults still need one more pass (N-04), and the branch operations need a reason they survive the raid (N-15).

**Consistency of purge order and room contents.** The order (flag 1 → cage → ledger shelf → flag 2 → call → deck) agrees in ARC §6.1, §1.3, row 60, S0-m09 L38 and L52. Flag submission points agree (S0-m09 L29; ARC §6.1 L712; S0-m10 L29; ARC §6.2 L733). m09's nine rooms (S0-m09 L139) hold everything the purge names, but "restricted stacks", "restricted series" and "restricted cage" are used loosely. Stage 5 should say whether the plan chest and the ledger shelf are inside the cage. m10's nine rooms agree across ARC §5.3 and S0-m10 L91.

## 4. Ready for stage 1?

**Yes, after a short fix pass on the four majors.** All four are sentence-level, none changes direction, and none needs the user. The premise, endings, imports (script-checked again for the round-3 addition), cast, slot table, whodunit logic and purge order are settled enough to write narrative against.

Two of them should be settled in stage 0 rather than handed over, because stage 1's scene list depends on them:
- **N-02 (where the won-branch beats happen).** Stage 1 lays out the briefing and each room's scene. If it writes from §4.4 as it stands, it builds the forward-post parade; if it writes from row 34 or §3.2, it builds round 2's version (N-01).
- **N-03 (the purge already running).** This decides whether Sorensen can be met before the cage and who fires the deck wipe. Both shape m09's first act.

N-04 (disclose's defaults) can be settled in stage 0 or carried as a stage-3 must; it's one sentence either way.

**§13 items stage 1 cannot settle alone.** None of the open items (3, 4, 8, 9, 23, 24) needs stage 0 first. Item 3's default contradicts clue 3, so correct it before handing over (N-08). Add to §13: N-06 (Alpha tapes' use; stage 3), N-07 (tunnel split line; stage 1), N-10 and N-14 (stage 5), N-11 and N-17 (stage 1), N-15 and N-16 (stage 3).

## 5. Verdict

**Not clean.** Blockers 0, majors 4 (N-01 to N-04), minors 13 (N-05 to N-17).

Round 3: of 39 findings, 33 are fixed as asked, 1 is handed over properly (R3-13), and 5 are partly resolved (R3-01, R3-04, R3-05, C13, C19). The partial ones each have one remaining hole, logged above. The round's import change (m10 `m05_final_choice`) checks out against m05.

The four majors:
- **N-01:** the R3-01 fix left round-2 staging in row 34, the §2 intro and two §3.2 rows (arrested Victoria "on the line from custody", protected Gary "on comms at the bench").
- **N-02:** four of five won-branch beats now sit in the forward-post briefing, a careful player's prisoner parade before flag 1.
- **N-03:** stopping Sorensen before flag 1, or Tran before the call, still skips the purge choices that m09 §7 says can't be skipped.
- **N-04:** disclose's default "handler watch" isn't live on `taken`/`refused`/cold start, and on `named` it contradicts the roll-up line.

Recommend the author fix N-01 to N-04 and the stale lines (N-08, N-09, N-12, N-13) in one pass, then hand over to stage 1 with the rest added to §13. A fifth review round isn't needed if the fix pass touches only these.
