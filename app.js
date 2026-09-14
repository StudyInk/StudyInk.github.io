/* =========================================================
   STUDYINK
   Main application
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "studyink_notebooks_v1";
const ACTIVE_BOOK_KEY = "studyink_active_notebook_v1";


/* =========================================================
   DOM
========================================================= */

const libraryView = document.getElementById("libraryView");
const notebookView = document.getElementById("notebookView");

const documentGrid = document.getElementById("documentGrid");

const newNotebookButton =
  document.getElementById("newNotebook");

const backButton =
  document.getElementById("backButton");

const renameButton =
  document.getElementById("renameButton");

const bookTitle =
  document.getElementById("bookTitle");

const canvas =
  document.getElementById("canvas");

const paper =
  document.getElementById("paper");

const paperStage =
  document.getElementById("paperStage");

const textLayer =
  document.getElementById("textLayer");

const textInput =
  document.getElementById("textInput");

const pageSidebar =
  document.getElementById("pageSidebar");

const pageList =
  document.getElementById("pageList");

const pageIndicator =
  document.getElementById("pageIndicator");

const addPage =
  document.getElementById("addPage");

const addPageTop =
  document.getElementById("addPageTop");

const pagesButton =
  document.getElementById("pagesButton");

const searchButton =
  document.getElementById("searchButton");

const searchOverlay =
  document.getElementById("searchOverlay");

const closeSearch =
  document.getElementById("closeSearch");

const searchInput =
  document.getElementById("searchInput");

const searchResults =
  document.getElementById("searchResults");

const saveStatus =
  document.getElementById("saveStatus");

const toast =
  document.getElementById("toast");

const undoButton =
  document.getElementById("undo");

const redoButton =
  document.getElementById("redo");

const sizeDown =
  document.getElementById("sizeDown");

const sizeUp =
  document.getElementById("sizeUp");

const sizeDisplay =
  document.getElementById("sizeDisplay");

const sizeMenu =
  document.getElementById("sizeMenu");

const penPalette =
  document.getElementById("penPalette");


/* =========================================================
   STATE
========================================================= */

let notebooks = [];
let activeNotebook = null;
let activePageIndex = 0;

let currentTool = "pen";
let currentColor = "#111111";
let currentSize = 3;

let isDrawing = false;

let currentStroke = null;

let undoStack = [];
let redoStack = [];

let textEditing = false;

let saveTimer = null;
let toastTimer = null;


/* =========================================================
   CANVAS CONFIG
========================================================= */

const PAPER_WIDTH = 900;
const PAPER_HEIGHT = 1165;

const DEVICE_PIXEL_RATIO =
  Math.max(1, Math.min(window.devicePixelRatio || 1, 2));


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", init);


