# Auditoría frontend Angular 21

Generado: 2026-03-11T17:59:07.091Z

## Resumen

- Componentes auditados: **35**
- Standalone: **22/35**
- Con OnPush: **24/35**
- Con signals/computed/effect: **20/35**
- Con control flow moderno detectado: **27/35**
- Hallazgos altos: **4**
- Hallazgos medios: **33**
- Hallazgos informativos: **9**

## Criterio usado

- Se favorece **standalone + OnPush + signals + control flow nativo** como base de Angular 21.
- Solo se recomienda componentizar cuando la separación mejora mantenimiento o reutilización real.
- Un componente shared con uso único se marca como revisión, no como refactor obligatorio.
- Los comentarios del informe son deliberadamente breves: indican mejora y motivo en una línea.

## Componentes más grandes

- src/components/page/doctor-pages/doctor-detail/doctor-detail.component.ts: 866 líneas TS + 446 líneas HTML
- src/components/page/calendar/calendar.component.ts: 480 líneas TS + 585 líneas HTML
- src/components/page/search/search.component.ts: 289 líneas TS + 439 líneas HTML
- src/components/page/calendar/add-appointment-modal/add-appointment-modal.component.ts: 347 líneas TS + 362 líneas HTML
- src/components/page/appointments/appointments.component.ts: 387 líneas TS + 228 líneas HTML
- src/components/page/availability/availability.component.ts: 291 líneas TS + 282 líneas HTML
- src/components/page/profile/doctor-profile/doctor-profile.component.ts: 186 líneas TS + 323 líneas HTML
- src/components/page/video-call/video-call.component.ts: 321 líneas TS + 159 líneas HTML

## Hallazgos

### [HIGH] AddAppointmentModalComponent es un componente muy grande

- Archivo: src/components/page/calendar/add-appointment-modal/add-appointment-modal.component.ts · src/components/page/calendar/add-appointment-modal/add-appointment-modal.component.html
- Motivo: Un componente enorme suele mezclar layout, estado y reglas de negocio, lo que dificulta pruebas y reutilización.
- Mejora: Extrae solo subbloques con valor real de reutilización o complejidad aislable (cards, headers, panels, lists).

### [HIGH] CalendarComponent es un componente muy grande

- Archivo: src/components/page/calendar/calendar.component.ts · src/components/page/calendar/calendar.component.html
- Motivo: Un componente enorme suele mezclar layout, estado y reglas de negocio, lo que dificulta pruebas y reutilización.
- Mejora: Extrae solo subbloques con valor real de reutilización o complejidad aislable (cards, headers, panels, lists).

### [HIGH] DoctorDetailComponent es un componente muy grande

- Archivo: src/components/page/doctor-pages/doctor-detail/doctor-detail.component.ts · src/components/page/doctor-pages/doctor-detail/doctor-detail.component.html
- Motivo: Un componente enorme suele mezclar layout, estado y reglas de negocio, lo que dificulta pruebas y reutilización.
- Mejora: Extrae solo subbloques con valor real de reutilización o complejidad aislable (cards, headers, panels, lists).

### [HIGH] SearchComponent es un componente muy grande

- Archivo: src/components/page/search/search.component.ts · src/components/page/search/search.component.html
- Motivo: Un componente enorme suele mezclar layout, estado y reglas de negocio, lo que dificulta pruebas y reutilización.
- Mejora: Extrae solo subbloques con valor real de reutilización o complejidad aislable (cards, headers, panels, lists).

### [WARN] AddAppointmentModalComponent concentra demasiado estado local

- Archivo: src/components/page/calendar/add-appointment-modal/add-appointment-modal.component.ts
- Motivo: Muchas signals + muchos métodos suelen indicar que la feature mezcla varios subflujos en una sola clase.
- Mejora: Evalúa extraer facades/helpers o subcomponentes de UI antes de seguir creciendo esta pantalla.

### [WARN] AddAppointmentModalComponent no usa OnPush

- Archivo: src/components/page/calendar/add-appointment-modal/add-appointment-modal.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] AppointmentsComponent empieza a pedir composición

- Archivo: src/components/page/appointments/appointments.component.ts · src/components/page/appointments/appointments.component.html
- Motivo: Separar secciones con responsabilidades claras mejora mantenimiento sin crear componentes artificiales.
- Mejora: Revisa si parte del template puede moverse a un child component o a utilidades puras compartidas.

### [WARN] AppointmentsComponent sigue usando *ngIf/*ngFor

