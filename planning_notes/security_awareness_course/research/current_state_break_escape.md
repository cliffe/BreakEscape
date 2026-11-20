# Current state: the Break Escape engine

What the engine can do today that the awareness course can reuse, and the gaps, as surveyed in October 2026. Paths: `JS/` is `public/break_escape/js/`.

## How minigames open

- 42 minigames are registered in `JS/minigames/index.js`. Config lives in an object's `minigameData`; the schemas are in `scripts/minigame-data-schemas.json`, which the validator checks.
- **A minigame opens only when the player interacts with an object** (dispatch in `JS/systems/interactions.js`, locks in `JS/systems/unlock-system.js`, starters in `JS/systems/minigame-starters.js`). The ink tag `#trigger_minigame` is a stub that shows a toast, and there is no "open minigame" action. Exceptions: `#clone_keycard` opens the RFID tool and `#give_npc_inventory_items` opens a container view. This is why BE-19 is needed.

## Minigames worth reusing

| Minigame | What the player does | Awareness reuse | Notes |
|---|---|---|---|
| `notes` | Reads a page (markdown subset: headings, bold, lists, tables; no images) saved to the Notepad | Memos, policy extracts, sticky notes | Used everywhere |
| `text-file` | Views plain text with Copy and "Add to Notepad" | A printed email, a chat export | |
| `examine` | Close-up of an object with observations | A found USB stick, a badge, a poster | |
| `container` | Takes items from a grid; PCs and laptops show a "desktop" of files | Clean desk sweeps, bins, an unlocked PC | |
| `forensic-data-platform` | Tabbed evidence viewer (paragraphs, timelines, tables, excerpts, lists, callouts, `showIf`), then a gated confirm button | Review an invoice or email evidence, then confirm a judgement. The most generic viewer | sis03 |
| `claims-management-system` | Tabbed document viewer; viewing tabs sets globals; print | Read-and-acknowledge policy tabs | Default title "Meridian..." is hard-coded |
| `ncsc-brief` | A sealed advisory that opens when a global is set | A security bulletin unlocked after a step | sis03 |
| `coverage-decision-form` | Radio-option sections, then Submit; writes globals, can record whether the right option was chosen | The nearest thing to a form-based check today | Header "Meridian Cyber Insurance" is hard-coded |
| `shredded-document` | Reorders strips to rebuild a document | Secure disposal | Only in `scenarios/test-shredded-document` |
| `person-chat` | Full-screen ink dialogue with portraits, choices (click or keys 1 to 9), multi-speaker scenes, `Narrator:` lines, `Background[path]:` scene changes; auto or click-through pacing | Every conversation; social engineering at the door; the mentor | **Video-call mode** (`person-chat-ui.js`): a framed call with a self-view, opened by an event mapping with `conversationMode: "video-call"`; its "SECURE VIDEO LINK" bar is hard-coded |
| `phone-chat` | Text threads with contacts, unread badges, voice messages (TTS); terminal theme available | Texts, scam messages, team chat, voicemail | Phone NPCs support `timedMessages` |
| `password` | Type a password; hint, on-screen keyboard, post-it | A weak or written-down password found nearby | Entry only: no strength meter, no creation exercise |
| `pin` | Keypad entry | Shoulder-surfed door codes | |
| `flag-station` | Free-text answer checked on the server; also a two-button confirm mode | A free-text answer; a two-choice console | |
| `dual-auth` | Two PIN pads, AUTHORISE and a timer | Two-person payment approval | **Exists but isn't registered or dispatched**; sis01's object is commented out. Wiring it up is a small task |
| `backup-recovery` | Pick one of several option cards; the choice is locked and stored | "Choose your response" cards | Global name is fixed |
| `esd-pushbutton` | A guarded button with a confirm modal | A "stop the payment" or "report it" button | |
| `command-board` | An incident timeline that stamps entries as globals change; the player can type log entries | A decision log or crisis timeline (role_01) | sis01, m07 |
| `alarm-panel` | Read-only lamp board | A status board | |
| `ransomware-display` | Views a ransom screen with a countdown | What an infection looks like (core_07) | m02, sis01 |
| `siem` | Escalate or dismiss alerts against a timer | IT staff (role_03) | Alerts are hard-coded; `alertConfig` is ignored (bug) |
| `log-filter` | Flag the odd row in a log, with lookups | Impossible-travel sign-ins (role_03) | Technical |
| `network-segmentation-map` | A four-zone map with a sever action | IT staff | |
| `rfid` | Tap, read, clone and emulate cards | Badge cloning in the attacker view (core_10) | m01 to m08 |
| `lockpicking` | Pin-tumbler picking | Attacker view (core_10) | |
| `lab-workstation` (object type) | Opens any HTTPS page in a near-full-screen iframe | The intranet (BE-09); a cheap first version of a fake website (MG-02) or a video page (MG-21) | Popup title is always "Lab Sheet" |

