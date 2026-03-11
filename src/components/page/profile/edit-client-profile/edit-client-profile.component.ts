import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { I18nService } from '../../../../services/i18n.service';
import { LanguagesSelectorComponent } from '../../../shared/languages-selector/languages-selector.component';
import { isBackendEnabled } from '../../../../config/backend.config';
import { UsersApiService } from '../../../../services/users-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-client-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LanguagesSelectorComponent],
  templateUrl: './edit-client-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditClientProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly firestore = inject(Firestore);
  private readonly usersApi = inject(UsersApiService);
  i18nService = inject(I18nService);

  isLoading = signal(false);

  profileForm = new FormGroup({
    fullName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl<string>('', { nonNullable: true }),
    languages: new FormControl<string[]>([], { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20), Validators.maxLength(500)],
    }),
  });

  ngOnInit(): void {
    window.scrollTo(0, 0);

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const currentLang = this.i18nService.currentLang() || 'es';
    const initialLanguages =
      (currentUser.languages && currentUser.languages.length > 0)
        ? currentUser.languages
        : [currentUser.spokenLanguage || currentLang];

    this.profileForm.patchValue({
      fullName: currentUser.fullName || '',
      phone: currentUser.phone === null || currentUser.phone === undefined ? '' : String(currentUser.phone),
      languages: initialLanguages,
      description: currentUser.description || '',
    });
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.error($localize`:@@toast.common.requiredFields:Por favor, completa los campos requeridos`);
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.toastService.error($localize`:@@toast.common.userNotFoundGeneric:No se encontró el usuario`);
      return;
    }

    this.isLoading.set(true);

    try {
      const formValue = this.profileForm.getRawValue();

      const spokenLanguage = formValue.languages?.[0] || this.i18nService.currentLang() || 'es';

      const trimmedPhone = (formValue.phone || '').trim();

      if (isBackendEnabled()) {
        const updated = await firstValueFrom(
          this.usersApi.upsertMe({
            fullName: formValue.fullName,
            phone: trimmedPhone || null,
            languages: formValue.languages,
            spokenLanguage,
            description: formValue.description,
          })
        );

        this.authService.currentUser.set(updated);
        this.authService.currentUserRole.set(updated.role);
      } else {
        const userRef = doc(this.firestore, 'users', currentUser.uid);
        await updateDoc(userRef, {
          fullName: formValue.fullName,
          phone: trimmedPhone || null,
          languages: formValue.languages,
          spokenLanguage,
          description: formValue.description,
          updatedAt: new Date(),
        });

        this.authService.currentUser.set({
          ...currentUser,
          fullName: formValue.fullName,
          phone: trimmedPhone || undefined,
          languages: formValue.languages,
          spokenLanguage,
          description: formValue.description,
        });
      }

      this.toastService.success($localize`:@@toast.profile.updateSuccess:Perfil actualizado correctamente`);
      this.router.navigate(['/app/profile']);
    } catch (error) {
      console.error('Error updating client profile:', error);
      this.toastService.error($localize`:@@toast.profile.updateError:Error al actualizar el perfil`);
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/app/profile']);
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/app/change-password']);
  }
}
