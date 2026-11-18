import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { renderNoteMarkdown, noteMatches } from '../../utils/note-markdown.js';
import { cappedText, NOTE_LIMIT } from '../../utils/test-state-text.js';

// Observations are plain text: scenario data, the player's own typing, or a line another
// minigame wrote ("Postit note found in <container name>"). They go in as text, never markup.
function setObservationText(div, text) {
    div.replaceChildren();
    if (text) {
        div.textContent = displayDashes(text);
    } else {
        const em = document.createElement('em');
        em.textContent = 'Click edit to add your observations...';
        div.appendChild(em);
    }
}


// Whether a page has text below its visible part (the MORE cue). Pure.
// lastBottom: bottom edge of the last thing on the page; visibleBottom: bottom edge of the
// text area. Its own bottom padding and the last box's margin are blank paper: scrollHeight
// counts them, so it is not used. Content that ends inside the padding is fully shown.
export function moreBelow(lastBottom, visibleBottom, tolerance = 2) {
    return lastBottom - visibleBottom > tolerance;
}

// Pixelify Sans and VT323 are self-hosted in css/fonts.css (no remote font links).

// Notes Minigame Scene implementation
// The counter under the notepad counts notes (not pages), so it says so
// While a search term is active it counts matches instead ("Match 1 of 2"); no match reads "No match"
export function noteCounterText(index, total, filtered = false) {
    if (filtered && total === 0) return 'No match';
    return `${filtered ? 'Match' : 'Note'} ${index + 1} of ${total}`;
}

export class NotesMinigame extends MinigameScene {
    // The X sits inside the frame (MinigameScene.closeInsideFrame)
    static closeInsideFrame = true;
    // The scene may draw a bottom button: only the Mission Brief at game start uses it, as
    // Continue (A05). Every other note closes with the X or Esc alone.
    static keepsCancelButton = true;

    // The X sits in the paper's top-right corner, not out at the window's edge. The art's paper
    // ends at column 154 of 165 (the rest is shadow and transparent), so the anchor is an empty
    // box over the paper only (.notes-minigame-page-edge)
    closeAnchor() {
        return this.gameContainer?.querySelector?.('.notes-minigame-page-edge')
            || this.gameContainer?.querySelector?.('.notes-minigame-notepad') || this.gameContainer;
    }

    constructor(container, params) {
        // Ensure params is defined before calling parent constructor
        params = params || {};
        
        // Set default title if not provided
        if (!params.title) {
            params.title = 'Reading Notes';
        }
        
        // Continue only for the Mission Brief popup (A05); X and Esc close every note
        params.showCancel = notesShowsContinue(params);
        params.cancelText = 'Continue';
        
        super(container, params);
        
        this.item = params.item;
        this.originalNoteContent = params.noteContent || this.item?.scenarioData?.noteContent || this.item?.scenarioData?.text || '';
        this.noteContent = this.originalNoteContent || 'No content available';
        this.observationText = params.observationText || this.item?.scenarioData?.observationText || this.item?.scenarioData?.observations || '';
        
        // Initialize note navigation
        this.currentNoteIndex = 0;
        this.collectedNotes = this.getCollectedNotes();
        this.autoAddToNotes = params.autoAddToNotes !== false;
        // A filed item (storeIn) opens with autoAddToNotes false and no note to go to: its own
        // page is shown, and it is not one of the collected notes, so no counter or search row.
        this.showsFiledPage = !this.autoAddToNotes && (params.navigateToNote === null || params.navigateToNote === undefined);
        this.searchTerm = '';
    }
        /** Test bridge state (see MinigameScene.getTestState). */
    getTestState() {
        return {
            ...super.getTestState(),
            noteName: this.item?.scenarioData?.name || null,
            ...cappedText('noteContent', this.noteContent || '', NOTE_LIMIT),
            observationText: String(this.observationText || '').slice(0, 1000),
            noteIndex: this.showsFiledPage ? 0 : this.currentNoteIndex,
            noteCount: this.showsFiledPage ? 0 : (this.collectedNotes || []).length,
            filed: !!this.showsFiledPage
        };
    }


