import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { renderNoteMarkdown } from '../../utils/note-markdown.js';

// Load fonts
const fontLink1 = document.createElement('link');
fontLink1.href = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap';
fontLink1.rel = 'stylesheet';
if (!document.querySelector('link[href*="Pixelify+Sans"]')) {
    document.head.appendChild(fontLink1);
}

const fontLink2 = document.createElement('link');
fontLink2.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
fontLink2.rel = 'stylesheet';
if (!document.querySelector('link[href*="VT323"]')) {
    document.head.appendChild(fontLink2);
}

// Notes Minigame Scene implementation
export class NotesMinigame extends MinigameScene {
    constructor(container, params) {
        // Ensure params is defined before calling parent constructor
        params = params || {};
        
        // Set default title if not provided
        if (!params.title) {
            params.title = 'Reading Notes';
        }
        
        // Enable cancel button for notes minigame with custom text
        params.showCancel = true;
        params.cancelText = 'Continue';
        
        super(container, params);
        
        this.item = params.item;
        this.originalNoteContent = params.noteContent || this.item?.scenarioData?.noteContent || this.item?.scenarioData?.text || '';
        this.noteContent = this.originalNoteContent || 'No content available';
        this.observationText = params.observationText || this.item?.scenarioData?.observationText || this.item?.scenarioData?.observations || '';
        
        // Initialize note navigation
        this.currentNoteIndex = 0;
        this.collectedNotes = this.getCollectedNotes();
        this.autoAddToNotes = true;
    }
        /** Test bridge state (see MinigameScene.getTestState). */
    getTestState() {
        return {
            ...super.getTestState(),
            noteName: this.item?.scenarioData?.name || null,
            noteContent: String(this.noteContent || '').slice(0, 2000),
            observationText: String(this.observationText || '').slice(0, 1000),
            noteIndex: this.currentNoteIndex,
            noteCount: (this.collectedNotes || []).length
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
        contentArea.className = 'notes-minigame-content-area';

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
                    observationDiv.innerHTML = displayDashes(this.observationText);
                    observationDiv.dataset.raw = this.observationText;
                    observationDiv.style.cursor = 'pointer'; // Make it clear it's clickable
                    observationDiv.title = 'Click to edit observations';
                    observationDiv.addEventListener('click', () => this.editObservations(observationDiv));

                    // Add edit button
                    const editBtn = document.createElement('button');
                    editBtn.className = 'notes-minigame-edit-btn';
                    editBtn.title = 'Edit observations';

                    // Add pencil icon
                    const pencilIcon = document.createElement('img');
                    pencilIcon.src = '/break_escape/assets/icons/pencil.png';
                    pencilIcon.alt = 'Edit';
                    editBtn.appendChild(pencilIcon);

                    editBtn.addEventListener('click', () => this.editObservations(observationDiv));

                    observationContainer.appendChild(observationDiv);
                    observationContainer.appendChild(editBtn);
                    contentArea.appendChild(observationContainer);
                } else {
                    // Add empty observation area with edit button
                    const observationContainer = document.createElement('div');
                    observationContainer.className = 'notes-minigame-observation-container';

                    const observationDiv = document.createElement('div');
                    observationDiv.className = 'notes-minigame-observation empty';
                    observationDiv.innerHTML = '<em>Click edit to add your observations...</em>';
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

                    editBtn.addEventListener('click', () => this.editObservations(observationDiv));

                    observationContainer.appendChild(observationDiv);
                    observationContainer.appendChild(editBtn);
                    contentArea.appendChild(observationContainer);
                }

        // Add content area to notepad container, then notepad container to game container
        notepadContainer.appendChild(contentArea);
        this.gameContainer.appendChild(notepadContainer);
        
        // Create navigation buttons container (only if navigation is not hidden)
        if (!this.params.hideNavigation) {
            const navContainer = document.createElement('div');
            navContainer.className = 'notes-minigame-nav-container';
            
            // Add search input if there are multiple notes
            if (this.collectedNotes.length > 1) {
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
                
                // Add note counter
                const noteCounter = document.createElement('div');
                noteCounter.className = 'notes-minigame-counter';
                noteCounter.textContent = `${this.currentNoteIndex + 1}/${this.collectedNotes.length}`;
                navContainer.appendChild(noteCounter);
                
                this.container.appendChild(navContainer);
            }
        }
        
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
        if (this.collectedNotes.length <= 1) return;
        
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
        const noteCounter = this.container.querySelector('.notes-minigame-counter');
        if (noteCounter) {
            noteCounter.textContent = `${this.currentNoteIndex + 1} / ${this.collectedNotes.length}`;
        }
    }
    
