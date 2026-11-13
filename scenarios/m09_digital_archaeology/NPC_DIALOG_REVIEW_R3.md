# m09 Digital Archaeology: NPC dialogue review, round 3 (phase 4)

Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh. Scope: every ink in `ink/`, the HaX, Recruiter and Nightshade timed texts in `scenario.json.erb`, the readables the dialogue points at, and the closing credits. I read the night in order on three routes: a cold start, a rich m01–m08 save (m01 arrest, m03 Victoria recruited, m04 full, m05 turned, m06 tags and identity found, m07 echo heard, m08 arrested), and the m08 triple-agent branch.

**Ref reviewed: `e86f0583`.** I started at `fc26a4bb` (the R2 fixes). While I worked, the scenario-design R4 fixer committed `e86f0583`, which touches HaX's ink (deck_resume, the notice topic, the Tran topic, one status row), the Recruiter's offer and tape choice, A3-37's timing, A3-38, the guard's log, the tape-side text and one credit line. I recompiled and re-linted those two inks at `e86f0583` and read every changed line (§4). Line numbers below are at `e86f0583`.

**Counts: 0 blocker, 0 major, 3 minor, 9 nit.** Every R2 finding is resolved (§2). One minor and two nits are on lines new at `e86f0583`.

Voiced means sent to TTS: the briefing, the debrief, the Alpha clip, every person-chat (with the `Agent HaX:` lines inside them), the Recruiter's call, and HaX's `deck_resume`, `identity_scene`, `identity_resume` and `tesseract_call`. Everything else is unvoiced.

---

## 1. Tools

| Tool | Result at `e86f0583` |
|---|---|
| `bin/inklecate` (to scratch) | All 15 story inks compile with no warnings. Each scratch JSON is byte-identical to the committed one |
| `validate_scenario.rb` | 0 errors. Every speaker prefix resolves. The same 6 lint hits R1 withdrew; 13 onceOnly-overlap warnings (ruled at alignment R1 m12) and one `biometric` lockType warning on `open_plan_cabinet`, which is design territory. `mission.json` unchanged |
| `dialoguelint.mjs` | 0 errors; `not-x-but-y=5`, `you-after-choice=1`, all previously withdrawn. No phone line over 25 words. The ERB still lints as `texts=0`, so I checked every `text_map` string by hand: all ≤25 words, no banned words |
| `inklint.mjs` | No findings |
| `voicelines.mjs` (12 voiced or mixed files) | No errors, no printed variable in a voiced line |
| `loopcheck.js` | Hatch `start` (`noor_cover=safetynet`, with and without `noor_told`), Tran `start` (`cage_bin=letters`), HaX `identity_scene`, HaX `support_hub` (identity done, m04 `full` and `quiet`), Recruiter `call` (`sleeper_shortlist=true`), debrief `start`, Old Coyote `hub`: no runtime errors, no starved knots |

I wrote nothing outside this file and my scratch folder.

---

## 2. Round 2 findings

