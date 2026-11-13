# m06 pass 5: alignment review, round 2

2026-10-13. Opus reviewer, read-only, static only (no browser session). Checks the round-1 fixes in commit ef4d1057 against `scenario.json.erb` and the ink, then reviews the new work using the `mission-alignment-plan` rubric. I didn't open the SecGen XML, the restricted lab-sheet bodies, the exploit section of `VM_INTEGRATION.md` or the engine's sight-challenge source.

## Checks run

- Route driver, all six routes (`node scripts/ink_runtime_check/m06_routes/route.js <file>`): **all expectations met** on r1–r6. Longest run without a choice: 13–16 lines, always in the debrief (r3 and r6: 16).
- Validator `--skip-ink --no-graph`: ERB, JSON, unknown fields, geometry, door alignment and schema all pass. 16 duplicate-pattern warnings, all on `agent_0x99_handler` (read; benign, see the end of the minors). 2 repeatable-cutscene warnings: the guard's lockpick catch and the minder's `on_sighted`, both deliberate. The credits notes on "ASSETS" and "PERSONNEL" are covered under "Debrief and credits agreement".
- `dialoguelint`: no findings.

## Confirmation of round-1 findings

I read or grepped each fix; the route driver backs the dynamic ones.

| # | Round-1 finding | Status | Evidence |
|---|---|---|---|
| A1 | Debrief fired before the sweep | **Fixed** | erb:1295-1312: the triggers set `ready_to_extract` and send the text (two safe variants), and they no longer open the debrief. Hub `extract_offer` → `extract_go` (phone.ink:145, 542-566) sets `start_debrief_cutscene`. Debrief mapping erb:1340-1347; reload backstop erb:1348-1356. Task `call_in_after_sweep` is optional and locked (erb:515-522). r1 and r4 exercise the decline, reload and re-emit paths. The debrief's own opener wasn't updated (R2-M1) |
| A2 | Music forgot the phase | **Fixed** | erb:91-146: three phase conditions, each with `game_loaded` and `all_hostiles_ko` twins. `restored` guard on the threat cue. `assets_decided` → `end`; the debrief cue → `end`; victory track "Digital Leashes" (registered in music-config.js:147, no other mission uses it). Browser check still owed |
| A3 | The cover never paid off | **Fixed, with fairness gaps** | `cover_strained` set at erb:858-863 and 1207-1236; text erb:1237-1243; Irina's threshold irina.ink:315; Satoshi's opener satoshi.ink:59-64; minder minder.ink:46-51; debrief :326-331; credits erb:208-209. See R2-M2, R2-m2 and R2-m3 |
| A4 | Choices landed in silence; Irina waited for police who never came | **Fixed** | erb:1244-1287 (texts for turned, detained, freeze, watch, safe, KOs; the `irina_taken` loop); hide at erb:1500-1510; relays phone.ink:159, 176, 178; debrief :231-235 |
| A5 | No antagonist, no sight challenge | **Fixed as wiring; the gate may not hold** | erb:1916-1975, minder.ink. From the config alone, nothing stops a challenged player walking through Satoshi's unlocked door during the 20 s cooldown (R2-M3). Needs a browser check |
| A6 | Flag 2 silent; flag 1/2 `emit_event` rewards | **Fixed** | erb:1000-1011 (flag 1 and 2 texts); rewards are `set_global` (erb:1625-1636); debrief one beat per flag (:350-355). VM wording is D3/D4 (needs checking against SecGen by the user) |
| A7 | "Under arrest" | **Fixed** | satoshi.ink:86 "I'm detaining you."; no SAFETYNET "under arrest" or "arrested" left in m06 ink (grepped). Remaining police lines describe the police, which fits m04/m05/m07 (m07 Mercer: "no arrest powers... the police take him") |
| m1 | Voiced `{player_name}` | **Fixed** | no `{player_name` in any m06 ink (grepped) |
| m2 | HaX avatar `npc_helper.png` | **Fixed** | no `npc_helper` in the erb |
| m3 | "Cells not yet paid go without" | **Fixed** | erb:182, satoshi.ink:351, phone.ink:432 |
| m4 | Irina KO credit "offer never made" | **Fixed** | erb:188 |
| m5 | Debrief silent on staff KOs | **Fixed** | debrief.ink:332-343. Guard credit precedence now disagrees with it (R2-m6) |
| m6 | "Afternoon" | **Fixed** | guard.ink "Evening." |
| m7 | Sent to an unstaffed reception | **Fixed** | guard.ink "Lobby's that way." / "Go back out to the lobby" |
| m8 | "Compliance auditor" | **Fixed** | no match in mission.json or erb |
| m9 | Five guide options, no lockpicking guide | **Fixed** | phone.ink:186-187, guide menu :575-590; lockpick guide item erb:810, offered on entering the checkpoint erb:1199-1204 |
| m10 | "How do I play Volkova?" retired after one use | **Fixed** | phone.ink:197 |
| m11 | Layout | **Deferred** to room dressing, rightly |
| m12 | Fingerprint kit unused | **Deferred** to puzzle chains, rightly |
| m13 | VM work in one generic line | **Fixed** with A6 |
| F1 | Irina's badge tag `cto_access_badge` vs item id `m06_cto_badge` | **Settled: works. Withdraw** | `NPCGameBridge.giveItem` matches the tag's selector against the item's `id`, `opens_lock`, `key_id` or `name` (public/break_escape/js/systems/npc-game-bridge.js:239-245), and `m06_cto_badge` has `opens_lock: "cto_access_badge"` (erb:1515). The pickup event carries `itemId: item.id` (npc-game-bridge.js:40-46), so the `m06_cto_badge` mapping (erb:880-884) fires. Optional tidy-up: change the tag to `#give_item:keycard:m06_cto_badge` (irina.ink:319), which matches the other two give tags (`executive_access_badge`, `m06_password_dictionary`), which name the item id |
| R-M4 | Recap repeated the door lines | **Fixed** | erb:984; phone.ink:280 |
| R-M5 | "Police" wording | **Withdrawal upheld** | consistent with m04, m05 (Torres: "The police picked Torres up") and m07 |
| R-M6 | Custody console attempts | **Doc fixed** | no `maxAttempts`; walkthrough updated |

