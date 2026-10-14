# m08 The Mole: puzzle-chains review, pass 5, cycle 2

Stage 2, `mission-puzzle-chains` rubric. A fresh reviewer, read-only, on 2026-10-14. This cycle reviews the round-1 fixes (commit `0a877afa`) against `PUZZLE_REVIEW_P5_C1.md` and the "Stage 2 puzzle chains, round 1 fix" section of `IMPROVEMENT_LOOP_LOG.md`.

Every claim below was checked against `scenario.json.erb` (`erb:N`), the ink (`ink/<file>:N`) and the engine under `public/break_escape/js/`. I opened no SecGen XML and none of the four restricted field guides. I started no browser session (a Sonnet browser check is running at the same time) and I edited no file except this one.

## Checks run

Outputs and probes are in the session scratchpad, `m08-puzzle-c2-reviewer/`.

- **Route driver:** r1–r13 all print "all expectations met". Longest run without a choice is 11 (the opening cutscene, unchanged).
- **`dialoguelint`:** 0 errors, 0 warnings, 8 blank-reentry CHECKs (unchanged).
- **Validator** (`--skip-ink --no-graph`): no errors. There are four known warnings:
  - the 16 `npc_hostile_state_changed` texts can co-fire (the two-part pairs, as in m07);
  - the `brief_taken` co-fire on `closing_debrief`;
  - the confrontation cutscene isn't onceOnly;
  - the catch person-chat has no `background` (stage 4).
- **Probes** (`probes/`). All pass except q6, which fails on purpose: it is the evidence for N1.

| Probe | What it shows |
|---|---|
| q1 `caught_at_0x47_repick` | Caught at 0x47, the player picks again straight away and takes the stick and the go-bag, then leaves. The tidy doesn't land. The tip-off credit and the locker credit both print. This is the trade-off the fixer stated |
| q2 `ko_witness_then_pick` | The off-duty agent is punched out, then the lockers are picked. Nothing is recorded: no tip-off, no credit, no text beyond the punch text. Evidence for N2 |
| q3 `catch_after_naming` | Once the mole is named, the catch doesn't open |
| q4 `catch_when_already_tipped` | After an accusation, the catch sends no second HaX text, and both credit lines print |
| q5 `flags_out_of_order` | Flag 2 is submitted before flag 1. Each VM topic stays until its own flag is in, so two show at once. Harmless |
| q6 `catch_tidy_confrontation_reason` | No accusations: caught at 0x23, leaves, the tidy lands. Then the clean chain. Nightshade says "The Director went asking questions on my floor", which never happened. **Fails: evidence for N1** |

## Engine facts used below (re-verified this cycle)

- **The catch gate.**
  - It covers the direct pick and "Switch to Lockpicking" (`lockpick-catch.js:1-14`).
  - It skips a watcher who is KO'd or hidden (`npc-manager.js:312-316`).
  - It evaluates the mapping's condition without the lockable (`npc-manager.js:338`). The event it then emits does carry the lockable (`lockpick-catch.js:48-53`), but the gate decision has already been made, so the condition can't single out 0x47. The fixer's "any locker" reasoning holds.
  - onceOnly handlers are saved to the server and restored after a reload (`npc-manager.js:686`, `:1226-1253`), so a reload doesn't re-arm the catch.
- **The sight circle.**
  - With `angle: 360` the facing doesn't matter.
  - The player stands within 32 px of a locker, and the farthest locker (0x23 at x 3.9) is about 3.6 tiles (115 px) from the agent at (7.5, 7.8). So every locker pick is inside his 160 px. "Out of his cone" can't happen at these lockers, and the erb comment's "free … out of his cone" is moot.
  - The circle is drawn with no check on KO or on whether the mapping can still fire (`npc-manager.js:2098-2125`).
- **Hostility is permanent in m08.**
  - Only `#hostile:false` or influence recovery clears it (`npc-game-bridge.js:795`), and m08 uses neither. It is saved and restored across a reload (`npc-hostile.js:51-90`).
  - While an NPC is hostile, clicking them jabs instead of talking, even in open-hand mode (`interactions.js:662-676`, `:1782-1787`). The talk icon is hidden (`interactions.js:394-408`).
