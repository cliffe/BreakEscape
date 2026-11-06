# m10 Full Disclosure: alignment review, round 8 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only and static (no browser). I worked the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R7 and CONTRACT §11 (rounds 1 to 7). The tree is HEAD a395d5af. The R7 fixes are 02763652..HEAD, which touches only `scenario.json.erb`, `CONTRACT.md` and `FINALE_DEV_LOG.md`; m10 has no uncommitted changes. No VM material was opened. Scratch files are in `scratchpad/m10_r8/`.

What I read: the R7 diff; `six_oclock`, `hearing`, `citadel`, `victoria`, `vos`, `gary` and `nightshade` (start and menus) in full; `imran`, `voltage`, `wendell`, `asante`, `ghost_phone`, `victoria_line` and Netherton's briefing stance; Tesseract's router; HaX's hub, accusation and console knots; `close_compute()` and `season_line()`; the card, every credits section, and the eventMappings from the workshop to the end of the night (erb:1650-1783) plus the gallery, workshop and power-room NPC records.

- **Ink:** R7 changed no ink, and every `.json` is newer than its `.ink`.
- **Validator** (`--skip-ink --no-graph`): 0 errors, plus the same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and the cutscene `onceOnly` advisories as R7.
- **Writer inventory.** A script listed every global that the close reads (the three closing inks, `close_compute()`, `season_line()`, and every `globalVars.` test in the ERB) and every writer of each: ink `~` assignments, `#set_global` tags, ERB `setGlobal` and `globalVarOnKO`. That is 120 globals. For each decision global I then asked whether a later action can overwrite the player's choice. The table is in "State that changes after a decision" below.

## Counts and verdict

**0 blockers, 0 majors, 3 minors** (open).

All three R7 minors are closed at the lines R7 named, and the fixes bring no new problems. The systematic writer pass found three later actions that can still overwrite a choice the close reads. The class is the same one that produced R6's re-accusation and R7's post-four gallery bugs:
- **R8-m1.** After the outer lock opens, recruited Victoria and Vos still offer their lock deals. A pick then rewrites `victoria_gallery` or `vos_outcome`. That can spawn the hostile reinforcements, drop "Sterling's watch" from the close, and print "opened the lock" or "Withdrew Zero Day's order" under a card that says Zero Day has it.
- **R8-m2.** On unprotected Gary's branch, Gary's pick writes Imran's outcome even after the player knocked Imran out. Imran then speaks while unconscious, Farah leaves her post, and his credit says he went home.
- **R8-m3.** Escaped Voltage's knock-out mapping is unconditional. Hitting him after he stood down turns `stood_down_print` or `talked_down` into `ko` and sets `cut_by_hand`. Robert Vance or Elena is then credited with talking the player through a cut that Voltage made himself.

