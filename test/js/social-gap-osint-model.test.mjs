// Gap tests for minigames/osint-browser/osint-model.js and address-bar.js: location parsing,
// hidden pages (showIf), links across sites, the awareness profile filter, saved-state restore
// and tool unlocking.
// Run with: bin/test-js test/js/social-gap-osint-model.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-osint-'));
writeFileSync(join(dir, 'osint-model.mjs'), readFileSync(join(js, 'minigames/osint-browser/osint-model.js'), 'utf8'));
writeFileSync(join(dir, 'address-bar.mjs'), readFileSync(join(js, 'minigames/osint-browser/address-bar.js'), 'utf8'));
const O = await import(pathToFileURL(join(dir, 'osint-model.mjs')).href);
const { formatAddress } = await import(pathToFileURL(join(dir, 'address-bar.mjs')).href);

const company = { id: 'co', type: 'company-site', pages: [{ id: 'home' }, { id: 'team' }, { id: 'secret', showIf: 'unlocked_secret' }] };
const social = { id: 'soc', type: 'social', profiles: [{ person: 'pierce', name: 'Pierce' }, { person: 'hidden', showIf: 'flag_h' }, { name: 'no person' }] };
const doc = { id: 'doc', type: 'document' };
const sites = [company, social, doc];

test('siteAllowed: unknown or missing types are never shown; awareness hides documents only', () => {
    assert.equal(O.siteAllowed(null, null), false);
    assert.equal(O.siteAllowed({ type: 'weird' }, null), false);
    assert.equal(O.siteAllowed(doc, 'analyst'), true);
    assert.equal(O.siteAllowed(doc, null), true);
    assert.equal(O.siteAllowed(doc, 'awareness'), false);
    assert.equal(O.siteAllowed(company, 'awareness'), true);
    assert.equal(O.siteAllowed(social, 'awareness'), true);
    assert.equal(O.toolsAllowed('awareness'), false);
    assert.equal(O.toolsAllowed('analyst'), true);
    assert.equal(O.toolsAllowed(undefined), true);
});

test('showIfHolds: no showIf is always true; a non-string showIf is ignored; falsy globals hide', () => {
    assert.equal(O.showIfHolds(undefined, {}), true);
    assert.equal(O.showIfHolds('', {}), true);
    assert.equal(O.showIfHolds(5, {}), true);
    assert.equal(O.showIfHolds('g', null), false);
    assert.equal(O.showIfHolds('g', { g: 0 }), false);
    assert.equal(O.showIfHolds('g', { g: '' }), false);
    assert.equal(O.showIfHolds('g', { g: true }), true);
    assert.equal(O.showIfHolds('g', { g: 'yes' }), true);
    // note: the string "false" is truthy; documents current behaviour
    assert.equal(O.showIfHolds('g', { g: 'false' }), true);
});

test('isHeld needs exactly true: a truthy string is not held', () => {
    assert.equal(O.isHeld({ se_intel_x: true }, 'x'), true);
    assert.equal(O.isHeld({ se_intel_x: 'true' }, 'x'), false);
    assert.equal(O.isHeld({ se_intel_x: 1 }, 'x'), false);
    assert.equal(O.isHeld(null, 'x'), false);
    assert.equal(O.isHeld({}, undefined), false);
});

test('readOsintState: junk shapes give an empty state; visited is de-duplicated and string-filtered', () => {
    for (const raw of [undefined, null, 'x', 5, [], { visited: 'a' }, { visited: null }]) {
        assert.deepEqual(O.readOsintState({ [O.STATE_KEY]: raw }), { visited: [], at: null });
    }
    assert.deepEqual(O.readOsintState(null), { visited: [], at: null });
    assert.deepEqual(O.readOsintState({ [O.STATE_KEY]: { visited: ['a', 'a', 5, '', 'b'], at: 'co.home', extra: 1 } }), { visited: ['a', 'b'], at: 'co.home' });
    assert.equal(O.readOsintState({ [O.STATE_KEY]: { at: 7 } }).at, null);
    assert.equal(O.readOsintState({ [O.STATE_KEY]: { at: '' } }).at, null);
});

