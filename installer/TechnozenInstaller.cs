// Technozen for Claude: Windows installer and background helper.
// Build: python installer/build_exe.py  (uses the C# compiler that ships with Windows, no SDK needed)
//
// How it keeps the theme on. The Claude desktop app has no plugin hook and blocks remote debugging,
// but with Developer Mode on it opens DevTools by itself whenever the environment variable
// CLAUDE_DEV_TOOLS is set. Install therefore: copies this EXE to a permanent folder, turns Developer
// Mode on (a JSON file), sets CLAUDE_DEV_TOOLS=undocked for the user, and starts a helper (also at
// every login). The helper watches for a new Claude window, shows a loading card at once, hides
// Claude's window the moment it exists, waits for the DevTools window, pastes the theme into the
// console with keystrokes (DevTools parked off-screen), closes DevTools, then shows Claude already
// themed and fades the card out. So Claude can be started any way at all and never paints white.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        if (args.Length > 0 && args[0] == "--watch") { Watcher.Run(); return; }
#if TESTS
        if (args.Length > 1 && args[0] == "--demo") { Loader.RenderDemo(args[1]); return; }
        if (args.Length > 1 && args[0] == "--fps") { Loader.RunFpsTest(args[1], args.Length > 2 ? int.Parse(args[2]) : 0); return; }
        if (args.Length > 1 && args[0] == "--selftest") { Environment.Exit(SelfTest.Run(args[1])); return; }
#endif
        Application.Run(new MainForm());
    }
}

static class Native
{
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint msg, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    public const uint WM_CLOSE = 0x0010, SWP_NOSIZE = 0x0001, SWP_NOZORDER = 0x0004, SWP_NOACTIVATE = 0x0010;
    public const int SW_HIDE = 0, SW_SHOW = 5;

    // Visible top-level windows of one process: title, handle.
    public static List<KeyValuePair<string, IntPtr>> WindowsOf(int pid)
    {
        var list = new List<KeyValuePair<string, IntPtr>>();
        EnumWindows((h, l) =>
        {
            if (!IsWindowVisible(h)) return true;
            uint owner; GetWindowThreadProcessId(h, out owner);
            if (owner != pid) return true;
            var sb = new StringBuilder(256); GetWindowText(h, sb, sb.Capacity);
            list.Add(new KeyValuePair<string, IntPtr>(sb.ToString(), h));
            return true;
        }, IntPtr.Zero);
        return list;
    }

    public static bool IsDevToolsTitle(string t) { return t.Contains("DevTools") || t.Contains("Developer Tools"); }
}

// While the theme is being typed into DevTools, real clicks and keystrokes are swallowed so nothing can
// take the keyboard focus away; the helper's own injected input passes. Hooks are installed from the
// UI thread (they need its message loop) and Windows drops them by itself if the helper dies.
static class InputShield
{
    delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] static extern IntPtr SetWindowsHookEx(int id, HookProc proc, IntPtr module, uint thread);
    [DllImport("user32.dll")] static extern bool UnhookWindowsHookEx(IntPtr hook);
    [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr hook, int code, IntPtr wParam, IntPtr lParam);
    [DllImport("kernel32.dll")] static extern IntPtr GetModuleHandle(string name);
    static readonly HookProc keyProc = KeyHook, mouseProc = MouseHook; // kept alive: the callback must not be collected
    static IntPtr keyHook, mouseHook;

    public static void On()
    {
        IntPtr module = GetModuleHandle(null);
        if (keyHook == IntPtr.Zero) keyHook = SetWindowsHookEx(13, keyProc, module, 0);   // WH_KEYBOARD_LL
        if (mouseHook == IntPtr.Zero) mouseHook = SetWindowsHookEx(14, mouseProc, module, 0); // WH_MOUSE_LL
    }

    public static void Off()
    {
        if (keyHook != IntPtr.Zero) { UnhookWindowsHookEx(keyHook); keyHook = IntPtr.Zero; }
        if (mouseHook != IntPtr.Zero) { UnhookWindowsHookEx(mouseHook); mouseHook = IntPtr.Zero; }
    }

    static IntPtr KeyHook(int code, IntPtr wParam, IntPtr lParam)
    {
        bool injected = (Marshal.ReadInt32(lParam, 8) & 0x10) != 0; // KBDLLHOOKSTRUCT.flags, LLKHF_INJECTED
        return code >= 0 && !injected ? (IntPtr)1 : CallNextHookEx(keyHook, code, wParam, lParam);
    }

    static IntPtr MouseHook(int code, IntPtr wParam, IntPtr lParam)
    {
        int msg = (int)wParam;
        bool button = msg >= 0x0201 && msg <= 0x020D && msg != 0x0209 && msg != 0x020A; // any button down/up/double-click, not move or wheel
        bool injected = (Marshal.ReadInt32(lParam, 12) & 0x01) != 0; // MSLLHOOKSTRUCT.flags, LLMHF_INJECTED
        return code >= 0 && button && !injected ? (IntPtr)1 : CallNextHookEx(mouseHook, code, wParam, lParam);
    }
}

static class Paths
{
    static readonly string Local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    public const string EnvName = "CLAUDE_DEV_TOOLS";

