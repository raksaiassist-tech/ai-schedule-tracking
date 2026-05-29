import { Text, TouchableOpacity, View } from "react-native";
import { ScheduleItem } from "../../types";

interface ScheduleTimelineProps {
  currentIndex: number;
  schedule: ScheduleItem[];
  onSelectTask: (index: number) => void;
}

export function ScheduleTimeline({
  currentIndex,
  schedule,
  onSelectTask,
}: ScheduleTimelineProps) {
  return (
    <View className="mb-8">
      <Text className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
        Daily Schedule
      </Text>

      <View className="border-l-2 border-slate-200 ml-3.5 pl-5 gap-y-6">
        {schedule.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectTask(index)}
              className="relative"
            >
              <View
                className={`absolute -left-[29px] top-1.5 rounded-full border-2 items-center justify-center ${
                  isCurrent
                    ? "bg-brand-indigo border-brand-indigo"
                    : isPast
                    ? "bg-slate-300 border-slate-300"
                    : "bg-white border-slate-300"
                }`}
                style={{ width: 16, height: 16 }}
              >
                {isPast && (
                  <Text className="text-[8px] text-slate-700 font-bold leading-none">OK</Text>
                )}
              </View>

              <View
                className={`p-4 rounded-xl border ${
                  isCurrent
                    ? "bg-brand-indigo/10 border-brand-indigo/50"
                    : "bg-white border-slate-200"
                }`}
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text
                    className={`text-xs font-bold ${
                      isCurrent ? "text-brand-indigo" : "text-slate-500"
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
                    isCurrent
                      ? "text-slate-950"
                      : isPast
                      ? "text-slate-400 line-through"
                      : "text-slate-700"
                  }`}
                >
                  {item.taskName}
                </Text>
                {!!item.reason && (
                  <Text className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {item.reason}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
