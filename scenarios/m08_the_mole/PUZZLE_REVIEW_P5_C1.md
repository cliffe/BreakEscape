> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# m08 The Mole: puzzle-chains review, pass 5, cycle 1

Stage 2, `mission-puzzle-chains` rubric. Fresh reviewer, read-only. 2026-10-14.
Kind of game: a SAFETYNET campaign mission and the season finale, a TV spy thriller turned inward. The VM flags are required and woven into the story, kit is cumulative from m01–m07, and the deduction must not be handed over by a task title, toast or NPC.

Everything below was checked against `scenario.json.erb` (cited `erb:N`), the ink (`ink/<file>:N`) and the engine. `PUZZLE_CHAINS_PLAN.md` was read only as background (it predates Option B and the three lockers), and nothing is taken from it unchecked. Alignment is closed, so nothing that `ALIGNMENT_REVIEW_P5_C1-C3.md` settled is re-opened here; where it touches a chain it is listed under "Considered". I opened no SecGen XML and none of the four restricted field guides. I started no browser session and edited no file except this one.

## Checks run (outputs in the session scratchpad, `m08-puzzle-c1-reviewer/`)

- **Route driver.** r1–r11 all pass ("all expectations met").
- **Probe routes** (kept in `m08-puzzle-c1-reviewer/probes/`, all pass):
  - `p1_closed_then_director_ko`: three misreads before flag 4 (the Director takes the audit over), then the Director is KO'd, then flag 4. HaX's flag-4 text asks for the reading, her hub offers "[I can name the leak.]" and the reading names him (`named_by_hax`). **No soft-lock** on that combination.
  - `p2_phantom_confirm_only`: Phantom's audit beat is the only "row" confirmed. The Director still says "take it to the people on it"; HaX's ladder sorts it out ("Ask the men who badge through the lab door"). This is the evidence for m1.
  - `p3_vm_hint_order`: the hub has no VM topic before flag 1, and its first VM topic appears after flag 1 and explains flag 1 ("That's your first flag"). This is the evidence for F1.
