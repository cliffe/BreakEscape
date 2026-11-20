# m10 Full Disclosure: NPC dialogue review, round 4

Phase 4 (dialogue), round 4. Reviewer: Opus, read-only on game files. Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh over all 31 inks, the HaX texts and barks in `scenario.json.erb`, the three new VM-gating objects and the closing scenes. Base: commit `4e87628ec` (dialogue R3, scenario design R3, puzzle chains R2, VM gating F12/F13). Line numbers are for that commit.

**The tree moved during the review.** A puzzle chains R3 fixer is editing `phone_agent0x99.ink`, the ERB, CONTRACT and the texts file (uncommitted): the tag now hangs off "their gate terminal", the duty card is a duty sheet, the core key has moved to his terminal, and step 1's wait reply is "Take it. I'll ring you back." The login strings are filled in. Where the tree already deals with a point, I say so and don't count it. §5 has notes on its new lines.

**Verdict: accept with fixes.** 0 blockers, 0 major, 4 minor, 8 nits. R3's findings are closed. One of them (m3) turns out to be moot, though the fix is harmless.

The new lines mostly land. Netherton's "Do not take long. Nobody goes below until you answer." is in his register and true, because the split needs `door_scene_done`. Gary's "I'll be with him." pays off at 06:00 ("I sat with Imran till the medics came."). Wendell's "Your funeral. I didn't see a thing." suits a man who was told nothing and doesn't want to know. The loose-end follow-up names the next open item once, and the cold, rich and mixed core runs read cleanly. The main problem is the new step-2 button: "[Anything else before I pull it?]" asks the very question the camera answer exists for, and all four voices leave the camera out.

---

## 1. Step 1: compile, validator, lint, loops