function init() {

  loadNotebooks();

  setupCanvas();

  setupEvents();

  if (notebooks.length === 0) {
    createNotebook("Unbenanntes Notizbuch", true);
  }

  const storedActive =
    localStorage.getItem(ACTIVE_BOOK_KEY);

  if (storedActive) {

    const found =
      notebooks.find(
        book => book.id === storedActive
      );

    if (found) {
      activeNotebook = found;
    }
  }

  if (!activeNotebook) {
    activeNotebook = notebooks[0];
  }

  activePageIndex = Math.min(
    activeNotebook.pages.length - 1,
    activeNotebook.currentPage || 0
  );

  showNotebook();

  renderAll();

  window.addEventListener(
    "resize",
    resizeCanvas
  );
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

  /* Library */

  if (newNotebookButton) {
    newNotebookButton.addEventListener(
      "click",
      () => createNotebook()
    );
  }


  /* Navigation */

  backButton.addEventListener(
    "click",
    () => {
      saveCurrentNotebook();
      showLibrary();
    }
  );


  renameButton.addEventListener(
    "click",
    renameNotebook
  );


  /* Pages */

  pagesButton.addEventListener(
    "click",
    togglePageSidebar
  );

  addPage.addEventListener(
    "click",
    addNewPage
  );

  addPageTop.addEventListener(
    "click",
    addNewPage
  );


  /* Tools */

  document
    .querySelectorAll("[data-tool]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const tool =
            button.dataset.tool;

          setTool(tool);
        }
      );

    });


  /* Colors */

  document
    .querySelectorAll(".color")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const color =
            button.dataset.color;

          setColor(color);
        }
      );

    });


  /* Size */

  sizeDown.addEventListener(
    "click",
    () => changeSize(-1)
  );

  sizeUp.addEventListener(
    "click",
    () => changeSize(1)
  );

  sizeMenu.addEventListener(
    "click",
    showSizeMenu
  );


  /* History */

  undoButton.addEventListener(
    "click",
    undo
  );

  redoButton.addEventListener(
    "click",
    redo
  );


  /* Search */

  searchButton.addEventListener(
    "click",
    openSearch
  );

  closeSearch.addEventListener(
    "click",
    closeSearchDialog
  );

  searchInput.addEventListener(
    "input",
    performSearch
  );


  /* Canvas */

  canvas.addEventListener(
    "pointerdown",
    handlePointerDown
  );

  canvas.addEventListener(
    "pointermove",
    handlePointerMove
  );

  canvas.addEventListener(
    "pointerup",
    handlePointerUp
  );

  canvas.addEventListener(
    "pointercancel",
    handlePointerUp
  );

  canvas.addEventListener(
    "pointerleave",
    handlePointerLeave
  );


  /* Keyboard */

  document.addEventListener(
    "keydown",
    handleKeyboard
  );

}


/* =========================================================
   STORAGE
========================================================= */

function loadNotebooks() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      notebooks = [];
      return;
    }

    notebooks =
      JSON.parse(raw);

    if (!Array.isArray(notebooks)) {
      notebooks = [];
    }

  } catch (error) {

    console.error(
      "StudyInk: Speicher konnte nicht geladen werden.",
      error
    );

    notebooks = [];
  }
}


function saveNotebooks() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notebooks)
    );

    if (activeNotebook) {

      localStorage.setItem(
        ACTIVE_BOOK_KEY,
        activeNotebook.id
      );
    }

    setSaveStatus("Gespeichert");

  } catch (error) {

    console.error(
      "StudyInk: Speichern fehlgeschlagen.",
      error
    );

    setSaveStatus("Speichern fehlgeschlagen");
  }
}


function scheduleSave() {

  setSaveStatus("Speichert …");

  clearTimeout(saveTimer);

  saveTimer =
    setTimeout(
      () => {
        saveCurrentNotebook();
      },
      350
    );
}


function saveCurrentNotebook() {

  if (!activeNotebook) {
    return;
  }

  activeNotebook.updatedAt =
    new Date().toISOString();

  activeNotebook.currentPage =
    activePageIndex;

  saveNotebooks();
}


/* =========================================================
   NOTEBOOKS
========================================================= */

function createNotebook(
  name = null,
  openImmediately = true
) {

  const now =
    new Date().toISOString();

  const notebook = {

    id:
      "book_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2),

    name:
      name ||
      "Neues Notizbuch",

    createdAt: now,

    updatedAt: now,

    currentPage: 0,

    pages: [
      createPage(1),
      createPage(2)
    ]
  };

  notebooks.unshift(notebook);

  activeNotebook = notebook;
  activePageIndex = 0;

  saveNotebooks();

  if (openImmediately) {
    showNotebook();
    renderAll();
  }

  showToast("Neues Notizbuch erstellt");
}


function createPage(number) {

  return {

    id:
      "page_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2),

    number,

    createdAt:
      new Date().toISOString(),

    strokes: [],

    texts: []
  };
}


function deleteNotebook(id) {

  const index =
    notebooks.findIndex(
      book => book.id === id
    );

  if (index === -1) {
    return;
  }

  const confirmed =
    confirm(
      "Dieses Notizbuch wirklich löschen?"
    );

  if (!confirmed) {
    return;
  }

  notebooks.splice(index, 1);

  if (notebooks.length === 0) {

    activeNotebook = null;

    createNotebook(
      "Unbenanntes Notizbuch",
      false
    );
  }

  activeNotebook =
    notebooks[0];

  activePageIndex = 0;

  saveNotebooks();

  renderLibrary();
}


