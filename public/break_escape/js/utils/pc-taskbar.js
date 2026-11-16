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
 * supports locking (pcSessions.lockingSupported() and lockSession), and only for a session
 * the player signed in to with a password: a claimed or guest session could not be unlocked
 * again by a password sign-in, so the server refuses those (422) and the panel hides Lock.
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
import { MORE_BELOW_TEXT } from './more-below.js';
import { applyHeadshotBox, npcRecordFor, headshotSourceFor, SILHOUETTE_URL } from './npc-headshot.js';

const ICONS = '/break_escape/assets/icons';
export const PC_SILHOUETTE_URL = SILHOUETTE_URL;
export const PC_TASKBAR_ICONS = Object.freeze({
    start: `${ICONS}/pc-start.png`,
    desktop: `${ICONS}/pc-desktop.png`,
    lock: `${ICONS}/npc-lock.png`,
    switch: `${ICONS}/pc-switch-user.png`,
    signout: `${ICONS}/pc-sign-out.png`,
    // Keyring K3c: a relay desktop's one way out leaves as Sign out does
    disconnect: `${ICONS}/pc-sign-out.png`
});
/** The share folder (26x18), as on the desktop. */
export const PC_PLACE_SHARE_ICON = '/break_escape/assets/objects/m09_folder1.png';

const ACTION_LABELS = Object.freeze({ lock: 'Lock', switch: 'Switch user', signout: 'Sign out', disconnect: 'Disconnect' });

/**
 * The relay desktop's lines (keyring K3c, plan 8.3 and 8.5; on-screen text, never voiced):
 * the header, the account line (the claim bar's form) and the line where share folders would be.
 */
export const RELAY_HEADER_TEXT = 'Remote assist session';
export const RELAY_NO_SHARES_TEXT = 'Shared drives are not mapped over remote assist.';
export const RELAY_TAG_TEXT = 'Assist';
/** The one-line message a relay desktop closes with after Disconnect. */
export const RELAY_DISCONNECTED_TEXT = 'Disconnected';
export const relayAccountText = (name, username) => `Using ${name || 'the account holder'}'s session${username ? ` (${username})` : ''}`;

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
/**
 * The desktop's second account line for a keyring credential session (K3a 8.1): "with the saved
 * connection {label}". Null for any other session. Plain text: the caller escapes it.
 */
export function credentialSessionLine(session) {
    if (!session || session.via !== 'credential') return null;
    if (session.kind === 'saved_connection') return `with the saved connection ${credentialSessionLabel(session)}`;
    return null;
}

/** The label a credential session shows: its own, else the generic name the sign-in screen uses. */
export function credentialSessionLabel(session) {
    return typeof session?.label === 'string' && session.label.trim() ? session.label : 'Saved connection';
}

/** Full label as the tooltip of each cut-off label span. Set through the DOM, never as markup. */
export function titleCredentialLabels(root) {
    root?.querySelectorAll?.('.credential-label-nowrap').forEach((el) => { el.title = el.textContent; });
}

/**
 * The credential line as safe HTML with the label in a no-break span, so a label such as
 * "HB-FIN-02.rdp" never splits at its hyphen: the line may wrap before the label, not inside it.
 */
export function credentialLineHtml(session) {
    const line = credentialSessionLine(session);
    if (!line) return '';
    const label = credentialSessionLabel(session);
    const lead = line.slice(0, line.length - label.length);
    return `${escapeHtml(displayDashes(lead))}<span class="credential-label-nowrap">${escapeHtml(displayDashes(label))}</span>`;
}

