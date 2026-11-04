// Technozen for Claude: Windows installer and background watcher.
// Build: python installer/build_exe.py  (uses the C# compiler that ships with Windows, no SDK needed)
//
// How it keeps the theme on. The Claude desktop app has no plugin hook and blocks remote debugging,
// but with Developer Mode on it opens DevTools by itself whenever the environment variable
// CLAUDE_DEV_TOOLS is set. Install therefore: copies this EXE to a permanent folder, turns Developer
// Mode on (a JSON file), sets CLAUDE_DEV_TOOLS=undocked for the user, and starts a watcher (also at
// every login) that waits for Claude's DevTools window, pastes the theme into the console with
// keystrokes, and closes DevTools. So Claude can be started any way at all and the theme follows.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
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
        if (args.Length > 0 && args[0] == "--watch") { Watcher.Loop(); return; }
        if (args.Length > 1 && args[0] == "--check") { File.WriteAllText(args[1], Paths.Report()); return; }
        Application.Run(new MainForm());
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
             + "watcher running: " + Watcher.IsRunning() + "\r\napp running: " + Launcher.ClaudeRunning() + "\r\nsnippet bytes: " + Snippet.Text.Length + "\r\n";
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
}

static class Launcher
{
    static Process[] AppProcesses() { return Array.FindAll(Process.GetProcessesByName("claude"), Paths.IsClaudeApp); }
    public static bool ClaudeRunning() { return AppProcesses().Length > 0; }

    // Restart Claude so the theme shows now; the watcher does the injecting. Claude is asked to close,
    // never killed: if a dialog keeps it open, the user closes it themselves.
    public static string Restart()
    {
        if (Paths.ClaudeExe() == null) return "Could not find the Claude desktop app on this PC.";
        if (ClaudeRunning())
        {
            var answer = MessageBox.Show("Claude is running and has to be closed to apply the theme now. Unsaved text and any Claude Code session running inside the app will be lost.\n\nClose Claude now?",
                "Technozen for Claude", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (answer != DialogResult.Yes) return "Installed. The theme will be on the next time Claude starts.";
            foreach (Process p in AppProcesses()) { try { p.CloseMainWindow(); } catch { } }
            for (int i = 0; i < 75 && ClaudeRunning(); i++) Thread.Sleep(200);
            if (ClaudeRunning()) return "Claude did not close (a dialog may be open). Close it yourself and start it again; the theme comes on by itself.";
            Thread.Sleep(1000);
        }
        var psi = new ProcessStartInfo(Paths.ClaudeExe()) { UseShellExecute = false };
        psi.EnvironmentVariables[Paths.EnvName] = "undocked";
        try { Process.Start(psi); } catch (Exception e) { return "Could not start Claude: " + e.Message; }
        return "Claude is starting; the theme goes on in about ten seconds. Keep your hands off the keyboard until then.";
    }
}

static class Watcher
{
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);
    [DllImport("user32.dll")] static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool PostMessage(IntPtr hWnd, uint msg, IntPtr w, IntPtr l);
    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    const uint WM_CLOSE = 0x0010;
    const string MutexName = "Local\\TechnozenForClaudeWatcher";

    public static bool IsRunning()
    {
        bool created;
        using (new Mutex(false, MutexName, out created)) return !created;
    }

    public static void Loop()
    {
        bool created;
        using (var m = new Mutex(true, MutexName, out created))
        {
            if (!created) return; // one watcher is enough
            var done = new Dictionary<int, int>(); // Claude pid -> attempts; a pid is injected once per app run
            while (true)
            {
                try
                {
                    int pid; IntPtr devtools = FindDevToolsWindow(out pid);
                    if (devtools != IntPtr.Zero)
                    {
                        int attempts; done.TryGetValue(pid, out attempts);
                        if (attempts < 10) // focus can be refused; retry a few times, then leave that window alone
                        {
                            if (attempts == 0) Thread.Sleep(2500); // let the DevTools frontend finish loading
                            done[pid] = Inject(devtools) ? 10 : attempts + 1;
                        }
                    }
                    foreach (int old in new List<int>(done.Keys))
                        try { Process.GetProcessById(old); } catch { done.Remove(old); }
                }
                catch { }
                Thread.Sleep(1000);
            }
        }
    }

    static IntPtr FindDevToolsWindow(out int owner)
    {
        IntPtr found = IntPtr.Zero; int ownerPid = 0;
        EnumWindows((h, l) =>
        {
            if (!IsWindowVisible(h)) return true;
            var sb = new StringBuilder(256);
            GetWindowText(h, sb, sb.Capacity);
            string t = sb.ToString();
            if (!t.Contains("DevTools") && !t.Contains("Developer Tools")) return true;
            uint pid; GetWindowThreadProcessId(h, out pid);
            try { if (Paths.IsClaudeApp(Process.GetProcessById((int)pid))) { found = h; ownerPid = (int)pid; return false; } } catch { }
            return true;
        }, IntPtr.Zero);
        owner = ownerPid;
        return found;
    }

    // Paste the theme into the DevTools console. Returns false when the window could not be focused.
    static bool Inject(IntPtr devtools)
    {
        try { Clipboard.SetText(Snippet.Text); } catch { return false; }
        SetForegroundWindow(devtools);
        Thread.Sleep(400);
        if (GetForegroundWindow() != devtools) { SendKeys.SendWait("%"); SetForegroundWindow(devtools); Thread.Sleep(400); } // the Alt tap lifts Windows' foreground lock
        if (GetForegroundWindow() != devtools) return false;
        // Command menu > "Show Console" puts the cursor in the console prompt whatever panel was open.
        SendKeys.SendWait("^+p"); Thread.Sleep(700);
        SendKeys.SendWait("Show Console"); Thread.Sleep(700);
        SendKeys.SendWait("{ENTER}"); Thread.Sleep(900);
        // DevTools blocks the first paste ever with a self-XSS warning until "allow pasting" is typed.
        // Paste, answer the warning, paste again: with the warning the first paste is empty and the
        // second runs; without it the first attempt becomes a syntax error (runs nothing) and the second runs.
        SendKeys.SendWait("^v"); Thread.Sleep(800);
        SendKeys.SendWait("allow pasting{ENTER}"); Thread.Sleep(800);
        SendKeys.SendWait("^v"); Thread.Sleep(1500);
        SendKeys.SendWait("{ENTER}"); Thread.Sleep(1500);
        PostMessage(devtools, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        return true;
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
            Text = "Five Technozen themes for the Claude desktop app.\nInstall turns on Claude's Developer Mode and starts a small helper (at every login) that puts the theme on each time Claude opens, however you start it. Claude closes and reopens once now."
        };
        buttons = new[]
        {
            MakeButton("Install and apply", 100, () => { Install.Apply(); return Launcher.Restart(); }),
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

    // Work runs on its own STA thread (the clipboard needs STA) so the window keeps painting,
    // and the buttons are disabled meanwhile so a second click cannot start a second run.
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
