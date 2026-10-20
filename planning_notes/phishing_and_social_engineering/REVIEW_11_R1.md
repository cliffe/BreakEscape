# Review — 11 awareness product (attack→defend episodes), Round 1

Read-only review against `BRIEF.md`, `README.md`, `designs/00_data_contract.md`, and the reused
component docs (`01`, `04`, `05`, `06`, `07`). Fact-checks done by web search and by reading the
primary PDFs (Chothia ASE '18 at `/home/cliffe/Downloads/ase18-paper_chothia.pdf`; Ho et al. 2025
fetched from the authors' site). No files were edited.

**Severity count: 0 Blocker, 3 Major, 6 Minor.** Verdict: **majors remain.**

The core design is sound and matches the brief on the hard points: defence is the only scored beat
(§4.1), the attack beat is never ranked (no "best phisher"), reporting is always a valid win and is
never penalised (§4.3), there is no individual leaderboard, and the empathy lesson is stated out
loud and is correctly grounded in Chothia. Real-staff OSINT is explicitly out of scope (§6.2, Q3)
and productisation (SCORM/xAPI/LTI, SSO, dashboard, skin, localisation) is correctly staged for
later with the schema hooks kept open (§6.3, Q4/Q5). Model-don't-weaponise holds throughout (E5
judges page choices and never deploys, E7 scores pretext not audio realism and forbids a real
voice). All nine brief sections are present and the per-episode table is concrete. The majors are
two internal/cross-doc inconsistencies and one overstated citation; none make the product
unbuildable.

## Findings

### M1 (Major) — red-flag id library gap; the "can never disagree" invariant is overclaimed

§5.1 states: "Red-flag ids are the same ids as the `04` factor library plus a defender-only set
(`lookalike_domain`, `unexpected_qr`, `unrequested_mfa_push` and so on). One id list means attack
feedback and defend scoring can never disagree." This is not true as written. `00_data_contract.md`
§2 is the single source of truth and defines seven factors with one canonical red-flag string each;
the only defender-only addition in the contract is `authentication_fail` (05 N3). The ids this
episode doc leans on — `lookalike_domain`, `changed_bank_details` (both load-bearing in the E1
worked example, §4.2), `unexpected_qr`, `unrequested_mfa_push`, and the smishing/vishing tells — are
**not** in `00` §2. Several of them (changed bank details, QR, MFA push, "voice with no callback")
have no attack-side factor in these episodes at all, so the "can never disagree" guarantee cannot
hold for them: they are defend-only content flags with no attacker mirror. `00` explicitly says it
wins any conflict, so these ids are currently undefined for authoring.

Fix: add the new defender-side ids to `00` §2 (shared red-flag library), or to a documented
defender-only extension owned by `05`, before E1 can be authored as described. Then narrow the
invariant to its true scope: "where a tell has both an attack and a defend side, both use the same
id"; drop the blanket "can never disagree".

### M2 (Major) — §4.1 scoring contradicts `05`'s documented scoring, yet `05` is said to be reused "unchanged"

§6.1 says episodes "reuse the minigames and systems of `01`–`07` unchanged and add a thin
sequencer." But the defend scoring in §4.1 (classification 2, flags 1 each to max 2, action 2; a
false alarm "costs nothing") is a different model from the one `05` actually implements
(`05_inbox_triage_defender.md`, "Verdict points"): a verdict matrix (phish Report 60 / Delete 30 /
Trust 0; real mail Report 20 / Trust 60) plus a `flagPoints` term out of 40. In `05`, reporting a
genuine message **costs 40 points** of the verdict ("not zero, because over-reporting is the right
failure mode"); §4.1 says the same action "costs nothing". `05` also computes and emits per-item
`score` and headline numbers itself (05 `answers:[{verdict,flags,score}]`, `reportRate`,
`falseAlarms`). So either the episode runner re-scores `05`'s raw verdicts (then `05` must expose
its scoring as data — new work not listed in N1–N8), or `05` is not reused "unchanged". As written
the two scoring systems silently disagree.

