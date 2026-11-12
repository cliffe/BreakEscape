# A7 docs: what was written, and what the orchestrator still has to do

Written 2026-11-12 on `build/phone-calls`. Field names, defaults and behaviour follow the code (`phone-ring-config.js` `normaliseRing`, `normaliseCall`, and the ringer/adapter), not the plan, where they differ.

## Written here

- `README_scenario_design.md`: "Voiced phone calls" rewritten (`ring`, `call`, `#place_call`, every form, the ringer and hold, missed calls, callback, voicemail, events, how a mission writes a call, the busy rule, endings, the call screen, the validator checks); a `ring` row in the "NPC Timed Conversations" and "NPC Event Mappings" tables; "Phone NPCs" rules (`call`, `conversationMode` on a phone NPC is `phone-chat` or `video-call`, not "other values ignored").
- `README_ink_best_practices.md`: new section "Writing call and voicemail knots", placed after "Exit Strategy" (not beside "Remote conversations: write for the mode", because commit 758d94b39 is on main and not yet on this branch, and a second insertion at the same spot would conflict on merge).
- The validator's phone checks have no `scripts/README`; they are documented in `README_scenario_design.md` under "What the validator checks for phone calls".

## To do after merging main into this branch (done: the mode table row names `ring`, `call` and the new section)

1. In "Remote conversations: write for the mode" (README_ink_best_practices.md), change the "Voiced phone call" row of the mode table: add `ring` (a call that rings) and `call` (a contact the player can ring) to "How it is configured", and point at "Writing call and voicemail knots". Its sentence "A call beat ends `#exit_conversation` then `-> DONE`" already agrees with the new section.
2. Same section: "Voiced phone call ... never the contact's home knot or hub" stays true; no change.

## Skill changes needed (not made: `.claude/skills/*` is not mine to edit)

**tts-audio** (`.claude/skills/tts-audio/SKILL.md`)

