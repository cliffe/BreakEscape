# E12, Visitor and tailgater

Implementation brief for a Sonnet agent with a fresh context. Follow it exactly. Use the real keys
quoted here; do not invent config. Where a key does not exist yet, this brief names the engine packet
(`02_ENGINE_WORK.md`) that adds it and states the config E12 needs from it.

---

## 1. Goal and module(s)

Teach **core_10 (physical security)** and the **in-person half of core_02 (social engineering beyond
email)** as one attack-then-defend episode at a fictional architecture practice. The attack half is the
first awareness episode played **in the game world** (not entirely at the kiosk): the learner, on an
authorised red-team day, puts on a hi-vis courier costume, carries a parcel, walks the lobby, and talks
the front-of-house coordinator into buzzing them through the badge door with an **in-person pretext**
(person-chat on the influence bar, exactly as E3 does by phone). The defend half puts the learner on the
reception desk, where they challenge politely, verify and escort visitors, and report.

Teaching source of truth: `modules/core_10_physical_security/concepts.md` (physical) and
`modules/core_02_social_engineering_beyond_email/concepts.md` (the in-person pretext and the shared
"check back on a route you trust" habit). `concepts.md` wins over `game_design.md` where they differ.

This episode's scope is cut hard to fit ~15 minutes (section 6). The full `core_10` game_design draft
(RFID badge-clone, lockpicking, spot-the-risk drill, MG-25 document inspector, five rooms) is **not**
built here; its content is reduced to one in-person pretext and a six-item reception triage.

## 2. Read first (exact paths)

- `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md` (engine packet ids; spec layout).
- `modules/core_10_physical_security/concepts.md`, `modules/core_02_social_engineering_beyond_email/concepts.md`.
- `modules/core_10_physical_security/game_design.md` (content draft; reparent to Merrin & Sallow).
- Built nearest-neighbour episodes:
  - `scenarios/awareness_e3_helpdesk_reset/scenario.json.erb` and `ink/leila_servicedesk.ink`,
    `ink/darren_price.ink`, the pretext-call pattern, the influence bar (`social.characters`,
    `social.pretextNpcs`), the triage `call` kind, the host NPC with the done-event mapping.
  - `scenarios/awareness_e7_voice_ceo/scenario.json.erb`, the full `awarenessEpisode` block, the
    `triageSets` entry with directly-authored non-email items, `strings`, `debrief`.
- `planning_notes/phishing_and_social_engineering/designs/11_awareness_product_episodes.md`
  (defend-set rules §4, host NPC + flushed done event N16, defend-only variant §3.1/§5.1).
- `planning_notes/phishing_and_social_engineering/designs/06_pretext_dialogue_system.md` (the pretext
  judge, techniques, thresholds, asks).
- `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` §2 (shared tell
  library), §8 (influence), §11 (the awareness-episode block, strings keys).
- `awareness/BRAND_SET.md` (Merrin & Sallow entry and E4 cast; the "Gallagher is not used" note).
- Engine: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS`,
  `writeKind`, `childLaunch`, and the call watcher in `episode-runner-minigame.js`),
  `public/break_escape/js/minigames/pretext-prep/pretext-prep-minigame.js` and `pretext-card.js`
  (`callLaunch` picks person-chat for a `person` NPC), `public/break_escape/js/minigames/person-chat/
  person-chat-pretext.js`, `public/break_escape/js/utils/player-avatar.js`,
  `public/break_escape/js/utils/npc-lookalike.js`, `public/break_escape/js/systems/apply-actions.js`
  (`unlock_door`), `public/break_escape/js/systems/npc-game-bridge.js` (`unlockDoor`),
  `public/break_escape/js/minigames/helpers/chat-helpers.js` (`# unlock_door`, `# trigger_minigame`).
- Rooms: `scripts/room_gen/build_aw_rooms.py`, `planning_notes/phishing_and_social_engineering/
  awareness/training_room.py`, `apply_training_room.py`.

## 3. Depends on

| Packet | What E12 needs from it |
|---|---|
| **ENG-05** (world-play attack stage) | The whole attack half. Precise needs in section 9.1. |
| **ENG-08** (schema and validator) | Accept the new scenario-local tell ids (section 11); accept a lobby room type and a locked connection between lobby and studio; accept the `attack.costume` / world-play fields ENG-05 adds; keep the N16 host-NPC lint happy for a two-room shell. |
| **ENG-09** (check-form needs) | A new physical-security check form (section 14); E12 feeds it. |
| (existing) | The pretext call path (`write` stage with `attack.callId`, pretext-prep → person-chat), the influence service, the triage `call` kind, the host-NPC done-event mechanism (N16). No change needed; cited so the implementer reuses, not rebuilds. |

