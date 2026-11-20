// Verify the homoglyph beat in the bundled CyberChef 10.19.4: To Hex and SHA2 on two lookalike usernames
import fs from "fs";
import Dish from "./node_modules/cyberchef/src/core/Dish.mjs";
import ToHex from "./node_modules/cyberchef/src/core/operations/ToHex.mjs";
import SHA2 from "./node_modules/cyberchef/src/core/operations/SHA2.mjs";
async function bake(input, recipe) {
  const dish = new Dish(input, Dish.STRING);
  for (const [Op, args] of recipe) { const op = new Op(); const v = await dish.get(Dish.typeEnum(op.inputType)); dish.set(await op.run(v, args), Dish.typeEnum(op.outputType)); }
  return await dish.get(Dish.STRING);
}
const { real, fake } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const hr = await bake(real, [[ToHex, ["Space", 0]]]), hf = await bake(fake, [[ToHex, ["Space", 0]]]);
console.log("To Hex real:", hr); console.log("To Hex fake:", hf);
const sr = await bake(real, [[SHA2, ["256", 64, 160]]]), sf = await bake(fake, [[SHA2, ["256", 64, 160]]]);
console.log("SHA2-256 real:", sr); console.log("SHA2-256 fake:", sf);
const ok = hr !== hf && hf.includes("d0 b5") && !hr.includes("d0") && sr !== sf;
console.log(ok ? "PASS lookalike names differ in bytes (d0 b5 in one) and in SHA-256" : "FAIL");
