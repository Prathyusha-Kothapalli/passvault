/**
 * PassVault Password Vault View Controller
 */

const VaultView = (function() {
  let vaultItems = [];
  let activeCategory = 'All';

  async function render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Controls Bar -->
        <div class="vault-header-controls">
          <div class="search-filter-group">
            <div class="input-with-icon" style="flex: 1;">
              <input type="text" id="vault-search-input" class="form-control" placeholder="Search passwords by title, username, tags..." />
              <button class="input-icon-btn"><i class="fas fa-search"></i></button>
            </div>
            <select id="vault-sort-select" class="form-control" style="width: 140px;">
              <option value="created">Newest First</option>
              <option value="title">Title A-Z</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="VaultView.openAddModal()">
            <i class="fas fa-plus"></i> Add New Entry
          </button>
        </div>

        <!-- Category Chips -->
        <div class="category-chips" id="category-chips">
          <button class="chip active" onclick="VaultView.filterCategory('All')">All Categories</button>
          <button class="chip" onclick="VaultView.filterCategory('Work')">Work</button>
          <button class="chip" onclick="VaultView.filterCategory('Personal')">Personal</button>
          <button class="chip" onclick="VaultView.filterCategory('Finance')">Finance</button>
          <button class="chip" onclick="VaultView.filterCategory('Social')">Social</button>
          <button class="chip" onclick="VaultView.filterCategory('Entertainment')">Entertainment</button>
          <button class="chip" onclick="VaultView.filterCategory('Favorites')"><i class="fas fa-star"></i> Favorites</button>
        </div>

        <!-- Vault Cards Grid -->
        <div id="vault-grid" class="vault-grid">
          <div style="color: var(--color-text-muted); grid-column: span 12;">Loading password vault...</div>
        </div>
      </div>

      <!-- Add/Edit Vault Modal -->
      <div id="vault-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="vault-modal-title">Add Vault Entry</h3>
            <button class="btn-icon" onclick="Modal.close('vault-modal')"><i class="fas fa-times"></i></button>
          </div>
          <form id="vault-form">
            <input type="hidden" id="vault-item-id" />
            <div class="form-group">
              <label class="form-label">Service Title</label>
              <input type="text" id="vault-title" class="form-control" placeholder="e.g. Gmail, GitHub, Bank Account" required />
            </div>
            <div class="form-group">
              <label class="form-label">Username / Email</label>
              <input type="text" id="vault-username" class="form-control" placeholder="e.g. alex.johnson@gmail.com" required />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-with-icon">
                <input type="password" id="vault-password" class="form-control font-mono" placeholder="Enter password" required />
                <button type="button" class="input-icon-btn" onclick="togglePasswordVisibility('vault-password')">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="VaultView.generatePasswordIntoField()">
                  <i class="fas fa-magic"></i> Auto Generate
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Website URL</label>
              <input type="url" id="vault-url" class="form-control" placeholder="https://example.com" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select id="vault-category" class="form-control">
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Finance">Finance</option>
                  <option value="Social">Social</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tags (comma separated)</label>
                <input type="text" id="vault-tags" class="form-control" placeholder="email, work, critical" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes (Encrypted)</label>
              <textarea id="vault-notes" class="form-control" rows="2" placeholder="Optional notes, security questions, or backup codes"></textarea>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 24px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" id="vault-favorite" style="width: 16px; height: 16px; accent-color: var(--color-primary);" />
                Add to Favorites
              </label>
              <div style="display: flex; gap: 12px;">
                <button type="button" class="btn btn-secondary" onclick="Modal.close('vault-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Entry</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('vault-search-input').addEventListener('input', (e) => filterAndRenderVault(e.target.value));
    document.getElementById('vault-sort-select').addEventListener('change', loadVaultData);
    document.getElementById('vault-form').addEventListener('submit', handleFormSubmit);

    await loadVaultData();
  }

  async function loadVaultData() {
    try {
      const sort = document.getElementById('vault-sort-select')?.value || 'created';
      const res = await API.get(`/vault?sort=${sort}`);
      vaultItems = res.items || [];
      filterAndRenderVault();
    } catch (err) {
      console.error('Failed to load vault entries:', err);
      Toast.show('Failed to load vault entries', 'error');
    }
  }

  async function filterAndRenderVault(searchQuery = '') {
    const grid = document.getElementById('vault-grid');
    const masterSecret = Auth.getMasterSecret();
    const query = searchQuery.toLowerCase().trim();

    let filtered = vaultItems.filter(item => {
      if (activeCategory === 'Favorites') {
        if (!item.is_favorite) return false;
      } else if (activeCategory !== 'All') {
        if (item.category !== activeCategory) return false;
      }

      if (query) {
        return (
          item.title.toLowerCase().includes(query) ||
          item.username.toLowerCase().includes(query) ||
          item.tags.toLowerCase().includes(query)
        );
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: span 12; text-align: center; padding: 48px; color: var(--color-text-muted);">
          <i class="fas fa-lock-open" style="font-size: 36px; margin-bottom: 12px; color: var(--color-text-dim);"></i>
          <p style="font-size: 16px; font-weight: 500;">No vault entries found</p>
          <p style="font-size: 13px; margin-top: 4px;">Click "Add New Entry" above to add your first encrypted password.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';

    for (const item of filtered) {
      const card = document.createElement('div');
      card.className = 'glass-card vault-card';

      let plainPassword = '••••••••••••';
      try {
        plainPassword = await CryptoUtil.decryptText(item.encrypted_password, masterSecret);
      } catch (e) {
        console.error('Decryption failed for item:', item.id);
      }

      const strength = PasswordUtils.evaluateStrength(plainPassword);

      card.innerHTML = `
        <div>
          <div class="vault-card-header">
            <div class="vault-title-group">
              <div class="vault-icon"><i class="fas ${getCategoryIcon(item.category)}"></i></div>
              <div>
                <div class="vault-card-title">${escapeHtml(item.title)}</div>
                <div class="vault-card-username">${escapeHtml(item.username)}</div>
              </div>
            </div>
            <button class="btn-icon" onclick="VaultView.toggleFavorite(${item.id})" style="color: ${item.is_favorite ? 'var(--color-warning)' : 'var(--color-text-dim)'}">
              <i class="fas fa-star"></i>
            </button>
          </div>

          <div style="margin-top: 14px;">
            <div class="password-display-box">
              <span id="pwd-text-${item.id}" data-plain="${escapeHtml(plainPassword)}">••••••••••••</span>
              <div style="display: flex; gap: 4px;">
                <button class="btn-icon" title="Toggle Visibility" onclick="VaultView.togglePasswordDisplay(${item.id})">
                  <i class="fas fa-eye" id="pwd-eye-${item.id}"></i>
                </button>
                <button class="btn-icon" title="Copy Password" onclick="ClipboardUtil.copyToClipboard('${escapeHtml(plainPassword).replace(/'/g, "\\'")}', '${escapeHtml(item.title)}')">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; margin-bottom: 12px;">
            <span class="badge badge-info">${escapeHtml(item.category)}</span>
            <span style="font-weight: 600; color: ${strength.color};">${strength.level} (${strength.score}%)</span>
          </div>

          <div class="vault-card-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="VaultView.openEditModal(${item.id})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="VaultView.deleteEntry(${item.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    }
  }

  function filterCategory(cat) {
    activeCategory = cat;
    document.querySelectorAll('#category-chips .chip').forEach(c => {
      c.classList.remove('active');
      if (c.textContent.includes(cat) || (cat === 'All' && c.textContent.includes('All'))) {
        c.classList.add('active');
      }
    });
    filterAndRenderVault();
  }

  function togglePasswordDisplay(id) {
    const el = document.getElementById(`pwd-text-${id}`);
    const eye = document.getElementById(`pwd-eye-${id}`);
    if (el && eye) {
      if (el.textContent === '••••••••••••') {
        el.textContent = el.getAttribute('data-plain');
        eye.className = 'fas fa-eye-slash';
      } else {
        el.textContent = '••••••••••••';
        eye.className = 'fas fa-eye';
      }
    }
  }

  function openAddModal() {
    document.getElementById('vault-modal-title').textContent = 'Add Vault Entry';
    document.getElementById('vault-item-id').value = '';
    document.getElementById('vault-form').reset();
    Modal.open('vault-modal');
  }

  async function openEditModal(id) {
    const item = vaultItems.find(i => i.id === id);
    if (!item) return;

    const masterSecret = Auth.getMasterSecret();
    let plainPassword = '';
    try {
      plainPassword = await CryptoUtil.decryptText(item.encrypted_password, masterSecret);
    } catch (e) {
      console.error('Failed to decrypt password for editing:', e);
    }

    document.getElementById('vault-modal-title').textContent = 'Edit Vault Entry';
    document.getElementById('vault-item-id').value = item.id;
    document.getElementById('vault-title').value = item.title;
    document.getElementById('vault-username').value = item.username;
    document.getElementById('vault-password').value = plainPassword;
    document.getElementById('vault-url').value = item.url || '';
    document.getElementById('vault-category').value = item.category || 'General';
    document.getElementById('vault-tags').value = item.tags || '';
    document.getElementById('vault-notes').value = item.notes || '';
    document.getElementById('vault-favorite').checked = !!item.is_favorite;

    Modal.open('vault-modal');
  }

  function generatePasswordIntoField() {
    const newPassword = PasswordUtils.generatePassword({ length: 18, symbols: true });
    const pwdInput = document.getElementById('vault-password');
    pwdInput.value = newPassword;
    pwdInput.type = 'text';
    Toast.show('Generated 18-character strong password', 'info');
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      const id = document.getElementById('vault-item-id').value;
      const title = document.getElementById('vault-title').value;
      const username = document.getElementById('vault-username').value;
      const plainPassword = document.getElementById('vault-password').value;
      const url = document.getElementById('vault-url').value;
      const category = document.getElementById('vault-category').value;
      const tags = document.getElementById('vault-tags').value;
      const notes = document.getElementById('vault-notes').value;
      const is_favorite = document.getElementById('vault-favorite').checked ? 1 : 0;

      const masterSecret = Auth.getMasterSecret();
      const encrypted_password = await CryptoUtil.encryptText(plainPassword, masterSecret);

      const payload = {
        title,
        username,
        encrypted_password,
        url,
        category,
        tags,
        notes,
        is_favorite
      };

      if (id) {
        await API.put(`/vault/${id}`, payload);
        Toast.show('Vault entry updated successfully', 'success');
      } else {
        await API.post('/vault', payload);
        Toast.show('New vault entry saved', 'success');
      }

      Modal.close('vault-modal');
      await loadVaultData();
    } catch (err) {
      console.error('Error saving vault item:', err);
      Toast.show('Failed to save vault entry', 'error');
    }
  }

  async function toggleFavorite(id) {
    try {
      await API.patch(`/vault/${id}/favorite`, {});
      await loadVaultData();
    } catch (err) {
      Toast.show('Failed to update favorite status', 'error');
    }
  }

  async function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this vault entry?')) return;
    try {
      await API.delete(`/vault/${id}`);
      Toast.show('Vault entry deleted', 'success');
      await loadVaultData();
    } catch (err) {
      Toast.show('Failed to delete entry', 'error');
    }
  }

  function getCategoryIcon(cat) {
    if (cat === 'Work') return 'fa-briefcase';
    if (cat === 'Personal') return 'fa-user';
    if (cat === 'Finance') return 'fa-university';
    if (cat === 'Social') return 'fa-share-alt';
    if (cat === 'Entertainment') return 'fa-film';
    return 'fa-key';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    render,
    filterCategory,
    togglePasswordDisplay,
    openAddModal,
    openEditModal,
    generatePasswordIntoField,
    toggleFavorite,
    deleteEntry
  };
})();
