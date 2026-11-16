# m03 office life: plan

Mission: `scenarios/m03_ghost_in_the_machine` (WhiteHat Security, Callaghan Square, Cardiff; a front for Zero Day Syndicate). Branches: `plan/ol-m03` for this plan, `build/ol-m03` for the build, and a separate engine branch for the one engine change (section 11). Method: `.claude/skills/mission-office-life/SKILL.md`. Worked example: m02's `scenarios/m02_ransomed_trust/office_life/PLAN.md`.

Status: plan draft for review. Nothing built. The scope, the cast and the art are still the user's to confirm (section 9).

## 1. Aim and tier

m03 has a working afternoon followed by an empty building at night. The day act is three rooms: reception (briefing cutscene at load, signing in with Ffion, cloning her badge), the main hallway, and the conference room (Victoria; cloning her card). The night turn is the `night_transition` narrator cutscene, which plays on the first `main_hallway` entry after `mission_phase` becomes `act2_infiltration` and sets `clone_call_done` when it closes. HaX already says "you leave with the visitors, and we come back after dark", so staff who go home at the turn fit the existing text.

Every existing person is story-critical or plot-located, so office life needs new ambient people or nothing.

**Tier 2, scope (b):** two new day-only ambient staff in reception. They sit in the waiting area, take coffee at the reception coffee station, walk to the hallway cooler once the hallway has loaded, chat in pools, play up to three once-only exchanges, and are gone by the night turn. One player lever: a security window on the junior consultant's laptop. The four story NPCs are unchanged.

- Under scope (a) (Tier 0): no new NPCs, no engine change, no lines. The only candidate would be a desk mug for Ffion, which this plan does not take.
- Under scope (c) (night life, for example a cleaner): the hide mapping inverts to a show on `clone_call_done`; night rooms are dark and `playerHears` fails in the dark, so chatter mostly becomes pictures; the cleaner must stay out of Terry's line-of-sight window and the server room. It would also need a fresh look at every night beat. Not planned.

## 2. People

Story NPCs (unchanged; none gains needs):

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Ffion Rees `ffion_rees` (reception desk, `scenario.json.erb:700`) | story-critical (badge source, `taskOnKO clone_reception_badge`) | her desk | n/a | none | n/a | none | (1) no needs | existing KO behaviour; badge drops |
| Victoria Sterling | story-critical (card source, hidden on `victoria_choice_made`) | conference room | n/a | none | n/a | none | (1) | existing |
| Terry Mott | patrolling, night LOS challenge | exec wing | n/a | never | n/a | none | (1) | existing |
| Danny Foster | plot-located, `initiallyHidden`, night reveal | his office | n/a | none | n/a | none | (1) | existing |
| narrator, HaX, phone and cutscene records | cutscene or phone only | n/a | n/a | never | n/a | n/a | (1) | n/a |

New ambient staff (names, ids and looks are placeholders until the user picks the cast):

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Gloria Pinnock `gloria_pinnock` (placeholder): office manager, early sixties, Black Welsh, Butetown | ambient | coordinate home on the east club chair (`club_chair_e1`, a `STATIC_SEATS` place, `seating.js:150` to `:156`), facing the room | `needsRooms: ["reception_lobby", "main_hallway"]` | caffeine (coffee station), thirst (hallway cooler) | `needsCompany.groups: ["whitehat_day"]`; no avoids | none | (1) none of the story beats depend on her; she is hidden before the night turn | `behavior.hostile.leash: true`: stays in the room she was hit in; `globalVarOnKO: "gloria_ko"`; sets `wh_staff_attacked` |
| Rahim Uddin `rahim_uddin` (placeholder): junior consultant, early twenties, British-Bangladeshi, Grangetown | ambient | `needsHome: "rahim_laptop"` (new object on the glass coffee table), `useFrom` on the west place of `leather_sofa1` | same | caffeine, thirst | same group | `habits.screen` on his laptop (section 4) | (1) | as above; `globalVarOnKO: "rahim_ko"` |

Day only. Each new NPC carries three hide mappings (all `setVisible: false`, none `onceOnly`, so a reload re-applies them):

