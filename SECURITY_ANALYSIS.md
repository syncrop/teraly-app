# Análisis de Seguridad - Teraly Mental Health Platform

## Resumen Ejecutivo

Este documento presenta un análisis exhaustivo de las vulnerabilidades de seguridad encontradas en la aplicación Angular de Teraly. Se han identificado múltiples vulnerabilidades relacionadas con Cross-Site Scripting (XSS), exposición de datos sensibles, y malas prácticas de seguridad.

**Fecha del análisis:** 8 de diciembre de 2024
**Versión de Angular:** 21.0.0
**Estado general:** ⚠️ REQUIERE ATENCIÓN - Vulnerabilidades de severidad media a alta encontradas

---

## Vulnerabilidades Identificadas

### 1. 🔴 ALTA SEVERIDAD - Exposición de Datos Sensibles en Console.log

**Ubicación:**
- `src/components/auth/register/register.component.ts` (líneas 71, 87)
- `src/components/auth/login/login.component.ts` (líneas 32, 59)
- `src/components/shared/moods/moods.component.ts` (línea 159)

**Descripción:**
El código está registrando información sensible en la consola del navegador, incluyendo:
- Valores de formularios de registro (pueden contener información personal)
- Errores de autenticación con detalles técnicos
- Entradas de estado de ánimo del usuario

**Código vulnerable:**
```typescript
// register.component.ts - línea 71
Object.entries(this.registerForm.controls).forEach(([name, control]) => {
  const sub = control.valueChanges.subscribe(value => {
    console.log(`[Register] ${name} changed:`, value);  // ⚠️ VULNERABLE
  });
});

// login.component.ts - línea 59
error: (error) => {
  this.isLoading.set(false);
  this.errorMessage.set('Error al iniciar sesión. Intenta de nuevo.');
  console.error('Login error:', error);  // ⚠️ VULNERABLE
}

// moods.component.ts - línea 159
console.log('Mood entry saved:', entry);  // ⚠️ VULNERABLE - datos de salud mental
```

**Riesgo:**
- **Exposición de información personal identificable (PII)**
- **Información de salud protegida (PHI)** visible en consola
- Los logs persisten en el navegador y pueden ser accesibles mediante extensiones maliciosas
- Violación potencial de GDPR y HIPAA

**Solución recomendada:**
```typescript
// Opción 1: Eliminar completamente en producción
// register.component.ts
Object.entries(this.registerForm.controls).forEach(([name, control]) => {
  const sub = control.valueChanges.subscribe(value => {
    // Solo log en desarrollo
    if (!environment.production) {
      console.log(`[Register] ${name} changed:`, value);
    }
  });
});

// Opción 2: Crear un servicio de logging seguro
@Injectable({ providedIn: 'root' })
export class SecureLoggerService {
  log(message: string, data?: any) {
    if (!environment.production) {
      // Sanitizar datos sensibles antes de loggear
      const sanitized = this.sanitizeSensitiveData(data);
      console.log(message, sanitized);
    }
  }

  private sanitizeSensitiveData(data: any): any {
    if (!data) return data;
    const sensitive = ['password', 'token', 'email', 'phone'];
    const sanitized = { ...data };
    sensitive.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    });
    return sanitized;
  }
}
```

**Prioridad:** 🔴 ALTA - Implementar inmediatamente

---

### 2. 🟠 MEDIA SEVERIDAD - Almacenamiento Inseguro de Tokens en Storage

**Ubicación:**
- `src/services/auth.service.ts` (líneas 56-68, 122-135)

**Descripción:**
Los tokens de autenticación y refresh tokens se están almacenando en `localStorage` y `sessionStorage` sin cifrado adicional:

**Código vulnerable:**
```typescript
// auth.service.ts - líneas 56-68
localStorage.setItem('userRole', role);
localStorage.setItem('userId', credential.user.uid);

sessionStorage.setItem('idToken', idToken);
sessionStorage.setItem('refreshToken', refreshToken);
sessionStorage.setItem('expiresAt', String(expiresAt));
sessionStorage.setItem('localId', credential.user.uid);
sessionStorage.setItem('email', credential.user.email || '');
```

**Riesgo:**
- **Vulnerabilidad a ataques XSS** - JavaScript malicioso puede acceder a los tokens
- **Tokens expuestos a extensiones del navegador** maliciosas
- **No hay mecanismo de rotación de tokens** evidente
- **Tokens persistentes** más allá de la sesión del navegador (localStorage)

