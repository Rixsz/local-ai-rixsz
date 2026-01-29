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

sendBtn.addEventListener('click', sendMessage);

async function performSearch(query) {
    appendMessage('ai', '🔎 Searching the secure web via Tor...');
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        const data = await response.json();
        return data.results;
    } catch (e) {
        return "Search failed or timed out.";
    }
}

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

    // Check for search intent logic... (kept same)

    // Define Personas
    const persona = personaSelect.value;
    const personas = {
        rixsz: "You are RIXSZ, a highly advanced AI assistant. Address me simply as 'Sir'. Be witty, extremely concise, and efficient. Do not be chatty. Your goal is speed and precision. Keep answers short",
        gemini: "You are a helpful, harmless, and honest AI assistant. Be polite, professional, and provide detailed answers. Act like Gemini.",
        translator: "You are a professional translator. Detect the source language and translate the user's text into English (or the requested language). Provide ONLY the translation. Do not explain anything."
    };

    let systemPrompt = personas[persona] || personas.rixsz; // Default to RIXSZ
    let finalPrompt = text;

    if (text.toLowerCase().startsWith('search for') || text.toLowerCase().startsWith('google this')) {
        const query = text.replace(/^(search for|google this)/i, '').trim();
        const searchResults = await performSearch(query);

        systemPrompt += `\n\nCONTEXT FROM WEB SEARCH:\n${searchResults}\n\nUse this context to answer the user's question accurately. Cite the info if needed.`;

        // Update the AI bubble to show we are now thinking about the result
        aiMsgContent.innerHTML = '<span class="typing-indicator">... processing data ...</span>';
    }

    // Prepare message payload for /api/chat
    // If chatHistory is empty, we MUST inject the system prompt first
    const messages = [];
    messages.push({ role: 'system', content: systemPrompt });

    // Add existing history
    chatHistory.forEach(msg => messages.push(msg));

    // Add new user message
    const userMsg = { role: 'user', content: finalPrompt };
    messages.push(userMsg);

    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelSelect.value,
                messages: messages,
                stream: true
            })
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
                        aiMsgContent.textContent = fullResponse; // Note: markdown parsing would go here
                        scrollToBottom();
                    }
                    if (json.done) {
                        // Save this exchange to history
                        chatHistory.push(userMsg);
                        chatHistory.push({ role: 'assistant', content: fullResponse });

                        // Limit history size
                        if (chatHistory.length > HISTORY_LIMIT * 2) {
                            chatHistory = chatHistory.slice(-HISTORY_LIMIT * 2);
                        }

                        // Speak the full response when done
                        speakText(fullResponse);
                    }
                } catch (e) {
                    console.error('Error parsing JSON chunk', e);
                }
            }
        }

    } catch (error) {
        console.error('Chat Error:', error);
        aiMsgContent.textContent = `Error: ${error.message}. Make sure Ollama is running.`;
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
