# Lista de Verificación - Actualización de Dependencias

Use esta lista para asegurar actualizaciones seguras de dependencias.

## Antes de Actualizar

- [ ] Crear una rama nueva para las actualizaciones
  ```bash
  git checkout -b feature/update-dependencies
  ```
- [ ] Verificar el estado actual de dependencias
  ```bash
  npm run check-updates
  npm run security-audit
  ```
- [ ] Revisar [DEPENDENCY_UPDATE_GUIDE.md](../DEPENDENCY_UPDATE_GUIDE.md) para recomendaciones específicas
- [ ] Crear backup de package.json (el script lo hace automáticamente)

## Durante la Actualización

### Opción 1: Actualización Conservadora (Recomendada)
- [ ] Ejecutar script de actualización conservadora
  ```bash
  ./update-dependencies.sh conservative
  ```
- [ ] Verificar que no hay errores en la salida
- [ ] Los backups se crean y limpian automáticamente

### Opción 2: Actualización Manual
- [ ] Actualizar dependencias una por una
  ```bash
  npm install <paquete>@<version>
  ```

### Opción 3: Actualización Completa
- [ ] Ejecutar script de actualización completa (solo testing)
  ```bash
  ./update-dependencies.sh full
  ```

## Validación Post-Actualización

- [ ] Verificar que el build funciona
  ```bash
  npm run build
  ```
- [ ] Probar en modo desarrollo
  ```bash
  npm run dev
  ```
- [ ] Ejecutar auditoría de seguridad
  ```bash
  npm run security-audit
  ```
- [ ] Probar funcionalidad crítica manualmente

## Después de Actualizar

- [ ] Revisar cambios en package.json
- [ ] Commit de los cambios
  ```bash
  git add package.json package-lock.json
  git commit -m "chore: update dependencies"
  ```
- [ ] Push y crear Pull Request

## Enlaces Rápidos

- 📚 [Guía Completa de Actualización](../DEPENDENCY_UPDATE_GUIDE.md)
- 🔒 [Política de Seguridad](../SECURITY.md)
- 🔧 [Script de Actualización](../update-dependencies.sh)
