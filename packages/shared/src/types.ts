export interface Employee {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatar: number;
  status: string;
}
export type LeaveType = "Vacation" | "Paid leave" | "Sick leave";
export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  reason?: string;
}
export interface TeamEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  attendees: number;
  tag?: string;
}
export interface Task {
  id: string;
  label: string;
  done: boolean;
}
export interface Candidate {
  id: string;
  name: string;
  title: string;
  avatar: number;
  completed: number;
  total: number;
  tasks: Task[];
}
export interface Attendance {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut: string | null;
}
export interface Session {
  token: string;
  employee: Employee;
  role: "ADMIN" | "EMPLOYEE";
}
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export interface Desktop {
  platform: string;
  setMonitoring: (
    enabled: boolean,
    token?: string,
  ) => Promise<{ enabled: boolean; available: boolean; reason?: string }>;
  flushTelemetry: () => Promise<void>;
  biometricAvailable: () => Promise<boolean>;
  biometricUnlock: () => Promise<boolean>;
}
declare global {
  interface Window {
    desktop?: Desktop;
  }
}
