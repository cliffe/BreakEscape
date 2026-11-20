# Phishing & social engineering — decisions checklist

One place to answer every open question across **both** designs. Nothing here blocks work: each item
has a working default (✅) already applied in the plans, so if you agree with all of them there is
nothing to do. Tick a box, strike a default through, or write in the `notes:` space to change one.

- **No-VM suite** (in-browser minigames, systems, scenarios): `planning_notes/phishing_and_social_engineering/`
  — the design docs are in `designs/00`–`07`, `10` and `11`; `README.md` there is the entry point and holds the open questions.
- **VM suite** (SecGen-backed practical challenges, player-mediated, no IPC):
  `planning_notes/phishing_and_social_engineering_secgen/` — docs `README`, `01`–`04`, `REVIEW_R1.md`.

Source doc for each decision is tagged like `[07]` (no-VM design 07) or `[vm-02]` (VM-suite doc 02).

---

## Decisions of 2026-10-20 (user)

These answer or supersede several items below; the per-item boxes are left as written.

- **A1 answered:** student lab first (it is the first shippable SE product).
- **A2, A3, I1-I5 (VM track) superseded:** the SE VM plan is parked and out of scope, kept for
  reference (folder now `MAYBE-LATER-phishing_and_social_engineering_secgen/`). No VM side operations
  for Eldritch Hacker. The student lab has no VM companion (I3 resolved: no VM). If revisited, C6 is
  the cheapest candidate.
- **H1-H3 superseded:** no fold-in into Licence to Hack m01-m08; m01 "Soft Entry" is shelved.
  Optional single teaser stage in m09/m10 only.
- **F2 answered:** awareness product on a neutral corporate skin, under "Incident Simulations:
  Critical Cases", not SAFETYNET.
- **Two games:** Licence to Hack (m01-m10, VM-backed, finished first) and Eldritch Hacker
  (browser-only social engineering, the SAFETYNET home for these systems). Build order: Licence to
  Hack, then the SE systems via the student lab, then Eldritch Hacker and the awareness product.
- **New, open:** Eldritch Hacker's narrative specifics (antagonist cell, cast, missions, Architect
  reveal wording, monster reality) are provisional pending a universe-bible pass. See
  `eldritch_hacker/DIRECTION.md`.
- **Fit note:** OSINT browser, pretext call, intel board and rules engine re-skin to a cult; mail
  client and triage need a DM/feed variant; `senderAuth` is email-only; the landing-page builder
  needs its weaponisation check repeated for any new skin.

---

## What's being proposed (summary, so this reads alone)

**The idea.** Teach phishing and social engineering by putting the learner in the attacker's seat
first, then the defender's — "learn to spot it by learning to build it". One shared engine serves
three audiences: **Cyber Security students** (a technical lab), a **phishing-awareness product** for
ordinary staff, and the **SAFETYNET campaign** (m01–m08). It also fixes the existing SecGen phishing
lab's flakiness by moving the judging and feedback into the game, where it's instant and explains
itself.

**No-VM suite — reusable systems/minigames:**
- **Mail client** (inbox + spoofable compose) · **OSINT browser** (company site, social media, document
  metadata) · **Intel board** (turns findings into a target profile; tracks readiness) · **Rules
  engine** (judges whether a crafted email "lands" and shows which factor failed — the deterministic
  heart) · **Inbox-triage defender** (spot-the-phish, SPF/DKIM/DMARC headers, the awareness assessment)
  · **Pretext/vishing** (NPC conversation with a suspicion meter) · **Landing-page builder** (an
  *abstracted* clone, never real attack code). All bound by a shared data contract (`00`).

**No-VM suite — scenarios:**
- **`lab_social_engineering`** — a no-VM student lab: scope → OSINT → spear-phish 3+ targets → build a
  landing page → a pretext call → metrics/report → flip to defender. Mirrors Joe Gray's *Practical
  Social Engineering* and the Chothia "learn by doing" paper.
- **Awareness episodes** — short (10–20 min) role-based episodes (finance/BEC, HR/malicious-CV,
  helpdesk/vishing, exec/whaling, login-page clone, QR+SMS, optional deepfake-voice CEO), each **attack
  then defend**, scored on the defence, with pre/post measurement.
- **SAFETYNET fold-in** — a spear-phish/pretext stage woven into a mission (m01 "Soft Entry" is the pick).

**VM suite — practical SecGen challenges (coupled only through the player, no IPC):** information found
in the game (an email pattern, a pretext-won password, a harvested credential) is typed into a real VM;
flags and OSINT found on the VM are typed back into the game (flags validated server-side, bridging to
game progress). Six challenges:
- **C1** mail-server recon & the real SPF/DKIM/DMARC story · **C2** pretext password → real VM login
  (the clearest bridge demo) · **C3** the "honest hybrid" — game judges the email, VM runs the payload
  (fixes the flaky lab) · **C4** OSINT pivot box → more OSINT back into the game · **C5** harvested
  credentials → real portal login · **C6** blue-team phishing-kit forensics → IoCs as flags.

