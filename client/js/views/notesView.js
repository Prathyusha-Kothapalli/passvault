/**
 * PassVault Secure Notes View Controller
 */

const NotesView = (function() {
  let notesList = [];

  async function render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="animate-fade-in">
        <div class="vault-header-controls">
          <div class="input-with-icon" style="flex: 1; max-width: 500px;">
            <input type="text" id="notes-search-input" class="form-control" placeholder="Search secure notes..." />
            <button class="input-icon-btn"><i class="fas fa-search"></i></button>
          </div>
          <button class="btn btn-primary" onclick="NotesView.openAddModal()">
            <i class="fas fa-plus"></i> Add Secure Note
          </button>
        </div>

        <div id="notes-grid" class="vault-grid">
          <div style="color: var(--color-text-muted); grid-column: span 12;">Loading secure notes...</div>
        </div>
      </div>

      <!-- Add/Edit Note Modal -->
      <div id="note-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="note-modal-title">Add Secure Note</h3>
            <button class="btn-icon" onclick="Modal.close('note-modal')"><i class="fas fa-times"></i></button>
          </div>
          <form id="note-form">
            <input type="hidden" id="note-id" />
            <div class="form-group">
              <label class="form-label">Note Title</label>
              <input type="text" id="note-title" class="form-control" placeholder="e.g. Master Recovery Keys, WiFi Codes" required />
            </div>
            <div class="form-group">
              <label class="form-label">Encrypted Note Content</label>
              <textarea id="note-content" class="form-control" rows="6" placeholder="Enter sensitive secret text..." required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" id="note-tags" class="form-control" placeholder="crypto, recovery, home" />
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" id="note-favorite" style="width: 16px; height: 16px; accent-color: var(--color-primary);" />
                Favorite Note
              </label>
              <div style="display: flex; gap: 12px;">
                <button type="button" class="btn btn-secondary" onclick="Modal.close('note-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Note</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('notes-search-input').addEventListener('input', (e) => filterAndRenderNotes(e.target.value));
    document.getElementById('note-form').addEventListener('submit', handleFormSubmit);

    await loadNotesData();
  }

  async function loadNotesData() {
    try {
      const res = await API.get('/notes');
      notesList = res.notes || [];
      filterAndRenderNotes();
    } catch (err) {
      Toast.show('Failed to load secure notes', 'error');
    }
  }

  async function filterAndRenderNotes(searchQuery = '') {
    const grid = document.getElementById('notes-grid');
    const masterSecret = Auth.getMasterSecret();
    const query = searchQuery.toLowerCase().trim();

    let filtered = notesList.filter(n => {
      if (query) {
        return n.title.toLowerCase().includes(query) || n.tags.toLowerCase().includes(query);
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: span 12; text-align: center; padding: 48px; color: var(--color-text-muted);">
          <i class="fas fa-sticky-note" style="font-size: 36px; margin-bottom: 12px; color: var(--color-text-dim);"></i>
          <p style="font-size: 16px; font-weight: 500;">No secure notes found</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';

    for (const note of filtered) {
      let plainContent = 'Decryption error';
      try {
        plainContent = await CryptoUtil.decryptText(note.encrypted_content, masterSecret);
      } catch (e) {
        console.error('Decryption failed for note:', note.id);
      }

      const card = document.createElement('div');
      card.className = 'glass-card vault-card';

      card.innerHTML = `
        <div>
          <div class="vault-card-header">
            <div class="vault-title-group">
              <div class="vault-icon"><i class="fas fa-sticky-note"></i></div>
              <div class="vault-card-title">${escapeHtml(note.title)}</div>
            </div>
            <button class="btn-icon" onclick="NotesView.toggleFavorite(${note.id})" style="color: ${note.is_favorite ? 'var(--color-warning)' : 'var(--color-text-dim)'}">
              <i class="fas fa-star"></i>
            </button>
          </div>

          <div style="margin-top: 14px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: 13px; font-family: var(--font-mono); white-space: pre-wrap; max-height: 120px; overflow-y: auto;">${escapeHtml(plainContent)}</div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px;">
          <span style="font-size: 11px; color: var(--color-text-dim);">${new Date(note.updated_at).toLocaleDateString()}</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="NotesView.openEditModal(${note.id})"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-danger btn-sm" onclick="NotesView.deleteNote(${note.id})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    }
  }

  function openAddModal() {
    document.getElementById('note-modal-title').textContent = 'Add Secure Note';
    document.getElementById('note-id').value = '';
    document.getElementById('note-form').reset();
    Modal.open('note-modal');
  }

  async function openEditModal(id) {
    const note = notesList.find(n => n.id === id);
    if (!note) return;

    const masterSecret = Auth.getMasterSecret();
    let plainContent = '';
    try {
      plainContent = await CryptoUtil.decryptText(note.encrypted_content, masterSecret);
    } catch (e) {}

    document.getElementById('note-modal-title').textContent = 'Edit Secure Note';
    document.getElementById('note-id').value = note.id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = plainContent;
    document.getElementById('note-tags').value = note.tags || '';
    document.getElementById('note-favorite').checked = !!note.is_favorite;

    Modal.open('note-modal');
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      const id = document.getElementById('note-id').value;
      const title = document.getElementById('note-title').value;
      const plainContent = document.getElementById('note-content').value;
      const tags = document.getElementById('note-tags').value;
      const is_favorite = document.getElementById('note-favorite').checked ? 1 : 0;

      const masterSecret = Auth.getMasterSecret();
      const encrypted_content = await CryptoUtil.encryptText(plainContent, masterSecret);

      const payload = { title, encrypted_content, tags, is_favorite };

      if (id) {
        await API.put(`/notes/${id}`, payload);
        Toast.show('Secure note updated', 'success');
      } else {
        await API.post('/notes', payload);
        Toast.show('Secure note saved', 'success');
      }

      Modal.close('note-modal');
      await loadNotesData();
    } catch (err) {
      Toast.show('Failed to save note', 'error');
    }
  }

  async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this secure note?')) return;
    try {
      await API.delete(`/notes/${id}`);
      Toast.show('Note deleted', 'success');
      await loadNotesData();
    } catch (err) {
      Toast.show('Failed to delete note', 'error');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    render,
    openAddModal,
    openEditModal,
    deleteNote
  };
})();