/* =========================================================
   VIEWS
========================================================= */

function showNotebook() {

  libraryView.classList.add("hidden");

  notebookView.classList.remove("hidden");
}


function showLibrary() {

  notebookView.classList.add("hidden");

  libraryView.classList.remove("hidden");

  renderLibrary();
}


/* =========================================================
   LIBRARY
========================================================= */

function renderLibrary() {

  documentGrid.innerHTML = "";

  if (notebooks.length === 0) {

    const empty =
      document.createElement("div");

    empty.textContent =
      "Noch keine Notizbücher.";

    documentGrid.appendChild(empty);

    return;
  }


  notebooks.forEach(
    notebook => {

      const card =
        document.createElement("article");

      card.className =
        "document-card";


      const preview =
        document.createElement("div");

      preview.className =
        "document-preview";


      const title =
        document.createElement("div");

      title.className =
        "document-title";

      title.textContent =
        notebook.name;


      const meta =
        document.createElement("div");

      meta.className =
        "document-meta";

      meta.textContent =
        `${notebook.pages.length} Seiten`;


      card.appendChild(preview);
      card.appendChild(title);
      card.appendChild(meta);


      card.addEventListener(
        "click",
        () => {

          activeNotebook =
            notebook;

          activePageIndex =
            notebook.currentPage || 0;

          showNotebook();

          renderAll();

          saveNotebooks();
        }
      );


      documentGrid.appendChild(card);

    }
  );
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  if (!activeNotebook) {
    return;
  }

  bookTitle.textContent =
    activeNotebook.name;

  renderPages();

  renderTextLayer();

  resizeCanvas();

  redrawCanvas();

  updatePageIndicator();

  updateHistoryButtons();
}


/* =========================================================
   PAGE MANAGEMENT
========================================================= */

function renderPages() {

  pageList.innerHTML = "";

  activeNotebook.pages.forEach(
    (page, index) => {

      const thumb =
        document.createElement("div");

      thumb.className =
        "page-thumb";

      if (index === activePageIndex) {
        thumb.classList.add("active");
      }


      const miniPaper =
        document.createElement("div");

      miniPaper.className =
        "page-thumb-paper";


      const number =
        document.createElement("div");

      number.className =
        "page-number";

      number.textContent =
        index + 1;


      thumb.appendChild(miniPaper);
      thumb.appendChild(number);


      thumb.addEventListener(
        "click",
        () => selectPage(index)
      );


      pageList.appendChild(thumb);

    }
  );
}


function selectPage(index) {

  if (
    index < 0 ||
    index >= activeNotebook.pages.length
  ) {
    return;
  }

  finishTextEditing();

  activePageIndex = index;

  activeNotebook.currentPage =
    index;

  undoStack = [];
  redoStack = [];

  renderAll();

  scheduleSave();
}


function addNewPage() {

  finishTextEditing();

  const page =
    createPage(
      activeNotebook.pages.length + 1
    );

  activeNotebook.pages.push(page);

  activePageIndex =
    activeNotebook.pages.length - 1;

  undoStack = [];
  redoStack = [];

  renderAll();

  scheduleSave();

  showToast(
    `Seite ${activePageIndex + 1} erstellt`
  );
}


/* =========================================================
   SIDEBAR
========================================================= */

function togglePageSidebar() {

  pageSidebar.classList.toggle("open");

}


/* =========================================================
   PAGE INDICATOR
========================================================= */

function updatePageIndicator() {

  pageIndicator.textContent =
    `${activePageIndex + 1} von ${activeNotebook.pages.length}`;
}


/* =========================================================
   CANVAS
========================================================= */

function setupCanvas() {

  resizeCanvas();

}


