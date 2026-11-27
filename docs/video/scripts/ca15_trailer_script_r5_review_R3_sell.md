# ca15 trailer script r5 rev R2: review R3 (sell and truth)

Reviewed: `docs/video/scripts/ca15_trailer_script_r5.md` at 521f256ad, against `scenarios/ca15_shadow_it/` and `ca15_shadow_it_defend/` on this branch, and `docs/video/recipes/course-trailer.md`. Read fresh: no earlier review file was opened; the history comes from the script's section 13 only.

**Counts: 0 Blocker, 0 Major, 7 Minor.**

Verdict: the script does what owner direction (a) asks. A first viewer gets the cause (slow share), the term with its definition in one sentence, two shortcuts each followed by its cost, the attacker's side in the attacker's terms, a turn of their own, and one stated fix. Every VO line, chip, card and caption is true of the episode. The Minors are wording: three narrator lines read worse cold than they need to, and each has a replacement that fits the same gate.

## Findings

| id | Sev | Beat | Problem | Exact fix |
|---|---|---|---|---|
| m1 | Minor | 4, v31 | "Slow share means shortcuts." does not land cold. Heard once, "share" as a noun depends on the hook 13 s earlier, which in 16:9 and 1:1 exists only as small bubble text; without it the word reads as a verb or as a share price. The line is also headline grammar between two full sentences (v30, v32), and three s-sounds in four words is hard on the voice. | v31: **"The official way's slow."** (4 words, no internal stop, so the same reads as now: stops 1.98, rate 2.28, gate 2.76, slack 0.48). Caption "The official way's slow." (24). The red card under it finishes the thought: the official way's slow, take the shortcut. It is the episode's phrase (`habitLine` erb :661, "When the official way is too slow"; ink :65), and it sets up Nilesh's "If the official way's slow, tell us" in beat 12, so the trailer's cause and its fix use the same words. Update section 1 step 3 and the v31 truth check to cite erb :661. Voicing: level, stress on "slow". |
| m2 | Minor | 6, v33 | "That inbox gets hacked." "Hack" appears nowhere in the episode (grep of the erb and ink: no hits); the page under the line says "broken into". Caption and panel then give two words for one event. The literal swap, "That inbox gets broken into. IT never knew the copy existed.", is 11 words and fails the rate read (6.27 against a gate of 5.92, or 6.02 at lead 0). | v33: **"Then it's broken into. IT never knew the copy existed."** (10 words, one internal stop: stops read 5.25, rate read 5.70, gate 5.92, slack 0.22, the same as now). "It" is the personal inbox, the last noun of v32, and the chip `SIX MONTHS LATER` gives "then" its time. Captions A "Then it's broken into." (22), B unchanged. Reserve v33s stays. If the owner would rather keep the noun, "That inbox gets hacked." is true and can stay; it is a word choice, not an error. |
| m3 | Minor | 10, v37 | The narrator says "Over to you." while the card reads "Now it's your turn" and the tab that follows reads `YOUR TURN`. Three wordings of one hand-over in 2.5 s; the sound-on viewer hears one thing and reads another. | v37: **"Your turn."** (2 words, no stop: rate read 1.14, gate 2.13, slack 0.99). The spoken words are then on the card and on the tab. Card unchanged. Voicing: a hand-over, level. |
| m4 | Minor | 7, v34 | "Unknown devices in work laptops." has no verb, and "devices in laptops" can be heard as parts inside the machine. v32, its twin for shortcut one, is a full sentence with a verb. | Preferred, v34: **"Unknown devices plugged into work laptops. Even a USB stick."** (10 words, one stop: stops read 5.25, rate read 5.70, gate 5.82 at lead 0.2, slack 0.12). "Even" then starts about 3.2 to 3.6 s in, so the click sits at the script's own floor, in = `c3_pick` - 3.9; t16 should hold card 3 for 4.5 s before the pick (now 4.0), and the picked option still holds about 2.1 s. Captions A "Unknown devices plugged / into work laptops." (23 / 18), B unchanged. Add it to the thin-lines list. Reserve, same gate figures as today: "Unknown devices get plugged in. Even a USB stick." (9 words). Both keep the episode's "unknown device". |
| m5 | Minor | 11, v38 truth check | The truth check cites the two inbox rows (erb :317, :408) and the upload row (:360) but not ink :61, Nilesh's line after the sort: "A stick in the post is a found stick, whatever the note says." v38's first sentence is the subject of that answer line. The owner should see that when judging question 10. Also unstated: the inbox has six rows, four risky and two safe (erb :339, :383, :424, :468 against :511, :538), and v38 names kinds that cover three of the four risky rows and neither safe one. | Add both facts to the v38 truth check and to question 10. No change to the line (see question 10 below). If the owner reads v38 as an answer, the replacement at the same gate is "Sticks that turned up. Quicker ways. You sort them." (9 words, two stops: stops read 5.06, rate read 5.13, gate 5.28), which is the brief's own public wording (erb :657) and covers safe and risky rows alike. |
| m6 | Minor | 9b chip, question 9 | The truth check gives ink :92 only. The same idea is also in post-verdict feedback: the giveaway stick's `reportReply`, "Kindness and curiosity are why people plug these in, so the kind move is to hand it in rather than plug it in" (erb :433), and the concept panel (erb :671). The owner should have that in front of them. It does not change my reading: the scored flag on the stick rows is `found_media`, so kindness is why a person plugs a stick in and not what marks an item as risky. Separately, the fallback in question 9 (9b repeats the 9a chip) would put `YOU TRY IT` over a shot of Joanne. | Add erb :433 and :671 to the chip's truth check and to question 9. Change the question 9 fallback chip to `SOMEONE FINDS IT` (16). |
| m7 | Minor | section 9 row 5 | The row leaves "check the defend twin's `mission.json`" open. Checked: the twin's description has no "Only the sort is scored" wording. | State in row 5 that only `scenarios/ca15_shadow_it/mission.json` :3 needs the change. The change itself is still not made and the course page shows that description beside the trailer, so it should land before the trailer is published. |