Build order: ENG-05, ENG-08 and ENG-09 land before E12 is wired. If ENG-05 slips, E12 cannot ship:
the attack half has no fallback (unlike E3, whose phone pretext is already built).

## 4. Owner models

- Content writing and review: `opus48` (phishing / social-engineering content).
- Engine packets ENG-05, ENG-08, ENG-09: general-purpose or Sonnet.
- Shell wiring (this spec), ink, strings: Sonnet following this brief.

## 5. Company, room and host

- **Company:** Merrin & Sallow Architects, a London architecture practice (`BRAND_SET.md` roster).
  `brand` block: `{ "name": "Merrin & Sallow Architects", "logoText": "MERRIN & SALLOW", "accent": "#8a5a2b" }`.
  Domain `merrinsallow.example`; look-alikes `merrin-sallow.example`, `merrinsallow-studio.example`.
- **Host (front-of-house):** **Delphine Arvanitis**, Front-of-House Coordinator, 50s, Greek-Cypriot
  British, fifteen years on the desk. Address `reception@merrinsallow.example`.
  - **Clash check (done 2026-10-27):** `Arvanitis` has no hits in `scenarios/`, `planning_notes/
    phishing_and_social_engineering/`, `docs/` or `public/break_escape/js`. `Delphine` is clean there
    too. She does **not** reuse the retired `core_10` draft name **Maureen Gallagher**, `BRAND_SET.md`
    bars `Gallagher` ("clashes with an existing scenario"). She is a new M&S cast member, distinct from
    the E4 M&S cast (Catherine Merrin, Tomás Carvalho, Yasmin Chaudhry, Julian Sallow, Thandiwe Moyo,
    Oskar Berglund, Leah Abramson).
- **Red-team lead (brief and debrief framing):** **Jo Fairweather**, Northlight Security, the
  authorised ethical social engineer who recurs as the course's red-team persona across the module
  `game_design.md` files (consistent use, not a clash). She frames the attack as an authorised test and
  carries the "what would have stopped me" line. She appears only in the seeded brief and strings, not
  as a world NPC, to keep the cast small.
- **Genuine visitors in the defend set** reuse one existing M&S client firm as a client and invent one
  `.example` contractor and one fire-safety firm (section 11). Pre-ship: web-search "Arvanitis",
  "Northlight Security", and the invented firms for a real business of the same name.
- **Rooms:** two.
  - `studio` (the defend seat and the kiosk): map type `room_aw_merrin_sallow`, built by
    `build_aw_rooms.py` and wired by `training_room.py` (`merrin_sallow` entry,
    `chatBackground: assets/backgrounds/rooms/aw_merrin_sallow_blended.png`). Reuse unchanged.
  - `lobby` (the attack world-play): a **new** reception/lobby map, `room_aw_merrin_lobby`, with a
    reception desk, the entrance, and a badge door to `studio`. Added as a new entry in
    `build_aw_rooms.py` (a fresh copy of `room_uni_seminar` dressed as a lobby, same pattern as the
    four existing `room_aw_*` maps). Owned by ENG-05 (section 9.1). Cast diversity and props follow
    `ROOMS_REVIEW` conventions.

## 6. Timing budget per stage (~15 minutes)

| Stage | Minutes | Note |
|---|---|---|
| brief | 1.5 | Jo's authorised-test framing; scope; the hi-vis costume handed over. |
| osint | 2.0 | 3 facts on a stripped M&S "Visit us" page that make the courier pretext work. |
| write (world-play attack) | 4.5 | Costume + parcel, walk the lobby, in-person pretext on the influence bar, the desk buzzes the door. |
| flip | 0.5 | The con replayed as Delphine experienced it, with the lines that worked. |
| defend | 5.0 | Six reception `call` items, Verify on, immediate feedback. |
| debrief | 1.5 | Concept panel, Monday card, no-blame, the module line, the habit to keep. |
| **Total** | **15.0** | |

**If it overruns** (the world-play attack is the risk): cut the **osint** stage and move its three
facts into the brief as given context (Jo tells the learner what is public). That saves ~2 minutes and
leaves ["brief","write","flip","defend","debrief"]. Do not cut the defend set below six items or drop a
mirror pair; measurement and aw5 depend on them.

## 7. Stages (runner stage ids)

Full episode: `"stages": ["brief","osint","write","flip","defend","debrief"]` (all ids are in
`STAGE_IDS`, `episode-model.js:27`). `write` is the attack: because `attack.callId` is set,
`writeKind(episode)` returns `'call'` (`episode-model.js:166`), so the runner opens **pretext-prep**,
whose Begin opens **person-chat** (the pretext NPC is `npcType: "person"`, so `callLaunch` picks
`person-chat`, `pretext-card.js:240`). ENG-05 wraps this so the pretext is played in the lobby world
(section 9.1). `conclusionTaskId` is the defend task.