test('listSites: data order, siteIds restricts, an empty siteIds list means no restriction, unknown ids are skipped', () => {
    const osint = { sites: [...sites, { type: 'company-site' }, { id: 5, type: 'company-site' }, null] };
    assert.deepEqual(O.listSites(osint).map((s) => s.id), ['co', 'soc', 'doc']);
    assert.deepEqual(O.listSites(osint, { siteIds: ['doc', 'co'] }).map((s) => s.id), ['co', 'doc']);
    assert.deepEqual(O.listSites(osint, { siteIds: [] }).map((s) => s.id), ['co', 'soc', 'doc']);
    assert.deepEqual(O.listSites(osint, { siteIds: ['nope'] }), []);
    assert.deepEqual(O.listSites(osint, { siteIds: 'co' }).map((s) => s.id), ['co', 'soc', 'doc']);
});

test('listSites: the awareness profile can come from the call or from osint.profile; the call wins', () => {
    const osint = { profile: 'awareness', sites };
    assert.deepEqual(O.listSites(osint).map((s) => s.id), ['co', 'soc']);
    assert.deepEqual(O.listSites(osint, { profile: 'analyst' }).map((s) => s.id), ['co', 'soc', 'doc']);
    assert.deepEqual(O.listSites(null), []);
    assert.deepEqual(O.listSites({ sites: 'x' }), []);
});

test('visiblePages: company pages filter on showIf; social pages are one per profile with a person id', () => {
    assert.deepEqual(O.visiblePages(company, {}).map((p) => p.id), ['home', 'team']);
    assert.deepEqual(O.visiblePages(company, { unlocked_secret: true }).map((p) => p.id), ['home', 'team', 'secret']);
    const pages = O.visiblePages(social, {});
    assert.deepEqual(pages.map((p) => [p.id, p.title]), [['pierce', 'Pierce']]);
    assert.deepEqual(O.visiblePages(social, { flag_h: 1 }).map((p) => p.id), ['pierce', 'hidden']);
    assert.equal(O.visiblePages(social, { flag_h: 1 })[1].title, 'hidden'); // no name -> person id
    assert.deepEqual(O.visiblePages(doc, {}), []);
    assert.deepEqual(O.visiblePages(null, {}), []);
    assert.deepEqual(O.visiblePages({ type: 'company-site' }, {}), []);
});

test('splitKey: bare, site.page, extra dots stay in the page id, junk gives nulls', () => {
    assert.deepEqual(O.splitKey('co'), { siteId: 'co', pageId: null });
    assert.deepEqual(O.splitKey('co.home'), { siteId: 'co', pageId: 'home' });
    assert.deepEqual(O.splitKey('co.a.b'), { siteId: 'co', pageId: 'a.b' });
    assert.deepEqual(O.splitKey('co.'), { siteId: 'co', pageId: '' });
    assert.deepEqual(O.splitKey(''), { siteId: null, pageId: null });
    assert.deepEqual(O.splitKey(undefined), { siteId: null, pageId: null });
    assert.deepEqual(O.splitKey(5), { siteId: null, pageId: null });
});

test('locate: tools, documents, bare sites, hidden pages, unknown sites', () => {
    assert.deepEqual(O.locate(sites, O.TOOLS_KEY, {}), { view: 'tools', site: null, pageId: null });
    assert.equal(O.locate(sites, 'doc', {}).view, 'document');
    assert.equal(O.locate(sites, 'doc.anything', {}).view, 'document');
    assert.equal(O.locate(sites, 'co', {}).pageId, 'home');
    assert.equal(O.locate(sites, 'co.team', {}).pageId, 'team');
    assert.equal(O.locate(sites, 'co.secret', {}), null);
    assert.equal(O.locate(sites, 'co.secret', { unlocked_secret: true }).pageId, 'secret');
    assert.equal(O.locate(sites, 'co.nope', {}), null);
    assert.equal(O.locate(sites, 'ghost', {}), null);
    assert.equal(O.locate(sites, undefined, {}), null);
    assert.equal(O.locate(sites, '', {}), null);
});

