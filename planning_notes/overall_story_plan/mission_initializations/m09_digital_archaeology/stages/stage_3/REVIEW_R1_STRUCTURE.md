# m09 stage 3, review round 1: structure, state and consistency

## Scope and method

Reviewer: fresh Opus, read-only, 2026-10-21. Lens: structure, state and consistency. Document under review: `moral_choices.md` ("MC"), first draft.

Read: `docs/agents/FINALE_BRIEF.md`; `.claude/skills/mission-puzzle-chains/SKILL.md`; `docs/agents/CARRY_OVER_PLAN.md` §2.6–2.7 and "Built"; `finale/FINALE_ARC.md` ("FA") §3, §6, §13, §15; m09 `stage_1/story_arc.md` ("SA", all of §3–§13); m09 `stage_2/storytelling_elements.md` (by grep); m10 `stage_1/story_arc.md` (every `m09_` read); m10 `stage_2/storytelling_elements.md` and the untracked m10 `stage_3/moral_choices.md` ("m10 MC") where they take up m09's proposals. Shipped facts checked in `scenarios/m04_critical_failure/ink/m04_closing_debrief.ink`, `scenarios/m05_insider_trading/ink/m05_phone_recruiter.ink`, `scenarios/m08_the_mole/ink/m08_closing_debrief.ink` and `scenarios/m08_the_mole/scenario.json.erb`, `scenarios/m01_first_contact` (final_choice values), the universe bible's `insider_threat_initiative.md`, and the engine under `public/break_escape/js/` for a few plausibility checks. No VM material opened.

Orchestrator rulings taken as given: the Recruiter's price is the whole deck; `cage_bin` and `legacy_files_saved` are exported (eleven m09 exports); `m09_deck_pulled` is Tier 1 in m10.

## Summary

The structure holds. Every forced choice the document calls forced is held by a lock or a condition that stage 1 §11 already has, plus one new one (the notice at the debrief) that the spine can carry. No choice and no import gates `concludeRequires` or the critical path. The Recruiter rework under the new price is clean: four routes, none dominated, each with an in-m09 cost.

The problems are at the edges, where stage 3 adds new state and new canon:

- The legacy placement files have no clean set point, a shred trigger tied to a player action that can happen late, and a content definition that collides with WREN (a legacy entry) and with m08's "others in this service".
- Two pieces of new or restated canon contradict shipped missions: the m05 deal was never money, and m04 patched (or published) the Albion holes on every branch, which the Critical Mass watch needs to be still open.
- The Alpha tapes' m10 payoff, as written, takes Tesseract's refusal of WREN (his motive, from his own mouth) away from exactly the player who earned the payoff, and changes what `sleeper_caught` means.
- The export count and tiers are now out of step across this document, FA §15 and m10's stage 3.
- The debrief section contradicts the per-choice debrief lines given in §3–§4.

Counts: 0 blockers, 7 majors, 12 minors.

## Findings

Line numbers: MC is `moral_choices.md`; SA is m09 `stage_1/story_arc.md`; FA is `finale/FINALE_ARC.md`; m10 MC is m10 `stage_3/moral_choices.md`.

### S3-01 (major): the legacy placement files collide with WREN and with m08's line

- **Location:** MC:259–261 (§4.2), MC:307 (§4.3), MC:564 (change 7).
- **Evidence:** MC:261: "These files are the people behind the ledger's legacy codenames, in other agencies and companies, not SAFETYNET: the answer to m08's 'there may be others'." WREN is a legacy entry: SE:457, "WREN. Legacy (H&L). Placed eleven years."; SA:167, "One legacy entry, under the codename WREN". m08's line is about SAFETYNET: `m08_closing_debrief.ink:206`, "There may be others in this service, recruited the same way and still waiting."
- **Problem:** two contradictions. (1) If the files are "the people behind the ledger's legacy codenames", WREN's file is on the trolley, and every warned-in-time player gets it without a choice (MC:265), which names Kowalczyk and empties both the Recruiter's offer and m10's whodunit. The words "not SAFETYNET" exclude her, but nothing in the story says why a trolley of legacy placements would leave out the SAFETYNET ones, and "where is WREN's file?" is the first thing a player holding it will ask. (2) Files about people outside SAFETYNET cannot be "the answer to" a line about people inside it.
- **Fix:** give the gap a reason the player sees, in one line: the SAFETYNET placements' files went to the Recruiter's tape when the Architect took WREN's tasking (her file is "her network, all of it", MC:107), so the trolley holds only the outside placements. HaX, on reading them: "Nobody of ours in here. Ours are on her tape." That also makes the deck choice and the trolley read against each other. Drop "the answer to m08's 'there may be others'"; if a link to m08 is wanted, say these are the same method used outside the service.

