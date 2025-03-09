// Get DOM elements
const textarea = document.getElementById('search-input');
const button = document.getElementById('send-button');
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggle-sidebar');
const newChatCircle = document.getElementById('new-chat-circle');
const historyList = document.getElementById('history-list');
const chatContainer = document.getElementById('chat-container');
const emptyChatBackground = document.getElementById('empty-chat-background');
const placeholders = [
    "Ask anything...", 
    "What's on your mind?", 
    "How can I assist you today?", 
    "Ready when you are...",
    "Type /help for commands"
];
let placeholderIndex = 0;
let currentSessionId = null;
let messages = []; // Store chat history
let isThinking = false; // Flag to indicate if the AI is thinking

// Add logo to the page
const logoElement = document.createElement('div');
logoElement.className = 'app-logo';
logoElement.textContent = 'palina.ai';
document.body.appendChild(logoElement);

// Environment configuration
const env = "prod";
const url = env === "dev"
    ? "http://localhost:3000/api/ai/completion/message"
    : "https://infeeai-self.vercel.app/api/ai/completion/message";

// Enhanced theme colors with futuristic names
const themeColors = [
    { name: 'Cosmic Purple', color: '#9D4EDD' },
    { name: 'Neon Blue', color: '#3A86FF' },
    { name: 'Cyber Green', color: '#2EC4B6' },
    { name: 'Plasma Pink', color: '#FF006E' },
    { name: 'Quantum Orange', color: '#FB5607' },
    { name: 'Void Black', color: '#252525' },
    { name: 'Electric Gold', color: '#FFBE0B' }
];

// Function to apply theme color and update UI elements
function changeThemeColor(selectedColor) {
    document.documentElement.style.setProperty('--primary-color', selectedColor);
    document.documentElement.style.setProperty('--gradient-start', selectedColor);
    
    // Calculate a darker shade for gradient end
    const darkerShade = adjustColorBrightness(selectedColor, -30);
    document.documentElement.style.setProperty('--gradient-end', darkerShade);
    
    // Update accent glow with transparency
    const glowColor = selectedColor.replace(')', ', 0.5)').replace('rgb', 'rgba');
    document.documentElement.style.setProperty('--accent-glow', glowColor);
    
    // Save the selected color to localStorage
    localStorage.setItem('themeColor', selectedColor);
}

// Helper function to darken/lighten colors
function adjustColorBrightness(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Populate the color picker dropdown
const colorPicker = document.getElementById('theme-color');
themeColors.forEach(color => {
    const option = document.createElement('option');
    option.value = color.color;
    option.textContent = color.name;
    colorPicker.appendChild(option);
});

// Load saved theme color if exists
const savedColor = localStorage.getItem('themeColor');
if (savedColor) {
    colorPicker.value = savedColor;
    changeThemeColor(savedColor);
} else {
    // Set default color
    changeThemeColor(themeColors[0].color);
}

// Attach event listener to the color picker
colorPicker.addEventListener('change', function() {
    const selectedColor = colorPicker.value;
    changeThemeColor(selectedColor);
});

// Change placeholder text with smooth animation
function changePlaceholder() {
    textarea.style.opacity = 0;
    
    setTimeout(() => {
        textarea.placeholder = placeholders[placeholderIndex];
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        textarea.style.opacity = 1;
    }, 200);
}

// Set initial placeholder and start interval
textarea.placeholder = placeholders[0];
setInterval(changePlaceholder, 3000);

// Auto-resize textarea on input
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.max(this.scrollHeight, 60) + 'px'; // maintain at least the initial height

    if (this.value.trim() !== "") {
        button.classList.add('visible');
    } else {
        button.classList.remove('visible');
    }
});

// Allow sending messages with Enter key (Shift+Enter for new line)
textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim() !== "") {
            button.click();
        }
    }
});

// Initialize the chat and history from localStorage
function initializeFromLocalStorage() {
    const historyData = JSON.parse(localStorage.getItem('historyData')) || [];
    currentSessionId = localStorage.getItem('currentSessionId') || generateUUID();

    historyData.forEach((session) => {
        addHistoryItem(session.id, session.title, session.lastUpdated);
    });

    messages = JSON.parse(localStorage.getItem(currentSessionId)) || [];
    messages.forEach(({ text, type, timestamp }) => {
        addChatBubble(text, type, timestamp);
    });

    updateEmptyChatBackground();
    scrollToBottom();
}

// Generate a UUID for session tracking
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Toggle sidebar with animation
toggleSidebar.addEventListener('click', function() {
    if (historyList.children.length === 0) {
        showToast('No chat history available. Start a new conversation!');
        return;
    }
    sidebar.classList.toggle('open');
    
    // Add overlay when sidebar is open
    if (sidebar.classList.contains('open')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '2000';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);
        
        // Animate overlay
        setTimeout(() => overlay.style.opacity = '1', 10);
        
        // Close sidebar when clicking outside
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.style.opacity = '0';
            setTimeout(() => document.body.removeChild(overlay), 300);
        });
    } else {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => document.body.removeChild(overlay), 300);
        }
    }
});

// Create a toast notification function
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
        padding: '12px 20px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        zIndex: '9999',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        fontSize: '14px'
    });
    
    document.body.appendChild(toast);
    
    // Animate toast in
    setTimeout(() => toast.style.opacity = '1', 10);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
}

