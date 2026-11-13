# m10 Full Disclosure: NPC dialogue review, round 5

Phase 4 (dialogue), round 5. Reviewer: Opus, read-only on game files. Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh over all 32 ink files (31 conversations plus the carry-over include), HaX's texts and the barks in `scenario.json.erb`, the three VM-gating objects and the closing scenes. Base: commit `588b5ae52` (dialogue R4, scenario design R4, puzzle chains R3). Line numbers are for that commit.

**The tree moved during the review.** A scenario design R5 fixer is editing `phone_agent0x99.ink`, `tesseract.ink` and the ERB (uncommitted). It has already split the R4 n4 mapping into two `&&` mappings (SD R5 m1), which is exactly m1's fix. As R4 did, I record m1 and don't count it. §5 has notes on the fixer's other new lines.

**Verdict: accept with fixes.** 0 blockers, 0 majors, 1 minor (m2), 5 nits, plus m1, which the tree already fixes and I haven't counted. R4's findings are closed except n4: in HEAD its fix is written in a form the engine can't evaluate, so it never runs and the repeat is still there (m1, fixed in the tree). The open minor doesn't stop play and is a one-line fix.

The new lines are mostly good. "[Just that one?]" works in all four voices, and Vance's "Nothing else." answers it outright. The three "Where are we?" rungs now name the find at each station and are true after a reload. "That opens the way up to him." restores the in-world reason for flag 3. Ghost's "'You let me sell it, then killed it. I kept the money. Clean exit.'" no longer repeats Netherton's numbers a minute later, and it reads like Ghost. "Yes. And I've been reading since." gets rid of the double "It was." The object labels are consistent across HaX's lines, the hatch toast and the objects' own text. "For the agent. A.T." suits a man who invited the player.

---

## 1. Step 1: compile, validator, lint, loops

