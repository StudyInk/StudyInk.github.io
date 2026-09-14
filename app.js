const newBtn=document.getElementById("newBtn");
const menu=document.getElementById("newMenu");
const toast=document.getElementById("toast");

newBtn.addEventListener("click",e=>{e.stopPropagation();menu.classList.toggle("open")});
document.addEventListener("click",e=>{if(!menu.contains(e.target)&&e.target!==newBtn)menu.classList.remove("open")});

document.querySelectorAll("[data-create]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const type=btn.dataset.create;
    const labels={
      notebook:"Creating a new notebook…",
      document:"Opening a new text document…",
      whiteboard:"Opening a new whiteboard…",
      quick:"Starting a quick note…",
      image:"Choose an image to annotate.",
      folder:"Creating a new folder…",
      import:"Choose a PDF, image, or document to import."
    };
    showToast(labels[type]||"Coming soon");
    menu.classList.remove("open");
  });
});

document.querySelector(".download-btn").onclick=()=>showToast("Tablet app download will be connected here.");
document.querySelector(".close-card").onclick=e=>e.currentTarget.parentElement.remove();

function showToast(text){
  toast.textContent=text;toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>toast.classList.remove("show"),2200);
}
