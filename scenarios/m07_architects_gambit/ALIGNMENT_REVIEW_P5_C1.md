# m07 The Architect's Gambit: alignment review, pass 5, cycle 1

Stage 2, `mission-alignment-plan` rubric, reviewer only (read-only). 2026-10-13.
Judged against the aim in `docs/agents/M07_PASS_BRIEF.md`: a TV spy thriller where the four-crisis choice costs something real and is paid off honestly, deduction isn't handed over, the VM flags are required and woven in, and the mission continues m06 and sets up m08.
Evidence comes from `scenario.json.erb` (cited as `erb:N`) and the ink (`ink/<file>:N`), not from the older design docs. VM content was judged from in-game text only. I opened no SecGen XML and none of the four restricted field guides.

Checks run: `ruby scripts/validate_scenario.rb … --skip-ink --no-graph`. Schema, geometry and doors pass. There are 7 duplicate-mapping warnings, all existing and intended (disjoint on `team_assigned`, `found_mole_evidence` and similar), and 3 credits-fallback suggestions. All three sections are covered on every path, so no action is needed.

## Severity table

| # | Sev | Rubric row | Finding (short) |
|---|-----|-----------|-----------------|
| M1 | major | 8, 10 | The debrief and credits never mention the VM work |
| M2 | major | 5 | The Trojan Horse discovery is handed over: the read sets the flag, and HaX states the conclusion |
| M3 | major | 5 | The redirect window is invisible, and the debrief blames the player even when they had no chance to act |
| M4 | major | 1, 5 | The T-10 taunt's open-window lines can never play, and "Ten minutes left" is false |
| M5 | major | 7, 9 | No sight challenges. Hollis and Park are passive, the checkpoint is a walk-past, and Park doesn't react on entry |
| M6 | major | 1 | Timeline clash with m08: m07's six-hour intercept against m08's Portland plan opened two days earlier |
| m1 | minor | 4, 5 | "I'm not reopening it" and "nobody is going to ask you twice" contradict the redirect |
| m2 | minor | 4 | HaX's first-call lines print `{player_name()}` in a voiced line |
| m3 | minor | 5 | The mole intercept's observation does the timestamp comparison for the player |
| m4 | minor | 3 | Park's solution is texted 4 s after the player enters the vault |
| m5 | minor | 6 | After the abort, music events can override the `end` track |
| m6 | minor | 10 | The debrief says "an hour after the abort"; the fallback opens it at 9 minutes |
| m7 | minor | 10 | "Above expectations" plays for every outcome |
| m8 | minor | 5 | The redirected-Trojan debrief settles dispatch but not the health-record keys HaX promised |
| m9 | minor | 8 | The recon guide text implies two hosts; everywhere else it is one |
| m10 | minor | 1 | Elena's "eighteen months / a year" clashes with "four to seven days" everywhere else |
| m11 | minor | 8 | CyBOK: story activity mapped as player activity; SS missing; CPS and RFID thin |
| m12 | minor | 8 | The cumulative kit's RFID cloner has no use, though the engine supports cloning an NPC's card |
| m13 | minor | 1 | m06's freeze-or-watch decision isn't acknowledged |
| m14 | minor | — | Stale comments: the NFS guide "404s", the LOS cones "decorative", the timer file path |
| m15 | minor | 4 | Park's ink declares an unused VAR |
| m16 | minor | 4 | The T-1 taunt praises speed while the player is one minute from losing |

**Counts:** 0 blockers, 6 majors, 16 minors.

Rows that are in good shape, with no findings above minor: music bookends (row 6, apart from m5), KO resilience (row 9: every gate has a second source, and HaX names it on each KO, `erb:893-919`), the opening and closing bookends (row 10: `skipIfGlobal` at `erb:698`, the sweep-then-call-in ending at `erb:202`, `erb:645-663` and `erb:1247-1260`), and the progress-gated hub (row 3: hints keyed on flags and rooms reached, never on method, `ink/m07_phone_agent_0x99.ink:256-285`). The VM flags are required (`concludeRequires`, `erb:533-540`; the debrief gate needs all four, `erb:1247`). The story frames each flag, and HaX reacts to each one: flag 1 at `erb:757` and `erb:765`, flag 2 at `erb:821`, flag 3 at `erb:829`, flag 4 at `erb:844`. Flag 3 arming the clock is the strongest piece of weaving in the season.

