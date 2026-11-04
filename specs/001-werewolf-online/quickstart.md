# Quickstart: Werewolf Online

Guía de comprobación. No implementa el juego. Los escenarios demuestran la
spec de punta a punta cuando la implementación exista.

## Prerequisites

- Node.js 24
- pnpm 10
- PostgreSQL 16 local, base `werewolf`
- Dos navegadores, o un navegador y el emulador de teléfono del escritorio

Variables en `apps/api/.env` y `apps/web/.env`:

- `DATABASE_URL` apunta a la base local
- `WEB_ORIGIN` es el origen de la web, por defecto `http://localhost:3000`
- `API_PORT` es `3001`

## Setup

Desde la raíz del repositorio:

```bash
pnpm install
pnpm --filter @werewolf/api exec prisma migrate dev
pnpm dev
```

`pnpm dev` levanta la web en el puerto 3000 y la API en el 3001.

## Automated checks

```bash
pnpm --filter @werewolf/game-rules test
pnpm --filter @werewolf/validators test
pnpm --filter @werewolf/api test
pnpm --filter @werewolf/web test
pnpm exec playwright test
```

Las reglas puras cubren transiciones, resolución nocturna y victoria. La API
cubre autorización, proyección y persistencia. Playwright cubre los recorridos
de abajo en un teléfono de 390 píxeles de ancho y en un escritorio.

## Scenario: reunir la sala

1. Abrir `/` y crear la sala con el nombre `Mesa`.
2. Comprobar que hay un código de 6 caracteres y un QR antes de 60 segundos.
3. Abrir el QR en un segundo dispositivo, entrar como `Erick`, y ver ese
   nombre en ambos antes de 30 segundos.
4. Intentar otro `Erick`. La entrada muestra que el nombre está ocupado.
5. Cortar la red del segundo dispositivo durante menos de 2 minutos y
   volverla. El asiento sigue siendo `Erick`.
6. Abrir una segunda sala. Sus listas no se mezclan.

Contratos: [http.md](./contracts/http.md), [ui.md](./contracts/ui.md).

## Scenario: roles privados y fases

1. Sentar 8 jugadores y repartir al azar los ocho roles clásicos.
2. En cada dispositivo, abrir la tarjeta y comprobar que el otro teléfono no
   muestra ese rol. El panel de la mesa sí muestra los ocho.
3. Iniciar la noche. Los 8 dispositivos cambian de fase en menos de 2
   segundos.
4. Pulsar votación durante la noche. La fase no cambia y el motivo queda
   visible.
5. Con el ritmo manual y los lobos sin elegir, la noche no pasa a día sola.

Contratos: [realtime.md](./contracts/realtime.md), [data-model.md](./data-model.md).

## Scenario: noche, voto y ganador

1. Los lobos eligen una víctima. El protector la cubre. La bruja no gasta
   pociones. Al día no hay muerte.
2. La vidente investiga y solo ella ve si esa persona es lobo.
3. Abrir discusión, luego votación. Un eliminado no puede votar. Un vivo no
   confirma dos veces.
4. Empatar. Nadie muere.
5. En una votación posterior, eliminar hasta que no quede un lobo, o hasta
   que los lobos igualen al resto. La partida nombra un ganador y lo muestran
   todos los dispositivos.
6. Revisar el registro del Game Master: inicio, fases, noche, votos agregados
   y eliminaciones. En un jugador, ese registro no contiene la investigación
   de la vidente.

## Scenario: cupo y recuperación

1. Llenar una sala hasta 30 jugadores. El 31 recibe un rechazo claro.
2. Desde un navegador nuevo, recuperar un asiento con el código mostrado al
   unirse. El nombre y el rol coinciden. Sin ese código, el otro navegador no
   entra en el asiento.
