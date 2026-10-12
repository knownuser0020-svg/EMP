import { spawn } from "node:child_process";
const kind = process.argv[2];
if (!["admin", "employee"].includes(kind))
  throw new Error("Choose admin or employee");
function run(cmd, args, env = process.env) {
  return spawn(cmd, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
}
await new Promise((resolve, reject) => {
  const p = run(process.execPath, ["scripts/build-electron.mjs", kind]);
  p.on("exit", (c) =>
    c === 0 ? resolve() : reject(new Error("Desktop build failed")),
  );
});
const vite = run("npm", ["run", "dev", "-w", `ems-${kind}-client`]);
const port = kind === "admin" ? 5173 : 5174;
for (let i = 0; i < 60; i++) {
  try {
    await fetch(`http://localhost:${port}`);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
    if (i === 59) throw new Error("Vite did not become ready");
  }
}
const electron = run(
  "npx",
  ["electron", `ems-${kind}-client/dist-electron/main.cjs`],
  { ...process.env, EMS_DEV_URL: `http://localhost:${port}` },
);
function cleanup() {
  vite.kill();
  electron.kill();
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
electron.on("exit", () => vite.kill());
