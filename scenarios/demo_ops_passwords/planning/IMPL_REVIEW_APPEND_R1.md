# Implementation review R1: the P-S5 append (S5b cached accounts, S5c account kinds)

Reviewed: `f8c7d8ba8` on `ops-showcase-s5` (`git log main..HEAD` is that one commit), against `docs/agents/ops_core_build/SHOWCASE_PLAN.md` 6.5, 6.6 and 8.4, and the P-S5 section of `planning/BUILD_REPORT.md`. Not run in a browser.

**Verdict: clean.** No blocker and no major finding. Six minor findings below; none stops the append from merging, and the first three are worth fixing in the same pass as the browser run.

## Checks re-run by the reviewer

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_passwords/scenario.json.erb` | 0 errors, 27 warnings; ink "All ink files valid"; no L9 line; dialogue lint 1 CHECK (`crowded-hub`, 21 choices, 19 conditional). Graph regenerated with no diff. |
| `ruby tools/check_mapping_index_drift.rb main ...` | 1 scenario, 0 failures |
| `flock ... bin/rails test test/controllers/break_escape/demo_ops_passwords_scenario_test.rb` | 46 runs, 1245 assertions, 0 failures |
| `bin/ops-golden-compare` (outside flock) | 45 runs, 0 failures |

These match the builder's figures.

## What holds

- **Each beat shows its feature.** P10 (collect at the partner's PC, the second press "Nothing new is cached here", a strong cached row that never falls), P11 (Niamh cached from the start, Jun only after the borrow), P12 (a `common` record falls at once, Jun's needs his one fact), P13 (the shared local administrator opens its three desks), P14 ("This account can't sign in on this PC.", no lockout counted, a `signin_refused` row read as "kind: local"), P15 ("Domain: merrin" on the sign-in screen, which `password-minigame.js:1667` draws from the PC's `domain`).
- **The borrow lever.** Two routes: Ama's "Switch Jun's PC off." (`#set_global:jun_pc_off`) and the wall socket by Jun's desk, both in the office where Jun, the hot desk and Ama are. Jun's mappings (`jun_pc_off` sets `work` to 20, `ask_jun` sets `social_media` to 20) carry no `fireOnlyWhenLoaded`, so they fire wherever the player is. The test proves the server side: two fails at `perFail` 35 reach `at` 60, the run names `hot_desk`, the hand-over alone caches nothing, the done answer caches Jun and ends the player's session there; and with the PC still on, his reports are stale and borrow nothing.
- **Cached accounts and kinds as the docs say.** One hash record per PC and cached account, each `proof.harvested` (validate_privilege 252); Delphine collect-only at the partner's PC is the info line; `deskadmin` carries only the seven allowed keys (test asserts the key list); every sign-in PC and every person account is in domain `merrin`, so every earlier admission still holds (P15 case signs each person in where they signed in before). The local account is refused at `partner_pc` by `localTo`, not by `access` (the partner's PC admits the `it` role), so the refusal really is the kind's.
- **Leak scan honest.** The whole run plus the afternoon scans with 0 findings and `unused_entries` empty, every extra sign-in and sign-out named; a mutation case proves the scanner sees a password put into a collect answer. The account-only rule (`access_leak_scanner.rb:5439-5471`) is on, and the boot answer test refutes the name and `cachedAccounts`.
- **Existing beats unchanged.** Every P1 to P9 case, the free-play cases and the old whole-run scan pass as before; the two widened shape lines (PC list, administrator list) are named in BUILD_REPORT. New mappings are appended last (drift 0). The two deviations (record in a new cabinet, not the bin; salted cached records for Delphine and Julian) are reasoned and keep the old cases intact.
- **Secrets.** New passwords appear only in `creds` and the test constants (the test greps ink, mission.json and the scenario with `creds` removed).

## Findings

### minor-1: one recap line is false on one route
`ama_owusu.ink`, recap of `crack_cached`: "A remembered record falls like any other. It only needed one fact." The tick comes from "I cracked one of those records.", which a player may say after cracking Niamh's (no fact) or Delphine's cached record (answered at once). Only Jun's needed one fact. Fix: "A remembered record falls like any other: a weak one at once, Jun's with one fact." or drop the second sentence.

### minor-2: "falls" read as "works" in `tell_local_refused`
"So the shared account falls on every desk it's on, and not on Julian's." Elsewhere in this scenario "falls" means a crack succeeds; here it means the account signs in. Fix: "So the shared account opens every desk it's on, and not Julian's." The recap "One shared desk password opened every desk it covered" also claims more than the player did (one desk is the task); "would open" is true.

### minor-3: validator warnings 80 and 81 are explained, not answered
The warnings say Delphine and Graham can use `hot_desk` for `work` without borrowing it, which "leaves the player's session and any guest session open under" that NPC. BUILD_REPORT's reason ("the desk is shared on purpose; neither has it as `needsHome`") does not address that effect. It matters in the afternoon: P13 puts the player at Delphine's PC, which can push her `work` to the hot desk while the player's Graham session (P11) is open there. Not breaking a beat on the server, but the browser run should watch for it; if it shows, keep Delphine and Graham off the desk (`needsAvoidRooms` cannot, as the office is Delphine's home, so a per-object exclusion or the plan's "give the desk only the borrowed need" route).

### minor-4: `local_refused` is self-reported though an event exists
`collect_partner`, `collect_hot_desk` and `crack_cached` are told to Ama because the collect panel and the cracker emit no client event (checked: `cached-accounts-panel.js` emits none), which matches the earlier crack beats. The refusal, though, goes through `pc-sessions.js`, which emits `pc_signin_failed` with a `reason` on a 422; a mapping on `pc_signin_failed:partner_pc` keyed on the kind refusal's reason would tick P14 by itself, as P13 ticks. As built, "I tried the shared desk account at Julian's PC." is offered as soon as P13 is done, tried or not. Optional.

### minor-5: the P15 case's domain assertion is conditional
`P15: every PC carries the domain...` asserts the served `domain` only `if found&.key?('domain')`, so the case passes if the room answer drops the key. The client reads it from the room object (`unlock-system.js:860`, `domainOf(data)`), so make it unconditional: `assert_equal 'merrin', found.fetch('domain')`.

### minor-6: the record file's id carries the account-only username
`deskadmin_record_file` (and the keyring row id `deskadmin_hash`) contain the username `deskadmin`. The scanner matches the username as a whole word with `_` as a word character, and L9 skips `id`, so a container answer that lists the cabinet's contents before the take is not flagged, and the P13 "nothing listed before it is taken" case checks only the bin. Nothing on screen shows it (the file's name is `desk_rounds_record.dat`), and plan 6.6 named the id this way, so this is the plan's choice; but renaming the item and record ids (`desk_rounds_record_file`, `desk_rounds_hash`) would make the name appear only in the account's own NPC at no cost.

## Not checked / open

- Browser behaviour, including the borrow timing (PLAYTEST guesses 1 to 3 minutes; the server test uses 10 s + 25 s between fails and 65 s for the walk), whether the player can pick Graham at the hot desk while Jun sits at it ("Switch user"), and the 21-choice hub in practice.
- P13 and P14 need Delphine away from her desk and the partner's PC signed out; PLAYTEST says so, Ama's "What's next" does not (it is a fair gap for a guided demo; consider adding "while Delphine is away" and "sign out first").
