---
name: 🟡 SECURITY-006 - URLs de Imágenes No Validadas
about: Las URLs de imágenes deben ser validadas para prevenir ataques
title: '[SECURITY-006] Implementar validación de URLs de imágenes'
labels: 'security, medium-priority, enhancement'
assignees: ''
---

## 🟡 Severidad: MEDIA

## Descripción del Problema

Las URLs de imágenes actuales están hardcodeadas, pero cuando se implementen imágenes dinámicas desde la base de datos, no habrá validación de seguridad.

**Ubicaciones:** 
- `src/components/page/search/search.component.ts`
- `src/components/page/client-home/client-home.component.html`

## Código Actual

```typescript
doctors = [{
  image: 'https://via.placeholder.com/64',  // Hardcoded - OK por ahora
}];

// En template
<img [src]="doctor.image" [alt]="doctor.name" />
```

## Riesgos Futuros

1. **URLs maliciosas** desde la base de datos
2. **Ataques de phishing** con imágenes externas
3. **SSRF** si se procesan del lado del servidor
4. **Dominios no confiables**

## Solución: Servicio de Validación de URLs

```typescript
@Injectable({ providedIn: 'root' })
export class ImageSecurityService {
  private allowedDomains = [
    'via.placeholder.com',
    'firebasestorage.googleapis.com',
    'storage.googleapis.com'
  ];

  sanitizeImageUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Verificar protocolo HTTPS
      if (urlObj.protocol !== 'https:') {
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
      return this.getDefaultImage();
    }
  }

  getDefaultImage(): string {
    return 'assets/images/default-avatar.png';
  }
}
```

## Uso en Componentes

```typescript
export class SearchComponent {
  imageService = inject(ImageSecurityService);
  
  getSafeImageUrl(url: string): string {
    return this.imageService.sanitizeImageUrl(url);
  }
}
```

```html
<img [src]="getSafeImageUrl(doctor.image)" 
     [alt]="doctor.name"
     (error)="doctor.image = imageService.getDefaultImage()" />
```

## Firebase Storage Integration

```typescript
async uploadDoctorImage(file: File, doctorId: string): Promise<string> {
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido');
  }
  
  // Validar tamaño (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Archivo demasiado grande');
  }
  
  const storage = getStorage();
  const storageRef = ref(storage, `doctors/${doctorId}/profile.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
```

## Pasos de Implementación

- [ ] Crear `ImageSecurityService`
- [ ] Implementar validación de URLs
- [ ] Agregar whitelist de dominios
- [ ] Crear imagen por defecto (default-avatar.png)
- [ ] Aplicar a todos los componentes con imágenes
- [ ] Implementar upload seguro a Firebase Storage
- [ ] Handler de errores de carga de imágenes
- [ ] Tests unitarios

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 2-3 días  
**Implementar cuando:** Se agreguen imágenes dinámicas

Ver `SECURITY_ANALYSIS.md` - Sección 7
