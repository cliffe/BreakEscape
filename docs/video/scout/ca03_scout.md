# ca03 Help desk resets: trailer scout

Desk scout, 23 Nov 2026, for the attack-first episode trailer (recipe `docs/video/recipes/course-trailer.md`). Nothing was run: no server, no captures, no TTS, no live `/tts` test. Cached lines are read from the sidecars in `tts_cache/ca03_helpdesk_reset/` (92 files, 46 clips; every sidecar has its `.mp3`) and measured with ffprobe. Entry states are "expected, not played" unless marked. Models: the call beat follows ca12 (`ca12_scout.md`), the rest follows ca01. The batch 1 lessons apply (see the script's rules line).

## Headline

- **One room, one kiosk, one phone call.** The mission has a single room, `training_room` (Quayholt Insurance): Darren Price (host), Anjali Rao and Niamh Doherty (kit staff), the kiosk, the water cooler and a spare workstation. Leila Nassar, the service desk agent, is a phone NPC (`npcType: phone`), not a person in the room.
- **Strip, seven stages:** Brief, Research (`osint`), Write (the call), Prompts (`mfa`), Flip, Defend, Debrief. Company tab QUAYHOLT, accent purple `#6b4c9a`.
- **The call has the influence meter** (ca12 pattern): thresholds Wary at -30, Refuses at -50, Reports at -70 on `leila_influence`. A "pretext prep" card fills the four call blanks (name, team, manager, staff reference) from found facts, then the call is a phone chat with a sticky choice menu.
- **Leila has no cached voice lines at all.** No sidecar for `leila_servicedesk` or `leila` exists in `tts_cache/`. The attack payoff ("All done. I've reset it and sent a temporary password through.") has no audio. It plays as the game's subtitle bar only. The script covers it with a narrator line and flags a new cast line as an owner question.
- **The second attack step is the sign-in prompt stream** (`authenticator` minigame, decision mode): choose when to send (working hours / late evening / early hours) and how many (two or three / a dozen / one after another), then a phone-shaped overlay stacks the prompts until the target taps Approve. This is the outline's "push stream wearing an account down".
- **Defend seat is the service desk queue** (`e3_service_desk_queue`): four items, three calls (the impostor Gordon, the real Gordon, a "Marcus Hale, Vanteq" remote-access caller) and one overnight sign-in prompt. Call actions are Comply, Ring back, Escalate, Refuse. Two calls show the same four claimed facts, which is the episode's point and a good picture.
- **Step-away exists** (`strings.stepAway`, `episode_step_away` sets `kit_ca03_out`). After the defend set, Look up sends Anjali to the spare workstation (it switches to the `pc4_locked` sprite) and she barks the outline's end line. Darren's reply bark follows 4.5 s after she arrives (see hazards: overlap).
- **Music:** the scenario sets the PeaceFolk playlist (D331), unlike the earlier scouts that said CA had none. The takes carry it unless muted; the edit decides.

## Part A: voiced lines (cached; none tested live)

Durations are mp3 lengths; in game add 0.2 to 0.4 s. Branch keys: `kit_defend_done`, `kit_key_caught` (the early overnight prompt was denied), `kit_caught` (percent 85 or more).

### Hook candidates (kit staff, talk after the defend set, not caught)

| ID | NPC | Text | Len | Path | Use |
|---|---|---|---|---|---|
| H1 | kit_niamh_doherty | Helpdesk's had a run of odd reset calls lately. Keeps us all on our toes. | 5.74 s | `kit_defend_done=true`, `kit_key_caught` unset, talk to Niamh (ca03 knot) | **hook**: cut after the first sentence ("Helpdesk's had a run of odd reset calls lately.", about 3.79 s measured, silence 3.79 to 4.32 s; hook shot 4.2 s) at the silence boundary; burned caption for the cut sentence. Seeded entry state, tell the orchestrator and AC0 |
| H2 | kit_anjali_rao | We've had a few callers pushing for password resets this week. Worth a second look. | 5.14 s | same, Anjali (ca03 knot) | spare hook. Anjali is the end-line speaker, so keep her for the end |
| H3 | darren_price / kit_anjali_rao / kit_niamh_doherty | Phones haven't stopped today. | 2.69 / 2.02 / 2.54 s | ambient chatter, only before the kiosk Start | spare; too bland for a hook |
| H4 | the same three | Claims backlog's easing off. / Cooler's cold for once. | 1.9 to 3.0 s | ambient, before Start | texture only |

### End line (step-away room beat)

| ID | NPC | Text | Len | Path | Use |
|---|---|---|---|---|---|
| E1 | kit_anjali_rao | I came over to use the spare and it's on the sign-in screen, asking for everything again. Darren, is it doing this to everyone? | 8.33 s | kiosk step-away, Look up; Anjali walks to the spare workstation and says it on arrival (`npc_arrived`, `kit_ca03_there`) | **end line** (the outline's pick). Plan: first sentence only, ending "...asking for everything again." (5.68 s measured, silence 5.68 to 6.37 s; shot 6.1 s), because Darren's bark follows 4.5 s after her arrival and may overlap. Use the whole 8.33 s only if the dry run shows the bark queues behind hers |
| E2 | darren_price | Someone's password got out, and whoever had it wanted to walk in as a name we'd all trust. That's why IT is signing everyone out. | 8.62 s | the same beat, 4.5 s after Anjali arrives | spare. Names the cause, so it reads as a debrief; keep off |

