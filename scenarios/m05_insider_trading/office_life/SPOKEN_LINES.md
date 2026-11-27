# m05 Insider Trading: office-life spoken lines

Every line this plan adds. Pool lines are scenario data (NPC `chatter`); exchanges and conversations are ink knots. None changes an existing line. Speakers are settled under D82a and D82b.

## Pools (40 characters at most)

| Speaker | Pool | Line | Chars |
|---|---|---|---|
| niamh_doherty | coffee | This machine hates me personally. | 33 |
| niamh_doherty | coffee | Oat milk's gone again. | 22 |
| niamh_doherty | coffee | Third one today. Don't judge. | 29 |
| niamh_doherty | coffee | Is it meant to make that noise? | 31 |
| niamh_doherty | cooler | I'm hiding from my inbox. | 25 |
| niamh_doherty | cooler | Everyone's very quiet today. | 28 |
| niamh_doherty | cooler | Nearly there with this deadline. | 32 |
| niamh_doherty | cooler | Tomorrow's all-staff won't write itself. | 40 |
| thandiwe_moyo | coffee | Who keeps leaving the milk jug empty? | 37 |
| thandiwe_moyo | coffee | I'll descale this tomorrow. Probably. | 37 |
| thandiwe_moyo | coffee | Two sugars. It's been that sort of day. | 39 |
| thandiwe_moyo | coffee | Not the good mugs, please. | 26 |
| thandiwe_moyo | cooler | My feet have given up. | 22 |
| thandiwe_moyo | cooler | I've signed for four parcels today. | 35 |
| thandiwe_moyo | cooler | Half five can't come soon enough. | 33 |
| thandiwe_moyo | cooler | Facilities never fixed that blind. | 34 |

## Exchanges (heard once each; on `niamh_doherty`, the lower id)

`ex_whispering`, gate `qdc_staff_upset: false`, `server_room_entered: false`:
1. Niamh: Is the security person still in?
2. Thandiwe: Went past twice. Very serious shoes.
3. Niamh: Apparently they don't send just anyone.
4. Thandiwe: Well, I'm keeping my head down.

`ex_collection`, same gate:
1. Thandiwe: Have you put anything in Lisa's tin?
2. Niamh: A tenner. Nobody will say who it's for.
3. Thandiwe: Then it's not ours to ask.

`ex_heading_home`, same gate plus `server_badge_obtained: true`:
1. Thandiwe: Right, I'm off once I've finished this.
2. Niamh: Lucky. I've got the all-staff to finish.
3. Thandiwe: Don't let them keep you past seven.
4. Niamh: Tell that to the comms calendar.

Each first line stands alone. The whispering and collection lines repeat only what Lisa and the noticeboard flyer already tell the player; neither names anyone. `ex_whispering` carries no clue: line 3 does not tie the security person to any team or to the tin, and an exchange can play before the player has talked to Lisa. Line 3 is 38 characters and line 4 is 31, inside the 40 limit. Clip counts are unchanged.

## Conversations (talkable extras, no choices that matter)

Thandiwe Moyo:
1. Can I help? I'm only the office manager.
2. Help yourself to tea if you're staying.
3. Thanks. These parcels won't chase themselves.

Niamh Doherty:
1. Sorry, deadline. Can it wait?
2. Lisa's the one who knows everyone.
3. I'll be here till late, sadly.

## Cleaner block (Bernadette Lyons, D82b)

Pool, `bernadette_lyons`, coffee:

| Line | Chars |
|---|---|
| One cup, then I'm back on the hoover. | 37 |
| Kettle's quicker, you know. | 27 |
| Last floor before I'm done. | 27 |
| Who leaves a teabag in the sink? | 32 |

`ex_late_again` (on `bernadette_lyons`, the lower id), gate `qdc_staff_upset: false`, `server_room_entered: true`:
1. Bernadette: You again. Do they pay you overtime?
2. Niamh: They pay me in biscuits.
3. Bernadette: Then I'll leave you the good ones.

Conversation (ink, offers nothing):
1. Just the bins, love. Don't mind me.
2. Right you are. Mind how you go.

## Clip count (estimate for V6)

| Block | Clips |
|---|---|
| Pools | 20 |
| Exchanges (4 + 3 + 4 + 3) | 14 |
| Conversations (3 + 3 + 2) | 8 |
| **Total** | **42** |

Pools are Niamh 8, Thandiwe 8 and Bernadette 4. Narrator lines for the extras' conversations, if the ink house style wants one, add one clip each. Bernadette's voice needs its own yes before any of her clips are made.
