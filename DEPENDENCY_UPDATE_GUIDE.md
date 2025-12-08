# Guía de Actualización de Dependencias - Teraly App

## Resumen Ejecutivo

Este documento proporciona un análisis completo de las dependencias del proyecto, identifica paquetes desactualizados o vulnerables, y ofrece una estrategia segura para actualizar las dependencias sin romper el proyecto.

**Estado actual:** ✅ No se encontraron vulnerabilidades de seguridad
**Paquetes desactualizados:** 3 paquetes tienen actualizaciones disponibles

---

## 1. Análisis de Dependencias Actuales

### Versiones Instaladas

```json
{
  "dependencies": {
    "@angular/build": "^21.0.0",         // Instalado: 21.0.2 → Disponible: 21.0.2 ✅
    "@angular/cli": "^21.0.0",           // Instalado: 21.0.2 → Disponible: 21.0.2 ✅
    "@angular/common": "^21.0.0",        // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "@angular/compiler": "^21.0.0",      // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "@angular/compiler-cli": "^21.0.0",  // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "@angular/core": "^21.0.0",          // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "@angular/fire": "^21.0.0-rc.0",     // Instalado: 21.0.0-rc.0 → Latest stable: 20.0.1 ⚠️
    "@angular/forms": "^21.0.3",         // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "@angular/localize": "^21.0.3",      // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "@angular/platform-browser": "^21.0.0", // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "@angular/router": "^21.0.3",        // Instalado: 21.0.3 → Disponible: 21.0.3 ✅
    "rxjs": "^7.8.2",                    // Instalado: 7.8.2 → Disponible: 7.8.2 ✅
    "tailwindcss": "latest"              // Instalado: 4.1.17 → Disponible: 4.1.17 ✅
  },
  "devDependencies": {
    "@types/node": "^22.14.0",           // Instalado: 22.19.1 → Disponible: 24.10.1 📦
    "typescript": "5.9",                 // Instalado: 5.9.3 → Disponible: 5.9.3 ✅
    "vite": "^6.2.0"                     // Instalado: 6.4.1 → Disponible: 7.2.7 📦
  }
}
```

**Leyenda:**
- ✅ Actualizado
- ⚠️ Versión pre-release (considerar estabilidad)
- 📦 Actualización disponible

---

## 2. Paquetes Desactualizados Identificados

### 2.1 @angular/fire
- **Versión actual:** 21.0.0-rc.0 (Release Candidate)
- **Versión estable recomendada:** 20.0.1
- **Última versión next:** 21.0.0-rc.0
- **Análisis:** Estás usando una versión release candidate que es compatible con Angular 21, pero aún no es estable. La versión 20.0.1 es la última estable.
- **Recomendación:** Mantener 21.0.0-rc.0 si necesitas compatibilidad con Angular 21, o bajar a 20.0.1 para máxima estabilidad

### 2.2 @types/node
- **Versión actual:** 22.19.1
- **Versión disponible:** 24.10.1
- **Diferencia:** 2 versiones mayores
- **Análisis:** Actualización de tipos de Node.js. Generalmente seguro actualizar.
- **Riesgo:** Bajo
- **Recomendación:** Actualizar a ^24.10.1

### 2.3 vite
- **Versión actual:** 6.4.1
- **Versión disponible:** 7.2.7
- **Diferencia:** 1 versión mayor
- **Análisis:** Actualización mayor de Vite. Puede incluir breaking changes.
- **Riesgo:** Medio
- **Recomendación:** Revisar changelog de Vite 7.x antes de actualizar

---

## 3. Análisis de Vulnerabilidades de Seguridad

### Resultado del Audit de npm

```bash
npm audit
```

**Resultado:** ✅ **0 vulnerabilidades encontradas**

```
found 0 vulnerabilities
```

### Consulta a GitHub Advisory Database

**Resultado:** ✅ **No se encontraron vulnerabilidades conocidas** en las siguientes dependencias críticas:
- @angular/core@21.0.0
- @angular/fire@21.0.0-rc.0
- tailwindcss@4.1.17
- rxjs@7.8.2
- typescript@5.9.3
- vite@6.4.1

---

## 4. Estrategia de Actualización Segura

### Opción 1: Actualización Conservadora (RECOMENDADO)

Esta opción actualiza solo las dependencias con bajo riesgo y mantiene la estabilidad del proyecto.

#### Pasos:

1. **Actualizar @types/node** (Riesgo: Bajo)
   ```bash
   npm install --save-dev @types/node@^24.10.1
   ```

2. **Verificar que el proyecto funciona:**
   ```bash
   npm run build
   npm run dev
   ```

3. **Si todo funciona correctamente, commit los cambios:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: update @types/node to v24.10.1"
   ```

### Opción 2: Actualización Completa (Para entornos de desarrollo/testing)

Esta opción actualiza todas las dependencias desactualizadas, incluyendo actualizaciones mayores.

#### Pasos:

1. **Crear una rama de testing:**
   ```bash
   git checkout -b feature/update-all-dependencies
   ```

2. **Actualizar Vite a v7:**
   
   Primero, revisa el [changelog de Vite 7](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md):
   ```bash
   npm install --save-dev vite@^7.2.7
   ```

3. **Actualizar @types/node:**
   ```bash
   npm install --save-dev @types/node@^24.10.1
   ```

4. **Revisar y ajustar @angular/fire:**
   
   Para usar la versión estable:
   ```bash
   npm install @angular/fire@^20.0.1
   ```
   
   O mantener la versión RC compatible con Angular 21:
   ```bash
   # Mantener la versión actual - ya compatible
   ```

5. **Probar exhaustivamente:**
   ```bash
   # Limpiar caché
   rm -rf node_modules .angular/cache
   npm install
   
   # Construir el proyecto
   npm run build
   
   # Ejecutar en modo desarrollo
   npm run dev
   ```

6. **Si hay errores, revisar los logs y ajustar configuraciones según sea necesario.**

7. **Una vez validado, hacer commit:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: update dependencies to latest versions"
   ```