- **The hostile numbers.**
  - NPC HP is 100 (`combat-config.js` `npc.defaultMaxHP`). The jab does 10 per 0.5 s and the cross 25 per 1.5 s. An NPC's attack cooldown is 2 s plus a 0.5 s windup. The player walks at 150.
  - `aggroDistance: 1` never lets the chase start (`npc-behavior.js:694`), and attacks only come from the chase (`npc-behavior.js:1352-1371`). ATHENA and HaX in person really don't hit back.
- **The MIFARE clone.**
  - `#clone_keycard` carries `MIFARE_Classic_Custom_Keys` (`chat-helpers.js:341-347`). `rfid_data.uid` is generated from the `card_id` (`rfid-data.js:44-60`, `:150-160`).
  - The card screen offers "Darkside Attack (~30 sec)" with no keys (`rfid-ui.js:470-481`). Darkside returns to the card screen (`rfid-minigame.js:359-380`). Save refuses a keyless card (`rfid-minigame.js:276-283`) and otherwise emits `card_cloned` with `cardName` (`:287-293`).
  - The reader matches a saved card on `card_id` alone (`unlock-system.js:476-480`). A held keycard matches the same way (`:462-466`), so the dropped MIFARE card opens the reader.

## Severity table

| # | Sev | Finding (short) | Source |
|---|---|---|---|
| N1 | minor | A tidy caused by the locker catch gets the audit-closed reason in the confrontation ("The Director went asking questions on my floor") | new (probe q6) |
| N2 | minor | Knocking out the off-duty agent bypasses the catch, and nothing records it | new (probe q2) |
| N3 | minor | The new controls texts say walk away and put the fists away, but hostility never clears, so a punched Director, suspect, ATHENA or HaX can't be talked to again, and nothing says so | new |
| N4 | minor | The sight circle stays drawn after the catch is spent, after the naming, and over a KO'd agent | new (engine-side) |
| m7 | minor | The reader opens the cloner with nothing to emulate | carried (engine backlog) |

**Counts: 0 blockers, 0 majors, 4 new minors (N1–N4), 1 carried minor (m7).**

No soft-lock and no new dead end on the ending's path. Every round-1 change keeps the routes the cycle-1 review listed, and q1–q5 add none.

---

## Minor findings

### N1. The confrontation gives the wrong reason for a tidy caused by the locker catch
- **Evidence.**
  - The catch is now the fourth source of `nightshade_tipped_off`, through HaX's mapping on `locker_seen_picked` (`erb:986-995`, the mapping at `:989-995`). The other three are the accusations (`erb:977-985`) and three misreads before flag 4 (`ink/m08_director_netherton.ink:345`, `:376`).
  - The confrontation's tidy block has branches for the two older sources and a catch-all (`ink/m08_nightshade_confrontation.ink:78-89`). The catch-all, `- nightshade_tidied:` at `:87-88`, was written for the audit-closed case: "The Director went asking questions on my floor. I can count. So I tidied."
  - In probe q6 there were no accusations and `audit_closed` stayed false. The tidy came from the catch, and the confrontation still played the Director line. The player never caused the Director to ask anyone anything.
  - The confrontation ink declares neither `locker_seen_picked` nor `audit_closed` (grep: no `VAR`).
- **Why minor.** One line in the finale contradicts what the player did. Nothing is blocked.
- **Fix** (`ink/m08_nightshade_confrontation.ink`):
  - Declare `VAR locker_seen_picked = false` (a synced scenario global, `erb:2280`).
  - Add a branch before `- nightshade_tidied:` (`:87`): `- locker_seen_picked and nightshade_tidied:` → "Somebody saw you at the lockers in the break room. On this floor that reaches me before the kettle boils. So I tidied. Not well enough, it seems." (27 words.)
  - Keep the accusation branches first, as they are. An accusation and a catch together keep the accusation line, which is the louder of the two.
  - Add q6, inverted, to r13 or as r14 (`said` the new line, `notSaid` "The Director went asking questions").

