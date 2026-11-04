// The singing glass orbs on the start-up card: a tiny physics scene and a tiny stereo synth.
// Physics: 3 or 4 glass spheres with mass, walls, soft collisions, and the mouse as a gentle reverse gravity.
// Audio: an orb's pitch is inversely proportional to its radius, on a pentatonic scale so any two agree.
// Each orb hums while it moves; a collision rings both orbs' bowls, each with the right ear a few Hz
// above the left (true binaural), as loud as the closing speed. Sines from a table, exponential decays
// as multiplies, one clean limiter: nothing heavier than that, so it runs anywhere.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;

class Orb
{
    public float X, Y, Vx, Vy, R, Mass, Freq, Beat;
    public Color Tint;
    public float Speed { get { return (float)Math.Sqrt(Vx * Vx + Vy * Vy); } }
}

class Scene
{
    // Zen: orbs float. The cap is rarely reached, pushes ease in over a second, and contacts are soft.
    public const float Step = 1f / 60f, MaxSpeed = 1f, MousePush = 0.012f, Restitution = 0.6f, WallRestitution = 0.85f, Damping = 0.997f, Drift = 0.08f; // drag only acts above the slow drift speed
    public const float CardScale = 1.5625f; // device pixels per design unit at 96 DPI
    public const float HardHit = 0.2f; // a re-bounce this hard rings even before the pair has separated
    public const float MinClosingSpeed = 0.03f; // px per step; slower touches do not ring
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
        int count = 3 + rng.Next(2);
        Color[] tints = { Color.FromArgb(120, 230, 255), Color.FromArgb(196, 242, 120), Color.FromArgb(200, 170, 255), Color.FromArgb(150, 200, 240), Color.FromArgb(255, 190, 220) };
        // Radii are the largest (77) over a major pentatonic ratio, so pitch = pitchTimesRadius / radius lands on the
        // scale. One from each band of the scale: always a low, a high and something between, largest placed first.
        float[] ratios = { 1f, 9f / 8, 5f / 4, 3f / 2, 5f / 3, 2f, 9f / 4, 5f / 2, 3f };
        var radii = new List<float>();
        for (int i = 0; i < count; i++) { int lo = i * ratios.Length / count, hi = (i + 1) * ratios.Length / count; radii.Add(77 / ratios[lo + rng.Next(hi - lo)]); }
        float pitchTimesRadius = (180 + (float)rng.NextDouble() * 40) * 77; // largest orb at 180 to 220 Hz: a different key each boot
        for (int i = 0; i < count; i++)
        {
            var o = new Orb { R = radii[i], Tint = tints[(i + rng.Next(5)) % 5], Beat = 4 + (float)rng.NextDouble() * 3 };
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
            o.Freq = pitchTimesRadius / o.R; // set after placement, which may have shrunk it
            double a = rng.NextDouble() * Math.PI * 2; float v = Drift + (float)rng.NextDouble() * 0.07f;
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
            // The push fades with distance from the orb's surface and shrinks with its size, so big orbs lean away slowly.
            float dx = o.X - MouseX, dy = o.Y - MouseY, d = Math.Max(0.01f, (float)Math.Sqrt(dx * dx + dy * dy)), gap = Math.Max(0, d - o.R);
            if (gap < 160) { float a = MousePush * (float)Math.Pow(50 / o.R, 1.5) * 1600 / (gap * gap + 1600); o.Vx += a * dx / d; o.Vy += a * dy / d; }
            float s = o.Speed; if (s > Drift) { float k = Math.Max(Damping, Drift / s); o.Vx *= k; o.Vy *= k; s *= k; }
            if (s > MaxSpeed) { o.Vx *= MaxSpeed / s; o.Vy *= MaxSpeed / s; }
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
                bool first = !touching[i, j]; if (-vrel >= MinClosingSpeed) touching[i, j] = true;
                if ((!first && -vrel < HardHit) || -vrel < MinClosingSpeed || step - lastRing[i, j] < 18) continue;
                lastRing[i, j] = step;
                // Loudness from the closing speed, heavier for big pairs, with a curve that keeps drifts
                // soft and lets a hard mouse-flung hit go all the way: force decides the volume.
                float size = 0.6f + 0.4f * (float)Math.Min(1, Math.Sqrt(1 / (ia + ib) / 150000f));
                float loud = Math.Min(1f, (float)Math.Pow(-vrel / (1.2f * MaxSpeed), 1.5) * 1.5f * size);
                Collisions++;
                Hits.Add(new[] { a.X + nx * a.R, a.Y + ny * a.R, -0.3f });
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
    public const int Rate = 48000, Frames = 960, Buffers = 4; // 20 ms buffers, 80 ms queued
    const int MaxMotion = 5, MaxBells = 12, Partials = 4; // a collision takes two bells, one per orb
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
    const float Attack = 1f / (0.3f * Rate), Release = 1f / (0.8f * Rate), BellAttackFrames = 0.015f * Rate, MasterGain = 0.5f, Silent = 3e-5f;
    // The limiter turns the whole stereo mix down together instead of bending the waveform: it sees a crest
    // 10 ms before it is heard and glides there, holding 50 ms so the crest pattern of two notes cannot shake the gain.
    const float Ceiling = 0.85f; const int LookAhead = 480, Hold = 2400;
    static readonly float LimiterFall = (float)Math.Exp(-1.0 / (0.25 * Rate)), LimiterGlide = (float)(1 - Math.Exp(-1.0 / (0.002 * Rate)));
    readonly float[] delayL = new float[LookAhead], delayR = new float[LookAhead];
    int delayPos, holdLeft; float limiterPeak, limiterGain = 1, fade = 1, fadeStep;

    // The card is closing: ramp to silence so the sound never stops dead.
    public void FadeOut() { lock (gate) fadeStep = 1f / (0.25f * Rate); }

    public void SetMotion(int voice, float freq, float speed)
    {
        lock (gate) { mInc[voice] = freq / Rate; mTarget[voice] = Math.Min(1f, speed / Scene.MaxSpeed) * 0.1f; }
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
                    bInc[slot, k] = f / Rate; bAmp[slot, k] = PartialAmp[p] * loud;
                    for (int i = 0; i < MaxBells; i++) // the same pitch already ringing: join its phase so the two add, never cancel
                        if (i != slot && bActive[i] && Math.Abs(bInc[i, k] - bInc[slot, k]) < 1e-7f) { bPhase[slot, k] = bPhase[i, k]; break; }
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
                l *= MasterGain; r *= MasterGain;
                float peak = Math.Max(Math.Abs(l), Math.Abs(r));
                if (peak >= limiterPeak) { limiterPeak = peak; holdLeft = Hold; } else if (holdLeft > 0) holdLeft--; else limiterPeak *= LimiterFall;
                limiterGain += ((limiterPeak > Ceiling ? Ceiling / limiterPeak : 1) - limiterGain) * LimiterGlide;
                fade = Math.Max(0, fade - fadeStep);
                float gain = limiterGain * fade, outL = delayL[delayPos] * gain, outR = delayR[delayPos] * gain;
                delayL[delayPos] = l; delayR[delayPos] = r; delayPos = (delayPos + 1) % LookAhead;
                buf[2 * n] = (short)(Math.Max(-1f, Math.Min(1f, outL)) * 32767);
                buf[2 * n + 1] = (short)(Math.Max(-1f, Math.Min(1f, outR)) * 32767);
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
    public volatile int Underruns, FailedWrites; // underrun: the device played out everything queued, an audible gap
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
        pump = new Thread(Pump) { IsBackground = true, Priority = ThreadPriority.Highest };
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
            int newest = (i + Buffers - 1) % Buffers; // checked last, so a stall while rendering counts too
            if (queued[newest] && (Marshal.ReadInt32(headers[newest], FlagsOffset) & 1) != 0) Underruns++;
            if (waveOutWrite(device, headers[i], Marshal.SizeOf(typeof(WaveHdr))) != 0) { FailedWrites++; Thread.Sleep(20); continue; }
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
    // Amplitude of one frequency in a sample run (Goertzel with a Hann window, so neighbouring partials do not leak in).
    static double Tone(List<float> x, double freq)
    {
        double w = 2 * Math.PI * freq / Synth.Rate, c = 2 * Math.Cos(w), s1 = 0, s2 = 0;
        for (int i = 0; i < x.Count; i++) { double s0 = x[i] * (0.5 - 0.5 * Math.Cos(2 * Math.PI * i / x.Count)) + c * s1 - s2; s2 = s1; s1 = s0; }
        return Math.Sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) + 1e-12;
    }
    // A collision as the card plays it: both bowls at 0.6. Returns peak and RMS over a second, left ear.
    static double[] Hit(float loud, short[] buf)
    {
        var y = new Synth(); y.Strike(220, 226, loud * 0.6f); y.Strike(330, 335, loud * 0.6f); double p = 0, sq = 0; int count = 0;
        for (int i = 0; i < 50; i++) { y.Render(buf); for (int n = 0; n < buf.Length; n += 2) { double v = buf[n] / 32768.0; p = Math.Max(p, Math.Abs(v)); sq += v * v; count++; } }
        return new[] { p, Math.Sqrt(sq / count) };
    }
    // Loudest energy at frequencies no partial of a 200 Hz and a 300 Hz bowl occupies, relative to the 200 Hz fundamental.
    static double Products(List<float> x)
    {
        double worst = 0; foreach (double f in new[] { 178.0, 250.0, 700.0, 1000.0 }) worst = Math.Max(worst, Tone(x, f));
        return 20 * Math.Log10(worst / Tone(x, 200));
    }
    static List<float> Collide(float loud, int repeatAfter, short[] buf)
    {
        var y = new Synth(); var x = new List<float>();
        for (int i = 0; i < 40; i++)
        {
            if (i == 0 || i == repeatAfter) { y.Strike(200, 206, loud * 0.6f); y.Strike(300, 305, loud * 0.6f); }
            y.Render(buf); if (i >= 2 + Math.Max(0, repeatAfter) && i < 22 + Math.Max(0, repeatAfter)) for (int n = 0; n < buf.Length; n += 2) x.Add(buf[n] / 32768f);
        }
        return x;
    }

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
                { Orb x = s.Orbs[i], y = s.Orbs[j]; if (Math.Abs(x.Freq * x.R / (y.Freq * y.R) - 1) > 0.001 || x.Freq < 150 || x.Freq > 800 || x.Beat < 4 || x.Beat > 7) bad++; }
        }
        check(bad == 0, "2000 seeds: no overlap over 1 px at start, inside the face, pitch inversely proportional to size, 150 to 800 Hz, 4 to 7 Hz binaural (bad: " + bad + ")");

