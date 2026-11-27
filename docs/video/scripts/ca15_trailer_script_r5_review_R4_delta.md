# Review R4 (delta, sell/truth and timing together): ca15 trailer script r5 rev R3 (commit 60a02986a)

Script: `docs/video/scripts/ca15_trailer_script_r5.md`. Delta read: `git diff 521f256ad 60a02986a` on that file, the section 13 dispositions, and the two R3 reviews (`_R3_sell.md`, `_R3_timing.md`). Checked against `scenarios/ca15_shadow_it/scenario.json.erb`, `ink/nilesh_solanki.ink`, `public/break_escape/js/systems/npc-needs.js`, `npc-behavior.js`, `tools/video/remotion/scripts/lint-edit.mjs`. Grid, gates and character counts recomputed in Python. No renders, no encodes.

**Counts: 0 Blocker, 0 Major, 9 Minor.**

Verdict: every R3 finding is applied, and applied correctly. The four new VO lines are true of the episode, clear their gates and end at least 0.3 s before the cut. The Minors are in the take specs and the caption plan (three of them would stop the first build or the first take), plus one stale tie-break rule. None changes a line of narration.

## R3 findings: applied?

| R3 finding | Applied | Check |
|---|---|---|
| Sell m1 (v31) | Yes | "The official way's slow." (4 words, no stop). Gate 3.16 - 0.1 - 0.3 = 2.76, rate read 2.28, slack 0.48. Truth: `habitLine` is erb :664 ("When the official way is too slow, tell IT rather than build your own way round it"); :661 is `noBlameLine`, so the script's correction of the R3 review is right. Nilesh ink :65 repeats the phrase. Section 1 step 3 and the truth check agree |
| Sell m2 (v33) | Yes | "Then it's broken into. IT never knew the copy existed." Ten words (4 + 6), stops read 4.95 + 0.3 = 5.25, rate read 5.70, gate 6.32 - 0.1 - 0.3 = 5.92, slack 0.22. "Broken into" is erb :691. Caption A 22. Reserve v33s unchanged |
| Sell m3 (v37) | Yes | "Your turn." Gate 2.53 - 0.1 - 0.3 = 2.13, worst 1.14. Card and tab read "Now it's your turn" and `YOUR TURN`. The caption paragraph says so |
| Sell m4 (v34) | Yes | "Unknown devices plugged into work laptops. Even a USB stick." Ten words, stops 5.25, rate 5.70, gate 6.32 - 0.2 - 0.3 = 5.82 (5.816 unrounded), slack 0.12; at v11's 0.576 s a word it is 5.76, slack 0.056, still a pass. Reserve v34r is 9 words, 5.13 |
| Sell m5, m6, m7 | Yes | v38 truth check carries ink :61 and the 4 + 2 row split; chip truth check carries erb :433 and :671; question 9 fallback chip `SOMEONE FINDS IT`; section 9 row 5 limited to the full episode's `mission.json` :3 |
| Timing M1 (t19 hidden player) | Yes, with one tightening (m3 below) | `playerHears` (npc-needs.js :5744) takes distance from `W().player.body.center`, so a hidden sprite still hears; the hook line is a chat turn, `bubbleMs` min(4000, 2500 + 50 x 32) = 4.0 s, so the "at least 3.5 s" assert has 0.5 s spare |
| Timing m1 to m5 | Yes | "Which read governs", v36c lead from `drop_land`, Nilesh clip 7.368 s (speech 0.176 to 6.943), bag priming with `sig`, voicing order. m4(a) has a code error (m1 below) |

Recomputed and passing: grid 7 + 10 + 11 + 5 + 8 + 10 + 10 + 8 + 6 + 5 + 4 + 9 + 12 + 11 = 116 beats, 116 x 60 / 95 = 73.263 s, b28 = 17.684 s is the cut into the red card; narrator words 9 + 11 + 4 + 7 + 10 + 10 + 7 + 6 + 2 + 9 + 11 = 86; Variant A 88; every line at or under 1.58 words a second; no dash of any kind in any VO line; no "Your call", no "Break Escape" on screen (the only hit is the rule); close plate "Learn on Hacktivity.co.uk"; every zoom in its allowed set and every centre a whole pixel (unchanged from R3).

## Beat 7 hold: 2.42 s is right, the reviewer's 2.1 s is not

The beat is 10 beats = 6.316 s. In = `c3_pick` - 3.9, so the pick lands 3.9 s in and the picked option holds 6.316 - 3.9 = 2.42 s. The 2.1 s figure only comes out if the in point is about 4.2 s ahead of the pick, which neither review nor script says. The take supports it: t16 holds card 3 for 4.5 s before the pick (3.9 needed) and 3.5 s after (2.42 needed). Section 5 beat 7 is consistent with section 6 and section 13.