Low reuse: `dusting`, `biometrics`, `bluetooth`, `ble-scanner`, `cryptex` and `combination` (no server unlock method), `ehr-terminal`, `infusion-pump`, `drug-library-integrity`, `sis-config-threshold`, `scada-historian`, `blockchain-explorer`, `vm-launcher`. `ehr-terminal` may suit sector_01.

## Systems

- **Objectives** (`JS/systems/objectives-manager.js`): aims and tasks; task types `collect_items`, `unlock_room`, `unlock_object`, `enter_room`, `npc_conversation`, `submit_flags`, `manual`, `custom`; optional tasks; skip; unlocks; every change posted to the server. (`docs/OBJECTIVES_AND_TASKS_GUIDE.md` is stale; the code and `scripts/scenario-schema.json` use `aimId`, `tasks`, `taskId`.)
- **Tutorial** (`JS/systems/tutorial-manager.js`): a fixed controls tutorial ("Welcome to Hacktivity Games!"), not authorable per scenario. The title screen is also fixed. (BE-20.)
- **NPCs:** person NPCs with `facePlayer`, `personalSpace`, `patrol` (waypoints, routes, dwell); **line of sight** (`los {range, angle, visualize, challengeOnSight}`, emits `player_spotted:<id>`, `JS/systems/npc-sight-challenge.js`), useful for shoulder surfing (core_09) and challenges (core_10); **barks**; **event mappings** that open conversations, set globals, complete tasks, send timed messages, make an NPC walk to the player.
- **Combat off:** `disableAttacks: true`, no hostile NPCs.
- **Influence** (`docs/NPC_INFLUENCE.md`): an ink variable with popup tags; it doesn't change NPC behaviour by itself.
- **Timed messages and conversations:** NPC `timedMessages` (texts or barks) and `timedConversation` (the usual opening cutscene). Pending texts survive a reload.
- **Timers and game clock:** `timers[]` with delays, start and cancel conditions, actions and countdowns; `gameClock: {start: "Tue 07:30"}`. Both resume after a reload.
- **Cutscenes:** no camera system; cutscenes are person-chat or video-call overlays opened by timers or event mappings.
- **Actions** (`JS/systems/apply-actions.js`): `set_global`, `emit_event`, `complete_task`, `unlock_object`, `unlock_door`, `give_item`, `hint`, `tint_objects`, `lighting_dip`, `confirm_action`, `show_end_screen`.
- **Events:** room, door, item, object, minigame, conversation, objective, flag, RFID, fingerprint, sighting and combat events, with `prefix*` wildcards (`JS/systems/npc-events.js`). No event for a wrong PIN or password.
- **Globals:** declared in `globalVariables`, synced both ways with ink, sent to the server every 30 seconds and on page hide, restored on load.
- **Lighting, sound, music:** opt-in lighting with motion sensors and flicker; per-room ambience; music playlists are spy-styled (BE-21).
- **Voice:** Gemini TTS generated on the server and cached in `tts_cache/`, keyed on text, voice, style, language and model; lip sync from viseme sheets. Without audio, lines show as text. Every voiced line is also shown as text.
- **Endings:** an aim with `missionConclusion: true`; credits with lines conditional on globals (sis01 uses them as an outcome debrief); `creditsTheme: "cyber"` for a non-spy look; `show_end_screen`.
- **Scoring:** server-side only, 70% tasks and 30% aims; the player never sees it.
- **Saving:** server-side autosave of globals, notes, inventory, unlocks, objectives, phone threads, NPC variables, timers and clock. The player respawns at the start room; person-chat visit counts are not fully restored.

## Scenario format

