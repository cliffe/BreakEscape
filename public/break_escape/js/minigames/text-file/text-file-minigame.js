import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml, escapeHtmlKeepWords } from '../../utils/escape-html.js';
import { mountPcMonitor, postitNotebookEntry, pcPostitButtonHtml } from '../../utils/pc-monitor.js';

// File names, types and observations are scenario text: escaped before they reach HTML

/**
 * The notepad entry "Add to Notepad" makes for a text file: the raw file text as the
 * body, and the file name in the title, with its source when the scenario gives one.
 * The body used to be wrapped in a header and footer ("Text File: … FILE CONTENTS: …
 * End of File"), which garbled ciphertext copied from the note (E6).
 * @param {{fileName: string, fileContent: string, source?: string}} data
 * @returns {{title: string, content: string}}
 */
export function textFileNotebookEntry(data) {
    const fileName = data.fileName || 'Unknown File';
    const source = data.source && data.source !== 'Unknown Source' && data.source !== fileName
        ? data.source : null;
    return {
        title: source ? `Text File - ${fileName} (${source})` : `Text File - ${fileName}`,
        content: data.fileContent || ''
    };
}

/**
 * The PC a file was opened from (a desktop or a share's folder window in the PC monitor),
 * as { name, pcId, postitNote }, or null. The desktop puts it on the item it hands over
 * (pcScreen), and the reader passes it on when it comes back from the Notepad. postitNote
 * is the PC's post-it as raw text (escaped by the reader), or null (R4 m2).
 */
export function pcScreenOf(params) {
    const raw = params?.pcScreen || params?.lockable?.pcScreen || null;
    if (!raw || typeof raw !== 'object') return null;
    return {
        name: typeof raw.name === 'string' ? raw.name : '',
        pcId: typeof raw.pcId === 'string' && raw.pcId ? raw.pcId : null,
        postitNote: typeof raw.postitNote === 'string' && raw.postitNote.trim() ? raw.postitNote : null
    };
}

export class TextFileMinigame extends MinigameScene {
    // The X sits inside the frame (MinigameScene.closeInsideFrame)
    static closeInsideFrame = true;
    constructor(container, params) {
        super(container, params);
        
        // Ensure params is an object with default values
        const safeParams = params || {};
        
        // Initialize text file specific state
        this.textFileData = {
            fileName: safeParams.fileName || 'Unknown File',
            // The scenario id of the file, when known (cameFrom matches on it first)
            itemId: typeof safeParams.itemId === 'string' && safeParams.itemId ? safeParams.itemId : null,
            fileContent: safeParams.fileContent || '',
            fileType: safeParams.fileType || 'text',
            observations: safeParams.observations || '',
            source: safeParams.source || 'Unknown Source'
        };
        // Opened from a PC's desktop or share: the file opens in that PC's monitor frame
        // (UX slice 2c R3 M2), as a maximised window like the share's folder window
        this.pcScreen = pcScreenOf(safeParams);
        this.pcMonitor = null;
    }
    
