# m02_ransomed_trust — post-pass dialogue review

Static review only (per instructions, no browser session started — two other agents are
driving the browser). Scope: `npc-dialog-review` skill, steps 1–3.

## Step 1 — compile + validate

`./scripts/compile-ink.sh m02_ransomed_trust`: **Compiled: 15 files, Failed: 0 files.**
Warnings: 3 files with `-> END` (m02_closing_debrief.ink:827, m02_opening_briefing.ink:238,
m02_phone_ghost.ink:255) — all legitimate closing endpoints (debrief / briefing / a phone
call that reaches a clean end). No "apparent loose end" warnings.

`ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb`:
- ✓ ink files valid
- ⚠️ 1 unknown top-level field: `mutuallyExclusiveGlobals` (schema/engine concern, not
  dialogue — leave to scenario-design-review)
- ⚠️ 8 objective-wiring warnings, all pre-existing onceOnly-disjointness noise on
  `agent_0x99`/`ghost` event mappings (matches the baseline PHASE2 doc already accounts
  for) — not dialogue-facing
- ✗ 1 schema error: `rooms/staff_room/type` = `"room_hospital_staff"` is not in the
  enum. This is a real blocker for the new room but is a structure/schema issue, not
  dialogue — flagging for scenario-design-review, not re-litigating here.

No dialogue-facing validator findings (no unresolved `#speaker:narrator` issues, no
`#give_item` mismatches, no unresolved speaker prefixes).

## Step 2 — dialogue review

### 2a. Attribution & narration — OK
All `Character Name:` prefixes used in ink (`Agent HaX`, `Bernie Nwosu`, `Director Magnus
Netherton`, `Dr. Sarah Kim`, `Gary Whitlock`, `Ghost`, `Graham Reeves`, `Mr Pryce`, `Mrs
Hargreaves`, `Ms Chen`, `Nurse Raval`, `Sister Doyle`, `Val Okonkwo`) resolve exactly to a
`displayName` in scenario.json.erb. `CONFIRM:`, `Available for transmission:`, `Evidence
release held:` are prose labels, not speaker prefixes — harmless, one-offs.

### 2a-bis. Dialogue vs scenario — **1 Must-fix found, geography re-verified clean**

**Geography (the focus of this pass) — OK.** All four rewritten connections for
`staff_room` cross-checked against `connections` blocks and are consistent both ways:
`office_corridor.north` ↔ `staff_room.south` (`:2563`/`:2589`), `conference_room.east` ↔
`staff_room.west` (`:2286`/`:2591`), `it_department.west` ↔ `staff_room.east`
(`:1600`/`:2592`), `dr_kim_office.south` ↔ `staff_room.north`
(`:2143`/`:2590`). No stale "east of reception" line remains in ink (searched — none
found; already fixed). No other stale hallway directions found: all "corridor" mentions in
ink now describe the real geometry (Bernie's and Doyle's directions both correctly route
via the handover room: `ink/m02_npc_receptionist.ink:222`, `ink/m02_npc_ward_nurse.ink:285`).

**Handover-room props — OK.** `handover_whiteboard` and `estates_audit_snag_list`
(`scenario.json.erb:2597-2622`) exist exactly as Kim's `escrow_safe` knot and Doyle's/
Bernie's dialogue describe them, with matching `onRead` wiring.

**Must-fix — stale `M. WEBB` in the visitor log.** `scenario.json.erb:1169`,
`reception_visitor_log.text`: `"22:40  M. WEBB (IT Systems) -- on site, no sign-out"`. This
is Marcus Webb residue — Gary Whitlock is the IT staffer who signed in that night and the
line should read `G. WHITLOCK`. The PHASE2 doc's B6 claims MARCUS WEBB/M. Whitlock fixed in
four places; this is a fifth instance that was missed. (Val's separate night log at `:2487`
correctly says "Whitlock (IT)".)

### 2a-ter. Voices — OK
17 `voice` blocks present; top-level `narrator` voice block exists (`:100`). No reused
`voice.name` spotted across co-present characters (not exhaustively re-verified this pass
beyond what compile/validate already covers).

