// Shared SE step strip (C-X7, review note n5): the render core behind episode-runner,
// inbox-triage and landing-page-builder. Real module runs in jsdom.
// Run with: bundle exec node --test test/js/social-step-stepper.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-step-stepper-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/helpers/step-stepper.js', 'minigames/episode-runner/step-strip.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { buildStepItems, applyStepStates } = await import(pathToFileURL(join(dir, 'minigames/helpers/step-stepper.js')));
const { renderStepStrip } = await import(pathToFileURL(join(dir, 'minigames/episode-runner/step-strip.js')));

const list = () => { document.body.textContent = ''; const ol = document.createElement('ol'); document.body.appendChild(ol); return ol; };
const steps3 = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }, { id: 'c', label: 'Gamma' }];

test('buildStepItems: clears, builds one li per step and returns the id map', () => {
    const ol = list();
    ol.appendChild(document.createElement('li')); // stale child is cleared
    const items = buildStepItems(ol, steps3, { stepClass: 'x-step', dataKey: 'step', label: { as: 'span', class: 'x-label' } });
    const lis = [...ol.querySelectorAll('li')];
    assert.equal(lis.length, 3);
    assert.equal(items.size, 3);
    assert.equal(items.get('b'), lis[1]);
    assert.ok(lis.every((li) => li.classList.contains('x-step')));
    assert.equal(lis[0].dataset.step, 'a');
    assert.equal(lis[2].dataset.step, 'c');
});

test('buildStepItems: label modes (span / text / none) and the number span', () => {
    // span label with a leading number span (episode-runner shape)
    let ol = list();
    buildStepItems(ol, steps3, { stepClass: 'aw-step', dataKey: 'stage', numClass: 'aw-step-num', label: { as: 'span', class: 'aw-step-label' } });
    let li = ol.querySelector('li');
    assert.equal(li.children.length, 2);
    assert.equal(li.children[0].className, 'aw-step-num');
    assert.equal(li.children[0].textContent, '1');
    assert.equal(li.children[1].className, 'aw-step-label');
    assert.equal(li.children[1].textContent, 'Alpha');
    assert.equal(li.dataset.stage, 'a');
    assert.equal(ol.querySelectorAll('.aw-step-num')[2].textContent, '3');

    // text label straight on the li (inbox-triage shape): no child element
    ol = list();
    buildStepItems(ol, [{ id: 'brief', label: '1 Brief' }], { stepClass: 'tri-step', dataKey: 'step', label: { as: 'text' } });
    li = ol.querySelector('li');
    assert.equal(li.children.length, 0);
    assert.equal(li.textContent, '1 Brief');

    // none: no label content at all
    ol = list();
    buildStepItems(ol, steps3, { stepClass: 'n-step', label: { as: 'none' } });
    assert.equal(ol.querySelector('li').textContent, '');
});

test('buildStepItems: dataKey omitted leaves no data attribute', () => {
    const ol = list();
    buildStepItems(ol, steps3, { stepClass: 'p', label: { as: 'span', class: 'l' } });
    assert.equal(ol.querySelector('li').dataset.step, undefined);
    assert.equal(ol.querySelector('li').dataset.stage, undefined);
});

test('applyStepStates: current gets the class and aria-current; others do not', () => {
    const ol = list();
    const items = buildStepItems(ol, steps3, { stepClass: 's', dataKey: 'step', label: { as: 'span', class: 'l' } });
    applyStepStates(items, steps3, { currentClass: 'is-current' }, (step) => ({ current: step.id === 'b' }));
    assert.ok(items.get('b').classList.contains('is-current'));
    assert.equal(items.get('b').getAttribute('aria-current'), 'step');
    assert.equal(items.get('a').getAttribute('aria-current'), null);
    assert.equal(ol.querySelectorAll('[aria-current="step"]').length, 1);
});

test('applyStepStates: re-apply moves current and clears the old aria-current', () => {
    const ol = list();
    const items = buildStepItems(ol, steps3, { stepClass: 's', dataKey: 'step', label: { as: 'span', class: 'l' } });
    applyStepStates(items, steps3, { currentClass: 'cur' }, (s) => ({ current: s.id === 'a' }));
    applyStepStates(items, steps3, { currentClass: 'cur' }, (s) => ({ current: s.id === 'c' }));
    assert.equal(items.get('a').classList.contains('cur'), false);
    assert.equal(items.get('a').getAttribute('aria-current'), null);
    assert.ok(items.get('c').classList.contains('cur'));
    assert.equal(ol.querySelectorAll('[aria-current="step"]').length, 1);
});

