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
  let top = 0;
  for (let t = 0; t < 6; t++) w.step(stir(near[0] - near[2] - 60, near[1], 0.3, 1, 0), [], BOUNDS);
  for (let t = 0; t < 300; t++) { w.step(NONE, [], BOUNDS); for (let i = 0; i < list.length; i++) top = Math.max(top, speed(w, i)); }
  assert(top <= w.VAPP, "a small nudge reached " + top);
  let shifted = 0;
  for (let i = 0; i < list.length; i++) if (Math.hypot(w.X[i] - list[i][0], w.Y[i] - list[i][1]) > 3) shifted++;
  console.log("a small nudge on the tightest cluster shifted " + shifted + " drops by more than 3 units");
  assert(shifted <= 2, "a small nudge shifted " + shifted + " drops by more than 3 units");
  const scroll = world(list, W, H); top = 0;
  for (let t = 0; t < 180; t++) { scroll.step(NONE, [{ x0: 0, y0: 0, x1: W, y1: H, vx: 0, vy: -3 }], BOUNDS); for (let i = 0; i < list.length; i++) top = Math.max(top, speed(scroll, i)); }
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
{ // The window holds a drop softly on every side: it may end partly cut off, never gone.
  for (const [x, y, vx, vy] of [[3, 500, -1.2, 0], [1597, 500, 1.2, 0], [800, 3, 0, -1.2], [800, 997, 0, 1.2]]) {
    const w = one(); w.X[0] = x; w.Y[0] = y;
    w.step(stir(x, y, 0.03), [], BOUNDS); w.VX[0] = vx; w.VY[0] = vy;
    for (let t = 0; t < w.REST; t++) w.step(NONE, [], BOUNDS);
    assert(w.X[0] > -30 && w.X[0] < W + 30 && w.Y[0] > -30 && w.Y[0] < H + 30, "lost past the edge: " + w.X[0] + "," + w.Y[0]);
  }
}
{ // Borders are permeable: a drop driven by the mouse passes through a shape, still or moving.
  for (const vx of [0, 0.5]) {
    const w = one(); let px = 500; w.X[0] = 560; w.Y[0] = 500;
    const panel = () => ({ x0: 600, y0: 0, x1: 700, y1: 1000, vx, vy: 0 });
    for (let t = 0; t < 1200; t++) { px = w.X[0] - 30; w.step(stir(px, w.Y[0], 1, 5, 0), [panel()], BOUNDS); }
    assert(w.X[0] > 700, "came out the far side, x=" + w.X[0]);
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
  for (let t = 0; t < w.REST; t++) w.step(NONE, [], BOUNDS);
  assert(!w.awake(), "all 120 settle");
  for (let i = 0; i < list.length; i++) assert(speed(w, i) === 0, "all exactly stopped");
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
