# Learning design: the deduction board

Sidecar to `../DEDUCTION_IMPLEMENTATION_PLAN.md`. Read-only against the plan: nothing here changes it.
Written 2026-10-22 against the plan at **3327 lines, review log up to Round 4 and its outcomes**
(§14), and `../../designs/12_deduction_board.md` (475 lines). Section numbers below (§3.10, §6.3, §9.1)
are the plan's.

Aim, as for the plan: a game that is fun and educational, not hard. Two skins use the board:
**Incident Simulations** (corporate, no combat; fixture B) and **SAFETYNET: Eldritch Hacker**
(browser-only social engineering, pulp cosmic horror, combat allowed; fixtures A, C, D). Never Licence
to Hack. All text authored; no runtime LLMs. Nothing player-facing uses board-game terms.

Recommendations are marked **R1 to R12** and collected in §8. Each says whether it is authored content
(no engine change), a small engine-string change, or a later option.

---

## 1. What the mechanics already teach

The plan already carries a sound teaching model. The table maps each mechanic to the practice it rehearses
and to the source that describes that practice.

| Mechanic (plan §) | Real practice it rehearses | Source |
|---|---|---|
| Public profile, stated in the brief (§3.1) | Working from stated indicators or a threat-actor profile, not from a hunch | CERT, *Common Sense Guide to Mitigating Insider Threats* (7th ed., 2022); Heuer, *Psychology of Intelligence Analysis* (1999) |
| `all` of three insider indicators (fixture B) | Indicators combine; no single one is meaningful alone | Shaw and Sellers, "Application of the Critical-Path Method to Evaluate Insider Risks" (*Studies in Intelligence*, 2015); NPSA (formerly CPNI) insider risk guidance |
| `not` clause (Courier "carries no ward charm") | Negative evidence: you must look before you can say something is absent | Heuer, ch. on missing evidence; Arthur Conan Doyle's "dog in the night-time" as the classic illustration |
| `markedAtLeast` (Devotee) | Weight of corroborating indicators; no single clue convicts | CISA, *Insider Threat Mitigation Guide* (2020): behaviours as a pattern, not a checklist |
| Public cell counts, "Hidden" cells (§3.1) | Knowing how much you have not yet looked at; scoping an investigation | ACH matrix practice (Heuer): every hypothesis against every item of evidence |
| Count elimination, pigeonhole step (§4.3) | Reasoning from known inventories ("only two archive badges were issued") | Asset and access registers as investigative sources (CERT Common Sense Guide, practice on knowing your assets) |
| Unknown number of guilty, no stated count (§3.1, DL10) | Do not stop at the first match; clear everyone | Nickerson, "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises" (1998) |
| Witnesses, not confessions (§3.2) | Corroboration; a subject's own word is a claim to test | ACPO, *Good Practice Guide for Digital Evidence* (2012) on corroboration; Acas investigation guidance |
| Influence cost, `wary`, `reports` (§3.3) | Interviewing widely spreads rumour and can tip off the subject | Acas, *Conducting workplace investigations*: confidentiality |
| Favours that backfire (§3.4) | Reciprocity and liking used against an investigator | Cialdini, *Influence*; Hadnagy, *Social Engineering: The Science of Human Hacking* (2018); Mitnick and Simon, *The Art of Deception* (2002) |
| Unique-item choice (§3.5) | Verify before acting on a single sighting | Rid and Buchanan, "Attributing Cyber Attacks" (*Journal of Strategic Studies*, 2015): act at the confidence the evidence supports |
| Tampering and second routes (§3.6) | Anti-forensics; volatile evidence; redundant logging | MITRE ATT&CK T1070 *Indicator Removal*; RFC 3227 *Guidelines for Evidence Collection and Archiving* (order of volatility) |
| Verdict kinds and stakes (§3.8, §3.9) | Proportionate response; wrongful accusation causes harm | Acas Code of Practice on Disciplinary and Grievance Procedures (2015); ICO, *Employment practices and data protection: monitoring workers* (2023) |
| "Undecided" mark, three-valued evaluator (§4.3) | Confidence levels; "not yet known" is a valid finding | UK Professional Head of Intelligence Assessment (PHIA) probability yardstick; Rid and Buchanan |
| Debrief "You already held what settled it" (§3.10) | After-action review: separate a reasoning error from an information gap | SOIM "follow up: post incident activities" (CyBOK) |

