// RUN (R3-11): in a scratch folder, `npm install cyberchef@10.19.4 terser`, copy this file there,
// then `node --experimental-specifier-resolution=node --no-warnings <this file> <json>`.
// Runs each player recipe through CyberChef 10.19.4's own operation code
// (npm cyberchef@10.19.4, same version as the bundled HTML), using CyberChef's
// Dish type conversion between steps, exactly as Recipe.execute does.
// Usage: node --experimental-specifier-resolution=node --no-warnings verify.mjs out.json
import fs from "fs";
import Dish from "./node_modules/cyberchef/src/core/Dish.mjs";
import FromDecimal from "./node_modules/cyberchef/src/core/operations/FromDecimal.mjs";
import FromBinary from "./node_modules/cyberchef/src/core/operations/FromBinary.mjs";
import FromHex from "./node_modules/cyberchef/src/core/operations/FromHex.mjs";
import FromBase64 from "./node_modules/cyberchef/src/core/operations/FromBase64.mjs";
import ROT13 from "./node_modules/cyberchef/src/core/operations/ROT13.mjs";
import VigenereDecode from "./node_modules/cyberchef/src/core/operations/VigenèreDecode.mjs";
import RSADecrypt from "./node_modules/cyberchef/src/core/operations/RSADecrypt.mjs";
import RSAVerify from "./node_modules/cyberchef/src/core/operations/RSAVerify.mjs";
import AESDecrypt from "./node_modules/cyberchef/src/core/operations/AESDecrypt.mjs";
import ToBase64 from "./node_modules/cyberchef/src/core/operations/ToBase64.mjs";
import SHA2 from "./node_modules/cyberchef/src/core/operations/SHA2.mjs";
import DecodeText from "./node_modules/cyberchef/src/core/operations/DecodeText.mjs";

const B64 = "A-Za-z0-9+/=";
async function bake(input, steps) {
  const dish = new Dish(input, Dish.STRING);
  for (const [Op, args] of steps) {
    const op = new Op();
    const v = await dish.get(Dish.typeEnum(op.inputType));
    let out;
    try { out = await op.run(v, args); dish.set(out, Dish.typeEnum(op.outputType)); }
    catch (e) { return "ERROR: " + (e.message || e); }
  }
  return await dish.get(Dish.STRING);
}

