export interface ScheduleItem {
  id: string;
  time: string;       // e.g., "09:00 AM"
  taskName: string;
  duration: number;   // Duration in seconds (e.g., 1800 for 30 minutes)
}

export interface CoachVoiceSettings {
  pitch: number;
  rate: number;
  voice?: string;
}
