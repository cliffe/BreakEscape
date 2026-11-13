/**
 * The taskbar along the bottom of a PC's screen and its start panel (UX slice 6, start menu
 * option C, user pick q93). One module for every view of a PC in the monitor frame: the
 * desktop, a share's folder window opened from it and a file read from either, so the
 * signed-in account stays in view while a window is open (critique E11) and the panel's
 * Places lead back to the desktop.
 *
 * The taskbar: Start, the open window's name (a share or a file), the account (headshot and
 * name), the computer name, and Take Container where the container is takeable.
 * The start panel: the account (headshot, name, username), This PC (computer name, PC name,
 * the remote link), Places (Desktop and the shares mapped on the desktop), then Lock, Switch
 * user and Sign out for a sign-in session. Lock shows only once the server reports that it
 * supports it (pcSessions.lockSupported and pcSessions.lock).
 *
 * Who shows (q94, agreed with the data owner): a sign-in PC shows its live session's account
 * and never `desktopUser`; a PC that opens straight to its desktop shows `desktopUser` when
 * set, else no account. Nothing here is drawn on a lock or password screen.
 *
 * Client display only: nothing here is synced. Headshot lookups and each desktop's Places are
 * kept in memory, one entry per account and per PC.
 */
import { escapeHtml } from './escape-html.js';
import { displayDashes } from './display-dashes.js';
import { applyHeadshotBox, npcRecordFor, headshotSourceFor } from './npc-headshot.js';

const ICONS = '/break_escape/assets/icons';
export const PC_SILHOUETTE_URL = `${ICONS}/pc-user-silhouette.png`;
export const PC_TASKBAR_ICONS = Object.freeze({
    start: `${ICONS}/pc-start.png`,
    desktop: `${ICONS}/pc-desktop.png`,
    lock: `${ICONS}/npc-lock.png`,
    switch: `${ICONS}/pc-switch-user.png`,
    signout: `${ICONS}/pc-sign-out.png`
});
/** The share folder (26x18), as on the desktop. */
export const PC_PLACE_SHARE_ICON = '/break_escape/assets/objects/m09_folder1.png';

const ACTION_LABELS = Object.freeze({ lock: 'Lock', switch: 'Switch user', signout: 'Sign out' });

const win = () => (typeof window !== 'undefined' ? window : {});

/** A PC object as the scenario defines it, by id, from the loaded rooms; or null. */
export function findPcData(pcId, scenario = win().gameScenario) {
    if (!pcId) return null;
    const rooms = scenario?.rooms || {};
    for (const room of Object.values(rooms)) {
        const found = (Array.isArray(room?.objects) ? room.objects : []).find(o => o?.id === pcId);
        if (found) return found;
    }
    return null;
}

/** A PC's `desktopUser` when it is well formed ({ name, character? }), else null. */
export function desktopUserOf(pcData) {
    const du = pcData?.desktopUser;
    if (!du || typeof du !== 'object' || typeof du.name !== 'string' || !du.name.trim()) return null;
    const character = typeof du.character === 'string' && du.character.trim() ? du.character.trim() : null;
    return { name: du.name.trim(), character };
}

/** The computer name: a remote session's host label, else the PC's `host`, else its name. */
export function pcHostName(pcData, session = null) {
    if (session?.remote === true && typeof session.host === 'string' && session.host) return session.host;
    if (typeof pcData?.host === 'string' && pcData.host.trim()) return pcData.host.trim();
    return typeof pcData?.name === 'string' ? pcData.name : '';
}

/**
 * What the taskbar and the panel show, from the PC, its session and the desktop's shares.
 *   -> { signIn, account, host, pcName, remote, linkName, places, actions }
 * `account` is { kind: 'session', name, username, npcId, claimed } or
 * { kind: 'desktopUser', name, character } or null.
 */