    // Where Claude keeps its settings: the Store (MSIX) build uses Claude-Data\claude_<id>, older installs %APPDATA%\Claude.
    public static string UserData()
    {
        string data = Path.Combine(Local, "Claude-Data");
        if (Directory.Exists(data))
            foreach (string d in Directory.GetDirectories(data, "claude_*")) return d;
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Claude");
    }

    public static string DeveloperSettings() { return Path.Combine(UserData(), "developer_settings.json"); }

    // The Store build is launched through its alias; it accepts arguments and environment variables.
    public static string ClaudeExe()
    {
        string alias = Path.Combine(Local, "Microsoft", "WindowsApps", "claude-desktop.exe");
        if (File.Exists(alias)) return alias;
        string classic = Path.Combine(Local, "AnthropicClaude", "claude.exe");
        if (File.Exists(classic)) return classic;
        return null;
    }

    // The desktop app and the Claude Code CLI are both called claude.exe; only the app's path counts.
    public static bool IsClaudeApp(Process p)
    {
        try
        {
            string f = p.MainModule.FileName.ToLowerInvariant();
            return f.EndsWith(@"\app\claude.exe") || f.EndsWith(@"\anthropicclaude\claude.exe");
        }
        catch { return false; }
    }

    public static Process[] AppProcesses() { return Array.FindAll(Process.GetProcessesByName("claude"), IsClaudeApp); }
    public static string InstallDir() { return Path.Combine(Local, "Programs", "Technozen for Claude"); }
    public static string InstalledExe() { return Path.Combine(InstallDir(), "Technozen for Claude.exe"); }
    public static string StartupShortcut() { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Startup), "Technozen for Claude.lnk"); }
    public static bool RunningFromCopy() { return string.Equals(Application.ExecutablePath, InstalledExe(), StringComparison.OrdinalIgnoreCase); }

    public static bool DeveloperModeOn()
    {
        string f = DeveloperSettings();
        return File.Exists(f) && File.ReadAllText(f).Replace(" ", "").Contains("\"allowDevTools\":true");
    }
}

static class Install
{
    static void KillHelpers() // an older helper or copy in use
    {
        foreach (Process p in Process.GetProcessesByName("Technozen for Claude"))
            if (p.Id != Process.GetCurrentProcess().Id) { try { p.Kill(); p.WaitForExit(3000); } catch { } }
    }

    public static void Apply()
    {
        // The app's schema has exactly one key, allowDevTools, so writing the whole file is safe.
        Directory.CreateDirectory(Paths.UserData());
        File.WriteAllText(Paths.DeveloperSettings(), "{\n  \"allowDevTools\": true\n}\n");
        // User-level variable: written to the registry and broadcast, so new launches from Start or the taskbar see it.
        Environment.SetEnvironmentVariable(Paths.EnvName, "undocked", EnvironmentVariableTarget.User);
        Directory.CreateDirectory(Paths.InstallDir());
        KillHelpers();
        if (!Paths.RunningFromCopy()) File.Copy(Application.ExecutablePath, Paths.InstalledExe(), true);
        Type shell = Type.GetTypeFromProgID("WScript.Shell");
        dynamic ws = Activator.CreateInstance(shell);
        dynamic lnk = ws.CreateShortcut(Paths.StartupShortcut());
        lnk.TargetPath = Paths.InstalledExe();
        lnk.Arguments = "--watch";
        lnk.Description = "Applies the Technozen theme whenever Claude starts";
        lnk.Save();
        if (!Watcher.IsRunning()) Process.Start(new ProcessStartInfo(Paths.InstalledExe(), "--watch") { UseShellExecute = false });
    }

    public static void Remove(bool developerModeOff)
    {
        Environment.SetEnvironmentVariable(Paths.EnvName, null, EnvironmentVariableTarget.User);
        if (File.Exists(Paths.StartupShortcut())) File.Delete(Paths.StartupShortcut());
        KillHelpers();
        if (developerModeOff && File.Exists(Paths.DeveloperSettings())) File.Delete(Paths.DeveloperSettings());
        if (!Paths.RunningFromCopy() && Directory.Exists(Paths.InstallDir())) Directory.Delete(Paths.InstallDir(), true);
    }

    // Restart Claude so the theme shows now; the helper does the rest. Claude is asked to close, never killed.
    public static string RestartClaude()
    {
        if (Paths.ClaudeExe() == null) return "Could not find the Claude desktop app on this PC.";
        if (Paths.AppProcesses().Length > 0)
        {
            var answer = MessageBox.Show("Claude is running and has to be closed to apply the theme now. Unsaved text and any Claude Code session running inside the app will be lost.\n\nClose Claude now?",
                "Technozen for Claude", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (answer != DialogResult.Yes) return "Installed. The theme will be on the next time Claude starts.";
            foreach (Process p in Paths.AppProcesses()) { try { p.CloseMainWindow(); } catch { } }
            for (int i = 0; i < 75 && Paths.AppProcesses().Length > 0; i++) Thread.Sleep(200);
            if (Paths.AppProcesses().Length > 0) return "Claude did not close (a dialog may be open). Close it yourself and start it again; the theme comes on by itself.";
            Thread.Sleep(1000);
        }
        var psi = new ProcessStartInfo(Paths.ClaudeExe()) { UseShellExecute = false };
        psi.EnvironmentVariables[Paths.EnvName] = "undocked";
        try { Process.Start(psi); } catch (Exception e) { return "Could not start Claude: " + e.Message; }
        return "Claude is starting with the theme on.";
    }
}

// The helper. Runs a message loop so the loading card can animate while a worker thread types.
class Watcher : ApplicationContext
{
    const string MutexName = "Local\\TechnozenForClaudeWatcher";
    const int IdlePoll = 15000, ActivePoll = 30; // the event finds Claude; the slow poll is only a safety net
    readonly System.Windows.Forms.Timer poll = new System.Windows.Forms.Timer { Interval = IdlePoll };
    delegate void WinEventProc(IntPtr hook, uint ev, IntPtr hwnd, int obj, int child, uint thread, uint time);
    [DllImport("user32.dll")] static extern IntPtr SetWinEventHook(uint min, uint max, IntPtr module, WinEventProc proc, uint process, uint thread, uint flags);
    readonly WinEventProc windowCreated; // kept alive: the callback must not be collected
    readonly HashSet<uint> seenPids = new HashSet<uint>();
    int pid, handled; Process root; IntPtr mainWindow; Loader loader; bool injecting; Stopwatch since;
    readonly Dictionary<int, bool> known = new Dictionary<int, bool>();

