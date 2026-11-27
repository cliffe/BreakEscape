# m02_ransomed_trust — JS fix verification

Purpose: verify three client-side bug fixes that Rails tests cannot reach (remote
unlock, scene resolution, PIN attempt accounting). This is a targeted
fix-verification run, not a full walkthrough or solvability pass — routes were
taken to reach the relevant objects, not to complete the mission.

**Environment note:** this machine was under severe memory pressure throughout
(26/31GB used, 15GB swapped) which made the headed browser too slow to boot
window.__test within the harness's 45s timeout on the first two attempts. All
runs after that were `--headless`, which is a deviation from the skill's
default (headed, so a human can watch) made for reliability, not preference.
The same memory pressure produced persistent, non-deterministic navigation
flakiness (`arrived-but-outside-plain-range`, `did-not-cross`) on several
doors across every run — this looked like harness/engine trouble at first but
reproduced differently each run with identical commands, which points at
frame-timing jitter under load rather than a scenario or engine defect. It
took seven attempts (games 1040–1043) to walk a continuous path from reception
to the server room flag station.

## Session logs and game ids

- Decisive run (fixes 1 & 2 evidence): game **1043**,
  `tools/playtest/m02_ransomed_trust-jsfix-session-FINAL.jsonl`, command batch
  preserved at `/tmp/.../scratchpad/m02_cmds6.jsonl` (not checked in).
- PIN lock evidence (fix 3): game **1040**,
  `tools/playtest/m02_ransomed_trust-jsfix-session.jsonl` (early section,
  around the `conference_room` PIN-lock commands).
- Earlier attempts (games 1040–1042) are superseded by 1043 for the flag/cache
  chain but their session logs remain at `tools/playtest/m02_ransomed_trust-jsfix-session*.jsonl`.

## verify-run.rb output (game 1043)

```
game            1043  (mission 46)
created         2026-09-12 23:29:27 UTC
last write      2026-09-12 23:32:34 UTC
played for      187s of wall clock
current room    "reception_lobby"
unlocked rooms  10: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, it_department, security_office, server_room
unlocked objs   1: entropy_staging_cache
inventory       6: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Server Room Keycard, Spare Contractor Lanyard
NPCs met        14: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, gary_whitlock, security_guard_patrol
flags submitted 3: flag{m02_ransomed_trust_hospital_backup_server_1_5dbf41}, flag{m02_ransomed_trust_hospital_backup_server_2_d7b229}, flag{m02_ransomed_trust_hospital_backup_server_4_95bb45}
globals set     26: backdoor_fully_exploited, backup_recovery_source, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, exploitation_guide_offered, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_trusts_player, gave_keycard, guard_knocked_out, insider_badge_id_found, lockpicking_guide_offered, network_isolated, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransomware_deployed, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered

VERDICT: progress recorded — 9 rooms beyond the first, 1 objects unlocked, 3 flags submitted.
```

Note flag 3 (`submit_database_flag`/database backup) was never actually
submitted this run — Ghost's phone call (`on_proftpd_exploited`) repeatedly
stole the minigame slot on the way back to the drop-site and the retry landed
on flag 4 instead. This is not a defect: the scenario's `targetFlags` for the
ENTROPY cache unlock are keyed to **flag 4 only** (`hospital_backup_server-flag4`,
scenario.json.erb:357), so the cache unlocking on flags 1/2/4 alone with flag 3
still outstanding is scenario-correct, and `verify-run.rb`'s server-side record
of `unlocked objs: entropy_staging_cache` independently confirms the unlock
took effect without needing flag 3.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — dialogue reward | game 1043, step ~4 | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — dialogue reward | game 1043, step ~40 | yes |
| Boardroom PIN (`0417`) | tested wrong PINs only (1111/2222/3333) | Kim's Desk Diary (never read this run) | — | no — deliberately tested wrong codes only, to exercise the PIN-lock failure path for fix 3 |
| `hospital_backup_server:flag_1..4` | `<flag:1>`..`<flag:4>` (session-supplied, seeded stand-ins) | No VM in standalone; the flag-station accepts the seeded value directly | game 1043, server room | no — flags cannot be earned without a VM; standalone solvability past this point is unproven |

Rows marked "no" are the boundary of what this run proves: mission
solvability past the VM chain is not tested here, and the boardroom PIN's
real in-game source was never read (deliberately, to test the lock's failure
behaviour with unearned guesses — see fix 3 below).

## Fix 1 — remote unlock (`entropy_staging_cache`)

**VERIFIED.** Evidence from game 1043's console during the flag-4 submission:

- Console log line (captured via a temporary `page.on('console')` filter in a
  throwaway diagnostic copy of the harness — the real skill script was left
  unmodified, see below): `[RemoteUnlock] Object unlocked: entropy_staging_cache`
- No `forEach is not a function` TypeError anywhere in `pageErrors` across any
  of the seven runs (games 1040–1043) that exercised this handler.