    init() {
        // Call parent init to set up common components
        super.init();
        
        console.log("Notes minigame initializing");
        
        // Refresh collected notes to ensure we have the latest data
        this.collectedNotes = this.getCollectedNotes();
        console.log("Collected notes:", this.collectedNotes);

        // Clear header content
        this.headerElement.innerHTML = '';

        // Configure game container - it's just a sizing wrapper
        this.gameContainer.className += ' notes-minigame-game-container';

        // Create notepad container with background
        const notepadContainer = document.createElement('div');
        notepadContainer.className = 'notes-minigame-notepad';

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'notes-minigame-content-area pixel-scroll';

                // Create text box container to look like it's stuck in a binder
                const textBox = document.createElement('div');
                textBox.className = 'notes-minigame-text-box';

                // Add celotape effect
                const celotape = document.createElement('div');
                celotape.className = 'notes-minigame-celotape';
                textBox.appendChild(celotape);

        // Add binder holes effect
        const binderHoles = document.createElement('div');
        binderHoles.className = 'notes-minigame-binder-holes';
        
        
        
        // Add note title/name above the text box
        const noteTitle = document.createElement('div');
        noteTitle.className = 'notes-minigame-title';
        
        // Check if this is an important note
        const isImportant = this.item?.scenarioData?.important || false;
        if (isImportant) {
            noteTitle.classList.add('important');
        }
        
        // Create title content with optional star icon
        const titleContent = document.createElement('span');
        titleContent.textContent = displayDashes(this.item?.scenarioData?.name || 'Note');
        noteTitle.appendChild(titleContent);
        
        // Add star icon for important notes
        if (isImportant) {
            const starIcon = document.createElement('img');
            starIcon.src = '/break_escape/assets/icons/star.png';
            starIcon.alt = 'Important';
            starIcon.className = 'notes-minigame-star';
            noteTitle.appendChild(starIcon);
        }
        
        contentArea.appendChild(noteTitle);
        
        // Add note content
        const noteText = document.createElement('div');
        noteText.className = 'notes-minigame-text';
        noteText.innerHTML = renderNoteMarkdown(displayDashes(this.noteContent));
        textBox.appendChild(noteText);
        
        contentArea.appendChild(textBox);

                // Add observation text if available - handwritten directly on the page
                if (this.observationText) {
                    const observationContainer = document.createElement('div');
                    observationContainer.className = 'notes-minigame-observation-container';

                    const observationDiv = document.createElement('div');
                    observationDiv.className = 'notes-minigame-observation';
                    setObservationText(observationDiv, this.observationText);
                    observationDiv.dataset.raw = this.observationText;
                    if (!this.showsFiledPage) observationDiv.style.cursor = 'pointer'; // Make it clear it's clickable
                    if (!this.showsFiledPage) observationDiv.title = 'Click to edit observations';
                    if (!this.showsFiledPage) observationDiv.addEventListener('click', () => this.editObservations(observationDiv));

                    // Add edit button
                    const editBtn = document.createElement('button');
                    editBtn.className = 'notes-minigame-edit-btn';
                    editBtn.title = 'Edit observations';

                    // Add pencil icon
                    const pencilIcon = document.createElement('img');
                    pencilIcon.src = '/break_escape/assets/icons/pencil.png';
                    pencilIcon.alt = 'Edit';
                    editBtn.appendChild(pencilIcon);

                    editBtn.setAttribute('aria-label', editBtn.title);
                    // The observation div is replaced on every page change, so find it at click time
                    editBtn.addEventListener('click', () => this.editObservations(observationContainer.querySelector('.notes-minigame-observation')));

                    observationContainer.appendChild(observationDiv);
                    // A filed page is not one of the Notepad notes: nothing to edit, so no pencil
                    if (!this.showsFiledPage) observationContainer.appendChild(editBtn);
                    contentArea.appendChild(observationContainer);
                } else if (!this.showsFiledPage) {
                    // Add empty observation area with edit button
                    const observationContainer = document.createElement('div');
                    observationContainer.className = 'notes-minigame-observation-container';

                    const observationDiv = document.createElement('div');
                    observationDiv.className = 'notes-minigame-observation empty';
                    setObservationText(observationDiv, '');
                    observationDiv.style.cursor = 'pointer'; // Make it clear it's clickable
                    observationDiv.title = 'Click to add observations';
                    observationDiv.addEventListener('click', () => this.editObservations(observationDiv));

                    // Add edit button
                    const editBtn = document.createElement('button');
                    editBtn.className = 'notes-minigame-edit-btn';
                    editBtn.title = 'Add observations';

                    // Add pencil icon
                    const pencilIcon = document.createElement('img');
                    pencilIcon.src = '/break_escape/assets/icons/pencil.png';
                    pencilIcon.alt = 'Edit';
                    editBtn.appendChild(pencilIcon);

                    editBtn.setAttribute('aria-label', editBtn.title);
                    // The observation div is replaced on every page change, so find it at click time
                    editBtn.addEventListener('click', () => this.editObservations(observationContainer.querySelector('.notes-minigame-observation')));

                    observationContainer.appendChild(observationDiv);
                    // A filed page is not one of the Notepad notes: nothing to edit, so no pencil
                    if (!this.showsFiledPage) observationContainer.appendChild(editBtn);
                    contentArea.appendChild(observationContainer);
                }

        // Add content area to notepad container, then notepad container to game container
        notepadContainer.appendChild(contentArea);
        this.gameContainer.appendChild(notepadContainer);

        // The paper's edge, for the X (closeAnchor): invisible, over the paper only
        const pageEdge = document.createElement('div');
        pageEdge.className = 'notes-minigame-page-edge';
        notepadContainer.appendChild(pageEdge);

        // A page longer than the notepad scrolls inside it: a flat "more" cue at its foot says
        // so while there is text below (the scrollbar alone is easy to miss on a phone). It is
        // re-checked on a scroll, on a change of size of the page, the slip or the observation
        // box (an edit that grows), and by updateDisplayedNote (Next, Previous, search).
        const moreCue = document.createElement('div');
        moreCue.className = 'notes-minigame-more';
        moreCue.textContent = 'MORE \u25BC';
        moreCue.hidden = true;
        notepadContainer.appendChild(moreCue);
        this._moreCue = moreCue;
        this._contentArea = contentArea;
        this.addEventListener(contentArea, 'scroll', () => this._syncMore(), { passive: true });
        if (typeof window.ResizeObserver === 'function') {
            this._moreObserver = new window.ResizeObserver(() => this._syncMore());
            for (const el of [contentArea, textBox, contentArea.querySelector('.notes-minigame-observation-container')]) {
                if (el) this._moreObserver.observe(el);
            }
        }
        (window.requestAnimationFrame || setTimeout)(() => this._syncMore());

        // Create navigation buttons container (only if navigation is not hidden)
        if (!this.params.hideNavigation && !this.showsFiledPage) {
            const navContainer = document.createElement('div');
            navContainer.className = 'notes-minigame-nav-container';
            // Search, Previous, Next and the counter, when there is more than one note
            if (this.collectedNotes.length > 1) this.fillNav(navContainer);
            this.placeNav(navContainer);
        }
    }

