// Physics for the Take skin's water drops, with no page access. Lengths are leaf-image units, speeds are units per 1/60 s step.
// Speed limits are set for the leaf drawn at scale 1.6 (a 2560 wide window) and adjusted by bounds.s, so they hold on screen at any size.
function technozenWorld(list, W, H, lift) {
  const REST = 102 * 60, VMAX = 1.2, VAPP = 0.25, MOUSE = 0.009, APP = 0.001, RANGE = 160, MARGIN = 30, CELL = 130, STILL = 1e-4, ENTER = 0.7, VZONE = 0.12, ZONE = 0.0012, RAMP = 120, LONG = 150, TINY = 3, SHRINK = Math.pow(0.9, 1 / 120), DEEP = 12, LEAVE = 0.5, EDGE = 0.995, DRIFT = 300 * 60, DRIFT_REACH = 380, DRIFT_SHARE = 0.7, VHULL = 0.7, HULL = 30, HULL_AGAIN = 90;
  const DRAG = 0.02; // grows with speed, as in water: a hard push dies quickly into a long, faint glide
  const n = list.length, X = new Float64Array(n), Y = new Float64Array(n), VX = new Float64Array(n), VY = new Float64Array(n), R = new Float64Array(n), LIGHT = new Float64Array(n), inside = new Uint8Array(n);
  list.forEach((d, i) => { X[i] = d[0]; Y[i] = d[1]; R[i] = d[2]; LIGHT[i] = Math.max(1.15, Math.min(4, Math.pow(50 / d[2], 1.5))); }); // big drops lean away more slowly, but not much
  const cols = Math.ceil((W + 1200) / CELL), rows = Math.ceil((H + 1200) / CELL), head = new Int32Array(cols * rows), next = new Int32Array(n);
  const painted = new Map(); // overlaps painted into the leaf hold no energy: only overlap beyond these pushes, and they shrink as drops part
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const o = R[i] + R[j] - Math.hypot(X[i] - X[j], Y[i] - Y[j]);
    if (o > 0) painted.set(i * n + j, o);
  }
  const clock = new Int32Array(n).fill(REST); // steps since each drop's own last push: one drop arriving must not keep the rest moving
  let seed = 12345, zones = [], borders = [], covers = [], drift = [], driftT = 0, pops = [], splashes = [];
  const lightness = r => Math.max(1.15, Math.min(4, Math.pow(50 / r, 1.5))); // big drops lean away more slowly, but not much

  // Past the tiniest size a drop pops. It stays in the lists with no size and far out of the way until it is brought back.
  function pop(i) {
    pops.push({ x: X[i], y: Y[i], r: R[i] });
    X[i] = Y[i] = -1e5; R[i] = 0; VX[i] = VY[i] = 0; clock[i] = REST; inside[i] = 0; easing[i] = 0; within[i] = 0; hull[i] = 0;
  }
  function revive(i, bounds) { // back at full size from outside the window, with the usual long glide in
    R[i] = list[i][2]; LIGHT[i] = lightness(R[i]);
    respawn(i, -1, bounds, 1.6 / (bounds.s || 1.6));
  }

  // The idle process. Once everything is at rest, 70% of the drops on view set off in one direction each, in a straight line, over 5 minutes,
  // placed rather than pushed, peaking near 2 px/s, too slowly to see. They all travel alike; only the direction differs, the roomiest of many random ones, so the gaps fill.
  function planDrift(bounds) {
    const k = bounds.s || 1.6, reach = DRIFT_REACH / k, inRect = (x, y, r, z) => x + r > z.x0 && x - r < z.x1 && y + r > z.y0 && y - r < z.y1;
    const shown = []; for (let i = 0; i < n; i++) if (R[i] > 0 && X[i] > bounds.l && X[i] < bounds.r && Y[i] > bounds.t && Y[i] < bounds.b) shown.push(i);
    for (let i = shown.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)), t = shown[i]; shown[i] = shown[j]; shown[j] = t; }
    const moving = shown.slice(0, Math.ceil(shown.length * DRIFT_SHARE)), leaving = new Uint8Array(n);
    for (const i of moving) leaving[i] = 1;
    const toX = Float64Array.from(X), toY = Float64Array.from(Y);
    drift = []; driftT = 0;
    for (const i of moving) {
      let best = -Infinity, bx = 0, by = 0;
      for (let d = reach; best === -Infinity && d > reach / 8; d /= 2) for (let tries = 0; tries < 48; tries++) { // the full distance, unless a tight spot allows only less
        const a = random() * 6.283, x = X[i] + Math.cos(a) * d, y = Y[i] + Math.sin(a) * d;
        if (x < bounds.l + R[i] || x > bounds.r - R[i] || y < bounds.t + R[i] || y > bounds.b - R[i]) continue;
        if (zones.some(z => inRect(x, y, R[i], z)) || covers.some(z => inRect(x, y, R[i], z))) continue; // open leaf only
        let room = Infinity;
        for (let j = 0; j < n && room > best; j++) if (j !== i && !leaving[j] && R[j] > 0) room = Math.min(room, Math.hypot(toX[j] - x, toY[j] - y) - R[j] - R[i]);
        if (room > best) { best = room; bx = x; by = y; }
      }
      leaving[i] = 0;
      if (best === -Infinity) continue;
      toX[i] = bx; toY[i] = by;
      drift.push({ i, x0: X[i], y0: Y[i], x1: bx, y1: by });
    }
    return drift.length;
  }
  function driftStep(steps) { // returns whether there is more to do
    driftT += steps;
    const u = Math.min(1, driftT / DRIFT), e = u * u * (3 - 2 * u);
    drift = drift.filter(d => clock[d.i] >= REST); // a drop the mouse or the app has touched goes back to ordinary physics
    for (const d of drift) { X[d.i] = d.x0 + (d.x1 - d.x0) * e; Y[d.i] = d.y0 + (d.y1 - d.y0) * e; }
    if (u >= 1) drift = [];
    return drift.length > 0;
  }
  const within = new Uint8Array(n), easing = new Float64Array(n), hull = new Int32Array(n), HX = new Float64Array(n), HY = new Float64Array(n);
  const inZone = (i, z) => X[i] + R[i] > z.x0 && X[i] - R[i] < z.x1 && Y[i] + R[i] > z.y0 && Y[i] - R[i] < z.y1;

  function exitFrom(i, z, bounds) { // the nearest side of a box that leaves the drop on screen: [room, distance, x, y], or null
    const sides = [[z.x0 - R[i] - bounds.l, X[i] - z.x0 + R[i], -1, 0], [bounds.r - z.x1 - R[i], z.x1 - X[i] + R[i], 1, 0], [z.y0 - R[i] - bounds.t, Y[i] - z.y0 + R[i], 0, -1], [bounds.b - z.y1 - R[i], z.y1 - Y[i] + R[i], 0, 1]];
    let way = null;
    for (const side of sides) if (side[0] >= 0 && (!way || side[1] < way[1])) way = side;
    return way;
  }
  // Text landing on a drop, as a hull meets a bubble on water: pushed out by the nearest side and fanned away from the middle like a bow wave.
  // The push builds over half a second, then quadratic drag turns it into the long glide. Big drops are heavier.
  function launch(i, z, bounds) {
    const way = exitFrom(i, z, bounds), cx = (z.x0 + z.x1) / 2, cy = (z.y0 + z.y1) / 2, fan = (d, half) => 0.4 * Math.max(-1, Math.min(1, d / Math.max(1, half)));
    const ux = way ? way[2] || fan(X[i] - cx, (z.x1 - z.x0) / 2) : X[i] - cx, uy = way ? way[3] || fan(Y[i] - cy, (z.y1 - z.y0) / 2) : Y[i] - cy, len = Math.max(0.01, Math.hypot(ux, uy));
    const a = VHULL * (1.6 / (bounds.s || 1.6)) * Math.min(1, LIGHT[i] / 2.5) / HULL / len;
    HX[i] = ux * a; HY[i] = uy * a; hull[i] = HULL;
    splashes.push({ x: X[i], y: Y[i], r: R[i] });
  }

  // Text boxes and panels drops should ease out of, {x0, y0, x1, y1}. Only a drop newly caught inside one starts the 102 s,
  // so a box that keeps changing, or a drop with nowhere to go, can never keep them moving. Returns whether they woke.
  // With hullBounds, a newly caught drop also gets a splash, unless it has only just been pushed by anything, so the mouse keeps priority.
  function setZones(next, hullBounds) {
    const before = zones;
    zones = next;
    const deep = (i, z) => X[i] + R[i] - DEEP > z.x0 && X[i] - R[i] + DEEP < z.x1 && Y[i] + R[i] - DEEP > z.y0 && Y[i] - R[i] + DEEP < z.y1;
    let woke = false;
    for (let i = 0; i < n; i++) {
      // A real overlap, so a box shifting a little does not wake a drop resting just clear of it.
      const caught = zones.find(z => deep(i, z));
      if (caught && !within[i]) { if (hullBounds && clock[i] > HULL_AGAIN && !before.some(z => deep(i, z))) launch(i, caught, hullBounds); woke = true; clock[i] = 0; } // text already there did not land: the drop glided under it
      within[i] = caught ? 1 : 0;
    }
    return woke;
  }
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
        for (const z of zones) if (x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1) room -= 1e4; // not into a text box
        if (room > best) { best = room; edge = e; along = a; }
      }
    }
    X[i] = edge === 0 ? bounds.l - out : edge === 1 ? bounds.r + out : bounds.l + along * (bounds.r - bounds.l);
    Y[i] = edge === 2 ? bounds.t - out : edge === 3 ? bounds.b + out : bounds.t + along * (bounds.b - bounds.t);
    const speed = ENTER * k, drift = (random() - 0.5) * 0.2 * k;
    VX[i] = edge === 0 ? speed : edge === 1 ? -speed : drift;
    VY[i] = edge === 2 ? speed : edge === 3 ? -speed : drift;
    inside[i] = 2; // on its way in
    hull[i] = 0;
    for (const key of painted.keys()) if (Math.floor(key / n) === i || key % n === i) painted.delete(key);
    clock[i] = 0;
  }

  function contacts(vapp) {
    head.fill(-1);
    for (let i = 0; i < n; i++) {
      const c = Math.max(0, Math.min(cols - 1, Math.floor((X[i] + 600) / CELL))) + Math.max(0, Math.min(rows - 1, Math.floor((Y[i] + 600) / CELL))) * cols;
      next[i] = head[c]; head[c] = i;
    }
    const nudge = (i, ax, ay, other) => { // a touch never raises a drop past the app's gentle speed
      if (clock[i] >= REST) { // a drop at rest only wakes to a real knock
        if (Math.hypot(VX[other], VY[other]) < 0.05) return;
        clock[i] = 0;
      }
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
            nudge(a, -dx / d * f * sa, -dy / d * f * sa, b); nudge(b, dx / d * f * sb, dy / d * f * sb, a);
          }
    }
  }

  // mouse: {x, y, vx, vy, power 0..1}. shapes: moving parts of the app, {x0, y0, x1, y1, vx, vy}. bounds: {l, t, r, b, s}, the window and the leaf's scale.
  // No shape is ever a wall: it only adds a soft push while it moves, so a drop can always pass through it.
  function step(mouse, shapes, bounds) {
    const k = 1.6 / (bounds.s || 1.6), vmax = VMAX * k, vapp = VAPP * k;
    const known = mouse && mouse.x > -1e5, stirring = known && mouse.power > 0.02;
    for (let i = 0; i < n; i++) {
      let near = 0; // how much the cursor claims this drop, moving or parked: the mouse has priority over the app
      if (known) {
        const dx = X[i] - mouse.x, dy = Y[i] - mouse.y, d = Math.max(0.01, Math.hypot(dx, dy)), gap = Math.max(0, d - R[i]);
        if (gap < RANGE) {
          near = 1 - gap / RANGE;
          if (stirring) {
            const f = MOUSE * k * LIGHT[i] * mouse.power * near * near;
            VX[i] += dx / d * f + mouse.vx * f * 0.01; VY[i] += dy / d * f + mouse.vy * f * 0.01;
            clock[i] = -1;
            hull[i] = 0; // the mouse takes over from a splash at once
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
        clock[i] = -1;
      }
    }
    for (const s of shapes) { s.x0 += s.vx; s.x1 += s.vx; s.y0 += s.vy; s.y1 += s.vy; }
    let any = false;
    for (let i = 0; i < n; i++) {
      if (clock[i] >= REST) continue;
      if (++clock[i] >= REST) { VX[i] = 0; VY[i] = 0; } else any = true; // exactly at rest, 102 s after its last push
    }
    if (!any) return;
    contacts(vapp);
    // Ease out of any text box by its nearest side that stays on screen. No wall: the mouse can still push a drop back through.
    if (zones.length) for (let i = 0; i < n; i++) {
      if (clock[i] >= REST) continue;
      let held = false;
      for (const z of zones) {
        if (!inZone(i, z)) continue;
        held = true;
        const way = exitFrom(i, z, bounds);
        if (!way || way[1] > LONG) { // a long way out from under the text: it shrinks 10% every 2 s as it goes, and past the tiniest size it pops
          R[i] *= SHRINK; LIGHT[i] = lightness(R[i]);
          if (R[i] < TINY) { pop(i); break; }
        }
        if (!way) break; // nowhere to go
        easing[i] = Math.min(1, easing[i] + 1 / RAMP);
        const ramp = easing[i]; // starts from nothing and builds over 2 s, so a box appearing never jolts a drop
        if (Math.hypot(VX[i], VY[i]) >= VZONE * k * ramp) break; // only ever adds a little speed, and never brakes a drop already moving
        let cursor = 0;
        if (known) cursor = Math.max(0, 1 - Math.max(0, Math.hypot(X[i] - mouse.x, Y[i] - mouse.y) - R[i]) / RANGE);
        const f = ZONE * k * LIGHT[i] * (1 - cursor) * ramp;
        VX[i] += way[2] * f; VY[i] += way[3] * f;
        break;
      }
      if (!held) easing[i] = 0;
    }
    for (let i = 0; i < n; i++) {
      if (clock[i] >= REST) continue;
      if (hull[i]) { hull[i]--; VX[i] += HX[i]; VY[i] += HY[i]; }
      if (lift) VY[i] -= lift * k; // only while moving, so it still comes to rest
      const left = 1 - clock[i] / REST, cap = vmax * left * left; // smooth to the end, no visible stop
      let v = Math.hypot(VX[i], VY[i]);
      const slow = Math.min(1 - DRAG * v / k, v > cap ? cap / v : 1);
      VX[i] *= slow; VY[i] *= slow; v *= slow;
      if (inside[i] === 1) { // more than 60% past the window's edge: it goes the rest of the way, whatever its speed, and comes back elsewhere
        const dl = bounds.l - X[i], dr = X[i] - bounds.r, dt = bounds.t - Y[i], db = Y[i] - bounds.b, far = Math.max(dl, dr, dt, db);
        if (far > 0.2 * R[i]) {
          X[i] += far === dl ? -LEAVE * k : far === dr ? LEAVE * k : 0; Y[i] += far === dt ? -LEAVE * k : far === db ? LEAVE * k : 0;
          clock[i] = Math.min(clock[i], REST - 300); // it finishes leaving before it rests
          const edgeGap = R[i] * 1.5 + 2;
          if (far > edgeGap) { respawn(i, far === dl ? 0 : far === dr ? 1 : far === dt ? 2 : 3, bounds, k); }
          continue;
        }
      }
      if (v > STILL) for (const b of borders) { // a window's edge is only a little harder to cross
        const r = R[i], rowOn = Y[i] > b.y0 - r && Y[i] < b.y1 + r, columnOn = X[i] > b.x0 - r && X[i] < b.x1 + r;
        if ((rowOn && (Math.abs(X[i] - b.x0) < r || Math.abs(X[i] - b.x1) < r)) || (columnOn && (Math.abs(Y[i] - b.y0) < r || Math.abs(Y[i] - b.y1) < r))) { VX[i] *= EDGE; VY[i] *= EDGE; v *= EDGE; break; }
      }
      if (v <= STILL) continue;
      X[i] += VX[i]; Y[i] += VY[i];
      if (X[i] > bounds.l && X[i] < bounds.r && Y[i] > bounds.t && Y[i] < bounds.b) inside[i] = 1;
      if (!inside[i]) continue; // a drop the window's crop has always hidden stays out of view, it is not pulled in
      const gone = R[i] * 1.5 + 2; // shadow included
      const exit = X[i] < bounds.l - gone ? 0 : X[i] > bounds.r + gone ? 1 : Y[i] < bounds.t - gone ? 2 : Y[i] > bounds.b + gone ? 3 : -1;
      if (exit >= 0) respawn(i, exit, bounds, k);
    }
  }

  return { X, Y, VX, VY, R, REST, VMAX, VAPP, VZONE, step, setZones, setBorders: next => { borders = next; }, setCovers: next => { covers = next; }, planDrift, driftStep, DRIFT, revive, takePops: () => { const p = pops; pops = []; return p; }, takeSplashes: () => { const p = splashes; splashes = []; return p; }, awake: () => clock.some(c => c < REST) };
}

// Zen Click: the start-up card's scale and bell, one bell per click. A click while another still rings takes a note that sounds well with it (never a second or a seventh).
const BELL_SCALE = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3], BELL_SWEET = [6 / 5, 5 / 4, 4 / 3, 3 / 2, 8 / 5, 5 / 3, 2, 5 / 2, 8 / 3, 3];
function technozenBellNote(last, ringing, rnd) {
  const sweet = (a, b) => { const r = Math.max(a, b) / Math.min(a, b); return BELL_SWEET.some(x => Math.abs(x - r) < 0.001); };
  const notes = BELL_SCALE.map((_, i) => i).filter(i => i !== last && (!ringing || sweet(BELL_SCALE[i], BELL_SCALE[last])));
  return notes[Math.floor(rnd() * notes.length)];
}
// level 0..1 sets both loudness and length. Returns ring(level, time, together), which returns when the last bell ends. together makes a beat however long ago the last bell rang.
// A lone bell is the same in both ears. A second click while it rings makes a true binaural beat: 4 to 7 Hz between the ears in the new bell,
// the ringing bell's right ear glides to the same split, and both last 35% longer. Left and right never mix, so the beat exists only in the listener's head.
function technozenBells(ctx) {
  const RATIO = [1, 2, 2.76, 4.07], AMP = [1, 0.5, 0.25, 0.12], TAU = [2, 1.4, 0.9, 0.6], LONGER = 1.35, MAX = 12, base = 180 + Math.random() * 40;
  const out = ctx.createDynamicsCompressor(); // many clicks at once must never distort
  out.threshold.value = -9; out.knee.value = 6; out.ratio.value = 20; out.attack.value = 0.002; out.release.value = 0.25;
  const trim = ctx.createGain(); trim.gain.value = 0.9; // the compressor can overshoot a little on a sudden hit
  out.connect(trim); trim.connect(ctx.destination);
  let last = -1, ringsUntil = -1e9, rung = [];
  const stopAt = (b, t) => { b.end = t; for (const p of b.parts) { p.l.stop(t); p.r.stop(t); } };
  const fade = (b, t, length) => { b.parts.forEach((p, k) => { p.gain.gain.cancelAndHoldAtTime(t); p.gain.gain.setTargetAtTime(0, t, TAU[k] * length); }); };
  return (level, t, together) => {
    const ringing = together || t < ringsUntil, note = technozenBellNote(last, ringing, Math.random), beat = ringing ? 4 + Math.random() * 3 : 0;
    const f = base * BELL_SCALE[note], loud = (0.02 + 0.6 * level * level) / 1.87, length = (0.4 + 1.2 * level) * (ringing ? LONGER : 1);
    rung = rung.filter(b => b.end > t);
    if (ringing) for (const b of rung) if (!b.split) {
      b.split = true; b.length *= LONGER;
      b.parts.forEach((p, k) => p.r.frequency.setTargetAtTime(b.f * RATIO[k] + beat, t, 0.05));
      fade(b, t, b.length); stopAt(b, t + 6 * 2 * b.length);
    }
    if (rung.length >= MAX) { const b = rung.shift(); fade(b, t, 0.02 / 2); stopAt(b, t + 0.1); }
    const b = { f, split: ringing, length, end: 0, parts: RATIO.map((ratio, k) => {
      const l = ctx.createOscillator(), r = ctx.createOscillator(), join = ctx.createChannelMerger(2), gain = ctx.createGain();
      l.frequency.value = f * ratio; r.frequency.value = f * ratio + beat;
      l.connect(join, 0, 0); r.connect(join, 0, 1); join.connect(gain); gain.connect(out);
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(AMP[k] * loud, t + 0.015); gain.gain.setTargetAtTime(0, t + 0.015, TAU[k] * length);
      l.start(t); r.start(t);
      return { l, r, gain };
    }) };
    stopAt(b, t + 6 * 2 * length);
    rung.push(b); last = note; ringsUntil = Math.max(ringsUntil, t + 4.6 * length); // until it is 20 dB down
    return Math.max(...rung.map(x => x.end));
  };
}

