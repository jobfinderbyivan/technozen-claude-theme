// Physics for the Take skin's water drops, with no page access. Lengths are leaf-image units, speeds are units per 1/60 s step.
// Speed limits are set for the leaf drawn at scale 1.6 (a 2560 wide window) and adjusted by bounds.s, so they hold on screen at any size.
function technozenWorld(list, W, H) {
  const REST = 102 * 60, VMAX = 1.2, VAPP = 0.35, MOUSE = 0.009, APP = 0.004, RANGE = 160, MARGIN = 30, CELL = 130, STILL = 1e-4, ENTER = 0.7;
  const DRAG = 0.02; // grows with speed, as in water: a hard push dies quickly into a long, faint glide
  const n = list.length, X = new Float64Array(n), Y = new Float64Array(n), VX = new Float64Array(n), VY = new Float64Array(n), R = new Float64Array(n), LIGHT = new Float64Array(n), inside = new Uint8Array(n);
  list.forEach((d, i) => { X[i] = d[0]; Y[i] = d[1]; R[i] = d[2]; LIGHT[i] = Math.min(4, Math.pow(50 / d[2], 1.5)); }); // big drops lean away slowly
  const cols = Math.ceil((W + 1200) / CELL), rows = Math.ceil((H + 1200) / CELL), head = new Int32Array(cols * rows), next = new Int32Array(n);
  const painted = new Map(); // overlaps painted into the leaf hold no energy: only overlap beyond these pushes, and they shrink as drops part
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const o = R[i] + R[j] - Math.hypot(X[i] - X[j], Y[i] - Y[j]);
    if (o > 0) painted.set(i * n + j, o);
  }
  let idle = REST, seed = 12345;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  // A drop pushed fully off the window is gone. It comes back from a different edge, where there is the most free room,
  // with the same long glide as any other push.
  function respawn(i, exit, bounds, k) {
    const out = R[i] * 1.5, into = R[i] * 2.5;
    let best = -Infinity, edge = 0, along = 0;
    for (let e = 0; e < 4; e++) {
      if (e === exit) continue;
      for (let c = 0; c < 12; c++) {
        const a = 0.1 + 0.8 * (c + random()) / 12; // away from the corners, where it would slide along the edge and out again
        const x = e === 0 ? bounds.l + into : e === 1 ? bounds.r - into : bounds.l + a * (bounds.r - bounds.l);
        const y = e === 2 ? bounds.t + into : e === 3 ? bounds.b - into : bounds.t + a * (bounds.b - bounds.t);
        let room = Infinity;
        for (let j = 0; j < n; j++) if (j !== i) room = Math.min(room, Math.hypot(X[j] - x, Y[j] - y) - R[j] - R[i]);
        if (room > best) { best = room; edge = e; along = a; }
      }
    }
    X[i] = edge === 0 ? bounds.l - out : edge === 1 ? bounds.r + out : bounds.l + along * (bounds.r - bounds.l);
    Y[i] = edge === 2 ? bounds.t - out : edge === 3 ? bounds.b + out : bounds.t + along * (bounds.b - bounds.t);
    const speed = ENTER * k, drift = (random() - 0.5) * 0.2 * k;
    VX[i] = edge === 0 ? speed : edge === 1 ? -speed : drift;
    VY[i] = edge === 2 ? speed : edge === 3 ? -speed : drift;
    inside[i] = 2; // on its way in
    for (const key of painted.keys()) if (Math.floor(key / n) === i || key % n === i) painted.delete(key);
    idle = 0;
  }

  function contacts(vapp) {
    head.fill(-1);
    for (let i = 0; i < n; i++) {
      const c = Math.max(0, Math.min(cols - 1, Math.floor((X[i] + 600) / CELL))) + Math.max(0, Math.min(rows - 1, Math.floor((Y[i] + 600) / CELL))) * cols;
      next[i] = head[c]; head[c] = i;
    }
    const nudge = (i, ax, ay) => { // a touch never raises a drop past the app's gentle speed
      const before = Math.hypot(VX[i], VY[i]);
      VX[i] += ax; VY[i] += ay;
      const limit = Math.max(before, vapp), now = Math.hypot(VX[i], VY[i]);
      if (now > limit) { VX[i] *= limit / now; VY[i] *= limit / now; }
    };
    const moves = i => VX[i] * VX[i] + VY[i] * VY[i] > STILL * STILL;
    for (let i = 0; i < n; i++) {
      if (!moves(i)) continue; // only a moving drop touches anything; a pair that both move is handled once
      const cx = Math.max(0, Math.min(cols - 1, Math.floor((X[i] + 600) / CELL))), cy = Math.max(0, Math.min(rows - 1, Math.floor((Y[i] + 600) / CELL)));
      for (let gy = Math.max(0, cy - 1); gy <= Math.min(rows - 1, cy + 1); gy++)
        for (let gx = Math.max(0, cx - 1); gx <= Math.min(cols - 1, cx + 1); gx++)
          for (let j = head[gx + gy * cols]; j >= 0; j = next[j]) {
            if (j === i || (j < i && moves(j))) continue;
            const a = Math.min(i, j), b = Math.max(i, j), dx = X[b] - X[a], dy = Y[b] - Y[a], d = Math.max(0.01, Math.hypot(dx, dy));
            let overlap = R[a] + R[b] - d;
            if (overlap <= 0) { painted.delete(a * n + b); continue; }
            const base = painted.get(a * n + b);
            if (base !== undefined) { if (overlap < base) painted.set(a * n + b, overlap); overlap -= base; }
            if (overlap <= 0) continue;
            const f = Math.min(0.01, 0.002 * overlap), ma = R[a] ** 3, mb = R[b] ** 3, sa = 2 * mb / (ma + mb), sb = 2 * ma / (ma + mb);
            nudge(a, -dx / d * f * sa, -dy / d * f * sa); nudge(b, dx / d * f * sb, dy / d * f * sb);
          }
    }
  }

  // mouse: {x, y, vx, vy, power 0..1}. shapes: moving parts of the app, {x0, y0, x1, y1, vx, vy}. bounds: {l, t, r, b, s}, the window and the leaf's scale.
  // No shape is ever a wall: it only adds a soft push while it moves, so a drop can always pass through it.
  function step(mouse, shapes, bounds) {
    const k = 1.6 / (bounds.s || 1.6), vmax = VMAX * k, vapp = VAPP * k;
    const known = mouse && mouse.x > -1e5, stirring = known && mouse.power > 0.02;
    let pushed = false;
    for (let i = 0; i < n; i++) {
      let near = 0; // how much the cursor claims this drop, moving or parked: the mouse has priority over the app
      if (known) {
        const dx = X[i] - mouse.x, dy = Y[i] - mouse.y, d = Math.max(0.01, Math.hypot(dx, dy)), gap = Math.max(0, d - R[i]);
        if (gap < RANGE) {
          near = 1 - gap / RANGE;
          if (stirring) {
            const f = MOUSE * k * LIGHT[i] * mouse.power * near * near;
            VX[i] += dx / d * f + mouse.vx * f * 0.01; VY[i] += dy / d * f + mouse.vy * f * 0.01;
            pushed = true;
          }
        }
      }
      // Nested elements are often the same text: only the strongest shape in reach pushes, so they never add up.
      let best = 0, bx = 0, by = 0;
      if (Math.hypot(VX[i], VY[i]) < vapp && near < 1) for (const s of shapes) {
        const nx = Math.max(s.x0, Math.min(s.x1, X[i])), ny = Math.max(s.y0, Math.min(s.y1, Y[i])), dist = Math.hypot(X[i] - nx, Y[i] - ny), reach = MARGIN + R[i];
        if (dist >= reach) continue;
        const f = APP * k * LIGHT[i] * (1 - dist / reach), side = (X[i] - (s.x0 + s.x1) / 2) * -s.vy + (Y[i] - (s.y0 + s.y1) / 2) * s.vx >= 0 ? 1 : -1; // and aside, out of its way
        const ax = (s.vx - s.vy * side * 0.5) * f, ay = (s.vy + s.vx * side * 0.5) * f, strength = ax * ax + ay * ay;
        if (strength > best) { best = strength; bx = ax; by = ay; } // a still shape has zero strength: a still app pushes nothing
      }
      if (best > 0) {
        VX[i] += bx * (1 - near); VY[i] += by * (1 - near);
        const over = Math.hypot(VX[i], VY[i]) / vapp;
        if (over > 1) { VX[i] /= over; VY[i] /= over; }
        pushed = true;
      }
    }
    for (const s of shapes) { s.x0 += s.vx; s.x1 += s.vx; s.y0 += s.vy; s.y1 += s.vy; }
    if (pushed) idle = 0;
    else if (idle >= REST) return;
    else idle++;
    if (idle >= REST) { VX.fill(0); VY.fill(0); return; } // exactly at rest, 102 s after the last push
    contacts(vapp);
    const left = 1 - idle / REST, cap = vmax * left * left; // smooth to the end, no visible stop
    for (let i = 0; i < n; i++) {
      let v = Math.hypot(VX[i], VY[i]);
      const slow = Math.min(1 - DRAG * v / k, v > cap ? cap / v : 1);
      VX[i] *= slow; VY[i] *= slow; v *= slow;
      if (v <= STILL) continue;
      X[i] += VX[i]; Y[i] += VY[i];
      if (X[i] > bounds.l && X[i] < bounds.r && Y[i] > bounds.t && Y[i] < bounds.b) inside[i] = 1;
      if (!inside[i]) continue; // a drop the window's crop has always hidden stays out of view, it is not pulled in
      const gone = R[i] * 1.5 + 2; // shadow included
      const exit = X[i] < bounds.l - gone ? 0 : X[i] > bounds.r + gone ? 1 : Y[i] < bounds.t - gone ? 2 : Y[i] > bounds.b + gone ? 3 : -1;
      if (exit >= 0) respawn(i, exit, bounds, k);
    }
  }

  return { X, Y, VX, VY, R, REST, VMAX, VAPP, step, awake: () => idle < REST };
}
if (typeof module !== "undefined") module.exports = technozenWorld;
