# m05 "Insider Trading", pass 5: browser check of the struggling-run-A fixes

Answers: (1) plumbing for the changed behaviour, and (2) unexpected behaviour (wrong accusations, a lost fight with KO and Restart, "Send Security", two page reloads). Not a solvability run. Source of the checklist: "Phase 8 playtests: struggling run A fixes" in `IMPROVEMENT_LOOP_LOG.md` (commit c72b4b08) and the lighting follow-up (commit 665cda57). I did not open the SecGen XML or the four exploit guides, and I used keyless :3001 only.

Result in one line: items 1, 3, 4, 5 and 6 pass; item 2 passes except that **Torres's health bar stays on screen after "Send Security"**, including after a reload and on vault entry (N1, major). 0 blockers, 1 major, 1 major (suspect), 2 minors.

## Runs

| Game | Session log | Flags XML | Purpose | Commands |
|---|---|---|---|---|
| 2422 | `tools/playtest/m05-pass5-struggA-fixcheck-g2422.jsonl` | `tools/playtest/m05_insider_trading-flags-game2422.xml` | Whole route: lighting, wrong accusations, case menus, hostile Torres standing still to a KO, Restart, "Send Security", reload, debrief, credits | 2437 |
| 2424 | `tools/playtest/m05-pass5-struggA-fixcheck-g2424.jsonl` | `tools/playtest/m05_insider_trading-flags-game2424.xml` | Same route to the vault, then the fight won with fists | 1619 |

Headless (load average about 12). Speed `fast`. Both sessions stopped with `session-stop.sh`. Screenshots are in the scratchpad folder `m05-fixcheck/` (`shot_hostile_before_call.png`, `shot_after_callin.png`, `shot_after_reload_vault.png`, `shot_ko.png`, `shot_serverroom_lit.png`, `shot_vault_lit_prenaming.png`, `shot_patricia_prenaming.png`). Two small readers of engine state were used for measurement only (`window.playerHealth.getHP()`, `window.npcHostileSystem.getState('david_torres')`, `window.lightingSystem.rooms`, `window.npcHealthBars`); every action was a real command or key press.

## verify-run.rb (game 2422, full)

