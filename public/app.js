// API Configuration
const API_URL = 'https://wdid-api-production.up.railway.app';

// State
let currentDailyPrompt = null;
let currentRandomPrompt = null;

// Generate random tilt for prompt card
function getRandomTilt() {
    return (Math.random() * 4) - 2; // Random between -2 and +2 degrees
}

// Generate random background color (WCAG AA compliant)
function generateBackgroundColor() {
    const colors = [
        '#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#EA580C',
        '#D97706', '#059669', '#0891B2', '#4F46E5', '#9333EA',
        '#C026D3', '#E11D48', '#F59E0B', '#10B981', '#06B6D4'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}


// View Navigation
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Apply background color for the current view
    if (viewName === 'daily' && currentDailyPrompt) {
        const bgColor = currentDailyPrompt.background_color || currentDailyPrompt.backgroundColor;
        if (bgColor) {
            document.body.style.backgroundColor = bgColor;
        }
    } else if (viewName === 'random' && currentRandomPrompt) {
        const bgColor = currentRandomPrompt.background_color || currentRandomPrompt.backgroundColor;
        if (bgColor) {
            document.body.style.backgroundColor = bgColor;
        }
    } else if (viewName === 'archive') {
        // Set dark background for archive view
        document.body.style.backgroundColor = '#353535';
    }
    
    // Load data if needed
    if (viewName === 'archive') {
        currentArchivePage = 1; // Reset to page 1
        if (!document.querySelector('.archive-item')) {
            loadArchive();
        }
    }
    
    if (viewName === 'random') {
        const container = document.getElementById('random-prompt');
        if (!currentRandomPrompt) {
            generateRandom();
        }
    }
}


// Load Daily Prompt
async function loadDailyPrompt() {
    const container = document.getElementById('daily-prompt');
    container.classList.add('loading');
    container.querySelector('.prompt-content').innerHTML = '<div class="loader">Loading today\'s prompt...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/daily`);
        const data = await response.json();
        
        if (response.ok) {
            currentDailyPrompt = data;
            displayPrompt(data, 'daily-prompt');
            
            // Update hashtag link
            const hashtagLink = document.getElementById('daily-hashtag');
            const hashtag = data.hashtag || `#WDID${formatDate(new Date())}`;
            hashtagLink.textContent = `View ${hashtag} on Cara.app`;
            hashtagLink.href = `https://cara.app/search?q=${encodeURIComponent(hashtag)}`;
            hashtagLink.style.display = 'block';
        } else {
            container.querySelector('.prompt-content').innerHTML = `
                <div style="color: var(--coral); font-size: 1.2rem;">
                    No prompt yet today!<br>
                    <small style="font-size: 0.8rem;">Check back at midnight</small>
                </div>
            `;
            // Hide hashtag if no prompt
            document.getElementById('daily-hashtag').style.display = 'none';
        }
    } catch (error) {
        container.querySelector('.prompt-content').innerHTML = `
            <div style="color: var(--coral); font-size: 1.2rem;">
                Oops! Couldn't load today's prompt.
            </div>
        `;
        console.error('Error loading daily prompt:', error);
        // Hide hashtag on error
        document.getElementById('daily-hashtag').style.display = 'none';
    } finally {
        container.classList.remove('loading');
    }
}

// Helper function to format date for hashtag (YYMMDD)
function formatDate(date) {
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + month + day;
}

// Generate Random Prompt
async function generateRandom() {
    // Close mobile settings menu
    const controls = document.getElementById('controls-section');
    if (controls.classList.contains('mobile-visible')) {
        controls.classList.remove('mobile-visible');
    }
    
    const container = document.getElementById('random-prompt');
    
    container.classList.add('loading');
    container.querySelector('.prompt-content').innerHTML = '<div class="loader">Generating prompt...</div>';
    
    const includeScene = document.getElementById('includeScene').checked;
    const vibe = document.getElementById('mood').value;
    const animalRarity = document.getElementById('animalRarity').value;
    const objectRarity = document.getElementById('objectRarity').value;
    
    // Build filters object
    const filters = {};
    if (vibe !== 'none') {
        filters.vibe = vibe;
    }
    filters.animalRarity = animalRarity;
    filters.objectRarity = objectRarity;
    
    try {
        const response = await fetch(`${API_URL}/api/random`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ includeScene, filters })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentRandomPrompt = data;
            displayPrompt(data, 'random-prompt');
        } else {
            container.querySelector('.prompt-content').innerHTML = `
                <div style="color: var(--coral); font-size: 1.2rem;">
                    Couldn't generate prompt. Try different filters!
                </div>
            `;
        }
    } catch (error) {
        container.querySelector('.prompt-content').innerHTML = `
            <div style="color: var(--coral); font-size: 1.2rem;">
                Oops! Something went wrong.
            </div>
        `;
        console.error('Error generating random prompt:', error);
    } finally {
        container.classList.remove('loading');
    }
}

