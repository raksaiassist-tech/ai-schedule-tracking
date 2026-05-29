import React, { useCallback, useState } from "react";
import { Link } from "expo-router";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityPlannerCard } from "../components/home/ActivityPlannerCard";
import { ActiveTaskCard } from "../components/home/ActiveTaskCard";
import { AiCoachCard } from "../components/home/AiCoachCard";
import { DeveloperTools } from "../components/home/DeveloperTools";
import { Header } from "../components/home/Header";
import { ScheduleTimeline } from "../components/home/ScheduleTimeline";
import { VoiceCoachToggle } from "../components/home/VoiceCoachToggle";
import { DEFAULT_SCHEDULE } from "../constants/schedule";
import { useTimer } from "../hooks/useTimer";
import { useVoiceCoach } from "../hooks/useVoiceCoach";
import { fetchCoachingTip, planScheduleFromActivities } from "../services/aiService";
import { homeStyles } from "../styles/homeStyles";
import { ScheduleItem } from "../types";
import { formatTime } from "../utils/time";

export default function HomeScreen() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [activityInput, setActivityInput] = useState("");
  const [aiTip, setAiTip] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planOverview, setPlanOverview] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const {
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speakText,
    speakWarning,
    speakTransition,
    stopSpeaking,
  } = useVoiceCoach();

  const handleTransition = useCallback(
    (prevIndex: number | null, nextIndex: number) => {
      const prevTask = prevIndex !== null ? schedule[prevIndex]?.taskName : null;
      const nextTask = schedule[nextIndex]?.taskName;
      speakTransition(prevTask, nextTask);
      setAiTip("");
    },
    [schedule, speakTransition]
  );

  const handleWarning = useCallback(
    (taskName: string, timeLeft: number) => {
      speakWarning(taskName, timeLeft);
    },
    [speakWarning]
  );

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
  const progressPercent = activeTask
    ? ((activeTask.duration - timeLeft) / activeTask.duration) * 100
    : 0;

  const handleToggleTimer = () => {
    if (!activeTask) return;

    if (isActive) {
      stop();
      stopSpeaking();
      return;
    }

    start();
    if (timeLeft === activeTask.duration) {
      speakText(`Starting your focus session. First task: ${activeTask.taskName}. Let's do this.`);
    }
  };

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

  const handlePlanDay = async () => {
    const trimmedInput = activityInput.trim();
    if (!trimmedInput) return;

    setIsPlanning(true);
    setPlanOverview("Thinking through the best order and task windows...");
    setRecommendations([]);
    stop();
    stopSpeaking();

    try {
      const plan = await planScheduleFromActivities(trimmedInput);
      setSchedule(plan.schedule);
      setTaskIndex(0);
      setAiTip("");
      setPlanOverview(plan.overview);
      setRecommendations(plan.recommendations || []);
      speakText(`I planned ${plan.schedule.length} tasks for your day. First up: ${plan.schedule[0].taskName}.`);
    } catch (error) {
      setPlanOverview("I could not create a plan yet. Try describing three to eight activities.");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <SafeAreaView className={homeStyles.screen}>
      <Header isSpeaking={isSpeaking} />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Link href="/daily-plan" asChild>
          <TouchableOpacity className="bg-slate-950 rounded-2xl px-5 py-3 mb-5 items-center">
            <Text className="text-white font-bold text-sm">Open Daily Plan</Text>
          </TouchableOpacity>
        </Link>

        <ActivityPlannerCard
          activityInput={activityInput}
          isPlanning={isPlanning}
          planOverview={planOverview}
          recommendations={recommendations}
          onActivityInputChange={setActivityInput}
          onPlanDay={handlePlanDay}
        />

        <ActiveTaskCard
          activeTask={activeTask}
          currentIndex={currentIndex}
          formattedTime={formatTime(timeLeft)}
          isActive={isActive}
          isLastTask={currentIndex === schedule.length - 1}
          onPrevious={prevTask}
          onReset={reset}
          onSkip={skip}
          onToggleTimer={handleToggleTimer}
          progressPercent={progressPercent}
        />

        <VoiceCoachToggle
          voiceEnabled={voiceEnabled}
          onVoiceEnabledChange={setVoiceEnabled}
        />

        <AiCoachCard
          aiTip={aiTip}
          loadingAi={loadingAi}
          canAskCoach={!!activeTask}
          onGetAiTip={handleGetAiTip}
        />

        <DeveloperTools
          activeTask={activeTask}
          currentIndex={currentIndex}
          schedule={schedule}
          onTestWarning={(taskName) => speakWarning(taskName, 300)}
          onTestTransition={(nextTaskName) =>
            speakTransition(activeTask?.taskName, nextTaskName)
          }
        />

        <ScheduleTimeline
          currentIndex={currentIndex}
          schedule={schedule}
          onSelectTask={setTaskIndex}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
