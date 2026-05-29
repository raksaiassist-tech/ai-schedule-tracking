import { Switch, Text, View } from "react-native";
import { homeStyles } from "../../styles/homeStyles";

interface VoiceCoachToggleProps {
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
}

export function VoiceCoachToggle({
  voiceEnabled,
  onVoiceEnabledChange,
}: VoiceCoachToggleProps) {
  return (
    <View className={`${homeStyles.compactCard} flex-row justify-between items-center`}>
      <View className="flex-1 pr-4">
        <Text className="text-sm font-semibold text-slate-950">Voice Alerts & Coaching</Text>
        <Text className="text-xs text-slate-500 mt-1">
          Speaks notifications 5 mins before transitions and when tasks complete.
        </Text>
      </View>
      <Switch
        value={voiceEnabled}
        onValueChange={onVoiceEnabledChange}
        trackColor={{ false: "#cbd5e1", true: "#6366f1" }}
        thumbColor="#f8fafc"
      />
    </View>
  );
}
