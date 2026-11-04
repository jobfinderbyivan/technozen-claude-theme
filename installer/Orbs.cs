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
    public const float Step = 1f / 60f, MaxSpeed = 1.2f, MousePush = 0.0144f, Restitution = 0.6f, WallRestitution = 0.85f, Damping = 0.997f, Drift = 0.08f; // drag only acts above the slow drift speed
    public const float CardScale = 1.5625f; // device pixels per design unit at 96 DPI
    public const float HardHit = 0.2f; // a re-bounce this hard rings even before the pair has separated
    public const float MinClosingSpeed = 0.03f; // px per step; slower touches do not ring
    public readonly List<Orb> Orbs = new List<Orb>();
    public readonly List<float[]> Hits = new List<float[]>(); // x, y, age (starts negative so the flash lands when the bell is heard)
    public RectangleF Bounds;
    public float MouseX = -1e6f, MouseY = -1e6f;   // far away = no force
    public Action<Orb, Orb, float> Struck;          // a, b, loudness 0..1
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

    // True once the hum and every bell have died away to about -60 dB.
    public bool Quiet
    {
        get
        {
            lock (gate)
            {
                foreach (float a in mAmp) if (a > 1e-3f) return false;
                foreach (float a in bAmp) if (a > 1e-3f) return false;
                foreach (float a in tAmp) if (a > 1e-3f) return false;
                return true;
            }
        }
    }

    // The sound is over: a last short ramp so even the faint end never stops dead.
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
    readonly AutoResetEvent bufferDone = new AutoResetEvent(false);
    public volatile int Underruns, FailedWrites; // underrun: the device played out everything queued, an audible gap
    readonly short[] work = new short[Frames * 2];

    public bool Start()
    {
        var fmt = new WaveFormat { Tag = 1, Channels = 2, Rate = Rate, Bits = 16, Align = 4, BytesPerSec = Rate * 4 };
        if (waveOutOpen(out device, -1, ref fmt, bufferDone.SafeWaitHandle.DangerousGetHandle(), IntPtr.Zero, 0x00050000 /* CALLBACK_EVENT */) != 0) { device = IntPtr.Zero; return false; } // no sound device: stay silent
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
            while (running && queued[i] && (Marshal.ReadInt32(headers[i], FlagsOffset) & 1) == 0) bufferDone.WaitOne(30);
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
