# m06 Follow the Money: puzzle chains review, pass 5 round 2

Read-only review (Opus, static). Kind of game: a SAFETYNET campaign mission, a TV spy thriller about a money trail. Measured against m01_first_contact, m02_ransomed_trust and the `mission-puzzle-chains` skill.

The state under review is HEAD `989355e2` (round 1's fixes). The m06 folder has no uncommitted changes. Citations: `erb:N` is `scenario.json.erb`; ink files by short name (`irina`, `phone`, `debrief`).

## Scope

- **Covered:**
  - confirming every round-1 finding (M1–M3, m1–m10) and decision (D1–D3);
  - the new pieces as puzzles: the console lockout, Irina's slot check, the wordlist and badge from a turned Irina, the signing case and the print on the clipping, and the three-room safe clue;
  - a sweep for answers handed over;
  - a sweep of HaX's hub and recap for lines that check how a step was done rather than whether it was done;
  - one fresh pass of the skill (boss-key audit, required choices, bug sweep).
- **Engine read:**
  - the fingerprint and biometric path (`systems/biometric-lock.js`, `systems/biometric-samples.js`, `systems/biometrics.js`, `interactions.js:1243-1265`, the biometric case in `unlock-system.js:349-356`, server `game.rb:260-303` and `:986-991`);
  - the PIN pad's lockout (`pin-minigame.js:40-60`, `:585-610`) and the failure event (`base-minigame.js:94-111`);
  - how a person chat reopens (`person-chat-minigame.js:470-540`, `npc-conversation-state.js:26-145`).
- **Not opened:** the SecGen XML, the four exploit guides, the exploit detail in `VM_INTEGRATION.md`, and the sight-challenge source. Anything that depends on Kemal's sight cone is listed as a browser check.
- No browser session was started.

## Checks run

| Check | Result |
|---|---|
| Routes r1–r15 (`scripts/ink_runtime_check/m06_routes/`) | 15/15 "all expectations met" |
| Validator, `--skip-ink --no-graph` | No errors. Schema, geometry and door alignment pass. The known notes are unchanged: 20 duplicate-pattern notes on HaX, 3 repeatable-cutscene notes, the two-sources note for the server room, and two all-conditional credit sections. **One new note:** `objectives[4]/tasks[3]/showProgress` is missing on the new `open_signing_case` collect task (m-R2-6) |
| `dialoguelint` | No findings |

## Round-1 confirmation

| # | Round-1 item | Where it is now | Status |
|---|---|---|---|
| M1 (a) | Console limited to two tries; a lockout strains the cover once | `"maxAttempts": 2` at erb:1821. The mapping is at erb:1285-1291 and is scoped by condition. The event really is `minigameName: 'PinMinigame'` (the class name, `pin-minigame.js:15`; emitted at `base-minigame.js:99-104`). `result.maxAttemptsReached` is set only on lockout (`pin-minigame.js:592-605`), and the pad then closes itself through `showFailure(..., true)` → `complete(false)` (`base-minigame.js:136-145`). A cancel leaves `gameResult` at its constructor value, `null` (`base-minigame.js:12`), so the `data.result &&` guard means **a cancel can't trip it**. That matches statically; one browser confirmation is still worth having | ✅ implemented. Fairness and scope: M-R2-2, m-R2-2, m-R2-3 |
| M1 (c) | Irina checks one slot per visit | The latch is set in `slot_check` (irina:554, 564, 571) and cleared only in `start` (irina:90). **`start` doesn't run on a normal reopen**, so in practice the limit is one check per page load. See M-R2-1 | ⚠️ implemented, but it doesn't do what the log and walkthrough say |
| M2 | Wordlist from a turned or detained Irina | irina:599-608. Both options latch (`wordlist_handed`) and retire on `found_password_lists`. The give goes through the pickup mapping (erb:965-969), so `obtain_access_tools` completes. r14 covers the turned case | ✅ |
| M3 | Checklist toast is a pointer, not the recipe | erb:1006: "That's their house rule for door passphrases. Volkova keeps the list of words her people pick." | ✅ |
| m1 / D3 | Safe clue spread across three rooms | Clipping: motive only, "Until the last coin." (erb:2076). Email: the meaning (erb:1959). Priya's margin: the number (erb:1912) | ✅ (see "The new pieces", 5) |
| m2 / D2 | The print kit gets a use | `satoshi_signing_case` (erb:2152-2176); the clipping is the print surface (erb:2066-2084) | ✅ (see "The new pieces", 4) |
| m3 | A late flag 4 gave stale lines | erb:1050 has `skipIfGlobal: assets_decided`. phone:449-458 gates each line, returns to the hub once the money is settled, and switches "[I'm going up.]" to "[Understood.]" (phone:466-472). r15 covers it | ✅ |
| m4 | Flag 1's text after flag 2 | erb:1030 has `skipIfGlobal: flag2_submitted` | ✅ (the VM order still needs checking against SecGen by the user) |
| m5 | Kemal recap lines | phone:328 adds `not resolve_aim_open`, declared at phone:93 | ✅ |
| m6 | The "no attempt limit" note | Fixed in erb:1807-1811 and `TESTING_WALKTHROUGH.md:70`. The walkthrough's new claim about Irina ("cleared each time her conversation opens") is wrong in turn: see M-R2-1 | ✅ for the console; ⚠️ for the Irina half |
| m7 | Out-of-order aims comment | erb:446-451 now says what actually happens | ✅ |
| m8 | Priya named the Fund | erb:1912: "5. Into one wallet? Every cell draws on something." | ✅ |
| m9 | A turned Irina lends her office badge | irina:611-615, latched; it retires on either badge global | ✅ |
| m10 | Duplicate `_comment` keys; guard cooldown note | erb:1009 has one merged comment; the guard ink (≈ line 108) says 250 ms | ✅ |
| D1 | (a) + (c) | As M1 above | ✅ (a); ⚠️ (c) |
| D2 | A biometric case enrolled to Satoshi; his print on the clipping | The names match exactly (see below) | ✅ |
| D3 | Three-room safe clue | As m1 | ✅ |

**Does the print's owner match the lock's enrolled name?** Yes.
- The clipping has `"fingerprintOwner": "Satoshi Nakamoto II"` (erb:2073), and the case has `"requires": "Satoshi Nakamoto II"` (erb:2161).
- The dusting lift stores `owner = scenarioData.fingerprintOwner` verbatim (`biometrics.js:63`). The reader matches on `s.owner === requires` (`biometric-lock.js:48`). Neither side slugs the name.
- The server keeps a synced sample only if its owner appears as a `fingerprintOwner` somewhere in the scenario (`game.rb:263-283`). This one does, so the lift survives a reload.
- The server trusts the client for a biometric unlock (`game.rb:986-991`).
- The candidate names (Kemal Aydin, Dr. Irina Volkova, Dani Okonkwo) match the cast's `displayName`s (erb:1982, 1522, 1603).
- The kit is in the start inventory (erb:595), so dusting is offered.

## Findings: severity table

Counts: **0 blockers, 2 majors, 6 minors.**

| # | Sev. | Finding | File:line | Concrete fix |
|---|---|---|---|---|
| M-R2-1 | major | **Irina's "one check per visit" is really "one check per page load".** The latch clears only in `start` (irina:90), but a reopen doesn't run `start`. Every exit from `after_choice` ends `#exit_conversation -> after_choice` (irina:616-623). On the next open the engine restores the full story state and re-navigates to the knot that owns the saved choices, which is `after_choice` (`person-chat-minigame.js:481-536`; `npc-conversation-state.js:112-119`). `start` runs again only after a page reload, when only the variables are restored and the chat restarts at its entry knot (`npc-conversation-state.js:123-139`, `person-chat-minigame.js:497-500`). r14 gets its second check only through `"reload": true`, and its note ("the chat opens at start again") describes that reload, not a new visit. Three effects follow. (1) After a wrong check Irina says "Work it through before you ask me again" (irina:566), but the option never comes back in normal play. (2) A wrong first check loses the "CONFIRMED BY VOLKOVA" credit (erb:171) for good. (3) A page reload resets the oracle, so a player who notices can check every slot by reloading. The ink comment (irina:74, 592-594), `TESTING_WALKTHROUGH.md:70` ("cleared each time her conversation opens") and the log all say "per visit" | irina:74, 90, 554-572, 595; TESTING_WALKTHROUGH.md:70 | Make a "visit" a trip back to the console. (a) Make `slot_checked_visit` a synced scenario global: declare it in `globalVariables`, write it with `#set_variable:slot_checked_visit=true` beside each `~` in irina:554, 564 and 571, and add it to the m06 block of `missions.json`. (b) Remove the clear at irina:90. (c) Add a HaX mapping: `room_entered:data_center`, condition `globalVars.irina_recruited === true && globalVars.found_architects_fund !== true`, `cooldown: 0`, not onceOnly, `setGlobal: { slot_checked_visit: false }`. Each further check then costs the walk floor → server room → data centre → floor, which makes her line true, and a reload no longer resets it. (d) In r14, replace the reload step with: reopen (option absent), `{"room":"data_center"}`, reopen (option present). Correct the ink comment and walkthrough 17a to match |
| M-R2-2 | major | **Once the cover is already strained, the console lockout costs nothing, and the deduction can be skipped again.** The mapping requires `cover_strained !== true` (erb:1287). The pad allows two tries per opening and resets on reopen (`pin-minigame.js:57`), and earlier guesses stay listed (`:49-55`). So a player whose cover went earlier can still try the seven indexed slots (erb:76) in four openings. That's round-1 M1 again for this group. The group is large: the cover strains on a guard catch, on any staff KO, or after Irina's brusque opener (erb:886-888, 1242-1271). The credit still says "TRACED THROUGH THE MIXER" (erb:170) | erb:1285-1291, 170 | Give every lockout a score cost, alongside the one-off strain. Add a second mapping on the same pattern and condition, minus the `cover_strained` clause, onceOnly false, `setGlobal: { console_tripped: true }` (declare it; sync it to the debrief). Gate erb:170 on `!globalVars.console_tripped`, and add `"THE ARCHITECT'S FUND: $12.8M — FOUND BY ELIMINATION ON THE CONSOLE"` for `found_architects_fund && console_tripped && !irina_confirmed_slot`. Optionally add one debrief beat in `evidence_review` keyed on `console_tripped`. This uses score and consequence, not a gate, which is the shape the skill asks for |
| m-R2-1 | minor | **The signing record prints the fund's slot number.** "Release: cold slot 4471 (1ARCHITECT9FUND)…" (erb:2172, `<%= fund_slot %>`). On the early-KO route the wing and the CEO's office are reachable after flag 3 but before the fund, using a knocked-out Irina's dropped badge (erb:446-451, round-1 m7). There, dusting the clipping and opening the case hands over the console answer | erb:2172 | "Release: the Fund's cold slot (1ARCHITECT9FUND), balances to six recipient wallets". The wallet name already ties it to the fund document |
| m-R2-2 | minor | **The lockout gives no warning.** The console's observation says how to use it but not that bad slots are logged (erb:1822). The pad shows "1 attempt remaining" (`pin-minigame.js:607-610`), but nothing says a lockout costs the cover. A player who makes one honest slip and one typo is strained with no chance to see it coming | erb:1822 | Add one sentence to the observation: "It logs every opening to the exchange's on-call phone." It's in-world, it's a fair warning, and it gives the HaX text (erb:1290) something to point back to |
| m-R2-3 | minor | **What the strain says doesn't fit the console cause.** After a console lockout, the next lines are Satoshi's "Somebody on my floor rang the FCA an hour ago" (satoshi:63), the recap's "Someone on that floor" (phone:269), the debrief's "Somebody on that floor rang the FCA" (debrief:335) and the credit "somebody on the floor rang the FCA" (erb:215). The console is in the data centre, and the strain may be minutes old | satoshi:63; phone:269; debrief:335; erb:215 | Use neutral wording that fits every cause: Satoshi "Somebody here rang the FCA tonight."; the recap "Someone here has a reason to ring the FCA about you now."; the debrief "Somebody at HashChain rang the FCA…"; the credit "strained — somebody at HashChain rang the FCA". These are spoken-line changes; m06 has no cached audio yet |
| m-R2-4 | minor | **The hub checks how the server-room door was opened, not whether it was** (the sweep's bug class). The door's own task completes on entry (erb:1008-1013). `obtain_access_tools` is required and completes only when the wordlist is picked up (erb:266-275). A player who guesses the passphrase from the checklist ("It is the obvious one", erb:53) then has three problems. (1) A required task stays open for the rest of the night. (2) The recap still says "Get it from her" (phone:278-284). (3) If they take the wordlist later (r14's route, or a turned Irina's `after_choice`), the hub offers "I've got Volkova's wordlist. What do I do with it?" → "Put it next to the house convention and the server room opens." (phone:176, 370-371), and the pickup text says the same (erb:969), about a door that's already open. It isn't a dead end, because Irina and the relay can still give the list | erb:266-275, 969; phone:176, 278-284 | Mark `obtain_access_tools` `"optional": true`; the required step is `find_server_credentials`, which completes on entry. Add `and not server_room_entered` to phone:176 and phone:278. Add `"skipIfGlobal": "server_room_entered"` to the text at erb:969 |
| m-R2-5 | minor | **The log and comments say dusting the clipping is a stealth beat, and nothing makes it one.** Nothing reacts to dusting. Kemal's challenge fires when he sees the player in the hall at all (erb:2026-2032), whatever they're doing, and after a talk-past nobody is watching. Whether his sight challenge can open over a running dusting minigame is a **browser check** (the sight-challenge source wasn't read) | erb:2069, 2153 (comments); IMPROVEMENT_LOOP_LOG.md D2 row | Reword the comments to "inside Kemal's hall; his usual sight challenge applies". Add the overlap to the browser checks owed |
| m-R2-6 | minor | The new collect task has no `showProgress`, which is the validator's one new note | erb:480-488 | Add `"showProgress": false` (one item; a counter would read oddly) |

**Not counted, already accepted by the orchestrator:** a lockout at the CEO's safe on the early-KO route, before the fund, also passes the console mapping's condition and sends the console text (erb:1277-1284). Not re-litigated.

## The new pieces, as puzzles

1. **The console lockout.**
   - **Is it fair?** Mostly. The pad counts down out loud ("1 attempt remaining", `pin-minigame.js:607-610`), keeps the guesses on screen, and a lockout only closes the pad until it's reopened. There's no fail state. What it lacks is any warning that a lockout costs something (m-R2-2).
   - **Is it readable?** HaX's text names the cause at once: "That console logs every slot it opens. Somebody's phone just buzzed." (erb:1290). The later echoes, though, describe a different cause (m-R2-3).
   - **Is it scoped right?** Yes, for the event. The condition does the work the event's missing object id can't do. A cancel carries `result: null` and can't trip it. The data-centre door's pad is open by then. The safe edge has been accepted. The gap is the *who*: players who are already strained pay nothing (M-R2-2).
2. **One slot check per visit.** The idea is right: she confirms the player's reasoning rather than doing it for them. The latch is in the wrong place for this engine (M-R2-1). Once that's fixed, a wrong check should send the player back to the data centre, which is the "work it through" her line asks for. One small point stays as built: the menu lists the six slot numbers as choices (irina:545-557). That's acceptable, because the player has already read them in the settlement log, and it isn't an answer.
3. **Irina's wordlist after she's turned.** It works and reads well. "I still need that wordlist." → "Of course. Here." (irina:599-603) hands over no recipe; the fixer rightly cut "Bitcoin's at the top". The detained variant takes it from her desk with narration (irina:604-608) and is safe whatever order things happen in: she's collected on the next room entry, and the relay takes over (phone:183). The office badge from a turned Irina (irina:611-615) closes round-1 m9. One knock-on: the late wordlist now creates the stale "what do I do with it?" hub beat when the door is already open (m-R2-4).
4. **The signing case and the print on the clipping.**
   - **Do the print and the lock match?** Yes, exactly (see the confirmation section).
   - **Can the case be found?**
     - **The object:** it sits at (3,3) in Satoshi's office, described as "on the desk" (erb:2156-2163). That position is provisional for room dressing, and whether it reads as being on the desk needs a render.
     - **The pointers:** the task "Open the CEO's signing case" shows from the moment the wing aim is revealed (erb:480-488). The recap points at the print without naming the surface: "He'll have left that thumb on something he's proud of." (phone:344-346, once the player has been in the office). The clipping's own observation says there's a thumbprint on the glass (erb:2077).
     - **The print kit:** the briefing names it (briefing:95), so the player knows they carry it.
     - **The order:** the kit's interaction runs dusting *before* anything else on the clipping (`interactions.js:1243-1257`). A player who reads the clipping on the way through will usually lift the print before they ever see the case. The case then opens first time. That's key-before-lock for an optional beat. It suits "fun, not hard", so I'd keep it; it's recorded in the audit below.
   - **The reward:** the HaX text (erb:1294-1298), the debrief line (debrief:430-432) and the credit (erb:178) are all gated on the pickup. The record itself prints the fund's slot (m-R2-1).
5. **The three-room safe clue.**
   - The chain: the safe's observation ("a number that means something to him", erb:2188) → the clipping's "Until the last coin." (erb:2076) → Priya's margin, "Last coin due around 2140" (erb:1912), with Irina's email as a second route to the meaning (erb:1959).
   - That's a real deduction across rooms. The number travels with the player from the lab, where it reads as an analyst's aside and means nothing until the clipping connects it.
   - The only outright statement is a turned Irina's (irina:506; phone:338), which is a reward.
   - Nothing on the clipping, the safe or in Satoshi's ink gives the number away (a grep for "2140" finds only Priya's margin, Irina and the phone recap).

## Fresh pass with the skill

### Boss-key audit (changed or new rows only; the rest stand as in round 1)

| Lock | erb | Seen at | Key / code available at | Verdict |
|---|---|---|---|---|
| `server_room` (password) | 1650-1652 | d2 | checklist d1 (convention and year, pointer toast); wordlist d2 | ✅ The recipe is no longer handed over. The two halves are still found before the door, but each now needs reading |
| `cold_storage_console` (PIN 4471) | 1814-1822 | d4 | Priya's write-up d3 + settlement log and pool config d4 | ✅ for a held cover. ⚠️ for an already-strained cover (M-R2-2). The Irina oracle is fixed in principle but mis-latched (M-R2-1) |
| `satoshi_signing_case` (biometric, new, optional) | 2152-2163 | d6 | Satoshi's print on the clipping, d5 | ⚠️ Key-before-lock in practice, because the kit dusts on first touch (`interactions.js:1247`). It's acceptable for an optional beat; no change |
| `executive_safe` (PIN 2140) | 2180-2188 | d6 | clipping d5 (motive) + Priya d3 (number) or email d3 (meaning); turned Irina | ✅ Now a cross-room deduction |

### Are the mission's choices required?

Unchanged and sound. The call-in needs both decisions and all four flags (erb:1350). The new optional threads carry score, not gates: the signing case has a credit, a debrief line and a HaX text. The console lockout feeds the cover, which already has consequences at Kemal, Satoshi, the debrief and the credits. Nothing new was added to `concludeRequires`.

### Answers handed over: sweep

| Where | What | Verdict |
|---|---|---|
| Checklist toast, erb:1006 | A pointer to Volkova's list | ✅ |
| Wordlist pickup text, erb:969; hub beat, phone:370-371 | "Put it next to the house convention" | ✅ (a pointer; stale only after the door is open, m-R2-4) |
| Recap, phone:285-287 | The full door recipe | ✅ The player asked for it; accepted in round 1 |
| `after_choice` wordlist, irina:599-603 | No recipe | ✅ |
| Clipping, erb:2076-2077 | The motive, and "thumbprint on the glass" | ✅ Pointers |
| Priya's margin, erb:1912 | 2140, unexplained | ✅ Half of a two-room clue |
| Recap case hint, phone:344-346 | "Something he's proud of" | ✅ Doesn't name the surface |
| Signing record, erb:2172 | The fund slot | ⚠️ Only on the early-KO route (m-R2-1) |
| Irina slot check, irina:542-572 | Confirms a named slot | ✅ Once the latch is fixed (M-R2-1) |
| HaX slot ladder, phone:478-493 | Rung 3 is a near-answer | ✅ Asked for, three rungs deep |
| Task titles | None names a code | ✅ |

### HaX's hub: does each line check whether a step is done, or how it was done?

The whole hub (phone:144-208) and recap (phone:266-362) were read line by line.
- **Outcome-checked, ✅:**
  - the floor (`guard_resolved`, set on entering the floor whatever the method, erb:978-983);
  - the server-room door lines (`server_room_entered`);
  - the data centre (`entered_data_center`);
  - both badges (the pickup mappings cover Irina's hand-over, a dropped badge and the relay: erb:907-939);
  - the Kemal lines (now also `resolve_aim_open`);
  - the signing case (`resolve_aim_open`, `signing_record_found`);
  - the money (`assets_decided`) and the flags (`flagN_submitted`).
- **One exception:** the wordlist (m-R2-4). `obtain_access_tools` and three wordlist lines key on *having the list*, when the step it serves (the server-room door) can be done without it.
- **Not a defect:**
  - The recap's office line (phone:275) hides for a turned Irina, who can now lend the badge. The office is optional and its leverage line no longer matters once she's turned.
  - The Kemal block hides while he's hostile (phone:328). A hostile minder makes the next step obvious.

### Silent-failure sweep (new content only)

- `onPickup.setVariable` on an item inside a container: this is the existing safe-file pattern (erb:2199-2200), and the record copies it (erb:2175). ✅
- The collect task's ids match the item id and name (erb:483; `objectives-manager.js:172-174` matches on id or name). ✅
- `signing_record_found` is declared (erb:683), synced to the phone (phone:94) and the debrief (debrief:47), and is in `missions.json` (log). ✅
- No `[LORE:]` or `[NOTE:]` in the new text. No new observation states its own lock's code. ✅
- Rename residue and stale geography: the new lines name no directions except "his desk", and the office is north of the wing (erb:1976). ✅

## Browser checks owed (carried and new)

1. The console lockout: the `minigame_failed` data shape in the live engine, and that a cancel doesn't trip it. Statically confirmed; one live run is still wanted.
2. Dusting the clipping and opening the case, then a reload: does the lift persist and does the case still open?
3. The case's position (3,3) reads as on the desk; the clipping reads on the wall (room dressing).
4. New: whether Kemal's sight challenge can open over a running dusting minigame (m-R2-5).
5. New, after the M-R2-1 fix: a turned Irina refuses a second check until the player has been back to the data centre, and still refuses after a reload.
6. N1: one real pick inside Kemal's cone (carried from round 1).

## What to do, in order

1. M-R2-1: move the latch to a synced global cleared on entering the data centre; update r14, the walkthrough and the ink comment.
2. M-R2-2 together with m-R2-2: add `console_tripped`, the credit variant and the observation's warning sentence.
3. m-R2-3: neutral strain wording (four lines).
4. m-R2-1, m-R2-4, m-R2-5, m-R2-6: the record's slot, the wordlist gates and optional task, comments, `showProgress`.
5. Re-run r1–r15, `reopencheck`, `tagdiff`, the validator and `dialoguelint`. Then the browser checks above.

Each step stands alone. Steps 1–2 touch Irina's ink, HaX's mappings, the credits and `missions.json`; step 3 touches Satoshi's, the phone and the debrief ink.

## Verdict

**Not ready to close; round 3 should follow.** Every round-1 finding and decision is in the files, and D2 works: the print's owner and the lock's enrolled name match exactly on both client and server. Two majors remain, both small and mission-local, and both about the central console puzzle:
- **M-R2-1:** the per-visit latch sits in a knot the engine doesn't re-enter on a reopen.
- **M-R2-2:** a player whose cover is already strained can still skip the deduction by guessing.

Nothing is a blocker. No route dead-ends: r1–r15 pass, the validator shows no errors, and `dialoguelint` is clean. This round's findings are narrower than round 1's (mechanics of the new pieces, not structure), so the stage is converging. That fits the five-cycle aim: round 3 should implement these and confirm, and round 4 should be a browser-backed confirmation.

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 2 of the puzzle-chains stage (static; no browser session). Routes: 15/15 pass. Validator (`--skip-ink --no-graph`): no errors; the known notes, plus one new `showProgress` note. `dialoguelint`: clean.
