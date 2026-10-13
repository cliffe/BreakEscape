# m06 Follow the Money: puzzle chains review, pass 5 round 1

Read-only review (Opus, static). Kind of game: a SAFETYNET campaign mission, a TV spy thriller about a money trail. Measured against m01_first_contact, m02_ransomed_trust and the `mission-puzzle-chains` skill, with m04's pass-5 puzzle-chain rounds as the list of bug classes to hunt.

Every claim below is cited against `scenario.json.erb` (written `erb:N`) and the ink as they stand on 2026-10-13, not the older `PUZZLE_CHAINS_PLAN.md` (draft 4, pass 3). Alignment is closed. The open items handed to this stage were m12 (the fingerprint kit is carried but never used), Kemal's beat tuning, and N1 (one real pick inside Kemal's cone, owed to the first browser run).

## Scope

- Covered: room depth and lock order; the whole lock/key chain; cumulative kit (picks m01, cloner m03, print kit m04); whether the mission's choices are required; red herrings; answers handed over by a task title, toast or NPC; the silent-failure bug classes (skill Step 4, `README_scenario_design.md` "Common bugs", m04 R1–R4); the pass-5 pieces as puzzles (cover strain, Kemal's door, Irina's badge, the custody console, the passphrase); softlocks after KOs and reloads.
- Engine read: only `minigames/pin/pin-minigame.js` and the `maxAttempts` lines of `minigame-starters.js` / `unlock-system.js`, to settle the console's attempt limit. Not opened: the SecGen XML, the four exploit guides, the exploit detail in `VM_INTEGRATION.md`, the sight-challenge source. VM content is judged only on whether the flags are required and woven in; anything finer is marked "needs checking against SecGen by the user".
- Checks run:
  - all 13 routes in `scripts/ink_runtime_check/m06_routes/` (every one reports "all expectations met");
  - the validator with `--skip-ink --no-graph`: no errors; schema, geometry and door alignment pass; the same 19 duplicate-pattern notes on HaX, 3 repeatable-cutscene notes and the two-sources-for-the-server-room note that round 3 of alignment recorded; two all-conditional credit sections (suggestions);
  - `dialoguelint`: no findings;
  - `room_depth.py`: 9 rooms, 0 empty, 8 lock declarations.
- No browser session was started.

## Headline numbers

| | m06 | m02 (gold) |
|---|---|---|
| Rooms | 9 | 15 |
| Empty rooms | 0/9 | 6/15 |
| Lock declarations | 8 (key ×2, password, PIN ×3, RFID ×2) | — |
| Critical-path depth | 6 (lobby → CEO office), with one full walk back (data centre → trading floor → data centre) for the executive badge | — |

## Dependency chain

```
reception_lobby (d0)   brochure names the CTO (erb:1378); HaX's briefing-close text names Volkova (erb:855)
  |
  v  north
security_checkpoint (d1)   checkpoint guard on a two-point beat (erb:1394-1431)
  * IT checklist: "<crypto term> + <current year>", Rev. January 2025 (erb:53, 1448-1458)
  |   -> server_passphrase_known
  |
  +-- [key lock, easy] --> trading_floor (d2)        erb:1466-1469
  |     routes: talk (FCA + "Dr Volkova" -> #unlock_door), pick in his blind window, or KO + pick
  |     pick seen -> guard_caught -> cover_strained (erb:1222-1227)
  |
trading_floor (d2)   Irina, Dani
  * Irina: wordlist (trust >= 15, or a second ask)       Irina ink:240-266
  * Irina: CTO badge lend (trust >= 25, >= 35 strained) or clone (start-kit cloner)   ink:311-364
  * Irina: executive badge, once the fund is found, any trust or fate   ink:372-393, 585
  |
  +-- east  --> blockchain_lab (d3)   Priya's write-up: deposits in (amounts, times)   erb:1847-1857
  +-- west  --> [rfid: cto_badge] irina_office (d3, optional)
  |               * research notes -> read_irina_notes -> a leverage line that turns her (ink:467)
  |               * Architect email P.S.: safe = "year the last bitcoin is mined" (erb:1908)
  +-- north --> [password: bitcoin2025] server_room (d3)   erb:1607-1609
                  * VM terminal; flag station; rack sheet (credential reuse, doors)
                  * flag 1 -> flag 2 -> flag 3 pays the Door Controller Export (PIN 3110)  erb:1650-1672
                  * flag 4 pays the recovery keys (freeze needs them)                      erb:1655, 1028-1031
                  |
                  +-- north [pin 3110] --> data_center (d4)   erb:1706-1712
                        * transaction server: settlement log, pool config, custody index
                        * [pin 4471] custody console -> Architect's Fund doc -> found_architects_fund
                        |       (deduction: Priya's deposits - 1.5% fee, >= 6 h hold -> slot 4471)
                        |
                        |   ...walk back to Irina on the trading floor for the spare executive badge
                        |      (or the badge off a KO'd Irina, or HaX's relay if she's down or collected)
                        |
                        +-- east [rfid: executive_badge] --> executive_wing (d5)   erb:1919-1922
                              Kemal Aydin on a beat; framed press clipping "Until 2140" (erb:2020)
                              routes: FCA line (cover held) / Irina's word (strained, turned Irina)
                                      / pick in his blind window / fight (KO drops the key)
                              |
                              +-- north [key: ceo_office_key] --> satoshi_office (d6)   erb:2041-2044
                                    Satoshi: freeze (needs flag 4 keys) or watch; detain; fight
                                    [pin 2140] executive safe (optional) -> Tesseract file

Ending: ready_to_extract = both decisions + all four flags (erb:1307) -> "Bring me in" -> debrief.
concludeRequires = the four flag tasks (erb:487-494).
```

