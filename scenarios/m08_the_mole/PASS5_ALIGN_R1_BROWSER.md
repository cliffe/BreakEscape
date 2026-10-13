# m08 pass 5, alignment round 1: browser check

Date 2026-10-14. Commit under test b375a939. Keyless server :3001 only, headless (machine load about 24), Sonnet-style harness commands, no files edited, nothing committed. Every session started here was stopped (`session-stop.sh` 2392, 2402, 2406; the two `playtest-session` processes still running belong to other agents, games 2404 and 2405).

Question answered: plumbing, plus a little unexpected behaviour (wrong reading, early accusation, re-entering a conversation mid-question). Not a solvability pass: the flags are supplied.

## Games and logs

| Game | Purpose | Session log |
|---|---|---|
| 2392 (A) | Full route to credits, box first, one wrong audit reading then the right one, mid-mission page reload | `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m08-align-browser/gameA-session.jsonl` (936 commands) |
| 2402 (B) | Nightshade accused on first visit, tidied locker, naming before the box, credits, reload after the credits | `.../m08-align-browser/gameB-session.jsonl` (810 commands) |
| 2406 (C) | HaX "[What does the Director need from me?]" ladder, then naming | `.../m08-align-browser/gameC-session.jsonl` |

Screenshots (same folder): `A_netherton_talk.png`, `A_hax_person_bust.png`, `A_debrief_open.png`, `B_dusting_panel.png`, `B_after_confront_t0.png` / `t2.png`, `B_phone_contacts.png`.

## verify-run.rb (key lines, all three games)

