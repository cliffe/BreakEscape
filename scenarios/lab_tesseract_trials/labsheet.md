---
title: "Introduction to Cryptography: Encoding and Encryption (The Keyholder Trials)"
author: ["Mo Hassan", "Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a short browser-based escape-room game to learn how data is encoded and encrypted: bits, bytes, ASCII, hex, Base64, classical ciphers, AES, public-key encryption, hashes and digital signatures, all solved in CyberChef."
overview: |
  Cryptography is how we keep data private and check that it has not been changed. Before you can use it, or attack it, you need to know what you are looking at: is this data encoded, encrypted or hashed, and what would it take to reverse it?

  In The Keyholder Trials you go undercover as a first-year student at Miskatonic University UK. A company is recruiting students through a trail of puzzles, and every lock in the trail opens when you decode or decrypt something in CyberChef, the browser-based data tool built into the game. You start from what a bit is and work up through ASCII, hexadecimal, Base64, Caesar and Vigenère ciphers, symmetric encryption with AES, public-key encryption, hashes and digital signatures.

  The game runs entirely in your browser: there are no virtual machines. This sheet gets you started, explains the ideas behind each lock with worked examples you can check by hand, and has a trial-by-trial set of hints for when you are stuck, from a gentle nudge up to the full recipe. After that there is an optional section that repeats the same operations on the Linux command line with xxd, base64, OpenSSL and GPG, and questions and exercises for after the game.
tags: ["cryptography", "encoding", "encryption", "base64", "aes", "rsa", "hashing", "digital-signatures", "cyberchef", "openssl", "gpg", "break-escape"]
categories: ["cyber_security_landscape"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "beginner"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/lab_tesseract_trials/labsheet.md"
cybok:
  - ka: "AC"
    topic: "Algorithms, Schemes and Protocols"
    keywords: ["Encoding vs Cryptography", "Caesar cipher", "Vigenere cipher", "SYMMETRIC CRYPTOGRAPHY - AES (ADVANCED ENCRYPTION STANDARD)", "Public key cryptography", "Hash functions", "Digital signatures"]
  - ka: "F"
    topic: "Artifact Analysis"
    keywords: ["Encoding and alternative data formats"]
  - ka: "WAM"
    topic: "Fundamental Concepts and Approaches"
    keywords: ["ENCODING", "BASE64"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- tell encoding, encryption and hashing apart, and say what it takes to reverse each one
- read the same data as decimal, binary, hexadecimal and Base64, and recognise each by its alphabet
- convert a byte between binary, decimal, hex and an ASCII character by hand, and check it in CyberChef
- use CyberChef to decode, decrypt, hash and verify data
- explain what symmetric and public-key encryption each solve, and why real systems combine them
- explain what a hash and a digital signature do, and what they do not do

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short CyberChef warm-up. It takes five minutes and saves you far more than that later.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when a field note leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Trial by Trial** and find the lock you are on. Each lock has a hint you can read straight away, then a stronger nudge and the full recipe hidden behind "Show" buttons. Open one at a time, and go back to the game after each: the aim is to work it out, and a lock you open with the first hint teaches you more than one you open with the recipe.
4. After the game, work through **Questions and Exercises**.

> Note: Your game is generated just for you. The words, PINs, keys and IVs in your game are different from everyone else's, so this sheet never gives you an answer, only the way to get it. The examples in this sheet use made-up data.

## Getting Started {#getting-started}

You play Agent 0x00, a SAFETYNET agent who has gone undercover as a first-year student at Miskatonic University UK. A company called CryptoSecure Recovery has been spotting students through a "Keyholder Studentship", and a trail of puzzles around the Computing building is how it picks them. Your handler, Agent HaX, wants you inside. You do not need to know anything about cryptography before you start. The game builds up from what a bit is, and Agent HaX and the lecturers you meet give you short field notes on each scheme as you reach it.

Everything you need is in the browser. There are no virtual machines and nothing to submit on the Hacktivity website: everything happens inside the game. There is nothing to copy from a neighbour, but sharing ideas and recipes is fine.

1. \==action: Launch **The Keyholder Trials** from the BreakEscape scenario selection screen==. It is in the escape room collection.
2. \==action: Watch the briefing from Agent HaX==, then ==action: explore the foyer and talk to the people in it==.
3. \==action: Find the lecturer who has the lab laptop, and take it==. It holds CyberChef.
4. \==action: Open the notepad and the field notes you collect==. You can reopen any of them at any time.

The game takes about 75 to 90 minutes. In a 60-minute class, stop when the pigeonholes open (Trial VII, about 45 minutes in) and resume the same game next time. You can stop and resume at any point: your progress, notes and unlocked rooms are kept. Your position in the building and your CyberChef recipe are not kept.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Every lock opens with something you work out in CyberChef: a word, a PIN or a password.

Things you are handed often go into the **notepad** rather than onto the inventory bar at the bottom of the screen. If you have been given something and cannot see it, look in the notepad first.

Agent HaX's phone has two helpers you can use at any time. **[I'm stuck.]** gives a hint for the lock you are on; ask again for a stronger one. **[Send me that field note]** sends the notes for the last thing you met.

> Tip: In CyberChef, paste the clue into **Input** (top right). Type the name of an operation into **Search** (top left) and double-click it to add it to the **Recipe** (middle). The answer appears in **Output** (bottom right). The arrow next to the close button opens CyberChef in its own browser tab, so you can keep the clue and the recipe side by side.

> Tip: Copy codes with a file's **Copy** button when it has one, or with the mouse and Ctrl+C (Cmd+C on a Mac). Never retype a long code by hand: one wrong character gives a wrong answer with no explanation.

> Warning: Passwords are exact. A capital letter, a full stop, a space or an extra word makes the lock refuse them, and it does not tell you why. If you think you have decoded something correctly and it will not open, check what you actually typed.

> Tip: Use the pencil on a notepad page to write down anything you will need later. Some values are used several rooms after you find them.

> Warning: Do not reload the page to fix a problem. Your progress is kept, but your CyberChef recipe is lost and you are returned to the foyer.

### Warm-up: Your First CyberChef Recipe {#warm-up}

Try this as soon as you have the laptop, before the first lock. It uses made-up data, not anything from the game.

1. \==action: Open the laptop from your inventory==, and click the bin icon above the recipe if anything is already there.
2. \==action: Type `72 105` into **Input**==.
3. \==action: Type `decimal` into **Search**, and double-click **From Decimal**==. The output shows `Hi`.
4. \==action: Clear the input and type `01001000 01101001`==. The recipe still says From Decimal, so the output is wrong. ==action: Drag From Decimal out of the recipe, and add **From Binary** instead==. You get `Hi` again.
5. \==action: Try `4869` with **From Hex**==. `Hi` again.

You have just seen the same two bytes written three ways. That is most of the first half of the game.

> Note: The hex version runs together with no spaces, while the decimal version needs them. "Bits, Bytes and Bases" below explains why.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again afterwards when you answer the questions.

### Encoding, Encryption and Hashing {#encoding-encryption-hashing}

|                                    | Encoding                                                          | Encryption                                   | Hashing                                                       |
| ---------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| Purpose                            | Represent data in a form that is easier to store, send or display | Keep data secret from anyone without the key | Make a short fingerprint of data, to check it has not changed |
| Key or secret needed to reverse it | None. The scheme is public                                        | Yes: the key                                 | Not reversible                                                |
| Output length                      | Depends on the input                                              | Depends on the input                         | Fixed, whatever the input                                     |
| Examples                           | ASCII, hex, Base64                                                | Caesar, Vigenère, AES, RSA                   | SHA-256                                                       |

Encoding is not security. Anyone who recognises the scheme can undo it, and tools like CyberChef's Magic will often recognise it for them. Encryption is only as good as the key: if the key is weak, guessed, or sent along with the message, the cipher does not help. A hash is a one-way function, so you cannot "decrypt" one, though you can guess inputs and compare.

### How to Tell What You Are Looking At {#recognise}

Most of the early locks come down to one question: what kind of data is this? Look at which characters it uses, and how long it is.

| What you see                                                                          | Probably                                   | Try in CyberChef                |
| ------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| Numbers, mostly 32 to 126, separated by spaces                                        | ASCII codes in decimal                     | From Decimal                    |
| Only 0 and 1, in groups of eight                                                      | Binary                                     | From Binary                     |
| Only 0 to 9 and a to f, an even number of characters, often run together             | Hex                                        | From Hex                        |
| Upper and lower case letters, digits, maybe `+` and `/`, maybe `=` or `==` at the end | Base64                                     | From Base64                     |
| Text shaped like English (spaces, full stops, short words) but the words are nonsense | A letter-shifting cipher: Caesar, Vigenère | ROT13 (with an Amount), Vigenère Decode |
| A block of Base64 between `-----BEGIN ...-----` and `-----END ...-----` lines         | A PEM key or certificate                   | Paste it into a key field       |
| Exactly 64 hex characters                                                             | A SHA-256 hash                             | (cannot be reversed)            |
| Exactly 32 hex characters                                                             | 16 bytes: an AES-128 key, or an IV         | A Key or IV field               |

If one layer comes off and you get another of these shapes, peel that one too. Encodings stack.

> Tip: CyberChef's **Magic** operation tries to recognise encodings for you. It is useful, but it guesses, and it can guess wrong (Trial II is a good example). Recognising the alphabet yourself is faster and more reliable.

### Bits, Bytes and Bases {#bits-bytes-bases}

A **bit** is a 0 or a 1. A **byte** is eight bits, so it can hold 256 different values (0 to 255). A **number base** is how many symbols you count with before you carry:

- **Binary** (base 2) uses 0 and 1.
- **Decimal** (base 10) uses 0 to 9.
- **Hexadecimal** (base 16, "hex") uses 0 to 9 and then a to f for 10 to 15.

**Binary to decimal by hand.** In a byte the eight places are worth 128, 64, 32, 16, 8, 4, 2 and 1. Add up the places that hold a 1:

| Place value | 128 | 64  | 32  | 16  | 8   | 4   | 2   | 1   |              |
| ----------- | --- | --- | --- | --- | --- | --- | --- | --- | ------------ |
| `01001101`  | 0   | 1   | 0   | 0   | 1   | 1   | 0   | 1   | 64+8+4+1 = 77 |
| `01101001`  | 0   | 1   | 1   | 0   | 1   | 0   | 0   | 1   | 64+32+8+1 = 105 |

**Binary to hex by hand.** One hex digit is exactly four bits, so split the byte in half and convert each half (place values 8, 4, 2, 1):

```
0100 1101
  4    d    -> 0x4d  (4 x 16 + 13 = 77)
```

That fixed width is why hex can run together without separators and still be read: every byte is always two hex digits. Decimal is not fixed width. A decimal code may be one, two or three digits long, so run-together decimal is ambiguous unless you know how to split it.

> Question: Work out `01001000` by hand. Which letter is it? Check your answer with From Binary.

### Character Encodings and ASCII {#ascii}

A **character encoding** is an agreed table from numbers to characters. **ASCII** covers the English letters, digits, punctuation and some control codes, using the numbers 0 to 127. You do not need to memorise it, but these ranges are worth knowing because they tell you what you are looking at:

| Characters  | Decimal    | Hex        | Binary starts |
| ----------- | ---------- | ---------- | ------------- |
| space       | 32         | 20         | `0010`        |
| digits 0–9  | 48 to 57   | 30 to 39   | `0011`        |
| A–Z         | 65 to 90   | 41 to 5a   | `010`         |
| a–z         | 97 to 122  | 61 to 7a   | `011`         |

Some things this table tells you:

- The digit `4` is stored as 52, not as 4. **Digits are characters too.** If a clue made of digits decodes into more digits, that is not a mistake.
- Lower case is upper case plus 32. In binary that is one bit (the 32s place), which is why `A` is `01000001` and `a` is `01100001`.
- If a list of numbers sits between 97 and 122, it is probably a lower-case word.

**Unicode** is a much bigger table covering most of the world's writing systems and emoji. **UTF-8** is the usual way of storing it as bytes, and it matches ASCII for the first 128 characters. Other tables exist: IBM mainframes used EBCDIC, where `A` is 0xC1 rather than 0x41. Same letters, different numbers, so you need to know which table was used. Read text with the wrong table and you get "mojibake": the bytes are fine, but the characters on screen are garbage.

### Base64 {#base64}

Base64 turns any bytes into plain printable text, so they can travel safely through email, web pages and JSON. It takes three bytes (24 bits), cuts them into four groups of 6 bits, and writes each group as one of 64 symbols: `A` to `Z` are 0 to 25, `a` to `z` are 26 to 51, `0` to `9` are 52 to 61, then `+` and `/`.

A worked example, encoding `Cat`:

```
C        a        t
01000011 01100001 01110100      three bytes, 24 bits
010000 110110 000101 110100     regrouped into four 6-bit pieces
16     54     5      52         as numbers
Q      2      F      0          looked up in the Base64 alphabet
```

So `Cat` becomes `Q2F0`. If the input is not a multiple of three bytes, `=` signs pad the end. So the output is about a third longer than the input, its length is a multiple of four, and it may end in `=` or `==`. It is an encoding: no key, no secrecy.

PEM files, the text format for keys and certificates, are Base64 between a pair of header lines.

> Question: Check `Cat` in CyberChef with **To Base64**, then try `C` on its own. Work out by hand why `C` gives two `=` signs: how many bits does it have, and how many 6-bit groups do they fill?

### Classical Ciphers {#classical-ciphers}

A **Caesar cipher** shifts every letter along the alphabet by the same number of places. The shift is the key. With a shift of 3, `HELLO` becomes `KHOOR`. To decrypt, shift back by 3 (or forward by 23, which comes to the same thing). There are only 25 useful shifts, so an attacker can try them all in seconds. That is **brute force**, and it is why the cipher is not secure. In CyberChef, Caesar is the **ROT13** operation with its **Amount** changed.

A **Vigenère cipher** uses a keyword. Each letter of the keyword gives the shift for one letter of the message (A = 0, B = 1, ..., Z = 25), and the keyword repeats:

```
message  H  E  L  L  O
key      K  E  Y  K  E
shift   10  4 24 10  4
result   R  I  J  V  S
```

The two `L`s come out as different letters, so counting letter frequencies by hand stops working. It is stronger than Caesar, but still breakable with enough text, and useless if someone has the key. Any extra characters inside the ciphertext shift the keyword out of step, so copy only the ciphertext.

### Symmetric Encryption: AES {#symmetric-encryption}

In **symmetric encryption** the same secret key locks and unlocks the data. DES, designed in the 1970s, uses 56-bit keys, so there are 2^56 possible keys. Modern hardware can search that, so DES is no longer safe. **AES** is a block cipher that works on 128-bit (16-byte) blocks, with a key of 128, 192 or 256 bits. 2^128 is far beyond brute force, so attacks target how the cipher is used, or the key.

Two more things you need to know about how AES is used:

- A **mode** says how blocks are chained. In **CBC** (cipher block chaining) each block is mixed with the one before it, so identical blocks of plaintext do not give identical blocks of ciphertext. The first block has no predecessor, so it is mixed with an **initialisation vector (IV)**.
- The IV must be unpredictable and must not be reused with the same key, but it does not need to be secret. It travels with the ciphertext. The key must stay secret.

An AES-128 key is 16 bytes, which is 32 hex characters. A CBC IV is one block, also 16 bytes and 32 hex characters. They look alike, so label them when you write them down.

Symmetric encryption is fast, but it leaves the **key distribution problem**: before two people can talk privately, they must already share a secret key, and you cannot send that key over the channel you are trying to protect.

### Public-Key Encryption: RSA {#public-key-encryption}

**Public-key** (asymmetric) cryptography uses a pair of mathematically linked keys. The **public key** can be given to anyone, and for encryption it only locks (it also checks signatures, below). The **private key** is kept secret, and it unlocks. Anyone can send you a secret using your published public key, without ever having met you. That answers key distribution. Keep private keys secret, just as you keep symmetric keys secret.

**RSA** is the classic example. It is much slower than AES, and it can only encrypt data smaller than its key. It also needs padding (OAEP is the modern choice) to be safe. Public keys are also used the other way round, for signatures (below).

If you encrypt to the wrong public key, the right person cannot read the message. If you try to decrypt with the wrong private key, you get an error, not a wrong answer.

### Hybrid Encryption {#hybrid-encryption}

Real systems use both. To send a large message, you:

1. generate a fresh random symmetric key (for example, an AES key)
2. encrypt the message with that key, which is fast
3. encrypt the AES key with the recipient's public key, which is slow but small
4. send both

The recipient uses their private key to recover the AES key, then uses it to decrypt the message. HTTPS, PGP and S/MIME all work this way. So does ransomware: it encrypts your files with a symmetric key, and protects that key with the attacker's public key, so that only the attacker can supply it.

### Hashes and Signatures {#hashes-and-signatures}

A **cryptographic hash** such as SHA-256 turns any input into a fixed-length fingerprint (256 bits, written as 64 hex digits). Properties worth knowing:

- the same input always gives the same hash
- changing one byte, even an invisible new line, changes the whole hash
- you cannot work back from the hash to the input
- it is infeasible to find two different inputs with the same hash

Hashes are used to check that data has not changed, and to store passwords without storing the passwords themselves (properly, with a salt and a slow hash designed for passwords, not a bare SHA-256).

A **digital signature** is made by hashing a message and then encrypting that hash with the sender's private key. Anyone with the sender's public key can verify it. A valid signature shows that the holder of the private key signed this exact message, and that it has not changed since. It does not show that the message is true, that it is safe, or that you should act on it. A signature hides nothing.

You also need to check that the public key really belongs to the person you think it does. A signature checked against the wrong key proves nothing. That is what fingerprints, certificates and a web of trust are for.

## Stuck? Hints, Trial by Trial {#hints}

Find the lock you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last.

> Tip: Before you open any hint, ask yourself three questions. What characters is the clue made of (see "How to Tell What You Are Looking At")? What shape of answer does the lock want: a word, four digits, something else? And did the clue's own description (its "observations" text) tell you anything?

### Before the First Lock {#hints-start}

> Hint: If the briefing has finished and you do not know what to do, talk to the person at the CryptoSecure stand in the foyer, then look for a lecturer with a laptop.

<details markdown="1">
<summary>Nudge: "I can't find the clue for the lockbox"</summary>

Jordan, at the CryptoSecure stand, gives you the Keyholder Leaflet. It goes into your **notepad**, not the inventory bar. Open the notepad and page through to it.

</details>

<details markdown="1">
<summary>Nudge: "I don't have CyberChef"</summary>

Dr Tom Shaw has the lab laptop. He is in the lecture theatre, through the foyer's south door, standing at the front by the demonstration bench. Walk along the front, not into the rows of seats. Talking to him also gives you Field Notes 1 to 3.

</details>

The exhibits in the foyer (the Byte Wall, the plaque, the ASCII chart and the paper tape) are optional, but each one teaches something the first few locks use. If bits and bytes are new to you, look at them.

### Trial I: The Foyer Lockbox {#hints-trial-1}

**Clue:** the Keyholder Leaflet, in your notepad. **Lock wants:** a word.

> Hint: Each number on the leaflet stands for one character. What is the smallest number, and what is the biggest? Compare them with the ASCII table above.

<details markdown="1">
<summary>Nudge</summary>

The numbers are ASCII codes written in decimal. You can look each one up on the ASCII chart in the foyer, which works but is slow, or let CyberChef convert them all at once. Numbers from 97 to 122 are lower-case letters.

**Learn it:** ==action: Before you use CyberChef, decode the first number by hand==. Subtract 96 from it and count along the alphabet (97 is `a`, 98 is `b`, and so on).

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Copy the numbers from the notepad page into **Input**==.
2. \==action: Add **From Decimal**==. Leave Delimiter on **Space**.
3. \==action: Type the word that comes out into the lockbox==, exactly as it appears.

</details>

> Warning: Do not type the numbers into the lockbox, and do not guess. Each wrong try uses up an attempt.

### Trial II: Candidate Locker 4 {#hints-trial-2}

**Clue:** the Trial II Card, from the lockbox. **Lock:** the end locker with a keypad, in the common room (east of the foyer). **Lock wants:** four digits.

This is the first real trap. Allow some time for it.

> Hint: The keypad wants four digits. You have eight. What does that suggest?

<details markdown="1">
<summary>Nudge</summary>

Eight digits, four characters: each character is two digits long. Now look at the ASCII table: which characters have codes that are two digits long and start with 4 or 5? The answer you want is made of digits, and **digits are characters too**.

CyberChef cannot tell where one decimal code ends and the next begins, because decimal codes are not a fixed width. You have to tell it.

If you got **four capital letters**, something read your digits as hex (Magic does this). That is a dead end: the keypad only takes digits. If you got **"Data is not a valid byteArray"**, From Decimal was given one huge number.

The noticeboard and Megan in the common room both have advice on this one.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Copy the eight digits into **Input**==.
2. \==action: In the Input box itself, type a space after every second digit==, so a code like `12345678` becomes `12 34 56 78`.
3. \==action: Add **From Decimal**== (Delimiter Space).
4. \==action: Type the four digits that come out into the keypad==.

If the keypad says "System locked" after three wrong tries, close it and open it again.

</details>

### Trial III: The Keyholder Guest Terminal {#hints-trial-3}

**Clue:** the Trial III Card, from Locker 4. **Lock:** the black guest terminal at the aisle end of the back bench in the teaching lab (west of the foyer). **Lock wants:** a word.

> Hint: Only noughts and ones, in groups of eight. What is a group of eight bits called?

<details markdown="1">
<summary>Nudge</summary>

Each group of eight is one byte, so one character. It is the same idea as Trial I, written in base 2 instead of base 10.

**Learn it:** ==action: Decode the first group by hand== with the place values 128, 64, 32, 16, 8, 4, 2, 1 (see "Bits, Bytes and Bases"). You should get a number between 97 and 122. Which letter is it? Then let CyberChef do the rest, and check your first letter matches.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Copy the whole card text into **Input**==. Make sure no group is missing.
2. \==action: Add **From Binary**== (Delimiter Space, Byte Length 8).
3. \==action: Type the word into the guest terminal==.

</details>

### Trial IV: The Corridor Door {#hints-trial-4}

**Clue:** `trial_iv.hex`, a file on the guest terminal. It is not added to your notepad, so use the file's **Copy** button. **Lock:** the door north of the foyer. **Lock wants:** a word. It allows only three tries.

> Hint: Look at the alphabet: 0 to 9 and a to f, nothing else, all run together.

<details markdown="1">
<summary>Nudge</summary>

It is hex: two hex digits per byte, so it does not need spaces. Read the whole output carefully before you type anything. Did the door ask for a sentence?

**Learn it:** ==action: Take the first two hex digits and convert each one to four bits== (for example `6` is `0110` and `f` is `1111`), join them, and you have a byte you can look up in the ASCII table.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Paste the hex into **Input**==.
2. \==action: Add **From Hex**== (Delimiter Auto).
3. The output is a sentence. ==action: Type only the last word into the door==.

</details>

> Warning: Most students who give up here had already decoded it correctly and typed the whole sentence.

### Trial V: The Library Door {#hints-trial-5}

**Clue:** the Trial V Poster, on the corridor noticeboard. Take it and it goes into your notepad. **Lock:** the library door, west of the corridor. **Lock wants:** four digits.

> Hint: This one uses upper and lower case letters and digits, and it ends with `=`. Which of the shapes in "How to Tell What You Are Looking At" is that?

<details markdown="1">
<summary>Nudge</summary>

It is Base64. The poster's description has a worked example: three letters become four Base64 symbols. The `=` at the end is padding, so copy it too.

Copy and paste rather than retyping: in the game's font, a lower-case `l` and a capital `I` look almost the same, and Base64 uses both.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Paste the Base64 into **Input**==.
2. \==action: Add **From Base64**== (leave the settings alone).
3. The output is a sentence. ==action: Type the four digits after "keypad:" into the library keypad==.

</details>

### Trial VI: The Special Collections Safe {#hints-trial-6}

**Clue:** the Returns Slip, on the returns counter in the library. **Lock:** the safe in Special Collections, through the library's north door. **Lock wants:** a word.

> Hint: There are two layers here. What does the outside layer look like? And read the slip's description: it tells you something about a shift.

<details markdown="1">
<summary>Nudge</summary>

The outside layer is Base64 again. Take it off first. What you get underneath looks like English (spaces, short words, a colon) but the letters are wrong. That is a Caesar cipher.

The slip says the shift is "the number of this Trial". This is Trial VI. VI is a Roman numeral: V is 5 and I is 1.

To undo a shift you go **back** by that amount. In CyberChef, the Caesar shift is the **ROT13** operation with its **Amount** changed. (Searching "caesar" finds **Caesar Box Cipher** first, which is a different cipher.)

If you are not sure of the shift, add **ROT13 Brute Force** instead. It shows all 25 shifts at once, and you can pick out the line that reads as English. That is exactly why Caesar is weak: there are only 25 keys to try.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Paste the slip text into **Input**==.
2. \==action: Add **From Base64**==.
3. \==action: Add **ROT13** below it, and change **Amount** from 13 to -6== (20 also works). Leave "Rotate numbers" off.
4. The output is a sentence. ==action: Type only the last word, in lower case==.

</details>

### Trial VII: The Pigeonholes {#hints-trial-7}

**Clue:** `trial_vii.txt`, inside the safe. **Lock:** the pigeonholes in the corridor. **Lock wants:** a word, a hyphen and two digits.

This lock gives you **three** things, and you need all of them later. Write them down.

> Hint: This is the first clue where you need a key that is somewhere else. Read the file's description: where does it say the key is?

<details markdown="1">
<summary>Nudge: finding the key</summary>

"The man who checks everything twice" is Dr Selvarajan, who teaches hashes and blockchains. His office is east of the corridor, and the seminar room is through the back of it. Look at the ledger whiteboard there. You do not have to talk to him.

The whiteboard shows a short chain of blocks. The key is the data word in the **last** block. Not the first block, and not a hash.

</details>

<details markdown="1">
<summary>Nudge: "the output is all nonsense"</summary>

The key in a Vigenère cipher is a word, so the shift changes from letter to letter. That means every extra letter in the input knocks the key out of step for everything after it.

If your output is nonsense of about the right length and you are sure of the key, the usual cause is that you copied something extra with the ciphertext: the file name, a heading, a line of description. Copy it again with the file's **Copy** button. Also check the key for typos, and that it is in lower case.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Open `trial_vii.txt`, use its **Copy** button, and paste into **Input**==.
2. \==action: Add **Vigenère Decode**, and set **Key** to the last block's data word==.
3. The output is three sentences. Take from it:
   - your **pigeonhole number** (written as a word)
   - the **IV**: 32 hex characters
   - the **pigeonhole password** at the very end
4. \==action: Open the **Tag on the Drop Box** page in your notepad== (take the tag from the drop box in the corridor if you have not already). ==action: Use the pencil to write the IV and your pigeonhole number on it==.
5. \==action: Type the password into the pigeonholes==, with nothing after it.

</details>

> Tip: If you are in a 60-minute class, this is a good place to stop. Write down the three values first.

### The Envelope in Your Pigeonhole {#hints-envelope}

**Clue:** the envelope in **your** pigeonhole (the number from Trial VII). There is no lock on this step. It gives you a key for the next one.

> Hint: The text said your envelope is sealed to your public key. Which key opens something sealed to a public key?

<details markdown="1">
<summary>Nudge</summary>

Your **private** key opens it. It is on the "Your Lab Account" PC in the teaching lab, at the aisle end of the front bench, as `private_key.pem`.

The envelope's contents are Base64, so take that layer off first.

Only one of the four pigeonholes is yours. The other envelopes are sealed to other students' keys, so your private key gives an error on them. That error is the lesson: a public-key message is for exactly one person.

The answer is not a word. It is 32 hex characters, which is 16 bytes: an AES key. That is hybrid encryption (see the Concepts section).

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Paste your envelope's text into **Input**==.
2. \==action: Add **From Base64**==.
3. \==action: Add **RSA Decrypt**==. Open `private_key.pem` on the lab PC and use its **Copy** button. Paste the whole thing, including the `-----BEGIN` and `-----END` lines, into **RSA Private Key (PEM)**.
4. Leave Key Password empty, and leave Encryption Scheme on **RSA-OAEP** and the digest on **SHA-1**.
5. The output is 32 hex characters. ==action: Write it on the drop box tag page as the Key==.

If you see "Invalid RSAES-OAEP padding" or "Encrypted message is invalid", check you used your own pigeonhole and the private key, not the public one.

</details>

### The Drop Box {#hints-drop-box}

**Clue:** the Tag on the Drop Box, in your notepad. **Lock:** the drop box in the corridor. **Lock wants:** a word, a hyphen and two digits.

> Hint: The tag says what cipher it is, and that it needs two things. Where did each one come from?

<details markdown="1">
<summary>Nudge</summary>

The tag says **AES-128-CBC**. AES is symmetric, so you need the key: the 32 hex characters from your envelope. CBC needs an IV: the 32 hex characters from Trial VII. The IV is not secret, but the cipher cannot start without it.

Both are 32 hex characters, so it is easy to swap them. Check which is which.

If CyberChef shows an error, read its first words: "Invalid IV length" means the IV is missing, and "Unable to decrypt" or garbage means one of the key, IV or ciphertext is wrong.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Paste the tag's hex into **Input**==.
2. \==action: Add **AES Decrypt**==.
3. \==action: Set **Key** to the hex from your envelope==. Check the small toggle beside the field says **Hex**.
4. \==action: Set **IV** to the hex from Trial VII==, with the toggle on **Hex**.
5. Leave **Mode CBC**, **Input Hex** and **Output Raw** as they are.
6. \==action: Type the passphrase that comes out into the drop box==.

==warning: Do not clear this recipe==. You build on it for the next lock.

</details>

### The Workshop Door {#hints-workshop}

> Hint: Not every lock wants a password. What came out of the drop box?

<details markdown="1">
<summary>Nudge</summary>

\==action: Select the Brass Key in your inventory, then click the workshop door== at the north end of the corridor.

</details>

### The Relay Terminal {#hints-relay}

**Clue:** the Final Trial Card, from the drop box. **Lock:** the relay terminal in the workshop. **Lock wants:** eight hex characters.

> Hint: The terminal wants a fingerprint, not a password. Which of the ideas in this sheet is a fingerprint?

<details markdown="1">
<summary>Nudge</summary>

It wants the first eight characters of the **SHA-256 hash** of the passphrase that opened the drop box.

A hash covers every byte. If you type or paste the passphrase and an invisible new line or space comes with it, the hash is completely different. The safest input is the exact output of your AES recipe, so hash that directly.

CyberChef's SHA2 operation starts on **512**, not 256. A SHA-256 hash is 64 hex characters. If yours is 128, the size is wrong.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. Go back to your drop box recipe, still showing the passphrase.
2. \==action: Add **SHA2** below AES Decrypt==.
3. \==action: Change **Size** to 256==.
4. \==action: Type the first eight characters of the output into the terminal==.

If you reloaded and lost the recipe, rebuild AES Decrypt from the key, IV and tag on your notepad page first.

</details>

### The Finale: The Call and the Report {#hints-finale}

Once the relay terminal opens, someone calls you. After the call, open the relay terminal again: it holds a signed report. What you do with it is your decision, and there is no wrong ending. These hints help you understand what you have, not choose for you.

> Hint: Whatever you have been handed, read it before you do anything with it.

<details markdown="1">
<summary>Nudge: reading the report</summary>

`report_b64` is Base64. Decode it with **From Base64** and read every line, right to the end. The last line is HTML. Ask yourself what a web page or email client does when it shows that line, and who would find out.

</details>

<details markdown="1">
<summary>Nudge: checking the hash and the signature (optional)</summary>

These checks are optional, and they tell you who signed the report and that it has not changed. They do not tell you whether it is safe to send.

- **Hash:** copy `report_b64` with its Copy button, add **SHA2** with Size **256**, and compare with `report_sha256`.
- **Signature:** put `report_sig` in Input, add **From Base64**, then **RSA Verify**. Use `keyholder_public_pem` as the public key, and the `report_b64` text **exactly as given** (still Base64, not decoded) as the Message. Set Message format **Raw** and Message Digest Algorithm **SHA-256**. You should see "Verified OK".
- **Whose key is it?** The Keyholder Leaflet you got in the foyer has a key fingerprint in its description. Hash `keyholder_public_pem` with SHA-256 and compare the start.

"Verification Failure" usually means the Message was the decoded text, there was a trailing new line, or the digest was left on SHA-1.

</details>

<details markdown="1">
<summary>Spoiler: other ways to reach HaX</summary>

The caller claims the Keyholder device listens to what you say near it. The workshop has a Hacktivity scoreboard that takes flags. Its post-it says flags are lower case, exactly as found. Is there anything in the report that looks like a flag?

</details>

After you decide, ==action: open HaX's phone and choose **[I'm clear. Debrief me.]**==

### Optional Side Puzzles {#hints-optional}

None of these are needed to finish. Each one teaches something about character tables. Try them if you finish early.

<details markdown="1">
<summary>The job tape in the safe (EBCDIC)</summary>

`job_0412.hex` is hex, but **From Hex** gives garbage. These bytes come from an IBM mainframe, which used a different character table. After From Hex, add **Decode text** and choose **IBM EBCDIC US-Canada (37)**.

</details>

<details markdown="1">
<summary>The garbled name in the staff office (mojibake)</summary>

The staff office is east of the common room. Dr Illiashenko's name has been mangled on a staff list in the photocopier. The bytes are UTF-8, but something read them with the Windows Cyrillic table. To reverse that: paste the garbled name, add **Encode text** with **Windows-1251 Cyrillic (1251)** to get the original bytes back, then **Decode text** with **UTF-8 (65001)**. Then tell him.

</details>

<details markdown="1">
<summary>The duplicate accounts (homographs)</summary>

`duplicate_accounts.txt`, also in the photocopier, lists two usernames that look the same. Run **To Hex** on each and compare. One letter is not what it looks like. This is how lookalike web addresses are used in phishing.

</details>

<details markdown="1">
<summary>Megan's file in the safe</summary>

The Candidate Assessments notes are readable as they are. What you do about what it says is up to you.

</details>

### What CyberChef and the Locks Are Telling You {#error-messages}

| You see                                                         | It usually means                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Incorrect password. N attempts remaining."                     | The answer is not exact: a capital letter, a full stop, a whole sentence, a space    |
| "Data is not a valid byteArray"                                 | From Decimal was given digits with no spaces between the codes                       |
| Four capital letters from a string of digits                    | The digits were read as hex. Read them as decimal codes instead                      |
| Nonsense of the right length from Vigenère                      | Wrong key, a typo in the key, or extra text copied with the ciphertext               |
| "Invalid RSAES-OAEP padding" or "Encrypted message is invalid"  | Wrong pigeonhole for your key, the public key pasted, or From Base64 missing         |
| "Invalid IV length"                                             | AES Decrypt has no IV                                                                |
| "Unable to decrypt input with these parameters", or garbage     | Wrong key or IV, the two swapped, or a toggle changed from Hex                       |
| A SHA2 output 128 characters long                               | Size is still on 512                                                                 |
| "Verification Failure"                                          | RSA Verify given the decoded text, a trailing new line, or the digest left on SHA-1  |

## Try It on the Command Line (Optional) {#command-line}

CyberChef is convenient, but you will often have only a shell, for example on a server you are investigating. These are the equivalents of what you did in the game. Use any current Linux distribution, such as Kali, Ubuntu or Debian, with `xxd`, `base64`, `openssl` and `gpg` installed. Use your own example data, not anything from the game.

> Tip: The `echo` command adds a new line to the end of its output and `printf '%s'` does not. For encodings and especially for hashes, that one invisible byte changes the answer. The commands below use `printf` where it matters.

### Characters, Hex and Binary {#cli-hex-binary}

\==action: Show a string as hex, then as binary==:

```bash
printf 'Valhalla!' | xxd -p
printf 'Valhalla!' | xxd -b
```

The first command prints `56616c68616c6c6121`: two hex digits per character. The second prints each byte as eight bits, with the characters alongside.

\==action: Go back from hex to text==:

```bash
printf 'Valhalla!' | xxd -p | xxd -r -p
```

\==action: Show the decimal ASCII code of each character==, and ==action: turn decimal codes back into text==:

```bash
printf 'Valhalla!' | od -An -tu1
python3 -c "print(bytes([72, 105]).decode())"
```

\==action: Convert between decimal and hex==:

```bash
printf '%d\n' 0x4d
printf '%x\n' 77
```

> Question: In the output of `xxd -b`, which byte is the `!`? Work out its decimal value from the place values (128, 64, 32, 16, 8, 4, 2, 1) and check it against `od`.

### Base64 {#cli-base64}

\==action: Encode and decode Base64==:

```bash
printf 'Valhalla!' | base64
printf 'VmFsaGFsbGEh' | base64 -d
```

\==action: Compare these three inputs and look at the `=` padding==:

```bash
printf '\x14\xfb\x9c\x03\xd9\x7e' | base64
printf '\x14\xfb\x9c\x03' | base64
echo 'Valhalla!' | base64
```

> Question: Why does the first output have no padding, while the second ends in `==`? How many bytes does each input have, and how does that relate to the groups of three that Base64 works on? Why does the last command give a different result from encoding the same text with `printf`?

### Caesar Shifts and Other Character Tables {#cli-caesar}

`tr` maps one set of characters to another, which is all a Caesar cipher is. ==action: Shift letters by 6, then undo it==:

```bash
printf 'Valhalla' | tr 'A-Za-z' 'G-ZA-Fg-za-f'
printf 'Bgrngrrg' | tr 'G-ZA-Fg-za-f' 'A-Za-z'
```

\==action: Try all 25 shifts of a ciphertext, to see why a Caesar cipher is weak==:

```bash
for n in $(seq 1 25); do
  printf '%2d: ' "$n"
  printf 'Bgrngrrg' | python3 -c "
import sys
n = $n
print(''.join(chr((ord(c) - (65 if c.isupper() else 97) - n) % 26 + (65 if c.isupper() else 97)) if c.isalpha() else c for c in sys.stdin.read()))"
done
```

`iconv` converts between character encodings. ==action: Write "Hi" in EBCDIC (code page IBM037) and read it back==:

```bash
printf 'Hi' | iconv -f UTF-8 -t IBM037 | xxd -p
printf 'c889' | xxd -r -p | iconv -f IBM037 -t UTF-8
```

> Tip: Run `iconv -l` to list every character set your system knows.

> Note: There is no standard command for Vigenère. A short script is the usual way, and writing one is one of the exercises after the game.

### Hashes {#cli-hashes}

\==action: Hash the same text with and without a trailing new line==:

```bash
printf '%s' 'Valhalla!' | sha256sum
echo 'Valhalla!' | sha256sum
printf '%s' 'Valhalla!' | openssl dgst -sha256
```

The first and third give the same hash. The second is completely different, because of one extra byte. ==action: Count the hex digits in a hash==: SHA-256 gives 64, whatever the input.

### Symmetric Encryption with OpenSSL {#cli-symmetric}

OpenSSL can encrypt with a password, or with an explicit key and IV. CyberChef's AES Decrypt takes an explicit key and IV, so start there.

\==action: Make a random 128-bit key and IV, as hex==:

```bash
openssl rand -hex 16 > key.hex
openssl rand -hex 16 > iv.hex
cat key.hex iv.hex
```

\==action: Encrypt a message with AES-128 in CBC mode, writing the ciphertext as hex==:

```bash
printf 'Meet at the library' | openssl enc -aes-128-cbc -K $(cat key.hex) -iv $(cat iv.hex) | xxd -p > message.hex
cat message.hex
```

`-K` is the key and `-iv` the IV, both in hex. ==action: Decrypt it==:

```bash
xxd -r -p message.hex | openssl enc -d -aes-128-cbc -K $(cat key.hex) -iv $(cat iv.hex)
```

> Tip: Paste `message.hex`, `key.hex` and `iv.hex` into CyberChef's AES Decrypt (Mode CBC, Input Hex, Output Raw, with the key and IV both set to Hex) and you should get the same message.

\==action: Now try decrypting with the wrong IV, then with a wrong key==:

```bash
xxd -r -p message.hex | openssl enc -d -aes-128-cbc -K $(cat key.hex) -iv 00000000000000000000000000000000 | xxd
xxd -r -p message.hex | openssl enc -d -aes-128-cbc -K $(openssl rand -hex 16) -iv $(cat iv.hex) | xxd
```

A wrong key usually gives a `bad decrypt` error, or sometimes garbage. A wrong IV in CBC mode is gentler: only the first 16 bytes of the plaintext come out wrong, and the rest is readable.

> Question: What does the wrong-IV result tell you about what the IV is for? Why is it safe to send the IV in the clear but not the key?

You can also give OpenSSL a password and let it derive the key. ==action: Encrypt a file with a password, then decrypt it==. Each command asks you for the password:

```bash
echo 'a secret note' > note.txt
openssl enc -aes-256-cbc -pbkdf2 -salt -in note.txt -out note.enc
openssl enc -d -aes-256-cbc -pbkdf2 -in note.enc
```

> Warning: Always give `-pbkdf2` when you use a password. Without it, OpenSSL derives the key in an older, weaker way and prints "deprecated key derivation used".

> Note: DES (`-des-cbc`) is deliberately left out. OpenSSL 3 moved it to the legacy provider, so it fails by default. That fits: its 56-bit key (2^56 possibilities) is too small to rely on.

### Public-Key Encryption with OpenSSL {#cli-public-key}

\==action: Generate an RSA key pair, and extract the public key==:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
head -1 private.pem
```

> Question: Look at the two `.pem` files. What do the header lines say? What is the text between them, and what encoding is it?

\==action: Encrypt a short message to the public key (with OAEP padding), and decrypt it with the private key==:

```bash
printf 'a short secret' | openssl pkeyutl -encrypt -pubin -inkey public.pem -pkeyopt rsa_padding_mode:oaep -out secret.bin
openssl pkeyutl -decrypt -inkey private.pem -pkeyopt rsa_padding_mode:oaep -in secret.bin
base64 -w0 secret.bin; echo
```

The last command prints the same ciphertext as Base64, which is the form you would paste into CyberChef.

> Tip: Older sheets use `openssl rsautl`. It still runs on OpenSSL 3 but is deprecated, so use `pkeyutl`.

### Hybrid Encryption by Hand {#cli-hybrid}

\==action: Encrypt a file with a random AES key, then lock that key with the public key==:

```bash
echo 'a longer message than RSA could handle directly' > report.txt
openssl rand -hex 32 > session.key
openssl rand -hex 16 > session.iv
openssl enc -aes-256-cbc -K $(cat session.key) -iv $(cat session.iv) -in report.txt -out report.enc
xxd -r -p session.key | openssl pkeyutl -encrypt -pubin -inkey public.pem -pkeyopt rsa_padding_mode:oaep -out session.key.enc
```

You would send `report.enc`, `session.iv` and `session.key.enc`. ==action: Recover the AES key with the private key, then decrypt the file==:

```bash
KEY=$(openssl pkeyutl -decrypt -inkey private.pem -pkeyopt rsa_padding_mode:oaep -in session.key.enc | xxd -p -c 64)
openssl enc -d -aes-256-cbc -K "$KEY" -iv $(cat session.iv) -in report.enc
```

### Signatures with OpenSSL {#cli-signatures}

\==action: Sign a file with the private key, then verify it with the public key==:

```bash
printf 'status report' > msg.txt
openssl dgst -sha256 -sign private.pem -out msg.sig msg.txt
openssl dgst -sha256 -verify public.pem -signature msg.sig msg.txt
```

The last command prints `Verified OK`. ==action: Change the message by one character and verify again==:

```bash
printf 'status report!' > msg2.txt
openssl dgst -sha256 -verify public.pem -signature msg.sig msg2.txt
```

This prints `Verification failure`, and the command exits with a non-zero status.

> Hint: A signature is made over the exact bytes of one file. If you sign one form of a message but verify another, such as a Base64 file and its decoded contents, you are checking a different message and it fails.

### Public-Key Encryption with GPG {#cli-gpg}

GnuPG (GPG) implements the OpenPGP standard, and does the hybrid encryption for you. To play both sides on one machine, give each person their own key ring with the `GNUPGHOME` variable.

\==action: Create two key rings and generate a key pair in each==. GPG asks for a passphrase to protect each private key:

```bash
mkdir -m 700 ~/alice ~/bob
GNUPGHOME=~/alice gpg --quick-generate-key "Alice <alice@example.com>"
GNUPGHOME=~/bob gpg --quick-generate-key "Bob <bob@example.com>"
```

\==action: List the keys and fingerprints in one ring==:

```bash
GNUPGHOME=~/alice gpg --list-keys
GNUPGHOME=~/alice gpg --fingerprint alice@example.com
GNUPGHOME=~/alice gpg --list-secret-keys
```

\==action: Export Bob's public key and import it into Alice's ring==:

```bash
GNUPGHOME=~/bob gpg --armor --export bob@example.com > bob_public.asc
GNUPGHOME=~/alice gpg --import bob_public.asc
GNUPGHOME=~/alice gpg --fingerprint bob@example.com
```

> Note: Fingerprints are how you check that you imported the right key. In real use, you would confirm Bob's fingerprint with him over a different channel, such as a phone call.

\==action: As Alice, encrypt a message to Bob, then decrypt it as Bob==:

```bash
echo 'meet at the library' > message.txt
GNUPGHOME=~/alice gpg --armor --trust-model always -r bob@example.com -o message.asc -e message.txt
GNUPGHOME=~/bob gpg -d message.asc
```

> Note: The `--trust-model always` option skips the "use this key anyway?" prompt, because here you have already checked the key yourself.

\==action: As Alice, sign the message, and as Bob, verify it==:

```bash
GNUPGHOME=~/alice gpg --armor --detach-sign message.txt
GNUPGHOME=~/alice gpg --armor --export alice@example.com > alice_public.asc
GNUPGHOME=~/bob gpg --import alice_public.asc
GNUPGHOME=~/bob gpg --verify message.txt.asc message.txt
```

\==action: Add a line to `message.txt` and verify again==. GPG reports `BAD signature`.

> Warning: Use `~/alice` and `~/bob` for practice only. Delete them when you finish, and never export or share the secret key of a real identity.

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you have finished the game. Use your own run: the values in your game were generated for you, and the ending you reached may differ from other students'. Each section has questions to think about, then an exercise that produces something you can hand in. Your tutor will say which to submit.

> Tip: Keep your CyberChef recipes and your notepad pages from the game. Screenshots of them make good evidence for the exercises.

### 1. Encoding Is Not Security {#q-encoding}

> Question: Which of the locks in the game were opened by an encoding, and which needed a key? What is the practical difference between the two? Why can a tool such as CyberChef's Magic undo an encoding without being told anything?

> Question: Trial II's digits decoded into more digits. Explain, using the ASCII table, why that happens, and why Magic read them as four capital letters instead.

> Question: A developer stores user passwords as Base64 in a database and says they are "encoded for security". What is wrong with that? What should they have used instead, and why?

> Question: A message is encoded in hex, then Base64, then hex again. Does that make it more secure? What would you do first when you meet unknown data like this?

> Action: Write a one-page note for a non-technical colleague, headed "Encoding, encryption and hashing: what is the difference?". Include one example of each from the game, what you would need to reverse it, and one real-world mistake that comes from confusing them. Hand it in.

### 2. Keys, IVs and Key Distribution {#q-keys}

> Question: In the game you needed an AES key and an IV. Why can the IV be sent in the clear, while the key cannot? What goes wrong if the same IV is reused with the same key? Look up what CBC does with the IV before you answer.

> Question: In the Vigenère lock, the key was in a different place from the message. Why does a key have to travel separately from the ciphertext? What would an attacker gain from seeing both together?

> Question: The key distribution problem is that two people need a shared secret before they can use symmetric encryption. Describe it in your own words. Give two ways people have tried to solve it, and say what each costs.

> Question: Why was only one of the sealed envelopes readable with your private key, and what would have been needed to read the others? What does that tell you about who a public-key message is for?

> Question: Why did the envelope contain an AES key rather than the message itself? What would be slow, or impossible, about using RSA for everything?

> Action: Draw a diagram of hybrid encryption using what you did in the game. Label what is sent, which key is public, which is private, which is symmetric, and what an eavesdropper sees. Then write four sentences explaining why ransomware uses the same design, and what this means for victims who have no backup. Hand in the diagram and your four sentences.

### 3. Hashes and Signatures {#q-hashes}

> Question: A single invisible new line changed the hash. What does that tell you about what a hash covers? Give one practical situation where this property is useful and one where it caused you trouble in the game.

> Question: Why is a bare SHA-256 a poor way to store passwords, even though it cannot be reversed? What do real password-storage schemes add?

> Question: When you checked the signature on the report, what did "verified" prove, and what did it not prove? Who must you trust for the check to mean anything, and what did you use to decide whether the public key was the right one?

> Question: Why did the signature cover the Base64 file rather than the text inside it? What happens if you verify a different form of the same content?

> Question: The decoded report contained a link to a tiny remote image (a tracking pixel). What would the owner of the server learn when the report was opened? Why was the signature no protection against that?

> Question: Why did it matter that you decoded the report before sending it? What do you do in real life when you are asked to forward something you cannot read?

> Action: Pick any file on your computer. Write a short procedure for publishing it so that a reader can check it has not been altered, using a hash only, then using a signature. State what each method can and cannot detect, and what the reader must already have, or trust, for each to work. Hand in your procedure, with the commands you used and their output.

### 4. Choices and Consequences {#q-choices}

> Question: What did you do with the report at the end, and what did you know when you decided? What would you have wanted to know first?

> Question: Choose another ending. What would have to be true for you to choose it? Which technical fact from the game would most change your decision?

> Question: Read your debrief and the credits. Did anything in the game's version of events surprise you? What would you do differently in a real engagement?

### 5. Break Things Yourself {#exercises}

> Action: Without CyberChef, decode this by hand and show your working: `01000011 01111001 01100010 01100101 01110010`. Then write the same word in decimal, in hex, and in Base64 (use the worked `Cat` example as a guide), and check all three in CyberChef. Hand in your working.

> Action: Write a short script, in any language, that decrypts a Vigenère ciphertext given the key. Test it on a message you encrypt yourself. Then try to break your own cipher without the key, using only a longer message and letter frequencies, and report how long a message you needed. Hand in the script, an example run, and a paragraph on what you found.

> Action: In CyberChef, build a recipe with at least three layers of encoding on a message of your choice, and swap it with a classmate. Time how long it takes each of you to peel it, with and without Magic. Hand in the recipe, the times, and a paragraph on what Magic could not do.

> Action: Use the command-line section to encrypt a file with AES-256 and a password, and then with an explicit key and IV. Decrypt both in CyberChef. Hand in the commands, the CyberChef recipes (a screenshot of each), and a paragraph explaining why one needed an IV supplied and the other did not.

> Action: Using the GPG exercises, set up two key rings and have each person send the other a message, with the fingerprints checked. Then change one character in the ciphertext. Hand in your terminal log and a sentence on what changed, and what that shows.

> Action: Write a worked estimate: how long would it take to try every key of a cipher with a 56-bit key, and with a 128-bit key, if a machine could test one billion keys a second? State your assumptions. Hand in the arithmetic and one sentence on what it means for choosing key sizes.

## Further Reading {#further-reading}

- Read the CyberChef documentation and its wiki, and try the Magic operation on data you have not seen before.
- RFC 4648 defines Base16, Base32 and Base64 encodings.
- NIST publishes the standards for AES (FIPS 197), SHA-2 (FIPS 180-4) and digital signatures (FIPS 186).
- The OpenSSL manual pages (`man openssl-enc`, `man openssl-pkeyutl`, `man openssl-dgst`) and the GnuPG manual describe every option used above.
- The Cyber Security Body of Knowledge (CyBOK) chapter on Applied Cryptography covers these topics in more depth.
