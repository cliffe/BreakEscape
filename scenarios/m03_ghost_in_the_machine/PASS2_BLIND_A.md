# m03 pass 2 — blind playtest A ("do your best"), partial

Game 2184 on :3001, headless, 2026-10-12. Saved by the orchestrator from the tester's final message (the tester's Write and its session cleanup were refused by auto mode's safety check, so the run stopped at about 60%: safe, flag 4, transaction log, Sterling/Danny aftermath, debrief and credits not reached; no verify-run output). Session log `tools/playtest/m03-blindA-session.jsonl`. A second "do your best" run (PASS2_BLIND_A2.md) replaces this one for the ending.

## Timeline (goal as the tester understood it)
1. Briefing: meet Sterling, clone her card, return after dark for the VM (4 flags) and paper trail. Clear. Chose "decide when I've got the facts" on Danny; "thorough" approach (looked cosmetic).
2. Reception: objectives + HaX toast said get past the conference reader. Ffion's visible choice "Lean in by her lanyard…" → RFID read, dictionary crack, save. Self-explanatory.
3. Conference reader: emulated the staff badge, first time.
4. Victoria: curious-recruit lines; cloner read across her dialogue with narrator beats; Darkside ~30 s; both cards saved.
5. Reload after Victoria: "Continue?" title, state preserved, respawn at reception.
6. "Walk out and come back after dark": nothing in the lobby said how; entering the main hallway played the night turn (~5 s hesitation).
7. Night: new objectives clear. Staff badge at the server reader first → silent drop back to the list, no visible denial.
8. Server room: ROT13 whiteboard decoded in CyberChef; VM terminal reached; flags 1–3 supplied; safe is 4 digits / 5 tries; filing cabinet picked (assisted), runbook a good VM hint; phone hint hub excellent.
9. Danny's office: review, photo, GHOST folder, unsent notes; chose "She lied to you about the client".
10. Terry: caught picking Sterling's door in his cone (bluff / apologise / shove offered). Reload mid-conversation → "Resume session" overlay (different from reload 1), respawn at reception. Second attempt timed on his patrol, not detected.
11. CEO office: drive from the drawer; `Sterling2010` from the helpdesk slip + plaque, first time; Base64 email and hex roster found. Stopped here.

## Stuck moments
- Walking out for the night turn (~5 s).
- Terry's patrol (~2 min): caught once; detection on interact, not on walking past; cone visible but rhythm must be learned.
- Reload screens differ between reloads.

## Decisions
- Approach choice: consequence not shown — reads cosmetic.
- Danny: clearly arguable, strong dialogue; consequence not reached.
- Sterling's ethics questions: arguable; consequence beyond trust not seen.
- Terry bluff/retreat/shove: presented, not resolved.

## Best lines
Ffion "I only order the pizzas." · Danny's notes "I'm the man who drew the map." · Sterling "Competent is cheap." · Sterling "The buyer who explains himself is the one you should worry about." · HaX "They rehearse on what they sell."

## Worst lines
Danny "*shakily* You'd do that." (stage direction shown) · HaX "Guides on request" (repeated nudge) · Narrator "Nearly there. Keep her talking." (reads as a game prompt) · Danny "A stranger in my office at night, and me trying to explain I'm not what the map makes me look like." (long) · Sterling "Everything on that board is real, and everything on it is broken. On purpose." (stiff)

## Conversation backgrounds
Reception day, conference day, Danny's office night, Terry's hallway: all match room and time of day.

## Scores (partial run)
Fun 4 · Pacing 4 · Clarity 4 · Openness 4 · Teaching 4

## Severity
| # | Sev | Finding |
|---|---|---|
| 1 | minor | Reload respawns at reception from any room (known backlog item). |
| 2 | minor | Reload screens differ ("Continue?" vs "Resume session?" overlay); inventory half-loaded until Resume. |
| 3 | minor | Ffion at the desk at 11 pm (by design: her night scene says she came back for her charger). |
| 4 | minor | Wrong card at a reader gives no visible denial. |
| 5 | minor | "*shakily*" shows as literal text in Danny's line. |
| 6 | minor | Harness only: the price list a guide mentions sits on the VM (flags supplied). |

0 blockers, 0 softlocks, 0 majors, 6 minors (partial).