**Verdict: another round needed (phase not complete; 0 majors, 3 minors).** None needs the user. R8-m3 is a mapping guard. R8-m1 and R8-m2 are ink routing, plus at most two new short voiced lines (audio for m10 hasn't been generated). Apart from these three, every save I traced lands each earlier choice at the close, and the season adds up from the player's side.

## R7 findings: closed or not

| R7 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| m1 post-four gallery choices | closed | erb:1734-1737: the three Victoria values and `vos_secret_used` stop Zero Day's share only on `head_start_out === ''`. **Every writer of `head_start_out`** is one of the four `outer_lock_open` mappings (erb:1749-1752). Each is guarded `head_start_out === ''`, and nothing resets it. `outer_lock_open` has two writers, the door events into the core (erb:1747-1748), and the core has one door (gallery east, erb:3612; the core's only connection is the gallery, erb:3964). So the guard means exactly "before the lock". **No pre-four outcome is blocked.** `confronted` and Vos's secret both unlock the core in the same conversation, but the assignment's observer fires at the end of the `Continue()` that holds it (global-writer.js header; npc-conversation-state.js:552-597), so it runs before the next line's `#unlock_door:core`. The share is stopped before `head_start_out` is computed, as before R7. With the old guard the other order would also have failed (erb:1753 releases a live share in the same chain), so the fix changes nothing before four. **Nothing else can flip four o'clock state after four:** erb:1696-1698 need a new `head_start_killed`, and HaX's console offers each option only on `head_start_killed == ""` with a live share (phone_agent0x99.ink:578-587), which is impossible once erb:1753-1754 have released them. erb:1663-1664 need a Ghost call, which comes before the stair (erb:1652-1656). `head_start_out` is written once | none in the share. A related post-four write remains through the gallery menus themselves (**R8-m1**) |
| m2 "by the key" | closed | erb:793-794. The rows print only on Join with a stopped share, and they agree with the credits header "RELEASED BY KEY" and with tesseract.ink's "Or now, if someone presses this." | none |
| m3 Vos stopped-share rows | closed | erb:712-715 sit ahead of the old four (erb:716-719), and IN THIS OPERATION takes the first clause that holds. Every `vos_outcome` × `share_zero_day` × Join/non-Join combination prints exactly one row: `stood_aside` erb:709, `ko` :710, refused/avoided × stopped × Join :712-713, × non-Join :714-715, × not stopped :716-719. `bought` prints no Vos row, as his deal ("My name stays off whatever you write tonight", vos.ink:242) intends. Vos's own lines test `head_start_killed == "zero_day" or share_zero_day == "stopped"` (vos.ink:229, 266, 290). Given erb:1696 that equals the credit's `share_zero_day === 'stopped'`, so what he says and what the credit says agree | none in the rows. A post-four `stood_aside` still prints "Withdrew Zero Day's order." beside a share that went out (part of **R8-m1**; it predates R7, because the old guard also left a released share alone) |

