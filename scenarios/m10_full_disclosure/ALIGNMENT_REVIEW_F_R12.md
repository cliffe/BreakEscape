# m10 Full Disclosure: alignment review, round 12 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only for game files. I worked the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R11, CONTRACT §11 (rounds 1 to 11) and the finale brief. The tree is HEAD c2ba82f1. The R11 fixes are c2ba82f1 alone (467fe366..HEAD also holds an SE-lab commit and an AGENTS.md commit, neither touching m10). m10 has no uncommitted changes. No VM material was opened. Scratch files are in the session scratchpad's `m10_r12/` (R11's folder copied, plus `tagsplit.cjs`, `midreply.cjs`, `left_in_place.cjs`, `endings.mjs`, `presets.json` and `fixtry/`).

What I ran:
- **Compile check.** I recompiled `six_oclock`, `gary`, `imran`, `victoria` and `voltage` with `bin/inklecate` into scratch and compared the JSON with the committed files: identical. No m10 `.json` is older than its `.ink`.
- **Validator** (`--skip-ink --no-graph`): 0 errors. The same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`), the cutscene `onceOnly` advisories and the imported-condition advisories as R11, with nothing new.
- **Engine reading** for item 2: `person-chat-pending-reply.js`, the 4af6a328 diff of `person-chat-minigame.js`, `ink-engine.js` `continue()` (one visible line per call, tags of empty lines carried onto it), `chat-helpers.js` (`hostile`, `clone_keycard`), `npc-conversation-state.js` (the card variables) and `interactions.js` (where the cloner can start).
- **Tag-split scan** (`tagsplit.cjs`, new): every person-chat ink and entry knot, 150 import presets, five picks deep. For each pick it lists the state tags that land on a visible line after the reply's first, which the new flush doesn't cover.
- **Reload-mid-reply simulator** (`midreply.cjs`, new): pick, show line 1, reload (ink variables kept, position lost), talk again.
- **Endings simulator** (`endings.mjs`, new): all six endings on a rich, a cold and a mixed save, through the closing scene(s), then the card and credits through `closing-sequence.js` `expandCredits` on the re-rendered scenario.
- **R11's reopen sweep** (`sweep.cjs`) and **reload sweep** (`reload_sweep.cjs`), re-run on HEAD.

## Counts and verdict

**0 blockers, 0 majors, 3 minors** (open).

Both R11 findings are closed, and so is the hostility record fix. The three new minors have concrete new reasons. One is a branch no earlier round traced; two come from the engine change, which makes a reply's first line the one safe place for a state tag.
- **R12-m1.** Imran's `card_cloned` 06:00 line ("You copied my card while I was talking…") and his credit ("Kept his card. Lost a copy of it.") are false on the only save that writes `card_cloned`: Gary left in place, whose card the player copied, with Imran following Gary.
- **R12-m2.** Since 4af6a328, an Esc during Voltage's fight reply arms Voltage alone. Static never fights but is credited "Went down beside Voltage."
- **R12-m3.** Victoria's confronted reply and Vos's secret reply unlock the core on their second line. A reload mid-reply keeps the outcome and leaves the door shut.

**Verdict: another round needed (phase not complete; 3 minors).** None needs the user. R12-m1 is one ink condition, one deleted voiced line and one unvoiced credit. R12-m2 and R12-m3 move tags with no line changes. Outside these, every save I traced lands each earlier choice at the close, and the season adds up from the player's side.

## R11 findings: closed or not

Both are closed, and so is the record fix.

| R11 | Status | Evidence, and what I checked for new problems |
|---|---|---|
| m1 Gary's and Imran's 06:00 lines | closed | six_oclock.ink:261 "Nobody's problem all night. Same as St. Catherine's." and :276 "Left me to it all night. Same as the board." Both are in the compiled JSON. Gary's `else` arm is reached only by an unprotected Gary whose outcome is `avoided` or `""` (`gary_here` at :50 drops `left_in_place`; `talked_round`, `taken_in` and `ko` have arms above it). Each of those is a Gary nobody settled, whether or not the player heard him out, and it agrees with his own record: he was the "overhead" at St. Catherine's (gary.ink:88), not a man whose case was decided. Imran's `else` arm is reached on `avoided` or `""`. "Left me to it" holds whether or not he was heard, and "the board" is the one that left the team's warning unread (imran.ink:38). On the cold save the line follows "We told the board, in writing. Nobody read it." and lands |
| m2 Imran's credit repeating Gary's | closed | erb:652-653 "Still at his bench." (Join) and "Still at his bench at six, under his own sheet." On the unprotected-Gary `avoided` save the rows read "GARY WHITLOCK: Left at his bench." then "IMRAN SIDDIQUI: Still at his bench at six, under his own sheet."; on Join "Left at his bench." then "Still at his bench." They no longer repeat. `credits_sections.json` doesn't carry the rows |
| Record fix (hostility comments) | done | voltage.ink:213 and victoria.ink:181 now say a reload keeps hostility and a Restart after a knock-out calms it; CONTRACT §11's R10-m4 bullet carries the corrected reason, and the round-11 block records all three changes |

## The engine change (4af6a328) against earlier judgements

**What the flush covers.** After a pick, `makeChoice` runs `InkEngine.continue()` once, so the "pending reply" is the reply's first visible line plus the tags of any empty lines before it. On a close, a jump or a page unload, its state tags are applied (`_flushPendingReply`, person-chat-minigame.js), and the display path then skips them, so nothing in the engine runs twice. Three tags stay out: `exit_conversation`, the presentation tags, and `clone_keycard` / `give_npc_inventory_items`, which open minigames. Tags on the reply's second and later lines are not covered. On a same-session reopen they still run, because the saved story sits after line 1 and resumes mid-knot. On a reload or a Restart they are lost, because only ink variables come back.

**No double application in m10.** m10 uses `exit_conversation`, `hostile` (23), `give_item` (14), `set_global` (11), `unlock_door` (7), `complete_task` (4) and `clone_keycard` (3). I read each placement:
- Every `give_item` on a reply is paired with a `~` flag written before it (`fon_card_given`, Vos's `vos_outcome`, Nightshade's `ns_paid` / `nightshade_deal`, Vector's `vec_code_given`), and the flag stops the offer coming back. The flush gives the item once, where before an Esc in the 1.5 s gap left the flag set and the item missing. Ghost's and HaX's gifts are phone threads, outside the change.
- `hostile`, `unlock_door` and `complete_task` are idempotent (`setNPCHostile` on an already hostile NPC changes nothing).
- The guards' `#hostile` replies (guards.ink:46-213) used to leave a guard passive at `fight` after an Esc in the gap. They now turn as picked. That is a fix, not a conflict.
- The re-entry tags written for the Restart path (Victoria's `threat_missed`, victoria.ink:182, and Voltage's `fought → fight`, voltage.ink:214-216) sit on entry lines, not replies. The flush never reaches them, and repeating `hostile` is harmless.
- The closing scenes' `set_global` tags sit on later lines of `disableClose` scenes. The one first-line case is scorched's `#set_global:six_done:true` (six_oclock.ink:571). A reload in the gap now saves `six_done`, and the hearing's `game_loaded` backstop (erb:2333) opens the hearing instead of replaying the 06:00 scene. That is the designed route, and it costs one line ("I wanted to do the same…").

