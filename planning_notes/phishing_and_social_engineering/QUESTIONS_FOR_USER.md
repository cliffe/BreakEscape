# Questions for the user — phishing & social engineering plan

You said you'd be unavailable, so nothing here blocks the work: each item has a **working default**
already taken, marked ✅. Change any you disagree with and I'll adjust. Tick / strike-through / write
in the form at the bottom.

Items are added here by the orchestrator and by review subagents as the designs develop. This file
is the single place to answer; I'll fold your answers into `REVIEW_LOG.md` and the designs.

---

## Answered by the 2026-10-20 decisions

See `../eldritch_hacker/DIRECTION.md` and `README.md` ("Status and priorities (2026-10-20)").

- **Q1** answered: the student lab (`lab_social_engineering`) is the first shippable SE product. Default confirmed.
- **Q4** answered: the awareness product stays on a neutral corporate skin, and now sits under the separate "Incident Simulations: Critical Cases" line, not SAFETYNET. The clause reserving SAFETYNET framing for the m01-m08 fold-in is out of date: the SAFETYNET use of these systems is now Eldritch Hacker.
- **Q12-A, Q12-B, Q12-C** answered by supersession: no fold-in into m01-m08 (m01 "Soft Entry" shelved, doc 12 marked superseded). No new HaX lines to voice for it.
- **Q6** unchanged (patching the live SecGen lab remains a separate optional task).
- Student lab has no VM companion; the SE VM plan is parked (see the "Student lab" and "VM" items in `../PHISHING_AND_SE_DECISIONS.md`, A2/A3/I1-I5).
- New open item raised: Eldritch Hacker's narrative is provisional pending a universe-bible pass (tracked in `../eldritch_hacker/DIRECTION.md`, "Open").

---

## Decisions with a default taken (review-and-adjust)

### Q1. Primary build target first — ANSWERED 2026-10-20 (student lab)
Which audience should the first playable slice serve?
- **✅ Default: the student lab (`lab_social_engineering`).** It exercises every system end to end and
  has the clearest success criteria, so it's the best proving ground. Awareness episodes and the
  campaign fold-in reuse what it shrinks down.
- Alt A: awareness episodes first (fastest route to the commercial product).
- Alt B: the m01 spear-phish fold-in first (smallest, proves reuse in a real mission).

### Q2. Free-text email body vs structured composer
How does the player write the phishing email body?
- **✅ Default: guided free-text scored by the rules engine**, with the red-flag checklist shown as
  feedback. Teaches most; matching uses whole-word + synonym lists to resist keyword-gaming.
- Alt: fully structured (pick greeting / pretext / ask from menus) — easier to judge, teaches less.
- Optional later: an LLM judges tone/plausibility as *advice only*, never pass/fail (cost + variance).

### Q3. Real-staff OSINT upsell (awareness product)
The "see what attackers can find about your own staff" feature.
- **✅ Default: out of scope / fictional targets only.** Profiling real employees raises GDPR and
  consent problems. If ever offered, admin-curated opt-in, walled off from the game.

### Q4. Awareness-product framing/skin — ANSWERED 2026-10-20 (neutral corporate skin; see note at top)
- **✅ Default: ship the awareness episodes on a neutral corporate skin** (fictional company), with
  the SAFETYNET spy framing reserved for the m01–m08 fold-in. Keeps the product saleable and the
  campaign in-world.

### Q5. Commercial integrations (awareness service)
SCORM/xAPI/LTI export, SSO, admin dashboard, pre/post measurement.
- **✅ Default: plan for them but stage them after the core minigames work.** Build pre/post
  spot-the-phish measurement in from the start (the evidence-of-effect point); defer LMS/SSO to a
  productisation phase. Noted in `11_awareness_product_episodes.md`.

### Q6. Patch the existing SecGen lab in parallel?
The current `3_phishing.xml` lab is live and flaky (lost replies, vague rejections, reboot-fragile
bot, dead-end victims).
- **✅ Default: note it as a separate, optional task, not part of this plan.** This plan replaces its
  teaching value in-game. If you want the VM lab patched too, say so and I'll scope it (routed to
  Haiku per the SecGen rule).