### Opción 3: Actualización con npm-check-updates (Automatizada)

Para una actualización más automatizada:

1. **Instalar npm-check-updates globalmente:**
   ```bash
   npm install -g npm-check-updates
   ```

2. **Ver qué actualizaciones están disponibles:**
   ```bash
   ncu
   ```

3. **Actualizar package.json (sin instalar):**
   ```bash
   ncu -u
   ```

4. **Instalar las nuevas versiones:**
   ```bash
   npm install
   ```

5. **Probar el proyecto:**
   ```bash
   npm run build
   npm run dev
   ```

---

## 5. Comandos Útiles para Mantenimiento de Dependencias

### Verificar paquetes desactualizados
```bash
npm outdated
```

### Auditoría de seguridad
```bash
npm audit
```

### Auditoría con reporte detallado
```bash
npm audit --json > audit-report.json
```

### Intentar corregir vulnerabilidades automáticamente
```bash
npm audit fix
```

### Corregir incluyendo breaking changes (CUIDADO)
```bash
npm audit fix --force
```

### Actualizar un paquete específico
```bash
npm update <package-name>
```

### Actualizar a la última versión específica
```bash
npm install <package-name>@latest
```

### Listar versiones instaladas
```bash
npm list --depth=0
```

### Ver información de un paquete
```bash
npm view <package-name> version
npm view <package-name> versions --json
```

---

## 6. Mejores Prácticas

1. **Siempre crear una rama antes de actualizar:**
   ```bash
   git checkout -b feature/update-dependencies
   ```

2. **Actualizar dependencias de una en una** para identificar problemas fácilmente.

3. **Leer los changelogs** de versiones mayores antes de actualizar:
   - [Angular Changelog](https://github.com/angular/angular/blob/main/CHANGELOG.md)
   - [Vite Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)

4. **Probar el proyecto después de cada actualización:**
   - Compilación: `npm run build`
   - Desarrollo: `npm run dev`
   - Tests (si existen): `npm test`

5. **Mantener actualizado el package-lock.json:**
   ```bash
   npm install
   git add package-lock.json
   ```

6. **Configurar dependabot o renovate** para actualizaciones automáticas de seguridad.

7. **Revisar el proyecto en diferentes entornos** antes de fusionar a la rama principal.

---

## 7. Consideraciones Especiales

### Angular 21
El proyecto usa Angular 21, que es una versión reciente. Asegúrate de:
- Mantener todas las dependencias de Angular en la misma versión mayor
- Revisar la [guía de actualización de Angular](https://update.angular.io/)

### @angular/fire (Firebase)
- La versión 21.0.0-rc.0 es una release candidate
- Compatible con Angular 21 pero aún no es estable
- Si la estabilidad es crítica, considera usar 20.0.1 con Angular 20

### tailwindcss: "latest"
- Usar "latest" no es recomendado para producción
- Considera fijar una versión específica:
  ```json
  "tailwindcss": "^4.1.17"
  ```

### TypeScript
- La versión 5.9 es correcta para Angular 21
- No actualizar a TypeScript 6.x sin verificar compatibilidad con Angular

---

## 8. Script de Actualización Rápida

Crear un archivo `update-dependencies.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Verificando estado actual..."
npm outdated || true

echo ""
echo "🔒 Ejecutando auditoría de seguridad..."
npm audit

echo ""
echo "💾 Creando backup de package.json..."
cp package.json package.json.backup

echo ""
echo "📦 Actualizando dependencias seguras..."
npm install --save-dev @types/node@^24.10.1

echo ""
echo "🔨 Construyendo proyecto..."
npm run build

echo ""
echo "✅ Actualización completada!"
echo "Si todo funciona correctamente, puedes hacer commit con:"
echo "  git add package.json package-lock.json"
echo "  git commit -m 'chore: update dependencies'"
```

Hacer el script ejecutable:
```bash
chmod +x update-dependencies.sh
./update-dependencies.sh
```

---

## 9. Resumen y Recomendación Final

### Estado Actual
- ✅ **Seguridad:** No hay vulnerabilidades
- ✅ **Dependencias principales:** Actualizadas
- ⚠️ **3 paquetes** tienen actualizaciones disponibles (no críticas)

### Recomendación

**Para Producción (AHORA):**
1. Actualizar solo `@types/node` a v24.10.1 (bajo riesgo)
2. Mantener las demás dependencias como están
3. Seguir la **Opción 1: Actualización Conservadora**

**Para el Futuro (próximas semanas):**
1. Monitorear la estabilidad de Vite 7.x
2. Esperar a que @angular/fire 21.0.0 salga de RC
3. Planificar una actualización completa cuando las versiones sean estables
4. Seguir la **Opción 2: Actualización Completa** en un ambiente de testing

**Comando inmediato recomendado:**
```bash
npm install --save-dev @types/node@^24.10.1 && npm run build
```

---

## 10. Contacto y Soporte

Para preguntas o problemas durante la actualización:
- Revisar la [documentación de Angular](https://angular.dev/guide/update)
- Consultar el [repositorio de Angular CLI](https://github.com/angular/angular-cli)
- Verificar [breaking changes de Vite](https://vitejs.dev/guide/migration.html)

---

**Última actualización:** 2025-12-08  
**Versión del documento:** 1.0.0
