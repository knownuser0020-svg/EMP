import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
const kind = process.argv[2];
if (!["admin", "employee"].includes(kind))
  throw new Error("Choose admin or employee");
const out = `ems-${kind}-client/dist-electron`;
await mkdir(out, { recursive: true });
await build({
  entryPoints: ["scripts/electron-main.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: `${out}/main.cjs`,
  external: ["electron", "uiohook-napi"],
  define: {
    APP_KIND: JSON.stringify(kind),
    EMS_API_URL: JSON.stringify(
      process.env.EMS_API_URL ?? "http://127.0.0.1:8080",
    ),
  },
});
await build({
  entryPoints: ["scripts/electron-preload.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: `${out}/preload.cjs`,
  external: ["electron"],
});
console.log(`Built secure ${kind} desktop shell.`);
