const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  pages: JSON.parse(localStorage.getItem("studyink_pages") || "null") || [
    {id: crypto.randomUUID(), title:"Homework", strokes:[], imports:[], created:Date.now()}
  ],
  current: 0,
  tool: "pen",
  color: "#111827",
  size: 4,
  mode: "solve",
  drawing: false,
  history: [],
  redo: []
};

const canvas = $("#inkCanvas");
const ctx = canvas.getContext("2d");
const paper = $("#paper");
let dpr = Math.max(1, window.devicePixelRatio || 1);

function currentPage(){ return state.pages[state.current]; }
function persist(){
  localStorage.setItem("studyink_pages", JSON.stringify(state.pages));
  $("#saveStatus").textContent = "Saved locally • " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
function renderPageList(){
  $("#pageList").innerHTML = state.pages.map((p,i)=>`
    <button class="page-item ${i===state.current?"active":""}" data-index="${i}">
      <strong>${escapeHtml(p.title)}</strong><span>Page ${i+1}</span>
    </button>`).join("");
  $$(".page-item").forEach(b=>b.onclick=()=>{state.current=+b.dataset.index; loadPage();});
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function resizeCanvas(){
  const rect = paper.getBoundingClientRect();
  dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width*dpr);
  canvas.height = Math.round(rect.height*dpr);
  canvas.style.width = rect.width+"px"; canvas.style.height = rect.height+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  redraw();
}
function redraw(){
  const rect=paper.getBoundingClientRect();
  ctx.clearRect(0,0,rect.width,rect.height);
  for(const stroke of currentPage().strokes || []) drawStroke(stroke);
  paper.classList.toggle("has-ink",(currentPage().strokes||[]).length>0);
}
function drawStroke(s){
  if(!s.points.length) return;
  ctx.save();
  ctx.lineCap="round";ctx.lineJoin="round";
  ctx.strokeStyle=s.tool==="eraser"?"rgba(0,0,0,1)":s.color;
  ctx.globalAlpha=s.tool==="highlighter"?0.25:1;
  ctx.lineWidth=s.tool==="highlighter"?Math.max(10,s.size*2.2):s.size;
  ctx.globalCompositeOperation=s.tool==="eraser"?"destination-out":"source-over";
  ctx.beginPath();ctx.moveTo(s.points[0].x,s.points[0].y);
  for(let i=1;i<s.points.length;i++)ctx.lineTo(s.points[i].x,s.points[i].y);
  ctx.stroke();ctx.restore();
}
function point(e){
  const r=canvas.getBoundingClientRect();
  return {x:e.clientX-r.left,y:e.clientY-r.top};
}
canvas.addEventListener("pointerdown",e=>{
  e.preventDefault();canvas.setPointerCapture(e.pointerId);state.drawing=true;
  state.history.push(JSON.stringify(currentPage().strokes)); if(state.history.length>30)state.history.shift(); state.redo=[];
  const p=point(e); currentPage().strokes.push({tool:state.tool,color:state.color,size:state.size,points:[p]}); redraw();
});
canvas.addEventListener("pointermove",e=>{
  if(!state.drawing)return;e.preventDefault();
  currentPage().strokes.at(-1).points.push(point(e)); redraw();
});
canvas.addEventListener("pointerup",()=>{state.drawing=false;persist();});
canvas.addEventListener("pointercancel",()=>state.drawing=false);

$$(".tool").forEach(b=>b.addEventListener("click",()=>{
  const tool=b.dataset.tool;if(!tool)return;state.tool=tool;
  $$(".tool[data-tool]").forEach(x=>x.classList.toggle("active",x===b));
}));
$("#colorPicker").oninput=e=>state.color=e.target.value;
$("#sizeRange").oninput=e=>{state.size=+e.target.value;$("#sizeValue").value=state.size;$("#sizeValue").textContent=state.size;};

$("#undoBtn").onclick=()=>{
  if(!state.history.length)return;
  state.redo.push(JSON.stringify(currentPage().strokes));
  currentPage().strokes=JSON.parse(state.history.pop()); redraw(); persist();
};
$("#redoBtn").onclick=()=>{
  if(!state.redo.length)return;
  state.history.push(JSON.stringify(currentPage().strokes));
  currentPage().strokes=JSON.parse(state.redo.pop()); redraw(); persist();
};
$("#clearBtn").onclick=()=>{
  if(!currentPage().strokes.length)return;
  state.history.push(JSON.stringify(currentPage().strokes));currentPage().strokes=[];redraw();persist();
};

function newPage(){
  state.pages.push({id:crypto.randomUUID(),title:"New page",strokes:[],imports:[],created:Date.now()});
  state.current=state.pages.length-1;renderPageList();loadPage();persist();
}
$("#newPageBtn").onclick=newPage;$("#addPageBtn").onclick=newPage;$("#saveBtn").onclick=persist;

function loadPage(){
  $("#importLayer").innerHTML=(currentPage().imports||[]).map(src=>`<img class="import-img" src="${src}" alt="Imported material">`).join("");
  redraw();renderPageList();
}
window.addEventListener("resize",resizeCanvas);

$("#fileInput").onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  if(file.type.startsWith("image/")){
    const reader=new FileReader();reader.onload=()=>{currentPage().imports.push(reader.result);loadPage();persist()};reader.readAsDataURL(file);
  } else if(file.type==="application/pdf"){
    addAiMessage("PDF import is represented in this frontend prototype. Connect a PDF parser/backend in v2 to extract its pages and text.");
  }
  e.target.value="";
};

$$(".mode").forEach(b=>b.onclick=()=>{
  state.mode=b.dataset.mode;$$(".mode").forEach(x=>x.classList.toggle("active",x===b));
  $("#aiInput").placeholder={solve:"Paste or type the question you want solved...",explain:"What should I explain?",check:"Paste your answer to check it...",research:"What should I research?",summarize:"What should I summarize?",quiz:"What topic should I quiz you on?"}[state.mode];
});

$("#usePageBtn").onclick=()=>{
  $("#aiInput").value += ($("#aiInput").value?"\n\n":"")+"Use the current StudyInk page as context.";
  $("#aiInput").focus();
};

function addMessage(kind,html){
  const d=document.createElement("div");d.className="message "+kind;d.innerHTML=html;$("#chat").appendChild(d);$("#chat").scrollTop=$("#chat").scrollHeight;
}
function addAiMessage(text){addMessage("ai",`<p>${escapeHtml(text).replace(/\n/g,"<br>")}</p>`);}

$("#aiForm").onsubmit=e=>{
  e.preventDefault();const q=$("#aiInput").value.trim();if(!q)return;
  addMessage("user",escapeHtml(q).replace(/\n/g,"<br>"));$("#aiInput").value="";
  const modeName=state.mode[0].toUpperCase()+state.mode.slice(1);
  setTimeout(()=>addAiMessage(`${modeName} mode is ready. This v1 is a frontend-only prototype, so it cannot call a real AI or web search yet. The next step is to connect this panel to a secure backend (for example, an AI API + web search), while keeping your API key off the browser.`),250);
};

$("#clearStorageBtn").onclick=()=>{
  if(confirm("Reset all locally saved StudyInk pages?")){localStorage.removeItem("studyink_pages");location.reload();}
};

loadPage();
requestAnimationFrame(resizeCanvas);