    // In the shell's column straight under the notepad, above Continue
    // (critique A04: it was drawn over the page)
    placeNav(navContainer) {
        if (this.gameContainer?.after) this.gameContainer.after(navContainer);
        else this.container.appendChild(navContainer);
    }

    fillNav(navContainer) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search notes...';
        searchInput.className = 'notes-minigame-search';
        searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        navContainer.appendChild(searchInput);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'minigame-button notes-minigame-nav-button';
        prevBtn.textContent = '< Previous';
        prevBtn.addEventListener('click', () => this.navigateToNote(-1));
        navContainer.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'minigame-button notes-minigame-nav-button';
        nextBtn.textContent = 'Next >';
        nextBtn.addEventListener('click', () => this.navigateToNote(1));
        navContainer.appendChild(nextBtn);

        const noteCounter = document.createElement('div');
        noteCounter.className = 'notes-minigame-counter';
        noteCounter.textContent = this.counterText();
        navContainer.appendChild(noteCounter);
    }

    counterText() {
        const filtered = (this.searchTerm || '').trim() !== '';
        return noteCounterText(this.currentNoteIndex, this.noMatch ? 0 : this.collectedNotes.length, filtered);
    }

    removeNoteFromScene() {
        // Remove the note from the scene using the same method as the inventory system
        if (this.item && this.item.objectId) {
            console.log('Removing note from scene:', this.item.objectId);

            // Hide the sprite and destroy its proximity ghost
            if (this.item.setVisible) {
                this.item.setVisible(false);
            }
            this.item.active = false;
            this.item.isHighlighted = false;
            if (this.item.proximityGhost) {
                this.item.proximityGhost.destroy();
                delete this.item.proximityGhost;
            }

            // Remove from room objects if it exists (same as inventory system)
            if (window.currentPlayerRoom && window.rooms && window.rooms[window.currentPlayerRoom] && window.rooms[window.currentPlayerRoom].objects) {
                if (window.rooms[window.currentPlayerRoom].objects[this.item.objectId]) {
                    const roomObj = window.rooms[window.currentPlayerRoom].objects[this.item.objectId];
                    roomObj.setVisible(false);
                    roomObj.active = false;
                    if (roomObj.proximityGhost) {
                        roomObj.proximityGhost.destroy();
                        delete roomObj.proximityGhost;
                    }
                    console.log(`Removed object ${this.item.objectId} from room`);
                }
            }

            // Register removal with RoomStateSync so the server persists it in objects_removed.
            // Use the sprite's own roomId (set at load time) rather than window.currentPlayerRoom,
            // since the player may have moved rooms after the minigame opened.
            if (window.RoomStateSync && this.item.objectId) {
                const roomId = this.item.roomId || window.currentPlayerRoom;
                window.RoomStateSync.removeItemFromRoom(roomId, this.item.objectId)
                    .catch(err => console.warn('Failed to persist note removal:', err));
            }

            // Notify the interaction system so it can clean up any remaining ghost
            if (window.eventDispatcher) {
                window.eventDispatcher.emit('item_removed_from_scene', { sprite: this.item });
            }
            
            // Also try to remove from the scene's object list if available
            if (this.item.scene && this.item.scene.objects) {
                const objectIndex = this.item.scene.objects.findIndex(obj => obj.objectId === this.item.objectId);
                if (objectIndex !== -1) {
                    this.item.scene.objects.splice(objectIndex, 1);
                    console.log('Removed note from scene objects list');
                }
            }
            
            // Update the scene's interactive objects if available
            if (this.item.scene && this.item.scene.interactiveObjects) {
                const interactiveIndex = this.item.scene.interactiveObjects.findIndex(obj => obj.objectId === this.item.objectId);
                if (interactiveIndex !== -1) {
                    this.item.scene.interactiveObjects.splice(interactiveIndex, 1);
                    console.log('Removed note from scene interactive objects list');
                }
            }
        }
    }
    
    getCollectedNotes() {
        // Get all notes from the notes system
        if (!window.gameState || !window.gameState.notes) {
            return [];
        }
        
        // Return all notes - no filtering needed since we want to show all collected notes
        return window.gameState.notes.slice(); // Return a copy to avoid modifying the original array
    }
    
    playPageTurnSound() {
        try {
            if (window.game && window.game.sound) {
                const sound = window.game.sound.get('page_turn') || window.game.sound.add('page_turn');
                sound.play({ volume: 0.8 });
            }
        } catch (e) {
            // Sound not available, ignore
        }
    }

    navigateToNote(direction) {
        if (this.collectedNotes.length <= 1 || this.showsFiledPage || this.noMatch) return;
        
        this.playPageTurnSound();
        this.currentNoteIndex += direction;
        
        // Wrap around
        if (this.currentNoteIndex < 0) {
            this.currentNoteIndex = this.collectedNotes.length - 1;
        } else if (this.currentNoteIndex >= this.collectedNotes.length) {
            this.currentNoteIndex = 0;
        }
        
        // Update the displayed note
        this.updateDisplayedNote();
        
        // Update the counter
        this.updateCounter();
    }
    
    _syncMore() {
        const area = this._contentArea;
        if (!this._moreCue || !area) return;
        const last = area.lastElementChild;
        if (!last) { this._moreCue.hidden = true; return; }
        const areaRect = area.getBoundingClientRect();
        this._moreCue.hidden = !moreBelow(last.getBoundingClientRect().bottom, areaRect.bottom);
    }

    updateDisplayedNote() {
        const currentNote = this.collectedNotes[this.currentNoteIndex];
        if (!currentNote) return;
        // The notepad remembers what it showed, so it reopens on a note added since (UX R1)
        // Recorded against the full list: a search narrows collectedNotes (R1 m2)
        if (this.item?.scenarioData?.type === 'notepad') {
            Object.assign(notepadMemory, notepadMemoryFor(window.gameState?.notes, currentNote, this.currentNoteIndex));
        }
        
        // Parse the note text to extract observations
        const noteParts = this.parseNoteText(currentNote.text);
        this.noteContent = noteParts.mainText;
        this.observationText = noteParts.observationText;
        
        // Update the displayed content
        const noteTitle = this.container.querySelector('.notes-minigame-title');
        const noteText = this.container.querySelector('.notes-minigame-text');
        const observationDiv = this.container.querySelector('.notes-minigame-observation');
        
        if (noteTitle) {
            // Clear existing content
            noteTitle.innerHTML = '';
            noteTitle.className = 'notes-minigame-title';
            
            // Check if this is an important note
            const isImportant = currentNote.important || false;
            if (isImportant) {
                noteTitle.classList.add('important');
            }
            
            // Create title content with optional star icon
            const titleContent = document.createElement('span');
            titleContent.textContent = displayDashes(currentNote.title);
            noteTitle.appendChild(titleContent);
            
            // Add star icon for important notes
            if (isImportant) {
                const starIcon = document.createElement('img');
                starIcon.src = '/break_escape/assets/icons/star.png';
                starIcon.alt = 'Important';
                starIcon.className = 'notes-minigame-star';
                noteTitle.appendChild(starIcon);
            }
        }
        
        if (noteText) {
            noteText.innerHTML = renderNoteMarkdown(displayDashes(this.noteContent));
        }
        
        // Update observation container
        const observationContainer = this.container.querySelector('.notes-minigame-observation-container');
        if (observationContainer) {
            const observationDiv = observationContainer.querySelector('.notes-minigame-observation');
            const editBtn = observationContainer.querySelector('.notes-minigame-edit-btn');
            
            if (this.observationText) {
                setObservationText(observationDiv, this.observationText);
                observationDiv.dataset.raw = this.observationText;
                observationDiv.style.color = '#666';
                observationDiv.style.cursor = 'pointer';
                observationDiv.title = 'Click to edit observations';
                if (editBtn) { editBtn.title = 'Edit observations'; editBtn.setAttribute('aria-label', editBtn.title); }
            } else {
                setObservationText(observationDiv, '');
                observationDiv.style.color = '#999';
                observationDiv.style.cursor = 'pointer';
                observationDiv.title = 'Click to add observations';
                if (editBtn) { editBtn.title = 'Add observations'; editBtn.setAttribute('aria-label', editBtn.title); }
            }
            
            // Re-attach click event listener for the observation text
            // Clone the element to remove all event listeners
            const newObservationDiv = observationDiv.cloneNode(true);
            newObservationDiv.addEventListener('click', () => this.editObservations(newObservationDiv));
            observationDiv.parentNode.replaceChild(newObservationDiv, observationDiv);
        }
        // A new page opens at its top, and the MORE cue follows what is now on it
        if (this._contentArea) this._contentArea.scrollTop = 0;
        this._syncMore();
    }
    
    parseNoteText(text) {
        // Parse note text to separate main content from observations
        const observationMatch = text.match(/\n\nObservation:\s*(.+)$/s);
        if (observationMatch) {
            return {
                mainText: text.replace(/\n\nObservation:\s*.+$/s, '').trim(),
                observationText: observationMatch[1].trim()
            };
        }
        return {
            mainText: text,
            observationText: ''
        };
    }
    
    searchNotes(searchTerm) {
        this.searchTerm = searchTerm || '';
        this.noMatch = false;
        if (this.searchTerm.trim() === '') {
            // Reset to show all notes
            this.collectedNotes = this.getCollectedNotes();
            this.currentNoteIndex = 0;
            this.updateDisplayedNote();
            this.updateCounter();
            return;
        }
        
        // Filter the full list, not the narrowed one, so backspacing widens the matches again.
        // The readable text, without the markdown escapes (an overheard login keeps its _ and -)
        const matchingNotes = this.getCollectedNotes().filter(note => noteMatches(note, this.searchTerm));
        
        if (matchingNotes.length > 0) {
            this.collectedNotes = matchingNotes;
            this.currentNoteIndex = 0;
            this.updateDisplayedNote();
        } else {
            // The page is left alone and the counter says No match
            this.noMatch = true;
        }
        this.updateCounter();
    }
    
    updateCounter() {
        const noteCounter = this.container.querySelector('.notes-minigame-counter');
        if (noteCounter) {
            noteCounter.textContent = this.counterText();
        }
        // Previous and Next do nothing while there is no match
        this.container.querySelectorAll('.notes-minigame-nav-button').forEach(btn => { btn.disabled = !!this.noMatch; });
    }
    
    updateNavigation() {
        // Check if navigation container exists
        let navContainer = this.container.querySelector('.notes-minigame-nav-container');
        
        // If navigation is hidden (or a filed page is shown), remove any existing navigation
        if (this.params.hideNavigation || this.showsFiledPage) {
            if (navContainer) {
                navContainer.remove();
                console.log('Navigation hidden as requested');
            }
            return;
        }
        
        // With more than one note, create the row, or fill one that init left empty
        if (this.collectedNotes.length > 1) {
            if (!navContainer) {
                navContainer = document.createElement('div');
                navContainer.className = 'notes-minigame-nav-container';
                this.placeNav(navContainer);
            }
            if (!navContainer.firstChild) this.fillNav(navContainer);
        }
        
        // Update counter if navigation exists
        this.updateCounter();
    }
    
    // Method to navigate to a specific note index
    navigateToNoteIndex(index) {
        if (index >= 0 && index < this.collectedNotes.length) {
            this.currentNoteIndex = index;
            this.updateDisplayedNote();
            this.updateCounter();
            console.log('Navigated to note at index:', index);
        }
    }
    
    editObservations(observationDiv) {
        if (this.showsFiledPage || !observationDiv) return;
        if (observationDiv.querySelector('textarea')) return; // already editing
        const currentText = (observationDiv.dataset.raw ?? observationDiv.textContent).trim();
        const isPlaceholder = currentText === 'Click edit to add your observations...';
        const originalText = isPlaceholder ? '' : currentText;
        
        // Create textarea for editing
        const textarea = document.createElement('textarea');
        textarea.value = originalText;
        textarea.className = 'notes-minigame-edit-textarea';
        textarea.placeholder = 'Add your observations here...';
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'notes-minigame-edit-buttons';
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'notes-minigame-save-btn';
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save button clicked');
            
            const newText = textarea.value.trim();
            observationDiv.dataset.raw = newText || '';
            setObservationText(observationDiv, newText);
            observationDiv.style.color = newText ? '#666' : '#999';
            
            // Update the stored observation text
            this.observationText = newText;
            
            // Save to the current note in the notes system
            this.saveObservationToNote(newText);
            
            // Remove editing elements
            textarea.remove();
            buttonContainer.remove();
            
            // Re-attach click event listener for the observation text
            const newObservationDiv = observationDiv.cloneNode(true);
            newObservationDiv.addEventListener('click', () => this.editObservations(newObservationDiv));
            observationDiv.parentNode.replaceChild(newObservationDiv, observationDiv);
        });
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'notes-minigame-cancel-btn';
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cancel button clicked');
            
            // Restore original text
            if (originalText) {
                setObservationText(observationDiv, originalText);
                observationDiv.style.color = '#666';
            } else {
                setObservationText(observationDiv, '');
                observationDiv.style.color = '#999';
            }
            
            // Remove editing elements
            textarea.remove();
            buttonContainer.remove();
            
            // Re-attach click event listener for the observation text
            const newObservationDiv = observationDiv.cloneNode(true);
            newObservationDiv.addEventListener('click', () => this.editObservations(newObservationDiv));
            observationDiv.parentNode.replaceChild(newObservationDiv, observationDiv);
        });
        
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);
        
        // Replace content with editing interface
        observationDiv.innerHTML = '';
        observationDiv.appendChild(textarea);
        observationDiv.appendChild(buttonContainer);
        
        // Focus the textarea
        textarea.focus();
        textarea.select();
    }
    
    saveObservationToNote(newObservationText) {
        // A filed page is not a Notepad note; index 0 would be the Mission Brief
        if (this.showsFiledPage) return;
        // Update the current note in the notes system
        const currentNote = this.collectedNotes[this.currentNoteIndex];
        if (currentNote) {
            // Parse the existing text to separate main content from observations
            const noteParts = this.parseNoteText(currentNote.text);
            
            // Update the observation text
            noteParts.observationText = newObservationText;
            
            // Reconstruct the full text
            let fullText = noteParts.mainText;
            if (newObservationText) {
                fullText += `\n\nObservation: ${newObservationText}`;
            }
            
            // Update the note in the notes system
            currentNote.text = fullText;
            
            // Also update in the global notes system if it exists
            if (window.gameState && window.gameState.notes) {
                const globalNote = window.gameState.notes.find(note => 
                    note.title === currentNote.title && note.timestamp === currentNote.timestamp
                );
                if (globalNote) {
                    globalNote.text = fullText;
                }
            }
            
            console.log('Observation saved to note:', currentNote.title);
        }
    }
    
    start() {
        super.start();
        console.log("Notes minigame started");
        
        // Always refresh collected notes to ensure we have the latest data
        this.collectedNotes = this.getCollectedNotes();
        console.log("Refreshed collected notes on start:", this.collectedNotes);
        
        // Navigate to specific note if requested
        if (this.params.navigateToNote !== null && this.params.navigateToNote !== undefined) {
            this.currentNoteIndex = this.params.navigateToNote;
            console.log('Navigated to requested note at index:', this.currentNoteIndex);
        }
        
        // Automatically add current note to notes system when starting
        if (this.autoAddToNotes && window.addNote && this.originalNoteContent) {
            const noteTitle = this.item?.scenarioData?.name || 'Note';
            const isImportant = this.item?.scenarioData?.important || false;

            // Dedup by title + base content (strip any observation suffix before comparing).
            // This prevents a second copy being created after the player edits their observation.
            const existingNote = window.gameState.notes.find(note => {
                if (note.title !== noteTitle) return false;
                const storedBase = note.text.split('\n\nObservation:')[0];
                return storedBase === this.noteContent;
            });

            let addedNote;
            if (existingNote) {
                console.log('Note already exists, not adding duplicate:', noteTitle);
                addedNote = existingNote;
                // Restore the player\'s previously saved observation so the UI shows it
                const parts = existingNote.text.split('\n\nObservation:');
                if (parts.length > 1) {
                    this.observationText = parts.slice(1).join('\n\nObservation:').trim();
                }
            } else {
                const noteText = this.noteContent + (this.observationText ? `\n\nObservation: ${this.observationText}` : '');
                addedNote = window.addNote(noteTitle, noteText, isImportant);
            }
            if (addedNote) {
                console.log('Note automatically added to notes system on start:', addedNote);
                // Refresh collected notes
                this.collectedNotes = this.getCollectedNotes();
                console.log('Refreshed collected notes after adding new note:', this.collectedNotes);
                
                // Find the index of the newly added note and navigate to it
                const newNoteIndex = this.collectedNotes.findIndex(note => 
                    note.id === addedNote.id
                );
                if (newNoteIndex !== -1) {
                    // Only navigate to the new note if we're not already navigating to a specific note
                    if (this.params.navigateToNote === null || this.params.navigateToNote === undefined) {
                        this.currentNoteIndex = newNoteIndex;
                        console.log('Navigated to newly added note at index:', newNoteIndex);
                    }
                }
                
                // Update the UI to show all collected notes
                this.updateDisplayedNote();
                this.updateCounter();
                this.updateNavigation();
                
                // Automatically remove the note from the scene
                this.removeNoteFromScene();
            }
        }
        
        // A filed page stays as init drew it: updating would swap it for note 1
        if (this.showsFiledPage) {
            this.updateNavigation();
            return;
        }
        
        // Always update the UI to show the current note, even if no note was added
        this.updateDisplayedNote();
        this.updateCounter();
        this.updateNavigation();
    }
    
    complete(success) {
        // Call parent complete with result
        super.complete(success, this.gameResult);
    }
    
    cleanup() {
        this._moreObserver?.disconnect?.();
        this._moreObserver = null;
        super.cleanup();
        // Read by the viewer's onComplete, which runs just after: a close by the framework
        // alone (a hit's fallback, a conversation starting) never set closedByPlayer
        NotesMinigame.lastCloseWasOwn = this.closedByPlayer === true;
    }
}