    public static bool IsRunning()
    {
        bool created;
        using (new Mutex(false, MutexName, out created)) return !created;
    }

    public static void Run()
    {
        bool created;
        using (new Mutex(true, MutexName, out created))
        {
            if (!created) return; // one helper is enough
            AppDomain.CurrentDomain.UnhandledException += (s, e) => Log("CRASH " + e.ExceptionObject);
            Application.ThreadException += (s, e) => Log("UI ERROR " + e.Exception);
            Log("helper started " + Snippet.Version);
            Application.Run(new Watcher());
        }
    }

    // helper.log next to the EXE: what the helper saw and did, for when it misbehaves on someone's PC.
    public static void Log(string line)
    {
        try { File.AppendAllText(Path.Combine(Paths.InstallDir(), "helper.log"), DateTime.Now.ToString("HH:mm:ss.fff ") + line + "\r\n"); } catch { }
    }

    volatile int injectResult; // 0 while the worker is typing, then 1 ok or 2 failed

    Watcher()
    {
        poll.Tick += (s, e) => Guard(Tick); poll.Start();
        windowCreated = (hook, ev, hwnd, obj, child, thread, time) =>
        {
            if (obj != 0 || child != 0 || pid != 0) return; // only whole windows, and only while waiting for Claude
            uint owner; Native.GetWindowThreadProcessId(hwnd, out owner);
            if (seenPids.Count > 1000) seenPids.Clear();
            if (!seenPids.Add(owner)) return; // each process is looked at once
            Guard(() => { using (var p = Process.GetProcessById((int)owner)) if (p.ProcessName.Equals("claude", StringComparison.OrdinalIgnoreCase)) Scan(); });
        };
        SetWinEventHook(0x8000, 0x8000, IntPtr.Zero, windowCreated, 0, 0, 0); // EVENT_OBJECT_CREATE, out of context
        Scan(); Trim();
    }

    static void Guard(Action a) { try { a(); } catch (Exception ex) { Log("error " + ex.Message); } }

    [DllImport("kernel32.dll")] static extern bool SetProcessWorkingSetSize(IntPtr process, IntPtr min, IntPtr max);
    public static void Trim() { GC.Collect(); SetProcessWorkingSetSize(Process.GetCurrentProcess().Handle, (IntPtr)(-1), (IntPtr)(-1)); }

    void Scan()
    {
        var roots = new List<Process>();
        foreach (Process p in Process.GetProcessesByName("claude"))
        {
            bool isApp; if (!known.TryGetValue(p.Id, out isApp)) { isApp = Paths.IsClaudeApp(p); known[p.Id] = isApp; }
            if (isApp) roots.Add(p);
        }
        if (known.Count > 200) known.Clear();
        // Claude is many processes (renderers, GPU, utilities); the one that owns the windows is the root, which started first.
        roots.Sort((a, b) => a.StartTime.CompareTo(b.StartTime));
        if (roots.Count == 0) { handled = 0; return; }
        if (roots[0].Id == handled) return;
        root = roots[0];
        // Claude that was already running when the helper started has nothing to inject into,
        // unless its DevTools window is still waiting (it was launched with the variable set).
        bool fresh = (DateTime.Now - root.StartTime).TotalSeconds < 20;
        if (!fresh && !Native.WindowsOf(root.Id).Exists(w => Native.IsDevToolsTitle(w.Key))) { handled = root.Id; return; }
        pid = root.Id; since = Stopwatch.StartNew(); mainWindow = IntPtr.Zero; injecting = false;
        poll.Interval = ActivePoll;
        loader = new Loader(); loader.Show(); loader.Begin();
        Log("claude " + pid + " seen, card shown after " + since.ElapsedMilliseconds + " ms");
        Tick(); // hide its window now if it is already there
    }

