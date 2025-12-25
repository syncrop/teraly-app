# Testing con Karma y Jasmine

Este proyecto utiliza **Karma** como test runner y **Jasmine** como framework de testing para ejecutar pruebas unitarias en Angular.

## 📋 Configuración

### Dependencias Instaladas

- `karma`: Test runner
- `karma-jasmine`: Adaptador de Jasmine para Karma
- `karma-chrome-launcher`: Launcher para ejecutar tests en Chrome
- `karma-jasmine-html-reporter`: Reporter HTML para ver resultados
- `karma-coverage`: Generador de reportes de cobertura
- `jasmine-core`: Framework de testing
- `@types/jasmine`: Tipos de TypeScript para Jasmine

### Archivos de Configuración

- `karma.conf.js`: Configuración principal de Karma
- `tsconfig.spec.json`: Configuración de TypeScript específica para tests
- `src/test.ts`: Archivo de inicialización del entorno de testing

## 🚀 Comandos Disponibles

### Ejecutar Tests en Modo Watch

```bash
npm test
```

Este comando ejecuta los tests en modo watch, abriendo Chrome y mostrando los resultados. Los tests se re-ejecutan automáticamente cuando guardas cambios.

### Ejecutar Tests en Modo Headless (CI)

```bash
npm run test:headless
```

Ejecuta los tests una sola vez en modo headless (sin interfaz gráfica), ideal para integración continua.

### Ejecutar Tests con Cobertura

```bash
npm run test:coverage
```

Ejecuta los tests y genera un reporte de cobertura de código en la carpeta `./coverage`.

## 📁 Estructura de Tests

Los archivos de test siguen la convención `.spec.ts` y están ubicados junto a los archivos que prueban:

```
src/
├── services/
│   ├── auth.service.ts
│   ├── auth.service.spec.ts
│   ├── user.service.ts
│   ├── user.service.spec.ts
│   ├── appointment.service.ts
│   ├── appointment.service.spec.ts
│   ├── storage.service.ts
│   ├── storage.service.spec.ts
│   ├── toast.service.ts
│   └── toast.service.spec.ts
├── components/
│   └── auth/
│       └── login/
│           ├── login.component.ts
│           └── login.component.spec.ts
└── guards/
    ├── access.guard.ts
    └── access.guard.spec.ts
```

## 📊 Tests Implementados

### Servicios

#### AuthService (auth.service.spec.ts)

- ✅ Creación del servicio
- ✅ Inicialización con roles guardados
- ✅ Login exitoso de clientes y doctores
- ✅ Manejo de errores de login
- ✅ Registro de nuevos usuarios
- ✅ Recuperación de contraseña
- ✅ Logout y limpieza de datos
- ✅ Verificación de autenticación
- ✅ Obtención de ID de usuario

#### UserService (user.service.spec.ts)

- ✅ Obtener usuario por ID
- ✅ Obtener lista de doctores
- ✅ Obtener doctor específico
- ✅ Obtener lista de clientes
- ✅ Actualizar foto de perfil
- ✅ Eliminar foto de perfil
- ✅ Refrescar datos de usuario

#### AppointmentService (appointment.service.spec.ts)

- ✅ Obtener citas de doctor
- ✅ Obtener citas de cliente
- ✅ Obtener cita por ID
- ✅ Crear nueva cita
- ✅ Actualizar cita
- ✅ Cambiar estado de cita (confirmar, cancelar, completar)
- ✅ Eliminar cita
- ✅ Verificar disponibilidad de horario
- ✅ Obtener estadísticas de citas
- ✅ Filtrar citas por rango de fechas

#### StorageService (storage.service.spec.ts)

- ✅ Subir foto de perfil
- ✅ Eliminar foto de perfil
- ✅ Subir archivos generales

#### ToastService (toast.service.spec.ts)

- ✅ Mostrar toast con mensaje personalizado
- ✅ Auto-ocultar después de duración especificada
- ✅ Ocultar toast manualmente
- ✅ Mostrar toasts de éxito, error e info
- ✅ Limpiar timeout al mostrar nuevo toast

### Componentes

#### LoginComponent (login.component.spec.ts)

- ✅ Creación del componente
- ✅ Validación de formulario
- ✅ Login exitoso de cliente
- ✅ Login exitoso de doctor con perfil completo
- ✅ Redirección de doctor con perfil incompleto
- ✅ Manejo de errores de login
- ✅ Estado de carga durante login
- ✅ Computación de estado de envío

### Guards

#### accessGuard (access.guard.spec.ts)

- ✅ Permitir acceso a rutas noAuth sin autenticación
- ✅ Redireccionar usuarios autenticados desde rutas noAuth
- ✅ Redireccionar usuarios no autenticados a login
- ✅ Verificar roles requeridos
- ✅ Redireccionar usuarios con rol incorrecto

## 🎯 Escribir Nuevos Tests

### Ejemplo de Test de Servicio

```typescript
import { TestBed } from "@angular/core/testing";
import { MiServicio } from "./mi-servicio.service";

describe("MiServicio", () => {
  let service: MiServicio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MiServicio);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return expected value", () => {
    const result = service.metodo();
    expect(result).toBe(expectedValue);
  });
});
```

### Ejemplo de Test de Componente

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MiComponente } from "./mi-componente.component";

describe("MiComponente", () => {
  let component: MiComponente;
  let fixture: ComponentFixture<MiComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(MiComponente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render title", () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector("h1").textContent).toContain("Título");
  });
});
```

## 📈 Cobertura de Código

Los reportes de cobertura se generan en la carpeta `./coverage` después de ejecutar:

```bash
npm run test:coverage
```

Para ver el reporte HTML:

```bash
open coverage/index.html
```

## 🔧 Troubleshooting

### Error: Chrome no encontrado

Si Karma no encuentra Chrome, puedes usar ChromeHeadless:

```bash
npm run test:headless
```

### Tests lentos

Asegúrate de usar `fdescribe` y `fit` solo durante desarrollo para ejecutar tests específicos.

### Error de timeout

Aumenta el timeout en `karma.conf.js`:

```javascript
browserNoActivityTimeout: 60000;
```

## 📚 Recursos

- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Documentation](https://karma-runner.github.io/)
- [Angular Testing Guide](https://angular.io/guide/testing)
