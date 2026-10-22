# Docs gaps: M11 reuse proof

This scenario is built only from README_scenario_design.md, README_ink_best_practices.md and `designs/00_data_contract.md`. It must not draw on the lab, the slice or the other SE design docs. Each gap below gives its README section, what was needed, what was guessed, and whether the code had to be read.

## Found on the first reading (run 1, stopped before building)

1. **Major: `room_it` has no map file** (general, Available Room Types). It is listed, but nothing in `assets/rooms/` matches it. Found by checking the files.
2. **Major: the SE sections lean on `00`** (both SE sections). They refer to `00` (§2 channel tells, §10a mail) for details instead of covering them.
3. **Major: no minimal `mailClient` example** (attack mechanics, mail client). The only working example named is the lab. There is no small complete `mailClient` showing how an account, its mailbox and a `mail_terminal`'s `accountIds` fit together.
4. **Unclear: "data-only phishing target" is not defined** (attack mechanics, phishing targets). Does it need a `social.characters` entry with an `emailRecord` story, or are `replies.landed` and `outcome.setGlobal` enough? Which `factorStrings` are required?
5. **Unclear: who can sit on the intel board** (general, intel board). `intelBoard.people` must be `phishTargets` ids, so with one target a second person appears only in the contacts strip, and only once a held fact names them. This is a reading, not confirmed.
6. **Minor: two influence tags, no rule for using both** (ink README against Influence). The ink README pairs every `influence +=` with `#influence_increased`. The SE section uses `#influence_gained[:N]`, which moves the value itself. Neither says what happens if both are used on a social character, so the value could be counted twice.
7. **Minor: no worked pip-only example** (Influence). A pip-only display needs `bar: false` and `number: false`, and the pip shows only after influence has moved from `start`. Both facts are there, but in different places.
8. **Minor: triage prefix unclear** (triage). The example `triage_{stage}_` doesn't match a task keyed on `triage_pass`. Which prefix is the default?
9. **Minor: what a new scenario folder needs** (README general). It never says what makes a folder playable (`mission.json` and its fields), or how `new-game.rb` finds it.
10. **Unclear: harness Node path** (harness, R7). R7 gives no path for Node 24. The answer is `~/.cache/ms-playwright-go/1.57.0/node`.

## Found while building (run 2 — scenario built, validated `--strict-social` exit 0, one headless playthrough completed)

The scenario in this folder was authored from the three docs, then validated and played
through once with the harness (fresh game 3241: check-bridge 9/9 PASS; verify-run 3 tasks
completed, score 100, all nine globals set). The build hit these further gaps. Where "code read"
is yes, the three docs alone were not enough to make the mechanic work and engine source had to
be read.

11. **Major: `pretextRelevant` is described wrongly** (attack mechanics, phishing targets). The
    factor table says it passes when "the pretext matches a topic in `interests.topics`". In
    `systems/phish-rules.js` (`judgePretext`) it actually counts how many of `primedFor.distinctiveValues`
    the pretext's chosen/implied values hit, against `minDistinct`. `interests.topics` only drives the
    separate *open* gate (`evaluateMessage`, "the open check"). A target that requires `pretextRelevant`
    with no `distinctiveValues` can never land. Found by reading the code to get a phish to land.
12. **Major: `factorStrings.attachmentPlausible.fail` must be a string, not a nested object** (attack
    mechanics, `factorStrings`). The doc says `attachmentPlausible` "nests `missing` and `wrong-type`",
    but the schema rejects an object there (`fail of type object did not match string`) and the lint
    also reports an empty nested `fail`. The working shape is a single `fail` string. Doc versus schema
    contradiction; found by the validator.
13. **Minor: `primedFor.minDistinct` has a schema minimum of 1** (attack mechanics, `primedFor`). The
    prose ("how many distinctive values are needed") reads as allowing 0, but the schema fails
    `minDistinct: 0`. A permissive data-only target cannot ask for zero distinctive values. Found by the
    validator.
14. **Minor: `mailClient.mailboxes[].owner` must be a `people` id** (attack mechanics, mail client). The
    field table gives `{ id, owner? }` with no constraint, but `validate_social/mail.rb` errors when
    `owner` is anything other than a `social.people` id (an account id fails). Dropping `owner`
    satisfies the lint. Found by the validator.
15. **Minor: a `pages[].path` is host-linted and rejects a normal path** (general, OSINT browser). The
    doc says `path` "is appended to the site's url in the address bar". A value like `/careers` fails
    the host lint (`host '' does not end .example`), so the documented use of `path` does not pass
    `--strict-social`. The page works with no `path`. Found by the validator.
16. **Minor: a single-room scenario still needs `connections`** (general, room connections). The schema
    requires `connections` on every room; the docs never say a lone start room needs `"connections": {}`.
    Found by the schema step.
17. **Resolves gap 4 (data-only target):** a data-only phishing target needs only `replies.landed` and
    `outcome.setGlobal`, plus the `factorStrings` the lint requires. No `social.characters` entry and no
    `emailRecord` are needed — `mail-bridge.js` schedules a text job that sets the first `outcome.setGlobal`
    key and delivers `replies.landed` once the mail opens and lands. Confirmed by reading the code and by
    the playthrough. `factorStrings` must supply a non-empty `pass`/`fail` for each factor and an `open`
    entry.
18. **Minor (general, not social): `spriteTalk` is not derived from a `_v2` sheet name.** An NPC whose
    `spriteSheet` is `female_office_worker_v2` derives the talk path `female_office_worker_v2_talk.png`,
    which does not exist, even though `female_office_worker_talk.png` does. `spriteTalk` (and
    `spriteVisemes`) must be set explicitly. Found by the validator warning.
19. **Confirms gap 9 (what a scenario folder needs):** a folder needs `scenario.json.erb` plus a `Mission`
    DB row (`db/seeds.rb` scans `scenarios/*`, skips any with no `scenario.json.erb`, and keys on the folder
    name); `tools/playtest/new-game.rb` resolves `<mission>` by `BreakEscape::Mission.name`. `mission.json`
    is optional metadata. None of this is in the three docs. Confirmed by reading `db/seeds.rb` and
    `new-game.rb`.