test('locate: a company site whose pages are all hidden still opens, with no page', () => {
    const lonely = { id: 'l', type: 'company-site', pages: [{ id: 'x', showIf: 'never' }] };
    assert.deepEqual(O.locate([lonely], 'l', {}), { view: 'page', site: lonely, pageId: null });
});

test('locate: social site opens the list; a hidden profile cannot be opened directly (deep link/restore)', () => {
    assert.deepEqual(O.locate(sites, 'soc', {}), { view: 'social', site: social, pageId: null });
    assert.equal(O.locate(sites, 'soc.pierce', {}).pageId, 'pierce');
    assert.equal(O.locate(sites, 'soc.hidden', {}), null);
    assert.equal(O.locate(sites, 'soc.hidden', { flag_h: true }).pageId, 'hidden');
});

test('keyOf is the inverse of locate for real places and null for nothing', () => {
    for (const key of ['co.home', 'co.team', 'soc.pierce', O.TOOLS_KEY, 'doc']) {
        assert.equal(O.keyOf(O.locate(sites, key, {})), key);
    }
    assert.equal(O.keyOf(O.locate(sites, 'soc', {})), 'soc');
    assert.equal(O.keyOf(null), null);
    assert.equal(O.keyOf({ view: 'page', site: null }), null);
});

test('visitKeys: site and page keys; nothing for a place without a site', () => {
    assert.deepEqual(O.visitKeys(O.locate(sites, 'co.team', {})), ['co', 'co.team']);
    assert.deepEqual(O.visitKeys(O.locate(sites, 'doc', {})), ['doc']);
    assert.deepEqual(O.visitKeys(O.locate(sites, O.TOOLS_KEY, {})), []);
    assert.deepEqual(O.visitKeys(null), []);
});

test('resolveLink: same-site page ids, cross-site keys, hidden targets, junk', () => {
    assert.equal(O.resolveLink(sites, 'co', 'team', {}), 'co.team');
    assert.equal(O.resolveLink(sites, 'co', 'secret', {}), null);
    assert.equal(O.resolveLink(sites, 'co', 'secret', { unlocked_secret: true }), 'co.secret');
    assert.equal(O.resolveLink(sites, 'co', 'soc.pierce', {}), 'soc.pierce');
    assert.equal(O.resolveLink(sites, 'co', 'soc', {}), 'soc');
    assert.equal(O.resolveLink(sites, 'co', 'doc', {}), 'doc');
    assert.equal(O.resolveLink(sites, 'co', 'nowhere', {}), null);
    assert.equal(O.resolveLink(sites, 'co', '', {}), null);
    assert.equal(O.resolveLink(sites, 'co', null, {}), null);
    assert.equal(O.resolveLink(sites, 'gone', 'co.home', {}), 'co.home');
    assert.equal(O.resolveLink(sites, 'gone', 'team', {}), null);
});

test('resolveLink: a bare id that is both a page here and a site elsewhere prefers the page on this site', () => {
    const a = { id: 'a', type: 'company-site', pages: [{ id: 'b' }] };
    const b = { id: 'b', type: 'company-site', pages: [{ id: 'z' }] };
    assert.equal(O.resolveLink([a, b], 'a', 'b', {}), 'a.b');
    assert.equal(O.resolveLink([a, b], 'b', 'b', {}), 'b.z');
});