**Solución recomendada:**
```typescript
// Opción 1: Usar solo sessionStorage con HTTPOnly cookies (requiere backend)
// El token debe ser manejado por el servidor como HTTPOnly cookie
// Frontend solo debe manejar el estado de autenticación

// Opción 2: Si debe usarse storage, añadir capas de seguridad
export class SecureStorageService {
  private readonly ENCRYPTION_KEY = 'app-specific-key'; // Mejor: derivar de user session
  
  setItem(key: string, value: string): void {
    try {
      // Cifrar datos sensibles antes de almacenar
      const encrypted = this.encrypt(value);
      sessionStorage.setItem(key, encrypted);
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  getItem(key: string): string | null {
    try {
      const encrypted = sessionStorage.getItem(key);
      return encrypted ? this.decrypt(encrypted) : null;
    } catch (e) {
      return null;
    }
  }

  // IMPORTANTE: Este es solo un EJEMPLO SIMPLIFICADO
  // NO USAR EN PRODUCCIÓN - btoa/atob NO es cifrado real
  // Implementar cifrado real usando Web Crypto API
  private encrypt(data: string): string {
    // TODO: Implementar cifrado real con SubtleCrypto
    // return await crypto.subtle.encrypt(...)
    return btoa(data); // ⚠️ PLACEHOLDER - NO ES SEGURO
  }

  private decrypt(data: string): string {
    // TODO: Implementar descifrado real con SubtleCrypto
    // return await crypto.subtle.decrypt(...)
    return atob(data); // ⚠️ PLACEHOLDER - NO ES SEGURO
  }
}

// Además, implementar:
// - Rotación automática de tokens antes de expiración
// - Limpieza de tokens al cerrar pestaña
// - Validación de integridad de tokens almacenados
```

**Mejores prácticas adicionales:**
1. **Usar Content Security Policy (CSP)** para mitigar XSS
2. **Implementar token refresh automático** antes de expiración
3. **Agregar mecanismo de detección de tokens comprometidos**
4. **Usar SameSite cookies** cuando sea posible

**Prioridad:** 🟠 MEDIA-ALTA - Implementar en siguiente sprint

---

### 3. 🟡 MEDIA SEVERIDAD - Interpolación de Datos sin Sanitizar en Templates

**Ubicación:**
- `src/components/page/search/search.component.html` (líneas 109, 110, 117, 122-123, 144-145, 159-161)
- `src/components/auth/forgot-password/forgot-password.component.html` (línea 48)
- `src/components/auth/login/login.component.html` (línea 30)
- `src/components/auth/register/register.component.html` (línea 74)

**Descripción:**
Los datos de usuario se están interpolando directamente en templates sin sanitización explícita:

**Código potencialmente vulnerable:**
```html
<!-- search.component.html -->
<h3 class="text-lg font-semibold text-gray-900">{{ doctor.name }}</h3>
<p class="text-sm text-indigo-600 font-medium">{{ doctor.specialty }}</p>
<span class="text-sm text-gray-600">{{ doctor.availability }}</span>

<!-- forgot-password.component.html -->
<p class="text-gray-600">
  If an account for {{ forgotPasswordForm.value.email }} exists, you will receive a password reset link.
</p>

<!-- login.component.html -->
<p class="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{{ errorMessage() }}</p>
```

**Riesgo:**
- **Potencial XSS** si los datos provienen de fuentes no confiables
- Aunque Angular sanitiza automáticamente las interpolaciones `{{ }}`, no hay validación previa
- Los datos de formularios sin validación pueden contener scripts

**Análisis:**
Angular protege automáticamente contra XSS en interpolaciones de texto (`{{ }}`), PERO:
- Los mensajes de error pueden contener texto del servidor sin sanitizar
- Los nombres de doctores vienen de una base de datos (potencial vector si no se valida en ingreso)
- Los datos de formularios deben validarse en el frontend antes de mostrar

**Solución recomendada:**
```typescript
// Crear un pipe de sanitización explícito
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizeText',
  standalone: true
})
export class SanitizeTextPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): string {
    if (!value) return '';
    
    // Escapar caracteres HTML peligrosos
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

// Usar en templates para datos de usuario no confiables:
<h3>{{ doctor.name | sanitizeText }}</h3>
<p>{{ errorMessage() | sanitizeText }}</p>

// Validar datos en el servicio antes de almacenar
export class DataValidationService {
  validateUserInput(input: string): string {
    // Remover scripts y tags HTML
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
  
  validateDoctorData(doctor: any): any {
    return {
      ...doctor,
      name: this.validateUserInput(doctor.name),
      specialty: this.validateUserInput(doctor.specialty),
      availability: this.validateUserInput(doctor.availability)
    };
  }
}
```