export function pcTaskbarModel({ pcData = null, session = null, remote = false, relay = false, linkName = null, fromHost = null, places = [], lockSupported = false, canLock, canSwitch = true } = {}) {
    // A relay (an assist invite, K3c 8.3): the holder's own session, joined from the inventory
    const isRelay = relay === true || session?.relay === true;
    const signIn = pcData?.lockType === 'login' || !!session;
    let account = null;
    if (signIn) {
        if (session) {
            account = {
                kind: 'session',
                name: session.displayName || session.username || '',
                username: session.username || '',
                npcId: session.npcId || null,
                claimed: session.via === 'claim',
                ...(isRelay ? { relay: true, relayLine: relayAccountText(session.displayName || session.username, session.username) } : {}),
                // A keyring credential session names how it signed in (K3a 8.1)
                ...(credentialSessionLine(session) ? { credentialLine: credentialSessionLine(session), credentialHtml: credentialLineHtml(session) } : {}),
                // The picture's source from the server's session answer, so an NPC whose room is
                // not loaded still has its headshot (fix round 1, M2)
                ...(session.portrait ? { portrait: session.portrait } : {}),
                ...(session.avatar ? { avatar: session.avatar } : {})
            };
        }
    } else {
        const du = desktopUserOf(pcData);
        if (du) account = { kind: 'desktopUser', name: du.name, character: du.character };
    }
    const isRemote = !isRelay && (!!remote || session?.remote === true);
    // pcSessions.canLock is the one rule when the caller has it; without it the same test is made here
    const lockable = lockSupported && session?.guest !== true
        && (typeof canLock === 'boolean' ? canLock : session?.via === 'password');
    // Switch user needs the PC's desktop to come back to; a view with none (a reader reached
    // without the desktop this page load) does not offer it rather than do nothing (R1 m3)
    // A relay has one Disconnect in place of Lock, Switch user and Sign out (8.3)
    const actions = !(signIn && session) ? []
        : (isRelay ? ['disconnect'] : [...(lockable ? ['lock'] : []), ...(canSwitch ? ['switch'] : []), 'signout']);
    return {
        signIn,
        account,
        host: pcHostName(pcData, session),
        pcName: typeof pcData?.name === 'string' ? pcData.name : '',
        remote: isRemote,
        linkName: isRemote ? (linkName || 'your link') : null,
        // K4: a session reached from another desktop names that desktop, not a link
        ...(isRemote && typeof fromHost === 'string' && fromHost ? { fromHost } : {}),
        relay: isRelay,
        // The server maps no share over a relay: none listed, and one line says why
        places: isRelay ? [] : (Array.isArray(places) ? places : []).filter(p => p && p.id),
        actions
    };
}

/** Lock is offered only when the server reports it and the client can ask for it. */
export function lockSupported(sessions = win().pcSessions) {
    return typeof sessions?.lockingSupported === 'function' && sessions.lockingSupported() === true
        && typeof sessions?.lockSession === 'function';
}

/**
 * Lock the PC's held session. The server is asked first; pc-sessions.js closes the PC's
 * views only once it agrees. A refusal is said through `onRefuse(message)` (inside the
 * monitor, R1 m2), else as an alert. Resolves the result ({ ok, ... }).
 */
export async function lockPcSession(pcId, { sessions = win().pcSessions, onRefuse = null } = {}) {
    if (!lockSupported(sessions)) return { ok: false, reason: 'unsupported' };
    const result = await sessions.lockSession(pcId);
    if (result && result.ok === false && result.message) {
        if (typeof onRefuse === 'function') onRefuse(result.message);
        else win().gameAlert?.(result.message, 'warning', 'Lock', 3000);
    }
    return result;
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
    return `<div class="pc-taskbar${takeable ? ' pc-taskbar-takeable' : ''}" role="toolbar" aria-label="Taskbar">
        <button type="button" class="pc-os-btn pc-start-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="pc-start-panel"><img class="pc-start-icon" src="${PC_TASKBAR_ICONS.start}" alt=""><span>Start</span></button>${win}
        <span class="pc-taskbar-spacer"></span>${account}
        ${m.remote ? '<span class="pc-taskbar-remote">Remote</span>' : ''}${m.relay ? `<span class="pc-taskbar-remote pc-taskbar-relay">${RELAY_TAG_TEXT}</span>` : ''}<span class="pc-taskbar-host">${escapeHtml(displayDashes(m.host))}</span>
        ${takeable ? '<button class="minigame-button pc-take-btn" id="take-container-btn" aria-label="Take Container"><span class="pc-take-long" aria-hidden="true">Take Container</span><span class="pc-take-short" aria-hidden="true">Take</span></button>' : ''}
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
                <span class="pc-start-username">${escapeHtml(a.username)}</span>` : ''}${a.relayLine ? `
                <span class="pc-start-relay">${escapeHtml(displayDashes(a.relayLine))}</span>` : ''}${a.credentialLine ? `
                <span class="pc-start-credential">${a.credentialHtml || escapeHtml(displayDashes(a.credentialLine))}</span>` : ''}
            </span>
        </div>` : '';
    const lines = `<span class="pc-start-line pc-start-host">${escapeHtml(displayDashes(m.host))}</span>`
        + (m.pcName && m.pcName !== m.host ? `<span class="pc-start-line pc-start-pcname">${escapeHtml(displayDashes(m.pcName))}</span>` : '');
    const remote = m.remote ? `<span class="pc-start-line pc-start-remote">${m.fromHost ? `Remote from ${escapeHtml(displayDashes(m.fromHost))}` : `Remote through ${escapeHtml(displayDashes(m.linkName))}`}</span>`
        : (m.relay ? `<span class="pc-start-line pc-start-remote pc-start-relay-header">${RELAY_HEADER_TEXT}</span>` : '');
    const noShares = m.relay ? `
            <span class="pc-start-line pc-start-noshares">${RELAY_NO_SHARES_TEXT}</span>` : '';
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
            <span class="pc-start-heading">Places</span>
            <div class="pc-start-places-list pixel-scroll">${places}
            </div>${noShares}
            <div class="pc-start-more" hidden aria-hidden="true"><span class="pc-start-more-arrow"></span><span>${MORE_BELOW_TEXT}</span></div>
        </div>${actions}
    </div>`;
}

