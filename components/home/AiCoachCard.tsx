import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { homeStyles } from "../../styles/homeStyles";

interface AiCoachCardProps {
  aiTip: string;
  loadingAi: boolean;
  canAskCoach: boolean;
  onGetAiTip: () => void;
}

export function AiCoachCard({
  aiTip,
  loadingAi,
  canAskCoach,
  onGetAiTip,
}: AiCoachCardProps) {
  return (
    <View className={homeStyles.sectionCard}>
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-sm font-bold text-slate-950">AI Coach Insights</Text>
          <Text className="text-[10px] text-brand-indigo font-medium">Powered by Gemini</Text>
        </View>
        <TouchableOpacity
          onPress={onGetAiTip}
          disabled={loadingAi || !canAskCoach}
          className="bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800"
        >
          {loadingAi ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-xs font-semibold text-white">Ask Coach</Text>
          )}
        </TouchableOpacity>
      </View>

      {aiTip ? (
        <View className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <Text className="text-xs text-slate-700 leading-relaxed italic">
            "{aiTip}"
          </Text>
        </View>
      ) : (
        <Text className="text-xs text-slate-500 italic">
          Tap "Ask Coach" to fetch custom focus strategies and hear voice suggestions.
        </Text>
      )}
    </View>
  );
}
