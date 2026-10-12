import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  session,
  systemPreferences,
} from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { TelemetryCollector } from "./telemetry";
declare const APP_KIND: "admin" | "employee";
declare const EMS_API_URL: string;
protocol.registerSchemesAsPrivileged([
  {
    scheme: "forma",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
let window: BrowserWindow | null = null,
  collector: TelemetryCollector | undefined;
const development = !app.isPackaged && !!process.env.EMS_DEV_URL,
  apiUrl = new URL(EMS_API_URL);
if (
  apiUrl.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(apiUrl.hostname)
)
  throw new Error("Workspace API must use HTTPS.");
function trusted(event: Electron.IpcMainInvokeEvent) {
  try {
    const location = new URL(event.senderFrame?.url ?? "");
    if (
      event.sender !== window?.webContents ||
      !(
        (location.protocol === "forma:" && location.hostname === "app") ||
        (development &&
          location.origin === new URL(process.env.EMS_DEV_URL!).origin)
      )
    )
      throw new Error();
  } catch {
    throw new Error("Untrusted desktop request");
  }
}
async function createWindow() {
  window = new BrowserWindow({
    title: APP_KIND === "admin" ? "Forma · Admin" : "Forma · Your workday",
    width: APP_KIND === "admin" ? 1460 : 1160,
    height: 980,
    minWidth: 400,
    minHeight: 620,
    backgroundColor: "#F4EDE2",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  window.webContents.on(
    "did-start-navigation",
    (_event, _url, _inPlace, isMainFrame) => {
      if (isMainFrame) void collector?.stop();
    },
  );
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    const target = new URL(url);
    if (
      !(
        (target.protocol === "forma:" && target.hostname === "app") ||
        (development &&
          target.origin === new URL(process.env.EMS_DEV_URL!).origin)
      )
    )
      event.preventDefault();
    else void collector?.stop();
  });
  window.once("ready-to-show", () => window?.show());
  await window.loadURL(
    development ? process.env.EMS_DEV_URL! : "forma://app/index.html",
  );
}
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  protocol.handle("forma", async (request) => {
    const u = new URL(request.url);
    if (u.host !== "app") return new Response("Not found", { status: 404 });
    const root = path.resolve(__dirname, "../dist"),
      file = path.resolve(
        root,
        decodeURIComponent(u.pathname).replace(/^\//, "") || "index.html",
      );
    if (!file.startsWith(root + path.sep))
      return new Response("Forbidden", { status: 403 });
    const r = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(r.headers);
    headers.set(
      "Content-Security-Policy",
      `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src ${apiUrl.origin}; object-src 'none'; base-uri 'self'; frame-src 'none'`,
    );
    return new Response(r.body, { status: r.status, headers });
  });
  if (APP_KIND === "employee") collector = new TelemetryCollector(EMS_API_URL);
  ipcMain.handle("monitor:set", async (e, r) => {
    trusted(e);
    if (!collector) throw new Error("Employee client required");
    if (typeof r?.enabled !== "boolean") throw new Error("Invalid request");
    if (r.enabled && (typeof r.token !== "string" || r.token.length > 8192))
      return {
        enabled: false,
        available: true,
        reason: "Sign in to a live workspace to enable sharing.",
      };
    return r.enabled ? collector.start(r.token) : collector.stop();
  });
  ipcMain.handle("monitor:flush", async (e) => {
    trusted(e);
    await collector?.flush();
  });
  ipcMain.handle("biometric:available", (e) => {
    trusted(e);
    return (
      process.platform === "darwin" && systemPreferences.canPromptTouchID()
    );
  });
  ipcMain.handle("biometric:unlock", async (e) => {
    trusted(e);
    if (process.platform !== "darwin" || !systemPreferences.canPromptTouchID())
      return false;
    try {
      await systemPreferences.promptTouchID("unlock your Forma workspace");
      return true;
    } catch {
      return false;
    }
  });
  await createWindow();
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) void createWindow();
  });
});
app.on("window-all-closed", () => {
  void collector?.stop();
  if (process.platform !== "darwin") app.quit();
});
let quitting = false;
app.on("before-quit", (e) => {
  if (collector && !quitting) {
    e.preventDefault();
    quitting = true;
    void collector.stop().finally(() => app.quit());
  }
});