## Severity table (new findings)

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R8-m1 | **The gallery's lock deals stay open after the lock has opened, and a pick then rewrites a decision the close reads.** Recruited Victoria and Vos stay on the walkway after the outer lock opens. Only `trusted` on a live or traced share and `walked` hide her (erb:3633-3634), and Vos never hides. Their menus don't test the lock. A player who cracks the keypad or uses Fonoti's card while she stands there, then turns to her, gets:<br>• **Recruited Victoria.** Her `refused` was written when the lock opened (erb:1742) or on her first line (victoria.ink:27-28); `refused` doesn't route to `gallery_rest` (:30), so `recruited_menu` (:46-69) is offered again, with "The lock's still shut. My offer isn't." (:38). "[Open it.]" on a released or traced share goes to `trusted_sells` (:73-79). She "sells the raid", the two hostile reinforcements appear in the gallery (erb:3780-3781), and she goes down the stair. `close_secure_cell` loses `zd_uk` (carryover_vars.ink:385-386), so on a secured save Netherton's "Sterling's watch paid out at five" (six_oclock.ink:410) and THE CELLS' "Zero Day's UK desk: rolled up." (erb:733) turn into another cell's lines. Her credit becomes "Sold the raid. Gone down the gallery stair." (erb:698). The confront line instead prints "Held, and opened the lock." (erb:696) for a lock she never touched.<br>• **Vos.** On `avoided` the menu (vos.ink:246-278) still sells a code card for an open door. "[Deal.]" writes `bought`, which turns `close_zero_day` from `vos_named` to `trading` (carryover_vars.ink:474-479) and removes his credit. Using Victoria's secret writes `stood_aside` and prints "Withdrew Zero Day's order. Stood aside." (erb:709) beside a card that reads "Zero Day has it." and ELSEWHERE's "Zero Day: still trading. Its broker, Pieter Vos, named."<br>R7-m1 made the share itself safe after four. These are the two outcomes left on the walkway that still move after it | victoria.ink:26-44, 183-198; vos.ink:217-244; erb:696-698, 709, 3780-3781 | Route both deals to their resting knots once the lock is open:<br>• victoria.ink `recruited`, after the default write (:29): `{outer_lock_open: -> gallery_rest}`. Give `gallery_rest` a `victoria_gallery == "refused"` arm ahead of the `else` (the `else` says "That was the deal."), e.g. "You found your own way in. I'll remember that." (**one new voiced line**);<br>• vos.ink `gallery`, after the default write (:220): `{outer_lock_open: -> vos_rest}`. His existing `else` lines ("I am waiting for a delivery…" / "My delivery was cancelled…", :290-294) cover `avoided`, so no new line.<br>Escaped and threat Victoria are left alone: `walked`, `arrested_here` and `talked_down` are still real choices after four, and their "order goes away" lines are already deferred to phase 4 (R7).<br>Check: on a save that opens the lock with the cracker, `victoria_gallery` stays `refused` and `vos_outcome` stays `avoided`; no reinforcements appear |
| R8-m2 | **On unprotected Gary's branch, Gary's pick overwrites Imran's knock-out.** Imran can be knocked out before Gary is spoken to (erb:1669-1670 write `ko`). Gary's `tech_menu` then writes Imran's outcome with no test: "Walk out with us" → `talked_round` (gary.ink:136), the card → `card_cloned` (:145), "You're coming in" → `taken_in` (:153). On "Walk out with us" the unconscious Imran speaks ("I'm ringing Farah first.", :139) after Gary's "Imran, coat." (:138). The overwritten `talked_round` then sends Farah home: she hides on entering the gallery (erb:3759), and the guards bark "Where's Farah?" (erb:3717, 3739). Imran's credit reads "Went home. So did a friend." (erb:647) or "Kept his card. Lost a copy of it." (:649) in place of "Knocked out at his bench." (:650). The ERB already keeps a knock-out against the card-cloned event (erb:1667), and Impl R1 minor 3 (erb:1668) set the rule that a settled outcome stands, so this path is the one gap in it | gary.ink:134-155 | In `tech_menu`, wrap each `~ imran_outcome = …` in `{imran_outcome != "ko": …}`. On the walk-out pick, gate Imran's line and Gary's "Imran, coat." on the same test, and give the knock-out case Gary's own line (e.g. "Right. Power room's open. I'll get Imran to the medics first.", **one new voiced line**). Check: knock Imran out, then take each of Gary's three picks. `imran_outcome` stays `ko`, Farah stays at her post, and the credit reads "Knocked out at his bench." |
| R8-m3 | **Knocking escaped Voltage out after he has stood down rewrites his stand-down and credits a cut to someone else.** erb:1679 sets `voltage_outcome: "ko"` and `cut_by_hand: true` on any knock-out of `voltage_power`. After `stood_down_print` or `talked_down` he has cut the shutter himself (voltage.ink:229-234) and stays in the room, cuffed and not `koImmune` (erb:3262-3279; `escaped_rest`, voltage.ink:252-268). A later hit then gives:<br>• his credit "Knocked out at his own switchgear. Charged." in place of "Stood down on his own thumbprint." or "Checked the sums. Stood down." (erb:657-658);<br>• at 06:00, "Next time, show me the sheet before you swing." (six_oclock.ink:233) to the man who was shown the sheet;<br>• with Static beside him, "Went down beside Voltage." (erb:666-667);<br>• because `cut_by_hand` is now true, "ROBERT VANCE: Talked 0x00 through 1960s switchgear from Teesside." (erb:678) or Elena's "On the line for the switching." (erb:681), on a night when neither said a word.<br>Voltage is the one slot-holder whose knock-out mapping ignores a settled outcome. Wendell's (erb:1677) keeps `told`, Gary's and Imran's keep theirs (erb:1669-1671), and gallery Victoria's keeps four (erb:1738) | erb:1679 | Split the mapping: `voltage_outcome: "ko"` only when `globalVars.voltage_outcome !== 'stood_down_print' && globalVars.voltage_outcome !== 'talked_down'`, and `cut_by_hand: true` only when `!globalVars.gallery_shutter_cut` (as Wendell's, erb:1678). A knock-out during a fight still writes `ko` over `fought`, as now. Not voiced. Check: stand him down on the print, knock him out. His credit still reads "Stood down on his own thumbprint.", and no Vance or Elena row prints |