Fix: state who owns defend scoring. Either (a) adopt `05`'s model in §4.1 (keep the small
false-alarm cost, which still satisfies "reporting is never the wrong move" because it stays well
above Trust), or (b) declare `05`'s scoring parameterised by the episode `weights` block and add
that parameterisation to the N-table as new work. Reconcile the "costs nothing" vs "−40" wording
either way.

### Minor findings

- **m1 — E1 flagship: item count vs score mismatch.** The E1 defend beat lists four items (genuine
  invoice, lookalike domain, "CEO needs this wired today", genuine change-of-bank verified by
  phone) but the Score column says "5 classifications". Off by one in the flagship table. Fix: list
  five items or change the count to four.
- **m2 — Score column is counts, not points.** The per-episode "Score" column mixes scored
  opportunities ("5 classifications, 3 flag-naming, 1 verification") while §4.1 defines points. A
  reader cannot compute a per-episode maximum. Fix: label the column "scored opportunities" and note
  §4.1 weights apply, or give max points per episode.
- **m3 — "one message" cap is contradicted by several episodes.** §3.1 says stage 3 is "capped at
  one message so the episode stays short", but E3's attack beat is a call plus an MFA-fatigue beat,
  E5 builds a page, and E6 picks a pretext and a channel. The cap as worded does not describe the
  episode set. Fix: reword to "one attempt / one artefact".
- **m4 — accessibility fully deferred.** §6.3 stages the accessibility pass (keyboard-only,
  screen-reader, reduced motion) as "later" for a product aimed at non-technical staff, often
  mandated at work. For a commercial awareness tool that is a real equality-of-access risk, not pure
  polish. The doc already flags the risk and keeps plain-text alternatives open; consider pulling
  core-loop keyboard/screen-reader support into the first slice rather than deferring all of it.
- **m5 — culture section could cite NCSC.** The no-blame stance, report-rate over click-rate, and no
  leaderboard all align with NCSC-style guidance, but no source is named. A one-line NCSC citation
  in §4.3 would back the concept-level claim for customers who ask.

## Fact-checks

Three claims the doc marks "(to verify)". Evidence below.

### FC-A — Microsoft blocks internet-sourced Office macros by default: CONFIRMED; doc is fair

Microsoft Learn ("Macros from the internet are blocked by default in Office") confirms the default
block. Announced February 2022; rollout began with Current Channel (Preview) v2203 around April
2022; briefly rolled back in July 2022 after feedback, then re-rolled out. The caveats the doc asks
to re-confirm are correct: it keys off **Mark of the Web** (NTFS only, added to files from the
internet such as email attachments), applies to the Windows Office apps (Access, Excel, PowerPoint,
Visio, Word), and is overridable via **Trusted Locations**, Trusted Publisher signatures, and Group
Policy / admin configuration — a user can still save to a trusted location and enable macros. The
doc's "blocked by default since 2022" and the E2 framing ("largely blocked now, but the lure still
shows up") are accurate and well-hedged. The point that attackers pivoted to other containers and
to no-payload fraud is also correct. No change needed beyond the dates/caveats the doc already flags
for learner copy.

### FC-B — Ho et al. 2025 (IEEE S&P): characterisation FAIR; the 1.7% figure IS in the primary text (correct the provenance)

"Understanding the Efficacy of Phishing Training in Practice" (Ho, Mirian, Luo, Tong, Lee, Liu,
Longhurst, Dameff, Savage, Voelker; IEEE S&P 2025). The study parameters the doc gives are exact:
an 8-month randomised controlled experiment, ten simulated phishing campaigns, "over 19,500
employees" at a large healthcare organisation (UCSD Health), with explicit no-training control
groups. Headline findings, from the abstract: "no significant relationship" between recently
completing annual awareness training and failing a simulation; for embedded training the "absolute
difference in failure rates between trained and untrained users is extremely low"; "most users
spend minimal time interacting with embedded phishing training material" — the body reports the
majority spend **less than 30 seconds**, so the doc's "under a minute" is conservative and correct.
The paper also notes that for some content, completing more training correlated with a *higher*
chance of failing later.

