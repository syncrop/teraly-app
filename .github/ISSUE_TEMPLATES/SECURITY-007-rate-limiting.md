---
name: 🔵 SECURITY-007 - Falta de Rate Limiting
about: No hay límite de intentos en endpoints de autenticación
title: '[SECURITY-007] Implementar rate limiting en autenticación'
labels: 'security, low-priority, enhancement'
assignees: ''
---

## 🔵 Severidad: BAJA-MEDIA

## Descripción del Problema

No hay límite de intentos de login, registro o recuperación de contraseña en el frontend. Aunque el rate limiting del frontend es fácilmente bypasseable, proporciona una primera capa de defensa.

**Ubicaciones:**
- `src/components/auth/login/login.component.ts`
- `src/components/auth/register/register.component.ts`
- `src/components/auth/forgot-password/forgot-password.component.ts`

## Riesgos

1. **Ataques de fuerza bruta** facilitados
2. **Enumeración de usuarios** mediante intentos repetidos
3. **Abuso de endpoints** de registro
4. **DoS (Denial of Service)** de bajo nivel

## Solución: Rate Limit Service

```typescript
@Injectable({ providedIn: 'root' })
export class RateLimitService {
  private attempts = new Map<string, { count: number; timestamp: number }>();
  
  checkRateLimit(action: string, maxAttempts = 5, windowMs = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(action);
    
    if (!record || now - record.timestamp > windowMs) {
      this.attempts.set(action, { count: 1, timestamp: now });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingTime(action: string, windowMs = 60000): number {
    const record = this.attempts.get(action);
    if (!record) return 0;
    
    const elapsed = Date.now() - record.timestamp;
    return Math.max(0, windowMs - elapsed);
  }
}
```

## Uso en Login

```typescript
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
    
    // Continuar con login...
  }
}
```

## ⚠️ IMPORTANTE: Server-Side Rate Limiting

El rate limiting del frontend es insuficiente. **DEBE** implementarse también en el backend:

```typescript
// Firebase Functions
exports.rateLimitLogin = functions.https.onCall(async (data, context) => {
  const ip = context.rawRequest.ip;
  const rateLimitKey = `login:${ip}`;
  
  // Usar Redis o Firestore para rate limiting
  // Bloquear IPs con demasiados intentos
});
```

## Pasos de Implementación

### Frontend (Esta Issue)
- [ ] Crear `RateLimitService`
- [ ] Aplicar a login
- [ ] Aplicar a registro
- [ ] Aplicar a forgot-password
- [ ] Tests unitarios
- [ ] UX feedback al usuario

### Backend (Issue Separada - CRÍTICO)
- [ ] Implementar rate limiting en Firebase Functions
- [ ] Usar Redis/Firestore para tracking
- [ ] Bloqueo temporal de IPs
- [ ] Logging de intentos sospechosos
- [ ] Alertas de seguridad

**Prioridad Frontend:** 🔵 BAJA-MEDIA  
**Prioridad Backend:** 🔴 ALTA  
**Esfuerzo:** 2-3 días (frontend), 4-5 días (backend)

**Nota:** Rate limiting del frontend es solo UX/primera capa. El backend es obligatorio para seguridad real.

Ver `SECURITY_ANALYSIS.md` - Sección 8
