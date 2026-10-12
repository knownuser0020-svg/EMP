import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowUp,
  CalendarDays,
  Clock3,
  ClipboardList,
  Sparkles,
  UserPlus,
  Flag,
  Users,
  Paperclip,
  X,
  Check,
  Leaf,
  CalendarPlus,
  MapPin,
} from "lucide-react";
import {
  Avatar,
  IconButton,
  Modal,
  ViewAll,
  useWorkspace,
  formatDate,
  type TeamEvent,
  type Candidate,
} from "@ems/shared";
export function Events({ notify }: { notify: (s: string) => void }) {
  const { events } = useWorkspace();
  const [selected, setSelected] = useState<TeamEvent | null>(null),
    [all, setAll] = useState(false),
    [saved, setSaved] = useState<string[]>(() => {
      try {
        return JSON.parse(localStorage.getItem("forma-events") ?? "[]");
      } catch {
        return [];
      }
    });
  function calendar(e: TeamEvent) {
    const start = new Date(e.date + "T12:00:00"),
      end = new Date(start);
    end.setDate(end.getDate() + 1);
    const date = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Forma//Team Events//EN\r\nBEGIN:VEVENT\r\nUID:${e.id}@forma\r\nDTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(
        /\.\d{3}/,
        "",
      )}\r\nDTSTART;VALUE=DATE:${date(start)}\r\nDTEND;VALUE=DATE:${date(end)}\r\nSUMMARY:${e.title.replace(/[\r\n]/g, " ")}\r\nDESCRIPTION:${(e.description + " · " + e.time).replace(/[\r\n]/g, " ")}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
    const u = URL.createObjectURL(
      new Blob([content], { type: "text/calendar" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "forma-event.ics";
    a.click();
    URL.revokeObjectURL(u);
    notify("Calendar invitation downloaded.");
  }
  return (
    <section className="surface events-panel">
      <div className="section-heading">
        <div className="section-title">
          <h2>Future events</h2>
          <span className="small-dot" />
        </div>
        <ViewAll onClick={() => setAll(true)} />
      </div>
      <div className="events-list">
        {events.slice(0, 3).map((e, i) => (
          <button
            className={`event-card ${i === 0 ? "event-featured" : ""}`}
            key={e.id}
            onClick={() => setSelected(e)}
          >
            <div className="event-title">
              <h3>{e.title}</h3>
              {i === 0 && (
                <span className="event-tag">
                  <i />
                  {e.tag ?? "Coming up"}
                </span>
              )}
            </div>
            <p>{e.description}</p>
            <div className="event-meta">
              <span>
                <Clock3 size={12} />
                {e.time}
              </span>
              <span>
                <CalendarDays size={12} />
                {formatDate(e.date)}
              </span>
              <div className="event-attendees">
                <Avatar name="Sophia Adams" index={1} size={24} />
                <Avatar name="Lucas Morgan" index={4} size={24} />
                <b>+{Math.max(0, e.attendees - 2)}</b>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="widget-footnote">
        A little time together goes a long way.
        <ArrowUpRight size={12} />
      </div>
      {(selected || all) && (
        <Modal
          title={selected?.title ?? "Good things on the calendar"}
          subtitle={
            selected?.description ?? "Your next opportunities to connect."
          }
          onClose={() => {
            setSelected(null);
            setAll(false);
          }}
        >
          {selected ? (
            <>
              <div className="event-details">
                <span>
                  <CalendarDays size={18} />
                  {formatDate(selected.date, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>
                  <Clock3 size={18} />
                  {selected.time}
                </span>
                <span>
                  <MapPin size={18} />
                  Team workspace · Online
                </span>
                <span>
                  <Users size={18} />
                  {selected.attendees} teammates invited
                </span>
              </div>
              <div className="form-footer">
                <button
                  className="soft-button"
                  onClick={() => calendar(selected)}
                >
                  <CalendarPlus size={15} />
                  Add to calendar
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    const next = saved.includes(selected.id)
                      ? saved.filter((id) => id !== selected.id)
                      : [...saved, selected.id];
                    setSaved(next);
                    localStorage.setItem("forma-events", JSON.stringify(next));
                    notify(
                      next.includes(selected.id)
                        ? "Added to your personal event list."
                        : "Removed from your personal event list.",
                    );
                  }}
                >
                  <Check size={16} />
                  {saved.includes(selected.id) ? "Saved" : "Save event"}
                </button>
              </div>
            </>
          ) : (
            events.map((e) => (
              <button
                key={e.id}
                className="event-list-item"
                onClick={() => {
                  setAll(false);
                  setSelected(e);
                }}
              >
                <span className="event-day">
                  <strong>{new Date(e.date + "T12:00:00").getDate()}</strong>
                  {formatDate(e.date, { month: "short" }).toUpperCase()}
                </span>
                <span>
                  <strong>{e.title}</strong>
                  <small>{e.time}</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            ))
          )}
        </Modal>
      )}
    </section>
  );
}
export function Onboarding({ notify }: { notify: (s: string) => void }) {
  const { candidates, toggleTask } = useWorkspace();
  const [id, setId] = useState<string | null>(null),
    [all, setAll] = useState(false),
    [busy, setBusy] = useState(false);
  const candidate = candidates.find((c) => c.id === id);
  const card = (c: Candidate) => (
    <button
      className="candidate-card"
      key={c.id}
      onClick={() => {
        setId(c.id);
        setAll(false);
      }}
    >
      <div className="candidate-avatar">
        <Avatar name={c.name} index={c.avatar} size={43} />
        <span className="candidate-spark">
          <Sparkles size={9} />
        </span>
      </div>
      <h3>{c.name}</h3>
      <p>{c.title}</p>
      <div className="progress-chip">
        <ClipboardList size={11} />
        <span>
          <b>{c.completed}</b>/{c.total} tasks done
        </span>
      </div>
      <div className="candidate-progress">
        <span
          style={{ width: `${c.total ? (c.completed / c.total) * 100 : 0}%` }}
        />
      </div>
    </button>
  );
  async function toggle(task: string) {
    if (!candidate) return;
    setBusy(true);
    try {
      await toggleTask(candidate.id, task);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="surface onboarding-panel">
      <div className="section-heading">
        <div className="section-title">
          <h2>New beginnings</h2>
          <span className="count-badge">{candidates.length}</span>
        </div>
        <ViewAll onClick={() => setAll(true)} />
      </div>
      <div className="candidates-grid">{candidates.slice(0, 4).map(card)}</div>
      <div className="widget-footnote">
        <span className="live-dot" />A warm welcome makes all the difference.
      </div>
      {(candidate || all) && (
        <Modal
          title={
            candidate
              ? `Welcome, ${candidate.name.split(" ")[0]}.`
              : "Everyone’s next chapter"
          }
          subtitle={
            candidate
              ? `${candidate.title} · ${candidate.completed} of ${candidate.total} steps complete`
              : "A great start to something good."
          }
          onClose={() => {
            setId(null);
            setAll(false);
          }}
        >
          {candidate ? (
            <>
              <div className="onboarding-detail-progress">
                <span
                  style={{
                    width: `${candidate.total ? (candidate.completed / candidate.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="task-list">
                {candidate.tasks.map((t) => (
                  <button
                    key={t.id}
                    disabled={busy}
                    className={`task-item ${t.done ? "done" : ""}`}
                    role="checkbox"
                    aria-checked={t.done}
                    onClick={() => void toggle(t.id)}
                  >
                    <span className="task-check">
                      {t.done && <Check size={13} />}
                    </span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="candidates-grid">{candidates.map(card)}</div>
          )}
        </Modal>
      )}
    </section>
  );
}
export function Assistant({
  adminName,
  onAdd,
  onReports,
  onPeople,
}: {
  adminName: string;
  onAdd: () => void;
  onReports: () => void;
  onPeople: () => void;
}) {
  const [input, setInput] = useState(""),
    [attachment, setAttachment] = useState(""),
    [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const file = useRef<HTMLInputElement>(null),
    bottom = useRef<HTMLDivElement>(null);
  const { employees, leaves, candidates, totalEmployees } = useWorkspace();
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const question = input.trim(),
      q = question.toLowerCase();
    let answer =
      "I can help you find your people, review time off, or check onboarding. Try “Who’s on leave?” or use the quick actions below.";
    if (/leave|away|absen|vacation/.test(q)) {
      const pending = leaves.filter((l) => l.status === "Pending");
      answer = `You have ${pending.length} pending leave requests and ${leaves.filter((l) => l.status === "Approved").length} approved absences in this view. ${pending.map((l) => `${employees.find((e) => e.id === l.employeeId)?.name ?? "An employee"} requested ${l.type.toLowerCase()} (${formatDate(l.startDate)}–${formatDate(l.endDate)}).`).join(" ")} Select an absence in the calendar to review it.`;
    } else if (/onboard|task|progress/.test(q))
      answer = `${candidates.length} people are finding their feet. ${candidates.map((c) => `${c.name.split(" ")[0]} has completed ${c.completed}/${c.total} tasks`).join(", ")}. Open a New beginnings card to help them along.`;
    else if (/team|employee|people|report/.test(q))
      answer = `Your workspace has ${totalEmployees} team members. In this view, ${employees.filter((e) => e.status === "Active").length} are active and ${employees.filter((e) => e.status === "Onboarding").length} are onboarding. Reports has a department breakdown.`;
    else if (/hello|hi|hey/.test(q))
      answer = `Hello, ${adminName}. What would you like to know about your team?`;
    if (attachment)
      answer +=
        " Attachments stay on your device; this helper does not read files.";
    setMessages((s) => [
      ...s,
      { role: "user", text: question },
      { role: "assistant", text: answer },
    ]);
    setInput("");
    setAttachment("");
  }
  return (
    <section className="surface assistant-panel">
      <div className="assistant-topline">
        <span>
          <Sparkles size={12} />
          YOUR LITTLE CO-PILOT
        </span>
        <span className="assistant-online">
          <i />
          Here for you
        </span>
      </div>
      {!messages.length ? (
        <div className="assistant-welcome">
          <div className="orb-scene">
            <span className="orb-shadow" />
            <div className="glass-orb">
              <i />
            </div>
            <span className="orb-spark spark-one">✦</span>
            <span className="orb-spark spark-two">✧</span>
          </div>
          <h2>
            A little help.
            <br />A lot more headspace.
          </h2>
          <p>
            Welcome, {adminName}.<br />
            What can we make easier today?
          </p>
        </div>
      ) : (
        <div className="chat-messages" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              {m.role === "assistant" && <Sparkles size={13} />}
              <p>{m.text}</p>
            </div>
          ))}
          <div ref={bottom} />
        </div>
      )}
      <div className="assistant-actions">
        <button onClick={onAdd}>
          <UserPlus size={12} />
          Create profile
        </button>
        <button onClick={onReports}>
          <Flag size={12} />
          Get reports
        </button>
        <button onClick={onPeople}>
          <Users size={12} />
          Your people
        </button>
      </div>
      <form className="chat-compose" onSubmit={submit}>
        <label className="sr-only" htmlFor="assistant-input">
          Ask Forma assistant
        </label>
        <textarea
          id="assistant-input"
          placeholder="A question, an idea, anything…"
          value={input}
          maxLength={300}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
        />
        {attachment && (
          <div className="attachment-label">
            {attachment}
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={() => setAttachment("")}
            >
              <X size={11} />
            </button>
          </div>
        )}
        <div className="compose-bottom">
          <input
            className="sr-only"
            type="file"
            ref={file}
            onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? "")}
          />
          <button
            type="button"
            className="attach-button"
            onClick={() => file.current?.click()}
          >
            <Paperclip size={12} />
            Attach a file
          </button>
          <span>{input.length}/300</span>
          <button
            className="send-button"
            aria-label="Send message"
            disabled={!input.trim()}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
      <div className="assistant-disclaimer">
        <Leaf size={10} />
        Workspace helper · Answers from your team data
      </div>
    </section>
  );
}
