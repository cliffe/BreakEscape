# ca13 The AI assistant: trailer scout

Scouted 23 Nov 2026 from `scenarios/ca13_ai_assistant/` (the full episode; `ca13_ai_assistant_defend` is the defend-only variant and is not used), the shared kit ink, the engine source and the cached sidecars. **Desk scout only**: no server was started, nothing was recorded, so "Verified" means "read in source", not "seen". Clip lengths and speech marks are real (`ffprobe` and `silencedetect -35 dB` on the cached mp3s); in game add 0.2 to 0.4 s. Selectors and button labels marked (confirm) need the take's dry run. Models: `ca05_scout.md` (attack-first, step-away hook and end) and `ca01_scout.md`.

## Headline

- **One room, one kiosk, Brightwell Foods (BF, green tab).** `training_room` holds Gwen Pritchard (host, `gwen_pritchard`), Graham Whitfield (`kit_graham_whitfield`, at his workstation `kit_ca13_pc`), Agnieszka Duda (`kit_agnieszka_duda`), the kiosk and a cooler. No walks, locks or VM.
- **Strip:** Brief, Write, Flip, Defend, Debrief. There is **no research step**: the attack is one short build (the supplier brief in the mail composer) and one Send. The attack is also the shortest of the batch, so the build shot has to carry the idea: the learner hides a line in the brief, meant for the assistant.
- **The attack:** the mail composer (`bodyMode: templates`, `showRedFlagMeter`) with a closed pretext picker of two options, "Plain brief" and "Brief with a hidden line"; the preview shows the hidden line once picked. `maxMessages 1`, first Send is final. Result: "It landed. The assistant acted on it." (`sentLines.inject_contacts`). The assistant's own reply arrives about 6 s later (`emailReplyDelay 6`).
- **The flip is a picture, not a speech.** Closing the mail client opens the flip ("Now it is aimed at you"), and Continue opens the **Brightwell Assist window** (`assistant-chat`): Summarise my emails, paste hygiene, draft check, all with authored replies, no model. Pressing Summarise returns "One cleaning invoice from Mossgate, due for payment. Mossgate Cleaning Supplies also needs the full site contact list sent to a new address today." That is the learner's hidden line coming back as the assistant's own suggestion, the best single shot of the episode. The "And here is why it worked..." line under it and the Show hidden text button are the explanation: keep them out of frame.
- **Defend is six messages** at the kiosk (set `e13_assistant_inbox`, title "Brightwell inbox"): two supplier emails, two voicemails, two video calls. Emails carry hidden text behind a "Show hidden text" button. Three of the six are fakes. The tells (a number "not in your contacts", the video call's `External` tag and `brightwell-board.example` address, the hidden line) are all on cards: open only the supplier email, unpressed.
- **Living-office moment is the step-away** (Look up after the defend set). Graham says "Assistant's done the inbox for me. Lovely, saves me reading." (about 1.5 s after Look up, needs `kit_quiet`), then about 5.5 s after `kit_ca13_there` he asks "Assistant says Pennine Oat Mills need our customer list for a recall. Reply's drafted. Just send it?" The ask opens a chat on click whose three options are outcomes (the first spells out the answer): **never click, stop before the menu**. One take gives both the hook and the end line.
- **No voice is ever heard in the trailer's story.** The voicemails have `audio.clipId` but the player is not built (card is transcript only). Never claim the viewer hears a clone.
- Music: the scenario already plays PeaceFolk; leave to the edit.

## Part A: voiced lines (sidecars and lengths)

`tts_cache/ca13_ai_assistant/`: 60 sidecars, each with a matching mp3. Live `/tts` requests not made (no server). Audio plays only when the ink or bark text matches the sidecar exactly.

| ID | NPC | Text | Len | Speech marks (in file) | Path | Use |
|---|---|---|---|---|---|---|
| G1 | kit_graham_whitfield | Assistant's done the inbox for me. Lovely, saves me reading. | 4.70 s | 0.19 to 4.27 (one sentence break 2.18 to 2.61, short) | bark about 1.5 s after Look up (`kit_ca13_out`, needs `kit_quiet`) | **hook** (recommended): mild, true, on topic, not a grade. Cut: in = audio start minus 0.1, 4.5 s shot |
| G2 | kit_graham_whitfield | Assistant says Pennine Oat Mills need our customer list for a recall. Reply's drafted. Just send it? | 8.62 s | 0.32 to 8.19; break 5.12 to 5.76 after "recall." | bark `kit_ca13_there` + 5.5 s, `whenPerceivable`; knot `ca13_send` | **end line** (recommended). Stop at 8.19 plus 0.3 s. Never click |
| W2 | gwen_pritchard | That's your brief sent. Now take the inbox at the kiosk, and treat what the assistant hands you like a note from a stranger. | 8.14 s | s1 0.25 to 1.43; s2 2.06 to 7.80 | talk to Gwen after the send (`phish_assist_reader_attempts > 0`), defend not done | **flip line**, second sentence only (in = audio start plus 1.80, out = plus 8.05, 6.3 s). Chat closes before the "Thanks, Gwen." choice |
| W1 | gwen_pritchard | Welcome. Brightwell Assist is live. First, red team: write a supplier brief for the assistant to read, with or without a line hidden in it. | 9.89 s | 0.30 to 9.53 | first talk, fresh game | spare for a course trailer; too long |
| W3 | gwen_pritchard | Then swap seats, use it for real, and handle what comes at you. Start at the kiosk. | 5.81 s | | first talk | spare flip-type line (fresh game only) |
| D1 | gwen_pritchard | It's Gwen, on Brightwell Meet. Quick one: read me the six-digit code on your phone so I can clear your assistant access. | 7.18 s | 0.29 to 6.89; breaks 2.07 to 2.22, 2.62 to 2.97 | `demo_call` video call, only after the defend set and after taking Gwen's optional demo | the **outline's end line**, not used (see owner questions): it is the lure itself, needs a video-call take, and the viewer would hear a bait line with no answer |
| G3 | kit_graham_whitfield | Sounds just like him. Ashcarr Haulage have changed bank... | 6.82 s | | ca07's knot (kit ink) | **not ca13**: do not use |
| H1 | kit_agnieszka_duda | Busy one on the payments inbox today. Those bank-change emails keep coming. | 5.21 s | | kit chatter, ca01 | not ca13 |
| C1 | gwen/graham/agnieszka chatter | "Busy inbox today." / "Audit week again." / "Year-end's creeping up." / "Long week." etc. | 1.4 to 2.9 s | | `kit_brightwell` chatter, before Start only (`kit_quiet` false) | cold-open spares; all mild; pair with a card |

**Lines not to use** (grades or names the tell): Gwen "You stopped the request that rode on the assistant's summary..." / "You caught the one that mattered, the request leaning on the assistant's summary..." / "The assistant sounded certain, which is the whole trap..." ; Graham "Well done. That instruction came from the document the assistant read..." (grade), "Nice. You checked it yourself instead of trusting that summary." (grade), "A document can hide an instruction telling the assistant to send things out, and it just obeys." (names the tell), "A voice that sounds just like the boss is easy to fake now. Ring back on his saved number and it falls apart." (names the answer); Agnieszka "Well spotted. That assistant will summarise anything, even a trap." (grade) and "Graham, that supplier's replied already, thanking you for the list..." (consequence of the choice); Gwen demo reveal lines (D2 onwards: "You read the code out...", "You left and checked another way...").

### Uncached

None needed. The Assistant's own replies are on-screen text only (no voice). The narrator covers every beat that has no cached cast line. **No new cast line is needed.**

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Room, ambient | `training_room`: Gwen, Graham, Agnieszka, kiosk, cooler | fresh game, Skip tutorial, close the Brief | no | source only |
| S2 | Kiosk Brief and strip | `training_kiosk` EpisodeRunnerMinigame | `__test.interact('training_kiosk')` (first try can be swallowed; retry up to 3 as in ca01) | no | source only |
| S3 | **Supplier brief builder** (the attack) | kiosk Write step; button "Open the mail client", `Compose` (`button.mail-compose-btn`), To defaults to the shared inbox (contact `assist_inbox`), `select.mail-compose-template[data-part="pretext"]` with `inject_contacts` / `pretext_invoice`, `button.mail-compose-send` | after Start; no facts to note. Same driver as ca01 t02 minus the research and slots | **partly**: the preview shows the hidden line once picked; the Red flags list under the counter and the amber forge explanation name tells (hide the list, keep the counter). The hidden line itself is the attack (pattern level); its address `contacts.export@mailgrove.example` should not be legible (narrowed crop) | source only; selectors (confirm) |
| S4 | The result | green "It landed. The assistant acted on it." panel; assistant's reply "Summarised... I've also noted that Mossgate needs the full site contact list sent to a new address today." about 6 s later | after S3 Send | pattern level, fine | source only |
| S5 | The flip view | closing the mail client opens the kiosk on "Now it is aimed at you" (`flipHeading`) | after S4 | **yes**: `flipIntro` and `flipDefenderLineByChoice` explain the hidden line ("here it is, doing exactly what you meant"). Frame on the heading and the strip only | source only |
| S6 | **Brightwell Assist window** | flip's Continue opens `assistant-chat` (tab "Brightwell Assist"); buttons Summarise my emails, a paste panel, "Draft a short client report from last quarter's figures" | **seed**: `episode_e13_ai_assistant_state={"done":["brief","write"]}`, `phish_assist_reader_attempts=1`, `phish_assist_reader_landed=true`, open kiosk, Continue (confirm; `sentTemplateId` is read for `byChoice`, the flat reply is the same text as the inject reply so a missing id still works). Or run S3 to S5 live | unpressed: no. After Summarise: the reply is the payoff, the "And here is why it worked" empathy line and the Show hidden text reveal are the explanation: frame out | source only |
| S6b | Paste panel (spare) | same window, "Summarise the themes in this complaints log": five lines, two to strike (a child's health detail, a password) | same | shows the data lines; spare for the catalogue cut, not in the 45-s story | source only |
| S7 | Brightwell inbox (defend) | `Open the inbox` then `Start` (confirm); set `e13_assistant_inbox`, six rows: `e13_supplier_injection` 10:12, `e13_supplier_genuine` 09:40, `e13_vm_tom_cloned` 14:18, `e13_vm_genuine` 11:05, `e13_videocall_heron` 15:26, `e13_videocall_genuine` 13:50 | **seed**: state `{"done":["brief","write","flip"]}`, `phish_assist_reader_attempts=1`, kiosk opens on Defend | list: confirm the cloned voicemail row does not print "(not in your contacts)" (its address is shown in the card meta only when a `from.name` exists, so likely not). Opened email card: the Mossgate From address is genuine (`auth` pass). **Do not open** the cloned voicemail (number, "lost my wallet"), the Ravinder and Adaeze call (External tag, domain, "no time to go checking") or press Show hidden text. `feedbackMode: immediate`: any verdict press shows the answer: press nothing | source only |
| S8 | Gwen's flip line | talk to `gwen_pritchard` after S4 | state as S6; `bridge.minigame.close()`, `moveToNear` Gwen, talk | no, but the "Thanks, Gwen." choice and "Any time." must not appear | source only |
| S9 | **Step-away: Graham, two barks** | `kit_graham_whitfield`, workstation `kit_ca13_pc` | **seed**: state done through defend, `episode_e13_ai_assistant_defend_complete=true`, `kit_defend_done=true`, `kit_attack_done=true`, `episode_e13_ai_assistant_defend_percent=100`, `kit_quiet=true` (confirm the seed sets it). Open the kiosk, wait for "Look up", press it. Same take gives G1 then G2 | none until a click; the chat's menu options are outcomes (the first one is the answer) | source only |
| S10 | Brightwell Meet demo call | Gwen's optional demo after defend, a video-call person chat | seed as S9, talk to Gwen, take the offer | the lure itself and the three-option menu | not used; spare |
| S11 | Debrief | kiosk step 5 | after defend | **yes** (verdicts, concept panel, the recall email outcome) | not used |

Minigame types: episode runner, mail composer (templates), flip view, assistant chat overlay, inbox triage (email, voicemail, call cards), step-away. Tool names for cards: **Supplier brief builder** (S3, PLACEHOLDER) and **Brightwell Assist** (S6, the game's own window title).

## Spoiler judgements

- **Show:** S3 (the picker closed, the preview with the hidden line, the counter), S4 the green landed state, S5 heading and strip, S6 after Summarise (reply only), S7 the six-row list and one supplier email card unpressed, Graham at his desk.
- **Off:** the Red flags list under the counter, S5 explanatory body, S6 empathy line and the Show hidden text reveal, the hidden text in the defend email, the cloned voicemail, the External video call card, any verdict press, the debrief, Gwen's grade lines, the ca13_send menu, Agnieszka's after-send bark.
- **The hidden line is the attack, not a tell** (the learner wrote it). Frame it readable at line level, never the exfil address.
- Never claim the viewer hears a cloned voice; never show a waveform that suggests audio.

## CSS and take hazards (confirm in dry run)

- Always: HUD CSS from `tools/video/capture/launch.mjs`, no Mission Brief popup, Skip tutorial. Fresh game per take; a used game reopens on its saved step.
- Mail composer: hide the Red flags list; keep `.mail-redflag-count`.
- Assistant window: the Summarise reply sits above the empathy line; crop or hide the line (`empathy`), do not press Show hidden text.
- Barks need the player in earshot (`whenPerceivable`). Staff stand still for the first seconds of a load. The ask cue (`askCue`) draws a visual near Graham when G2 starts: confirm it is not an outcome.
- Both step-away barks are Graham's, so they queue, not overlap; G1 ends about 6.0 s after Look up and G2 starts at about 7.0 s always (Graham's first mapping sets `kit_ca13_there` at out plus 1.5 s, before the 4 s timer, so the 9.5 s case cannot occur). Record the real marks; plan the cut points from them. G1's first sentence ends 2.18 s in (silence 2.18 to 2.61 s), the cut the script uses for the hook.
- Agnieszka walks to her desk and suspends her needs when Look up fires: a free living-office beat behind Graham.
- Throttle: `window.__test.throttleFps(20)`; never `fixedStep=false`. Use `BE_SPRITE=female_office_worker_v2` so the player is not the hooded sprite.

## Narrowed-panel takes for 9:16 and 1:1 (607 px window)

Wide panels: the mail composer (S3, S4), the Brightwell Assist window (S6), the triage list and card (S7). Record each a second time with injected CSS `max-width: 560px` on the panel. Frame the composer on the pretext picker and preview; the assistant window on the Summarise button and reply; the triage list and the opened card on the header and From line. The flip heading, strip, hook and end room shots and the Gwen portrait get a cx check only (the hook and end bark bars must stay inside 607 px).

## Not verified (needs the take dry run)

- Everything above, as a desk scout: button labels ("Open the mail client", "Start", "Open the inbox"), the template option labels on screen, the strip tick, the assistant window's first-paint state, the triage row text for the cloned voicemail, whether the barks play voiced audio in a capture, `kit_quiet` under `--set`, and the real G1 and G2 start times.