## The lines the brief asked about

- **v31** fails cold: m1.
- **v33**: "hacked" is true but is not the episode's word, and a 10-word line in the episode's words fits: m2.
- **v37 against the blue card**: mismatch, fixed by "Your turn.": m3. One thing to know and leave: the card arrives 7 s after the chip `YOU TRY IT`, so the viewer is handed the controls twice. It reads as "that was the test, now the real thing" and I would not change the card for it.
- **v36c** "Attackers leave sticks to be found." is clear cold, true (erb :671 "Whoever leaves a stick to be found gets a way onto a work machine", :675), and the only narrator sentence with the attacker as its subject. Keep. Slack is 0.07 on the harsh read and the reserve v36d is weaker ("on purpose" says less than "to be found"), so if v36c measures over, try lead 0 with a second voicing before falling back.
- **v38**: true, pattern level, no verdict. Keep, with m5.
- **v11b**: "here" does its job after Nilesh's line; the comma is right. Keep.
- **Chip `YOU TRY IT: AUTHORISED TEST`**: 27 characters, true (brief erb :657 "authorised exercise", aim erb :55 "Nilesh's test"), and with the `ATTACKER` tab it tells a silent viewer who is doing this and that it is allowed. Keep.
- **Chip `KINDNESS DOES THE WORK`**: keep (question 9).

## Checks that passed

- Truth, line by line: v30 against erb :657 and ink :68; v32 against erb :588; v33's second sentence against erb :691; v35 against erb :699 ("copied the folders it could reach"); hook erb :1583; found-stick bark erb :1596; Nilesh ink :65; `SIX MONTHS LATER` against `flipHeading` erb :659; `IT SERVICE DESK` against ink :68.
- `mistake.scored` is false (erb :573), so beats 5 and 7 narrate over unscored choices and not over verdict buttons. Beat 11 hides the verb row, advice and counter, so no narration runs over verdict buttons.
- No answer, tell, tally or score on screen as scripted. The consequence pages are the unscored half with tags hidden and the border neutralised.
- VO rate: every line at or under 1.58 words a second. 86 words, recounted. No dashes in VO.
- Card and caption lines: all at or under 28 characters (longest: "tell us rather than building", 28; `YOU TRY IT: AUTHORISED TEST`, 27).
- UK English throughout. No "Break Escape" on screen. Close plate "Learn on Hacktivity.co.uk". "Your call" absent.

## Recommendations on the ten owner questions

1. **C or A:** C. The found-stick line, whole, after the term is defined, is the one shot where the office reacts to the learner. A loses it.
2. **Keep the attacker's side:** keep. 6.9 s, and it is the course's selling point.
3. **Nilesh's line as the one stated lesson:** confirm, with the rule wording as given ("One stated lesson, spoken and captioned, by a cast member in the episode's own words, never by the narrator and never as kiosk text"). With m1 the line also pays off the red card's VO.
4. **Close tagline:** v11b. v11 without "here" contradicts Nilesh.
5. **v1c retired:** yes.
6. **"Unknown devices":** keep the episode's word, with m4's verb. Keep chip `A VISITOR'S USB STICK`; it says whose stick, which "untrusted" does not. "Even a USB stick" answers the owner's note.
7. **9b fallback:** review renders only. Voice ahead of the bubble on the payoff line is not shippable.
8. **Beat 11 never opens a message:** list only.
9. **`KINDNESS DOES THE WORK`:** keep. It is not a tell: no inbox item is given away by it. It is not advice in form: it says why the trick works, from the attacker's side, which is what the course sells. It does share its idea with one item's post-verdict reply (m6), and the owner should decide knowing that. If the answer is no, use `SOMEONE FINDS IT`.
10. **v38 names two risky rows:** keep. The mission description and the brief already say the inbox holds USB sticks that turned up and "quicker way" messages, and the line gives no verdict. If the owner says no, use the m5 replacement.
