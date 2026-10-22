# m09 Digital Archaeology: puzzle chains, round 7 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at a4d7be8a ("puzzle chains round 6 fixes"). Round 6 is `PUZZLE_CHAINS_REVIEW_R6.md`, and its record is CONTRACT §15, "Puzzle chains round 6" (CONTRACT.md:846).

**Method.** I read the a4d7be8a diff, all fifteen m09 inks (the briefing and debrief only by search), the erb around every person-chat mapping, and the plan and R2–R6. I rendered the erb to JSON and listed every conversation-opening mapping. I recompiled all fifteen inks with inklecate: each is identical to the committed JSON. I wrote a new simulator for the vendored inkjs. It copies the engine's four entry paths: a first open; an in-session reopen at a choice point, which re-enters the knot that owns the choices (`person-chat-minigame.js:546-566`); an event start, which restores the state and then goes to the mapping's knot (`person-chat-event-start.js:136-147`); and a **reload**. On a reload the server has only the NPC's ink-local variables (`npc-conversation-state.js:221-236`, `:246-253`; `core/game.js:1585`), so the next talk restarts at `start` with them set (`person-chat-minigame.js:515-525`; the reopen helper says so at `person-chat-reopen.js:10-11`). Earlier rounds only simulated the first three. I ran it over the hatch on every m01 value and on `m08_nightshade_tidied`, over Old Coyote's challenge at counts 1–5 with and without a cover, and over the opening of every other person-chat. I also traced the hostile tag, the attack pause and the chase leash in the engine, and ran `room_depth.py`, the validator (`--skip-ink --no-graph`), `dialoguelint` and `reopencheck`. I opened no VM plan, SecGen file or field guide, and treated the VM flags as black boxes. I did no browser run. My scratch files are in the session scratchpad, under `r7_review/` (`sim7.cjs`, `hatch.cjs`, `coyote.cjs`, `hatchfix.cjs`, and the patched inks in `fix7/`).

**Counts: 0 blockers, 0 majors, 3 minors.**

**Verdict: not yet complete.** R6's three fixes work on every path R6 named, and none of them introduces a new problem. Dillard is hostile from the moment his line appears, he can't land a hit while it's open, and the hatch and Old Coyote reopen correctly in-session. The new reload simulation finds the gap R6's fix left. The hatch marks itself as talked before its opening has played, so after an Esc at the first choice, a **reload** (or Victoria's maintenance code) still skips the m01 recognition and HaX's description of the bins (m1). The same early flag costs smaller payoffs on three other openings (m2). Separately, a player who walks up to Old Coyote before he spots them is challenged straight afterwards with his cold-open greeting (m3). All three are small, unvoiced ink edits, and I tested each fix in inkjs on a scratch copy.

---

## 1. R6 items: confirmed fixed

| R6 item | Where now | Status |
|---|---|---|
| m1, Dillard idle after an Esc or a reload | `m09_archive_guard.ink:11-13`: `#hostile:archive_guard` above his line | **Fixed.** In inkjs, the first `InkEngine.continue()` returns his line with `["hostile:archive_guard"]` and the second returns `""` with `["exit_conversation"]`. The line has text and no choices, so `showCurrentDialogue` sends it to `displayAccumulatedDialogue` (`person-chat-minigame.js:719-723`), which runs action tags before the text (:1122-1126). The hostile handler (`chat-helpers.js:253-281`) saves his hostility (`npc-hostile.js` record and export), so an Esc or a reload on the line leaves him hostile |
| m2, hatch reopen skipped `recognition` | `m09_sorensen_hatch.ink:41-51`: `start` ends `-> opening`, and the two choices own `=== opening ===` | **Fixed in-session.** On all eight variants (fight, recruit, expose, surrender, arrest, cold start, tidied, `m01_maya_ko`), the first open is unchanged: three lines, then the two choices. Close there and reopen: the owner knot is `opening`, the text is blank (the D9 helper re-shows "The lease-holder's auditor. Of course. There's a chair on your side.", `person-chat-minigame.js:703-713`), and either choice then plays the right m01 line, "You're the one he writes about." and both HaX bin lines (the tidied arm on tidied), then the hub. A close mid-`recognition` resumes mid-knot and plays the rest. **Not fixed after a reload: m1 below** |
| m3, Old Coyote's "Same as before" without a cover | `m09_old_coyote.ink:36, 41, 48` keyed on `coyote_cover` | **Fixed.** Spotted, Esc, spotted again: "You again." with both covers and the plain truth button. A third time: the same. Pick the auditor cover, then get spotted: "Still auditing?" with "[Same as before. Carry on.]" and "[I'm not an auditor…]". The contractor is the same, with its own truth line. Walking up after an Esc on the challenge: the reopen re-enters `challenge` and gives "You again." with the covers. After a reload the event start restores `coyote_cover` (ink-local, seeded from the server), so "Still auditing?" survives it |
| Docs | CONTRACT §3.3 (:236), §3.4 (:250), §3.6 (:261), §15 (:846) | Match the build. One stale erb comment: n1 |

