# m09 Digital Archaeology: targeted re-check after the blind-playtest fix pass

Run type: regression run, plumbing only (question 1 of the playtest skill). Not blind, not a solvability pass. Head starts (`--start-room`, `--set`, `--submit-flag`, `--unlock`) were used on purpose, so the earned-secrets rules do not apply except in item 8.

- Commit tested: HEAD `417174f9d` (m10 target-host commit). It contains the fix pass `19a34d32f` and `919524c0e` (neutral address fallbacks). The brief named "9a34d32f"; no such commit exists, so I took `19a34d32f` as meant. Working tree for m09 had no uncommitted changes.
- Server: keyless :3001, headless (load average about 18), speed fast, Node 24 from the ms-playwright-go path. :3000 untouched.
- Scratch and logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09-recheck/`
- All sessions stopped at the end. No repo file edited except this report. Nothing committed.

## Result

| # | Item | Result |
|---|------|--------|
| 1 | Cold start at the hatch, three covers | PASS |
| 2 | Debrief "[Montana, sir.]" confirm, "[One more thing.]", "[Sign it, sir.]" | PASS |
| 3 | H&L placing sheet: "That sheet leaves two..." about 10 s after the other shortlist text | PASS |
| 4 | `match_the_hand` title and "[The hand on Nightshade's file.]" topic | PASS (see note N1) |
| 5 | Reel deck after the identity scene: "Session two. He gave that lecture every year." | PASS |
| 6 | Login slip "Host:" and binder "Enrolment site, on ..." | PASS (fallback text, reported exactly below) |
| 7 | Dust the stamp, wrong card, greyed card, reason text, second pick | PASS |
| 8 | Regression sweep, briefing to flag 1, console | PASS |

0 blockers, 0 majors, 0 minors from this run. Two notes (N1, N2) for a human to rule on.

## Detail

### 1. Cold start at the hatch (games 3771, 3772, 3773; logs `s3771.jsonl`, `s3772.jsonl`, `s3773.jsonl`)

Games started in `restricted_stacks` with `noor_met=true`, `noor_cover` set, `noor_told` unset. The cover was set by global rather than by talking to Noor in these three games (Noor's real conversation is exercised in item 8 with the shredder cover, but that run stops at flag 1). Transcripts: `item1-contractor.txt`, `item1-3772.txt`, `item1-3773.txt`.

- Shredder (`contractor`): Narrator "She looks up before you can say who you are." Sorensen: "Noor says you've come about my shredder. It has never jammed in eleven years. There's a chair on your side." Two choices: "Then you won't mind me looking at the feed." and "I'll stand." After the first: "Look all you like. Keep your sleeves clear of it." then the Viral Dynamics line, then "You're not here for my shredder. You're the one the Architect writes about." HaX's bin lines follow, and the four hatch choices appear. PASS.
- SAFETYNET: "Noor rang through. SAFETYNET, of course. There's a chair on your side.", Viral Dynamics, then "And you're the one the Architect writes about." No shredder text. PASS.
- Audit: "The lease-holder's auditor. Of course. There's a chair on your side." Choices "That's right. They want tonight's run checked against the schedule." / "I'll stand." After the first: "Then you'll find it in order...", then "You're not from the lease-holder. You're the one the Architect writes about." No shredder text. PASS.

### 2. Debrief (game 3778, `s3778.jsonl`, `item2-a.txt`)

Started in `loading_dock` with `start_debrief=true`; the debrief opened on its own. Played Kowalczyk ("Thank you"), the memo ("About Albion, yes."), "Send it.", then the four questions: "The archive, sir." / "WREN." / "The Recruiter." / "Montana, sir." With all four unasked:

- "[Montana, sir.]" gave "Then I sign, and that is the night closed. Anything else first?" with "[Sign it, sir.]" and "[One more thing.]".
- "[One more thing.]" returned to "Ask me what you need to. Then I sign." with all four questions still offered.
- I then asked WREN ("One of four. I have known all four of them for years, and it does not help." / "Anything more, before I sign?"); the list dropped to archive, Recruiter, Montana.
- Montana again, confirm again, "[Sign it, sir.]" went to the signing: card read, Montana order, "He caps the pen." Minigame closed.

### 3. H&L placing sheet (game 3779, `s3779.jsonl`)

Started in `open_stacks`. Opened `hl_box` with `HL2015-0477` (code given by me; HaX supplies it in play, so this is not an earned secret in this run), took "Placement Record, HL2015-0477" (the read sets `sleeper_shortlist`). `window.npcManager.timedMessages` afterwards held both mapped texts, both `delivered: true`:

- "After Quantum Dynamics we checked everyone TalentStack ever touched. Harwick & Lowe shut before TalentStack opened." triggerTime 40914
- "That sheet leaves two, and nothing in this building splits them. That one's for Montana." triggerTime 50915

Gap 10 001 ms. Both were scheduled at the same wall-clock instant (ids end `...086842` and `...086843`). PASS.

### 4. `match_the_hand` title and HaX topic (game 3806, `s3806.jsonl`)

Real route: Sorensen hatch ("Pull Derek's file through", "Lean on the counter", Darkside, save), emulated the clone at the cage door, dusted the stamp, presented the lift to the plan cabinet, took "Candidate Assessment, Intake 2011". Flags 3-4 not submitted, so the identity scene did not fire.

- Task title in state: "Compare the hand on Nightshade's file (Candidate Assessment, Intake 2011) with the notebook scan in HaX's case file", status `active` (it appeared in `openTasks` after the pick-up).
- HaX phone hub listed: "WREN." / "The hand on Nightshade's file." / "Tran." / "Where do I stand?" / "That's all for now." Choosing the hand topic, with the notebook unread, gave "Read the notebook scan in my case file first. Then look again." and the topic stayed in the hub.

N1 (for a human to rule on): in game 3781 (flags 1, 2 and 3 pre-submitted, then the file taken) the identity scene ran straight after the pick-up and the task came out `completed` with `hand_matched: true` while `notebook_read` was false. So on the route "flag 3 first, file second" the player never gets the "[The hand...]" topic and the task completes without a comparison. I did not read the ink or ERB to say whether that is intended.

### 5. Reel deck (game 3781, `s3781.jsonl`, `item5-deck.txt`)

Identity scene played through (`item5-identity.txt` is empty because the call is a phone-chat the dialogue reader could not read; the scene was driven with the phone state: "Afterwards. Not during." then "Understood."), then the Recruiter's call in the tape room (Go on / Keep your name / The Alpha tapes / On my way / Understood), then `alpha_tape_deck` with `deck_pulled=alpha_tapes`. The clip: "The best lock there is opens for the right name. Nobody fights a door that's expecting them." / "And build your own way out first. Always. Then let them build their way in." / HaX: "Session two. He gave that lecture every year." PASS.

### 6. Login slip and binder

- Login slip, read in game 3809 (reading room, standalone, no `vm_ips`):
  `CATALOGUE – OVERNIGHT INDEX RUN` / `Host: the catalogue server on your VM list` / `User: catalogsvc` / `Password: Catalog!Helena2016` / `Noor – for the night run only. Don't leave this out. M.S.`