    void Tick()
    {
        if (pid == 0) { Scan(); return; }
        if (injectResult != 0) { bool ok = injectResult == 1; injectResult = 0; Finish(ok); return; }
        IntPtr devtools = IntPtr.Zero;
        foreach (var w in Native.WindowsOf(pid))
        {
            if (Native.IsDevToolsTitle(w.Key)) devtools = w.Value;
            else if (mainWindow == IntPtr.Zero) { mainWindow = w.Value; Native.ShowWindow(mainWindow, Native.SW_HIDE); loader.Progress(0.1f); Log("main window '" + w.Key + "' hidden"); }
        }
        if (devtools != IntPtr.Zero && !injecting)
        {
            injecting = true;
            Native.SetWindowPos(devtools, IntPtr.Zero, -32000, -32000, 0, 0, Native.SWP_NOSIZE | Native.SWP_NOZORDER | Native.SWP_NOACTIVATE); // parked off-screen, still focusable
            loader.Progress(0.2f);
            Log("devtools window found after " + since.ElapsedMilliseconds + " ms, injecting");
            InputShield.On();
            Loader card = loader;
            var t = new Thread(() =>
            {
                bool ok = false;
                try { ok = Inject(devtools, card.Progress); } catch (Exception ex) { Log("inject error " + ex); }
                Log("inject " + (ok ? "ok" : "failed"));
                injectResult = ok ? 1 : 2; // the poll timer finishes up, so the input shield comes off even if the card was closed
            });
            t.SetApartmentState(ApartmentState.STA);
            t.Start();
        }
        else if (!injecting && since.Elapsed.TotalSeconds > 40) { Log("devtools never appeared"); Finish(false); } // show Claude anyway
        else if (!injecting && root.HasExited) { Log("claude quit during startup"); Finish(false); }
    }

    void Finish(bool ok)
    {
        InputShield.Off();
        Log("finish ok=" + ok + " after " + since.ElapsedMilliseconds + " ms");
        handled = pid;
        if (mainWindow != IntPtr.Zero) { Native.ShowWindow(mainWindow, Native.SW_SHOW); Native.SetForegroundWindow(mainWindow); }
        loader.FadeOut();
        pid = 0; injecting = false; poll.Interval = IdlePoll;
    }

    [DllImport("user32.dll")] static extern uint GetClipboardSequenceNumber();

    // Proof the theme ran: the pasted text ends with a call to the console's own copy(), which puts a
    // per-start stamp on the clipboard once the snippet has evaluated without throwing. (Claude's main
    // process blocks page titles from reaching the window title, so document.title cannot carry it.)
    public static bool ThemeRan(string stamp, int waitMs)
    {
        uint seq = 0; // never a real number, so the first pass looks: copy() may have fired before this call
        for (var t = Stopwatch.StartNew(); t.ElapsedMilliseconds < waitMs; Thread.Sleep(20))
            if (GetClipboardSequenceNumber() != seq) { seq = GetClipboardSequenceNumber(); try { if (Clipboard.GetText() == stamp) return true; } catch { } }
        return false;
    }

