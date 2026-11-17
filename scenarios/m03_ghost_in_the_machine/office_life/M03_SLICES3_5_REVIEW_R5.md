# m03 office life slices 3 to 5: review round 5 (delta, last full round)

Read at f9b80683e in the build worktree. Static only: no server, no suites. The R4 delta for m03 (`git diff 8304d2c55..f9b80683e -- scenarios/m03_ghost_in_the_machine`) is two documentation files; `scenario.json.erb`, the ink and the engine files the mission uses are unchanged since 1bba40ead, so this round re-reads the whole office-life surface at the tip.

## Severity table

| # | Severity | Finding |
|---|---|---|
| 1 | minor | "Reception had company" (delay 6000) and "The receptionist's down" (delay 2500, `scenario.json.erb:1046`) are 3.5 s apart; the validator still warns (warning 23, under 4 s), so R3 nit 4 is only half closed |
| 2 | nit | Credits line `:229` says "STRUCK IN RECEPTION" but the staff are leashed to reception and the hallway, so a hit at the cooler gets the wrong place |
| 3 | nit | `zainab_attacked` and `yusuf_attacked` (`:1363`, `:1364`) are set and never read (validator suggestions 24 and 25) |

No blockers, no majors.

## 1. minor: two HaX texts 3.5 s apart

`:1046` sends "The receptionist's down..." at 2500 ms and `:1370`/`:1373` send "Reception had company..." at 6000 ms, both on `npc_ko:ffion_rees`. The validator rule is a gap of at least 4 s and reports it (warning 23). A player who knocks Ffion out by day gets both toasts and the first may be dismissed unread. Fix: set both "company" delays to 6500 (the other text is untouched, the order stays).

## 2. nit: credits place

`:229` "WHITEHAT STAFF: SOMEONE STRUCK IN RECEPTION BY DAY". `needsRooms` is reception and the hallway (`:828`, `:874`), so a punch landing at the cooler is not "in reception". Drop "IN RECEPTION" or say "ON SITE".

## 3. nit: unread attack globals

`zainab_attacked` and `yusuf_attacked` are declared (`:2249`, `:2250`) and set, but nothing reads them. The plan names them, so keeping them is fine; drop them if the suggestion count matters.

## Earlier findings, checked at the tip

| Finding | Status | Evidence |
|---|---|---|
| R1 1 blocker, machines duplicated | fixed | `:648` `coffee_station`, `:1572` `water_cooler`, no `position`; validator "Office preset" lines list one of each |
| R1 2 timings | fixed | habit `:828` threshold 24; coffee `useSeconds` 16 (`:651`), cooler 20 (`:1575`) |
| R1 3 hide timing | fixed | `:846-850` (Zainab) and `:888-892` (Yusuf): clone task, `mission_phase` act2, `clone_call_done` plain, two `onceOnly` room re-hides |
| R1 4 mapped breaks | fixed | `:852-854`, `:893-894` |
| R1 5 placeholder ink | fixed | both ink files carry only approved lines |
| R1 6, 8, 9, 10 | fixed | onceOnly re-hides; `capacity 2` `:651`; credits `:229-233`; observations `:858`, `:896` |
| R1 7 attack and KO globals, witnessed | fixed | `:1363-1376`, globals `:2246-2252` |
| R2 2 / R3 1 send-home spot | fixed | no `patrolOverride` anywhere on the staff (grep: none); both machines `offWhen: "wh_staff_upset"` (`:649`, `:1574`); the needs layer turns walkers back (`npc-needs.js:3436-3441`) |
| R2 3 HaX texts | fixed | `:1370-1377` verbatim to DIALOGUE_SAMPLE.md |
| R2 4 laptop text | fixed | `:668-674` base and four variants, in sample order |
| R2 5, 6, 7, 8 | fixed | comment `:808`; no `previousRoom === null` mapping; witnessed gate (below); no stray commas |
| R3 2 p2 proof | fixed | R4 confirmed p2c-6653 |
| R3 4 nit | partly | finding 1 above |
| R3 5 / R2 9 validator 13, 14 | deferred | unchanged (queue cells beyond capacity 2; never used with two staff) |

