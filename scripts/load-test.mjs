import { performance } from "node:perf_hooks";
const base = process.env.EMS_API_URL ?? "http://127.0.0.1:8080",
  count = Number(process.env.LOAD_USERS ?? 500);
if (!Number.isInteger(count) || count < 1 || count > 500)
  throw new Error("LOAD_USERS must be 1–500");
if (!process.env.LOAD_EMAIL || !process.env.LOAD_PASSWORD)
  throw new Error(
    "Set LOAD_EMAIL and LOAD_PASSWORD for a local test administrator",
  );
const r = await fetch(base + "/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: process.env.LOAD_EMAIL,
    password: process.env.LOAD_PASSWORD,
  }),
});
if (!r.ok) throw new Error("Load-test sign-in failed");
const { token } = await r.json(),
  headers = { Authorization: `Bearer ${token}` };
for (let i = 0; i < 10; i++)
  await fetch(base + "/api/v1/admin/employees?size=20", { headers });
const started = performance.now(),
  results = await Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const t = performance.now();
      try {
        const r = await fetch(
          base +
            [
              "/api/v1/admin/employees?size=20",
              "/api/v1/admin/leaves?size=20",
              "/api/v1/admin/attendance?size=20",
            ][i % 3],
          { headers, signal: AbortSignal.timeout(15000) },
        );
        const data = await r.json();
        return {
          ok: r.ok && Array.isArray(data.content),
          ms: performance.now() - t,
        };
      } catch {
        return { ok: false, ms: performance.now() - t };
      }
    }),
  ),
  times = results.map((r) => r.ms).sort((a, b) => a - b),
  summary = {
    concurrentRequests: count,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    totalMs: Math.round(performance.now() - started),
    p50Ms: Math.round(times[Math.floor(count * 0.5)]),
    p95Ms: Math.round(times[Math.min(count - 1, Math.floor(count * 0.95))]),
    maxMs: Math.round(times.at(-1)),
    note: "One local simultaneous burst; one admin token; seeded data. Not a sustained production capacity guarantee.",
  };
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exitCode = 1;
