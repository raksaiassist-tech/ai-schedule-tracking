import {
  DailyTask,
  DailyTaskCategory,
  DailyTaskPlanResult,
  DailyTaskPriority,
  PlannedScheduleResult,
  ScheduleItem,
} from "../types";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

async function generateGeminiText(prompt: string, maxOutputTokens = 300): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens,
          temperature: 0.45,
        },
      }),
    });

    if (!response.ok) {
      console.warn("Gemini API request failed:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in Gemini response.");
  }

  return JSON.parse(text.slice(start, end + 1));
}

function addMinutesToTime(startHour: number, startMinute: number, minutesToAdd: number) {
  const totalMinutes = startHour * 60 + startMinute + minutesToAdd;
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 || 12;

  return `${hour12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${suffix}`;
}

function timeToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const [, hourText, minuteText, suffix] = match;
  let hours = Number(hourText) % 12;
  if (suffix.toUpperCase() === "PM") {
    hours += 12;
  }

  return hours * 60 + Number(minuteText);
}

function minutesToTime(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 || 12;

  return `${hour12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${suffix}`;
}

function makeScheduleItem(
  id: number,
  time: string,
  taskName: string,
  durationMinutes: number,
  reason: string
): ScheduleItem {
  return {
    id: String(id),
    time,
    taskName,
    duration: durationMinutes * 60,
    reason,
  };
}

