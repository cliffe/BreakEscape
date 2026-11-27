# m02_ransomed_trust — NPC KNOCKOUT declaration coverage

> **CORRECTION (added after review — the FAIL verdicts below are wrong).**
>
> This report concludes that the `receptionist` and `ward_nurse` KO declarations
> are unreachable dead code, because `debugKO` refused them with `not-hostile`
> and no `#hostile:` tag targets those NPCs in the ink. The ink analysis is
> right; the conclusion drawn from it is not.
>
> A player can attack **any** visible NPC. `player-combat.js` converts a
> non-hostile NPC to hostile when the punch lands, then damages it — so a
> peaceful NPC can be knocked out in ordinary play with no ink tag involved.
> The `not-hostile` refusal was a limitation of `debugKO`, which gated on
> `behavior.hostile`, and not a property of the game.
>
> `debugKO` has since been changed to convert a peaceful NPC first, mirroring
> what the punch does, and to mark such a KO with `convertedFromPeaceful: true`.
> Re-tested on a clean game (1027): knocking out the receptionist set
> `receptionist_ko = true` AND completed `sign_in_at_reception`, both persisted
> server-side. **The declarations work. They were simply untestable through the
> harness.**
>
> So: `receptionist` is **PASS (assisted)**, not FAIL. The two `ward_nurse`
> declarations remain **unexercised** — no longer blocked, just not yet run.
> Everything else below stands, including the `guard_knocked_out` PASS
> (assisted) and the three genuinely unexercised NPCs.