**R6 n2: can Dillard hit while his line is open?** No. A person-chat is in `PAUSING_SCENES`, so no windup starts and none in progress lands (`npc-attack-guard.js:30, 45-50`; `npc-combat.js:96-100, 204, 273`). After the close, attacks wait `ATTACK_RESUME_GRACE_MS` = 800 ms (`npc-attack-guard.js:37`; `npc-combat.js:100`). The world isn't paused, so he can walk while the line is on screen. But the player is in the server closet when Tran spots them (Tran's sight challenge is limited to `server_closet`, erb:1418), and Dillard's leash holds him in the room where his chase began unless `chaseAcrossRooms` is set (`npc-chase-leash.js` header), which his config doesn't set (erb:1288-1310). The only change from before is that he may be a few tiles nearer the closet door when the line closes. That's the m03 Terry Mott order, already shipped.

---

## 2. Findings

### m1 (minor). The hatch marks itself talked before its opening plays, so after an Esc at the first choice, a reload or Victoria's maintenance code still skips the m01 recognition and the bin framing

**Evidence.**
- `start` sets `~ hatch_met = true` and `#set_global:hatch_talked:true` (`m09_sorensen_hatch.ink:34-35`) above the three opening lines, then diverts to `opening` (:41). Its re-entry guard is `{hatch_met: -> hub}` (:33).
- **Reload.** Closing at the opening choices saves the story (`person-chat-minigame.js:1765-1769`). On a reload the server has only the ink-local variables, so the person-chat restores them as variables-only and restarts at `start` (`npc-conversation-state.js:246-253`; `person-chat-minigame.js:515-525`). Simulator, all eight variants: Esc at the opening, reload, walk up. The result is "Margaret Sorensen: Take your time. The shredder won't." with the bin buttons, and no recognition. A close mid-`recognition` then a reload gives the same.
- **Victoria's route** (`m03_victoria_fate == "recruited"`). The same Esc leaves `hatch_talked` true. If the player then uses the maintenance code, the cage entry matches `handover` (erb:1819, `cage_opened && hatch_talked && !bin_chosen`), not the door scene (erb:1810, `!hatch_talked`). `handover` hands over Derek's file with "You never chose, so take Mr. Lawson's file. It was nearest. The other one's already gone." (`m09_sorensen_door.ink:176`), to a player who was never told there was a choice.

**Why it matters.** This is the same loss R6 m2 found, by a route its fix didn't cover. The player loses the m01 recognition (the hatch's m01 payoff), "You're the one he writes about." and HaX's two bin lines, which are the only place the hatch says what each bin holds and what's at stake. The bin choice feeds the card, the afterwards call, the Reading's bet, Tran and m10, so without those lines it's made between two labels. Esc at the first beat of a scene and then a reload is plausible: a student who stops for the day after walking off from Sorensen comes back to the bins with no framing. Nothing is blocked, so it's minor.

**Fix** (`m09_sorensen_hatch.ink`, move two lines; unvoiced, no spoken text changes).
- Delete `~ hatch_met = true` and `#set_global:hatch_talked:true` from `start` (:34-35).
- In `recognition`, put `#set_global:hatch_talked:true` on its own line above `Agent HaX: Bin by the hatch is Derek Lawson's file…` (:75), so it rides a visible line, and put `~ hatch_met = true` after the `m08_nightshade_tidied` block, just before `-> back` (:81).

Checked in inkjs on a scratch copy (`fix7/`):
- The first open is unchanged.
- In-session reopen at `opening`: the same as now.
- Esc at the opening, then reload: the whole opening replays (three lines and the two choices), then `recognition`.
- After the full scene, a reload goes to the hub as now.

