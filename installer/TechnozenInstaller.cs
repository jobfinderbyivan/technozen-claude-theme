// Technozen for Claude: Windows installer / launcher.
// Build: python installer/build_exe.py  (uses the C# compiler that ships with Windows, no SDK needed)
//
// What it does. The Claude desktop app has no plugin hook and blocks remote debugging, but it does
// open DevTools by itself when launched with CLAUDE_DEV_TOOLS=undocked and Developer Mode is on.
// So: Install = copy this EXE to a permanent folder, turn Developer Mode on (a JSON file), add a Start
// Menu shortcut "Claude (Technozen)", and apply now. Launch (what the shortcut runs) = start Claude
// with DevTools open, paste the theme into the console with keystrokes, close DevTools.
// Uninstall = remove the shortcut and the copy, and optionally Developer Mode.
using System;
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
        if (args.Length > 0 && args[0] == "--launch") { Launcher.Run(); return; }
        if (args.Length > 1 && args[0] == "--check") { File.WriteAllText(args[1], Paths.Report()); return; }
        Application.Run(new MainForm());
    }
}

static class Paths
{
    static readonly string Local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

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

    public static string Shortcut()
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Claude (Technozen).lnk");
    }

    public static bool DeveloperModeOn()
    {
        string f = DeveloperSettings();
        return File.Exists(f) && File.ReadAllText(f).Replace(" ", "").Contains("\"allowDevTools\":true");
    }

    public static string Report()
    {
        return "userData: " + UserData() + "\r\ndeveloperSettings: " + DeveloperSettings() + " (on: " + DeveloperModeOn() + ")\r\n"
             + "claude: " + ClaudeExe() + "\r\ninstalled copy: " + InstalledExe() + " (exists: " + File.Exists(InstalledExe()) + ")\r\n"
             + "shortcut: " + Shortcut() + " (exists: " + File.Exists(Shortcut()) + ")\r\n"
             + "app running: " + (Launcher.ClaudeRunning() ? "yes" : "no") + "\r\nsnippet bytes: " + Snippet.Text.Length + "\r\n";
    }
}

static class Install
{
    public static void EnableDeveloperMode()
    {
        // The app's schema has exactly one key, allowDevTools, so writing the whole file is safe.
        Directory.CreateDirectory(Paths.UserData());
        File.WriteAllText(Paths.DeveloperSettings(), "{\n  \"allowDevTools\": true\n}\n");
    }

    public static void DisableDeveloperMode()
    {
        if (File.Exists(Paths.DeveloperSettings())) File.Delete(Paths.DeveloperSettings());
    }

    // The shortcut must not point at Downloads, so the EXE is copied somewhere permanent first.
    public static void CreateShortcut()
    {
        Directory.CreateDirectory(Paths.InstallDir());
        string me = Application.ExecutablePath;
        if (!string.Equals(me, Paths.InstalledExe(), StringComparison.OrdinalIgnoreCase)) File.Copy(me, Paths.InstalledExe(), true);
        string icon = Paths.ClaudeExe();
        foreach (Process p in Process.GetProcesses())   // the real package exe has the icon; the alias is a 0-byte link
            if (Paths.IsClaudeApp(p)) { try { icon = p.MainModule.FileName; } catch { } break; }
        Type shell = Type.GetTypeFromProgID("WScript.Shell");
        dynamic ws = Activator.CreateInstance(shell);
        dynamic lnk = ws.CreateShortcut(Paths.Shortcut());
        lnk.TargetPath = Paths.InstalledExe();
        lnk.Arguments = "--launch";
        lnk.Description = "Start Claude with the Technozen theme applied";
        if (icon != null) lnk.IconLocation = icon + ",0";
        lnk.Save();
    }

    public static void RemoveShortcut()
    {
        if (File.Exists(Paths.Shortcut())) File.Delete(Paths.Shortcut());
        bool runningFromCopy = string.Equals(Application.ExecutablePath, Paths.InstalledExe(), StringComparison.OrdinalIgnoreCase);
        if (!runningFromCopy && Directory.Exists(Paths.InstallDir())) Directory.Delete(Paths.InstallDir(), true);
    }
}

