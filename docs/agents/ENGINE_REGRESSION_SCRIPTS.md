# Engine regression scripts (pass 3 engine fixes, uncommitted)

Common setup (every run):

- Keyless server :3001 is up (restarted after the server-side changes). If not: tools/playtest/start-keyless-server.sh. Never touch :3000.
- Create games: `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission>`; session-start.sh --headless --url --flags \<FLAGS_XML> --log tools/playtest/reg--session.jsonl; bootstrap {"tutorial":"decline","resume":"new"}.
- Helpers via {"cmd":"eval","fn":"..."}:
  - open phone: `() => window.__test.interactInventory('phone')`; open a contact: `() => window.__test.minigame.clickText('<display name>')`
  - read a thread: `() => window.npcManager.getConversationHistory('<npcId>').map(m => [m.type, m.text.slice(0,60), m.read])`
  - unread count: `() => window.npcManager.getTotalUnreadCount('player_phone', null)`
  - E16 check: `() => window.npcManager.conversationHistory.has(undefined)` (must be false)
  - pending timed texts: `() => window.npcManager.exportTimedMessages()`
  - click a notification: `() => document.querySelector('.npc-bark')?.click()`
- Reload: {"cmd":"sync"}, then quit, then start a new session on the same URL and bootstrap with "resume":"resume". Don't use location.reload() (hangs bootstrap). After a completed mission, skip bootstrap or pass a small maxSteps.
- End of each game: {"cmd":"sync"}, session-stop.sh, verify-run.rb \<game_id>.
- Use `mg clickText` for phone choices (`mg choose` is unreliable there).

## PHONE (E9 history saved, E10/E13 reopen replays nothing already seen, E12 pending texts survive reload, E16, E21, E4)

### m01 (HaX agent_0x99)

1. Open phone + HaX, choose to the hub, record the thread (H1), close.
2. Progress to the next HaX text (e.g. talk to Sarah). Reopen HaX. PASS: thread = H1 + the new text; no earlier HaX line twice; choices reflect progress.
3. Click the next text notification. PASS: thread not wiped, no knot replays.
4. Reload. PASS: identical thread and read flags; same contact-list preview; badge equals unread count; first call doesn't replay; E16 check false.

### m02 (HaX and Ghost `ghost`)

1. Steps 1–4 as m01 on both HaX and Ghost. Ghost is outside npcIds; after reload he must still be listed.
2. Timed texts across reload: complete talk_to_gary; within 3 s sync and check pending lists the 4 s and 11 s texts; reload. PASS: each arrives exactly once. Repeat with Gary's lanyard taken before 11 s: that text must not arrive (skipIfGlobal cover_restored).
3. Val (E4): get caught picking in her view; finish the challenge; pick again in view within 30 s. Expected NEW behaviour: the pick minigame opens (report it). After 30 s a pick in view triggers lockpick_again.

### m05 (agent_0x99_handler, recruiter, patricia_phone)

1. Reach the Recruiter's offer; close without answering; reload. PASS: Recruiter still listed, thread intact, pending offer choices show. There must be NO "You haven't given me an answer" text (that backstop was removed) and no duplicate "TalentStack Executive Recruiting" text.
2. Name Torres to HaX. PASS: a later reopen doesn't replay the naming.
3. Reopen Patricia's mobile after a state change. PASS: her greeting doesn't repeat.

### m06 (agent_0x99_handler)

1. Read HaX's first call, close; get past the guard (guard_resolved); reload. PASS: no fresh first call; thread keeps the earlier texts; badge clears after opening and stays 0 after closing.
2. Close Irina's conversation, sync within 2 s (text due at 4 s), reload. PASS: "You've met Volkova…" arrives exactly once.
3. Guard: pick the turnstile door while he watches. PASS: one challenge; exactly one conversation_closed:checkpoint_guard per catch in the session log; first catch plays the non-grace "Oi" variant. Pick again with guard_grace set: grace line. Pick with his back turned: pick minigame.
4. "Remind me where we are." still works.