```
game 2392  unlocked rooms 9 (main_lobby ... interrogation_room)  flags submitted 4  globals 45 incl. mission_complete, mole_identified, named_on_evidence, audit_misread, nightshade_arrested
VERDICT: progress recorded - 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
game 2402  unlocked rooms 9, unlocked objs 1 (nightshade_locker)  flags submitted 4  globals 51 incl. accused_nightshade, nightshade_tipped_off, nightshade_tidied, named_before_box, mission_complete
VERDICT: progress recorded - 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
game 2406  unlocked rooms 6  flags submitted 0
VERDICT: progress recorded - 5 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Netherton card clone | (cloner Save, Emulate) | Netherton's "[Step up beside him...]" then the RFID read | yes (A, B) |
| Archives password | `TrustNoOne` | Break-room post-it | yes (A, B, C) |
| Interrogation suite PIN | `5386` | Netherton says it after the audit check | yes (A, B) |
| Locker (game B) | lockpick | `completeLockpick` (assisted), not Nightshade's key | assisted |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | Evidence Relay Terminal | **no. Exercised, not earned.** The GitList launcher was never opened in any game |

Everything downstream of the flag submissions (HaX's flag texts, the evidence aim, the confrontation unlock) was exercised, not earned. Solvability past the VM is unproven here. Nothing about the VM contents was checked (needs checking against SecGen by the user, as the brief says).

## Results per item

### 1. Flag-4 text and the Confront gate: PASS

- Game A, box first, nobody named. HaX text: "Root. A terminal and a time, no face: crypto-lab-04, D-2 10:38, forty-seven minutes. The root file says it was for our threat database. Who was behind that lab door?", then "Whole chain's in: a terminal, a time, an account. The Director won't walk anyone anywhere on a login. Give him the person. Door audit." No name.
- Aim states after the flags (A): `work_the_suspects` active, `correlate_the_evidence` completed, `confront_the_mole` **locked**.
- Game B, named before the box, flags 1-3 in: `work_the_suspects` completed, `correlate_the_evidence` active, `confront_the_mole` **locked**. After flag 4 it went active with only `confront_nightshade` open (`get_suite_code` already ticked).
- Game A after naming: `confront_the_mole` active, `get_suite_code` completed. The two-aim gate behaves as described. "Both aims done but not named" cannot be separated, because `name_the_mole` sits inside the suspects aim.
- Game B flag-4 text when already named: "Root. Logs agree with your door audit: Crypto Lab terminal, forty-seven minutes. The root file says what that night was for: our threat database. It's Nightshade. You had him first." Names him, as designed for that branch.

### 2. Naming through "[I can name the leak, sir.]": PASS

- Before any confirmation (A, after the box and archives): "Then don't give me a suspect. Give me a reading." / "Before you read it to me, take it to the people on it. If a man's own row is wrong, he will say so." / "Come back when one of them has told you it is right." The box minute stood in for the clock question, as the log says.
- After Cipher confirmed ("Eight minutes. I went in for a hardware token..."): 10:38, then **Cipher.** (wrong) gave "Read the door against the minute, not the man." and set `audit_misread` (verify-run shows it), `named_on_evidence` not set.
- Second go: 10:38, Nightshade, "The door log has him out of the lab at 10:32.", "The people on it confirm their own rows." Netherton: "He walked into his own lab twenty-three minutes before that plan opened... A door and a login, at the same minute. That I can act on." `name_the_mole` and `get_suite_code` completed, Confront active.
- Game B ran the same check before the box (clock from the server log, Nightshade's own row confirmed): passed, `named_before_box` set, "When the whole chain is through the relay, he goes down to the suite. The code is 5386." reads correctly there.
- Also seen: the "login alone" case was not run in the browser (route driver r-series covers it).

### 3. HaX "[What does the Director need from me?]": PASS (hub drops the option once named)

Game C, one line per state:

| State | HaX reply |
|---|---|
| Nothing done | "A name he can stand behind, and you haven't got one yet. Doors before faces. The archives keep the door audits." |
| Archives printout read | "You've got the door. Now you need the clock: when was the plan opened? Somebody in this building wrote it down." |
| Timeline read | "Door and clock. He'll want someone on that audit to stand behind their own row. Ask the men who badge through the lab door." |
| Cipher's row confirmed | "Door, clock, a confirmed row. Take it to him. Read the door against the minute, not the man." |
| One misread | "He's said no once. Before you go back, put every row against the minute the plan opened. Who was still inside?" |
| Named | option gone; hub offers "How do I get into the server room?", "...the interrogation suite?", "Why isn't he in the interrogation room yet?", "It's really Nightshade.", "Nothing right now." |

Asking twice in the same state repeats the same rung (game A), which is right for a state-checking ladder. Game A (flags in, not named) gave the first rung too.

### 4. Sprites, busts, headshots: PASS

- `window.npcManager` in game A: `agent_0x99_person` spriteSheet `agent_hax`, talk `agent_hax_talk.png`, visemes `agent_hax_visemes.png`, avatar `agent_hax_headshot.png`; phone contact avatar in the DOM is `agent_hax_headshot.png`.
- `director_netherton` and `closing_debrief`: spriteSheet `netherton`, talk/visemes `netherton_*`, avatar `netherton_headshot.png`. Rendered world sprites for both carry texture key `netherton` (the debrief one sits off-screen at 16000,15969, as expected).
- Screenshots: HaX in person shows the new bust (hat, trench coat); Netherton's office conversation and debrief show the Netherton bust.
- Note, not a finding: Netherton's office conversation has a plain black background (no `chatBackground`), the debrief has a skyline background. POV backgrounds are a later stage.

### 5. Early accusation, tidied variants (game B): PASS with two gaps (N1, N4)

- "[I think it's you, Nightshade.]" on the first visit set `accused_nightshade`, `nightshade_tipped_off`, `nightshade_tidied` (via `window.gameState.globalVariables`). HaX: "You told him. He knows now. If he was ever going to tidy up, he's doing it tonight."
- Locker contents: go-bag viewer showed "The top shelf is empty. A clean rectangle in the dust where a holdall stood until tonight... Whatever he packed, he has taken it somewhere you will not find it." and the observation "The top shelf, where something stood until tonight." The stick went into the inventory with no viewer on take.
- Stick from the inventory, "Use normally" (so after taking it): "PERSONAL_BACKUP.enc - 0 bytes. Last written: tonight. Overwritten. Whatever was on it is gone." and "...He wiped the file, not the stick." HaX: "Empty. He wiped it after you tipped him off. The print on the casing is still there. Lift it."
- Confrontation: "You said it to my face before you could prove it. So I tidied. The bag, the stick." then "Not well enough, it seems."
- Credits: "GO-BAG: Gone from his locker the night you tipped him off". The stick/print credit was not exercised (I never lifted the print).
- Gaps: the lock screen and the container header still say "has nothing on it at all" (N4); the default click on the stick (dusting panel) shows the original ciphertext, not the wiped file (N1).

### 6. "Same classroom, 0x00..." after the confrontation: FAIL on delivery, text itself reads fine

- The trigger is `conversation_closed:nightshade_confrontation` plus 2.5 s. The debrief opens straight away, so the text arrives while the debrief (cannot be closed, phone blocked) is on screen. I took screenshots during the debrief (`A_debrief_open.png`, `B_after_confront_t0.png`, `t2.png`) and checked the DOM: no toast or badge. After the debrief the credits overlay is terminal and blocks the phone (`blocking-ui bv-stage`).
- I confirmed the text was delivered by reloading after the credits (game B) and opening the phone: "He said it to you? 'Afterwards, not during.' I was taught that line, and I say it to every agent I run. Same classroom, 0x00. Don't ask me whose yet." So only a post-credits reload reveals it.
- Net effect: the M5 fix lands only through Netherton's debrief option "[He used HaX's line...]" ("Then whoever taught her taught him. There are not many people left who could have done both, and I do not like any of the names. We will not say one aloud until we can prove it."), which reads sensibly on its own. HaX's beat is unread on the normal path.

### 7. Dusting panel ciphertext wraps inside its frame: FAIL

`B_dusting_panel.png`: the 64-character lines still run about 115 px past the right border of the green frame (frame edge near x=1178, text to x=1295 in a 1400 px capture), on every line, in the text column beside the print image. 64 characters is too wide for that column. Either wrap near 50 characters or take the engine fix (E3, `overflow-wrap` on that block).

## Other things seen that were fine

- Mid-mission reload (game A, after flags, archives and the audit printout): title screen, Enter, Mission Brief note closes; aims, `netherton_card_cloned`, inventory and the read printout all intact, then the audit check ran normally.
- Credits read from `#bv-cr-label` in both games (A: "THE CASE: Named from the door audit, not on the first reading", four THE BOX lines, "AGENT 0x00 TO THE DIRECTOR: Own the gap"; B: "THE CASE: Named from the door audit, before the root logs", GO-BAG line, "He's the crime, not you"). The THE BOX section is there in both.
- Debrief VM beat "[Our own code server let me in without a password, sir.]" appears on both paths.
- Post-completion reload (game B) re-shows the credits overlay (closable, room null at the start position) rather than not replaying; the close button works. Not an m08 matter, noting it because the skill says credits do not replay.

