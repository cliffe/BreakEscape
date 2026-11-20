# m09 Digital Archaeology: NPC dialogue review, round 4 (phase 4)

Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh. **Ref reviewed: HEAD `d23cc35f3`** (scenario design R5 fixes: HaX's status row outside the cage, "the Initiative's recruiting interviews", comments). I started at `13b46379a` (the dialogue R3 fixes), and I recompiled and re-read HaX's ink at `d23cc35f3`. Line numbers are at HEAD.

R3's hot spots (the debrief's pen, HaX's identity scene, the Recruiter's offer, the notice topic) were checked, not re-polished. Most of the time went on scenes earlier rounds barely touched: Old Coyote, Noor, Tran, the guard, Gary, Torres, Nightshade, Sorensen in the cage and at the door, HaX's hub topics and status ladder, every HaX timed text in the ERB, the readables the dialogue points at, and the credits.

**Counts: 0 blocker, 0 major, 4 minor, 5 nit.** Every R3 finding is resolved (§2). Three of the four minors are in places no earlier round looked at: the cage, a hub topic and two ERB texts.

Voiced means sent to TTS: the briefing, the debrief, the Alpha clip, every person-chat (with its `Narrator:` and `Agent HaX:` lines), the Recruiter's call, and HaX's `deck_resume`, `identity_scene`, `identity_resume` and `tesseract_call`. Everything else is unvoiced.

---

## 1. Tools

| Tool | Result |
|---|---|
| `bin/inklecate` to scratch | All 15 story inks compile with no warnings. Every scratch JSON matches the committed one, at `13b46379a` and, for HaX, at `d23cc35f3` |
| `validate_scenario.rb` | 0 errors; every speaker prefix resolves. The same 6 lint hits R1 withdrew, the ruled onceOnly-overlap warnings, and the `biometric` lockType warning on `open_plan_cabinet` (design territory) |
| `dialoguelint.mjs` | 0 errors; `not-x-but-y=5`, `you-after-choice=1`, all previously withdrawn. The ERB lints as `texts=0`, so I checked every `text_map` string by hand: all ≤25 words, no banned words |
| `inklint.mjs` | No findings |
| `voicelines.mjs` (12 voiced or mixed files) | No errors, no printed variables in voiced lines |
| `loopcheck.js` | HaX `support_hub` (flag 2 in, cage open, `in_cage=false`; and the deck chosen with the card held), Sorensen cage `start` (file held), Noor `start` (`ledger_page_seen`), Old Coyote `challenge`, debrief `start`: no runtime errors, no starved knots |

---

## 2. Round 3 findings, and the lines they changed

| R3 | Status | Check |
|---|---|---|
| m1 Netherton's send reply | **Resolved** | `closing_debrief.ink:149` "Then it goes tonight, under my name." Full forms; the hub's "Then I sign." (L165) now follows something different. Good in his voice. |
| m2 A3-12b and A3-39 | **Resolved** | ERB L264: "…then printed it at the top of every page." True: the rent ledger's `observations` says "Every page is headed with the same date." ERB L364: "A bonus in her first week. Her dad's dialysis already on file." True on both routes to `noor_told`. On the bonus route Noor has just said both facts aloud. On the ledger route the player has read LINNET's row ("$500, filing bonus -- Father, dialysis, Dearborn"). |
| m3 Albion report line | **Resolved** | `phone_agent0x99.ink:702`. True on `partial` without crew lost and on `quiet`. |
| n1 identity opening | **Resolved** | L395 "The writing on Nightshade's file. I put it beside…": no reproach, true on both routes. |
| n2 "Somebody in your outfit…" | **Resolved** | `sorensen_hatch.ink:175`, `sorensen_door.ink:41`. One clip shared by both. It also echoes the Reading's page 2 ("Someone at SAFETYNET is careful with them."), so she is quoting the Architect's file, which suits her. |
| n3 Tran's price | **Resolved** | `jesse_tran.ink:59`. "kill the wipe" is him. The `[Go.]` reply (L70) names the number. "One number" and then "The Bozeman number gets one call" read as a price and then a promise, so they don't repeat. |
| n4 leaver line | **Resolved** | L711 "…we take back their kit and shut their accounts the same day. Not his." |
| n5 "plan cabinet" throughout | **Resolved** | No "plan chest" left in the inks, the ERB or the texts. Nightshade's call, the schedule's margin and the cabinet's `observations` all agree. |
| n6 A3-24 | **Resolved** | "Tell her it found us the bunker." |
| n7 briefing database | **Resolved** | `briefing.ink:272` "he's building it from that database." "He" is the Architect from the three lines above. |
| n8 Netherton's knock-out line | **Resolved** | `closing_debrief.ink:278` "You knocked me down at the Citadel…" is now distinct from HaX's "You put me on the floor". |
| n9 schedule, not rota | **Resolved** | ERB L1085 "NOT ON THE SCHEDULE. MRS. S SAYS SCHEDULED." reads as the guard's flat American and makes the contradiction he noted. Series L reads "control room schedule". No "rota" anywhere in the ERB. |
| §4 coin-toss aside | **Resolved** | `phone_recruiter.ink:136-138`. It now follows her whole offer, as HaX's other asides do. One knock-on repeat (n1). |