function sanitizeActivityInput(activityInput: string) {
  return activityInput
    .replace(/\b(hi|hello|hey)\b[,!\s]*/gi, "")
    .replace(/\b(can you|could you|please|kindly)\b/gi, "")
    .replace(/\b(plan|arrange|schedule|organize)\s+(my\s+)?day\b/gi, "")
    .replace(/\b(with|using)?\s*tasks?\s*(like|such as|including)?\b/gi, "")
    .replace(/\b(i want to|i need to|i have to|for me)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractActivities(activityInput: string) {
  const cleanedInput = sanitizeActivityInput(activityInput);
  const rawActivities = cleanedInput
    .split(/,|\n|;| and | then | after that | plus /i)
    .map((item) => item.trim())
    .filter(Boolean);

  const ignored = /^(my day|today|a day|the day|tasks?|activities?)$/i;

  return rawActivities
    .map((activity) =>
      activity
        .replace(/^(with|like|including|such as)\s+/i, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((activity) => activity.length > 2 && !ignored.test(activity))
    .slice(0, 8);
}

function getTaskCategory(text: string): DailyTaskCategory {
  const normalized = text.toLowerCase();

  if (/bug|salesforce|office|work|meeting|client|email|project/.test(normalized)) {
    return "work";
  }
  if (/gym|doctor|exercise|walk|medicine|health|workout/.test(normalized)) {
    return "health";
  }
  if (/study|learn|course|read|practice|school/.test(normalized)) {
    return "study";
  }
  if (/grocery|groceries|buy|shop|errand|bank|pickup/.test(normalized)) {
    return "errands";
  }

  return "personal";
}

function getTaskPriority(text: string, category: DailyTaskCategory): DailyTaskPriority {
  const normalized = text.toLowerCase();

  if (/urgent|important|deadline|doctor|bug|office|finish|must|need/.test(normalized)) {
    return "high";
  }
  if (category === "work" || category === "health" || /study|learn/.test(normalized)) {
    return "medium";
  }

  return "low";
}

function inferDurationMinutes(text: string) {
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/i);
  if (hourMatch) {
    return Math.max(15, Math.round(Number(hourMatch[1]) * 60));
  }

  const minuteMatch = text.match(/(\d+)\s*(minutes?|mins?)/i);
  if (minuteMatch) {
    return Math.max(10, Number(minuteMatch[1]));
  }

  const normalized = text.toLowerCase();
  if (/gym|workout|exercise/.test(normalized)) return 60;
  if (/doctor|call/.test(normalized)) return 20;
  if (/grocery|groceries|shop/.test(normalized)) return 60;
  if (/bug|salesforce|finish|office|work/.test(normalized)) return 120;
  if (/study|learn|course/.test(normalized)) return 60;

  return 45;
}

function makeDailyTask(
  index: number,
  title: string,
  description: string,
  category: DailyTaskCategory,
  priority: DailyTaskPriority,
  durationMinutes: number,
  startMinutes: number,
  date: string,
  isFlexible: boolean,
  status: DailyTask["status"] = "pending"
): DailyTask {
  const now = new Date().toISOString();

  return {
    id: `${Date.now()}-${index}`,
    userId: "local-user",
    title,
    description,
    category,
    priority,
    estimatedDurationMinutes: durationMinutes,
    suggestedStartTime: minutesToTime(startMinutes),
    suggestedEndTime: minutesToTime(startMinutes + durationMinutes),
    date,
    status,
    isFlexible,
    createdAt: now, 
    updatedAt: now,
  };
}

function createFallbackDailyTaskPlan(taskDescription: string): DailyTaskPlanResult {
  const date = new Date().toISOString().slice(0, 10);
  const activities = extractActivities(taskDescription);
  const normalizedActivities = activities.length
    ? activities
    : ["Review priorities", "Focused work block", "Health break", "Personal admin"];

  const priorityOrder: Record<DailyTaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const plannedInputs = normalizedActivities
    .map((activity) => {
      const category = getTaskCategory(activity);
      const priority = getTaskPriority(activity, category);
      return {
        activity,
        category,
        priority,
        duration: inferDurationMinutes(activity),
        isFlexible: !/doctor|appointment|meeting|office|deadline/i.test(activity),
      };
    })
    .sort((a, b) => {
      const categoryA = a.category === "errands" ? 1 : 0;
      const categoryB = b.category === "errands" ? 1 : 0;
      return priorityOrder[a.priority] - priorityOrder[b.priority] || categoryA - categoryB;
    });

  let cursor = 9 * 60;
  const tasks = plannedInputs.slice(0, 8).map((item, index) => {
    if (cursor >= 12 * 60 && cursor < 13 * 60) {
      cursor = 13 * 60;
    }
    if (cursor >= 17 * 60) {
      cursor = 18 * 60;
    }

    const task = makeDailyTask(
      index + 1,
      item.activity.replace(/\.$/, ""),
      `Planned from: "${item.activity}".`,
      item.category,
      item.priority,
      item.duration,
      cursor,
      date,
      item.isFlexible
    );

    cursor += item.duration + 15;
    return task;
  });

  return {
    overview:
      "I created a practical local plan with priority ordering, buffers, and grouped work where possible. Add a Gemini key for richer natural-language planning.",
    tasks,
  };
}

function createFallbackPlan(activityInput: string): PlannedScheduleResult {
  const activities = extractActivities(activityInput);
  const lowerInput = activityInput.toLowerCase();
  const hasGym =
    activities.some((activity) => /gym|workout|exercise|run|fitness/.test(activity.toLowerCase())) ||
    /exercise|workout|gym|evening walk/.test(lowerInput);
  const hasOffice =
    activities.some((activity) => /office|work|job|meeting/.test(activity.toLowerCase())) ||
    /office|work from home|wfh|9\s*am\s*-\s*5\s*pm|9\s*-\s*5/.test(lowerInput);
  const hasProductive = activities.some((activity) =>
    /productive|study|learn|project|focus|coding|reading/.test(activity.toLowerCase())
  ) || /self learning|productive|study|learn|project|focus|coding|reading/.test(lowerInput);
  const wantsTwoHourBlock = /2\s*(hours?|hrs?)|two\s*hours?|couple of hours?/i.test(activityInput);
  const hasBabyCare = /baby|kid|child|9 month|9-month|wife|family/.test(lowerInput);
  const hasSleepIssues = /sleep|tired|fatigue|brain fog|no mood|procrastinat/.test(lowerInput);
  const wantsPrayer = /pray|prayer|meditat/.test(lowerInput);

  const schedule: ScheduleItem[] = [
    makeScheduleItem(
      1,
      "07:00 AM",
      "Wake up, water & light stretch",
      15,
      hasSleepIssues
        ? "A realistic wake time is better than forcing 5 AM when sleep is broken."
        : "A steady wake-up window gives the day a calm start."
    ),
    makeScheduleItem(
      2,
      "07:15 AM",
      wantsPrayer ? "Prayer and quiet reflection" : "Quiet planning and reflection",
      wantsPrayer ? 60 : 30,
      "This creates a protected calm block before family and office demands begin."
    ),
  ];

  let nextId = 3;

  schedule.push(
    makeScheduleItem(nextId++, "08:15 AM", "Breakfast and family prep", 45, "Food and family transition time reduce morning friction.")
  );

  if (hasOffice) {
    schedule.push(
      makeScheduleItem(nextId++, "09:00 AM", "Office deep work", 180, "The morning is the best window for harder office tasks before fatigue builds."),
      makeScheduleItem(nextId++, "12:00 PM", "Lunch and reset", 45, "Lunch protects energy and gives a natural midpoint reset."),
      makeScheduleItem(nextId++, "12:45 PM", "Calls, emails and lighter office work", 105, "Lighter tasks fit after lunch when focus may dip."),
      makeScheduleItem(nextId++, "02:30 PM", "Walk or 20-minute recovery break", 30, "A planned reset helps brain fog more than pushing continuously."),
      makeScheduleItem(nextId++, "03:00 PM", "Office wrap-up block", 120, "This closes work cleanly before family time starts.")
    );
  } else {
    schedule.push(
      makeScheduleItem(nextId++, "09:00 AM", "Primary focus block", 120, "Morning focus is best for demanding work."),
      makeScheduleItem(nextId++, "12:00 PM", "Lunch break", 45, "Lunch creates a clean break between work blocks."),
      makeScheduleItem(nextId++, "01:00 PM", "Admin, errands or messages", 60, "Lower-energy tasks fit better after lunch.")
    );
  }

  const productiveLabel =
    activities.find((activity) => /productive|study|learn|project|focus|coding|reading/.test(activity.toLowerCase())) ||
    (hasProductive ? "Productive task block" : "");

  if (productiveLabel || lowerInput.includes("productive")) {
    schedule.push(
      makeScheduleItem(
        nextId++,
        "09:30 PM",
        productiveLabel || "Self-learning / productive block",
        wantsTwoHourBlock ? 120 : 90,
        hasBabyCare
          ? "This is placed after family wind-down so it has fewer interruptions."
          : "Evening is set aside for meaningful progress after office responsibilities."
      )
    );
  }

  const extraActivities = activities.filter(
    (activity) =>
      !/gym|workout|exercise|run|fitness|office|work|job|meeting|productive|study|learn|project|focus|coding|reading/.test(
        activity.toLowerCase()
      )
  );

  extraActivities.slice(0, 2).forEach((activity) => {
    schedule.push(
      makeScheduleItem(
        nextId++,
        addMinutesToTime(17, 30, (nextId - 9) * 45),
        activity,
        45,
        "This personal task is placed after the main workday with a manageable window."
      )
    );
  });

  if (hasBabyCare) {
    schedule.push(
      makeScheduleItem(nextId++, "05:00 PM", "Baby care and family support", 60, "A dedicated family block reduces task switching guilt during work."),
      makeScheduleItem(nextId++, "08:00 PM", "Family wind-down and baby bedtime", 90, "The routine respects the current baby sleep constraint.")
    );
  }

  if (hasGym) {
    schedule.push(
      makeScheduleItem(nextId++, "06:00 PM", "Exercise / walk", 60, "Evening exercise is realistic after office hours and can improve sleep pressure.")
    );
  }

  schedule.push(
    makeScheduleItem(nextId++, "07:00 PM", "Dinner", 60, "Dinner and downtime help the day taper instead of ending abruptly."),
    makeScheduleItem(nextId++, "11:00 PM", "No-screen wind down", 30, "A small wind-down is more achievable than a perfect early bedtime."),
    makeScheduleItem(nextId++, "11:30 PM", "Sleep attempt", 450, "This respects the baby schedule while still protecting sleep as much as possible.")
  );

  return {
    overview: "I built a realistic parent-friendly routine with work, prayer, exercise, learning, meals, recovery, and sleep protection.",
    schedule: schedule.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    recommendations: [
      "Treat fatigue and brain fog as a signal to simplify the routine first, not as a character failure.",
      "For medication, supplements, or deficiency testing, speak with a doctor and ask about sleep, vitamin D, B12, iron/ferritin, thyroid, and mood screening.",
      "Protect one deep-work block during office hours and one small evening learning block; consistency matters more than intensity.",
    ],
  };
}

/**
 * Calls Gemini API to get a short motivational coaching tip or strategy for the current task.
 * Note: For local development, EXPO_PUBLIC_ prefixed environment variables are used.
 * In a production app, this API key should be stored and called from a secure backend proxy
 * to prevent it from being exposed in client-side bundles.
 */
export async function fetchCoachingTip(taskName: string, durationMinutes: number): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "To receive AI coach tips, please define EXPO_PUBLIC_GEMINI_API_KEY in your .env file.";
  }

  const prompt = `You are a supportive, friendly voice-based productivity coach.
The user is about to start or is currently doing the task: "${taskName}" for ${durationMinutes} minutes.
Provide a quick, punchy, motivational coaching tip or focus strategy for this task.
Keep it extremely short (under 2 sentences, maximum 25 words) so it can be easily spoken by a text-to-speech engine. 
Do not include any markdown formatting, asterisks, emojis, or bullet points. Just return raw text.`;

  const generatedText = await generateGeminiText(prompt, 60);
  if (generatedText) {
    return generatedText;
  }

  return `Make the most of your time on ${taskName}. Focus and take it one step at a time!`;
}

export async function planScheduleFromActivities(
  activityInput: string
): Promise<PlannedScheduleResult> {
  const trimmedInput = activityInput.trim();

  if (!trimmedInput) {
    throw new Error("Add a few activities before planning your day.");
  }

  const prompt = `You are an expert personal assistant, daily routine planner, and supportive productivity coach.
The user may describe tiredness, brain fog, broken sleep, family responsibilities, work constraints, spiritual goals, exercise goals, learning goals, diet questions, medication questions, or a casual activity list:
"${trimmedInput}"

Think like a practical human assistant. First understand the user's condition and constraints, then create the best realistic plan for a healthy and productive lifestyle.
Extract true constraints and goals from the text. Ignore greeting or command language such as "hi", "can you", "plan my day", "tasks like".

Create a meaningful full-day timetable, not just a list of mentioned tasks.
Include required human blocks when appropriate: wake up, water/freshen up, prayer/meditation if requested, breakfast, office/work blocks, lunch, short recovery break, family/child-care support, exercise, dinner, wind-down, learning/productive work, and sleep.
Use realistic windows instead of idealistic ones. If the user has broken sleep or a baby sleeping late, do not force a very early wake time.
If office hours are given, preserve them exactly. If work-from-home or office days are mentioned, reflect that in the task names/reasons.
If the user mentions task switching due to baby/family responsibilities, add explicit family support windows and design office blocks to reduce context switching.
If the user asks about medication or nutrition, do not prescribe. Recommend seeing a doctor for evaluation and mention common checkups only as discussion points, not diagnosis.
If the user asks for success/life recommendations, include a few practical recommendations.

Return only valid JSON in this exact shape:
{
  "overview": "one short sentence explaining the plan",
  "recommendations": [
    "short practical recommendation",
    "short practical recommendation"
  ],
  "schedule": [
    {
      "id": "1",
      "time": "09:00 AM",
      "taskName": "Task name",
      "duration": 1800,
      "reason": "Short reason for this window"
    }
  ]
}
Rules:
- duration must be seconds.
- taskName must be short and readable.
- reason must explain why this time window is reasonable.
- produce 8 to 14 tasks.
- each item time is the start time, like "06:00 AM".
- include meals and sleep unless the user clearly says not to.
- do not create tasks from greetings or command text.
- make the plan compassionate and realistic for the user's life situation.
- avoid medical diagnosis. Do not say the user needs medication. Recommend professional evaluation when health symptoms are mentioned.
- do not include markdown or code fences.`;

  const responseText = await generateGeminiText(prompt, 2200);

  if (!responseText) {
    return createFallbackPlan(trimmedInput);
  }

  try {
    const parsed = extractJsonObject(responseText) as PlannedScheduleResult;
    const schedule = parsed.schedule
      .filter((item) => item.taskName && item.time && item.duration)
      .slice(0, 14)
      .map((item, index) => ({
        id: String(item.id || index + 1),
        time: item.time,
        taskName: item.taskName,
        duration: Number(item.duration),
        reason: item.reason || "Planned as a reasonable focused work window.",
      }));

    if (schedule.length < 5) {
      return createFallbackPlan(trimmedInput);
    }

    return {
      overview: parsed.overview || "I arranged your day into focused task windows.",
      schedule,
      recommendations: parsed.recommendations?.slice(0, 5),
    };
  } catch (error) {
    console.warn("Failed to parse Gemini schedule plan:", error);
    return createFallbackPlan(trimmedInput);
  }
}

export async function generateDailyTaskPlan(
  taskDescription: string,
  availableWindow = "09:00 AM - 08:00 PM"
): Promise<DailyTaskPlanResult> {
  const trimmedInput = taskDescription.trim();

  if (!trimmedInput) {
    throw new Error("Describe the tasks you want to plan.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are a supportive AI daily planning assistant.
The user entered this free-text task description:
"${trimmedInput}"

Available day window: ${availableWindow}
Default date: ${today}

Comprehend the natural language description and split it into individual meaningful tasks.
For each task infer:
- clear title
- short description
- estimated duration in minutes
- suggested start and end time
- priority: low, medium, high
- category: work, health, personal, study, errands
- whether flexible or time-sensitive

Arrange the tasks into a practical daily schedule using priority, estimated duration, fixed-time tasks, breaks, grouping errands together, and avoiding overloading the day.
Ask for clarification only if the plan cannot be made safely or meaningfully. Otherwise make reasonable assumptions.
Keep the tone supportive and practical.

Return only valid JSON in this exact shape:
{
  "overview": "short supportive summary of the plan",
  "clarificationQuestion": "",
  "tasks": [
    {
      "id": "1",
      "userId": "local-user",
      "title": "Finish Salesforce bug",
      "description": "Resolve and test the Salesforce issue.",
      "category": "work",
      "priority": "high",
      "estimatedDurationMinutes": 120,
      "suggestedStartTime": "09:00 AM",
      "suggestedEndTime": "11:00 AM",
      "date": "${today}",
      "status": "pending",
      "isFlexible": false,
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp"
    }
  ]
}

Rules:
- Produce 2 to 10 tasks.
- Use only these categories: work, health, personal, study, errands.
- Use only these priorities: low, medium, high.
- Use only these statuses: pending, completed, skipped, moved.
- Put breaks between longer tasks when possible.
- Group errands when logical.
- If a task has a fixed time, keep it. If not, choose a realistic time inside the available window.
- Do not include markdown or code fences.`;

  const responseText = await generateGeminiText(prompt, 2200);

  if (!responseText) {
    return createFallbackDailyTaskPlan(trimmedInput);
  }

  try {
    const parsed = extractJsonObject(responseText) as DailyTaskPlanResult;
    const now = new Date().toISOString();
    const tasks = parsed.tasks
      .filter((task) => task.title && task.estimatedDurationMinutes)
      .slice(0, 10)
      .map((task, index): DailyTask => ({
        id: String(task.id || `${Date.now()}-${index + 1}`),
        userId: task.userId || "local-user",
        title: task.title,
        description: task.description || "Planned from your daily task description.",
        category: ["work", "health", "personal", "study", "errands"].includes(task.category)
          ? task.category
          : "personal",
        priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
        estimatedDurationMinutes: Number(task.estimatedDurationMinutes),
        suggestedStartTime: task.suggestedStartTime || "09:00 AM",
        suggestedEndTime: task.suggestedEndTime || "10:00 AM",
        date: task.date || today,
        status: ["pending", "completed", "skipped", "moved"].includes(task.status)
          ? task.status
          : "pending",
        isFlexible: Boolean(task.isFlexible),
        createdAt: task.createdAt || now,
        updatedAt: now,
      }));

    if (!tasks.length) {
      return createFallbackDailyTaskPlan(trimmedInput);
    }

    return {
      overview: parsed.overview || "I created a practical daily task plan.",
      clarificationQuestion: parsed.clarificationQuestion || undefined,
      tasks,
    };
  } catch (error) {
    console.warn("Failed to parse Gemini daily task plan:", error);
    return createFallbackDailyTaskPlan(trimmedInput);
  }
}
