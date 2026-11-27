# m05 Insider Trading: office-life analysis (stage 1)

Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named.

## 1. Cast audit

Every person already in m05 is classed under D78 (plot-located, holding or guarding, free, or ambient; classes are the skill's cast-audit step). Only Lisa is free: she takes a `tea` need and one kettle trip, in a single leashed routine (PLAN.md section 2A, built under D84 b). The rest stay put, so office life here is mostly new ambient people.

| NPC | Line | Room | D78 class | Needs? | Why |
|---|---|---|---|---|---|
| `opening_briefing` | `:855` | lobby | plot-located, never | never | briefing |
| `director_netherton` | `:884` | lobby | plot-located, never | never | briefing cast |
| `agent_nightshade` | `:903` | lobby | plot-located, never | never | briefing cast |
| `agent_0x99_handler` | `:920` | lobby | plot-located, never (phone) | never | owns the mission's eventMappings, including `server_room_entered` (`:1184` to `:1186`) |
| `recruiter` | `:1545` | lobby | plot-located, never (phone) | never | TalentStack thread, a clue |
| `patricia_phone` | `:1611` | lobby | plot-located, never (phone) | never | |
| `closing_debrief_trigger` | `:1638` | lobby | plot-located, never | never | debrief |
| `lisa_park` | `:1731` | break room | free | one `tea` need, one fridge trip (PLAN.md section 2A) | "sit by the kettle" (`m05_npc_lisa_park.ink:61`), "nowhere to be" (`:138`), "I'll be here" (`:164`); the narrator puts her "by the break room counter... a collection tin at her elbow" (`:56`). The tin is `qdc_collection_tin1` (gid 1183, x 90 to 100, y 67 to 79), decor with no scenario id. No line-of-sight mappings in m05. Post-fate lines describe the office from her post (`:125` to `:136`). KO global `lisa_ko` (`:1748`), exported (`:662`). |
| `owen_gallagher` | `:1782` | open office | holding or guarding (items `:1807` to `:1831`, post (6,4)) | no | RFID clone source by proximity, keycard, door log, password note; KO route. KO global `owen_ko` (`:1799`). |
| `dr_halloran` | `:2073` | research lab | plot-located (suspect, `halloran_accused`; post (6,6)) | no | optional witness; `halloran_ko` (`:2091`) |
| `patricia_morgan` | `:2153` | Patricia's office | holding (items `:2172` to `:2204`, post (3,3)) | no | badge and vetting files; `patricia_ko` (`:2170`) |
| `david_torres` | `:2291` | data centre | plot-located, hostile, `initiallyHidden` (`:2321`) | no | the insider; `torres_ko` (`:2308`) |

Every room NPC is attackable (no `disableAttacks`). The atlases for `lisa_park` and `owen_gallagher` have seated and drink, use and phone frames; only Lisa gets a need, and only for the kettle trip.

Beats keyed on presence or position that office life must not touch:
- Lisa's whole conversation, at her post (4,4) by the kettle and the espresso. She may leave it only under the gates in PLAN.md section 2A.
- Note: her one trip goes to the staff fridge (90 px from her post), not the kettle, so the walk out and back is visible; the kettle's use cell was 25 px from her post and the engine ends a walk within one tile of its goal. Details in PLAN.md section 2A.
- Owen's RFID clone, which needs the player near him in the open office, and his KO route.
- The lobby briefing and debrief cutscene records.
- The pamphlet (`entropy_pamphlet`, notes3 slot at (202,104), at the free-standing espresso's east foot and not on a counter; sets `found_pamphlet`), "dropped behind the coffee machine".

Names the whodunnit uses, so no extra may carry them: the crypto team (Ruth Halloran, David Torres, Amara Okafor, Tomasz Wierzbicki, Hannah Leigh, Sanjay Rao, Ben Ashworth, Chloe Marsh, `m05_npc_patricia_morgan.ink:277` to `:278`), Torres' family (Elena, Sofia, Miguel) and the CEO, Jennifer Zhao. That rules out course characters Adaeze Okafor, Tomasz Wisniewski and Sofia Marchetti. Voices already in m05 (the narrator is Algenib, scenario `:119`, with no clash with the picks): Aoede, Charon, Enceladus, Gacrux, Kore, Laomedeia, Puck, Erinome, Schedar; so not Adaeze, Lerato, Anjali, Yasmin, Jun or Lorna either. Fatima Begum is a recruitment lead, and recruiting is a clue thread, so not her.

### Extras from the awareness cast (D53)

Candidates with free voices and full atlases (seated, `pose_drink`, `pose_use`, `pose_phone`, checked in each `.json`). Jobs from `planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md`.

| Character | Voice | Course job (line) | Fit at a crypto firm's head office |
|---|---|---|---|
| Niamh Doherty | Leda | internal comms officer, mid 20s (`:100`) | Lisa's colleague in marketing and comms; good as the late worker drafting tomorrow's all-staff note |
| Thandiwe Moyo | Pulcherrima | studio manager, 30s (`:110`) | office manager; goes home at a set time |
| Graham Whitfield | Umbriel | finance training lead, early 60s (`:80`) | finance; age spread |
| Agnieszka Duda | Callirrhoe | part-time payroll officer, 30s (`:79`) | payroll; part-time, so leaving early is natural |
| Gwen Pritchard, Nilesh Solanki, Ibrahim Diallo, Ama Owusu, Darren Price | various | IT or security roles | rejected: an IT or security staffer in the break room reads as a suspect or witness in a mission about who has been in the servers |
| Chidi Okeke, Julian Sallow, Joanne Pell | various | fleet, founding partner, L&D | weak fit (fleet, a partner) or close to Patricia's vetting thread (L&D under HR) |

The pick is settled: D82a, Thandiwe Moyo goes home on time and Niamh Doherty stays late.

### Cleaner

No cleaner exists in the course cast with art or a voice. The course names "Bernadette Lyons, Carrholme cleaner" on screen only (`BRAND_SET.md:110`), and no cleaner or janitor atlas exists. Bernadette Lyons is settled under D82b: a new character, art made separately, sprite key `bernadette_lyons` (PLAN.md section 2.13).

## 2. Acts and the global that turns each

There is no timetable field and the clock emits no events.

| Act | Clock (estimate) | Turned by |
|---|---|---|
| Day | 16:30 to about 17:30 | game start |
| Evening | about 17:30 to 19:50 | `server_room_entered` (`:1186`, set once on first entry to the server room) |
| Night | 19:50 on | `torres_identified` (anchored to 19:50 at `:637`; also turns the corridor to motion lighting) |

`server_room_entered` suits the evening turn because the player then spends real time on the VM, away from the front-of-house rooms, so the change is never seen happening, and the clock moves on meanwhile. A typical player reaches the server room 20 to 30 real minutes in, about 17:20 to 17:45 on the clock (estimate).

## 3. Rooms and machines

| Room | Map | Size | Office-like? | Machines and seats (Tiled) | Verdict |
|---|---|---|---|---|---|
| Lobby (`reception_lobby`, `:833`) | `room_qdc_lobby` | | reception | reception counter with pc11 and phone1, `leather_sofa1`, `club_chair_e1`, glass coffee table; no receptionist | leave alone |
| Corridor (`main_corridor`, `:1690`) | `room_qdc_hall` | 10x6 | thoroughfare | `water_cooler1` (76,86, 24x47; collision 78,78,20x8), `drinks_vending1` (184,88; collision 186,80,38x8), `bin1`, noticeboard with `collection_flyer` (`:1708`) | cooler only |
| Break room (`break_room`, `:1719`) | `room_qdc_break` | 10x10, dead end | kitchen | `qdc_espresso1` (158,96, 44x54; collision 160,86), `kettle1` (98,79, on the undercounter fridge; the kitchenette spans x 32 to 86, and the free-standing espresso x 158 to 202), `qdc_fridge1` (34,160), `undercounter_fridge1`, `vending_machine1` (244,196), two `desk3` tables (83,196 and 159,196) with eight `hospital_chair_north/south`, `uni_sofa2`, two beanbags, foosball, `qdc_recycling_bins1` (190,258), `mugs_tray1`, collection tin | yes |
| Open office (`open_office_area`, `:1766`) | `room_qdc_open` | | office | `photocopier1`, three `zds_desk1`, IT workbench, 6 chairs, pc8, pc11, pc6, laptop1, phone3 | leave alone |
| Server hallway, server room, lab, Patricia's office, Torres' office, data centre | | | story rooms | | leave alone |

Presets (`js/data/office-presets.json`): coffee and kettle are capacity 1 with no chatter; the cooler is capacity 2 with the `cooler` pool. A two-person chat point at the espresso needs `capacity: 2` and `chatter: "coffee"` written on the object. The `fridge` preset already lists `qdc_fridge1`.

Rooms load lazily: the break room's NPCs simulate only once the player has entered the break room. Before that, nobody visits the corridor cooler.

Hard-rule secrets: no office-life object carries a PIN, password, key, card, code, flag or a lock's item type. Nothing in this plan adds a readable item.

Existing barks or grumbles to move into pools: none.

## 4. Where office life adds something, and where it adds nothing (D74)

- **Break room: adds.** Lisa sits alone in a ten-by-ten room and opens with "Everyone's been whispering". Two colleagues at the tables, a coffee run and a murmur of gossip make that line true on screen. The evening turn also lands here: one of them goes home, one stays late.
- **Corridor cooler: adds, lightly.** The corridor is the room the player crosses most (lobby, break room, open office and server hallway all meet there). An occasional pair at the cooler is the most-seen piece of office life for the least work. It turns off at night, when the corridor goes motion-dark.
- **Lobby: nothing.** It is the start room and holds the briefing and debrief records. Patricia owns the badge story; a receptionist would offer the player a second, easier route to a badge.
- **Open office: nothing worth the risk.** Owen's RFID clone needs proximity, and a witness there changes the force route in a critical-path room. Desks sit near the doors to the lab and Torres' office, so a needs walk would cross story doors.
- **Server side, lab, Patricia's and Torres' offices, data centre: nothing.** Story rooms, mostly locked and motion-dark; staff wandering in would contradict the plot.

## 5. Tier

**Tier 2, small.** Three ambient extras with needs (two by day, a cleaner in the evening), two capacity-2 chat points (espresso and cooler), four exchanges, mapped breaks, one evening turn and the existing night turn. No new room, no levers, no openings. A cleaner, Bernadette Lyons, joins for the evening (D82b, PLAN.md section 2.13). Tier 1 (presets only) gives nothing, because nobody in m05 can use a machine. Tier 3 would mean openings, and every candidate opening touches the whodunnit.
