# m09 Digital Archaeology: NPC dialogue review, round 5 (phase 4)

Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh over the whole mission. **Ref reviewed: HEAD `b27b75701`** (the dialogue R4 fixes). No m09 files have changed since that commit. Line numbers are at HEAD.

**Counts: 0 blocker, 0 major, 0 minor, 3 nit.** Every R4 finding is resolved (§2). All three nits are unvoiced ERB texts. Two of them are knock-ons from R4's own fixes: a newly named noun now captures a pronoun in the next sentence or the next text.

Grading follows the user's rule for this round: a minor is something a player would notice; anything smaller is a nit.

Voiced means sent to TTS: the briefing, the debrief, the Alpha clip, every person-chat (including its `Narrator:` and `Agent HaX:` lines), the Recruiter's call, and HaX's `deck_resume`, `identity_scene`, `identity_resume` and `tesseract_call`. Everything else is unvoiced, including every ERB text.

---

## 1. Tools

| Tool | Result |
|---|---|
| `bin/inklecate -o` to scratch | All 15 story inks compile with no warnings. Every scratch JSON is identical to the committed one |
| `validate_scenario.rb` | 0 errors. Every speaker prefix resolves. The same 6 lint hits R1 withdrew are still there, along with the ruled onceOnly-overlap warnings and the `biometric` lockType warning on `open_plan_cabinet` (design territory) |
| `dialoguelint.mjs` | 0 errors. `not-x-but-y=5` and `you-after-choice=1`, all withdrawn earlier. Phone ink max is 25 words. The ERB lints as `texts=0`, so I extracted every `text_map` string and checked it by hand: the longest is 22 words, with no banned words |
| `inklint.mjs` | No findings |
| `voicelines.mjs` (12 voiced or mixed files, uncapped) | No errors, and no printed variables in any voiced line |
| `loopcheck.js` (18 entry/state pairs) | No runtime errors and no starved knots. Pairs run: HaX `start` cold, with the deck chosen and the card held, and with flag 2 in and the cage open outside it; the Recruiter `start` on `sleeper_shortlist`; Sorensen's cage with the file in hand and `left`, and cold; door `door`; hatch, Noor, Old Coyote and Tran `start`; debrief, briefing, Torres, Gary, Nightshade, the Alpha clip `deck` and the guard |
| Netherton's full forms | The only contractions in his lines are possessives, reported speech ("He said you'd know…") and the ruled "This one didn't, Quintero." |
| UK spelling for UK speakers | No US spellings in HaX, Netherton, Gary, Nightshade or Torres |

---

## 2. Round 4 findings, and the lines they changed