    // Paste the theme into the DevTools console and watch for the proof. DevTools may still be loading, so
    // the first try is quick and every retry waits half as long again; a lost keystroke only costs a retry.
    static bool Inject(IntPtr devtools, Action<float> progress)
    {
        string theme = Snippet.Text, stamp = "technozen-ran-" + DateTime.Now.Ticks;
        Thread.Sleep(1000); // DevTools needs about this long to load: an earlier try would only be wasted
        var clock = Stopwatch.StartNew(); bool ok = false; double k = 1;
        for (int attempt = 1; attempt <= 4 && !ok; attempt++, k *= 1.5)
        {
            Func<int, int> ms = n => (int)(n * k);
            progress(0.2f);
            try { Clipboard.SetText(theme + "\n;typeof copy === \"function\" && copy(\"" + stamp + "\");\n"); } catch { Log("clipboard refused on attempt " + attempt + " (locked screen?)"); Thread.Sleep(100); continue; }
            Native.SetForegroundWindow(devtools); Thread.Sleep(30);
            if (Native.GetForegroundWindow() != devtools) { SendKeys.SendWait("%"); Native.SetForegroundWindow(devtools); Thread.Sleep(50); } // the Alt tap lifts Windows' foreground lock
            if (Native.GetForegroundWindow() != devtools) { Thread.Sleep(ms(150)); continue; }
            progress(0.3f);
            // Command menu > "Show Console" puts the cursor in the console prompt whatever panel was open.
            SendKeys.SendWait(attempt > 1 ? "{ESC}^+p" : "^+p"); Thread.Sleep(ms(200));
            SendKeys.SendWait("Show Console"); Thread.Sleep(ms(120));
            SendKeys.SendWait("{ENTER}"); Thread.Sleep(ms(250));
            progress(0.45f);
            // Select all first, so anything left in the prompt by a lost attempt cannot corrupt the paste.
            SendKeys.SendWait("^a^v"); Thread.Sleep(ms(200));
            SendKeys.SendWait("{ENTER}");
            progress(0.6f);
            ok = ThemeRan(stamp, ms(300));
            if (!ok)
            {
                // The first paste into a DevTools session shows a self-XSS warning instead of pasting; answer it and paste again.
                SendKeys.SendWait("allow pasting{ENTER}"); Thread.Sleep(ms(120));
                progress(0.75f);
                SendKeys.SendWait("^a^v"); Thread.Sleep(ms(300));
                SendKeys.SendWait("{ENTER}");
                progress(0.9f);
                ok = ThemeRan(stamp, ms(1200));
            }
            Log("attempt " + attempt + (ok ? " ran" : " no proof") + " at " + clock.ElapsedMilliseconds + " ms");
        }
        if (ok) progress(1f);
        Native.PostMessage(devtools, Native.WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        return ok;
    }
}

// The start-up card: Y2K glass orbs over a meadow, each humming, ringing like bells when they collide,
// pushed around by the mouse. It never takes keyboard focus, so the typed theme cannot land in it.
// Everything that never changes is drawn once with GDI+; a frame is a few native blits into a back buffer.
partial class Loader : Form
{
    static readonly Color Lime = Color.FromArgb(196, 242, 78), Aqua = Color.FromArgb(46, 211, 196), Pink = Color.FromArgb(255, 110, 199),
                          Amber = Color.FromArgb(242, 179, 91), Ink = Color.FromArgb(7, 28, 43), Sky = Color.FromArgb(125, 200, 250),
                          SkyLow = Color.FromArgb(214, 238, 255), Grass = Color.FromArgb(150, 220, 70), GrassLow = Color.FromArgb(70, 160, 45);
    const int W = 460, H = 300, TargetFps = 120, SrcCopy = 0x00CC0020, PerPixelAlpha = 0x01FF0000;
    [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleDC(IntPtr dc);
    [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr dc);
    [DllImport("gdi32.dll")] static extern IntPtr SelectObject(IntPtr dc, IntPtr obj);
    [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr obj);
    [DllImport("gdi32.dll")] static extern bool BitBlt(IntPtr dst, int x, int y, int w, int h, IntPtr src, int sx, int sy, int rop);
    [DllImport("msimg32.dll")] static extern bool AlphaBlend(IntPtr dst, int x, int y, int w, int h, IntPtr src, int sx, int sy, int sw, int sh, int blend);
    [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr hwnd);
    [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr hwnd, IntPtr dc);
    [DllImport("dwmapi.dll")] static extern int DwmFlush(); // returns at the next screen refresh

    readonly Stopwatch clock = Stopwatch.StartNew(), shown = new Stopwatch();
    readonly Scene scene; readonly Synth synth = new Synth();
    readonly float scale; // device pixels per design unit
    // Native bitmaps: each orb at four half-pixel offsets so it glides instead of stepping, the scenery, the wordmark, the back buffer.
    readonly IntPtr[,] sprites; readonly int[] spriteSize, order; readonly IntPtr scenery, wordmark, back, mem, src;
    readonly int wordmarkHeight, wordmarkY; readonly Graphics gfx;
    readonly Rectangle[][] scanlines = new Rectangle[3][]; readonly SolidBrush scanlineBrush = new SolidBrush(Color.FromArgb(28, 0, 0, 0));
    static int liveCards; bool begun; volatile bool pumping; int framePending; bool closing, fading;
    long frames, slowFrames; double workMs, worstMs, fadeStart;
    double simulated; // seconds of physics already stepped; real time is stepped in 1/60 s slices
    float demoTime = -1; // the demo image renders at a fixed time so it is reproducible
    volatile float progress; // real progress only: set by the helper at each milestone, never by time

    public void Progress(float p) { progress = p; }

    public Loader() : this(Environment.TickCount) { }

    Loader(int seed)
    {
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        AutoScaleMode = AutoScaleMode.None;
        SetStyle(ControlStyles.Opaque | ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint, true);
        scale = DeviceDpi / 96f * Scene.CardScale;
        ClientSize = new Size((int)(W * scale), (int)(H * scale));
        TopMost = true;
        Text = "Claude";
        BackColor = Ink;
        using (var path = Rounded(new RectangleF(0, 0, Width, Height), 30 * scale)) Region = new Region(path);
        scene = new Scene(new Random(seed), new RectangleF(18, 18, W - 36, H - 36));
        scene.Struck = (a, b, loud) => { synth.Strike(a.Freq, a.Freq + a.Beat, loud * 0.6f); synth.Strike(b.Freq, b.Freq + b.Beat, loud * 0.6f); }; // both bowls ring
        int count = scene.Orbs.Count;
        sprites = new IntPtr[count, 4]; spriteSize = new int[count]; order = new int[count];
        for (int i = 0; i < count; i++)
        {
            order[i] = i; spriteSize[i] = (int)Math.Ceiling(scene.Orbs[i].R * 2.2f * scale) + 1;
            for (int phase = 0; phase < 4; phase++) sprites[i, phase] = OrbSprite(scene.Orbs[i], scale, spriteSize[i], (phase & 1) * 0.5f, (phase >> 1) * 0.5f);
        }
        Array.Sort(order, (a, b) => scene.Orbs[a].R.CompareTo(scene.Orbs[b].R)); // big ones last, so they read as nearer
        for (int phase = 0; phase < 3; phase++)
        {
            scanlines[phase] = new Rectangle[Height / 3 + 1];
            for (int i = 0; i < scanlines[phase].Length; i++) scanlines[phase][i] = new Rectangle(0, i * 3 + phase, Width, 1);
        }
        wordmarkHeight = (int)Math.Ceiling(50 * scale); wordmarkY = (int)(200 * scale);
        scenery = BuildScenery(); wordmark = BuildWordmark(); back = BuildScenery();
        mem = CreateCompatibleDC(IntPtr.Zero); src = CreateCompatibleDC(IntPtr.Zero); SelectObject(mem, back);
        gfx = Graphics.FromHdc(mem);
        MouseMove += (s, e) => { scene.MouseX = e.X / scale; scene.MouseY = e.Y / scale; };
        MouseLeave += (s, e) => { scene.MouseX = -1e6f; scene.MouseY = -1e6f; };
        FormClosed += (s, e) =>
        {
            pumping = false; synth.Dispose();
            Watcher.Log("audio: " + synth.Underruns + " gaps, " + synth.FailedWrites + " failed writes");
            Watcher.Log("graphics: " + FrameReport());
            gfx.Dispose(); scanlineBrush.Dispose(); DeleteDC(mem); DeleteDC(src);
            DeleteObject(back); DeleteObject(scenery); DeleteObject(wordmark); foreach (IntPtr h in sprites) DeleteObject(h);
            if (begun && --liveCards == 0) Thread.CurrentThread.Priority = ThreadPriority.Normal;
            Watcher.Trim();
        };
        Render();
    }

    // Called once the card is shown: opens the sound device and starts animating.
    public void Begin() { Begin(true); }
    void Begin(bool withSound)
    {
        bool sound = withSound && synth.Start();
        string hum = ""; foreach (var o in scene.Orbs) hum += o.Freq.ToString("0") + " ";
        Watcher.Log("card: " + scene.Orbs.Count + " orbs at " + hum + "Hz, sound " + (sound ? "on" : "off") + ", built in " + clock.ElapsedMilliseconds + " ms");
        begun = true; if (liveCards++ == 0) Thread.CurrentThread.Priority = ThreadPriority.AboveNormal; // this thread paints the card: Claude starting up must not stutter it
        shown.Start(); pumping = true;
        new Thread(FramePump) { IsBackground = true, Priority = ThreadPriority.AboveNormal }.Start();
    }

    // Frames are released at screen refreshes, up to TargetFps on average: every refresh on a 120 Hz screen or
    // slower, and the right share of them on a faster one. A slow frame is skipped, never queued.
    void FramePump()
    {
        long period = Stopwatch.Frequency / TargetFps, next = Stopwatch.GetTimestamp();
        while (pumping)
        {
            if (DwmFlush() != 0) Thread.Sleep(4); // no compositor (rare, some remote sessions): pace by sleeping
            long now = Stopwatch.GetTimestamp();
            if (now < next - period / 3) continue; // too early for the next frame: wait for another refresh
            next += period; if (now - next > 2 * period) next = now;
            if (Interlocked.CompareExchange(ref framePending, 1, 0) != 0) continue;
            try { BeginInvoke((Action)Frame); } catch (Exception) { return; } // the card closed underneath us
        }
    }

    void Frame()
    {
        if (closing) return;
        Tickle();
        if (closing) return;
        long start = Stopwatch.GetTimestamp();
        Render(); Present();
        double ms = (Stopwatch.GetTimestamp() - start) * 1000.0 / Stopwatch.Frequency;
        frames++; workMs += ms; worstMs = Math.Max(worstMs, ms); if (ms > 1000.0 / TargetFps) slowFrames++;
        Interlocked.Exchange(ref framePending, 0);
    }

    string FrameReport()
    {
        double s = Math.Max(0.001, shown.Elapsed.TotalSeconds), n = Math.Max(1, frames);
        return frames + " frames in " + s.ToString("0.0") + " s, " + (frames / s).ToString("0.0") + " fps, paint " + (workMs / n).ToString("0.00") + " ms average, " + worstMs.ToString("0.0") + " ms worst, " + slowFrames + " over budget";
    }

    protected override bool ShowWithoutActivation { get { return true; } }
    protected override CreateParams CreateParams
    {
        get { var cp = base.CreateParams; cp.ExStyle |= 0x08000000 | 0x00000008; return cp; } // WS_EX_NOACTIVATE | WS_EX_TOPMOST
    }

    public void FadeOut() { if (!fading) fadeStart = clock.Elapsed.TotalSeconds; fading = true; synth.FadeOut(); }

    void Tickle()
    {
        double now = clock.Elapsed.TotalSeconds; int steps = 0;
        while (simulated + Scene.Step <= now && steps < 4) { scene.Tick(); simulated += Scene.Step; steps++; }
        if (simulated + Scene.Step <= now) simulated = now; // fell behind (sleep, debugger): drop the backlog rather than catch up
        if (steps > 0) for (int i = 0; i < scene.Orbs.Count; i++) synth.SetMotion(i, scene.Orbs[i].Freq, scene.Orbs[i].Speed);
        if (fading)
        {
            double o = 1 - (now - fadeStart) / 0.4; // 400 ms, longer than the sound's fade plus its queue
            if (o <= 0.05) { closing = true; pumping = false; Close(); } else Opacity = o;
        }
    }

    static GraphicsPath Rounded(RectangleF r, float radius)
    {
        var p = new GraphicsPath(); float d = radius * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90); p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90); p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure(); return p;
    }

