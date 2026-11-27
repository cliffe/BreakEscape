# Phone calls M6 (m07) review, round 5 (light round)

Reviewer: Opus, 2026-11-12. Code under test: committed HEAD `88033afb3`, which includes the sign-off redirect line `c22f606bc` ("And you moved them. Not everyone does.") and the validator change `41d00b419` (`||` in `call.when` is an error). HacktivityLabSheets at `3587b73`. Keyless server on :3024, headless, stopped afterwards; every browser this round started was closed by its route. Script: `proofs/R5_m06_m07_m08/m07_r5.sh signoff_redirect` (sign-off and bring-in in one game). Output: `m07_signoff_redirect_output.txt`.

**Verdict: accept. 0 B, 0 M, 0 m, 2 n.** Closes M6. Ready for audio.

## Validators

- `validate_phone_calls.rb`: no output, exit 0. The new `||` check raises nothing on m07.
- `validate_scenario.rb --no-graph`: "Validation complete", exit 0 (`val_m07_architects_gambit.txt`). The output matches R4 line for line (same onceOnly, cutscene and stacked-text warnings, same four word-cap ERRORs on texts at `scenario.json.erb:952-975`).

## Live check

| Check | Game | What I saw | Result |
|---|---|---|---|
| Forced sign-off, team redirected to Trojan Horse, all four flags in | 2373 | `team_assignment="trojan_horse"`, `team_redirected=true`. `minigame_completed` rang the sign-off, which opened connected on knot `sign_off`. Lines in order: "You saved eight point four million people. I'm not being sarcastic.", "And you moved them. Not everyone does.", "I'll have the figures from Washington and San Francisco by morning.", then [You lost tonight.] to "I wasn't playing for tonight." and "You'll have the figures too. Then we'll both know the same thing about you.", then the closing narration, and the call closed itself (`active:false`, `mg:null`). `/tts` was asked for all five Architect lines, the new one included (503, keyless, as expected). One `Call: No caller ID` row; `architect_signoff_done=true`. | pass |
| Bring-in, same game | 2373 | Hub: [Bring me in.] first. CALLING, then ON CALL; "Putting you through. He's waiting." requested from `/tts`; row `Outgoing call, 0:01`; `debrief_requested=true`; armed ending `closing_debrief` on `minigame_completed`. | pass |

Route note, not a finding: setting `team_assigned=true` at game creation means HaX's first call is still owed, so the first open of her thread shows the first-call choices (run 1, game 2371, `m07_signoff_redirect_run1_output.txt`). The script now picks [Understood. Let's go.] first, which a real player has long since done. The tts log for this label holds both runs (the harness appends), hence ten Architect requests in the file.

## Lab sheet (`m07_architects_gambit.md`, `3587b73`)

Line 525 now reads "If you never ask, the game starts the debrief by itself after about nine minutes." R4 n2 is closed, and the rest of the paragraph still matches what 2373 showed.

## Voiced lines read for audio

I read every spoken line in `m07_architect_comms.ink` (T-30 to the sign-off and the voicemails) once more, and `bring_me_in` in `m07_phone_agent_0x99.ink`. No typos, no printed variables, no inline stage directions, and nothing that would make an awkward clip. On a redirect run, T-20 ("You moved them already."), T-10 ("You moved them. I had wondered whether you would.") and the sign-off now agree. R4 n1 is closed.

## Nits

- **n1 (writing, optional, no change asked).** On a redirect run the player hears "you moved them" three times (T-20 `:153`, T-10 `:224`, sign-off `:431`). It reads as his refrain, and the sign-off version adds something new. Leave it unless a listener finds it repetitive in the audio pass.
- **n2 (proof gap, keyless, carried).** The "wait for the last clip" half of the read beat still can't run without audio. Check one Architect call end and the Seattle clip in the audio pass.
