# m10 Full Disclosure, stage 3: review round 2

## 1. Scope and method

Reviewer: fresh read-only Opus, round 2, 2026-10-21, covering both lenses (choices, and structure/state). Target: `moral_choices.md` draft 2 (894 lines; "MC:n" is its line). Read with `docs/agents/FINALE_BRIEF.md`, `.claude/skills/npc-dialog-review/SKILL.md`, `.claude/skills/mission-puzzle-chains/SKILL.md`, `REVIEW_R1_CHOICES.md`, `REVIEW_R1_STRUCTURE.md`. m09 agreement checked against `m09_digital_archaeology/stages/stage_3/moral_choices.md` ("m09 MC:n"). Geography and stale copies checked by grep in m10 `stage_1/story_arc.md` ("arc:n"), `stage_2/`, and `finale/FINALE_ARC.md` ("FA:n"). No VM material opened.

Settled and not re-argued: endings per the brief; F11 (two lethal versions); F13 (surrender is a deal with no trial, arrest a trial with no cells); "Lower the weapon" removes the cold option; the $12.8M kept by the Council on `secured`, the victims' fund otherwise; the console stops one share only. The draft matches all six (MC:435–436, 446–457, 644, 270).

Severity as round 1: **blocker** breaks the brief or soft-locks; **major** a dominated, untraceable or misleading choice, or a state hole on a reachable save; **minor** a smaller fix.

## 2. Verdict

**Not clean: revise, then round 3.** 0 blockers, 4 majors, 12 minors.

Draft 2 is a large improvement. Round 1's blocker is gone: every door branch now closes at the table. The database is now a real argument, with a public cost on each side, and the timescale is right in MC and agrees with m09. The double-cross branch matches m09's ruling. The cold ending is signposted and final both ways. Of round 1's 42 numbered findings, 36 are resolved and 6 are partly resolved (F-02, F-05, F-08, S3-02, S3-07, S3-12); the gaps are below.

Four majors remain:

