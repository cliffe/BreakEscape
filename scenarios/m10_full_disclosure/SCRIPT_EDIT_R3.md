# m10 "Full Disclosure": script edit, round 3

## Verdict

**Revise.** Each fix takes a few lines, and after them a targeted check is enough. Every R2 finding is in, nothing fails to compile, and loopcheck is clean on every state R2 touched. The HaX hub now tops out at ten. Four majors remain. Three of them came from R2 fixes or from the copying they caused:

1. **A3-01.** The database cost walk now has two buttons that ask the same thing. One of them, "[And if we send ours out?]", reuses Netherton's "Send them out" from the line before, where it meant publishing. This is the finale's biggest choice. A2-02 fixed one ambiguity here and created this one.
2. **A3-02.** At 06:00 on a cold start, or on any save with nothing in `numbers_more`, the player asks "[And the rest of it?]" and nobody answers. The next menu follows straight away, with "(Wait.)" again. A2-01's cut made this route common.
3. **B3-01.** On `taken`, "[In Helena. Your name on the placing sheet.]" claims evidence the player never had. In m09 the Recruiter said the name on the phone, and the placing sheet only gives the two-face shortlist. R2 copied this answer into 06:00, so it now appears in three files.
4. **A3-03.** The heaviest choice m08 lets a player make is knocking out their own handler, and m10 never says it. The knock-out only adds one to `ko_pattern()`. This is the same gap m09's round 3 found for m08's knock-outs.

There are ten minors. Five of them follow R2 fixes (A3-04, A3-05, B3-03, B3-04, C3-01). The other five are older lines that two rounds missed (A3-06, A3-07, B3-02, B3-05, B3-06).

| Group | Blocker | Major | Minor | Total |
|---|---|---|---|---|
| A | 0 | 3 | 4 | 7 |
| B | 0 | 1 | 5 | 6 |
| C | 0 | 0 | 1 | 1 |
| **All** | **0** | **4** | **10** | **14** |

Top five: A3-01, A3-02, B3-01, A3-03, A3-06.

After these edits, re-run loopcheck on `tesseract` (database, case), `six_oclock` (cold arrest, executed, `taken` surrender) and `kowalczyk` (`taken`), plus dialoguelint. A round 4 isn't needed.

## What was run

- **Read in full:** the skill (`npc-dialog-review`), PASS4_SCRIPT_EDITOR_PROMPT, FINALE_BRIEF, README_ink_best_practices, CONTRACT §8 and §9 (plus §1.4 and §2.3 where I needed them), SCRIPT_EDIT_R1, SCRIPT_EDIT_R2, all 33 `ink/*.ink` files and `credits_sections.json`. To check the `taken` route I also read three m09 passages: `m09_phone_recruiter.ink:150-176`, `m09_briefing.ink:25-60` and `m09_closing_debrief.ink:240-255`, and m09 CONTRACT row `sleeper_shortlist` (:317). The door log's room comes from m10 stage 0 and stage 5 R1. I didn't open any VM material.
- **What R2 changed:** `git diff 80334c1b 55ac3dea` on the ink and credits. That diff is the full list of R2 fixes, and I read every changed line in context.
- **Compile:** every `.ink` copied into `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_r3/ink/` and compiled there with `bin/inklecate`: 32 story files, no errors, no warnings, no loose ends. The repo's `.json` files were not touched.
- **dialoguelint:** 0 errors. The rule counts match R2's exactly: blank-reentry 14, stage-cue-in-info 5, not-x-but-y 2, crowded-hub 1 (the static count; see Structure), us-spelling 1 (Elena, ruled in R1), stage-cue-density 1. Spoken lines: `m10_tesseract` 184, `m10_six_oclock` 98, which match §9.
- **loopcheck** (200 steps × 6 strategies) on 18 states R2 touched. `tesseract` at the database, with and without `hax_asked_database`, and after it. `six_oclock`: arrest + disclosed; lethal + secured with the story, `quintero_ko` and the m06 money; executed; scorched; surrender on `taken`; arrest with protected Gary and `imran_outcome == "ko"`. `hearing` with and without `hax_asked_database`. Quintero at the core, wounded. Netherton's hub after an ending. Victoria recruited. The Farah guard. Ghost selling. Kowalczyk on `taken`. HaX's hub. No runtime errors anywhere.
- **Hub count:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_r2/hubcount.js` on R2's seed and four others (see Structure).
- **Transcripts:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_r3/play.js` walks a knot with fixed picks and prints the lines. I used it for the cold-start 06:00 (A3-02), the cold-start case (A3-06) and the database (A3-01).