**`d23cc35f3`:**
- `phone_agent0x99.ink:964-969`: "Keep moving. Someone's been waiting for you to come up for air." True outside the cage. The call rings on room entry 15 s later.
- L844: "the Initiative's recruiting interviews" fixes the "her" with no referent. On a cold start it brings in a term the player hasn't heard yet (nit n5).

---

## 3. Findings

### Minor

**m1. The tape room topic still sends the player to the safe after they've taken the card.**
`m09_phone_agent0x99.ink:759-762`. Unvoiced.
- The topic `[The tape room.]` shows while `deck_choice_made and not tape_room_entered`, and always says "Her card for the tape room will be in the safe. It's a floor safe, in her office."
- A player who opens the safe, takes the card and asks before walking north hears that the card they're holding is still in the safe. The status ladder already handles this case (L958, the `tape_card_held` row, scenario design R1 n2). This topic was missed.
- Proposed: branch on `tape_card_held`:
  - `{tape_card_held: Her card's in your hand. The tape room's north of the restricted stacks.`
  - `- else: Her card for the tape room will be in the safe. It's a floor safe, in her office.}`
- The held arm is the status row's string, so nothing new needs writing.

**m2. In the cage, Sorensen is told to put down a stamp she isn't holding, and then she sets it down.**
`m09_sorensen_cage.ink:59` (choice, unvoiced) and `:71` (Narrator, voiced).
- In the cage she is "at the shredder's feed, working through a box sheet by sheet" (NPC `observations`), and her own opening says she "feeds another sheaf into the shredder".
- The rubber stamp is an object on the hatch shelf in the restricted stacks. The player has just dusted it there for the print that opened the plan cabinet, and the lever needs that cabinet's file. So the player has seen the stamp left behind in another room when they're told "Put the stamp down", and then hear "…and sets the stamp down."
- Current choice: "[It's over. Put the stamp down.]"
- Proposed choice: "[It's over. Step away from the feed.]"
- Current L71: "Narrator: She reads the label on the file in your hand, and sets the stamp down."
- Proposed L71: "Narrator: She reads the label on the file in your hand, and puts the sheaf back in the box." This leads into L75, "She takes her hand off the feed. The shredder runs on, empty." One Narrator clip reworded.

**m3. "His file" means Nightshade's file, but it sits beside "his box", which means Tesseract's.**
ERB L289 (A3, `flag3_submitted` without the file) and L300 (A3, `flag4_submitted` without the file). Unvoiced.
- L289 "Bring me his file. Then we say it." lands just after flag 3, which proves the box belongs to "one of ours". On that route nothing has yet called the cabinet's contents "Nightshade's file": the cage text only says "That cabinet takes a print". So "his" reads as the box's owner.
- L300 "His file first. Then the rest of his box." gives "his" two different men in eight words.
- The status ladder names the file correctly ("Bring me Nightshade's file from the plan cabinet in the cage", L948).
- Proposed L289: "Bring me Nightshade's file from the plan cabinet. Then we say it." (11 words)
- Proposed L300: "Nightshade's file first. Then the rest of his box." (9 words)

**m4. The briefing's "his door" points at Nightshade.**
`m09_briefing.ink:68`. Voiced (Netherton). Coordinate branch: `m08_completed and m08_tomb_gamma_location_known`.
- Current: "Nightshade gave us a coordinate. What gets us through his door is in Helena."
- The only man named in the scene so far is Nightshade. The Architect isn't introduced until `the_suspect`, about twenty lines later, so "his door" reads as Nightshade's. The door is meant to be the Architect's, and Tesseract's call pays it off ("the door will open for you by name").
- Proposed: "Nightshade gave us a coordinate. What gets us through the door at the end of it is in Helena." Full forms are kept, and the door stays in place for the payoff. One clip reworded.

### Nits

