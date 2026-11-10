// Stub world for the access slice 9.2 sub-slice A needs tests (npc-needs-work.test.mjs): the
// needs stub world plus globals, the pure work rules (npc-work.js), the use verdict and a report
// queue, as createEngineWorld wires them.
import { NPCNeedsSystem, requiredGlobalsHold } from '../../../public/break_escape/js/systems/npc-needs.js';
import npcWork from '../../../public/break_escape/js/systems/npc-work.js';
import { makeWorld } from './needs-stub-world.mjs';

export const PLAN = Object.freeze({
    breakDrain: 10,
    needs: [
        { id: 'finance_share', kind: 'file_share', admitted: true, downIf: 'share_down' },
        { id: 'printer', kind: 'printer', admitted: true, downIf: 'printer_jammed', object: 'office_printer' }
    ]
});

export function dana(extra = {}) {
    return {
        id: 'dana', needsHome: 'dana_pc', needsDeferMin: 0.5, work: JSON.parse(JSON.stringify(PLAN)),
        needs: {
            work: { decayPerMin: 40, urgentAt: 50, initial: 60, jitterPct: 0 },
            caffeine: { decayPerMin: 1, urgentAt: 10, initial: 80, jitterPct: 0 }
        },
        ...extra
    };
}

export function baseObjects() {
    return [
        { id: 'dana_pc', x: 100, y: 68, desk: true, affordance: { satisfies: 'work', restores: 60, useSeconds: 5, offWhen: 'dana_pc_off' } },
        { id: 'coffee', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10, offWhen: 'coffee_off' } },
        { id: 'office_printer', x: 200, y: 300 }
    ];
}

export function workWorld({ npcs = { dana: { pos: { x: 100, y: 100 }, rec: dana() } }, objects = baseObjects(), globals = {}, chatter, seed = 'work' } = {}) {
    const w = makeWorld({ npcs, objects });
    const g = { share_down: false, printer_jammed: false, dana_pc_off: false, coffee_off: false, ...globals };
    const reports = [];
    w.world.globalHolds = cond => requiredGlobalsHold(cond, g);
    w.world.globalValue = name => g[name];
    w.world.workRules = npcWork;
    w.world.useVerdict = (npcId, need, obj) => {
        const rec = npcs[npcId].rec;
        const station = obj && obj.id === rec.needsHome ? { id: obj.id, lockedOut: !!w.lockedOut?.[npcId] } : null;
        return npcWork.useVerdict(rec.work, need, station, g);
    };
    w.world.reportUse = (npcId, r) => reports.push({ npcId, ...r });
    if (chatter) w.world.chatterConfig = () => chatter;
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    const set = (name, value) => { g[name] = value; sys.onGlobalChanged(name); };
    const evs = prefix => w.calls.emits.filter(e => e.name.startsWith(prefix));
    const log = (ev, npc = 'dana') => sys.getLog().filter(e => e.npc === npc && e.ev === ev);
    return { w, sys, g, set, reports, evs, log };
}
