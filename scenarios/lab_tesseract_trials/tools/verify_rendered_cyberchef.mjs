// RUN (R3-11): in a scratch folder, `npm install cyberchef@10.19.4 terser`, copy this file there,
// then `node --experimental-specifier-resolution=node --no-warnings <this file> <json>`.
// Verify the RENDERED scenario: for every lock, take the artefacts from where the player
// finds them in the world, run the player's CyberChef recipe (CyberChef 10.19.4's own
// operation code), and compare the result with the lock's server-side `requires`.
// Run: node --experimental-specifier-resolution=node --no-warnings verify_rendered.mjs rendered.json
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
import SHA2 from "./node_modules/cyberchef/src/core/operations/SHA2.mjs";
import DecodeText from "./node_modules/cyberchef/src/core/operations/DecodeText.mjs";
const B64 = "A-Za-z0-9+/=";
async function bake(input, steps) {
  const dish = new Dish(input, Dish.STRING);
  for (const [Op, args] of steps) {
    const op = new Op(); const v = await dish.get(Dish.typeEnum(op.inputType));
    try { dish.set(await op.run(v, args), Dish.typeEnum(op.outputType)); } catch (e) { return "ERROR: " + (e.message || e); }
  }
  return await dish.get(Dish.STRING);
}
const d = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const all = [];
const walk = (o, room, parent) => { if (Array.isArray(o)) o.forEach(x => walk(x, room, parent)); else if (o && typeof o === "object") { if (o.id) all.push({ ...o, _room: room, _parent: parent }); for (const [k, v] of Object.entries(o)) if (["objects", "contents", "npcs", "itemsHeld"].includes(k)) walk(v, room, o.id || parent); } };
for (const [rid, r] of Object.entries(d.rooms)) walk(r, rid, rid);
const byId = id => { const x = all.find(o => o.id === id); if (!x) throw new Error("missing " + id); return x; };
const lockOf = id => d.rooms[id] ? d.rooms[id] : byId(id);
let fails = 0;
const check = (name, got, lockId) => { const want = String(lockOf(lockId).requires); const ok = got === want; if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${name}: decoded ${JSON.stringify(got)} vs ${lockId}.requires ${JSON.stringify(want)}`); };
const where = id => { const o = byId(id); return `${o._room}${o._parent && o._parent !== o._room ? "/" + o._parent : ""}`; };
// L1 leaflet (Jordan) -> lockbox
check(`L1 leaflet [${where("keyholder_leaflet")}] From Decimal`, await bake(byId("keyholder_leaflet").text, [[FromDecimal, ["Space", false]]]), "cryptosecure_lockbox");
// L2 card (in lockbox) -> locker PIN: split pairs
const c2 = byId("trial_ii_card").text; check(`L2 card [${where("trial_ii_card")}] pairs + From Decimal`, await bake(c2.match(/../g).join(" "), [[FromDecimal, ["Space", false]]]), "candidate_locker_4");
// L3 binary (in locker) -> guest terminal
check(`L3 card [${where("trial_iii_card")}] From Binary`, await bake(byId("trial_iii_card").text, [[FromBinary, ["Space", 8]]]), "keyholder_guest_terminal");
// L4 hex (in guest terminal) -> corridor door: last word
const l4 = await bake(byId("trial_iv_hex").text, [[FromHex, ["Auto"]]]); check(`L4 file [${where("trial_iv_hex")}] From Hex, last word`, l4.split(" ").pop(), "corridor");
// L5 poster (corridor) -> library PIN
const l5 = await bake(byId("trial_v_poster").text, [[FromBase64, [B64, true, false]]]); check(`L5 poster [${where("trial_v_poster")}] From Base64, the 4 digits`, (l5.match(/\d{4}/) || [""])[0], "library");
// L6 slip (library) -> special collections
const l6 = await bake(byId("returns_slip").text, [[FromBase64, [B64, true, false]], [ROT13, [true, true, false, -6]]]); check(`L6 slip [${where("returns_slip")}] From Base64 + ROT13(-6), last word`, l6.split(" ").pop(), "special_collections_safe");
// L7 Trial VII (in safe) + key word from Sidhu's whiteboard (block 4) -> pigeonholes
const wb = byId("ledger_whiteboard").observations; const vkey = (wb.match(/Block 4 \| data: ([a-z]+) /) || [])[1];
const l7 = await bake(byId("trial_vii_txt").text, [[VigenereDecode, [vkey]]]);
check(`L7 Trial VII [${where("trial_vii_txt")}] Vigenère with whiteboard key "${vkey}" [${where("ledger_whiteboard")}]`, (l7.match(/open with ([a-z]+-\d\d)/) || [])[1], "pigeonholes");
const hole = ["zero","one","two","three","four","five","six"].indexOf((l7.match(/number ([a-z]+)\./) || [])[1]); const iv = (l7.match(/letter: ([0-9a-f]{32})/) || [])[1];
// L8a envelope in pigeonhole <hole> + private key from the lab PC
const env = byId(`pigeonhole_${hole}`).text; const priv = byId("private_key_pem").text;
const key = await bake(env, [[FromBase64, [B64, true, false]], [RSADecrypt, [priv, "", "RSA-OAEP", "SHA-1"]]]);
console.log(`INFO L8a pigeonhole_${hole} [${where("pigeonhole_" + hole)}] + private_key.pem [${where("private_key_pem")}] -> AES key ${key}`);
let decoyOk = true; for (const n of [2,3,4,5].filter(n => n !== hole)) { const r = await bake(byId(`pigeonhole_${n}`).text, [[FromBase64, [B64, true, false]], [RSADecrypt, [priv, "", "RSA-OAEP", "SHA-1"]]]); if (!r.startsWith("ERROR")) decoyOk = false; }
console.log(`${decoyOk ? "PASS" : "FAIL"} the other three pigeonholes fail with the player's key`); if (!decoyOk) fails++;
// L8b tag (corridor) + key + IV -> drop box
const aes = (k, v) => [{ option: "Hex", string: k }, { option: "Hex", string: v }, "CBC", "Hex", "Raw", { option: "Hex", string: "" }, { option: "Hex", string: "" }];
const l8 = await bake(byId("drop_box_tag").text, [[AESDecrypt, aes(key, iv)]]); check(`L8b tag [${where("drop_box_tag")}] AES Decrypt (key from L8a, IV from L7)`, l8, "cryptosecure_drop_box");
// L9 brass key -> workshop door
const bk = byId("brass_key"); const wd = d.rooms.workshop; const kok = bk.opens_lock === wd.requires && JSON.stringify(bk.keyPins) === JSON.stringify(wd.keyPins);
console.log(`${kok ? "PASS" : "FAIL"} L9 brass key [${where("brass_key")}] opens_lock/keyPins match the workshop door`); if (!kok) fails++;
// L10 SHA2-256 of the passphrase (as SHA2 under AES Decrypt) -> relay
check(`L10 SHA2(256) under AES Decrypt, first 8`, (await bake(byId("drop_box_tag").text, [[AESDecrypt, aes(key, iv)], [SHA2, ["256", 64, 160]]])).slice(0, 8), "relay_terminal");
// Report (in relay) -> token -> scoreboard
const rep = await bake(byId("report_b64").text, [[FromBase64, [B64, true, false]]]);
check(`Climax report.b64 [${where("report_b64")}] From Base64, token from the pixel URL`, (rep.match(/px\/locate\/([a-z]+-\d{4})\.png/) || [])[1], "hacktivity_scoreboard");
const sha = await bake(byId("report_b64").text, [[SHA2, ["256", 64, 160]]]);
console.log(`${sha === byId("report_sha256").text ? "PASS" : "FAIL"} report.sha256 matches SHA2(256) of report.b64`); if (sha !== byId("report_sha256").text) fails++;
const ver = await bake(byId("report_sig").text, [[FromBase64, [B64, true, false]], [RSAVerify, [byId("keyholder_public_pem").text, byId("report_b64").text, "Raw", "SHA-256"]]]);
console.log(`${ver === "Verified OK" ? "PASS" : "FAIL"} report.sig verifies with keyholder_public.pem: ${ver}`); if (ver !== "Verified OK") fails++;
const fp = (await bake(byId("keyholder_public_pem").text, [[SHA2, ["256", 64, 160]]])).slice(0, 16);
const lfp = (byId("keyholder_leaflet").observations.match(/fingerprint: ([0-9a-f]{16})/) || [])[1];
console.log(`${fp === lfp ? "PASS" : "FAIL"} leaflet fingerprint ${lfp} = SHA2 of keyholder_public.pem`); if (fp !== lfp) fails++;
const eb = await bake(byId("job_tape_hex").text, [[FromHex, ["Auto"]], [DecodeText, ["IBM EBCDIC US-Canada (37)"]]]);
console.log(`${eb.startsWith("MISKATONIC") ? "PASS" : "FAIL"} optional job tape decodes: ${eb.slice(0, 50)}`); if (!eb.startsWith("MISKATONIC")) fails++;
// every typed answer <= 50 chars, lower case/digits
for (const id of ["cryptosecure_lockbox","candidate_locker_4","keyholder_guest_terminal","corridor","library","special_collections_safe","pigeonholes","cryptosecure_drop_box","relay_terminal","hacktivity_scoreboard"]) { const r = String(lockOf(id).requires); if (r.length > 50 || r !== r.toLowerCase()) { fails++; console.log(`FAIL answer ${id} ${r}`); } }
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
