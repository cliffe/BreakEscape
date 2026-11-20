/**
 * VM Launcher Minigame
 * 
 * Displays available VMs and allows launching console connections.
 * Works in two modes:
 * - Hacktivity mode: Downloads SPICE console files via ActionCable
 * - Standalone mode: Shows VirtualBox instructions
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { makeDraggable } from '../../utils/helpers.js';
import { escapeHtml } from '../../utils/escape-html.js';

/**
 * The server's VM panel URL, or null when it is not one the launcher may use. It lands in
 * an iframe src and an href, so it must parse as http or https and resolve to the page's
 * own origin (the server sends /break_escape/games/<id>/vm_panel). That one test covers
 * javascript:, data:, protocol-relative //host, /\host, http:host and any absolute URL on
 * another host or a user:pass@ part. The parsed href is returned, so the iframe, the link and this check all
 * use the same parse. With no page origin to compare against, everything is refused.
 */
export function safeVmPanelUrl(raw, base = (typeof window !== 'undefined' ? window.location?.href : undefined)) {
    if (typeof raw !== 'string' || !base) return null;
    const text = raw.trim();
    if (!text) return null;
    let parsed;
    let origin;
    try {
        parsed = new URL(text, base);
        origin = new URL(base).origin;
    } catch (e) {
        return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.origin !== origin) return null;
    return parsed.href;
}

/** The panel URL with ?vm_title= (or &vm_title=) added in the query, ahead of any fragment. */
export function vmPanelUrlWithTitle(panelUrl, title) {
    if (!title) return panelUrl;
    const url = new URL(panelUrl);
    url.searchParams.set('vm_title', title);
    return url.href;
}

export class VmLauncherMinigame extends MinigameScene {
    // The X sits inside the themed frame, not on its border (critique A26, A30)
    static closeInsideFrame = true;
    constructor(container, params) {
        super(container, params);
        this.vm = params.vm || null;
        this.hacktivityMode = params.hacktivityMode || false;
        this.gameId = params.gameId || window.breakEscapeConfig?.gameId || window.gameConfig?.gameId;
        this.isLaunching = false;
        const rawPanelUrl = window.breakEscapeConfig?.vmPanelUrl;
        this.vmPanelUrl = safeVmPanelUrl(rawPanelUrl);
        // A panel URL was sent but refused: a misconfigured server. Say so by length only.
        this.vmPanelRefused = !this.vmPanelUrl && typeof rawPanelUrl === 'string' && rawPanelUrl.trim() !== '';
        if (this.vmPanelRefused) {
            console.warn(`VM launcher: refused the server's VM panel URL (${rawPanelUrl.length} characters)`);
        }
        // D144: the session's VM set was handed back. The panel, IPs and console are all hidden.
        this.vmSetReleased = this.hacktivityMode && window.breakEscapeConfig?.vmSetState === 'released';
        this.postitNote = params.postitNote || '';
        // Optional one-line scenario note shown under the VM steps (where the flags go back to).
        this.flagNote = typeof params.flagNote === 'string' ? params.flagNote : '';
        this.showPostit = params.showPostit || false;
    }

    // The X sits at the top right of the device frame, like the patch panel and rogue AP
    closeAnchor() {
        return this.frame || this.gameContainer;
    }

    // Footer buttons (Add to Notepad) go inside the frame, so it wraps them
    controlsHost() {
        return this.frame || null;
    }

    /**
     * The shared device frame (css/device-frame.css): title row with the device name, then the
     * launcher content. Made once, on first use, so buildUI also works when called on its own.
     * The name is plain text (textContent).
     */
    ensureFrame() {
        if (this.frame) return this.frame;
        const frame = document.createElement('div');
        frame.className = 'device-frame vm-launcher-frame';
        const title = document.createElement('div');
        title.className = 'device-frame-title vm-launcher-title-row';
        const name = document.createElement('span');
        name.className = 'vm-launcher-title';
        name.textContent = this.params?.title || 'VM Console Access';
        title.appendChild(name);
        frame.appendChild(title);
        this.gameContainer.appendChild(frame);
        this.frame = frame;
        return frame;
    }

