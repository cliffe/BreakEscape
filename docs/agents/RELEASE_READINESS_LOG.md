# Release readiness log

Stream owner: session breakescape-10 (from 2026-11-13). Integrator: breakescape-35.

The gate (user, 2026-11-13): no production deploy until the ongoing access, networking and UX work settles and m01_first_contact, sis01_healthcare and sis02_energy each pass a fresh end-to-end playtest. Real-VM playtests happen in another environment; here the VM half is stood in by seeding flags from new-game.rb's FLAGS_XML (user, 2026-11-13).

## Baseline playtests on main 2f5471209 (train 28)

| Mission | Game | Result | Open findings |
|---|---|---|---|
| sis01_healthcare | 3134 | Ending reached, 18/18 tasks, every secret earned | F1 M ending race ("Not Yet" toast over the credits), fixing on build/rel-fixes. F2 M and F6 m: Sonnet check running. F3 to F5 m: respawn at start after reload, walkthrough drift |
| sis02_energy | 3133 | Partial, stopped after the ESD button | F1 M (HMI-OPS-01 interact resolves to the status board) and F6 M (FLAG SESSION step unprompted): Sonnet check and finish running. Four minors |
| m01_first_contact | 3137 | Steps 1 to 18 pass, 0 B/M | Steps 19 to 29 (incl. the never-completed abort/launch choice) running |

## Decisions (orchestrator, overrule as needed)

- 2026-11-13: sis01 bed 2 death barks voiced (5 clips, build/sis01-tts-bed2 6943093e9). Measured lengths showed Mrs Kowalski overlapping David by 0.29 s, so David moves to 8.6 s and Helen to 14.9 s (861555e75); every gap is now at least 0.3 s.
- 2026-11-13: sis01 ending gate: apply sis02's empty concludeRequires pattern (no VM or flags, so the server holds nothing back), because the globals gate on debrief_complete races the task POST against the state sync.
- 2026-11-13: q94 field names agreed with breakescape-d3: `host` reused, `desktopUser { name, character? }`, shown only on the unlocked desktop. VM-linked objects untouched.
- 2026-11-13: q94 review R1 (0 B, 1 M, 6 m): remove hosts from three VM stand-ins (m07, m09, m10); keep Kevin signed in on both m01 PCs (the user's q94 answer named him, and it isn't a spoiler); fix the rest.

## Waiting on the user

On the Release Readiness Picks page (https://claude.ai/artifact/8RVcPNYB9tiTZkyCrj54hP):
- sis01-david-clip: does David's bed 2 clip say "library"?
- sis01-barks-tts: voice the other 26 uncached sis01 barks (under $1)?

On breakescape-35's picks page: the Hacktivity test-fixtures edit.
