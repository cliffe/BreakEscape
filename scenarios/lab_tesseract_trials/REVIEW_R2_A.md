# The Keyholder Trials: design review, round 2, reviewer A

## 1. Scope and method

Reviewed: `DESIGN.md` v2 against the brief (`docs/agents/TESSERACT_TRIALS_BRIEF.md`), `DECISIONS_LOG.md` (its decisions override reviewers), `REVIEW_R1_A.md`, `REVIEW_R1_B.md`, `scenarios/test-tesseract-probes/PROBE_RESULTS.md`, `AGENTS.md`, `README_scenario_design.md` ("Common bugs and how to avoid them") and the lenses of the `mission-alignment-plan` and `scenario-design-review` skills, scaled to a short lab.

Kind of game: lab scenario with SAFETYNET spy framing. A short escape room (45-60 minutes aimed for), every lock opened in CyberChef, no quizzes, no new engine features, no assumed knowledge.

What I ran or read, beyond the documents:
- the engine paths the design names: phone-chat reopen and restore, person-chat (video call) state, timed conversations, timed messages, event-mapping conditions, the password minigame's post-it, task `onComplete`, server task validation, container stripping and the contents endpoint, `concludeRequires`, state sync and reload restore;
- the D1 change in the working tree (`git diff public/break_escape/js/utils/crypto-workstation.js`);
- `tools/generate.rb` and `tools/verify_independent.py` on three fresh seeds (9, 77, 313): all pass. Outputs in `scratchpad/review-r2-a/g*.json`.

No browser run. Severity: **blocker** = can't be finished by its target player; **major** = change before the build; **minor** = fix during the build.

## 2. Closure of round-1 blockers and majors

| Finding | Status | Evidence | New problem from the fix? |
|---|---|---|---|
| B-B1 CyberChef forgets on close | **closed** | D1 is in the working tree: the frame loads once (`crypto-workstation.js:21-23`), close only hides it (`:38-43`), and the new-tab button opens the frame's live URL with the recipe hash (`:51-63`). Tom and FN1 point at the "↑" (`show.html.erb:97`). | No. CyberChef state is still lost on a page reload, which is acceptable. D1 is uncommitted, so the build depends on it being committed first. |
| A-M1 / B-M1 library branch skippable | **closed** | The pigeonholes are password-locked with a code that is only in the Vigenère plaintext (DESIGN:108, `generate.rb:109-111`). A locked container's `contents` are stripped (`game.rb:1876-1879`), and the contents endpoint returns 403 until the server records the unlock (`games_controller.rb:491-496`). The IV is only in Trial VII (`generate.rb:88-94`). Answers are compared exactly on the server (`game.rb:963-966`). I re-ran the generator and the independent checker on seeds 9, 77 and 313, and all pass. | Only cosmetic. Digits pass through the Vigenère, so the code's number shows in the ciphertext ("pvexhxffi-54"). The word doesn't show, and the IV's letters are enciphered, so it can't be guessed. |
| A-M2 double-ending texts give it away | **closed** | Sent and double send the same texts (DESIGN:528). The truth comes from the scoreboard reply and the debrief. | No. |
| A-M3 / B-M3 fallback channel hard to find and enter | **partly closed** | The design text is fixed: a starred note with channel, format and location (DESIGN:468), the post-it on the scoreboard (`unlock-system.js:282-283` → `password-minigame.js:138-141`), the smartscreen variant, Cliffe's pre-decision line, the task title, and a lower-case word-digits token. | **Yes.** The note is handed over in beat 5 of a briefing the player can close at any point, and it never replays. See N2. |
| A-M4 why send 0x00 | **closed** in the text | Briefing beat 3, paid off at the call and in debrief beat 3. | It shares N2's exposure: a player who closes the briefing early misses the set-up. The debrief line still reads sensibly without it. |
| A-M5 briefing not outlined or wired | **closed**, with a new gap | The outline and wiring match m01 (`m01 scenario.json.erb:534-541`). `skipIfGlobal` and `setGlobalOnStart` exist (`npc-manager.js:1580-1598`). | **Yes.** It's the same N2. |
| A-M6 no runtime contact rename | **closed** | "Keyholder" all game; Ghost names themselves on the call. | No. One wording point is in N-m8. |
| A-M7 hash note behind an optional talk | **closed** | Three routes: Sidhu, the desk copy, and HaX on `final_trial_card`. Taking a note from a container emits `item_picked_up` with `itemId` (`interactions.js:1474-1483`, via `container-minigame.js:508-546`). | Small: `fn07_had` "whichever route gave it" needs one mapping per note id, because mapping conditions are `&&` only (`npc-manager.js:94-101`). See N-m3. |
| B-M2 prose in copyable ciphertext | **closed** | Build rule 3. `text_file` Copy uses the content only (probe R6). The report is split into three files. | One thing to know: a note an NPC hands over goes into the notepad as `text + "\n\nObservation: " + observations` (`npc-game-bridge.js:22-24`). The leaflet keeps its ciphertext on a line of its own, so a selection still works. |
| B-M4 about 85 minutes | **partly closed, by decision** | Five notes are handed over in person, the notes are shorter, recipes name only the fields to type into, and D1 is in. The new estimate is 60-75. Cutting L3 was rejected by the orchestrator (`DECISIONS_LOG.md`), and cuts wait for a timed blind playtest with the Q3 cut list. | No. Not counted as open, because the log decides it. |
| B-M5 Ghost silent until the call | **closed** | Six static lines on the Keyholder device, plus HaX's suspicion beat. `sendTimedMessage` on a phone NPC takes `npc.phoneId` (`npc-manager.js:836-848`). | Small: they stack with HaX's texts on neighbouring events. See N-m2. |
| B-M6 beats for the academics | **closed** | Tom's pop-out and Magic lines, Sidhu's "It verifies" line, and Cliffe's scoreboard line plus the post-decision smartscreen. | No. |

