import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { LanguagesSelectorComponent } from '../../../shared/languages-selector/languages-selector.component';
import { isBackendEnabled } from '../../../../config/backend.config';
import { UsersApiService } from '../../../../services/users-api.service';
import { firstValueFrom } from 'rxjs';

interface Specialty {
  id: string;
  name: string;
}

@Component({
  selector: 'app-edit-doctor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LanguagesSelectorComponent],
  templateUrl: './edit-doctor-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDoctorProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private firestore = inject(Firestore);
  private readonly usersApi = inject(UsersApiService);

  isLoading = signal(false);
  showSpecialtiesDropdown = signal(false);

  availableSpecialties: Specialty[] = [
    { id: 'ansiedad', name: 'Ansiedad' },
    { id: 'depresion', name: 'Depresión' },
    { id: 'autoestima', name: 'Autoestima' },
    { id: 'burnout', name: 'Burnout' },
    { id: 'estres', name: 'Estrés' },
    { id: 'pareja', name: 'Terapia de Pareja' },
    { id: 'duelo', name: 'Duelo' },
    { id: 'trauma', name: 'Trauma' },
    { id: 'familiar', name: 'Terapia Familiar' },
    { id: 'adicciones', name: 'Adicciones' }
  ];

  profileForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    licenseNumber: new FormControl('', Validators.required),
    specialty: new FormControl('', Validators.required),
    description: new FormControl('', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]),
    languages: new FormControl<string[]>([], Validators.required),
    specialties: new FormControl<string[]>([], Validators.required),
    currency: new FormControl<string>('EUR', Validators.required),
    price: new FormControl<number>(50, [Validators.required, Validators.min(1)]),
    sessionDuration: new FormControl<number>(50, Validators.required),
    experience: new FormControl<number>(1, [Validators.required, Validators.min(0)])
  });

  ngOnInit() {
    window.scrollTo(0, 0);
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.profileForm.patchValue({
        fullName: currentUser.fullName || '',
        licenseNumber: currentUser.licenseNumber || '',
        specialty: currentUser.specialty || '',
        description: (currentUser as any).description || '',
        languages: currentUser.languages || [],
        specialties: (currentUser as any).specialties || [],
        currency: (currentUser as any).currency || 'EUR',
        price: (currentUser as any).price || 50,
        sessionDuration: (currentUser as any).sessionDuration || 50,
        experience: (currentUser as any).experience || 1
      });
    }
  }

  toggleSpecialtiesDropdown() {
    this.showSpecialtiesDropdown.update(val => !val);
  }

  toggleSpecialty(specialtyId: string) {
    const currentSpecialties = this.profileForm.get('specialties')?.value || [];
    const index = currentSpecialties.indexOf(specialtyId);
    
    if (index > -1) {
      const newSpecialties = currentSpecialties.filter(id => id !== specialtyId);
      this.profileForm.get('specialties')?.setValue(newSpecialties);
    } else {
      this.profileForm.get('specialties')?.setValue([...currentSpecialties, specialtyId]);
    }
  }

  isSpecialtySelected(specialtyId: string): boolean {
    const currentSpecialties = this.profileForm.get('specialties')?.value || [];
    return currentSpecialties.includes(specialtyId);
  }

  getSelectedSpecialtiesDisplay(): string {
    const currentSpecialties = this.profileForm.get('specialties')?.value || [];
    if (currentSpecialties.length === 0) return 'Selecciona especialidades';
    
    const selectedSpecs = this.availableSpecialties
      .filter(spec => currentSpecialties.includes(spec.id))
      .map(spec => spec.name);
    
    return selectedSpecs.join(', ');
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.error($localize`:@@toast.common.requiredAllFields:Por favor, completa todos los campos requeridos`);
      return;
    }

    this.isLoading.set(true);

    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        this.toastService.error($localize`:@@toast.common.userNotFoundGeneric:No se encontró el usuario`);
        return;
      }

      const formValue = this.profileForm.getRawValue();

      if (isBackendEnabled()) {
        const updated = await firstValueFrom(
          this.usersApi.upsertMe({
            fullName: formValue.fullName,
            licenseNumber: formValue.licenseNumber,
            specialty: formValue.specialty,
            description: formValue.description,
            languages: formValue.languages,
            specialties: formValue.specialties,
            currency: formValue.currency,
            price: formValue.price,
            sessionDuration: formValue.sessionDuration,
            experience: formValue.experience,
            completed: true,
          })
        );

        this.authService.currentUser.set(updated);
        this.authService.currentUserRole.set(updated.role);
      } else {
        const userRef = doc(this.firestore, 'users', currentUser.uid);

        await updateDoc(userRef, {
          fullName: formValue.fullName,
          licenseNumber: formValue.licenseNumber,
          specialty: formValue.specialty,
          description: formValue.description,
          languages: formValue.languages,
          specialties: formValue.specialties,
          currency: formValue.currency,
          price: formValue.price,
          sessionDuration: formValue.sessionDuration,
          experience: formValue.experience,
          completed: true,
          updatedAt: new Date(),
        });

        this.authService.currentUser.set({
          ...currentUser,
          fullName: formValue.fullName,
          licenseNumber: formValue.licenseNumber,
          specialty: formValue.specialty,
          description: formValue.description,
          languages: formValue.languages,
          specialties: formValue.specialties,
          currency: formValue.currency,
          price: formValue.price,
          sessionDuration: formValue.sessionDuration,
          experience: formValue.experience,
          completed: true,
        });
      }

      this.toastService.success($localize`:@@toast.profile.updateSuccess:Perfil actualizado correctamente`);
      this.router.navigate(['/app/profile']);
    } catch (error) {
      console.error('Error updating profile:', error);
      this.toastService.error($localize`:@@toast.profile.updateError:Error al actualizar el perfil`);
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/app/profile']);
  }
}
