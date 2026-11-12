// scripts/validate_access_work.rb, the USB habit (docs/achitechture/USB_HABIT_PLAN.md, q39):
// usbHabit's shape and global, the no-plan warning, the usb_refused mutter, the work report line
// and a reactive post keyed on cause usb_refused.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function run(scenario, fn = 'check') {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(ValidateAccessWork.${fn}(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = s => run(s, 'check');
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);

function clean() {
    return {
        startRoom: 'office',
        chatter: { usb_refused: ['IT blocked my USB. Email it is, then.'] },
        policies: { locked: { usb: 'storage_blocked' }, lax: { usb: 'allowed' } },
        globalVariables: { kim_emailed: false },
        resources: { reports: { kind: 'file_share', name: 'Reports' } },
        rooms: {
            office: {
                type: 'room_office',
                objects: [{ id: 'kim_pc', type: 'pc', name: 'PC', lockType: 'login', policy: 'locked',
                    affordance: { satisfies: 'work', useSeconds: 5, restores: 10 } }],
                npcs: [{ id: 'kim', displayName: 'Kim', npcType: 'person', needsHome: 'kim_pc', needsDeferMin: 0.5,
                    workNeeds: ['reports'], usbHabit: { every: 2, setGlobal: 'kim_emailed' },
                    itemsHeld: [{ type: 'usb', id: 'kim_usb', name: "Kim's USB stick", sprite: 'usb_bowl1', usbClass: 'storage', takeable: true }],
                    needs: { work: { decayPerMin: 40, urgentAt: 50 } } }]
            }
        }
    };
}
const kim = s => s.rooms.office.npcs[0];

test('USB habit: a clean fixture raises nothing', { skip }, () => {
    assert.deepEqual(issues(clean()), []);
});

test('USB habit: a bad every, an undeclared setGlobal and a non-object are errors', { skip }, () => {
    const s = clean();
    kim(s).usbHabit = { every: 0, setGlobal: 'nope' };
    const list = issues(s);
    assertHas(list, 'kim.usbHabit.every is 0');
    assertHas(list, 'kim.usbHabit.setGlobal "nope" is not declared');
    kim(s).usbHabit = true;
    assertHas(issues(s), 'kim.usbHabit must be an object');
});

test('USB habit: no work plan is warned', { skip }, () => {
    const s = clean();
    kim(s).workNeeds = [];
    assertHas(issues(s), 'kim has a usbHabit but no work plan');
});

// Review R1 m5
test('USB habit: no station is warned', { skip }, () => {
    const s = clean();
    delete kim(s).needsHome;
    assertHas(issues(s), 'kim has a usbHabit but no station');
    const t = clean();
    kim(t).needsHome = 'missing_pc';
    assertHas(issues(t), 'kim has a usbHabit but no station');
});

test('USB habit: a setGlobal at a PC that allows USB is warned', { skip }, () => {
    const s = clean();
    s.rooms.office.objects[0].policy = 'lax';
    assertHas(issues(s), "kim.usbHabit.setGlobal 'kim_emailed' can never be set");
    delete kim(s).usbHabit.setGlobal;
    assert.ok(!has(issues(s), 'can never be set'), 'no global, nothing to warn');
});

test('USB habit: a refusing PC needs a usb_refused (or work_fail) line', { skip }, () => {
    const s = clean();
    delete s.chatter;
    assertHas(issues(s), 'kim can fail for its PC refusing its USB stick');
    s.chatter = { work_fail: ['Why is nothing working?'] };
    assert.ok(!has(issues(s), 'refusing its USB stick'));
    const t = clean();
    delete t.chatter;
    t.rooms.office.objects[0].policy = 'lax';
    assert.ok(!has(issues(t), 'refusing its USB stick'), 'an allowing PC refuses nothing');
});

test('USB habit: only room NPCs may carry it', { skip }, () => {
    const s = clean();
    s.npcs = [{ id: 'phone_kim', usbHabit: { every: 2 } }];
    assertHas(issues(s), "has 'usbHabit', which is allowed only on room NPCs");
});

test('USB habit: the work report names it, refused or allowed', { skip }, () => {
    const s = clean();
    assertHas(run(s, 'report_lines'), "every 2nd use at 'kim_pc' copies to a USB stick, which its policy refuses (cause usb_refused)");
    s.rooms.office.objects[0].policy = 'lax';
    assertHas(run(s, 'report_lines'), 'which its policy allows');
});

