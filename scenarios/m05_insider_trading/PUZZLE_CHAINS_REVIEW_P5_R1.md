# m05 Insider Trading: puzzle chains review, pass 5 round 1

Reviewer: Opus, read-only (this file is the only write). Date: 2026-10-13. Skill: `mission-puzzle-chains`, run in full against the working tree, which includes the closed alignment phase (`IMPROVEMENT_LOOP_LOG.md`, rounds 1 to 4).

Kind of game: SAFETYNET campaign mission, a TV spy thriller. The aim for this stage: the locks chain, the player earns what they get, the deduction isn't handed over, red herrings cost something, kit is cumulative, and the VM flags are required and woven in.

**Verdict: implementable, no blockers.** 0 blockers, 1 major, 9 minors. The chain is sound and every route the alignment phase built still holds. The major is a hint that gives away the badge-log method on the first ask and still lets the early-naming reward pay (proved by probe p1, below).

## What alignment handed on

From `IMPROVEMENT_LOOP_LOG.md:280-295`, read as settled and not re-litigated here:
- A3 (two prints enrolled on the vault, no Halloran print surface), A4/B1/R3-1/R4-1 (the early-naming reward needs `door_log_reasoned_first`, no guessed reason, no accusation), B2 (retries allowed and noticed through `torres_reason_guessed`), D2 (a wrong accusation brings the upload forward).
- Open for the user: D1 (the VM's flag-3 manifest names Torres), D3 (VM claims), D4 to D10 (`DECISIONS_PENDING.md`). D9 (Owen's KO drops the office spare) waits on an engine `dropOnKO`.
- **m12 goes to room dressing**: the vault reuses `room_servers`, Torres' office is `room_ceo`, and there's no visitor-spare hook in the lab. P8 below gives the dressing stage a reason to add that hook.
- B3 (long debrief runs) and the briefing's opening run go to the dialogue phase.

## Checks run (static; no browser session started)

