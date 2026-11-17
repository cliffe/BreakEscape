# m04 Critical Failure: office-life dialogue sample

Built on the plan's recommended picks while decision card D117 is open (Q2 (d), Q3 (a), Q5 build unvoiced). Every line below is in the build word for word and is **unvoiced**: voicing is a later, separate yes. Each line sits in one place (file named per block) so a different pick changes one spot.

Speakers: Ibrahim Diallo, Albion's office IT support lead, in overnight for a desktop swap; Joanne Pell, training and inductions coordinator, in early for the six o'clock contractor inductions. Both from the awareness course cast.

## Where you hear them

Two people sit on the reception sofa while the briefing plays. Coming back into reception from the ops office, Joanne gets up for water and sits down again. Once you have met Vance and have his card, the ops-office kettle comes on; coming back to the ops office from deeper in the site, you may find the pair making a brew a few tiles from Vance.

## Talk lines (E on either of them; `ink/m04_npc_ibrahim_diallo.ink`, `ink/m04_npc_joanne_pell.ink`)

- Ibrahim: "Morning. I'm swapping the office desktops while nobody needs them. It was booked late, so I won't be on tonight's list."
- Ibrahim, after trouble: "I'll keep to my work, if it's all the same to you."
- Joanne: "Hiya, duck. I've a dozen inductions at six, so I came in early to set the room up. Don't mind me."
- Joanne, after trouble: "I'd rather you kept your distance, love."

## Pool lines at the kettle (one bubble at a time; scenario `chatter.coffee`)

Ibrahim:
- "Two sugars, and don't tell anyone."
- "This kettle is older than my car."
- "Is there any milk that isn't sour?"
- "Four more desktops, then I'm done."

Joanne:
- "Proper brew, none of that cooler stuff."
- "Who leaves teabags in the sink?"
- "Six o'clock comes round fast, duck."
- "I'll be needing another one of these."

## Exchanges at the kettle (each heard once; knots in `ink/m04_npc_ibrahim_diallo.ink`)

`ex_six_oclock`:

> Joanne Pell: Twelve contractors at six for the module swap, and every one needs an induction.
> Ibrahim Diallo: I have the reception PCs to finish before then, or they sign in on paper.
> Joanne Pell: Paper never needs rebooting.
> Ibrahim Diallo: Paper never needs me either. That is the trouble with it.

`ex_not_on_the_rota`:

> Ibrahim Diallo: Did you know neither of us is on tonight's rota? My swap was booked after it went out.
> Joanne Pell: And I only came in early to get ahead. There used to be someone in the office on nights.
> Ibrahim Diallo: Now it's the crew, Mr Vance and the gate. That's all.

`ex_stay_out_of_the_halls` (only after you have met Vance):

> Joanne Pell: Robert said to stay in here or reception and keep out of the halls.
> Ibrahim Diallo: Until the crew's done, he said. I wasn't planning a tour.
> Joanne Pell: Me neither. Not at this hour.

## Bark (Joanne, when Vance sounds the evacuation; scenario eventMapping `bark`)

- "That's the evacuation. Coats, now."

## Changed existing lines (Q2 (d), off the roster)

| Where | Old | New | Voiced? |
|---|---|---|---|
| credit, `scenario.json.erb` (the "ALL ... ON SITE" entry) | ALL ELEVEN ON SITE WALKED OUT | ALL THIRTEEN ON SITE WALKED OUT | no (text) |
| blueprint note, `scenario.json.erb` ("Facility Blueprints (Marked)") | 'On site: 11. ...' | 'On site per tonight's rota: 11. ...' | no (text) |
| debrief, `ink/m04_closing_debrief.ink` (HaX head-count line) | Eleven people walked out of there tonight. Two hundred and forty thousand people kept their lights on and never knew why. | Thirteen people walked out of there tonight, two of them not on anyone's list. Two hundred and forty thousand people kept their lights on and never knew why. | yes: needs a re-voice, its own yes |

On Q2 (a) instead, the briefing and Voltage's two lines would change too (four re-voices in all).
