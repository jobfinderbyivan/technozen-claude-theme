// The singing glass orbs on the start-up card: a tiny physics scene and a tiny stereo synth.
// Physics: 4 or 5 glass spheres with mass, walls, elastic collisions, and the mouse as reverse gravity.
// Audio: each orb hums its own fundamental while it moves; a collision strikes a singing-bowl bell
// with the left ear on one orb's fundamental and the right ear on the other's (true binaural), as
// loud as the closing speed. Sines from a table, exponential decays as multiplies, a tanh limiter:
// nothing heavier than that, so it runs anywhere.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;

class Orb
{
    public float X, Y, Vx, Vy, R, Mass, Freq;
    public Color Tint;
    public float Speed { get { return (float)Math.Sqrt(Vx * Vx + Vy * Vy); } }
}

class Scene
{
    // Heavy, slow glass: half the speed of the first version, more drag, and mass growing faster than area.
    public const float Step = 1f / 60f, MaxSpeed = 3.5f, MouseForce = 2250f, Restitution = 0.9f, WallRestitution = 0.85f, Damping = 0.99f;
    public const float MinClosingSpeed = 0.2f; // px per step; slower touches do not ring
    public readonly List<Orb> Orbs = new List<Orb>();
    public readonly List<float[]> Hits = new List<float[]>(); // x, y, age (starts negative so the flash lands when the bell is heard)
    public RectangleF Bounds;
    public float MouseX = -1e6f, MouseY = -1e6f;   // far away = no force
    public Action<Orb, Orb, float> Struck;          // a, b, loudness 0..1
    public int Collisions;
    readonly bool[,] touching = new bool[5, 5];     // a pair rings on first contact only, again after it has clearly separated
    readonly int[,] lastRing = new int[5, 5]; int step; // and never twice within 300 ms (a held cursor makes real re-bounces)

    public Scene(Random rng, RectangleF bounds)
    {
        Bounds = bounds;
        for (int i = 0; i < 5; i++) for (int j = 0; j < 5; j++) lastRing[i, j] = -1000;
        int count = 4 + rng.Next(2);
        Color[] tints = { Color.FromArgb(120, 230, 255), Color.FromArgb(196, 242, 120), Color.FromArgb(200, 170, 255), Color.FromArgb(150, 200, 240), Color.FromArgb(255, 190, 220) };
        var radii = new List<float>(); for (int i = 0; i < count; i++) radii.Add(26 + rng.Next(52)); // 26 to 77 px: a clear small-to-large spread
        radii.Sort((a, b) => b.CompareTo(a)); // largest placed first, so the small ones fill the gaps
        // Fundamentals a laptop speaker can play, 4 to 7 Hz apart so every pair beats audibly (widest pair under 30 Hz).
        float f = 180 + (float)rng.NextDouble() * 420;
        for (int i = 0; i < count; i++)
        {
            var o = new Orb { R = radii[i], Tint = tints[(i + rng.Next(5)) % 5], Freq = f };
            f += 4 + (float)rng.NextDouble() * 3;
            // Random spots until one is clear; if the face is crowded, shrink and try again; at the
            // smallest size take the spot with the least overlap (the physics separates the rest).
            float bestX = 0, bestY = 0, bestOverlap = float.MaxValue;
            for (int round = 0; round < 8 && bestOverlap > 0; round++)
            {
                if (round > 0) o.R = Math.Max(22, o.R * 0.85f);
                for (int tries = 0; tries < 60; tries++)
                {
                    o.X = bounds.Left + o.R + (float)rng.NextDouble() * (bounds.Width - 2 * o.R);
                    o.Y = bounds.Top + o.R + (float)rng.NextDouble() * (bounds.Height - 2 * o.R);
                    float worst = 0;
                    foreach (var p in Orbs) worst = Math.Max(worst, o.R + p.R + 6 - Dist(o, p));
                    if (worst < bestOverlap) { bestOverlap = worst; bestX = o.X; bestY = o.Y; }
                    if (worst <= 0) break;
                }
            }
            o.X = bestX; o.Y = bestY;
            o.Mass = (float)Math.Pow(o.R, 3); // volume: a big orb is many times heavier than a small one
            double a = rng.NextDouble() * Math.PI * 2; float v = 0.15f + (float)rng.NextDouble() * 0.3f;
            o.Vx = (float)Math.Cos(a) * v; o.Vy = (float)Math.Sin(a) * v;
            Orbs.Add(o);
        }
    }

