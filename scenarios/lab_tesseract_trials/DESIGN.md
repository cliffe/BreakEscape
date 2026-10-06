# The Keyholder Trials: design

Folder `lab_tesseract_trials` (working title retired from the fiction: "Tesseract" is canon, see the brief). Kind of game: **lab scenario with SAFETYNET spy framing**. Aim: a short, fun escape-room mission where every lock opens by decoding or decrypting something in CyberChef, HaX's field notes do the teaching, and the dialogue sounds like the campaign, lighter and shorter.

Status: **design v4 (build version)**, after review rounds 1-3 (`REVIEW_R1_A.md`, `REVIEW_R1_B.md`, `REVIEW_R2_A.md`, `REVIEW_R2_B.md`, `REVIEW_R3.md`), the browser probes (`scenarios/test-tesseract-probes/PROBE_RESULTS.md`) and the orchestrator's resolutions (`DECISIONS_LOG.md`, `DECISIONS_PENDING.md`). Built (scenario.json.erb, ink/), then fix rounds 1 and 2 (see the build notes at the end); both engine changes (D1, D2) are committed. Every finding is answered in "Changes in v2", "v3" and "v4" at the end. The user has decided D2 (the server must check the claimed unlock method against the lock; the engine fix is in the working tree, uncommitted, and must be committed before this scenario, as for D1) and D3 (60-75 minutes is acceptable; keep all locks; a timed blind playtest decides any cuts).

**Rooms (2026-10-06):** the mission now runs on ten purpose-built university maps (`room_uni_*`), including three new rooms: a lecture theatre (Tom), Special Collections (the safe) and a seminar room (Sidhu). Section 3 is current. Build notes, checks and screenshots are in `ROOMS_PLAN.md` sections 9-12 and `build_evidence/rooms/`. The play-time estimate with the added walking is in `SOLUTION_GUIDE.md`.

## 1. Pitch and play time

**Pitch.** Freshers' week at Miskatonic University UK. CryptoSecure Recovery, the front for Ransomware Incorporated, is funding a studentship for first-years who are good with codes: the **Keyholder Studentship**, £9,000 a year and fees paid. Nobody applies. You're found, by solving a trail of puzzles around the Computing building: the **Keyholder Trials**. Agent HaX sends Agent 0x00 in undercover as a first-year to get picked. The Trials start with numbers on a leaflet and end with hybrid encryption (an AES key sealed to your own public key), which is how ransomware works too. All the way through, an examiner signing as "Keyholder" comments on your progress from a small black terminal. Dr Tom Shaw gives you a lab laptop running CyberChef, Dr Sidhu Selvarajan shows you what a hash and a signature can and can't prove, and Dr Cliffe Schreuders keeps building something in his workshop and calls you "Agent" once, by accident or not. At the end the examiner comes on video. It's Ghost, the hooded voice from St Catherine's, and Ghost recognises you. They want you anyway, as their double agent inside SAFETYNET, and the first thing they want is a signed report sent to HaX. Decode it before you send it and you'll find a tracking pixel that would tell Ghost where HaX opened it.

