# Implementation Plan: Werewolf Online

**Branch**: `001-werewolf-online` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-werewolf-online/spec.md`

## Summary

Werewolf Online reúne a un Game Master y hasta 30 jugadores en el navegador,
sin cuenta y sin instalación. La web muestra la sala, la tarjeta privada y el
panel de la mesa. NestJS, con un motor puro en `packages/game-rules`, decide
fases, habilidades y votos, y Socket.IO reparte a cada dispositivo solo la
proyección que le corresponde. PostgreSQL conserva la partida. Redis no entra
en esta versión.

## Technical Context

**Language/Version**: TypeScript sobre Node.js 24. React 19.

**Primary Dependencies**: TanStack Start 1.x (`@tanstack/react-start`,
TanStack Router, Vite 8), NestJS, Socket.IO, Prisma, Zod, Tailwind CSS 4.

**Storage**: PostgreSQL. Estado caliente en el proceso Nest, con escritura en
PostgreSQL en cada acción aceptada. Redis no se usa.

**Testing**: Vitest en reglas, validadores y web. Jest en la API. Playwright
en los recorridos de [quickstart.md](./quickstart.md).

**Target Platform**: Navegadores de teléfono y escritorio. Una instancia de la
API en un VPS o nube. Sin aplicación instalable.

**Project Type**: Monorepo web. Cliente y servidor de juego separados.

**Performance Goals**: Un cambio de fase aceptado se ve en 15 dispositivos en
menos de 2 segundos. Crear la sala cabe en 60 segundos de uso. Unirse por QR
cabe en 30 segundos de uso.

**Constraints**: Las reglas no viven en la web ni en server functions de
Start. Un jugador no recibe secretos ajenos. El modo manual no avanza solo.
Cupo de 30 jugadores más un Game Master. Interfaz en español, mobile first,
fantasía medieval oscura.

**Scale/Scope**: Varias salas aisladas en una instancia. Ocho roles clásicos.
Seis historias. Cientos de usuarios simultáneos quedan fuera.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Gate | Resultado |
| --- | --- | --- |
| I. Motor autoritativo | Las transiciones y las habilidades se aplican en `packages/game-rules`, llamadas solo desde `apps/api`. | Pasa |
| II. Sincronización | Socket.IO emite después de persistir. El reloj de discusión, votación y cazador lo guarda la API. | Pasa |
| III. Conocimiento privado | El gateway proyecta por destinatario. La tarjeta sigue disponible toda la partida. | Pasa |
| IV. Sin cuenta ni instalación | Alta por código o QR. Cookie de sesión y código de recuperación. Desconectar no borra el asiento. | Pasa |
| V. Roles modulares | El catálogo es datos. Un rol nuevo no altera la tabla de fases. El primero es el clásico. | Pasa |
| VI. Ritmo del Game Master | El avance principal lo pide el Game Master. El modo asistido solo cierra la noche si él lo activó y lo obligatorio ya está. | Pasa |
| VII. Dos experiencias | Rutas distintas para jugador y Game Master sobre el mismo estado. | Pasa |
| VIII. Plataforma | Salas, sesión y socket no importan fichas de rol. Werewolf está en `packages/game-rules`. | Pasa |
| Stack y Redis | React, TypeScript, TanStack Start, NestJS, Socket.IO, PostgreSQL, Zod. Redis ausente en el despliegue de una instancia. | Pasa |
| Estructura | `apps/web`, `apps/api`, `packages/shared`, `packages/game-rules`, `packages/validators`. | Pasa |
| Fases | Las ocho fases del gobierno, sin una fase extra para el cazador. | Pasa |

Revisión posterior al diseño: `research.md`, `data-model.md`, `contracts/` y
`quickstart.md` usan las mismas fases, las mismas proyecciones y el mismo
rechazo de transiciones. No aparece una violación nueva.

## Project Structure

### Documentation (this feature)

```text
specs/001-werewolf-online/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http.md
│   ├── realtime.md
│   └── ui.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── routes/
│   ├── components/
│   ├── features/
│   │   ├── lobby/
│   │   ├── player/
│   │   ├── game-master/
│   │   ├── voting/
│   │   └── roles/
│   └── lib/
├── tests/
└── package.json

apps/api/
├── prisma/schema.prisma
├── src/
│   ├── modules/
│   │   ├── rooms/
│   │   ├── players/
│   │   ├── games/
│   │   ├── roles/
│   │   ├── voting/
│   │   └── game-master/
│   ├── game-engine/
│   ├── gateways/
│   └── database/
├── test/
└── package.json

packages/
├── shared/
├── game-rules/
└── validators/
```

**Structure Decision**: Monorepo de la constitution. La web no contiene un
módulo de reglas. El motor Nest es un adaptador del paquete puro.

## Complexity Tracking

Ninguna violación de la constitution requiere justificación. Redis, un segundo
juego y los roles fuera del clásico no forman parte de este plan.