| R4 | Status | Check |
|---|---|---|
| m2 cage talk-down | **Resolved** | `sorensen_cage.ink:59` "[It's over. Step away from the feed.]" matches the room: she is at the feed, and her reply "When I've finished, dear." still fits. L71 "She reads the label on the file in your hand, and puts the sheaf back in the box." leads into L75 "She takes her hand off the feed." The order is a hair loose (once the sheaf is back in the box her hand has already left the feed), but it reads as one movement and nobody will notice. Leave it. No stamp is left in any ink line. The only stamp mentions are at the hatch, where the stamp actually is. |
| m1 tape-room topic | **Resolved** | `phone_agent0x99.ink:762-767` branches on `tape_card_held`. That global is declared in the ink, declared in `globalVariables` (ERB L2579), and set by `item_picked_up:keycard` for `tape_room_keycard`, whose type is `keycard` (ERB L275, L2076). "The tape room's north of the restricted stacks" agrees with `connections` (tape_room south = restricted_stacks). It is the status row's string, so asking both gives the same answer, which is fine. |
| m3 A3-14 / A3-15 | **Resolved, with knock-ons** | ERB L289: "Bring me Nightshade's file from the plan cabinet." The player always knows the cabinet by this point: the Recruiter's ring (and so the deck, the office and the tape card) needs `cage_opened`, and entering the cage sends "That cabinet takes a print." One leftover: "Then we say it." (n2). ERB L299: naming Nightshade fixes "his file", but "his box" now reads as Nightshade's box (n1). |
| m4 briefing door line | **Resolved** | `briefing.ink:68` "Nightshade gave us a coordinate. What gets us through the door at the end of it is in Helena." "The door" no longer points at Nightshade, and Tesseract's "the door will open for you by name" still pays it off. "At the end of" a coordinate is slightly loose, but it reads naturally aloud as "where it leads". Not worth a re-voice. |
| n1 her-file answer | **Resolved** | `phone_recruiter.ink:221` and `phone_agent0x99.ink:354` are identical (one clip). On the full call the coin-toss line, about twenty lines earlier, gives "it" its referent. On the hang-up route there was no coin toss, so "doesn't change it" is vaguer, but "WREN's still one of two" carries the meaning. No longer repeats. |
| n2 Torres | **Resolved** | `phone_torres.ink:31` "That is what they hire on." Two "line"s are left ("a line in a list", "a line in her book"), and that echo is deliberate. |
| n3 A3-27a | **Resolved, with a knock-on** | ERB L356/358/360/370 now say "the Recruiter's tape". The "her" ambiguity is gone, but this creates two smaller problems (n3). |
| n4 A3-06e | **Resolved** | ERB L203 "Let Sorensen shred the rest." It fires on `cage_opened`, with Sorensen at the feed. True, because Noor said "It's under the desk." |
| n5 the reels line (fixer's own) | **Resolved: true and clear** | See below. |

**The reels line, `phone_agent0x99.ink:849`:** "Those reels are old recruiting interviews. People this archive placed, in their own voices, saying yes."
- **True on every route.** The server-closet console reads "Series LI, legacy recruitment interviews: 212 reels". Series L is headed "LEGACY PLACEMENTS, NOT SAFETYNET. M.S.", and those placements were made out of this building by its manager. Tran's own answer agrees: "Interviews. Old ones, on reels." The fixer was right that the review's "the Recruiter's oldest interviews" would have misattributed them.
- **Clear on a cold start.** The topic can only be asked after the dock call, so Sorensen, Tran and "the server closet off the open stacks" are all known. "Placed" is the m05 card's word ("the Recruiter's placements"), which every briefing route hears. "This archive placed" is the first hint that the building is more than a records store. It is paid off minutes later by the ledger's "Twenty-three placements" and the legacy section. There is no undefined term ("the Initiative", "the legacy names") any more.

---

## 3. Findings

No blockers, majors or minors.

### Nits

| # | File:line | Voiced | Current | Proposed |
|---|---|---|---|---|
| n1 | ERB L299–300 (A3-15), texts/A_hax_texts.md A3-15 row | no | "Nightshade's file first. Then the rest of his box." This is a knock-on from R4 m3. Now that Nightshade is named, the "his" in the next sentence attaches to him, so on this route Tomb Beta reads as Nightshade's box, a few seconds before the scene that names its real owner. The route is rare (flag 4 submitted without the file, so the cabinet was skipped). The identity scene corrects it at once | "Nightshade's file first. Then the rest of the box." (9 words) |
| n2 | ERB L289 (A3-14), texts/A_hax_texts.md A3-14 row | no | "Bring me Nightshade's file from the plan cabinet. Then we say it." With two nouns before it, "it" has no referent of its own. The status row that says the same thing ends "Then we say the name." (`phone_agent0x99.ink:953`) | "Bring me Nightshade's file from the plan cabinet. Then we say the name." (13 words; matches the status row) |
| n3 | ERB L356, 358, 360, 370 (A3-27a) and L362 (A3-38); texts/A_hax_texts.md A3-27a and A3-38 rows | no | (a) "Nobody of ours in here. Ours are on the Recruiter's tape, by codename." The remark fires when the Series L sheets are read in the cage. The Recruiter's ring needs the cage open, so on nearly every route this comes before her call, and nothing has mentioned a tape of hers yet. (b) Five seconds later, A3-38's "That's how she chose them, and how she kept them" now attaches to the Recruiter, the only woman in the previous text. R4 n3 relied on that "she" meaning Sorensen, and the sheets are signed M.S. | (a) "Nobody of ours in here. Ours are on the Recruiter's books, by codename." (13 words). This is true before and after the call: WREN is in the ledger by codename, Netherton says "Ours are on it by codename only", and it echoes Torres's "a line in her book". (b) "Read the notes column. A son, a drink, boredom, a lonely night. That's how Sorensen chose them, and how she kept them." (22 words) |

Each nit is an unvoiced string change in the ERB and in `texts/A_hax_texts.md`. None of them touches a condition or a global.

---

## 4. Step 2, fresh run

I read every ink file in full, along with every HaX, Recruiter and Nightshade text in the ERB, the credits, the readables the dialogue cites (Series L, the ledger capture, the printed page, the console, the deck) and the room `connections`.

- **2a Attribution: OK.** Every prefix resolves, and there are no `#speaker:` tags. Phone files use no self-prefix. HaX is prefixed only in the Recruiter's and Nightshade's calls.
- **2a-bis Scenario support: OK.** Geography holds on every line that gives directions:
  - west door to the front desk;
  - north shutter;
  - server closet east of the open stacks;
  - restricted stacks north of the reading room, with the office west, the cage east and the tape room north;
  - the salvage cage north of the tape room.
  - Props:
    - The stamp is on the hatch shelf (`sorensen_stamp`), and every line that mentions it puts it there.
    - "Forty-eight boxes" is R-114 to R-161.
    - "Eleven names" is Series L.
    - "212 reels" and "97 of 212" match the console.
    - "Key Card, Tape Store" is the item that `tape_card_held` latches.
  - Sorensen's "Take the print if you like" is deliberate (W-25, PUZZLE_CHAINS W7), not a slip.
- **2a-ter Voices: OK, unchanged.** Old Coyote is dry, Noor answers with questions, Tran is ironic, Gary is Black Country, Torres speaks in slow full forms, Nightshade is collegial, Sorensen is unhurried, the Recruiter is transactional and American. Netherton's full forms hold on every weighted line.
- **2b Choices: OK.** All are first-person spoken lines. No choice quotes something unsaid; the new cage button was checked against the room.
- **2c / 2c-bis: OK** (loopcheck).
- **2d Choices that matter: OK.** Every consequence choice is paid back by the debrief and the credits (bins, deck, Tran, Sorensen, Noor, Old Coyote, the notice, the memo stance, Kowalczyk). None gates the critical path without a second source.
- **2e State: OK.** `tape_card_held`, `in_cage` and `sleeper_shortlist` are declared in the inks that read them and in `globalVariables`.
- **2f Influence: N/A** (contract §6.1).
- **2h KO: OK.** The KO texts are short and in voice. The debrief has a line for each bystander and for Sorensen.
- **2i Pass-4 bugs.**
  - Stale status answers: every HaX hub topic was walked through by stage, and the status ladder too; none goes stale now that the tape-room topic is fixed.
  - Same fact twice in a row: none. The tape-room topic and the status row share a string, but only a player who asks both hears it twice, and that is fine.
  - Pronoun capture: n1 and n3(b), both from naming a noun in the line before.
  - Credits against routes: OK.

---

## 5. Spoken lines these fixes would change

None. All three nits are unvoiced ERB texts. Voiced count unchanged at 378 lines.

## 6. Top five

1. **n1.** A3-15 "Then the rest of his box." now reads as Nightshade's box. Make it "the box".
2. **n3(b).** A3-38's "how she chose them" now attaches to the Recruiter named in the remark just before it. Name Sorensen.
3. **n3(a).** A3-27a's "the Recruiter's tape" usually arrives before any tape of hers has been mentioned. "Books" is true on every route.
4. **n2.** A3-14 "Then we say it." Say "the name", as the status row does.
5. The R4 fixes themselves: the cage button, the narrator line, the tape-room branch, the briefing door line and the reels line are all true and read cleanly. Nothing in them needs re-voicing beyond what R4 already counted.

**Verdict: phase closes.**
