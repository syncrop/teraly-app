# Teral y Backend (Cloud Run)

Backend para la migración desde Firestore a MongoDB Atlas.

## Stack

- NestJS (HTTP API)
- Identity Platform (ID tokens) verificados con `firebase-admin`
- MongoDB Atlas (colecciones: `users`, `appointments`, `favorites`, `reviews`)

## Variables de entorno

- `PORT` (opcional, default: 8080)
- `MONGODB_URI` (requerida)
- `MONGODB_DB` (opcional, default: `teraly`)
- `FIREBASE_PROJECT_ID` (opcional; normalmente no hace falta en Cloud Run si usas ADC)

## Endpoints (prefijo `/v1`)

- `GET /health`
- `GET /me`, `PUT /me`
- `PATCH /me/profile-picture`, `DELETE /me/profile-picture`
- `GET /users?role=doctor|client`, `GET /users/:uid`
- `GET /appointments?...`, `POST /appointments`, `GET /appointments/:id`, `PATCH /appointments/:id`, `DELETE /appointments/:id`
- `GET /appointments/availability`
- `POST /me/favorites/:doctorId`, `DELETE /me/favorites/:doctorId`, `GET /me/favorites`, `GET /me/favorites/:doctorId`
- `GET /reviews?doctorId=...`, `POST /reviews`, `GET /reviews/:doctorId/mine`, `GET /reviews/can-review`

## Notas

- Este backend asume que el frontend envía `Authorization: Bearer <ID_TOKEN>`.
- La autorización (doctor/cliente + acceso a terceros) se aplica server-side.
