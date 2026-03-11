import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface LanguageOption {
  code: string;
  flag: string;
  name: string;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
  { code: 'uk', flag: '🇺🇦', name: 'Українська' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
];

@Component({
  selector: 'app-languages-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './languages-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LanguagesSelectorComponent),
      multi: true,
    },
  ],
})
export class LanguagesSelectorComponent implements ControlValueAccessor {
  readonly mode = input<'dropdown' | 'list'>('dropdown');
  readonly placeholder = input<string>('Selecciona idiomas');
  readonly availableLanguages = input<LanguageOption[]>(DEFAULT_LANGUAGES);

  readonly showDropdown = signal(false);

  private readonly selectedCodes = signal<string[]>([]);
  private isDisabled = false;

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    this.selectedCodes.set(Array.isArray(value) ? value : []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (isDisabled) this.showDropdown.set(false);
  }

  toggleDropdown(): void {
    if (this.isDisabled) return;
    this.onTouched();
    this.showDropdown.update((v) => !v);
  }

  openDropdown(): void {
    if (this.isDisabled) return;
    this.onTouched();
    this.showDropdown.set(true);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  isSelected(code: string): boolean {
    return this.selectedCodes().includes(code);
  }

  toggleLanguage(code: string): void {
    if (this.isDisabled) return;

    const current = this.selectedCodes();
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];

    this.selectedCodes.set(next);
    this.onTouched();
    this.onChange(next);
  }

  getDisplayText(): string {
    const selected = this.selectedCodes();
    if (selected.length === 0) return this.placeholder();

    const options = this.availableLanguages();
    return options
      .filter((opt) => selected.includes(opt.code))
      .map((opt) => `${opt.flag} ${opt.name}`)
      .join(', ');
  }

  hasSelection(): boolean {
    return this.selectedCodes().length > 0;
  }

  isDisabledState(): boolean {
    return this.isDisabled;
  }
}
