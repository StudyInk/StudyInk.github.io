# StudyInk

A browser-based notebook built with HTML, CSS and JavaScript. The project is hosted as a GitHub Pages site.

## Repository structure

```text
StudyInk.github.io/
├── index.html              # GitHub Pages entry point
├── README.md               # Project overview and setup
├── css/
│   └── style.css           # Application styles and responsive layout
└── js/
    ├── app.js              # Main application and notebook logic
    └── enhancements.js     # Additional tools and enhancements
```

## Run locally

Open `index.html` in a modern browser, or start a local server from the repository root:

```bash
python -m http.server 8000
``

Then visit `http://localhost:8000`.

## Included

- Canvas handwriting with mouse, touch and stylus
- Pen, eraser and highlighter tools
- Color and size controls, undo and redo
- Multiple pages and local browser storage
- Image and PDF import/export tools
- Notebook library, favorites, trash and search
- Responsive layouts for desktop, tablet and mobile

## Notes

- Notebook data is stored locally in the browser unless exported/backed up.
- PDF.js is loaded from a CDN for PDF import.
- Do not place private API keys in frontend JavaScript. Use a server-side endpoint for any future AI integration.
