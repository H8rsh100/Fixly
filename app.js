const errorInput = document.getElementById('error-input');
const apiKeyInput = document.getElementById('api-key');
const explainBtn = document.getElementById('explain-btn');
const resultSection = document.getElementById('result-section');
const resultTitle = document.getElementById('result-title');
const resultContent = document.getElementById('result-content');
const copyBtn = document.getElementById('copy-btn');

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function loadApiKey() {
  const saved = localStorage.getItem('revvy_api_key');
  if (saved) {
    apiKeyInput.value = saved;
  }
}

function saveApiKey(key) {
  localStorage.setItem('revvy_api_key', key);
}

async function callGemini(errorText, apiKey) {
  const systemPrompt = `You are an expert developer assistant. When given an error message or stack trace:

1. **What it means**: Explain the error in simple, plain English that any developer can understand.
2. **Why it happened**: Describe the root cause clearly.
3. **How to fix it**: Provide step-by-step instructions with code examples where applicable.

Be concise but thorough. Use markdown formatting. Always structure your response with these three headings: "## What This Error Means", "## Why It Happened", and "## Step-by-Step Fix".`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `Here is my error/stack trace:\n\n\`\`\`\n${errorText}\n\`\`\`` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from AI. Please try again.');
  }

  return text;
}

function renderMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n---\n/g, '<hr>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(.+)$/gm, function(match) {
      if (match.startsWith('<')) return match;
      return '<p>' + match + '</p>';
    });
}

function showError(message) {
  resultSection.classList.remove('hidden', 'error');
  resultSection.classList.add('error');
  resultTitle.textContent = 'Error';
  resultContent.innerHTML = `<p style="color: var(--error)">${message}</p>`;
}

function showResult(markdown) {
  resultSection.classList.remove('hidden', 'error');
  resultTitle.textContent = 'Analysis Complete';
  resultContent.innerHTML = renderMarkdown(markdown);
}

function setLoading(loading) {
  explainBtn.disabled = loading;
  explainBtn.classList.toggle('loading', loading);
}

async function handleExplain() {
  const errorText = errorInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!errorText) {
    showError('Please paste an error message or stack trace first.');
    errorInput.focus();
    return;
  }

  if (!apiKey) {
    showError('Please enter your Gemini API key.');
    apiKeyInput.focus();
    return;
  }

  saveApiKey(apiKey);
  setLoading(true);

  try {
    const response = await callGemini(errorText, apiKey);
    showResult(response);
  } catch (err) {
    showError(`Failed to analyze: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

function handleCopy() {
  const text = resultContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const original = copyBtn.innerHTML;
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
    setTimeout(() => { copyBtn.innerHTML = original; }, 2000);
  });
}

explainBtn.addEventListener('click', handleExplain);
copyBtn.addEventListener('click', handleCopy);
errorInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    handleExplain();
  }
});

loadApiKey();
