// Credits visualiser CCTV mode: the camera feeds come from the scenario's room
// conversation backgrounds, else the theme's fallback, 2026-11-03.
// Run with: node --test test/js/cctv-feeds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const load = f => import('data:text/javascript;base64,' + readFileSync(join(here, '../../public/break_escape/js/music', f)).toString('base64'));
const C = await load('cctv-feeds.js');
const T = await load('credits-theme.js');

test('room labels: underscores become spaces, upper case', () => {
    assert.equal(C.cctvRoomLabel('conference_room_01'), 'CONFERENCE ROOM 01');
    assert.equal(C.cctvRoomLabel('it-room'), 'IT ROOM');
    assert.equal(C.cctvRoomLabel(undefined), '');
});

test('feeds: one per distinct room background; every room\'s first view, then the other views', () => {
    const feeds = C.cctvFeeds({ rooms: {
        reception: { chatBackground: 'assets/backgrounds/rooms/a.png' },
        office:    { chatBackground: [
            { x: [0, 0.5], image: 'assets/backgrounds/rooms/b.png' },
            { x: [0.5, 1], image: 'assets/backgrounds/rooms/c.png', condition: 'fire == true' },
            { image: '  ' },
        ] },
        closet:    {},
        copy:      { chatBackground: 'assets/backgrounds/rooms/a.png' }, // same image, not repeated
        lobby:     { chatBackground: [{ image: 'assets/backgrounds/rooms/d.png' }] },
    } });
    assert.deepEqual(feeds, [
        { label: 'RECEPTION', image: 'assets/backgrounds/rooms/a.png' },
        { label: 'OFFICE',    image: 'assets/backgrounds/rooms/b.png' },
        { label: 'LOBBY',     image: 'assets/backgrounds/rooms/d.png' },
        { label: 'OFFICE',    image: 'assets/backgrounds/rooms/c.png' },
    ]);
});

test('feeds: fallback only when the scenario has no backgrounds; none gives an empty wall', () => {
    const fb = [{ label: 'HQ', image: 'assets/backgrounds/hq1.png' }];
    assert.deepEqual(C.cctvFeeds({ rooms: { a: {} } }, fb), fb);
    assert.deepEqual(C.cctvFeeds(null, fb), fb);
    assert.equal(C.cctvFeeds({ rooms: { a: { chatBackground: 'x.png' } } }, fb).length, 1);
    assert.deepEqual(C.cctvFeeds({}, []), []);
});

test('themes: both offer CCTV; safetynet falls back to HQ images that exist, cyber to none', () => {
    assert.ok(T.ALL_VIS_MODES.includes('cctv'));
    assert.ok(T.CREDITS_THEMES.cyber.modes.includes('cctv'));
    const fb = T.CREDITS_THEMES.safetynet.cctvFallback;
    assert.ok(fb.length > 0);
    for (const f of fb) assert.ok(existsSync(join(here, '../../public/break_escape', f.image)), f.image);
    assert.deepEqual(T.CREDITS_THEMES.cyber.cctvFallback, []);
});
