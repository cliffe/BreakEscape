# Resolved decisions

Decisions the user has settled, so nobody reopens them. Newest first.

## 2026-10-17 (decisions form, docs/agents/DECISIONS_FORM_2026-10-17.md)

- **ATHENA:** make her translucent in the engine (an optional NPC sprite setting, e.g. alpha with a soft glow or flicker, reusable for future holograms). No AI redraw of her frames.
- **Resume overlay:** Enter = Resume while it's showing; other keys do nothing; clicks work for all three buttons.
- **m01's eight over-long lines:** fix all eight. Split the four voiced debrief lines at natural breaks; trim the four phone texts.
- **TTS top-up:** run it now for m01–m08.
- **Push:** the user pushes themselves. Don't push.
- **Optional polish, all approved:**
  - the last browser check;
  - the off-duty agent's north idle brightness;
  - more takes for Park's "round" mouth;
  - Phantom's mustard north punch coat;
  - another try at the Recruiter's headshot.
  - The user, on colour edits: "consider hand editing them" (scripted recolours saved as overrides, not AI edits).

## 2026-10-17 (carry-over: follow-up answers)

- **Hacktivity events:** earlier runs carry in. **No host switch** ("No need for a switch").
- **`consequences_persist`:** "Doesn't sound like the clearest way to represent variables that save for later. Use your best judgement to make it clear and maintainable." The lead's call: retire it. `exportGlobals` (source) and `importGlobals` (reader) are the one way to say a variable carries forward, so the field is removed from the four mission.json files that set it (m07, sis01–sis03; the schema and validator never had it), and the docs point to the carry-over section instead.
- **m01 exports:** the lead's call: yes. m01 lists `exportGlobals` (JSON only, no ink or audio change), because m01→m02 needs it.
- **Next links: build them all:** m01→m02, m02→m03, m03→m04, m04→m05, m05→m06 (plan section 4), done by subagents, with the same rule that a carried-over line names what the player did.
- **Ideas backlog:** ink-triggered action visemes (e.g. `give_item`), added under "Action frames in talk sprites".

## 2026-10-17 (carry-over: build answers)

- **Carrying choices between missions: build now**, m06 → m07 first, then m07 → m08. The other first uses come later. Built: `docs/agents/CARRY_OVER_PLAN.md` "Built", engine commit 6ed3caa7.
- **Storage:** the user asked, "Don't we already have everything we need? player state and completeness per game slot?" Use the existing Game rows (`player_state`, `status`/`mission_concluded_at`), no new table, no migration. The one addition is `storySnapshot` in `player_state`, because a Restart wipes a concluded game's globals and Hacktivity's Finish marks unconcluded games completed. (Checked during the build: the snapshot is needed, because a Restart must reset globals for the replay to work.)
- **Sources must declare `exportGlobals`:** yes.
- **Runs ended with Hacktivity's Finish button (never concluded) don't count:** yes.
- **A Restart of the reading mission keeps its imports;** a New Session looks them up again: yes.
- **Hacktivity events:** still open. Built the default (a player's earlier concluded runs carry in, defaults otherwise); the host "force defaults" switch is not built.
- **Story telling** (user, verbatim): "call out as clearly as possible when something is a consequence of a previous mission — it is great story telling and give the player feel of autonomy". Every carried-over branch has a character name what the player did in the earlier mission. The never-played branch stays today's neutral line word for word, so its audio still works.

## 2026-10-17 (from the decisions questions)

- **m05, Lisa names Torres too early:** make Lisa vaguer ("someone on the crypto team" with money worries) and leave the name to the vetting files and the door log. The user: "Make sure the challenge is fun and not too hard to figure out, but if the aim is deduction, make the choice that is most fun."
- **m08, how hard the mole is to spot:** leave it as it is now (the two narrator tells are already cut).
- **Player HP survives a reload:** save and restore it, restoring full HP from 0. Save hostile NPCs' HP too (m08 E12), so a reload heals neither side.
- **Credits overlay text:** each of m05–m08 gets its own `creditsOverlay` operation and ticker. The operation row defaults to the mission's name when none is set.
- **Art fixes approved:**
  - Priya's wall plaque (m06 blockchain lab background);
  - the m06 HQ debrief window at night;
  - the m07 situation board going red after step one runs (L1 option A);
  - the m08 RECORDING lamp as a lit scenario object (L1).
- **Engine backlog approved:**
  - lock feedback: m07 U9 RFID reader with an empty cloner, m07 E1 flag lock with no `requires`, m07 E4 case-sensitive password hint, m08 E2 PIN keypad names its lock;
  - phone during fights (m07 U12);
  - text and variants: m08 E5 variants in the dusting panel and lock/container headers, E3 dusting text wrap, E1 objectives key wording;
  - the validator knows `facePlayerDistance`/`personalSpace` (m08 E8);
  - sight circles hidden after a KO or a spent catch (m08 E9).
  - m08 E6 (a reopened hub repeats its last line) stays **not approved**, per 2026-10-16, although it was listed in the "text and variants" group.
- **Carrying choices between missions:** plan it and propose it, but don't build it yet. The user's idea: feed in earlier completed missions' state as read-only globals (e.g. `m01-scenario-path-variable-1`, taken from the most recent completed matching mission), declared simply in scenario.json.
- **PixelLab quota expanded** (Tier 3, 5,490 generations left on 2026-10-17): the m07/m08 walk characters and the Architect's in-person sprite go ahead now.

## 2026-10-16 (from the pending-decisions form)

- **No "resume in the room you left".** A reload or a Restart after a knockout puts the player back in the start room. Loading the last room risks bugs with rooms that aren't loaded, and the walk back is a fair small cost of being knocked out. Don't propose it again; stop logging it as an engine item (it was m05 D18 M1, m07 E5/U11 in part, m08 E10).
- **A reopened conversation showing the previous line above the hub (m08 E6, form 7.3b): not approved.** Leave as is.
- **Calls kept:** every orchestrator call in form section 5 stands, except m05's CyBOK trim (5.3), which is redone with the CyBOK mapper skill for m05–m08.
- **Healing:** coffee cups and other consumables become health boosts (no out-of-combat regeneration).
- **Hostility reset on respawn:** only for NPCs that aren't knocked out; track what the NPC holds.
- **Punch cone:** widen slightly (no auto-facing).
- **Vision cones:** don't draw them for hidden or knocked-out NPCs.
- **POV backgrounds:** office ceiling lights throw symmetrical light, never a slanting beam (now in the room-pov-background skill).
- **Rooms follow their POV background when they differ** (m04 operations office: the room was changed to match the background).
