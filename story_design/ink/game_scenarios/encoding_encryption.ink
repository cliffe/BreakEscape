// Encoding and Encryption - Game Scenario Version
// Based on HacktivityLabSheets: cyber_security_landscape/4_encoding_encryption.md
// License: CC BY-SA 4.0

// Global persistent state
VAR haxolottle_rapport = 0

// External variables
EXTERNAL player_name

=== start ===
Haxolottle: {player_name}, want to learn about encoding and encryption?

Haxolottle: These two concepts sound similar but serve very different purposes, little axolotl.

Haxolottle: We'll cover encoding schemes like Base64 and hex, symmetric encryption with AES, and asymmetric cryptography with GPG.

-> crypto_hub

// ===========================================
// MAIN HUB
// ===========================================

=== crypto_hub ===
Haxolottle: What would you like to explore?

+ [Encoding vs Encryption - what's the difference?]
    -> encoding_vs_encryption
+ [Character encoding and ASCII]
    -> character_encoding
+ [Hexadecimal and Base64]
    -> hex_and_base64
+ [Symmetric key encryption]
    -> symmetric_encryption
+ [Public key cryptography]
    -> public_key_crypto
+ [OpenSSL tools and commands]
    -> openssl_tools
+ [GPG key management]
    -> gpg_intro
+ [Show me the commands reference]
    -> commands_reference
+ [I'm good for now]
    #exit_conversation
    -> END

// ===========================================
// ENCODING VS ENCRYPTION
// ===========================================

=== encoding_vs_encryption ===
~ haxolottle_rapport += 5

Haxolottle: Excellent starting point. These terms get confused constantly.

Haxolottle: **Encoding** transforms data into a different format using a publicly known, reversible scheme. Anyone can decode it - no secret required.

Haxolottle: **Encryption** transforms data into a format readable only with a key or password. Without the key, the data is protected.

Haxolottle: Think of it this way: encoding is like translating a book to a different language. Anyone with the right dictionary can read it. Encryption is like using a secret cipher - only those with the key can decode it.

* [Why use encoding if it's not secure?]
    ~ haxolottle_rapport += 8
    You: If encoding doesn't provide security, why use it?
    Haxolottle: Compatibility and efficiency. Base64, for instance, lets you safely transmit binary data over text-only protocols like email. Hexadecimal makes binary data human-readable for debugging.
    Haxolottle: Encoding solves technical problems. Encryption solves security problems. Different tools for different jobs.
* [Can you give examples of each?]
    You: What are common examples of encoding and encryption?
    Haxolottle: Encoding: Base64, hexadecimal, ASCII, URL encoding. Used for data representation.
    Haxolottle: Encryption: AES, RSA, DES. Used for data protection.
    Haxolottle: If you find Base64 data, don't assume it's encrypted - it's just encoded. Trivial to reverse.
* [Got it]
    You: Clear distinction.
- -> crypto_hub

// ===========================================
// CHARACTER ENCODING
// ===========================================

=== character_encoding ===
~ haxolottle_rapport += 5

Haxolottle: Let's start with the basics - how computers represent text.

Haxolottle: ASCII - American Standard Code for Information Interchange. Maps characters to numbers. For example, "hello!" is:
- Decimal: 104 101 108 108 111 33
- Hex: 68 65 6c 6c 6f 21
- Binary: 01101000 01100101 01101100 01101100 01101111 00100001

Haxolottle: All the same data, just different representations.

* [Why multiple representations?]
    ~ haxolottle_rapport += 8
    You: Why do we need so many ways to represent the same thing?
    Haxolottle: Context. Humans read decimal. Computers process binary. Hex is compact for humans to read binary - two hex digits per byte.
    Haxolottle: Choose the representation that fits your needs. Debugging network traffic? Hex. Mathematical operations? Decimal. Actual processing? Binary.
* [Tell me about Unicode]
    You: How does Unicode fit in?
    Haxolottle: ASCII is 7-bit, covers English characters. Unicode extends this to support every language, emoji, symbols.
    Haxolottle: UTF-8 is the dominant Unicode encoding - backward-compatible with ASCII, supports international characters efficiently.
    Haxolottle: Most modern systems use UTF-8 by default.
* [Show me practical commands]
    You: What commands convert between these formats?
    Haxolottle: `xxd` is your friend. Try:
    - `echo hello! | xxd` for hex output
    - `echo hello! | xxd -b` for binary
    - `echo 68656c6c6f21 | xxd -r -p` to convert hex back to text
    Haxolottle: Python's also excellent: `"hello!".encode().hex()` gets you hex.
- -> crypto_hub

// ===========================================
// HEX AND BASE64
// ===========================================

=== hex_and_base64 ===
~ haxolottle_rapport += 5

Haxolottle: Two encoding schemes you'll encounter constantly: hexadecimal and Base64.

Haxolottle: **Hexadecimal**: Base-16. Uses 0-9 and a-f. Two hex characters per byte. Compact, human-readable representation of binary data.

Haxolottle: **Base64**: Uses A-Z, a-z, 0-9, +, /, and = for padding. More efficient than hex for transmitting binary data. Four characters represent three bytes.

* [When do I use Base64 vs hex?]
    ~ haxolottle_rapport += 10
    You: How do I choose between Base64 and hex?
    Haxolottle: Base64 when efficiency matters - 33% overhead vs 100% for hex. Common in web protocols, email attachments, JSON/XML with binary data.
    Haxolottle: Hex when human readability and debugging matter. Easier to spot patterns, map directly to bytes.
    Haxolottle: In CTFs and forensics? You'll see both constantly. Learn to recognize them on sight.
* [Show me Base64 commands]
    You: Walk me through Base64 encoding.
    Haxolottle: Simple: `echo "text" | base64` encodes. `echo "encoded" | base64 -d` decodes.
    Haxolottle: Try this chain: `echo "Valhalla" | base64 | xxd -p | xxd -r -p | base64 -d`
    Haxolottle: You're encoding to Base64, converting to hex, converting back, decoding Base64. Should get "Valhalla" back. Demonstrates reversibility.
* [How do I recognize Base64?]
    You: How can I identify Base64 when I see it?
    Haxolottle: Look for: alphanumeric characters, sometimes with + and /, often ending in = or ==.
    Haxolottle: Length is always multiple of 4 (due to padding).
    Haxolottle: Classic tell: mix of uppercase, lowercase, and numbers, ending in equals signs.
    Haxolottle: Example: `VmFsaGFsbGEK` - that's Base64.
- -> crypto_hub

// ===========================================
// SYMMETRIC ENCRYPTION
// ===========================================

=== symmetric_encryption ===
~ haxolottle_rapport += 5

Haxolottle: Symmetric encryption - the same key encrypts and decrypts. Fast, efficient, but has a key distribution problem.

Haxolottle: Two main algorithms you'll use: DES and AES.

* [Tell me about DES]
    You: What's DES?
    -> des_explanation
* [Tell me about AES]
    You: What's AES?
    -> aes_explanation
* [What's the key distribution problem?]
    ~ haxolottle_rapport += 10
    You: You mentioned a key distribution problem?
    Haxolottle: The fundamental challenge of symmetric crypto: how do you securely share the key?
    Haxolottle: If you encrypt a message with AES, your recipient needs the same key to decrypt. How do you get them the key without an attacker intercepting it?
    Haxolottle: This is where public key crypto comes in - or secure key exchange protocols like Diffie-Hellman.
    -> symmetric_encryption
* [Back to main menu]
    -> crypto_hub

=== des_explanation ===
~ haxolottle_rapport += 5

Haxolottle: DES - Data Encryption Standard. Developed by IBM in the 1970s, based on Feistel ciphers.

Haxolottle: 56-bit key size. Small by modern standards - brute-forceable in reasonable time with modern hardware.

Haxolottle: Historical importance, but don't use it for real security anymore. Superseded by AES.

Haxolottle: OpenSSL command: `openssl enc -des-cbc -pbkdf2 -in file.txt -out file.enc`

* [Why is 56-bit insufficient?]
    ~ haxolottle_rapport += 8
    You: Why is 56 bits too small?
    Haxolottle: 2^56 possible keys - about 72 quadrillion. Sounds large, but modern systems can test millions or billions of keys per second.
    Haxolottle: DES was cracked in less than 24 hours in 1999. Hardware has only improved since then.
    Haxolottle: Compare to AES-256: 2^256 keys. Astronomically larger. Not brute-forceable with current or foreseeable technology.
* [Show me the decryption command]
    You: How do I decrypt DES-encrypted data?
    Haxolottle: `openssl enc -des-cbc -d -in file.enc -out decrypted.txt`
    Haxolottle: The `-d` flag specifies decryption. You'll be prompted for the password.
    Haxolottle: Note: password and key aren't quite the same. The password is hashed with PBKDF2 to derive the actual encryption key.
- -> symmetric_encryption

=== aes_explanation ===
~ haxolottle_rapport += 5

Haxolottle: AES - Advanced Encryption Standard. The modern symmetric encryption standard.

Haxolottle: 128-bit block cipher. Key sizes: 128, 192, or 256 bits. Uses substitution-permutation network - combination of substitution, permutation, mixing, and key addition.

Haxolottle: Fast, secure, widely supported. This is what you should be using for symmetric encryption.

* [How much stronger is AES than DES?]
    ~ haxolottle_rapport += 10
    You: Quantify the security improvement over DES.
    Haxolottle: DES: 2^56 keyspace. AES-128: 2^128. AES-256: 2^256.
    Haxolottle: AES-128 has 2^72 times more keys than DES. AES-256 has 2^200 times more keys than AES-128.
    Haxolottle: To put it in perspective: if you could test a trillion trillion keys per second, AES-256 would still take longer than the age of the universe to brute force.
    Haxolottle: Practical attacks on AES focus on implementation flaws, side channels, or compromising the key - not brute forcing.
* [Show me AES commands]
    You: Walk me through AES encryption.
    Haxolottle: Encrypt: `openssl enc -aes-256-cbc -pbkdf2 -in file.txt -out file.enc`
    Haxolottle: Decrypt: `openssl enc -aes-256-cbc -d -in file.enc -out file.txt`
    Haxolottle: You can use -aes-128-cbc, -aes-192-cbc, or -aes-256-cbc depending on key size.
    Haxolottle: CBC mode is Cipher Block Chaining. ECB mode also available but has security weaknesses - avoid for real use.
* [What's CBC mode?]
    ~ haxolottle_rapport += 8
    You: Explain CBC mode.
    Haxolottle: Cipher Block Chaining. Each block of plaintext is XORed with the previous ciphertext block before encryption.
    Haxolottle: This means identical plaintext blocks produce different ciphertext - hides patterns.
    Haxolottle: ECB (Electronic Codebook) encrypts each block independently - same input always produces same output. Leaks pattern information.
    Haxolottle: Always use CBC or more modern modes like GCM. Never use ECB for real data.
- -> symmetric_encryption

// ===========================================
// PUBLIC KEY CRYPTOGRAPHY
// ===========================================

=== public_key_crypto ===
~ haxolottle_rapport += 5

Haxolottle: Asymmetric cryptography. Revolutionary concept - separate keys for encryption and decryption.

Haxolottle: **Public key**: shared freely. Anyone can use it to encrypt messages to you.
**Private key**: kept secret. Only you can decrypt messages encrypted with your public key.

Haxolottle: Solves the key distribution problem. You can publish your public key openly - doesn't compromise security.

* [How does this actually work?]
    ~ haxolottle_rapport += 10
    You: What's the underlying mechanism?
    Haxolottle: Mathematics - specifically, functions that are easy to compute in one direction but extremely hard to reverse without special information.
    Haxolottle: RSA uses factoring large prime numbers. Easy to multiply two huge primes, nearly impossible to factor the result back without knowing the primes.
    Haxolottle: Your private key contains the primes. Your public key contains their product. Encryption uses the product, decryption needs the primes.
    Haxolottle: Full math is beyond this course, but that's the essence. One-way mathematical trap doors.
* [What's the downside?]
    ~ haxolottle_rapport += 8
    You: This sounds perfect. What's the catch?
    Haxolottle: Performance. Asymmetric crypto is much slower than symmetric.
    Haxolottle: Typical use: asymmetric crypto to exchange a symmetric key, then symmetric crypto for actual data.
    Haxolottle: TLS/SSL does exactly this - RSA or ECDH to agree on a session key, then AES to encrypt the connection.
    Haxolottle: Hybrid approach gets security of asymmetric with performance of symmetric.
* [Tell me about GPG]
    You: How does GPG fit into this?
    Haxolottle: GPG - GNU Privacy Guard. Open source implementation of PGP (Pretty Good Privacy).
    Haxolottle: Provides public-key crypto for email encryption, file encryption, digital signatures.
    Haxolottle: Industry standard for email security and file protection.
    -> gpg_intro
- -> crypto_hub

// ===========================================
// OPENSSL TOOLS
// ===========================================

=== openssl_tools ===
~ haxolottle_rapport += 5

Haxolottle: OpenSSL - the Swiss Army knife of cryptography.

Haxolottle: It's a toolkit implementing SSL/TLS protocols and providing cryptographic functions. Command-line tool plus libraries.

Haxolottle: Can do: key generation, encryption, decryption, hashing, certificate management, SSL/TLS testing, and much more.

* [Show me useful commands]
    You: What are the most useful OpenSSL commands?
    Haxolottle: List available ciphers: `openssl list -cipher-algorithms`
    Haxolottle: Generate hash: `echo "data" | openssl dgst -sha256`
    Haxolottle: Encrypt file: `openssl enc -aes-256-cbc -in file -out file.enc`
    Haxolottle: Check certificate: `openssl x509 -in cert.pem -text -noout`
    Haxolottle: Test SSL connection: `openssl s_client -connect example.com:443`
    Haxolottle: Generate random bytes: `openssl rand -hex 32`
* [Tell me about the 2014 vulnerability]
    ~ haxolottle_rapport += 15
    You: You mentioned a major OpenSSL vulnerability in 2014?
    Haxolottle: Heartbleed. CVE-2014-0160. One of the most significant security flaws in internet history.
    Haxolottle: Bug in OpenSSL's implementation of TLS heartbeat extension. Allowed attackers to read server memory - including private keys, passwords, session tokens.
    Haxolottle: Affected two-thirds of web servers. Required widespread patching and certificate replacement.
    Haxolottle: Important lesson: even cryptographic implementations can have bugs. The algorithms (AES, RSA) were fine - the implementation was flawed.
    Haxolottle: This is why: keep software updated, use well-audited libraries, implement defense in depth.
* [How do I check OpenSSL version?]
    You: How do I know what version I'm running?
    Haxolottle: `openssl version -a` shows version and build details.
    Haxolottle: Post-Heartbleed, you want OpenSSL 1.0.1g or later, or 1.0.2 series.
    Haxolottle: Most modern systems use OpenSSL 1.1.1 or 3.x now.
- -> crypto_hub

// ===========================================
// GPG INTRODUCTION
// ===========================================

=== gpg_intro ===
~ haxolottle_rapport += 5

Haxolottle: GPG - GNU Privacy Guard. Open-source public-key cryptography and signing tool.

Haxolottle: Core concepts: key pairs (public and private), encryption, decryption, signing, verification.

* [Walk me through key generation]
    You: How do I create GPG keys?
    Haxolottle: `gpg --gen-key` starts the process. You'll provide name, email, passphrase.
    Haxolottle: This creates a key pair. Public key you share, private key you protect.
    Haxolottle: The passphrase protects your private key - don't forget it! Without it, your private key is useless.
* [How do I share my public key?]
    You: How do others get my public key?
    Haxolottle: Export it: `gpg --export -a "Your Name" > public.key`
    Haxolottle: This creates ASCII-armored public key file. Share it via email, website, key server.
    Haxolottle: Recipients import it: `gpg --import public.key`
    Haxolottle: Now they can encrypt messages only you can read.
* [Encrypting and decrypting]
    You: Show me the encryption workflow.
    Haxolottle: Encrypt: `gpg -e -r "Recipient Name" file.txt` creates file.txt.gpg
    Haxolottle: Decrypt: `gpg -d file.txt.gpg > decrypted.txt`
    Haxolottle: Recipient's public key must be in your keyring to encrypt for them.
    Haxolottle: Your private key must be available to decrypt messages to you.
* [What about digital signatures?]
    ~ haxolottle_rapport += 10
    You: How do signatures work?
    Haxolottle: Signatures prove a message came from you and wasn't modified.
    Haxolottle: Sign: `gpg -s file.txt` - creates file.txt.gpg with signature
    Haxolottle: Verify: `gpg --verify file.txt.gpg` - confirms signature and shows signer
    Haxolottle: Uses your private key to sign, others use your public key to verify. Reverse of encryption.
    Haxolottle: Provides authenticity and integrity - critical for software distribution, secure communications.
- -> crypto_hub

// ===========================================
// COMMANDS REFERENCE
// ===========================================

=== commands_reference ===
Haxolottle: Quick reference for the commands we've covered:

Haxolottle: **Encoding:**
- Hex: `echo "text" | xxd -p` (encode), `echo "hex" | xxd -r -p` (decode)
- Base64: `echo "text" | base64` (encode), `echo "b64" | base64 -d` (decode)
- View as binary: `xxd -b file`

Haxolottle: **Symmetric Encryption (OpenSSL):**
- AES encrypt: `openssl enc -aes-256-cbc -pbkdf2 -in file -out file.enc`
- AES decrypt: `openssl enc -aes-256-cbc -d -in file.enc -out file.txt`
- DES encrypt: `openssl enc -des-cbc -pbkdf2 -in file -out file.enc`
- List ciphers: `openssl list -cipher-algorithms`

Haxolottle: **Public Key Crypto (GPG):**
- Generate keys: `gpg --gen-key`
- List keys: `gpg --list-keys`
- Export public: `gpg --export -a "Name" > public.key`
- Import key: `gpg --import key.asc`
- Encrypt: `gpg -e -r "Recipient" file`
- Decrypt: `gpg -d file.gpg`
- Sign: `gpg -s file`
- Verify: `gpg --verify file.gpg`

Haxolottle: **Useful OpenSSL:**
- Hash: `openssl dgst -sha256 file`
- Random data: `openssl rand -hex 32`
- Version: `openssl version`

+ [Back to main menu]
    -> crypto_hub

-> END