// Display Prompt with colored, clickable words
function displayPrompt(data, containerId) {
    const container = document.getElementById(containerId);
    const contentDiv = container.querySelector('.prompt-content');
    
    // Apply background color to body
    const bgColor = data.background_color || data.backgroundColor || generateBackgroundColor();
    document.body.style.backgroundColor = bgColor;
    
    // Apply random tilt to card
    const tilt = getRandomTilt();
    container.style.transform = `rotate(${tilt}deg)`;
    
    // Words from database that should be clickable and colored
    const dbWords = {
        adjective: data.adjective,
        subject: data.subject,
        action: data.action,
        item: data.item,
        scene: data.scene
    };
    
    // Create the prompt text with spans for database words
    let promptHTML = data.prompt;
    
    // Replace each database word with colored, clickable span
    Object.entries(dbWords).forEach(([category, word]) => {
        if (word) {
            // Escape special regex characters and make case-insensitive
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, (match) => '\\' + match);
            const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
            promptHTML = promptHTML.replace(regex, `<span class="clickable-word word-${category}" onclick="searchWord('$1')">$1</span>`);
        }
    });
    
    contentDiv.innerHTML = promptHTML;
}


// Search word on Google Images
function searchWord(word) {
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(word)}`, '_blank');
}

// Archive pagination state
let currentArchivePage = 1;
const archiveItemsPerPage = 12;
let totalArchivePages = 1;

// Load Archive with pagination
async function loadArchive() {
    const container = document.getElementById('archive-list');
    container.classList.add('loading');
    container.innerHTML = '<div class="loader">Loading archive...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/archive`);
        const allData = await response.json();
        
        if (response.ok && allData.length > 0) {
            // Calculate pagination
            totalArchivePages = Math.ceil(allData.length / archiveItemsPerPage);
            displayArchivePage(allData);
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--dark-teal); opacity: 0.6;">No archived prompts yet!</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: var(--coral);">Couldn\'t load archive.</p>';
        console.error('Error loading archive:', error);
    } finally {
        container.classList.remove('loading');
    }
}

// Display specific page of archive
function displayArchivePage(allData) {
    const container = document.getElementById('archive-list');
    const startIndex = (currentArchivePage - 1) * archiveItemsPerPage;
    const endIndex = startIndex + archiveItemsPerPage;
    const pageData = allData.slice(startIndex, endIndex);
    
    container.innerHTML = pageData.map(prompt => {
        const bgColor = prompt.background_color || prompt.backgroundColor || '#2563EB';
        const date = new Date(prompt.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const hashtag = prompt.hashtag || '#WDID';
        const searchUrl = `https://cara.app/search?q=${encodeURIComponent(hashtag)}`;
        
        return `
            <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="archive-item" style="background-color: ${bgColor};">
                <div class="archive-date">${date}</div>
                <div class="archive-prompt">${prompt.prompt}</div>
                <div class="archive-hashtag">${hashtag}</div>
            </a>
        `;
    }).join('');
    
    // Update pagination controls
    updateArchivePagination();
    
    // Store all data for navigation
    window.archiveData = allData;
}

// Update pagination button states
function updateArchivePagination() {
    document.getElementById('archivePageInfo').textContent = `Page ${currentArchivePage} of ${totalArchivePages}`;
    document.getElementById('archivePrevBtn').disabled = currentArchivePage === 1;
    document.getElementById('archiveNextBtn').disabled = currentArchivePage === totalArchivePages;
}

// Navigate archive pages
function loadArchivePage(direction) {
    if (direction === 'prev' && currentArchivePage > 1) {
        currentArchivePage--;
    } else if (direction === 'next' && currentArchivePage < totalArchivePages) {
        currentArchivePage++;
    }
    
    if (window.archiveData) {
        displayArchivePage(window.archiveData);
        // Scroll to top of archive
        document.getElementById('archive-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Share Prompt
async function sharePrompt(type) {
    const promptElement = type === 'daily' 
    ? document.querySelector('#daily-prompt .prompt-content')
    : document.querySelector('#random-prompt .prompt-content');
    
    if (!promptElement) {
        console.log('Prompt element not found');
        return;
    }
    
    const promptText = promptElement.textContent.trim();
    
    if (!promptText || promptText === 'Loading today\'s prompt...' || promptText === 'Loading prompt...') {
        showMessage('Wait for prompt to load');
        return;
    }
    
    // Different share text for daily vs random
    const shareText = type === 'daily'
    ? `Today you should draw ${promptText} ✏️

Get more ideas → whatdoidraw.com ${hashtag}`
    : `Can you draw this ${promptText}? ✏️

Get more ideas → whatdoidraw.com #WDID`;
    
    // Try native share first (mobile)
    if (navigator.share) {
        try {
            await navigator.share({
                text: shareText
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                copyToClipboard(shareText);
            }
        }
    } else {
        // Fallback to clipboard
        copyToClipboard(shareText);
    }
}

function showMessage(text) {
    // Create message element
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2e2e2e;
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        font-weight: 700;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 2000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showMessage('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showMessage('Failed to copy');
    });
}


// Toggle mobile settings visibility
function toggleMobileSettings() {
    const controls = document.getElementById('controls-section');
    
    if (controls.classList.contains('mobile-visible')) {
        controls.classList.remove('mobile-visible');
    } else {
        controls.classList.add('mobile-visible');
    }
}


// Initialize
loadDailyPrompt();

// Auto-generate random prompt when on random view
if (window.location.hash === '#random') {
    showView('random');
    generateRandom();
}
