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

export class VmLauncherMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        this.vm = params.vm || null;
        this.hacktivityMode = params.hacktivityMode || false;
        this.isLaunching = false;
        this.vmPanelUrl = window.breakEscapeConfig?.vmPanelUrl || null;
        this.postitNote = params.postitNote || '';
        this.showPostit = params.showPostit || false;
    }

    init() {
        this.params.title = this.params.title || 'VM Console Access';
        this.params.cancelText = 'Close';
        super.init();

        // Add notebook button to minigame controls if postit note exists
        if (this.controlsElement && this.showPostit && this.postitNote) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook-postit';
            notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes-sm.png" alt="Notepad" class="icon-small"> Add to Notepad';
            this.controlsElement.insertBefore(notebookBtn, this.controlsElement.firstChild);
        }

        this.buildUI();
    }
    
    buildUI() {
        // Re-enabled: root causes fixed — user_not_authorized now uses root_path (not
        // request.referrer), vm_panel? policy includes admin check, and main.js has an
        // iframe guard preventing re-initialisation if the game page ever loads in a frame.
        if (this.hacktivityMode && this.vmPanelUrl) {
            const iframeSrc = this.vm?.title
                ? `${this.vmPanelUrl}?vm_title=${encodeURIComponent(this.vm.title)}`
                : this.vmPanelUrl;
            const launcher = document.createElement('div');
            launcher.className = 'vm-launcher vm-launcher-iframe';
            const iframe = document.createElement('iframe');
            iframe.src = iframeSrc;
            iframe.title = 'VM Controls';
            launcher.appendChild(iframe);
            this.gameContainer.appendChild(launcher);
            if (this.showPostit && this.postitNote) {
                const postit = document.createElement('div');
                postit.className = 'postit-note';
                // Overlay on top of the iframe in the bottom-left corner
                postit.style.cssText = `
                    position: absolute;
                    left: 20px;
                    z-index: 15;
                    background: #ffff88;
                    border: 1px solid #ddd;
                    padding: 15px;
                    box-shadow: 2px 2px 8px rgba(0,0,0,0.3);
                    transform: rotate(-2deg);
                    font-family: 'Pixelify Sans', 'Comic Sans MS', cursive;
                    font-size: 18px;
                    color: #333;
                    max-width: 200px;
                    word-wrap: break-word;
                    white-space: pre-line;
                    top: 75%;
                `;
                postit.textContent = this.postitNote;
                makeDraggable(postit);
                this.gameContainer.appendChild(postit);
            }
            return;
        }

        // Add custom styles
        const style = document.createElement('style');
        style.textContent = `
            .vm-launcher {
                padding: 15px;
                font-family: 'VT323', 'Courier New', monospace;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .vm-launcher-description {
                color: #888;
                margin-bottom: 15px;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .vm-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .vm-card {
                background: #1a1a1a;
                border: 2px solid #333;
                padding: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .vm-card:hover {
                border-color: #00ff00;
                background: #1f1f1f;
            }
            
            .vm-card.selected {
                border-color: #00ff00;
                background: rgba(0, 255, 0, 0.1);
            }
            
            .vm-card.launching {
                opacity: 0.7;
                cursor: wait;
            }
            
            .vm-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .vm-title {
                color: #00ff00;
                font-size: 16px;
                font-weight: bold;
            }
            
            .vm-status {
                font-size: 12px;
                padding: 3px 8px;
                border-radius: 0;
            }
            
            .vm-status.online {
                background: #00aa00;
                color: #000;
            }
            
            .vm-status.offline {
                background: #aa0000;
                color: #fff;
            }
            
            .vm-status.console {
                background: #0088ff;
                color: #fff;
            }
            
            .vm-details {
                display: flex;
                gap: 20px;
                font-size: 14px;
                color: #aaa;
            }
            
            .vm-detail-label {
                color: #666;
            }
            
            .vm-ip {
                font-family: 'Courier New', monospace;
                color: #ffaa00;
            }
            
            .vm-ip-display {
                background: rgba(255, 170, 0, 0.1);
                border: 1px solid #ffaa00;
                padding: 12px 15px;
                margin-top: 10px;
                text-align: center;
            }
            
            .vm-ip-display .vm-detail-label {
                display: block;
                color: #888;
                font-size: 12px;
                margin-bottom: 5px;
            }
            
            .vm-ip-value {
                font-family: 'Courier New', monospace;
                font-size: 20px;
                font-weight: bold;
                color: #ffaa00;
                letter-spacing: 1px;
            }
            
            .vm-actions {
                margin-top: 15px;
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            .vm-action-btn {
                background: #00aa00;
                color: #fff;
                border: 2px solid #000;
                padding: 10px 20px;
                font-family: 'Press Start 2P', monospace;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .vm-action-btn:hover:not(:disabled) {
                background: #00cc00;
            }
            
            .vm-action-btn:disabled {
                background: #333;
                color: #666;
                cursor: not-allowed;
            }
            
            .vm-action-btn.launching {
                background: #666;
            }
            
            .launch-status {
                text-align: center;
                padding: 10px;
                margin-top: 10px;
                font-size: 14px;
            }
            
            .launch-status.success {
                color: #00ff00;
            }
            
            .launch-status.error {
                color: #ff4444;
            }
            
            .launch-status.loading {
                color: #ffaa00;
            }
            
            .no-vms-message {
                text-align: center;
                padding: 40px;
                color: #888;
            }
            
            .no-vms-message h4 {
                color: #ffaa00;
                margin-bottom: 15px;
            }

            .vm-launcher-iframe {
                padding: 0;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .vm-launcher-iframe iframe {
                flex: 1;
                width: 1024px;
                height: 80vh;
                min-height: 768px;
                border: none;
                background: #000;
            }

            .standalone-instructions {
                background: #1a1a1a;
                border: 1px solid #333;
                padding: 15px;
                margin-top: 15px;
                font-size: 13px;
                line-height: 1.6;
            }
            
            .standalone-instructions h4 {
                color: #00ff00;
                margin-top: 0;
                margin-bottom: 10px;
            }
            
            .standalone-instructions code {
                background: #000;
                padding: 2px 6px;
                color: #ffaa00;
            }
            
            .vm-names {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin: 20px 0;
            }

            .vm-name-badge {
                background: #00aa00;
                color: #000;
                padding: 12px 24px;
                font-weight: bold;
                font-size: 16px;
                border: 2px solid #000;
                font-family: 'Courier New', monospace;
            }

            .standalone-instructions h3 {
                color: #00ff00;
                margin-top: 0;
            }

            .standalone-instructions ol {
                margin: 0;
                padding-left: 20px;
            }
            
            .standalone-instructions li {
                margin: 8px 0;
                color: #ccc;
            }
        `;
        this.gameContainer.appendChild(style);
        
        // Build main container
        const launcher = document.createElement('div');
        launcher.className = 'vm-launcher';
        
        if (!this.vm) {
            launcher.innerHTML = this.buildNoVmMessage();
        } else {
            launcher.innerHTML = this.buildVmDisplay();
        }
        
        this.gameContainer.appendChild(launcher);

        // Postit note
        if (this.showPostit && this.postitNote) {
            const postit = document.createElement('div');
            postit.className = 'postit-note';
            postit.textContent = this.postitNote;
            makeDraggable(postit);
            this.gameContainer.appendChild(postit);
        }

        this.attachEventHandlers();
    }
    
    buildNoVmMessage() {
        if (this.hacktivityMode) {
            return `
                <div class="no-vms-message">
                    <h4>No VM Available</h4>
                    <p>No virtual machine is configured for this terminal.</p>
                    <p>Please provision VMs through Hacktivity first.</p>
                </div>
            `;
        } else {
            return `
                <div class="no-vms-message standalone-mode">
                    <h2>VM Terminal</h2>
                    <p>You've discovered a computer terminal in the game. To interact with it, you need to launch the virtual machine on your local system.</p>

                </div>
            `;
        }
    }
    
    buildVmDisplay() {
        const hasConsole = this.vm.enable_console !== false;
        const statusClass = hasConsole ? 'console' : 'online';
        const statusText = hasConsole ? 'Console' : 'Active';
        let html = `<p>You've discovered a computer terminal in the game. To interact with it, `;

        if (this.hacktivityMode) {
            html += `
                click the console button below to open your VM in a new tab.</p>
            `;
        } else {
            html += `
                you need to launch the virtual machine on your local system.</p>
            `;
        }
        
        html += `
            <div class="vm-card">
                <div class="vm-header">
                    <span class="vm-title">${this.escapeHtml(this.vm.title)}</span>
                    <span class="vm-status ${statusClass}">${statusText}</span>
                </div>
                ${this.vm.ip ? `
                    <div class="vm-ip-display">
                        <span class="vm-detail-label">IP Address:</span>
                        <span class="vm-ip-value">${this.escapeHtml(this.vm.ip)}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        if (this.hacktivityMode && this.vmPanelUrl) {
            const consoleSrc = this.vm?.title
                ? `${this.vmPanelUrl}?vm_title=${encodeURIComponent(this.vm.title)}`
                : this.vmPanelUrl;
            html += `
                <div class="vm-actions">
                    <a class="vm-action-btn" href="${this.escapeHtml(consoleSrc)}" target="_blank" rel="noopener noreferrer">
                        Open VM Console: ${this.escapeHtml(this.vm.title)}
                    </a>
                </div>
            `;
            // DISABLED: ActionCable SPICE download approach — preserved for re-enablement.
            // html += `
            //     <div class="vm-actions">
            //         <button class="vm-action-btn" id="launch-console-btn">
            //             Open Console: ${this.escapeHtml(this.vm.title)}
            //         </button>
            //     </div>
            //     <div class="launch-status" id="launch-status"></div>
            // `;
        } else if (this.vm.ip) {
            // Standalone mode: show connection instructions
            html += `
                <div class="standalone-instructions">
                    <h4>Connection Instructions</h4>
                    <p>1. Start your VM in VirtualBox: <code>${this.escapeHtml(this.vm.title)}</code></p>
                    <p>2. Connect via SSH or VNC to: <code>${this.escapeHtml(this.vm.ip)}</code></p>
                    <p>3. Complete the challenges and capture flags</p>
                </div>
            `;
        }
        
        return html;
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
            window.startNotesMinigame(postitItem, notebookContent, 'Postit note found on VM terminal.', null, false, false);
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
    
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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