export function pcTaskbarModel({ pcData = null, session = null, remote = false, linkName = null, places = [], lockSupported = false } = {}) {
    const signIn = pcData?.lockType === 'login' || !!session;
    let account = null;
    if (signIn) {
        if (session) {
            account = {
                kind: 'session',
                name: session.displayName || session.username || '',
                username: session.username || '',
                npcId: session.npcId || null,
                claimed: session.via === 'claim'
            };
        }
    } else {
        const du = desktopUserOf(pcData);
        if (du) account = { kind: 'desktopUser', name: du.name, character: du.character };
    }
    const isRemote = !!remote || session?.remote === true;
    const actions = signIn && session ? [...(lockSupported ? ['lock'] : []), 'switch', 'signout'] : [];
    return {
        signIn,
        account,
        host: pcHostName(pcData, session),
        pcName: typeof pcData?.name === 'string' ? pcData.name : '',
        remote: isRemote,
        linkName: isRemote ? (linkName || 'your link') : null,
        places: (Array.isArray(places) ? places : []).filter(p => p && p.id),
        actions
    };
}

/** Lock is offered only when the server reports it and the client can ask for it. */
export function lockSupported(sessions = win().pcSessions) {
    return sessions?.lockSupported === true && typeof sessions?.lock === 'function';
}

const shareName = (item) => {
    const raw = String(item?.name || '');
    // "Scanned-Inbox (\\HB-FS01\Scanned-Inbox)" -> the part before the UNC path
    const cut = raw.indexOf(' (\\\\');
    return cut > 0 ? raw.slice(0, cut) : raw;
};

/** The taskbar's HTML. `windowTitle` names the open share or file; `takeable` adds Take Container. */
export function pcTaskbarHtml(model, { windowTitle = '', takeable = false } = {}) {
    const m = model || pcTaskbarModel();
    const name = m.account ? escapeHtml(displayDashes(m.account.name)) : '';
    const account = m.account ? `
        <span class="pc-taskbar-account" title="${name}">
            <span class="pc-headshot pc-taskbar-headshot" aria-hidden="true"></span>
            <span class="pc-taskbar-name">${name}</span>
        </span>` : '';
    const win = windowTitle ? `
        <span class="pc-taskbar-window" title="${escapeHtml(displayDashes(windowTitle))}">${escapeHtml(displayDashes(windowTitle))}</span>` : '';
    return `<div class="pc-taskbar" role="toolbar" aria-label="Taskbar">
        <button type="button" class="pc-os-btn pc-start-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="pc-start-panel"><img class="pc-start-icon" src="${PC_TASKBAR_ICONS.start}" alt=""><span>Start</span></button>${win}
        <span class="pc-taskbar-spacer"></span>${account}
        ${m.remote ? '<span class="pc-taskbar-remote">Remote</span>' : ''}<span class="pc-taskbar-host">${escapeHtml(displayDashes(m.host))}</span>
        ${takeable ? '<button class="minigame-button" id="take-container-btn">Take Container</button>' : ''}
    </div>`;
}

/** The start panel's HTML (hidden until Start opens it). */
export function pcStartPanelHtml(model, { shareIcon = PC_PLACE_SHARE_ICON } = {}) {
    const m = model || pcTaskbarModel();
    const a = m.account;
    const account = a ? `
        <div class="pc-start-account">
            <span class="pc-headshot pc-start-headshot" aria-hidden="true"></span>
            <span class="pc-start-who">
                <span class="pc-start-name">${escapeHtml(displayDashes(a.name))}</span>${a.kind === 'session' && a.username ? `
                <span class="pc-start-username">${escapeHtml(a.username)}</span>` : ''}
            </span>
        </div>` : '';
    const lines = [m.host, m.pcName && m.pcName !== m.host ? m.pcName : '']
        .filter(Boolean).map(t => `<span class="pc-start-line">${escapeHtml(displayDashes(t))}</span>`).join('');
    const remote = m.remote ? `<span class="pc-start-line pc-start-remote">Remote through ${escapeHtml(displayDashes(m.linkName))}</span>` : '';
    const item = (attrs, icon, label, cls = '') => `
            <button type="button" role="menuitem" class="pc-start-item${cls}" ${attrs}><img class="pc-start-item-icon" src="${icon}" alt=""><span>${label}</span></button>`;
    const places = [item('data-place="desktop"', PC_TASKBAR_ICONS.desktop, 'Desktop')]
        .concat(m.places.map((p, i) => item(`data-place="share" data-place-index="${i}" data-resource-id="${escapeHtml(p.id)}"`,
            escapeHtml(p.iconImage || shareIcon), escapeHtml(displayDashes(shareName(p))), ' pc-start-share')))
        .join('');
    const actions = m.actions.length ? `
        <div class="pc-start-actions">${m.actions.map(k => item(`data-action="${k}" id="pc-start-${k}"`, PC_TASKBAR_ICONS[k], ACTION_LABELS[k])).join('')}
        </div>` : '';
    return `<div class="pc-start-panel pixel-scroll" id="pc-start-panel" role="menu" aria-label="Start" hidden>${account}
        <div class="pc-start-section">
            <span class="pc-start-heading">This PC</span>${lines}${remote}
        </div>
        <div class="pc-start-section pc-start-places">
            <span class="pc-start-heading">Places</span>${places}
        </div>${actions}
    </div>`;
}