Defend-only variant: `"stages": ["brief","defend","debrief"]` (the runner drops attack stages for a
`defendOnly` variant whatever is authored, `episode-model.js:68`).

## 8. Brief and scope note (host's draft lines; dialogue reviewer polishes)

- `strings.brief` (full): "You're on an authorised exercise at Merrin & Sallow Architects, a fictional
  London architecture practice. First you're on the red team with Jo Fairweather of Northlight Security,
  who the practice has hired to test the building. You'll pull on a hi-vis jacket, pick up a parcel, and
  see how far a friendly courier gets at the front desk. Then you swap seats: you're on reception
  yourself, and the same kinds of visitor arrive. Only the reception seat is scored. Nothing you do
  leaves the game."
- `scopeNote` (full): "Authorised exercise at Merrin & Sallow Architects, a fictional company. In scope:
  one practice approach to the front desk in a courier's hi-vis, and six visitors to handle on the
  reception seat. Jo's test is authorised and the costume is handed back afterwards."
- Seeded brief message (pattern from E7 `seededMessages[brief]`), from Jo:
  "This is Merrin & Sallow's red-team day. In scope: the lobby and the front desk. Pull on the hi-vis by
  the door, take the parcel, and try to get past reception to the studio without a badge. However it
  goes, you'll be on the desk next, with the same visitors. Jo Fairweather, Northlight Security."
- Ethics line (pretext-prep brief, `brief.ethics`): "Authorised test only. You never deceive a real
  person, and the costume comes off the moment you're through."

## 9. Attack half (the world-play pretext)

The one attack artefact is an **in-person pretext conversation** on the influence bar. It reuses the
built pretext machinery exactly as E3 does, but with a `person` NPC in a lobby room, plus the ENG-05
world dressing.

### 9.1 What ENG-05 must provide (config E12 needs)

ENG-05 is the "world-play attack stage" packet. E12 needs, as configuration on the `awarenessEpisode`:

1. **A hi-vis costume swap that respects aw9.** At the start of the attack the player's **world sprite
   and talk portrait** swap to a hi-vis courier; on leaving the attack (flip, or any early exit) they
   revert to `chosenPlayerSprite()` (`utils/player-avatar.js:26`), never to the scenario's
   `player.spriteSheet`. aw9 ("the chosen avatar always wins") means the costume is a **temporary
   override**, not a new chosen avatar: ENG-05 stores the pre-attack sprite and restores it, and
   `syncScenarioPlayer` (`player-avatar.js:55`) is called with the restored key so person-chat's
   self-view and the HUD agree. Config:
   `"attack": { ..., "costume": { "sprite": "aw_hivis_courier_v2", "talk": "assets/characters/aw_hivis_courier_talk.png" } }`.
2. **A parcel the player carries.** There is **no stock "carry" animation**: the six house templates are
   `breathing-idle, walk, cross-punch, lead-jab, taking-punch, falling-back-death`
   (`.claude/skills/pixellab-character-animations/SKILL.md`), and the pipeline forbids `action_description`
   custom animations as off-model and costly. So "carrying a parcel" is **baked into the costume
   sprite's design**: `aw_hivis_courier_v2` is drawn holding a parcel across its `walk` and
   `breathing-idle` frames (made with the standard `pixellab_pipeline.py` route, parcel as part of the
   character, not as a separate animation state). This is an art note for ENG-05/PixelLab, not new
   engine code. (Hand edits go in `tools/pixellab_overrides/`, never on the atlas, CLAUDE.md.)
3. **A lobby room and a door.** `rooms.lobby` (type `room_aw_merrin_lobby`, section 5) connected to
   `rooms.studio` by a badge door that starts **locked**. `startRoom: "lobby"`.
4. **An NPC opening the door, reuse the existing mechanism, do not build a new one.** NPCs already open
   doors: an ink line carrying the tag `# unlock_door:studio` is handled at
   `minigames/helpers/chat-helpers.js:71`, which calls `NPCGameBridge.unlockDoor(roomId)`
   (`systems/npc-game-bridge.js:77`); that server-validates the NPC's permission and then clears
   `doorProperties.locked` on every door sprite to the room (lines 112,119) and emits
   `door_unlocked_by_npc`. (`apply-actions.js:102` `unlock_door` is the action-list equivalent.) So on
   a successful pretext the host's ink speaks a buzzed-in line tagged `# unlock_door:studio` and the
   door opens. ENG-05 only needs to ensure the lobby door honours a locked connection and that the
   host NPC has door-unlock permission; the opening itself is built.