## R2 confirmation

All 23 R2 findings are in, with the wording §9 records. Where a fix created a new problem, the last column names this round's finding.

**Group A**

| R2 | Now | New problem |
|---|---|---|
| A2-01 | `m10_six_oclock.ink:271-273` "[And the database?]" / "[(Wait.)]"; `:510` "[(Say nothing.)]" on executed; backdoor and Seattle lines cut from `numbers_more` | With the cut, `numbers_more` is often empty. Then "[And the rest of it?]" gets no answer, and the next menu has "(Wait.)" again (A3-02) |
| A2-02 | `m10_tesseract.ink:844` "Keep them, and the infusion pumps…"; `:846` "[And if we send ours out?]" | The two buttons now ask the same question, and "send ours out" takes Netherton's word for publishing (A3-01) |
| A2-03 | `:894-924` noun phrases | "What's left of Voltage's crew." lost "the watch on", so it names the people and not the operation (A3-04) |
| A2-04 | `m10_six_oclock.ink:125-136` gated as specified | The copied `taken` answer "[In Helena. Your name on the placing sheet.]" is false on its own route, now in three files (B3-01) |
| A2-05 | `:425` `and not six_k` | none |
| A2-06 | `:384` "went quiet with the first patches" | none |
| A2-07 | `m10_tesseract.ink:303` "[(Say nothing.)]" | none in itself. The menu before it can end on a player line with no reply, so the player speaks twice (A3-06, older) |
| A2-08 | `:119`; `m10_phone_agent0x99.ink:459` "Confirmed. Zero Day's share went." | none |
| A2-09 | flag 4's purge cut (`:188` now ends on the vault line); `:857` "…He'll be ready for it, and you won't have him after."; HaX's `vault_line` text keeps it (`m10_phone_agent0x99.ink:497`) | none |
| A2-10 | `:242` "A site left open…" | none |
| A2-11 | `credits_sections.json:53-56` | none |
| A2-12 | `hax_asked_database` declared (`m10_carryover_vars.ink:276`), written at `m10_tesseract.ink:881-882`, read at `m10_hearing.ink:51-55` | the variant is weaker than the line it branches from (A3-05) |
| A2-13 | `m10_six_oclock.ink:201-202` | none. Gary covering for the player ("I said I didn't see.") is a good beat, and it matches his workshop line `m10_gary.ink:51` |

**Group B**

| R2 | Now | New problem |
|---|---|---|
| B2-01 | `m10_phone_agent0x99.ink:66`, `:69`, `:73` | none. Ten at most on every seed I tried (Structure). Stage 9 still has to set `door_log_given` from the bark (§9) |
| B2-02 | `:177` "Most of it twice." | none |
| B2-03 | `m10_quintero.ink:184` "It'll keep. Go on.", `:186` "I've got the door. Go on." | "Shoulder." is gone. The new pair joins a run of "I've got the door / Go on" lines in three voices, and a "keep" run at the core (B3-03) |
| B2-04 | `:328` "Kowalczyk. I'll put it to Netherton." | none |
| B2-05 | `m10_director_netherton.ink:343` "Go and get warm. The paperwork will keep for an hour." | a fifth "keep" in the mission's closing stretch (B3-04) |
| B2-06 | `m10_kowalczyk.ink:250`, `m10_six_oclock.ink:127` "sign-out sheet" | none |
| B2-07 | header `:9` | none |

**Group C**

| R2 | Now | New problem |
|---|---|---|
| C2-01 | `m10_victoria.ink:191` "You have your door. Don't ask me for anything else." | it now echoes `:75` "There's your door." a click earlier (C3-01) |
| C2-02 | `m10_guards.ink:181` "This walkway's closed till six." | none |
| C2-03 | `m10_ghost_phone.ink:111` | none |

**Pattern.** As in R1, most of the new problems sit beside the fix: a rewritten button next to its twin (A3-01), a cut that empties a block whose menu stayed (A3-02), and a copied answer carried into a third file without checking its route (B3-01).

## Reading as a player

