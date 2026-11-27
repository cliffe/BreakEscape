# office_life_showcase: voicing-stage dialogue review

Scope: only the lines added or changed since `DIALOGUE_REVIEW_BUILD.md`, read in their ink context (`ink/ama_owusu.ink`, `ink/graham_whitfield.ink`, the `chatter.cooler` pool in `scenario.json.erb`). Nothing the build review passed is repeated. Method: `.claude/skills/npc-dialog-review/SKILL.md`. `dialoguelint.mjs` reports no rule hits. Grades: B blocker, M major, m minor, OK.

Result: 0 B, 0 M, 2 m on the listed lines (A31 reply, X4 meaning), plus 1 m on an adjacent unlisted line. Everything else is OK to voice.

## Lines

| Line | Grade | Verdict |
|---|---|---|
| A6 | OK | "the machine" fixes the antecedent. Follows "the rest queue", so "they" is clear. Speakable. |
| A13 | OK | "That was an exchange" answers the question just asked. The choice is gated on `heard_exchange_cooler_chat`, so "was" is always true. |
| A17 | OK | "nearly all" matches A12 "gone home but one". Leads into "Have a wander if you like." |
| A31 | m | Fine as a question, but see below. |
| A32 | OK | Only shown when the kitchen has been seen and the cooler heard. It names the "Let's do lunch." choice by topic. |
| A33 | OK | Matches the choice label "Call it a day." and follows the cake instruction directly. |
| A34 | OK | Mirrors A33 for the early-cake case (`cake_servings` 0). No contradiction with the board. |
| X4 | m | Sarcasm may not survive TTS, see below. |
| Cooler pool "Quiet one today, isn't it?" | OK | 26 characters, under the 40 cap. Works as an opener (it invites a reply) and as a reply. No digits or symbols. |

## Findings

### m1. A31 and its "Not yet." choice

`ama_owusu.ink`, the "Call it a day." branch.

- "They won't be back" opens on "They" straight after the player's "Call it a day." bubble. Aloud, with no earlier noun, it is a beat slow to land. Replace: "The staff won't be back once they've gone home. Seen everything you wanted?" (13 words.)
- The choices matter: "Yes, call it a day." sets `act_evening` and ends the lunch act, "Not yet." returns to the hub. They are not flat.
- "Not yet." diverts to `choices` with no NPC reply, so the player's bubble is followed by the menu with nothing from Ama. Add one line under it, before `-> choices`:

```
    + + [Not yet.]
        # speaker:npc
        Take your time.
        -> choices
```

### m2. X4 "You never do."

Graham says "I'll not keep you long." If Agnieszka answers "You never do." and then sets a limit, the first sentence can be heard as agreement ("you never keep me long"), which the second sentence contradicts. Written, the irony is clear; in a synthetic voice it often is not. Replace: "Famous last words. Five minutes at most." (40 characters, at the cap, no punctuation beyond full stops.) Graham's next line "Then back to it. Same time tomorrow?" still follows. If the cap is read as strictly under 40, use "You always say that. Five minutes." (34).

### m3. Adjacent, not in the list: stale morning pointer

When `kitchen_seen` is true and the cooler has not been heard, the hint still says "Then open the kitchen door and hang about by the water cooler." `kitchen_seen` is set by entering the kitchen, so the door is already open. This is the sibling of A32 and sits in the same `{ }` block. Replace: "Then hang about by the water cooler." (7 words). It is an unvoiced line, so it needs a new yes if it changes.

## Notes

- Nothing here introduces a dash, symbol, digit or stage direction. All Ama lines are well under 30 words.
- Any line changed after voicing needs its own yes.
