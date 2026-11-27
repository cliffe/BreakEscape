# m09 Digital Archaeology: stages 1–2, review round 3 (confirmation, both lenses)

## Scope and method

Reviewer: fresh, read-only, 2026-10-21, round 3 (confirmation). Both lenses: writing and drama, and structure, consistency and playability. Read: `docs/agents/FINALE_BRIEF.md`; the `mission-alignment-plan` and `npc-dialog-review` skills; FINALE_ARC §1–9 and §13 ("FA"); `stage_1/story_arc.md` ("SA", cited by line), including §14–16; `stage_2/storytelling_elements.md` ("SE", by line); `REVIEW_R2_WRITING.md` and `REVIEW_R2_STRUCTURE.md`. For the m10 sync points I grepped m10's `stage_1/story_arc.md` ("m10 SA"). Shipped facts checked: m05 (TalentStack, the Recruiter's "cost me more"), m06 debrief (Satoshi's eighty-seven per cent, `m06_closing_debrief.ink:536`), m07 (the echo on the handset, `m07_architect_comms.ink:119-121`, and Portland as the site), m08 (ATHENA's "still signed out to Agent 0x47", `m08_opening_briefing.ink:21`; HaX's "Afterwards, not during", `m08_closing_debrief.ink:65`). All hold. I did not open VM_SHAPE, FINALE_VM_PLAN, SECGEN_MODULE_PLAN, SecGen or the field guides.

Severity as in round 2: **blocker** stops the next stage; **major** must be fixed in this stage before stage 3 builds on it; **minor** can go in passing or be handed on.

## Round 2 confirmation

### Writing (N-01 to N-17)

| ID | Resolved? | Evidence |
|---|---|---|
| N-01 | **Partly** | The price is said before the choice (SA:195, SE:66), the debrief says "about half" in both topics (SA:331–332), "the twelve" is gone from m09, and the tapes have a practical stake (SA:196, SE:301). Two holes remain in the route logic (R3-03, R3-04), and FA still says "Twelve" (stale copies below). |
| N-02 | Yes | Staged by default, the key all at once (SA:292, SE:349, SE:425). FA §1.2's first sentence still says "to everyone at once" (stale copies). |
| N-03 | Yes | HaX's first line on that branch (SA:270, SE:325); Netherton stops at "HaX." (SA:268). The "replaces the opening sentence" rule breaks one form (R3-05). |
| N-04 | Yes | SE:323, SE:327, as the rewrites. |
| N-05 | Yes | Three Reading-aware replies (SE:339–343). The `afterwards` one is weak (worst line 1). |
| N-06 | Yes | Two options on `schedule_read`, HaX's line otherwise (SA:299–300, SE:353–355). |
| N-07 | Yes | The reply sits at the pen (SA:338, SE:44). |
| N-08 | Yes | SA:323, §8 #15, SE:46. |
| N-09 | Yes | SA:197, SE:68. |
| N-10 | Yes | SA:337, SE:29. |
| N-11 | Yes | Every item listed in N-11 is swept in SE (§4.3, §5, §6.2, §7.1–7.2) and SA (the four-sentence report, SA:310). |
| N-12 | Yes in m09 | SA:271 labels the forms by import. FA §3.4 and §5.4 still say "Safe opened / Safe shut" (stale copies). |
| N-13 | Yes | SE:311. |
| N-14 | Yes | SE:161, SE:289. |
| N-15 | Yes | SE:197. |
| N-16 | Yes | SA:92, SA:212. |
| N-17 | Yes | `afterwards` set (SA:277, §8 #3), its own debrief line (SA:339), change 24; m10 SA:336 already reads it. SA §15's W-14 row (SA:580) still says "recorded as `same_in_your_place`" with no note that N-17 replaced it. |

16 of 17 resolved, 1 partly (N-01).

### Structure (R2-S01 to R2-S15)

| ID | Resolved? | Evidence |
|---|---|---|
| R2-S01 | **Partly** | The locks table is in (SA:464–472) and each step names its lock. Two steps still leak: the office code comes from a source that contradicts Victoria's route (R3-01), and "when the call ends" is not tied to the deck choice (R3-02). Flag 2 before the cage now plays the ledger before Sorensen's quote; the arc accepts that (SA:179) and the call still waits, which is enough. |
| R2-S02 | **Partly** | Defaults on the call's first line and the re-ring are in (SA:180), as are the identity trigger and the waits (SA:265, 312). `recruiter_secret` has no default, and the identity scene and Tesseract's call have no resume rule, so "close a call" still empties exports (R3-02). Flag 4 can also be read before the name (R3-08). |
| R2-S03 | Yes, one wording fix | The master schedule is in the safe with the visible gap and her query (SA:248, SE:449); `schedule_read` gates the player's line (SA:299). The ticks can't mean "reached" (R3-07). |
| R2-S04 | Yes, two leftovers | The act table sums to its beats (4 + 15 + 31 + 31 + 4 = 85; Acts 1, 2 and 3 check beat by beat). §6's header still says "About 30 minutes" (SA:236), and the note that the Recruiter's call "may run past" its beat at "about 3 minutes" (SA:43) is inside a 5-minute beat. |
| R2-S05 | Yes | SA:268–270. |
| R2-S06 | Yes | SA:60, SE:281. |
| R2-S07 | Yes in voiced lines | "Day ten", "at the briefing" (SA:169, 197, 212; SE:68, 295). SA:22's prose still says the cracker was given "that morning". |
| R2-S08 | Yes | SA:214. Fact holds: TalentStack is m05's front (`m05_phone_agent_0x99.ink:256`). |
| R2-S09 | Yes | SE:289. |
| R2-S10 | Yes, with a gap | Two objects inside the door (SA:146). Nothing says what happens if the player takes neither (R3-11). |
| R2-S11 | Yes | SE swept; S0 fixes listed (SA:523, change 27). |
| R2-S12 | Yes | Changes 18–23. |
| R2-S13 | Yes | SA:197, 212, 357, 394; change 25. |
| R2-S14 | Yes in m09 | "It's HaX. It has been for seven years." (SA:308); the promise after the deck (SA:230). m10's change 21 still says the promise is in her confession (m10 SA:508), and the promise is only made if the player asks (R3-06). |
| R2-S15 | Yes | SA:196, SE:115. |

13 of 15 resolved (R2-S03, R2-S04 and R2-S10 with small leftovers, logged as R3-07, R3-15 and R3-11), 2 partly (R2-S01, R2-S02), carried into R3-01, R3-02 and R3-08.

### Stale copies found by grep

Each is a line a round 1–2 fix changed and an earlier copy kept. The FA and m10 items are not this author's files; they go to the arc-keeper and the m10 author as listed. Logged together as R3-15.

| Where | Stale text | Should read | Owner |
|---|---|---|---|
| FA:171 (row 60), FA:614 (§4.6) | "Twelve. She warned the rest." | "About half of them. She warned the rest." Change 4 prices the double-cross but doesn't list these two lines | arc-keeper, add to change 4 |
| FA:24 (§1.2), m10 SA:18 | the Publication releases the database "to everyone at once" at a set hour | at 06:00 it goes city by city; the key sends it everywhere in the same minute (N-02). No §14 change covers §1.2's first sentence | arc-keeper (new change); m10 author |
| FA:489 (§4.0) | WREN propped the service door "for her own exit with the stolen copy" | his exit (m10 SA:514), or her own way to the key. Change 8 lists row 60 and §4.4, not §4.0 | arc-keeper, add to change 8 |
| m10 SA:514 (change 27) | "differs from m09's change 8 second half ('plays both ends')" | m09's change 8 now withdraws "plays both ends"; the two agree | m10 author |
| m10 SA:508 (change 21) | "**m09:** her confession promises it 'when it's over'" | promised after the deck, Beat 2.7 (R2-S14 asked for this) | m10 author |
| m10 SA:518, SA:544 | `alpha_tapes_saved` | `m09_deck_pulled = alpha_tapes` (m10 SA:478 already uses it) | m10 author |
| FA:469 (§3.4), FA:697 (§5.4) | "Safe opened / Safe shut" for the confession forms | "m06 name found / not found" (N-12). Change 19 fixes the answers, not the labels | arc-keeper, add to change 19 |
| SA:236 | "About 30 minutes" | 31 | this author |
| SA:43 | the call "may run past" at about 3 minutes | drop the call from the list, or say it is about 3 of the beat's 5 | this author |
| SA:22 | "the cracker a raid-team member gave them that morning" | "at the briefing" | this author |
| SA:580 (§15, W-14) | "recorded as `same_in_your_place`" | add "(superseded by N-17: `afterwards`)" | this author |
| SA:339 | "Either way" after three answers | "On every answer" | this author |

## Fresh checks of the round 2 changes

**The locks table, attacked step by step** (SA:464–472).

| Step | Attack | Holds? |
|---|---|---|
| flag 1 → the cage | VM work off the map, flag 2 first | Holds for the cage (the outer door needs flag 1). Flag 2 before the cage plays the ledger early; the call still waits on `cage_opened`. Accepted |
| | Victoria's route | Holds (the maintenance code opens the cage, the outer door still needs flag 1), but see R3-01 on where the code comes from |
| the cage → the call | never open the cage | Can't finish: Nightshade's file is in the cage. Holds |
| the call → the deck choice | close the call (Escape, damage) | Leaks. The office opens "once the call has ended" (SA:240, SA:469, SA:501), which stage 4 can build as "the conversation closed". A player who closes every re-ring reaches the office, the tape room and both flags with the deck never chosen (R3-02) |
| | reload mid-call | Not covered. Nothing says whether an event-fired call re-fires after a reload (R3-02, engine item) |
| the deck → the office | as above | Leaks with the close; and the code's source contradicts Victoria's route (R3-01) |
| the office → the tape room | flags 3–4 submitted elsewhere | Holds only if the reading room's station refuses Tomb Beta's VM. Not stated (R3-09) |
| flag 3 → the scene | no file held | Holds for the scene; but flag 4 can be submitted and read before the name is said (R3-08) |
| | close the identity scene (it is a phone scene) | Leaks: no resume rule, no rule for when `identity_scene_done` is set (R3-02) |
| scene → call → conclusion | close Tesseract's call | Leaks the same way: the conclusion waits on "the call" with no done-flag defined (R3-02) |
| (not in the table) | open the Harwick & Lowe boxes before flag 2 | Torres rings with the sick-parent line before WREN exists (R3-10) |

**The schedule clue.** Works now: every player holds it, the gap is a line with no tick, `schedule_read` gates the player's line. One wording problem: the ticks are "as its series are reached", but she has been in the cage all night and the copy is in her safe, with the cage and the closet still being purged when the player opens it (R3-07). Nightshade's file, his own hand in her cage, is also off the schedule and unremarked; adding it to her query strengthens the clue.

**The priced double-cross.** The price is now said before the choice. Two holes: her threat, "If anything comes off that deck but what I've left you, I'll know", covers refuse-and-pull-her-file too, and that route still rolls up the whole network (R3-03); and refuse-and-pull-the-tapes is strictly worse than take-and-pull-the-tapes, because taking costs nothing that refusing doesn't (R3-04). So not every Recruiter route is a real trade-off yet. Double-cross against refuse-and-file is now a real one.

**06:00 and the key.** Settled in m09 and m10 (m10 SA:416 agrees: the key sends it everywhere, the 06:00 fallback would have gone city by city). The casualty sheet doesn't say which mode its figure prices, and m10's narrator uses it for the key (R3-12). FA §1.2 is stale.

**The confession forms and replies.** The four openings, the shared wall line and the three answers read well and are wired to imports. The recognition line "replaces the opening sentence of her form" (SA:270), which leaves a dangling "it" on the neither form (R3-05). The `afterwards` Reading-aware reply asks HaX's agent to cover for her with the Director listening (worst line 1).

**WREN, one goal.** Consistent across SA and SE: she reports to the Initiative, her tasking is his, her goal is the key. Only FA §4.0 still gives her an exit "with the stolen copy" (stale copies).

**The nine exports.** Checked route by route that each has a value before the conclusion:

| Export | Default | Set on every route? |
|---|---|---|
| `nightshade_shown_file` | `false` | yes (bool) |
| `sleeper_named` | `false` | yes (bool, set only when she says the name) |
| `recruiter_offer` | `refused`, first line of the call | yes, once the call opens (and the call is forced) |
| `albion_notified` | `false` | yes (bool) |
| `hax_confession_answer` | none | only if `identity_scene_done` is set on the answer, not on the scene's start; not stated (R3-02) |
| `recruiter_secret` | none | **no**: on sold-and-lied, a call closed before own-it-or-hang-up resumes "at the offer" (SA:180) and can skip the choice; `""` then reads in m10 as "never sold the list" (R3-02) |
| `reading_finished` | `false` | yes (bool) |
| `sleeper_shortlist` | `false` | yes (bool) |
| `deck_pulled` | `none`, first line of the call | yes |

**The budget.** 85 holds as the sum of the beats, with 28 minutes of VM at the assumed 7 each and 7 optional minutes in Act 2 (the cross-reference and Tran). Two wording leftovers (stale copies).

## New findings

Counts: **0 blockers, 4 majors, 11 minors.**

| ID | Sev | Location | Evidence | Problem | Fix |
|---|---|---|---|---|---|
| R3-01 | major | SA:146 (Beat 2.1), SA:240 (Beat 3.1), SA:469, SA:508; FA row 32 | Beat 2.1: on `m03_victoria_fate == "recruited"`, "Victoria's protocols read the archive's internal mail, and Sorensen's mail holds the cage's maintenance code": the route's whole value. Beat 3.1, every player: "the office door opens on a code HaX reads out of Sorensen's mail once the Recruiter's call has ended". | A round 2 fix broke a Tier 1 route. If HaX can read Sorensen's mail on every route, the recruited route buys nothing, and a default player could ask why she didn't read the cage code out of the same mail. On the recruited route it is worse: HaX is already in the mail before the cage, so holding the office code until the call ends is visibly artificial. | Take the office code out of the mail and tie it to the deck event itself. Suggested: the wipe is fired from the deck's controller in Sorensen's office; when the Recruiter fires it (every branch, including the hang-up), HaX follows the connection back. "She fired it from Peg's office. I'm on the door." The lock then opens on `deck_choice_made` for a reason the player hears, and the mail stays Victoria's. |
| R3-02 | major | SA:180, 240, 265, 312, 469–472, 501; §8 #5; FA §3.4 | Closing a phone conversation is possible mid-knot (Escape, damage; R2 engine item 3). The office opens "once the call has ended" (SA:240) or "when the call ends" (SA:469); stage 4's trigger list says "the office code on the call's end" (SA:501). The resume is "at the offer" (SA:180). The identity scene is a phone scene; Tesseract's call is a phone call; neither has a resume rule, and nothing says when `identity_scene_done` or "the call" is set. `recruiter_secret` has no default (§8 #5). | Three leaks of the class R2-S02 closed for `recruiter_offer` only. (1) If "ended" is built as "closed", a player who closes every re-ring reaches the office, the tape room and the conclusion with the deck never chosen (exports fall to the defaults; the "forced" choice isn't). (2) On sold-and-lied, a resume at the offer can skip own-it-or-hang-up, so `recruiter_secret` exports `""`, which m10 reads as "never sold the list" (m10 SA:327 then gives the wrong leverage line). (3) Closing the identity scene before the answer leaves `hax_confession_answer` empty unless `identity_scene_done` is set only on the answer; closing Tesseract's call can strand or skip the conclusion depending on when "done" is set. Reload mid-call is not covered at all. | One rule for every forced phone scene, stated in §11: its done-flag is set on its last choice, not its first line; a scene closed before that re-rings on leaving the room and resumes at its last unanswered choice. Key the office to `deck_choice_made`, never to the call closing. Set `recruiter_secret` on the call's first line by branch (`kept` on sold-and-lied, `confessed` on sold-and-confessed), overwritten by "own it". Set `identity_scene_done` on the confession answer. Add "reload mid-call: does an event-fired call re-fire?" to the engine list. |
| R3-03 | major | SA:195, SA:197, SA:206; SE:66, SE:70 | The Recruiter, to every player, before the answer: "If anything comes off that deck but what I've left you, I'll know before your plane does. About half of them will be gone by morning." Route table: refuse + pull her file gets "her whole network". | Her threat covers refusing too. A player who refuses and pulls her file has taken exactly what she said she would see, yet the whole network is rolled up. A player who thinks about it either distrusts the table or concludes she was bluffing, and then the double-cross's price is a bluff as well. | Give the difference a reason the player hears. Suggested: on take she leaves the Alpha tapes running for the player and watches the deck to see the deal kept; on refuse she wipes her own file first, burns the line and goes to ground, sure it's gone. HaX, pulling it on the refuse route: "She thinks it's gone. Let her." Her threat's wording then narrows to the deal: "Take my name, and if anything else comes off that deck I'll know before your plane does." |
| R3-04 | major | SA:200–208; SA:332; FA §3.4 `recruiter_offer` | Take + tapes: certainty and his teaching; loses her network. Refuse + tapes: his teaching; loses her network and certainty. Both wipe her file and leave her at large; the debrief and m10 treat `taken` and `refused` alike except for the name. | Refuse-and-pull-the-tapes is strictly worse than take-and-pull-the-tapes: taking costs the player nothing that refusing doesn't. The table's claim that "each route gets one thing and loses one" fails for this pair. (Refuse-and-pull-nothing is honestly labelled a principle; this one isn't labelled at all.) | Price taking. The cheapest true cost: buying from her puts a second receipt in the Initiative's books, and m10's Tesseract reads those books (m10 SA:327). On `taken` or `double_crossed`, one m10 ledger line ("You bought WREN from my Recruiter. You understand costing.") and the debrief's `taken` line says it too ("You bought a name, and it was the right name. She'll sell the receipt."). Then the take column loses something and refusing buys a clean record. Add "a receipt in her books" to the table's Loses column for both take routes. |
| R3-05 | minor | SA:270; SE:323, SE:325 | The recognition line "replaces the opening sentence of her form". The neither form is "There was a file on a crypto fund, with his name in it at eighty-seven per cent. I put it in a drawer. He trained me. I wanted the other thirteen." | With `m07_architect_echo_heard` (or `m03_directive_decoded`) on the neither form, the line becomes "You heard him say it in Portland. My line. His line. I put it in a drawer." The "it" now has no file. Plausible branch: m07 played and the echo heard, m06's safe left shut, the teacher topic never asked. The not-found-teacher-discussed form loses its setup the same way ("…His line. I didn't say who."). | Put the recognition line before the form's first sentence, not in place of it. |
| R3-06 | minor | SA:230, SA:339, SA:390; SE:313; m10 SA:381, 508 | "When the player asks more, she promises the rest 'when this is over'." The debrief says the rest "is still owed"; the hook carries it; m10 pays it "on every ending that reaches 06:00 except the cold one". | A player who doesn't ask is never promised anything, and m10 still pays the promise. | Make it unasked and short, as the last line of Beat 2.7: "The rest when this is over." It doesn't break W-03's three-words-and-a-sentence: it is a promise, not an explanation. |
| R3-07 | minor | SA:248, SE:449 | "Sorensen has pencilled each room ... and ticked it as its series are reached": dock to office all ticked, on the master copy locked in her safe, while she has been in the cage all night and the cage and the closet are still being purged. | The ticks can't mean "reached": she hasn't been to the safe, and two of the ticked rooms are still running. A careful reader spots it at the one clue the night is built on. Also, Nightshade's file is his own hand in her cage and is off the schedule too, but her query names only the Reading. | Make the ticks her planning pass: each room's series checked against the order before the night, a tick for "covered"; the tape room has no series and no tick. Widen her query: "Reading (safe); plan chest: not listed. Keep?" That puts two of his own things on the page and makes "He shredded everyone but himself" land harder. |
| R3-08 | minor | SA:265, SA:290–302, SA:472 | The identity scene holds without Nightshade's file, but only Tesseract's call and the conclusion wait on `identity_scene_done`. | A player who opened the cage but never the plan chest can submit flag 4 and hear the hour, the key, the casualty sheet and "Then why build a key at all?" before the name is said; the identity scene then plays wherever they pick up the file, not by the server. | Hold flag 4's read on `identity_scene_done` too ("His file first. Then the rest of his box."), or put part of the tape-room code in the plan chest so the file always comes first. |
| R3-09 | minor | SA:263, SA:470; FA §6.1 (two machines) | Flags 3–4 are submitted "in the tape room ... through the field kit's link to the drop terminal"; the drop terminal in the reading room takes flags 1–2. | The office → tape room lock holds only if the reading room's station refuses Tomb Beta's VM. "Through the drop terminal" invites stage 5 to give the reading-room terminal both. | Say in §11: the tape room's station is the only one that accepts Tomb Beta's VM; the reading room's accepts only the catalogue server's. |
| R3-10 | minor | SA:216, SA:501; §13 stage 5 ("findable without the file number") | Torres rings "as the player opens the boxes". | The boxes are findable before flag 2. Torres would then say "Look for the ones with a sick parent" before WREN exists. | Gate his call on flag 2 as well (at the boxes after flag 2, else on the walk to the office). |
| R3-11 | minor | SA:146 | On Victoria's route "HaX names them as the door opens, the player takes one, and Sorensen tips the other". | No default if the player takes neither and walks in; `cage_bin_saved` and the "other bin is gone" rule are undefined there. | As the hatch rule: when the player moves past the bins, Sorensen tips the far one, and Derek's (nearer the door) survives. |
| R3-12 | minor | SE:419, SE:425; m10 SE:207 | The sheet prices "deaths attributable to the Publication"; the config line describes two modes. m10's narrator gives the same figure for the key. | The player can't tell which release the number prices, and "Then why build a key at all?" loses force if the worse mode isn't the costed one. | One line on the sheet: "Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later." Then HaX's question points at a choice he made on paper. |
| R3-13 | minor | SA:331–332 | WREN topic on `double_crossed`: "About half of her network. She warned the rest." Recruiter topic on `double_crossed`: "about half of it, 'and she knows it was you'". | The same fact twice, one topic after the other (npc-dialog-review §2i). | Keep the network line in the Recruiter topic only. |
| R3-14 | minor | SA:268; §14 change 7 | Netherton takes the identity scene "on the line from the aircraft taking Task Force Null to Montana". | WREN is aboard. Netherton saying the name and listening to HaX's confession in her hearing sits badly beside "she sees nothing in my face". | One stage note: he takes it in the aircraft's forward cabin, door shut. No new line. |
| R3-15 | minor | see "Stale copies found by grep" | Twelve stale lines across FA, m10 and SA. | Stage 3, stage 7 and the arc-keeper will copy them. | Sweep as tabled; the FA lines become additions to changes 4, 8 and 19 and one new change (§1.2). |

## Worst lines, with rewrites

Most of the round 2 writing is at the shipped standard. "Her mother's care home has had my cheque every month for eleven years." "He reads the first name off the card. He doesn't look down for the second." "Oh-six-hundred, day thirteen. Twenty hours. He has given us every one of them." Those are the best new lines. The five weakest:

| # | Line (location) | What's wrong | Rewrite |
|---|---|---|---|
| 1 | Agent HaX: He says I'll cover for you. Then cover for me till it's over. (SE:343, `afterwards` + told the Reading) | Netherton is on the line. Asking her agent to cover for her in front of the Director makes no sense, and "till it's over" repeats the promise's wording. | Agent HaX: He says I'll cover for you. We'll find out afterwards which of us needed it. |
| 2 | The Recruiter: If anything comes off that deck but what I've left you, I'll know before your plane does. About half of them will be gone by morning. (SE:66) | "Them" has no antecedent: HaX names the handler list only in the next step. And as worded the threat covers refusing too (R3-03). | The Recruiter: Take my name, and if anything else comes off that deck, I'll know before your plane does. Half my people will have moved by morning. |
| 3 | Agent HaX: Her file's her whole network, if she doesn't see it coming. The Alpha tapes are his voice, on tape. Teaching. He teaches what he'll do. If he built the bunker the way he taught it, it's on that tape. (SE:301) | "On tape" and "on that tape" in three sentences; "if she doesn't see it coming" now contradicts the Recruiter's "I'll know". It's the longest HaX line before her confession. | Agent HaX: Her file is her network, all of it. The Alpha tapes are him teaching, recorded. He teaches what he'll do. If he built the bunker the way he taught it, it's on there. |
| 4 | Agent HaX: Yes. I should have. So, everything from now on. Starting with what's on his box. (SE:331) | "So, everything from now on" is a written construction, and it is the reply at her most exposed moment. | Agent HaX: Yes. I should have. You get all of it from now on. His box first. |
| 5 | Agent HaX: The rest of it when this is over. Right. Her office is past the binders. (SE:313) | "Right." is filler, and the line only plays if the player asks (R3-06). | Agent HaX: The rest when this is over. Her office is past the binders. *(said unasked)* |

## The 27 proposed FINALE_ARC changes

None rejected. Five need a word changed or a line added, and two new changes are needed.

| # | Note |
|---|---|
| 2 | Keep; change "ticked as its series are reached" to her planning pass, and add the plan chest to her query (R3-07). |
| 4 | Keep; add the `recruiter_secret` first-line default, the office keyed to `deck_choice_made`, and the sweep of row 60 and §4.6's "Twelve" (R3-02, R3-15). With R3-03, row 60's double-cross needs her reason for not seeing a refusal. |
| 7 | Keep; Netherton takes the call in a closed cabin (R3-14). |
| 8 | Keep; add §4.0's "for her own exit with the stolen copy" to the sweep. |
| 12 | Keep; say the tape room's station alone accepts Tomb Beta's VM (R3-09). |
| 15 | Keep; the promise is said unasked (R3-06), since m10 pays it to every played-m09 player. |
| 19 | Keep; also relabel §3.4's and §5.4's "Safe opened / Safe shut" by import. |
| 1, 3, 5, 6, 9–11, 13, 14, 16–18, 20–27 | Accept as written. Change 6's "`sleeper_named` comes only from the Recruiter" is the right call: it is what makes the deal a real temptation. |
| new 28 | §1.2's first sentence: the Publication goes city by city from 06:00; the key sends it everywhere in the same minute and needs a hand (N-02). m10's premise line follows. |
| new 29 | Row 32: Victoria's protocols are the only way into Sorensen's mail; the office code comes from the deck's controller when the wipe fires (R3-01). |

## Verdict

**Not clean: 0 blockers, 4 majors, 11 minors.** Of round 2's 32 findings, 29 are resolved (some with small leftovers) and 3 partly (N-01, R2-S01, R2-S02). None reopened as written.

The round 2 fixes hold where they were aimed: 06:00 and the key now make sense, the schedule clue is in every player's hands, the confession is the best scene in the mission, and WREN has one goal. What's left is narrow:

1. **R3-01.** The office code's source, HaX reading Sorensen's mail, undoes Victoria's route. Tie it to the deck's controller.
2. **R3-02.** "Close a call" still empties exports and skips the deck choice. One done-flag rule for every forced phone scene, the office keyed to `deck_choice_made`, a first-line default for `recruiter_secret`.
3. **R3-03 and R3-04.** The Recruiter's routes: her "I'll know" threat has to stop covering a refusal, and taking her deal has to cost something refusing doesn't.

Each fix is a sentence or two in SA and a line in SE. The minors can go in with them or with stage 3. After that, a light round 4 to confirm should be enough.