### 2b. Player choices — OK
Spot-checked `You:` lines (`m02_npc_asset.ink:244,266,297,319`, `m02_phone_ghost.ink:55`):
none are choice-label echoes — they're scripted player lines mid-branch, deep inside an
already-committed knot (e.g. `choice_arrest`, `choice_expose`), or the legitimate silent-choice
exception (`[Say nothing...]` → `You: ...`). No `You:`-echo tell found.

### 2c / 2c-bis. Hub structure & starved knots — OK
Every hub checked (Kim, Gary, Doyle, Bernie, Val) has an unconditional sticky exit
(`+ [I need to get on.]` or equivalent) reachable regardless of state. `loopcheck.js`
run against the three new-dialogue files at their declared `currentKnot` ("start", all
three): **all pass, 0 runtime errors, 200 steps × 6 strategies** —
`m02_npc_gary_whitlock.json` (hub loops indefinitely, as expected), `m02_npc_sarah_kim.json`
(1/6 reached clean end), `m02_phone_ghost.json` (6/6 reached clean end, as expected for a
phone call). The six new knots (`lanyard_refused`, `lanyard_refused_out`, `escrow_safe`,
`escrow_safe_out`, `on_cracker_taken`, `cracker_out`) are one-shot outcome knots (inbound
0–3, not re-entered as hubs) that all resolve to `-> hub` or `-> END` — no starvation risk.

### 2d. Choices that matter
Not exhaustively re-audited this pass (already covered structurally by the puzzle-chain
plan's C9 analysis). Spot-checked the new `lanyard_grudging`/`lanyard_refused` branch: sets
a real state var (`lanyard_refused`), gates re-asking on `gary_influence >= 15`, and both
outcomes lead somewhere different (`lanyard_given` hands the item; `lanyard_refused_out`
points to Doyle as an alternate, non-blocking source) — consequential, not flat. OK.

### 2e. Cross-file state integrity — OK
New globals `read_operator_note`, `read_handover_board`, `found_safe_pin_clue`: all three
declared in `globalVariables` (`scenario.json.erb:2843-2845`), all three set via object
`onRead` (`:2000`, `:2605`, `:2619`) and read by eventMappings
(`global_variable_changed:*`, `:841/847/853`) — not set-but-never-read. `found_safe_pin_clue`
is additionally set via ink `#set_global` (`m02_npc_sarah_kim.ink:340`); it has no local
`VAR` declaration in that file, but since no ink file branches on it with `{found_safe_pin_clue}`,
that's not a violation of the sync rule (VAR is only required where ink itself reads a
global).

### 2f. Influence tags — OK
Scripted every `influence`/`kim_influence`/`gary_influence`/`bernie_influence` `+=`/`-=`
across all ink files (excluding no-op `+= 0`): **0 missing `# influence_increased` /
`# influence_decreased` tags.** (Two apparent misses on manual grep were false positives —
tag present two lines later, after a second state-set line.) No parallel rapport scalar
found (`trust_level`/`relationship_score`/`friendliness` all absent).

### 2g. Syntax hazards — OK
No `**bold**`, no stray `//` truncating a dialogue line, no bullet-list dialogue found.

### 2h. KO-resilience — not re-audited (cross-ref scenario-design-review; out of scope
change set for this pass, no new NPC KO wiring was named in the brief).

## Step 3 — prioritised action list

**Must fix**
- `scenario.json.erb:1169` — `reception_visitor_log` still names the IT staffer
  `M. WEBB`; should be `G. WHITLOCK` (Marcus Webb → Gary Whitlock rename residue, missed by
  the earlier sweep).

**Should fix**
- (validator, not dialogue) `scenario.json.erb` — `rooms.staff_room.type` value
  `"room_hospital_staff"` fails schema enum validation. Not this skill's territory but
  worth flagging since it's a hard validator error on the very room this pass targets —
  route to scenario-design-review.

**Worth considering**
- None found beyond the above — the new knots (lanyard refusal, escrow safe, cracker
  pickup) and the four rewritten `staff_room` connections are cleanly wired, geography and
  props check out, and the new globals are all declared/set/read correctly.
