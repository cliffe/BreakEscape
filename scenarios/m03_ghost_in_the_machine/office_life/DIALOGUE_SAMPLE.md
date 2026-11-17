# m03 office life: dialogue sample

For the user's approval before any line goes into the scenario (plan slice 5, `M03_OFFICE_LIFE_PLAN.md` section 6 on `plan/ol-m03`). Nothing here is in the scenario or ink yet, and nothing is voiced.

**Clips.** 49 new clips (the plan budgets about 51): 16 pool lines, 11 exchange lines, 20 conversation lines, 2 barks. Every one needs the user's voicing yes. Lines marked "no clip" are on-screen text only (the laptop and HaX's texts) or player choices. No existing m03 line changes.

**When this is heard.** Thursday afternoon at WhiteHat, Callaghan Square, Cardiff, between the briefing and the card clone. Both staff are hidden before the night turn, so no line is ever heard at night. Pool lines play one per speaker per shared break (`reception_coffee` for `coffee`, `hallway_cooler` for `cooler`), only within earshot, with a 2-minute cooldown, and are muted while a conversation or cutscene is open. Exchanges are heard once each.

## The two voices

**Zainab Hussain** (`zainab_hussain`, voice Achernar). Field engineer, mid-thirties, British Bangladeshi, from Leeds, a few months at WhiteHat after eight years on the road. Dry, down-to-earth and quick; she talks in short practical sentences and finds most of the office faintly ridiculous. Same person as the course host: she once left a tablet on a train and says so.

**Yusuf Demir** (`yusuf_demir`, voice Alnilam). Senior consultant, mid-forties, British Turkish, came over from running security in-house. Steady and careful, with a deadpan line in understatement; he is the one who says "write it up". He is waiting in reception for a late client and has left his pass at home, which is why he is out there at all.

Both are ordinary WhiteHat staff who know nothing about Zero Day. They give no clue and set no task.

## Pool lines (16 clips)

| Clip | Speaker | Pool | Line | Chars | Change from plan |
|---|---|---|---|---|---|
| 1 | Zainab | coffee | Van's on a yellow line. Two minutes. | 36 | |
| 2 | Zainab | coffee | Three sites today. This is my lunch. | 36 | |
| 3 | Zainab | coffee | Milk's off again. Who buys the milk? | 36 | |
| 4 | Zainab | coffee | Cardiff traffic's worse than Leeds. | 35 | |
| 5 | Zainab | cooler | Eight years in vans. I live on water. | 37 | |
| 6 | Zainab | cooler | The cups have walked off again. | 31 | |
| 7 | Zainab | cooler | Locked my screen. Old habit, that. | 34 | new; replaces "My laptop's on two per cent." |
| 8 | Zainab | cooler | Last site had no signal at all. | 31 | |
| 9 | Yusuf | coffee | Client's stuck on the M4. Again. | 32 | new; replaces "My client's twenty minutes late." |
| 10 | Yusuf | coffee | Is there any proper coffee left? | 32 | |
| 11 | Yusuf | coffee | Strong, no sugar. Like my passwords. | 36 | |
| 12 | Yusuf | coffee | Report's due Friday. It's Thursday. | 35 | |
| 13 | Yusuf | cooler | Back-to-back calls all morning. | 31 | |
| 14 | Yusuf | cooler | This cooler wants a service. | 28 | |
| 15 | Yusuf | cooler | Patching on a Thursday. Brave. | 30 | |
| 16 | Yusuf | cooler | Bluebirds won, I'm told. | 24 | |

Why the two changes:

- Clip 7: a laptop on two per cent sat oddly beside a laptop the player can find open, and beside Ffion's lost charger at night. The cooler trip is the long one, after which her laptop is always locked (`lockIfAwayOverSeconds`), so the new line is true whenever it can be heard, and it carries the course's lesson in her own voice.
- Clip 9: a pool line repeats over the afternoon, so "twenty minutes late" goes stale on the second hearing. The M4 keeps it local and stays true.

## Exchanges (11 clips)

Owner Zainab, `with: "yusuf_demir"`, at either machine. Knots live in `ink/m03_npc_zainab_hussain.ink`. Each `requireGlobal` includes `{ "wh_staff_upset": false, "receptionist_ko": false, "zainab_ko": false, "yusuf_ko": false }`.

### `ex_open_door` (about 16 s)

| Clip | # | Speaker | Line | Chars |
|---|---|---|---|---|
| 17 | 1 | Zainab | Sterling says her door's always open. | 37 |
| 18 | 2 | Yusuf | It is. Nobody gets past it. | 27 |
| 19 | 3 | Zainab | Who are the after-hours lot, then? | 34 |
| 20 | 4 | Yusuf | Not our clients. Not our business. | 34 |

### `ex_tailgate` (about 16 s)

| Clip | # | Speaker | Line | Chars |
|---|---|---|---|---|
| 21 | 1 | Zainab | Someone followed me in this morning. | 36 |
| 22 | 2 | Yusuf | And you held the door for them. | 31 |
| 23 | 3 | Zainab | They had a lanyard. And a coffee. | 33 |
| 24 | 4 | Yusuf | A coffee isn't a badge. Write it up. | 36 |

### `ex_client_sites` (about 12 s; adds `"reception_badge_cloned": true`)

| Clip | # | Speaker | Line | Chars |
|---|---|---|---|---|
| 25 | 1 | Yusuf | Is Danny back from client sites yet? | 36 |
| 26 | 2 | Zainab | Evenings only, these days, I hear. | 34 |
| 27 | 3 | Yusuf | Must be some client. | 20 |

None of these is a clue. The after-hours question matches what Ffion already says about the training side in the back, and the Danny reply repeats her public line that he is out in the day and back in the evening. Nothing places Danny, Victoria or Terry.