**Kind of game and aim.** A lab scenario with the SAFETYNET spy framing (AGENTS.md "Lab, demo and test scenarios", with the user's aims from the brief): a short escape room that teaches encoding and encryption from nothing, with campaign-style dialogue, lighter and shorter. No VMs, no combat (`"disableAttacks": true`), no quizzes.

**Assumed knowledge: none.** The first two rooms teach bits, bytes, number bases, character encodings and ASCII through objects (a front-panel "Byte Wall", an ASCII chart handout, a punched paper tape, Tom's chalkboard) before the first lock asks for any decoding. Each early lock teaches one idea, and later schemes are introduced as extensions of earlier ones (hex = 4 bits per digit, Base64 = 6 bits per symbol with a worked example, Caesar = the first scheme with a key, and so on).

**Play time.** The brief's aim is 45-60 minutes. Reviewer B's estimate for a real first-year against the v1 design was about 85. v2 takes about 10 minutes out without cutting a scheme:
- CyberChef keeps its state when the laptop closes (engine change D1, user-approved and now implemented, uncommitted), which removes the re-typing that inflated Act 3;
- Tom and Sidhu hand over their field notes in person (five of the eleven), so the HaX phone round trips drop by half;
- field notes are shorter (four headings, about 100 words each);
- AES and RSA instructions name only the fields the player types into.

**Revised time budget (v3).** Review R2-B estimated about 80 minutes (70-90) for v2, most of the overrun in Act 3 friction. v3 removes that friction:
- the notepad's pencil becomes the scratch pad for the IV and the AES key, so a lost IV no longer means redoing L7 (saves 2-5 minutes, more when the IV would have been lost);
- FN1 writes down how to drive CyberChef (saves 1-2 minutes of fumbling);
- the leaflet copies cleanly, so the first decode doesn't fail;
- the signature and hash traps are named where the player looks, so the optional checks stop sending players round in circles;
- the hash can be added under AES Decrypt in the recipe already open.

| Block | v2 design | R2-B estimate for v2 | **v3 planning figure** |
|---|---|---|---|
| Briefing | 4 | 4 | 4 |
| Foyer exhibits, Jordan, Tom, first look at CyberChef | 9 | 11 | 10 |
| Act 1, L1-L4 | 13 | 14 | 13 |
| Act 2, L5-L7 with Sidhu and Megan's file | 16 | 18 | 17 |
| Act 3: pigeonholes, RSA, AES, workshop, hash | 15 | 20 (25 if the IV is lost) | 16 |
| Climax: call, decode, scoreboard, decide | 9 | 10 | 10 |
| Debrief | 4 | 4 | 4 |
| **Total** | **60-75** | **about 80 (70-90)** | **about 74 (65-80)** |

That's over the brief's original 45-60 but inside the 60-75 the user accepted (D3), near its top. All locks stay. The first playtest is a blind run with a stopwatch timing each block; if it comes in over 75, the cut list in Q3 is applied in order.

**Where it sits in the timeline.** After m02 (0x00 met Ghost at St Catherine's: Ghost was a terminal voice and then a hooded figure on video, and watched the agent through the hospital's cameras) and independent of m03-m08. In canon Ghost is still unidentified and at large (m02 closing debrief `q_ghost_identity`; m03 only adds the ZDS invoice for the ProFTPD exploit; m06's "Satoshi's Ghost" and m07's "Ghost Protocol" are different people). Nothing here unmasks Ghost or changes those facts. Freshers' week is late September, at least ten months after St Catherine's (November 2024 in the cell bible), so lines say "St Catherine's" and never "last month", and never mention later missions either way. A player who skipped m02 gets enough from the briefing to follow. The double-agent ending is **lab-local**: it doesn't become campaign canon (m08's mole plot is untouched) unless the user decides otherwise.

**Names.** The studentship, the trail and the examiner's contact are all "Keyholder" (Ghost's cell holds the keys; LockStock is its ransomware family in the cell bible). The phone contact shows "Keyholder" for the whole game, because the engine can't rename a contact at runtime; Ghost names themselves on the video call, and the debrief and credits say "Ghost". Nothing in-game uses "Tesseract". New NPC names were checked against the repo ("Ashworth", m05, and "Hollis", m07, are taken), hence Megan Oyelaran and Jordan Pike.

## 2. Cast

Accents come through word choice and rhythm only, never phonetic spelling. Every speaking character gets their own `voice` (a different Gemini voice each, accent named with "consistent ... throughout") and, until the art exists, their own placeholder sprite sheet, so no two characters share one (validator rule). Placeholders are in section 10.

| Character | id / ink file | Role | Voice notes (words and rhythm) | Knows | Wants |
|---|---|---|---|---|---|
| **Agent HaX** (Haxolottle) | `agent_0x99` phone NPC, `ink/phone_agent_0x99.ink`; hidden person NPCs `briefing_cutscene` (`ink/opening_briefing.ink`) and `closing_debrief_person` (`ink/closing_debrief.ink`), as in m01 | Handler. Teaches through field notes, hints when asked, reacts to progress. | As in m01/m02 and the voice bible: brisk RP, short sentences, dry. The 🦎 only occasionally, on good news, never on bad news or in speech. Voice Aoede, same style string as m01. "She". | Ghost's St Catherine's file; that CryptoSecure fronts Ransomware Inc.; that two of last year's Keyholders now work for CryptoSecure. Doesn't know who runs the Trials, and suspects. | Someone inside the cell's recruitment, and she's gambling that it can be 0x00 (section 8, "Why 0x00"). Also that 0x00 comes back. |
| **Ghost**, contact name **"Keyholder"** all game | `ghost`, phone NPC on the Keyholder device (`phoneId: keyholder_device`, `phoneTheme: terminal`, **no `currentKnot`**, see section 5 build rules), `ink/phone_ghost.ink` | Recruiter and examiner. Never in person. One short terminal line after each Trial (section 8, "Ghost before the call"), then the hooded video call at the climax, where they name themselves. | As m02 (`m02_phone_ghost.ink`): precise, unhurried, uses numbers as weapons ("Two hundred and twelve candidates picked up a card. Forty opened the locker."), formal business register, dry put-downs, never raises the pitch. Iapetus voice, `voice-distortion` FX, same style string as m02, so returning players can recognise the voice early. Pronoun "they" (m02; the cell bible's "he" is an old inconsistency, not copied). | Who 0x00 is from the first minute: at St Catherine's Ghost switched off the camera *recorders*, not the cameras, and watched the agent all night (m02's "RECORDER OFFLINE" monitors; "Tonight I have had it on you"). That SAFETYNET sent them. Everything a talent-spotter knows about each candidate. | In Ghost's idiom (m02's "show your working"): proof that 0x00 will pay a real price. "SAFETYNET audits everyone and publishes nothing. The only number I judge a recruit on is what they were willing to give up." HaX's location is that price. |
| **Dr Z. Cliffe Schreuders** | `cliffe_schreuders` (common room, early) and `cliffe_workshop` (workshop, end), one ink `ink/npc_cliffe.ink` with two entry knots | Leader / story NPC, not a helper. Building something in his workshop (section 9). **His beat:** he's the one who points at the out-of-band channel, without saying why he knows it exists. | Australian through word choice: "reckon", "mate" (sparingly), "no worries", "heaps", understatement, sentences that stop a beat early. Laconic and amused. Answers a question with a better question. Voice Orus, "consistent Australian accent throughout, relaxed, dry, quick". | That the player is an agent. Never says how. Possibly more. | To finish the build. Possibly to watch what the player does with the offer. Left open. |
| **Dr Tom Shaw** | `tom_shaw`, lecture theatre (his lab account PCs are in the teaching lab), `ink/npc_tom.ink` | Helper. Runs the first-year induction. Gives the CyberChef lab laptop and the induction handouts (FN1-FN3), sets up the player's lab key pair, teaches bases on his chalkboard. **His beats:** the pop-out tab and notepad-pencil lines; the Magic line ("It'll do the first few for you. It'll do nowt once there's a key. That's the bit they're paying for."); the tracking-pixel line about CryptoSecure's mailer; and his reaction to the Keyholder terminal in his own lab ("Someone's put a terminal in my lab I never ordered. Half a mind to break into it myself. Go on then, you first."). | Huddersfield through word choice: "right then", "owt"/"nowt", "it's not rocket science, it's base two", "go on then". Warm and practical, keen on breaking things to see how they work. Voice Fenrir, "consistent West Yorkshire (Huddersfield) accent throughout, warm, encouraging, quick". | How to use CyberChef. That CryptoSecure's stand turned up this year without going through the department, and that nobody ordered the guest terminal in his lab; he says both. How tracking pixels work. | Students who learn by doing. On the player's side, and mildly, practically suspicious of CryptoSecure. |
| **Dr Sidhu Selvarajan** | `sidhu_selvarajan`, the seminar room through his office off the corridor, `ink/npc_sidhu.ink` | Helper. Hashing, integrity, signatures. His whiteboard is a toy hash-chain ledger from his blockchain lecture, and holds the Vigenère key. Hands over FN7 and FN10, and with FN10 plants his scene: "If anyone hands you something signed, bring it to me. I like to watch a signature check out." **His beat:** when the player brings him the report after the relay terminal opens (also pointed at by `report.sig`'s observations): "It verifies. That tells you who wrote it, and that nobody has changed it. It does not tell you whether you should send it." | Indian English through rhythm and register, respectful: precise, courteous, an editor's ear ("Let us be exact about this."), small concrete examples. The stock markers "see," as an opener and "isn't it?" as a tag are **not** used unless the user approves them in the voice sample (Q11). Voice Enceladus, "consistent Indian English accent throughout, calm, precise, warm". | Hashes, chains, signatures. Has noticed CryptoSecure's leaflet asks students to "verify everything", and approves. | That the player checks what they're given. Firmly on the player's side. |
| **Jordan Pike** | `jordan_pike`, foyer stand, `ink/npc_jordan.ink` | The only ENTROPY presence in person, and a small one: CryptoSecure campus ambassador, third-year, an earlier Keyholder. Hands out the leaflet. | Salesy student rep: "honestly", "no pressure", "it's literally free money", talks fast, laughs at his own lines. Voice Puck, "consistent Estuary English accent throughout, upbeat, fast". | That CryptoSecure pays well and asks odd questions. Suspects more and chooses not to look. | His referral bonus. |
| **Megan Oyelaran** | `megan_oyelaran`, common room, `ink/npc_megan.ink` | Fellow first-year chasing the studentship, and the mid-mission moral choice (section 8). Teaches by example: she's stuck on Trial II because she typed the run-together digits straight in. | Bright, skint, competitive, Mancunian through word choice ("our mam", "proper", "dead good"). Voice Leda, "consistent Manchester accent throughout, quick, wry". | Her debts. Nothing about ENTROPY. | The money. Her mum's care fees. |
| **Narrator** | top-level `narrator` | Stage directions in cutscenes. | Voice Algenib, as m01. | | |

Who's in on what: Tom and Sidhu are clearly on the player's side. Jordan is a small-time ENTROPY asset who doesn't know about St Catherine's. Megan is an innocent. Cliffe's position is left open. Ghost knows everything.

## 3. Rooms

**Updated 2026-10-06 for the university rooms** (`ROOMS_PLAN.md`, Phases 0-4; build notes in its sections 9-12). Every room now uses its own `room_uni_*` map: builder rooms in `scripts/generate_rooms.py`, on sheets from `scripts/room_gen/make_uni_tileset.py`, registered in `core/game.js`, the schema enum and the README room table. Every scenario object lands on a map slot (`slot_audit.py`: 0 problems). Digit-suffixed types claim theirs with `"position": "as-type:<base>"`, because `TiledItemPool` strips trailing digits from slot names but not from a scenario `type`. No object carries pinned coordinates any more. The graph grew from seven rooms to ten (eleven with the optional staff office, off the common room): a lecture theatre (Tom's induction), Special Collections (the safe) and a seminar room (Sidhu and his ledger). No lock was added or moved in the chain. `check_door_alignment.py` passes all 10 links and the validator reports no overlaps.

### Layout and connections

```
 [ SPECIAL COLLECTIONS ]      [ WORKSHOP (key, L9) ]         [ SEMINAR ROOM ]
  room_uni_special 10x10        room_uni_workshop 10x10        room_uni_seminar 10x10
  safe L6                       relay L10, scoreboard          Sidhu, ledger whiteboard
        | S (open)                    | S                            | S (open)
 [ LIBRARY (PIN, L5) ] -W- [ COMPUTING CORRIDOR (pw, L4) ] -E- [ DR SELVARAJAN'S OFFICE ]
  room_uni_library 10x6       room_uni_corridor 10x6            room_uni_office 10x6 (open)
  returns slip                poster, pigeonholes L7,           FN7 desk copy, door card
                              drop box L8b, directory
                                    | S
 [ TEACHING LAB ] --W-- [ FOYER (START) ] --E-- [ STUDENT COMMON ROOM ] --E-- [ STAFF OFFICE ]
  room_uni_lab 10x10      room_uni_foyer 10x10     room_uni_common 10x10        room_uni_staff 20x10
  guest terminal L3,      Jordan, stand L1,        Locker 4 L2, Megan,          (open, optional)
  lab account PC          Byte Wall exhibits       Cliffe (early)               Dr Illiashenko
                                    | S (open)
                         [ LECTURE THEATRE ]  room_uni_lecture 20x10
                          Tom: laptop, FN1-3, "Hi" whiteboard
```

Grid positions (GU, from the BFS in `core/rooms.js`): foyer (0,0) 2x2; lab (-2,0); common room (2,0); lecture theatre (0,2) 4x2; staff office (4,0) 4x2; corridor (0,-1) 2x1; library (-2,-1) 2x1; Sidhu's office (2,-1) 2x1; workshop (0,-3) 2x2; Special Collections (-2,-3) 2x2; seminar room (2,-3) 2x2. N/S pairs land on a corner (foyer↔corridor and foyer↔lecture theatre on the left; corridor↔workshop, library↔Special Collections and office↔seminar room on the right); E/W doors are on row 2. The 10x6 rooms (corridor, library, office) show only two rows of floor (y 64-128), because the 10x10 room south of each covers the rest.

| Room id | Type | Door into it | Purpose |
|---|---|---|---|
| `foyer` | `room_uni_foyer` | start | Freshers' fair. Heritage display (Byte Wall, plaque, powers-of-two chart, display table with the ASCII chart and paper tape, a glass case of old media). CryptoSecure stand with Jordan. Cutscene NPCs parked here, hidden; phone NPCs registered here. |
| `teaching_lab` | `room_uni_lab` | open | Two benches of PCs. "Your lab account" PC with the key pair. Keyholder guest terminal (L3). |
| `lecture_theatre` | `room_uni_lecture` | open | Tom's induction: CyberChef laptop, FN1-FN3, the "Hi" whiteboard. Tiered seats behind writing ledges. |
| `common_room` | `room_uni_common` | open | Megan. Candidate Locker 4 (L2). Cliffe early, with his laptop. Noticeboard, snack machine, coffee station, kitchenette. |
| `corridor` | `room_uni_corridor` | password (L4) | Trial V poster on the noticeboard, **locked pigeonholes (L7)**, CryptoSecure drop box (L8b) with its tag, floor directory. |
| `library` | `room_uni_library` | PIN (L5) | Issue desk: returns slip (Trial VI) in *The Codebreakers*. |
| `special_collections` | `room_uni_special` | open | Special Collections safe (L6). Reading table, plan chest, display cabinet. |
| `sidhu_office` | `room_uni_office` | open | A desk copy of his hashing handout; his door card points to the seminar room. |
| `seminar_room` | `room_uni_seminar` | open | Sidhu; ledger whiteboard (Vigenère key). |
| `workshop` | `room_uni_workshop` | key (L9, brass key) | Cliffe's build. Relay terminal (L10). Hacktivity scoreboard (the fallback channel). Climax. |
| `staff_office` | `room_uni_staff` | open | Optional side room off the common room's east door, off the critical path. Open-plan staff office; Dr Oleg Illiashenko's desk, with standing spots for more staff later (`ROOMS_PLAN.md` section 13). No objects yet. |

### Objects by room

Types are sprite names from `public/break_escape/assets/objects/`. "(c)" = container with `contents`. Every container states `locked` explicitly (`true` or `false`); see section 5's build rules. Every `text_file` holds **only** the ciphertext in its content; titles go in the name and instructions in `observations` (section 5, rule 3). Every `notes` item inside a container has `readable: true`, `takeable: true` and `text`, so taking it goes down the notes path that emits `item_picked_up` with its `id` (rule 13, N-m12).

**Foyer** (`room_uni_foyer`; slots: wall `plaque`, `alarm_panel` (sprite `alarm_panel2`), `chart`; two conditional `notes` on the display table; `briefcase` and `laptop` on the stand)
- `alarm_panel` "The Byte Wall (1979 front panel)", slot (`alarm_panel2`, a PixelLab 1970s front panel whose eight lamps show the same byte). Eight multi-state lamps, top to bottom labelled `128` to `1`, showing 0 1 0 0 1 1 0 1; each lamp has one default state and `"variables": []` (probe R8 passed this way). `panelTitle` "MISKATONIC COMPUTING SERVICE, 1979"; footer "Each lamp is one bit. Eight bits make a byte. Read top to bottom, write it left to right: 01001101." The minigame frame title stays "Facility Alarm Panel" (`alarm-panel-minigame.js:28`), which can't be changed without an engine edit; the inner header and footer carry the framing.
- `plaque1` "Display plaque", `as-type:plaque`, examine view: add the place values of the lit lamps, 64 + 8 + 4 + 1 = 77, then find 77 in the ASCII chart: "M", for Miskatonic.
- `notes4` "ASCII chart handout", takeable, `as-type:notes` (first notes slot on the display table): printable ASCII 32-126 in three columns (decimal, hex, character), and "A character encoding is an agreed table from numbers to characters. ASCII is the oldest one still everywhere."
- `notes2` "Punched paper tape (1979)", takeable, `as-type:notes` (second slot on the display table): two rows of holes as ● and ○, with a caption showing one row is one byte and the tape spells "HI".
- `chart` "Poster: Powers of two", slot (`chart2`), examine view: 1, 2, 4 ... 128, and "8 bits = 1 byte = 256 possible values (0-255)".
- `briefcase` (c) "CryptoSecure lockbox" on the stand, slot, **L1**, `locked: true`, password. Contents: `phone` "Keyholder device" (`id: keyholder_device`, `phoneId: keyholder_device`, `npcIds: ["ghost"]`); `notes` "Trial II card" (text: the eight digits on a line of their own; observations: "Locker 4, common room. The keypad takes four digits.").
- `laptop` "CryptoSecure sign-up laptop", slot, examine view only: "Applications are not accepted. Candidates are found." and, on a second panel, a sales page: "CryptoSecure Mailer: know the moment your email is opened, and where!" This plants the tracking-pixel idea an hour before the climax (R2B-M3). Jordan, asked about it, can't explain it; Tom, asked about CryptoSecure, does (section 8).
- Map decor: crest sign ("COMPUTING"), Freshers' Week poster, fire point, CryptoSecure pull-up banner, a glass display case of old tapes and cards beside the display table; a brass "M" inlay in the terrazzo under the spawn point.
- NPCs:
  - `jordan_pike` at the stand. itemsHeld: `notes` "Keyholder leaflet" (`id: keyholder_leaflet`; text: **the decimal codes only**; observations: "Trial I. The lockbox on this stand opens for those who can read it. Verify everything we send you. Key fingerprint: <16 hex>". Selecting the whole note text decodes cleanly (verified, R2B-M5). When an NPC gives a note, the notepad shows the text, then the observation underneath (`npc-game-bridge.js:22-24`), so the codes stay on their own line.)
  - Hidden `briefing_cutscene` at 500,500. itemsHeld: `notes` "Comms discipline" (`id: comms_discipline`, `important: true`, so the notepad stars it), given on the briefing's **first** line (N2). HaX holds a second copy (`id: comms_discipline_hax`) for anyone who closed the briefing first (section 8).
  - Hidden `closing_debrief_person` at 500,500.
  - Phone NPCs `agent_0x99` and `ghost`, listed here so their mappings register at game start.
- Player inventory at start (`startItemsInInventory`): `phone` "Your phone" (`phoneId: player_phone`, `npcIds: ["agent_0x99"]`), as m02 (`m02 scenario.json.erb:528-535`).
- The written brief (`scenario_brief`, shown once and kept in the notepad) repeats the fallback-channel rule in one sentence (N2): "If your phone is ever compromised, submit what HaX most needs to know as a flag on a Hacktivity terminal (lower case, exactly as found); the one in this building is in Dr Schreuders' workshop."

**Teaching lab** (`room_uni_lab`; slots: the first two `pc` slots in table_items, `pc11` and `pc9` at the aisle ends of the benches, then six decor PCs)
- `pc` (c) "Your lab account", slot, `locked: false` (probe R15). Contents: `text_file` "private_key.pem", `text_file` "public_key.pem" (content = the PEM only), `text_file` "README.txt" (Tom's four lines: what a key pair is; "a .pem file is the key's bytes in Base64 between two header lines"; "your public key goes in the department directory, so anyone can use it to send you something; that's the point" (R2B-m9); keep the private one private).
- `pc` (c) "Keyholder guest terminal", slot or pin, **L3**, `locked: true`, password. Contents: `text_file` "trial_iv.hex" (content: the hex only; observations: "Trial IV. The corridor door is listening.").
- Map decor: whiteboard, projector screen ("Welcome to Computing"), clock, timetable, "No food or drink" sign, lecturer's desk, photocopier, wheeled chairs.

**Lecture theatre** (`room_uni_lecture`, 20x10; slots: wall `whiteboard`)
- `whiteboard2` "Dr Shaw's whiteboard" (`id: tom_board`), `as-type:whiteboard`. Text: "Hi" written three ways, decimal `72 105`, binary `01001000 01101001`, hex `48 69`, with the place values under the binary and "one hex digit = four bits" under the hex.
- Map decor: exit sign, projector screen, clock, poster, demonstration bench with a laptop, lectern, three tiered rows of seats in two blocks behind writing ledges (the ledges, in the tables layer, make each row solid; aisles west, centre and east).
- NPC: `tom_shaw` at (6.6, 3.9), west end of the bench. itemsHeld: `workstation` "Lab laptop (CyberChef)" (`id: lab_laptop`; probe R1 passed); `notes` FN1, FN2, FN3 (section 6).

**Common room** (`room_uni_common`; slots: `notice_board`, `vending_machine`, `coffee_station`, conditional `student_locker`, conditional `laptop` on the high table)
- `safe` (c) "Candidate locker 4", `as-type:student_locker` (a single locker with a keypad, numbered 4, at the end of lockers 1-3), **L2**, `locked: true`, PIN. Contents: `notes` "Trial III" (text: the binary groups only; observations: "Styled as a punched card. The guest terminal in the teaching lab takes a word."). Its arrival on the guest terminal is what Tom reacts to (section 2).
- `notice_board1` "Common room noticeboard", `as-type:notice_board`, examine view: flat-share ads, a society poster, and a CryptoSecure poster: "Trial II stuck? So was everyone. Read it as characters, not as a number."
- `coffee_station1`, `vending_machine1`: `as-type` onto their slots, examine views. Map decor: society posters, student lockers 1-3, kitchenette with a boiler, sofa and low table, high table, fire point.
- NPCs: `megan_oyelaran`; `cliffe_schreuders` with a laptop. He's hidden by his own mapping on `room_entered:common_room` with condition `globalVars.workshop_open === true`, `setVisible: false`. It reads a global and fires in his own room, so there's no late-room validator warning (N-m7). He moves to the workshop (`cliffe_workshop`, same `displayName`, so the shared-sprite check passes).

**Computing corridor** (`room_uni_corridor`, 10x6, two visible floor rows; slots: two conditional wall `notes` (on the noticeboard, then on the drop box), `pigeonholes`, conditional `drop_box`, `uni_directory`)
- `notes` "Trial V poster", takeable, on the noticeboard (`notes6` slot). Text: the Base64 only. Observations: the worked example "Hi!" = 01001000 01101001 00100001 → 010010 000110 100100 100001 → 18 6 36 33 → S G k h (verified: To Base64 of "Hi!" is "SGkh"), then "Three bytes become four symbols."
- `pigeonholes1` (c) "Pigeonholes", `as-type:pigeonholes`, **L7**, `locked: true`, password = the porter's word from the Vigenère plaintext (e.g. `sorting-33`). Observations: "Locked. A sign: 'Porter's code required. Ask whoever sent you post.'" Contents: four `text_file`s, "Pigeonhole 2" ... "Pigeonhole 5", each a Base64 envelope (content: Base64 only). One is sealed to the player's public key; the other three are sealed to other students' keys.
- `briefcase` (c) "CryptoSecure drop box", `as-type:drop_box` (a wall-mounted post box with a keypad), **L8b**, `locked: true`, password. Contents: `key` "Brass key" (`opens_lock: workshop_door`, `keyPins`); `notes` "Final Trial card" (`id: final_trial_card`; text: "This terminal stores no passwords, only fingerprints. Enter the first eight characters of the SHA-256 of the passphrase that opened this box. In CyberChef: SHA2, and set Size to 256 (it starts on 512). No spaces, no new line."; observations: "Easiest way: add SHA2 under AES Decrypt in the recipe you've already got. Leave Rounds alone. 256 bits is 64 hex digits, four bits each.").
- `notes3` "Tag on the drop box", takeable, `as-type:notes` (hangs on the box; shares a pick-one menu with it, by design). Text: the AES ciphertext hex only. Observations: "AES-128-CBC. The key and the IV travel separately. Key: ____ IV: ____". The blanks invite the player to use the notepad's pencil (every note has an editable observations box, `notes-minigame.js:142-187`, `:524-560`), so the IV and the AES key end up on one page with the ciphertext (R2B-M4).
- `directory_sign1` "Floor directory", `as-type:uni_directory` (a narrow sign on the east wall by the office door), examine view: "West: Library, Special Collections beyond. East: Dr S. Selvarajan, Seminar Room 2 beyond. North: Z. C. Schreuders, Workshop (knock). South: Foyer, Lecture Theatre 1 beyond."

**Library** (`room_uni_library`, 10x6, two visible floor rows; slots: conditional `book` and `notes` on the issue desk, conditional floor `safe` (unused since the safe moved))
- `notes4` "Returns slip", takeable, `as-type:notes` on the issue desk, "tucked in a returned copy of *The Codebreakers* on the returns shelf". Text: the Base64 only. Observations: "Trial VI. Shift: the number of this Trial."
- `book1` "The Codebreakers (returned)" (sprite `book`), on the issue desk, examine view: explains the slip. Shares a pick-one menu with the slip, by design.
- Map decor: recessed bookcases, "LIBRARY / QUIET" sign, the librarian's chair, a returns trolley.

**Special Collections** (`room_uni_special`; slots: conditional floor `safe`)
- `safe` (c) "Special Collections safe", slot (`safe1`, by the door), **L6**, `locked: true`, password. Contents:
  - `text_file` "trial_vii.txt" (content: the Vigenère ciphertext only; observations: "Trial VII. Key: the last entry in the ledger of the man who checks everything twice. Keep everything it tells you. An IV is a starting value for a cipher: not secret, but you'll need it.");
  - `notes5` "Candidate assessments" (Ghost's notes on six candidates, including Megan; `readable`, `takeable`, `text`; `onRead` sets `megan_file_read`, which applies when the note is read, not when it's taken);
  - `text_file` "job_0412.hex" (EBCDIC, optional; content: the hex only; observations: "A 1979 job tape, dumped to hex. It doesn't look like ASCII."; `onRead` sets `ebcdic_seen`).
- Map decor: sign, founder's portrait, bookcases, a plan chest, a glass-topped display cabinet of 1970s media, the reading table on a rug with two banker's lamps and a book.

**Dr Selvarajan's office** (`room_uni_office`, 10x6, two visible floor rows; slots: conditional `whiteboard` (unused since the ledger moved), conditional `notes` on the desk)
- `notes` "Sidhu's handout: hashes" (`id: fn07_desk_copy`), takeable, on the desk: the FN7 text, so a player who never talks to him can still find it.
- `uni_doorcard1` "Door card" (`id: sidhu_door_card`), `as-type:uni_doorcard`, `readDisplay: gameDisplay`, `addToNotes: false`: "DR S. SELVARAJAN / Reader in Cyber Security / Office hours: Tuesday 2-4. / Seminar room through the back."
- Map decor: bookcase, year planner, desk with a PC.

**Seminar room** (`room_uni_seminar`; slots: wall `whiteboard`)
- `whiteboard1` "Sidhu's ledger whiteboard", `as-type:whiteboard`, examine view: a four-block toy hash chain (block number, data word, previous hash, hash). Block 4's data word is the Vigenère key. Underneath: "Change one letter in block 2 and every hash after it changes."
- Map decor: two windows with blinds, the seminar table with chairs round it, a flip chart, a water cooler, two bean bags.
- NPC: `sidhu_selvarajan` at (6.75, 3.7), beside his whiteboard. itemsHeld: `notes` FN7 and FN10.

**Workshop** (`room_uni_workshop`; slots: `conference_screen`, `smartscreen`, conditional `pc` on the island workbench)
- `pc` (c) "Relay terminal", slot, **L10**, `locked: true`, password. Must be reachable from more than one side; the probe room had one that wasn't, so check reach in the first render. Contents, each content = the artefact only:
  - `text_file` "report.b64" (observations: "The Keyholder's field report, for your handler. Signed."; `onRead` also sets `relay_opened`, a second route if the task's client-side `onComplete` is lost, R26);
  - `text_file` "report.sha256" (observations: "SHA-256 of report.b64 exactly as it is: the Base64 text, not what it decodes to.");
  - `text_file` "report.sig" (Base64 signature; observations: "Signs report.b64 exactly as it is. In RSA Verify: Message = the contents of report.b64; Message format Raw; Message Digest Algorithm SHA-256. Dr Selvarajan would want to see this.");
  - `text_file` "keyholder_public.pem".
- `pc` (c) "Hacktivity scoreboard", `as-type:conference_screen`, the fallback channel, `locked: true`, password = the tracking token. Framed with the password lock's own options: `postitNote` "HACKTIVITY // SUBMIT FLAG. Flags are lower case, exactly as found." and `showPostit: true`. Observations: "A Hacktivity leaderboard. Top team this week: "null_pointers". A box at the bottom: Submit flag." Contents: `text_file` "submission_accepted.txt" (HaX's reply, section 8; its `onRead` also sets `warned_out_of_band`, a second route to the same global in case the task's client-side `onComplete` is lost, N-m11).
- `info_screen1` "Cliffe's build" (`id: cliffe_build_screen`), `as-type:smartscreen`, drawn with the `info_screen1` sprite, with `observationVariants` that follow progress (section 9).
- Map decor: the island workbench inside a hazard line on the concrete floor (the relay terminal sits on it, reachable from three sides), a laser cutter and tool pegboard on the back wall, parts drawers, a CNC mill and a 3D printer along the west wall, an electronics bench (oscilloscope, soldering station) east of the island, a safety-glasses sign.
- NPC: `cliffe_workshop`.

**Staff office** (`room_uni_staff`, 20x10, optional, off the common room's east door; no slots)
- No scenario objects. Map decor: three face-to-face desk pods with PCs and static chairs, a staff kitchenette with pigeonholes and a boiler, a coffee table, a photocopier, a bookcase and a filing cabinet, three windows, a noticeboard, a year planner, a clock, a "COMPUTING / STAFF ONLY" sign, bags and plants.
- NPCs: none yet (`"npcs": []`). Dr Oleg Illiashenko's desk is pod P1's south desk; stand him at tile (7.31, 7.06). Spare standing spots for later staff are listed in `ROOMS_PLAN.md` section 13.

### Object ids (R3-10)

Tasks and mappings target these ids: `cryptosecure_lockbox` (L1), `candidate_locker_4` (L2), `keyholder_guest_terminal` (L3), `special_collections_safe` (L6), `pigeonholes` (L7), `cryptosecure_drop_box` (L8b), `relay_terminal` (L10), `hacktivity_scoreboard`, `lab_account_pc` (unlocked), `byte_wall`, `keyholder_device`, `keyholder_leaflet`, `final_trial_card`, `comms_discipline`, `comms_discipline_hax`. Room locks: `corridor` (password, L4), `library` (PIN, L5), `workshop` (`lockType: key`, `requires: workshop_door`, `keyPins` identical to the brass key's, README "Lock Types").

Lock-type variety: password (L1, L3, L4, L6, L7, L8b, L10, plus the scoreboard), PIN (L2, L5), key (L9). There's no lockpick in the scenario, so in normal play the key lock opens only with the brass key.

## 4. Puzzle chain

### Progression of ideas

Each step adds one idea to the last. Nothing is decoded until steps 0a-0d have been shown with worked examples.

| Step | New idea | Taught by |
|---|---|---|
| 0a | A bit is on/off, 1/0. Eight bits make a byte. Place values 128 ... 1 turn a byte into a number (0-255). | Byte Wall, powers-of-two poster, plaque (foyer); FN1 from Tom |
| 0b | A character encoding is a table from numbers to characters; ASCII is the common one. 77 = "M". | ASCII chart handout, plaque; FN2 from Tom |
| 0c | The same number can be written in base 10, base 2 or base 16. One hex digit is exactly four bits, so a byte is always two hex digits. | Tom's chalkboard ("Hi" three ways); FN1, FN3 from Tom |
| 0d | CyberChef: input, recipe, output. Magic does simple encodings for you, and nothing with a key. The pop-out tab. | Tom, with the chalkboard example in the laptop |
| L1 | Text can be stored as its ASCII numbers (decimal). | Leaflet |
| L2 | Digits are characters too ("4" is 52). Decimal codes aren't a fixed width, so run-together decimal has to be split by thinking about it. | Trial II card, Megan's mistake |
| L3 | Binary is the same bytes in base 2, eight bits per character. | Trial III card |
| L4 | Hex is the same bytes in base 16, two digits per byte, so it can run together safely. | Trial IV file |
| L5 | Base64 regroups bytes into 6-bit pieces, each written as one of 64 symbols; = is padding. Encoding isn't encryption: anyone can reverse it. | Trial V poster with a worked example |
| L6 | Layers: undo the outer one first. Caesar is the first cipher with a key (the shift); with 25 keys you can try them all. | Trial VI slip |
| L7 | Vigenère: the key is a word, so the shift changes letter by letter and brute force by hand stops working. Keys travel separately from messages. | Trial VII + Sidhu's whiteboard |
| L8a | Public-key encryption: anyone can lock with your public key; only your private key unlocks. That answers the key-distribution problem. | Envelope + your lab key pair |
| L8b | Symmetric encryption (AES): one shared key, plus an IV that isn't secret but has to arrive. Hybrid encryption = RSA carries the AES key, which is how ransomware works too. | Drop box tag + Trial VII's IV |
| L9 | (Breather) A real key in a real lock. | Brass key |
| L10 | A hash is a fingerprint: same input, same output; one byte different (even a new line) and it changes completely. You can't run it backwards. | Final Trial card, Sidhu or his desk handout, or FN7 from HaX |
| Climax | Signatures: signing a hash with a private key; anyone with the public key can check nothing changed and who signed it. A signature hides nothing. Base64 again, as a wrapper for a whole document. | The report files; FN10 from Sidhu |
| Optional | Other text encodings exist: EBCDIC (IBM mainframes) maps the same letters to different numbers. | 1979 job tape |

### Lock-by-lock table

Every answer is generated per game (section 5) and is **lower case or digits**, so "type it exactly as it decodes" is the only rule the player needs (the server compares exactly: `game.rb:893` for doors, `:966` for objects). Every typed answer is at most 14 characters (`peregrine-NNNN`; `letterbox-NN`, `keyholder-NN` and the like are 12), well inside the password field's 50-character limit (`password-minigame.js:115`; the field also trims spaces, `:426`). The PIN pad is always four digits, because the client never sees `requires` and so gets the default length (`minigame-starters.js:534`; `requires` stripped at `game.rb:1872`).

Recipes name only the fields the player types or changes. Every other argument is already right at CyberChef's default: AES Decrypt defaults to Key Hex, IV Hex, CBC, Input Hex, Output Raw; RSA Decrypt to RSA-OAEP and SHA-1. Two defaults are wrong for us and the notes say so: **SHA2 starts on Size 512**, and **RSA Verify's digest starts on SHA-1**.

| # | Lock (type) | Scheme | Ciphertext lives | Key / IV lives | CyberChef recipe (v10.19.4 names) | Answer form | Field note | Magic alone? |
|---|---|---|---|---|---|---|---|---|
| L1 | CryptoSecure lockbox, foyer (`briefcase`, password) | ASCII decimal, spaced | Leaflet from Jordan | none | **From Decimal** | word, e.g. `orchard` | FN2 | Yes (From Decimal has Magic checks for spaced 0-255). Fine: first lock. The plaque has already shown it by hand. |
| L2 | Candidate locker 4, common room (`safe`, PIN) | Digits as ASCII decimal, run together | Trial II card (in L1) | none | Split into pairs by typing spaces (`49 56 54 48`), then **From Decimal**. Unsplit, CyberChef errors ("Data is not a valid byteArray"). | 4-digit PIN | FN2 ("codes aren't fixed width" box) | No. Magic (or From Hex) reads it as hex and gives four capital letters, e.g. "IVTH" (bytes 0x48-0x57 are H-W), not a PIN. Megan and the L2 rung say so: "If you got four capital letters, it's read your digits as hex." A wrong PIN three times shows "System locked", which resets when the keypad is reopened (`pin-minigame.js:521-533`); Megan and the L2 nudge both say so ("walk away and try again"). |
| L3 | Keyholder guest terminal, lab (`pc`, password) | Binary, 8-bit groups | Trial III card (in L2) | none | **From Binary** | word | FN1 | Yes. Fine: early. Kept (orchestrator decision) because the user stressed the basics. |
| L4 | Corridor door (room, password) | Hex, run together | `trial_iv.hex` (in L3) | none | **From Hex** | last word of "corridor door passphrase: landing" | FN3 | Yes. Fine: early. |
| L5 | Library door (room, PIN) | Base64 | Trial V poster, corridor | none | **From Base64** | PIN inside "Library keypad: 6191. ..." | FN4 | Yes. FN4 says plainly that Magic does this, and why that makes encoding useless for secrets. |
| L6 | Special Collections safe, Special Collections (north of the library) (`safe`, password) | Base64 around Caesar shift 6 | Returns slip, library | Shift 6 (the Trial number, on the slip) | **From Base64**, then **ROT13** with Amount **-6** (undo a shift of 6; 20 also works). Leave "Rotate numbers" off. | last word of "Special Collections safe password: codex" | FN5 | No. Magic peels the Base64 and stops at shifted text (ROT13 has no Magic checks). **ROT13 Brute Force** also solves it; that's the 25-keys lesson. |
| L7 | **Pigeonholes, corridor (`pigeonholes1`, password)** | Vigenère | `trial_vii.txt` (in L6) | Key word = block 4 on Sidhu's whiteboard (seminar room); pointer in the file's observations | **Vigenère Decode** (Key: the word) | Plaintext gives three things: the porter's code for the pigeonholes (e.g. `sorting-33`, the answer here), which pigeonhole is yours, and the AES IV (32 hex) | FN6 | No: no Magic checks and no solver in CyberChef; it needs the key from Sidhu's office. |
| L8a | (no lock) | RSA-OAEP | Envelope in your pigeonhole (in L7), Base64 | Your private key, `private_key.pem` on "Your lab account" (lab) | **From Base64**, then **RSA Decrypt** (paste the private key PEM; leave the rest) | 32 hex characters: the AES key | FN9 | No: needs your private key. The three other envelopes fail ("Invalid RSAES-OAEP padding" / "Encrypted message is invalid"), which is the lesson about matching keys. |
| L8b | CryptoSecure drop box, corridor (`briefcase`, password) | AES-128-CBC | Tag on the drop box (ciphertext only) | Key from L8a; **IV from Trial VII** | **AES Decrypt** (Key: the 32 hex from the envelope; IV: the 32 hex from Trial VII; leave the rest) | passphrase, e.g. `skeleton-92` | FN8 | No: needs a key and an IV that Magic can't know. With no IV CyberChef says "Invalid IV length"; with a guessed IV it errors or gives junk. |
| L9 | Workshop door (room, key) | physical key | | Brass key (in L8b) | | key | none | n/a. A change of pace. |
| L10 | Relay terminal, workshop (`pc`, password) | SHA-256 fingerprint | Final Trial card (in L8b) | n/a | **SHA2**, Size **256**, on the passphrase; first 8 characters. Easiest: add SHA2 **under AES Decrypt** in the recipe already open, which hashes exactly the bytes that opened the box (verified). | 8 hex, e.g. `16a51a65` | FN7 | No, and it can't be guessed. With a trailing new line, or at the default Size 512, the first eight characters differ (verified), which teaches the integrity point Sidhu makes. |
| Climax | Hacktivity scoreboard (`pc`, password, optional) | Base64 document with a tracking pixel; SHA-256; RSA-SHA256 signature | `report.b64`, `report.sha256`, `report.sig`, `keyholder_public.pem` (in L10) | Ghost's public key; its fingerprint is on Jordan's leaflet | Read: **From Base64** on `report.b64`. Integrity, optional: **SHA2** (Size 256) on `report.b64`, compare with `report.sha256`. Signature, optional: **From Base64** on `report.sig`, then **RSA Verify** (public key PEM; Message = the contents of `report.b64`, *not* the decoded text; Message format **Raw**, the default; Message Digest Algorithm **SHA-256**) gives "Verified OK". The decoded text as Message, Message format Base64, digest SHA-1, or a trailing new line all give "Verification Failure" (verified), so `report.sig`'s observations and FN10 name each of them (R2B-M2). | the tracking token in the pixel URL, e.g. `merlin-2685` | FN10 | From Base64 alone, yes, deliberately: the climax tests attention, not skill. |
| Opt | (no lock) | EBCDIC in hex | `job_0412.hex` (in L6) | none | **From Hex**, then **Decode text** (Encoding: IBM EBCDIC US-Canada (37)) | lore | FN11 | Possibly, in intensive mode (Magic brute-forces text encodings, `core/lib/Magic.mjs:169-198`). Fine: optional. |

### Why the library branch can't be skipped in play (A-M1 / B-M1)

v1 let a player go corridor, pigeonholes, RSA, AES, drop box and never visit the library or Sidhu. v2 gates the Act 3 chain on Trial VII **twice**:

1. **The pigeonholes are password-locked**, and the password exists only in the Vigenère plaintext. A locked container's contents are stripped from the client (`game.rb:1876-1879`), so the envelopes can't be read, copied or inspected in the browser until the lock is opened. (Through the game's own UI there's no other way in. Before the D2 engine fix, the server also accepted an unlock where the client *claimed* a different method; the user approved the fix, which checks the method against the lock's type and is in the working tree. Until it's committed, a console user could open these locks without the answers, though never *see* them.) The password is a word plus two digits (`sorting-33`, 6 words × 90 numbers), not guessable from anything in the world.
2. **The AES IV is only in the Vigenère plaintext.** It's not on the tag any more. Without it, AES Decrypt errors (empty IV: "Invalid IV length"; a guessed all-zero IV: "Unable to decrypt input with these parameters." in 79 of 100 games, junk in the rest). The drop box answer (`skeleton-92`, a word plus two digits) can't be guessed either.

And Trial VII itself can't be reached early: it's inside the Special Collections safe (L6, in Special Collections, through the library), whose answer is only in the library slip, behind the library door (L5). Its key is on Sidhu's whiteboard, readable without talking to him; the file's observations say where to look (A-m3).

Checked chain, every path: corridor (L4) → library (L5, poster) → safe (L6, slip) → Trial VII + whiteboard key → pigeonholes (L7) and IV → envelope + lab private key (L8a) → drop box (L8b) → brass key (L9) → relay (L10). Every lock's answer is behind the previous lock or in another room. No answer and no locked content can be read on the client before it's earned, because answers and locked contents never reach the client (`requires` stripped at `game.rb:1872`, contents at `:1879`, and the contents endpoint refuses a locked container, `games_controller.rb:491-496`). The verifier extracts the porter's code and the IV from the CyberChef Vigenère output and feeds that IV into AES Decrypt: 120/120 seeds pass (section 5).

HaX's offers follow the same order: FN9 (public key) is offered when the pigeonholes open and FN8 (AES) right after (section 6), so the hint system no longer teaches a shortcut.

**Clue and lock in the same room.** L5 (poster and library door, corridor) and L8b (tag and drop box, corridor) are deliberate: the poster is the last encoding-only lock, and the tag is useless without the envelope key and the IV. Four same-room locks out of eleven is fine for a teaching lab where the work is the decoding (reviewer B, 1.1).

### Operation names checked against the bundled CyberChef

Every operation named above exists in the bundled v10.19.4. I grepped `public/break_escape/assets/cyberchef/assets/main.js` (the operation config) and `modules/*.js` for each exact quoted name: **From Decimal**, **From Binary**, **From Hex**, **From Base64**, **To Base64**, **ROT13**, **ROT13 Brute Force**, **Vigenère Decode**, **AES Decrypt**, **RSA Decrypt**, **RSA Verify**, **SHA2**, **Decode text**, **Magic**. Argument names and defaults come from the same config entries: AES Decrypt Key/IV toggles default Hex, Mode CBC, Input Hex, Output Raw; RSA Decrypt Encryption Scheme RSA-OAEP, digest SHA-1; RSA Verify digest options `SHA-1, MD5, SHA-256, SHA-384, SHA-512` (default SHA-1); SHA2 Size options starting `512`; ROT13 `Amount` (default 13); Decode text lists `IBM EBCDIC US-Canada (37)`. The "Magic alone?" column comes from which operations carry Magic `checks` in that config (the From Decimal/Binary/Hex/Base64 ones do; ROT13, Vigenère Decode, AES Decrypt, RSA Decrypt and Decode text don't) and the intensive brute force in `Magic.mjs`. Magic itself was not executed (R12).

## 5. ERB generation plan and proof

### How it works

`scenario.json.erb` is rendered once per game, when the game is created (`game.rb:20`, `before_create :generate_scenario_data`, calling `Mission#generate_scenario_data`, `mission.rb:104-112`). One `<% %>` block at the top picks every secret and builds every artefact; the JSON below it only interpolates the results. Lock answers (`requires`, `game.rb:1872`) and the contents of locked containers (`game.rb:1879`) are stripped before anything reaches the browser.

### Per-game secrets

| Secret | Pool | Used by |
|---|---|---|
| `w1` | 26 words: lantern, harbour, compass, granite, meadow, falcon, orchard, thistle, bramble, cobble ... yarrow (full list in `tools/generate.rb`) | L1 |
| `p2` | 4-digit PIN, 1000-9999 | L2 (each digit's ASCII code, run together) |
| `w3` | 26 words: signal, beacon, quartz, pewter, cobalt, saffron, juniper, marble, amber ... zircon | L3 |
| `w4` | 26 words: stairwell, archway, landing, bellrope, clocktower, gargoyle, balcony ... wainscot | L4 |
| `p5` | 4-digit PIN | L5 |
| `w6` | 26 words: parchment, vellum, folio, quarto, codex, scroll, almanac ... woodcut | L6 |
| `vkey` | ledger, merkle, nonce, tally, anchor, witness (genesis dropped in fix round 2: block 1 holds "genesis-0") | L7 key (block 4 on Sidhu's whiteboard) |
| `pigeon_pw` | postmark, franking, satchel, parcel, sorting, letterbox + "-" + 10-99 | L7 answer (pigeonholes); only in the Vigenère plaintext |
| `hole` | 2-5 | which envelope is real; only in the Vigenère plaintext |
| player RSA-2048 key pair | `OpenSSL::PKey::RSA.new(2048)` | L8a; PEMs on "Your lab account" |
| decoy envelopes | 3 more random RSA keys, each sealing a random 32-hex string | the other pigeonholes |
| AES key, IV | 16 random bytes each | key: sealed in the envelope (L8a); IV: **only in the Vigenère plaintext** |
| `pass8` | keyholder, lockstock, deadbolt, tumbler, skeleton, keystone, padlock, latchkey, wardkey, mortise + "-" + 10-99 | L8b answer, L10 input |
| `l10` | first 8 hex of SHA-256(`pass8`) | L10 answer |
| Ghost RSA-2048 key pair | as above | report signature; public PEM in L10; fingerprint (first 16 hex of SHA-256 of the PEM) on the leaflet |
| `token` | kestrel, osprey, merlin, hobby, peregrine, harrier + "-" + 1000-9999 (lower case) | the tracking pixel's URL in the report; the scoreboard answer |

Words are unambiguous lowercase dictionary words, so a correct decode is never mistyped as a wrong answer. The L1, L3, L4 and L6 pools have 26 words each (v3, R2B-m13), so a student reading a public copy of the template can't guess an early answer from a short list; the others stay small because their locks sit behind keys anyway. Render time with five RSA key generations: 0.6-0.8 s per game.

### Generation (summary of the block)

```ruby
w1 = kh_words_t1.sample;   l1_leaflet = w1.bytes.join(' ')                        # "111 114 99 ..."
p2 = kh_pin4.call;         l2_card    = p2.bytes.join('')                         # "49565448"
w3 = kh_words_t3.sample;   l3_binary  = w3.bytes.map { |b| format('%08b', b) }.join(' ')
l4_hex    = "corridor door passphrase: #{w4}".unpack1('H*')
l5_base64 = Base64.strict_encode64("Library keypad: #{p5}. The returns shelf has your next trial.")
l6_slip   = Base64.strict_encode64(kh_caesar.call("Special Collections safe password: #{w6}", 6))
aes_key, aes_iv = SecureRandom.random_bytes(16), SecureRandom.random_bytes(16)
cipher = OpenSSL::Cipher.new('aes-128-cbc').encrypt; cipher.key = aes_key; cipher.iv = aes_iv
tag_hex   = (cipher.update(pass8) + cipher.final).unpack1('H*')                   # the tag: ciphertext only
env_raw   = player.public_encrypt(aes_key.unpack1('H*'), OpenSSL::PKey::RSA::PKCS1_OAEP_PADDING)
            # re-rolled until env_raw is NOT valid UTF-8, so CyberChef always takes its Latin-1 path
l7_plain  = "The pigeonholes open with #{pigeon_pw}. Yours is number #{hole_word}. " \
            "Your envelope is sealed to your public key. The IV travels with this letter: #{aes_iv_hex}"
l7_vig    = kh_vigenere.call(l7_plain, vkey)
l10       = OpenSSL::Digest::SHA256.hexdigest(pass8)[0, 8]
report    = "KEYHOLDER FIELD REPORT\n...\n<img src=\"https://cdn.cryptosecure-recovery.example/px/locate/#{token}.png\" width=\"1\" height=\"1\">"
report_b64 = Base64.strict_encode64(report)                                        # report.b64
report_sha = OpenSSL::Digest::SHA256.hexdigest(report_b64)                         # report.sha256
report_sig = Base64.strict_encode64(ghost.sign(OpenSSL::Digest::SHA256.new, report_b64))  # report.sig
```

`kh_caesar` and `kh_vigenere` follow CyberChef's own rules: letters only, case kept, digits and punctuation untouched, and the Vigenère key advances only on letters. So the IV's digits show through the Vigenère ciphertext while its letters a-f are enciphered. That leaks part of the IV, but not enough to matter: the AES key is still sealed in a locked pigeonhole.

The decoded report reads as a plausible field report ("STATUS: Recruited. Candidate passed all trials.") and ends with a one-pixel remote image, the real technique (a tracking pixel or canary token): whoever opens the report in anything that fetches images tells the server their IP address and network. "On open" is then true, and Cyber Security students will recognise it (A-m21).

### Build rules (from prototyping, the probes and the reviews)

1. **ERB.** No `def` in the template: methods defined there land on the shared `ScenarioBinding` class. Use lambdas with a `kh_` prefix and plain locals. `require 'openssl'`, `'base64'`, `'securerandom'` at the top of the block. Every interpolated string goes through `.to_json` (PEMs and the report contain new lines). Store PEMs with `.strip`, so the leaflet's fingerprint matches what the player copies.
2. **No per-game value in any spoken line.** The TTS batch renders the ERB separately (`tts_batch_processor.rb:155-166`), so ink, barks and timed messages never contain a generated secret. Ghost's per-Trial lines are static.
3. **Copyable content is ciphertext only (B-M2).** A `text_file`'s content is the artefact and nothing else, because Copy takes the whole content (`text-file-minigame.js:211`). Titles go in the file name; instructions and pointers go in `observations`, which the viewer shows in its own box. For `notes`, the note's `text` is the ciphertext only and everything else (titles, pointers, per-game fingerprints) goes in `observations` (v3, R2B-M5: the leaflet's fingerprint line used to sit in its text and broke a whole-note copy). Verified why: one header line in front of the Vigenère text garbles the whole decode, and RSA Verify given the report and its hash as one message says "Verification Failure". That's why the report is three files.
4. **Every container states `locked`.** Unlocked containers need `"locked": false` explicitly. Without it the engine treats the container as key-locked and the interaction does nothing (probe R9: `unlock-system.js:637-638`, `:93`). This covers "Your lab account" and any bin with contents. **And the converse (R3-9, from the D2 fix):** an unlocked container has `locked: false` and **no** `lockType` or `requires`, because the fixed server treats an object as locked if it names any `lockType`.
5. **The Keyholder phone NPC has no `currentKnot`, and its `item_picked_up:phone` mapping has no `targetKnot`** (keep `conversationMode: "phone-chat"`). Otherwise the intro shows twice (probe R2, game 1570; engine item E1 in `DECISIONS_PENDING.md`). With no `currentKnot` the story starts at `start` **until the video call**: a mapping's `targetKnot` sets `npc.currentKnot` (`npc-manager.js:812-816`), so after the call `ghost.currentKnot` is `the_offer`, and a device first opened after the call enters there (R3-1). `the_offer` therefore routes away at its first line if the offer has already been made, and the device's pickup auto-open mapping is conditioned on `!globalVars.relay_opened`. **A reopened phone doesn't run `start`:** it restores the saved story at the knot holding its choices and re-runs that knot (`phone-chat-minigame.js:435-447`, `phone-chat-conversation.js:587-610`). So routing on state goes at the top of *every* knot the Keyholder story can rest on, not only in `start` (N1; section 8, "The Keyholder ink").
6. **No terminal line starts with `>`.** The terminal theme adds its own prompt, so `> DEVICE ACTIVE` renders as `> > DEVICE ACTIVE` (E2). Write `DEVICE ACTIVE`.
7. **Typed answers are 50 characters or fewer** (`password-minigame.js:115`), and lower case or digits (ours are 4-14 characters, the longest being `peregrine-NNNN`; the verifier asserts both and reports the longest per game). A SHA-256 or a PEM is never a typed answer; the hash lock asks for 8 characters.
8. **Locked objects are top-level room objects.** The server only looks for them in `rooms[*].objects` (`game.rb:920-932`). Nothing locked is nested in a container.
9. **After the video call, the relay terminal has to be reopened.** The call pre-empts the container's auto-open (probe R3). Ghost's last line says so ("Your terminal's still open. Read what I gave you.").
10. **Closing a `text_file` opened from a container returns to the room, not to the container** (probe note; `text-file-minigame.js:142-144`). Multi-file containers mean a re-interact per file. Accepted: the report's four files are read once each.
11. **Pinned and slot objects need a reach check in the first render** (the probe room had a PC reachable from one side only).
12. **CyberChef keeps its state when the laptop closes.** Engine change D1 is implemented in the working tree (uncommitted; node test `test/js/crypto-workstation-persist.test.mjs`; browser games 1571/1572) and must be committed before this scenario. The pop-out tab now carries the live recipe and input over too. State is still lost on a page reload, which is acceptable. Tom teaches the pop-out tab either way: a recipe beside the game is easier to work with than one behind it. His line: "Pop it out into its own tab with the little arrow by the cross, top of the laptop. Then you can have the clue and the recipe side by side."
13. **Every `notes` item in a container has `readable: true`, `takeable: true` and `text`** (N-m12), so taking it emits `item_picked_up` with its `id` (`container-minigame.js:508`, `interactions.js:1474-1483`). The FN7 fallback depends on this for `final_trial_card`.
14. **Every locked object and room has an explicit `lockType`** (R2B-M1, mission-local part). The server strips `requires` only from objects with a `lockType` (`game.rb:1870-1873`), so a lock written with `requires` and no `lockType` would leak its answer. The build asserts it for all eleven locks.
15. **One mapping per item id** where several notes set the same global (`fn07_had` from `fn07_hashing`, `fn07_desk_copy` and `fn07_hax`, and `fn10_had` likewise; `comms_had` from `comms_discipline` and `comms_discipline_hax`). Mapping conditions have no `||` (`npc-manager.js:94-101`) (N-m3).
16. **Texts on neighbouring events are spaced by hand** (N-m2). The validator only spaces texts on the same event, so the bursts in section 8 ("Text schedule") give explicit delays at least 5 s apart, or fold a nudge and an offer into one text.
17. **Run `reopencheck.mjs` on both phone stories.** Add the Keyholder device and HaX's phone to `scripts/ink_runtime_check/missions.json` (the builder edits only its own `lab_tesseract_trials` block) and test the states listed in section 8 (K1-K10, H1-H6).
18. **Anything keyed on `global_variable_changed:relay_opened` is `onceOnly` or guarded** (R3-5). Reading `report.b64` sets `relay_opened` again on every read (its `onRead` cover), so the music switch is `onceOnly` with `!globalVars.decision_made`, and the call mapping keeps `!globalVars.ghost_offer_made`.
19. **Re-running the CyberChef verifier** (R3-11): `npm install cyberchef@10.19.4 terser` in a scratch folder, copy `tools/verify_cyberchef.mjs` beside its `node_modules`, and run `node --experimental-specifier-resolution=node --no-warnings verify_cyberchef.mjs <out.json>`. The run note is at the top of the file.

### Proof that every recipe gives back the answer

Two independent checks on the same generated output, both updated for v2 and saved in `tools/`:

1. **CyberChef's own code** (`tools/verify_cyberchef.mjs`): npm `cyberchef@10.19.4`, the bundled version. Each recipe runs through the real operation classes, with CyberChef's `Dish` type conversion between steps, as `Recipe.execute` does. v2 chains the steps the player chains: it takes the porter's code and the IV *out of the Vigenère output* and feeds that IV into AES Decrypt.
2. **Tools that share no code with CyberChef or the generator** (`tools/verify_independent.py`): plain Python for the encodings and classical ciphers; the `openssl` 3.0.13 CLI for RSA-OAEP decryption, AES-128-CBC (IV parsed from the decoded Vigenère text), SHA-256 and signature verification; Python's `cp037` codec for EBCDIC.

Seed 42, CyberChef run (abridged; full output `tools/cyberchef_check_seed42.txt`). The seed fixes the word and number choices. RSA keys, the AES key and the IV come from OpenSSL's random generator, so they differ on every run, as they will per game.

```
PASS L1 From Decimal: got "orchard"
PASS L1 from the leaflet's whole note text (codes only): got "orchard"
INFO L2 run-together without splitting gives: "ERROR: Data is not a valid byteArray: [49565448]" (wrong, as intended)
PASS L2 split pairs + From Decimal: got "1860"
PASS L3 From Binary: got "lantana"
PASS L4 From Hex: got "corridor door passphrase: cupola"
PASS L5 From Base64: got "Library keypad: 6191. The returns shelf has your next trial."
PASS L6 From Base64 + ROT13(amount -6): got "Special Collections safe password: primer"
PASS L7 Vigenère Decode: got "The pigeonholes open with sorting-33. Yours is number four. ..."
PASS L7 gives pigeonhole password: got "sorting-33"
PASS L7 gives the IV: got "d13d0da3fc2ec7fcb01418ed86c23d83"
INFO L7 with a header line copied in front (why fileContent is ciphertext only): "Gdvyh IUV. Rdr wrw ef aa rdr xrbcrd.\nTtn eygqxcxoxnh epqw ly"
PASS L8a From Base64 + RSA Decrypt: got "51d776b37e2d3583b792c48925d1433b"
PASS L8a PEM pasted after CyberChef's pre-filled header: got "51d776b37e2d3583b792c48925d1433b"
INFO decoy envelope 1 with player's key: "ERROR: Error: Invalid RSAES-OAEP padding."
PASS L8b AES Decrypt (key from L8a, IV from L7): got "padlock-92"
INFO L8b without the IV (skipping L7): "ERROR: Invalid IV length; got 0 bytes and expected 16 bytes."
INFO L8b with a guessed IV of zeros: "ERROR: Unable to decrypt input with these parameters."
PASS L10 SHA2-256 first 8: got "8841f594"
PASS L10 as SHA2 added under AES Decrypt in the same recipe: got "8841f594"
INFO L10 with a trailing newline: 7f6f3097 (differs, as intended)
INFO L10 with SHA2's default size 512: ea9f4b34 (differs: set Size to 256)
PASS Report From Base64: got "KEYHOLDER FIELD REPORT\nFROM: Agent 0x00 ..." (contains "merlin-2685")
PASS Report pixel URL says locate: got "yes"
PASS Report SHA2-256: got "19e4976ec027a47a09795c8ca18f83714c2aad01fc88260f9788184f3957f19e"
PASS Report RSA Verify: got "Verified OK"
INFO RSA Verify with the DECODED report as Message: "Verification Failure"
INFO RSA Verify with Message format set to Base64: "Verification Failure"
INFO RSA Verify with the digest left on SHA-1: "Verification Failure"
INFO RSA Verify with a new line after the Message: "Verification Failure"
INFO SHA2 of the DECODED report matches report.sha256? false (it shouldn't: the hash is of the Base64 text)
INFO Report RSA Verify after one change: "Verification Failure"
PASS Leaflet fingerprint = SHA2 of Ghost PEM: got "5fb0a36ac2315696"
PASS EBCDIC From Hex + Decode text (37): got "MISKATONIC UNIVERSITY COMPUTING SERVICE 1979. JOB 0412 OWNER [REDACTED]. ..."
PASS Poster worked example: Hi! -> SGkh: got "SGkh"
PASS answer pigeon "sorting-33": 10 chars, lower case   (and the same for all ten typed answers)
INFO longest typed answer this game: 11 characters
ALL PASS
```

Seed 42, independent run: all 20 checks pass (`tools/independent_check_seed42.txt`). Among them: `openssl pkeyutl -decrypt ... rsa_padding_mode:oaep rsa_oaep_md:sha1` gives the same AES key; `openssl enc -d -aes-128-cbc -K <key> -iv <IV parsed from the Vigenère plaintext>` gives `padlock-92`; `openssl dgst -sha256 -verify` gives "Verified OK"; every typed answer is 50 characters or fewer and lower case.

**Sweep (v3): seeds 1-120, 120/120 pass both checkers**; the longest typed answer seen was 14 characters, the pool maximum. In the v2 sweep (seeds 1-100), a guessed all-zero IV made CyberChef error in 79 games and gave junk in 21; it never gave the answer.

Other findings from the checks:
- A private key pasted with its line breaks flattened, or pasted after CyberChef's pre-filled "-----BEGIN RSA PRIVATE KEY-----" line, still decrypts. Pasting is safe.
- A wrong AES key gives an error or an empty or junk output, never a plausible answer.

### Static artefacts

Nothing on the critical path is static.
- **PGP** would be impractical per game (no OpenPGP gem in `Gemfile.lock`; making armoured keys in Ruby would mean shelling out to `gpg`). Plain RSA with PEM keys teaches the same ideas (key pairs, encrypting to a public key, signing and verifying), and CyberChef's RSA Decrypt and RSA Verify handle it, as verified. If the user wants GPG itself, a static armoured pair and message could be made once with `gpg --batch` and checked with CyberChef's **PGP Decrypt** / **PGP Verify**. The answer would then be the same for every player.
- **ECB-mode image** (optional exhibit, art needed): the CryptoSecure logo with its raw pixels AES-ECB-encrypted (outline still visible) beside the same under CBC (noise), in the workshop as "LockStock v1, the version that got caught". Examine view only, no lock. Produced once by a script, not an image generator. In `ART_NEEDED.md` for approval; until then the `chart` sprite with a text description.

## 6. Field notes and the hint ladder

### Delivery

Field notes are `notes` items with an `id`, so they reach the notepad and can be reopened at any time (probe R16 for a person NPC; m05 precedent for a phone NPC). They follow `docs/FIELD_GUIDE_style_guide.md`: a two-line handler note, then a short extract with generic examples, never this game's values. Every extract has the same four headings (**What it is**, **How to spot it**, **In CyberChef**, **On the command line**) and runs to about 100 words (FN1 a little more, because it also teaches the tool). "In CyberChef" names only the fields the player types into or must change.

| Giver | Notes | How |
|---|---|---|
| **Tom**, in person, with the laptop | FN1, FN2, FN3 | `#give_item:notes:<id>` in his first knot, after `#complete_task:get_lab_laptop`; "the induction handouts". |
| **Sidhu**, in person | FN7, FN10 | In his conversation. A desk copy of FN7 (`fn07_desk_copy`) is takeable without talking to him. |
| **HaX**, by phone | FN4, FN5, FN6, FN8, FN9, FN11; fallback copies of FN7 (`fn07_hax`), FN10 (`fn10_hax`) and Comms discipline (`comms_discipline_hax`) | Offer on exposure, deliver on request. |

HaX's pattern (m01/m02, scaled down so the hub stays small):
1. **Offer on exposure.** A mapping on HaX fires when the player first meets the thing a note explains. It sets `fnXX_offered` and sends one short text. Where an exposure nudge and an offer fall on the same event, they're one text (rule 16).
2. **Deliver on request.** One sticky hub choice, `[Send me that field note]`, shown when any offered note hasn't been sent; it gives the most recent one with `#give_item:notes:<id>` and sets `fnXX_sent`. A second sticky choice, `[I'm stuck.]`, runs the hint ladder for the current step.
3. **Current step** comes from the progress globals each objective task sets on completion.
4. **Fallbacks (A-M7).** FN7 is offered when the Final Trial card is picked up (`item_picked_up:notes`, `data.itemId === 'final_trial_card' && !globalVars.fn07_had`); FN10 when the relay terminal opens (`!globalVars.fn10_had`). `fn07_had` is set by **three** mappings, one per id (`fn07_hashing`, `fn07_desk_copy`, `fn07_hax`), and `fn10_had` by two, because conditions have no `||` (rule 15, N-m3).
5. **The Comms fallback (N2).** If the player closed the briefing before its first line ran, or reloaded during it, a sticky hub choice `[Remind me how I reach you if this phone's no good.]` shows while `!comms_had` and gives `comms_discipline_hax`. `comms_had` is set by each Comms note's own `onPickup.setVariable` (applied on NPC hand-over, `npc-game-bridge.js:30-38`; R3 buildability note 9), which is simpler than a mapping per id. **Once `lockbox_open` is true** the device is out, so HaX's reply changes (R3-12): "Not on this line. It's in your brief.", and no note is sent; the written brief always carries the rule. HaX also texts once, on `objective_task_completed:get_lab_laptop` with `!globalVars.comms_had`: "You left before I'd finished. Ask me about the fallback channel when you've a minute."

### The notes

| id | Title | From / offered when | Extract outline |
|---|---|---|---|
| `fn01_bits_bytes_bases` | Bits, bytes, bases, and CyberChef | Tom, with the laptop | A bit is 0 or 1; eight bits make a byte, 256 values (0-255). Place values 128 64 32 16 8 4 2 1, worked: 01001101 = 64+8+4+1 = 77; the same value is 4D in hex. One hex digit is exactly four bits, so a byte is always two hex digits. **Driving CyberChef (R2B-M6):** 1. Paste into **Input** (top right). 2. Type the operation's name in **Search** (top left) and double-click it to add it to the **Recipe** (middle). 3. The answer appears in **Output** (bottom right); the bin icon on the Recipe clears it. The ↑ button next to the × pops CyberChef into its own tab, recipe and all. **Your notepad** has a pencil on every page: paste anything you'll need later there. CLI: `printf '%d\n' 0x4D`. |
| `fn02_ascii_encodings` | Characters are numbers | Tom, with the laptop | A character encoding is an agreed table from numbers to characters; ASCII covers English letters, digits and punctuation in 0-127. "A" = 65, "a" = 97, space = 32, and the digit "4" is 52, not 4. Decimal codes are 2 or 3 digits long, so run-together codes need splitting by thinking about the range (digits 48-57 are two digits; lowercase letters 97-122 three). If you get capital letters instead, something read your digits as hex. CyberChef: **From Decimal**. CLI: `python3 -c "print(bytes([104,105]).decode())"`. |
| `fn03_hex` | Hex and binary | Tom, with the laptop | Hex uses 0-9 and a-f for 0-15, two hex digits per byte, always, so hex can run together and still be read, unlike decimal. Binary: eight 0s and 1s per byte. Spot them by their alphabets. CyberChef: **From Hex**, **From Binary**. CLI: `echo 6869 \| xxd -r -p`. |
| `fn04_base64` | Base64 | HaX; corridor entered (one text with the L5 nudge) | Take the bytes three at a time (24 bits), cut them into four 6-bit pieces, write each as one of 64 symbols: A-Z, a-z, 0-9, + and /. "=" pads the end. Worked: "Hi!" → SGkh (as on the poster). Spot it: that alphabet, length a multiple of 4, often ends in = or ==. It's an **encoding**, not encryption: no key, and Magic undoes it for anyone. A .pem key file is Base64 too, between two header lines. CyberChef: **From Base64**. CLI: `echo SGkh \| base64 -d`. |
| `fn05_layers_caesar` | Layers, and your first key | HaX; library entered (one text with the L6 nudge) | Encodings stack; peel the outside layer first. Caesar shifts every letter the same number of places; the shift is the key. Only 25 keys, so trying them all is quick, which is why it isn't secure. CyberChef: **From Base64** then **ROT13** with Amount set to minus the shift (-6 undoes 6), or **ROT13 Brute Force**. CLI: `tr 'G-ZA-Fg-za-f' 'A-Za-z'` undoes 6. |
| `fn06_vigenere` | Vigenère | HaX; Special Collections safe opened (one text with the L7 nudge) | The key is a word; each key letter gives the shift for one message letter, then the key repeats, so counting letters stops working. Without the key you're stuck; the key travels separately. Copy only the ciphertext: a stray extra line throws the key out of step. What the plaintext tells you, keep: paste it into your notepad with the pencil. CyberChef: **Vigenère Decode** (Key). CLI: no standard tool; a five-line Python loop. |
| `fn07_hashing` | Hashes and fingerprints | Sidhu; desk copy; HaX (`fn07_hax`) when the Final Trial card is picked up, if not had | A hash turns any input into a fixed-length fingerprint. SHA-256 gives 256 bits, which is 64 hex digits, because each hex digit is four bits. Same input, same hash; change one byte, even an invisible new line, and it changes completely; you can't run it backwards. Used to check nothing changed, and to store passwords without storing them. CyberChef: **SHA2**, **set Size to 256 (it starts on 512)**, leave Rounds alone. Easiest: add SHA2 under the operation that produced your input, so no stray new line gets in. CLI: `printf '%s' 'text' \| sha256sum`. |
| `fn08_aes` | Symmetric encryption: AES | HaX; just after FN9, when the pigeonholes open | One shared secret key locks and unlocks. DES used 56-bit keys (2^56 possibilities, now too few); AES uses 128, 192 or 256. AES works on 16-byte blocks; CBC mixes each block with the one before, and the first with an **IV**, which needn't be secret but has to arrive with the message. Getting the key to the other person is the **key distribution problem**. CyberChef: **AES Decrypt**: paste the key and the IV (both hex); leave everything else. CLI: `xxd -r -p ct.hex \| openssl enc -d -aes-128-cbc -K <key> -iv <iv>`. |
| `fn09_public_key` | Public-key encryption | HaX; pigeonholes opened. Handler note: "Dr Shaw put your key pair on your lab account. You'll want the private one." (R2B-m8) | Two keys that belong together. The public key can go to anyone and only locks; the private key stays with you and unlocks. Your public key sits in a directory so anyone can send you a secret, using a key that was never secret: that answers key distribution. Real systems send a fresh AES key this way (hybrid encryption), and so does ransomware. Keep private keys secret, as with symmetric keys. CyberChef: **From Base64** then **RSA Decrypt**: paste your private key PEM; leave the rest. CLI: `base64 -d env.b64 \| openssl pkeyutl -decrypt -inkey private.pem -pkeyopt rsa_padding_mode:oaep`. |
| `fn10_signatures` | Signatures | Sidhu; HaX (`fn10_hax`) when the relay terminal opens, if not had | The sender **signs** a hash of the message with their private key; anyone with their public key can check it. One character changed and the check fails. A signature proves who sent it and that nothing changed; **it hides nothing, so read what you send.** A document can even carry a remote image that reports where it was opened. Check exactly what was signed: if they signed the Base64 file, decode it and you're checking a different message. CyberChef: **From Base64** on the signature, then **RSA Verify**: paste the public key; Message = the signed text exactly as given; **Message format: leave on Raw**; Message Digest Algorithm **SHA-256**. "Verified OK" means it checks out. CLI: `openssl dgst -sha256 -verify pub.pem -signature sig.bin msg`. |
| `fn11_text_encodings` | Not everything is ASCII (optional) | HaX; job tape read (`ebcdic_seen`) | IBM mainframes used EBCDIC, where "A" is 0xC1, not 0x41. Same letters, a different table. CyberChef: **From Hex** then **Decode text** (IBM EBCDIC US-Canada (37)). CLI: `xxd -r -p tape.hex \| iconv -f IBM037 -t UTF-8`. |

Lab-sheet errors not repeated: the Base64 alphabet is A-Z, a-z, 0-9, + and / (not "a-Z"); DES's keyspace is 2^56 (not 256); private keys are kept secret "as with symmetric keys".

Optional later step (needs the user, other repo): publish the extracts as one SAFETYNET field guide page in HacktivityLabSheets and switch to `lab-workstation` items as m01 does.

### Hint ladder

Three rungs on `[I'm stuck.]`: rung 1 names the kind of thing, rung 2 the method, rung 3 the recipe and where the missing piece is, never the answer. Rung state is an ink VAR per step on the HaX story; progress globals are scenario globals so mappings can read them.

| Step | Exposure nudge (event; see the text schedule in section 8) | Rung 1 | Rung 2 | Rung 3 |
|---|---|---|---|---|
| L1 leaflet | HaX on `item_picked_up:notes` + `data.itemId === 'keyholder_leaflet'`: "Numbers between 97 and 122. Look them up on your ASCII chart." (R2B-m4) | Each number is one character. | Look them up on the chart, or let CyberChef do it. | From Decimal. Type the word into the lockbox exactly as it comes out. |
| L2 locker | HaX on `objective_task_completed:open_lockbox`: "Eight digits for a four-digit keypad. Read it as characters. Bring the black box too; I want to know who's on the other end." (N-m4) | The keypad wants four digits. You have eight. | The digits 0-9 are ASCII 48-57, two digits each. If you got four capital letters, it read them as hex. | Put a space after every two digits, then From Decimal. If it locks you out, walk away and try again. |
| L3 binary | `objective_task_completed:open_locker` | Only 0s and 1s, in eights. | Each group is one byte, so one character. | From Binary. |
| L4 hex | `objective_task_completed:open_guest_terminal` | 0-9 and a-f only. | Two hex digits per byte; no spaces needed. | From Hex. The password is the last word. |
| L5 Base64 | `room_entered:corridor` (with the FN4 offer, one text) | Letters, digits, maybe + / and = at the end. | Base64: 6 bits per symbol. The poster shows how. | From Base64. The PIN is in the sentence. |
| L6 slip | `room_entered:library` (with the FN5 offer) | Two layers. What's the outside one? | After Base64 you've got shifted letters. The slip gives the shift. | From Base64, then ROT13 with Amount -6. |
| L7 Vigenère | `objective_task_completed:open_special_collections` (with the FN6 offer) | This one needs a key word. The file's notes say where. | Dr Selvarajan's whiteboard. Block 4. | Copy only the ciphertext. Vigenère Decode, Key = block 4's word. It gives the pigeonhole code and an IV: paste the IV onto the drop box tag in your notepad, with the pencil. |
| L8a envelope | HaX on `objective_task_completed:open_pigeonholes` (with the FN9 offer): "Got the IV from Trial VII? Paste it onto the drop box tag in your notepad, with the pencil." (R2B-M4) | Sealed to your public key. What can open it? | Your private key, on your lab account PC. | From Base64, then RSA Decrypt with private_key.pem pasted in. You get 32 hex characters: an AES key. Paste that onto the tag too. |
| L8b drop box | rung on request | You need a key and an IV, and the ciphertext on the tag. | The key came out of your envelope; the IV came with Trial VII. If you pasted them onto the tag, they're all on one page. | AES Decrypt: paste both, leave the rest. |
| L9 workshop | HaX on `objective_task_completed:open_drop_box` (section 8 schedule) | Some locks just want a key. | Check what came out of the drop box. | (none needed) |
| L10 relay | `room_entered:workshop` | It wants a fingerprint, not a password. | SHA-256 of the drop box passphrase, first eight characters. | Add SHA2 under AES Decrypt in the recipe you've got, Size 256. Or Dr Selvarajan's handout. |
| Climax | none, on purpose | "Whatever you've been handed, read it before you do anything with it." (same text for all three rungs; true in character and safe on a line Ghost says they read) | | |

HaX gives no hint about the scoreboard during the climax, because hers is the watched line.

Timed escalation (a nudge after N minutes stuck) is left out: a timed message's condition is checked when the event fires, not when the text arrives (R7).

## 7. Objectives and the mission conclusion

Structure follows m02 (`m02_ransomed_trust/scenario.json.erb:470-515`):
- aims with `aimId`/`title`/`tasks`;
- later aims `locked`, with `unlockCondition`;
- every task in a later aim shipped `"status": "active"` (README "Tasks in later aims ship status active");
- a final `missionConclusion` aim whose last task completes on the debrief's last line.

| Order | aimId / title | Unlock | Tasks (taskId, type, target) | Notes |
|---|---|---|---|---|
| 0 | `freshers_week` / "Freshers' Week" | active | `get_lab_laptop` npc_conversation `tom_shaw` ("Get a lab laptop from Dr Shaw"; `#complete_task` at the top of Tom's first knot, before the gives); `visit_stand` npc_conversation `jordan_pike` ("Visit the CryptoSecure stand"); `read_byte_wall` manual, **optional** (HaX mapping on `object_interacted` with `data.objectType === 'alarm_panel'`) | `onComplete` of the aim: `unlockAim: trials_bits` |
| 1 | `trials_bits` / "The Trials: Bits and Bytes" | `aimCompleted: freshers_week` | `open_lockbox` unlock_object `cryptosecure_lockbox`; `open_locker` unlock_object `candidate_locker_4`; `open_guest_terminal` unlock_object `keyholder_guest_terminal`; `open_corridor` unlock_room `corridor` | Each task's `onComplete.setGlobal` sets a progress flag (`lockbox_open`, `locker_open`, `guest_terminal_open`, `corridor_open`), which drives the hint ladder and Ghost's lines. |
| 2 | `trials_keys` / "The Trials: Secrets and Keys" | `aimCompleted: trials_bits` | `open_library` unlock_room `library`; `open_special_collections` unlock_object `special_collections_safe`; `consult_sidhu` npc_conversation `sidhu_selvarajan`, **optional**; `open_pigeonholes` unlock_object `pigeonholes`; `open_drop_box` unlock_object `cryptosecure_drop_box` | Progress flags `library_open`, `special_collections_open`, `pigeonholes_open`, `drop_box_open`. The required tasks can now only be done in this order (section 4). |
| 3 | `the_keyholder` / "The Keyholder" | `aimCompleted: trials_keys` | `open_workshop` unlock_room `workshop` (`onComplete.setGlobal: workshop_open`); `open_relay_terminal` unlock_object `relay_terminal` (`onComplete.setGlobal: relay_opened`) | |
| 4 | `the_offer` / "The Offer" (**missionConclusion**) | `aimCompleted: the_keyholder` | `answer_the_keyholder` manual ("Answer the Keyholder"; completed by a HaX mapping on `global_variable_changed:decision_made`); `warn_handler` unlock_object `hacktivity_scoreboard`, **optional**, titled "Use the fallback channel (optional)" (`onComplete.setGlobal: warned_out_of_band`; its answer only exists inside the report, so it can't complete early); `hear_debrief` custom (`#complete_task:hear_debrief` on the debrief's last line, then `#exit_conversation`, as `m02_closing_debrief.ink:975-980`) | conclusion screen |
| side | `loose_threads` / "Loose Threads" | `unlockCondition: { "globalVariable": "megan_file_read" }`, a story gate that keeps it hidden until the file is read (`objectives-manager.js:695-714`) | `decide_about_megan` manual, optional (mapping on `global_variable_changed:megan_choice_made`) | v1's `read_job_tape` task is dropped: optional lore doesn't need a task, and it could complete inside a hidden aim. |

Titles avoid giving answers away (README "Task, aim and item names don't give the answer away"): "The Keyholder", not "Meet Ghost"; "Use the fallback channel" reminds without solving; the Megan aim stays hidden until her file is read.

**missionConclusion wiring.**

```json
"missionConclusion": true,
"concludeRequires": { "tasksCompleted": ["open_relay_terminal"] },
"conclusionScreen": { "type": "bond_visualiser" }
```

- **`concludeRequires`** names the relay terminal, because opening it proves the whole chain was done: its answer depends on L8b, which needs L7 and L8a. The server only completes an `unlock_object` task for an object it has recorded as unlocked (`game.rb:1051-1054`), and the conclude gate checks that task's status (`game.rb:2188-2198`). Through the UI the only way to that record is the right password. With the D2 engine fix (user-approved, in the working tree), the server also checks that the claimed unlock method matches the lock's type, so the gate holds against console callers too once it's committed. Story tasks (the decision, Megan) aren't listed (README "What must not").
- The decision task completes when `decision_made` becomes true (any ending). The debrief task completes on the debrief's last line, so the bond_visualiser credits never cover the debrief.
- **Credits and victory music** run from a music event on `conversation_closed:closing_debrief_person`, as m01 (`m01_first_contact/scenario.json.erb:101-140`).

**Music.**
- `game_loaded` with `!globalVars.briefing_played` → `cutscene`; with `briefing_played === true` → `noir`.
- `conversation_closed:briefing_cutscene` → `noir`.
- `global_variable_changed:relay_opened` → `spy-action` (the climax), `onceOnly`, condition `!globalVars.decision_made` (rule 18).
- `global_variable_changed:start_debrief_cutscene` → `cutscene`. m01 plays `spy-action` there; this lab is already in `spy-action` from the climax, so the debrief drops to `cutscene` for contrast.
- `conversation_closed:closing_debrief_person` → `victory` with credits.
- No `threat` events: there's no combat.

**Credits** (each conditional line checked against every route; every section has an unconditional line; one `===` per condition, joined only with `&&`):
- Title: "KEYHOLDER: RECRUITED" when `ending === 'sent'` and when `ending === 'double'` (two lines); "KEYHOLDER: DECLINED" when `refused`, and when `blown`.
- **HANDLER:**
  - sent: "AGENT HaX: Location reached Ghost's server. Relocated."
  - sent, by `report_read_claimed` (`'unread'`/`'read'`): "REPORT: Sent unread." / "REPORT: Read, and sent." (N-m6)
  - double: "AGENT HaX: Decoy location live. Ghost is watching it."
  - refused / blown: "AGENT HaX: Unharmed."
  - unconditional: "AGENT HaX: Still your handler."
- **CAMPUS:**
  - Megan's line by `megan_choice` and `ending` (the four combinations in section 8);
  - Jordan: "JORDAN PIKE: Referral bonus paid" (sent, double) / "JORDAN PIKE: Email bounces" (refused, blown);
  - unconditional: "DR TOM SHAW: Reported the stand to the department." and "DR SIDHU SELVARAJAN: Still checks everything twice." (R2B-m10);
  - unconditional: "MISKATONIC UNIVERSITY: Term starts Monday."
- Last line, unconditional: "Ghost remains at large."

## 8. Climax and the endings (three choices; the build records four `ending` values: sent, double, refused, blown)

Everything here uses features already in the engine and proved in m02 or the probes: a terminal-themed phone NPC on a second device (probe R2), a `video-call` mapping on a global change (probe R3), `sendTimedMessage` from a phone NPC (m02's Ghost), ink choices with `#set_global`, password locks with containers, `setVisible` mappings and a hidden person-chat debrief. No new minigame.

### The opening briefing (outline and wiring)

**Wiring** (m01 pattern):
- Hidden person NPC `briefing_cutscene` in the foyer at 500,500, `spriteSheet: female_spy_v2`, voice as m01.
- `timedConversation: { "delay": 0, "targetKnot": "start", "background": "assets/backgrounds/hq4.png", "waitForEvent": "game_loaded", "skipIfGlobal": "briefing_played", "setGlobalOnStart": "briefing_played" }`.
- `#set_global:briefing_played:true` in `start` too.
- The player's phone in `startItemsInInventory` with `npcIds: ["agent_0x99"]`.
- `"show_scenario_brief": "once"`.

The briefing **can be closed** and never replays: timed conversations can't pass `disableClose` without an engine change (`npc-manager.js:1618-1622`). So nothing the rest of the game needs depends on the player sitting through it (N2):
- the Comms discipline note is given on the **first line** of `start`, before anything else, so even an instant close has handed it over;
- the written brief repeats the rule in one sentence (section 3);
- HaX holds a copy and offers it on request while `!comms_had` (section 6);
- "why me" is a nice-to-have, and the debrief reads correctly without it.

**Beats** (`ink/opening_briefing.ink`, about two minutes):
1. **The note first.** `#give_item:notes:comms_discipline` on the opening line. HaX: "Before anything else, read the note I've just sent you. If your phone's ever compromised, that's how you reach me." The note says: *"If you think your handset is compromised, don't message me. Submit what I most need to know as a flag on any Hacktivity terminal. It reaches me and nobody else. Flags are lower case, exactly as you find them: usually a word, a dash and some digits. The only Hacktivity terminal in that building is in Dr Schreuders' workshop."* `[How does it reach you?]` "That's classified too."
2. **Cover.** "Freshers' week at Miskatonic. You're a first-year again." The studentship, CryptoSecure as Ransomware Inc.'s front, two earlier Keyholders now on its payroll (D8: no "last year").
3. **Ghost, for anyone who skipped m02.** Two lines: Ransomware Inc.'s leader; St Catherine's; no name, no face, "they".
4. **"Why me?"** `[Ghost knows me. From St Catherine's.]` HaX (R2B-m1, the right way round): "Ghost never saw your face. You saw theirs, near enough: a hood on a screen. And if they do know you and still want you, that tells us more than a clean recruit ever could. I'll take either." The first half is HaX's misjudgement; Ghost's camera line on the call shows it. The second half is the gamble the debrief closes.
5. **Cliffe.** "Dr Z. Cliffe Schreuders. Builds Hacktivity. He'll know what you are within a minute." `[Is he one of ours?]` "That's classified."
6. **First objective.** "Get a lab laptop from Dr Shaw, then go and be found."

### Ghost before the call

The Keyholder device is in the L1 lockbox. Taking it opens Ghost's intro (phone-chat; no `currentKnot`/`targetKnot`, rule 5). Taking it is optional, but HaX's L2 nudge asks for it ("Bring the black box too"), and the ink copes either way (below). Ghost's lines are static (rule 2), none starts with `>` (rule 6), and they're sent with `sendTimedMessage` on the `ghost` phone NPC:

| Event | Line |
|---|---|
| first open of the device (`start`) | "Candidate. You opened a box most of your year walked past. There are seven more. I'll be watching. You won't see me do it." |
| `objective_task_completed:open_locker` | "Trial II. Two hundred and twelve candidates picked up a card. Forty opened the locker. Most of them guessed." |
| `objective_task_completed:open_corridor` | "Trial IV. Thirty-one candidates left. Most of them asked the Magic button. I can tell which." (R2B-m11) |
| `objective_task_completed:open_special_collections` | "Special Collections. The key to the next one is somewhere a careful man keeps his accounts." |
| `global_variable_changed:megan_file_read` | "You read the other candidates' files. So did I. Candidate 7 is the interesting one." |
| `global_variable_changed:megan_choice`, condition `value === 'protected'` | "Your handler's about to get generous with bursaries." (N-m9: intent, since no bursary exists yet) |
| `objective_task_completed:open_drop_box` | "Hybrid encryption. Nine candidates got this far. It's how we locked forty companies. Hospitals pay fastest." (R2B-m11; DIALOGUE_REVIEW; S2) |

**HaX suspects.** On `objective_task_completed:open_locker`, after Ghost's Trial II line: "That phrasing. I've read this voice before. Keep going, and keep your eyes open." No name, so the call still lands.

**HaX on the workshop** (R2B-M8, 3.1). On `room_entered:workshop`, folded into the L10 nudge: "The Keyholder's last Trial is in Schreuders' workshop. I'm not going to comment on that. It wants a fingerprint, not a password."

### Text schedule (N-m2)

Timed texts on neighbouring events can land together, and the validator only checks the same event. Delays count from each event; the player needs at least a second or two to walk through a door after unlocking it.

| Event | Texts (sender, delay) |
|---|---|
| `objective_task_completed:open_lockbox` | HaX L2 nudge, 1.5 s (the device intro opens only when the player takes the device) |
| `objective_task_completed:open_locker` | Ghost Trial II, 2 s; HaX suspicion, 8 s. L3 and L4 have no exposure nudge (Tom's FN3 covers them; rungs on request) |
| `objective_task_completed:open_corridor` → `room_entered:corridor` | Ghost Trial IV, 2 s; HaX L5 nudge + FN4 offer as one text, 6 s after entering |
| `room_entered:library` | HaX L6 nudge + FN5 offer, one text, 2 s |
| `objective_task_completed:open_special_collections` | Ghost Special Collections, 2 s; HaX L7 nudge + FN6 offer, one text, 8 s |
| `global_variable_changed:megan_file_read` | Ghost candidates line, 14 s (clears the 8 s HaX text if the file is read at once) |
| `objective_task_completed:open_pigeonholes` | HaX L8a nudge + FN9 offer, 2 s; HaX FN8 offer, 8 s |
| `objective_task_completed:open_drop_box` | HaX "Brass..." (L9), 1.5 s; Ghost hybrid line, 7 s |
| `room_entered:workshop` | HaX workshop remark + L10 nudge, one text, 2 s |
| `item_picked_up:notes` (`final_trial_card`) | HaX FN7 fallback offer if `!fn07_had`, 2 s (the card is taken from the drop box, between the L9 and Ghost texts' events but on its own trigger; probe that it doesn't land within 4 s of them) |
| `conversation_closed:ghost` | HaX FN10 fallback offer, 2 s, `onceOnly`, condition `globalVars.ghost_offer_made === true && !globalVars.fn10_had` (R3-2: phone-chat on the device also emits this event on every close, so without the condition it would fire at L1). This is the single FN10 fallback trigger. |
| `global_variable_changed:decision_made` | see step 5 below |

### The Keyholder ink (`ink/phone_ghost.ink`; N1)

A reopened phone resumes at the knot holding its choices and re-runs only that knot, and only when a declared global has changed (`phone-chat-minigame.js:435-447`, `phone-chat-conversation.js:587-610`). The video call runs in person-chat with its own saved state, so it doesn't move the device's position. So **every knot the device can rest on starts with the same routing**, and `start` uses it too:

```ink
=== start ===
~ ghost_greeted = true     // R3-1: the tag alone is deferred in a preload
#set_global:ghost_greeted:true
-> route

=== route ===            // no text, no choices: a router only
{decision_made: -> closed}
{ghost_offer_made: -> the_offer_again}
{relay_opened: -> the_offer}           // catch-up: the call was lost (reload, N-m11)
{not intro_done: -> intro}
-> waiting

=== intro ===            // short version if picked up late (progress globals)
~ intro_done = true
{special_collections_open: Candidate. You took your time collecting this. I didn't. | Candidate. You opened a box most of your year walked past. ...}
-> waiting

=== waiting ===          // resting knot during the Trials
{decision_made or ghost_offer_made or relay_opened: -> route}
(one static line chosen by progress, e.g. "Trial V. Still watching.")
+ [Who are you?] -> who_reply
+ [Close the device.]
    #exit_conversation
    -> waiting

=== the_offer_again ===  // resting knot after "I'll think about it"
{decision_made: -> closed}
Back. So you've decided.
+ {not decision_made} [Sending it now.] -> send_says_go   // points the player to HaX's phone; Ghost doesn't send for them
+ {not decision_made} [No. Find another student.] -> refuse
+ [Still thinking.]
    #exit_conversation
    -> the_offer_again

=== closed ===           // resting knot after any decision
NO CARRIER
+ [Close the device.]
    #exit_conversation
    -> closed
```

**Declared VARs (R3-3).** A reopen re-runs the resting knot only when a global the story declares as a `VAR` has changed (`phone-chat-conversation.js:590-603`). `phone_ghost.ink` declares: `decision_made`, `ghost_offer_made`, `relay_opened`, `ghost_greeted`, `ending`, `megan_choice`, `lockbox_open`, `locker_open`, `guest_terminal_open`, `corridor_open`, `library_open`, `special_collections_open`, `pigeonholes_open`, `drop_box_open`, `workshop_open`; ink-local: `intro_done`, `on_call`. HaX's story declares every global it reads in section 8's globals table.

`refuse` itself starts with `{decision_made: -> closed}` and sets `ending` then `decision_made` last. No knot ends in `DONE` or `END` (README "Ink"). `who_reply` and `send_says_go` return to their resting knot.

**Reopencheck states the build must test** (rule 17), for the Keyholder story, each with a reopen and a reload:

| # | State (globals) | Expected landing |
|---|---|---|
| K1 | device just taken; nothing else | intro, then `waiting` |
| K2 | device taken late: `special_collections_open` | short intro, then `waiting` |
| K3 | device taken after `relay_opened`, `!ghost_offer_made` | `the_offer` (catch-up) |
| K4 | resting in `waiting`, then `relay_opened` set but the call lost | reopen → `the_offer` |
| K5 | after "I'll think about it": `ghost_offer_made`, `!decision_made` | `the_offer_again`, refuse choice present |
| K6 | as K5, then the report sent on HaX's phone (`decision_made`, `ending === 'sent'`) | reopen → `closed`, no refuse choice; `ending` unchanged |
| K7 | refused on the device | `closed` |
| K8 | blown on HaX's phone while the device rests in `waiting` | `closed` |
| K9 | K5, then a page reload | `the_offer_again` |
| K10 | Device first taken **after** the call (`ghost.currentKnot` is `the_offer`), before and after a decision | `the_offer`'s first line routes away: `the_offer_again` before a decision, `closed` after; the offer doesn't replay (R3-1) |

And for HaX's phone story:

| # | State | Expected hub |
|---|---|---|
| H1 | `!comms_had` (briefing closed before line 1, or a reload) | Comms reminder choice shown |
| H2 | mid-Trials, offers pending | field-note and stuck choices; no send/trap |
| H3 | `ghost_offer_made && !decision_made` | send, trap, climax rung; no debrief |
| H4 | `ending === 'refused' && !refusal_reported` | `[I turned the Keyholder down.]` |
| H5 | `decision_made` | sticky `[I'm clear. Debrief me.]` |
| H6 | `start_debrief_cutscene` already true (reload mid-debrief) | the same sticky choice, which re-sets the global and reopens the debrief (N-m10) |

### The climax, beat by beat

1. **Workshop.** The brass key opens the door. Cliffe is at his bench and barely looks up (section 9).
2. **Relay terminal opens** (L10). `open_relay_terminal` sets `relay_opened`. A `ghost` mapping on `global_variable_changed:relay_opened`, condition `value === true && !globalVars.ghost_offer_made`, `onceOnly`, opens a **video call** with `targetKnot: the_offer_call` (probe R3), so after the call `ghost.currentKnot` is `the_offer_call`. The call pre-empts the terminal's auto-open (rule 9). If the call is ever lost, the device's `route` delivers the offer instead (K3, K4).
3. **The offer** (`the_offer`). Its first line is `{ghost_offer_made: -> route}` (R3-1), **before** it sets `~ ghost_offer_made = true` and `#set_global:ghost_offer_made:true`; then `{decision_made: -> closed}`. Both the call and the catch-up enter with the flag false, so neither changes. Lines marked *(call only)* are wrapped in a check on an ink VAR `on_call`, which the call's own entry knot sets (the video-call mapping targets `the_offer_call`: `{ghost_offer_made: -> route}`, then `~ on_call = true`, then `-> the_offer`). `route` and `start` both set `~ on_call = false`, so a device opened after the call, which may inherit the call's ink variables, never shows call-only lines (R3-4):
   - The terminal text goes dark; a hooded, backlit figure, as in m02.
   - **Recognition, true to m02** (R2B-m11): "St Catherine's had forty-one cameras. I switched off the recorders, not the cameras. I watched you all night. You still walk like you're expecting a door to be locked. Your monitors said no signal. Mine didn't." (m02's CCTV object shows NO SIGNAL and RECORDER OFFLINE, `m02 scenario.json.erb:3004-3005`, R3-7; "Tonight I have had it on you. Every terminal, every room.")
   - **The name** (N-m8): "At St Catherine's you never asked my name. Most people do. It's Ghost." The contact stays "Keyholder" in the phone UI; the debrief and credits say Ghost.
   - **The callback:** "The last time I made you an offer, there was a ward forty feet away. This one's simpler." (dialogue round 2, C2)
   - Ghost knows SAFETYNET sent 0x00 and says that's the attraction: a recruit has to be smuggled in; a double agent is already inside.
   - **The motive, in Ghost's idiom:** "SAFETYNET audits everyone and publishes nothing. I don't recruit talent. I recruit people who've shown me what they'll give up. Your handler's location is a number I can check."
   - **The ask:** send the report to HaX "the way you send everything". It's signed, so "nobody improves it on the way".
   - **Scoped watching:** if `ghost_greeted`: "That device has been in the same pocket as your phone since you took it out of my box. It listens. Everything you've said to your handler since, I've read." Otherwise: "You left my device in the box. It doesn't matter. This building's network has been mine all week, and so has everything your phone said on it." Both scope the claim to today (A-m19).
   - **Pricing each route (R2B-M8, lever 2; see "Why this lever" below):**
     - refusal: "Say no and you walk away, and Miss Oyelaran walks with you. I don't keep one without the other." (only if `megan_choice != "warned"`; if she's already walked: "Say no to me and you'll be the second this week."; dialogue round 2, M2);
     - any trick: "And if that location turns out to be wrong, I'll know who told me, and I'll be making you a third offer.";
     - sending: "Send it and you start Monday. So does she."
   - If `megan_choice == "warned"`: "You warned the Oyelaran girl. Sentimental. One candidate in two hundred and twelve, so I'll let it pass." (dialogue round 2, M2)
   - **Choices:**
     - `[What's in it?]` → "Read it. You've earned the right to read anything I give you." Loops back.
     - `[Could I change it first?]` → Ghost explains that the signature would fail (the signature lesson in Ghost's voice). Loops back.
     - `[I'll think about it.]` → "Take your time. The relay closes when you leave the building. I don't."
     - `[No. Find another student.]` → refuse.
   - Closing line: "Your terminal's still open. Read what I gave you." (rule 9).
   - **Exits, both modes (R3-4).** `[I'll think about it.]` → line → `#exit_conversation` → `-> the_offer_again`. Refuse → `-> refuse` → line → `#exit_conversation` → `-> closed`. After the closing line → `#exit_conversation` → `-> the_offer_again`. On the call, the conversation closes on `#exit_conversation`; on the device the story then rests on `the_offer_again` or `closed`, which is what K5-K10 expect.
   - **Call-only lines** (gated on `on_call`): the Narrator's "The terminal text goes dark…" and the hooded-figure line; the Narrator's "Behind you, Dr Schreuders keeps soldering." On the device, Ghost's terminal text opens instead with "CONTACT RESUMED" and the same spoken lines. `closed`'s `[Close the device.]` choice is only ever reached on the device, because on the call the refuse path exits first.
4. **The player decides.** `report.b64` decodes to a routine field report ending in a one-pixel image from `cdn.cryptosecure-recovery.example/px/locate/merlin-2685.png`. The word "locate" is in the URL on purpose (R2B-M3), and by now the idea has been planted twice (below).

**Planting the tracking pixel (R2B-M3).** The game teaches it before the climax needs it:
- the foyer's sign-up laptop advertises "CryptoSecure Mailer: know the moment your email is opened, and where!";
- Tom, asked `[What do you make of CryptoSecure?]` (hub choice from the start): "Turned up without asking the department, for one. And see that Mailer they're flogging? A one-pixel picture in the email. Your mail app fetches it, and their server learns when you opened it and roughly where. Turn remote images off.";
- FN10: "A signature hides nothing, so read what you send. A document can carry a remote image that reports where it was opened.";
- the debrief explains it plainly on every route (section 9, R2B-m14).

| Route | What the player does | Mechanism | Globals |
|---|---|---|---|
| **Send** (betray HaX) | Picks `[Sending you my report now.]` in HaX's hub (shown when `ghost_offer_made && !decision_made`). | HaX ink: `{warned_out_of_band: ~ ending = "double" - else: ~ ending = "sent"}`; `#set_global` for `ending`, then `decision_made:true` **last**. In the debrief, HaX's "Did you read it?" sets `report_read_claimed` (`"read"`/`"unread"`), read by the credits. | `ending = "sent"` |
| **Warn out of band, then send** (true double agent) | Submits the token, e.g. `merlin-2685`, at the Hacktivity scoreboard; then sends the report. | The scoreboard's unlock completes the optional `warn_handler` (`onComplete.setGlobal: warned_out_of_band`), and reading `submission_accepted.txt` sets it again via `onRead` (N-m11 cover). The file's reply: "+50 points. Admin note: Got it. If that report reaches me, we'll be the ones who open it. H." | `warned_out_of_band`, then `ending = "double"` |
| **Refuse** (Ghost withdraws) | `[No. Find another student.]` on the call or on the device (`the_offer_again`). | Ghost ink sets `ending = "refused"`, then `decision_made`; prints "CONTACT CLOSED". Later opens → `closed`. | `ending = "refused"` |
| **Warn in band** (variant of refuse) | `[It's a trap. Don't open anything from me.]` in HaX's hub. | HaX ink sets `ending = "blown"`, then `decision_made`. A Ghost mapping on `global_variable_changed:decision_made`, condition `value === true && globalVars.ending === 'blown'`, sends: "I did say it listens." | `ending = "blown"` |

**How "decode the report before sending" works mechanically.** The report is only readable after From Base64, and the token exists only inside it, in the pixel's URL. Without decoding, the double-agent ending can't be reached, because the scoreboard's answer *is* the token. A player who sends without decoding gets the betrayal ending, and the debrief explains the pixel to them anyway. Hash and signature checks are optional; the report files' observations and FN10 make them work first time (R2B-M2). Sidhu makes the moral point if the player takes the report to him (below).

**How "warn HaX out of band" works mechanically.** A second, unrelated system: a password-locked `pc` whose answer is the per-game token. Entering it proves the player decoded the report and chose the channel the device can't hear. Findable without being given away:
- the note on the briefing's first line, the written brief, and HaX's copy;
- the scoreboard's post-it ("HACKTIVITY // SUBMIT FLAG. Flags are lower case, exactly as found.");
- the smartscreen variant after `ghost_offer_made`;
- Cliffe between the call and the decision: "Scoreboard's been quiet today. Takes flags from anyone. Never asked who reads them.";
- the task title "Use the fallback channel (optional)";
- no HaX hint during the climax, because hers is the watched line.

**Every order is covered:**
- warn, then send → "double";
- send, then warn → stays "sent"; `late_warning` set by a HaX mapping on `objective_task_completed:warn_handler`, condition `globalVars.decision_made === true && globalVars.ending === 'sent'`; debrief: "You tried. It was already open.";
- refuse or blown, either side of a warning → stays "refused"/"blown" with `warned_out_of_band` true; the debrief thanks the player for the token ("we're watching that server now").

**Why this lever (R2B-M8).** Reviewer B offered two ways to make the choice pull both ways: (1) Ghost casts doubt on the scoreboard ("I've had a key to this room since August"), or (2) Ghost prices each route. I chose **lever 2**, plus HaX's flat "I'm not going to comment on that" about the workshop:
- **It keeps the best ending findable.** Lever 1 tells a student the safe channel is unsafe; many would believe it and never try the scoreboard. That undoes the round-1 work on A-M3/B-M3, and it would be a lie the debrief has to retract.
- **It makes every route cost something visible, in Ghost's own currency.** Refusing costs Megan her placement (unless the player already saved her). Sending costs HaX. The double route puts 0x00 on Ghost's list for a "third offer", which the debrief picks up ("Ghost will ask again, and next time it'll be something we can't fake."). Send even has a pull: "you start Monday, so does she".
- **It's true.** Nothing Ghost says is false, so the debrief needn't correct anything.
- HaX's workshop remark and Cliffe's "never asked who reads them" keep a small, honest unease about the scoreboard without telling the player to avoid it.

**Sidhu's scene (R2B-M7).**
- He plants it when he gives FN10: "If anyone hands you something signed, bring it to me. I like to watch a signature check out."
- `report.sig`'s observations end "Dr Selvarajan would want to see this."
- His line is gated on `relay_opened`: before `decision_made`, "It verifies. That tells you who wrote it, and that nobody has changed it. It does not tell you whether you should send it."; after it, in the past tense: "It verified, I expect. That was never the question."
- The report files' observations and FN10 fix the verification traps first, so his line matches what the player saw.

5. **After the decision.** HaX mappings on `global_variable_changed:decision_made` (one per `ending` value, `&&`-only conditions) complete `answer_the_keyholder` and send:
   - **sent and double: identical texts.** "Received. Opening it now." at 1.5 s; then "My phone just did something it shouldn't. Get out of the building. Call me when you're clear." at 7.5 s. On the double route HaX is performing for a line Ghost reads.
   - **refused** (N-m5): HaX can't see the device, so she checks in: "Your end's gone quiet. Talk to me." at 3 s. Her hub then shows `[I turned the Keyholder down.]` (while `!refusal_reported`): "Copy. Leave by the front. Don't run. Then call me." (sets `refusal_reported`).
   - **blown:** the player has just told her: "Copy. Leave by the front. Don't run. Call me when you're clear." at 6 s (Ghost's "I did say it listens." goes at 2 s).
6. **Cliffe** has one line per ending (section 9). Jordan's stand empties on refused and blown (`setVisible: false` on `jordan_pike`, one mapping per value).
7. **Debrief.** HaX's hub shows a **sticky** `[I'm clear. Debrief me.]` whenever `decision_made` is true (N-m10). It sets `start_debrief_cutscene`, which opens the hidden `closing_debrief_person` (`disableClose: true`, `hq1`). `#set_global` emits even for an unchanged value (`chat-helpers.js:477-497`), so after a reload mid-debrief, picking it again reopens the debrief.

### The endings (four `ending` values in the build)

- **Betrayal (sent).** HaX's phone fetched the pixel. Nobody is hurt: SAFETYNET moves HaX and two others that night, and she debriefs from somewhere new. Ghost believes 0x00 belongs to them; SAFETYNET can't know if that's true, so HaX can't either. "Did you read it?" is the line that stays.
- **Refusal (refused / blown).** HaX is safe. Ghost knew who 0x00 was all along, so this is **a door shut**, not a blown cover: CryptoSecure's stand is gone by morning and Jordan's email bounces. HaX: "A clean no is worth something. It's also the last time they'll talk to you."
- **Double agent (warned, then sent).** SAFETYNET opens the report on a decoy handset in a flat in Leeds; the pixel tells Ghost's server that's where HaX is. Ghost thinks 0x00 is theirs. HaX in the debrief: "Congratulations. You now work for both of us. Only one of us knows." and the cost: "Ghost will ask again, and next time it'll be something we can't fake." The sequel hook is lab-local (section 9).

### Mid-mission moral choice: Megan

- **Discovery.** "Candidate assessments" in the Special Collections safe: Ghost's notes on six candidates. Megan's says, in Ghost's business register, that her overdraft is £11,400, her mother's care-home fees are behind, and that this makes her "highly retainable". Candidate 7's entry: "See separate file." (`onRead` sets `megan_file_read`, which also reveals the "Loose Threads" aim.)
- **Stakes.** Megan has been friendly, and she showed the player the Trial II trap.
- **Choices**, once `megan_file_read`:
  - **Tell her yourself** (`[CryptoSecure isn't what it looks like. Walk away from this.]`): hurt, then thinking, then she quits; Ghost notices at the climax. `megan_choice = "warned"`.
  - **Ask HaX** (`[Megan Oyelaran is on their list. Can we help her?]`): "Not on this line. Leave it with me." SAFETYNET arranges a real bursary through a front, and Ghost's line shows they saw the request. `megan_choice = "protected"`.
  - **Do nothing.** `megan_choice` stays `""`. Debrief by ending: on sent or double, "She took a CryptoSecure summer placement. We'll keep an eye on her. You could have."; on refused or blown, "The placement vanished with CryptoSecure. She's still eleven thousand down and still looking."
- Each choice sets `megan_choice_made` (completes the optional `decide_about_megan`). Guard: `{megan_choice != "": -> after_choice}`.

### Globals

Declared in `globalVariables`, each with a named reader (N-m6):

| Global | Set by | Read by |
|---|---|---|
| `briefing_played` | briefing | `skipIfGlobal`, music |
| `comms_had` | one mapping per Comms note id | HaX hub (H1), HaX reminder text |
| `ghost_greeted` | Keyholder `start` | the offer's watching line |
| `ghost_offer_made` | `the_offer` | mappings, both phone hubs, smartscreen, Cliffe |
| `decision_made`, `ending` (`""`/`sent`/`double`/`refused`/`blown`) | HaX or Ghost ink | mappings, credits, debrief, Cliffe, routing |
| `warned_out_of_band`, `late_warning` | scoreboard task / file, HaX mapping | send knot, debrief |
| `report_read_claimed` (`""`/`read`/`unread`) | debrief | credits |
| `refusal_reported` | HaX ink | HaX hub (H4) |
| `relay_opened`, `workshop_open` and the other progress flags (section 7) | task `onComplete` | call mapping, routing, hint ladder, Ghost lines, Cliffe's hide |
| `megan_file_read`, `megan_choice`, `megan_choice_made` | note `onRead`, ink | Ghost lines, offer, debrief, credits, side aim |
| `ebcdic_seen` | tape `onRead` | FN11 offer |
| `start_debrief_cutscene` | HaX ink | debrief mapping, music |
| `fn04_offered` ... `fn11_offered`, `fn04_sent` ... `fn11_sent`, `fn07_had`, `fn10_had` | HaX mappings and ink | HaX hub |

v2's `report_sent` is dropped: `ending` already says it. Hint-rung counters and `intro_done` are ink VARs only.

## 9. Cliffe's thread, the debrief and the sequel hook

### What he's building

**A live model of the building.** On his common-room laptop early on, and on the big screen in his workshop at the end, Cliffe has a top-down map of the Computing building, room by room, with small figures moving about in it: a student at the vending machine, Tom at his chalkboard, and one figure in the player's hoodie standing exactly where the player is. He calls it "a teaching tool" and "a game where you learn by getting caught", and closes the lid if asked anything direct. It does nothing mechanical. It's uncanny, it suits a man who builds learning tools, and it leaves every question open: training simulator, SAFETYNET tool, ENTROPY tool, or just his next project?

Mechanically it's the pinned workshop `smartscreen` with `observationVariants` that follow progress (first match wins, so the list runs latest first):
- after `decision_made`: "On the map, the small figure in your hoodie walks out of the workshop. A second figure you don't recognise stays by the scoreboard.";
- after `ghost_offer_made`: "On the map, the small figure in your hoodie is standing near the scoreboard.";
- default: "A map of this building. One of the little figures is wearing your hoodie."

The common room's laptop is an examine-view object.

### Across the mission (his beat is the scoreboard; B-M6)

| When | Where | Beat |
|---|---|---|
| Briefing | HaX | "Dr Z. Cliffe Schreuders. Builds Hacktivity. He'll know what you are within a minute." `[Is he one of ours?]` "That's classified." |
| Act 1 | Common room (`cliffe_schreuders`) | Coffee, laptop, the map. Two or three exchanges about the Trials ("Saw the leaflets. Reckon whoever wrote them has marked a lot of exams."), one about the build, and the slip: "Good luck with it, Agent. ... Student. Sorry, long week." He doesn't explain. Optional; no task needs him. |
| Workshop entered | `cliffe_workshop` in the workshop; `cliffe_schreuders` hides via his own `room_entered:common_room` mapping when `workshop_open` is true (N-m7; section 3) | `cliffe_workshop` at his bench: "Door was locked for a reason, mate. Though I suppose you had the key. Interesting, that." |
| During the call | Narrator line in Ghost's knot | "Behind you, Dr Schreuders keeps soldering. He hasn't looked up." |
| Between the call and the decision | `cliffe_workshop`, gated `relay_opened and not decision_made` | **The moment that matters:** "Scoreboard's been quiet today. Takes flags from anyone. Never asked who reads them." He points at the out-of-band channel without saying why he knows it reaches anyone. |
| After the decision | `cliffe_workshop`, by `ending` | sent: "Hope that was worth it." / double: "Interesting choice of channel." / refused: "Good. Some offers you hear out and still say no to." / blown: "Phones. Never trusted them." Then back to the build. |
| Debrief | HaX | `[Who is Dr Schreuders?]` "That's classified." If pressed: "Classified isn't the same as 'I don't know', Agent. Leave it there." |

He's present at the climax in his own room, says nothing during the call, and his lines show he heard. Nothing settles whether he's SAFETYNET, ENTROPY, neither or both. His scoreboard reaching HaX is the strongest hint, and HaX won't explain it.

### The debrief (outline)

`ink/closing_debrief.ink`, hidden person-chat at the field HQ (`hq4`; the fallback site, `hq5`, on the sent ending), opened by `start_debrief_cutscene`, `disableClose: true`.
1. **Opening by ending**, four variants: what happened to HaX's handset. For "double", this is where the player learns the truth: "My phone did exactly what Ghost wanted, in a flat in Leeds we rent for the purpose. Thank you for the flag."
   **Then, on every route, the pixel in plain words (R2B-m14):** "One pixel. A picture too small to see, fetched from Ghost's server the moment anyone opens the report. That's all a location costs. Your mail app does the same thing every day, unless you turn remote images off."
2. **The report.**
   - sent: "Did you read it before you sent it?", with two answers, both accepted, different replies.
   - double: what SAFETYNET now owns (a decoy, an address Ghost trusts, a line into Ransomware Inc.).
   - late warning: "You tried. It was already open."
   - warned and then refused, or blown: thanks for the token.
3. **Why 0x00** (A-M4 pay-off; R2B-m1; R3-6, standing alone so it works whether or not the player asked in the briefing): "I bet Ghost never saw your face at St Catherine's. I lost. I said I'd take either outcome. Ghost recognised you and wanted you anyway. That's worth knowing. I didn't enjoy learning it." On the double route, the cost: "Ghost will ask again, and next time it'll be something we can't fake."
4. **Ghost.** What they now believe about 0x00, by ending. The device: "Hand it in. We'll replace your phone too; it sat next to theirs all day."
5. **Megan** by `megan_choice` and `ending` (section 8); **Jordan** by ending.
6. **What the player can now do**, as tradecraft, not a quiz: "You can read Base64 now. Most people who'd have opened that report can't." One line, no questions.
7. **Optional questions:** "Who is Dr Schreuders?" ("That's classified."); "Was Ghost really reading my phone?" ("Assume they were. That's all the answer you get.").
8. `#complete_task:hear_debrief`, then `#exit_conversation`.

### Sequel hook (lab-local; A-m18)

- **Double:** ~~a week later, a message on the Keyholder device: "Term's started. So have you."~~ Removed in the alignment round (D7): there is no double-agent hook. The double route's win is that SAFETYNET photographs whoever comes to look at the decoy flat.
- **All endings:** the credits' last line before "Ghost remains at large." is Cliffe's screen: "On the map, a room you haven't been in has a light on." A small open question, committing to nothing.
- **Sidhu seed** (a paper he once reviewed, signed "Keyholder"): cut by default (Q4), because it ties a real academic to Ghost's past.

### Canon status (K1; user decisions D7-D9, 2026-10-06)

For campaign writers. This lab is canon, with these limits:

1. **ENTROPY never takes 0x00 on.** On every route the Keyholder Studentship is never awarded. On refused, the player turns it down. On blown, Ghost hears the warning and withdraws it. On sent and double, Ghost withdraws it once the report is opened: "anyone a handler can send, a handler can recall". 0x00 is never an ENTROPY agent, double or otherwise, so m08's mole hunt needs no change.
2. **What each route leaves behind.**
   - Sent: the beacon burns a SAFETYNET site, "the field HQ" (never named; background `hq4`). The team gets out before midnight and nobody is hurt, but the site, its kit and its cover are lost. HaX debriefs from a fallback site (`hq5`).
   - Double: the field HQ stays dark. SAFETYNET photographs the person who comes to look at the decoy flat in Leeds.
   - Refused and blown: no site is lost.
   - Megan, Jordan and the stand vary by route, as in the debrief and credits.
   Later missions may refer to "a field site lost to a ransomware beacon" only if they don't depend on which ending the player chose.
3. **Dating.** Freshers' week, undated. Nothing says how long it has been since St Catherine's, and no line uses "last year" or any other dated claim (D8).
4. **St Catherine's.** HaX says it was a hospital and not everyone on the ward lived (consistent with every m02 outcome). Ghost's video call recognises 0x00 from that night.
5. **Rules for later edits.**
   - No line claims a campaign event after m02.
   - Ghost stays at large.
   - Nothing in the fiction is called Tesseract or the Architect.
   - This lab uses only its own backgrounds: `hq4` (the field HQ), `hq5` (the fallback site) and `miskatonic_campus`. hq1-hq3 belong to other missions (m01, m07, m08) and must not appear here.
6. **Recruitment.** The canon recruiting cell is the Insider Threat Initiative (`story_design/universe_bible/10_reference/quick_reference.md:33`). Ghost recruiting students here is a user decision (DECISIONS_LOG, 2026-10-06), seeded in m02 ("I hope it's you leading it"). It is not a conflict.

## 10. Art needed

The full list, with placeholders and priorities, is in `scenarios/lab_tesseract_trials/ART_NEEDED.md`. No image has been generated. Summary:

| Need                                                                                                   | Placeholder until then (all exist in `public/break_escape/assets/`)                                            |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Cliffe: walk sheet, talk portrait, visemes, headshot (real person: likeness needs the user's approval) | `male_nerd_v2`                                                                                                 |
| Tom Shaw: same set (real person)                                                                       | `male_office_worker_v2`                                                                                        |
| Sidhu Selvarajan: same set (real person)                                                               | `male_scientist_v2`                                                                                            |
| Jordan Pike                                                                                            | `male_telecom_v2`                                                                                              |
| Megan Oyelaran                                                                                         | `female_office_worker_v2`                                                                                      |
| HaX, Ghost                                                                                             | none needed: reuse m01/m02 art (`female_spy_v2`; `male_hacker_hood_talk.png` and `npc/avatars/npc_hacker.png`) |
| Byte Wall (front panel with eight lamps)                                                               | `alarm_panel` sprite; the minigame draws the lamps                                                             |
| Punched paper tape                                                                                     | `notes2`                                                                                                       |
| Keyholder device (small black terminal)                                                                | `phone`                                                                                                        |
| ECB / CBC logo exhibit (optional)                                                                      | `chart` with a text description                                                                                |
| CryptoSecure stand banner                                                                              | `picture1`                                                                                                     |

Each placeholder sheet is used by only one character in this scenario, so the validator's "one sprite sheet shared by different characters" check passes.

## 11. Open questions

Each has a recommended default so the build can go ahead; the user can overrule any of them. Questions settled in round 1 are marked.

| # | Question | Options | Recommended default and why |
|---|---|---|---|
| Q1 | What is Cliffe building? | (a) a live top-down model of the building with a figure in the player's hoodie; (b) a hand-built cipher machine he won't explain; (c) a "honeypot campus" network | **(a)**, accepted in the decisions log: uncanny, commits him to no side, costs only text. |
| Q2 | Ghost's contact name | **Settled:** "Keyholder" all game; Ghost names themselves on the video call (orchestrator, following A-M6: the engine can't rename a contact). | |
| Q3 | If the first blind playtest runs over 75 minutes (D3, decided), what goes, in order? | 1. L2 (move the run-together trap onto a second note handed over with the leaflet, never into the leaflet's own text (R2B-M5); Megan's line and FN2 keep the lesson). 2. The Base64 layer round the Caesar slip. 3. Act 3 fallback: L8a/L8b hint rung 3 names every field, and Tom's README gives the RSA recipe outright. 4. Optional exhibits (EBCDIC tape). | **Keep everything, including L3 (orchestrator decision), until a timed blind playtest**, then apply in this order. |
| Q4 | Sidhu's optional seed (a paper he once reviewed, signed "Keyholder") | include / cut | **Cut**: it links a real academic to Ghost's past. |
| Q5 | Portraits of the real academics | placeholders; PixelLab from reference photos | **Placeholders** until the user supplies references and approves the look. |
| Q6 | ECB-mode image exhibit | build (art needed); leave out | **Optional P3**; don't build until the user approves the asset. |
| Q7 | Field guide as a published HacktivityLabSheets page | yes / notes only | **Notes only** (no other repo touched). |
| Q8 | Ghost's claim to be listening | true; bluff; left open | **Left open, and scoped to today and the Keyholder device** (A-m19). The handset is replaced in every ending. |
| Q9 | How dark is the betrayal ending? | HaX relocated, nobody hurt; someone hurt | **Nobody hurt** (accepted). The weight is "Did you read it?" |
| Q10 | mission.json `collection` and display name | `escape_room`; `vm_labs` (wrong: no VM); new | **`escape_room`** (accepted), "The Keyholder Trials", difficulty 1, CyBOK entries from `lab_encoding_encryption/mission.json` plus AC "public key cryptography" and "hash functions". |
| Q11 | Accents for Tom (Huddersfield), Sidhu (Indian English), Megan (Manchester) | as in section 2 | **A short sample of each voice goes to the user before the dialogue pass**, flagging Sidhu's "see," and "isn't it?" markers for a yes or no (A-m20). The draft doesn't use them. |
| Q12 | 1979 job tape owner | **Settled:** anonymous ("OWNER [REDACTED]. PROJECT KEYHOLDER.") | |
| Q13 | `concludeRequires` | **Settled:** `{ "tasksCompleted": ["open_relay_terminal"] }`, server-authoritative (R5). | |
| Q14 | The Byte Wall's frame title reads "Facility Alarm Panel" (`alarm-panel-minigame.js:28`) | accept; ask for an engine option to set it | **Accept for the build**, and note it as a later engine nicety (an optional `frameTitle`) in the approval log, not here. The inner header and footer carry the 1979 framing. |

## 12. Risks

The probe scenario (`scenarios/test-tesseract-probes/`, games 1568-1570 on :3001) settled most of v1's risks. Workarounds are now build rules (section 5). What's left is listed with how to probe it in the build's first browser run.

### Settled by the probes or by reading code

| # | Risk | Result |
|---|---|---|
| R1 | NPC gives the `workstation`, which opens CyberChef from the inventory | **PASS** (probe 1568). |
| R2 | Terminal phone in a password-locked container; take it and talk | **PASS**, but the intro showed twice. Fixed scenario-side: no `currentKnot` on the Keyholder NPC, no `targetKnot` on its pickup mapping (rule 5; engine item E1 deferred). |
| R3 | `video-call` on `global_variable_changed` | **PASS**; fires within about 100 ms, pre-empts the container's auto-open. Rule 9. |
| R4 | Locked objects must be top-level room objects | Holds (`game.rb:920-932`). Rule 8. |
| R5 | `concludeRequires` with an `unlock_object` task | Server-authoritative (`game.rb:1051-1054`, `:2188-2198`). |
| R6 | Copy from `text_file` and from `notes` into CyberChef | **PASS** both (Copy button; selecting note text). Rule 3 keeps the copied text ciphertext only. |
| R8 | Byte Wall lamps fixed, no globals | **PASS** with one default state and `variables: []`. |
| R9 / R15 | `pigeonholes1` and an unlocked `pc` as containers | **PASS with `"locked": false`**; without it the interaction does nothing (`unlock-system.js:637-638`, `:93`). Rule 4. |
| R10 | CyberChef forgets its recipe on close | **Resolved by engine change D1**, implemented in the working tree (uncommitted): the frame loads once and close only hides it; the pop-out tab carries the live recipe and input over. Node test 3/3, browser games 1571/1572 (DECISIONS_LOG). Must be committed before this scenario. A page reload still clears CyberChef, which is acceptable. |
| R11 | Exact, case-sensitive answers; 50-character field | All answers lower case or digits, 4-14 characters (verified for 120 seeds; 14 is the pool maximum). Rule 7. |
| R13 | ERB `def` and the TTS batch render | Rules 1-2. |
| R16 | A person NPC gives a `notes` item into the notepad | **PASS** (probe 1568). |
| - | 32+ character password; PIN lock; task completed by a `pc` unlock | **PASS** (probe 1568/1569). |
| - | `text_file` observations shown in their own box, outside Copy | Code read: `interactions.js:1404-1409` maps `text` → content and `observations` → observations; `text-file-minigame.js:90-94` renders them separately; Copy uses content only (`:211`). |

### Still open: probe in the first build run

| # | Risk | What I checked | How to probe / fallback |
|---|---|---|---|
| R17 | `pigeonholes1` as a **password-locked** container (the probe only tried it unlocked). | Locked containers of any sprite go through the same `lockType` path as the lockbox and locker, which passed. | Open it with the porter's code; check the four files list. Fallback: a `filing_cabinet` named "Pigeonholes". |
| R18 | `sendTimedMessage` from the Keyholder phone NPC, whose phone is the second device, before the player has opened that phone more than once. | m02's Ghost does exactly this on `ghost_terminal` (`m02 scenario.json.erb:1290-1306`). | Check Ghost's Trial II line arrives as a toast and lands in the device's thread. |
| R19 | A phone NPC (HaX) giving `notes` items. | m05 precedent (`m05_phone_agent_0x99.ink:504`); not in the probe. | Ask HaX for FN4. |
| R20 | `observationVariants` on pinned `smartscreen` / `chalkboard2` objects placed over template decor of the same sprite. | Template decor isn't a scenario object, so it can't carry text. | First render: check for doubled sprites; if doubled, offset the pin or use another sprite (`info_screen1`, `whiteboard2`). |
| R21 | The story-gated side aim (`unlockCondition.globalVariable`). | `objectives-manager.js:695-714`; m05 uses it. | Read Megan's file; the aim should appear then and not before. |
| R22 | The relay `pc` reachable from more than one side; slot objects in general. | Probe room had a one-sided PC. | Walk up to each lock in the first run. |
| R12 | Magic behaviour is reasoned from the operation config, not executed. | Config grep; `Magic.mjs:146-198`. | Paste each artefact into CyberChef with Magic (normal and intensive) and record the result in the walkthrough. |
| R7 | Long-delay timed hints | Not relied on. | none |
| R14 | Ghost's lines quoting m02. | The console offer happens on every m02 route (`m02 scenario.json.erb:1296-1311`), so "the last time I made you an offer" is true on every route; m02's "RECORDER OFFLINE" monitors and "Tonight I have had it on you" support the camera line; "you never asked my name" holds on every route (N-m8). The camera count ("forty-one") is new; m02 gives no number. | npc-dialog-review checks every Ghost line against m02/m03, including the count. |
| R23 | The notepad's editable observations as a scratch pad (R2B-M4). | `notes-minigame.js:142-187`, `:524-560` (`saveObservationToNote`). | First run: paste into the tag's observations, close, reopen, reload; the text must survive. Fallback: tell the player to keep the pop-out CyberChef tab's Input as the scratch pad. |
| R24 | The Keyholder and HaX phone stories' routing (N1). | Design in section 8, from `phone-chat-minigame.js:435-447`, `phone-chat-conversation.js:587-610`. | `reopencheck.mjs` over states K1-K9 and H1-H6 once the ink exists (rule 17). |
| R25 | Does a phone NPC's `video-call` emit `conversation_closed:ghost` when it closes? | **Closed by code read (R3):** person-chat emits it in cleanup for every mode (`person-chat-minigame.js:1632-1641`); phone-chat emits it too, which is why the FN10 trigger is conditioned (R3-2). | Probe as part of the build's smoke run. |
| R26 | `onComplete.setGlobal` runs on the client only (N-m11; `objectives-manager.js:754-763`, `game.rb:1791-1801`). A crash between the relay opening and the next state sync could lose `relay_opened` or `warned_out_of_band` while the server keeps the task done. | Code read (R2-A). | Covered in-scenario by second routes to the same globals: reading `report.b64` sets `relay_opened` via `onRead` (which re-fires the call mapping, guarded by `!ghost_offer_made`), and reading `submission_accepted.txt` sets `warned_out_of_band`. The Keyholder `route` catch-up then works from the restored global. The real fix (apply `setGlobal` on the server) is an engine note for the user. |
| D2 | The server trusts the client's claimed unlock method (R2B-M1). | `game.rb:956-958` (objects), `:880-890` (doors). | **Decided by the user:** the engine fix (`unlock_method_matches_lock?`) is in the working tree, uncommitted; commit it before this scenario. Rule 4's converse (no `lockType` on unlocked containers) and rule 14 (`lockType` on every lock) keep this scenario consistent with it. |

## Appendix A: prompt drift

I worked through the stage prompts in `story_design/story_dev_prompts/` (00-06 in full; 07-09 skimmed for what the build needs). They were written for an older engine. Where they conflict with `README_scenario_design.md`, the engine or the brief, this design follows the current engine and the brief. Conflicts found:

| Prompt     | What it says                                                                                                                                                                        | What applies now                                                                                                                                                                                     | Source                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 00, 04, 09 | Hybrid VM architecture: one SecGen scenario per mission, flags submitted at a dead-drop terminal, `submit_flags` tasks                                                              | No VMs in this lab; every challenge is in the game and solvable in CyberChef                                                                                                                         | Brief, hard constraints                                      |
| 00, 04     | Objectives as `objectives[].aims[]` with `id` / `description` and tasks with `id`                                                                                                   | A flat `objectives` array of aims (`aimId`, `title`, `status`, `unlockCondition`, `tasks[]` with `taskId`, `type`, `targetX`)                                                                        | README "Objectives System"; m02                              |
| 04, 05, 07 | "Decode the whiteboard" completes via `#complete_task` when the player uses CyberChef                                                                                               | CyberChef in its iframe has no hook into the game. A decode is proved only by the lock it opens (`unlock_object` / `unlock_room` tasks)                                                              | `crypto-workstation.js`                                      |
| 07         | A CyberChef "workstation" written as an ink menu that decodes for the player                                                                                                        | The engine embeds real CyberChef v10.19.4; an ink menu that decodes for the player would remove the learning and would be a multiple-choice step                                                     | `crypto-workstation.js:14-28`; brief (no quizzes)            |
| 01, 02, 06 | Every mission states a body count ("42-85 casualties"), a villain monologue and casualty-projection documents                                                                       | A first-year lab, lighter and shorter. The stakes are HaX's location and a student's debts, and Ghost's m02 history carries the menace                                                               | Brief ("lighter and shorter"); AGENTS.md "Lab ... scenarios" |
| 02         | Villains "cannot be turned" and "will not cooperate"                                                                                                                                | Fine for Ghost, but this plot turns on Ghost trying to turn the *player*; Jordan is a small-time asset, not a true believer                                                                          | Brief (climax)                                               |
| 01         | Closing debrief via a phone NPC event                                                                                                                                               Open the debrief from a hidden person-chat via a global, as m01/m02 (R3-2: phone-chat *does* emit `conversation_closed:<npc>` on every close, which makes it a poor debrief trigger, not an impossible one)                                                                                     | README "Event mappings"; PASS2 lesson 31                     |
| 01         | Opening cutscene: `timedConversation` with `delay: 0`                                                                                                                               | Also needs `"waitForEvent": "game_loaded"`, or it fires under the title screen                                                                                                                       | README "Common bugs"                                         |
| 03, 07     | `#set_variable:x=y` tags; `Agent 0x99:` speaker prefix; `#speaker:agent_0x99`                                                                                                       | `#set_global:x:y`; the prefix must match a `displayName` exactly ("Agent HaX:"); phone contacts' lines take no prefix                                                                                | README "Ink"; ink best practices "prefix must match"         |
| 03         | Handler mapping on `item_picked_up:contingency_files` (an id) with `targetKnot`                                                                                                     | `item_picked_up` carries the item **type**; disambiguate with `data.itemId`. `targetKnot` on a phone NPC mapping doesn't work after the first open: use a global and a hub choice                    | README "Item identity", "Phone NPCs"                         |
| 06         | `"onPickup": "#set_variable:..."` as a string; a `lore_collected` counter                                                                                                           | `onPickup` / `onRead` are `{ "setVariable": { ... } }`; `setVariable` does no arithmetic, so use one boolean per item                                                                                | README "Object Field Reference", "Ink"                       |
| 07, 09     | Conversations end in `-> DONE`                                                                                                                                                      | Every exit is `#exit_conversation` then `-> hub`; ending a story shows "(End of conversation)" on re-talk                                                                                            | README "Ink"; PASS2 lesson 21                                |
| 05         | Grid units of 1.5 m, rooms 4x4 to 15x15 GU, 1 GU padding, rooms must overlap by 1 GU                                                                                                | 1 GU = 5x4 tiles; heights 2 + 4N; rooms are fixed Tiled templates from the schema enum; doors placed by the rules in README "Door Placement Rules"                                                   | README "Room Layout System"                                  |
| 05, 09     | Top-level `containers` array with `lock` objects, `drawer` / `whiteboard` / `document` types, notes with an `encoding` field, an "items registry", `event_triggers` with `ink_knot` | Objects live in `rooms[id].objects[]` with `locked` / `lockType` / `requires` and `contents`; types must be sprite names; NPC `eventMappings`; no encoding field (the text simply is the ciphertext) | README "Object Reference", "Container Objects"               |
| 05         | "RULE 1: keys before lockpick"                                                                                                                                                      | No lockpick in this lab, so the one key lock opens only with its key in normal play                                                                                                                                       | n/a                                                          |
| 09         | ERB helpers defined with `def` at the top of the template                                                                                                                           | Works, but defines methods on the shared `ScenarioBinding` class; this design uses lambdas with a `kh_` prefix                                                                                       | `mission.rb:108-110`; section 5                              |
| 07         | Phone handler hubs that grow a choice per topic                                                                                                                                     | A hub offers ten choices or fewer; this design routes field notes and hints through two sticky choices that follow progress                                                                          | README "Common bugs" (crowded hub)                           |
| 00         | "Each mission adds one or two in-game challenge types" (campaign progression)                                                                                                       | Standalone lab; it doesn't take kit from or give kit to the campaign (no lockpick, no RFID cloner)                                                                                                   | AGENTS.md "Kinds of game"                                    |

## Changes in v2

Each round-1 finding, and what v2 does with it. "A-" = `REVIEW_R1_A.md`, "B-" = `REVIEW_R1_B.md`, "P-" = `PROBE_RESULTS.md`, "D-" = `DECISIONS_LOG.md` / `DECISIONS_PENDING.md`. Generator and both verifiers were updated and re-run: **seeds 1-100, 100/100 pass both** (section 5).

### Blocker and majors

| Finding | What changed |
|---|---|
| B-B1 (CyberChef forgets on close) | Resolved by engine change D1 (user-approved, in progress). Tom teaches the pop-out tab anyway (section 2, rule 12); FN1 says where the button is (next to the ×, `show.html.erb:97`). R10 marked resolved. |
| A-M1 / B-M1 (library branch and Sidhu skippable) | Pigeonholes are now a password lock (L7) whose code is only in the Vigenère plaintext, **and** the AES IV moved from the tag into that plaintext. Locked contents never reach the client (`game.rb:1879`), and nothing can be guessed. Verified: no IV gives "Invalid IV length"; a guessed IV never gives the answer (100 seeds). FN8/FN9 offers moved to the pigeonholes opening. Section 4 "Why the library branch can no longer be skipped". |
| A-M2 (double-ending texts give the agent away) | Double and betrayal endings now get identical HaX texts; the truth comes in the debrief. Emoji removed from bad-news texts. |
| A-M3 / B-M3 (fallback channel hard to find and enter) | Starred "Comms discipline" note with the channel, format and location; token lower case in "word-digits" form; scoreboard framed with `postitNote`; smartscreen nudge after the offer; Cliffe's pre-decision line; task "Use the fallback channel (optional)". Section 8. |
| A-M4 (why send 0x00 into Ghost's own cell) | Briefing beat 3: the player raises it, and HaX states her gamble ("I'll take either"). Paid off when Ghost recognises them and closed in debrief beat 3. |
| A-M5 (briefing not outlined or wired) | New subsection with six beats and the m01 wiring (`timedConversation` + `waitForEvent: game_loaded` + `skipIfGlobal`, `briefing_played`, player phone in `startItemsInInventory`, `show_scenario_brief: once`). |
| A-M6 (no runtime contact rename) | "Keyholder" all game; Ghost names themselves on the video call (orchestrator decision). |
| A-M7 (hash note behind an optional conversation) | FN7 three ways: Sidhu, a desk copy in his office, and HaX when the Final Trial card is picked up (guarded by `fn07_had`). Same fallback for FN10 on `relay_opened`. |
| B-M2 (prose mixed into copyable ciphertext) | Build rule 3: copyable content is ciphertext only; titles in names, instructions in `observations`. The report is split into `report.b64`, `report.sha256`, `report.sig` (plus the public key). The verifier shows why (a header line garbles the Vigenère decode; a combined message fails RSA Verify). |
| B-M4 (about 85 minutes) | Accepted in part: Tom and Sidhu hand over five notes in person, notes are shorter, recipes name only typed fields, and D1 removes re-typing. New estimate 60-75; stopwatch blind playtest first; ordered cut list in Q3. **Rejected:** cutting L3 now (orchestrator: keep the basics; cuts wait for the timed playtest). |
| B-M5 (Ghost silent until the call) | Six static terminal lines on Trial completions and story beats, plus HaX's "I've read this voice before" beat. Section 8, "Ghost before the call". |
| B-M6 (memorable beats for the academics) | Tom: the pop-out line and the Magic line. Sidhu: "It verifies ... It does not tell you whether you should send it." Cliffe: the scoreboard line, and a smartscreen line after the decision. |

### Minors (reviewer A)

| Finding | What changed |
|---|---|
| A-m1 `room_IT` | `room_it` throughout. |
| A-m2 Byte Wall | `variables: []` set; footer gives the reading order. |
| A-m3 Vigenère key pointer | In `trial_vii.txt`'s observations; Ghost's Special Collections line backs it up. |
| A-m4 side aim spoils Megan | `loose_threads` story-gated on `megan_file_read`; the job-tape task is dropped. |
| A-m5 Megan line vs refusal | Her "do nothing" line branches on the ending. |
| A-m6 Megan request over the watched phone | HaX: "Not on this line. Leave it with me."; Ghost's "generous with bursaries" line. |
| A-m7 timeline wording | Section 1: say "St Catherine's", never "last month"; no references to later missions. |
| A-m8 PIN lockout wording | L2 nudge and Megan say it resets. |
| A-m9 emoji | Occasional, good news only. |
| A-m10 fallback behind a locked door | HaX: "any Hacktivity terminal; the only one in the building is in his workshop". |
| A-m11 late_warning, warn-then-refuse, "cover blown" | Condition `decision_made === true && ending === 'sent'`; every order covered; refusal framed as "a door shut". |
| A-m12 hub in the decision window | Climax rung "read it before you do anything with it"; video-call mapping guarded with `!globalVars.ghost_offer_made`; reopen routing via conditions in `start`. |
| A-m13 send choice reads as a menu label | `[Sending you my report now.]` |
| A-m14 silent transition | HaX on `open_drop_box`: "Brass. Old-fashioned. Someone wants you to knock." |
| A-m15 undeclared globals | Full list in section 8; rung counters are ink VARs. |
| A-m16 Act 3 time | Act 3 fallback added to the Q3 cut list. |
| A-m17 Ghost's motive | Rewritten in Ghost's "show your working" idiom. |
| A-m18 sequel hook vs m08 | Stated as lab-local, not campaign canon. |
| A-m19 phone claim scope | Scoped to today and the Keyholder device "in the same pocket". |
| A-m20 Sidhu's markers | Not used in the draft; flagged in the voice sample for the user (Q11). |
| A-m21 beacon realism | Now a one-pixel remote image (tracking pixel); the token is in its URL. |
| A-W1 to W7 | Withdrawn by the reviewer; no change. |

### Minors (reviewer B)

| Finding | What changed |
|---|---|
| B-m1 token the only upper-case answer | Token now lower case; the verifier asserts all ten answers are lower case and 50 characters or fewer. |
| B-m2 PIN length citation | Now `minigame-starters.js:534`. |
| B-m3 Byte Wall frame title | **Kept as is** (can't change without an engine edit); the inner header and footer carry the framing; Q14. |
| B-m4 template decor with text | `chalkboard2` and `smartscreen` are pinned scenario objects; check for doubles in the first render (R20). |
| B-m5 Base64 worked example | On the Trial V poster's observations and in FN4; "Hi!" → "SGkh" verified. |
| B-m6 Amount -6 first | FN5, the L6 recipe and rung 3 lead with -6. |
| B-m7 Vigenère key pointer | As A-m3. |
| B-m8 what a PEM is | Tom's README and FN4. |
| B-m9 SHA2 starts on 512 | Final Trial card, FN7 and rung 3 say "set Size to 256"; verified that 512 gives different first characters. |
| B-m10 "encrypts the hash" | FN10 now says "signs". |
| B-m11 look-alike early locks | Kept (answer shapes already vary); Ghost's lines give each a beat. |
| B-m12 pressure on "think about it" | "The relay closes when you leave the building. I don't." |
| B-m13 Ghost reacts to HaX helping Megan | As A-m6. |
| B-M3(c) no HaX hint during the climax | Partly **rejected**: HaX gets one generic climax rung (A-m12, "read it first"), because a stuck player otherwise gets a stale L10 hint. It still says nothing about the scoreboard, so B-M3(c)'s point stands. |

### Probes and decisions

| Item | What changed |
|---|---|
| P-R9 / R15 unlocked containers need `"locked": false` | Build rule 4; every container states `locked`. |
| P-R2 / D-E1 duplicate phone intro | Build rule 5: no `currentKnot` on the Keyholder, no `targetKnot` on its pickup mapping; re-entry by conditions in `start`. |
| D-E2 doubled terminal prompt | Build rule 6: no line starts with `>`. |
| P password length 50 | Build rule 7, asserted by the verifier. |
| P-R3 call pre-empts the auto-open | Build rule 9 and Ghost's closing line. |
| P text_file close returns to the room | Build rule 10 (accepted). |
| P one-sided PC reach | Build rule 11 / R22. |
| D-D1 CyberChef keeps state | Rule 12, R10. |
| D "Keyholder" all game; HaX texts match in the double ending; keep L3 | As above. |
| v1 R5 (concludeRequires) | Already resolved in v1; Q13 settled. |

## Changes in v3

Each round-2 finding, and what v3 does with it. "N-" = `REVIEW_R2_A.md`, "R2B-" = `REVIEW_R2_B.md`. The generator and both verifiers were updated and re-run: **seeds 1-120, 120/120 pass both**; the longest typed answer seen was 14 characters (section 5).

### Reviewer A

| Finding | What changed |
|---|---|
| N1 (Keyholder re-entry routing) | Section 8, "The Keyholder ink": a router knot used by `start` and at the top of every resting knot (`waiting`, `the_offer_again`, `closed`), a `relay_opened && !ghost_offer_made` catch-up, refuse guarded by `not decision_made` (in the choice and at the top of `refuse`), and a list of reopencheck states (K1-K9, H1-H6). Rule 5 corrected (a reopened phone doesn't run `start`); rule 17 adds the reopencheck run. |
| N2 (fallback note in a closable briefing) | The note is given on the briefing's **first line**; the written brief repeats the rule; HaX holds a copy (`comms_discipline_hax`) offered by a hub choice while `!comms_had`, plus one reminder text. `comms_had` is set by one mapping per note id. |
| N-m1 "11 characters" | Corrected to 14 (`peregrine-NNNN`) in section 4, rule 7 and R11; the verifier now reports the longest answer per game. |
| N-m2 texts stacking across events | New "Text schedule" table in section 8, with explicit delays; nudges and offers on the same event folded into one text; L3/L4 nudges moved to on request. Rule 16. |
| N-m3 "whichever route" needs one mapping per id | Rule 15; section 6 names the three `fn07_had` and two `fn10_had` mappings. |
| N-m4 device optional | HaX's L2 nudge asks for the device; the Keyholder `intro` has a late-pickup version; Ghost's watching line has a variant for a player who never took it. |
| N-m5 HaX's refused text | Now a check-in ("Your end's gone quiet. Talk to me.") plus a hub line `[I turned the Keyholder down.]`. |
| N-m6 unread globals | Globals table with a reader for each; `report_sent` dropped; `ghost_greeted` read by the offer; `report_read_claimed` read by the credits. |
| N-m7 Cliffe's hide trips the late-room check | Hide moved to his own `room_entered:common_room` mapping, conditioned on `workshop_open`. |
| N-m8 "you just listened" false for most m02 players | "At St Catherine's you never asked my name. Most people do. It's Ghost." |
| N-m9 bursary line too early | "Your handler's about to get generous with bursaries." |
| N-m10 debrief after a reload | `[I'm clear. Debrief me.]` is sticky and re-sets the global. |
| N-m11 `onComplete.setGlobal` client-only | Engine note in R26. Scenario cover: `report.b64`'s `onRead` sets `relay_opened` and `submission_accepted.txt`'s sets `warned_out_of_band`, as second routes. |
| N-m12 notes in containers need readable/takeable/text | Rule 13; section 3 preamble. |
| W1-W6 | Withdrawn by the reviewer; no change (W5 noted: both Cliffe NPCs share a `displayName`). |

### Reviewer B

| Finding | What changed |
|---|---|
| R2B-M1 (server trusts the claimed unlock method) | With the user as D2; not designed around. Removed the claims that locks "can't be bypassed" or the gate "can't be faked" (sections 3, 4, 7, Appendix A). The design now says answers and locked contents never reach the client, and that a console caller could currently open a lock without its answer. Mission-local part: rule 14 asserts every lock has a `lockType`, so `requires` is always stripped. |
| R2B-M2 (signature and hash checks fail for natural inputs) | `report.sha256` and `report.sig` observations say what was signed and name Message format Raw and SHA-256; FN10 says the same and why. The verifier now proves each trap (decoded text as Message, Message format Base64, SHA-1, trailing new line → "Verification Failure"; SHA-256 of the decoded text doesn't match). |
| R2B-M3 (tracking pixel never taught) | Planted on the foyer sign-up laptop ("CryptoSecure Mailer"), explained by Tom when asked about CryptoSecure, named in FN10, explained on every debrief route, and the URL now says `/px/locate/`. |
| R2B-M4 (carrying the IV, key and ciphertext) | The notepad's pencil is the scratch pad: Tom's line, FN1, Trial VII's observations, the L7/L8a rungs and the pigeonholes nudge, and the tag's "Key: ____ IV: ____". R23 probes that it survives a reload. |
| R2B-M5 (leaflet copy fails) | Leaflet text is the codes only; the fingerprint is in observations. Verified: the whole note text decodes. Rule 3 updated for notes. |
| R2B-M6 (driving CyberChef not written down) | FN1 has the three steps (Input, Search → Recipe, Output) and the pop-out button. |
| R2B-M7 (Sidhu's scene needs an unprompted walk) | Planted when he gives FN10; pointed at by `report.sig`'s observations; a past-tense line after the decision. |
| R2B-M8 (choice not hard) | Lever 2, pricing each route in Ghost's lines, plus HaX's workshop remark. Lever 1 (doubting the scoreboard) **rejected**: it would scare players off the best ending, undoing round 1's A-M3/B-M3 work, and would be a lie the debrief has to retract. Reasoning in section 8, "Why this lever". |
| R2B-M9 (play time) | With the user as D3. Act 3 friction fixes done (M2, M4, M6, plus SHA2 under AES); revised budget about 74 minutes (65-80) in section 1; Q3's cut list now waits on D3. |
| R2B-m1 HaX's m02 line inverted | "Ghost never saw your face. You saw theirs, near enough: a hood on a screen." Ghost's camera line shows HaX was wrong; the debrief admits it. |
| R2B-m2 L2 gives "IVTH", not junk | Section 4, FN2 and the L2 rung say so. |
| R2B-m3 "11 characters" | As N-m1. |
| R2B-m4 ASCII chart "starts there" | "Look them up on your ASCII chart." |
| R2B-m5 "returns trolley" | Plaintext now "The returns shelf has your next trial." (generator updated). |
| R2B-m6 "IV" met before FN8 | Trial VII's observations explain an IV in one sentence. |
| R2B-m7 hash details | FN7, the Final Trial card and the L10 rung: 256 bits = 64 hex digits, leave Rounds alone, add SHA2 under AES Decrypt (verified to give the answer). |
| R2B-m8 where the private key is | FN9's handler note. |
| R2B-m9 how Ghost had the public key | Tom's README: the public key is in the department directory. |
| R2B-m10 Tom and Sidhu pay-offs | Tom reacts to the Keyholder terminal in his lab and to CryptoSecure; credit lines for Tom and Sidhu. |
| R2B-m11 Ghost's recognition, callback, off-voice lines | Camera line (true to m02's recorders), the "last time I made you an offer" callback, and both off-voice lines rewritten. |
| R2B-m12 D1 status | Rule 12 and R10: implemented, uncommitted, must be committed first. |
| R2B-m13 small word pools | L1, L3, L4, L6 pools widened to 26 words each; pass8 pool to 10. |
| R2B-m14 debrief explains the pixel | One plain line on every route. |
| R2B story notes (orchestrator) | Tom reacts to the terminal and CryptoSecure; HaX's m02 line fixed; two Ghost lines fixed; Ghost recognises 0x00 through the cameras, as in m02. |

## Changes in v4

Round 3 (`REVIEW_R3.md`, "ready to build with these small fixes") and the user's decisions on D2 and D3.

| Finding | What changed |
|---|---|
| R3-1 (call rewrites `ghost.currentKnot`) | `the_offer`'s first line routes away once the offer is made; `~ ghost_greeted = true` in `start`; the device's pickup auto-open mapping conditioned on `!globalVars.relay_opened`; reopencheck state K10; rule 5 reworded. |
| R3-2 (FN10 trigger) | One trigger: `conversation_closed:ghost`, `onceOnly`, `ghost_offer_made === true && !fn10_had`. Appendix A row corrected. |
| R3-3 (declared VARs) | Listed in section 8. |
| R3-4 (`the_offer` in two modes) | Exits for every choice in both modes; call-only lines gated on `on_call`, set by a `the_offer_call` entry knot. |
| R3-5 (`relay_opened` re-emits) | Rule 18; music switch `onceOnly` and guarded. |
| R3-6 (debrief camera line) | Reworded to stand alone: "I bet Ghost never saw your face at St Catherine's. I lost." |
| R3-7 (NO SIGNAL) | Ghost adds "Your monitors said no signal. Mine didn't." |
| R3-8 (D2/D3 pending) | Marked decided in the status line, section 1, section 4, section 7, Q3 and the risk table. |
| R3-9 (unlocked containers) | Rule 4 converse: `locked: false` and no `lockType`/`requires`. |
| R3-10 (object ids) | New "Object ids" list in section 3; the workshop door's `requires`/`keyPins`. |
| R3-11 (verifier run note) | Rule 19 and a note at the top of `tools/verify_cyberchef.mjs`. |
| R3-12 (Comms reminder over the watched line) | After `lockbox_open`, HaX points at the brief and sends no note. `comms_had` set by each note's `onPickup`. |
| D2, D3 | Decided by the user; see the status line. |

### Build notes (v4 build, deviations from the design text)

The build follows sections 3-9 except where these say otherwise. Each is mission-local.

| Where | Design said | Built | Why |
|---|---|---|---|
| Lab board | `chalkboard2` pinned over the template's | `whiteboard2` "Dr Shaw's Whiteboard" at (8.0, 5.5) | Avoids a doubled sprite (R20) with the same text. |
| Workshop screen | `smartscreen` | `info_screen1` at (1.1, 2.4), with the same `observationVariants`; the soldering iron moved into its text | Same reason; the template already draws a smartscreen. |
| Workshop decor | `it_workbench1`, `server_rack1`, `kvm_cart1` | dropped | The workbench sat across the only path from the south door (R22). |
| Positions | section 3 pins | foyer exhibits moved to the open floor (Byte Wall 4.0,4.4; plaque 5.4,4.4; ASCII chart 2.6,4.6; tape 7.0,4.6; poster 8.6,4.4); directory 7.2,4.6; Sidhu 3.4,4.8 with his whiteboard at 1.0,4.6; Cliffe (workshop) 2.9,7.2; scoreboard 1.1,7.6 | Smoke run 1576 found the foyer pins walling the player in by the west door; the others were the same pattern on inspection (PROBE_RESULTS "Build smoke run"). |
| Loose Threads aim | `unlockCondition.globalVariable` alone | plus a HaX mapping `global_variable_changed:megan_file_read` → `unlockAim: loose_threads` | Probe R21: a global-gated aim stays `locked` until something unlocks it (m05 pattern). |
| `comms_had`, `fn07_had`, `fn10_had` | one mapping per note id | each note's own `onPickup.setVariable` | R3 note 9; probe R19 confirmed `onPickup` fires on an NPC hand-over. |
| `fnXX_sent` | scenario globals | ink-local VARs in HaX's story | Only HaX reads them. |
| Music on `relay_opened` | `onceOnly` | condition only (`!globalVars.decision_made`) | The music system has no `onceOnly`; a repeat switch to the playlist already playing is harmless. |
| `decide_about_megan` | completed on `megan_choice_made` | as designed, by a HaX mapping | (was missing from the first draft of the build) |
| `validSprites` | not in the design | kept from m01 | The validator warns it's unknown to the schema; m01 uses it. |
| Debrief | the cameras line | "I bet Ghost never saw your face at St Catherine's. I lost." | R3-6 |

Validator, final: 0 errors, 7 warnings, all deliberate:
- `validSprites` (m01 pattern);
- two HaX mappings on `open_pigeonholes` (the FN9 and FN8 offers, 6 s apart, meant to both fire);
- `concludeRequires` names a non-flag task (design decision Q13: the relay terminal proves the whole chain);
- the Keyholder pickup mapping has "no visible effect" (it opens the phone chat, which is the effect);
- the debrief cutscene mapping has no `onceOnly` (N-m10: the sticky debrief choice must be able to reopen it after a reload);
- two "multiple solution paths" warnings for the pigeonholes and the drop box, which are AND gates, marked with `puzzle_graph_and_with`.

The 29 suggestions are VM, RFID, hostile-NPC and patrol prompts that don't apply to a lab; `onPickup` on hand-over notes (intended: the global means "has the note"); and graph metadata on items inside containers whose container already carries the edge (adding it there creates duplicate-path warnings).

### Fix round 1 (after REVIEW_IMPL, DIALOGUE_REVIEW, PUZZLE_PLAN Phase A, PLAYTEST_P1-P3)

Decisions in `DECISIONS_LOG.md` (2026-10-06, user and orchestrator) were applied first and override the reviewers. Two structural additions:

- **`ghost_offer_heard` (new global).** `ghost_offer_made` is still set on the offer's first line (the call has happened; HaX's send and warn choices appear). `ghost_offer_heard` is set only on its last line ("Send it and you start Monday."). Ghost's router, `the_offer_call` and `the_offer` now guard on `ghost_offer_heard`, so a call closed early leaves the device to deliver the whole offer. It has to be a global: the device restores its own saved story (`phone-chat-minigame.js:427-436`), so an ink-local set during the call never reaches it. A Ghost text on `conversation_closed:ghost` ("You closed the call. I'll say it here instead.") sends the player to the device.
- **`parked` (ink-local, Ghost and HaX).** Phone chat shows every line up to the next choices, so a farewell after `#exit_conversation` was followed by the resting knot's greeting ("Back. So you've decided." after "I'll think about it"). The exits set `parked`; the resting knot skips its greeting once. On the call the exit tag now sits on the farewell line itself, so person-chat closes there.

#### Findings mapped to changes

**From DECISIONS_LOG (applied as instructed)**

| Decision | Change |
|---|---|
| Coffee sign | "Wash your mug. The sink is not a cupboard." |
| Tom's intro | "Right then. You'll be one of mine. Tom Shaw. I look after the first-years this week." |
| Cliffe's idiom | Kept: "G'day", both "Reckon", "mate", "No worries" unchanged. |
| Ghost's prices back in the offer (REVIEW_IMPL M3) | `offer_terms` now ends with the three prices, unprompted, and "So does she." is back (not when Megan was warned). `[What happens if I say no?]` is removed because it would only repeat them. |
| One fix for send-then-warn (REVIEW_IMPL M2, DIALOGUE M2, P3 m2) | `opening_sent`: with `late_warning`, HaX says "Your flag reached me after the report did. You tried. It was already open." and the "Did you read it?" question is skipped (`report_read_claimed` set to `read`). Dead branch in `opening_double` removed. New credit "REPORT: Read, sent, then flagged. Too late."; "Read, and sent." is suppressed on that route. |
| Tom's placeholder sprite (P1 finding 11) | **Not changed: the premise was wrong.** Tom already uses `male_office_worker_v2` (white shirt, tie). The hooded figure in P1's `03-lab.png` stands at the whiteboard and matches the HUD portrait: it is the player (`female_hacker_hood_v2`, the m01 default; `validSprites` offers hood variants). P1 finding 1 ("coordinates looked mirrored") is the same mix-up. Confirmed on screen in the fix-round browser check. |
| FN9 before FN8 (REVIEW_IMPL m5) | `send_field_note` and `field_note_waiting()` check FN9 before FN8. |
| P4 waits for the timed blind run | Not done. |

**REVIEW_IMPL.md**

| Id | Change |
|---|---|
| M1 | `parked` skip (above). The call's `[I'll think about it.]` closes on "Your terminal's still open…"; the device's `[Still thinking.]` replies "Take as long as the building gives you."; `[Close the device.]` replies "DEVICE IDLE." in `waiting` and `closed`. kstates K5, K13-K15. |
| M2 | See the DECISIONS_LOG table (send-then-warn). |
| M3 | See the DECISIONS_LOG table (prices). kstates K16, K17. |
| m1 | HaX's hub greets "Go ahead." after a decision (the "I'm here. Careful…" line stays between the offer and the decision). Replies that answer a decision ("Copy.", "Understood.", "On my way to you.", the refusal report) skip the greeting. "Call me when you're clear." stays only in the blown-route timed text. kstates H8, H9. |
| m2 | "And you sent me the token." ("first" dropped). |
| m3 | Debrief declares `ghost_greeted`; never taken: "We're replacing your phone anyway. Ghost had the building's network all week." |
| m4 | Sidhu branches on `fn07_had`: "Take this. It is on signatures…" |
| m5 | Done (FN9 first). kstates H7. |
| m6 | Tom's greeting: "Well? Got into that terminal yet?" while it's locked, "You got into it, then. Good. I'm still not ordering one." until the corridor opens, then "Owt else?". |
| m7 | Megan: new `corridor_open` greeting "Still on Trial III. Don't tell me how. I want to get it myself." |
| m8 | Ghost at `pigeonholes_open`: "Your envelope's waiting. Only one key opens it." |
| m9 | Refusal: the exit tag sits on "CONTACT CLOSED."; `closed` skips "NO CARRIER." once. kstates K7. |
| m10 | Rows added below ("Deviations recorded in fix round 1"). |
| m11 | `[I'll read it. Go on.]` (chosen over the dialogue review's `[Got it. Go on.]` because HaX has just asked the player to read the note). |

**DIALOGUE_REVIEW.md**

| Id | Change |
|---|---|
| M1 | "I told you at St Catherine's: no name. That hasn't changed. You can call me what your handler does: Ghost." |
| M2 | As REVIEW_IMPL M2. |
| M3 | Paper tape rows redrawn: `○ ● ○ ○ ● ○ ○ ○` and `○ ● ○ ○ ● ○ ○ ●`. |
| M4 | As REVIEW_IMPL m3. |
| M5 | Every spoken line in `npc_tom`, `npc_sidhu`, `npc_cliffe`, `npc_megan` and `npc_jordan` now carries its `displayName` prefix (79 lines). dialoguelint then saw them for the first time and flagged two long lines (Tom's Mailer line, Ghost's refusal), both split. |
| M6 | All three HaX voice styles start with the voice bible's identity part, word for word (m01 form, with the em dash), then the scene sentence. |
| M7 | Sidhu: "It verifies against the Keyholder's key. So the Keyholder signed it, whatever the FROM line says, and nobody has touched it since." |
| M8 | Double: "Congratulations. You now work for both of us. Only one of us knows." Sent (new knot `sent_cost`, every sent path): "Ghost thinks you're theirs now. I'm meant to wonder too. I'm trying not to." |
| M9 | Intro (late): "You left this in my box for most of the Trials. I watched all of them." (the review's "three Trials" undercounts: the device sits in the box from Trial I to at least Trial VI). Special Collections: "A key word, then a key pair. Fewer than twenty of you will see the second." Refusal: "Noted. Two hundred and twelve picked up a card, and you're the first to say no to me." / "I'll put you in the column for it." |
| Choices | `[Walk me through the board?]`; `[That signed report. I've made my choice.]`; Tom's `[Thanks. I'll get on.]` (which didn't exit) is now `[Thanks. Anything else I should know?]`, which leads into P3's key-pair line. |
| Briefing | "That's classified. Next." first, "That's classified too." second. `[Ransomware Incorporated. Ghost's people.]` gets "Yes. Ghost's. St Catherine's was theirs." and skips the explanation (new knot `ghost_known`). "Dr Cliffe Schreuders" in speech; the displayName keeps "Z.". |
| Repeating greetings | Jordan and Cliffe cycle through three greetings (`{&…}`); Ghost's "Still watching." alternates with "Two hundred and twelve candidates. I'd rather watch you than most of them."; Ghost's `[Who are you?]` is once-only. |
| Same fact twice | HaX's "Received." in `send_report` is now "Copy." |
| HaX register | Acknowledgements gain a clause: "Public keys. Yours locks, the private one opens. Sent.", "AES. Same key both ends. Sent.", "Hashes. Fingerprints, not locks. Sent."; "mind" removed from the blown debrief; "Sit down, Agent." |
| Stale lines | Megan, warned: "Binned the leaflet. Still skint, mind. Worth it." (the tags now ride on "I'm out…", not on the next greeting). Ghost intro: "…The rest get harder." Cliffe workshop: "The building. Bit further along than this morning." "monitors" → "CCTV screens". |
| Debrief | Blown no longer gets "A clean no": "Next time, the scoreboard. It's why it's there." or, with the token sent too, "The scoreboard was enough. The phone call was one call too many." Both questions are once-only (`*`). |
| Teaching | FN6: "can encrypt differently each time"; "any letters before it, such as a heading, knock the key out of step". FN9: "For encryption, it only locks." Sidhu: "That is the start of how good systems store passwords. / They add salt and a slow hash, but that is another lecture." Ghost's drop-box text: "It's how we locked forty companies last year." |
| Megan | "My mam's care-home fees are two months behind." Jordan: "to be fair" for "mind". |
| Rejected | Cliffe's accent density ("drop G'day and one Reckon"): rejected, user decision to keep the idiom. Sidhu's optional "every second paper I review" line: not taken, it's optional and his hash answer is already three lines. "St Catherine's" and "Schreuders" pronunciation: can't be checked on the keyless :3001 server; left for the user's first listen when audio is cached. |

**PUZZLE_PLAN.md (Phase A)**

| Id | Change |
|---|---|
| P1 | L2 text: "Eight digits for a four-digit keypad. Odd. Bring the black box too…"; corridor text: "Not decimal, not hex, not binary. Something new on that wall. Field note on request." |
| P2 | HaX's Special Collections text removed; the mapping keeps `onceOnly` and `fn06_offered`. |
| P3 | Tom's hub greeting, once (ink-local `told_keys`): "Your lab account's on that PC. I've put a key pair on it. Have a read of the README; you'll want the private one before the week's out." `lab_account_pc` observations add "Dr Shaw's README is on it." |
| P5 | "Brass. Old-fashioned. The workshop's north. Schreuders' door." Door sign and directory keep "(knock)". |
| P6 | "Special Collections. Fourteen left. The key to the next one…" |
| P7 | FN1 step 1: "Copy the code, never retype it: in a note, drag across the text and press Ctrl+C (Cmd+C on a Mac); files have a Copy button. Paste into Input (top right)." |
| P4 | Not done: waits for the timed blind playtest (orchestrator decision). |

**PLAYTEST_P1.md**

| # | Change or rejection |
|---|---|
| 1 | Rejected as a game fault. The "mirrored" layout is the player/Tom mix-up (see Tom's sprite above): Tom is the white-shirted figure below the desks, next to his whiteboard. `moveToNear` stopping short is a harness pathing limit P2 also hit on other targets (P2 finding P4). |
| 2 | Rejected: by design. The Comms note is the out-of-band channel and has to arrive before the phone is compromised (N2, R3-12). Knowing the channel early doesn't give the double route away: the token only exists inside the decoded report. |
| 3, 4 | Engine behaviour, logged by the orchestrator as E4/E5. FN1 and Tom already point at the notepad pencil as the place to keep anything needed later. |
| 5 | HaX's "Read it as characters" removed (P1). The noticeboard and Megan stay: they are the designed in-room teaching (PUZZLE_PLAN F1, DIALOGUE section 4). The CyberChef error text is CyberChef's own; FN2 and ladder rung 3 already say to put a space after every two digits. |
| 6 | `[Who are you?]` is once-only, so it no longer loops. The late opening is engine timing: the pickup mapping has no delay, and the chat opens once the container minigame has closed. Not changed. |
| 7 | Harness note; no change. |
| 8 | Walkthrough step 1 now says the briefing closes by itself after "…Then go and be found." |
| 9 | The corridor text is P1's new string. Ghost's Trial IV line fires 2 s after L4 opens; it landed during Trial V only because the run moved on quickly and the toasts queued. Not changed. |
| 10 | `trial_iv.hex` is a text file with a Copy button; P7 now says so in FN1. Not changed otherwise. |
| 11 | See the DECISIONS_LOG table (premise wrong, no change). |

**PLAYTEST_P2.md**

| # | Change or rejection |
|---|---|
| P1, P2 | P7 (copy, never retype) in FN1. |
| P3-P5 | Harness notes; no change. |

**PLAYTEST_P3.md**

| # | Change or rejection |
|---|---|
| M1 | `ghost_offer_heard` (above), plus Ghost's "You closed the call. I'll say it here instead." text. kstates K11, K12, K12b. |
| M2 | As DIALOGUE "Debrief": no "clean no" on `blown`. |
| m1 | HaX's FN10 offer on `conversation_closed:ghost` now also needs `decision_made !== true`, and its delay is 6 s (validator: 4.5 s clear of Ghost's new 1.5 s text). A decision made within those 6 s can still be followed by the offer, because a timed text can't re-check its condition on delivery. Accepted. |
| m2 | See the DECISIONS_LOG table (send-then-warn). |
| m3 | Rejected. The pixel explanation is what HaX would tell any agent about the trap, and it's true on every route. "You can read Base64 now" is true for every player, because L5 and L6 both need Base64. |
| m4 | Sidhu's signed-report choice and his "holding a document" greeting hide after the scene (ink-local `checked_report`). |
| m5 | Engine (E5). |
| m6 | `returnsToContainer` on text files is shared engine or harness behaviour, not mission-local. Reported, not changed. |
| m7 | As P1 finding 6. |
| m8 | Harness. |
| m9 | Not rechecked this round (see the browser check notes). |

#### Deviations recorded in fix round 1 (REVIEW_IMPL m10)

| Where | Design said | Built | Why |
|---|---|---|---|
| FN7 fallback text | 2 s after the Final Trial Card | 12 s | Clears the drop-box texts (Ghost 7 s, HaX 1.5 s); the smoke run still stacked four at speed. |
| Hint ladder | separate steps for L8a and L8b | one step, `l8`, whose rungs walk through both | Both locks open from the same corridor visit; one ladder avoids a step change halfway through. |
| Double-route sequel hook | a message on the Keyholder device a week later | a credits line on `ending === 'double'`: "A week later, on the Keyholder device: \"Term's started. So have you.\"" | The game ends at the debrief, so a "week later" text can only live in the credits. |
| Ghost's offer hub | not in the design | the build's `[What happens if I say no?]` removed in this round | The prices are back in the offer itself (M3). |
| HaX post-decision greeting | "Call me when you're clear." | "Go ahead." | REVIEW_IMPL m1. |

#### Checks after fix round 1 (evidence in `build_evidence/fix1/`)

- Ink compile: 9/9. `tagdiff.mjs` against HEAD: 125 structural differences, every one from the changes above. Ghost: `ghost_offer_heard` and `parked`; the `waiting_choices` stitch, so the greeting skip can jump to the choices; removed `[What happens if I say no?]`; the router's `relay_opened or ghost_offer_made`. HaX: `parked`, FN9/FN8 order. Debrief: `sent_cost`, the `late_warning`, `blown` and `ghost_greeted` branches, once-only questions. Briefing: `ghost_known`. Tom: `told_keys` and the greeting conditions. Sidhu: `checked_report` and the `fn07_had` branch. Megan: the `corridor_open` greeting. The snapshot taken before the rewrite is in the builder scratch folder (`fix1_snapshot/`).
- The first reopencheck run on the new Ghost ink never finished. With `ghost_offer_made` true, `relay_opened` false and `ghost_offer_heard` false (a state play can't reach, but reopencheck sets globals at random), `waiting` and `route` diverted to each other forever. The router now sends `relay_opened or ghost_offer_made` to `the_offer`. Re-run: 1800 reopens per phone, 0 problems.
- Validator: 0 errors, the same 7 deliberate warnings, 29 suggestions. The new Ghost text first raised a stacking warning against HaX's FN10 offer; that offer moved from 2 s to 6 s.
- dialoguelint: no findings, now covering all nine files (the person-chat files were invisible to it before M5).
- inkcheck 11/11. loopcheck 30/30: the build's 21 states plus the debrief on `sent` + `late_warning`, `sent` + no device, `blown` + token and `double`; Ghost on `route` with the call closed early, `the_offer_again` and `closed`; Megan warned; Tom after asking about the terminal.
- kstates 28/28: K1-K10b and H1-H6 updated for the new global, plus K11, K12 and K12b (call closed at its first line: the device delivers the whole offer and sets `ghost_offer_heard`), K13-K15 (exit lines), K16 and K17 (prices with and without Megan warned), H7 (FN9 first), H8 and H9 (no greeting after "Copy.").
- Door alignment 6/6. Rendered seeds 5, 77 and 2026: both verifiers ALL PASS. The paper tape renders with the corrected rows.

**Browser check (:3001, keyless; game 1585, setup typed from the DB, "exercised, not earned"; game 1586 for the lab).** Run before the router fix above, which only changes a state play can't reach.

- Call closed early: the call opened on `relay_opened`, and End Conversation was clicked on its second line. Then `ghost_offer_made` was true and `ghost_offer_heard` false. Ghost's thread got "You closed the call. I'll say it here instead." Opening the device showed "CONTACT RESUMED.", the whole offer with the three prices ("…a third offer." / "Send it and you start Monday. So does she.") and the `offer_hub` choices; `ghost_offer_heard` was then true (`fix1-01`, `fix1-02`).
- Exit lines on the device: the setup's early `[Close the device.]` shows "DEVICE IDLE." with no "Still watching." after it. `[I'll think about it.]` ends on "Your terminal's still open. Read what I gave you." and the device closes, with no "Back. So you've decided." On reopen, `[Still thinking.]` gives "Take as long as the building gives you." and closes (`fix1-03`, `fix1-04`).
- Send, then warn: HaX's hub answered "Copy." with no greeting after it (`fix1-05`). The scoreboard accepted the token after sending: `late_warning` true, `ending` still `sent`. The debrief had no "Did you read it?" and gave "Your flag reached me after the report did. You tried. It was already open." then "Ghost thinks you're theirs now…" (`fix1-06`). Credits: "REPORT: Read, sent, then flagged. Too late.", without "Read, and sent." (`fix1-07`). Game status `completed`.
- Tom: in a fresh game the player enters the lab as the hooded figure (the HUD portrait), and Tom is the white-shirted figure below the desks (`fix1-08`). A pointer click below the desks walks round to him (the engine pathfinds), and the conversation then plays the new intro and, after the first choice, the key-pair line once. The harness's `moveToNear` uses a straight keyboard walk near interactables, which is why P1 and this run's setup stalled at the desk row.
- Not covered in the browser: refusing on the call (kstates K7 covers the "CONTACT CLOSED." exit), the blown and double debriefs (loopcheck), P3 m9 (Cliffe hiding in the common room).

### Fix round 2 (after REVIEW_FIX1, PLAYTEST_BLIND, PLAYTEST_P2B)

| Id | Change or rejection |
|---|---|
| REVIEW_FIX1 m1 | `send_says_go` sets `parked` and closes on "Then send it…", so "Back. So you've decided." no longer follows. kstates K18. |
| REVIEW_FIX1 m2 | Refusal branches on `megan_choice == "warned"`: "Noted. The second this week. Miss Oyelaran at least had the excuse of a conscience." kstates K19, K20. |
| REVIEW_FIX1 m3 | FN10: "A signature proves which key signed something, and that nothing has changed since. Whose key that is, and what the text claims, are separate questions." |
| REVIEW_FIX1 m4 | Briefing: the first choice is labelled `(asked_reach)`, and the Cliffe answer is "That's classified{start.asked_reach: too}." Traced both routes in inkjs: "classified" first, "too" second, either way. |
| REVIEW_FIX1 m5 | Jordan: "They ask some odd questions, though." |
| BLIND B1/B2 | Three pointers to the leaflet. The lockbox (its text shows on the password screen): "…The word that opens it is spelled out in numbers on the leaflet Jordan gave you: open the Notepad in your inventory, page to \"Keyholder Leaflet\" and decode them." Jordan: "Here, leaflet. It's in your notepad now…" / "See the numbers on it? They spell a word. Type the word into the lockbox and you're in the Trials." HaX's 1.5 s text: "Jordan's leaflet is in your notepad. Each number on it is one letter of the lockbox word…". The leaflet is a notepad page only; it doesn't appear on the inventory bar (checked in game 1589), so the text points at the Notepad. |
| BLIND B3 | Tom's narrator line drops "with a stack of handouts on top"; Tom: "I've put the induction handouts in your notepad. It's got a pencil on every page. Write down owt you'll need later in there." |
| BLIND B4 | FN2 adds "CyberChef can't guess where one code ends. Type a space between the codes in Input yourself: 52535455 becomes 52 53 54 55." Ladder l2 rung 3: "In CyberChef's Input, type a space between each pair of digits, then From Decimal." |
| BLIND B6 | Rejected: by design. It's the player's own key pair on their own lab account. The README says it's for later, the key opens nothing until the envelope turns up in the pigeonholes, and the minute-five-to-minute-45 return is the hybrid-encryption lesson (PUZZLE_PLAN section 6, withdrawn alternatives). |
| BLIND B7 | Not a bug. The notepad shows one page at a time with Previous and Next and a page counter ("1 / 4" in game 1589). At that point its pages are the Notepad cover, Mission Brief and Comms Discipline, which is the "3". |
| P2B B3 | Every text_file holding a code (trial_iv.hex, trial_vii.txt, the four pigeonholes, private_key.pem, public_key.pem, job_0412.hex, report.b64, report.sha256, report.sig, keyholder_public.pem) now says: "For the code itself, use the file's Copy button, not Add to Notepad: that adds a header and footer CyberChef will try to decode." trial_vii.txt says it in its own words and no longer says "Keep everything it tells you". FN1 and FN6 say the same. FN1's and Tom's "paste anything" became "write down". Ladder l7 rung 3: "Copy the ciphertext with the file's Copy button, not Add to Notepad." The wrapper itself is engine behaviour (E6), not changed. |
| P2B B4 | Whiteboard rewritten as one sentence per block: "Block 4, the last entry, holds the data \"<word>\" (prev e21d, hash 51a8)." It reads correctly even when the examine dialog drops the line breaks (checked in game 1590). `genesis` is out of the key pool (now ledger, merkle, nonce, tally, anchor, witness), because block 1 holds "genesis-0". |
| P2B B5 | Engine-side for a true fix. The password and container minigames both print the raw `observations`; only the world examine honours `observationVariants`. Mitigated in the scenario: the lockbox, safe, pigeonholes and drop box now have one text that is true locked or open ("…with a password pad"; "Porter's pigeonholes behind a coded door…"). |
| P2B B7 | Generated plaintexts reworded so no answer is followed by punctuation. L5: "The returns shelf has your next trial. Library keypad: NNNN". L7: "Yours is pigeonhole number <n>. Your envelope is sealed to your public key. The IV for the drop box is <iv> and the pigeonholes open with <code>". L1-L4, L6, L8 and L10 already ended on the answer. The report's pixel URL is now `/px/locate/<token>/1x1.png`, so the token is no longer glued to ".png"; it still sits between two slashes, because a URL needs delimiters. FN1 adds step 4: "Answers are exact: type them as they come out, lower case, with no full stop after them." `tools/generate.rb` and all four verifiers updated; the L5 and L7 regexes are anchored to the end of the text, so a trailing full stop would now fail the sweep. |
| P2B B9 | FN5 now uses a shift of 3 as its example (-3 undoes it, and the `tr` line matches), names ROT13 as CyberChef's Caesar operation, and warns that searching "caesar" lists Caesar Box Cipher first, a different cipher. |
| P2B B2 | Already covered by P7 (FN1 copy advice). |
| P2B B6, BLIND B8/B9/B10/B5, P2B B1/B8 | Engine (reload, E4/E5) or harness notes, or positive notes; no change. |

**Checks** (`build_evidence/fix2/`): ink compile 9/9; tagdiff vs HEAD 8 structural differences (briefing label and condition; Ghost's `send_says_go` exit and `parked`, refusal branch); validator 0 errors, the same 7 warnings; dialoguelint none; inkcheck 11/11; loopcheck 33/33 (adds `send_says_go`, refusal with Megan warned, briefing); kstates 31/31 (adds K18-K20); reopencheck 0 problems; rendered verifiers ALL PASS on seeds 1-60 (all six key words drawn), plus `generate.rb` seeds 3 and 42 through both design-time verifiers.

**Browser** (:3001; games 1589 and 1590, lock answers typed from the database up to the safe, then earned from there):
- Jordan's new lines and HaX's text arrived (1589). The lockbox's password screen shows the new pointer (1590, `fix2-01`). The notepad paginates "1 / 4" (`fix2-02`).
- The open safe shows the neutral text above its contents (`fix2-03`). trial_vii.txt shows the new observations. Its Copy button, with the clipboard captured in the page, copied exactly the ciphertext with no header (`fix2-04`).
- The ledger whiteboard's examine text in Sidhu's office showed the new one-sentence-per-block form with block 4's word quoted (`fix2-05`).
- The copied text pasted into the in-game CyberChef with Vigenère Decode and that word gave "…and the pigeonholes open with sorting-24" (`fix2-06`). Typing `sorting-24` opened the pigeonholes, which show the neutral text (`fix2-07`).

### Alignment round (ALIGNMENT_PLAN.md, with user decisions D7-D9)

D7-D9 (DECISIONS_LOG, 2026-10-06) override the plan where they differ. The canon note is §9 "Canon status".

| Id | Pri | Change or rejection |
|---|---|---|
| K1 | must | §9 "Canon status": ENTROPY never takes 0x00 on; the field HQ burn on sent; undated; St Catherine's; edit rules; recruiting cell note. The "Sequel hook" double entry is struck through. |
| X1 | must | Under D7 there is no double-agent hook, so "Hand in the device" is right on every route. The debrief keeps its `ghost_greeted` switch (hand in / "replacing your phone anyway"), and the double "A week later, on the Keyholder device…" credit is gone. Nothing now says Ghost uses the device later. kstates D-matrix: 14 cases (4 endings × device taken or not × token sent or not; sent also × late warning). |
| D7 | user | Ghost withdraws the studentship on every route. On sent and double, a Ghost text 14 s after the decision: "Opened. Thank you, Candidate. That was the last Trial. The studentship is withdrawn: anyone a handler can send, a handler can recall." Ghost doesn't trust anyone a handler sent, so the reason holds whether or not Ghost knows about the decoy. Blown: "I did say it listens. The studentship is withdrawn." Refused: the player said no. Debrief, sent: "Ghost withdrew the studentship this morning. They had what they wanted, and it was never you." Debrief, double: "Ghost withdrew the studentship this morning anyway. They don't keep anyone a handler sent. Today, take that as a compliment." Removed: "Congratulations. You now work for both of us…", "Ghost thinks you're theirs now…", "Ghost will ask again…". Credits: "KEYHOLDER: RECRUITED" became "KEYHOLDER: OFFER WITHDRAWN"; a new line on every route, "THE KEYHOLDER STUDENTSHIP: Never awarded." |
| D8 | user | "last year's Keyholders" became "earlier Keyholders" (briefing; Jordan's choice; Jordan's header comment), and S2 drops "last year". No dated claim remains in the ink or the ERB. |
| D9 | user (supersedes D1) | The briefing background is now `hq2` (the field HQ; m01 uses hq1; **replaced by `hq4` in the backgrounds round**). The debrief mapping is split: `ending !== 'sent'` uses `hq2`, `ending === 'sent'` uses `hq3` (now `hq4` and `hq5`, backgrounds round), the fallback site (pattern from m07/m08). Sent opening: "Sit down, Agent. Anywhere. This is the fallback site, and nothing in it is ours yet." / "I opened your report at the field HQ…" / "We were all out before midnight. Nobody's hurt." / "At four, someone went through the field HQ. The kit we couldn't carry, the cover it took years to build. All of it. We won't be going back." Credits: "THE FIELD HQ: Burned at four. Kit and cover lost. Nobody hurt." and "AGENT HaX: Working from the fallback site." replace "Location reached Ghost's server. Relocated." Double (D1's double half, kept): "Someone came to look at four. We have their photograph. The field HQ never showed up on anyone's screen."; credit "DECOY FLAT, LEEDS: One visitor at four. Photographed." The second debrief mapping adds a validator warning (no `onceOnly`), deliberate for the same reason as the first (N-m10). |
| S1 | should | Both "St Catherine's was theirs." lines in the briefing add "A hospital. Not everyone on the ward lived." |
| S2 | should | Ghost's drop-box text: "Hybrid encryption. Nine candidates got this far. It's how we locked forty companies. Hospitals pay fastest." |
| H1 | should | HaX hub, once, before the offer: `[The black box from the lockbox talks. It calls itself the Keyholder.]` gets "Then it's theirs. Keep it on you. A candidate who leaves it behind isn't a candidate." / "Whoever's on the other end wanted you to find it. That tells me they're patient." It doesn't say the device listens, doesn't name Ghost and doesn't mention the scoreboard. `ghost_greeted` is now declared in HaX's ink. kstates H10, H12. |
| H2 | should | HaX hub, once, after the candidate files: `[They keep files on the candidates. Who can't afford to say no.]` gets "That's how they pick everything. At St Catherine's it was a hospital that couldn't afford downtime." / "One of those files is probably you. I can't tell which, and that's the point." Placed above the Megan choice. kstates H11. |
| M1 | could, done | Megan, protected: "Student Services left me a voicemail. About my fees. Can't face it yet." |
| U1, U2, U3 | could, done | `relay_opened` pins "Cold Bond Circuit"; the credits pin "Hacktivity Neon"; two new music events return to `noir` on `decision_made` with `ending` refused or blown. |
| L1 | should | `labsheet.md`: "nothing to submit on the Hacktivity website: everything happens inside the game"; the 60-minute class advice (stop when the pigeonholes open, about 45 minutes in, and resume); the public key "for encryption it only locks (it also checks signatures, below)", matching FN9. Front matter and `==action:==` / `> Question:` formats are untouched. Operation names were cross-checked against FN1-FN11 and match. The three known source-sheet errors ("a-Z", "256", "as with symmetric keys") don't appear. |
| V1 | must | Quotes updated in TESTING_WALKTHROUGH (endings table, credits, backgrounds), SOLUTION_GUIDE (endings table, tutor rules) and DESIGN (§2 Jordan, §8 cover and drop-box text). |
| H3 | could, not done | It needs a new global shared by both phones, for one optional line. Left for the dialogue review together with C1/C2. |
| C1, C2 | could | Waiting for the scheduled npc-dialog-review, as instructed. |
| D1 | – | Superseded by D9. Its double half (the photograph) is used. |

**Checks** (`build_evidence/align/`):
- Ink compile 9/9.
- tagdiff before: STRUCTURE UNCHANGED. After: 17 structural differences, all from H1, H2 (the new HaX VARs, knots and choices), M1 (Megan's protected greeting) and the removed double "will ask again" condition.
- Validator: 0 errors, 11 warnings. One is new and deliberate (the second debrief mapping has no `onceOnly`). Three came from the room-dressing pass (`tableItems` and two foyer spacing warnings).
- dialoguelint: none.
- inkcheck 11/11, plus the briefing with `--no-memo`.
- loopcheck 40/40 (adds the HaX topics, Megan protected, and four debrief states).
- reopencheck: 0 problems.
- kstates 48/48: adds H10-H12 and a 14-case debrief matrix (4 endings × device taken or not × token sent or not, sent also with a late warning). It checks the burn and fallback lines, the withdrawal, the device line, and that no recruitment or double-agent line remains.
- Door alignment 6/6.
- Rendered verifiers on seeds 7, 101, 555, 2026 and 9001: ALL PASS.

**Browser** (:3001, games 1593-1596, one per ending; lock answers typed from the database, so exercised, not earned):
- Sent (1593): debrief background `hq3` (hq5 since the backgrounds round); the field HQ and four o'clock lines; the withdrawal. Ghost's device thread ends "Opened. Thank you, Candidate…". Credits: OFFER WITHDRAWN, FIELD HQ burned, fallback site, REPORT: Sent unread, Never awarded. My driver stalled at the "Did you read it?" question, so I finished this debrief by hand.
- Double (1594): background `hq2` (hq4 since the backgrounds round); the photograph and the withdrawal; the same Ghost text. Credits: OFFER WITHDRAWN, DECOY FLAT, Never awarded, and no "A week later" line.
- Refused (1595): background `hq2` (hq4 since the backgrounds round); "A clean no…". Credits: DECLINED, Never awarded.
- Blown (1596): background `hq2` (hq4 since the backgrounds round); "Next time, the scoreboard…"; Ghost's "I did say it listens. The studentship is withdrawn." Credits: DECLINED, Never awarded.
- All four games ended `completed`.
- Under load the setup closed the Keyholder chat before it opened, so `ghost_greeted` was false in all four. The browser therefore shows the never-taken device line ("replacing your phone anyway"); the device-taken line is covered by kstates.
- Each debrief's first one or two lines went by before the capture began; kstates checks them.

### Backgrounds round (hq4, hq5, miskatonic_campus; commit 8926df10)

| Item | Change |
|---|---|
| hq4 | The field HQ. Used by the briefing (`briefing_cutscene` `timedConversation.background`) and the normal debrief mapping (`ending !== 'sent'`). |
| hq5 | The fallback site after the burn. Used by the sent-ending debrief mapping (`ending === 'sent'`). |
| hq1-hq3 | No longer used anywhere in this lab; they belong to other missions. §9 "Canon status" now says so. ART_NEEDED, TESTING_WALKTHROUGH, SOLUTION_GUIDE and DESIGN §8 updated; the alignment-round evidence keeps its original values with "(now hq4/hq5)" notes. |
| Campus transition | New knot `campus` at the end of `opening_briefing.ink`. After HaX's "…Then go and be found.", the line `Background[assets/backgrounds/miskatonic_campus.png]:` switches the scene's background. Four `Narrator[player]:` lines follow, and `#exit_conversation` rides on the last one. |

**Mechanism, and why.** I used person-chat's own in-conversation background change (`parseBackgroundLine` and `changeBackground`, `person-chat-minigame.js:888`, `:1318`, `:1671`) inside the briefing itself. That gives three properties for free:

- **It plays once and survives a reload.** It is part of the briefing, which already has `skipIfGlobal: briefing_played` (set when the scene starts), so a reload after it, or during it, never replays it.
- **It keeps the opening flow.** The briefing's `waitForEvent: game_loaded` is unchanged.
- **Nothing races the Mission Brief popup.** The popup (`show_scenario_brief: "once"`) polls every 500 ms for an empty screen.

Rejected alternatives:

- **The m03 pattern**, a hidden narrator person-NPC launched on `conversation_closed:briefing_cutscene` (`m03_night_transition`). A mapping waits 500 ms before starting person-chat (`npc-manager.js` person-chat branch), and in that gap the Mission Brief popup can take the screen and then be ended by the new scene.
- **`transition_to_person_chat`.** It is a phone-to-person tag, it ends the current minigame as soon as its tags are processed, and person-chat processes tags before showing the line, so HaX's last line would be cut.

Plain `Narrator:` keeps the last speaker's portrait, which put HaX on the campus in the first browser run. `Narrator[player]:` shows the player there instead. It is a documented person-chat form (`person-chat-minigame.js:748`) and `player` is in the character index (`:121`). No engine change.

**Spoken lines added** (narrator voice, scenario top-level `narrator`, Algenib):
1. "Miskatonic University. Freshers' week."
2. "Bunting on the portico, music from the lawn, and a thousand new students trying to look as if they know where they're going."
3. "You join them. New lanyard, new tote bag, a timetable you haven't read. Nobody looks at you twice."
4. "The Computing building is through the columns. Someone has put a CryptoSecure stand right inside the door."

The `Background[...]:` line has no text after its colon, so the TTS batch skips it (`tts_batch_processor.rb` needs "Speaker: text").

**Checks** (`build_evidence/backgrounds/`):
- tagdiff: STRUCTURE UNCHANGED before; 6 differences after, all from the briefing's new `campus` knot (one knot, the exit tag moved, three diverts).
- Ink compile 9/9. Validator 0 errors and the same 11 warnings; it doesn't flag the `Background[...]` or `Narrator[player]` lines.
- dialoguelint none. inkcheck 11/11, plus the briefing with `--no-memo`. loopcheck 40/40, plus the briefing again after the `Narrator[player]` change.
- kstates 48/48. reopencheck 0 problems. Door alignment 6/6.
- Rendered seeds 11, 222 and 3333: both verifiers ALL PASS; a render carries hq4 twice and hq5 once.

**Browser** (:3001; games 1597 and 1598, briefing driven by hand rather than bootstrap):
- The briefing loads on hq4 (`bg-01`).
- The campus background loads (`miskatonic_campus.png`) and the narrator lines play over it (`bg-02`, the final `Narrator[player]` version, with the player's portrait).
- The Mission Brief popup opens straight after the scene (`bg-03a`); then the foyer arrival (`bg-03`).
- A reload right after the transition (1597) shows the title screen and then the foyer. No briefing or transition replays, and nothing opens within 10 s (`bg-04`).
- Sent ending (1598, lock answers typed from the database up to the relay): the debrief runs on hq5 (`bg-05`), with the burn, fallback and withdrawal lines and the credits (`bg-06`, `sent-1598.txt`). Game status `completed`.
- The fourth narrator line closes the scene the same way any closing line does: it is displayed, then the scene closes on the next advance. My driver clicked through it before a screenshot.

### Dialogue round 2 (DIALOGUE_REVIEW_R2.md)

| Id | Change or rejection |
|---|---|
| M1 | The m03 `hub_quiet` pattern in `npc_sidhu`, `npc_tom`, `npc_megan` and `npc_cliffe`.<br>• Each has an ink-local `VAR quiet`. Every topic knot that returns to a hub sets it on its last line: Sidhu `start`, `ledger`, `hash_for`, `signed_now`, `signed_after`; Tom `magic`, `terminal`, `cryptosecure`, `board`; Megan `trial_two`, `why`, `warn_her`; Cliffe `build`, `leaflets`, `workshop_build`.<br>• Each hub greeting checks `- quiet:` first and clears it. Cliffe has two hubs, `common_room` and `workshop_hub`.<br>• In Tom's hub, `- quiet:` comes after `- not told_keys:`, and that branch also clears `quiet`. So the key-pair line still plays after `magic`, and a stale flag can't swallow the greeting on his next visit.<br>• Jordan's prompt is left alone, as the review said. A reopened conversation still greets: the flag is spent on the same pass (kstates Q-cases; browser). |
| M2 | Ghost's prices:<br>• "Say no and you walk away, and Miss Oyelaran walks with you. I don't keep one without the other."<br>• Warned route: "You warned the Oyelaran girl. Sentimental. One candidate in two hundred and twelve, so I'll let it pass." / "Say no to me and you'll be the second this week." |
| M3 | Sidhu: "Come in, come in. I'm Sidhu. You must be one of the new first-years." "Schreuders" is left as it is; see the audio notes below. |
| m1, m4 | Ghost's opening:<br>• "You passed. All of them. I'd rather hoped you would."<br>• "St Catherine's had forty-one cameras. I switched off the recorders, not the cameras. Your screens said no signal. Mine didn't."<br>• "I watched you all night. You still walk like you're expecting a door to be locked." |
| m2 (C1) | "No name at St Catherine's, and no name now. The handle is Ghost. It's all you get." |
| m3 (C2) | "The last time I made you an offer, there was a ward forty feet away. This one's simpler." |
| m5 | Not changed. "CONTACT CLOSED." is the device's terminal text as well as the call's last line; see the audio notes below. |
| m6 | Debrief: "Ghost withdrew the studentship last night…" (sent and double). |
| m7 | "Assume they were. That's all the answer you get." |
| m8 | "The scoreboard was enough. The message on your phone was one too many." |
| m9 | "At four, someone went through the field HQ. Everything we couldn't carry is theirs now. We won't be going back." The credits keep "Kit and cover lost." |
| m10 | "Term starts Monday. Go to your lectures. Dr Shaw takes a register." |
| m11 | "…We'll keep an eye on her. You could have warned her." |
| m12 | Briefing: "Ghost never saw your face. You never saw theirs." |
| m13 (cut) | Tom's "Turn remote images off. Everyone should." removed. The debrief delivers that moral to everyone. |
| m14 (cut 4 to 3) | Sidhu's hash answer, so it no longer reads Field Note 7 aloud:<br>• "For noticing change. Any input, a short fingerprint out, and you cannot run it backwards."<br>• "Change one byte, even a new line you can't see, and you get a different fingerprint entirely. That's all my ledger is doing."<br>• "Good systems store passwords that way too, with salt and a slow hash. But that is another lecture." |
| m15 | Sidhu's contractions: "That's my whiteboard. It's from my blockchain lecture…" (drops "You were looking at…"); "That's the chain." He keeps "Let us be exact…" and "It does not tell you whether you should send it." |
| m16, m17 | Megan: "Still on the third one…"; "Alright?" for "Go on, then."; "…come back, though." |
| m18 | Jordan's exit: "Nice one. Tell your mates." |
| m19 | Rejected. "Pop it in your notepad" implies the player has to do something, but the leaflet is already in the notepad. "It's in your notepad now" is round 2's fix for blind-playtest B1/B2 (players couldn't find the leaflet), and it stays. |
| m20 | Cliffe: "Mm?" became "Yeah?". |
| m21, m22 | HaX hub (text only): `[That black device from the lockbox talks. It calls itself the Keyholder.]`; "Whoever's on the other end put it where a first-year would find it. They've done this before." |
| m23 | Ghost device (text only): "A key word, then a key pair. Fourteen of you. Fewer will see the second." |
| m24 (cut) | Tom's "You're past all that now, mind. Good." and its `corridor_open` block removed. |
| m25 | Rejected. "Miskatonic University. Monday morning." sits badly beside the debrief's "Term starts Monday", which would then read as the same day. The title card stays "Freshers' week." |
| H3 | Not built, as the review and the coordinator said. |

**Spoken-string diff** (voiced files only: briefing, debrief, the five person-chat files, Ghost's call knots): **27 changed, 0 added, 3 removed** (`build_evidence/dialogue_r2/spoken_diff.txt`). Text only, not counted: the HaX choice and reply (m21, m22) and the Ghost device line (m23).

#### Audio notes (generate these first)

- **"Schreuders", voiced twice.**
  - HaX in the briefing: "One more name. Dr Cliffe Schreuders. Builds Hacktivity. He'll know what you are within a minute of meeting you."
  - The narrator on Ghost's call: "Behind you, Dr Schreuders keeps soldering. He hasn't looked up."
  - Generate these two first and have Dr Schreuders listen. If the name is wrong, add a pronunciation note to the scene part of the briefing and narrator `style` strings (after HaX's identity part, which stays word for word). The narrator's fallback is "Behind you, the man at the bench keeps soldering."
- **"CONTACT CLOSED."** (Ghost on the call, refusal): listen once. If Gemini spells it out, write it in sentence case; the device shows it either way.
- **"Oyelaran" and "St Catherine's":** listen to one line of each.

**Checks** (`build_evidence/dialogue_r2/`):
- tagdiff: STRUCTURE UNCHANGED before; 31 differences after, all the `quiet` flag plus the removed `corridor_open` block in Tom's `board` (m24).
- Ink compile 9/9. Validator 0 errors, the same 11 warnings. dialoguelint: none.
- inkcheck 11/11. loopcheck 47/47 (adds Sidhu at first meeting and after the decision, Tom with the terminal asked and opened, Megan with the file read, Cliffe in both hubs).
- reopencheck: 0 problems.
- kstates 54/54. Updated for the new Ghost lines (K10a/b, K12b, K16, K17), with H10/H12 renamed for m22. New hub_quiet cases: Q-sidhu-signed, Q-sidhu-intro, Q-tom-terminal, Q-tom-magic-keys, Q-megan-warn, Q-cliffe-build. Each checks that no greeting follows the topic's last line and that a reopen still greets.
- Rendered seeds 17, 404 and 8080: ALL PASS.

**Browser** (:3001, game 1599, lock answers typed from the database to reach Sidhu):
- Tom: "What's CyberChef actually do?" plays the two Magic lines, then the key-pair line once. "Walk me through the board?" plays three lines, and the choices follow with no "Owt else?" (`dr2-tom-after-board.png`, `dr2-tom.txt`). Reopening greets with "Owt else?" (`dr2-tom-reopen.txt`).
- Sidhu: the introduction runs straight into the choices. The ledger and the new hash answer each end on their last line, with no "What can I do for you?" (`dr2-sidhu-after-ledger.png`, `dr2-sidhu-after-hash.png`, `dr2-sidhu.txt`). Reopening greets with "What can I do for you?" (`dr2-sidhu-reopen.png`).
