# m10 Full Disclosure: alignment review, round 4 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only and static (no browser). I ran the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R3 and CONTRACT §11 (alignment rounds 1 to 3). The tree is HEAD 2c325e16; m10's only uncommitted change is `dungeon_graph.md`. I read the two round-3 fix commits as diffs (1421c9d2 ink, 2c325e16 JSON), then the closing inks in full (`six_oclock`, `hearing`, `citadel`), `season_line()` and `close_compute()`, Tesseract's ledger sting, database and Join knots, the card, every credits section and the merge. No VM material was opened.

- **Ink compile:** every `.json` is newer than its `.ink`.
- **Validator** (`--skip-ink --no-graph`): no errors. The same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and the 4 behaviourless placeholder NPCs as R3.
- **dialoguelint:** 0 errors. Same counts as R2 and R3 (blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1), all phase 4's.
- **The deleted texts:** I grepped the mission, `tools/` and `scripts/` for the eleven cut strings and every global their mappings read (`ghost_answer`, `ghost_sale`, `head_start_killed`, `m09_recruiter_offer`, `ending`, `six_done`, `six_open`, `citadel_open`). Nothing executable depended on the mappings. Every global is still read elsewhere (`phone_beat`, the music, the hearing's trigger, `raid_clock`). What's left behind is one orphaned phone contact and a set of stale comments (R4-m7, R4-m8).
- **Engine read:** `phone-chat-ui.js:385-420`. Every id in the phone's `npcIds` is listed as a contact from load, history or not.
- **Save-by-save trace:** a cold start, a full season and six mixed saves, each through the six endings (below).

## Counts and verdict

**0 blockers, 0 majors, 9 minors** (open).

R3-M1, the major, is closed: the St. Catherine's line now matches the card on all three database outcomes. Of R3's ten minors, eight are closed cleanly. R3-m2 is only partly closed: the Vector and Phantom recalls, and the Join section, still hide what the player did to them (R4-m1, R4-m2). R3-m3 is closed in the ERB but leaves stale comments and an orphaned contact (R4-m7, R4-m8). Two fixes introduced small new problems: R3-m9's road line sits before a "(Listen.)" button the player can't press from a road (R4-m6), and R3-M1's scorched form adds a fourth "map" in a minute next to a line that is wrong when the head start went out (R4-m5).

Judging the whole close afresh, I found three older problems that earlier rounds missed:
- the scorched path puts two player buttons back to back, with no reply in between (R4-m4);
- a knocked-out, never-accused Kowalczyk is credited "Badge cancelled at six". Nobody ever finds her out, and HaX has just said she doesn't know (R4-m3);
- m06 is the only earlier operation with no row in the credits, and on many saves it has no beat at the close at all (R4-m9).

**Verdict: another round needed (phase not complete; 0 majors, 9 minors).** Every fix is mission-local and small: four credits clauses (changed in both copies), one ELSEWHERE group, one reordered knot, two line splits, one button, one contact removed and a comment sweep. None of it needs the user. The ending now does what the user asked on every save I traced. Earlier choices change who stands at 06:00, what Netherton adds up, what Tesseract throws back and who appears in the credits, and nothing false is said about the database choice any more.

## R3 findings: closed or not

| R3 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| M1 St. Catherine's season line | closed | six_oclock.ink:642-648, three fixed forms by `database_outcome`. Secured: "…They still aren't. That was my signature too.", which agrees with HaX at tesseract.ink:1002 and the card (erb:510). Scorched: "…They were on the map we just burned.", which agrees with tesseract.ink:1023 and erb:512-513. Disclosed keeps "They will be now.". `database_outcome` is set before `season` on every path that reaches it (`the_rest` after `database_beat`; `scorched_close`). The other ten keys don't depend on it | **R4-m5** (minor): on scorched, "map" now comes four times in about a minute, and the line two after it ("not the buyers") is wrong when the head start went out |
| m1 Noor's row printed twice | closed | erb:781 adds `m05_found_pipeline_list === true`. I enumerated m05 unplayed, list kept with no deal, list kept with the deal, and the deal without the envelope, each with Noor told, knocked out or neither: exactly one Noor row each time | none |
| m2 the merge hid teammate knock-outs | **partly** | credits_sections.json:50-54, 95-99, 113-117 and the ERB copy erb:865-869, 910-914, 928-932: the three knock-out clauses come first, styled warning, in both copies (the drift check at erb:1060-1066 passes, because the ERB rendered) | **R4-m1**: Vector's and Phantom's recalls still fall to the presence catch-alls. **R4-m2**: `safetynet_join` was not touched, so on Join the two catch-alls still hide a knock-out, and Quintero's Join clause still drops "by her own agent" |
| m3 dead T-47 to T-56 | closed in the ERB | erb:2181-2182, 2241-2243, 1703: the mappings are gone. Nothing executable depended on them (grep above) | **R4-m7**: `recruiter_phone` now has no purpose but is still a named contact on every save. **R4-m8**: comments in four inks, BARKS_AND_TEXTS §6 and CONTRACT §1-§4 still describe the texts as live JSON |
| m4 Join's T-57 toast | closed | erb:1703, mapping deleted; citadel.ink:24 carries "0x00." | none (CONTRACT §11's R3-m4 line and the texts row agree) |
| m5 "lights twice" on a double-cross | closed | six_oclock.ink:594-598 | none. On executed, `phone_beat` never ran, so "left unread" is true on both forms |
| m6 scorched missed the Reading | closed | hearing.ink:52-55, the same string as six_oclock.ink:507-509; after the player's button, before "The night he left…" | none. On scorched, 06:00 never reaches `the_rest`, so the line can't play twice |
| m7 funded-arrest sting | closed | tesseract.ink:557-559, ahead of the unfunded arm. It agrees with the credit "His wife's treatment goes on." (erb:768) and the card's `elena` line | none. `elena_treatment_funded` is set only on m05's arrest and turn paths, and the turn arm comes first, so the funded-arrest arm is the only new case |
| m8 "every one" lost its noun | closed | erb:573 "Still answering for every operation." | none |
| m9 the Citadel's narrator in two places | closed for the phone line | citadel.ink:24 "Somewhere on a road out of Montana…" | **R4-m6**: the scene's only button, "(Listen.)" (citadel.ink:35), now belongs to a player who is on a road and can't hear the Citadel. The header comment (citadel.ink:4-6) still says her message "is a text (JSON)" |
| m10 stale ERB comments | closed | erb:556-557, 1091-1094; CONTRACT.md:1047 carries the correction | none |

