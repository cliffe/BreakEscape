# m10 "Full Disclosure": script edit, round 2

## Verdict

**Revise.** The fixes are small, and this round should be the last full one. Every R1 finding is resolved, and nothing has regressed. There are no blockers. Everything compiles, the lint shows nothing new, and loopcheck is clean on every state R1 touched. Three majors remain, and each takes a few lines of ink:

1. HaX's hub shows 13 choices on a busy save, against the cap of ten (B2-01).
2. At 06:00 Netherton can run seven lines with no choice and no other voice (A2-01).
3. In the database scene, HaX's pump line says "if we do this" right after a choice that leaves "this" unclear. It is the cost line for the choice the finale turns on (A2-02).

The other 20 are minors. Eight of them come from R1 fixes landing next to an existing line (A2-03, A2-04, A2-05, A2-08, B2-02, B2-03, C2-01, C2-02).

| Group | Blocker | Major | Minor | Total |
|---|---|---|---|---|
| A | 0 | 2 | 11 | 13 |
| B | 0 | 1 | 6 | 7 |
| C | 0 | 0 | 3 | 3 |
| **All** | **0** | **3** | **20** | **23** |

The five that matter most: B2-01, A2-01, A2-02, A2-03, A2-04.

After these edits a targeted check is enough: re-run the hub count, loopcheck on `six_oclock` and `tesseract`, and dialoguelint. A round 3 is not needed.

## What was run

- **Read in full:** the skill (`npc-dialog-review`), the pass-4 editor brief, FINALE_BRIEF, CONTRACT draft 2 (§0–§8), SCRIPT_EDIT_R1, every `ink/*.ink` (33 files) and `credits_sections.json`. For context I also read MC §6.7 and §7 (Join, and the import defaults), OT §4.7 on the closing chain, and two m04 lines (Voltage's "above him" line; Albion's name). I did not open any VM material.
- **Compile:** all 32 story files plus the include, compiled with `bin/inklecate` into `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_r2/ink/`. No errors, no warnings, no loose ends. The repo's `.json` files are untouched.
- **dialoguelint:** 0 errors. Rule counts are the same as R1's (blank-reentry 14, stage-cue-in-info 5, not-x-but-y 2, crowded-hub 1, us-spelling 1, stage-cue-density 1), and R1's rulings on each still hold. Lint line counts: `m10_tesseract` 185, `m10_six_oclock` 100.
- **loopcheck** (200 steps × 6 strategies) on 25 seeded states. `tesseract`: cold; greeted; all three exchanges missed with `join_step=2`; console stopped with the whodunit live, with and without `quintero_ko`; double-crossed. `six_oclock`: arrest with `wren_at_core`; surrender on `taken`; scorched; executed + disclosed; lethal + secured + denied. Also `hearing`, `citadel`, `kowalczyk_core`, `arakawa` (gone ahead), `kowalczyk` (bunker with all clues; `taken`), `nightshade` (arrested, both reads), `victoria` (threat), `guards` (tunnel; gallery), HaX's phone, Netherton, Quintero at the core (wounded) and `hax_post`. No runtime errors anywhere.
- **Hub count:** a seeded inkjs walk of HaX's `support_hub`, at `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_r2/hubcount.js` (B2-01).
- **voicelines.mjs** on the five call files, with the HaX calls counted by knot.

## R1 confirmation

All 50 R1 findings, the seven rulings and the twelve cuts are in. Where a fix created a new problem, the last column points to this round's finding.

**Group A**