test('toolUnlocked: no rule is open; visited rule; fact rule; both rules (visited wins); unknown shape stays locked', () => {
    assert.equal(O.toolUnlocked({}, [], {}), true);
    assert.equal(O.toolUnlocked(null, [], {}), true);
    assert.equal(O.toolUnlocked({ unlockedBy: 'string' }, [], {}), true); // non-object rule is ignored
    assert.equal(O.toolUnlocked({ unlockedBy: { visited: 'co.team' } }, ['co.team'], {}), true);
    assert.equal(O.toolUnlocked({ unlockedBy: { visited: 'co.team' } }, [], {}), false);
    assert.equal(O.toolUnlocked({ unlockedBy: { visited: 'co.team' } }, undefined, {}), false);
    assert.equal(O.toolUnlocked({ unlockedBy: { fact: 'f' } }, [], { se_intel_f: true }), true);
    assert.equal(O.toolUnlocked({ unlockedBy: { fact: 'f' } }, [], {}), false);
    assert.equal(O.toolUnlocked({ unlockedBy: { visited: 'v', fact: 'f' } }, [], { se_intel_f: true }), false);
    assert.equal(O.toolUnlocked({ unlockedBy: { other: 1 } }, ['x'], {}), false);
    assert.equal(O.toolUnlocked({ unlockedBy: [] }, [], {}), false); // an array is an object with no known key
});

test('listTools splits available and locked, drops tools without a string id', () => {
    const osint = { tools: [{ id: 't1' }, { id: 't2', unlockedBy: { visited: 'co' } }, { name: 'no id' }, null, { id: '' }] };
    const r = O.listTools(osint, [], {});
    assert.deepEqual(r.available.map((t) => t.id), ['t1']);
    assert.deepEqual(r.locked.map((t) => t.id), ['t2']);
    const r2 = O.listTools(osint, ['co'], {});
    assert.deepEqual(r2.available.map((t) => t.id), ['t1', 't2']);
    assert.deepEqual(r2.locked, []);
    assert.deepEqual(O.listTools(null, [], {}), { available: [], locked: [] });
    assert.deepEqual(O.listTools({ tools: 'x' }, [], {}), { available: [], locked: [] });
});

test('the reload case: restored visited ids unlock a tool without the player revisiting the page', () => {
    const saved = { [O.STATE_KEY]: { visited: ['co', 'co.team'], at: 'co.team' } };
    const { visited, at } = O.readOsintState(saved);
    assert.equal(O.listTools({ tools: [{ id: 'whois', unlockedBy: { visited: 'co.team' } }] }, visited, {}).available.length, 1);
    assert.equal(O.locate(sites, at, {}).pageId, 'team');
});

test('a restored location that has since become hidden resolves to null (the browser must fall back)', () => {
    assert.equal(O.locate(sites, 'co.secret', {}), null);
});

// ── address bar ──────────────────────────────────────────────────────────────

test('formatAddress: page url wins, then site url + page path, then site url alone, then empty', () => {
    assert.equal(formatAddress({ url: 'https://a.example' }, { url: 'https://b.example/x', path: '/ignored' }), 'https://b.example/x');
    assert.equal(formatAddress({ url: 'https://a.example' }, { path: '/team' }), 'https://a.example/team');
    assert.equal(formatAddress({ url: 'https://a.example' }, null), 'https://a.example');
    assert.equal(formatAddress({ url: 'https://a.example' }), 'https://a.example');
    assert.equal(formatAddress(null, null), '');
    assert.equal(formatAddress({}, { path: '/x' }), '/x');
    assert.equal(formatAddress({ url: 5 }, { url: '', path: 7 }), '');
});

test('formatAddress leaves punycode and look-alike hosts exactly as authored', () => {
    assert.equal(formatAddress({ url: 'https://xn--pypal-4ve.example' }), 'https://xn--pypal-4ve.example');
    assert.equal(formatAddress({ url: 'https://раураl.example' }), 'https://раураl.example');
    assert.equal(formatAddress({ url: 'https://a.example' }, { path: '/a — b' }), 'https://a.example/a — b');
});
