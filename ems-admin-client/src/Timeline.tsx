import { useMemo, useState, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Palmtree,
  HeartPulse,
  FileClock,
  Check,
  X,
} from "lucide-react";
import {
  Avatar,
  IconButton,
  Modal,
  ViewAll,
  useWorkspace,
  isDemo,
  isoDate,
  formatDate,
  type Leave,
} from "@ems/shared";
const kinds = (t: string) =>
  t === "Vacation"
    ? "vacation"
    : t === "Paid leave"
      ? "paid-leave"
      : "sick-leave";
const diff = (a: string, b: string) =>
  Math.round(
    (new Date(a + "T12:00:00").getTime() -
      new Date(b + "T12:00:00").getTime()) /
      86400000,
  );
export function Timeline({
  expanded,
  onViewAll,
  notify,
}: {
  expanded: boolean;
  onViewAll: () => void;
  notify: (s: string) => void;
}) {
  const { employees, leaves, reviewLeave, loadTimeline } = useWorkspace();
  const [offset, setOffset] = useState(0),
    [filter, setFilter] = useState("All absences"),
    [showFilter, setShowFilter] = useState(false),
    [selected, setSelected] = useState<Leave | null>(null),
    [busy, setBusy] = useState(false);
  const dates = useMemo(() => {
    const a = isDemo ? new Date(2025, 11, 8) : new Date();
    if (!isDemo) a.setDate(a.getDate() - ((a.getDay() + 6) % 7));
    a.setDate(a.getDate() + offset * 7);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(a);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [offset]);
  useEffect(() => {
    if (!isDemo)
      void loadTimeline(isoDate(dates[0]), isoDate(dates[13])).catch((e) =>
        notify(e.message),
      );
  }, [dates, loadTimeline, notify]);
  const rows = expanded ? employees : employees.slice(0, 6);
  const today = isDemo ? "2025-12-15" : isoDate(new Date()),
    todayIndex = dates.findIndex((d) => isoDate(d) === today);
  const visible = leaves.filter(
    (l) =>
      l.status !== "Rejected" &&
      (filter === "All absences" || l.type === filter || l.status === filter),
  );
  async function review(status: "Approved" | "Rejected") {
    if (!selected) return;
    setBusy(true);
    try {
      await reviewLeave(selected.id, status);
      setSelected(null);
      notify(`Leave request ${status.toLowerCase()}. Everyone’s in the loop.`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={`surface timeline-panel ${expanded ? "timeline-expanded" : ""}`}
    >
      <div className="section-heading timeline-heading">
        <div className="section-title">
          <CalendarDays size={17} />
          <h2>Planned absences</h2>
          <span className="count-badge">
            {leaves.filter((l) => l.status !== "Rejected").length}
          </span>
        </div>
        <div className="section-actions">
          <div className="calendar-switch">
            <IconButton
              label="Previous week"
              onClick={() => setOffset(offset - 1)}
            >
              <ChevronLeft size={13} />
            </IconButton>
            <button
              className="month-button"
              title="Return to current week"
              onClick={() => setOffset(0)}
            >
              <CalendarDays size={12} />
              {dates[0].toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
              <ChevronDown size={11} />
            </button>
            <IconButton label="Next week" onClick={() => setOffset(offset + 1)}>
              <ChevronRight size={13} />
            </IconButton>
          </div>
          <div className="filter-wrap">
            <button
              className="soft-button small"
              onClick={() => setShowFilter(!showFilter)}
              aria-expanded={showFilter}
            >
              <SlidersHorizontal size={13} />
              Filter
            </button>
            {showFilter && (
              <div className="filter-popover">
                {[
                  "All absences",
                  "Vacation",
                  "Paid leave",
                  "Sick leave",
                  "Pending",
                  "Approved",
                ].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setShowFilter(false);
                    }}
                  >
                    <span className={`filter-dot ${kinds(f)}`} />
                    {f}
                    {f === filter && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!expanded && <ViewAll onClick={onViewAll} />}
        </div>
      </div>
      <div className="timeline-scroll">
        <div className="timeline-grid">
          <div className="calendar-employee-heading">
            Team members <span>{rows.length}</span>
          </div>
          <div className="calendar-days">
            {dates.map((d) => (
              <div
                key={isoDate(d)}
                className={`date-cell ${[0, 6].includes(d.getDay()) ? "weekend" : ""} ${isoDate(d) === today ? "today" : ""}`}
              >
                <span>
                  {
                    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                      d.getDay()
                    ]
                  }
                </span>
                <strong>{d.getDate()}</strong>
              </div>
            ))}
          </div>
          <div className="calendar-people">
            {rows.map((e) => (
              <div className="calendar-person" key={e.id}>
                <Avatar name={e.name} index={e.avatar} size={33} />
                <span>
                  <strong>{e.name}</strong>
                  <small>{e.title}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="calendar-tracks">
            {todayIndex >= 0 && (
              <div
                className="today-line"
                style={{ left: `${((todayIndex + 0.5) / 14) * 100}%` }}
              />
            )}
            {rows.map((e) => (
              <div className="calendar-track" key={e.id}>
                <div className="track-cells">
                  {dates.map((d) => (
                    <div
                      key={isoDate(d)}
                      className={[0, 6].includes(d.getDay()) ? "weekend" : ""}
                    />
                  ))}
                </div>
                {visible
                  .filter((l) => l.employeeId === e.id)
                  .map((l) => {
                    const start = diff(l.startDate, isoDate(dates[0])),
                      end = diff(l.endDate, isoDate(dates[0]));
                    if (end < 0 || start > 13) return null;
                    const s = Math.max(0, start),
                      span = Math.min(13, end) - s + 1,
                      Icon =
                        l.type === "Vacation"
                          ? Palmtree
                          : l.type === "Paid leave"
                            ? FileClock
                            : HeartPulse;
                    return (
                      <button
                        key={l.id}
                        className={`leave-bar ${kinds(l.type)} ${l.status === "Pending" ? "pending" : ""}`}
                        style={{
                          left: `calc(${(s / 14) * 100}% + 2px)`,
                          width: `calc(${(span / 14) * 100}% - 5px)`,
                        }}
                        onClick={() => setSelected(l)}
                        aria-label={`${e.name}: ${l.type}, ${l.status}, ${formatDate(l.startDate)} to ${formatDate(l.endDate)}`}
                      >
                        <span className="leave-symbol">
                          <Icon size={16} strokeWidth={1.4} />
                        </span>
                        <span className="leave-label">{l.type}</span>
                        {span >= 3 && (
                          <span className="leave-status">
                            <i />
                            {l.status}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="timeline-footer">
        <div className="legend">
          {["Vacation", "Paid leave", "Sick leave"].map((t) => (
            <span key={t}>
              <i className={kinds(t)} />
              {t}
            </span>
          ))}
        </div>
        <span className="timeline-note">
          <span className="live-dot" />
          Time off, peace of mind.
        </span>
      </div>
      {selected && (
        <Modal
          title={`${selected.type} request`}
          subtitle={employees.find((e) => e.id === selected.employeeId)?.name}
          onClose={() => setSelected(null)}
        >
          <div className={`leave-summary ${kinds(selected.type)}`}>
            <CalendarDays size={28} />
            <div>
              <strong>
                {formatDate(selected.startDate)} —{" "}
                {formatDate(selected.endDate)}
              </strong>
              <span>
                {diff(selected.endDate, selected.startDate) + 1} calendar days ·{" "}
                {selected.status}
              </span>
            </div>
          </div>
          {selected.reason && <p className="muted">{selected.reason}</p>}
          {selected.status === "Pending" ? (
            <div className="form-footer">
              <button
                className="soft-button"
                disabled={busy}
                onClick={() => void review("Rejected")}
              >
                <X size={15} />
                Decline
              </button>
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => void review("Approved")}
              >
                <Check size={16} />
                Approve time off
              </button>
            </div>
          ) : (
            <p className="muted">
              This request has been {selected.status.toLowerCase()}.
            </p>
          )}
        </Modal>
      )}
    </section>
  );
}