---

## A. Scope & build order

### A1. Which audience gets the first playable slice? `[01]`
The student lab exercises every system end to end, so it's the best proving ground; the awareness
episodes are the fastest route to the commercial product; the m01 fold-in is the smallest real-mission test.
- [ ] ✅ Student lab first · [ ] Awareness episodes first · [ ] m01 fold-in first · notes: ______

### A2. VM-challenge build order `[vm-02]`
- [ ] ✅ C2 first (smallest, clearest bridge), then C3 (the honest hybrid), then C1/C4/C6 · [ ] other: ______

### A3. Where do the first VMs debut? `[vm-03]`
A fresh/later mission or the student lab (no cached-audio or settled-VM-set constraints), vs retrofitting into m01.
- [ ] ✅ Student-lab VM companion first · [ ] a later/new mission · [ ] retrofit into m01 · notes: ______

---

## B. The phishing email mechanic

### B1. Free-text body vs structured composer `[02 → 04]`
Guided free-text teaches most (scored by the rules engine, matched on whole-word + synonym sets);
a menu-driven composer is easier to judge but teaches less.
- [ ] ✅ Guided free-text · [ ] Structured menus · [ ] free-text + optional LLM *advice* later (cost/variance) · notes: ______

### B2. Failed phish — retries? `[10]`
- [ ] ✅ Free unlimited retries (rehearsal; fails counted in the report) · [ ] "heat" limit forcing a hint after N fails · notes: ______

### B3. Include the "SPF breaks on forwarding" header case? `[10]`
Correct and commonly missed; maybe too subtle for a first-year cohort.
- [ ] ✅ Yes · [ ] Drop for beginners · notes: ______

---