| R1 | Now | New problem |
|---|---|---|
| A-01 | `m10_six_oclock.ink:37` "The forward post, a few minutes before six."; `:42` "The arrest teams are at the doors. They go on the hour." The screen still turns to six at `:437`. | none |
| A-02 | `credits_sections.json:118-142`: five clauses in order, with "Badge still active." last | none |
| A-03 | `m10_tesseract.ink:823-827` `wren_react`; `:803` "Shoulder. Leave it." | "Shoulder." now opens three of Quintero's lines (B2-03) |
| A-04, A-05 | `m10_citadel.ink:16-20` | none |
| A-06 (R-4) | `m10_six_oclock.ink:90` "…on the floor down there. I know who." | none |
| A-07 (R-3) | `m10_six_oclock.ink:158-162` | none |
| A-08 (R-2) | `m10_tesseract.ink:842`, `m10_six_oclock.ink:272`, `:370` | none |
| A-09 (R-5) | `m10_kowalczyk_core.ink:20` "He's the one you came down for. Go on." | none |
| A-10 | `:102` "Two cells have it. Much good may it do them."; `:118-124` the four "Confirmed…" lines, the same words in `what_went_out` | "Confirmed. Zero Day's went." has no noun (A2-08) |
| A-11 | `:127` "Voltage said above Blackout…". The source is m04 `m04_npc_voltage.ink:270`. HaX reports it, so it holds even for a player who missed that branch. | none |
| A-12, A-13, A-14, A-15 | `:205`; `:322-326`; `:496` (12 words; "Nine years late." gone); first-landed only | none. The exchange 2 button lengths still meet §5.4 |
| A-16 | `:660-666`: a second "Show me" resumes at `join_1_menu` | none. A second "[Give me the key.]" replays "0x00. Don't.", which works well |
| A-17 | "The one he used on you." is gone | the pump line that replaced it is ambiguous (A2-02) |
| A-18 | `:860` "Then nobody has it, and nobody fixes anything either. We both answer for it." | none |
| A-19, A-20 | flask line gone; Gary `:206`, Wendell `:232` | none |
| A-21 | `:53` `kow_here = sleeper_caught or wren_at_core`; `:125` the fourth answer | HaX then repeats the player's own answer at `:424` (A2-05). The C18 menu itself can quote unseen evidence (A2-04) |
| A-22, A-23 | `m10_hearing.ink:17`; `m10_tesseract.ink:1070` | none |
| A-24, A-25 | credits by designation; `:303` "Someone in the second van…" | none |
| A-26 | accepted unchanged | none |

**Group B**

| R1 | Now | New problem |
|---|---|---|
| B-01 | `m10_phone_agent0x99.ink:262-282`: Malhotra, Arakawa, Kowalczyk, Quintero, Vector, Phantom | none |
| B-02 | `m10_director_netherton.ink:245`, `m10_kowalczyk.ink:96` "[Before Helena. I had a feeling about you.]" | the 06:00 copy of C18 was left alone, and on a rare `taken` save it still offers the laugh (A2-04) |
| B-03 | `m10_director_netherton.ink:122`, `:124` in words, ending "Not few." | none |
| B-04 | HaX `:200`, `:632`, `:678`; Vance `:18`; Elena `:17`; 06:00 `:173`. A grep finds no "shutter … down" left in any voice | none |
| B-05, B-06, B-07 | `:226` "daughter"; `:531` "[Kill the resale.]"; `:611` one Sterling line | none |
| B-08 | `:171` "He wants it to be one of ours. Ask him why. He'll enjoy telling you." | `:177` now also says "Ask him at the end. He'll tell you." (B2-02) |
| B-09, B-10, B-11 | `:161` "(Say nothing.)"; `:358`, `:362`; `:150-154` gated on `m09_completed`; header `:14`; `:240` | none |
| B-12 | `m10_arakawa.ink:158-167` `arak_peel_said` | none |
| B-13, B-14 | `m10_hax_post.ink:26` "I'm on your phone now. Ring me."; `m10_phantom.ink:34` | none |

**Group C**

| R1 | Now | New problem |
|---|---|---|
| C-01 | `m10_nightshade.ink:57` "…in his own hand. I'd know it anywhere. I learned to write like it." "Line item" is saved for 06:00 | none |
| C-02 | `:137` "I am keeping him… that is on my signature as well." | none |
| C-03 | guards `:48` (tunnel only), `:58` "Coffee's on.", `:79`, `:136` | a new near-repeat between the Farah guard and Fonoti (C2-02) |
| C-04, C-05, C-06 | Ghost `:105`, `:143`; Elena `:66`; Victoria line `:32` | none |
| C-07 | Fonoti `:67` "[Shift change. Orders from upstairs.]" | none |
| C-08 | Victoria `:191` "Zero Day pays on time. You never did." | it repeats her own line four knots up, `:75` (C2-01) |
| C-09, C-10 | Gary `:28`, `:151` | none |

**Rulings and cuts.** R-1 to R-7 are all in; R-6's "I told you it'd be waiting." is at `m10_voltage.ink:207`. Cuts 1–12 are all in.