function resizeCanvas() {

  if (!canvas || !paper) {
    return;
  }

  const rect =
    paper.getBoundingClientRect();

  if (
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return;
  }

  const scaleX =
    rect.width / PAPER_WIDTH;

  const scaleY =
    rect.height / PAPER_HEIGHT;


  canvas.width =
    Math.round(
      PAPER_WIDTH *
      DEVICE_PIXEL_RATIO
    );

  canvas.height =
    Math.round(
      PAPER_HEIGHT *
      DEVICE_PIXEL_RATIO
    );


  canvas.style.width =
    `${rect.width}px`;

  canvas.style.height =
    `${rect.height}px`;


  const ctx =
    canvas.getContext("2d");

  ctx.setTransform(
    DEVICE_PIXEL_RATIO,
    0,
    0,
    DEVICE_PIXEL_RATIO,
    0,
    0
  );

  redrawCanvas();

}


function getCanvasPosition(event) {

  const rect =
    canvas.getBoundingClientRect();

  const x =
    (
      (event.clientX - rect.left) /
      rect.width
    ) *
    PAPER_WIDTH;

  const y =
    (
      (event.clientY - rect.top) /
      rect.height
    ) *
    PAPER_HEIGHT;

  return {
    x,
    y
  };
}


/* =========================================================
   DRAWING
========================================================= */

function handlePointerDown(event) {

  if (
    currentTool === "text"
  ) {

    createTextAtPointer(event);

    return;
  }


  if (
    currentTool === "lasso"
  ) {

    return;
  }


  if (
    currentTool === "shapes"
  ) {

    startShape(event);

    return;
  }


  event.preventDefault();

  canvas.setPointerCapture(
    event.pointerId
  );

  const point =
    getCanvasPosition(event);

  isDrawing = true;

  currentStroke = {

    tool:
      currentTool,

    color:
      currentColor,

    size:
      currentSize,

    opacity:
      currentTool === "highlighter"
        ? 0.28
        : 1,

    points: [
      point
    ]
  };

  drawCurrentStroke();

}


function handlePointerMove(event) {

  if (!isDrawing) {
    return;
  }

  event.preventDefault();

  const point =
    getCanvasPosition(event);

  currentStroke.points.push(
    point
  );

  drawCurrentStroke();

}


function handlePointerUp(event) {

  if (!isDrawing) {
    return;
  }

  isDrawing = false;

  try {
    canvas.releasePointerCapture(
      event.pointerId
    );
  } catch (_) {}


  if (
    currentStroke &&
    currentStroke.points.length > 1
  ) {

    const page =
      getCurrentPage();

    page.strokes.push(
      currentStroke
    );

    pushHistory();

    scheduleSave();
  }


  currentStroke = null;

}


function handlePointerLeave() {

  /*
   * Absichtlich leer.
   * Pointer Capture übernimmt das Zeichnen,
   * wenn der Finger/Mauszeiger das Canvas verlässt.
   */

}


/* =========================================================
   DRAW CURRENT STROKE
========================================================= */

function drawCurrentStroke() {

  if (!currentStroke) {
    return;
  }

  const ctx =
    canvas.getContext("2d");

  ctx.save();

  ctx.setTransform(
    DEVICE_PIXEL_RATIO,
    0,
    0,
    DEVICE_PIXEL_RATIO,
    0,
    0
  );

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.globalAlpha =
    currentStroke.opacity;

  if (
    currentStroke.tool === "eraser"
  ) {

    ctx.globalCompositeOperation =
      "destination-out";

    ctx.strokeStyle =
      "rgba(0,0,0,1)";

    ctx.lineWidth =
      currentStroke.size * 4;

  } else {

    ctx.globalCompositeOperation =
      "source-over";

    ctx.strokeStyle =
      currentStroke.color;

    ctx.lineWidth =
      currentStroke.size *
      (
        currentStroke.tool === "highlighter"
          ? 4
          : 1
      );

  }


  const points =
    currentStroke.points;

  if (points.length === 1) {

    const p =
      points[0];

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      ctx.lineWidth / 2,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      currentStroke.color;

    ctx.fill();

  } else {

    const a =
      points[points.length - 2];

    const b =
      points[points.length - 1];

    ctx.beginPath();

    ctx.moveTo(
      a.x,
      a.y
    );

    ctx.lineTo(
      b.x,
      b.y
    );

    ctx.stroke();

  }

  ctx.restore();
}