- Archivo: src/components/page/appointments/appointments.component.html
- Motivo: El control flow nativo de Angular 21 mejora legibilidad, scope y consistencia con el resto del proyecto.
- Mejora: Migra a @if/@for/@switch al tocar esa pantalla para mantener coherencia moderna.

### [WARN] AuthLayoutComponent no usa standalone

- Archivo: src/components/auth/auth-layout/auth-layout.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] AvailabilityComponent empieza a pedir composición

- Archivo: src/components/page/availability/availability.component.ts · src/components/page/availability/availability.component.html
- Motivo: Separar secciones con responsabilidades claras mejora mantenimiento sin crear componentes artificiales.
- Mejora: Revisa si parte del template puede moverse a un child component o a utilidades puras compartidas.

### [WARN] AvailabilityComponent no usa OnPush

- Archivo: src/components/page/availability/availability.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] ChangePasswordComponent no usa OnPush

- Archivo: src/components/page/change-password/change-password.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] ClientHomeComponent no usa standalone

- Archivo: src/components/page/client-home/client-home.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] DoctorHomeComponent no usa standalone

- Archivo: src/components/page/doctor-home/doctor-home.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] DoctorHomeComponent no usa standalone

- Archivo: src/components/page/doctor-pages/doctor-home/doctor-home.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] DoctorProfileComponent empieza a pedir composición

- Archivo: src/components/page/profile/doctor-profile/doctor-profile.component.ts · src/components/page/profile/doctor-profile/doctor-profile.component.html
- Motivo: Separar secciones con responsabilidades claras mejora mantenimiento sin crear componentes artificiales.
- Mejora: Revisa si parte del template puede moverse a un child component o a utilidades puras compartidas.

### [WARN] EmptyStateComponent no usa standalone

- Archivo: src/components/shared/empty-state/empty-state.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] FavoritesComponent no usa OnPush

- Archivo: src/components/page/favorites/favorites.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] FooterComponent no usa standalone

- Archivo: src/components/shared/footer/footer.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] ForgotPasswordComponent no usa standalone

- Archivo: src/components/auth/forgot-password/forgot-password.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] HeaderComponent no usa OnPush

- Archivo: src/components/shared/header-home/header.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] HelpSupportComponent no usa OnPush

- Archivo: src/components/page/help-support/help-support.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] LoaderComponent no usa OnPush

- Archivo: src/components/shared/loader/loader.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] LoginComponent no usa standalone

- Archivo: src/components/auth/login/login.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] LogoComponent no usa standalone

- Archivo: src/components/shared/logo/logo.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] MoodsComponent no usa standalone

