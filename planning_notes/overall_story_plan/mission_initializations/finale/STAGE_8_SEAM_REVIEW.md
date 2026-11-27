# Stage 8: m09 → m10 seam, voices and threads review

Read-only review. Does not repeat the two findings already in `STAGE_8_CROSS_REVIEW.md` (HaX's Join credit; Netherton at the Citadel in `m10_citadel.ink`).

## Verdict

**PASS WITH FIXES.** No blockers. Three majors and twelve minors, none of which breaks a route. The 11 exports match by name, value and default, and m10 handles every value plus the cold start (this confirms `STAGE_8_SEAM_A.md`). The majors: m10's "Helena's plans" ignores the defence list m09's flag 4 already gave the player; the Tomb Alpha record answer assumes an optional m09 read that isn't exported (a correction to SEAM_A m1); and Kowalczyk's m10 credits put her on Task Force Null for eleven years, when the task force dates from this year. Voices hold across the two missions, apart from Netherton's contractions on a few weighted lines. Every thread in FINALE_ARC §2 is closed, or deliberately left (the Recruiter, Zero Day, Ghost and the m07 leaders at large), except Terry Mott's £500, which is still unwritten. Several m09 payoffs in m10 exist only as stage 9 JSON specs.

## Seam table (m09's 11 exports)

Names, types and defaults match across m09 CONTRACT §5.1, m10 CONTRACT §2.3 (L337) and `m10_carryover_vars.ink`, as `STAGE_8_SEAM_A.md` found; confirmed. Every value m09 can write is one m10 tests for, or falls to a default on purpose. File names below drop the `scenarios/m09_digital_archaeology/ink/` and `scenarios/m10_full_disclosure/ink/` prefixes.

| Export | Written in m09 (file:line) | Read in m10 (file:line) | Values match? | Cold start (no m09) gets |
|---|---|---|---|---|
| `recruiter_offer` | `m09_phone_recruiter.ink:68` (default `refused`), `:153`, `:172` (`taken`), `:181` (`double_crossed`), `:206` (`named`), `:217` (`refused`); `m09_phone_agent0x99.ink:273-292` (deck resume) | `m10_director_netherton.ink:33, 54, 58, 204, 206, 223`; `m10_tesseract.ink:36, 110, 282-304, 470, 512, 711`; `m10_six_oclock.ink:41, 109-145`; `m10_kowalczyk.ink:35`; `m10_kowalczyk_core.ink:13`; `credits_sections.json:125`; ELSEWHERE clause (m10 S6, stage 9) | yes, all four values plus `""` | `""`: the default briefing, the whodunit live, no Recruiter beat at the core, no ELSEWHERE clause |
| `deck_pulled` | `m09_phone_recruiter.ink:69, 154, 173, 182, 207, 218`; `m09_phone_agent0x99.ink:274-292` | `m10_phone_agent0x99.ink:573`; `m10_tesseract.ink:563, 690, 802` (only `alpha_tapes` is read) | yes | `""`: no tape lines; Quintero takes the default (wounded) beat |
| `sleeper_named` | `m09_phone_recruiter.ink:155, 236` (on her naming line, as designed) | `m10_tesseract.ink:73, 1068`; `m10_director_netherton.ink:227` | yes | `false` |
| `sleeper_shortlist` | scenario `hl_placing_sheet.onRead` (m09 CONTRACT §5.1 L317) | `m10_director_netherton.ink:227`; the `clue_alibi` mapping at the aside is stage 9's and unlisted (SEAM_A M3) | yes | `false`: no "Two faces" line |
| `albion_notified` | `m09_phone_agent0x99.ink:609` (hub); `m09_closing_debrief.ink:135` (debrief) | `m10_carryover_vars.ink:364, 424, 428`; `m10_tesseract.ink:282, 303, 469, 503, 863, 919`; `m10_six_oclock.ink:387`; the "Carrow Controls" ELSEWHERE line (stage 9) | yes | `false`, and the Critical Mass watch is never listed (gated `m09_completed`); HaX's two cold flag-4 lines (`m10_tesseract.ink:180-181`) carry the notice |
| `hax_confession_answer` | `m09_phone_agent0x99.ink:387, 402, 413` | `m10_phone_agent0x99.ink:157-163`; `m10_tesseract.ink:549, 561-577` | yes, three values | `""`: the neutral "[How are you?]" line; slot 2 of exchange 3 gets the plain decoy |
| `recruiter_secret` | `m09_phone_recruiter.ink:71, 74` (`~` defaults), `:106` (`told`), `:110` (`denied`) | `m10_tesseract.ink:282-296`; `m10_six_oclock.ink:475-493`; `m10_hearing.ink:27-36` | yes (`confessed` is read with `told`, `m10_tesseract.ink:290`) | `""`: nothing |
| `reading_finished` | scenario `the_reading_last_page.onRead` (m09 CONTRACT L322) | `m10_tesseract.ink:695-700` | yes | `false`: "Then we do it the slow way." |
| `cage_bin` | `m09_sorensen_hatch.ink:85, 92, 103`; `m09_sorensen_door.ink:47, 55, 67`; scenario default on `cage_opened` (CONTRACT L323; needs `!bin_chosen`, SEAM_A M1, confirmed) | `m10_tesseract.ink:345, 695`; `m10_nightshade.ink:151, 227`; the `letters` HaX bark has no written text in m10 (minor 10 below) | yes | `""`: no Derek answer, no Nightshade copy line, "one thing" never plays |
| `legacy_files_saved` | scenario (HaX mappings, CONTRACT L325) | no ink or `credits_sections.json` reader; the ELSEWHERE clause is in m10 S6 for stage 9 (FA §3.7 L567) | yes | `false`: no clause |
| `nightshade_shown_file` | `m09_phone_agent0x99.ink:765` | `m10_carryover_vars.ink:322, 360`; `m10_tesseract.ink:911`; `m10_six_oclock.ink:38, 379` | yes | `false`; an m08 triple-agent save then plays "not shown" (SEAM_A M2, confirmed) |

`m09_completed` gates: `m10_director_netherton.ink:67, 97, 132, 150, 183, 211`, `m10_kowalczyk.ink:71, 242`, `m10_arakawa.ink:65`, `m10_hax_post.ink:32, 38`, `m10_tesseract.ink:177, 564, 919`, `m10_six_oclock.ink:387, 444`, `m10_hearing.ink:43`. SEAM_A's cold-start sweep holds: no m10 line states an m09 event on a cold save. The m09-route gaps are a different matter: majors 2 and 3 below, and minors 1 and 9.

## Findings

### Blocker

None.

### Major

**1. Two different "Helena plans" (owner m10, FINALE_ARC to rule).** In m09, flag 4 hands every player Tesseract's own list of his Tomb Gamma defences: `m09_phone_agent0x99.ink:504-506` ("his defences at Tomb Gamma are on here. Every one of them built from an entry in the stolen database"), and `:543` ("They're ours, turned round."). FA §6.1 L903 and §3 L299 count this list as m09's third gift. In m10, "Helena's plans" means only the 1962 construction drawings: `m10_nightshade.ink:170` ("Helena's plans don't know the post exists"), `:172` and `:230` ("They are old plans."), `m10_director_netherton.ink:361` ("Whatever he built since is not on them."), and m10 S6 `helena_plans` ("As Built, 1962"). On an m09 save the player already holds the refit's defence list with its catalogue entries, which is exactly what Nightshade sells at the table (FA row 104). That makes the payment worth little, and the check against "entry 3" ought to run against Tesseract's own list, not the drawings. Nothing in m10 mentions the flag-4 list. Fix (m10): one HaX line at the table on `m09_completed` that sets the two documents apart, for example "His box gave us which entries he built from. Not which door each one's on, or who stands where. That's what Nightshade's selling." Then FA L299 says the m09 list names the defences without placing them, and m09's `:506` stays as it is. Or, if FA prefers, m09 narrows the hour-read lines to "the entries he built from".

**2. The Tomb Alpha record answer assumes an optional read (owner m09 export + m10 gate; this corrects SEAM_A m1).** SEAM_A says m09 has no "carry it". The clip has none, but the annotation sheets do: they decode to "Carry it yourself. Let it hurt afterwards." (FA row 120), and HaX's topic 3b (`m09_phone_agent0x99.ink:627-630`) pays them. The read is optional, though. `alpha_annotations_read` is m09-local (m09 CONTRACT L370) and isn't exported, and the clip itself needs the player to work the deck (m09 CONTRACT §4.4). `m10_tesseract.ink:601` offers "[Your Tomb Alpha notes say carry it. They never say hand it on.]" on `m09_deck_pulled == "alpha_tapes"` alone, which puts in the player's mouth a document they may never have opened. Its neighbour `:607` ("She carries it so she never hands it on.") assumes the m09 `afterwards` call was heard, and `afterwards_heard` isn't exported either. It is very likely heard, because it rings unasked on `deck_choice_made`. Fix: export `alpha_annotations_read` as a twelfth m09 export (JSON only; FA §3.4 and both contracts), and gate `:601` on it. Without it, slot 4 falls through to `:607`. The two tape barks (`m10_phone_agent0x99.ink:573`, `m10_tesseract.ink:691`) are HaX's own knowledge and can stay as they are.

**3. "Task Force Null, for eleven years" (owner m10).** `credits_sections.json:129, 134, 139, 144` all read "Breaching lead, Task Force Null, for eleven years." Task Force Null was set up after Albion this year: m05 has Netherton call it "three people and a whiteboard" (`scenarios/m05_insider_trading/ink/m05_insider_trading_opening.ink:45-49`), and m04's debrief is its founding. Kowalczyk's eleven years are SAFETYNET service (m09 `m09_closing_debrief.ink:161`; FA row 117). Four of her five clauses state a false fact in the season's last credits. Fix: "Breaching lead, Task Force Null. Eleven years in the service. Badge returned." (and the same for the other three).

### Minor

1. **(m10) "I didn't. I worked it out." is offered on `taken`.** `m10_director_netherton.ink:248`, `m10_kowalczyk.ink:99`, `m10_six_oclock.ink:135` (the last is ungated by route). On `taken` the Recruiter sold the name. FA §4.0 lists two taken answers, and the R2 A2-04 rule is "only answers they could give". Her reply ("That's worse. That means I was good.", `m10_six_oclock.ink:151`) is wrong there too. Fix: gate all three on `m09_recruiter_offer != "taken"`.
2. **(m10) "the night you handed it over".** `m10_kowalczyk.ink:243`. m09 hands the cracker over at the morning briefing in the Citadel (`m09_briefing.ink:6, 284-286`). Fix: "I said that the morning you handed it over."
3. **(m09) Quintero's objection count.** `m09_briefing.ink:276` "Noted, again." means she had already objected before Helena. `m10_director_netherton.ink:151` "Twice now." counts Helena as the first. Fix: m09 to "This one didn't. Noted." (cheapest; the line is voiced, so it needs one new clip) or m10 to "Again."
4. **(m09, m10; FINALE_ARC for the arc's quoted wording) Netherton contractions on weighted lines.** The season's naming line `m09_phone_agent0x99.ink:329` "I said we wouldn't name him" (FA row 125 quotes it this way too); `m09_closing_debrief.ink:132` "I'll sign whichever." (the notice decision; m10 has "I will sign it.", `m10_tesseract.ink:861`); `m09_closing_debrief.ink:278` "She'll be where he is." (m09's last spoken line on double-cross); `m10_six_oclock.ink:266` "He reached. I'll put that first."; `m10_six_oclock.ink:317` "She'll have sold that too."; `m10_director_netherton.ink:292` "You'll be at the lock without her." (a cost line); `m10_tesseract.ink:882` "I'll have his collected." Fix: full forms. "would not", "I will sign whichever", "She will be where he is", "I will put that first" are the four that matter most; the m09 voiced ones need new clips.
5. **(m10) Gary's lanyard joke told twice.** m09 `m09_phone_gary.ink` (protected Gary): "Director of Cyber Security, me. They gave me a lanyard with my name spelt right." m10 `m10_gary.ink:27` (the same branch): "I'm Director of something now. They gave me a lanyard." Played in a row, he tells the same joke as if new and forgets his own title. Fix: m10 gives him "Still got the lanyard." or a new beat. `gary_called` isn't exported, so the line must work either way.
6. **(m10) "once" against "every year".** `m10_tesseract.ink:544` "I taught a room of twenty, once." m09 has HaX "He gave that lecture every year." (`m09_alpha_recording.ink`), Netherton "He trained half my field officers." (`m09_phone_agent0x99.ink:330`), and m10's own cold line "He trained me, and half the field." (`m10_director_netherton.ink:104`). Fix: "I taught it to a room of twenty, every year."
7. **(m10) Water controllers: patchable in m09, never in m10.** m09's Carrow controller "runs water works and substations" and gets a vendor fix in ninety days (`m09_phone_agent0x99.ink:445-449, 611`). m10 `m10_tesseract.ink:852` "the water controllers never", and `m10_six_oclock.ink:343-345` "There's no patch for their controllers." A player who sent the notice hears, a line later, "This is that letter, a thousand times" (`:864`). Fix: "the oldest water controllers never" at `:852`, and "their old controllers" at 06:00.
8. **(m10) "The notice you read in Helena."** `m10_tesseract.ink:178`. The Albion folder is optional reading in m09; HaX only tells the player to read it (`m09_phone_agent0x99.ink:425`). Fix: "The notice from Helena is on here too."
9. **(m10) m09's `letters` payoff has no written home.** FA row 11 gives HaX's line at the server-hall printer ("Tran's handler is on that rota. He's in the Helena letters."), and m10 CONTRACT L179 and §5.8 10-14 make it a JSON bark plus "D. Varga" on the printer's rota, for stage 9. m10 has no texts file (m09 has `texts/A_hax_texts.md`), and FA §3.7's stage 9 list doesn't name it, so it is the payoff most likely to be dropped. The same goes for `m03_guard_bribed` (FA §3.7 L568, still unwritten). Fix: an m10 `texts/` file with the bark and its condition `globalVars.m09_cage_bin === 'letters'`, and a line in FA §3.7.
10. **(m10) The casualty figure is spoken two ways.** m09 HaX: "One thousand one hundred to two thousand six hundred." (`m09_phone_agent0x99.ink:511, 513`). Every m10 speaker: "Eleven hundred to twenty-six hundred" (`m10_director_netherton.ink:122, 124`; `m10_tesseract.ink:202, 728`). Same value. HaX's m09 form is the odd one out and is voiced as the number the player hears first. Taste call; changing it means new clips.
11. **(m10) Scorched Earth on the double-cross.** `m10_tesseract.ink:1068-1069` sends him out "by a panel nobody had found" on any `m09_sleeper_named`. On `double_crossed`, though, Kowalczyk came in through the service door with her own badge (FA §4.0 L601) and is standing by it when the player arrives (`:68`). The door is plainly usable. Fix: test `m09_recruiter_offer == "taken"` here, not `m09_sleeper_named`.
12. **(FINALE_ARC) Stale arc wording against the ink.** FA §4.1 step 0 has "Two cells have it. They'll waste it."; the ink has "Much good may it do them." (`m10_tesseract.ink:101`). FA row 34 promises an m09 Netherton briefing line on Victoria's CPS case giving the raid legal cover; the m09 ink has only HaX's wall card (`m09_briefing.ink:131`). FA row 11's "Tran's handler line" is now m10's (see minor 9). Fix: FA to match the ink, or drop the row-34 promise.

Confirmed from SEAM_A, with my evidence: M1 (`m09_sorensen_hatch.ink:85-103` picks before `cage_opened`), M2, m4 (`m10_tesseract.ink:345`, `:390` unguarded). I found nothing against M3, M4, m2, m3 or m5.

## Open-threads table

"Stage 9" means the payoff is specified (FA, m10 S6 or a contract) but lives in JSON that doesn't exist yet. m09 = `scenarios/m09_digital_archaeology/ink/`, m10 = `scenarios/m10_full_disclosure/ink/`.

| Thread (FA row) | Closed where | State |
|---|---|---|
| The Architect's name (125, 70, 97, 98) | m09 `m09_phone_agent0x99.ink:329-360`; m10 cold `m10_director_netherton.ink:102-104` | closed |
| Tesseract's fate (§4.5) | m10 `m10_tesseract.ink:1023-1083`; 06:00; card | closed, six endings |
| "Let it hurt afterwards" (120) | m09 `m09_phone_agent0x99.ink:244-245`; m10 `m10_tesseract.ink:544`, `m10_six_oclock.ink:442` | closed (see major 2 on the Alpha form) |
| HaX's "the rest" (§5.4) | promised at m09 `:248, :621` and `m09_closing_debrief.ink:274`; paid at m10 `m10_six_oclock.ink:447-466`, `m10_hearing.ink:46-47`; Join and executed withhold it on purpose | closed |
| Tomb Gamma, location (108) | m09 lease file texts A3-21/22 (`texts/A_hax_texts.md`); m10 the raid | closed |
| Tomb Gamma, the database (§1.1) | m10 `database_menu` `m10_tesseract.ink:880-897`; 06:00 `database_beat` | closed |
| Tomb Alpha and Tomb Beta (§1.4) | m09 tape room and salvage cage; m10 S6 "Alpha, Beta, Gamma" | closed |
| Nightshade's fate (104-107) | m10 door scene `m10_nightshade.ink`; 06:00 `m10_six_oclock.ink:38, 418-420`; "In this operation" clause (stage 9); `dark_ops :381` | closed; m08-triple-agent with m09 unplayed is SEAM_A M2 |
| m08 knock-outs of HaX and Netherton (110-111, 115) | m09 `m09_briefing.ink:30-31, 55`, `m09_closing_debrief.ink:247-250`; m10 `ko_sting` `m10_tesseract.ink:623-635` | closed |
| WREN / other sleepers (117) | m09 ledger `m09_phone_agent0x99.ink:184`; the Recruiter's sale; m10 whodunit, core, 06:00, credits `credits_sections.json:121-146` | closed (major 3 on the credit wording) |
| The Recruiter's m05 deal (61) | m09 `m09_phone_recruiter.ink:80-115`; m10 `m10_tesseract.ink:287-296`, `m10_six_oclock.ink:473-493`, `m10_hearing.ink:24-38`; `told` credit clause (stage 9) | closed |
| The Recruiter herself (60) | m09 call and credits; m10 core sting `:298-305`, 06:00 text on double-cross (stage 9), ELSEWHERE clause by value (stage 9) | **left at large on purpose** on `taken` / `refused`, for a later season |
| The forty-seven (62-63) | m09 Noor (`m09_closing_debrief.ink:209-217`); m10 card line (c) and ELSEWHERE (stage 9) | closed |
| Legacy placements (63) | m09 `m09_closing_debrief.ink:203-205`; m10 ELSEWHERE (stage 9 only) | closed, stage 9 |
| Torres / Elena Torres (64-65) | m09 `m09_phone_torres.ink`, ledger `:198`; m10 card line (d) | closed |
| Victoria (32-35) | m09 wall `m09_briefing.ink:127-138`, hub 14, A3-23; m10 gallery (`m10_victoria.ink`, `m10_victoria_line.ink`, `m10_vos.ink`), 06:00 `:249-257` | closed; at large on escaped/let-walk, on purpose |
| Zero Day / Vos (42) | m10 gallery; ELSEWHERE "Zero Day: still trading." | **left open on purpose** (0day is Season 2) |
| Voltage, Static (44-46, 53) | m09 wall `:143-148`; m10 `m10_director_netherton.ink:75-77`, `m10_voltage.ink`, `m10_static.ink`, 06:00 `:175-190` | closed |
| Vance / Elena Rodriguez (50-51, 90) | m10 `m10_vance_phone.ink`, `m10_elena_phone.ink` | closed |
| Ghost (13-16, 30) | m09 wall `:113-124`; m10 `m10_ghost_phone.ink`; 06:00 text by `ghost_answer` (stage 9) | closed; Ghost at large on purpose |
| Gary (23) | m09 `m09_phone_gary.ink`; m10 `m10_gary.ink`, 06:00 `:194-216` | closed (minor 5) |
| Graham Reeves (21-22) | m09 handler's contact sheet (stage 9 object variant); m10 rota prop (stage 9) | stage 9 only |
| Derek Lawson (1, 8-9) | m09 wall, Reading, `derek_file` texts A3-28; m10 `m10_tesseract.ink:250-259, 390` | closed (SEAM_A m4) |
| Social Fabric / Villanueva / Tran (6, 11, 84) | m09 hatch `:92-99`, `afterwards :239`, debrief `:226-232`; m10 printer prop, `m10_six_oclock.ink:311`, `letters` bark (unwritten, minor 9) | leader left unnamed on purpose |
| Danny Foster (36) | m09 texts A3-26 | closed in m09 |
| Terry Mott's £500 (38) | promised for m10; no line written anywhere | **open** (FA §3.7 L568: place it or cut the import) |
| Irina, St. Catherine's ransom (17, 74) | m09 texts A3-24, A3-25 | closed in m09 |
| Satoshi stance, Kemal (76-77) | m10 `m10_tesseract.ink:221-228`; m09 `:515-516` | closed |
| Fund freeze, $12.8M (72, 80) | m10 `m10_phone_agent0x99.ink:192-195`; `m10_six_oclock.ink:319-325` | closed |
| Dispatch, eleven counties (83) | m09 `m09_briefing.ink:244-246`; m10 `m10_director_netherton.ink:192-194`; card line (a) | closed |
| Seattle / backdoor (81-82, 86) | m10 `m10_tesseract.ink:702-710` | closed |
| Mercer, Hollis (87-88, 92) | m10 `m10_mercer.ink`; Hollis bark (stage 9) | closed / stage 9 |
| m07 leaders (103) | m10 card cells line, THE CELLS (stage 9) | **left alive on purpose** for Season 2 |
| Fraser and Ferreira (100) | m09 `m09_closing_debrief.ink:239`; m10 IN MEMORY `credits_sections.json:218-221` | closed |
| Albion notice / disclosure (48, 59) | m09 hub and debrief; m10 exchange 2, database, card line (b), ELSEWHERE (stage 9) | closed |
| PIN cracker supply chain (29, 118) | m09 briefing `:284-287`; m10 bench log, crack `m10_kowalczyk.ink:242-244` | closed (minor 2) |
| Vector and Phantom (112, 121) | m10 `m10_director_netherton.ink:79-85, 118-119, 168-169` | closed |
| Marcus Tesseract (123) | nowhere | dropped on purpose (brief rule) |

## Check of STAGE_8_VOICES_THREADS_A's missing and partial rows

| Row | Verdict | Where it is, or where it should go |
|---|---|---|
| 20 exposed-hospital answer | **Exists.** VT-A searched exchange 1; it is in exchange 2, slot 3 | `m10_tesseract.ink:495-499` |
| 21-22 Reeves | **Exists as stage 9 object text** | m10 S6 `tunnel_rota` variants (lore_fragments L134-155); m09 S6 handler contact sheet (m09 lore_fragments L146-153). HaX's "Reeves. From the hospital…" line is the only missing piece → stage 9 JSON bark on the rota's read |
| 31 "Not the money. The lesson." | **Missing** | ink, `m10_tesseract.ink` `case` (one line by him, `m02_completed`), and HaX's beat as second speaker in the same knot |
| 38 Terry Mott's £500 | Missing, already ruled | stage 9 JSON HaX text |
| 46 Static alone | **Partial; mostly exists** | the `static_kit` object (m10 S6 L372) and the ELSEWHERE line (L1095) cover it. HaX's "That's his." → stage 9 JSON bark on the kit's read |
| 51 Vance knocked out | **Partial** | ELSEWHERE "Robert Vance: said no again." (m10 S6 L1096) is there. HaX's "I rang Vance. He said no…" is missing → stage 9 JSON HaX text in the power room (no ink knot fits) |
| 66 programme exposed | **Exists as stage 9 object text** | `uplink_printer` variants 1 and 3, "Sources name the unit as SAFETYNET's, and the agent as 0x00." (m10 S6 L458-460). HaX's line at the prop → stage 9 JSON bark, together with the `letters` bark (minor 9) |
| 72 fund frozen | **Partial** | HaX's line exists (`m10_phone_agent0x99.ink:194`); the duty-board memo is m10 S6. Tesseract's "You froze my bank…" is missing → ink, `m10_tesseract.ink` `case`, on `m06_assets_seized` |
| 79 "keeps spares" | **Missing everywhere**, with no object in m10 S6 | drop the row, or add a stage 9 object (a reserve ledger) with no ink. Recommend drop: secure's "crypto" cell already pays the reserve (`m10_six_oclock.ink:363`) |
| 88 Mercer arrested or knocked out | **Missing** | ink, `m10_director_netherton.ink` `briefing_team`: one Netherton line on `m07_mercer_fate == "arrested"` ("Mercer's statement drew us the server hall."), or the map object's text at stage 9 |
| 90 Elena turned | **Partial** | `m10_elena_phone.ink` gives her no "Netherton decided" line → ink, one line in `cut_0` on first ring |
| 99, 102 Council "numbers" | **Partial** | Tesseract's line `m10_tesseract.ink:269` and the `projection_desk` object (m10 S6 L106-109) exist. Netherton's "You asked for the numbers. You have them." is missing → ink, `m10_director_netherton.ink` `briefing_stakes`, on `m07_debrief_stance == "hardened"` |
| 108 the deed as a task | **Exists** | m09 S4 `find_the_deed` (`objectives_tasks.md:115`) |
| 116 go-bag ticket | **Partial, confirmed** | `m09_briefing.ink:41-45` plays it only when neither earlier reason fires. Ink, `m09_briefing.ink`: one fixed Netherton line after the branch ("And Nightshade's go-bag held a one-way ticket to Helena."), gated on `m08_completed` and not already said |
| 104 `m08_triple_agent_first_payment` | **Imported, read nowhere**, confirmed (m10 RL L367 only places it) | ruling: either the unshown payment needs it (ink `m10_nightshade.ink` `unshown`, a one-line variant) or drop the import (Tier 1 → cut) |
| 34-35 Victoria arrested | Confirmed (my minor 12) | FA wording fix only |

## Facts said differently that neither A file caught

Already above: major 1 (what "Helena's plans" holds), major 3 (Task Force Null's age), minor 2 (morning, not night), minor 5 (Gary's title), minor 7 (water controllers patchable or not), minor 10 (the casualty figure spoken two ways). One more, which is a good one and not a fault: m09 "He told us to call him Adrian on the course. None of us ever managed it." (`m09_phone_agent0x99.ink:620`) is paid by m10 HaX's "You'll want a lawyer, Adrian." (`m10_six_oclock.ink:408`). Keep it, and keep HaX from calling him "Adrian" anywhere earlier in m10 (she doesn't now). Place names (Mountain States Records & Retention, Butte, Bozeman, Great Falls, Billings, Baltimore), "since the course" and "seven years" match across both missions.

## Checked and consistent

Days and hours: leave cut on day 11, "two days ago" for Nightshade (`m09_briefing.ink:28, 45`); 06:00 UTC day 13, 04:00 head start, "twenty hours" (`m09_closing_debrief.ink:91`; `m10_director_netherton.ink:115-117`). "Seven years" (`m09_phone_agent0x99.ink:330, 572`; `m10_director_netherton.ink:104`). "Fifteen years" for Nightshade (`m09_briefing.ink:210`; `m10_director_netherton.ink:88`). "Eleven years" for WREN and Kowalczyk's mother's care (`m09_phone_recruiter.ink:157`; `m10_six_oclock.ink:145`). "Nine years" for the notice (`m09_phone_agent0x99.ink:436-442`; `m10_tesseract.ink:180, 503`). 140 hospitals, 47 and 14 million systems, twenty-three and forty-seven, eleven legacy placements, 1,100–2,600.

Recurring lines land: "Nobody asked who for" (`m09_briefing.ink:282`, `m10_arakawa.ink:63-66`); "The long way is over"; "Ninety-nine" / "It's HaX" / "Still HaX"; "the door will open for you by name"; "take your time"; "You get all of it from now on" → "I said everything from now on"; the handbook chapter; "Magnus." / "Adrian."; "the arrests start at six" on `named` (m09 `:172`, m10 `:225`, `m10_six_oclock.ink:42`); Kowalczyk "walked off the apron" on double-cross; "We take her at the briefing" → cuffed at the van.

Naming rule: no personal name or gendered word for the player in either mission (searched both; "Agent", "0x00", "they" and "your agent" only). WREN has no pronoun before the name in either mission. Speaker labels match across the two missions (Quintero `Agent 0x2D 'Anchor'`, Kowalczyk `Agent 0x5E 'Lantern'`, Nightshade `Agent 0x47 'Nightshade'`).

Voices: HaX is clipped and dry in both, with contractions and the same handler's habits ("Line's open"). Kowalczyk is easy, joking ("toy", "It was a good cracker.") and true until the crack. Quintero is blunt and procedural. Nightshade is measured, with wry aphorisms ("Every lock is a promise…" / "The old doors were the honest ones."). The Recruiter speaks US English and in ledger terms, and her one m10 text ("I'll remember the shape of you.") fits. Tesseract's voice in m10 matches the m09 tape lines and HaX's report of his call (quiet, costed, "I've costed both"). Netherton keeps full forms on most weighted lines, apart from minor 4.