/* =========================================================
   REDRAW ALL STROKES
========================================================= */

function redrawCanvas() {

  if (
    !canvas ||
    !activeNotebook
  ) {
    return;
  }

  const ctx =
    canvas.getContext("2d");

  ctx.save();

  ctx.setTransform(
    DEVICE_PIXEL_RATIO,
    0,
    0,
    DEVICE_PIXEL_RATIO,
    0,
    0
  );

  ctx.clearRect(
    0,
    0,
    PAPER_WIDTH,
    PAPER_HEIGHT
  );

  ctx.restore();


  const page =
    getCurrentPage();

  if (!page) {
    return;
  }


  page.strokes.forEach(
    stroke => drawStroke(stroke)
  );

}


/* =========================================================
   DRAW STORED STROKE
========================================================= */

function drawStroke(stroke) {

  if (
    !stroke ||
    !stroke.points ||
    stroke.points.length === 0
  ) {
    return;
  }

  const ctx =
    canvas.getContext("2d");

  ctx.save();

  ctx.setTransform(
    DEVICE_PIXEL_RATIO,
    0,
    0,
    DEVICE_PIXEL_RATIO,
    0,
    0
  );

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.globalAlpha =
    stroke.opacity ?? 1;


  if (stroke.tool === "eraser") {

    ctx.globalCompositeOperation =
      "destination-out";

    ctx.strokeStyle =
      "rgba(0,0,0,1)";

    ctx.lineWidth =
      stroke.size * 4;

  } else {

    ctx.globalCompositeOperation =
      "source-over";

    ctx.strokeStyle =
      stroke.color;

    ctx.lineWidth =
      stroke.size *
      (
        stroke.tool === "highlighter"
          ? 4
          : 1
      );
  }


  const points =
    stroke.points;


  if (points.length === 1) {

    const p =
      points[0];

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      ctx.lineWidth / 2,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      stroke.color;

    ctx.fill();

  } else {

    ctx.beginPath();

    ctx.moveTo(
      points[0].x,
      points[0].y
    );

    for (
      let i = 1;
      i < points.length;
      i++
    ) {

      ctx.lineTo(
        points[i].x,
        points[i].y
      );

    }

    ctx.stroke();

  }


  ctx.restore();

}


/* =========================================================
   TOOL SELECTION
========================================================= */

function setTool(tool) {

  if (
    ![
      "pen",
      "highlighter",
      "eraser",
      "text",
      "lasso",
      "image",
      "shapes"
    ].includes(tool)
  ) {
    return;
  }

  finishTextEditing();

  currentTool = tool;


  document
    .querySelectorAll(
      "[data-tool]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.tool === tool
      );

      button.classList.toggle(
        "selected",
        button.dataset.tool === tool
      );

    });


  canvas.classList.remove(
    "tool-eraser",
    "tool-text",
    "tool-lasso",
    "tool-shapes"
  );


  if (
    tool === "eraser"
  ) {
    canvas.classList.add(
      "tool-eraser"
    );
  }

  if (
    tool === "text"
  ) {
    canvas.classList.add(
      "tool-text"
    );
  }

  if (
    tool === "lasso"
  ) {
    canvas.classList.add(
      "tool-lasso"
    );
  }

  if (
    tool === "shapes"
  ) {
    canvas.classList.add(
      "tool-shapes"
    );
  }


  if (
    tool === "image"
  ) {

    showToast(
      "Bildwerkzeug ist vorbereitet"
    );

  }


  if (
    tool === "lasso"
  ) {

    showToast(
      "Lasso: Auswahlfunktion folgt"
    );

  }


  if (
    tool === "shapes"
  ) {

    showToast(
      "Formen: Ziehe auf der Seite"
    );

  }

}


/* =========================================================
   COLORS
========================================================= */