/**
 * Whether the notepad draws a Continue button (A05): only when it opens as the Mission
 * Brief popup at game start (showMissionBrief passes missionBrief: true). Reading the brief
 * later from the notepad, or any other note, has the X and Esc only. Pure.
 */
export function notesShowsContinue(params) {
    return params?.missionBrief === true;
}

// Export the minigame for the framework to register
// The registration is handled in the main minigames/index.js file

// Function to show mission brief via notes minigame
export function showMissionBrief() {
    if (!window.gameScenario || !window.gameScenario.scenario_brief) {
        console.warn('No mission brief available');
        return;
    }
    
    const missionBriefItem = {
        scene: null,
        scenarioData: {
            type: 'notes',
            name: 'Mission Brief',
            text: window.gameScenario.scenario_brief,
            important: false
        }
    };
    
    startNotesMinigame(missionBriefItem, window.gameScenario.scenario_brief, '', null, true, true, { missionBrief: true });
}

// What the notepad last showed (client-only, never synced: it lasts until a reload).
const notepadMemory = { seenCount: 0, lastIndex: 0 };

/**
 * The page the notepad opens on: the newest note when one was added since it was last
 * looked at (a fact just noted, shot 04 opened on page 1), else the page last shown.
 * Pure: notes is the notes list, memory { seenCount, lastIndex }.
 */
