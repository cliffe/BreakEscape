# m10 Full Disclosure: NPC dialogue review, round 3

Phase 4 (dialogue), round 3. Reviewer: Opus, read-only on game files. Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh over all 31 inks, the HaX texts and barks in `scenario.json.erb`, and the closing scenes. Base: commit `1625879bc` (dialogue R2, scenario design R2, puzzle chains R1, playtest R1). Line numbers are for that commit.

**The working tree moved during the review.** A fixer is applying scenario design R3 and puzzle chains R2 (uncommitted: `director_netherton`, `phone_agent0x99`, `tesseract`, `carryover_vars`, the ERB). Each finding below says whether the tree already deals with it. I also compiled and loop-checked the tree's inks (31 compile, 31 clean) and read its new lines (§5).

**Verdict: accept with fixes.** 0 blockers, 0 major, 5 minor, 8 nits. All of R2's findings are closed. Two of this round's points (the captured-Voltage status line and a text collision) are already fixed in the tree and aren't counted.

The new material reads well. "If that's wrong, …" is the right shape for all six accusation checks. The trace lines tell one story from the core ("I'm on Zero Day's.") through to Netherton at 06:00 ("Four buyers, and one of them was careless."). On a stopped trace, the text, the arrival ("Nothing left the lock.") and 06:00 ("The cells got nothing at four.") all agree. HaX's loose-end lines are short, in voice, and in the right order. The main problem is the new "[Going to it.]" step, which makes the player say the same thing twice in all four voices.

---

## 1. Step 1: compile, validator, lint, loops

