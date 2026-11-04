// Technozen for Claude: Windows installer and background helper.
// Build: python installer/build_exe.py  (uses the C# compiler that ships with Windows, no SDK needed)
//
// How it keeps the theme on. The Claude desktop app has no plugin hook and blocks remote debugging,
// but with Developer Mode on it opens DevTools by itself whenever the environment variable
// CLAUDE_DEV_TOOLS is set. Install therefore: copies this EXE to a permanent folder, turns Developer
// Mode on (a JSON file), sets CLAUDE_DEV_TOOLS=undocked for the user, and starts a helper (also at
// every login). The helper polls for a new Claude process, shows a loading card at once, hides
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
        if (args.Length > 1 && args[0] == "--check") { File.WriteAllText(args[1], Paths.Report()); return; }
        if (args.Length > 1 && args[0] == "--demo") { Loader.RenderDemo(args[1]); return; }
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
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
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
    public static string OldLaunchShortcut() { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Claude (Technozen).lnk"); } // from version 1.0.0
    public static bool RunningFromCopy() { return string.Equals(Application.ExecutablePath, InstalledExe(), StringComparison.OrdinalIgnoreCase); }

    public static bool DeveloperModeOn()
    {
        string f = DeveloperSettings();
        return File.Exists(f) && File.ReadAllText(f).Replace(" ", "").Contains("\"allowDevTools\":true");
    }

    public static string Report()
    {
        return "userData: " + UserData() + "\r\ndeveloperSettings: " + DeveloperSettings() + " (on: " + DeveloperModeOn() + ")\r\n"
             + "claude: " + ClaudeExe() + "\r\ninstalled copy: " + InstalledExe() + " (exists: " + File.Exists(InstalledExe()) + ")\r\n"
             + "startup shortcut: " + StartupShortcut() + " (exists: " + File.Exists(StartupShortcut()) + ")\r\n"
             + EnvName + " (user): " + Environment.GetEnvironmentVariable(EnvName, EnvironmentVariableTarget.User) + "\r\n"
             + "watcher running: " + Watcher.IsRunning() + "\r\napp running: " + (AppProcesses().Length > 0) + "\r\nsnippet bytes: " + Snippet.Text.Length + "\r\n";
    }
}

