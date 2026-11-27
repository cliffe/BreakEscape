# m01 office life: build review R4 (delta and final sanity pass)

Base: `git diff ea513dbc2 e6fdb7e2b` on `plan/ol-m01` at e6fdb7e2b (two files: BUILD_REPORT.md, SPOKEN_LINES.md), plus a whole-branch pass of PLAN.md section 7 and section 8 against BUILD_REPORT.md. Read: BUILD_REVIEW_R3.md, both changed files, the ink, the scenario, all 623 sidecars in `tts_cache/m01_first_contact`. No server started, no code edited.

Counts: B 0, M 0, m 2, n 3.

## Checks run

- Validator: 0 errors, 26 warnings (same as R3). `git status` clean afterwards, so the dungeon graph files did not regenerate.
- Lock and key diff against `baseline_locks.json`: "lock and key diff: empty".
- V6 (keyless rake): 18 office-life clips, 0 uncached (0 of 589 characters).
- Spoken lines against the sidecars, by script: all 22 numbered rows in SPOKEN_LINES.md have exactly one sidecar with the same text. Every stated character count equals the real length. Voices: 11 Umbriel (Graham), 11 Vindemiatrix (Fatima), all `en-GB`. The delivery column matches the sidecars (#3 "brisk, apologetic", #5 and #6 "dry, deadpan", the other 19 none) and the ink (`m01_npc_fatima_begum.ink:9`, `m01_npc_graham_whitfield.ink:6`, `:8`; #4 has no tag). Every text appears word for word in the ink or `scenario.json.erb` (bark conditions at `:1331` and `:1369` match the table).
- Counts by speaker: Graham 1 bark + 4 pool + 4 exchange + 2 talk = 11; Fatima 11; 8 pool, 8 exchange, 4 talk, 2 bark, as BUILD_REPORT.md:159 says.

## R3 documentation fixes (e6fdb7e2b)

- SPOKEN_LINES.md:3 now says voiced, the user's yes (D97a), commit a0c4535b6. Accurate (commit date 2026-11-17).
- SPOKEN_LINES.md:60 reworded to "before voicing". Accurate.
- SPOKEN_LINES.md talk table gained the Delivery column. Accurate (above).
- BUILD_REPORT.md:20 and the "R3 and voicing" section (`:156-161`): accurate against R3 and the sidecars: 44 files, 22 clips, 11 and 11, V6 0 uncached, 751 tests, the two accepted notes. "Maya's not_here line stays a cache hit" is true (the rake lists only the 18 office clips and her opener is existing ink).

## Findings

### m1. SPOKEN_LINES.md:95 still says the V6 clips are uncached
The paragraph reads "Expected V6 total at tier 2: 18 ... all uncached keyless; at tier 1: 2". The clips are cached now, so a reader running the rake gets 0 uncached and may think something broke. The same file's line 3 now says voiced.
Fix: append "(expected before voicing; since a0c4535b6 the rake reports 0 uncached)" to the sentence at `:95`.

### m2. Expected results with no recorded proof
Section 7 and 8 items that BUILD_REPORT.md has no result for (checked by search; `tmp/handover/M01_BUILD_HANDOVER.md:17` and `:38-39` list several as "not yet run" and no later section closes them):
1. Test 5, room tone per room (`currentAmbient`, `it_room` stock bed at 0.8, `conference_room` no bed, no `spot` in unmapped rooms). Only the main office bed is recorded (handover `:8`: `office_ambient` 0.8). The reception and break-room beds are not.
2. Test 6, a 60 s dwell: only "typing log count 2 at level 0.6" (BUILD_REPORT.md:9). No recorded check of the three mapped rooms for `spot` entries.
3. Test 8, barks: no result for firing once, order on first entry and first return, or suppression after KO and `entropy_reveal_read`. Graham's bark depends on `previousRoom` (`scenario.json.erb:1369`), which is the one a player could hit wrongly.
4. Test 10, music: threat then noir on `all_hostiles_ko` is unrecorded (BUILD_REPORT.md:44-50 covers HaX text, globals, credits and leash only).
5. Test 11, cooler: a clear south-door to north-door path with two users, capacity 2 with a third user waiting, and the aisle render. Cooler off on alarm is recorded (`_isOff`, `:46`).
6. Test 12, the sis01 and sis02 gate runs: not recorded. PLAN.md:411 defers them to before release, so this is expected, but nothing says so in the report.
7. Test 14, Maya talked to away from post "three ways" (mid-walk, waiting at the cooler, at the cooler) fresh, after hub exit and after a reload: only the hub-exit reopen (R2 n5) and the in-and-out routes are recorded. Also not recorded: "Maya never shares the cooler with an extra", the one validator info line, and hallway_east motion lighting while she walks (PLAN.md:416 lists it as open).
Fix: either run these on a keyless server and add a section, or add a "Not run" list to BUILD_REPORT.md naming items 1 to 7 and the reason, so the report states what was and was not proved. Items 3 and 5 are the ones a player is most likely to see.

### n1. BUILD_REPORT.md rows and lines still state "18 uncached" without a date
`:36`, `:62`, `:104` and `:134` are history before voicing. `:159` now says 0 uncached, so the order reads correctly, but a reader skimming `:36` sees "18 uncached". Fix: prefix "(before voicing)" on those four.

### n2. PLAN.md section 7 and section 9 are stale
`PLAN.md:370` expects "the baseline's 19 warnings"; the validator gives 26 and BUILD_REPORT.md:133 records it. `PLAN.md:396` says "The 22 clips wait for the user's yes"; they are voiced. PLAN.md:369 says V6 "all uncached". Fix: one-line notes pointing to BUILD_REPORT.md, or leave as the plan of record and say so at the top of section 7.

### n3. Delivery column is blank for 19 of 22 lines without saying so
SPOKEN_LINES.md has the column only on the talk table, where blank means no tag. Barks, pools and exchanges have no delivery column and no tag. Correct, but implicit. Fix: add "Delivery tags exist only on #3, #5 and #6" under the talk table.

## Whole-branch sanity (player view)

Nothing new found beyond the earlier rounds. The critical-path regression (BUILD_REPORT.md:106-113), the lock and key diff, the 751 JS tests and the live attack, evening, reload and Maya routes cover what a player meets. The two known cosmetic points (drink pose facing after a chat, Fatima's pair swap) are accepted in R3. No lock, key, PIN or item changed.
