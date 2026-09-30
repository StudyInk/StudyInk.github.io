/* StudyInk Enhanced Editor System */
(() => {
  "use strict";

  const ENHANCED_KEY = "studyink_preferences_v1";
  let prefs = { zoom: 100, theme: "light" };
  let zoomValue = 100;

  const $ = (id) => document.getElementById(id);
  const savePrefs = () => {
    try { localStorage.setItem(ENHANCED_KEY, JSON.stringify(prefs)); } catch (_) {}
  };
  const loadPrefs = () => {
    try {
      const raw = localStorage.getItem(ENHANCED_KEY);
      if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
    } catch (_) {}
    zoomValue = Number(prefs.zoom) || 100;
  };

  function toast(message) {
    if (typeof showToast === "function") showToast(message);
  }

  function addSystemUI() {
    const workspace = document.querySelector(".workspace");
    if (!workspace || document.getElementById("systemPanel")) return;

    const panel = document.createElement("div");
    panel.id = "systemPanel";
    panel.className = "system-panel hidden";
    panel.innerHTML = `
      <div class="system-panel-title">StudyInk</div>
      <button data-system="duplicate">⧉ <span>Seite duplizieren</span></button>
      <button data-system="delete">⌫ <span>Seite löschen</span></button>
      <button data-system="export">⇩ <span>Notizbuch sichern</span></button>
      <button data-system="import">⇧ <span>Backup wiederherstellen</span></button>
      <button data-system="theme">◐ <span>Arbeitsbereich wechseln</span></button>
      <div class="system-divider"></div>
      <div class="zoom-row">
        <button data-system="zoom-out">−</button>
        <strong id="systemZoom">100%</strong>
        <button data-system="zoom-reset">100%</button>
        <button data-system="zoom-in">+</button>
      </div>
    `;
    workspace.appendChild(panel);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.id = "systemImportInput";
    input.hidden = true;
    workspace.appendChild(input);

    panel.addEventListener("click", handlePanelClick);
    input.addEventListener("change", importBackup);

    const more = [...document.querySelectorAll(".top-button")].find(
      b => b.title === "Mehr"
    );
    if (more) {
      more.dataset.systemMenu = "1";
      more.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("hidden");
      });
    }

    document.addEventListener("pointerdown", (e) => {
      if (!panel.contains(e.target) && e.target !== more) panel.classList.add("hidden");
    });
  }

  function handlePanelClick(e) {
    const button = e.target.closest("[data-system]");
    if (!button) return;
    const action = button.dataset.system;
    if (action === "duplicate") duplicatePage();
    if (action === "delete") deletePage();
    if (action === "export") exportBackup();
    if (action === "import") $("systemImportInput").click();
    if (action === "theme") toggleTheme();
    if (action === "zoom-out") setZoom(zoomValue - 10);
    if (action === "zoom-in") setZoom(zoomValue + 10);
    if (action === "zoom-reset") setZoom(100);
    $("systemPanel").classList.add("hidden");
  }

  function duplicatePage() {
    if (!window.activeNotebook || typeof getCurrentPage !== "function") return;
    const source = getCurrentPage();
    if (!source) return;

    const copy = JSON.parse(JSON.stringify(source));
    copy.id = "page_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    copy.number = activeNotebook.pages.length + 1;
    copy.createdAt = new Date().toISOString();
    activeNotebook.pages.splice(activePageIndex + 1, 0, copy);
    activePageIndex += 1;
    activeNotebook.pages.forEach((p, i) => p.number = i + 1);

    if (typeof undoStack !== "undefined") undoStack = [];
    if (typeof redoStack !== "undefined") redoStack = [];
    if (typeof renderAll === "function") renderAll();
    if (typeof scheduleSave === "function") scheduleSave();
    toast("Seite dupliziert");
  }

  function deletePage() {
    if (!window.activeNotebook || activeNotebook.pages.length <= 1) {
      toast("Das letzte Blatt kann nicht gelöscht werden");
      return;
    }
    if (!confirm("Diese Seite wirklich löschen?")) return;

    activeNotebook.pages.splice(activePageIndex, 1);
    activePageIndex = Math.max(0, Math.min(activePageIndex, activeNotebook.pages.length - 1));
    activeNotebook.pages.forEach((p, i) => p.number = i + 1);

    if (typeof undoStack !== "undefined") undoStack = [];
    if (typeof redoStack !== "undefined") redoStack = [];
    if (typeof renderAll === "function") renderAll();
    if (typeof scheduleSave === "function") scheduleSave();
    toast("Seite gelöscht");
  }

  function exportBackup() {
    if (!window.activeNotebook) return;
    const payload = {
      format: "StudyInk Backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      notebook: activeNotebook
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (activeNotebook.name || "studyink-notebook").replace(/[^a-z0-9-_]+/gi, "-");
    a.href = url;
    a.download = safe + ".studyink.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup erstellt");
  }

  function importBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const book = payload.notebook || payload;
        if (!book || !Array.isArray(book.pages)) throw new Error("Ungültiges Backup");
        book.id = "book_" + Date.now() + "_" + Math.random().toString(36).slice(2);
        book.name = (book.name || "Wiederhergestelltes Notizbuch") + " (Import)";
        book.updatedAt = new Date().toISOString();
        book.pages.forEach((p, i) => {
          p.id = "page_" + Date.now() + "_" + i + "_" + Math.random().toString(36).slice(2);
          p.number = i + 1;
          p.strokes = Array.isArray(p.strokes) ? p.strokes : [];
          p.texts = Array.isArray(p.texts) ? p.texts : [];
        });
        notebooks.unshift(book);
        activeNotebook = book;
        activePageIndex = 0;
        if (typeof saveNotebooks === "function") saveNotebooks();
        if (typeof showNotebook === "function") showNotebook();
        if (typeof renderAll === "function") renderAll();
        toast("Backup wiederhergestellt");
      } catch (error) {
        console.error(error);
        toast("Backup konnte nicht gelesen werden");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function setZoom(value) {
    zoomValue = Math.max(50, Math.min(150, value));
    prefs.zoom = zoomValue;
    savePrefs();
    const paper = $("paper");
    if (paper) paper.style.transform = "scale(" + (zoomValue / 100) + ")";
    const display = $("systemZoom");
    if (display) display.textContent = zoomValue + "%";
  }

  function toggleTheme() {
    prefs.theme = prefs.theme === "light" ? "soft-dark" : "light";
    savePrefs();
    document.documentElement.dataset.studyinkTheme = prefs.theme;
    toast(prefs.theme === "light" ? "Helle Arbeitsfläche" : "Dunkle Arbeitsfläche");
  }

  function keyboardEnhancements(e) {
    const modifier = e.ctrlKey || e.metaKey;
    const target = e.target;
    const typing = target && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
    if (typing) return;

    if (modifier && e.key === "d") {
      e.preventDefault();
      duplicatePage();
    }
    if (e.key === "+" || e.key === "=") setZoom(zoomValue + 10);
    if (e.key === "-") setZoom(zoomValue - 10);
    if (e.key === "0") setZoom(100);
  }

  function start() {
    loadPrefs();
    addSystemUI();
    setZoom(zoomValue);
    document.addEventListener("keydown", keyboardEnhancements);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(start, 0), { once: true });
  } else {
    setTimeout(start, 0);
  }
})();