| # | File:line | Voiced | Current | Proposed |
|---|---|---|---|---|
| n1 | phone_recruiter.ink:221, phone_agent0x99.ink:354 (one shared clip) | yes (HaX) | "WREN's still one of the two on that firm's sheet." On `sleeper_shortlist` the player heard "We're down to two off that firm's sheet." about six lines earlier, in the same call. Same fact, same words | "Her file doesn't change it. WREN's still one of two." (keeps the point that pulling her file doesn't narrow WREN; the two strings stay identical) |
| n2 | phone_torres.ink:31 | no | "…Read the next of kin on each. That is the line they hire on." This is the third "line" in his three bubbles ("a line in a list", "a line in her book"), and this time it means something else | "…Read the next of kin on each. That is what they hire on." |
| n3 | ERB L356, 358, 360, 370 (A3 legacy remark) | no | "Nobody of ours in here. Ours are on her tape, by codename." It usually fires in the cage, beside Sorensen, before the Recruiter has called, so "her" reads as Sorensen. Five seconds later A3-38 says "how she chose them" and means Sorensen | "Nobody of ours in here. Ours are on the Recruiter's tape, by codename." (the Recruiter is named on the briefing wall on every route; it also matches Netherton's "Ours are on it by codename only") |
| n4 | ERB L203 (warned-in-time route) | no | "The legacy files are under Noor's desk. Let her shred the rest." The nearest "her" is Noor, who isn't shredding anything | "The legacy files are under Noor's desk. Let Sorensen shred the rest." |
| n5 | phone_agent0x99.ink:844 (new at `d23cc35f3`) | no | "Those reels are the Initiative's recruiting interviews. The legacy names, in their own voices, saying yes." The Tran topic is open from the first minute. On a cold start neither "the Initiative" nor "the legacy names" has been said by then (both first appear on the ledger and in the cage). m05 and m06 players know the Initiative. | Keep it if the canon term is the point. Otherwise, true on every route: "Those reels are the Recruiter's oldest interviews. Her people, in their own voices, saying yes." |

---

## 4. Step 2, fresh run (the less-visited scenes)

- **2a Attribution: OK.** Every prefix resolves, and there are no `#speaker:` tags.
- **2a-bis Scenario support.** Checked against `connections` and the readables. Four slips, m1–m3 and n4. The rest hold:
  - Geography: west door to the front desk; north shutter; server closet off the open stacks; office west and tape room north of the restricted stacks; salvage cage past the tape room, where Gary's "keypad in a tape library" is correct.
  - Nightshade's "custom keys" matches her card (MIFARE with custom keys).
  - Gary's chart is beside the keypad.
  - The hand tells are in the sources: "loop on the g", "crossed sevens".
  - LINNET's row backs A3-39.
  - The lease date backs A3-12b.
  - "Eleven names" matches Series L.
  - The guard's log backs Old Coyote's "You'd be the first."
- **2a-ter Voices: OK.**
  - Old Coyote is dry and specific.
  - Noor answers questions with questions, and her "Peg" spreads to Tran ("Peg gets what Peg wants").
  - Tran is ironic.
  - Gary is Black Country ("stood at a keypad", "Director of Cyber Security, me").
  - Torres speaks in slow full forms.
  - Nightshade is collegial.
  - Sorensen is unhurried ("dear", "Watch the step on your way").
  - The Recruiter is transactional and American ("check").
  - Netherton's full forms hold on every weighted line.
- **2b Choices: OK.** No choice quotes something unsaid, except m2's stamp, which wasn't there to put down.
- **2c / 2c-bis: OK** (loopcheck).
- **2d Choices that matter: OK.**
  - Old Coyote's three truth buttons, Noor's two routes into `reach` and Tran's lever all pay back: the truck and the credits; Great Falls in the debrief; "left on foot" and the credit.
  - Sorensen's door route makes "[Walk past her.]" a real choice with its own line.
- **2e State: OK.** `in_cage` is now declared in HaX's ink and synced (it was already a scenario global).
- **2f Influence: N/A** (contract §6.1).
- **2h KO: OK.**
  - HaX's KO texts ("She's sixty-six.", "I asked you not to.", "She files deeds, 0x00.") are short and in voice.
  - The debrief accounts for Noor, Old Coyote, Sorensen and Tran on the floor.
- **2i Pass-4 bugs.**
  - Stale status answers: the status ladder holds; the tape-room topic doesn't (m1).
  - The same fact twice in a row: n1 only.
  - Credits checked against each route: Tran's "Walked out and made a phone call" still matches his new lines; the Recruiter's four lines match the four deck outcomes.

---

## 5. Spoken lines these fixes would change

| Finding | Speaker | Clips |
|---|---|---|
| m2 | Narrator (cage) | 1 reworded |
| m4 | Netherton (briefing) | 1 reworded |
| n1 | HaX (one clip shared by the Recruiter call and `deck_resume`) | 1 reworded |

m1, m3, n2–n5 and m2's choice text are unvoiced. Net 0 lines, 3 clips.

## 6. Top five

1. **m2.** In the cage, "Put the stamp down" / "sets the stamp down": the stamp is on the hatch shelf, where the player has just dusted it.
2. **m1.** `[The tape room.]` still says the card "will be in the safe" after the player has taken it. Branch on `tape_card_held`, as the status row does.
3. **m3.** "Bring me his file" right after flag 3 proves the box's owner, and "His file first. Then the rest of his box." uses one "his" for two men. Name Nightshade's file.
4. **m4.** In the briefing, "What gets us through his door" follows "Nightshade" with no other man named yet.
5. **n1.** On the shortlist route, "WREN's still one of the two on that firm's sheet" repeats the coin-toss aside from a few lines earlier in the same call.
