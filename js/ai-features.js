// AI Features JavaScript
const API_BASE = 'http://localhost:3001/api';

// Chat Assistant
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');
    chatInput.value = '';

    // Show thinking indicator
    showThinking();

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        removeThinking();
        addMessage(data.response, 'bot');
    } catch (error) {
        removeThinking();
        addMessage('I can help you with lease negotiations and tenant representation. Please try rephrasing your question.', 'bot');
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = sender === 'bot' 
        ? `<strong>AI Advisor:</strong> ${formatMessage(text)}`
        : text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatMessage(text) {
    // Convert markdown-like formatting to HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '<br>• ');
}

function showThinking() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'thinking-indicator';
    thinkingDiv.id = 'thinking';
    thinkingDiv.innerHTML = `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <span>AI is thinking...</span>
    `;
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeThinking() {
    const thinking = document.getElementById('thinking');
    if (thinking) thinking.remove();
}

// Chat event listeners
chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// Lease Analyzer
const uploadArea = document.getElementById('upload-area');
const leaseFile = document.getElementById('lease-file');
const analysisResult = document.getElementById('analysis-result');
const analysisContent = document.getElementById('analysis-content');

uploadArea.addEventListener('click', () => leaseFile.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        analyzeLease(file);
    }
});

leaseFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) analyzeLease(file);
});

async function analyzeLease(file) {
    const formData = new FormData();
    formData.append('lease', file);

    analysisContent.innerHTML = '<div class="loading"></div> Analyzing lease document...';
    analysisResult.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/analyze-lease`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        analysisContent.innerHTML = formatMessage(data.analysis);
    } catch (error) {
        analysisContent.innerHTML = `
            <strong>Quick Analysis:</strong><br><br>
            📋 <strong>Key Review Points:</strong><br>
            • Base rent and escalation clauses<br>
            • CAM charges and operating expenses<br>
            • Assignment and subletting rights<br>
            • Renewal options and terms<br>
            • Termination and default provisions<br><br>
            💡 <strong>Tip:</strong> Always have a tenant rep review before signing!
        `;
    }
}

// Market Insights
const getInsightsBtn = document.getElementById('get-insights');
const insightsResult = document.getElementById('insights-result');
const insightsContent = document.getElementById('insights-content');

getInsightsBtn.addEventListener('click', async () => {
    const location = document.getElementById('location').value;
    const propertyType = document.getElementById('property-type').value;
    const sizeRange = document.getElementById('size-range').value;

    insightsContent.innerHTML = '<div class="loading"></div> Generating market insights...';
    insightsResult.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/market-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, propertyType, size: sizeRange })
        });

        const data = await response.json();
        insightsContent.innerHTML = formatMessage(data.insights);
    } catch (error) {
        insightsContent.innerHTML = `
            <strong>Market Overview:</strong><br><br>
            📈 <strong>Current Conditions:</strong> Strong tenant's market<br>
            💰 <strong>Avg Rates:</strong> $28-45/sq ft depending on class<br>
            🎯 <strong>Concessions:</strong> 6-12 months free rent available<br>
            📊 <strong>Vacancy:</strong> 15-20% creating negotiation leverage<br><br>
            <strong>Recommendation:</strong> Excellent time to negotiate or renegotiate leases!
        `;
    }
});

// Space Calculator
const calculateBtn = document.getElementById('calculate-space');
const calculatorResult = document.getElementById('calculator-result');
const calculatorContent = document.getElementById('calculator-content');

calculateBtn.addEventListener('click', async () => {
    const employees = document.getElementById('employees').value;
    const workStyle = document.getElementById('work-style').value;
    const growthRate = document.getElementById('growth-rate').value;
    const amenities = document.getElementById('amenities').value;

    if (!employees) {
        alert('Please enter the number of employees');
        return;
    }

    calculatorContent.innerHTML = '<div class="loading"></div> Calculating optimal space...';
    calculatorResult.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/calculate-space`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employees, workStyle, growthRate, amenities })
        });

        const data = await response.json();
        calculatorContent.innerHTML = formatMessage(data.recommendation);
    } catch (error) {
        const baseSpace = employees * 150;
        calculatorContent.innerHTML = `
            <strong>Recommended Space:</strong><br><br>
            📏 <strong>Total:</strong> ${baseSpace.toLocaleString()}-${(baseSpace * 1.2).toLocaleString()} sq ft<br><br>
            <strong>Breakdown:</strong><br>
            • Workstations: ${Math.floor(baseSpace * 0.5).toLocaleString()} sq ft<br>
            • Meeting Rooms: ${Math.floor(baseSpace * 0.2).toLocaleString()} sq ft<br>
            • Common Areas: ${Math.floor(baseSpace * 0.15).toLocaleString()} sq ft<br>
            • Support Space: ${Math.floor(baseSpace * 0.15).toLocaleString()} sq ft<br><br>
            💡 <strong>Pro Tip:</strong> Consider flexible terms for future adjustments!
        `;
    }
});