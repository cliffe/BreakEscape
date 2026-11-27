# m01 office life: dialogue re-check of the changed lines

Scope: the eight lines changed since DIALOGUE_REVIEW.md (4d0afa2d0), at HEAD bae0b2ec9 on plan/ol-m01. Judged against README_ink_best_practices.md, the npc-dialog-review skill and the tts-audio voice style rules.

Totals: 0 B, 0 M, 0 m, 3 n.

## Checks run

- `./scripts/compile-ink.sh m01_first_contact`: 9 compiled, 0 failed. The four END warnings are in the existing briefing and phone files.
- `loopcheck.js`: Fatima `start` and Graham `start` reach a clean end on 6 of 6 strategies, no runtime errors over 200 steps.
- `dialoguelint.mjs`: no finding on any changed line. No `delivery-unread` or `delivery-note` warning on the three tagged lines. The three `not-x-but-y` warnings are all in the existing phone and text content (L222, L592, L593), not the HaX line. The one `exit-no-reply` is Maya's `not_here` choice, already raised as m1 in DIALOGUE_REVIEW.md and unchanged here.
- Bubble cap (40 characters): "Morning. Busy week." 19, "Three interviews today. Three!" 30, "Quarter close. Nobody speak to me." 34. All clear. The Fatima brush-off line (46) is a talk line, so the cap does not apply.
- No em or en dashes, no US spellings, no model names in any of the eight lines. Attribution prefixes are the exact displayNames.

## Line by line

| Line | Verdict |
|---|---|
| Fatima bark "Morning. Busy week." | OK. Cable reference gone, no prop needed. Rushed, matches her voice, agrees with her "Three interviews today" pool line. Says nothing about the audit or the night. |
| Fatima "Sorry, I'm halfway through a candidate's file." `#delivery: brisk, apologetic` | OK. Removes the five-minute deadline (the old M1). Reads aloud cleanly, "I'm halfway through" is natural Yorkshire-neutral UK speech. The tag matches m01's format (lower-case, comma-separated manner words after the line, e.g. `low and wary`, `guarded, backing off`) and the voice rule that a tag holds a manner note, not spoken words. |
| Fatima choice "Don't let me keep you." | OK. First-person speech, and it is what a person says to someone busy. |
| Graham choice "I'll leave you to it." | OK. First-person, natural, short. |
| Graham brush-off lines `#delivery: dry, deadpan` (both) | OK. Format matches. Suits the joke ("I'm not in", then "Only joking") and his voice block. The same tag on both lines gives two clips with the same manner but different text, which is fine. |
| HaX "He's in finance, Agent. Nothing to do with this. Stand down." | OK. Does not trip `not-x-but-y`. Matches Graham's own "Graham, finance" and the Fatima sibling ("She runs recruitment. She's not part of this."). Calm and clipped, in keeping with HaX's style rules. Unvoiced. |
| Fatima pool "Three interviews today. Three!" | OK. The stale "this afternoon" is gone. |
| Graham pool "Quarter close. Nobody speak to me." | OK. Dry and deadpan, drops the familiar "dream in spreadsheets" line. See n2. |

No clue leakage in any line. No PIN, code, audit, late night or machine detail.

## Findings

### n1. Fatima's reply to "Don't let me keep you." still answers a question nobody asked

- File: scenarios/m01_first_contact/ink/m01_npc_fatima_begum.ink:11 (text unchanged by this edit)
- Line: "If it's the network, I only press the buttons. Nice to meet you."
- Note: the new choice is a courtesy, and her reply assumes the player wanted something about IT. It was the same before ("Let her get on"), and the line carries a useful bystander hint that she is not the technical one, so it reads as her pre-empting the usual IT question. Leave as is. If a rewrite is ever wanted: "Thanks. If it's the network, I only press the buttons." (no new meaning).

### n2. Graham's "Nobody speak to me." is a touch sharper than his brush-off

- File: scenarios/m01_first_contact/scenario.json.erb:1365 (cooler pool)
- Note: said aloud to the room it reads as a grumble, which suits the deadpan delivery, and it is mild next to his "Only joking" in conversation. No change needed. If the voiced take sounds actually hostile, "Quarter close. Nobody talk to me." is the softer fallback.

### n3. Unrelated edits in the same diff, for the record

- `facePlayerDistance` 96 to 48, `"npcThoughts": false`, `"seat": "stand"` on the cooler, and the shortened ═ rule lines in Patricia's text documents were in the diff range. None is dialogue and none was reviewed here. The shortened rules change only the box-drawing lines of the text items, not their wording.

## Voicing note

All three tagged lines and the three changed bark and pool lines are still unvoiced, so the changes cost no re-voice. After sign-off they are new clips (the tag is part of the key).
