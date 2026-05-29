import { Text, View } from "react-native";

interface HeaderProps {
  isSpeaking: boolean;
}

export function Header({ isSpeaking }: HeaderProps) {
  return (
    <View className="flex-row justify-between items-center mb-6">
      <View>
        <Text className="text-2xl font-bold text-slate-950 tracking-wide">
          Antigravity Coach
        </Text>
        <Text className="text-xs text-slate-500 font-medium mt-0.5">
          Voice-Guided Productivity
        </Text>
      </View>
      <View className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-slate-200">
        <View
          className={`w-2 h-2 rounded-full mr-2 ${
            isSpeaking ? "bg-brand-emerald" : "bg-slate-500"
          }`}
        />
        <Text className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          {isSpeaking ? "Coaching" : "Idle"}
        </Text>
      </View>
    </View>
  );
}
