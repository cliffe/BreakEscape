# The Keyholder Trials: design review, round 3 (confirmation)

## 1. Scope and method

Reviewed: `DESIGN.md` v3 (with "Changes in v2" and "Changes in v3"), against `docs/agents/TESSERACT_TRIALS_BRIEF.md`, `DECISIONS_LOG.md` (its decisions override reviewers), `DECISIONS_PENDING.md`, the four earlier reviews and `AGENTS.md`.

Kind of game: lab scenario with SAFETYNET spy framing. A short escape room where every lock opens in CyberChef, with no quizzes, no new engine features and no assumed knowledge. D3 sets the play-time target at 60-75 minutes.

What I did beyond reading:
- **Engine paths, read at file:line:** phone-chat open, restore and reopen re-run; preload; person-chat event start and close; the event-mapping handler; the NPC note hand-over; the notepad's observation split and editing; `text_file` `onRead` in the world and in containers; the scenario brief; mapping conditions; and the uncommitted D2 diff in `game.rb`.
- **Generation:** `tools/generate.rb` on seeds **17** and **2026**, each checked by `tools/verify_independent.py` (20/20 PASS both) and by `tools/verify_cyberchef.mjs` (34 PASS, "ALL PASS" both). Outputs are in `scratchpad/review-r3/` (`g17.json`, `ind17.txt`, `cc17.txt` and the 2026 set).

I didn't run anything in a browser. Severity: **blocker** means the target player can't finish; **major** means change it before the build; **minor** means fix it during the build.

## 2. Closure of round-2 majors

| Finding | Status | Evidence | Residue |
|---|---|---|---|
| **N1** Keyholder re-entry routing | **closed** | A reopened contact with history and a saved story restores `npc.storyState` (`phone-chat-minigame.js:435-440`). It then re-runs the knot that owns the first choice, and only when a global the story declares has changed (`phone-chat-conversation.js:587-603`; the knot comes from the first choice's `sourcePath`, `:605-609`). v3 puts the router at the top of `waiting`, `the_offer_again` and `refuse`, keeps it in `start`, guards the refuse choice with `not decision_made`, and adds the `relay_opened` catch-up (DESIGN:551-592). I traced K1-K9 against that code and each lands where the table says. The video call doesn't move the device's position: person-chat saves into `npcConversationStateManager` (`person-chat-minigame.js:1627-1629`), and phone-chat applies only the *variables* from there, which the restored `npc.storyState` then overrides (`phone-chat-minigame.js:412-414`, `npc-conversation-state.js:250-265`). | Three minors: R3-1 (the call rewrites `ghost.currentKnot`, so a device first opened after the call enters at `the_offer`), R3-3 (the ink must declare the globals its router reads, or nothing re-runs) and R3-4 (`the_offer`'s exits in phone mode). |
| **N2** fallback note in a closable briefing | **closed** | Three independent hand-over points. (1) The note is on the briefing's first line (DESIGN:503). Person-chat processes a batch's tags before it shows any text (`person-chat-minigame.js:1003-1009`), so closing at once still delivers it; `give_item:notes:<id>` is parsed (`chat-helpers.js:93-108`). (2) The written brief repeats the rule (DESIGN:110), and the brief is added to the notepad on every load, popup or not (`utils/helpers.js:20-23`). (3) HaX holds `comms_discipline_hax`, offered while `!comms_had` (DESIGN:384), plus a reminder text on `get_lab_laptop`. An NPC-given note emits `item_picked_up:notes` with its `itemId` (`npc-game-bridge.js:40-46`), so the one-mapping-per-id `comms_had` works. | One story minor (R3-12): after the device is taken, the reminder sends the fallback channel over the line Ghost says it reads. |
| **R2B-M2** signature and hash checks | **closed** | Observations on `report.sha256` and `report.sig` (DESIGN:149-150) and FN10 (DESIGN:399) name the Base64 text as given, Message format Raw and SHA-256. On both of my seeds the CyberChef run gives "Verified OK" for the right inputs and "Verification Failure" for each trap: decoded text as Message, format Base64, SHA-1, trailing new line (`cc17.txt`, `cc2026.txt`). | none |
| **R2B-M3** tracking pixel never taught | **closed** | Planted on the sign-up laptop (DESIGN:102), explained by Tom (DESIGN:647), named in FN10 (DESIGN:399) and in the debrief on every route (DESIGN:761). The URL says `/px/locate/` (`generate.rb`, checked by the independent verifier on both seeds). | none |
| **R2B-M4** carrying the IV, key and ciphertext | **closed in design; R23 probe stands** | The tag's `observations` carry "Key: ____ IV: ____" (DESIGN:129). The notepad splits a note into main text and observation (`notes-minigame.js:417-420`), and the observation box is what the pencil edits and saves (`:524-560`, `saveObservationToNote`). Pointers to it are in FN1, Trial VII, the L7/L8a rungs and the pigeonholes nudge. | Survival across a reload is still R23 for the first browser run. |
| **R2B-M5** leaflet whole-note copy | **closed** | The leaflet's text is the codes only; the fingerprint is in observations (DESIGN:105; `generate.rb` `leaflet_text`). The notepad shows the observation in its own box (`notes-minigame.js:417-420`), so selecting the note's text selects only the codes. The verifiers pass "L1 leaflet text is codes only" on both seeds. | none |
| **R2B-M6** driving CyberChef not written down | **closed** | FN1 gives Input, Search → Recipe, Output, the bin, the pop-out ↑ and the notepad pencil (DESIGN:390). | FN1 is now the longest note. Fine, because it's the most-used one. |
| **R2B-M7** Sidhu's scene unprompted | **closed** | Planted when he gives FN10; pointed at by `report.sig`'s observations ("Dr Selvarajan would want to see this."); a past-tense line after the decision (DESIGN:679-683). | none |
| **R2B-M8** choice not hard | **closed, by designer decision (logged)** | Lever 2: Ghost prices refusal (Megan), sending ("you start Monday") and any trick ("a third offer"), plus HaX's workshop remark (DESIGN:632-636, :673-677). Lever 1 was rejected with reasons, and DECISIONS_LOG records it. Each line is true, so the debrief retracts nothing. | none |
| R2B-M1 (unlock method trust) | **went to the user as D2: decided** | User approved the engine fix (DECISIONS_LOG). It's in the working tree, uncommitted: `game.rb` +107 lines (`unlock_method_matches_lock?`, `UNLOCK_METHODS_BY_LOCK_TYPE`) with model and integration tests. | DESIGN still says D2 is "with the user" (R3-8). The fix changes one build rule (R3-9). |
| R2B-M9 (play time) | **went to the user as D3: decided** | 60-75 accepted, all locks kept, and a timed blind playtest decides any cuts in Q3's order. | v3's planning figure is about 74 (65-80), at the top of the agreed range. Q3's ordered cut list is ready if the playtest runs over. |

