// Built only into the test EXE (build_exe.py): the self-test, the frame-rate benchmark and the demo image.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Threading;
using System.Windows.Forms;

partial class Loader
{
    public static void RenderDemo(string pngPath)
    {
        var f = new Loader(7); f.demoTime = 2.0f; f.progress = 0.6f;
        for (int i = 0; i < 30; i++) f.scene.Tick();
        f.scene.Hits.Add(new[] { f.scene.Orbs[0].X + f.scene.Orbs[0].R, f.scene.Orbs[0].Y, 0.3f });
        f.Render();
        using (var bmp = new Bitmap(f.Width, f.Height))
        {
            using (var g = Graphics.FromImage(bmp)) { IntPtr dc = g.GetHdc(); BitBlt(dc, 0, 0, f.Width, f.Height, f.mem, 0, 0, 0x00CC0020); g.ReleaseHdc(dc); }
            bmp.Save(pngPath, ImageFormat.Png);
        }
    }

    // --fps <report> [busy threads]: shows the card silently for 5 s, the mouse untouched, and reports what it really achieved.
    public static void RunFpsTest(string reportPath, int busyThreads)
    {
        var f = new Loader(7); var stop = new ManualResetEvent(false);
        for (int c = 0; c < busyThreads; c++) { var h = new Thread(() => { double x = 1; while (!stop.WaitOne(0)) for (int k = 0; k < 20000; k++) x = Math.Sqrt(x + 1); }) { IsBackground = true }; h.Start(); }
        var done = new System.Windows.Forms.Timer { Interval = 5000 };
        done.Tick += (s, e) => { done.Stop(); File.WriteAllText(reportPath, f.FrameReport() + "\r\n"); stop.Set(); f.Close(); };
        f.Shown += (s, e) => { f.Begin(false); done.Start(); };
        Application.Run(f);
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
        check(strikes.Count > 0 && strikes.Count < 30, "strikes in 10 s with a sweeping cursor: " + strikes.Count);
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
        check(fastest * pxPerSec <= 135, "fastest orb over 50 boots: " + (fastest * pxPerSec).ToString("0") + " px/s (limit 135, a one-frame contact nudge above the 94 px/s cap)");
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
        // A parked cursor right beside an orb eases it into motion; the lightest takes about 0.2 s to reach 40 px/s, the heaviest far longer.
        Func<float, int> easeIn = r =>
        {
            var e = new Scene(new Random(1), bounds); while (e.Orbs.Count > 1) e.Orbs.RemoveAt(1);
            var o = e.Orbs[0]; o.R = r; o.Mass = (float)Math.Pow(r, 3); o.X = 230; o.Y = 120; o.Vx = 0; o.Vy = 0; e.MouseX = 230 - r - 5; e.MouseY = 120;
            for (int t = 1; t <= 600; t++) { e.Tick(); if (o.Speed * pxPerSec >= 40) return t; }
            return 600;
        };
        int easeLight = easeIn(26), easeHeavy = easeIn(77);
        check(easeLight >= 11, "lightest orb takes " + easeLight + " steps to reach 40 px/s (at least 11)");
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
        // The proof may land on the clipboard before the helper starts looking (real start, 1.4.0): it must still count.
        try { Clipboard.SetText("technozen-proof"); check(Watcher.ThemeRan("technozen-proof", 50), "proof already on the clipboard is seen"); check(!Watcher.ThemeRan("something else", 50), "other clipboard text is not proof"); }
        catch (System.Runtime.InteropServices.ExternalException) { lines.Add("SKIP clipboard refused, usually a locked screen; rerun unlocked"); }
        lines.Add(failures == 0 ? "ALL PASS" : failures + " FAILED");
        System.IO.File.WriteAllLines(reportPath, lines);
        return failures == 0 ? 0 : 1;
    }
}
