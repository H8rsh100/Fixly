const errorInput = document.getElementById('error-input');
const apiKeyInput = document.getElementById('api-key');
const explainBtn = document.getElementById('explain-btn');
const resultSection = document.getElementById('result-section');
const resultTitle = document.getElementById('result-title');
const resultContent = document.getElementById('result-content');
const copyBtn = document.getElementById('copy-btn');

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function loadApiKey() {
  const saved = localStorage.getItem('fixly_api_key');
  if (saved) {
    apiKeyInput.value = saved;
  }
}

function saveApiKey(key) {
  localStorage.setItem('fixly_api_key', key);
}

async function callGemini(errorText, apiKey) {
  const systemPrompt = `You are an expert developer assistant. When given an error message or stack trace:

1. **What it means**: Explain the error in simple, plain English that any developer can understand.
2. **Why it happened**: Describe the root cause clearly.
3. **How to fix it**: Provide step-by-step instructions with code examples where applicable.

Be concise but thorough. Use markdown formatting. You MUST use exactly these three level-2 headings:
## What Happened
## Why It Happened
## How to Fix`;

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

function parseMarkdownToHtml(text) {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
}

function processLists(html) {
  return html.replace(/(<li>[\s\S]*?<\/li>)/g, function(match) {
    if (!match.startsWith('<ul') && !match.startsWith('<ol')) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });
}

function splitIntoSections(markdown) {
  const sectionRegex = /^## (.+)$/gm;
  const sections = [];
  let match;
  let lastIndex = 0;
  let prevTitle = null;

  while ((match = sectionRegex.exec(markdown)) !== null) {
    if (prevTitle !== null) {
      sections.push({
        title: prevTitle,
        content: markdown.substring(lastIndex, match.index).trim()
      });
    }
    prevTitle = match[1];
    lastIndex = match.index + match[0].length;
  }

  if (prevTitle !== null) {
    sections.push({
      title: prevTitle,
      content: markdown.substring(lastIndex).trim()
    });
  }

  return sections;
}

function getSectionClass(title) {
  const lower = title.toLowerCase();
  if (lower.includes('what') || lower.includes('happened') || lower.includes('means')) {
    return 'error-section';
  }
  if (lower.includes('why') || lower.includes('cause')) {
    return 'warn-section';
  }
  if (lower.includes('how') || lower.includes('fix') || lower.includes('solve') || lower.includes('step')) {
    return 'success-section';
  }
  return '';
}

function getSectionTag(title, className) {
  if (className === 'error-section') return 'What Happened';
  if (className === 'warn-section') return 'Why It Happened';
  if (className === 'success-section') return 'How to Fix';
  return title;
}

function renderSectionedResult(markdown) {
  const sections = splitIntoSections(markdown);

  if (sections.length === 0) {
    return `<div class="result-section-inner"><p>${parseMarkdownToHtml(markdown)}</p></div>`;
  }

  return sections.map(section => {
    const className = getSectionClass(section.title);
    const tag = getSectionTag(section.title, className);
    const html = parseMarkdownToHtml(section.content);
    const processed = processLists(html);
    const paragraphs = processed
      .split(/\n\n+/)
      .map(block => {
        block = block.trim();
        if (!block || block.startsWith('<h') || block.startsWith('<pre') || block.startsWith('<ul') || block.startsWith('<ol')) {
          return block;
        }
        return '<p>' + block + '</p>';
      })
      .join('\n');

    return `
      <div class="result-section-inner ${className}">
        <span class="section-tag">${tag}</span>
        ${paragraphs}
      </div>`;
  }).join('\n<hr>\n');
}

function showError(message) {
  resultSection.classList.remove('hidden', 'error');
  resultSection.classList.add('error');
  resultTitle.textContent = 'Error';
  resultContent.innerHTML = `<p>${message}</p>`;
}

function showResult(markdown) {
  resultSection.classList.remove('hidden', 'error');
  resultTitle.textContent = 'Analysis Complete';
  resultContent.innerHTML = renderSectionedResult(markdown);
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
