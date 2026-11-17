# Office-life skill movement step review R1

Assumption: the worktree at 92aecc73d holds the engine line numbers the skill should cite; I read the engine there, not on main or `build/ol-m03`.
Assumption: "conversation" in D78 covers phone calls with the same character as well as person-chat, since the user said "any conversation".
Assumption: I rated the contradiction with the "only three protections" rule a blocker, because a planner who follows one section breaks the other.

| Severity | Count |
|---|---|
| Blocker | 1 |
| Major | 7 |
| Minor | 5 |

## Engine claims checked

Every schema citation is correct: `offWhen` :5480, mapping `condition` :4973, `cooldown` :4983, `delayMs` :4984, mapping `needs` :5099 to 5102, `needsHome` :4881, `needsRooms` :4894, `needsAvoidRooms` :4895, `needsPrivateTo` :4247, `needs` with `decayPerMin`/`urgentAt`/`initial` :4841 to 4850, `affordance.seat` :3983. `control()` is at npc-needs.js:1097 to 1112 (1096 is its doc comment, which is fine). The m08 quote is at `scenarios/m08_the_mole/ink/m08_background_analyst.ink:26`, as cited.

**"suspend does not walk the NPC home" is right.** npc-needs.js:1099 to 1104 aborts the job with `cancel: true` (which calls `world.cancelMove`, :4055), sets mode `idle` and sets `scriptSuspended`. Nothing calls `_goHome`. A walker stops mid-route and a user stops at the machine. Only `"resume"` walks it home (:1107 to 1111).

**No engine mechanism returns an NPC to its post before a conversation.** A player can talk to a walking needs NPC. While `inChatWith` holds, the NPC freezes where it stands (`cancelMove`, npc-needs.js:1434 to 1444; npc-behavior.js:935 to 945 "hold still while the player talks"). The conversation runs in that spot, with the background of the room it is in (person-chat-background.js:15). When the chat closes, the NPC carries on with the same job (npc-needs.js:1446 to 1457): it walks on to the machine, uses it, then goes home. Three things can recall it:
- `offWhen` turning on while it walks or queues: `_turnBack(s, 'off')` (:3480 to 3484) then `_goHome` (:2095).
- `"resume"` after a suspend.
- A `patrolOverride`.

An NPC already *using* the machine when `offWhen` turns on finishes its use first (schema :5480: "one already using it finishes").

## Blocker

**B1. The new gates are not among the protections the skill accepts, and the leash goes beyond what the cast table and V2 allow.** SKILL.md:118 to 120 against SKILL.md:101, :58 and :219.
- SKILL.md:101 says "Name a protection for every story beat. Only three count": no needs; needs confined to its own room with every target in it; or a `patrolOverride.targetTile` send-home plus `"resume"`.
- The new step gates beats with `offWhen`, a mapping `condition` or `suspend`. None of those is one of the three, so a reviewer applying :101 rejects every D78 plan.
- SKILL.md:119 allows a leash "to the nearest machine", which can be outside the NPC's room. That breaks protection (2) and the cast table's "story-critical: only confined to its own room, or none" (:58).
- It also raises V2 (validate_office_life.rb:432 to 452) for any free NPC that owns a required knot, is a conversation-mode target or is a key source.

Two class schemes now share the one "class" column of the people table (:58 table vs the five classes at :67 to 73), with no rule linking them.

Fix: make the five classes decide whether an NPC moves at all, and the existing table decide how far. Add "offWhen with a measured lead time" (B1 with M1) to :101 as a fourth protection, for free existing NPCs only. State that V2 must be clear for each moved NPC, or the leash is its own room.

## Major

**M1. Getting back to post before a beat is under-specified, and part of it is wrong.** SKILL.md:118, :120.
- "NPCs walking there turn back and park" is wrong. The `off` rule has `fallback: true` (npc-needs.js:172). `_turnBack` first tries the next acceptable source for the same need (:2089 to 2093), and parks and goes home only if none is found. The schema text says the same: "take the next source or park".
- A user already at the machine finishes its use.
- So the gate global must turn on before the earliest moment the beat can open, by at least use time plus walk-home time plus a margin, measured as in `references/measurement-recipes.md` section 3. "The NPC is home before the player can reach it" (:120) cannot be proved as written; a measured lead time can.
- Say outright that a conversation started away from post freezes the NPC there, and that the trip resumes afterwards (npc-needs.js:1434 to 1457).

**M2. `suspend` is lost on reload. A `patrolOverride` cannot recall an NPC from another room.** SKILL.md:118.
- `scriptSuspended` is client state. It starts `false` (npc-needs.js:582) and nothing restores it, so after a reload the routine runs again in the middle of a beat window.
- A `patrolOverride` resolves `targetTile` in `npc.roomId` (npc-manager.js:1622 to 1626). That id follows the NPC as it walks (npc-behavior.js:1014 to 1018), so one fired while the NPC is in the kitchen sends it to a kitchen tile (the validator says the same at validate_office_life.rb:420 to 422).
- Any scripted walk also suspends needs (`onExternalMove`, npc-needs.js:778 to 788). mapping-patterns.md:129 records m03 losing staff a tile short that way.
- Fix: for a free existing NPC, the only gate is a scalar global read by `offWhen` (and by the mapping `condition`), since globals survive a reload. Drop the `suspend` route, or allow it only for an NPC confined to its own room, with a reload proof taken inside the window.