| Check | Result |
|---|---|
| Compile (inklecate on copies in `scratchpad/m10_dlg_r5/ink`) | 32 compiled, 0 failed, no loose ends. The committed JSON is identical to a fresh compile |
| `validate_scenario.rb --skip-ink --no-graph` | **One new INVALID (#37):** HaX's eventMappings[134] (`erb:1729`), the R4 n4 mapping, uses `\|\|` and parentheses (m1). The rest is the set earlier rounds withdrew: the `blast_tunnel` pair, the two door-log bark→chat repeats, story-lock RFID warnings, import-default notes and `onPickup` notes |
| `dialoguelint.mjs` | 9, the same set R2–R4 withdrew (blank-reentry 5, crowded-hub 2, not-x-but-y 1, us-spelling 1) |
| `loopcheck.js` | 31 of 31 conversations clean at `start`. The include file has no knots of its own, as expected |
| Simulations (`scratchpad/m10_dlg_r5/scripts`, R4's harness plus a 06:00 driver) | The core end to end on rich, cold and mixed saves; 06:00 Ghost text and Netherton's numbers on bait/killed and bait/traced |
| Standing rules | No printed variables in any line (grep). Every line in the five phone files is 25 words or fewer; the longest new one is the hatch topic's at 25 (unvoiced). No US spellings outside Elena's and Wendell's voices. Netherton's lines touched at 06:00 and in the database scene keep full forms |

---

## 2. R4 findings: status

| R4 | Status |
|---|---|
| m1 "[Anything else before I pull it?]" | **Closed.** "[Just that one?]" at `phone_agent0x99:826`, `vance_phone:78`, `elena_phone:83`, `voltage:195`. Every reply still answers it |
| m2 Quintero's recall pointer | **Closed as filed:** the wrong line no longer runs for Quintero. The new line lands next to Anchor's and points to a different document (m2 below) |
| m3 "[Where are we?]" names the finds | **Closed.** `:132` (no "You're in."), `:142`, `:177`. All under 25 words and true at each station |
| m4 disarm setup, flag 3's reason | **Closed.** "That opens the way up to him." is back (`:575`). The B6 line replaced "His disarm sits on that box.", so the noun R4 wanted to match the lamp and the 06:00 screen ("disarm") is gone again. See n1 |
| §5 box topic order | **Closed.** Envelope first, one "left" (`:598–600`) |
| n1 step-0 re-ring | **Closed.** "Take a second. I'll ring straight back." (`:786`) |
| n2 "at the cabinet" | **Closed.** `vance_phone:43`, `elena_phone:48`. Both voices already call it the cabinet |
| n3 Gary over a knocked-out Imran | **Closed.** `gary:61` "He's breathing, at least." In voice, and it no longer repeats `:69` |
| n4 T-28 repeat | **Not closed.** The mapping can't be evaluated, so it never fires (m1) |
| n5 Ghost's bait text | **Closed.** `six_oclock:98`; simulated with Netherton's `numbers_core`, no repeat |
| n6 Tesseract's "It was." twice | **Closed.** `tesseract:415` |
| n7 "Malhotra's was borrowed at ten past two." | **Closed.** `phone_agent0x99:304` |
| n8 captured Voltage's isolator bark | **Closed.** `onceOnly` at `erb:3342` |

---

## 3. Findings

V = a voiced line changes or is added (m10 has no audio yet). T = a text, choice, object or mapping (unvoiced). HaX's hub topics and `where_are_we` are text (CONTRACT §1); her calls are voiced.

### Minor

**m1. The R4 n4 mapping never fires, so the "Shutter's dead" repeat is still there.** `erb:1729`. **T.** *Already fixed in the tree (SD R5 m1, the same two mappings as below); not counted.*
Current condition: `value === true && globalVars.flag2_submitted === true && globalVars.flag3_submitted === true && ((globalVars.cut_step === 3 && !globalVars.phone_voice_is_hax) || globalVars.voltage_outcome === 'by_hand') && !globalVars.shutter_text_sent && !globalVars.hax_jammed`.
`safeEvaluateCondition` (`npc-manager.js:105–113`) splits on `&&` and evaluates each piece on its own. The piece `((globalVars.cut_step === 3` matches no supported form, so it returns false and logs `unsupported condition term` (`:101`), and the whole condition is false. The next mapping (`:1730`) then sends "Shutter's dead. The stair's open." on every Vance, Elena or captured-Voltage save that has flags 2 and 3 in. Those players have just heard "That's it. Shutter's dead." (`vance_phone:88`), "Done. That shutter's dead." (`elena_phone:93`) or Voltage's "That's it. Shutter's dead." bark. CONTRACT §11 records this as "traced over five save types, one text per cut and no repeat". That trace can't have gone through the engine's evaluator.
On its own the repeat is the nit R4 graded. I grade it minor here because the validator rejects the mapping and the change log records a fix that doesn't hold.
Replacement: two mappings in its place, both above `:1730`, each with `"onceOnly": true, "setGlobal": { "shutter_text_sent": true }, "sendTimedMessage": { "delay": 2500, "message": "The stair's open." }`:
- `value === true && globalVars.flag2_submitted === true && globalVars.flag3_submitted === true && globalVars.cut_step === 3 && !globalVars.phone_voice_is_hax && !globalVars.shutter_text_sent && !globalVars.hax_jammed`
- `value === true && globalVars.flag2_submitted === true && globalVars.flag3_submitted === true && globalVars.voltage_outcome === 'by_hand' && !globalVars.shutter_text_sent && !globalVars.hax_jammed`

Prove it by running the event through `safeEvaluateCondition` itself, not a JS `eval`, and check that the validator's #37 is gone.

**m2. "The bench log clears her. Read it." comes straight after Anchor's "Read the sheet.", which points to a different document, and doesn't say where the log is.** `phone_agent0x99:392`, `:451`. **T.**
On `accuse_wrong` for Quintero the player reads, in order: Anchor's "I took the drain. I didn't pack the case. Read the sheet." (`:431`), then HaX's "The bench log clears her. Read it." The sheet is the sign-out sheet on the table at the forward post (`erb:2476`). The bench log is a clipboard in the workshop (`erb:3223`). Only the bench log brings up "[Bring Quintero back.]" (`:94`). So a player who does what Anchor says, and reads the sheet a few steps away, gets no recall. One who accuses before reaching the workshop has never seen anything called "the bench log". The same line runs on `accuse_refused` (`:392`), where it's less abrupt but still doesn't say where the log is.
Replacement, both places: "The bench log in the workshop clears her. Once you've seen it, I can bring her back." (17 words). It names the room, says what reading it does, and doesn't repeat "Read".

### Nits

| # | File:line | Current | Proposed | |
|---|---|---|---|---|
| n1 | `phone_agent0x99:575–577` | "Get out of the container onto that host. That opens the way up to him." / "The release's kill config is on it: how six o'clock is armed, and what stops it. The switch is on his console, in the core." Here "it" comes right after "him", and "switch" is a third name for the stop: the console shows "One key under a hinged cover" (`erb:4175`), the key publishes everything (`tesseract:958`), and the lamp and the 06:00 screen say "disarm" (`erb:4180`, `:122`) | Keep `:575`. `:577` → "The host holds the release's kill config: how six o'clock is armed, and what stops it. The disarm's on his console, in the core." (24 words; the B6 content is unchanged, and I haven't checked it against the VM and won't) | T |
| n2 | `erb:4257` | "A sealed envelope propped against the host terminal's screen…" CONTRACT d1 puts it on the desk a tile east of the terminal (2.2, 4.8 against 1.2, 4.6). "Sealed" also sits oddly on an envelope the player opens and reads | If the dressing keeps the desk spot: "An envelope on the desk by the host terminal, stamped CORE. ACCESS. Left out for whoever came down." HaX's "on his terminal" (`:132`, `:598`) is close enough to leave | T |
| n3 | `phone_agent0x99:142` | "The duty sheet by the east racks has the login." This is still the rung once the player is carrying the sheet | "The duty sheet from the east racks has the login." (true before and after pickup; the hatch toast and topic say "dropped", which stays true) | T |
| n4 | `phone_agent0x99:598–599` | "…He wants you on his box." / "He walled his box off…" ("his box" twice in a row; the tree's new `:599` keeps it) | `:599` → "He walled it off, the same way the release service was. You've broken out of one of those tonight." (works with either version of `:598`) | T |
| n5 | `CONTRACT.md:280`, `texts/BARKS_AND_TEXTS.md:62`, `:70` | §1.6 still names "[Anything else before I pull it?]". T-28 lists three forms where there are now four. T-34 is missing the hatch toast's duty-sheet sentence | Bring them in line with the ERB and ink (docs only) | – |

**Looked at and left alone.**
- HaX's step-0 "I'll ring straight back." is false on a second "[Give me a minute.]" at step 0, because the 1.5 s re-ring on close is once-only (`erb:1722`). By then she rings on the isolator click or on room entry, which follows straight away. R4 accepted this; no change.
- "[Just that one?]" after "[And the gallery camera?]" still reads as "just that breaker?", since every reply names the breaker.

---

## 4. The last ten minutes, on three saves

R4's harness on fresh JSON, run through the core to the end, with 06:00 driven separately. I read the Citadel, the hearing and the waiting Kowalczyk by hand; they haven't changed since R4.

- **Rich** (m01–m09, m09 taken, backdoor live, Zero Day traced). HaX's warning names the backdoor ("The console in the hall closes it."), and "[Stop it.]" costs "Fourteen million systems." The records run "Albion…" → "It was. I'm only reading it back." → Derek → "Yes. And I've been reading since." with no echo. Exchange 2 gives the notice rebuttal ("No. I didn't send it."); 1 and 3 miss, and the misses read as authored. Netherton's costs name Nightshade's channel and the Voltage watch. "You found her. I wondered whether you would." is true because WREN was named.
- **Cold** (m10 only, door log read, WREN held). "You never read his sheet. It's pinned above the workshop bench." Tesseract says "I prefer to watch." and "Two of yours died at the sites nobody covered." Netherton's operations are "The order-book watch." / "Our tap on Zero Day's brokers." Nothing assumes an earlier mission. Flag 4's cold HaX line, "The notice he wrote to the vendor is on his box.", sets up the rebuttal, and the trimmed m09 form ("on his box", no "too") reads cleanly.
- **Mixed** (m02 and m04 escaped, Vance ally, Kowalczyk down, both shares out). No loose end is named while nothing is open. The by-hand cut goes through Vance: "[Just that one?]" → "…Go and pull it. Nothing else." → pull → Vance's `cut_done`. If flags 2 and 3 were already in, HaX's "Shutter's dead. The stair's open." follows (m1).
- **06:00.** Bait plus kill: Ghost's "'You let me sell it, then killed it. I kept the money. Clean exit.'", then Netherton's "Zero Day got its two hours. Nobody else did." / "The resale's buyers paid for nothing. Five of them, and we have their names." The two now say different things. Bait plus trace: "'Sold. You watched who bought it…'" then "Four buyers, and one of them was careless." Anchor's 06:00 line when she was sent back, "Read the sheet next time.", is in character, and with m2's wording HaX no longer contradicts her.

**Rest of the cast.** Ghost's call, Victoria's line, Kowalczyk at the core, the WREN beat, the database scene, Mercer, the minders, Phantom, Vector and Arakawa: all in voice, no printed variables, and every exit gets a reply. Netherton's database lines keep full forms ("cannot", "I will sign it").

---

## 5. The tree's new lines (in flight, for the fixer)

Read only, since these are uncommitted.
- Rung `:132` "The core. His box first. The login's on his terminal.", box topic "He's left an envelope on his terminal, stamped CORE. His login's in it. He wants you on his box." and the guide-4 text "…His login's in the envelope on his terminal." all agree, and none is over 25 words. The object is now "Core Access Code" and its text says "HOST ACCESS CODE", while HaX says "login". That's close enough. n2 ("sealed", "propped against the screen") and n4 still apply.
- Tesseract `flag4_lines` on `m09_albion_notified`: "The notice from Helena is on his box. Nine years he sat on it. You sent it." (voiced, HaX). True, and in her voice. The database scene's "You sent his notice before anyone asked you to…" makes the same point a few minutes later, but it builds on it rather than repeating it. The rebuttal "[…You wrote the notice and kept it.]" stays true, because he kept it and the player sent it.
- The duty sheet's "Release service login:" is a VM-side call; not reviewed.
- If the fixer touches CONTRACT §11, R4 n4's "traced over five save types" claim needs correcting.

## 6. Voiced lines in this round's proposals

None. m1, m2 and n1–n4 are texts, hub lines, an object and a mapping; n5 is docs. (The tree's new Tesseract-scene line, §5, is one new voiced HaX line from the SD R5 fixer, not from this review.)

---

## 7. Top five

1. **m1** (fixed in the tree, not counted): in HEAD the R4 n4 mapping (`erb:1729`) uses `||` and parentheses, so the engine reads it as false and HaX still sends "Shutter's dead. The stair's open." after Vance, Elena or Voltage has just said it. The tree's two-mapping split is right. Prove it through `safeEvaluateCondition`, and correct the "traced" claim in CONTRACT §11.
2. **m2**: "The bench log clears her. Read it." follows Anchor's "Read the sheet." and doesn't say where the log is. Use "The bench log in the workshop clears her. Once you've seen it, I can bring her back."
3. **n1**: in the hatch topic, "it" lands after "him", and "The switch is on his console" names a third control. Use "The host holds the release's kill config…" and "The disarm's on his console, in the core."
4. **n2**: "propped against the host terminal's screen" vs the desk spot one tile east; "sealed" on an envelope the player reads.
5. **n3/n4**: "from the east racks" so the rung stays true after pickup; "He walled it off…" to avoid "his box" twice.

Verdict: phase closes
