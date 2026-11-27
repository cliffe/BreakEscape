# M5 review, round 3 (m05, post-sweep light round)

Reviewed 2026-11-12 at `dd2ba4ae5`, on committed code, after the engine sweep (752d9d612, 88862563c, 40a15667c), HaX's contact-level `callLabel` (4e5f7cd12) and the bring-in re-key (dd2ba4ae5).

**Result for M5: 0 B, 0 M, 0 m, 2 n.** Nothing is above a nit. The self-latch fix holds on m05's real path: the Recruiter rings after a real naming call, once, in every case run.

## Checks

- **Key diff** (`dump_tts_keys.rb` with labels, against `keys_baseline/m05_insider_trading.txt`): +118 added, 0 removed. Against the original M5 set (`proofs/M5/keys_added.tsv`) the only difference is the bring-in line: `0c899809…` (R0) is gone and `a190f4aa605022df59c73a05392d2b99` "TalentStack's line is still open. She's lost him. Ring her if you want to hear her lose." is in. R1's `d6574db9…` ("number's still open") is gone too. None of the 118 keys appears in any other scenario's current dump.
- **`tts_mission_lines_test.rb`**: 5 runs, 55 assertions, 0 failures (under the suite lock).

## Live check (keyless :3025, headless, server stopped afterwards)

Route `proofs/PS_m05/route.sh` (cases `rec_decline`, `rec_reload`, `root_slow`, `bring_label`, `captions`, `row31_probe`), plus `tools/phone_calls/routes/m05_live.sh` `root_row31` and `patricia` with `OUT=proofs/PS_m05`. Logs, screenshots and `/tts` logs are in `proofs/PS_m05/`.

The Recruiter cases use the real Patricia naming call through the Call button: [I know who it is.] [David Torres.] [Money…] [The upload schedule…]. Head starts are `patricia_phone_available`, `found_medical_bills` and `found_upload_schedule` only, so `torres_identified` comes from her ink. The reload in `rec_reload` is a bare `location.assign` with no `stateSync.sync()`, as for F5. The root flag is set as a global plus its change event, since the real flag needs a VM.

| Case | Game | What happened |
|---|---|---|
| `rec_decline` | 2212 | Naming call ended, then the phone closed. She rang about 7.5 s after the call's `conversation_closed:patricia_phone` with "TalentStack Executive Recruiting" under her name. Declined: `recruiter_texted=true`, no second ring in 12 s. Her thread: one "Missed call" row, a "Call back" header button, and the follow-up text "TalentStack Executive Recruiting. We should talk before you do anything you can't take back. - R.". Call back: CALLING, then "You rang back. Manners, or curiosity?" then `first_call`, `recruiter_contacted_player=true`, `answerSeconds 0` with `callback`. (This run pressed End at Patricia's [On my way.] instead of choosing it. `rec_reload` chose it.) |
| `rec_reload` | 2227 | Naming call ended on [On my way.], phone closed, bare reload 3 s later with `recruiter_texted=false`. After load the `game_loaded` twin rang 3 s into the watch: one ring in 30 s, `queue=0`. Left to ring out: one Missed row, `recruiter_texted=true`. |
| `root_slow` | 2228 | Root flag in: HaX rang on `topic_architect`, `architect_approval_confirmed=true` at the offer. Still ringing after 40 s (`untilAnswered`). Answered at `as=43`: "Finally. Sit down for this." then the authorisation lines. |
| `root_row31` | 2246 | The hub choice "The Architect signed off…" taken while the ring was pending: the placed call opened `topic_architect` and the ringer showed it `connected`. `queue=1` was not HaX (see `row31_probe`). |
| `row31_probe` | 2261 | Same, with the queue examined: `stateOf(HaX)=connected`, `stateOf(recruiter)=queued`. After End, the only ring was the Recruiter's `game_loaded` twin (the head start names Torres at load). HaX did not ring again, and her only row is "Outgoing call, 0:07". So row 31 drops her offer. Hub call caption: "SAFETYNET secure line" while dialling and once connected. |
| `bring_label` | 2239 | Twin rang at load and was declined. Bring-in from the hub: the dialled call reads CALLING, then the call. The reworded line was requested from `/tts` ("TalentStack's line is still open…") and showed in the subtitles. [On my way.] showed no overlay with nothing optional open, `mission_complete=true`, the person-chat debrief opened, and no ring in 15 s (`ringer=null`, `queue=0`). No Recruiter `/tts` request after load. |
| `captions` | 2249 | Root ring banner: "Agent HaX \| Incoming call", with no caption (n1). The answered call's screen reads "SAFETYNET secure line". |
| `patricia` | 2247 | Her thread has a "Call" button. It dials and connects: "Morgan." with [I know who it is.] [Just checking in.]. |

## Findings

### n1. HaX's ring banner has no caption, while her calls do

The root-flag ring mapping (`scenario.json.erb:1103-1112`) has no `callLabel`. The banner uses only the mapping's label (`phone-ringer-dom.js:125`, `:164`; README_scenario_design.md:1915). So the banner reads "Agent HaX / Incoming call", while the answered call, the hub call and Call back all read "SAFETYNET secure line" from the contact. This is not a regression, because the ring never had a label. The Recruiter's banner does show hers. Fix: add `"callLabel": "SAFETYNET secure line"` to that mapping, which changes no key. The alternative is an engine fallback to the contact's label on the banner.

Cross-track: m04's move of the label from its ring mapping to the contact (4e5f7cd12) will have taken the caption off m04's dial-ring banner in the same way. I did not check that live.

### n2. A Recruiter ring missed in about 11 s in `row31_probe`

`row31_probe`: she started ringing right after HaX's call ended (about 63.4 s), and `phone_call_missed:recruiter` logged at 74.9 s. That is shorter than the 20 s ring-out. It looks like time spent queued behind the call counted towards her ring. It is outside the plan's normal path, because it needs a head start that names Torres at load, and I didn't trace it. Record only. If it matters, check whether `advance()` counts queued time towards the ring-out for an offer that was waiting behind a connected call.

R2's n2 (the silent twin's text repeats HaX's own text) and n3 (proof README) are unchanged and still nits.
