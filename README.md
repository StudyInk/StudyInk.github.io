# StudyInk — v1

A browser-based Goodnotes-style notebook prototype built with plain HTML, CSS, and JavaScript.

## Run
Open `index.html` in a modern browser.

For best results, use a local server (especially if you later add modules/assets):
- VS Code Live Server
- `python -m http.server`

## Included
- Canvas handwriting with mouse/touch/stylus
- Pen, eraser, highlighter
- Color and size controls
- Undo/redo
- Multiple pages
- LocalStorage persistence
- Image import
- Responsive/iPad-friendly layout
- AI assistant UI with Solve, Explain, Check, Research, Summarize, Quiz modes

## Next step for real AI
Do NOT put an AI API key in `app.js`. Add a small server endpoint such as `/api/ai` and have the browser POST the user's question/image to that server. The server can then call your chosen AI provider and web-search service.
