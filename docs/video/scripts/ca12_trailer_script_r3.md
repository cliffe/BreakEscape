# ca12 and ca12b trailer script, round r3 (Visitors and tailgating)

Status: outline and script only, 26 Nov 2026. No edit list, no take scripts, no TTS yet. Replaces the pilots r2 cuts (`tools/video/edits/ca12_trailer_r4.json` = ca12, `ca12_trailer_r4b.json` = ca12b) once AC0 and the owner sign it off.

Owner's verdict on pilots r2 (25 Nov, via AC0): "Rethink: Needs updating with the new content."

## 1. What changed from r2, and why

**What ca12 and ca12b were in r2.** Two cuts of one trailer, not two lengths. ca12 (A, 71.96 s) had no physical entry at all: the call landed, "You're in." played over the flip. ca12b (B, 74.96 s) was the same cut with a 3 s clip from the physical pen test lab (`lab_t15_disguise_tailgate`, 3.2-6.2 s) spliced in after the call, under "You're in.". Both had a silent bed (no music).

**Why they no longer work.** The owner asked for a real disguise and slip-past-the-guard mechanic inside ca12 itself, with the trailer rebuilt on ca12's own footage. That content now exists in the scenario (shell parts 1 and 2) or is being built (E1, E4):
- Jo Fairweather (`ca12_jo`, Northlight Security) is the red-team lead. The brief now frames the run as a booked test signed off by the partners, with a letter in Jo's kit bag. Jo is an offscreen voiced NPC. She has one cached voiced bark after a tailgate, plus two shown toasts (E4).
- Jo's kit bag in the studio: the authorisation letter and a courier's hi-vis you actually put on (the sprite changes on screen).
- After the call the learner stays in the lobby (E2 hold). The studio door becomes a side-door gate (E1) with a badge reader, and Yusuf Demir, the building's security officer, patrols beside it.
- Two ways through. **Desk pass**: Delphine says yes, walks round and holds the door ("I'll get the door for you."), and Yusuf waves you on ("Morning. Mind the step."). **Tailgate**: walk away from the desk, step back when Yusuf asks ("Deliveries go via the desk."), wait for Jun Watanabe to badge through, and follow him in while the door holds. Yusuf says "Delivery? Studio's straight through." and Jo comes in over the earpiece: "Nobody checked. A uniform and a held door beat both."
- Patrols are now started and resumed by events (E4 `start_patrol`/`resume_patrol`). Jun's loop starts only on the walk-away outcome, and Yusuf goes back to his patrol when the beat ends.
- At hand-back the hi-vis comes off (E4 `take_off`), so the defender never sits in a courier's kit.
- The flip names what happened (E5, `flipDefenderLineByGlobal`). For example: "You walked in behind a member of staff while the door held. Nobody had to say yes."
- NPCs walk in and out of rooms (the walk-in fix, merged in 592184080). Camila's step-away appearance becomes a walk-in from the lobby, through the gate, to the studio. That removes the pop-in the owner flagged at 0:14 in pilots r1.
- E4's dropped-item removal (`remove_world_item`) is ca15's (the USB stick). ca12 does not use it, so it is not in this trailer.

**So r3:**
- drops the lab clip from both cuts;
- adds two new attack beats, the kit and the door;
- turns the old A/B question into a question about routes: **ca12 = the desk pass**, **ca12b = the tailgate**. b stays the tailgate cut, as in r2.

## 2. Shape

**Does the shape change a lot? Yes.** AC0 should see this before any build.
- The attack half grows from four short beats (research, build, talk, lands) to six: research, build, **kit**, talk, then **lands + door** (ca12) or **walk away + tailgate** (ca12b).
- The physical entry is ca12's own footage with movement: a walk-in, a gate, a patrol and a follow.
- **Lorna's flip line (`lorna_flip`, 6.1 s) is cut from both cuts.** The door beat and the E5 flip line now carry the turn. Her tailgate-outcome line also no longer fits (see section 4).
- ca12b drops the defend-side tailgater card (4 s). The tailgate has just been shown from the attacker's seat, and the cut stays near 70 s.
- Music is added (section 6). r2 had a silent bed.
- Unchanged: Camila's hook line, the ca-open tagline, the red and blue chapter cards, the defend queue, Lorna's no-blame line and the close.

Times are targets from the reused clips' real lengths. New lines and new takes are estimated (speech about 2.35 w/s), so the retime happens from take marks.

### ca12, the desk pass (71.6 s)

