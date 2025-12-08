import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Mood, MoodQuestion, MoodEntry } from '../../../models/mood.model';
import { MOOD_OPTIONS, MOOD_QUESTIONS } from '../../../config/mood.config';

@Component({
  selector: 'app-moods',
  templateUrl: './moods.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class MoodsComponent {

  selectedMood = signal<string | null>('bien');
  showQuestions = signal(false);
  moodResponses = signal<{ [key: string]: string | number }>({});

  moods: Mood[] = MOOD_OPTIONS;
  moodQuestions: MoodQuestion[] = MOOD_QUESTIONS;

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

  getResponse(questionId: string): string | number {
    return this.moodResponses()[questionId] ?? '';
  }

  getCurrentMood() {
    return this.moods.find(m => m.id === this.selectedMood());
  }

  saveMoodEntry() {
    const entry: MoodEntry = {
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
}
