---
name: 🟡 SECURITY-003 - Falta de Sanitización de Datos en Templates
about: Datos de usuario interpolados sin validación/sanitización explícita
title: '[SECURITY-003] Implementar sanitización de datos en templates'
labels: 'security, medium-priority, enhancement'
assignees: ''
---

## 🟡 Severidad: MEDIA

## Descripción del Problema

Los datos de usuario se están interpolando directamente en templates sin sanitización o validación explícita previa. Aunque Angular sanitiza automáticamente las interpolaciones `{{ }}`, no hay validación en la entrada de datos.

**Ubicaciones afectadas:**
- `src/components/page/search/search.component.html` - Líneas 109, 110, 117, 122-123, 144-145, 159-161
- `src/components/auth/forgot-password/forgot-password.component.html` - Línea 48
- `src/components/auth/login/login.component.html` - Línea 30
- `src/components/auth/register/register.component.html` - Línea 74

## Código Potencialmente Vulnerable

```html
<!-- search.component.html -->
<h3>{{ doctor.name }}</h3>
<p>{{ doctor.specialty }}</p>

<!-- forgot-password.component.html -->
<p>If an account for {{ forgotPasswordForm.value.email }} exists...</p>

<!-- login/register.component.html -->
<p>{{ errorMessage() }}</p>
```

## Riesgos

1. **XSS potencial** si datos provienen de fuentes no confiables
2. **Mensajes de error** del servidor pueden contener texto sin sanitizar
3. **Datos de BD** (nombres de doctores) no validados en ingreso
4. **Formularios** sin validación pueden contener scripts

## Solución Propuesta

### 1. Crear Pipe de Sanitización

```typescript
@Pipe({ name: 'sanitizeText', standalone: true })
export class SanitizeTextPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
```

### 2. Validar Datos en Servicios

```typescript
export class DataValidationService {
  validateUserInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
}
```

### 3. Implementar Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://apis.google.com">
```

## Pasos de Implementación

- [ ] Crear `SanitizeTextPipe` para templates
- [ ] Crear `DataValidationService` para validación de entrada
- [ ] Aplicar pipe a datos de usuario no confiables
- [ ] Validar datos antes de almacenar en Firestore
- [ ] Implementar Content Security Policy
- [ ] Agregar tests de sanitización
- [ ] Documentar mejores prácticas

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 3-4 días  
**Bloqueante:** NO

Ver `SECURITY_ANALYSIS.md` - Sección 3 para detalles completos
