# Phone calls M6 (m07) review, round 3 (light round after engine R1)

Reviewer: Opus, 2026-11-12. Code under test: `7fecbed08` (engine `464c42064` and `d05dad42d`; m07 `2eff0b186` and `7fecbed08`). HEAD moved to `239ca247d` during the round, docs only (A7 R3), so no code changed under the runs. Keyless server on :3028 with its own pid file, headless, stopped afterwards. Script and proofs: `proofs/R_m07_m09/` (`m07_r3.sh`, `m07_*_output.txt`, screenshots, session and `/tts` logs). The two bring-in runs used `tools/phone_calls/routes/m6_live.sh` with the same OUT.

**Verdict: accept for the engine and the ink. 0 B, 0 M, 1 m (lab sheet), 2 n.**

## Live checks

| Check | Game | What I saw | Result |
|---|---|---|---|
| T-30 answered and walked to its end | 2290 | Polled every ~0.65 s. "The line drops. The log shows one call: no number, no name." on screen from 301.6 s to between 303.5 and 304.1 s (about 2.0 to 2.5 s observed, so the 2.6 s beat less the first poll's lag), then `callActive` false and `mg: null`. One `Call: No caller ID` row (`m07_t30_output.txt`). | pass |
| Back arrow on a taunt | 2293 | T-30 answered, first line typed, back arrow clicked, polled in the page every 10 ms: closed after **10 ms**. One `Call` row (`m07_back_output.txt`, `back_after_back.png`). | pass |
| T-20 declined | 2294 | Rows `Call`, `Missed call`, `Voicemail`. His thread has the three voicemail transcripts (fracture team: "Busy. Of course…", "You covered Washington…", "Did you decide…"), then the dead-air narration (`decline_hang_thread.png`). T-10 had not fired, so the naming line is correct here. | pass |
| Seattle, "How many?" | 2300 | T-1 rang, `countdown_expired` replaced it with `seattle_call`. "How many?" played "Seattle will tell you in the morning. Better you hear it from them than from me.", and `/tts` was asked for that text as `the_architect` (503, keyless). "The line goes quiet." held about 2.6 s, then it closed itself (`m07_seattle_output.txt`). | pass |
| Forced sign-off | 2302 | Rang on `minigame_completed`, answered itself, back arrow `display: none`. Walked to `signoff_close`. The last narration held about 2.6 s, then the call closed itself (`mg: null`). `architect_signoff_done=true`, `debrief_requested=false`, ending unarmed (`m07_signoff_output.txt`). | pass |
| Bring-in, flags in | 2307 | "Putting you through. He's waiting." voiced, `Outgoing call, 0:02`, `debrief_requested=true`, held ending `closing_debrief` (`m07_bring_output.txt`). | pass |
| Bring-in, a flag out | 2310 | "Not yet. Put the rest of the flags through the relay and he's on straight after." voiced, ending unarmed (`m07_bring_notyet_output.txt`). | pass |
| Not yet, then the last flag | 2349, 2350 | Hub reopened: no "Bring me in.". Flag 4 set, ops floor entered: ending armed, "BEFORE THE MISSION ENDS" prompt. | as built (see m1) |
| "(Hang up.)" in his thread | 2294, 2299 | The thread offers `1. (Hang up.)`. Clicking it closes the phone at once. History before: one player line ("Who am I speaking to?", from the T-30 call); after: the same one, plus the narrator line "The tone stops a half-second before you do." No player bubble on reopen (`m07_hang_hist_output.txt`, `hang_hist_reopened.png`). | pass |

## Lab sheet (`m07_architects_gambit.md`)

The phone parts match play: HaX on the phone, the commit menu, "Bring me in." after the abort, the self-starting debrief. One sentence does not.

### Minor

**m1 (lab sheet, line 525).** "if a flag is still outstanding she tells you to finish the relay first and call again." The player can't call again. `bring_me_in` sets `debrief_requested` on both branches (`m07_phone_agent_0x99.ink:517`), and the hub hides "Bring me in." once it is set (`:228`). After the last flag the ending arms by itself on the next room entry or closed screen (the `all_in` mappings, `scenario.json.erb:1703-1712`). HaX's own line says this ("he's on straight after"). A student following the sheet looks for an option that is gone. Suggested text: "if a flag is still outstanding she tells you to finish the relay; once the last flag is in, the game offers to end the mission the next time you go through a door or close a screen." Proven live (`m07_notyet_after_output.txt`): after "Not yet" the reopened hub has no "Bring me in." (game 2349, committed code), and once flag 4 lands (game 2350), entering the operations floor arms `closing_debrief` and shows the "BEFORE THE MISSION ENDS" prompt (`notyet_after_after_flag4.png`). The flag was set by hand there (global plus its event), not through the relay. Caveat: game 2350 loaded at 22:35:49, just after someone else's uncommitted edits to `npc-manager.js`, `phone-ringer.js` and `phone-ringer-dom.js` (22:35:46 to 22:36:15) landed in the shared worktree. The ending check is not part of those files, and 2349 had already shown the same hub on committed code. Every other run in this round and in R5 started before 22:34.

## Nits

- **n1 (ink, look).** After "(Hang up.)", "The tone stops a half-second before you do." goes into his history, but the phone closes in under 271 ms, so the player never sees it until they reopen the thread. This is the text thread, not a call, so the read beat doesn't cover it. Either drop the line, or let a self-closing thread hold its last narration the way the terminal call does. Low value either way.
- **n2 (proof gap, keyless, carried from R2 n2).** The "wait for the last clip" half of the read beat still can't run without audio. Check one Architect call end, and the new Seattle clip, in the audio pass.

## Asked, answered

- T-30 to its end holds the last line: yes, about 2.6 s.
- The back arrow on a taunt closes at once: 10 ms.
- Declining T-20 leaves its voicemail: yes, three transcripts and a Voicemail row.
- Seattle's "How many?" plays the new line and asks `/tts` for it: yes.
- The forced sign-off closes itself: yes.
- The bring-in works both ways: yes.
- "(Hang up.)" posts no bubble: yes.