5. **A real `#trigger_minigame`.** Today `# trigger_minigame:<name>` only shows a notification and logs
   (`chat-helpers.js:190-201`, "Actual minigame triggering would be game-specific"). ENG-05 makes it
   start the named minigame. **E12 uses it only if** the world-play needs the chat to hand back to the
   episode runner for the flip; if ENG-05 instead reuses the `watchCall` pattern
   (`episode-runner-minigame.js:760`, which already waits for `pretext_<callId>_outcome` and every
   overlay to close, then reopens the runner for the flip), E12 needs no `#trigger_minigame`. State
   which route ENG-05 takes; prefer reusing `watchCall`.

### 9.2 OSINT facts (ids, source, what they unlock)

`social.osint.profile: "awareness"`, one `company-site` and one `social` site
(`attack.siteIds: ["merrin_site","merrin_social"]`). Three facts (each declares `se_intel_<id>: false`
in `globalVariables`):

| fact id | source block | fact text (board) | provides / unlocks |
|---|---|---|---|
| `merrin_badge_door` | `blk_visit` (company-site "Visit us") | "The design studio sits behind a badge door; front-of-house buzz expected visitors and couriers through." | the pretext premise (there is a door to be buzzed through); no blank. |
| `merrin_partner_travel` | `post_merrin_site` (social, a partner's post) | "Catherine Merrin, a partner, is often out at project sites, so parcels for her pile up at reception." | `name`/`recipient` `merrin_partner` "Catherine Merrin" (the name the courier drops). |
| `merrin_courier_routine` | `blk_deliveries` (company-site) | "The studio takes frequent material-sample deliveries; the desk signs couriers in." | the delivery pretext flavour; no blank. |

`Catherine Merrin` is the E4 managing partner (`BRAND_SET.md`); reused by name only, not met. Keep the
three facts shallow (11 §7: three to five facts, one page).

### 9.3 The pretext (person-chat, influence bar)

Modelled on E3's `social.pretextNpcs[0]` (`quayholt_helpdesk_reset`). One call,
`callId: "merrin_front_desk"`, `character: "delphine"`, the host `npcType: "person"` so pretext-prep's
Begin opens person-chat. `social.characters.delphine` carries the influence config:
`influence { global: "delphine_influence", min: -100, max: 100, start: 0 }`, `channels: { person:
"delphine_reception" }` (the runner reads `cfg.channels.person` to find the NPC,
`episode-runner-minigame.js:640`), `syncedVars: ["delphine_influence"]`, and thresholds mirroring E3:
`wary` at -30, `refuses` at -50, `reports` at -70 (`reports` sets `delphine_alerted` and ends the
conversation).

Pretext lines (ids, techniques, gating fact, draft text). `blanks`/`claims` as E3:

| line id | technique / also | requires fact | draft text |
|---|---|---|---|
| `open_parcel` | (none) | `merrin_courier_routine` | "Parcel for the studio, needs a signature from someone up there." |
| `name_drop_partner` | `authority_borrowed` | `merrin_partner_travel` | "It's the sample box for Catherine Merrin, she's expecting it today." |
| `hands_full` | `deflect` | `merrin_badge_door` | "My hands are full and the badge is back in the van, could you just buzz me through?" |
| `double_parked` | `urgency`, also `deflect` | (always) | "I'm double-parked with a full run on, any chance you can be quick?" |
| `no_need_to_sign` | `deflect`, also `urgency` | (always) | "No need to sign me in, I'll be thirty seconds and straight back out." |

One ask, `buzz_door`: `verification: ["expected","escort"]` (the two checks Delphine should make, is
this delivery expected on today's list, and will she escort rather than buzz blind), `pressure: -10`,
`floor: 0`, `grants: { setGlobal: { delphine_buzzed_through: true } }`. The granting line in the ink is
tagged `# unlock_door:studio` so the desk physically opens the door (section 9.1 item 4).

`susceptibility` (how far each technique moves her, E3 shape): `{ "authority_borrowed": -15,
"urgency": -10, "deflect": -10 }`; `unverifiableCost: -10`. `knows` / `labels`: she can place
`merrin_partner` (Catherine Merrin is a real partner) but **cannot** confirm a delivery is expected or
who the courier is, so the honest checks (list + escort) are what separate this from a genuine
courier, which is the whole lesson and the mirror to defend item 5.

`outcomes`: `got_it` (buzzed through), `reported` (she stops and rings facilities), `walked_away`.
`defenderNotes.buzz_door`: "The name on the parcel and the hurry were both easy to supply. A quick look
at the day's expected-deliveries list, and walking the courier to the desk rather than buzzing the door
blind, is what a genuine courier never minds and this one could not survive."

Ink: one new file `ink/delphine_reception.ink`, modelled line-for-line on
`ink/leila_servicedesk.ink`, the two `EXTERNAL pretext_say/pretext_ask` fallbacks, the `se_intel_*`
and `pretext_*` VAR declarations, a `desk` knot offering the fact-gated lines, a `reaction` knot that
routes on band, and an `ask_reaction` knot where result `1` speaks the buzzed-in line **with the
`# unlock_door:studio` tag**. The host NPC also needs its welcome/brief and the N16 done-event mapping
(section 15); keep those in the same record's `eventMappings`.

### 9.4 Red-flag meter

The pretext uses the live influence bar and tells (person-chat-ui), not the mail red-flag meter.
`showRedFlagMeter` is not set on a call attack. The crossing "factors" the learner sees are the
techniques (`authority_borrowed`, `urgency`, `deflect`) and the two skipped checks (expected, escort),
surfaced by the `tells`/`defenderNotes`, exactly as E3 surfaces them.

### 9.5 The one consequential choice quoted in the flip (aw2)

The pretext choice the flip shows is whether the learner **asked Delphine to skip signing them in and
buzz the door** (`hands_full` + `no_need_to_sign` + `buzz_door`) versus a line that kept the normal
process. The flip's `flipDefenderLineByChoice` names it (section 10).

## 10. Flip

`strings.flipHeading`: "Now you're the one on the desk". `flipIntro`: "This is how your approach looked
from Delphine's side of the counter. The lines picked out below are what got the door open." A
`flipDefenderLine` for the landed case (the courier got buzzed through), `flipNoSend` / `flipMissed` for
the walked-away/reported cases, and `flipDefenderLineByChoice` keyed on the pretext line that carried it
(`hands_full` / `name_drop_partner`). No-blame throughout (aw culture, 11 §4.3): "A full-handed courier
in a hi-vis with the right name is exactly what a busy desk waves through; getting caught by one is no
lapse of sense." The flip reverts the costume (section 9.1 item 1).

## 11. Defend set

`social.triageSets[0]`, id `e12_reception_desk`, `scoringProfile: "awareness"`, `verifyVerdict: true`,
`feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `outcome.setGlobalPrefix:
"episode_e12_visitor_tailgater_defend_"`, `outcome.passPercent: 0`. `awarenessEpisode.defend`:
`{ "setId": "e12_reception_desk", "reportAlwaysVisible": true, "stage": null }`.

All six items are `kind: "call"`, the built triage `call` surface (`triage-kinds.js`
`NON_EMAIL_KINDS`, `CALL_ACTIONS`). A visitor at the desk maps cleanly onto the four call actions:
**Comply = trust** (let them in), **Escalate = report** (tell facilities/security), **Refuse = delete**
(turn away), **Ring back = verify** (check the expected-visitors list / ring the host). This is the
engine-true, scored, measurement-clean choice; person-chat is unscored so it is **not** used for the
defend beat (same decision E3 took, 11 N15: "person-chat is not used for the defend beat"). Author each
item directly as a `call` message in `triageSet.messages` (the way E7 authors voicemails inline), with
`callerId`, `transcript`, `tells` and `truth` (`isPhish`, `flags`, `perFlagNote`, `ifTrusted`,
`reportReply` for phish; `whyFine`, `falseAlarmCost` for genuine). The built `call` reasoning defaults
(`triage-kinds.js:105-117`) back up the authored per-flag notes.

`channelTells` for the set (the closed chip list): `["tailgating","no_escort","uniform_pretext",
"not_expected","borrowed_authority","secrecy_or_bypass"]`. `borrowed_authority` and `secrecy_or_bypass`
are the shared-library tells (`00` §2) reused in-person; the other four are **scenario-local tells**
(11 §5.1 allows them; reusable ones later go to `00`). ENG-08 must let the validator accept these four
new ids (section 3). Canonical strings to register:

- `tailgating`: "Someone followed an authorised person through a secure door without badging in."
- `no_escort`: "A visitor or contractor left to move around unescorted."
- `uniform_pretext`: "A hi-vis jacket, a clipboard or a job title used in place of being expected."
- `not_expected`: "The visitor is not on today's list and their paperwork does not match."

### Items (3 impostor, 3 genuine; mirror pairs)

| # | id | genuine | callerId (at the desk) | line / what they want | tells | correct verdict | Verify | reason text |
|---|----|---------|------------------------|-----------------------|-------|-----------------|--------|-------------|
| 1 | `e12_call_tailgater` | no | "A visitor, no badge, following a staff member in" | Slips in behind a badge-holder at the gate and heads for the stairs: "Cheers, I'm with them." | `tailgating`, `no_escort` | Escalate (report) or Ring back | on | `perFlagNote.tailgating`: "They badged in on someone else's card, which is exactly what a wedge or a held door lets happen." `perFlagNote.no_escort`: "Heading up alone, with nobody signing for them." `ifTrusted`: "An unbadged stranger is loose on the studio floor, where client plans and screens are open." `reportReply`: "Thanks, we caught them on the stairs; they weren't expected." Mirrors #2. |
| 2 | `e12_call_expected_client` | yes | "Client, here for a 10:00 with Yasmin Chaudhry" | On today's list, gives their name, happy to sign in and wait. | (none) | Comply or Ring back (sign in, badge, escort) | on | `whyFine.default`: "They're on the day's list for a named meeting and happy to be signed in and walked up. Checking the list or calling Yasmin is a fine Verify." `falseAlarmCost`: "Turn them away and a real client is left in the lobby and the meeting is missed." Mirror of #1 (arrival: unknown-and-pushing vs expected-and-patient). |
| 3 | `e12_call_fire_inspector` | no | "'Fire-safety inspector', wants the comms room" | "Annual check, I just need five minutes in your comms room. I can let myself in." Not on the list; firm name doesn't match the service contract. | `uniform_pretext`, `not_expected`, `secrecy_or_bypass` | Ring back (check list + contract), then Escalate | on | `perFlagNote.uniform_pretext`: "A hi-vis and a clipboard are easy to get; neither proves he's expected." `perFlagNote.not_expected`: "No entry on today's list and the firm on his order isn't the one on the maintenance contract." `perFlagNote.secrecy_or_bypass`: "'I can let myself in' asks to skip the escort into a secure room." `ifTrusted`: "He'd be alone in the comms room with the building's network." `reportReply`: "Thanks, facilities confirmed no inspection was booked and the firm's name was wrong." Mirrors #4. |
| 4 | `e12_call_real_contractor` | yes | "Lift engineer, on today's list" | From the firm on the service contract, on the day's list, happy to wait at the desk to be signed in and escorted. | (none) | Comply or Ring back | on | `whyFine.default`: "On the list, from the contracted firm, and content to wait and be escorted, a genuine engineer never minds that." `whyFine.secrecy_or_bypass`: "He asks to be signed in, not to skip it." `falseAlarmCost`: "Send him away and the lift stays out of service." Mirror of #3 (contractor: unverifiable-and-pushy vs verifiable-and-patient). |
| 5 | `e12_call_courier_push` | no | "Courier with a parcel, badge 'in the van'" | The exact con the learner just ran: "Sample box for one of your partners, hands full, could you buzz me through? Don't worry about signing me in." | `tailgating`, `borrowed_authority`, `secrecy_or_bypass` | Refuse the buzz-through / Ring back (take the parcel at the desk) | on | `perFlagNote.borrowed_authority`: "Dropping a partner's name doesn't make the delivery expected." `perFlagNote.secrecy_or_bypass`: "'Don't bother signing me in' is the ask to skip the one check." `perFlagNote.tailgating`: "Buzzing the door without a badge is letting them tailgate on your say-so." `ifTrusted`: "A stranger is through the badge door and onto the studio floor." `reportReply`: "Thanks, real couriers leave the parcel at the desk; we logged it." Mirrors #6, and closes the loop with the attack. |
| 6 | `e12_call_forgot_badge` | yes | "Staff member back from leave, no badge" | "First day back, I've left my pass at home, can you let me in?" A real colleague the desk can place on the staff list. | (none) | Ring back (check staff list, issue a temp pass), **not** Refuse | on | `whyFine.default`: "A genuine colleague the desk can confirm. Check the staff list and issue a day pass, don't lend your own badge, and don't leave them stuck." `whyFine.tailgating`: "The safe answer is a temporary pass of their own, so the record stays right." `falseAlarmCost`: "Refuse flatly and you've left a colleague locked out on their first day back; the courtesy is to verify and help." Mirror of #5 (the badge problem: a stranger pushing through vs a known colleague to verify and help). |

Scoring note: both impostor and genuine items reward **Verify** (Ring back) as the safe default (11
§4.1: reporting/verifying when unsure is never penalised), so "refuse everyone" loses points on the
genuine items (#2, #4, #6), exactly as E3's single genuine caller prevents "refuse everything" from
winning.

## 12. Debrief cards

`debrief: { "mondayCard": "slot:customer_report_route", "noBlameLine": true }`. Strings:

- `conceptPanel`: heading "Why the courier got in"; text: "The parcel, the partner's name and the hurry
  were all easy to supply, and none of them proved the courier was expected. The one thing that would
  have stopped it costs nothing: a glance at the day's list and walking the visitor to the desk instead
  of buzzing the door blind. A genuine visitor never minds being signed in and escorted; the one who
  pushes to skip it is the one to report."
- `strings.mondayCard`: "On Monday: if you don't recognise someone, help them, 'Can I help you find
  someone? I'll walk you to reception.' Don't hold a secure door for a stranger, everyone badges in for
  themselves, and report anyone who pushes past a check, using the route in the box below."
- The module line (core_10): "If you don't know them, help them: 'Can I help you find someone? I'll
  walk you to reception.'"
- `noBlameLine`: "A busy desk that tries to help a full-handed courier is doing its job; a miss just
  shows which visitor to slow down for next time."
- **The habit to keep** is shared and quoted **verbatim**; do not rewrite it. `social.awareness.ruleOfThumb`:
  heading "The habit to keep", text: "When a message pressures you to move money, grant access, sign in
  or read back a code, stop and check it yourself through a route you already trust, not the link,
  number or page the message gives you. Taking a minute to confirm is always a fair thing to do."

## 13. Defend-only variant

A second shell, id `e12_visitor_tailgater_defend`, `variant: "defendOnly"`, `stages:
["brief","defend","debrief"]`, same `defend.setId: "e12_reception_desk"`. Its set prefix becomes
`episode_e12_visitor_tailgater_defend_defend_` (the id already ends `_defend`, 11 §5.1 / §10). The
`brief` and `debrief` carry `_defendOnly` strings under `awarenessEpisode._defendOnly` (the defend-only
shell copies them over `strings.brief`/`scopeNote`; `BRAND_SET.md` §7). `defendOnly` string (moves the
empathy line to the debrief since there is no flip): "These visitors were played by people whose job is
to look like they belong, and a busy desk can be caught by any of them. Any you were caught out by are
shown below, with what gave each one away." Joins both seeded Hacktivity courses (defend-only course and
both-versions course), per the user's decision in `WRITER_BRIEF.md`.

## 14. Check-form items it feeds (`10_CHECK_FORMS.md`)

E12 feeds a **new physical-security / front-of-house check form** (ENG-09; the six built role forms are
the measured baseline and are not edited, `WRITER_BRIEF.md`). `10_CHECK_FORMS.md` does not exist yet;
when it is written, E12 contributes these mirror-paired items (each pair one impostor / one genuine, so
pre/post compare like with like, aw5):

1. Tailgater at the gate ↔ an expected visitor signing in.
2. Unverifiable "inspector" wanting a secure room ↔ a contracted engineer on the list.
3. A courier pushing to be buzzed through ↔ a colleague who forgot their badge (verify and help).
4. "Lend me your badge just for today" ↔ a genuine lost-badge report (issue a temp pass).

Each item uses the same closed chip list as the set (section 11). ENG-09 defines the form shell; E12
only supplies the item content.

## 15. Files to create or change

Create:

- `scenarios/awareness_e12_visitor_tailgater/scenario.json.erb` (full shell: two rooms, the
  `awarenessEpisode`, the `triageSet`, `social.characters.delphine`, `social.pretextNpcs[merrin_front_desk]`,
  `social.osint`, `social.people`, `globalVariables`). Model on E3 + E7.
- `scenarios/awareness_e12_visitor_tailgater/ink/delphine_reception.ink` (+ compiled `.json`).
- `scenarios/awareness_e12_visitor_tailgater/mission.json` (pattern from E3/E7).
- `scenarios/awareness_e12_visitor_tailgater_defend/` (the defend-only shell).
- Lobby map `assets/rooms/room_aw_merrin_lobby.json` / `.tmj` via a new entry in
  `scripts/room_gen/build_aw_rooms.py` (ENG-05 owns the dressing; this spec owns the wiring).

Change:

- `scripts/room_gen/build_aw_rooms.py`: add the `room_aw_merrin_lobby` build (ENG-05).
- `planning_notes/phishing_and_social_engineering/awareness/training_room.py`: if the studio map wiring
  needs a lobby entry, add it (ENG-05).
- `awareness/BRAND_SET.md`: add Delphine Arvanitis, the lobby, the invented contractor and fire-safety
  firm, under an E12 additions block (follow the existing "_brandAdditions" convention).
- Hacktivity course seeds: add both shells to the defend-only and both-versions courses.

Do **not** edit the six built role check forms, the shared `ruleOfThumb` test string, the existing
`room_aw_*` maps, or any other episode's fragments.

Required `globalVariables` (declare all, defaults as shown): `episode_e12_visitor_tailgater_state: {}`,
`se_awareness_records: []`, `episode_e12_visitor_tailgater_defend_percent: 0`,
`..._defend_reportRate: 0`, `..._defend_done: false`, `..._defend_pass: false`, `se_osint_state: {}`,
`se_intel_merrin_badge_door: false`, `se_intel_merrin_partner_travel: false`,
`se_intel_merrin_courier_routine: false`, `delphine_influence: 0`, `delphine_latched: ""`,
`delphine_wary: false`, `delphine_refusing: false`, `delphine_alerted: false`,
`delphine_buzzed_through: false`, `pretext_merrin_front_desk_state: {}`,
`pretext_merrin_front_desk_outcome: ""`, `pretext_merrin_front_desk_lowest: 0`,
`pretext_merrin_front_desk_reports: 0`.

## 16. Bridge script outline

A `tools/playtest/se/bridge-e12-full.jsonl` (pattern from the existing `bridge-e*-full.jsonl`) driving:
brief → find the three OSINT facts → open pretext-prep, fill the parcel/partner blanks, Approach →
run the person-chat lines to `got_it` (door opens) → flip → work the six reception `call` items
(mixing verdicts to exercise Verify) → debrief → assert `episode_e12_visitor_tailgater_defend_done`.
Validate with `check-bridge.mjs` / `run-suite.sh`.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e12_visitor_tailgater` passes
  (and the defend-only shell). Expect it to pass only once ENG-08 accepts the four scenario-local tell
  ids, the lobby room type and the world-play `attack` fields.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` and the `validator-social-*` and
  `social-*` suites pass with E12 added.
- The ink compiles: `inklecate` on `delphine_reception.ink` produces the `.json`; the `# unlock_door:studio`
  tag is present on the granting line.
- The bridge suite (section 16) reaches `..._defend_done` and the conclusion screen.
- Manual: the costume reverts to the player's chosen avatar after the flip (aw9); the lobby door is
  locked until `got_it`.

## 18. Do not

- Do not build RFID, lockpicking, spot-the-risk or MG-25; they are cut (section 1, 6).
- Do not use person-chat for the scored defend beat (11 N15); defend is triage `call` items.
- Do not reuse "Maureen Gallagher" or any barred name (`BRAND_SET.md` §Additions).
- Do not make the costume a new chosen avatar; it is a temporary override that restores
  `chosenPlayerSprite` (aw9).
- Do not rewrite the shared `ruleOfThumb` or the per-episode habit test; quote it verbatim.
- Do not run any generator into the repo; do not `git stash`; no attribution lines in commits
  (`WRITER_BRIEF.md`). (The writer never runs git at all.)
- Do not use real brands; `.example` domains only; no working intrusion detail (it is an authorised,
  non-instructional test, core_10 pitfalls).

## 19. Stop and ask if

- ENG-05's world-play handoff turns out **not** to reuse `watchCall` for the flip, so E12 needs a real
  `#trigger_minigame` (section 9.1 item 5), confirm the route before wiring the ink.
- The host NPC cannot be **both** the lobby pretext target (`channels.person`) and the studio kiosk
  host carrying the N16 done-event mapping (section 20, open question 1).
- ENG-08 will not accept scenario-local tell ids and requires every tell in `00` §2 first.

## 20. Open questions

1. **One NPC or two for the host.** This spec uses a single front-of-house NPC (Delphine Arvanitis) as
   both the lobby pretext target and the studio kiosk host with the N16 done mapping, mirroring E3's
   "con her, then take her seat" empathy structure. If ENG-05's world-play cannot have one NPC present
   in the lobby for the attack and drive the done event from the studio, split into two front-of-house
   NPCs (Delphine on the desk as the mark; a second named front-of-house colleague as the kiosk host).
   Both are front-of-house, so either satisfies the brief's "host: a front-of-house staff member".
2. **Call-action labels for a reception context.** The built `CALL_ACTIONS` read "Comply / Escalate /
   Refuse / Ring back"; "Ring back" is slightly off for a visitor at a desk (the equivalent is "check
   the list / call the host"). ENG-07's configurable labels could relabel per set; it is cosmetic and
   the verdict mapping is unchanged, so E12 ships without it, but note it as a polish item.
3. **Does the learner physically walk through the opened door?** This spec treats the door opening as
   the attack's success and empathy beat (the con worked), with defend played at the kiosk; it does not
   require the avatar to traverse into the studio. If ENG-05 prefers the learner to walk through to
   reach the reception seat, the studio must hold the kiosk and the walk is part of the flip transition.
4. Whether the osint stage survives the timing budget or is cut into the brief (section 6).
