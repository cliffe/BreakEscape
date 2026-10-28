# Review log: implementation briefs

There are up to five review-improve rounds. Each round runs three reviewers, and each reviewer writes `Rn_<lens>.md` in this folder:

- **engine:** `00`, `01`, `02` against the code.
- **content:** the episodes, `10`, `11`, `12` and `13` against the built content and each other.
- **sonnet:** a dry run as a fresh Sonnet implementer.

After the reviewers, fixers update the briefs. A round closes when the fixers have answered every B and M finding. We stop early when a round reports no B or M findings.

Read `../WRITER_BRIEF.md` for the rules and the severity scale.

## Known cross-document issues to verify in round 1

These were seen by the orchestrator while the briefs were being written. Confirm each one, then report it with a fix.

1. **Flip config names.** E08 proposes `flip.becomeVictim`, but ENG-01 defines `flipAftermath`. ENG-01 wins, so E08 must use its name.
2. **Stage ids.** ENG-04 uses `mistake`; the packet index once said `sandbox`. ENG-05a is a `world` modifier on `write`, not a stage. ENG-06's assistant runs in the flip region, not as an `assistant` stage. Check that every episode spec and `00` agree.
3. **ENG-02 and ENG-09a.** ENG-02 is attack-half only, so E9's defend-only variant needs ENG-09a, not ENG-02. E9 §7 and §13 must change.
4. **ENG-03a.** The three-way browser verdict is a `verdictLabels` change, not a new verdict. E10 §11 must change.
5. **ENG-11 `sortDrill`.** It replaces the bespoke drills in E14, E15 and E17. ENG-12 covers E16's fact-chip report and ENG-13 covers E14's privacy panel. Check that the specs reference these packets.
6. **Check forms disagree.** `10_CHECK_FORMS.md` recommends two new pairs, `general_v2` and `data_conduct`. The E11 and E14 to E17 specs instead name per-topic forms (data, social, shadowit, insider, aup), and E9 and E10 say their cards may need their own form. Settle on one scheme, recommended `10`'s two pairs unless a reviewer finds a reason against, and align all the specs.
7. **Seeded courses.** `10` says the check forms join neither seeded course. Check that this agrees with `00`, `01` and FUN_DECISIONS q_aw7.
8. **E17.** `00` says one defend-only shell joins both courses. The E17 spec ships two identical shells, a full one and a defend-only one. Pick one and align `00`, `01` and E17.
9. **Host names.** E11's host is Tomasz Wiśniewski and E14's is Tomás Carvalho, a near-collision. Also check Oskar Berglund against Dani Fenwick in E14, and every new name against BRAND_SET and the scenarios.
10. **E12 and E13 stage lists.** Check that they fit the stage-order lint after the ENG-08 relaxation.
11. **Dashes.** `02` has 4 em or en dashes; E11, E14, E15, E16 and E17 have 1 or 2 each. Remove them unless they are inside quoted code or existing strings.
12. **E10's colleague.** Leila Nassar is E3's phone NPC. Check that reusing her as E10's IT colleague does not confuse learners who play both.
13. **WP-12 core_00.** It needs a validator variant `"brief"` (ENG-10). Check that `11` points at ENG-10.

## Round 1 results

| Review | B | M | m | t | Verdict |
|---|---|---|---|---|---|
| R1_engine | 1 | 5 | 5 | 3 | not clean |
| R1_content | 2 | 7 | 7 | 2 | not clean |
| R1_sonnet | 2 | 13 | 13 | 3 | not clean |

## Round 1 rulings (orchestrator; fixers apply these, do not reopen)

1. **Check forms.** We adopt `10_CHECK_FORMS.md`'s two new pairs, `general_v2` and `data_conduct`, and drop every per-topic form named in the episode specs. The trade-off to report to the user is that there is no per-topic pre and post figure. Any tell that a check-form item scores must be in the shared library, `CHANNEL_TELLS` in both `phish-rules.js` and `triage.rb` (ENG-08). So `10`'s "existing ids only, no engine packet" changes to "existing ids, or ids that ENG-08 adds to the shared library". E8's reset and sent-item items go into `general_v2` only if they fit its balance. Otherwise they stay as defend-set items only.
2. **E17.** It ships one defend-only shell, listed in both seeded courses, at Tarrowby Logistics with host Nilesh Solanki. `00`, `01` and E17 must all say this.
3. **E8 flip.** We use ENG-01's `flipAftermath` and `stepLabels`, with the signs authored inline. Where E8 needs an intro line or the victim's name, ENG-01 adds optional fields inside `flipAftermath`, such as `intro` (already present) and `victimName`. They do not go in `strings`. A sign may also appear as a defend item, with different ids and an inline copy.
4. **Verdicts and card kinds.** Use only the built verdicts: Trust, Report, Delete and Verify. ENG-03a's `verdictLabels` may relabel them; no new verdict ids. Use only the built card kinds, plus `choice`, and `person` if a spec needs it. An "email in Sent" is an ordinary `email` card from the victim's own address with a clear subject line. The reason text must agree with how the `awareness` profile actually scores, for example where Trust and Report score the same on a genuine item.
5. **Consequence flip validation.** ENG-04 or ENG-08 must relax `awareness.rb` `attack_checks` (line 53) so that a full episode with `mistake` and no `attack` block validates.
6. **E11 room.** "Reuse an existing map" means no new layout. Carrholme gets its branding through P5b's existing scripts: tileset, props, logo, accent and lighting. P5b and E11 must say the same.
7. **Host name clash.** E14's host Tomás Carvalho is renamed to a name that clashes with nothing (check it), so that E11 keeps Tomasz Wiśniewski.
8. **Seeding instructions.** These live in one place, `01` P12, at feature level. Episode specs point to P12 and do not use `awareness_deploy.py`, which only holds the rule of thumb.
9. **`reopencheck` baseline.** On an untouched tree it fails with 4 known problems in `m09_digital_archaeology`. `00` §8 records that as the baseline. A commit must not add new problems.
10. **Generator `REPO`.** P4's generator takes `REPO` from an environment variable or argument, with the repo default and a scratch override, so that P0's scratch regeneration works. `01` gives one consistent procedure.
