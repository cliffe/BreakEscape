# ca15 Shadow IT: dialogue review of new and changed lines, 27 Nov 2026

Scope: the lines changed by commit cf31e6c5d (8 spoken clips, plus the written text in the same commit), reviewed with the npc-dialog-review skill before voicing. Unchanged lines were read for context only.

Speaker note. Nilesh Solanki: quick, kind, funny, service desk. No rambling mannerism, so he gets the full concision check. Chidi Okeke: warm, colloquial ("grand", "mind"), one-line ambient.

## Step 1: compile, lint, validator

- `compile-ink.sh` on `ca15_shadow_it` and `ca15_shadow_it_defend`: both compile, 0 failed, no loose ends.
- `dialoguelint.mjs` on both: "Totals by rule: none". Longest line 24 words (full), 25 (defend).
- `tagdiff.mjs` on defend after my edits: structure unchanged, 2 prose lines changed.
- `loopcheck.js` on the defend ink, before and after completion: no runtime errors.
- `validate_scenario.rb` on both: schema passes. The warnings are the existing office-kit ones (unknown fields on kit NPCs, kit VARs read but never set). None concern these lines.

## Step 2: spoken lines

| # | File:line | Line as reviewed | Verdict | Change |
|---|---|---|---|---|
| 1 | `ca15_shadow_it/ink/nilesh_solanki.ink:48` (new) | "A real attacker's stick can run code the moment it's plugged in. That's why unknown devices come to us first." | OK. "Can" keeps it true: a stick that poses as a keyboard needs no file opened. It follows "She was being kind, and that's what a drop relies on", so the attacker's reason comes before the rule. | none |
| 2 | `ca15_shadow_it/ink/nilesh_solanki.ink:65` | "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round." | OK, mild. "For you" is wry and fits him. It names the term again at the close, which the owner asked for. | none |
| 3 | `ca15_shadow_it/ink/nilesh_solanki.ink:68` | "Nilesh, service desk. Today's about shadow IT. That's work done on devices, apps or accounts IT doesn't know about, usually as a shortcut." | OK. Names and defines the term in his first line. Same wording as the defend twin, which is right for a refrain. | none |
| 4 | `ca15_shadow_it/ink/nilesh_solanki.ink:69` (new) | "Personal email, a free app, a stray USB stick. If something's slowing you down, ask us first." | OK. One verbless opener, allowed. Three concrete shortcuts, each of which the Friday choices then play out. Three NPC lines before the choice, under the monologue limit. | none |
| 5 | `ca15_shadow_it/ink/nilesh_solanki.ink:86` | "Before we go on, try the attacker's side. One USB stick, no label, no note." | OK. The offensive angle in plain words; "red-team kit" jargon is gone from the spoken text. | none |
| 6 | `ca15_shadow_it/ink/nilesh_solanki.ink:87` | "To a work PC it's an unknown device. Ours is harmless, it only tells us when it's plugged in." | OK. Agrees with the session note ("our tracker reported home") and the debrief ("a harmless tracker IT knew about, which only reports that it was plugged in"). | none |
| 7 | `ca15_shadow_it_defend/ink/nilesh_solanki.ink:28` | "A stick like that can run code the moment it's plugged in, first on that machine and then on the share." | CONCERN, accuracy. Code does not "run on the share"; it runs on the PC and reaches the share from there. | -> "A stick like that can run code the moment it's plugged in, and from that machine it can reach the share." |
| 8 | `ca15_shadow_it_defend/ink/nilesh_solanki.ink:31` | Same as 3. | OK | none |
| 9 | `ca15_shadow_it_defend/ink/nilesh_solanki.ink:32` | "On the kiosk, USB sticks that turned up, 'quicker way' messages, then a board of approved swaps. Ask us first, we'd rather help than clean up." | CONCERN, P9/P10 strong. A verbless three-item list read aloud, announcing what the kiosk screen already shows. | -> "On the kiosk there are USB sticks that turned up and 'quicker way' messages to sort. Ask us first, we'd rather help than clean up." (shorter; the swaps board is in the brief) |
| 10 | `_office_kit/ink/chidi_okeke_ambient.ink:49` | "Nice. Deadline on and a free transfer tool looks grand, but then nobody can say where the client files have gone." | OK. "Pack" to "client files" only; still sounds like Chidi. | none |

TTS checks on all ten: no inline stage directions, no `{var}` in spoken text, the `#delivery:` tags on :86 and :87 sit at the end of the line and match the rest of the `red_stick` knot. Spoken "IT" has precedent in other voiced CA lines. Every prefix is the exact `displayName`.

Not applicable to this delta: 2b to 2k (no choices, structure, globals or influence changed).

## Concision (2l)

- Counts: P9/P10 one strong (line 9, fixed). P2 none within the spoken layer: "can run code the moment it's plugged in" is spoken once per route (full :48 after a drop, defend :28 on a miss). No monologue of four or more lines. No mannerism speakers skipped.
- Repeat fact across layers: "can run code the moment it's plugged in" also appears in the session note and both debriefs. Written copies are for reading back, so not P2.

## Written text in the same commit

| Where | Verdict | Change |
|---|---|---|
| Briefs, mission descriptions, scope notes (both scenarios) | OK. Shadow IT is named and defined the same way in each ("devices, apps, accounts or services that IT doesn't know about or hasn't approved, usually as a shortcut"). | none |
| Objective and task titles ("Try the attacker's side: the USB drop", "Leave the unlabelled USB stick...") | OK. Match the spoken "attacker's side" and the item name. | none |
| Item "Unlabelled USB stick" and its observations | OK. No "red-team stick" or "red stick" left in player-facing text. | none |
| Session note TL-OPS-04 | OK. "our tracker reported home" then the hedged "can run code" sentence. | none |
| Full debrief "Shadow IT, and those USB sticks" | OK. Says the drop stick was ours, a harmless tracker. Every reference to the drop stick agrees: harmless, known to IT, reports only that it was plugged in. | none |
| Defend debrief | OK. The posted stick is "not from the client, who had posted nothing", which agrees with Nilesh's defend lines. It no longer claims that stick was ours. | none |
| `plug_visitor` outcome (full scenario erb :699, mirrored in `e15/full_only.json:97`) | CONCERN, accuracy. "The moment it went in, it copied the folders" states instant execution as a fact for an ordinary stick that had picked something up in other firms' laptops. That is the attacker-built stick's behaviour, not this one's, and it disagreed with the `send_link` card beside it ("carried a program that copied the folders"). | "The moment it went in, it copied the folders it could reach" -> "It carried a program that ran on yours and copied the folders it could reach" |
| "pack" -> "client files" throughout | OK. No "pack" left in either scenario's player-facing text. | none |

## Rubric notes (CA fun and offensive angle)

The changed lines help the offensive-angle items: the drop is now introduced as "the attacker's side", the reason it works is given in attacker terms ("Kindness does the attacker's work", existing line; "that's what a drop relies on"), and the technical danger arrives after the player has watched the drop succeed. No rubric scores are given here because nothing was played.

## Action list

Must fix: none.

Should fix (done): line 7 accuracy, line 9 concision, `plug_visitor` accuracy.

Worth considering:

- `planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py:449-453` still holds the old e15 defend welcome and miss lines ("Found sticks...", "The moment someone opens a file on that stick, it could run malware..."). A regeneration would undo this work. Its welcome is a single line and the new one is two, so it needs a small structural change and was left alone.
- `e15/ink/nilesh_solanki.ink` in the planning folder is an early draft, not a mirror of the scenario ink.
