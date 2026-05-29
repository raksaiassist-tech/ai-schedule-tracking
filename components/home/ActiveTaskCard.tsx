import { Text, TouchableOpacity, View } from "react-native";
import { homeStyles } from "../../styles/homeStyles";
import { ScheduleItem } from "../../types";

interface ActiveTaskCardProps {
  activeTask?: ScheduleItem;
  currentIndex: number;
  formattedTime: string;
  isActive: boolean;
  isLastTask: boolean;
  onPrevious: () => void;
  onReset: () => void;
  onSkip: () => void;
  onToggleTimer: () => void;
  progressPercent: number;
}

export function ActiveTaskCard({
  activeTask,
  currentIndex,
  formattedTime,
  isActive,
  isLastTask,
  onPrevious,
  onReset,
  onSkip,
  onToggleTimer,
  progressPercent,
}: ActiveTaskCardProps) {
  return (
    <View className={homeStyles.activeCard}>
      <View className="absolute -right-16 -top-16 w-36 h-36 bg-brand-indigo/5 rounded-full" />

      <Text className="text-xs font-semibold text-brand-indigo uppercase tracking-wider mb-2">
        Active Task
      </Text>
      <Text className="text-xl font-bold text-slate-950 mb-6" numberOfLines={2}>
        {activeTask?.taskName || "No active task"}
      </Text>

      <View className="items-center justify-center my-4">
        <Text className="text-6xl font-extrabold text-slate-950 tracking-tighter tabular-nums">
          {formattedTime}
        </Text>
        <Text className="text-xs text-slate-500 mt-2 font-medium">
          Time remaining in block
        </Text>
      </View>

      <View className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
        <View
          className="h-full bg-brand-indigo rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </View>

      <View className="flex-row justify-center items-center gap-x-6">
        <TouchableOpacity
          onPress={onPrevious}
          disabled={currentIndex === 0}
          className={currentIndex === 0 ? homeStyles.disabledIconButton : homeStyles.iconButton}
        >
          <Text className={currentIndex === 0 ? "font-bold text-slate-600" : homeStyles.primaryText}>
            Prev
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleTimer}
          className={`px-8 py-3.5 rounded-full flex-row items-center ${
            isActive ? "bg-brand-amber" : "bg-brand-indigo"
          }`}
        >
          <Text className="text-white font-bold text-base tracking-wide">
            {isActive ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkip}
          disabled={isLastTask}
          className={isLastTask ? homeStyles.disabledIconButton : homeStyles.iconButton}
        >
          <Text className={isLastTask ? "font-bold text-slate-600" : homeStyles.primaryText}>
            Next
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onReset} className={homeStyles.iconButton}>
          <Text className={homeStyles.primaryText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