## Severity table (new and open findings)

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R4-m1 | **A Vector or Phantom the player sent back and then recalled is credited as if nothing happened.** R2-m14 deleted "Sent back, then recalled." and "Sent back, then recalled. Added it to his list.", and R3-m2 restored only the knock-outs. Recalling clears `officer_out` (phone_agent0x99.ink:426-427, 433-434), so neither the "apology" nor the "complaint" clause holds. The presence catch-all then prints "Cryptographer, the crypto annex." or "Auditor. The kit sign-outs balance now.". Quintero, Arakawa and Malhotra all keep a recall line, so the five officers the whodunit can wrong are treated unevenly | credits_sections.json:93-127; erb:908-942 | In both copies, add a clause ahead of each catch-all:<br>• Vector, `vector_on_team && vector_recalled`: "Cryptographer. Sent back, then recalled. Still waiting for an apology.";<br>• Phantom, `phantom_on_team && phantom_recalled`: "Auditor. Sent back, then recalled. It's on his list.".<br>The rule from R3 holds: a clause conditioned only on presence comes after every clause for something the player did |
| R4-m2 | **On Join, the same catch-alls hide a knock-out, and Quintero's knock-out loses who did it.** `safetynet_join` is a separate section, so R3-m2 didn't reach it. Vector "Cryptographer. Tracing the release." and Phantom "Auditor. Auditing 0x00's sign-outs." are conditioned only on `*_on_team` and come before the merged IN THIS OPERATION clauses, so a knock-out never shows. Quintero's Join clause is still the old "Raid lead. On her feet by Friday, and asking questions." (not styled warning). On Join, Arakawa's knock-out does show (his Join entry has no conditionals) | credits_sections.json:179-226; erb:994-1041 | In `safetynet_join`, both copies: Quintero's `quintero_ko` clause becomes "Raid lead. Put on the floor by her own agent. On her feet by Friday, and asking questions." (warning). Add first clauses for Vector (`vector_on_team && vector_ko`) and Phantom (`phantom_on_team && phantom_ko`), the same strings as the `safetynet` section's. Optionally add the R4-m1 recall clauses too, for the same reason |
| R4-m3 | **A knocked-out Kowalczyk who was never accused is credited "Badge cancelled at six."** If she's knocked out before the core, `wren_beat` can't run (tesseract.ink:60, 822). Unless the player then accuses her (`sleeper_caught`, an earlier clause), nobody in the game ever learns she was the sleeper. HaX says as much at 06:00: "Kowalczyk's awake in the second van. She hasn't asked who put her there." (six_oclock.ink:495-496). Since R2-m14's order, her SAFETYNET clause "…Woke in the second van. Badge cancelled at six." prints ahead of the IN THIS OPERATION clause "Knocked out below ground. Never accused." (erb:612). That drops the whodunit's sting and contradicts the scene. The unaccused default, "Badge still active.", shows the intent | credits_sections.json:146-149; erb:961-964 | In both copies: "Breaching lead, Task Force Null. Eleven years in SAFETYNET. Woke in the second van. Never accused. Badge still active." (warning) |
| R4-m4 | **On scorched, the player's "And the database?" is answered by another player button.** `numbers` ends `+ [And the database?] + [(Nod.)]` → `database_beat` → `both_wiped` → `scorched_close`, whose first step is `-> season ->`, which opens with `+ [Sir?] + [(Wait.)]` (R2-m12). On every scorched save with a season key or an m09 memo stance (most non-cold saves), two menus follow each other with no line between them, and the question is never answered. On a cold scorched save the reply is the suspension, which doesn't answer it either | six_oclock.ink:321-324, 398-399, 557-559, 632-634 | Open `scorched_close` with Netherton's answer, before `-> season ->`. The existing "Nobody holds the map now…" line fits (move it up, in R4-m5's two forms). Then the season line, the suspension, `#set_global:six_done:true` and "I wanted to do the same. That is why you are suspended and I am not." as the last line. That keeps the hearing's trigger on `six_done` one line before the end, as now |
| R4-m5 | **Scorched: "not the buyers" is wrong when the head start went out, and "map" comes four times.** On scorched, Netherton's numbers have just said "Zero Day got its two hours." or "The resale went out at four." (six_oclock.ink:340-345). The card then reads "The cells kept what they took at four." (erb:513). Between them, "Nobody holds the map now. Not him, not the buyers, not whoever sits in my chair next." is said on every scorched save. In about a minute the player hears "the map we just burned" (R3-M1's new form), "Nobody holds the map now", "But the map's gone." (hearing.ink:23) and reads "Nobody holds the map." on the card | six_oclock.ink:565, 645-646; hearing.ink:23 | Two fixed forms by `head_start_out`:<br>• `none`: as now;<br>• otherwise: "Nobody holds the whole map now. Not him, and not whoever sits in my chair next."<br>With R4-m4's reorder, Netherton says it just before the St. Catherine's line, so that form can be shorter: "Forty hospitals patched after St. Catherine's. The pumps on his list were not among them. They were on it too." |
| R4-m6 | **The Citadel's only button is "(Listen.)", but the player is now on a road out of Montana.** R3-m9 placed the phone line with the player, which is right. But the button that follows Netherton's lines reads as being in the room. It is the only thing the player does in the scene, and what they choose to do at that moment is the Join ending's last beat. The header comment also still says her message "is a text (JSON)" | citadel.ink:35; citadel.ink:4-6 | Button: "[(Keep driving.)]". That cuts back to the player once, between the betrayal line and the casualty curve. Header: "Her last message is narrated on the player's road (T-57 cut, R3-m4)." |
| R4-m7 | **`recruiter_phone` is now an empty contact named "The Recruiter" on every save, from the first minute.** Its only mapping (T-55) is deleted, but it is still in the phone's `npcIds`, and the engine lists every allowed id whether or not it has history (phone-chat-ui.js:400-410). So a cold-start player, or one who refused her in m09, sees "The Recruiter" in their contacts all night. Opening it gives only "(Put the phone away.)". It also contradicts `phone_beat`, which introduces her text as "A second number, American." | erb:1228-1231, 1239, 2232-2243; ink/m10_recruiter_phone.ink | Remove `recruiter_phone` from `npcIds` and delete its NPC record. Then delete or archive `m10_recruiter_phone.ink/.json`, and fix the START KIT comment (erb:1228-1231). `phone_beat` carries her line |
| R4-m8 | **Comments and design docs still describe the 06:00 texts as live JSON.** Ink: six_oclock.ink:80-82 ("inert since R2-m10 (skipped on six_open…)") and :592 ("T-56 is inert…"). The mappings are deleted, not inert. Also ghost_phone.ink:44 ("comes back as Ghost's 06:00 text (JSON)"), citadel.ink:4-6 (R4-m6) and recruiter_phone.ink:5-6. Texts file: BARKS_AND_TEXTS.md:103 still says "inert by design, or delete them" and "T-57 can still toast on Join"; :105 still describes the `six_done` trigger. CONTRACT §1-§4 (lines 127, 139, 143, 414, 587, 669) still specify those beats as JSON texts; §11 supersedes them, but nothing at those lines points there | as listed | One sweep: "Cut (alignment R3-m3/m4): the closing scene carries it." in each comment. Rewrite BARKS_AND_TEXTS.md:103 and :105 as one sentence saying the rows are cut. Add "(superseded: §11 alignment R3-m3/m4)" at each CONTRACT line |
| R4-m9 | **m06 is the only earlier operation with no credits row, and on many saves it has no beat at the close.** Every other mission has its own row: m01 Lawson; m02 Ghost, Gary, Reeves; m03 Victoria; m04 Albion, Voltage, Static, Vance; m05 Torres and the forty-seven; m07 the cells; m08 Nightshade, Vector, Phantom; m09 Noor, Sorensen, the Recruiter. m06's choice (freeze the $12.8M, or leave the fund running and tag the wallets) reaches the close only through:<br>• Netherton's `numbers_more` line (frozen, and never on executed, six_oclock.ink:370);<br>• the HashChain line in `dark_ops` or `secured_cell`, which is fourth in priority and crowded out on a save with Sterling recruited and Nightshade unshown (six_oclock.ink:428-442; carryover_vars.ink:383-392).<br>So a "watched" player on that save, or a "frozen" player on executed, hears nothing of m06 after the core. `season_line()` has no m06 key either | erb:745-786 (`elsewhere_one`), 791-804 (`elsewhere_two`); six_oclock.ink:370, 440 | Add one ELSEWHERE row group by m06's value (fixed strings, `===`/`&&` only), in `elsewhere_two`, which Join leaves out. For example:<br>• `m06_assets_seized && database_outcome !== 'secured'`: "The twelve point eight million: back in the victims' fund.";<br>• `m06_assets_seized && database_outcome === 'secured'`: "The twelve point eight million: held as evidence, with his copy.";<br>• `m06_monitoring_enabled && database_outcome === 'disclosed'`: "The HashChain wallets: tagged since the fund. The tags dropped at five past." (warning);<br>• `m06_monitoring_enabled && database_outcome !== 'disclosed'`: "The HashChain wallets: still tagged. Still watched."<br>Guard every row with `m06_completed === true`. A save where m06 deferred the decision gets no row; record that in CONTRACT §11 |

