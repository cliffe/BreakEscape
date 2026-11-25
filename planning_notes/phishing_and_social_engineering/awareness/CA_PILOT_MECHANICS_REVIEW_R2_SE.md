# CA pilot mechanics: SE wording review, round 2

Scope: the attacker-side social-engineering wording and beats for the ca12 tailgate and the ca15 USB drop, judged on accuracy, attacker voice, matching defender lessons, authorised-test framing and scope, TTS-ready writing and safety. Source: `CA_PILOT_MECHANICS_PLAN.md` sections 0, 1.1, 1.8, 1.9, 2.1, 2.6, 2.7, 2.8, 9; R1 findings from `CA_PILOT_MECHANICS_REVIEW_R1_SE.md`. No plan edits made.

Verdict: no blockers, no new majors. R1's single major (authorised framing) is resolved and five of its six minors are resolved; one is escalated to the owner rather than adopted. Four new minors, all cleanup. The attacker voice and the attack/defend match are in good shape.

Severity counts: **BLOCKER 0, MAJOR 0, MINOR 4** (new). R1 carry-over: 1 major resolved, 5 minors resolved, 1 minor partly (escalated).

---

## Part A: R1 findings, resolution

### R1-1 [MAJOR] ca12 physical test never framed as authorised — RESOLVED
Plan 1.1 step 1 now opens the brief with "a booked test, signed off by Julian Sallow", names the scope ("the front desk and the studio door"), tells the learner to step back when challenged ("That's a result too"), and places the authorisation letter in Jo's bag with "the whole point is never to need it". The letter is a readable item (`ca12_auth_letter`, 1.1 step 2). Scope, RoE and the get-out letter are all present. Retreat-as-tradecraft is legible.

### R1-2 [MINOR] guard waving a courier through has no mirrored defender lesson — RESOLVED
Plan 1.9 confirms the twin's `e12_call_courier_push` (defend `:376-431`) handles the courier-at-the-door case, flagged `uniform_pretext` and `no_escort` with "real couriers leave the parcel at the desk". That mirrors both Yusuf waving a courier on and the learner's hi-vis. No attack-side change needed.

### R1-3 [MINOR] "Opened when the stick went in" ambiguity vs the twin — RESOLVED
Plan 2.6 session note now reads the stick was opened to find the owner ("She opened a file to find the owner, and that was all it took"), and the plan explicitly ties it to the twin's "The moment someone opens a file on that stick, it could run malware" (2.6, 2.8). Attack and defend now name the same trigger (file opened), not insertion. See new finding R2-1 on the "on their network" clause.

### R1-4 [MINOR] unlabelled stick leans only on return-to-owner helpfulness — RESOLVED
Plan 2.7 adds Nilesh's "No label is deliberate. A labelled stick gets opened out of nosiness; a blank one, out of kindness." The attacker reasoning for the blank-stick choice is now explicit and nods to the curiosity-lure alternative. Accurate.