**Earlier judgements that change.** Two do. R11 left tag placement on replies uncounted ("Every R10 fix puts its state writes as `~` assignments…"). Now that the first line is the safe place for a tag, the tag-split scan finds three replies that keep a state tag on a later line:
- `m10_voltage.ink` `fight`: Static's `#hostile:static_power` (:285) follows Voltage's first line. Here the engine change makes things worse: an Esc in the gap now arms Voltage alone (**R12-m2**).
- `m10_victoria.ink` "[Before you touch that lock…]" (:58) and `m10_vos.ink` "[Your second buyer…]" (:60): `#unlock_door:core` is on the second line. A reload mid-reply leaves the outcome written and the door shut (**R12-m3**).

The `clone_keycard` exclusion is a third case, but it isn't counted. An Esc in the gap after Gary's or Imran's card pick records the decision and never opens the cloner, and the ink doesn't offer the clone again. It behaved the same way before 4af6a328, the exclusion is deliberate, and the door's bark points to the fitter's locker (erb:1667, lockpick). It is listed for the orchestrator below.

## Severity table (new findings)

No blockers or majors.

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R12-m1 | **Imran's `card_cloned` 06:00 line and credit are false on the only save that writes `card_cloned`.** Nothing in m10 clones Imran's own card. Neither his ink nor any generic route can: an NPC's card is cloned only through a `#clone_keycard` tag in conversation, and the cloner's own entry points (interactions.js:798-829, 966-981) clone inventory cards. His one clone tag, `imran_taken` (imran.ink:106), runs after `imran_outcome = "taken_in"`, which HaX's `card_cloned` mapping excludes (erb:1668). So the only writer of `card_cloned` is **Gary's** "[Stay where you are. I'll take a copy of your card.]" (gary.ink:149-154). It copies Gary's card (`rfidCard` "Power Room Card, Gary Whitlock", erb:3049) and sets Imran's outcome to match, and Imran's own line agrees: "Gary's staying, so I'm staying. You've had your copy of the card." (imran.ink:153). At 06:00 Gary is left out on `left_in_place` (six_oclock.ink:50), so Imran is offered instead (:51, :71). He then says "You copied my card while I was talking. I'd have handed it over if you'd asked." (:272), to a player who never spoke to him and copied someone else's card. The credits add "IMRAN SIDDIQUI: Kept his card. Lost a copy of it." (erb:649) beside "GARY WHITLOCK: Still on their payroll. Still shipping nothing." Proved in `left_in_place.cjs` (any save with m02 played, Gary unprotected and the hospital not exposed). It is the workshop pair's last word on this branch, so the player's decision to leave Gary in place comes back as an untrue line | six_oclock.ink:51, 271-272; scenario.json.erb:649 | Treat `card_cloned` as "stayed at the bench with Gary", which is what it means. Keep Imran off the walkabout where Gary is: `~ temp imran_here = imran_outcome != "talked_round" and imran_outcome != "card_cloned"` (he stays where Gary stays). Then delete the dead :271-272 arm, one voiced line fewer. Change the credit to "Stayed at the bench with Gary. Still on their payroll." (unvoiced, ERB only). Optionally drop HaX's unreachable `card_cloned` mapping (erb:1668) and the matching R9 comment (imran.ink:76), or leave them as harmless |
| R12-m2 | **After 4af6a328, an Esc during Voltage's fight reply arms Voltage and leaves Static standing.** "[Step away from the board. Now.]" goes to `fight`. `#hostile:voltage_power` is on the reply's first line (:282-283) and `#hostile:static_power` on the second (:285-286). An Esc in the 1.5 s gap now flushes the first and drops the second. Voltage turns hostile, and once hostile he can't be talked to (a click starts combat), so the ink never re-arms Static. Static stays passive all night with "Talk to him. From there." (static.ink:14), and a reload or Restart keeps it that way. The credits still say "STATIC: Went down beside Voltage." (erb:667) for a man who never fought. Before the engine change the same Esc left both calm, and talking to Voltage re-armed both through `escaped` → `fight`. Proved in `midreply.cjs` | m10_voltage.ink:279-287 | Put both tags on the first line: open `fight` with `{m04_static_left and not m04_static_left_alone: #hostile:static_power }` before `#hostile:voltage_power`, and keep Static's "Not past me." in its own conditional after Voltage's line. Tried on a scratch copy (`fixtry/`): the first line then carries both tags, so the flush arms both, and a Restart re-arms both. No line changes |
| R12-m3 | **Victoria's and Vos's "the door is open" replies unlock on their second line, so a reload mid-reply keeps the outcome and leaves the core door shut.** "[Before you touch that lock…]" writes `victoria_gallery = "confronted"` and then shows "Then you know I'm hedging." The unlock (:58) is on "Open. And the order's withdrawn." Vos's "[Your second buyer…]" writes `vos_outcome = "stood_aside"`, shows "Who told you that…", and unlocks on "The door is open." (:60). After a reload (or a Restart) between the two lines, both route straight to their rest lines ("You've seen what I'd have done. Go in before I think about it again." / "I said I am leaving. I meant it."), and the outer lock is still shut. The player can still crack the PIN, so it isn't a dead end. But they were told the door is open, and the credits say "Held, and opened the lock." / "Withdrew Zero Day's order. Stood aside." Same-session reopens are fine (the reply resumes mid-knot). Proved in `midreply.cjs` | m10_victoria.ink:55-62; m10_vos.ink:56-64 | Move each `#unlock_door:core` above the reply's first line (Victoria :57, Vos :59), so the flush covers an Esc and the tag runs before any reload window. Tried in `fixtry/`: line 1 then carries `unlock_door:core` in both. The door opens a beat before "Open." / "The door is open."; if that order matters, keep the tag where it is and add `{victoria_gallery == "confronted" and not outer_lock_open: #unlock_door:core}` to the rest knot's entry line instead (and the same for Vos), as R10-m4 did for Victoria's hostility. No line changes |