**A line players will quote, scene by scene.** Every big scene has one:
- Briefing: "The handbook has a chapter on raids by invitation. It is one page long. It says don't."
- Door scene: "He wrote fifteen years of me in his own hand. I'd know it anywhere. I learned to write like it."
- Arrival at the core: "Ninety-nine. You've done well with them." / "Still HaX."
- Exchange 3: "Somebody has to be the during. Better me."
- WREN: "I liked you. I'd still have pressed it."
- 06:00: "He is in a cell. The cells are not."; then HaX's "I said no. It took me till morning."
- Executed: "I will not put my name under this one."
- Hearing: "I'll tell them I wasn't asked."
- Citadel: "Find 0x00. Bring them in, and bring them to me."

The 06:00 callback "I know. I kept it to one page." pays off the handbook line from the briefing. It is the best quiet joke in the episode.

**The careful full history** (m01–m09, kind choices, sleeper named in Helena, backdoor closed). This is still the best night. The case uses the player's record as evidence, and the exchanges let them answer with it. What stops this save cold is the database (A3-01): with a rich m03/m08 history, Netherton names Sterling's watch and Nightshade's channel. Those two operations are what the player built over two missions. The button that leads to them, though, reads "[And if we send ours out?]", one line after Netherton used "send them out" for the publication. Fix that line and this is the strongest scene in the season.

**The ruthless save** (many knock-outs; a raid member down; lethal). The knock-out band stings ("That isn't a lapse. It's a method."). Quintero's "I know who." and Netherton's "bruises ENTROPY did not give them" make tonight's knock-outs personal. Past knock-outs don't get the same treatment. A player who knocked out HaX at the Citadel in m08 hears about it once, in m09's briefing ("You put me on the floor at the Citadel. I'm still running you."). In m10, Tesseract has "watched" every operation and quotes the m07 debrief word for word, but he never mentions the m08 knock-out. It is only a +1 in `ko_pattern()` (`m10_carryover_vars.ink:314`). m09 had Netherton say his own knock-out "once", so his silence here is right. HaX's is the one the finale should use, and Tesseract is the right person to use it, because she is on the line (A3-03).

**The cold start.** It reads cold, and the briefing does its job. Two places go dead:
- 06:00 (A3-02): "[And the rest of it?]" gets nothing. A cold-start player has no Social Fabric story, no m06 money and usually no raid knock-outs, so this is the default cold experience.
- The case (A3-06): case_recruiter prints nothing on a cold start, so "[You've watched. So what?]" is followed at once by "[Make your argument, then.]", and the player speaks twice.

**Join.** Unchanged since R2, and still the best-signposted dark choice in the series. HaX's silence after "0x00. Don't." is the right call.

**Scorched Earth.** At 06:00 the new "[And the database?]" button lands well on this route: Netherton answers it with the suspension. In the hearing, a player who asked HaX at the core gets the branched last line. That line now makes her sound evasive to the board ("I wouldn't choose"), when it should make her loyal (A3-05).

**Executed.** Bleak, and right. "(Say nothing.)" twice, one line apart, works here because the player has nothing to say.

**Do past choices change what people say and do?** Mostly yes:
- m01 (the attack, the Derek choice), m02 (bed four, Gary), m04 (disclosure, the crew), m06 (Satoshi), m07 (the debrief, Seattle) and m09 (everything) are Tesseract's evidence, and several become the player's own rebuttals. Those are arguments, not name-checks.
- m03 decides the gallery, m02 decides Ghost's call and the workshop, m08 decides the door scene and who is at the table.

The gaps:
- the m08 HaX knock-out (A3-03).
- m05 reaches m10 only through m09's forty-seven and the closing card's `close_human`. That is acceptable, since m09 carried it.
- `m07_mercer_fate` and `m07_hollis_resolved` aren't read in the ink. Stage 0 uses them for who stands in the server hall and what the duty board shows, and stage 9 owns both.

**Where the pace sags.**
1. The database's cost walk: four pairs of buttons, two of them flat (A3-01, and R2's "[Put him through.]" / "[Then he can listen.]").
2. The two bridge breaths between the exchanges show the same two buttons twice (A3-07).
3. On a cold start, 06:00's two stacked menus with nothing between them (A3-02).

**Fake choices.** A3-01 (new). B3-02, an old one: "[Do we know who?]" gets the reply written for "[Then bench the team.]". B3-05: "[He's put that in writing?]" refers to a figure nobody has said yet. Every other convergent pair either sets a stance or works as a breath between beats.

## Voices across groups

