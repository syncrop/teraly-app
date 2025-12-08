# Seguridad y Mantenimiento de Dependencias

## Estado de Seguridad Actual

**Última auditoría:** 2025-12-08  
**Vulnerabilidades encontradas:** 0  
**Estado:** ✅ Seguro

## Auditoría Automática

Este proyecto incluye scripts automatizados para verificar la seguridad de las dependencias:

```bash
# Verificar vulnerabilidades de seguridad
npm run security-audit

# Verificar paquetes desactualizados
npm run check-updates

# Usar el script automatizado
./update-dependencies.sh check
```

## Política de Actualización de Dependencias

### Frecuencia
- **Auditorías de seguridad:** Semanalmente o antes de cada despliegue
- **Actualizaciones de parches:** Mensualmente
- **Actualizaciones menores:** Trimestralmente
- **Actualizaciones mayores:** Según necesidad y previa validación exhaustiva

### Proceso de Actualización

1. **Verificar actualizaciones disponibles:**
   ```bash
   npm run check-updates
   ```

2. **Revisar vulnerabilidades:**
   ```bash
   npm run security-audit
   ```

3. **Actualizar dependencias:**
   ```bash
   # Opción conservadora (recomendada)
   ./update-dependencies.sh conservative
   
   # Opción completa (requiere testing)
   ./update-dependencies.sh full
   ```

4. **Probar el proyecto:**
   ```bash
   npm run build
   npm run dev
   ```

5. **Commit y push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: update dependencies"
   git push
   ```

## Dependencias Críticas

### Angular Framework (v21.0.x)
- **Riesgo:** Bajo
- **Estrategia:** Mantener todas las dependencias de Angular en la misma versión mayor
- **Actualización:** Seguir [Angular Update Guide](https://update.angular.io/)

### Firebase (@angular/fire v21.0.0-rc.0)
- **Estado:** Release Candidate
- **Riesgo:** Medio (no es versión estable)
- **Recomendación:** Monitorear para actualizar a versión estable cuando esté disponible
- **Alternativa estable:** v20.0.1

### Vite (v6.4.1)
- **Actualización disponible:** v7.2.7 (versión mayor)
- **Riesgo de actualización:** Medio
- **Recomendación:** Revisar [changelog de Vite](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md) antes de actualizar

### TailwindCSS (v4.1.17)
- **Estado:** ✅ Actualizado
- **Nota:** Cambiado de "latest" a versión fija para mejor control

## Reportar Vulnerabilidades

Si descubres una vulnerabilidad de seguridad en este proyecto:

1. **NO** abras un issue público
2. Contacta al equipo de desarrollo directamente
3. Proporciona detalles completos de la vulnerabilidad
4. Espera una respuesta dentro de 48 horas

## Herramientas de Seguridad

### npm audit
```bash
npm audit
npm audit --json  # Formato JSON
npm audit fix     # Intentar reparar automáticamente
```

### Consultar GitHub Advisory Database
Las dependencias críticas se verifican automáticamente contra la base de datos de GitHub para vulnerabilidades conocidas.

### Automatización con Dependabot

Se recomienda configurar Dependabot en el repositorio de GitHub para recibir actualizaciones automáticas de seguridad:

1. Ir a Settings → Security → Code security and analysis
2. Habilitar "Dependabot security updates"
3. Habilitar "Dependabot version updates"

Archivo de configuración `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "team/developers"
    labels:
      - "dependencies"
      - "automated"
```

## Recursos

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Angular Security Guide](https://angular.dev/best-practices/security)
- [GitHub Advisory Database](https://github.com/advisories)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

## Contacto

Para preguntas sobre seguridad o políticas de actualización, contactar al equipo de desarrollo.

---

**Última actualización:** 2025-12-08  
**Responsable:** Equipo de Desarrollo