## Reopen, Esc and reload sweeps

## The endings on rich, cold and mixed saves

`endings.mjs` plays each closing scene from `start`: the first option at each menu, and walkabout picks in offer order up to the cap. It then prints the card and credits through `expandCredits` on the re-rendered scenario. The three saves (`presets.json`):
- **Rich**: m01-m09 played. Gary protected; Victoria recruited and confronted; Voltage captured and his hands; m05 turned; m06 seized and watched; m08 triple agent; m09 file shown, Recruiter named and told; Nightshade taken in; Kowalczyk caught and held.
- **Cold**: no imports; Imran and Wendell avoided.
- **Mixed**: m02, m03, m04, m07 and m09 played. Gary unprotected and left in place; Victoria escaped with the threat, then knocked out; Voltage escaped and fought; m09 double-cross and denied; Malhotra wrongly sent back; Quintero wounded.

The user's test is whether the player feels every earlier choice land and the season wraps up.

| Ending | Rich | Cold | Mixed |
|---|---|---|---|
| Arrest | Quintero's Helena line, Kowalczyk's bench and cracker lines, Voltage's "gave me my hands back", Ghost's "Clean. I noticed.", the bait's buyers, "Sterling's watch paid out", Nightshade at the van window, the Denver and memo season lines, HaX's Reading line. Credits: 0x00 first with the told row and "Ten operations", then every person by outcome, the cells, Lawson and Torres, Elena, Billings. **Lands** | The walkabout is Quintero, Imran ("Left me to it all night. Same as the board."), Wendell. Then the numbers, the order book's buyer, the van, "I said no." Credits: Imran "Still at his bench at six, under his own sheet." **Lands** (R11-m1, m2 closed) | Quintero's stretcher, Kowalczyk's "Eleven years", Malhotra's headset line; Ghost's and the Recruiter's texts; "Two cells have it"; the forty-seven denied. **Fails at Imran**: "You copied my card while I was talking" if picked, and "Kept his card. Lost a copy of it." in the credits (**R12-m1**) |
| Surrender | As arrest, plus "There will be no trial.", the couriers and quartermaster, the disclosed beats ("Sterling's line went dead", "Torres stopped sending"), "He asked who taught you." **Lands** | The protocol lines and the disclosed fallbacks. **Lands** | As arrest; R12-m1 |
| Lethal | "He reached. I will put that first." and the martyr line, then as surrender without the van. **Lands** | **Lands** | As arrest; R12-m1 |
| Executed | The screen, the numbers, the dark operations, "Take 0x00 to the second van", HaX's message read in the van. Credits under "IN CUSTODY". **Lands** (hard, by design) | **Lands** | R12-m1 in the credits only |
| Scorched | "Nobody holds the map now", season lines, the suspension, then the hearing: HaX's "one man with a memory", the Reading, "I said it was yours." **Lands** | "I'll tell them I wasn't asked." **Lands** | The forty-seven moves to the hearing, as designed. R12-m1 in the credits |
| Join | Citadel: HaX's "0x00.", Netherton's priority line ("Whitlock came to the table…"), the casualty count. **Lands** (hard, by design) | **Lands** | R12-m1 in the credits ("Kept his card…") |