- **HaX** (A, B, C): consistent. Dry, fact first, and "0x00" saved for the moments that matter ("0x00. Don't.", "0x00." after the execution). Her phone text, her voiced calls and her lines in Tesseract's and Ghost's scenes all sound like one person. The only drift is a verbal habit she shares with others (below).
- **Netherton** (A, B, C): consistent after R-2 and A2-03. He uses full forms when a line carries weight and clipped noun phrases for numbers. The new database list ("The watch on Sterling." / "Nightshade's channel.") suits him. "What's left of Voltage's crew." is the one item that breaks the pattern (A3-04).
- **Tesseract** (A only): one voice from first line to last. He grades, he never rounds, and he gives up exactly what was proved.
- **Kowalczyk** (A, B): consistent West London ("your nan", "Mostly mud.", "Where else."). The fix for B3-01 gives her a line about her mum's care home. That is m09's fact in her own words, and it is the first time she speaks about why.
- **Quintero** (A, B): her West Texas dryness holds everywhere except her two new resting lines at the core. "It'll keep. Go on." and "I've got the door. Go on." could be anyone's. They also echo three other voices: Nightshade's lock bark "Go on. I've got the door." (CONTRACT §1.5 row `lock`), the minder's "I've got the lock. Go on." (`m10_minders.ink:38`) and her own "Go on. I've got this side." (`m10_quintero.ink:162`). See B3-03.
- **A shared habit: "keep".** In the closing stretch, five voices lean on the same verb: HaX "Get on his box. He'll keep." (`m10_tesseract.ink:130`), Tesseract "Finish on my box first. I'll keep." (`:169`), Quintero "It'll keep." (`m10_quintero.ink:184`), Netherton "The paperwork will keep" (`m10_director_netherton.ink:343`), and HaX's text "Fine. It keeps." (`m10_phone_agent0x99.ink:304`). The HaX/Tesseract pair is a deliberate echo, and R2 was right to keep it. The other three dilute it. B3-03 and B3-04 remove two of them.

## Group A findings

**A3-01 (major) `m10_tesseract.ink:840-848`, `:894`: the database's cost walk has a duplicate button, and the duplicate is ambiguous.** The transcript on a careful save:
- Netherton: "…Send them out and every buyer knows where to hit."
- "[And if we keep them?]" / "[Go on, sir.]"
- HaX: "Keep them, and the infusion pumps… are still live next year."
- "[What does it cost to send ours to the vendors?]" / "[And if we send ours out?]"
- Netherton: "Two operations go dark if you do this."

The two buttons ask the same question, so the choice is fake. Worse, "send ours out" is the phrase Netherton used one line earlier for publishing to every buyer. A player who picks it hears "Two operations go dark", which is the cost of vendor disclosure, as if it were the cost of publishing. R2's A2-02 aimed to remove exactly this confusion in the scene that decides the finale. Fix: one question and one breath, with the noun moved into Netherton's opener so it works after either:
```
+ [And if ours go to the vendors?]
+ [(Wait.)]
-
-> database_ops ->
```
and `:894` "Director Magnus Netherton: Send ours to the vendors, and two operations go dark." `:849` "Both of them run through holes on that list…" still follows. Audio: 0 (one line reworded).

**A3-02 (major) `m10_six_oclock.ink:266-274`, `:300-317`: "[And the rest of it?]" can get no answer.** `numbers_more` prints nothing unless one of these holds: the story ran, a raid member was knocked out, Victoria was confronted, or the m06 money was seized. After A2-01's cut, a cold start fails all four, and so does a careful save with m07 on `fracture` and no knock-outs. The transcript (cold, arrest, disclosed): Netherton "The cells got nothing at four." → "[And the rest of it?] / [(Wait.)]" → nothing → "[And the database?] / [(Wait.)]". The player asks and is ignored, in the last scene. Fix: offer the first menu only when there is something to say, and vary the second.
```
-> numbers_core ->
-> more_menu ->
+ [And the database?]
+ [(Nod.)]
-
-> database_beat

=== more_menu ===
{ not ((media_story_ran and ending != "executed") or kowalczyk_ko or quintero_ko or arakawa_ko or vector_ko or phantom_ko or victoria_gallery == "confronted" or (m06_assets_seized and ending != "executed")):
    ->->
}
+ [And the rest of it?]
+ [(Wait.)]
-
-> numbers_more ->
->->
```
The condition mirrors `numbers_more`'s four blocks; keep the two in step. `executed` still calls `numbers_more` directly and keeps its single "(Say nothing.)". Audio: 0.

