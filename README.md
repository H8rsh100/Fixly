# Revvy

Paste your error. Get a clear explanation and fix.

Revvy is a single-page web app that analyzes error messages and stack traces using Google's Gemini AI, then explains what went wrong in plain English and provides step-by-step instructions to fix it.

## Features

- **Error Analysis**: Paste any error message or stack trace
- **Plain English Explanations**: Understand what the error means without jargon
- **Step-by-Step Fixes**: Actionable solutions with code examples
- **Dark Developer Theme**: Easy on the eyes for late-night debugging
- **Local API Key Storage**: Your Gemini API key stays in your browser

## Setup

1. **Get a Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Sign in and create an API key (free tier available)

2. **Open the App**
   - Simply open `index.html` in your browser, or
   - Serve it locally:
     ```bash
     # Using Python
     python -m http.server 8000

     # Using Node.js
     npx serve .
     ```

3. **Start Debugging**
   - Paste your API key (saved locally in your browser)
   - Paste your error message or stack trace
   - Click **Explain & Fix** (or press `Ctrl+Enter`)

## Project Structure

```
Fixly/
├── index.html    # Main HTML structure
├── style.css     # Dark theme styling
├── app.js        # Gemini API integration & UI logic
└── README.md     # You are here
```

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no build tools required)
- Google Gemini 2.5 Flash API
- GitHub Pages ready (just push and enable)

## License

MIT
