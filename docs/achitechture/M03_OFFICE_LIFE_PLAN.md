# m03 office life: plan

Mission: `scenarios/m03_ghost_in_the_machine` (WhiteHat Security, Callaghan Square, Cardiff; a front for Zero Day Syndicate). Branches: `plan/ol-m03` for this plan, and `build/ol-m03` for the build. Three dependencies land on main first (section 11): chatter muted during a conversation on `build/ol-chatter`, the hidden-hostiles music fix on `build/ol-hidden-hostiles`, and the seated and pose frames on `build/ol-pose-art`. Method: `.claude/skills/mission-office-life/SKILL.md`. Worked example: m02's `scenarios/m02_ransomed_trust/office_life/PLAN.md`.

Status: plan. Nothing built. Scope (b) is decided (D52). The cast reuses two Cyber Aware course characters as extras (D53), and the pair below, Zainab Hussain and Yusuf Demir, is confirmed (D58).

## 1. Aim and tier

m03 has a working afternoon followed by an empty building at night. The day act is three rooms: reception (briefing cutscene at load, signing in with Ffion, cloning her badge), the main hallway, and the conference room (Victoria; cloning her card). The night turn is the `night_transition` narrator cutscene, which plays on the first `main_hallway` entry after `mission_phase` becomes `act2_infiltration`, and sets `clone_call_done` when it closes. HaX already says "you leave with the visitors, and we come back after dark", so staff who are gone by then fit the existing text.

Every existing person is story-critical or plot-located, so office life needs new ambient people or nothing. Reception also holds the cutscene and phone records (`briefing_cutscene`, `director_netherton`, `agent_nightshade`, `closing_debrief`), none of which gains needs.

**Tier 2, scope (b):** two day-only ambient staff in reception. They work from the waiting area, take coffee at the reception coffee station, go to the hallway cooler once the hallway has loaded, chat in pools, play up to three once-only exchanges, and are gone by the night turn. One player lever: a security window on one staffer's laptop. The four story NPCs are unchanged.

- Under scope (a) (Tier 0) there would be no new NPCs, no engine change and no lines.
- Under scope (c) (night life, for example a cleaner) the hide mapping would invert to a show on `clone_call_done`, night rooms are dark so `playerHears` fails and chatter mostly becomes pictures, and the cleaner would have to stay out of Terry's line-of-sight window and the server room.

## 2. People

Story NPCs (unchanged; none gains needs):

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Ffion Rees `ffion_rees` (`scenario.json.erb:700`) | story-critical (badge source, `taskOnKO clone_reception_badge`); also at her desk at night (`:735`), where she has no needs and so no effect | reception desk | n/a | none | n/a | none | (1) no needs | existing KO behaviour; badge drops |
| Victoria Sterling | story-critical (card source; hidden on `victoria_choice_made`) | conference room | n/a | none | n/a | none | (1) | existing |
| Terry Mott | patrolling; night LOS challenge | exec wing | n/a | never | n/a | none | (1) | existing |
| Danny Foster | plot-located; `initiallyHidden`, night reveal | his office | n/a | none | n/a | none | (1) | existing |
| narrator, HaX, `briefing_cutscene`, `director_netherton`, `agent_nightshade`, `closing_debrief` and the other phone and cutscene records (`:636` to `:700`) | cutscene or phone only | n/a | n/a | never | n/a | n/a | (1) | n/a |