    public static float Dist(Orb a, Orb b) { float dx = a.X - b.X, dy = a.Y - b.Y; return (float)Math.Sqrt(dx * dx + dy * dy); }

    public void Tick()
    {
        step++;
        foreach (var o in Orbs)
        {
            float dx = o.X - MouseX, dy = o.Y - MouseY, d2 = dx * dx + dy * dy + 400;
            // Heavy orbs answer the cursor sluggishly: the push is scaled by the square root of a mid-size orb's mass over this one's.
            if (d2 < 250000) { float a = MouseForce / d2 * (float)Math.Sqrt(125000 / o.Mass), d = (float)Math.Sqrt(d2); o.Vx += a * dx / d; o.Vy += a * dy / d; }
            o.Vx *= Damping; o.Vy *= Damping;
            float s = o.Speed; if (s > MaxSpeed) { o.Vx *= MaxSpeed / s; o.Vy *= MaxSpeed / s; }
            o.X += o.Vx; o.Y += o.Vy;
        }
        for (int i = 0; i < Orbs.Count; i++)
            for (int j = i + 1; j < Orbs.Count; j++)
            {
                Orb a = Orbs[i], b = Orbs[j];
                float dx = b.X - a.X, dy = b.Y - a.Y, d = (float)Math.Sqrt(dx * dx + dy * dy);
                if (d >= a.R + b.R + 4) { touching[i, j] = false; continue; }
                if (d <= 0.001f || d >= a.R + b.R) continue;
                float nx = dx / d, ny = dy / d, overlap = a.R + b.R - d, ia = 1 / a.Mass, ib = 1 / b.Mass;
                a.X -= nx * overlap * ia / (ia + ib); a.Y -= ny * overlap * ia / (ia + ib);
                b.X += nx * overlap * ib / (ia + ib); b.Y += ny * overlap * ib / (ia + ib);
                float vrel = (b.Vx - a.Vx) * nx + (b.Vy - a.Vy) * ny;
                if (vrel >= 0) continue; // already separating
                float jn = -(1 + Restitution) * vrel / (ia + ib);
                a.Vx -= jn * ia * nx; a.Vy -= jn * ia * ny; b.Vx += jn * ib * nx; b.Vy += jn * ib * ny;
                bool first = !touching[i, j]; touching[i, j] = true;
                if (!first || -vrel < MinClosingSpeed || step - lastRing[i, j] < 18) continue;
                lastRing[i, j] = step;
                // Loudness from the closing speed, heavier for big pairs, with a curve that keeps drifts
                // soft and lets a hard mouse-flung hit go all the way: force decides the volume.
                float size = 0.6f + 0.4f * (float)Math.Min(1, Math.Sqrt(1 / (ia + ib) / 150000f));
                float loud = Math.Min(1f, (float)Math.Pow(-vrel / (1.2f * MaxSpeed), 1.5) * 1.5f * size);
                Collisions++;
                Hits.Add(new[] { a.X + nx * a.R, a.Y + ny * a.R, -0.25f });
                if (Struck != null) Struck(a, b, loud);
            }
        foreach (var o in Orbs) // walls last, so a collision can never leave an orb outside the face
        {
            if (o.X - o.R < Bounds.Left) { o.X = Bounds.Left + o.R; o.Vx = Math.Abs(o.Vx) * WallRestitution; }
            if (o.X + o.R > Bounds.Right) { o.X = Bounds.Right - o.R; o.Vx = -Math.Abs(o.Vx) * WallRestitution; }
            if (o.Y - o.R < Bounds.Top) { o.Y = Bounds.Top + o.R; o.Vy = Math.Abs(o.Vy) * WallRestitution; }
            if (o.Y + o.R > Bounds.Bottom) { o.Y = Bounds.Bottom - o.R; o.Vy = -Math.Abs(o.Vy) * WallRestitution; }
        }
        for (int i = Hits.Count - 1; i >= 0; i--) { Hits[i][2] += Step / 0.3f; if (Hits[i][2] >= 1) Hits.RemoveAt(i); }
    }