CyBOK knowledge areas for `mission.json` (keywords from `docs/CyBOKList.md`):

| `ka` | Topic | Keywords |
|---|---|---|
| `HF` | Fitting the Task to the Human; Human Error | `human biases`, `thinking fast and slow` |
| `ADV` | Models | `attribution` |
| `SOIM` | Human Factors: Incident Management; Knowledge: Intelligence and Analysis | `follow up: post incident activities`, `situational awareness` |
| `FOR` | Definitions and Conceptual Models | `digital (forensic) trace`, `legal concerns and the Daubert Standard` |
| `LR` | Introductory Principles of Legal Research | `evidence and proof` |
| `POR` | Transparency | `audit-based transparency` (B only: the badge log and DHCP leases as audit records) |
| `RMG` | Risk Governance | `security culture` (B only) |

---

## 2. Gaps the plan does not yet cover

The plan is thorough about logic and engine. Four learning points have no home in it yet.

**G1. Indicators are grounds for a closer look, not proof.** NPSA and CERT both stress that insider-risk
indicators (a grievance, a personal device, odd access) are common among people who do nothing wrong.
Fixture B's verdict nouns are "Insider" / "Not an insider", and the debrief says "Insider: matched the
Insider profile". Inside the game's fiction that is true by construction, but a student can carry away
"three indicators = guilty". Shaw and Sellers' critical path also counts the *organisation's response*
as a factor: a poorly handled grievance raises risk. The game should say once, in Nair's voice, that
the profile justifies a referral and an interview, not a sacking. See R1.

**G2. Raising a grievance is a right.** The insider profile includes "raised a grievance in the last
month". Lindqvist's overtime complaint is a legitimate act, and in the UK a grievance or a protected
disclosure (Public Interest Disclosure Act 1998) must not be held against the employee. B currently
teaches correctly by making Lindqvist innocent, but nothing says *why* his grievance alone means
nothing. See R2.

**G3. Privacy and authority in a workplace investigation.** The player reads an HR summary, a badge log
and a DHCP lease list. The ICO monitoring guidance asks for a lawful basis, proportionality and the
least data needed; Acas asks that the person investigated hears the case and can answer it. In B this
can be taught with two authored lines and no engine change (R3). In Eldritch Hacker, SAFETYNET authority
covers lockpicking a cloakroom; that fiction is fine, and the lab sheet can contrast it with real
practice (§7).

**G4. Right for the wrong reason.** The runtime records `decidedAtVerdict` for every verdict (§4.5), but
the debrief only uses it for wrong and missed calls (§3.10). A right accusation made while the suspect
was still undetermined is a lucky guess, and the debrief currently praises it as "Right call" with no
comment. Attribution research (Rid and Buchanan) and Heuer both warn that a correct guess reinforces a bad
habit. This is the cheapest high-value addition: one engine string. See R4.

---

## 3. Learning outcomes

Written so each can be evidenced by something the game records (`deduction_state`: marks, reasons,
verdict kinds, `decidedAtVerdict`, outcomes) or by the lab sheet later. Verbs follow the house style of
design 10's outcomes.

### 3.1 Incident Simulations (corporate skin, fixture B and later missions)

By the end of the case the player can:

- **IS-1.** Explain why each insider-risk indicator on its own (out-of-role access, a personal device on
  the staff network, a recent grievance) is a reason to look closer and not evidence of wrongdoing.
- **IS-2.** Apply a stated multi-part profile to the evidence, requiring every part, and clear someone
  who matches only some parts (Lindqvist matches two of three).
