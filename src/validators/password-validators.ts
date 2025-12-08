import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Validator to check if two password fields match
 * @param controlName The name of the password control
 * @param matchingControlName The name of the confirm password control
 * @returns ValidatorFn
 */
export function passwordMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl) => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);
    
    if (matchingControl?.errors && !matchingControl.errors?.['passwordMismatch']) {
      return null;
    }
    
    if (control?.value !== matchingControl?.value) {
      matchingControl?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      matchingControl?.setErrors(null);
      return null;
    }
  };
}
