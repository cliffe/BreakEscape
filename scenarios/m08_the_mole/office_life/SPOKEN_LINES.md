# m08 The Mole: office-life spoken lines (relief watch)

Every line the relief watch adds, from `ink/m08_relief_watch.ink` (talk and exchanges), the officers' `chatter` pools and bark in `scenario.json.erb`, and one gate line in `ink/m08_closing_debrief.ink`. Pool, bark and exchange lines are 40 characters or fewer, with no repeats, no clock hour and no suspect named. Nothing here is voiced until the user says yes; the dialogue review ran on these lines before voicing was asked for.

Columns: speaker, knot or pool, line, the characters in it. The `{&a|b|c}` rows are three spoken alternatives each, so they are three clips each.

| # | Speaker | Knot or pool | Line | Characters |
|---|---|---|---|---|
| 1 | Julian Sallow | julian_start | Not now, Agent. | Julian Sallow |
| 2 | Julian Sallow | julian_start | Relief watch, Agent. We've the duty desk for the night: the doors and the log. | Julian Sallow |
| 3 | Julian Sallow | julian_hub | {&Still about, Agent?/Yes?/Something else?} | Julian Sallow |
| 4 | Julian Sallow | julian_hub | Operations are stood down. Somebody still has to mind the doors. | Julian Sallow |
| 5 | Julian Sallow | julian_hub | The readers, the board, the log. Nothing glamorous, and nothing anyone will thank us for. | Julian Sallow |
| 6 | Julian Sallow | julian_hub | Carry your ID where it can be seen. Every classified system wants re-authentication tonight, so don't take it personally when a reader asks twice. | Julian Sallow |
| 7 | Julian Sallow | julian_hub | Most people read a notice once, at the door. Tonight it's worth a second look. | Julian Sallow |
| 8 | Julian Sallow | julian_hub | Long enough to know a quiet floor isn't a calm one. | Julian Sallow |
| 9 | Julian Sallow | julian_hub | Quiet is everyone listening for the door. Give me the printers, any night. | Julian Sallow |
| 10 | Julian Sallow | julian_hub | Go well. The log will note it, I'm afraid. | Julian Sallow |
| 11 | Agnieszka Duda | agnieszka_start | I've nothing to say to you. | Agnieszka Duda |
| 12 | Agnieszka Duda | agnieszka_start | Duda, watch log. If you need something entered, say it slowly. Tonight, every line gets read twice. | Agnieszka Duda |
| 13 | Agnieszka Duda | agnieszka_hub | {&Yes?/Is it for the log?/Go on.} | Agnieszka Duda |
| 14 | Agnieszka Duda | agnieszka_hub | Who came, who went, who asked for what. The Director reads it in the morning. | Agnieszka Duda |
| 15 | Agnieszka Duda | agnieszka_hub | I don't judge it. I write it down. | Agnieszka Duda |
| 16 | Agnieszka Duda | agnieszka_hub | Tell the Director. Only the Director. Tell me and it's gossip with a timestamp. | Agnieszka Duda |
| 17 | Agnieszka Duda | agnieszka_hub | I would log that you told me, naturally. Which is why people tell me less than they might. | Agnieszka Duda |
| 18 | Agnieszka Duda | agnieszka_hub | Water, when the log allows. Julian counts that as a break. | Agnieszka Duda |
| 19 | Agnieszka Duda | agnieszka_hub | I count it as a line in the log. | Agnieszka Duda |
| 20 | Agnieszka Duda | agnieszka_hub | Mind the doors on your way out. They are logged too. | Agnieszka Duda |
| 21 | Julian Sallow | ex_relief_handover | The day watch left without a word. | Julian Sallow, Agnieszka Duda |
| 22 | Agnieszka Duda | ex_relief_handover | Nobody says much on Level Red. | Julian Sallow, Agnieszka Duda |
| 23 | Julian Sallow | ex_relief_handover | Then we write it down instead. | Julian Sallow, Agnieszka Duda |
| 24 | Agnieszka Duda | ex_lock_it | You left your console open again. | Julian Sallow, Agnieszka Duda |
| 25 | Julian Sallow | ex_lock_it | Thirty seconds at the cooler. | Julian Sallow, Agnieszka Duda |
| 26 | Agnieszka Duda | ex_lock_it | Long enough for a stranger to be you. | Julian Sallow, Agnieszka Duda |
| 27 | Julian Sallow | ex_lock_it | All right. Lock it when I leave it. | Julian Sallow, Agnieszka Duda |
| 28 | Julian Sallow | ex_the_suite | They've taken someone down to the suite. | Julian Sallow, Agnieszka Duda |
| 29 | Agnieszka Duda | ex_the_suite | No name goes in till the Director says. | Julian Sallow, Agnieszka Duda |
| 30 | Julian Sallow | ex_the_suite | Good. Neither am I. | Julian Sallow, Agnieszka Duda |
| 31 | Julian Sallow | cooler pool | Still on Level Red. Still quiet. | Julian Sallow |
| 32 | Julian Sallow | cooler pool | Long night. They're all long on Red. | Julian Sallow |
| 33 | Julian Sallow | cooler pool | Nobody talks above a whisper tonight. | Julian Sallow |
| 34 | Julian Sallow | cooler pool | Water. Coffee's in the wrong room. | Julian Sallow |
| 35 | Agnieszka Duda | cooler pool | Everything goes in the log. Everything. | Agnieszka Duda |
| 36 | Agnieszka Duda | cooler pool | Nine days. Nobody here has slept. | Agnieszka Duda |
| 37 | Agnieszka Duda | cooler pool | I wrote the time I came for water. | Agnieszka Duda |
| 38 | Agnieszka Duda | cooler pool | Back to the desk in a minute. | Agnieszka Duda |
| 39 | Julian Sallow | bark (room_entered:operations_floor) | Relief watch is on, Agent. Don't mind us. | Julian Sallow |
| 40 | Director Magnus Netherton | the_hunt (debrief) | You knocked down both of the night watch while they were on duty. They were keeping the log, not hiding anything in it. | Director Netherton |
| 41 | Director Magnus Netherton | the_hunt (debrief) | You knocked down one of the night watch while they were on duty. They were keeping the log, not hiding anything in it. | Director Netherton |

## Counts

- Pools 4 + 4, bark 1, exchanges 10 lines in three knots: 19 clips, the number `rake app:break_escape:tts:office_lines[m08_the_mole]` reports.
- Talk: rows 1 to 20, with the two `{&...}` rows expanded to three alternatives each, 24 clips. Rows 1 and 11 are the refusal lines; the hubs now send a re-talk with trouble to the same two lines, so no new clip.
- Debrief: 2 clips (rows 40 and 41).
- Total: 45 clips. The earlier "41" counted each `{&...}` row once.

## Existing lines changed

One gate in `m08_closing_debrief.ink`: the conduct beat in `the_hunt` also opens when `julian_ko` or `agnieszka_ko` is set, with rows 40 and 41 as the Director's line. No existing spoken line was reworded.

## Not spoken

The HaX tip-off texts (phone text), the console texts and the object descriptions are screen text, not voiced.

The older analyst bark ("Nobody's said a word on this floor for an hour. I counted.") is unchanged and listed in SPOKEN_LINES_ROOM_TONE_V1.md.
