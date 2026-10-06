# Prototype of the ERB generation block for lab_tesseract_trials.
# Picks per-game secrets and builds every artefact. Prints JSON with the
# artefacts AND the expected answers so verify.mjs / verify.py can check them.
# Usage: ruby generate.rb [seed]
require 'openssl'
require 'base64'
require 'json'
require 'securerandom'

srand(ARGV[0].to_i) if ARGV[0]

# ---- word lists (lowercase, no look-alike letters, 5-8 chars) ----
# v3: L1/L3/L4/L6 pools widened to 26-28 words each (R2B-m13: the repo may be public)
WORDS_T1   = %w[lantern harbour compass granite meadow falcon orchard thistle bramble cobble ember fennel gravel heather hollow kettle lichen marrow nettle pebble quill saddle sorrel tinder willow yarrow]
WORDS_T3   = %w[signal beacon quartz pewter cobalt saffron juniper marble amber basalt cinder copper indigo jasper lantana magenta nickel ochre pumice russet silver tawny umber velvet walnut zircon]
WORDS_T4   = %w[stairwell archway landing bellrope clocktower gargoyle balcony buttress cloister corbel cupola doorway gable gallery lintel mezzanine parapet portico quadrangle rafter spire steeple transom turret vestibule wainscot]
WORDS_T6   = %w[parchment vellum folio quarto codex scroll almanac atlas binding chapbook colophon errata flyleaf gazetteer glossary incunable lexicon marginalia octavo palimpsest primer quire recto treatise verso woodcut]
VIG_KEYS   = %w[ledger merkle nonce genesis anchor witness]
PASSPHRASE = %w[keyholder lockstock deadbolt tumbler skeleton keystone padlock latchkey wardkey mortise]
TOKEN_WORD = %w[kestrel osprey merlin hobby peregrine harrier]
PORTER_WORD = %w[postmark franking satchel parcel sorting letterbox]

def pin4; format('%04d', rand(1000..9999)); end
def num_words(pin); names = %w[zero one two three four five six seven eight nine]; pin.chars.map { |c| names[c.to_i] }.join(' '); end

# Caesar exactly as CyberChef ROT13 op (letters only, case kept, digits untouched)
def caesar(text, n)
  text.gsub(/[a-z]/) { |c| ((c.ord - 97 + n) % 26 + 97).chr }
      .gsub(/[A-Z]/) { |c| ((c.ord - 65 + n) % 26 + 65).chr }
end

# Vigenere encode as CyberChef "Vigenère Encode": key advances only on letters, case kept
def vigenere_encode(text, key)
  k = key.downcase.chars.map { |c| c.ord - 97 }
  i = 0
  text.chars.map do |c|
    if c =~ /[a-z]/
      r = ((c.ord - 97 + k[i % k.size]) % 26 + 97).chr; i += 1; r
    elsif c =~ /[A-Z]/
      r = ((c.ord - 65 + k[i % k.size]) % 26 + 65).chr; i += 1; r
    else
      c
    end
  end.join
end

a = {}   # artefacts
ans = {} # expected answers

# L1: ASCII decimal, spaced (Jordan's leaflet)
w1 = WORDS_T1.sample
a[:l1_leaflet_decimal] = w1.bytes.join(' ')
ans[:l1] = w1

# L2: digits as characters, run together (Trial II card)
p2 = pin4
a[:l2_card_rundecimal] = p2.bytes.join('')          # e.g. "52554948"
ans[:l2] = p2

# L3: binary, 8-bit groups
w3 = WORDS_T3.sample
a[:l3_binary] = w3.bytes.map { |b| format('%08b', b) }.join(' ')
ans[:l3] = w3

# L4: hex run together, lowercase, a sentence containing the password
w4 = WORDS_T4.sample
l4_plain = "corridor door passphrase: #{w4}"
a[:l4_hex] = l4_plain.unpack1('H*')
ans[:l4] = w4

# L5: Base64 sentence containing the library PIN
p5 = pin4
l5_plain = "Library keypad: #{p5}. The returns shelf has your next trial."
a[:l5_base64] = Base64.strict_encode64(l5_plain)
ans[:l5] = p5

# L6: layered: Base64( Caesar shift 6 ( sentence ) ). Shift = Trial number VI.
w6 = WORDS_T6.sample
l6_plain = "Special Collections safe password: #{w6}"
a[:l6_base64_caesar] = Base64.strict_encode64(caesar(l6_plain, 6))
ans[:l6] = w6

# Player's lab key pair (Tom) and decoy key pairs (other students' envelopes)
player_rsa = OpenSSL::PKey::RSA.new(2048)
a[:player_private_pem] = player_rsa.to_pem.strip
a[:player_public_pem]  = player_rsa.public_key.to_pem.strip

