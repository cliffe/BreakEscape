# OPS_LOG_ROWS_PLAN round 3 review

Plan reviewed: `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (1249 lines) as it stands in the worktree on
2026-11-19. Plan lines are written `PLAN:n`. Code paths are relative to the worktree root:
`GM` = `app/models/break_escape/game.rb`, `GC` = `app/controllers/break_escape/games_controller.rb`,
`ALS` = `tools/playtest/lib/access_leak_scanner.rb`. Sibling plans were read in their uncommitted
working-tree state, section 13 only.

Counts: blocker 0, major 4, minor 9, nit 6.

## 1. Status of the round 2 items

| R2 | Grade | State | Note |
|---|---|---|---|
| A1 secrets only by prose | major | partly | Typed rules and a guard exist. The guard rests on a list that does not hold what the plan says (M1), and `:integer` still admits a PIN or matching number in production (M2) |
| A2 "never saves" loses rows | major | partly | `stored?` and the per-row save rules are there and match the code: the two `attempt_login!` refusals save nothing today (`GM:3484`, `GM:3489-3492`), `/container` is on the lock list and reloads (`GC:103`, `GC:630`). The stated bounds on those new saves do not hold (M3, M4) |
| B1 privilege mapping | major | closed | The privilege plan's table now equals 13.7 row for row. One wording mismatch (m5) |
| B2 share row missing | major | closed | `share_file_read` is in 13.8, 5.1, L3. What it records was decided without asking (m8) |
| F1 alternation defeats merge | major | partly | A, B, A, B merges now. Eleven rows in rotation do not, and class 1 eviction is unprotected (M3, m1) |
| F2 clock stamp placement | major | closed | The sync line is gated on the key, not the scenario; `merge_scenario_clock!` (`GM:5846`) reads no scenario. The controller test at PLAN:685-691 would fail on the wrong design |
| V1 reach check on a sign-in PC | major | closed | `folder_route_allowed?` is in the list (PLAN:449-451, code `GC:660`). The no-scope branch is a separate, new problem (m4) |
| A3 registration cost | minor | closed | Name pattern in the schema, plain Ruby event file, `KINDS` with owners and `-` fallback |
| A4 `as` unbounded | minor | closed | 32, 40 and 96-byte caps, ceiling table, spec test |
| B3 MFA rows differ | minor | partly | Four differences remain (M4, m5) |
| B4 core and cracking rows | minor | partly | Cracking writes none (closed). `technique_refused` save rule differs (m5) |
| B5 two plans write one branch | minor | closed | `signin_refused` is this plan's; S5c registers `kind` |
| F3 rfid lock with no access list | minor | closed | PLAN:322-323. Plan text only; code not re-read |
| F4 reload stamps ahead | minor | closed | Bootstrap refresh (PLAN:261-267). Side effect in m6 |
| F5 blocked row identity | minor | closed | `{ typed: }`, same rendering (PLAN:502-506); the locked-out return is before the account lookup (`GM:3484-3486`) |
| G1 byte cap | minor | closed | 128 KB cap. The two sections disagree on which source pays (m2) |
| V2 sprite and lighting | minor | closed | PLAN:407-423 |
| V3 reader fields in section 7 | minor | closed | PLAN:515-520 |
| P1 `verify-run.rb --ops-log` | minor | closed | PLAN:753-755. Its teeth depend on M1 |
| P2 L1 proof scenario | minor | closed | L1b creates `test_ops_logs` (PLAN:141) |
| P3 split L1 | minor | closed | L1a and L1b |
| A5, F6, V4 | nit | closed | Wording and the `GM:3182` pointer are fixed |

## 2. New findings

### M1 (major) The secret guard is built on a list that is not the list the plan describes

PLAN:934-941 and PLAN:769-771 say `OpsLog.secret_values(game)` lists passwords, PINs, credential
values, hashes, MFA codes and answers, wifi keys and every code lock's `requires`, and that it
"reuses `AccessLeakScanner#secret_values`", moved into a shared module.

The real method (`ALS:387-390`) is a private redaction list used to print findings safely
(`ALS:351`). It is built from the scanner's own catalogues after a scenario walk, not from a game:
NPC passwords, capture secrets, the name, text and content of items not yet reached, network and
resource **names**, wifi ssid and psk, share item name, text and content (`ALS:545`), and feed post
texts. The class comment says so: "Network strings (network and resource names, hosts,
observations, share item content)" (`ALS:144-147`).

Two consequences:

- It holds no PIN, no lock `requires`, no hash and no MFA code. Those have to be written new, so
  the L1a step is not a move and is larger than S.