export function notepadStartIndex(notes, memory = notepadMemory) {
    const count = Array.isArray(notes) ? notes.length : 0;
    if (count === 0) return 0;
    const seen = Number(memory?.seenCount) || 0;
    if (count > seen) return count - 1;
    const last = Number(memory?.lastIndex) || 0;
    return last >= 0 && last < count ? last : 0;
}

/**
 * What the notepad remembers after showing a note: the full notes list's length, and the
 * shown note's place in that list. A search shows a filtered list, so the note is found
 * in the full list by identity, then by id; the shown index is the fallback.
 * Pure: allNotes is the full notes list.
 */
export function notepadMemoryFor(allNotes, shownNote, shownIndex = 0) {
    const notes = Array.isArray(allNotes) ? allNotes : [];
    let lastIndex = notes.indexOf(shownNote);
    if (lastIndex < 0 && shownNote && shownNote.id != null) {
        lastIndex = notes.findIndex(n => n && n.id === shownNote.id);
    }
    if (lastIndex < 0) lastIndex = Number(shownIndex) || 0;
    return { seenCount: notes.length, lastIndex };
}
if (typeof window !== 'undefined') {
    window.notepadStartIndex = () => notepadStartIndex(window.gameState?.notes);
}

// Function to start the notes minigame
export function startNotesMinigame(item, noteContent, observationText, navigateToNote = null, hideNavigation = false, autoAddToNotes = true, options = {}) {
    console.log('Starting notes minigame with:', { item, noteContent, observationText, navigateToNote, hideNavigation, autoAddToNotes });
    
    // Play page turn sound on open
    try {
        if (window.game && window.game.sound) {
            const sound = window.game.sound.get('page_turn') || window.game.sound.add('page_turn');
            sound.play({ volume: 0.8 });
        }
    } catch (e) {
        // Sound not available, ignore
    }
    
    // Make sure the minigame is registered
    if (window.MinigameFramework && !window.MinigameFramework.registeredScenes['notes']) {
        window.MinigameFramework.registerScene('notes', NotesMinigame);
        console.log('Notes minigame registered on demand');
    }
    
    // Initialize the framework if not already done
    if (!window.MinigameFramework.mainGameScene && item && item.scene) {
        window.MinigameFramework.init(item.scene);
    }
    
    // Start the notes minigame with proper parameters
    const params = {
        title: item?.scenarioData?.name || 'Reading Notes',
        item: item,
        noteContent: noteContent,
        observationText: observationText,
        autoAddToNotes: autoAddToNotes, // Automatically add notes to the notes system
        navigateToNote: navigateToNote, // Which note to navigate to
        hideNavigation: hideNavigation, // Whether to hide navigation buttons
        missionBrief: options?.missionBrief === true, // the game-start brief keeps Continue (A05)
        requiresKeyboardInput: true, // Notes minigame has editable observations and search
        onComplete: (success, result) => {
            if (success && result && result.addedToInventory) {
                console.log('NOTES SUCCESS - Added to inventory', result);
                
                // Show notification
                if (window.showNotification) {
                    window.showNotification('Note added to inventory', 'success');
                } else if (window.gameAlert) {
                    window.gameAlert('Note added to inventory', 'success', 'Item Collected', 3000);
                }
            } else {
                console.log('NOTES COMPLETED - Not added to inventory');
            }
            
            // The returns below happen only after the player's own close (Close, Esc) or the
            // viewer finishing; never after a hit, the knockout screen, a conversation
            // starting, or a room change (lab UX review M1). A note to take is still taken.
            const ownClose = success === true || NotesMinigame.lastCloseWasOwn === true;
            const arm = window.containerReturnArm?.() || null;
            const blocked = () => (typeof window.containerReturnBlocked === 'function'
                ? window.containerReturnBlocked(arm, ownClose) : (ownClose ? null : 'not_own_close'));
            const dropReturns = () => {
                window.pendingPhoneReturn = null;
                window.pendingTextFileReturn = null;
            };

            // Check if we need to return to a container after notes minigame. A file read
            // from a container comes back first (below), and its own X then spends the
            // container's return (R4 m1). A note to take (itemToTake) is always handled here.
            const fileFirst = !!window.pendingTextFileReturn && !!window.returnToTextFileAfterNotes
                && !window.pendingContainerReturn?.itemToTake;
            if (window.pendingContainerReturn && window.returnToContainerAfterNotes && !fileFirst) {
                console.log('Returning to container after notes minigame');
                // The notes panel is closing and the container opens 100 ms later. Held
                // toasts released in that gap showed, were pulled back by the container
                // and showed again on close (F13, engine F24).
                if (ownClose) window.expectPanelWithin?.(1000);
                const back = window.pendingContainerReturn;
                // Small delay to ensure notes minigame cleanup completes
                setTimeout(() => {
                    if (window.pendingContainerReturn !== back) return;
                    window.returnToContainerAfterNotes({ reopen: !blocked() });
                }, ownClose ? 100 : 0);
            }
            
            // Check if we need to return to phone after notes minigame
            if (window.pendingPhoneReturn && window.returnToPhoneAfterNotes) {
                if (!ownClose) { dropReturns(); return; }
                console.log('Returning to phone after notes minigame');
                window.expectPanelWithin?.(1000); // held toasts wait for it (F13, engine F24)
                // Small delay to ensure notes minigame cleanup completes
                setTimeout(() => {
                    if (blocked()) { dropReturns(); return; }
                    window.returnToPhoneAfterNotes();
                }, 100);
            }
            
            // Check if we need to return to text file after notes minigame
            if (window.pendingTextFileReturn && window.returnToTextFileAfterNotes) {
                if (!ownClose) { dropReturns(); window.pendingContainerReturn = null; return; }
                console.log('Returning to text file after notes minigame');
                window.expectPanelWithin?.(1000); // held toasts wait for it (F13, engine F24)
                // Small delay to ensure notes minigame cleanup completes
                setTimeout(() => {
                    if (blocked()) { dropReturns(); window.pendingContainerReturn = null; return; }
                    window.returnToTextFileAfterNotes();
                }, 100);
            }
        }
    };
    
    console.log('Starting minigame with params:', params);
    window.MinigameFramework.startMinigame('notes', null, params);
}

