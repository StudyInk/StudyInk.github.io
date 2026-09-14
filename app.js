/* =========================================================
   STUDYINK
   Notebook Engine
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "studyink_documents_v2";
const SETTINGS_KEY = "studyink_settings_v1";

let documents = loadDocuments();
let currentNotebookId = null;
let currentPageId = null;
let currentView = "documents";
let saveTimer = null;
let confirmCallback = null;


/* =========================================================
   DOM
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* Library */

const libraryView = $("#libraryView");
const documentLibrary = $("#documentLibrary");
const documentGrid = $("#documentGrid");
const documentCount = $("#documentCount");
const emptyState = $("#emptyState");
const librarySearch = $("#librarySearch");
const librarySearchInput = $("#librarySearchInput");


/* Menus */

const newButton = $("#newButton");
const newMenu = $("#newMenu");
const createMenu = $("#createMenu");
const closeCreateMenu = $("#closeCreateMenu");


/* Search */

const searchButton = $("#searchButton");
const searchPanel = $("#searchPanel");
const globalSearch = $("#globalSearch");
const searchResults = $("#searchResults");


/* Settings */

const settingsButton = $("#settingsButton");
const settingsPanel = $("#settingsPanel");


/* Notebook */

const notebookView = $("#notebookView");
const notebookBack = $("#notebookBack");
const notebookTitle = $("#notebookTitle");
const notebookTypeLabel = $("#notebookTypeLabel");
const favoriteNotebook = $("#favoriteNotebook");
const notebookMore = $("#notebookMore");

const pageList = $("#pageList");
const pageCount = $("#pageCount");
const addPageButton = $("#addPage");
const duplicatePageButton = $("#duplicatePage");
const deletePageButton = $("#deletePage");

const pageTitle = $("#pageTitle");
const pageContent = $("#pageContent");
const paperPageNumber = $("#paperPageNumber");
const paperWordCount = $("#paperWordCount");
const saveStatus = $("#saveStatus");

const backButton = $("#backButton");


/* Misc */

const tabletCard = $("#tabletCard");
const closeTabletCard = $("#closeTabletCard");
const installApp = $("#installApp");

const toast = $("#toast");


/* Confirm */

const confirmModal = $("#confirmModal");
const confirmTitle = $("#confirmTitle");
const confirmMessage = $("#confirmMessage");
const confirmCancel = $("#confirmCancel");
const confirmAccept = $("#confirmAccept");


/* =========================================================
   DEFAULT DATA
========================================================= */

function createId(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 9)
  );
}


function createPage(title = "Seite 1") {
  return {
    id: createId("page"),
    title,
    content: "",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}


function createNotebook(title = "Mein Notizbuch") {
  const firstPage = createPage("Seite 1");

  return {
    id: createId("notebook"),
    title,
    type: "notebook",
    favorite: false,
    trashed: false,
    shared: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: [firstPage]
  };
}


/* =========================================================
   STORAGE FUNCTIONS
========================================================= */

function loadDocuments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("StudyInk: Fehler beim Laden:", error);
    return [];
  }
}


function saveDocuments() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(documents)
    );
  } catch (error) {
    console.error("StudyInk: Fehler beim Speichern:", error);
    showToast("Speichern nicht möglich.");
  }
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(timestamp));
}


function getDocumentById(id) {
  return documents.find((document) => document.id === id);
}


function getCurrentNotebook() {
  return getDocumentById(currentNotebookId);
}


function getCurrentPage() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    return null;
  }

  return notebook.pages.find(
    (page) => page.id === currentPageId
  );
}


function getTypeName(type) {
  const types = {
    notebook: "Notizbuch",
    "quick-note": "Schnellnotiz",
    text: "Text Document",
    whiteboard: "Whiteboard",
    folder: "Ordner",
    image: "Bild"
  };

  return types[type] || "Dokument";
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}


/* =========================================================
   PANELS
========================================================= */

function closePanels() {
  newMenu?.classList.add("hidden");
  createMenu?.classList.add("hidden");
  searchPanel?.classList.add("hidden");
  settingsPanel?.classList.add("hidden");
}


function toggleNewMenu() {
  const isOpen = !newMenu.classList.contains("hidden");

  closePanels();

  if (!isOpen) {
    newMenu.classList.remove("hidden");
  }
}


