import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ArrowUpRight,
  Users,
  CalendarDays,
  Clock3,
  Sparkles,
  Download,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";
import {
  Avatar,
  IconButton,
  Modal,
  useWorkspace,
  isDemo,
  api,
  type Employee,
  type Page,
  type Attendance,
} from "@ems/shared";
export function People({
  initialQuery,
  onAdd,
  notify,
}: {
  initialQuery: string;
  onAdd: () => void;
  notify: (s: string) => void;
}) {
  const { employees, totalEmployees, refresh, loading } = useWorkspace();
  const [query, setQuery] = useState(initialQuery),
    [department, setDepartment] = useState("All departments"),
    [selected, setSelected] = useState<Employee | null>(null),
    [page, setPage] = useState(0);
  useEffect(() => {
    if (isDemo) return;
    const id = setTimeout(
      () => void refresh(page, query).catch((e) => notify(e.message)),
      300,
    );
    return () => clearTimeout(id);
  }, [page, query, refresh, notify]);
  const filtered = employees.filter(
    (e) =>
      (!isDemo ||
        `${e.name} ${e.email} ${e.title}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (department === "All departments" || e.department === department),
  );
  const visible = isDemo ? filtered.slice(page * 8, page * 8 + 8) : filtered;
  return (
    <section className="surface people-panel">
      <div className="section-heading">
        <div>
          <h2>
            Your people <span className="count-badge">{totalEmployees}</span>
          </h2>
          <p>A team worth getting to know.</p>
        </div>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={15} />
          Add employee
        </button>
      </div>
      <div className="table-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search employees"
            placeholder="Search your people…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          aria-label="Filter department"
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(0);
          }}
        >
          <option>All departments</option>
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
      </div>
      <div className="table-scroll">
        <table className="people-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Status</th>
              <th>Work email</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="person-cell">
                    <Avatar name={e.name} index={e.avatar} />
                    <div>
                      <strong>{e.name}</strong>
                      <small>{e.title}</small>
                    </div>
                  </div>
                </td>
                <td>{e.department}</td>
                <td>
                  <span
                    className={`status-badge ${e.status === "Active" ? "active" : e.status === "Onboarding" ? "onboarding" : "leave"}`}
                  >
                    {e.status}
                  </span>
                </td>
                <td>{e.email}</td>
                <td>
                  <IconButton
                    label={`View ${e.name}`}
                    onClick={() => setSelected(e)}
                  >
                    <ArrowUpRight size={16} />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <p className="empty-state">
            {loading
              ? "Finding your people…"
              : "No matches. Try a different name or department."}
          </p>
        )}
      </div>
      <div className="pagination">
        <span>
          {isDemo ? filtered.length : totalEmployees} people · Page {page + 1}
        </span>
        <div>
          <button
            className="soft-button"
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <button
            className="soft-button"
            disabled={
              (page + 1) * (isDemo ? 8 : 20) >=
              (isDemo ? filtered.length : totalEmployees)
            }
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
      {selected && (
        <Modal
          title={selected.name}
          subtitle={selected.title}
          onClose={() => setSelected(null)}
        >
          <div className="profile-details">
            <Avatar name={selected.name} index={selected.avatar} size={90} />
            <span className="status-badge active">{selected.status}</span>
            <dl>
              <dt>Department</dt>
              <dd>{selected.department}</dd>
              <dt>Work email</dt>
              <dd>
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              </dd>
              <dt>Employee ID</dt>
              <dd>{selected.id}</dd>
            </dl>
          </div>
        </Modal>
      )}
    </section>
  );
}
export function Reports() {
  const { employees, leaves, candidates, totalEmployees } = useWorkspace();
  const departments = Array.from(new Set(employees.map((e) => e.department))),
    done = candidates.reduce((n, c) => n + c.completed, 0),
    total = candidates.reduce((n, c) => n + c.total, 0);
  function download() {
    const csv = [
      "Name,Department,Status",
      ...employees.map((e) =>
        [e.name, e.department, e.status]
          .map(
            (v) =>
              '"' + v.replaceAll('"', '""').replace(/^[=+@-]/, "'$&") + '"',
          )
          .join(","),
      ),
    ].join("\r\n");
    const u = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = u;
    a.download = "forma-team-report.csv";
    a.click();
    URL.revokeObjectURL(u);
  }
  return (
    <div className="reports-view">
      <div className="report-stats">
        {[
          { label: "Team members", value: totalEmployees, icon: Users },
          {
            label: "Approved absences",
            value: leaves.filter((l) => l.status === "Approved").length,
            icon: CalendarDays,
          },
          {
            label: "Pending requests",
            value: leaves.filter((l) => l.status === "Pending").length,
            icon: Clock3,
          },
          {
            label: "Onboarding complete",
            value: `${total ? Math.round((done / total) * 100) : 0}%`,
            icon: Sparkles,
          },
        ].map((s) => (
          <div className="surface stat-card" key={s.label}>
            <span>
              <s.icon size={19} />
              {s.label}
            </span>
            <strong>{s.value}</strong>
            <small>
              {isDemo
                ? "Across your demo workspace"
                : "Across the loaded records"}
            </small>
          </div>
        ))}
      </div>
      <div className="report-grid">
        <section className="surface">
          <div className="section-heading">
            <h2>A team of many talents</h2>
            <span className="muted">By department</span>
          </div>
          <div className="department-chart">
            {departments.map((d, i) => {
              const n = employees.filter((e) => e.department === d).length;
              return (
                <div className="department-bar" key={d}>
                  <span>{d}</span>
                  <div>
                    <i
                      style={{
                        width: `${(n / Math.max(1, employees.length)) * 100}%`,
                        background: [
                          "#afc7b3",
                          "#c9b8e5",
                          "#e5c583",
                          "#afc8d5",
                          "#d7b9a6",
                          "#c6c99e",
                        ][i % 6],
                      }}
                    />
                  </div>
                  <strong>{n}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="surface report-download">
          <span className="report-art">
            <ChartNoAxesColumnIncreasing size={48} strokeWidth={1} />
          </span>
          <h2>Good insights. Better decisions.</h2>
          <p>Take your current team directory with you.</p>
          <button className="primary-button" onClick={download}>
            <Download size={16} />
            Export team report
          </button>
        </section>
      </div>
    </div>
  );
}
export function AttendanceView() {
  const { employees } = useWorkspace();
  const [records, setRecords] = useState<Attendance[]>([]),
    [page, setPage] = useState(0),
    [pages, setPages] = useState(1),
    [error, setError] = useState("");
  useEffect(() => {
    if (isDemo) {
      setRecords(
        employees
          .filter((e) => e.status === "Active")
          .map((e, i) => ({
            id: e.id,
            employeeId: e.id,
            clockIn: `2025-12-15T08:${String(10 + i * 3).padStart(2, "0")}:00`,
            clockOut: null,
          })),
      );
      return;
    }
    void api<Page<Attendance>>(`/admin/attendance?page=${page}`)
      .then((r) => {
        setRecords(r.content);
        setPages(r.totalPages);
      })
      .catch((e) => setError(e.message));
  }, [employees, page]);
  return (
    <section className="surface attendance-panel">
      <div className="section-heading">
        <h2>Today’s attendance</h2>
        <span className="status-badge active">
          {isDemo ? "Sample workday" : "Live records"}
        </span>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="table-scroll">
        <table className="people-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Clocked in</th>
              <th>Clocked out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const e = employees.find((e) => e.id === r.employeeId);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="person-cell">
                      <Avatar name={e?.name ?? "Employee"} index={e?.avatar} />
                      <strong>{e?.name ?? r.employeeId}</strong>
                    </div>
                  </td>
                  <td>
                    {new Date(r.clockIn).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    {r.clockOut
                      ? new Date(r.clockOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${r.clockOut ? "onboarding" : "active"}`}
                    >
                      {r.clockOut ? "Finished" : "Working"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!records.length && !error && (
          <p className="empty-state">No clock-ins yet. A fresh start awaits.</p>
        )}
      </div>
      {!isDemo && (
        <div className="pagination">
          <span>Page {page + 1}</span>
          <div>
            <button
              className="soft-button"
              disabled={!page}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="soft-button"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
