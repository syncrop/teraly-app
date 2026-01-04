---
name: 🟡 SECURITY-005 - Validación de Contraseñas Débil
about: Solo se valida longitud mínima, sin requisitos de complejidad
title: '[SECURITY-005] Mejorar validación de contraseñas'
labels: 'security, medium-priority, enhancement'
assignees: ''
---

## 🟡 Severidad: MEDIA

## Descripción del Problema

Solo se valida longitud mínima de contraseña (8 caracteres), sin requisitos de complejidad. Esto permite contraseñas débiles como "12345678" o "aaaaaaaa".

**Ubicación:** `src/components/auth/register/register.component.ts` - Línea 45

## Código Actual

```typescript
password: new FormControl('', [Validators.required, Validators.minLength(8)])
```

## Riesgos

1. **Contraseñas débiles permitidas**
2. **Vulnerable a ataques de diccionario**
3. **Fuerza bruta facilitada**
4. **No protege contra contraseñas comunes**

## Solución: Validador de Contraseñas Fuertes

```typescript
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const isLongEnough = value.length >= 8;
    
    const passwordValid = hasUpperCase && hasLowerCase && 
                         hasNumeric && hasSpecialChar && isLongEnough;
    
    if (!passwordValid) {
      return {
        strongPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar,
          isLongEnough
        }
      };
    }
    
    // Verificar contra lista de contraseñas comunes
    const commonPasswords = ['12345678', 'password', 'qwerty123'];
    if (commonPasswords.includes(value.toLowerCase())) {
      return { commonPassword: true };
    }
    
    return null;
  };
}
```

## Uso

```typescript
password: new FormControl('', [
  Validators.required, 
  Validators.minLength(8),
  strongPasswordValidator()
])
```

## Feedback Visual en Template

```html
@if (form.get('password')?.hasError('strongPassword') && form.get('password')?.touched) {
  <div class="text-xs text-red-500 mt-1">
    <p class="font-medium">La contraseña debe contener:</p>
    <ul class="list-disc list-inside">
      <li [class.text-green-500]="errors.isLongEnough">Al menos 8 caracteres</li>
      <li [class.text-green-500]="errors.hasUpperCase">Una letra mayúscula</li>
      <li [class.text-green-500]="errors.hasLowerCase">Una letra minúscula</li>
      <li [class.text-green-500]="errors.hasNumeric">Un número</li>
      <li [class.text-green-500]="errors.hasSpecialChar">Un carácter especial</li>
    </ul>
  </div>
}
```

## Pasos de Implementación

- [ ] Crear `strongPasswordValidator()` function
- [ ] Agregar validación al form de registro
- [ ] Implementar feedback visual
- [ ] Agregar lista de contraseñas comunes
- [ ] Validar también en Firebase Functions (server-side)
- [ ] Tests unitarios
- [ ] Documentar requisitos de contraseña

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 2-3 días

Ver `SECURITY_ANALYSIS.md` - Sección 6