    // Sky over a meadow, a bright haze at the horizon, soft glowing rings at the edge: drawn once.
    IntPtr BuildScenery()
    {
        using (var bmp = new Bitmap(Width, Height, PixelFormat.Format32bppPArgb))
        {
            using (var g = Graphics.FromImage(bmp))
            {
                g.Clear(Ink); g.SmoothingMode = SmoothingMode.AntiAlias; g.ScaleTransform(scale, scale);
                using (var sky = new LinearGradientBrush(new Rectangle(0, 0, W, 170), Sky, SkyLow, 90f)) g.FillRectangle(sky, 0, 0, W, 170);
                using (var grass = new LinearGradientBrush(new Rectangle(0, 165, W, H - 165), Grass, GrassLow, 90f)) g.FillRectangle(grass, 0, 165, W, H - 165);
                using (var haze = new LinearGradientBrush(new Rectangle(0, 140, W, 40), Color.FromArgb(0, 255, 255, 255), Color.FromArgb(150, 255, 255, 255), 90f)) g.FillRectangle(haze, 0, 140, W, 30);
                using (var path = Rounded(new RectangleF(14, 14, W - 28, H - 28), 24))
                    for (int i = 6; i >= 1; i--)
                        using (var pen = new Pen(Color.FromArgb(16 * (7 - i), i % 2 == 0 ? Aqua : Color.White), i * 2)) g.DrawPath(pen, path);
            }
            return bmp.GetHbitmap(Color.FromArgb(0));
        }
    }