### N2. Knocking out the witness makes the catch free, and nothing records it
- **Evidence.**
  - The gate skips a KO'd watcher (`npc-manager.js:313`). The erb comment states it as intended: "free with him down" (`erb:1911`).
  - `background_agent` has no `globalVarOnKO` and no `npc_ko:background_agent` mapping on any NPC (grep). The only reaction is the punch text pair (`erb:862-874`).
  - At 80/3 (`erb:1898`) he goes down in about 5 seconds of jabs for 3–6 HP. HaX in person sits two tiles from the lockers in the same room (`erb:1857`) and says nothing.
  - Probe q2: after the KO and two picks, `locker_seen_picked`, `nightshade_tipped_off` and `nightshade_tidied` are all false, and the credits show nothing.
- **Why it matters.** The round-1 fix made picking a colleague's locker cost a tip-off. Assaulting a colleague so he can't watch now costs less than being seen. Every other KO in m08 is answered: the suspects, the Director and HaX all have a KO global, a text and a credit or debrief line.
- **Fix** (existing fields only):
  - On `background_agent`, add `"globalVarOnKO": "offduty_agent_ko"` (a new scenario global).
  - On `agent_0x99`, add a onceOnly `npc_ko:background_agent` mapping with the condition `!globalVars.mole_identified && !globalVars.nightshade_tipped_off`. It sets `nightshade_tipped_off` and sends a text such as "An agent out cold in the break room. That's round the floor by midnight, and if one of those lockers is his, so is he."
  - Add a second onceOnly mapping on the same event with no tip-off condition, for the record only: a credit `THE BREAK ROOM: An off-duty agent knocked out in front of HaX` (warning) and one debrief line in `the_hunt`.
  - If the orchestrator would rather not tip him off on a KO, keep only the credit and debrief line. The cost is then trust rather than the locker.
  - Update the erb comment (`erb:1911`): the KO is no longer free.

### N3. The controls texts promise a recovery that hostility doesn't allow
- **Evidence.**
  - The second text for the Director, the three suspects, the confrontation and the two background NPCs reads: "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance." (`erb:873`). ATHENA's and HaX's single texts say the same (`erb:880`, `:886`).
  - Hostility in m08 never clears, and survives a reload (engine facts above). Back in open-hand mode, clicking a hostile NPC jabs them (`interactions.js:662-676`).
  - So a player who walks away from the Director, as the text suggests, comes back to a man who can't be spoken to. Each click to talk is another punch. The same goes for a suspect, ATHENA (an optional hint source) and HaX in person (the emotional beat).
  - For the Director this silently swaps the reading route for the KO route. The brief comes from `taskOnKO` (`erb:1228`), the card from the drop, and the reading goes to HaX. HaX's ladder doesn't notice in the meantime: "What does the Director need from me?" still says "Take it to him" while he's hostile and standing (`ink/m08_phone_agent_0x99.ink:137`, `:157`).
- **Why minor.** It isn't a soft-lock. Clicking him keeps jabbing, and about ten clicks put him down, after which the KO route and HaX's KO texts take over. The cycle-1 reviewer named the trigger (a player still in jab mode clicking to talk), and the round-1 text now points the wrong way.
- **Fix** (text only, `erb:862-886`):
  - For the Director, the three suspects and the confrontation, the second text: "He won't talk to you again tonight. Put him down, or keep your distance: he's slower than you. Q until the open hand shows to walk by clicking." (27 words.) Keep "She" for the analyst.
  - ATHENA: "That's ATHENA's reception avatar. She won't hit back, but she won't answer you either now, and she logs everything. Q until the open hand shows." (25 words.)
  - HaX in person: "Ow. I'm not hitting back, 0x00. But I'm done talking in person tonight. Ring me." (15 words.)
  - Optionally, a first rung on HaX's ladder for a hostile Director: the engine doesn't expose hostility as a global, so it would need one. A `npc_hostile_state_changed` mapping can set `netherton_hostile`, with a rung "He's not talking to you now. Either he's on the floor and you read it to me, or nothing." That is optional; the text fix is enough.

