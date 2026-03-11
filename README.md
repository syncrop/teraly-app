<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lpGjQkwyFVMXre2vvyzFwvSwYTOyCrCP

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

Plan por fases (para no romper producción)
Fase 1 (rápida): Mantén Firebase Auth de momento, monta LiveKit + Stream con tokens emitidos por NestJS.
Fase 2: Activa/migra a Identity Platform (idealmente mismo proyecto) y cambias la validación de tokens si aplica.
Fase 3: Si queréis “cero Firebase”, migráis lo que quede (Hosting/FCM/Firestore si existiera).

Infra en GCP (ya que migráis backend)
NestJS: Cloud Run (lo típico) o GKE si tenéis razones fuertes
Angular: Cloud Storage + Cloud CDN (o seguir con hosting equivalente)
Secretos: Secret Manager (Stream API key/secret, LiveKit API key/secret)
Logs/Tracing: Cloud Logging + Error Reporting

Chat persistente tipo Teams: Stream Chat
Stream es buena elección para no construir:

historial, delivery/read, typing, attachments, moderación, búsqueda, threads, reacciones
Modelo recomendado:

userId de Stream = uid de tu proveedor de identidad (Identity Platform/Firebase Auth) para consistencia
Tu NestJS genera el Stream user token (nunca en el frontend)
Canal por cita: channelId = appointment:<appointmentId>

Implementación en este repo (marzo 2026):

- Backend (NestJS) emite tokens de Stream: `POST /v1/chat/token`
- Backend asegura canal por cita: `POST /v1/chat/channels/appointment`
- Backend asegura canal por cita: `POST /v1/chat/channels/appointment/:appointmentId` (miembros derivados desde la cita)
- Frontend conecta con `StreamChatService` y usa un canal `appointment-<appointmentId>`

Variables de entorno backend requeridas:

- `STREAM_CHAT_API_KEY`
- `STREAM_CHAT_API_SECRET`

Nota local: si no tienes Mongo configurado, levanta el backend con `ALLOW_NO_DB=true`.

Para desarrollo sin Mongo (no recomendado en prod):

- Habilita `ALLOW_UNSAFE_CHAT_CHANNEL_CREATION=true`
- Usa `POST /v1/chat/channels/appointment/unsafe` enviando `{ appointmentId, members }`