static class Install
{
    public static void Apply()
    {
        // The app's schema has exactly one key, allowDevTools, so writing the whole file is safe.
        Directory.CreateDirectory(Paths.UserData());
        File.WriteAllText(Paths.DeveloperSettings(), "{\n  \"allowDevTools\": true\n}\n");
        // User-level variable: written to the registry and broadcast, so new launches from Start or the taskbar see it.
        Environment.SetEnvironmentVariable(Paths.EnvName, "undocked", EnvironmentVariableTarget.User);
        Directory.CreateDirectory(Paths.InstallDir());
        if (File.Exists(Paths.OldLaunchShortcut())) File.Delete(Paths.OldLaunchShortcut());
        foreach (Process p in Process.GetProcessesByName("Technozen for Claude")) // an older helper or copy in use
            if (p.Id != Process.GetCurrentProcess().Id) { try { p.Kill(); p.WaitForExit(3000); } catch { } }
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
        if (File.Exists(Paths.OldLaunchShortcut())) File.Delete(Paths.OldLaunchShortcut());
        foreach (Process p in Process.GetProcessesByName("Technozen for Claude"))
            if (p.Id != Process.GetCurrentProcess().Id) { try { p.Kill(); } catch { } }
        if (developerModeOff && File.Exists(Paths.DeveloperSettings())) File.Delete(Paths.DeveloperSettings());
        if (!Paths.RunningFromCopy() && Directory.Exists(Paths.InstallDir())) { Thread.Sleep(500); Directory.Delete(Paths.InstallDir(), true); }
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
    readonly System.Windows.Forms.Timer poll = new System.Windows.Forms.Timer { Interval = 100 };
    readonly Dictionary<int, bool> handled = new Dictionary<int, bool>();
    int pid; IntPtr mainWindow; Loader loader; bool injecting; Stopwatch since;

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
            Application.Run(new Watcher());
        }
    }

    Watcher() { poll.Tick += (s, e) => { try { Tick(); } catch { } }; poll.Start(); }

    void Tick()
    {
        if (pid == 0)
        {
            foreach (Process p in Paths.AppProcesses())
            {
                if (handled.ContainsKey(p.Id)) continue;
                // Claude that was already running when the helper started has nothing to inject into,
                // unless its DevTools window is still waiting (it was launched with the variable set).
                bool fresh = (DateTime.Now - p.StartTime).TotalSeconds < 20;
                bool waiting = Native.WindowsOf(p.Id).Exists(w => Native.IsDevToolsTitle(w.Key));
                if (!fresh && !waiting) { handled[p.Id] = true; continue; }
                pid = p.Id; since = Stopwatch.StartNew(); mainWindow = IntPtr.Zero; injecting = false;
                loader = new Loader(); loader.Show();
                break;
            }
            foreach (int old in new List<int>(handled.Keys)) try { Process.GetProcessById(old); } catch { handled.Remove(old); }
            return;
        }
        IntPtr devtools = IntPtr.Zero;
        foreach (var w in Native.WindowsOf(pid))
        {
            if (Native.IsDevToolsTitle(w.Key)) devtools = w.Value;
            else if (mainWindow == IntPtr.Zero) { mainWindow = w.Value; Native.ShowWindow(mainWindow, Native.SW_HIDE); loader.Status("hiding the white..."); }
        }
        if (devtools != IntPtr.Zero && !injecting)
        {
            injecting = true;
            Native.SetWindowPos(devtools, IntPtr.Zero, -32000, -32000, 0, 0, Native.SWP_NOSIZE | Native.SWP_NOZORDER | Native.SWP_NOACTIVATE); // parked off-screen, still focusable
            loader.Status("pouring the theme in...");
            var t = new Thread(() => { bool ok = Inject(devtools); loader.BeginInvoke((Action)(() => Finish(ok))); });
            t.SetApartmentState(ApartmentState.STA);
            t.Start();
        }
        else if (!injecting && since.Elapsed.TotalSeconds > 40) Finish(false); // DevTools never came: show Claude anyway
        else if (!injecting && Paths.AppProcesses().Length == 0) Finish(false); // Claude quit during startup
    }

    void Finish(bool ok)
    {
        handled[pid] = true;
        if (mainWindow != IntPtr.Zero) { Native.ShowWindow(mainWindow, Native.SW_SHOW); Native.SetForegroundWindow(mainWindow); }
        loader.Status(ok ? "ready" : "could not apply; opening Claude");
        loader.FadeOut();
        pid = 0; injecting = false;
    }

    // Paste the theme into the DevTools console. Returns false when the window could not be focused.
    static bool Inject(IntPtr devtools)
    {
        Thread.Sleep(1500); // let the DevTools frontend finish loading
        for (int attempt = 0; attempt < 8; attempt++)
        {
            try { Clipboard.SetText(Snippet.Text); } catch { Thread.Sleep(500); continue; }
            Native.SetForegroundWindow(devtools);
            Thread.Sleep(300);
            if (Native.GetForegroundWindow() != devtools) { SendKeys.SendWait("%"); Native.SetForegroundWindow(devtools); Thread.Sleep(300); } // the Alt tap lifts Windows' foreground lock
            if (Native.GetForegroundWindow() != devtools) { Thread.Sleep(700); continue; }
            // Command menu > "Show Console" puts the cursor in the console prompt whatever panel was open.
            SendKeys.SendWait("^+p"); Thread.Sleep(500);
            SendKeys.SendWait("Show Console"); Thread.Sleep(400);
            SendKeys.SendWait("{ENTER}"); Thread.Sleep(600);
            // DevTools blocks the first paste ever with a self-XSS warning until "allow pasting" is typed.
            // Paste, answer the warning, paste again: with the warning the first paste is empty and the
            // second runs; without it the first attempt becomes a syntax error (runs nothing) and the second runs.
            SendKeys.SendWait("^v"); Thread.Sleep(500);
            SendKeys.SendWait("allow pasting{ENTER}"); Thread.Sleep(500);
            SendKeys.SendWait("^v"); Thread.Sleep(900);
            SendKeys.SendWait("{ENTER}"); Thread.Sleep(900);
            Native.PostMessage(devtools, Native.WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
            return true;
        }
        return false;
    }
}