On Victoria's route, the Esc'd player now gets the door scene, with its own recognition and bins ("You came in by the maintenance code, not my hatch.", door.ink:124, which is still true). Knock-on effects, all benign:
- `talk_at_the_hatch` completes a few lines later (erb:188), and `cage_opened` completes it too (erb:194-195).
- A3-08 "She's still feeding it." (erb:213) and the status ladder's "Clone her card at the hatch…" row now wait for the real talk, which is more accurate.
- The clone can't be reached before `recognition` anyway: it's a hub choice.
- Tran topic 17's guard and retire read `hatch_talked` (CONTRACT:117). They behave as for a player who hasn't been to the hatch, which is now true.

After the edit: recompile, run tagdiff (one tag and one assignment moved), and update CONTRACT §3.3 (:236, "`#set_global:hatch_talked:true` above her first line") and §6.2's `hatch_talked` row (:458, "B3 first line").

### m2 (minor). The same early "met" flag skips the rest of three other openings after a close mid-opening and a reload, including two m05 payoff lines

**Evidence.** Each sets its met flag on the first line of `start` and guards `start` on it, so a close during the opening lines (saved mid-knot) followed by a reload restarts at `start` and diverts to the hub:
- **Sorensen in the cage**: `{cage_met or …: -> hub}` / `~ cage_met = true` (`m09_sorensen_cage.ink:28-29`). This loses "Paper was the only thing that could ever have hurt them." and, on `m05_completed`, the Torres line (:34-36), an m05 payoff. Re-entry reads "Another box."
- **Tran**: `{tran_met: -> hub}` / `~ tran_met = true` (`m09_jesse_tran.ink:157-158`). This loses, on `tran_alerted`, "I already made a call, by the way. Somebody from Statewide is on his way…" (:160-162), the only line that says who Dillard is (the m01_maya_ko thread).
- **Noor**: `{noor_met: -> hub}` / `~ noor_met = true` (`m09_noor_haddad.ink:30-31`). `noor_met` is a synced global (:18), pushed live by the variable observer (`npc-conversation-state.js:556`). This loses the warned-late lines (:44-46; "Somebody called me back in October…", an m05 payoff), or on the not-warned route the cover choice (`cover`, :55-67), so `noor_cover` stays empty.

In-session reopens are fine in all three, because a mid-knot save just continues.

**Why minor.** The player needs an Esc during the opening lines and then a reload before talking again. Nothing gates on these lines. But two of them are earlier-choice payoffs, and Tran's line is the m01_maya_ko route's explanation for the man in the stacks.

**Fix.** Unvoiced; no spoken text changes.
- **Cage**: move `~ cage_met = true` to just before `-> back` (cage.ink:37). There are no tags in the opening, so a replay is clean.
- **Tran**: move `~ tran_met = true` to just before `-> back` (tran.ink:163). There are no tags.
- **Noor**: leave `noor_met` where it is. The debrief reads it (debrief.ink:230), and the warned-in-time branch's `#give_item:keycard:noor_staff_card` (:36) must not replay. Instead, add an ink-local `VAR noor_opened = false` and guard with `{noor_opened: -> hub}`, setting `~ noor_opened = true` in two places: at the end of the two warned branches (before their `-> back`), and inside each `cover` choice. A replay then re-runs only `#complete_task:meet_the_clerk`, which is already complete, and never the card. If the fixer judges Noor's lines not worth the extra VAR, take cage and Tran only, and record Noor as deferred.

Recompile, run tagdiff and dialoguelint.

### m3 (minor). A player who walks up to Old Coyote before he spots them is challenged as a stranger as soon as the talk ends

**Evidence.**
- Walking up runs `start → hub` with "Hey. Building's closed. You lost?" (`m09_old_coyote.ink:83-84`) and leaves `coyote_challenges` at 0.
- His sight challenge isn't checked while a conversation is open, and a sighting that still holds when it closes fires then (`npc-sight-challenge.js` header and :102). He patrols on with `pauseForPlayer: false` and `facePlayer: false` (rendered JSON), so a player who came up behind him is in his cone as soon as he turns.
- `player_spotted:old_coyote` (erb:1269) then opens `challenge`, which counts 1 and plays "Hold on, sis, I'll call you back. *to you* Hey. Building's closed. Who let you in?" (:23-25), seconds after he said hello.
- Simulator: walk up, "[I'll let you get on with your round.]", spotted. The result is that line, with the cover buttons.

**Why it matters.** It's the same kind of false beat as R6 m3, by the other entry point. The player hears the cold-open greeting twice in a row, and the second time from a man who's supposedly been on the phone. Approaching a patrolling guard from behind is a natural thing to do. It's flavour: the covers and the truth button still work.