The cross-group fixes the brief named:
- **B-02**: covered above.
- **B-04**: consistent in every voice.
- **A-10**: covered above.
- **A-21**: covered above.
- **"Two operations go dark"** (`m10_tesseract.ink:894-927`): always exactly two lines, because the order-book watch always applies, and the order matches 06:00's `dark_ops` and `close_compute`. The rewrite is "goes dark" three times in a row (A2-03), and the scene now runs four Netherton lines before HaX speaks. That is inside the four-line allowance for a reveal.
- **Netherton's full forms**: every weighted line uses them now. A grep finds only the asides R-2 kept ("I'll have his collected.", "You'll be at the lock without her.", "I'll put that first.", "She'll have sold that too.").

## Reading as a player

**The careful full history** (m01–m09 played, kind choices, few knock-outs, the sleeper named in Helena, the backdoor closed). This is the best version of the episode. The briefing's "The arrests start at six, and no sooner. WREN would hear." pays off at 06:00 with "They go on the hour." His case reads the player's own record back to them one line at a time: Satoshi, Albion, Derek, the m07 debrief, then "Since your first day." It hits harder than any debrief list because he is using the record as evidence against the player. The record answers in the exchanges let the player argue back with the same history. The walkabout and Netherton's numbers carry Gary, Imran, Voltage, Wendell, Vector and the m06 money; HaX's forty-seven carries m05 and m09; the van carries Nightshade. This is the "who turns up, what's said to them" that FINALE_BRIEF asks for, not a list of name-checks.

**The ruthless save** (many knock-outs; a raid member down; the lethal ending). Exchange 3's sting ("That isn't a lapse. It's a method.") lands right before the player is asked about clean hands. Quintero's "I know who." and Gary's "You saved my career and then put me on the floor." make the knock-outs personal. Netherton's "Someone in the second van has bruises…" stays general. Two weak points:
- This save hears the longest unbroken run in the mission, Netherton's ledger (A2-01).
- HaX is as warm here as on the careful save ("I was a second behind you. Log it. I'll sign under you."). That is right for the justified shot, which is the only lethal ending a ruthless player can reach without the execution, so I would leave it.

**The cold start.** It reads cold, as §5.6 requires. Netherton introduces himself, Nightshade is "the mole" in one line, the name and "Ninety-nine" are set up in the briefing, and HaX plants "the rest" at the post. Tesseract's m01 fallback, "You handed Derek over", is MC §7's never-played default (the arrest line), so I haven't raised it. The cold player's one gap is A-26, accepted in R1: they can't ask for "the rest" at six, though HaX promised it at the post. "(Stand with her.)" still plays it.

**Join.** The signposting is well built. There are three steps, each with a way back. The figure is said once, then come "0x00. Don't." and "The key console asks once." "Thank you, Agent." and the held service door are chilling. HaX's silence after "Don't." is the strongest choice in the route, and his "You held your hand out for it. I won't forget that." punishes a player who stepped back. The Citadel is two lines and a narrator. That is thin, but it's by design (MC: her last word is a text). With "He told her it had to be one of ours", Netherton's knowledge is now justified.

**Scorched Earth.** The purge, the empty chair and the card ("Afterwards, then.") give the route a true ending of its own. At 06:00, Netherton suspends the player before HaX speaks, then the hearing gives her the last word. "They'll ask me if I'd have stopped you. I'll tell them I wasn't asked." is one of the best lines in the mission (see A2-12 for the save where the player did ask her).

**Does Tesseract's confrontation earn its weight?** Yes. His concessions give up exactly what was proved. The record answers make the player's history into arguments, not decoration. The exchange 3 speaker branch puts HaX's own words against his. "Ninety-nine." as his whole reply is the best single beat in the season.

**Does each ending land differently?** Yes, on its own beat and on its 06:00 last line:
- Arrest: "It's afterwards." at the van.
- Surrender: "He asked who taught you. I said I did."
- Lethal: "He reached. I'll put that first." and "There'll be a board."
- Executed: no HaX; Netherton's "I will not put my name under this one."; her credit "Her agent's file is on her desk, unopened."
- Scorched: the suspension and the hearing.
- Join: the Citadel.