function setColor(color) {

  currentColor = color;

  document
    .querySelectorAll(".color")
    .forEach(button => {

      button.classList.toggle(
        "selected-color",
        button.dataset.color === color
      );

    });

}


/* =========================================================
   SIZE
========================================================= */

function changeSize(direction) {

  const sizes = [
    1,
    2,
    3,
    4,
    6,
    8,
    12
  ];

  let index =
    sizes.indexOf(currentSize);

  if (index === -1) {
    index = 2;
  }

  index += direction;

  index =
    Math.max(
      0,
      Math.min(
        sizes.length - 1,
        index
      )
    );

  currentSize =
    sizes[index];

  updateSizeDisplay();

}


function updateSizeDisplay() {

  sizeDisplay.style.setProperty(
    "--size",
    `${Math.min(currentSize * 2, 14)}px`
  );

  sizeDisplay.title =
    `Stiftgröße: ${currentSize}px`;

}


function showSizeMenu() {

  const sizes = [
    1,
    2,
    3,
    4,
    6,
    8,
    12
  ];

  const value =
    prompt(
      "Stiftgröße in Pixel:",
      String(currentSize)
    );

  if (value === null) {
    return;
  }

  const number =
    Number(value);

  if (
    Number.isFinite(number) &&
    number >= 1 &&
    number <= 30
  ) {

    currentSize =
      number;

    updateSizeDisplay();

  }

}


/* =========================================================
   HISTORY
========================================================= */

function createSnapshot() {

  const page =
    getCurrentPage();

  if (!page) {
    return null;
  }

  return JSON.stringify({
    strokes: page.strokes,
    texts: page.texts
  });

}


function restoreSnapshot(snapshot) {

  const page =
    getCurrentPage();

  if (!page || !snapshot) {
    return;
  }

  const data =
    JSON.parse(snapshot);

  page.strokes =
    data.strokes || [];

  page.texts =
    data.texts || [];

  renderTextLayer();

  redrawCanvas();

  scheduleSave();

}


function pushHistory() {

  const snapshot =
    createSnapshot();

  if (!snapshot) {
    return;
  }

  undoStack.push(snapshot);

  if (undoStack.length > 50) {
    undoStack.shift();
  }

  redoStack = [];

  updateHistoryButtons();

}


function undo() {

  if (
    undoStack.length === 0
  ) {

    showToast(
      "Nichts rückgängig zu machen"
    );

    return;
  }


  const current =
    createSnapshot();

  redoStack.push(current);


  const previous =
    undoStack.pop();


  restoreSnapshot(
    previous
  );

  updateHistoryButtons();

}


function redo() {

  if (
    redoStack.length === 0
  ) {

    showToast(
      "Nichts zu wiederholen"
    );

    return;
  }


  const current =
    createSnapshot();

  undoStack.push(current);


  const next =
    redoStack.pop();


  restoreSnapshot(
    next
  );

  updateHistoryButtons();

}


function updateHistoryButtons() {

  undoButton.disabled =
    undoStack.length === 0;

  redoButton.disabled =
    redoStack.length === 0;

}


/* =========================================================
   TEXT TOOL
========================================================= */

function createTextAtPointer(event) {

  if (textEditing) {
    finishTextEditing();
  }


  const position =
    getCanvasPosition(event);

  const rect =
    paper.getBoundingClientRect();


  textInput.style.display =
    "block";


  textInput.value =
    "";


  const scaleX =
    rect.width / PAPER_WIDTH;

  const scaleY =
    rect.height / PAPER_HEIGHT;


  textInput.style.left =
    `${position.x * scaleX}px`;

  textInput.style.top =
    `${position.y * scaleY}px`;


  textEditing = true;

  textInput.dataset.x =
    position.x;

  textInput.dataset.y =
    position.y;


  textInput.focus();


  textInput.onblur =
    finishTextEditing;

}