    init() {
        this.params.title = this.params.title || 'VM Console Access';
        this.params.cancelText = 'Close';
        super.init();
        this.container.classList?.add('vm-launcher-minigame');
        // The device frame carries its own title row
        if (this.headerElement?.style) this.headerElement.style.display = 'none';
        this.ensureFrame();

        // Add notebook button to minigame controls if postit note exists
        const controls = (this.showPostit && this.postitNote) ? this.ensureControlsRow() : null;
        if (controls) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook-postit';
            const notebookIcon = document.createElement('img');
            notebookIcon.setAttribute('src', '/break_escape/assets/icons/notes.png');
            notebookIcon.setAttribute('alt', 'Notepad');
            notebookIcon.className = 'icon-small notepad-btn-icon';
            notebookBtn.appendChild(notebookIcon);
            notebookBtn.appendChild(document.createTextNode(' Add to Notepad'));
            controls.insertBefore(notebookBtn, controls.firstChild);
        }

        this.buildUI();
    }
    
    buildUI() {
        // Reaching the launcher in-game is what unlocks the console in Hacktivity mode: tell
        // the server now, before the panel needs the console token, so the VM's console is set
        // to its default (attack VMs on, "*server*" targets stay locked). Non-blocking and
        // idempotent server-side; the vm_panel endpoint re-checks when the iframe loads.
        // Standalone mode never calls it.
        if (this.hacktivityMode && !this.vmSetReleased) {
            this.requestConsoleUnlock();
        }

        // Re-enabled: root causes fixed — user_not_authorized now uses root_path (not
        // request.referrer), vm_panel? policy includes admin check, and main.js has an
        // iframe guard preventing re-initialisation if the game page ever loads in a frame.
        const frame = this.ensureFrame();
        if (this.hacktivityMode && this.vmPanelUrl && !this.vmSetReleased) {
            frame.classList.add('vm-launcher-frame-iframe');
            const iframeSrc = vmPanelUrlWithTitle(this.vmPanelUrl, this.vm?.title);
            const launcher = document.createElement('div');
            launcher.className = 'vm-launcher vm-launcher-iframe';
            const iframe = document.createElement('iframe');
            iframe.src = iframeSrc;
            iframe.title = 'VM Controls';
            launcher.appendChild(iframe);
            frame.appendChild(launcher);
            if (this.showPostit && this.postitNote) {
                const postit = document.createElement('div');
                // Overlay on top of the iframe in the bottom-left corner (css/vm-launcher-minigame.css)
                postit.className = 'postit-note vm-postit-overlay';
                postit.textContent = this.postitNote;
                makeDraggable(postit);
                frame.appendChild(postit);
            }
            this.settleControls();
            this.attachEventHandlers();
            return;
        }

        // Styles live in css/vm-launcher-minigame.css (loaded by show.html.erb)
        
        // Build main container
        const launcher = document.createElement('div');
        launcher.className = 'vm-launcher';
        
        if (this.vmSetReleased) {
            launcher.appendChild(this.buildReleasedMessage());
        } else if (!this.vm) {
            launcher.appendChild(this.buildNoVmMessage());
        } else {
            launcher.appendChild(this.buildVmDisplay());
        }
        
        launcher.classList.add('pixel-scroll');
        frame.appendChild(launcher);

        // Postit note
        if (this.showPostit && this.postitNote) {
            const postit = document.createElement('div');
            postit.className = 'postit-note';
            postit.textContent = this.postitNote;
            makeDraggable(postit);
            frame.appendChild(postit);
        }

        this.settleControls();
        this.attachEventHandlers();
    }
    
    /** The footer row (Add to Notepad) goes last in the frame, under the content and the post-it. */
    settleControls() {
        if (this.controlsElement && this.frame && this.controlsElement.parentNode === this.frame) {
            this.frame.appendChild(this.controlsElement);
        }
    }

    /**
     * The VM set was handed back (D144). Fixed text, no VM title or IP, and a link only to the
     * host's menu (else its return page), each only if same-origin. Built with createElement and
     * textContent (engine text rule); returns the element.
     */
    buildReleasedMessage() {
        const cfg = window.breakEscapeConfig;
        const back = safeVmPanelUrl(cfg?.shellMenuUrl) || safeVmPanelUrl(cfg?.shellReturnUrl);
        const box = document.createElement('div');
        box.className = 'no-vms-message vm-released';
        const add = (tag, text) => {
            const el = document.createElement(tag);
            el.textContent = text;
            box.appendChild(el);
        };
        add('h4', 'VMs released');
        add('p', 'The VMs for this session have been released. Your progress is kept.');
        add('p', 'To keep hacking, start the mission again from the mission page.');
        if (back) {
            const row = document.createElement('div');
            row.className = 'vm-actions';
            const a = document.createElement('a');
            a.className = 'vm-action-btn';
            a.textContent = 'Back to missions';
            a.href = back;
            row.appendChild(a);
            box.appendChild(row);
        }
        return box;
    }

    /**
     * Small DOM helper (engine text rule: createElement, textContent, setAttribute; no innerHTML).
     * attrs: className plus any other attribute name; children: nodes appended in order.
     */
    el(tag, className, text, attrs, children) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        if (attrs) {
            for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        }
        if (children) {
            for (const c of children) node.appendChild(c);
        }
        return node;
    }

    /** Returns the "no VM" message element. */
    buildNoVmMessage() {
        if (this.hacktivityMode) {
            return this.el('div', 'no-vms-message', undefined, null, [
                this.el('h4', null, 'No VM Available'),
                this.el('p', null, 'No virtual machine is configured for this terminal.'),
                this.el('p', null, 'Please provision VMs through Hacktivity first.')
            ]);
        }
        return this.el('div', 'no-vms-message standalone-mode', undefined, null, [
            this.el('h2', null, 'VM Terminal'),
            this.el('p', null, 'This terminal connects to a virtual machine. To use it, start the virtual machine on your own computer.')
        ]);
    }

    /** Returns a DocumentFragment holding the VM display (appended straight into .vm-launcher). */
    buildVmDisplay() {
        const frag = document.createDocumentFragment();
        const hasConsole = this.vm.enable_console !== false;
        const statusClass = hasConsole ? 'console' : 'online';
        const statusText = hasConsole ? 'Console' : 'Active';
        let intro = 'This terminal connects to a virtual machine. To use it, ';

        if (this.hacktivityMode && this.vmPanelRefused) {
            intro += 'you need its VM console, which is not available.';
        } else if (this.hacktivityMode) {
            intro += 'click the console button below to open your VM in a new tab.';
        } else {
            intro += 'you need to launch the virtual machine on your local system.';
        }
        frag.appendChild(this.el('p', null, intro));

        const card = this.el('div', 'vm-card', undefined, null, [
            this.el('div', 'vm-header', undefined, null, [
                this.el('span', 'vm-title', this.vm.title),
                this.el('span', 'vm-status ' + statusClass, statusText)
            ])
        ]);
        if (this.vm.ip) {
            card.appendChild(this.el('div', 'vm-ip-display', undefined, null, [
                this.el('span', 'vm-detail-label', 'IP Address:'),
                this.el('span', 'vm-ip-value', this.vm.ip)
            ]));
        }
        frag.appendChild(card);

        if (this.hacktivityMode && this.vmPanelUrl) {
            const consoleSrc = vmPanelUrlWithTitle(this.vmPanelUrl, this.vm?.title);
            frag.appendChild(this.el('div', 'vm-actions', undefined, null, [
                this.el('a', 'vm-action-btn', 'Open VM Console: ' + (this.vm?.title ?? ''),
                    { href: consoleSrc, target: '_blank', rel: 'noopener noreferrer' })
            ]));
            // DISABLED: ActionCable SPICE download approach (a #launch-console-btn button plus a
            // #launch-status div). The markup is gone; the handler and launchConsole() are kept
            // commented out in attachEventHandlers for re-enablement (rebuild the button with el()).
        } else if (this.hacktivityMode && this.vmPanelRefused) {
            // Not the VirtualBox steps: in Hacktivity the VM runs on the server, not locally
            frag.appendChild(this.el('div', 'vm-actions vm-panel-unavailable', undefined, null, [
                this.el('p', null, 'VM panel unavailable.')
            ]));
        } else if (this.vm.ip) {
            // Standalone mode: show connection instructions
            const steps = [
                ['1. Start your VM in VirtualBox: ', this.vm.title],
                ['2. Connect via SSH or VNC to: ', this.vm.ip]
            ].map(([label, value]) => {
                const p = this.el('p', null, label);
                p.appendChild(this.el('code', null, value));
                return p;
            });
            frag.appendChild(this.el('div', 'standalone-instructions', undefined, null, [
                this.el('h4', null, 'Connection Instructions'),
                ...steps,
                this.el('p', null, '3. Complete the challenges and capture flags')
            ]));
        }

        if (this.flagNote.trim() !== '') {
            frag.appendChild(this.el('div', 'vm-flag-note', undefined, null, [
                this.el('p', null, this.flagNote)
            ]));
        }

        return frag;
    }

    

    attachEventHandlers() {
        const notebookBtn = document.getElementById('minigame-notebook-postit');
        if (notebookBtn) {
            this.addEventListener(notebookBtn, 'click', () => this.addPostitToNotebook());
        }
        // DISABLED: ActionCable launch button handler preserved below for re-enablement.
        // const launchBtn = this.gameContainer.querySelector('#launch-console-btn');
        // if (launchBtn) {
        //     this.addEventListener(launchBtn, 'click', () => this.launchConsole());
        // }
    }

    addPostitToNotebook() {
        if (!this.postitNote || this.postitNote.trim() === '') {
            this.showFailure("No postit note to add.", false, 2000);
            return;
        }

        const deviceName = this.params.title || this.vm?.title || 'VM Terminal';
        const notebookTitle = `Postit Note - ${deviceName}`;
        let notebookContent = `Postit Note:\n${'-'.repeat(20)}\n\n${this.postitNote}`;
        notebookContent += `\n\n${'='.repeat(20)}\nVM TERMINAL: ${deviceName}\n${'='.repeat(20)}`;
        notebookContent += `\nDate: ${new Date().toLocaleString()}`;

        if (window.startNotesMinigame) {
            const postitItem = {
                scenarioData: {
                    type: 'postit_note',
                    name: notebookTitle,
                    text: notebookContent,
                    observations: 'Postit note found on VM terminal.',
                    important: true
                }
            };
            window.startNotesMinigame(postitItem, notebookContent, 'Postit note found on VM terminal.', null, false, true);
            this.showSuccess("Added postit note to notepad", false, 2000);
        } else {
            this.showFailure("Notepad not available", false, 2000);
        }
    }

    // DISABLED: launchConsole preserved for re-enablement once ActionCable
    // SPICE download approach is re-integrated.
    //
    // async launchConsole() {
    //     if (!this.vm || this.isLaunching) return;
    //     this.isLaunching = true;
    //     const launchBtn = this.gameContainer.querySelector('#launch-console-btn');
    //     const statusEl = this.gameContainer.querySelector('#launch-status');
    //     const vmCard = this.gameContainer.querySelector('.vm-card');
    //     launchBtn.disabled = true;
    //     launchBtn.classList.add('launching');
    //     launchBtn.textContent = 'Connecting...';
    //     vmCard.classList.add('launching');
    //     statusEl.className = 'launch-status loading';
    //     statusEl.textContent = 'Requesting console file...';
    //     try {
    //         if (window.hacktivityCable) {
    //             const result = await window.hacktivityCable.requestConsoleFile(
    //                 this.vm.id,
    //                 this.vm.event_id
    //             );
    //             if (result.success) {
    //                 window.hacktivityCable.downloadConsoleFile({
    //                     filename: result.filename,
    //                     content: result.content,
    //                     contentType: result.contentType
    //                 });
    //                 statusEl.className = 'launch-status success';
    //                 statusEl.textContent = '✓ Console file downloaded! Open it with a SPICE viewer.';
    //             }
    //         } else {
    //             throw new Error('ActionCable not available');
    //         }
    //     } catch (error) {
    //         console.error('[VmLauncher] Launch failed:', error);
    //         statusEl.className = 'launch-status error';
    //         statusEl.textContent = `✗ Failed: ${error.message}`;
    //     } finally {
    //         this.isLaunching = false;
    //         launchBtn.disabled = false;
    //         launchBtn.classList.remove('launching');
    //         launchBtn.textContent = `Open Console: ${this.vm.title}`;
    //         vmCard.classList.remove('launching');
    //     }
    // }
    
    getCsrfToken() {
        const meta = (typeof document !== 'undefined')
            ? document.querySelector('meta[name="csrf-token"]')
            : null;
        return meta ? meta.getAttribute('content') : '';
    }

    // Hacktivity mode only: POST to the server so it sets this VM's in-game console to its
    // default now that the player has reached the launcher. The server re-verifies room access
    // and never turns a "*server*" target's console on. Standalone mode and a missing game id
    // are a no-op. Failures are swallowed — the panel still loads and vm_panel re-checks on open.
    async requestConsoleUnlock() {
        if (!this.hacktivityMode || !this.gameId) return;
        let url = `/break_escape/games/${this.gameId}/unlock_vm_console`;
        const title = this.vm?.title;
        if (title) url += `?vm_title=${encodeURIComponent(title)}`;
        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCsrfToken()
                },
                body: '{}'
            });
        } catch (error) {
            console.warn('[VmLauncher] console unlock request failed:', error?.message || error);
        }
    }

    // VM titles, IPs and the console URL are server text: escaped once, quotes
    // included, because the URL lands in an href attribute.
    escapeHtml(str) {
        return escapeHtml(str);
    }
    
    start() {
        super.start();
        console.log('[VmLauncher] Started with VM:', this.vm?.title || 'None');
    }
}

// Register with MinigameFramework
if (window.MinigameFramework) {
    window.MinigameFramework.registerMinigame('vm-launcher', VmLauncherMinigame);
}

export default VmLauncherMinigame;