- **IS-3.** Corroborate one source with another of a different kind (a colleague's account against the
  HR record; the badge log against the rota) and say which kind each clue is.
- **IS-4.** Clear colleagues with a stated reason, including by elimination from known counts ("both
  grievances were found elsewhere").
- **IS-5.** Describe what makes an internal investigation proportionate and fair: authorised access,
  the least data needed, a referral rather than an accusation, and the right of the person to answer.
- **IS-6.** Recognise two of their own biases in action: stopping at the first fit, and trusting the
  colleague who is helpful (Lindqvist hands over his complaint and the server code).

### 3.2 SAFETYNET: Eldritch Hacker (fixtures A, C, D and later missions)

By the end of a case the player can:

- **EH-1.** Apply three kinds of criterion and say which kind each is: a unique marker (Keyholder), a
  conjunction that includes an absence (Courier, Sleeper), and a threshold of indicators (Devotee).
- **EH-2.** Explain why absence counts only once you have looked where it would be: a "Hidden" cell is
  not a "no".
- **EH-3.** Recognise social engineering aimed at the investigator: a favour that buys trust
  (reciprocity), a suspect who is friendly and useful, pressure to act before checking.
- **EH-4.** Verify a single sighting before acting on it, and choose a proportionate action
  (watch, seize later, confront) for the confidence they have.
- **EH-5.** Explain how an adversary destroys evidence, why the most volatile evidence is collected
  first, and why a second source or a backup matters.
- **EH-6.** Weigh speed against thoroughness, and the cost of acting wrongly against the cost of not
  acting.
- **EH-7.** Hold a suspect as undecided when the evidence is undecided, and state why.

### 3.3 Shared outcome

- **ALL-1.** After the debrief, tell a reasoning error ("I held the clue and misread the rule") from an
  information gap ("I never found the clue"), and name the clue or clause in each case. The debrief's
  two lines ("You already held what settled it" / "The clue that would have settled it") are built for
  exactly this.

---

## 4. Misconceptions the game should surface

Each row: the belief, where play exposes it, and the line that names it. A misconception is surfaced
best when the player acts on it and sees the result, then reads one plain sentence about it.

| # | Misconception | Where play exposes it | What the player sees |
|---|---|---|---|
| M1 | One indicator means guilt ("he complained to HR, so it's him") | B: Lindqvist (grievance + out-of-role access, no device); D: Chen (archive pass + wants the Codex, but carries a charm) | Debrief "Why": "Insider: no, no personal device". R1 and R2 lines in Nair's ink |
| M2 | The first person who fits is the only one | A and D: two and three guilty; no stated count (DL10) | A Devotee or Keyholder left "Not named": "You had worked it out. Naming them is the step that turns evidence into a result." |
| M3 | No evidence found means no evidence exists | A: Ishikawa's charm in a locked locker; every Courier and Sleeper `not` clause | Board cell reads "Hidden", never "none". Debrief: "You had not ruled them out: <label>, from <place>, did" |
| M4 | A suspect's own account clears them | All: "witnesses, not confessions" | Suspect talk grants only what can be seen ("show me your kit"). R5 adds the fairness side: hearing them is required, believing them is not |
| M5 | A helpful person is a trustworthy person | A: Marsh's favour; B: Lindqvist hands over the code and his complaint (he is innocent, which teaches the reverse case too) | A: lookout appears, debrief "You fetched Marsh's phone before checking her". B: R6 closing line |
| M6 | A small favour is harmless | A: Marsh's phone was her signal | `onBackfire` and the favour's `debriefLine` |
| M7 | If the logs are wiped, the case is lost | D: three tampers, each with a recovery route | "Evidence destroyed", then the cell shows the clue again after the shredded document, the backup or the conductor |
| M8 | Acting fast is better than being right | A: probe accusations escalate; C: KOs revoke the keycard; D: bringing a stop forward fades evidence | Escalation effects in play; debrief lists destroyed evidence "after the call" |
| M9 | Right answer means right reasoning | Any anytime case: an early lucky accusation | Nothing today. R4 adds "Right call, made before the evidence settled it" |
| M10 | Confidence is yes or no | All: three-valued board, "Undecided" mark | Nudge names when someone is decidable; marks can stay "Undecided". R7 makes "undecided counts as cleared" visible on the confirm panel |
| M11 | Pressing every witness is free | All: influence costs, `wary`, `reports` | A `reports` threshold causes a tamper: the witness tipped off the other side |
| M12 | Investigators collect everything they can | B: HR file, DHCP leases | R3: Nair's authorising line; the lab sheet asks what was proportionate |
| M13 (later) | Insiders are always malicious villains | Not covered: every fixture's insider is deliberate | CERT and NPSA both find many insider incidents are unintentional or opportunistic. Lab-sheet hook only (§7); a later Incident Simulations case could make the "guilty" party careless rather than malicious |

---

## 5. How each fixture and the debrief address them

Fixtures are engine test cases with placeholder text, so the content below is guidance for the real
missions that follow them. Where a line can go into a fixture now without touching any lint or bridge
assertion, it says so.

### 5.1 Fixture B, Night shift (Incident Simulations)

Teaches IS-1 to IS-6, M1, M3, M4, M5, M10, M11, M12.

- **The near miss is Lindqvist.** He has two of three indicators, is likeable and helpful, and gives the
  player the server code and his own complaint. The `-wrong` bridge names him. This is the case's main
  lesson and it should be the one the closing line points at (R6).
- **Haddad is the second near miss**: a personal laptop on the network, cleared by in-role access and no
  grievance. She shows that a policy breach (bring-your-own device) is not an insider act.
- **Corroboration of different kinds.** Okoro's grievance comes from Tomás (a witness) and the HR summary
  (a record); her device from Tomás and the DHCP printout. A real mission should keep at least one fact
  per guilty suspect that has a witness route and a record route, so the debrief can show "from the HR
  file" beside "from Tomás".
- **Proportionate verdict.** B allows only `report`, to the security manager. That is the right shape for
  workplace practice: no face-to-face accusation, no tipping off. Keep it for every Incident Simulations
  case (R8).
- **Authority and minimum data.** Nair's opening call gives the cabinet code. One more clause makes the
  authority explicit (R3).
- **Debrief.** "Why" lines on every card do most of the teaching. The authored `closingLine` currently
  reads "The access log, the network and the HR file each cleared someone. Okoro fitted all three." It is
  accurate and plain; R6 proposes a version that also names the near miss.

### 5.2 Fixture A, Open evening (Eldritch Hacker)

Teaches EH-1 to EH-4, EH-6, M2, M3, M5, M6, M8.

- **Three criteria, three habits.** Okafor (unique marker: find the one thing), Ishikawa (absence clause:
  look in the coat), Marsh (threshold: count marked clues). Delacroix is cleared by *where she was*: an
  alibi from a record, the badge log.
- **Social engineering of the investigator.** Marsh's favour is reciprocity used against the player, and
  HaX's general warning ("Don't do favours for anyone you haven't checked") makes it a choice, not a
  trap. This is the clearest link back to the SE strand (pretexting, the "quick favour" call).
- **Verify before acting.** The camera sighting opens the unique-item choice with three graded options.
  "Leave her be and watch" keeps confidence-building open and HaX says she still needs naming: good.
- **Costs of fishing.** Each probe accusation closes a route, then brings the doorman, then ends the
  evening. That matches the real harm of speculative accusations: people stop co-operating.
- **Debrief.** Favour line names the backfire. Suggested closing line at R6.

### 5.3 Fixture C, The sleeper (Eldritch Hacker)

Teaches EH-1, EH-2, EH-4, EH-6, EH-7, M1, M4, M8, M10.

- **Looks bad, is cleared.** Ahmed went to the quarry site (the suspicious fact, and the one gossip gives
  first, at an influence cost) and is cleared only by the verified alibi in the garage door log. This is
  the hearsay-then-record lesson: Baptiste's gossip is true, and still not enough.
- **Record over word.** The cloned badge and the door log both speak to Novak's night; the player can
  compare the reader's "Last used 03:40" with the log. Good for chain of evidence: two records, one event.
- **Hidden stakes.** "Trust no one" without a stated cost is how real pressure feels. The keycard loss
  after a wrong takedown is immediate feedback without the reason; the debrief supplies the reason.
- **Proportionate action.** "Ask them to wait in the comms room" is a containment step, short of a KO.
  Real missions should keep a non-violent `act` option beside KO in every combat case (R9).

### 5.4 Fixture D, The night train (Eldritch Hacker, strict)

Teaches EH-5, EH-6, EH-7, M7, M8, M10.

- **Order of volatility.** Each stop fades the first clue in its list that the player does not hold. A
  player who reads the carriage's most perishable evidence first (the rack label, the coat, the phone)
  loses nothing. RFC 3227's "collect the most volatile first" is exactly this.
- **Recovery and provenance.** Recovered evidence from a shredded document or a backup is still evidence.
  The lab sheet can ask how you would show a restored copy is genuine (§7).
- **Decide everyone.** `requiresAll` forces a mark on every suspect, which is the "clear everyone"
  habit under time pressure. With the nudge on, it stays fair.
- **Strict, but honest.** A loss ends in honest credits and still shows the full debrief. The no-blame
  lines matter most here.

### 5.5 The debrief as teacher

The engine debrief (§3.10, §6.3, §6.7) already does the three things good after-action reviews do: says
what happened, says why, and separates a reasoning error from a missing fact, with no blame. Specific
strengths worth keeping through later rounds:

- "Why" lines on right calls too (R2D-6). Players who guessed well still see the clause.
- "You already held what settled it" vs "The clue that would have settled it". This is ALL-1.
- The summary counts "suspects cleared with a reason" separately from right calls. Clearing is half the
  job, and this rewards it.
- No-blame lines in plain words; never "You failed to".

---

## 6. Debrief and in-game wording that teaches without lecturing

### 6.1 Principles

1. **One sentence per lesson, after the player has felt it.** The debrief and the closing line, not the
   brief, carry the lesson. The brief states the rule and the stakes only.
2. **Point at the player's own case.** "Lindqvist fitted two of the three" beats "partial matches are
   not matches".
3. **Characters speak it, in their own voice.** Nair is a security manager: procedural, dry. HaX is warm
   and brisk. Neither names a cognitive bias.
4. **Name the concept in the lab sheet, not the game.** "Confirmation bias", "order of volatility",
   "reciprocity" are lab-sheet terms. The game shows the thing; the lab sheet gives it its name.
5. **Never praise luck.** A right call made before the evidence settled it gets a neutral note (R4).
6. **No moralising tails.** No "Remember, always…", no "This shows the importance of…".

### 6.2 Proposed engine strings (small changes; the plan owner decides)

| Where | Proposed text | Why |
|---|---|---|
| Debrief, right call with `decidedAtVerdict` false (R4) | "Right call, made before the evidence settled it. <Clue label>, from <place>, would have." | M9. Uses data already recorded and the same "settling set" the wrong-call line computes |
| Debrief, right clear (kind `final` or `report` close) with `decidedAtVerdict` false | "Rightly cleared, though nothing had ruled them out yet." | Same habit on the clear side. Optional: the "You had not ruled them out" line already covers "Not named" |
| Final-call confirm panel (R7) | "Anyone still Undecided is cleared." (after "This closes the case.") | §6.6 treats undecided as clear; the player should see that rule before confirming |
| Report close in ink (B's §7.5 warned step) | already authored: "Anyone you haven't named is cleared…" | Keep; it does the same job for `report` |

Both debrief lines would sit after the outcome words and before "What you held". Neither adds blame
wording, and neither fires on a right call that was decided at the time.

### 6.3 Proposed authored lines (content only; no engine change)

**Fixture B, Nair's opening call (R1, R3)**, added to the line that gives the cabinet code:

> "HR have agreed you can see the summary for this. Only the summary. None of these three things on its
> own means anything: plenty of people moan about rotas and bring a phone in. All three together is
> enough for me to take someone to HR and hear their side."

**Fixture B, Nair's reply after a right report (R1, R5):**

> "Thanks. I'll take it to HR and legal tomorrow. She'll get a chance to explain herself, with a rep if
> she wants one."

**Fixture B, Nair's reply after a wrong report (R2):**

> "I'll look at it. Erik's overtime complaint was his right, though. If that's the main thing, it won't
> hold up."
(Use only when Lindqvist is the wrong name; a generic version for the others: "I'll look at it, but I
need more than this before I put anyone through an interview.")

**Fixture B, `closingLine` (R6)**:

> "Lindqvist fitted two of the three, and helped you more than anyone. Okoro fitted all three. The
> access log, the network and the HR file each cleared someone."

**Fixture A, `closingLine` (R6)**:

> "Each profile needed a different kind of looking: one object, one absence, three small signs. The
> people who seemed most helpful were not always the safest to help."

**Fixture C, `closingLine` (R6)**:

> "Ahmed's trip looked bad until the door log spoke for him. What someone tells you about a colleague is
> a lead, not a finding."

**Fixture D, `closingLine` (R6)**:

> "The cult took what was easiest to lose first. What you read straight away, they could not take."

Each is one or two sentences, names people from the case, and leaves the concept's name to the lab
sheet. All pass DL10 (no count of guilty, no "the <noun>") and DL15 (no banned words); checked by hand
against §3.11.

### 6.4 Wording to avoid

- "Profile" used as a verb about people in the corporate skin ("we profiled the staff"). Use "checked
  against the indicators".
- "Guilty" in Incident Simulations player text. The plan already uses the authored `verdictNoun`; keep
  "Insider" / "Not an insider" or, better for teaching, see R1's option.
- Any line that treats a personal trait as a clue (see R10).

---

## 7. Lab-sheet hooks

Lab sheets are written last (house rule). These are hooks only: what the sheet could ask, and what game
data it can lean on. Everything below works from what the player saw; nothing needs per-student data
leaving the game.

1. **Build the matrix.** Redraw the board as an Analysis of Competing Hypotheses grid (Heuer): suspects
   as hypotheses, clues as rows, each cell consistent, inconsistent or not applicable. Which single clue
   was most diagnostic? (B: Lindqvist's "no personal device".)
2. **Indicator or proof?** For each of B's three indicators, list two innocent explanations. Then read
   Shaw and Sellers' critical path (personal predispositions, stressors, concerning behaviours, the
   organisation's response) and place Okoro's facts on it. Where could the employer have stepped in
   earlier?
3. **Proportionate and lawful.** Using the ICO monitoring guidance and the Acas investigation guide: what
   did the player look at, was each item necessary, and who should have authorised it? What must happen
   before Okoro faces any disciplinary step? Contrast with SAFETYNET's fictional powers in the Eldritch
   Hacker cases.
4. **Write a referral, not an accusation.** One paragraph to HR: the facts, where each came from, what is
   not known, and a confidence statement using the PHIA yardstick ("likely", "highly likely").
5. **Absence of evidence.** Pick one `not` clause (Ishikawa's charm, Ahmed's alibi). When was the absence
   established, and what would you have had to check before you could say it?
6. **Investigators as targets.** Map Marsh's favour and Lindqvist's helpfulness to Cialdini's reciprocity
   and liking. Describe a real-world equivalent (a "quick favour" phone call to the service desk) and a
   rule that defeats it.
7. **Evidence that disappears.** For fixture D's three tampers, give the ATT&CK technique (T1070 and its
   sub-techniques), the order-of-volatility reasoning from RFC 3227, and a control that would have kept a
   copy (central log forwarding, write-once storage, backups). How would you show a restored backup is
   genuine (hashes, custody record per the ACPO principles and ISO/IEC 27037)?
8. **Right for the wrong reason.** If the player's debrief showed R4's line, what should they have
   checked first? If it did not, invent an accusation sequence that would have produced it.
9. **Beyond malice.** CERT and NPSA both find that many insider incidents are careless or coerced, not
   planned. Rewrite B so that Okoro was tricked into letting the intruder in. What changes in the
   indicators, and in the proportionate response?
10. **Bias check on profiles.** Given a draft profile that includes a personal trait (age, nationality,
    faith), explain why it is unfair and unlawful (Equality Act 2010), and rewrite it in terms of access
    and behaviour.

Data the sheet can quote back if a later build shows it (not needed now): `deduction_state.marks` with
reasons, verdict kinds, `decidedAtVerdict`, destroyed and recovered facts. All already recorded by the
plan; no new state.

---

## 8. Recommendations

Ordered by value for effort. "Authored" means content in a mission or fixture with no engine change;
"engine string" means a fixed string in §6.3 of the plan; "later" means not for Phase 10.

| # | Recommendation | Kind | Outcomes / misconceptions |
|---|---|---|---|
| **R4** | Add the "right call, made before the evidence settled it" debrief line, using `decidedAtVerdict` already recorded | Engine string (+ one grader branch reusing the settling-set code) | ALL-1, M9 |
| **R1** | Every Incident Simulations case says once, in a character's voice, that matching the profile justifies a referral and an interview, not a finding of guilt. Option for the user: `verdictNoun` "Refer to HR" / "No further action" in place of "Insider" / "Not an insider" for real missions (fixture B can keep its nouns) | Authored | IS-1, IS-5, M1 |
| **R2** | When a suspect's only damaging clue is a grievance, the wrong-report reply says raising it was their right | Authored | IS-1, M1, G2 |
| **R6** | Each mission's `closingLine` names the case's near miss and the habit it tested, in one or two sentences (drafts in §6.3) | Authored | All |
| **R3** | B-style cases state the authority and the limit of what the investigator may read ("Only the summary") | Authored | IS-5, M12 |
| **R7** | The final-call confirm panel says "Anyone still Undecided is cleared." | Engine string | EH-7, M10 |
| **R10** | Authoring rule for every mission: profile clauses and clues describe access, actions and things tied to the operation, never personal traits (ethnicity, faith, age, health, union or political membership). In Eldritch Hacker, keep cult markers operational (a key, a burner, a forum handle, a sigil the cult issues), not religious dress or practice. Add to the §7 authoring conventions when the docs packet runs | Authoring guide | IS-5, lab hook 10 |
| **R11** | Across real missions, vary who is guilty by age and background as deliberately as the cast is varied. In the placeholder fixtures, both Igbo-surnamed suspects are guilty (Okoro in B, Okafor in A), and in B she is the one guilty party among four. Harmless for test fixtures, but the real missions should not repeat the pattern | Authored (cast) | Fairness |
| **R5** | Keep "witnesses, not confessions", and add the fairness half in Incident Simulations: the subject is heard after the referral (Nair's line in §6.3). A suspect's account can be a topic that grants nothing by itself | Authored | IS-5, M4 |
| **R8** | Incident Simulations cases use only `report` (and `final`): no face-to-face `accuse`. A future lint warning would be cheap but is not needed now | Authoring guide | IS-5, M11 |
| **R9** | Every combat case keeps a non-violent `act` route beside KO (C's comms room, A's "have it taken off her at the door") | Authoring guide | EH-4, EH-6 |
| **R12** | Later: an optional authored `sourceKind` on a fact ("record", "witness", "seen") shown on the card and in "What you held", so corroboration across kinds is visible. Not for Phase 10 | Later | IS-3, lab hook 4 |

None of these changes a rule in §4.3, a lint id, a fixture's solution or a bridge assertion, except R4
and R7, which add one string each (§11.4's string test and §11.8's term grep would pick them up).
