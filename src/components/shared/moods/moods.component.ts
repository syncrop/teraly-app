import { ChangeDetectionStrategy, Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Mood {
  id: string;
  emoji: string;
  label: string;
}

@Component({
  selector: 'app-moods',
  templateUrl: './moods.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class MoodsComponent implements OnInit {

  selectedMood = signal<string | null>('bien');
  showQuestions = signal(false);
  moodResponses = signal<{ [key: string]: string | number }>({});

  moods: Mood[] = [
    { id: 'mal', emoji: '😔', label: '' },
    { id: 'regular', emoji: '😐', label: '' },
    { id: 'bien', emoji: '🙂', label: '' },
    { id: 'genial', emoji: '😄', label: '' }
  ];

  moodQuestions: any[] = [
    {
      id: 'sleep',
      label: '',
      type: 'range',
      min: 1,
      max: 10,
      minLabel: 'Muy malo',
      maxLabel: 'Excelente'
    },
    {
      id: 'energy',
      label: '',
      type: 'range',
      min: 1,
      max: 10,
      minLabel: 'Muy bajo',
      maxLabel: 'Muy alto'
    },
    {
      id: 'stress',
      label: '',
      type: 'range',
      min: 1,
      max: 10,
      minLabel: 'Sin estrés',
      maxLabel: 'Muy estresado'
    },
    {
      id: 'anxiety',
      label: '',
      type: 'range',
      min: 1,
      max: 10,
      minLabel: 'Sin ansiedad',
      maxLabel: 'Muy ansiedad'
    },
    {
      id: 'notes',
      label: '',
      type: 'text',
      placeholder: ''
    }
  ];

  onMoodSelect(moodId: string) {
    this.selectedMood.set(moodId);
    this.showQuestions.set(true);
  }

  updateResponse(questionId: string, value: string | number) {
    this.moodResponses.update(responses => ({
      ...responses,
      [questionId]: value
    }));
  }

  ngOnInit(): void {
    // Initialize moods with empty labels
    // Labels will be set from template using i18n
    this.moods = [
      { id: 'mal', emoji: '😔', label: 'Mal' },
      { id: 'regular', emoji: '😐', label: 'Regular' },
      { id: 'bien', emoji: '🙂', label: 'Bien' },
      { id: 'genial', emoji: '😄', label: 'Genial' }
    ];

    // Initialize questions with Spanish labels
    // These will be translated via i18n attributes in templates
    this.moodQuestions = [
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
  }

  getResponse(questionId: string): string | number {
    return this.moodResponses()[questionId] ?? '';
  }

  getCurrentMood() {
    return this.moods.find(m => m.id === this.selectedMood());
  }

  saveMoodEntry() {
    const entry = {
      mood: this.selectedMood(),
      responses: this.moodResponses(),
      timestamp: new Date()
    };
    console.log('Mood entry saved:', entry);
    // TODO: Enviar al servidor
    this.closeQuestions();
  }

  closeQuestions() {
    this.showQuestions.set(false);
    this.moodResponses.set({});
  }

  trackByMoodId = (_: number, mood: Mood): string => mood.id;

  trackByQuestionId = (_: number, question: { id: string }): string => question.id;
}
