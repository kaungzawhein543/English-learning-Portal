// Data structures
let topics = JSON.parse(localStorage.getItem('topics')) || [];
let grammarNotes = JSON.parse(localStorage.getItem('grammarNotes')) || [];

// DOM elements
const topicsTab = document.getElementById('topicsTab');
const grammarTab = document.getElementById('grammarTab');
const topicsSection = document.getElementById('topicsSection');
const grammarSection = document.getElementById('grammarSection');
const topicForm = document.getElementById('topicForm');
const grammarForm = document.getElementById('grammarForm');
const parentIdSelect = document.getElementById('parentId');
const treeList = document.getElementById('treeList');
const notesContainer = document.getElementById('notesContainer');
const addVocabBtn = document.getElementById('addVocabBtn');
const vocabList = document.getElementById('vocabList');
const topicSearch = document.getElementById('topicSearch');
const grammarSearch = document.getElementById('grammarSearch');
const themeToggle = document.getElementById('themeToggle');

// Dark Mode Initialization
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Temp vocab for form
let tempVocab = [];

// Tab switching
topicsTab.addEventListener('click', () => {
    topicsTab.classList.add('active');
    grammarTab.classList.remove('active');
    topicsSection.classList.remove('hidden');
    grammarSection.classList.add('hidden');
});

grammarTab.addEventListener('click', () => {
    grammarTab.classList.add('active');
    topicsTab.classList.remove('active');
    grammarSection.classList.remove('hidden');
    topicsSection.classList.add('hidden');
});

// Add vocab to temp list
addVocabBtn.addEventListener('click', () => {
    const word = document.getElementById('vocabWord').value.trim();
    const def = document.getElementById('vocabDef').value.trim();
    if (word && def) {
        tempVocab.push({ word, definition: def });
        document.getElementById('vocabWord').value = '';
        document.getElementById('vocabDef').value = '';
        renderTempVocab();
    }
});

// Add topic
topicForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const parentId = document.getElementById('parentId').value || null;
    const content = document.getElementById('content').value;

    const newTopic = {
        id: Date.now().toString(),
        title,
        description,
        parentId,
        content,
        vocab: [...tempVocab]
    };

    topics.push(newTopic);
    saveTopics();
    updateParentSelect();
    renderTree();
    topicForm.reset();
    tempVocab = [];
    renderTempVocab();
});

// Add grammar note
grammarForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const level = document.getElementById('level').value;
    const pattern = document.getElementById('pattern').value;
    const explanation = document.getElementById('explanation').value;
    const examples = document.getElementById('examples').value;

    // Parse examples by newline and remove empty lines
    const examplesList = examples.split('\n').map(ex => ex.trim()).filter(ex => ex.length > 0);

    const newNote = {
        id: Date.now().toString(),
        level,
        pattern,
        explanation,
        examples: examplesList
    };

    grammarNotes.push(newNote);
    saveGrammarNotes();
    renderGrammarNotes();
    grammarForm.reset();
});

// Save to localStorage
function saveTopics() {
    localStorage.setItem('topics', JSON.stringify(topics));
}

function saveGrammarNotes() {
    localStorage.setItem('grammarNotes', JSON.stringify(grammarNotes));
}

// Update parent select options
function updateParentSelect() {
    parentIdSelect.innerHTML = '<option value="">None (Root)</option>';
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic.id;
        option.textContent = topic.title;
        parentIdSelect.appendChild(option);
    });
}

// Render topic tree
function renderTree(searchQuery = '') {
    treeList.innerHTML = '';
    const query = searchQuery.toLowerCase();

    // Function to check if a topic or its children match the query
    function topicMatchesQuery(topic) {
        if (!query) return true;
        if (topic.title.toLowerCase().includes(query)) return true;
        if (topic.description && topic.description.toLowerCase().includes(query)) return true;
        if (topic.content && topic.content.toLowerCase().includes(query)) return true;

        // Also check vocabulary
        if (topic.vocab) {
            for (const v of topic.vocab) {
                if (v.word.toLowerCase().includes(query) || v.definition.toLowerCase().includes(query)) {
                    return true;
                }
            }
        }

        // Check children recursively
        const children = topics.filter(t => t.parentId === topic.id);
        return children.some(child => topicMatchesQuery(child));
    }

    const rootTopics = topics.filter(t => t.parentId === null);
    rootTopics.forEach(topic => {
        if (topicMatchesQuery(topic)) {
            const li = createTopicElement(topic, query);
            treeList.appendChild(li);
        }
    });
}

