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
            chatSession.appendMessage('ai', "Hello! I'm your local AI assistant RIXSZ. My memory has been reset and archived. How can I help you, Sir?");
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

// --- Advanced DOM & State Manager ---
class ChatManager {
    constructor() {
        this.currentAbortController = null;
        this.isGenerating = false;
        this.scrollTimeout = null;
    }

    startGeneration() {
        if (this.currentAbortController) this.currentAbortController.abort();
        this.currentAbortController = new AbortController();
        this.isGenerating = true;
        this.toggleUI(true);
        return this.currentAbortController.signal;
    }

    stopGeneration() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
        this.isGenerating = false;
        this.toggleUI(false);
    }

    toggleUI(generating) {
        const sendBtnEl = document.getElementById('send-btn');
        const stopBtnEl = document.getElementById('stop-btn');
        if (sendBtnEl) sendBtnEl.style.display = generating ? 'none' : 'flex';
        if (stopBtnEl) stopBtnEl.style.display = generating ? 'flex' : 'none';
    }

    appendMessage(role, text) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper`;

        const msg = document.createElement('div');
        msg.className = `message ${role}`;
        
        // Handle CoT blocks and Images
        this.processMessageContent(msg, text);

        wrapper.appendChild(msg);
        chatMessages.appendChild(wrapper);
        this.smoothScrollToBottom();

        return { wrapper, msgContentNode: msg };
    }

    processMessageContent(node, text) {
        if (!text) return;
        
        // Case 1: Image HTML
        if (text.includes('generated-image-container')) {
            node.innerHTML = text;
            return;
        }

        // Case 2: CoT thought block parsing
        if (text.includes('<thought>')) {
            const parts = text.split(/<\/?thought>/);
            node.innerHTML = '';
            if (parts[1]) {
                const thoughtEl = document.createElement('details');
                thoughtEl.className = 'thought-block';
                thoughtEl.innerHTML = `<summary>💡 Thinking Process</summary><div class="thought-content">${parts[1]}</div>`;
                node.appendChild(thoughtEl);
            }
            if (parts[2]) {
                const textEl = document.createElement('div');
                textEl.textContent = parts[2];
                node.appendChild(textEl);
            }
            return;
        }

        node.textContent = text;
    }

    smoothScrollToBottom() {
        if (this.scrollTimeout) return;
        this.scrollTimeout = requestAnimationFrame(() => {
            const threshold = 150;
            const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < threshold;
            if (isAtBottom || chatMessages.scrollTop === 0) {
                chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
            }
            this.scrollTimeout = null;
        });
    }

    appendStreamChunk(msgNode, chunkText) {
        // Special check for streaming CoT
        if (chunkText.includes('<thought>') || chunkText.includes('</thought>')) {
             // Redraw the entire node if a block is closed/opened to keep it clean
             // This is less efficient but necessary for complex structures
             return; 
        }
        msgNode.appendChild(document.createTextNode(chunkText));
        this.smoothScrollToBottom();
    }
}

const chatSession = new ChatManager();

// Sidebar Logic
const navNewChat = document.getElementById('nav-new-chat');
const navHistory = document.getElementById('nav-history');
const navModels = document.getElementById('nav-models');
const navSettings = document.getElementById('nav-settings');

navNewChat.addEventListener('click', () => {
    if (confirm("Start a new chat? This will clear current conversation.")) {
        chatHistory = [];
        chatMessages.innerHTML = '';
        chatSession.appendMessage('ai', "Hello! I'm your local AI assistant. How can I help you today?");
        chatSession.stopGeneration();
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
                chatSession.appendMessage('system', historyList);
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
    chatSession.appendMessage('ai', `${searchIcon} Accessing ${searchType}...`);

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

stopBtn.addEventListener('click', () => {
    chatSession.stopGeneration();
    chatSession.appendMessage('system', 'Generation stopped by user.');
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Reset input
    userInput.value = '';
    userInput.style.height = '56px';

    // Add user message to UI
    chatSession.appendMessage('user', text);

    // Prepare AI message shell
    const { msgContentNode: aiMsgContent } = chatSession.appendMessage('ai', '<span class="typing-indicator">...</span>');

    // Start Generation via ChatManager
    const signal = chatSession.startGeneration();

    // Multimodal Routing & Personas
    const selectedModel = modelSelect.value;
    const isGemini = selectedModel.includes('gemini');
    const apiEndpoint = isGemini ? '/api/chat-gemini' : 'http://localhost:11434/api/chat';

    const persona = personaSelect.value;
    const personas = {
        rixsz: `You are RIXSZ, a Senior AI Architect. 