## New findings

| # | Severity | Finding | Where |
|---|---|---|---|
| N1 | major | The dusting panel (the first thing the inventory click opens, with the fingerprint kit in the start kit) ignores `textVariants` and `observationVariants`. After a tip-off it still shows the full ciphertext, so the "wiped" cost is bypassed and it contradicts HaX's "Empty." "Use normally" shows the wiped variant. | game B, `B_dusting_panel.png`, `encrypted_backup` |
| N2 | major | HaX's "Same classroom" text is delivered 2.5 s into a debrief that blocks the phone, followed by terminal credits, with no toast. Unread on the normal path (only a post-credits reload shows it). The M5 fix leans on it. | games A and B |
| N3 | minor | Dusting ciphertext still overflows its frame at 64 characters (regression finding 10 not closed). | game B |
| N4 | minor | The locker's lockpick screen and container header use the base observation ("has nothing on it at all"), so the "fresh scratches round the lock" variant is never seen by the player. The contents show their variants. | game B |
| N5 | minor | "[I have a name forming.]" re-opens its "Who is your instinct pointing at?" question on every re-entry, even after End Conversation, and the audit option is not offered until a suspect is picked. The only way past is to commit to Cipher, Phantom or Nightshade (the pick feeds `suspect_theory`). | game A |
| N6 | minor | After all four flags are in, the audit-check ending still has Netherton say "When the whole chain is through the relay, he goes down to the suite." Correct in game B (before the box), stale in game A. | game A |

Counts: 0 blockers, 2 majors, 4 minors.

## Not covered

The "login alone" misread, three-misread fallback, Director KO and the Cipher/Phantom apology paths (route driver r1-r7 covers them in ink only). The print lift on the stick. The GitList VM work itself. Audio (keyless server).
