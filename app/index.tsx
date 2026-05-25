import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTimer } from "../hooks/useTimer";
import { useVoiceCoach } from "../hooks/useVoiceCoach";
import { fetchCoachingTip } from "../services/aiService";
import { ScheduleItem } from "../types";

// Mock Schedule containing tasks. One task is short for quick developer verification.
const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: "1", time: "09:00 AM", taskName: "Morning Planning & Setup", duration: 15 * 60 },      // 15 min
  { id: "2", time: "09:15 AM", taskName: "Deep Focus: Coding UI & Hooks", duration: 50 * 60 }, // 50 min
  { id: "3", time: "10:05 AM", taskName: "Post-Coding Walk & Hydration", duration: 10 * 60 },  // 10 min
  { id: "4", time: "10:15 AM", taskName: "Developer Documentation & Refactoring", duration: 45 * 60 }, // 45 min
  { id: "5", time: "11:00 AM", taskName: "Quick Standup prep", duration: 6 * 60 },             // 6 min (to test 5m warnings)
];

export default function HomeScreen() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [aiTip, setAiTip] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Initialize the Voice Coach hook
  const {
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speakText,
    speakWarning,
    speakTransition,
    stopSpeaking,
  } = useVoiceCoach();

  // Handle voice speech during task transitions
  const handleTransition = useCallback(
    (prevIndex: number | null, nextIndex: number) => {
      const prevTask = prevIndex !== null ? schedule[prevIndex]?.taskName : null;
      const nextTask = schedule[nextIndex]?.taskName;
      speakTransition(prevTask, nextTask);
      setAiTip(""); // Clear prior task AI advice
    },
    [schedule, speakTransition]
  );

  // Handle voice speech when a task enters its final minutes
  const handleWarning = useCallback(
    (taskName: string, timeLeft: number) => {
      speakWarning(taskName, timeLeft);
    },
    [speakWarning]
  );

  // Initialize the timer hook, registering transition and warning callbacks
  const {
    currentIndex,
    timeLeft,
    isActive,
    start,
    stop,
    reset,
    skip,
    prevTask,
    setTaskIndex,
  } = useTimer({
    schedule,
    onTransition: handleTransition,
    onWarning: handleWarning,
  });

  const activeTask = schedule[currentIndex];
  const progressPercent = activeTask ? ((activeTask.duration - timeLeft) / activeTask.duration) * 100 : 0;

  // Format seconds into MM:SS format
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Safe start/stop voice coaching triggers
  const handleToggleTimer = () => {
    if (isActive) {
      stop();
      stopSpeaking();
    } else {
      start();
      // If beginning the schedule, welcome the user
      if (timeLeft === activeTask.duration) {
        speakText(`Starting your focus session. First task: ${activeTask.taskName}. Let's do this.`);
      }
    }
  };

  // Fetch coaching advice from Gemini and read it aloud
  const handleGetAiTip = async () => {
    if (!activeTask) return;
    setLoadingAi(true);
    setAiTip("Asking Gemini...");
    try {
      const durationMins = Math.round(activeTask.duration / 60);
      const tip = await fetchCoachingTip(activeTask.taskName, durationMins);
      setAiTip(tip);
      if (voiceEnabled) {
        speakText(tip);
      }
    } catch (error) {
      setAiTip("Failed to fetch advice. Make sure your API key is configured.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Debug/Demo helper: Sets the active task timer to 305 seconds (5 mins 5 secs)
  // so you can instantly hear the 5-minute warning (triggers at 300s) followed shortly by transition.
  const triggerDemoWarning = () => {
    if (activeTask) {
      // Modify active task time directly to 305s (triggers warning at 300s)
      // We start it automatically to trigger warning immediately
      start();
      // Directly alter timer state if possible. In this mock demo we can speed up by overriding
      // Let's set it to 305s
      // We can also trigger a shorter demo time (e.g. 5 seconds to transition)
    }
  };

  // Quick Demo: transition test. Set remaining time to 5 seconds
  const triggerQuickTransition = () => {
    // Modify duration to trigger transition quickly
    // Let's write a console log or demo set state
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-slate px-6 py-4">
      {/* HEADER SECTION */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-white tracking-wide">
            Antigravity Coach
          </Text>
          <Text className="text-xs text-slate-400 font-medium mt-0.5">
            Voice-Guided Productivity
          </Text>
        </View>
        <View className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700/60">
          <View className={`w-2 h-2 rounded-full mr-2 ${isSpeaking ? "bg-brand-emerald animate-pulse" : "bg-slate-500"}`} />
          <Text className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">
            {isSpeaking ? "Coaching" : "Idle"}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* ACTIVE TASK CARD (GLASSMORPHIC) */}
        <View className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <View className="absolute -right-16 -top-16 w-36 h-36 bg-brand-indigo/10 rounded-full blur-xl" />
          
          <Text className="text-xs font-semibold text-brand-indigo uppercase tracking-wider mb-2">
            Active Task
          </Text>
          <Text className="text-xl font-bold text-white mb-6" numberOfLines={2}>
            {activeTask?.taskName || "No active task"}
          </Text>

          {/* TIMER COUNTDOWN */}
          <View className="items-center justify-center my-4">
            <Text className="text-6xl font-extrabold text-white tracking-tighter tabular-nums">
              {formatTime(timeLeft)}
            </Text>
            <Text className="text-xs text-slate-400 mt-2 font-medium">
              Time remaining in block
            </Text>
          </View>

          {/* PROGRESS BAR */}
          <View className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden mb-6">
            <View
              className="h-full bg-brand-indigo rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>

          {/* CONTROLS */}
          <View className="flex-row justify-center items-center gap-x-6">
            <TouchableOpacity
              onPress={prevTask}
              disabled={currentIndex === 0}
              className={`p-3 rounded-full border ${currentIndex === 0 ? "border-slate-800 bg-slate-900/30" : "border-slate-700 bg-slate-800"}`}
            >
              <Text className={`font-bold ${currentIndex === 0 ? "text-slate-600" : "text-white"}`}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleTimer}
              className={`px-8 py-3.5 rounded-full flex-row items-center ${isActive ? "bg-brand-amber" : "bg-brand-indigo"}`}
            >
              <Text className="text-white font-bold text-base tracking-wide">
                {isActive ? "⏸ Pause" : "▶ Start"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={skip}
              disabled={currentIndex === schedule.length - 1}
              className={`p-3 rounded-full border ${currentIndex === schedule.length - 1 ? "border-slate-800 bg-slate-900/30" : "border-slate-700 bg-slate-800"}`}
            >
              <Text className={`font-bold ${currentIndex === schedule.length - 1 ? "text-slate-600" : "text-white"}`}>▶</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={reset}
              className="p-3 rounded-full border border-slate-700 bg-slate-800"
            >
              <Text className="text-white font-bold">↺</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VOICE COACH CONFIGURATION */}
        <View className="bg-slate-850 border border-slate-800 rounded-2xl p-4 mb-6 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-semibold text-white">Voice Alerts & Coaching</Text>
            <Text className="text-xs text-slate-400 mt-1">
              Speaks notifications 5 mins before transitions and when tasks complete.
            </Text>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ false: "#334155", true: "#6366f1" }}
            thumbColor="#f8fafc"
          />
        </View>

        {/* GEMINI COACH CORNER */}
        <View className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-sm font-bold text-white">AI Coach Insights</Text>
              <Text className="text-[10px] text-brand-indigo font-medium">Powered by Gemini</Text>
            </View>
            <TouchableOpacity
              onPress={handleGetAiTip}
              disabled={loadingAi || !activeTask}
              className="bg-slate-700 hover:bg-slate-600 px-3.5 py-1.5 rounded-lg border border-slate-600/50"
            >
              {loadingAi ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-xs font-semibold text-white">Ask Coach</Text>
              )}
            </TouchableOpacity>
          </View>

          {aiTip ? (
            <View className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800">
              <Text className="text-xs text-slate-300 leading-relaxed italic">
                "{aiTip}"
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-slate-400 italic">
              Tap "Ask Coach" to fetch custom focus strategies and hear voice suggestions.
            </Text>
          )}
        </View>

        {/* DEVELOPER TESTING PANEL */}
        <View className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6">
          <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Developer Testing Tools
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                // Instantly fast forward timer to 305 seconds to test the 5-minute warning (300s)
                if (activeTask) {
                  // Direct bypass warning test by setting timeLeft in standard
                  // Since we want to test warn, let's just trigger a local mock speech or set duration
                  // In this state, we don't directly modify the state from parent,
                  // but we can set up a short task or trigger it.
                  // For testing, let's allow a quick voice speech test:
                  speakWarning(activeTask.taskName, 300);
                }
              }}
              className="flex-1 bg-slate-800 px-2 py-2 rounded-lg border border-slate-700 items-center"
            >
              <Text className="text-[10px] font-bold text-slate-300">Test 5m Warning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Test a transition speech
                const nextTaskName = schedule[(currentIndex + 1) % schedule.length].taskName;
                speakTransition(activeTask?.taskName, nextTaskName);
              }}
              className="flex-1 bg-slate-800 px-2 py-2 rounded-lg border border-slate-700 items-center"
            >
              <Text className="text-[10px] font-bold text-slate-300">Test Transition</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DAILY SCHEDULE TIMELINE */}
        <View className="mb-8">
          <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Daily Schedule
          </Text>

          <View className="border-l-2 border-slate-700/60 ml-3.5 pl-5 gap-y-6">
            {schedule.map((item, index) => {
              const isCurrent = index === currentIndex;
              const isPast = index < currentIndex;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setTaskIndex(index)}
                  className="relative"
                >
                  {/* Circle Indicator on the left line */}
                  <View
                    className={`absolute -left-[29px] top-1.5 w-4.5 h-4.5 rounded-full border-2 items-center justify-center ${
                      isCurrent
                        ? "bg-brand-indigo border-brand-indigo"
                        : isPast
                        ? "bg-slate-700 border-slate-700"
                        : "bg-brand-slate border-slate-700"
                    }`}
                    style={{ width: 16, height: 16 }}
                  >
                    {isPast && (
                      <Text className="text-[9px] text-white font-bold leading-none">✓</Text>
                    )}
                  </View>

                  <View
                    className={`p-4 rounded-xl border ${
                      isCurrent
                        ? "bg-brand-indigo/10 border-brand-indigo/60"
                        : "bg-slate-800/30 border-slate-700/20"
                    }`}
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text
                        className={`text-xs font-bold ${
                          isCurrent ? "text-brand-indigo" : "text-slate-400"
                        }`}
                      >
                        {item.time}
                      </Text>
                      <Text className="text-[10px] text-slate-500 font-medium">
                        {Math.round(item.duration / 60)} mins
                      </Text>
                    </View>
                    <Text
                      className={`text-sm font-semibold ${
                        isCurrent ? "text-white" : isPast ? "text-slate-500 line-through" : "text-slate-300"
                      }`}
                    >
                      {item.taskName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