Use a <thought> block to analyze the request before speaking. 
Always favor speed and high-IQ precision.`,
        gemini: "You are the Omni-reasoning Gemini 1.5 Pro. Use long-context and CoT reasoning.",
        translator: "You are a professional translator."
    };

    let systemPrompt = personas[persona] || personas.rixsz; // Default to RIXSZ
    let finalPrompt = text;

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
            chatSession.appendMessage('ai', `${searchIcon} ACCESSING ${searchType}... Query: "${commandQuery}"`);

            const searchResults = await performSearch(commandQuery, signal, isDarkWebSearch);

            aiMsgContent.innerHTML = '';
            aiMsgContent.textContent = searchResults;
            chatSession.smoothScrollToBottom();

            chatSession.stopGeneration();
            return;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('User aborted search');
            } else {
                console.error('Search Error:', error);
                aiMsgContent.textContent = `Error: ${error.message}`;
            }
            chatSession.stopGeneration();
            return;
        }
    }

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

    // Image Generation Logic - Enhanced Detection
    const imageKeywords = [
        'draw', 'paint', 'generate', 'create', 'make', 'design',
        'illustrate', 'sketch', 'render', 'visualize', 'show me'
    ];

    const imageNouns = [
        'image', 'picture', 'photo', 'illustration', 'artwork',
        'drawing', 'painting', 'sketch', 'visual', 'graphic'
    ];

    let isImageRequest = false;
    let imagePrompt = null;

    // Check for explicit image generation requests
    for (const keyword of imageKeywords) {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
        if (pattern.test(lowerText)) {
            for (const noun of imageNouns) {
                if (lowerText.includes(noun)) {
                    isImageRequest = true;
                    break;
                }
            }
            // Also check for "draw/paint/create [something]" without explicit image noun
            if (!isImageRequest && pattern.test(lowerText)) {
                const afterKeyword = text.split(new RegExp(keyword, 'i'))[1];
                if (afterKeyword && afterKeyword.trim().length > 3) {
                    isImageRequest = true;
                }
            }
            if (isImageRequest) break;
        }
    }

    if (isImageRequest) {
        // Extract the actual prompt by removing command words
        imagePrompt = text
            .replace(/^(can\s+you|please|could\s+you|would\s+you)?\s*/i, '')
            .replace(/\b(draw|paint|generate|create|make|design|illustrate|sketch|render|visualize|show\s+me)\b\s*/i, '')
            .replace(/\b(an?\s+)?(image|picture|photo|illustration|artwork|drawing|painting|sketch|visual|graphic)\s+(of|for|with)?\s*/i, '')
            .trim();
    }

    if (imagePrompt && imagePrompt.length > 2) {
        chatSession.appendMessage('ai', `🎨 Creating artwork: "${imagePrompt}"...`);
        aiMsgContent.innerHTML = '<span class="typing-indicator">✨ Generating your masterpiece...</span>';

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
                    <a href="data:image/png;base64,${imgData.image}" download="rixsz_${Date.now()}.png" class="download-link">💾 Download Image</a>
                </div>`;
                aiMsgContent.innerHTML = imgHTML;
                chatSession.smoothScrollToBottom();

                // Speak confirmation if voice is enabled
                speakText("Your image has been generated, Sir.");
            } else {
                throw new Error(imgData.message);
            }
        } catch (e) {
            const errorMsg = e.message || 'Unknown error';
            let userFriendlyMsg = '';

            if (errorMsg.includes('Stable Diffusion') || errorMsg.includes('7860')) {
                userFriendlyMsg = `⚠️ Image generation backend is offline.\n\n` +
                    `To enable image generation:\n` +
                    `1. Install Stable Diffusion WebUI (AUTOMATIC1111)\n` +
                    `2. Launch it on port 7860\n` +
                    `3. Try your request again\n\n` +
                    `Alternative: Use online services or other local AI image generators.`;
            } else if (errorMsg.includes('fetch')) {
                userFriendlyMsg = `❌ Cannot connect to image generation service.\n\n` +
                    `Please ensure Stable Diffusion WebUI is running on http://127.0.0.1:7860`;
            } else {
                userFriendlyMsg = `❌ Image Generation Failed: ${errorMsg}`;
            }

            aiMsgContent.textContent = userFriendlyMsg;
            chatSession.smoothScrollToBottom();
        } finally {
            chatSession.stopGeneration();
        }
        return; // Stop processing text generation
    }

    try {
        if (query) {
            const searchTypeStr = searchType || 'general';
            chatSession.appendMessage('ai', `🔐 ACCESSING TOR NETWORK... Targeted Search [${searchTypeStr.toUpperCase()}]`);
            const searchResults = await performSearch(query, signal, false);

            systemPrompt += `\n\nCONTEXT FROM SECURE WEB SEARCH (Query: ${query}):\n${searchResults}\n\nUse this context to answer the user's question accurately. If looking for social media, list the handles/URLs found.`;

            // Update the AI bubble to show we are now thinking about the result
            aiMsgContent.innerHTML = '<span class="typing-indicator">... analyzing encrypted data ...</span>';
        }

        // Prepare message payload
        const messages = [];
        messages.push({ role: 'system', content: systemPrompt });
        chatHistory.forEach(msg => messages.push(msg));
        const userMsg = { role: 'user', content: finalPrompt };
        messages.push(userMsg);

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel,
                messages: messages,
                stream: true
            }),
            signal: signal
        });

        if (!response.ok) throw new Error(`Backend Offline (${isGemini ? 'Gemini API' : 'Ollama'})`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        aiMsgContent.innerHTML = ''; 

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (isGemini) {
                // Gemini returns JSON chunks with multiples or combined segments
                await handleGeminiStream(chunk, aiMsgContent, (c) => {
                    fullResponse += c;
                    chatSession.smoothScrollToBottom();
                });
            } else {
                // Ollama returns standard JSON lines
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message && json.message.content) {
                            const content = json.message.content;
                            fullResponse += content;
                            chatSession.appendStreamChunk(aiMsgContent, content);
                        }
                    } catch(e) {}
                }
            }
        }

        chatHistory.push(userMsg);
        chatHistory.push({ role: 'assistant', content: fullResponse });
        if (chatHistory.length > HISTORY_LIMIT * 2) {
            chatHistory = chatHistory.slice(-HISTORY_LIMIT * 2);
        }
        speakText(fullResponse);

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('User aborted generation');
        } else {
            console.error('Chat Error:', error);
            aiMsgContent.textContent = `Error: ${error.message}. Make sure Ollama is running.`;
        }
    } finally {
        chatSession.stopGeneration();
    }
}
// --- Gemini Stream Handler ---
async function handleGeminiStream(chunk, msgNode, onText) {
    const lines = chunk.split('\n');
    for (const line of lines) {
        if (!line.trim() || line.startsWith('[')) continue; // Skip brackets in JSON array
        
        let cleanLine = line.trim();
        if (cleanLine.startsWith(',')) cleanLine = cleanLine.slice(1);
        if (cleanLine.endsWith(']')) cleanLine = cleanLine.slice(0, -1);
        
        try {
            const json = JSON.parse(cleanLine);
            if (json.candidates && json.candidates[0].content.parts) {
                const text = json.candidates[0].content.parts[0].text;
                onText(text);
                
                // If it's a thought block, it's safer to re-process the whole node after the stream
                // but for live preview we append to a temporary storage
                msgNode.appendChild(document.createTextNode(text));
            }
        } catch (e) {
            // Partial JSON or heartbeat
        }
    }
}

// Removed old appendMessage