static class Launcher
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

    static Process[] AppProcesses()
    {
        return Array.FindAll(Process.GetProcessesByName("claude"), Paths.IsClaudeApp);
    }

    public static bool ClaudeRunning() { return AppProcesses().Length > 0; }

    // The Store build only starts once; a second launch hands its arguments to the running one and
    // the environment variable never reaches it, so Claude has to be closed first. Never killed: if
    // a dialog keeps it open, the user closes it themselves.
    static bool CloseClaude()
    {
        foreach (Process p in AppProcesses()) { try { p.CloseMainWindow(); } catch { } }
        for (int i = 0; i < 75 && ClaudeRunning(); i++) Thread.Sleep(200);
        if (ClaudeRunning()) return false;
        Thread.Sleep(1000);
        return true;
    }

    static IntPtr FindDevToolsWindow()
    {
        IntPtr found = IntPtr.Zero;
        EnumWindows((h, l) =>
        {
            if (!IsWindowVisible(h)) return true;
            var sb = new StringBuilder(256);
            GetWindowText(h, sb, sb.Capacity);
            string t = sb.ToString();
            if (!t.Contains("DevTools") && !t.Contains("Developer Tools")) return true;
            uint pid; GetWindowThreadProcessId(h, out pid);
            try { if (Paths.IsClaudeApp(Process.GetProcessById((int)pid))) { found = h; return false; } } catch { }
            return true;
        }, IntPtr.Zero);
        return found;
    }

    static bool SetClipboard()
    {
        try { Clipboard.SetText(Snippet.Text); return true; } catch { return false; }
    }

    // Returns null on success, otherwise the message already shown to the user.
    public static string Run()
    {
        if (!Paths.DeveloperModeOn()) return Fail("Developer Mode is off. Run the installer and click Install first.");
        if (Paths.ClaudeExe() == null) return Fail("Could not find the Claude desktop app on this PC.");
        if (ClaudeRunning())
        {
            var answer = MessageBox.Show("Claude is running and has to be closed to apply the theme. Unsaved text and any Claude Code session running inside the app will be lost.\n\nClose Claude now?",
                "Technozen for Claude", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (answer != DialogResult.Yes) return "Cancelled.";
            if (!CloseClaude()) return Fail("Claude did not close (a dialog may be open). Close it yourself, then run the shortcut again.");
        }
        var psi = new ProcessStartInfo(Paths.ClaudeExe()) { UseShellExecute = false };
        psi.EnvironmentVariables["CLAUDE_DEV_TOOLS"] = "undocked"; // the app opens DevTools itself with this set
        try { Process.Start(psi); } catch (Exception e) { return Fail("Could not start Claude: " + e.Message); }

        IntPtr devtools = IntPtr.Zero;
        for (int i = 0; i < 90 && devtools == IntPtr.Zero; i++) { Thread.Sleep(1000); devtools = FindDevToolsWindow(); }
        if (devtools == IntPtr.Zero) return Fail("Claude started but its DevTools window did not appear within 90 seconds.");
        Thread.Sleep(2500); // let the DevTools frontend finish loading

        if (!SetClipboard()) return Fail("Another program is holding the clipboard.");
        SetForegroundWindow(devtools);
        Thread.Sleep(500);
        if (GetForegroundWindow() != devtools) return Fail("Could not bring the DevTools window to the front.");

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
        return null;
    }

    static string Fail(string why)
    {
        string how = ClaudeRunning()
            ? (SetClipboard() ? "\n\nThe theme is on your clipboard. In Claude press Ctrl+Alt+I, click the Console tab, Ctrl+V, Enter." : "")
            : "\n\nClaude is not running. Start it from the \"Claude (Technozen)\" shortcut to try again.";
        MessageBox.Show(why + how, "Technozen for Claude", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        return why;
    }
}

class MainForm : Form
{
    readonly Label status = new Label { AutoSize = false, Dock = DockStyle.Bottom, Height = 64, Padding = new Padding(12, 0, 12, 8) };
    readonly Button[] buttons;

    public MainForm()
    {
        Text = "Technozen for Claude";
        ClientSize = new Size(440, 270);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        Font = new Font("Segoe UI", 9.5f);
        var intro = new Label
        {
            Dock = DockStyle.Top, Height = 84, Padding = new Padding(12, 10, 12, 0),
            Text = "Five Technozen themes for the Claude desktop app.\nInstall copies this program to your user folder, turns on Claude's Developer Mode, adds \"Claude (Technozen)\" to the Start Menu, and applies the theme now (Claude closes and reopens). Start Claude from that shortcut to keep the theme."
        };
        buttons = new[]
        {
            MakeButton("Install and apply", 100, () =>
            {
                Install.EnableDeveloperMode();
                Install.CreateShortcut();
                return Launcher.Run() ?? "Installed. The theme is on; a panel in Claude's bottom-right corner switches themes.";
            }),
            MakeButton("Apply again (reopens Claude)", 140, () => Launcher.Run() ?? "Applied."),
            MakeButton("Uninstall", 180, () =>
            {
                Install.RemoveShortcut();
                var r = MessageBox.Show("Also turn Claude's Developer Mode off? (Takes effect the next time Claude starts.)", "Technozen for Claude", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (r == DialogResult.Yes) Install.DisableDeveloperMode();
                return "Removed the shortcut and the installed copy. In Claude, press Ctrl+Alt+0 to take the theme off.";
            }),
        };
        Controls.AddRange(new Control[] { intro, buttons[0], buttons[1], buttons[2], status });
        status.Text = (Paths.DeveloperModeOn() ? "Developer Mode is on." : "Developer Mode is off.")
                    + (File.Exists(Paths.Shortcut()) ? " Shortcut installed." : "");
    }

    Button MakeButton(string text, int top, Func<string> work)
    {
        var b = new Button { Text = text, Left = 12, Top = top, Width = 416, Height = 32 };
        b.Click += (s, e) => Do(work);
        return b;
    }

    // Work runs on its own STA thread (clipboard and SendKeys need STA) so the window keeps painting,
    // and the buttons are disabled meanwhile so a second click cannot start a second run.
    void Do(Func<string> work)
    {
        foreach (var b in buttons) b.Enabled = false;
        status.Text = "Working... keep your hands off the keyboard and mouse until this says done.";
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
