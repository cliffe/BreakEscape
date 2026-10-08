---
title: "Introduction to Cryptography: Encoding and Encryption (The Keyholder Trials)"
author: ["Mo Hassan", "Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a short browser-based escape-room game to learn how data is encoded and encrypted: bits, bytes, ASCII, hex, Base64, classical ciphers, AES, public-key encryption, hashes and digital signatures, all solved in CyberChef."
overview: |
  Cryptography is how we keep data private and check that it has not been changed. Before you can use it, or attack it, you need to know what you are looking at: is this data encoded, encrypted or hashed, and what would it take to reverse it?

  In The Keyholder Trials you go undercover as a first-year student at Miskatonic University UK. A company is recruiting students through a trail of puzzles, and every lock in the trail opens when you decode or decrypt something in CyberChef, the browser-based data tool built into the game. You start from what a bit is and work up through ASCII, hexadecimal, Base64, Caesar and Vigenère ciphers, symmetric encryption with AES, public-key encryption, hashes and digital signatures.

  The game runs entirely in your browser: there are no virtual machines. This sheet gives you a way in, a short concepts section to come back to, an optional section that repeats the same operations on the Linux command line with xxd, base64, OpenSSL and GPG, and questions and exercises for after the game.
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
- use CyberChef to decode, decrypt, hash and verify data
- explain what symmetric and public-key encryption each solve, and why real systems combine them
- explain what a hash and a digital signature do, and what they do not do

The game teaches by doing, and it has no quizzes. The questions are in this sheet, after the game.

## Getting Started {#getting-started}

You play Agent 0x00, a SAFETYNET agent who has gone undercover as a first-year student at Miskatonic University UK. A company has been spotting students through a studentship, and a trail of puzzles around campus is how it picks them. Your handler, Agent HaX, wants you inside. You do not need to know anything about cryptography before you start. The game builds up from what a bit is, and Agent HaX and the lecturers you meet give you short field notes on each scheme as you reach it.

Everything you need is in the browser. There are no virtual machines and nothing to submit on the Hacktivity website: everything happens inside the game. Your game is generated just for you, so the words and numbers you find will differ from other students', and there is nothing to copy from a neighbour. Sharing ideas and recipes is fine.

1. \==action: Launch **The Keyholder Trials** from the BreakEscape scenario selection screen==. It is in the escape room collection.
2. \==action: Watch the briefing from Agent HaX==, then ==action: explore the foyer and talk to the people in it==.
3. \==action: Find the lecturer who has the lab laptop, and take it==. It holds CyberChef.
4. \==action: Open the notepad and the field notes you collect==. You can reopen any of them at any time.

The game takes about 75 to 90 minutes. In a 60-minute class, stop when the pigeonholes open (Trial VII, about 45 minutes in) and resume the same game next time. You can stop and resume at any point: your progress, notes and unlocked rooms are kept. Your position in the building and your CyberChef recipe are not kept.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Every lock opens with something you work out in CyberChef: a word, a PIN or a password. Hints are available from Agent HaX's phone if you are stuck.

> Tip: In CyberChef, paste the clue into **Input** (top right). Type the name of an operation into **Search** (top left) and double-click it to add it to the **Recipe** (middle). The answer appears in **Output** (bottom right). The arrow next to the close button opens CyberChef in its own browser tab, so you can keep the clue and the recipe side by side.

> Tip: Copy codes with the mouse and Ctrl+C (Cmd+C on a Mac) or a file's **Copy** button. Never retype a long code by hand: one wrong character gives a wrong answer with no explanation.

> Warning: Passwords are exact. A capital letter, a full stop, a space or an extra word makes the lock refuse them, and it does not tell you why. If you think you have decoded something correctly and it will not open, check what you actually typed.

> Tip: Use the pencil on a notepad page to write down anything you will need later. Some values are used several rooms after you find them.

> Warning: Do not reload the page to fix a problem. Your progress is kept, but your CyberChef recipe is lost and you are returned to the foyer.

> Hint: If a decode gives you nonsense, do not guess. Look at what kind of characters the clue is made of, and compare it with the descriptions in the concepts section below.

## Concepts to Come Back To {#concepts}

You do not need to read this before you play. Use it when a field note leaves you wanting more, and again afterwards when you answer the questions.

### Encoding, Encryption and Hashing {#encoding-encryption-hashing}

|                                    | Encoding                                                          | Encryption                                   | Hashing                                                       |
| ---------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| Purpose                            | Represent data in a form that is easier to store, send or display | Keep data secret from anyone without the key | Make a short fingerprint of data, to check it has not changed |
| Key or secret needed to reverse it | None. The scheme is public                                        | Yes: the key                                 | Not reversible                                                |
| Output length                      | Depends on the input                                              | Depends on the input                         | Fixed, whatever the input                                     |
| Examples                           | ASCII, hex, Base64                                                | Caesar, Vigenère, AES, RSA                   | SHA-256                                                       |

Encoding is not security. Anyone who recognises the scheme can undo it, and tools like CyberChef's Magic will often recognise it for them. Encryption is only as good as the key: if the key is weak, guessed, or sent along with the message, the cipher does not help. A hash is a one-way function, so you cannot "decrypt" one, though you can guess inputs and compare.

### Bits, Bytes and Bases {#bits-bytes-bases}

A **bit** is a 0 or a 1. A **byte** is eight bits, so it can hold 256 different values (0 to 255). A **number base** is how many symbols you count with before you carry:

- **Binary** (base 2) uses 0 and 1. In a byte the place values are 128, 64, 32, 16, 8, 4, 2, 1. For example `01001101` is 64 + 8 + 4 + 1 = 77.
- **Decimal** (base 10) uses 0 to 9.
- **Hexadecimal** (base 16, "hex") uses 0 to 9 and a to f. One hex digit is exactly four bits, so a byte is always two hex digits. 77 is `4d`.

That fixed width is why hex can run together without separators and still be read, while run-together decimal cannot: a decimal code may be two or three digits long.

### Character Encodings and ASCII {#ascii}

A **character encoding** is an agreed table from numbers to characters. **ASCII** covers the English letters, digits, punctuation and some control codes, using the numbers 0 to 127. A few to remember: `A` is 65, `a` is 97, a space is 32, and the digit `4` is 52, not 4. Digits are characters too: `0` to `9` are 48 to 57.

**Unicode** is a much bigger table covering most of the world's writing systems and emoji. **UTF-8** is the usual way of storing it as bytes, and it matches ASCII for the first 128 characters. Other tables exist: IBM mainframes used EBCDIC, where `A` is 0xC1 rather than 0x41. Same letters, different numbers, so you need to know which table was used.

### Base64 {#base64}

Base64 turns any bytes into plain printable text, so they can travel safely through email, web pages and JSON. It takes three bytes (24 bits), cuts them into four groups of 6 bits, and writes each group as one of 64 symbols: `A` to `Z`, `a` to `z`, `0` to `9`, `+` and `/`. If the input is not a multiple of three bytes, `=` signs pad the end. So the output is about a third longer than the input, its length is a multiple of four, and it may end in `=` or `==`. It is an encoding: no key, no secrecy.

PEM files, the text format for keys and certificates, are Base64 between a pair of header lines.

### Classical Ciphers {#classical-ciphers}

A **Caesar cipher** shifts every letter along the alphabet by the same number of places. The shift is the key. There are only 25 useful shifts, so an attacker can try them all in seconds. That is **brute force**, and it is why the cipher is not secure.

A **Vigenère cipher** uses a keyword. Each letter of the keyword gives the shift for one letter of the message, and the keyword repeats. Counting by hand stops working, and the same plaintext letter can give different ciphertext letters. It is stronger than Caesar, but still breakable with enough text, and useless if someone has the key. Any extra characters inside the ciphertext shift the keyword out of step, so copy only the ciphertext.

### Symmetric Encryption: AES {#symmetric-encryption}

In **symmetric encryption** the same secret key locks and unlocks the data. DES, designed in the 1970s, uses 56-bit keys, so there are 2^56 possible keys. Modern hardware can search that, so DES is no longer safe. **AES** is a block cipher that works on 128-bit (16-byte) blocks, with a key of 128, 192 or 256 bits. 2^128 is far beyond brute force, so attacks target how the cipher is used, or the key.

Two more things you need to know about how AES is used:

- A **mode** says how blocks are chained. In **CBC** (cipher block chaining) each block is mixed with the one before it, so identical blocks of plaintext do not give identical blocks of ciphertext. The first block has no predecessor, so it is mixed with an **initialisation vector (IV)**.
- The IV must be unpredictable and must not be reused with the same key, but it does not need to be secret. It travels with the ciphertext. The key must stay secret.

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

## Try It on the Command Line (Optional) {#command-line}

CyberChef is convenient, but you will often have only a shell, for example on a server you are investigating. These are the equivalents of what you did in the game. Use any current Linux distribution, such as Kali, Ubuntu or Debian, with `xxd`, `base64`, `openssl` and `gpg` installed. Use your own example data, not anything from the game.

> Tip: `echo` adds a new line to the end of its output and `printf '%s'` does not. For encodings and especially for hashes, that one invisible byte changes the answer. The commands below use `printf` where it matters.

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

> Tip: `iconv -l` lists every character set your system knows.

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

> Note: `--trust-model always` skips the "use this key anyway?" prompt, because here you have already checked the key yourself.

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