There were fourteen round-1 blockers and majors: A's M1-M7, and B's B1 and M1-M6. Nine are closed outright. A-M4 and A-M5 are closed in the text but share N2. A-M3 and B-M3 are partly closed, because the fix exposed a new hole (N2). B-M4 is partly closed by an orchestrator decision.

## 3. Wiring checked against the engine

| Wiring the design names | Holds? | Evidence | Note |
|---|---|---|---|
| `timedConversation` with `waitForEvent`, `skipIfGlobal`, `setGlobalOnStart` (briefing) | yes | Scheduled once per NPC (`npc-manager.js:271-282`); the guard is checked at delivery (`:1580-1588`); the guard global is set and emitted when the scene starts (`:1590-1598`). It opens person-chat with `npcId`, `title` and `background` only (`:1618-1622`). | **No `disableClose` is passed**, and person-chat hides its close controls only when `params.disableClose === true` (`person-chat-minigame.js:1504`). So the briefing can be closed, and it never comes back. That's N2. |
| `sendTimedMessage` on a phone NPC (Ghost's lines, HaX texts) | yes | The delay counts from the event, and the text goes to `npc.phoneId` (`npc-manager.js:836-848`). Pending texts survive a reload (`state-sync.js:56-58`, restored in `core/game.js:1004-1008`). m02's Ghost does the same (`m02 scenario.json.erb:1285-1306`). | R18 is still worth the one browser check the design lists. |
| `postitNote` / `showPostit` on the scoreboard | yes | `unlock-system.js:276-284` passes them to the password minigame, which draws the note (`password-minigame.js:138-141`) and adds a notebook button (`:54-57`). | — |
| `video-call` mapping on `global_variable_changed:relay_opened` | yes | `mapping.targetKnot` becomes `config.knot` (`npc-manager.js:541`), and the video-call branch uses it (`:1004-1025`). A onceOnly handler that opens a conversation is saved only when that conversation closes (`:670-686`, `:1198-1207`). | The call's ink runs in **person-chat**, which keeps its state in `npcConversationStateManager` (`person-chat-minigame.js:479`, `npc-conversation-state.js:26-70`). The Keyholder device runs **phone-chat**, which keeps a separate `npc.storyState` (`phone-chat-minigame.js:870-883`). They share globals only. That matters for N1. |
| Task `onComplete.setGlobal` (`relay_opened`, `warned_out_of_band`, progress flags) | yes, client-side | `objectives-manager.js:754-763` sets the global and emits `global_variable_changed:<var>` after the server accepts the task. The server's `process_task_completion` handles only `unlockTask`/`unlockAim` (`game.rb:1791-1801`). | The globals reach the server only through state sync (every 30 s and on pagehide, `state-sync.js:17-23`). See N-m11. |
| `concludeRequires: { tasksCompleted: [open_relay_terminal] }` | yes | `complete_task!` checks `object_unlocked?` for `unlock_object` tasks (`game.rb:1051-1054`). The gate reads that task's status (`:2187-2203`) and is re-checked when a gate task completes later (`:1689-1706`). | — |
| Mapping conditions (`&&`, `!`, `===` with strings, `globalVars.x`, `data.itemId`) | yes | `npc-manager.js:15-102` handles them. It has **no `\|\|`**: a condition containing `\|\|` is an "unsupported condition term" and evaluates false. | Each "either id" mapping (N-m3) needs to be two mappings. |
| `#set_global` with a string value | yes | `chat-helpers.js:450-497`: `"sent"` stays a string, and it emits `global_variable_changed` every time, even when the value is unchanged. | That helps N-m10. |
| Container contents and answers stripped | yes | `game.rb:1862-1880`; contents endpoint `games_controller.rb:478-507`. | The token, the report, the envelopes and Trial VII can't be read before their lock opens. |
| `observationVariants` on the smartscreen | yes | `conditional-text.js:110` uses the first match in order, with `&&`, `!` and `===` supported. | — |

## 4. Fresh adversarial pass

### 4a. Trying to break the gating

For each lock I looked for another way the answer could reach the player:

| Lock | Earliest the answer exists on the client | Skip route? |
|---|---|---|
| L1-L4 | inside the previous lock's container (stripped until unlocked) or in Jordan's hand | none |
| L5 library door | the corridor poster, behind L4 | none |
| L6 safe | the slip, behind L5 | none |
| L7 pigeonholes | Trial VII, inside the L6 safe; the key is on Sidhu's whiteboard | none. The code's two digits show through the ciphertext, but the word doesn't. |
| L8a envelope | inside the L7 pigeonholes; the private key is on the lab PC | none |
| L8b drop box | the tag's ciphertext, plus the key (L8a) and the IV (L7) | none. A missing or zero IV errors or gives junk (100 seeds). |
| L9 workshop | brass key inside L8b; one door; no lockpick | none for a player. Key locks are trusted client-side (`game.rb:957-959`), so only a console user could skip it. |
| L10 relay | SHA-256 of the L8b passphrase | none |
| Scoreboard | token only in `report.b64`, inside L10 | none |
| Decision | HaX's send/trap choices need `ghost_offer_made`; refuse is only in Ghost's offer | none before the call. After it, see N1. |

The objectives can't strand the player: aims gated by `aimCompleted` show themselves when one of their tasks completes (`objectives-manager.js:717-736`). The only story gate is Megan's side aim. `concludeRequires` is met by the critical path.

The gating holds. The one ordering hole is after the call (N1).

### 4b. Reload and save-state

| State | What survives a reload | Risk |
|---|---|---|
| Globals | Synced every 30 s and on pagehide (`state-sync.js:17-23`) | A crash with no pagehide loses globals set by `onComplete` after the server has already completed the task. Rare. N-m11. |
| Briefing | `briefing_played` is set when it starts, so it never replays | Closing it early, or reloading during it, loses the note it hands over. N2. |
| Timed texts | Pending ones are saved and restored, and delivered ones aren't repeated (`npc-manager.js:1641` `exportTimedMessages`, `core/game.js:1004-1008`) | none |
| Ghost's video call | The handler is saved on close. `ghost_offer_made` is set on the knot's first line. The event doesn't replay after a reload. | A reload during the call is fine: the offer is already made, and the device and HaX carry it on. Reopening the device then depends on N1. |
| Keyholder device thread | `exportPhoneState` (story position, texts) | N1 |
| Debrief | `disableClose`. Its onceOnly handler is saved only on close. | After a reload mid-debrief, `start_debrief_cutscene` is already true and nothing re-fires it unless HaX's `[I'm clear. Debrief me.]` is sticky. N-m10. |
| Megan, scoreboard, endings | Globals, as above | none beyond N-m11 |

### 4c. New majors

**N1 (major): Ghost's re-entry routing sits in `start`, and a reopened device doesn't run `start`.**
- The design routes the Keyholder device with conditions in `start`: `{ghost_offer_made and not decision_made: -> the_offer_again}` and `{decision_made: -> closed}`. It also says "later opens resume at its hub" (DESIGN:270, :502). Those two can't both work.
- Reopening a phone contact restores its saved story at the knot holding its choices (`phone-chat-minigame.js:435-447`). It re-runs that resting knot, not `start`, and only when a global the story declares has changed since the save (`phone-chat-conversation.js:587-610`). `start` runs again only if the story ended (`restartAfterEnd`, `:267-278`).
- The video call doesn't move the device's position either. The call runs in person-chat with its own saved state (`npc-conversation-state.js:26-70`). The device's phone-chat state (`npc.storyState`) is still parked wherever Ghost's intro left it.
- What goes wrong:
  - **After "I'll think about it"**, the device reopens at Ghost's pre-offer hub. Unless that knot re-checks the globals at its top, there's no `[No. Find another student.]`, so the refusal ending can't be reached from the device.
  - **After a decision made on HaX's phone**, a parked offer knot can still show the refuse choice if it doesn't check `decision_made` at its top. Picking it overwrites `ending` after `decision_made` is already true, and the credits and debrief then contradict each other.
- Fix (ink only):
  1. Put the routing at the top of **every knot Ghost's phone story can rest on** (its hub, `the_offer_again`), not only in `start`. Keep it in `start` too, for a first open (a late pickup preloads `start`, `phone-chat-conversation.js:703`).
  2. Guard the refuse choice with `not decision_made`.
  3. Add `{relay_opened and not ghost_offer_made: -> the_offer}` as a catch-up, so the device delivers the offer if the call was ever lost.
  4. Add Ghost's device to `scripts/ink_runtime_check/missions.json` and run `reopencheck.mjs` over these states: before the offer, after "think about it", after send, after refuse, after blown.

**N2 (major): the fallback channel and the "why me" beat live in a briefing the player can close, and it never replays.**
- Timed conversations open person-chat without `disableClose` (`npc-manager.js:1618-1622`), so the × and Esc work (`person-chat-minigame.js:1504`).
- `setGlobalOnStart` marks `briefing_played` as the scene starts (`npc-manager.js:1590-1598`), and the ink sets it on its first line too (DESIGN:459). A player who skips the briefing never gets it back, and a reload during it does the same.
- The "Comms discipline" note is handed over in beat 5 (DESIGN:468). It is the only place the game says what the fallback channel is, what format a flag takes and where the terminal is. Without it, the scoreboard post-it, Cliffe's line and the task title "Use the fallback channel (optional)" point at something the player was never told about. That reopens A-M3/B-M3 for the players most likely to skip a cutscene.
- Fix (any one closes it; the first two together are best):
  - hand the note over in beat 1 or 2, not beat 5;
  - put the same rule in the written scenario brief (`show_scenario_brief: "once"`, which stays in the notepad);
  - give HaX a copy, with a hub choice shown when `!comms_had` ("Remind me how I reach you if this phone's no good"), and an `item_picked_up:notes` mapping on `comms_discipline` setting `comms_had`.
  - Don't rely on making the cutscene uncloseable: the timed-conversation path can't pass `disableClose` without an engine change.

### 4d. Endings: reachable and fair?

| Ending | Route | Reachable | Fair | Note |
|---|---|---|---|---|
| Sent | HaX hub, `ghost_offer_made && !decision_made` | yes | yes. Ghost says "Read it", HaX's climax rung says "read it", and the report is one From Base64 away. | — |
| Double | scoreboard token, then send | yes | yes, if the player has the Comms note (N2). The post-it gives the format; Cliffe and the smartscreen point at the scoreboard. | — |
| Refused | `[No. Find another student.]` on the call, or on the device later | on the call, yes. On the device after "think about it", **only once N1 is fixed**. | yes | HaX's "Copy. Leave by the front." has no in-world trigger, since she can't see the device (N-m5). |
| Blown | HaX hub `[It's a trap ...]` | yes | yes | Ghost's "I did say it listens." lands. |
| Late warning and warned-then-refused | covered by `late_warning` and the debrief branches | yes | yes | — |

Every route reaches the debrief through `[I'm clear. Debrief me.]` once `decision_made` is set. Nothing about the decision is gated by `concludeRequires`, so there's no ending that can't conclude.

### 4e. New minors

- **N-m1. The "at most 11 characters" claim is wrong** (DESIGN:168, R11 at :665). `peregrine-NNNN` is 14 characters; `letterbox-NN`, `keyholder-NN` and `lockstock-NN` are 12. All still sit well inside the 50-character field. Fix the number.
- **N-m2. Texts stack across neighbouring events.** The validator only spaces texts on the *same* event.
  - At the corridor door, `objective_task_completed:open_corridor` (Ghost's Trial IV line, HaX's suspicion line at 12 s) lands a second before `room_entered:corridor` (the L5 nudge and the FN4 offer).
  - At the Special Collections safe, the Ghost line, the L7 nudge and the FN6 offer come together, and so do `megan_file_read` (Ghost's candidates line) and the Loose Threads aim if the file is read at once.
  - Give each burst explicit delays at least 5 s apart, or fold the nudge and the offer into one text.
- **N-m3. "Whichever route gave it" needs one mapping per id.** `fn07_had` is set from `fn07_hashing` (Sidhu), `fn07_desk_copy` and HaX's copy, and `fn10_had` likewise. Conditions have no `||` (`npc-manager.js:94-101`), so write one `item_picked_up:notes` mapping per `data.itemId`.
- **N-m4. The Keyholder device is optional to take.** The lockbox also holds the Trial II card, and taking only the card is possible. A player who leaves the device gets Ghost's lines on a phone they don't carry, and Ghost's "same pocket as your phone since this morning" is false. A late pickup plays the opening intro at the climax, which is the "late first contact" bug class. Fix:
  - route `start` by progress (N1 covers the climax states);
  - have HaX's L2 nudge mention the device ("Bring the black box. I want to know who's on the other end.").
- **N-m5. HaX's refused-route text answers nothing she could have seen.** On refused, she texts "Copy. Leave by the front." without the player having told her. Either make it a check-in ("Your end's gone quiet. What happened?") or give the player a hub line telling her before the text.
- **N-m6. Set-but-unread globals.** `report_sent`, `ghost_greeted` and `report_read_claimed` have no reader in the design. A-m15 claimed every global is read somewhere. Name a reader (the debrief, credits) or drop them, or the validator will suggest it.
- **N-m7. Cliffe's hide mapping will trip the late-room check.** `cliffe_schreuders` hides himself on `room_entered:workshop` from the common room, which isn't the start room (README "An NPC outside the start room ..."). The design's reason holds, since L2 forces a common-room visit first. Record that in the build log, or move the hide onto the workshop entry by another route, so the validator warning is justified rather than ignored.
- **N-m8. "At St Catherine's you didn't call me anything. You just listened."** This is false for most m02 players. m02's player argues with Ghost ("That doesn't justify encrypting patient records.", "That's a very long way of saying you're using her.", `m02_phone_ghost.ink` start knots). Use a line that's true on every m02 route, for example "At St Catherine's you never asked my name. Most people do."
- **N-m9. "Your handler is generous with bursaries." fires the instant the player asks HaX**, before any bursary exists. Make it intent: "Your handler's about to get generous with bursaries."
- **N-m10. Make `[I'm clear. Debrief me.]` sticky.** After a reload mid-debrief, the onceOnly debrief handler isn't yet saved, and the global is already true. A sticky choice re-sets `start_debrief_cutscene`, and `#set_global` emits again even for an unchanged value (`chat-helpers.js:477-497`), which reopens the debrief.
- **N-m11 (engine note, for the user, not blocking).** `onComplete.setGlobal` is applied only on the client (`objectives-manager.js:754-763`; the server's `process_task_completion` ignores it, `game.rb:1791-1801`). A crash with no pagehide flush between opening the relay and the next 30 s sync leaves `open_relay_terminal` completed on the server with `relay_opened` lost. The call never fires, and the task can't complete again. `warned_out_of_band` has the same exposure. The cheap scenario-side cover is N1's catch-up. The real fix, applying `setGlobal` on the server too, is an engine change.
- **N-m12. Build detail.** Every `notes` item inside a container (Trial II card, Trial III, Candidate assessments, Final Trial card) needs `readable: true`, `takeable: true` and `text`, so it takes the notes path that emits `item_picked_up` with its `id` (`container-minigame.js:508`, `interactions.js:1474-1483`). The FN7 fallback depends on that for `final_trial_card`.

### 4f. Alignment with m01/m02, scaled to a lab

The briefing, the debrief, HaX's progress-gated hub, the music events, the moral choices (Megan mid-mission and the report at the climax), credits with an unconditional line in each section, and a `bond_visualiser` conclusion all follow m01/m02. HaX's hub stays within ten choices: field note, stuck, send, trap, Megan, debrief, goodbye. The kind-of-game aim is respected: no quizzes, teaching through notes and objects, and spy-thriller beats that are lighter and shorter. The one alignment gap is N2: in m01 the briefing carries no item the rest of the mission depends on, and here it does.

## 5. Withdrawn

| ID | Suspected | Why withdrawn |
|---|---|---|
| W1 | The video-call mapping's `targetKnot` is ignored, because the handler reads `config.knot`. | `_buildMappingConfig` maps `targetKnot` onto `knot` (`npc-manager.js:541`), and probe R3 opened `relay_call` this way. |
| W2 | The token, report or Trial VII leak to the client in the bootstrap JSON. | Locked containers lose `contents` (`game.rb:1876-1879`), and the contents endpoint refuses until the unlock is recorded (`games_controller.rb:491-496`). |
| W3 | Taking "Candidate assessments" from the safe sets `megan_file_read` on take, before it's read. | A notes item from a container goes through the notes path, which applies `onRead` when the note is read (`container-minigame.js:508-546`, `interactions.js:1452-1470`). |
| W4 | Credit lines can't compare strings (`ending === 'sent'`). | Credit conditions use `evaluateCondition` with `globalVars` in scope (`scenario-music-events.js:34-53`), as m01/m02 do. |
| W5 | The two Cliffe NPCs trip the validator's shared-sprite check. | The check groups by `displayName` (`validate_scenario.rb:3322-3328`), so one person under two ids passes if both carry the same display name. Give them the same one. |
| W6 | Optional tasks in "The Offer" (`warn_handler`) block the conclusion aim. | `checkAimCompletion` treats `optional` tasks as done, on the client (`objectives-manager.js:847`) and on the server (`game.rb:1828`), and `concludeRequires` names only `open_relay_terminal`. |

## 6. Findings by severity and verdict

**Blockers:** none.

**Major (new):**
- **N1:** Ghost's re-entry routing is in `start`, but a reopened phone resumes at its resting knot and re-runs only that knot. After "think about it" the refusal can be unreachable from the device. After a decision on HaX's phone, a stale refuse choice can overwrite `ending`. Route at the top of every resting knot, guard refuse with `not decision_made`, add a `relay_opened && !ghost_offer_made` catch-up, and reopencheck the five states.
- **N2:** the "Comms discipline" note, the only statement of the fallback channel, comes in beat 5 of a briefing that can be closed (timed conversations can't pass `disableClose`) and never replays. Hand it over early, repeat it in the written scenario brief, and give HaX a fallback copy.

**Round 1, still partly open:** A-M3/B-M3 (through N2), and B-M4 (the time budget, deferred to the timed blind playtest by orchestrator decision).

**Minor:** N-m1 to N-m12 (section 4e). N-m11 is an engine note for the user, not a blocker.

**Withdrawn:** W1-W6 (section 5).

### Verdict: build after fixes

v2 closes the round-1 work properly:
- the library branch is now a real boss-key chain, enforced on the server, and I confirmed it holds on three fresh seeds;
- the CyberChef blocker is fixed in the engine;
- the endings are fair and each is reachable;
- the wiring the design names exists and behaves as described.

The two new majors are ink and design-text fixes with no engine change. N1 is a routing rule plus a reopencheck run, and N2 moves one note and adds two fallbacks. Fold them in and the build can start. The round-3 confirmation needs only to check N1's knot routing (ideally with `reopencheck.mjs` once the ink exists) and N2's three hand-over points.