| Check | Result |
|---|---|
| Compile (inklecate on copies in `scratchpad/dlg_r3/base_ink`, `tree_ink`) | 31 files at the commit, 31 in the tree, 0 failed, no loose ends. The committed JSON is identical to a fresh compile |
| `validate_scenario.rb --no-graph` | New dialogue-facing items: three text collisions (`hax_jammed` 1.5 s/4 s, `workshop_floor` 4 s/6 s, `clue_bench_log` 1.5 s/3.5 s) and `ns_borrow_hint` set but never read. The tree fixes the third (T-62 at 10 s) and the fourth (HaX's alibi topic reads it). R2's withdrawn bark/chat repeats are unchanged |
| `dialoguelint.mjs` | 9, the same set R2 withdrew (blank-reentry 5, crowded-hub 2, not-x-but-y 1, us-spelling 1). It doesn't flag Netherton's new reply-less exit (m2) |
| `loopcheck.js` | 30 of 30 clean at `start` (the carryover include has no `start`), plus `cut_call` and `cut_done` for Vance, Elena and HaX, Netherton's `tether` and captured Voltage |
| Simulations (`scratchpad/dlg_r3/scripts/sim.cjs`, `full.cjs`) | Warning × 5 loose-end combinations; arrival × 3 trace states; Netherton silent aside and re-talk; Gary on KO and card-cloned; HaX `where_are_we` × 5 power-room states; the four by-hand calls; core end-to-end on rich, cold and mixed saves; 06:00 on a rich traced save |
| Phone texts by hand (trace-gone ×2, forward-post pointer, T-59 ×2, T-60 ×2, T-62) | All ≤ 21 words, UK spelling, no banned words, no printed variables. Findings m4, m5, n1 |
| Standing rules | No printed variables in voiced lines. Netherton's one changed line ("They are still not.") uses full forms. Elena's American forms ("gray", "labeled", "Go pull it") match her voice block (`erb:463`) |

---

## 2. R2 findings: status

| R2 | Status |
|---|---|
| m1 "I'll keep." twice | **Closed.** `tesseract:244` "I'll be here." (existing clip). The simulation shows warning → loose end → "I'll be here." |
| m2 the extra "afterwards" | **Closed.** `:639` "once he was locked up". On the rich run, "afterwards" first comes in "Let it hurt afterwards", then at HaX's 06:00 |
| m3 Asante's controllers | **Closed.** `asante:42` needs `asan_shown`, and entry 0003 on the schedule is "Water treatment controllers, a city utility" (`erb:379`), so "the utility's fault" is the right referent |
| m4 Wendell bark when hidden | **Closed.** `erb:3243` adds `!m04_voltage_captured` (and `cut_step !== 2`) |
| m5 T-60 on a cold start | **Closed.** Split on `m02_completed` (`erb:1840–1843`). The cold form names only the class |
| n1 Vos, n2 Netherton, n5 T-59, n6 exchange 1 decoy, n7 Elena's card row | **Closed** |
| n3 Wendell "Well?" | **Departure stands** (R1's) |
| n4 `box_topic` | **Closed.** "You've broken out of one of those tonight." is true whenever the topic shows: it needs `outer_lock_open`, and the gallery needs flag 3 first (`erb:1746`) |

---

## 3. Findings

V = a voiced line changes or is added (m10 has no audio yet, so a reword only changes what gets generated later). T = a text, choice or mapping (unvoiced).

### Minor

**m1. "[Going to it.]" → "Go and pull it" → "[Got it.]": the player says they're going, is told to go, and says so again.** `phone_agent0x99:775–776, 789`; `vance_phone:76–80`; `elena_phone:81–85`; `voltage:193–194`. **T.**
The instruction answers a choice in which the player has already committed to the action, and then a second acknowledgement ("[Got it.]", "[On it.]") follows. The skill flags this pattern (the same fact twice, across a choice and its reply). All four voices do it.
Proposed: reword only the choice, in all four files: `+ [Anything else before I pull it?]`. Each instruction then reads as a safety check, and Vance's "…Go and pull it. Nothing else." becomes a direct answer. No voiced line changes. Keep "[Got it.]" and "[On it.]".

**m2. Netherton's "[Let me think about it.]" closes the chat on the player's own line.** `director_netherton:334`. **V (new).**
The `exit-no-reply` rule (person-chat). He has just set out both costs, and he doesn't answer.
Proposed: before `~ neth_quiet = true`, add `Director Magnus Netherton: Do not take long. Nobody goes below until you answer.` (full forms; true, because the split needs `door_scene_done`). The tree's R3 n1 reorder ("Start the gate console…" then "Nightshade's in the van." then the question) fixes the pronoun problem, and I'd keep it.

**m3. Gary still says "talk to him first" after Imran's card has been cloned.** `gary:39–43`. **V (new).**
The playtest fix covers `ko`. On `card_cloned`, Imran's ink parks him at rest (`imran:23`) and he can't be talked round any more, so "Talk him round or take him in, but talk to him first." is false. The player can reach Imran before Gary.
Proposed:
```
{
- imran_outcome == "ko":
    Gary Whitlock: That's Imran on the floor at the far bench. I trained him.
- imran_outcome == "card_cloned":
    Gary Whitlock: That's Imran at the far bench. I trained him.
- else:
    …(current)
}
```

**m4. T-28 "Shutter's dead. The hall's next." now fires on every cut, so it's wrong in one order and repeats the voice in another.** `erb:1714`. **T.**
(a) The map is linear (workshop → power room → server hall → gallery, `erb:3248–3448`), so a player can take flags 2 and 3 before the cut. The cut then opens the stair (`erb:1746`) and "The hall's next" sends them back. Before P2 this only happened on NPC cuts; now it also happens on HaX's talk-through.
(b) After a Vance or Elena `cut_done` call ("That's it. Shutter's dead…" / "Done. That shutter's dead…") or captured Voltage's bark, HaX repeats "Shutter's dead" a second later.
Proposed: three forms of the one-shot mapping, first match wins:
- `flag2_submitted && flag3_submitted`: "Shutter's dead. The stair's open."
- `cut_step === 3 && (!phone_voice_is_hax || voltage_outcome === 'by_hand')`: "The hall's next."
- otherwise: "Shutter's dead. The hall's next." (as now)

**m5. Two new text pairs stack.** `erb:1595` + `:1725`; `erb:1832` + `:1838`. **T.**
On the jam lifting, "Lost you up there. I'm back." (1.5 s) and the trace-gone text (4 s) arrive 2.5 s apart. On entering the workshop with the sleeper already caught, "That's his sheet. Read it." (4 s) and the T-59 twin (6 s) arrive 2 s apart. The validator flags both, and the first toast is gone before it can be read.
Proposed: trace-gone `delay` 4000 → 7000 on the jam form; T-59 twin 6000 → 10000. (The third collision, T-62, is already 10 s in the tree.)

### Nits

| # | File:line | Current | Proposed | |
|---|---|---|---|---|
| n1 | `erb:1724–1725` | "Your trace is gone. Their order was pulled before it went, so there was nothing to follow. Zero Day got nothing instead." ("Their" can read as Vos or Victoria; "instead" has nothing before it) | "Your trace is gone. Zero Day's order was pulled before it went, so there's nothing to follow. They got nothing." (19 words) | T |
| n2 | `tesseract:813` (tree `:831`) | "[Your Alpha notes made students decode it themselves. Now you'd do it for everyone.]"; the tree has "…do the hurting for everyone." (15 words, over the under-fifteen cap at CONTRACT:614, and it mixes the decoding image with the hurting one) | "[Your Alpha notes made students work it out. Now you'd hand everyone the answer.]" (14). His reply "I was younger. I meant it then." still fits | T |
| n3 | `gary:63` | Over a knocked-out Imran, "That's Imran on the floor… I trained him." is followed straight away by the joke "I'll be the one with the lanyard." | `{imran_outcome == "ko": Gary Whitlock: I'll be with him.\|Gary Whitlock: I'll be the one with the lanyard.}` | V (new) |
| n4 | `elena_phone:82` | "Third from the left. Go pull it, and leave the others alone." follows "Leave the rest alone, they feed the hall." one line earlier | "Third from the left. Go pull it." | V |
| n5 | `phone_agent0x99:772` | "The painted toggle under the row. Down. Their monitor up there just went dark." (it went dark before the player has touched it) | "The painted toggle under the row. Flick it down, and their monitor up there goes dark." | V |
| n6 | `tesseract:236` | "You never read his sheet. It's on the workshop bench." (the sheet is "pinned above the bench", `erb:3142` and the task title `:1407`) | "You never read his sheet. It's pinned above the workshop bench." | V |
| n7 | `erb:3372–3373, 3379–3380` | "The third breaker from the left down, where you pulled it." (reads as "from the left down") | "The third breaker from the left is down, where you pulled it." | T |
| n8 | `phone_agent0x99:150`, `:136` | "Pick up when they ring.": after a "Give me a minute" they ring only from the isolator or on re-entry. A player at step 2 who has already been in the server hall gets "The console takes the staging copy." (the step-2 line is lower in the ladder) | "Go to the isolator. They'll ring." Optionally, above `flag2_submitted and flag3_submitted…`, add `- cut_step == 2 and not gallery_shutter_cut: Third from the left in the power room. Go and pull it.` | V |

Already handled in the tree, not counted: HaX's status line during captured Voltage's talk-through ("Talk to them first" at step 2; PC R2 m2 adds "He's talking you through it."), T-62's collision (10 s), `ns_borrow_hint` unread (now read in `alibi`), and the forward-post pointer firing on a walk back (now `!data.previousRoom`, load only).

---

## 4. The last ten minutes, on three saves

Core end-to-end, then 06:00 on the rich save. Read for truth, voice and rhythm, with this round's lines in place.

- **Rich** (m01–m09, m09 taken, m05 funded arrest, m07 redirected, backdoor open, Zero Day traced). Arrival: "Zero Day has it. You didn't stop that one." / "Confirmed. Zero Day's share went, and I'm on it." Warning: HaX names the backdoor. If the player says "Go on" anyway, the stop costs "Fourteen million systems." The warning gave fair notice, and the consequence follows it. The Torres sting now says "once he was locked up". Netherton's costs, HaX's coordinated-disclosure line and "Arrest me, then." follow. At 06:00: the walkabout, Ghost's text, "Zero Day got its two hours." then "We followed Zero Day's share. Four buyers, and one of them was careless.", "Two maps now.", "They are still not. That was my signature too.", "It's afterwards." / "The night he left…" / "I said no. It took me till morning." The trace is acknowledged at the core and paid off at six. Voltage's line holds on both captured cuts ("doing my job for me" on `by_hand`).
- **Cold** (m10 only). Warning: "You never read his sheet. It's on the workshop bench." (n6). Exchange 1's new decoy "[Your figure's a guess dressed up as sums…]" → "I can. I did the sums. You didn't read them." works as a comeback and agrees with HaX's warning. T-60's cold form fits a player who has never seen Base64. Nothing on this route assumes an earlier mission.
- **Mixed** (m02 + m04 escaped, Vance ally, Kowalczyk down, both shares out). The by-hand cut goes through Vance: "[Going to it.]" → "…Nothing else." → "[On it.]" (m1), then his `cut_done` call and HaX's "Shutter's dead" a second later (m4b). At the core: "Two cells have it." / "Confirmed. Both shares went at the lock." Scorched Earth: the purge, "Afterwards, then.", "Out, 0x00." It holds up.

On a stopped trace, the text, "Nothing went at four. You were thorough." / "Confirmed. Nothing left the lock." and "The cells got nothing at four." agree. Executed and Join are unchanged since R2.

---

## 5. The tree's new lines (in flight, for the fixer)

Read only, since these are uncommitted. All are in voice and true where I traced them.
- `tesseract` loose2: "Not yet" → re-talk → "All four. Good. Now it's my turn." → the next loose end, once. Simulated with the backdoor and the sheet open: the backdoor first, then the sheet, then the choice on its own. Fine.
- `where_are_we` "The core. …": "The core. You're in. His box first." stacks two short openers. Optional: "The core. His box first."
- `alibi`: "Nightshade said they always borrow a badge. Ten past two is when it was borrowed." Optional: "…Ten past two is when this one was."
- Wendell's "Your funeral. I didn't see a thing." and captured Voltage's isolator bark (his opener reused): both fine.
- n2 applies to the tree's new Alpha wording.

---

## 6. Voiced lines in this round's proposals

| Speaker | New | Reworded | Findings |
|---|---|---|---|
| Netherton | 1 | – | m2 |
| Gary | 2 | – | m3, n3 |
| Elena | – | 1 | n4 |
| HaX | – | 3 | n5, n6, n8 |

m1, m4, m5, n1, n2 and n7 are unvoiced.

---

## 7. Top five

1. **m1**: in all four voices the by-hand cut ends "[Going to it.]" → "Go and pull it" → "[Got it.]". Reword the choice to "[Anything else before I pull it?]" (unvoiced).
2. **m4**: the merged "Shutter's dead. The hall's next." is false once flags 2 and 3 are done, and it repeats Vance, Elena and Voltage a second after they say it.
3. **m3**: Gary's "talk to him first" is false after Imran's card is cloned.
4. **m2**: Netherton's "[Let me think about it.]" exits on the player's line. Give him one short reply.
5. **m5**: two new text pairs arrive 2–2.5 s apart (trace-gone after "I'm back", T-59 twin after "Read it").