```
game            2422  (mission 49)
created         2026-10-14 00:47:26 UTC
last write      2026-10-14 01:12:00 UTC
played for      1474s of wall clock
current room    "reception_lobby"
unlocked rooms  10: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, break_room, server_hallway, server_room, torres_office, data_center
unlocked objs   2: torres_briefcase, data_center_pc_0
inventory       22: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Building Directory, Visitor Badge, Security Incident Log, Noticeboard Flyer, Server Hallway Badge Log, Conference Lanyard, TalentStack Leaflet, IT Notice: Server Room Access, Vetting Aftercare File: D. Torres, Vetting Aftercare File: R. Halloran, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Medical Bills, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope
NPCs met        12: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, lisa_park, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_2e03da}, ..._2_0a4d30}, ..._3_39b414}, ..._4_abbf3d}
globals set     54: (includes debrief_played, mission_complete, final_choice, torres_called_in, torres_arrested, torres_fight_offered, torres_hostile, torres_identified, torres_reason_guessed, found_*, flag1..4_submitted)

VERDICT: progress recorded — 9 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

Game 2424 (the fist fight): 846 s, 10 rooms unlocked, 4 flags submitted, same VERDICT line; Torres KO'd by hand, no fate chosen, so no debrief.

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Server hallway reader | cloned Owen's staff badge (EM4100 28 CC 48 EF 47) | Owen, "Lean over his log screen" then the cloner; HaX text points at Owen's lanyard | yes |
| Server room password | `quantum2024` | Owen, after Patricia's "On my authority" sign-off (asked in that order) | yes |
| Torres's office | IT Spare Office Card | Owen, "I need into David Torres' office" | yes |
| Vault reader | the lifted thumbprint | mug in Torres's office, dusted and lifted by buttons and drags | yes |
| Briefcase, Patricia's cabinet | lock picks | `completeLockpick` | **assisted** (cabinet not opened in either game) |
| Flags 1 to 4 | `<flag:1>` to `<flag:4>` | VM, supplied by the harness | **no. Exercised, not earned.** The VM was never launched. The field guides were not taken (the guide menu is a second pick after "Send me a field guide"; my first clicks missed it) |

Everything from the flag station to the vault was exercised on supplied flags. Flag 3 is what sets `torres_suspected`, so the "Find a motive" tick, Owen's office line and the case menus all came after a supplied flag.

## Item results

| # | Item | Result |
|---|---|---|
| 1 | Torres hostile: both HaX texts, fight winnable by hand, `game_loaded` text after KO and Restart | **PASS** |
| 2 | "Send Security": Torres hidden, no leftover bar or tint, hidden after reload and on vault entry, debrief and credits | **PARTIAL: hidden and harmless, but his health bar stays (N1)** |
| 3 | Wrong accusations at Patricia: trust toast, chat ends, FALSE START credit, debrief line | **PASS** (in person; phone and HaX variants not driven) |
| 4 | Stating the case: why and proof menus, a wrong answer costs trust, right ones complete | **PASS** (in person; phone and HaX variants not driven) |
| 5 | Neutral objective titles until named | **PASS** |
| 6 | Lighting follow-up (665cda57) | **PASS** |

### 1. Torres hostile (games 2422 and 2424)

- Turn: after "Drop the philosophy. Step away, or I make you." the narrator says "He shoves the chair back and comes at you.", a toast "david_torres is now hostile!" shows, then two HaX barks. Quoted from the page: "He's coming for you. Q switches to fists (again for a harder punch), then E or click when he's in front." and "Keep pressing Q until the open hand shows to walk by clicking. Can't take him? Call me and I'll send Security." Both are in the phone thread at 2:03 (log 2422, around the `Drop the philosophy` choose).
- Numbers: `attackDamage` reads 3, `maxHP` 100, cooldown 2000 ms. Standing still in the vault (game 2422) the hits landed at 1.5, 3.9, 6.4, 7.6, 10.1, 12.4, 13.6, 15.9 s: eight hits of 3 in 16 s. 100 HP lasted about 92 s to the "KNOCKED OUT" overlay (`shot_ko.png`), which offers Restart and Main Menu.
- By hand (game 2424): Q once (mode `jab`, HUD fist), then closing in, facing and pressing E, 12 presses. Torres 100 to 0 in 11.3 s (80 at 4.6 s, 50 at 8.5 s). Player HP 100 to 88: four hits, 12 HP, three of them before the first jab (during the dialogue to fight transition and the approach), one during the exchange. Winnable, with the caveat that the key presses were position-aware (I read both positions to aim), so a human's hit rate will be lower.
- Restart: reloads to `reception_lobby`, Torres still hostile (global `torres_hostile` true, `torres_fight_offered` true). The `game_loaded` text arrived at 2:05, after the 2:03 pair: "Torres is still at that terminal, still angry. Q switches to fists, then E or click when he's in front. Or call me and I'll send Security." The turn pair did not repeat on the restored hostility. After Restart the hostile state reads `attackDamage` 10 until the data-centre room loads, then 3 (read 10 at reception, 3 on entering the vault). No gameplay effect.
- HaX "Where do I stand?" while hostile: "Torres is swinging at anyone near that terminal. Q switches to fists, then E or click when he's in front." / "Or tell me to send Security. It'll cost us any chance of talking to him." The hub shows "I can't take him. Send Security." first.

### 2. "I can't take him. Send Security." (game 2422, after the Restart)

- Torres in the vault, hostile, at about 67 px. First attempt: the phone was open and the click returned `no-active-minigame` (see N3). Second attempt: `torres_called_in` true, `final_choice` "arrest", `torres_ko` false.
- Hidden: sprite `visible:false`, `alpha:0`, `bodyEnabled:false`. No further hits (player HP 31, unchanged over 3 s of observation). Not tinted (`isTinted:false`; he was not tinted while hostile either).
- Stays hidden after reload plus vault entry (resume overlay needed a DOM click on "Resume", as in the skill's gotcha list): sprite `visible:false`, body disabled, no attack in 5 s, `attackDamage` read 3.
- **Leftover bar (N1):** `window.npcHealthBars.healthBars.get('david_torres')` after the call: `barVisible:true, bgVisible:true, barW:60`, at Torres's last position (573, -467) while `spriteVisible:false`. After the reload and vault entry it is back at (480, -487). Screenshots `shot_after_callin.png` and `shot_after_reload_vault.png` show a solid red bar floating by the terminal with nobody under it.
- Debrief (game 2422, called in, wrong name earlier): "You said fast and direct. Fast, and the file still holds."; "The final upload stopped at ninety-nine per cent, when the data-centre breaker went. The rotation windows were in the last of it, and they never went."; "One per cent from the whole lot. Without it, what they have is a very expensive paperweight."; "How close was it?" gives "One per cent. The breaker did what you couldn't."; the called-in path "You backed off and I called it in. Patricia's guards walked him out, and she handed him to the police." / "He hasn't said a word since. Nobody talked to him with the upload dead, so there was never a deal to offer." / "Elena's treatment is unfunded. Sofia and Miguel have a father on remand."; after "I couldn't win that fight.": "Then backing off was right. It cost us him, and I'd still rather have you back."
- Credits (read from `#bv-cr-label`): "FALSE START — a wrong name or reason before the right one", "WALKED OUT BY SECURITY — you backed off; nobody talked to him", "Father facing trial, mother untreated", "SHE NEVER MADE HER PITCH — the TalentStack list went to SAFETYNET", "Nobody on staff hurt" (Torres was never knocked out, so this is correct), "The Architect remains at large...". The old "DEAD" contradiction cannot occur on this path.
- The vault's red upload-stopped glow reads red: see item 6.

