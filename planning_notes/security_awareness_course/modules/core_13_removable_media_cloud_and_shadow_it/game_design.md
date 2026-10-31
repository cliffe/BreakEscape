> **For the build, this design is superseded by `../../implementation/episodes/E15_shadow_it.md`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_13 game design: Workaround

## Concept

The frame is the built one: a training room at Tarrowby Logistics (fictional), a kiosk, and the host Nilesh Solanki from the IT service desk. The scope note sets the week: *"Authorised exercise. It's Friday afternoon, a pack is due at a client by Monday, and the share has crawled to a halt. See where the shortcuts lead."*

This is a **consequence-flip** episode: the topic has no single attacker, so the learner is not asked to build a phish. Instead they do the ordinary thing under a deadline, in a safe sandbox. Colin Mather, the warehouse manager, is charming, in a hurry, and has a shortcut for everything: email it to your personal address, use a free transfer site, keep the rota in a free app, plug in the stick that arrived in the post. Every shortcut works today. Then the flip, a "six months later" montage, shows where each one led. The defend half turns the lesson into a drill: match each shortcut to its approved swap, and triage the found and posted sticks. The debrief is the built one, and the quick yes is always the easiest move in the game, because Nilesh had the approved version of each shortcut ready in minutes.

## Setting and cast

- **Room:** the Tarrowby training room (`room_aw_tarrowby` type), with the kiosk and the host spot. The desktop, the sharing panels, the swap board and the montage are overlays; no new room.
- **Host:** Nilesh Solanki, IT service desk analyst. *"Ask us first. We'd rather help than clean up."* He also carries the event mapping that completes the shell, and reveals the authorised USB-drop test in the debrief.
- **Colin Mather** (warehouse manager, from E2) offers the shortcuts. Likeable, not a villain; he comes round by the end.
- **Shauna Lofthouse** (depot, from E6) rings about the rota that lives in a free app.
- **The client contact** (a haulage customer) and the **departed agency temp** are phone-only or off-screen, proposed, consistent with `BRAND_SET.md`.

Larkspur and its cast (Owain Jenkins, Martin Fletcher, Jo Fairweather, Ama Owusu, Maureen Gallagher, Kev Sutcliffe, Ruth Hollis, Callum Reid) are retired or remapped onto the Tarrowby cast above. The ethical-tester reveal is now the company's own IT running an authorised test. The approved tools are Tarrowby's own (a file-sharing service, remote access, a company chat tool) with invented names; the intranet is generic.

## Structure

The sandbox is unscored; only the defend half is scored, under the `awareness` profile.

### Brief and scope note (1 minute)

Nilesh welcomes the learner and states the scope and the deadline. The work task bar shows the pack to finish and send, and the share's sync bar reads "about 2 hours remaining".

### The shortcuts (sandbox, 4 to 5 minutes)

Four interruptions arrive about a minute apart, inside the work. For each, the learner can take the shortcut or the approved route; nothing is scored yet.

| What arrives | What it tests | The approved route |
|---|---|---|
| Colin: "Share's dying. Email it to your personal address and finish at home." The compose window offers "Me (personal)" in autocomplete | Personal email | Ask Nilesh; work from home through remote access |
| The video is too big for email. Colin: "Use a free transfer site." | A free transfer site | Share it from the file-sharing service, to a named person, with an end date |
| A padded envelope: "From the client: survey results. Please add to the pack." Inside, a USB stick and a note with a phone number | Posted removable media | Don't plug it in. Ring the client on the number you already hold, not the note; give the stick to IT |
| Shauna rings: the delivery rota lives in a free app on a former temp's personal account ("anyone with the link can edit") | Shadow IT already in use | Add nothing there; ask IT to move it into the team space and remove the old access |

Taking a shortcut always "works" in the moment (the file sends, the upload gives a link). Asking Nilesh always works too, and fixes the slow share: *"A sync job had stuck. Nobody told us."*

### Flip: "Where are they now?" (1 to 2 minutes)

A documentary-style montage, *"Six months later"*, follows each shortcut. Every learner sees all four: the ones they took are marked "your choice", the ones they didn't are shown as "the version where it was taken instead".

- **The personal inbox,** broken into with a reused password, the pack in its sent items; the client gets a convincing fake invoice (core_11).
- **The free transfer site,** breached; old public links, including a video with people in the background, turn up in search results.
- **The posted stick,** which reached four other firms; one plugged it in and was down for nine days (core_07).
- **The rota,** still editable by the departed temp, then lost when the free app closed the unused account, the week before a busy delivery run.
- For each approved route taken: the calm version ("the secure link expired after seven days; there was nothing to find").

This montage is the consequence flip: it replaces the attack-then-flip beat and shows the learner where their own choices led.

### Defend: "Swap Shop" and the sticks (3 to 4 minutes)

Scored under the `awareness` profile, Report and Verify available, immediate feedback:

- **Swap Shop:** eight shortcut cards, each matched to the approved swap from three options (personal email to the work laptop and remote access; a free transfer site to a file-sharing link with an end date; a rota in a free app to the team space; and so on). One line of why on each.
- **Found-media cards:** a posted stick and a giveaway stick from a trade show, triaged as inbox-triage cards: the right move is Report (and Verify the sender on a known number), never plug in.

### Debrief (1 to 2 minutes)

The built debrief view:

1. A per-item reasoning card for each defend item.
2. Feedback on the genuine items (the real client's email, a legitimate tool request).
3. The **team protected** tally.
4. **The habit to keep:** *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."* (For this episode the debrief adds the plain line: *"If the official way is slow, tell IT. Don't build your own way round."*)
5. The **"On Monday"** card: the one approved swap for the shortcut the learner uses most.
6. The reporting route (`slot:customer_report_route`), which brings in the DPO when personal data went to a personal account.
7. The no-blame line.

Then Nilesh reveals the test: *"That stick in the post was ours. Authorised test. It just tells us it was plugged in."* Only the learner's own result is shown; nobody is named.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Personal email | Ask IT / stay late / send to personal | LO2, LO4 | The personal-inbox montage; or remote access and a fixed share |
| Free transfer site | File-sharing link to a named person with an end date / left open / the free site | LO3, LO4 | The breach montage; or "the link expired, nothing to find" |
| Posted stick | Verify the client on the number held and give it to IT / straight to IT / call the note's number / plug it in | LO1 | The client's "we didn't post anything"; the four-firms montage |
| Rota in the free app | Ask IT to move it and remove access / add the slots there / copy it to a personal account | LO3, LO5 | IT's quick move; or the vanished-rota montage |
| Telling IT about the slow share | Mentions it / never does | LO4 | The fixed sync job |
| Swap Shop and the sticks | the approved swap / a wrong swap; Report / Verify / plug in | LO1, LO2, LO3 | Per-item reasoning and the awareness score |

No option shames the player or Colin. The montage shows what the shortcuts cost without making anyone a fool, and Colin is the one who asks "why did nobody tell me it was this easy?"

## Minigames

| System | Status | Use here |
|---|---|---|
| Mail client (recipient check) | built | The compose window, with "Me (personal)" in autocomplete |
| Sharing settings (file-sharing service; free-app panel) | built in core_06's surface | The approved share, and the free app's "anyone with the link" panel |
| Inbox triage (`awareness` profile) | built | The posted-stick and giveaway-stick cards; Report and Verify |
| Consequence flip (montage) | built | "Where are they now?", driven by the learner's choices |
| Awareness-measure records | built | Per-item id, verdict, chips, score, stage and time |
| Swap drill | new | Match a shortcut to its approved swap |
| Sharing-settings surface variations | new (small) | The departed-owner, "anyone with the link" states |

## Explainers

- A short panel on the **four "no"s** of unapproved tools (no contract, no control, no backup, no off switch).
- A short panel on **found media** (don't plug it in; hand it to IT).

No video beyond the montage (a built device). No runtime language model.

## Debrief

The built episode debrief, as set out under "Structure" above: a reasoning card per item, feedback on the genuine items, the "team protected" tally, the habit to keep, the "On Monday" card, the customer's reporting route and the no-blame line.

## Variants

- **Defend-only variant** (`variant: "defendOnly"`, about 8 minutes): brief, defend (Swap Shop and the sticks), debrief. It keeps the same defend set, so the measurement is unchanged. What is lost is the consequence montage.
- **Pre and post checks:** general role forms (AB and BA). Removable-media and shadow-IT items (found stick, personal email, a free app rota) join the general check pool as mirror pairs; see `assessment.md`.
- **Facilitated session:** the `facilitated` flag; the team votes on each shortcut, with IT invited to answer "has IT heard?" live. Pause points after the sandbox, the montage and the rota.
- **Replay:** the four interruptions and the posted-stick label draw from a bank; the montage updates to the year's common failures.

## Alternative concepts

1. **Shadow Hunt.** A spot-the-risk walk round the depot: a personal drive under a desk, a router brought from home, a sticky note with a personal-share link, a team chat on a wall screen. Each find opens a short talk with its owner about the need behind it, matched to the approved swap. Curiosity, not blame; good for a facilitated session.
2. **Lost Property.** The learner covers the service desk over lunch: found items and "can we use this app?" requests arrive, each needing the right response and swap. Quick and replayable, but close to the role_03 service-desk shift, so it needs care to stay all-staff.
3. **The Leaver, backwards.** The episode starts on a leaver's last day and runs back through the personal shares and free accounts they set up, each a thread to close before it becomes a problem. Strong on "access that never ends", but overlaps role_05 and core_14, so best as a spotlight edition.

## Art and audio

- **Room:** the Tarrowby training room; no new room.
- **Props:** a USB stick with a printed label, a padded envelope with a stick and a note, a lost-and-found bowl, the swap board.
- **UI:** the compose window, the sharing panels, the sync bar, the documentary title cards (all built or small extensions).
- **Characters:** Nilesh (host), Colin and Shauna need the Tarrowby cast art (CSS wordmark and placeholder sprites until PixelLab art is approved). The client and the temp are phone-only or off-screen.
- **Voice:** text to speech. No voiced line prints a variable: the test figures, file names and the learner's own result appear on screen only.

## Pitfalls

- **Don't make IT the villain or a scold.** Nilesh is quick, kind and funny; asking him is always the easiest option, which is the point.
- **Don't shame anyone for a workaround.** Colin is likeable and right that the share was slow. The montage shows consequences, not idiots.
- **Keep the USB reveal kind.** Show only the learner's own result; never name colleagues; say why people plug sticks in.
- **No real brands.** The free tools and the approved tools are fictional, with `.example` domains; check every name before build.
- **Don't teach "delete it and it's gone".** The montage and the concepts say copies persist and IT should handle it.
- **Stay in lane.** AI tools are core_15, downloads core_08, device security core_09, deliberate data theft core_14. Each gets one line and a pointer.
- **The Verify-on-the-note branch isn't a trap.** The learner still didn't plug the stick in; the debrief explains why the number on the note proves nothing (core_02).