// Handle new chat button click with animation
newChatCircle.addEventListener('click', function() {
    // Add animation class
    newChatCircle.classList.add('rotate-animation');
    
    // Create a new UUID for the session
    currentSessionId = generateUUID();
    localStorage.setItem('currentSessionId', currentSessionId);
    
    // Clear the chat container with fade effect
    const bubbles = chatContainer.querySelectorAll('.chat-bubble');
    bubbles.forEach((bubble, index) => {
        setTimeout(() => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(20px)';
        }, index * 50);
    });
    
    // After animations complete, clear the chat
    setTimeout(() => {
        chatContainer.innerHTML = '';
        textarea.value = '';
        textarea.style.height = '60px'; // Reset height to default
        button.classList.remove('visible');
        messages = []; // Clear messages
        updateEmptyChatBackground();
        
        // Show toast notification
        showToast('Started a new conversation!');
        
        // Remove animation class
        newChatCircle.classList.remove('rotate-animation');
    }, bubbles.length > 0 ? bubbles.length * 50 + 300 : 300);
});

// Add rotation animation
const style = document.createElement('style');
style.textContent = `
    .rotate-animation {
        animation: rotate-once 0.5s ease-in-out;
    }
    
    @keyframes rotate-once {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Handle send button click with enhanced animations
button.addEventListener('click', function() {
    if (textarea.value.trim() !== "") {
        const question = textarea.value.trim();
        const timestamp = new Date().toLocaleString();

        // Check for special commands
        if (question.toLowerCase() === '/help') {
            addChatBubble('Available commands:\n/help - Show this help message\n/clear - Clear current conversation\n/theme - Show theme options', 'answer', timestamp);
            textarea.value = "";
            textarea.style.height = '60px';
            button.classList.remove('visible');
            return;
        }
        
        if (question.toLowerCase() === '/clear') {
            chatContainer.innerHTML = '';
            messages = [];
            updateEmptyChatBackground();
            textarea.value = "";
            textarea.style.height = '60px';
            button.classList.remove('visible');
            showToast('Conversation cleared!');
            return;
        }
        
        if (question.toLowerCase() === '/theme') {
            const themeList = themeColors.map(t => t.name).join('\n');
            addChatBubble(`Available themes:\n${themeList}\n\nSelect a theme using the color picker in the top left corner.`, 'answer', timestamp);
            textarea.value = "";
            textarea.style.height = '60px';
            button.classList.remove('visible');
            return;
        }

        const newMessage = {
            role: 'user', // Ensure the 'role' field is included
            content: question,
            timestamp: timestamp
        };

        messages.push(newMessage);
        addChatBubble(question, 'question', timestamp);
        showLoadingIndicator();

        // Add button click animation
        button.style.transform = 'translateY(-50%) scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'translateY(-50%) scale(1)';
        }, 100);

        textarea.value = ""; // Clear the textarea
        textarea.style.height = '60px'; // Reset height to default
        button.classList.remove('visible'); // Hide send button after sending

        scrollToBottom();

        // Ensure each message in history has both 'content' and 'role'
        const formattedMessages = messages.map(msg => ({
            content: msg.content,
            role: msg.role === 'ai' ? 'assistant' : msg.role, // Map 'ai' to 'assistant'
            timestamp: msg.timestamp
        }));

        // Send message to server via API
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    content: newMessage.content,
                    role: newMessage.role
                },
                history: formattedMessages
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            removeLoadingIndicator();
            const response = data.response; // Match with server's response structure
            const timestamp = new Date().toLocaleString();
            addChatBubble(response, 'answer', timestamp);
            updateSession(newMessage.content, response, timestamp);
            scrollToBottom();
        })
        .catch(error => {
            console.error('Error communicating with the server:', error);
            removeLoadingIndicator();
            addChatBubble('Error connecting to the server. Please try again later.', 'answer', new Date().toLocaleString());
            showToast('Connection error! Please check your internet connection.', 5000);
        });
    }
});

// Add chat bubble with enhanced formatting and animation
function addChatBubble(text, type, timestamp = new Date().toLocaleTimeString()) {
    const chatBubble = document.createElement('div');
    chatBubble.className = `chat-bubble ${type}`;
    
    // Style new bubble to prepare for animation
    chatBubble.style.opacity = '0';
    chatBubble.style.transform = 'translateY(20px)';
    
    // Format the text content with enhanced code highlighting
    const formattedText = formatText(text);
    chatBubble.innerHTML = formattedText;

    const timeElement = document.createElement('div');
    timeElement.className = 'chat-timestamp';
    timeElement.textContent = timestamp;

    chatBubble.appendChild(timeElement);
    chatContainer.appendChild(chatBubble);
    
    // Trigger animation after a short delay
    setTimeout(() => {
        chatBubble.style.opacity = '1';
        chatBubble.style.transform = 'translateY(0)';
    }, 10);
}

// Enhanced text formatting with code highlighting
function formatText(text) {
    // Handle code blocks with syntax highlighting
    const codeBlockPattern = /```([\w]*)\n([\s\S]*?)```/g;
    let formattedText = text.replace(codeBlockPattern, (match, language, code) => {
        // Escape HTML entities in the code block
        const escapedCode = escapeHTML(code.trim());
                // Apply syntax highlighting based on the language
                const langClass = language ? `language-${language}` : '';
                return `<pre><code class="${langClass}">${escapedCode}</code></pre>`;
            });
        
            // Handle inline code snippets
            formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
        
            // Handle URLs and make them clickable
            formattedText = formattedText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
            // Handle line breaks and paragraphs
            formattedText = formattedText.replace(/\n/g, '<br>');
        
            return formattedText;
        }
        
        // Helper function to escape HTML entities
        function escapeHTML(str) {
            return str.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#039;');
        }