- Line 17 (delivery note): delete "Voiced phone calls don't send a note yet, so the extractor gives their lines none." Voiced call lines send `#delivery:` since A1 (`line_delivery` returns the note for voiced call knots as well as video knots; narration in a voiced call stays unspoken).
- Line 36 (rule 7): delete the last sentence "Voiced phone calls ignore the tag for now."
- Line 21 (which lines exist): "Phone chats are not voiced ... except a contact with a voiced call (`voiced: true` on a phone-chat mapping or its `timedConversation`, F17)" needs the new sources. A contact is also a voiced call when it has a `call` entry, or a mapping or `timedConversation` for it has `ring` (with or without `voiced`). The call start knots are: every `call` entry's `knot` (`button: false` entries too, because `#place_call:<knot>` dials them); the `targetKnot` of each `phone-chat` mapping with `ring`; the `timedConversation.targetKnot` when it has `ring`. The walk from them stops at the home knot as before.
- Same line: voicemail knots. `ring.voicemailKnot` is collected by `TtsLineExtractor.voicemail_knots`; only lines that start `voice:` are extracted (prefix stripped, contact's voice, no delivery note), and the knot does not widen the call walk.
- Line 21: id-prefixed co-speaker lines on the phone path (`agent_0x99: …`) resolve like person-chat's (exact id, case-insensitive, never `narrator` or `player`); the "use a `#speaker:<id>` tag" advice for two records with one name is replaced on the phone path by an id prefix.
- Add a gotcha: a new call line's key is text + voice + style + language, so the same sentence in two missions' call knots is one clip (the writing rule "no line twice across missions" is about reuse of a clip, not just variety).
- `{call_answer_seconds}` and `{call_is_callback}` are not printed variables; the lines they choose between are conditionals, and each branch is its own clip (the extractor expands every branch of an inline conditional, capped at 16 variants). Rule 2 ("no printed variables") needs a pointer to that pattern.
- Rule 2 covers voiced lines only. A phone contact's text-thread lines (home knot and hub) may print `{player_name}`. `tts_mission_lines_test.rb` "no voiced mission line prints a variable" reads a phone host's call, video-call and voicemail knots and what they reach (`TtsMissionLinesTest.printed_variable_lines`; fixture test `tts_phone_text_variables_test.rb`), not the whole story.
- Audio step note from the log (2026-11-12, A2c): m09 has 68 clips for 387 keys on this branch, 11 m09 `hax_voice` lines are re-keys from the M2 id changes (old clips under `agent_0x99` to re-voice and prune), so m09 and m10 need far more than the re-keys.

**playtest-scenario** (`.claude/skills/playtest-scenario/SKILL.md`; the 2026-11-12 gotchas already on main 758d94b39 are not repeated)

- A ring times out after 20 s. A script that waits longer than that before clicking Answer finds no banner. Auto-click the banner from the page (`setInterval` on `.incoming-call .answer`-style buttons) rather than polling from the shell.
- `bootstrap` waits up to `OPENING_WAIT_MS` (20 s) while an opening call is pending. That equals the ring timeout, so a timed opening ring can ring out inside `bootstrap`. Either note it, or have `bootstrap` return `ringing: true` and the npc id when `.incoming-call` shows.
- On a keyless server a call races to its story end in about 2 s (no TTS to wait for). To prove something "during a call", use a call that stops at a choice and check `phoneRinger.callActive()` is true when the event is emitted.
- `{"cmd":"sync"}` is not a playtest command. Use `await window.stateSync.sync()` in the page before a reload test: state syncs on a 30 s tick, and a reload within 30 s of an outcome otherwise relies on the unload flush.
- `jq '.x // .'` treats `false` as missing, so a `false` result prints the whole reply and `grep -q true` matches `"ok":true`. This let two route gates pass without the condition holding (fixed in 69392dd04). Test with `jq -e` or compare to the literal.
- A patrolling guard with a `player_in_view` mapping opens a person-chat about 30 s in, which looks like an engine popup bug in a hold or popup proof. Turn the guard off (`guard_off`) when proving popups.
- An NPC cannot reach the player inside a minigame, so a "hit" over a keypad needs `playerHealth.damage(...)`. `playerHealth.damage()` does not close a legacy (non-ringer) voiced call; a real guard attack does.
- Hold proofs: emit `ring_hold` directly after the object opens (the lever sometimes does not fire); `open_obj` retries when a neighbouring object opens.
- Never edit a route script while it runs: bash reads it incrementally.
- `conversation_closed:<npc>` fires once per call (sweep item 1, R1 m1), including a call placed from that contact's thread; a later visit to the thread fires it again. Count one per conversation in proofs.
- `ring.ringWhile` drops a queued or ringing call with no row, no event and no callback, so a proof checks `phoneRinger` state, not the thread. An answered or held call is never dropped, and a mapping's trigger `condition` is never re-checked after it fires.
- A ring under a tutorial step panel waits up to 20 s of unpaused time (or until the step changes) and then rings with the banner moved clear of SKIP TUTORIAL. A route that skips the tutorial sees no wait.
- A terminal-look call that closes itself stays open for its read beat, so wait for the phone to close before the next step.
- A choice whose whole text is in parentheses (`(Close.)`) posts no player bubble. A route that counts player bubbles must not count it.
- A contact's thread tapped from a normal phone's list shows in the device look even when the contact has `phoneTheme: "terminal"`. That is the item 11 decision, not a bug.
- Compare saved conversation state by `sha256_noseed` (the story seed is random per run); the lab Dev and Ruth hashes are the regression check for anything that touches the phone.
- The Mission Brief popup reappearing after a resume is intended, and a ring under it is frozen, not lost.
- jsdom harnesses for the ringer need `pretendToBeVisual`, or `document.hidden` pauses the ringer.

**npc-dialog-review** (`.claude/skills/npc-dialog-review/SKILL.md` 2j on main)

- Add checks: every call knot has `// lint: call-knot` and ends `#exit_conversation` then `-> DONE`, never a divert to the home knot or hub; "call me" texts only where the contact can be called for that beat (the validator checks the contact, not the beat); a `#place_call` sits on its own line then `-> DONE`; calls that can be rung back have a `call_is_callback` line, and calls that can wait have a `call_answer_seconds > 10` line; a bring-in is two to four lines and reviews nothing; list the opening and last NPC line of every call, in this mission and across the same handler's other missions.
- A bring-in completes its call-in task on the "[Bring me in.]" reply and carries `#ending_check` in the brackets of the confirm choice, never on a line.
- A contact who is only rung has a home knot resting on a `[(Close.)]` choice that loops home.
- A reply wrapped wholly in parentheses posts no player bubble; flag one that should be heard as the player's words.
- A voicemail can arrive after the same contact's next call: a later call that reads a voicemail flag needs a branch for both orders.

**validate-scenario** and **scenario-design-review**

- Mention `scripts/validate_phone_calls.rb` (`check_phone_calls`) and the `call-in-text-thread` rule of `dialoguelint.mjs`; the expected "call me" warnings clear as each mission gets its `call` or `ring` entry. Baseline: `docs/agents/phone_calls/A7_VALIDATOR_BASELINE.md`.
- Every mission with HaX calls sets a contact-level `callLabel: "SAFETYNET secure line"` on `agent_0x99`; the ring banner, callbacks and placed calls all read it.
- A ring that should stop ringing once its reason is gone needs `ring.ringWhile` (and usually the same string as `callbackWhen`); a trigger `condition` is not re-checked.

## Not documented, deliberately

- `button` on a `call` entry is documented; the per-minigame offset of the banner is not (the banner covers the top of a minigame's title text, never a control; a fix would go in `css/phone-ring.css` if the owner wants it).
- The "Call ended m:ss" beat is shown for ringer calls in the handset look only. A terminal-look call that closes itself holds its last line for a read beat (after the last clip, if one is playing); a player hang-up closes at once.
