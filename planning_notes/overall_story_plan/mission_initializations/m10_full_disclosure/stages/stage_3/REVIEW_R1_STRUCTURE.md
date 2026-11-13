# m10 stage 3, review round 1: structure, state and consistency

## Scope and method

Reviewer: fresh, read-only, lens "structure, state and consistency". "MC" is `stage_3/moral_choices.md` (785 lines). Also read: `docs/agents/FINALE_BRIEF.md`; `.claude/skills/mission-puzzle-chains/SKILL.md`; `docs/agents/CARRY_OVER_PLAN.md` §2.6–2.7 and "Built"; `finale/FINALE_ARC.md` ("FA") §3, §4, §6, §13, §15; m10 `stage_1/story_arc.md` ("SA", by section and grep); m10 `stage_2/storytelling_elements.md` ("SE", by grep); m09 `stage_3/moral_choices.md` ("m09 MC", the working copy, which is mid-revision) and its `REVIEW_R1_STRUCTURE.md`; `scenarios/FINALE_DEV_LOG.md` for the orchestrator's rulings and the user's F12/F13 answers.

Shipped facts checked: every `exportGlobals` block in `scenarios/m0*/scenario.json.erb`; the existence of each ✱ name the choices read (all present in their source's erb); the set values of `victoria_fate`, `team_assignment`, `debrief_stance`, `mercer_fate`, `elena_outcome`, `ghost_deal_*` in the shipped ink; m08's Nightshade fate (`m08_nightshade_confrontation.ink:7`, "Sets nightshade_arrested XOR triple_agent", and the KO safety net at `m08 scenario.json.erb:1050–1056`). Engine: `systems/apply-actions.js` (action types), `systems/objectives-manager.js:685–720` (`unlockCondition` is an aim gate), `minigames/helpers/chat-helpers.js:501,584` (ink `#set_global` emits `global_variable_changed`), and a search of `public/break_escape/js/systems/` for a KO-immunity flag and a security-camera mechanic (neither found). No VM material opened.

F12 and F13 are user-approved (dev log L176) and are not re-argued; the review checks that m10 carries F13 consistently.

## Summary

The branching is sound at the level of choices: every forced choice has a lock or an event, nothing an import sets is in a gate, the six endings are reachable from every save, and the operations list always has two names. The state underneath has gaps:

- **One dead end.** On the kept-not-shown Nightshade branch, an unchecked payment puts the door scene's last choice past the breach that waits on it (S3-01).
- **Forced scenes don't cover knock-outs, walk-aways or replays.** No KO safety net for the door scene, no KO-proof list, no resume rule for the core, and `points_landed` as a counter can be inflated by a replayed exchange (S3-02, S3-11). The kept-deal Ghost's side door may bypass the new stair lock (S3-03).
- **Outcome globals that can stay empty** when the player sneaks past a slot-holder, and an accusation state that can't hold two wrong accusations or a knocked-out officer (S3-04, S3-05).
- **Counting.** The operations guarantee leans on one item whose meaning changes by Ghost's branch; cells can be rolled up two or three times by different sources (S3-06, S3-07).
- **The m09 handover is one ruling behind.** P21 adopts the arrested-branch help m09 is dropping; P8's counts miss `legacy_files_saved` and the `deck_pulled` tier move; the Alpha-tapes warning still takes WREN before Tesseract refuses her (S3-08, S3-09).
- **Conclusion.** Nothing ties the conclusion to `ending` being set (S3-12).

Counts: **1 blocker, 11 majors, 10 minors.** Change verdicts: accept 21, modify 7, reject 0.

## Findings

### S3-01 (blocker): the kept-not-shown door scene ends after the breach it unlocks

- **Location:** MC:57 (§3.1 "Forced"), MC:72–80 (the not-shown branch), MC:638 (`door_scene_done`, "last choice of the door scene, every branch").
- **Evidence:** MC:57: "the gate's breach at 02:30 waits on flag 1 and `door_scene_done`, which each branch sets on its last choice." MC:73: the cuff-or-leave decision comes "once the lie is out (at the table if checked, or on the line at the locked door if not)". The locked door is the tunnel's inner door, which is past the breach (SA §5.3, MC:72 "the tripwire at that door").
- **Problem:** on the unchecked path the scene's last choice sits on the far side of the gate it opens. Built to the letter, the breach never opens and the run dead-ends at the forward post on a reachable branch (triple agent, file held, payment not checked, which is also the default for any m08-triple-agent player who skipped m09). The check itself is "a player action at the table, not a menu pick" (MC:72), so the scene has no explicit closing choice on that path either.
- **Fix:** split the branch into two state events. `door_scene_done` is set by an explicit closing choice at the table on every branch (Netherton: "Time." / [Let's go.]), after the payment is handed over; the check is available until then. The cuff-or-leave decision on the unchecked path is a separate, optional beat on HaX's channel at the locked door, defaulting to "leave" (as MC:80 already says). Better still, see simplification 1: on the unchecked path there is no menu at all.

### S3-02 (major): a knock-out in a forced scene leaves its done-flag unset

- **Location:** MC:18 (rule 1.4, "Every scene keeps a way through by knock-out"), MC:57, MC:104, MC:636–640.
- **Evidence:** rule 1.4 promises a knock-out route in every scene. Nothing in §3.1 or §12 says what a knock-out of Nightshade (at the table, cuffed or uncuffed) does to `door_scene_done`, `nightshade_cuffed`, `nightshade_deal` or `nightshade_tethered`. m08 had exactly this hole and fixed it with an `npc_ko` safety net that sets the fate and the done-flag (`m08 scenario.json.erb:1050–1056`, "lesson 37"). The engine has no KO-immunity flag (search of `systems/` for any KO-proof key finds none), so "can't be knocked out" (FA §4.1, Tesseract) is itself a build item.
- **Problem:** knocking Nightshade down before his last choice blocks the breach. The same holds for any NPC whose conversation sets a value the route or a later read depends on: Netherton at the briefing (C1's cutscene is safe; the door scene and the database line are not if he is a placed NPC), Tesseract before the choices, Kowalczyk at the forward post before the breach (she breaches).
- **Fix:** add one rule to §1: every forced face-to-face scene either has an `npc_ko` mapping that writes its defaults and its done-flag (m08's pattern), or its NPC is KO-proof, listed by name. Proposed KO-proof list: Netherton, Tesseract (until step 5), Nightshade at the door, Malhotra. KO-able with a mapping: the raid team, each slot-holder, Asante, Mercer. Add the done-flag write to each mapping in §12.

### S3-03 (major): the kept-deal side door may bypass the stair lock

- **Location:** MC:104 ("Forced: the stair down ... opens on `ghost_call_done`"), MC:106 ("Ghost has refused to sell and opens the east door. Then: 'Did the board ever thank you?'"), MC:114; SA:240 ("The side door (past the office's back corridor)"); SE:423.
- **Problem:** the door opens on Ghost's first line, before the stance question. If the side door leads anywhere but back into the security office, a kept-deal player can close the call and walk through it with `ghost_call_done` false and `ghost_answer` unset, which defeats U1's fix and leaves Ghost's 06:00 text without a value. SA does not say where the door goes.
- **Fix:** either open the east door on `ghost_call_done` (Ghost: "The east door's yours when you've answered."), or state in §3.2 that it opens into the office's back corridor, which joins the same stair. The first is simpler and keeps the stance forced.

### S3-04 (major): several outcome globals can stay empty, and the readers have no empty branch

- **Location:** MC:170 (`imran_outcome`, `gary_outcome`), MC:205 (`voltage_outcome`, `wendell_outcome`), MC:265 and MC:668–669 (`victoria_gallery`, `vos_outcome`), MC:663 (`asante_outcome`), §10 rule 4 (one credits clause per person met).
- **Evidence:** C5 can be passed by the old service hatch without speaking to anyone (MC:35, MC:143); the gallery's lock can be picked the long way past a slot-holder the player never addresses (MC:211); a captured Voltage can be knocked out (rule 1.4) but `voltage_outcome` has no `ko`; on the unprotected-Gary branch "Imran follows whatever Gary does" (MC:162) with no mapping to `imran_outcome`'s values. `victoria_gallery = arrested` covers both "escaped, then [You're under arrest.]" (MC:239) and, apparently, the m03-arrested branch (MC:243–265 never sets a gallery value for it).
- **Problem:** each of these leaves `""`, and the 06:00 walkabout, the credits clause and (for `victoria_gallery`) the Zero Day share all read them. The head-start rule (MC:630) treats `""` as "order stands", which is right, but the credits and walkabout have no line for someone the player walked past.
- **Fix:** apply the phone rule's first-line default to every slot scene: the scene's first line sets a value (`avoided` for Imran, Gary, Wendell, Vos and recruited Victoria; `untouched` for Asante); a room-exit mapping sets the same if the scene never opened. Add `ko` to `voltage_outcome`. Give Imran on the unprotected branch his own mapping (`talked_round` → `phone_left`; `left_in_place` → `card_cloned`; `taken_in` → `taken_in`). Split `victoria_gallery` into `arrested_here` (escaped, cuffed to the rail) and leave the m03-arrested branch on `vos_outcome` alone.

### S3-05 (major): the accusation state can't hold what the rules allow

- **Location:** MC:297–301 (wrong accusations repeatable; knock-out holds an officer at the forward post), MC:521 and §8.2 (Quintero on a stretcher), MC:673–674 (`accused`, `officer_out`).
- **Evidence:** "Repeat accusations are allowed; each wrong one costs that officer" (MC:301). `officer_out` is "the name of an officer sent back and not recalled" (one string). `accused` keeps "the last named". No global records a raid member's knock-out, yet MC:301 says it "costs an epilogue line" and a knocked-out Kowalczyk "can't act at the core" (FA:603). Quintero's wound (§8.2, the stretcher) and the cold ending's weapon-taker (MC:541) read "WREN reached the core and HaX had no warning" and "if she is wounded or gone", with no global for either.
- **Problem:** two wrong accusations overwrite each other, so the first officer's job silently comes back; the WREN beat at the core can't tell a held Kowalczyk from a free one; the 06:00 stretcher has nothing to read.
- **Fix:** replace `officer_out` with one bool per officer (`malhotra_out`, `arakawa_out`, `quintero_out`, `vector_out`, `phantom_out`), cleared on recall; keep `accused` for the right one only (`kowalczyk` or `""`). Add `<name>_ko` for each raid member through `globalVarOnKO` (`systems/npc-hostile.js`). Add two derived locals set at the WREN beat: `wren_at_core` (bool) and `quintero_wounded` (bool). Alternatively cap it: one wrong accusation live at a time (a second one is refused by HaX until the first is recalled), which keeps a single string; see simplification 6.

### S3-06 (major): the "always two operations" guarantee rests on one item whose meaning shifts by Ghost's branch

- **Location:** MC:379–388 (§6.5), MC:135 (the bait's catch), MC:612 (§11 item 34).
- **Evidence:** MC:388: "There are always at least two: 5 always applies, and 6 is gone only when 1 applies." Item 5 is "the watch on Ghost's buyers (every player: Ghost was selling tonight on every branch, or had buyers to refuse)". On the bait branch with the head start stopped, those buyers are already "Five buyers, and we have their names. One more cell on the closing card" (MC:135).
- **Problem:** (1) On a cold start, items 1–4 never apply (no recruited Victoria, no m08, no m06, no m09), so the list is exactly 5 and 6. (2) Where the bait caught the buyers, item 5 is spent: securing it then "rolls up a cell" that the bait already rolled up, and disclosing "burns" a watch that already paid out. (3) On the kept, refused and talked-out branches Ghost never sold, so "Ghost's buyers" are people who asked and were refused; HaX can name them only if flag 2's schedule shows the orders. The guarantee holds arithmetically but not in story.
- **Fix:** define item 5 independently of Ghost: "the watch on the early-access buyers", the people who ordered the head start, read off flag 2's schedule (every player reaches flag 2). It survives the bait (the bait names the five who paid Ghost; the watch follows the rest of the order book). Then the guarantee is true on every save without depending on Ghost's branch. Also say in one line whether `vos_secret_used` costs the Zero Day tap (Vos is one of the tapped brokers, FA:523); if it does, item 6 is gone on that branch too and the guarantee still holds through items 5 and the next.

### S3-07 (major): no single ledger for the cells rolled up

- **Location:** MC:135 (bait: "one more cell on the closing card"), MC:247 (Victoria's deal: "a Zero Day desk rolled up in the credits"), MC:392 (Secure: "the first rolls up a cell before the credits"), MC:612 (surrender's two cells: Zero Day, Ghost's buyers, the m07 cells, Zero Day again, Critical Mass), MC:581 (the card's cells line, "a count and one name").
- **Problem:** five sources can each roll up a cell, and three of them can name the same one. A secured, surrendered, bait-and-stopped save can roll up Ghost's buyers three times and Zero Day twice; the card's count then either double-counts or quietly drops a payoff the player was promised in a line.
- **Fix:** one derivation, owned by stage 4, applied once at the ending: an ordered list of the night's cell sources (bait catch, Victoria's book, Secure's first operation, surrender's protocol, the m07 cells by m07's rule); each source takes the first cell not already taken, and if none is left it takes the next in a fixed fallback order (Critical Mass, then the Recruiter's network on `named`). State the order in §10 and point surrender's rule (§11 item 34) at it.

### S3-08 (major): m09 handover out of step: arrested-branch help, export count, tiers, legacy files

- **Location:** MC:685, MC:746 (P8, "m10 66 variables; m09 exports ten"), MC:764 (P21, "Its optional arrested-branch help ... is accepted"), MC:494 (§7 `cage_bin` row), §7 (no `legacy_files_saved`), §7 `deck_pulled` row (MC:492).
- **Evidence:** dev log L167: the orchestrator accepted "new exports `cage_bin`, `legacy_files_saved` (m09 → 11 exports) and `m09_deck_pulled` to m10 tier 1"; L169: "drop the arrested-branch help". m09 MC:538 and :564 give m10's resulting tiers; m09 MC:568 gives `legacy_files_saved` an "Elsewhere" clause that only m10 can carry. FA §15 still puts `m09_deck_pulled` in Tier 2 ("Arc-keeper's call").
- **Problem:** P21 adopts a mechanic m09 is removing; P8's counts are one export and one import short and leave `deck_pulled` in Tier 2 although its service-door warning (MC:371) is an H (it changes who is hurt), which FA §3 puts in Tier 1.
- **Fix:** P21: reject the arrested-branch help; on `nightshade_copy` keep only the door line. P8: m09 exports eleven; m10 imports 67 (Tier 1 39 with `m09_deck_pulled` moved up; Tier 2 28 with `m09_cage_bin` and `m09_legacy_files_saved` added) plus nine `completed`. Add a §7 row for `legacy_files_saved` (its "Elsewhere" clause) and point FA §15's tier note at the ruling.

### S3-09 (major): the Alpha-tapes warning takes WREN at the door, which m09 has withdrawn

- **Location:** MC:371 (§6.4), MC:492, MC:607 (§11 item 25).
- **Evidence:** MC:371: "Quintero comes in from the lock early and takes WREN at the door unhurt (m09 stage 3 §3.2)." m09 MC:23 (revised): "so Quintero takes WREN unhurt after Tesseract has refused her". The m09 structure review (S3-04) showed that taking her at the door loses his refusal, "Not you, Halina ... It has to be one of theirs." (FA:605), his motive in his own mouth, for exactly the player who earned the payoff; the orchestrator ruled "keep Tesseract's refusal of WREN" (dev log L169).
- **Problem:** m10 as written still cuts the refusal; it also has no case for a player with no Quintero (held, sent on a line accusation, wrongly accused and not recalled), and doesn't say what `sleeper_caught` does here (it should stay false: no accusation).
- **Fix:** WREN comes through, reaches for the key, he refuses her; Quintero, warned, is already moving and takes her before she touches it, unhurt (`quintero_wounded` false, `sleeper_caught` unchanged). With no Quintero, HaX's warning goes to the player and the "[Stop her.]" beat comes a second earlier. Also take up or reject, by name, m09's two other proposals for m10: the blast-door line "The best lock there is. Tape two." and "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != "derek_file"` (m09 MC:347, :598).

### S3-10 (major): arrested Victoria's re-ring follows the player into the jammed gallery

- **Location:** MC:243 (C8, "Forced by re-ring"), MC:21 (rule 1.7: re-ring on leaving the room), MC:211 ("The gallery is the room HaX can't reach"), MC:11 (one non-HaX voice per room).
- **Problem:** the server hall's exits lead to the media room and the gallery. Under rule 1.7 a call closed early rings again as the player leaves, so it can ring as they enter the gallery, where Vos is the room's one non-HaX voice and the line is meant to be jammed. Either the jam is broken or the rule is.
- **Fix:** state the exception in §3.5: the line re-rings only in the server hall and the media room; at the gallery door an unfinished call is abandoned with its first-line defaults (`victoria_line_deal = no_deal`, `vos_secret_known` as reached), and `victoria_line_done` is set so it never rings again. Add "phone NPCs silent in a jammed room" to the engine list.

### S3-11 (major): the core's forced menus have no resume rule, and two of its globals don't survive replay

- **Location:** MC:340 (`points_landed` "counts the landings"), MC:448 vs MC:679 (`join_step` "0, 1 or 2" vs "0–3"), MC:404 ("On `join_step = 2`"), MC:373 (`console_choice` `joined`), MC:21 (the phone rule covers phones only).
- **Problem:** the core is a face-to-face conversation with four forced menus in a row. Nothing says what happens if the player walks away mid-argument or reloads. If `points_landed` is incremented per landing, a replayed exchange counts twice and can lift a one-point player to surrender. `join_step` disagrees with itself; a player who reached the key's confirmation and said "No" (step 3) then stepped away is `3`, which `join_step = 2` misses. `console_choice = joined` has no set point (the menu pick, or the key?).
- **Fix:** apply FA §6.1 to the core explicitly: each menu writes its global on its pick, and re-entry resumes at the first unset one (`exchange_1..3`, `console_choice`, `database_outcome`, `ending`). Derive `points_landed` from the three `exchange_n` values at the moment step 5 opens, never increment. `join_step` 0–3; his line on `join_step >= 2`. Set `console_choice = joined` only on the key's confirmation (with `ending`), `stopped` on "Stop it".

### S3-12 (major): nothing ties the conclusion to the ending being chosen

- **Location:** MC:502 ("`concludeRequires` is the four flags for all six"), §12 exports.
- **Evidence:** m09 holds its conclusion with a chain (`identity_scene_done` → `hour_read_done` → `tesseract_call_done`, FA §6.1 "The night's order"). m10's four flags are all in before his case opens (flag 4 gates the case, FA:518).
- **Problem:** if the conclusion aim's task is reachable once the flags are in, a run can conclude with `ending = ""` and `database_outcome = ""`, and the snapshot written at conclusion (CARRY_OVER_PLAN "Built") exports blanks to the next season.
- **Fix:** add one line to §8.1: the conclusion aim's own task is completed by the ending scene (or the Join cutscene), which plays only once `ending` is set; `concludeRequires` stays the four flags (no story task in it, per the skill's Step 1).

### S3-13 (minor): "done-flags in an `unlockCondition`" names the wrong mechanism

- **Location:** MC:620, MC:634 ("the only globals in an `unlockCondition`").
- **Evidence:** `unlockCondition` gates aims (`objectives-manager.js:685–720`); doors are opened by `unlock_door` actions (`apply-actions.js:76`), which a mapping on `global_variable_changed:<key>` can fire (ink `#set_global` emits it, `chat-helpers.js:501`). `victoria_line_done` unlocks nothing (MC:640), yet sits under that heading.
- **Fix:** say "door locks opened by an eventMapping on the done-flag". The breach is an AND of flag 1 and `door_scene_done`: two mappings, each conditioned on the other, so either order works, and a `game_loaded` re-check for reloads (engine list 31). Move `victoria_line_done` to a "stops a re-ring" line and `teaser_enabled` out of the decision table (it's configuration).

### S3-14 (minor): derived globals have no stated moment

- **Location:** MC:630 (`head_start_out`, "as the outer lock opens"), MC:632 (`media_story_ran`).
- **Problem:** the outer lock has five ways through (MC:211), three of them NPC actions (Victoria, Vos, Nightshade's release) and one a window. `head_start_out` needs one event that fires on every one of them, after the slot scene's globals are written. `media_story_ran` has no compute point at all; on Join it should stay irrelevant. `partial_release` stays `none` on Join although everything goes out, which a later season would misread.
- **Fix:** compute `head_start_out` in the mapping on the lock's own unlock event (the same event for all five ways); compute `media_story_ran` when `ending` is set. Add `published` to `partial_release` on Join, or say in §12 that it is meaningless there.

### S3-15 (minor): the stay-at-post gain only lands on one ending

- **Location:** MC:65 ("on the arrest ending he is on the trial's witness list").
- **Problem:** after F13 only `arrest` has a trial. On surrender, both lethal endings and Scorched Earth, "Stay" buys only "stays safe in custody", which the player doesn't see. Rule 1.3 wants the cost felt in play.
- **Fix:** give "Stay" a beat every ending reaches: his 06:00 line from the post ("You left me where they couldn't see me. I'm still useful. That's rarer than you'd think."), with the witness list added on arrest; or accept the asymmetry and say so in D16.

### S3-16 (minor): Imran talked round is not "a technician talked round"

- **Location:** MC:352 (exchange 3 slot 4, `gary_outcome = talked_round` only); FA:536 ("a technician talked round").
- **Problem:** the default branch talks Imran round on most saves, and FA's wording is generic; m10 narrows it to Gary without saying why. A cold-start player who talked Imran round has nothing in slot 4.
- **Fix:** include `imran_outcome` in `phone_left` / `phone_taken`, or state the reason for the narrowing in §6.3.

### S3-17 (minor): the Critical Mass watch's name should follow m09's m04 branches

- **Location:** MC:384 (item 4), MC:393 (HaX's line).
- **Evidence:** m09 MC:203: the watch "followed Voltage's people since Albion" on `m04_voltage_escaped`, "what's left of his crew" on captured, Critical Mass otherwise.
- **Fix:** Netherton names item 4 by the same three-way branch.

### S3-18 (minor): the clean record's ranking and wording differ between m09 and m10

- **Location:** MC:351 (slot 4 "Helena": `m09_albion_notified` > the clean record); m09 MC:510 ("Ranked last" of four, two shown); FA:535 and m09 MC:560 give two different button wordings.
- **Fix:** m10's slot pools win (they are newer and guarantee the payment through §6.2); m09's item 33 text and change 3 drop "ranked last". Pick one button wording and give it to both documents.

### S3-19 (minor): m09's "Elsewhere" clauses have no home in §10

- **Location:** MC:584–594 (§10); m09 MC:568 (clauses for `albion_notified`, `legacy_files_saved`, `recruiter_secret == "told"`).
- **Problem:** §10's human line 2 is Albion's inquiry (from m04); m09's `albion_notified` clause is also about the inquiry ("asked SAFETYNET when it knew"). Two inquiry clauses can appear in one credits roll.
- **Fix:** add the three m09 clauses to "Elsewhere" and merge the two inquiry clauses into one, by `m04_disclosure_choice` and `m09_albion_notified` together.

### S3-20 (minor): "camera alerts" assume a mechanic the engine doesn't have

- **Location:** MC:86 (the tunnel camera), MC:137 (Ghost's camera watch), MC:181 and MC:207 (the gallery camera switch), MC:202 (Dale's call: "one guard alert").
- **Evidence:** no security-camera system under `public/break_escape/js/systems/` (matches for "camera" are the Phaser view camera); NPC sight is `npc-los.js` / `npc-sight-challenge.js`.
- **Fix:** express each cost as guard staging (one guard more or fewer, placed with `setVisible`) or a sight challenge, and list a camera mechanic as a stage 5 proposal rather than an assumption (engine list 41).

### S3-21 (minor): Nightshade at the outer lock with no Quintero

- **Location:** MC:66, MC:609 (item 28: "Stays at the lock when WREN comes (Quintero goes in)").
- **Fix:** one sentence: with Quintero out, he is at the lock with a minder from the van team, who also takes the weapon on the cold ending (MC:541 already names the van team).

### S3-22 (minor): §11 item 35 says "flipped on one ending"

- **Location:** MC:613.
- **Fix:** "flipped on `secured`" (it follows `database_outcome`, which three endings share).

## State table check

Tried against: skip the scene, close the conversation, reload mid-scene, knock the NPC out, reach the room by the other route, and arrive in an unusual order. "ok" means set (or safely defaulted) on every route before conclusion.

**Exports (7)**

| Global | Set on every route? | Breaks | Status |
|---|---|---|---|
| `ending` | only by the C17 picks, the Join key, "wipe both" | conclusion not tied to it (S3-12) | ok with S3-12 |
| `database_outcome` | C16, or `published` on the key | as above | ok with S3-12 |
| `sleeper_caught` | right accusation; `true` at load on `m09_sleeper_named` (a `game_loaded` mapping writing a local from an import: allowed, CARRY_OVER §2.6 forbids only writes to the import) | Alpha-tapes path must not set it (S3-09) | ok with S3-09 |
| `wrong_accusation` | latches true | none | ok |
| `head_start_out` | "as the outer lock opens" | no single event across five ways through (S3-14) | ok with S3-14 |
| `partial_release` | "Stop it"; default `none` | Join leaves `none` (S3-14) | minor |
| `media_story_ran` | no compute point (S3-14) | | minor |

**Done-flags (2 locks + 1 re-ring stop)**

| Flag | Dead end? | Status |
|---|---|---|
| `door_scene_done` | yes, kept-not-shown unchecked (S3-01); knock-out (S3-02) | blocker until fixed |
| `ghost_call_done` | no dead end: every branch has a terminating option (the bait is always on the broken / unanswered / stranger menu, so misses can't loop forever); bypass risk via the east door (S3-03); a phone can't be knocked out | ok with S3-03 |
| `victoria_line_done` | gates nothing; re-ring scope (S3-10) | ok with S3-10 |

The cold start (every import at its default) hits the silent branch (tether menu, always answered) and the stranger Ghost (talk or bait, always answered), so neither new lock depends on an import. Both read only m10 globals: rule 1.6 holds.

**Locals (~40, counting `exchange_1..3` as three)**

| Group | Problem | Finding |
|---|---|---|
| Door: `nightshade_taken_in`, `payment_checked`, `tripwire_tripped`, `nightshade_cuffed`, `nightshade_deal`, `nightshade_tethered` | set per branch; KO not covered; `payment_checked` needs an item-against-object action (engine 37) | S3-01, S3-02 |
| Ghost: `ghost_sale`, `ghost_gift`, `ghost_answer` | first-line defaults per rule 1.7; `ghost_answer` unset if the east door is used early | S3-03 |
| Workshop / power room: `imran_outcome`, `gary_outcome`, `voltage_outcome`, `wendell_outcome`, `dale_rang`, `gallery_camera_blinded` | hatch, sneak and KO leave `""`; captured Voltage has no `ko` | S3-04 |
| Gallery: `victoria_line_deal`, `vos_secret_known`, `vos_secret_used`, `victoria_gallery`, `vos_outcome` | picking past the slot-holder leaves `""`; `arrested` overloaded; re-ring in the gallery | S3-04, S3-10 |
| Tasks: `head_start_stopped`, `backdoor_closed`, `media_story_killed` | booleans with safe defaults | ok |
| Whodunit: `accused`, `officer_out`, `kowalczyk_answer` | repeat accusations overwrite; no KO state for the raid | S3-05 |
| Core: `exchange_n`, `points_landed`, `console_choice`, `join_step`, `cold_lowered` | replay double-counts; `join_step` range; set point of `joined` | S3-11 |
| Briefing / gate: `quintero_stance`, `arakawa_call` | cutscene menu and a stance with defaults | ok |
| Asante: `asante_outcome`, `asante_confirmed_sheet` | `""` if skipped; harmless once the credits have an "untouched" clause | S3-04 |
| `teaser_enabled` | configuration, not a decision | S3-13 |

Missing locals the text reads: `wren_at_core`, `quintero_wounded`, a KO bool per raid member (S3-05); the countdown objects' global is correctly left to stage 4 (MC:683).

**Imports in a gate.** None. Every gate in MC reads an m10 global (`door_scene_done`, `ghost_call_done`, the flag globals, the shutter). §7's imports choose branches and menus only. Rule 1.6 holds.

## The six operations

| # | Operation | Source check | When it applies | Notes |
|---|---|---|---|---|
| 1 | Watch on a recruited Victoria | m03 sets `recruited` (`m03_npc_victoria.ink:768–769`); exported | `recruited` and `victoria_gallery` in `confronted` / `refused` | consistent with §3.5 (trusted ends the watch) |
| 2 | Nightshade's channel | m08 sets triple agent XOR arrested (`m08_nightshade_confrontation.ink:7`); m08 has no exports yet (FA §3.3 adds them) | triple agent, file held in m09 (or m09 never played), not cuffed | consistent with m09 MC:245 |
| 3 | HashChain tags | m06 exports `monitoring_enabled`; HashChain is m06's bank ("Every ENTROPY cell banks at HashChain") | `m06_monitoring_enabled` | ok; exclusive with `assets_seized` by m06's frozen-or-watched choice |
| 4 | Critical Mass watch | m09 (new canon, accepted by the orchestrator, dev log L167) | `m09_completed and not m09_albion_notified` | name by m04 branch (S3-17); cold starts excluded, which is right (nobody has told them of it) |
| 5 | Watch on Ghost's buyers | FA §4.1 step 4 default | "every player" | the guarantee's only support; spent on bait-and-stopped; thin where Ghost never sold (S3-06) |
| 6 | Zero Day broker tap | FA §4.1 step 4 default | unless confronted Victoria | does `vos_secret_used` burn it? unstated (S3-06) |

**At least two, always?** Arithmetically yes: 5 always applies, and 6 is absent only on the confronted branch, where 1 applies. The cold start is the floor: exactly 5 and 6. The weakness is item 5's meaning, not the count; S3-06's redefinition (the early-access order book from flag 2) keeps the floor and makes it true in story on every Ghost branch.

**Secure's payoff.** "The first rolls up a cell before the credits" collides with the bait catch and with surrender's rule when the first is 5 or 6 (S3-07).

## The ending matrix and F13

| Ending | Full history | Cold start (m10 first) | Partial (e.g. m09 with `sleeper_named`; m08 arrested; m02 never played) | Notes |
|---|---|---|---|---|
| Surrender | yes: rebuttal always on the menu | yes (stage 1 §17: listener 3/3) | yes | needs S3-11 so replay can't inflate points |
| Arrest | yes, two routes | yes | yes | |
| Lethal, justified | yes, by missing | yes | yes | closed at two points, by design |
| Lethal, cold | yes, both menus | yes | yes | `cold_lowered` persists; good |
| Scorched Earth | yes | yes | yes | the vault line is canon for every player (FA:524) |
| Join | yes | yes | yes | WREN never on the path; consistent with FA:563 |

No import changes which endings are offered (§7, §8.2's rule), and none sets `ending`. The matrix holds, subject to S3-12 (the conclusion must wait on `ending`).

**F13 (surrender = deal, no public trial; arrest = public trial, no cells).** Consistent at: Netherton's pre-menu line (MC:406); the step 5 table (MC:410–411); D12 (MC:706); §6.6's fire / hold-fire reasoning (MC:425: hold fire buys "a trial"); §8.2's 06:00 rows; FA §4.6's arrest row ("A trial. He will make speeches. Let him.", FA:632) and SA:390; P4 and P26 carry it to FA and the arc. Gaps:

- His "Stop it" line, "Then we do it the slow way. In court. I've a lot to say." (MC:368, FA:520, SA:343), plays before the player knows which way it goes. It works as his expectation, and Netherton's "nobody hears his speech" then answers it; stage 7 should keep the two in that order. No change needed.
- The credits' "In this operation" clause for Tesseract isn't written per ending. Surrender's should say "No trial." (the outcome, not the choice, per §10 rule 4) and arrest's "Awaiting trial.", so the F13 trade is in the credits as well as at 06:00.
- The stay-at-post Nightshade's gain is the trial's witness list, which only `arrest` has (S3-15).
- FA §4.6's surrender row ("Takes the protocol to the Council") doesn't yet say "no trial"; P26 adds it to the arc only. Add FA §4.6 to P4's target list (it names §4.6, so this is wording only).

## Imports and m09's exports

**MC §7 against FA §3.2.** Every import MC §7 names is in FA §3.2 with the same alias, default and source var, and every one that changes a choice in FA (Use R, H, O, P, L+) has a row. FA's lines-only and prop imports that change no choice (`m02_reeves_fate`, `m02_insider_asset_*`, `m07_hollis_resolved`, `m04_robert_vance_ko`, `m08_triple_agent_first_payment`) are correctly left out under MC:454's rule. Defaults match FA §3's never-played canon row for row (m01 arrest line, stranger Ghost, Imran, Vos, Wendell with HaX, no backdoor, silent Nightshade, the four-person team). Shipped sources: every ✱ name exists in its source's erb; the m03, m07 and m02 enum values MC reads (`recruited` / `arrested` / `escaped` / `ko`; `trojan_horse` / `fracture` / `meltdown`; `hardened`) are the values the shipped ink sets. The four door branches cover every m08 save, because m08 sets arrested XOR triple agent and its KO safety net sets arrested with `ko_before_fate`.

**m09's exports.** FA §3.4 lists nine; the orchestrator has made it eleven (`cage_bin`, `legacy_files_saved`). MC takes `cage_bin` (values match m09 MC:535, with `""` for never played) and omits `legacy_files_saved` (S3-08).

| m09 export | FA tier (now) | Correct tier after the rulings | MC |
|---|---|---|---|
| `nightshade_shown_file`, `sleeper_named`, `sleeper_shortlist` | 1 | 1 | ok |
| `deck_pulled` | 2 | **1** (service-door warning is an H; orchestrator, dev log L167) | not moved (S3-08) |
| `recruiter_offer`, `recruiter_secret`, `albion_notified`, `hax_confession_answer`, `reading_finished` | 2 | 2 | ok |
| `cage_bin` | (new) | **2** (the arrested-branch help is dropped) | Tier 2, but P21 still takes the help (S3-08) |
| `legacy_files_saved` | (new) | **2** (one "Elsewhere" clause) | missing |

**Counts after the fix:** m10 imports 67 (Tier 1 39, Tier 2 28) plus nine `completed`; m09 exports eleven. P8 says 66 and ten.

**m09's proposals for m10, taken up or not.** Taken: `cage_bin`'s Derek answer, the door line on `nightshade_copy`, the shown file spending the channel, the Critical Mass watch, the invoice, HaX's "You burned the Critical Mass watch for one letter." Not yet decided in MC: the blast-door line, the "two things" variant, the three "Elsewhere" clauses (S3-09, S3-19). Out of step: the service-door warning's form (S3-09), the arrested-branch help (S3-08), the clean record's ranking and wording (S3-18).

## The 28 proposed changes

Totals: **accept 21, modify 7, reject 0.** Conflicts with m09 stage 3 or FA are in P8, P11 and P21.

| # | Verdict | Reason |
|---|---|---|
| P1 | accept | Talked-down escaped Victoria cancelling the order makes both escaped branches the same trade; `head_start_out` already reads `talked_down`. |
| P2 | accept | Fixes D5; the tap cost is said before the jam. |
| P3 | modify | Keep the single list; redefine item 5 as the early-access order book (S3-06); state whether `vos_secret_used` costs item 6; Secure's cell goes through the one ledger (S3-07). |
| P4 | accept | F13, user-approved. Add the surrender row of FA §4.6 explicitly. |
| P5 | accept | Signposting for justified lethal and Scorched Earth, said before the menus that need it. |
| P6 | accept | Fixes H1. Consider adding Imran's talk-round to slot 4 (S3-16). |
| P7 | accept | Guarantees m09's Recruiter decision is heard once; no state added. |
| P8 | modify | Eleven m09 exports; m10 67 imports (Tier 1 39 with `deck_pulled` moved, Tier 2 28 with `cage_bin` and `legacy_files_saved`) (S3-08). |
| P9 | accept | Orchestrator ruling (dev log L173). |
| P10 | accept | Merge the m09 inquiry clause with human line 2 (S3-19). |
| P11 | modify | The unchecked path's cuff-or-leave must not hold the breach (S3-01; simplification 1); "Stay" needs a beat off the arrest ending (S3-15); drop any reference to the arrested-branch help; with no Quintero, a minder at the lock (S3-21). |
| P12 | accept | A fifth way through, opened by a taken-in Nightshade; one more unlock path for `head_start_out`'s event (S3-14). |
| P13 | modify | Bait and its catch stay, through the cells ledger (S3-07); collapse the refused branch's two menus into one (simplification 2). |
| P14 | accept | Subject to the camera mechanic (S3-20, engine 41); if none is built, express it as one gallery guard fewer. |
| P15 | accept | With the empty-value defaults for Imran and Gary (S3-04). |
| P16 | accept | The signposting U4 needs; one sentence. |
| P17 | modify | Both locks stay. Add the KO safety net (S3-02), open the east door on `ghost_call_done` (S3-03), and word the mechanism as door mappings, not `unlockCondition` (S3-13). |
| P18 | accept | Orchestrator ruling; `cold_lowered` already in §12. |
| P19 | modify | `join_step` 0–3; his line on `>= 2` (S3-11). |
| P20 | accept | Housekeeping. |
| P21 | modify | Reject the arrested-branch help (orchestrator, dev log L169); the service-door warning follows m09's revised form, after the refusal, with the no-Quintero case (S3-09); take up or reject the blast-door line and "two things" by name. |
| P22 | accept | No m09 change needed; m09 should drop "ranked last" (S3-18). |
| P23 | accept | Follows P11 and P13 as modified. |
| P24 | accept | |
| P25 | accept | Add the Tesseract credits clauses by ending (F13 section). |
| P26 | accept | F13. |
| P27 | accept | |
| P28 | accept | |

## Scope and simplification

**Size.** 19 choices; about 40 local decision globals plus 7 exports, 3 done-flags, the countdown global and 67 imports with 9 `completed`. The five full scenes now have 4 (door) × 5 (Ghost) × 3–4 (workshop) × 3–4 (power room) × 5 (gallery) import branches, each with two to four outcomes, before the whodunit and the core. Every piece is buildable with the engine's existing primitives (eventMappings, `setVisible`, `unlock_door`, ink globals, `confirm_action`, `show_end_screen`), except the camera mechanic (S3-20) and the phone and resume behaviour already on the engine list. The risk is test coverage, not feasibility: stage 8's route-driver profiles have to cover every branch of each scene at least once, and every forced scene's knock-out, close-early and reload cases.

**Is it testable?** Yes, if the profiles are pairwise rather than combinatorial: one profile per branch of each scene, plus the cross-scene reads (bait × console task, Victoria × head start, tripwire × WREN timing, wrong accusation × each officer's job, `alpha_tapes` × no Quintero). That is roughly 25–30 m10 profiles, against m07's 39 routes.

**What to simplify, in order** (largest saving and lowest story cost first):

1. **Kept-not-shown Nightshade: one decision, at the table.** Checked: the cuff-or-leave menu at the table. Unchecked: no menu; he stays (the channel stays live), Netherton's one line at the locked door. Removes the blocker (S3-01) and one post-breach beat on HaX's channel. The trust test keeps its cost.
2. **Ghost refused: one menu, not two.** "[The guard change.]" / "[One camera.]" / "[Nothing. Just go.]", with Ghost's question as the lead-in and the answer's flavour in Ghost's reply. Same three outcomes, one fewer resume point.
3. **One cells ledger** (S3-07). Not a cut, but it removes three places that each count cells their own way.
4. **Cut Dale's sub-choice.** "Tell Wendell" already has a gain; Dale adds a global, an alert and a credits line for a moment few players will weigh. Keep Dale as one line in Wendell's credits clause ("Rang his mate Dale. Dale stayed home.") on "told".
5. **Merge Imran's phone outcomes.** Keep talked round (with the phone left) and taken in; fold "phone taken" into taken in. Each remaining outcome is still best on one count (kind and quick against hard and thorough). Saves one value, the "stung" variant of the clue 3 pointer, and the friend's two states.
6. **Cap wrong accusations at one live at a time** (S3-05's alternative). HaX refuses a second until the first is recalled ("Get Malhotra back first."). Keeps `officer_out` a single string and halves the per-room staging variants.
7. **Nightshade's look: two forms, not three.** The van window on arrest and surrender; nothing elsewhere (drop the justified-lethal console line and the Scorched Earth chair line). Saves two placements in endings that are already busy.
8. **Leave arrested Victoria's line as goodwill only** if time runs short (drop the deal/no-deal and `victoria_line_deal`; keep `vos_secret_known`). D7's fix then goes, so this is last and optional.

Items 1–3 should be done at stage 3; 4–7 are recommended; 8 only if stage 4's time budget is over.

## Engine plausibility list

For stages 4–5 to check. Listed only; numbers continue m09 stage 3's 16–29.

30. A door opened by an eventMapping on `global_variable_changed:<done-flag>` firing `unlock_door` (`apply-actions.js:76`); ink `#set_global` emits the event (`chat-helpers.js:501`). Does the unlocked state persist across a reload, or does it need a `game_loaded` re-check?
31. An AND lock: the breach on flag 1 **and** `door_scene_done`, as two mappings each conditioned on the other, so either order opens it, plus the `game_loaded` re-check (S3-13).
32. Phone NPCs that ring on room entry (Ghost, arrested Victoria), re-ring on leaving the room until their done-flag, and resume at the last unanswered choice, including after a reload (FA §6.1; m09 item 17).
33. A phone NPC silent in a jammed room (the gallery), and an unfinished call that writes its defaults and done-flag at the jam's door (S3-10).
34. Face-to-face forced scenes that resume at the last unanswered choice after a walk-away or a reload: the door scene and the core's four menus (S3-11).
35. An `npc_ko` mapping that writes defaults and a done-flag for a conversational NPC (m08's pattern, `m08 scenario.json.erb:1050–1056`) (S3-02).
36. KO-proof NPCs. No KO-immunity key found in `systems/`; needed for Tesseract until step 5 and, if chosen, Netherton, Nightshade at the door and Malhotra (S3-02).
37. An item-against-object check (the payment laid beside the m09 plans): an object interaction conditioned on a held item, keyed on type or an `onPickup` `setVariable`, since `item_picked_up` emits the type (skill Step 1).
38. Object text that reads a global (the countdown objects; the outer lock's "EARLY ACCESS: RELEASED"); m09 SA engine item 10.
39. One event on the outer lock's unlock whichever of the five ways opened it (picked, card, NPC via `unlock_door`, Ghost's window, Nightshade's release), carrying `head_start_out`'s computation (S3-14).
40. A knock-out resolved from dialogue ("[Stop her.]"), setting WREN's KO global without a fight.
41. Security cameras and camera alerts (the tunnel camera, Ghost's watch, the gallery switch, Dale's call). No mechanic found (`systems/` has `npc-los.js` and `npc-sight-challenge.js`, no CCTV); a new feature or guard staging (S3-20).
42. Guard counts that change mid-mission on a global (Imran's friend sent home; Arakawa's detail coming down; reinforcements on a trusted Victoria), by `setVisible` on `global_variable_changed`.
43. Per-room companion placement (Quintero, Arakawa, Kowalczyk; Nightshade or a minder at the outer lock), N-14.
44. A choice menu inside a cutscene (C1 at the briefing; C19's walkabout hub at 06:00) and unvoiced texts during the 06:00 cutscene (m09 item 16).
45. The release key: `confirm_action` (`apply-actions.js:148`) to `show_end_screen` (`:165`). Check that "No" returns the player to the step 2 menu of an open conversation.
46. A panel switch object that sets `gallery_camera_blinded` and goes inert once the shutter is cut.
47. The conclusion task completed by the ending cutscene, so `/conclude` can't run with `ending` empty (S3-12).
48. Ghost's guard-change window as an event-driven state at the outer lock (on `ghost_gift == "window"` when the player arrives), not a timer.

## Verdict

**Revise, then round 2.** 1 blocker, 11 majors, 10 minors. The choice design holds up: no import gates anything, every ending is reachable on every save type, the six-operation list never drops below two, and F13 reads the same way everywhere it appears. The faults are in the state underneath. One lock dead-ends a reachable branch (S3-01); knock-outs, walk-aways and replays aren't covered for the forced scenes and the core (S3-02, S3-11); several outcome globals can stay empty (S3-04, S3-05); the cells and the operations double-count (S3-06, S3-07); and the m09 handover is one ruling behind (S3-08, S3-09). Almost every fix is a sentence or a rule. Round 2 should concentrate on §3.1 (not-shown branch), §6.4–6.5, §8.1 and §12, and on simplifications 1–3.
