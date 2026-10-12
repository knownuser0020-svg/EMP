import type { Employee, Leave, TeamEvent, Candidate } from "./types";
const people = [
  ["Ethan Parker", "Software Engineer", "Engineering", 2, "Active"],
  ["Liam Carter", "UI/UX Designer", "Design", 3, "On leave"],
  ["Noah Mitchell", "Backend Developer", "Engineering", 4, "Active"],
  ["Ava Thompson", "Product Manager", "Product", 1, "On leave"],
  ["Mia Robinson", "QA Engineer", "Engineering", 1, "Active"],
  ["Oliver Wilson", "Marketing Lead", "Marketing", 3, "Active"],
  ["Sophia Adams", "UI/UX Designer", "Design", 1, "Onboarding"],
  ["Lucas Morgan", "Mobile Developer", "Engineering", 4, "Onboarding"],
  ["Mason Reed", "Cloud Architect", "Engineering", 2, "Onboarding"],
  ["Justin Crown", "Content Designer", "Marketing", 3, "Onboarding"],
  ["Emily Bennett", "People & Culture Lead", "People", 1, "Active"],
  ["Isabella Lee", "Finance Manager", "Finance", 1, "Active"],
];
export const employees: Employee[] = people.map((p, i) => ({
  id: `emp-${i + 1}`,
  name: String(p[0]),
  email: String(p[0]).split(" ")[0].toLowerCase() + "@forma.team",
  title: String(p[1]),
  department: String(p[2]),
  avatar: Number(p[3]),
  status: String(p[4]),
}));
export const taskLabels = [
  "Complete your profile",
  "Sign employment documents",
  "Meet your team",
  "Set up your workspace",
  "Read the team handbook",
  "Explore our product",
  "Meet your onboarding buddy",
  "Complete security training",
  "Set your first goals",
  "Have a manager check-in",
];
export const candidates: Candidate[] = employees
  .slice(6, 10)
  .map((e, i) => ({
    ...e,
    completed: [5, 7, 3, 8][i],
    total: 10,
    tasks: taskLabels.map((label, n) => ({
      id: `${e.id}-task-${n}`,
      label,
      done: n < [5, 7, 3, 8][i],
    })),
  }));
export const leaves: Leave[] = [
  ["emp-1", "Vacation", 18, 21, "Approved"],
  ["emp-2", "Paid leave", 9, 12, "Approved"],
  ["emp-3", "Sick leave", 12, 16, "Pending"],
  ["emp-4", "Vacation", 8, 11, "Approved"],
  ["emp-5", "Paid leave", 18, 21, "Pending"],
  ["emp-6", "Vacation", 15, 17, "Approved"],
].map((p, i) => ({
  id: `leave-${i}`,
  employeeId: String(p[0]),
  type: p[1] as Leave["type"],
  startDate: `2025-12-${String(p[2]).padStart(2, "0")}`,
  endDate: `2025-12-${String(p[3]).padStart(2, "0")}`,
  status: p[4] as Leave["status"],
}));
export const events: TeamEvent[] = [
  {
    id: "ev-1",
    title: "Tech Innovations Summit",
    description: "Big ideas. Fresh perspectives. What’s next.",
    date: "2025-12-15",
    time: "14:00 – 15:00",
    attendees: 8,
    tag: "Coming up",
  },
  {
    id: "ev-2",
    title: "Design & Coffee",
    description: "A little inspiration, a great conversation.",
    date: "2025-12-17",
    time: "10:00 – 11:00",
    attendees: 12,
  },
  {
    id: "ev-3",
    title: "End-of-year Town Hall",
    description: "Celebrating the things we made happen.",
    date: "2025-12-19",
    time: "15:00 – 16:00",
    attendees: 12,
  },
];
