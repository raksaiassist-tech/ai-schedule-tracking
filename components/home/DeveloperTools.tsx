import { Text, TouchableOpacity, View } from "react-native";
import { homeStyles } from "../../styles/homeStyles";
import { ScheduleItem } from "../../types";

interface DeveloperToolsProps {
  activeTask?: ScheduleItem;
  currentIndex: number;
  schedule: ScheduleItem[];
  onTestTransition: (nextTaskName: string) => void;
  onTestWarning: (taskName: string) => void;
}

export function DeveloperTools({
  activeTask,
  currentIndex,
  schedule,
  onTestTransition,
  onTestWarning,
}: DeveloperToolsProps) {
  return (
    <View className={homeStyles.mutedCard}>
      <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
        Developer Testing Tools
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => activeTask && onTestWarning(activeTask.taskName)}
          className="flex-1 bg-white px-2 py-2 rounded-lg border border-slate-200 items-center"
        >
          <Text className="text-[10px] font-bold text-slate-700">Test 5m Warning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const nextTaskName = schedule[(currentIndex + 1) % schedule.length].taskName;
            onTestTransition(nextTaskName);
          }}
          className="flex-1 bg-white px-2 py-2 rounded-lg border border-slate-200 items-center"
        >
          <Text className="text-[10px] font-bold text-slate-700">Test Transition</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
