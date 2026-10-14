# core_09: Remote and mobile working

**Working game title:** On the Move
**Pitch:** Two days on the road with field engineer Zainab Hussain, from the 07:42 train to a café, a hotel room and your own kitchen table, where the people around you can see, hear and pick up more than you think.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (introduces the cast and the reporting route) |
| Full module | 15 to 16 minutes |
| Micro-drill | 4 minutes ("Who's Watching?") |
| Text route | 12 minutes |
| Priority | Phase 2 |
| Build size | L, driven by four new places (train carriage, café, hotel room, home office) with their art and conversation backgrounds, the Wi-Fi picker (MG-14) and an "overlooked and overheard" check |

## Why this module

Work now happens on trains, in cafés, in hotel rooms and at kitchen tables, where the office's badge gates, managed network and confidential waste bins don't reach. What goes wrong there is mostly ordinary: a screen read over a shoulder, a client's door code said aloud in a queue, a tablet left on a café table, a fake Wi-Fi login page, a child doing homework on a work laptop, a whiteboard behind you on a video call. The NCSC's guide for small organisations (2026) notes that phones and tablets "often leave the office environment and so are more likely to be lost or stolen". Almost all of it is prevented by a few small habits, and the rest is contained by one quick call to the service desk.

- **Bob Quick, 2009.** The head of counter-terrorism at the Metropolitan Police was photographed carrying a document marked secret into Downing Street. The text was readable in the photographs, arrests were brought forward, and he resigned the next day.
- **Ministry of Defence papers, 2021.** Classified papers about a Royal Navy ship's route past Crimea were found behind a bus stop in Kent and passed to the BBC. The official who lost them had his security clearance suspended.
- **EU defence ministers' video call, 2020.** A minister posted a photo of her screen that showed the meeting's login details, and a journalist joined the call.

## Target behaviours

1. **Keeps work out of sight and earshot.** Chooses where to sit, uses a privacy screen, locks the screen whenever they look away, saves Confidential work for a private place, and doesn't say names, codes or client details where others can hear, including on video calls from home.
2. **Keeps devices close, and reports a loss at once.** Devices and papers stay with them or locked away, family don't use work devices, and anything lost or stolen is reported to the service desk straight away, day or night.
3. **Connects safely away from the office.** Checks the network's name with the venue, lets the VPN connect, never types a work password into a Wi-Fi page, and uses the phone's hotspot when unsure.

## Learning outcomes

After this module, staff can:

- **C09-LO1** Choose where and how to work in a public place so that screens and papers can't be read by others: where to sit, a privacy screen, locking the screen, and saving Confidential work for a private place.
- **C09-LO2** Handle calls in public so that names, codes and client details aren't overheard, by moving somewhere private or calling back.
- **C09-LO3** Connect safely away from the office: pick the venue's real network, recognise a Wi-Fi page that asks for too much, let the VPN connect, and use the phone's hotspot when unsure.
- **C09-LO4** Keep devices and papers with them or locked away when travelling, take only what the trip needs, and keep work devices for their own use.
- **C09-LO5** Report a lost or stolen device or papers straight away through the organisation's route, saying when and where it went and what was on it.
- **C09-LO6** Set up a video call from home so that the camera, the microphone and a shared screen show only what they should.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md` when it is written):

- **ISO/IEC 27001** clause 7.3 and Annex A 6.3 (awareness), 6.7 (remote working), 7.9 (security of assets off-premises), 8.1 (user endpoint devices), and 7.7 (clear screen) in part.
- **CIS Controls v8.1** 14.5 (causes of unintentional data exposure, which names losing a portable device), 14.8 (the dangers of connecting to and sending data over insecure networks, including home networks), and 14.6 (recognising and reporting incidents).
- **PCI DSS** 12.6.3.2 (training on the acceptable use of end-user technologies, which 12.2.1 says include remote access and wireless technologies, laptops, tablets and phones).
- **NIST SP 800-53** AT-2.
- **NIS2** Article 21(2)(g) (basic cyber hygiene practices and training).
- **NCSC CAF** B6 (staff awareness and training).
- **UK GDPR** Article 32 (appropriate security for personal data): the lost tablet and the overheard call both carry personal data.
- **NHS Data Security and Protection Toolkit**, for health and care customers: its guidance for smaller organisations asks them to tell staff that public Wi-Fi is unsafe. The organisation profile can switch the module to that stricter rule (Open question 2).

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | On the 07:42 to Haverbridge, Lena asks for a quick check of the client's site survey. The only free seat has a passenger behind it. Whether the player opens the Confidential residents list where he can read it is the baseline | Game (overlooked check) | 1.5 |
| Learn | Zainab's four "road rules" across the train table (screens, voices, networks, devices), with a carriage diagram of who can see what; Ama's one message by chat: report a lost device at once, any hour | NPC explainer (EX-01, BE-08) | 2 |
| Practise | "Who's Watching?": pick the seat nobody can see in a carriage with sight cones showing, spot the risks on a café table, and choose the right network four times | Minigame (sight cones, BE-10, MG-14) | 2.5 |
| Apply | The café (two networks with nearly the same name, a client asking for a door code by phone, a laptop to mind, everything back in the bag), the hotel (the laptop at dinner, a missing tablet), home the next morning (a nephew who needs a laptop, a video call with a whiteboard behind you) | Game (BE-18, BE-16, MG-14) | 6 |
| Debrief | "Through their eyes": what each bystander could see or hear at each place; Owain's device console for the tablet; per-outcome results | Debrief screen (BE-02) and NPCs | 1.5 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | Reference card on The Lark: out of sight, out of earshot; with you or locked away; check the network; lost it, report it now | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Line of sight:** `public/break_escape/js/systems/npc-los.js` (`isInLineOfSight`, a cone with `range` and `angle`, and `drawLOSCone` for visible cones) and the sight challenge in `systems/npc-sight-challenge.js` (`los.challengeOnSight` with `requireGlobal` and `skipIfGlobal`, emitting `player_spotted:<npcId>`). Terry Mott's `los` block in `scenarios/m03_ghost_in_the_machine/scenario.json.erb` is a working example. The lockpick catch gate (`systems/lockpick-catch.js`), which checks line of sight at the moment an action starts, is the pattern for the proposed overlooked check below. Visible cones (`los.visualize: true`) are already used in `scenarios/npc-patrol-lockpick/`.
- **Conversations:** `person-chat` for Zainab, the passenger, the café stranger and Ellis; its video-call mode (`public/break_escape/js/minigames/person-chat/person-chat-ui.js`, opened by an event mapping with `conversationMode: "video-call"`) for the home call with Ama and the client; `phone-chat` for Lena's and Ama's messages, the client's call (until MG-04) and the service desk.
- **Documents and devices:** `container` for the laptop's desktop of files (as PCs work today); `text-file` and `notes` for the survey files, the café's chalkboard and the reference card.
- **Systems:** the game clock (`gameClock`) and timers for the two days; event mappings, `setGlobal` and `onceOnly`; timed messages for Lena and Ama; objectives and tasks for the work task bar.
- **Props in `public/break_escape/assets/objects/`:** suitcases, laptops, a tablet, phones, room safes (`safe1` to `safe5`) for the hotel, sofas, the coffee station and cups, a kettle, plants, bins, desk speakers (a stand-in until a smart speaker prop exists), a wall TV (`uni_tv1`).
- **Rooms:** none of the four places exists. `room_uni_common` (sofa, tables, kitchenette and a `coffee_station` slot) is the nearest blockout for the café, and `room_break` (the office kitchen) the next; `small_room_1x1gu` could be dressed as a cheap hotel room.

## New features needed

- **MG-14 Wi-Fi and VPN picker:** the module's main new minigame, in the Practise drill and at the café. The catalogue lists it as P3; this module is P2, so it needs moving up.
- **BE-10 Spot-the-risk mode:** the café table snapshot, the hotel room before dinner, and the camera view before the video call.
- **BE-16 Time skips:** the train journey, the hotel turndown, the tablet's lock and wipe, the next morning.
- **BE-18 Work task and interruptions:** the survey, the café tasks, the morning call.
- **BE-08 Visual aids:** Zainab's carriage diagram, the two Wi-Fi pages side by side, the reference card.
- **MG-04 Voice calls:** calling the client back and ringing the service desk (a `phone-chat` contact until then).
- **MG-23 Device settings:** the optional pre-trip check (screen lock, find my device, updates) and the micro-drill.
- **BE-01, BE-02, MG-20, BE-09, BE-05, EX-01:** the record, the debrief, the check, the intranet, the organisation's own numbers and the explainer pattern.
- **BE-19 Open minigames from events:** the Wi-Fi picker opening when the player opens the laptop at the café.
- **proposed:** Overlooked and overheard check, a gate that runs when the player opens a document or starts a call marked sensitive: each person NPC in the room whose sight cone (or a short, all-round earshot range) covers the player emits an event, skipped while a mitigating global is set (privacy screen on, call taken outside). It generalises `lockpick_used_in_view`. Until it exists, `challengeOnSight` with `requireGlobal: "confidential_on_screen"` covers the train, firing when the document view closes with the file still open on the laptop, because the sight check pauses while any minigame is open.
- **proposed:** Sight-line toggle, an action and ink tag that show or hide NPC sight cones during play (today `los.visualize` is fixed per NPC when the room loads), so Zainab can switch them on mid-explanation and the debrief can replay them.
- **proposed:** Workplace video-call skin (shared with core_15, specified there): the call app's name from the organisation profile in place of the hard-coded "SECURE VIDEO LINK" bar, no scanline frame, and a name for each participant.
- **Art (not features):** four new rooms (train carriage, café, hotel room, home office), each with a conversation background (`room-pov-background` skill), and new characters (see `game_design.md`).

## Organisation-specific content

- The 24/7 number for reporting a lost or stolen device, and what to tell them.
- Whether privacy screens are issued, and how to get one.
- The VPN's name, and whether it connects by itself.
- The public Wi-Fi rule: the default is "venue Wi-Fi with the VPN, or your phone's hotspot"; the stricter setting is "phone hotspot only".
- Travel rules: hotel rooms and safes, papers out of the office, travel abroad.
- Home working rules: family use of devices, printing at home, smart speakers, video call backgrounds.
- Whether personal devices can be used for work, and on what terms.
- How remote lock and wipe works for the organisation's phones, tablets and laptops.

## Open questions

1. **Who is the player?** The seed allowed the player to become a field engineer for this module. *Recommendation: keep the operations coordinator, travelling with Zainab to a client survey. It matches the other core modules, and Zainab carries the field know-how as the on-the-road explainer.*
2. **Public Wi-Fi default.** *Recommendation: the proportionate rule (venue Wi-Fi with the VPN, or the hotspot), with "hotspot only" as an organisation setting for customers who follow the DSPT's stricter line.*
3. **Hotel safes.** Advice varies. *Recommendation: "keep it with you" first, a room safe as better than leaving it in view, and the organisation's own travel rule on the reference card.*
4. **Travel abroad** (loan devices, border inspections). *Recommendation: leave it out of core_09 and offer it as an annual edition or a role pack; it applies to few staff.*
5. **Who loses the tablet?** *Recommendation: emergent. If the player leaves the café without it, it's theirs; if not, Zainab finds hers is missing. Everyone meets the reporting decision, and nobody is set up to fail.*
6. **Art cost.** Four rooms is the biggest cost in the module. *Recommendation: build the train carriage and the home office first (core_15 and the capstone can reuse the home office), the café second, and dress `small_room_1x1gu` as the hotel room.*
