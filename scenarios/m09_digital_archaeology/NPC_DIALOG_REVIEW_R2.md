# m09 Digital Archaeology: NPC dialogue review, round 2 (phase 4)

Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh on the current build. Scope: every ink in `ink/`, the HaX timed texts in `scenario.json.erb`, and `texts/A_hax_texts.md`. I gave extra weight to Old Coyote, Dillard, Gary, Torres and Noor, and checked the recurring cast against their m01–m08 inks.

**Ref reviewed: `e20cb0b0`.** I started at `cf3d98d8` (the R1 fixes). While I worked, the builder applied the educational R1 and design R3 fixes in the working tree and then committed them as `e20cb0b0`. The tree was clean when I finished. These are the lines that changed under me. Each one was re-read, recompiled and re-linted at `e20cb0b0`:
- HaX `dock`: a new first-job line ×3 (L180/184/188). `flag1_read`: the new Tomb Beta line (L217). `hour_read`: the full-disclosure pair reworded (fixed exception, §8.2). The `[His notice.]` topic gains an inquiry line (L699). Keypad asks 2 and 3 gain cipher lines. `notice_ask` "Not yet" gains the equities line. `[About the name.]` gains the leaver line (L707). The Victoria status row moves above the flag-2 rows.
- Briefing L310: "This one didn't, Quintero. Noted." Debrief L267: the Tomb Gamma Sun River arm now reads "…a lease in Mrs Sorensen's office that Tesseract's people took in 2016."
- Gary L30: "Vigenère: every letter shifted by the next letter of the bay's word."
- ERB texts A3-37, A3-38, A3-39, A3-41 and A3-42, the second open-the-safe text (L264), and the shelf-chart house rule. A3-40 was drafted as a text, then withdrawn into the `[About the name.]` line before the commit.

**Counts: 0 blocker, 0 major, 5 minor, 8 nit.** Every R1 finding is resolved, except n6, which compiles but doesn't take effect on the main route (m1 below).

Voiced means sent to TTS: the briefing, the debrief, the Alpha clip, every person-chat (including `Agent HaX:` lines inside them), the Recruiter's call, and HaX's `deck_resume`, `identity_scene`, `identity_resume` and `tesseract_call`. Everything else is unvoiced: HaX's hub, status, `dock`, `flag1_read` and the other calls, Gary, Torres, Nightshade, and every text.

---

## 1. Tools