No blockers or majors.

## The six endings on rich, cold and mixed saves

Static traces through the ink, the card and the credit conditions, on the current tree.

### Save by save

| Save | At the core | At 06:00 / hearing / Citadel | Card and credits | Lands? |
|---|---|---|---|---|
| **Cold start** | Netherton introduces himself; `rec_cold`; no stings | Walkabout (Quintero, Wendell, Imran, Kowalczyk if caught); Ghost's last word in `phone_beat`; no `[Sir?]` beat (`season` returns first). Scorched: "[And the database?]" answered by the suspension (R4-m4) | 0x00's ending clause; "In Billings…"; "The Recruiter" sat in the contacts all night (R4-m7) | **Yes**, apart from the empty contact |
| **Full season** (m01–m09; m02 hospital exposed; m04 full; m05 list kept, arrest, funded; m06 frozen; m07 Trojan Horse; m09 told, `yes_albion`, notice before the debrief, Reading shown) | Albion record and memo challenge; Derek record; bed four or the funded-arrest sting ("…Cheaper than paying them before."); "before anyone asked you to" | Gary, Voltage, Quintero/Kowalczyk. Season: St. Catherine's in the form that matches the database, then the memo line. HaX: the Reading line, then "the rest" | 0x00: ending, "Told their handler…", "Ten operations…"; Lawson; "David Torres: serving. His wife's treatment goes on."; Noor "warned in October" | **Yes on all five non-Join endings.** Scorched: two buttons back to back (R4-m4), "not the buyers" if anything went at four (R4-m5) |
| **Full season, but m06 watched, Sterling recruited and confronted, Nightshade unshown** | as above | `dark_ops` / `secured_cell` name Sterling and Nightshade; the HashChain line never plays | No m06 row anywhere (R4-m9) | **Partly**: m06 is the one operation that doesn't land |
| **m05 deal without the envelope + m09, Noor met and not told** | m05 sting by fate | memo line | One "never told" row (R3-m1 fixed) | **Yes** |
| **m08 + m09, Vector on the team, sent back then recalled** | — | Vector's walkabout line doesn't play (he was recalled) | "Cryptographer, the crypto annex." (R4-m1) | **No, in the credits**: the wrong accusation is the player's, and it's gone |
| **m08 + m09, Vector on the team and knocked out; Join** | Join's three steps | Citadel: "(Listen.)" on a road (R4-m6) | "Cryptographer. Tracing the release." (R4-m2) | **Partly** |
| **m09 + Kowalczyk knocked out before the core, never accused** | no `wren_beat` | HaX: "She hasn't asked who put her there." | "…Woke in the second van. Badge cancelled at six." (R4-m3) | **No, in the credits**: it contradicts the scene and spoils the unaccused irony |
| **m08 + m09 double-cross, executed** | double-cross opening | van: "lights three times. Two numbers with no name…" | Kowalczyk's double-cross row | **Yes** (R3-m5 fixed) |

