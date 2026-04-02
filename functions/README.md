# Tommybox Cloud Functions

## Setup

```bash
cd functions
npm install
npm run build
```

## Deploy (requiere plan Firebase Blaze + Firebase CLI)

```bash
# Instalar CLI si no está instalada
npm install -g firebase-tools
firebase login

# Seleccionar el proyecto
firebase use <tu-project-id>

# Deploy solo functions
firebase deploy --only functions
```

## Funciones disponibles

### `onAgendaEvent`
- **Trigger**: `onCreate` / `onUpdate` / `onDelete` en `agenda/{userId}/events/{eventId}`
- **Modo**: Complemento (el cliente también llama `recalculateGamification`)
- **Propósito**: Garantía server-side de que la gamificación se recalcula aunque el cliente falle

## Emulador local

```bash
cd functions
npm run serve
# La UI del emulador estará en http://localhost:4000
```

## Notas importantes

- Esta función usa Firebase Gen 2 (`firebase-functions/v2`)
- Node.js 20 requerido
- No re-lanza errores para evitar loops de retry
- El recálculo es idempotente — ejecutarlo N veces produce el mismo resultado