- It holds display names. `/log_rows` rows show a network's, share's and folder's display name
  (PLAN:488, PLAN:490, 13.5 "shown as that thing's display name"), so
  `assert_ops_log_holds_no_secret` over every response body (PLAN:723) and the extended
  `access-leak-check.rb` (PLAN:750) fail on a correct implementation as soon as an L3 or S1 row is
  shown. The cheap way to make that pass is to drop strings from the list, which is how a real
  leak later goes unseen.

The scanner also matches carefully: a password under six characters only as a whole token
(`ALS:731-739`), network strings by length (`ALS:1795`). PLAN:939-940 says only "scanned for each
value".

Fix: define the guard's list in the plan as its own thing, built from the game's scenario: account
and NPC passwords, credential values, PINs and code-lock `requires`, wifi psk, hashes, MFA secrets
and answers. State that names, ids, usernames and file content are not on it (file content cannot
reach a row by type; test that separately). State the match rule: exact match against each string
value under `as` (other than `typed`), `where` and `detail`, plus the scanner's token rule for the
response body. Size L1a honestly. Keep `ALS` unchanged apart from reading the new list for
`/log_rows` bodies.

### M2 (major) `:integer` is a field a PIN or a matching number fits, and nothing stops it in production

PLAN:998-1001: "No rule admits free text, so a password, hash, PIN, code, key, MFA number, security
answer ... has no field to land in." PLAN:1064: `:integer` admits 0 to 99999, "registered only for
counts". That last clause is a convention. A four to five digit PIN, an MFA code prefix or a
number-matching value is a legal `:integer`. The guard that would catch it raises in test and
development only (PLAN:934, PLAN:942), and only for the values the fixture happens to hold.

The secret-guard test (PLAN:670-676) does not separate the two defences: "every call either raises
... or stores a row in which no secret appears" passes whether the type rule or the guard raised.
With the guard on, a registration such as `'number' => :integer` on an MFA event passes that test
and leaks in production.