**M3. An NPC whose conversation is always open has no answer.** SKILL.md:120 and :121.
- Most story NPCs can be talked to at any time. "No conversation ... can begin while the NPC is away" can then hold only if the NPC never leaves, and :121 only covers beats that have a gate.
- The skill should say which way it goes. Option one: an NPC whose talk is open at any time is not free. Option two (needs the user's yes, since D78 says "before any conversation can start"): talk away from post is allowed when the conversation reads no location and no beat hangs on it.

**M4. Gating "the machine it uses" leaves other movers open.** SKILL.md:118 and :221.
- The needs layer can send an NPC to:
  - any source of the same need inside its leash (the fallback in M1)
  - player-dropped magnets
  - `interests` items
  - print fetches (`habits.print`, `needs.print`)
  - workaround visits

  `away_need_rooms` lists them all (validate_office_life.rb:371 to 420).
- `offWhen` on one machine stops none of these. A magnet also lets the player lure a free NPC away during a beat.
- The :221 check "no pinned ... NPC gained `needs`" misses `habits`, `interests` and `workarounds`.
- Fix: every source in the moved NPC's V2 away list must carry the gate. A free existing NPC gets no `interests`, `workarounds` or magnet-satisfied needs. The :221 check should cover all needs-layer keys.

**M5. Giving needs to an NPC that owns a workstation changes how its PC behaves, and the lock and key diff cannot see that.** SKILL.md:67 to 73.
- Owner presence counts only when the needs system tracks the owner (workstation-state.js:62 to 67, 677 to 680).
- An untracked owner's PC answers `signin`. Once the owner is tracked, the PC answers `attended` while the owner is at post, and `accessed` or `locked` while they are away (:51 to 59).
- So a story PC can become usable while its owner is at coffee, or stop working while they sit there.
- Fix: the "Holding or guarding" class should name the owner of any `lockType: "login"` object, and any NPC whose presence an `onInteract` or ink condition reads.

**M6. Knock-out and hostility while away from post are not covered.** SKILL.md:67 to 73, :221.
- A knock-out drops `itemsHeld` in the room the NPC fell in, not its home room (npc-hostile.js:781 to 784), and a carried needs item goes the same way (`koDropCarried`, :806 to 810). That breaks the "item positions unchanged" promise.
- A knocked-out or hostile NPC is `blocked` and is not walked home until it is available again (npc-needs.js:1235 to 1239, 1418 to 1431).
- Fix: define "Holding" to include any `itemsHeld`. Require the people table's "if attacked mid-walk" column for every moved NPC. Run the attack probe on a moved NPC at the machine.

**M7. A phone record that shares the character is a gap in "before any conversation".** SKILL.md:67 to 73 and :120.
- `inChatWith` freezes the NPC only for person-chat (npc-needs.js:5389 to 5400). A phone call with the same character leaves the sprite walking.
- A phone line such as "I'm at my desk" is then false on screen.
- The cast table's "several records of one character ... never" (:63) covers the extra records, not the person record of a character who also has a phone or cutscene record.
- Fix: a character with a phone or cutscene record is pinned unless the plan shows that no phone or cutscene line places them, and that no cutscene moves or hides that id while it is away.

## Minor

**m1. The positions check has no baseline.** SKILL.md:221, checklists.md:15. "Compare the objects' room and position against the baseline", but Stage 0 (:40 to 47) records only locks and the office summary. Add a Stage 0 dump of object ids with room and position, and name the command.

**m2. "Stretching at a window" (:116) has no preset.** `officeType` has no window (schema :5474). It needs a hand-written affordance; say so or drop the example.

**m3. :66 now contradicts the new step.** "So talk needs new ambient people or nothing" should point to the D78 step for existing NPCs that are free.

**m4. The reload proof needs two cases.** :233 and checklists.md:40. Reload inside a gate window (global set: the NPC must stay put) and outside one (with a low `initial` it may leave at once). The note "needs reset to the posts on reload" hides the first case.

**m5. Moving an existing NPC affects other NPCs' beats.** :100 keeps only *new* NPCs out of fixed-spot beat rooms and patrol or LOS windows. Moved existing NPCs need the same rule. A moved NPC also changes witness logic for others: mapping-patterns.md:131 records m03 counting a cooler trip as "witnessed".

## Hard cases, summary
- Knock-out or hostility away from post: not covered (M6).
- Reload mid-routine: `offWhen` globals survive, `suspend` does not (M2, m4).
- Conversation always open: not covered (M3).
- Phone or cutscene record sharing an id: not covered (M7).

## Fit
The new step sits well in the outputs list, the Stage 2 order, Stage 4 and the checklists. It conflicts with :101's "only three count" (B1), with the cast table and V2 (B1), and with :66 (m3). It agrees with the m03 lesson against `patrolOverride` send-homes (mapping-patterns.md:129), but should cite that lesson as the reason `offWhen` is the gate.

## Verdict
Not ready. Fix B1 and M1 to M7, then run round 2. The D78 intent is sound. Most of the work is naming one gate (a global read by `offWhen`, with a measured lead time), widening "holding" to cover workstation owners and `itemsHeld`, and deciding the always-open conversation case.

## Outcomes (orchestrator)

- B1 and M1 to M7, m1 to m5: to fix. B1 adds a protection, a design decision, so the fixer is opus55 and round 2 is opus55.
- M3 (an NPC whose conversation is always open) goes to the user: a. such an NPC is not free; b. talk away from post is allowed when the conversation reads no location and no beat hangs on it. The skill states a until answered.
