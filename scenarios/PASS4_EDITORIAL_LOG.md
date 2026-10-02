# Pass 4 — editorial log (m02–m08)

Started 2026-10-02. Brief: `docs/agents/PASS4_BRIEF.md`. Method: `AGENTS.md`.

User decisions for this pass (2026-10-02):
- Full `scenario-design-review` of each mission, fixed iteratively, then a full `npc-dialog-review` and script-editor rewrite of every ink file, with the humanizer rules applied.
- m01 is the example and isn't edited. m02 goes through the full process.
- A voice bible joins the universe bible (`story_design/universe_bible/04_characters/voice_bible.md`).
- Ideas beyond a mission's scope go in `docs/IDEAS_BACKLOG.md` for the user to consider.
- U2: fix Val's catch in m02 (user's suggestion: Val outside the security room, with that door locked for picking).
- U3: fix "You:" lines in phone chats.
- m02–m08 audio is generated after this pass; m01 audio now.

## Carried forward from pass 3

- **Audio.** m01: run on 2026-10-02 hit the Gemini daily limit after 1 new file; 1 line still to generate (`scripts/tts_batch.sh m01_first_contact` after the quota resets). m02–m08: after this pass.
- **Lab sheets and SecGen** are committed (HacktivityLabSheets 38f5d96, SecGen e5a3eba19) but not pushed, so the new field-guide URLs 404 until published.
- Minor notes from pass-3 playtests, for the design reviews to confirm or close: m08 "I'll need access." persists until a reload; m08 `mission_complete` on the backstop path; Netherton's resumed check shows choices without the question; a stale bark after reading.

## Decisions taken by the orchestrator