### 3. Wrong accusations (game 2422, Patricia in person)

- Ben: "Ben's on that log one night, at eight on a Thursday evening. The transfers I flagged run between two and four in the morning." / "Don't throw names at me. Come back when you're sure." Toast (class `influence-popup influence-decreased`): "- Influence: Patricia Morgan". The conversation closed (no dialogue, no minigame) and I reopened it to carry on.
- Halloran after the alibi (`found_halloran_alibi` true): "Halloran was in Zurich the night that badge first went in. You've seen that." / "Don't throw names at me. Come back when you're sure." Same toast, chat ended.
- Debrief line: "You gave a wrong name or a wrong reason before the right one. Patricia's report says so, and so does mine." Credit: "FALSE START — a wrong name or reason before the right one".
- Not driven: Halloran or Ben by phone, and the HaX naming menu.

### 4. Stating the case (game 2422)

- Naming Torres opened a why menu: "Again? Fine. I'm writing this down. Why him?" (the retry line, because the earlier wrong names had set `torres_reason_guessed`; reads fine). Options: cryptography lead, "Money. His wife's treatment isn't covered, and he's borrowed against the house.", "He's been distracted for months.", "His own journal. He knows what it costs, and he's doing it anyway."
- Wrong why ("distracted"): "So has half this building. That's a mood, not a motive." Toast "- Influence: Patricia Morgan", chat ended.
- Right why (Money): "Money. All right. And the proof it's leaving?" Options: his own badge on the hallway, the portal manifest, the data-centre manifest ("Staged by: D. Torres."), "He's been in late, and nobody else has.", the upload schedule. The data-centre manifest option appeared only after I had visited the vault (in game 2424 the first run without the vault visit offered three).
- Wrong proof (his badge): "Read it again. His badge never touches the server hallway. Hers does." Toast "- Influence: Patricia Morgan", chat ended. Reopened, then the data-centre manifest: "...Damn." then "You knew him." and "I'll stop him." A "+ Influence: Patricia Morgan" popup followed, `torres_identified` true, task "Name your suspect" complete.
- Two wrong answers, two trust costs; the right pair completes.