// The mindfulness bell. Seconds between a double bell's two bells, close together to lengthily apart. "random" or "0" to "4".
const BELL_GAPS = [0.12, 0.35, 0.9, 2.2, 5];
const technozenBellGap = (gap, rnd) => BELL_GAPS[gap === "random" ? Math.floor(rnd() * BELL_GAPS.length) : Number(gap)];
// mind: {every: minutes or 0, next: ms, zen: "off" | "random" | "daily", at: "HH:MM", gap, done: which daily bell has rung}. Returns null or {gap}, gap only on a double bell.
// A bell more than 2 minutes late is skipped, so a PC waking from sleep does not ring one for the hours it missed.
function technozenMindDue(mind, now, rnd) {
  const LATE = 120000, ms = now.getTime();
  let bell = null;
  if (mind.every > 0 && ms >= mind.next) {
    const onTime = ms - mind.next < LATE;
    if (onTime) bell = mind.zen === "random" && rnd() < 0.2 ? { gap: technozenBellGap(mind.gap, rnd) } : {};
    mind.next = (onTime ? mind.next : ms) + mind.every * 60000; // from when it was due, so a late tick never pushes the rest back
  }
  if (mind.zen === "daily") {
    const [h, m] = mind.at.split(":").map(Number), at = new Date(now), key = now.toDateString() + " " + mind.at;
    at.setHours(h, m, 0, 0);
    if (ms >= at.getTime() && ms - at.getTime() < LATE && mind.done !== key) { mind.done = key; bell = { gap: technozenBellGap(mind.gap, rnd) }; } // shortcut: a bell at 23:59 delayed past midnight is missed, at most once and only if the page is throttled
  }
  return bell;
}
if (typeof module !== "undefined") { module.exports = technozenWorld; module.exports.bellNote = technozenBellNote; module.exports.BELL_SCALE = BELL_SCALE; module.exports.bellGap = technozenBellGap; module.exports.BELL_GAPS = BELL_GAPS; module.exports.mindDue = technozenMindDue; }
