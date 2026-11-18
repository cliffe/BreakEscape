# Phone reopen fix: review R2

Commit reviewed: eae5f561a (`git diff 56240a20b eae5f561a`), handover e32af6dc1.
Counts: B0 M1 m4.

Method: read the diff, the new tests and fixture; checked the inkjs build's observer handling; a sweep harness (scratch copy of the module) that walks every m01 to m10 and lab phone story from each knot to depth 3, and at each resting menu flips each story global in turn and calls reopenWithCurrentGlobals, recording the entry chosen (top, stitch, keep, exception, home) and a "replay the last choice under the new globals" result as a rough ideal; mutants on a scratch copy of the module and test (the worktree was not touched).

## R1 findings

- R1 M1 (m10 Elena/Vance guard): closed. Sweep of m10_elena_phone and m10_vance_phone: every reopen takes the knot top or the stitch, none is kept or sent through the exception; the top wins whenever its baseline reaches the cut menu, so the R10-m2 guard runs.
- R1 M2 (m09 flag1_read rewind): closed for flag1_read; see M1 below for the read-outs the exception now sends to the hub.
- R1 M3 (mutants): mostly closed; four survivors listed under m3.
- R1 m1 (hard-coded start): closed (opts.homeKnot, _hasKnot).

## Question 1: entry selection and dry runs

- Observer: the vendored inkjs `SetGlobal` only queues or fires a change when `this.variableChangedEvent !== null`. Assigning null on the instance shadows the prototype method; reassigning the saved function restores it, and it is still called as a method. Story-level `ObserveVariable` observers hang off the same callback list, so they are detached too. Correct.
- State: each dry run ends with `LoadJson(syncedState)` in `finally`; variables, visit counts, turn indices and the callstack all live in the state JSON, so nothing leaks. Tags are collected, never processed, during dry runs. External functions bound on phone stories are pure getters (phone-chat-conversation.js 139-178).
- Tunnels and threads: no phone ink has a thread (`<-`). The tunnels (m02_phone_agent0x99.ink:896, m07_phone_agent_0x99.ink:395 and 409, m09_phone_agent0x99.ink:172) hold text only, so no saved menu sits inside one.
- Nested choices and gathers in knots without stitches: the first choice path is `knot.0.c-1.3.5` style, `_reopenEntryPath` returns null, only the top is tried, its baseline does not reach the nested menu, and the menu is kept. See question 4.
- Multi-stitch knots: only the stitch owning the first choice is tried. Fine for every campaign ink (no menu mixes stitches).

## M1. The divert/end exception fires when the knot top already left the knot under the old globals

phone-chat-conversation.js:715-721 (`if (top && (top.choices.length === 0 || top.firstPath.split('.')[0] !== knot)) chosen = top;`). The commit message and doc comment say "unless the knot top NOW diverts", but the code never looks at the top's baseline. A knot whose top guard is satisfied by a flag set inside the knot itself therefore throws the player out on ANY synced global change.

Failure scenarios (harness, then checked against the ink):
- m09_phone_agent0x99.ink:626-690, hour_read. `hour_read_here` is set on the first line of `body` (633), and the top (628) sends `hour_read_here` to the hub. A player resting mid read-out on "Who gets it first?" / "What's he hiding behind?" or "Analysis had a guess..." / "How many people, HaX?" closes the phone, does anything that sets a global (128 of the story's globals trigger it in the sweep, the m0x history flags included), reopens: the hub. The casualty figure, the realisation and its choice are skipped, and `hour_read_done` (674, 682, 686) is never set, so `hax_voiced_scene_pending()` stays true until the forced re-ring (`hour_read_resume`) replays it. Same as main before the fix (69d8bf05a re-ran the top), so not a regression on main, but R1 asked for these to be kept and the handover expects them kept.
- m02_phone_ghost.ink:33-60. The top guard `{ghost_contacted_player: -> return_contact}` is satisfied by the `~ ghost_contacted_player = true` just before the first menu. A player resting on "Somebody let you in." / "There is a woman on ECMO..." / "Say nothing." who submits a VM flag (flag_proftpd_submitted, flag_database_submitted) or reaches any of the ransom globals, then reopens Ghost's thread, gets the mid_mission_contact menu ("You want me talking to you. It slows me down." ...) with no new line shown (the top's old and new runs print the same text, so it is all treated as already read), and the introduction and ransom demand are never offered. Again the behaviour main already had, now reached through the exception.
- m09 ledger_read.ask and afterwards resting on their closing "Got it." / "Understood." also go to the hub; harmless (both choices only close the call).

