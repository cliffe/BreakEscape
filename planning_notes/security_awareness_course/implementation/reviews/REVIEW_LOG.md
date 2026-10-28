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
