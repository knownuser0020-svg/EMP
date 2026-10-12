import { app, powerMonitor } from "electron";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
interface Batch {
  batchId: string;
  startedAt: string;
  endedAt: string;
  keyboardEvents: number;
  mouseEvents: number;
  idleSeconds: number;
}
interface Queued {
  owner: string;
  batch: Batch;
}
export class TelemetryCollector {
  private hook: any;
  private timer?: NodeJS.Timeout;
  private idleTimer?: NodeJS.Timeout;
  private token = "";
  private owner = "";
  private started = Date.now();
  private keys = 0;
  private mouse = 0;
  private idle = 0;
  private lastMove = 0;
  private enabled = false;
  private queue: Queued[] = [];
  private loaded = false;
  private flushing?: Promise<void>;
  private readonly file = path.join(
    app.getPath("userData"),
    "telemetry-queue.json",
  );
  constructor(private readonly baseUrl: string) {}
  private key = () => {
    this.keys++;
  };
  private click = () => {
    this.mouse++;
  };
  private move = () => {
    const now = Date.now();
    if (now - this.lastMove >= 1000) {
      this.mouse++;
      this.lastMove = now;
    }
  };
  async start(token: string) {
    if (this.enabled) return { enabled: true, available: true };
    try {
      const claims = JSON.parse(
        Buffer.from(token.split(".")[1] ?? "", "base64url").toString(),
      );
      if (typeof claims.sub !== "string") throw new Error();
      this.owner = claims.sub;
      this.token = token;
      if (!this.loaded) {
        try {
          const data = JSON.parse(await readFile(this.file, "utf8"));
          this.queue = Array.isArray(data)
            ? data
                .filter(
                  (q) =>
                    q?.batch?.startedAt &&
                    Date.parse(q.batch.startedAt) > Date.now() - 172800000,
                )
                .slice(-288)
            : [];
        } catch {
          this.queue = [];
        }
        this.loaded = true;
      }
      const { uIOhook } = await import("uiohook-napi");
      this.hook = uIOhook;
      this.hook.on("keydown", this.key);
      this.hook.on("mousedown", this.click);
      this.hook.on("mousemove", this.move);
      this.hook.start();
      this.enabled = true;
      this.started = Date.now();
      this.keys = 0;
      this.mouse = 0;
      this.idle = 0;
      this.timer = setInterval(() => void this.flush().catch(() => {}), 300000);
      this.idleTimer = setInterval(() => {
        if (powerMonitor.getSystemIdleTime() >= 60) this.idle += 15;
      }, 15000);
      return { enabled: true, available: true };
    } catch {
      this.detach();
      this.token = "";
      return {
        enabled: false,
        available: false,
        reason:
          "System activity access is unavailable. Check input-monitoring permissions.",
      };
    }
  }
  private detach() {
    clearInterval(this.timer);
    clearInterval(this.idleTimer);
    if (this.hook) {
      this.hook.off("keydown", this.key);
      this.hook.off("mousedown", this.click);
      this.hook.off("mousemove", this.move);
      try {
        this.hook.stop();
      } catch {}
    }
    this.enabled = false;
  }
  async stop() {
    this.detach();
    try {
      await this.flush();
    } finally {
      this.token = "";
    }
    return { enabled: false, available: true };
  }
  async flush() {
    if (this.flushing) {
      await this.flushing;
      return;
    }
    this.flushing = this.doFlush();
    try {
      await this.flushing;
    } finally {
      this.flushing = undefined;
    }
  }
  private async doFlush() {
    if (!this.token || !this.owner) return;
    const now = Date.now();
    if (now - this.started >= 1000) {
      this.queue.push({
        owner: this.owner,
        batch: {
          batchId: randomUUID(),
          startedAt: new Date(this.started).toISOString(),
          endedAt: new Date(now).toISOString(),
          keyboardEvents: this.keys,
          mouseEvents: this.mouse,
          idleSeconds: Math.min(
            this.idle,
            Math.floor((now - this.started) / 1000),
          ),
        },
      });
      this.started = now;
      this.keys = 0;
      this.mouse = 0;
      this.idle = 0;
      this.queue = this.queue
        .filter((q) => Date.parse(q.batch.startedAt) > now - 172800000)
        .slice(-288);
      await this.save();
    }
    for (const record of [...this.queue].filter(
      (q) => q.owner === this.owner,
    )) {
      try {
        const r = await fetch(`${this.baseUrl}/api/v1/employee/telemetry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(record.batch),
          signal: AbortSignal.timeout(10000),
        });
        if (r.status === 401) {
          this.detach();
          this.token = "";
          break;
        }
        if (!r.ok) break;
        this.queue = this.queue.filter(
          (q) => q.batch.batchId !== record.batch.batchId,
        );
        await this.save();
      } catch {
        break;
      }
    }
  }
  private async save() {
    await mkdir(path.dirname(this.file), { recursive: true });
    await writeFile(this.file + ".tmp", JSON.stringify(this.queue), {
      mode: 0o600,
    });
    await rename(this.file + ".tmp", this.file);
  }
}
