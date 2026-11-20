# The Keyholder Trials: design review, round 2, reviewer B

## 0. Scope and method

Reviewed: `DESIGN.md` v2 (including "Changes in v2"), against `docs/agents/TESSERACT_TRIALS_BRIEF.md` (no assumed knowledge, no quizzes, no new engine features), `DECISIONS_LOG.md` (its decisions override mine), `REVIEW_R1_A.md`, `REVIEW_R1_B.md` and `AGENTS.md`.

Kind of game: lab scenario with SAFETYNET spy framing. The aim is a fun 45-60 minute escape room for a first-year who starts from nothing, with every lock opened in CyberChef and dialogue in the campaign's style, lighter and shorter.

I played the design three times in my head: as a beginner, as a student hunting for shortcuts, and as a player who wants a story. Checks I ran beyond reading:
- **Server code:** `app/models/break_escape/game.rb:843-975` (unlock validation), `:1862-1913` (stripping), `app/controllers/break_escape/games_controller.rb:478-508` (container endpoint) and `:846-930` (unlock endpoint).
- **The D1 diff:** `git diff public/break_escape/js/utils/crypto-workstation.js`.
- **The notepad:** `public/break_escape/js/minigames/notes/notes-minigame.js:524-560`.
- **CyberChef's own operations:** I ran them against the designer's seed-42 artefacts (`scratchpad/designer/out42.json`), using npm `cyberchef@10.19.4`, the bundled version. Scripts are `scratchpad/review-r2-b/r2b_t.mjs` and `r2b_t2.mjs`, with copies in `scratchpad/designer/`, where they resolve the package. Results are quoted where I use them.
- **m02's Ghost ink** (`m02_phone_ghost.ink:1-200`, `:527-600`) and **m01's briefing** (`m01_opening_briefing.ink`), for voice.

Severity: **blocker** means the target player can't finish; **major** means change it before the build; **minor** means fix it during the build. Findings marked "approval" need the user, because they touch the engine.

## 1. Play-through as a complete beginner

The player: a first-year who doesn't know what a bit is, has never seen CyberChef, and reads the field notes when they're offered.

### 1.1 Step by step

| Step | What they see | What they must understand | Where they learned it | Jumps and gaps |
|---|---|---|---|---|
| Briefing | HaX, six beats, the starred "Comms discipline" note | Cover story, Ghost, the fallback channel | The briefing | HaX's "Ghost saw a hood and a cursor" gets m02 backwards: in m02 the *player* saw a hood and a cursor (`m02_phone_ghost.ink:538-540`). See R2B-m1. |
| Foyer exhibits | Byte Wall, plaque, powers-of-two poster, ASCII chart, paper tape | Bit, byte, place values, 77 = "M" | The objects themselves, each with a worked example | None. Still the strongest part of the design. |
| Tom, lab | Laptop, FN1-FN3, chalkboard "Hi" three ways, the Magic and pop-out lines | Input, recipe, output; where the pop-out button is | Tom's spoken lines | **Where in CyberChef do I click?** Searching for an operation, adding it to the recipe, and where Input and Output are: only Tom says this, out loud, once. FN1's "In CyberChef" line is about the pop-out button only (DESIGN:359). This is the first hands-on step of the game, and nothing the player can reread covers it (R2B-M6). |
| L1 leaflet | Decimal codes, then "Verify everything we send you. Key fingerprint: …" in the same note text (DESIGN:87) | One number is one character | ASCII chart, plaque, FN2 | **If they select the whole note and paste it, the first decode of the game fails.** From Decimal on the codes plus the fingerprint line gives "ERROR: Data is not a valid byteArray" (`r2b_t2.mjs`), the same error the L2 trap uses. Build rule 3 was written to stop exactly this (R2B-M5). HaX's nudge "Your ASCII chart starts there" is wrong: the chart starts at 32 (R2B-m4). |
| L2 locker | Eight digits, a four-digit keypad, Megan stuck | "4" is the character 52; split into pairs | FN2, Megan, the L2 nudge | Good teaching. One wrinkle: the design says Magic "reads it as hex and gives junk" (DESIGN:175). It actually gives four readable capital letters, "IVTH" (`r2b_t.mjs`), because 0x48-0x57 is H-W. A beginner may try to fit "IVTH" to the keypad (R2B-m2). |
| L3, L4 | Binary card; run-together hex | Same bytes, base 2 and base 16 | FN1, FN3, chalkboard | None. Quick. |
| L5 poster | Base64 with the "Hi!" → "SGkh" example | Six bits per symbol | Poster observations, FN4 | None. The plaintext says "returns trolley", but the slip is in a returned book (DESIGN:114, `:243`) (R2B-m5). |
| L6 slip | Base64, then shifted letters; "Shift: the number of this Trial" | Layers; a Caesar shift is a key | FN5, rung 3 | Two small steps: Roman VI = 6, and the operation is called ROT13. FN5 and rung 3 cover both. Fine. |
| L7 Vigenère | `trial_vii.txt`; "the ledger of the man who checks everything twice" | Key word, block 4 | Observations, Ghost's line, rung 2 | The riddle is fair. **The output then hands over three things at once: the porter's code, the pigeonhole number, and "The IV travels with this letter: <32 hex>".** The player hasn't met the word "IV" yet: FN8 is only offered once the pigeonholes open (DESIGN:366). They are told to keep it (rung 3) but not where. See below. |
| Pigeonholes | Four Base64 envelopes | Which one is theirs | The plaintext ("number four") | Fine. |
| L8a RSA | FN9; their envelope | Only the private key opens it; it's on "Your lab account", set up 30-40 minutes earlier | FN9, Tom's README, rung 2 | FN9 says "paste your private key PEM" but not where the key is (R2B-m8). Nobody says how the Keyholder got the player's public key, which is the lesson itself (R2B-m9). The walk to the lab and back is fine with D1. |
| L8b AES | FN8; tag in the notepad | Key from L8a, IV from L7, ciphertext from the tag | FN8, rung 3 | **Three values from three places, and one clipboard.** See below. |
| L10 hash | Final Trial card | Fingerprint; Size 256; first eight characters | FN7 (Sidhu, desk copy or HaX), the card | Mostly sound. "Size 256" is set without knowing why; one line links it to the basics: 256 bits = 64 hex digits, because each hex digit is four bits (step 0c). The SHA2 panel also shows a "Rounds" box the player must leave alone (R2B-m7). |
| Video call | Ghost on screen | Ghost knows who they are | m02, or briefing beat 2 | Lands (section 3). |
| The report | `report.b64` → From Base64 → a field report ending in `<img src="…/px/merlin-2685.png" width="1" height="1">` | That a one-pixel remote image tells its server where the file was opened | **Nowhere.** | This is the climax's key realisation, and it depends on HTML and tracking pixels, which the game never teaches. That breaks "Assumed knowledge: none" right at the turn of the story (R2B-M3). |
| Integrity and signature (optional) | `report.sha256`, `report.sig`, `keyholder_public.pem`, FN10 | Hash the file as given; verify with Message = the Base64 text | FN10, "put the message in Message" | **Most natural beginner moves give "Verification Failure", which reads as "the report has been tampered with".** See below. |
| Choice and debrief | HaX hub, scoreboard, Cliffe | Out-of-band channel | Starred note, postit, smartscreen, Cliffe | A player who sent without decoding never learns what the pixel was. The debrief should say it plainly (R2B-m14). |