**Fix** (`m09_old_coyote.ink:83-84`, one line, unvoiced). In `hub`'s first-greeting branch, add `~ coyote_challenges = 1` under "Hey. Building's closed. You lost?". Checked in inkjs: walk up, then spotted gives "You again." with both covers and the plain truth button. Walking up again gives "What's up?". A fresh first spot is unchanged ("Hold on, sis…"). Update CONTRACT §3.4 (:250).

---

## 3. The early-close, reopen and reload sweep (every m09 person-chat and phone ink)

New this round: the **reload** column, simulated as the engine does it (ink-local variables only, restart at `start` or at the mapping's knot).

| Ink | Esc / early close | In-session reopen | Reload | Result |
|---|---|---|---|---|
| Sorensen hatch | at `opening`, or mid-`recognition` | `opening` re-entered; mid-knot continues | restarts at `start` past `hatch_met` | **m1** |
| Sorensen door (`door`) | `disableClose` (erb:1807-1815) | n/a | `onceOnly` saved on close, so the mapping fires again on the next cage entry (R6) | Clean |
| `handover` | tags above its one line | none | the same | Clean |
| Sorensen cage | mid-opening | continues | skips the rest of the opening | **m2** |
| Tran | mid-opening; at `deal` | continues; `deal` re-entered, the D9 line re-shows "Fine. It's off…" | opening skipped (m2); at `deal`, the hub, then the lever again | m2 only |
| Noor | mid-opening; at `cover`; at `reach` | continues; `cover`/`reach` re-entered | opening or cover skipped (m2); at `reach`, the hub, then the tell button again | m2 only |
| Old Coyote | at `challenge` | `challenge` re-entered, count 2: "You again." + covers | `coyote_cover` and the count restored; event start at `challenge` | Clean (R6 m3 fixed); **m3** is the walk-up order |
| Archive guard | the line | n/a (DONE) | hostility saved when the line appears | Clean (R6 m1 fixed) |
| Alpha clip | n/a | repeatable, `DONE` | the same | Clean |
| Briefing, debrief | `disableClose`; debrief backstops on `room_entered` | n/a | the same | Clean |
| HaX phone | lines not yet typed are flushed into the thread on close (`phone-chat-minigame.js:763-770, 1174`); position kept in `npc.storyState` | reopencheck: 0 problems over 1,362 reopens | voiced calls have `game_loaded` re-rings (rendered JSON) | Clean |
| Recruiter, Nightshade, Torres, Gary | the same flush | the four stubs replay `start` ("Hello?" / rings out) by design | Recruiter re-rings on `game_loaded`; the others are one-shot, and their lines are kept in the thread | Clean (as R2–R6) |

---

## 4. Fresh audit (skill Steps 2–5) on the current build

The only change since R6's audit is three ink files (a4d7be8a touches no erb line). I re-ran the checks independently rather than copying R6.

**4.1 Room depth and boss keys.** `room_depth.py`: 11 rooms, maximum depth 5 (`salvage_cage`), 11 lockType declarations. I listed the locks from the rendered JSON: the front desk key, H&L `HL2015-0477`, the staff passage RFID, `stacks_release`, `stacks_card`, the plan cabinet (biometric), the office password, the safe PIN `060216`, `tape_room_reader`, `LEWISANDCLARK`, and `beta_crate`. They match the plan's §3 table one for one, and every verdict stands. `staff_passage` is the one room with no objects or NPCs, settled as W5.

**4.2 Choices that matter (3a).** `concludeRequires` is the four flags. The m01–m08 payoffs at the hatch, the door scene, Noor, Tran, Old Coyote and HaX are intact on first play. This round's three findings are all about keeping them through an Esc, a reload or the other entry order. The bin choice, the mission's busiest, now loses its framing only on the paths in m1.

**4.3 Capability, chain depth, "would it exist anyway" (3b–3d).** No change, and I agree with the plan and R5–R6:
- all five start-kit classes are used;
- the cloner is used easy, then hard;
- Vigenère is taught in three tiers, then reused with an inferred key;
- the safe is built for the cracker;
- every encoding has an author with a motive.

**4.4 Bug sweep (Step 4).**

| Check | Result |
|---|---|
| Ink | All fifteen recompiled files identical to the committed JSON |
| `item_picked_up` keyed on id | None (all `item_picked_up:notes` with `data.itemId`) |
| Author notes, observations stating a code, rename residue | None in the three edited files. The erb is unchanged |
| Stale comments | erb:1288 (n1) |
| Validator (`--skip-ink --no-graph`) | The same 23 documented items as R2–R6 |
| dialoguelint | 5 `not-x-but-y`, 1 `you-after-choice`, all in lines unchanged since earlier passes. Phone max 25 words |
| reopencheck | `agent_0x99`: 0 problems over 1,362 reopens. The four contact stubs replay `start` by design |

**4.5 Layout and pacing (Step 5).** No change, and sound.

---

## 5. Notes (not counted)

- **n1. Stale erb comment** (erb:1288): "Hidden and non-hostile until his own one-line conversation ends #hostile:archive_guard" is no longer true after R6 m1. He turns hostile when the line appears (still never while hidden, since `setVisible` runs first). "PLACEHOLDER art: security_guard" is also stale: his `spriteSheet` is `lyle_dillard`. Not player-visible. Fix the comment with m1.
- **n2. Dillard after a knockout and Restart.** `resetHostilesForRespawn` calms every hostile NPC that wasn't knocked out (`npc-hostile.js:112-127`). His only conversation is spent (`onceOnly`), so after a Restart he stands calm in the open stacks for the rest of the night. That's the engine's deliberate respawn rule (m05 D5, m07 U11), and the player has already paid for the fight, so I don't count it. If the user wants the threat to survive a Restart, a mission-local mapping on the reset event could set him hostile again. That needs approval, since it cuts against the engine rule.
- **n3. Where m1's tag goes.** Put `#set_global:hatch_talked:true` above a visible line (HaX's "Bin by the hatch…" line), not at the very end of `recognition`. At the end it surfaces on an empty continue together with the hub's choices (seen in inkjs), which `displayAccumulatedDialogue` should handle (:1129-1162), but riding a line is the proven path.

