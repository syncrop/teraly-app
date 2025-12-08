/**
 * Represents a mood option
 */
export interface Mood {
  id: string;
  emoji: string;
  label: string;
}

/**
 * Represents a mood question
 */
export interface MoodQuestion {
  id: string;
  label: string;
  type: 'range' | 'text';
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
}

/**
 * Represents a mood entry saved by the user
 */
export interface MoodEntry {
  mood: string | null;
  responses: { [key: string]: string | number };
  timestamp: Date;
}