    public float Energy() { float e = 0; foreach (var o in Orbs) e += 0.5f * o.Mass * (o.Vx * o.Vx + o.Vy * o.Vy); return e; }
    public float MaxOverlap()
    {
        float m = 0;
        for (int i = 0; i < Orbs.Count; i++) for (int j = i + 1; j < Orbs.Count; j++) m = Math.Max(m, Orbs[i].R + Orbs[j].R - Dist(Orbs[i], Orbs[j]));
        return m;
    }
}

class Synth : IDisposable
{
    public const int Rate = 48000, Frames = 960, Buffers = 3; // 20 ms buffers, 60 ms queued
    const int MaxMotion = 5, MaxBells = 8, Partials = 4;
    static readonly float[] PartialRatio = { 1f, 2f, 2.76f, 4.07f }, PartialAmp = { 1f, 0.5f, 0.25f, 0.12f }, PartialDecay = { 2.0f, 1.4f, 0.9f, 0.6f };
    static readonly float[] Sine = BuildSine();
    static float[] BuildSine() { var t = new float[4096]; for (int i = 0; i < t.Length; i++) t[i] = (float)Math.Sin(i * Math.PI * 2 / t.Length); return t; }

    // Motion voices: one sine per orb whose amplitude follows the orb's speed.
    readonly float[] mPhase = new float[MaxMotion], mInc = new float[MaxMotion], mAmp = new float[MaxMotion], mTarget = new float[MaxMotion];
    // Bells: per bell, left partials on fA and right partials on fB, each with a phase, an amplitude and a decay multiplier.
    readonly float[,] bPhase = new float[MaxBells, 2 * Partials], bInc = new float[MaxBells, 2 * Partials], bAmp = new float[MaxBells, 2 * Partials], bDecay = new float[MaxBells, 2 * Partials];
    readonly long[] bStart = new long[MaxBells]; readonly bool[] bActive = new bool[MaxBells];
    // Tails: a stolen bell keeps ringing here while it fades out in 10 ms, so taking its slot never clicks.
    const int MaxTails = 4; readonly float[,] tPhase = new float[MaxTails, 2 * Partials], tInc = new float[MaxTails, 2 * Partials], tAmp = new float[MaxTails, 2 * Partials];
    static readonly float TailDecay = (float)Math.Exp(-1.0 / (0.01 * Rate));
    readonly object gate = new object();
    long rendered; // absolute frames rendered so far; a strike starts at the next frame rendered
    const float Attack = 1f / (0.06f * Rate), Release = 1f / (0.3f * Rate), BellAttackFrames = 0.015f * Rate, MasterGain = 1f, Silent = 3e-5f;

    public void SetMotion(int voice, float freq, float speed)
    {
        lock (gate) { mInc[voice] = freq / Rate; mTarget[voice] = Math.Min(1f, speed / 6f) * 0.12f; }
    }

    public long Strike(float fA, float fB, float loud)
    {
        lock (gate)
        {
            // A free slot, else the quietest one (its tail is near silence, so taking it over is inaudible).
            int slot = -1; float quietest = float.MaxValue;
            for (int i = 0; i < MaxBells; i++)
            {
                if (!bActive[i]) { slot = i; break; }
                float sum = 0; for (int k = 0; k < 2 * Partials; k++) sum += bAmp[i, k];
                if (sum < quietest) { quietest = sum; slot = i; }
            }
            if (bActive[slot])
            {
                // Move the ringing bell into the quietest tail so it fades instead of stopping dead.
                int tail = 0; float tq = float.MaxValue;
                for (int i = 0; i < MaxTails; i++) { float sum = 0; for (int k = 0; k < 2 * Partials; k++) sum += tAmp[i, k]; if (sum < tq) { tq = sum; tail = i; } }
                float env = Math.Min(1f, (rendered - bStart[slot]) / BellAttackFrames);
                for (int k = 0; k < 2 * Partials; k++) { tPhase[tail, k] = bPhase[slot, k]; tInc[tail, k] = bInc[slot, k]; tAmp[tail, k] = bAmp[slot, k] * env; }
            }
            for (int p = 0; p < Partials; p++)
                for (int side = 0; side < 2; side++)
                {
                    int k = side * Partials + p; float f = (side == 0 ? fA : fB) * PartialRatio[p];
                    bInc[slot, k] = f / Rate; bAmp[slot, k] = PartialAmp[p] * loud; // phases continue: no step in the waveform
                    bDecay[slot, k] = (float)Math.Exp(-1.0 / (PartialDecay[p] * Rate));
                }
            bStart[slot] = rendered; bActive[slot] = true;
            return rendered;
        }
    }