- **Validator** (`--skip-ink --no-graph`): no errors. Two warnings, both known and intended (the `brief_taken` co-fire on `closing_debrief`; the confrontation cutscene isn't onceOnly so a reload can reopen it).
- **Room depth** (`room_depth.py`): 9 rooms, none empty. Depth 0 lobby; 1 Crypto Lab, Director's office, ops floor; 2 break room, intel analysis, interrogation, archives, server room.
- **Engine facts used below.**
  - Punching any NPC makes it hostile (`player-combat.js:328-337`). With no `behavior.hostile` block it chases at 145 and hits for 10 (`npc-behavior.js:354-361`); the player walks at 150, has 100 HP, and a jab does 10 per 0.5 s (`combat-config.js:11-18`, `:36-38`).
  - A KO'd NPC's setGlobal, completeTask and text mappings still run; only its own conversations are skipped (`npc-manager.js:876-887`). So ATHENA's tidy and go-bag latches survive her being knocked down.
  - An aim with an `aimsCompleted` condition isn't story-gated: a task completing inside it reveals the aim and can complete it (`objectives-manager.js:725-737`, `:838-850`). So "Confront The Mole" being locked in the panel never blocks the confrontation, which opens on globals alone (`erb:1704-1712`).
  - `#clone_keycard` carries the NPC's `rfid_protocol` into the clone minigame (`chat-helpers.js:341-347`), and the minigame runs a darkside attack for `MIFARE_Classic_Custom_Keys` (`rfid-ui.js:470-481`). m03 already clones such a card in conversation (`m03 erb:1395`).
  - `lockpick_used_in_view` stops a pick and opens a person-chat on any NPC in the room who can see the player and has the mapping (`lockpick-catch.js:22-50`; m02 uses it, `m02 erb:2035-2043`).

## Chain map

```
START main_lobby (d0)
 ├─ ATHENA: hints for the archives (kettle) and the safe (service number, ops tray). Reads out neither
 ├─ Visitor Badge Printer, PIN 0311 ◄──── post-it, break room (d2) ──► printed server badge
 └─ north: director_office (d1)
      Netherton: brief (aim 0) ─┬─ "[I'll need access.]" ─ waits for all three interviews (or KOs)
                                │       └─ clone his EM4100 card (#clone_keycard) ──► server-room key
                                ├─ KO ─ his card drops ──► server-room key
                                └─ "[I can name the leak, sir.]" ◄── door audit + a clock + one confirmed row
                                         4-step reading (when / who / why not Cipher / why trust it)
                                         right ──► mole_identified, name_the_mole, suite code ALOUD
                                         3 wrong ─► before flag 4: tip-off, he names on flag 4
                                                    after flag 4: he names now (no code aloud)
      Director's Safe, PIN 2407 ◄── personnel printout, ops floor (d1)
          ├─ Suite Code Card (5386)
          └─ Okafor's sealed evaluation (debrief option, credit, Nightshade's Okafor beat and locker key)

operations_floor (d1): Cipher (alibi, audit beat confirms his row, locker key) · personnel printout
 ├─ north: intel_analysis (d2): Phantom (audit beat clears him; NOT a confirmation, m1) · Phantom's notes (points to the audit)
 ├─ south: security_archives (d2), password ◄── post-it (d2)
 │     Badge Audit Printout (THE DOOR) · threat-database catalogue · past leaks
 └─ east: server_room (d2), RFID ◄── clone | printed badge | dropped card
       VM launcher ─► flags 1-4 at the relay (all in concludeRequires)
       Server Access Log excerpt (A CLOCK: crypto-lab-04, D-2 10:38, 47 min)
       flag 4 also gives the clock and turns the Director's reading into "a door and a login"

cryptography_lab (d1): Nightshade (audit beat confirms his row; Okafor beat; locker key) · CyberChef station
 ├─ south: interrogation_room (d2), PIN 5386 ◄── code card (safe) | Netherton aloud
 │     confrontation opens on entry once all four flags AND the name are in ─► the fate
 └─ west: break_room (d2): post-it (archives pw + printer PIN) · Leak Timeline (A CLOCK) · HaX in person · off-duty agent
       Lockers 0x23 / 0x47 / 0x88 ◄── picks (m01 kit) | each owner's key after his audit beat | KO drop
       0x47: USB stick (Base64 then ROT13; thumbprint for the m04 kit) · 'Deep State' page · holdall
       (all three neutral until the naming; wiped/taken if he is tipped off first)
```

Critical path for the ending: brief → server room (printer, clone or KO) → flags 1–4 → archives (password from the break room) → a clock (timeline, excerpt or flag 4) → one confirmed row (Cipher or Nightshade) → the reading to the Director → the suite (code aloud, or the safe) → confrontation → debrief.

Off the ending's path, carrying consequence, credits and score: the three lockers and their contents, the decode, the print, Okafor's evaluation, Phantom's notes, the off-duty agent, the interviews on the printer route (`work_the_suspects` stays incomplete, which costs score but never the ending, per the engine fact above).

## Boss-key audit

| Lock | Seen at | Key / code available at | Verdict |
|---|---|---|---|
| Visitor Badge Printer PIN (`erb:1107-1129`) | d0 | post-it, break room d2 (`erb:1822-1831`) | ✅ boss-key (start room, opposite wing) |
| Server room RFID (`erb:1460-1465`) | d1 (ops floor east door) | clone at d1 after interviews d1–d2 (`ink/m08_director_netherton.ink:169-210`); printed badge d0 via d2; KO drop d1 | ✅ on the clone and printer routes; ⚠️ key-before-lock on the KO route (by choice) |
| Security Archives password (`erb:1518-1523`) | d1 (ops floor south door) | post-it d2, other wing (`erb:1828`) | ✅ boss-key |
| Director's Safe PIN (`erb:1211-1220`) | d1 | personnel printout d1, other wing (`erb:1352`) | ✅ boss-key; a small deduction (Requested-by line plus margin note) |
| Interrogation suite PIN (`erb:1675-1680`) | d1 (lab south door) | code card in the safe d1; Netherton aloud on a correct reading (`ink/m08_director_netherton.ink:404-409`) | ✅ boss-key. Picks can't open it and the PIN cracker is withheld (`ink/m08_opening_briefing.ink:182`) |
| Lockers 0x23 / 0x47 / 0x88 (`erb:1860-2054`) | d2 | picks from the start; each key from its owner after his audit beat | ✅ *by design* for the picks (m01 capability); ✅ boss-key for the keys |
| **The naming** (soft lock, `ink/m08_director_netherton.ink:227-410`) | d1 | door audit d2 (archives); clock d2 (break room or server room) or flag 4; a confirmed row d1/d1 (Cipher, Nightshade) | ✅ boss-key, three parts in three different rooms. The best chain in the mission |
| Confrontation (`erb:1704-1712`) | d2 | all four flags (server room d2) and the name (Director d1) | ✅ |
| USB stick decode (`erb:1919-1954`) | d2 | CyberChef station d1 (`erb:1655-1661`) | ✅, but nothing checks the decode (see "Considered") |
| Thumbprint on the stick | d2 | m04 kit from the start | ✅ *by design* |

Headline numbers: 9 rooms, 0 empty, 3 locked rooms plus 5 locked objects, 4 VM flags all in `concludeRequires` (`erb:492-499`). The critical path is 3 locks (server room, archives, suite), 4 flags and the 4-step reading.

## Severity table

| # | Sev | Finding (short) | Source |
|---|---|---|---|
| F1 | **major** | HaX's VM hint ladder is one step late: the box hint appears only after flag 1 and explains flag 1; the hub has nothing for flag 2 | new (probe p3) |
| m1 | minor | The Director's confirmation gate says "the people on it"; Phantom is on it and confirms his row, which doesn't count, so the player is sent round again | new (probe p2) |
| m2 | minor | Every NPC fights back at engine defaults (145 / 10, no leash) when punched, with no HaX text, including the Director, whose KO is a designed route | new |
| m3 | minor | The access-log excerpt promises root will say "whose account this is"; the flag-4 text then says "no face" | new |
| m4 | minor | Stale comments contradict the file (Option B, three lockers, the PIN cracker, optional interviews) | new |
| m5 | minor | The Director's All Zones card is EM4100, a step down from m03's MIFARE clone; backlog asks m08 to show the difference | new (backlog) |
| m6 | minor | Picking an innocent man's locker costs nothing, so the locker herrings break the brief's "red herrings should cost something" | new (proposal, optional) |
| m7 | minor | With the cloner carried and no saved card, the server-room reader opens a cloner screen with nothing to emulate | carried (m07 F3, backlog engine) |

**Counts: 0 blockers, 1 major, 7 minors.** F1 is new. m1–m6 are new (m5 and m6 are optional proposals for the orchestrator). m7 is carried and engine-side.

No soft-lock on the ending's path. Every required lock has a route that can't be burnt:
- the server room: printer, clone or the dropped card;
- the archives: one source (the post-it), but it's a room object that can't be lost;
- the naming: the reading, three misreads (before or after flag 4), or HaX's reading after a Director KO, including a KO after the check has closed (p1);
- the confirmation: Nightshade always confirms; Cipher after an apology if accused; skipped when both are down (`ink/m08_director_netherton.ink:242-251`);
- the suite: the code aloud, or the safe from the printout.

---

## Major finding

### F1. HaX's VM hint ladder is one step late
- **Evidence.**
  - The hub's first VM topic, "[What am I looking at on this box?]", is gated on `found_gitlist_vuln` (`ink/m08_phone_agent_0x99.ink:88`), which only the flag-1 mapping sets (`erb:684-688`). Its answer explains flag 1: "One crafted request gets you code execution with no login at all. That's your first flag." (`:89-91`). A player who can see it has already done it.
  - Before flag 1 the hub has no VM topic at all (probe p3, `notSaid: "What am I looking at"`). The support then is the launcher text (`erb:970`) and the two guides it offers.
  - Between flag 1 and flag 2 the hub has nothing about the history and the stash. The only pointer is the flag-1 text ("Now read: the history and the stash", `erb:688`), which scrolls away in the phone history.
  - The two later topics are in step: "[I've got credentials. Now what?]" after flag 2 points at flag 3 (`:93-96`), and "[The mail's real. How do I make it stick?]" after flag 3 points at flag 4 (`:97-100`).
- **Why major.** The four flags are the required core of the mission. HaX's hub is where a stuck player goes, and the brief asks for a progress-gated hub that checks whether a step is done. A player stuck before flag 1 or between flags 1 and 2 finds either nothing or a hint for the step they just finished. The guides soften it, which is why this isn't a blocker.
- **Fix** (ink only, `m08_phone_agent_0x99.ink`; declare `server_room_entered` as a VAR, it's already a scenario global at `erb:2069`):
  - Re-gate the flag-1 topic: `+ { server_room_entered and not found_gitlist_vuln } [What am I looking at on this box?]`. Keep the three lines, but drop "That's your first flag" for "Get that working and it's your first flag."
  - Add a flag-2 topic: `+ { found_gitlist_vuln and not found_leaked_creds } [I'm on the box. Where do I look?]` → "Read the history, not just the files. Then the stash: git keeps what people meant to throw away." / "Whoever's account it is, they committed something they shouldn't have. Git secrets guide's yours if you want it."
  - Add `not found_architect_comms` to the credentials topic and `not found_access_logs` stays on the mail topic, so each topic disappears once its step is done (only the current step shows).
  - The hint wording describes the VM, so "needs checking against SecGen by the user" (U1): the unauthenticated exploit, the stash, and the sudo rule.
  - Add p3, inverted, as route r12: before flag 1 the box topic is offered after `server_room_entered`; after flag 1 the new flag-2 topic is offered and the old one isn't.

---

## Minor findings

### m1. Phantom's confirmation doesn't count, and nothing says so
- **Evidence.**
  - The gate: "Before you read it to me, take it to the people on it. If a man's own row is wrong, he will say so." (`ink/m08_director_netherton.ink:247-248`). It passes only on `cipher_audit_confirmed or nightshade_audit_confirmed` (`:242`).
  - Phantom is on the audit (the TRAVEL DESK row, `erb:1563`). His audit beat confirms it ("So it printed. Wheels up 10:09…") and ends "Tell the Director." (`ink/m08_suspect_phantom.ink:81-86`). It sets `phantom_alibi_known`, not a confirmation.
  - Probe p2: after Phantom's beat the Director repeats the gate line. HaX's ladder has the right wording ("Ask the men who badge through the lab door", `ink/m08_phone_agent_0x99.ink:133`).
  - Leaving Phantom out is correct: step 4 asks "That audit is Phantom's query… Why trust it?" (`:310`), so his own confirmation would be circular. The gate's wording is what's wrong.
- **Fix.** Netherton: "Before you read it to me, take it to the men who went through that lab door. If a man's own row is wrong, he will say so." Phantom's closing line: "…I'd rather you didn't tell me. And don't take my word for my own printout. Ask the men on the lab door." Add p2, inverted, as a route expectation.

### m2. Every NPC fights at engine defaults when punched
- **Evidence.**
  - No NPC in m08 has a `behavior.hostile` block (grep of the erb: no `"hostile"`), and nothing in the ink turns anyone hostile. A punch does (`player-combat.js:328-337`), and then the NPC chases at 145 for 10 a hit with no leash (`npc-behavior.js:354-361`), against a walk of 150.
  - The Director's KO is a designed route (his card drops, `erb:808-814`), and so are the suspect KOs (each completes its interview, `erb:1032-1067`). HaX reacts only to the KO, never to the first punch, and never says how to fight.
  - ATHENA, the building AI, is an `npcType: person` with an office worker's sprite (`erb:593-605`), so she chases and punches too. HaX in person does the same.
  - Compare m06's Kemal (75 / 3, with a HaX controls text, `m06 erb:1404`), m07's Hollis (100 / 4, `m07 erb:1293`), and m01's `npc_attacked` texts (`m01 erb:656-690`).
- **Why minor, unlike m06 and m07.** Nobody in m08 starts a fight. The player has to press Q and punch first, and at defaults a player who can jab wins (about 5 s to KO against about 20 s to be KO'd). The risk is a player still in jab mode who clicks someone to talk, and then can't outrun them.
- **Fix** (existing fields only):
  - `"behavior": { "hostile": { "chaseSpeed": 90, "attackDamage": 3, "pauseToAttack": true } }` on Netherton, Cipher, the junior analyst, ATHENA and HaX in person. Phantom and Nightshade in the lab (field-trained): 110 / 4. The off-duty agent: 90 / 3.
  - One onceOnly HaX text per named NPC on `npc_attacked:<id>` (the m01 pattern), with the m05/m06 controls wording, for example on the Director: "You hit the Director. Q cycles open hand, jab, cross; E or click when he's in front. Or walk away: he's slower than you. Press Q till the open hand shows to talk to anyone again." One shared text for the three suspects ("…he isn't your enemy until the door log says so") keeps it short.
  - Not on ATHENA's KO: a building AI being knocked down needs no story; leave it silent.
  - Browser check owed: the Director's chase speed and the text.

### m3. The access-log excerpt promises a name the box no longer gives
- **Evidence.** The excerpt's observation: "Only root on the box will tell you whose account this is." Its pencilled note: "Need root to unmask the account." (`erb:1507`, `:1509`). Under Option B the flag-4 text says "A terminal and a time, no face" (`erb:747`), and Netherton says "A login is a key, Agent, not a hand on it." (`ink/m08_director_netherton.ink:231`).
- **Fix.** Observation: "…Only root on the box will show the account behind it, and an account is not a person." Pencilled note: "…They were copying it. Root for the account. The doors for the person." (Item text, not voiced.) Whether the VM's account name gives the person away is U1 (below).

### m4. Stale comments
- `erb:265-266` says ATHENA puts the PIN cracker "on a bench in Technical Analysis"; the opening says it's signed out to 0x47 (`ink/m08_opening_briefing.ink:182`).
- `erb:56` lists only `nightshade_locker`; there are three lockers. `erb:63` says the confrontation opens on "all four flags in"; it also needs the name.
- `erb:673-674` ("flag 4 alone names him"), `erb:706-708` ("Source of mole_identified"), `erb:1489-1493` (mole_identified "hang off these four booleans") all predate Option B.
- `erb:1270`, `:1376`, `:1585` call the interviews optional; they've been required since pass 3 (`erb:322-328`). `:1585` also says "the case is made on the box".
- `ink/m08_suspect_nightshade.ink:6` ("The box makes the case, not this") and `ink/m08_suspect_phantom.ink:5-6` ("pointing at Nightshade"; his notes now point at the audit).
- **Fix.** Rewrite them. No behaviour change.

### m5. The Director's card is the weakest protocol in the season (optional)
- **Evidence.** His `rfidCard` is EM4100 (`erb:1169-1173`); HaX: "EM4100 has no crypto; the reader can't tell." (`ink/m08_phone_agent_0x99.ink:77`). In m03 the player already cloned a MIFARE Classic card with custom keys in conversation, with a darkside attack (`m03 erb:1395`, `rfid-ui.js:470-481`). The backlog asks m08 to show the EM4100/MIFARE difference (`docs/IDEAS_BACKLOG.md:13`).
- **The case for each.** EM4100 fits the theme (headquarters breaking its own rules, like the post-it and the unpatched repo). MIFARE custom keys makes the clone a real beat: about 30 seconds standing beside him "as if to read the maps" (`ink/m08_director_netherton.ink:191`), and it says that even the top card in SAFETYNET is a broken standard.
- **Recommendation.** Switch, mission-local, no engine change: `"rfid_protocol": "MIFARE_Classic_Custom_Keys"`. HaX's line becomes "Reader's east of the ops floor. Open the cloner, pick his card from Saved, emulate it. MIFARE Classic, our own top card, and it still fell to a darkside attack." Leave the printed badge as it is (it's a `keycard` with `opens_lock`). Browser check owed: the attack returns to Netherton's chat (`clone_debrief`), and the clone opens the reader. If the orchestrator prefers EM4100, add one line to `clone_debrief` that says why it matters, and close the backlog item as "shown by contrast with m03".

### m6. Searching an innocent man's locker costs nothing (optional proposal)
- **Evidence.** The picks open all three lockers from minute one (`erb:262`, `:1860-2054`). Cipher's token pouch (`erb:1884`) and Phantom's boarding stub (`erb:2039`) are herrings, and reading them costs nothing. The brief: "red herrings should cost something (trust, time, a tipped-off mole)". Accusations already cost a tip-off (`erb:929-937`); a search doesn't, and time has no mechanic here.
- **Would it exist anyway?** Yes. The off-duty agent sits beside the lockers (`erb:1802`, lockers at y 7.45), "listening to every conversation in the room" (`erb:1816`), and he's the floor's gossip (`ink/m08_background_agent.ink:43`).
- **Proposal.** Give him `"los": { "enabled": true, "range": 160, "angle": 140 }` and a `lockpick_used_in_view` person-chat mapping, onceOnly, condition `!globalVars.mole_identified`. New knot `on_locker_picked`: "Oi. That's not yours." / "I didn't see anything. I'll be telling everyone I didn't see anything." It sets `locker_seen_picked` (credit, debrief). If the locker isn't 0x47, it also sets `nightshade_tipped_off` (one shared text, as the accusations).
  - The keys stay the quiet route: each owner hands his over after the audit beat. Picking with the agent down, or out of his cone, stays free.
  - What it costs: a picked 0x47 isn't tidied, because the player is already in it. So the real cost lands on searching the herrings, which is the point.
- **S2 and limits.** The catch stops only the first pick (onceOnly), so nothing soft-locks. It mustn't fire after the naming. It also can't fire for a player holding any key until the engine's "Switch to Lockpicking" LOS fix (`m02 erb:2030-2034` notes the same). Leaving it out is also defensible: it taxes an earned capability. Orchestrator's call.

### m7 (carried). The reader opens the cloner with nothing to emulate
- With the cloner carried from the start (`erb:267-273`), a player who reaches the server-room reader before the clone or the printer gets the cloner minigame with nothing saved. It's the m07 F3 behaviour and an engine backlog item (`docs/IDEAS_BACKLOG.md:48`). HaX's "[How do I get into the server room?]" names both routes (`ink/m08_phone_agent_0x99.ink:72-87`), so the player isn't stuck. Deferred to the engine.

---

## Considered, no change recommended

These are recorded so the next round doesn't re-raise them.

- **The stick decodes to a signed confession** ("From: nightshade_deep_state … -- N", `erb:116`). Alignment C3 kept it as corroboration earned through the picks and a two-layer decode (`ALIGNMENT_REVIEW_P5_C3.md:44`). From the chains side: nothing checks the decode (no global, credit or line), so it's pure corroboration. A confrontation choice quoting the mail would recognise it, but Nightshade says the candle line himself (`ink/m08_nightshade_confrontation.ink:103`), so it adds little. Leave it.
- **The audit reading can be guessed.** Each step has 4 options; two misses are free and the third closes the check at a visible cost (tip-off before flag 4, "the Director read it himself" after). Wrong answers get a specific correction (`ink/m08_director_netherton.ink:347-358`), and the warning at two misses is clear (`:360-366`). Step 4's answer is the step the gate made the player do. That is a fair reading test, and the fallbacks name him at a cost. Leave it.
- **HaX's reading after a Director KO has free retries** (`ink/m08_phone_agent_0x99.ink:169-204`). Alignment C2 J3 chose that on purpose: the KO is the cost. Leave it.
- **The tidy can be beaten by walking from the lab to the break room** (the tidy latch skips both rooms, `erb:629-635`). So accusing Nightshade himself and going straight west costs the locker nothing, while accusing Cipher costs it (any route from the ops floor crosses the lobby). This is coherent in-world: Nightshade can't reach his locker without walking past the player. The credits and debrief still record the tip-off. Leave it.
- **Okafor's evaluation is reachable at minute five** (printout, then safe) and points hard at Nightshade's motive (`erb:1249`). It's motive, not the act, and the reading is still required. Leave it.
- **The safe PIN can be found by trying the four service numbers on the printout** (5 tries per opening). That still needs the printout, which is the deduction. Leave it.
- **Phantom's interview is skippable on the printer route.** Only the clone gate needs all three. `work_the_suspects` stays incomplete, which costs score, and the confrontation still opens (engine fact above). Leave it.
- **The fingerprint match is trivial** (a stick from Nightshade's own locker matches Nightshade). Its job is "nobody planted it" (`erb:894`), which the confrontation reads (`ink/m08_nightshade_confrontation.ink:91-97`). Hiding the names until a match is an engine backlog item (`docs/IDEAS_BACKLOG.md:12`). Leave it.
- **No sight challenges** (regression finding 5, planned for stage 2). Nothing in the chains needs one; m6's catch is the one sighting with a puzzle reason. Leave it for the scenario-design stage to decide.

## How the VM flags slot into the chains

- **All four are required** (`concludeRequires`, `erb:492-499`), and the confrontation waits for `all_flags_submitted` (`erb:1080-1086`, `:1707`).
- **Flag 1 (the repository browser)** opens the box. HaX reacts with the embarrassment line and the git-secrets guide (`erb:684-688`). Its hub hint is late (F1).
- **Flag 2 (stashed credentials)** is the mole's opsec failure. HaX reacts (`erb:692-696`). The debrief's single VM beat and Netherton's reply are about this one (`ink/m08_closing_debrief.ink:132-135`).
- **Flag 3 (the account's own login)** finds the mail to the Architect and ties it to the intercept (`erb:700-704`). It gates nothing on its own.
- **Flag 4 (root)** is the best-woven flag. It's a clock source for the reading (`ink/m08_director_netherton.ink:237`), it changes what the Director can act on ("A door and a login, at the same minute", `:396-397`), it decides which fallback a third misread takes (`:338-344`), and its six disjoint texts give a terminal and a time but never a person (`erb:729-757`). A flags-in, not-named player is sent back to the door audit (`erb:802-807`).
- **The debrief and credits reflect them**: the "THE BOX" credits section (`erb:213-217`) and the debrief beat. The four credit lines are unconditional, which is right, because the ending can't be reached without all four.
- **Verdict.** Required, framed and answered. Flag 4 turns a VM step into evidence the deduction uses, which is what Option B asked for. No change beyond F1.

## Difficulty for a struggling player

- **The opening.** HaX's first text sends the player north (`erb:680`); the brief is the first task. Fair.
- **The server room.** HaX's hub names both routes at every stage (`ink/m08_phone_agent_0x99.ink:72-87`); the Director lists who's still to be seen (`ink/m08_director_netherton.ink:172-180`); a nudge fires when the third interview lands (`erb:907-922`). Fair.
- **The VM.** Launcher text, six guides offered at the right moments, a text per flag. The hub's own hints are a step late (F1). After F1, fair.
- **The naming.** The strongest chain, with the best scaffolding. Each refusal says what's missing ("Bring me a clock", "take it to the people on it"), HaX's ladder checks each step in order (`ink/m08_phone_agent_0x99.ink:119-141`), every wrong answer gets its own correction, and the third miss is warned. The one rough edge is m1 (Phantom). Three misses never strand anyone (p1).
- **The suite.** Code aloud on the good route, with a repeat; the safe on the fallbacks, with HaX naming the method once the mole is named (`ink/m08_phone_agent_0x99.ink:107-111`). Fair.
- **Fights.** None forced. A struggling player meets one only by punching someone (m2).
- **The ending.** The confrontation can't be closed and re-opens after a reload; a KO mid-scene resolves to a handover (`erb:866-873`). Nobody is stranded.

## What could break (for the fixer)

- **F1.**
  - `server_room_entered` is set by HaX's own onceOnly room-entry mapping (`erb:952-957`); declare it as a VAR in the phone ink so the observer syncs it.
  - Check reopen behaviour: the new topics are one-shot replies that return to `hub`, so `reopencheck` should stay at 0.
  - Route r12 (the inverted p3), plus a page reload between flag 1 and the new topic.
- **m1.** Text only; p2 inverted as an expectation.
- **m2.**
  - Netherton, Cipher, Phantom and Nightshade have no `behavior` block yet; ATHENA, HaX in person and the two background NPCs neither. Add `behavior.hostile` only. `opening_briefing_cutscene` and `closing_debrief` already have `behavior.initiallyHidden` (`erb:553`, `:1000`); leave them alone.
  - `npc_attacked` texts must be onceOnly, and the Director's must not fire on his KO (that has its own text, `erb:808-814`).
- **m5.**
  - The darkside attack runs inside the clone minigame, which returns to `clone_debrief` through `pendingConversationReturn` (`chat-helpers.js:364-367`). Check that `card_cloned` still fires with `cardName === 'Director Netherton Keycard'` (`erb:885`).
  - The HaX hub line after a clone mentions the protocol; change it in the same edit.
- **m6.**
  - Put the mapping on `background_agent` (break room), not HaX: it's a person-chat, and HaX is a phone NPC.
  - A catch stops the pick, so nothing has left 0x47 yet. If the catch sets `nightshade_tipped_off` at 0x47 too, the tidy latches on the player's next room entry, unless they pick again at once (the catch is onceOnly). Decide whether that's wanted. Probably yes: being seen at his locker is the loudest tip-off there is. If not, keep the catch's tip-off to 0x23 and 0x88, as proposed above.
  - Add the new global to `globalVariables`, the credits and the debrief (`the_hunt`).
- Re-run r1–r11 and the probes after any of these.

## Items for the user

- **Needs checking against SecGen by the user** (U1, unchanged; I opened none of the files):
  - whether the VM's account name or home directory names a person. If it does, flag 3 gives the answer and the door audit becomes corroboration (`DECISIONS_PENDING.md`, U1 addendum). The evidence wall says the credentials "resolve to nightshade_ops" (`erb:1745`);
  - the flag order against `flags_by_vm` (`erb:24-26`);
  - HaX's VM claims in the hub: the unauthenticated exploit (`ink/m08_phone_agent_0x99.ink:89-90`), credentials in the history, and the sudo rule (`:99`), plus F1's new flag-2 line;
  - the flag-4 texts' terminal, time and threat-database root file (`erb:729-747`).
- **Engine (backlog, not blocking):** m7, the reader opening an empty cloner; the fingerprint reference names (`docs/IDEAS_BACKLOG.md:12`); E1–E7 already in `DECISIONS_PENDING.md`.
- **Orchestrator's choices, not the user's:** m5 (MIFARE or EM4100) and m6 (the locker catch). Both are mission-local and reversible.

## Spoken lines these fixes would touch

m08 has a small `tts_cache/m08_the_mole` folder (4 entries); listed for the TTS stage.

- **F1.** HaX hub: "One crafted request gets you code execution with no login at all. That's your first flag." → "…Get that working and it's your first flag." New: "Read the history, not just the files. Then the stash: git keeps what people meant to throw away." / "Whoever's account it is, they committed something they shouldn't have. Git secrets guide's yours if you want it."
- **m1.** Netherton: "Before you read it to me, take it to the people on it. If a man's own row is wrong, he will say so." → "Before you read it to me, take it to the men who went through that lab door. If a man's own row is wrong, he will say so." Phantom: "The archive duty officer walked me out before it finished. I never saw the rest, and I'd rather you didn't tell me. Tell the Director." → "…I'd rather you didn't tell me. And don't take my word for my own printout. Ask the men on the lab door."
- **m2.** New HaX texts on `npc_attacked` (the Director, one shared for the suspects, HaX in person).
- **m3.** Item text only (not voiced).
- **m5.** HaX hub: "Reader's east of the ops floor. Open the cloner, pick his card from Saved, emulate it. EM4100 has no crypto; the reader can't tell." → "…MIFARE Classic, our own top card, and it still fell to a darkside attack."
- **m6.** New off-duty agent lines ("Oi. That's not yours." / "I didn't see anything. I'll be telling everyone I didn't see anything.").

## Capability arc

- **m08 grants nothing new, and spends the whole kit:** the m01 picks on the lockers, the m03 cloner on the Director, the m04 fingerprint kit on the stick.
- **The rationed PIN cracker is withheld and paid off.** ATHENA says it's signed out to 0x47 (`ink/m08_opening_briefing.ink:182`), the suite keypad is the wall it would have opened, and the confrontation names it ("I chose what you went in without", `ink/m08_nightshade_confrontation.ink:123-127`). That closes the season's arc well.
- **For m09:** if m5 lands, the cloner's two protocols have both been shown on people (m03 and m08), and Tomb Gamma can ask for something new.

## Can the stage move on?

Not yet. F1 is a major. After a fix round, cycle 2 should:
- confirm F1 and m1–m4 (and m5–m6 if taken) in the files, with r12 and the inverted probes;
- re-check the hub against a reload between flags.

Owed on screen at the stage's browser check (with the two items carried from alignment: the brief before and after the naming, and HaX's post-KO reading needing a clock):
- HaX's hub before flag 1 and between flags 1 and 2;
- the Director's chase speed and text after a punch, if m2 lands;
- the MIFARE clone at Netherton and the reader, if m5 lands.

*Reviewed against `scenario.json.erb`, the ink and the engine. Cycle 1 of the pass-5 puzzle-chains stage.*