function finishTextEditing() {

  if (!textEditing) {
    return;
  }

  const value =
    textInput.value.trim();


  if (value) {

    const page =
      getCurrentPage();

    if (page) {

      page.texts.push({

        id:
          "text_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2),

        x:
          Number(
            textInput.dataset.x
          ),

        y:
          Number(
            textInput.dataset.y
          ),

        text:
          value,

        size:
          22,

        color:
          currentColor

      });


      pushHistory();

      renderTextLayer();

      scheduleSave();

    }
  }


  textInput.value = "";

  textInput.style.display =
    "none";

  textEditing = false;

}


function renderTextLayer() {

  textLayer.innerHTML = "";

  const page =
    getCurrentPage();

  if (!page) {
    return;
  }


  page.texts.forEach(
    note => {

      const element =
        document.createElement("div");

      element.className =
        "text-note";

      element.textContent =
        note.text;

      element.style.left =
        `${note.x}px`;

      element.style.top =
        `${note.y}px`;

      element.style.fontSize =
        `${note.size || 22}px`;

      element.style.color =
        note.color || "#111";


      element.addEventListener(
        "dblclick",
        () => {

          const replacement =
            prompt(
              "Text bearbeiten:",
              note.text
            );

          if (
            replacement === null
          ) {
            return;
          }

          const old =
            note.text;

          note.text =
            replacement;

          pushHistory();

          renderTextLayer();

          scheduleSave();

        }
      );


      textLayer.appendChild(
        element
      );

    }
  );

}


/* =========================================================
   SHAPES
========================================================= */

let shapeStart = null;

function startShape(event) {

  const start =
    getCanvasPosition(event);

  shapeStart = start;

  canvas.setPointerCapture(
    event.pointerId
  );

  const move =
    event => {

      if (!shapeStart) {
        return;
      }

      redrawCanvas();

      const end =
        getCanvasPosition(event);

      drawPreviewRectangle(
        shapeStart,
        end
      );

    };


  const up =
    event => {

      if (!shapeStart) {
        return;
      }

      const end =
        getCanvasPosition(event);

      finishShape(
        shapeStart,
        end
      );

      shapeStart = null;

      canvas.removeEventListener(
        "pointermove",
        move
      );

      canvas.removeEventListener(
        "pointerup",
        up
      );

    };


  canvas.addEventListener(
    "pointermove",
    move
  );

  canvas.addEventListener(
    "pointerup",
    up
  );

}


function drawPreviewRectangle(
  start,
  end
) {

  const ctx =
    canvas.getContext("2d");

  ctx.save();

  ctx.setTransform(
    DEVICE_PIXEL_RATIO,
    0,
    0,
    DEVICE_PIXEL_RATIO,
    0,
    0
  );

  ctx.strokeStyle =
    currentColor;

  ctx.lineWidth =
    currentSize;

  ctx.globalAlpha =
    0.7;

  ctx.setLineDash([
    5,
    5
  ]);

  ctx.strokeRect(
    start.x,
    start.y,
    end.x - start.x,
    end.y - start.y
  );

  ctx.restore();

}


function finishShape(
  start,
  end
) {

  const page =
    getCurrentPage();

  if (!page) {
    return;
  }

  const stroke = {

    tool: "shape",

    shape: "rectangle",

    color: currentColor,

    size: currentSize,

    opacity: 1,

    points: [
      start,
      end
    ]

  };


  page.strokes.push(
    stroke
  );

  pushHistory();

  redrawCanvas();

  scheduleSave();

}


/* =========================================================
   DRAW SHAPE STROKES
========================================================= */

/*
 * Override drawStroke slightly for rectangles.
 */

const originalDrawStroke =
  drawStroke;

drawStroke = function(stroke) {

  if (
    stroke &&
    stroke.tool === "shape" &&
    stroke.shape === "rectangle"
  ) {

    if (
      !stroke.points ||
      stroke.points.length < 2
    ) {
      return;
    }

    const start =
      stroke.points[0];

    const end =
      stroke.points[1];

    const ctx =
      canvas.getContext("2d");

    ctx.save();

    ctx.setTransform(
      DEVICE_PIXEL_RATIO,
      0,
      0,
      DEVICE_PIXEL_RATIO,
      0,
      0
    );

    ctx.strokeStyle =
      stroke.color;

    ctx.lineWidth =
      stroke.size;

    ctx.globalAlpha =
      stroke.opacity ?? 1;

    ctx.strokeRect(
      start.x,
      start.y,
      end.x - start.x,
      end.y - start.y
    );

    ctx.restore();

    return;
  }

  originalDrawStroke(stroke);
};


