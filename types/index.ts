export interface ScheduleItem {
  id: string;
  time: string;       // e.g., "09:00 AM"
  taskName: string;
  duration: number;   // Duration in seconds (e.g., 1800 for 30 minutes)
  reason?: string;
}

export interface CoachVoiceSettings {
  pitch: number;
  rate: number;
  voice?: string;
}

export interface PlannedScheduleResult {
  overview: string;
  schedule: ScheduleItem[];
  recommendations?: string[];
}

export type DailyTaskCategory = "work" | "health" | "personal" | "study" | "errands";
export type DailyTaskPriority = "low" | "medium" | "high";
export type DailyTaskStatus = "pending" | "completed" | "skipped" | "moved";

export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: DailyTaskCategory;
  priority: DailyTaskPriority;
  estimatedDurationMinutes: number;
  suggestedStartTime: string;
  suggestedEndTime: string;
  date: string;
  status: DailyTaskStatus;
  isFlexible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyTaskPlanResult {
  overview: string;
  clarificationQuestion?: string;
  tasks: DailyTask[];
}