### N4. The sight circle outlives the catch
- **Evidence.** `_updateLOSVisualizations` draws any NPC with `los.visualize` and doesn't check KO or whether a mapping can still fire (`npc-manager.js:2098-2125`). The circle stays round the agent after his one catch, after the naming (when the mapping is off, `erb:1919`), and while he lies KO'd.
- **Why minor.** It only over-warns, so nothing is lost. A circle round a man on the floor looks like a bug, though.
- **Fix.** This is engine-side. Skip drawing for `isNPCKO` NPCs, and optionally for NPCs whose only `lockpick_used_in_view` mapping won't fire, using the same `_mappingWouldFire` check the gate uses. Log it for the orchestrator as an engine backlog item. Nothing mission-local fixes it short of dropping `visualize`, which would cost more fairness than it gains.

### m7 (carried). The reader opens the cloner with nothing to emulate
Unchanged; engine backlog (`docs/IDEAS_BACKLOG.md:48`). With MIFARE the clone takes longer, but HaX's server-room answer names both routes at every stage (`ink/m08_phone_agent_0x99.ink:76-96`).

---

## Confirmation of round-1 fixes

| # | C1 finding | Confirmed in the files? | Evidence |
|---|---|---|---|
| F1 | HaX's VM hint ladder one step late | **Yes** | Box topic on `server_room_entered and not found_gitlist_vuln` (`ink/m08_phone_agent_0x99.ink:102`), set by HaX's room-entry mapping (`erb:1009-1015`), with the VAR declared (`:30`). New flag-2 topic (`:107-110`). Credentials topic closes at flag 3 (`:111`), mail topic at flag 4 (`:115`). r12 passes, including a page reload between flags 1 and 2. q5: out-of-order flags leave each topic until its own flag, which is harmless |
| m1 | Phantom's confirmation doesn't count, and nothing says so | **Yes** | Netherton: "the men who went through that lab door" (`ink/m08_director_netherton.ink:249`). Phantom: "Ask the men on the lab door." (`ink/m08_suspect_phantom.ink:88`). Step 4's answer "The people on it confirm their own rows" (`:313`) is still true. r13 passes |
| m2 | Every NPC fights at engine defaults | **Yes**, see N3 | `behavior.hostile` on every NPC that can be punched: Netherton 75/3 (`erb:1226`), Cipher and the analyst 70/3, Phantom 90/4, Nightshade lab and confrontation 100/4, the off-duty agent 80/3 (`erb:1898`), ATHENA and HaX `aggroDistance: 1` (`erb:620`, `:1874`). The engine confirms that 1 never chases. Texts skip a restored hostile (`data.restored !== true`); r13 passes |
| m3 | The excerpt promises a name | **Yes** | Observation and pencilled note rewritten (the `server_access_log` object in the server room; grep finds no "unmask" or "whose account this is") |
| m4 | Stale comments | **Yes** | Grep for "flag 4 alone", "bench in Technical", "interview is optional", "made on the box", "box makes the case", "pointing at Nightshade": none left |
| m5 | The Director's card is EM4100 (optional) | **Yes** | `rfidCard.rfid_protocol` and the dropped card are both `MIFARE_Classic_Custom_Keys` (`erb:1232`, `:1246`). The engine path runs end to end (engine facts). HaX explains it before the clone (`ink/m08_phone_agent_0x99.ink:90-92`) and after (`:83-84`), and the nudge says "give it time" (`erb:968`). m04–m07 are all EM4100 (grep), so "the EM4100 you've been reading all year" is fair from m04 on |
| m6 | Picking an innocent man's locker costs nothing (optional) | **Yes**, see N1, N2, N4 | `los` 360/160 drawn and a once-only, pre-naming `lockpick_used_in_view` person-chat (`erb:1913-1922`). The knot `on_locker_picked` (`ink/m08_background_agent.ink:41-48`), the tip-off mapping (`erb:986-995`), the credit (`erb:201`) and the debrief line (`ink/m08_closing_debrief.ink:83-85`) are all in place. r13, q1, q3 and q4 pass |
| m7 | Empty cloner at the reader | Deferred (engine), as logged | No change expected |

