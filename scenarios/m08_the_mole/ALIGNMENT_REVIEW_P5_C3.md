# m08 The Mole: alignment review, pass 5, cycle 3 (confirmation)

Reviewer: stage-2 alignment (mission-alignment-plan rubric), fresh eyes, read-only, 2026-10-14. Reviewed at HEAD `35e3b05a`, with no uncommitted m08 changes.
Judged against `docs/agents/M08_PASS_BRIEF.md` ("Kind of game and aim"). Evidence comes from `scenario.json.erb` (`erb`) and the ink files (`<file>.ink:line`). I did not open the SecGen XML or the four named field guides, and I ran no browser session (a Sonnet browser check is running at the same time).

## Checks run (output in the session scratchpad, `m08-align-c3/`)

- **Route driver, r1 to r10:** every route reports "all expectations met". The longest run without a choice is 11 lines (the opening cutscene, already logged for the dialogue stage).
- **Probe routes** (scratchpad `m08-align-c3/probes/`), written for state combinations the ten routes don't cover. All five meet their expectations, which means each confirms the behaviour described below:
  - `p1`: Director knocked down, door audit only (no clock source). HaX's reading accepts the answer after three wrong times and two wrong names (K2).
  - `p2`: the box before the door audit. Netherton says "Two of those men badge through that lab door" (K3).
  - `p3`: three misreads before the box (tip-off, check closed), then a Director KO, then the box. HaX takes the reading. The debrief and credits read `named_by_hax` and the tip-off, with no "misread three times" credit. No soft-lock, and no contradictory lines.
  - `p4`: the untidied 0x47 brief carries the ENTROPY header with no naming (K1). After a Phantom accusation and one room change, only 0x47 shows scratches, and HaX texts "He wiped it after you tipped him off" (K4, and the tidy question).
  - `p5`: Cipher accused and Nightshade knocked down before either confirms a row. Netherton holds the check, Cipher refuses until the player apologises, then confirms, and the four-step naming completes. No soft-lock.
- **dialoguelint:** 0 errors, 0 warnings, 8 blank-reentry CHECKs. These are the same eight as before, logged for the dialogue stage.
- **Validator** (`--skip-ink --no-graph`): no errors. The two known, intended warnings remain (the `brief_taken` co-fire on `closing_debrief`; the confrontation cutscene not `onceOnly`). The suggestions are the usual ones: credit sections that are all conditional, plus sprite sharing.

## Severity table

| # | Sev | Area | Finding | Fix (short) |
|---|-----|------|---------|-------------|
| K1 | major | Suspects, giveaway (J4 residual) | Locker 0x47 still holds a plain-text ENTROPY recruitment brief, readable at minute one with the start-kit picks. It confesses for him just as the go-bag used to | Neutral text and observation for the brief until `mole_identified`, as the go-bag has |
| K2 | minor | Fallbacks (J3 residual) | HaX's reading after a Director KO needs no clock source, has two steps instead of four, and allows unlimited retries. A KO makes the naming cheaper | Gate "[I can name the leak.]" on a clock source as well; HaX's ladder already has the wording |
| K3 | minor | Deduction (n4 again) | Netherton, refusing a login-only naming: "Two of those men badge through that lab door." That is the narrowing n4 removed from the timeline note | "Doors keep their own records. Bring me the door's." on its own |
| K4 | minor | Tidy branch | HaX's text on the wiped stick, "He wiped it after you tipped him off", draws the conclusion for the player even when the accusation was against Cipher or Phantom | "Empty. Written over tonight. The print on the casing is still there. Lift it." |
| K5 | minor | Fallbacks | "[The Director's taken the audit off me.]" still says "He'll put the name to it himself" after the Director has been knocked down | Add `not netherton_ko` to that choice |

Counts: **0 blockers, 1 major, 4 minors.**

---

## Findings

### K1 (major): the 0x47 brief still confesses before the naming

`erb:1955-1976`. The "Deep State" brief sits in Nightshade's locker (`erb:1900-1918`, picks or key) with:
- base observation "A slim ENTROPY recruitment document" (`:1962`);
- text that opens "ENTROPY -- INSIDER THREAT INITIATIVE" (`:1955`, `:1964`).

There is no `mole_identified` variant. The tidied variant (`:1968`) quotes the same header. Probe `p4` confirms the header shows in both states, before anyone is named.

