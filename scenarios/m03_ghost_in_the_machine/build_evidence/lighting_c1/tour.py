#!/usr/bin/env python3
"""m03 lighting tour: day or night. usage: tour.py day|night OUTDIR [rooms...]
Night: sets clone_call_done/mission_phase, applies night_cfg.json room overrides by
re-registering rooms from the console (a probe of the proposed engine change), shows Danny."""
import json, os, re, subprocess, sys, time
REPO='/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape'
HERE=os.path.dirname(os.path.abspath(__file__))
mode, out = sys.argv[1], os.path.abspath(sys.argv[2]); rooms_arg=sys.argv[3:]
os.makedirs(out, exist_ok=True); os.chdir(REPO)
env=dict(os.environ, PLAYTEST_PORT='3001', BREAK_ESCAPE_STANDALONE='true')
subprocess.run(['tools/playtest/start-keyless-server.sh'], capture_output=True)
r=subprocess.run(['bin/rails','runner','tools/playtest/new-game.rb','m03_ghost_in_the_machine'],env=env,capture_output=True,text=True)
gid=re.search(r'GAME_ID=(\d+)', r.stdout+r.stderr).group(1)
fx=re.search(r'FLAGS_XML=(.*)', r.stdout)
subprocess.run(['bin/rails','runner','tools/playtest/unlock-all-rooms.rb',gid],env=env,capture_output=True)
args=['tools/playtest/session-start.sh','--url',f'http://127.0.0.1:3001/break_escape/games/{gid}','--headless','--log',f'{out}/session-{gid}.jsonl']
if fx and fx.group(1).strip(): args+=['--flags',fx.group(1).strip()]
subprocess.run(args,capture_output=True)
print('GAME_ID='+gid, flush=True)
def cmd(o):
    r=subprocess.run(['tools/playtest/cmd.sh',gid,json.dumps(o)],capture_output=True,text=True); return r.stdout
def ev(fn):
    s=cmd({'cmd':'eval','fn':fn}); m=re.search(r'"result":("?)([^"\n}]*)',s); return m.group(2) if m else s[:200]
try:
    cmd({'cmd':'bootstrap','tutorial':'decline','resume':'new'})
    HIDE=".objectives-panel, #notification-container, .notification, #npc-bark-container, .npc-interaction-prompt, .phone-access-button, #health-ui-container, #hud-info-label, #scenario-timer-display, #toggle-buttons-container, #music-widget-btn-anchor, #vm-controls-overlay, #inventory-container { display: none !important; }"
    hide="() => { if (!document.getElementById('shot-hide-hud')) { const st = document.createElement('style'); st.id = 'shot-hide-hud'; st.textContent = %s; document.head.appendChild(st); } return 1; }" % json.dumps(HIDE)
    close="async () => { const w = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 12; i++) { const m = window.MinigameFramework && window.MinigameFramework.currentMinigame; if (m) { try { window.MinigameFramework.endMinigame(false); } catch (e) {} } await w(250); } return !!(window.MinigameFramework && window.MinigameFramework.currentMinigame); }"
    time.sleep(2); print('briefing open after close:', ev(close))
    tut = "async () => { const w = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 20; i++) { const b = [...document.querySelectorAll('button')].find(x => /figure it out/i.test(x.textContent)); if (b) { b.click(); await w(500); return 'clicked'; } await w(250); } return 'none'; }"
    print('tutorial:', ev(tut)); print('briefing again:', ev(close))
    ev(hide)
    night = json.load(open(os.path.join(HERE,'night_cfg.json'))) if mode=='night' else {}
    if mode=='night':
        ev("() => { const g = window.gameState.globalVariables; g.mission_phase = 'act2_infiltration'; g.clone_call_done = true; g.debrief_played = false; return 1; }")
        ev("() => { window.__nightCfg = %s; return 1; }" % json.dumps(night))
    rooms = rooms_arg or ev("() => Object.keys(window.gameScenario.rooms).join(' ')").split()
    for R in rooms:
        ev(hide)
        fn = ("async () => { const R = %s; window.__R = R; if (!window.rooms[R]) await window.loadRoom(R); const r = window.rooms[R]; if (!r) return 'not-loaded'; const L = window.lightingSystem;"
              " const nc = window.__nightCfg && window.__nightCfg[R]; if (nc && L) { const old = L.rooms.get(R); if (old) old.emitters.forEach(e => { e.glow && e.glow.destroy(); e.leds && e.leds.forEach(l => l.img.destroy()); }); L.rooms.delete(R); L.registerRoom(R, { lighting: nc, npcs: (window.gameScenario.rooms[R] || {}).npcs || [] }); }"
              " if (%s) { const d = window.npcManager && window.npcManager.npcs.get('danny_foster'); if (d && d._sprite) d._sprite.setVisible(true); }"
              " const cam = (L ? L.scene : window.game.scene.scenes[0]).cameras.main; cam.stopFollow(); cam.centerOn(r.position.x + r.map.widthInPixels / 2, r.position.y + r.map.heightInPixels / 2); await new Promise(res => setTimeout(res, 600)); const s = L && L.rooms.get(R); return s ? (s.on ? 'on' : 'off') + ':' + s.mode : 'no-lighting'; }") % (json.dumps(R), 'true' if mode=='night' else 'false')
        res = ev(fn)
        diag = ev("async () => { const L = window.lightingSystem; const a = L && L.lastDraw; await new Promise(r => setTimeout(r, 300)); const sc = L && L.scene; const st = L && L.rooms.get(window.__R); return 'amb=' + (st ? st.litAmbient.toString(16) + '/' + st.darkAmbient.toString(16) + ' lv=' + st.level + ' panels=' + st.panels.length + ' extra=' + st.extraLights.length : 'none') + ' rt=' + (L ? [L.lightMap.visible, L.lightMap.alpha, L.lightMap.depth, Math.round(L.lightMap.x), Math.round(L.lightMap.y)].join(',') : '') + ' draw+' + (L ? Math.round(L.lastDraw - a) : 'x') + ' active=' + (sc ? sc.sys.isActive() : 'x') + ' mg=' + !!(window.MinigameFramework && window.MinigameFramework.currentMinigame) + ' modal=' + [...document.querySelectorAll('button')].filter(b => b.offsetParent && /figure it out|show me/i.test(b.textContent)).length; }")
        res = res + ' ' + diag
        cmd({'cmd':'screenshot','path':f'{out}/{R}-a.png'})
        if res.startswith('off'):
            ev("async () => { window.lightingSystem.switchOn(%s, { animate: false }); await new Promise(r => setTimeout(r, 400)); return 1; }" % json.dumps(R))
            cmd({'cmd':'screenshot','path':f'{out}/{R}-b.png'})
            ev("() => { window.lightingSystem.switchOff(%s); return 1; }" % json.dumps(R))
        print(R, res, flush=True)
finally:
    subprocess.run(['tools/playtest/session-stop.sh',gid],capture_output=True)