| # | Time (s) | Beat | Seat | Content |
|---|---|---|---|---|
| 1 | 0.00-4.60 | hook | full | Camila arrives at the studio desks after walking in; her line |
| 2 | 4.60-10.00 | open | neutral | ca-open: Visitors and tailgating / Merrin & Sallow Architects, stripe #6b4c9a |
| 3 | 10.00-15.50 | topic | full | Camila's walk-in, follow-cam: across the lobby past Yusuf, through the gate (it opens for her), into the studio |
| 4 | 15.50-18.50 | red_card | attack | chapter card "You play the attacker" |
| 5 | 18.50-21.50 | research | attack | OSINT note (tab OPEN-SOURCE RESEARCH) |
| 6 | 21.50-24.50 | build | attack | pretext card filling (tab COVER STORY) |
| 7 | 24.50-28.50 | **kit (new)** | attack | Jo's kit bag on its hook: letter, hi-vis, the learner puts it on (sprite change) |
| 8 | 28.50-30.80 | talk | attack | the call, choice menu, INFLUENCE inset (tab FRONT DESK) |
| 9 | 30.80-33.80 | lands | attack | Delphine D1, trimmed after "through." |
| 10 | 33.80-42.80 | **door (new)** | attack, full frame | Delphine walks round and holds the side gate; the learner walks through past Yusuf |
| 11 | 42.80-45.80 | flip | flip join | hand-back; the kiosk flips to Defend, with the E5 line "The desk said yes on the phone, then opened the door for you. One call got you past both layers." |
| 12 | 45.80-47.80 | blue_card | defend | chapter card "You run the front desk" |
| 13 | 47.80-51.80 | tailgater | defend | Unknown visitor 09:12 card (the defend-side tailgate) |
| 14 | 51.80-62.20 | queue | defend | visitor queue: courier, colleague back from leave, hover over the four buttons, nothing pressed |
| 15 | 62.20-66.10 | lorna_noblame | defend | Lorna L5 |
| 16 | 66.10-71.60 | close | neutral | ca-close, "Play the attack · Learn to stop it", plate "Learn on Hacktivity.co.uk" |

### ca12b, the tailgate (70.6 s)

Beats 1-8 are as in ca12 (0.00-30.80). Then:

| # | Time (s) | Beat | Seat | Content |
|---|---|---|---|---|
| 9b | 30.80-37.30 | **reader (new)** | attack, full frame | the learner, in the hi-vis, walks up to the reader alone; Yusuf's bark; the learner steps back to watch (step back if challenged) |
| 10b | 37.30-45.80 | **tailgate (new, hero)** | attack, full frame | Jun taps the reader and goes through; the learner slips in behind while the door holds; Yusuf, then Jo in the earpiece |
| 11b | 45.80-48.80 | flip | flip join | the E5 line "You walked in behind a member of staff while the door held. Nobody had to say yes." |
| 12b | 48.80-50.80 | blue_card | defend | "You run the front desk" |
| 14b | 50.80-61.20 | queue | defend | as ca12 beat 14 |
| 15b | 61.20-65.10 | lorna_noblame | defend | Lorna L5 |
| 16b | 65.10-70.60 | close | neutral | as ca12 |

**Recommendation: ca12b leads and ca12 is the fallback.**
- ca12b shows the episode's title act and carries Jo's voice and attacker-terms payoff. It is the hero shot in plan section 8.
- ca12 needs only E1 for its new beats, and E4 for the Jo toast and the hi-vis coming off, so it can be shot sooner.

## 3. Narrator VO (Sulafat_v2)

Rules: at most 3.0 words per second over the cue window, UK English, no em or en dashes, no narrator line over a character line. Every cue is also a burned caption.