**Implementar Content Security Policy:**
```typescript
// En index.html o configuración del servidor
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               font-src 'self' data:;
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com">
```

**Prioridad:** 🟡 MEDIA - Implementar validación de entrada

---

### 4. 🟡 MEDIA SEVERIDAD - Falta de Validación de Roles en Firestore

**Ubicación:**
- `src/services/firebase.service.ts` (líneas 85-93, 96-106)
- `src/guards/access.guard.ts` (líneas 11-54)

**Descripción:**
Las consultas a Firestore no validan adecuadamente los permisos del usuario:

**Código vulnerable:**
```typescript
// firebase.service.ts - línea 85
async getMyAppointments(uid: string, role: 'patient' | 'specialist') {
  const appointmentsRef = collection(this.firestore, 'appointments');
  const fieldToSearch = role === 'patient' ? 'patientId' : 'specialistId';
  
  const q = query(appointmentsRef, where(fieldToSearch, '==', uid));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

**Riesgo:**
- **No hay validación del token del lado del servidor**
- Un atacante puede modificar el parámetro `uid` o `role` en el cliente
- **Falta implementación de Firestore Security Rules**
- Consultas no verifican autenticación en tiempo real

**Solución recomendada:**
```javascript
// 1. Crear archivo firestore.rules en la raíz del proyecto
// 2. Implementar las reglas de seguridad
// 3. Desplegar con: firebase deploy --only firestore:rules

// Archivo: firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if isOwner(userId);
      // Only authenticated users can create (handled by Cloud Functions)
      allow create: if isAuthenticated();
      // Users can update their own data (except role)
      allow update: if isOwner(userId) && 
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'uid']);
      allow delete: if false; // Prevent deletion
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      // Patients can read their own appointments
      allow read: if isAuthenticated() && 
                     (resource.data.patientId == request.auth.uid || 
                      resource.data.specialistId == request.auth.uid);
      
      // Only patients can create appointments
      allow create: if isAuthenticated() && 
                       hasRole('patient') && 
                       request.resource.data.patientId == request.auth.uid;
      
      // Both parties can update (status, notes)
      allow update: if isAuthenticated() && 
                       (resource.data.patientId == request.auth.uid || 
                        resource.data.specialistId == request.auth.uid) &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['patientId', 'specialistId']);
      
      // Only specialists can delete (cancel)
      allow delete: if isAuthenticated() && 
                       hasRole('specialist') && 
                       resource.data.specialistId == request.auth.uid;
    }
    
    // Verified specialists directory (read-only for all authenticated users)
    match /users/{userId} {
      allow read: if isAuthenticated() && 
                     get(/databases/$(database)/documents/users/$(userId)).data.role == 'specialist' &&
                     get(/databases/$(database)/documents/users/$(userId)).data.isVerified == true;
    }
  }
}

// 2. Validar en el servicio que el uid proviene de Auth
async getMyAppointments() {
  const currentUser = this.auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }
  
  // Obtener rol verificado desde Firestore
  const userDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));
  const userData = userDoc.data() as AppUser;
  
  if (!userData) {
    throw new Error('Datos de usuario no encontrados');
  }
  
  const appointmentsRef = collection(this.firestore, 'appointments');
  const fieldToSearch = userData.role === 'patient' ? 'patientId' : 'specialistId';
  
  // Usar el UID del usuario autenticado, no un parámetro
  const q = query(appointmentsRef, where(fieldToSearch, '==', currentUser.uid));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 3. Verificar tokens en cada llamada importante