- Required: `startRoom`, `rooms`, `scenario_brief`. Common: `startItemsInInventory`, `globalVariables`, `objectives`, `player`, `music`, `narrator`, `show_scenario_brief`, `timers`, `gameClock`, `disableAttacks`, `creditsTheme`, `validSprites` (limits avatars).
- **Randomisation:** scenarios are ERB templates with full Ruby, so per-game randomisation (`rand`, `.sample`, `SecureRandom`) already works; helpers in `app/models/break_escape/mission.rb` give random passwords, PINs and codes.
- **`mission.json`** fields read by the code: `display_name`, `description`, `difficulty_level`, `secgen_scenario`, `collection`, `cybok`, `lab_sheet_url`. Others (`estimated_duration_minutes`, `prerequisites`, `branches`, `facilitator_notes`, `learning_objectives`) are documentation only.
- **Ink tags that work:** `#exit_conversation`, `#end_conversation`, `#speaker:`, `#give_item`, `#give_npc_inventory_items`, `#unlock_door`, `#clone_keycard`, `#complete_task`, `#skip_task`, `#unlock_task`, `#unlock_aim`, `#set_global`, `#set_variable`, `#influence_increased`, `#influence_decreased`, `#hostile`, `#remove_npc`, `#reveal_secret`, `#lighting_dip`. Broken or stubbed: `#trigger_minigame`, `#transition_to_person_chat`, `#add_note`.
- **Precedent for a quiz in dialogue:** m01's Kevin runs a five-question multiple-choice "security audit" in ink with a score (`scenarios/m01_first_contact/ink/m01_npc_kevin.ink`).

## Gaps for the awareness course

| Need | State |
|---|---|
| Knowledge check that grades a set of questions and records the result | not found (MG-20) |
| Video playback | not found; the lab workstation iframe could show a hosted page (MG-21) |
| Email client | not found; emails appear as notes and text files (MG-01) |
| Web browser or fake site | not found; the iframe is the only route (MG-02) |
| Image or diagram inside a conversation | partial: whole-frame backgrounds only (BE-08) |
| Debrief listing decisions | partial: conditional credits and NPC debriefs (BE-02) |
| Per-decision record on the server | partial: current globals and task timestamps, no append-only decision log (BE-01) |
| Opening a minigame from dialogue or an event | not found (BE-19) |
| Authorable tutorial and title screen | not found (BE-20) |
| Accessibility | weak: keyboard movement and dialogue work, but inventory, notes and many minigames need a mouse; the canvas world has no screen reader support; no transcript or text size setting; reduced motion honoured in a few places only (BE-03, BE-04) |
| Localisation | not found; only the TTS language (BE-06) |
| Mobile and touch | partial: tap to move and interact; minigames are laid out for desktop |
| Save and resume | yes |
| Carrying choices between missions | not found (BE-17) |

## Known engine issues that affect reuse

- `dual-auth` is not registered; `siem` ignores `alertConfig`; `cryptex` and `combination` have no server unlock method; `vpn_log_terminal` has no dispatch.
- `#trigger_minigame`, `#transition_to_person_chat` and `#add_note` don't work.
- `person-chat-conversation.js` is never imported, so tags it handles (`#influence_gained`, `#patrol_mode`, `#personal_space`, `#trigger_event`, `#complete_objective`) do nothing.
- The top-level `timedMessages` key is ignored (use NPC `timedMessages`).
- Several hard-coded labels block reuse in a new setting: the video-call bar, the "Meridian" form headers, the "Lab Sheet" popup title, the tutorial greeting.

## Art that an office game can reuse

- **Rooms:** `room_reception`, `room_office`, `room_office3` to `room_office5`, `room_ceo`, `room_meeting`, `room_break`, `room_closet`, `room_IT`, `room_servers`, `room_security`, `room_archive_1x2gu`, `room_library_1x2gu`, `hall_1x2gu`, `small_office_room1` to `4_1x1gu`, `small_room_storage_1x1gu`; the corporate set `room_zds_*` (reception, conference, office, CEO, servers, halls); `room_uni_staff` (open-plan desk pods, kitchenette, photocopier) and the rest of the university set; the hospital set `room_hospital_*`.
- **Props** (about 650 in `assets/objects/`): desks, chairs, PCs, laptops, phones, tablets, screens, CCTV, photocopier, shredder, filing cabinets, safes, key cabinet, lockers, pigeonholes, whiteboards, notice board, flip chart, wall clock, plants, kitchen kit, bins, ID badges, keycards, a bowl of USB sticks, notes, reception counter, check-in kiosk, signage.
- **Characters:** generic v2 sprites with talk and viseme sheets (office workers, security guards, telecom staff, scientist, nurses, hospital staff, and some to avoid for this tone such as hooded hackers and spies). The 14 avatar choices are in `app/models/break_escape/player_preference.rb`. Named characters belong to their missions.
- **Conversation backgrounds:** m01's office set (main office, reception, break room, conference room, IT room, server room, manager's office) suits a generic office; new rooms need new backgrounds (`room-pov-background` skill).