### Ending by ending

| Ending | Last in-scene beat | Season line | Ghost / Recruiter | 0x00 credit | Open |
|---|---|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | after the van, by database | `phone_beat` | "Brought him out alive, in front of a court." | R4-m1, R4-m3, R4-m9 (save-dependent) |
| Surrender | "He asked who taught you. I said I did." | as arrest | `phone_beat` | "Took his surrender. Kept his protocol." | as arrest |
| Lethal | "There'll be a board. I'll be sitting next to you." | after the database beat | `phone_beat` | "Fired when his hand was on the key." | as arrest |
| Executed | HaX's text read in the van | none (by design) | unread, counted correctly | "Fired when his hands were empty." | R4-m9 (the $12.8M is suppressed here) |
| Scorched | The hearing: HaX on whether she was asked | in `scorched_close`, both_wiped form | `phone_beat` | "Wiped both copies. Suspended." | **R4-m4, R4-m5** |
| Join | Netherton: "Find 0x00…" | none (by design) | none (by design) | "Pressed the key." | R4-m2, R4-m6 |

Every ending puts the player first in their own credits and plays its last beat inside a scene. Every one except executed and Join (both by design) lets them hear their season added up once, from their own side, and now in words that agree with the card.

## Rubric (ten rows)

| # | Dimension | R3 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | minor | none | none (R3-m7 closed) |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | minor | minor | R4-m4 (back-to-back buttons), R4-m6 |
| 5 | Moral choices and consequences | major | minor | R4-m1, R4-m2, R4-m3, R4-m5, R4-m9 |
| 6 | Music | none | none | none (no cue touched T-47 to T-57) |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | none | none in-mission; the credits side of knock-outs is R4-m2 and R4-m3 |
| 10 | Bookends | minor | minor | R4-m7, R4-m8 |