## The questions asked of this cycle

**The HaX VM hint ladder.** It goes one step at a time and isn't a walkthrough.
- Each topic shows from the moment its step can start until it's done, and says where to look or what kind of weakness it is, never the commands.
- Before flag 1 the topic names the software and the class of flaw. Between flags 1 and 2 it names the places (history, stash), echoing the flag-1 text (`erb:698`). Between flags 2 and 3 it says to log in. Between flags 3 and 4 it names the route to root. The method is left to the guides, which sit one tier deeper behind "[I need a field guide.]".
- The wording describes the VM, so the user has to check it against SecGen (`DECISIONS_PENDING.md`, U1 addendum 2). That includes whether flags can come out of order. If they can, the flag-1 text "Now read: the history and the stash" reads oddly after flag 2 (q5). It needs no change unless the user finds the VM allows that order.

**The MIFARE clone chain, end to end.** It works:
1. All three interviews. The nudge says "give it time" (`erb:968`), and HaX's hub explains MIFARE and darkside (`ink/m08_phone_agent_0x99.ink:89-92`).
2. "[I'll need access.]", then the offer (`ink/m08_director_netherton.ink:183-188`).
3. "[Step up beside him…]", which runs `#clone_keycard` (`:190-194`).
4. The card screen offers "Crack keys first". The darkside attack takes about 30 s, the card screen comes back, and Save fires `card_cloned` with "Director Netherton Keycard". The mapping matches it (`erb:932-936`).
5. Back in his chat at `clone_debrief`. A failed or abandoned clone gets "did not get a clean read" and the hub offers the clone again (`:200-203`, `:127`).
6. The reader matches the saved card on `card_id`.

A reload mid-attack loses the pending return, and the hub offers the clone again. The browser check owes the darkside screen and the return to his chat.

**The locker-pick catch.** It is fair, visible and acceptable, once N1 and N2 are fixed.
- *Fair:* the brief asks that red herrings cost "trust, time, a tipped-off mole". The catch costs exactly the tip-off:
  - HaX's text, the credits line and the debrief line always land;
  - the tidy lands only if the player leaves 0x47 for later.

  That is the in-world speed of gossip. It matches the accusation rule (n6) and the existing "sprint beats the tidy" decision in cycle 1's "Considered" list.
- *Visible:* a drawn circle (the convention the player has met since m02), and his observations say he's watching the lockers (`erb:1923`).
- *Any locker:* being seen at 0x47 is searching a colleague without cause, so a tip-off is coherent. The engine can't tell the lockers apart at the gate anyway.
- *Caught at 0x47 still beats the tidy:* acceptable. A player who picks again at once has done what the accusation rule already rewards, and the record still shows the tip-off (q1). Most players caught at a herring will pick 0x47 in the same visit, so the material cost will often be avoided. The record cost is what makes it a cost, and that always lands.
- The two holes are N1 (the finale gives the wrong reason) and N2 (a KO skips it silently).

**The hostile tuning.** Knocking the Director out is still a viable designed route at 75/3.
- He has 100 HP: about 5 s of jabs, or 4 crosses.
- He deals 3 every 2.5 s at best, so a KO costs the player about 6–9 HP.
- At 75 against 150 the player can always disengage.

The tuning is mostly cheap for the player, which is right, because the KO's cost is narrative: the brief by `taskOnKO`, HaX's reading, and the warning credits. The issue is the other direction (N3): a punch that wasn't meant as a KO commits the player to the KO route without saying so.

**New dead ends, reload issues, exploits.**
- Dead ends: none found. Hostility (N3) resolves by KO; the catch is once and never gates.
- Reload: the catch's onceOnly is saved; hostility is restored without re-sending texts (r13); `server_room_entered` is a synced global (r12).
- Exploit: N2.

