# M8 review, round 2 (m01 first ring: R1 fixes)

Reviewer: Opus 5.5, 2026-11-12. Commit read: `916104732` (ringer tutorial hold, tour text after the call, `callLabel`, log), HacktivityLabSheets `b912564`. Inputs: `REVIEW_M8_R1.md`, `REVIEW_M8_R1_OUTCOMES.md`, `proofs/M8_r1/`.

**Verdict: accept with fixes.** 0 B, 1 M, 3 m, 3 n. All R1 findings that were taken up are fixed. The tour text arrives exactly once on every path I tried, the double `conversation_closed` included. The new tutorial hold has no limit, though: a tutorial the player leaves open holds every ring in the mission.

## Live check (keyless :3026, headless, server stopped afterwards)

Probe script and screenshots are in the reviewer's scratchpad, not committed. Every run is m01 with `--unlock main_office_area` and a real room entry.

| Run | Result |
|---|---|
| Tutorial accepted and left open | The ring stayed queued (`queued:1`, no banner) at 30, 60, 90, 120 and 150 s. A real click on SKIP TUTORIAL put the banner up at once ("Agent HaX \| SAFETYNET secure line \| Incoming call"). Answer, "You're in.", Texts it is, then the tour once. See M1. |
| Tutorial accepted, reload while the ring is held | After the reload the queued call, which never rang, is recorded as **Missed call** with "Texting from here, then." and the tour (one copy), while the tutorial prompt is back up. Tutorial re-accepted then skipped: nothing rings. Call back works: "You rang back. Good habit." Tour count stays 1. See m1. |
| Tutorial completed, then reload while ringing | Missed call, "Texting from here, then.", the tour once (row 27, as designed). |
| Forced call offered during the tutorial | Queued for 25 s with no auto-answer. After `complete()` the banner showed with Answer only and the call connected about 6 s later. Pass. |
| Tutorial declined, answer, End at 0:02 | `m01_first_ring_done` is already true (the knot runs to its choice at once), so the tour arrives once. Opening and closing HaX's thread afterwards adds nothing. Pass. |
| Decline, call back about 8 s later | Missed call, "Texting from here, then.", the tour, then the callback. Tour count 1. Pass. |
| Decline, call back within 1 s | The tour text lands **inside** the callback, between "You rang back. Good habit." and "One test call before it's texts only." in the thread. See m2. |
| Decline, reload 2 s later, then call back | The pending 5 s text survives the reload. Tour count 1 before and after the callback. Pass. |
| Answer, close, reload at once and again | Tour count 1 after both reloads. Pass. |
| Double `conversation_closed` | A forced call closed (one real close), then two synthetic `conversation_closed:agent_0x99` emits in a row: tour count stays 1. On a fresh game with `m01_first_ring_done` set by hand, two emits in a row also give 1. The `onceOnly` count goes up synchronously, so the second fire is refused even before `m01_tour_sent` is set. Pass either way. |

Tests: `bin/test-js` on all 12 `phone-ring*`/`phone-*ringer` files: 12 passed. Validator on m01: no errors. The two new onceOnly warnings (`phone_call_declined` indices 10 and 13, `phone_call_missed` 11 and 14) are the follow-up text and the tour, so firing together is intended.

## R1 findings

| R1 | Status |
|---|---|
| M1 opener repeats the text | Fixed. No "You're in." text before the call. The tour follows the call on every path. |
| M2 banner covers the tutorial | Fixed for the case it named. The hold has no upper bound (M1 below). |
| m1 `callLabel` | Fixed: "SAFETYNET secure line". m04 now matches it in the working tree. |
| m2 lab sheet line 387 | Changed, but the new sentence is wrong in a different way (m3 below). |
| m3, m4, n1–n4 | As the outcomes say. m3 still waits for audio. |

## Findings

