import { useState, useEffect, type FormEvent } from "react";
import {
  LayoutDashboard,
  Users,
  Flag,
  Search,
  Bell,
  Plus,
  CalendarDays,
  Clock3,
  ChartNoAxesColumnIncreasing,
  Settings2,
  CircleHelp,
  Sparkles,
  Sun,
  LogOut,
  Check,
  Menu,
  X,
  Leaf,
  ArrowUpRight,
} from "lucide-react";
import {
  Avatar,
  Brand,
  IconButton,
  Modal,
  Login,
  isDemo,
  useWorkspace,
  formatDate,
} from "@ems/shared";
import { Timeline } from "./Timeline";
import { Events, Onboarding, Assistant } from "./Widgets";
import { People, Reports, AttendanceView } from "./People";
export type View =
  | "Dashboard"
  | "Employees"
  | "Reports"
  | "Calendar"
  | "Attendance";
export default function App() {
  const [view, setView] = useState<View>("Dashboard"),
    [modal, setModal] = useState<
      "add" | "search" | "notifications" | "settings" | "help" | null
    >(null),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false),
    [compact, setCompact] = useState(false),
    [query, setQuery] = useState("");
  const { session, employees, leaves, totalEmployees, error, logout } =
    useWorkspace();
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal("search");
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  if (!isDemo && !session) return <Login audience="admin" />;
  if (session?.role === "EMPLOYEE")
    return (
      <div className="empty-state">
        <Brand />
        <h1>This workspace is for administrators.</h1>
        <p>Use the employee application for your workday.</p>
        <button className="primary-button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    );
  const navigate = (next: View) => {
    setView(next);
    setMenu(false);
  };
  const close = () => setModal(null);
  const admin = session?.employee.name.split(" ")[0] ?? "Emily";
  return (
    <div className={`app-shell ${compact ? "compact" : ""}`}>
      <aside className={`sidebar ${menu ? "sidebar-open" : ""}`}>
        <a
          href="#"
          className="brand-home"
          aria-label="Forma home"
          onClick={(e) => {
            e.preventDefault();
            navigate("Dashboard");
          }}
        >
          <Brand compact />
        </a>
        <nav className="side-nav" aria-label="Workspace navigation">
          {(
            [
              { label: "Dashboard", icon: LayoutDashboard },
              { label: "Employees", icon: Users },
              { label: "Calendar", icon: CalendarDays },
              { label: "Attendance", icon: Clock3 },
              { label: "Reports", icon: ChartNoAxesColumnIncreasing },
            ] as const
          ).map(({ label, icon: Icon }) => (
            <IconButton
              key={label}
              label={label}
              className={view === label ? "side-active" : ""}
              onClick={() => navigate(label)}
            >
              <Icon size={19} strokeWidth={1.6} />
            </IconButton>
          ))}
          <div className="side-divider" />
          <IconButton
            label="Forma assistant"
            onClick={() => {
              navigate("Dashboard");
              setTimeout(
                () => document.getElementById("assistant-input")?.focus(),
                50,
              );
            }}
          >
            <Sparkles size={19} strokeWidth={1.6} />
          </IconButton>
        </nav>
        <div className="side-bottom">
          <IconButton label="Help & shortcuts" onClick={() => setModal("help")}>
            <CircleHelp size={18} />
          </IconButton>
          <IconButton
            label="Workspace settings"
            onClick={() => setModal("settings")}
          >
            <Settings2 size={18} />
          </IconButton>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <IconButton
              label="Toggle navigation"
              className="mobile-menu"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={18} />
            </IconButton>
            <Brand />
            <span className="topbar-divider" />
            <nav className="top-nav" aria-label="Main navigation">
              {(
                [
                  { label: "Dashboard", icon: LayoutDashboard },
                  { label: "Employees", icon: Users },
                  { label: "Reports", icon: Flag },
                ] as const
              ).map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className={`nav-pill ${view === label ? "selected" : ""}`}
                  onClick={() => navigate(label)}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <button
              className="search-trigger"
              onClick={() => setModal("search")}
              aria-label="Search workspace"
            >
              <Search size={16} />
              <kbd>⌘ K</kbd>
            </button>
          </div>
          <div className="topbar-right">
            <div className="team-stack">
              {employees.slice(0, 3).map((e) => (
                <Avatar key={e.id} name={e.name} index={e.avatar} size={30} />
              ))}
              <span className="stack-more">
                +{Math.max(0, totalEmployees - 3)}
              </span>
            </div>
            <button
              className="soft-button add-employee"
              onClick={() => setModal("add")}
            >
              <Plus size={16} />
              <span>Add employee</span>
            </button>
            <span className="topbar-divider" />
            <Avatar
              name={session?.employee.name ?? "Emily Bennett"}
              index={1}
              size={34}
            />
            <IconButton
              label="Notifications"
              className="notification-button"
              onClick={() => setModal("notifications")}
            >
              <Bell size={17} />
              {leaves.some((l) => l.status === "Pending") && <i />}
            </IconButton>
          </div>
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="greeting-eyebrow">
                <span className="live-dot" />A LITTLE SPACE FOR YOUR PEOPLE
                {isDemo && <span className="demo-tag">DEMO WORKSPACE</span>}
              </div>
              <h1>
                {view === "Dashboard" ? (
                  <>
                    Good morning, {admin} <Sun size={27} className="sun-icon" />
                  </>
                ) : view === "Employees" ? (
                  "Good people. Great things."
                ) : view === "Reports" ? (
                  "The bigger picture."
                ) : view === "Calendar" ? (
                  "A little time for life."
                ) : (
                  "Every workday counts."
                )}
              </h1>
              <p>
                {view === "Dashboard"
                  ? "Here’s what’s happening with your team today."
                  : view === "Employees"
                    ? "Meet the people who make it all happen."
                    : view === "Calendar"
                      ? "A shared view of your team’s time away."
                      : view === "Reports"
                        ? "A thoughtful look at how your team is doing."
                        : "Be present for the moments that matter."}
              </p>
            </div>
            <div className="heading-right">
              <span className="today-pill">
                <CalendarDays size={15} />
                {isDemo
                  ? "Monday, December 15, 2025"
                  : new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
              </span>
              <span className="workspace-status">
                <span className="live-dot" />
                All your people. One happy place.
              </span>
            </div>
          </div>
          {error && (
            <div className="form-error" role="alert">
              {error}
              <button
                className="text-button"
                onClick={() =>
                  void useWorkspace
                    .getState()
                    .refresh()
                    .catch(() => {})
                }
              >
                Try again
              </button>
            </div>
          )}
          {(view === "Dashboard" || view === "Calendar") && (
            <>
              <Timeline
                expanded={view === "Calendar"}
                onViewAll={() => navigate("Calendar")}
                notify={setToast}
              />
              {view === "Dashboard" && (
                <div className="dashboard-bottom">
                  <Events notify={setToast} />
                  <Onboarding notify={setToast} />
                  <Assistant
                    adminName={admin}
                    onAdd={() => setModal("add")}
                    onReports={() => navigate("Reports")}
                    onPeople={() => navigate("Employees")}
                  />
                </div>
              )}
            </>
          )}
          {view === "Employees" && (
            <People
              onAdd={() => setModal("add")}
              initialQuery={query}
              notify={setToast}
            />
          )}
          {view === "Reports" && <Reports />}
          {view === "Attendance" && <AttendanceView />}
          <footer className="workspace-footer">
            <span>
              <Leaf size={12} />A little more connected, every day.
            </span>
            <span>
              Made for your people · Forma © {new Date().getFullYear()}
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={16} />
          </span>
          {toast}
          <IconButton label="Dismiss notification" onClick={() => setToast("")}>
            <X size={14} />
          </IconButton>
        </div>
      )}
      {modal === "add" && <AddEmployee close={close} notify={setToast} />}
      {modal === "search" && (
        <Modal
          title="Find your people"
          subtitle="Search by name, role, or department."
          onClose={close}
        >
          <div className="search-field">
            <Search size={18} />
            <input
              autoFocus
              placeholder="Who are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>ESC</kbd>
          </div>
          <div className="search-results">
            {employees
              .filter((e) =>
                `${e.name} ${e.title} ${e.department}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .slice(0, 6)
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setQuery(e.name);
                    navigate("Employees");
                    close();
                  }}
                >
                  <Avatar name={e.name} index={e.avatar} />
                  <span>
                    <strong>{e.name}</strong>
                    <small>{e.title}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            {!employees.some((e) =>
              `${e.name} ${e.title} ${e.department}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && <p className="empty-state">No matches. Try another name.</p>}
          </div>
          {!isDemo && (
            <button
              className="soft-button"
              onClick={() => {
                navigate("Employees");
                close();
              }}
            >
              Search all employees
            </button>
          )}
        </Modal>
      )}
      {modal === "notifications" && (
        <Modal
          title="Your little updates"
          subtitle="Everything that needs a moment of attention."
          onClose={close}
        >
          {leaves
            .filter((l) => l.status === "Pending")
            .map((l) => (
              <div className="notification-item" key={l.id}>
                <span className="notification-icon">
                  <CalendarDays size={20} />
                </span>
                <div>
                  <strong>
                    {employees.find((e) => e.id === l.employeeId)?.name ??
                      "An employee"}{" "}
                    requested {l.type.toLowerCase()}
                  </strong>
                  <p>
                    {formatDate(l.startDate)} — {formatDate(l.endDate)}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      navigate("Calendar");
                      close();
                    }}
                  >
                    Review request
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          {!leaves.some((l) => l.status === "Pending") && (
            <p className="empty-state">All caught up. Take a breath.</p>
          )}
        </Modal>
      )}
      {modal === "settings" && (
        <Modal
          title="Make yourself at home"
          subtitle="A few little things to make Forma yours."
          onClose={close}
        >
          <div className="setting-row">
            <div>
              <strong>Compact workspace</strong>
              <p>A little less space between things.</p>
            </div>
            <button
              className={`toggle ${compact ? "on" : ""}`}
              role="switch"
              aria-checked={compact}
              aria-label="Compact workspace"
              onClick={() => setCompact(!compact)}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Workspace mode</strong>
              <p>
                {isDemo
                  ? "Demo · changes saved in this browser"
                  : "Live · connected to the secure API"}
              </p>
            </div>
            <span className="status-badge active">
              {isDemo ? "Demo" : "Connected"}
            </span>
          </div>
          {!isDemo && (
            <button className="soft-button" onClick={() => void logout()}>
              <LogOut size={15} />
              Sign out
            </button>
          )}
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="A helping hand"
          subtitle="A few ways to find your flow."
          onClose={close}
        >
          {[
            [
              "Find anything, faster",
              "Press ⌘ K or Ctrl K to search your people.",
            ],
            [
              "Make time for time off",
              "Click an absence to review and approve a pending request.",
            ],
            [
              "A little help from Forma",
              "The workspace helper summarizes team, leave, and onboarding data.",
            ],
          ].map(([t, p]) => (
            <div className="help-item" key={t}>
              <Sparkles size={17} />
              <div>
                <strong>{t}</strong>
                <p>{p}</p>
              </div>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
function AddEmployee({
  close,
  notify,
}: {
  close: () => void;
  notify: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const d = new FormData(e.currentTarget);
    try {
      await useWorkspace
        .getState()
        .addEmployee({
          name: String(d.get("name")).trim(),
          email: String(d.get("email")).trim(),
          title: String(d.get("title")).trim(),
          department: String(d.get("department")),
          password: String(d.get("password") ?? ""),
        });
      close();
      notify("A new beginning! Your employee has been added.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Great teams start with people."
      subtitle="Give someone new a warm welcome."
      onClose={close}
    >
      <form className="form-stack" onSubmit={submit}>
        <label>
          Full name
          <input
            name="name"
            placeholder="e.g. Alex Morgan"
            required
            maxLength={100}
          />
        </label>
        <label>
          Work email
          <input
            name="email"
            type="email"
            placeholder="alex@company.com"
            required
          />
        </label>
        <div className="form-columns">
          <label>
            Job title
            <input
              name="title"
              placeholder="Product Designer"
              required
              maxLength={100}
            />
          </label>
          <label>
            Department
            <select name="department">
              {[
                "Engineering",
                "Design",
                "Product",
                "Marketing",
                "People",
                "Finance",
              ].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        {!isDemo && (
          <label>
            Initial password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              placeholder="At least 12 characters"
            />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-footer">
          <button type="button" className="soft-button" onClick={close}>
            Maybe later
          </button>
          <button className="primary-button" disabled={busy}>
            <Plus size={16} />
            {busy ? "Adding…" : "Add employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