Correction: the doc says a secondary source's "1.7%" figure "I could not find in the primary text".
It **is** in the primary text. Table 2's caption reads: "The average difference between the control
group and the training groups across all phishing emails is 1.7%", and the results repeat it
("1.7% absolute", "on average a 1.7% lower failure rate"). So 1.7% is the paper's own average
absolute difference in simulation failure rate between embedded-trained and control users — a figure
the paper presents as evidence the effect is tiny, which *supports* the doc's scepticism rather than
undercutting it. Fix: cite 1.7% as primary (Table 2) and drop the "secondary / unverified" caveat.
The doc's overall "mixed-to-negative evidence; we don't claim behaviour change" stance is fair and
honest. Minor nuance: the doc blurs the annual-training arm (no significant relationship) with the
embedded arm (1.7% absolute difference) slightly; worth separating the two in learner-facing copy.

### FC-C — Chothia "team discussion drove the learning": OVERSTATED (Major, factual-accuracy)

This is the only citation finding at Major. §5.3 states flatly: "Chothia's finding... is that team
discussion drove the learning," and uses it to justify the facilitated mode. The paper does not
support "finding" in an empirical sense. It describes team discussion as a **design aim** ("The aim
of this part of the exercise is to encourage students to discuss phishing attacks, and so to gain
an understanding of why they work") and reports it anecdotally ("We found discussion of possible
phishing attacks to be particularly useful"), and students "universally said that the exercise
raised their awareness". Critically, there is **no formal evaluation**: "We would like to carry out
a formal assessment of our framework as a learning tool" (Further Work). The only quantitative
results are participation, not learning (e.g. 14 of 22 students found the two extra-credit attacks).
So there is no effectiveness number to quote, and "drove the learning" is the authors' intent plus
an anecdote, not a measured result.

What the paper *does* strongly and directly support is the doc's central empathy lesson: the stated
goal is "to counter the idea that all phishing attacks are easy to spot and that people who fall for
them are stupid... by making students craft convincing e-mails, i.e., ones which they themselves
might fall for." The E2 "email your CV to the boss" pretext also matches the paper's worked example
exactly. Fix: in §5.3 soften to something like "Chothia built the exercise around team discussion
and reports it as anecdotally valuable; the paper carried no formal evaluation, so facilitated mode
is a reasonable design bet, not an evidence-backed requirement." The doc's own §5.2/§9 hedges
already point this way; §5.3 should match them.

## Engine-reuse spot checks (high level, against 00/01/05)

- `01` read-only mail-reader shared with `05` and the flip view: supported (01 N5, line 125; 01
  lines 15, 26-27 for the phone variant on the `phone-chat` shell). N2/N6 are consistent with `01`.
- Minigame lifecycle citations (`minigame-manager.js:229`, `base-minigame.js:84-108`,
  `minigame_completed`, `set_global` via `apply-actions.js:33`): match `01` and `00` §5; the doc
  correctly marks them "as cited in 01, not re-verified here".
- `05` assessment mode, parallel item banks, `truth`/report-always-visible, per-item records:
  supported by `05` (pre-assessment card, `redFlagLibrary`, `setGlobalPrefix`, `answers[]`). See M2
  for the scoring-model clash.
- `06` suspicion model and the external-function spike for E3/E7: supported, and `00` §6 flags the
  ink external-function risk the doc relies on. The doc's E3 fallback (scripted branch, no suspicion
  model) is the right hedge.
- `07` judges domain/logo/form choices and never produces a deployable page (E5): matches `07`
  (no network, `.example`-only, locked real domain).

## Verdict

**Majors remain.** No blockers. Resolve M1 (define the new red-flag ids in `00` and narrow the
invariant), M2 (reconcile §4.1 scoring with `05`'s model and say who owns scoring), and FC-C (soften
the Chothia claim to match the paper). FC-B needs a one-line provenance fix (1.7% is primary and
supports the doc). The six minors are quick wording/consistency fixes. The product's empathy design,
no-blame culture, honest measurement scoping, out-of-scope real-staff OSINT, and later-staged
productisation are all in good shape.
