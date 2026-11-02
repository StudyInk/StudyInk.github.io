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
      <button data-system="pdf-import">▤ <span>PDF importieren</span></button>
      <button data-system="pdf-export">▧ <span>Als PDF exportieren</span></button>
      <button data-system="auto-restore">⟲ <span>Automatisches Backup wiederherstellen</span></button>
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
    const pdfInput = document.createElement("input");
    pdfInput.type = "file"; pdfInput.accept = "application/pdf,.pdf";
    pdfInput.id = "studyInkPdfInput"; pdfInput.hidden = true;
    workspace.appendChild(pdfInput);
    panel.addEventListener("click", handlePanelClick);
    input.addEventListener("change", importBackup);
    pdfInput.addEventListener("change", importPdf);

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
    if (action === "pdf-import") { $("studyInkPdfInput").click(); return; }
    if (action === "pdf-export") { exportPdf(); $("systemPanel").classList.add("hidden"); return; }
    if (action === "auto-restore") { restoreAutomaticBackup(); $("systemPanel").classList.add("hidden"); return; }
    if (action === "export") exportBackup();
    if (action === "import") $("systemImportInput").click();
    if (action === "theme") toggleTheme();
    if (action === "zoom-out") setZoom(zoomValue - 10);
    if (action === "zoom-in") setZoom(zoomValue + 10);
    if (action === "zoom-reset") setZoom(100);
    $("systemPanel").classList.add("hidden");
  }

  function duplicatePage() {
    if (typeof activeNotebook === "undefined" || !activeNotebook || typeof getCurrentPage !== "function") return;
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
    if (typeof activeNotebook === "undefined" || !activeNotebook || activeNotebook.pages.length <= 1) {
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
    if (typeof activeNotebook === "undefined" || !activeNotebook) return;
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


  let pdfLibraryPromise = null;
  function loadPdfLibrary() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfLibraryPromise) return pdfLibraryPromise;
    pdfLibraryPromise = new Promise((resolve,reject) => {
      const script=document.createElement("script");
      script.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload=()=>{if(!window.pdfjsLib)return reject(new Error("PDF.js konnte nicht geladen werden"));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);};
      script.onerror=()=>reject(new Error("PDF.js konnte nicht geladen werden"));
      document.head.appendChild(script);
    });
    return pdfLibraryPromise;
  }
  async function importPdf(event) {
    const file=event.target.files&&event.target.files[0]; if(!file)return;
    if(file.size>40*1024*1024){toast("PDF ist zu groß (maximal 40 MB)");event.target.value="";return;}
    try {
      toast("PDF wird importiert …");
      const pdfjs=await loadPdfLibrary(), bytes=new Uint8Array(await file.arrayBuffer());
      const pdf=await pdfjs.getDocument({data:bytes}).promise;
      if(pdf.numPages>100)throw new Error("Maximal 100 PDF-Seiten pro Import");
      const imported=[];
      for(let number=1;number<=pdf.numPages;number++){
        const source=await pdf.getPage(number), base=source.getViewport({scale:1});
        const viewport=source.getViewport({scale:Math.min(2,1800/Math.max(base.width,base.height))});
        const pageCanvas=document.createElement("canvas");
        pageCanvas.width=Math.ceil(viewport.width);pageCanvas.height=Math.ceil(viewport.height);
        await source.render({canvasContext:pageCanvas.getContext("2d"),viewport}).promise;
        const image=document.createElement("canvas");image.width=900;image.height=1165;
        const ctx=image.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,900,1165);
        const fit=Math.min(900/pageCanvas.width,1165/pageCanvas.height),w=pageCanvas.width*fit,h=pageCanvas.height*fit;
        ctx.drawImage(pageCanvas,(900-w)/2,(1165-h)/2,w,h);
        imported.push({id:"page_"+Date.now()+"_"+number,number,createdAt:new Date().toISOString(),
          strokes:[],texts:[],backgroundDataUrl:image.toDataURL("image/jpeg",0.68)});
        pageCanvas.width=0;
      }
      const book={id:"book_"+Date.now(),name:file.name.replace(/\.pdf$/i,"")||"PDF-Import",
        createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),currentPage:0,pages:imported};
      const projectedSize = JSON.stringify(notebooks).length + JSON.stringify(book).length;
      if (projectedSize > 2100000) throw new Error("PDF zu groß für den verfügbaren Browserspeicher. Bitte weniger Seiten importieren.");
      notebooks.unshift(book);activeNotebook=book;activePageIndex=0;
      saveNotebooks();showNotebook();renderAll();toast("PDF mit "+imported.length+" Seiten importiert");
    } catch(error){console.error("StudyInk PDF import:",error);toast(error.message||"PDF-Import fehlgeschlagen");}
    finally{event.target.value="";}
  }
  function exportPdf() {
    if(typeof activeNotebook==="undefined"||!activeNotebook)return;
    if(typeof finishTextEditing==="function")finishTextEditing();
    const win=window.open("","_blank");
    if(!win){toast("Bitte Pop-ups für den PDF-Export erlauben");return;}
    const pages=activeNotebook.pages||[];
    const jobs=pages.map((page,index)=>new Promise(resolve=>{
      const c=document.createElement("canvas");c.width=900;c.height=1165;
      const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,900,1165);
      const finish=()=>{
        (page.strokes||[]).forEach(stroke=>{
          if(!stroke.points||!stroke.points.length)return;
          ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
          ctx.globalCompositeOperation=stroke.tool==="eraser"?"destination-out":"source-over";
          ctx.strokeStyle=stroke.color||"#111";
          ctx.fillStyle=stroke.color||"#111";ctx.globalAlpha=stroke.opacity==null?1:stroke.opacity;
          ctx.lineWidth=(stroke.size||2)*(stroke.tool==="highlighter"?4:1);
          if(stroke.points.length===1){const p=stroke.points[0];ctx.beginPath();ctx.arc(p.x,p.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
          else{ctx.beginPath();ctx.moveTo(stroke.points[0].x,stroke.points[0].y);stroke.points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();}
          ctx.restore();
        });
        (page.texts||[]).forEach(note=>{ctx.fillStyle=note.color||"#111";ctx.font=(note.size||22)+"px Arial";ctx.fillText(note.text||"",note.x||0,(note.y||0)+(note.size||22));});
        resolve('<section><img src="'+c.toDataURL("image/png")+'"><small>'+(index+1)+'</small></section>');
      };
      if(page.backgroundDataUrl){const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0,900,1165);finish();};img.onerror=finish;img.src=page.backgroundDataUrl;}
      else finish();
    }));
    Promise.all(jobs).then(html=>{
      const title=String(activeNotebook.name||"StudyInk").replace(/[&<>"']/g,"");
      win.document.open();
      win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+title+'</title><style>'+
        '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff}section{position:relative;width:210mm;height:297mm;page-break-after:always;overflow:hidden}'+
        'section:last-child{page-break-after:auto}section img{width:100%;height:100%;object-fit:contain}small{position:absolute;right:8mm;bottom:5mm;color:#777;font:9pt Arial}'+
        '@media screen{body{background:#e9edf3}section{margin:12px auto;box-shadow:0 2px 12px #999}}</style></head><body>'+
        html.join("")+'<script>window.onload=()=>setTimeout(()=>window.print(),350)<\/script></body></html>');
      win.document.close();toast("Druckdialog öffnen und „Als PDF speichern“ wählen");
    }).catch(error=>{win.close();console.error(error);toast("PDF-Export fehlgeschlagen");});
  }
  function openBackupDatabase() {
    return new Promise((resolve,reject) => {
      if (!("indexedDB" in window)) return reject(new Error("IndexedDB wird nicht unterstützt"));
      const request = indexedDB.open("StudyInkBackups", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("snapshots")) {
          request.result.createObjectStore("snapshots");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Backup-Speicher nicht verfügbar"));
    });
  }

  async function runAutomaticBackup() {
    try {
      if (typeof notebooks === "undefined" || !Array.isArray(notebooks) || !notebooks.length) return;
      const db = await openBackupDatabase();
      await new Promise((resolve,reject) => {
        const tx = db.transaction("snapshots","readwrite");
        tx.objectStore("snapshots").put({
          savedAt: new Date().toISOString(),
          notebooks: JSON.parse(JSON.stringify(notebooks))
        }, "latest");
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Backup fehlgeschlagen"));
      });
      db.close();
    } catch(error) {
      console.warn("StudyInk automatic backup:", error);
      if (!runAutomaticBackup.warned) {
        runAutomaticBackup.warned = true;
        toast("Automatisches Backup nicht verfügbar");
      }
    }
  }

  async function restoreAutomaticBackup() {
    try {
      const db = await openBackupDatabase();
      const snapshot = await new Promise((resolve,reject) => {
        const tx = db.transaction("snapshots","readonly");
        const request = tx.objectStore("snapshots").get("latest");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      if (!snapshot || !Array.isArray(snapshot.notebooks) || !snapshot.notebooks.length) {
        toast("Noch kein automatisches Backup vorhanden");
        return;
      }
      if (!confirm("Automatisches Backup vom " + new Date(snapshot.savedAt).toLocaleString() +
        " wiederherstellen? Deine aktuelle Notizbuchliste wird ersetzt.")) return;
      notebooks = snapshot.notebooks;
      activeNotebook = notebooks[0];
      activePageIndex = Math.max(0, Math.min(activeNotebook.currentPage || 0, activeNotebook.pages.length - 1));
      saveNotebooks();
      showNotebook();
      renderAll();
      toast("Automatisches Backup wiederhergestellt");
    } catch(error) {
      console.error("StudyInk backup restore:", error);
      toast("Backup konnte nicht wiederhergestellt werden");
    }
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

  function addStudyAssistant() {
    const root = document.querySelector(".notebook-view");
    if (!root || document.getElementById("studyAssistant")) return;
    const dock = document.createElement("section");
    dock.id = "studyAssistant";
    dock.className = "study-assistant";
    dock.setAttribute("aria-label", "StudyInk Schnellaktionen");
    dock.innerHTML = `
      <div class="assistant-orb" aria-hidden="true">✦</div>
      <div class="assistant-actions">
        <button type="button" data-assistant="summary">✧ Zusammenfassen</button>
        <button type="button" data-assistant="ideas">✧ Vorschläge</button>
      </div>
      <div class="assistant-result" id="assistantResult" role="status" aria-live="polite" hidden>
        <button type="button" class="assistant-close" aria-label="Schließen">×</button>
        <strong id="assistantResultTitle"></strong>
        <p id="assistantResultText"></p>
        <small>Lokale Auswertung deiner getippten Notizen · keine Daten werden hochgeladen</small>
      </div>`;
    root.appendChild(dock);
    dock.addEventListener("click", (event) => {
      const action = event.target.closest("[data-assistant]");
      if (action) {
        const kind = action.dataset.assistant;
        const page = typeof getCurrentPage === "function" ? getCurrentPage() : null;
        const notes = (page && Array.isArray(page.texts) ? page.texts : [])
          .map(item => String(item.text || "").trim()).filter(Boolean);
        const result = dock.querySelector("#assistantResult");
        const title = dock.querySelector("#assistantResultTitle");
        const output = dock.querySelector("#assistantResultText");
        if (!notes.length) {
          title.textContent = "Noch keine Textnotizen";
          output.textContent = "Füge mit dem Textwerkzeug Notizen hinzu. Handschrift und PDF-Inhalte werden hier nicht automatisch erkannt.";
        } else if (kind === "summary") {
          const text = notes.join(" ").replace(/\\s+/g, " ").trim();
          const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
          const chosen = sentences.length <= 3 ? sentences : [sentences[0], sentences[Math.floor((sentences.length - 1) / 2)], sentences[sentences.length - 1]];
          title.textContent = "Kurzfassung";
          output.textContent = chosen.join(" ").slice(0, 650);
        } else {
          const text = notes.join(" ").toLowerCase();
          const ideas = [];
          if (/projekt|plan|ziel|aufgabe|deadline|termin/.test(text)) ideas.push("Erstelle eine kurze Aufgabenliste mit Verantwortlichen und Terminen.");
          if (/meeting|besprech|notiz|idee/.test(text)) ideas.push("Fasse die wichtigsten Entscheidungen in drei Stichpunkten zusammen.");
          if (/lernen|prüfung|vokabel|formel|kapitel/.test(text)) ideas.push("Mache aus den Notizen Karteikarten oder eine kleine Selbstkontrolle.");
          if (/frage|unklar|prüfen|offen/.test(text)) ideas.push("Markiere offene Fragen und ergänze eine Quelle oder Erklärung.");
          if (!ideas.length) ideas.push("Ordne die Notizen in Überschriften und Stichpunkte und markiere die wichtigste Aussage.");
          title.textContent = "Nächste Schritte";
          output.textContent = ideas.join(" ");
        }
        result.hidden = false;
        return;
      }
      if (event.target.closest(".assistant-close")) dock.querySelector("#assistantResult").hidden = true;
    });
  }

  function start() {
    loadPrefs();
    addSystemUI();
    addStudyAssistant();
    document.documentElement.dataset.studyinkTheme = prefs.theme === "soft-dark" ? "soft-dark" : "light";
    setZoom(zoomValue);
    document.addEventListener("keydown", keyboardEnhancements);
    runAutomaticBackup();
    window.setInterval(runAutomaticBackup, 60000);
    window.addEventListener("beforeunload", runAutomaticBackup);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(start, 0), { once: true });
  } else {
    setTimeout(start, 0);
  }
})();