New ambient staff, reused from the Cyber Aware course cast:

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Zainab Hussain `zainab_hussain` | ambient | `needsHome: "zainab_laptop"` (new readable workstation object on the glass coffee table), `useFrom` on the west place of `leather_sofa1` | `needsRooms: ["reception_lobby", "main_hallway"]` | caffeine (coffee station), thirst (hallway cooler) | `needsCompany.groups: ["whitehat_day"]`; no avoids | `habits.screen` on her laptop (section 4) | (1) no story beat depends on her; hidden before the night turn | `behavior.hostile.leash: true`; `globalVarOnKO: "zainab_ko"`; sets `zainab_attacked`, `wh_staff_attacked`, `wh_staff_upset` |
| Yusuf Demir `yusuf_demir` | ambient | coordinate home on the cell whose centre is within 36 px (`NEAR_CHAIR`) of the foot of `club_chair_e1` (Tiled 90,300, 36x46, seat offset [16,26]; a `STATIC_SEATS` place, `systems/seating.js:150` to `:156`). A coordinate home does seat an NPC: `needsStop` returns a post stop (`:2009` to `:2030`), `seatPreference` gives `fetch` at a post (`:2058` to `:2067`) and a static chair in range is taken, any facing when there is no target object (`:1980`). Every seat move needs sit frames (`hasSitFrames`, `:197` to `:200`, gate at `:2318`), which arrive with `build/ol-pose-art`; until then Yusuf stands at his post | same | caffeine, thirst | same group | none | (1) | as above, with `yusuf_ko` and `yusuf_attacked` |

**Who they are.** Both keep their course identity: name, look, voice, temperament and kind of job. In m03 they are ordinary WhiteHat employees who know nothing of the Zero Day side, so no ending text needs to change. Nothing in the game links them to the course.

- Zainab Hussain: British Bangladeshi, mid-thirties, northern English accent, wears a hijab; in the course a field service engineer who has worked from vans and trains for eight years, steady and down-to-earth. At WhiteHat she sets up and collects test kit at client sites, and hot-desks on the reception sofa between jobs because the bench room is full of kit. Voice `Achernar`. Confirmed (D58).
- Yusuf Demir: British Turkish, mid-forties, British accent; in the course an information security lead, steady and practical. At WhiteHat he is a senior consultant who came over from an in-house security role, and today he is waiting in reception for a client who is running late. Voice `Alnilam`. Confirmed (D58).

Neither voice is among the eight m03 already uses (Algenib, Aoede, Charon, Enceladus, Kore, Despina, Algieba, Iapetus). 
Cast diversity: the m03 cast is Ffion (Welsh, mid-twenties, F), Victoria (RP, late forties, F), Terry (South London, fifties, M) and Danny (Nottingham, late thirties, M). The pair adds a British Bangladeshi woman and a British Turkish man, and neither repeats m02's new pair (Somali and Filipino).

Compatibility: colleagues who get on. Yusuf is the careful one, Zainab is dry about it. Neither has reason to avoid Ffion, and Ffion has no needs, so she never shares an object with them.

**Day only.** Each new NPC carries these hide mappings, all `setVisible: false`. Mappings 1 to 3 are not `onceOnly`; the two re-hides in mapping 4 are `onceOnly`, because each `setVisible` call also posts a room-state write and an unmarked re-hide would write on every room entry at night:

1. `objective_task_completed:clone_rfid_card`, the event whose mapping sets `mission_phase` to `act2_infiltration` (`scenario.json.erb:919` to `:923`). It completes in the conference room, so the player does not see anyone vanish. If a staffer was at the hallway cooler, the hallway the player walks into is empty, and the night scene follows at once.
2. `global_variable_changed:mission_phase` with `data.value === 'act2_infiltration'` (the event carries `{ name, value, oldValue }`, `inventory.js:629`, `npc-game-bridge.js:36`), as a backstop for any other route that sets the phase, such as Victoria's KO.
3. `global_variable_changed:clone_call_done` with `data.value === true` (backstop).
4. `room_entered:reception_lobby` and `room_entered:main_hallway`, condition `globalVars.mission_phase === 'act2_infiltration'` (re-hide on entry, as Victoria's mappings do at `:1495` to `:1501`). Visibility is restored on reload anyway (`core/game.js:1817`, `systems/npc-manager.js:353` to `:356`), so a spent `onceOnly` costs nothing. Stage 1 confirms that a mapping whose condition fails is not consumed.

A hidden NPC is `blocked` in the needs tick and its job is aborted (`npc-needs.js:1414` to `:1420`). `setVisible` state is saved and restored on reload (`core/game.js:1811` to `:1816`), which is the main guard after a reload, since mappings 1 to 3 do not fire again then. On the first frame `room_entered:<start room>` fires once with `previousRoom` null (`core/rooms.js:3195` to `:3226`); whether NPC mappings are registered by then is measured in stage 4, and mapping 4 covers the player's first room change either way. Hiding a seated NPC may leave the sofa place marked as taken; nobody else sits there, and stage 4 checks it once.

**Attacks.** Hitting a staffer sets that staffer's `zainab_attacked` or `yusuf_attacked`, plus `wh_staff_attacked` and `wh_staff_upset` (mappings on `npc_attacked:<id>`, the m02 pattern). Both machines go off on `wh_staff_upset`. HaX texts once ("Leave the staff alone. You're here to clone cards, not start fights."). The credits carry a `warning` line for a staff KO and one for an attack without KO. A hostile staffer is leashed to the room they were hit in, which may be reception, the start room and the badge room: a player who punches one deals with them before talking to Ffion. That is self-inflicted and matches m02.

**Ffion knocked out by day.** The badge KO route stays open. A mapping on `npc_ko:ffion_rees` with `globalVars.mission_phase !== 'act2_infiltration'` sets `wh_staff_witnessed` and `wh_staff_upset`. Two further mappings on the same event, one per staffer and each conditioned on that staffer's own attack global being unset, send them home with `patrolOverride.targetTile` set to the post, where the script holds them (a scripted walk suspends needs). A hostile staffer is left to the hostile behaviour. Yusuf plays one bark. HaX gets one text: "Reception had company. Get the badge and get out." The staff neither fight nor leave the room, since either would add a fight or a walk to an alternative badge route. Credits get one `warning` line for this outcome.

**A hostile staffer at the night turn.** A staffer who was attacked and is still conscious when the card is cloned is hidden like the other. m03's music uses `all_hostiles_ko` (`scenario.json.erb:162` to `:165`), whose handler waits while `anyHostilesAlive()` is true (`music/scenario-music-events.js:418` to `:424`). `anyHostilesAlive()` counts every NPC that is hostile and not KO, with no visibility check (`:164` to `:178`), and hostility persists through a reload (`systems/npc-behavior.js:555` to `:563`; `npcHostility` is a keyed sync section, `state-sync.js:43`). A hidden hostile therefore holds back `all_hostiles_ko`, though it cannot attack: `setNPCVisible` disables the body (`systems/npc-behavior.js:407` to `:411`) and `update` returns at once for a disabled body (`:873` to `:880`). The fix is music only and is a dependency (section 11): `anyHostilesAlive()` skips an NPC whose recorded `setVisible` state is `false`. Stage 1 records the dependency and nothing more.

## 3. Rooms and objects

Set scenario `officePresets: true`. Read against the scenario, it changes no existing object: `victoria_computer` has a `lockType` (`scenario.json.erb:1845` to `:1856`), Danny's workstation has no `id` (`:1939` to `:1946`), `cyberchef_workstation` is takeable (`:1612` to `:1623`), and `phone4`, `usb_bowl1`, the sofa and the chairs are undeclared Tiled decor (`assets/rooms/room_zds_reception.json`), and an object without an `id` never takes a preset (`systems/office-presets.js:51`). Stage 0 confirms this with `--office-summary`.

| Room | Change | Notes |
|---|---|---|
| `reception_lobby` (`:586`, start, always loaded) | Declare Tiled `coffee_station1` (at 262,230) as `reception_coffee`, **no `position`**: capacity 2, `chatter: "coffee"`, `affordance.overhearRadius: 360`, object-level `"offWhen": "wh_staff_upset"`. Hand-write `useFrom` and `queue.cells` after measuring. New object `zainab_laptop` (on the glass coffee table), a readable object and not a PC: `readable: true`, `readDisplay: "gameDisplay"`, `takeable: false`, `workstation: true`, `owner: "zainab_hussain"`, `text` and `textVariants` (section 4), no `lockType`, not solid (a table-top object that must not block the sofa approach). Its type draws `laptop1` and must not be a preset type: `laptop1` is not in the `desk_pc` types (`data/office-presets.json`, which lists `pc`, `laptop` and others; `systems/office-presets.js:49` to `:57`), so it takes no desk preset, no `satisfies: "work"` and no capacity. Stage 0 confirms with `--office-summary`. | Keep every use cell, queue cell and walk clear of the doorway north to the hallway and of Ffion's desk cell. Declare any same-image twin of `coffee_station1` in the room as well. |
| `main_hallway` (`:1398`, loads when the player walks north; motion light) | Declare Tiled `water_cooler1` (at 192,74) as `hallway_cooler`, no `position`: capacity 2, `chatter: "cooler"`, `overhearRadius: 360`, `"offWhen": "wh_staff_upset"`. | The night-transition trigger room. No new `room_entered:main_hallway` mapping apart from the re-hide in section 2. The cooler is live only after the hallway has loaded; until then thirst finds no source and parks. |
| all other rooms | none | `needsRooms` keeps the pair out. |

No new rooms and no lighting change. The hallway's motion light is on whenever the player is there by day.

Needs (starting values, tuned in stage 4):

| NPC | need | decay per min | urgent at | initial | jitter |
|---|---|---|---|---|---|
| Zainab | caffeine | 8 | 30 | 80 | 15% |
| Zainab | thirst | 4 | 30 | 95 | 15% |
| Yusuf | caffeine | 6 | 30 | 85 | 15% |
| Yusuf | thirst | 3 | 30 | 90 | 15% |

The first natural coffee trip falls six to nine minutes in, well after the briefing; natural thirst would take 16 to 20 minutes, which the day act may never reach. Mapped breaks give each machine one paired visit while the player is around. Each has `delayMs: 2000` and the condition `globalVars.mission_phase !== 'act2_infiltration' && !globalVars.wh_staff_upset`:

- Coffee (short trip, laptop left open): `conversation_closed:ffion_rees`, `cooldown: 120000`, sets Yusuf `needs: { set: { caffeine: 20 } }`. Coupled one way: `npc_use_started:reception_coffee` with `data.npcId === 'yusuf_demir'` sets Zainab's caffeine to 20 (`cooldown: 120000`).
- Cooler (long trip, laptop locked): `room_entered:reception_lobby` with `data.previousRoom === 'main_hallway'`, `cooldown: 150000`, sets Zainab `thirst: 20`. The hallway has loaded by then, so the cooler is live. Coupled one way: `npc_use_started:hallway_cooler` with `data.npcId === 'zainab_hussain'` sets Yusuf's thirst to 20 (`cooldown: 150000`). The player, just back in reception, sees the locked laptop and can hear the pair faintly through the open door.

Stage 4 measures the staff's lanes with the player standing at Ffion's approach cell, so a player talking to her does not jam the walk to the coffee station.

## 4. Levers

One lever, optional content only.

**Zainab's open laptop (security window).** Her post is her laptop. When a need takes her away (`npc_left_post`), her habit decides the screen:

```jsonc
"habits": { "screen": { "lockChance": 1, "lockIfAwayOverSeconds": 45 } }
```

A coffee trip inside reception is short and leaves it open. A cooler trip to the hallway is long and locks it. The 45 s threshold is a starting value: stage 4 measures `expectedAwayMs` (from `npc_left_post`) and the real time away for both trips, five tries each, and sets the threshold between them. The open window should last at least 20 seconds, which the paired coffee chat gives; if it does not, the coffee station's use time is raised for this object only. There is no password anyone can learn, so a locked laptop stays shut; the lesson is the one the course teaches (lock the screen when you walk away, even for a minute). If she comes back while the player is at it, `npc_caught_at_post:zainab_hussain` plays one bark (`cooldown: 30000`).

The laptop must not be readable over her shoulder, and the engine does not refuse it: `systems/interactions.js:960` to `:966` calls `workstationState.onInteract` and then lets the normal interaction run whatever the answer, the `in_use` refusal exists only on the `lockType: "login"` path (`systems/unlock-system.js:470` to `:490`), and an attended owner emits nothing (`systems/workstation-state.js:57`). The gate is the text itself. The laptop is a readable object (section 3) whose `textVariants` (schema `scripts/scenario-schema.json:5216`; evaluator `utils/conditional-text.js`, which supports `!` and `&&`) are tried in this order:

1. Night, `globalVars.mission_phase === 'act2_infiltration'`: the lid is shut, she has gone home.
2. Locked, `globalVars.zainab_laptop_screen_locked`: the screen is locked.
3. Away and open, `globalVars.zainab_laptop_owner_away`: the lore below.
4. Otherwise (the base `text`, attended): "Zainab's working on it."

What the away-and-open variant shows (written in stage 4 and checked against this list): her week of client-site jobs, a reminder from Victoria that client data stays on client kit, and Zainab's own unanswered message to the team asking who "the after-hours lot" are. It holds no password, PIN, card number, key code, server room detail, `Sterling2010`, `5829`, VM flag or hint to any of them, and no route to `receptionist_badge`, `victoria_keycard_clone`, the exec office key lock, the safe or the drop site. Neither the attended, locked nor night variant shows anything. Neither staffer carries a card, keycard or key; their lanyards are part of the sprite only, and each conversation says so in-world.

Optional task: none. Reading the laptop completes nothing, so nothing can become required. The lever survives in this readable form; no object-level open condition is needed.

## 5. Physical-pentest openings

None. The laptop window teaches unattended-screen risk through what the player reads, and opens no room, container, lock or account. The tailgating exchange (section 6) makes a human-factors point as dialogue only. No text here names an attack technique, so no technical writing hand-off is needed.

## 6. Spoken lines

Every line is scenario data: NPC `chatter` pools, ink knots, or mapping `bark` fields. Pool and exchange lines are 40 characters or fewer, one line each, no variables, no speaker prefix, no clock times. Exchanges are ink knots heard once (`heard_<knot>`), each first line stands alone, and each is gated with the object form of `requireGlobal` used in m02. Drafts for the writer slice:

Pool lines:

| Speaker | Pool | Line | Chars |
|---|---|---|---|
| Zainab | coffee | Van's on a yellow line. Two minutes. | 36 |
| Zainab | coffee | Three sites today. This is my lunch. | 36 |
| Zainab | coffee | Milk's off again. Who buys the milk? | 36 |
| Zainab | coffee | Cardiff traffic's worse than Leeds. | 35 |
| Zainab | cooler | Eight years in vans. I live on water. | 37 |
| Zainab | cooler | The cups have walked off again. | 31 |
| Zainab | cooler | My laptop's on two per cent. | 28 |
| Zainab | cooler | Last site had no signal at all. | 31 |
| Yusuf | coffee | My client's twenty minutes late. | 32 |
| Yusuf | coffee | Is there any proper coffee left? | 32 |
| Yusuf | coffee | Strong, no sugar. Like my passwords. | 36 |
| Yusuf | coffee | Report's due Friday. It's Thursday. | 35 |
| Yusuf | cooler | Back-to-back calls all morning. | 31 |
| Yusuf | cooler | This cooler wants a service. | 28 |
| Yusuf | cooler | Patching on a Thursday. Brave. | 30 |
| Yusuf | cooler | Bluebirds won, I'm told. | 24 |

Exchanges (owner Zainab, `with: "yusuf_demir"`, at either machine). Each `requireGlobal` includes `{ "wh_staff_upset": false, "receptionist_ko": false, "zainab_ko": false, "yusuf_ko": false }`.

`ex_open_door`:

| Speaker | Line | Chars |
|---|---|---|
| Zainab | Sterling says her door's always open. | 37 |
| Yusuf | It is. Nobody gets past it. | 27 |
| Zainab | Who are the after-hours lot, then? | 34 |
| Yusuf | Not our clients. Not our business. | 34 |

`ex_tailgate`:

| Speaker | Line | Chars |
|---|---|---|
| Zainab | Someone followed me in this morning. | 36 |
| Yusuf | And you held the door for them. | 31 |
| Zainab | They had a lanyard. And a coffee. | 33 |
| Yusuf | A coffee isn't a badge. Write it up. | 36 |

`ex_client_sites` (adds `"reception_badge_cloned": true`; the global exists at `scenario.json.erb:729`, default `false` at `:2046`):

| Speaker | Line | Chars |
|---|---|---|
| Yusuf | Is Danny back from client sites yet? | 36 |
| Zainab | Evenings only, these days, I hear. | 34 |
| Yusuf | Must be some client. | 20 |

None of these is a clue, and none places Danny, Victoria or Terry. The `ex_client_sites` reply repeats Ffion's own public line about Danny's evenings.

Conversations (one small ink file each, `ink/m03_npc_zainab_hussain.ink` and `ink/m03_npc_yusuf_demir.ink`): a greeting, two or three topics and a goodbye, about 10 to 12 lines each.

- Zainab: why she works on the sofa (the bench room is full of kit); eight years on the road and the move to Cardiff; the badge question closed in-world ("Visitor passes are Ffion's job, not mine.").
- Yusuf: waiting on a late client; what a senior consultant actually does (mostly reports and meetings); the move from an in-house security job.

Ffion's "Who else works here?" answer (`ink/m03_npc_ffion_rees.ink:175`, routing to `ask_danny`) names only Danny and never rules out other staff, so neither conversation contradicts it. Each opener differs from every pool line.

Barks (voiced by hand, outside the extractor): Yusuf on Ffion's KO ("Zainab, ring someone. Now."); Zainab catching the player at her laptop ("That's my laptop. Can I help you?").

Existing lines changed: none.

Count: 16 pool lines, 11 exchange lines, about 22 conversation lines, 2 barks: about 51 clips, all new and all needing the user's voicing yes.

## 7. Sync budget

| Item | New keys | Notes |
|---|---|---|
| NPC visibility records | 2 | `setVisible` state for each new NPC |
| Hostility records | 2 | `npcHostility` for an attacked staffer (`state-sync.js:43`); bounded |
| KO globals | 2 | `zainab_ko`, `yusuf_ko`; monotonic |
| Attack, witness and machine-off globals | 5 | `zainab_attacked`, `yusuf_attacked`, `wh_staff_attacked`, `wh_staff_witnessed`, `wh_staff_upset`; monotonic |
| Workstation globals | 2 | `zainab_laptop_owner_away`, `zainab_laptop_screen_locked`; non-monotonic, last write wins is fine because nothing on the server reads them for a lock |
| `heard_` keys | 3 | one per exchange; monotonic |
| `onceOnly` mapping records | 2 | the two HaX texts |
| Ink state | 2 | one small conversation state per new NPC; bounded |
| Office-life items | 0 | nothing takeable |

Twenty bounded scalar keys, each sent as a per-key delta when it changes. Nothing grows. Needs levels are not synced; a reload resets them to the posts.

## 8. Field names

NPC: `needs`, `needsHome`, `needsRooms`, `needsCompany.groups`, `chatterCooldownMin: 2`, `chatter` pools (`coffee`, `cooler`), `exchanges[{with, knot, requireGlobal}]`, `habits.screen.lockChance`, `habits.screen.lockIfAwayOverSeconds`, `behavior.hostile.leash`, `globalVarOnKO`, `voice`, `spriteSheet`, `storyPath`. Object: `officePresets` (scenario), `affordance.overhearRadius`, `offWhen` (object level, one global name), `useFrom`, `queue.cells`, `workstation`, `owner`, `readable`, `readDisplay`, `takeable`, `text`, `textVariants`. Mapping: `eventPattern`, `condition`, `delayMs`, `cooldown`, `setVisible`, `needs.set`, `patrolOverride.targetTile`, `setGlobal`, `sendTimedMessage`, `bark`, `onceOnly`. All at `FormatUpgrade.current`, none inside an ERB loop or tag.

## 9. Costs and approvals

For the shared decisions page, with a Copy picks box:

1. **Laptop lever.** Recommend yes.
2. **Voicing** of about 51 new clips, after the words are signed off. Recommend yes then.
3. Settled: the cast pair (D58), the three dependencies of section 11, and Ffion unchanged.

Sprites: `zainab_hussain` and `yusuf_demir` are on main with walk atlas, headshot, talk sheet and visemes, and neither clashes with an m03 key or with m03's `validSprites` player looks. Seated frames and drink, phone and use pose frames for both arrive with the pose-art train on `build/ol-pose-art`, a dependency (section 11); until it lands, the poses do not show.

Art gaps: 0 new characters, 0 new objects (the laptop uses `laptop1`).

## 10. Test plan

Walkthrough: the scripted walkthrough must pass unchanged with office life on, including both badge routes (conversation and KO), both card routes (clone and Victoria KO), the night turn and the night acts.

Live office-life checks (five tries each at walking pace, a fresh game each):

1. Both staff reach `using` at `reception_coffee`, each on its own cell; no `npc_job_failed` with `no_beside_cell`. Until `build/ol-pose-art` is merged this tests standing posts; Yusuf sitting in the club chair and Zainab on the sofa is tested in slice 7.
2. A pair at the cooler after the player's first return from the hallway; nobody blocks the reception to hallway doorway.
3. No chatter audio, no exchange line voiced and no chatter toast while the briefing, a Ffion conversation or the night scene is open; the exchange plays afterwards and `heard_<knot>` is set only then.
4. Laptop open after a coffee trip, locked after a cooler trip; caught bark on return; the attended, locked and night variants show no lore, and only the away-and-open variant does.
5. Card cloned: both staff hidden before the player reaches the hallway, whether they were in reception, at the cooler or mid-walk through the doorway. The same after a Victoria KO.
6. Attack probe through player combat (the bridge KO helper emits no `npc_attacked`): a moving staffer, a seated one, one going through the doorway. The leash holds, the machines go off, HaX texts once.
7. Ffion KO by day with both present: both walk to their posts and stay, bark, HaX text, no exchange, badge on the floor as before.
8. Terry's LOS window, the server room and the conference room never see a staffer (`window.__test.needs`).
9. Attack one staffer by day and leave them conscious; clone the card; at night, KO Terry: the music returns from the fight playlist, and the hidden staffer never attacks. This relies on the hidden-hostiles dependency.

Reload checks: reload by day (staff back at posts, `heard_` keys kept, an unplayed exchange can still play); reload after the card is cloned and before the hallway; reload at night (staff stay hidden in reception and the hallway). A reload in the middle of an exchange that the player has overheard at least one line of loses the rest (the cut exchange sets `heard_<knot>`); that is accepted.

Expected lock and key diff: empty, apart from at most one unlocked readable node for `zainab_laptop` if the graph lists unlocked PCs.

## 11. Dependencies that land on main before m03 implementation

m03 builds no engine change. Three branches land first, and the m03 build starts after all three are on main.

**E-m03-1: chatter muted during a conversation, with the D34 faint-chatter work, on `build/ol-chatter`.** Gap: `world.playerHears` (`systems/npc-needs.js:5403` to `:5422`) checks room, radius, light and line of sight only. Exchange and call lines go to `world.speak` (`:5427` to `:5440`) with `knot` or `call` set, which sends them to `npcChatterVoice.say` and forces a toast through `mustShowChatter` whatever `overheard` says. In m03 the briefing, Ffion's conversations and the night scene all run in reception, the pair's room. The branch mutes chatter, `world.speak` included, while a person-chat or phone-chat is open. Acceptance checks, run against that branch before m03 starts:

1. The chat gate copies the rule in `systems/office-room-tone.js:101` to `:106` (`chatOpen()`): no `MinigameFramework.currentMinigame` (`minigames/framework/minigame-manager.js:6`) means no chat; otherwise the constructor name matches `PersonChat|PhoneChat` or the type field says person or phone chat. It does not read `currentConversationMinigameType` alone, because phone-chat sets that field (`minigames/phone-chat/phone-chat-minigame.js:397`, `:406`, `:503`) and never clears it (only person-chat does, `minigames/person-chat/person-chat-minigame.js:2009`), so after Victoria's day-KO phone call (`scenario.json.erb:1142` to `:1149`) chatter would stay muted for the rest of the day. Unit test: a stale `'phone-chat'` type with no current minigame does not mute.
2. Both m03 cutscenes are person-chat (`night_transition`, `:1366` to `:1370`; the briefing is a `timedConversation`, `:653` to `:660`, opened as person-chat), so the gate covers them.
3. An exchange already in progress when a chat opens does not advance. Once an exchange starts, later lines go to `speak` whatever `overheard` says (`systems/npc-needs.js:4350` to `:4371`) and the exchange counts as heard after one overheard line (`:3011`), so the branch holds it within `holdCap` through `_holdExchange` (near `:4352`); if the cap passes it is cut under the existing heard rule. Unit test.
4. `npcChatterVoice.say` (`systems/npc-needs-chatter.js:237` to `:262`) re-checks the chat gate inside the queued function before playing. Unit test.
5. Turns become pictures while a chat is open; an exchange with no line overheard fires nothing and stays unplayed, so it is offered again later. `speak` makes no `say` call and no toast for pool, exchange and call lines while a chat is open. An exchange run entirely under an open chat sets no `heard_` key.
6. Live proof on a keyless server: open the conversation before the pair meets; no `/tts` request, no toast and no `npc_overheard` while it is open; close it; the exchange plays and sets `heard_`. Regression: `test_needs_sims` pairs still talk, and m02's live office-life check passes.

**Hidden hostiles do not hold back `all_hostiles_ko`, on `build/ol-hidden-hostiles`.** `anyHostilesAlive()` (`music/scenario-music-events.js:164` to `:178`, waited on at `:418` to `:424`) skips an NPC whose recorded `setVisible` state is `false` (`systems/npc-manager.js:2208` `recordNpcVisibility`, the `_npcVisibility` map). An NPC that is only `initiallyHidden` and never set keeps today's behaviour, so m10 is unchanged: m10 has `initiallyHidden` hostiles (`scenarios/m10_full_disclosure/scenario.json.erb:2236`, `:2263`, `:2284`, `:2330`) and an `all_hostiles_ko` event (`:1357`), and its music events are on the branch's regression list. Nothing changes in the hostile tick, since a hidden NPC cannot attack. m03 stage 1 only records that the branch has landed.

**Pose art, on `build/ol-pose-art`.** Seated and pose frames for Zainab and Yusuf. Without them no seat move happens (section 2), so m03's sit checks wait for it (stage 7).

Fallback if the chatter branch is refused or slips: post both staff in the hallway beside the cooler and leave reception to Ffion (the long reception dwell and the laptop lever are lost), or keep the reception posts, start the needs high and drop the Ffion-conversation break. Either keeps chatter out of the room where the conversations run.

## 12. Staged implementation

0. Baseline in `scenarios/m03_ghost_in_the_machine/office_life/`: validator info lines, `--office-summary` (confirming that `officePresets` changes no existing object and that the laptop takes no preset), `lock_key_diff.rb --write`, V6 clip count.
1. Stage 1 checks, only what grep cannot settle: whether NPC mappings are registered by the first-frame `room_entered`; whether a `onceOnly` mapping whose condition fails is consumed; the staff lanes and the real time away for each trip (five tries each). It also records that the three dependencies of section 11 are on main.
2. Dependencies on main: `build/ol-chatter` (acceptance checks 1 to 6), `build/ol-hidden-hostiles` (with the m10 music regression) and, for slice 7, `build/ol-pose-art`. Slice 3 does not start before the first two.
3. `build/ol-m03`: objects, presets, the two NPCs, needs, posts, leashes, hide mappings, KO and attack handling. Measure `useFrom`, queue cells, seats and lanes.
4. Laptop habit, its `textVariants` and lore text; measure the open window.
5. Pools, exchanges, conversations, barks. `DIALOGUE_SAMPLE.md` to the user first.
6. Dressing and lighting check of reception and the hallway (no layout change expected).
7. Merge main once `build/ol-pose-art` has landed; test the sit half (Yusuf's club chair, Zainab's sofa) and re-measure seats and pairings with the pose frames.
8. Voice, then the lab-sheet impact note (none expected; the laptop is lore).

After each slice: ink compiles and lints, validator 0 errors, the `--office-summary` diff shows only the two new NPCs, the lock and key diff is as expected, the door alignment check passes, and the slice is committed by explicit path before any live test.