1. `global_variable_changed:mission_phase` with `value === 'act2_infiltration'`. `mission_phase` flips on `objective_task_completed:clone_rfid_card` (`scenario.json.erb:919` to `:923`), which happens in the conference room, so the player never sees them vanish. If they were at the hallway cooler, the hallway the player walks into is empty, and the night scene follows at once.
2. `global_variable_changed:clone_call_done` with `value === true` (backstop).
3. `room_entered:reception_lobby` and `room_entered:main_hallway`, condition `globalVars.mission_phase === 'act2_infiltration'` (re-hide on entry, as Victoria's mappings do at `:1495` to `:1501`).

A hidden NPC is `blocked` in the needs tick and its job is aborted (`npc-needs.js:1414` to `:1420`), and `setVisible` state is saved and restored on reload (`core/game.js:1811` to `:1816`). On a reload after the turn the start-room `room_entered` (fired once with `previousRoom` null, `core/rooms.js:3195` to `:3226`) may run before NPC mappings are registered; mapping 1 and 2 do not fire again on reload, so the restored `setVisible` record is the primary guard and mapping 3 is the backstop. Stage 4 measures which one holds.

**Ffion knocked out by day in front of the staff.** The badge KO route stays open. A mapping on `npc_ko:ffion_rees` with `globalVars.mission_phase !== 'act2_infiltration'` sends both staff `needs: "suspend"` (they freeze where they are) and sets `wh_staff_witnessed`. Gloria plays one bark, and HaX gets one extra text ("Two witnesses in reception. Get the badge and get out."). The staff do not turn hostile and do not leave: either would add a fight or a walk to an alternative badge route. The coffee station and cooler carry `offWhen: "wh_staff_witnessed"` as well, so no exchange plays over an unconscious receptionist. Credits get one `warning` line for this outcome.

**Attacks.** Hitting either staffer sets `wh_staff_attacked` (mapping on `npc_attacked:<id>`, the m02 pattern); both machines carry `offWhen` on it; HaX texts once ("Leave the staff alone. You're here to clone cards, not start fights."); the credits carry a `warning` line for a staff KO and one for an attack without KO. Ffion's existing KO handling is unchanged.

Compatibility: the two are colleagues who get on (she mothers him, he teases her about the visitor book). Neither has reason to avoid Ffion, and Ffion has no needs, so she never shares an object.

Cast diversity: the m03 cast is Ffion (Welsh, mid-twenties, F), Victoria (RP, late forties, F), Terry (South London, fifties, M), Danny (Nottingham, late thirties, M). The pair adds an older Black Welsh woman and a young British-Bangladeshi man, both Cardiff locals, neither repeating m02's new pair (Somali and Filipino). Voices outside the eight m03 already uses: Gloria `Gacrux`, Rahim `Achird` (confirm by ear before voicing).

## 3. Rooms and objects

Set scenario `officePresets: true` (check V1 for every object that gains a preset, especially any `pc` with no `lockType`).

| Room | Change | Notes |
|---|---|---|
| `reception_lobby` (`:586`, start, always loaded) | Declare Tiled `coffee_station1` (at 262,230) as `reception_coffee` with **no `position`**. Capacity 2, `chatter: "coffee"`, `affordance.overhearRadius: 360`, object-level `offWhen` on `wh_staff_attacked` and `wh_staff_witnessed`. Hand-write `useFrom` and `queue.cells` after measuring. New object `rahim_laptop` (sprite `laptop1`, on the glass coffee table, `type: "pc"`, `workstation: true`, `owner: "rahim_uddin"`, no `lockType`, not takeable), with optional lore text only (section 4). | Keep every use cell, queue cell and walk clear of the doorway north to the hallway and of Ffion's desk cell. Declare any same-image twin of `coffee_station1` in the room too (stage 1 lists them). |
| `main_hallway` (`:1398`, loads when the player walks north; motion light) | Declare Tiled `water_cooler1` (at 192,74) as `hallway_cooler`, no `position`. Capacity 2, `chatter: "cooler"`, `overhearRadius: 360`, same `offWhen`. | The hallway is the night-transition trigger room. No new `room_entered:main_hallway` mapping except the hide in section 2. The cooler is live only after the hallway has loaded; until then thirst falls back to nothing and parks. |
| all other rooms | none | `needsRooms` keeps the pair out. |

No new rooms, no new lights. The hallway's motion light is on whenever the player is there by day; the cooler trip happens in a lit room only when the player has walked in.

Needs (starting values, to be tuned in stage 4):

| NPC | need | decay per min | urgent at | initial | jitter |
|---|---|---|---|---|---|
| Gloria | caffeine | 6 | 30 | 85 | 15% |
| Gloria | thirst | 3 | 30 | 90 | 15% |
| Rahim | caffeine | 8 | 30 | 80 | 15% |
| Rahim | thirst | 4 | 30 | 95 | 15% |

At these rates the first natural coffee trip falls six to nine minutes in, well after the briefing cutscene. Mapped breaks bring the pair together sooner when the player is present:

- `conversation_closed:ffion_rees`, `delayMs: 2000`, `cooldown: 120000`, condition `mission_phase !== 'act2_infiltration' && !wh_staff_attacked && !wh_staff_witnessed`: Gloria `needs: { set: { caffeine: 20 } }`.
- `room_entered:reception_lobby` with `data.previousRoom === 'main_hallway'` and the same condition, `delayMs: 2000`, `cooldown: 150000`: Rahim `caffeine: 20`.
- Coupling one way: `npc_use_started:reception_coffee` with `data.npcId === 'gloria_pinnock'` sets Rahim's caffeine to 20 (cooldown 120000). No coupling on the cooler; it stays a solo or chance pairing.

## 4. Levers

One lever, optional content only.

**Rahim's open laptop (security window).** Rahim's post is his laptop. When a need takes him away (`npc_left_post`), the screen locks or stays open by his habit:

```jsonc
"habits": { "screen": { "lockChance": 1, "lockIfAwayOverSeconds": 45 } }
```

A coffee trip inside reception is short and leaves it open; a cooler trip to the hallway is long and locks it. The player can read it while he is away and the screen is open. There is no password anyone can learn, so a locked laptop stays closed; that is the point the lever teaches (lock your screen when you leave it). If Rahim walks back while the player is at it, `npc_caught_at_post:rahim_uddin` plays one bark (cooldown 30000).

What is on it (written in stage 3, checked against this list): his calendar (a client debrief, "DF at client site" for most days), and two chat messages, one from Victoria telling staff the back corridor is out of bounds after six, one from Rahim asking who "the after-hours team" are. It holds no password, PIN, card number, key code, server room detail, `Sterling2010`, `5829`, VM flag or hint to any of them, and no route to `receptionist_badge`, `victoria_keycard_clone`, the exec office key lock, the safe or the drop site. Neither staffer carries a card, keycard or key.

Optional task: none. Reading the laptop completes nothing, so no new task state is synced and nothing can become required.

Open question for stage 1: what the access model does when the player opens a workstation while its owner sits at it (ACCESS_MODEL_PLAN 5.4 screen rule). If nothing prevents it, add a mapping on `npc_caught_at_post` that also fires on the at-post case, or keep the laptop's contents behind the owner-away state through the screen-state rule; whichever holds, the laptop must not be readable over his shoulder.

## 5. Physical-pentest openings

None. The laptop window teaches unattended-screen risk through what the player reads; it opens no room, container, lock or account. The tailgating exchange (section 6) teaches a human-factors point as dialogue only. No text in this plan names an attack technique beyond that, so no technical writing hand-off is needed.

## 6. Spoken lines

Every line is scenario data: NPC `chatter` pools, ink knots, or mapping `bark` fields. Pool lines are 40 characters or fewer, one line, no variables, no speaker prefix, no clock times. Exchanges are ink knots heard once (`heard_<knot>`), and each first line stands alone. These are drafts for the writer slice.

Pool lines:

| Speaker | Pool | Line | Chars |
|---|---|---|---|
| Gloria | coffee | Who's had the last of the oat milk? | 35 |
| Gloria | coffee | This machine's older than you, love. | 36 |
| Gloria | coffee | Two sugars. Don't tell my doctor. | 33 |
| Gloria | coffee | I've signed in four couriers today. | 35 |
| Gloria | cooler | Drink some water, you look peaky. | 33 |
| Gloria | cooler | Cups are in the drawer. Always were. | 36 |
| Gloria | cooler | That cooler wants descaling. | 28 |
| Gloria | cooler | Lovely day out there, mind. | 27 |
| Rahim | coffee | Is this the decaf? Please say no. | 33 |
| Rahim | coffee | Report's due Friday. It's Thursday. | 35 |
| Rahim | coffee | My mam says this job isn't real. | 32 |
| Rahim | coffee | Third one today. Don't judge. | 29 |
| Rahim | cooler | Hydrate or die-drate, innit. | 28 |
| Rahim | cooler | Did the Wi-Fi drop for you too? | 31 |
| Rahim | cooler | I'm meant to be on a call. | 26 |
| Rahim | cooler | Bluebirds won, by the way. | 26 |

Exchanges (Gloria `with: "rahim_uddin"`, at either machine):

`ex_open_door` (no `requireGlobal`):

| Speaker | Line | Chars |
|---|---|---|
| Rahim | Ms Sterling says her door's always open. | 40 |
| Gloria | It is. You just never get past it. | 34 |
| Rahim | Who are the after-hours team, anyway? | 37 |
| Gloria | Not our business, love. Drink your tea. | 39 |

`ex_tailgate` (no `requireGlobal`):

| Speaker | Line | Chars |
|---|---|---|
| Rahim | Someone followed me through the side door. | 42 |
| Gloria | And you held it for them, I suppose. | 36 |
| Rahim | They had a lanyard. And a coffee. | 33 |
| Gloria | A coffee isn't a badge. Write it up. | 36 |

`ex_danny` (`requireGlobal: "reception_badge_cloned"`, optional; drop if that global name does not exist):

| Speaker | Line | Chars |
|---|---|---|
| Rahim | Is Danny ever actually in the office? | 37 |
| Gloria | Client sites. Every day, apparently. | 36 |
| Rahim | His car's in the car park most nights. | 38 |

Exchange lines are not held to 40 characters by the validator, but the drafts keep to about that length.

Conversations (one small ink file each, `ink/m03_npc_gloria_pinnock.ink` and `ink/m03_npc_rahim_uddin.ink`, compiled to JSON beside them): a greeting, two or three topics and a goodbye, about 10 to 12 lines each. Gloria: visitors sign in with Ffion; how long she has been at WhiteHat ("since it was two rooms over a kebab shop"); her grandson wants to be a hacker. Rahim: first job out of university; what a junior does on a pentest (report writing, mostly); the coffee. Neither topic contradicts Ffion's "Who else works here?" answer or places Danny, Victoria or Terry. Each opener differs from every pool line.

Barks (voiced by hand, outside the extractor): Gloria on Ffion's KO ("Rahim, phone someone. Now."), Rahim on being caught at his laptop ("Er, that's mine. Can I help?").

Existing lines changed: none. If Ffion's "Who else works here?" branch names the staff in a way that contradicts two more people in reception, that one line changes and is listed here before stage 3 (stage 1 reads that knot).

Count: 16 pool lines, 11 exchange lines, about 22 conversation lines, 2 barks: about 51 clips.

## 7. Sync budget

| Item | New keys | Notes |
|---|---|---|
| NPC visibility records | 2 | `setVisible` state for each new NPC |
| KO globals | 2 | `gloria_ko`, `rahim_ko`, monotonic |
| Attack and witness globals | 2 | `wh_staff_attacked`, `wh_staff_witnessed`, monotonic |
| Workstation globals | 2 | `rahim_laptop_owner_away`, `rahim_laptop_screen_locked`; non-monotonic, last write wins is fine because the server never reads them for a lock |
| `heard_` keys | 3 | one per exchange, monotonic |
| `onceOnly` mapping records | 2 | the two HaX texts |
| Ink state | 2 | one small conversation state per new NPC, bounded |
| Office-life items | 0 | nothing takeable |

Thirteen bounded scalar keys, each sent as a per-key delta when it changes. Nothing grows. Needs levels are not synced; a reload resets them to the posts.

## 8. Field names

NPC: `needs`, `needsHome`, `needsRooms`, `needsCompany.groups`, `chatterCooldownMin: 2`, `chatter` pools (`coffee`, `cooler`), `exchanges[{with, knot, requireGlobal}]`, `habits.screen.lockChance`, `habits.screen.lockIfAwayOverSeconds`, `behavior.hostile.leash`, `globalVarOnKO`, `voice`, `spriteSheet`, `storyPath`. Object: `officePresets` (scenario), `affordance.overhearRadius`, `offWhen` (object level), `useFrom`, `queue.cells`, `workstation`, `owner`. Mapping: `eventPattern`, `condition`, `delayMs`, `cooldown`, `setVisible`, `needs` (`set`, `suspend`), `setGlobal`, `sendTimedMessage`, `bark`, `onceOnly`. All at `FormatUpgrade.current`; none inside an ERB loop or tag.

## 9. Costs and approvals

To go on the shared decisions page with a Copy picks box:

1. **Scope**: (a) nothing, (b) two day-only staff (this plan), (c) night life. Recommend (b).
2. **Cast**: the placeholder pair above, or another pair from the Cardiff options (Yemeni-Cardiff, Chinese-Welsh). Recommend the placeholder pair; names to confirm.
3. **Art**: new characters for both (concept, walk atlas with the stock six, seated frames, drink, phone and use pose frames, bust, headshot, visemes from a talk run), or keep generic atlases. Until approved, stand-ins: Gloria `female_blowse_v2`, Rahim `male_office_worker_v2`. Both have seated frames and drink, phone and use pose frames on `build/ol-pose-art` (approved, not yet on main). Both are also player looks in m03's `validSprites`, which the user accepted for m02 stand-ins only; the non-player generic with poses, `junior_analyst`, is m08's character and is not reused. Recommend new art for both.
4. **Engine change E-m03-1** (section 11). Recommend yes.
5. **Voicing**: about 51 clips. Recommend yes once the words are signed off.
6. **Laptop lever**: yes or no. Recommend yes.
7. **Ffion**: no change (settled).

Art gaps (listed only, nothing generated): two new character sets as above; no new objects (laptop uses `laptop1`); POV backgrounds unchanged (reception's existing background shows the waiting area; check whether the staff need to appear in it, which they do not, since backgrounds carry no NPCs).

## 10. Test plan

Walkthrough: the mission's scripted walkthrough must pass unchanged with office life on, including the badge route by conversation and by KO, the card route by clone and by Victoria KO, the night turn, and the night acts.

Live office-life checks (five tries each at walking pace, fresh game each):

1. Both staff reach `using` at `reception_coffee`, each on its own cell; no `npc_job_failed` with `no_beside_cell`.
2. A pair at the cooler after the player has opened the hallway; nobody blocks the reception to hallway doorway.
3. No chatter audio and no exchange line voiced while the briefing cutscene, a Ffion conversation or the night scene is open; the exchange plays later and `heard_<knot>` is set only then.
4. Laptop: open after a coffee trip, locked after a cooler trip; caught bark on return; not readable while Rahim is seated at it.
5. Card cloned: both staff hidden before the player reaches the hallway, wherever they were (reception, hallway cooler, mid-walk through the door).
6. Attack probe through player combat (the bridge KO helper emits no `npc_attacked`): a moving staffer, a seated one, one going through the doorway. Leash holds; machines go off; HaX text once.
7. Ffion KO by day with both present: staff freeze, bark, HaX text, no exchange, badge still on the floor.
8. Terry's LOS window, the server room and the conference room never see a staffer (`window.__test.needs`).

Reload checks: reload during the day (staff back at posts, `heard_` keys kept, an unplayed exchange can still play); reload after the card is cloned but before the hallway; reload at night (staff stay hidden in reception and the hallway).

Expected lock and key diff: empty.

## 11. Engine change E-m03-1: no overhearing during a conversation

Gap: `world.playerHears` (`npc-needs.js:5403` to `:5418`) checks room, radius, light and line of sight only, and `npcChatterVoice.say` (`npc-needs-chatter.js:237` to `:265`) has no minigame check. Exchange lines are voiced at once. In m03 the briefing, Ffion's conversations and the night scene all run in reception, the pair's room.

Change: `playerHears` returns `overheard: false` while a person-chat or phone-chat minigame is open. Turns become pictures; an exchange with no line overheard fires nothing and stays unplayed, so it plays again later. Read the open minigame through the existing global framework object (no new static import, so the JS test harness copy lists do not change). Confirm in stage 1 that both cutscenes run as person-chat.

Tests:
- Unit (node, `bin/test-js`): `playerHears` false with a stubbed person-chat open, false with phone-chat, true with none and with an unrelated minigame; an exchange run entirely under an open chat sets no `heard_` key and is offered again.
- Test scenario `scenarios/test_chatter_conversation_mute/`: a pair at a capacity-2 cooler with high starting thirst and one exchange with no `requireGlobal`, plus a talkable NPC in the same room.
- Live proof on a keyless server from the engine worktree: open the conversation before the pair meets, confirm no `/tts` request and no `npc_overheard` while it is open, close it, and confirm the exchange plays and sets `heard_`. Regression: `test_needs_sims` pairs still talk.

## 12. Staged implementation

0. Baseline (`office_life/BASELINE.md`, validator info lines, `--office-summary`, `lock_key_diff.rb --write`, V6 clip count).
1. Engine branch: E-m03-1 with unit tests, test scenario and live proof; merged to main before slice 3.
2. `build/ol-m03`: objects, presets, the two NPCs with stand-in atlases, needs, posts, leashes, hide mappings, KO and attack handling. Measure `useFrom`, queue cells and seats.
3. Laptop habit and lore text.
4. Pools, exchanges, conversations, barks. Send `DIALOGUE_SAMPLE.md` to the user first.
5. Dressing and lighting checks of reception and hallway (no layout change expected).
6. Art swap after approval and after `build/ol-pose-art` lands on main; re-measure seats and pairing.
7. Voice, then lab-sheet impact note (none expected; the laptop is lore).

After each slice: ink compiles and lints, validator 0 errors, `--office-summary` diff shows only the two new NPCs, lock and key diff empty, door alignment check, commit by explicit path before any live test.