C2's J4 complained about three things. The first two are fixed: 0x47 was the only searchable locker, and its contents settled the case. The third is not: "the go-bag; the ENTROPY recruitment brief; the signed mail". Round 2 neutralised the go-bag because "its contents are a confession, not a clue" (`erb:1977-1981`, `:1993`). The brief is the same kind of confession, needs no work, and is on the shelf next to the bag. Three lockers now invite the player to search all three early, and r8 and r9 already do so. Opening them settles the case at once: 0x23 holds a token slip, 0x88 a torn boarding stub, and 0x47 a document headed ENTROPY. The naming still needs the door reading (B1 holds), but "each suspect plausible to the end" breaks in the break room.

The stick is a different case, and I'd leave it. Its plaintext names him ("From: nightshade_deep_state ... -- N", `erb:116`), but only after the picks and a two-layer CyberChef decode. That is earned work with a cross-mission capability, and the reading is still required. So the stick is corroboration found by investigating, not a handover.

**Fix (mission-local, the go-bag pattern).** Nightshade gave your intake the insider-threat briefing (`m08_suspect_nightshade.ink:67-72`), so an insider-recruitment paper in his locker can read as course material until he is named:
- Base `observations` (true in every state, as E5 requires): "A slim stapled document, cover torn off. Page 7 has been read more than the rest."
- Add a `textVariants` entry after the tidied one, with condition `!globalVars.mole_identified`. Its text is the page without the "ENTROPY -- INSIDER THREAT INITIATIVE" header line, plus one closing line such as "No letterhead. He gave your intake the insider-threat lecture; this could be his reading for it. Or not."
- Make the tidied variant use the same headerless text when `!mole_identified`. That takes a fresh pair: `nightshade_tidied && !mole_identified` first, then `nightshade_tidied`.
- Add a `mole_identified` observation variant that restores "A slim ENTROPY recruitment document. Page 7 is the one that matters."
- Optional: a route `look` step in r9 for the headerless text before the naming and the header after it.

The item name ("Insider Threat Initiative -- 'Deep State' Brief") can't vary (E4) and doesn't say ENTROPY, so it can stay. The credit "Recovered from his locker" (`erb:203`) is fine, because credits come after the naming.

### K2 (minor): the Director's KO makes the naming cheaper

The phone choice is gated `netherton_ko and found_badge_audit and not mole_identified` (`m08_phone_agent_0x99.ink:143`). The reading at `:164-199` asks two questions, the minute and the man, and every wrong answer returns to the hub with no counter (`:173-175`, `:186-188`). Netherton asks four questions, needs a clock source and a confirmed row first (`m08_director_netherton.ink:236-250`), and closes after three misses.

Probe `p1` names Nightshade from the audit alone, after five wrong answers and no clock. HaX's two wrong-answer replies also tell the player which step failed, so trying every option is quick (at most eight calls).

The fixer chose free retries on purpose, because a fallback with no Director has nowhere to go. That's reasonable. The missing clock is the part that matters: the minute is half of the deduction, and the KO path skips finding it. With the clone gate also skipped (the card drops), one punch is now the cheapest way through both the access and the naming.

**Fix.** Add `(found_timeline or found_access_logs_hint or found_access_logs)` to the choice at `:143`. Give the KO branch of the ladder a clock rung:

```
- netherton_ko and not (found_timeline or found_access_logs_hint or found_access_logs):
    You've got the door. Now the clock: when was the plan opened? Somebody in this building wrote it down.
```

Place it between `:122` and `:123`. Leave the retries free.

### K3 (minor): Netherton narrows the field to two

`m08_director_netherton.ink:230`. With the box in but no door audit (hub `:132` opens on `found_access_logs`), the refusal says: "Two of those men badge through that lab door." That is the first half of the reading, done for the player, which n4 removed from the timeline note (`erb:1840`). Phantom drops out without the player reading the travel desk. Probe `p2` confirms it.

**Fix.** Cut the second sentence and keep "On a login? A login is a key, Agent, not a hand on it." followed by `:231` "Doors keep their own records. Bring me the door's." This is a spoken line; note it for the TTS stage.

### K4 (minor): HaX draws the tidy's conclusion

`erb:848-854`. When the stick is picked up after the tidy, HaX texts: "Empty. He wiped it after you tipped him off." If the tip-off came from accusing Cipher or Phantom (J2), the line tells the player that the stick's owner was the one tipped off, which makes him the mole. The brief rules out handing the deduction over through an NPC. The scratched lock, the empty shelf and the 0-byte file already let the player draw this conclusion. HaX shouldn't draw it for them.

