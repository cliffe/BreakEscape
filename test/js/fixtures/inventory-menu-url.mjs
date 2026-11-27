// systems/inventory-menu.js as a URL a data: module can import, for tests that load
// interactions.js with every import replaced by a data: URL. It is the file itself, so
// its own imports (item-drop.js and its table-drop.js, ui/interaction-menu.js and its
// display-dashes.js) resolve from disk as they do in the game.
// window must exist before the module is imported (interaction-menu.js sets globals).
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../../public/break_escape/js');

export const inventoryMenuUrl = pathToFileURL(join(js, 'systems/inventory-menu.js')).href;
