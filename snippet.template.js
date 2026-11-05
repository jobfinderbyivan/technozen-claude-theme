(() => {
  const THEMES = __THEMES__;
  const ORDER = Object.keys(THEMES);
  const CSS = __CSS__;
  const DROPS = __DROPS__;
  const html = document.documentElement;
  // __PHYSICS__
  const style = document.getElementById("technozen") || Object.assign(document.createElement("style"), { id: "technozen" });

  function apply(slug) {
    if (!THEMES[slug]) slug = ORDER[0];
    if (style.textContent !== CSS[slug]) style.textContent = CSS[slug];
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
    stopDrops();
    style.remove();
    panel.remove();
    delete html.dataset.technozen;
    delete html.dataset.technozenSkin;
    // Put the app's mode back, unless the app changed it itself while the theme was on.
    if (ours && html.dataset.mode === ours.mode && style.dataset.appMode) html.dataset.mode = style.dataset.appMode;
    localStorage.removeItem("technozen");
  }

  // Live drops: a canvas behind the app, driven by technozenWorld. Everything it starts, stopDrops ends.
  function stopDrops() { if (window.technozenDropsStop) window.technozenDropsStop(); }
  function startDrops() { if (!window.technozenDropsStop) runDrops().catch(e => { console.warn("[technozen] drops stay painted on the leaf:", e); stopDrops(); }); }

  async function runDrops() {
    let alive = true, raf = 0, timer = 0, resizeTimer = 0, scanTimer = 0, zoneTimer = 0, zoneIdle = 0, last = 0, spare = 0, activeUntil = 0, lastSample = 0, scrolledAt = -1e9;
    const off = new AbortController(), on = { passive: true, capture: true, signal: off.signal };
    const canvas = Object.assign(document.createElement("canvas"), { id: "technozen-drops" });
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";
    const ctx = canvas.getContext("2d");
    const world = technozenWorld(DROPS.drops, DROPS.w, DROPS.h);
    const mouse = { x: -1e6, y: -1e6, vx: 0, vy: 0, power: 0 };
    let shapes = [], s = 1, ox = 0, oy = 0, dpr = 1, mx = 0, my = 0, mt = 0;
    const bounds = { l: 0, t: 0, r: 0, b: 0, s: 1 }, drawnX = new Float64Array(DROPS.drops.length), drawnY = new Float64Array(DROPS.drops.length);
    let io, mo, ro;
    window.technozenDropsStop = () => {
      alive = false; off.abort(); cancelAnimationFrame(raf); clearTimeout(timer); clearTimeout(resizeTimer); clearTimeout(scanTimer); clearTimeout(zoneTimer);
      if (io) io.disconnect(); if (mo) mo.disconnect(); if (ro) ro.disconnect();
      canvas.remove(); delete html.dataset.technozenInteractive; window.technozenDropsStop = null;
    };

    // Every drop on one sheet, drawn by the browser from the same shape and gradients as the painted leaf.
    let ax = 2, ay = 2, rowH = 0;
    const cells = DROPS.drops.map(d => {
      const w = Math.ceil(d[2] * 2.8), h = Math.ceil(d[3] * 2.8);
      if (ax + w > 1400) { ax = 2; ay += rowH + 2; rowH = 0; }
      const cell = { x: ax, y: ay, w, h, left: d[2] * 1.25, top: d[3] * 1.25 };
      ax += w + 2; rowH = Math.max(rowH, h);
      return cell;
    });
    const sheetH = ay + rowH + 2;
    const uses = DROPS.drops.map((d, i) => `<use href='#d' transform='translate(${cells[i].x + cells[i].left} ${cells[i].y + cells[i].top})scale(${d[2]} ${d[3]})' stroke-width='${d[4]}'/>`).join("");
    const image = new Image();
    image.src = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='${sheetH}' viewBox='0 0 1400 ${sheetH}'><defs>${DROPS.defs}</defs>${uses}</svg>`);
    await image.decode();
    if (!alive) return;
    const sheet = document.createElement("canvas");

    function fit() { // the leaf's own center / cover scaling, so a drop sits exactly where it was painted
      const vw = innerWidth, vh = innerHeight;
      s = Math.max(vw / DROPS.w, vh / DROPS.h); ox = (vw - DROPS.w * s) / 2; oy = (vh - DROPS.h * s) / 2; dpr = devicePixelRatio || 1;
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      bounds.l = -ox / s; bounds.t = -oy / s; bounds.r = (vw - ox) / s; bounds.b = (vh - oy) / s; bounds.s = s;
    }
    function rasterize() {
      sheet.width = Math.ceil(1400 * s * dpr); sheet.height = Math.ceil(sheetH * s * dpr);
      sheet.getContext("2d").drawImage(image, 0, 0, sheet.width, sheet.height);
    }
    function draw() {
      const k = s * dpr, sx = sheet.width / 1400, sy = sheet.height / sheetH, ahead = spare * 60;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i], x = world.X[i] + world.VX[i] * ahead, y = world.Y[i] + world.VY[i] * ahead; // carried on past the 60 Hz step to this exact moment
        drawnX[i] = x; drawnY[i] = y;
        ctx.drawImage(sheet, c.x * sx, c.y * sy, c.w * sx, c.h * sy, (ox + (x - c.left) * s) * dpr, (oy + (y - c.top) * s) * dpr, c.w * k, c.h * k);
      }
    }
    function frame(now) {
      raf = 0;
      if (!alive) return;
      spare = Math.min(spare + (now - last) / 1000, 4 / 60); last = now;
      for (; spare >= 1 / 60; spare -= 1 / 60) { world.step(mouse, shapes, bounds); mouse.power *= 0.9; }
      let moved = 0; // a glide moving a fraction of a pixel costs no drawing
      const ahead = spare * 60;
      for (let i = 0; i < cells.length; i++) moved = Math.max(moved, Math.abs(world.X[i] + world.VX[i] * ahead - drawnX[i]), Math.abs(world.Y[i] + world.VY[i] * ahead - drawnY[i]));
      if (moved * s * dpr > 0.25) draw();
      if (world.awake() || mouse.power > 0.02 || shapes.length) raf = requestAnimationFrame(frame);
    }
    function wake() { if (alive && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    // Only the windows the text sits in push, and only when they themselves move or resize: never the text, never scrolling.
    const SELECTOR = "main,nav,aside,.dframe-sidebar,.dframe-content,.dframe-pane,.dframe-card,[data-cds=Panel],[data-cds=Dialog],[role=dialog],[data-cds-popup],[data-cds=Menu],[data-cds=Popover],[data-cds=ChatComposer]";
    const onScreen = new Set(), rects = new WeakMap();
    const watch = el => { if (!panel.contains(el)) { io.observe(el); ro.observe(el); } };
    io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) onScreen.add(e.target);
        else { onScreen.delete(e.target); rects.delete(e.target); if (!e.target.isConnected) io.unobserve(e.target); }
      }
      schedule();
    });
    function schedule() { if (alive && !timer && !document.hidden) timer = setTimeout(sample, 100); }
    function stirUp() { activeUntil = performance.now() + 1000; schedule(); } // measuring stops 1 s after the last sign of change, whatever is still animating
    function sample() {
      timer = 0;
      const now = performance.now(), gap = now - lastSample, dt = Math.min(0.3, Math.max(0.05, gap / 1000)); lastSample = now;
      const stale = gap > 500 || now - scrolledAt < 250; // after a pause the old positions say nothing about speed, and a scroll moves only content
      const moving = [], toWorld = 1 / (s * dt * 60), clip = v => Math.max(-3, Math.min(3, v));
      for (const el of onScreen) {
        if (!el.isConnected) { onScreen.delete(el); continue; }
        const r = el.getBoundingClientRect(), p = rects.get(el);
        rects.set(el, [r.left, r.top, r.right, r.bottom]);
        let dx = 0, dy = 0;
        if (p && !stale) { dx = (r.left - p[0] + r.right - p[2]) / 2; dy = (r.top - p[1] + r.bottom - p[3]) / 2; }
        if (Math.abs(dx) + Math.abs(dy) < 0.5 || moving.length >= 300) continue;
        if (el.getAnimations().some(a => a.effect && a.effect.getTiming().iterations === Infinity)) continue; // a spinner is not a push
        moving.push({ x0: (r.left - ox) / s, y0: (r.top - oy) / s, x1: (r.right - ox) / s, y1: (r.bottom - oy) / s, vx: clip(dx * toWorld), vy: clip(dy * toWorld) });
      }
      shapes = moving;
      if (moving.length) wake();
      if (now < activeUntil) schedule(); else shapes = [];
    }
    // Text sitting directly on the leaf, which drops ease away from. Found by probing a grid of points, so a huge transcript costs the same
    // as a small one, and only once the page has been quiet for a second, so nothing runs while Claude is busy loading a chat.
    const TEXT = "p,li,pre,h1,h2,h3,h4,blockquote,table";
    const ownText = el => { for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; };
    // Inside anything with a visible background the text has its own cover, so drops may rest under it. The chat column's faint wash is not a window.
    function isCovered(el, memo) {
      for (let n = el; n && n !== document.body && !n.matches("main"); n = n.parentElement) {
        let solid = memo.get(n);
        if (solid === undefined) {
          const c = getComputedStyle(n);
          solid = !/^(transparent|rgba\(\d+, \d+, \d+, 0\))$/.test(c.backgroundColor) || c.backgroundImage !== "none" || c.backdropFilter !== "none";
          memo.set(n, solid);
        }
        if (solid) return true;
      }
      return false;
    }
    function findZones() {
      zoneTimer = 0;
      if (!alive || !canvas.isConnected) return;
      const hits = new Set(), memo = new Map(), vw = innerWidth, vh = innerHeight, cols = 16, rows = 24;
      let cell = 0;
      const probe = idle => { // a few points at a time, only while Claude has nothing else to do
        zoneIdle = 0;
        if (!alive) return;
        do {
          const el = document.elementFromPoint((cell % cols + 0.5) * vw / cols, (Math.floor(cell / cols) + 0.5) * vh / rows);
          const box = el && !panel.contains(el) && !el.closest("button,[role=button]") && (el.closest(TEXT) || (ownText(el) ? el : null));
          if (box && !isCovered(box, memo)) hits.add(box);
          cell++;
        } while (cell < cols * rows && idle.timeRemaining() > 1);
        if (cell < cols * rows) { zoneIdle = requestIdleCallback(probe, { timeout: 1000 }); return; }
        const range = document.createRange(), boxes = [], gap = vh * 0.2; // the grid can land between lines, so strips of one column are joined across a few rows
        for (const el of hits) {
          // A short block is one message, whichever of its lines the grid landed on. A long one is a column, joined below.
          const up = el.parentElement, block = up && up !== document.body && !up.matches("main") && !isCovered(up, memo) ? up.getBoundingClientRect() : null;
          range.selectNodeContents(block && block.height <= vh * 0.35 && block.width <= vw * 0.6 ? up : el); // the words themselves, not the width of the pane they sit in
          const r = range.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          let z = { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
          for (let i = boxes.length - 1; i >= 0; i--) { // lines of one column become one box
            const b = boxes[i], sharedWidth = Math.min(z.x1, b.x1) - Math.max(z.x0, b.x0);
            if (sharedWidth > 0.5 * Math.min(z.x1 - z.x0, b.x1 - b.x0) && z.y0 - b.y1 < gap && b.y0 - z.y1 < gap) {
              z = { x0: Math.min(z.x0, b.x0), y0: Math.min(z.y0, b.y0), x1: Math.max(z.x1, b.x1), y1: Math.max(z.y1, b.y1) };
              boxes.splice(i, 1);
            }
          }
          boxes.push(z);
        }
        const frames = [];
        for (const el of onScreen) if (frames.length < 30 && el.isConnected && !el.matches("main,.dframe-content")) { const r = el.getBoundingClientRect(); frames.push({ x0: (r.left - ox) / s, y0: (r.top - oy) / s, x1: (r.right - ox) / s, y1: (r.bottom - oy) / s }); }
        world.setBorders(frames);
        if (world.setZones(boxes.map(z => ({ x0: (z.x0 - ox) / s, y0: (z.y0 - oy) / s, x1: (z.x1 - ox) / s, y1: (z.y1 - oy) / s })))) wake();
      };
      zoneIdle = requestIdleCallback(probe, { timeout: 1000 });
    }
    function settleZones() { clearTimeout(zoneTimer); if (zoneIdle) { cancelIdleCallback(zoneIdle); zoneIdle = 0; } zoneTimer = setTimeout(findZones, 1000); }
    ro = new ResizeObserver(stirUp);
    const scan = () => { scanTimer = 0; if (alive) for (const el of document.body.querySelectorAll(SELECTOR)) watch(el); };
    // New windows are noticed at most once a second, with no work per added node, so a chat switch or a streaming reply costs nothing here.
    mo = new MutationObserver(() => { if (!scanTimer) scanTimer = setTimeout(scan, 1000); settleZones(); });
    mo.observe(document.body, { childList: true, subtree: true });
    scan();
    addEventListener("scroll", () => { scrolledAt = performance.now(); settleZones(); }, on);
    addEventListener("transitionrun", e => { if (e.target.matches && e.target.matches(SELECTOR)) { watch(e.target); stirUp(); } }, on);
    addEventListener("animationstart", e => { if (e.target.matches && e.target.matches(SELECTOR)) { watch(e.target); stirUp(); } }, on);
    document.addEventListener("visibilitychange", () => { stirUp(); settleZones(); }, { signal: off.signal });
    addEventListener("pointermove", e => {
      const dt = Math.max(1, e.timeStamp - mt), dx = e.clientX - mx, dy = e.clientY - my, first = !mt; // only a moving mouse stirs, so a parked one lets them rest
      mx = e.clientX; my = e.clientY; mt = e.timeStamp;
      mouse.x = (mx - ox) / s; mouse.y = (my - oy) / s;
      if (first) return; // the first event only says where the cursor is
      mouse.vx = Math.max(-20, Math.min(20, dx / s / dt * 16.7)); mouse.vy = Math.max(-20, Math.min(20, dy / s / dt * 16.7));
      mouse.power = Math.max(mouse.power, Math.min(1, Math.hypot(dx, dy) / dt / 0.8));
      wake();
    }, on);
    addEventListener("resize", () => {
      clearTimeout(resizeTimer); stirUp(); settleZones();
      if (canvas.isConnected && innerWidth && innerHeight) { fit(); draw(); } // the old sheet stretches for a moment while the window drags
      resizeTimer = setTimeout(reveal, 150);
    }, on);

    // A hidden window can report no size (the helper hides Claude while it pastes): wait for a real one.
    function reveal() {
      if (!alive || !innerWidth || !innerHeight) return;
      fit(); rasterize(); draw();
      if (canvas.isConnected) return;
      html.appendChild(canvas);
      html.dataset.technozenInteractive = "on"; // the painted drops go in the same instant the live ones appear
      settleZones();
    }
    reveal();
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
    #technozen-panel .tz-live-label[data-off] { opacity: 0.5; cursor: default; }
    #technozen-panel .tz-remove { padding: 0 6px; opacity: 0.7; } #technozen-panel .tz-remove:hover { opacity: 1; }
    #technozen-panel .tz-fold { width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; background: var(--cds-fill-secondary, #0001); }
  </style>` + ORDER.map(s => `<button class="tz-swatch" data-theme="${s}" title="${THEMES[s].name}" style="background: linear-gradient(135deg, ${THEMES[s].bg} 45%, ${THEMES[s].accent} 55%)"></button>`).join("")
    + `<label title="Full skin on, or colors only"><input type="checkbox" class="tz-skin"> skin</label>`
    + `<label class="tz-live-label"><input type="checkbox" class="tz-live"> interactive</label>`
    + `<button class="tz-remove" title="Remove Technozen (Ctrl+Alt+0)">×</button><button class="tz-fold" title="Fold the panel">◐</button>`;
  if (localStorage.getItem("technozen-panel") === "folded") panel.dataset.folded = "";
  panel.onclick = e => {
    const b = e.target.closest("button, input");
    if (!b) return;
    if (b.dataset.theme) apply(b.dataset.theme);
    else if (b.classList.contains("tz-skin")) skin(b.checked);
    else if (b.classList.contains("tz-live")) { localStorage.setItem("technozen-interactive", b.checked ? "on" : "off"); sync(); }
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
    const possible = html.dataset.technozen === "take" && html.dataset.technozenSkin === "on";
    const stored = localStorage.getItem("technozen-interactive");
    const wanted = stored ? stored === "on" : !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = panel.querySelector(".tz-live"), label = panel.querySelector(".tz-live-label");
    box.disabled = !possible; box.checked = wanted;
    label.toggleAttribute("data-off", !possible);
    label.title = possible ? "Drops move with the mouse and the app, or stay painted on the leaf" : "Only the Take theme with its full skin has drops";
    if (possible && wanted) startDrops(); else stopDrops();
  }

  if (window.technozenKeys) removeEventListener("keydown", window.technozenKeys); // re-running must not stack listeners
  addEventListener("keydown", window.technozenKeys = e => {
    if (!e.ctrlKey || !e.altKey || e.shiftKey) return;
    if (e.code === "KeyT") { e.preventDefault(); apply(ORDER[(ORDER.indexOf(html.dataset.technozen) + 1) % ORDER.length]); }
    if (e.code === "KeyS") { e.preventDefault(); skin(html.dataset.technozenSkin !== "on"); }
    if (e.code === "Digit0") { e.preventDefault(); remove(); }
  });

  stopDrops(); // running the snippet again must not double anything
  window.technozen = { apply, remove, skin };
  skin(localStorage.getItem("technozen-skin") !== "off");
  apply(localStorage.getItem("technozen") || ORDER[0]);
})();