| Check | Result |
|---|---|
| Compile (inklecate on copies in `scratchpad/m10_dlg_r4/ink`) | 31 compile, 0 failed, no loose ends. The committed JSON is identical to a fresh compile |
| `validate_scenario.rb --skip-ink --no-graph` | No new dialogue-facing items. R3's stacked text pairs are gone (trace-gone at 7 s, T-59 twin at 10 s, T-62 at 10 s). What's left is the set earlier rounds withdrew: the `blast_tunnel` pair (exclusive imports), the two door-log bark→chat repeats, and the cutscene `onceOnly` notes |
| `dialoguelint.mjs` | 9, the set R2 and R3 withdrew (blank-reentry 5, crowded-hub 2, not-x-but-y 1, us-spelling 1) |
| `loopcheck.js` | 31 of 31 clean at `start` |
| Simulations (`scratchpad/m10_dlg_r4/scripts`, R3's harness) | The core end to end on rich, cold and mixed saves; the loose-end follow-up after "Not yet" |
| Standing rules | No printed variables in any voiced line (grep). Phone files max 21 words a line. Netherton's new line uses full forms. No US spellings outside Elena's and Wendell's voices |

---

## 2. R3 findings: status

| R3 | Status |
|---|---|
| m1 "[Going to it.]" twice | **Closed** in all four files (`phone_agent0x99:805`, `vance_phone:77`, `elena_phone:82`, `voltage:194`). The new wording raises m1 below |
| m2 Netherton's exit with no reply | **Closed.** `director_netherton:335`. True: nobody goes below before `door_scene_done` |
| m3 Gary on a cloned card | **Closed, and moot.** `imran_outcome = "card_cloned"` is only written at `gary:166`, on the unprotected `tech` branch. The consultant Gary is visible only on `m02_gary_protected` (`erb:3107`), so `gary:43–44` can never run. It does no harm; keep it or drop it |
| m4 T-28 | **Closed.** Four mappings, first match wins, `shutter_text_sent` (`erb:1728–1731`). There's a small leftover repeat in n4 |
| m5 stacked texts | **Closed.** 7 s and 10 s; the validator is quiet |
| n1–n8 | **Closed.** n1 (trace text), n2 (Alpha button, 14 words), n3 (Gary), n4 (Elena), n5 (camera line), n6 (both sheet lines), n7 (both ERB variants), n8 (both parts) |

---

## 3. Findings

V = a voiced line changes or is added (m10 has no audio yet). T = a text, choice, object or mapping (unvoiced). HaX's hub topics and `where_are_we` are text (CONTRACT §1); her calls are voiced.

### Minor

**m1. "[Anything else before I pull it?]" asks the question the camera answer is for, and the voice leaves the camera out.** `phone_agent0x99:805`, `vance_phone:77`, `elena_phone:82`, `voltage:194`. **T.**
If the player hasn't asked about the gallery camera, they now say "Anything else?" and hear only "Third from the left. Go and pull it." The camera matters: blinded, it sends Fonoti off his post (`erb:3845–3846`). HaX's call then ends on "[Got it.]" with the camera choice gone for this call. A voice that is asked "anything else?" and stays silent about the one other switch reads as withholding.
Proposed: a button that checks the breaker without inviting a list. `+ [Just that one?]` in all four. Every reply still fits: Vance's "…Go and pull it. Nothing else." answers it directly, and so do Elena's, HaX's and Voltage's. No voiced line changes. (If "anything else" is wanted, the alternative is a conditional camera reminder in each voice. That's four new voiced lines, and it takes the choice away from the player.)

**m2. "Ask me who was where at ten past. That's how we clear them." is wrong for Quintero.** `phone_agent0x99:386–388`, `:442–444`. **T.**
The alibi doesn't clear Quintero. It puts Quintero and Kowalczyk in the tunnel (`:303`), and his recall is gated on `clue_bench_log`, not `clue_alibi` (`:94`). On `accuse_wrong` for Quintero, the line comes straight after Anchor's "I took the drain. I didn't pack the case. Read the sheet." The two speakers then point different ways in consecutive lines. `accuse_refused` with `officer_out == "quintero"` does the same.
Proposed: in both places, `{clue_door_log and not clue_alibi and officer_out != "quintero":`. Anchor's own line already points Quintero's player at the sheet.

**m3. HaX's status ladder doesn't name the three new finds, and "The core. You're in." is false once the player is outside the core.** `phone_agent0x99:131`, `:140`, `:174`. **T.**
Each find is named once, in a once-only topic (`hax_monitor_asked`, `hax_hatch_asked`, `hax_box_asked`). "[Where are we?]" is the re-askable answer, and after the gating it is out of date at three stations. Separately, a player who reloads at the forward post with `outer_lock_open` is told "You're in." (R3 §5 also suggested trimming that opener.)
Proposed (all ≤ 25 words):
- `:174` "Their monitoring. Gate terminal. The login's on the maintenance tag."
- `:140` "Get under the release service. The hatch in the sealed section. The duty sheet by the east racks has the login." (tree wording)
- `:131` "The core. His box first. The key's on his terminal." (tree position; on the committed position, "…The key's in the envelope from the gallery rail.")

**m4. "His disarm sits on that box." has no setup, and the hatch topic no longer says what flag 3 does in the game.** `phone_agent0x99:564`. **T.**
Before the player talks to HaX here, no line has introduced "the disarm". The only other uses are the core console's lamp (`erb:4191`) and the 06:00 screen. A player hears "his disarm" and has nothing to hang it on. The F13 rewrite also dropped "That opens the way up to him.", the only in-world reason given for flag 3 (the stair needs it: `erb:1771`, "The hatch. Get under the release service.").
Proposed (story wording only; I haven't checked it against the VM and won't):
```
Get out of the container onto that host. That opens the way up to him.
He keeps a disarm for his own release on that box.
```
The second line uses the same noun as the core lamp and the 06:00 screen, so the three agree.

### Nits

| # | File:line | Current | Proposed | |
|---|---|---|---|---|
| n1 | `phone_agent0x99:767` | "I'll ring you back when you're at it." The once-only re-ring on close (`erb:1722`, 1.5 s) rings before the player has moved, which is the problem PC R2 n3 described | "Take a second. I'll ring straight back." (true with the 1.5 s re-ring). The tree's step-1 "Take it. I'll ring you back." holds only via the isolator click or room entry once the close re-ring is spent; it's true enough | V |
| n2 | `vance_phone:43`, `elena_phone:48` | "Right. I'll ring back when you're in the room." / "Okay. It'll ring again when you're in there." The first call fires on `cut_by_hand`, which is set in the power room, so the player is already in it. The re-ring that matters is the isolator click (`erb:2332`, `:2352`) | "Right. I'll ring back when you're at the cabinet." / "Okay. It'll ring again when you're at the cabinet." (their own "cabinet") | V ×2 |
| n3 | `gary:61` + `:69` | On a re-talk over a knocked-out Imran: "You put him on the floor. I'll sit with him till someone comes." → "[I'll see you upstairs.]" → "I'll be with him." The same promise twice in two lines | Keep `:69` (the first talk needs it). `:61` → "You put him on the floor. He's breathing, at least." | V |
| n4 | `erb:1728` | On a Vance, Elena or captured-Voltage save with flags 2 and 3 already in, their "Shutter's dead" is followed by HaX's "Shutter's dead. The stair's open." (R3 m4b, in the one order the fix left) | Split form 1: when a voice has already said it (`cut_step === 3 && !phone_voice_is_hax`, or `voltage_outcome === 'by_hand'`), send "The stair's open."; otherwise as now | T |
| n5 | `six_oclock:98` + `:352` | Bait and kill: Ghost's text "'Five buyers paid for nothing, and you have their names. I kept the money. Clean exit.'" is followed within a minute by Netherton's "The resale's buyers paid for nothing. Five of them, and we have their names." | Ghost: "'You let me sell it, then killed it. I kept the money. Clean exit.'" Netherton keeps the numbers | V (narrator) |
| n6 | `tesseract:415` | On a save with m04 and m01 but no m09 memo: "It was. I'm only reading it back." (`:377`), then "[That was my first day.]" → "It was. I've been reading since." Two "It was." replies in a row | "Yes. And I've been reading since." | V |
| n7 | `phone_agent0x99:300` | "Nightshade said they always borrow a badge. Ten past two is when it was borrowed." ("it" has no clear referent, and "borrow… borrowed") | "Nightshade said they always borrow a badge. Malhotra's was borrowed at ten past two." (true: `:268`) | T |
| n8 | `erb:3340` | Captured Voltage's B-04 bark is his opener word for word, with no `onceOnly`. Click the isolator, then talk to him, and he says it twice in a row; it also repeats on every click | Add `"onceOnly": true`, or bark his re-talk line "The shutter won't cut itself." once `volt_c_seen` is set. Both reuse lines he already has | V (reuse) |

**Withdrawn while checking.** HaX's `gallery_open_call` cutting off Vance's or Elena's `cut_done` call when flags 2 and 3 are already in: delayed mappings wait for an open conversation to close (`npc-manager.js:619–622`), so the two calls queue instead of colliding.

**Already handled in the tree, not counted.** HaX said "the gate console's lead", which is SAFETYNET's Field Console (Gate) (`erb:2543`), while the tag's text says Tomb Gamma monitoring and its observations said "cut from" the lead. The tree has "their gate terminal" and "hanging off". The core key on the gallery rail ("ONE HOLDER… Return to the console on shift change") is also moved: it now sits on his terminal, signed "A.T.".

---

## 4. The last ten minutes, on three saves

R3's harness, run on this commit's compiled JSON, with the core end to end. I read 06:00, the Citadel and the waiting Kowalczyk by hand against each save.

- **Rich** (m01–m09, m09 taken, backdoor live, Zero Day traced). The warning names the backdoor, and "Go on" costs "Fourteen million systems.", so the warning was fair. The records run "Albion…" → "It was. I'm only reading it back." → Derek → "It was. I've been reading since." (n6). Exchange 1 misses, exchange 2 is the notice rebuttal ("No. I didn't send it."), exchange 3 misses, and all three hold up. Netherton's costs name Nightshade's channel and the Voltage watch. At 06:00, Gary on the protected branch with a knocked-out Imran says "I sat with Imran till the medics came…", which is what "I'll be with him." promised. The trace pays off in "Four buyers, and one of them was careless."
- **Cold** (m10 only, door log read, WREN held). "You never read his sheet. It's pinned above the workshop bench." is now right. "I prefer to watch." (no "I told you once"), "Two of yours died at the sites nobody covered.", and Netherton's operations "The order-book watch." / "Our tap on Zero Day's brokers." Nothing assumes an earlier mission. The notice rebuttal is set up by flag 4's cold line, "The notice he wrote to the vendor is on his box."
- **Mixed** (m02 and m04 escaped, Vance ally, Kowalczyk down, both shares out). With nothing open, no loose end is named. Without WREN in play there's no service-door glance, which is right. On this save the by-hand cut goes through Vance: "[Anything else before I pull it?]" → "…Nothing else." (m1: the camera isn't mentioned) → pull → Wendell's "Your funeral." if he was worked round → Vance's `cut_done` → "The hall's next." No repeat, unless flags 2 and 3 were in first (n4).
- **Join and the hearing** are unchanged since R2. The Citadel scene reads well: "He said it had to be one of ours." / "I signed for that agent myself." are full forms and true on every Join.

**Characters earlier rounds touched less.** Ghost's call, Victoria's line, Kowalczyk at the core, the Citadel, Mercer, the minders, Phantom, Vector and Arakawa: all in voice, no printed variables, and every exit gets a reply. The one issue is Ghost's bait text against Netherton's numbers (n5). Phantom's and Vector's in-person wrong accusations don't carry HaX's "Ask me who was where…" nudge. That's fine, because she has no line in those scenes, and her phone hub carries the recall.

---

## 5. The tree's new lines (in flight, for the fixer)

Read only, since these are uncommitted.
- `box_topic`: "He'll have left himself a way out. Find it." followed by "He's left a key envelope on his terminal, stamped CORE. He wants you on his box." That's "left" twice in two lines, and the second line seems to answer "Find it." Put the envelope line first, then "He walled his box off…".
- "Take it. I'll ring you back." (step 1): see n1.
- "duty sheet": consistent across the ERB name, observations and HaX's line. m3's ladder wording above uses it.
- The core key's "For the agent. A.T." suits him (he invited the player) and fits "Get on his box. He'll keep."

---

## 6. Voiced lines in this round's proposals

| Speaker | New | Reworded | Findings |
|---|---|---|---|
| HaX (call) | – | 1 | n1 |
| Robert Vance | – | 1 | n2 |
| Elena Rodriguez | – | 1 | n2 |
| Gary Whitlock | – | 1 | n3 |
| Narrator (Ghost's text) | – | 1 | n5 |
| Dr Adrian Tesseract | – | 1 | n6 |
| Voltage (bark) | – | 0 (reuses a line) | n8 |

m1, m2, m3, m4, n4 and n7 are unvoiced.

---

## 7. Top five

1. **m1**: "[Anything else before I pull it?]" invites the camera answer, and all four voices leave the camera out. Use "[Just that one?]" (unvoiced).
2. **m2**: "Ask me who was where at ten past. That's how we clear them." follows Anchor's "Read the sheet." and is wrong for Quintero. Gate it on `officer_out != "quintero"`.
3. **m3**: "[Where are we?]" doesn't name the tag, the duty sheet or the core key, and "The core. You're in." is false off the core.
4. **m4**: "His disarm sits on that box." has no setup, and the hatch topic lost "That opens the way up to him."
5. **n4/n5**: the leftover "Shutter's dead" repeat on Vance, Elena and Voltage saves, and Ghost's "paid for nothing… names" said again by Netherton a minute later.