# L8: AES-128-CBC, key sealed with RSA-OAEP(SHA-1) to player's public key.
# v2: the IV is NOT on the drop box tag; it travels inside Trial VII (Vigenere).
aes_key = SecureRandom.random_bytes(16)
aes_iv  = SecureRandom.random_bytes(16)
pass8   = PASSPHRASE.sample + '-' + rand(10..99).to_s
c = OpenSSL::Cipher.new('aes-128-cbc'); c.encrypt; c.key = aes_key; c.iv = aes_iv
a[:l8_aes_ct_hex] = (c.update(pass8) + c.final).unpack1('H*')     # the tag: ciphertext only
ans[:l8_aes_iv_hex] = aes_iv.unpack1('H*')                         # only inside Trial VII
# envelope: re-roll until the raw RSA bytes are NOT valid UTF-8 (so CyberChef's Latin-1 path applies)
env_raw = nil
loop do
  env_raw = player_rsa.public_encrypt(aes_key.unpack1('H*'), OpenSSL::PKey::RSA::PKCS1_OAEP_PADDING)
  break unless env_raw.dup.force_encoding('UTF-8').valid_encoding?
end
a[:l8_envelope_b64] = Base64.strict_encode64(env_raw)
ans[:l8_aes_key_hex] = aes_key.unpack1('H*')
ans[:l8] = pass8

# L7 (v2): Vigenere. Key on Sidhu's ledger whiteboard. Plaintext carries the pigeonhole
# password (L7 is now a lock of its own), the pigeonhole number and the AES IV.
vkey = VIG_KEYS.sample
hole = rand(2..5)
pigeon_pw = PORTER_WORD.sample + '-' + rand(10..99).to_s
hole_word = %w[zero one two three four five six][hole]
l7_plain = "The pigeonholes open with #{pigeon_pw}. Yours is number #{hole_word}. Your envelope is sealed to your public key. The IV travels with this letter: #{ans[:l8_aes_iv_hex]}"
a[:l7_vig_key] = vkey
a[:l7_vigenere] = vigenere_encode(l7_plain, vkey)
ans[:l7_plain] = l7_plain
ans[:l7_hole] = hole
ans[:l7_pigeon_pw] = pigeon_pw

# decoy envelopes: same form, sealed to other students' keys
a[:decoy_envelopes_b64] = 3.times.map do
  other = OpenSSL::PKey::RSA.new(2048)
  Base64.strict_encode64(other.public_encrypt(SecureRandom.hex(16), OpenSSL::PKey::RSA::PKCS1_OAEP_PADDING))
end

# L10: relay terminal: first 8 hex chars of SHA-256(passphrase from L8), no newline
ans[:l10] = OpenSSL::Digest::SHA256.hexdigest(pass8)[0, 8]

# Climax: Ghost's report. Base64 body, SHA-256 of the Base64 text, RSA-SHA256 signature.
ghost_rsa = OpenSSL::PKey::RSA.new(2048)
token = "#{TOKEN_WORD.sample}-#{rand(1000..9999)}"
report_plain = <<~TXT.strip
  KEYHOLDER FIELD REPORT
  FROM: Agent 0x00 (undercover, Miskatonic University UK)
  TO: Agent HaX
  STATUS: Recruited. Candidate passed all trials. Recruiter met on screen only.
  ASSESSMENT: Cell interested in crypto students for future operations. No names yet.
  RECOMMENDATION: Maintain cover. Await next contact.
  <img src="https://cdn.cryptosecure-recovery.example/px/locate/#{token}.png" width="1" height="1">
TXT
report_b64 = Base64.strict_encode64(report_plain)
a[:report_b64] = report_b64                     # file 1: report.b64 (body only)
a[:report_sha256] = OpenSSL::Digest::SHA256.hexdigest(report_b64)
a[:report_sig_b64] = Base64.strict_encode64(ghost_rsa.sign(OpenSSL::Digest::SHA256.new, report_b64))
a[:ghost_public_pem] = ghost_rsa.public_key.to_pem.strip   # stored without trailing newline
a[:ghost_key_fingerprint] = OpenSSL::Digest::SHA256.hexdigest(a[:ghost_public_pem])[0, 16]
# v3 (R2B-M5): the leaflet's text is the codes only; the fingerprint goes in observations
a[:leaflet_text] = a[:l1_leaflet_decimal]
a[:leaflet_observations] = "Trial I. The lockbox on this stand opens for those who can read it. Verify everything we send you. Key fingerprint: #{a[:ghost_key_fingerprint]}"
ans[:token] = token
ans[:report_plain] = report_plain

# Optional: EBCDIC (cp037) hex dump from the 1979 archive
ebcdic_plain = "MISKATONIC UNIVERSITY COMPUTING SERVICE 1979. JOB 0412 OWNER [REDACTED]. PROJECT KEYHOLDER. STATUS: STILL RUNNING."
a[:ebcdic_hex] = ebcdic_plain.encode('IBM037').unpack1('H*').scan(/../).join(' ')
ans[:ebcdic_plain] = ebcdic_plain

puts JSON.pretty_generate({ artefacts: a, answers: ans })
