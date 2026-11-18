# m10 office life: dialogue review R2 (npc-dialog-review, changed lines only)

Scope: the nine lines changed since R1 (`DIALOG_REVIEW_R1.md`) plus the Sofia upset credit clause. Worktree `p-ol-m10`, branch `build/ol-m10` at 0447998ff. Read-only; no line edited.

**Counts: B 0, M 0, m 1.**

## Findings

| # | Severity | File:line | Finding | Suggested replacement (within the rules) |
|---|---|---|---|---|
| 1 | minor | ink/m10_fp_support.ink:45 | Sofia's opener "Kettle's on, for all the good it does." is unconditional. After `fp_staff_upset` the kettle is switched off (`offWhen`, scenario.json.erb:2881) and the new credit says she "put the kettle away", so a player who has knocked out a team member or hit the staff and then talks to her hears the opposite. It also repeats Darren's "Kettle's on." (`:61`) when both play in the briefing window. The pool and exchange lines are gated off by `fp_staff_upset`; the conversation opener is not. | Sofia Marchetti: "Cold out here, and we're out of sugar." (38; the sugar half of the R2 line is kept). Bye `:54` "I'll keep one warm for you." has the same issue but only after a refusal of tea, so leave it unless the opener is gated. |

## R1 problems against their fixes

- **R1 1** (van two): gone. "Should've brought the big coat." (31) names nothing the whodunnit can use. Fixed.
- **R1 2** (radios): "It's gone very still out here." (30) is a weather remark, not a comms status. Darren's "Quiet's good. Means nobody's shouting." and Sofia's "Then we wait." still follow. Fixed.
- **R1 3** (sums): "Cold and tired, but fed. One out of three's not bad." now counts correctly (one good of three). 52 characters, but it is an ink conversation line, not a pool or exchange line. Fixed.
- **R1 4** (tea offer the world cannot honour): the opener no longer offers tea to the player; "we're out of sugar" is an absence, so nothing to back up. Fixed (see finding 1 for the residue).
- **R1 5** (cables repeat): "Watch the leads." no longer repeats Asante's "Mind the cables" (`m10_asante.ink:59`). Grep for leads, touchy, generator, fuel, dawn, sugar, coat across the m10 ink finds only Gary's "Imran, coat" (`m10_gary.ink:155`, `:195`, a person's coat, not a clash) and Fonoti's "good coat" (`m10_fonoti.ink:45`). Fixed.
- **R1 6** (generator repeat): "Fuel's good till dawn. Probably." does not repeat the opener; it is also consistent with the Darren credit "Kept the generator running till dawn." Fixed.
- **R1 7** ("Long night."): "The kettle's the easy bit tonight." no longer echoes Lantern at `m10_kowalczyk.ink:317`. Fixed.
- **R1 8**: `:77` "They'll want the lamps on, coming out." (38) answers "So the door's open, then." and Sofia's "Kettle stays on for whoever walks out." follows naturally. `:64` "I'll brew fresh when they stop for one." (39) drops "a fresh pot" and the breach-sounding "break". Fixed.

## Checks run

- **Compile.** `bin/inklecate` on `m10_fp_support.ink` to the scratchpad: exit 0, no errors, no warnings, no loose ends.
- **Dialogue lint.** `dialoguelint.mjs` on the m10 ink folder and on the file alone: "Totals by rule: none" for `m10_fp_support.ink` (16 lines, max 12 words). Tag diff not run: no tags changed.
- **Lengths** (excluding prefix): Darren pool 1 32, pool 2 31; Sofia pool 3 34; exchange lines `:64` 39, `:69` 30, `:77` 38. All 40 or under. The conversation openers (`:27` 48, `:45` 58, `:48` 52) are not pool or exchange lines, so the cap does not apply.
- **Content rules.** No line names a team member, the sleeper, the kit, a code, a flag, a clue time or anyone's movements. "When they stop for one" and "coming out" refer to the team in general terms and the first is a hypothetical; both are in the spirit of R1's accepted wording.
- **TTS and style.** No digits, symbols or abbreviations ("Fuel's", "Should've", "one out of three's" are sayable). UK English; no em or en dashes in any changed line or the credit.
- **World backing.** Generator, leads, lamps, heaters, kettle, mugs and the soup flask exist in the forward post (R1 and erb:2873); "dawn" matches the six o'clock close.
- **Credit clause** (shown, not spoken): "Welfare. Put the kettle away when the shouting started." is backed by `fp_kettle.offWhen` and by `fp_staff_upset` being set on staff attack or any team KO (erb:2053-2059; "shouting" fits). Placed after the KO clause, so a knocked-out Sofia still gets the KO line. Present identically in `credits_sections.json:114` and `:279` (both Sofia entries) and in erb:1000 and :1165, so the sections agree. The Darren credit is unchanged and does not mention the upset; fine, as his generator keeps running.