### 5. Neutral task titles (games 2422 and 2424)

Panel text after flag 3, before naming: "Find Out Why", "Get IT's spare card for the suspect's office\*", "Get into the suspect's office\*", "Find a motive", "Find whatever the suspect has been writing", "Get into the suspect's briefcase", "Prove the Exfiltration on the Server", and "Decide the Insider's Fate" with "Name your suspect", "Confront your suspect", "Decide the insider's fate", "Report back to Agent HaX". Nobody is named in the panel. Owen's option "I need into David Torres' office." still names him, as the log says it keeps (the player has seen evidence by then, except in this harness run where flag 3 is supplied).

### 6. Lighting (game 2422, `window.lightingSystem.rooms`)

| Room | Before naming | After naming |
|---|---|---|
| `server_hallway` | left at t0, timer armed ("on, timer set" at 20 s), `on:false` at 78 s | `mode:on`, `on:true` |
| `server_room` | `on:false` at 72 s after leaving (the hallway left first) | `mode:on`, `on:true` |
| `data_center` (vault) | entered and left, `on:false` 70 s after leaving | `mode:on`, `on:true` |

The three rooms were off 70 to 78 s after I left them with Torres still unnamed, and all three read `on:true` immediately after "I'll stop him." (without visiting them). `main_corridor` went to motion mode at the same moment (the night lighting). Red glow: before the call-in the PC glow in the vault was orange and breathing (`shot_hostile_before_call.png`); after `final_choice` was set it reads red (`shot_after_callin.png`, `shot_after_reload_vault.png`), clearly red against the floor.

## New findings

| # | Severity | Finding | Repro (game, log) |
|---|---|---|---|
| N1 | major | After "Send Security" Torres's health bar stays on screen at his last position with no sprite under it, and comes back after every reload when the vault loads (a red bar 60 px wide by the terminal). Item 2 asked for none. Reading the code: `npc-behavior.js` `setNPCVisible` hides the sprite and body but nothing hides or removes the bar in `ui/npc-health-bars.js`; the called-in NPC's hostile state stays true, so a reload restores it as hostile and `announceRestoredHostile` rebuilds the bar. Suggested fix, not applied: clear his hostility when he is called in, or hide his bar in the same mapping as the hide | 2422 after the Send Security click and again after the reload (the `hbar` reads and `shot_after_callin.png`, `shot_after_reload_vault.png`) |
| N2 | major (suspect) | The way out of the fight is a phone call, and the engine closes any open minigame when the player is hit (`player-damage-interrupt.js`). My first attempt, with Torres in reach and hitting every 2 to 3 s, returned `no-active-minigame` after the phone had opened; the second, a moment later, worked. I did not test a human-speed click against an adjacent Torres. A struggler in melee may be knocked out of the menu repeatedly unless they back off first. The HaX text does not say to get clear before calling | 2422, `I can't take him` first click |
| N3 | minor | `torres_hostile` stays true after the call-in (and `isHostile` in the engine), which is what feeds N1. HaX's status lines are fine because `final_choice` is checked first | 2422 globals after the call |
| N4 | minor | Restart and a reload both put the player in `reception_lobby`, five rooms from the vault (the known M1 / D18 engine item). A reload also showed the "OTHER SESSIONS" resume overlay, which needed the exact "Resume" button | 2422 |

0 blockers, 1 major, 1 major (suspect), 2 minors.

Not checked: the hostile-Torres damage on a Restart when the vault was never loaded (state read 10 until the room loaded, then 3), the phone and HaX case menus, the first-encounter hostile text on a reload that restores hostility without a Restart, and anything on the VM side (needs checking against SecGen by the user).