function toggleCreateMenu() {
  const isOpen = !createMenu.classList.contains("hidden");

  closePanels();

  if (!isOpen) {
    createMenu.classList.remove("hidden");
  }
}


/* =========================================================
   VIEW SWITCHING
========================================================= */

function setActiveNavigation(view) {
  $$(".nav-item").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });
}


function showLibrary(view = "documents") {
  currentView = view;

  libraryView.classList.remove("hidden");
  notebookView.classList.add("hidden");

  setActiveNavigation(view);

  closePanels();

  renderLibrary();
}


function showNotebook(notebookId) {
  const notebook = getDocumentById(notebookId);

  if (!notebook) {
    showToast("Notizbuch wurde nicht gefunden.");
    return;
  }

  currentNotebookId = notebook.id;

  if (
    !notebook.pages ||
    !Array.isArray(notebook.pages) ||
    notebook.pages.length === 0
  ) {
    notebook.pages = [createPage("Seite 1")];
  }

  currentPageId = notebook.pages[0].id;

  libraryView.classList.add("hidden");
  notebookView.classList.remove("hidden");

  closePanels();

  renderNotebook();

  setTimeout(() => {
    pageContent?.focus();
  }, 100);
}


/* =========================================================
   CREATE DOCUMENTS
========================================================= */

function createDocument(type) {
  closePanels();

  if (type === "notebook") {
    createNewNotebook();
    return;
  }

  if (type === "quick-note") {
    createQuickNote();
    return;
  }

  createGenericDocument(type);
}


function createNewNotebook() {
  const notebook = createNotebook(
    "Mein neues Notizbuch"
  );

  documents.unshift(notebook);

  saveDocuments();

  showNotebook(notebook.id);

  notebookTitle.focus();
  notebookTitle.select();

  showToast("Notizbuch erstellt.");
}


function createQuickNote() {
  const notebook = createNotebook("Schnellnotiz");

  notebook.type = "quick-note";
  notebook.pages[0].title = "Schnellnotiz";

  documents.unshift(notebook);

  saveDocuments();

  showNotebook(notebook.id);

  pageContent.focus();

  showToast("Schnellnotiz erstellt.");
}


function createGenericDocument(type) {
  const title = getTypeName(type);

  const document = createNotebook(
    "Mein " + title
  );

  document.type = type;

  documents.unshift(document);

  saveDocuments();

  showNotebook(document.id);

  showToast(`${title} erstellt.`);
}


/* =========================================================
   LIBRARY RENDERING
========================================================= */

function renderLibrary() {
  if (!documentGrid) {
    return;
  }

  let visibleDocuments = [...documents];

  if (currentView === "favorites") {
    visibleDocuments = visibleDocuments.filter(
      (document) =>
        document.favorite &&
        !document.trashed
    );
  }

  if (currentView === "trash") {
    visibleDocuments = visibleDocuments.filter(
      (document) => document.trashed
    );
  }

  if (currentView === "shared") {
    visibleDocuments = visibleDocuments.filter(
      (document) =>
        document.shared &&
        !document.trashed
    );
  }

  if (
    currentView === "documents"
  ) {
    visibleDocuments = visibleDocuments.filter(
      (document) => !document.trashed
    );
  }

  const searchTerm =
    librarySearchInput?.value
      .trim()
      .toLowerCase() || "";

  if (searchTerm) {
    visibleDocuments = visibleDocuments.filter(
      (document) =>
        document.title
          .toLowerCase()
          .includes(searchTerm) ||
        document.type
          .toLowerCase()
          .includes(searchTerm) ||
        document.pages?.some((page) =>
          `${page.title} ${page.content}`
            .toLowerCase()
            .includes(searchTerm)
        )
    );
  }

  visibleDocuments.sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  if (documentCount) {
    const amount = visibleDocuments.length;

    documentCount.textContent =
      amount === 1
        ? "1 Dokument"
        : `${amount} Dokumente`;
  }

  if (visibleDocuments.length === 0) {
    documentLibrary?.classList.add("hidden");

    if (emptyState) {
      emptyState.classList.remove("hidden");

      const title =
        emptyState.querySelector(".empty-title");

      const subtitle =
        emptyState.querySelector(".empty-subtitle");

      if (currentView === "favorites") {
        if (title) {
          title.textContent = "Keine Favoriten";
        }

        if (subtitle) {
          subtitle.textContent =
            "Markiere ein Notizbuch mit einem Stern.";
        }
      } else if (currentView === "trash") {
        if (title) {
          title.textContent = "Papierkorb ist leer";
        }

        if (subtitle) {
          subtitle.textContent =
            "Gelöschte Dokumente erscheinen hier.";
        }
      } else if (currentView === "shared") {
        if (title) {
          title.textContent = "Noch nichts geteilt";
        }

        if (subtitle) {
          subtitle.textContent =
            "Geteilte Dokumente erscheinen hier.";
        }
      } else {
        if (title) {
          title.textContent = "Bereit zum Lernen?";
        }

        if (subtitle) {
          subtitle.textContent =
            "Erstelle dein erstes Notizbuch.";
        }
      }
    }

    return;
  }

  emptyState?.classList.add("hidden");
  documentLibrary?.classList.remove("hidden");

  documentGrid.innerHTML = visibleDocuments
    .map(renderDocumentCard)
    .join("");
}


