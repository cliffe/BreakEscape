# Office life missions plan: design review (round 8)

Reviewer: fresh read-only Opus. Scope: the whole plan, with most weight on section 6 (the m02 pilot). Every claim below was checked against the worktree at `571cce413` (the m02 template rendered with `tools/pass2/render.rb`, its ink, the Tiled maps, the needs engine, the presets, the validators). SecGen and the field guides were not opened.

## Verdict

Not ready for stage 4. The skill sections (1 to 5, 7 to 14) are mostly sound and standalone, and the plan follows the user's decisions in section 14. The pilot is where it breaks. Gary's routine contradicts three pieces of existing m02 text, and by the plan's own stage 1 rules he is "fixed by the text". The chatter and exchange design depends on Gary and the new NPC meeting at the IT kettle, which the engine's nearest-source rule means they almost never do, so most of the 55 to 65 planned clips would be voiced and then never heard. The need names don't match the presets, the recommended cast choice contradicts Sister Doyle's staffing beat, and the new NPC is the only person in the hospital whose assault has no consequence.

## Blockers

### B1. Gary's routine contradicts m02's own text, and the plan's classification rule rules it out (6.2, 6.6; stage 1)

Evidence:
- Gary's `observations`: "Gary Whitlock has not moved from that chair since half ten." (`scenarios/m02_ransomed_trust/scenario.json.erb:2035`).
- His opening narration: "Two dead terminals, a cold mug with a skin on it, and a printed stack of his own emails squared up beside the keyboard." (`ink/m02_npc_gary_whitlock.ink:80`). Someone who makes tea every few minutes doesn't have a cold mug with a skin on it.
- The cabinet catch: "Behind you, a chair creaks round." (`ink/m02_npc_gary_whitlock.ink:764`). This assumes he is sitting at his desk when he sees the pick.
- Stage 1 puts an NPC in the class "fixed by the text" when "a narrator line, ink or note says where they are or that they have not moved" (plan line 145). Gary's observation says exactly that, word for word in the same form as the Doyle example the plan quotes. The people table still calls him "story-critical" with a routine (plan line 362), and 6.6 says "Existing lines changed: none" (plan line 426).

What goes wrong: the player finds Gary standing at the copier, clicks him and reads "has not moved from that chair". Or the player picks the filing cabinet while Gary is at the kettle, and the catch narrates a chair creaking round. Either the pilot ships contradictions, or the implementer edits voiced narrator lines (the first-meeting and cabinet-catch narration are person-chat lines, so they are in the TTS batch), which breaks rule 3 and 6.6 without a listed change. 6.9's probe and 6.8's V2 expectation are built on a routine the text forbids.

Fix: pick one and write it into 6.2 and 6.6.
- (Recommended) Keep Gary stationary (protection 1), which is what his text says. He still contributes to office life: give him a `printHabit` with `forgetChance: 1`, and print through the needs command `{ "print": "<copier id>" }` (`npc-needs.js:966-983`) from a mapping on an event he already lives through. One candidate is `objective_task_completed:talk_to_gary`; his line "Know what I've been doing tonight, between restores? Printing those. All seven." (`ink/m02_npc_gary_whitlock.ink:351`) sets this up. The printout appears on the copier and he never walks. Say plainly that the pilot then proves protection 2 only on N1's leash, and move the protection-2-on-a-story-NPC proof to m05 (Lisa) or m08 (the off-duty agent), where stage 1 already expects it.
- Or keep the routine and list the line changes as approval items: the observation (text only), the two narrator lines (re-voiced), with old and new text, priced by V6. Then remove "It tests the hardest protection" as a reason only if the routine goes.

### B2. Gary and N1 almost never meet, so most planned chatter and both exchanges never play (6.2, 6.3, 6.6)

Evidence:
- A need goes to the nearest reachable free source unless the NPC's own post object satisfies it (`npc-needs.js:1620-1627`). N1 is posted in the staff room, with the boiler and cooler a few tiles away. The IT kettle is through a door and across IT, so she uses it only when every staff-room source is busy, and nobody else uses them.
- Pairs chat only when two NPCs are using the same capacity-2 chatter object at once (`npc-needs.js:3863-3871`). "A lone NPC at a chatter object says nothing" (`NPC_NEEDS_SYSTEM.md:570`). Gary is leashed to IT, so N1 is always alone at the staff-room cooler. Her `cooler` pool can never play.
- The `grumble` pool is spoken only on an avoid or queue turn-back (`NPC_NEEDS_SYSTEM.md:712`). Gary and N1 share a group and avoid nobody, and the kettle is capacity 2, so neither turns back. The `greet` pool is used only by an affordance with `chatter: "greet"` (`npc-needs.js:81` is its only engine use), and 6.3 declares none. Gary's and N1's grumble pools (about 11 lines) and N1's greet pool (about 5) cannot play.
- Exchanges start only inside a running pair with the player in earshot (`npc-needs.js:3904-3908`). With no pair at the IT kettle, neither exchange plays.
- 10 says the pass sets `ttsPregenerateChatter: true` (plan line 572), so every one of these dead pool lines is generated and paid for.