        // Two orbs head on: momentum conserved, they separate, and the bell is as loud as the closing speed says.
        var pair = new Scene(new Random(3), bounds);
        while (pair.Orbs.Count > 2) pair.Orbs.RemoveAt(2);
        Orb A = pair.Orbs[0], B = pair.Orbs[1];
        A.X = 150; A.Y = 120; A.Vx = 0.4f * Scene.MaxSpeed; A.Vy = 0; B.X = 150 + A.R + B.R + 8; B.Y = 120; B.Vx = -0.4f * Scene.MaxSpeed; B.Vy = 0; // under the cap even after the lighter one recoils
        float px0 = A.Mass * A.Vx + B.Mass * B.Vx; float loudSeen = -1; pair.Struck = (a, b, l) => loudSeen = l;
        for (int t = 0; t < 30; t++) pair.Tick();
        float px1 = A.Mass * A.Vx + B.Mass * B.Vx, expected = px0 * (float)Math.Pow(Scene.Damping, 30); // damping takes its share each step; the collision must take none
        check(Math.Abs(px1 - expected) < Math.Abs(px0) * 0.01f + 1, "head-on: momentum conserved apart from damping (" + px0.ToString("0") + " -> " + px1.ToString("0") + ", expected " + expected.ToString("0") + ")");
        check(B.Vx > A.Vx && Scene.Dist(A, B) >= A.R + B.R, "head-on: they separate after the hit");
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
        check(scene.Collisions > 0 && scene.Collisions < 30, "strikes in 10 s with a sweeping cursor: " + scene.Collisions);
        check(strikes.Count > 0 && strikes.TrueForAll(l => l >= 0.0f && l <= 1), "strike loudness in [0,1]");