Suggested fix: fire the exception only when the guard is new, i.e. the top's OLD-globals baseline stayed in the knot and offered choices (`top.baselineKey !== '[]' && top.baselineFirst.split('.')[0] === knot`), and under the new globals it leaves or ends. That keeps the hour_read and Ghost menus. It also keeps flag1_read's "Got it." instead of jumping to the hub, which is what R1 suggested and costs nothing (the choice closes the call; the home-knot fallback still runs when start has something new). Change test 10 to a fixture whose top guard is false under the old globals and true under the new, add an hour_read-shaped fixture (flag set on the stitch's first line, top diverts on it) and assert the mid read-out menu is kept, and update the doc comment and the m09 flag1_read ink comment (223-225) which still describes the old engine behaviour.

## m1. A stitch entry still skips a knot-top guard when the top's baseline does not reach the menu

phone-chat-conversation.js:711-713 (entry list and `runs.find`). m09_phone_recruiter.ink:46-53: the call's top ends the call once `deck_choice_made`. The deck menus are stitches reached through earlier choices (yes_block 176, tape_choice 215), so the top's old baseline replays the opening and does not match; the stitch is chosen and the guard is skipped. Harness: resting on "Her file." / "The Alpha tapes." with deck_choice_made then true (HaX's deck_resume re-ring makes the same choice) re-offers the deck choice, and taking it re-sets recruiter_offer / deck_pulled and completes answer_the_offer again. Main before the fix ran the top and ended the call. Reachability is doubtful: the call is forced (disableClose) and R1 notes a reload mid-call resets to home, and if the game writes `#set_global` values back into the story VARs the top's baseline does reach tape_choice and wins. Hence minor.

Suggested fix: when the stitch is chosen, still compare the top: if under the new globals it ends or leaves the knot while under the old globals it did not, take the top (the same "new guard" test as M1). Add a fixture: a guard at the knot top, a stitch menu reached by a choice from another stitch.

## m2. The "ends" arm can close the phone on open

phone-chat-conversation.js:720 (`top.choices.length === 0`). Recruiter resting on "On my way." with deck_choice_made newly true: the top's `#exit_conversation -> DONE` runs, the tag is processed, and the phone closes as the thread opens. The effect equals tapping "On my way.", and main did the same, so note only; with the M1 fix it still fires here (the guard is new). Worth a line in the doc comment.

## m3. Surviving mutants

Run against test/js/phone-reopen-stitch.test.mjs on a scratch copy (module restored and compared byte for byte afterwards):
- A. match on texts only (drop `r.baselineFirst === sourcePath`): survives.
- B. match on path only (drop `r.baselineKey === savedKey`): survives.
- C. exception without the `top.choices.length === 0` arm: survives (no fixture where the top now ends).
- E. home knot not tried when nothing was chosen (`const sameChoices = !!chosen && ...`): survives; the kept-menu path's home fallback is untested.
- J. drop `knot !== home`: survives, but it looks equivalent (the home dry run equals the top run), so no test needed.
- Killed: stitch first (7), new-choices match (several), any-top exception (11), exception without leaves-knot arm (10), home ignores fresh (5, 11), hard-coded start (12), `_hasKnot` always true (13), no finally restore (11), home on choice change (5, 11).
- Observer detach removed survives this file; R1 found it killed by phone-reopen-and-persistence.
Not done: A, B, C, E against the 16 related phone suites (a scratch run of those suites, unmutated, showed 2 failures in my copy that I did not examine, probably path artefacts of the copy).

Suggested fix: a fixture where two places offer the same choice texts (kills A), a top guard that ends the call (kills C, and covers m2), a kept nested menu whose home knot now prints something (kills E). B is close to equivalent; a fixture with an extra conditional choice set by the top's own `~` would separate it.

## m4. The home knot is not `start` for m01 and m02 HaX

npc-manager.js:322 takes homeKnot from the registered currentKnot, which is `first_call` for m01 (scenario.json.erb:637) and m02 (744). m01's first_call is a silent divert to the hub, so nothing changes. m02's first_call replays the opening briefing and then first_call_choices; its guard sends a player past the front desk to the hub. The sweep shows 81 m02 HaX reopens that took the home knot ("TOP+HOME"); I did not inspect them. The briefing lines match the baseline and are dropped, so the visible effect should be the hub's new output only, but a live check of one m02 HaX reopen with a changed global (front desk done) is worth adding to the handover's live list.

## Question 4: missions without stitches (m01 to m08)

Sweep results by story: m03, m04 (both), m05 (all three), m06, m07, m08 HaX: only "TOP" and "TOP+HOME", no keeps, no exceptions. m01 HaX: 1352 keeps, all nested `+ +` menus inside event knots (for example event_derek_office_locked "Got it", m01_phone_agent0x99.ink:464-480); main rewound these to the knot's first menu, the fix keeps them, and none of them was stale under the replay check. An improvement. m02 HaX: top or home only. m02 Ghost: M1.

## Live checks still open

From the handover: m09 hour_read.body (now: expect the hub, which M1 says is wrong) and ledger_read; m02 HaX and Ghost reopen with a changed global. After an M1 fix: m09 hour_read mid read-out kept, m02 Ghost first menu kept, flag1_read "Got it." kept.
