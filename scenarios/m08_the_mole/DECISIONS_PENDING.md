# m08 decisions pending (pass 5, started 2026-10-13)

The pass runs without the user's input (user, 2026-10-13). Each item has a recommendation; where the orchestrator went ahead with a reversible mission-local choice it says so.

## U1. SecGen checks (needs the user, outside the session)
From alignment review cycle 1 (`ALIGNMENT_REVIEW_P5_C1.md`). Which scenario is built: `break_escape/safetynet/m08_the_mole.xml` (mission.json) or `ctf/such_a_git.xml` (erb header)? Flag order? Does the VM hold what HaX's texts claim (the `nightshade_ops` account, mail to `architect@entropy.onion`, a root-only log naming a Crypto Lab terminal and 47 minutes, the threat-database root file, SSH as the second login, the CVE ID)? Needs checking against SecGen by the user.
Recommendation: if it's the generic CTF, reword HaX's flag-3/4 texts or have SecGen place those files.

## U2. Story direction for the mole hunt (B1)
Option B (mission-local): flag 4 gives time and terminal, no name; a correct naming to Netherton becomes required via the door audit; the three-misread fallback stays but costs something; HaX gets a progress-gated audit hint. Option A depends on VM content (shared login, audit names the person).
**Orchestrator went ahead with Option B** (reversible, mission-local, doesn't depend on U1). Overrule if you prefer A.

## U3. Locker after a tip-off (possible engine change)
Empty or change the locker when Nightshade is tipped off. Trying `textVariants` and a dialogue-only fallback first; engine change only if neither works.

## U4. Canon: HaX and the Architect's teacher line
May HaX hedge-recognise "Let it hurt afterwards, not during" in m08 ("Same classroom") without naming Tesseract?
**Orchestrator went ahead with yes** (one line, easy to remove).

## E1. Required-task key wording (engine, from regression run 1)
`objectives-panel.js` marks required tasks with `*` only in aims that have a visible optional task (by design), but the panel's key reads as if every unmarked task is optional. Recommendation: show the key only beside aims that use the marker, or word it "* required (in aims with optional tasks)". Backlogged; not blocking.

## U1 addendum (alignment fix round 1, 2026-10-14)
Option B makes the door audit, not the box, name the mole. That holds only if the VM itself doesn't show a person's name. The evidence wall (shown after he is named) still says the committed credentials "resolve to nightshade_ops". If the VM's account or home directory is literally named after Nightshade, a player reads the answer off the box and the audit becomes a formality. Needs checking against SecGen by the user. Recommendation: if it is, either rename the account on the VM to something neutral (a service login), which turns Option B into Option A, or accept it and treat the audit as corroboration.

## E2. PIN keypad title (engine, from regression finding 12)
`minigame-starters.js:531` titles every PIN keypad `Enter PIN for ${type}`, so the Director's safe reads "Enter PIN for item". No scenario field overrides it. Recommendation: use the lockable's `name` when it has one ("Enter PIN: Director's Safe"). Small, shared; not blocking.

## E3. Dusting panel long text (engine, from regression finding 10)
`.dusting-quote` (`css/dusting.css:64`) has no `overflow-wrap`, so any unbroken string runs off the panel. m08 now wraps its ciphertext at 64 characters, which fixes it here. Recommendation: add `overflow-wrap: anywhere` to the class for other missions. Not blocking.

## E4. No `nameVariants` for items (engine, noted while doing M3)
`textVariants` and `observationVariants` resolve on any object (`utils/conditional-text.js`), but item names don't. After a tip-off the go-bag still lists as "Go-Bag -- Locker 0x47" while its text says the shelf is empty. Recommendation: none needed for m08 (the text carries it); backlog if other missions want it.

## E5. Dusting panel and lock/container headers ignore variants (engine, alignment round 2)
`dusting-game.js:393-395` prints the item's raw `observations` and `text`, and the lockpick screen and container header print the raw `observations`, so `textVariants`/`observationVariants` never reach them (round 1 browser N1, N4). m08 works around it (base fields true in every state, content in variants); nothing in m08 needs the engine change. Recommendation: resolve both fields with `resolveObjectField` (`utils/conditional-text.js`) in those three places, for other missions. Not blocking.

## E6. A re-opened hub shows the previous line above the hub choices (engine, alignment round 2 browser R1)
After "[I have a name forming.]" and End Conversation, re-opening the Director shows his last line ("Already? Say it ... Who is your instinct pointing at?") above the eight hub choices, so it reads as a question with no answers. The choices are right (the ink re-enters `hub`). The first open after the cloner scene showed the old "Go." the same way, so it looks engine-wide: person-chat restores the last displayed line on reopen. Recommendation: on a reopen that lands on a hub with no new text, show no previous line (or a neutral re-entry line), in the person-chat minigame, not per mission. m08 needs no change; dialoguelint's blank-reentry CHECKs are the mission-side version of the same gap. Not blocking.

## E7. Notes taken from a container can't be re-read (engine, alignment round 2 browser R2)
`notes` items taken from a container (the holdall, the token pouch, the boarding stub) open the viewer once and then don't appear in the inventory; `text_file` items (the brief, the stick) do. So the holdall can't be re-read after the naming: its passport text reaches only a player who first opens it after the naming, and HaX's "Security searched his holdall" text covers the player who read it before. Recommendation: either keep taken notes readable (a notes list or inventory entry), or accept it as the notes design. m08 covers it with the HaX text; no mission change. Not blocking.

## U1 addendum 2 (puzzle chains round 1, 2026-10-14)
HaX's phone hub now has a hint for each VM step, shown only for the step in hand (F1). Their claims about the VM need checking against SecGen by the user: before flag 1, "A GitList instance our own team stood up and never patched. One crafted request gets you code execution with no login at all"; between flags 1 and 2, "Read the history, not just the files. Then the stash: git keeps what people meant to throw away" and "they committed something they shouldn't have"; between flags 3 and 4, "There's a sudo rule on that box begging to be abused." The wording comes from the in-game framing (launcher, flag texts, guide titles), not from the VM. Recommendation: if any step differs on the VM (no stash, a different root route), reword that one hub line; nothing else depends on it.

## E8. Validator: `behavior.facePlayerDistance` reported as unknown (validator, puzzle chains round 1)
`scripts/validate_scenario.rb:284` lists the known `behavior` fields without `facePlayerDistance` and `personalSpace`, although the engine reads both (`npc-behavior.js:329-362`). m08 no longer uses it (the off-duty agent's catch uses a 360-degree sight circle instead), so nothing is blocked. Recommendation: add the fields `parseConfig` reads to the validator's list.

## E9. The sight circle stays drawn after a one-shot catch, the naming, or a KO (engine, puzzle chains C2 N4)
`_updateLOSVisualizations` (`npc-manager.js:2098-2125`) draws every NPC with `los.visualize` and checks neither KO nor whether its `lockpick_used_in_view` mapping can still fire. In m08 the off-duty agent's circle stays round him after his one catch, after the naming (when the mapping's condition is off) and while he lies knocked out. It only over-warns, so nothing is lost, but a circle round a man on the floor looks like a bug. Recommendation: skip drawing for `isNPCKO` NPCs, and optionally for NPCs whose only `lockpick_used_in_view` mapping won't fire, using the same `_mappingWouldFire` check the catch gate uses (`npc-manager.js:338`). Dropping `visualize` in m08 would cost more fairness than it gains, so no mission change. Not blocking.

## E10. Reload respawns the player in the start room (engine, puzzle chains round 1 browser P2)
After a page reload the player stands in `main_lobby`, not the room they left (server room in game 2425; game 2430 too). Inventory, globals and tasks are intact. This is the known backlog item "Resume in the room you left" (`docs/IDEAS_BACKLOG.md:46-47`, P10 in the pass-4 log), not an m08 fault. m08 needs no change: every room the player has opened stays open. Not blocking.