No blockers or majors.

## State that changes after a decision

These are the decision globals the close reads, with every writer, and whether a later action can overwrite the player's choice. A knock-out after a decision is counted as a fair overwrite when the credit then describes what the player did; it is a finding when a line goes false.

| Global | Writers | Later overwrite? |
|---|---|---|
| `ending`, `database_outcome`, `console_choice`, `exchange_1..3`, `partial_release`, `media_story_ran`, `points_landed` | tesseract.ink only, through `core_router`, which routes on the first empty one (tesseract.ink:38-63) | No. Each is written once, in order |
| `quintero_wounded`, `wren_at_core`, `quintero_enters_core` | tesseract.ink | No |
| `hax_asked_database` | tesseract.ink database menu | No |
| `head_start_killed` | phone_agent0x99.ink:579-587, each on `head_start_killed == ""` | No |
| `share_zero_day` | erb:1696, 1697, 1735 (×3), 1737, 1753 | No, after R7 (above) |
| `share_resale`, `head_start_out` | erb:1663-1664, 1698, 1754; 1749-1752 | No |
| `ghost_sale`, `ghost_answer`, `ghost_gift` | ghost_phone.ink, behind `ghost_call_done` (:22) | No |
| `victoria_line_deal` | victoria_line.ink behind `victoria_line_done`; erb:1732 on `''` | No |
| `quintero_stance` | Netherton's briefing, once | No |
| `nightshade_taken_in`, `nightshade_deal` | nightshade.ink, behind `door_scene_done` (:34-36, `shown_close`) | No |
| `accused`, `officer_out`, `*_recalled`, `wren_held`, `sleeper_caught` | settled in R5 and R6; recalls close at `gallery_open` (phone_agent0x99.ink:85-89) | No new case |
| `kowalczyk_answer` | kowalczyk.ink, Netherton's aside, six_oclock (only on `""`, :147) | No |
| `victoria_gallery` | victoria.ink; erb:1738-1743 | **Yes, after four, recruited (R8-m1).** A knock-out after `refused` or `arrested_here` writes `ko`, which is fair: her credit and 06:00 line then describe it. The threat copy hides after `talked_down` (erb:3653), so its knock-out can't overwrite it |
| `vos_outcome` | vos.ink; erb:1740, 1744 | **Yes, after four (R8-m1).** A knock-out after any outcome writes `ko`, which is fair: "Knocked out on the walkway. Named." describes it |
| `imran_outcome` | imran.ink; gary.ink:71, 136, 145, 153; erb:1667, 1669-1670, 1672 | **Yes: Gary's pick over a knock-out (R8-m2)** |
| `gary_outcome`, `gary_ko` | gary.ink; erb:1671, 1673; `globalVarOnKO` | No (erb:1671 keeps the three picks; protected Gary reads `gary_ko` first, six_oclock.ink:243) |
| `voltage_outcome`, `cut_by_hand` | voltage.ink; erb:1679, 1682-1683 | **Yes: a knock-out after a stand-down (R8-m3).** The captured copy is `koImmune` (erb:3253), so `his_hands` and `by_hand` are safe |
| `wendell_outcome` | wendell.ink; erb:1677, 1681 | Fair: `worked_round` → `ko` reads "Floored at his own panel. Dale walked into the raid.", which is what happened |
| `asante_outcome`, `asante_ko` | asante.ink; erb:1712 | Fair: her credit tests `asante_ko` first |

