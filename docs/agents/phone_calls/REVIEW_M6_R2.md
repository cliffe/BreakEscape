# Phone calls M6 (m07) review, round 2 (post-sweep light round)

Reviewer: Opus, 2026-11-12. Code under test: HEAD `dd2ba4ae5` (engine sweep `752d9d612`, `88862563c`, `40a15667c`; M6 R1 fixes `982e6fbbe`; HaX callLabel `4e5f7cd12`). Keyless server on :3028 with its own pid file, headless, stopped afterwards. Proofs: `proofs/PS_m07/`.

**Verdict: accept. 0 B, 0 M, 0 m, 4 n. Nothing is above a nit.**

## Live checks on committed code

| Check | Game | What I saw | Result |
|---|---|---|---|
| T-30 answered, replies walked to the end | 2214 | Polled every ~0.65 s (`ps_m07_checks.sh t30`, `t30_output.txt`). Opener narration, both voiced lines typed, the choice taken, `t30_close` typed. "The line drops. The log shows one call: no number, no name." was on screen from 2.0 s to between 2.6 and 3.3 s, then the phone closed (`mg: null`, `callActive` false). One `Call: No caller ID` row. T-20 then rang straight away (`t30_t20_banner.png`). | pass |
| T-20 declined, his thread opened by hand | 2199 | Rows `Missed call: No caller ID`, `Voicemail`. Three voicemail bubbles ("Busy. Of course. You've sent your team." / "You covered Washington…" / "Did you decide with a number…"), then the dead-air narration and `Hang up.` No `taunt_t20` live text in the thread (`decline_vm_thread.png`). | pass |
| T-1 replaces a queued T-5 | 2200 | Behind a real person-chat (`ray_hollis`): q 1 after both fired, only `taunt_t1` rang when the chat closed, one `Call` row. | pass |
| Forced sign-off, phone closed | 2220 | Rang on `minigame_completed`, answered itself (`state: connected`, `opened: true`), back arrow `display: none`. Walked to `signoff_close`. "The line goes quiet. The log shows the calls now…" held 2.0 to 3.3 s, then the call closed itself with no force-close (`mg: null`). `architect_signoff_done=true`, `debrief_requested=false`, ending unarmed (`signoff_fine_output.txt`). | pass |
| Forced sign-off, phone open (route `signoff`) | 2204 | Same, and the handset came back on its contact list afterwards (`signoff_after_signoff.png`). This clears the R1 outcome's "re-verify the self-close after part 2 commits". | pass |
| Bring-in, flags in | 2231 | Hub `Bring me in.`, CALLING, "Putting you through. He's waiting." voiced, `Outgoing call, 0:02` row, `debrief_requested=true`, `heldRecord` names `closing_debrief`. | pass |
| Bring-in, a flag out | 2235 | "Not yet. Put the rest of the flags through the relay and he's on straight after." voiced; ending unarmed (`null`). | pass |
| HaX hub call label | 2231 | The CALLING screen reads "Agent HaX / SAFETYNET secure line" (`bring_calling.png`). | pass |
| Look: inventory phone, contact list | 2226 | Device look (`look_list.png`). | as decided |
| Look: his thread tapped from that list | 2226 | Device look, voicemail bubbles with "Transcript:" (`look_thread_from_list.png`). | as decided |
| Look: phone opened directly on his thread | 2226 | Terminal look: "SECURE CHANNEL ESTABLISHED", green on black, voicemails as typed lines with a play control (`look_thread_direct.png`). | as decided |
| Look: in a call | 2226 | Terminal look (`look_in_call.png`). | as decided |

## Nits

- **n1 (route).** `m6_live.sh signoff` opens the phone before the console close, so its "closed itself (null = no force-close needed)" line prints `mg="PhoneChatMinigame"`: that is the handset back on its contact list, not a call left open. Test `phoneRinger.callActive()` there instead of `mgc`, or drop the `open_phone`. The proof itself is good.
- **n2 (proof gap, keyless).** The read beat's "wait for the last clip" half can't run without audio (`/tts` 503). Re-check one Architect call end in the audio pass: the last voiced clip should finish, then the narration line should hold its 2.6 s.
- **n3 (look, for the record).** I found no text or bark from `the_architect` in m07's config, so in normal play nothing opens the phone directly on his thread. The direct-open check used the bark path's params (`npcId`, `theme: phoneTheme`) by hand. Players will see his thread only in the device look, and his calls in the terminal look. That fits the item 11 decision.
- **n4 (proof housekeeping).** `signoff_tts.jsonl` and `t30_tts.jsonl` hold two runs each (2204 then 2220; 2209 then 2214), because my reviewer script reused the route's labels. Each `_game_id.txt` names the later run.

## The R1 nits left open (n2, n3, n4 in `REVIEW_M6_R1.md`)

No voiced line has a clip yet, so a change now costs one re-keyed line and nothing else.

- **R1 n2 (late `taunt_t20_vm` echoes the T-10 fold): leave.** It needs his thread held open from the decline right through to T-10. If it is ever wanted, wrap the "You covered…" branch (`m07_architect_comms.ink:574-582`) in `{not heard_t10: …}`. That is a condition, not a line change, so no key moves.
- **R1 n3 ("He has hung up first every time"): no audio concern.** `t1_close` (`:397`) is a `Narrator:` line and is not voiced, so it can change at any time. I'd keep it. A player who cut him off with the back arrow can still read it as his own conceit.
- **R1 n4 (seattle's "You'll have the figure by morning"): worth changing before the audio pass.** When the clock runs out first, seattle's reply (`:531`) gives away the sign-off's closing beat ("I'll have the figures… by morning", then "You'll have the figures too. Then we'll both know the same thing about you.", `:427-438`, `:457`) about ten minutes early. The sign-off is the call that should own the figures. One re-keyed voiced line, for example: "Seattle will tell you in the morning. Better you hear it from them than from me." Grade n. Adopting it before the clips are made avoids a regenerate later.