function renderDocumentCard(document) {
  const pages = document.pages || [];

  const preview =
    pages
      .map((page) => page.content || "")
      .join(" ")
      .trim() ||
    "Noch keine Notizen.";

  const typeName = getTypeName(document.type);

  return `
    <article
      class="studyink-document"
      data-document-id="${escapeHTML(document.id)}"
    >

      <button
        class="studyink-document-favorite ${
          document.favorite ? "active" : ""
        }"
        type="button"
        data-document-action="favorite"
        data-document-id="${escapeHTML(document.id)}"
        aria-label="Favorit"
      >
        ${document.favorite ? "★" : "☆"}
      </button>

      <span class="studyink-document-type">
        ${escapeHTML(typeName)}
      </span>

      <h3 class="studyink-document-title">
        ${escapeHTML(document.title)}
      </h3>

      <p class="studyink-document-preview">
        ${escapeHTML(preview)}
      </p>

      <span class="studyink-document-date">
        ${pages.length}
        ${pages.length === 1 ? "Seite" : "Seiten"}
        ·
        ${formatDate(document.updatedAt)}
      </span>

      <div class="studyink-document-actions">

        <button
          type="button"
          data-document-action="open"
          data-document-id="${escapeHTML(document.id)}"
        >
          Öffnen
        </button>

        ${
          document.trashed
            ? `
              <button
                type="button"
                data-document-action="restore"
                data-document-id="${escapeHTML(document.id)}"
              >
                Wiederherstellen
              </button>
            `
            : `
              <button
                type="button"
                data-document-action="trash"
                data-document-id="${escapeHTML(document.id)}"
              >
                Löschen
              </button>
            `
        }

      </div>

    </article>
  `;
}


/* =========================================================
   DOCUMENT ACTIONS
========================================================= */

function toggleFavorite(id) {
  const document = getDocumentById(id);

  if (!document) {
    return;
  }

  document.favorite = !document.favorite;
  document.updatedAt = Date.now();

  saveDocuments();
  renderLibrary();

  showToast(
    document.favorite
      ? "Zu Favoriten hinzugefügt."
      : "Aus Favoriten entfernt."
  );
}


function moveToTrash(id) {
  const document = getDocumentById(id);

  if (!document) {
    return;
  }

  document.trashed = true;
  document.updatedAt = Date.now();

  saveDocuments();
  renderLibrary();

  showToast("Dokument in den Papierkorb verschoben.");
}


function restoreDocument(id) {
  const document = getDocumentById(id);

  if (!document) {
    return;
  }

  document.trashed = false;
  document.updatedAt = Date.now();

  saveDocuments();
  renderLibrary();

  showToast("Dokument wiederhergestellt.");
}


function permanentlyDelete(id) {
  documents = documents.filter(
    (document) => document.id !== id
  );

  saveDocuments();
  renderLibrary();

  showToast("Dokument endgültig gelöscht.");
}


/* =========================================================
   NOTEBOOK RENDERING
========================================================= */

