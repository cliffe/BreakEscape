// Objectives panel, long lists (lab_physical_pentest playtests, finding E9): the new
// Debrief aim appeared below the fold, and even scrolled to the end its one task was
// half cut: the list's own max-height (panel minus 40px) plus its padding was taller
// than the room left under a themed header. The panel is now a flex column (the list
// takes what is left and scrolls), and an aim that appears after the first render is
// scrolled into view.
// Run with: node test/js/objectives-panel-scroll.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = join(root, 'public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };
const panelSrc = readFileSync(join(js, 'ui/objectives-panel.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { ObjectivesPanel } = await import(dataUrl(panelSrc));

const aim = (aimId, status = 'active') => ({ aimId, title: aimId, status, tasks: [{ taskId: `${aimId}_t`, title: `Task of ${aimId}`, status: 'active' }] });

test('newAimIds: nothing is new on the first render; later arrivals are', () => {
    assert.deepEqual(ObjectivesPanel.newAimIds([aim('a'), aim('b')], {}), []);
    assert.deepEqual(ObjectivesPanel.newAimIds([aim('a'), aim('b'), aim('debrief')], { a: 'active', b: 'completed' }), ['debrief']);
    assert.deepEqual(ObjectivesPanel.newAimIds([aim('a')], { a: 'active' }), []);
});

test('scrollTopToReveal: moves just far enough, and not at all when the block is in view', () => {
    const view = { scrollTop: 0, viewHeight: 560 };
    assert.equal(ObjectivesPanel.scrollTopToReveal({ ...view, top: 100, height: 60 }), 0, 'already in view');
    assert.equal(ObjectivesPanel.scrollTopToReveal({ ...view, top: 690, height: 63 }), 193, 'below the fold: bottom edge meets the view');
    assert.equal(ObjectivesPanel.scrollTopToReveal({ scrollTop: 300, viewHeight: 560, top: 120, height: 60 }), 120, 'above the view: top edge');
    assert.equal(ObjectivesPanel.scrollTopToReveal({ ...view, top: 400, height: 900 }), 400, 'taller than the view: show its top');
});

function panelWith(layout) {
    const panel = Object.create(ObjectivesPanel.prototype);
    const content = {
        innerHTML: '', scrollTop: 0, clientHeight: 560,
        getBoundingClientRect: () => ({ top: 75 }),
        querySelector: (sel) => {
            const id = /data-aim-id="([^"]+)"/.exec(sel)?.[1];
            const box = layout[id];
            return box ? { getBoundingClientRect: () => ({ top: 75 + box.top - content.scrollTop, height: box.height }) } : null;
        },
    };
    Object.assign(panel, { content, aimCollapsed: {}, aimStatus: {}, manager: {} });
    panel.escapeHtml = (s) => String(s);
    return panel;
}

test('render: a new aim below the fold is scrolled into view; the first render and a re-render leave the list alone', () => {
    const panel = panelWith({ debrief: { top: 690, height: 63 } });
    panel.render([aim('keylogger'), aim('bonus')]);
    assert.equal(panel.content.scrollTop, 0, 'first render');
    panel.render([aim('keylogger', 'completed'), aim('bonus'), aim('debrief')]);
    assert.equal(panel.content.scrollTop, 193, 'the Debrief aim and its task are in view');
    assert.match(panel.content.innerHTML, /data-aim-id="debrief"/);
    panel.content.scrollTop = 40;        // the player scrolls back up
    panel.render([aim('keylogger', 'completed'), aim('bonus'), aim('debrief')]);
    assert.equal(panel.content.scrollTop, 40, 'nothing new: no jump');
});

test('render: with the HUD zoomed, rectangles in on-screen pixels still land the new aim in view', () => {
    // Code review R2, E-m2: at --hud-zoom 2 getBoundingClientRect() is doubled while
    // scrollTop and clientHeight are not, so the target was about twice too far down.
    const panel = panelWith({ debrief: { top: 690, height: 63 } });
    const c = panel.content;
    c.offsetHeight = 560;
    c.getBoundingClientRect = () => ({ top: 75, height: 2 * 560 });
    c.querySelector = (sel) => (/data-aim-id="debrief"/.test(sel)
        ? { getBoundingClientRect: () => ({ top: 75 + 2 * (690 - c.scrollTop), height: 2 * 63 }) } : null);
    panel.render([aim('keylogger'), aim('bonus')]);
    panel.render([aim('keylogger', 'completed'), aim('bonus'), aim('debrief')]);
    assert.equal(c.scrollTop, 193, 'the same place as without a zoom');
    // An aim in the middle of a long list is not scrolled past
    const mid = panelWith({});
    mid.content.offsetHeight = 560;
    mid.content.scrollTop = 0;
    mid.content.getBoundingClientRect = () => ({ top: 75, height: 2 * 560 });
    mid.content.querySelector = (sel) => (/data-aim-id="extra"/.test(sel)
        ? { getBoundingClientRect: () => ({ top: 75 + 2 * (600 - mid.content.scrollTop), height: 2 * 80 }) } : null);
    mid.render([aim('a')]);
    mid.render([aim('a'), aim('extra')]);
    assert.equal(mid.content.scrollTop, 120, '600 + 80 - 560, not twice that');
});

test('stylesheet: the list has no max-height of its own and shares the panel as a flex column', () => {
    const css = readFileSync(join(root, 'public/break_escape/css/objectives.css'), 'utf8');
    const rule = (sel) => { const m = new RegExp(`(?:^|\\n)${sel.replace('.', '\\.')} \\{([^}]*)\\}`).exec(css); return m ? m[1] : ''; };
    assert.match(rule('.objectives-panel'), /display: flex;\s*flex-direction: column;/);
    assert.match(rule('.objectives-content'), /flex: 1 1 auto;\s*min-height: 0;\s*overflow-y: auto;/);
    assert.ok(!/\.objectives-content \{[^}]*max-height/.test(css), 'no rule gives the list its own max-height');
    assert.match(rule('.objectives-header'), /flex: 0 0 auto;/);
    // show() must not put an inline display:block back over the flex column
    const src = readFileSync(join(js, 'ui/objectives-panel.js'), 'utf8');
    assert.ok(!/style\.display = 'block'/.test(src));
});