## The six endings on rich, cold and mixed saves

Static traces through the ink and the card and credits source on HEAD. The user's test is whether every earlier choice lands at the close and the season ends well.

### Save by save

| Save | Close in the scene | Card and credits | Lands? |
|---|---|---|---|
| **Rich surrender** (m01–m09; Gary protected, Imran sent home; Victoria recruited and confronted before the lock; Voltage captured, his hands; m04 full; m05 arrest, list kept, funded; m06 watched; m07 Trojan Horse; Nightshade shown the file and taken in; Recruiter named; told; disclosed) | Walkabout (Quintero, Kowalczyk, Voltage, Gary); Ghost's word; numbers with the tap line; dark operations ("Sterling's line went dead at five."); the van with Nightshade; St. Catherine's season line and the memo line; "He asked who taught you. I said I did." | Card: cooperating, the vendors, "Nothing went at four.", the Austin or Albion line by `close_human`. "Took his surrender. Kept his protocol."; "Ten operations…"; Victoria "Held, and opened the lock…"; Lawson, Torres, Sorensen, Noor | **Yes** |
| **Cold lethal** (no imports; both shares out; secured) | Walkabout: Quintero, Imran, Wendell; "Two cells have it."; the order book's buyer at five; no season line; "There'll be a board. I'll be sitting next to you." | "Fired when his hand was on the key."; Vos "Named. Arrested on the walkway, waiting for a delivery."; "Zero Day: still trading. Its broker, Pieter Vos, named." | **Yes** |
| **Mixed arrest: trace at the console, lock opened with Fonoti's card, then "[Go.]" to escaped Victoria** | "Zero Day got its two hours." then "We followed Zero Day's share." | Card "Zero Day has it. We followed it."; THE CELLS "four buyers followed"; Victoria "Walked out. At large." | **Yes** (R7-m1 closed) |
| **Mixed arrest, Zero Day killed at four, Vos refused** | "The cells got nothing at four." | Vos "Named. Arrested on the walkway, waiting for a flight."; "Zero Day: got nothing tonight. Its broker, Pieter Vos, named." | **Yes** (R7-m3 closed) |
| **Join, share killed at four, Vos refused** | Citadel; Netherton's line by Gary, Voltage or Nightshade | Vos "Named. His delivery was cancelled. He caught his flight."; "Zero Day: shut out at four. Given everything by the key. Its broker, Pieter Vos, named." | **Yes** (R7-m2, R7-m3 closed) |
| **Mixed secured arrest, recruited Victoria, lock cracked, then "[Open it.]"** | Reinforcements in the gallery; at five, the order book's buyer in place of Sterling's watch | "Sold the raid. Gone down the gallery stair."; THE CELLS loses "Zero Day's UK desk" | **No** (R8-m1) |
| **Mixed arrest, unprotected Gary, Imran knocked out, then "Walk out with us"** | Imran speaks while unconscious; Farah gone from the gallery | "IMRAN SIDDIQUI: Went home. So did a friend." | **No** (R8-m2) |
| **Mixed arrest, escaped Voltage stood down on the print and then knocked out, Vance an ally** | "Next time, show me the sheet before you swing." | "Knocked out at his own switchgear."; "ROBERT VANCE: Talked 0x00 through 1960s switchgear…" | **No** (R8-m3) |
| **Rich scorched, cold executed** (R6's saves) | As R6 | As R6 | **Yes** |

### Ending by ending

| Ending | Last in-scene beat | Season line | 0x00 credit | Open |
|---|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | in `the_rest` | "Brought him out alive, in front of a court." | R8-m1, m2, m3 on those saves |
| Surrender | "He asked who taught you. I said I did." | as arrest | "Took his surrender. Kept his protocol." | as arrest |
| Lethal | "There'll be a board. I'll be sitting next to you." | as arrest | "Fired when his hand was on the key." | as arrest |
| Executed | HaX's message read in the van | none (by design) | "Fired when his hands were empty." | credits only (R8-m1 to m3) |
| Scorched | The hearing: HaX on whether she was asked | after the map line, before the suspension | "Wiped both copies. Suspended." | as arrest |
| Join | Netherton: "Find 0x00…" | none (by design) | "Pressed the key." | R8-m1 (Vos and Victoria rows), R8-m2, R8-m3 |

The scenes are finished as far as this phase can judge them statically. Every earlier mission reaches the close on every save that played it, each ending's last beat happens inside a scene, and the season is added up on the player's side wherever there is a season to add up. What is left is three local spots where a later action quietly rewrites an earlier choice.

## Rubric (ten rows)

| # | Dimension | R7 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | none | none | none (R8-m2's speaking unconscious Imran is filed under row 5) |
| 5 | Moral choices and consequences | minor | minor | R8-m1, R8-m2, R8-m3 |
| 6 | Music | none | none | none |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | minor | R8-m3 (and the knock-out half of R8-m2) |
| 10 | Bookends | none | none | none |

## Deferred to phase 4

Not findings; noted for the dialogue phase.
- **dialoguelint backlog** unchanged (no ink changed since R5): blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1.
- **Escaped and threat Victoria's order lines after four** (victoria.ink:104, 156), as R7 left them. R8-m1's routing removes Vos's ("The order goes with me", vos.ink:252) and recruited Victoria's from play after four.
- **Escaped Victoria's "[Go.]" after four** still names Fonoti and his code card (victoria.ink:113) for a lock that is already open. The line is harmless, and the state is right.

## Withdrawn, not raised, and browser checks

- **Withdrawn after checking:**
  - I suspected a wrong accusation could still be made after the core and change `officer_out` under the 06:00 walkabout. It can't in practice: the closing scene opens on `conversation_closed:tesseract`, and the hub's accusation needs `not wren_at_core and accused == ""` (phone_agent0x99.ink:84); R5 and R6 covered the rest.
  - I suspected the Victoria or Vos mapping might lose a pre-four stop to event order, because both unlock the core in the same conversation. It doesn't (R7 table above).
  - I suspected `vos_outcome` could stay `''` and leave ELSEWHERE naming a Vos with no credit row. Walking into the core leaves the gallery, so erb:1744 writes `avoided` first.
- **Not raised:**
  - **Knock-outs that overwrite Vos's, Asante's, Wendell's `worked_round` or Victoria's `refused`/`arrested_here`.** The credit and 06:00 line then describe what the player did, so nothing reads false.
  - **"Your first week, you took your hand off a button. Tonight you did it again."** on lethal and scorched. Every non-Join ending has `console_choice` `stopped`, so the player didn't press the key; the line holds.
  - **"Given everything by the key."** reads cleanly after "shut out at four.", and nothing else in the credits names a time for the key.
- **For the orchestrator (not a finding):** R8-m1 and R8-m2 as written add two short voiced lines (one Victoria, one Gary). Both can be avoided: route recruited Victoria to an unvoiced `Narrator:` beat, or keep Gary's line and gate only Imran's. That is the fixer's call. Record them in `FINALE_TTS_COUNT.md` if added.
- **Browser checks for the fixer** (keyless :3001):
  - recruited Victoria: crack the keypad, then talk to her. Only the resting line is offered, `victoria_gallery` stays `refused`, and no reinforcements appear;
  - Vos: open the lock with Fonoti's card, then talk to him. Only `vos_rest` plays, and `vos_outcome` stays `avoided`;
  - unprotected Gary: knock Imran out, then "Walk out with us". `imran_outcome` stays `ko`, Farah stays at her post, and Imran says nothing;
  - escaped Voltage: stand him down on the print, then knock him out. `voltage_outcome` stays `stood_down_print`, `cut_by_hand` stays false, and on an m04 Vance-ally save no Vance row prints.