- **Routes:** all 17 (`scripts/ink_runtime_check/m05_routes/r1`–`r17`): every one prints `[result] all expectations met`. The two "fail" matches in r11 and r12 are the Recruiter's own lines ("never once failed me", "failover window").
- **Probe p1** (`m05-puzzle-r1-reviewer/p1_hint_then_reward.json` in the session scratchpad): r2 with one "Where do I stand?" call inserted after Owen hands over the badge log. HaX says "That log says Halloran's spare. Ask her where it lives. And read the front-door lines, not just hers.", and the route still ends with Torres' "You're early. Somebody read Owen's sheet properly.", the debrief's "You had him before the server did" and the credit NAMED ON THE EVIDENCE. (Its second fail is my own edit renaming a later pick, not a mission fault.)
- **Validator** `--skip-ink --no-graph`: schema, geometry and door alignment pass. The 8 same-pattern wiring warnings are the intended ones from alignment. Issue 12 (two `object_interacted` texts together) is a false positive: the cabinet, the briefcase and the VM launcher are different objects. Issue 10 (the vetting file's `onRead` on hand-over) was checked: it can latch `case_motive` unread, but only matters with `case_exfil` already in, and then Torres is already suspected by flag 3, so nothing leaks.
- **dialoguelint:** 0 errors, the same pre-existing check (Recruiter L87) and warning (L352).
- **Condition sweep** (all of `scenario.json.erb`):
  - `||` appears only in music and credits conditions (`erb:145`, `:170`, `:179`, `:183`, `:201`). Those run through `new Function` (`music/scenario-music-events.js:34-55`), which handles `||` and parentheses. Every eventMapping condition is `&&`-only, which is what `safeEvaluateCondition` supports (`npc-manager.js:15-101`).
  - No nested `data.` paths. The single-level ones are `data.cardName` (1), `data.connectedRoom` (6), `data.itemId` (7), `data.objectName` (1) and `data.objectType` (1). Each key exists in its emitter's payload: `rfid-minigame.js:292-296`, `unlock-system.js:114-119`, `inventory.js:627-633` and `npc-game-bridge.js:40-45`, `interactions.js:624-628`.
  - Every `item_picked_up:` pattern names the item's type (`notes` or `keycard`) and filters on `data.itemId`, so the type-vs-id bug class is clear.

## The dependency chain

Room depth (`room_depth.py`): reception 0; corridor, Patricia's office 1; break room, open office, server hallway 2; research lab, server room, Torres' office 3; key vault 4. No empty rooms (0 of 10). Six locks: four doors (hallway RFID, server-room password, office RFID, vault biometric) and two pin-tumbler containers.

Start kit (`erb:540-575`): phone, lockpicks (m01), RFID cloner (m03), fingerprint kit (m04). No PIN cracker.

```
BRIEFING (reception) ─► PATRICIA (office, d1): visitor badge (patricia.ink:141), incident log on her desk (erb:1743-1751)
   │                         pencil note: "Owen keeps the reader logs. Ask him whose."
   │
   ├─► HALLWAY READER (seen from corridor, d1) ─ HaX bark names Owen's lanyard (erb:1087-1093)
   │      key: clone Owen (owen.ink:130, 208-232) | Halloran's spare at influence 25 (halloran.ink:141, 182-195)
   │           | HaX relay on Owen's KO (phone.ink:571-590)
   │
   ├─► SERVER-ROOM DOOR (seen from hallway, d2) ─ bark + IT notice point to Owen (erb:1109-1114, 1481-1491)
   │      key: Owen's note, asked only once the door or notice is seen (owen.ink:133), given on
   │           the incident log as the reason (owen.ink:247) or on Patricia's authority (owen.ink:250;
   │           patricia.ink:296) | relay on Owen's or Patricia's KO
   │      └─► SERVER ROOM (d3): VM launcher + drop-site; flags 1→4 (erb:1507-1553)
   │             flag 3 ─► case_exfil + torres_suspected (erb:1032-1039)   [the VM route to the who]
   │
   ├─► THE WHO (the deduction, optional on paper, rewarded):
   │      incident log ─► Owen hands over the badge log (owen.ink:119, 273-280)
   │        ─► Halloran: alibi, where the spare hangs, three late workers (halloran.ink:138, 206-216)
   │        ─► naming menu: Halloran (accusation, D2 cost) | Ben (rejected, guess) | Torres
   │             (patricia.ink:320-332; phone_patricia.ink:131-143; phone.ink:406-417)
   │        ─► reason menu: front-door lines (right) | testimony (right if questioned) | money
   │             (right if motive) | staging (right if exfil) | three wrong reasons
   │             (patricia.ink:368-391) ─► torres_suspected + office authorisation (patricia.ink:416-423)
   │
   ├─► OFFICE DOOR (seen from open office, d2) ─ key: Owen's spare once torres_suspected, on
   │      Patricia's authority or Owen's influence 30 (owen.ink:136, 282-308) | relay (phone.ink:600-606)
   │      └─► TORRES' OFFICE (d3): journal on the desk (motive), mug print (erb:1578-1590),
   │             briefcase by picks → medical bills (motive, optional)
   │
   ├─► VAULT READER (seen from server room, d3) ─ key: Torres' print from the mug (biometric-lock.js:44-60;
   │      the identity step in the dusting game does not gate the reader)
   │      └─► KEY VAULT (d4): manifest + upload schedule (exfil), TalentStack envelope (Recruiter thread)
   │
   ├─► NAME HIM (both halves): Patricia in person, her mobile, or HaX if she's down
   │      (patricia.ink:425-485) ─► torres_identified ─► Torres shown in the vault (erb:1837-1848)
   │
   └─► CONFRONT (vault) ─► fate (four talk endings, or the fight and the post-KO choice)
          ─► sweep ─► "Bring me in" (needs all four flags: phone.ink:809-864; concludeRequires erb:488-495)
          ─► mission_complete ─► debrief (erb:1300-1316) ─► credits
```

**Two ways to the suspicion.** The VM route (flag 3) and the badge-log route both lead to the office, and the office leads to the vault. The early-naming route (log → office → vault papers → naming before flag 3) is the longest chain in the mission: Patricia → Owen → Halloran → Patricia → Owen → office → hallway → server room → vault. That's the chain the D1 reward is built on, so P1 matters.

**What's actually required.** The flags (`concludeRequires`), a naming (Torres is hidden until `torres_identified`, `erb:1820`), and a fate (`extract_go` only after `final_choice`). The badge log, the Recruiter, the CEO email, the envelope, Lisa and Halloran are optional, each with credits and debrief consequences. That matches the skill's rule: story threads carry score, not gates.

### Boss-key audit

| Lock | Seen at depth | Key available | Verdict |
|---|---|---|---|
| Server hallway (RFID) | 1 (corridor) | 2 (Owen's lanyard) or 3 (Halloran) | ✅ by design (m03 cloner). The clone choice is offered before the reader is seen: see P7 |
| Server room (password) | 2 (hallway) | 1 to 2 (incident log, Owen) | ✅ boss-key, enforced: Owen's and Patricia's asks wait for `server_door_seen` or `it_notice_read` |
| Torres' office (RFID) | 2 (open office) | 2 (Owen), gated on suspicion | ✅ boss-key by story gate. Owen's KO drop is key-before-lock (D9, accepted) |
| Key vault (biometric) | 3 (server room) | 3 (office mug), another branch | ✅ boss-key: encounter, hunt in the office, walk back |
| Torres' briefcase (pins) | 3 | start kit | ✅ by design (m01 picks) |
| Patricia's cabinet (pins) | 1 | start kit | ✅ by design. It holds a copy of what Patricia hands over at influence 7, so it's the fallback once a wrong reason has cost her trust (patricia.ink:188, 394) |

## Cumulative kit

| Kit | From | m05 use | Required? | Timing |
|---|---|---|---|---|
| Lockpicks | m01 | Torres' briefcase (bills), Patricia's cabinet (CEO email) | No: both optional; the journal on the desk and the vetting file give motive, and Patricia hands over her own copy of the email | In the start kit. Never needed, so this mission doesn't spend it. D-B would put the journal in the briefcase, where its author would keep it |
| RFID cloner | m03 | Owen's lanyard → server hallway | One of three routes (Halloran's spare, the KO relay) | Usable before the reader is seen (P7) |
| Fingerprint kit (the print kit) | m04 | Torres' print off the mug → key vault | Yes: the only way into the vault | Right: the reader is met a room before the office that holds the print |

Nothing arrives late; the cloner arrives effectively early (P7). m05 grants no new class, by the pass-3 decision recorded in `PUZZLE_CHAINS_PLAN.md:783-803` ("evidence as leverage" is the mechanic). P6 notes that this mechanic can be skipped for free.

## The insider deduction, end to end

The mission's centre is whether the player works out Torres from the badge log before the VM names him. Traced through the files:

1. **Pointer.** The incident log's pencil note sends the player to Owen (`erb:1749`). Owen offers the log only once that log is read (`owen.ink:119`). Good separation: a desk in d1, a person in d2.
2. **The red herring.** The log reads as Halloran on a skim (Owen says so, `owen.ink:279`) and as Torres on a careful read (`erb:86`: the front door six minutes before the spare, every night; her primary badge never comes in).
3. **Clearing her.** Her alibi comes from her answer (`halloran.ink:206-216`) or the lanyard (`erb:1662-1668`). Her three late workers (Amara, Ben, David) leave the log's front-door lines to decide it. That's a fair narrowing.
4. **The cost of a wrong name.**
   - Halloran before her alibi: D2, a heavy cost.
   - Ben: `torres_reason_guessed`, which bars the reward.
   - A wrong Torres reason: the same flag, plus Patricia's influence (`patricia.ink:393-398`).
   - Halloran *after* her alibi: nothing at all (P2).
5. **The answer.** The front-door reason is one of seven options and not the first (`patricia.ink:372-391`). It's correct and sets `door_log_reasoned_first`.
6. **The hint ladder breaks here (P1).** HaX's "Where do I stand?" gives the method as soon as the log is read: "And read the front-door lines, not just hers." (`phone.ink:930`, and `:928` before the log is even opened). The menu option says "Check who comes in the front door just before the spare is used." So the player can match the hint's words to the menu, and the reward still pays (probe p1). The weaker hints come later in the ladder ("Take it to Patricia, or ask her for the vetting files", `phone.ink:931-936`), so the tiers run backwards.
7. **The VM route around it.** Flag 3 sets `torres_suspected` with no reasoning (`erb:1032-1039`), and HaX's flag-3 text says "His staging manifest, under his own name." (`erb:950`). Whether the manifest on the VM names him needs checking against SecGen by the user (D1, D3). Until D1 is settled, the deduction decides only who names him first, and the reward is the in-game answer to that. Not re-litigated.
8. **The KO routes around it.**
   - Owen's dropped spare (D9, accepted).
   - Patricia's KO drops both vetting files on her floor (`dropNPCItems`). That gives `has_motive()` without the badge log, and HaX's menu then accepts "David Torres" → "Money" (`phone.ink:414`, `:516-518`).
   - Both cost a staff credit and neither earns the reward (`door_log_reasoned_first` stays false), so both are accepted as costed routes. No finding.

## The specific locks

**The vault with two prints** (`erb:1779-1790`).
- The reader accepts either owner (`biometric-lock.js:49-50`), and only Torres' print exists to lift. So the second enrolment changes nothing in play. It only stops the sign naming the insider, which was A3's job.
- Before suspicion, three texts invite a hunt that has nothing at the end:
  - the vault bark "Two prints enrolled: Dr Halloran's and David Torres'. You've got the kit." (`erb:1122`);
  - Owen's "Two thumbs enrolled" (`owen.ink:267`);
  - HaX's "Work out which you're after before you hunt for a print." (`phone.ink:949`).
- A player who reads "you've got the kit" and goes to the lab finds no surface and no reason why. That costs time but teaches nothing. Decision D-A.

**The badge log.** The best-built chain in the mission (above). The faults are the hint ladder (P1) and the free Halloran elimination (P2). Halloran's spare doesn't hang together as a story: she hands the player "my spare" while saying the spare hangs on a visitor hook she hasn't touched in months (P8).

**The server-room password.** The encounter → hunt → return beats work and are enforced:
- encounter: the bark and the notice name Owen;
- hunt: Owen wants a reason, and the incident log has one;
- return: the door.

Two small leaks:
- Patricia's authority is free and needs no refusal from Owen first (P6).
- The status hub checks for the note, not the door (P5).

The password minigame allows 3 tries per opening (`password-minigame.js:16`), and `quantum2024` is guessable but unlikely to be guessed. No finding beyond P5.

**The print lift from the mug** (`erb:1578-1590`).
- The mug is in his office, printed "WORLD'S BEST DAD — love Miguel". The print is plainly his.
- The dusting game's identify step offers four other names (`fingerprintCandidates`). The lift is stored under `fingerprintOwner` whatever the player picks (`biometrics.js:62-98`), and the reader doesn't read `identified`. So the identify step has no stake here. That's acceptable for an easy, in-office lift.
- HaX's toast "That's Torres' print." fires on `fingerprint_collected`, not on `fingerprint_identified` (`erb:1134-1137`, `biometrics.js:95-98`). So it names the owner even for a lift logged "unidentified" (P4, minor).

## Softlocks after knock-outs and reloads

Checked each gate against S1 (a burnt first-call gate) and S2 (order dependence) in `docs/agents/SOFTLOCK_PATTERNS.md`. No softlock found.

| Case | What carries the player on |
|---|---|
| Owen down, any time | Relay: badge, password, the log if not held (`phone.ink:571-590`). Office card at once if suspected, else on the first room entry after suspicion (`erb:1201-1209`) or in HaX's partial naming (`phone.ink:485-497`). His dropped items as well (D9) |
| Patricia down, any time | Relay: contractor pass and both authorisations (`phone.ink:542-553`). HaX takes the naming (`phone.ink:172`). Her files drop for the "read her files" hint (`phone.ink:933`) |
| Halloran down or accused | Owen's clone. Her spare drops on a KO |
| Owen and Patricia both down | Every key arrives by relay; the naming goes to HaX |
| Torres down, post-KO choice lost to a reload | `post_ko_safety_net` on entering the vault (`erb:1210-1217`, not onceOnly); route r5 |
| Torres wins the fight | D5 (open for the user): restart with him hostile, no talk endings |
| Reload with ink-local influence reset | Owen's and Halloran's topics reset with their influence, so the rapport routes can be rebuilt. Synced "given" globals stop a second hand-over of the card or the password |
| Reload mid-call-in or mid-debrief | m04's two backstops per room (`erb:1217-1224`, `:1309-1316`); routes r1, r5 |

**Menus left open and reopened later** (a person-chat closed on its choices re-runs the knot that owns them, `person-chat-minigame.js:525-537`; a phone chat re-navigates to that knot).
- All three naming menus and all three reason menus guard on `torres_identified` at the top: `patricia.ink:312, 321, 352, 371, 403, 426`, `phone_patricia.ink:131-163`, `phone.ink:399, 407, 420, 433, 500`.
- Owen's `request_password` and Patricia's `request_authorization` re-test their gates on every run.
- `extract_choices` is reachable only through `extract_offer`'s all-flags check, and flags never un-submit.
- One harmless leak: `patricia_confession` adds 1 influence each time it re-runs (`patricia.ink:231`). Influence opens only the CEO email, which the same knot offers anyway. No finding.

**Texts that assume an order.**
- The four flag texts count up ("Three to go", "Second flag in", "Third flag verified… Last one's…", "Final flag in"), and `access_bludit_vm` completes on flag 1 alone (`erb:933-959`). The drop-site takes flags in any order (P3).
- Everything else that branches on progress checks the state it describes.

## Bug sweep (skill step 4)

| Check | Result |
|---|---|
| Cross-scenario ids hard-coded in shared minigames | None touched by m05 (vm-launcher, flag-station, rfid, password, dusting, biometric; no backup-recovery) |
| `eventMappings` keyed on item id | None. All on type plus `data.itemId` |
| Tasks with no completion route | None. `find_server_password` stays open for a player who guessed the password; aims auto-reveal on a later task, so nothing is held (see P5) |
| Player-visible author notes | None in `text` or `observations` |
| `observations` that state a code | None. The sticky note is the password by design |
| Rename residue | None ("cryptography lead's" gone, R4) |
| Stale geography | Checked against `connections`: Patricia "off reception, on the east side", the vault "north of the server room", the server room "north of the server hallway", the directory's room hints. All current |
| Dead helpers or unused globals | The validator reports none; `password_hint_sticky` and `door_log_text` are both used |
| `\|\|`, nested `data.` paths or parentheses in eventMapping conditions | None (see Checks) |
| Hub checks how, not whether | One: P5 |
| Free retries and guesses | One left: P2. The rest are costed by B2 |

## Findings

Counts: **0 blockers, 1 major, 9 minors.**

| # | Sev. | Where | Finding | Concrete fix |
|---|---|---|---|---|
| P1 | major | `m05_phone_agent_0x99.ink:928`, `:930` | **"Where do I stand?" gives the badge-log method on the first ask, and the early-naming reward still pays.** Once the log is in the kit, HaX says "Read it, the front-door lines as well as hers." (`:928`) or "…And read the front-door lines, not just hers." (`:930`). The right reason in all three menus is "Check who comes in the front door just before the spare is used." (`patricia.ink:381`, `phone_patricia.ink:194`, `phone.ink:514`). Probe p1: one status call after the log, then r2's route, and the player still gets "You're early. Somebody read Owen's sheet properly.", "You had him before the server did" and NAMED ON THE EVIDENCE. The tiers also run backwards: the step after Halloran (`:931-936`) is vaguer than the step before her. | (1) Re-tier the aside. `:928` → "The badge log's in your kit. Read it." `:930` → "That log says Halloran's spare. Ask her where it lives." Add a third tier, after `halloran_questioned or found_halloran_alibi` *and* `torres_reason_guessed`, above `:931`: "Her spare goes in at night. Look at who comes through the front door just before it." (2) Make that tier, and only that tier, set a new synced global `door_log_hinted` (declare it in `globalVariables` and in the five inks that read the reward; regenerate the m05 block of `missions.json`). Add `!globalVars.door_log_hinted` to the four reward conditions: credit `erb:178`, the catch-all term `erb:183`, Torres' "You're early" and the debrief's "before the server did". (3) Promote p1 to route r18 as a negative check (hint asked, so no reward), and add a positive one (the first two tiers asked, reward kept). The accusation nudge (`erb:1052`, `phone.ink:925-926`) can keep its front-door wording: `halloran_accused` already bars the reward |
| P2 | minor | `m05_npc_patricia_morgan.ink:336-339`, `m05_phone_patricia.ink:150-153`, `m05_phone_agent_0x99.ink:422-425` | **Naming Halloran after her alibi is a free elimination.** With `found_halloran_alibi` each surface says "Try again" and sets nothing, while "Ben Ashworth" sets `torres_reason_guessed` (`patricia.ink:325`). On the log alone, a player can strike both decoys, one for free, and land on Torres. | Add `~ torres_reason_guessed = true` inside each `{found_halloran_alibi: …}` branch, before the line. The "Again? Fine." / "Second go." retry lines then follow, as for Ben. Route: extend r9 with a Halloran-after-alibi pick |
| P3 | minor | `scenario.json.erb:933-959`, `:936` | **Flag texts and the portal task assume flags arrive 1→4.** "Three to go" (`:937`), "Second flag in" (`:943`), "Third flag verified… Last one's the authorisation" (`:950`), and "Final flag in… Call me." (`:958`, which fires on flag 4 even with earlier flags out). `access_bludit_vm` completes only on flag 1 (`:936`), so a player who holds flag 1 back sees "Get into the research portal" open beside three ticked flags. The drop-site doesn't enforce order. Whether the VM lets flags be found out of order needs checking against SecGen by the user. | Drop the counts from the four texts and key a counting tail on state with whole-line variants (no printed numbers): e.g. flag 1 → "…Somebody wanted that box easy to get into." plus a separate mapping, `flag2..4 !== true`, for "Three to go." Flag 4's "Final flag in" gets `&& globalVars.flag1_submitted === true && …flag3…`, plus a twin without "Final" for any flag still out. Complete `access_bludit_vm` from all four flag mappings (`completeTask` on a done task is a no-op; check `objectives-manager.js` before relying on that) |
| P4 | minor | `scenario.json.erb:1132-1138` | **The print toast names the owner whatever the dusting game said.** `fingerprint_collected:david_torres` fires on every lift (`biometrics.js:95`); `fingerprint_identified` fires only on a match (`:96-98`). "That's Torres' print." also lands on a lift the player logged as unidentified. | Keep the `setGlobal` on `fingerprint_collected`. Split the text on `data.identified` (a single-level key in the payload, `biometrics.js:89-93`): `=== true` → the current line; `!== true` → "Print's lifted off his mug. You didn't match it, but the vault reader will tell you whose it is. North of the server room." |
| P5 | minor | `m05_phone_agent_0x99.ink:892-900` | **The status hub checks for the note, not the door.** `- not server_password_obtained:` sends a player who typed the password without the note (3 tries per opening, `password-minigame.js:16`) back to Owen, though they're already in the server room. This is m04's "how, not whether" class. | `- not server_password_obtained and not server_room_entered:`. `server_room_entered` is set on entry (`erb:993-997`) |
| P6 | minor | `m05_npc_patricia_morgan.ink:296`, `m05_phone_patricia.ink:108` | **"Owen won't give me the password" needs no refusal from Owen.** Both choices appear once the door or the notice is seen, before the player has asked him. This makes m05's own mechanic, evidence as leverage (`PUZZLE_CHAINS_PLAN.md:794`), skippable for free, and the choice text can be false. | New synced global `owen_refused_password`, set at the top of Owen's `request_password` (`owen.ink:239-246`). Gate both Patricia choices on it as well. The HaX status line (`phone.ink:899`) already sends the player to Owen first |
| P7 | minor | `m05_npc_owen_gallagher.ink:130`, `m05_npc_dr_halloran.ink:141` | **The clone and Halloran's badge come before the reader** (key-before-lock). The clone choice is in Owen's first hub, whether or not the hallway has been tried; Halloran's ask too. A player meeting Owen first clones a lanyard with no reason to. | Gate both on a new synced `hallway_reader_seen`, set in the existing hallway `door_unlock_attempt` mapping (`erb:1087-1093`, beside `rfid_guide_offered`). Keep `report_progress`'s badge step (`phone.ink:891`) as it is: it names the reader. This reverses pass 3's "deliberately fast" (`PUZZLE_CHAINS_PLAN.md:792`), so it's D-C |
| P8 | minor | `m05_npc_dr_halloran.ink:186-188`, `:210`; `scenario.json.erb:1647-1651`, `:86` | **Halloran's spare doesn't hang together.** She hands over "my spare" (`:186-188`; the item says "Dr Halloran's spare research badge"). Later she says the spare "hangs on the hook by the door, for visitors. I haven't touched it in months." (`:210`). The log calls #4471 "a visitor spare" (`erb:86`). A player who took it from her hand then hears her say she hasn't touched it. | Make the hand-over the hook: "Take the visitor spare off the hook by the door. Senior badges open the server hallway; that one too." Rename the item "Visitor Spare (#4471)" with matching observations. In `spare_badge`, add a variant when the player holds it (a local `gave_spare` in her ink): "The one you're carrying. It lives on that hook." Room dressing (m12) can then place the hook: the clue sits in the room the thief walked through |
| P9 | minor | `scenario.json.erb:1122`, `m05_phone_agent_0x99.ink:949`, `m05_npc_owen_gallagher.ink:267` | **The second enrolled print promises a hunt with nothing at the end.** See "The vault with two prints". A player who acts on "You've got the kit" before suspicion finds no surface in the lab and no reason why. | See D-A. Recommended: one line of in-world reason in the lab (Halloran or an object: lab rule, gloves at the bench), so the dead end teaches that the thief needed *Torres'* thumb |
| P10 | minor (to dialogue) | `m05_phone_agent_0x99.ink:165-222` | **HaX's hub can show 14 choices** against the ten-choice rule (`README_scenario_design.md`, Common bugs). Reachable: named, no fate, four flags in and never discussed, the pamphlet, motive, the journal, flag 4, the Recruiter's call, a guide on offer. That gives confrontation, Recruiter, TalentStack, leverage, journal, Architect, four flag topics, moral board, guides, "Where do I stand?" and "Nothing right now". | Dialogue phase: fold the four flag topics into one "The research server." choice that routes to the newest undiscussed flag, as the guides were folded in A6. That brings the worst case to 11; retiring `topic_recruitment_method` once `torres_identified` brings it to 10 |

## Decisions

D-A to D-D are mission-local and reversible, so under `AGENTS.md` ("Making judgements without asking") they're the orchestrator's call. Each has a recommendation, logged so the user can overrule it. D-E is the user's.

**D-A. The vault's second print (P9).**
- (a) **Recommended.** Keep the enrolment and add one line of reason in the lab. Halloran, asked about the vault or the reader: "Lab rule: gloves at the bench. You'll not lift anything of mine in here." Or a glove dispenser with that observation.
  - The dead end then clears her a second way: whoever opened the vault needed a lead's thumb that *can* be lifted.
  - Cheap. Text only, no new print surface.
- (b) Leave it as it is. The hunt costs time and teaches nothing.
- (c) Give Halloran a liftable print. Rejected for the reason A3 gave (`IMPROVEMENT_LOOP_LOG.md:60`): it opens the vault, and its paperwork naming Torres, with no suspicion at all.

**D-B. Put Torres' journal in his briefcase** (the kit question; skill step 3d, "would this object exist anyway?").
- **Recommended: yes.** A journal that confesses to selling the 999 keys, left in the desk tray, has no author with a motive. Torres has every reason to lock it away.
- Moving it into `torres_briefcase.contents` beside the bills means:
  - the m01 picks are spent on the main motive route;
  - the motive is still reachable without picks through the vetting files.
- Check that `find_journal` still ticks. The medical bills in the same briefcase already tick `find_medical_bills` this way.
- HaX's "A personal journal. Call me once you've read it." (`erb:927-931`) still fires.
- Also needed: the journal's observation, and the briefcase's "Pin tumbler" observation, so the player expects papers inside.

**D-C. Gate Owen's clone and Halloran's badge ask on the reader (P7).**
- **Recommended: yes.** It costs one global and two conditions.
- It turns a free pickup into encounter → hunt → return on the first lock of the mission.
- It reverses pass 3's "deliberately fast", so it's logged as a decision.

**D-D. How far P1 goes.**
- **Recommended: both halves.** Re-tier the hints, *and* bar the reward once the front-door hint has been given (`door_log_hinted`).
- Re-tiering alone still leaves the third tier spelling the method out for a player who then claims the reward.
- The B2 precedent (a retry is allowed, and noticed) fits a hint the same way.

**D-E. (carried, the user's) D1, the VM's flag-3 manifest.**
- In-game, flag 3 sets `torres_suspected` and HaX says the manifest is "under his own name" (`erb:950`, `phone.ink:377`). For a player who does the VM first, the whole badge-log chain is therefore a scored option, not the route.
- What the VM's manifest shows needs checking against SecGen by the user.
- **Recommendation unchanged** (`DECISIONS_PENDING.md` D1): approve the SecGen change so the manifest shows badge #4471, not his name. HaX's flag-3 text and `topic_flag3` ("His name's on the manifest.") then need rewording in the same change.

## What could break if the fixes go in

- **New synced globals** (`door_log_hinted`, `owen_refused_password`, `hallway_reader_seen`):
  - declare each in `globalVariables`, plus a `VAR` in each ink that reads it;
  - regenerate only the m05 block of `scripts/ink_runtime_check/missions.json`;
  - run reopencheck, then tagdiff against HEAD.
- **P1's third tier** must stay below the accusation branch (`phone.ink:924-926`), so an accused player keeps the D2 nudge wording.
- **D-B** moves an `onRead` item into a container. The `found_torres_journal` latch (`erb:1024-1031`) sets `torres_suspected`. That is harmless, because the briefcase is only reachable once he's suspected (or via D9).
- **P3's variants** add same-pattern mappings on `flagN_submitted`. Keep their conditions disjoint and space the texts 4 s or more apart from the post-fate last-flag texts (`erb:964-973`, 6 s).
- **Browser check after the fixes:**
  - one status call after the log, then the reward route: no reward;
  - Owen first, then the hallway: the clone appears only after the reader;
  - the lift logged unidentified: the new toast;
  - Patricia's password authority only after Owen's refusal.

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 1 of the pass-5 puzzle-chains stage.
