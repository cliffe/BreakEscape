# m06 pass 5: alignment review, round 1

2026-10-13. Opus reviewer, read-only, static only (no browser session). `mission-alignment-plan` rubric applied in full by one reviewer, measured against m02, m03 and m04 as they are now, with canon checked against m05 and m07. Every claim below was checked against `scenario.json.erb` and the ink; the older docs were not relied on. No SecGen XML or restricted lab-sheet body was opened.

Checks run:
- validator (`--skip-ink --no-graph`): ERB, JSON, schema, unknown fields, geometry and door alignment all clean. 12 wiring warnings, all duplicate event pairs on `agent_0x99_handler`; I read each pair and they are deliberate (text plus task backstop, or disjoint in practice). 12 issues and suggestions, of which the useful ones are #9 (no hostile NPC anywhere) and #11/#12 (credits sections with no unconditional line; I traced both and every path prints at least one line).
- `predict_door_sides.py`: nine rooms, all doors placed, no overlaps.
- Lab sheets: all five field-guide URLs have a matching file in `HacktivityLabSheets/_labs/safetynet/` (checked by filename only).

**Counts: 0 blockers, 7 majors, 15 minors.**

## Severity table

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| A1 | major | **The debrief fires the moment the last decision or flag lands, so the sweep is lost.** The debrief mappings open a `disableClose` person-chat on `conversation_closed:satoshi_nakamoto` as soon as both decisions and all four flags are in. A player who confronts Satoshi first (the natural order: he is the first thing in the room) loses the safe in the same office, and with it the Tesseract file, the mission's biggest reveal. The debrief then says "The one thing we didn't get is whatever Satoshi kept in his safe", which the game took away. m03 and m04 both moved to sweep-then-call-in for this reason (m04 R1 A4) | erb:1153-1178 (trigger list erb:1166); debrief.ink:442-445; safe erb:1795-1819 | Copy m04's shape. `all_in` sets a new `ready_to_extract` global instead of opening the debrief. HaX texts "That's both calls made. Look round if you want, then call me." plus a second clause naming the safe when `architect_identity_found` is false. The hub's first choice becomes `{ready_to_extract and not start_debrief_cutscene} [I'm done here. Bring me in.]`, which sets `start_debrief_cutscene` and relays through a single mapping that opens the debrief. Add an optional `call_in_after_sweep` task to `resolve_the_fund`. Keep a reload backstop as m04 does (m04 erb:1210-1217, 1252-1259) |
| A2 | major | **Music forgets the story phase.** The only `game_loaded` cues are briefing / not briefing, so a reload after the fund is found plays noir. `all_hostiles_ko` always returns to noir, so punching Satoshi after the fund switches the spy-action phase back to noir. The hostile cue has no `restored` guard (m04 erb has one), so a hostile restored on reload can flip the track. The debrief starts on spy-action where m03 and m04 use `end`. The victory cue names no track, while m02, m03 and m04 each have their own credits song | erb:91-139 (hostile cue :113-118, `all_hostiles_ko` :120-125, debrief :133-139, victory :140-146) | m03/m04 phase pattern: ERB phase conditions `music_day` (`!found_architects_fund`), `music_climax` (`found_architects_fund && !assets_decided`), `music_after` (`assets_decided`), each with a `game_loaded` and an `all_hostiles_ko` twin. Add a `global_variable_changed:assets_decided` → `end` cue and move the debrief cue to `end`. Add the `restored` guard to the hostile cue. Give the victory cue `"track": "Digital Leashes"`, which no mission uses yet (`Cipher Tide` is the other unused vocal) |
| A3 | major | **The cover is set up as a risk and never pays off.** The briefing says the FCA paperwork "won't survive a phone call to the FCA, so don't give anyone a reason to make one". Nothing in the mission ever makes that call. Being caught picking the checkpoint lock, opening badly with Irina ("I need your servers, your logs and your wallets"), knocking out Dani or Priya in front of the floor: none of it changes anything. Satoshi opens with "You're not from the FCA. I had you investigated" whatever the player did. m02's `cover_burned` / `cover_restored` is the model. As it stands the cover is the mission's identity on paper and flavour in play. The FCA letter in the debrief (debrief.ink:317-364) is a good payoff, so the cover is worth giving weight | briefing.ink:93; satoshi.ink:55; guard.ink:125-131; irina.ink:114-118, 137; trader and analyst KOs erb:1373, 1627 | Add a synced `cover_strained` global, set by `guard_caught`, `npc_ko:trader_npc`, `npc_ko:blockchain_analyst` and an Irina-local suspicious opener that was never repaired (`irina_suspicious` still true when the first conversation closes). Consequences: (1) HaX texts once, "Someone on that floor is going to ring the FCA. Get what you need before they do"; (2) Irina's badge loan needs more trust (`irina_trust >= 35`, the cloner route stays); (3) Satoshi's opener branches: cover held, "Your paperwork was good. I had you checked anyway"; cover strained, "Somebody on my floor rang the FCA an hour ago. They've never heard of you"; (4) a credits line "FCA COVER: held" / "FCA COVER: strained by the end". See Decision 2 for how hard it should bite |
| A4 | major | **The moral choices and the big reveal land in silence.** No mapping reacts to `irina_recruited`, `irina_arrested`, `assets_seized`, `monitoring_enabled`, `architect_identity_found`, `guard_ko`, `trader_ko` or `analyst_ko`. The only reactions are the four `npc_ko:irina_volkova` texts and the Satoshi-KO phone chat (the only `eventPattern`s on those names are erb:1027-1073). So turning Irina, the mission's central choice, gets no word from the handler, and nor does finding out that The Architect may be SAFETYNET's own former chief strategist. A detained Irina then sits at her desk "waiting for the police" for the rest of the mission, and no police ever come. The watch choice has no sign in the world at all. m04 reacts to each choice in the moment and again in the debrief | erb:1027-1073; irina.ink:473-518, 566; satoshi.ink:327-408; safe contents erb:1807-1817 | HaX texts, one per event, each with `skipIfGlobal` where a later state makes it stale: recruited ("She's turned. Whatever she gives you tonight, write it down twice"), detained ("Police are on the way for her. She stays where she is until they arrive"), freeze ("Transfer's confirmed. ENTROPY will notice by morning"), watch ("Tags are on. The moment that release fires, every address it pays lights up here"), safe opened ("Tesseract. ...Bring that page out with you. Don't read it to anyone else"), and a short line for any innocent KO ("Okonkwo had done nothing. That goes in the report"). Hide a detained Irina on the next room entry after `irina_arrested` (a room_entered `setNPCVisible:false` with a re-hide on reload) so the police visibly took her; keep her desk lines for the turned version |
| A5 | major | **There is no antagonist in the building and no sight challenge.** Every NPC between the lobby and Satoshi is friendly or a turnstile, so nothing threatens the player between the checkpoint and the last room (validator suggestion 9). The executive wing, the approach to the Crypto Anarchists' leader, is an empty corridor holding a press clipping. m03 (Terry) and m04 (the guard, Cipher, Static) use `los.challengeOnSight`, and the brief lists sight challenges among the m04 patterns to copy | erb:1710-1737 (executive wing), :1243-1253 (the guard's only mapping is the lockpick catch) | Put Satoshi's minder, a Crypto Anarchists operative, in the executive wing with `los.challengeOnSight` (m04 erb:617-640 shape, `requireGlobal: found_architects_fund`). He has a talk-past on the FCA cover while the cover holds ("The FCA doesn't come up here." / "It does tonight."), turns hostile when `cover_strained` is true, and has a KO fallback. This ties A3 to a
*(The rest of this report was completed by the orchestrator from the reviewer's hand-back. A safety check stopped the reviewer while it was writing; the findings are the reviewer's. The A5 row above may be cut short: A5 is the missing in-building threat and sight challenge, and its proposed fix is a minder for Satoshi in the executive wing, with a talk-past while the cover holds.)*

