---
applyTo: "src/**/*.ts,src/**/*.html,src/**/*.css,src/**/*.scss"
---

# Estándares frontend Angular

Aplica estas normas al trabajar en la capa frontend Angular del proyecto.

## Arquitectura Angular 21

- Usa componentes standalone por defecto.
- Usa `ChangeDetectionStrategy.OnPush` en componentes siempre que no exista una restricción real que lo impida.
- Usa `signal`, `computed` y `effect` para estado local y derivado de UI.
- Usa `@if`, `@for` y `@switch` como control flow preferente en templates nuevos o modificados.
- Mantén dependencias explícitas en `imports` del componente y evita acoplamientos ocultos.

## Reutilización y componentización

- Componentiza solo cuando haya reutilización real, reducción clara de complejidad o separación de responsabilidades útil.
- Evita crear componentes de un solo uso si solo envuelven markup simple sin lógica ni valor de mantenimiento.
- Antes de extraer un componente, evalúa si basta con una utilidad, un pipe, un helper puro o un servicio.
- Si una lógica se repite entre pantallas, prioriza moverla a servicios/utilidades antes que duplicarla.
- Reutiliza componentes shared existentes antes de crear otros nuevos con propósito similar.

## Estado y lógica

- Prioriza estado local con signals frente a suscripciones manuales innecesarias.
- Deja RxJS para flujos asíncronos, integración con APIs, streams o composición reactiva real.
- Mantén el componente orientado a presentación/coordinación; mueve lógica compleja o reutilizable a servicios/helpers.
- Evita componentes demasiado grandes mezclando carga de datos, transformación, reglas de negocio y UI si se puede separar con claridad.

## Templates y UI

- Mantén templates legibles y evita duplicación de bloques cuando pueda resolverse con composición razonable.
- No extraigas subcomponentes solo para dividir visualmente el HTML si no mejora mantenimiento o reutilización.
- Conserva accesibilidad básica: labels, botones semánticos, estados disabled, foco y textos comprensibles.
- Conserva i18n en cualquier texto nuevo o modificado cuando aplique en la zona tocada.

## Rendimiento y mantenimiento

- Evita trabajo innecesario en cada render y favorece valores derivados con `computed`.
- Usa `track` en `@for` cuando renderices listas.
- Evita recalcular o duplicar transformaciones si pueden centralizarse en servicios o helpers.
- Mantén APIs de componentes simples y cohesivas.

## Criterio de decisión

- Si una mejora estructural no aporta reutilización real, simplicidad o claridad, no la implementes.
- Si dudas entre crear un componente o una utilidad, prioriza la opción más simple y menos acoplada.
- Si una pantalla ya es grande, extrae primero bloques con lógica reutilizable o secciones claramente aislables.

## Entrega esperada

- Resume de forma breve qué se ha mejorado.
- Explica en una línea por qué se aplicó esa mejora cuando afecte a estructura o reutilización.
- No hagas `git add` salvo instrucción explícita.
