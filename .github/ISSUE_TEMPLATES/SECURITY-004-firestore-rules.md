---
name: 🟡 SECURITY-004 - Falta de Firestore Security Rules
about: Validación de permisos insuficiente en consultas a Firestore
title: '[SECURITY-004] Implementar Firestore Security Rules completas'
labels: 'security, high-priority, backend'
assignees: ''
---

## 🟡 Severidad: MEDIA-ALTA

## Descripción del Problema

Las consultas a Firestore no tienen validación adecuada de permisos del lado del servidor. Un atacante podría:
- Modificar parámetros `uid` o `role` en el cliente
- Acceder a datos de otros usuarios
- Modificar su propio rol

**Ubicación:** `src/services/firebase.service.ts` - Líneas 85-93, 96-106

## Código Vulnerable

```typescript
async getMyAppointments(uid: string, role: 'patient' | 'specialist') {
  const fieldToSearch = role === 'patient' ? 'patientId' : 'specialistId';
  const q = query(appointmentsRef, where(fieldToSearch, '==', uid));
  // ⚠️ No valida que el uid sea del usuario autenticado
}
```

## Riesgos

1. **Escalación de privilegios:** Usuario puede cambiar su rol
2. **Acceso no autorizado:** Puede ver datos de otros usuarios
3. **Manipulación de parámetros:** uid puede ser modificado
4. **Falta de autenticación server-side**

## Solución: Firestore Security Rules

### 1. Implementar Rules Completas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
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
      allow read: if isOwner(userId);
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) && 
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'uid']);
      allow delete: if false;
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated() && 
                     (resource.data.patientId == request.auth.uid || 
                      resource.data.specialistId == request.auth.uid);
      
      allow create: if isAuthenticated() && 
                       hasRole('patient') && 
                       request.resource.data.patientId == request.auth.uid;
      
      allow update: if isAuthenticated() && 
                       (resource.data.patientId == request.auth.uid || 
                        resource.data.specialistId == request.auth.uid);
      
      allow delete: if isAuthenticated() && 
                       hasRole('specialist') && 
                       resource.data.specialistId == request.auth.uid;
    }
  }
}
```

### 2. Validar en el Servicio

```typescript
async getMyAppointments() {
  const currentUser = this.auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }
  
  // Obtener rol desde Firestore (fuente confiable)
  const userDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));
  const userData = userDoc.data() as AppUser;
  
  // Usar UID verificado, no parámetro
  const q = query(appointmentsRef, 
    where(fieldToSearch, '==', currentUser.uid));
}
```

## Pasos de Implementación

- [ ] Crear archivo `firestore.rules`
- [ ] Implementar reglas para colección `users`
- [ ] Implementar reglas para colección `appointments`
- [ ] Modificar servicios para usar uid autenticado
- [ ] Agregar verificación de tokens
- [ ] Testing de reglas con Firebase Emulator
- [ ] Desplegar reglas a Firebase
- [ ] Validar en producción

## Testing

```bash
# Instalar emulador
npm install -g firebase-tools
firebase emulators:start

# Tests de seguridad
firebase emulators:exec --project=<project-id> "npm run test:security"
```

**Prioridad:** 🟡 MEDIA-ALTA  
**Esfuerzo:** 4-6 días  
**Bloqueante:** SÍ - Crítico para producción

Ver `SECURITY_ANALYSIS.md` - Sección 4
