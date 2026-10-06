# The Keyholder Trials: tutor solution guide

An intro lab on encoding and encryption for first-year students. Every lock opens with something decoded in the in-game CyberChef. There are no VMs, no flags to submit and no combat. The mission is about 75 to 80 minutes for a typical beginner (see "Time estimate").

## How to use this guide

**The answers are different in every game.** The scenario is generated once per game, so the words, PINs, the Vigenère key, the pigeonhole number, the IV, the AES key and the RSA keys all change. This guide therefore gives where each clue is, the recipe, and the traps. The values marked "seed 42" are one example render, so you can see what a correct output looks like. They will not match a student's game. Do not read a seed-42 value out to a student as their answer.

Shapes stay the same in every game, and they help you check a student's screen:

| Lock | Answer shape | Seed 42 example |
|---|---|---|
| Trial I lockbox | lower-case word | `pebble` |
| Trial II locker | 4 digits | `1860` |
| Trial III guest terminal | lower-case word | `lantana` |
| Trial IV corridor door | lower-case word (last word of a sentence) | `cupola` |
| Trial V library door | 4 digits | `6191` |
| Trial VI safe | lower-case word (last word of a sentence) | `primer` |
| Trial VII pigeonholes | word, hyphen, 2 digits | `sorting-33` |
| Drop box | word, hyphen, 2 digits | `padlock-92` |
| Relay terminal | 8 hex characters | `8841f594` |
| Scoreboard (optional) | word, hyphen, 4 digits | `merlin-2685` |

**Passwords are exact.** They are case-sensitive, and a full stop, a space or a copied-in extra word makes them fail. The lock only says "Incorrect password. N attempts remaining." It never says why.

**The lock names.** The in-game cards and posters call the first seven locks Trial I to Trial VII. After that the chain is: an envelope in a pigeonhole, the drop box, a brass key, the workshop door and the relay terminal. This guide numbers the locks L1 to L10 as the design notes do, and gives the Trial name beside each.

| Guide | In-game name | Lock |
|---|---|---|
| L1 | Trial I | Foyer lockbox |
| L2 | Trial II | Candidate Locker 4 |
| L3 | Trial III | Keyholder guest terminal |
| L4 | Trial IV | Corridor door |
| L5 | Trial V | Library door |
| L6 | Trial VI | Special Collections safe |
| L7 | Trial VII | Pigeonholes |
| L8a, L8b | (no number) | Envelope, then the drop box |
| L9 | (none) | Workshop door (a real key) |
| L10 | Final Trial | Relay terminal |

**CyberChef basics, for you to demonstrate once.** Students get these from Field Note 1 and from Tom, but a student who has never seen CyberChef loses minutes here.

1. Open it from the inventory item "Lab Laptop (CyberChef)". The small up-arrow next to the cross pops it into its own browser tab, which lets the clue and the recipe sit side by side.
2. Paste the clue into **Input** (top right). Copy with a drag-select and Ctrl+C (Cmd+C on a Mac) from a note, or with the **Copy** button on a file. Never retype a code.
3. Type the operation's name into **Search** (top left) and double-click it. It lands in the **Recipe** (middle). Operations run top to bottom.
4. Read **Output** (bottom right). The bin icon above the recipe clears it.
5. Closing and reopening the laptop keeps the recipe and input. Reloading the page does not (see "Running it in a lab").

**Two habits to teach in the first five minutes.** Use the file's **Copy** button for any code, rather than selecting the text by hand on screen or in the notepad (a hand selection easily catches a file name, a heading or a space, and the notepad shows a typed ` -- ` as a dash). And write down anything you will need later with the pencil on a notepad page, because the IV and the AES key have to survive a long gap.

## Room map

```
 +--------------------+    +------------------------------+    +--------------------+
 | SPECIAL            |    |  WORKSHOP  (Dr Schreuders)   |    | SEMINAR ROOM       |
 | COLLECTIONS (open) |    |  relay terminal (L10)        |    | (open)             |
 | safe [L6]          |    |  Hacktivity scoreboard       |    | Dr Selvarajan      |
 |                    |    |  [brass key, L9]             |    | ledger whiteboard  |
 +---------+----------+    +--------------+---------------+    +---------+----------+
           | north                        | north                        | north
 +---------+-+   west   +-----------------+----------+   east   +--------+-------+
 |  LIBRARY  |<---------+      COMPUTING CORRIDOR    +--------->| SIDHU'S OFFICE |
 | [PIN, L5] |          |  [password, L4]            |          | (open)         |
 | returns   |          |  Trial V poster            |          | hash handout   |
 |  slip     |          |  pigeonholes [pw, L7]      |          | door card      |
 |           |          |  drop box [pw, L8b] + tag  |          |                |
 +-----------+          +-------------+--------------+          +----------------+
                                      | south
 +-----------+   west   +-------------+--------------+   east   +----------------+  east  +----------------+
 | TEACHING  |<---------+     FOYER  (START)         +--------->| COMMON ROOM    +------->| STAFF OFFICE   |
 | LAB       |  (open)  |  Jordan Pike + CryptoSecure|  (open)  | Megan, Cliffe  | (open) | (optional)     |
 | lab PC    |          |   stand and lockbox (L1)   |          | Locker 4 (L2)  |        | Dr Illiashenko |
 | guest     |          |  Byte Wall, plaque, ASCII  |          | noticeboard    |        +----------------+
 | terminal  |          |   chart, paper tape        |          +----------------+
 | (L3)      |          +-------------+--------------+
 +-----------+                        | south (open)
                        +-------------+--------------+
                        |  LECTURE THEATRE           |
                        |  Tom Shaw: laptop, FN1-3,  |
                        |  "Hi" whiteboard           |
                        +----------------------------+
```

Brackets are locks. The corridor, library and workshop are the only rooms you cannot walk into at the start. The corridor is the hub for Acts 2 and 3: the poster, the pigeonholes and the drop box are all there, and the library, Sidhu's office and the workshop open off it. Special Collections is through the library, and the seminar room through Sidhu's office (his door card says "Seminar room through the back"; the corridor directory lists both).