// ── Headshots (cached in memory, never synced) ───────────────────────────────

const headshotCache = new Map();

/** Forget the cached headshot lookups (tests). */
export function resetTaskbarHeadshots() {
    headshotCache.clear();
}

/** How many accounts have a cached headshot lookup (tests). */
export function taskbarHeadshotCount() {
    return headshotCache.size;
}

const talkUrlOf = (record) => {
    const talk = typeof record?.spriteTalk === 'string' ? record.spriteTalk : '';
    if (!talk) return null;
    return /^(\/|https?:|data:)/.test(talk) ? talk : `/break_escape/${talk.startsWith('assets/') ? '' : 'assets/'}${talk}`;
};

function paint(el, result, scale) {
    if (!el?.style) return;
    if (!result) {
        el.style.backgroundImage = `url("${PC_SILHOUETTE_URL}")`;
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundSize = `${32 * scale}px ${32 * scale}px`;
        el.style.backgroundPosition = '0px 0px';
        el.dataset.frame = 'silhouette';
        el.hidden = false;
        return;
    }
    el.style.backgroundImage = `url("${result.src}")`;
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = `${result.width * scale}px ${result.height * scale}px`;
    el.style.backgroundPosition = `${result.left * scale}px ${result.top * scale}px`;
    el.dataset.frame = result.kind;
    if (result.key) el.dataset.headshot = result.key;
    el.hidden = false;
}

/**
 * The account's picture in a box at a whole-number `scale` (1 in the taskbar's 32px box, 2 in
 * the panel's 64px one): the authored headshot, else the talk sheet's head crop (as the sign-in
 * tiles), else the pixel silhouette. One lookup per account, kept for the next view.
 */
export function applyAccountPicture(el, account, { scale = 1, ImageCtor } = {}) {
    if (!el || !account) return;
    const record = account.kind === 'session' ? npcRecordFor({ npcId: account.npcId, username: account.username }) : null;
    const source = account.kind === 'session' ? headshotSourceFor({}, record) : { spriteSheet: account.character || null };
    const key = account.kind === 'session' ? `s:${account.npcId || account.username}` : `d:${account.character || account.name}`;
    const waiting = new Set();
    if (headshotCache.has(key)) {
        const kept = headshotCache.get(key);
        if (kept && kept.pending) { kept.pending.add({ el, scale }); return; }
        paint(el, kept, scale);
        return;
    }
    waiting.add({ el, scale });
    headshotCache.set(key, { pending: waiting });
    const finish = (result) => {
        headshotCache.set(key, result);
        waiting.forEach(w => paint(w.el, result, w.scale));
    };
    const box = { style: {}, dataset: {}, hidden: true };
    const options = {
        talkUrl: account.kind === 'session' ? talkUrlOf(record) : null,
        onResult: (r) => finish(r ? { ...r, key: box.dataset.headshot || null } : null)
    };
    if (ImageCtor !== undefined) options.ImageCtor = ImageCtor;
    applyHeadshotBox(box, source, options);
}

// ── Places kept per PC (the desktop's mapped shares, for its other views) ────────

const desktops = new Map();

/** Keep a desktop's lockable and its mapped shares for the PC's other views (share, file). */
export function rememberDesktop(pcId, { containerItem = null, places = [] } = {}) {
    if (!pcId) return;
    desktops.set(pcId, { containerItem, places: (Array.isArray(places) ? places : []).filter(p => p && p.id) });
}

/** The kept desktop of a PC, or null. */
export function rememberedDesktop(pcId) {
    return pcId ? (desktops.get(pcId) || null) : null;
}

/** Forget the kept desktops (tests). */
export function resetRememberedDesktops() {
    desktops.clear();
}