// The loading card: a phosphor-green CRT tile with scanlines, a bobbing water drop, a progress bar,
// and ripples where the mouse goes. It never takes keyboard focus, so the typed theme cannot land in it.
class Loader : Form
{
    static readonly Color Navy = Color.FromArgb(11, 42, 63), Lime = Color.FromArgb(196, 242, 78), Aqua = Color.FromArgb(46, 211, 196),
                          Pink = Color.FromArgb(255, 110, 199), Amber = Color.FromArgb(242, 179, 91), Ink = Color.FromArgb(7, 28, 43);
    readonly System.Windows.Forms.Timer anim = new System.Windows.Forms.Timer { Interval = 33 };
    readonly List<float[]> ripples = new List<float[]>(); // x, y, radius, age
    readonly Stopwatch clock = Stopwatch.StartNew();
    string status = "warming up the tube...";
    bool fading;

    public Loader()
    {
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(460, 300);
        TopMost = true;
        ShowInTaskbar = true;
        Text = "Claude (Technozen)";
        BackColor = Ink;
        DoubleBuffered = true;
        using (var path = Rounded(new Rectangle(0, 0, Width, Height), 30)) Region = new Region(path);
        anim.Tick += (s, e) => { Tickle(); Invalidate(); };
        anim.Start();
        MouseMove += (s, e) => { if (clock.ElapsedMilliseconds % 4 == 0) ripples.Add(new[] { e.X, e.Y, 4f, 0f }); };
        MouseDown += (s, e) => { for (int i = 0; i < 3; i++) ripples.Add(new[] { e.X, e.Y, 4f + i * 6, 0f }); };
    }

    protected override bool ShowWithoutActivation { get { return true; } }
    protected override CreateParams CreateParams
    {
        get { var cp = base.CreateParams; cp.ExStyle |= 0x08000000 | 0x00000008; return cp; } // WS_EX_NOACTIVATE | WS_EX_TOPMOST
    }

    public void Status(string s) { status = s; }
    public void FadeOut() { fading = true; }

    void Tickle()
    {
        for (int i = ripples.Count - 1; i >= 0; i--) { ripples[i][2] += 2.2f; ripples[i][3] += 0.04f; if (ripples[i][3] >= 1) ripples.RemoveAt(i); }
        if (fading) { Opacity -= 0.08; if (Opacity <= 0.05) { anim.Stop(); Close(); } }
    }