    // Fills one buffer of interleaved 16-bit stereo. Called by the audio thread, and by the self-test.
    public void Render(short[] buf)
    {
        lock (gate)
        {
            for (int n = 0; n < Frames; n++)
            {
                float l = 0, r = 0; long frame = rendered + n;
                for (int v = 0; v < MaxMotion; v++)
                {
                    mAmp[v] += (mTarget[v] - mAmp[v]) * (mTarget[v] > mAmp[v] ? Attack : Release);
                    if (mAmp[v] < Silent) continue;
                    float s = Sine[(int)(mPhase[v] * 4096) & 4095] * mAmp[v]; l += s; r += s;
                    mPhase[v] += mInc[v]; if (mPhase[v] >= 1) mPhase[v] -= 1;
                }
                for (int b = 0; b < MaxBells; b++)
                {
                    if (!bActive[b] || frame < bStart[b]) continue;
                    float env = Math.Min(1f, (frame - bStart[b]) / BellAttackFrames); bool alive = false;
                    for (int k = 0; k < 2 * Partials; k++)
                    {
                        float a = bAmp[b, k]; if (a < Silent) continue; alive = true;
                        float s = Sine[(int)(bPhase[b, k] * 4096) & 4095] * a * env;
                        if (k < Partials) l += s; else r += s;
                        bPhase[b, k] += bInc[b, k]; if (bPhase[b, k] >= 1) bPhase[b, k] -= 1;
                        bAmp[b, k] = a * bDecay[b, k];
                    }
                    if (!alive) bActive[b] = false;
                }
                for (int b = 0; b < MaxTails; b++)
                    for (int k = 0; k < 2 * Partials; k++)
                    {
                        float a = tAmp[b, k]; if (a < Silent) continue;
                        float s = Sine[(int)(tPhase[b, k] * 4096) & 4095] * a;
                        if (k < Partials) l += s; else r += s;
                        tPhase[b, k] += tInc[b, k]; if (tPhase[b, k] >= 1) tPhase[b, k] -= 1;
                        tAmp[b, k] = a * TailDecay;
                    }
                buf[2 * n] = (short)(Math.Tanh(l * MasterGain) * 32000);
                buf[2 * n + 1] = (short)(Math.Tanh(r * MasterGain) * 32000);
            }
            rendered += Frames;
        }
    }

    public long Rendered { get { lock (gate) return rendered; } }

    // ---- winmm output ----
    [StructLayout(LayoutKind.Sequential)] struct WaveFormat { public short Tag, Channels; public int Rate, BytesPerSec; public short Align, Bits, Extra; }
    [StructLayout(LayoutKind.Sequential)] struct WaveHdr { public IntPtr Data; public int Length, Recorded; public IntPtr User; public int Flags, Loops; public IntPtr Next, Reserved; }
    public static readonly int FlagsOffset = (int)Marshal.OffsetOf(typeof(WaveHdr), "Flags"); // 24 on x64, 16 on x86
    [DllImport("winmm.dll")] static extern int waveOutOpen(out IntPtr h, int device, ref WaveFormat fmt, IntPtr cb, IntPtr inst, int flags);
    [DllImport("winmm.dll")] static extern int waveOutPrepareHeader(IntPtr h, IntPtr hdr, int size);
    [DllImport("winmm.dll")] static extern int waveOutUnprepareHeader(IntPtr h, IntPtr hdr, int size);
    [DllImport("winmm.dll")] static extern int waveOutWrite(IntPtr h, IntPtr hdr, int size);
    [DllImport("winmm.dll")] static extern int waveOutReset(IntPtr h);
    [DllImport("winmm.dll")] static extern int waveOutClose(IntPtr h);
    IntPtr device; IntPtr[] headers; IntPtr[] data; Thread pump; volatile bool running;
    readonly short[] work = new short[Frames * 2];

