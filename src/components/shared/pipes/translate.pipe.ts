import { Pipe, PipeTransform, inject, effect, signal } from '@angular/core';
import { TranslationService } from '../../../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Important: allows pipe to react to signal changes
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  private lastValue = signal<string>('');

  constructor() {
    // React to translation changes
    effect(() => {
      // Access translations to trigger reactivity
      this.translationService.allTranslations();
    });
  }

  transform(key: string, defaultValue: string = ''): string {
    const value = this.translationService.getTranslation(key, defaultValue);
    this.lastValue.set(value);
    return value;
  }
}