### Q12-A. SUPERSEDED 2026-10-20 (no fold-in into m01-m08). Which SAFETYNET mission hosts the first phishing/pretext fold-in? (from `12_safetynet_integration.md`)
- **✅ Default: m01 "Soft Entry"**, a light, optional, additive aim: OSINT then one spear-phish at
  Derek Lawson from the IT-contractor cover, gating a second route to his computer plus extra optional
  evidence. Text-UI only, no existing voiced line edited.
- Alternates: **m06** (strongest pretext fit; uncached) or **m05** (spear-phish/Recruiter trace; uncached).
  Heavy additions (voiced pretext call, long OSINT chain) go to m06 or m05, not m01.

### Q12-B. SUPERSEDED 2026-10-20 (m01 stays frozen). Is any change to m01 acceptable, given its cached audio?
m01 has 1948 cached TTS files and `AGENTS.md:145` freezes its ids and names.
- **✅ Default: additive only** (new aim, new object, new ink file with new knots only; no edit or
  rename of existing lines, knots, ids, globals). If you would rather not touch m01 at all, the same
  stage moves to m05 (8 cached files, effectively uncached).

### Q12-C. SUPERSEDED 2026-10-20 (no fold-in, nothing to voice). Voice the new HaX lines for the fold-in?
About 6-10 new lines (offer, ethics beat, fail x2, success, debrief). Costs Gemini TTS.
- **✅ Default: not now.** They ship unvoiced; I list the lines and ask once the words are signed off.

---

## Open questions raised during review

### Awareness product (from `designs/11_awareness_product_episodes.md`)
Working defaults taken; none block.
- **A1.** Ship the deepfaked-voice CEO episode (E7)? Default: yes, optional, framed as "verify, don't trust the ear", no technique detail.
- **A2.** First-slice episode order? Default: E1 finance first, then E5 login page and E3 vishing.
- **A3.** Small consented pilot of pre/post measurement before any effectiveness claims? Default: yes, no claims until it reports.
- **A4.** Minimum group size for aggregates shown to customers? Default: 10 (to verify with privacy advice).
- **A5.** Commercial packaging (hosted vs licensed) and whether PixelLab assets are cleared for commercial redistribution? Default: assume hosted; check PixelLab terms (to verify).
- **A6.** Offer a defend-only variant of each episode for customers who dislike the "write a phish" beat? Default: yes.

(Reviewers append here.)

### Q7. Where does the pre/post triage score live? (from `05`)
- **✅ Default:** in `gameState.globalVariables` for the lab and missions; a server-side record per
  game only when the awareness product is productised (Q5).
- Alt: build the server record now so a first pilot can export pre/post results (more engine/server work).

### Q8. Is `authentication_fail` a shared attack/defence factor? (from `05`) — ✅ RESOLVED in design
Resolved during review: it is now the **shared** factor `senderAuth` in `00_data_contract.md` §2,
read by both the attacker seat (`04`, advisory) and the defender seat (`05`, scored), so attack and
defence agree on the tell. No action needed unless you'd prefer a different name.

### Q9. Does the pre-test show feedback before the post-test? (from `05`)
- **✅ Default:** yes, per-message feedback at the end of the round, because every verdict must
  explain itself.
- Alt: scores only until after the post-test (cleaner measurement, worse learning).


### Q10. Failed phish: free retries or a limit? (from `10`)
- **Default: free, unlimited retries**, framed as rehearsal reviewed by the handler, with failed sends counted in the report. Keeps it fun, not hard.
- Alt: a "heat" limit that forces a hint after N failures.

### Q11. Assessment weights and tutor view (from `10`)
- **Default: the suggested weights in `10` section 4**, completion flag only to Hacktivity.
- Alt: a per-student tutor report from persisted game state (new Hacktivity-side work).

### Q12. Lab length target (from `10`)
- **Default: 60-90 minutes**; cut order if long: forwarder header case, second ambiguous search, report tone check, optional aims.

### Q13. Include the SPF-breaks-on-forwarding header case? (from `10`)
- **Default: yes** (correct and commonly missed). Drop for a first-year cohort.