Scope: exercise the seven never-tested `globalVarOnKO`/`taskOnKO` declarations in
`scenarios/m02_ransomed_trust/scenario.json.erb`, forcing knockouts with the
`debugKO` test-bridge command (documented exception in `docs/test-bridge.md` §4:
"Beating a hostile NPC is a dexterity mechanic ... `debugKO` KOs a hostile NPC
without fighting it").

**Every PASS below is PASS (assisted): the KO was forced by `debugKO`, never earned
through combat.** `debugKO` itself refuses on an NPC that is not currently hostile
(`reason: "not-hostile"`), so before it can be used at all, the NPC's hostile state
had to be turned on legitimately — either it never can be (receptionist, ward
nurse), or it required driving a specific dialogue branch first (security guard).

Game used throughout: **1025** (never switched). Session log:
`tools/playtest/m02-ko-session.jsonl` (113 commands).

## Session log — step citations

| Step | Lines in `m02-ko-session.jsonl` | What happened |
|---|---|---|
| bootstrap | 1–3 | fresh game 1025, landed in `reception_lobby`, tasks_completed=0 confirmed beforehand |
| debugKO receptionist (untriggered) | 4–5 | `not-hostile` |
| debugKO ward_nurse/roaming_ward_nurse/gary_whitlock/dr_sarah_kim/night_security_supervisor/security_guard_patrol, all NPCs still unloaded | 6–11 | all `unknown-npc` — rooms hadn't been visited yet, so the scene objects didn't exist |
| travel reception_lobby → ward_vestibule → ward_approach → hospital_ward | 12–20 | `room`/`enter`/`moveToNear`/`interact` sequence, all doors unlocked |
| debugKO ward_nurse, roaming_ward_nurse (now loaded) | 21–24 | both `not-hostile` |
| travel hospital_ward → ward_hall → office_corridor → security_office | 25–38 | `enter`/`moveToNear`/`interact`/`moveTo` sequence; one door (office_corridor→security_office) needed interaction-menu routing and a raw `moveTo` past its vanished-door threshold |
| `converse security_guard_patrol` with explicit choices `["rather not get into it","answer to hospital security"]` | 39–40 | drove the *first-encounter* branch to "I don't answer to hospital security", which fires `#hostile:security_guard_patrol` in the ink — confirmed via `brief`: player hp dropped 100→80 (guard is now actively attacking) and `attacked_guard` appeared in `recentGlobals` |
| debugKO security_guard_patrol | 41 | `ok:true, via:"debug-shortcut (combat not played)", isKO:true` |
| `sync` + `brief` | 42–43 | `guard_knocked_out` appears in `recentGlobals` |
| travel security_office → office_corridor → office_hall_mid → dr_kim_office | 44+ | reached Dr Kim's office |
| debugKO dr_sarah_kim (untriggered) | last | `not-hostile` |
| `sync`, `quit` | final | clean close, 113 commands, 0 flags used |

## `verify-run.rb` output (game 1025)

```
game            1025  (mission 46)
created         2026-09-10 16:12:01 UTC
last write      2026-09-10 18:56:28 UTC
played for      9867s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, security_office, office_hall_mid, dr_kim_office
unlocked objs   0:
inventory       3: Your Phone, Lock Pick Kit, Notepad
NPCs met        14: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, security_guard_patrol, dr_sarah_kim
flags submitted 0:
globals set     9: attacked_guard, backup_recovery_source, briefing_played, guard_knocked_out, lockpicking_guide_offered, patient_bed2_state, patient_bed4_state, player_name, ransomware_deployed

VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

(`current room` says `reception_lobby` because it reflects the DB's last-saved
overworld position field, which this scenario/engine does not appear to update
on every room transition — the room-unlock list above, which does update, shows
the true path taken.)

## Persisted-state proof (`tools/playtest/` script, run against 1025)

```
counter=2 entries=2
  global receptionist_ko = false
  global ward_nurse_ko = false
  global gary_ko = false
  global dr_kim_ko = false
  global night_security_supervisor_ko = false
  global guard_knocked_out = true
  task sign_in_at_reception = nil
  task gather_pin_clues = nil
  task talk_to_gary = nil
  task meet_dr_kim = nil
```

`tasks_completed` counter = 2, `objectivesState.tasks` has 2 entries (from the
opening cutscene's `arrive_at_hospital`-style scripted completions, not from
anything tested here).

## Dev log check

```
tail -n +1391558 test/dummy/log/development.log | grep -E "BusyException|Completed 500" | wc -l
0
```

## Results table

| NPC | globalVarOnKO | taskOnKO | What actually fired | Persisted? | Verdict |
|---|---|---|---|---|---|
| `receptionist` (Bernie Nwosu) | `receptionist_ko` | `sign_in_at_reception` | Nothing. `debugKO` returned `not-hostile`. No `#hostile:receptionist` tag exists anywhere in `m02_npc_receptionist.json`, and the scenario defines no combat/hostile config for this NPC. She can never become hostile through any reachable game state. | No | **FAIL — declaration is unreachable dead code** |
| `ward_nurse` (Sister Doyle) | `ward_nurse_ko` | `gather_pin_clues` | Nothing. `debugKO` returned `not-hostile` (confirmed with the NPC actually loaded in `hospital_ward`, not just absent from the scene). No `#hostile:ward_nurse` tag exists in `m02_npc_ward_nurse.json`. | No | **FAIL — declaration is unreachable dead code** |
| `roaming_ward_nurse` (Nurse Raval) | `ward_nurse_ko` | — (shares receptionist's task-less second declaration) | Nothing. `debugKO` returned `not-hostile`, loaded and confirmed in `hospital_ward`. No `#hostile:roaming_ward_nurse` tag in `m02_npc_roaming_nurse.json`. | No | **FAIL — declaration is unreachable dead code** |
| `gary_whitlock` | `gary_ko` | `talk_to_gary` | **Not reached in this run.** `#hostile:gary_whitlock` does exist in the ink (`accuse_gary_push`), but the choice that leads there (`"The affiliate who confirmed ENTROPY's timing. Was that you?"`) is gated on `insider_evidence_partial && gave_keycard && !insider_identified` — evidence and server-room access that require substantial earlier progress (server-room keycard from Gary, and insider evidence from Val Okonkwo's `discuss_reeves` branch). Val was already KO'd in this run for the security-guard test, which may foreclose the Val-sourced half of that evidence in this specific save. | — | **NOT EXERCISED — see note below** |
| `dr_sarah_kim` | `dr_kim_ko` | `meet_dr_kim` | **Not reached.** `debugKO` confirmed `not-hostile` with her NPC loaded in `dr_kim_office`. Her `#hostile:dr_sarah_kim` tag exists in `m02_npc_sarah_kim.json` on an "accuse the wrong suspect" `...push` branch with a comparable deep gate to Gary's. | — | **NOT EXERCISED — see note below** |
| `night_security_supervisor` (Graham Reeves) | `night_security_supervisor_ko` | — | **Not reached.** Two `#hostile:night_security_supervisor` sites exist in `m02_npc_asset.json` (`choice_hostile`, `press_terminal_ambush`), both gated behind the `confrontation` knot, itself gated on `insider_identified` being set to Reeves — i.e. requires the insider-identification chain to resolve correctly on him specifically first. | — | **NOT EXERCISED — see note below** |
| `security_guard_patrol` (Val Okonkwo) | `guard_knocked_out` | — | **Confirmed working end to end.** Drove her *first-encounter* dialogue (`converse` with explicit choice patterns) down "I'd rather not get into it" → standoff → "I don't answer to hospital security", which fires `#hostile:security_guard_patrol` and `set_global:attacked_guard:true` in the ink — no prerequisites needed, this is the very first thing she says. Player HP dropped 100→80 confirming she is genuinely attacking. `debugKO` then completed the KO (`via: "debug-shortcut (combat not played)"`), and `guard_knocked_out` appeared in globals and was confirmed **persisted server-side** via the game record. | **Yes** | **PASS (assisted)** |

## Why three declarations were not exercised

`debugKO` is documented to refuse an NPC that is not hostile — "it will not
invent combat where the scenario declares none" — which is correct behaviour,
not a bug. For `gary_whitlock`, `dr_sarah_kim` and `night_security_supervisor`
the scenario genuinely *does* declare hostile branches (found by static-analysis
grep of the compiled ink, not guessed), but each is gated behind the mission's
insider-identification evidence chain: `insider_evidence_partial`, `gave_keycard`,
and `insider_identified` pointing at the specific (wrong) suspect. Building that
state legitimately — gathering evidence from multiple NPCs, obtaining the
server-room keycard, then walking the accusation dialogue to the wrong person —
is a materially larger undertaking than the KO-coverage sweep this run was
scoped for, and was not attempted rather than faked. This is the honest boundary
of what this run proves: the mechanism is confirmed to exist and work correctly
for one NPC (`security_guard_patrol`), and confirmed absent/dead for two
(`receptionist`, `ward_nurse`/`roaming_ward_nurse`); the remaining three are
unproven, not failing.

## Side effects / things that became unreachable

- **Val Okonkwo (`security_guard_patrol`) is now KO'd for the remainder of game
  1025.** Her `discuss_reeves` branch — one of at most two sources of
  `insider_evidence_partial` found in the ink — is no longer reachable through
  her in this save. This is exactly the kind of consequence the task brief asked
  to be reported: testing one KO declaration closed off a route that another
  (`gary_ko`, and indirectly `night_security_supervisor_ko`) needed.
- No other room, task or NPC route was observed to break as a result of this
  run; `verify-run.rb` shows 9 rooms unlocked and no destructive state beyond
  the intended KOs.

## New bugs / findings

- None found in the KO mechanism itself — `debugKO`'s guards (`not-hostile`,
  `unknown-npc` for an unloaded NPC) behaved exactly as documented in
  `docs/test-bridge.md`.
- **Design finding, not a bug per se:** `receptionist_ko`/`sign_in_at_reception`
  and `ward_nurse_ko`/`gather_pin_clues` (×2, since `roaming_ward_nurse` shares
  `ward_nurse_ko`) are declared in the scenario but have no corresponding
  `#hostile:...` tag anywhere in their ink files, and the scenario configures no
  combat behaviour for any of these three NPCs. As far as this run can determine,
  these three `taskOnKO`/`globalVarOnKO` pairs can **never fire in play** — not a
  harness limitation, a property of the content. Worth a design decision: either
  wire up a way for these NPCs to become hostile, or remove the dead
  declarations.