function renderNotebook() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    showLibrary();
    return;
  }

  notebookTitle.value = notebook.title;
  notebookTypeLabel.textContent =
    getTypeName(notebook.type).toUpperCase();

  favoriteNotebook.textContent =
    notebook.favorite ? "★" : "☆";

  favoriteNotebook.classList.toggle(
    "active",
    notebook.favorite
  );

  renderPageList();
  renderCurrentPage();
}


function renderPageList() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    return;
  }

  const pages = notebook.pages || [];

  pageCount.textContent =
    pages.length === 1
      ? "1 Seite"
      : `${pages.length} Seiten`;

  pageList.innerHTML = pages
    .map((page, index) => {
      const active =
        page.id === currentPageId;

      const preview =
        page.content
          ?.replace(/\s+/g, " ")
          .trim()
          .slice(0, 65) ||
        "Leere Seite";

      return `
        <button
          class="page-list-item ${
            active ? "active" : ""
          }"
          type="button"
          data-page-id="${escapeHTML(page.id)}"
        >

          <span class="page-thumbnail">

            <span class="page-number">
              ${index + 1}
            </span>

            <span class="page-thumbnail-lines">
              ${escapeHTML(preview)}
            </span>

          </span>

          <span class="page-list-info">

            <strong>
              ${escapeHTML(
                page.title || `Seite ${index + 1}`
              )}
            </strong>

            <small>
              ${page.content?.trim()
                ? "Notizen vorhanden"
                : "Leer"}
            </small>

          </span>

        </button>
      `;
    })
    .join("");
}


function renderCurrentPage() {
  const page = getCurrentPage();
  const notebook = getCurrentNotebook();

  if (!page || !notebook) {
    return;
  }

  const index = notebook.pages.findIndex(
    (item) => item.id === page.id
  );

  pageTitle.value =
    page.title || `Seite ${index + 1}`;

  pageContent.value =
    page.content || "";

  paperPageNumber.textContent =
    `Seite ${index + 1}`;

  updateWordCount();
}


/* =========================================================
   NOTEBOOK EDITING
========================================================= */

function updateCurrentPage() {
  const notebook = getCurrentNotebook();
  const page = getCurrentPage();

  if (!notebook || !page) {
    return;
  }

  page.title =
    pageTitle.value.trim() ||
    `Seite ${
      notebook.pages.findIndex(
        (item) => item.id === page.id
      ) + 1
    }`;

  page.content = pageContent.value;

  page.updatedAt = Date.now();
  notebook.updatedAt = Date.now();

  saveStatus.textContent = "Speichern...";

  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveDocuments();

    saveStatus.textContent = "Gespeichert";

    renderPageList();
  }, 350);

  updateWordCount();
}


function updateWordCount() {
  if (!paperWordCount) {
    return;
  }

  const text =
    pageContent?.value.trim() || "";

  if (!text) {
    paperWordCount.textContent = "0 Wörter";
    return;
  }

  const words = text
    .split(/\s+/)
    .filter(Boolean);

  paperWordCount.textContent =
    words.length === 1
      ? "1 Wort"
      : `${words.length} Wörter`;
}


/* =========================================================
   ADD PAGE
========================================================= */

function addPage() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    return;
  }

  const pageNumber =
    notebook.pages.length + 1;

  const page = createPage(
    `Seite ${pageNumber}`
  );

  notebook.pages.push(page);

  notebook.updatedAt = Date.now();

  currentPageId = page.id;

  saveDocuments();

  renderNotebook();

  setTimeout(() => {
    pageTitle.focus();
  }, 50);

  showToast("Neue Seite erstellt.");
}


/* =========================================================
   DUPLICATE PAGE
========================================================= */

function duplicateCurrentPage() {
  const notebook = getCurrentNotebook();
  const page = getCurrentPage();

  if (!notebook || !page) {
    return;
  }

  const newPage = {
    ...page,
    id: createId("page"),
    title: `${page.title} Kopie`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const index =
    notebook.pages.findIndex(
      (item) => item.id === page.id
    );

  notebook.pages.splice(
    index + 1,
    0,
    newPage
  );

  notebook.updatedAt = Date.now();

  currentPageId = newPage.id;

  saveDocuments();
  renderNotebook();

  showToast("Seite dupliziert.");
}


/* =========================================================
   DELETE PAGE
========================================================= */

function requestDeletePage() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    return;
  }

  if (notebook.pages.length <= 1) {
    showToast(
      "Ein Notizbuch muss mindestens eine Seite haben."
    );

    return;
  }

  openConfirm(
    "Seite löschen?",
    "Die aktuelle Seite wird dauerhaft gelöscht.",
    deleteCurrentPage
  );
}


