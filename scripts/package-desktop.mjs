import { spawnSync } from "node:child_process";
const kind = process.argv[2];
if (!["admin", "employee"].includes(kind))
  throw new Error("Choose admin or employee");
const url = process.env.EMS_API_URL;
if (!url)
  throw new Error(
    "Set EMS_API_URL before packaging; use HTTPS except for local loopback testing.",
  );
const u = new URL(url);
if (u.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(u.hostname))
  throw new Error("API must use HTTPS");
const env = { ...process.env, VITE_API_URL: url };
function run(command, args) {
  const r = spawnSync(command, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
run("npm", ["run", "build", "-w", `ems-${kind}-client`]);
run(process.execPath, ["scripts/build-electron.mjs", kind]);
run("npx", [
  "electron-builder",
  "--config",
  `ems-${kind}-client/electron-builder.yml`,
  "--win",
  "nsis",
  "--x64",
  ...(process.env.EMS_UNSIGNED === "1"
    ? ["-c.win.signAndEditExecutable=false"]
    : []),
]);