## Conversations, short form (20 clips)

Player choices are not voiced. Both files follow the m03 hub pattern (`hub_quiet`, every exit parks at the hub). One extra line per NPC covers `wh_staff_upset` (an attack on either of them, or Ffion knocked out by day), and then the conversation closes.

### Zainab, `ink/m03_npc_zainab_hussain.ink` (10 clips)

```
start (first visit)
  28  Zainab: Hiya. Here to see Sterling? Good luck.
hub (re-entry, not quiet)
  29  Zainab: Still about? The sofa's not getting any comfier.
  [Why are you working out here?]
  30    Zainab: Bench room's full of test kit, so this is my desk.
  31    Zainab: Ffion lets me plug in, and I bring her biscuits. Fair trade.
  [Been with WhiteHat long?]
  32    Zainab: Since the spring. I came down from Leeds, and I'm still on the road most days.
  33    Zainab: Eight years of vans and trains. I left a tablet on a train once. Never again.
  [Any chance you could badge me through to the back?]
  34    Zainab: Visitor passes are Ffion's job, not mine.
  35    Zainab: Anyway, this lanyard's only got my van keys on it.
  [I'll let you get on.]
  36    Zainab: Ta-ra, love.
upset (wh_staff_upset)
  37    Zainab: Stay away from me. I mean it.
```

### Yusuf, `ink/m03_npc_yusuf_demir.ink` (10 clips)

```
start (first visit)
  38  Yusuf: Afternoon. If you're my client, you're very late.
hub (re-entry, not quiet)
  39  Yusuf: Still here. Still waiting.
  [Who are you waiting for?]
  40    Yusuf: A client from down the Bay. They want a test and a nice report.
  41    Yusuf: And I've left my pass at home, so I wait out here like a visitor.
  [What does a senior consultant actually do?]
  42    Yusuf: Scoping calls, meetings and reports. Mostly reports.
  43    Yusuf: The breaking-in part is about one day a month.
  [Have you always done this?]
  44    Yusuf: I ran security in-house for years. Policies, audits, the lot.
  45    Yusuf: Here, at least, somebody else has to fix it.
  [I'll leave you to it.]
  46    Yusuf: Good luck in there.
upset (wh_staff_upset)
  47    Yusuf: Stay back. I won't ask you again.
```

Both badge answers close the cloner question in-world: Zainab's lanyard holds van keys, and Yusuf has no pass with him. Neither opener repeats a pool line.

## Barks (2 clips, voiced by hand outside the extractor)

| Clip | Speaker | Trigger | Line | Chars |
|---|---|---|---|---|
| 48 | Yusuf | `npc_ko:ffion_rees` by day | Zainab, ring someone. Now. | 26 |
| 49 | Zainab | `npc_caught_at_post:zainab_hussain` (cooldown 30 s) | That's my laptop. Can I help you? | 33 |

HaX texts (on-screen, no clip), unchanged from the plan:

- on `wh_staff_attacked`: "Leave the staff alone. You're here to clone cards, not start fights."
- on Ffion knocked out with the staff present: "Reception had company. Get the badge and get out."

## Laptop `textVariants` (no clips)

`zainab_laptop`, readable with `readDisplay: "gameDisplay"` and `addToNotes: false`. Tried in this order; the first match wins, and the base `text` is the fallback.

```jsonc
"text": "Zainab's laptop. She's working on it, and she tips the screen away from you.",
"textVariants": [
  { "condition": "globalVars.mission_phase === 'act2_infiltration'",
    "value": "Zainab's laptop, lid shut, left on the coffee table for the night." },
  { "condition": "globalVars.wh_staff_upset",
    "value": "The lid's been snapped shut. Nobody's working on it now." },
  { "condition": "globalVars.zainab_laptop_screen_locked",
    "value": "Zainab's laptop. The screen's locked: a login box over a photo of the Yorkshire Dales." },
  { "condition": "globalVars.zainab_laptop_owner_away",
    "value": "Zainab's laptop, open and unlocked on her calendar and the team chat.\n\nTHIS WEEK\nMon: Newport. Collect test laptops from client.\nTue: Swansea. Return loan kit, sign off.\nWed: Bristol. Site visit, set up test kit.\nThu: Bench room full again. Sofa.\nFri: Cardiff Bay. New client, kit drop.\n\nPINNED, from V. Sterling:\nReminder: client data stays on client kit. Nothing comes back on our own laptops. No exceptions.\n\nZainab, to Team:\nAnyone know who the after-hours lot are? Their pizza boxes are in the recycling every morning.\n\n(No replies.)" }
]
```

Checked against the plan's list: no password, PIN, card number, key code, server room detail, `Sterling2010`, `5829`, VM flag or hint to any of them; no route to either card, the exec office lock, the safe or the drop site. The pizza boxes echo Ffion's "I only order the pizzas". Only the away-and-open variant shows anything.

## Departures from the plan

1. Two pool lines replaced (clips 7 and 9, reasons above).
2. Conversations come to 20 clips, not about 22, which brings the total to 49 instead of about 51.
3. Each conversation has one `wh_staff_upset` line, so a player who attacks a staffer or knocks Ffion out does not get a cheerful greeting. The plan's section 6 did not list this.
4. The laptop's attended text adds that she tips the screen away, so the base variant shows a careful owner.

## Lines worth a close look

- Clip 11, "Strong, no sugar. Like my passwords." A joke about passwords from the security lead. It names no password, but you may feel it is too knowing.
- Clip 20, "Not our clients. Not our business." Is a shrug right for a careful security lead, or should he sound more uneasy?
- Clip 36, "Ta-ra, love." A Yorkshire goodbye; check that Achernar says it naturally before voicing the rest.