### S3-02 (major): the m05 deal was never money

- **Location:** MC:147, MC:151 (§3.3), MC:444; SA:187 and SA:600 carry the same wording.
- **Evidence:** MC:151: "[She's right. I took her money in the spring.]"; MC:147: "the player sold her the forty-seven names in m05". Shipped m05: the Recruiter's terms are "Leave it out of your report. Let my courier have it. In return, nothing in this operation points at you." (`m05_phone_recruiter.ink:181–185`), and the taken branch is "[Fine. The envelope goes to Reading. I never saw it.]" (`:221`) with "You get your clean report, and I get my quiet." (`:235`). No money changes hands. The m05 objective line is "OFFER TAKEN — forty-seven names left in her pipeline" (`m05 scenario.json.erb:224`).
- **Problem:** the own-it button has the player confess to a bribe they never took. It is the one line on this branch that must be exactly true, because it is said on an open line with HaX listening and m10 builds on it.
- **Fix:** "[She's right. I let her have the list in the spring.]" (or "...I let her courier have the forty-seven."). Change "sold her the forty-seven names" to "let the forty-seven go to her courier" in MC:147 and MC:444. Apply the same to SA:187 under change 11.

### S3-03 (major): the Critical Mass watch needs a hole that m04 closed or published

- **Location:** MC:25 (change 5), MC:201–216 (§3.5), MC:561 (change 4), MC:578 (change 18).
- **Evidence:** MC:203: "Analysis still runs a watch through that hole. It's how we've followed Voltage's people since Albion." MC:205: "Send it and the vendor patches, and the watch goes dark. And Albion's inquiry gets to ask when we knew." Shipped m04, on every branch: full, "Full transparency. The attack, the holes it came through, ENTROPY. All of it." with "every other storage site gets audited" (`m04_closing_debrief.ink:470`, `:489`); quiet, "Albion patches the holes quietly." (`:504`); partial, "An incident, acknowledged. No detail." (`:543`).
- **Problem:** (1) On `full`, the holes went public weeks ago and every site was audited, so the vendor should already know and the hole should be closing; on every branch Albion patched its own site. The watch and the "vendor patches" cost need the flaw to be still open somewhere. (2) On `quiet` (and `partial` without `crew_lost`) there is no public inquiry to "ask when we knew"; the m04 quiet branch is a classified maintenance fault.
- **Fix:** state the distinction once, in HaX's line: Albion fixed its own site, but the flaw is in the vendor's equipment, and the vendor was never told what SAFETYNET's catalogue entry says, so every other site running it is still open; the watch is on those sites. On `full` add a half-line ("You told them how they got in. Nobody told the vendor why the door was there."). Make the second cost conditional: "Albion's inquiry gets to ask when we knew" on `full` or `crew_lost`; otherwise "and somebody asks why we sat on it for nine years". The same two variants go into Netherton's debrief question (MC:211) and m10's "Elsewhere" clause (change 6).

### S3-04 (major): the Alpha tapes' warning costs the payoff player Tesseract's motive line, and changes `sleeper_caught`

- **Location:** MC:23 (change 3), MC:130, MC:505 (item 25), MC:562 (change 5), MC:596 (change 26).
- **Evidence:** MC:505: "Quintero comes in from the lock early and takes WREN at the door unhurt (`sleeper_caught` true, no wound)." FA:605: "Tesseract refuses her: 'Not you, Halina. ... It has to be one of theirs.' The player hears his motive from his own mouth." FA:485: `sleeper_caught` is "true on a right accusation ... false if never named, including a knocked-out Kowalczyk nobody accused." m10 MC:628: `sleeper_caught` set by "a right accusation, face to face or on the line" only. m10 MC:371 has already taken the warning up ("takes WREN at the door").
- **Problem:** (1) If Quintero takes WREN at the door, she never reaches the key and Tesseract never refuses her, so the refusing, tape-saving player, the one this payoff rewards, loses the scene where he says why he needs 0x00's hand. That is the core's best line for the third claim. (2) Setting `sleeper_caught` true without an accusation changes an m10 export's meaning and contradicts FA:485 and m10 MC:628; the epilogue and credits read it. (3) No case for "no Quintero" (held, wrongly accused and not recalled, or sent back): the warning has nobody to warn.
- **Fix:** keep the beat and change only the wound. WREN comes through and reaches for the key; Tesseract refuses her as now; Quintero, warned, is already moving and takes her before she touches it, unhurt. `sleeper_caught` keeps its m10 meaning (false here); add a separate m10 local if the credits need "taken at the core". With no Quintero, HaX's warning goes to the player, who gets the "[Stop her.]" beat a second earlier; nothing else changes. Leave the final form to the m10 author, but MC should not specify `sleeper_caught`.

