import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

export class TextFileMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        
        // Ensure params is an object with default values
        const safeParams = params || {};
        
        // Initialize text file specific state
        this.textFileData = {
            fileName: safeParams.fileName || 'Unknown File',
            fileContent: safeParams.fileContent || '',
            fileType: safeParams.fileType || 'text',
            observations: safeParams.observations || '',
            source: safeParams.source || 'Unknown Source'
        };
    }
    
    init() {
        // Call parent init to set up basic UI structure
        super.init();
        
        // Customize the header
        this.headerElement.innerHTML = `
            <h3><img src="/break_escape/assets/icons/text-file.png" alt="Document" class="icon"> ${displayDashes(this.textFileData.fileName)}</h3>
            <p>Viewing text file contents</p>
        `;
        
        // Add notebook button to minigame controls (before cancel button)
        if (this.controlsElement) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook';
            notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes-sm.png" alt="Notepad" class="icon-small"> Add to Notepad';
            this.controlsElement.appendChild(notebookBtn);
            
            // Change cancel button text to "Close"
            const cancelBtn = document.getElementById('minigame-cancel');
            if (cancelBtn) {
                cancelBtn.innerHTML = 'Close';
            }
        }
        
        // Set up the text file interface
        this.setupTextFileInterface();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupTextFileInterface() {
        // Create the text file interface with Mac-style window
        this.gameContainer.innerHTML = `
            <div class="text-file-container">
                <div class="text-file-window-header">
                    <div class="window-controls">
                        <button class="window-control close" title="Close"></button>
                        <button class="window-control minimize" title="Minimize"></button>
                        <button class="window-control maximize" title="Maximize"></button>
                    </div>
                    <div class="window-title">${displayDashes(this.textFileData.fileName)}</div>
                    <div></div>
                </div>
                
                <div class="file-header">
                    <div class="file-icon"><img src="/break_escape/assets/objects/text_file.png" alt="Document" class="icon-large"></div>
                    <div class="file-info">
                        <div class="file-name">${displayDashes(this.textFileData.fileName)}</div>
                        <div class="file-meta">
                            <span class="file-type">${this.textFileData.fileType.toUpperCase()}</span>
                            <span class="file-size">${this.getFileSize()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="file-content-area">
                    <div class="content-header">
                        <div class="content-actions">
                            <button class="action-btn" id="copy-btn" title="Copy to clipboard"><img src="/break_escape/assets/icons/copy-sm.png" alt="Clipboard" class="icon-small"> Copy</button>
                            <button class="action-btn" id="select-all-btn" title="Select all text">Select All</button>
                        </div>
                    </div>
                    <div class="file-content" id="file-content">
                        ${this.formatFileContent()}
                    </div>
                </div>
                
                ${this.textFileData.observations ? `
                <div class="file-observations">
                    <h4><img src="/break_escape/assets/icons/copy-sm.png" alt="Clipboard" class="icon-small"> Observations:</h4>
                    <p>${displayDashes(this.textFileData.observations)}</p>
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
        content = content.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
        
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
        // Window controls
        this.addEventListener(this.closeBtn, 'click', () => {
            this.complete(false);
        });
        
        this.addEventListener(this.minimizeBtn, 'click', () => {
            // Minimize by closing the minigame (common behavior for modal windows)
            this.complete(false);
        });
        
        this.addEventListener(this.maximizeBtn, 'click', () => {
            // Maximize by toggling fullscreen mode
            this.toggleFullscreen();
        });
        
        // Copy button
        this.addEventListener(this.copyBtn, 'click', () => {
            this.copyToClipboard();
        });
        
        // Select all button
        this.addEventListener(this.selectAllBtn, 'click', () => {
            this.selectAllText();
        });
        
        // Notebook button (in minigame controls)
        const notebookBtn = document.getElementById('minigame-notebook');
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
            this.complete(false);
        }
    }
    
    copyToClipboard() {
        try {
            // Use the modern clipboard API if available
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(this.textFileData.fileContent).then(() => {
                    this.showSuccess("File content copied to clipboard!", false, 2000);
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
                this.showSuccess("File content copied to clipboard!", false, 2000);
            } else {
                this.showFailure("Failed to copy to clipboard", false, 2000);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showFailure("Copy not supported on this browser", false, 2000);
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
        
        this.showSuccess("All text selected", false, 1000);
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
            this.showFailure("No content to add to notepad", false, 2000);
            return;
        }
        
        // Create comprehensive notebook content
        const notebookContent = this.formatContentForNotebook();
        const notebookTitle = `Text File - ${this.textFileData.fileName}`;
        const notebookObservations = this.textFileData.observations || 
            `Text file "${this.textFileData.fileName}" from ${this.textFileData.source}`;
        
        // Check if notes minigame is available
        if (window.startNotesMinigame) {
            // Store the text file state globally so we can return to it
            const textFileState = {
                fileName: this.textFileData.fileName,
                fileContent: this.textFileData.fileContent,
                fileType: this.textFileData.fileType,
                observations: this.textFileData.observations,
                source: this.textFileData.source,
                params: this.params
            };
            
            window.pendingTextFileReturn = textFileState;
            
            // Create a text file item for the notes minigame
            const textFileItem = {
                scenarioData: {
                    type: 'text_file',
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
            
            this.showSuccess("Added file content to notebook", false, 2000);
        } else {
            this.showFailure("Notepad not available", false, 2000);
        }
    }
    
    formatContentForNotebook() {
        let content = `Text File: ${this.textFileData.fileName}\n`;
        content += `Source: ${this.textFileData.source}\n`;
        content += `Type: ${this.textFileData.fileType.toUpperCase()}\n`;
        content += `Date: ${new Date().toLocaleString()}\n\n`;
        content += `${'='.repeat(20)}\n\n`;
        content += `FILE CONTENTS:\n`;
        content += `${'-'.repeat(20)}\n\n`;
        content += this.textFileData.fileContent;
        content += `\n\n${'='.repeat(20)}\n`;
        content += `End of File: ${this.textFileData.fileName}`;
        
        return content;
    }
    
    start() {
        // Call parent start
        super.start();
        
        console.log("Text file minigame started");
        console.log("File:", this.textFileData.fileName);
        console.log("Content length:", this.textFileData.fileContent.length);
    }
    
    cleanup() {
        // Call parent cleanup (handles event listeners)
        super.cleanup();

        // If we're NOT transitioning to notes (pendingTextFileReturn would be set in that case),
        // clear any stale container return state so a later independent notes session
        // doesn't wrongly navigate back to a container the user already exited.
        if (!window.pendingTextFileReturn) {
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
                fileContent: textFileState.fileContent,
                fileType: textFileState.fileType,
                observations: textFileState.observations,
                source: textFileState.source,
                onComplete: (success, result) => {
                    console.log('Text file minigame completed:', success, result);
                }
            });
        }
    } else {
        console.warn('No pending text file return state found');
    }
}
