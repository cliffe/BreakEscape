// The use verdict (systems/npc-work.js), access slice 9.2 sub-slice A (plan 5.2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useVerdict, reachable, wakeOnFor, causesClear, planGlobals } from '../../public/break_escape/js/systems/npc-work.js';

const plan = {
    breakDrain: 10,
    needs: [
        { id: 'finance_share', kind: 'file_share', admitted: true, offWhen: 'share_down' },
        { id: 'secret_share', kind: 'file_share', admitted: false },
        { id: 'email', kind: 'email', admitted: true, routes: [['wan_down']] }
    ]
};

test('the verdict for each failure and several at once', () => {
    const ok = { needs: [plan.needs[0], plan.needs[2]] };
    assert.deepEqual(useVerdict(ok, 'work', null, {}), { met: true, missing: [], station: false });
    assert.deepEqual(useVerdict(ok, 'work', null, { share_down: true }).missing, [{ id: 'finance_share', why: 'down' }]);
    assert.deepEqual(useVerdict(ok, 'work', null, { wan_down: 1 }).missing, [{ id: 'email', why: 'unreachable' }]);
    const all = useVerdict(plan, 'work', { id: 'pc', lockedOut: true }, { share_down: true, wan_down: true });
    assert.deepEqual(all.missing, [{ id: 'pc', why: 'locked_out' }, { id: 'finance_share', why: 'down' },
        { id: 'secret_share', why: 'no_access' }, { id: 'email', why: 'unreachable' }]);
    assert.equal(all.station, true);
    assert.equal(all.met, false);
    // a function for globals works the same
    assert.deepEqual(useVerdict(ok, 'work', null, n => n === 'share_down').missing, [{ id: 'finance_share', why: 'down' }]);
    // social_media: only the station
    assert.deepEqual(useVerdict(plan, 'social_media', { id: 'pc', socialBlocked: true }, {}).missing, [{ id: 'pc', why: 'social_blocked' }]);
});

test('reach: no routes key is reachable, [] never, [[]] always, a route with no truthy global', () => {
    assert.equal(reachable({ id: 'x' }, {}), true);
    assert.equal(reachable({ id: 'x', routes: [] }, {}), false);
    assert.equal(reachable({ id: 'x', routes: [[]] }, {}), true);
    assert.equal(reachable({ id: 'x', routes: [['a'], ['b']] }, { a: true }), true);
    assert.equal(reachable({ id: 'x', routes: [['a'], ['b']] }, { a: true, b: true }), false);
    assert.equal(reachable({ id: 'x', routes: [['a', 'b']] }, { b: true }), false);
});

test('reach: a route condition in the { name: value } form takes the route down on a match (step 8a ruling)', () => {
    const need = { id: 'x', routes: [[{ power: 'off' }]] };
    assert.equal(reachable(need, { power: 'on' }), true, 'value does not match: route open');
    assert.equal(reachable(need, { power: 'off' }), false, 'value matches: route down');
    // a bare name and a hash condition on the same route: either one down takes the route down
    const mixed = { id: 'y', routes: [['wan_down', { power: 'off' }]] };
    assert.equal(reachable(mixed, { power: 'on' }), true);
    assert.equal(reachable(mixed, { wan_down: true }), false);
    // planGlobals and wakeOnFor read the names out of the hash condition too
    assert.deepEqual(planGlobals({ needs: [mixed] }), ['power', 'wan_down']);
    assert.deepEqual(wakeOnFor({ needs: [mixed] }, [{ id: 'y', why: 'unreachable' }], { power: 'off' }), ['power']);
});

test('wakeOn: down and truthy route globals; empty when a cause has no global', () => {
    assert.deepEqual(wakeOnFor(plan, [{ id: 'finance_share', why: 'down' }], {}), ['share_down']);
    assert.deepEqual(wakeOnFor(plan, [{ id: 'email', why: 'unreachable' }], { wan_down: true }), ['wan_down']);
    assert.deepEqual(wakeOnFor(plan, [{ id: 'finance_share', why: 'down' }, { id: 'secret_share', why: 'no_access' }], {}), []);
    assert.deepEqual(wakeOnFor({ needs: [{ id: 'e', routes: [] }] }, [{ id: 'e', why: 'unreachable' }], {}), []);
    assert.equal(causesClear(plan, [{ id: 'finance_share', why: 'down' }], { share_down: false }), true);
    assert.equal(causesClear(plan, [{ id: 'finance_share', why: 'down' }, { id: 'secret_share', why: 'no_access' }], {}), false);
    assert.deepEqual(planGlobals(plan), ['share_down', 'wan_down']);
});
