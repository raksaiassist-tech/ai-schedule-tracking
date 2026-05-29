import { ScheduleItem } from "../types";

export const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    id: "1",
    time: "09:00 AM",
    taskName: "Morning Planning & Setup",
    duration: 15 * 60,
  },
  {
    id: "2",
    time: "09:15 AM",
    taskName: "Deep Focus: Coding UI & Hooks",
    duration: 50 * 60,
  },
  {
    id: "3",
    time: "10:05 AM",
    taskName: "Post-Coding Walk & Hydration",
    duration: 10 * 60,
  },
  {
    id: "4",
    time: "10:15 AM",
    taskName: "Developer Documentation & Refactoring",
    duration: 45 * 60,
  },
  {
    id: "5",
    time: "11:00 AM",
    taskName: "Quick Standup prep",
    duration: 6 * 60,
  },
];
