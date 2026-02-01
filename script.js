const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const personaSelect = document.getElementById('persona-select');
const voiceToggle = document.getElementById('voice-toggle');
const voiceIconOn = document.getElementById('voice-icon-on');
const voiceIconOff = document.getElementById('voice-icon-off');
const archiveBtn = document.getElementById('archive-btn');

let isVoiceEnabled = false;
let synthesisVoice = null;
let chatHistory = [];
const HISTORY_LIMIT = 20;

// Voice Toggle Logic
voiceToggle.addEventListener('click', () => {
    isVoiceEnabled = !isVoiceEnabled;
    voiceToggle.classList.toggle('active', isVoiceEnabled);
    voiceIconOn.style.display = isVoiceEnabled ? 'block' : 'none';
    voiceIconOff.style.display = isVoiceEnabled ? 'none' : 'block';

    if (isVoiceEnabled) {
        initVoice();
        speakText("Voice module online.");
    } else {
        window.speechSynthesis.cancel();
    }
});

function initVoice() {
    const voices = window.speechSynthesis.getVoices();

    // The preferred list of male/neutral names that work well for Jarvis/RIXSZ
    const maleKeywords = ['Male', 'Daniel', 'David', 'Guy', 'Alex', 'James', 'UK English Male'];

    // Try to find a match from our preference list
    for (const keyword of maleKeywords) {
        synthesisVoice = voices.find(v => v.name.includes(keyword));
        if (synthesisVoice) break;
    }

    // Fallback to any British voice if no specific male name matched
    if (!synthesisVoice) {
        synthesisVoice = voices.find(v => v.lang.includes('GB'));
    }

    // Absolute fallback
    if (!synthesisVoice) synthesisVoice = voices[0];

    if (synthesisVoice) {
        console.log("🎙️ RIXSZ Voice Selection: " + synthesisVoice.name);
    }
}

// Ensure voices are loaded
window.speechSynthesis.onvoiceschanged = initVoice;

function speakText(text) {
    if (!isVoiceEnabled || !text) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean text (remove markdown like ** or #)
    const cleanText = text.replace(/[\*#_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (synthesisVoice) utterance.voice = synthesisVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

async function archiveSession() {
    if (chatHistory.length === 0) {
        alert("Sir, there is no data in my active buffers to archive.");
        return;
    }

    if (!confirm("Sir, shall I compress this conversation and store it in the physical archives? This will clear our current session.")) {
        return;
    }

    archiveBtn.disabled = true;
    archiveBtn.textContent = "Archiving...";

    try {
        const response = await fetch('/api/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: chatHistory })
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert("Archive complete, Sir. Session stored as " + data.file);
            // Clear UI
            chatHistory = [];
            chatMessages.innerHTML = '';
            // Restore greeting
            appendMessage('ai', "Hello! I'm your local AI assistant RIXSZ. My memory has been reset and archived. How can I help you, Sir?");
        } else {
            throw new Error(data.message);
        }
    } catch (e) {
        alert("I encountered an error while zipping the logs, Sir: " + e.message);
    } finally {
        archiveBtn.disabled = false;
        archiveBtn.textContent = "Archive & Clear";
    }
}

archiveBtn.addEventListener('click', archiveSession);

function scrollToBottom() {
    const threshold = 100; // px from bottom to trigger auto-scroll
    const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < threshold;

    if (isAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}


// Auto-resize textarea
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
});

// Handle Enter key
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Sidebar Logic
const navNewChat = document.getElementById('nav-new-chat');
const navHistory = document.getElementById('nav-history');
const navModels = document.getElementById('nav-models');
const navSettings = document.getElementById('nav-settings');

navNewChat.addEventListener('click', () => {
    if (confirm("Start a new chat? This will clear current conversation.")) {
        chatHistory = [];
        chatMessages.innerHTML = '';
        appendMessage('ai', "Hello! I'm your local AI assistant. How can I help you today?");
        if (abortController) {
            abortController.abort();
            abortController = null;
            toggleGenerationState(false);
        }
    }
});

navHistory.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();

        if (data.status === 'success') {
            const files = data.files;
            if (files.length === 0) {
                alert("No archived sessions found.");
            } else {
                let historyList = "📂 **Archived Sessions**:\n\n";
                files.forEach((file, index) => {
                    historyList += `${index + 1}. ${file}\n`;
                });
                historyList += "\n(These are physical zip files in your history folder)";
                appendMessage('system', historyList);
            }
        } else {
            alert("Error fetching history: " + data.message);
        }
    } catch (e) {
        alert("Could not connect to server to fetch history.");
    }
});

navModels.addEventListener('click', () => {
    modelSelect.focus();
    modelSelect.style.borderColor = 'var(--accent-color)';
    setTimeout(() => {
        modelSelect.style.borderColor = 'var(--border-color)';
    }, 1000);
});