| Cue | Cut | Window (s) | Line | Words | w/s (window) | Clip |
|---|---|---|---|---|---|---|
| v1 | both | 4.70-9.81 | Hacktivity Cyber Aware: Security awareness training you can play. | 9 | 1.76 | voiced (shared tagline, 5.112 s) |
| v1b | both | 10.15-12.19 | Nobody checks she's expected. | 4 | 1.96 | voiced |
| v1c | both | 12.30-15.49 | This episode: visitors and tailgating. | 5 | 1.57 | voiced |
| v2 | both | 15.70-18.10 | First, you play the attacker. | 5 | 2.08 | voiced |
| v3 | both | 18.60-21.48 | Dig into what staff post in public. | 7 | 2.43 | voiced |
| v4 | both | 21.60-24.40 | Build a cover story from what you found. | 8 | 2.86 (caption held 0.38 s past the 2.42 s clip) | voiced |
| **v4b** | both | 24.70-27.70 | It's a booked test, so dress the part. | 8 | 2.67 | **new** |
| v5 | both | 28.55-30.35 | Then talk your way in. | 5 | 2.78 (caption held past the 1.58 s clip) | voiced |
| **v6b** | ca12 | 35.50-38.40 | Two layers: the desk, then the door. | 7 | 2.41 | **new** |
| v6 | ca12 | 41.60-42.40 | You're in. | 2 | 2.50 | voiced |
| **v5b** | ca12b | 30.95-33.95 | Or walk away, and watch the door. | 7 | 2.33 | **new** |
| v8a | ca12 | 47.95-51.02 | Tailgating: slipping in behind a badge-holder. | 6 | 1.95 | voiced |
| v8b | ca12 / ca12b | 51.95-55.24 / 50.95-54.24 | Decide who gets in, and who gets checked. | 8 | 2.43 | voiced |
| v9 | ca12 / ca12b | 55.40-57.22 / 54.40-56.22 | You've used these tricks yourself. | 5 | 2.75 | voiced |
| v10 | ca12 / ca12b | 57.37-62.15 / 56.37-61.15 | Check the list. Escort them. Badge in. Lock your screen. | 10 | 2.09 | voiced |
| v11 | ca12 / ca12b | 66.30-71.27 / 65.30-70.27 | Play the attack, learn to stop it, on Hacktivity.co.uk. | 9 | 1.81 | voiced |

Dropped from r2: v8a2 "Inside: client plans on open screens." (both cuts, for time), and v8a in ca12b (the tailgate has just been shown, and Jo and the flip line name it).

Truth checks:
- v1b: Camila is on the gate's `openFor` and Yusuf's window has closed by the step-away, so nobody checks her. Still true.
- v4b: matches the brief's "booked test, signed off by the partners" and the letter in the bag.
- v6b: matches Jo's toast and the E5 lines ("the desk is the first layer").
- v5b: the tailgate route runs only on the `walked_away` outcome.

## 4. Character lines

All are in the scenario or kit JSON or in the ink. "Cached" means a sidecar in `tts_cache/ca12_visitor_tailgater/` with this exact text, checked 26 Nov.

| Beat | Speaker | Line | Source (knot or mapping) | Cached |
|---|---|---|---|---|
| hook | Camila Ospina | Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up. | kit eventMapping bark on `kit_ca12_visitor_there` (then `targetKnot ca12_door`, `_office_kit/ink/camila_ospina_ca12`) | yes |
| lands | Delphine Arvanitis | Go on then, I'll buzz you through. (The take is trimmed before "Studio's up the stairs on your left.") | `delphine_reception.ink`, knot `ask_reaction` (:107) | yes |
| door | Delphine | I'll get the door for you. | Delphine eventMapping 1 (got_it), bark | yes (25 Nov) |
| door | Yusuf Demir | Morning. Mind the step. | Yusuf mapping 7, pass bark (got_it) | yes |
| door | Jo (shown toast, not voiced) | The desk is the first layer. The door is the second. Watch how long it stays open, and for whom. | Lorna mapping 9 `actions` hint (E4, not written yet) | n/a, shown text |
| reader (b) | Yusuf | Sorry, can I help you there? Deliveries go via the desk. | Yusuf mapping 1, sight bark | yes |
| tailgate (b) | Jun Watanabe | Morning, Yusuf. | Jun reader bark (plan 1.7; not in the shell yet) | **no: new TTS (Puck)** |
| tailgate (b) | Yusuf | Delivery? Studio's straight through. | Yusuf mapping 7, pass bark (not got_it) | yes |
| tailgate (b) | Jo Fairweather (offscreen, earpiece) | Nobody checked. A uniform and a held door beat both. | `ca12_jo` eventMapping on `ca12_tailgated`, barkDelay 1800 | yes (Leda, 25 Nov); live playback as a voiced toast is not yet proven |
| lorna_noblame | Lorna Easton | Nobody's in trouble for slowing a pushy visitor down. | `lorna_easton.ink`, `hub`, defend-complete branch (:49) | yes |

Not used, with reasons:
- Lorna L1 "You talked your way through that door just now..." (cached) is cut for time. On the tailgate run her ink falls to "She held that door on you just now...", which reads wrongly after a tailgate. That is a scenario follow-up: give her ink a tailgate or desk-pass variant keyed on `ca12_tailgated` / `ca12_desk_pass`.
- Lorna's "Camila's one of Jo's, by the way." (cached) is a good link line for a later cut. It does not fit at 70 s.

## 5. Shot list

