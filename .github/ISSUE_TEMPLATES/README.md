# Security Issue Templates

Esta carpeta contiene templates de issues para las vulnerabilidades de seguridad identificadas en el análisis de seguridad de Teraly Mental Health Platform.

## Resumen de Issues

| Issue | Severidad | Estado | Prioridad |
|-------|-----------|--------|-----------|
| [SECURITY-001](./SECURITY-001-sensitive-data-logging.md) | 🔴 Alta | Pendiente | Crítica |
| [SECURITY-002](./SECURITY-002-insecure-token-storage.md) | 🟠 Media-Alta | Pendiente | Alta |
| [SECURITY-003](./SECURITY-003-data-sanitization.md) | 🟡 Media | Pendiente | Media |
| [SECURITY-004](./SECURITY-004-firestore-rules.md) | 🟡 Media-Alta | Pendiente | Crítica |
| [SECURITY-005](./SECURITY-005-password-validation.md) | 🟡 Media | Pendiente | Media |
| [SECURITY-006](./SECURITY-006-url-validation.md) | 🟡 Media | Pendiente | Baja |
| [SECURITY-007](./SECURITY-007-rate-limiting.md) | 🔵 Baja-Media | Pendiente | Media |

## Cómo Usar

1. **Crear Issues en GitHub:**
   - Ir a la pestaña "Issues" del repositorio
   - Clic en "New Issue"
   - Copiar el contenido de cada template
   - Asignar labels, milestone, y responsables

2. **Priorización:**
   - Comenzar con issues marcadas como "Crítica" (SECURITY-001, SECURITY-004)
   - Continuar con prioridad "Alta" (SECURITY-002)
   - Implementar las demás según capacidad del equipo

3. **Tracking:**
   - Actualizar el estado en este README conforme se resuelvan
   - Mantener referencia cruzada con PRs
   - Documentar decisiones y cambios realizados

## Documentación Relacionada

- **Análisis Completo:** Ver `/SECURITY_ANALYSIS.md` para detalles técnicos exhaustivos
- **Plan de Implementación:** Ver `/SECURITY_ROADMAP.md` para el roadmap completo
- **Issues en GitHub:** [Ir a Issues](../../issues?q=is%3Aissue+label%3Asecurity)

## Contacto

Para preguntas sobre seguridad, contactar al equipo de seguridad del proyecto.

---

**Última actualización:** 2024-12-08