    init() {
        // Call parent init to set up basic UI structure
        super.init();
        if (this.pcScreen) this.mountMonitor();
        
        // Customize the header
        // The file name is scenario text: appended as a text node, never parsed as HTML
        this.headerElement.innerHTML = `
            <h3><img src="/break_escape/assets/icons/notes.png" alt="Document" class="icon"> </h3>
            <p>Viewing text file contents</p>
        `;
        this.headerElement.querySelector('h3').append(displayDashes(this.textFileData.fileName ?? ''));
        
        // Set up the text file interface
        this.setupTextFileInterface();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Put the reader in the PC's monitor frame. The PC's post-it is stuck on the monitor, so
     * it stays on the chin with its Add to Notepad button, as on the desktop (R4 m2), and the
     * chin is sized by the note itself at any window size.
     */
    mountMonitor() {
        const note = this.pcScreen.postitNote;
        this.pcMonitor = mountPcMonitor(this, {
            name: displayDashes(this.pcScreen.name),
            postitHtml: note ? escapeHtmlKeepWords(displayDashes(note), { joinPunctuation: true }) : '',
            pcId: this.pcScreen.pcId
        });
        const postit = this.pcMonitor?.postit;
        if (postit) {
            // helpers.js pulls in much of the engine: loaded when needed, as the desktop's
            // note uses it, and a reader without it keeps a note that does not drag
            import('../../utils/helpers.js')
                .then((m) => { if (postit.isConnected) m.makeDraggable?.(postit); })
                .catch(() => {});
        }
        if (!this.pcMonitor || !note) return;
        const row = this.ensureControlsRow();
        if (!row) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'minigame-button';
        btn.id = 'minigame-notebook-postit';
        btn.innerHTML = pcPostitButtonHtml();
        row.appendChild(btn);
        this.addEventListener(btn, 'click', () => this.addPostitToNotebook());
    }

    // The chin's button (the post-it's Add to Notepad) goes in the monitor's chin
    controlsHost() {
        return this.pcMonitor?.controls || null;
    }

    // In the monitor the X lives in the bezel's top strip (css/pc-monitor.css)
    placeCloseButton() {
        if (this.pcMonitor) return;
        super.placeCloseButton();
    }

    /**
     * The file in the PC monitor: a maximised window in the share window's look, the file
     * name in its title bar, Copy and Add to Notepad in the PC's button look, the text in GNF
     * at 16px, and the observations in the status bar. The X is on the bezel. No Select All:
     * Copy already takes the whole file, and on a phone it was a second row (R4 m4).
     */
    setupMonitorInterface() {
        const name = escapeHtml(displayDashes(this.textFileData.fileName));
        const observations = this.textFileData.observations
            ? `<div class="share-folder-status pc-file-status pixel-scroll">${escapeHtml(displayDashes(this.textFileData.observations))}</div>` : '';
        this.gameContainer.innerHTML = `
            <div class="share-folder-layout pc-share pc-file">
            <div class="container-minigame share-folder">
                <div class="share-folder-window pc-file-window">
                    <div class="desktop-window-titlebar share-folder-titlebar">
                        <img class="pc-file-icon" src="/break_escape/assets/objects/text_file.png" alt="">
                        <span class="share-folder-path">${name}</span>
                    </div>
                    <div class="pc-file-toolbar">
                        <button type="button" class="pc-os-btn" id="copy-btn">Copy</button>
                        <button type="button" class="pc-os-btn" id="minigame-notebook"><img src="/break_escape/assets/icons/notes.png" alt="" class="icon-small"> Add to Notepad</button>
                        <span class="pc-file-message" aria-live="polite"></span>
                    </div>
                    <div class="pc-file-body pixel-scroll" id="file-content">${this.formatFileContent()}</div>${observations}
                </div>
            </div>
            </div>
        `;
        this.fileContent = this.gameContainer.querySelector('#file-content');
        this.copyBtn = this.gameContainer.querySelector('#copy-btn');
        // The PC's taskbar under the window (UX slice 6, critique E11): the account stays in
        // view, and the start panel leads back to the desktop. Loaded when needed, as the
        // note's drag is, so a reader outside a PC never pulls it in.
        if (this.pcScreen?.pcId) {
            this.taskbarReady = import('../../utils/pc-taskbar.js')
                .then((m) => this.mountTaskbar(m))
                .catch((e) => console.warn('PC taskbar', e));
        }
        this.selectAllBtn = null;
        this.closeBtn = null;
        this.minimizeBtn = null;
        this.maximizeBtn = null;
    }

    /**
     * The taskbar and start panel (utils/pc-taskbar.js) for the PC this file was opened on.
     * Desktop and a mapped share leave the file for that view; Lock, Switch user and Sign out
     * act on the PC's session as on the desktop.
     */
    mountTaskbar(m) {
        const host = this.gameContainer?.querySelector?.('.share-folder-layout.pc-file');
        if (!host || !host.isConnected || this.taskbar) return;
        const pcId = this.pcScreen.pcId;
        const kept = m.rememberedDesktop(pcId);
        const desktop = kept?.containerItem || null;
        const pcData = desktop?.scenarioData || m.findPcData(pcId);
        const session = window.pcSessions?.get?.(pcId) || null;
        const remote = desktop?.scenarioData?.remote?.footholdId ? desktop.scenarioData.remote
            : (session?.remote === true ? { footholdId: session.footholdId } : null);
        const linkName = remote?.footholdId ? (window.networkLinks?.get?.(remote.footholdId)?.name || null) : null;
        this.taskbarModel = m.pcTaskbarModel({ pcData, session, remote: !!remote, linkName, places: kept?.places || [], lockSupported: m.lockSupported(), canLock: window.pcSessions?.canLock?.(pcId), canSwitch: !!desktop });
        const leaveFor = (open) => {
            // Not the player's own Close: the reader does not reopen what it came from
            if (window.MinigameFramework?.currentMinigame === this) this.complete(false);
            open();
        };
        this.taskbar = m.mountPcTaskbar(host, this.taskbarModel, {
            windowTitle: this.textFileData.fileName,
            onPlace: (place) => {
                if (!desktop || typeof window.startContainerMinigame !== 'function') { this.closeByPlayer(); return; }
                if (place.kind === 'desktop') {
                    leaveFor(() => window.startContainerMinigame(desktop, null, false, true));
                } else if (place.kind === 'share') {
                    const share = { scenarioData: { ...place.item, locked: false }, name: 'network_share', objectId: `share_${place.item.id}`, sourcePcId: pcId, parentLockable: desktop };
                    leaveFor(() => window.startContainerMinigame(share, null, false, false));
                }
            },
            onAction: (action) => {
                if (action === 'signout') { leaveFor(() => window.pcSessions?.signOut?.(pcId)); return; }
                if (action === 'lock') {
                    if (!m.lockSupported()) return;
                    // Ask the server first: the reader stays open and says a refusal inside the
                    // monitor; it closes only once the lock succeeded (R1 m2)
                    m.lockPcSession(pcId, { onRefuse: (msg) => this.notify(msg, false, 3000) }).then((result) => {
                        if (!result?.ok) return;
                        // No desktop is open behind a reader, so the lock's message was parked:
                        // take it and say it, so the reader never closes silently (R2 m2)
                        const parked = window.pcSessions?.takeEndedMessage?.(pcId);
                        if (parked?.message) window.gameAlert?.(parked.message, 'info', '', 5000, { plainText: true });
                        if (window.MinigameFramework?.currentMinigame === this) this.complete(false);
                    });
                    return;
                }
                if (action === 'switch' && desktop) {
                    const r = desktop.scenarioData?.remote?.footholdId ? desktop.scenarioData.remote : null;
                    leaveFor(() => window.openLoginSignIn?.(desktop, r ? { switching: true, remote: r } : { switching: true }));
                }
            }
        });
    }

    /** A short result line: on the window's toolbar in the monitor, else the framework's message. */
    notify(text, ok = true, duration = 2000) {
        const line = this.pcMonitor ? this.gameContainer?.querySelector('.pc-file-message') : null;
        if (line) {
            line.textContent = text;
            line.classList.toggle('pc-file-message-error', !ok);
            clearTimeout(this._notifyTimer);
            this._notifyTimer = setTimeout(() => { if (line.textContent === text) line.textContent = ''; }, duration);
            return;
        }
        if (ok) this.showSuccess(text, false, duration);
        else this.showFailure(text, false, duration);
    }

    setupTextFileInterface() {
        if (this.pcMonitor) { this.setupMonitorInterface(); return; }
        // Create the text file interface with Mac-style window
        this.gameContainer.innerHTML = `
            <div class="text-file-container">
                <div class="text-file-window-header">
                    <div class="window-controls">
                        <button class="window-control close" title="Close"></button>
                        <button class="window-control minimize" title="Minimize"></button>
                        <button class="window-control maximize" title="Maximize"></button>
                    </div>
                    <div class="window-title">${escapeHtml(displayDashes(this.textFileData.fileName))}</div>
                    <div></div>
                </div>
                
                <div class="file-header">
                    <div class="file-icon"><img src="/break_escape/assets/objects/text_file.png" alt="Document" class="icon-large"></div>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(displayDashes(this.textFileData.fileName))}</div>
                        <div class="file-meta">
                            <span class="file-type">${escapeHtml(String(this.textFileData.fileType).toUpperCase())}</span>
                            <span class="file-size">${this.getFileSize()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="file-content-area">
                    <div class="content-header">
                        <div class="content-actions">
                            <button class="action-btn" id="copy-btn" title="Copy to clipboard"><img src="/break_escape/assets/icons/copy-sm.png" alt="Clipboard" class="icon-small"> Copy</button>
                            <button class="action-btn" id="select-all-btn" title="Select all text">Select All</button>
                            <button class="action-btn" id="minigame-notebook" title="Add to Notepad"><img src="/break_escape/assets/icons/notes.png" alt="Notepad" class="icon-small notepad-btn-icon"> Add to Notepad</button>
                        </div>
                    </div>
                    <div class="file-content" id="file-content">
                        ${this.formatFileContent()}
                    </div>
                </div>
                
                ${this.textFileData.observations ? `
                <div class="file-observations">
                    <h4><img src="/break_escape/assets/icons/copy-sm.png" alt="Clipboard" class="icon-small"> Observations:</h4>
                    <p>${escapeHtml(displayDashes(this.textFileData.observations))}</p>
                </div>
                ` : ''}
            </div>
        `;
        
        // Get references to important elements
        this.fileContent = document.getElementById('file-content');
        this.copyBtn = document.getElementById('copy-btn');
        this.selectAllBtn = document.getElementById('select-all-btn');
        
        // Get window control references
        this.closeBtn = this.gameContainer.querySelector('.window-control.close');
        this.minimizeBtn = this.gameContainer.querySelector('.window-control.minimize');
        this.maximizeBtn = this.gameContainer.querySelector('.window-control.maximize');
    }
    
    formatFileContent() {
        // Format the file content for display
        let content = displayDashes(this.textFileData.fileContent);
        
        // Escape HTML characters
        content = escapeHtml(content);
        
        // Convert line breaks to <br> tags
        content = content.replace(/\n/g, '<br>');
        
        // Wrap in a pre element to preserve formatting
        return `<pre class="file-text">${content}</pre>`;
    }
    
    getFileSize() {
        // Calculate approximate file size
        const bytes = new Blob([this.textFileData.fileContent]).size;
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    }
    
    setupEventListeners() {
        // Window controls (none in the PC monitor: the X on the bezel closes it)
        if (this.closeBtn) this.addEventListener(this.closeBtn, 'click', () => {
            this.closeByPlayer();
        });

        if (this.minimizeBtn) this.addEventListener(this.minimizeBtn, 'click', () => {
            // Minimize by closing the minigame (common behavior for modal windows)
            this.closeByPlayer();
        });

        if (this.maximizeBtn) this.addEventListener(this.maximizeBtn, 'click', () => {
            // Maximize by toggling fullscreen mode
            this.toggleFullscreen();
        });
        
        // Copy button
        this.addEventListener(this.copyBtn, 'click', () => {
            this.copyToClipboard();
        });
        
        // Select all button
        if (this.selectAllBtn) this.addEventListener(this.selectAllBtn, 'click', () => {
            this.selectAllText();
        });
        
        // Notebook button (in minigame controls)
        const notebookBtn = this.gameContainer.querySelector('#minigame-notebook');
        if (notebookBtn) {
            this.addEventListener(notebookBtn, 'click', () => {
                this.addToNotebook();
            });
        }
        
        // Keyboard controls
        this.addEventListener(document, 'keydown', (event) => {
            this.handleKeyPress(event);
        });
        
        // Double-click to select all
        this.addEventListener(this.fileContent, 'dblclick', () => {
            this.selectAllText();
        });
    }
    
    handleKeyPress(event) {
        if (!this.gameState.isActive) return;
        
        // Handle Ctrl+A for select all
        if (event.ctrlKey && event.key === 'a') {
            event.preventDefault();
            this.selectAllText();
        }
        
        // Handle Ctrl+C for copy (when text is selected)
        if (event.ctrlKey && event.key === 'c') {
            // Let the default behavior handle copying selected text
            return;
        }
        
        // Handle Escape to close
        if (event.key === 'Escape') {
            event.preventDefault();
            this.closeByPlayer();
        }
    }
    
    copyToClipboard() {
        try {
            // Use the modern clipboard API if available
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(this.textFileData.fileContent).then(() => {
                    this.notify(this.pcMonitor ? "Copied." : "File content copied to clipboard!");
                }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.fallbackCopyToClipboard();
                });
            } else {
                // Fallback for older browsers or non-secure contexts
                this.fallbackCopyToClipboard();
            }
        } catch (error) {
            console.error('Copy failed:', error);
            this.fallbackCopyToClipboard();
        }
    }
    
    fallbackCopyToClipboard() {
        // Create a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = this.textFileData.fileContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        try {
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            
            if (successful) {
                this.notify(this.pcMonitor ? "Copied." : "File content copied to clipboard!");
            } else {
                this.notify("Failed to copy to clipboard", false);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.notify("Copy not supported on this browser", false);
        } finally {
            document.body.removeChild(textArea);
        }
    }
    
    selectAllText() {
        // Select all text in the file content
        const range = document.createRange();
        range.selectNodeContents(this.fileContent);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        this.notify("All text selected", true, 1000);
    }
    
    toggleFullscreen() {
        // Toggle fullscreen mode for the minigame container
        if (!document.fullscreenElement) {
            // Enter fullscreen
            this.container.requestFullscreen().then(() => {
                this.showSuccess("Entered fullscreen mode", false, 1500);
            }).catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
                this.showSuccess("Fullscreen not supported", false, 1500);
            });
        } else {
            // Exit fullscreen
            document.exitFullscreen().then(() => {
                this.showSuccess("Exited fullscreen mode", false, 1500);
            }).catch(err => {
                console.error('Error attempting to exit fullscreen:', err);
            });
        }
    }
    
    addToNotebook() {
        // Check if there's content to add
        if (!this.textFileData.fileContent || this.textFileData.fileContent.trim() === '') {
            this.notify("No content to add to notepad", false);
            return;
        }
        
        // The note body is the file's text as it is, so it can be copied straight into
        // a decoder; the file name (and source, if given) goes in the title (E6)
        const { title: notebookTitle, content: notebookContent } = textFileNotebookEntry(this.textFileData);
        const notebookObservations = this.textFileData.observations ||
            `Text file "${this.textFileData.fileName}" from ${this.textFileData.source}`;
        this.openNotepadWith('text_file', notebookTitle, notebookContent, notebookObservations, "Added file content to notebook");
    }

    /** The PC's post-it (the chin's button in the monitor, R4 m2): noted, then back to this file. */
    addPostitToNotebook() {
        const note = this.pcScreen?.postitNote;
        if (!note) return;
        const { title, content, observations } = postitNotebookEntry(this.pcScreen.name, note);
        this.openNotepadWith('postit_note', title, content, observations, "Added postit note to notepad");
    }

    /**
     * Open the Notepad on a new entry, keeping this file to come back to: the Notepad's close
     * reopens the reader (in its PC frame when it had one), and the reader's own X then goes
     * back to the desktop or share it was opened from (R4 m1).
     */
    openNotepadWith(type, notebookTitle, notebookContent, notebookObservations, doneText) {
        // Check if notes minigame is available
        if (window.startNotesMinigame) {
            // Store the text file state globally so we can return to it
            const textFileState = {
                fileName: this.textFileData.fileName,
                itemId: this.textFileData.itemId,
                fileContent: this.textFileData.fileContent,
                fileType: this.textFileData.fileType,
                observations: this.textFileData.observations,
                source: this.textFileData.source,
                pcScreen: this.pcScreen,
                params: this.params
            };

            window.pendingTextFileReturn = textFileState;

            // Create an item for the notes minigame
            const textFileItem = {
                scenarioData: {
                    type,
                    name: notebookTitle,
                    text: notebookContent,
                    observations: notebookObservations,
                    important: true // Mark as important since it's from a file
                }
            };
            
            // Start notes minigame - it will handle returning to text file via returnToTextFileAfterNotes
            window.startNotesMinigame(
                textFileItem, 
                notebookContent, 
                notebookObservations, 
                null, // Let notes minigame auto-navigate to the newly added note
                false, // Don't auto-add to inventory
                false // Don't auto-close
            );
            
            this.showSuccess(doneText, false, 2000);
        } else {
            this.showFailure("Notepad not available", false, 2000);
        }
    }
    
    start() {
        // Call parent start
        super.start();
        
        console.log("Text file minigame started");
        console.log("File:", this.textFileData.fileName);
        console.log("Content length:", this.textFileData.fileContent.length);
    }
    
    /**
     * Whether this file was opened from the container in `back` (window.pendingContainerReturn):
     * the file is among that container's contents. A return left over from a container the
     * player closed some other way never matches a file read from the world. With an itemId
     * the file is matched by id, so a world file that only shares the name does not match
     * (review R1 n2); without one (an older caller), by name.
     */
    static cameFrom(back, fileName, itemId = null) {
        if (!back?.containerItem || !Array.isArray(back.contents)) return false;
        if (itemId) return back.contents.some(item => item && item.id === itemId);
        return back.contents.some(item => item && item.name === fileName);
    }

    cleanup() {
        clearTimeout(this._notifyTimer);
        this.taskbar?.destroy?.();
        this.pcMonitor?.destroy?.();
        // Call parent cleanup (handles event listeners)
        super.cleanup();

        // If we're NOT transitioning to notes (pendingTextFileReturn would be set in that case),
        // clear any stale container return state so a later independent notes session
        // doesn't wrongly navigate back to a container the user already exited.
        if (!window.pendingTextFileReturn) {
            // A file read from a network screen (a remote desktop, a share opened from the
            // network view, or a folder in either; slice 9.3a, 4.3) reopens that screen, so
            // the player is never dropped into the world mid-chain
            const back = window.pendingContainerReturn;
            // Only the player's own Close or Esc goes back: a hit, the knockout screen or a
            // conversation closing the reader leaves him in the world (review M1)
            const ownClose = this.closedByPlayer === true;
            const blocked = (arm) => (typeof window.containerReturnBlocked === 'function'
                ? window.containerReturnBlocked(arm, ownClose) : (ownClose ? null : 'not_own_close'));
            const arm = window.containerReturnArm?.() || null;
            if (back?.containerItem && typeof window.isNetworkScreenContainer === 'function'
                && window.isNetworkScreenContainer(back.containerItem)) {
                window.pendingContainerReturn = null;
                window.pendingPhoneReturn = null;
                if (!ownClose) return;
                setTimeout(() => {
                    if (blocked(arm)) return;
                    window.startContainerMinigame?.(back.containerItem, null, !!back.isTakeable, true);
                }, 50);
                return;
            }
            // Any other container (a desk drawer, a PC's file list, an NPC's items) reopens
            // too, as the notes viewer does, so a second file is one click away (lab
            // playtest fixes). If something else has opened by then, the return is dropped.
            if (ownClose && TextFileMinigame.cameFrom(back, this.textFileData.fileName, this.textFileData.itemId)
                && typeof window.returnToContainerAfterNotes === 'function') {
                window.pendingPhoneReturn = null;
                window.expectPanelWithin?.(1000); // held toasts wait for the container (F13, engine F24)
                setTimeout(() => {
                    if (window.pendingContainerReturn !== back) return;
                    if (blocked(arm)) {
                        window.pendingContainerReturn = null;
                        return;
                    }
                    window.returnToContainerAfterNotes();
                }, 100);
                return;
            }
            window.pendingContainerReturn = null;
            window.pendingPhoneReturn = null;
        }
    }
}

// Function to return to text file after notes minigame (similar to container pattern)
export function returnToTextFileAfterNotes() {
    console.log('Returning to text file after notes minigame');
    
    // Check if there's a pending text file return
    if (window.pendingTextFileReturn) {
        const textFileState = window.pendingTextFileReturn;
        
        // Clear the pending return state
        window.pendingTextFileReturn = null;
        
        // Start the text file minigame with the stored state
        if (window.MinigameFramework) {
            window.MinigameFramework.startMinigame('text-file', null, {
                title: `Text File - ${textFileState.fileName}`,
                fileName: textFileState.fileName,
                itemId: textFileState.itemId || null,
                fileContent: textFileState.fileContent,
                fileType: textFileState.fileType,
                observations: textFileState.observations,
                source: textFileState.source,
                pcScreen: textFileState.pcScreen || null,
                onComplete: (success, result) => {
                    console.log('Text file minigame completed:', success, result);
                }
            });
        }
    } else {
        console.warn('No pending text file return state found');
    }
}