---

## 6. For phase 5 (browser checks, not findings)

- **R6 m1, live.** On an `m01_maya_ko` save, let Tran spot you in the closet. Dillard's line should show a hostile notice. Esc it: he chases in the open stacks, with no hit while the line is open and none for 0.8 s after. Repeat with a reload during the line: still hostile after Resume.
- **R6 m2, live.** At the hatch, Esc at "[That's right…]" / "[I'll stand.]", then walk back up. You should get the remembered "There's a chair on your side." line with the two choices, then the m01 line and HaX's bin lines.
- **R6 m3, live.** Esc on Old Coyote's first challenge and let him spot you again: "You again." with both covers. Then pick a cover and let him spot you: "Still auditing?" / "Still fixing the shredder?" with "Same as before".
- **m1 after the fix.** Esc at the hatch's opening, reload, walk up: the full opening replays, then the recognition. On a `m03_victoria_fate = recruited` save, Esc at the opening, then use the maintenance code: the door scene, not `handover`.
- **m2 after the fix.** Esc on Sorensen's first cage line (on `m05_completed`), reload, talk: the Torres line plays. Do the same with Tran on `tran_alerted`.
- **m3 after the fix.** Walk up to Old Coyote from behind, talk, leave, and let him turn: "You again.", not "Hold on, sis…".
- **Carried from R6.** The door scene can't be closed. The Tran topic on the hatch, letters, handover and tidied routes. Keypad tiers in order. Torres click then cancel. Gary with a first-try correct code. Tell Noor, then try the staff door. The late file on the alpha-tapes branch. The read-every-page safe check.

---

## 7. To close the phase

1. m1: move `hatch_met` and `hatch_talked` in the hatch ink (n3 for placement), and fix the erb:1288 comment (n1). Recompile, run tagdiff, update CONTRACT §3.3 and §6.2.
2. m2: move `cage_met` and `tran_met` to the end of their openings. Give Noor an ink-local `noor_opened` guard, or defer Noor with a reason. Recompile, run tagdiff.
3. m3: add `~ coyote_challenges = 1` to Old Coyote's first greeting. Recompile, run tagdiff, update CONTRACT §3.4.
4. All three are unvoiced, with no spoken text changed (voiced delta 0). Add a CONTRACT §15 "Puzzle chains round 7" paragraph. Run the validator (expect the same 23 items) and dialoguelint.
5. This is round 7, past the AGENTS.md cap of five, run under the user's rule that the phase ends only on a 0/0/0 round. The findings are narrowing: m1 and m2 are one class (a scene's "met" flag set before its content, exposed by the reload path this round simulated for the first time), and m3 is a one-line ordering slip. A short round 8 should be enough. It should re-run `sim7.cjs` on the fixed inks for the four entry paths and recheck m1's two routes.

Measured against m01_first_contact and m02_ransomed_trust.