**Fix.** "Empty. Written over tonight, and not by accident. The print on the casing is still there. Lift it." This is a voiced text; note it for the TTS stage.

### K5 (minor): a stale reply after a Director KO

`m08_phone_agent_0x99.ink:144-147`: "[The Director's taken the audit off me.]" answers "He'll put the name to it himself once the box gives him the account." In the state `p3` exercises (check closed before the box, then a Director KO), the Director can't do that, and the next choice down offers "[I can name the leak.]". **Fix:** add `and not netherton_ko` to the choice at `:144`.

---

## The fixer's open question: is the tidy an oracle?

The situation: after any accusation before the naming, the next room change tidies only 0x47 (`erb:629-635`). Opening or even hovering over the three lockers then shows "Fresh scratches round the lock" on his alone (`erb:1914`).

**Verdict: an acceptable in-world cost, not an oracle in its own right, once K1 and K4 are fixed.** Five reasons:
- **The inference belongs to the player.** "His locker was cleared after the floor heard" is a deduction from physical evidence, and it is the deduction a guilty man's tidy should support. Disturbing the innocents' lockers too would be dishonest in-world.
- **The player pays for it.** They lose the decodable mail and its CyberChef beat, the go-bag lining, and most of the brief. Two credit lines become warnings ("Tipped off before he was named", "GO-BAG: Gone..."), and the debrief records it (`m08_closing_debrief.ink:125-127`).
- **It is warned three times.** The opening says "The moment they know you are hunting, they vanish." Netherton's rules say "Quiet. The instant the mole knows the net is out..." HaX's accusation text says "If it's the right man, he knows we're looking." A player who accuses in order to read the lockers is spending the evidence knowingly.
- **It doesn't skip the deduction.** `name_the_mole` still needs the door reading (or a costed fallback). The tidy tells the player who, not how to prove it.
- **It is no cheaper than the untidied locker.** Untidied, 0x47 points at him anyway through the decodable mail. The tidy swaps one route to "who" (picks and a decode) for another (one accusation and its cost). It doesn't add a route.

Two things would make it an oracle. One is HaX stating the conclusion (K4). The other is the brief on the shelf naming ENTROPY in both states (K1). Fix those, and the tidy reads as evidence the player must interpret.

---

## Confirmation of round-2 findings (checked in the files, not the log)

| # | Finding | Status | Evidence |
|---|---|---|---|
| J1 | KO texts give the verdict | **Closed** | Pairs on `mole_identified` per suspect: neutral and identical in shape before the naming, originals after (`erb:818-833`); Nightshade's neutral text has no interrogation room; r8 and r10 assert both halves |
| J2 | Accusing is an oracle; the herrings cost one click | **Closed** (tidy residual judged acceptable, above) | All three accusations share one text and one tip-off, and are silent once tipped (`erb:929-937`); confrontation line for an innocent accused (`m08_nightshade_confrontation.ink:84-85`); off-duty gossip (`m08_background_agent.ink:42-44`); debrief (`m08_closing_debrief.ink:125-127`); credit (`erb:197`) |
| J3 | Director KO skips the deduction | **Closed**, residual K2 | Flag-4 C split on the audit, setting no name (`erb:739-744`); KO texts send the player to the audit (`:758-776`); HaX's reading sets `named_by_hax` (`m08_phone_agent_0x99.ink:143`, `:164-199`); A2 text (`erb:733-735`); debrief (`m08_closing_debrief.ink:96-98`) |
| J4 | One pickable locker confesses at minute one | **Partly closed**, residual K1 | Three lockers with keys in their owners' `itemsHeld` (`erb:1289-1301`, `:1400-1412`, `:1604-1616`) and key choices after each audit beat (`m08_suspect_cipher.ink:104`, `m08_suspect_phantom.ink:88`, `m08_suspect_nightshade.ink:98`); go-bag neutral until named (`erb:1993`), with the lining reaching the player via ATHENA's latch and HaX (`erb:636-647`, `:942-947`); the brief still confesses (K1) |
| J5 | Third misread unannounced | **Closed** | Warning at two, split on the box (`m08_director_netherton.ink:332-334`, `:359-365`); HaX's ladder names the limit (`m08_phone_agent_0x99.ink:131-134`); `p3` hears it |
| n1 | Herring costs cost nothing | **Closed** via J2 | as J2 |
| n2 | HaX's "calm" pointer | **Closed** | `m08_agent_0x99.ink:41-43` |
| n3 | "Let the box say it" | **Closed** | `m08_agent_0x99.ink:46` |
| n4 | Timeline note narrows the field | **Closed** in the note; the same narrowing reappears in Netherton (K3) | `erb:1840`; `m08_director_netherton.ink:230` |
| n5 | Hidden `asked_alibi` prerequisite | **Closed** | `m08_suspect_cipher.ink:66-67`; `m08_suspect_nightshade.ink:93`, `:96` |
| n6 | Tidy incomplete and instant | **Closed** | Brief tidied variant (`erb:1967-1972`); latch on a far room entry, not if anything is out or he is down (`erb:629-635`); r9 sprint beats it |
| n7 | Debrief ignores the tip-off | **Closed** | `m08_closing_debrief.ink:125-127`; credit `erb:197` |
| n8 | Evidence wall wording | **Closed** | `erb:1748` |
| n9 | Cipher volunteers the terminal | **Closed** | `m08_suspect_cipher.ink:59` |
| n10 | route.js crash with no argument | **Closed** | `route.js:75-76` |
| n11 | Disposition names him on flags alone | **Closed** | `erb:1765` needs `mole_identified` |
| N1 | Dusting panel ignores variants | **Closed** (static) | Base text and observations true in every state; content in variants (`erb:1935-1944`) |
| N2 | "Same classroom" unread | **Closed** (static) | Phone mapping gone (`erb:855-858`); debrief narrator beat (`m08_closing_debrief.ink:46-48`) |
| N3 | Ciphertext overflow | **Closed** (static) | Panel no longer prints it; wrapped at 48 (`erb:1943`) |
| N4 | Locker header shows the base observation | **Closed** (static) | Base observation neutral (`erb:1912`); variants at `:1913-1916` |
| N5 | Instinct question re-asks | **Closed** | Stitch `hub.name_forming` with "[Not yet, sir.]" (`m08_director_netherton.ink:128`, `:140-160`) |
| N6 | "Through the relay" after the chain is in | **Closed** | `m08_director_netherton.ink:403-407` |