The v34 read also holds. "Even" starts at lead 0.2 + 6 words x 0.495 + 0.3 stop = about 3.5 s on the slow read (2.6 to 2.8 s on the analogues), the line ends by 5.90, 0.42 before the cut. The rule "click 0.3 s after the onset of Even, no earlier than `c3_pick` - 3.9" gives an in point between `c3_pick` - 3.9 and `c3_pick` - 2.9, so the pick holds between 2.42 and 3.4 s. Fine.

## Minor

| id | Beat / part | Problem and evidence | Fix |
|---|---|---|---|
| m1 | t19, section 6 | The priming code is wrong. `NPCNeedsSystem._bags` is a `Map` (npc-needs.js :524, used as `this._bags.get(key)` and `.set(key, b)` at :2937 to :2938). `window.npcNeedsSystem._bags['ca15_joanne_pell\|ca15_kettle'] = {...}` sets a plain property on the Map and has no effect. The take's text assert would catch it, but the spec as written cannot work | Write `window.npcNeedsSystem._bags.set('ca15_joanne_pell\|ca15_kettle', { sig: <the live pool's lines joined with "\n">, order: [2], round: 1, last: -1 })`. The rest of the sentence (sig, index 2, `_bagPeek` echo skip) is correct: `_bagTake` peeks order[0] = 2 and `_bagNext` shifts it |
| m2 | Captions, `caption_breaks`, section 3 and 4 | The lint adds the speaker prefix to line 1 when the shot's line has a `speaker` and the skin is plain (`lint-edit.mjs` :267 to :269; no ca15 edit sets `caption_skin`). Nilesh A "That's shadow IT for you." is 25 + "Nilesh: " = 33; B line 1 is 27 + 8 = 35; the 9b caption line 1 is 26 + "Joanne: " = 34. All fail the 28 limit at the first lint. The ca16 script solves this by keeping no speaker (`ca16_trailer_script_r2.md` :8, :108, :122); the ca15 script says nothing | Add to the `caption_breaks` paragraph: no `speaker` on any of the three cast-line shots (hook, 9b, beat 12). The chip `IT SERVICE DESK` names Nilesh, the bubble names Joanne. Then the counts as scripted stand |
| m3 | t19, section 6 | "Player within 160 px of Joanne" is the upper bound only. NPC behaviour turns an idle NPC to face the player inside `facePlayerDistance`, default 96 px (npc-behavior.js :709, :1242), and the hidden player is still the player to it. A learner at 60 px would have Joanne turn from the kettle; the pair's pose is the point of the hook. `playerHears` also needs `canSeePlayerToFace` clear (:5762 to :5764) | Stand the player 100 to 150 px from Joanne, outside 96 px and inside 160, with a clear line; add a frame check at `share_bubble` + 0.5 that both NPCs face the kettle and not the player; assert `playerHears(joanne).overheard` is true as well as `talking.faint` false |
| m4 | Captions, phrase splits | Four forced splits break a phrase: v33 B "IT never knew the copy / existed." (22 / 8) leaves one word alone; v34 A "Unknown devices plugged / into work laptops." separates verb and preposition; 9b "Someone's dropped a memory / stick. Whose is this?" splits the noun "memory stick"; v30 "...the shortcuts / staff take that IT / doesn't know about." cuts the relative clause twice | v33 B **"IT never knew / the copy existed."** (13 / 17). v34 A **"Unknown devices / plugged into work laptops."** (15 / 26). 9b three lines **"Someone's dropped / a memory stick. / Whose is this?"** (17 / 15 / 14), 9:16 box grows as for v30. v30 three lines **"Shadow IT: / the shortcuts staff take / that IT doesn't know about."** (10 / 24 / 27). All at or under 28; no wording changes, only where the break falls |
| m5 | t11b, section 6 | `chattiness` is a real per-NPC field: documented at `NPC_NEEDS_SYSTEM.md` :592, read from the record `world.getNpc` returns (the `npcManager` NPC object) at npc-needs.js :4662, and 0 gives `tries` false so no bark and no picture bubble. The spec does not say that a pair left silent is dropped: each silent turn increments `c.n`, the gap is `CHAT_GAP_MS` 500 ms, and `c.n > 40` deletes the chat (:4684), so about 20 s of suppression ends the kettle chat for good. Restoring `chattiness` afterwards does not bring it back | Say it in the spec: set `chattiness` 0 on the NPC objects from `npcManager.getNPC(id)`; the chat is gone after about 20 s and is not expected to resume; nothing in 9a or 9b depends on it (9b is the `npc_picked_up` event bark, not chatter). Keep the no-bubble assert |
| m6 | Section 12 header | "where sections 13 and 14 differ ..., the later section stands." Section 14 (the R2 round) comes after section 13 (R3) in the file but is the older round. Read literally, section 14's superseded wordings win: v31 "Slow share means shortcuts.", v33 "That inbox gets hacked.", v34 "in work laptops", v37 "Over to you." | Reword: "the newest round stands: section 13 (R3) over 14 (R2) over 12 (R1)". Or reorder the sections |
| m7 | v34 truth check | Cites "ink :85" for "unknown device". ink :85 is the knot header `=== red_stick ===`. The words are at `nilesh_solanki.ink` :87 ("To a work PC it's an unknown device") and :48 ("unknown devices come to us first") | Change :85 to :87 (and :48). erb :55 and :1671 are right |
| m8 | v36c lead rule | The rule "if the onset needs a lead above 0.5, use v36d" is stricter than the gate needs. The end is pinned: "found" starts at 2.30 s and the line ends about 2.7 s, against a gate of 3.79 - 0.3 = 3.49, whatever the lead. A short clip (2.0 s, "found" at about 1.6 s) needs lead 0.7 and still ends 2.7 s in, 1.09 s before the cut | State the test as the clip's end: with "found" placed 0.1 s before `drop_land`, the line is fine if it ends by 3.49 s into the shot. Use v36d only if the end measures later than that, or if "found" cannot reach 2.30 s without a lead above about 1.0 s |
| m9 | v33, voicing | Spoken, "it" and "IT" are the same sound. "Then it's broken into. IT never knew the copy existed." is clear on the page (caption B, capital IT) and in 16:9 where the viewer reads it; a sound-on, eyes-away viewer can hear the second "it" as the inbox. v30 already taught IT two sentences earlier in the trailer, so this is small | Voicing note for v33: a clear break between the sentences and stress on "I.T." in the second. No wording change, since the gate leaves no room for another word |

## What the new lines get right

- **v31** reads cold: the hook (16:9 bubble, 9:16 caption) says the share is crawling, v30 says shortcuts, v31 says the official way is slow, and the red card finishes it. It is the episode's phrase, so the cause and the fix in beat 12 ("If the official way's slow, tell us", ink :65) use the same words.
- **v33**: "it" is the personal inbox, the last noun of v32, and `SIX MONTHS LATER` supplies "then". Every word is in erb :691 or the brief (erb :657, "six months on"). It names IT's lost visibility as the cost, which is what the page says.
- **v34**: the verb fixes "devices in laptops". "Unknown device" is the episode's term (erb :55, :1671, ink :87), "work laptop" is card 3 (erb :616), and "Even a USB stick" answers the owner's note. The visitor's stick is shown by the chip, not claimed by the VO.
- **v37**: spoken, carded and tabbed words now match. The 7 s gap between `YOU TRY IT` and the blue card is a hand-over, not a repeat.
- **Hard rules** on the changed parts: no narration over a verdict button (beats 5 and 7 are unscored choices, `mistake.scored` false at erb :574; beat 11 hides the verbs); no answers, tells, advice or tallies added; the one advisory line is still Nilesh's, spoken and captioned; no banned term in any new line, card or chip; UK English ("authorised", "program" in its computing sense, which the episode uses).
- **`caption_breaks` list** (hook 9:16, v30, v32, v33 B, v34 A, v35, v36c, 9b 9:16, Nilesh B) matches every " / " caption in the script, nine of nine. The engine flag exists (commit 048d15134, `lint-edit.mjs` :266). The cards, including the close card's two lines, are card text.
- **Nilesh clip**: the 7.368 s measure is applied correctly. In = `line_start` - 0.2, out = `line_start` + 7.38, the line ends 0.44 to 0.61 s before the cut and 0.28 s before Nilesh's next line; the freeze runs 0.06 s at most. The reserve path (beat 11 to 8 beats, v38f) is not reached.

## Fix list

| Item | Change |
|---|---|
| m1 | t19: `_bags.set(...)`, not property assignment |
| m2 | `caption_breaks` paragraph: no `speaker` on the three cast-line shots |
| m3 | t19: player 100 to 150 px from Joanne, frame check on facing, assert `playerHears` |
| m4 | Four caption splits as listed |
| m5 | t11b: chat gives up after about 20 s of `chattiness` 0; do not rely on it resuming |
| m6 | Section 12 tie-break: newest round stands |
| m7 | v34 truth check: ink :87, :48 |
| m8 | v36c: judge by the clip's end, not the lead |
| m9 | v33 voicing note |
