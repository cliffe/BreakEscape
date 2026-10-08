# The Keyholder Trials: re-review after fix round 1

Fresh, read-only re-review of fix commit 494c8b14 (Opus, 2026-10-06). Kind of game: a lab scenario with SAFETYNET spy framing. The aim is a short escape room where every lock is a CyberChef decode, with HaX's field notes doing the teaching and campaign-style dialogue (brief, AGENTS.md). Decisions in `DECISIONS_LOG.md` override reviewers. Line numbers refer to the files at HEAD. The working tree for this folder is clean apart from this file.

## 1. Scope and checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb … --skip-ink --no-graph` | Exit 0. The same 7 deliberate warnings as the build notes list (`validSprites`, two HaX mappings on `open_pigeonholes`, non-flag `concludeRequires`, Keyholder pickup mapping, debrief mapping without `onceOnly`, two AND-gate warnings). Nothing new. |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_tesseract_trials/` | "Totals by rule: none". It now counts lines in all nine files (the person-chat files were at 0 lines before M5). |
| Recompiled all nine `.ink` files with `bin/inklecate` into scratch | Clean, and every JSON is identical to the committed one. |
| `node scenarios/lab_tesseract_trials/tools/kstates.mjs` | ALL PASS (K1-K17, H1-H9). |
| `node scripts/ink_runtime_check/reopencheck.mjs … lab_tesseract_trials` | HaX 1800 reopens / 970 re-runs, Ghost 1800 / 498, 0 problems. |
| Own inkjs trace (`scratchpad/review-fix1/trace.cjs`, output `trace.txt`) | Five cases the fix round's checks don't cover: the offer's inline "So does she." spacing, `[Sending it now.]` on the device, Megan warned then refuse, the call's ink-locals reaching a device opened for the first time after the call, and `[Who are you?]`. Results are used in sections 3 and 5. |
| Engine read | `phone-chat-minigame.js:410-470`, `phone-chat-conversation.js:587-670` (`reopenWithCurrentGlobals`), `npc-conversation-state.js:26-120, 224-270`, `person-chat-minigame.js:466-510`, `npc-manager.js:1520-1569` (timed-message delivery). |
| Not run | No browser playtest (outside this review's scope). The fix round's own browser check (games 1585 and 1586) is in DESIGN "Fix round 1". |

## 2. Closure

I checked every fix by reading the line at HEAD, not the fix round's table. Nothing the table claims is missing from the code.

### REVIEW_IMPL majors

| Id | Status | Evidence |
|---|---|---|
| M1 "Back. So you've decided." on deferring | **Closed** | `phone_ghost.ink:173-178`: `parked` is set, the exit tag sits on "Your terminal's still open…", and `the_offer_again` skips its greeting once (`:185-189`). `[Still thinking.]` answers "Take as long as the building gives you." (`:194-198`). `[Close the device.]` answers "DEVICE IDLE." (`:98-102`, `:226-230`). Trace "A defer on call": the exit line comes out with `[exit_conversation]` and the next step prints nothing before the choices. The same bug class is still present on `[Sending it now.]`, which M1 did not list: see m1 in section 5. |
| M2 late-warning line was dead code | **Closed** | `closing_debrief.ink:35-39` (in `opening_sent`; skips the question, sets `report_read_claimed:read`); the dead branch is gone from `opening_double` (`:54-59`); credits `scenario.json.erb:332` and `:334`. |
| M3 prices behind an optional question | **Closed** | `phone_ghost.ink:152-161`: all three prices are unprompted, and "So does she." appears only when Megan wasn't warned. Trace A prints "Send it and you start Monday. So does she." with the space. `[What happens if I say no?]` is gone. |

### DIALOGUE_REVIEW majors

| Id | Status | Evidence |
|---|---|---|
| M1 Ghost's name, against m02 canon | **Closed** | `phone_ghost.ink:132`. |
| M2 send-then-warn | **Closed** | As REVIEW_IMPL M2. |
| M3 punched tape rows | **Closed** | `scenario.json.erb:136`: `○ ● ○ ○ ● ○ ○ ○` = 01001000 and `○ ● ○ ○ ● ○ ○ ●` = 01001001, which match the text under them. |
| M4 "Hand in the device" when it was never taken | **Closed** | `closing_debrief.ink:14`, `:97-101`. |
| M5 no speaker prefixes in person-chat | **Closed** | A grep for spoken lines without a `Name:` prefix in the five NPC files, the briefing and the debrief finds none. dialoguelint now sees 16-21 lines a file. |
| M6 HaX's voice-bible identity part | **Closed** | `scenario.json.erb:381`, `:402`, `:486`: each begins "…Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch." word for word. |
| M7 Sidhu's signature claim | **Closed** | `npc_sidhu.ink:75`. |
| M8 double and sent pay-off lines | **Closed** | `closing_debrief.ink:58` (double) and `:50-52` (`sent_cost`, reached from all three sent paths: `:38`, `:44`, `:48`). |
| M9 Ghost's device lines and refusal | **Closed** | `phone_ghost.ink:65`, `:85`, `:208-209`. The new refusal line contradicts the restored Megan price on one route: see m2 in section 5. |

### PLAYTEST_P3 majors

| Id | Status | Evidence |
|---|---|---|
| M1 an early close of the call loses the offer | **Closed** | `ghost_offer_heard` is set only at `phone_ghost.ink:159-161`, and the router sends `relay_opened or ghost_offer_made` to `the_offer` until then (`:56-57`, `:114`, `:119`). Ghost's text is at `scenario.json.erb:470`. `reopenWithCurrentGlobals` re-runs the knot named by the first choice's path (`phone-chat-conversation.js:624-627`). Moving the device's choices into the `waiting_choices` stitch leaves that path as `waiting.…`, so the re-run still enters at the top of `waiting` and routes. The fix round's browser check (`fix1-01`, `fix1-02`) shows the whole offer on the device. |
| M2 "A clean no" on the blown route | **Closed** | `closing_debrief.ink:87-96`. |

### PUZZLE_PLAN Phase A

| Id | Status | Evidence |
|---|---|---|
| P1 offers that don't give the answer away | **Closed** | `scenario.json.erb:421` ("…Odd. Bring the black box too…"), `:423` ("Not decimal, not hex, not binary…"). |
| P2 drop HaX's Special Collections text | **Closed** | `scenario.json.erb:425`: `onceOnly` and `fn06_offered` are kept, and there is no `sendTimedMessage`. |
| P3 Tom plants the key pair | **Closed** | `npc_tom.ink:42-44` (once, ink-local `told_keys`, after the first choice on either branch). The lab PC's observation is at `scenario.json.erb:592`, and `README.txt` is in the PC's contents (`:596`). |
| P5 "knock" out of HaX's text | **Closed** | `scenario.json.erb:430`. |
| P6 "Fourteen left" | **Closed** | `scenario.json.erb:464`. The countdown reads 212 → 40 → 31 → 14 → 9, with the device's "fewer than twenty" in between. |
| P7 copy, never retype | **Closed** | FN1 step 1, `scenario.json.erb:137`. |
| P4 | Deferred to the timed blind playtest (DECISIONS_LOG). Not a gap. |

Spot-checked minors from the same files: REVIEW_IMPL m1-m11 and the dialogue review's choice, briefing, Megan, Jordan, Cliffe, Tom and teaching minors are all in the code as the fix table says. PLAYTEST_P3 m9 (is Cliffe hidden in the common room after `workshop_open`?) is still unchecked in a browser.

## 3. Regressions

No blocker or major regression. Two new minors come from the fix round's own lines (m1 is old behaviour on a path M1's fix didn't reach; m2 is new). Details follow.

### `ghost_offer_heard` (global)

- **Declared:** `scenario.json.erb:205`; `scripts/ink_runtime_check/missions.json` (lab block).
- **Written:** once, `phone_ghost.ink:159-160`. The tag rides on the offer's last line ("Send it and you start Monday…"; trace A). No other writer.
- **Read:** `phone_ghost.ink:56` (`route`), `:114` (`the_offer_call`), `:119` (`the_offer`), and the mapping `scenario.json.erb:470`. HaX's ink doesn't declare it, by design: HaX's send and trap choices still open on `ghost_offer_made`. So a player who closes the call early can decide blind through HaX, but now has to ignore Ghost's text to do it. Accepted.
- **Reopen:** after an early close the device's saved story rests on `waiting`'s choices. Globals changed, so `reopenWithCurrentGlobals` re-runs `waiting` from its top: `route`, then `the_offer` ("CONTACT RESUMED." plus the whole offer). The baseline run under the old globals prints a progress greeting, so nothing in the new output is dropped as already seen. Confirmed by kstates K11, K12 and K12b and by the fix round's screenshot `fix1-02`.
- **Reload:** it's a declared global, so it persists with the others. On a reload after deferring, the device restarts at `start`, then `route`, then `the_offer_again` (K9).
- **Device never taken:** the call reads `ghost_greeted` false and says so (`:148-150`). On an early close, Ghost's text goes to a device the player doesn't hold. The bark still shows, and clicking it opens the thread (`npc-manager.js:1549-1560`, `startKnot: null`), so the offer is still reachable. Not a finding.

### `parked` (ink-local, Ghost and HaX)

- **Ghost:** set at `:99`, `:175`, `:195`, `:214`, `:227`. Cleared at `:76`, `:186`, `:222`. Phone-chat runs on to the next choices after an exit tag, so `parked` is always cleared before the device saves, and a later reopen or reload prints its greeting as before.
- **The call can save `parked = true`.** Person-chat takes one line per `Continue()`, so on `[I'll think about it.]` the call closes on the exit line before `the_offer_again` has run. If that state reaches the device (device first opened after the call, so it has no `npc.storyState` of its own, and `applySavedInkVariables` copies the call's ink-locals in, `phone-chat-minigame.js:414`), the device opens on its choices with no greeting (trace D). That is harmless, arguably better than "Back. So you've decided.", so it isn't a finding. Noted in case a later change gives the device a line that must print there.
- **HaX:** set at `phone_agent_0x99.ink:84`, `:171`, `:181`, `:187`, `:193`; cleared at `:61`. Each setter diverts straight to `hub`, so it is cleared in the same run. H8 and H9 pass. The debrief path sets it before an exit, which is harmless.

### Debrief conditions, ending by ending (`closing_debrief.ink`)

| Route | Lines | OK? |
|---|---|---|
| sent, no flag | `:32-34`, question `:40-48`, `sent_cost :51`, pixel, `why_you` with no ending-specific line, device line `:97-101` | yes |
| sent, then flag (`late_warning`) | `:32-37` (question skipped, `read` set), `sent_cost`, pixel… Credits: `scenario.json.erb:334` and not `:332` | yes |
| double | `:55-58`, pixel, `:84-86` | yes |
| refused (± flag) | `:62-65`, pixel, `:87-89` | yes |
| blown (± flag) | `:69-73`, pixel, `:90-96`, with each flag state getting its own line | yes |
| device never taken | `:100` on every route | yes |

`late_warning` can only be true on `sent` (`scenario.json.erb:435`), so the late-flag line in `opening_sent` covers every route where the flag arrives too late. The `*` questions (`:124-136`) leave `[That's everything.]` sticky, so `questions` never runs dry. The pixel explanation still plays on routes where the report was never opened. PLAYTEST_P3 m3 was rejected for that ("true on every route"), and I agree: it explains the trap, it doesn't claim the player fell for it.

### HaX's hub after a decision

`phone_agent_0x99.ink:59-66`. "Copy." / "Understood." / "Copy. Leave by the front…" are now followed by the choices with no greeting. A later reopen with changed globals greets "Go ahead." "I'm here. Careful what you say on this line." shows only between the offer and the decision. "Call me when you're clear." survives only in the timed texts that come after HaX's phone has been compromised (`scenario.json.erb:437`, `:439`, `:441`), where it's right. The FN10 offer text no longer arrives after a refusal (`:433`, `decision_made !== true`). FN9 now comes before FN8 (`:90`, `:105-112`).

### Ghost's offer text, call and device

One knot, `the_offer` → `offer_terms`, serves both; only `on_call` changes the stage lines (`:124-128`, `:134-136`).
- Call (trace A): narration, then the reveal, the terms, the device paragraph, the Megan price, the trick price, and "Send it and you start Monday. So does she." Then four choices.
- Megan warned (trace C): "…the second this week. Miss Oyelaran was the first." and "Send it and you start Monday." with no "So does she."
- Device after an early close: "CONTACT RESUMED." and the same text (`fix1-02`).

The spacing of the inline `{…: So does she.}` is right in the compiled output.

## 4. Fresh eyes

Judged against the brief: a short CyberChef escape room, teaching from zero, with campaign-style dialogue.

**What the round improved.** The climax now carries its weight. Ghost prices every route in the offer itself, the refusal line answers in m02's register ("I'll put you in the column for it."), and each ending's debrief says what it cost: "Ghost thinks you're theirs now…" on sent, "Only one of us knows." on double. Sidhu's scene is now the moment a signature expert reads the gap between the FROM line and the key, which is the plot and the lesson in one line. The teaching fixes (tape rows, FN6, FN9, Sidhu on password storage) remove the four places where a careful beginner would have been misled. Tom's key-pair plant gives the L8a trip back to the lab a reason in dialogue.

**Still weak.**
- **FN10 still teaches the claim Sidhu's line now corrects.** `scenario.json.erb:146` says "A signature proves who sent something and that nothing changed." The report is the counter-example: FROM says Agent 0x00, and the key is the Keyholder's. Sidhu now says it properly (`npc_sidhu.ink:75`); the note a student keeps doesn't. See m3.
- **The device's resting greetings still follow replies.** `who_reply` → `waiting` prints a progress greeting straight after "The examiner. You'll meet me when you've earned it." (trace E). `send_says_go` → `the_offer_again` prints "Back. So you've decided." after "Then send it…" (m1). The second sits on the climax path, so it's the one worth fixing.
- **The "classified" gag can still start on "too".** The fix swapped the two lines, so a player who skips `[How does it reach you?]` and asks `[Is he one of ours?]` hears "That's classified too." with nothing before it (`opening_briefing.ink:14`, `:49`). That is the same fault the dialogue review raised, on the other route (m4).
- **The offer arrives as one long block on the device.** After an early close it's about 17 lines in one burst. It's the fallback path and reads in order, so I'm leaving it alone. I note it only because a playtester will see it.
- **Jordan's "to be fair".** "They ask some odd questions, to be fair. I don't ask back." (`npc_jordan.ink:25`) doesn't concede anything, so the phrase sits oddly in the line (m5).

Nothing in this round adds a quiz, a VM step or an engine change. The brief's three lab-sheet errors are still absent (FN4 alphabet, FN8 2^56, FN9 "as with symmetric keys").

## 5. Findings

**Blockers:** none. **Majors:** none.

**Minors** (all mission-local; spoken-line changes are marked, though no audio is cached for this lab yet)

- **m1. "Back. So you've decided." after `[Sending it now.]` on the device.** `phone_ghost.ink:200-203`: `send_says_go` diverts to `the_offer_again` without setting `parked`, so the device shows "Then send it. Your handler's phone, not this one. I'll know when it's opened." and then "Back. So you've decided." (trace B). This is REVIEW_IMPL M1's bug class on a path M1 didn't list. *Fix:* in `send_says_go`, add `~ parked = true` and `#exit_conversation` above the reply line, as `[Still thinking.]` does. Re-run kstates and reopencheck. Device text only, not voiced.
- **m2. Ghost contradicts themselves on Megan-warned, then refuse.** The offer now says "Say no to me and you're the second this week. Miss Oyelaran was the first." (`phone_ghost.ink:154`), and the refusal then says "Two hundred and twelve picked up a card, and you're the first to say no to me." (`:208`). Both lines are new this round. *Fix:* branch `:208` on `megan_choice == "warned"`: "Noted. The second this week. Miss Oyelaran at least had the excuse of a conscience." (or just "Noted. The second this week."). Keep `:209`. On the call this line is voiced.
- **m3. FN10 says a signature "proves who sent something".** `scenario.json.erb:146`. It contradicts Sidhu's corrected line and the plot. *Fix:* "A signature proves which key signed something, and that nothing has changed since. Whose key that is, and what the text claims, are separate questions." Note text, not voiced.
- **m4. "That's classified too." can come first.** `opening_briefing.ink:49`, reached without `:12` when the player picks `[I'll read it. Go on.]`. *Fix:* label the first choice, `+ (asked_reach) [How does it reach you?]`, and at `:49` write `Agent HaX: That's classified{start.asked_reach: too}.` (the label lives in `start`, so it needs the knot prefix). Voiced (briefing).
- **m5. Jordan's "to be fair" doesn't fit the line.** `npc_jordan.ink:25`. *Fix:* "They ask some odd questions, though. I don't ask back." Voiced.

**Withdrawn**

- **W1. Moving the device's choices into the `waiting_choices` stitch would make a reopen skip `waiting`'s routing.** Withdrawn: `reopenWithCurrentGlobals` takes only the first path component of the choice's source (`phone-chat-conversation.js:624-627`), so it re-runs `waiting` from the top. reopencheck runs 498 Ghost re-runs with 0 problems.
- **W2. On an early close, Ghost's text is lost if the device is still in the lockbox.** Withdrawn: the bark shows whether or not the device is held, and clicking it opens Ghost's thread (`npc-manager.js:1549-1560`).
- **W3. The call's `parked = true` leaks into the device.** Withdrawn as a finding: it can only happen on a device first opened after the call, and the effect is a missing "Back. So you've decided." (trace D), which is harmless.
- **W4. `late_warning` on refuse-then-flag or blown-then-flag.** Withdrawn: those routes use `warned_out_of_band` (`closing_debrief.ink:63-65`, `:71-73`, `:91-95`), and `late_warning` is correctly limited to `sent` (`scenario.json.erb:435`).
- **W5. The pixel explanation plays when the report was never opened** (PLAYTEST_P3 m3). The fix round rejected it and I agree (section 3).

## 6. Verdict

**Small fixes.** Every major from REVIEW_IMPL, DIALOGUE_REVIEW and PLAYTEST_P3, and every PUZZLE_PLAN Phase A item, is closed in the code. The two new structures (`ghost_offer_heard`, `parked`) hold up on reopen and reload, and the static checks are clean. None of the remaining items blocks the timed blind playtest. They are each a line or two:

1. m1: set `parked` and exit in `send_says_go` (`phone_ghost.ink:200-203`).
2. m2: branch Ghost's refusal on `megan_choice == "warned"` (`phone_ghost.ink:208`).
3. m3: FN10 "proves which key signed it" (`scenario.json.erb:146`).
4. m4: "classified{start.asked_reach: too}" in the briefing (`opening_briefing.ink:11`, `:49`).
5. m5: Jordan's "though" (`npc_jordan.ink:25`).

After them, re-run the ink compile, kstates, reopencheck and dialoguelint. No browser re-check is needed for these alone. PLAYTEST_P3 m9 (Cliffe hidden in the common room) is still waiting for someone to look in a browser.