### 1.2 The Vigenère → pigeonholes → RSA → AES chain

The ideas are taught in a sensible order: key word, then key pair, then shared key plus IV, then hybrid. The problem is carrying values between steps.

- **The IV.** It appears in CyberChef's Output at L7. The player needs it again at L8b, after building and running the whole RSA recipe in the same CyberChef, which replaces that Output. D1 keeps CyberChef's state when the laptop closes, but it doesn't keep an old output once the recipe changes. A beginner who didn't write it down has to walk back to the library, reopen the safe, copy `trial_vii.txt` and rebuild the Vigenère recipe. That's 4-6 minutes and a real chance of giving up.
- **AES itself** needs the key (in RSA's Output), the IV (wherever they kept it) and the ciphertext (a note in the notepad, which can't be open at the same time as the laptop). That's seven or eight open/close/copy/paste moves, which is acceptable *if the player has somewhere to put things*.
- **The engine already has that place.** Every note in the notepad has an editable observations box with a pencil button ("Click edit to add your observations...", `notes-minigame.js:142-187`, `:524-560`), and the text is saved to the note (`saveObservationToNote`). The "Tag on the drop box" note is the obvious scratch pad: paste the IV there at L7 and the AES key there at L8a, and AES becomes three pastes from one page. The design never mentions it (R2B-M4).

### 1.3 The hash with Size 256

Good. The card, FN7 and rung 3 all say "set Size to 256 (it starts on 512)", and the verifier shows that 512 and a trailing new line give different first characters (DESIGN:307-308). Two cheap additions (R2B-m7):
- explain *why* 256, using what the player already knows: "SHA-256 gives 256 bits: 64 hex digits, since each hex digit is four bits";
- point out the easiest correct method: add SHA2 *under* AES Decrypt in the recipe they already have. It hashes exactly the bytes that opened the box, so no stray new line is possible.

### 1.4 The signature check

The verifier's "Verified OK" is right for its exact inputs. A beginner's inputs are rarely exact. Tested with CyberChef 10.19.4's RSA Verify on the seed-42 report (`r2b_t.mjs`):