The credits work as a last beat of their own. HaX's five clauses each call back her line in that ending ("I'm testifying." → "First on the prosecution's witness list."; "I'll sign under you." → "Her name is under her agent's on the board's papers."). Netherton's "Still in his chair." on Scorched answers "whoever sits in my chair next." The closing card is S6 §3's data, which stage 9 copies, so I couldn't read it here.

**Where the pace sags.**
1. Netherton's ledger at 06:00, on a rich or ruthless save (A2-01).
2. The database scene's middle. Four Netherton lines run in a row, two of the three choice pairs are flat ("[Put him through.]" / "[Then he can listen.]"; the two cost questions), and the purge warning repeats flag 4's (A2-09).
3. The run of flat choices in his case. Most pairs there are breaths, which is fine. "[Make your argument, then.]" / "[Say what you came to say.]" is the one pair where the two buttons say the same thing (A2-07).

**Fake choices worth fixing.** A2-07, plus the two flat database pairs (A2-02 makes one of them carry meaning). The other convergent pairs either set a stance or are breaths between beats, and they read as authored.

## Voices across groups

- **HaX** (A, B, C): consistent across the core (A), the phone and the post (B), and Ghost's and Imran's scenes (C). Short, dry, fact first, and "0x00" only where it counts. Two of her lines open on a name and a cue ("Kowalczyk. *a breath*…" on the line, "Kowalczyk. *quietly*…" at the core). They never play on the same save, so that's fine, but the text one shouldn't carry a cue at all (B2-04).
- **Netherton** (A, B, C): consistent after R-2. Full forms on weight, clipped noun phrases on numbers ("Not few."). A2-03's rewrite moves the operations list into that clipped style. His hub's "It is done. Sit down somewhere warm." echoes HaX's post line (B2-05).
- **Tesseract** (A only, plus his lines in B's briefing): one voice. He grades, he never rounds, and he gives up exactly what was proved. The one pairing worth keeping is HaX's "Get on his box. He'll keep." followed later by his own "Finish on my box first. I'll keep." It reads as a deliberate echo.
- **Kowalczyk** (A, B): consistent. West London ("your nan", "Mostly mud."), with the laugh kept for the crack and 06:00. "The case's sheet" in her C18 answer is clumsy in both files (B2-06).
- **Quintero** (A, B): consistent West Texas dryness. Her one tic is new. A-03 gave her "Shoulder. Leave it.", which now joins "Shoulder. It'll keep." and "Shoulder. I've had worse from a door." Also, her core rest line and its reply both end "Finish it." (B2-03).

## Group A findings

**A2-01 (major) `m10_six_oclock.ink:252-342`: Netherton's ledger can run seven lines with no choice and no other voice.** After "[And the rest of it?]" the player gets the following, all Netherton:
- `numbers_more` (`:290-314`), up to six lines: the backdoor, Seattle, the story, the bruises, the Zero Day tap, the twelve point eight million;
- then `database_beat` on `secured`: "His copy goes into the vault tonight, beside ours.";
- then, after HaX's three words, `secured_cell`.

A ruthless or rich save gets most of these. The cap is three lines (four for a reveal). The backdoor and Seattle lines also repeat what HaX and Tesseract said at the core a few minutes earlier (`m10_tesseract.ink:693-699`). Fix, keeping every outcome:
1. Add a choice between the ledger and the database. At `:264-265`:
   ```
   -> numbers_more ->
   + [And the database?]
   + [(Wait.)]
   -
   -> database_beat
   ```
   Do the same in `executed` (`:507-508`), with "[(Say nothing.)]" as the only option.
2. Optional, and only if S6's card already carries the partial release: cut `:290-298` (the backdoor line on each branch and "Seattle's went first."). The player heard both at the core. That saves 3 distinct lines and 1–2 on a route.

**A2-02 (major) `m10_tesseract.ink:843-848`: the cost of keeping the database is ambiguous on half the routes.** Netherton ends on "Send them out and every buyer knows where to hit." The player picks "[And if we keep them?]" or "[Go on, sir.]". HaX then says "Infusion pumps in a hundred and forty hospitals. Still live next year if we do this." After "[Go on, sir.]", "this" reads as "send them out", which is the opposite of what she means. The next choice, "[And the other way?]", has the same problem. This is the cost line for the finale's biggest choice. Rewrite:
- `:846` "Agent HaX: Keep them, and the infusion pumps in a hundred and forty hospitals are still live next year."
- `:848` "[And if we send ours out?]"

It adds no audio.

**A2-03 (minor) `m10_tesseract.ink:896-925`: "goes dark" three times in a row.** The R1 rewrite gives "Two operations go dark if you do this." / "The watch on Sterling goes dark." / "Nightshade's channel goes dark." Keep the opener and make the eight operation lines noun phrases. That is also his "Not few." register:
- `:899` "The watch on Sterling."
- `:903` "Nightshade's channel."
- `:907` "The HashChain tags."
- `:913` "The watch on Voltage's people."
- `:915` "What's left of Voltage's crew."
- `:917` "The Critical Mass watch."
- `:922` "The order-book watch."
- `:925` "Our tap on Zero Day's brokers."

`:851` "Both of them run through holes on that list." follows on cleanly. Same line count, and each line is shorter.

**A2-04 (minor) `m10_six_oclock.ink:123-132`: C18 at 06:00 offers answers built on things the player may not have seen.**
- "[At the bench log. Then your name on the case's sheet.]" is gated only on `sleeper_caught`. A player who named her on the line (which needs only `clue_door_log`) or stonewalled at card 1 may never have seen the bench log. Her own copy gates the same answer on `clue_bench_log` (`m10_kowalczyk.ink:250`).
- On a `taken` save where C18 went unanswered (the aside was closed mid-choice and the player never visited the van), the menu still offers the briefing laugh. B-02 removed that laugh from this route everywhere else.

Fix:
- `:127` `+ { sleeper_caught and clue_bench_log and m09_recruiter_offer != "taken" } [At the bench log. Then your name on the sign-out sheet.]`
- `:129` `+ { sleeper_caught and m09_recruiter_offer != "taken" } [At the briefing. You laughed too easily.]`
- Add two options gated on `m09_recruiter_offer == "taken"`: "[In Helena. Your name on the placing sheet.]" (`bench`) and "[Before Helena. I had a feeling about you.]" (`briefing`). These are the aside's own words.

**A2-05 (minor) `m10_six_oclock.ink:423-424`: HaX repeats what the player has just said.** A-21 lets the un-named Kowalczyk be visited at the van, where the player's only answer is "[I didn't. Not till you came through his door.]". A minute later HaX says "Kowalczyk came through his door for the key. Nobody named her before she did it herself." Gate it: `- wren_at_core and not sleeper_caught and not six_k:`. A player who skipped the van window still hears it.

