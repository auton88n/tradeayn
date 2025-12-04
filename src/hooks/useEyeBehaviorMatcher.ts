// Eye Behavior Matcher
// Matches current context against pre-generated behavior library

import { useState, useEffect, useCallback, useRef } from 'react';
import { EyeContext, EyeBehavior, BehaviorTrigger, MatchedBehavior, BehaviorConfig } from '@/types/eyeBehavior.types';
import { eyeBehaviorLibrary, behaviorsByPriority } from '@/lib/eyeBehaviorLibrary';

interface UseEyeBehaviorMatcherProps {
  context: EyeContext;
  enabled?: boolean;
}

// Check if a value is within a range
const inRange = (value: number, range?: { min?: number; max?: number }): boolean => {
  if (!range) return true;
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
};

// Check if a value is in an array
const inArray = <T>(value: T, arr?: T[]): boolean => {
  if (!arr || arr.length === 0) return true;
  return arr.includes(value);
};

// Calculate how well a context matches a trigger (0-100)
const calculateMatchScore = (context: EyeContext, triggers: BehaviorTrigger): number => {
  let totalChecks = 0;
  let passedChecks = 0;
  let bonusScore = 0;
  
  // Check typing conditions
  if (triggers.typingSpeed) {
    totalChecks++;
    if (inRange(context.typingSpeed, triggers.typingSpeed)) {
      passedChecks++;
      bonusScore += Math.min(10, context.typingSpeed); // Bonus for higher typing speed match
    }
  }
  
  if (triggers.typingPauseDuration) {
    totalChecks++;
    if (inRange(context.typingPauseDuration, triggers.typingPauseDuration)) passedChecks++;
  }
  
  if (triggers.deletionCount) {
    totalChecks++;
    if (inRange(context.deletionCount, triggers.deletionCount)) {
      passedChecks++;
      bonusScore += Math.min(5, context.deletionCount);
    }
  }
  
  // Check mouse conditions
  if (triggers.mouseDistanceFromEye) {
    totalChecks++;
    if (inRange(context.mouseDistanceFromEye, triggers.mouseDistanceFromEye)) passedChecks++;
  }
  
  if (triggers.mouseVelocity) {
    totalChecks++;
    if (inRange(context.mouseVelocity, triggers.mouseVelocity)) passedChecks++;
  }
  
  if (triggers.isMouseIdle !== undefined) {
    totalChecks++;
    if (context.isMouseIdle === triggers.isMouseIdle) passedChecks++;
  }
  
  // Check state conditions
  if (triggers.idleDuration) {
    totalChecks++;
    if (inRange(context.idleDuration, triggers.idleDuration)) passedChecks++;
  }
  
  if (triggers.currentMode) {
    totalChecks++;
    if (inArray(context.currentMode, triggers.currentMode)) passedChecks++;
  }
  
  if (triggers.lastAction) {
    totalChecks++;
    if (inArray(context.lastAction, triggers.lastAction)) {
      passedChecks++;
      bonusScore += 15; // Higher weight for action matches
    }
  }
  
  if (triggers.timeSinceLastAction) {
    totalChecks++;
    if (inRange(context.timeSinceLastAction, triggers.timeSinceLastAction)) passedChecks++;
  }
  
  // Check conversation conditions
  if (triggers.messageCount) {
    totalChecks++;
    if (inRange(context.messageCount, triggers.messageCount)) passedChecks++;
  }
  
  if (triggers.hasActiveResponse !== undefined) {
    totalChecks++;
    if (context.hasActiveResponse === triggers.hasActiveResponse) passedChecks++;
  }
  
  if (triggers.isWaitingForResponse !== undefined) {
    totalChecks++;
    if (context.isWaitingForResponse === triggers.isWaitingForResponse) passedChecks++;
  }
  
  // If no triggers defined, it's the default behavior
  if (totalChecks === 0) return 10; // Low score for default
  
  // All triggers must pass for a match
  if (passedChecks < totalChecks) return 0;
  
  // Base score + bonus, capped at 100
  return Math.min(100, (passedChecks / totalChecks) * 80 + bonusScore);
};

export const useEyeBehaviorMatcher = ({ context, enabled = true }: UseEyeBehaviorMatcherProps) => {
  const [currentBehavior, setCurrentBehavior] = useState<MatchedBehavior | null>(null);
  const cooldownsRef = useRef<Map<string, number>>(new Map());
  const behaviorStartRef = useRef<number>(0);

  // Find best matching behavior
  const findBestMatch = useCallback((): MatchedBehavior | null => {
    if (!enabled) return null;
    
    const now = Date.now();
    let bestMatch: { behavior: EyeBehavior; score: number } | null = null;
    
    // Check behaviors in priority order
    for (const behavior of behaviorsByPriority) {
      // Skip if on cooldown
      const cooldownEnd = cooldownsRef.current.get(behavior.id);
      if (cooldownEnd && now < cooldownEnd) continue;
      
      const score = calculateMatchScore(context, behavior.triggers);
      
      if (score > 0) {
        // Consider priority in selection
        const adjustedScore = score + behavior.priority * 5;
        
        if (!bestMatch || adjustedScore > bestMatch.score + bestMatch.behavior.priority * 5) {
          bestMatch = { behavior, score };
        }
      }
    }
    
    if (bestMatch) {
      return {
        behavior: bestMatch.behavior,
        matchScore: bestMatch.score,
        startedAt: now,
      };
    }
    
    // Fall back to default calm behavior
    const defaultBehavior = eyeBehaviorLibrary.find(b => b.id === 'default_calm');
    if (defaultBehavior) {
      return {
        behavior: defaultBehavior,
        matchScore: 10,
        startedAt: now,
      };
    }
    
    return null;
  }, [context, enabled]);

  // Update behavior based on context changes
  useEffect(() => {
    if (!enabled) return;
    
    const now = Date.now();
    const newMatch = findBestMatch();
    
    // Check if current behavior should continue
    if (currentBehavior) {
      const elapsed = now - behaviorStartRef.current;
      const duration = currentBehavior.behavior.duration;
      
      // If behavior has a duration and it hasn't expired, keep it
      if (duration > 0 && elapsed < duration) {
        return;
      }
      
      // If new match is same behavior, don't restart
      if (newMatch && newMatch.behavior.id === currentBehavior.behavior.id) {
        return;
      }
    }
    
    // Apply new behavior
    if (newMatch && (!currentBehavior || newMatch.behavior.id !== currentBehavior.behavior.id)) {
      // Set cooldown for outgoing behavior
      if (currentBehavior && currentBehavior.behavior.cooldown > 0) {
        cooldownsRef.current.set(
          currentBehavior.behavior.id,
          now + currentBehavior.behavior.cooldown
        );
      }
      
      behaviorStartRef.current = now;
      setCurrentBehavior(newMatch);
    }
  }, [context, enabled, findBestMatch, currentBehavior]);

  // Get the current behavior config with defaults
  const getBehaviorConfig = useCallback((): BehaviorConfig | null => {
    if (!currentBehavior) return null;
    return currentBehavior.behavior.behavior;
  }, [currentBehavior]);

  return {
    currentBehavior,
    behaviorConfig: getBehaviorConfig(),
    matchScore: currentBehavior?.matchScore ?? 0,
  };
};
