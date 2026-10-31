# P1-C spikes F3 and F4

Run on 2026-10-21 by packet P1-C. Scripts and raw output are in the packet's scratch folder
(`se-P1-C/f3.mjs`, `cdp.mjs`, `f4.cjs`, `f3_*.txt`); nothing here touched the repo.

## F3. The scheduler in a background tab

**Question.** Does the NPC manager loop (`npc-manager.js` `startTimedMessages`, a 1 s
`setInterval` calling `_checkTimedMessages`) keep ticking while the tab is hidden, and at what rate?
This decides whether the mail countdown is ticked or computed from a stored wall-clock deadline.

**Method.** Chromium 131 (Playwright build 1148), `--headless=new`, driven over raw CDP. Playwright
itself could not be used: it emulates focus, so a background page still reports `visible`. With raw
CDP, opening a second tab and activating it makes the game tab report `document.visibilityState ===
"hidden"`. The game was m01 on the keyless :3001 server (game 2861). `_checkTimedMessages` was wrapped
to log `[Date.now(), visibilityState]` on each call. No game audio was playing in any run
(`game.sound` had no playing sounds and there were no playing media elements), which is the normal
state of a lab with the music off or not yet started.

| Run | Flags | Hidden for | Ticks while hidden | After return |
|-----|-------|-----------:|--------------------|--------------|
| A | default | 90 s | 60 in the first minute (median gap 1000 ms), then **none** for the last 30 s | first tick 29 ms after the tab was shown |
| B | `IntensiveWakeUpThrottling` grace 10 s, autoplay off | 150 s | 60 in the first minute, then 1 in the second (a 47 s gap), 0 in the last 30 s | 24 ms |
| C | grace 10 s, autoplay allowed | 150 s | 60, then 1 (45 s gap), then 0 | 29 ms |
| D | default | 300 s | the tab stopped answering `Runtime.evaluate` at the end: the page was frozen, so no script ran at all | (run aborted) |
| E | default | 330 s | 30 in the first minute (gaps of about 2 s), then exactly 1 a minute (60 s gaps) for minutes 2 to 5, none after 294 s | 9 ms |

**Answer.** No, not at its normal rate. For about the first minute in the background the loop runs
at 1 s (sometimes 2 s). After that Chromium's intensive throttling allows about one tick a minute
(runs B, C, E), and in two runs (A for 30 s, D at five minutes) nothing ran at all; in D the page did
not even answer a DevTools evaluate, so it was frozen. On return the next tick comes at
once (within 30 ms). So a ticked countdown would lose most of the hidden time, and a 15 s reply could
wait as long as the tab stays hidden.

**Decision.** The countdown is computed from a wall-clock deadline (`dueAt`, held in memory per job).
`remainingMs` is derived from it when the section is exported and turned back into a deadline on
restore. A hidden tab that misses ticks loses nothing: the first tick after it is shown delivers every
job that fell due. `mail-scheduler.js` also ticks once on `visibilitychange` to visible, so the
reply does not wait for the next 1 s tick. A reply that falls due while the tab is hidden arrives
when the player comes back, which is when they could read it anyway. The time a page is closed is
not counted (the remaining time is restored, not a deadline), matching `timedMessages`.

## F4. `mailState` size at the lab's real volume

**Question.** Six seeded messages plus a full student's sends and jobs, measured against the 60 KB
`pagehide` keepalive budget.

**Model** (`f4.cjs`; generous on purpose). Six seeded inbox messages with 900-character bodies.
Sends: 2 from `freemail` and 4 to Hampshire, 5 to Pierce and 4 to Lord from `guest` (the plan expects
two to three each), each a full `00` §10a sent record (templates, slots, a 700-character rendered
body, attachment, link for Lord, three tells on a failure), each with a 220-character reply. Three
pending jobs (two ink, one text), two drafts, three metrics. Thread positions were measured with
`story.state.ToJson()` after running a real compiled story from its `start` knot (`neye-eve`, 5 lines;
`m01_npc_kevin`, 51 lines and several choices), since no lab mail story exists yet.

| Piece | Bytes |
|-------|------:|
| Six seeded messages | 7,383 |
| One sent record / one reply | 1,434 / 564 |
| `mailboxes.guest` (32 messages) | 33,573 |
| `mailboxes.freemail` (4 messages) | 4,056 |
| Three jobs | 1,011 |
| Drafts (2) / metrics (3) | 279 / 197 |
| One thread position (small story / m01 Kevin) | 494 / 843 |
| Whole `mailState`, all keys | about 40,300 to 41,000 |
| A delivery's change (`mailboxes.guest` + `jobs`) | 34,612 |
| A send's change (mailbox, jobs, metrics, drafts) | 35,109 |

**Answer.** A whole student's `mailState` is about 40 KB, inside the 60 KB budget, and the change a
delivery makes is about 35 KB, because the keyed unit is the whole mailbox (`mailboxes.<id>`). A
delivery-then-close is therefore kept while the other changed sections stay under about 25 KB, which
for the lab (one changed globals map of a few KB) holds. A student at the plan's expected two to three
attempts per target sits nearer 25 KB for `guest`. Thread positions are small (under 1 KB each).

**What follows.**
- `mailState` goes second in the first reduced `pagehide` list, straight after `globalVariables`, and
  is dropped whole in the second list (as `00` §10a says). Built that way.
- The 35 KB delivery delta was the price of a per-mailbox key. P1-S (`sync_size_review.md`) made the
  finer key the design: one key per message (`mailboxes.<box>.<msgId>`) and per thread, and `00` §10a
  now says so. A delivery's change is now about 1.1 KB and a read mark about 1.1 KB (measured with a
  35 KB `guest` mailbox; see "P1-S outcome" in the review).
- Seeded mail is now stored as a stub (`{ id, seeded: true, read, gameTime }`, about 60 bytes), so the
  7.4 KB of seeded text above is no longer stored or sent; the scheduler rebuilds it from the scenario.
- The first sync after each page load sends the whole section (every keyed section does), about 33 KB
  for a full student with stubs; that goes by the normal `PUT`, which has no 60 KB limit.
