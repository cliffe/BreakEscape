# Phone calls: review of the caller writing, round 4

Reviewer: dialogue review (npc-dialog-review skill, 2j, 2k), 2026-11-12.
Under review: branch `build/phone-calls-writing` at 18d1817c3, fix commit 5c6327184 (m07, R3 M1 and m1).
Read against `REVIEW_WRITER_CALLERS_R3.md` and `_R3_OUTCOMES.md`. HaX's files only for clashes.

## Verdict: accept

Both R3 fixes work as intended on every route I traced, and nothing else has changed in a caller file
since R3. One optional minor (m1) remains, with a 0-clip rewrite. Nothing a player would notice above
minor.

## Checks run

- Scratch root from `git archive HEAD`. `bin/inklecate` on all eight caller inks (m04 Vance; m05
  Recruiter, Patricia; m07 Architect; m09 Gary, Nightshade, Torres, Recruiter): no errors or warnings,
  and each committed `.json` equals a fresh compile.
- `loopcheck.js` on `m07_architect_comms.json`, 120 runs, no failure:
  - `start` (default; `architect_contact`; `grid_saved` alone and with `architect_contact heard_t30`;
    `grid_saved heard_signoff`, clean end), `dormant` (with and without `grid_saved`), `parked`
    (default; `grid_saved architect_signoff_done`, clean end), `dead_air` (default; `grid_saved`;
    `grid_saved heard_signoff`, clean end), `after_win`.
  - For each `team_assignment` in fracture, trojan_horse, meltdown and "": `taunt_t30`, `taunt_t20`,
    `taunt_t10`, `taunt_t5`, `taunt_t1`, `sign_off`, `seattle_call`, plus `taunt_t20` with
    `heard_t30` and the echo unheard, `taunt_t10` with T-20 folded and the window closed, `taunt_t10`
    redirected with `cascade_armed`, `taunt_t1` with `countdown_expired`, and `sign_off` redirected
    and expired. All 6/6 strategies reach a clean end.
  - All six `*_vm` knots across the four teams, each three ways (plain; `heard_t30
    architect_t20_played redirect_window_closed countdown_expired`; `team_redirected
    architect_t20_played`): 72 runs, all clean.
- Multi-call traces (one story carried across calls, `#set_global` applied as the phone does, a
  hang-up stopping at the choice, which is where row 25 resets the story):
  - A. T-30 hung up at its choice, then T-20, T-10, T-5, T-1 answered: the echo plays once, at the end
    of `t20_close`, and never again.
  - B. T-30 heard in full, then the rest: the echo plays once in `t30_close` and no catch-up fires.
  - C. T-30 and T-20 both hung up at the choice, T-10 answered: the echo plays once in `t10_close`.
  - E. T-30 to voicemail, then live calls: the echo plays once, in the voicemail.
  - F. T-20 as first contact: the echo plays once in `t20_close`, as before the fix.
  - G. T-1 as first contact after the countdown: echo in `t1_close`, then "He hangs up first."
  - D. T-30 hung up at its choice, then T-20 to T-1 all voicemails: the echo is never heard (m1).
- Engine reading: the phone runs a whole batch of ink ahead of the typeout and applies each line's
  tags and `~` as it goes (`phone-chat-minigame.js:755-822`). A hang-up during the typeout flushes
  the remaining lines into the thread (`:1539-1548`). So a hang-up partway through a close still
  sets `architect_echo_heard`, and the echo line is in the thread as text. The flag and what the
  player can read always agree. The catch-up's `~ architect_echo_heard = true` reaches the global
  through the observer (`npc-conversation-state.js:559-600`), and `t30_close`'s tag is copied into
  the story (`phone-chat-minigame.js:1455`), so B never doubles.
- `dialoguelint.mjs` on m04, m05, m07, m09: no hit in a caller file. The remaining hits are in HaX's
  or in-person inks and the ERB timed texts (line-length and blank re-entry), outside this review.