- Enrolment binder, read in game 3796 (crate lockpicked with `completeLockpick`, assisted): `TOMB BETA – WORKSHOP ENROLMENT, SPRING INTAKE` ... `Inside the back cover, typed: Enrolment site, on the Tomb Beta server on your VM list. User: nostromousr. Password: TombBeta!Enrol16.`

The fallbacks read as sentences, not `PLACEHOLDER_...` as the fix-pass commit message says; `919524c0e` changed them afterwards. No IP address shows standalone, as expected.

### 7. Dusting (game 3771, `s3771.jsonl`)

Stamp (Fingerprint Kit, magnetic powder, 49% coverage, tape pressed 100%, lift 70% Fair), pattern Whorl, then candidates 1 Jesse Tran / 2 Noor Haddad / 3 Margaret Sorensen. Picked Jesse Tran:

- The card became "1. Jesse Tran (not a match)" and `disabled: true`; the candidate list showed `rejected: true`.
- Reason text: "No match: the ridge endings and forks near the core sit in different places. Compare them card by card."
- Noor Haddad and Margaret Sorensen stayed pickable. Picked Sorensen: "Match: ridge detail agrees at the core and both deltas... This is Margaret Sorensen's print." Card label "3. Margaret Sorensen (match)", then "Log the print" closed the minigame. PASS.

### 8. Regression sweep (game 3809, `s3809.jsonl`)

Fresh game, `--imports=latest`, no head start. Briefing driven by hand (first choice each time, through "Bring me a name I can say in court."), HaX call (office door, then "On my way."), tutorial declined, front-desk door lockpicked (assisted), Noor with the real shredder cover ("Shredder service. Margaret Sorensen called about the feed." then "Lean in over her list..."), EM4100 read and saved, staff passage opened by emulating the clone, reading room, slip read, drop terminal, `<flag:1>` submitted through the button (flag supplied, not earned), HaX's follow-up call opened.

- `drain` page errors: 62, every one `Failed to load resource: ... 503 (Service Unavailable)` (TTS on the keyless server, expected). No JS exceptions. Saved to `drain-3809.json`.
- verify-run.rb: `VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 1 flags submitted.` 4 of 4 tasks in objectivesState completed (`get_inside`, `meet_the_clerk`, `set_up_drop_terminal`, `submit_catalogue_flag`), score 15, `noor_cover` set, `staff_card_cloned`, `catalogue_login_found`, `flag1_submitted`.

Earned-secrets rows for this sweep:

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Noor's staff card | EM4100 clone | Noor, lean-in choice | yes |
| Front desk door | lockpick (assisted) | Lock Pick Kit, HaX call | yes (assisted) |
| `catalogue_server:flag_1` | `<flag:1>` | slip (login) found; VM work not possible standalone | **no, flag supplied** (prerequisite, the slip, held) |

Everything downstream of flag 1 was not played here. Items 2 to 5 were exercised from head starts, so they show the changed text and branches work, not that the route to them is reachable in order.

## Notes

- N1 above: identity scene auto-completes `match_the_hand` and sets `hand_matched` when flag 3 was submitted before the file was taken.
- N2: `--start-room salvage_cage` left the game with `room: null` (brief and `room` both empty, doors unreachable). Starting in `tape_room` and walking through the door worked. Harness or head-start artefact, not tested further; the item 6 binder was read from the second game.
- The error-count in item 8 covers game 3809 only. Page errors were not drained in the other sessions.
- Head-start artefacts seen: the Recruiter's forced call fires on tape-room entry and blocks `enter`/`moveTo` until it is finished (`call.sh` in the scratch folder drove it).
