// ===========================================
// CRYPTOGRAPHY LAB: ENCODING AND ENCRYPTION
// Introduction to Cryptography
// ===========================================
// Game-Based Learning replacement for lab sheet
// Original: cyber_security_landscape/4_encoding_encryption.md
// ===========================================

// Global persistent state
VAR instructor_rapport = 0

// External variables
EXTERNAL player_name

// ===========================================
// ENTRY POINT
// ===========================================

=== start ===
Crypto Instructor: Welcome to Cryptography Fundamentals, Agent {player_name}.

Crypto Instructor: Today we're covering encoding and encryption - two concepts that sound similar but serve very different purposes.

Crypto Instructor: You'll learn about encoding schemes like Base64 and hexadecimal, symmetric encryption with AES and DES, and asymmetric cryptography with GPG.

Crypto Instructor: These skills are essential for any security professional. Let's begin.

-> crypto_hub

// ===========================================
// MAIN HUB
// ===========================================

=== crypto_hub ===
Crypto Instructor: What would you like to explore?

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
+ [I'm ready for the practical challenges]
    -> ready_for_practice
+ [That's all for now]
    #exit_conversation
    -> END

// ===========================================
// ENCODING VS ENCRYPTION
// ===========================================

=== encoding_vs_encryption ===
~ instructor_rapport += 5

Crypto Instructor: Excellent starting point. These terms get confused constantly.

Crypto Instructor: **Encoding** transforms data into a different format using a publicly known, reversible scheme. Anyone can decode it - no secret required.

Crypto Instructor: **Encryption** transforms data into a format readable only with a key or password. Without the key, the data is protected.

Crypto Instructor: Think of it this way: encoding is like translating a book to a different language. Anyone with the right dictionary can read it. Encryption is like using a secret cipher - only those with the key can decode it.

* [Why use encoding if it's not secure?]
    ~ instructor_rapport += 8
    You: If encoding doesn't provide security, why use it?
    Crypto Instructor: Compatibility and efficiency. Base64, for instance, lets you safely transmit binary data over text-only protocols like email. Hexadecimal makes binary data human-readable for debugging.
    Crypto Instructor: Encoding solves technical problems. Encryption solves security problems. Different tools for different jobs.
* [Can you give examples of each?]
    You: What are common examples of encoding and encryption?
    Crypto Instructor: Encoding: Base64, hexadecimal, ASCII, URL encoding. Used for data representation.
    Crypto Instructor: Encryption: AES, RSA, DES. Used for data protection.
    Crypto Instructor: If you find Base64 data, don't assume it's encrypted - it's just encoded. Trivial to reverse.
* [Got it]
    You: Clear distinction.
- -> crypto_hub

// ===========================================
// CHARACTER ENCODING
// ===========================================

=== character_encoding ===
~ instructor_rapport += 5

Crypto Instructor: Let's start with the basics - how computers represent text.

Crypto Instructor: ASCII - American Standard Code for Information Interchange. Maps characters to numbers. For example, "hello!" is:
- Decimal: 104 101 108 108 111 33
- Hex: 68 65 6c 6c 6f 21
- Binary: 01101000 01100101 01101100 01101100 01101111 00100001

Crypto Instructor: All the same data, just different representations.

* [Why multiple representations?]
    ~ instructor_rapport += 8
    You: Why do we need so many ways to represent the same thing?
    Crypto Instructor: Context. Humans read decimal. Computers process binary. Hex is compact for humans to read binary - two hex digits per byte.
    Crypto Instructor: Choose the representation that fits your needs. Debugging network traffic? Hex. Mathematical operations? Decimal. Actual processing? Binary.
* [Tell me about Unicode]
    You: How does Unicode fit in?
    Crypto Instructor: ASCII is 7-bit, covers English characters. Unicode extends this to support every language, emoji, symbols.
    Crypto Instructor: UTF-8 is the dominant Unicode encoding - backward-compatible with ASCII, supports international characters efficiently.
    Crypto Instructor: Most modern systems use UTF-8 by default.
* [Show me practical commands]
    You: What commands convert between these formats?
    Crypto Instructor: `xxd` is your friend. Try:
    - `echo hello! | xxd` for hex output
    - `echo hello! | xxd -b` for binary
    - `echo 68656c6c6f21 | xxd -r -p` to convert hex back to text
    Crypto Instructor: Python's also excellent: `"hello!".encode().hex()` gets you hex.
- -> crypto_hub

// ===========================================
// HEX AND BASE64
// ===========================================

=== hex_and_base64 ===
~ instructor_rapport += 5

Crypto Instructor: Two encoding schemes you'll encounter constantly: hexadecimal and Base64.

Crypto Instructor: **Hexadecimal**: Base-16. Uses 0-9 and a-f. Two hex characters per byte. Compact, human-readable representation of binary data.

Crypto Instructor: **Base64**: Uses A-Z, a-z, 0-9, +, /, and = for padding. More efficient than hex for transmitting binary data. Four characters represent three bytes.

* [When do I use Base64 vs hex?]
    ~ instructor_rapport += 10
    You: How do I choose between Base64 and hex?
    Crypto Instructor: Base64 when efficiency matters - 33% overhead vs 100% for hex. Common in web protocols, email attachments, JSON/XML with binary data.
    Crypto Instructor: Hex when human readability and debugging matter. Easier to spot patterns, map directly to bytes.
    Crypto Instructor: In CTFs and forensics? You'll see both constantly. Learn to recognize them on sight.
* [Show me Base64 commands]
    You: Walk me through Base64 encoding.
    Crypto Instructor: Simple: `echo "text" | base64` encodes. `echo "encoded" | base64 -d` decodes.
    Crypto Instructor: Try this chain: `echo "Valhalla" | base64 | xxd -p | xxd -r -p | base64 -d`
    Crypto Instructor: You're encoding to Base64, converting to hex, converting back, decoding Base64. Should get "Valhalla" back. Demonstrates reversibility.
* [How do I recognize Base64?]
    You: How can I identify Base64 when I see it?
    Crypto Instructor: Look for: alphanumeric characters, sometimes with + and /, often ending in = or ==.
    Crypto Instructor: Length is always multiple of 4 (due to padding).
    Crypto Instructor: Classic tell: mix of uppercase, lowercase, and numbers, ending in equals signs.
    Crypto Instructor: Example: `VmFsaGFsbGEK` - that's Base64.
- -> crypto_hub

// ===========================================
// SYMMETRIC ENCRYPTION
// ===========================================

=== symmetric_encryption ===
~ instructor_rapport += 5

Crypto Instructor: Symmetric encryption - the same key encrypts and decrypts. Fast, efficient, but has a key distribution problem.

Crypto Instructor: Two main algorithms you'll use: DES and AES.

* [Tell me about DES]
    You: What's DES?
    -> des_explanation
* [Tell me about AES]
    You: What's AES?
    -> aes_explanation
* [What's the key distribution problem?]
    ~ instructor_rapport += 10
    You: You mentioned a key distribution problem?
    Crypto Instructor: The fundamental challenge of symmetric crypto: how do you securely share the key?
    Crypto Instructor: If you encrypt a message with AES, your recipient needs the same key to decrypt. How do you get them the key without an attacker intercepting it?
    Crypto Instructor: This is where public key crypto comes in - or secure key exchange protocols like Diffie-Hellman.
    -> symmetric_encryption
* [Back to main menu]
    -> crypto_hub

=== des_explanation ===
~ instructor_rapport += 5

Crypto Instructor: DES - Data Encryption Standard. Developed by IBM in the 1970s, based on Feistel ciphers.

Crypto Instructor: 56-bit key size. Small by modern standards - brute-forceable in reasonable time with modern hardware.

Crypto Instructor: Historical importance, but don't use it for real security anymore. Superseded by AES.

Crypto Instructor: OpenSSL command: `openssl enc -des-cbc -pbkdf2 -in file.txt -out file.enc`

* [Why is 56-bit insufficient?]
    ~ instructor_rapport += 8
    You: Why is 56 bits too small?
    Crypto Instructor: 2^56 possible keys - about 72 quadrillion. Sounds large, but modern systems can test millions or billions of keys per second.
    Crypto Instructor: DES was cracked in less than 24 hours in 1999. Hardware has only improved since then.
    Crypto Instructor: Compare to AES-256: 2^256 keys. Astronomically larger. Not brute-forceable with current or foreseeable technology.
* [Show me the decryption command]
    You: How do I decrypt DES-encrypted data?
    Crypto Instructor: `openssl enc -des-cbc -d -in file.enc -out decrypted.txt`
    Crypto Instructor: The `-d` flag specifies decryption. You'll be prompted for the password.
    Crypto Instructor: Note: password and key aren't quite the same. The password is hashed with PBKDF2 to derive the actual encryption key.
- -> symmetric_encryption

=== aes_explanation ===
~ instructor_rapport += 5

Crypto Instructor: AES - Advanced Encryption Standard. The modern symmetric encryption standard.

Crypto Instructor: 128-bit block cipher. Key sizes: 128, 192, or 256 bits. Uses substitution-permutation network - combination of substitution, permutation, mixing, and key addition.

Crypto Instructor: Fast, secure, widely supported. This is what you should be using for symmetric encryption.

* [How much stronger is AES than DES?]
    ~ instructor_rapport += 10
    You: Quantify the security improvement over DES.
    Crypto Instructor: DES: 2^56 keyspace. AES-128: 2^128. AES-256: 2^256.
    Crypto Instructor: AES-128 has 2^72 times more keys than DES. AES-256 has 2^200 times more keys than AES-128.
    Crypto Instructor: To put it in perspective: if you could test a trillion trillion keys per second, AES-256 would still take longer than the age of the universe to brute force.
    Crypto Instructor: Practical attacks on AES focus on implementation flaws, side channels, or compromising the key - not brute forcing.
* [Show me AES commands]
    You: Walk me through AES encryption.
    Crypto Instructor: Encrypt: `openssl enc -aes-256-cbc -pbkdf2 -in file.txt -out file.enc`
    Crypto Instructor: Decrypt: `openssl enc -aes-256-cbc -d -in file.enc -out file.txt`
    Crypto Instructor: You can use -aes-128-cbc, -aes-192-cbc, or -aes-256-cbc depending on key size.
    Crypto Instructor: CBC mode is Cipher Block Chaining. ECB mode also available but has security weaknesses - avoid for real use.
* [What's CBC mode?]
    ~ instructor_rapport += 8
    You: Explain CBC mode.
    Crypto Instructor: Cipher Block Chaining. Each block of plaintext is XORed with the previous ciphertext block before encryption.
    Crypto Instructor: This means identical plaintext blocks produce different ciphertext - hides patterns.
    Crypto Instructor: ECB (Electronic Codebook) encrypts each block independently - same input always produces same output. Leaks pattern information.
    Crypto Instructor: Always use CBC or more modern modes like GCM. Never use ECB for real data.
- -> symmetric_encryption

// ===========================================
// PUBLIC KEY CRYPTOGRAPHY
// ===========================================

=== public_key_crypto ===
~ instructor_rapport += 5

Crypto Instructor: Asymmetric cryptography. Revolutionary concept - separate keys for encryption and decryption.

Crypto Instructor: **Public key**: shared freely. Anyone can use it to encrypt messages to you.
**Private key**: kept secret. Only you can decrypt messages encrypted with your public key.

Crypto Instructor: Solves the key distribution problem. You can publish your public key openly - doesn't compromise security.

* [How does this actually work?]
    ~ instructor_rapport += 10
    You: What's the underlying mechanism?
    Crypto Instructor: Mathematics - specifically, functions that are easy to compute in one direction but extremely hard to reverse without special information.
    Crypto Instructor: RSA uses factoring large prime numbers. Easy to multiply two huge primes, nearly impossible to factor the result back without knowing the primes.
    Crypto Instructor: Your private key contains the primes. Your public key contains their product. Encryption uses the product, decryption needs the primes.
    Crypto Instructor: Full math is beyond this course, but that's the essence. One-way mathematical trap doors.
* [What's the downside?]
    ~ instructor_rapport += 8
    You: This sounds perfect. What's the catch?
    Crypto Instructor: Performance. Asymmetric crypto is much slower than symmetric.
    Crypto Instructor: Typical use: asymmetric crypto to exchange a symmetric key, then symmetric crypto for actual data.
    Crypto Instructor: TLS/SSL does exactly this - RSA or ECDH to agree on a session key, then AES to encrypt the connection.
    Crypto Instructor: Hybrid approach gets security of asymmetric with performance of symmetric.
* [Tell me about GPG]
    You: How does GPG fit into this?
    Crypto Instructor: GPG - GNU Privacy Guard. Open source implementation of PGP (Pretty Good Privacy).
    Crypto Instructor: Provides public-key crypto for email encryption, file encryption, digital signatures.
    Crypto Instructor: Industry standard for email security and file protection.
    -> gpg_intro
- -> crypto_hub

// ===========================================
// OPENSSL TOOLS
// ===========================================

=== openssl_tools ===
~ instructor_rapport += 5

Crypto Instructor: OpenSSL - the Swiss Army knife of cryptography.

Crypto Instructor: It's a toolkit implementing SSL/TLS protocols and providing cryptographic functions. Command-line tool plus libraries.

Crypto Instructor: Can do: key generation, encryption, decryption, hashing, certificate management, SSL/TLS testing, and much more.

* [Show me useful commands]
    You: What are the most useful OpenSSL commands?
    Crypto Instructor: List available ciphers: `openssl list -cipher-algorithms`
    Crypto Instructor: Generate hash: `echo "data" | openssl dgst -sha256`
    Crypto Instructor: Encrypt file: `openssl enc -aes-256-cbc -in file -out file.enc`
    Crypto Instructor: Check certificate: `openssl x509 -in cert.pem -text -noout`
    Crypto Instructor: Test SSL connection: `openssl s_client -connect example.com:443`
    Crypto Instructor: Generate random bytes: `openssl rand -hex 32`
* [Tell me about the 2014 vulnerability]
    ~ instructor_rapport += 15
    You: You mentioned a major OpenSSL vulnerability in 2014?
    Crypto Instructor: Heartbleed. CVE-2014-0160. One of the most significant security flaws in internet history.
    Crypto Instructor: Bug in OpenSSL's implementation of TLS heartbeat extension. Allowed attackers to read server memory - including private keys, passwords, session tokens.
    Crypto Instructor: Affected two-thirds of web servers. Required widespread patching and certificate replacement.
    Crypto Instructor: Important lesson: even cryptographic implementations can have bugs. The algorithms (AES, RSA) were fine - the implementation was flawed.
    Crypto Instructor: This is why: keep software updated, use well-audited libraries, implement defense in depth.
* [How do I check OpenSSL version?]
    You: How do I know what version I'm running?
    Crypto Instructor: `openssl version -a` shows version and build details.
    Crypto Instructor: Post-Heartbleed, you want OpenSSL 1.0.1g or later, or 1.0.2 series.
    Crypto Instructor: Most modern systems use OpenSSL 1.1.1 or 3.x now.
- -> crypto_hub

// ===========================================
// GPG INTRODUCTION
// ===========================================

=== gpg_intro ===
~ instructor_rapport += 5

Crypto Instructor: GPG - GNU Privacy Guard. Open-source public-key cryptography and signing tool.

Crypto Instructor: Core concepts: key pairs (public and private), encryption, decryption, signing, verification.

* [Walk me through key generation]
    You: How do I create GPG keys?
    Crypto Instructor: `gpg --gen-key` starts the process. You'll provide name, email, passphrase.
    Crypto Instructor: This creates a key pair. Public key you share, private key you protect.
    Crypto Instructor: The passphrase protects your private key - don't forget it! Without it, your private key is useless.
* [How do I share my public key?]
    You: How do others get my public key?
    Crypto Instructor: Export it: `gpg --export -a "Your Name" > public.key`
    Crypto Instructor: This creates ASCII-armored public key file. Share it via email, website, key server.
    Crypto Instructor: Recipients import it: `gpg --import public.key`
    Crypto Instructor: Now they can encrypt messages only you can read.
* [Encrypting and decrypting]
    You: Show me the encryption workflow.
    Crypto Instructor: Encrypt: `gpg -e -r "Recipient Name" file.txt` creates file.txt.gpg
    Crypto Instructor: Decrypt: `gpg -d file.txt.gpg > decrypted.txt`
    Crypto Instructor: Recipient's public key must be in your keyring to encrypt for them.
    Crypto Instructor: Your private key must be available to decrypt messages to you.
* [What about digital signatures?]
    ~ instructor_rapport += 10
    You: How do signatures work?
    Crypto Instructor: Signatures prove a message came from you and wasn't modified.
    Crypto Instructor: Sign: `gpg -s file.txt` - creates file.txt.gpg with signature
    Crypto Instructor: Verify: `gpg --verify file.txt.gpg` - confirms signature and shows signer
    Crypto Instructor: Uses your private key to sign, others use your public key to verify. Reverse of encryption.
    Crypto Instructor: Provides authenticity and integrity - critical for software distribution, secure communications.
- -> crypto_hub

// ===========================================
// COMMANDS REFERENCE
// ===========================================

=== commands_reference ===
Crypto Instructor: Quick reference for the commands we've covered:

Crypto Instructor: **Encoding:**
- Hex: `echo "text" | xxd -p` (encode), `echo "hex" | xxd -r -p` (decode)
- Base64: `echo "text" | base64` (encode), `echo "b64" | base64 -d` (decode)
- View as binary: `xxd -b file`

Crypto Instructor: **Symmetric Encryption (OpenSSL):**
- AES encrypt: `openssl enc -aes-256-cbc -pbkdf2 -in file -out file.enc`
- AES decrypt: `openssl enc -aes-256-cbc -d -in file.enc -out file.txt`
- DES encrypt: `openssl enc -des-cbc -pbkdf2 -in file -out file.enc`
- List ciphers: `openssl list -cipher-algorithms`

Crypto Instructor: **Public Key Crypto (GPG):**
- Generate keys: `gpg --gen-key`
- List keys: `gpg --list-keys`
- Export public: `gpg --export -a "Name" > public.key`
- Import key: `gpg --import key.asc`
- Encrypt: `gpg -e -r "Recipient" file`
- Decrypt: `gpg -d file.gpg`
- Sign: `gpg -s file`
- Verify: `gpg --verify file.gpg`

Crypto Instructor: **Useful OpenSSL:**
- Hash: `openssl dgst -sha256 file`
- Random data: `openssl rand -hex 32`
- Version: `openssl version`

+ [Back to main menu]
    -> crypto_hub

// ===========================================
// READY FOR PRACTICE
// ===========================================

=== ready_for_practice ===
Crypto Instructor: Excellent. You've covered the fundamentals.

Crypto Instructor: In your VM's home directory, you'll find CTF challenges testing these skills:
- Decoding various encoded data
- Decrypting symmetrically-encrypted files
- Using GPG for secure communication
- Breaking weak encryption

Crypto Instructor: Practical tips:

Crypto Instructor: **Recognize encoding schemes on sight**: Base64 ends in =, hex is 0-9 and a-f, binary is only 0 and 1.

Crypto Instructor: **Try obvious passwords first**: "password", "admin", "123456". Weak keys are common.

Crypto Instructor: **Check file headers**: `file` command identifies file types even if extension is wrong. Encoded/encrypted data looks like random bytes.

Crypto Instructor: **Use CyberChef for quick analysis**: Web tool that chains encoding/decoding operations. Great for CTFs.

Crypto Instructor: **Document what you try**: When attempting decryption, track what keys/methods you've tested. Easy to lose track.

{instructor_rapport >= 50:
    Crypto Instructor: You've asked excellent questions and engaged deeply with the material. You're well-prepared.
}

Crypto Instructor: Remember: encoding is reversible with no secret. Encryption requires keys. Symmetric uses same key for both. Asymmetric uses key pairs.

Crypto Instructor: Now go break some crypto challenges. Good luck, Agent {player_name}.

#exit_conversation
-> END
