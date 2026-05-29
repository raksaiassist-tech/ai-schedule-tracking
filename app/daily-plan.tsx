import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateDailyTaskPlan } from "../services/aiService";
import { DailyTask, DailyTaskCategory, DailyTaskPriority } from "../types";

const categories: DailyTaskCategory[] = ["work", "health", "personal", "study", "errands"];
const priorities: DailyTaskPriority[] = ["high", "medium", "low"];

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function updateTaskTimestamp(task: DailyTask): DailyTask {
  return {
    ...task,
    updatedAt: new Date().toISOString(),
  };
}

export default function DailyPlanScreen() {
  const [taskDescription, setTaskDescription] = useState("");
  const [availableWindow, setAvailableWindow] = useState("09:00 AM - 08:00 PM");
  const [overview, setOverview] = useState("");
  const [clarificationQuestion, setClarificationQuestion] = useState("");
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleGeneratePlan = async () => {
    const trimmedDescription = taskDescription.trim();
    if (!trimmedDescription) return;

    setIsGenerating(true);
    setIsAccepted(false);
    setClarificationQuestion("");
    setOverview("Thinking through priorities, timing, categories and realistic buffers...");

    try {
      const plan = await generateDailyTaskPlan(trimmedDescription, availableWindow);
      setOverview(plan.overview);
      setClarificationQuestion(plan.clarificationQuestion || "");
      setTasks(plan.tasks);
    } catch (error) {
      setOverview("I could not create a plan yet. Add a few concrete tasks and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTask = (taskId: string, updates: Partial<DailyTask>) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? updateTaskTimestamp({
              ...task,
              ...updates,
            })
          : task
      )
    );
  };

  const handleMoveTask = (task: DailyTask) => {
    updateTask(task.id, {
      date: addDays(task.date, 1),
      status: "moved",
    });
  };

  const completedCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <SafeAreaView className="flex-1 bg-white px-5 py-4">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mb-5">
          <Text className="text-3xl font-bold text-slate-950">Daily Plan</Text>
          <Text className="text-sm text-slate-500 mt-1">
            Turn a messy paragraph into a practical, editable task schedule.
          </Text>
        </View>

        <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
          <Text className="text-sm font-bold text-slate-950 mb-2">Task Description</Text>
          <TextInput
            value={taskDescription}
            onChangeText={setTaskDescription}
            multiline
            textAlignVertical="top"
            placeholder="Tomorrow I need to go to the gym, finish my Salesforce bug, call my doctor, buy groceries, and study for 1 hour."
            placeholderTextColor="#94a3b8"
            className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 leading-relaxed"
          />

          <Text className="text-sm font-bold text-slate-950 mt-4 mb-2">
            Available Window
          </Text>
          <TextInput
            value={availableWindow}
            onChangeText={setAvailableWindow}
            placeholder="09:00 AM - 08:00 PM"
            placeholderTextColor="#94a3b8"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
          />

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={handleGeneratePlan}
              disabled={isGenerating || !taskDescription.trim()}
              className={`flex-1 rounded-xl px-4 py-3 items-center ${
                isGenerating || !taskDescription.trim() ? "bg-slate-300" : "bg-brand-indigo"
              }`}
            >
              {isGenerating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-sm font-bold text-white">
                  {tasks.length ? "Regenerate Plan" : "Generate Plan"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsAccepted(true)}
              disabled={!tasks.length}
              className={`rounded-xl px-4 py-3 items-center ${
                tasks.length ? "bg-slate-950" : "bg-slate-300"
              }`}
            >
              <Text className="text-sm font-bold text-white">Accept</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!!overview && (
          <View className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
            <Text className="text-sm font-bold text-indigo-800">Plan Summary</Text>
            <Text className="text-xs text-slate-700 mt-2 leading-relaxed">{overview}</Text>
            {!!clarificationQuestion && (
              <Text className="text-xs text-amber-700 mt-2 leading-relaxed">
                Clarification: {clarificationQuestion}
              </Text>
            )}
            {tasks.length > 0 && (
              <Text className="text-xs text-slate-600 mt-2">
                {completedCount}/{tasks.length} tasks completed
                {isAccepted ? " - plan accepted" : ""}
              </Text>
            )}
          </View>
        )}

        {tasks.map((task) => (
          <View
            key={task.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm"
          >
            <View className="flex-row justify-between gap-3 mb-3">
              <View className="flex-1">
                <TextInput
                  value={task.title}
                  onChangeText={(title) => updateTask(task.id, { title })}
                  className="text-lg font-bold text-slate-950 border-b border-slate-100 pb-1"
                />
                <TextInput
                  value={task.description}
                  onChangeText={(description) => updateTask(task.id, { description })}
                  multiline
                  className="text-xs text-slate-600 mt-2 leading-relaxed"
                />
              </View>
              <View
                className={`px-2 py-1 rounded-lg self-start ${
                  task.status === "completed"
                    ? "bg-emerald-100"
                    : task.status === "moved"
                    ? "bg-amber-100"
                    : "bg-slate-100"
                }`}
              >
                <Text className="text-[10px] font-bold uppercase text-slate-700">
                  {task.status}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2 mb-3">
              <TextInput
                value={String(task.estimatedDurationMinutes)}
                onChangeText={(value) =>
                  updateTask(task.id, {
                    estimatedDurationMinutes: Number(value.replace(/[^0-9]/g, "")) || 0,
                  })
                }
                keyboardType="number-pad"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-950"
              />
              <TextInput
                value={task.suggestedStartTime}
                onChangeText={(suggestedStartTime) =>
                  updateTask(task.id, { suggestedStartTime })
                }
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-950"
              />
              <TextInput
                value={task.suggestedEndTime}
                onChangeText={(suggestedEndTime) => updateTask(task.id, { suggestedEndTime })}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-950"
              />
            </View>

            <View className="flex-row flex-wrap gap-2 mb-3">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => updateTask(task.id, { category })}
                  className={`px-3 py-1.5 rounded-full border ${
                    task.category === category
                      ? "bg-brand-indigo border-brand-indigo"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase ${
                      task.category === category ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row flex-wrap gap-2 mb-4">
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority}
                  onPress={() => updateTask(task.id, { priority })}
                  className={`px-3 py-1.5 rounded-full border ${
                    task.priority === priority
                      ? "bg-slate-950 border-slate-950"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase ${
                      task.priority === priority ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => updateTask(task.id, { isFlexible: !task.isFlexible })}
                className={`px-3 py-1.5 rounded-full border ${
                  task.isFlexible ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                }`}
              >
                <Text className="text-[10px] font-bold uppercase text-slate-700">
                  {task.isFlexible ? "Flexible" : "Time-sensitive"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() =>
                  updateTask(task.id, {
                    status: task.status === "completed" ? "pending" : "completed",
                  })
                }
                className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 items-center"
              >
                <Text className="text-xs font-bold text-white">
                  {task.status === "completed" ? "Undo" : "Complete"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateTask(task.id, { status: "skipped" })}
                className="flex-1 rounded-xl bg-slate-100 px-3 py-2 items-center"
              >
                <Text className="text-xs font-bold text-slate-700">Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMoveTask(task)}
                className="flex-1 rounded-xl bg-amber-100 px-3 py-2 items-center"
              >
                <Text className="text-xs font-bold text-amber-800">Move</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-[10px] text-slate-400 mt-3">
              Date: {task.date} | Updated: {new Date(task.updatedAt).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
