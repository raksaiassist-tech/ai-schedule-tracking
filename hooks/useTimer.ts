import { useState, useEffect, useRef, useCallback } from "react";
import { ScheduleItem } from "../types";

interface UseTimerProps {
  schedule: ScheduleItem[];
  onTransition?: (prevIndex: number | null, nextIndex: number) => void;
  onWarning?: (taskName: string, timeLeft: number) => void;
}

export function useTimer({ schedule, onTransition, onWarning }: UseTimerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Track whether the warning has been announced for the current task
  const warningSpokenRef = useRef(false);

  // Cache callbacks to avoid resetting the interval if they change references
  const onTransitionRef = useRef(onTransition);
  const onWarningRef = useRef(onWarning);
  
  useEffect(() => {
    onTransitionRef.current = onTransition;
    onWarningRef.current = onWarning;
  }, [onTransition, onWarning]);

  // Sync timer when index or schedule changes
  useEffect(() => {
    if (schedule && schedule.length > 0) {
      setTimeLeft(schedule[currentIndex]?.duration || 0);
      warningSpokenRef.current = false;
    }
  }, [currentIndex, schedule]);

  const start = useCallback(() => {
    if (schedule.length > 0) {
      setIsActive(true);
    }
  }, [schedule]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setCurrentIndex(0);
    if (schedule.length > 0) {
      setTimeLeft(schedule[0].duration);
    }
    warningSpokenRef.current = false;
  }, [schedule]);

  const skip = useCallback(() => {
    if (currentIndex < schedule.length - 1) {
      const prev = currentIndex;
      const next = currentIndex + 1;
      setCurrentIndex(next);
      warningSpokenRef.current = false;
      if (onTransitionRef.current) {
        onTransitionRef.current(prev, next);
      }
    } else {
      // Completed, stop active state
      setIsActive(false);
    }
  }, [currentIndex, schedule]);

  const prevTask = useCallback(() => {
    if (currentIndex > 0) {
      const prev = currentIndex;
      const next = currentIndex - 1;
      setCurrentIndex(next);
      warningSpokenRef.current = false;
      if (onTransitionRef.current) {
        onTransitionRef.current(prev, next);
      }
    }
  }, [currentIndex]);

  const setTaskIndex = useCallback((index: number) => {
    if (index >= 0 && index < schedule.length) {
      const prev = currentIndex;
      setCurrentIndex(index);
      warningSpokenRef.current = false;
      if (onTransitionRef.current) {
        onTransitionRef.current(prev, index);
      }
    }
  }, [currentIndex, schedule]);

  // Main countdown timer interval loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && schedule.length > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const nextTime = prevTime - 1;
          const currentTask = schedule[currentIndex];

          // Check if exactly 5 minutes (300 seconds) remain.
          // We only warn if the task duration was greater than 5 minutes.
          if (nextTime === 300 && currentTask.duration > 300 && !warningSpokenRef.current) {
            warningSpokenRef.current = true;
            if (onWarningRef.current) {
              onWarningRef.current(currentTask.taskName, nextTime);
            }
          }

          if (nextTime <= 0) {
            // Task has finished
            if (currentIndex < schedule.length - 1) {
              const nextIndex = currentIndex + 1;
              // Run state update on the next microtask to avoid batching race conditions
              setTimeout(() => {
                setCurrentIndex(nextIndex);
                if (onTransitionRef.current) {
                  onTransitionRef.current(currentIndex, nextIndex);
                }
              }, 0);
              return 0;
            } else {
              // Final task finished, stop timer
              setIsActive(false);
              return 0;
            }
          }
          return nextTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, currentIndex, schedule]);

  return {
    currentIndex,
    timeLeft,
    isActive,
    start,
    stop,
    reset,
    skip,
    prevTask,
    setTaskIndex,
  };
}
export type UseTimerReturn = ReturnType<typeof useTimer>;