### M1. A tutorial left open holds every ring for the rest of the mission
`tutorialShowing()` (`phone-ringer-dom.js:57-63`) is true for as long as `TutorialManager.active` is true. `active` only goes false on `complete()` (after step 8's Continue) or on Skip. The panel is not modal: the player can walk, interact and play the whole mission with it up, and a player who stops clicking Continue partway keeps it active for good. Seen live: 150 s with the m01 ring queued and no banner. Queued offers have no expiry (`phone-ringer.js:780-787`), so nothing ever rings: not m01's first ring, and not the rings in m03, m04, m05, m07 (all the Architect's taunts would stack up), m09, or any later mission. The tutorial prompt comes back in every new game whose browser has no `tutorial_completed` key, so this is not limited to m01. A forced call waits behind it as well.

This is the opposite of R1 M2's problem, and worse: hiding SKIP TUTORIAL for 20 s was cosmetic, while losing every call silently is not. Fix (engine sweep, orchestrator's call), any of:
- hold for the prompt and for a capped time while a step shows (say 30 to 45 s per queued offer), then ring with the banner moved below `.tutorial-panel`;
- or release the hold once the current step's objective is complete (the Continue button showing), so only an unfinished step blocks;
- or show the banner below the tutorial panel and drop the hold for an active step, keeping it only for `promptOpen`.

Add a test that an active tutorial with no end still lets the call ring within a bound.

### m1. Reload mid-tutorial turns a call that never rang into a Missed call
With the ring held by the tutorial, a reload records it as "Missed call" and sends "Texting from here, then." The player never saw or heard it ring. This is the ringer's existing row 27 (a saved non-forced offer is missed on load), and it applies to any queued offer, but the tutorial makes the queued window long (M1). The thread still reads sensibly and Call back works, so this is minor. Fix (engine sweep): restore a saved offer that is still `queued` (never rang) as a fresh offer rather than a missed call. Or decide that row 27 stands and record that.

### m2. A quick call back after a decline gets the tour text mid-call
The decline and missed tour mappings (`scenario.json.erb`, the two `m01_tour_sent` mappings after the follow-up text) set `m01_tour_sent` at once and deliver after 5 s. A player who declines and rings straight back (about 3 s in a real UI) is on the call when the text lands. The thread then reads "You rang back. Good habit." / "Now get a feel for the place..." / "One test call before it's texts only." Fix (config only, no voiced line changes): fold the tour into the declined/missed follow-up so it goes at 1.5 s ("Texting from here, then. Get a feel for the place...") and drop the two 5 s mappings. Or cut their delay to about 2 s.

### m3. Lab sheet line 387 now says HaX rings back after the report
`HacktivityLabSheets/_labs/safetynet/m01_first_contact.md:387`: "...message Agent HaX to report Operation Shatter; she rings you back to bring you in." Reporting is a text exchange (`report_operation_shatter`, `m01_phone_agent0x99.ink:381`, no `#place_call`), and nothing rings after it. The bring-in comes much later: after Derek and the launch device, the player chooses the debrief in the hub and that dials her (`:146-147`, and the sheet's own `:436`). Fix: "Then open your phone and message Agent HaX to report Operation Shatter." Drop the clause, or say "you call her in later to be debriefed".

### n1. Stale `_comment` on the ring mapping
`scenario.json.erb`, ring mapping `_comment`: "six seconds after the first office entry (after the 1.5 s text above)". That text is gone.

### n2. "You're in." after a long tutorial hold
The plain opener keys off `call_answer_seconds`, not the time since entering. After a 2-minute hold the call still opens "You're in." It reads well enough, and it goes away if M1 caps the hold.

### n3. The bring-in call has no caption
The first ring and its callback show "SAFETYNET secure line". The bring-in (`#place_call:closing_debrief`) has no `callLabel` on the contact, so it falls back to "Voice call" (README_scenario_design.md:1914). Adding a contact-level `callLabel: "SAFETYNET secure line"` would make all of HaX's calls match. It is optional.

## Checks that passed (no finding)
- **Opening as a whole.** Briefing, the 3 s "Agent, I'm your handler..." text, Sarah, then the main office: 6 s of quiet, the ring, the call. The call carries the arrival ("You're in.") and the reason for texts, and the tour then reads as her first working text ("Now get a feel for the place."). Losing the welcome text costs nothing. On decline or miss, "Texting from here, then." followed by "Now get a feel..." reads naturally.
- **"SAFETYNET secure line".** It fits. It is the caller ID on the agent's own encrypted handset, and it matches the README's example and m04. It does not clash with HaX's "overheard" line about cover, because that line is about speaking aloud, not about the screen.
- **Other missions and labs with no active tutorial.** `tutorialShowing()` is false when `getTutorialManager` is missing, throws, or is inactive (unit test 5). The lab SE pretext calls do not go through the ringer (`pretext-card` has no `phoneRinger` use), so they are untouched. The fixer's `se_dev` proof stands.
- **Forced call.** Not auto-answered behind the tutorial. It rings with Answer only and connects about 6 s after the tutorial ends (live and unit).
- **The guard.** `m01_first_ring_done` sits on the shared line, which every opening reaches, and the knot runs to its choice before the player can hang up. So answered, short-hung-up, declined, missed, callback and reload at each point all end with exactly one tour text.
- `m01-first-contact-vm-technical-steps.md` not opened.