    public bool Start()
    {
        var fmt = new WaveFormat { Tag = 1, Channels = 2, Rate = Rate, Bits = 16, Align = 4, BytesPerSec = Rate * 4 };
        if (waveOutOpen(out device, -1, ref fmt, IntPtr.Zero, IntPtr.Zero, 0) != 0) { device = IntPtr.Zero; return false; } // no sound device: stay silent
        headers = new IntPtr[Buffers]; data = new IntPtr[Buffers];
        for (int i = 0; i < Buffers; i++)
        {
            data[i] = Marshal.AllocHGlobal(Frames * 4);
            headers[i] = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(WaveHdr)));
            var h = new WaveHdr { Data = data[i], Length = Frames * 4 };
            Marshal.StructureToPtr(h, headers[i], false);
            waveOutPrepareHeader(device, headers[i], Marshal.SizeOf(typeof(WaveHdr)));
        }
        running = true;
        pump = new Thread(Pump) { IsBackground = true, Priority = ThreadPriority.AboveNormal };
        pump.Start();
        return true;
    }

    void Pump()
    {
        bool[] queued = new bool[Buffers]; int i = 0;
        while (running)
        {
            // wait for this buffer to be free (WHDR_DONE = 1), then refill and requeue it
            while (running && queued[i] && (Marshal.ReadInt32(headers[i], FlagsOffset) & 1) == 0) Thread.Sleep(2);
            if (!running) break;
            Render(work);
            Marshal.Copy(work, 0, data[i], work.Length);
            if (waveOutWrite(device, headers[i], Marshal.SizeOf(typeof(WaveHdr))) != 0) { Thread.Sleep(20); continue; }
            queued[i] = true; i = (i + 1) % Buffers;
        }
    }

    public void Dispose()
    {
        if (device == IntPtr.Zero) return;
        running = false; pump.Join(500);
        waveOutReset(device);
        for (int i = 0; i < Buffers; i++) { waveOutUnprepareHeader(device, headers[i], Marshal.SizeOf(typeof(WaveHdr))); Marshal.FreeHGlobal(headers[i]); Marshal.FreeHGlobal(data[i]); }
        waveOutClose(device); device = IntPtr.Zero;
    }
}