        // Pinned by a parked cursor against the wall: contact-based ringing means it rings once, not every 150 ms.
        var pin = new Scene(new Random(2), bounds); while (pin.Orbs.Count > 2) pin.Orbs.RemoveAt(2); int rings = 0; pin.Struck = (a, b, l) => rings++;
        pin.Orbs[0].X = bounds.Left + pin.Orbs[0].R; pin.Orbs[0].Y = 120; pin.Orbs[1].X = pin.Orbs[0].X + pin.Orbs[0].R + pin.Orbs[1].R + 2; pin.Orbs[1].Y = 120;
        pin.MouseX = pin.Orbs[1].X + pin.Orbs[1].R + 30; pin.MouseY = 120;
        for (int t = 0; t < 300; t++) pin.Tick();
        check(rings <= 2, "a pair held together by the cursor rings at most twice in 5 s: " + rings);


        // Zen: measured in what the eye sees, device pixels per second at 96 DPI.
        float pxPerSec = Scene.CardScale * 60;
        var counts = new HashSet<int>(); for (int seed = 0; seed < 200; seed++) counts.Add(new Scene(new Random(seed), bounds).Orbs.Count);
        check(counts.Count == 2 && counts.Contains(3) && counts.Contains(4), "3 or 4 orbs per boot");
        // Over many boots on the card's real face, with a sweeping cursor: what the eye sees per frame, and how rarely the cap is touched.
        var face = new RectangleF(18, 18, 424, 264); float fastest = 0; double speedSum = 0; long speedN = 0, atCap = 0;
        for (int seed = 0; seed < 50; seed++)
        {
            var calm = new Scene(new Random(seed), face); var lastX = new float[4]; var lastY = new float[4];
            for (int t = 0; t < 600; t++)
            {
                for (int i = 0; i < calm.Orbs.Count; i++) { lastX[i] = calm.Orbs[i].X; lastY[i] = calm.Orbs[i].Y; }
                calm.MouseX = 20 + t * 0.7f; calm.MouseY = 150 + (float)Math.Sin(t / 25f) * 90; calm.Tick();
                for (int i = 0; i < calm.Orbs.Count; i++)
                {
                    float dx = calm.Orbs[i].X - lastX[i], dy = calm.Orbs[i].Y - lastY[i], moved = (float)Math.Sqrt(dx * dx + dy * dy);
                    fastest = Math.Max(fastest, moved); speedSum += moved; speedN++; if (moved >= Scene.MaxSpeed * 0.98f) atCap++;
                }
            }
        }
        check(fastest * pxPerSec <= 125, "fastest orb over 50 boots: " + (fastest * pxPerSec).ToString("0") + " px/s (limit 125, including contact nudges)");
        check(speedSum / speedN * pxPerSec <= 45, "average orb over 50 boots: " + (speedSum / speedN * pxPerSec).ToString("0") + " px/s (limit 45)");
        check(atCap < speedN / 20, "orbs at the speed cap under 5% of the time: " + (100.0 * atCap / speedN).ToString("0.0") + "%");
        // Left alone for a typical 14 s start: still drifting, and most boots ring softly by themselves.
        int stopped = 0, silent = 0; float loudestAlone = 0;
        for (int seed = 0; seed < 200; seed++)
        {
            var alone = new Scene(new Random(seed), face); int rung = 0; alone.Struck = (a, b, l) => { rung++; loudestAlone = Math.Max(loudestAlone, l); };
            for (int t = 0; t < 840; t++) alone.Tick();
            bool moving = false; foreach (var o in alone.Orbs) if (o.Speed >= 0.02f) moving = true;
            if (!moving) stopped++; if (rung == 0) silent++;
        }
        check(stopped == 0, "no cursor, 14 s: orbs still drifting on all 200 boots (stopped: " + stopped + ")");
        check(silent < 100, "no cursor, 14 s: boots that never ring: " + silent + " of 200");
        check(loudestAlone < 0.3f, "no cursor: drifting touches stay soft, loudest " + loudestAlone.ToString("0.00"));
        // A parked cursor right beside an orb eases it into motion; the lightest takes at least 0.2 s to reach 40 px/s, the heaviest far longer.
        Func<float, int> easeIn = r =>
        {
            var e = new Scene(new Random(1), bounds); while (e.Orbs.Count > 1) e.Orbs.RemoveAt(1);
            var o = e.Orbs[0]; o.R = r; o.Mass = (float)Math.Pow(r, 3); o.X = 230; o.Y = 120; o.Vx = 0; o.Vy = 0; e.MouseX = 230 - r - 5; e.MouseY = 120;
            for (int t = 1; t <= 600; t++) { e.Tick(); if (o.Speed * pxPerSec >= 40) return t; }
            return 600;
        };
        int easeLight = easeIn(26), easeHeavy = easeIn(77);
        check(easeLight >= 12, "lightest orb takes " + easeLight + " steps to reach 40 px/s (at least 12)");
        check(easeHeavy >= 3 * easeLight, "heaviest orb responds far more slowly: " + easeHeavy + " steps");

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
        // Sixteen soft strikes in a row: once all twelve bell slots are taken, stealing one must not add
        // a click, i.e. the largest sample-to-sample jump must not grow beyond the pre-stealing level.
        var burst = new Synth(); int jumpFree = 0, jumpSteal = 0; short prevL = 0;
        for (int i = 0; i < 80; i++)
        {
            if (i % 2 == 0 && i < 32) burst.Strike(60 + i * 0.85f, 66 + i * 0.85f, 0.2f); // low notes barely move between samples, so a step stands out
            burst.Render(buf);
            for (int n = 0; n < buf.Length; n += 2)
            {
                int jump = (n > 0 || i > 0) ? Math.Abs(buf[n] - prevL) : 0; prevL = buf[n];
                if (i < 24) jumpFree = Math.Max(jumpFree, jump); else jumpSteal = Math.Max(jumpSteal, jump);
            }
        }
        check(jumpSteal <= jumpFree * 2, "voice stealing does not click: largest jump " + jumpFree + " before stealing, " + jumpSteal + " during");
        check(Synth.FlagsOffset == (IntPtr.Size == 8 ? 24 : 16), "WAVEHDR flags offset matches the process bitness: " + Synth.FlagsOffset);