### Darren, the host (kiosk host, `darren_price`)

| Text | Len | When | Use |
|---|---|---|---|
| Welcome to the Quayholt exercise. Start at the kiosk: research us, ring the service desk as the locked-out manager, then swap seats and cover the queue yourself. | 12.41 s | first talk, fresh game | too long; course-trailer material |
| Your call to the service desk has gone through. Now take the other seat at the kiosk and cover the queue the way those calls land in real life. | 9.22 s | after the call, before defend | flip line candidate, one 9 s sentence with no cut point. Not used: the strip tick and a card carry the flip in the plan |
| A prompt you didn't start is one to report, not approve. Number matching stops a careless tap cold. | 7.90 s | after defend, with a verdict branch | **off**: it is the debrief answer |
| That's the desk covered from both seats, thanks. / A name, a team, a staff number, anyone can find those online... | 3.74 / 12.70 s | repeat talk | **off** (the second names the tell) |
| You stopped a prompt nobody started... / You turned away the prompt that mattered... / That approval went through... | 7.6 to 9.5 s | verdict branches | **off** (grades) |

### Lines not to use (grades, verdicts, tells)

Anjali "Well caught. They'd have kept sending those until somebody gave in.", "Someone clocked that late-night sign-in prompt for what it was...", "A sign-in prompt you never kicked off means someone already has the password...Deny it."; Niamh "Good spot on that sign-in prompt nobody started...", "Good catch. Spotting it early let IT shut it down...", "Lovely work flagging that quick..."; all Darren verdict-branch lines above.

### Uncached (never generate without the owner's yes)

| NPC | Text | Where it plays |
|---|---|---|
| Leila Nassar (`leila_servicedesk`) | IT service desk, Leila speaking. How can I help? | call start |
| Leila Nassar | All done. I've reset it and sent a temporary password through. | `ask_reaction`, result 1 (the attack payoff) |
| Leila Nassar | I'm going to stop there. I'll need to verify you before I do anything else. | band 2 |