| A6 | major | VM flags 1 and 2 pay out an `emit_event` that nothing listens for (erb:1433-1441), and flag 2's mapping only sets a global (erb:937-940), so HaX never reacts to flag 2. Flags 3 and 4 are woven in well. | Story reaction from HaX for every flag. |
| A7 | major | Canon: the "You're under arrest" option (satoshi.ink:71) and "with him arrested" (phone.ink:408). | Detain and hand over. |

## Minors

- A voiced line prints `{player_name}` (phone.ink:104).
- The phone HaX avatar is `npc_helper.png` (erb:705); every other HaX uses `agent_hax_headshot.png`.
- The fund wording "cells not yet paid go without" (erb:157, satoshi.ink:336) contradicts erb:71, where all six cells already had advances.
- Irina's KO credit says "the offer was never made" (erb:169), which can be false.
- The debrief says nothing about the guard, trader or analyst KOs that the credits list.
- The guard says "Afternoon" (guard.ink:49) in a night mission.
- The guard sends the player to an unstaffed reception (guard.ink:43, 131).
- `mission.json` says "compliance auditor"; the game says "FCA supervisor".
- HaX's hub has five separate guide options and no lockpicking guide.
- "How do I play Volkova?" retires after one use.
- For the dressing stage: the executive wing is reached through the data centre, and two server rooms sit back to back.
- The fingerprint kit is carried but never used (a puzzle-chains item).
- The debrief covers the VM work in one generic line (debrief.ink:306).

**Counts (provisional): 0 blockers, 7 majors, about 15 minors.**

## Canon

- m05 → m06 matches: $847,000 via TalentStack, and m05's debrief ends "Next, we follow the money".
- m06 → m07 matches: six cells, the 72-hour clock, four operations, and the Tesseract thread works with or without m06.
- m07 doesn't reflect the freeze/watch choice.

## Needs checking against SecGen by the user

The in-game VM claims at phone.ink:212 and :529, erb:903, erb:1486, and the account mapping in the rack sheet.

## Decisions (reviewer's likely list; the orchestrator's calls are logged in IMPROVEMENT_LOOP_LOG.md)

1. A minder NPC for Satoshi in the executive wing, with a sight challenge.
2. How hard a strained cover bites.
3. Whether the freeze/watch choice carries into m07.

Not written by the reviewer: the alignment-plan section and the route list for `scripts/ink_runtime_check/m06_routes/`. The fixer derives both from the findings.