- Not re-run: the A7a validator. No caller config or ERB changed since R3, so its caller hits
  (config-pending "Call me" / "Ring me", Recruiter call VARs) stand as listed there.

## R3 findings: status

| R3 | Status |
|---|---|
| M1 hung-up T-30 loses the teacher echo | Fixed (`m07_architect_comms.ink:184`, `:271`, `:338`, `:390`). Routes A, C, F and G above play it once; B plays it only in `t30_close` |
| m1 folded T-20 line in `taunt_t10_vm` | Fixed (`:599-605`). Fracture: "Stop this…" → "Washington, then…" → door line; meltdown: "Stop this…" → "San Francisco, then…" → door line, open and closed window alike. Trojan and redirected players get no fold, as intended |

## Findings

### Blocker

None.

### Major

None.

### Minor

- **m1 (optional). A player who hangs up on T-30 at its choice and then lets every later taunt go to
  voicemail never hears the echo.** `m07_architect_comms.ink:564-653`. Only `taunt_t30_vm` carries the
  line; the catch-up lives in the live closes only. HaX's `[He used your line…]`
  (`m07_phone_agent_0x99.ink:281`) never shows for that player. The route is narrow, and a player who
  hangs up on every live call as well has, fairly, chosen not to listen. Still, a declined call
  currently does less for the teacher thread than an answered-then-dropped one.
  Rewrite: add the guarded echo as the last block of `taunt_t20_vm`, `taunt_t10_vm`, `taunt_t5_vm`
  and `taunt_t1_vm`, using the tag form, because the voicemail runner applies tags:
  ```
  {not architect_echo_heard:
      ~ architect_echo_heard = true
      #set_global:architect_echo_heard:true
      voice: Let it hurt afterwards, not during. I expect you've been told that.
  }
  ```
  The string is the one at `:561`, so no new clip is needed. In `taunt_t1_vm` it reads best before
  `:650` ("You'll work it out…"), so the message still ends on "written every one of them down". In
  the others it goes last.

### Noted, no change

- `t30_close:110-113` comment ("an early close still records it") now covers only a close inside
  `t30_close`; the catch-up handles a close before it. Comment only.
- m09 file headers still say "unvoiced" (Gary `:3`, Nightshade `:45`, Torres `:83`). Comment only;
  config will make them voiced calls.

## Read as the player hears it (last pass)

- **m07 Architect.** T-30 to T-1 each open on their own narration and run 3 to 6 spoken lines. The echo
  now arrives at most once, at the end of whichever call he finishes first, after HaX has said the
  line on the ops floor (ERB `:869`), so "I expect you've been told that" is always true when heard.
  In `t20_close` it follows his rhetorical question and reads as him answering it for you. Voicemails
  open in his voice, the folded T-10 message runs threat → which two are left → door, and the Seattle
  call and its voicemail match HaX's follow-up. Nothing jars.
- **m05 Recruiter.** Opener variants (callback, slow answer, plain) never stack. Each of the three
  replies leads into "Torres took debt relief…". The deal, refusal and acceptance lines each end the
  call cleanly, and a return call goes to the deal, "Still deciding?" or a remembered answer.
- **m05 Patricia.** Three openers by state, each followed by a choice that fits. The naming paths
  close on a line that tells you what to do next ("Ring back when you're sure", "Ring me back with
  evidence"), and the full naming call ends on "[On my way.]".
- **m04 Vance.** Openers by state, hub topics answer and return, and the call ends on "Call me if you
  need it." plus a state line.
- **m09 Gary, Nightshade, Torres.** Short single calls that read as incoming calls; Nightshade's "since
  before you picked up" and HaX's cut-in sit right on a call.

## Clashes with HaX's lines

None. HaX's `:281` topic gate reads `architect_echo_heard`, which every echo path sets once. Because the
echo can now come as late as T-1, the topic can appear late in the mission; it is a sticky hub choice
with no time gate, so it stays offered.

## Voiced lines

No change from R3: m09 ~21, m04 ~48, m05 ~97, m07 ~70. m1, if taken, adds 0 clips.