/**
 * Show the panel's "More below" strip while the Places list runs past its bottom edge (R3 M1:
 * only Places scrolls, the account, This PC and the actions stay on show). A pixel or two of
 * rounding is not more below. -> whether there is more below
 */
export function updatePlacesCue(list, more) {
    if (!list || !more) return false;
    const below = (list.scrollHeight - list.clientHeight - list.scrollTop) > 2;
    more.hidden = !below;
    return below;
}

/**
 * Whether the Places list is cut short while it shows less than `rows` rows (R3 M1 follow-up):
 * the panel then goes compact (x1 picture, no PC name line) to give the list room before it
 * has to scroll. `rowHeight` is the entry height in CSS px.
 */
export function placesNeedRoom(list, { rows = 3, rowHeight = 24 } = {}) {
    if (!list) return false;
    return list.scrollHeight - list.clientHeight > 2 && list.clientHeight < rows * rowHeight;
}

/**
 * True when the panel's own parts do not fit and it would have to scroll as a whole (a one-place
 * host at a large zoom, a short screen). Compact mode wins back height before that happens.
 */
export function panelOverflows(panel) {
    return !!panel && panel.scrollHeight - panel.clientHeight > 1;
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
 * the panel's 64px one): the authored `<key>_headshot.png`, else the pixel silhouette. The talk
 * image is never cropped (standing rule, R1 m5). One lookup per account, kept for the next view.
 */
export function applyAccountPicture(el, account, { scale = 1, ImageCtor } = {}) {
    if (!el || !account) return;
    const record = account.kind === 'session' ? npcRecordFor({ npcId: account.npcId, username: account.username }) : null;
    const source = account.kind === 'session' ? headshotSourceFor({ portrait: account.portrait || null, avatar: account.avatar || null }, record) : { spriteSheet: account.character || null };
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
    titleCredentialLabels(holder);
    const panel = holder.querySelector('.pc-start-panel');
    const taskbar = holder.querySelector('.pc-taskbar');
    root.appendChild(panel);
    root.appendChild(taskbar);
    root.classList?.add?.('pc-has-taskbar');
    const start = taskbar.querySelector('.pc-start-btn');

    // The panel's picture at x2, or x1 on a short screen so the panel fits without scrolling
    const panelScale = () => (root.closest?.('.pc-monitor')?.hasAttribute?.('data-short') || panel.classList?.contains?.('pc-start-compact') ? 1 : 2);
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

    const placesList = panel.querySelector('.pc-start-places-list');
    const placesMore = panel.querySelector('.pc-start-more');
    const refreshCue = () => updatePlacesCue(placesList, placesMore);
    placesList?.addEventListener?.('scroll', refreshCue);
    const win = doc.defaultView;
    doc.fonts?.ready?.then?.(refreshCue);
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
    // Decide compact (x1 picture, no PC name line) from what fits now: Places cramped by the x2
    // picture and the PC's name line drops to the x1 picture. Run on open and on every resize.
    const refit = () => {
        panel.classList?.remove?.('pc-start-compact');
        panelPicture();
        if (placesNeedRoom(placesList) || panelOverflows(panel)) {
            panel.classList?.add?.('pc-start-compact');
            panelPicture();
        }
        refreshCue();
    };
    // The frame's own resize handler sets data-short; measure again once it has run
    const onResize = () => {
        if (!open) { refreshCue(); return; }
        refit();
        win?.requestAnimationFrame?.(() => { if (open) refit(); });
    };
    win?.addEventListener?.('resize', onResize);
    function show() {
        if (open) return;
        open = true;
        panel.hidden = false;
        refit();
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
    // Tab (or any focus move) out of the panel and Start closes it (R1 nit 1). A null target
    // is the window losing focus or a press on plain wall, which onPress already handles.
    const onFocusOut = (e) => {
        if (!open) return;
        const to = e.relatedTarget;
        if (!to || panel.contains(to) || start.contains(to)) return;
        close();
    };
    panel.addEventListener('focusout', onFocusOut);
    start.addEventListener('focusout', onFocusOut);
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
    // A short line above the taskbar, inside the screen (a refused Lock says why here, R1 m2)
    let noticeTimer = null;
    const notice = (text, ms = 3500) => {
        let line = root.querySelector?.('.pc-taskbar-notice');
        if (!line) {
            line = doc.createElement('div');
            line.className = 'pc-taskbar-notice';
            line.setAttribute('role', 'alert');
            root.appendChild(line);
        }
        line.textContent = String(text || '');
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => line.remove(), ms);
    };
    return {
        taskbar,
        panel,
        notice,
        open: show,
        close,
        isOpen: () => open,
        destroy: () => { close(); clearTimeout(noticeTimer); win?.removeEventListener?.('resize', onResize); }
    };
}
