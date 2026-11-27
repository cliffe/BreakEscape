// UI sweep B10 round 1 fixes: the m06 mixer footer, BLE device rows, whole-pixel line heights,
// no faux bold on GNF, and the dead container button rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
function bodyOf(file, selector) {
    const text = readFileSync(join(css, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    let found = null;
    while ((m = re.exec(text))) {
        if (m[1].trim().replace(/\s+/g, ' ') === selector) found = (found || '') + m[2];
    }
    assert.ok(found !== null, `${file}: rule ${selector} exists`);
    return found;
}
const prop = (body, name) => { const m = body.match(new RegExp('(?:^|[;\\s])' + name + ':\\s*([^;]+)')); return m ? m[1].trim() : null; };

test('M1: the mixer status items stay GNF 16px and the mixer footer wraps', () => {
    const item = bodyOf('blockchain-explorer-minigame.css', '.bce-mx .bce-status-item');
    assert.ok(prop(item, 'font-family').startsWith("'GNF'"), 'mixer status item is GNF');
    assert.ok(prop(item, 'font-size') === '16px', 'mixer status item is 16px');
    assert.ok(prop(item, 'letter-spacing') === '0', 'no Press Start letter spacing on GNF');
    assert.ok(prop(bodyOf('blockchain-explorer-minigame.css', '.bce-mx .bce-footer'), 'flex-wrap') === 'wrap', 'footer wraps');
    assert.ok(prop(bodyOf('blockchain-explorer-minigame.css', '.bce-mx .bce-status-bar'), 'flex-wrap') === 'wrap', 'status bar wraps');
});

test('m1: .ble-device-icon words are 16px on the GNF grid', () => {
    assert.ok(prop(bodyOf('ble-scanner.css', '.ble-device-icon'), 'font-size') === '16px', 'icon label is 16px');
});

test('m2: the BLE name span shrinks and the icon group does not', () => {
    const name = bodyOf('ble-scanner.css', '.ble-device-name > span:first-child');
    assert.ok(prop(name, 'min-width') === '0', 'name min-width 0');
    assert.ok(prop(name, 'overflow-wrap') === 'anywhere', 'name breaks long tokens');
    assert.ok(prop(bodyOf('ble-scanner.css', '.ble-device-icons'), 'flex') === 'none', 'icons do not shrink');
    assert.ok(prop(bodyOf('ble-scanner.css', '.ble-device-name'), 'gap') === '8px', 'a shrunk name keeps 8px from SAVE (R2 m1)');
});

test('m3: ransomware body and container-info p use whole-pixel line heights', () => {
    assert.ok(prop(bodyOf('ransomware-display-minigame.css', '.ransomware-display-body'), 'line-height') === '28px', 'ransomware body 28px');
    assert.ok(prop(bodyOf('container-minigame.css', '.container-info p'), 'line-height') === '24px', 'container-info p 24px');
});

test('m4: no faux bold on GNF text in ble-scanner and text-file', () => {
    assert.ok(prop(bodyOf('ble-scanner.css', '.ble-action-header'), 'font-weight') === 'normal', 'ble action header');
    assert.ok(prop(bodyOf('ble-scanner.css', '.ble-device-name'), 'font-weight') === null, 'ble device name');
    assert.ok(prop(bodyOf('text-file-minigame.css', '.file-name'), 'font-weight') === 'normal', 'file name');
    assert.ok(prop(bodyOf('text-file-minigame.css', '.file-observations h4'), 'font-weight') === 'normal', 'observations h4');
});

test('container account and transfer buttons carry no dead font-size (the framework button size wins)', () => {
    assert.ok(prop(bodyOf('container-minigame.css', '.desktop-account-btn'), 'font-size') === null, 'account btn');
    assert.ok(prop(bodyOf('container-minigame.css', '.desktop-transfer-btn'), 'font-size') === null, 'transfer btn');
});

test('mixer: on short screens the panel scrolls and the deposit columns keep their height (live 844x390: 51px)', () => {
    const src = readFileSync(join(css, 'blockchain-explorer-minigame.css'), 'utf8');
    const i = src.indexOf('@media (max-height: 500px)');
    assert.ok(i >= 0, 'a max-height 500px block exists');
    const block = src.slice(i, src.indexOf('\n}', i) + 2);
    assert.ok(/\.bce-mx\s*\{[^}]*overflow-y:\s*auto/.test(block), 'the mixer panel scrolls');
    assert.ok(/\.bce-mx > \*\s*\{[^}]*flex-shrink:\s*0/.test(block), 'no band is squeezed');
    assert.ok(/\.bce-mx-body\s*\{[^}]*flex:\s*0 0 auto/.test(block), 'the body takes its content height');
});