## Withdrawn, not raised, and browser checks

- **Withdrawn after checking:**
  - I suspected "the map we just burned" put the wipe on Netherton, two lines before he suspends the player for it. He says "We both answer for it." when he offers the choice (tesseract.ink:1023), so the "we" is his own and it reads.
  - I suspected the Reading line could play twice on scorched. It can't: 06:00's `the_rest` isn't reached on `both_wiped`.
  - I suspected a recalled Quintero, Arakawa or Malhotra fell to a catch-all as well. They don't: their recall clauses come ahead of their SAFETYNET defaults, and recalling clears `officer_out`.
- **Not raised:**
  - **HaX's "0x00." and "I'll be at the board" aren't in her phone thread if the player opens the phone after the credits.** The scenes narrate both. Browsing the phone after the roll is outside the story's frame.
  - **Every other optional phone contact** (Victoria, Vance, Elena) is also listed from load on every save. That is the engine's general pattern, and those contacts can still ring. Only `recruiter_phone` has lost its purpose (R4-m7).
  - **Ghost's "A number with no name"** while the phone lists a contact called Ghost: that contact is the security office's duty handset, so the fiction holds.
  - **The phase-4 dialoguelint backlog** stays with the dialogue phase.
- **Browser checks for the fixer:**
  - a scorched save with m02 exposed: the order after R4-m4, and that the hearing still opens on `six_done`;
  - Join: the Citadel's button text;
  - a save with Vector on the team, sent back and recalled, then knocked out on a second save: read his credit on a non-Join ending and on Join;
  - a save with Kowalczyk knocked out before the core and never accused: read her credit;
  - a cold start: the phone's contact list no longer shows "The Recruiter".