## C. Landing-page builder `[07]`
(Reminder: it's an *abstracted* builder — no real HTML/capture/hosting; `.example` domains + a real-brand denylist.)

### C1. Real brand names on the teaching cards?
Only as plain-text typographic examples (`paypa1` vs `paypal`), never in a built page.
- [ ] ✅ Allow on concept cards only · [ ] Fictional examples everywhere · notes: ______

### C2. Domain chosen from a menu vs typed?
- [ ] ✅ Authored menu (deterministic; never helps invent a real look-alike) · [ ] Let students type + auto-score (I'd avoid) · notes: ______

### C3. Homograph trick scope?
- [ ] ✅ Student lab only · [ ] Include in awareness too · notes: ______

### C4. Simulated outcome metrics?
- [ ] ✅ Counts only (`Visits/Submissions/Reports`), no captured data · [ ] No metrics line at all · notes: ______

### C5. Confirm the padlock/cert teaching line (security accuracy) ⚠️
Teaches: a padlock shows the connection is private to whoever owns the address, and fake sites can have one;
the after-submit redirect is mentioned only on the defender card.
- [ ] ✅ Happy to teach it as written · [ ] change: ______

---

## D. Pretext / vishing `[06]`

### D1. Suspicion gauge visibility?
- [ ] ✅ Visible gauge + NPC mood, no number in assessment mode · [ ] Hidden (read it from reactions only) · notes: ______

### D2. Role-swap (play the helpdesk analyst) in the first slice?
- [ ] ✅ No — ship the attacker call first, add the defender swap with `05` · [ ] Include now · notes: ______

### D3. Pretext results feed the later phish?
A password reset on record makes an "IT" email land; a caught call makes the target stricter (boost/strict hooks).
- [ ] ✅ Yes · [ ] Keep them independent · notes: ______

### D4. Confirm the modelled helpdesk policy (security accuracy) ⚠️
Deliberately weak (temp code after two matched facts), labelled weak, with callback-to-number-on-file as the defence.
- [ ] ✅ Realistic enough to teach from · [ ] change: ______

---

## E. Defender & measurement `[05]`

### E1. Where does the pre/post triage score live?
- [ ] ✅ Game globals for lab/missions; server-side record only when the product is built · [ ] Build the server record now (for a pilot export) · notes: ______

### E2. Show pre-test feedback before the post-test?
- [ ] ✅ Yes — every verdict explains itself · [ ] Scores only until after the post-test (cleaner measurement) · notes: ______

### E3. (Resolved, FYI — no action) Sender-authentication factor
`authentication_fail` became the shared factor `senderAuth` (attack + defence agree on the tell).
- [ ] Fine as resolved · [ ] prefer a different name: ______

---

## F. Awareness product `[11]`

### F1. "See what attackers can find about *your own* staff" (real-staff OSINT)?
GDPR/consent risk. Default keeps it out; any future version would be admin-curated opt-in, walled off.
- [ ] ✅ Fictional targets only · [ ] Explore opt-in real OSINT · notes: ______

### F2. Product skin?
- [ ] ✅ Neutral corporate (fictional company); spy framing stays in the campaign · [ ] other: ______

### F3. Commercial integrations (SCORM/xAPI/LTI, SSO, admin dashboard)?
- [ ] ✅ Build pre/post measurement now, defer LMS/SSO to a productisation phase · [ ] other: ______

### F4. Ship the deepfake-voice CEO episode (E7)?
Optional, framed "verify, don't trust the ear", no technique detail. (Uses existing TTS.)
- [ ] ✅ Yes, optional · [ ] Leave it out · notes: ______

### F5. First-slice episode order?
- [ ] ✅ E1 finance → E5 login page → E3 vishing · [ ] other: ______

### F6. Run a small consented pilot before any effectiveness claims?
(Research on awareness training is mixed — Ho et al. 2025 found limited effect, so no claims until measured.)
- [ ] ✅ Yes, no claims until it reports · [ ] other: ______

### F7. Minimum group size for aggregates shown to customers?
- [ ] ✅ 10 (check with privacy advice) · [ ] other: ______

### F8. Commercial packaging + asset licensing?
Hosted vs licensed; and whether the PixelLab assets are cleared for commercial redistribution (to verify).
- [ ] ✅ Assume hosted; check PixelLab terms · [ ] licensed/on-prem · notes: ______

### F9. Offer a defend-only variant (for customers who dislike the "write a phish" beat)?
- [ ] ✅ Yes · [ ] Attack-then-defend only · notes: ______

---

## G. Student lab `[10]`

### G1. Assessment weights & tutor view?
- [ ] ✅ Suggested weights in `10` §4; completion flag only to Hacktivity · [ ] per-student tutor report from game state (Hacktivity-side work) · notes: ______

### G2. Lab length target?
- [ ] ✅ 60–90 min (cut order documented if long) · [ ] other: ______

### G3. Publish an optional practical-mode lab sheet?
- [ ] ✅ Yes, after the game exists (game stays completable without it) · [ ] Keep fully in-game · notes: ______

### G4. Legal framing & cast surnames?
- [ ] ✅ UK Computer Misuse Act 1990 + a generic "equivalent laws elsewhere" line; keep surnames Pierce/Baker/Hampshire/Lord · [ ] other: ______

---

## H. SAFETYNET fold-in `[12]`

### H1. Which mission hosts the first phishing/pretext fold-in?
m01 "Soft Entry" (additive OSINT + one spear-phish at Derek Lawson); alternates m06 (best pretext fit, uncached) or m05.
- [ ] ✅ m01 Soft Entry · [ ] m06 · [ ] m05 · notes: ______

### H2. Is any change to m01 acceptable, given its cached audio (1948 files)?
- [ ] ✅ Additive only (new aim/object/ink, no edits to existing lines/ids) · [ ] Leave m01 frozen → use m05 · notes: ______

### H3. Voice the ~6–10 new HaX lines now?
- [ ] ✅ Not yet (ship unvoiced; confirm once the words are signed off) · [ ] Voice now (TTS cost) · notes: ______

---

## I. VM / SecGen track `[vm-01…04]`

### I1. Hard vs soft gates for the game→VM handoff?
Hard = a specific secret authored into both repos (a real lock, but couples the two repos). Soft = game intel is the intended/faster path.
- [ ] ✅ C2 & C5 hard, the rest soft · [ ] all soft (simplest, no two-repo coupling) · notes: ______

### I2. VMs per challenge?
- [ ] ✅ Minimise (one target + the shared Kali; C6 a single analysis box) · [ ] other: ______

### I3. VM track: required or extra-credit in the student lab?
- [ ] ✅ Extra-credit/advanced (lab still completes with no VM) · [ ] Required · notes: ______

### I4. Patch the existing flaky SecGen `3_phishing.xml` lab in parallel?
This plan replaces its teaching value in-game, so patching it is optional.
- [ ] ✅ Leave it (separate optional task) · [ ] Also patch it (scoped to Haiku) · notes: ______

### I5. Schedule the three small game-side additions the VM review surfaced? `[vm-01, vm-REVIEW_R1]`
Needed before the richer VM challenges are buildable: (a) reveal an authored credential *literal* on
success in `06`/`07` (for hard gates), (b) a server-validated password-lock for VM-only facts,
(c) a scored-flag → intel-global wiring for VM findings that gate. All small, reuse existing primitives.
- [ ] ✅ Schedule them with the VM track · [ ] Keep VM challenges soft-gate only for now (skip a/c) · notes: ______

---

## New questions
(Space for anything you want to raise back; I'll fold answers into the plans and the review logs.)

- 
- 