private async verifyUserToken(): Promise<boolean> {
  const user = this.auth.currentUser;
  if (!user) return false;
  
  try {
    const idTokenResult = await user.getIdTokenResult(true); // Force refresh
    return idTokenResult.claims.role !== undefined;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}
```

**Prioridad:** 🟡 MEDIA-ALTA - Implementar Firestore Rules urgentemente

---

### 5. 🔵 BAJA SEVERIDAD - Uso de window.location.reload() sin Confirmación

**Ubicación:**
- `src/services/i18n.service.ts` (línea 27)

**Descripción:**
El cambio de idioma recarga la página sin advertencia al usuario:

**Código:**
```typescript
setLanguage(langCode: string) {
  if (this.availableLanguages.some(l => l.code === langCode)) {
    localStorage.setItem('teraly-lang', langCode);
    window.location.reload();  // ⚠️ Sin confirmación
  }
}
```

**Riesgo:**
- **Pérdida de datos no guardados** en formularios
- **Mala experiencia de usuario**
- Potencial para crear bucles de recarga si hay errores

**Solución recomendada:**
```typescript
setLanguage(langCode: string) {
  if (this.availableLanguages.some(l => l.code === langCode)) {
    // Verificar si hay datos sin guardar
    if (this.hasUnsavedChanges()) {
      const confirmed = confirm(
        'Cambiar el idioma recargará la página. ¿Continuar? Se perderán los cambios no guardados.'
      );
      if (!confirmed) return;
    }
    
    localStorage.setItem('teraly-lang', langCode);
    
    // Mejor: Recargar solo si es necesario
    // Angular puede cambiar idioma dinámicamente con TranslateService
    window.location.reload();
  }
}

// O mejor aún: usar @angular/localize dinámicamente
// sin recargar la página
async setLanguage(langCode: string) {
  if (this.availableLanguages.some(l => l.code === langCode)) {
    localStorage.setItem('teraly-lang', langCode);
    this.currentLang.set(langCode);
    
    // Cargar traducciones dinámicamente
    await this.loadTranslations(langCode);
    // Actualizar la aplicación sin reload
  }
}
```

**Prioridad:** 🔵 BAJA - Mejorar UX cuando sea posible

---

### 6. 🟡 MEDIA SEVERIDAD - Validación de Contraseñas Débil

**Ubicación:**
- `src/components/auth/register/register.component.ts` (línea 45)

**Descripción:**
Solo se valida longitud mínima de contraseña (8 caracteres), sin requisitos de complejidad:

**Código:**
```typescript
password: new FormControl('', [Validators.required, Validators.minLength(8)])
```

**Riesgo:**
- **Contraseñas débiles permitidas** (ej: "12345678")
- No hay validación de complejidad (mayúsculas, números, símbolos)
- Vulnerable a ataques de diccionario

**Solución recomendada:**
```typescript
// Crear un validador personalizado
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) {
      return null;
    }
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const isLongEnough = value.length >= 8;
    
    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isLongEnough;
    
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
    
    // Verificar contra contraseñas comunes
    const commonPasswords = ['12345678', 'password', 'qwerty123'];
    if (commonPasswords.includes(value.toLowerCase())) {
      return { commonPassword: true };
    }
    
    return null;
  };
}

// Usar en el formulario
password: new FormControl('', [
  Validators.required, 
  Validators.minLength(8),
  strongPasswordValidator()
])

// Mostrar feedback en el template
@if (registerForm.get('password')?.hasError('strongPassword') && registerForm.get('password')?.touched) {
  <div class="text-xs text-red-500 mt-1 space-y-1">
    <p class="font-medium">La contraseña debe contener:</p>
    <ul class="list-disc list-inside">
      <li [class.text-green-500]="registerForm.get('password')?.errors?.['strongPassword'].isLongEnough">
        Al menos 8 caracteres
      </li>
      <li [class.text-green-500]="registerForm.get('password')?.errors?.['strongPassword'].hasUpperCase">
        Una letra mayúscula
      </li>
      <li [class.text-green-500]="registerForm.get('password')?.errors?.['strongPassword'].hasLowerCase">
        Una letra minúscula
      </li>
      <li [class.text-green-500]="registerForm.get('password')?.errors?.['strongPassword'].hasNumeric">
        Un número
      </li>
      <li [class.text-green-500]="registerForm.get('password')?.errors?.['strongPassword'].hasSpecialChar">
        Un carácter especial
      </li>
    </ul>
  </div>
}

// Implementar también en Firebase Functions para validar server-side
exports.validatePasswordStrength = functions.auth.user().beforeCreate(async (user) => {
  // Validación del lado del servidor
});
```

**Prioridad:** 🟡 MEDIA - Implementar en próxima versión

---

### 7. 🟡 MEDIA SEVERIDAD - URLs de Imágenes No Validadas

**Ubicación:**
- `src/components/page/search/search.component.ts` (líneas 28, 38, 48, 60, 67)
- `src/components/page/client-home/client-home.component.html` (línea 61)

**Descripción:**
Las URLs de imágenes están hardcodeadas pero no hay validación para imágenes dinámicas:

**Código:**
```typescript
// search.component.ts
doctors = [
  {
    image: 'https://via.placeholder.com/64',  // Hardcoded OK
    // ...
  }
];