## New findings

**Counts: 0 blockers, 3 majors, 12 minors.**

### Majors

| # | Finding | Where | Concrete fix |
|---|---|---|---|
| R2-M1 | **The debrief's opener still assumes HaX is calling the player in.** The call-in now runs: "I'm done here. Bring me in." → "Car's round the back of the building. Two minutes." → [On my way.] → "See you at HQ." Then the debrief opens with HaX saying "That's enough. Come in." / "I want to hear it in person." and the player's only choice is [On my way.] again. The player says the same line twice in a row, and HaX tells them to come in after she has already sent the car. This is the first beat of the ending on every route. m04's debrief opens with "Agent, report." for the same reason | debrief.ink:59-64; phone.ink:551-566 | Cut lines 59-64 and open on the location narration (`debrief_location`, :70). Or replace them with one line spoken at HQ, e.g. "Sit down. Coffee's terrible, and it's four in the morning." with a single [Start with the fund.] choice. This removes two spoken lines and adds at most one. Keep `#set_variable:debrief_played=true` at the top |
| R2-M2 | **The commonest way to strain the cover is the first sight challenge, and the player can't see that cost or undo it.** `guard_caught` strains the cover for good. The guard catch is the first watcher the player meets (regression run A was caught there). The guard then sends the player back to the lobby and, on the FCA story, waves them through ("You're on the list"). So the man who caught them is satisfied, yet the debrief, Satoshi and the minder all say somebody rang the FCA. Nothing at the catch hints at a phone call. HaX's text says "Someone on **that floor**" while the player is at the checkpoint and has never been on the floor. Irina's bad opener, by contrast, can be repaired in the same conversation (irina.ink:197, 288-289), so the two triggers aren't treated alike | erb:1207-1212; guard.ink:130-131; erb:1242 | Make the cost readable at the moment it happens. (1) The guard's catch line names the call: "...Go back out to the lobby and come in properly. And I'll be ringing whoever you say sent you." (2) Give the strain text a cause, using one onceOnly text per trigger in place of the single generic text: guard catch: "The guard saw your picks. He'll ring the FCA to check on you, and they've never heard of you."; staff KO: keep "Someone on that floor is going to ring the FCA…"; Irina: "Volkova didn't buy you. If she asks around, the FCA will say they've never heard of you." Whether the catch should be repairable is Decision R2-D1 |
| R2-M3 | **The minder may not gate anything.** Satoshi's office has no lock (erb:1994-2002). A sight challenge only opens a conversation, and m04's own comment says the 20 s cooldown "lets a player who closes the chat walk off before he calls again" (m04 erb:620-621). So a player with a strained cover who answers "Wrong floor. I'll go." or "(Back off down the corridor.)" can walk straight through the north door during the cooldown. Kemal's refusal, the hostile path and the recap's "Wait for his back, or bring Volkova's word" then cost nothing. The talk-past and the stand-off are written well; the problem is that refusing the player has no effect. This comes from config only (I didn't read the engine's sight-challenge source), so it **needs a browser check** first | erb:1916-1975, 1994-2002; minder.ink:52-55, 66-69 | Browser check first: get refused, then walk to the north door within 20 s. If that works, see Decision R2-D2. The recommended shape: lock Satoshi's door; Kemal holds the key in `itemsHeld`, so a KO drops it; the talk-past and Irina's word give `#unlock_door:satoshi_office`; slipping past becomes picking the door in his blind window, with a `lockpick_used_in_view` mapping like the guard's |