### S3-05 (major): `legacy_files_saved` has no clean set point, and the shred trigger can fire late

- **Location:** MC:259, MC:265, MC:283, MC:299, MC:307, MC:531, MC:602 (change 30).
- **Evidence:** MC:265: warned in time, "`legacy_files_saved` is true without a choice." MC:283: Sorensen "reaches them when the player opens the plan chest at the back of the cage, the next thing on the critical path." SA:266: the identity scene "fires on flag 3 alone. If Nightshade's file is not held, HaX holds the name back", so the chest can be opened as late as flag 3. MC:602: the trolley "moves to the cage on `cage_opened` unless `noor_told`".
- **Problem:** (1) "True without a choice" has no event. If it is set in Noor's conversation, a warned-in-time player who sneaks past her never gets it; if it is set at load from an import, that is allowed (it writes an m09 global, not an import) but it has to be written down. (2) Tying the shred to opening the chest means Sorensen leaves the files untouched for as long as the player stays away from the chest: a player can open the cage, walk out, do flag 2, the call and the office, come back, knock her down and save them. That reads as Sorensen waiting for the player. (3) The chest-opening event needs an engine hook: `item_picked_up` emits the item TYPE, not its id (skill Step 1), so keying on Nightshade's file needs a unique type or an `onPickup`/`onInteract` `setVariable`.
- **Fix:** one rule, in the state table and change 30:
  - at `cage_opened`: `legacy_files_saved = true` if warned in time or `noor_told`; otherwise the trolley is in the cage, at risk;
  - the files are shredded at the **earlier** of the chest opening (Nightshade's file picked up, by its own type or a `setVariable` on pickup) and the player first leaving the opened cage; until then, a knock-out on Sorensen sets `legacy_files_saved = true`.
  
  The leaving-the-cage half closes the walk-away window and is the same event the Recruiter's call already waits on. Talking her down still never saves them, because its lever is the file in the chest.

### S3-06 (major): exports and tiers disagree across MC, FA §15 and m10's stage 3

- **Location:** MC:517, MC:533, MC:559 (change 2), MC:594 (change 25).
- **Evidence:** MC:533: `cage_bin` "Tier 1 (the arrested-branch help is an H) if the m10 author takes it, else Tier 2"; "m10's imports from m09 become eleven plus `m09_completed`". m10 MC:764 (P21) takes the arrested-branch help, yet m10 MC:685 and P8 (m10 MC:746) put `m09_cage_bin` in Tier 2 and say "m09 exports ten". m10 MC has no `legacy_files_saved` (grep: no "legacy"). FA §15 "Conflicts settled": "`m09_deck_pulled`'s tier ... Put in m10's Tier 2 ... Arc-keeper's call." The orchestrator has now ruled Tier 1.
- **Problem:** three documents, three counts. Under MC's own rule, `cage_bin` is Tier 1 once m10 takes the help. `legacy_files_saved` has no reader in m10 yet, so the eleventh export is unread there. FA §15's tier note is superseded but still stands in the text the arc-keeper will apply.
- **Fix:** change 2 should state one end state: eleven exports; Tier 1 gains `m09_deck_pulled` (orchestrator) and `m09_cage_bin` if the arrested-branch help stays (see S3-13 and the scope section, which recommend dropping it, leaving `cage_bin` Tier 2); Tier 2 gains `m09_legacy_files_saved`; m10's totals follow (66 + 1 = 67 if `legacy_files_saved` is added to m10's 66). Add to change 28 that m10 must take up `legacy_files_saved`'s "Elsewhere" clause, and add FA §15's tier note to change 10's list of statuses to revise.

### S3-07 (major): §8 contradicts the debrief lines given in §3–§4