- `entropy_staging_cache`'s reported client-side state after flag 4 flipped to
  `"locked": false` (confirmed via `interact()`'s returned `entity.state`),
  and the server's own record (`verify-run.rb`) independently lists
  `unlocked objs 1: entropy_staging_cache` — this is a second, server-side
  confirmation that does not depend on the browser's client state at all.
- This happened **without ever re-entering the flag at the cache** — the only
  flag ever typed at `entropy_staging_cache` itself was none; all four
  submissions went to `flag_station_dropsite`.

One follow-on wrinkle: the immediate next `interact()` on the now-unlocked
cache (to take "Ghost's Operational Manifesto") returned
`ok: false, reason: "no-effect-confirmed"` — click registered, in range
(`engineDistance: 3.5` vs `range: 32`), but no minigame opened on that attempt.
Given the same run's console was also full of environment-induced 503/403
resource-load failures at that exact time (the machine's memory pressure), I
treat this as a probable environment hiccup rather than a second engine
defect, but it was not retried before the session ended, so **actually
walking through the unlocked container's contents is unconfirmed** — only the
lock-state transition and the absence of the crash are confirmed.

## Fix 2 — scene resolution (`getScene`)

**VERIFIED.** Across all seven runs, rooms were created (first-visit) for
`ward_vestibule`, `ward_approach`, `hospital_ward`, `ward_hall`,
`office_corridor`, `staff_room`, `dr_kim_office`, `it_department`,
`security_office`, and `server_room` — `security_office` specifically, named
in the bug report, was created cleanly multiple times (once per fresh game).
No `getScene is not a function` TypeError appeared in any run's `pageErrors`
or console capture.

## Fix 3 — PIN attempt accounting

**COULD NOT FULLY VERIFY — but a real, separate defect surfaced.**

I opened the boardroom's PIN lock (`conference_room`, code `0417`, never read
in-game) and submitted three different wrong 4-digit codes (`1111`, `2222`,
`3333`), 12 keypad taps each. Every single attempt, with no exception, came
back as:

```
Network error. Please try again.
Incorrect PIN. 3 attempts remaining.
```

`attemptsUsed` never moved off 0 and the "Attempts Log" stayed "No attempts
yet" through all 36 submissions — consistent with Fix 3's refund-and-no-history
behaviour actually working for *this* code path (a request that "fails"
never counts and never appears in history, exactly as intended).

But I traced *why* it always takes that path, and it is not simulated
flakiness: `/unlock` returns **HTTP 422** for a wrong PIN
(`{"success":false,"message":"Invalid attempt"}` — confirmed directly via
`window.ApiClient.unlock('door','conference_room','1111','pin')`, and the
*correct* PIN `0417` returns HTTP 200 `{"success":true,...}` from the same
call). `ApiClient.post` (`public/break_escape/js/api-client.js:39`) throws on
any non-2xx response, and `pin-minigame.js`'s `validatePinWithServer` catches
*all* exceptions from that call identically as a "network error"
(`pin-minigame.js:344`, the exact fix-3 code path). So a wrong PIN and a
genuine network failure are indistinguishable to the client — every wrong
guess is misclassified as a network error, refunded, and never logged.

I could not tell from this whether that misclassification is new or
pre-existing, since I never got a "real" wrong-PIN response to compare against
(there may not be one — every 422 goes through this same code). The upshot
for what the task asked me to check: **I could not observe the "normal"
wrong-PIN case at all** — a genuine wrong-but-recorded attempt that increments
`attemptsUsed` 1:1 and eventually engages the lock at `maxAttempts` never
occurred in 36 tries, because the code path that would produce it appears to
be unreachable for PIN locks as currently wired. I did not deliberately
simulate a network failure per the task's instruction not to, but I also could
not avoid one: it happened on every attempt regardless.

**I am not asserting this is a bug in the fix under test or in the PIN
minigame generally** — only reporting what was observed and traced, per the
instruction not to self-classify. A human should decide whether "every wrong
PIN throws and is treated as a network failure" is expected, and if not,
whether it predates this change.

## Other observations (not classified as bugs)

- One JS console error unrelated to the three fixes:
  `Cannot read properties of undefined (reading 'style')`, seen once during
  the run-7 session. Not investigated further given the scope of this task;
  flagging for awareness.
- Ghost's phone call (`on_proftpd_exploited`) opens a `PhoneChatMinigame` that
  steals the minigame slot mid-flag-submission-sequence, which is exactly the
  behaviour described in the walkthrough ("Ghost calls") but is worth knowing
  if a future playtest script assumes the flag station stays open across all
  four submissions in one interact() call — it does not.
- `security_guard_patrol` (Val) KO state persisted across `resume:"new"` on
  the same game id in one investigation branch (games reused across
  attempts) — a `resume:"resume"` also fully rewound player position back to
  `reception_lobby` despite an explicit `sync` beforehand, matching the
  skill's own documented warning about `resume` rewinding state. Neither is
  one of the three fixes under test; noted for anyone reusing a game id
  across playtest sessions.

## Summary

| Fix | Result |
| --- | --- |
| 1 — remote unlock | VERIFIED (console + client state + server-side verify-run.rb all agree; container-open click after unlock had one unconfirmed hiccup, likely environment) |
| 2 — scene resolution (`getScene`) | VERIFIED (zero occurrences across 7 runs and 10 distinct room creations, incl. `security_office`) |
| 3 — PIN attempt accounting | COULD NOT FULLY VERIFY (refund/no-history behaviour is consistent with the fix, but the "normal" wrong-PIN accounting path was never reached — every wrong PIN in this environment returns HTTP 422 and is client-side misclassified as a network error, which is a separate finding for a human to judge) |