- **U3 done (engine, user-approved).** Phone chat renders `You:`/`Player:` lines and `#speaker:player` lines as player bubbles, stores them as type `player` (read), and fixes older saves on load. Node 127/127, Rails 474/0, reopencheck 0, browser check m05 Patricia with reload (`tools/playtest/u3-m05-1361-*.png`).
- **m03 design review → fixes.** All 22 fixes mission-local; fix 4 done in m03 only (debrief says the search team recovered the drive); the recruited-Victoria promise softened to an open thread (backlog: bring her back later).
- **m06 → fixes 1–17 approved**, fix 1 (a real follow-the-money puzzle) the priority; briefing cut towards m01's length.
- **m08 → fixes approved** incl. fix 1 (clone Netherton's card, lift a print in the finale) and fix 2 (hold the keycard until the three interviews; the badge printer stays the earned early route), because otherwise a player can skip the investigation entirely.
- **m04 → fixes approved.** Operatives get a probed hostility/LOS path and a real stealth option; the fingerprint security point is spoken; the debrief's unfollowed threads (Task Force Null, Voltage's interrogation, Calder Wharf) are softened to open threads in m04. Note for m05's dialogue writer: one line in m05's briefing could pick up Voltage's interrogation if it fits.
- **Style guide and voice bible written** (`story_design/universe_bible/09_scenario_design/dialogue_style.md`, `04_characters/voice_bible.md`; pointers in README_ink_best_practices.md, the universe bible README and five character files). Voice drift adopted: HaX's in-game voice (not the canon file's axolotl catchphrases), pronoun "she", 🦎 optional for good-news texts; Nightshade's job title from m02 ("cryptographic-hardware analyst") with m02's cheerful voice as the base; the Architect as voiced in m07.
- **m08 canon fixes (to the m08 fixer):** Nightshade's "same cohort fifteen years ago" contradicts m01's new agent, so m08 changes; Netherton's "eleven years" becomes canon's ~five.
- **Tooling done:** `scripts/ink_runtime_check/dialoguelint.mjs` (lengths, You: echoes, AI tells, US spelling, "Cyber Security"); six validator false positives fixed in `scripts/validate_scenario.rb` (no new INVALID in any mission; one new true warning: m07 has two routes to `cable_vault`, mark one `puzzle_graph_optional` if intended). Node 147/147. Lint baseline (line-len errors): m01 8, m02 155, m03 26, m04 10, m05 31, m06 6, m07 109, m08 88; You: echoes m03 77, m05 79.
- **U2 / m02.** The review found the deeper cause: any player holding a key gets "Switch to Lockpicking", which skips the catch check (`unlock-system.js:175-187`, `lockpicking-game-phaser.js:406`), and Bernie always hands over the IT key. Taken: engine fix A (run the same check on "Switch to Lockpicking"), as part of the approved U2 fix; option B (Bernie opens the door instead of giving the key) would lose a story beat. Val moves to the corridor outside a key-locked security office (your suggestion), with talk / blind-spot pick / KO routes. All m02 fixes approved; the player now deduces the insider rather than HaX naming him.
- **m03 fixes done** (verified: only m03 files changed; validator 0 errors; reopencheck 0). The post-clone phone call is replaced by a short narrated day→night cutscene (hidden NPC `night_transition`) followed by HaX's text, since a person-chat shouldn't open while a phone chat is closing. ~39 spoken lines added, 17 changed, 9 removed. In-game text no longer hard-codes the subnet (P2 mostly closed; SecGen's nc_message still names 192.168.100.0/24).
- **m06 fixes done.** Follow-the-money puzzle: the fund document sits in a PIN-locked Custody Console in the data centre; the player matches three ENTROPY deposits through the mixer (1.5% fee, 6-hour hold) to cold slot 4471, with one decoy per deposit and graded nudges from Priya and HaX. Spoilers removed elsewhere. A turned Irina tells the slot and Satoshi's safe code (spoken, not an item, so a KO can't drop the answer). Briefing cut 342→113 lines. Fingerprint use skipped (would be forced). ~95 spoken lines added/changed.
- **m04 fixes done.** Relay challenges you on entering Hall 2 (probed in a browser). Stealth is delivered through the cloner: keep Relay talking and clone her card, then slip past while she patrols; no fight is mandatory anywhere. The 61°C turn arrives as HaX texts; the night foreman beat on the hydrogen alarm. Second print (Voltage on the bypass) at easy. Debrief gains "what failed" and "big picture" sections. ~67 ink lines and 14 HaX texts.
- **m07 round 2 done.** HaX says "Let it hurt afterwards, not during." in her first call, so the Architect's echo is earned; Mercer acknowledges the abort; Park pointer on HaX's hub; credits match each stance; Elena "below freezing". Canon: Marcus Tesseract (institute founder) becomes Adrian's younger brother. Engine cause confirmed: keys never apply `onPickup` (`inventory.js` addKeyToInventory); m07 works round it.
- **U2 engine fix A done.** New `public/break_escape/js/systems/lockpick-catch.js` shares one watcher check between the direct pick path and "Switch to Lockpicking" (`unlock-system.js`, `minigame-starters.js`, `tool-manager.js`). Node 147/147, Rails 474/0; browser: m06 turnstile and m03 night guard catch once via the switch, pick opens with the guard's back turned, m03 grace/strike behaviour unchanged, m02 key path unchanged.
- **m04 re-review 1:** another round. The quiet route is closed by four of Relay's five first choices (so a fight is still effectively mandatory); the 61°C turn reads as a toast. Taken: a last sticky clone choice before she turns, and the 61°C beat as a short HaX phone conversation.
- **m03 round 2 done.** Telling the guard you're SAFETYNET or bribing him now really lets the pick go ahead, and costs the Perfect Stealth award (his promise was otherwise a lie). The night scene shows the player's own portrait with no background. All-flags texts wait for the revelation call to finish.
- **m02 fixes done (incl. U2).** Val guards a key-locked security office from the corridor (talk / blind-spot pick / KO + her key); `cover_restored` now means someone vouched, so the COVER BURNED outcomes are reachable. Ghost's offer comes on first console use and adds a fourth restore source, "Ghost's Keys". The player names the insider (HaX only nudges). An unnamed Reeves becomes a walk-out ambush that always leads into the debrief (was a fight racing the debrief). Each patient and Raval have their own KO handling. ~54 new / 27 changed spoken lines.
- **Calibration mission for the dialogue pass is m07** (first through design), not m02 as first planned; the user sees DIALOGUE_SAMPLES.md before the rest roll out.
- **User approved the m07 dialogue sample for all missions.** m07's script-editor review: "revise (light)" (three over-cuts: debrief casualty figures, a VM hint's scan guidance, an Elena antecedent); the lessons went into the writer brief for the rest.
- **Engine bugs from playtests, being fixed (needed to finish approved work):** container catches never fire and catches leak to NPCs in other rooms (both in this pass's U2 fix); keys never apply `onPickup`; the Mission Brief popup can displace the opening briefing; the tutorial prompt returns after a decline.
- **m04 combat:** damage cut (Cipher 4, Relay 5, Static 4, Voltage 12); a steady player survives all three fights (100→30) without healing, a slower one wouldn't. A heal item and a room leash need the engine (backlog).
- **Engine fixes done (uncommitted):** catches use the right room for containers and only the watching NPC reacts (`lockpick-catch.js`, `npc-manager.js`); keys and other inventory items apply `onPickup` (`inventory.js` `applyPickupAction`); the Mission Brief waits for the opening briefing (`helpers.js`); the tutorial decline is saved in the game's globals (`engine_tutorial_declined`); a scripted phone call no longer wipes the thread (`phone-chat-minigame.js`); waypoint patrols aren't cut short by the re-target timer (`npc-behavior.js`). Node 161/162 (the one failure is the tagdiff-vs-HEAD test, expected until the mission ink is committed), Rails 474/0, reopencheck 0; browser-checked in m02, m03, m04, m07.
- **Phone narration (engine, small):** `Narrator:` lines in phone chats showed as the contact's bubble with a literal prefix (m02, m05, m07 inks). Taken: render them as narration in phone chat, as person-chat already does (finishes the U3 work).
- **m05: no influence feedback tags** (orchestrator decision). In a whodunnit a "+ Influence" popup could hint at who's telling the truth.
- **Person-chat reopen (engine, small):** a conversation reopened in the same session showed a blank box with only buttons (m03, m06, m08). Taken: when reopening prints nothing, re-show the NPC's last line; does nothing where the ink already prints a re-entry line. This is the "Person-chat resume" backlog item, done because it recurred in three missions.
- **m08 fixes done.** The player clones Netherton's card (he refuses to hand it over; EM4100, clone rule followed) and lifts Nightshade's print off the USB stick (first print on a carried item; unproven, playtest step 8; fallback: the locker). "I'll need access." says "Not yet" and names unseen suspects until all three interviews are done; the badge printer stays the early route. New required task `get_suite_code`. Canon: Nightshade has fifteen years' service and taught the player's intake; Netherton has run field operations for five years. ~44 spoken lines.
- **m07 fixes done.** Debrief now waits for "Bring me in." (8-min fallback); Threat Desk Summary in start kit; `elena_met`; the Architect's "I merely publish the schedule" as a signed line on the decode (no TTS cost); Tesseract plant: the Architect echoes a line HaX teaches ("Let it hurt afterwards, not during"), and HaX recognises it as from "somebody who taught a lot of us" (no name). Canon updated in the_architect.md, the HaX file and the voice bible. ~13 new spoken lines, 7 changed.
- **Validator gaps (tooling)** from the reviews (m06 fixes 19–20 and others) will be fixed together by one agent once all reviews are in.
- **U3 follow-ups (engine, small; taken because the writers need the convention settled).** Strip the contact's own name prefix from phone bubbles/barks/preview/TTS; stop handleChoice losing lines when the phone closes mid-typeout; barks skip a leading player line. Done: node 135/135, Rails 474/0, reopencheck 0, browser check with reload (`tools/playtest/u3b-m05-1361-*.png`). Also a guard so a typeout still running can't write into another contact's thread. Not done: the no-Phaser fallback phone UI in npc-barks.js.

## Commits

User decision 2026-10-02: commit each mission as it completes.
- 44e3c383 engine pass 4 (phone player/narrator lines, lockpick catches, onPickup, brief/briefing order, tutorial decline, patrols)
- 9256ab10 universe bible (voice bible, dialogue style guide, canon)
- a6ba802c m07
- e7cfc940 m04
- 715a4462 m06
- 82c45519 tooling (tagdiff, dialoguelint, validator recurring-bug checks, inkcheck)
- 3d95bfc9 m03
- 8770ace6 docs and skills (validate-scenario, scenario-design-review, playtest-scenario; npc-dialog-review left uncommitted because it holds the user's own edits)

## Items for the user

**User answers, 2026-10-02:** P1 keep the mole hints as subtle foreshadowing; P3 make m05 a real whodunnit (sent to the m05 fixer); P6 keep the Tesseract lead and pay it off in m07, updating the bible (sent to the m07 fixer); P5 make the SSH sheet example neutral (Sonnet agent; not committed); P4 don't push HacktivityLabSheets or SecGen yet.

- **P1. m03: Nightshade's "one day it'll be our badge somebody clones"** (`m03_opening_briefing.ink:175`). Reads as a hint at the m08 mole; m03's own notes say "no m08 hint". A quiet early hint is good thriller craft, so this is a canon call. Left as it is until you decide.
- **P1 also covers m05:** Nightshade's "catching a mole" line raises the same question (how much m08 foreshadowing do earlier missions get).
- **P3. m05: whodunnit or "prove it and decide"?** The briefing promises a whodunnit, but the flyer, the to-do list ("Get a keycard for Torres' office", erb:251) and Patricia's menu point at Torres from the start, and naming always produces Torres (pass 3 accepted this as F11). Options: (a) rewrite the briefing honestly as "prove it's him, then decide what to do with him" (cheap; review recommends); (b) make it a real whodunnit: remove the early pointers, give one or two existing staff a plausible motive and some misleading evidence, and make naming depend on evidence (more fun, more work, more spoken lines). On hold; the fixer leaves room for either.
- **P4. Push HacktivityLabSheets** (38f5d96, "ahead 1"). m07's NFS guide link `nfs-and-netcat-leaks` 404s until it's published; the same goes for the other two new sheets.
- **P5. `ssh-access-and-bruteforce` lab sheet** uses m02's hospital and `192.168.100.50` as its example, which is also m07's own Kali address in the standalone setup. Proposal: make the example host mission-neutral (HacktivityLabSheets edit).
- **P6. m06: the Tesseract lead** (m06 review fix 18). m06 names the Architect as "Dr. Adrian Tesseract, ex-SAFETYNET, HaX's teacher" (season plan `quick_reference.md:83,:120`; PASS2 sign-off), but the bible says "identity unknown, even cell leaders don't know" (`the_architect.md:6,:444`), and m07/m08 never pick it up. Options: (a) update the bible and plant one follow-up line in m07 or m08; (b) soften m06's file to an unnamed ex-SAFETYNET strategist so nothing dangles.
- **P1 update:** m08's fixer now has the player clone Netherton's card, which pays off Nightshade's m03 "our badge somebody clones" line. That argues for keeping the m03/m05 lines as deliberate foreshadowing.
- **P8. m03 `lab_sheet/` drafts** (FIELD_GUIDES_README.md and two SAFETYNET_FIELD_GUIDE_*.md). Stale drafts that nothing links to; the published sheets live in HacktivityLabSheets. The fixer's attempt to delete them was blocked by the permission system, so they're left for you: delete or keep?
- **P7. SecGen items needing a real build:** m04 ProFTPD module path (m04 fix 24); m08 flag order. No VM builds in this pass.
- **P9. SecGen m05 description names Torres as the insider** (`SecGen scenarios/break_escape/safetynet/m05_insider_trading.xml:12`). A spoiler for the new whodunnit if Hacktivity shows the description to players. Proposal: reword to "an insider at the lab" (one-line SecGen edit).
- **P10. Reload respawns the player in the start room** (engine + server; M). `window.currentRoom` is never assigned, so the room isn't synced, and `sync_state` returns 403 if the room isn't unlocked (`games_controller.rb:639-649`). A proper fix needs a non-fatal room check on the server and a restore-into-room path on the client. Not done; in the backlog.
- **P11. Torres (m05) and Cipher (m08, the red herring) share `male_nerd_v2`.** Every other existing male sheet clashes worse in m05. Options: a bespoke Torres (PixelLab, one character), or recast Cipher in m08. Left as is for now.
- **P12. npc-dialog-review skill:** your uncommitted §2a-ter says `#speaker:` keys resolve to NPCs "by prefix"; the engine doesn't (`determineSpeaker`, person-chat-minigame.js ~679-715, ignores two-part tags other than player/npc). The pass-4 §2i documents the real behaviour. Please reconcile, then commit that skill.
- **P2. m03 subnet / ".50" host** may not match how SecGen builds the VM (from reading the SecGen file; no VM build). The fixer makes the text build-agnostic where it can; a real Hacktivity build would settle it.

## Mission status

| Mission | Design | Dialogue | Status |
|---|---|---|---|
| m02 | 3 rounds, confirmed | writer, script edit, playtest round; pre-commit check 6/6 | **done, committed 4f7b8763** |
| m03 | 2 rounds, confirmed | writer, script edit, 2 playtest rounds; final 8/9 + fixes | **done, committed 3d95bfc9** |
| m04 | 2 rounds, confirmed | writer, script edit, playtest round; final confirmation 7/7 | **done, committed e7cfc940** |
| m05 | 3 rounds, confirmed | writer, script edit, playtest round; pre-commit check 6/6 | **done, committed a5556cd7** |
| m06 | 2 rounds, confirmed | writer, script edit, playtest round; final confirmation 6/7 + re-entry fix | **done, committed 715a4462** |
| m07 | 3 rounds, confirmed | writer, script edit, 2 playtest rounds; final confirmation 16/16 | **done, committed a6ba802c** |
| m08 | 2 rounds, confirmed | writer, script edit, playtest round; final confirmation 8/9 (dashes in item text → engine) | **done, committed f3cf165f** |