### Minors

| # | Finding | Where | Concrete fix |
|---|---|---|---|
| R2-m1 | Toasts stack when the cover strains. On an unrepaired bad opener, Irina's close sends texts at 4 s ("You've met Volkova…"), 6 s (the strain text) and 9 s (the lab pointer): two gaps of 2–3 s. A staff KO sends its KO text at 2.5 s and the strain text at 6 s. The validator's 4 s rule misses this because the strain text sits on a different pattern (`global_variable_changed:cover_strained`) | erb:870, 877, 1216-1236, 1242 | Move the strain text to `delay: 13000`, which clears the 9 s lab text and stays off the 13.5 s call-in, which can't coincide anyway. If R2-M2's per-cause texts are adopted, give each its own spacing |
| R2-m2 | Irina's strained refusal blames "someone on the floor" even when the strain came from her own unrepaired suspicion. Kemal's strained line nearly repeats Satoshi's ("Somebody on the trading floor rang the FCA an hour ago. They have never heard of you." / "Somebody on my floor rang the FCA an hour ago. They've never heard of you."), so the player hears it twice within a minute. "Trading floor" is also wrong when the guard was the cause | irina.ink:325-326; minder.ink:111; satoshi.ink:61 | Irina: `{irina_suspicious: You came in asking for my wallets before my paperwork. My badge stays on my neck. - else: (current line)}`. Kemal: "Mr Nakamoto's phone has been ringing about you. The FCA has never heard your name." Satoshi keeps "an hour ago" |
| R2-m3 | The cover-held debrief line contradicts Satoshi. On the held branch Satoshi says "Your paperwork was good. I had you checked anyway." He then knows the player is SAFETYNET, yet the debrief says "And the cover held. Nobody on that floor ever thought to ring the FCA." | debrief.ink:330; satoshi.ink:63 | "And the cover held on the floor. Only Satoshi thought to check, and by then you were at his desk." |
| R2-m4 | Kemal's "It does tonight, then." answers "The FCA does not come up here.", which only `on_sighted` says (:82). Spoken to first ("This floor is closed. Who let you up?"), the reply doesn't follow | minder.ink:39, 82, 92 | Make it conditional on how the scene opened. Set an ink-local `sighted_open` in `on_sighted`, then `{sighted_open: It does tonight, then. - else: The FCA. At this hour. Very well.}` |
| R2-m5 | The voice style makes Kemal "a true believer in the Crypto Anarchists' cause", but none of his 16 lines shows it. He reads as a professional guard ("The paperwork is always the same"). That's a good voice, but the belief that makes him an antagonist is missing | erb:1929; minder.ink | One line in `cover_blown` before "So. Who are you really?": "I gave thirty years to banks that stole politely. He at least says what he is." Or drop "true believer" from the style |
| R2-m6 | Guard credits and the debrief disagree when he is waved through and then knocked out. The credits print only "Waved you through on the FCA cover" (talking wins, pass 3 P8), while the debrief now says "The guard on the checkpoint was a contractor doing his job." / "None of them had done anything wrong", and the KO strained the cover | erb:182-183; debrief.ink:338-343 | Let the KO win: waved-through line `guard_waved_through && !guard_ko`; KO line `guard_ko`. Update the P8 comment |
| R2-m7 | Two minder credit gaps. (a) Talked past, then punched: both "Talked your way past him" and "Went for you; you got past him anyway" print. (b) Seen and turned back ("Wrong floor"), then slipped past: "Never saw you come up the corridor" prints, which is false. `minder_met` is ink-local, so the credits can't tell | erb:202-205; minder.ink:24 | (a) Passed line: add `&& !globalVars.minder_hostile`. (b) Sync a `minder_challenged` global (`#set_variable` in `on_sighted` and the `start` opener), add "KEMAL AYDIN (MINDER): Turned you back once; you got past him anyway" for `minder_challenged && !minder_passed && !minder_hostile && !minder_ko`, and add `&& !minder_challenged` to the "Never saw you" line |
| R2-m8 | A hostile minder the player got past without a KO goes unmentioned by Satoshi and the debrief; only the credits note it | satoshi.ink:65-70; debrief.ink:311-317 | Satoshi: `- minder_hostile: Kemal's still out there looking for you. Let's be quick.` Debrief: `{minder_hostile and not minder_ko: His minder came at you and you went round him. He's in custody now, and furious.}` |
| R2-m9 | Irina detained and then knocked out before the player leaves the floor: `irina_taken` never sets (its condition needs `!irina_ko`). The debrief says "The police collected her from her desk after you'd gone" while she is lying on the floor, and the detained path never mentions the KO (the recruited path does, :197-200) | erb:1284; debrief.ink:231-235 | In `irina_arrested_path`: `{irina_ko: She went down on the trading floor after you'd detained her. The police carried her out. That's in the report too. - irina_taken: … - else: …}` |
| R2-m10 | The recap's "He keeps a minder on that corridor." and the strained follow-up stay after he has let the player in, turned hostile or been knocked out (the condition checks only the badge and `not satoshi_confronted`) | phone.ink:319-325 | Wrap both in `{not minder_passed and not minder_ko and not minder_hostile:` |
| R2-m11 | Flag 1 and flag 2 texts can stack: 1.2 s and 1.5 s after each submission, and flags are often submitted back to back at the drop-site. The flag 2 text is new this round | erb:1004, 1011 | Flag 2 `delay: 5500`, or `skipIfGlobal` on a flag-2-arrived-within-5 s check if one exists; the delay is simpler |
| R2-m12 | Optional tidy-up (F1): the CTO badge give tag names `opens_lock`, while the other give tags name the item id. It works (see F1), but it's the only one that differs | irina.ink:319 | `#give_item:keycard:m06_cto_badge` |

