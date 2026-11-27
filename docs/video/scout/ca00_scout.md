# ca00 How it works (first play): trailer scout (DESK SCOUT, 23 Nov 2026)

Onboarding episode at Quayholt Insurance (QI, purple accent `#6b4c9a`, tier S). Scouted from files only: `scenarios/ca00_first_play/mission.json`, `scenario.json.erb`, `ink/anjali_rao.ink`, the `tts_cache/ca00_first_play/` sidecars (49 clips) and the kit ambient ink. **Nothing was run in a browser, no server, no ffprobe except the clip lengths below, and no live `/tts` test.** Everything marked "not verified" needs the first take pass. Model: ca15 (no attack half), but unlike ca15 this episode has no choices, no sort and no step-away, so the footage of "how an episode runs" has to come from another episode (see S6).

## Headline

- **One room, one kiosk, one stage.** `training_room` only. Cast: Anjali Rao (host, `anjali_rao`), Darren Price (`kit_darren_price`) and Niamh Doherty (`kit_niamh_doherty`) seated at their desks, a water cooler. No locks, keypads, call, OSINT browser or VM. `"stages": ["brief"]` and `"variant": "brief"`, so the episode runner shows a **single brief stage** (the strip is not the six-step strip of ca12 or the five-step strip of ca15; what it shows with one stage is not verified).
- **The brief is seven cards**, one at a time with Back, Next and "Card n of m"; the last button reads "Got it" and completes the stage; then a "Brief read / Close the kiosk to carry on." panel. Card headings: Welcome; How it works; Nothing real is asked for; What we record, and who sees it; Why anyone targets you; The habit to keep; Report, and no blame. **These cards are the trailer's main footage** and contain no tell, answer or verdict.
- **No attack footage exists in this episode.** The "how an episode runs" montage must be reused from ca12 or ca01 takes (see S6 and owner question 1).
- **Lines:** only three lines are usable and all are short. No hook line beyond a greeting exists; the room has no ambient bark of its own (the scenario sets `ttsPregenerateChatter` but the kit pools in this game are not verified to fire; both seated staff only chatter on a thirst need, `needsSpeed` 90, `decayPerMin` 30, cooldown 5 min).
- **Brief-only run is short** (`estimatedDuration` 5 min). `episode_core_00_first_play_done` completes the objective and the conclusion screen ("You're set").
- **Tier S: no step-away beat.** Beat 8 of the template becomes the ambient room shot.

## Set pieces

| # | Set piece | Entry state (take script) | Status |
|---|---|---|---|
| S1 | Training room wide: Darren and Niamh at their desks, cooler, kiosk glowing blue (emitter `kiosk`, `effect: screen`), Anjali standing at (5.5, 3.8), QUAYHOLT sign | fresh game (`PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca00_first_play`), `prepare` from `tools/video/takes/ca12/_ca12b.mjs`, `--hide-hud --zoom-step 1`. Player spawns at (6, 6.2) | not verified. No bubbles expected; hold on picture, not a line. Check the player sprite is `female_office_worker_v2` (ca15 saw the hooded hacker once; use `checkSprite` from `_ca15.mjs`) |
| S2 | Kiosk open, brief card 1 "Welcome" | `openKiosk(page, bridge, mark)` (`interact('training_kiosk')`, as ca12 t03) | not verified for ca00 (ca12 and ca15 verified the same helper) |
| S3 | Cards 2 to 7 by `Next` | `pressButton(page, /^Next/)` per card; hold each long enough to read; card 7 button "Got it" | not verified; button text is from `strings` ("Back", "Next", "Card n of m" are engine copy: confirm exact wording in `episode-runner-minigame.js` `_briefCards` at the take) |
| S4 | "Brief read" panel and conclusion screen | press `Got it` | spare; the conclusion screen's "You're set" is not needed |
| S5 | Anjali, hub line, two versions | Welcome (before the brief): talk to her on a fresh game, `interact('anjali_rao')`. After the brief: finish the brief, close the kiosk, talk to her again (the ink reads `episode_core_00_first_play_done`; to skip the kiosk, `--set episode_core_00_first_play_done=true` should do it, but `--set` fires no events, so a game record still shows the objective open; not verified) | not verified. Chat shows the choice "Thanks, Anjali." and `#exit_conversation`; cut before the menu |
| S6 | "How an episode runs" montage (reuse) | No ca00 entry state; cut from existing ca12 takes `t04_osint_note`, `t05_pretext_card`, `t06_the_call`, `t07_flip`, `t11_defend_queue` (times in the script table) | recommended; needs owner yes (owner question 1) |
| S7 | Say-hello beat: Niamh | walk to her, `interact('kit_niamh_doherty')`; she says the ca00 knot line; closing the chat completes the optional task `say_hello` | not verified live; text and sidecar are cached |