test('applyStepStates: done and skipped classes plus the screen-reader suffix', () => {
    const ol = list();
    const items = buildStepItems(ol, steps3, { stepClass: 'aw-step', dataKey: 'stage', numClass: 'aw-step-num', label: { as: 'span', class: 'aw-step-label' } });
    const cfg = { currentClass: 'aw-step-current', doneClass: 'aw-step-done', skippedClass: 'aw-step-skipped', srClass: 'aw-step-sr', srDone: ' (done)', srSkipped: ' (skipped)' };
    applyStepStates(items, steps3, cfg, (step) => ({
        current: step.id === 'c', done: step.id === 'a', skipped: step.id === 'b'
    }));
    assert.ok(items.get('a').classList.contains('aw-step-done'));
    assert.equal(items.get('a').querySelector('.aw-step-sr').textContent, ' (done)');
    assert.ok(items.get('b').classList.contains('aw-step-skipped'));
    assert.equal(items.get('b').querySelector('.aw-step-sr').textContent, ' (skipped)');
    assert.ok(items.get('c').classList.contains('aw-step-current'));
    assert.equal(items.get('c').querySelector('.aw-step-sr'), null);
});

test('applyStepStates: the sr suffix is not duplicated across re-applies', () => {
    const ol = list();
    const items = buildStepItems(ol, steps3, { stepClass: 'aw-step', dataKey: 'stage', label: { as: 'span', class: 'l' } });
    const cfg = { currentClass: 'cur', doneClass: 'done', srClass: 'sr', srDone: ' (done)' };
    const done = (s) => ({ done: s.id === 'a' });
    applyStepStates(items, steps3, cfg, done);
    applyStepStates(items, steps3, cfg, done);
    assert.equal(items.get('a').querySelectorAll('.sr').length, 1);
    // once no longer done, the suffix and class are removed
    applyStepStates(items, steps3, cfg, () => ({}));
    assert.equal(items.get('a').querySelectorAll('.sr').length, 0);
    assert.equal(items.get('a').classList.contains('done'), false);
});

test('applyStepStates: index-based resolve (inbox-triage shape) marks done before current', () => {
    const ol = list();
    const steps = [['brief', '1 Brief'], ['sort', '2 Sort'], ['review', '3 Review'], ['result', '4 Result']].map(([id, label]) => ({ id, label }));
    const items = buildStepItems(ol, steps, { stepClass: 'tri-step', dataKey: 'step', label: { as: 'text' } });
    const here = steps.findIndex((s) => s.id === 'review');
    applyStepStates(items, steps, { currentClass: 'current', doneClass: 'done' }, (step, i) => ({ current: i === here, done: i < here }));
    assert.ok(items.get('brief').classList.contains('done'));
    assert.ok(items.get('sort').classList.contains('done'));
    assert.ok(items.get('review').classList.contains('current'));
    assert.equal(items.get('review').classList.contains('done'), false);
    assert.equal(items.get('result').classList.contains('done'), false);
    assert.equal(items.get('result').classList.contains('current'), false);
    assert.equal(ol.querySelector('[aria-current="step"]').dataset.step, 'review');
});

test('C-X7 golden: episode step strip outerHTML is unchanged (done, current, future)', () => {
    document.body.textContent = '';
    renderStepStrip(document.body, { stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'], current: 'osint', done: ['brief'] });
    assert.equal(document.body.querySelector('ol.aw-steps').outerHTML,
        '<ol class="aw-steps"><li class="aw-step aw-step-done" data-stage="brief"><span class="aw-step-num">1</span><span class="aw-step-label">Brief</span><span class="aw-step-sr"> (done)</span></li>'
        + '<li class="aw-step aw-step-current" data-stage="osint" aria-current="step"><span class="aw-step-num">2</span><span class="aw-step-label">Research</span></li>'
        + '<li class="aw-step" data-stage="write"><span class="aw-step-num">3</span><span class="aw-step-label">Write</span></li>'
        + '<li class="aw-step" data-stage="flip"><span class="aw-step-num">4</span><span class="aw-step-label">Your message</span></li>'
        + '<li class="aw-step" data-stage="defend"><span class="aw-step-num">5</span><span class="aw-step-label">Defend</span></li>'
        + '<li class="aw-step" data-stage="debrief"><span class="aw-step-num">6</span><span class="aw-step-label">Debrief</span></li></ol>');
});