## Checks asked for

**Event mappings.** Coffee: `conversation_closed:ffion_rees` (Yusuf, cooldown 120000, delay 2000, day and not upset, `:893`), coupled by `npc_use_started:reception_coffee` with `data.npcId === 'yusuf_demir'` (`:854`, the event payload carries `npcId`, `npc-needs.js:3513`). Cooler: `room_entered:reception_lobby` with `data.previousRoom === 'main_hallway'` (Zainab, 150000, `:853`; the payload carries `previousRoom`, `rooms.js:3232`), coupled by `npc_use_started:hallway_cooler` with Zainab (`:894`). Each coupling is one way, so there is no ping-pong. Cooldowns are per handler (`npc-manager.js:1264-1290`). The delayed mappings re-check their condition when the delay is up (`:937` area), so a KO inside the 2 s cancels the trip.

**Witnessed gate.** `:1370` (`!zainab_ko`) and `:1373` (`zainab_ko && !yusuf_ko`) are exclusive and together equal `!(zainab_ko && yusuf_ko)`. Each has its own key `agent_0x99:npc_ko:ffion_rees:<index>` (`npc-manager.js:1264`); a false condition does not count as a fire. Both KO'd: neither fires, so no witnessed global and no text.

**onceOnly across reloads.** The handlers have no conversation or minigame, so `triggered.persist` is set at fire time (`npc-manager.js:1445-1450`), exported as a keyed section (`state-sync.js:43`, `:505`) and restored before mappings fire (`:2186-2200`). The room re-hides are safe either way: if unfired they fire once on the first night entry, if fired the saved visibility applies at registration. The `delay` on the HaX texts sits in `sendTimedMessage`, not in the mapping, so the global and the fire count are written at once; only the toast waits.

**Night.** Staff are hidden by `:846-848` and `:888-890`; hidden NPCs are skipped by the needs tick (`isAvailable`, `npc-needs.js:1236`) and by witnesses, phone answering and mutters (`:1023`, `:2202`, `:4575`, `:4617`). Exchanges need both speakers available, so none plays. Chatter, bark conditions all carry `mission_phase !== 'act2_infiltration'` (`:853-855`, `:893-895`). The laptop's night variant is first (`:670`), so a stale `zainab_laptop_owner_away` after a mid-trip hide shows nothing. The machines stay on at night with nobody to use them. A hostile staffer is hidden like the others.

**Spoken lines.** All 49 clips from DIALOGUE_SAMPLE.md were matched by script against `scenario.json.erb` (pools, barks) and the ink source and compiled JSON (exchanges, conversations): none missing, none altered. All are NPC JSON or ink, so TTS can voice them. No engine-text lines added.

**Player state.** No new global since R3: 7 declared (`:2246-2255`), 3 `heard_ex_*`, per-NPC visibility one key each, onceOnly fires one keyed entry each. V8 reports workstation globals 3/24, heard 3/8, small keys 6/64. Nothing grows or is re-sent whole.

**Validator** (`validate_scenario.rb ... --skip-ink --no-graph`): 0 errors, 12 warnings (baseline 5; the R3 fix log said 13 with the lint included). New against the pre-office-life base, all known: `npc_ko:ffion_rees` onceOnly overlap (indices 6, 59, 60, 61; 60 and 61 are exclusive, 59 and 6 are independent by design), two queue-cell warnings (13, 14), cooler outside home room (17, 20), V4 attack probe (21, 22), and the text spacing (finding 1). Two new suggestions (finding 3). Lint and ink were skipped for this run: no ink changed since R3.

## Not covered

C2 and C3 (reload checks of the exchanges and breaks) have not been run live on the final tip; this is carried from R3, not a finding. Lock and key: untouched in R4.

## Verdict

Ready to merge on the scenario: no blockers, no majors, one minor (text spacing), two nits. Only minors get fixed from here: change the two delays to 6500 and optionally reword `:229`. Before the merge, rerun C2 and C3 once on the final tip and the two suites on the commit being merged.