### Spot-checked minors

| Minor | Checked | Result |
|---|---|---|
| N-m1 / R2B-m3 answer length | DESIGN:187, rule 7, R11; the verifier reports the longest answer (12 on seed 2026) | fixed |
| N-m3 one mapping per id | Rule 15; mapping conditions have no `\|\|` (`npc-manager.js:15-102`) | fixed |
| N-m7 Cliffe's hide | Own `room_entered:common_room` reading `workshop_open`. The validator accepts an own-room catch-up (README_scenario_design.md:1560) | fixed |
| N-m10 sticky debrief choice | `#set_global` emits even for an unchanged value (`chat-helpers.js:477-497`) | fixed |
| N-m12 notes in containers | Rule 13 | fixed |
| R25 (does the call emit `conversation_closed:ghost`?) | Person-chat emits it in cleanup for every mode, video included (`person-chat-minigame.js:1632-1641`) | **closed by code read**, so the hub-choice fallback isn't needed. See R3-2 for the side effect. |
| R2B-m5 "returns shelf" | `generate.rb` `l5_plain` | fixed |
| R2B-m13 pools | `generate.rb`: WORDS_T1, T3, T4, T6 have 26 each; PASSPHRASE 10 | fixed |
| R2B-m1 HaX's m02 line | DESIGN:506 now has the player seeing Ghost's hood, not the other way round | fixed, but see R3-6 for the debrief's pay-off |
| R2B-m11 Ghost's lines | Camera line, offer callback, both off-voice lines rewritten (DESIGN:518, :522, :625-627). m02 has "I'm going to make you an offer. Once." (`m02_phone_ghost.ink:550`) and "Tonight I have had it on you." (`:453`) | fixed. See R3-7 for one canon nuance. |

## 3. Regressions from the v3 changes