Zoom rules (integer output scale):
- 16:9 and 1:1 use 1, 2 or 3.
- 9:16 uses 0.5625, 1.125 or 1.6875.
- NPC chats (portrait view) take the lower integer: 16:9 1, 9:16 1.125, 1:1 1.
- Map shots take 16:9 2, 9:16 1.125, 1:1 2.
- No pushins.

Dependencies use these codes:
- **now**: exists today;
- **E1**: side-door gate, still uncommitted in this tree;
- **E4**: engine 76956ae9d, plus shell mappings not yet written;
- **SF**: a scenario follow-up;
- **CW**: the Camila walk-in conversion.

| Beat | Take (new or existing) | Entry state | Zoom 16:9 / 9:16 / 1:1 | Depends on |
|---|---|---|---|---|
| hook | new `t16_camila_walkin`, the arrival end. Fallback: existing t09_step_away 46.7-51.6 | kit_defend_done, step-away forced (as t09), BE_SPRITE avatar | 2 / 1.125 / 2 | CW (kit: mapping 1 `setVisible` to `walkIn` from a lobby edge tile, mapping 2 made inert, exits to `walkOut`); E1 (gate `openFor` Camila, and the gate must win over the walk-in's locked-door fade, asked of VID1). Fallback footage: now |
| topic | same new take, follow-cam on Camila (`camlib followNpc`) from the lobby edge through the gate | as hook | 2 / 1.125 / 2 | CW, E1; Yusuf on patrol in shot needs E4 `resume_patrol` (else he stands at his post, also fine); SF lobby dressing pass (reader, Yusuf post) |
| red_card | card | none | n/a | now |
| research | t04_osint_note 4.9-7.9 | existing | 1 / 0.5625 / 1 (r2 used 1.25; reframe) | now |
| build | t05_pretext_card 5.3-8.3 | existing | 2 / 1.125 / 2 if the card fits, else 1 + inset | now |
| kit | new `t17_kit_bag`: open the hook, take both items, confirm Wear, the sprite changes, studio staff behind | studio, after brief and OSINT (`--set` state done brief, osint) | 2 / 1.125 / 2 | now in data (shell part 2); SF: the kit bag position (8.25, 0.875) is unmeasured, so do a dressing pass first |
| talk | t06_the_call 12.2-14.5 (24 Nov recapture) | existing | 1 / 1.125 / 1, INFLUENCE inset | now (call lines unchanged) |
| lands (ca12) | t06_the_call 16.6 to the pause after "through." (about 19.6, find by silencedetect) | existing | 1 / 1.125 / 1 | now. SF: "up the stairs on your left" no longer matches a ground-floor side door; worth a one-line ink fix and re-voice (needs a yes via AC0) |
| door (ca12) | new `t18_desk_pass`: got_it with the hi-vis worn; wide on the lobby side gate; Delphine's walk, the gate opening, the learner past Yusuf; hold for the 5 s grace | lobby world-play after a got_it call (seed the outcome, then drive) | 2 / 1.125 / 2 | E1 (gate block, side-door open animation, `activeIf`); E4 for Jo's toast (Lorna 9, else no toast in shot); SF dressing (Delphine's door tile, reader, Yusuf post) |
| reader (ca12b) | new `t19_reader_alone`: walked_away, hi-vis on, walk to the reader; Yusuf's bark; step back | lobby after a walked_away call | 2 / 1.125 / 2 | now in data (Yusuf mapping 1 fires while `ca12_gate_open` is false), live unproven; SF dressing; Yusuf's patrol from load: now |
| tailgate (ca12b) | new `t20_tailgate`: low wide on the gate; Jun's tap, the hold, the learner through; Yusuf's bark, then Jo's voiced toast; follow-cam on the learner | continues t19 (same run) | 2 / 1.125 / 2 | E1; E4 `start_patrol` plus SF Jun loop mappings (start on `ca12_runner_go`, stop on `ca12_world_done`, route `useObject` on the reader, the "Morning, Yusuf." bark); new TTS for Jun; Jo's toast audio proven live |
| flip | new `t21_flip_r3` (one per cut): the hand-back to the kiosk with the learner in their own clothes, then the flip panel with the E5 line | after each door take, or seeded `ca12_desk_pass` / `ca12_tailgated` true | 1 / 0.5625 / 1 (panel text) | E5 now; the hi-vis off at hand-back needs E4 `take_off` (Lorna 11 in place). Before that, frame the panel only |
| blue_card | card | none | n/a | now |
| tailgater (ca12) | t12_tailgater_card 5.9-9.9 | existing | 1 / 0.5625 / 1, inset for the card text if needed | now |
| queue | t11_defend_queue 5.08-15.48 | existing | 1 / 0.5625 / 1 (r2 used 1.6; re-check readability, inset if needed) | now (defend set unchanged) |
| lorna_noblame | t14_lorna_noblame 16.32-20.22 (24 Nov recapture) | existing | 1 / 1.125 / 1 | now |
| close | ca-close | none | n/a | now |

Capture notes:
- New takes (t16-t21) wait for E1 and E4 on this branch, the Jun and Lorna shell mappings, CW and a lobby dressing pass.
- t17 (kit) and t19 (reader) can be shot now if the dressing pass comes first.
- Record ca12b's t19 and t20 as one run.

## 6. Music

Starts already in use:
- QC 16.636, 29.82, 57.378, 79.918, 95.742;
- GM 19.758, 37.442 (ca15 re-plan), 55.126, 75.35, 95.545;
- GD 28.151, 39.055, 66.314, 104.478;
- QR 24.014, 52.667, 72.891, 91.43;
- GDA 6.069, 35.541, 64.356, 102.341.

ca12 had no r2 window (silent bed), so nothing to avoid there.

- **Pick: PeaceFolk "Gently Decaying" from 85.397 s.**
  - Bar 31 downbeat: 0.891 + 31 x 2.726 (88.04 BPM).
  - The nearest used starts are 66.314 and 104.478, both 19.08 s away.
  - The window runs to about 157 s of the 187.2 s track, gain -5 dB, 2.5 s fade out.
- **Alternative: "Gently Decaying Again" from 82.693 s.**
  - Bar 31 downbeat: 1.485 + 31 x 2.6196.
  - It is 18.34 s from 64.356 and 19.65 s from 102.341.
- Guitar Motif has no legal window. Its starts are spaced 17.7-20.2 s apart, and the tail after 110.5 s is too short for 72 s.
- Neither window has been checked for gaps (the house check is no gap over 0.3 s below -45 dB) or played against the flip. Do both at edit time, and move the flip (42.8 / 45.8 s) onto the nearest strong hit.

## 7. Rubric (CA fun/USP, trailer-applicable items)

Scored on the script and planned footage; re-score on the render.

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 3 | Camila's in-world line opens (owner's r3 call); her walk past security puts the topic on screen by 15 s |
| F3 agency | 2 | ca12b shows a real choice (walk away and watch the door) and the flip line reflecting it; ca12 shows one route only |
| F4 living world | 3 | walk-in, Yusuf's patrol, Delphine leaving her desk, Jun's badge tap, five voices plus Jo in the earpiece; r2 had two moving NPCs |
| O1 attacker's steps shown | 3 | research, cover story, costume, call, door: five attacker steps on screen, each narrated in attacker terms ("dress the part", "watch the door") |
| O2 attacker reasoning | 3 | ca12b: Jo's "A uniform and a held door beat both." names the two weaknesses; ca12: v6b plus the flip line "One call got you past both layers." Neither blames the staff |
| O3 transfer | 2 | v10 names four concrete actions over the queue; v9 ties them to the attack half. The cue for each is not shown |
| O4 tone | 3 | Lorna's "Nobody's in trouble for slowing a pushy visitor down."; Yusuf polite; no fear lines |
| A1 accuracy | 2 | One mismatch: D1's "up the stairs" (trimmed out, still in the ink). Lorna's tailgate-run line avoided. The rest matches the shell |
| A2 safe takeaway | 3 | Pattern level: hi-vis plus a held door, at awareness level; the authorised-test frame (v4b, letter) is on screen; no technique beyond what any staff member sees |
| P1 practice or outcome | 2 | the defend queue (practice, no verdicts shown) and the flip line naming the outcome of the learner's own run |

F2, F5 and F6 are about play time and replay and are not scored on a trailer. On the 10 items above: ca12b 26/30, ca12 25/30 (F3 1 lower).

## 8. Open for AC0

1. Shape sign-off: the two new attack beats, Lorna L1 cut, ca12b leads.
2. New TTS:
   - three narrator lines (v4b, v6b, v5b; Sulafat_v2);
   - Jun's "Morning, Yusuf." (Puck);
   - optional: Delphine's D1 without "up the stairs" (ink edit plus re-voice).
3. Scenario follow-ups that block takes: CW; Jun loop and reader bark; Lorna 9 and 11 (E4 actions); the lobby dressing pass; Lorna's tailgate-run flip line (not blocking, since L1 is cut).
