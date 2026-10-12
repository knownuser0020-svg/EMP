import { useState, useEffect, type FormEvent } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Coffee,
  Fingerprint,
  Leaf,
  LogOut,
  Palmtree,
  Play,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  X,
} from "lucide-react";
import {
  Avatar,
  Brand,
  IconButton,
  Login,
  Modal,
  formatDate,
  isDemo,
  useWorkspace,
} from "@ems/shared";
export default function App() {
  const {
    session,
    clockInAt,
    clock,
    leaves,
    candidates,
    requestLeave,
    toggleTask,
    logout,
  } = useWorkspace();
  const [time, setTime] = useState(Date.now()),
    [monitor, setMonitor] = useState(false),
    [consent, setConsent] = useState(false),
    [leaveModal, setLeaveModal] = useState(false),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [biometric, setBiometric] = useState(false),
    [locked, setLocked] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setTime(Date.now()), 1000);
    void window.desktop?.biometricAvailable().then(setBiometric);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  if (!isDemo && !session) return <Login audience="employee" />;
  const employee = session?.employee ?? {
      id: "emp-7",
      name: "Sophia Adams",
      title: "UI/UX Designer",
      avatar: 1,
    },
    candidate = candidates.find((c) => c.id === employee.id),
    ownLeaves = leaves.filter((l) => l.employeeId === employee.id),
    seconds = clockInAt
      ? Math.max(0, Math.floor((time - new Date(clockInAt).getTime()) / 1000))
      : 0,
    elapsed = [
      Math.floor(seconds / 3600),
      Math.floor((seconds % 3600) / 60),
      seconds % 60,
    ]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
  async function sharing(enabled: boolean) {
    if (!window.desktop) {
      setNotice("System monitoring requires the desktop application.");
      return;
    }
    const r = await window.desktop.setMonitoring(enabled, session?.token);
    setMonitor(r.enabled);
    setNotice(
      r.reason ??
        (r.enabled
          ? "Activity sharing is on. Only aggregate input counts are collected."
          : "Activity sharing is off."),
    );
  }
  async function clockAction() {
    setBusy(true);
    try {
      if (clockInAt && monitor) {
        await window.desktop?.flushTelemetry();
        await sharing(false);
      }
      await clock();
      setNotice(
        clockInAt
          ? "Your workday is saved. Take a well-earned breath."
          : "You’re clocked in. Make it a good one.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submitLeave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const d = new FormData(e.currentTarget);
    try {
      await requestLeave({
        employeeId: employee.id,
        type: String(d.get("type")) as "Vacation",
        startDate: String(d.get("startDate")),
        endDate: String(d.get("endDate")),
        reason: String(d.get("reason")),
      });
      setLeaveModal(false);
      setNotice(
        "Your request is with your manager. A little rest is a good thing.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="employee-shell">
      <header className="employee-header">
        <Brand />
        <span className="employee-space">
          YOUR WORKDAY, SIMPLIFIED {isDemo && <b>DEMO</b>}
        </span>
        <div className="employee-profile">
          <Avatar name={employee.name} index={employee.avatar} size={35} />
          <span>{employee.name}</span>
          {biometric && (
            <IconButton
              label="Lock with biometrics"
              onClick={() => setLocked(true)}
            >
              <Fingerprint size={18} />
            </IconButton>
          )}
          {!isDemo && (
            <IconButton
              label="Sign out"
              onClick={async () => {
                try {
                  if (monitor) {
                    await window.desktop?.flushTelemetry();
                    await sharing(false);
                  }
                  await logout();
                } catch (e) {
                  setNotice((e as Error).message);
                }
              }}
            >
              <LogOut size={17} />
            </IconButton>
          )}
        </div>
      </header>
      <main className="employee-main">
        <div className="employee-greeting">
          <span className="eyebrow">
            <span className="live-dot" />A FRESH START, EVERY DAY
          </span>
          <h1>
            Make room for a good day, {employee.name.split(" ")[0]}.{" "}
            <Sun size={28} />
          </h1>
          <p>A little focus. A little balance. A whole lot of possibility.</p>
        </div>
        <div className="employee-grid">
          <section className="surface clock-card">
            <div className="section-heading">
              <h2>Your time, thoughtfully.</h2>
              <span
                className={`status-badge ${clockInAt ? "active" : "onboarding"}`}
              >
                {clockInAt ? "On the clock" : "Ready when you are"}
              </span>
            </div>
            <div className={`clock-visual ${clockInAt ? "clock-active" : ""}`}>
              <div>
                <Clock3 size={35} strokeWidth={1} />
              </div>
            </div>
            <div className="work-timer">{elapsed}</div>
            <p>
              {clockInAt
                ? `Clocked in at ${new Date(clockInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "A fresh canvas for your workday."}
            </p>
            <button
              className={`primary-button clock-button ${clockInAt ? "clock-out" : ""}`}
              disabled={busy}
              onClick={() => void clockAction()}
            >
              {clockInAt ? <Square size={14} /> : <Play size={14} />}{" "}
              {busy
                ? "One moment…"
                : clockInAt
                  ? "Clock out"
                  : "Let’s clock in"}
            </button>
            <div className="monitor-setting">
              <ShieldCheck size={18} />
              <div>
                <strong>Activity sharing {monitor ? "is on" : "is off"}</strong>
                <span>Only while clocked in. Always in your control.</span>
              </div>
              <button
                role="switch"
                aria-label="Activity sharing"
                aria-checked={monitor}
                className={`toggle ${monitor ? "on" : ""}`}
                disabled={!clockInAt}
                onClick={() =>
                  monitor ? void sharing(false) : setConsent(true)
                }
              >
                <span />
              </button>
            </div>
          </section>
          <section className="surface employee-tasks">
            <div className="section-heading">
              <div>
                <h2>A little progress, every day.</h2>
                <p>Your onboarding checklist</p>
              </div>
              <span className="task-total">
                {candidate?.completed ?? 0}
                <small>/{candidate?.total ?? 0}</small>
              </span>
            </div>
            <div className="employee-progress">
              <span
                style={{
                  width: `${candidate?.total ? (candidate.completed / candidate.total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="task-list">
              {candidate?.tasks.map((t) => (
                <button
                  key={t.id}
                  className={`task-item ${t.done ? "done" : ""}`}
                  role="checkbox"
                  aria-checked={t.done}
                  onClick={() =>
                    void toggleTask(candidate.id, t.id).catch((e) =>
                      setNotice(e.message),
                    )
                  }
                >
                  <span className="task-check">
                    {t.done && <Check size={13} />}
                  </span>
                  <span>{t.label}</span>
                </button>
              ))}
              {!candidate && (
                <p className="empty-state">
                  You’re all set. Your manager will add your next steps here.
                </p>
              )}
            </div>
          </section>
          <section className="surface employee-leaves">
            <div className="section-heading">
              <div>
                <h2>Life happens. Make time.</h2>
                <p>A clear view of your time away.</p>
              </div>
              <button
                className="soft-button"
                onClick={() => setLeaveModal(true)}
              >
                <Palmtree size={14} />
                Request time off
              </button>
            </div>
            {ownLeaves.length ? (
              <div className="employee-leave-list">
                {ownLeaves.map((l) => (
                  <div key={l.id}>
                    <span className="leave-type-icon">
                      <Palmtree size={21} />
                    </span>
                    <div>
                      <strong>{l.type}</strong>
                      <p>
                        {formatDate(l.startDate)} — {formatDate(l.endDate)}
                      </p>
                    </div>
                    <span
                      className={`status-badge ${l.status === "Approved" ? "active" : "onboarding"}`}
                    >
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="leave-empty">
                <div>
                  <Coffee size={32} strokeWidth={1} />
                </div>
                <h3>Good work starts with a little rest.</h3>
                <p>No time off planned yet. When you need it, we’re here.</p>
              </div>
            )}
          </section>
          <section className="surface employee-note">
            <Sparkles size={24} strokeWidth={1.4} />
            <div>
              <h2>You bring something special.</h2>
              <p>
                Great things happen when people have the space to do their best
                work. We’re glad you’re here.
              </p>
            </div>
            <Leaf size={47} strokeWidth={0.8} />
          </section>
        </div>
        <footer className="employee-footer">
          <Leaf size={12} />A little more connected, every day.
          <span>Forma · Your people, together.</span>
        </footer>
      </main>
      {leaveModal && (
        <Modal
          title="A little time for you."
          subtitle="Send your manager a time-off request."
          onClose={() => setLeaveModal(false)}
        >
          <form className="form-stack" onSubmit={submitLeave}>
            <label>
              Type of leave
              <select name="type">
                <option>Vacation</option>
                <option>Paid leave</option>
                <option>Sick leave</option>
              </select>
            </label>
            <div className="form-columns">
              <label>
                From
                <input type="date" name="startDate" required />
              </label>
              <label>
                Until
                <input type="date" name="endDate" required />
              </label>
            </div>
            <label>
              A note for your manager (optional)
              <textarea
                name="reason"
                maxLength={500}
                placeholder="Anything you’d like us to know…"
              />
            </label>
            <div className="form-footer">
              <button
                type="button"
                className="soft-button"
                onClick={() => setLeaveModal(false)}
              >
                Cancel
              </button>
              <button className="primary-button" disabled={busy}>
                Send request
                <ArrowUpRight size={15} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {consent && (
        <Modal
          title="Your work. Your privacy."
          subtitle="Activity sharing is optional and visible while it’s running."
          onClose={() => setConsent(false)}
        >
          <div className="privacy-copy">
            <ShieldCheck size={40} />
            <p>
              With your permission, the desktop app counts keyboard and mouse
              events while you are clocked in. A summary is sent to your
              workspace every five minutes.
            </p>
            <p>
              It does not record typed text, key identities, websites, clipboard
              contents, or screenshots. You can stop sharing at any time. Unsent
              counts are queued locally for retry.
            </p>
            {!window.desktop && (
              <p className="form-error">
                System activity sharing requires the desktop application.
              </p>
            )}
          </div>
          <div className="form-footer">
            <button className="soft-button" onClick={() => setConsent(false)}>
              Keep it off
            </button>
            <button
              className="primary-button"
              disabled={!window.desktop || isDemo}
              onClick={() => {
                setConsent(false);
                void sharing(true);
              }}
            >
              Enable sharing
            </button>
          </div>
        </Modal>
      )}
      {locked && (
        <div className="lock-screen">
          <Brand />
          <Fingerprint size={50} />
          <h1>A moment just for you.</h1>
          <button
            className="primary-button"
            onClick={async () => {
              try {
                if (await window.desktop?.biometricUnlock()) setLocked(false);
              } catch {
                setNotice("Unable to unlock. Try again.");
              }
            }}
          >
            Unlock workspace
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {notice}
          <IconButton label="Dismiss" onClick={() => setNotice("")}>
            <X size={14} />
          </IconButton>
        </div>
      )}
    </div>
  );
}