    // The wordmark with a dark halo so it reads over any orb: drawn once, on a strip from 200 to 250 design units down.
    IntPtr BuildWordmark()
    {
        using (var bmp = new Bitmap(Width, wordmarkHeight, PixelFormat.Format32bppPArgb))
        {
            using (var g = Graphics.FromImage(bmp))
            using (var font = new Font("Segoe UI", 88f / 3, FontStyle.Bold, GraphicsUnit.Pixel)) // in design units, so the strip fits at any DPI
            using (var fmt = new StringFormat { Alignment = StringAlignment.Center })
            {
                g.SmoothingMode = SmoothingMode.AntiAlias; g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
                g.ScaleTransform(scale, scale); g.TranslateTransform(0, -200);
                for (int i = 3; i >= 1; i--) using (var b = new SolidBrush(Color.FromArgb(45, Ink))) g.DrawString("Claude", font, b, W / 2f, 206 + i, fmt);
                using (var b = new SolidBrush(Color.FromArgb(250, 255, 255, 255))) g.DrawString("Claude", font, b, W / 2f, 206, fmt);
            }
            return bmp.GetHbitmap(Color.FromArgb(0));
        }
    }

    void Blend(IntPtr bitmap, int x, int y, int w, int h) { SelectObject(src, bitmap); AlphaBlend(mem, x, y, w, h, src, 0, 0, w, h, PerPixelAlpha); }

    void Render()
    {
        float t = demoTime >= 0 ? demoTime : clock.ElapsedMilliseconds / 1000f;
        SelectObject(src, scenery); BitBlt(mem, 0, 0, Width, Height, src, 0, 0, SrcCopy);
        // Physics steps at 60 Hz; each frame carries the orbs on to this exact moment, rounded to the half pixels the sprites were drawn at.
        float ahead = demoTime >= 0 ? 0 : (float)Math.Max(0, Math.Min(1, (clock.Elapsed.TotalSeconds - simulated) / Scene.Step));
        foreach (int i in order)
        {
            var o = scene.Orbs[i];
            int qx = (int)Math.Floor((o.X + o.Vx * ahead - o.R * 1.1f) * scale * 2), qy = (int)Math.Floor((o.Y + o.Vy * ahead - o.R * 1.1f) * scale * 2);
            Blend(sprites[i, (qx & 1) | (qy & 1) << 1], qx >> 1, qy >> 1, spriteSize[i], spriteSize[i]);
        }
        Blend(wordmark, 0, wordmarkY, Width, wordmarkHeight);
        var g = gfx; g.ResetTransform(); g.SmoothingMode = SmoothingMode.None; g.CompositingQuality = CompositingQuality.HighSpeed;
        g.FillRectangles(scanlineBrush, scanlines[(int)(t * 12) % 3]);
        g.SmoothingMode = SmoothingMode.AntiAlias; g.ScaleTransform(scale, scale);
        foreach (var h in scene.Hits)
            if (h[2] >= 0) using (var pen = new Pen(Color.FromArgb((int)(220 * (1 - h[2])), Color.White), 3)) { float r = 6 + h[2] * 34; g.DrawEllipse(pen, h[0] - r, h[1] - r, 2 * r, 2 * r); }
        // The honest progress line (hide, DevTools, focus, console, paste, paste, run, verified).
        var bar = new RectangleF(60, 258, W - 120, 5);
        using (var path = Rounded(bar, 2)) using (var b = new SolidBrush(Color.FromArgb(90, Ink))) g.FillPath(b, path);
        var fill = new RectangleF(bar.X, bar.Y, Math.Max(5, bar.Width * progress), bar.Height);
        Color[] cycle = { Lime, Aqua, Pink, Amber }; Color c1 = cycle[(int)(t / 1.5f) % 4], c2 = cycle[((int)(t / 1.5f) + 1) % 4];
        using (var path = Rounded(fill, 2)) using (var b = new LinearGradientBrush(bar, c1, c2, 0f)) g.FillPath(b, path);
        // A slow bright band like a CRT refresh.
        int band = (int)(t * 30) % (H + 60) - 30;
        using (var sweep = new LinearGradientBrush(new Rectangle(0, band, W, 30), Color.FromArgb(0, 255, 255, 255), Color.FromArgb(30, 255, 255, 255), 90f)) g.FillRectangle(sweep, 0, band, W, 30);
        g.Flush(FlushIntention.Sync);
    }

