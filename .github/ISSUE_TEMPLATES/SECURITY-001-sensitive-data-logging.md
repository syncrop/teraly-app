---
name: 🔴 SECURITY-001 - Exposición de Datos Sensibles en Console Logs
about: Información sensible expuesta en logs del navegador
title: '[SECURITY-001] Eliminar logging de datos sensibles en producción'
labels: 'security, high-priority, bug'
assignees: ''
---

## 🔴 Severidad: ALTA

## Descripción del Problema

El código actual está registrando información sensible en la consola del navegador, incluyendo:
- Valores de formularios de registro (datos personales)
- Errores de autenticación con detalles técnicos
- Entradas de estado de ánimo del usuario (información de salud mental)

Esta práctica expone información personal identificable (PII) e información de salud protegida (PHI), lo cual representa una violación potencial de GDPR y HIPAA.

## Ubicaciones Afectadas

### 1. Register Component
- **Archivo:** `src/components/auth/register/register.component.ts` - Líneas 71, 87

### 2. Login Component
- **Archivo:** `src/components/auth/login/login.component.ts` - Líneas 32, 59

### 3. Moods Component
- **Archivo:** `src/components/shared/moods/moods.component.ts` - Línea 159

### 4. Forgot Password Component
- **Archivo:** `src/components/auth/forgot-password/forgot-password.component.ts` - Línea 31

## Solución: Implementar SecureLoggerService

Ver documento completo de análisis: `SECURITY_ANALYSIS.md` - Sección 1

**Prioridad:** 🔴 CRÍTICA  
**Esfuerzo:** 5-7 días  
**Bloqueante:** SÍ