navModels.addEventListener('click', () => {
    modelSelect.focus();
    modelSelect.style.borderColor = 'var(--accent-color)';
    setTimeout(() => {
        modelSelect.style.borderColor = 'var(--border-color)';
    }, 1000);
});

navSettings.addEventListener('click', () => {
    alert("Settings feature coming soon!");
});

sendBtn.addEventListener('click', sendMessage);

async function performSearch(query, signal, isDarkWeb = false) {
    const searchIcon = isDarkWeb ? '🧅' : '🔐';
    const searchType = isDarkWeb ? 'Dark Web (.onion)' : 'Secure Web (Tor)';
    appendMessage('ai', `${searchIcon} Accessing ${searchType}...`);

    try {
        const endpoint = isDarkWeb ? '/api/search-onion' : '/api/search';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query }),
            signal: signal
        });
        const data = await response.json();

        if (data.status === 'success') {
            return `[Source: ${data.source || 'Unknown'}]\n\n${data.results}`;
        } else {
            return `Search failed: ${data.message}`;
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            throw e; // Propagate abort
        }
        return "Search failed or timed out.";
    }
}

// Stop Generation Logic
const stopBtn = document.getElementById('stop-btn');
let abortController = null;

function toggleGenerationState(isGenerating) {
    if (isGenerating) {
        sendBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
    } else {
        sendBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
    }
}

