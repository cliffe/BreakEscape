// Verify the Oleg mojibake recipe in the bundled CyberChef 10.19.4 (same harness style as verify_rendered.mjs)
import fs from "fs";
import Dish from "./node_modules/cyberchef/src/core/Dish.mjs";
import EncodeText from "./node_modules/cyberchef/src/core/operations/EncodeText.mjs";
import DecodeText from "./node_modules/cyberchef/src/core/operations/DecodeText.mjs";
import Magic from "./node_modules/cyberchef/src/core/operations/Magic.mjs";
async function bake(input, recipe) {
  const dish = new Dish(input, Dish.STRING);
  for (const [Op, args] of recipe) {
    const op = new Op(); const v = await dish.get(Dish.typeEnum(op.inputType));
    try { dish.set(await op.run(v, args), Dish.typeEnum(op.outputType)); } catch (e) { return "ERROR: " + (e.message || e); }
  }
  return await dish.get(Dish.STRING);
}
const { mojibake, name } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const enc of process.argv.slice(3)) {
  const out = await bake(mojibake, [[EncodeText, [enc]], [DecodeText, ["UTF-8 (65001)"]]]);
  console.log(`${out === name ? "PASS" : "FAIL"} Encode text (${enc}) -> Decode text (UTF-8): ${JSON.stringify(out)}`);
}