function deleteCurrentPage() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    return;
  }

  const index =
    notebook.pages.findIndex(
      (page) => page.id === currentPageId
    );

  if (index === -1) {
    return;
  }

  notebook.pages.splice(index, 1);

  const nextPage =
    notebook.pages[index] ||
    notebook.pages[index - 1] ||
    notebook.pages[0];

  currentPageId = nextPage.id;

  notebook.updatedAt = Date.now();

  saveDocuments();
  renderNotebook();

  showToast("Seite gelöscht.");
}


/* =========================================================
   NOTEBOOK TITLE
========================================================= */

function updateNotebookTitle() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    return;
  }

  const title =
    notebookTitle.value.trim();

  notebook.title =
    title || "Mein Notizbuch";

  notebook.updatedAt = Date.now();

  saveDocuments();

  saveStatus.textContent = "Gespeichert";
}


/* =========================================================
   FAVORITE NOTEBOOK
========================================================= */

function toggleCurrentFavorite() {
  const notebook = getCurrentNotebook();

  if (!notebook) {
    return;
  }

  notebook.favorite = !notebook.favorite;
  notebook.updatedAt = Date.now();

  favoriteNotebook.textContent =
    notebook.favorite ? "★" : "☆";

  favoriteNotebook.classList.toggle(
    "active",
    notebook.favorite
  );

  saveDocuments();

  showToast(
    notebook.favorite
      ? "Notizbuch favorisiert."
      : "Favorit entfernt."
  );
}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {
  const isOpen =
    !searchPanel.classList.contains("hidden");

  closePanels();

  if (isOpen) {
    return;
  }

  searchPanel.classList.remove("hidden");

  setTimeout(() => {
    globalSearch?.focus();
    renderSearchResults("");
  }, 50);
}


function renderSearchResults(query) {
  if (!searchResults) {
    return;
  }

  const searchTerm =
    query.trim().toLowerCase();

  let results = documents.filter(
    (document) => !document.trashed
  );

  if (searchTerm) {
    results = results.filter(
      (document) => {
        const documentText =
          [
            document.title,
            document.type,
            ...(document.pages || []).map(
              (page) =>
                `${page.title} ${page.content}`
            )
          ]
            .join(" ")
            .toLowerCase();

        return documentText.includes(searchTerm);
      }
    );
  }

  if (results.length === 0) {
    searchResults.innerHTML = `
      <div class="search-empty">
        Keine Ergebnisse gefunden.
      </div>
    `;

    return;
  }

  searchResults.innerHTML = results
    .slice(0, 10)
    .map(
      (document) => `
        <button
          class="search-result"
          type="button"
          data-search-document="${escapeHTML(
            document.id
          )}"
        >

          <span>
            ${escapeHTML(document.title)}
          </span>

          <small>
            ${escapeHTML(
              getTypeName(document.type)
            )}
          </small>

        </button>
      `
    )
    .join("");
}


/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {
  const isOpen =
    !settingsPanel.classList.contains("hidden");

  closePanels();

  if (!isOpen) {
    settingsPanel.classList.remove("hidden");
  }
}


function handleSetting(setting) {
  const messages = {
    appearance:
      "Aussehen: Diese Einstellung können wir als Nächstes ausbauen.",
    notifications:
      "Benachrichtigungen sind aktuell aktiviert.",
    sync:
      "Cloud-Sync ist für die nächste Version vorbereitet.",
    security:
      "Deine lokalen Notizen werden im Browser gespeichert."
  };

  showToast(
    messages[setting] ||
    "Einstellung ausgewählt."
  );
}


/* =========================================================
   CONFIRM MODAL
========================================================= */

function openConfirm(
  title,
  message,
  callback
) {
  confirmCallback = callback;

  confirmTitle.textContent = title;
  confirmMessage.textContent = message;

  confirmModal.classList.remove("hidden");
}


function closeConfirm() {
  confirmModal.classList.add("hidden");
  confirmCallback = null;
}


/* =========================================================
   TABLET PROMO
========================================================= */

