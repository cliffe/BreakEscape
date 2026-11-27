# Dialogue tighten, ca11–ca20 full episodes

Branch: `feat/ca-dialogue-tighten`. Scope: full-episode hand-authored ink only
(`scenarios/ca11_*` … `scenarios/ca20_*`, not `_defend`, not `ca_pre_/ca_post_/ca_annual_`).
ca17 has no full episode (defend-only), so it is out of scope.

Each edited ink was recompiled with the repo's `bin/inklecate` via `scripts/compile-ink.sh`
and the compiled `.json` is staged alongside. A second recompile produced no further diff
(staleness invariant holds). Spoken lines only; no choice labels, knots, vars, tags, diverts
or logic touched. These lines have cached TTS; audio was not generated or deleted.

## Changed spoken lines

Line numbers are from the edited file after the change.

### ca12_visitor_tailgater (delphine_reception.ink)
- **L80, Delphine Arvanitis** (band-1 refusal, named_recipient)
  - old: `Let's slow down a moment. I'd like to check that against today's list first.`
  - new: `Hold on a moment. I'd like to check that against today's list first.`
  - reason: the opener "Let's slow down a moment." is verbatim in both band-1 branches (L80, L82) and can fire twice in one call (B40); varied the opener.

### ca13_ai_assistant (gwen_pritchard.ink)
- **L91, Gwen Pritchard** (reveal)
  - old: `Same face, same voice, on our own meeting tool. None of that proved who was asking.`
  - new: `And that was on our own meeting tool. None of it proved who was asking.`
  - reason: "copy of my face and voice / same face same voice" is stated three times in one demo run (L58, L85, L91, B48); dropped the third restatement, kept the "even an internal tool doesn't prove identity" point.
- **L92, Gwen Pritchard** (reveal)
  - old: `When a call wants a code, money or data, pause. End it, ring back on a number you already hold, or ask someone. Then report it.`
  - new: `When a call wants a code, money or data, end it. Ring back on a number you already hold, or ask someone, then report it.`
  - reason: four stacked instructions (B52); merged the redundant "pause. End it" and smoothed. All actions kept (end call, call back, ask, report).

### ca14_social_media (julian_sallow.ink)
- **L26, Julian Sallow** (done)
  - old: `The fix is a setting and a pause, not shame. Nobody's in trouble for having posted them.`
  - new: `The fix is a setting and a pause. Nobody's in trouble for what they've posted.`
  - reason: removed the "not shame" negative parallelism (B57); kept the no-blame point and the setting+pause fix.

### ca15_shadow_it (nilesh_solanki.ink)
- **L28–29, Nilesh Solanki** (done)
  - old: `That's the lot. If the official way's slow, tell us, don't build your own way round.` / `We can't mend what we don't know about. And nobody's in trouble for a workaround.`
  - new: `That's the lot. If the official way's slow, tell us rather than building your own way round.` / `Nobody's in trouble for a workaround.`
  - reason: "We can't mend what we don't know about." is verbatim in the done state (L29) and the welcome (L32), both seen in one play (B62); kept it in the welcome only, kept the no-blame line.

### ca16_insider_risk (anjali_rao.ink)
- **L35, Anjali Rao** (done)
  - old: `That's them handled. Your login is you, offers get reported, and an honest concern that turns out to be nothing is never a failure.`
  - new: `That's them handled. Your login is you, offers get reported, and a concern that comes to nothing is never a failure.`
  - reason: tightened the wordy "an honest concern that turns out to be nothing" (B65); three teaching points kept.
- **L39, Anjali Rao** (welcome)
  - old: `Keep your login yours, tell me what gets offered to you, and if something genuinely gives you pause, bring me the facts, not a theory.`
  - new: `Keep your login yours, tell me what gets offered to you, and if something gives you pause, bring me the facts rather than a theory.`
  - reason: dropped "genuinely" and softened the "facts, not a theory" parallelism (B68); all three asks kept.
- **L40, Anjali Rao** (welcome)
  - old: `Start at the kiosk: make this week's calls first, then raise a concern and sort the messages. You are not being asked to investigate anyone.`
  - new: `Start at the kiosk: make this week's calls first, then raise a concern and sort the messages.`
  - reason: the no-suspicion reassurance is already in the same welcome at L38 ("You're not here to catch anyone.", the canon tone line per E16 §18); dropped the duplicate at L40 (B67).

### ca18_credential_attacks_at_scale (ama_owusu.ink)
- **L29, Ama Owusu** (done)
  - old: `That's both sides done. A different password for every account, not a word off the website, kept in a manager, is what breaks the spray.`
  - new: `That's both sides done. What breaks the spray is a different password for every account, none off the website, kept in a manager.`
  - reason: smoothed the stacked mid-sentence qualifiers (B73); same three facts (unique per account, not a website word, in a manager).

### ca19_malware_and_updates (anjali_rao.ink)
- **L40, Anjali Rao** (welcome)
  - old: `Anjali Rao, information security. I'm the one who gets the call when something looks wrong, so I would rather you called me about nothing than not called about something.`
  - new: `Anjali Rao, information security. I'm the one who gets the call when something looks wrong, and I'd always rather hear about nothing than miss something.`
  - reason: untangled the convoluted "called ... than not called" double-negative (B79); same "report freely" sentiment.