// Unique note ids: the timestamp plus a counter, so several notes added in one
// millisecond (a call grants three facts in one run) do not collide in the sync merge.
let noteIdCounter = 0;
function nextNoteId() {
    noteIdCounter = (noteIdCounter + 1) % 1000;
    return Date.now() * 1000 + noteIdCounter;
}

// Global addNote function for compatibility with the old notes system
window.addNote = function(title, text, important = false) {
    // Tolerate a missing body: a caller (e.g. introduceScenario with a scenario that
    // ships no scenario_brief) may pass undefined/null. Coerce to '' so text.length and
    // the later text.split calls never throw. A brief-less note is simply empty.
    text = (text == null) ? '' : String(text);
    console.log('Global addNote called:', { title, important, textLength: text.length });
    
    // Initialize game state if not exists
    if (!window.gameState) {
        window.gameState = {};
    }
    if (!window.gameState.notes) {
        window.gameState.notes = [];
    }
    
    // Dedup by title + base content (strip observation suffix before comparing).
    // This prevents a duplicate when re-reading a note the player has annotated.
    const newBase = text.split('\n\nObservation:')[0];
    const existingNote = window.gameState.notes.find(note => {
        if (note.title !== title) return false;
        const storedBase = note.text.split('\n\nObservation:')[0];
        return storedBase === newBase;
    });
    
    // If the note already exists, don't add it again but mark it as read
    if (existingNote) {
        console.log(`Note "${title}" already exists, not adding duplicate`);
        
        // Mark as read if it wasn't already
        if (!existingNote.read) {
            existingNote.read = true;
        }
        
        return existingNote;
    }
    
    const note = {
        id: nextNoteId(),
        title: title,
        text: text,
        timestamp: new Date(),
        read: false,
        important: important
    };
    
    console.log('Note created:', note);
    
    window.gameState.notes.push(note);
    
    
    return note;
};
