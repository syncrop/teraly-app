---
name: 🟠 SECURITY-002 - Almacenamiento Inseguro de Tokens
about: Tokens de autenticación almacenados sin cifrado en localStorage/sessionStorage
title: '[SECURITY-002] Mejorar almacenamiento seguro de tokens de autenticación'
labels: 'security, medium-priority, enhancement'
assignees: ''
---

## 🟠 Severidad: MEDIA-ALTA

## Descripción del Problema

Los tokens de autenticación (idToken, refreshToken) se están almacenando en `localStorage` y `sessionStorage` sin cifrado adicional, lo que los hace vulnerables a:

- Ataques XSS (Cross-Site Scripting)
- Acceso por extensiones maliciosas del navegador
- Exposición en caso de compromiso del dispositivo

**Ubicación:** `src/services/auth.service.ts` - Líneas 56-68, 122-135

## Código Vulnerable

```typescript
// auth.service.ts
localStorage.setItem('userRole', role);
localStorage.setItem('userId', credential.user.uid);
sessionStorage.setItem('idToken', idToken);
sessionStorage.setItem('refreshToken', refreshToken);
sessionStorage.setItem('expiresAt', String(expiresAt));
```

## Riesgos

1. **XSS Attacks:** JavaScript malicioso puede leer tokens de storage
2. **Extensiones maliciosas:** Pueden acceder a todos los datos en storage
3. **Persistencia excesiva:** localStorage persiste tokens más allá de la sesión
4. **Sin rotación:** No hay mecanismo evidente de rotación de tokens
5. **Sin detección de compromiso:** No hay validación de integridad

## Soluciones Recomendadas

### Opción 1: HTTPOnly Cookies (MEJOR)
Requerir que el backend maneje tokens en cookies HTTPOnly (no accesibles desde JavaScript)

### Opción 2: Cifrado de Storage
Implementar cifrado usando Web Crypto API para datos en storage

### Opción 3: Minimizar Storage
Usar solo sessionStorage (no localStorage) y limpiar al cerrar pestaña

## Implementación Propuesta

Ver `SECURITY_ANALYSIS.md` - Sección 2 para implementación detallada del `SecureStorageService`

## Pasos de Implementación

- [ ] Crear `SecureStorageService` con cifrado Web Crypto API
- [ ] Migrar de localStorage a sessionStorage
- [ ] Implementar rotación automática de tokens
- [ ] Agregar validación de integridad de tokens
- [ ] Implementar limpieza automática al cerrar
- [ ] Agregar monitoreo de accesos sospechosos
- [ ] Configurar CSP headers
- [ ] Tests de seguridad

## Mejoras Adicionales

1. Implementar Content Security Policy (CSP)
2. Usar SameSite cookies cuando sea posible
3. Implementar token refresh automático
4. Agregar detección de tokens comprometidos
5. Logging de eventos de autenticación sospechosos

**Prioridad:** 🟠 MEDIA-ALTA  
**Esfuerzo:** 5-8 días  
**Bloqueante:** NO, pero recomendado antes de producción

Ver detalles completos en `SECURITY_ANALYSIS.md`