- The one-share console only creates a dilemma where Ghost is baited. On every other save it kills Zero Day's share for free, and the gallery's dilemmas go flat again (R2-01, F-02's residue).
- The core's KO fallback sets `ending` before the database is chosen, which breaks §8.1's own guarantee (R2-02).
- On the cold-start door branch the closing choice belongs to Netherton, and his knock-out has no safety net (R2-03).
- On the named and double-cross saves, the tether's only cost points at Kowalczyk, who isn't there, so bringing Nightshade up dominates (R2-04).

Each fix is a rule or a paragraph.

## 3. Round 1 confirmation

"Resolved" means the fix is in MC, and the grep for the old wording or global finds no copy left in MC. "Partly" points to the round 2 finding that carries the rest.

**Choices review**

| # | Status | Evidence |
|---|---|---|
| F-01 | resolved | Gallery barks, one per carried effect (MC:198) |
| F-02 | **partly** | One share only (MC:270–277), but it is a dilemma only on the bait branch → R2-01 |
| F-03 | resolved | "Goes with whoever is winning", HaX's rule before the jam (MC:202, 206–212) |
| F-04 | resolved | Netherton's public-safety case for secure (MC:410); a public cost for disclose (MC:418). Wording of that cost: R2-06 |
| F-05 | **partly** | MC is right (MC:418, 615) and agrees with m09 MC:224, 240; arc:426 still says "within the hour", with no P item → R2-11 |
| F-06 | resolved | The escape is said at the menu (MC:413) and the gain is shown at 06:00 (MC:419). Gain wording: R2-07 |
| F-07 | resolved | The switch works only inside a by-hand cut and goes inert after another cut (MC:166) |
| F-08 | **partly** | Rule 1.3 caps guard effects at three (MC:17), but Priya and a wrongly accused Arakawa still pay in guards → R2-09 |
| F-09 | resolved | About 20 picks; one decision after the talk per Act 2 scene (MC:54) |
| M-01 | resolved | The supplier's delivery is read tonight (MC:148) |
| M-02 | resolved | The answer chooses the gift (MC:119–126) |
| M-03 | resolved | Cuff-or-leave cut; `nightshade_cuffed` gone (grep: only in "cut since draft 1", MC:716) |
| M-04 | resolved | Each way through pays differently (MC:196) |
| M-05 | resolved | Kind column (MC:32–52). Two labels: R2-14 |
| M-06 | resolved | The story appears on screen with no narrator line (MC:570) |
| M-07 | resolved | The figure is said once (MC:463, 467–468) |
| M-08 | resolved (partly withdrawn, accepted) | The one-voice rule counts voices on the line (MC:11); one re-ring (MC:230). The re-ring's reach: R2-12 |
| M-09 | resolved | Print-branch answer (MC:364) |
| M-10 | resolved | "I walk out owing nobody. Including you." (MC:214) |
| M-11 | resolved | Step 1 line by points (MC:467) |
| Worst lines 1–5, near misses | resolved | "Watch my hands" (MC:172); Victoria's terms (MC:214); "that letter, a thousand times" (MC:412; m09 still has the old line, R2-11); purge line (MC:320); button (MC:210); Quintero (MC:261); Netherton (MC:413). Grep finds no "Watch me not", "presents" or "same, bigger" in MC |

**Structure review**

| # | Status | Evidence |
|---|---|---|
| S3-01 | resolved | Closing choice at the table on every branch (MC:60, 76–81); the tripwire has a way round (arc:127, the guard post's ladder), so no dead end |
| S3-02 | **partly** | Rule 1.10 and Nightshade's net (MC:24, 60), but no net for Netherton's menu on the silent branch → R2-03; the core fallback is unsound → R2-02 |
| S3-03 | resolved | East door on `ghost_call_done` (MC:107, 117) |
| S3-04 | resolved | `avoided` / `ko` defaults (MC:18, 141, 164, 194); Imran mapped on Gary's branch (MC:152); `arrested_here` (MC:252) |
| S3-05 | resolved | One wrong accusation at a time (MC:297); KO bools (MC:299, 706); `wren_at_core`, `quintero_wounded` (MC:707–708) |
| S3-06 | resolved | Item 5 is the early-access order book (MC:403); `vos_secret_used` keeps the tap (MC:241) |
| S3-07 | **partly** | One ledger (MC:625), but Imran's supplier is outside it and the fallback can run dry → R2-05 |
| S3-08 | resolved | Arrested-branch help rejected (MC:92, 814); 67 imports, Tier 1 40 / Tier 2 27 (MC:784), which agrees with m09 MC:572's 67; `legacy_files_saved` read (MC:627) |
| S3-09 | resolved | The warning comes after the refusal, and the no-Quintero case is covered (MC:381–387); blast-door line and "two things" (MC:376, 517) |
| S3-10 | resolved | No re-ring into the gallery (MC:21, 230) |
| S3-11 | resolved | Rule 1.11; `points_landed` derived; `join_step` 0–3; `joined` set on the key (MC:25, 342, 471–473) |
| S3-12 | **partly** | The ending scene completes the conclusion task (MC:529), but the KO fallback sets `ending` before the database is chosen → R2-02 |
| S3-13 | resolved | Door mappings, not `unlockCondition` (MC:19, 665) |
| S3-14 | resolved | A compute moment for each export (MC:657–663) |
| S3-15 | resolved | "Stay" gets a line at 06:00 on every ending (MC:68) |
| S3-16 | resolved | Imran counts (MC:354, 368) |
| S3-17 | resolved | The watch is named by m04 branch (MC:402), as in m09 |
| S3-18 | resolved | m10's pools win; m09's button wording (MC:815) |
| S3-19 | resolved | One Albion clause (MC:616); m09's clauses housed (MC:627) |
| S3-20 | resolved | No CCTV; cameras are objects plus guards (MC:11, 166) |
| S3-21 | resolved | A minder at the lock (MC:69) |
| S3-22 | resolved | "Flipped on `secured`" (MC:644) |

**User and orchestrator decisions in MC.** F11, F13, the endings, "Lower the weapon", the $12.8M and the one-share console are all present and consistent wherever they appear. Grep finds no surviving "trial" on surrender, no cells on arrest, and no second cold option after lowering.

## 4. Findings

### Majors

**R2-01 (major). The one-share console is only a dilemma on the bait branch; everywhere else it kills Zero Day's share for free, and the gallery goes flat again.**
- *Location:* §4 C9 (MC:270–277), §3.2 (MC:107, 119, 132), §3.5 (MC:206, 225, 228, 250), §1 rule 1 claim at MC:277.
- *Evidence:* Ghost's share is live only on the bait. `ghost_sale` is `stopped` on kept and refused (MC:107) and on a talk-out (MC:135), and "`selling` is only the first line's default" (MC:135). MC:277 says: "Where one share is already stopped (Ghost talked out, kept or refused), the console has one option and C9 is a task." So on kept, refused and every talk-out (which includes a careful cold-start player), the console kills Zero Day's share at no cost. Once Zero Day's share is dead: trusting recruited Victoria is simply right (MC:211); arresting escaped Victoria costs only the guard's name (MC:225–228); Vos can be talked out (MC:250).
- *Problem:* this is F-02's problem, moved rather than solved. MC:277 says the split keeps "a real cost on one side for every player, the careful one included". That holds only for a player who baited Ghost. The player who talks Ghost out (the answer the scene rewards) or who kept or refused Ghost's deal in m02 still meets the gallery with Zero Day's side zeroed. On most saves the gallery's dilemma comes down to justice against a quicker lock.
- *Fix:* give the console a second option on every save, so killing a share always costs something. Recommended: **[Let it run. Trace who gets it.]**. Zero Day's share goes out at the lock, and SAFETYNET follows it to the buyers: one cell in the ledger, and item 5's watch gets names. That is the database question in small (stop the harm, or let it happen and learn from it), and it leaves the gallery's Zero Day stakes live for any player who traces. HaX: "I can kill one feed, or follow it. Not both." On the bait branch the menu is then Ghost's / Zero Day's / trace, and the trace option follows Zero Day's share. If that is too much, the smaller fix: on non-bait saves, the console's kill costs time, as R1 F-02's alternative (Kowalczyk goes ahead unwatched while the player is at the console). Either way, correct MC:277's claim.

**R2-02 (major). The core's KO fallback writes `ending` before the database is chosen, which breaks §8.1's guarantee and can collide with wipe.**
- *Location:* §6.1 "If he is knocked out" (MC:326); §8.1 (MC:529, "set by one pick each, and nothing else sets it"; "`/conclude` can never run with `ending` or `database_outcome` empty"); §12 `ending` (MC:657).
- *Evidence:* MC:326: "An `npc_ko` mapping on Tesseract before `ending` is set ... the database menu moves to the core host terminal ...; and `ending = arrest`". The ending scene "plays only once `ending` is set" (MC:529), so a knock-out before C16 makes the ending scene eligible while `database_outcome` is still `""`. The terminal still offers "[Wipe both.]", whose result is `scorched` with him escaping "in the dark by the service door" (MC:419). He is unconscious, and `ending` already says `arrest`.
- *Problem:* (1) The conclusion can run with `database_outcome` empty, which is exactly what S3-12 closed. (2) Wipe at the terminal either overwrites `arrest` with `scorched` for a man on the floor, or leaves `arrest` paired with `both_wiped`, a combination no ending scene covers. (3) It is unstated whether the WREN beat runs, and whether the hand disarm sets `console_choice` and `partial_release`. (4) MC:529 says "nothing else sets it" while MC:657 lists the KO fallback.
- *Fix:* the KO mapping writes a local `tesseract_ko = true` and nothing else. The hand disarm at the console object sets `console_choice = stopped` and `partial_release`, as "Stop it" does, and WREN's beat runs off it if she is free. The terminal's database pick then sets `ending`: `arrest` on secure or disclose, and `scorched` on wipe, where the purge's dark lets the team lose him. He comes to and goes by the service door; one narrator line covers it. Correct MC:529 and MC:657 to match.

**R2-03 (major). The cold-start door branch has no knock-out net: its closing choice is Netherton's, and only Nightshade's knock-out is mapped.**
- *Location:* §3.1 (MC:60, 94–101), rule 1.10 (MC:24), §12 done-flags (MC:669).
- *Evidence:* on the silent / never-played branch (every cold start, and every m08 knock-out save), Nightshade is in the van (arc:200) and the menu is Netherton's question (arc:200, "Netherton asks whether to bring him"; MC:98–99 have only Netherton signposting). The only net is "an `npc_ko` mapping on Nightshade" (MC:60, 669). Rule 1.10 names Netherton as a forced-scene NPC, but no mapping for him is "named with its scene below".
- *Problem:* knock Netherton down at the table before the tether question and `door_scene_done` is never written: the breach never opens on the default save. The same applies to the kept-shown branch if Netherton, not Nightshade, holds the stay/come menu. MC doesn't say who holds each branch's closing choice. Separately, MC never states that a walk-away from the door scene resumes at the closing choice (engine 34 assumes it; §3.1 doesn't say it).
- *Fix:* for each door branch, name the NPC whose conversation holds the closing choice, and give that NPC an `npc_ko` mapping that writes the branch default and `door_scene_done`. Netherton's mapping writes `nightshade_tethered = false` on the silent branch. Add one sentence: closing the door scene early leaves the breach shut, and talking to the same NPC again resumes at the closing choice.

**R2-04 (major). On the named and double-cross saves, the tether's only cost falls on Kowalczyk, who isn't on the team, so "[Bring him up.]" dominates.**
- *Location:* §3.1 silent branch (MC:98–99); §5 double-cross (MC:301, "Arakawa breaches alone"); §15 F-08 (MC:850, "Arakawa on the tether onto Kowalczyk going ahead unwatched"); arc:69 and arc:744 (R4-06: "Quintero breaches when Arakawa is at the blast door").
- *Evidence:* MC:98 gives the tether's cost as "Kowalczyk breaches the rooms ahead alone and unwatched ... the last face-to-face moment to accuse her comes a room earlier, and Arakawa can be accused only on the line". Netherton's signpost: "Kowalczyk goes ahead on her own." On `m09_sleeper_named` she is in cuffs at the briefing; on `double_crossed` she is gone. Neither branch has a whodunit. Silent Nightshade plus an m09 naming is a reachable save (a knock-out before the fate in m08, then m09 played).
- *Problem:* on those saves the tether buys the manual blast door and an unguarded tunnel post, and costs nothing. The menu is dominated, and Netherton's line names an officer who isn't there.
- *Fix:* follow arc:69. On those branches Quintero breaches ahead when Arakawa holds the blast door, so the cost moves onto her: she isn't beside the player at the outer lock (her lock line by stance, and her secret if asked, are lost), and she reaches the core later. Netherton, on those branches: "If he goes up, Arakawa stays with him, and Quintero breaches alone. You'll be at the lock without her."

### Minors

**R2-05 (minor). The cells ledger misses one source, leaves two operations' cells undefined, and can run dry.**
- *Location:* §3.3 (MC:148), §6.5 (MC:399–404, 417), §10 ledger (MC:625), §11 item 34 (MC:643).
- *Evidence:* a taken-in Imran's front supplier "is rolled up (cells ledger, §10)" (MC:148), but the ledger's five sources (MC:625) don't include it. Secure's source is "the cell that operation watches", which is undefined for Nightshade's channel and the HashChain tags (items 2–3). The fallback list includes "Ghost's buyers" on saves where Ghost never sold (kept, refused), and "the Recruiter's network" only on `named`. A surrender on a well-played save (bait, secured, m07 cells) can find nothing left for its second cell.
- *Fix:* add the supplier as source (2b). Name the cell for items 2 and 3 (the Initiative's procurement desk; the cell whose reserve the tags follow). Make each fallback entry conditional on its existence. End the fallback with a cell that always exists, such as the order book's largest buyer from flag 2, so surrender always gets two.

**R2-06 (minor). Disclose's public cost depends on a leak within the hour, which overcorrects the teaching point.**
- *Location:* §6.5 (MC:418), §8.2 (MC:550), P30 (MC:798).
- *Evidence:* "Three water utilities went to manual at five. Someone read the vendor list." Disclosure was sent "on a schedule" a little over an hour earlier.
- *Problem:* m09 MC:224 teaches that a notice starts a slow clock. A line implying the embargoed vendor list was read and acted on within an hour teaches the opposite fault: that coordinated disclosure leaks at once. The honest public cost of disclosing flaws that can't be patched is the mitigation itself: the operators are told, there is no fix, so they run by hand. That cost also answers Netherton's case for secure directly.
- *Fix:* worst line 2 (§7). Optionally, have the disclose button or HaX's gloss say that the unpatchable flaws go to the operators with workarounds, not into a public list.

**R2-07 (minor). Wipe's 06:00 gain credits the wipe with the head-start outcome.**
- *Location:* MC:419 (`head_start_out = none` form).
- *Problem:* "The cells paid for early access and got nothing" is the result of C9 and the gallery, not of the wipe. It is true on every ending with `head_start_out = none`. Wipe's real gain is that nobody holds a copy to sell, steal or leak again.
- *Fix:* worst line 3 (§7), the same line on every `head_start_out` value.

**R2-08 (minor). Nothing says why disclosure burns operations, and two of the six are human sources.**
- *Location:* §6.5 (MC:397–406, 412, 418).
- *Evidence:* m09 gives a reason for its watch going dark (m09 MC:224: once the vendor investigates, SAFETYNET's own access would be found, so it pulls the watch). MC gives none, and items 1–2 are a recruited Victoria and Nightshade's channel.
- *Problem:* a player who thinks about it asks why patching water controllers moves Nightshade. The teaching spine is stronger if the reason is said.
- *Fix:* add one clause to Netherton's line: "Both of them run through holes on that list. Patch the holes and we lose the way in." For the human sources, say what the holes carry (Victoria's watch rides a broker's compromised mail server; Nightshade's channel a compromised vendor portal), or put items 3–6 ahead of 1–2 in the priority order.

**R2-09 (minor). More than three choices still pay in guards.**
- *Location:* rule 1.3 (MC:17), §3.3 (MC:147), §5 (MC:293), §3.5 (MC:211), §15 F-08 (MC:850).
- *Evidence:* the three named guard effects are the tunnel post, the monitor post and the change-over. A talked-round Imran also empties Priya's gallery post (MC:147). A wrongly accused Arakawa means "one more guard ahead" (MC:293). A trusted Victoria while the share is live brings reinforcements (MC:211). §15 says Priya was moved "onto people", but her post is still a guard fewer.
- *Fix:* either restate rule 1.3 as "every guard effect is voiced in the room" (all five are), or move Arakawa's wrong-accusation cost onto a person (the van loses its liaison, so the road block lifts and Netherton says so) and count Priya as the third coin in place of the change-over.

**R2-10 (minor). Three m09 mismatches on the double-cross branch.**
- *Location:* MC:301, MC:334, MC:391; m09 MC:137, 400, 674, 726.
- *Evidence and fix:* (1) "Kowalczyk walked off the apron at Great Falls" and Netherton's "did not come back from Great Falls" (MC:301). m09 moved it to Helena (m09 MC:674, "superseded: Helena since R2-02"; MC:400's line "walked off the apron"). Change both to Helena, or reuse m09's line. (2) The Recruiter beat has "one glance at Kowalczyk, standing behind him" (MC:334). But in §6.4 Quintero takes her on arrival, before step 0 (MC:391), so by step 1 she is gone. Change it to "one glance at the service door she was taken through". (3) m09 proposes the Recruiter's 06:00 text ("I'll remember the shape of you.") and a card line ("About half of them. She warned the rest.") for m10 (m09 MC:137). MC:556 mentions "the Recruiter on `double_crossed`", but neither line is taken up or rejected by name, and the card line doesn't fit the five-line card. Say which.

**R2-11 (minor). Stale copies outside MC that no P item covers.**
- *Location:* arc:426; m09 MC:240; MC §14.
- *Evidence:* arc:426 still says "the first vendor patches land within the hour". P30 targets FA only (MC:798; FA:641 has the same stale text and is covered). m09 MC:240 still has HaX's "This is the same, bigger.", which m10 rewrote (MC:412), and neither P21 nor P41 carries the new line back to m09.
- *Fix:* add arc §10 (line 426) to P30 or P28. Add the rewritten HaX line to P41 for m09, since the two missions must say the same line.

**R2-12 (minor). Arrested Victoria's call is labelled forced, but it can be skipped silently, and the skip's cost isn't said.**
- *Location:* §2 C8 (MC:41), §3.5 (MC:230, 242).
- *Evidence:* the one re-ring comes "as the player first leaves the hall for the media room, or on their return". On a save with no m07 there is no media room (MC:503), so the only way out of the hall is the gallery stair, where an unanswered call is abandoned. Nothing warns that the abandoned call costs Vos's secret, and Vos's menu when `vos_secret_known` is false isn't stated on this branch.
- *Fix:* relabel C8 "optional, with a warned cost". Add a re-ring on approaching the gallery stair (in the server hall, so the jam isn't broken), with HaX: "Sterling's still on the line. She has something on Vos." State that Vos's own trade menu (MC:244–250) plays when the secret is unknown.

**R2-13 (minor). The head start goes at two different moments.**
- *Location:* MC:194 and 275 ("Zero Day's share goes as the lock opens"); MC:274 ("Ghost's buyers get the head start at 04:00"); MC:661 (one computation at the lock's unlock event).
- *Fix:* one moment for both shares, the lock's unlock event, which the story clock calls 04:00. Make HaX's "before four" and the lock event the same beat in stage 4's countdown.

**R2-14 (minor). Two kind labels overstate the dilemma count.**
- *Location:* §2 (MC:42, 48, 54); §6.7 (MC:473).
- *Evidence:* C15's step 1 "is curiosity and costs nothing" (MC:473); the cost starts at step 2. C9 is a dilemma only on the bait branch (R2-01).
- *Fix:* label C15 "gateway (the dilemma is step 2)". Until R2-01 is fixed, count C9 as "task, dilemma on bait". The honest count is then eight dilemmas plus two conditional ones.

**R2-15 (minor). The route-profile count doesn't add up to its own list.**
- *Location:* MC:894. See §8.

**R2-16 (minor). The $12.8M and Netherton's "two numbers" on the cold and Scorched Earth endings.**
- *Location:* §8.2 (MC:549), §8.3 (MC:569), §11 item 35 (MC:644).
- *Evidence:* "Netherton's two numbers" lists three items. On `executed`, Netherton "signs nothing", but the default $12.8M line ends "I have signed for that as well." On `scorched`, the row lists the suspension and the wipe's gain, and doesn't say whether the $12.8M line plays.
- *Fix:* say that the $12.8M line plays on arrest, surrender, justified lethal and Scorched Earth, and not on the cold ending (its absence is part of his refusal). Rename the row "Netherton's numbers".

## 5. The fresh checks

| Check | Result |
|---|---|
| **The door scene closes on every branch** | Yes, by choice: every branch has an explicit closing choice at the table (MC:71, 76, 92, 101), and the tripwire has a way round (arc:127). Not yet by knock-out on the silent branch (R2-03), and the tether is dominated on named or double-cross saves (R2-04). |
| **The database is a fair argument** | Yes. Secure has a public-safety case, said by the one person whose argument it is (MC:410), and a public cost on the card (MC:417). Disclose has a public cost (MC:418) and its real speed. Wipe has its escape said with the menu open (MC:413) and a gain at 06:00 (MC:419). No option is best on every count (MC:421). The remaining issues are wording and realism: R2-06, R2-07, R2-08. A thoughtful player may still ask "why not disclose the fixable ones and hold the rest?"; R2-06's optional clause answers that inside the disclose option. |
| **Realistic disclosure timescale everywhere** | In MC, yes: acknowledged tonight, about ninety days, a year to fit, a dispatch workaround in days (MC:418, 596, 615). This agrees with m09 MC:224, 240 and P41. Stale at arc:426 and FA:641; FA is covered by P30, arc isn't (R2-11). |
| **The console's one share, Ghost's bait, Victoria** | Consistent across §3.2, §3.5, §4 C9 and `head_start_out`. The bait's catch needs the console on Ghost's share; recruited Victoria's trust reads the share; HaX's rule comes before the jam. The flaw is coverage: a dilemma only on bait (R2-01). Timing: R2-13. |
| **Safety nets: KO, walk-away, reload** | Phones: covered (rule 1.7, first-line defaults, re-ring, desk handset). Slot scenes: `avoided` on the first line or room exit, `ko` through `globalVarOnKO` (MC:18, 141, 164, 194). Accusation: KO bools, one wrong accusation live (MC:297–299). Core: rule 1.11's resume and the derived `points_landed` are sound. Gaps: the core's KO fallback (R2-02), the silent door branch's KO and the door scene's walk-away resume (R2-03). The WREN "[Stop her.]" beat has no resume rule after a reload; add it to rule 1.11's list (`wren_at_core` written on the beat's pick). |
| **The double-cross branch** | Agrees with m09 on substance: WREN off the team, waiting at the core beside Tesseract, his refusal, Quintero or the player taking her, nobody wounded, no whodunit, `sleeper_caught` true (MC:301, 391; m09 MC:137, 146, 602). `m09_sleeper_named` is true on `double_crossed` (m09 MC:402, 562), and MC keys `sleeper_caught`'s load value on `taken` only (MC:659), which is right. Mismatches: the location, Kowalczyk "standing behind him", m09's two proposed lines (R2-10); the tether (R2-04). |
| **The cells ledger, no double counting** | One derivation at `ending`, first-not-taken, so a cell can't be counted twice. Gaps: one missing source, two undefined cells, and a fallback that can run dry (R2-05). |
| **Every global set before conclusion** | Exports: `ending` and `database_outcome` are set before the ending scene on every path except the KO fallback (R2-02). `head_start_out` is set at the forced outer lock. `media_story_ran` and `partial_release` are set at `ending` and "Stop it" (the KO path needs the hand disarm to set the latter, R2-02). `sleeper_caught` and `wrong_accusation` have safe defaults. Done-flags: all three have a setting route on every branch, apart from R2-03. Locals: defaults on every slot scene. Imports never gate (rule 1.6; no import in any door mapping). |
| **Every ending reachable on full, partial and cold saves** | Yes. The rebuttal is on every exchange menu, so surrender is open to a cold start. Fewer than two points opens the justified lethal ending to anyone. Cold, Scorched Earth and Join need no import. The double-cross reaches all six (MC:540). The KO fallback narrows a player to arrest or Scorched Earth, which is fair as the cost of hitting him once R2-02 is fixed. |

## 6. Do the 18 choices feel like moral choices?

Mostly, and much more than in draft 1. The labelling is honest, apart from R2-14.

| # | Feels like a moral choice? | Note |
|---|---|---|
| C1 | as a stance, yes | Cheap, paid back twice by Quintero. Keep. |
| C2 | yes | "What is a traitor worth to you?" is put four ways. The arrested branch (keep your word, or trade with the mole) is the best small dilemma in the file. |
| C3 | no | A ten-second stance paid only in a credits clause and a recall line. Candidate cut (§8). |
| C4 | yes on selling branches, as a stance elsewhere | Talking Ghost out against baiting is now a real trade (no sale against one cell). The broken-deal hook is still the strongest beat in Act 2. |
| C5 | yes | Kind and quick against hard and thorough, both felt tonight (Priya's coat; the supplier's delivery). |
| C6 | yes | Captured Voltage is a clean trust question; Wendell's call has a real cost now. Escaped Voltage is a puzzle in all but name (print or sheet), which is fine as m04's payoff. |
| C7 | n/a (information) | |
| C8 | yes | A reduced sentence for the woman who sold St. Catherine's, against her book. Make the skip cost visible (R2-12). |
| C9 | only on bait | Otherwise a free task that flattens C13 (R2-01). |
| C10, C11 | n/a (tasks) | Planned cuts, correctly labelled. |
| C12 | yes, as a puzzle with a moral price | Loyalty with a price on both sides; Netherton's aside line makes not choosing a choice. |
| C13 | yes where Zero Day's share is live, thin where it is dead | Recruited Victoria's evidence-based trust is now a judgement, not a trap. |
| C14 | n/a (puzzle) | The record answers are where the season is felt; the slot pools now let a player's own history show. |
| C15 | a gateway | The dilemma is step 2 (R2-14). |
| C16 | yes | Now the season's best-balanced choice: three positions, each with a cost to strangers. |
| C17 | yes | F13 makes arrest and surrender different positions. Fire against hold fire is a real gamble under stated uncertainty. The cold option is the right weight. |
| C18 | as a stance, yes | Three distinct replies; the bluff option is a nice touch. |

Eight choices land as moral dilemmas wherever they appear (C2, C4 on the selling branches, C5, C6, C8, C12's price, C16, C17). Two more do so only on some saves (C9 on bait, C13 while Zero Day's share is live). That is about right for a finale. With R2-01 fixed, C9 and C13 become dilemmas on every save.

## 7. Worst lines, with rewrites

Most new lines are in voice and do their job: "I could. Watch my hands.", "I can kill one feed before four. Not both. Pick.", "I argued for the victims' fund. I lost.", and "She told me you'd break it. The Recruiter. She was right about you." The five weakest:

| # | Where | Line | Problem | Rewrite |
|---|---|---|---|---|
| 1 | §3.1 kept-shown, Netherton (MC:69) | "After tonight I will have to make him disappear." | Reads as a killing, from the man whose refusal to sign is the cold ending's verdict. The cost in the table is relocation ("Moved, and unreachable."). | "After tonight he gets a new name, and nobody reaches him again. Not even you." |
| 2 | §6.5 disclose at 06:00, HaX (MC:418) | "Three water utilities went to manual at five. Someone read the vendor list." | Implies a leak within the hour (R2-06), and "someone" is vague where the cost should be concrete. | "Three water utilities went to manual at five. There's no patch for their controllers. They'll turn the valves by hand till spring." |
| 3 | §6.5 wipe at 06:00, Netherton (MC:419) | "The cells paid for early access and got nothing. Nobody can sell this again, us included." | Credits the wipe with C9's work (R2-07); two sentences of different weight. | "Nobody holds the map now. Not him, not the buyers, not whoever sits in my chair next." (one line on every `head_start_out` value) |
| 4 | §6.5 secure, Netherton (MC:410) | "Send those out and you've told every buyer where to hit before anyone can fix anything." | "Before anyone can fix anything" undercuts his own previous sentence (the controllers can't be fixed at all); the sentence runs long for the menu's lead-in. | "Send those out and every buyer knows where to hit. Nobody can stop them." |
| 5 | §3.2 refused, Ghost's 06:00 texts (MC:123–124) | "You did it cleanly. Good." / "You checked. Good." | Two answers, one shape. "Good." twice reads like a template, and Ghost has more edge than that. | "Clean. I noticed." / "You checked. Most don't." |

Near miss: Netherton's tether line (MC:98) is wrong on two branches rather than badly written; R2-04 gives its branch form.

## 8. Scope

**Is about 28 route profiles realistic?** Only if the profiles are built as a covering set, which is not what MC:894 describes. Its method is "one per branch, each on default elsewhere". The list itself sums to more than 28: door 4 + Ghost 5 + workshop 3 + power room 4 + gallery 5 + double-cross 1 = 22, then bait × C9, recruited Victoria × C9, tripwire × WREN, five wrong-accusation officers, `alpha_tapes` × no Quintero and the KO nets bring it to 32 or more. It still leaves out the six endings, the core's resume and reload cases, the core KO path, Join's step-backs, C8's two options and the named branch.

Recommended shape, about the same effort:
- **About 20 full-length profiles**, each walking a non-default branch in every scene at once (a pairwise covering set over the five scenes, C9's options and the accusation outcomes). Assign the six endings and three database outcomes across them, so each appears at least twice.
- **About 10 short core profiles** that load straight into the core with globals injected: each ending; `join_step` 1–3 and back; a reload between each core menu; the core KO fallback; WREN free / caught / double-cross / no Quintero.
- **About 5 door and phone profiles** for the KO, walk-away and reload nets (Nightshade, Netherton's silent-branch menu, Ghost's call, Victoria's line).

That is about 35 runs, most of them short. It covers more than the stated 28 and is realistic against m07's 39.

**Anything else to cut?**
1. **C3, Arakawa's call, as a choice.** Keep the call and the telescope as his unprompted line ("She wants a telescope. I'm getting her a telescope."), and drop `arakawa_call` and the two-option menu. The recall line stays ("You heard me on the phone to her. Then you thought I'd do this?"). This saves a global and one pick, and loses nothing a player would feel.
2. **Vector's and Phantom's own wrong-accusation costs.** Give them the generic cost (their forward-post job goes, with one line), not two bespoke per-room effects. This saves staging on m08-rich saves only.
3. **Keep simplification 8 in reserve** as MC says. Don't cut C8 now: it is the database question in small.

Do not cut the one-share console. Fix it instead (R2-01): it is the hinge between Ghost, the gallery and the database.
