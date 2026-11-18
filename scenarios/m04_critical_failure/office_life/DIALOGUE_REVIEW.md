# m04 office life: dialogue review of the new lines

npc-dialog-review skill, 18 November 2026, branch build/ol-m04. Scope is the new and changed lines listed in `SPOKEN_LINES.md` and `DIALOGUE_SAMPLE.md`. The rest of m04's dialogue was not reviewed.

Counts: 0 blockers, 1 major, 7 minors.

## Phase 1: compile, validator, lint

- `m04_npc_ibrahim_diallo.ink`, `m04_npc_joanne_pell.ink` and `m04_closing_debrief.ink` compile with no errors and no loose-end warnings (built into a scratch directory so the fixer's `.json` files were left alone).
- Validator: no dialogue-facing errors for Ibrahim or Joanne. Each speaker prefix resolves to its NPC's `displayName`. The voices (Sadaltager, Zephyr) are used by nobody else in m04, and each style names its accent and says "consistent ... throughout". The validator's warnings for these two are about office-life mechanics (kettle room, V4 attack probe, cooler pool), not dialogue.
- dialoguelint: no findings in either newcomer file.
- Every exchange and pool line is 40 characters or fewer, with no em or en dashes and no stage directions.

## Findings

### Major

**M1. The bark repeats the opening of the text that arrives 8 seconds later.** `scenario.json.erb:1725`. Joanne's bark "That's the evacuation. Coats, now." fires on `crew_warned`. The same event sends a text that opens "That's the evacuation." 8 seconds later (`scenario.json.erb:1098`, `:1105`, `:1116`, all on `global_variable_changed:crew_warned`). That puts the same three words on screen twice within 8 seconds, which is the bark-and-line repeat the skill lists under 2i (the m04 gate-guard class). Change the bark, because the texts are already voiced. Proposed bark: "That's the alarm. Coats on, out we go." (38 characters). "Out we go" is homely and Midlands-friendly, and the line names the alarm, not the evacuation.

### Minor

**m1. Ibrahim's talk line describes work the player never sees him do.** `ink/m04_npc_ibrahim_diallo.ink:25`. He says "I'm swapping the office desktops", but he sits on the reception sofa or walks to the kettle all night (skill 2a-bis, off-screen intentions). Let the sitting still be the character: he is waiting on the machines. Proposed: "Morning. I'm waiting on the office desktops to image. The swap was booked late, so I won't be on tonight's list." That keeps the "tonight's list" set-up for the debrief.

**m2. Ibrahim's pool line gives a fixed count that goes stale.** `scenario.json.erb:1676`, "Four more desktops, then I'm done." Pool lines repeat at the kettle across a long night, so "four more" hours later reads as stuck, and like m1 it describes unseen work. Proposed: "These desktops take an age to image." (36 characters).

**m3. Joanne says she came in to set a room up, then sits on the sofa all night.** `ink/m04_npc_joanne_pell.ink:16`. Same 2a-bis issue. Proposed: "Hiya, duck. I've a dozen inductions at six, so I came in early to get ahead. Don't mind me."

**m4. "After it went out" has an unclear "it".** `ink/m04_npc_ibrahim_diallo.ink:43`. Heard aloud, "it" could be the swap, the booking or the rota. Proposed: "After the rota went out. You're early." (38 characters).

**m5. Joanne's closing line in `ex_not_on_the_rota` doesn't follow from his.** `ink/m04_npc_ibrahim_diallo.ink:44`. Ibrahim says "you're early", and "We used to have someone on nights." doesn't answer it. It also misses the one beat this exchange exists to set up: nobody knows these two are in the building, which is what HaX pays off in the debrief ("two of them not on anyone's list"). Proposed: "Six o'clock. So nobody knows we're in." (38 characters).

**m6. The office-staff credit is out of step with the warning lines around it.** `scenario.json.erb:250`, "OFFICE STAFF: HURT, ON YOUR ACCOUNT". The other warning entries keep the label in capitals and the detail in sentence case ("CASUALTIES: two on the dropped feed..."). "On your account" can also be read as a billing phrase. Proposed: "OFFICE STAFF: hurt, and that's on you" (37 characters). It reads correctly whether one or both are down.

**m7. `SPOKEN_LINES.md` cites the exchange lines three lines too early.** `office_life/SPOKEN_LINES.md` rows for `ex_six_oclock`, `ex_not_on_the_rota` and `ex_stay_out_of_the_halls`. It gives 31 to 34, 38 to 41 and 45 to 47. The knots' spoken lines are at `:34` to `:37`, `:41` to `:44` and `:48` to `:50`, both in HEAD and in the fixer's working copy. Update the three rows. No dialogue change.

## Checked and OK

- Ibrahim's curt line (`:23`) and Joanne's (`:14`) are short, in character and fit the trouble state. Her "love" there and "duck" elsewhere both suit Leicester.
- `ex_six_oclock` (`:34` to `:37`) has a clear set-up, turn and dry button. "Twelve contractors" matches Joanne's "a dozen inductions".
- `ex_stay_out_of_the_halls` (`:48` to `:50`): "Robert" is how office staff would name Vance, and the `vance_met` gate means the player knows who that is.
- The other pool lines (Ibrahim 3, Joanne 4) are idle, kettle-side and characterful. "Is there any milk that isn't sour?" suits four in the morning.
- Debrief `ink/m04_closing_debrief.ink:438`: "Thirteen people walked out of there tonight, two of them not on anyone's list." It squares with the briefing and Voltage, who both say eleven: eleven was the rota, and the extra two explain the gap. It is true on every route that reaches it, because the KO branch at `:436` now also covers `ibrahim_ko` and `joanne_ko`. The line is changed and was voiced before, so re-voicing it needs its own yes.
- Credit `scenario.json.erb:243`, "ALL THIRTEEN ON SITE WALKED OUT": its condition excludes both office KOs, so it never contradicts `:250`.
- Blueprint note `scenario.json.erb:2857`, "On site per tonight's rota: 11.": the terse planning register fits Voltage, and 9 + 1 + 1 still adds up.
- Choices, hubs, influence and set_global checks don't apply: both newcomers are one-line ambient talks with no choices, no state set and no items.

## Proposed replacements

| # | Where | Old | New | Chars (new) |
|---|---|---|---|---|
| M1 | `scenario.json.erb:1725` (bark) | That's the evacuation. Coats, now. | That's the alarm. Coats on, out we go. | 38 |
| m1 | `ink/m04_npc_ibrahim_diallo.ink:25` (talk) | Morning. I'm swapping the office desktops while nobody needs them. It was booked late, so I won't be on tonight's list. | Morning. I'm waiting on the office desktops to image. The swap was booked late, so I won't be on tonight's list. | 112 (talk, no cap) |
| m2 | `scenario.json.erb:1676` (pool 4) | Four more desktops, then I'm done. | These desktops take an age to image. | 36 |
| m3 | `ink/m04_npc_joanne_pell.ink:16` (talk) | Hiya, duck. I've a dozen inductions at six, so I came in early to set the room up. Don't mind me. | Hiya, duck. I've a dozen inductions at six, so I came in early to get ahead. Don't mind me. | 91 (talk, no cap) |
| m4 | `ink/m04_npc_ibrahim_diallo.ink:43` | After it went out. And you're early. | After the rota went out. You're early. | 38 |
| m5 | `ink/m04_npc_ibrahim_diallo.ink:44` | We used to have someone on nights. | Six o'clock. So nobody knows we're in. | 38 |
| m6 | `scenario.json.erb:250` (credit, text only) | OFFICE STAFF: HURT, ON YOUR ACCOUNT | OFFICE STAFF: hurt, and that's on you | 37 |
| m7 | `office_life/SPOKEN_LINES.md` exchange rows | 31 to 34, 38 to 41, 45 to 47 | 34 to 37, 41 to 44, 48 to 50 | n/a |

All of these lines are still unvoiced, so changing them costs no re-voice. If m1 to m3 change, update `DIALOGUE_SAMPLE.md` to match, so each line still sits in one place.
