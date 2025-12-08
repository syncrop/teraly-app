import { ChangeDetectionStrategy, Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interfaz que representa un estado de ánimo.
 * @interface Mood
 * @property {string} id - Identificador único del estado de ánimo
 * @property {string} emoji - Emoji que representa el estado
 * @property {string} label - Etiqueta descriptiva del estado
 */
interface Mood {
  id: string;
  emoji: string;
  label: string;
}

/**
 * Componente para registrar y hacer seguimiento del estado de ánimo del usuario.
 * Permite seleccionar un estado de ánimo y responder preguntas adicionales sobre
 * sueño, energía, estrés y ansiedad.
 * 
 * @selector app-moods
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-moods></app-moods>
 * ```
 * 
 * @example
 * ```typescript
 * // En un componente padre
 * import { MoodsComponent } from './components/shared/moods/moods.component';
 * 
 * @Component({
 *   imports: [MoodsComponent],
 *   template: `
 *     <div class="mood-tracker">
 *       <h2>¿Cómo te sientes hoy?</h2>
 *       <app-moods></app-moods>
 *     </div>
 *   `
 * })
 * export class DashboardComponent {}
 * ```
 */
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

  /**
   * Maneja la selección de un estado de ánimo y muestra el cuestionario.
   * 
   * @param {string} moodId - ID del estado de ánimo seleccionado
   * @returns {void}
   * 
   * @example
   * ```typescript
   * this.onMoodSelect('bien'); // Selecciona el estado 'bien'
   * ```
   */
  onMoodSelect(moodId: string) {
    this.selectedMood.set(moodId);
    this.showQuestions.set(true);
  }

  /**
   * Actualiza la respuesta de una pregunta del cuestionario.
   * 
   * @param {string} questionId - ID de la pregunta
   * @param {string | number} value - Valor de la respuesta
   * @returns {void}
   * 
   * @example
   * ```typescript
   * this.updateResponse('sleep', 8); // Califica el sueño con 8
   * this.updateResponse('notes', 'Me sentí bien hoy'); // Añade notas
   * ```
   */
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

  /**
   * Obtiene la respuesta actual de una pregunta.
   * 
   * @param {string} questionId - ID de la pregunta
   * @returns {string | number} Respuesta de la pregunta o cadena vacía si no existe
   * 
   * @example
   * ```typescript
   * const sleepValue = this.getResponse('sleep'); // Obtiene la calificación del sueño
   * ```
   */
  getResponse(questionId: string): string | number {
    return this.moodResponses()[questionId] ?? '';
  }

  /**
   * Obtiene el objeto del estado de ánimo actualmente seleccionado.
   * 
   * @returns {Mood | undefined} Estado de ánimo seleccionado o undefined
   * 
   * @example
   * ```typescript
   * const mood = this.getCurrentMood();
   * console.log(`Estado actual: ${mood?.emoji} ${mood?.label}`);
   * ```
   */
  getCurrentMood() {
    return this.moods.find(m => m.id === this.selectedMood());
  }

  /**
   * Guarda la entrada de estado de ánimo con todas las respuestas.
   * TODO: Implementar envío al servidor/base de datos.
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * this.saveMoodEntry();
   * // Guarda: { mood: 'bien', responses: {...}, timestamp: Date }
   * ```
   */
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

  /**
   * Cierra el cuestionario y limpia las respuestas.
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * this.closeQuestions(); // Oculta el cuestionario y resetea respuestas
   * ```
   */
  closeQuestions() {
    this.showQuestions.set(false);
    this.moodResponses.set({});
  }
}
