# The Keyholder Trials: design review, round 1, reviewer B

## 0. Scope and method

Reviewed: `DESIGN.md` (v1), against `docs/agents/TESSERACT_TRIALS_BRIEF.md`, `DECISIONS_LOG.md`, `AGENTS.md` and the method of `.claude/skills/mission-puzzle-chains/SKILL.md`, adapted to a design that isn't built yet (no `scenario.json.erb` or dungeon graph exists, so the boss-key audit uses the design's own room and lock tables).

Kind of game: lab scenario with SAFETYNET spy framing; a fun 45-60 minute escape room for a first-year with no assumed knowledge, every lock opened in CyberChef, no quizzes, no new engine features.

Three lenses: puzzle chains (with the engine claims checked against code), a complete beginner, and fun.

What I ran, beyond reading code:
- The designer's own CyberChef 10.19.4 npm install (`scratchpad/designer/node_modules/cyberchef`) and its seed-42 output (`scratchpad/designer/out42.json`), with two small test scripts of my own in `scratchpad/review-r1-b/` (`t_b.mjs`, `t_c.mjs`, `pemtest.cjs`). Results are quoted where used.
- The bundled operation config, `public/break_escape/assets/cyberchef/assets/main.js`, for argument defaults.
- `scenarios/test-tesseract-probes/PROBE_RESULTS.md`, an in-progress probe run (R1 PASS; CyberChef recipe kept after close: FAIL).

Severity: **blocker** = the design as written can't be finished by its target player; **major** = should change before the build; **minor** = fix during the build.

## 1. Puzzle chains

### 1.1 Boss-key audit (from the design's tables)

Depth counts locked doors passed: foyer, lab, common room 0; corridor, Sidhu 1; library 2; workshop 2.

| Lock | Where the player first sees it | Where its answer comes from | Verdict |
|---|---|---|---|
| L1 lockbox (foyer) | foyer, depth 0 | leaflet from Jordan, same room | same-room; fine as the first lock |
| L2 locker (common room) | common room, 0 | Trial II card in L1 (foyer) | boss-key |
| L3 guest terminal (lab) | lab, 0 | Trial III in L2 (common room) | boss-key |
| L4 corridor door | foyer north wall, 0, from the first minute | Trial IV in L3 (lab) | boss-key, and the best one: visible all through Act 1 |
| L5 library door | corridor, 1 | poster in the corridor | same-room |
| L6 Special Collections safe | library, 2 | slip in the library | same-room |
| L7 (no lock) | Trial VII in L6 | key on Sidhu's whiteboard (east of corridor) | hunt beat: good |
| L8a (no lock) | envelopes in the corridor | private key in the lab | hunt beat: good, but see B1 |
| L8b drop box | corridor, 1 | AES key from L8a + tag in the corridor | same-room by design (`DESIGN.md:170`) |
| L9 workshop door | corridor north wall, 1 | brass key in L8b | key-before-lock in practice (box and door are in the same room) |
| L10 relay terminal | workshop, 2 | passphrase from L8b + card from L8b | key-before-lock |
| Scoreboard | workshop, 2 | token inside the decoded report | by design |

Four same-room locks out of ten is acceptable for a teaching lab where the work is the decoding, not the walk. The real hunt beats are L7 and L8a, which makes M1 below matter: those are exactly the two steps a player can route around.

### 1.2 Findings