Two saves outside the table, from this round's findings:
- **Escaped Voltage fought, Esc in the reply gap** (any ending). Static never fights but is credited "Went down beside Voltage." (**R12-m2**).
- **Recruited Victoria confronted, or Vos's secret used, then a reload mid-reply.** The door the player was told is open is shut; the close itself reads correctly once the player cracks the lock (**R12-m3**).

Read afresh as a whole, the close still does what the user asked. Each earlier mission has a voice at the core (the records and the exchanges), at 06:00 (the walkabout, the numbers, the season lines, HaX's "the rest") and in the credits, person by person. Join and executed end hard, on purpose. I checked a few settled beats for a new reason to reopen them and found none: Victoria's confronted pair ("The Zero Day tap went dark at five. She will have sold that too." beside "Sterling's watch paid out"), the cold save's "Jennifer Walsh's cell: stopped at Austin." and Kowalczyk's double-cross row on Join.

## Rubric (ten rows)

| # | Dimension | R11 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | none | minor | R12-m2, R12-m3 (tag placement under the new flush) |
| 5 | Moral choices and consequences | minor | minor | R12-m1 (leaving Gary in place comes back as a false line) |
| 6 | Music | none | none | none |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | none | none (R12-m2 is an Esc case, not a knock-out one) |
| 10 | Bookends | minor | minor | R12-m1 (the credits row), R12-m2 (Static's row) |

## Deferred to phase 4

Not findings; noted for the dialogue phase.
- R11's list stands:
  - the pitch replayed from "All four. Good." on a reopen at `case` before `tess_case_step` is set;
  - Wendell's "*pause* Well. Which switch do you want." on an Esc;
  - Imran's repeated opener after Gary is knocked out;
  - R9's items (Vos's "waiting for a delivery" after four, Victoria's order lines after four, Fonoti after the lock, single-line first meetings after the lock, the dialoguelint backlog);
  - Static's "Talk to him. From there." after a Restart that followed a fight.
- Gary's "Nobody's problem all night. Same as St. Catherine's." is true but has a weaker echo than the old "nobody listened". If phase 4 wants it back, "Nobody listened all night either. Same as St. Catherine's." is false for a player who heard him out, so any reword has to hold on both readings of `avoided`.
- If R12-m3 is fixed by moving the tags, the door opens a line before Victoria says "Open." and Vos says "The door is open." Phase 4 may prefer the rest-knot guard.

## Not raised, and notes for the orchestrator

- **Not raised:**
  - **`clone_keycard` under the flush.** Gary's "[Stay where you are…]" and "[You're coming in, Gary.]" (gary.ink:154, 164) and Imran's `imran_taken` (imran.ink:106) put the clone on the reply's first line. The engine excludes it from the flush on purpose, because it opens the RFID minigame. So an Esc in the 1.5 s gap records the outcome and gives no card, and the ink never offers the clone again. That was already true before 4af6a328. The power-room door's bark names the fitter's locker (erb:1667), which takes the lockpick, so the player isn't stranded. This is engine-wide: an engine follow-up could queue an excluded minigame tag to run after the close, instead of dropping it.
  - HaX's `card_cloned` mapping (erb:1668) can't fire, as shown under R12-m1. It is harmless; the fixer may remove it with R12-m1.
  - The seven lines the reload sweep loses (Tesseract, Voltage, Wendell), as in R10 and R11. No state or carry-over is lost.
  - The validator's standing warnings and advisories (unchanged from R11).
- **For the orchestrator:**
  - **Engine background, for later rounds and m09.** The flush covers a reply's **first visible line** only (`makeChoice` → one `continue()`). Tags on later lines of a reply survive an Esc (a same-session reopen resumes mid-knot) but not a reload or a Restart. `clone_keycard` and `give_npc_inventory_items` are never flushed. A lint for "a state tag after the first line of a reply whose earlier lines write state with `~`" would catch R12-m2 and R12-m3; `tagsplit.cjs` is a starting point.
  - **Voiced delta**, if the fixer takes R12-m1 as written: one Imran line (six_oclock.ink:272) deleted and nothing new. R12-m2 and R12-m3 move tags only.
- **Browser checks for the fixer** (keyless :3001):
  - m02 played, Gary unprotected, "[Stay where you are…]", then arrest: Imran isn't offered at 06:00, and the IMRAN row reads the new line.
  - m04 escaped with Static: "[Step away from the board. Now.]" then Esc at once. Both Voltage and Static turn hostile.
  - Recruited Victoria: "[Before you touch that lock…]", reload while "Then you know I'm hedging." is on screen. The core door is open after the reload. The same for Vos's secret.
- **Static proof:** `m10_r12/` in the session scratchpad: `left_in_place.cjs`, `midreply.cjs`, `midreply_fix.cjs` with `fixtry/` (the tag moves tried on scratch copies), `tagsplit.cjs`, `endings.mjs` with `presets.json`, and the re-run sweeps.