function createTopicElement(topic, query = '') {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'topic-item';

    // Check if this specific node matches (used for highlighting or expanding)
    let isDirectMatch = false;
    if (query) {
        if (topic.title.toLowerCase().includes(query) ||
            (topic.description && topic.description.toLowerCase().includes(query)) ||
            (topic.content && topic.content.toLowerCase().includes(query))) {
            isDirectMatch = true;
        }
        if (topic.vocab) {
            for (const v of topic.vocab) {
                if (v.word.toLowerCase().includes(query) || v.definition.toLowerCase().includes(query)) {
                    isDirectMatch = true;
                    break;
                }
            }
        }
        if (isDirectMatch) div.classList.add('search-match');
    }

    const h3 = document.createElement('h3');
    h3.textContent = topic.title;
    div.appendChild(h3);

    if (topic.description) {
        const p = document.createElement('p');
        p.textContent = topic.description;
        div.appendChild(p);
    }

    if (topic.content) {
        const p = document.createElement('p');
        p.textContent = topic.content;
        div.appendChild(p);
    }

    if (topic.vocab && topic.vocab.length > 0) {
        const vocabDiv = document.createElement('div');
        vocabDiv.className = 'vocab-section';
        const vocabH4 = document.createElement('h4');
        vocabH4.textContent = 'Vocabulary:';
        vocabDiv.appendChild(vocabH4);
        const vocabUl = document.createElement('ul');
        topic.vocab.forEach(item => {
            const vocabLi = document.createElement('li');
            vocabLi.innerHTML = `<strong>${item.word}</strong>: ${item.definition}`;
            vocabUl.appendChild(vocabLi);
        });
        vocabDiv.appendChild(vocabUl);
        div.appendChild(vocabDiv);
    }

    // Add vocab button
    const addVocabBtn = document.createElement('button');
    addVocabBtn.textContent = 'Add Vocab';
    addVocabBtn.className = 'add-vocab-btn';
    addVocabBtn.addEventListener('click', () => toggleVocabForm(topic.id, div));
    div.appendChild(addVocabBtn);

    li.appendChild(div);

    // Function to recursively check children logic from before
    function topicMatchesQuery(t, q) {
        if (!q) return true;
        if (t.title.toLowerCase().includes(q)) return true;
        if (t.description && t.description.toLowerCase().includes(q)) return true;
        if (t.content && t.content.toLowerCase().includes(q)) return true;
        if (t.vocab && t.vocab.some(v => v.word.toLowerCase().includes(q) || v.definition.toLowerCase().includes(q))) return true;
        const children = topics.filter(child => child.parentId === t.id);
        return children.some(child => topicMatchesQuery(child, q));
    }

    const children = topics.filter(t => t.parentId === topic.id);
    if (children.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'nested';
        if (query) ul.style.display = 'block'; // auto-expand if searching
        let hasMatchingChildren = false;

        children.forEach(child => {
            if (topicMatchesQuery(child, query)) {
                ul.appendChild(createTopicElement(child, query));
                hasMatchingChildren = true;
            }
        });
        if (hasMatchingChildren) li.appendChild(ul);
    }

    return li;
}

