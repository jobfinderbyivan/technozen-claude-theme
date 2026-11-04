(() => {
  const THEMES = __THEMES__;
  const ORDER = Object.keys(THEMES);
  const CSS = __CSS__;
  const html = document.documentElement;
  const style = document.getElementById("technozen") || Object.assign(document.createElement("style"), { id: "technozen" });

  function apply(slug) {
    if (!THEMES[slug]) slug = ORDER[0];
    if (html.dataset.technozen !== slug || !style.isConnected) style.textContent = CSS[slug];
    document.head.appendChild(style); // (re-)append so it stays after the app's own stylesheets
    if (!html.dataset.technozen) style.dataset.appMode = html.dataset.mode || ""; // the app's own light/dark, for remove()
    html.dataset.technozen = slug;
    html.dataset.mode = THEMES[slug].mode; // a few non-variable rules (icons, scrollbars) key off data-mode
    localStorage.setItem("technozen", slug);
    sync();
  }

  // The skin (shapes, gloss, backgrounds) sits on top of the colors and can be turned off.
  function skin(on) {
    html.dataset.technozenSkin = on ? "on" : "off";
    localStorage.setItem("technozen-skin", html.dataset.technozenSkin);
    sync();
  }

  function remove() {
    const ours = THEMES[html.dataset.technozen];
    style.remove();
    panel.remove();
    delete html.dataset.technozen;
    delete html.dataset.technozenSkin;
    // Put the app's mode back, unless the app changed it itself while the theme was on.
    if (ours && html.dataset.mode === ours.mode && style.dataset.appMode) html.dataset.mode = style.dataset.appMode;
    localStorage.removeItem("technozen");
  }

  // The panel: one swatch per theme, a skin switch, remove, and a fold button. Re-running the
  // snippet reuses the existing panel. Its look comes from the app's own variables, so it fits any theme.
  const panel = document.getElementById("technozen-panel") || Object.assign(document.createElement("div"), { id: "technozen-panel" });
  panel.innerHTML = `<style>
    #technozen-panel { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 999px; font: 13px system-ui, sans-serif; color: var(--cds-text-primary, #222);
      background: var(--cds-surface-popover, #fff); box-shadow: 0 0 0 1px var(--cds-border, #0002), 0 8px 24px #0003; }
    #technozen-panel[data-folded] > :not(.tz-fold) { display: none; }
    #technozen-panel button { all: unset; cursor: pointer; box-sizing: border-box; }
    #technozen-panel .tz-swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--cds-surface-popover, #fff); box-shadow: 0 0 0 1px var(--cds-border, #0003); }
    #technozen-panel .tz-swatch[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--cds-text-primary, #222); }
    #technozen-panel label { display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
    #technozen-panel .tz-remove { padding: 0 6px; opacity: 0.7; } #technozen-panel .tz-remove:hover { opacity: 1; }
    #technozen-panel .tz-fold { width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; background: var(--cds-fill-secondary, #0001); }
  </style>` + ORDER.map(s => `<button class="tz-swatch" data-theme="${s}" title="${THEMES[s].name}" style="background: linear-gradient(135deg, ${THEMES[s].bg} 45%, ${THEMES[s].accent} 55%)"></button>`).join("")
    + `<label title="Full skin on, or colors only"><input type="checkbox" class="tz-skin"> skin</label>`
    + `<button class="tz-remove" title="Remove Technozen (Ctrl+Alt+0)">×</button><button class="tz-fold" title="Fold the panel">◐</button>`;
  if (localStorage.getItem("technozen-panel") === "folded") panel.dataset.folded = "";
  panel.onclick = e => {
    const b = e.target.closest("button, input");
    if (!b) return;
    if (b.dataset.theme) apply(b.dataset.theme);
    else if (b.classList.contains("tz-skin")) skin(b.checked);
    else if (b.classList.contains("tz-remove")) remove();
    else if (b.classList.contains("tz-fold")) {
      panel.toggleAttribute("data-folded");
      localStorage.setItem("technozen-panel", panel.hasAttribute("data-folded") ? "folded" : "open");
    }
  };
  function sync() {
    if (!panel.isConnected) document.body.appendChild(panel);
    panel.querySelectorAll(".tz-swatch").forEach(b => b.setAttribute("aria-pressed", b.dataset.theme === html.dataset.technozen));
    panel.querySelector(".tz-skin").checked = html.dataset.technozenSkin === "on";
  }

  if (window.technozenKeys) removeEventListener("keydown", window.technozenKeys); // re-running must not stack listeners
  addEventListener("keydown", window.technozenKeys = e => {
    if (!e.ctrlKey || !e.altKey || e.shiftKey) return;
    if (e.code === "KeyT") { e.preventDefault(); apply(ORDER[(ORDER.indexOf(html.dataset.technozen) + 1) % ORDER.length]); }
    if (e.code === "KeyS") { e.preventDefault(); skin(html.dataset.technozenSkin !== "on"); }
    if (e.code === "Digit0") { e.preventDefault(); remove(); }
  });

  window.technozen = { apply, remove, skin };
  skin(localStorage.getItem("technozen-skin") !== "off");
  apply(localStorage.getItem("technozen") || ORDER[0]);
})();
