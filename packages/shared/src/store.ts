import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as demo from "./data";
import type {
  Employee,
  Leave,
  TeamEvent,
  Candidate,
  Session,
  Page,
  Attendance,
} from "./types";
export const API_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, "");
export const isDemo = !API_URL;
let token = "";
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL ?? ""}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (response.status === 401) {
      token = "";
      useWorkspace.setState({ session: null });
    }
    const error = await response
      .json()
      .catch(() => ({ message: "Unable to complete the request." }));
    throw new Error(error.message ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
interface Store {
  employees: Employee[];
  leaves: Leave[];
  events: TeamEvent[];
  candidates: Candidate[];
  session: Session | null;
  clockInAt: string | null;
  loading: boolean;
  error: string;
  totalEmployees: number;
  page: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: (page?: number, search?: string) => Promise<void>;
  loadTimeline: (from: string, until: string) => Promise<void>;
  addEmployee: (
    input: Omit<Employee, "id" | "avatar" | "status"> & { password?: string },
  ) => Promise<void>;
  requestLeave: (input: Omit<Leave, "id" | "status">) => Promise<void>;
  reviewLeave: (id: string, status: "Approved" | "Rejected") => Promise<void>;
  toggleTask: (person: string, id: string) => Promise<void>;
  clock: () => Promise<void>;
}
export const useWorkspace = create<Store>()(
  persist(
    (set, get) => ({
      employees: isDemo ? demo.employees : [],
      leaves: isDemo ? demo.leaves : [],
      events: isDemo ? demo.events : [],
      candidates: isDemo ? demo.candidates : [],
      session: null,
      clockInAt: null,
      loading: false,
      error: "",
      totalEmployees: isDemo ? 12 : 0,
      page: 0,
      login: async (email, password) => {
        const session = await api<Session>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        token = session.token;
        set({ session });
        await get().refresh();
      },
      logout: async () => {
        try {
          if (!isDemo) await api("/auth/logout", { method: "POST" });
        } finally {
          token = "";
          set({ session: null, clockInAt: null });
        }
      },
      refresh: async (page = 0, search = "") => {
        if (isDemo) return;
        set({ loading: true, error: "" });
        try {
          if (get().session?.role === "ADMIN") {
            const [e, l, v, c] = await Promise.all([
              api<Page<Employee>>(
                `/admin/employees?page=${page}&search=${encodeURIComponent(search)}`,
              ),
              api<Page<Leave>>("/admin/leaves?size=100"),
              api<Page<TeamEvent>>("/admin/events"),
              api<Page<Candidate>>("/admin/onboarding"),
            ]);
            set({
              employees: e.content,
              totalEmployees: e.totalElements,
              page: e.number,
              leaves: l.content,
              events: v.content,
              candidates: c.content,
            });
          } else {
            const [l, c, a] = await Promise.all([
              api<Page<Leave>>("/employee/leaves"),
              api<Candidate>("/employee/tasks"),
              api<Attendance | undefined>("/employee/attendance/current"),
            ]);
            set({
              employees: [get().session!.employee],
              leaves: l.content,
              candidates: [c],
              clockInAt: a?.clockIn ?? null,
            });
          }
        } catch (e) {
          set({ error: (e as Error).message });
          throw e;
        } finally {
          set({ loading: false });
        }
      },
      loadTimeline: async (from, until) => {
        if (isDemo) return;
        const l = await api<Page<Leave>>(
          `/admin/attendance/timeline?from=${from}&until=${until}&size=100`,
        );
        set({ leaves: l.content });
      },
      addEmployee: async (input) => {
        if (
          isDemo &&
          get().employees.some(
            (e) => e.email.toLowerCase() === input.email.toLowerCase(),
          )
        )
          throw new Error("An employee with this email already exists.");
        const { password: _, ...safe } = input;
        const e = isDemo
          ? {
              ...safe,
              id: crypto.randomUUID(),
              avatar: 1,
              status: "Onboarding",
            }
          : await api<Employee>("/admin/employees", {
              method: "POST",
              body: JSON.stringify(input),
            });
        if (isDemo)
          set((s) => ({
            employees: [...s.employees, e],
            totalEmployees: s.totalEmployees + 1,
            candidates: [
              ...s.candidates,
              {
                ...e,
                completed: 0,
                total: 10,
                tasks: demo.taskLabels.map((label, i) => ({
                  id: `${e.id}-${i}`,
                  label,
                  done: false,
                })),
              },
            ],
          }));
        else await get().refresh();
      },
      requestLeave: async (input) => {
        if (input.endDate < input.startDate)
          throw new Error("End date must follow the start date.");
        if (
          isDemo &&
          get().leaves.some(
            (l) =>
              l.employeeId === input.employeeId &&
              l.status !== "Rejected" &&
              l.startDate <= input.endDate &&
              l.endDate >= input.startDate,
          )
        )
          throw new Error("You already have a request for these dates.");
        const l = isDemo
          ? { ...input, id: crypto.randomUUID(), status: "Pending" as const }
          : await api<Leave>("/employee/leaves", {
              method: "POST",
              body: JSON.stringify(input),
            });
        set((s) => ({ leaves: [...s.leaves, l] }));
      },
      reviewLeave: async (id, status) => {
        if (!isDemo)
          await api(`/admin/leaves/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
        set((s) => ({
          leaves: s.leaves.map((l) => (l.id === id ? { ...l, status } : l)),
        }));
      },
      toggleTask: async (person, id) => {
        const c = get().candidates.find((c) => c.id === person),
          t = c?.tasks.find((t) => t.id === id);
        if (!c || !t) return;
        if (!isDemo)
          await api(
            `/${get().session?.role === "ADMIN" ? "admin" : "employee"}/tasks/${id}`,
            { method: "PATCH", body: JSON.stringify({ done: !t.done }) },
          );
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id !== person
              ? c
              : {
                  ...c,
                  completed: c.completed + (t.done ? -1 : 1),
                  tasks: c.tasks.map((t) =>
                    t.id === id ? { ...t, done: !t.done } : t,
                  ),
                },
          ),
        }));
      },
      clock: async () => {
        const active = !!get().clockInAt;
        if (isDemo)
          set({ clockInAt: active ? null : new Date().toISOString() });
        else {
          const a = await api<Attendance>(
            `/employee/attendance/clock-${active ? "out" : "in"}`,
            { method: "POST" },
          );
          set({ clockInAt: active ? null : a.clockIn });
        }
      },
    }),
    {
      name: "forma-workspace-v2",
      version: 2,
      partialize: (s) =>
        isDemo
          ? {
              employees: s.employees,
              leaves: s.leaves,
              candidates: s.candidates,
              totalEmployees: s.totalEmployees,
              clockInAt: s.clockInAt,
            }
          : {},
    },
  ),
);
export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-US", options);
}
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