| Room | Door | What matters |
|---|---|---|
| Foyer | start | Jordan Pike hands over the leaflet. The lockbox (L1) is on the CryptoSecure stand. Exhibits (Byte Wall, plaque, powers-of-two poster, ASCII chart and paper tape on the display table) teach bits and ASCII and are optional. |
| Lecture theatre (south) | open | Tom Shaw gives the laptop and Field Notes 1 to 3. His whiteboard shows "Hi" three ways (optional). |
| Teaching lab (west) | open | "Your Lab Account" PC (aisle end of the front bench) holds the student's own RSA key pair. The Keyholder guest terminal (L3) is the black PC at the aisle end of the back bench. |
| Common room (east) | open | Candidate Locker 4 (L2), the end locker with a keypad. Megan Oyelaran, the noticeboard and Cliffe's laptop are optional. |
| Corridor (north) | password, L4 | Trial V poster (on the noticeboard), pigeonholes (L7), drop box with its tag (L8b). Exits to the library, Sidhu's office and the workshop. |
| Library (corridor, west) | PIN, L5 | Returns Slip, in *The Codebreakers* on the issue desk. |
| Special Collections (library, north) | open | Special Collections safe (L6), by the door. |
| Sidhu's office (corridor, east) | open | A desk copy of his hashing handout; his door card. |
| Seminar room (Sidhu's office, north) | open | Dr Selvarajan and his ledger whiteboard (the Vigenère key). |
| Workshop (corridor, north) | brass key, L9 | Relay terminal (L10) and the scoreboard. The endgame happens here. |
| Staff office (common room, east) | open | Optional. The department's open-plan staff office; nothing in it is needed to finish. |

**The chain at a glance.** Each arrow is "this opens the thing that holds the next clue".

```
Jordan -> leaflet --L1--> lockbox -> Trial II card --L2--> Locker 4 -> Trial III card
  --L3--> guest terminal -> trial_iv.hex --L4--> corridor door -> Trial V poster
  --L5--> library door -> Returns Slip --L6--> safe (Special Collections) -> trial_vii.txt
  + whiteboard key (seminar room) --L7--> pigeonholes (password + hole number + IV)
  your hole's envelope + lab PC private key --L8a--> AES key
  tag + AES key + IV --L8b--> drop box -> brass key + Final Trial card
  brass key --L9--> workshop --L10 (SHA-256 of the drop box passphrase)--> relay terminal
  -> Ghost's call -> report -> decision -> debrief -> credits
```

The library cannot be skipped. The pigeonhole password and the AES IV exist only inside the Vigenère text from the Special Collections safe, and the pigeonholes' contents are not sent to the browser until the lock opens. A student who goes straight to the drop box has nothing to decrypt it with.

## Before the first lock

1. **Briefing.** It plays by itself. Agent HaX (the handler, on a phone) sets up the cover: the student is Agent 0x00, going undercover as a first-year to get picked by CryptoSecure Recovery's Keyholder Studentship. It plays over the field HQ (background `hq4`). After HaX's line about Dr Shaw the background turns to the campus (`miskatonic_campus`), and four narrator lines walk the student up to the Computing building ("Miskatonic University. Freshers' week." … "Someone has put a CryptoSecure stand right inside the door."). Then the scene closes in the foyer and the Mission Brief note opens. A student can close it early; nothing later depends on the rest, and HaX can resend the "Comms Discipline" note.
2. **Jordan Pike (foyer, CryptoSecure stand).** Talking to him puts the Keyholder Leaflet in the notepad. The leaflet is a **notepad page**, not an item on the inventory bar. This is the single most common first-five-minutes stall, because the lockbox wants a word and no numbers are visible in the room. Jordan, HaX's text and the lockbox's own password screen all say to look in the Notepad.
3. **Tom Shaw (lecture theatre, through the foyer's south door).** Talking to him gives the laptop and Field Notes 1 to 3 (bits and bytes, characters are numbers, hex and binary). He stands at the front, by the demonstration bench, in view from the door; walk along the front strip, not into the seat rows (the rows are solid, and only the aisles go between them). His lab account PC and the guest terminal are in the teaching lab, west of the foyer; he says so.
4. **Optional exhibits.** The Byte Wall (an alarm panel showing lamps for 01001101), the plaque (64 + 8 + 4 + 1 = 77 = "M"), the ASCII chart and the paper tape teach the ideas before the first lock. Strong students skip them. Weak students should not.

---

## The locks

Each entry has the same parts: where to find the clue, what the lock teaches, the recipe, the common mistakes, and what to say to a stuck student.

HaX's phone has two helpers for any step: **[I'm stuck.]** gives a three-rung hint ladder for the current lock (rung 1 names the kind of thing, rung 2 the method, rung 3 the recipe), and **[Send me that field note]** sends the field note for the latest thing the student has met. Students can use these without you. The "what to say" lines below are for when you are standing next to them.

### L1. Trial I: the foyer lockbox (decimal to text)

- **Clue.** The Keyholder Leaflet, a notepad page that Jordan hands over. Its text is six or so numbers separated by spaces. Seed 42: `112 101 98 98 108 101`. (The leaflet's observations also carry a key fingerprint, which only matters in the finale.)
- **Lock.** Password pad on the CryptoSecure lockbox on the foyer stand. Five attempts.
- **Idea.** Text is stored as numbers. A character encoding is an agreed table from numbers to characters, and ASCII is the common one. Numbers between 97 and 122 are lower-case letters.
- **Recipe.**
  1. Copy the numbers from the notepad page into Input.
  2. **From Decimal**, Delimiter **Space**, "Support signed values" off (the defaults).
  3. The output is a lower-case word. Type it into the lockbox.
- **Inside.** The Trial II Card and the Keyholder Device. Taking the device opens a short chat with the "Keyholder" contact a few seconds later, which can interrupt a student who has already walked off. They close it with "Close the device."
- **Common mistakes.**
  - Not finding the numbers at all. Symptom: the student walks round the foyer reading exhibits. Fix: Notepad, page to "Keyholder Leaflet".
  - Looking the numbers up by hand on the ASCII chart. This works, and it is fine, only slow.
  - Typing the numbers into the lockbox. The pad then says "Incorrect password."
  - Typing a guess word. The pad counts the attempt ("4 attempts remaining").
- **Say to a stuck student.** "What did Jordan give you? Where does the game keep things you've been handed? Look at the numbers: what is the biggest and the smallest? Does anything on the wall turn numbers into letters?" If they still cannot start: "Search CyberChef for 'decimal'."

### L2. Trial II: Candidate Locker 4, common room (digits are characters too)

- **Clue.** The Trial II Card, from the lockbox. Eight digits run together. Seed 42: `49565448`.
- **Lock.** A four-digit PIN pad on the locker (east door of the foyer).
- **Idea.** The digits "0" to "9" are themselves characters, ASCII 48 to 57, each two digits long. So eight digits are four characters, and the characters are digits. Decimal codes are not a fixed width, so CyberChef cannot guess where one code ends.
- **Recipe.**
  1. Copy the eight digits into Input.
  2. **Type a space after every second digit** in the Input box itself, so `49565448` becomes `49 56 54 48`.
  3. **From Decimal** (Delimiter Space).
  4. The output is four digits. Type them on the keypad. Seed 42: `1860`.
- **Common mistakes (this is the first real trap; allow time).**
  - Running From Decimal on the unspaced digits. CyberChef shows **"Data is not a valid byteArray: [49565448]"**. It does not say that spaces are needed.
  - Running **From Hex** (or Magic) on the unspaced digits. This gives **four capital letters**, e.g. `IVTH` for seed 42. They look like an answer but the keypad takes only digits. Students who hit this should be told that the capitals mean something read their digits as hex.
  - Splitting in the wrong places (groups of three, say). The output is wrong characters or an error.
  - Three wrong PINs: the pad shows **"System locked"**. Closing and reopening the pad resets it.
- **Say to a stuck student.** "The keypad wants four digits and you have eight. What does that suggest about how many characters are hidden in them? What number range are the digits 0 to 9 in on the ASCII chart? Is that two digits or three?" Then: "CyberChef cannot guess where one code stops. Tell it, with a space."
- **Optional help in the room.** The noticeboard and Megan both nudge towards "read it as characters, not as a number". Send a stuck student to either rather than telling them.

### L3. Trial III: Keyholder guest terminal, teaching lab (binary)

- **Clue.** The Trial III Card, from Locker 4. Groups of eight 0s and 1s. Seed 42: seven groups starting `01101100 01100001 ...`.
- **Lock.** Password pad on the guest terminal PC in the teaching lab (west of the foyer).
- **Idea.** Binary is the same bytes as decimal, in base 2, eight bits per character.
- **Recipe.** Input: the whole card text. **From Binary** (Delimiter Space, Byte length 8). The output is a lower-case word. Seed 42: `lantana`.
- **Inside.** Once the terminal opens it shows `trial_iv.hex` (see L4).
- **Common mistakes.** Dropping a group when copying (the word is then short or wrong); reading it as hex; retyping rather than copying.
- **Say to a stuck student.** "Count the characters in a group. What number system uses only two symbols? Remember the Byte Wall: eight lamps."

### L4. Trial IV: the corridor door (hex)

- **Clue.** `trial_iv.hex`, a file on the guest terminal. It is **not** added to the notepad automatically. Use the file's Copy button. Seed 42: `636f727269646f7220646f6f7220706173737068726173653a206375706f6c61`.
- **Lock.** Password pad on the corridor door, north of the foyer. Three attempts.
- **Idea.** Hex is the same bytes in base 16: two digits per byte, so it can run together without spaces.
- **Recipe.** Input: the hex. **From Hex** (Delimiter Auto). The output is a sentence. Seed 42: `corridor door passphrase: cupola`. **Type only the last word.**
- **Common mistakes.**
  - Typing the whole sentence. The door says "Incorrect password. 2 attempts remaining." and does not say why. Students who give up here have usually decoded it correctly.
  - Retyping the long hex by hand and slipping a character.
  - Using From Decimal on it because the earlier lock did.
- **Say to a stuck student.** "Read what came out. Did the door ask for a sentence?"
- **What opens.** The corridor, and with it the second half of the mission.

### L5. Trial V: the library door (Base64)

- **Clue.** The Trial V Poster, on the wall in the corridor. Taking it puts it in the notepad. Seed 42: `VGhlIHJldHVybnMgc2hlbGYgaGFzIHlvdXIgbmV4dCB0cmlhbC4gTGlicmFyeSBrZXlwYWQ6IDYxOTE=`. Its observations carry a worked example ("Hi!" to SGkh).
- **Lock.** A four-digit PIN pad on the library door, west of the corridor.
- **Idea.** Base64 regroups three bytes into four six-bit pieces and writes each as one of 64 symbols. The `=` is padding. It is an encoding, not encryption: no key, and anyone (or Magic) can reverse it.
- **Recipe.** Input: the Base64. **From Base64** (the default alphabet and settings). The output ends with the PIN. Seed 42: `The returns shelf has your next trial. Library keypad: 6191`.
- **Common mistakes.**
  - Retyping. The pixel font makes `l` and `I` look alike. Copy and paste.
  - Dropping the `=` at the end while selecting.
  - Typing all of the sentence's digits or the wrong number. Only the four digits after "keypad:" are the PIN.
  - Choosing From Hex or From Decimal because those worked before. The letters, digits, plus and slash alphabet is the hint that it is Base64.
- **Say to a stuck student.** "What characters does it use? Which of the ones you've done uses the whole alphabet and digits? Look at the poster's example: what happens to three letters?"

### L6. Trial VI: the Special Collections safe (layers, and Caesar)

- **Clue.** The Returns Slip, on the library's returns shelf. Take it. Seed 42: `WXZraW9nciBJdXJya2l6b3V0eSB5Z2xrIHZneXljdXhqOiB2eG9za3g=`. Its observations say "Shift: the number of this Trial."
- **Lock.** Password pad on the safe in Special Collections, through the library's north door (it stands by that door). Five attempts.
- **Idea.** Encodings stack, and you peel the outside layer first. Caesar is the first cipher with a **key**: the shift. It has only 25 possible keys, which is why it is weak.
- **Recipe.**
  1. Input: the slip text.
  2. **From Base64.** The output is shifted gibberish that still looks like English words. Seed 42: `Yvkiogr Iurrkizouty yglk vgyycuxj: vxoskx`.
  3. **ROT13**, with **Amount** changed to **-6** (the shift is "this Trial", which is VI, which is 6). **Amount 20 gives the same result.** Leave "Rotate lower case chars" and "Rotate upper case chars" on and "Rotate numbers" off.
  4. The output is a sentence. Type the **last word**. Seed 42: `Special Collections safe password: primer` so `primer`.
  - Alternative: **ROT13 Brute Force** shows all 25 shifts. Students find the right line by eye. That is the "only 25 keys" lesson, and it is a good thing to accept.
- **Common mistakes.**
  - ROT13 left at its default Amount of 13. The output is a different wrong text.
  - Searching "caesar". **Caesar Box Cipher** appears first, and it is a different cipher. The operation they want is **ROT13**, which is CyberChef's Caesar shift.
  - Wrong order. ROT13 on the raw Base64 gives nothing useful.
  - Amount **+6** instead of **-6**. The text shifts the wrong way.
  - Not seeing that "Trial VI" gives the number 6. If nobody has seen Roman numerals before, say so.
  - Typing `Primer` with a capital P, or the whole sentence. Both fail ("Incorrect password. 4 attempts remaining.").
- **Say to a stuck student.** "You've undone one layer and you've got something that looks like English with the wrong letters. What did the slip say about 'shift'? What number trial is this? Which way do you need to shift back?"
- **Inside the safe.** `trial_vii.txt` (needed), `candidate_assessments` and `job_tape_hex` (optional; see "Optional content").

### L7. Trial VII: the pigeonholes, corridor (Vigenère, and keys travel separately)

This lock produces three things, not one. Make sure the student writes all three down.

- **Clue (ciphertext).** `trial_vii.txt`, in the Special Collections safe. Use its **Copy button**. Its observations say the key is "the last entry in the ledger of the man who checks everything twice". Seed 42 (one example render, each game differs): `Lchtw vg ckkrcajsys awqose hshf. Lqye saxiyccg mf grcprr gq cbie ryozve orm. Gji VJ sqv gvr fvbd oqb vg 5s7c0e56n349qq7fe11r180809196p5r crq hug tvurqrucygw bdrp avhu usehvpk-33`.
- **Clue (key).** The ledger whiteboard in **Dr Selvarajan's office** (east of the corridor, open). Examine it. It lists four blocks, one sentence each: "Block 4, the last entry, holds the data "<word>" (prev e21d, hash 51a8)." **The key is block 4's data word.** Seed 42: `nonce`. The key is one of ledger, merkle, nonce, tally, anchor or witness. "The man who checks everything twice" is Dr Selvarajan, who teaches blockchains and hashes. Talking to him is optional (it gives Field Notes 7 and 10), but the whiteboard can be read without speaking to him.
- **Lock.** Password pad on the pigeonholes in the corridor. Five attempts.
- **Idea.** Vigenère: the key is a word, so the shift changes letter by letter, and counting by hand stops working. The key travels separately from the message, so someone with the ciphertext alone is stuck.
- **Recipe.**
  1. Input: the ciphertext, copied with the file's **Copy button**.
  2. **Vigenère Decode**, **Key** = block 4's word, lower case.
  3. The output is three sentences. Seed 42: `Yours is pigeonhole number four. Your envelope is sealed to your public key. The IV for the drop box is 5f7a0a56a349cd7da11e180809196b5e and the pigeonholes open with sorting-33`.
  4. Take from it: **the password** (word, hyphen, two digits: it ends the text with nothing after it), **your pigeonhole number** (a number word from two to five), and **the IV** (32 hex characters).
  5. **Write the IV onto the "Tag on the Drop Box" notepad page with the pencil** ("Key: ____ IV: ____"), together with the hole number. The IV is not needed until the drop box, some minutes later.
- **Common mistakes.**
  - **Extra text copied with the ciphertext.** A hand selection, on screen or from the notepad page, often catches the file name, a heading or the observation line. Vigenère runs the key across every letter it sees, so the extra letters knock the key out of step and the whole output is wrong. (Before engine fix E6, Add to Notepad wrapped the file in a header and footer, which did the same. It now stores the raw text, so a notepad copy is only wrong if the selection is.) Typical symptom: the whole output is nonsense of the right length, for example `Uhj vcafosniffs tvyh xiyn jittrgle-39 ...` (from a real run), with the digits and hyphen at the end looking right. The fix is to re-copy with the file's Copy button, not to change the key.
  - Wrong key: using block 1 ("genesis-0"), the last hash (`51a8`) or a word from the lesson text. The output is nonsense in every case.
  - A typo in the key (`nonse` for `nonce`). The output is nonsense, exactly as with a wrong key.
  - Extracting the password with a full stop copied in, or with the next word. The text deliberately ends on the password, but selecting by mouse can still catch a space. The pad says "Incorrect password."
  - Not copying down the hole number and the IV. The student then has to redo this decode. That costs two or three minutes. It is much worse if they have also reloaded.
  - Reading the "number word" wrong: "pigeonhole number four" means Pigeonhole 4.
- **Say to a stuck student.** "The file says it needs a key. What did the file's note tell you about where the key is? Who is the man who checks everything twice? Look at the whiteboard: which block is last? If the whole output is nonsense and you're sure of the key, check how you copied the ciphertext. Is there anything extra around it?"
- **Opens.** The four pigeonholes (2 to 5). HaX texts about public keys and AES.

### L8a. The envelope: public-key decryption (RSA)

There is no lock on this step. It makes the AES key.

- **Clue.** The contents of **the student's own pigeonhole** (Pigeonhole 2, 3, 4 or 5, matching their number from L7). It is Base64. The other three are sealed to other students' keys and will fail, which is the intended lesson.
- **Key.** "Your Lab Account" PC in the teaching lab holds `private_key.pem`. Open the file and use its **Copy button**. Copy the whole PEM, from the `-----BEGIN RSA PRIVATE KEY-----` line to the `-----END RSA PRIVATE KEY-----` line inclusive.
- **Idea.** Public-key encryption: anyone can lock with a public key and only the private key unlocks. This answers the key-distribution problem. The message here is an AES key, which is hybrid encryption, and ransomware does the same thing.
- **Recipe.**
  1. Input: the envelope's Base64.
  2. **From Base64**.
  3. **RSA Decrypt**. **RSA Private Key (PEM)** = paste the whole PEM. Leave **Key Password** empty. Leave **Encryption Scheme** on **RSA-OAEP** and the digest on **SHA-1**.
  4. The output is **32 hexadecimal characters**: the AES key. It is not a word. Write it on the tag page with the pencil.
- **Common mistakes.**
  - The wrong pigeonhole: CyberChef errors with **"Invalid RSAES-OAEP padding"** or **"Encrypted message is invalid"**. This is the single most likely error, and it is also the point of the exercise. Ask: "Which hole did the text say was yours?"
  - Skipping From Base64: RSA Decrypt on the Base64 text errors.
  - Pasting the key without the BEGIN and END lines, or a hand selection that misses or adds a line. The error mentions the key.
  - Pasting the **public** key. Only the private key decrypts.
  - Changing the scheme or the digest. Both start in the right place.
  - Expecting a readable answer. The student sees hex and thinks it has gone wrong.
- **Say to a stuck student.** "Which of the four envelopes is yours? Which key does the lock need, the one anybody can have, or the one that only you have? Where does the lab PC keep it?" Then: "Do you need to take the Base64 off first?"

### L8b. The drop box, corridor (AES)

- **Clue.** The **tag** on the drop box (a takeable notepad page, "Tag on the Drop Box"). Its text is the ciphertext as hex. Seed 42: `78647f46c9c5dea5fbdfaed2c6604257`. Its observations say "AES-128-CBC. The key and the IV travel separately. Key: ____ IV: ____".
- **Key.** The 32 hex characters from L8a. **IV.** The 32 hex characters from L7.
- **Lock.** Password pad on the drop box. Five attempts.
- **Idea.** Symmetric encryption: one shared key locks and unlocks. AES works on 16-byte blocks. CBC mixes each block with the one before, and the first with an IV, which is not secret but has to arrive with the message.
- **Recipe.**
  1. Input: the tag's hex. Copy it, do not retype.
  2. **AES Decrypt**.
  3. **Key** = the L8a hex. Check the small toggle beside the field says **Hex** (it starts there).
  4. **IV** = the L7 hex. Toggle **Hex**.
  5. **Mode CBC**, **Input Hex**, **Output Raw**. These are the defaults. Leave GCM Tag and AAD empty.
  6. The output is the passphrase (word, hyphen, two digits). Seed 42: `padlock-92`.
  - **Leave this recipe open.** L10 adds to it.
- **Common mistakes.**
  - No IV, or the IV left empty: **"Invalid IV length"**.
  - Key and IV swapped (both are 32 hex, so it is an easy slip): an error or nonsense.
  - A guessed or all-zero IV: an error ("Unable to decrypt input with these parameters") or junk in the output.
  - A toggle changed from Hex to UTF8. The key then reads as text and is the wrong length.
  - A lost IV or key. They are in the notepad if the student wrote them there. If not, redo L7 and L8a.
  - A reload, which clears the recipe (see "Running it in a lab").
- **Say to a stuck student.** "AES wants a key and an IV. Where did each come from? What does the tag page say? If you've got an error, read the first word of it, because it is telling you which part is wrong."
- **Opens.** The Brass Key and the Final Trial Card.

### L9. The workshop door (a real key)

The breather. Select the Brass Key in the inventory, then click the door at the north end of the corridor. The door is labelled "Workshop (knock)". There is no puzzle. Students who try to type something into it should be told it takes a key. On entering, HaX comments and Dr Schreuders speaks ("Door was locked for a reason, mate...").

### L10. The relay terminal, workshop (SHA-256)

- **Clue.** The **Final Trial Card**, from the drop box. It says: first eight characters of the SHA-256 of the passphrase that opened the drop box, "No spaces, no new line". The observations say the easy way is to add SHA2 under AES Decrypt.
- **Lock.** Password pad on the relay terminal ("FINGERPRINT?").
- **Idea.** A hash is a fingerprint: the same input always gives the same output, one changed byte (even an invisible new line) changes everything, and you cannot run it backwards.
- **Recipe.** In the **L8b recipe, still open**:
  1. Keep **AES Decrypt** where it is.
  2. Add **SHA2** below it.
  3. Set **Size** to **256**. **It starts on 512.** Leave Rounds.
  4. The output is 64 hex characters. Take the **first eight**. Seed 42: `8841f594`. Type them in.
  - Putting SHA2 under AES Decrypt hashes exactly the bytes that opened the box, so no stray new line can sneak in.
- **Common mistakes.**
  - **SHA2 left on 512.** The output is 128 characters long rather than 64, and the first eight are different. This is the number one cause of "I did everything right and it won't open". A quick check: count the output, or look at the Size box.
  - Hashing a retyped or pasted copy of the passphrase: a trailing new line or space changes the hash entirely. This is what Dr Selvarajan's lesson is about.
  - Typing all 64 characters rather than the first eight.
  - A reload between L8b and L10 has cleared the AES recipe. The student needs the key, the IV and the tag, which should all be on the tag page. If they are not, they have lost 5 to 8 minutes.
  - Using a different hash (SHA1 or MD5 from the search list).
- **Say to a stuck student.** "Count how many characters are in your output. How long should a SHA-256 be? What does the dropdown say?" And: "Where does your hash get its input? What's the safest way to feed it?"
- **Opens.** The relay terminal. Music changes, and **Ghost's video call opens by itself**.

### The finale: Ghost's call, the signed report and the choice

This is not a lock chain. It tests reading carefully, not recipes.

1. **Ghost's video call** opens by itself when the relay terminal opens. Ghost recognises the player from St Catherine's, will not give a name ("No name at St Catherine's, and no name now. The handle is Ghost. It's all you get."), and asks for the signed report to be sent to HaX. Each route is priced unprompted: refusing costs Megan (or "the second this week" if she was warned), a wrong location earns "a third offer", and "Send it and you start Monday" closes it. The choices `[What's in it?]` and `[Could I change it first?]` loop. `[I'll think about it.]` ends the call and `[No. Find another student.]` is a refusal. If a student closes the call early, Ghost texts "You closed the call. I'll say it here instead" and the Keyholder device delivers the whole offer. The call never replays.
2. **Reopen the relay terminal** (the call closes it). It holds four files:
   - `report_b64`, the field report. **From Base64** gives a short report ending in an HTML image tag: `<img src="https://cdn.cryptosecure-recovery.example/px/locate/<token>/1x1.png" width="1" height="1">`. That is a **tracking pixel**: it would tell Ghost where and when HaX opened the report. The **token** is the word, hyphen and four digits between the slashes. Seed 42: `merlin-2685`. Students who only decode it once and read the last line find it. Students who send without decoding walk into it.
   - `report_sha256`: the SHA-256 of `report.b64`. **SHA2**, Size **256**, on the `report_b64` text as given must match. A trailing new line breaks it.
   - `report_sig`: the signature. **From Base64**, then **RSA Verify**: **RSA Public Key (PEM)** = `keyholder_public_pem` (copy with its Copy button), **Message** = the `report_b64` text exactly as given, **Message format Raw**, **Message Digest Algorithm SHA-256**. The output is **"Verified OK"**. The decoded report as Message, Message format Base64, SHA-1 (it starts there) or a trailing new line all give "Verification Failure".
   - `keyholder_public_pem`: the key for that check. Its SHA-256 starts with the fingerprint on Jordan's leaflet.
   All four are optional. Only the token matters, and only for the double-agent ending. A student who checks the signature learns the lesson that **a signature proves who signed it and that nothing changed, but hides nothing**: "Verified OK" does not make the report safe to send.
3. **Dr Selvarajan** (optional) will look at a signed report if asked, and says it verifies but does not tell you whether you should send it.
4. **Decision.** See the next section.

**Common mistakes in the finale.**
- Retyping the report instead of copying. A retyped Base64 or a stray new line makes the hash and signature checks fail. The student then believes the report is forged. It is only that they changed it.
- Verifying with the decoded text rather than the Base64 text. This is the most likely wrong turn on RSA Verify, because the signature is over the Base64 file.
- Leaving RSA Verify's digest on SHA-1 or Message format on Base64.
- Typing the token with the slashes, or the whole URL, into the scoreboard. It is just the word, hyphen and digits.
- Reading `report_b64` and `report_sig` as a puzzle that must be solved. They are not locks. The only thing the mission needs is a decision.

**Say to a student who is stuck on the decision.** Nothing about the "right" answer. Say: "What have you actually read? Whatever you've been handed, read it before you do anything with it."

---

## The four endings and how to reach each

All four share the whole chain up to the call. The decision uses HaX's phone hub (`[Sending you my report now.]`, `[It's a trap. Don't open anything from me.]`) or Ghost's `[No. Find another student.]`. HaX's hub choices appear only after Ghost's offer has started, so a student cannot decide before the call.

| | Ending | How a student reaches it | What happens at once |
|---|---|---|---|
| A | **Send** | HaX hub: **[Sending you my report now.]** Works whether or not the report was decoded. | HaX replies "Copy.", then texts "Received. Opening it now." and a few seconds later "My phone just did something it shouldn't...". Ghost then withdraws the studentship on the Keyholder device ("anyone a handler can send, a handler can recall"). Cliffe: "Hope that was worth it." The tracking pixel fired and gave Ghost the location of SAFETYNET's field HQ. By the debrief the site has been burned (nobody hurt; kit and cover lost), and HaX debriefs from a fallback site (background `hq5`; every other debrief, and the briefing, use the field HQ, `hq4`). |
| B | **Warn, then send** (told HaX through the scoreboard first) | In the workshop, type the **token from the report** into **`hacktivity_scoreboard`** (its post-it says flags are lower case, exactly as found). Then send as in A. Order matters: warn, then send. | The scoreboard accepts the token (HaX replies "+50 points..."). After the send HaX texts "The phone just did exactly what your flag said it would. Get out of the building anyway.", so the student knows the warning worked. Cliffe: "Interesting choice of channel." The pixel fired on a decoy handset in a flat SAFETYNET keeps for the purpose. Someone came to look, and SAFETYNET has their photograph. Ghost still withdraws the studentship. |
| C | **Refuse** | Ghost's **[No. Find another student.]**, on the video call or later on the Keyholder device. | "CONTACT CLOSED." HaX: "Your end's gone quiet. Talk to me." Her hub then offers `[I turned the Keyholder down.]`. Cliffe: "Good. Some offers you hear out and still say no to." |
| D | **Blown** (told HaX it was a trap) | HaX hub: **[It's a trap. Don't open anything from me.]** | Ghost texts "I did say it listens. The studentship is withdrawn." HaX: "Copy. Leave by the front. Don't run. Call me when you're clear." Cliffe: "Phones. Never trusted them." |

Rules a tutor will be asked about:
- **Send, then warn** stays "sent", and records a late warning. The debrief has HaX say "Your flag reached me after the report did. You tried. It was already open." The credits read "REPORT: Read, sent, then flagged. Too late."
- **Refuse or blown, with a warning first** stay refused or blown, and the debrief thanks the student for the token.
- **Ghost's `[Sending it now.]` on the Keyholder device does not send anything.** Ghost says "Send it. Your handler's phone, not this one." Sending happens only in HaX's phone hub. A student who clicks it and waits has not made a decision.
- **No ending is a failure.** Every ending reaches the debrief and the credits, and all four complete the lab. (The mission's conclusion is tied to the relay terminal, so the credits cannot appear without the whole chain.) Credits titles read "KEYHOLDER: OFFER WITHDRAWN" for A and B and "KEYHOLDER: DECLINED" for C and D. On every route ENTROPY never takes the player on: the studentship is never awarded. A gets the darkest debrief: a SAFETYNET site lost, though nobody is hurt.
- **The decision cannot be undone.** The HaX choice is hidden once taken. A student who asks to "try the other ending" would need a whole new game with new answers, so say so before they commit if time is short.

### The debrief

After deciding, the student opens HaX's phone and picks **[I'm clear. Debrief me.]** The debrief plays at HQ, and the opening matches the ending. It ends on "Term starts Monday..." and the credits follow. It can be reopened after a reload.

**Questions to run with the class afterwards** (two minutes each, short answers):

1. *Which locks were encodings and which were encryption?* Decimal, binary, hex and Base64 are encodings: no key, anyone can reverse them, Magic does them. Caesar, Vigenère, RSA and AES need a key. Caesar is weak because there are only 25 keys.
2. *Why was the Vigenère key on a whiteboard in a different room?* A key must travel separately from the message, or it protects nothing. Who gets the key, and how, is the key-distribution problem.
3. *Why did only one of the four pigeonholes decrypt?* Each envelope was sealed to a different student's public key. Only the matching private key works.
4. *Why did an RSA envelope carry an AES key, not the passphrase?* Hybrid encryption: public-key maths is slow and the key distribution problem is solved once. Then a fast shared key does the bulk. Ransomware does the same, which is also why the scenario has a ransomware gang as the villain.
5. *What does the hash do? Why did it matter that SHA2 started on 512, and that a new line changes the answer?* A hash is a fingerprint of exactly those bytes.
6. *What did the signature prove, and what did it not?* It proves who signed and that nothing changed. It says nothing about whether the content is safe. The tracking pixel was inside a perfectly valid signed document.
7. *What did you do with the report, and why?* There is no right answer. The point is that students decide knowing what Base64 hides in plain sight.

## Optional content (not needed to finish)

Quick students who finish early can do these. Weak students should not be sent to them unless stuck, because several of them are hints.

- **Exhibits.** The Byte Wall, plaque, powers-of-two poster, ASCII chart and paper tape (spells "HI") in the foyer, and Tom's whiteboard ("Hi" in decimal, binary and hex). They teach the ideas the early locks use.
- **Megan Oyelaran** (common room) and the noticeboard nudge Trial II ("read it as characters"). Megan says what the two wrong routes look like, so a student who talks to her has most of L2 given away.
- **Dr Selvarajan** (seminar room) gives Field Notes 7 (hashes) and 10 (signatures) in person. A desk copy of the hash handout in his office can be taken without talking to him.
- **Field notes by phone.** HaX offers Notes 4 to 11 as the student meets the topic. `[Send me that field note]` delivers the latest.
- **The EBCDIC tape** (`job_tape_hex`, in the Special Collections safe): **From Hex**, then **Decode text** with encoding **IBM EBCDIC US-Canada (37)**. It teaches that other character tables exist.
- **Megan's file** (`candidate_assessments`, in the safe). Reading it opens a hidden side aim, "Loose Threads". The student can warn Megan, ask HaX to protect her, or do nothing. The choice changes Ghost's prices on the call and some debrief and credits lines. It does not change the four endings.
- **Cliffe Schreuders** is in the common room early, with a laptop, and appears in the workshop later. His lines change after the call and after the decision.
- **Dr Oleg Illiashenko** (the staff office, through the common room's east door). The new staff system has garbled his name on a staff list held in the photocopier: "РћР»РµРі Р†Р»Р»СЏС€РµРЅРєРѕ". He explains it ("Same bytes, wrong table") and gives Field Note 12. The fix in CyberChef: paste the file (Copy button), then **Encode text** with **Windows-1251 Cyrillic (1251)** and **Decode text** with **UTF-8 (65001)**. The name reads "Олег Ілляшенко". Telling him earns a thank-you; the game takes the student's word, because it can't see CyberChef. It teaches the same idea as the EBCDIC tape: the bytes are fine, and the table you read them with decides what you see. About 5 minutes.
  - A second held job in the photocopier, `duplicate_accounts.txt`, lists two usernames that look identical. One has a Cyrillic "е". **To Hex** on each shows `d0 b5` in the lookalike, and **SHA2** gives different hashes. Oleg explains homograph phishing ("Ask anyone who has clicked a link to a bank that wasn't quite their bank") and gives Field Note 13. About 3 more minutes.

---

## Time estimate

Target: 60 to 75 minutes, a limit the project owner accepted for this lab. **Estimate: about 80 minutes, in a range of 61 to 100, for a first-year beginner working alone with no hints** (76 before the three new rooms were added; they add about 3 to 6 minutes of walking and looking round). The middle sits above the target. Plan a 90 minute slot, and read the last section of this part before you promise a 60 minute session.

### What the estimate is built on

I did not have a timed blind run of the second half. The figures are reasoned from three kinds of evidence.

1. **The blind run (Trials I to V, no hints).** An agent with no walkthrough took about 12 and a half minutes of wall clock from game start to the library door (05:54:48 to 06:07:25). Per lock: the foyer lockbox took about 4 minutes, but most of that was finding the numbers in the notepad, which the three new pointers now cover. Locker 4 took about 3 minutes, the guest terminal 41 seconds, the corridor door 25 seconds and the library door 30 seconds. The run lost about 2 minutes to the agent's own typo, ran with a load average above 13, and spent 5 to 10 seconds on each CyberChef command. The agent put a player who already knows the controls at 8 to 10 minutes for Trials I to V.
2. **The earned runs, which are agent runs too.** Briefing to the library door took 11 minutes 42 seconds (P1, fastest honest route under load: briefing 1 minute, exhibits 22 seconds, Jordan 40 seconds, Tom 1 minute 29 seconds, lockbox 1 minute 16 seconds, Locker 4 2 minutes 19 seconds, then 21, 45 and 45 seconds for the next three). The second-half run (P2B, library and Trial VII) took about 9 minutes once a 7-minute harness fault is taken out. The finale run (P3, game 1580: Trial VII to credits, with the report decoded and the hash and signature checked) took 17 minutes 40 seconds.
3. **Step counts for the later locks**, which nobody timed blind. I counted the discrete actions a student takes (open a file, copy, switch to the laptop, paste, search, add an operation, set a field, read, write down, walk to the next room, type) and priced them.
4. **A timed walk of the ten-room graph** (game 1606, 2026-10-06, keyless server, test harness at its fast setting, answers typed only to open locks). The walking alone, from the spawn to the relay terminal in play order, took 70 seconds of harness time over 15 legs. The longest leg is Special Collections to the seminar room's whiteboard (four doors, 13.7 s), then the common room to the guest terminal (9.2 s); a one-door hop is 1 to 5 s. The harness moves at full speed in straight lines, so these are lower bounds. A beginner who has to find the door and look round takes the 15 to 30 seconds per hop priced below. The new rooms add six hops to the critical path (three to Special Collections and back, three more on the round trip to Sidhu), which is where the extra minutes come from.

### Unit times used

| Action | Time for a beginner |
|---|---|
| Click an item, read a short note, type a word | 10 to 20 seconds |
| A CyberChef operation seen before | 15 to 25 seconds |
| A new operation (find it in Search, add it, find the field) | 45 to 75 seconds |
| Walk from one room to the next (one hop) | 15 to 30 seconds |
| Talk to an NPC, reading the dialogue | 1 to 2 minutes |
| Each wrong answer and recovery | 1 to 3 minutes |

The agent's per-step times are close to a human's clicks, so the real difference is knowledge: a beginner does not know where the clue is, what the operation is called or which field to change. I priced that as roughly **3 times the agent's time for Act 0 to Trial V** (where the blind agent was working from a clean slate but with no reading time), and **about 2 times** for the later locks, where the agent's runs also needed more steps and more thought.

### Per lock

| Lock | Actions | Agent / measured anchor | Beginner estimate | Why |
|---|---|---|---|---|
| Act 0: briefing, exhibits, Jordan, Tom, first look at CyberChef | about 12 | agent 3 to 4 min | **9 to 14** | The briefing is 3 to 4 minutes of reading. Jordan and Tom are a minute or two each. Reaching Tom costs time. Optional exhibits add a few more minutes. |
| L1 lockbox | about 11 | blind 4 min (before pointers); earned 1:16 | **3 to 5** | First time in CyberChef: one new operation, and the notepad page to find. |
| L2 Locker 4 | about 14 | blind 3 min; earned 2:19 | **4 to 7** | The first trap: spaces in the input, and the capital-letter dead end. One wrong PIN or two. |
| L3 guest terminal | about 9 | 41 s, 21 s | **2 to 3.5** | Walk to the lab, one known-style operation. |
| L4 corridor door | about 8 | 25 s, 45 s | **2 to 3** | Same shape as L3. The risk is typing the whole sentence (add a minute). |
| L5 library door | about 8 | 30 s, 45 s | **2 to 3.5** | Walk to the corridor and take the poster; From Base64. |
| L6 safe | about 14 | not blind (read the route first); P2B about 45 agent commands | **4.5 to 7.5** | Two operations, one setting to change, and the Roman numeral. Walk to the library, then on to Special Collections. |
| L7 Trial VII and pigeonholes | about 22 | P2B about 130 agent commands | **8 to 13.5** | Safe contents, Copy, a trip through Sidhu's office to the seminar room, the whiteboard, Vigenère, three values written down, back to the corridor (six hops instead of three). Add 2 to 3 minutes if they copied extra text with the ciphertext. |
| L8a envelope | about 17 | P3 combined | **6 to 9** | Choose a hole, walk to the lab PC (two hops), copy a long PEM, two operations (one new, a long field). |
| L8b drop box | about 12 | P3 combined | **4 to 7** | One new operation with two hex fields, plus the toggles. |
| L9 workshop | about 4 | | **1 to 2** | One hop and a key. |
| L10 relay | about 9 | | **3 to 5** | Add one operation to an open recipe, set Size, read the first 8. Add 2 to 3 minutes if Size stays on 512. |
| Finale: call, report decode, decision | about 20 | P3 about 17:40 for L7 to credits | **8 to 12** | The call is 3 to 4 minutes of reading. Decoding the report is one operation. The decision takes thought. |
| Debrief and credits | | | **3 to 5** | Reading. |

Optional hash and signature checks add 4 to 8 minutes and are not in the totals.

### Per act and total

| Act | Locks | Low | Middle | High | Design budget |
|---|---|---|---|---|---|
| Arrival | briefing, foyer, Tom (lecture theatre) | 9 | 12 | 14.5 | 14 |
| Act 1: Bits and Bytes | L1 to L4 | 11 | 14.5 | 18 | 13 |
| Act 2: Secrets and Keys, first half | L5 to L7 | 14.5 | 19 | 24.5 | 17 |
| Act 3: Secrets and Keys, second half, and The Keyholder | L8a to L10 | 14 | 18.5 | 23 | 16 |
| The Offer: call, report, decision | | 8 | 10 | 12 | 10 |
| Debrief and credits | | 3 | 4 | 5 | 4 |
| First look round the three new rooms (the theatre, Special Collections, the seminar room) | | 1.5 | 2.5 | 3 | |
| **Total** | | **61** | **80.5** | **100** | **74** |

("Act" here follows the play, not the in-game aim names. The in-game aims are Freshers' Week, Bits and Bytes, Secrets and Keys, The Keyholder and The Offer.)

### How far to trust it

- **Arrival to L5 is the best supported.** It rests on two agent runs that agree to within a minute or two. My estimate for Arrival, Act 1 and L5 together is 22 to 35 minutes, about three times the agent's 8 to 10.
- **L6 to the finale is the weakest.** It is step counting plus the P3 finale run, and nobody has timed a blind agent or a human through Trial VI onward. The project's own pending decision D4 says so. The plain test is one run or two with real first-year students, timed.
- **Act 3 is the likeliest overrun.** The design budgeted 16 minutes, an earlier review argued for 20 (and 25 if the IV is lost), and I land at 18.5. Three new operations arrive in a row (RSA Decrypt, AES Decrypt, SHA2), two of them with a long field and several toggles, and the values have to be carried between them.
- **Things that add time and are not in the totals.** A HaX hint round trip is about a minute each. A page reload costs 2 to 5 minutes (walk back from the foyer, click through "Continue?", rebuild the recipe). Optional content adds 5 to 15 minutes. A student who loses the IV or key adds 3 to 6.
- **Things that take time off.** A student who skips the briefing, the exhibits and the optional talks can finish in the high 50s.

**For a 60 minute class.** Most students will not finish. The natural stopping point is the end of Act 2: the pigeonholes open (L7), which is about 37 to 58 minutes in (47 on the middle estimate). They will have met every encoding and Caesar and Vigenère. The remaining half teaches hybrid encryption, AES, hashes and signatures, so the next session should resume the same game. Progress, notes and unlocked rooms survive a reload or a return, but the player's position and the CyberChef recipe do not. **For a 90 minute slot,** most students finish with a few minutes spare for the debrief questions; the slowest (the top of the range, near 100) need the first ten minutes of the next session.

---

## Running it in a lab

**Setup**

- One game per student, on a desktop or laptop browser. Each game generates its own answers, so a student cannot copy a neighbour's word or PIN. Sharing a recipe still works, and is fine.
- The mission is "The Keyholder Trials" (`lab_tesseract_trials`, collection `escape_room`, difficulty 1). Nothing else needs installing. CyberChef is bundled in the game.
- **The keyless note is for playtesting only.** The playtest runs used a server on port 3001 started without a Gemini key, which turns off speech. A production server does not need to be run that way. Be aware that **no voice audio has been generated for this scenario yet**, so dialogue is text only until that is done, and several character portraits are placeholders (see `ART_NEEDED.md`). Neither affects the puzzles.
- No VMs, no flag submission and no combat. A student needs nothing beyond the browser.
- Run the scenario once yourself beforehand. Note the walk to Tom Shaw and the Keyholder device chat that opens a few seconds after the lockbox.
- Give each student the two habits from "How to use this guide": Copy button rather than a hand selection; pencil for the IV, the AES key and the hole number.

**The CyberChef pop-out tab.** The small up-arrow beside the cross on the laptop opens CyberChef in its own browser tab, with the recipe and input carried over. A student who uses it can keep the clue (in the game tab) and the recipe (in the second tab) on screen together. It is the biggest time saver in the lab, and Tom and Field Note 1 both suggest it. Two cautions. The pop-out is a separate copy, so a recipe built in the tab does not appear back in the game laptop. And whether the pop-out survives a reload of the game tab has not been tested.

**Reloads.** Two known engine behaviours (items E4 and E5 in `DECISIONS_PENDING.md`, deferred, not fixed):

- **E4: a page reload loses the CyberChef recipe and input.** Closing and reopening the laptop is fine and keeps them. A full reload (F5, closing the tab, a network drop that reloads) clears them. This bites hardest between L8b and L10, because L10 builds on the AES recipe. The notepad pencil is the mitigation: if the key, IV and tag are on the page, rebuilding takes about 3 to 5 minutes. If they are not, the student redoes L7 and L8a first.
- **E5: a reload returns the player to the foyer start position.** Rooms, unlocked locks, inventory, notes, tasks and the pencil text are kept. A "Continue?" title screen shows, and the student clicks or presses Enter to carry on. The briefing does not replay.

Tell students not to reload to "fix" something. Tell them that if they do reload, their progress is safe and the recipe is not.

**Other things you may see**

- A wrong PIN three times on Locker 4 shows "System locked". Closing and reopening the keypad resets it.
- Attempt counters are per lock: the lockbox, safe and pigeonholes allow five, the corridor door three. What a password pad does when its attempts run out was not tested; the PIN pad resets when reopened.
- Closing a text file's viewer (the x or Close) can take the student back to the world, not to the container. They reopen the container.
- After a container opens, an old "needs a password" line may still show above the contents in some places. The lock has opened.
- The five hearts in the HUD do nothing. Combat is off.
- Toasts from HaX and Ghost can arrive a room or two after the thing they refer to. Ghost's line about the Magic button arrives around L5.
- Taking the Keyholder device opens a short chat a few seconds later, which can interrupt a student mid-walk. Closing it is fine.

**Tutor stance for the finale.** Do not steer the decision. If a student asks which is best, ask what they know about the report and what Ghost asked for. The scenario rewards having read the report and noticing the pixel, and it has no wrong ending.

---

## Recipes at a glance

| Lock | Where the input is | Operations (in order) | Settings that matter | Type this |
|---|---|---|---|---|
| L1 lockbox | Notepad page "Keyholder Leaflet" | From Decimal | Delimiter Space | the word |
| L2 Locker 4 | Trial II Card | (type a space between each pair of digits), From Decimal | Delimiter Space | the 4 digits |
| L3 guest terminal | Trial III Card | From Binary | Delimiter Space, byte length 8 | the word |
| L4 corridor door | `trial_iv.hex` on the guest terminal | From Hex | Delimiter Auto | the last word only |
| L5 library door | Trial V Poster | From Base64 | defaults | the 4 digits after "keypad:" |
| L6 safe | Returns Slip | From Base64, ROT13 | Amount **-6** (or 20), rotate numbers off | the last word |
| L7 pigeonholes | `trial_vii.txt` (Copy button) and the whiteboard key | Vigenère Decode | Key = block 4's word | the word-and-digits at the end; also note the IV and hole number |
| L8a envelope | your numbered pigeonhole, and `private_key.pem` | From Base64, RSA Decrypt | whole PEM, RSA-OAEP, SHA-1 | (nothing; note the 32 hex) |
| L8b drop box | Tag on the Drop Box | AES Decrypt | Key hex from L8a, IV hex from L7, CBC, Input Hex, Output Raw | the word-and-digits passphrase |
| L10 relay | the L8b recipe | AES Decrypt, then SHA2 | Size **256** | the first 8 characters |
| Report | `report_b64` in the workshop | From Base64 | defaults | (read the token; scoreboard for ending B) |

**Error text cheat sheet**

| CyberChef or lock says | Usually means |
|---|---|
| "Data is not a valid byteArray" | From Decimal on unspaced digits (L2) |
| Four capital letters (e.g. `IVTH`) | From Hex or Magic on L2's digits |
| "Incorrect password. N attempts remaining." | The answer is not exact: wrong case, a whole sentence, a full stop, or a wrong value |
| "Invalid RSAES-OAEP padding" or "Encrypted message is invalid" | Wrong pigeonhole for this student's key, or the wrong key pasted |
| "Invalid IV length" | AES Decrypt has no IV |
| "Unable to decrypt input with these parameters" or junk | Wrong key, IV or tag |
| Nonsense of the right length from Vigenère | Wrong key, or extra text was copied with the ciphertext |
| SHA2 output is 128 characters | Size is still 512 |
| "Verification Failure" | RSA Verify with the decoded text, a trailing new line, Message format Base64 or the digest left on SHA-1 |