- Archivo: src/components/shared/moods/moods.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] MoodsComponent sigue usando *ngIf/*ngFor

- Archivo: src/components/shared/moods/moods.component.html
- Motivo: El control flow nativo de Angular 21 mejora legibilidad, scope y consistencia con el resto del proyecto.
- Mejora: Migra a @if/@for/@switch al tocar esa pantalla para mantener coherencia moderna.

### [WARN] Nombre de componente repetido: doctor-home.component.ts

- Archivo: src/components/page/doctor-home/doctor-home.component.ts · src/components/page/doctor-pages/doctor-home/doctor-home.component.ts
- Motivo: Los nombres repetidos dificultan búsquedas, imports y mantenimiento en una base standalone/lazy.
- Mejora: Renombra por contexto funcional para evitar ambigüedad (por ejemplo, screen vs feature summary).

### [WARN] PageComponent no usa standalone

- Archivo: src/components/page/page.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] PatientsComponent no usa OnPush

- Archivo: src/components/page/patients/patients.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] PrivacySecurityComponent empieza a pedir composición

- Archivo: src/components/page/privacy-security/privacy-security.component.ts · src/components/page/privacy-security/privacy-security.component.html
- Motivo: Separar secciones con responsabilidades claras mejora mantenimiento sin crear componentes artificiales.
- Mejora: Revisa si parte del template puede moverse a un child component o a utilidades puras compartidas.

### [WARN] PrivacySecurityComponent no usa OnPush

- Archivo: src/components/page/privacy-security/privacy-security.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] ProfileComponent no usa standalone

- Archivo: src/components/page/profile/profile.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] SearchComponent no usa standalone

- Archivo: src/components/page/search/search.component.ts
- Motivo: Angular 21 favorece standalone para simplificar composición, lazy loading y dependencias explícitas.
- Mejora: Migra a standalone si no existe una razón fuerte para mantener NgModule local.

### [WARN] ToastComponent no usa OnPush

- Archivo: src/components/shared/toast/toast.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] TwoFactorComponent no usa OnPush

- Archivo: src/components/page/two-factor/two-factor.component.ts
- Motivo: OnPush reduce trabajo de detección de cambios y encaja mejor con signals y estado predecible.
- Mejora: Añade ChangeDetectionStrategy.OnPush salvo que haya una dependencia concreta que lo impida.

### [WARN] VideoCallComponent sigue usando *ngIf/*ngFor

- Archivo: src/components/page/video-call/video-call.component.html
- Motivo: El control flow nativo de Angular 21 mejora legibilidad, scope y consistencia con el resto del proyecto.
- Mejora: Migra a @if/@for/@switch al tocar esa pantalla para mantener coherencia moderna.

### [INFO] AppointmentsComponent puede modernizar parte del estado

- Archivo: src/components/page/appointments/appointments.component.ts
- Motivo: Angular 21 ofrece signals/computed/effect para estado de UI más simple y menos suscripciones manuales.
- Mejora: Cuando toques esta feature, mueve estado local a signals y deja RxJS para streams asíncronos reales.

### [INFO] HeaderComponent sí está aportando reutilización

- Archivo: src/components/shared/header-home/header.component.ts
- Motivo: Tener varias referencias confirma que este shared evita duplicación real.
- Mejora: Mantén este componente como pieza reusable y evita reimplementar su UI en pantallas nuevas.

### [INFO] LanguagesSelectorComponent sí está aportando reutilización

- Archivo: src/components/shared/languages-selector/languages-selector.component.ts
- Motivo: Tener varias referencias confirma que este shared evita duplicación real.
- Mejora: Mantén este componente como pieza reusable y evita reimplementar su UI en pantallas nuevas.

### [INFO] LogoComponent sí está aportando reutilización

- Archivo: src/components/shared/logo/logo.component.ts
- Motivo: Tener varias referencias confirma que este shared evita duplicación real.
- Mejora: Mantén este componente como pieza reusable y evita reimplementar su UI en pantallas nuevas.

### [INFO] ProfilePictureComponent puede modernizar parte del estado

- Archivo: src/components/page/profile/profile-picture/profile-picture.component.ts
- Motivo: Angular 21 ofrece signals/computed/effect para estado de UI más simple y menos suscripciones manuales.
- Mejora: Cuando toques esta feature, mueve estado local a signals y deja RxJS para streams asíncronos reales.

### [INFO] Revisar si footer debe seguir siendo shared

- Archivo: src/components/shared/footer/footer.component.ts
- Motivo: Un componente compartido con uso único suele añadir acoplamiento y carpetas extra sin aportar reutilización real.
- Mejora: Si sigue teniendo un único uso tras próximos cambios, mantenlo cerca de la feature en vez de crecer la librería shared.

### [INFO] Revisar si loader debe seguir siendo shared

- Archivo: src/components/shared/loader/loader.component.ts
- Motivo: Un componente compartido con uso único suele añadir acoplamiento y carpetas extra sin aportar reutilización real.
- Mejora: Si sigue teniendo un único uso tras próximos cambios, mantenlo cerca de la feature en vez de crecer la librería shared.

### [INFO] Revisar si moods debe seguir siendo shared

- Archivo: src/components/shared/moods/moods.component.ts
- Motivo: Un componente compartido con uso único suele añadir acoplamiento y carpetas extra sin aportar reutilización real.
- Mejora: Si sigue teniendo un único uso tras próximos cambios, mantenlo cerca de la feature en vez de crecer la librería shared.

### [INFO] Revisar si toast debe seguir siendo shared

- Archivo: src/components/shared/toast/toast.component.ts
- Motivo: Un componente compartido con uso único suele añadir acoplamiento y carpetas extra sin aportar reutilización real.
- Mejora: Si sigue teniendo un único uso tras próximos cambios, mantenlo cerca de la feature en vez de crecer la librería shared.


## Señales positivas detectadas

- Shared components auditados: **8**
- Duplicidades de nombre detectadas: **1**
- El proyecto ya usa bastante Angular moderno, por lo que las mejoras recomendadas son selectivas y no destructivas.

## Uso

- Ejecutar: `npm run audit:front:angular21`
- Modo estricto: `npm run audit:front:angular21:strict`
- Salida: `reports/angular21-front-audit.md`