| What the beginner does | Result |
|---|---|
| Message = contents of `report.b64`, Message format Raw, digest SHA-256 | Verified OK |
| Message = the *decoded* report (it's "the message" they just read) | **Verification Failure** |
| Message format set to **Base64** ("it's a .b64 file") | **Verification Failure** |
| Digest left on the default SHA-1 | **Verification Failure** |
| A new line after the pasted message | **Verification Failure** |
| Signature not run through From Base64 | ERROR: signature length (344) doesn't match (distinct, fine) |
| Public key pasted after the pre-filled "BEGIN RSA PUBLIC KEY" line | Verified OK (fine) |

The same applies to the hash: SHA2 of the decoded report doesn't match `report.sha256`, because both were made from the Base64 text (`generate.rb:141-142`).

The design mentions the digest trap (DESIGN:170) but not the other two. RSA Verify has a "Message format" option (Raw / Hex / Base64, default Raw) that the design never names. FN10 says only "put the message in Message" (DESIGN:368). The result is the opposite of the lesson: a careful student checks the report and concludes Ghost's file has been tampered with. It also undercuts Sidhu's "It verifies" beat (R2B-M2).

### 1.5 The finale

Mechanically sound: reopen the terminal, From Base64, read. The gap is in understanding (1.1, last rows). The beacon is an HTML `<img>` tag. A student with no assumed knowledge sees an odd line of markup with a URL in it, and has to infer from Ghost's "Your handler's location is a number I can check" that opening it reveals a location. Some will. Many will see "a web address" and stop. The double-agent ending needs them to (a) see the line as the danger and (b) see `merlin-2685` as "what HaX most needs to know". Both rest on the untaught idea (R2B-M3).

### 1.6 Time estimate

For a real first-year, with walking, reading and the copy steps, and assuming D1 has landed:

| Block | DESIGN (v2) | My estimate |
|---|---|---|
| Briefing | 4 | 4 |
| Foyer exhibits, Jordan, Tom, first look at CyberChef | 9 | 11 |
| Act 1, L1-L4 | 13 | 14 |
| Act 2, L5-L7 with Sidhu and Megan's file | 16 | 18 |
| Act 3: pigeonholes, RSA, AES, workshop, hash | 15 | 20 (25 if the IV is lost and L7 redone) |
| Climax: call, decode, scoreboard, decide | 9 | 10 |
| Debrief | 4 | 4 |
| **Total** | **60-75** | **about 80 (70-90)** |

v2's cuts are real: notes handed over in person, shorter notes, recipes that name only the fields to fill. The remaining overrun is mostly Act 3 friction. That's why R2B-M4 (the notepad scratch pad) is the cheapest saving on the table, before anything is cut. Cutting is deferred to the first timed blind playtest (orchestrator decision), and I don't reopen it. I'd only note that Q3's first cut (L2) removes the game's best peer-teaching moment and saves about 4 minutes, which is less than R2B-M4 saves.

## 2. Play-through as a confident student looking for shortcuts

### 2.1 The stripping claim (`game.rb:1862`): holds

- `filter_requires_and_contents_recursive` (`game.rb:1862-1913`) deletes `requires` from every object that has a `lockType` other than biometric, bluetooth or rfid. It deletes `contents` from anything with `locked` truthy, leaving `hasContents: true`. It recurses into room objects, NPCs, `itemsHeld` and arrays. Both the bootstrap and the lazy room payload go through it (`filtered_room_data`, `game.rb:724-733`).
- The container endpoint refuses a locked container (`games_controller.rb:491-496`, `check_container_unlocked`), so its contents can't be fetched by id either.
- So page source and the network tab show only what's already visible in the world: ciphertexts, the open private key, the whiteboard key, the tag. None of those skips a step. Build rule 2 keeps per-game values out of the ink, so the ink JSON has nothing either.
- One build note: stripping depends on `lockType` being present. A locked object written with `requires` but no `lockType` would leak its answer. The validator probably catches a missing `lockType`, but the build should assert it for every lock (folded into R2B-M1's fix list).

### 2.2 But the unlock endpoint trusts the client's choice of method for objects (R2B-M1)

`validate_unlock` for an **object** (`game.rb:910-975`) switches on the `method` the client sends, not on the object's `lockType`:

```ruby
case method
when 'key', 'lockpick', 'biometric', 'bluetooth', 'ble', 'rfid', 'flag_reward'
  # Client validated the unlock - trust it
  return true
```

So `POST /games/:id/unlock` with `{targetType: "object", targetId: "relay_terminal", method: "key"}` opens a **password**-locked object without its password. The controller then returns its contents (`games_controller.rb:870-882`) and records it as unlocked (`unlock_object!`). Then `complete_task!` accepts the `unlock_object` task, because it only checks `object_unlocked?` (`game.rb:1052`).

Doors are safe: for a door, `'key'` checks the server-side inventory (`game.rb:875-878`). In this lab the object locks are L1, L2, L3, L6, L7, L8b, L10 and the scoreboard. A student with the browser console needs only L4 (From Hex) and L5 (From Base64) by hand. They can then pop the safe, pigeonholes, drop box (taking the real brass key, which the door then accepts), relay terminal and scoreboard. That gives `concludeRequires` and the double-agent ending with no cryptography at all.

This falsifies DESIGN:425 ("So the gate can't be faked from the client") and DESIGN:192 ("the envelopes can't be read … until the server accepts the password"). There's no rate limiting on `unlock` either (no throttle in `app/` or `config/`), but with this bypass that hardly matters.

It's an engine bug that affects every mission, so it goes to the user. For a first-year lab, most players will never open the console. A Cyber Security class contains exactly the students who will, though, and an "unbreakable" chain that breaks to one fetch is a poor look for this lab in particular.

### 2.3 Magic, brute force, guessing, the pop-out tab

| Lock | Magic | Brute force or guessing | Verdict |
|---|---|---|---|
| L1 | Solves it | Pool of 8 words | Fine, by design (brief constraint 5) |
| L2 | Reads it as hex: "IVTH" | 10,000 PINs; lockout resets on reopen | Fine; see R2B-m2 for the wording |
| L3, L4, L5 | Solve them | L3 8 words; L4 6 | Fine, early |
| L6 | Peels Base64, stops at shifted text | ROT13 Brute Force is the intended lesson | Fine |
| L7 | No checks; no CyberChef solver | Pigeonhole code 6 × 90 = 540 | Needs the key, as intended |
| L8a, L8b | No | Guessed IVs never give the answer (100 seeds, DESIGN:323) | Sound |
| L10 | No | Needs `pass8` | Sound |
| Scoreboard | n/a | 6 × 9,000 tokens | Sound |

- **Source readers.** `origin` is `github.com/cliffe/BreakEscape`. If it's public, the ERB's word pools are readable. L1 (8 words), L3 (8), L4 (6) and L6 (6) can then be guessed by hand in a minute or two. The early locks fall to Magic anyway, and per-game variety still stops answer-sharing between students. Widening those four pools to 25-30 words each costs nothing (R2B-m13).
- **Pop-out tab.** With D1, the new tab carries the live recipe and input over through the URL hash (`crypto-workstation.js`, `openCryptoWorkstationInNewTab`). It's a plain CyberChef page with no game data, so there's no shortcut. It's a help: a second tab is a second scratch area, and Tom could say so.
- **Reading the Vigenère ciphertext without the key.** The IV's digits show through (DESIGN:260), and the plaintext template is public. Neither helps, because the key is on an unlocked whiteboard anyway and the AES key is still sealed.
- **Skipping the library** (round-1 M1) is closed for anyone playing through the UI (section 4).

## 3. Play-through for the story

### 3.1 Fun, tension, surprises

- **Fun.** The premise still carries it: every decode is an audition, and you're a student playing a student. The early rooms are a pleasant, steady climb. Act 3 is where the satisfaction is (your own key pair opens your own envelope), provided R2B-M4 stops the drudgery from swamping it.
- **Tension.** Low in Acts 1-2, as befits a lab. Ghost's six lines (DESIGN:477-482) give it a pulse. The candidate file and the Megan choice give it a conscience. The tension proper starts at the video call, which is the right place for it.
- **Surprises that work:**
  - Cliffe's "Agent. … Student." slip;
  - the hoodie figure on his map;
  - Ghost being the examiner;
  - the pixel in the report;
  - the smartscreen figure "stays by the scoreboard" after the decision.
- **One surprise is telegraphed.** HaX's "I've read this voice before" at L4 (DESIGN:486) comes about 25 minutes in. For an m02 player, that and the Iapetus voice give the reveal away an hour early. That's dramatic irony rather than a twist, which is fine, so I don't tag it.
- **One mystery may read as a plot hole.** Ghost's drop box holds the key to Cliffe's workshop, and Ghost's relay terminal sits beside Cliffe's Hacktivity scoreboard. Cliffe's "Though I suppose you had the key. Interesting, that." acknowledges it, which is good. Nobody on SAFETYNET's side notices it, and HaX should, in one line ("The Keyholder's last Trial is in Schreuders' workshop. I'm not going to comment on that."). This is also the lever for making the choice harder (3.4).

### 3.2 The three academics

| Character | Beat people will remember | Fits the brief? | Gap |
|---|---|---|---|
| **Cliffe** | The "Agent. … Student." slip; the live map with the figure in your hoodie; "Scoreboard's been quiet today. Takes flags from anyone. Never asked who reads them." | Yes. Australian through word choice; a leader and story NPC rather than a helper; building something; knows you're an agent and doesn't say how; present at the climax; HaX: "That's classified." | None. The strongest of the three. |
| **Tom** | "It'll do nowt once there's a key. That's the bit they're paying for." | Yes: Huddersfield, helpful, gives the physical laptop | Both his beats are about using the tool, and he vanishes after Act 1. Two things in his own design are left unused: the Keyholder guest terminal (L3) sits **in his teaching lab**, and he "knows CryptoSecure's stand turned up without going through the department" (DESIGN:36), but no line says so. Fix (R2B-m10): when the player comes back for L3, Tom: "Someone's put a terminal in my lab I never ordered. Half a mind to break into it myself. Go on then, you first." That's "keen interest in practical hacking challenges" in one line, and it gives him a reason to remember the player. |
| **Sidhu** | "It verifies. That tells you who wrote it, and that nobody has changed it. It does not tell you whether you should send it." | Yes: Indian English through register; hashing, integrity, signatures; the blockchain ledger whiteboard | **His best line needs an unprompted walk back to his office during the climax** (DESIGN:37), and nothing sends the player there. Most players will never hear it. And if the player tried to verify and hit R2B-M2's false "Verification Failure", his line would contradict what they saw (R2B-M7). |

### 3.3 Ghost's on-screen offer

It mostly lands:
- the name ("You've been calling me Keyholder all day. At St Catherine's you didn't call me anything. You just listened.");
- the motive in Ghost's m02 idiom ("Your handler's location is a number I can check"; compare m02's "I showed my working. They didn't.", `m02_phone_ghost.ink:96-104`);
- "Read it. You've earned the right to read anything I give you.", which invites exactly the act the climax tests;
- "The relay closes when you leave the building. I don't."

Three things would make it hit harder, all of them lines (R2B-m11):
- **How Ghost recognises 0x00.** In m02 the player saw Ghost on video, not the other way round. Give Ghost the mechanism, in numbers: "St Catherine's had forty-one cameras. I switched off the recorders, not the cameras." That's consistent with m02's "RECORDER OFFLINE" monitors (`m02 scenario.json.erb:3005`).
- **The callback.** Ghost made 0x00 an offer at St Catherine's too (`m02_phone_ghost.ink:550`, "I'm going to make you an offer. Once."). Ghost knowing that this is the second one is the most m02 line available: "The last time I made you an offer there was a ward in the next room. This one's simpler." It works whichever way the player answered in m02.
- **Two Ghost lines are off-voice.** "Hybrid encryption. It's what we do, you know. You're good at it." The "you know" is filler, and Ghost doesn't flatter. Something like: "Hybrid encryption. Nine candidates got this far. It's how forty of our invoices opened last year." And "Or you did, and you were quick about it" (L4) is a joke; Ghost needles, it doesn't banter.

### 3.4 Is the choice hard?

For a player who decodes the report, not really. Once they've seen the pixel and know the scoreboard:
- **double** (warn, then send) costs nothing visible and wins;
- **refuse** is the clean answer;
- **send** is reached mainly by not reading.

So the climax is a test of attention (DESIGN:185 says so) with a moral garnish. That suits a lab, but the brief's "TV spy thriller" bar wants a real pull in two directions. Two cheap levers, both only lines (R2B-M8):

1. **Doubt the safe channel.** Ghost had a key to this room (the brass key came out of Ghost's drop box). One Ghost line in the offer: "I'd stay off Dr Schreuders' machines, if I were you. I've had a key to this room since August." Cliffe's "Never asked who reads them" then cuts both ways. The double route becomes a bet on the scoreboard (actually safe; the debrief confirms it). Trade-off: some players will be scared off it, which makes the best ending rarer, the risk round-1 M3 worked to remove. I'd still take it, because a choice you have to trust your way into is the drama. If the orchestrator disagrees, use lever 2 alone.
2. **Price each route before the choice.** Ghost says what refusal costs ("Say no and you're the candidate who walked away. So is Miss Oyelaran; I don't keep one without the other."). HaX's debrief names what double costs ("Ghost will ask again, and next time it'll be something we can't fake."). Then refuse and double each cost something, and send has a pull for a player who has protected Megan.

### 3.5 Does the debrief pay things off?

Mostly yes:
- "Did you read it before you sent it?";
- "I said I'd take either. … I didn't enjoy learning it.";
- the replaced handset paying off "it listens";
- Megan and Jordan by ending;
- Cliffe stays classified;
- "You can read Base64 now. Most people who'd have opened that report can't."

Gaps:
- **The pixel is never explained.** A player on the "sent" route who didn't decode never learns what was in the report, and that's the lab's whole point. Add one line in every ending's opening: "One pixel. A picture too small to see, fetched from Ghost's server the moment anyone opens the report. That's all a location costs." (R2B-m14, and it's part of R2B-M3's fix.)
- **Tom and Sidhu get no pay-off.** Two unconditional credit lines in CAMPUS would do it: "DR TOM SHAW: Reported the stand to the department." / "DR SIDHU SELVARAJAN: Still checks everything twice." (R2B-m10).

### 3.6 HaX's voice (against m01/m02)

m01's HaX is brisk, plain and practical, in short declaratives ("Get inside, find out what ENTROPY is planning, and report back."). The design's HaX fits:
- "Brass. Old-fashioned. Someone wants you to knock.";
- "Not on this line. Leave it with me.";
- "Classified isn't the same as 'I don't know', Agent. Leave it there.";
- "Congratulations. You now work for both of us. Only one of us knows."

It drifts in only one place. The gamble line (DESIGN:466) is long, has the m02 inversion (R2B-m1), and stacks three clauses where m01's HaX would use two sentences. Suggested: "Ghost never saw your face. A voice on a console at three in the morning. And if they do know you and still want you, that tells us more than a clean recruit ever could. I'll take either."

### 3.7 No quizzes

Still none. My suggestions add remarks and lines, not questions.

## 4. Closure of round-1 review B findings

| R1 finding | v2 response | Status | Evidence and residue |
|---|---|---|---|
| **B1** blocker: CyberChef forgets on close | Engine change D1 (user-approved) plus Tom's pop-out line and FN1 | **Closed** | The diff loads the iframe once and only hides it on close; the new-tab button passes the live hash. Node test `test/js/crypto-workstation-persist.test.mjs`; browser games 1571/1572 (DECISIONS_LOG). Residue: build rule 12 and R10 still say "in progress" or "until it lands" (DESIGN:277, `:664`), but it has landed (uncommitted). Update the wording; minor. |
| **B-M1** library, Vigenère and Sidhu skippable | Pigeonholes password-locked with a code found only in the Vigenère plaintext; IV moved into that plaintext | **Closed** for UI play | Locked contents are stripped and the container endpoint refuses (section 2.1), and a guessed IV never decrypts (DESIGN:323). The R2B-M1 console bypass reopens it for console users, but that's a separate engine finding. Sidhu himself stays optional, because his whiteboard is readable without him. That's acceptable, but it's why his climax beat is fragile (R2B-M7). |
| **B-M2** prose mixed into copyable ciphertext | Build rule 3; report split into three files | **Closed for text files; one note left** | The Keyholder leaflet still puts the fingerprint line in the same text as the decimal codes (DESIGN:87), and the whole-note copy fails at L1 (R2B-M5). |
| **B-M3** double ending hinges on one briefing note | Starred note, lower-case token, postit, smartscreen variant, Cliffe's line, task title | **Closed for findability** | The *mechanics* of finding the channel are now well signposted. Understanding *why the token matters* still needs the pixel idea, which isn't taught (R2B-M3). |
| **B-M4** about 85 minutes | Notes in person, shorter notes, D1, cut list deferred to a timed playtest | **Partly closed; rest deferred by decision** | My v2 estimate is about 80 (section 1.6), down from 85, against the design's 60-75. Act 3 friction is the cheapest remaining saving (R2B-M4). |
| **B-M5** Ghost silent until the call | Six static lines plus HaX's suspicion beat | **Closed** | DESIGN:473-486. Two lines are off-voice (R2B-m11). R18 (timed messages on the second device) is still a first-run probe. |
| **B-M6** academics need memorable beats | Tom's Magic and pop-out lines; Sidhu's "it doesn't tell you whether to send it"; Cliffe's scoreboard line and smartscreen | **Closed for Cliffe; partly for Tom and Sidhu** | Tom's beats are about the tool, not the plot (R2B-m10). Sidhu's line needs a walk nobody prompts (R2B-M7). |

Round-1 minors m1-m13 are all answered in DESIGN "Changes in v2". I spot-checked m1 (token lower case: `generate.rb:129`), m5 ("Hi!" → "SGkh" on the poster), m6 (-6 first), m9 (Size 256) and m10 ("signs"): all present. One residue on m1/R11: DESIGN:168 and rule 7 say every typed answer is "at most 11 characters" ("4-11"). `letterbox-NN` and `lockstock-NN` are 12 and `peregrine-NNNN` is 14. All are well under 50, so only the claim is wrong (R2B-m3).

## 5. Findings

No blockers.

### Majors

**R2B-M1 (major, approval: engine): object unlocks trust the client's choice of method.**
- **Problem.** `game.rb:956-958` returns `true` for any object when the client sends `method` `key`, `lockpick`, `biometric`, `bluetooth`, `ble`, `rfid` or `flag_reward`, whatever the object's `lockType`. One console `fetch` opens L1-L3, L6, L7, L8b, L10 and the scoreboard, completes their tasks, and satisfies `concludeRequires`. DESIGN:192 and `:425` say this can't happen.
- **Engine fix, for the user.** In the object branch, check `method` against the object's `lockType`:
  - `password`/`pin` only by `attempt`;
  - `key` only with `has_key_in_inventory?(object['requires'])`;
  - `lockpick` only on key locks, with a lockpick held;
  - `flag_reward` only from the server's own reward path.

  Add a Rails test for "password object + method key → false". Consider a per-game attempt counter on `unlock` while there.
- **Mission-local, now.**
  1. Correct DESIGN:192 and `:425` to say the gate is server-checked *through the UI* and that a console bypass exists until the engine fix.
  2. Add a build assertion that every locked object has a `lockType`, so `requires` is always stripped (2.1).
  3. Log the item in `DECISIONS_PENDING.md` beside E1/E2.

**R2B-M2 (major): the integrity and signature checks fail for a beginner's natural inputs, and the failure reads as "tampered".**
- **Problem.** Section 1.4: four common moves give "Verification Failure":
  - the decoded report as Message;
  - Message format set to Base64;
  - the digest left on SHA-1;
  - a trailing new line.

  The hash of the decoded report doesn't match either.
- **Fix:**
  - Put the instructions where the player is looking, in `observations` (not `content`), on:
    - `report.sha256`: "SHA-256 of report.b64 exactly as it is: the Base64 text, not what it decodes to.";
    - `report.sig`: "Signs report.b64 exactly as it is. In RSA Verify: Message = the contents of report.b64; Message format Raw; Message Digest Algorithm SHA-256."
  - Make FN10's "In CyberChef" line say the same, naming **Message format: leave on Raw**.
  - Add a sentence to FN10 for why: "Ghost signed the file you were given, byte for byte. Decode it and you're checking a different message."
  - Add these three INFO lines to `verify_cyberchef.mjs`, so the build keeps proving them: decoded-as-Message fails; Message format Base64 fails; SHA2 of the decoded text doesn't match.

**R2B-M3 (major): the climax depends on knowing what a tracking pixel is, which the game never teaches.**
- **Problem.** The report's danger is an `<img … width="1" height="1">` line (`generate.rb:137`). "Assumed knowledge: none" covers this as much as it covers bits. Without the idea, a beginner can't see the threat or why the token is "what HaX most needs to know".
- **Fix, all text:**
  1. **Plant it early, in the world.** The CryptoSecure sign-up laptop's examine text (foyer) gets a marketing line: "CryptoSecure Mailer: know the moment your email is opened, and where!" Tom's or Jordan's reply explains it in one breath, for example Tom: "That's a one-pixel picture in the email. Your mail app fetches it, and their server learns when and where you opened it. Turn remote images off." It costs a line and pays off an hour later.
  2. **Make the URL say it.** Use `…/px/locate/merlin-2685.png` or `…/whereis/merlin-2685.png`, so even a skim reads "locate".
  3. **Add one sentence to FN10's extract:** "A signature hides nothing, so read what you send. A document can carry a remote image that reports where it was opened."
  4. **The debrief explains it on every route** (R2B-m14).

**R2B-M4 (major): Act 3 asks the player to carry three values between steps with nowhere taught to keep them.**
- **Problem.** The IV appears at L7 and is needed at L8b, after the RSA step has replaced the Output. The AES key appears in RSA's Output. The ciphertext is a notepad note. A lost IV means redoing L7 (+4-6 minutes).
- **Fix.** Use the notepad's editable observations (`notes-minigame.js:142-187`, `:524-560`), which exist already:
  - Tom, with the handouts: "Your notepad's got a pencil on every page. Paste owt you'll need later in there.";
  - `trial_vii.txt` observations: "Keep everything it tells you.";
  - the L7 rung 3 and the HaX nudge on `open_pigeonholes`: "Got the IV from Trial VII? Paste it onto the drop box tag in your notepad, with the pencil.";
  - the tag's authored observations end "Key: … IV: …" as blanks to fill.

  Probe it in the first run: paste into the observations box, close, reopen, reload.

**R2B-M5 (major): the very first decode can fail on a whole-note copy.**
- **Problem.** The leaflet's text has the fingerprint line under the decimal codes (DESIGN:87). Selecting all of it gives "ERROR: Data is not a valid byteArray" (`r2b_t2.mjs`), the same error as the L2 trap, at the moment a beginner is least sure what they're doing.
- **Fix.** Text = the codes only. Move "Verify everything we send you. Key fingerprint: <16 hex>" to `observations`, which take per-game values safely because they're never spoken. Add a verifier line: L1 decodes from the note's full `text`.

**R2B-M6 (major): how to drive CyberChef is never written down.**
- **Problem.** Tom says it aloud, once. FN1's "In CyberChef" line only says where the pop-out button is.
- **Fix.** Three lines in FN1, generic:
  1. "Paste into **Input** (top right)."
  2. "Type the operation's name in **Search** (top left) and double-click it to add it to the **Recipe** (middle)."
  3. "The answer appears in **Output** (bottom right). The bin icon on the Recipe clears it."

  It's the most-used instruction in the game.

**R2B-M7 (major, story): Sidhu's best scene is reachable only by an unprompted walk back.**
- **Problem.** "It does not tell you whether you should send it" needs the player to take the report to his office between the call and the decision. Nothing sends them.
- **Fix:**
  - Plant it when he hands over FN10: "If anyone hands you something signed, bring it to me. I like to watch a signature check out."
  - Point at it in `report.sig`'s observations: "Dr Selvarajan would want to see this."
  - Optionally make the line also reachable after the decision (gated `relay_opened`), so a player who comes later still gets it in past tense ("It verified, I expect. That was never the question.").

  Make sure R2B-M2 is fixed first, or his line contradicts what the player saw.

**R2B-M8 (major, story): for a player who reads the report, the choice isn't hard.**
- **Problem.** Double dominates, with no visible cost (3.4).
- **Fix:**
  - Lever 1: Ghost's "I've had a key to this room since August" line puts doubt on the scoreboard.
  - Lever 2: price each route before the choice, through Ghost's refusal cost and HaX's debrief cost for double.
  - Add HaX's one line noticing that Ghost's relay is in Cliffe's workshop (3.1).

  Lines only; no mechanics change.

**R2B-M9 (major, deferred by decision): play time.**
- About 80 minutes (70-90) against the brief's 45-60 and the design's 60-75 (section 1.6).
- No new action beyond the orchestrator's decision to time the first blind playtest. Do R2B-M4 and R2B-M6 before that playtest, because they're the cheapest minutes.

### Minors

- **R2B-m1.** HaX's gamble line inverts m02 ("Ghost saw a hood and a cursor"; in m02 the player saw Ghost, `m02_phone_ghost.ink:538-540`). Rewrite it as in 3.6, and give Ghost the camera line (3.3) so the gamble visibly fails.
- **R2B-m2.** L2: Magic or From Hex on the card gives "IVTH", not junk. Change DESIGN:175, and give Megan or the L2 rung the line "If you got four capital letters, it's read your digits as hex."
- **R2B-m3.** "At most 11 characters" / "4-11" (DESIGN:168, rule 7) is wrong: up to 14 (`peregrine-NNNN`). It's harmless against the 50 limit; fix the claim.
- **R2B-m4.** The L1 nudge "Your ASCII chart starts there": the chart starts at 32. Say "Look them up on your ASCII chart."
- **R2B-m5.** The L5 plaintext says "The returns trolley has your next trial", but the slip is in a returned book. Either name the object "Returns trolley" or change the sentence ("The returns shelf has your next trial").
- **R2B-m6.** The player meets "IV" in the L7 plaintext before FN8. One sentence in `trial_vii.txt`'s observations or the L7 nudge: "An IV is a starting value for a cipher. It isn't secret, but you'll need it. Keep it."
- **R2B-m7.** The hash: explain 256 = 64 hex digits × 4 bits; "leave Rounds alone"; suggest adding SHA2 under AES Decrypt in the recipe already open.
- **R2B-m8.** FN9's handler note should say where the private key is: "Dr Shaw put your key pair on your lab account."
- **R2B-m9.** Nothing says how the Keyholder sealed an envelope to the player's key. One line in Tom's README: "Your public key goes in the department directory. Anyone can use it to send you something. That's the point." That *is* the key-distribution lesson.
- **R2B-m10.** Tom: a line on the guest terminal in his lab, and his CryptoSecure suspicion (3.2). Credits lines for Tom and Sidhu (3.5).
- **R2B-m11.** Ghost:
  - the camera line, for how Ghost recognises 0x00;
  - the m02 offer callback;
  - rewrite the "you know" and "you were quick about it" lines (3.3).
- **R2B-m12.** Update rule 12 and R10: D1 has landed (uncommitted), so it's no longer "in progress".
- **R2B-m13.** If the repo is public, the L1/L3/L4/L6 pools (6-8 words) are guessable by a source reader. Widen them to 25-30 words each.
- **R2B-m14.** The debrief explains the pixel in plain words on every route, including for the player who sent without reading (3.5).

## 6. Withdrawn

Findings I drafted, checked, and dropped:

- **"Locked contents can be read from page source or by fetching the container."** Withdrawn: stripped by `game.rb:1876-1879`, and the container endpoint refuses a locked container (`games_controller.rb:491-496`). The real hole is the unlock method (R2B-M1), not the stripping.
- **"Pasting Ghost's public key after RSA Verify's pre-filled 'BEGIN RSA PUBLIC KEY' line breaks it."** Withdrawn: Verified OK, with or without a new line between (`r2b_t.mjs`).
- **"A Vigenère key typed in capitals, or an IV pasted in upper-case hex, breaks the decode."** Withdrawn: both give the right answer (`r2b_t.mjs`).
- **"A trailing new line on a copied ciphertext breaks L1 or L7."** Withdrawn: From Decimal and Vigenère Decode both ignore it (`r2b_t.mjs`, `r2b_t2.mjs`). It does break RSA Verify's Message, which is part of R2B-M2.
- **"Swapping the AES key and IV gives a plausible wrong answer."** Withdrawn: it errors ("Unable to decrypt input with these parameters."), so a mistake is visible.
- **"Ghost's per-Trial lines can fire before the player holds the Keyholder device."** Withdrawn: the first is on `open_locker`, and the locker's card comes out of the lockbox along with the device.
- **"Re-raise cutting L3."** Withdrawn: the orchestrator decided to keep it until the timed playtest (DECISIONS_LOG), and that decision overrides reviewers.

## 7. Verdict

**Build after fixes. No blockers.** v2 closes round-1 B's blocker and four of its six majors outright. The other two are closed in part: play time is deferred by decision, and Tom and Sidhu's beats are only half there. The library branch now gates the endgame, the copy rule is in, and Ghost is a presence before the call.

What's left falls into three groups:
- **one engine hole for the user** (R2B-M1: object unlocks trust the client's method), which also makes two of the design's security claims false;
- **five teaching fixes**, all text or object fields (R2B-M2 to M6). Most come from the same root: a beginner given exact recipes still has to carry values, choose CyberChef fields the notes don't name, and recognise an idea the game never taught. They are cheap, and R2B-M4 and M6 are also the cheapest minutes off the play time;
- **two story fixes, lines only** (R2B-M7 Sidhu's scene, R2B-M8 the choice), plus the deferred timing (M9).

Round 3 should confirm:
- the leaflet's text holds the codes only;
- FN10 and the report files name Message format Raw and "the Base64 text as given";
- the pixel is planted before the climax and explained in the debrief;
- the notepad scratch-pad instructions are in;
- Sidhu's line has a prompt;
- DESIGN:192 and `:425` are corrected, and R2B-M1 is in the approval log.

| # | Severity | One line |
|---|---|---|
| R2B-M1 | major (engine, approval) | Any password-locked object opens from the console by sending `method: "key"` (`game.rb:956-958`); DESIGN:192/425 claims are false |
| R2B-M2 | major | Hash and signature checks fail for natural beginner inputs (decoded text, Message format Base64, SHA-1) and read as "tampered" |
| R2B-M3 | major | The climax's reveal depends on knowing what a tracking pixel is; never taught |
| R2B-M4 | major | Act 3 needs the IV, AES key and ciphertext carried between steps with nowhere taught to keep them; use the notepad's pencil |
| R2B-M5 | major | The leaflet's fingerprint line in the same text breaks a whole-note copy at L1 |
| R2B-M6 | major | How to drive CyberChef (Search, Recipe, Input, Output) is spoken once, never written |
| R2B-M7 | major (story) | Sidhu's signature line needs an unprompted walk back; plant and point to it |
| R2B-M8 | major (story) | For a reader the choice isn't hard: double costs nothing; add doubt or a price, in lines |
| R2B-M9 | major (deferred by decision) | About 80 minutes (70-90) against 45-60; time the first blind playtest |