### m03 (night_guard, executive_wing_hallway)

1. Pick in view. PASS: one strike, guard_grace set.
2. Pick again in view straight after the conversation closes. PASS: the no-strike grace line; never a silently swallowed pick.
3. Leave the corridor and return; pick in view: a strike again.
4. Reopen HaX after a guide request. PASS: the field guide isn't given twice (check the workstation contents).

### m08 (HaX phone; Netherton person-chat)

1. Phone reopen and reload as m01 steps 1–4.
2. On all_flags_submitted a text is due at 6 s: sync, reload, check it arrives once.
3. Netherton (regression guard; person-chat unchanged): start the door audit, answer step 1, Esc at step 2; talk again. PASS: resumes at step 2's choices, misread counter not double-counted, "Let me read it again." exits freely. Finish the audit; a later talk goes to the hub.

## SERVER (E18, E22, E5)

### E22, m06 (Irina)

1. Get Irina's wordlist and borrow/clone the CTO badge via her dialogue. Confirm both in inventory; `npcManager.getNPC('irina_volkova').itemsHeld` should hold only the executive badge.
2. Reload. PASS: inventory still has both; Irina's itemsHeld still only the executive badge.
3. KO Irina (debugKO). PASS: only the executive badge drops; no duplicate CTO badge or wordlist.
4. Control: fresh game, KO Irina without asking for anything: all her items drop.

### E18, m05 (Patricia)

1. Meet Patricia without unlocking patricia_filing_cabinet; take the CEO email via her dialogue give. PASS: email in inventory, no "Container not unlocked" alert, POST /inventory 200 with source_npc_id. The cabinet's own copy stays locked.

### E5 (optional): with quota exhausted a TTS request returns 429 and the conversation continues silently. On :3001 there is no key, so expect 503 for uncached lines; just confirm no error toast.

## CLIENT (E20, E14, E17, E6, E15, E3)

1. E20 (m02 or m03): find a WORLD text_file with takeable:true (m02: Backup Server SSH Notes, Verified Restore Manifest, ENTROPY Key Material; m03: Zero Day Transaction Log, Zero Day: A Brief History, Personal notes — some may be container contents; use \__test state to find a room object). Interact. PASS: text minigame opens, sprite leaves the room, item in window\.inventory.items, no "Invalid Action" alert; still in inventory after reload. A non-takeable text_file still opens and stays. Any collect_items task including it ticks.
2. E14 (m03): read the receptionist's Staff Access Badge with the cloner. Screen shows "Clonable: No" with 0 keys; Save shows "No keys recovered. Run a key attack first." and returns to the attack menu. Dictionary Attack → Read & Clone → Save works, "Clonable: Yes ✓". Repeat on the executive keycard (custom keys: Darkside or Nested). ALSO test the conversation clone path (#clone_keycard in the receptionist/Victoria conversation) end to end, including the card_cloned retry flow (cancel once, then clone): the mission must still complete its clone task.
3. E17 (m06): complete the guard's FCA cover so #unlock_door:trading_floor fires. PASS: the toast shows the door sign or "Trading Floor", not `trading_floor`.
4. E6 (m01 derek_office or m05 server_room): interact with the locked door; the existing door_unlock_attempt mapping still fires (derek_office_locked_seen / server_door_seen and its bark). Subscribe to the dispatcher: door_unlock_failed and door_unlock_failed: fire with no key/lockpick, and not with the right key.
5. E15 (m04): trigger attack_mechanism_known so timers start, then attack_prevented (or let one fire). Once none pending, #scenario-timer-display is display:none and its label/clock text empty.
6. E3: get a game over (health 0 via \__test), click Restart: no "RESUME SESSION?"/"OTHER SESSIONS" overlay; URL ends without skip_resume. A plain refresh during normal play still shows the resume overlay.
