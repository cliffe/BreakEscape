# m06 "Follow the Money": blind playtest A ("do your best")

Run type: blind, persona "do your best", solvability question for the non-VM half. Game id 2593, keyless server :3001, headless, one mid-conversation page reload.
Session log: `tools/playtest/m06_follow_the_money-session-2593.jsonl` (1921 commands). Flags XML: `tools/playtest/m06_follow_the_money-flags-game2593.xml`. Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d5a9522a-d714-4f83-a327-405305dc7311/scratchpad/m06-blind/` (s01 to s19).
Wall clock about 20 minutes. Read only what the brief allowed; no ink, scenario JSON, SecGen XML or field guides. Persona B (struggling) not run.

## What was and wasn't earned

| Item | Earned in game? | How |
| --- | --- | --- |
| Server-room passphrase `bitcoin2025` | yes | IT checklist (convention) + Irina's wordlist + the 2025 revision date. First guess, first try |
| Flags 1 to 4 | **no, flag supplied** | `<flag:N>` submitted at the financial drop. The VM terminal was opened (placeholder IP, no VM), nothing done on it. All four rewards (Door Controller Export, Cold Storage Recovery Keys) arrived on submit |
| Data-centre PIN `3110` | yes | Door Controller Export line DC-02 plus its "31/10" note |
| Slot 4471 | yes | Worked out from Priya's write-up, the pool config (1.5% cut, 6 h hold) and the settlement log. Typed once, correct |
| Executive safe `2140` | yes | Priya margin note (last coin around 2140) and the Architect email P.S. ("year the last bitcoin is mined") |
| Signing case | yes (assisted harness) | Thumbprint dusted off the framed clipping, matched to Satoshi, presented at the reader. Dusting driven with synthetic pointer events through a DOM click on the visible canvas, after pressing the visible Hint button. Marked "assisted" |
| Irina's badge, executive badge | yes | Conversation choices |
| `completeLockpick` | not needed | Never opened a lockpick lock |

Everything downstream of flags 1 to 4 was exercised but the VM half (crack, distcc, privesc) is unproven by this run. The rewards that the flags unlock were all the player needed afterwards, so the surface logic past the station works.

## Timeline (what I thought the goal was)

1. 0:00 Briefing played automatically. Goal: pose as FCA, meet Dr Volkova on the trading floor (HUD: "Establish Cover"). Read the brochure in the lobby.
2. 1:30 Checkpoint. Read the IT starter checklist on the noticeboard before the guard (convention: crypto term + year; "the obvious one"). Talked to the guard, bluffed FCA, waved through.
3. 3:00 Trading floor. Irina: polite opening, asked about door access, password testing, the post-quantum screen. She gave me her audit wordlist, then I asked to borrow her badge (it was handed over with "bring it back"). Goal shifted to "find the money trail and get into the server room".
4. 6:00 Dani (trader) told me about Monero spikes and pointed at the daily report, which names the ENTROPY wallets. Read it. Used Irina's badge to enter her office; read the Architect email (funding, $500k, P.S. about the CEO's safe) and her research notes ("What have I become?").
5. 8:00 Blockchain lab. Priya's write-up and margin notes: three ENTROPY wallets into the mixer, the money lost in the middle, "our settlement log can see it, on the transaction server in the data centre", match by amount less fee after the minimum hold.
6. 10:00 Server room: typed `bitcoin2025`, accepted first try. Rack inventory sheet (two accounts share a password, the financial DB account drives the doors). Opened the VM launcher (no VM here), then submitted the four seeded flags ("flag supplied"). Door Controller Export and recovery keys arrived. Goal: reach the data centre, find which cold slot is the fund.
7. 12:00 Data centre via PIN 3110. Cold storage procedure note, then the three files on the transaction server. Computed slot 4471 (three credits matching deposit less 1.5% and after 6 h: 2,364,000 / 1,182,000 / 669,800; decoys at 3815 and 2207 landed too early). Console took 4471 once; the fund allocation document confirmed it.
8. 14:00 Executive wing door was RFID. Needed an executive badge. Phone from HaX said the spare was signed out to Volkova. Went back to Irina; the option "Satoshi's wing. You've a badge for it." appeared only after I had read the fund page. She handed it over.
9. 16:00 Executive wing. Kemal Aydin (minder) challenged me. **Reloaded the page here, mid-conversation.** See finding R1. Walked back, bluffed "FCA compliance file has my name on it", he opened the door.
10. 17:00 Press clipping dusting, then signing case, then executive safe (Architect identity file: Tesseract), manifesto.
11. 19:00 Confronted Satoshi. Chose: "You're paying for people to die" then "You worked out how many would die", "Privacy has honest uses", asked "Why are you telling me this?", then froze the fund. He was detained.
12. 21:00 Back to Priya (no new line about what she'd been drawing), then Irina. Showed Priya's write-up and the fund allocation without naming Priya; chose "You're in this to your neck. The honest way out is helping us end it." She agreed to help.
13. 22:00 Phone call to HaX, "I'm done here. Bring me in", debrief at SAFETYNET HQ, three-finding quiz, credits.

## "Didn't know what to do" moments

| Where | How long | Tried | What unstuck me |
| --- | --- | --- | --- |
| Executive wing door (RFID, empty "Saved" list on the cloner) | about 2 min | Opened the cloner menu, read Saved (empty) | Phone message from HaX ("spare executive badge was signed out to Volkova"), found by opening the phone. Without reading the phone log there is no in-world pointer; the task list had `take_executive_badge` but no hint who has it. Irina's "Satoshi's wing" option is hidden until the fund page is read |
| Dusting minigame, step 1 (find the print) | about 3 min | Clicking the bright diagonal streak | The Hint button appeared after a short wait. The streak is a reflection, not the print. The step text ("move the light low ... streaky sheen") did not help me |
| Custody console PIN | none, but note below | Nothing | The keypad does not say it allows one attempt. I typed the slot once, correctly |

No other stalls. After the flags, the chain was clear.

## Decisions

| Decision | Arguable or obvious? | Showed later? |
| --- | --- | --- |
| Open with the polite line to Irina | Arguable (option 3 flatters with her citation count, option 2 is brusque) | Debrief does not mention it. Irina warmed to me; the badge loan followed |
| Borrow her badge openly (vs cloner covertly) | Obvious. The covert option is labelled "(Let the cloner read her badge while she talks.)", and the open ask costs nothing | Yes. HaX in the debrief: "she lent you her office badge. People don't do that for a regulator they've just met." Good |
| Read Irina's office after borrowing her badge | Felt arguable (I was snooping on the person who trusted me) | Debrief: "Reading her notes first was good work." Rewards it, no downside shown |
| Bluff Kemal (FCA compliance file) vs "Wrong floor, I'll go" | Obvious: the second option clearly ends the route | Debrief asks what I said to him. A line, nothing mechanical |
| Freeze vs watch the $12.8M | Arguable. Satoshi lays out both costs well, and HaX had said "freeze it, or watch it". Both outcomes were laid out as costing something | Yes: Satoshi's "state I've been warning about" and HaX: "The freeze doesn't stop the cells that were already paid. And ENTROPY knows we were inside their bank." Good, honest cost |
| Irina: "in this to your neck" vs mercy vs arrest | Felt arguable. She was complicit (CTO override on every flagged deposit, $500k), but sympathetic | Yes: debrief "You turned her" and the condition she set ("gets used, not buried"). The "I gave you my word" promise is not tested afterwards |
| Show Irina the write-up without naming Priya ("Never mind where") | Subtle; I took it as protecting a source | **No consequence shown.** HaX says "Raghavan will want to know what she was drawing... I'd rather it was you", but the game gave me no way to tell her, so the thread is left hanging |
| "Sometimes. But I chose my side." to Satoshi | Arguable | Yes: HaX "He told the arresting officer you'd admitted to wondering. I've left that out of the file." Excellent |

## What I learned, in my own words

- Door passphrases built from a company's habits (term plus year) can be guessed without cracking anything, and a staff audit wordlist is the same list an attacker would use.
- Bitcoin is traceable at the edges; Monero is opaque in the middle. A mixer is not a wall: amounts less the pool's fee, arriving no sooner than the minimum hold, let you match the output back to the input. The same slot appearing three times is the wallet.
- Shared passwords, one database account driving the door controllers, and one account holding all recovery keys turn a single foothold into the whole estate.
- Money laundering detection is partly human: the analyst could see the pattern, the CTO controlled what got reported, the CEO turned reporting off.
- A lifted fingerprint can open a reader (the Chaos Computer Club example shown in the reader).
- Each of the three FCA findings in the debrief quiz is one I had actually met.

## Five best lines

1. HaX: "He told the arresting officer you'd admitted to wondering. I've left that out of the file."
2. Priya: "That's starting to sound like an excuse." (about "it's Irina's call, I'm just the analyst")
3. IT checklist: "IT has been asked four times to stop doing this. IT has declined."
4. Satoshi: "Freeze it, and I'm a martyr. Recruitment doubles. Watch it, and you spend a year on surveillance while we move house."
5. Irina: "Satoshi is paranoid about doors and careless about passwords. Exactly backwards."

## Five worst lines

1. Satoshi, freeze branch: "The names on that page over whoever my martyrdom recruits." There is no page in that branch; reads like leftover from the "watch it" list option and I could not parse it.
2. Dani: "Safe. Er, I mean, no problem." Cute once, a wink at the player.
3. Irina: "Reasonable request for a supervisor. Here." Flat for the line that hands over a key item.
4. HaX (debrief): "Greed I could bargain with. These people believe it." Good idea but the line right after ("The freeze doesn't stop the cells that were already paid.") lands as a non sequitur.
5. Narrator (confrontation): "You tell him he's coming with you. The police are on their way up." Narrates the arrest in two lines after the long argument; the payoff is thin.

## Lighting and conversation backgrounds

| Scene | Background / lighting | Match? |
| --- | --- | --- |
| Irina (trading floor) | Wall of monitors, copier, glass fridge, cool blue | Yes, matches the floor. Night-shift mood fits |
| Satoshi (his office) | Desk, bar cart, framed whitepaper, warm wood | Yes. Matches the room |
| Kemal (executive wing) | Framed press clipping, display cabinet of trophies, sconce | Yes |
| HaX debrief (SAFETYNET HQ) | Lamp, desk, window with strong light through blinds | Mostly. The line says "four in the morning" but the window reads bright and streaky, closer to daylight than night. Minor |
| Rooms in the overworld | Trading floor and offices evenly lit, a green sight cone from a camera/guard overlaps the floor and the exec wing | Fine. No dark rooms or flicker seen; I did not look for them specifically |
| Mission HUD | The Objectives panel overlaps the top-left of the satoshi_office room (s15) | Cosmetic |

## Scores (1 to 5)

| Fun | Pacing | Clarity of goals | Openness of decisions | Teaching |
| --- | --- | --- | --- | --- |
| 4 | 4 | 4 | 3 | 4 (VM half untested) |

Reasons: the money-trail deduction (match amount, fee, hold) was the best moment and felt earned. Pacing sags slightly between the flag drop and the data centre because the flags are the only gate. Goals stayed clear because the HUD names the next step each time. Decisions had good consequences in the debrief, but several are obvious (borrow vs clone, bluff vs leave) and the Priya promise is unresolved. Teaching was strong where I could judge it.

## Findings

| # | Severity | Finding | Repro (log) |
| --- | --- | --- | --- |
| R1 | major | After a page reload mid-conversation (executive wing, Kemal) and `bootstrap resume:"resume"`, the player is back in `reception_lobby` at the start position, with the whole inventory and unlocked rooms intact. The `verify-run.rb` output also records `current room "reception_lobby"` at the end of the run. The Kemal conversation restarts ("I told you once") so nothing breaks, but the player has to walk 5 rooms back. Suspect engine or save logic, not harness; evidence: the brief after bootstrap showed room `reception_lobby`, player (160,144), while 9 rooms were unlocked. Not a blocker, since everything else was still reachable | game 2593, the `eval` location.reload command followed by `bootstrap resume:"resume"` (line numbers not recorded; search the session log for "reloading") |
| R2 | major | `take_executive_badge` has no in-world pointer except Agent HaX's phone message ("signed out to Volkova") and an Irina dialogue option that only appears after reading the fund page. A player who never opens the phone will not know who holds the badge. The cloner "Saved" list is empty with no hint | game 2593, executive wing door `interact`, RFID menu |
| R3 | minor | Priya asks to be told "whether I've been helping criminals" and HaX says "I'd rather it was you", but after the confrontation she only offers the generic mixer hint and I could not tell her. A promise the game makes and does not let you keep | blockchain_lab, second visit after Satoshi |
| R4 | minor | "Bring it back" (Irina's badge) is never followed up. HaX praises the loan, the player keeps the badge and nothing returns it | irina_office, then debrief |
| R5 | minor | Custody console allows one attempt and the keypad does not say so (the intro text is only visible after a correct code). I did not test the wrong-code consequence | data_center, `cold_storage_console` |
| R6 | minor | Satoshi's "The names on that page over whoever my martyrdom recruits" (freeze branch) has no referent | satoshi_office, after choosing "I'll take the martyr" |
| R7 | minor | Credits screen is the generic "audio intel" threat map; nothing in it reflects freeze vs watch, Irina's fate or Priya. The debrief carries all the consequences | end of run |
| R8 | minor | HaX's phone portrait looks like a man in a fedora and trench coat; the debrief portrait is a woman in a fedora and trench coat | phone screenshot s17 vs s18 |
| R9 | minor | The debrief window reads like daylight against "four in the morning" | s18 |
| R10 | minor | Dusting step 1 text points at a "streaky sheen" but the obvious bright streak is a reflection; nothing marks the print until Hint appears | executive wing press clipping |
| R11 | minor | `custody_index.csv` says slot 4471 was opened 2025-11 but the settlement log shows credits to it on 15 Jul. Both are undated by year, so this only conflicts if the log is 2025 | transaction server files |
| H1 | harness note | `lock` returns `ok:false` when the lock opens a container (custody console, executive safe), though the door/PIN worked. `clickCanvas` hits the wrong canvas for the dusting minigame; used a DOM pointer event on `.dusting-canvas` instead. `room` lists NPCs from later in the mission (closing_debrief_person) as `visible:false`, and the dusting `getState` includes a `debug` block; I did not use either | n/a |

Counts: 0 blockers, 2 majors, 9 minors (plus 1 harness note).

## Top three issues

1. R1: reload puts the player back in the starting lobby.
2. R2: no in-world pointer to who holds the executive badge.
3. R3/R4: promises the game makes (tell Priya, return Irina's badge) are never resolved.

## `verify-run.rb` output

```
game            2593  (mission 50)
created         2026-10-16 19:24:40 UTC
last write      2026-10-16 19:44:38 UTC
played for      1199s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, security_checkpoint, trading_floor, irina_office, blockchain_lab, server_room, data_center, executive_wing, satoshi_office
unlocked objs   4: transaction_server, cold_storage_console, executive_safe, satoshi_signing_case
inventory       26: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, HashChain Exchange Brochure, IT New Starter Checklist, Password Dictionary List, CTO Access Badge, Daily Trading Report, Email: From The Architect, Cryptography Research Notes, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Rack Inventory Sheet, Door Controller Export, Cold Storage Recovery Keys, Cold Storage Procedure, mixer_pool_config.yml, custody_index.csv, mixer_settlements.log, The Architect's Fund Allocation, Executive Access Badge, The Architect's Identity File, Release Signing Record, Crypto Anarchist Manifesto
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_973f13}, ..._2_66cdde, ..._3_5221ef, ..._4_01bd7b
globals set     55: (includes satoshi_confronted, assets_decided, assets_seized, irina_fate_decided, irina_recruited, signing_record_found, architect_identity_found, debrief_played, start_debrief_cutscene)

VERDICT: progress recorded — 8 rooms beyond the first, 4 objects unlocked, 4 flags submitted.
```