What goes wrong: of roughly 55 to 65 clips, only the coffee pools (and only when the rare kettle overlap happens) and N1's conversation are ever heard. The Night Handover room has a silent NPC who drinks alone. A playtest would report "office life does nothing" and the voice spend is mostly waste.

Fix: design the meeting, then cut every pool that has no trigger.
- Make the IT kettle N1's only caffeine source: don't give the staff-room boiler a caffeine preset (leave it undeclared, or give it `affordance: { "satisfies": "thirst" }` as hot water), and keep the cooler for thirst. Raise the kettle's `useSeconds` (brewing tea takes longer than 12 s) so the overlap is long enough for an exchange (EXCHANGE_MAX_MS is 60 s).
- To make the overlap likely rather than lucky, consider a mapping on Gary for N1's departure (`npc_left_post:<n1>`, if its payload names the target; check this) with `"needs": { "set": { "caffeine": <low> } }` (`npc-needs.js:984-998`). This is optional atmosphere driven by an office-life event, so rule 1 allows it.
- Drop the `grumble` and `greet` pools, and N1's `cooler` pool unless a second staff-room NPC exists. Re-price 6.6 from what can actually trigger, and have V6 or a new V7-style check warn on pools with no reachable trigger.
- The E3, 6.8 and playtest expectations should include "the pair met at least once in a 10-minute run with the player in IT".

## Majors

### M1. Need names and affordances don't match the presets, so the validator errors and printing isn't wired (6.2, 6.3, 6.4)

Evidence:
- The kettle preset satisfies `caffeine`, not `thirst` (`public/break_escape/js/data/office-presets.json:5`), and `officeType: "kettle"` on the boiler gives the same. 6.2 gives Gary "thirst (IT kettle)" and N1 "thirst (boiler, cooler, IT kettle)". IT has no thirst source, so Gary's thirst gets `❌ ERROR: ... need 'thirst' has no object whose affordance.satisfies it` (`scripts/validate_npc_needs.rb:1269-1271`).
- The copier preset has no `satisfies` (`office-presets.json:9`). A `print` need on Gary and N1 therefore gets the same error.
- A printout appears only through an `onUse` hook `{ "<object>": { "revealOutput": "<copier id>" } }` on the NPC, on an object it uses for a need, plus a slot object with `outputOf` and an engine-owned `revealOnGlobal` (`NPC_NEEDS_SYSTEM.md:198-207`; schema `onUse.revealOutput`). 6.3 says only "copier preset, with one reveal slot".
- A print-habit fetch needs a `needsHome` object (`npc-needs.js:3656-3658`). Gary's post is a tile (6.3, 5.8), so his prints are never fetched and `fetchAfterSeconds` and `forgetChance` do nothing.
- If N1 also has `revealOutput` on the copier, her "paper obs charts" print takes the same single slot, whose text is Gary's downtime-pack page.

What goes wrong: stage 4 hits validator errors on the first slice. If an implementer patches them by guesswork, the printout ends up attributed to the wrong person, or never appears at all.

Fix: in 6.2 and 6.3, name needs by the preset vocabulary (`caffeine` at the kettles, `thirst` at the cooler, `hunger` at the microwave and fridge). Give the copier a hand-written `affordance.satisfies: "print"` and put the `onUse` `revealOutput` hook on Gary only, or print through the command in B1. Declare the slot (`outputOf`, `revealOnGlobal`, `type: "notes"`, takeable, position on the tray). Give N1's copier use no `revealOutput` (her prints are cosmetic: the copier sound and the "no free slot" cosmetic copy), or give her a slot of her own with her own text. State that with a tile post Gary's print is always forgotten.

### M2. The recommended N1 role contradicts the ward-staffing beat (6.2 N1 notes, cast)

Evidence: Sister Doyle tells the player "Forty-seven across three wards ..." and "Two of us, manual obs every fifteen minutes, and a biro." (`ink/m02_npc_ward_nurse.ink:143,147`), and "Priya runs everybody else on paper." (`:98`). The handover board heads the staff room "WARD 3 / EXEC" (`scenario.json.erb:3384`). 6.2 recommends a healthcare assistant whose print need is "paper obs charts for the ward".

