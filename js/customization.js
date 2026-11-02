/* StudyInk Customization Studio — additive, local-only preferences. */
(() => {
  "use strict";
  const KEY = "studyink_customization_v1";
  const defaults = { theme: "dark", accent: "#35a9e8", density: "comfortable", scale: 1, radius: "soft" };
  let settings = { ...defaults };
  try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (_) {}
  const root = document.documentElement;
  const style = document.createElement("style");
  style.id = "studyink-customization-styles";
  style.textContent = `
    :root{--custom-accent:${settings.accent};--custom-scale:${settings.scale};}
    :root{--si-blue:${settings.accent};--si-accent:${settings.accent};--blue:${settings.accent};}
    .library-view{font-size:calc(1rem * var(--custom-scale,1))}
    .document-grid{gap:var(--custom-gap,15px)}
    .document-card{border-radius:var(--custom-radius,14px)}
    .nav,.primary,.round-top-action,.library-toolbar,.overview-card{border-radius:var(--custom-radius,12px)}
    .library-view[data-density="compact"] .document-card{min-height:76px;padding:8px 10px}
    .library-view[data-density="compact"] .document-preview{width:42px;height:52px}
    .library-view[data-density="compact"] .overview-card{min-height:78px;padding:10px 13px}
    .library-view[data-density="spacious"] .document-grid{gap:22px}
    .library-view[data-density="spacious"] .document-card{padding:18px;min-height:118px}
    .library-view[data-density="spacious"] .overview-card{min-height:120px;padding:22px}
    .si-settings-backdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:rgba(2,8,13,.68);backdrop-filter:blur(9px)}
    .si-settings-dialog{width:min(560px,100%);max-height:min(86vh,760px);overflow:auto;color:#eaf2f6;background:#141e25;border:1px solid #344650;border-radius:20px;box-shadow:0 30px 100px rgba(0,0,0,.5)}
    .si-settings-head{display:flex;align-items:center;justify-content:space-between;padding:22px 24px;border-bottom:1px solid #2b3a43}
    .si-settings-head h2{margin:0;font-size:21px;letter-spacing:-.5px}.si-settings-head p{margin:5px 0 0;color:#9aabb5;font-size:12px}
    .si-settings-close{width:36px;height:36px;border:1px solid #344650;border-radius:10px;background:#202d35;color:#eaf2f6;font-size:22px;cursor:pointer}
    .si-settings-body{display:grid;gap:20px;padding:22px 24px}
    .si-setting{display:grid;gap:10px}.si-setting-label{display:flex;justify-content:space-between;gap:12px;color:#eaf2f6;font-size:13px;font-weight:650}
    .si-setting-hint{color:#91a3ae;font-size:11px;font-weight:400}
    .si-choice-row{display:flex;flex-wrap:wrap;gap:8px}
    .si-choice{min-height:38px;padding:8px 13px;border:1px solid #354751;border-radius:10px;background:#1c2931;color:#dce7ed;cursor:pointer}
    .si-choice[aria-pressed="true"]{border-color:var(--custom-accent);background:color-mix(in srgb,var(--custom-accent) 17%,#1c2931);color:#fff}
    .si-swatches{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
    .si-swatch{width:32px;height:32px;border:2px solid rgba(255,255,255,.25);border-radius:50%;cursor:pointer}
    .si-swatch[aria-pressed="true"]{outline:2px solid #fff;outline-offset:3px}
    .si-color-input{width:42px;height:36px;padding:2px;border:1px solid #40515b;border-radius:9px;background:#1c2931}
    .si-range{width:100%;accent-color:var(--custom-accent)}
    .si-settings-foot{display:flex;justify-content:space-between;gap:10px;padding:16px 24px;border-top:1px solid #2b3a43}
    .si-settings-foot button{min-height:40px;padding:0 15px;border:1px solid #3a4d58;border-radius:10px;background:#202d35;color:#eaf2f6;cursor:pointer}
    .si-settings-foot .si-save{border-color:transparent;background:var(--custom-accent);color:#06131a;font-weight:750}
    @media(max-width:520px){.si-settings-head,.si-settings-body{padding:18px}.si-settings-foot{padding:14px 18px}.si-settings-dialog{border-radius:16px}}
    @media(prefers-reduced-motion:no-preference){.si-settings-dialog{animation:si-pop .18s ease-out}@keyframes si-pop{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:none}}}
  `;
  document.head.appendChild(style);
  function apply() {
    root.dataset.studyinkTheme = settings.theme === "light" ? "light" : "soft-dark";
    root.style.setProperty("--custom-accent", settings.accent);
    root.style.setProperty("--si-blue", settings.accent);
    root.style.setProperty("--si-accent", settings.accent);
    root.style.setProperty("--blue", settings.accent);
    root.style.setProperty("--custom-scale", String(settings.scale));
    root.style.setProperty("--custom-gap", settings.density === "compact" ? "9px" : settings.density === "spacious" ? "22px" : "15px");
    root.style.setProperty("--custom-radius", settings.radius === "sharp" ? "6px" : settings.radius === "round" ? "20px" : "12px");
    const library = document.getElementById("libraryView");
    if (library) library.dataset.density = settings.density;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {} }
  function open() {
    if (document.querySelector(".si-settings-backdrop")) return;
    const backdrop = document.createElement("div");
    backdrop.className = "si-settings-backdrop";
    backdrop.innerHTML = `
      <section class="si-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="siSettingsTitle">
        <header class="si-settings-head"><div><h2 id="siSettingsTitle">Customization Studio</h2><p>Personalize your StudyInk workspace</p></div><button class="si-settings-close" type="button" aria-label="Close">×</button></header>
        <div class="si-settings-body">
          <div class="si-setting"><div class="si-setting-label">Appearance <span class="si-setting-hint">Interface theme</span></div><div class="si-choice-row" data-group="theme"><button class="si-choice" data-value="dark">Dark</button><button class="si-choice" data-value="light">Light</button></div></div>
          <div class="si-setting"><div class="si-setting-label">Accent color <span class="si-setting-hint">Buttons and highlights</span></div><div class="si-swatches"><button class="si-swatch" data-color="#35a9e8" style="background:#35a9e8" aria-label="Blue"></button><button class="si-swatch" data-color="#8b7cf6" style="background:#8b7cf6" aria-label="Violet"></button><button class="si-swatch" data-color="#35b88a" style="background:#35b88a" aria-label="Green"></button><button class="si-swatch" data-color="#e49a45" style="background:#e49a45" aria-label="Orange"></button><button class="si-swatch" data-color="#e66b91" style="background:#e66b91" aria-label="Pink"></button><input class="si-color-input" type="color" aria-label="Choose custom accent" value="${settings.accent}"></div></div>
          <div class="si-setting"><div class="si-setting-label">Layout density <span class="si-setting-hint">Library spacing</span></div><div class="si-choice-row" data-group="density"><button class="si-choice" data-value="compact">Compact</button><button class="si-choice" data-value="comfortable">Comfortable</button><button class="si-choice" data-value="spacious">Spacious</button></div></div>
          <div class="si-setting"><div class="si-setting-label">Interface scale <strong data-scale-label>${Math.round(settings.scale*100)}%</strong></div><input class="si-range" type="range" min=".85" max="1.15" step=".05" value="${settings.scale}" aria-label="Interface scale"></div>
          <div class="si-setting"><div class="si-setting-label">Corner style</div><div class="si-choice-row" data-group="radius"><button class="si-choice" data-value="sharp">Sharp</button><button class="si-choice" data-value="soft">Soft</button><button class="si-choice" data-value="round">Rounded</button></div></div>
        </div>
        <footer class="si-settings-foot"><button type="button" data-reset>Reset defaults</button><button type="button" class="si-save" data-save>Save preferences</button></footer>
      </section>`;
    document.body.appendChild(backdrop);
    const dialog = backdrop.querySelector(".si-settings-dialog");
    const close = () => backdrop.remove();
    backdrop.addEventListener("click", e => { if (e.target === backdrop || e.target.closest(".si-settings-close")) close(); });
    dialog.querySelectorAll("[data-group]").forEach(group => {
      group.querySelectorAll("button").forEach(button => {
        button.setAttribute("aria-pressed", String(settings[group.dataset.group] === button.dataset.value));
        button.addEventListener("click", () => {
          settings[group.dataset.group] = button.dataset.value;
          group.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
          apply();
        });
      });
    });
    dialog.querySelectorAll("[data-color]").forEach(button => button.addEventListener("click", () => { settings.accent = button.dataset.color; dialog.querySelector(".si-color-input").value = settings.accent; apply(); }));
    dialog.querySelector(".si-color-input").addEventListener("input", e => { settings.accent = e.target.value; apply(); });
    dialog.querySelector(".si-range").addEventListener("input", e => { settings.scale = Number(e.target.value); dialog.querySelector("[data-scale-label]").textContent = Math.round(settings.scale*100)+"%"; apply(); });
    dialog.querySelector("[data-reset]").addEventListener("click", () => { settings = { ...defaults }; close(); apply(); persist(); open(); });
    dialog.querySelector("[data-save]").addEventListener("click", () => { persist(); close(); if (typeof window.showToast === "function") window.showToast("Einstellungen gespeichert"); });
    dialog.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    dialog.querySelector(".si-settings-close").focus();
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("#librarySettings");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  }, true);
  apply();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, { once: true });
  else apply();
})();