Fix: (a) the `EVENTS` spec fails any `:integer` key whose name is not in a fixed list
(`count`, `hashes`, and any later addition made on purpose in this plan's file); (b) run the
secret-guard walk twice, once with the guard switched off, and assert that every string secret is
refused by the type rules alone; (c) reword PLAN:998-1001 to say integers are the exception and how
it is held.

### M3 (major) The 10-row merge window does not bound the saves the plan says it bounds

PLAN:958-963 merges only into one of a source's 10 newest rows. `merge_limit` (PLAN:864, PLAN:960)
stops a row's count, and the plan then claims a hard ceiling on saves for three branches that are
free today:

- refused badge swipe: "at most ten saves per door, then free" (PLAN:329-330, PLAN:1154);
- locked-out sign-in: "one save per locked-out PC and username" (PLAN:293-295, PLAN:1159);
- blocked helpdesk request: "at most ten saves" (PLAN:1213).

None holds once the matching row leaves the window or the source:

1. Rotation. Eleven distinct rows sent in turn never find their own row among the 10 newest, so
   each request appends a row with `n: 1` and saves. Eleven rfid targets in reach is rare; eleven
   mixed rows in one sign-in source (failed usernames are free text) is not.
2. Eviction. Class 1 (PLAN:967) evicts "the oldest refusal row with `n` above 1" first. A row that
   has reached its `merge_limit` is exactly that. In a full source every appended row removes a
   limit-reached row, and the next repeat of it appends afresh and buys ten more saves.

The core plan leans on the same step for a quiet `technique_refused` ("saves only when
`r&.stored?`", its section 13) with no `merge_limit` at all, so every repeat there merges, is
"stored" and saves.

The tests would not catch it: PLAN:653-656 alternates two rows, and PLAN:657-658 repeats one row
with nothing in between.

Fix: bound saves by key, not by the row being present. When `merge_limit` is given, keep the count
in a bounded map beside the once-set (digest to count, same 256 cap), consult it before the window,
and answer `stored? == false` once the key's count has reached the limit, whether or not the row
still exists. Then restate the bound as "at most `merge_limit` saves per key while the key is among
the last 256", add `merge_limit` to the core plan's quiet refusal (sibling to change), and add two
tests: eleven rows in rotation, and a limit-reached row evicted then repeated.

### M4 (major) `helpdesk_request`: 13.7 reveals whether a username is an account, and the sibling's version is unbounded

PLAN:1125 gives `as` as "`{ account: }` for the account asked about; nil for a username that is no
account". The reader shows an account's username and shows nil as `-` (PLAN:487), so the desk's log
tells the player which typed usernames are real. That contradicts the plan's own rule for sign-in
rows (PLAN:502-506, PLAN:1177-1179).

The MFA plan's section 13 (as revised) uses `as: { typed: }` for every result, which fixes the
leak, drops the `agent` detail, and bounds the blocked branch with `once: true` where 13.7 and
PLAN:1212-1214 say `merge_limit: 10`. With a typed identity neither bound works: every new made-up
username is a new once-key and a new row, so a script at a closed desk gets one save per request
on a branch that saves nothing today, and pushes real digests out of the 256-entry once-set
(PLAN:952-953).

Fix, this plan to change: take `{ typed: }` for granted and refused (those branches already save
and `maxTries` bounds them), drop `agent`, recompute the ceiling row (PLAN:913). Both plans to
change: the blocked row carries `as: nil` and is written `once: true`, so it is one row and one
save per desk and `what`. Add to 13.3: a typed identity is never written on a branch whose only
save is the row's, unless the server already holds a capped record keyed on that text (true of
`signin_refused` blocked: the lockout list is capped, `GM:4366-4377`).

### m1 (minor) Class 1 eviction can remove the first row of an event

PLAN:967 has no "unless it is the first row of its event" clause; classes 2 and 3 do. A first
`badge_swipe` refusal or first `signin_fail` that merged a repeat is the first thing evicted, so
"the first row of each event survives a flood" (PLAN:972-974) is false for the commonest case.
Fix: add the clause to class 1, and a test: a first refusal with `n: 3`, then a flood.

On the cap: protecting firsts cannot push a source over its cap, because class 4 (PLAN:970) takes
the oldest row when only firsts are left. Say that class 4 means "never evicted" is "evicted last".

### m2 (minor) Sections 8 and 13.2 disagree on who pays for a global cap

PLAN:552-554: past 128 KB "the helper evicts from the largest source". PLAN:964-966 and PLAN:975:
it evicts from the source being appended to, and "rows in other sources are never touched". Under
the 13.2 rule a source that fills first leaves a later source less than its `maxRows` (two sources
of 150 in a clamped snapshot: the second starts evicting at its first row past 300 in total), so "a
noisy source cannot push another source's rows out" needs the caveat. PLAN:180 says the helper
"clamps both" caps at run time without saying how the sum is clamped. Fix: clamp each source's
`maxRows` in declaration order until the sum is 300, once, when the helper reads the block. The
global row and byte branches are then unreachable guards; pick one wording for both sections.

### m3 (minor) The once-set: when a digest is added, and what may key it

PLAN:528 says the set is written "on a `once: true` call that stores". PLAN:950-952 adds the digest
at step 4, before the merge, append and size steps. Pick step order: add the digest only when the
row was appended. When the set is full the oldest digest is dropped and that row can be written and
saved once more (PLAN:952-954); that is acceptable, and the test at PLAN:659 covers it, but only if
free text never feeds the set (M4). State it in 13.1: `once:` is refused (malformed call) with
`as: { typed: }`.

### m4 (minor) The no-scope reach rule is not `/container`'s

PLAN:441-454 says a reader is "judged exactly as `GET /container` judges a container" and that the
logic at `GC:638-669` moves into `container_reach_refusal`. For an object with no scope `/container`
does something else: `find_container_in_scenario` then `check_container_unlocked(container_id,
container_data)` (`GC:671-679`), which asks whether that container is itself unlocked. The plan's
rule (room unlocked, not an unpromoted route room, path unlocked) is right for a reader, which is
not a container, but it is new logic used by one route. So the shared method covers the three
scoped branches only, and "the two cannot drift" is true only there. Fix: say so, name the no-scope
check as `/log_rows`'s own, and keep its tests (PLAN:718-719). The scoped branches answer 404, 403
and 403 with `reason` today; the method should return a symbol and let each route render, so
`/container`'s responses stay byte-identical (add that assertion to section 10).

What an unreached reader gets: 404 `Not found`, the same body as an invented id (PLAN:455-457).
That holds.

### m5 (minor) Sibling mapping: remaining mismatches

| Row | 13.7 says | Sibling says | Who changes |
|---|---|---|---|
| `technique_refused` | "saves on every 422" (PLAN:1113) | saves after a noisy refusal; after a quiet one only on `r&.stored?` | this plan, and the core plan adds `merge_limit` (M3) |
| `mfa_code_locked` (result `locked`) | absent | present, stage M1a | this plan: add the row |
| `helpdesk_request` | `as` account or nil, `agent` detail, blocked `merge_limit: 10` | typed, no `agent`, blocked `once: true` | both (M4) |
| `route` detail | `signin_ok`: `local`, `remote` (PLAN:1155); `mfa_challenge`: `keyboard`, `foothold`, `from` (PLAN:1118); prose names `relay` (PLAN:1134-1136) | MFA plan: `keyboard`, `foothold`, `from` | this plan: one code list for one key name |
| `mfa_prompt_approved` detail `by` | `by` (PLAN:1122), while PLAN:1219 reserves the stored key `by` | `by` | sibling: rename (`approver`) |
| privilege prose | over-long ids make the call malformed (PLAN:545-547) | "cut to 32 characters and ids to 40 by the helper" | sibling |
| `service_checked` detail | `{ id: 'service' }`, charset `[A-Za-z0-9_.:-]` | "the service name" | core to confirm a service name can hold no space, else every such row is malformed |
| `admin_profile_read` bound | "one per PC and profile" | same | both: the once-key includes `as`, so it is per PC, profile and account |

The core and privilege tables otherwise equal 13.7.

### m6 (minor) The page-load clock refresh: acceptable, with one false claim

One save per `GET /scenario` in a scenario with `logSources` is acceptable. The gate is right as
written: `prepare_bootstrap_state!` returns before any lock when `bootstrap_state_needs_write?` is
false (`GM:803-811`, `GM:1807-1811`), and a game with no key keeps that path. With the key, every
load takes the row lock and rewrites `player_state`.

PLAN:1030-1032 says "a client cannot hold the time back by not syncing". It can: each
`GET /scenario` resets `opsLogClockAt` to now, so a script that calls it before every action and
never syncs keeps every stamp at the saved `elapsedMs`. It is display only (PLAN:1021), so drop the
claim. Also skip the write when the key was set less than about ten seconds ago, so a reload loop
is not a save loop.

### m7 (minor) The guard scans counters and times, so it can raise on a clean row

PLAN:939-940 scans "the built row's JSON, less `as.typed`". That JSON holds `seq`, `n`,
`elapsedMs` and `serverMs`. A short numeric secret matched as a token equals `seq` or `n` sooner or
later (`seq` advances on every call, merges included, PLAN:956), and development then raises on one
ordinary action. A scenario whose password equals a username or an id (`admin` / `admin`) raises on
every row for that account. Fix: scan string values under `as`, `where` and `detail` only, by
exact match, and make "a secret equal to a username or id" a validator warning in a scenario with
`logSources`.

### m8 (minor) Open questions: one silent decision to ask, one to state

Both listed questions (PLAN:1230-1249) are real choices with options and a recommendation.

`share_file_read` records opening a folder (PLAN:1166-1171). The event name says a file was read,
the row is once per folder and account, and the player never sees a "file read" trace at all. That
is a teaching decision made in the plan. Ask it: (a) folder row as written, renamed
`share_folder_opened`; (b) a small request per opened file so the log names the file (changes the
built share reader, one request per file); (c) no share row. Recommend (a).

Also unstated: when two sessions admit a share, which account the row names. `session_admits?`
answers a boolean (`GM:3260`); PLAN:338-339 says "the session that admits the share". Give the
rule (for example the session at the PC the request's route names, else the oldest) and a test.

### m9 (minor) Tests that would pass on a wrong build, and the unchanged-scenario proof

- Merge and bounds: see M3 (rotation, evicted limit row) and m1 (merged first row).
- Secret guard: see M2 (cannot tell the type rule from the guard).
- `share_file_read` with two admitting sessions (m8).
- Unchanged scenarios (PLAN:630-642): checks 1, 2 and 5 are real. Check 4 proves the log-filter
  files are untouched, but L2a edits files log-filter is opened through: `interactions.js`
  (`:1585-1597`), `container-minigame.js` (`:2326-2331`, `sourceExtras()`), `minigames/index.js`,
  `lighting.js:434`, `game.js:905`. Add a JS test that a `log_filter_terminal` in a room and in a
  container still opens `log-filter` with the same arguments, and that `sourceExtras()` adds
  `sourceRoute` only when a route was passed. Nothing names the SIEM minigame in the check: add
  its directory to the `git diff --stat` line.
- `/container` responses unchanged after the extraction (m4).

### Nits

- n1. PLAN:484: a play row id is "opaque". The source id ships with the reader (PLAN:516) and
  `seq` is small, so the six-character digest can be reversed by trying numbers; six characters
  also collide now and then, and selection keys on the id (PLAN:398). Mix in a per-game secret and
  use ten characters, or drop the claim.
- n2. PLAN:944-949 (step 3) leaves out `where.objects`, which 4.1 (PLAN:177) and the test at
  PLAN:650 include.
- n3. PLAN:181 and PLAN:189 say "L2"; the stages are L2a and L2b.
- n4. `signin_lockout` has result `ok` (PLAN:1157), so a lockout row sits in eviction class 3 with
  successes. Probably intended; say so.
- n5. The "x10+" display (PLAN:330) is in 5.1 only; the viewer text (PLAN:393-394) and the
  `result` field (PLAN:489) do not mention it.
- n6. PLAN:1110 "once per service in practice" is not a bound. State the real one (one per check
  that adds a finding; findings per service are capped by the scenario).

## 3. Answers to the checks not covered above

- **Consistency of sections 3 to 11 with 12 to 15.** Caps agree everywhere read: 400 bytes, 128 KB,
  300 rows, ids 40, accounts 32, typed 32 characters and 96 bytes, once-set 256. State keys agree
  (`opsLog`, `opsLogSeq`, `opsLogOnce`, `opsLogClockAt`). Stage contents agree between PLAN:138-144
  and PLAN:762-820. Event names agree; no `signin_denied`, `share_read` or `hash_obtained` is left.
  No mention of a review or a round. Disagreements: m2, m3, n2, n3.
- **Merging over 10 rows** is deterministic and bounded (10 comparisons per source). Nothing gates
  on a play row (PLAN:569-570), so eviction cannot break a puzzle; it can remove a row a player
  wants to see (m1) and it undoes the save bounds (M3).
- **Typed usernames and account existence.** `signin_fail`, `signin_lockout` and blocked
  `signin_refused` take `{ typed: }` whether or not the name is an account, and the code agrees:
  the lockout check is before the lookup (`GM:3484`), failures and lockouts are recorded for
  non-accounts too (`GM:4333-4377`). `signin_refused` denied names an account only after the right
  password (`GM:3487-3491`). The one leak is M4.
- **`player_state`.** Every key is bounded and none is synced; rows go out only on request with a
  `rev`. After a reload the viewer refetches. Not re-verified in code: that the sync body and the
  bootstrap use named keys.
- **What reaches the browser.** The seven-key allow-list with a test (PLAN:479-493) is sound. Rows
  name only places and things the player acted on, plus authored seed rows.

## 4. Trim list

The plan says several things three or four times. Suggested cuts, keeping the first place named:

| Topic | Keep | Cut or shrink to a pointer |
|---|---|---|
| What the helper does | 13.2 (PLAN:923-981) | PLAN:244-249 |
| L1b and L3 call sites, bounds and saves | 5.1 (PLAN:272-347) for code detail | the When, Bound and Saved by cells of PLAN:1153-1164 down to a few words each |
| `share_file_read` records a folder | PLAN:1166-1171 | PLAN:341-347, the tail of PLAN:1143-1145, PLAN:144 clause |
| Byte caps | 13.1 (PLAN:903-921) | PLAN:539-555 |
| Clock stamp | 13.4 (PLAN:1023-1034) | PLAN:251-270 to the three call sites only; PLAN:531-533 |
| Copied card identity | question 1 (PLAN:1230-1243) | PLAN:312-317 and PLAN:497-501 to one sentence each |
| Typed and account names render alike | PLAN:502-506 | PLAN:279-282, PLAN:1177-1179 |
| Why not extend log-filter | five lines | PLAN:363-382 |
| Where rows live | three lines | PLAN:556-568 |
| Stage contents | section 12 (PLAN:762-820) | the long cells of PLAN:140-144 |
| Sibling requests | 13.7 | PLAN:1205-1214 to the names of what must change |
| Settled list | none | PLAN:1224-1228 |

About 150 lines.

## 5. Not checked

- Plan sections 1 and 2 (PLAN:1-133): searched for leftovers only.
- Code for `logout_session!`, `lock_session!`, `network_access.rb` call sites,
  `credential_login.rb`, `rfid_*` helpers, the sync body's key filter and the bootstrap key list.
- Client line references in 5.2, validator and dungeon graph references in 9.
- The cracking and realism skin plans.

## 6. Verdict

No blocker. The four majors and their fixes sit in 13.1 to 13.3, 13.7 and the tests of section 11,
and none changes a stage or a route. **Round 4 can be a delta review** of those sections, the m4
wording in section 6 and the sibling tables once the three siblings settle.