## Cached lines usable (sidecar text and clip length from ffprobe; live `/tts` not tested)

| ID | NPC | Text | Len | When it fires | Use |
|---|---|---|---|---|---|
| L1 | kit_darren_price | Welcome aboard. Good to have you on the floor with us. | 3.58 s | talk to Darren in a ca00 game (knot `ca00`) | hook |
| L2 | kit_niamh_doherty | Hiya, welcome in. Give us a shout if you need anything at all. | 3.58 s | talk to Niamh (knot `ca00`) | say-hello beat |
| L3 | anjali_rao | Welcome. I'm Anjali, I look after security here. Say hello to one of the team before you sit down, then open the kiosk for a quick brief. | 8.74 s | first talk to Anjali, brief not done | too long for a beat; spare |
| L4 | anjali_rao | That's you set. Start your first episode whenever you're ready, and report anything that doesn't sit right. | 6.65 s | talk to Anjali after the brief is done | **end line** (outline's choice) |
| L5 | anjali_rao | Any time. | 0.86 s | reply after "Thanks, Anjali." | spare |
| L6 | kit_niamh_doherty | Hiya. There's a water cooler over by the wall if you need it. | 3.62 s | spare Niamh line (cooler chatter), firing not verified | spare |
| L7 | kit_darren_price | Alright. Help yourself to the cooler if you're parched. | 3.70 s | spare Darren line, firing not verified | spare |

Other sidecars in this folder belong to other episodes' kit knots (`ca03`, `ca05`, `ca08`, `ca16`, the "Good spot..." and "Nice catch..." branches). Never use them: the "Good call..." and "Nice one..." lines praise a caught item (grades). Per the outline's "Lines not to use", none of the above is a grade line.

## Spoiler judgement

- Show: all seven brief cards (headings and text; the cards hold no answers, the habit card is the course habit), the room, Anjali's two lines, Darren's and Niamh's greetings.
- Pattern level only for the montage: reuse ca12 shots that already passed review (public profile and a noted detail, a pretext card filling, the call, the flip, the inbox before any verdict). No readable worked lure.
- Off: anything from other episodes' debrief or verdict screens, the conclusion screen is allowed but unneeded.
- Honesty check: the montage is another episode's footage under a Merrin & Sallow tab. The card must say so ("An episode at Merrin & Sallow") so it never reads as Quayholt gameplay.

## Hazards and blockers for takes

- Strip with one stage is unverified (see Headline). If the strip looks empty or odd, crop to the card panel and skip the strip.
- Card button names and "Card n of m" are engine copy, not scenario data: confirm on the first pass.
- Card 4 ("What we record, and who sees it") says the organiser sees name, email, progress and results; the outline notes the organiser view is to be confirmed in Hacktivity before it is drawn. The script only speaks the "no free text, verdicts and times" half. Check the VO against the Hacktivity app before sign-off.
- Card 2 says the attack first half is "in most episodes" and the choices version is "in a few"; the VO must keep "most".
- A used game reopens on its saved step: make a new game per run (`alreadySeen` shows "You have seen this already").
- The Anjali end line (L4) needs a finished brief; the take run is: new game, open kiosk, Next x6, Got it, close, talk to Anjali.
- Avatar: scenario avatar is `female_office_worker_v2`; set `BE_SPRITE` as for ca15 (hood hazard). The player is visible only in the room wide.

## Not verified

Every set piece (desk scout only); live `/tts` for L1 to L7; the one-stage strip; whether any ambient bubble fires in this room; the `--set` shortcut for the done flag.