| Area | Still right? | Notes |
|---|---|---|
| **Lock order** | yes | L1 → L2 → L3 → L4 → L5 → L6 → L7 → L8a → L8b → L9 → L10 → scoreboard, unchanged from v2. v3 changed only text, observations, pools and globals. Both seeds pass every step in both verifiers, including the IV taken from the Vigenère output into AES Decrypt. |
| **Gating** | yes, and stronger once D2 lands | Answers and locked contents are still stripped (`game.rb:1862-1880`), and the container endpoint still refuses (`games_controller.rb:491-496`). On both seeds a missing IV gives "Invalid IV length" and a zero IV errors. The uncommitted D2 fix checks the claimed method against the lock type, which closes the console bypass DESIGN:211 describes. One build-rule consequence is R3-9. |
| **Endings' reachability** | yes | Sent and blown come from HaX's hub (`ghost_offer_made && !decision_made`). Refuse comes from the call or from `the_offer_again`, guarded at the choice and at the top of `refuse`. Double comes from the token on the scoreboard, then send. Late warning and warn-then-refuse are covered (DESIGN:668-671). Each `decision_made` route reaches the sticky debrief choice. `concludeRequires` names only `open_relay_terminal`, and optional `warn_handler` doesn't block the aim (R2-A W6). The new pricing lines add text, not gates. |
| **Debrief conditions** | yes, with one wording gap | Opening by `ending` (four variants), the pixel line on every route, `report_read_claimed` on sent (both answers accepted, read by the credits), `late_warning`, thanks for the token when warned then refused or blown, Megan by `megan_choice` × ending. The gap is R3-6: "I was wrong about the cameras" pays off a briefing line the player may never have heard. |
| **Beginner teaching sequence** | yes | Steps 0a-0d still come before L1. v3's additions slot into the existing order: driving CyberChef in FN1, the IV in one sentence at Trial VII before FN8, "256 bits = 64 hex digits" building on step 0c, the pixel planted an hour before the climax. Nothing is taught out of order, and there are still no quizzes. |
| **Ghost / HaX canon** | yes, one nuance | Ghost: "they"; Iapetus; on screen only; never unmasked; still at large ("Ghost remains at large."). The offer callback and "Tonight I have had it on you" are real m02 lines. HaX: "she", Aoede, the 🦎 only on good news, "That's classified" about Cliffe. The double ending stays lab-local, away from m08. The nuance is R3-7 (m02's monitors also say NO SIGNAL). |
| **Text schedule** | yes | Every pair on one event is at least 4 s apart (2/8, 1.5/7, 2/8). Two cross-event cases are already marked for probing in the first run (DESIGN:543-544). |
| **Late-room event rule** | yes | Ghost and HaX are phone NPCs listed in the foyer, the start room, so their mappings register at game start (README_scenario_design.md:1560). Jordan's hide mapping is in the foyer, and Cliffe's uses his own room's catch-up. |

## 4. New findings

No blockers and no majors. All of these are minor.

**R3-1 (minor, N1 residue): the video call rewrites `ghost.currentKnot`, so a device first opened after the call enters at `the_offer`, not `start`.**
- `_handleEventMapping` sets `npc.currentKnot` to any mapping's `targetKnot` (`npc-manager.js:812-816`). It does that before the video-call branch, in the same function (`:1004-1025`), so the call mapping's `targetKnot: the_offer` leaves `ghost.currentKnot = 'the_offer'`. This setting is saved and restored on reload (`:1771`, `:1834`).
- Rule 5's "with no `currentKnot` the story starts at `start`" is then true only until the call. Afterwards, three paths go to `the_offer`:
  - the preload on pickup (`phone-chat-conversation.js:703`);
  - a fresh open (`phone-chat-minigame.js:357`);
  - the device's own pickup mapping, which falls back to `npc.currentKnot` (`npc-manager.js:1037`).
- `resolveEntryKnot` keeps `the_offer`, because `start` routes elsewhere and the two runs differ.
- The cases this hits:
  - a player who left the device in the lockbox (N-m4's path) and takes it after the call. The whole offer replays as terminal text, probably twice (the preload, then the mapping's explicit knot: the E1 pattern);
  - the K3/K4 catch-up, where the device rests on `the_offer`'s own choices. Any later change to a declared global re-runs the whole offer, not just a router.
- `ghost_greeted` is set in `start` by a `#set_global` tag only. In the preload that tag is deferred (`phone-chat-conversation.js:689`, `:737-739`), so on the catch-up `the_offer` reads it as false and tells a player who is holding the device "You left my device in the box."
- Fix (ink and one condition):
  - make the first line of `the_offer` `{ghost_offer_made: -> route}`, *before* it sets the flag. It enters with the flag false on both the call and the catch-up, so neither changes;
  - add `~ ghost_greeted = true` in `start` alongside the tag;
  - condition the device's `item_picked_up:phone` auto-open mapping on `!globalVars.relay_opened`, so a late pickup opens from the inventory onto the preloaded thread instead of an explicit knot;
  - add a state **K10** (device first taken after the call, before and after a decision) to the reopencheck list;
  - reword rule 5 to say the call sets `currentKnot`.

**R3-2 (minor): the FN10 fallback's trigger is inconsistent, and the one in the text schedule fires at L1.**
- Section 6 says FN10 is offered "when the relay terminal opens" (DESIGN:383). The text schedule puts it on `conversation_closed:ghost` with only `!fn10_had` (DESIGN:544).
- Phone-chat emits `conversation_closed:<npcId>` too, on every close of the thread (`phone-chat-minigame.js:909-925`, `:1113`). The Keyholder device's first close, at L1, would offer the signatures note an hour early. As a onceOnly mapping, it would then be spent.
- Appendix A's row "Phone chats never emit `conversation_closed`" (DESIGN:875) is stale for the same reason.
- Fix: pick one trigger. On `conversation_closed:ghost`, the condition should be `globalVars.ghost_offer_made === true && !globalVars.fn10_had`, with `onceOnly`. Correct the Appendix A row.

**R3-3 (minor, buildability): the Keyholder ink must declare every global its router reads.**
- The reopen re-run happens only when a global that the story declares as a `VAR` has changed (`phone-chat-conversation.js:590-603`, using `GlobalVariableExistsWithName`). DESIGN:549 says "declared global" but doesn't list them.
- `phone_ghost.ink` needs a `VAR` for each of:
  - `decision_made`, `ghost_offer_made`, `relay_opened`, `ghost_greeted`, `ending`, `megan_choice`;
  - `special_collections_open`, and every progress flag behind `waiting`'s progress line.
- Without them a reopen shows stale choices, and K4-K8 fail silently.

**R3-4 (minor, buildability): `the_offer` runs in two modes, and its exits aren't specified.**
- On the call it runs in person-chat (video); on the catch-up it runs on the terminal-themed device. The design gives its choices, but not where each goes in phone mode.
- `[I'll think about it.]` should be `#exit_conversation` then `-> the_offer_again`, and refuse should end with an exit then `-> closed`. Without that, the device rests mid-offer.
- The video-only stage lines ("The terminal text goes dark…", Cliffe soldering) need either a phone-safe wording or a gate. A "Close the device." choice in `closed`, reached from refuse on the call, also reads oddly on a video call.
- Say which lines are call-only.

**R3-5 (minor): reading `report.b64` re-emits `global_variable_changed:relay_opened` every time.**
- `text_file` `onRead` sets the global and emits on each read, in the world and in a container (`interactions.js:1378-1392`, `container-minigame.js:476-492`). That's the R26 cover working as designed.
- Anything else keyed on that event re-fires on every read: the `spy-action` music switch (DESIGN:463), and the FN10 offer if it stays on "relay opens".
- Make those `onceOnly`, or condition them on `!globalVars.ghost_offer_made` (for the offer) or `!globalVars.decision_made` (for music). The call mapping is already guarded.

**R3-6 (minor, debrief): "I was wrong about the cameras" pays off a line the player may never have heard.**
- HaX's "Ghost never saw your face" sits behind an optional briefing choice (`[Ghost knows me…]`) in a briefing that can be closed and never replays (DESIGN:496-506). The debrief's Why-0x00 beat (DESIGN:767) assumes the player heard it.
- Fix: set a global on that briefing choice (e.g. `why_me_asked`) and branch the debrief line. Or reword it to stand alone: "I bet Ghost never saw your face at St Catherine's. I lost."

**R3-7 (minor, canon, optional): m02's camera monitors say NO SIGNAL as well as RECORDER OFFLINE.**
- m02's CCTV object lists cameras at "NO SIGNAL" above "RECORDER OFFLINE -- INDEX ENCRYPTED" (`m02 scenario.json.erb:3004-3005`). Ghost's "I switched off the recorders, not the cameras. I watched you all night." fits only if Ghost kept the feeds while the monitors went dark.
- It's consistent, and one more clause would make that explicit and land better for an m02 player: "Your monitors said no signal. Mine didn't." Leave it to the dialogue pass.

**R3-8 (minor, doc): D2 and D3 are described as pending.**
- DESIGN:5 says "Two items are with the user: D2 … and D3"; :39, Q3 and R-table row D2 say the same. DECISIONS_LOG records both as decided.
- Update to: D2 approved, with the engine fix in the working tree (uncommitted), so it must be committed before this scenario, as for D1. D3: 60-75 accepted, and the timed blind playtest decides any cuts.
- The bypass caveats at DESIGN:211 and :456 can then say "until the D2 fix is committed".

**R3-9 (minor, build rule from D2): unlocked containers must carry no `lockType`.**
- The D2 diff treats an object as under a lock if `locked` is truthy **or** it names any `lockType` (`lock_in_force` in the `game.rb` diff), and a missing `lockType` on a lock means key.
- Rule 4 (`"locked": false` explicitly) and rule 14 (`lockType` on every lock) are right. Add their converse: an unlocked container ("Your lab account", any bin) has `locked: false` and **no** `lockType` or `requires`, or the server may treat it as locked.

**R3-10 (minor, buildability): name the object ids.**
- Section 7's tasks target `cryptosecure_lockbox`, `candidate_locker_4`, `keyholder_guest_terminal`, `special_collections_safe`, `pigeonholes`, `cryptosecure_drop_box`, `relay_terminal` and `hacktivity_scoreboard`. Section 3 names these objects only by display name.
- Put each id in section 3. Also say that the workshop door needs `keyPins` matching the brass key's (README_scenario_design.md:410), with `requires: workshop_door`.

**R3-11 (minor, tooling): `tools/verify_cyberchef.mjs` doesn't run as saved.**
- Its bare `cyberchef/src/...` imports fail with `ERR_PACKAGE_PATH_NOT_EXPORTED` on Node 18. It ran only once I copied it beside the designer's `node_modules`, rewrote them as `./node_modules/cyberchef/src/...` and passed `--experimental-specifier-resolution=node`.
- Put the working imports and the run command at the top of the file, so the build's re-verification step can be repeated.

**R3-12 (minor, story logic): the Comms reminder sends the fallback channel over the watched line.**
- Ghost's offer says everything said on the player's phone since the device was taken has been read (DESIGN:631). A player who asks HaX for `comms_discipline_hax` *after* opening the lockbox gets the out-of-band channel sent over that line.
- The scenario-side cover is cheap: after `lockbox_open`, HaX's reply becomes "Not on this line. It's in your brief.", and she gives no note. The written brief is always in the notepad (`utils/helpers.js:23`), so N2 stays closed.

## 5. Buildability

Can a builder implement v3 without guessing? Mostly yes. Section 3 lists every object with its sprite, lock, contents and text rules. Section 4 gives every recipe, and section 5 the generator, which is proven on 120 seeds plus my two. Section 7 has the objectives and conclusion wiring, and section 8 the ink skeleton, globals table, text schedule and reopencheck states. The 17 build rules turn every probe finding into an instruction. These are the places where a builder would still have to guess:

| # | Gap | Where it's settled |
|---|---|---|
| 1 | Object ids for the eight locked objects, and the workshop door's `requires`/`keyPins` | R3-10 |
| 2 | Which `VAR`s `phone_ghost.ink` (and HaX's story) must declare so reopen re-runs fire | R3-3 |
| 3 | Where `the_offer`'s choices go on the device, and which of its lines are call-only | R3-4 |
| 4 | The FN10 fallback's single trigger and condition | R3-2 |
| 5 | `onceOnly`/conditions on everything keyed on `relay_opened` | R3-5 |
| 6 | The device's pickup mapping after the call, and K10 | R3-1 |
| 7 | Unlocked containers carry no `lockType` once D2 lands | R3-9 |
| 8 | Ghost's `waiting` line "chosen by progress" (DESIGN:570) is an example, not a list. That's fine to write during the dialogue pass, but each line must stay static (rule 2) and the progress flags it reads must be declared (gap 2). | builder's judgement |
| 9 | `comms_had` could come from the note's own `onPickup.setVariable` (`npc-game-bridge.js:30-38` applies it on hand-over), which is simpler than one mapping per id. Either works. | builder's choice |

Nothing else is ambiguous enough to need a design decision. The ERB block, recipes, answers, observation texts, task wiring, credits conditions and music events are concrete.

## 6. Generation

Run from `tools/`, outputs in `scratchpad/review-r3/`:

| Seed | `generate.rb` | `verify_independent.py` | `verify_cyberchef.mjs` (CyberChef 10.19.4 operations) | Sample answers |
|---|---|---|---|---|
| 17 | ok | 20/20 PASS, "ALL PASS" | 34 PASS, "ALL PASS" | (see `g17.json`) |
| 2026 | ok | 20/20 PASS, "ALL PASS" | 34 PASS, "ALL PASS"; longest typed answer 12 | `harbour`, `9986`, `walnut`, `gallery`, `7477`, `primer`, `satchel-64`, `tumbler-79`, `a1946b33`, `harrier-5857` |

On both seeds the CyberChef run shows the intended failures as INFO:
- L2 unsplit gives "Data is not a valid byteArray";
- the three decoy envelopes give "Invalid RSAES-OAEP padding";
- AES with no IV, a zero IV or a wrong key errors;
- L10 with a trailing new line or Size 512 differs;
- RSA Verify gives "Verification Failure" for each of the four natural mistakes, and the SHA-256 of the decoded report doesn't match.

The CyberChef verifier needed the import fix in R3-11 to run.

## 7. Withdrawn

| ID | Suspected | Why withdrawn |
|---|---|---|
| W1 | The video call moves the device's story position, so the router never sees the change. | Phone-chat restores its own `npc.storyState`. Person-chat's saved state only supplies ink-local variables, which the restored story overrides (`phone-chat-minigame.js:412-414`, `:435-440`). The re-run then fires on the changed globals. |
| W2 | Closing the briefing instantly skips the first line's `give_item`. | Person-chat processes a batch's tags before it shows text (`person-chat-minigame.js:1003-1009`). |
| W3 | An NPC-given note doesn't emit `item_picked_up`, so the `comms_had` mappings never fire. | `_receiveNote` emits `item_picked_up:notes` with `itemId` (`npc-game-bridge.js:40-46`). |
| W4 | The leaflet's observation is selected with the codes in the notepad. | The notepad splits the body at "Observation:" into main text and its own box (`notes-minigame.js:417-420`). |
| W5 | The scratch-pad blanks "Key: ____ IV: ____" sit in the body, not the editable box. | They're the note's observations, which is the box the pencil edits (same split; `:524-560`). |
| W6 | `text_file` `onRead` doesn't fire inside a container, so R26's cover fails. | `container-minigame.js:476-492` applies it. |
| W7 | Ghost's and HaX's mappings fall under the late-room rule. | Both phone NPCs are listed in the foyer, the start room (DESIGN:108; README_scenario_design.md:1560). |
| W8 | Mapping conditions can't read `value`. | `npc-manager.js:16-37` resolves `value`, `data.*` and `globalVars.*`; m03 uses `value === true` (`m03 scenario.json.erb:106`). |

## 8. Verdict

**Ready to build with these small fixes.**

Every round-2 major is closed:
- N1's router is right against the reopen code, and K1-K9 trace correctly;
- N2 has three independent hand-overs, each confirmed in the engine;
- R2B-M2 to M8 are in the design text, and M2 and M5 are proven by both verifiers on two fresh seeds;
- M1 and M9 went to the user and are decided.

Nothing in v3 broke the lock order, the gating, the endings, the debrief, the teaching order or the canon. There are no blockers or majors.

The fixes, all text, ink-rule or condition changes and none touching the engine. The first four should go into DESIGN before the build starts, because a builder copying the design literally would get them wrong:
1. **R3-1:** first line of `the_offer` is `{ghost_offer_made: -> route}` before it sets the flag; `~ ghost_greeted = true` in `start`; the device's auto-open mapping gets `!globalVars.relay_opened`; add reopencheck state K10; reword rule 5.
2. **R3-2:** one FN10 fallback trigger. If it's `conversation_closed:ghost`, condition it on `ghost_offer_made === true && !fn10_had`, `onceOnly`. Correct Appendix A's "phone chats never emit `conversation_closed`".
3. **R3-3:** list the `VAR`s the Keyholder ink declares.
4. **R3-4:** `the_offer`'s exits in phone mode, and which lines are call-only.
5. **R3-5:** `onceOnly` or a condition on the `relay_opened` music and offers.
6. **R3-6:** gate or reword the debrief's "wrong about the cameras".
7. **R3-8, R3-9, R3-10:** mark D2/D3 as decided (D2 must be committed first); unlocked containers carry no `lockType`; put the object ids and the door's `keyPins` in section 3.
8. **R3-11, R3-12:** verifier run note; HaX's Comms reminder points at the brief once the device is out.
9. **Optional:** R3-7, Ghost's camera line.

Still for the first browser run (already listed in DESIGN section 12): R17, R18, R19, R20, R21, R22, R23 and R12. R25 is closed by code read (section 2).
