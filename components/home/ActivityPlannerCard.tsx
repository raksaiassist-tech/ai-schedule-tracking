import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { homeStyles } from "../../styles/homeStyles";

interface ActivityPlannerCardProps {
  activityInput: string;
  isPlanning: boolean;
  planOverview: string;
  recommendations: string[];
  onActivityInputChange: (value: string) => void;
  onPlanDay: () => void;
}

export function ActivityPlannerCard({
  activityInput,
  isPlanning,
  planOverview,
  recommendations,
  onActivityInputChange,
  onPlanDay,
}: ActivityPlannerCardProps) {
  return (
    <View className={homeStyles.sectionCard}>
      <View className="mb-3">
        <Text className="text-sm font-bold text-slate-950">Plan From Voice</Text>
        <Text className="text-xs text-slate-500 mt-1">
          Tap the box, use your keyboard mic to dictate activities, then let AI arrange the day.
        </Text>
      </View>

      <TextInput
        value={activityInput}
        onChangeText={onActivityInputChange}
        multiline
        textAlignVertical="top"
        placeholder="Example: gym, project work, groceries, call mom, study React Native..."
        placeholderTextColor="#94a3b8"
        className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 leading-relaxed"
      />

      {!!planOverview && (
        <Text className="text-xs text-slate-600 mt-3 leading-relaxed">{planOverview}</Text>
      )}

      {recommendations.length > 0 && (
        <View className="mt-3 rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
          <Text className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest mb-2">
            Recommendations
          </Text>
          {recommendations.map((recommendation) => (
            <Text key={recommendation} className="text-xs text-slate-700 leading-relaxed mb-1">
              - {recommendation}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={onPlanDay}
        disabled={isPlanning || !activityInput.trim()}
        className={`mt-4 rounded-xl px-4 py-3 items-center ${
          isPlanning || !activityInput.trim() ? "bg-slate-300" : "bg-brand-indigo"
        }`}
      >
        {isPlanning ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-sm font-bold text-white">Think & Plan My Day</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
