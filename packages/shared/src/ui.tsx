import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { X, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { useWorkspace } from "./store";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-icon">
        <i />
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span>
          forma<span className="brand-period">.</span>
        </span>
      )}
    </div>
  );
}
export function Avatar({
  name,
  index = 1,
  size = 36,
}: {
  name: string;
  index?: number;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`avatar avatar-${index}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {!failed ? (
        <img
          src={`./avatars/person-${index}.jpg`}
          alt={name}
          onError={() => setFailed(true)}
        />
      ) : (
        name
          .split(" ")
          .map((s) => s[0])
          .join("")
          .slice(0, 2)
      )}
    </span>
  );
}
export function IconButton({
  label,
  children,
  onClick,
  className = "",
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function ViewAll({ onClick }: { onClick: () => void }) {
  return (
    <button className="text-button" onClick={onClick}>
      View all
      <ArrowUpRight size={13} />
    </button>
  );
}
export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const list = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]',
        );
        if (!list?.length) return;
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
export function Login({ audience }: { audience: "admin" | "employee" }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const d = new FormData(e.currentTarget);
    try {
      await useWorkspace
        .getState()
        .login(String(d.get("email")), String(d.get("password")));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <div className="login-art">
        <Brand />
        <div className="glass-orb" />
        <h1>
          Your people.
          <br />
          Your potential.
        </h1>
        <p>A little more clarity. A lot more connection.</p>
      </div>
      <form className="login-form" onSubmit={submit}>
        <span className="eyebrow">YOUR WORKDAY, SIMPLIFIED</span>
        <h1>Welcome back.</h1>
        <p>
          Sign in to your{" "}
          {audience === "admin" ? "team workspace" : "employee account"}.
        </p>
        <label>
          Work email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@company.com"
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              name="password"
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            <IconButton
              label={show ? "Hide password" : "Show password"}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </IconButton>
          </div>
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy}>
          {busy ? "Signing in…" : "Sign in to Forma"}
          <ArrowUpRight size={16} />
        </button>
        <small>Your work, in a space that feels good.</small>
      </form>
    </main>
  );
}
