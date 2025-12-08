import { Mood, MoodQuestion } from '../models/mood.model';

/**
 * Configuration for available mood options
 */
export const MOOD_OPTIONS: Mood[] = [
  { id: 'mal', emoji: '😔', label: 'Mal' },
  { id: 'regular', emoji: '😐', label: 'Regular' },
  { id: 'bien', emoji: '🙂', label: 'Bien' },
  { id: 'genial', emoji: '😄', label: 'Genial' }
];

/**
 * Configuration for mood assessment questions
 */
export const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    id: 'sleep',
    label: '¿Cómo fue tu sueño?',
    type: 'range',
    min: 1,
    max: 10,
    minLabel: 'Muy malo',
    maxLabel: 'Excelente'
  },
  {
    id: 'energy',
    label: '¿Cuál es tu nivel de energía?',
    type: 'range',
    min: 1,
    max: 10,
    minLabel: 'Muy bajo',
    maxLabel: 'Muy alto'
  },
  {
    id: 'stress',
    label: '¿Cuál es tu nivel de estrés?',
    type: 'range',
    min: 1,
    max: 10,
    minLabel: 'Sin estrés',
    maxLabel: 'Muy estresado'
  },
  {
    id: 'anxiety',
    label: '¿Cómo es tu ansiedad?',
    type: 'range',
    min: 1,
    max: 10,
    minLabel: 'Sin ansiedad',
    maxLabel: 'Muy ansiedad'
  },
  {
    id: 'notes',
    label: 'Notas adicionales',
    type: 'text',
    placeholder: 'Cuéntanos algo más sobre tu estado emocional...'
  }
];