// En template
<img [src]="doctor.image" [alt]="doctor.name" class="w-16 h-16 rounded-full object-cover" />
```

**Riesgo:**
- Si las imágenes vienen de la base de datos, **podrían contener URLs maliciosas**
- Potencial para **ataques de phishing** con imágenes externas
- **SSRF (Server-Side Request Forgery)** si se procesan del lado del servidor

**Solución recomendada:**
```typescript
// Crear un servicio de validación de URLs
@Injectable({ providedIn: 'root' })
export class ImageSecurityService {
  private allowedDomains = [
    'via.placeholder.com',
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    // Agregar dominios confiables
  ];

  sanitizeImageUrl(url: string): SafeUrl | string {
    try {
      const urlObj = new URL(url);
      
      // Verificar protocolo
      if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
        return this.getDefaultImage();
      }
      
      // Verificar dominio permitido
      const isAllowed = this.allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        console.warn('URL de imagen no permitida:', url);
        return this.getDefaultImage();
      }
      
      return url;
    } catch (error) {
      console.error('URL de imagen inválida:', url);
      return this.getDefaultImage();
    }
  }

  getDefaultImage(): string {
    return 'assets/images/default-avatar.png';
  }
}

// Usar en el componente
export class SearchComponent {
  imageService = inject(ImageSecurityService);
  
  getSafeImageUrl(url: string): string {
    return this.imageService.sanitizeImageUrl(url) as string;
  }
}

// En template
<img [src]="getSafeImageUrl(doctor.image)" 
     [alt]="doctor.name" 
     (error)="doctor.image = imageService.getDefaultImage()"
     class="w-16 h-16 rounded-full object-cover" />

// Mejor aún: Usar Firebase Storage con signed URLs
async uploadDoctorImage(file: File, doctorId: string): Promise<string> {
  const storage = getStorage();
  const fileExtension = file.name.split('.').pop();
  const fileName = `doctors/${doctorId}/profile.${fileExtension}`;
  const storageRef = ref(storage, fileName);
  
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido');
  }
  
  // Validar tamaño (ej: 5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Archivo demasiado grande');
  }
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
```

**Prioridad:** 🟡 MEDIA - Implementar cuando se agreguen imágenes dinámicas

---

### 8. 🔵 BAJA SEVERIDAD - Falta de Rate Limiting en el Frontend

**Ubicación:**
- `src/components/auth/login/login.component.ts`
- `src/components/auth/register/register.component.ts`
- `src/components/auth/forgot-password/forgot-password.component.ts`

**Descripción:**
No hay límite de intentos de login o registro en el frontend.

**Riesgo:**
- **Ataques de fuerza bruta** facilitados
- **Enumeración de usuarios** mediante intentos repetidos
- **Abuso de endpoints** de registro

**Solución recomendada:**
```typescript
// Crear un servicio de rate limiting
@Injectable({ providedIn: 'root' })
export class RateLimitService {
  private attempts = new Map<string, { count: number; timestamp: number }>();
  
  checkRateLimit(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = action;
    
    const record = this.attempts.get(key);
    
    if (!record || now - record.timestamp > windowMs) {
      // Nueva ventana de tiempo
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false; // Rate limit excedido
    }
    
    record.count++;
    return true;
  }
  
  getRemainingTime(action: string, windowMs: number = 60000): number {
    const record = this.attempts.get(action);
    if (!record) return 0;
    
    const elapsed = Date.now() - record.timestamp;
    return Math.max(0, windowMs - elapsed);
  }
}

// Usar en login
export class LoginComponent {
  private rateLimitService = inject(RateLimitService);
  
  login() {
    const canAttempt = this.rateLimitService.checkRateLimit('login', 5, 60000);
    
    if (!canAttempt) {
      const remainingMs = this.rateLimitService.getRemainingTime('login', 60000);
      const remainingSec = Math.ceil(remainingMs / 1000);
      this.errorMessage.set(
        `Demasiados intentos. Intenta de nuevo en ${remainingSec} segundos.`
      );
      return;
    }
    
    // Continuar con login normal...
  }
}