### R1-5 [MINOR] attacker voice at the hero tailgate is shown-text only — PARTLY (escalated, not adopted)
No voiced Jo line was added to the 1.8 table; the hero-shot red-team commentary stays shown text (Jo's toasts, `flipTailgate`). Instead the plan raises it as open question 9.2 ("A voice for Jo") for the owner to decide whether Jo gets a voice entry. That is reasonable handling for a decision with a cost (new voice), but the USP gap R1 named (attacker's side in the attacker's own voice at the set piece) is still open until the owner answers. Flagging so the R2 totals do not read it as closed.

### R1-6 [MINOR] Nilesh's defender characterisation vs running the drop — RESOLVED
Plan 2.6 ink tags the `red_stick` knot `#delivery: stepping into the red-team host role, conspiratorial but light`, and the opener "Before we flip, one from the red-team kit" (2.7) marks the role switch. The host-voice/attacker-voice blur R1 flagged is handled in delivery.

### R1-7 [MINOR] delivery tags for the helpful and firm lines — RESOLVED
Yusuf's alerted close is softened in 1.8 to "I'll have to ask you to wait outside, then." (R1's proposed wording). Joanne's use line carries "Delivery cheerful and matter-of-fact" (2.6 mapping 2), with a `[check during implementation]` on how a JSON bark carries delivery. Intent captured on both; the breezy-not-sinister read the lesson needs is recorded.

---

## Part B: new findings (R2)

### R2-1 [MINOR] ca15: session note overclaims the outcome for a sanctioned internal exercise. [accuracy / A2 safe takeaway / authorised scope]
**Plan section:** 2.6 (`ca15_session_note`), with 2.1 steps 2-4.
**Problem.** The drop is Nilesh's red-team kit exercise dropped inside Tarrowby, and Joanne, a real colleague, plugs it into her live workstation. The session note reads "One kind click, and you're on their network." For an authorised internal awareness drop the realistic and safe outcome is a tracking beacon or callback that proves the stick was opened, not an actual network foothold on a colleague's production machine. As written the diegetic exercise appears to deploy a working payload against a live internal host, which sits awkwardly with the course's own safe-takeaway line and with ca12's careful authorised-test framing. ca15 also never states the exercise is sanctioned the way ca12's brief does.
**Suggested rewording.** Keep the vivid attacker read but make it the exercise beacon firing, e.g. "Session note: TL-OPS-04. She opened a file to find the owner, and that was all it took. One kind click and the beacon's home, that's how far a real stick would get." And add a half-line to Nilesh's `red_stick` opener naming the sanction, e.g. "This one's a safe tracker, booked in, it just tells us who opened it." Parity with ca12 plus an honest payload.

### R2-2 [MINOR] ca15 2.7: the two "after the question" Nilesh lines are tagged identically. [consistency / writing]
**Plan section:** 2.7 (lines 343-344), with 2.6 ink ("one choice with two options").
**Problem.** Two Nilesh lines are both labelled "`red_stick`, after the question" with no indication whether they are one two-line answer played in sequence or two alternatives for the ink/voicing pass to choose between. The dialogue pass and TTS need to know which.
**Suggested rewording.** No line change; mark them in the table as a single two-line answer (first the motive, then the labelled-lure nod), or split the "after the question" tag into "answer line 1 / answer line 2" so the ink and the voicing read them as one beat.

### R2-3 [MINOR] ca12: Yusuf's alerted opener reads faintly accusatory for a professional guard. [tone]
**Plan section:** 1.8 (Yusuf `challenge`, alerted).
**Problem.** "Delphine's let me know about you." carries a slightly ominous, personal ring for a building security officer whose default delivery is "polite, firm, unhurried" (1.8). It edges toward the "victim/guard as antagonist" tone the rubric's O4 red flags warn against.
**Suggested rewording.** "The desk has flagged you to me." or "Delphine's asked me to check you in." Keeps the alerted meaning, drops the personal edge. Low priority; the softened close already helps.

### R2-4 [MINOR] ca12: the brief block (1.1 step 1) is one long multi-sentence utterance if voiced. [writing / TTS]
**Plan section:** 1.1 step 1 (and 1.8 "Shown text, not voiced").
**Problem.** The brief is shown text, "written to be voiceable if the brief is voiced". As a single utterance it runs roughly six sentences and ~45 words; no single sentence breaks 30 words, but voiced as one bark it would read as a wall. The 30-word face-to-face rule is per utterance, so this only matters if it is ever voiced.
**Suggested rewording.** No wording change; if voiced, split it into separate utterances/beats (authorisation, scope, retreat rule, the letter) rather than one line, and note that in the dialogue pass.

---

## Part C: checks that pass clean

- **Line length.** Every voiced line in 1.8 and 2.7 is well under 30 words (face to face); chatter-pool lines are under 40 characters ("Is the Shipley run late again?" 30, "Queue at the café was mad." 26).
- **Stage directions.** No inline stage directions in any spoken line; tone is in `#delivery:` tags (1.8 `challenge` knot, 2.6 `red_stick` knot) and the bark delivery field.
- **No printed variables.** No `{variables}` in any voiced line; "TL-OPS-04" sits in shown text only (the session note), not a voiced line, and is a literal, not a template.
- **UK English.** "hi-vis", "café", "kiosk", "nicked", "post" throughout; no US spellings.
- **"Cyber Security".** The phrase does not appear in the plan body; no "cybersecurity" one-word slip.
- **Plain writing.** The spoken lines are clean of AI tells, inflated framing and negative parallelism; no em dashes in the plan.
- **Attacker voice / O2.** Strong: "No label is deliberate…", "Kindness does the attacker's work.", "Nobody was careless there. She was being kind…", the two-layer door toasts.

---

## Part D: CA fun/USP rubric, brief scoring (plan evidence only; not a playtest)

Scored against the spoken lines and beats as drafted. Playtest-dependent items (F6, recall on the twins) are marked not observed, not scored high.

| # | Heuristic | Score | Evidence |
|---|---|---|---|
| F1 | Early hook | 2 | Kit bag + "Look up, Nilesh has something for you; your place is saved" open on intrigue (1.1 step 2, 2.1 step 2). |
| F2 | Challenge to a first-timer | 2 | Bounded timers, no wait past 90 s, nudges at 60 s, Carry on always offered (ground rules, 2.1 step 5). |
| F3 | Agency / meaningful choice | 2 | Drop location changes the outcome (near where people stop); hi-vis optional with a door consequence (2.1 step 3, 1.1 step 2). |
| F4 | Living world | 2 | Needs-driven Joanne/Niamh at the kettle, Jun's loop, chatter pools (2.3, 1.8). |
| F5 | Pace and length | 2 | Short beats, timeouts and backstops keep both episodes moving (2.1 step 5). |
| F6 | Replay / tell someone | — | Not observable from the plan; needs a playtest. |
| O1 | Attacker goal shown, not stated | 3 | The learner performs the tailgate and the drop; not narrated (1.1, 2.1). |
| O2 | Attacker reasoning visible | 3 | Blank-stick rationale, "Kindness does the attacker's work", two-layer toasts (2.7, 1.1). |
| O3 | Turning the view into defence | 2 | Twins mirror the moves (courier-push, opens-file-malware), 1.9, 2.8; strongest when the learner spots cues, to confirm in playtest. |
| O4 | Tone empowering, not blaming | 3 | "Nobody was careless there. She was being kind…" places the gap in process, not the person (2.1 step 6). See R2-3 for one guard line to soften. |
| A1 | Technically / procedurally correct | 2 | Mechanism now realistic (file opened, not autorun); R2-1 on the foothold overclaim. |
| A2 | Safe takeaway | 2 | Twin teaches unplug and hand to IT; R2-1 slightly undercuts it. |
| P1 | Put it into practice / see it play out | 3 | ca15's found-stick step-away lets the learner act on the habit with an outcome; ca12 learner performs the pass (2.1 step 7). |

No heuristic at 0. The two accuracy items sit at 2 only because of R2-1; resolving it lifts both.