- **Location:** MC:473 (§8 "The archive"), against MC:75–77 (the bins' debrief column), MC:272–273 (Noor), MC:299–301 (Sorensen), MC:317–319 (Tran), MC:331 (Old Coyote).
- **Evidence:** MC:473: "At most two lines, the first two that apply in this order: Sorensen knocked down; the legacy files saved ...; Noor told; Old Coyote knocked out; Tran. Lost files get no line. The bin and the tape are not repeated". Yet MC:75 gives "Derek's file is with Analysis, beside his statement." as the bin's debrief line; MC:300 gives the talked-down Sorensen "She even got the box numbers right."; MC:301 the left Sorensen "She finished the job."; MC:273 "Miss Haddad went home at the end of her shift"; MC:331 says talking past Old Coyote "leaves him a line in the debrief".
- **Problem:** stage 7 will write lines that §8 says never play, or §8's cap will be broken to fit them. The test "felt in m09, not only in the debrief" (MC:11) is met for every one of these in play, so the cap is right; the per-choice columns are what is wrong.
- **Fix:** keep §8's rule and priority list, add "Sorensen talked down" (her list is the better news, so above "knocked down") and decide whether "left" outcomes get anything (recommend not). Then mark the per-choice "Debrief" cells that §8 drops as "(not played; §8)" or delete them. The Recruiter route lines stay: they live in "The Recruiter." topic, not "The archive".

### S3-08 (minor): the Recruiter can't see which tape, then names it

- **Location:** MC:97, MC:101, MC:128.
- **Evidence:** MC:97: "I won't be watching which tape. I'll be watching the deck."; MC:101: "she can see that something was pulled, not which tape". MC:128, her double-cross text: "You took the name and the file."
- **Problem:** the text says she knows exactly which tape went. That breaks the rule the new price rests on.
- **Fix:** "You took the name and something off my deck. I said I'd know before your plane did. It hasn't left." She warns her people either way, which is why it's "about half".

### S3-09 (minor): the deck's value pairs and the resume across two speakers

- **Location:** MC:91, MC:118–119, MC:143 (value invariant); SA:180; FA §3.4 `recruiter_offer` row.
- **Evidence:** MC:91: the first line sets `recruiter_offer = "refused"`, `deck_pulled = "none"`. MC:143: "`refused` + `none` can only exist mid-call". After the answer the Recruiter hangs up and the tape choice is HaX's (MC:118–119).
- **Problem:** (1) `refused` + `none` is now an illegal end state that the defaults themselves write. It is safe only while `deck_choice_made` holds the office, and only if the resume works. (2) The resume crosses speakers: closed after the answer, the call must re-ring as **HaX** at the tape choice, not as the Recruiter. Stage 1's rule ("re-rings ... resumes at its last unanswered choice") assumes one conversation. (3) FA §3.4's value descriptions ("HaX pulled the Alpha tapes, or nothing") are stale under the new price.
- **Fix:** have every button write a complete legal pair, so no save point holds an illegal one: the first line `refused` + `alpha_tapes` (nothing in m09 reads `deck_pulled` before `deck_choice_made`); "yes" writes `taken` + `none` and `sleeper_named`; the tape choice overwrites. State the cross-speaker resume as a stage 5 engine check. Add the FA §3.4 rewrite to change 1 explicitly.

### S3-10 (minor): a knock-out after the talk-down overwrites `talked`

- **Location:** MC:297–301, MC:542.
- **Evidence:** talked down, she "sits at the hatch counter and writes" (MC:300): still present and knockable. `sorensen_fate` is one enum; a KO sets it through `globalVarOnKO` (`systems/npc-hostile.js`).
- **Problem:** talk, then knock out gives `ko`, and the debrief says "she has nothing left to write with" while her list lies on the counter.
- **Fix:** once `talked`, a knock-out leaves `sorensen_fate` alone (set her list object's `onPickup` or the talk itself to make her non-hostile, or check in the KO mapping), or add one debrief line for the pair. Pick one at stage 4.

### S3-11 (minor): "Sorensen still free" is undefined after a talk-down

- **Location:** SA:173 ("If Sorensen is still free, she shreds the binder once it has been read"); MC:300.
- **Problem:** a talked-down Sorensen has stopped shredding; the binder rule should not fire for her.
- **Fix:** define "free" as `sorensen_fate == "left"` in the state table.

### S3-12 (minor): renames and removed options are not listed as changes

- **Location:** MC:530, MC:543 against SA:357 (`cage_bin_saved`), SA:368 (`tran_stopped`), SA:367 and SA:331 (Sorensen "arrest", "she has asked for a lawyer and a pencil"), SA:368 (Tran "arrest").
- **Problem:** MC renames `cage_bin_saved` → `cage_bin` and `tran_stopped` → `tran_outcome`, and removes "arrest" as a separate option for Sorensen (an arrest no longer stops her) and for Tran, without saying so. Stage 4 will meet both names.
- **Fix:** add them to changes 13 and 20 (SA §8 rows 1, 11, 12; Beat 2.1 step 6; Beat 2.6; §7.1's "The archive" row).

### S3-13 (minor): Nightshade's copy: the m10 door line, the silent branch, and "letters"

- **Location:** MC:77, MC:244, MC:595 (change 25).
- **Evidence:** MC:77: "At the door, on every Nightshade branch, one line: 'You read what I cleared. Then you know I kept his letters.'" m10 has a silent-door branch where Nightshade says only "Manual." (FA §15, m10 change 23). MC:244 already gives the shown-file player "You found what I cleared, too. Then you know I kept his letters." MC:77's debrief line: "Nightshade's copy, read. He kept the letters."
- **Problem:** (1) "every branch" includes the silent door. (2) A triple-agent player who sent the file hears the same sentence twice, a mission apart. (3) "Letters" is the default other bin (the Social Fabric letters); on `m08_nightshade_tidied` the copy replaces that bin, and its own payoff talks about "his letters", which a player may read as the bin they didn't get.
- **Fix:** door line on the talking branches only (kept and arrested; not silent), and only where m09's text didn't already say it (`not m09_nightshade_shown_file`). Call his material something other than letters ("his notes", or "the Architect's mail"). The arrested-branch help is discussed under change 25.

### S3-14 (minor): the "Elsewhere" clauses duplicate Albion and misfile the spring

- **Location:** MC:563 (change 6), MC:597 (change 28).
- **Evidence:** m10 SA:449 already has an "Elsewhere" clause for "Albion's inquiry (`m04_disclosure_choice`, with `m04_crew_lost`)". "Elsewhere" is "for the people with nobody in m10 to carry them" (same line).
- **Problem:** `albion_notified` adds a second Albion-inquiry clause. `recruiter_secret == "told"` ("the spring, on file") is about the player, who is in m10, and the 06:00 walkabout already carries `kept`.
- **Fix:** fold `albion_notified` into the one Albion clause as a variant (and see S3-03 for the quiet branch). Put the spring in the player's own credits line ("In this operation") or drop it.

### S3-15 (minor): the new forced notice is not in SA §11, and Netherton's question isn't branched

- **Location:** MC:211, MC:224; SA:463–476 (the lock table).
- **Problem:** (1) The notice is now a forced choice held by the debrief spine, but SA §11's table and change 19 don't add it, so stage 4's checklist will miss it. (2) Netherton says "we lose the Critical Mass watch" on every branch, while HaX's archive line names what the watch follows by m04 branch (MC:203).
- **Fix:** add a row to SA §11 in change 19 ("the notice → the pen: the debrief asks it after the memo stance if unsent; the conclusion task is on the last line"). Give Netherton the same three variants as HaX, with S3-03's inquiry condition.

### S3-16 (minor): `notice_sent_in_archive` is redundant

- **Location:** MC:546.
- **Problem:** at the debrief's first line, `albion_notified` is true only if the player sent it in the archive (the debrief question comes later). An ink temp captured at the debrief's start gives the same answer without a declared global.
- **Fix:** drop the global; `~ temp sent_before = albion_notified` at the debrief's first line.

### S3-17 (minor): Noor's "show her the page" depends on placement that is still open

- **Location:** MC:268–272; SA:173; FA §13 item 31.
- **Problem:** "show" needs the printed ledger page. If stage 5 puts the ledger shelf inside the cage (still open in item 31), "show" always comes after the cage opens and never saves the legacy files, which is fine, but MC should say so, so that stage 5 knows the choice's value depends on it. Separately, a player who tells Noor at first meeting, before HaX's trolley line (after flag 1), saves the files without knowing; that is acceptable and should be stated as intended.
- **Fix:** one sentence in §4.2 for each.

### S3-18 (minor): where the Alpha tapes play

- **Location:** MC:496 ("at the tape room's station"); SA:260 ("On the Alpha-tapes branch, the tapes HaX pulled are on the drop terminal").
- **Fix:** pick one. The tape room's station is better for the scene and flags 3–4 already run there; change 17 should also reword SA:260.

### S3-19 (minor): "He reads her books" needs a basis in m09

- **Location:** MC:111 (HaX's private text).
- **Problem:** HaX tells the player Tesseract reads the Initiative's books before anything in m09 shows it. m10 explains it (m10 SA:330, the mirror since he took WREN's tasking), but in m09 it is an assertion that prices a choice.
- **Fix:** point at the evidence the player already has: WREN's day-10 entry, "assigned TF Null, Montana operation", is his tasking written into her ledger (SA:167). HaX: "He's writing in her ledger. He reads it."

## State table check

Every global in MC §10, checked for: a default; a value on every route before the conclusion; agreement with what m10 reads; no import in a gate. "Break" is the attempt to reach the credits with a bad value.

| Global | Set on every route? | Break attempts | m10 match | Result |
|---|---|---|---|---|
| `recruiter_offer` | yes: first line, then the answer and the tape choice; office waits on `deck_choice_made` | close after the answer (resume crosses to HaX, S3-09); reload mid-call (SA engine item 15) | values match FA §3.4; descriptions stale (S3-09) | ok with S3-09 |
| `deck_pulled` | yes, same | defaults write `refused` + `none`, an illegal end pair (S3-09) | m10 reads `alpha_tapes`; Tier 1 by ruling | ok with S3-09 |
| `sleeper_named` | yes (`false` unless she says it) | hang-up before the name: stays false, correct | match | ok |
| `sleeper_shortlist` | optional find, default false | none | match | ok |
| `recruiter_secret` | yes, first line by branch | hang up on sold-and-lied: `kept`, correct | match | ok |
| `hax_confession_answer` | yes: flag 4's read waits on it | close mid-scene: re-ring on leaving or on flag 4 (SA:266) | match | ok |
| `albion_notified` | yes: archive or debrief | close the debrief before the question (cutscene re-entry, engine list) | match | ok |
| `nightshade_shown_file` | default false; branch only | none | match | ok |
| `reading_finished` | optional, default false | none | match; "two things" variant reads `cage_bin` too | ok |
| `cage_bin` | yes: `cage_opened` writes `derek_file` if neither was taken | Victoria's route, walk past the bins: same default | m10 MC takes it, Tier 2 (S3-06) | ok |
| `legacy_files_saved` | no clean set point (S3-05) | warned in time and never meet Noor; walk away and come back to knock Sorensen down (S3-05) | m10 has no reader yet (S3-06) | **fix S3-05, S3-06** |
| `sorensen_fate` | default `left` | talk then KO (S3-10) | local | fix S3-10 |
| `tran_outcome` | default `left` | renamed from `tran_stopped` (S3-12) | local | ok |
| `noor_told` | default false | told after the cage: no files, as intended | local | ok |
| `old_coyote_told`, `old_coyote_ko` | default false | told then KO: he has left; KO then told: impossible | local | ok |
| `raid_team_answer`, `memo_stance`, `kowalczyk_reply`, `reading_told_hax`, `schedule_read` | defaults given; spine sets `memo_stance` and `kowalczyk_reply` | none | local | ok |
| `notice_sent_in_archive` | derivable | none | local | drop (S3-16) |

**No import gates completion.** Imports change who offers what (Noor held back, the Victoria route, the H opening, the bins' contents) and set m09 globals (`legacy_files_saved` from `m05_found_pipeline_list`), but none appears in `concludeRequires` or an `unlockCondition`, and none is written. MC §5's closing claim holds (`concludeRequires` is the four flags).

**Exports against m10.** Every value MC writes is one m10's stage 1–3 documents read, with three gaps: `legacy_files_saved` (no m10 reader), the `sleeper_caught` change (S3-04), and the clean-record wording still "a name for a file" in m10 SE:127 and m10 MC:333 (change 24 should name both).

## Forced and optional choices

| Choice | MC says | Held by (SA §11 or new) | Verdict |
|---|---|---|---|
| D cage bin | forced | event: `cage_opened` tips the other bin; default `derek_file` | holds |
| G Recruiter and deck | forced | call waits on flag 2 and `cage_opened`; office on `deck_choice_made`; re-ring | holds, with the cross-speaker resume (S3-09) |
| H own it or hang up | forced on its branch | the call's first choice | holds |
| K confession answer | forced | `identity_scene_done` → flag 4's read → Tesseract's call → conclusion | holds |
| L the notice | forced (new) | the debrief spine before the pen | holds; add to SA §11 (S3-15) |
| M memo stance, N hangar | forced | the debrief spine | holds |
| A raid team | optional | none; "say nothing" is a real default | optional, correct |
| B Noor, C Old Coyote, E Sorensen, I Tran, J Reading | optional | none | truly optional; none needed for any task or lock |
| F Nightshade's file | optional, asked once with two buttons | none; send stays open at the drop terminal | correct: asking turns "hold" into a decision without forcing it |

The one dependency worth noting: E's talk-down lever is Nightshade's file, which is on the critical path (SA:266), so every player has the lever once the chest is open. That keeps E optional but always available, which is right.

## The 35 proposed changes

Accept 20, modify 15, reject 0. "Modify" gives the change; none conflicts with m10's stage 1–2 documents or FINALE_ARC in a way the modification doesn't resolve.

| # | Verdict | Note |
|---|---|---|
| 1 | accept | Ruled. Also rewrite FA §3.4's `recruiter_offer` and `deck_pulled` descriptions, §6.1 item 3's "take + nothing / refuse + nothing" sentence, and §13 item 25's "'Pull nothing' already maps to `refused`" (S3-09). |
| 2 | modify | One end state (S3-06): eleven exports; Tier 1 + `deck_pulled` (ruled); `cage_bin` Tier 2 if the arrested-branch help is dropped (recommended); `legacy_files_saved` Tier 2; supersede FA §15's tier note; m10 count 67. |
| 3 | accept | Also name m10 SE:127 and m10 MC:333's "a name for a file" wording as stale. |
| 4 | accept | m10 MC §6.5 has already taken both up (P3, D16); mark m10 SA §13 item 5 ("survives ... unless taken in") stale. |
| 5 | modify | Keep the refusal line; Quintero stops WREN after it, unhurt; leave `sleeper_caught` to m10; no-Quintero case (S3-04). |
| 6 | modify | Merge the Albion clause into m10's existing one; move or drop the spring clause (S3-14). |
| 7 | modify | Add the WREN exclusion and its reason, and the new shred trigger (S3-01, S3-05). |
| 8 | accept | Name the set point (S3-05). |
| 9 | accept | Pending the user. |
| 10 | accept | Add FA §15's tier note. |
| 11 | modify | Own-it button text per S3-02; the double-cross text per S3-08; HaX's text per S3-19. |
| 12 | accept | |
| 13 | modify | List the removed "arrest" options and renames (S3-12); the KO-after-talk rule (S3-10). |
| 14 | accept | |
| 15 | accept | |
| 16 | accept | |
| 17 | modify | Also reword SA:260 (tapes "on the drop terminal") to the tape room's station (S3-18). |
| 18 | modify | The watch line per S3-03 (the vendor distinction, the `full` half-line, the conditional inquiry). |
| 19 | modify | Add the notice row to SA §11 (S3-15); Netherton's question by m04 branch. |
| 20 | modify | Include the renames `cage_bin_saved` → `cage_bin`, `tran_stopped` → `tran_outcome` (S3-12). |
| 21 | accept | |
| 22 | modify | Recruiter wording per S3-08; also SE's "her money" if present. |
| 23 | accept | |
| 24 | accept | |
| 25 | modify | Door line on talking branches only and not after the shown-file text (S3-13); drop the arrested-branch help (see scope). |
| 26 | modify | Per S3-04. The blast-door and database-choice lines: accept. |
| 27 | accept | |
| 28 | modify | Per change 6 and S3-14; add the `legacy_files_saved` clause to m10's list. |
| 29 | accept | Engine item 10 already covers object text on a global. |
| 30 | modify | Set points and trigger per S3-05; the trigger keyed on a unique item type or an `onPickup` `setVariable`, never an id. |
| 31 | accept | |
| 32 | accept | Plus S3-10's KO rule. |
| 33 | accept | No object-audio path found in the engine (barks and the music controller only); the transcript fallback is the safe default. |
| 34 | accept | |
| 35 | accept | |

## New canon

| Item | Checked against | Verdict |
|---|---|---|
| Tesseract reads the Initiative's books (the invoice) | bible `insider_threat_initiative.md:27` (the Recruiter leads the Initiative); m10 SA:330 (the Initiative's records mirror to Tomb Gamma since he took WREN's tasking); FA §15 m09 8 | consistent. Ground HaX's m09 claim in the day-10 entry (S3-19). |
| The Critical Mass watch through the Albion flaw | m04 closing debrief, all three disclosure branches | inconsistent as written: m04 patched or published the holes on every branch (S3-03). Fixable with the vendor-versus-site distinction. |
| The legacy placement files | SE:457, SA:167 (WREN is a legacy entry); m08 debrief:206 ("in this service") | inconsistent as written (S3-01). |
| Noor's father on dialysis in Dearborn | m09 SE:174, SE:183 (stage 2 already has it); Torres' "sick parent" line (SA:217) | consistent; not new at stage 3. The third sick parent in one ledger (Kowalczyk's mother, Quintero's father, Noor's father) is deliberate (Torres' line lands on all three). |
| The m05 deal | `m05_phone_recruiter.ink:181–235` | the "money" wording is wrong (S3-02). |
| m01 `surrender` standing order | m01 `final_choice` values: `fight`, `arrest`, `recruit`, `expose`, `surrender`, `""` | consistent. |
| Nightshade's copy (`m08_nightshade_tidied`) | m08 `scenario.json.erb:688–700` (tidied on a tip-off: go-bag gone, USB wiped, pages taken) | consistent: "what he cleared from his locker" matches; it is set before his fate, so it can coexist with any m08 branch, including the silent one (S3-13). |
| Tesseract's voice | m07 `scenario.json.erb:1523` (Sadaltager) | consistent. |

## Scope and simplification

**What stage 3 adds.** Two exports; three new locals (`old_coyote_told`, `notice_sent_in_archive`, and `sorensen_fate`'s new values) and two renames; six new object states (the ledger line, Noor's trolley at the desk, in the cage and shredded, Sorensen's list, the clip or transcript); five new short scenes or texts (HaX's private text, the double-cross text, the Nightshade question, the trolley lines, the debrief notice question); one new voiced asset (pending the user). That is manageable on its own. The risk is the cross-links: the bin feeds Tran, Nightshade's file feeds Sorensen, Noor feeds Sorensen, the Reading feeds the confession, and m05, m01, m03 and m08 imports each fork one of them.

**Playtest load.** The independent axes are the Recruiter (4 routes × 3 openings), the bin (3 × the Victoria staging), the legacy files (3 ways), Sorensen (3), Tran (3), Noor (3 m05 forms), Old Coyote (4). A full product is out of reach; a covering set is not. Stage 4 should name about 12 routes that cover every value of every export at least once and every cross-link once (for example: default cold start; sold-and-lied hang-up with the tapes; take with Derek; double-cross with the copy on the triple-agent branch, file sent; refuse with her file and the letters, Tran talked; warned-in-time Noor with Sorensen talked; Noor told before the cage with Sorensen knocked down; Victoria's route walking past the bins; and one reload in each forced phone scene).

**Simplify, in this order:**

1. **Drop the arrested-branch help** from Nightshade's copy (change 25's "optionally"). It makes `cage_bin` an H, pushes it to Tier 1, and adds a second test case to m10's payment check for one rare save (tidied, then arrested, then the deal). The door line already pays the copy.
2. **Drop `notice_sent_in_archive`** (S3-16).
3. **Fix the legacy-file timing with one rule** (S3-05) rather than more objects: two trolley objects (desk, cage) with `setVisible`, and one shred event.
4. **Cut Old Coyote's interaction with Tran's radio call** (MC:331, MC:412: telling him the truth empties the round on `m01_maya_ko`). It is a three-way link (m01 import, Old Coyote, Tran) for a patrol the player can already avoid.
5. **Keep the clip as the transcript by default** until the user approves the voice, so stage 7 isn't waiting on it.

Not recommended for cutting: the forced notice, the invoice line and the double-cross text. Each is one object or one text, and each is what makes its choice cost something in m09.

## Engine plausibility list

For stages 4–5 to check. Listed only; numbers continue SA §11's fifteen.

16. A text arriving on the player's handset while a phone conversation is open (HaX's private text during the Recruiter's call; change 34).
17. A forced call's resume that crosses speakers: closed after the Recruiter hangs up, it re-rings as HaX at the tape choice; and the same after a reload (S3-09).
18. A timed object-text change about a minute after `deck_choice_made` (the ledger line; change 29, with SA engine item 10).
19. Noor's trolley as two objects toggled by `setVisible` on `cage_opened` and `noor_told`, plus a shredded state, persisting across reload (change 30).
20. The shred trigger on the plan chest: an `onPickup`/`onInteract` `setVariable`, or a unique item type for Nightshade's file, because `item_picked_up` emits the type (skill Step 1); plus the room-exit half (S3-05).
21. A knock-out on a non-combat NPC who keeps working (Sorensen), via `globalVarOnKO` (`systems/npc-hostile.js`), that does not overwrite `talked` (S3-10).
22. A conditional choice on holding an item (Nightshade's file) in Sorensen's conversation, keyed on a global set at pickup.
23. Her list spawned as an object at the hatch counter on `sorensen_fate == "talked"` (SA engine item 8).
24. NPCs leaving the building mid-mission (Noor on `noor_told`, Old Coyote on `old_coyote_told`), with their desks' objects left in place.
25. An audio clip played from an object, gated on `identity_scene_done`. No object-audio path found (`npc-barks.js:378` plays bark sounds; `music/music-controller.js` owns music); likely a new feature, so the transcript is the default (change 33).
26. A text fired on first entry to the tape room (`room_entered`, `objectives-manager.js:296`, `core/rooms.js:2992`).
27. A choice inserted into the debrief cutscene between the stance and the hub, and a debrief closed early that resumes at it (change 35).
28. The drop terminal's send actions (notice, Nightshade's file) reachable from the tape room until the debrief (SA engine item 12).
29. The cage bins: one object removed on `cage_opened` by which was taken, at a hatch counter with Sorensen behind the mesh (SA engine item 6).

## Verdict

**Revise, then round 2.** 0 blockers, 7 majors, 12 minors. The choice structure is sound: every forced choice is held, every optional one is optional, nothing gates completion, and the Recruiter rework does what change 1 says. The majors are all local fixes, most of them one sentence or one rule: the legacy files' content and timing (S3-01, S3-05), two canon corrections against m04 and m05 (S3-02, S3-03), the Alpha tapes' m10 beat (S3-04), one export ledger across three documents (S3-06), and the debrief section (S3-07). Round 2 should concentrate on §4.2–4.3, §3.5's watch line, §9 item 25 and §10.