stopBtn.addEventListener('click', () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
        toggleGenerationState(false);
        appendMessage('system', 'Generation stopped by user.');
    }
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Reset input
    userInput.value = '';
    userInput.style.height = '56px';

    // Add user message to UI
    appendMessage('user', text);

    // Prepare AI message shell
    const aiMsgWrapper = appendMessage('ai', '');
    const aiMsgContent = aiMsgWrapper.querySelector('.message');
    aiMsgContent.innerHTML = '<span class="typing-indicator">...</span>';

    toggleGenerationState(true); // Show stop button

    // Define Personas
    const persona = personaSelect.value;
    const personas = {
        rixsz: "You are RIXSZ, a highly advanced AI assistant. Address me simply as 'Sir'. Be witty, extremely concise, and efficient. Do not be chatty. Your goal is speed and precision. Keep answers short",
        gemini: "You are a helpful, harmless, and honest AI assistant. Be polite, professional, and provide detailed answers. Act like Gemini.",
        translator: "You are a professional translator. Detect the source language and translate the user's text into English (or the requested language). Provide ONLY the translation. Do not explain anything."
    };

    let systemPrompt = personas[persona] || personas.rixsz; // Default to RIXSZ
    let finalPrompt = text;

    // Initialize AbortController EARLY so stop button works during search
    abortController = new AbortController();

    // Check for special commands first
    let isCommand = false;
    let commandQuery = null;
    let isDarkWebSearch = false;

    // /search-tor command
    if (text.toLowerCase().startsWith('/search-tor ')) {
        commandQuery = text.slice(12).trim();
        isCommand = true;
        isDarkWebSearch = false;
    }
    // /search-deep command for dark web
    else if (text.toLowerCase().startsWith('/search-deep ')) {
        commandQuery = text.slice(13).trim();
        isCommand = true;
        isDarkWebSearch = true;
    }

    if (isCommand && commandQuery) {
        try {
            const searchIcon = isDarkWebSearch ? '🧅' : '🔐';
            const searchType = isDarkWebSearch ? 'DARK WEB' : 'TOR NETWORK';
            appendMessage('ai', `${searchIcon} ACCESSING ${searchType}... Query: "${commandQuery}"`);

            const searchResults = await performSearch(commandQuery, abortController.signal, isDarkWebSearch);

            aiMsgContent.innerHTML = '';
            aiMsgContent.textContent = searchResults;
            scrollToBottom();

            toggleGenerationState(false);
            abortController = null;
            return;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('User aborted search');
            } else {
                console.error('Search Error:', error);
                aiMsgContent.textContent = `Error: ${error.message}`;
            }
            toggleGenerationState(false);
            abortController = null;
            return;
        }
    }

    // Initialize AbortController EARLY so stop button works during search (redundant but safe)

    // Advanced Search Logic
    const searchPatterns = [
        {
            triggers: ['search for', 'google this', 'find'],
            type: 'general',
            transform: q => q
        },
        {
            triggers: ['who is', 'who are', 'biography of', 'bio of'],
            type: 'person',
            transform: q => `${q} biography profile details`
        },
        {
            triggers: ['social media', 'socials', 'twitter of', 'instagram of', 'facebook of', 'linkedin of', 'find social'],
            type: 'social',
            transform: q => `${q} (site:twitter.com OR site:linkedin.com OR site:facebook.com OR site:instagram.com OR site:tiktok.com)`
        }
    ];

    let query = null;
    let searchType = null;

    // Check patterns
    const lowerText = text.toLowerCase();
    for (const pattern of searchPatterns) {
        for (const trigger of pattern.triggers) {
            if (lowerText.startsWith(trigger)) {
                let rawQuery = text.slice(trigger.length).trim();
                // Remove common connecting words if they start the query (e.g. "who is [the]...")
                rawQuery = rawQuery.replace(/^(the|a|an)\s+/i, '');

                if (rawQuery) {
                    query = pattern.transform(rawQuery);
                    searchType = pattern.type;
                    break;
                }
            }
        }
        if (query) break;
    }

    // Image Generation Logic
    // Image Generation Logic
    // Broad regex to capture "draw", "paint", "generate image" anywhere, but usually as an instruction
    const imageRegex = /(?:can\s+you|please)?\s*\b(draw|paint|generate|create)\b\s+(?:an\s+image|a\s+picture|a\s+photo|something|of)?/i;
    const isImageRequest = imageRegex.test(lowerText) || lowerText.includes('image of') || lowerText.includes('picture of');

    let imagePrompt = null;

    if (isImageRequest) {
        // specific check to avoid false positives?
        // Let's try to extract the subject
        imagePrompt = text.replace(/^(can\s+you|please)?\s*(draw|paint|generate|create)\s*(an\s+image|a\s+picture|a\s+photo|of)?\s*/i, '').trim();
    }

    if (imagePrompt && imagePrompt.length > 2) {
        appendMessage('ai', `🎨 Painting: "${imagePrompt}"...`);
        aiMsgContent.innerHTML = '<span class="typing-indicator">... creating masterpiece ...</span>';

        try {
            const imgResponse = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: imagePrompt })
            });
            const imgData = await imgResponse.json();

            if (imgData.status === 'success') {
                const imgHTML = `<div class="generated-image-container">
                    <img src="data:image/png;base64,${imgData.image}" alt="${imagePrompt}" class="generated-image">
                    <a href="data:image/png;base64,${imgData.image}" download="rixsz_${Date.now()}.png" class="download-link">Download</a>
                </div>`;
                aiMsgContent.innerHTML = imgHTML;
                scrollToBottom();
                return; // Stop processing text generation
            } else {
                throw new Error(imgData.message);
            }
        } catch (e) {
            aiMsgContent.textContent = `Image Generation Failed: ${e.message}`;
            return;
        }
    }

    try {
        if (query) {
            const searchType = searchType || 'general';
            appendMessage('ai', `🔐 ACCESSING TOR NETWORK... Targeted Search [${searchType.toUpperCase()}]`);
            // Now passing signal to performSearch
            const searchResults = await performSearch(query, abortController.signal, false);

            systemPrompt += `\n\nCONTEXT FROM SECURE WEB SEARCH (Query: ${query}):\n${searchResults}\n\nUse this context to answer the user's question accurately. If looking for social media, list the handles/URLs found.`;

            // Update the AI bubble to show we are now thinking about the result
            aiMsgContent.innerHTML = '<span class="typing-indicator">... analyzing encrypted data ...</span>';
        }

        // Prepare message payload
        const messages = [];
        messages.push({ role: 'system', content: systemPrompt });
        chatHistory.forEach(msg => messages.push(msg));

        // Add new user message
        const userMsg = { role: 'user', content: finalPrompt };
        messages.push(userMsg);

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelSelect.value,
                messages: messages,
                stream: true
            }),
            signal: abortController.signal
        });

        if (!response.ok) throw new Error('Failed to connect to Ollama');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        aiMsgContent.innerHTML = ''; // Remove typing indicator

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message && json.message.content) {
                        const content = json.message.content;
                        fullResponse += content;
                        aiMsgContent.textContent = fullResponse;
                        scrollToBottom();
                    }
                    if (json.done) {
                        chatHistory.push(userMsg);
                        chatHistory.push({ role: 'assistant', content: fullResponse });

                        if (chatHistory.length > HISTORY_LIMIT * 2) {
                            chatHistory = chatHistory.slice(-HISTORY_LIMIT * 2);
                        }

                        speakText(fullResponse);
                    }
                } catch (e) {
                    console.error('Error parsing JSON chunk', e);
                }
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('User aborted generation');
        } else {
            console.error('Chat Error:', error);
            aiMsgContent.textContent = `Error: ${error.message}. Make sure Ollama is running.`;
        }
    } finally {
        toggleGenerationState(false);
        abortController = null;
    }
}

function appendMessage(role, text) {
    const wrapper = document.createElement('div');


    wrapper.className = 'message-wrapper';

    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    msg.textContent = text;

    wrapper.appendChild(msg);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return wrapper;
}