    updateDisplayedNote() {
        const currentNote = this.collectedNotes[this.currentNoteIndex];
        if (!currentNote) return;
        
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
                observationDiv.innerHTML = displayDashes(this.observationText);
                observationDiv.dataset.raw = this.observationText;
                observationDiv.style.color = '#666';
                observationDiv.style.cursor = 'pointer';
                observationDiv.title = 'Click to edit observations';
                editBtn.title = 'Edit observations';
            } else {
                observationDiv.innerHTML = '<em>Click edit to add your observations...</em>';
                observationDiv.style.color = '#999';
                observationDiv.style.cursor = 'pointer';
                observationDiv.title = 'Click to add observations';
                editBtn.title = 'Add observations';
            }
            
            // Re-attach click event listener for the observation text
            // Clone the element to remove all event listeners
            const newObservationDiv = observationDiv.cloneNode(true);
            newObservationDiv.addEventListener('click', () => this.editObservations(newObservationDiv));
            observationDiv.parentNode.replaceChild(newObservationDiv, observationDiv);
        }
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
        if (!searchTerm || searchTerm.trim() === '') {
            // Reset to show all notes
            this.collectedNotes = this.getCollectedNotes();
            this.currentNoteIndex = 0;
            this.updateDisplayedNote();
            this.updateCounter();
            return;
        }
        
        const searchLower = searchTerm.toLowerCase();
        const matchingNotes = this.collectedNotes.filter(note => 
            note.title.toLowerCase().includes(searchLower) ||
            note.text.toLowerCase().includes(searchLower)
        );
        
        if (matchingNotes.length > 0) {
            this.collectedNotes = matchingNotes;
            this.currentNoteIndex = 0;
            this.updateDisplayedNote();
            this.updateCounter();
        }
    }
    
    updateCounter() {
        const noteCounter = this.container.querySelector('.notes-minigame-counter');
        if (noteCounter) {
            noteCounter.textContent = `${this.currentNoteIndex + 1} / ${this.collectedNotes.length}`;
        }
    }
    
    updateNavigation() {
        // Check if navigation container exists
        let navContainer = this.container.querySelector('.notes-minigame-nav-container');
        
        // If navigation is hidden, remove any existing navigation
        if (this.params.hideNavigation) {
            if (navContainer) {
                navContainer.remove();
                console.log('Navigation hidden as requested');
            }
            return;
        }
        
        // If we have multiple notes and no navigation, create it
        if (this.collectedNotes.length > 1 && !navContainer) {
            navContainer = document.createElement('div');
            navContainer.className = 'notes-minigame-nav-container';
            
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
            noteCounter.textContent = `${this.currentNoteIndex + 1} / ${this.collectedNotes.length}`;
            navContainer.appendChild(noteCounter);
            
            this.container.appendChild(navContainer);
        }
        
        // Update counter if navigation exists
        if (navContainer) {
            const noteCounter = navContainer.querySelector('.notes-minigame-counter');
            if (noteCounter) {
                noteCounter.textContent = `${this.currentNoteIndex + 1} / ${this.collectedNotes.length}`;
            }
        }
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
            observationDiv.innerHTML = newText ? displayDashes(newText) : '<em>Click edit to add your observations...</em>';
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
                observationDiv.innerHTML = displayDashes(originalText);
                observationDiv.style.color = '#666';
            } else {
                observationDiv.innerHTML = '<em>Click edit to add your observations...</em>';
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
        super.cleanup();
    }
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
    
    startNotesMinigame(missionBriefItem, window.gameScenario.scenario_brief, '', null, true);
}

// Function to start the notes minigame
export function startNotesMinigame(item, noteContent, observationText, navigateToNote = null, hideNavigation = false, autoAddToNotes = true) {
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
            
            // Check if we need to return to a container after notes minigame
            if (window.pendingContainerReturn && window.returnToContainerAfterNotes) {
                console.log('Returning to container after notes minigame');
                // Small delay to ensure notes minigame cleanup completes
                setTimeout(() => {
                    window.returnToContainerAfterNotes();
                }, 100);
            }
            
            // Check if we need to return to phone after notes minigame
            if (window.pendingPhoneReturn && window.returnToPhoneAfterNotes) {
                console.log('Returning to phone after notes minigame');
                // Small delay to ensure notes minigame cleanup completes
                setTimeout(() => {
                    window.returnToPhoneAfterNotes();
                }, 100);
            }
            
            // Check if we need to return to text file after notes minigame
            if (window.pendingTextFileReturn && window.returnToTextFileAfterNotes) {
                console.log('Returning to text file after notes minigame');
                // Small delay to ensure notes minigame cleanup completes
                setTimeout(() => {
                    window.returnToTextFileAfterNotes();
                }, 100);
            }
        }
    };
    
    console.log('Starting minigame with params:', params);
    window.MinigameFramework.startMinigame('notes', null, params);
}

// Global addNote function for compatibility with the old notes system
window.addNote = function(title, text, important = false) {
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
        id: Date.now(),
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