test('USB habit: a reactive post on cause usb_refused is accepted where it can fire', { skip }, () => {
    const s = clean();
    s.social = { osint: { sites: [{ id: 'ff', type: 'social', name: 'FF', profiles: [{ person: 'kim', name: 'Kim', posts: [] }] }] } };
    kim(s).needs.social_media = { decayPerMin: 60, urgentAt: 40 };
    kim(s).feed = { site: 'ff', person: 'kim', order: 'reactive_first',
        posts: [{ id: 'vent', text: 'IT blocked my USB again.', when: { cause: 'usb_refused', need: 'work' } }] };
    const list = issues(s);
    assert.ok(!has(list, 'not one of'), list.join('\n'));
    assertHas(run(s, 'report_lines'), 'vent: fires when a cause with why usb_refused for work is live');
    s.rooms.office.objects[0].policy = 'lax';
    assertHas(issues(s), 'kim.feed.posts[0].when can never hold for kim');
});

// ── the stick (2026-11-12) ──────────────────────────────────────────────

test('USB habit: no stick in itemsHeld is an error', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld = [{ type: 'key', id: 'k1', name: 'Key' }];
    assertHas(issues(s), 'kim has a usbHabit but holds no USB stick');
    delete kim(s).itemsHeld;
    assertHas(issues(s), 'kim has a usbHabit but holds no USB stick');
    kim(s).itemsHeld = [{ type: 'usb', name: 'No id' }];
    assertHas(issues(s), 'kim has a usbHabit but holds no USB stick');
});

test('USB habit: authored files that are well formed raise nothing', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld[0].contents = [
        { type: 'text_file', id: 'kim_rota', name: 'rota.txt', text: 'Rota.', readable: true },
        { type: 'text_file', id: 'kim_cv', name: 'cv.txt', text: 'CV.', readable: true }
    ];
    assert.deepEqual(issues(s), []);
});

test('USB habit: badly formed files are errors', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld[0].contents = [];
    assertHas(issues(s), "kim's USB stick 'kim_usb'.contents must be a non-empty list");
    kim(s).itemsHeld[0].contents = [
        { type: 'notes', id: 'n', name: 'n', text: 't' },
        { type: 'text_file', name: '', text: '' },
        { type: 'text_file', id: 'a', name: 'a.txt', text: 'A', locked: true },
        { type: 'text_file', id: 'a', name: 'b.txt', text: 'B' }
    ];
    const list = issues(s);
    assertHas(list, "kim's USB stick 'kim_usb'.contents[0] must be a file");
    assertHas(list, "contents[1] needs an id");
    assertHas(list, "contents[1] needs a name");
    assertHas(list, "contents[1] needs a text");
    assertHas(list, "contents[2] is locked");
    assertHas(list, "lists the id(s) a more than once");
});

test('USB habit: a locked stick is an error, one not takeable a warning', { skip }, () => {
    const s = clean();
    Object.assign(kim(s).itemsHeld[0], { locked: true, takeable: false });
    const list = issues(s);
    assertHas(list, "kim's USB stick 'kim_usb' is locked");
    assertHas(list, "kim's USB stick 'kim_usb' is not takeable");
});

// Review R2 m1: folders and archives nest, each checked like the stick itself
test('USB habit: an unlocked folder or archive with its own files is accepted, to any sane depth', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld[0].contents = [
        { type: 'text_file', id: 'kim_a', name: 'a.txt', text: 'A', takeable: false },
        { type: 'zip_archive', id: 'kim_zip', name: 'old.zip', contents: [
            { type: 'text_file', id: 'kim_b', name: 'b.txt', text: 'B' },
            { type: 'folder', id: 'kim_dir', name: 'drafts', contents: [{ type: 'text_file', id: 'kim_c', name: 'c.txt', text: 'C' }] }
        ] }
    ];
    assert.deepEqual(issues(s), []);
});