    static GraphicsPath Rounded(Rectangle r, int radius)
    {
        var p = new GraphicsPath(); int d = radius * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90); p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90); p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure(); return p;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics; g.SmoothingMode = SmoothingMode.AntiAlias; g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
        float t = clock.ElapsedMilliseconds / 1000f;
        var face = new Rectangle(14, 14, Width - 28, Height - 28);
        // Tube face: deep navy with a phosphor-green glow in the middle, soft glowing border rings.
        using (var bg = new LinearGradientBrush(ClientRectangle, Navy, Ink, 90f)) g.FillRectangle(bg, ClientRectangle);
        using (var path = Rounded(face, 24))
        {
            using (var glow = new PathGradientBrush(path)) { glow.CenterColor = Color.FromArgb(70, Lime); glow.SurroundColors = new[] { Color.FromArgb(0, Lime) }; g.FillPath(glow, path); }
            for (int i = 6; i >= 1; i--)
                using (var pen = new Pen(Color.FromArgb(18 * (7 - i), i % 2 == 0 ? Aqua : Lime), i * 2)) g.DrawPath(pen, path);
        }
        // Title with a soft glow, then the crisp text.
        using (var big = new Font("Consolas", 30, FontStyle.Bold))
        {
            for (int i = 4; i >= 1; i--) using (var b = new SolidBrush(Color.FromArgb(30, Lime))) g.DrawString("TECHNOZEN", big, b, 40 - i, 40 + i);
            using (var b = new SolidBrush(Lime)) g.DrawString("TECHNOZEN", big, b, 40, 40);
        }
        using (var small = new Font("Consolas", 11, FontStyle.Bold))
        using (var b = new SolidBrush(Pink)) g.DrawString("for Claude  " + new string('.', 1 + (int)(t * 3) % 3), small, b, 44, 90);
        using (var small = new Font("Consolas", 10))
        using (var b = new SolidBrush(Aqua)) g.DrawString(status.ToUpperInvariant(), small, b, 44, 236);
        // The water drop, bobbing, with its highlight.
        float bob = (float)Math.Sin(t * 3) * 7;
        var drop = new RectangleF(330, 70 + bob, 70, 84);
        using (var sh = new SolidBrush(Color.FromArgb(60, Ink))) g.FillEllipse(sh, drop.X + 6, drop.Bottom - 10, 62, 18);
        using (var body = new LinearGradientBrush(drop, Aqua, Color.FromArgb(14, 100, 130), 70f)) g.FillEllipse(body, drop);
        using (var hi = new SolidBrush(Color.FromArgb(220, 255, 255, 255))) g.FillEllipse(hi, drop.X + 14, drop.Y + 12, 22, 14);
        // Progress: fills over about eight seconds, colors drifting lime -> aqua -> pink -> amber.
        var bar = new Rectangle(44, 200, Width - 88, 14);
        using (var path = Rounded(bar, 7)) using (var b = new SolidBrush(Color.FromArgb(90, Ink))) g.FillPath(b, path);
        float frac = Math.Min(1f, t / 8f); var fill = new Rectangle(bar.X, bar.Y, Math.Max(14, (int)(bar.Width * frac)), bar.Height);
        Color[] cycle = { Lime, Aqua, Pink, Amber }; Color c1 = cycle[(int)(t / 1.5f) % 4], c2 = cycle[((int)(t / 1.5f) + 1) % 4];
        using (var path = Rounded(fill, 7)) using (var b = new LinearGradientBrush(bar, c1, c2, 0f)) g.FillPath(b, path);
        // Ripples from the mouse.
        foreach (var r in ripples) using (var pen = new Pen(Color.FromArgb((int)(160 * (1 - r[3])), Pink), 2)) g.DrawEllipse(pen, r[0] - r[2], r[1] - r[2], r[2] * 2, r[2] * 2);
        // Scanlines drifting down, and a slow bright band sweeping like a CRT refresh.
        int off = (int)(t * 40) % 3;
        using (var line = new SolidBrush(Color.FromArgb(55, 0, 0, 0))) for (int y = off; y < Height; y += 3) g.FillRectangle(line, 0, y, Width, 1);
        int band = (int)(t * 90) % (Height + 60) - 30;
        using (var sweep = new LinearGradientBrush(new Rectangle(0, band, Width, 30), Color.FromArgb(0, Lime), Color.FromArgb(26, Lime), 90f)) g.FillRectangle(sweep, 0, band, Width, 30);
    }

    // Draws two frames to PNG files so the card can be checked without a desktop session.
    public static void RenderDemo(string pngPath)
    {
        var f = new Loader(); f.anim.Stop();
        f.ripples.Add(new[] { 120f, 160f, 20f, 0.3f }); f.ripples.Add(new[] { 120f, 160f, 40f, 0.6f });
        using (var bmp = new Bitmap(f.Width, f.Height))
        {
            using (var g = Graphics.FromImage(bmp)) f.OnPaint(new PaintEventArgs(g, f.ClientRectangle));
            bmp.Save(pngPath, ImageFormat.Png);
        }
    }
}

class MainForm : Form
{
    readonly Label status = new Label { AutoSize = false, Dock = DockStyle.Bottom, Height = 64, Padding = new Padding(12, 0, 12, 8) };
    readonly Button[] buttons;

    public MainForm()
    {
        Text = "Technozen for Claude";
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
        b.Click += (s, e) => Do(work);
        return b;
    }

    // Work runs on its own STA thread so the window keeps painting; buttons are disabled meanwhile.
    void Do(Func<string> work)
    {
        foreach (var b in buttons) b.Enabled = false;
        status.Text = "Working...";
        var t = new Thread(() =>
        {
            string result;
            try { result = work(); } catch (Exception e) { result = "Failed: " + e.Message; }
            BeginInvoke((Action)(() => { status.Text = result; foreach (var b in buttons) b.Enabled = true; }));
        });
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
    }
}
