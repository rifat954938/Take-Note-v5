// TakeNote App - Current Version with All Features

// Application State
let notes = JSON.parse(localStorage.getItem('takenote-notes')) || [];
let currentNoteId = null;
let noteIdCounter = parseInt(localStorage.getItem('takenote-counter')) || 0;

// DOM Elements
const editor = document.getElementById('editor');
const notesList = document.getElementById('notes-list');
const newNoteBtn = document.getElementById('new-note-btn');
const uploadBtn = document.getElementById('upload-btn');
const downloadBtn = document.getElementById('download-btn');
const fileInput = document.getElementById('file-input');
const headingSelect = document.getElementById('heading-select');
const deleteModal = document.getElementById('delete-modal');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

// Counter elements
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');
const sentenceCount = document.getElementById('sentence-count');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    attachEventListeners();
});

function initializeApp() {
    renderNotesList();
    if (notes.length > 0) {
        loadNote(notes[0].id);
    } else {
        createNewNote();
    }
    updateCounters();
}

function attachEventListeners() {
    // Main button events
    newNoteBtn.addEventListener('click', createNewNote);
    uploadBtn.addEventListener('click', () => fileInput.click());
    downloadBtn.addEventListener('click', downloadCurrentNote);
    fileInput.addEventListener('change', handleFileUpload);
    
    // Editor events
    editor.addEventListener('input', handleEditorInput);
    editor.addEventListener('paste', handlePaste);
    
    // Heading selector
    headingSelect.addEventListener('change', applyHeading);
    
    // Notes list click handling (for inline editing)
    notesList.addEventListener('click', handleNotesListClick);
    
    // Modal events
    modalCancel.addEventListener('click', hideDeleteModal);
    modalConfirm.addEventListener('click', confirmDelete);
    
    // Close modal on backdrop click
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            hideDeleteModal();
        }
    });
    
    // Auto-save on page unload
    window.addEventListener('beforeunload', saveCurrentNote);
}

// Note Management Functions
function createNewNote() {
    saveCurrentNote();
    
    const newNote = {
        id: ++noteIdCounter,
        title: `Note ${noteIdCounter}`,
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    notes.unshift(newNote);
    currentNoteId = newNote.id;
    
    editor.innerHTML = '';
    editor.focus();
    
    saveNotesToStorage();
    renderNotesList();
    updateCounters();
}

function loadNote(noteId) {
    saveCurrentNote();
    
    const note = notes.find(n => n.id === noteId);
    if (note) {
        currentNoteId = noteId;
        editor.innerHTML = note.content || '';
        updateActiveNote();
        updateCounters();
    }
}

function saveCurrentNote() {
    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            note.content = editor.innerHTML;
            note.updatedAt = new Date().toISOString();
            
            // Auto-generate title from content if empty
            if (!note.title || note.title.startsWith('Note ')) {
                const textContent = editor.textContent.trim();
                if (textContent) {
                    note.title = textContent.substring(0, 30) + (textContent.length > 30 ? '...' : '');
                }
            }
            
            saveNotesToStorage();
            renderNotesList();
        }
    }
}

function deleteNote(noteId) {
    currentDeleteNoteId = noteId;
    showDeleteModal();
}

// Custom Delete Modal Functions
let currentDeleteNoteId = null;

function showDeleteModal() {
    deleteModal.classList.remove('modal-hidden');
    document.body.style.overflow = 'hidden';
}

function hideDeleteModal() {
    deleteModal.classList.add('modal-hidden');
    document.body.style.overflow = 'auto';
    currentDeleteNoteId = null;
}

function confirmDelete() {
    if (currentDeleteNoteId) {
        const noteIndex = notes.findIndex(n => n.id === currentDeleteNoteId);
        if (noteIndex !== -1) {
            notes.splice(noteIndex, 1);
            
            if (currentNoteId === currentDeleteNoteId) {
                if (notes.length > 0) {
                    loadNote(notes[0].id);
                } else {
                    createNewNote();
                    return;
                }
            }
            
            saveNotesToStorage();
            renderNotesList();
        }
    }
    hideDeleteModal();
}

// Inline Title Editing
function handleNotesListClick(e) {
    if (e.target.classList.contains('note-title') && !e.target.querySelector('input')) {
        const noteId = parseInt(e.target.closest('.notes-list-item').dataset.noteId);
        startTitleEdit(e.target, noteId);
    } else if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        const noteId = parseInt(e.target.closest('.notes-list-item').dataset.noteId);
        deleteNote(noteId);
    } else if (e.target.closest('.notes-list-item') && !e.target.classList.contains('delete-btn')) {
        const noteId = parseInt(e.target.closest('.notes-list-item').dataset.noteId);
        loadNote(noteId);
    }
}

function startTitleEdit(titleElement, noteId) {
    const currentTitle = titleElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'title-edit-input';
    
    titleElement.innerHTML = '';
    titleElement.appendChild(input);
    input.focus();
    input.select();
    
    function finishEdit() {
        const newTitle = input.value.trim() || currentTitle;
        const note = notes.find(n => n.id === noteId);
        if (note) {
            note.title = newTitle;
            note.updatedAt = new Date().toISOString();
            saveNotesToStorage();
        }
        titleElement.textContent = newTitle;
    }
    
    input.addEventListener('blur', finishEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        }
    });
}

// Rich Text Formatting
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus();
}

function applyHeading() {
    const heading = headingSelect.value;
    formatText('formatBlock', heading);
}

// File Operations
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            
            // Create new note with uploaded content
            const newNote = {
                id: ++noteIdCounter,
                title: file.name.replace(/\.[^/.]+$/, ""),
                content: content.replace(/\n/g, '<br>'),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            notes.unshift(newNote);
            currentNoteId = newNote.id;
            
            editor.innerHTML = newNote.content;
            saveNotesToStorage();
            renderNotesList();
            updateCounters();
        };
        reader.readAsText(file);
    }
    fileInput.value = '';
}

function downloadCurrentNote() {
    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            const textContent = editor.textContent || 'Empty note';
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${note.title}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
}

// UI Functions
function renderNotesList() {
    notesList.innerHTML = '';
    
    notes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'notes-list-item';
        li.dataset.noteId = note.id;
        
        if (note.id === currentNoteId) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <span class="note-title">${note.title}</span>
            <button class="delete-btn" title="Delete note">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        notesList.appendChild(li);
    });
}

function updateActiveNote() {
    document.querySelectorAll('.notes-list-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.noteId) === currentNoteId) {
            item.classList.add('active');
        }
    });
}

function updateCounters() {
    const text = editor.textContent || '';
    
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length : 0;
    
    wordCount.textContent = `Words: ${words}`;
    charCount.textContent = `Characters: ${characters}`;
    sentenceCount.textContent = `Sentences: ${sentences}`;
}

// Event Handlers
function handleEditorInput() {
    updateCounters();
    // Auto-save after 2 seconds of inactivity
    clearTimeout(handleEditorInput.timeout);
    handleEditorInput.timeout = setTimeout(saveCurrentNote, 2000);
}

function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
}

// Navigation Functions
function goHome() {
    // Refresh the page to go to home
    location.reload();
}

// Storage Functions
function saveNotesToStorage() {
    localStorage.setItem('takenote-notes', JSON.stringify(notes));
    localStorage.setItem('takenote-counter', noteIdCounter.toString());
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
    }
    
    // Ctrl/Cmd + N to create new note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }
    
    // ESC to close modal
    if (e.key === 'Escape') {
        hideDeleteModal();
    }
});

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}