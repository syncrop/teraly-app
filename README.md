<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Teraly - Plataforma de Salud Mental

Teraly es una plataforma moderna de salud mental construida con Angular 21, diseñada para conectar clientes con profesionales de la salud mental. La aplicación ofrece funcionalidades de autenticación, gestión de citas, seguimiento del estado de ánimo y soporte multiidioma.

View your app in AI Studio: https://ai.studio/apps/drive/1lpGjQkwyFVMXre2vvyzFwvSwYTOyCrCP

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración del Entorno](#configuración-del-entorno)
- [Ejecución en Desarrollo](#ejecución-en-desarrollo)
- [Compilación](#compilación)
- [Despliegue](#despliegue)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Documentación de API](#documentación-de-api)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## ✨ Características

- **Autenticación de Usuarios**: Sistema completo de registro e inicio de sesión con Firebase Authentication
- **Roles de Usuario**: Soporte para clientes y doctores con permisos diferenciados
- **Gestión de Citas**: Creación y seguimiento de citas médicas
- **Seguimiento de Estado de Ánimo**: Herramienta para registrar y monitorear el estado emocional
- **Internacionalización (i18n)**: Soporte multiidioma (Inglés, Español, Polaco, Ucraniano)
- **Interfaz Moderna**: UI responsive construida con TailwindCSS
- **Base de Datos en Tiempo Real**: Integración con Firebase Firestore
- **Arquitectura Modular**: Componentes y servicios reutilizables

## 🛠️ Tecnologías Utilizadas

- **Framework**: Angular 21
- **Lenguaje**: TypeScript 5.9
- **Backend/Base de Datos**: Firebase (Authentication & Firestore)
- **Estilos**: TailwindCSS
- **Build Tool**: Vite 6.2
- **Gestor de Estado**: Angular Signals
- **Gestión Reactiva**: RxJS 7.8

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js**: versión 18.x o superior
- **npm**: versión 9.x o superior (incluido con Node.js)
- **Git**: para control de versiones
- **Cuenta de Firebase**: para servicios de backend

Verifica las instalaciones ejecutando:
```bash
node --version
npm --version
git --version
```

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/syncrop/teraly-app.git
   cd teraly-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

   Este comando instalará todas las dependencias necesarias listadas en `package.json`, incluyendo:
   - Angular 21 y sus módulos core
   - Firebase SDK
   - TailwindCSS
   - TypeScript y herramientas de desarrollo

## ⚙️ Configuración del Entorno

### Configuración de Firebase

1. **Crear un proyecto en Firebase Console**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto o usa uno existente
   - Habilita Authentication (Email/Password)
   - Crea una base de datos Firestore

2. **Obtener credenciales de Firebase**
   - En la configuración del proyecto, selecciona "Agregar aplicación web"
   - Copia las credenciales de configuración

3. **Configurar variables de entorno** (opcional)
   
   Si la aplicación requiere variables de entorno, crea un archivo `.env.local`:
   ```bash
   # Ejemplo de configuración
   GEMINI_API_KEY=tu_clave_api_aqui
   ```

4. **Configurar Firebase en la aplicación**
   
   Busca el archivo de configuración de Firebase en tu proyecto y actualiza con tus credenciales:
   ```typescript
   // Ejemplo de configuración
   export const firebaseConfig = {
     apiKey: "TU_API_KEY",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto-id",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "123456789",
     appId: "tu-app-id"
   };
   ```

### Configuración de Firestore

Crea las siguientes colecciones en Firestore:

- **users**: Para almacenar perfiles de usuario
  ```json
  {
    "uid": "string",
    "email": "string",
    "fullName": "string",
    "role": "client | doctor",
    "createdAt": "timestamp",
    "specialty": "string (opcional)",
    "licenseNumber": "string (opcional)",
    "isVerified": "boolean"
  }
  ```

- **appointments**: Para gestionar citas
  ```json
  {
    "patientId": "string",
    "specialistId": "string",
    "date": "timestamp",
    "status": "pending | confirmed | completed | cancelled",
    "notes": "string (opcional)"
  }
  ```

## 💻 Ejecución en Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en:
- **URL**: http://localhost:3000
- **Hot Reload**: Los cambios se reflejarán automáticamente

### Características del Servidor de Desarrollo

- ⚡ Hot Module Replacement (HMR) con Vite
- 🔍 Source maps para debugging
- 🎨 Compilación de TailwindCSS en tiempo real
- 📱 Responsive design testing

## 🏗️ Compilación

### Build de Producción

Para crear una versión optimizada para producción:

```bash
npm run build
```

Este comando:
- Compila TypeScript a JavaScript
- Optimiza y minimiza el código
- Genera hashes para cache-busting
- Procesa y optimiza assets
- Aplica tree-shaking para reducir el tamaño del bundle

Los archivos compilados se generarán en el directorio `dist/`.

### Build de Vista Previa

Para probar la build de producción localmente:

```bash
npm run preview
```

Esto ejecutará el servidor con la configuración de producción en http://localhost:3000

## 🚢 Despliegue

### Despliegue en Firebase Hosting

1. **Instalar Firebase CLI** (si no lo tienes):
   ```bash
   npm install -g firebase-tools
   ```

2. **Autenticarse con Firebase**:
   ```bash
   firebase login
   ```

3. **Inicializar Firebase Hosting** (si es la primera vez):
   ```bash
   firebase init hosting
   ```
   
   Selecciona:
   - Public directory: `dist`
   - Single-page app: Yes
   - Automatic builds with GitHub: Opcional

4. **Compilar la aplicación**:
   ```bash
   npm run build
   ```

5. **Desplegar a Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

Tu aplicación estará disponible en: `https://tu-proyecto.web.app`

### Despliegue en Otras Plataformas

#### Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

#### Netlify
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Desplegar
netlify deploy --prod --dir=dist
```

#### GitHub Pages
1. Configura el `base` en `angular.json` con el nombre de tu repositorio
2. Usa el paquete `angular-cli-ghpages`:
   ```bash
   npm install -g angular-cli-ghpages
   ng build --base-href "https://usuario.github.io/teraly-app/"
   npx angular-cli-ghpages --dir=dist
   ```

## 📁 Estructura del Proyecto

```
teraly-app/
├── src/
│   ├── app.component.ts          # Componente raíz de la aplicación
│   ├── app.routes.ts              # Configuración de rutas
│   ├── components/                # Componentes de la aplicación
│   │   ├── auth/                  # Componentes de autenticación
│   │   │   ├── login/             # Página de login
│   │   │   ├── register/          # Página de registro
│   │   │   ├── forgot-password/   # Recuperación de contraseña
│   │   │   └── auth-layout/       # Layout de autenticación
│   │   ├── page/                  # Páginas principales
│   │   │   ├── client-home/       # Dashboard de clientes
│   │   │   ├── doctor-home/       # Dashboard de doctores
│   │   │   ├── profile/           # Página de perfil
│   │   │   └── search/            # Búsqueda de especialistas
│   │   └── shared/                # Componentes compartidos
│   │       ├── logo/              # Componente de logo
│   │       ├── footer/            # Componente de pie de página
│   │       └── moods/             # Componente de seguimiento de ánimo
│   ├── services/                  # Servicios de Angular
│   │   ├── auth.service.ts        # Servicio de autenticación
│   │   ├── firebase.service.ts    # Servicio de Firestore
│   │   ├── i18n.service.ts        # Servicio de internacionalización
│   │   └── translation.service.ts # Servicio de traducciones
│   ├── guards/                    # Guards de rutas
│   └── assets/                    # Recursos estáticos
├── angular.json                   # Configuración de Angular
├── tsconfig.json                  # Configuración de TypeScript
├── package.json                   # Dependencias y scripts
├── firebase.json                  # Configuración de Firebase
├── index.html                     # HTML principal
├── index.tsx                      # Punto de entrada de la aplicación
└── README.md                      # Este archivo
```

## 📜 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Desarrollo | `npm run dev` | Inicia el servidor de desarrollo en puerto 3000 |
| Build | `npm run build` | Crea una build de producción optimizada |
| Preview | `npm run preview` | Sirve la build de producción localmente |

## 📚 Documentación de API

### Servicios Principales

#### AuthService
Gestiona la autenticación y autorización de usuarios.

**Métodos principales:**
- `login(email, password)`: Inicia sesión
- `register(email, password, fullName, userType, licenseNumber?)`: Registra un nuevo usuario
- `logout()`: Cierra la sesión actual
- `resetPassword(email)`: Envía email de recuperación
- `isAuthenticated()`: Verifica si hay un usuario autenticado
- `getCurrentUser()`: Obtiene los datos del usuario actual

**Ejemplo de uso:**
```typescript
import { AuthService } from './services/auth.service';

constructor(private authService: AuthService) {}

login() {
  this.authService.login('user@example.com', 'password123')
    .subscribe(result => {
      if (result.success) {
        console.log('Login exitoso:', result.role);
      }
    });
}
```

#### FirestoreService
Gestiona operaciones CRUD con Firestore.

**Métodos principales:**
- `registerUser(email, pass, userData)`: Registra usuario en Firestore
- `getUserProfile(uid)`: Obtiene perfil de usuario
- `createAppointment(appointment)`: Crea una cita
- `getMyAppointments(uid, role)`: Obtiene citas del usuario
- `getVerifiedSpecialists()`: Lista especialistas verificados

#### I18nService
Gestiona la internacionalización de la aplicación.

**Métodos principales:**
- `setLanguage(langCode)`: Cambia el idioma de la aplicación
- `currentLang`: Signal con el idioma actual
- `availableLanguages`: Lista de idiomas disponibles

#### TranslationService
Gestiona traducciones dinámicas.

**Métodos principales:**
- `setTranslations(trans)`: Establece diccionario de traducciones
- `getTranslation(key, defaultValue)`: Obtiene una traducción

### Componentes Públicos

#### LogoComponent
Muestra el logo de la aplicación.
```html
<app-logo></app-logo>
```

#### FooterComponent
Pie de página con navegación.
```html
<app-footer></app-footer>
```

#### MoodsComponent
Componente de seguimiento de estado de ánimo.
```html
<app-moods></app-moods>
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

**Desarrollado con ❤️ usando Angular y Firebase**