**A3-03 (major, experience) `m10_tesseract.ink:614-624`: m10 never mentions that the player knocked out their own handler in m08.** `m08_hax_ko` adds one to `ko_pattern()` (`m10_carryover_vars.ink:314`) and nothing more. m09 used it once (HaX: "You put me on the floor at the Citadel. I'm still running you.", `m09_briefing.ink:54-55`), and Netherton's knock-out was said "once" in m09's debrief. Here Tesseract quotes the m07 debrief and the m06 cell to the player, but not this, while HaX is listening on the line. Add one line after the band block in `ko_sting`, so it plays in exchange 3 just before his reply:
```
{ m08_hax_ko:
    Dr Adrian Tesseract: At the Citadel, it was your own handler.
}
```
It fits every band, because `m08_hax_ko` makes `k` at least 1. On "[HaX. You're on speaker.]" her lesson speech then follows his line, and it lands harder. Audio: +1, on that save only.

**A3-04 (minor) `m10_tesseract.ink:913`: "What's left of Voltage's crew."** Every other item in the list is an operation (a watch, a channel, a tap). This one names the people, so "two operations go dark" now seems to include a gang. Use "Director Magnus Netherton: The watch on what's left of Voltage's crew." That is still shorter than before R2.

**A3-05 (minor) `m10_hearing.ink:52`: the A2-12 variant undercuts her.** "I'll tell them you asked me, and I wouldn't choose." As testimony to a board, "I wouldn't choose" sounds like she dodged the question. The base line works because it is loyal and sharp at once. Echo what she said at the core instead ("This one's yours."): "Agent HaX: They'll ask me if I'd have stopped you. I'll tell them you asked, and I said it was yours." Same length.

**A3-06 (minor, older) `m10_tesseract.ink:274-307`: the player speaks twice in a row.** On a cold start, or on any m09 save where `case_recruiter` prints nothing (no secret, not `taken` or `double_crossed`, and `named` or `refused` without Albion), "[You've watched. So what?]" has no reply. The next menu, "[Make your argument, then.] / [(Say nothing.)]", follows at once. The transcript confirms it. Fix: skip the second menu when the recruiter beat is empty. Same lines, no new audio:
```
=== case_recruiter ===
~ temp rec = m09_recruiter_secret == "kept" or m09_recruiter_secret == "told" or m09_recruiter_secret == "confessed" or m09_recruiter_secret == "denied" or m09_recruiter_offer == "double_crossed" or m09_recruiter_offer == "taken" or ((m09_recruiter_offer == "named" or m09_recruiter_offer == "refused") and m09_albion_notified)
{ not rec:
    -> case_close
}
… the two existing blocks …
+ [Make your argument, then.]
+ [(Say nothing.)]
-
-> case_close

=== case_close ===
~ case_heard = true
Dr Adrian Tesseract: Three things. Answer them properly and I'll tell you so.
-> core_router
```
"[You've watched. So what?]" → "Three things." then reads as his answer.

**A3-07 (minor, polish) `m10_tesseract.ink:417-418`: the same breath twice.** `exch_bridge` shows "[Go on.] / [You're not finished.]" after exchange 1 and again after exchange 2. The second time, call back to his "Three things.":
```
+ { exchange_2 == "" } [Go on.]
+ { exchange_2 == "" } [You're not finished.]
+ { exchange_2 != "" } [And the last one?]
+ { exchange_2 != "" } [(Let him go on.)]
```
Exactly two options show either way. Audio: 0.

## Group B findings

**B3-01 (major) `m10_director_netherton.ink:243`, `m10_kowalczyk.ink:93`, `m10_six_oclock.ink:131`: the `taken` answer to "When did you know?" describes something that didn't happen.** "[In Helena. Your name on the placing sheet.]" On `taken`, the player learned the name from the Recruiter, on the phone: "Sensible. Halina Kowalczyk. Her mother's care home has had my check for eleven years." (`m09_phone_recruiter.ink:150-156`). m09's placing sheet sets only `sleeper_shortlist` (m09 CONTRACT:317), and HaX calls that "Two faces from Helena". So the answer quotes evidence the player never had (rule 2i). It is offered to every `taken` player, in the aside, at the van and, since A2-04, at 06:00. Kowalczyk's reply, "The paperwork. It's always the paperwork.", then confirms the false claim. The true answer is also the stronger scene: she was sold by the people who paid her. Fix, in all three files (value still `bench`):
- the button: "[In Helena. She sold me your name.]"
- `kow_reply` (`m10_six_oclock.ink:142-151`), first:
```
- kowalczyk_answer == "bench" and m09_recruiter_offer == "taken":
    Agent 0x5E 'Lantern': Eleven years she paid my mum's care home. Then she sold me to you.
```
Audio: +1, on `taken` only. CONTRACT §1.4 `aside_taken`, §1.4 Kowalczyk `van`, §1.3 `walkabout` and §9 quote the old words and need the same change.