**A2-06 (minor) `m10_six_oclock.ink:378`, `:382`: "went blind" twice in a row.** This happens when the Critical Mass watch and the order-book watch are the two operations listed. Rewrite `:382`: "Director Magnus Netherton: The order-book watch went quiet with the first patches."

**A2-07 (minor) `m10_tesseract.ink:304-305`: a fake choice.** "[Make your argument, then.]" and "[Say what you came to say.]" say the same thing, and his reply is the same. Make the second "[(Say nothing.)]". "Three things. Answer them properly and I'll tell you so." fits after either.

**A2-08 (minor) `m10_tesseract.ink:120` (and B's `m10_phone_agent0x99.ink:459`): "Confirmed. Zero Day's went."** The noun is missing. Use "Confirmed. Zero Day's share went." in both, so `what_went_out` still matches word for word. Same audio count.

**A2-09 (minor) `m10_tesseract.ink:190` and `:859`: the purge warning is said twice in one conversation.** At flag 4 HaX says "He's rigged this room. If both copies die, it purges: doors, lights, all of it. He'll be ready for that. We won't." At the database, with the exchanges in between, she says "If both copies die, this room purges itself. Doors, lights, everything. You won't have him after." The second one is the cost before the menu, so keep that one and fold in the first's warning:
- Cut `:190`. Her `vault_line` text still carries the warning for the phone.
- `:859` "Agent HaX: If both copies die, this room purges itself. He'll be ready for it, and you won't have him after."

That saves one voiced line.

**A2-10 (minor) `m10_tesseract.ink:244`: "A plant left open…"** In a mission about a sleeper, "a plant" reads as an infiltrator before it reads as Albion Energy Storage. The contract also keeps "the plant" off the machinery. Use "Albion. A site left open because someone decided the hole was worth more than the fix. I argued against that, once."

**A2-11 (minor) `credits_sections.json:51-64`: Quintero's credit ignores her knock-out.** Her 06:00 line on `quintero_ko` is "I know who. I'd like to know why, one day." Her credit then falls through to "Raid lead, Task Force Null." Add, first: `{ "text": "Raid lead. On her feet by Friday, and asking questions.", "condition": "globalVars.quintero_ko === true" }`. It states an outcome, not the cause.

**A2-12 (minor, optional) `m10_hearing.ink:51`: "I'll tell them I wasn't asked."** On a save where the player asked "[HaX. What would you do?]" (`m10_tesseract.ink:883`), she was asked, and refused. The line still half works: she wasn't asked whether she would stop the player. A variant would make it exact:
- Promote `tess_asked_hax` to a scenario global, `hax_asked_database`, declared in the include.
- Branch the last line: "Agent HaX: They'll ask me if I'd have stopped you. I'll tell them you asked me, and I wouldn't choose." (+1 line)

**A2-13 (minor, optional) `m10_six_oclock.ink:190-198`: protected Gary forgets Imran's knock-out.** At the workshop he said "You put him on the floor. I'll sit with him till someone comes." At 06:00 he falls through to the generic "Consultant. Lanyard and everything." Add, before `:197`: `- m02_gary_protected and imran_outcome == "ko":` "Gary Whitlock: I sat with Imran till the medics came. He asked who it was. I said I didn't see." (+1 line)

## Group B findings

**B2-01 (major) `m10_phone_agent0x99.ink:51-79`: the hub shows 13 choices on a plausible save.** The cap is ten (CONTRACT §5.1; R1 left this for stage 9). The seeded state: flag 2 submitted, power room entered, shutter not yet cut, whodunit open with the door log and bench log found, `m06_assets_seized`, a guide offered, backdoor live. The hub then shows:
1. What's still live?
2. The backdoor.
3. The hatch?
4. Talk me through the shutter.
5. I know who WREN is.
6. Who signed for the case?
7. Who was where at ten past?
8. The door log.
9. The fence.
10. How are you?
11. Where are we?
12. Field guide.
13. That's all.

If the door-log bark sets `door_log_given`, it is 12. Three gates bring it to ten without losing a topic before its moment:
- `:73` `+ {briefing_played and not flag2_submitted and not hax_how_asked} [How are you?]`. This is a briefing question, like the three above it. The m09 payoff stays available all through Act 1.
- `:69` `+ {flag1_submitted and m06_assets_seized and not server_hall_entered and not gallery_shutter_cut and not hax_fence_asked} [The fence.]`. The fence is a forward-post matter.
- `:66` `+ {clue_door_log and door_log_given and whodunit_live and not clue_alibi} [Who was where at ten past?]`. The door log is offered first, then the alibi. Stage 9 should set `door_log_given` on the log bark, as `:205` implies.

Re-run `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_r2/hubcount.js` on the same seed to confirm.

**B2-02 (minor) `m10_phone_agent0x99.ink:171`, `:177`: "Ask him" twice in one topic.** B-08's new line is "Ask him why. He'll enjoy telling you." The reply two lines later is "Ask him at the end. He'll tell you." Rewrite `:177`: "Because he's read everything you've ever signed. Most of it twice."

**B2-03 (minor) `m10_quintero.ink:184-189`: "Shoulder." three times, and "Finish it." twice in a row.** With A-03, Quintero opens three lines on "Shoulder.": the beat (`m10_tesseract.ink:803`), this resting line, and 06:00 (`m10_six_oclock.ink:98`). Her core rest line and its reply ("Don't. Finish it.") also both end on "Finish it.". Rewrite:
- `:184` "Agent 0x2D 'Anchor': It'll keep. Go on."
- `:186` "Agent 0x2D 'Anchor': I've got the door. Go on."

Keep `:189`.

**B2-04 (minor) `m10_phone_agent0x99.ink:328`: a stage cue in a text message.** "Kowalczyk. *a breath* I'll put it to Netherton." is hub text, so the asterisks print as written. Use "Kowalczyk. I'll put it to Netherton."

**B2-05 (minor) `m10_director_netherton.ink:343`: the same goodbye as HaX's.** "It is done. Sit down somewhere warm." sits at the same table as `m10_hax_post.ink:24` "It's done. Sit down a minute." Give him his own: "Director Magnus Netherton: Go and get warm. The paperwork will keep for an hour."

**B2-06 (minor) `m10_kowalczyk.ink:250` (and A's `m10_six_oclock.ink:127`): "the case's sheet".** It's an awkward possessive, and the thing is a sign-out sheet everywhere else (HaX's "Who signed for the case?", Phantom's list). Use "[At the bench log. Then your name on the sign-out sheet.]" in both.

**B2-07 (minor) `m10_phone_agent0x99.ink:9`: stale header.** The comment lists `gallery_open`; the knot is `gallery_open_call` (CONTRACT §8). This matters only to stage 9's reader.

## Group C findings

Still the cleanest group. The R1 interface changes (the `deal_close` knot, Fonoti's "Orders from upstairs", Ghost's card line, the shared guard resting knots) all hold under loopcheck.

**C2-01 (minor) `m10_victoria.ink:191` against `:75`: C-08's replacement repeats her own line.** When she sells the raid, `trusted_sells` says "I'm sorry. Zero Day still pays, and you don't." The re-talk line is now "Zero Day pays on time. You never did.": the same thought, a click later. Rewrite `:191`: "Victoria Sterling: You have your door. Don't ask me for anything else."

**C2-02 (minor) `m10_guards.ink:181` against `m10_fonoti.ink:25`: two gallery guards open on the same line.** "Nobody comes up that stair at night." (the Farah guard) and "Nobody comes up the stair this late." (Fonoti) are on the same walkway. Fonoti's is better, and it's his scene. Rewrite `:181`: "Guard: Who are you? This walkway's closed till six."

**C2-03 (minor) `m10_ghost_phone.ink:111`: HaX's warning in Ghost's call is hard to parse.** "Let it sell and you'll want the console for that share. It only does one." is heard once, on a voiced call. Rewrite: "Agent HaX: If it sells, the release console can kill that share. It only does one." That is still 14 words, and it names the right console (the server hall's; §5.6 keeps "his console" for the core).

## Structure

- **Compile:** clean (see "What was run"). The person-chat files use no `END` or `DONE`. HaX's phone file ends its threads with `-> DONE` after `#exit_conversation`, as R-7 sanctions.
- **dialoguelint:** unchanged from R1, and every R1 ruling still applies. The blank-reentry hits are quiet resting knots or silent phone home knots. The cue-in-info hits carry no number or code. The two not-X lines are the villain's one ("That isn't a lapse. It's a method.") and HaX's stated constraint ("Not both. Pick."), which is text. `crowded-hub` is B2-01.
- **loopcheck:** 25 states, no errors (listed in "What was run"). That includes every knot R1 added (`wren_react`, `parked`, `deal_close`, `threat_missed`, `fight`, `passed`) and every resume state R1 changed: Join's furthest-step resume, the WREN beat with and without Quintero, and C18 at 06:00 with `wren_at_core` or on `taken`.
- **Voiced calls:** checked by eye.
  - None has a narrator line or a printed variable. Nightshade's and Victoria's `{&…}` alternations are in person-chat, not calls.
  - Every call ends on `#exit_conversation`. HaX's calls then go to `DONE`; Ghost's to `ghost_after`; Vance's and Elena's to `cut_after` or their step menus; Victoria's to `call_after`.
  - None diverts into `start` or `support_hub`. The hub's "[Talk me through the shutter.]" reaches `cut_call` and exits after it (§4.1 rule 2).
  - HaX's `cut_call` and both phone cuts route on `cut_step`, so a re-ring lands on the first unanswered step.
- **The close:** `#complete_task:close_the_night` sits above the last spoken line in every closing scene: `six_oclock` (arrest, surrender, else, executed), `hearing`, `citadel`. On Scorched, `six_done` alone sits above Netherton's last line. That is OT §4.7's order, and nothing follows the completing line except one line and `#exit_conversation`.
- **HaX hub cap:** fails on the busiest save (B2-01). The other hubs are small. Netherton's shows at most four choices, `hax_post` three, and the 06:00 walkabout at most seven people plus "That's everyone.", with three picks.
- **Choices quoting what wasn't seen (2i):** A2-04 is the only hit.
- **Same fact twice (2i):** A2-05, A2-09, B2-02, C2-01.
- **Stale status (2i):** HaX's `where_are_we` and Netherton's re-entry still follow every stage.

## Audio

**Counts confirmed against CONTRACT §8.**

| File | §8 says | Counted now | How |
|---|---|---|---|
| `m10_tesseract` | 185 | 185 | dialoguelint's spoken-line count, Narrator included |
| `m10_six_oclock` | 100 | 100 | the same |
| HaX's calls | 28 | 28 | by knot: `breach_call` 5, `inner_door_call` 1, `tripwire_call` 2, `ladder_call` 2, `stair_call` 1, `gallery_open_call` 7, `cut_call` 10 |
| Ghost / Vance / Elena / Victoria calls | 26 / 10 / 10 / 7 | 26 / 10 / 10 / 7 | `voicelines.mjs` |
| **Calls** | **81** | **81** | |

The hearing (8), the Citadel (2) and the Kowalczyk core lines (2) are also unchanged. No audio exists for m10 yet, so none of this round's rewrites costs anything to re-voice.

**Easy cuts** (distinct lines / lines on one route):
1. `m10_six_oclock.ink:290-298`: the backdoor and Seattle lines at 06:00 repeat the core, so cut them, if S6's card carries the count (A2-01, item 2). **−3 / −1 to −2**
2. `m10_tesseract.ink:190`: the flag 4 purge line, folded into `:859` (A2-09). **−1 / −1**
3. `m10_six_oclock.ink:424`: gating HaX's Kowalczyk line on `not six_k` (A2-05) saves a line on that route. **0 / −1**
4. A2-03 shortens nine lines without changing the count, which helps running time more than the count.

A2-12 and A2-13 each add one line, on narrow saves. The net change is +1 distinct line without cut 1 and −2 with it, which is flat.

## Improvements

The ten best, in order of what a player would notice. Each rewrite is given above under its finding. The net audio change is +1 distinct line without the optional 06:00 cut, and −2 with it.

1. **B2-01. Bring HaX's hub to ten.** Gate "[How are you?]" on `not flag2_submitted`, "[The fence.]" on `not server_hall_entered`, and "[Who was where at ten past?]" on `door_log_given`. Audio 0.
2. **A2-01. Break Netherton's ledger at 06:00.** Add a "[And the database?]" / "[(Wait.)]" choice between `numbers_more` and `database_beat` (and "[(Say nothing.)]" on executed). Optionally drop the backdoor and Seattle repeats. Audio 0 (or −3).
3. **A2-02. Make the cost of keeping the database clear.** `:846` "Agent HaX: Keep them, and the infusion pumps in a hundred and forty hospitals are still live next year." and `:848` "[And if we send ours out?]". Audio 0.
4. **A2-03. Netherton's operations as noun phrases.** "Two operations go dark if you do this." / "The watch on Sterling." / "Nightshade's channel." This ends the triple "goes dark" and suits his voice. Audio 0.
5. **A2-04. C18 at 06:00 offers only answers the player could give.** Gate the bench answer on `clue_bench_log`; on `taken`, use the Helena wording. Audio 0.
6. **A2-09. Say the purge once.** Cut flag 4's version. At the database: "Agent HaX: If both copies die, this room purges itself. He'll be ready for it, and you won't have him after." Audio −1.
7. **B2-03. Quintero's "Shoulder." once less, and "Finish it." once.** `m10_quintero.ink:184` "It'll keep. Go on."; `:186` "I've got the door. Go on." Audio 0.
8. **A2-07. Make the case's last choice a real one.** "[Make your argument, then.]" / "[(Say nothing.)]". Audio 0.
9. **A2-13. Gary remembers Imran at 06:00.** "Gary Whitlock: I sat with Imran till the medics came. He asked who it was. I said I didn't see." This is the kind of consequence FINALE_BRIEF asks for: what the night did to someone, told by someone who cares. Audio +1.
10. **A2-12. HaX's last word at the hearing, when the player asked her.** "Agent HaX: They'll ask me if I'd have stopped you. I'll tell them you asked me, and I wouldn't choose." Audio +1, and it needs one promoted global.

The small zero-cost fixes are worth doing in the same pass: A2-05, A2-06, A2-08, A2-10, A2-11, B2-02, B2-04, B2-05, B2-06, C2-01, C2-02 and C2-03.
