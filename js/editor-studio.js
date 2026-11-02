/* StudyInk Editor Studio: templates, movable docks, mobile controls and advanced settings. */
(() => {
  "use strict";
  const PREF_KEY = "studyink_editor_studio_v1";
  const TEMPLATE_KEY = "studyink_page_templates_v1";
  const basePrefs = { mobileDock: true, pressureHint: true, snapPanels: true, toolbarLabels: true, pageNumbers: true };
  let prefs = { ...basePrefs };
  let templates = [
    { id:"blank", name:"Blank", kind:"blank" },
    { id:"ruled", name:"Ruled", kind:"ruled" },
    { id:"grid", name:"Grid", kind:"grid" },
    { id:"dots", name:"Dot grid", kind:"dots" },
    { id:"cornell", name:"Cornell notes", kind:"cornell" },
    { id:"planner", name:"Planner", kind:"planner" }
  ];
  let positions = {};
  try { const saved=JSON.parse(localStorage.getItem(PREF_KEY)||"{}"); prefs={...basePrefs,...saved.prefs}; positions=saved.positions||{}; } catch (_) {}
  try { const saved=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||"[]"); if(Array.isArray(saved)) templates=templates.concat(saved.filter(t=>t&&t.id&&!templates.some(x=>x.id===t.id))); } catch (_) {}
  const $ = id => document.getElementById(id);
  const save = () => { try { localStorage.setItem(PREF_KEY,JSON.stringify({prefs,positions})); localStorage.setItem(TEMPLATE_KEY,JSON.stringify(templates.filter(t=>!["blank","ruled","grid","dots","cornell","planner"].includes(t.id)))); } catch (_) {} };
  const style = document.createElement("style");
  style.textContent = `
    .paper[data-template="ruled"] .grid{background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 30px,rgba(80,130,180,.22) 31px,transparent 32px)!important;background-size:100% 32px!important}
    .paper[data-template="grid"] .grid{background-image:linear-gradient(rgba(75,125,175,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(75,125,175,.2) 1px,transparent 1px)!important;background-size:24px 24px!important}
    .paper[data-template="dots"] .grid{background-image:radial-gradient(rgba(75,125,175,.42) 1px,transparent 1.2px)!important;background-size:20px 20px!important}
    .paper[data-template="cornell"] .grid{background-image:linear-gradient(90deg,transparent 0,transparent 27%,rgba(210,80,80,.35) 27.2%,transparent 27.5%),repeating-linear-gradient(to bottom,transparent 0,transparent 31px,rgba(80,130,180,.2) 32px,transparent 33px)!important;background-size:100% 33px!important}
    .paper[data-template="planner"] .grid{background-image:linear-gradient(90deg,rgba(80,130,180,.2) 1px,transparent 1px),linear-gradient(rgba(80,130,180,.2) 1px,transparent 1px)!important;background-size:33.333% 25%!important;border:1px solid rgba(80,130,180,.25)}
    .si-mobile-dock{display:none}
    .si-editor-dialog-backdrop{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:14px;background:rgba(3,9,14,.68);backdrop-filter:blur(8px)}
    .si-editor-dialog{width:min(590px,100%);max-height:min(88dvh,780px);overflow:auto;color:#eaf2f6;background:#142027;border:1px solid #354852;border-radius:18px;box-shadow:0 28px 90px #0008}
    .si-editor-dialog header{display:flex;justify-content:space-between;align-items:center;padding:19px 22px;border-bottom:1px solid #30414a}
    .si-editor-dialog h2{margin:0;font-size:19px}.si-editor-dialog header button{width:34px;height:34px;border-radius:9px;background:#263640;color:white;font-size:20px}
    .si-editor-body{display:grid;gap:15px;padding:20px 22px}
    .si-editor-row{display:grid;gap:7px}.si-editor-row label,.si-editor-row strong{font-size:12px;font-weight:700;color:#eaf2f6}
    .si-editor-row small{color:#9aabb4;font-size:11px}
    .si-editor-row input[type=text],.si-editor-row select{width:100%;min-height:39px;padding:8px 10px;border:1px solid #40535e;border-radius:9px;background:#1d2b33;color:#eef5f8}
    .si-editor-actions{display:flex;gap:8px;flex-wrap:wrap}
    .si-editor-actions button,.si-editor-dialog footer button{min-height:38px;padding:0 13px;border:1px solid #40535e;border-radius:9px;background:#23323b;color:#eaf2f6;cursor:pointer}
    .si-editor-actions button[aria-pressed=true]{border-color:#35a9e8;background:#204357}
    .si-editor-dialog footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;border-top:1px solid #30414a}
    .si-editor-dialog footer .primary-action{background:#168fc9;border-color:#168fc9;color:white;font-weight:700}
    .si-template-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .si-template{display:flex;align-items:center;gap:10px;text-align:left;padding:10px;border:1px solid #354852;border-radius:10px;background:#1b2931;color:#eaf2f6;cursor:pointer}
    .si-template[aria-pressed=true]{border-color:#35a9e8;background:#203d4b}
    .si-template-preview{width:34px;height:44px;flex:0 0 34px;border-radius:4px;background-color:#fff;background-image:linear-gradient(#a8c7dc 1px,transparent 1px),linear-gradient(90deg,#a8c7dc 1px,transparent 1px);background-size:8px 8px}
    .si-template-preview.ruled{background-image:repeating-linear-gradient(to bottom,#fff 0 7px,#b7d1e4 8px)}
    .si-template-preview.dots{background-image:radial-gradient(#8aaac1 1px,transparent 1px);background-size:7px 7px}
    .si-drag-handle{position:absolute;top:3px;right:5px;z-index:3;display:grid;place-items:center;width:26px;height:23px;border:1px solid #8295a0;border-radius:7px;background:#f4f7f9;color:#43515a;cursor:grab;touch-action:none;opacity:.62}
    .si-drag-handle:hover{opacity:1}.si-dragging{outline:2px dashed #35a9e8!important;outline-offset:3px}
    .si-panel-snapped{transition:left .14s ease,top .14s ease}
    .si-panel-tools{display:flex;gap:7px;flex-wrap:wrap}
    .si-panel-tools button{min-height:35px;padding:0 11px;border:1px solid #40535e;border-radius:9px;background:#1d2b33;color:#eaf2f6}
    @media(max-width:700px){
      .si-mobile-dock{position:fixed;z-index:90;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-around;gap:3px;padding:7px 5px;border:1px solid #344650;border-radius:15px;background:rgba(20,30,37,.96);box-shadow:0 10px 35px #0004;backdrop-filter:blur(14px)}
      .si-mobile-dock button{display:grid;place-items:center;gap:2px;min-width:0;min-height:43px;flex:1;padding:4px 2px;border-radius:9px;background:transparent;color:#e5eef3;font-size:18px}
      .si-mobile-dock button span{font-size:9px;white-space:nowrap}
      .si-mobile-dock button:active,.si-mobile-dock button.active{background:#254353;color:#8bd5ff}
      .paper-stage{padding-bottom:calc(100px + env(safe-area-inset-bottom))!important}
      .si-drag-handle{width:30px;height:28px;opacity:.85}
      .si-template-list{grid-template-columns:1fr}
    }
    @media(prefers-reduced-motion:reduce){.si-panel-snapped{transition:none}}
  `;
  document.head.appendChild(style);
  function toast(message){if(typeof window.showToast==="function")window.showToast(message);else{const el=$("toast");if(el){el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800);}}}
  function currentPage(){return typeof getCurrentPage==="function"?getCurrentPage():null;}
  function applyTemplate(id,page=currentPage()){
    const template=templates.find(t=>t.id===id); if(!template||!page)return;
    page.template=template.id;
    const paper=$("paper"); if(paper)paper.dataset.template=template.kind;
    if(typeof scheduleSave==="function")scheduleSave();
    if(typeof renderPages==="function")renderPages();
    toast("Vorlage angewendet: "+template.name);
  }
  function syncTemplate(){const page=currentPage(),paper=$("paper");if(paper)paper.dataset.template=(templates.find(t=>t.id===(page&&page.template))||templates[0]).kind;}
  function dialog(title,body,footer){
    const backdrop=document.createElement("div");backdrop.className="si-editor-dialog-backdrop";
    backdrop.innerHTML='<section class="si-editor-dialog" role="dialog" aria-modal="true"><header><h2></h2><button type="button" aria-label="Schließen">×</button></header><div class="si-editor-body"></div><footer></footer></section>';
    backdrop.querySelector("h2").textContent=title;backdrop.querySelector(".si-editor-body").append(body);backdrop.querySelector("footer").append(footer);
    const close=()=>backdrop.remove();backdrop.querySelector("header button").addEventListener("click",close);backdrop.addEventListener("click",e=>{if(e.target===backdrop)close();});backdrop.querySelector(".si-editor-dialog").addEventListener("keydown",e=>{if(e.key==="Escape")close();});
    document.body.append(backdrop);backdrop.querySelector("header button").focus();return {backdrop,close};
  }
  function openTemplates(){
    const body=document.createElement("div"),list=document.createElement("div");list.className="si-template-list";
    const active=currentPage();let chosen=active&&active.template||"blank";
    const render=()=>{list.innerHTML="";templates.forEach(t=>{const b=document.createElement("button");b.type="button";b.className="si-template";b.setAttribute("aria-pressed",String(chosen===t.id));const preview=document.createElement("span");preview.className="si-template-preview "+t.kind;const name=document.createElement("span");name.textContent=t.name;b.append(preview,name);b.addEventListener("click",()=>{chosen=t.id;render();});list.append(b);});};
    render();body.append(list);
    const name=document.createElement("input");name.type="text";name.maxLength=32;name.placeholder="Name für eigene Vorlage";
    const create=document.createElement("button");create.type="button";create.textContent="＋ Eigene Vorlage speichern";
    const customRow=document.createElement("div");customRow.className="si-editor-row";customRow.append(name,create);body.append(customRow);
    create.addEventListener("click",()=>{const n=name.value.trim();if(!n){name.focus();return;}const id="custom-"+Date.now();templates.push({id,name:n,kind:"grid"});chosen=id;save();render();name.value="";toast("Eigene Vorlage gespeichert");});
    const cancel=document.createElement("button");cancel.textContent="Schließen";cancel.type="button";
    const apply=document.createElement("button");apply.textContent="Auf aktuelle Seite anwenden";apply.className="primary-action";apply.type="button";
    const d=dialog("Seitenvorlagen",body,cancel);d.backdrop.querySelector("footer").append(apply);
    cancel.addEventListener("click",d.close);apply.addEventListener("click",()=>{applyTemplate(chosen);d.close();});
  }
  function openSettings(){
    const body=document.createElement("div");
    const addToggle=(label,key,hint)=>{const row=document.createElement("div");row.className="si-editor-row";const lab=document.createElement("label");const input=document.createElement("input");input.type="checkbox";input.checked=!!prefs[key];input.addEventListener("change",()=>{prefs[key]=input.checked;save();applyPrefs();});lab.append(input,document.createTextNode(" "+label));const small=document.createElement("small");small.textContent=hint;row.append(lab,small);body.append(row);};
    addToggle("Mobile quick toolbar","mobileDock","Zeigt auf kleinen Displays eine feste Werkzeugleiste am unteren Rand.");
    addToggle("Tool labels","toolbarLabels","Zeigt verständliche Beschriftungen in der mobilen Werkzeugleiste.");
    addToggle("Snap movable panels","snapPanels","Richtet verschiebbare Panels beim Loslassen an Bildschirmrändern aus.");
    addToggle("Page number indicator","pageNumbers","Zeigt die Seitenposition im Notizbuch.");
    addToggle("Touch-friendly controls","pressureHint","Vergrößert die Interaktionsflächen auf Touch-Geräten.");
    const info=document.createElement("small");info.textContent="Einstellungen und Panel-Positionen werden lokal in diesem Browser gespeichert. Notizbuchseiten und Zeichnungen bleiben im bestehenden StudyInk-Speicher.";body.append(info);
    const close=document.createElement("button");close.type="button";close.textContent="Fertig";
    const d=dialog("Advanced editor settings",body,close);close.addEventListener("click",d.close);
  }
  function applyPrefs(){
    const dock=$("siMobileDock");if(dock)dock.hidden=!prefs.mobileDock;
    const indicator=$("pageIndicator");if(indicator)indicator.hidden=!prefs.pageNumbers;
    document.documentElement.classList.toggle("si-touch-controls",!!prefs.pressureHint);
    document.documentElement.classList.toggle("si-toolbar-labels",!!prefs.toolbarLabels);
    save();
  }
  function mobileDock(){
    if($("siMobileDock"))return;
    const dock=document.createElement("nav");dock.id="siMobileDock";dock.className="si-mobile-dock";dock.setAttribute("aria-label","Editor quick tools");
    const actions=[["pen","✎","Stift"],["eraser","⌫","Radierer"],["text","T","Text"],["lasso","◌","Lasso"],["pages","▣","Seiten"],["undo","↶","Undo"],["redo","↷","Redo"],["template","▤","Vorlage"],["settings","⚙","Setup"]];
    actions.forEach(([id,icon,label])=>{const b=document.createElement("button");b.type="button";b.dataset.action=id;b.setAttribute("aria-label",label);b.innerHTML=icon+'<span>'+label+'</span>';b.addEventListener("click",()=>{if(["pen","eraser","text","lasso"].includes(id)){if(typeof setTool==="function")setTool(id);dock.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));}else if(id==="pages")$("pagesButton").click();else if(id==="undo")$("undo").click();else if(id==="redo")$("redo").click();else if(id==="template")openTemplates();else openSettings();});dock.append(b);});
    $("notebookView").append(dock);
  }
  function addPanelHandle(el,key){
    if(!el||el.querySelector(":scope > .si-drag-handle"))return;
    if(getComputedStyle(el).position==="static")el.style.position="relative";
    const handle=document.createElement("button");handle.type="button";handle.className="si-drag-handle";handle.textContent="⠿";handle.title="Panel verschieben";handle.setAttribute("aria-label","Panel verschieben");el.append(handle);
    const saved=positions[key];if(saved){el.style.left=saved.x+"px";el.style.top=saved.y+"px";el.style.right="auto";el.style.bottom="auto";}
    let drag=null;
    handle.addEventListener("pointerdown",e=>{e.preventDefault();const r=el.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};handle.setPointerCapture(e.pointerId);el.classList.add("si-dragging");});
    handle.addEventListener("pointermove",e=>{if(!drag)return;el.style.position="fixed";el.style.left=Math.max(0,Math.min(innerWidth-el.offsetWidth,drag.left+e.clientX-drag.x))+"px";el.style.top=Math.max(0,Math.min(innerHeight-el.offsetHeight,drag.top+e.clientY-drag.y))+"px";el.style.right="auto";el.style.bottom="auto";});
    const end=()=>{if(!drag)return;drag=null;el.classList.remove("si-dragging");const r=el.getBoundingClientRect();let x=r.left,y=r.top;if(prefs.snapPanels){if(x<24)x=8;if(innerWidth-r.right<24)x=Math.max(8,innerWidth-el.offsetWidth-8);if(y<24)y=8;if(innerHeight-r.bottom<24)y=Math.max(8,innerHeight-el.offsetHeight-8);}el.style.left=x+"px";el.style.top=y+"px";positions[key]={x,y};save();};
    handle.addEventListener("pointerup",end);handle.addEventListener("pointercancel",end);
  }
  function addEditorButtons(){
    const tools=$("notebookView")?.querySelector(".top-tools");if(tools&&!$("siTemplateButton")){const b=document.createElement("button");b.id="siTemplateButton";b.className="top-button";b.type="button";b.title="Seitenvorlage";b.textContent="▤";b.addEventListener("click",openTemplates);tools.insertBefore(b,tools.lastElementChild);}
    if(tools&&!$("siAdvancedButton")){const b=document.createElement("button");b.id="siAdvancedButton";b.className="top-button";b.type="button";b.title="Advanced settings";b.textContent="⚙";b.addEventListener("click",openSettings);tools.append(b);}
  }
  function initialize(){
    addEditorButtons();mobileDock();applyPrefs();syncTemplate();
    addPanelHandle($("penPalette"),"penPalette");addPanelHandle(document.querySelector(".history"),"history");addPanelHandle($("pageSidebar"),"pageSidebar");addPanelHandle($("pageIndicator"),"pageIndicator");addPanelHandle($("studyAssistant"),"studyAssistant");
    const root=$("notebookView");if(root){const observer=new MutationObserver(()=>{if(!$("penPalette")?.querySelector(".si-drag-handle"))addPanelHandle($("penPalette"),"penPalette");if(!document.querySelector(".history .si-drag-handle"))addPanelHandle(document.querySelector(".history"),"history");syncTemplate();});observer.observe(root,{childList:true,subtree:true});}
    const originalRender=window.renderAll;if(typeof originalRender==="function"&&!originalRender.__studioWrapped){const wrapped=function(){originalRender.apply(this,arguments);syncTemplate();};wrapped.__studioWrapped=true;window.renderAll=wrapped;}
    window.addEventListener("resize",()=>{if(innerWidth<=700){const dock=$("siMobileDock");if(dock)dock.hidden=!prefs.mobileDock;}});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(initialize,30),{once:true});else setTimeout(initialize,30);
})();