/* =========================================================
   RENAME
========================================================= */

function renameNotebook() {

  if (!activeNotebook) {
    return;
  }

  const name =
    prompt(
      "Name des Notizbuchs:",
      activeNotebook.name
    );


  if (
    name === null
  ) {
    return;
  }


  const cleanName =
    name.trim();


  if (!cleanName) {
    return;
  }


  activeNotebook.name =
    cleanName;

  bookTitle.textContent =
    cleanName;

  scheduleSave();

  showToast(
    "Notizbuch umbenannt"
  );

}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {

  searchOverlay.classList.remove(
    "hidden"
  );

  searchInput.value = "";

  searchResults.innerHTML = "";

  setTimeout(
    () => searchInput.focus(),
    50
  );

}


function closeSearchDialog() {

  searchOverlay.classList.add(
    "hidden"
  );

}


function performSearch() {

  const query =
    searchInput.value
      .trim()
      .toLowerCase();


  searchResults.innerHTML = "";


  if (!query) {
    return;
  }


  let found = 0;


  activeNotebook.pages.forEach(
    (page, pageIndex) => {

      page.texts.forEach(
        text => {

          if (
            text.text
              .toLowerCase()
              .includes(query)
          ) {

            found++;


            const result =
              document.createElement(
                "div"
              );

            result.className =
              "search-result";


            const title =
              document.createElement(
                "div"
              );

            title.className =
              "search-result-title";

            title.textContent =
              text.text;


            const meta =
              document.createElement(
                "div"
              );

            meta.className =
              "search-result-page";

            meta.textContent =
              `Seite ${pageIndex + 1}`;


            result.appendChild(
              title
            );

            result.appendChild(
              meta
            );


            result.addEventListener(
              "click",
              () => {

                selectPage(
                  pageIndex
                );

                closeSearchDialog();

              }
            );


            searchResults.appendChild(
              result
            );

          }

        }
      );

    }
  );


  if (found === 0) {

    const empty =
      document.createElement(
        "div"
      );

    empty.style.padding =
      "20px 0";

    empty.style.color =
      "#78838d";

    empty.textContent =
      "Keine Treffer.";

    searchResults.appendChild(
      empty
    );

  }

}


/* =========================================================
   STATUS
========================================================= */

function setSaveStatus(text) {

  saveStatus.textContent =
    text;

}


function showToast(message) {

  clearTimeout(toastTimer);

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      1800
    );

}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function handleKeyboard(event) {

  const modifier =
    event.ctrlKey ||
    event.metaKey;


  /* Undo */

  if (
    modifier &&
    event.key.toLowerCase() === "z" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    undo();

    return;
  }


  /* Redo */

  if (
    modifier &&
    (
      event.key.toLowerCase() === "y" ||
      (
        event.key.toLowerCase() === "z" &&
        event.shiftKey
      )
    )
  ) {

    event.preventDefault();

    redo();

    return;
  }


  /* Save */

  if (
    modifier &&
    event.key.toLowerCase() === "s"
  ) {

    event.preventDefault();

    saveCurrentNotebook();

    showToast(
      "Gespeichert"
    );

    return;
  }


  /* Escape */

  if (
    event.key === "Escape"
  ) {

    if (
      !searchOverlay.classList.contains(
        "hidden"
      )
    ) {

      closeSearchDialog();

      return;
    }

    if (textEditing) {
      finishTextEditing();
    }

  }

}


/* =========================================================
   CURRENT PAGE
========================================================= */

function getCurrentPage() {

  if (
    !activeNotebook ||
    !activeNotebook.pages
  ) {
    return null;
  }

  return activeNotebook.pages[
    activePageIndex
  ] || null;

}


/* =========================================================
   INITIAL UI
========================================================= */

updateSizeDisplay();