Not findings:
- Validator duplicates: I read the 16 warnings. They come from the old per-room backstops plus the new `irina_taken`, call-in and cover/KO mappings sharing `room_entered:*`, `npc_ko:irina_volkova` and `global_variable_changed:assets_decided`. Their conditions are latched (`ready_to_extract`, `irina_taken`, `start_debrief_cutscene`) or firing together is harmless.
- The debrief's longest runs (13–16 lines) are already open for the dialogue phase.

## Review of the new work

**Cover strain: fair in weight, uneven in readability.** The weight is right. It costs time and options (a badge loan at 35 trust instead of 25; the minder wants Irina's word), changes Satoshi's opener, one debrief beat and one credit, and never locks the player out or fails the mission. The KO triggers read clearly: HaX's KO text lands first, then the warning. Irina's trigger is signposted in the scene ("Supervisors start with paperwork", the "Unless you are looking for something that isn't on a checklist" line) and can be repaired from the hub. The guard catch is the weak trigger (R2-M2). The recap repeats the warning after a reload (phone.ink:263-265), and it tells a strained player exactly how to get past the minder (:322-324), which is good.

**Kemal Aydin.** A strong, distinct voice: courteous, dry, immovable. "She has never once lied to me, so." and "Do not thank me. I only open the door." are the best lines in the new work. The talk-past options fit each state: the FCA line while the cover holds; Irina's word only when she's turned and conscious; and with the cover strained, the FCA line deliberately fails and leads into the stand-off. The re-entry structure follows the guard's (every exit diverts to a stitch of `start`). The hostile path is short and clean ("I hoped you would say that.", then `#hostile`, with `minder_hostile` from the state-change mapping); his attack damage of 6 is gentler than Dani's 10. Open points: the gate itself (R2-M3), two opener and continuity lines (R2-m4, R2-m2), and his belief (R2-m5). The stand-in sprite and the C1 cast proposal are fine for now.

**Irina collected.** It works as designed. The room-entry loop (erb:1280-1288) leaves out the trading floor, so she never vanishes in view; the hide and its reload re-hide are erb:1500-1510; HaX's arrest text tells the player what will happen; the relays cover all three items she held (phone.ink:159, 176, 178); and the debrief's two variants track whether she was taken. The only gap is the detain-then-KO edge (R2-m9). The hide on reload still needs the browser check the log already lists.

**The call-in ending.** The mechanism matches m04: a latched `ready_to_extract`, a text with a variant that names the safe, a hub choice at the top of the menu, a confirm step, a reload backstop, an optional locked task and the gate unchanged. `extract_offer` warns that "Whatever you haven't read stays for forensics" and names the shut safe, which is the right last nudge. The weak point is the hand-off into the debrief (R2-M1).

**Music phases.** These are correct as written: the three ERB phase conditions can't overlap once the briefing has played; every phase has `game_loaded` and `all_hostiles_ko` twins; the threat cue ignores restored hostiles and goes quiet after the money is settled; the fund cue can't fire after settlement; the sweep and debrief play `end`; and the credits play a track of their own. The minder is reachable only after the fund (his wing needs the executive badge), so his fight always returns to `spy-action`. They still need the browser check already listed. No findings.

## Debrief and credits agreement

I traced each state through `m06_closing_debrief.ink` and the credits (erb:166-216). "Agree" means both say the same thing and neither prints a heading over nothing.

| State | Debrief | Credits | Agree? |
|---|---|---|---|
| Cover held | "And the cover held…" (:330) | "FCA COVER: held all night" | Yes, but contradicts Satoshi's line (R2-m3) |
| Cover strained | two lines (:327-328) | "strained — somebody on the floor rang the FCA" | Yes |
| Minder talked past (FCA or Irina) | "His minder let you walk in…" (:315) | "Talked your way past him" | Yes |
| Minder knocked out | "His minder's in custody too…" (:312) | "Knocked out outside his boss's door" | Yes |
| Minder hostile, not KO'd | silent | "Went for you; you got past him anyway" | Partial (R2-m8) |
| Minder talked past, then punched | "let you walk in" | two lines | **No** (R2-m7a) |
| Minder seen and refused, then slipped past | silent | "Never saw you come up the corridor" | **No**, credit false (R2-m7b) |
| Minder never seen | silent | "Never saw you…" | Yes |
| Irina turned | recruited path | "Turned" | Yes |
| Irina turned, then KO'd | recruited path plus the KO line (:197-200) | "Turned" | Yes (fate wins, by design) |
| Irina detained, collected in the sweep | "…while you were still working the building" | "Detained — collected by the police" | Yes |
| Irina detained last | "…after you'd gone" | same | Yes |
| Irina detained, then KO'd | "from her desk after you'd gone", no KO | "Detained…" | **No** (R2-m9) |
| Irina KO'd before her part was settled | KO path | "Knocked down… before her part was settled" | Yes |
| Freeze | `operation_disrupted` and `satoshi_aftermath` freeze lines | "FROZEN" | Yes |
| Watch | watch lines | "WATCHED" | Yes. ASSETS always has a line: `assets_decided` is needed for the call-in, and both phone and ink set exactly one |
| Safe opened | `identity_found` → Tesseract | "87% probability — Dr. Adrian Tesseract" | Yes |
| Safe left shut | "You left Satoshi's safe shut…" | "Unknown — safe contents never recovered" | Yes |
| Satoshi KO'd | "still out cold…" | "Knocked out in his own office" | Yes |
| Guard waved through, then KO'd | KO line and "None of them…" | "Waved you through" only | **No** (R2-m6) |
| Dani or Priya KO'd | own lines (:333-337) | own KO lines | Yes |

The validator's ASSETS and PERSONNEL notes don't apply: ASSETS is covered above, and PERSONNEL always prints Satoshi's line (the two lines are complementary on `satoshi_ko`).

## Routes

All six pass. Suggested additions, each covering a gap above:

- **r7 minder passed then punched**: talk past, then a `ko`-less hostile step. Expect a single minder credit (R2-m7a).
- **r8 refused then slipped past**: cover strained, `on_sighted`, "Wrong floor", then enter `satoshi_office`. Expect no "Never saw you" (R2-m7b). Once R2-M3 is settled, assert whichever gate is chosen.
- **r9 detained then KO'd on the floor**: detain Irina, `ko irina_volkova` without changing room, then call in. Expect no "from her desk" (R2-m9).
- **r10 guard waved through then KO'd**: expect the KO credit and the debrief line to match (R2-m6).
- **r11 strain from Irina's own opener, then ask for the badge at trust 25–34**: expect her own-suspicion line (R2-m2).
- **r12 minder hostile, slipped past, not KO'd**: Satoshi's and the debrief's minder lines (R2-m8); the recap no longer mentions the minder (R2-m10).
- **r13 call-in declined, page reload before asking again**: `ready_to_extract` survives, the hub still offers "Bring me in", and the recap's "That's everything" line shows. Then the debrief opener (R2-M1) plays once.

## Canon (m05 → m06 → m07)

- **m05 → m06:** this still holds. m05's debrief ends "Next, we follow the money." (m05_closing_debrief.ink:665; the working tree has uncommitted m05 edits, and the line is present in both). m06 has TalentStack's $847,000 in Priya's write-up and HaX's lab beat (phone.ink, `on_blockchain_discovered`).
- **m06 → m07:** this still holds. m07's briefing: "Three days ago you followed one fund paying six cells on one seventy-two-hour clock. Four of them are on that map." (m07_opening_briefing.ink:25). That fits freeze ("The clock ran down on an empty wallet"; the advances were paid) and watch alike. The Tesseract thread works with or without m06 (m07_phone_agent_0x99.ink:465-466). D2 (m07 reflecting freeze or watch) stays with the user.
- **Detain and hand over:** m06 now matches m05 ("The police picked Torres up the next morning") and m07 (Mercer: "no arrest powers… the police take him"; "Detained — signed casualty projection in evidence").
- **Kemal Aydin:** a new name with no clash anywhere in `scenarios/` or `story_design/` (grepped). He's a Crypto Anarchists operative, as Satoshi is, so no new faction is introduced.
- **Stakes:** the fund document's 350–600 projected casualties and HaX's "Some of them were already paid" fit the escalated bible. No change from round 1.

## Rubric (mission-alignment-plan, ten rows), state after round 1

| # | Dimension | State |
|---|---|---|
| 1 | Canon and stakes | Met |
| 2 | Aims and staging | Met; call-in task optional and locked; gate unchanged |
| 3 | HaX hub | Met (sweep call-in, folded guide menu, relays on `irina_taken`); R2-m10 |
| 4 | Ink craft | Good; R2-M1, R2-m2–m5 |
| 5 | Moral choices and consequences | Met: every choice answered in the moment and in the debrief; four credit and debrief mismatches (R2-m6–m9) |
| 6 | Music | Met (browser check owed) |
| 7 | Rooms and layout | m11 deferred to dressing |
| 8 | Mechanics, flags, guides | Met; VM wording needs checking against SecGen by the user (D3/D4) |
| 9 | KO resilience | Met (relays for every Irina item; Satoshi KO decides by phone; minder KO has a credit and a text) |
| 10 | Bookends | The mechanism is met; the debrief opener isn't (R2-M1) |

## Needs checking against SecGen by the user

Unchanged from round 1 (D3, D4): HaX's flag 1 and flag 2 texts (erb:1004, 1011, including "One password, two boxes, just as their own rack sheet admitted"), the debrief's per-flag lines (debrief.ink:351-353), the recap's backend lines (phone.ink:287-296), and the rack-sheet account mapping. I made no VM claims of my own.

## Decisions for the user

Both are mission-local and reversible, so under `AGENTS.md` the orchestrator could settle them. They're listed here because each changes how a challenge plays.

**R2-D1. Should being caught by the guard strain the cover, and can it be repaired?**
- (a) **Keep it permanent and make it readable** (R2-M2 fix: the guard says he'll ring, and HaX names the cause). *Recommended.* It keeps the first sight challenge meaningful, the cost is moderate, and the player now sees it coming.
- (b) Repairable: being waved through on the FCA story after a catch clears it, as repairing Irina's opener does. This is kinder to first-timers, but the catch then costs only the walk back.
- (c) Only a second catch strains it. Forgiving, but harder to explain in the fiction.

**R2-D2. How should the minder actually stop the player?** (after the browser check in R2-M3)
- (a) **Lock Satoshi's door.** Kemal carries the key (a KO drops it); the talk-past and Irina's word unlock it with `#unlock_door:satoshi_office`; slipping past becomes picking the door while his back is turned, with a `lockpick_used_in_view` catch like the guard's. *Recommended.* Refusals then mean something, and every route stays open. The cost is that it echoes the checkpoint mechanic, though here the watcher patrols.
- (b) Keep the soft gate, but when the player enters the office after a refusal, Kemal follows and turns hostile. This needs a mapping that can set hostility, which the config doesn't show and which I didn't check in the engine.
- (c) Accept it as flavour, and soften the recap's "Wait for his back" advice to match.

Still with the user from round 1: D2 (m07 carry-over), D3/D4 (SecGen), C1 (Kemal's look).

## Verdict

The round-1 majors are all closed and F1 is withdrawn. Another round is needed for R2-M1 (a one-knot writing fix) and R2-M2 (two lines plus per-cause texts), and R2-M3 needs a browser check and then a decision. The minors are small ink and credit-condition edits. Suggested routes r7–r13 would lock in the fixes.
