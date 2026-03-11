#!/usr/bin/env node

/**
 * Auditoría ligera del frontend Angular 21.
 * - Revisa adopción de APIs modernas (standalone, OnPush, signals, control flow).
 * - Detecta componentes demasiado grandes y duplicidades simples.
 * - Sugiere composición/reutilización solo cuando aporta valor real.
 * - Genera un informe breve en Markdown con el "qué" y el "por qué".
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const srcRoot = path.join(workspaceRoot, 'src');
const componentsRoot = path.join(srcRoot, 'components');
const reportPath = path.join(workspaceRoot, 'reports', 'angular21-front-audit.md');
const strictMode = process.argv.includes('--strict');

const THRESHOLDS = {
  largeTsLines: 350,
  largeHtmlLines: 220,
  veryLargeTsLines: 600,
  veryLargeHtmlLines: 350,
  highSignalCount: 10,
  lowSharedUsage: 1,
};

async function main() {
  await ensureDirectory(path.dirname(reportPath));

  const componentTsFiles = await collectFiles(componentsRoot, (file) => file.endsWith('.component.ts'));
  const routeFile = path.join(srcRoot, 'app.routes.ts');
  const routeFileContent = await readTextIfExists(routeFile);

  const components = await Promise.all(componentTsFiles.map(analyzeComponent));
  const sharedComponents = components.filter((component) => component.relativePath.includes('/components/shared/'));

  const importUsageIndex = buildImportUsageIndex(components);
  const selectorUsageIndex = buildSelectorUsageIndex(components);
  const duplicateBaseNames = findDuplicateBaseNames(components);
  const findings = [];

  for (const component of components) {
    const componentFindings = evaluateComponent(component, {
      importUsageIndex,
      selectorUsageIndex,
      routeFileContent,
    });
    findings.push(...componentFindings);
  }

  for (const sharedComponent of sharedComponents) {
    const usageCount = Math.max(
      importUsageIndex.get(sharedComponent.className) ?? 0,
      selectorUsageIndex.get(sharedComponent.selector) ?? 0,
    );

    if (usageCount <= THRESHOLDS.lowSharedUsage) {
      findings.push({
        severity: 'info',
        title: `Revisar si ${sharedComponent.name} debe seguir siendo shared`,
        file: sharedComponent.relativePath,
        reason: 'Un componente compartido con uso único suele añadir acoplamiento y carpetas extra sin aportar reutilización real.',
        suggestion: 'Si sigue teniendo un único uso tras próximos cambios, mantenlo cerca de la feature en vez de crecer la librería shared.',
      });
    }
  }

  for (const duplicate of duplicateBaseNames) {
    findings.push({
      severity: 'warn',
      title: `Nombre de componente repetido: ${duplicate.baseName}`,
      file: duplicate.paths.join(' · '),
      reason: 'Los nombres repetidos dificultan búsquedas, imports y mantenimiento en una base standalone/lazy.',
      suggestion: 'Renombra por contexto funcional para evitar ambigüedad (por ejemplo, screen vs feature summary).',
    });
  }

  const summary = buildSummary(components, findings);
  const markdown = renderMarkdown({ summary, findings, components, sharedComponents, duplicateBaseNames });

  await fs.writeFile(reportPath, markdown, 'utf8');

  console.log(`✔ Informe generado en ${path.relative(workspaceRoot, reportPath)}`);
  console.log(`✔ ${summary.totalComponents} componentes auditados`);
  console.log(`✔ ${summary.standaloneCount} standalone, ${summary.onPushCount} con OnPush, ${summary.signalDrivenCount} con signals/computed/effect`);
  console.log(`✔ ${summary.highSeverityCount} hallazgos altos, ${summary.mediumSeverityCount} medios, ${summary.infoCount} informativos`);

  if (strictMode && summary.highSeverityCount > 0) {
    process.exitCode = 2;
  }
}

async function analyzeComponent(tsFilePath) {
  const tsContent = await fs.readFile(tsFilePath, 'utf8');
  const htmlFilePath = tsFilePath.replace(/\.component\.ts$/, '.component.html');
  const htmlContent = await readTextIfExists(htmlFilePath);

  const relativePath = toRelative(tsFilePath);
  const className = matchOne(tsContent, /export\s+class\s+(\w+)/)?.[1] ?? path.basename(tsFilePath, '.ts');
  const selector = matchOne(tsContent, /selector:\s*'([^']+)'/)?.[1] ?? '';
  const importsBlock = matchOne(tsContent, /imports:\s*\[([\s\S]*?)\]/)?.[1] ?? '';

  const signalCount = countMatches(tsContent, /\bsignal\s*\(/g);
  const computedCount = countMatches(tsContent, /\bcomputed\s*\(/g);
  const effectCount = countMatches(tsContent, /\beffect\s*\(/g);
  const inputCount = countMatches(tsContent, /\binput\s*\(/g);
  const outputCount = countMatches(tsContent, /\boutput\s*\(/g);
  const rxjsSubscribeCount = countMatches(tsContent, /\.subscribe\s*\(/g);
  const oldStructuralDirectives = countMatches(htmlContent, /\*ngIf|\*ngFor|\*ngSwitch/g);
  const newControlFlowCount = countMatches(`${tsContent}\n${htmlContent}`, /@if\s*\(|@for\s*\(|@switch\s*\(/g);
  const methodCount = countPublicMethods(tsContent);
  const lazyLoaded = selector ? isLikelyLazyLoaded(relativePath) : false;

  return {
    name: path.basename(tsFilePath, '.component.ts'),
    className,
    selector,
    tsFilePath,
    htmlFilePath,
    htmlContent,
    relativePath,
    relativeHtmlPath: toRelative(htmlFilePath),
    tsLines: lineCount(tsContent),
    htmlLines: lineCount(htmlContent),
    standalone: /standalone:\s*true/.test(tsContent),
    onPush: /changeDetection:\s*ChangeDetectionStrategy\.OnPush/.test(tsContent),
    signalsUsed: signalCount + computedCount + effectCount > 0,
    signalCount,
    computedCount,
    effectCount,
    inputCount,
    outputCount,
    rxjsSubscribeCount,
    oldStructuralDirectives,
    newControlFlowCount,
    methodCount,
    importsBlock,
    imports: splitImports(importsBlock),
    htmlExists: htmlContent.length > 0,
    shared: relativePath.includes('/components/shared/'),
    lazyLoaded,
  };
}

function evaluateComponent(component, context) {
  const findings = [];

  if (!component.standalone) {
    findings.push({
      severity: 'warn',
      title: `${component.className} no usa standalone`,
      file: component.relativePath,
      reason: 'Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.',
      suggestion: 'Migra a standalone si no existe una razón fuerte para mantener NgModule local.',
    });
  }

  if (!component.onPush) {
    findings.push({
      severity: 'warn',
      title: `${component.className} no usa OnPush`,
      file: component.relativePath,
      reason: 'OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.',
      suggestion: 'Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.',
    });
  }

  if (component.oldStructuralDirectives > 0) {
    findings.push({
      severity: 'warn',
      title: `${component.className} sigue usando *ngIf/*ngFor`,
      file: component.relativeHtmlPath,
      reason: 'El control flow nativo de Angular 21 mejora legibilidad, scope y consistencia con el resto del proyecto.',
      suggestion: 'Migra a @if/@for/@switch al tocar esa pantalla para mantener coherencia moderna.',
    });
  }

  if (component.tsLines >= THRESHOLDS.veryLargeTsLines || component.htmlLines >= THRESHOLDS.veryLargeHtmlLines) {
    findings.push({
      severity: 'high',
      title: `${component.className} es un componente muy grande`,
      file: `${component.relativePath}${component.htmlExists ? ` · ${component.relativeHtmlPath}` : ''}`,
      reason: 'Un componente enorme suele mezclar layout, estado y reglas de negocio, lo que dificulta pruebas y reutilización.',
      suggestion: 'Extrae solo subbloques con valor real de reutilización o complejidad aislable (cards, headers, panels, lists).',
    });
  } else if (component.tsLines >= THRESHOLDS.largeTsLines || component.htmlLines >= THRESHOLDS.largeHtmlLines) {
    findings.push({
      severity: 'warn',
      title: `${component.className} empieza a pedir composición`,
      file: `${component.relativePath}${component.htmlExists ? ` · ${component.relativeHtmlPath}` : ''}`,
      reason: 'Separar secciones con responsabilidades claras mejora mantenimiento sin crear componentes artificiales.',
      suggestion: 'Revisa si parte del template puede moverse a un child component o a utilidades puras compartidas.',
    });
  }

  if (!component.shared && component.signalCount >= THRESHOLDS.highSignalCount && component.methodCount >= 10) {
    findings.push({
      severity: 'warn',
      title: `${component.className} concentra demasiado estado local`,
      file: component.relativePath,
      reason: 'Muchas signals + muchos métodos suelen indicar que la feature mezcla varios subflujos en una sola clase.',
      suggestion: 'Evalúa extraer facades/helpers o subcomponentes de UI antes de seguir creciendo esta pantalla.',
    });
  }

  if (!component.signalsUsed && component.rxjsSubscribeCount >= 3) {
    findings.push({
      severity: 'info',
      title: `${component.className} puede modernizar parte del estado`,
      file: component.relativePath,
      reason: 'Angular 21 ofrece signals/computed/effect para estado de UI más simple y menos suscripciones manuales.',
      suggestion: 'Cuando toques esta feature, mueve estado local a signals y deja RxJS para streams asíncronos reales.',
    });
  }

  if (component.shared) {
    const usageCount = Math.max(
      context.importUsageIndex.get(component.className) ?? 0,
      context.selectorUsageIndex.get(component.selector) ?? 0,
    );

    if (usageCount >= 3) {
      findings.push({
        severity: 'info',
        title: `${component.className} sí está aportando reutilización`,
        file: component.relativePath,
        reason: 'Tener varias referencias confirma que este shared evita duplicación real.',
        suggestion: 'Mantén este componente como pieza reusable y evita reimplementar su UI en pantallas nuevas.',
      });
    }
  }

  if (component.lazyLoaded === false && component.relativePath.includes('/components/page/')) {
    const routeToken = path.basename(component.relativePath, '.component.ts');
    if (context.routeFileContent && !context.routeFileContent.includes(routeToken)) {
      findings.push({
        severity: 'info',
        title: `${component.className} no parece lazy-loaded por ruta`,
        file: component.relativePath,
        reason: 'En Angular 21 las pantallas aisladas funcionan mejor con loadComponent para reducir bundle inicial.',
        suggestion: 'Verifica si es una pantalla auxiliar reutilizada internamente o si conviene exponerla con lazy loading.',
      });
    }
  }

  return findings;
}

function buildImportUsageIndex(components) {
  const usage = new Map();

  for (const component of components) {
    for (const importedSymbol of component.imports) {
      usage.set(importedSymbol, (usage.get(importedSymbol) ?? 0) + 1);
    }
  }

  return usage;
}

function buildSelectorUsageIndex(components) {
  const usage = new Map();

  for (const target of components) {
    if (!target.selector) continue;

    const selectorRegex = new RegExp(`<${escapeRegExp(target.selector)}(?=\\s|>|/)`, 'g');
    let count = 0;

    for (const source of components) {
      if (source.relativePath === target.relativePath) continue;
      count += countMatches(source.htmlContent, selectorRegex);
    }

    usage.set(target.selector, count);
  }

  return usage;
}

function findDuplicateBaseNames(components) {
  const groups = new Map();

  for (const component of components) {
    const baseName = path.basename(component.relativePath);
    if (!groups.has(baseName)) groups.set(baseName, []);
    groups.get(baseName).push(component.relativePath);
  }

  return [...groups.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([baseName, paths]) => ({ baseName, paths }));
}

function buildSummary(components, findings) {
  return {
    totalComponents: components.length,
    standaloneCount: components.filter((c) => c.standalone).length,
    onPushCount: components.filter((c) => c.onPush).length,
    signalDrivenCount: components.filter((c) => c.signalsUsed).length,
    controlFlowModernCount: components.filter((c) => c.newControlFlowCount > 0).length,
    largeComponentsCount: findings.filter((f) => f.title.includes('grande') || f.title.includes('composición')).length,
    highSeverityCount: findings.filter((f) => f.severity === 'high').length,
    mediumSeverityCount: findings.filter((f) => f.severity === 'warn').length,
    infoCount: findings.filter((f) => f.severity === 'info').length,
  };
}

function renderMarkdown({ summary, findings, components, sharedComponents, duplicateBaseNames }) {
  const orderedFindings = findings.sort(bySeverityThenTitle);
  const now = new Date().toISOString();
  const largestComponents = [...components]
    .sort((a, b) => (b.tsLines + b.htmlLines) - (a.tsLines + a.htmlLines))
    .slice(0, 8);

  return [
    '# Auditoría frontend Angular 21',
    '',
    `Generado: ${now}`,
    '',
    '## Resumen',
    '',
    `- Componentes auditados: **${summary.totalComponents}**`,
    `- Standalone: **${summary.standaloneCount}/${summary.totalComponents}**`,
    `- Con OnPush: **${summary.onPushCount}/${summary.totalComponents}**`,
    `- Con signals/computed/effect: **${summary.signalDrivenCount}/${summary.totalComponents}**`,
    `- Con control flow moderno detectado: **${summary.controlFlowModernCount}/${summary.totalComponents}**`,
    `- Hallazgos altos: **${summary.highSeverityCount}**`,
    `- Hallazgos medios: **${summary.mediumSeverityCount}**`,
    `- Hallazgos informativos: **${summary.infoCount}**`,
    '',
    '## Criterio usado',
    '',
    '- Se favorece **standalone + OnPush + signals + control flow nativo** como base de Angular 21.',
    '- Solo se recomienda componentizar cuando la separación mejora mantenimiento o reutilización real.',
    '- Un componente shared con uso único se marca como revisión, no como refactor obligatorio.',
    '- Los comentarios del informe son deliberadamente breves: indican mejora y motivo en una línea.',
    '',
    '## Componentes más grandes',
    '',
    ...largestComponents.map((component) => `- ${component.relativePath}: ${component.tsLines} líneas TS + ${component.htmlLines} líneas HTML`),
    '',
    '## Hallazgos',
    '',
    ...(orderedFindings.length
      ? orderedFindings.map((finding) => [
          `### [${finding.severity.toUpperCase()}] ${finding.title}`,
          '',
          `- Archivo: ${finding.file}`,
          `- Motivo: ${finding.reason}`,
          `- Mejora: ${finding.suggestion}`,
          '',
        ].join('\n'))
      : ['- Sin hallazgos relevantes.']) ,
    '',
    '## Señales positivas detectadas',
    '',
    `- Shared components auditados: **${sharedComponents.length}**`,
    `- Duplicidades de nombre detectadas: **${duplicateBaseNames.length}**`,
    '- El proyecto ya usa bastante Angular moderno, por lo que las mejoras recomendadas son selectivas y no destructivas.',
    '',
    '## Uso',
    '',
    '- Ejecutar: `npm run audit:front:angular21`',
    '- Modo estricto: `npm run audit:front:angular21:strict`',
    '- Salida: `reports/angular21-front-audit.md`',
    '',
  ].join('\n');
}

function bySeverityThenTitle(a, b) {
  const weight = { high: 0, warn: 1, info: 2 };
  return (weight[a.severity] - weight[b.severity]) || a.title.localeCompare(b.title);
}

function splitImports(importsBlock) {
  return importsBlock
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => /^[A-Z][A-Za-z0-9_]+$/.test(part));
}

function countPublicMethods(tsContent) {
  const matches = tsContent.match(/\n\s{2,}(?:async\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s*\([^;{]*\)\s*\{/g);
  return matches?.length ?? 0;
}

function isLikelyLazyLoaded(relativePath) {
  return relativePath.includes('/components/page/');
}

async function collectFiles(root, predicate) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, predicate));
      continue;
    }

    if (predicate(fullPath)) files.push(fullPath);
  }

  return files;
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function toRelative(filePath) {
  return path.relative(workspaceRoot, filePath).split(path.sep).join('/');
}

function countMatches(content, regex) {
  if (!content) return 0;
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const safeRegex = new RegExp(regex.source, flags);
  return [...content.matchAll(safeRegex)].length;
}

function matchOne(content, regex) {
  return content.match(regex);
}

function lineCount(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error('✖ Error ejecutando la auditoría Angular 21');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