## Considered, no change recommended

These are recorded so the next round doesn't re-raise them.
- **"Out of his cone" in the erb comment** (`erb:1911`) can't happen at these lockers (every locker is inside 160 px). It is harmless, so tidy the wording when N2 edits that comment.
- **The catch fires on a hostile, still-standing agent** (the gate checks KO, not hostility). That's an engine edge with no chain impact, so leave it.
- **The "Dictionary Attack (unlikely)" option** on the MIFARE card falls back to the protocol menu, which offers darkside or nested. No dead end.
- **"Our top card, and it fell in half a minute"** (`ink/m08_phone_agent_0x99.ink:84`) is true to the ~30 s darkside.

## Carried to the dialogue stage (not counted)

- The off-duty agent promises "I'll be telling everyone I didn't see anything" (`ink/m08_background_agent.ink:47`). His "[Heard anything new?]" (`:53-64`) gossips about accusations, but not about anyone being in the lockers. One line gated on `locker_seen_picked` would pay it off.

## What could break (for the fixer)

- **N1.** Declare the VAR; the new branch goes after the accusation branches and before `- nightshade_tidied:`. Re-run r4, r5, r8, r9, r11 (the tidy routes) and q6, inverted.
- **N2.**
  - The new global goes in `globalVariables`.
  - The `npc_ko` mapping has to be onceOnly. Keep the tip-off condition disjoint from the record-only mapping, or accept the validator's co-fire warning.
  - The KO happens in the break room, so the tidy latches on the next room past the lab, as for the catch.
  - Add a route step: KO, then the credits and the debrief.
- **N3.** Text only. r13's `said` strings change ("Keep pressing Q until the open hand shows" becomes "Q until the open hand shows"). Keep each text at 30 words or fewer (the dialoguelint cap).
- **N4.** Engine change: the orchestrator's approval, committed separately.

## Items for the user

- **Needs checking against SecGen by the user** (unchanged; I opened none of the files):
  - U1 and U1 addendum 2: HaX's hub claims for each VM step;
  - whether the flags can be found out of order;
  - the account name question from cycle 1.
- **Engine (backlog):** N4 (circle over a KO'd or spent watcher); m7.

## Spoken lines these fixes would touch

- **N1:** new Nightshade line, "Somebody saw you at the lockers in the break room. On this floor that reaches me before the kettle boils. So I tidied. Not well enough, it seems."
- **N2:** a new HaX text, "An agent out cold in the break room. That's round the floor by midnight, and if one of those lockers is his, so is he." A new Netherton debrief line, for example "You put an off-duty agent on the break-room floor so nobody would watch you." The credit line isn't voiced.
- **N3:** these HaX texts change:
  - the shared second text: "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance." → "He won't talk to you again tonight. Put him down, or keep your distance: he's slower than you. Q until the open hand shows to walk by clicking.";
  - ATHENA's text;
  - HaX in person's text.

## Can the stage close?

**Yes, pending the browser check.** This round found nothing above minor: 0 blockers, 0 majors, 4 new minors, 1 carried. Each minor is mission-local text or wiring except N4, which is engine-side. N1–N3 are small enough to fix in the same commit as the closing note, without another review cycle. If they are fixed, r13 and the inverted q2 and q6 are the static confirmation.

Owed on screen at the stage's browser check (from round 1 and carried from alignment):
- HaX's hub before flag 1 (after entering the server room) and between flags 1 and 2;
- the Director's chase speed and the two texts after a punch, and that clicking him afterwards jabs (N3);
- ATHENA not hitting back;
- the MIFARE darkside clone at Netherton, returning to his chat, then the saved card at the reader;
- the off-duty agent's circle and the catch at a locker;
- the brief before and after the naming;
- HaX's post-KO reading needing a clock.

*Reviewed against `scenario.json.erb`, the ink and the engine. Cycle 2 of the pass-5 puzzle-chains stage.*