// IMPORTANTE: Implementar también rate limiting del lado del servidor
// con Firebase Functions o Cloud Functions
exports.rateLimitLogin = functions.https.onCall(async (data, context) => {
  const ip = context.rawRequest.ip;
  const rateLimitKey = `login:${ip}`;
  
  // Usar Redis o Firestore para rate limiting
  // ...
});
```

**Nota:** El rate limiting del frontend es fácilmente bypaseable. **DEBE** implementarse también en el backend.

**Prioridad:** 🔵 BAJA-MEDIA - Implementar server-side obligatoriamente

---

## Recomendaciones Generales de Seguridad

### 1. Implementar Content Security Policy (CSP)

Agregar en `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'nonce-{RANDOM}' https://www.gstatic.com https://apis.google.com;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               font-src 'self' data:;
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com;
               frame-src 'self' https://*.firebaseapp.com;
               object-src 'none';
               base-uri 'self';
               form-action 'self';">
```

### 2. Configurar Headers de Seguridad

En `firebase.json` o configuración del hosting:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ]
  }
}
```

### 3. Auditoría de Dependencias

Ejecutar regularmente:
```bash
npm audit
npm audit fix
```

Considerar usar:
- **Snyk** para monitoreo continuo de vulnerabilidades
- **Dependabot** para actualizaciones automáticas
- **OWASP Dependency-Check**

### 4. Implementar Logging y Monitoreo Seguros

```typescript
// Servicio centralizado de logging
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  logSecurityEvent(event: string, details: any) {
    // Enviar a servicio de logging externo (ej: Cloud Logging)
    // NO loggear información sensible
    console.warn('[SECURITY]', event, {
      timestamp: new Date().toISOString(),
      // Sanitizar detalles antes de enviar
    });
  }
}

// Usar para eventos de seguridad importantes:
// - Intentos de login fallidos
// - Cambios de contraseña
// - Accesos denegados
// - Manipulación de URLs/parámetros
```

### 5. Testing de Seguridad

Implementar tests automatizados:
```typescript
describe('Security Tests', () => {
  it('should sanitize XSS attempts in user input', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('<script>');
  });
  
  it('should prevent SQL injection in queries', () => {
    // Tests relevantes
  });
  
  it('should validate JWT tokens properly', () => {
    // Tests relevantes
  });
});
```

---

## Checklist de Implementación Priorizada

### 🔴 Prioridad Alta (Implementar inmediatamente)
- [ ] Eliminar todos los `console.log` con datos sensibles
- [ ] Implementar logger seguro para desarrollo
- [ ] Mejorar almacenamiento de tokens (usar solo sessionStorage + considerar cifrado)
- [ ] Implementar Firestore Security Rules completas
- [ ] Agregar Content Security Policy

### 🟠 Prioridad Media (Implementar en próximo sprint)
- [ ] Validar y sanitizar todas las entradas de usuario
- [ ] Implementar pipe de sanitización para templates
- [ ] Mejorar validación de contraseñas
- [ ] Agregar validación de URLs de imágenes
- [ ] Configurar headers de seguridad en hosting

### 🟡 Prioridad Baja (Mejoras continuas)
- [ ] Implementar rate limiting en frontend y backend
- [ ] Mejorar UX de cambio de idioma
- [ ] Agregar tests de seguridad automatizados
- [ ] Implementar auditoría de seguridad continua
- [ ] Configurar monitoreo de eventos de seguridad

---

## Recursos y Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Angular Security Guide](https://angular.io/guide/security)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Web Security Academy](https://portswigger.net/web-security)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [HIPAA Technical Safeguards](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

---

## Conclusión

La aplicación Teraly tiene una base sólida de seguridad con Angular y Firebase, pero requiere mejoras críticas en:

1. **Manejo de datos sensibles** - Eliminar logging de información personal
2. **Almacenamiento de tokens** - Implementar mejores prácticas
3. **Validación de datos** - Sanitizar todas las entradas y salidas
4. **Reglas de seguridad** - Implementar Firestore Security Rules completas

**Recomendación:** Dedicar un sprint completo a la implementación de las vulnerabilidades de alta prioridad antes del lanzamiento a producción.

**Próximos pasos:**
1. Revisar este documento con el equipo de desarrollo
2. Priorizar las vulnerabilidades según impacto en el negocio
3. Crear issues en GitHub para cada vulnerabilidad
4. Asignar tareas al equipo
5. Implementar pruebas de seguridad automatizadas
6. Realizar auditoría de seguridad externa antes del lanzamiento

---

**Análisis realizado por:** Equipo de Seguridad  
**Fecha:** 8 de diciembre de 2024  
**Versión del documento:** 1.0