function setupTabletCard() {
  const dismissed =
    localStorage.getItem(
      "studyink_tablet_card"
    );

  if (dismissed === "closed") {
    tabletCard?.classList.add("hidden");
  }
}


function closeTabletPromo() {
  tabletCard?.classList.add("hidden");

  localStorage.setItem(
    "studyink_tablet_card",
    "closed"
  );
}


function installStudyInk() {
  localStorage.setItem(
    "studyink_installed",
    "true"
  );

  if (installApp) {
    installApp.textContent =
      "Installiert ✓";

    installApp.disabled = true;
  }

  showToast(
    "StudyInk wurde als installiert markiert."
  );
}


/* =========================================================
   NAVIGATION
========================================================= */

function handleNavigation(view) {
  if (view === "marketplace") {
    setActiveNavigation("marketplace");

    showToast(
      "Marketplace kommt bald."
    );

    return;
  }

  showLibrary(view);
}


/* =========================================================
   EVENTS — NAVIGATION
========================================================= */

$$(".nav-item").forEach((button) => {
  button.addEventListener(
    "click",
    () => {
      handleNavigation(
        button.dataset.view
      );
    }
  );
});


/* =========================================================
   EVENTS — NEW
========================================================= */

newButton?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();
    toggleNewMenu();
  }
);


$$("[data-create]").forEach((button) => {
  button.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      const type =
        button.dataset.create;

      if (!type) {
        return;
      }

      createDocument(type);
    }
  );
});


closeCreateMenu?.addEventListener(
  "click",
  () => {
    createMenu.classList.add("hidden");
  }
);


/* =========================================================
   DOUBLE CLICK NEW = QUICK NOTE
========================================================= */

newButton?.addEventListener(
  "dblclick",
  () => {
    createQuickNote();
  }
);


/* =========================================================
   EVENTS — DOCUMENT GRID
========================================================= */

documentGrid?.addEventListener(
  "click",
  (event) => {
    const actionButton =
      event.target.closest(
        "[data-document-action]"
      );

    if (actionButton) {
      event.stopPropagation();

      const action =
        actionButton.dataset.documentAction;

      const id =
        actionButton.dataset.documentId;

      if (action === "open") {
        showNotebook(id);
      }

      if (action === "favorite") {
        toggleFavorite(id);
      }

      if (action === "trash") {
        moveToTrash(id);
      }

      if (action === "restore") {
        restoreDocument(id);
      }

      return;
    }

    const card =
      event.target.closest(
        ".studyink-document"
      );

    if (card) {
      showNotebook(
        card.dataset.documentId
      );
    }
  }
);


/* =========================================================
   EVENTS — SEARCH
========================================================= */

searchButton?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();
    openSearch();
  }
);


globalSearch?.addEventListener(
  "input",
  () => {
    renderSearchResults(
      globalSearch.value
    );
  }
);


librarySearchInput?.addEventListener(
  "input",
  () => {
    renderLibrary();
  }
);


searchResults?.addEventListener(
  "click",
  (event) => {
    const result =
      event.target.closest(
        "[data-search-document]"
      );

    if (!result) {
      return;
    }

    showNotebook(
      result.dataset.searchDocument
    );
  }
);


/* =========================================================
   EVENTS — SETTINGS
========================================================= */

settingsButton?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();
    openSettings();
  }
);


$$("[data-setting]").forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        handleSetting(
          button.dataset.setting
        );
      }
    );
  }
);


/* =========================================================
   EVENTS — NOTEBOOK
========================================================= */

notebookBack?.addEventListener(
  "click",
  () => {
    showLibrary();
  }
);


backButton?.addEventListener(
  "click",
  () => {
    if (
      !notebookView.classList.contains(
        "hidden"
      )
    ) {
      showLibrary();
      return;
    }

    closePanels();
  }
);


notebookTitle?.addEventListener(
  "input",
  updateNotebookTitle
);


pageTitle?.addEventListener(
  "input",
  updateCurrentPage
);


pageContent?.addEventListener(
  "input",
  updateCurrentPage
);


addPageButton?.addEventListener(
  "click",
  addPage
);


duplicatePageButton?.addEventListener(
  "click",
  duplicateCurrentPage
);


deletePageButton?.addEventListener(
  "click",
  requestDeletePage
);