**B3-02 (minor, older) `m10_director_netherton.ink:217-220`: one reply serves two questions.** "[Then bench the team.]" and "[Do we know who?]" both get "Bench four agents tonight and WREN knows we know. They stay together." That answers the first and ignores the second. Give the second its own reply: "Director Magnus Netherton: No. And if I bench four agents to find out, WREN knows we know." Audio: +1 distinct line, 0 per route.

**B3-03 (minor) `m10_quintero.ink:184`, `:186`: B2-03's resting lines lost her voice and echo three others.** See Voices: Nightshade's "Go on. I've got the door.", the minder's "I've got the lock. Go on." and her own "Go on. I've got this side." On the wounded arm, "It'll keep." is the third "keep" said in this room. Rewrite. The reply to "[Thanks.]", "Don't. Finish it.", still follows:
- `:184` "Agent 0x2D 'Anchor': One arm's plenty for a door. You've got work."
- `:186` "Agent 0x2D 'Anchor': Door's mine. You've got work."

**B3-04 (minor) `m10_director_netherton.ink:343`: another "keep".** Use "Director Magnus Netherton: Go and get warm. The paperwork can wait an hour."

**B3-05 (minor, older) `m10_director_netherton.ink:123`: "[He's put that in writing?]" refers to nothing said yet.** The line before it is "The cells get it at four…" (or Vector's refusal), and his reply ("Signed it. Eleven hundred…") answers a question about a casualty figure the player hasn't heard. Use "[Has he costed it?]". "Signed it." still answers it, and it sets up Tesseract's "I've costed both." at the core.

**B3-06 (minor, older) `m10_arakawa.ink:162`: on the tether, Arakawa repeats Quintero's line about a moment he didn't see.** With `nightshade_tethered`, Kowalczyk peels off at the security office and Quintero says "Service side. She always takes the door nobody's watching." (`m10_quintero.ink:73`, the contract's stand-in for Arakawa). If the player goes back up to the blast door and talks to Arakawa, his `menu` plays the same line, though he never saw her go. Add `and not nightshade_tethered` to the `:162` condition.

## Group C findings

Still the cleanest group. Group C's five full scenes (Nightshade, Ghost, the workshop, the power room, the gallery) each give a different reward for the player's past choice, and every one rests on a quiet knot that loopcheck passes.

**C3-01 (minor) `m10_victoria.ink:191` against `:75`: C2-01's replacement still echoes her.** When she sells the raid, she says "There's your door. I'm sorry. Zero Day still pays, and you don't." A click later, the resting line says "You have your door. Don't ask me for anything else." Use "Victoria Sterling: We're square. Don't ask me for anything else."

## Structure

- **Compile:** clean (see What was run). Person-chat files still use no `END` or `DONE`, and HaX's phone threads end `-> DONE` after `#exit_conversation` (R-7).
- **dialoguelint:** unchanged from R2, and every earlier ruling still applies. Its `crowded-hub` count of 25 is the static total of `support_hub`'s options. The runtime count is the one that matters (below).
- **loopcheck:** 18 states, no errors (listed in What was run). This covers every knot or menu R2 added or rewired: the two new 06:00 menus, the `hax_asked_database` branch in both files, the `taken` answers at 06:00, protected Gary on `imran_outcome == "ko"`, and Quintero's, Victoria's and the Farah guard's new lines.
- **HaX hub count** (`hubcount.js`):

| Seed | Choices |
|---|---|
| R2's seed (flag 2, power room, shutter live, door and bench logs, m06 money, guide, backdoor live) | 10 |
| the same with `door_log_given` | 10 (alibi replaces the door log) |
| officer out with the alibi held, plus the rest of R2's seed | 10 |
| security office, flag 1 only, both logs, m06 money, guide 2 | 9 |

The cap holds. A seed with the door log before the breach reached 12, but it can't happen: the door log is in the security office (stage 0, stage 5 R1 §2b), and the three briefing topics retire at `breach_open`.
- **Fixes that touch structure:** A3-02 adds a tunnel knot (`more_menu`), and A3-06 a knot (`case_close`). Both have one entry and leave by `->->` or `-> core_router`, so neither needs a quiet flag. I applied both, exactly as written above, to scratch copies in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_r3/patched/`. They compile, the cold and rich 06:00 transcripts and the cold case read as intended, and loopcheck is clean on cold arrest, executed, and the case cold and on `taken`. Re-run loopcheck on `six_oclock` (cold arrest; executed) and on `tesseract` at `case` (cold; `taken`) after the edit.
- **Rule 2i (choices quoting what wasn't seen):** B3-01 and B3-05.
- **Same fact twice:** C3-01, and the echo inside B3-03.
- **Stage 9 carry-overs (unchanged):** `hax_asked_database` and `door_log_given` in `globalVariables` and the bark mapping (§9).

## Audio

**Counts confirmed against §9:** Tesseract 184 and 06:00 98 (dialoguelint's spoken-line counts), hearing 9, Citadel 2, Kowalczyk core 2. Calls are unchanged at 81 (HaX 28, Ghost 26, Vance 10, Elena 10, Victoria 7). R2's rewrites touched no call knot except Ghost's one HaX line, which kept its count. No m10 audio has been generated yet, so rewording costs nothing.

**This round's changes:**

| Finding | Distinct lines | On one route |
|---|---|---|
| A3-01, A3-04, A3-05, B3-03, B3-04, C3-01 (rewordings) | 0 | 0 |
| A3-02, A3-06, A3-07, B3-05, B3-06 (structure or button text only) | 0 | 0 |
| A3-03 (Tesseract names the m08 knock-out) | +1 | +1, m08 `hax_ko` saves |
| B3-01 (Kowalczyk's reply on `taken`) | +1 | +1, `taken` saves |
| B3-02 (Netherton's own reply to "[Do we know who?]") | +1 | 0 |
| **Net** | **+3** | **+2 at most, on a save that is both `taken` and m08 `hax_ko`** |

That is roughly flat. If a strict zero is wanted, one cut with no loss: `m10_six_oclock.ink:287` "The cells got nothing at four." on the `else` arm repeats HaX's "Confirmed. Nothing left the lock." from the core. A3-02, though, wants `numbers_core` to print at least one line before its menu. So cut it only together with A3-02's guard, and accept that a cold `else` save then goes from "(Let him talk.)" straight to "[And the database?]". I would keep the line.

## Improvements

The ten best, in the order a player would notice them. Each rewrite is given in full under its finding. Net audio: +3 distinct lines, +2 at most on any one save.

1. **A3-01. One clear question before the finale's biggest choice.** "[And if ours go to the vendors?]" / "[(Wait.)]", and Netherton opens "Send ours to the vendors, and two operations go dark." Audio 0.
2. **A3-02. Nobody is ignored at 06:00.** "[And the rest of it?]" appears only when Netherton has more to say; the database menu becomes "[And the database?]" / "[(Nod.)]". Audio 0.
3. **B3-01. Kowalczyk's last question gets a true answer on `taken`.** "[In Helena. She sold me your name.]", and she replies "Eleven years she paid my mum's care home. Then she sold me to you." Audio +1.
4. **A3-03. The m08 knock-out of HaX lands where she can hear it.** Tesseract, after his band line: "At the Citadel, it was your own handler." Audio +1.
5. **A3-06. The player never speaks twice in a row in the case.** Skip the recruiter menu when the recruiter beat is empty (`case_close`). Audio 0.
6. **A3-05. HaX's last word at the hearing stays loyal.** "I'll tell them you asked, and I said it was yours." Audio 0.
7. **B3-03. Quintero sounds like Quintero at the core.** "One arm's plenty for a door. You've got work." / "Door's mine. You've got work." Audio 0.
8. **B3-02. Netherton answers the question asked.** "No. And if I bench four agents to find out, WREN knows we know." Audio +1 distinct, 0 per route.
9. **A3-07. The second breath between exchanges counts down.** "[And the last one?]" / "[(Let him go on.)]". Audio 0.
10. **B3-05. The briefing's second question sets up the core.** "[Has he costed it?]". Audio 0.

The zero-cost minors should go in the same pass: A3-04, B3-04, B3-06 and C3-01.