What goes wrong: a third ward clinician on a tea break in the staff kitchen, with 47 patients watched by two nurses and a biro, contradicts "two of us" and drains the stakes Doyle's scene builds. The player's obvious question, "why isn't she on the ward?", has no answer.

Fix: recommend the night porter (non-clinical, older, which also widens the cast's age range) or another non-ward role (Estates, switchboard, medical records), and give the print errand to fit: porter dockets or downtime transfer forms, or a stack of blank obs charts the porter takes down to the ward, which supports Doyle's line rather than competing with it. Have N1's conversation say what they are doing for the ward tonight in a line or two.

### M3. N1 is the only hospital person whose assault has no consequence (6.2, 6.9)

Evidence: every other person in m02 has a KO global, a credits line and an export. See the credits entries for Bernie, Kim, Gary, the ward nurses and the patients (`scenario.json.erb:195-206`), and the `exportGlobals` list of every `_ko` (`:3576-3580`). 6.2 says N1 "Holds nothing and sets no KO global".

What goes wrong: a player can knock out a hospital worker in the staff kitchen, mid-crisis, and the credits and debrief treat it as nothing, in a mission whose whole consequence design counts each assault. 6.9 step 1 even tests the attack.

Fix: give N1 a `globalVarOnKO` (for example `<n1>_ko`), a credits line ("NIGHT PORTER: Assaulted in the staff room"; credits text is not voiced), and an optional HaX text through a `global_variable_changed` mapping, voiced as phone text with no TTS cost. Leave it out of `exportGlobals` unless a later mission reads it. Add the key to 6.7 (one boolean) and to V4's info line.

### M4. The two exchange gates leave one exchange nearly unreachable and the other at risk of a contradiction (6.6)

Evidence: `cover_burned` is set when `talk_to_gary` completes (`scenario.json.erb:930-934`), and talking to Gary is the next required step on entering IT (`TESTING_WALKTHROUGH.md` step 12 onwards). An exchange needs both NPCs at the kettle with the player in earshot (`npc-needs.js:3904-3908`). So the `{ "cover_burned": false }` exchange can play only if the pair happens to be at the kettle in the few seconds between the player opening IT and clicking Gary. If it does play, it becomes the player's first impression of Gary in place of his written opening. `gary_protected` is also set by Dr Kim's `protect_gary` and `board_coverup` knots (`ink/m02_npc_sarah_kim.ink:287,315`), out of Gary's hearing.

What goes wrong: one exchange is written and voiced and almost never heard. The other may have Gary talking about his job being safe when only Kim knows.

Fix: gate exchange 1 on a state the player meets on later visits to IT (for example `cover_burned` true and `gary_protected` false: two night workers on a burned visitor, which fits the thriller), and write exchange 2 so it holds whoever set `gary_protected` (N1 has heard that someone senior has put it in writing, and Gary doesn't believe it yet). Put any fact the player must not miss in the first line, as the schema says.

## Minors

### m1. Two of the five staff-room declarations don't work as written (6.3)

`undercounter_fridge1` is in the Tiled `tables` layer (`assets/rooms/room_hospital_staff.json`: tables, 6.16, 3.44). The claim pool indexes only `items`, `table_items`, `conditional_items` and `conditional_table_items` (`public/break_escape/js/core/rooms.js:218-223`), so a declared fridge adds a second sprite over the drawn one. The microwave claims by base type with digits stripped (`rooms.js:186-192`), so it is `type: "microwave"`, but the preset lists only `microwave1` (`office-presets.json:8`). So `type: "microwave"` claims the sprite without a preset, and `microwave1` gets the preset without the claim. The wall-mounted boiler (items, 4.75, 1.81) sits above the sink counter (2.19 to 3.44), and the IT kettle sits on the workbench (2.94 to 4.75), so both default `useFrom: {dx:0, dy:1}` cells fall inside furniture. Fix: microwave with `officeType: "microwave"` (or `position: "as-type:microwave"`); either drop the fridge (the microwave meets hunger) or move it from the `tables` layer to `items` in Tiled, as a dressing change with a snapshot; hand-write `useFrom` for the boiler and the IT kettle in 6.3.

### m2. Gary would trip the swivel warning (6.8)

A needs NPC with `los.enabled` gets "Set swivel: false to say so" (`scripts/validate_npc_needs.rb:589-590`). Gary has `los` (`scenario.json.erb`, his `los` block). If he keeps needs, write `swivel: false` and list it in 6.8. This doesn't apply if B1 keeps him stationary.

### m3. Tier range mismatch (6.6 against 10)

6.6 says 55 to 65 clips is "within the Tier 3 range" (plan line 426). Section 10 sets Tier 3 at about 80 to 140 and Tier 2 at 40 to 80 (plan lines 582-584). Fix the wording, or state that the pilot is Tier 2 plus one Tier 3 NPC and is priced as Tier 2.

### m4. The sync table misses keys (6.7)

6.4 gives the printout "its own read global" (plan line 402), and M3 adds a KO global, but 6.7 and 6.8 count "at most 5 small keys" (plan lines 438, 448). Add both and update V8's expectation.

### m5. N1's post and the free items in her room, with a missed teaching beat (6.2 N1 notes)

The lanyard sprite (2.62, 7.08) sits on the west `desk3` (2.28, 7.75), and the laptop (2.89, 4.54) sits on the centre desk (`room_hospital_staff.json`). The lanyard's observation says it was "left on the side with somebody's reading glasses" (`scenario.json.erb:3431`). A post at either table puts N1 within arm's reach of what the player pockets. She is also in sight when the player picks the IT door, which the walkthrough says "Nobody watches" (`TESTING_WALKTHROUGH.md:125`). Fix: post N1 at the east table (6.16, 6.56), facing away from the IT door. Consider an optional bark on N1 for `item_picked_up:id_badge` with `data.itemId === 'contractor_lanyard'` ("Not mine. Not my business."). It catches nothing and gates nothing, and it teaches the Human Factors lesson 6.4 names in a staff voice. Spoken lines in eventMapping `bark` fields are allowed by rule 6.

### m6. N1's ink and the walkthrough need state and doc updates the plan doesn't list (6.2, test plan)

N1's conversation should branch on `cover_burned` (after the burn, "the consultant" is officially nobody) and on `mission_complete`, or say nothing about who the player is. `TESTING_WALKTHROUGH.md:107` says the Night Handover room has "no NPC", and its step 12 says nobody watches the IT door. Add both doc updates to the stage 8 close list.

### m7. The V5 event list is out of step with what the engine emits (4)

These office-life events are emitted but not covered by any stem or name in the list: `npc_borrow_done` and `npc_borrow_dropped` (`systems/npc-workarounds.js:261,271`), `npc_borrowed_session` (`systems/pc-sessions.js:148`), `npc_overheard_login` (`npc-workarounds.js:377`), `npc_used_phone` (`systems/social-feed.js:401`) and `npc_workaround_due` (`npc-needs.js:2502`). The list names `npc_borrow`, which nothing emits. `npc_defeated` (`npc-hostile.js:852`), a combat source, is on neither list. The fixture test would catch these, but the plan states the list as the build spec. Fix: add a `npc_borrow` stem (prefix form `npc_borrow_` plus `npc_borrowed_session`), `npc_overheard_login`, `npc_used_phone` and `npc_workaround_due`, and add `npc_defeated` to the exclusions.

### m8. The roomTone mapping fits a day office, not a dead hospital at 03:00 (6.10)

The `it` profile is the `office_ambient` bed at 0.8 with typing, and `reception` is `office_ambient` at 0.6 with distant phones (`js/data/room-tones.json`). That is a working-office murmur in an IT room with one man in it and a lobby with one receptionist. `roomTone` also gates the kettle-boil and copier sounds (schema `roomTone`, `scenario-schema.json:152`), which the pilot wants. Fix: map the staff room to `kitchen` and IT to `quiet_office`, and leave reception unmapped, subject to the listen check. Note that the noir playlist runs under it.

### m9. N1 changes the staff room's lighting beat (6.3 dressing checks)

The staff room is `mode: "motion"`. A motion room with an NPC in it starts lit and stays lit (`systems/lighting.js:655,729`), so the dark-until-entered beat in the handover room goes. Fix: decide `startOn` in 6.3 (keep it dark until the player enters, with `startOn: false`, or accept that it is lit), and run the lighting loop on the staff room in slice 5 even though no prop moves.

## Nits

- n1 (6, line 336): "It tests the hardest protection." Protection 2 is the simplest of the three; protection 3 is the hard one. Reword as "it tests protection 2 on a story NPC", or drop it along with B1.
- n2 (6.1): Gary's voice style says "running on vending machine coffee" (`scenario.json.erb:2030`), and the vending machines are in the corridor outside his leash. If he keeps a routine, make it instant coffee at the kettle, not tea. The credits line "Assaulted at his desk" (`:201`) also assumes he is at his desk.
- n3 (1, 4): AGENTS.md "Kinds of game" defines the campaign as m01 to m08 (`AGENTS.md:23`). The plan treats m01 to m10 as the ten campaign missions in V5's scope constant. Note the doc gap so the constant and AGENTS.md agree.

Counts: B=2 M=4 m=9 n=3