favoriteNotebook?.addEventListener(
  "click",
  toggleCurrentFavorite
);


/* =========================================================
   EVENTS — PAGE LIST
========================================================= */

pageList?.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        "[data-page-id]"
      );

    if (!button) {
      return;
    }

    const notebook =
      getCurrentNotebook();

    if (!notebook) {
      return;
    }

    currentPageId =
      button.dataset.pageId;

    renderNotebook();

    pageContent?.focus();
  }
);


/* =========================================================
   NOTEBOOK TOOL BUTTONS
========================================================= */

$$(".floating-tool").forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        $$(".floating-tool").forEach(
          (tool) =>
            tool.classList.remove(
              "active"
            )
        );

        button.classList.add("active");

        const tool =
          button.dataset.tool;

        const messages = {
          select: "Auswahlwerkzeug",
          pen: "Stift ausgewählt",
          highlight: "Textmarker ausgewählt",
          eraser: "Radierer ausgewählt"
        };

        showToast(
          messages[tool] ||
          "Werkzeug ausgewählt."
        );
      }
    );
  }
);


/* =========================================================
   NOTEBOOK MORE
========================================================= */

notebookMore?.addEventListener(
  "click",
  () => {
    showToast(
      "Weitere Notebook-Funktionen kommen bald."
    );
  }
);


/* =========================================================
   TABLET
========================================================= */

closeTabletCard?.addEventListener(
  "click",
  closeTabletPromo
);


installApp?.addEventListener(
  "click",
  installStudyInk
);


/* =========================================================
   CONFIRM EVENTS
========================================================= */

confirmCancel?.addEventListener(
  "click",
  closeConfirm
);


confirmAccept?.addEventListener(
  "click",
  () => {
    if (typeof confirmCallback === "function") {
      confirmCallback();
    }

    closeConfirm();
  }
);


/* =========================================================
   CLOSE BUTTONS
========================================================= */

$$("[data-close]").forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        closePanels();
      }
    );
  }
);


/* =========================================================
   OUTSIDE CLICK
========================================================= */

document.addEventListener(
  "click",
  (event) => {

    const clickedNew =
      event.target.closest(
        "#newMenu"
      );

    const clickedCreate =
      event.target.closest(
        "#createMenu"
      );

    const clickedSearch =
      event.target.closest(
        "#searchPanel"
      );

    const clickedSettings =
      event.target.closest(
        "#settingsPanel"
      );

    const clickedNewButton =
      event.target.closest(
        "#newButton"
      );

    const clickedSearchButton =
      event.target.closest(
        "#searchButton"
      );

    const clickedSettingsButton =
      event.target.closest(
        "#settingsButton"
      );

    if (
      !clickedNew &&
      !clickedCreate &&
      !clickedSearch &&
      !clickedSettings &&
      !clickedNewButton &&
      !clickedSearchButton &&
      !clickedSettingsButton
    ) {
      closePanels();
    }
  }
);


/* =========================================================
   EDITOR / MODAL OUTSIDE CLICK
========================================================= */

confirmModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target === confirmModal
    ) {
      closeConfirm();
    }
  }
);


/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key !== "Escape") {
      return;
    }

    if (
      !confirmModal.classList.contains(
        "hidden"
      )
    ) {
      closeConfirm();
      return;
    }

    if (
      !notebookView.classList.contains(
        "hidden"
      )
    ) {
      showLibrary();
      return;
    }

    closePanels();
  }
);


/* =========================================================
   CTRL / CMD + S
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "s"
    ) {
      event.preventDefault();

      saveDocuments();

      if (
        !notebookView.classList.contains(
          "hidden"
        )
      ) {
        saveStatus.textContent =
          "Gespeichert";

        showToast(
          "Notizbuch gespeichert."
        );
      }
    }
  }
);


/* =========================================================
   AUTOSAVE BEFORE LEAVING
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {
    updateCurrentPage();
    saveDocuments();
  }
);


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeStudyInk() {

  setupTabletCard();

  const installed =
    localStorage.getItem(
      "studyink_installed"
    );

  if (
    installed === "true" &&
    installApp
  ) {
    installApp.textContent =
      "Installiert ✓";

    installApp.disabled = true;
  }

  showLibrary("documents");
}


initializeStudyInk();