### Q14. Optional practical-mode lab sheet in HacktivityLabSheets? (from `10`)
- **Default: yes, after the game exists**; the game must be completable without it.
- Alt: keep fully in-game.

### Q15. Legal framing and cast surnames (from `10`)
- **Default: UK Computer Misuse Act 1990 plus a generic "equivalent laws elsewhere" line**; surnames Pierce, Lord, Hampshire kept from the 03/04 examples.

---

### Q07-A. Real brand names in the concept cards (from `07`)
The landing-page builder uses only fictional brands and `.example` domains in play. The concept
cards teach look-alike domains with the classic `paypa1` against `paypal`.
- **✅ Default: allow real brand names as plain-text typographic examples on concept cards only**, never in a built page.
- Alt: fictional examples only everywhere (avoids any trademark question; slightly less recognisable).

### Q07-B. Typed domains in the builder (from `07`)
- **✅ Default: domain is chosen from an authored menu, never typed.** Keeps scoring deterministic and means the game never helps a player invent a look-alike for a real company.
- Alt: let students type a domain and score its similarity automatically (richer, but starts to resemble a look-alike generator; I would not do this).

### Q07-C. Homograph option scope (from `07`)
- **✅ Default: homograph shown in the student lab only**, as one authored example with a concept card. Awareness and missions get typo-squats and extra-word tricks.
- Alt: include in awareness too (hardest tell to teach non-technical staff; the lesson there is "don't sign in from links").

### Q07-D. Simulated outcome metrics (from `07`)
- **✅ Default: the victim's result shows counts only** (`Visits 1 · Submissions 1 · Reports 0`) for the Ch. 9 report, no captured data of any kind.
- Alt: no metrics line in the builder; leave all counts to the lab scenario (10).

### Q07-E. Security-accuracy call to confirm (from `07`)
The padlock teaching line says a padlock shows the connection is private to whoever owns the address, and that fake sites can show one. I believe this is the standard current guidance; please confirm you are happy teaching it that way, and that the "after-submit redirect" is mentioned only on the defender card.
- **✅ Default: as written.**

### From 06 (pretext / vishing dialogue)

- **06-Q1. Suspicion gauge visibility.** ✅ Default: visible gauge with the NPC's mood on the portrait; no number in assessment mode. Alt: hidden, shown only through the NPC's reactions and the tells panel.
- **06-Q2. Role swap in the first slice?** ✅ Default: no; ship the attacker call first, add "play the helpdesk analyst" with the defender work (05). Alt: include it now.
- **06-Q3. Pretext results feed the later phish?** ✅ Default: yes (a password reset on record makes an "IT" email land; a caught call makes the target stricter). Uses the boostIfGlobal / strictIfGlobal hooks now defined in 00 §7.
- **06-Q4. Security-accuracy check on the modelled helpdesk policy.** ✅ Default: keep a deliberately weak policy (temporary code read out after two matched facts), labelled weak, with callback-to-number-on-file as the defence. Wants a check from you that this is realistic enough to teach from without reading as a recipe.

## Answer form

Copy this block, fill it in, leave it anywhere in the file:

```
Q1: [ ] default lab   [ ] awareness   [ ] m01 fold-in   notes:
Q2: [ ] default free-text   [ ] structured   [ ] +LLM advice later   notes:
Q3: [ ] default fictional-only   [ ] explore opt-in real OSINT   notes:
Q4: [ ] default neutral skin   [ ] other   notes:
Q5: [ ] default (measure now, integrations later)   [ ] other   notes:
Q6: [ ] leave SecGen lab   [ ] also patch it   notes:
Q12-A: [ ] default m01 Soft Entry   [ ] m06   [ ] m05   notes:
Q12-B: [ ] default additive-only   [ ] leave m01 frozen (use m05)   notes:
Q12-C: [ ] default unvoiced for now   [ ] voice now   notes:
Q7: [ ] default globals now, server later   [ ] server record now   notes:
Q8: [ ] default defender-only + mirror in 04   [ ] 05 only   notes:
Q9: [ ] default feedback at end of round   [ ] scores only until post-test   notes:
(new questions:)
```
