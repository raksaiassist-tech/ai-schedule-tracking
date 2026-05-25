import * as Speech from "expo-speech";
import { useState, useCallback } from "react";

export function useVoiceCoach() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  /**
   * Speak arbitrary text if voice coaching is enabled.
   */
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled) return;
    setIsSpeaking(true);
    
    // Stop any current voice announcement to avoid overlapping speech
    Speech.stop();
    
    Speech.speak(text, {
      pitch: 1.0,
      rate: 0.95, // Slightly slower rate makes synthesized voice clearer and more coach-like
      onDone: () => setIsSpeaking(false),
      onError: (err) => {
        console.error("Speech error:", err);
        setIsSpeaking(false);
      },
    });
  }, [voiceEnabled]);

  /**
   * Warning announcement when a task is nearing completion.
   */
  const speakWarning = useCallback((taskName: string, timeRemainingSeconds: number) => {
    const minutesRemaining = Math.round(timeRemainingSeconds / 60);
    const msg = `Just five minutes remaining for ${taskName}. Start wrapping things up.`;
    speakText(msg);
  }, [speakText]);

  /**
   * Transition announcement when moving to a new task.
   */
  const speakTransition = useCallback((prevTaskName: string | null, nextTaskName: string) => {
    let msg = "";
    if (prevTaskName) {
      msg = `Time's up for ${prevTaskName}. Now transitioning to ${nextTaskName}. Let's stay focused.`;
    } else {
      msg = `Let's begin your schedule. Your current task is ${nextTaskName}.`;
    }
    speakText(msg);
  }, [speakText]);

  /**
   * Instantly stops any active voice coaching speech.
   */
  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speakText,
    speakWarning,
    speakTransition,
    stopSpeaking,
  };
}
export type UseVoiceCoachReturn = ReturnType<typeof useVoiceCoach>;