test('USB habit: nested entries are checked, ids are unique across the tree, and a locked or empty folder is an error', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld[0].contents = [
        { type: 'text_file', id: 'kim_a', name: 'a.txt', text: 'A' },
        { type: 'zip_archive', id: 'kim_zip', name: 'old.zip', locked: true, contents: [
            { type: 'text_file', id: 'kim_a', name: 'again.txt', text: '' },
            { type: 'folder', id: 'kim_empty', name: 'empty', contents: [] }
        ] }
    ];
    const list = issues(s);
    assertHas(list, "contents[1] is locked");
    assertHas(list, "contents[1].contents[0] needs a text");
    assertHas(list, "contents[1].contents[1] must be a file");
    assertHas(list, "lists the id(s) kim_a more than once");
});

// Review R2 n2
test('USB habit: a takeable file on a stick is warned, and two NPCs sharing a stick id is an error', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld[0].contents = [{ type: 'text_file', id: 'kim_a', name: 'a.txt', text: 'A', takeable: true }];
    assertHas(issues(s), "contents[0] is takeable, but nothing can be taken off a stick");
    const t = clean();
    const amy = JSON.parse(JSON.stringify(kim(t)));
    amy.id = 'amy';
    t.rooms.office.npcs.push(amy);
    assertHas(issues(t), "the USB stick id 'kim_usb' is held by kim and amy");
});

// Review R2 n1
test('USB habit: the not-takeable warning says a knock-out still drops it', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld[0].takeable = false;
    assertHas(issues(s), 'cannot be handed over or picked up unless kim is knocked out');
});

// Review R2 m4: a HID device is never the habit's stick
test('USB habit: a HID device is not the stick; a storage stick after it is', { skip }, () => {
    const s = clean();
    kim(s).itemsHeld = [{ type: 'usb', id: 'kim_hid', name: 'Keylogger', usbClass: 'hid', takeable: true }];
    assertHas(issues(s), "('kim_hid' has usbClass 'hid'; a habit stick is a storage stick)");
    const t = clean();
    kim(t).itemsHeld.unshift({ type: 'usb', id: 'kim_hid', name: 'Keylogger', usbClass: 'hid', takeable: true });
    assert.deepEqual(issues(t), []);
    const r = run(t, 'report_lines').join('\n');
    assert.ok(!r.includes('kim_hid'), r);
});

// Review R2 M1: a give that can come before the first refusal strands the habit's beats
function withInk(s, ink) {
    const dir = mkdtempSync(join(tmpdir(), 'usb-give-'));
    const path = join(dir, 'kim.ink');
    writeFileSync(path, ink);
    kim(s).storyPath = path.replace(/\.ink$/, '.json');
    kim(s).eventMappings = [{ eventPattern: 'npc_usb_refused:kim', onceOnly: true, completeTask: 'refused' }];
    return s;
}
const hub = (choice) => `=== start ===\nHi.\n-> hub\n=== hub ===\n${choice}\n    #give_item:usb\n    Take it.\n    -> hub\n+ [Bye] #exit_conversation\n    Bye.\n    -> hub\n`;

test('USB habit: an ungated ink give of the stick is warned when something waits on the refusal', { skip }, () => {
    const list = issues(withInk(clean(), hub('* [Could I have your stick?]')));
    assertHas(list, "kim's ink gives the USB stick 'kim_usb' (kim.ink line 6)");
    assertHas(list, 'Offer the give from a choice gated on {kim_emailed}');
    assertHas(issues(withInk(clean(), hub('+ {not kim_emailed} [Stick?]'))), "kim's ink gives the USB stick");
});

test('USB habit: a give gated on the habit global, or nothing keyed on the refusal, raises nothing', { skip }, () => {
    assert.deepEqual(issues(withInk(clean(), hub('+ {kim_emailed and not kim_gave} [Stick?]'))), []);
    const s = withInk(clean(), hub('* [Stick?]'));
    delete kim(s).eventMappings;
    assert.deepEqual(issues(s), []);
});

// Review R3 n1: #give_npc_inventory_items offers the stick too; a conditional block gates a give
test('USB habit: #give_npc_inventory_items that offers the stick is a give', { skip }, () => {
    const ink = (tag) => `=== start ===\nHi.\n-> hub\n=== hub ===\n+ [What have you got?]\n    ${tag}\n    -> hub\n`;
    assertHas(issues(withInk(clean(), ink('#give_npc_inventory_items'))), "kim's ink gives the USB stick 'kim_usb' (kim.ink line 6)");
    assertHas(issues(withInk(clean(), ink('#give_npc_inventory_items:notes,usb'))), "kim's ink gives the USB stick");
    assert.deepEqual(issues(withInk(clean(), ink('#give_npc_inventory_items:notes,key'))), []);
});

