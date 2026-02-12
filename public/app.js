// API Configuration
const API_URL = 'https://wdid-api-production.up.railway.app';

// State
let currentDailyPrompt = null;
let currentRandomPrompt = null;

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Load data if needed
        if (tabName === 'archive' && !document.querySelector('.archive-item')) {
            loadArchive();
        }
    });
});

// Load Daily Prompt
async function loadDailyPrompt() {
    const container = document.getElementById('daily-prompt');
    container.classList.add('loading');
    container.innerHTML = '<div class="loader">Loading today\'s prompt...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/daily`);
        const data = await response.json();
        
        if (response.ok) {
            currentDailyPrompt = data;
            displayPrompt(data, 'daily-prompt');
        } else {
            container.innerHTML = `
                <div class="prompt-text" style="color: var(--text-light);">
                    No prompt yet today!<br>
                    <small>Check back at midnight</small>
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `
            <div class="prompt-text" style="color: #DC2626;">
                Oops! Couldn't load today's prompt.
            </div>
        `;
        console.error('Error loading daily prompt:', error);
    } finally {
        container.classList.remove('loading');
    }
}

// Generate Random Prompt
async function generateRandom() {
    const container = document.getElementById('random-prompt');
    const actions = document.getElementById('random-actions');
    
    container.classList.add('loading');
    container.innerHTML = '<div class="loader">Generating prompt...</div>';
    
    const includeScene = document.getElementById('includeScene').checked;
    const mood = document.getElementById('mood').value;
    const animalRarity = document.getElementById('animalRarity').value;
    const objectRarity = document.getElementById('objectRarity').value;
    
    const filters = {};
    if (mood !== 'none') filters.mood = mood;
    if (animalRarity !== 'Normal') filters.animalRarity = animalRarity;
    if (objectRarity !== 'Normal') filters.objectRarity = objectRarity;
    
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
            actions.style.display = 'flex';
        } else {
            container.innerHTML = `
                <div class="prompt-text" style="color: #DC2626;">
                    Couldn't generate prompt. Try different filters!
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `
            <div class="prompt-text" style="color: #DC2626;">
                Oops! Something went wrong.
            </div>
        `;
        console.error('Error generating random prompt:', error);
    } finally {
        container.classList.remove('loading');
    }
}

// Display Prompt
function displayPrompt(data, containerId) {
    const container = document.getElementById(containerId);
    
    const bgColor = data.background_color || data.backgroundColor || '#2563EB';
    
    container.style.backgroundColor = bgColor;
    container.innerHTML = `
        <div class="prompt-text">${data.prompt}</div>
        ${data.hashtag ? `<div class="prompt-hashtag">${data.hashtag}</div>` : ''}
        <div class="prompt-meta">
            ${data.adjective} • ${data.subject} • ${data.action} • ${data.item}
            ${data.scene ? `<br>in ${data.scene}` : ''}
        </div>
    `;
}

// Load Archive
async function loadArchive() {
    const container = document.getElementById('archive-list');
    container.classList.add('loading');
    container.innerHTML = '<div class="loader">Loading archive...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/archive`);
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
            container.innerHTML = data.map(prompt => `
                <div class="archive-item" style="border-left: 4px solid ${prompt.background_color}">
                    <div class="archive-date">${new Date(prompt.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    })}</div>
                    <div class="archive-prompt">${prompt.prompt}</div>
                    <div class="archive-hashtag">${prompt.hashtag}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No archived prompts yet!</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: #DC2626;">Couldn\'t load archive.</p>';
        console.error('Error loading archive:', error);
    } finally {
        container.classList.remove('loading');
    }
}

// Share Prompt
function sharePrompt(type) {
    const prompt = type === 'daily' ? currentDailyPrompt : currentRandomPrompt;
    
    if (!prompt) return;
    
    const text = `${prompt.prompt}\n\n${prompt.hashtag || '#WhatDidIDraw'}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'What Did I Draw?',
            text: text
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            alert('Prompt copied to clipboard!');
        });
    }
}

// Initialize
loadDailyPrompt();