Owner question L1: voice the payoff line (one clip, about 4 s, needs a voice for Leila and an AC0 yes). The script works without it.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Visual |
|---|---|---|---|---|---|
| S1 | Room wide | `training_room`, Darren, Anjali, Niamh, kiosk, cooler, spare workstation | fresh game, Skip tutorial, close Brief | no | warm office, three staff on their needs; the player is the demo avatar (see Avatar) |
| S2 | Kiosk Brief and strip | `training_kiosk`, `e3_helpdesk_reset` | `__test.interact('training_kiosk')` (retry up to 3) | no | purple QUAYHOLT tab, the seven-step strip |
| S3 | OSINT browser | button `Open the browser`; sites `quayholt_site` (Our people, IT support, Events) and `quayholt_social` (Friendface) | after Start | public facts only: Gordon McLeish, Claims Manager; the Head of Claims, Ngozi Okonkwo; the staff reference QH-20719 on the Events page; Gordon's "off to the claims conference" post. A fact is noted by clicking its block | five noted facts feed the call. `requires` gates each call line on its fact |
| S4 | Pretext prep card | button `Prepare the call` | after S3 with facts noted | no; shows what you found and four blank pickers (who, team, manager, staff reference). The pickers are custom lists | the found facts filling the blanks; frame the card, not the sentence list below |
| S5 | The call with Leila | phone chat, influence meter | after S4, `Approach`/ring through | **partly**: the meter and the choice menu are fine. The two explanation lines under the meter name the technique and what is checked: hide them with CSS (`.pretext-tells`, the ca12 fix). The end-of-call tells panel is off | menu of up to six lines, meter bottom-left (Wary at -30, Refuses at -50, Reports at -70), Leila's subtitle on the bar |
| S6 | The reset lands | `leila_reset_granted` after the ask "Can you reset my password now?" | S5, with `manager` and `staffId` verified (needs both facts) | no; the line "All done. I've reset it and sent a temporary password through." is the game's own subtitle | meter reading and the subtitle; no audio (uncached) |
| S7 | Sign-in prompt stream | stage `mfa`, button `Open the phone`, `authenticator` minigame, decision mode | after S5 (only if the call landed; a failed call skips it) | choice radios are fine; the **outcome panel** (why it worked, the defender's note) and the banner "The target tapped Approve... this is MFA fatigue" are off | phone overlay, stacked "Are you trying to sign in?" cards from "Quayholt SSO", location Rotterdam; collapses past four cards to "...and N more" |
| S8 | The flip | closing the phone opens the kiosk at "Now you're the one answering" | after S7 | **yes** below the heading: the replayed call with the lines picked out, and the flip defender line. Crop to the heading and the strip only | strip ticks to Defend on Continue; panel "Take the calls" with `Open the queue` |
| S9 | Service desk queue | `defend.setId e3_service_desk_queue`, four items | after S8; `Open the queue`, then `Start` | the list: no. A call card shows the caller's facts and a transcript. The transcript lines are the tells ("No sense ringing the desk..."). Frame on the header and facts, not the transcript. No verdict pressed | "0 of 4 sorted", rows: Gordon McLeish twice, Marcus Hale (Vanteq), an overnight sign-in prompt |
| S10 | Step-away panel and room beat | "Look up" panel (`strings.stepAway`), then `kit_ca03_out` | defend complete, see entry state | no | Anjali walks to the spare workstation, which turns to a locked screen, and speaks |
| S11 | Debrief | kiosk step 7 | end | **yes** (percent, verdicts, the GDPR and 72-hour text) | not used |

Minigame types: episode runner, OSINT browser, pretext prep card, phone call with influence meter, authenticator push stream, flip view, triage (calls and a push), step-away panel, debrief. No locks, keypads or VM. New mechanics to name on cards: **Open-source research** (S3), **Pretext call** (S4 to S6), **Sign-in prompt stream** (S7).

## Cheapest entry states

Not played. All via `tools/playtest/new-game.sh ca03_helpdesk_reset [--set ...]`, a fresh game per take (a used game reopens on its saved step), `BE_SPRITE=female_office_worker_v2`, `FOOTAGE_ROOT=$HOME/video-takes-local`.

- **S3 to S7 (attack):** a plain fresh game, then play: Start, Open the browser, note the Our people, Events and Friendface blocks, close; Prepare the call, fill the four blanks, ring through; play the call (about 25 s); close the call; Open the phone, pick a time and a count, Start sending prompts. One continuous take per segment as in ca12 (`t06_the_call.mjs`, `_ca12b.mjs toCall`). Closing the phone opens the flip at once, so cut before it.
- **S8 and S9 (flip tick, queue):** `--set 'episode_e3_helpdesk_reset_state={"done":["brief","osint","write","mfa","flip"]}'`. UNTESTED: whether the call outcome global `pretext_quayholt_helpdesk_reset_outcome` also has to be set for the defend stage to open; the ca01 pattern needed `phish_supplier_contact_attempts`. The take script should try the state alone and fall back to replaying the call.
- **S10 (end line):** `--set 'episode_e3_helpdesk_reset_state={"done":["brief","osint","write","mfa","flip","defend"]}' --set episode_e3_helpdesk_reset_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e3_helpdesk_reset_defend_percent=100`, open the kiosk, `Look up`, `kit_quiet` must be true for the barks (it flips on the first state change). UNTESTED here; ca12 needed exactly this shape.
- **Hook (H1):** `--set kit_defend_done=true --set kit_attack_done=true`, `kit_key_caught` unset, walk to Niamh and talk. The hook is a talk line, not ambient chatter, so it is a seeded state.

## Spoiler judgements

- **Show:** the browser with facts noted; the pretext card filling; the call menu with the meter moving; the subtitle of the reset; the prompt stack; the strip tick; the queue list; one call card framed on its header and claimed facts, before any verdict.
- **Off:** the two technique and tell sentences under the meter; the end-of-call tells panel; the authenticator outcome panel and banner; the flip body (the replayed call with picked-out lines); the call transcripts and perFlagNote text on the defend cards; any verdict, percent or "Right call" panel; all debrief text; Darren's and the staff's branch lines in "Lines not to use".

### CSS hides the takes will need (confirm in the dry run)

- `.pretext-tells{visibility:hidden !important}` for the call (ca12's fix; the layout is kept).
- Authenticator: hide `.auth-outcome` and `.auth-banner` for the prompt take.
- Flip screen: hide everything below the heading.
- Defend card: hide the transcript block; keep the header and the claims.
- Always: HUD CSS from `tools/video/capture/launch.mjs`, Skip tutorial, close the Mission Brief.

## 9:16 and 1:1

Wide panels in this episode: the OSINT browser (two tabs, page and sidebar), the pretext card (facts and four pickers), the call (menu plus meter bottom-left), the queue list (title left, kind and time right) and the call card (header, claims, buttons). The authenticator phone is narrow and fits 607 px as it is. Plan the narrowed-panel take for the browser, pretext card, queue list and call card: inject `max-width` of about 560 px so text wraps inside the panel, record those four shots a second time for 9:16 and 1:1, and keep the 16:9 take as the main. For the call, an inset on the meter (scale 1.5 to 4) beside a person-chat framing. Do not leave this to the render.

## Avatar

The demo avatar is the hooded hacker, which reads as SAFETYNET. The player is in frame in S1 (hook, room) and S10 (end beat). Run both with `BE_SPRITE=female_office_worker_v2`. The call, prompts and queue shots show no player.

## Hazards

- **Bark overlap in the end beat.** Anjali's E1 (8.33 s) and Darren's E2 (8.62 s, delayMs 4500 from `kit_ca03_there`) can overlap. The script plans E1's first sentence only. A dry run decides whether the engine queues or overlaps barks.
- **The reset needs both verification facts.** `reset_password` verifies `manager` and `staffId`, so S3 must note the Head of Claims block and the Events page staff reference. With only the name and team the answer is "Before I reset anything, I'll need your manager's name and your staff reference."
- **Calls that go badly:** a few skip-verification or deflect lines (each costs influence) can push the meter to Wary or Refuses and the call to Reports at -70 (ends the call, skips the prompt stage). Script the take's line order: open_locked_out, give_manager, give_staffid, then the ask.
- **A failed call skips the prompt stage** (`skipMfaIfUnlanded`): the take must land the call or S7 never opens.
- The first `interact` on the kiosk is sometimes swallowed (retry up to 3). Closing the phone opens the flip heading and body at once. Ambient chatter stops after Start (`kit_quiet`).
- Throttle with `window.__test.throttleFps(20)`; never `fixedStep=false`.

## Not verified

- Tab labels for the call, prompt and queue stages (the script uses SERVICE DESK, SIGN-IN PROMPTS, QUEUE as placeholders; confirm from the panel).
- Whether the call uses the person-chat style with a bust for Leila (talk sprite exists, `leila_nassar_talk.png`).
- Live playback of any cached line, the cut points of H1 and E1, and the defend-state shortcut.