        // Clean at full force: one bell has no energy at three times its fundamental unless the output stage is distorting.
        var clean = new Synth(); clean.Strike(220, 227, 1f); var cleanL = new List<float>();
        for (int i = 0; i < 12; i++) { clean.Render(buf); if (i >= 2) for (int n = 0; n < buf.Length; n += 2) cleanL.Add(buf[n] / 32768f); }
        double thirdDb = 20 * Math.Log10(Tone(cleanL, 660) / Tone(cleanL, 220));
        check(thirdDb < -40, "full-force bell, third harmonic: " + thirdDb.ToString("0.0") + " dB (limit -40)");
        // Eight full-force bells at once stay under the ceiling.
        var pile = new Synth(); float pilePeak = 0; for (int b = 0; b < 8; b++) pile.Strike(200 + b * 30, 206 + b * 30, 1f);
        var pileL = new List<float>();
        for (int i = 0; i < 40; i++) { pile.Render(buf); foreach (short v in buf) pilePeak = Math.Max(pilePeak, Math.Abs(v) / 32768f); if (i >= 5 && i < 15) for (int n = 0; n < buf.Length; n += 2) pileL.Add(buf[n] / 32768f); }
        check(pilePeak <= 0.9f, "eight full bells at once: peak " + pilePeak.ToString("0.00") + " (limit 0.90)");
        double pileThird = 20 * Math.Log10(Tone(pileL, 3 * 200) / Tone(pileL, 200));
        check(pileThird < -45, "eight full bells at once, distortion product at 600 Hz: " + pileThird.ToString("0.0") + " dB (limit -45)");
        // The hardest collisions, alone and overlapping, stay clean: nothing appears where no partial lives.
        double productsFull = Products(Collide(1f, -1, buf)), productsOverlap = Products(Collide(0.9f, 15, buf));
        check(productsFull < -50, "full-force collision, products away from any partial: " + productsFull.ToString("0.0") + " dB (limit -50)");
        check(productsOverlap < -50, "two hard collisions overlapping, products away from any partial: " + productsOverlap.ToString("0.0") + " dB (limit -50)");
        // Force still decides the volume: every step harder is louder, and the peak never drops.
        double[] h25 = Hit(0.25f, buf), h50 = Hit(0.5f, buf), h75 = Hit(0.75f, buf), h100 = Hit(1f, buf);
        check(h25[1] < h50[1] && h50[1] < h75[1] && h75[1] < h100[1] && h25[0] < h50[0] && h50[0] < h75[0] && h75[0] <= h100[0] + 0.001,
            "harder hits are louder: RMS " + h25[1].ToString("0.000") + " " + h50[1].ToString("0.000") + " " + h75[1].ToString("0.000") + " " + h100[1].ToString("0.000") + ", peak " + h25[0].ToString("0.00") + " " + h50[0].ToString("0.00") + " " + h75[0].ToString("0.00") + " " + h100[0].ToString("0.00"));
        // A second hit on a ringing orb never makes either ear quieter than leaving it alone.
        double worstDrop = 0;
        for (float f = 180; f < 400; f += 15)
            foreach (int gap in new[] { 15, 25, 50 })
                foreach (float second in new[] { 0.05f, 0.15f, 0.3f })
                {
                    var one = new Synth(); var two = new Synth(); double[] a1 = new double[2], a2 = new double[2];
                    one.Strike(f, f + 6, 0.3f); two.Strike(f, f + 6, 0.3f);
                    for (int i = 0; i < gap + 25; i++)
                    {
                        if (i == gap) two.Strike(f, f + 6, second);
                        one.Render(buf); if (i > gap) for (int n = 0; n < buf.Length; n += 2) { a1[0] += buf[n] * (double)buf[n]; a1[1] += buf[n + 1] * (double)buf[n + 1]; }
                        two.Render(buf); if (i > gap) for (int n = 0; n < buf.Length; n += 2) { a2[0] += buf[n] * (double)buf[n]; a2[1] += buf[n + 1] * (double)buf[n + 1]; }
                    }
                    worstDrop = Math.Min(worstDrop, 10 * Math.Log10(Math.Min(a2[0] / a1[0], a2[1] / a1[1])));
                }
        check(worstDrop > -0.1, "a second hit on a ringing orb never quiets it: worst " + worstDrop.ToString("0.00") + " dB");
        // Closing: the sound glides to silence inside the card's fade, with no step.
        var closing = new Synth(); closing.Strike(220, 226, 0.8f); for (int i = 0; i < 5; i++) closing.Render(buf);
        closing.FadeOut(); int closeJump = 0; short prevClose = 0; float closeEnd = 0;
        for (int i = 0; i < 15; i++) { closing.Render(buf); for (int n = 0; n < buf.Length; n += 2) { if (n > 0 || i > 0) closeJump = Math.Max(closeJump, Math.Abs(buf[n] - prevClose)); prevClose = buf[n]; if (i == 14) closeEnd = Math.Max(closeEnd, Math.Abs(buf[n])); } }
        check(closeEnd == 0 && closeJump < 2500, "closing fades to silence in 300 ms: end level " + closeEnd + ", largest step " + closeJump);
        // The real device, if there is one: the pump must keep rendering past its first queued buffers.
        var live = new Synth();
        if (live.Start())
        {
            Thread.Sleep(300); long got = live.Rendered;
            check(got > Synth.Buffers * Synth.Frames * 2 && live.FailedWrites == 0, "sound device keeps streaming: " + got + " frames in 300 ms, " + live.FailedWrites + " failed writes");
            // Claude's start-up pegs the machine: every core busy for 6 s must not leave a gap in the sound.
            var stop = new ManualResetEvent(false); var hogs = new List<Thread>();
            for (int c = 0; c < Environment.ProcessorCount * 2; c++) { var h = new Thread(() => { double x = 1; while (!stop.WaitOne(0)) for (int k = 0; k < 20000; k++) x = Math.Sqrt(x + 1); }) { IsBackground = true }; h.Start(); hogs.Add(h); }
            int before2 = live.Underruns; Thread.Sleep(6000); stop.Set(); foreach (var h in hogs) h.Join();
            check(live.Underruns == before2 && live.FailedWrites == 0, "no gaps with every core busy for 6 s: " + (live.Underruns - before2) + " underruns, " + live.FailedWrites + " failed writes");
            live.Dispose();
        }
        else lines.Add("SKIP no sound device for the streaming check");
        lines.Add(failures == 0 ? "ALL PASS" : failures + " FAILED");
        System.IO.File.WriteAllLines(reportPath, lines);
        return failures == 0 ? 0 : 1;
    }
}
