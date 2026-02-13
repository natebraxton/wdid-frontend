// Admin JavaScript
const API_URL = 'https://wdid-api-production.up.railway.app';
let adminToken = localStorage.getItem('adminToken') || '';
let allWords = [];

// Check if already logged in
if (adminToken) {
    showAdminPanel();
}

// Login
async function login() {
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (!password) {
        errorEl.textContent = 'Please enter a password';
        return;
    }
    
    // Test the password with a simple API call
    try {
        const response = await fetch(`${API_URL}/api/admin/words?active=true`, {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        
        if (response.ok) {
            adminToken = password;
            localStorage.setItem('adminToken', password);
            errorEl.textContent = '';
            showAdminPanel();
        } else {
            errorEl.textContent = 'Invalid password';
        }
    } catch (error) {
        errorEl.textContent = 'Connection error';
        console.error('Login error:', error);
    }
}

// Logout
function logout() {
    adminToken = '';
    localStorage.removeItem('adminToken');
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('admin-section').style.display = 'none';
    document.getElementById('admin-password').value = '';
}

// Show admin panel
function showAdminPanel() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'block';
    loadWords();
}

// Load words from API
async function loadWords() {
    const category = document.getElementById('filter-category').value;
    const mood = document.getElementById('filter-mood').value;
    const active = document.getElementById('filter-active').value;
    
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (mood) params.append('mood', mood);
    if (active) params.append('active', active);
    
    try {
        const response = await fetch(`${API_URL}/api/admin/words?${params}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            allWords = await response.json();
            updateStats();
            renderTable();
        }
    } catch (error) {
        console.error('Error loading words:', error);
        document.getElementById('words-table-body').innerHTML = 
            '<tr><td colspan="7" class="loading-cell" style="color: #DC2626;">Error loading words</td></tr>';
    }
}

// Update stats
function updateStats() {
    const total = allWords.length;
    const active = allWords.filter(w => w.active).length;
    const inactive = total - active;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-inactive').textContent = inactive;
}

// Render table
function renderTable() {
    const tbody = document.getElementById('words-table-body');
    
    if (allWords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">No words found</td></tr>';
        return;
    }
    
    tbody.innerHTML = allWords.map(word => `
        <tr>
            <td><input type="checkbox" class="word-checkbox" value="${word.id}" /></td>
            <td class="word-cell">${word.word}</td>
            <td><span class="category-badge category-${word.category}">${word.category}</span></td>
            <td>
                <div class="mood-tags">
                    ${(word.mood || []).map(m => `<span class="mood-tag">${m}</span>`).join('')}
                </div>
            </td>
            <td>
                <div class="flags">
                    ${word.is_animal ? '<span class="flag">🐾 Animal</span>' : ''}
                    ${word.is_object ? '<span class="flag">📦 Object</span>' : ''}
                </div>
            </td>
            <td><span class="status-badge status-${word.active ? 'active' : 'inactive'}">${word.active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" onclick="editWord(${word.id})" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="toggleActive(${word.id}, ${!word.active})" title="${word.active ? 'Deactivate' : 'Activate'}">
                        ${word.active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="icon-btn" onclick="deleteWord(${word.id})" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter table (client-side search)
function filterTable() {
    const searchTerm = document.getElementById('search-word').value.toLowerCase();
    const rows = document.querySelectorAll('#words-table-body tr');
    
    rows.forEach(row => {
        const wordText = row.querySelector('.word-cell')?.textContent.toLowerCase();
        if (wordText && wordText.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Toggle select all
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.word-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

// Show add modal
function showAddModal() {
    document.getElementById('modal-title').textContent = 'Add New Word';
    document.getElementById('word-form').reset();
    document.getElementById('word-id').value = '';
    document.getElementById('word-active').checked = true;
    document.getElementById('word-modal').classList.add('active');
}

// Edit word
async function editWord(id) {
    try {
        const response = await fetch(`${API_URL}/api/admin/words/${id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const word = await response.json();
            
            document.getElementById('modal-title').textContent = 'Edit Word';
            document.getElementById('word-id').value = word.id;
            document.getElementById('word-text').value = word.word;
            document.getElementById('word-category').value = word.category;
            document.getElementById('word-is-animal').checked = word.is_animal;
            document.getElementById('word-is-object').checked = word.is_object;
            document.getElementById('word-active').checked = word.active;
            
            // Set mood checkboxes
            document.querySelectorAll('.mood-check').forEach(checkbox => {
                checkbox.checked = (word.mood || []).includes(checkbox.value);
            });
            
            document.getElementById('word-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading word:', error);
        alert('Error loading word');
    }
}

// Save word (create or update)
async function saveWord(event) {
    event.preventDefault();
    
    const id = document.getElementById('word-id').value;
    const wordData = {
        word: document.getElementById('word-text').value,
        category: document.getElementById('word-category').value,
        is_animal: document.getElementById('word-is-animal').checked,
        is_object: document.getElementById('word-is-object').checked,
        active: document.getElementById('word-active').checked,
        mood: Array.from(document.querySelectorAll('.mood-check:checked')).map(cb => cb.value)
    };
    
    try {
        const url = id ? `${API_URL}/api/admin/words/${id}` : `${API_URL}/api/admin/words`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(wordData)
        });
        
        if (response.ok) {
            closeModal();
            loadWords();
        } else {
            alert('Error saving word');
        }
    } catch (error) {
        console.error('Error saving word:', error);
        alert('Error saving word');
    }
}

// Toggle active status
async function toggleActive(id, active) {
    try {
        const word = allWords.find(w => w.id === id);
        const response = await fetch(`${API_URL}/api/admin/words/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ ...word, active })
        });
        
        if (response.ok) {
            loadWords();
        } else {
            alert('Error updating word');
        }
    } catch (error) {
        console.error('Error toggling active:', error);
        alert('Error updating word');
    }
}

// Delete word
async function deleteWord(id) {
    if (!confirm('Are you sure you want to delete this word?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/admin/words/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            loadWords();
        } else {
            alert('Error deleting word');
        }
    } catch (error) {
        console.error('Error deleting word:', error);
        alert('Error deleting word');
    }
}

// Bulk activate
async function bulkActivate() {
    await bulkToggle(true);
}

// Bulk deactivate
async function bulkDeactivate() {
    await bulkToggle(false);
}

// Bulk toggle
async function bulkToggle(active) {
    const checkboxes = document.querySelectorAll('.word-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (ids.length === 0) {
        alert('Please select at least one word');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/admin/words/bulk-toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ ids, active })
        });
        
        if (response.ok) {
            loadWords();
        } else {
            alert('Error updating words');
        }
    } catch (error) {
        console.error('Error bulk toggling:', error);
        alert('Error updating words');
    }
}

// Close modal
function closeModal() {
    document.getElementById('word-modal').classList.remove('active');
}

// Allow Enter key to login
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});