test('USB habit: a give inside a conditional block gated on the habit global raises nothing', { skip }, () => {
    const block = `=== start ===\nHi.\n-> hub\n=== hub ===\n{kim_emailed and not kim_gave:\n    + [Stick?]\n        #give_item:usb\n        Take it.\n        -> hub\n}\n+ [Bye] #exit_conversation\n    -> hub\n`;
    assert.deepEqual(issues(withInk(clean(), block)), []);
    const branch = `=== start ===\n-> hub\n=== hub ===\n{\n    - kim_emailed:\n        + [Stick?]\n            #give_item:usb\n            -> hub\n    - else:\n        Nothing yet.\n}\n-> hub\n`;
    assert.deepEqual(issues(withInk(clean(), branch)), []);
    const negated = `=== start ===\n-> hub\n=== hub ===\n{not kim_emailed:\n    + [Stick?]\n        #give_item:usb\n        -> hub\n}\n-> hub\n`;
    assertHas(issues(withInk(clean(), negated)), "kim's ink gives the USB stick");
    const closed = `=== start ===\n-> hub\n=== hub ===\n{kim_emailed: Thanks.}\n+ [Stick?]\n    #give_item:usb\n    -> hub\n`;
    assertHas(issues(withInk(clean(), closed)), "kim's ink gives the USB stick");
});

test('USB habit: a mail reply run as kim is read for gives', { skip }, () => {
    const s = withInk(clean(), `=== start ===\nHi.\n-> END\n`);
    const dir = mkdtempSync(join(tmpdir(), 'usb-mail-'));
    writeFileSync(join(dir, 'kim_mail.ink'), `=== on_email ===\nHere you go.\n#give_item:kim_usb\n-> END\n`);
    const rec = { storyPath: join(dir, 'kim_mail.json'), itemsHeld: [{ type: 'usb', id: 'kim_usb', name: 'Stick' }] };
    s.social = { characters: { kim: { channels: { email: 'kim_mail' }, emailRecord: rec } } };
    assertHas(issues(s), "kim's ink gives the USB stick 'kim_usb' (kim_mail.ink line 3)");
    s.social = { mailClient: { contacts: [{ npc: 'kim_mail', emailRecord: rec }] } };
    assertHas(issues(s), "kim's ink gives the USB stick 'kim_usb' (kim_mail.ink line 3)");
    // A record that does not hold the stick gives from its own items, so it cannot hand it over
    rec.itemsHeld = [];
    assert.ok(!has(issues(s), "kim's ink gives the USB stick"), issues(s).join('\n'));
});

// Review R3 m3: a knock-out before the first refusal strands a required task keyed on it
function koFixture() {
    const s = clean();
    s.objectives = [{ aimId: 'a', tasks: [{ taskId: 'refused', type: 'custom' }] }];
    kim(s).eventMappings = [{ eventPattern: 'npc_usb_refused:kim', onceOnly: true, completeTask: 'refused' }];
    return s;
}
test('USB habit: a required task keyed only on the refusal is warned while the NPC can be knocked out', { skip }, () => {
    assertHas(issues(koFixture()), 'kim can be knocked out before its first USB refusal');
    assertHas(issues(koFixture()), 'the required task(s) refused complete only on that refusal');
    const g = koFixture();
    kim(g).eventMappings = [{ eventPattern: 'global_variable_changed:kim_emailed', completeTask: 'refused' }];
    assertHas(issues(g), 'kim can be knocked out before its first USB refusal');
});

test('USB habit: koImmune, taskOnKO, a knock-out mapping, disableAttacks or an optional task clear the knock-out warning', { skip }, () => {
    const cases = [
        s => { kim(s).koImmune = true; },
        s => { kim(s).taskOnKO = 'refused'; },
        s => { kim(s).eventMappings.push({ eventPattern: 'npc_ko:kim', completeTask: 'refused' }); },
        s => { s.disableAttacks = true; },
        s => { s.objectives[0].tasks[0].optional = true; }
    ];
    for (const change of cases) {
        const s = koFixture();
        change(s);
        assert.ok(!has(issues(s), 'knocked out before its first USB refusal'), issues(s).join('\n'));
    }
});
