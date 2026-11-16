# m03 office life: plan

Mission: `scenarios/m03_ghost_in_the_machine` (WhiteHat Security, Callaghan Square, Cardiff; a front for Zero Day Syndicate). Branches: `plan/ol-m03` for this plan, `build/ol-m03` for the build, and a separate engine branch for the one engine change (section 11). Method: `.claude/skills/mission-office-life/SKILL.md`. Worked example: m02's `scenarios/m02_ransomed_trust/office_life/PLAN.md`.

Status: plan for review. Nothing built. Scope (b) is decided (D52). The cast reuses two Cyber Aware course characters as extras (D53); the pair below still needs the user's yes.

## 1. Aim and tier

m03 has a working afternoon followed by an empty building at night. The day act is three rooms: reception (briefing cutscene at load, signing in with Ffion, cloning her badge), the main hallway, and the conference room (Victoria; cloning her card). The night turn is the `night_transition` narrator cutscene, which plays on the first `main_hallway` entry after `mission_phase` becomes `act2_infiltration`, and sets `clone_call_done` when it closes. HaX already says "you leave with the visitors, and we come back after dark", so staff who are gone by then fit the existing text.

Every existing person is story-critical or plot-located, so office life needs new ambient people or nothing.

**Tier 2, scope (b):** two day-only ambient staff in reception. They work from the waiting area, take coffee at the reception coffee station, walk to the hallway cooler once the hallway has loaded, chat in pools, play up to three once-only exchanges, and are gone by the night turn. One player lever: a security window on one staffer's laptop. The four story NPCs are unchanged.

- Under scope (a) (Tier 0) there would be no new NPCs, no engine change and no lines.
- Under scope (c) (night life, for example a cleaner) the hide mapping would invert to a show on `clone_call_done`, night rooms are dark so `playerHears` fails and chatter mostly becomes pictures, and the cleaner would have to stay out of Terry's line-of-sight window and the server room.

## 2. People

Story NPCs (unchanged; none gains needs):

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Ffion Rees `ffion_rees` (`scenario.json.erb:700`) | story-critical (badge source, `taskOnKO clone_reception_badge`) | reception desk | n/a | none | n/a | none | (1) no needs | existing KO behaviour; badge drops |
| Victoria Sterling | story-critical (card source; hidden on `victoria_choice_made`) | conference room | n/a | none | n/a | none | (1) | existing |
| Terry Mott | patrolling; night LOS challenge | exec wing | n/a | never | n/a | none | (1) | existing |
| Danny Foster | plot-located; `initiallyHidden`, night reveal | his office | n/a | none | n/a | none | (1) | existing |
| narrator, HaX, phone and cutscene records | cutscene or phone only | n/a | n/a | never | n/a | n/a | (1) | n/a |

New ambient staff, reused from the Cyber Aware course cast:

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Zainab Hussain `zainab_hussain` | ambient | `needsHome: "zainab_laptop"` (new object on the glass coffee table), `useFrom` on the west place of `leather_sofa1` | `needsRooms: ["reception_lobby", "main_hallway"]` | caffeine (coffee station), thirst (hallway cooler) | `needsCompany.groups: ["whitehat_day"]`; no avoids | `habits.screen` on her laptop (section 4) | (1) no story beat depends on her; hidden before the night turn | `behavior.hostile.leash: true`; `globalVarOnKO: "zainab_ko"`; sets `wh_staff_attacked` |
| Yusuf Demir `yusuf_demir` | ambient | coordinate home on the east club chair (`club_chair_e1`, a `STATIC_SEATS` place, `seating.js:150` to `:156`) | same | caffeine, thirst | same group | none | (1) | as above; `globalVarOnKO: "yusuf_ko"` |

**Who they are.** Both keep their course identity: name, look, voice, temperament and kind of job. In m03 they are ordinary WhiteHat employees with no knowledge of the Zero Day side; nothing in the game links them to the course.

