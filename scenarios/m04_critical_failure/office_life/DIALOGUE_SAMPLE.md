# m04 Critical Failure: office-life dialogue sample

Built on the plan's recommended picks while decision card D117 is open (Q2 (d), Q3 (a), Q5 build unvoiced). Every line below is in the build word for word and is **unvoiced**: voicing is a later, separate yes. Each line sits in one place (file named per block) so a different pick changes one spot.

Speakers: Ibrahim Diallo, Albion's office IT support lead, in overnight for a desktop swap; Joanne Pell, training and inductions coordinator, in early for the six o'clock contractor inductions. Both from the awareness course cast.

## Where you hear them

Two people sit on the reception sofa while the briefing plays. Coming back into reception from the ops office, Joanne gets up for water and sits down again. Once you have met Vance and have his card, the ops-office kettle comes on; coming back to the ops office from deeper in the site, you may find the pair making a brew a few tiles from Vance.

## Talk lines (E on either of them; `ink/m04_npc_ibrahim_diallo.ink`, `ink/m04_npc_joanne_pell.ink`)

- Ibrahim: "Hello. I'm waiting on the office desktops to image. The swap was booked late, so I won't be on tonight's list."
- Ibrahim, after trouble: "I'll keep to my work, if it's all the same to you."
- Joanne: "Hiya, duck. I've a dozen inductions at six, so I came in early to get ahead. Don't mind me."
- Joanne, after trouble: "I'd rather you kept your distance, love."

## Pool lines at the kettle (one bubble at a time; scenario `chatter.coffee`)

Ibrahim:
- "Two sugars, and don't tell anyone."
- "This kettle is older than my car."
- "Is there any milk that isn't sour?"
- "These desktops take an age to image."

Joanne:
- "Proper brew, none of that cooler stuff."
- "Who leaves teabags in the sink?"
- "Who's moved my mug again, duck?"
- "I'll be needing another one of these."

## Exchanges at the kettle (each heard once; knots in `ink/m04_npc_ibrahim_diallo.ink`)

Each exchange line is at most 40 characters of speech (the validator's cap).

`ex_six_oclock`:

> Joanne Pell: Twelve contractors at six, all new.
> Ibrahim Diallo: And the reception PCs half swapped.
> Joanne Pell: They can sign in on paper, then.
> Ibrahim Diallo: Paper never needs me. That's its flaw.

`ex_not_on_the_rota`:

> Ibrahim Diallo: Neither of us is on tonight's rota.
> Joanne Pell: Your swap was booked late, then?
> Ibrahim Diallo: After the rota went out. You're early.
> Joanne Pell: Inductions today. Nobody knows I'm in.

`ex_stay_out_of_the_halls` (only after you have met Vance):

> Joanne Pell: Robert says keep out of the halls.
> Ibrahim Diallo: Till the crew's done. Fine by me.
> Joanne Pell: Not at this hour, no thank you.

## Bark (Joanne, when Vance sounds the evacuation; scenario eventMapping `bark`)

- "That's the alarm. Coats on, out we go."

## Changed existing lines (Q2 (d), off the roster)

| Where | Old | New | Voiced? |
|---|---|---|---|
| credit, `scenario.json.erb` (the "ALL ... ON SITE" entry) | ALL ELEVEN ON SITE WALKED OUT | ALL THIRTEEN ON SITE WALKED OUT | no (text) |
| credit, `scenario.json.erb:250` (new) | n/a | OFFICE STAFF: hurt, and that's on you | no (text) |
| blueprint note, `scenario.json.erb` ("Facility Blueprints (Marked)") | 'On site: 11. ...' | 'On site per tonight's rota: 11. ...' | no (text) |
| debrief, `ink/m04_closing_debrief.ink` (HaX head-count line) | Eleven people walked out of there tonight. Two hundred and forty thousand people kept their lights on and never knew why. | Thirteen people walked out of there tonight, two of them not on anyone's list. Two hundred and forty thousand people kept their lights on and never knew why. | yes: needs a re-voice, its own yes |

On Q2 (a) instead, the briefing and Voltage's two lines would change too (four re-voices in all).