"Static" means checked in the files and the route driver. The concurrent Sonnet browser check is the place to see them on screen.

## Other things looked at and left alone

- **Deliberate misreads as a skip.** Three wrong answers to Netherton after the box get him to read it himself. Before the box, they tip Nightshade off, and the flag-4 mapping B names him. Either way the player has already needed the audit, a clock and a confirmed row, and the cost is visible (a warning credit, no code aloud, the debrief line, a tip-off before the box). That is the designed fail-forward (rubric row 9), not a route round the deduction.
- **The psych evaluation in the Director's safe** is reachable early (the printout gives 2407). It records suspicion ("ideological drift"), not proof, and is balanced by Cipher's token slip and Phantom's empty D-2 morning. It's a fair clue.
- **0x3C off-shift behind the door at 10:38** is a fair distractor. Step 2 asks "which of the three", and the off-duty agent's testimony stays ambiguous between Cipher and Nightshade, before the plan was opened.
- **The `found_go_bag` latch fires on read (`onRead`).** For a `notes` item, taking it from the container reads it (`container-minigame.js:478`), so the tidy can't rewrite a holdall the player already carries.

## Items for the user

- **U1 and its addendum (still open; needs checking against SecGen by the user).** These are unchanged from C2. The most important is whether the VM's account or home directory is named after Nightshade, which would make flags 2 and 3 hand over the answer (`erb:696`, `:704`; evidence wall `nightshade_ops`, `erb:1745-1746`).
- **E1 to E5** (engine) remain as logged in `DECISIONS_PENDING.md`. Nothing here needs an engine change.

**Cost note (TTS):** K3 and K4 change spoken or voiced lines. K2 adds one HaX ladder line. K1 changes item text only, which isn't voiced.

## Verdict

**Alignment can't close yet: one major (K1).** Every round-2 finding is closed in the files except J4, which is partly closed. The core deduction, the fallbacks and the tip-off branch hold together, with no soft-locks in the combinations probed. K1 is small and mission-local: one observation, two text variants, no engine change. The four minors are a line or a condition each.

Recommendation: a short fix round on K1, folding in K2 to K5. The confirmation can then be static: a route `look` step on the brief before and after the naming, plus a re-run of r1 to r10 and the probes, with no full cycle 4 needed. If nothing above minor turns up there and the concurrent browser check is clean, close alignment and move to puzzle chains. The locker row's look (the 0x23 sprite rendered without a lock overlay) belongs to room dressing, not this stage.