// ── Mounting ─────────────────────────────────────────────────────────────────

/**
 * Put the taskbar and the start panel at the end of `root` (a positioned element filling the
 * screen) and wire them. Esc closes the open panel and stops there (the PC stays open); a
 * second Esc reaches the minigame's own close. A press outside the panel closes it. The arrow
 * keys move between the panel's entries. `onPlace({ kind: 'desktop' } | { kind: 'share', item })`
 * and `onAction('lock' | 'switch' | 'signout')` run after the panel has closed.
 *   -> { taskbar, panel, open(), close(), isOpen(), destroy() }
 */
export function mountPcTaskbar(root, model, { windowTitle = '', takeable = false, shareIcon, onPlace = () => {}, onAction = () => {}, doc = (typeof document !== 'undefined' ? document : null) } = {}) {
    if (!root || !doc) return null;
    const holder = doc.createElement('div');
    holder.innerHTML = pcStartPanelHtml(model, shareIcon ? { shareIcon } : {}) + pcTaskbarHtml(model, { windowTitle, takeable });
    const panel = holder.querySelector('.pc-start-panel');
    const taskbar = holder.querySelector('.pc-taskbar');
    root.appendChild(panel);
    root.appendChild(taskbar);
    root.classList?.add?.('pc-has-taskbar');
    const start = taskbar.querySelector('.pc-start-btn');

    // The panel's picture at x2, or x1 on a short screen so the panel fits without scrolling
    const panelScale = () => (root.closest?.('.pc-monitor')?.hasAttribute?.('data-short') ? 1 : 2);
    const panelPicture = () => {
        const box = panel.querySelector('.pc-start-headshot');
        if (!box || !model?.account) return;
        const scale = panelScale();
        box.dataset.scale = String(scale);
        applyAccountPicture(box, model.account, { scale });
    };
    if (model?.account) {
        applyAccountPicture(taskbar.querySelector('.pc-taskbar-headshot'), model.account, { scale: 1 });
        panelPicture();
    }

    const items = () => [...panel.querySelectorAll('[role="menuitem"]')];
    let open = false;
    const onKey = (e) => {
        if (!open) return;
        // A panel whose view went away without its cleanup lets go of the keys
        if (!panel.isConnected) { close(); return; }
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();
            if (!e.repeat) { close(); start?.focus?.(); }
            return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const list = items();
            if (!list.length) return;
            e.preventDefault();
            const at = list.indexOf(doc.activeElement);
            const step = e.key === 'ArrowDown' ? 1 : -1;
            list[(at + step + list.length) % list.length].focus();
        }
    };
    const onPress = (e) => {
        if (!open) return;
        if (!panel.isConnected) { close(); return; }
        const t = e.target;
        if (panel.contains(t) || start.contains(t)) return;
        close();
    };
    function show() {
        if (open) return;
        open = true;
        panelPicture();
        panel.hidden = false;
        start.setAttribute('aria-expanded', 'true');
        start.classList.add('pc-start-open');
        doc.addEventListener('keydown', onKey, true);
        doc.addEventListener('pointerdown', onPress, true);
        doc.addEventListener('mousedown', onPress, true);
        items()[0]?.focus?.();
    }
    function close() {
        if (!open) return;
        open = false;
        panel.hidden = true;
        start.setAttribute('aria-expanded', 'false');
        start.classList.remove('pc-start-open');
        doc.removeEventListener('keydown', onKey, true);
        doc.removeEventListener('pointerdown', onPress, true);
        doc.removeEventListener('mousedown', onPress, true);
    }
    start.addEventListener('click', (e) => {
        e.stopPropagation();
        if (open) close(); else show();
    });
    panel.addEventListener('click', (e) => {
        const btn = e.target?.closest?.('[role="menuitem"]');
        if (!btn) return;
        e.stopPropagation();
        close();
        if (btn.dataset.action) { onAction(btn.dataset.action); return; }
        if (btn.dataset.place === 'desktop') { onPlace({ kind: 'desktop' }); return; }
        if (btn.dataset.place === 'share') {
            const item = model?.places?.[Number(btn.dataset.placeIndex)];
            if (item) onPlace({ kind: 'share', item });
        }
    });
    return {
        taskbar,
        panel,
        open: show,
        close,
        isOpen: () => open,
        destroy: close
    };
}