The VM gates the physical path: the data centre code exists only in the export that flag 3 pays out (erb:1669), and freezing needs flag 4's keys (Satoshi ink:295, phone ink:518). The four flags are required twice over, by `concludeRequires` and by the call-in latch. HaX reacts to each flag (erb:1008-1032), and the debrief gives each flag its own beat. Whether those texts describe the VM correctly needs checking against SecGen by the user (already `DECISIONS_PENDING.md` D3/D4).

## Boss-key audit

| Lock | erb | Seen at | Key / code available at | Verdict |
|---|---|---|---|---|
| `trading_floor` (key) | 1466-1469 | d1 | picks (m01) or the guard's word | ✅ by design: capability spend or social route |
| `server_room` (password) | 1607-1609 | d2 (north door) | checklist d1; wordlist d2 from Irina, beside the door | ⚠️ key-before-lock for the checklist half, same room for the wordlist half; the checklist toast then states the recipe (M3) |
| `irina_office` (RFID) | 1875-1877 | d2 | Irina's badge at d2 (lend or clone) | ✅ by design: the m03 cloner spent at conversational range |
| `data_center` (PIN 3110) | 1706-1708 | d3 | flag 3's export, after the VM work | ✅ boss-key, and the best gate in the mission: the hunt is the VM |
| `cold_storage_console` (PIN 4471) | 1766-1777 | d4 | Priya's write-up d3 + settlement log and pool config d4 | ✅ on paper (two rooms, a real deduction); ❌ in practice, because six to seven slot numbers can be tried in two openings at no cost (M1) |
| `executive_wing` (RFID) | 1919-1922 | d4 (east door of the data centre) | Irina at d2, after the fund | ✅ boss-key: seen, walk back, return. The early-KO badge is the exception (key-before-lock, handled by HaX's text erb:1064-1069) |
| `satoshi_office` (key) | 2041-2044 | d5 | Kemal, same room | ✅ by design: a social, stealth or combat lock |
| `executive_safe` (PIN 2140) | 2101-2103 | d6 | clipping d5 (states the number), email d3, a turned Irina | ⚠️ the answer hangs on the corridor wall next door (m1) |

## Cumulative kit

| Tool | From | m06 use | Verdict |
|---|---|---|---|
| Lockpick | m01 | Checkpoint door in the guard's blind window (erb:1466); Satoshi's door in Kemal's blind window (erb:2041) | ✅ Two uses, and the second one differs: the guard stands on a short beat, Kemal walks a longer one and holds the key. Each one costs something if seen: the guard's catch strains the cover (erb:1222), and Kemal's catch ends the FCA line for that visit (minder ink:166) |
| RFID cloner | m03 | Irina's CTO badge, read while she talks (Irina ink:206, 347-364), for her office (optional) | ✅ Used where it should be, and spent socially. Its payoff is the research notes, which give a low-trust player the line that turns her (ink:467). The office's other payoff, the safe clue, is undercut by the clipping (m1) |
| Fingerprint kit | m04 | **None.** `puzzle_graph_note`: "Carried, unused: nothing at HashChain sits behind a print" (erb:583) | ⚠️ The briefing names it as tonight's kit: "Your usual kit: picks, the RFID cloner and the print kit" (briefing ink:95). A player who hears that will look for print surfaces, and none exist. That's a red herring that costs time (m2, decision D2) |
| PIN cracker | m02 | Absent: "R&D still have it on the bench" (briefing ink:95) | ✅ Rationed, as the standing rule says. The absence is also what makes the console and safe deductions matter, which is why M1 bites |

m06 grants nothing new, and m07 carries the same kit unused ("Neither is needed here", m07 erb, start kit). So "carried, unused" has a precedent. The difference is that m06's briefing promises the print kit by name.

## Are the mission's choices required?

Yes. This is the strongest part of the structure.

- The call-in, the only route to the debrief, needs both decisions and all four flags (`ready` at erb:1307; phone ink:148). Both choices are therefore required without putting story tasks in `concludeRequires`, which is the honest shape the skill asks for.
- Each choice carries consequences rather than gates:
  - **Freeze or watch.** Freezing needs flag 4's keys. Each option has its own HaX reaction (erb:1270-1280), credits (erb:176-177) and Satoshi line (Satoshi ink:494-500).
  - **Irina turned or detained.** A turned Irina narrows and confirms the slot (Irina ink:499-502, 540-568), gives the safe code (:504), and vouches to Kemal (minder ink:63). A detained Irina gives nothing and is collected by the police (erb:1292-1300).
  - **The cover.** A strained cover raises Irina's lend threshold (Irina ink:315), closes Kemal's FCA line (minder ink:61) and changes Satoshi's opener (Satoshi ink:61-66), the debrief and the credits.
- The optional threads have weight:
  - The safe (Tesseract) gets a credit (erb:217-218) and HaX's "His safe's still shut" (erb:1309; phone ink:553).
  - Irina's office gives the leverage line that turns her.
  - Talking to Dani and Priya changes the credits.
- One required task can dead-end: `obtain_access_tools` (erb:265-274) stays open for good if Irina is turned before she hands over the wordlist (M2).

## Red herrings that cost nothing

- **Custody index labels** (erb:76: "Trust the money, not the label"). A good herring: it costs a read and teaches the lesson. It does enumerate the slot numbers, though, and that feeds M1.
- **The decoy slots** (3815, 6120, 2207, 5093, 8846; erb:58-62). These are well built. Each one fails exactly one test (time, fee or amount), and 5093 rewards doing the 1.5% properly.
- **Daily trading report** (erb:1596). Flavour that corroborates Priya, and it costs nothing. Fine.
- **The print kit** (briefing ink:95). This herring does cost something: see the kit table.
- **The guard's wrong answers** ("IT", "consultant", "the CEO"; guard ink:62-85). They cost only the walk back, which is right for an honest mistake.

## Answers handed over by a title, toast or NPC

| Where | What | Verdict |
|---|---|---|
| Checklist pickup toast, erb:985 | "House rule: a crypto term and a year. The checklist's own date is the year. The term tops the list people here use. Volkova keeps one." Unasked, the moment the checklist is picked up | ❌ States the whole recipe. With the wordlist in hand the passphrase is a lookup (M3) |
| Recap, phone ink:283-286 | The same recipe | ✅ Asked for: "Remind me where we are" is the player's hint request. It can stay |
| Press clipping, erb:2020 | "'Until 2140', the year the last bitcoin is due to be mined", in the corridor outside the safe | ⚠️ Solves the optional safe one room away. The email (Irina's office) and a turned Irina's line become redundant (m1) |
| Priya's mixing notes, erb:1865 | "5. Send to The Architect's Fund", before the fund has been found or named | ⚠️ Names the fund the console is meant to reveal, in the notes of an analyst who "has not yet understood what her own graph proves" (erb:1829) (m8) |
| Door Controller Export observation, erb:1670 | "The data centre code is on the second line." | ✅ This is a reward for three flags of VM work, and it's meant to be read off |
| Fund-found text, erb:1095 | "The spare executive badge was signed out to Volkova. She's on the trading floor." | ✅ It directs the walk back, which is the return beat. The export (erb:1669) also says so in-world |
| HaX "Which cold slot is the fund?" rung 3, phone ink:472 | A near-answer | ✅ It's the third rung of a ladder the player asks for |
| Irina's slot check, Irina ink:540-568 | Confirms any slot the player names, and can be asked again with no limit | ⚠️ A free oracle for the console answer (part of M1) |
| Task titles and aim descriptions | — | ✅ None names a code or a culprit. "Get the spare executive badge signed out to Irina" (erb:440) shows only once the fund is found |

## Findings: severity table

Counts: **0 blockers, 3 majors, 10 minors.**

| # | Sev. | Finding | File:line | Concrete fix |
|---|---|---|---|---|
| M1 | major | **The follow-the-money deduction can be skipped by trying the slot numbers.** The console sets no `maxAttempts`, so the pad gives the engine default of 5 tries per opening (`pin-minigame.js:6`, `:43-45`, lockout at `:593`). The count resets to 0 on every opening (`:57`), and earlier guesses stay on screen (`:8-11`). The settlement log lists six slots and the custody index seven (erb:72, 76). Every candidate goes in within two openings, about thirty seconds, at no cost. A turned Irina is a second free oracle: `slot_check` confirms any slot and can be asked again (Irina ink:540-568, 587). This is the mission's central puzzle, the one the title names, and the credits still say "TRACED THROUGH THE MIXER" (erb:170). The erb comment (erb:1764) and `TESTING_WALKTHROUGH.md:65` both say there is "no attempt limit"; the engine's limit is real, but it resets | erb:1766-1777, 1764; Irina ink:540-568 | Give the brute force a cost inside the story, without a fail state (decision D1, recommended a + c): (a) `"maxAttempts": 2` on the console, plus a HaX mapping on `minigame_failed` with `data.minigameName === 'PinMinigame' && data.result && data.result.maxAttemptsReached === true && globalVars.entered_data_center === true && globalVars.found_architects_fund !== true && globalVars.cover_strained !== true` → `cover_strained`, text: "That console logs every slot it opens. Somebody's phone just buzzed." The event carries no object id (`base-minigame.js:99-104`), so the condition does the scoping; verify in a browser that a cancel doesn't trip it. (c) Limit Irina to one check per visit (ink-local latch, cleared in `start`), and make a wrong check cost trust or drop her confirmation. Correct the erb comment and walkthrough 17a to "5 per opening, resets" (or whatever D1 sets) |
| M2 | major | **Turned before she hands over the wordlist, Irina can never hand it over.** Once `irina_fate_decided` is set, `start` goes to `after_choice` (Irina ink:89-90). `after_choice` offers only the executive badge, the slot check and "Nothing" (ink:585-597). HaX's relay needs `irina_ko or irina_taken` (phone ink:181), and a turned Irina is neither. The route is short. Academic opener (+25) and agreeing on privacy (+10) give 35. Take Priya's write-up next door, then "There's something you need to see" (needs trust ≥ 20 and the write-up, ink:212) leads to `evidence_pivot` and `reveal_identity`, and at trust ≥ 35 she accepts (ink:456-457). The player has never been offered a reason to ask for the wordlist first. Afterwards: `obtain_access_tools`, a required task (erb:265-274), never completes. The recap says "Get it from her" for the rest of the mission (phone ink:276-281). The server room passphrase has to be guessed from the checklist alone. A detained Irina is safe from this, because she is collected on the next room entry and the relay opens | Irina ink:574-597; phone ink:181, 276-281 | Add to `after_choice`: `+ {irina_recruited and not found_password_lists and not wordlist_handed} [I still need that wordlist.]`, which gives `#give_item:text_file:m06_password_dictionary` with a one-line reply ("Of course. Here."). For a detained Irina on the floor, add a narrator variant that takes it from her desk, matching her exec-badge branch (ink:374-378). Add a route (turned before the wordlist) to the driver |
| M3 | major | **An unasked toast states the passphrase recipe on the checklist pickup.** "House rule: a crypto term and a year. The checklist's own date is the year. The term tops the list people here use. Volkova keeps one." (erb:985). The checklist says "Rev. January 2025" and the wordlist begins `bitcoin` (erb:1540). Together they turn the door's only deduction into a lookup, before the player has tried the door. The checklist already does its own nudging ("It is the obvious one", erb:53) | erb:981-986 | Cut it to the clue's shape, not its answer: "That's their house rule for door passphrases. Volkova keeps the list of words her people pick." Keep the full recipe in the recap (phone ink:283-286), where the player asks for it |
| m1 | minor | **The optional safe is solved on the corridor wall.** The clipping outside the CEO's office says "'Until 2140', the year the last bitcoin is due to be mined" (erb:2020). The safe's observation points at "a number that means something to him" (erb:2105). The Architect email in Irina's office (erb:1908) and a turned Irina's "His safe is 2140" (Irina ink:504) are then a second and third source, and the email adds nothing. That also takes away half the cloner's payoff (the office is the cloner's only target) | erb:2020, 1908, 2105 | Split the clue across rooms (decision D3, recommended a): the clipping keeps the motive and loses the number ("He signs off every interview the same way: 'Until the last coin.'"); the email keeps "the year the last bitcoin is mined"; and the number goes somewhere natural, such as a margin line in Priya's mixing notes ("21M cap. Last coin due around 2140. Not our problem."). Then email or clipping + Priya, across three rooms. A turned Irina still tells it outright, as her reward |
| m2 | minor | **The print kit is promised and never used** (alignment m12). "Your usual kit: picks, the RFID cloner and the print kit" (briefing ink:95); "Carried, unused" (erb:583). No object has `hasFingerprint`, and no lock is biometric | briefing ink:95; erb:577-584 | Decision D2. The cheapest fix is to stop promising it: "...and the print kit, for what it's worth. Nobody at HashChain touches anything twice." The better one is a single optional print beat (D2 b) |
| m3 | minor | **Flag 4 landing late gives stale lines** (m04 R4-5 class: texts that assume an order). After a "watch" decision (no keys needed), the flag-4 text says "freeze it, or watch it" with no skip (erb:1031). The hub's "The whole estate is mapped. Where does that leave us?" (phone ink:156) then plays `on_network_complete`: "Satoshi's wing is on an executive badge. The spare's signed out to Volkova. She's yours to decide about too", then "[I'm going up.] He'll be expecting someone" (phone ink:437-453). None of it checks `irina_exec_badge_given`, `satoshi_confronted`, `irina_fate_decided` or `assets_decided`. Flag 4 last is a supported order: the flags nag (erb:1185-1200) exists for it | erb:1031; phone ink:156, 437-453 | Add `"skipIfGlobal": "assets_decided"` to the flag-4 text, or split it in two with a "keys in your kit, the decision's made" variant. In `on_network_complete`, gate the wing and badge line on `not satoshi_confronted and not irina_exec_badge_given`, the Volkova line on `not irina_fate_decided`, and the choices on `not assets_decided`; otherwise say "That's the vault account. The recovery keys are in your kit." and return |
| m4 | minor | **Flag 1's text doesn't skip when flag 2 is already in.** "First account's yours… I've a credential reuse guide" (erb:1011) has no `skipIfGlobal`, while flag 2's skips on flag 3 (erb:1018). Whether the VM lets flag 2 be found before flag 1 needs checking against SecGen by the user | erb:1008-1012 | `"skipIfGlobal": "flag2_submitted"` on flag 1's text. That's harmless if the VM forces the order |
| m5 | minor | **The recap checks how Kemal was dealt with, not whether the door is open** (the bug class the brief names). The minder lines need `not minder_passed and not minder_ko and not minder_hostile` (phone ink:325). A player who picked Satoshi's door unseen and stepped back out without speaking to him is still told "the minder has the key… pick it while his back's turned" | phone ink:322-332 | Add `and not resolve_aim_open` (set when `access_satoshi_office` completes, erb:1163-1166; declare the VAR in the phone ink and add it to the m06 block of `missions.json`) |
| m6 | minor | **The "no attempt limit" note is wrong.** The engine gives 5 tries per opening and resets on reopen (`pin-minigame.js:6`, `:57`, `:593`). Pass-5 regression M6 saw five wrong tries, which is exactly the limit. The note appears in the erb comment, `TESTING_WALKTHROUGH.md:65`, and the log's R-M6 outcome | erb:1764; TESTING_WALKTHROUGH.md:65 | Correct the text when D1 is settled |
| m7 | minor | **The aims can reveal out of order on the early-KO route.** The comment says the `enter_room` task means a KO'd Irina's badge "can't reveal aim 5 early" because "the wing is behind the flag-3 PIN" (erb:445-447). Flag 3 isn't the fund, though: a player holding her dropped badge can walk past the console into the wing. That completes `take_executive_badge` and reveals "Reach The Top Floor" while "Map The Money" is still open (the reveal-on-any-task rule, erb:226-230). Entering the office then unlocks the conclusion aim. Nothing breaks: HaX texts the player back (erb:1064-1069), and Satoshi defers the decision (Satoshi ink:301). The task list reads out of order, though | erb:445-447 | Reword the comment to say what actually happens. No structural change: the text backstop is enough, and gating a door on story state would need engine work |
| m8 | minor | **Priya's notes name the fund before it is found.** "5. Send to The Architect's Fund" (erb:1865) | erb:1865 | "5. Into one wallet? Every cell draws on something." Keeps her half-guess and leaves the name to the console |
| m9 | minor | **A turned Irina can no longer lend her CTO badge**, and the clone option is gone too (both are hub-only, Irina ink:203-207; `after_choice` has neither). Her office and its email are then unreachable short of knocking her out. Nothing required is lost: she tells the safe code herself | Irina ink:574-597 | Optional: in `after_choice`, add `{irina_recruited and not irina_badge_obtained and not irina_badge_cloned} [Can I borrow your office badge?]` → the lend give. It costs one line |
| m10 | minor | Tidy-ups. (a) The `room_entered:server_room` mapping has two `"_comment"` keys (erb:988, 992). JSON keeps the last, so the backstop note is silently dropped. (b) The guard ink comment says the catch is "cooldown 0" (guard ink:108); the mapping uses 250 ms (erb:1440) | erb:988-993; guard ink:108 | Merge the comments; fix the number |

Not a finding: the validator's 19 duplicate-pattern notes on HaX and the 3 repeatable-cutscene notes are deliberate, as alignment round 3 recorded. `dialoguelint` is clean.

## The new pieces, as puzzles

1. **The cover strain.** It works as a delayed cost, which is the right shape for it. The guard's catch on the first floor (erb:1222) is paid for three acts later at Kemal's door and in Satoshi's opener. It's also readable: the guard says he'll ring (guard ink:132), HaX names the cause (erb:1226, 1238, 1253, 869), and the recap repeats it (phone ink:266-268). It never locks a route: Irina's word, the pick and the fight stay open at Kemal; the cloner stays open at Irina's office; the executive badge doesn't depend on trust (Irina ink:209, 372-393). No change.
2. **Kemal's locked door: talk, pick or fight.** All three routes are real.
   - Talk is free while the cover holds (minder ink:61). That's the reward for a clean night, so the pick-window puzzle is mostly met by players who've strained the cover. That fits the design and needs no change.
   - The pick is a different puzzle from the guard's. Kemal patrols, holds the key, and a pick he sees ends the FCA line for that visit (ink:166).
   - The fight drops the key (erb:1948-1959).
   - Backing off can't be used as a free walk-in, because the door is locked whatever his challenge cooldown is doing (erb:2041).
   
   **Beat tuning:** don't change the numbers yet. On the geometry in the erb comment (erb:1929), the door is behind him or outside his cone for the east dwell, the walk west and the west dwell (about 4.5 + 3 + 3.5 s), and exposed only on the walk east (about 3 s). That's a generous window for an easy four-pin lock, which suits "fun, not hard". N1 (one real pick started inside his cone) is still owed to the first browser run. Change the east dwell (4500 → 6000 ms) only if that run shows his walk-east glimpse cutting into an open pick minigame. If the beat is lengthened, add `changeDirectionInterval` as m02 does for Val.
3. **Irina's badges.** The CTO badge is a social lock with a capability bypass, done well: the lend scales with trust and the cover, and the clone needs only conversation range (Irina ink:311-364). The executive badge is the mission's best return beat. The player meets the RFID door at the data centre, finds the fund, walks back to the floor and puts the allocation in front of the woman who built the mixer (ink:380-388), then returns. The backstops are complete: drawer narration if she's detained (ink:374-378), the drop if she's knocked out, HaX's relay once she's down or collected (phone ink:162). Gaps: M2 (the wordlist after she's turned) and m9 (the office badge after she's turned).
4. **The custody PIN console.** The deduction is well made. Three inputs from two rooms (Priya's deposits in the lab; the settlement log and pool config in the data centre), five decoys that each fail one test, and an author with a motive for every document. Then the pad lets the player skip it (M1). Fixing M1 matters more than anything else in this round, because this puzzle is what the mission is about.
5. **The passphrase from the wordlist.** It's a fair two-part clue. The checklist gives the convention and the year, and the wordlist the term. Both have in-world authors with motives: IT's lazy convention, the CTO's own audit list. The toast hands it over (M3), and the wordlist can be lost on one route (M2). The validator's "two sources for server_room" note is the two halves of one clue, not redundancy. Mark the checklist `puzzle_graph_optional` only if you want the note gone, and don't, because both halves are meant to be needed.

## Softlocks after knockouts and reloads

Checked against `docs/agents/SOFTLOCK_PATTERNS.md` S1 (a burnt first-call gate) and S2 (order dependence).

| State | Outcome | Verdict |
|---|---|---|
| Irina knocked out before the wordlist | Her text_file drops and can't be picked up (E20); HaX's relay is offered (phone ink:181) | ✅ |
| Irina knocked out: badges | Keycards drop beside her and can be picked up; relays for both (phone ink:162, 179) | ✅ |
| Irina detained on the floor, before the wordlist or badge | Collected on the next room entry off the floor (erb:1292-1300), which opens the relays | ✅ |
| **Irina turned before the wordlist** | **Wordlist unobtainable; required task stuck; recap stale** | ❌ M2 |
| Guard knocked out | The door stays locked, and the pick is unwatched | ✅ |
| Priya or Dani knocked out | The write-up is a room object, so it isn't lost (erb:1847) | ✅ |
| Kemal knocked out | The key drops (erb:1948); the challenge is skipped (erb:1982) | ✅ |
| Kemal hostile, the player avoids him | Pick the door; the pick catch is skipped while he's hostile (erb:1996) | ✅ |
| Satoshi knocked out before the fund | Phone decision offers "Not yet" (phone ink:532); the hub keeps a sticky option (phone ink:152); re-entering his office re-asks (erb:1155-1160) | ✅ |
| Satoshi knocked out, keys missing | Watch is still offered; freeze waits for flag 4 (phone ink:518-541) | ✅ |
| Reload after Kemal's talk-past, before entering | `#unlock_door` is re-issued on re-entry until Satoshi is confronted (minder ink:40-45) | ✅ |
| Reload after a seen pick | Kemal forgets the picks (ink-local `saw_picks`) | ✅ Accepted in alignment round 2 |
| Reload mid call-in, or before the debrief's first line | Re-emit backstop (erb:1360-1367); route r13 covers it | ✅ |
| Early executive badge (Irina knocked out), flag 3 in, fund not found | Wing reachable; aims reveal out of order; HaX texts the player back; Satoshi defers | ✅ playable, m7 cosmetic |

No hard softlock on the critical path. M2 comes nearest: the passphrase is still guessable ("It is the obvious one"), but the required task stays open for good.

## Silent-failure bug sweep

- `item_picked_up` keyed on type with an `itemId` condition, every time (erb:888-918, 945-955, 1072-1075). ✅
- `card_cloned` uses `data.cardName === 'CTO Access Badge'`, which matches Irina's `rfidCard.name` (erb:903, 1502). ✅
- `globalVarOnKO` emits no `global_variable_changed`, so every KO reaction keys on `npc_ko:<id>` (erb:1106-1133, 1229-1255, 1288). ✅
- Flag rewards: `give_item` names match the station's `itemsHeld` names, and flags 1 and 2 use `set_global` (erb:1636-1683). ✅
- `#give_item` tags all name item ids (Irina ink:249, 319, 376, 387; phone ink:486-498). ✅
- No `[LORE:]` or `[NOTE:]` in any `text` or `observations`. No observation states a code its own lock needs. The export's "second line" is a VM reward, not its own lock. ✅
- Stale geography: "west door" for her office (Irina ink:322, trading floor `west`, erb:1474), "east of the data centre" for the wing (ink:389, erb:1711), "north door" for the data centre (erb:1024, 1612). All match `connections`. ✅
- Dead globals: none found by a grep of declared globals against erb and ink reads. The validator's set-but-never-read check is clean.
- Hub-checks-how-not-whether (m04 R3-1/R3-2 class): the recap's door, guard, server-room, data-centre and badge lines all check outcomes (`guard_resolved` from entering the floor, `server_room_entered`, `entered_data_center`, the pickup globals). The one exception is the minder block (m5).
- Texts that assume an order (m04 R4-5 class): m3 and m4.
- Technical claims: none beyond the VM wording, which needs checking against SecGen by the user (D4).

## Decisions for the user (or the orchestrator), each with a recommendation

**D1. What should a wrong slot on the custody console cost?** (M1)
- (a) **Recommended.** Two tries per opening, and a lockout strains the cover once ("That console logs every slot it opens…"). It reuses a consequence system the player already understands, with no fail state, so it stays "fun, not hard". Mission-local; verify the `minigame_failed` scoping in a browser.
- (b) `maxAttempts: 2` with no story cost. Cheaper, but a guesser only pays an extra opening.
- (c) **Recommended, alongside (a).** One slot check per visit with Irina, so she confirms the player's reasoning rather than doing it for them.
- (d) Leave it as it is and accept the skip. Then reword the credit to "TRACED" without "THROUGH THE MIXER". Not recommended: it gives up the puzzle the mission is named for.

**D2. The fingerprint kit (m12).** (m2)
- (a) Stop promising it: one briefing line, with no audio cost while m06 has no cached voice (round 1 of alignment says so). Matches m07's "carried, unused".
- (b) **Recommended.** One optional print beat with a motive. Satoshi's hardware signing device, in a desk drawer in his office, is enrolled to his own print: the paranoid-about-doors CEO Irina describes (Irina ink:308). Lift the print from the framed press clipping in the corridor ("He had it mounted himself", erb:2021), which sits inside Kemal's beat. Dusting it is then a stealth beat in a different room from the lock. This uses the m04/m05 pieces (`hasFingerprint`/`fingerprintOwner` on the object, a `biometric` lock on a container; m05 erb:1584-1587, 1782) with no engine change. Contents: the release's signing record, which gives one debrief line and one credit, leaving the freeze/watch outcome unchanged. It fits D3 (a), which takes the number off the clipping.
- (c) Make the safe biometric. Not recommended: it throws away the 2140 ego deduction.

**D3. The safe clue.** (m1)
- (a) **Recommended.** The clipping keeps the motive, the email the meaning, and the number moves to a natural place in a third room (Priya's margin). A turned Irina still says it outright.
- (b) Leave it as it is: the safe is optional, and the redundancy only costs the cloner half its payoff.

**D4. VM wording: needs checking against SecGen by the user.** This is already pending as `DECISIONS_PENDING.md` D3/D4. It covers:
- the flag texts (erb:978, 1011, 1018, 1024, 1031);
- the flag reward descriptions (erb:1641-1657);
- the guide observations (erb:778, 787);
- whether the flags can arrive out of order (m4).

Nothing in this review depends on the answer except m4.

## What to do, in order

1. M2 (the wordlist from a turned Irina), with a new driver route. Bug fix; shippable whatever else is decided.
2. M3 (the toast) and m3/m4/m5 (order and status text). Text and condition fixes.
3. m6, m7, m8, m10 (comments, walkthrough, Priya's line, tidy-ups).
4. D1 → M1, then the browser check of the `minigame_failed` scoping, the console lockout and N1 (Kemal's real pick).
5. D3 and D2 together, if taken: the clipping changes for both.
6. m9 (the CTO badge from a turned Irina), optional.

Each step depends only on steps above it. Steps 1–3 touch the phone ink, Irina's ink and HaX's mappings; re-run the 13 routes, `reopencheck` and `tagdiff` after them.

## Verdict

Not ready to close. There are three majors: one puzzle that can be skipped (M1), one route that dead-ends a required task (M2), and one answer handed over (M3). All three are mission-local, small and well understood. The structure underneath is good:
- the VM gates the physical path;
- the executive badge gives a real walk back;
- both choices are required by the call-in rather than by `concludeRequires`;
- the cover strain is a delayed, readable cost;
- every KO has a backstop.

Round 2 should confirm M1–M3 and m3–m5, and look at D2 (b) if it is taken.

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 1 (static; no browser session). Routes: 13/13 pass. Validator (`--skip-ink --no-graph`): no errors; known warnings only. `dialoguelint`: clean.