- Zainab Hussain: British Bangladeshi, mid-thirties, northern English accent; in the course a field service engineer who has worked from vans and trains for eight years, steady and down-to-earth. At WhiteHat she sets up and collects test kit at client sites, and hot-desks on the reception sofa between jobs because, as she says, the bench room is full of kit. Voice `Achernar`.
- Yusuf Demir: British Turkish, mid-forties, British accent; in the course an information security lead, steady and practical. At WhiteHat he is a senior consultant who came over from an in-house security role, and today he is waiting in reception for a client who is running late. Voice `Alnilam`.

Neither voice is among the eight m03 already uses (Algenib, Aoede, Charon, Enceladus, Kore, Despina, Algieba, Iapetus). The other course hosts were set aside: Nilesh Solanki, Delphine Arvanitis and Tomasz Wiśniewski use voices m03 already has; Gwen Pritchard would make a second South Wales woman beside Ffion; Ama Owusu is a sound alternative to Zainab (section 9).

Cast diversity: the m03 cast is Ffion (Welsh, mid-twenties, F), Victoria (RP, late forties, F), Terry (South London, fifties, M) and Danny (Nottingham, late thirties, M). The pair adds a British Bangladeshi woman in a hijab and a British Turkish man, and neither repeats m02's new pair (Somali and Filipino).

Compatibility: colleagues who get on. Yusuf is the careful one, Zainab is dry about it. Neither has reason to avoid Ffion, and Ffion has no needs, so she never shares an object with them.

**Day only.** Each new NPC carries three hide mappings, all `setVisible: false`, none `onceOnly`:

1. `global_variable_changed:mission_phase` with `data.value === 'act2_infiltration'` (the event carries `{ name, value, oldValue }`, `inventory.js:629`, `npc-game-bridge.js:36`). `mission_phase` flips on `objective_task_completed:clone_rfid_card` (`scenario.json.erb:919` to `:923`), which completes in the conference room, so the player does not see anyone vanish. If a staffer was at the hallway cooler, the hallway the player walks into is empty, and the night scene follows at once.
2. `global_variable_changed:clone_call_done` with `data.value === true` (backstop).
3. `room_entered:reception_lobby` and `room_entered:main_hallway`, condition `globalVars.mission_phase === 'act2_infiltration'` (re-hide on entry, as Victoria's mappings do at `:1495` to `:1501`).

A hidden NPC is `blocked` in the needs tick and its job is aborted (`npc-needs.js:1414` to `:1420`). `setVisible` state is saved and restored on reload (`core/game.js:1811` to `:1816`), which is the main guard after a reload; mappings 1 and 2 do not fire again then. On the first frame `room_entered:<start room>` fires once with `previousRoom` null (`core/rooms.js:3195` to `:3226`), and whether NPC mappings are registered by then is measured in stage 4. Mapping 3 covers the case where they are not, from the player's first room change.

**Ffion knocked out by day.** The badge KO route stays open. A mapping on `npc_ko:ffion_rees` with `globalVars.mission_phase !== 'act2_infiltration'` sets `wh_staff_witnessed`. Two further mappings on the same event, one per staffer and each conditioned on that staffer's own attack global being unset, send them home with `patrolOverride.targetTile` set to the post, where the script holds them (a scripted walk suspends needs). A hostile staffer is left to the hostile behaviour. Yusuf plays one bark. HaX gets one text: "Reception had company. Get the badge and get out." The staff neither fight nor leave the room: either would add a fight or a walk to an alternative badge route. Both machines carry `offWhen` on `wh_staff_witnessed`, so no chatter or exchange plays over an unconscious receptionist. Credits get one `warning` line for this outcome.

**Attacks.** Hitting either staffer sets `wh_staff_attacked` and that staffer's own `zainab_attacked` or `yusuf_attacked` (mappings on `npc_attacked:<id>`, the m02 pattern); both machines go off on `wh_staff_attacked`; HaX texts once ("Leave the staff alone. You're here to clone cards, not start fights."); the credits carry a `warning` line for a staff KO and one for an attack without KO. Ffion's own KO handling is unchanged. A hostile staffer is leashed to the room they were hit in, which may be reception, the start room and the badge room: a player who punches one deals with them before talking to Ffion. That is self-inflicted and matches m02.

**A hostile staffer at the night turn.** A staffer who was attacked and is still conscious when `mission_phase` flips is hidden like the other. m03's music uses `all_hostiles_ko` (`scenario.json.erb:162` to `:165`), whose handler waits while `anyHostilesAlive()` is true (`music/scenario-music-events.js:418` to `:424`). Stage 1 reads that function and the hostile tick. If either counts a hidden NPC, the engine branch gains a second part: a hidden NPC is neither hostile-alive nor able to attack (section 11).

## 3. Rooms and objects

Set scenario `officePresets: true`. It applies across the whole scenario, so stage 0 lists every object V1 says gains a preset (a `pc` with no `lockType` gains a desk preset), including story objects such as `phone4` and `usb_bowl1` in reception and the night rooms' PCs. Each story object is opted out through the schema's object-level opt-out, or its preset is kept only if it changes nothing the player can do.

| Room | Change | Notes |
|---|---|---|
| `reception_lobby` (`:586`, start, always loaded) | Declare Tiled `coffee_station1` (at 262,230) as `reception_coffee`, **no `position`**: capacity 2, `chatter: "coffee"`, `affordance.overhearRadius: 360`, object-level `offWhen` on `wh_staff_attacked` and on `wh_staff_witnessed`. Hand-write `useFrom` and `queue.cells` after measuring. New object `zainab_laptop` (sprite `laptop1`, on the glass coffee table): `type: "pc"`, `workstation: true`, `owner: "zainab_hussain"`, no `lockType`, not takeable, not solid (a table-top object that must not block the sofa approach), readable lore only (section 4). | Keep every use cell, queue cell and walk clear of the doorway north to the hallway and of Ffion's desk cell. Declare any same-image twin of `coffee_station1` in the room as well. |
| `main_hallway` (`:1398`, loads when the player walks north; motion light) | Declare Tiled `water_cooler1` (at 192,74) as `hallway_cooler`, no `position`: capacity 2, `chatter: "cooler"`, `overhearRadius: 360`, same `offWhen`. | The night-transition trigger room. No new `room_entered:main_hallway` mapping apart from the re-hide in section 2. The cooler is live only after the hallway has loaded; until then thirst finds no source and parks. |
| all other rooms | none | `needsRooms` keeps the pair out. |

No new rooms and no lighting change. The hallway's motion light is on whenever the player is there by day.

Needs (starting values, tuned in stage 4):

| NPC | need | decay per min | urgent at | initial | jitter |
|---|---|---|---|---|---|
| Zainab | caffeine | 8 | 30 | 80 | 15% |
| Zainab | thirst | 4 | 30 | 95 | 15% |
| Yusuf | caffeine | 6 | 30 | 85 | 15% |
| Yusuf | thirst | 3 | 30 | 90 | 15% |

The first natural coffee trip falls six to nine minutes in, well after the briefing; natural thirst would take 16 to 20 minutes, which the day act may never reach. Mapped breaks give each machine one paired visit while the player is around. Each has `delayMs: 2000` and the condition `globalVars.mission_phase !== 'act2_infiltration' && !globalVars.wh_staff_attacked && !globalVars.wh_staff_witnessed`:

- Coffee (short trip, laptop left open): `conversation_closed:ffion_rees`, `cooldown: 120000`, sets Yusuf `needs: { set: { caffeine: 20 } }`. Coupled one way: `npc_use_started:reception_coffee` with `data.npcId === 'yusuf_demir'` sets Zainab's caffeine to 20 (`cooldown: 120000`).
- Cooler (long trip, laptop locked): `room_entered:reception_lobby` with `data.previousRoom === 'main_hallway'`, `cooldown: 150000`, sets Zainab `thirst: 20`. The hallway has loaded by then, so the cooler is live. Coupled one way: `npc_use_started:hallway_cooler` with `data.npcId === 'zainab_hussain'` sets Yusuf's thirst to 20 (`cooldown: 150000`). The player, just back in reception, sees the locked laptop and can hear the pair faintly through the open door.

No mapping is added on `room_entered:main_hallway` apart from the re-hide. Stage 4 measures the staff's lanes with the player standing at Ffion's approach cell, so a player talking to her does not jam the walk to the coffee station.

## 4. Levers

One lever, optional content only.

**Zainab's open laptop (security window).** Her post is her laptop. When a need takes her away (`npc_left_post`), her habit decides the screen:

```jsonc
"habits": { "screen": { "lockChance": 1, "lockIfAwayOverSeconds": 45 } }
```

A coffee trip inside reception is short and leaves it open. A cooler trip to the hallway is long and locks it. The 45 s threshold is a starting value: stage 4 measures `expectedAwayMs` (from `npc_left_post`) and the real time away for both trips, five tries each, and sets the threshold between them. The open window should last at least 20 seconds, which the paired coffee chat gives; if it does not, the coffee station's use time is raised for this object only. There is no password anyone can learn, so a locked laptop stays shut; the lesson is the one the course teaches (lock the screen when you walk away, even for a minute). If she comes back while the player is at it, `npc_caught_at_post:zainab_hussain` plays one bark (`cooldown: 30000`).

What it shows (written in stage 3 and checked against this list): her week of client-site jobs, a reminder from Victoria that client data stays on client kit, and Zainab's own unanswered message to the team asking who "the after-hours lot" are. It holds no password, PIN, card number, key code, server room detail, `Sterling2010`, `5829`, VM flag or hint to any of them, and no route to `receptionist_badge`, `victoria_keycard_clone`, the exec office key lock, the safe or the drop site. Neither staffer carries a card, keycard or key; their lanyards are part of the sprite only.

Optional task: none. Reading the laptop completes nothing, so nothing can become required.

To settle in stage 1: what the access model does when the player opens a workstation while its owner is at it (ACCESS_MODEL_PLAN 5.4). The laptop must not be readable over her shoulder.

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

Exchanges (owner Zainab, `with: "yusuf_demir"`, at either machine). Each `requireGlobal` includes `{ "wh_staff_attacked": false, "wh_staff_witnessed": false, "receptionist_ko": false, "zainab_ko": false, "yusuf_ko": false }`.

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
| Zainab | Not seen him once this month. | 29 |
| Yusuf | Must be some client. | 20 |

None of these is a clue, and none places Danny, Victoria or Terry.

Conversations (one small ink file each, `ink/m03_npc_zainab_hussain.ink` and `ink/m03_npc_yusuf_demir.ink`): a greeting, two or three topics and a goodbye, about 10 to 12 lines each.

- Zainab: why she works on the sofa (the bench room is full of kit); eight years on the road and the move to Cardiff; the badge question closed in-world ("Visitor passes are Ffion's job, not mine.").
- Yusuf: waiting on a late client; what a senior consultant actually does (mostly reports and meetings); the move from an in-house security job.

Neither conversation contradicts Ffion's "Who else works here?" answer (stage 1 reads that knot), and each opener differs from every pool line.

Barks (voiced by hand, outside the extractor): Yusuf on Ffion's KO ("Zainab, ring someone. Now."); Zainab caught at her laptop ("That's my laptop. Can I help you?").

Existing lines changed: none. If Ffion's "Who else works here?" branch rules out other staff in reception, that one line changes and is listed here before stage 3.

Count: 16 pool lines, 11 exchange lines, about 22 conversation lines, 2 barks: about 51 clips, all new and all needing the user's voicing yes.

## 7. Sync budget

| Item | New keys | Notes |
|---|---|---|
| NPC visibility records | 2 | `setVisible` state for each new NPC |
| KO globals | 2 | `zainab_ko`, `yusuf_ko`; monotonic |
| Attack and witness globals | 4 | `wh_staff_attacked`, `zainab_attacked`, `yusuf_attacked`, `wh_staff_witnessed`; monotonic |
| Workstation globals | 2 | `zainab_laptop_owner_away`, `zainab_laptop_screen_locked`; non-monotonic, last write wins is fine because nothing on the server reads them for a lock |
| `heard_` keys | 3 | one per exchange; monotonic |
| `onceOnly` mapping records | 2 | the two HaX texts |
| Ink state | 2 | one small conversation state per new NPC; bounded |
| Office-life items | 0 | nothing takeable |

Seventeen bounded scalar keys, each sent as a per-key delta when it changes. Nothing grows. Needs levels are not synced; a reload resets them to the posts.

## 8. Field names

NPC: `needs`, `needsHome`, `needsRooms`, `needsCompany.groups`, `chatterCooldownMin: 2`, `chatter` pools (`coffee`, `cooler`), `exchanges[{with, knot, requireGlobal}]`, `habits.screen.lockChance`, `habits.screen.lockIfAwayOverSeconds`, `behavior.hostile.leash`, `globalVarOnKO`, `voice`, `spriteSheet`, `storyPath`. Object: `officePresets` (scenario), `affordance.overhearRadius`, `offWhen` (object level), `useFrom`, `queue.cells`, `workstation`, `owner`. Mapping: `eventPattern`, `condition`, `delayMs`, `cooldown`, `setVisible`, `needs.set`, `patrolOverride.targetTile`, `setGlobal`, `sendTimedMessage`, `bark`, `onceOnly`. All at `FormatUpgrade.current`, none inside an ERB loop or tag.

## 9. Costs and approvals

For the shared decisions page, with a Copy picks box:

1. **Cast pair.** (a) Zainab Hussain and Yusuf Demir (this plan); (b) Ama Owusu and Yusuf Demir (Black British of Ghanaian heritage, London, mid-forties, voice `Autonoe`; she would take the laptop); (c) Lorna Easton and Yusuf Demir (Lancashire facilities lead, forties, voice `Erinome`). Recommend (a): the field engineer's job explains why she works from reception, and the pair varies age and background most against the m03 cast.
2. **Engine change E-m03-1** (section 11). Recommend yes.
3. **Laptop lever.** Recommend yes.
4. **Voicing** of about 51 new clips, after the words are signed off. Recommend yes then.
5. Ffion: no change (settled).

Sprites: `zainab_hussain` and `yusuf_demir` are on main with walk atlas, headshot, talk sheet and visemes, and neither clashes with an m03 key or with m03's `validSprites` player looks. Seated frames and drink, phone and use pose frames for both are on `build/ol-pose-art` (approved, not yet on main); until it lands the poses simply do not show.

Art gaps: 0 new characters, 0 new objects (the laptop uses `laptop1`).

## 10. Test plan

Walkthrough: the scripted walkthrough must pass unchanged with office life on, including both badge routes (conversation and KO), both card routes (clone and Victoria KO), the night turn and the night acts.

Live office-life checks (five tries each at walking pace, a fresh game each):

1. Both staff reach `using` at `reception_coffee`, each on its own cell; no `npc_job_failed` with `no_beside_cell`.
2. A pair at the cooler after the player has opened the hallway; nobody blocks the reception to hallway doorway.
3. No chatter audio and no exchange line voiced while the briefing, a Ffion conversation or the night scene is open; the exchange plays afterwards and `heard_<knot>` is set only then.
4. Laptop open after a coffee trip, locked after a cooler trip; caught bark on return; not readable while Zainab sits at it.
5. Card cloned: both staff hidden before the player reaches the hallway, whether they were in reception, at the cooler or mid-walk through the doorway.
6. Attack probe through player combat (the bridge KO helper emits no `npc_attacked`): a moving staffer, a seated one, one going through the doorway. The leash holds, the machines go off, HaX texts once.
7. Ffion KO by day with both present: both walk to their posts and stay, bark, HaX text, no exchange, badge on the floor as before.
8. Terry's LOS window, the server room and the conference room never see a staffer (`window.__test.needs`).

9. Attack one staffer by day and leave them conscious; clone the card; at night, KO Terry: the music returns from the fight playlist, and the hidden staffer never attacks.

Reload checks: reload by day (staff back at posts, `heard_` keys kept, an unplayed exchange can still play); reload after the card is cloned and before the hallway; reload at night (staff stay hidden in reception and the hallway). A reload in the middle of an exchange that the player has overheard at least one line of loses the rest (the cut exchange sets `heard_<knot>`); that is accepted.

Expected lock and key diff: empty, apart from at most one unlocked readable node for `zainab_laptop` if the graph lists unlocked PCs.

## 11. Engine change E-m03-1: no overhearing during a conversation (and, if needed, hidden NPCs are not hostile)

Gap: `world.playerHears` (`npc-needs.js:5403` to `:5418`) checks room, radius, light and line of sight only, and `npcChatterVoice.say` (`npc-needs-chatter.js:237` to `:265`) has no minigame check. Exchange lines are voiced at once. In m03 the briefing, Ffion's conversations and the night scene all run in reception, the pair's room.

Change: `playerHears` returns `overheard: false` while a person-chat or phone-chat minigame is open, read from `window.MinigameFramework.currentMinigame` (`minigame-manager.js:6`). Turns become pictures; an exchange with no line overheard fires nothing and stays unplayed, so it is offered again later. No new static import, so the JS test harness copy lists do not change. Stage 1 confirms that both cutscenes run as person-chat and finds the field that names a running minigame's type.

Tests:
- Unit (node, `bin/test-js`): `playerHears` false with a stubbed person-chat open, false with phone-chat, true with none and with an unrelated minigame; an exchange run entirely under an open chat sets no `heard_` key and is offered again.
- Test scenario `scenarios/test_chatter_conversation_mute/`: a pair at a capacity-2 cooler with high starting thirst and one exchange with no gate, plus a talkable NPC in the same room.
- Live proof on a keyless server from the engine worktree: open the conversation before the pair meets; no `/tts` request and no `npc_overheard` while it is open; close it; the exchange plays and sets `heard_`. Regression: `test_needs_sims` pairs still talk.

Possible second part (only if stage 1 finds it needed, section 2): `anyHostilesAlive()` and the hostile tick skip hidden NPCs. Unit test: a hidden, conscious hostile does not hold back `all_hostiles_ko` and does not attack. The same test scenario gains a hostile NPC hidden by a mapping, for the live check.

Fallback if the change is refused or slips: post both staff in the hallway beside the cooler and leave reception to Ffion (the long reception dwell and the laptop lever are lost), or keep the reception posts, start the needs high and drop the Ffion-conversation break. Either keeps chatter out of the room where the conversations run.

## 12. Staged implementation

0. Baseline in `scenarios/m03_ghost_in_the_machine/office_life/`: validator info lines, `--office-summary`, `lock_key_diff.rb --write`, V6 clip count.
1. Engine branch: E-m03-1 with unit tests, test scenario and live proof; merged to main before slice 4.
2. `build/ol-m03`: objects, presets, the two NPCs, needs, posts, leashes, hide mappings, KO and attack handling. Measure `useFrom`, queue cells and seats.
3. Laptop habit and lore text.
4. Pools, exchanges, conversations, barks. `DIALOGUE_SAMPLE.md` to the user first.
5. Dressing and lighting check of reception and the hallway (no layout change expected).
6. Merge main once `build/ol-pose-art` has landed; re-measure seats and pairings with the pose frames.
7. Voice, then the lab-sheet impact note (none expected; the laptop is lore).

After each slice: ink compiles and lints, validator 0 errors, the `--office-summary` diff shows only the two new NPCs, the lock and key diff is empty, the door alignment check passes, and the slice is committed by explicit path before any live test.
