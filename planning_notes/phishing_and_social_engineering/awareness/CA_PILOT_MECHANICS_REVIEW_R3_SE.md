# CA pilot mechanics: SE wording review, round 3

Scope: attacker-side social-engineering wording and beats for the ca12 tailgate and the ca15 USB drop, judged on accuracy (attacker reasoning and defender lesson), attack/defend consistency, authorised-test framing in both episodes, tone, TTS word caps, delivery vs stage directions, variables, UK English and em dashes. Sources: `CA_PILOT_MECHANICS_REVIEW_R2_SE.md` (R2 findings), and the plan delta `git diff 0ed4a2465 fad7e9947 -- CA_PILOT_MECHANICS_PLAN.md`, focusing on sections 1.1, 1.3, 1.7, 1.8, 2.1, 2.6, 2.7, 2.8 and 6. No plan edits made. Jo is now a voiced off-screen NPC (`ca12_jo`).

Verdict: no blockers, no majors. All four R2 minors are resolved. One soft new minor, a dialogue-pass note. The attacker voice, the attack/defend match and the authorised framing of both episodes are in good shape.

Severity counts: **BLOCKER 0, MAJOR 0, MINOR 1** (new, soft). R2 carry-over: 4 minors resolved.

---

## Part A: R2 findings, resolution

### R2-1 [MINOR] ca15 session note overclaimed the outcome; no sanction line — RESOLVED
Two changes land this. The session note (2.6) now reads "Session note: TL-OPS-04. She opened a file to find the owner, and our tracker reported home. A real stick would have run its payload right there." The foothold overclaim ("on their network") is gone: the sanctioned exercise fires its own beacon, and the real-world danger is named honestly as what a real stick would do, not what this one did. Parity with ca12's authorised framing is added in Nilesh's opener (2.7): "It's a safe tracker, booked in with IT. It only tells us who opened it." The mechanism still matches the defend twin's "The moment someone opens a file on that stick, it could run malware" (2.8). Accuracy items A1/A2 lift.

### R2-2 [MINOR] two Nilesh answer lines tagged identically — RESOLVED
The 2.7 table now labels them "answer line 1" and "answer line 2", with an explicit note: "The two answer lines play in sequence as one answer to the question, line 1 then line 2; they are not alternatives." The ink and voicing pass now know it is one two-line answer (motive, then the labelled-lure nod).

### R2-3 [MINOR] Yusuf's alerted opener read faintly accusatory — RESOLVED
"Delphine's let me know about you." becomes "Reception's asked me to have a word." (1.8). The personal edge is dropped; it reads as a routine instruction passed down, keeping the alerted meaning. "Have a word" is standard UK polite-but-firm for a guard and sits inside the `#delivery: polite, firm, unhurried` tag. Acceptable; no further change.

### R2-4 [MINOR] brief block would be one long voiced utterance — RESOLVED
1.8 now records: "if the brief is ever voiced, it is split into four utterances: the authorisation, the scope, the step-back rule and the letter." The per-utterance cap is respected if voicing ever happens.

### R1-5 carry-over [was escalated] — now RESOLVED
R2 left the hero-tailgate attacker voice open as owner question 9.2. Section 6 and 1.3 now settle it: Jo is voiced off screen (`ca12_jo`), her tailgate line is a TTS bark timed after Yusuf's pass bark (1.7, Jo mapping, `barkDelay: 1800`), and her two door cues stay shown toasts. The USP gap R1 named (attacker's side in the attacker's own voice at the set piece) is closed. Open question 9.2 is marked settled; section 9 is now empty. Rubric O2 lifts.

---

## Part B: new findings (R3)

### R3-1 [MINOR, soft] the "two layers" framing recurs across several lines; vary where it is not carrying the lesson. [writing / dialogue pass]
**Plan section:** 1.1 / 1.7 / 1.8 (door toast, Jo's bark, the flip lines).
**Problem.** The two-layer idea is the episode's lesson, and reinforcing it is deliberate, but the same "desk is one layer / door is the second" shape appears in four places: the door-open toast ("The desk is the first layer. The door is the second..."), Jo's voiced tailgate line ("The desk is one layer and the door is another..."), the `ca12_desk_pass` flip line ("...got you past both layers.") and the `ca12_challenged` flip line ("The desk is one layer; he was the second, and he held."). In a single run the learner meets it at most twice (one toast, then one of Jo's line or a flip line), so this is not a blocker. But the near-identical wording of the toast and Jo's bark, heard back to back on a tailgate, is close enough to read as a copy.
**Suggested handling.** No structural change. In the dialogue pass, let Jo's voiced line lean on the human move rather than restate the toast's count, e.g. keep "A uniform and a held door beat both." as the whole bark, or open it on the person ("Nobody checked. A uniform and a held door beat both."), so the spoken line adds the attacker's read instead of echoing the on-screen toast. The flip lines are fine as they are (only one shows per run).

---

## Part C: checks that pass clean

- **Word caps.** Every new voiced line is well under cap. Jo's bark "The desk is one layer and the door is another. A uniform and a held door beat both." is 18 words (under 30 face to face, and under 25 even if her earpiece voice is counted as phone). Nilesh's sanction line "It's a safe tracker, booked in with IT. It only tells us who opened it." is 15. Yusuf's "Reception's asked me to have a word." is 6. The session note, the flip lines and the door toasts are shown text, not voiced.
- **No variables in voiced lines.** None. "TL-OPS-04" sits only in the shown session note and is a literal, not a template.
- **Stage directions.** No inline stage directions in any spoken line. Tone lives in `#delivery:` tags (Yusuf's `challenge` knot, Nilesh's `red_stick` knot) and the bark delivery field (Jo "quiet and pleased, a tester talking in the learner's ear"; Joanne "cheerful and matter-of-fact").
- **Attack/defend consistency.** Jo's "A uniform and a held door beat both." mirrors the twin's `e12_call_courier_push` (`uniform_pretext`, `no_escort`). The tailgate credit requires the hi-vis worn and a non-`got_it` outcome (mapping 4 condition), so the "uniform" in Jo's line is always true when it fires. ca15's session note trigger (a file opened) matches the twin's malware-on-open rule. Every flip line names what actually happened in its branch.
- **Authorised framing, both episodes.** ca12 keeps the booked-test brief, scope, step-back rule and the readable `ca12_auth_letter`. ca15 now states the sanction in Nilesh's opener ("booked in with IT") and in the honest session note, closing R2's parity gap.
- **UK English.** "Reception", "booked in", "hi-vis", "café", "kiosk" throughout; no US spellings in new lines.
- **"Cyber Security".** The phrase does not appear; no "cybersecurity" slip.
- **Em dashes.** None in any spoken or shown line; the flip lines use semicolons and commas ("The desk is one layer; he was the second, and he held.").
- **Attacker voice / O2.** Strong and now voiced at the set piece: Jo's live tailgate line, "Kindness does the attacker's work.", "No label is deliberate...", "A real stick would have run its payload right there."

---

## Part D: CA fun/USP rubric, delta note (plan evidence only; not a playtest)

R2's two accuracy items (A1, A2) sat at 2 because of R2-1; with the session note corrected and the sanction named, both now read as 3 on plan evidence. O2 lifts to a clear 3 with Jo voiced at the hero shot (R1-5 resolved). No heuristic drops. Playtest-dependent items (F6, O3 recall, pace with the layered attacker commentary on a tailgate) remain to be scored in a playtest, not here.
