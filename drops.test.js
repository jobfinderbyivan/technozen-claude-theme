// Run by test.py with node. Proves the owner's rules for the drops' physics.
const assert = require("assert");
const world = require("./drops.js");
const spec = JSON.parse(process.argv[2] ? require("fs").readFileSync(process.argv[2], "utf8") : '{"drops":[]}');
const W = 1600, H = 1000, BOUNDS = { l: 0, t: 0, r: W, b: H };
const one = (r = 20) => world([[800, 500, r]], W, H);
const speed = (w, i = 0) => Math.hypot(w.VX[i], w.VY[i]);
const stir = (x, y, power = 1, vx = 0, vy = 0) => ({ x, y, vx, vy, power });
const NONE = stir(-1e6, -1e6, 0);

{ // At rest there is no motion at all, and the overlaps painted into the leaf do not move by themselves.
  const w = world([[800, 500, 40], [820, 500, 40]], W, H);
  assert(!w.awake(), "starts asleep");
  for (let t = 0; t < 600; t++) w.step(NONE, [], BOUNDS);
  assert(w.X[0] === 800 && w.X[1] === 820, "overlapping drops stay put until disturbed");
}
{ // Every drop stops exactly 102 s after the last push, still gliding the step before.
  const w = one();
  for (let t = 0; t < 60; t++) w.step(stir(770, 500), [], BOUNDS);
  assert(w.awake() && speed(w) > 0, "the mouse moved it");
  for (let t = 0; t < w.REST - 1; t++) w.step(NONE, [], BOUNDS);
  assert(w.awake() && speed(w) > 0, "still moving just before 102 s");
  w.step(NONE, [], BOUNDS);
  assert(!w.awake() && speed(w) === 0, "exactly zero at 102 s");
  const x = w.X[0]; w.step(NONE, [], BOUNDS); assert(w.X[0] === x, "stays at rest");
}
{ // The slowdown never jumps: speed falls smoothly to the very end.
  const w = one();
  for (let t = 0; t < 120; t++) w.step(stir(770, 500), [], BOUNDS);
  let last = speed(w), worst = 0, x0 = w.X[0], at60 = 0;
  for (let t = 0; t < w.REST; t++) { w.step(NONE, [], BOUNDS); if (t > 600) worst = Math.max(worst, last - speed(w)); last = speed(w); if (t === 3600) at60 = speed(w); }
  assert(worst < 0.001, "largest speed drop in one step: " + worst);
  assert(at60 > 0.005, "still visibly gliding after a minute: " + at60);
  assert(w.X[0] - x0 < 400, "a hard push is gentle, it slides " + (w.X[0] - x0));
}
{ // A new push restarts the 102 s.
  const w = one();
  w.step(stir(770, 500), [], BOUNDS);
  for (let t = 0; t < w.REST - 10; t++) w.step(NONE, [], BOUNDS);
  w.step(stir(w.X[0] - 30, w.Y[0]), [], BOUNDS);
  for (let t = 0; t < w.REST - 1; t++) w.step(NONE, [], BOUNDS);
  assert(w.awake(), "the second push restarted the clock");
}
{ // A still app pushes nothing.
  const w = one();
  for (let t = 0; t < 300; t++) w.step(NONE, [{ x0: 700, y0: 450, x1: 900, y1: 550, vx: 0, vy: 0 }], BOUNDS);
  assert(w.X[0] === 800 && !w.awake(), "no force from a shape that is not moving");
}
{ // Moving text sweeps a drop along and aside, gently, up to the app's lower speed.
  const w = one();
  const text = { x0: 700, y0: 400, x1: 900, y1: 600, vx: 0, vy: -3 };
  for (let t = 0; t < 30; t++) w.step(NONE, [text], BOUNDS);
  assert(w.Y[0] < 500, "scrolling up carries the drop up");
  assert(w.X[0] !== 800, "and pushes it aside");
  assert(speed(w) <= w.VAPP * 1.2, "gently: " + speed(w));
}
{ // The mouse has priority: stronger than any part of the app, and it wins where both act.
  const a = one(), b = one(), both = one();
  const text = () => ({ x0: 700, y0: 400, x1: 900, y1: 600, vx: 0, vy: -3 });
  for (let t = 0; t < 40; t++) { a.step(stir(800, 470), [], BOUNDS); b.step(NONE, [text()], BOUNDS); both.step(stir(800, 470), [text()], BOUNDS); }
  assert(speed(a) > 2 * speed(b), "mouse " + speed(a) + " against app " + speed(b));
  assert(both.Y[0] > 500, "pushed down by the mouse against text scrolling up");
}
{ // Speed limits hold on screen at any window size, and even the fastest swipe eases in.
  for (const s of [1.6, 2.4, 1]) {
    const w = one(5), b = { ...BOUNDS, s }, px = v => v * s * 60;
    let top = 0, steps = 0;
    for (let t = 0; t < 400; t++) { w.step(stir(w.X[0] - 6, w.Y[0], 1, 20, 0), [], b); top = Math.max(top, px(speed(w))); if (px(speed(w)) < 40) steps = t + 1; }
    assert(top <= 120, "top speed at scale " + s + ": " + top.toFixed(0) + " px/s");
    assert(steps >= 8, "reached 40 px/s after only " + steps + " steps at scale " + s);
  }
}
{ // A parked cursor pushes nothing, and still claims the drops beside it from the app.
  const parked = one(), free = one(), text = () => ({ x0: 700, y0: 400, x1: 900, y1: 600, vx: 0, vy: -3 });
  for (let t = 0; t < 120; t++) { parked.step(stir(800, 470, 0), [text()], BOUNDS); free.step(NONE, [text()], BOUNDS); }
  assert(Math.abs(parked.Y[0] - 500) < Math.abs(free.Y[0] - 500), "parked cursor did not reduce the app's push");
  const alone = one();
  for (let t = 0; t < 300; t++) alone.step(stir(780, 500, 0), [], BOUNDS);
  assert(alone.X[0] === 800 && !alone.awake(), "a parked cursor let the drop rest");
}
{ // Nested elements over one drop push no harder than one element.
  const once = one(), nested = one(), shape = () => ({ x0: 700, y0: 400, x1: 900, y1: 600, vx: 0, vy: -1 });
  for (let t = 0; t < 3; t++) { once.step(NONE, [shape()], BOUNDS); nested.step(NONE, [shape(), shape(), shape(), shape()], BOUNDS); }
  assert(Math.abs(once.Y[0] - nested.Y[0]) < 1e-9, "nested shapes added up");
}
{ // Overlaps painted into the leaf hold no stored energy: real list, a small nudge and plain scrolling stay gentle.
  const list = spec.drops.length ? spec.drops : [[800, 500, 60], [810, 505, 14], [790, 495, 32]];
  const overlaps = d => list.filter(o => o !== d && Math.hypot(o[0] - d[0], o[1] - d[1]) < o[2] + d[2]).length;
  const near = list.reduce((b, d) => overlaps(d) > overlaps(b) ? d : b, list[0]); // the most tightly painted cluster
  const w = world(list, W, H);
  for (let t = 0; t < 30; t++) w.step(stir(near[0] - near[2] - 40, near[1], 0.3, 1, 0), [], BOUNDS);
  for (let t = 0; t < 2000; t++) w.step(NONE, [], BOUNDS);
  let farthest = 0;
  for (let i = 0; i < list.length; i++) farthest = Math.max(farthest, Math.hypot(w.X[i] - list[i][0], w.Y[i] - list[i][1]));
  if (spec.drops.length) assert(farthest < 150, "a gentle stir flung a drop " + farthest.toFixed(0) + " units");
  let top = 0;
  const scroll = world(list, W, H);
  const roomy = { l: -5000, t: -5000, r: W + 5000, b: H + 5000 }; // nothing leaves the window here
  for (let t = 0; t < 180; t++) { scroll.step(NONE, [{ x0: 0, y0: 0, x1: W, y1: H, vx: 0, vy: -3 }], roomy); for (let i = 0; i < list.length; i++) top = Math.max(top, speed(scroll, i)); }
  assert(top <= scroll.VAPP * 1.01, "scrolling alone reached " + top);
}
{ // A heavy drop running into a tiny one nudges it gently: a touch never flings.
  const w = world([[600, 500, 60], [720, 500, 5]], W, H);
  let top = 0;
  w.step(stir(500, 500, 1), [], BOUNDS); w.VX[0] = 1.2; w.VY[0] = 0;
  for (let t = 0; t < 200; t++) { w.step(NONE, [], BOUNDS); top = Math.max(top, speed(w, 1)); }
  assert(top > 0 && top <= w.VAPP, "the tiny drop reached " + top);
}
{ // In a narrow window the drops the crop has always hidden stay hidden. Only ones that were on view come back.
  const w = world([[100, 500, 20]], W, H), narrow = { l: 343, t: 0, r: 1257, b: 1000, s: 1.4 };
  w.step(stir(80, 500, 1), [], narrow);
  for (let t = 0; t < 3000; t++) w.step(NONE, [], narrow);
  assert(w.X[0] < 343, "a hidden drop was pulled into the window: " + w.X[0]);
}
{ // Under the cursor the app's push fades away completely.
  const mouseOnly = one(), both = one();
  for (let t = 0; t < 5; t++) { mouseOnly.step(stir(mouseOnly.X[0] - 1, 500), [], BOUNDS); both.step(stir(both.X[0] - 1, 500), [{ x0: 700, y0: 400, x1: 900, y1: 600, vx: 0, vy: -3 }], BOUNDS); }
  assert(Math.abs(both.Y[0] - mouseOnly.Y[0]) < 1e-9, "the app moved a drop the cursor had: " + both.Y[0]);
}
{ // A drop pushed off an edge disappears, and comes back from a different edge, sliding fully into view.
  for (const [x, y, vx, vy, exit] of [[3, 500, -1.2, 0, "l"], [1597, 500, 1.2, 0, "r"], [800, 3, 0, -1.2, "t"], [800, 997, 0, 1.2, "b"]]) {
    const w = one(); w.X[0] = x; w.Y[0] = y;
    w.step(stir(x, y, 0.03), [], BOUNDS); w.VX[0] = vx * 2; w.VY[0] = vy * 2;
    let came = null;
    for (let t = 0; t < 400 && !came; t++) {
      const was = [w.X[0], w.Y[0]];
      w.step(NONE, [], BOUNDS);
      if (Math.hypot(w.X[0] - was[0], w.Y[0] - was[1]) > 50) { came = w.X[0] < 0 ? "l" : w.X[0] > W ? "r" : w.Y[0] < 0 ? "t" : "b"; break; }
      if (t < 60) { w.VX[0] = vx * 2; w.VY[0] = vy * 2; } // keep it heading out
    }
    assert(came, "never came back after leaving by " + exit);
    assert(came !== exit, "came back from the edge it left by: " + exit);
    for (let t = 0; t < 2000; t++) w.step(NONE, [], BOUNDS);
    assert(w.X[0] > 0 && w.X[0] < W && w.Y[0] > 0 && w.Y[0] < H, "did not slide into view: " + w.X[0] + "," + w.Y[0]);
    for (let t = 0; t < w.REST; t++) w.step(NONE, [], BOUNDS);
    assert(speed(w) === 0 && !w.awake(), "comes to rest like any other push");
  }
}
{ // It enters where there is free room: left and top are crowded, it left by the bottom, so it must come from the right.
  const crowd = []; for (let y = 25; y < H; y += 50) crowd.push([40, y, 25]);
  for (let x = 25; x < W - 200; x += 50) crowd.push([x, 40, 25]);
  const w = world([[800, 500, 20], ...crowd], W, H);
  w.step(stir(770, 500), [], BOUNDS); w.X[0] = 800; w.Y[0] = H + 100; w.VX[0] = 0; w.VY[0] = 1;
  w.step(NONE, [], BOUNDS);
  assert(w.X[0] > W, "entered at " + w.X[0] + "," + w.Y[0]);
  assert(w.VX[0] < -0.3, "sliding in, " + w.VX[0]);
}
{ // Entering is a push like any other: the 102 s start again, even at the very end of a glide.
  const w = one();
  w.step(stir(770, 500), [], BOUNDS);
  for (let t = 0; t < w.REST - 100; t++) w.step(NONE, [], BOUNDS);
  w.X[0] = W + 100; w.VX[0] = 0.01; w.step(NONE, [], BOUNDS);
  for (let t = 0; t < 300; t++) w.step(NONE, [], BOUNDS);
  assert(w.awake() && speed(w) > 0.05, "still gliding in: " + speed(w));
}
{ // Every other edge gets used over time, and no drop is ever lost.
  const w = one(), edges = new Set();
  for (let round = 0; round < 40; round++) {
    w.step(stir(w.X[0] - 30, w.Y[0]), [], BOUNDS);
    w.X[0] = W + 100; w.VX[0] = 1; w.step(NONE, [], BOUNDS);
    edges.add(w.X[0] < 0 ? "l" : w.Y[0] < 0 ? "t" : w.Y[0] > H ? "b" : "?");
    assert(!edges.has("r"), "came back by the edge it left");
    w.X[0] = 800; w.Y[0] = 500; w.VX[0] = 0; w.VY[0] = 0;
  }
  assert(edges.size >= 1 && !edges.has("?"), "entered from " + [...edges]);
}
{ // Borders are permeable: a drop driven by the mouse passes through a shape, still or moving.
  for (const vx of [0, 0.5]) {
    const w = one(); let px = 500; w.X[0] = 560; w.Y[0] = 500;
    const panel = () => ({ x0: 600, y0: 0, x1: 700, y1: 1000, vx, vy: 0 });
    let far = 0;
    for (let t = 0; t < 1200; t++) { px = w.X[0] - 30; w.step(stir(px, w.Y[0], 1, 5, 0), [panel()], BOUNDS); far = Math.max(far, w.X[0]); }
    assert(far > 700, "came out the far side, reached x=" + far);
  }
}
{ // Gentle at any stirring, never lost, never faster than the cap, numbers stay real. Uses the real 120 drops when given.
  const list = spec.drops.length ? spec.drops : Array.from({ length: 120 }, (_, i) => [(i * 137) % W, (i * 71) % H, 5 + i % 56]);
  const w = world(list, W, H);
  for (let t = 0; t < 3000; t++) {
    const x = 800 + Math.sin(t / 40) * 900, y = 500 + Math.cos(t / 23) * 600;
    w.step(stir(x, y, 1, 20, -20), t % 20 < 5 ? [{ x0: 200, y0: 0, x1: 1400, y1: 900, vx: 0, vy: 3 }] : [], BOUNDS);
    for (let i = 0; i < list.length; i++) {
      assert(Number.isFinite(w.X[i]) && Number.isFinite(w.VX[i]), "finite");
      assert(speed(w, i) <= w.VMAX * 1.1, "cap: " + speed(w, i));
      assert(w.X[i] > -200 && w.X[i] < W + 200 && w.Y[i] > -200 && w.Y[i] < H + 200, "not lost: " + w.X[i] + "," + w.Y[i]);
    }
  }
  for (let t = 0; w.awake() && t < 60 * 900; t++) w.step(NONE, [], BOUNDS); // a drop leaving late restarts the 102 s
  assert(!w.awake(), "all 120 settle");
  for (let i = 0; i < list.length; i++) assert(speed(w, i) === 0, "all exactly stopped");
}
{ // A respawn is a push, so chains can happen, but stirring next to an edge always settles.
  const list = spec.drops.length ? spec.drops : Array.from({ length: 120 }, (_, i) => [(i * 137) % W, (i * 71) % H, 5 + i % 56]);
  const b = { l: 0, t: 90, r: W, b: 910, s: 1.59 }, w = world(list, W, H);
  for (let i = 0; i <= 180; i++) { const x = (900 + i * 5) / 1.59, y = 56 + (300 + Math.sin(i / 8) * 150) / 1.59; w.step(stir(x, y, 1, 3, 1), [], b); }
  let t = 0;
  while (w.awake() && t < 60 * 900) { w.step(NONE, [], b); t++; }
  assert(!w.awake(), "still moving after 15 minutes");
  console.log("stirring near the top edge settled after " + (t / 60).toFixed(0) + " s");
}
{ // A drop behind a text box eases out to free space, gently, without being told twice.
  const w = one(), box = { x0: 600, y0: 0, x1: 900, y1: 1000 };
  assert(w.setZones([box]) && w.awake(), "a caught drop wakes");
  let top = 0;
  for (let t = 0; t < w.REST; t++) { w.step(NONE, [], BOUNDS); top = Math.max(top, speed(w)); }
  assert(w.X[0] + 20 <= 600 || w.X[0] - 20 >= 900, "ended clear of the box, x=" + w.X[0]);
  assert(top <= w.VZONE * 1.01, "gently: " + top);
  assert(!w.awake() && speed(w) === 0, "and rests within the 102 s");
}
{ // A drop already clear stays put, the same box again wakes nothing, and a changing box never keeps them moving.
  const w = one(), clear = { x0: 0, y0: 0, x1: 300, y1: 1000 };
  assert(!w.setZones([clear]) && !w.awake() && w.X[0] === 800, "a drop outside any box is left alone");
  const stuck = world([[800, 500, 20]], W, H), all = { x0: -100, y0: -100, x1: W + 100, y1: H + 100 };
  stuck.setZones([all]);
  for (let t = 0; t < stuck.REST + 5; t++) { if (t % 60 === 0) stuck.setZones([{ ...all, y1: H + 100 + t }]); stuck.step(NONE, [], BOUNDS); }
  assert(!stuck.awake() && speed(stuck) === 0 && stuck.X[0] === 800, "a drop with nowhere to go rests where it is");
}
{ // Easing out never restarts the clock, so the 102 s holds while drops are inside a box.
  const w = world([[800, 500, 20], [100, 950, 20]], W, H), box = { x0: 200, y0: 0, x1: 1400, y1: 1000 };
  w.setZones([box]);
  for (let t = 0; t < w.REST - 1; t++) w.step(NONE, [], BOUNDS);
  assert(w.awake(), "awake just before 102 s");
  w.step(NONE, [], BOUNDS);
  assert(!w.awake(), "at rest exactly 102 s after waking");
}
{ // The mouse wins: it pushes a drop through a box, and near the cursor the box lets go.
  const w = one(), box = { x0: 600, y0: 0, x1: 900, y1: 1000 }; w.X[0] = 550;
  w.setZones([box]);
  let far = 0;
  for (let t = 0; t < 600; t++) { w.step(stir(w.X[0] - 30, 500, 1, 5, 0), [], BOUNDS); far = Math.max(far, w.X[0]); }
  assert(far > 900, "the mouse pushed it through, reached " + far);
  const a = one(), b = one(); a.setZones([box]); b.setZones([box]);
  for (let t = 0; t < 60; t++) { a.step(stir(a.X[0], a.Y[0], 0), [], BOUNDS); b.step(NONE, [], BOUNDS); }
  assert(speed(a) < speed(b) / 4, "a parked cursor holds a drop against the box: " + speed(a) + " against " + speed(b));
}
{ // It never eases off the screen, and a respawning drop does not enter behind a box.
  const w = world([[30, 500, 20]], W, H);
  w.setZones([{ x0: 0, y0: 0, x1: 300, y1: 1000 }]);
  for (let t = 0; t < w.REST; t++) w.step(NONE, [], BOUNDS);
  assert(w.X[0] >= 300, "went to the free side, x=" + w.X[0]);
  const r = world([[800, 500, 20]], W, H), middle = { x0: 300, y0: 0, x1: W - 300, y1: H };
  r.step(stir(770, 500), [], BOUNDS); r.setZones([middle]); r.X[0] = W + 100; r.VX[0] = 1; r.step(NONE, [], BOUNDS);
  const into = r.X[0] < 0 ? 62 : r.X[0] > W ? W - 62 : r.X[0], top = r.Y[0] < 0 || r.Y[0] > H;
  assert(!top && (into < 300 || into > W - 300), "entered behind the box at " + r.X[0] + "," + r.Y[0]);
}
{ // More than 60% past an edge, a drop is pulled the rest of the way out and comes back elsewhere, even at no speed. At 55% it stays.
  const placed = (d) => { const w = one(); w.step(stir(770, 500), [], BOUNDS); w.X[0] = W + d; w.Y[0] = 500; w.VX[0] = 0.002; w.VY[0] = 0; return w; };
  const past = placed(0.2 * 20 + 1); let back = false;
  for (let t = 0; t < 400 && !back; t++) { past.step(NONE, [], BOUNDS); if (past.X[0] < W || past.Y[0] < 0 || past.Y[0] > H) back = true; }
  assert(back, "a drop 62% out never left");
  assert(past.X[0] < W, "it came back by the edge it left");
  const under = placed(0.2 * 20 - 2); under.VX[0] = 0;
  for (let t = 0; t < under.REST + 10; t++) under.step(NONE, [], BOUNDS);
  assert(under.X[0] > W && under.X[0] < W + 20 && !under.awake(), "a drop 55% out stays where it stopped, x=" + under.X[0]);
  const late = placed(0); late.VX[0] = 0; late.step(NONE, [], BOUNDS); // leaving at the very end of a glide still finishes
  for (let t = 0; t < late.REST - 20; t++) late.step(NONE, [], BOUNDS);
  late.X[0] = W + 5; late.VX[0] = 0;
  let left = false; for (let t = 0; t < 400 && !left; t++) { late.step(NONE, [], BOUNDS); if (late.X[0] < W) left = true; }
  assert(left, "a drop past 60% as the clock ran out was left stuck on the edge");
  const painted = world([[W + 15, 500, 20]], W, H); // cut off by the leaf from the start: not pushed there, so left alone
  painted.step(stir(W - 40, 500, 0.5), [], BOUNDS);
  for (let t = 0; t < 30; t++) painted.step(NONE, [], BOUNDS);
  assert(painted.X[0] > W, "a painted drop cut off by the edge was pulled about");
}
{ // A box shifting slightly never wakes a drop resting just clear of it.
  const w = one(); assert(!w.setZones([{ x0: 815, y0: 0, x1: 1000, y1: H }]) && !w.awake(), "woken by a box that barely touches it");
  assert(w.setZones([{ x0: 700, y0: 0, x1: 1000, y1: H }]) && w.awake(), "a real overlap wakes it");
}
{ // Each drop has its own 102 s: one arriving does not keep the others moving, but a real knock wakes a resting drop.
  const far = world([[200, 200, 20], [1400, 800, 20]], W, H);
  far.step(stir(170, 200), [], BOUNDS);
  for (let t = 0; t < far.REST - 200; t++) far.step(NONE, [], BOUNDS);
  far.step(stir(1370, 800), [], BOUNDS);
  for (let t = 0; t < 250; t++) far.step(NONE, [], BOUNDS);
  assert(speed(far, 0) === 0 && speed(far, 1) > 0, "the first drop rested on its own clock");
  const knock = world([[600, 500, 40], [700, 500, 40]], W, H);
  knock.step(stir(540, 500), [], BOUNDS); knock.VX[0] = 1;
  for (let t = 0; t < 100; t++) knock.step(NONE, [], BOUNDS);
  assert(knock.X[1] > 700, "a knock moved the resting drop");
  const soft = world([[600, 500, 40], [679, 500, 40]], W, H);
  soft.step(stir(415, 500, 0.5), [], BOUNDS); soft.VX[0] = 0.01;
  for (let t = 0; t < 400; t++) soft.step(NONE, [], BOUNDS);
  assert(soft.X[1] === 679, "a faint touch left the resting drop alone");
}
{ // Easing out of realistic layouts settles soon after 102 s, with everything clear of the boxes. Real list.
  const list = spec.drops.length ? spec.drops : Array.from({ length: 120 }, (_, i) => [(i * 137) % W, (i * 71) % H, 5 + i % 56]);
  const b = { l: 0, t: 90, r: W, b: 910, s: 1.59 };
  for (const zones of [[{ x0: 560, y0: 0, x1: 1040, y1: H }], [{ x0: 560, y0: 0, x1: 1040, y1: H }, { x0: 0, y0: 0, x1: 225, y1: H }, { x0: 1358, y0: 0, x1: W, y1: H }]]) {
    const w = world(list, W, H); w.setZones(zones);
    let t = 0; while (w.awake() && t < 60 * 900) { w.step(NONE, [], b); t++; }
    assert(t <= 60 * 360, "took " + (t / 60).toFixed(0) + " s to settle");
    let behind = 0;
    for (let i = 0; i < list.length; i++) if (w.X[i] > b.l && w.X[i] < b.r && w.Y[i] > b.t && w.Y[i] < b.b && zones.some(z => w.X[i] + w.R[i] - 12 > z.x0 && w.X[i] - w.R[i] + 12 < z.x1 && w.Y[i] + w.R[i] - 12 > z.y0 && w.Y[i] - w.R[i] + 12 < z.y1)) behind++;
    console.log(zones.length + " boxes: settled after " + (t / 60).toFixed(0) + " s, " + behind + " drops still behind a box");
    assert(behind <= 3, behind + " drops stayed behind a box");
  }
}
{ // A drop still on its way in, shoved back out by the mouse, comes back again.
  const w = one();
  w.step(stir(770, 500), [], BOUNDS); w.X[0] = W + 100; w.VX[0] = 1; w.step(NONE, [], BOUNDS);
  const fromX = w.X[0], fromY = w.Y[0];
  assert(fromX < 0 || fromY < 0 || fromY > H, "entered from outside");
  w.VX[0] = fromX < 0 ? -2 : 0; w.VY[0] = fromY < 0 ? -2 : fromY > H ? 2 : 0;
  let again = false;
  for (let t = 0; t < 100 && !again; t++) { w.step(NONE, [], BOUNDS); if (Math.hypot(w.X[0] - fromX, w.Y[0] - fromY) > 200) again = true; }
  assert(again, "lost on its way in");
}
{ // A window's edge makes a crossing a little harder, never impossible: a glide loses some speed and still gets through.
  const glide = hasBorder => {
    const w = one(); w.X[0] = 570; w.step(stir(540, 500), [], BOUNDS); w.VX[0] = 0.6; w.VY[0] = 0;
    if (hasBorder) w.setBorders([{ x0: 600, y0: 0, x1: 1100, y1: 1000 }]);
    for (let t = 0; t < 3000; t++) w.step(NONE, [], BOUNDS);
    return w.X[0];
  };
  const free = glide(false), slowed = glide(true);
  assert(slowed < free, "the edge made no difference: " + slowed + " against " + free);
  assert(slowed > 640, "the edge stopped it, x=" + slowed);
  assert(free - slowed < 0.5 * (free - 570), "the edge is too strong: " + slowed + " against " + free);
  const pushed = one(); pushed.X[0] = 500; pushed.setBorders([{ x0: 600, y0: 0, x1: 1100, y1: 1000 }]);
  for (let t = 0; t < 500; t++) pushed.step(stir(pushed.X[0] - 30, 500, 1, 5, 0), [], BOUNDS);
  assert(pushed.X[0] > 700, "the mouse could not push it across, x=" + pushed.X[0]);
  const still = one(); still.setBorders([{ x0: 790, y0: 0, x1: 1100, y1: 1000 }]);
  for (let t = 0; t < 100; t++) still.step(NONE, [], BOUNDS);
  assert(still.X[0] === 800 && !still.awake(), "an edge does not move a resting drop");
}
{ // Fast enough: one step of 120 drops, stirred, with 200 moving shapes.
  const list = Array.from({ length: 120 }, (_, i) => [(i * 137) % W, (i * 71) % H, 5 + i % 56]);
  const w = world(list, W, H), shapes = Array.from({ length: 200 }, (_, i) => ({ x0: i, y0: i, x1: i + 300, y1: i + 40, vx: 0, vy: 0.5 }));
  const t0 = process.hrtime.bigint();
  for (let t = 0; t < 600; t++) w.step(stir(800, 500), shapes, BOUNDS);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 600;
  assert(ms < 1, "a step took " + ms.toFixed(3) + " ms");
  console.log("step with 120 drops and 200 moving shapes: " + ms.toFixed(3) + " ms");
}
console.log("drops physics ok");