// --selftest <report.txt>: physics and audio checks without a desktop.
static class SelfTest
{
    public static int Run(string reportPath)
    {
        var lines = new List<string>(); int failures = 0;
        Action<bool, string> check = (ok, what) => { lines.Add((ok ? "PASS " : "FAIL ") + what); if (!ok) failures++; };
        var bounds = new RectangleF(20, 20, 420, 200);

        // Placement over many seeds: never overlapping, never outside.
        int bad = 0;
        for (int seed = 0; seed < 2000; seed++)
        {
            var s = new Scene(new Random(seed), bounds);
            if (s.MaxOverlap() > 1) bad++;
            foreach (var o in s.Orbs) if (o.X - o.R < bounds.Left || o.X + o.R > bounds.Right || o.Y - o.R < bounds.Top || o.Y + o.R > bounds.Bottom) bad++;
            for (int i = 0; i < s.Orbs.Count; i++) for (int j = i + 1; j < s.Orbs.Count; j++)
                { float d = Math.Abs(s.Orbs[i].Freq - s.Orbs[j].Freq); if (d < 3 || d > 30) bad++; }
        }
        check(bad == 0, "2000 seeds: no overlap over 1 px at start, inside the face, every pair beats at 3 to 30 Hz (bad: " + bad + ")");

        // Two orbs head on: momentum conserved, they separate, and the bell is as loud as the closing speed says.
        var pair = new Scene(new Random(3), bounds);
        while (pair.Orbs.Count > 2) pair.Orbs.RemoveAt(2);
        Orb A = pair.Orbs[0], B = pair.Orbs[1];
        A.X = 150; A.Y = 120; A.Vx = 0.4f * Scene.MaxSpeed; A.Vy = 0; B.X = 150 + A.R + B.R + 8; B.Y = 120; B.Vx = -0.4f * Scene.MaxSpeed; // under the cap even after the lighter one recoils B.Vy = 0;
        float px0 = A.Mass * A.Vx + B.Mass * B.Vx; float loudSeen = -1; pair.Struck = (a, b, l) => loudSeen = l;
        for (int t = 0; t < 10; t++) pair.Tick();
        float px1 = A.Mass * A.Vx + B.Mass * B.Vx, expected = px0 * (float)Math.Pow(Scene.Damping, 10); // damping takes its share each step; the collision must take none
        check(Math.Abs(px1 - expected) < Math.Abs(px0) * 0.01f + 1, "head-on: momentum conserved apart from damping (" + px0.ToString("0") + " -> " + px1.ToString("0") + ", expected " + expected.ToString("0") + ")");
        check(A.Vx < 0 && B.Vx > 0 && Scene.Dist(A, B) >= A.R + B.R, "head-on: they bounce apart");
        check(loudSeen > 0.5f && loudSeen <= 1f, "head-on at 0.8 of the speed cap: loud bell " + loudSeen.ToString("0.00"));
        var soft = new Scene(new Random(3), bounds); while (soft.Orbs.Count > 2) soft.Orbs.RemoveAt(2);
        Orb C = soft.Orbs[0], D = soft.Orbs[1]; C.X = 150; C.Y = 120; C.Vx = 0.15f; C.Vy = 0; D.X = 150 + C.R + D.R + 2; D.Y = 120; D.Vx = -0.15f; D.Vy = 0;
        float softLoud = -1; soft.Struck = (a, b, l) => softLoud = l;
        for (int t = 0; t < 10; t++) soft.Tick();
        check(softLoud > 0 && softLoud < 0.25f, "drifting touch: soft bell " + softLoud.ToString("0.00"));

        // Repulsion: a parked cursor pushes the orbs away.
        var rep = new Scene(new Random(5), bounds); rep.MouseX = 230; rep.MouseY = 120;
        float before = 0, after = 0; foreach (var o in rep.Orbs) before += (float)Math.Sqrt((o.X - 230) * (o.X - 230) + (o.Y - 120) * (o.Y - 120));
        for (int t = 0; t < 60; t++) rep.Tick();
        foreach (var o in rep.Orbs) after += (float)Math.Sqrt((o.X - 230) * (o.X - 230) + (o.Y - 120) * (o.Y - 120));
        check(after > before, "cursor repels: mean distance " + (before / rep.Orbs.Count).ToString("0") + " -> " + (after / rep.Orbs.Count).ToString("0"));

        // A long run with a sweeping cursor, then without: stable, contained, decaying, ringing.
        var scene = new Scene(new Random(1), bounds); var strikes = new List<float>(); scene.Struck = (a, b, loud) => strikes.Add(loud);
        bool nan = false, outside = false; float eRest = 0;
        for (int t = 0; t < 600; t++)
        {
            if (t < 360) { scene.MouseX = 20 + t * 1.2f; scene.MouseY = 120 + (float)Math.Sin(t / 25f) * 70; }
            else scene.MouseX = -1e6f;
            scene.Tick();
            if (t == 360) eRest = scene.Energy();
            foreach (var o in scene.Orbs)
            {
                if (float.IsNaN(o.X) || float.IsNaN(o.Vx)) nan = true;
                if (o.X - o.R < bounds.Left - 0.5f || o.X + o.R > bounds.Right + 0.5f || o.Y - o.R < bounds.Top - 0.5f || o.Y + o.R > bounds.Bottom + 0.5f) outside = true;
            }
        }
        check(!nan, "no NaN after 600 steps");
        check(!outside, "orbs stay inside the face");
        check(scene.Energy() <= eRest, "energy at rest only decays: " + eRest.ToString("0") + " -> " + scene.Energy().ToString("0"));
        check(scene.MaxOverlap() <= 0.5f, "no overlap at the end: " + scene.MaxOverlap().ToString("0.00") + " px");
        check(scene.Collisions > 0 && scene.Collisions < 120, "strikes in 10 s with a sweeping cursor: " + scene.Collisions);
        check(strikes.Count > 0 && strikes.TrueForAll(l => l >= 0.0f && l <= 1), "strike loudness in [0,1]");

        // Pinned by a parked cursor against the wall: contact-based ringing means it rings once, not every 150 ms.
        var pin = new Scene(new Random(2), bounds); int rings = 0; pin.Struck = (a, b, l) => rings++;
        pin.Orbs[0].X = bounds.Left + pin.Orbs[0].R; pin.Orbs[0].Y = 120; pin.Orbs[1].X = pin.Orbs[0].X + pin.Orbs[0].R + pin.Orbs[1].R + 2; pin.Orbs[1].Y = 120;
        pin.MouseX = pin.Orbs[1].X + pin.Orbs[1].R + 30; pin.MouseY = 120;
        for (int t = 0; t < 300; t++) pin.Tick();
        check(rings <= 10, "pinned pair rings at most every 300 ms in 5 s: " + rings);

        // Audio: offline render with two strikes.
        var synth = new Synth(); var buf = new short[Synth.Frames * 2];
        int total = Synth.Rate * 2 / Synth.Frames; float peak = 0; double sumSq = 0; long differ = 0;
        long strikeAt = -1; double quiet = 0, onset = 0, later = 0;
        synth.SetMotion(0, 220, 4); synth.SetMotion(1, 227, 2);
        for (int i = 0; i < total; i++)
        {
            if (i == 20) strikeAt = synth.Strike(220, 227, 0.8f);
            if (i == 60) synth.Strike(300, 309, 0.3f);
            synth.Render(buf);
            double bufSq = 0;
            for (int n = 0; n < buf.Length; n += 2)
            {
                float l = buf[n] / 32768f, r = buf[n + 1] / 32768f;
                float m = Math.Max(Math.Abs(l), Math.Abs(r)); if (m > peak) peak = m;
                bufSq += l * l + r * r; if (buf[n] != buf[n + 1]) differ++;
            }
            sumSq += bufSq;
            if (i == 19) quiet = bufSq; if (i == 21) onset = bufSq; if (i == 55) later = bufSq;
        }
        float rms = (float)Math.Sqrt(sumSq / (total * Synth.Frames * 2));
        check(peak < 0.99f, "peak below 0.99: " + peak.ToString("0.000"));
        check(rms > 0.01f, "RMS above 0.01: " + rms.ToString("0.000"));
        check(differ > total * Synth.Frames / 2, "left and right differ (binaural): " + differ + " frames");
        check(strikeAt == 20L * Synth.Frames, "strike scheduled at the next rendered frame: " + strikeAt);
        check(onset > 10 * quiet && later < onset, "bell is up one buffer after the strike and decays: " + quiet.ToString("0") + " -> " + onset.ToString("0") + " -> " + later.ToString("0"));
        // Sixteen soft strikes in a row: once all eight bell slots are taken, stealing one must not add
        // a click, i.e. the largest sample-to-sample jump must not grow beyond the pre-stealing level.
        var burst = new Synth(); int jumpFree = 0, jumpSteal = 0; short prevL = 0;
        for (int i = 0; i < 80; i++)
        {
            if (i % 4 == 0 && i < 64) burst.Strike(200 + i * 3, 206 + i * 3, 0.15f);
            burst.Render(buf);
            for (int n = 0; n < buf.Length; n += 2)
            {
                int jump = (n > 0 || i > 0) ? Math.Abs(buf[n] - prevL) : 0; prevL = buf[n];
                if (i < 32) jumpFree = Math.Max(jumpFree, jump); else jumpSteal = Math.Max(jumpSteal, jump);
            }
        }
        // A stolen bell stopping dead would jump about 5000 here (its amplitude times the gain); the tails
        // spread that over 10 ms. Allow the natural growth from more voices, but nothing like a click.
        check(jumpSteal < 2300 && jumpSteal <= jumpFree * 2, "voice stealing does not click: largest jump " + jumpFree + " before stealing, " + jumpSteal + " during");
        check(Synth.FlagsOffset == (IntPtr.Size == 8 ? 24 : 16), "WAVEHDR flags offset matches the process bitness: " + Synth.FlagsOffset);
        // The real device, if there is one: the pump must keep rendering past its first queued buffers.
        var live = new Synth();
        if (live.Start()) { Thread.Sleep(300); long got = live.Rendered; live.Dispose(); check(got > Synth.Buffers * Synth.Frames * 2, "sound device keeps streaming: " + got + " frames in 300 ms"); }
        else lines.Add("SKIP no sound device for the streaming check");
        lines.Add(failures == 0 ? "ALL PASS" : failures + " FAILED");
        System.IO.File.WriteAllLines(reportPath, lines);
        return failures == 0 ? 0 : 1;
    }
}
