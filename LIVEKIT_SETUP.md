# Configuración de LiveKit

## 1. Configuración del Servidor LiveKit

Debes tener un servidor LiveKit corriendo. Puedes usar:

- LiveKit Cloud (https://livekit.io)
- Self-hosted con Docker

## 2. Variables de Entorno

Agrega estas variables en tu backend:

```
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

## 3. Endpoint del Backend

Crea un endpoint en tu backend (Node.js/Firebase Functions) para generar tokens:

### Ejemplo con Node.js y Express:

```typescript
import { AccessToken } from "livekit-server-sdk";

app.post("/api/livekit/token", async (req, res) => {
  const { roomName, participantName } = req.body;

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
      name: participantName,
    }
  );

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const token = at.toJwt();
  res.json({ token });
});
```

### Ejemplo con Firebase Functions:

```typescript
import * as functions from "firebase-functions";
import { AccessToken } from "livekit-server-sdk";

export const getLiveKitToken = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuario no autenticado"
    );
  }

  const { appointmentId } = data;
  const userId = context.auth.uid;

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: userId,
      name: context.auth.token.name || userId,
    }
  );

  at.addGrant({
    room: `appointment-${appointmentId}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return { token: at.toJwt() };
});
```

## 4. Actualizar el Componente

Reemplaza el método `getLiveKitToken()` en `video-call.component.ts`:

### Con HTTP (Express):

```typescript
private async getLiveKitToken(): Promise<string> {
  const appointmentId = this.appointmentId();
  const userId = this.authService.getCurrentUserId() || 'anonymous';

  const response = await fetch('/api/livekit/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName: `appointment-${appointmentId}`,
      participantName: userId
    })
  });

  const data = await response.json();
  return data.token;
}
```

### Con Firebase Functions:

```typescript
import { Functions, httpsCallable } from '@angular/fire/functions';

private functions = inject(Functions);

private async getLiveKitToken(): Promise<string> {
  const appointmentId = this.appointmentId();

  const getLiveKitTokenFn = httpsCallable(this.functions, 'getLiveKitToken');
  const result = await getLiveKitTokenFn({ appointmentId });

  return (result.data as any).token;
}
```

## 5. Actualizar la URL de LiveKit

En el método `connectToLiveKit()`, reemplaza:

```typescript
const wsURL = "wss://your-livekit-server.com";
```

Con tu URL real de LiveKit.

## 6. Instalar Dependencias del Backend

```bash
npm install livekit-server-sdk
```

## Notas Importantes

- El token de LiveKit debe generarse en el backend por seguridad
- Nunca expongas tu API Secret en el frontend
- Cada participante necesita un token único
- Los tokens pueden tener fecha de expiración configurables