    void Present() { IntPtr dc = GetDC(Handle); BitBlt(dc, 0, 0, Width, Height, mem, 0, 0, SrcCopy); ReleaseDC(Handle, dc); }

    protected override void OnPaint(PaintEventArgs e) { Present(); }

    static IntPtr OrbSprite(Orb o, float scale, int size, float offsetX, float offsetY)
    {
        float R = o.R;
        using (var bmp = new Bitmap(size, size, PixelFormat.Format32bppPArgb))
        {
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias; g.TranslateTransform(offsetX, offsetY); g.ScaleTransform(scale, scale);
                float cx = R * 1.1f, cy = R * 1.1f; var box = new RectangleF(cx - R, cy - R, 2 * R, 2 * R);
                using (var sh = new SolidBrush(Color.FromArgb(55, Ink))) g.FillEllipse(sh, cx - R * 0.8f, cy + R * 0.7f, R * 1.6f, R * 0.4f);
                        using (var path = new GraphicsPath())
                        {
                            path.AddEllipse(box);
                            using (var body = new PathGradientBrush(path))
                            {
                                body.CenterPoint = new PointF(cx - R * 0.15f, cy - R * 0.15f);
                                body.CenterColor = Color.FromArgb(40, o.Tint);
                                body.SurroundColors = new[] { Color.FromArgb(185, o.Tint) };
                                g.FillPath(body, path);
                            }
                        }
                        using (var rim = new Pen(Color.FromArgb(90, 10, 40, 60), R * 0.12f)) g.DrawArc(rim, box.X + R * 0.06f, box.Y + R * 0.06f, box.Width - R * 0.12f, box.Height - R * 0.12f, 20, 140);
                        using (var chrome = new Pen(Color.FromArgb(150, 255, 255, 255), 1.6f)) g.DrawEllipse(chrome, box);
                        using (var hi = new PathGradientBrush(new[] { new PointF(cx - R * 0.75f, cy - R * 0.8f), new PointF(cx + R * 0.1f, cy - R * 0.8f), new PointF(cx + R * 0.1f, cy - R * 0.2f), new PointF(cx - R * 0.75f, cy - R * 0.2f) }))
                        { hi.CenterColor = Color.FromArgb(225, 255, 255, 255); hi.SurroundColors = new[] { Color.FromArgb(0, 255, 255, 255) }; g.FillEllipse(hi, cx - R * 0.75f, cy - R * 0.8f, R * 0.85f, R * 0.6f); }
                        using (var dot = new SolidBrush(Color.White)) g.FillEllipse(dot, cx - R * 0.5f, cy - R * 0.62f, R * 0.16f, R * 0.12f);
                        using (var low = new SolidBrush(Color.FromArgb(70, 255, 255, 255))) g.FillEllipse(low, cx - R * 0.35f, cy + R * 0.45f, R * 0.7f, R * 0.22f);
            }
            return bmp.GetHbitmap(Color.FromArgb(0));
        }
    }
}

class MainForm : Form
{
    readonly Label status = new Label { AutoSize = false, Dock = DockStyle.Bottom, Height = 64, Padding = new Padding(12, 0, 12, 8) };
    readonly Button[] buttons;

    public MainForm()
    {
        Text = "Technozen for Claude " + Snippet.Version;
        ClientSize = new Size(440, 250);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        Font = new Font("Segoe UI", 9.5f);
        var intro = new Label
        {
            Dock = DockStyle.Top, Height = 84, Padding = new Padding(12, 10, 12, 0),
            Text = "Five Technozen themes for the Claude desktop app.\nInstall turns on Claude's Developer Mode and starts a small helper (at every login) that puts the theme on each time Claude opens, however you start it, behind a loading card so you never see plain Claude. Claude closes and reopens once now."
        };
        buttons = new[]
        {
            MakeButton("Install and apply", 100, () => { Install.Apply(); return Install.RestartClaude(); }),
            MakeButton("Uninstall", 140, () =>
            {
                var r = MessageBox.Show("Also turn Claude's Developer Mode off? (Takes effect the next time Claude starts.)", "Technozen for Claude", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                Install.Remove(r == DialogResult.Yes);
                return "Removed. In Claude, press Ctrl+Alt+0 to take the theme off now; it will not come back.";
            }),
        };
        Controls.AddRange(new Control[] { intro, buttons[0], buttons[1], status });
        status.Text = (Paths.DeveloperModeOn() ? "Developer Mode is on." : "Developer Mode is off.")
                    + (Watcher.IsRunning() ? " Helper is running." : " Helper is not running.");
    }

    Button MakeButton(string text, int top, Func<string> work)
    {
        var b = new Button { Text = text, Left = 12, Top = top, Width = 416, Height = 32 };
        b.Click += (s, e) =>
        {
            // Work runs on its own STA thread so the window keeps painting; buttons are disabled meanwhile.
            foreach (var x in buttons) x.Enabled = false;
            status.Text = "Working...";
            var t = new Thread(() =>
            {
                string result;
                try { result = work(); } catch (Exception ex) { result = "Failed: " + ex.Message; }
                BeginInvoke((Action)(() => { status.Text = result; foreach (var x in buttons) x.Enabled = true; }));
            });
            t.SetApartmentState(ApartmentState.STA);
            t.Start();
        };
        return b;
    }
}