---

## Major findings

### M1. The debrief and credits never mention the VM work
- **Evidence.** `ink/m07_closing_debrief.ink:83-101` (`the_win`) says the sequence was terminated and nothing about how. No knot mentions the host, the share, the listener, the login or root. The flag 1 payout appears only indirectly, through `projection_revised` (`:169-204`). The credits (`erb:171-174`, `erb:215-218`) have lines for the grid, the triage and the NPCs, and none for the attack host. The brief requires the debrief to reflect the flags. m04's pattern gates debrief lines on what the player did.
- **Fix.** Add a short beat to `the_win`, after the first block, in Netherton's voice at game-design level:
  - Their backup server shared its coordination file with anyone who asked.
  - The listener read out the operator's password to anyone who connected.
  - That account could make itself root. "Three doors they left open, and you went through all of them before the clock did."

  Add one gated line on timing. It needs a new latch, `logged_in_before_door`: an agent_0x99 mapping on `flag3_submitted` with the condition `!globalVars.scada_door_reached`, where `scada_door_reached` is set on `room_entered:scada_control`. The line: "You logged in on their host before the control room door was open. The clock ran while you were on the wrong side of it." / else "You opened the door before you touched their host. That's the order that kept it to one step" (or "kept it clean" when `!countdown_expired`).

  Add credits under a new "── THE ATTACK HOST ──" heading, after the grid lines:
  - `"ATTACK HOST: share read, listener intercepted, operator login, root. Job killed, operators locked out"` (unconditional; the debrief can't open without all four)
  - `"CLOCK: armed by the agent's login"`, plus a variant on `countdown_expired`

### M2. The Trojan Horse discovery is handed over
- **Evidence.**
  - The decode's observation (`erb:1514`) and HaX's nudge (`erb:757`) both say "Read the Austin row against the threat desk summary".
  - Reading the decode sets `projection_revised` with no player judgement (`erb:1516`), and 3 s later HaX concludes it for them: "Austin was briefed low on purpose" (`erb:765`, `erb:772`, `erb:779`).
  - Elena's lever lets the player name Austin out of nowhere: "The Austin operation. They briefed it as no fatalities…" (`ink/m07_npc_elena_rodriguez.ink:109`, gated only on `asked_told`).

  The one deduction the mission turns on is "which brief was cooked, and why it's lethal". The player never makes it.
- **Fix.**
  1. Drop "Austin" from the observation and the nudge: "Read it against the threat desk summary in your kit."
  2. Remove `projection_revised` from the decode's `onRead`. Keep `found_coordination_traffic`.
  3. Add a HaX hub option gated on `found_coordination_traffic and not projection_revised`: "Their schedule doesn't match our brief." It leads to two choices-only menus. First, which operation (Fracture / Trojan Horse / Meltdown). Second, what's wrong ("dormancy's nine days, not ninety" / "the manifest is health records and dispatch", where either is right, or "the casualty figure", which is wrong). Each wrong pick gets "That isn't what I'm reading. Look again" and returns to the hub with nothing lost. The right path does `#set_global:projection_revised:true` and then says the current verdict lines. This is m04's "check what's done, not how" and a sight challenge on paper.
  4. Retarget the three verdict mappings (`erb:760-780`) from `found_coordination_traffic` to `projection_revised`, so they fire after the player says it. They then duplicate the hub reply, so either cut them or keep only the confirmation row at `erb:803-808`.
  5. Elena: reword `:109` to "The other three operations tonight. What were you told about them?" She then volunteers that she read the Austin row "because it was the boring one" (`:217`). Her `projection_revised` stays, because she is the witness and the player has done the work of asking her.

### M3. The redirect window is invisible, and the debrief blames the player even when they had no chance to act
- **Evidence.**
  - The window closes 40 real minutes after the commit (`erb:602-611`) or on the flag 3 login (`erb:828`, `erb:836`). Neither is ever told to the player in advance.
  - HaX's hint before the login (`ink/m07_phone_agent_0x99.ink:528-533`) and the aim text (`erb:488`) warn that the cascade clock starts. They say nothing about the team.
  - The debrief then reads "You knew. You found it and it did not move" (`ink/m07_closing_debrief.ink:263-266`) and "The team not moving is a separate sentence" (`:194-195`) whenever `projection_revised` is true and the team wasn't moved. That includes a player who found it after the window shut, whom HaX had told "The window's shut. It goes in the report" (`erb:772`).

  That is not paid off honestly.
- **Fix.**
  1. Add a latch `revision_found_open`, set by an agent_0x99 mapping on `global_variable_changed:projection_revised` with the condition `value === true && globalVars.team_assigned === true && !globalVars.redirect_window_closed && globalVars.team_assignment !== 'trojan_horse'`. Declare it in `globalVariables`.
  2. In the debrief, split `:184-196` and `:263-266`:
     - Open window and held: the current lines.
     - Found after it shut: "You found it after the window closed. That's in the report as found, not as ignored." HaX: "You found the thing that was built not to be found. The timing was his, not yours."
  3. Make the window visible once it matters. Add a display-only timer:
     ```
     { "id": "redirect_window_display", "label": "Team redirect window", "delayMs": 2400000,
       "startOnGlobal": "team_assigned", "showCountdown": true,
       "condition": "globalVars.projection_revised && !globalVars.redirect_window_closed && !globalVars.team_redirected && globalVars.team_assignment !== 'trojan_horse'",
       "onceOnly": true }
     ```
     It has no `setGlobal`, because the dispatcher skips the action when the condition fails (`ui/scenario-timer-dispatcher.js:205-213`). The HUD hides it until the condition holds (`ui/scenario-timer.js:190-196`).
  4. Add "and before you log in on their host" to the open-window verdict (`erb:765`) and to `vm_hint_3` / `guide_ssh_choices` (`:532`, `:649`), so the flag 3 closure is known in advance.

### M4. The T-10 taunt's open-window lines can never play, and "Ten minutes left" is false
- **Evidence.**
  - One timer sets `architect_t10_played` and `redirect_window_closed` together (`erb:608`), and the bark keys on the first (`erb:1183-1186`). So `taunt_t10` always opens with the window closed. The branches "You've found the discrepancy… watch how long it takes you to act on it" (`ink/m07_architect_comms.ink:184-188`) and "You still have a door open" (`:208`) are unreachable.
  - The always-taken branch tells a player who has learnt nothing "you've learnt it too late" (`:182`).
  - The bark "Ten minutes left, Agent 0x00." refers to no clock the player can see. The cascade clock runs off flag 3 (`erb:613-644`).

  The one Architect beat built to press the redirect is dead.
- **Fix.** Give T-10 its own timer at 30 minutes (`delayMs: 1800000`, `startOnGlobal: team_assigned`, `setGlobal: { architect_t10_played: true }`), and leave `redirect_window_close` setting only `redirect_window_closed`. Reword the bark to "Ten minutes before your team is too committed to move, Agent 0x00." In `taunt_t10`, make the closed branch read only when the window actually shut early, after a flag 3 login before minute 30. Its line becomes "You logged in. The door closed behind you." The open branches then play, and give the player the warning M3 needs.

### M5. No sight challenges; the checkpoint is a walk-past
- **Evidence.**
  - Hollis's and Park's `los` blocks are commented "decorative… kept for a future guard-LOS hook" (`erb:1129-1138`, `erb:1759-1765`). That hook now exists (`public/break_escape/js/systems/npc-sight-challenge.js:1-31`) and m04 uses it (`scenarios/m04_critical_failure/scenario.json.erb:637-651`).
  - `operations_floor` has no lock (`erb:1317-1324`), so the player can walk past Hollis without speaking. Nothing opens his conversation.
  - Park is commented "reacts on entry" (`erb:1727`), but his only mappings are `setVisible` (`erb:1746-1757`), so he never speaks first.

  The brief lists sight challenges among the m04 patterns to copy.
- **Fix.**
  - Hollis: add `"challengeOnSight": { "cooldown": 20000, "requireGlobal": "briefing_played", "skipIfGlobal": ["hollis_resolved", "hollis_ko"] }`. A non-empty `hollis_resolved` is truthy, so this covers talked, evaded and ko. Add a mapping `player_spotted:ray_hollis` → `person-chat`, `targetKnot: "start"`. His `challenge` knot ("He clocks you at thirty feet", `ink/m07_npc_ray_hollis.ink:47-50`) already reads as a sighting, and `start` routes a backed-off player to `wary_again` ("Something's in here", `:232-237`). Set `visualize: true` so evading is a skill. Check the cone against the patrol strip in the browser.
  - Park: add a mapping `room_entered:cable_vault` → `person-chat`, `targetKnot: "start"`, with the condition `!globalVars.park_ko && globalVars.park_resolved !== 'talked'`. Make it non-onceOnly so `back_at_it` plays on return ("Second time. There isn't a third.", `:116-120`). This is m04's Static pattern.
  - Update both stale comments.

### M6. Timeline clash with m08: the six-hour intercept against the Portland plan opened two days earlier
- **Evidence.**
  - m07: the threat desk "has had six hours" with the intercept, and "everything I read you tonight comes out of that intercept" (`ink/m07_opening_briefing.ink:62-63`). The agent is tasked on the road, as the only person in range (`:48-50`).
  - m08: Nightshade spent "Forty-seven minutes on the Portland plan, two days before you deployed" (`scenarios/m08_the_mole/ink/m08_nightshade_confrontation.ink:47`). The badge audit window is "D-2 = two days before the Portland order" (`scenarios/m08_the_mole/scenario.json.erb:58`, `:1368`).

  SAFETYNET can't have a Portland plan two days before it knew about Portland.
- **Fix (m07 side, mission-local).** One line in `briefing_questions` ("How do we know all this?", `:61-64`): "Portland has been on our contingency board since Thursday, with you pencilled in as the nearest agent. Tonight's intercept told us it was live, and gave us the other three." That makes a D-2 plan real, and makes "0x00 to Portland" in the intercept (`erb:1802`) something a mole could know before the order. The m08 side is for the m08 pass: see User items.

---

## Minor findings

- **m1.** HaX: "The team's logged for … It's on the record. I'm not reopening it." (`ink/m07_phone_agent_0x99.ink:111`), and the aim "nobody is going to ask you twice" (`erb:324`). Both contradict the redirect HaX later offers. **Fix:** "It's on the record. It'd take something new to move it." This plants the redirect honestly. For the aim: "…before you call it. The team turns the moment you do."
- **m2.** `HaX here, {player_name()}.` (`ink/m07_phone_agent_0x99.ink:107`, `:149`) breaks the "no printed variables in voiced lines" rule, and commit f0871937 didn't touch this file. **Fix:** "HaX here, Agent." (fixed text).
- **m3.** The mole intercept's observation (`erb:1800`) tells the player which line to check and gives 10:41 UTC, and the hub line then states the conclusion (`ink/m07_phone_agent_0x99.ink:252`). **Fix:** observation "An intercept pulled off the compromised host and printed here by somebody who wanted a paper copy." The issue time is already on the Threat Desk Summary (`erb:281`), so the comparison is the player's to make.
- **m4.** Park's talk-down is texted 4 s after vault entry (`erb:879-885`), before the player has tried anything. **Fix:** add `globalVars.park_resolved === 'evaded'` to the condition (second visit only), and keep the hub ask (`ink/m07_phone_agent_0x99.ink:256`).
- **m5.** `room_entered:scada_control` → spy-action (`erb:150-153`), `all_hostiles_ko` → noir (`erb:145-148`) and the threat trigger (`erb:139-143`) have no `grid_saved` guard. A post-abort walk to the vault and back, or a Mercer fight after the abort, replaces `end`. **Fix:** add `!globalVars.grid_saved` to all three.
- **m6.** The debrief opens with "an hour after the abort" (`ink/m07_closing_debrief.ink:73`), but HaX says "Nine minutes from the abort, he's on anyway" (`erb:973`). **Fix:** "Not long after the abort."
- **m7.** "Above expectations, Agent." (`ink/m07_closing_debrief.ink:532`) plays even with no team committed and Seattle dark. **Fix:** gate it on `team_assignment != "" and not countdown_expired`. Otherwise use "You finished it, Agent. I will write the rest myself."
- **m8.** The redirect's cost line promises "Health record and dispatch keys are late in the Austin run" (`ink/m07_phone_agent_0x99.ink:326`). The debrief settles dispatch only (`ink/m07_closing_debrief.ink:146`). **Fix:** "The dispatch and health-record keys were late in the sequence. The team reached them first."
- **m9.** The recon guide reply says "The attack host and its backup server both turn up in a sweep" (`ink/m07_phone_agent_0x99.ink:611`). Elsewhere the backup server *is* the attack host (`erb:1539`; `vm_hint_1`, `:512`). **Fix:** "Their host turns up in a sweep. Find it first." Also needs checking against SecGen (number of target hosts).
- **m10.** Elena: "eighteen months to build replacements… lose a region for a year" (`ink/m07_npc_elena_rodriguez.ink:146-148`). Everywhere else it is four to seven days: briefing `:53`, Mercer `:187`, the map `erb:1358`, the projection `erb:1651`. **Fix:** make her study the pessimistic case: "My study said eighteen months if the spares were gone. They found spares. Four to seven days, this time."
- **m11.** CyBOK (`mission.json`):
  - MAT "Coordinated attacks" and "Attack synchronization" describe ENTROPY, not the player. Move them under AB (Adversarial Behaviours), as m04, m06 and m08 do.
  - The player's actual weaknesses are misconfigurations (a world-readable export, secrets sent in clear by a listener, a loose sudo rule). Add `SS / Categories of Vulnerabilities` with "Misconfiguration" and "Information leakage", matching m06 and m08.
  - CPS "ICS/SCADA security" and "Power grid security" are framing only, since the player never touches a control protocol. Keep "Critical infrastructure protection", "Physical access control" and "Lock bypass", or move the ICS keywords into the description as context.
  - AAA "RFID authentication" is backed only by carrying a badge (see m12).
  - The NS keywords "FINGERPRINTING", "NMAP" and "SECURE SHELL (SSH)" need checking against SecGen by the user.
- **m12.** The cumulative kit: the RFID cloner is carried but has no use (`erb:251-261`, comment "Neither is needed"). The engine supports cloning an NPC's card (`public/break_escape/js/systems/npc-conversation-state.js:559-589`, `npc.rfidCard` and `has_rfid_cloner`). **Fix (puzzle-chains stage):** give Hollis an `rfidCard` and a talk option gated on `has_rfid_cloner`: "(Keep him talking. Let the cloner do the rest.)". That gives a quiet fourth route, and makes the AAA RFID claim and the HaX RFID guide (`:575-577`) honest.
- **m13.** The briefing recalls the m06 fund (`ink/m07_opening_briefing.ink:25`) but not the player's freeze-or-watch decision there. No cross-mission state exists (`docs/IDEAS_BACKLOG.md:44`). **Fix:** add a fate-neutral line: "Frozen or not, the advances were paid, and the advances paid for tonight."
- **m14.** Stale comments:
  - `erb:1055`: the NFS guide "404s until it is published". The file now exists as `HacktivityLabSheets/_labs/safetynet/nfs-and-netcat-leaks.md`. Whether it is live at the URL still needs checking (see User items).
  - `erb:1129-1132` and `erb:1759`: the LOS cones are no longer only decorative, once M5 lands.
  - `erb:582-586`: cites `scenario-timer-dispatcher.js:106-120`. The file is `ui/scenario-timer-dispatcher.js` and the check is at `:205-213`.
- **m15.** `VAR found_mole_evidence` in `ink/m07_npc_thomas_park.ink:17` is never read. Remove it.
- **m16.** At T-1 the Architect says "Impressive. Genuinely. You've moved faster than the file suggested." (`ink/m07_architect_comms.ink:270`), while the player is one minute from losing step one. **Fix (dialogue stage):** "Closer than the file suggested. Not close enough to be comfortable."

---

## Items for the user

1. **The m07/m08 timeline (story direction, another mission).** m08 depends on a Portland plan existing two days before the order (`m08_nightshade_confrontation.ink:47`, `m08 scenario.json.erb:58`, `:1368`). m07 says SAFETYNET learnt of the operation six hours earlier. **Recommendation:** fix it on the m07 side with the contingency-board line in M6. It keeps m08's evidence chain intact and needs no m08 edit. If the user would rather m08 moves to "D-0", the m08 pass owns that.
2. **Cross-mission state (engine; backlog item 44).** m08's Netherton says "Nine days ago I sent you to Portland" (`m08_director_netherton.ink:64`). That is exactly the Trojan Horse wake-up day in m07 (`m07_closing_debrief.ink:256-261`). Carrying `team_assignment` and `projection_revised` into m08 would let day nine land for players who left Austin, and let m07 acknowledge m06's freeze-or-watch choice. **Recommendation:** defer the engine work. Use fate-neutral lines meanwhile (m13), and suggest the day-nine hook to the m08 pass as a fate-neutral mention.
3. **SecGen checks (the user only; nothing was opened).** These need checking against SecGen by the user:
   - (a) Flag 1 sits in a world-readable NFS export, and the export also holds a pointer to a coordination file and the operator account's name (`erb:1515`, `vm_hint_1` `:512-514`).
   - (b) Flag 2 comes from a TCP listener on a non-standard port that pushes the operator password and a flag to any connection (`erb:1528`, `vm_hint_2` `:521-525`).
   - (c) Flag 3 is in the operator account's home directory over SSH (`erb:502`, `:530`).
   - (d) Flag 4 is root, reached through a sudo rule ("Start with what this account may run", `:539`; `erb:495`).
   - (e) There is one target host, not two (m9).
   - (f) The Kali box is at 192.168.100.50 (`erb:1453`).
   - (g) Whether flag 4 can be reached without flags 1-3. HaX's nag (`erb:959-967`) assumes it can.
   - (h) The CyBOK NS and OSV keywords (m11).
4. **Whether the NFS field guide is published.** My check of the file's front matter was refused by a permission check, and I didn't pursue it. **Recommendation:** confirm that `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/nfs-and-netcat-leaks/` resolves before the blind playtest.
5. **No engine changes needed.** Every fix above uses existing features: `challengeOnSight`, conditional HUD timers, `room_entered` person-chat and NPC `rfidCard`.

## Handoffs to later stages
- m12 (cloner route) belongs to `mission-puzzle-chains`.
- m16 and the wording of the M2 hub menu belong to `npc-dialog-review`. List the spoken lines changed: M1, M2, M3, M4, M6, m1, m2, m6, m7, m8, m10, m13 and m16 all touch voiced lines.
- Browser checks after the fixes:
  - Hollis's cone on his patrol strip, and the tutorial hold.
  - Park's entry chat when he is hostile, talked down and evaded.
  - The T-10 bark at 30 minutes with the window open.
  - The redirect HUD showing only after `projection_revised`, and clearing on flag 3.
  - The new debrief branches (found-open against found-closed).