### ca20_remote_and_mobile_working (zainab_hussain.ink)
- **L40, Zainab Hussain** (done)
  - old: `A Wi-Fi page wanting your work password is always a fake, and when you're not sure, use your phone's hotspot.`
  - new: `A Wi-Fi page asking for your work password is always a fake. When you're not sure, use your phone's hotspot.`
  - reason: split the compound rule into two cleaner sentences (B81); both teaching points kept.

## Counts

- Edits: 11 spoken lines across 7 files.
- Per episode: ca11 0, ca12 1 (delphine), ca13 2, ca14 1, ca15 1, ca16 3, ca18 1, ca19 1, ca20 1.
- Scan findings for ca11–ca20 full episodes considered: B35, B36 (ca11); B38–B43 (ca12 full, delphine + lorna); B46–B52 (ca13 full); B57–B59 (ca14 full); B62 (ca15 full); B65–B68 (ca16 full); B73–B76 (ca18 full); B78, B79 (ca19 full); B81–B84 (ca20 full). Defend-twin findings (B37, B44–B45, B53–B56, B60–B61, B63–B64, B69, B77, B80, B85–B86) are out of scope.
- Accepted (acted on): B40, B48, B52, B57, B62, B65, B67, B68, B73, B79, B81 = 11.
- Rejected / left: B35, B36, B38, B39, B41, B42, B43, B46, B47, B49, B50, B51, B58, B59, B66, B74, B75, B76, B78, B82, B83, B84 = 22. See below.

## Scan findings rejected

- **B35 (ca11 L34, reassurance)** and **B36 (ca11 L36, name intro)**: left ca11 untouched. "Name, role." intros are the house style across hosts (Nilesh, Anjali, Ama all do it), and the no-blame reporting line is a genuine culture teaching point already concise. Neither change was worth a TTS re-voice.
- **B38, B39 (ca12 delphine, "today's list" / "who it's for" across branches)**: these fire in separate refusal moments (band-1 say vs ask result 2 vs ask result 0). A wary receptionist restating her check when pushed is natural and reinforces the lesson; varying them risked sounding odd. Left.
- **B41, B42, B43 (ca12 lorna)**: done vs nudge rule restatement is the welcome/done hub pattern used in every episode, and the two states differ in wording already; "Nothing here leaves the game." is the safe-exercise reassurance convention. Left.
- **B46 (ca13 L45–46)**: the done-state callback rule + "nobody's ever in trouble for checking" is concise and the core lesson. Left.
- **B47 (ca13 L49/L53)**: "use it for real" across nudge/welcome is the structural welcome/nudge pattern. Left.
- **B49 (ca13 L59, "nothing is scored")**: reassurance for the optional unscored demo; tells the player it is pressure-free. Left.
- **B50 (ca13)**: the callback rule recurring across the done hub and the optional demo reveal is acceptable; the demo is a distinct deepfake debrief. The one genuinely wordy instance (L92) was tightened instead.
- **B51 (ca13 L94, "You don't need to spot a deepfake. You need to check another way.")**: this contrast is the episode thesis and a strong, memorable closing line, not padding. The brief bans me writing new "not X, it's Y" lines; it does not require destroying a good existing one. Left.
- **B58 (ca14 L30/L33), B62-partial**: "close the gaps on X's profile and yours" across nudge/welcome is the structural pattern. Left.
- **B59 (ca14 L32), B83/B84 (ca20), B76 (ca18)**: "everyone is fictional / nothing is a real password" are the safe-exercise reassurance convention used consistently; they reassure the learner rather than teach, and read fine in context. Left.
- **B66 (ca16 L36)**: "Nobody's in trouble for being approached, and nobody's a suspect for having a hard week." is the no-blame/no-suspicion tone the brief (E16 §18) calls for; concise. Left.
- **B74 (ca18 L30)**: four defensive controls (lockout, MFA, block common words, breach-list watch) are each distinct organisation-slot teaching points; cutting any drops content. Left as a voiceable list.
- **B75 (ca18 L34/L40)**: the spray mechanism in the landed-branch vs welcome are different hub states. Left.
- **B78 (ca19 L38)**: the no-blame reporting line appears once in this file (the cross-episode echo with ca11 is not seen in one play). Left.
- **B82 (ca20 L45)**: the four-risk fragment list is an effective, rhythmic, atmospheric line, voiceable; not padding. Left.

## Checks

- Ink recompiled for all 8 edited scenarios via `scripts/compile-ink.sh <scenario>`; 0 failures. (delphine's pre-existing `-> END` warning is unrelated to the edit.)
- `ruby scripts/validate_scenario.rb scenarios/<shell>/scenario.json.erb --strict-social --no-graph` on all 8 touched shells: 0 errors each (ca12 has 1 pre-existing desk-box info warning, not dialogue).
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 2720/2721 pass. The one failure (`social-mail-ink-runner.test.mjs`) is a flaky cross-test "Unable to deserialize cloned data" worker-thread resource leak; it passes 23/23 in isolation and does not touch ca11–ca20 full-episode ink.
- Ink staleness: the Rails-based `ink_compiled_staleness_test.rb` cannot boot in this worktree (bundler GemNotFound for ruby 2.7.8). Verified the invariant directly: a second deterministic recompile produced no diff beyond the 8 edited files, so compiled JSON matches ink.