| R2 | Status | Check, on every route that reaches it |
|---|---|---|
| m1 (notebook said twice) | **Resolved** | `phone_agent0x99.ink:423`, `:431`. On the default route HaX now says "…the margins in my old course notebook. Same hand." and, six lines on, "He taught me. The margins in that notebook are his." The second line adds the turn (whose margins they are), so it no longer repeats. When the hand was matched in the hub first, "that notebook" points back to "Those are my notes. That's his pen.", which also works. The m06+m07 and m07-only arms never needed it. One new nit on the opening line (n1). |
| m2 (Noor rang through) | **Resolved** | `sorensen_hatch.ink:46-50`. `noor_told` is a synced global (ERB L2488) and is declared in the hatch. Noor's sprite hides on `noor_told`, so she really has gone. "SAFETYNET, then." reads as Sorensen's deduction, and her very next line ("And you're the one the Architect writes about.") tells the player how she could make it. If `noor_told` lands after the hatch, the hatch has already played "rang through", which was true then. The KO-after-cover case still reads as before. In voice: unhurried and exact. |
| m3 (Tran "It's off") | **Resolved** | `jesse_tran.ink:59`. "Fine. I stop it, I walk out that door…" is now a price, so "[No deal.]" → "The wipe keeps running." follows. A repeated lever press skips the narrator beat and gets the price again. Small echo with the `[Go.]` reply (n3). |
| m4 (leaver line) | **Resolved** | `phone_agent0x99.ink:710`. The "never revoked / seven years" fact is no longer said a third time. Wording nit n4. |
| m5 (safe text) | **Resolved**, with a pattern problem | ERB L264 is true (`safe_pin` 060216 is the "Lease start: 06/02/16" on her own rent ledger). It is now the third HaX text that closes on "That's how… / That's what…". See m2. |
| n1 ("Somebody at SAFETYNET") | Resolved on the SAFETYNET arm | New nit on the other arms (n2). |
| n2 (Netherton full form) | Resolved | `briefing.ink:34` "If it had not arrived". |
| n3 (status row) | Resolved | `phone_agent0x99.ink:969`. |
| n4 (Tomb Beta / schedule echo) | Resolved | L217 "nobody's scheduled it for anything." Nightshade's "isn't on her schedule" 7 s later is now about a different object, said differently. Naming nit n5. |
| n5 (cue line last) | Resolved | The cue now sits above the buttons. The line above it was rewritten at `e86f0583` (m3). |
| n6 (Gary's colon) | Resolved | "Vigenère. Every letter's shifted by…" sounds like Gary. |
| n7 (Old Coyote) | Resolved | "Lineman's course, days." answers "Why work nights?" and stays dry. |
| n8 ("what she's burning") | Resolved | ×3. |

---

## 3. Findings

### Minor

**m1. Netherton says "Then I sign" twice in a row.**
`m09_closing_debrief.ink:149` then `:165`. Voiced (Netherton).
- On every route where the notice is sent in the debrief, the player presses "[Send it.]" and hears "Then I sign it.", then the hub's first line, "Ask me what you need to. Then I sign." Before the pen comes out, the debrief has also said "Hold that until I find a pen." and "I will sign whichever." Signing is the scene's motif. Said twice back to back, it sounds like a stuck line.
- Current L149: "Then I sign it."
- Proposed L149: "Then it goes tonight, under my name." (full forms; one clip reworded). L165 stays.

**m2. HaX's texts keep closing on a lesson. R2's safe fix adds a third "That's how… / That's what…" closer.**
ERB L264 (A3-12b), L362 (A3-38), L364 (A3-39), with L281 (A3-37) and L368 (A3-41). Unvoiced.
- All five can fire on one route, and each ends on a maxim: "…That's what makes them easy to find.", "…That's how she chose them, and how she kept them.", "That's how they start…", "A cipher is only as safe as its key.", "A log nobody reads is a diary." R2 said a third aphorism would start to sound like a pattern, and there are now five. HaX stops sounding like a handler and starts sounding like the lab sheet. The teaching stays if two of them show it instead of saying it.
- A3-12b current: "Lease date. People pick numbers they'll never forget. That's what makes them easy to find."
- A3-12b proposed: "Lease date. She picked a number she'd never forget, then printed it at the top of every page." (18 words. It's still the lesson, told through what she did. texts/A and CONTRACT §2.3 too.)
- A3-39 current: "That's how they start. A kindness, then a need they already knew about."
- A3-39 proposed: "A bonus in her first week. Her dad's dialysis already on file. Kindness first, then the need." (17 words. It names Noor's own facts, which she has just said aloud.)
- Keep A3-37, A3-38 and A3-41. One maxim each is fine once the other two stop.

**m3. New at `e86f0583`: the notice topic says "What you said about Albion" to a player who said nothing.**
`m09_phone_agent0x99.ink:701`. Unvoiced.
- The `- m04_disclosure_choice != ""` arm covers `partial` without crew lost and `quiet`. On `quiet` the player let the report say maintenance fault, and the briefing card says "…and you let it." The line also says "about" three times.
- Current: "What you said about Albion was about what happened. This is about the hole itself, and who else has it."
- Proposed: "Albion's report was about what happened. This is about the hole itself, and who else has it." There is a report on every m04 route (half the story, or maintenance fault), so this one line is true on both arms the gate covers.

### Nits

| # | File:line | Voiced | Current | Proposed |
|---|---|---|---|---|
| n1 | phone_agent0x99.ink:394 | yes (HaX) | "You never told me about the writing on Nightshade's file. I put it beside the margins in my old course notebook. Same hand." When flag 3 is in before the file is taken, the "Hold his file next to the notebook scan" text never fires (it needs `!flag3_submitted`) and the scene rings 1.5 s after pickup, so she reproaches the player for a comparison she never asked for | "The writing on Nightshade's file. I put it beside the margins in my old course notebook. Same hand." (true on both routes) |
| n2 | sorensen_hatch.ink:86, sorensen_door.ink:41 | yes (Sorensen; one shared clip) | "Your first days aren't in your file. Somebody over there is careful with you." On the auditor and contractor arms she has just called the player "the lease-holder's auditor", so "over there" has no place to point at except the lease-holder | "Your first days aren't in your file. Somebody in your outfit is careful with you." (US idiom, true on every arm, still doesn't name SAFETYNET) |
| n3 | jesse_tran.ink:59 with :70 | yes (Tran) | "…and I make a phone call on the way." then on "[Go.]" "The Bozeman number gets one call from me." | L59: "Fine. I kill the wipe, I walk out that door, and nobody hears from me but one number." Then L70 names it. ("kill" is more him than "stop it") |
| n4 | phone_agent0x99.ink:710 | no | "When someone leaves, their accounts and their kit go back the same day. We never took his back." (accounts don't "go back") | "When someone leaves, we take back their kit and shut their accounts the same day. Not his." (concept only; nothing VM-side changes) |
| n5 | phone_nightshade.ink:23 | no | "That plan chest isn't on her schedule." Everyone else, the object's name and the task say "plan cabinet" | "That plan cabinet isn't on her schedule." |
| n6 | ERB L340 | no | "Irina's tip-off led us to this. Tell her it bought us the deed." It's a lease (Big Sky Holdings is the lessee), and the debrief says "lease" | "Irina's tip-off led us to this. Tell her it found us the bunker." |
| n7 | briefing.ink:272 | yes (HaX) | "Whatever the Publication is, it's built from the database Nightshade sent to Montana." About eight lines after her own wall card said "…sent the threat database to Montana" (every m08 arm and the canon) | "Whatever the Publication is, he's building it from that database. Every weakness we've ever catalogued." |
| n8 | briefing.ink:73 with closing_debrief.ink:278 | yes | On a save that knocked out both HaX and Netherton in m08 (independent `globalVarOnKO`s), the night opens with HaX's "You put me on the floor at the Citadel." and ends with Netherton's "You put me on the floor at the Citadel." Two characters, same words | Netherton L278: "You knocked me down at the Citadel. Nobody has mentioned it. I am mentioning it once." |
| n9 | ERB L1085 (Old Coyote's log, new at `e86f0583`) | no | "NOT ON THE ROTA." "Rota" is British, and this is a 24-year-old Montana guard writing in his own log | "NOT ON THE ROSTER." (Series L's "control room rota" in Sorensen's hand has the same slip: "control room roster") |

---

## 4. Lines new at `e86f0583`

- **Recruiter L136, voiced (HaX):** "We're down to two off that firm's sheet. She's selling you a coin toss." This is true on `sleeper_shortlist`, and it gives the player a reason to refuse. But it comes between "Say no and I wipe it myself. Same deck, no name." and her next term, "I can't see which tape you pull…", so the Recruiter carries on as if HaX hadn't spoken. **Nit:** move it below L138 ("…and I call my placement."), so that HaX answers the whole offer, as her other asides in this knot do.
- **HaX L353 and Recruiter tape choice:** "WREN's still one of the two on that firm's sheet." Fine. It follows "First name on it is a handler in Baltimore."
- **HaX L843:** "Those reels are her recruiting interviews. The legacy names, in their own voices, saying yes." Good. It matches Tran's "Interviews. Old ones, on reels." and the new tape-side readable.
- **HaX status L960:** "Her office. Get the safe open. Her card opens the tape room, and Tomb Beta's server is past it." Fine.
- **A3-38:** "A son, a drink, boredom, a lonely night." It now matches Series L's notes (Ortega's son, Teague's drinking, Brandvold "Bored.", Fitch "Lonely.").
- **Notice topic L701:** m3.

---

## 5. Step 2, fresh run

- **2a Attribution: OK.** Every prefix resolves, there's no `#speaker:` tag, and narration appears only in person-chats and cutscenes.
- **2a-bis Scenario support: OK.**
  - The safe PIN is the rent ledger's lease start.
  - "Eleven names" in the debrief matches Series L's eleven rows.
  - Noor hides on `noor_told`, which keeps "went home without saying goodnight" true.
  - "Plan chest" is the one naming slip (n5).
- **2a-ter Voices: OK.** Nothing new except the British word in a US guard's log (n9).
- **2b Choices: OK.** No choice quotes something that wasn't said. "[Afterwards. Not during.]" is still gated on a route that has heard it.
- **2c / 2c-bis: OK** (loopcheck).
- **2d Choices that matter: OK.** Noor's cover now pays back correctly at the hatch on both of its sub-routes.
- **2e State: OK.** `noor_told` and `sleeper_shortlist` are declared in every reader.
- **2f Influence: N/A** (contract §6.1).
- **2h KO: OK.**
- **2i Pass-4 bugs.**
  - The same fact twice in a row: m1, n3, n7.
  - Status rows hold.
  - The ERB texts were checked by hand.

### The night, heard in order

- **Cold start.** The briefing's shortened wall reads cleanly: "The traitor we took two days ago…" is paid off by HaX naming Nightshade on the m08 card. At the hatch the default arm runs "auditor" → "Your first days aren't in your file. Somebody over there…" → "You're not from the lease-holder." That's n2's only real exposure. The identity scene's else arm ("…eighty-seven per cent… He taught me. The margins in that notebook are his. … the other thirteen.") holds together.
- **Rich save.** Callbacks are spread over the night, not bunched: Maya's list at the dock, Victoria at the stacks door, Irina, Danny and Reeves on readables, Torres at the H&L box, Kemal Aydin at the hour read. Nothing is said three times, except the HaX moral closers (m2). "Afterwards" and "the rest" come back three times on purpose (the afterwards call, the name topic, the debrief). That's a promise kept, not repetition.
- **Triple agent.** HaX's flag-1 call and Nightshade's call 7 s later now say different things. His "Crack the keys first" adds to her "You've done this before", and "He's right. I hate that he's right." covers the join. The Nightshade's-file topic, the bring-in reminder and his two texts back all read true. n5 is the only slip.

### Characters who sound alike

- HaX, Netherton and Sorensen all use "put … on the floor" for violence. Across the night that's fine, because it comes from the wall cards and Sorensen read the same files. The identical sentence from two speakers (n8) is the one case that jars.
- Netherton's full forms hold on every weighted line. "This one didn't, Quintero." is a retort.
- Old Coyote, Tran, Noor and the Recruiter each keep a distinct rhythm. Gary still sounds like Gary.

---

## 6. Spoken lines these fixes would change

| Finding | Speaker | Clips |
|---|---|---|
| m1 | Netherton (debrief) | 1 reworded |
| n1 | HaX (identity scene) | 1 reworded |
| n2 | Sorensen (hatch and door, one shared clip) | 1 reworded |
| n3 | Tran | 1 reworded |
| n7 | HaX (briefing) | 1 reworded |
| n8 | Netherton (debrief) | 1 reworded |
| §4 Recruiter L136 | HaX (Recruiter call) | 0 (moved, not reworded) |

m2, m3, n4–n6 and n9 are unvoiced.

## 7. Top five

1. **m1.** The debrief says "Then I sign it." and then, straight after, "Ask me what you need to. Then I sign."
2. **m2.** HaX's texts close on a moral five times in one night, and R2's safe fix added the third "That's how / That's what". Show A3-12b and A3-39 instead.
3. **m3.** New at `e86f0583`: "What you said about Albion…" goes to the `quiet` route, where the player said nothing. Use "Albion's report…".
4. **n1.** "You never told me about the writing on Nightshade's file" reproaches a flag-3-first player whom HaX never asked to compare.
5. **n2.** "Somebody over there is careful with you" points at the lease-holder on the auditor and contractor arms.
