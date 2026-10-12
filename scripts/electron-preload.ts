import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld(
  "desktop",
  Object.freeze({
    platform: process.platform,
    setMonitoring: (enabled: boolean, token?: string) =>
      ipcRenderer.invoke("monitor:set", { enabled, token }),
    flushTelemetry: () => ipcRenderer.invoke("monitor:flush"),
    biometricAvailable: () => ipcRenderer.invoke("biometric:available"),
    biometricUnlock: () => ipcRenderer.invoke("biometric:unlock"),
  }),
);