const d = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const a = d.artefacts, ans = d.answers;
let fails = 0;
function check(name, got, want, mode = "eq") {
  const ok = mode === "eq" ? got === want : got.includes(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(got.slice(0, 90))}${mode === "eq" ? "" : " (must contain " + JSON.stringify(want) + ")"}`);
}

// L1 From Decimal (Space)
check("L1 From Decimal", await bake(a.l1_leaflet_decimal, [[FromDecimal, ["Space", false]]]), ans.l1);
check("L1 from the leaflet's whole note text (codes only)", await bake(a.leaflet_text, [[FromDecimal, ["Space", false]]]), ans.l1);
console.log(`INFO L1 if the fingerprint line were in the same text: ${JSON.stringify((await bake(a.leaflet_text + "\n" + a.leaflet_observations, [[FromDecimal, ["Space", false]]])).slice(0, 50))}`);
// L2 the trap: run-together fails as-is; split into pairs then From Decimal
const runTogether = await bake(a.l2_card_rundecimal, [[FromDecimal, ["Space", false]]]);
console.log(`INFO L2 run-together without splitting gives: ${JSON.stringify(runTogether)} (wrong, as intended)`);
const split = a.l2_card_rundecimal.match(/../g).join(" ");
check("L2 split pairs + From Decimal", await bake(split, [[FromDecimal, ["Space", false]]]), ans.l2);
// L3 From Binary (Space, 8)
check("L3 From Binary", await bake(a.l3_binary, [[FromBinary, ["Space", 8]]]), ans.l3);
// L4 From Hex (Auto)
check("L4 From Hex", await bake(a.l4_hex, [[FromHex, ["Auto"]]]), ans.l4, "inc");
// L5 From Base64
check("L5 From Base64", await bake(a.l5_base64, [[FromBase64, [B64, true, false]]]), ans.l5, "inc");
// L6 From Base64 then ROT13 amount 20 (= -6) ... CyberChef ROT13 amount 20 undoes a shift of 6
check("L6 From Base64 + ROT13(amount 20)", await bake(a.l6_base64_caesar, [[FromBase64, [B64, true, false]], [ROT13, [true, true, false, 20]]]), ans.l6, "inc");
check("L6 From Base64 + ROT13(amount -6)", await bake(a.l6_base64_caesar, [[FromBase64, [B64, true, false]], [ROT13, [true, true, false, -6]]]), ans.l6, "inc");
// L7 Vigenere Decode with key; the player reads the pigeonhole password and IV from the output
const l7 = await bake(a.l7_vigenere, [[VigenereDecode, [a.l7_vig_key]]]);
check("L7 Vigenère Decode", l7, ans.l7_plain);
const ivFromL7 = (l7.match(/drop box is ([0-9a-f]{32})/) || [])[1] || "";
const pwFromL7 = (l7.match(/open with ([a-z]+-\d\d)$/) || [])[1] || "";
check("L7 gives pigeonhole password", pwFromL7, ans.l7_pigeon_pw);
check("L7 gives the IV", ivFromL7, ans.l8_aes_iv_hex);
const garbled = await bake("Trial VII. The key is on the ledger.\n" + a.l7_vigenere, [[VigenereDecode, [a.l7_vig_key]]]);
console.log(`INFO L7 with a header line copied in front (why fileContent is ciphertext only): ${JSON.stringify(garbled.slice(0, 60))}`);
// L8a RSA: From Base64 -> RSA Decrypt (OAEP, SHA-1) with the player's private key
check("L8a From Base64 + RSA Decrypt", await bake(a.l8_envelope_b64, [[FromBase64, [B64, true, false]], [RSADecrypt, [a.player_private_pem, "", "RSA-OAEP", "SHA-1"]]]), ans.l8_aes_key_hex);
check("L8a PEM flattened to one line", await bake(a.l8_envelope_b64, [[FromBase64, [B64, true, false]], [RSADecrypt, [a.player_private_pem.replace(/\n/g, " "), "", "RSA-OAEP", "SHA-1"]]]), ans.l8_aes_key_hex);
check("L8a PEM pasted after CyberChef's pre-filled header", await bake(a.l8_envelope_b64, [[FromBase64, [B64, true, false]], [RSADecrypt, ["-----BEGIN RSA PRIVATE KEY-----" + a.player_private_pem, "", "RSA-OAEP", "SHA-1"]]]), ans.l8_aes_key_hex);
for (const [i, e] of a.decoy_envelopes_b64.entries())
  console.log(`INFO decoy envelope ${i + 1} with player's key: ${JSON.stringify((await bake(e, [[FromBase64, [B64, true, false]], [RSADecrypt, [a.player_private_pem, "", "RSA-OAEP", "SHA-1"]]])).slice(0, 60))}`);
// L8b AES Decrypt: key from L8a, IV from L7; every other argument left at CyberChef's default
const aes = (k, iv) => [{ option: "Hex", string: k }, { option: "Hex", string: iv }, "CBC", "Hex", "Raw", { option: "Hex", string: "" }, { option: "Hex", string: "" }];
check("L8b AES Decrypt (key from L8a, IV from L7)", await bake(a.l8_aes_ct_hex, [[AESDecrypt, aes(ans.l8_aes_key_hex, ivFromL7)]]), ans.l8);
console.log(`INFO L8b without the IV (skipping L7): ${JSON.stringify((await bake(a.l8_aes_ct_hex, [[AESDecrypt, aes(ans.l8_aes_key_hex, "")]])).slice(0, 60))}`);
console.log(`INFO L8b with a guessed IV of zeros: ${JSON.stringify((await bake(a.l8_aes_ct_hex, [[AESDecrypt, aes(ans.l8_aes_key_hex, "00000000000000000000000000000000")]])).slice(0, 60))}`);
console.log(`INFO L8b with a wrong key: ${JSON.stringify((await bake(a.l8_aes_ct_hex, [[AESDecrypt, aes("00112233445566778899aabbccddeeff", ivFromL7)]])).slice(0, 60))}`);
// L10 SHA2 256 of the passphrase, first 8 chars
const h = await bake(ans.l8, [[SHA2, ["256", 64, 160]]]);
check("L10 SHA2-256 first 8", h.slice(0, 8), ans.l10);
const hNl = await bake(ans.l8 + "\n", [[SHA2, ["256", 64, 160]]]);
console.log(`INFO L10 with a trailing newline: ${hNl.slice(0, 8)} (differs, as intended)`);
const h512 = await bake(ans.l8, [[SHA2, ["512", 64, 160]]]);
check("L10 as SHA2 added under AES Decrypt in the same recipe", (await bake(a.l8_aes_ct_hex, [[AESDecrypt, aes(ans.l8_aes_key_hex, ivFromL7)], [SHA2, ["256", 64, 160]]])).slice(0, 8), ans.l10);
console.log(`INFO L10 with SHA2's default size 512: ${h512.slice(0, 8)} (differs: set Size to 256)`);
// Report: From Base64 shows the token; SHA2 of the Base64 matches; RSA Verify OK
check("Report From Base64", await bake(a.report_b64, [[FromBase64, [B64, true, false]]]), ans.token, "inc");
check("Report SHA2-256", await bake(a.report_b64, [[SHA2, ["256", 64, 160]]]), a.report_sha256);
check("Report RSA Verify", await bake(a.report_sig_b64, [[FromBase64, [B64, true, false]], [RSAVerify, [a.ghost_public_pem, a.report_b64, "Raw", "SHA-256"]]]), "Verified OK");
console.log(`INFO RSA Verify given report + hash + signature as one message: ${JSON.stringify(await bake(a.report_sig_b64, [[FromBase64, [B64, true, false]], [RSAVerify, [a.ghost_public_pem, a.report_b64 + "\n" + a.report_sha256, "Raw", "SHA-256"]]]))} (why the report is split into three files)`);
const vf = (msg, fmt, md) => bake(a.report_sig_b64, [[FromBase64, [B64, true, false]], [RSAVerify, [a.ghost_public_pem, msg, fmt, md]]]);
console.log(`INFO RSA Verify with the DECODED report as Message: ${JSON.stringify(await vf(ans.report_plain, "Raw", "SHA-256"))}`);
console.log(`INFO RSA Verify with Message format set to Base64: ${JSON.stringify(await vf(a.report_b64, "Base64", "SHA-256"))}`);
console.log(`INFO RSA Verify with the digest left on SHA-1: ${JSON.stringify(await vf(a.report_b64, "Raw", "SHA-1"))}`);
console.log(`INFO RSA Verify with a new line after the Message: ${JSON.stringify(await vf(a.report_b64 + "\n", "Raw", "SHA-256"))}`);
const shaDecoded = await bake(ans.report_plain, [[SHA2, ["256", 64, 160]]]);
console.log(`INFO SHA2 of the DECODED report matches report.sha256? ${shaDecoded === a.report_sha256} (it shouldn't: the hash is of the Base64 text)`);
check("Report pixel URL says locate", ans.report_plain.includes("/px/locate/" + ans.token + "/1x1.png") ? "yes" : "no", "yes");
const tampered = a.report_b64.slice(0, -4) + "AAAA";
console.log(`INFO Report RSA Verify after one change: ${JSON.stringify(await bake(a.report_sig_b64, [[FromBase64, [B64, true, false]], [RSAVerify, [a.ghost_public_pem, tampered, "Raw", "SHA-256"]]]))}`);
check("Leaflet fingerprint = SHA2 of Ghost PEM", (await bake(a.ghost_public_pem, [[SHA2, ["256", 64, 160]]])).slice(0, 16), a.ghost_key_fingerprint);
// Optional EBCDIC: From Hex -> Decode text IBM EBCDIC US-Canada (37)
check("EBCDIC From Hex + Decode text (37)", await bake(a.ebcdic_hex, [[FromHex, ["Auto"]], [DecodeText, ["IBM EBCDIC US-Canada (37)"]]]), ans.ebcdic_plain);
// Worked Base64 example on the Trial V poster
check("Poster worked example: Hi! -> SGkh", await bake("Hi!", [[ToBase64, [B64]]]), "SGkh");
let maxLen = 0;
// Every typed answer fits the 50-character password field and is lower case or digits
for (const [k, v] of Object.entries({ l1: ans.l1, l2: ans.l2, l3: ans.l3, l4: ans.l4, l5: ans.l5, l6: ans.l6, pigeon: ans.l7_pigeon_pw, l8: ans.l8, l10: ans.l10, token: ans.token })) {
  const ok = v.length <= 50 && v === v.toLowerCase();
  maxLen = Math.max(maxLen, v.length);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} answer ${k} ${JSON.stringify(v)}: ${v.length} chars, lower case`);
}
console.log(`INFO longest typed answer this game: ${maxLen} characters`);
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