| Tool | Result at `e20cb0b0` |
|---|---|
| `bin/inklecate` (to scratch, not over the game's JSON) | All 16 inks compile, with no warnings |
| `validate_scenario.rb` | 0 errors. The same 13 onceOnly-overlap and 4 cutscene warnings that R1 already ruled on |
| `dialoguelint.mjs` | 0 errors. The same 5 `not-x-but-y` and 1 `you-after-choice` hits that R1 withdrew (L540 is the moved "It isn't my call"). No phone line is over 25 words. The lint reports `texts=0` for the ERB because it can't read the `text_map(...)` Ruby helper, so I checked the texts by hand (§4) |
| `inklint.mjs` | No findings |
| `voicelines.mjs` (12 voiced or mixed files) | No printed variable in any voiced line. The only digits are fixed strings and agent numbers |
| `tagdiff --ref 157a552a` (before R1 → R1) | Changes in 3 files, all accounted for: `noor_cover` VAR, `start` divert, two conditionals (hatch); `tran_read_letters` guard (Tran); `hand_matched` branches, the n7 choice condition and the m5 status row (HaX). Nothing else moved |
| `loopcheck.js` | Hatch `start` with `noor_cover=safetynet`, HaX `identity_scene`, HaX `support_hub` after the identity scene: no runtime errors, no starved knots |

The validator also rewrote `mission.json`, but that was the builder's CyBOK edit, which went into `e20cb0b0`. I wrote nothing outside this file and my scratch folder.

---

## 2. Round 1 findings

| R1 | Status | Check |
|---|---|---|
| MJ-1 (m01-recruit text) | **Resolved** | A3-28d "You still offered him a way out." matches the ERB, texts/A and §2.3. It's true to m01's refusal and to Derek's file ("believes it more than I do"). |
| MJ-2 ("the one the Architect writes about") | **Resolved** | Hatch L84/L86, door L43. The antecedent is now explicit. "The Architect" fits her: Netherton's wall says "They call him the Architect", and the player's lever line says "Your Architect". |
| m1 (Albion card) | Resolved | Briefing L37. |
| m2 ("Analysis guessed low") | Resolved | HaX L602. |
| m3 (Victoria) | Resolved | A3-36 opens "First time we've used Victoria." and topic 14 no longer repeats "read the mail". |
| m4 (identity-scene notice) | **Resolved** | L506 names "a vendor notice he never sent", and L520 says "That's Albion's hole." Both are under 25 words. The `partial`, `quiet` and never-played arms still read correctly after L506. |
| m5 (status after flag 2) | Resolved | L964. Wording nit n3. |
| m6 (Box by box) | Resolved | L207. Sixteen matches R-114 to R-129. |
| m7 (Netherton full forms) | **Resolved** | Debrief L109 and L191. One weighted contraction is left in the briefing (n2). |
| m8 (Sun River "her") | **Resolved, plus a builder change** | All three arms now say "Mrs Sorensen's". The Tomb Gamma arm (L267, changed at `e20cb0b0`) is 25 words and true on its route: Analysis found the lease even if the player didn't take it. |
| m9 (Noor's cover reaches Sorensen) | **Taken, with a departure. One route problem (m2 below)** | Sync works: `noor_cover` is declared in `globalVariables` (ERB L2573), and Noor's `~` assignment is written through by `observeGlobalVariableChanges`. The departure line "And you're the one the Architect writes about." reads well after "SAFETYNET, of course." The arm skips `opening`, so the player gets no beat before the bin, which is acceptable. |
| n1–n5, n7 | Resolved | n7: m08's debrief text "Afterwards, not during." plays on every m08 route except `nightshade_ko_before_fate` (`m08_closing_debrief.ink:63-65`), which is the same gate the new condition uses. |
| n6 (short margins line) | **Not effective on the main route** | See m1. |

---

## 3. Findings

### Minor

**m1. R1 n6 doesn't take effect: the identity scene still says the notebook fact twice in a row.**
`m09_phone_agent0x99.ink:389` and `:417-433`. Voiced (HaX).
- The opening sets `#set_global:hand_matched:true` (L388) and then runs through to the confession's choices with no choice between them. `phone-chat-minigame.js` `continueStory()` collects every line up to the choice point first and only then runs the batch's tags (`_presentOutput`). So `{hand_matched:` at L417/L429 still reads false, and the long line plays. I proved it with inkjs (`m06_architect_identity_found=true`, `hand_matched=false`), which is the default route, because the hub's "[The hand on his file.]" is optional:
  - "…I put it beside the margins in my old course notebook. Same hand." (L389)
  - …six lines later, "He taught me. The notebook in my case file is from his course. Those margins are his." (L420)
- The short line plays only when the hand was matched in the hub before the scene. That route has already heard about the notebook ("Those are my notes. That's his pen."), so the short line is correct on every route.
- Proposed: drop the two conditionals and keep "He taught me. The margins in that notebook are his." unconditionally in both arms. That's one clip fewer (the long line is orphaned). The alternative, an ink-local `~ hand_said_here = true` in the opening, would also work, but nothing needs the long line any more.

**m2. "Noor rang through" after the player stopped Noor using her phone.**
`m09_sorensen_hatch.ink:42-46`. Voiced (Sorensen).
- On the SAFETYNET cover, a player who then takes Noor through `reach` stops her ringing out ("[Not tonight. Not from here.]"), and she leaves with "the phone face down on the desk". Then Sorensen opens with "Noor rang through." It's possible she rang Peg before she was told, but a player who has just stopped her phoning will hear it as a slip.
- Proposed: declare `VAR noor_told = false` in the hatch ink (it's a synced global already), and split the arm:
  - `noor_cover == "safetynet" and noor_told`: "Noor went home without saying goodnight. She always says goodnight. SAFETYNET, then. There's a chair on your side." (21 words; one new clip)
  - `noor_cover == "safetynet"`: as now.

**m3. Tran says the wipe is off, then "The wipe keeps running".**
`m09_jesse_tran.ink:59` and `:74`. Voiced (Tran).
- He opens with "Fine. It's off. I walk out that door…". The player's "[No deal.]" then gets "Your call. The wipe keeps running." The first line sounds like it's already done, so the second contradicts it. Pressing the lever again replays "It's off" too.
- Proposed L59: "Fine. I stop it, I walk out that door, and I make a phone call on the way." It's still his price before the player agrees (MC §4.4), and L74 then follows.

**m4. New at `e20cb0b0`: the leaver line in `[About the name.]` is the third time tonight that the credential was never revoked.**
`m09_phone_agent0x99.ink:707`. Unvoiced.
- The identity scene has just said "Issued before he left us. Never revoked." (L392) and "Seven years, and nobody turned it off." (L504/506). The topic opens on his first name, then says "His were never revoked. Seven years on, the credential still works."
- Proposed L707: "When someone leaves, their accounts and their kit go back the same day. We never took his back." This keeps the practice (E-M4) and drops the repeated fact. It was opus48-checked wording, so re-run that check if the change touches anything VM-side. It shouldn't, because it's concept only.

**m5. New at `e20cb0b0`: the open-the-safe text says the wrong thing.**
`scenario.json.erb:264` (texts/A, the second open-the-safe row). Unvoiced.
- Current: "Lease date. People pick numbers they'll never forget. So can we."
- "So can we" reads as "we can pick numbers too". The point is that we can find them.
- Proposed: "Lease date. People pick numbers they'll never forget. That's what makes them easy to find."

### Nits

| # | File:line | Voiced | Current | Proposed |
|---|---|---|---|---|
| n1 | hatch.ink:44 with :80 | yes (Sorensen) | On a cold start with the SAFETYNET cover: "Noor rang through. SAFETYNET, of course." then "Your first days aren't in your file. Somebody at SAFETYNET is careful with you." | L80: "Your first days aren't in your file. Somebody over there is careful with you." (the door scene shares the line; change both, per the file header) |
| n2 | briefing.ink:34 | yes (Netherton) | "…Then we let it go on. If it hadn't arrived, he would know." | "If it had not arrived, he would know." (the hook line of the mission; the standing rule) |
| n3 | phone_agent0x99.ink:964 | no | "The gate, beside her hatch. If you didn't clone her card, go back to the counter." | "The gate beside her hatch takes her card. If you haven't cloned it, lean on her counter again." (one name for the place, and it says what to do) |
| n4 | phone_agent0x99.ink:217 with phone_nightshade.ink:23 | no | On the triple-agent route, flag 1 brings "…and it isn't on her schedule." (Tomb Beta) and, 7 s later, Nightshade's "That plan chest isn't on her schedule." | L217: "The catalogue calls what's in there Tomb Beta. It's still drawing power, and nobody's scheduled it for anything." |
| n5 | phone_agent0x99.ink:696-700 | no | "Still on his box. Say the word." then "Albion's inquiry was about what happened…" | Put the inquiry line first and end on "Still on his box. Say the word.", so the cue sits above the buttons |
| n6 | phone_gary.ink:30 | no | "…Vigenère: every letter shifted by the next letter of the bay's word." | "…Vigenère. Every letter's shifted by the next letter of the bay's word." (no colon in an unprefixed phone line, §8.4; and Gary says it as a sentence, not a glossary entry) |
| n7 | old_coyote.ink:94 | yes (Old Coyote) | "Lineman's course. Climbing poles in a blizzard. Poles don't make that noise all night." | "Lineman's course, days. Climbing poles in a blizzard. Poles don't make that noise all night." ("Why nights?" gets its answer) |
| n8 | phone_agent0x99.ink:180/184/188 | no | "…It's how we find out what she's burning." | "…It's how we find out what Sorensen's burning." (the clerk is the last person named before it) |

---

## 4. Step 2, fresh run

- **2a Attribution: OK.** Every prefix resolves (validator), and there's no `#speaker:` tag. Narrator lines appear only in person-chats and cutscenes.
- **2a-bis Scenario support: OK.**
  - Noor's "rang through" needs no prop.
  - The Tomb Beta line matches A3-42 at the tape room door ("through there").
  - The "notes column" text matches Series L's notes: son, drinks, lonely.
  - The guard's log `onRead` is wired, and `incident_log_read` is declared (ERB L2577).
- **2a-ter Voices: OK.** Nothing new.
- **2b Choices: OK.** The SAFETYNET hatch arm removes the opening's two buttons, but no choice quotes something that wasn't said.
- **2c / 2c-bis: OK** (loopcheck).
- **2d Choices that matter: OK.** R1 m9 makes Noor's cover pay back at the hatch. m2 is the one route where it lands wrong.
- **2e State: OK.** `noor_cover` is declared and synced, and two files read it.
- **2f Influence: N/A** (contract §6.1).
- **2h KO: OK.** A SAFETYNET-cover player who knocks Noor down after the cover still gets "Noor rang through", which is plausible: she rang before she was hit.
- **2i Pass-4 bugs.**
  - Same fact twice: m1, m4, n4.
  - Status rows: m5 from R1 holds. n3 is wording only.
  - The texts were checked by hand, as the lint can't parse them. All are ≤25 words, with no banned words.
  - A3-37 ("A cipher is only as safe as its key") and A3-41 ("A log nobody reads is a diary") each end on an aphorism. Both are new teaching lines, and one each is fine. A third would start to sound like a pattern.

### The less-reviewed cast, and recurring characters against m01–m08

- **Old Coyote** (new). Dry and specific: "Auditors bring coffee", "It hasn't jammed once all week. Believe me, I'd know." Both covers get a different reply, and the truth sends him to the truck. Series L has a lineman foreman ("Vernon Teague… substation keys"), which is a nice quiet echo of his ambition. n7 only.
- **Dillard** (new). One line, "Dillard, Statewide Security. Stay where you are." Tran's "Somebody from Statewide is on his way, and he bills by the hour." sets him up. OK.
- **Noor** (new). Guarded and quick: "Recruiting? I file deeds for dead ranchers." Her two hub re-entry cycles differ by cover. OK.
- **Tran** (new). m3 only.
- **Gary** (m02). Still himself: "stood at a keypad", "Director of Cyber Security, me", the lanyard joke. "Somebody should read an archive properly for once" pays off m02's "By the end I was writing them for the archive" (`m02_npc_gary_whitlock.ink`), and the guard's log "NOTED." echoes his "noted, and noted". Only the n6 colon reads like a manual. His employer: m02's debrief puts him at Royal Northern on the exposed route, so "Whitlock, from St. Catherine's" works as how the agent knows him. "St." is the campaign's spelling (216 uses), so I haven't flagged it.
- **Torres** (m05). m09 never contracts ("I am still a live placement", "Do not thank me"). m05's Torres contracts in about a third of his confrontation lines ("I've known for two months", "I'll do it"). Script edit R2/R3 ruled "I am" / "Do not" recognisably him, and the stiffness suits a man still frightened. I'm noting it, not reopening it.
- **Nightshade** (m07/m08). Collegial, an image instead of jargon: "Every lock is a promise somebody made years ago." That matches m08's "It wears smooth." OK.
- **The Recruiter** (m05). Still prices everything ("Consideration, one deck. Booked."). OK.
- **HaX.** The same woman throughout. The new teaching lines are clipped and costed. The one aside is m4, a repeat.
- **Netherton.** Full forms on every verdict except n2. "This one didn't, Quintero." is a retort, so the contraction is fine there.
- **Sorensen.** "The Architect" in her mouth is right. She stays unhurried and exact: "Of course. He'd want to be read."

---

## 5. Spoken lines these fixes would change

| Finding | Speaker | Clips |
|---|---|---|
| m1 | HaX | 0 new; the long margins line is orphaned |
| m2 | Sorensen | +1 new |
| m3 | Tran | 1 reworded |
| n1 | Sorensen | 1 reworded (shared by hatch and door, so one clip) |
| n2 | Netherton | 1 reworded |
| n7 | Old Coyote | 1 reworded |

m4, m5, n3–n6 and n8 are unvoiced.

## 6. Top five

1. **m1.** R1's n6 branch never fires on the main route, because the phone runs the opening's `#set_global:hand_matched` only after the whole batch. HaX still says "my old course notebook… Same hand" and then "The notebook in my case file is from his course." Make the short line unconditional.
2. **m2.** On the SAFETYNET cover, a player who then stops Noor phoning hears Sorensen open with "Noor rang through." Branch on `noor_told`.
3. **m3.** Tran says "Fine. It's off." and then, on "[No deal.]", "The wipe keeps running."
4. **m4.** The new leaver line in `[About the name.]` repeats "never revoked / seven years" for the third time tonight.
5. **m5.** The new safe text "People pick numbers they'll never forget. So can we." says the wrong thing.