**B1 (blocker): the in-game CyberChef forgets everything when it closes, and L8a/L8b need inputs from two rooms.**
- Opening the laptop re-sets the iframe `src` (`public/break_escape/js/utils/crypto-workstation.js:19`), closing clears it (`:40`), and game input is off while it's open (`:23-27`). The probe confirms it: "Recipe `From Base64` + input set, close, reopen: recipe `[]`, input empty" (`scenarios/test-tesseract-probes/PROBE_RESULTS.md`, second row).
- `text_file`s are never taken from a container ("Text files — always interactive (never taken, even without text)", `minigames/container/container-minigame.js:445-448`), so the private key can only be copied at the lab PC and the envelope only at the corridor pigeonholes. The clipboard holds one string.
- So L8a can't be done inside the in-game laptop: paste the envelope, then close the lid to fetch the key, and the envelope is gone (or the other way round). L8b is the same: the AES key exists only in CyberChef's output, and the ciphertext and IV are on a note in the notepad, which can't be opened while the laptop is up. The climax's optional RSA Verify needs three inputs. The only in-game ways round it are retyping a 1,700-character PEM, or CyberChef's own "Save recipe" (it stores recipes, args included, in `localStorage.savedRecipes`, `main.js`), which no beginner will find.
- `DESIGN.md:525` (R10) calls this "tiresome" and defers it to playtests. It's a wall, not a nuisance.
- Fix (mission-local): make the pop-out tab part of what the game teaches, not an aside. Tom says it when he hands over the laptop, in his voice ("Pop it out into its own tab with the little arrow, top right. Shut the lid and it forgets the lot. I've reported it. Twice."). The arrow is a bare "↑" with only a tooltip (`app/views/break_escape/games/show.html.erb:97`), so the line has to say where it is. Repeat it in FN1 and in the "In CyberChef" line of FN8, FN9 and FN10, and in the L8a rung 1 hint. Add a probe row: the pop-out tab keeps its recipe while the player walks between rooms and copies from text files.
- Also put in the approval log (engine, so the user decides): keep the iframe alive between opens (don't clear `src` on close, don't re-set it on open if it's already loaded). It's a two-line change and would remove the problem for every CyberChef mission.

**M1 (major): L5, L6, L7 and Sidhu can all be skipped.**
- Once the corridor is open (L4), everything L8 needs is reachable: the pigeonholes are unlocked in the corridor (`DESIGN.md:97`), the private key is on an unlocked PC in the lab (`:84`), the tag is pinned in the corridor (`:99`).
- L7's only output is which pigeonhole is yours (`:160`). The decoys "fail loudly" (`:161`), so trying all four takes a minute. HaX offers FN9, with the full RSA recipe, as soon as the pigeonholes are opened (`:308`), and rung 2 of the L8a hint says "Only your pigeonhole will open" (`:329`).
- A curious player in the corridor (they have to be there for the L5 poster) opens the pigeonholes, gets the recipe from HaX, and skips the library, Caesar, Vigenère and Sidhu. Then the L10 hint sends them to "Dr Selvarajan", whom they've never met (`:332`), and the hint ladder's idea of the "current Trial" (`:294`) goes out of step with where they are.
- Not a softlock: a task in a locked aim reveals that aim (`systems/objectives-manager.js:725-737`), so `the_keyholder` and `the_offer` still open and the mission still concludes.
- Fix (recommended): **take the IV off the tag and put it in Trial VII's plaintext** ("The IV travels with the letter: <32 hex>"). It's honest teaching (IVs aren't secret, they just have to arrive) and it makes L7 a real boss-key: a player who decrypts the envelope early gets "Unable to decrypt input with these parameters." at the drop box and has to go and find the IV. The decoy lesson survives. Alternatives: lock the pigeonholes with a password from L7 (simpler, less meaningful), or protect the private key with a Key Password from L7 (CyberChef's RSA Decrypt passes it to `forge.pki.decryptRsaPrivateKey`, `RSADecrypt.mjs` in the npm copy; Ruby's `to_pem(cipher, pass)` would need verifying against forge first).

**M2 (major): copyable artefacts that mix prose with ciphertext decode to rubbish, silently.**
- The text_file Copy button copies the whole `fileContent` (`minigames/text-file/text-file-minigame.js:211`, `:230`), and "Select All" does the same.
- Tested against CyberChef 10.19.4's own operations with the seed-42 artefacts (`scratchpad/review-r1-b/t_b.mjs`, `t_c.mjs`):
  - Vigenère with a one-line header in front ("Trial VII. The key is on the ledger.") gives "Tegtx EIV. Raq tel gl aw tuc eqmgrp. Rnfy ttlrtvo zxx..." for the whole message, because the key position advances through the header's letters. Clean input gives "Your session key came by post...".
  - The report with a title line above the Base64 gives binary noise and no token. With the Base64 as the first line and the SHA-256 and signature lines after it, From Base64 still finds the token (noise trails after it).
  - RSA Verify given the whole report file as its Message would report "Verification Failure", teaching the opposite of the lesson.
  - From Hex shrugs off a header ("\ncorridor door passphrase: landing"), so L4 is safe.
- `DESIGN.md:114` puts "Base64 body, SHA-256 line, signature line" in one "Keyholder report" file, and the design never says what else sits in the Trial VII, envelope or report files. The same trap applies to notes copied from the notepad (Trial V poster, Trial VI slip, the tag): "Trial VI. Shift: the number of this Trial." is all Base64-alphabet letters.
- Fix: a build rule, stated in the design: **a text_file's `fileContent` is the ciphertext and nothing else.** Titles go in `fileName`; framing and pointers go in `observations`, which the text-file viewer shows in its own box and Copy doesn't touch (`text-file-minigame.js:90`, copy uses `fileContent` only). Split the report into three files ("report.b64", "report.sha256", "report.sig"). For notes, keep the ciphertext on a line of its own and put the instructions in `observations`.

**M3 (major): the double-agent ending depends on remembering one note from the briefing.**
- The only explanation of the scoreboard is the "Comms discipline" note and one HaX line in the briefing (`DESIGN.md:377`), 45-50 minutes before the climax. The hint ladder stops at L10 (`:320-332`). Cliffe's scoreboard line comes only *after* the decision (`:448`).
- The player has to connect "submit what I most need to know as a flag" with a relay token buried in the last line of a decoded report. Many first-years won't, so the best ending will be the rarest, and not because they chose otherwise.
- Fix: (a) give "Comms discipline" `important: true` so the notepad marks it with a star (`minigames/notes/notes-minigame.js:102-118`); (b) give Cliffe one line, shown when talked to after `relay_opened` and before `decision_made`: "Scoreboard's been quiet today. It takes flags from anyone. Never asked who reads them." It's a nudge, it keeps him unreadable, and it gives him a moment that matters (see section 3); (c) the HaX hub during the climax is the channel Ghost claims to read, so don't give HaX a hint rung there. Let the player feel that.

**m1 (minor): the token is the only upper-case answer.** The server compares exactly (`app/models/break_escape/game.rb:965`); every other answer is lower case and the field notes train "type it exactly as it decodes". Either make the token lower case (`merlin-6578`) or have the Comms discipline note say "flags are case-sensitive".

**m2 (minor): `pin-minigame.js:23` isn't the four-digit rule.** The PIN pad gets `pinLength: correctPin ? correctPin.length : 4` (`systems/minigame-starters.js:534`), and `requires` is stripped before the client sees it (`game.rb:1872`), so the length is always 4. The design's conclusion is right; fix the citation.

**m3 (minor): the Byte Wall's frame title.** `AlarmPanelMinigame` passes `title: 'Facility Alarm Panel'` to the frame (`minigames/alarm-panel/alarm-panel-minigame.js:28`); `panelTitle` only changes the inner header. Check in the probe how it reads on a 1979 front panel; if it jars, use the inner header and the footer to carry the framing.

**m4 (minor): template decor with examine text.** `chalkboard2` (lab) and `smartscreen` (workshop) are listed as "template decor" given `observations` (`DESIGN.md:83`, `:116`). Decor drawn by the template isn't a scenario object; to give it text the build needs a scenario object of that type (slot or pinned). Check in the first render that this doesn't give two chalkboards.

### 1.3 Things checked and found sound

- Server-side checks: passwords and PINs exact (`game.rb:891`, `:963-966`); locked objects found only at top level of `rooms[*].objects` (`:912-925`); contents of locked containers and `requires` stripped (`:1862-1880`); `unlock_object` tasks completed only for objects the server has unlocked (`:1051-1054`); `concludeRequires` checks task status (`:2188-2203`). R4 and R5 hold.
- PIN and password lockout is per opening: a new minigame starts at zero attempts (`pin-minigame.js:22`, `:31`; `password-minigame.js:16-17`), so Megan's "it locked me out" is flavour, not a softlock.
- `objective_task_completed:<taskId>` (`objectives-manager.js:440`), `room_entered:<room>` (`core/rooms.js:2970`), `door_unlock_attempt` with `connectedRoom` (`systems/unlock-system.js:114-122`, fires even when the player holds the key, as the design wants), `object_interacted` with `objectType` (`systems/interactions.js:624-628`), and `global_variable_changed:<var>` from a task's `onComplete.setGlobal` (`objectives-manager.js:754-762`) all exist with the payloads the design uses.
- `video-call` works for a phone NPC on any event (`systems/npc-manager.js:1001-1025`); it ends the current minigame and opens 500 ms later, while the unlocked container auto-opens at 500 ms (`unlock-system.js:694-699`). R3's probe and fallback are the right response.
- `#set_global` keeps string values (`minigames/helpers/chat-helpers.js:463-467`), so `ending = "sent"` works.
- `#give_item:workstation:lab_laptop` selects by id (`systems/npc-game-bridge.js:228-245`); the probe passed R1.
- Text files in containers are read, never taken (`container-minigame.js:445-448`), and `onRead.setVariable` fires from there (`:479-495`), so `megan_file_read` from the "Candidate assessments" note will work if that note is a text_file or a readable notes item.

## 2. A complete beginner

I read the design as a first-year who has never heard of a bit. The foyer is the strongest part of the whole design: the Byte Wall, the plaque's worked sum (64 + 8 + 4 + 1 = 77 = "M"), the powers-of-two poster and the paper tape teach bits, bytes, place values and ASCII from objects before anything is asked (`DESIGN.md:72-76`), and Tom's chalkboard ("Hi" three ways) takes it to hex (`:83`). Megan's mistake on Trial II teaches "digits are characters" by showing a peer get it wrong, which is better than any note. Up to L4 a beginner can learn each idea in the room before using it.

Where they'd get stuck, step by step:

| Step | What the beginner meets | Can they learn it first? | Where they'd stall |
|---|---|---|---|
| L1-L4 | One operation each; Magic would do it | Yes | Nowhere serious. Four similar locks in a row (see 3.2) |
| L5 Base64 | "6-bit groups, 64 symbols" | Only in words (FN4, `:303`) | The poster is just ciphertext. "Regroup the bytes into 6-bit pieces" is the first idea in the game with no worked example in the room (m5) |
| L6 Caesar | "ROT13, Amount 20" | Yes (FN5) | Mild: the operation is called ROT13 and the amount isn't the shift (m6) |
| L7 Vigenère | Key from a whiteboard | Yes | Only if the Trial VII file says where the key is; the design doesn't say which artefact carries that pointer (m7) |
| L8a RSA | Paste a PEM, pick a scheme | Partly | B1 (two rooms, one clipboard, a laptop that forgets). "PEM" is never explained (m8) |
| L8b AES | Key, IV, mode, input, output | Yes | Fine once B1 is fixed: every AES default in 10.19.4 is already right (see below) |
| L10 SHA-256 | "First eight characters of the hash" | Yes (FN7, Sidhu) | SHA2 starts on size 512 (m9) |
| Climax | From Base64 on a document | Yes | Fine if M2 is fixed |

**The settings are easier than the design makes them look.** I read the defaults from the bundled operation config (`assets/main.js`):
- AES Decrypt: Key and IV toggles default to Hex, Mode to CBC, Input to Hex, Output to Raw. Every setting the design lists (`DESIGN.md:162`) is already the default.
- RSA Decrypt: Encryption Scheme defaults to RSA-OAEP and Message Digest to SHA-1, exactly what the generator uses.
- RSA Verify: digest defaults to SHA-1, so that one does need changing to SHA-256.
- SHA2: Size defaults to **512**.

So FN8 and FN9 can say "paste the key and IV; leave everything else as it is". Listing five settings, all already correct, makes AES look like a form to fill in, and a beginner who "sets" Input to Raw because it sounded right will break a working recipe. Name only the one or two fields they type into.

**Pasting a PEM is fine.** The RSA key box comes pre-filled with "-----BEGIN RSA PRIVATE KEY-----", and I expected a paste after it to break the key. It doesn't: CyberChef's RSA Decrypt with the PEM pasted after the default header still gives the seed-42 AES key "ef0cf203a478d6db363a5e6ee62ea2e6" (`scratchpad/review-r1-b/t_b.mjs`). The designer's own check shows flattened line breaks also work (`DESIGN.md:275`). The design is right not to worry about it; the copy problem is B1, not the paste.

**Load (M4, major).** The budget (`DESIGN.md:15`) gives Act 3 (RSA envelope, AES, hash and the workshop) 12 minutes and the whole game 50-60. My estimate for a real first-year, with walking, reading and the copy steps:

| Block | Design | My estimate |
|---|---|---|
| Briefing | 3 | 4 |
| Foyer exhibits, Jordan, Tom and the laptop | 6 | 10 |
| Act 1, L1-L4 | 14 | 14 |
| L5-L7 with Sidhu | 13 | 17 |
| L8a, L8b (two rooms, four envelopes) | | 14 |
| L9, L10 | 12 (Act 3 total) | 5 |
| Video call, decode the report, decide, scoreboard | | 10 |
| Debrief | 8 (with climax) | 4 |
| Reading eleven field notes (about 1,700 words), asked for one at a time through the HaX hub | not budgeted | 8 |
| **Total** | **50-60** | **about 85** |

That's half as long again. The brief's 45-60 minutes is a user aim, so this needs deciding before the build, not after a playtest:
- **Cut L3 (the binary terminal) now.** Binary is already done by hand on the Byte Wall, the poster and the tape, and nothing later uses binary. Hex is the one that matters (AES key, IV, hash). Trial II's locker holds the hex Trial (today's Trial IV) and the guest terminal goes. That saves about 4 minutes and a trip to the lab, and the lab still gets visited for Tom and the private key. If the user wants binary in a lock, cut L2 instead, as `DESIGN.md:498` suggests, but L2 (with Megan) is the better teaching moment of the two.
- **Hand the field notes over in person where a character is there anyway.** Tom gives FN1-FN3 with the laptop as his induction handouts; Sidhu gives FN7 and FN10 (the design already has his handout, `:109`). HaX's hub then delivers six notes, not ten, and a third of the hub round trips go.
- Run a blind playtest with a stopwatch as the first playtest, and log the time per block.

Minor teaching points:

**m5.** Put a worked Base64 example on the Trial V poster's `observations`, the way the plaque does for ASCII: "Hi!" = 01001000 01101001 00100001 → 010010 000110 100100 100001 → 18 6 36 33 → S G k h. The brief asks for "Base64 as 6-bit groups" to be built explicitly on what came before; FN4 says it only in words.

**m6.** Lead L6's hint rung 3 and FN5 with Amount **-6** ("undo a shift of 6"), which the designer verified works (`DESIGN.md:251`), and mention 20 second. One less sum, and it matches how the slip states the key.

**m7.** Say which artefact tells the player where the Vigenère key is. Rung 1 says "The Keyholder told you where it is" (`:328`), but nothing in sections 3-4 carries that pointer. Put it in Trial VII's `observations` ("Key: the last entry in the ledger of the man who checks everything twice"), not in `fileContent` (M2).

**m8.** One sentence on PEM in FN9 or Tom's README: "A .pem file is the key's bytes written in Base64 between two header lines." It turns a wall of text into something the player already knows (L5), and the callback is satisfying.

**m9.** The Final Trial card and FN7 should say "SHA2, and set Size to 256: it starts on 512". With the default the first eight characters are `5b69c83c` instead of `8e221205` (seed 42, `t_b.mjs`), and a beginner will think they've copied the passphrase wrong.

**m10.** FN10 says the sender "encrypts the hash with their private key" (`DESIGN.md:309`). It's the classic simplification, and the brief cares about not repeating lab-sheet errors. Say "signs the hash with their private key; anyone with the public key can check the signature matches", and keep the lock-and-key picture for encryption.

## 3. Fun

### 3.1 What already works

- **The premise does the heavy lifting.** A real student plays an undercover student being talent-spotted by a ransomware gang through puzzles they have to solve anyway. The homework is diegetic: every decode is an audition.
- **The climax is the best idea in the design.** Ghost on video, St Catherine's named, then the player alone with a Base64 report and the choice to read it or not. The beacon line is found by the player, not told to them, and "Did you read it before you sent it?" (`DESIGN.md:401`) is a line that will stay with a student long after they've forgotten the AES mode. Encoding-isn't-encryption gets its payoff where it counts.
- **Megan** (`:418-426`) gives the middle a human stake, and she earns it by being the one who showed the player the Trial II trap.
- **Cliffe's** "Good luck with it, Agent. ... Student. Sorry, long week." and the live map with a figure in the player's hoodie are uncanny, cheap and true to "builds learning tools, hard to pin down".
- **Jordan** is a good comic note: an ENTROPY asset whose only motive is a referral bonus.

### 3.2 Findings

**M5 (major): Ghost disappears between L1 and the climax.**
- The Keyholder device arrives with L1 (`DESIGN.md:77`) and Ghost's role is "Recruiter and examiner" (`:28`), but no Ghost beat is designed between picking up the device and the video call. Section 6's events are all HaX's; Q2's "HaX suspects aloud halfway" (`:497`) has no trigger.
- The reveal only lands if the player has spent the game with someone on the other end of the terminal. Without that, the video call is the first time the antagonist does anything.
- Fix, all with existing features (phone-NPC `eventMappings` with `sendTimedMessage` or a phone-chat knot; text only, no per-game values, so nothing breaks the TTS rule at `:186`):
  - One short terminal line per completed Trial, keyed on `objective_task_completed:<task>`. Ghost's numbers-as-weapons voice suits it: "Trial II. Two hundred and twelve candidates picked up a card. Forty opened the locker. Most of them guessed." / "Trial IV. You didn't ask the Magic button. Noted." Keep them static: no timings or values from this game.
  - One line that shows the watching is personal, after `megan_file_read`: "You read the other candidates' files. So did I. Candidate 7 is the interesting one."
  - HaX's suspicion beat after Ghost's second message: "The phrasing. I've read this voice before. Keep going, and keep your eyes open." Not named, so Q2's reveal still holds.
  - Five or six lines in all. The examiner becomes a presence and the climax pays it off.

**M6 (major, overlaps M3): the real academics need one memorable beat each that only they could have.**
- **Cliffe** has his slip and his map; what he lacks is a moment that matters. M3's scoreboard line gives him one: he's the man who knows the out-of-band channel exists and says so without explaining why. It suits "knows the player is an agent and doesn't say how", and it's his scoreboard (Hacktivity) that saves HaX. After the decision, his screen line could follow the ending: "On the map, the small figure in your hoodie walks out of the workshop. A second figure, one you don't recognise, stays by the scoreboard."
- **Tom** gives the laptop and teaches bases, which is useful but forgettable. Give him the B1 line (the lid that forgets everything: practical, a bit fed up, funny) and one line about Magic as he demonstrates it on the chalkboard example: "It'll do the first few for you. It'll do nowt once there's a key. That's the bit they're paying for." It sets up the brief's constraint 5 as a promise the player sees kept, and it's "keen on breaking things to learn how they work" in his own words.
- **Sidhu** has the whiteboard and the handout but no scene. Give him one branch after `relay_opened`, for a player who walks back to his office with the report: "See, it verifies. That tells you who wrote it, isn't it? It does not tell you whether you should send it." It's the signature lesson landing in the moral moment, it's exactly an editor's distinction, and it costs one knot. Keep him plainly on the player's side; Q4's default (cut the "Keyholder" paper seed) is right.

**m11 (minor): four look-alike locks in a row.** L1-L4 are each "paste, one operation, type the word" (`:154-157`), and Magic does all four. With L3 cut (M4) it's three, and Ghost's lines (M5) give each one a beat. Vary the answer shape too: L1 a word, L2 a PIN, L4 the last word of a sentence. That's already the case; keep it.

**m12 (minor): give "I'll think about it" a little pressure.** At `:391` the offer just stays open. One line keeps the tension without a timer: "The relay closes when you leave the building. I don't." Narrative only; nothing has to enforce it.

**m13 (minor): the in-band channel can be part of the drama.** After `ghost_offer_made`, HaX's hub is the phone Ghost says they read. Don't add a climax hint rung there (M3c). If the player asks HaX for help with the Megan choice through the phone, a later Ghost line can show they saw it ("Your handler is generous with bursaries."). Optional; one mapping on `megan_choice` with `globalVars.megan_choice === 'protected'`.

### 3.3 No quizzes

Nothing in the design is a quiz. Megan's choice, the climax choices and the debrief's "Did you read it?" are about conduct, not lab content. The suggestions above add none: Ghost's lines, Tom's Magic demo and Sidhu's signature line are remarks, not questions.

## 4. Engine claims checked

| Design claim | Result | Evidence |
|---|---|---|
| Passwords compared exactly | correct | `game.rb:891` (doors), `:966` (objects) |
| Password field trims, 50 characters | correct | `password-minigame.js:115` (`maxlength="50"`), `:425` (`.trim()`) |
| PIN pad takes four digits | correct, wrong citation (m2) | `minigame-starters.js:534` |
| Answers and locked contents stripped from the client | correct | `game.rb:1862-1880` |
| Locked objects must be top-level (R4) | correct | `game.rb:912-925` |
| `concludeRequires` with an `unlock_object` task is server-authoritative (R5) | correct | `game.rb:1051-1054`, `:2188-2203` |
| text_file has a Copy button (R6) | correct, but it copies the whole file (M2) | `text-file-minigame.js:81`, `:211`, `:230` |
| Notes render with `textContent` | correct | `notes-minigame.js:127` |
| Fixed lamps on the alarm panel need no globals (R8) | correct by reading; probe still needed | `alarm-panel-minigame.js:105-106` (`!s.variable` matches the default state), `:130-139` (subscribes only to listed variables) |
| Workstation given by an NPC opens CyberChef (R1) | correct, and probed | `interactions.js:758-779`; `npc-game-bridge.js:228-245`; PROBE_RESULTS.md R1 PASS |
| Any object with `contents` is a container (R9, R15) | not re-checked | design cites `interactions.js:1296` |
| `video-call` on any event, for a phone NPC (R3) | correct | `npc-manager.js:678`, `:1001-1025` |
| Unlocked container auto-opens at 500 ms (R3) | correct | `unlock-system.js:694-699` |
| CyberChef clears on close (R10) | correct, and worse than stated (B1) | `crypto-workstation.js:19`, `:40`; probe FAIL |
| A new-tab button exists | correct | `show.html.erb:97`, `:209-210` |
| Event names and payloads used by the hint ladder and mappings | correct | see 1.3 |
| `#set_global` with a string value | correct | `chat-helpers.js:463-467` |
| CyberChef operations exist in 10.19.4 | correct (spot-checked SHA2, RSA Decrypt, RSA Verify, AES Decrypt, ROT13, From Decimal, Vigenère Decode, From Base64 in `main.js`) | `assets/main.js` |
| RSA Decrypt defaults OAEP / SHA-1 | correct | `main.js` RSA Decrypt args |
| Magic behaviour (R12) | not executed by me either; the design is honest that it's reasoned, and the browser probe is the right check | |

## 5. Withdrawn

Findings I drafted, checked, and dropped:

- **"Pasting a PEM after CyberChef's pre-filled header breaks RSA Decrypt."** Withdrawn: with the PEM appended to "-----BEGIN RSA PRIVATE KEY-----", CyberChef's own RSADecrypt still returns the AES key (`scratchpad/review-r1-b/t_b.mjs`), and plain forge parses all three variants (`pemtest.cjs`).
- **"Skipping the library strands the conclusion aim behind `aimCompleted: trials_keys`."** Withdrawn: a task completed in a locked aim reveals that aim (`objectives-manager.js:725-737`), and `checkAimCompletion` then unlocks the next one (`:856-867`). The skip is a teaching problem (M1), not a softlock.
- **"Three wrong PINs lock the locker for good."** Withdrawn: attempts are counted per minigame instance (`pin-minigame.js:22`, `:31`), so closing and reopening resets them.
- **"`briefcase` and `safe` sprites don't exist."** Withdrawn: they're slot types with numbered variants (`briefcase1.png`..., `safe1.png`...), used the same way in other scenarios (e.g. `scenarios/biometric_breach/scenario.json.erb:245`).
- **"The AES step asks a beginner to set five options."** Withdrawn as a difficulty finding: every option the design lists is already the default (section 2). It's kept as advice on how FN8 is worded.

## 6. Verdict

**Revise, then build.** The teaching ladder in the first two rooms, the per-game generation with two independent checks, and the climax are strong, and nothing here needs new engine functionality. One blocker and six majors need to go into the design first:

| # | Severity | One line | Fix |
|---|---|---|---|
| B1 | blocker | In-game CyberChef forgets recipe and input on close, so L8a/L8b (inputs in two rooms) can't practically be done inside it | Teach the pop-out tab (Tom, FN1, FN8-10, L8a hint) and probe it; log "keep the iframe alive" for the user as an engine option |
| M1 | major | Library, Caesar, Vigenère and Sidhu can be skipped once the corridor opens | Move the AES IV from the tag into Trial VII's plaintext |
| M2 | major | Prose mixed into copyable ciphertext silently garbles Vigenère, Base64 and RSA Verify | Rule: `fileContent` is ciphertext only; framing in `observations`; split the report into three files |
| M3 | major | The double-agent ending hinges on one briefing note from 45 minutes earlier | Star the note; Cliffe's pre-decision scoreboard line |
| M4 | major | About 85 minutes for a real first-year, against a 50-60 budget | Cut L3 now; Tom and Sidhu hand over their field notes in person; stopwatch the first blind playtest |
| M5 | major | Ghost is silent between L1 and the climax | Five or six static terminal lines on Trial completions, plus HaX's suspicion beat |
| M6 | major | Tom and Sidhu have no beat of their own; Cliffe's doesn't touch the plot | Tom's lid and Magic lines; Sidhu's "it verifies, it doesn't tell you whether to send it"; Cliffe's scoreboard line |

Minors m1-m13 can be folded in during the build. A round-2 reviewer should check B1's probe (pop-out tab keeps state while the player walks and copies), the M1 IV move against the generator and both checkers, and the text_file layout rule in M2.