// Render grammar notes
function renderGrammarNotes(searchQuery = '') {
    notesContainer.innerHTML = '';
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const query = searchQuery.toLowerCase();

    levels.forEach(level => {
        let levelNotes = grammarNotes.filter(n => n.level === level);

        if (query) {
            levelNotes = levelNotes.filter(n => {
                // Support backward compatibility for objects with 'note' instead of modern structure
                if (n.note) return n.note.toLowerCase().includes(query);

                const matchPattern = n.pattern && n.pattern.toLowerCase().includes(query);
                const matchExplanation = n.explanation && n.explanation.toLowerCase().includes(query);
                const matchExamples = n.examples && n.examples.some(ex => ex.toLowerCase().includes(query));

                return matchPattern || matchExplanation || matchExamples;
            });
        }

        // Skip rendering section if empty and searching
        if (query && levelNotes.length === 0) return;

        const section = document.createElement('div');
        section.className = 'level-section';

        const h3 = document.createElement('h3');
        h3.textContent = `${level} Level`;
        section.appendChild(h3);

        if (levelNotes.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No notes for this level.';
            p.style.color = '#999';
            section.appendChild(p);
        } else {
            levelNotes.forEach(noteObj => {
                const div = document.createElement('div');
                div.className = 'note-item';

                // Robust Fallback for previous data structure
                if (!noteObj.pattern && !noteObj.explanation && noteObj.note) {
                    div.innerHTML = `<p>${noteObj.note}</p>`;
                } else {
                    let html = `<div class="grammar-header"><h4><span class="grammar-label">Pattern:</span> ${noteObj.pattern || 'N/A'}</h4></div>`;
                    if (noteObj.explanation) {
                        html += `<div class="grammar-explanation"><p><strong>Explanation:</strong> ${noteObj.explanation}</p></div>`;
                    }

                    if (noteObj.examples && Array.isArray(noteObj.examples) && noteObj.examples.length > 0) {
                        html += `<div class="grammar-examples"><strong>Examples:</strong><ul>`;
                        noteObj.examples.forEach(ex => {
                            html += `<li>${ex}</li>`;
                        });
                        html += `</ul></div>`;
                    }
                    div.innerHTML = html;
                }

                section.appendChild(div);
            });
        }
        notesContainer.appendChild(section);
    });
}

// Toggle vocab form for existing topic
function toggleVocabForm(topicId, topicDiv) {
    const existingForm = topicDiv.querySelector('.vocab-form');
    if (existingForm) {
        existingForm.remove();
        return;
    }

    const formDiv = document.createElement('div');
    formDiv.className = 'vocab-form';
    formDiv.innerHTML = `
        <div class="form-group">
            <label>English Word:</label>
            <input type="text" class="vocab-word-input">
        </div>
        <div class="form-group">
            <label>Definition:</label>
            <input type="text" class="vocab-def-input">
        </div>
        <button class="add-existing-vocab-btn">Add</button>
        <button class="cancel-vocab-btn">Cancel</button>
    `;

    const addBtn = formDiv.querySelector('.add-existing-vocab-btn');
    const cancelBtn = formDiv.querySelector('.cancel-vocab-btn');

    addBtn.addEventListener('click', () => {
        const word = formDiv.querySelector('.vocab-word-input').value.trim();
        const def = formDiv.querySelector('.vocab-def-input').value.trim();
        if (word && def) {
            addVocabToTopic(topicId, { word, definition: def });
            formDiv.remove();
            renderTree();
        }
    });

    cancelBtn.addEventListener('click', () => {
        formDiv.remove();
    });

    topicDiv.appendChild(formDiv);
}

// Add vocab to existing topic
function addVocabToTopic(topicId, vocabItem) {
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
        if (!topic.vocab) topic.vocab = [];
        topic.vocab.push(vocabItem);
        saveTopics();
    }
}

// Render temp vocab list
function renderTempVocab() {
    vocabList.innerHTML = '';
    tempVocab.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'vocab-item';
        div.innerHTML = `
            <span><strong>${item.word}</strong>: ${item.definition}</span>
            <button class="remove-vocab" data-index="${index}">Remove</button>
        `;
        vocabList.appendChild(div);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-vocab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            tempVocab.splice(index, 1);
            renderTempVocab();
        });
    });
}

// Search Event Listeners
if (topicSearch) {
    topicSearch.addEventListener('input', (e) => {
        renderTree(e.target.value);
    });
}

if (grammarSearch) {
    grammarSearch.addEventListener('input', (e) => {
        renderGrammarNotes(e.target.value);
    });
}

// Initialize
updateParentSelect();
renderTree();
renderGrammarNotes();