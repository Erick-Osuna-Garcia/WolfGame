---
description: "Task list for Werewolf Online implementation"
---

# Tasks: Werewolf Online

**Input**: Design documents from `/specs/001-werewolf-online/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas porque `plan.md` y `quickstart.md` exigen Vitest, Jest y
Playwright. Dentro de cada historia, el test se escribe y falla antes de la
implementación que lo pone verde.

**Organization**: Por historia de usuario, para implementar y probar cada una
por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede avanzar en paralelo (otro archivo, sin depender de una tarea
  incompleta)
- **[Story]**: Historia a la que pertenece. Setup, fundación y cierre no
  llevan etiqueta.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear el monorepo vacío que fija `plan.md`.

- [ ] T001 Crear `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json` y `.gitignore` en la raíz, con los espacios `apps/*` y `packages/*`
- [ ] T002 [P] Inicializar `@werewolf/web` con TanStack Start 1.x, React 19, Vite 8 y Tailwind CSS 4 en `apps/web/package.json` y `apps/web/vite.config.ts`
- [ ] T003 [P] Inicializar `@werewolf/api` con NestJS, Socket.IO y Prisma en `apps/api/package.json`
- [ ] T004 [P] Inicializar `@werewolf/shared`, `@werewolf/game-rules` y `@werewolf/validators` en `packages/shared/package.json`, `packages/game-rules/package.json` y `packages/validators/package.json`
- [ ] T005 [P] Configurar ESLint y Prettier en `eslint.config.js` y `.prettierrc` de la raíz
- [ ] T006 Añadir el script `dev` que levanta la web en el puerto 3000 y la API en el 3001 en `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sesión, persistencia, fases y canal en vivo. Ninguna historia
empieza antes de cerrar esta fase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Definir en `apps/api/prisma/schema.prisma` Room, Participant, RoomSettings, Match, Assignment, NightAction, VoteRound, Vote y Event. Participant.displayName se recorta, mide de 2 a 24 caracteres, no es solo espacios y es único en la sala sin distinguir mayúsculas. Room.capacity es 30 jugadores sin contar al Game Master. Room.code usa 6 caracteres de `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Participant.kind es `GAME_MASTER` o `PLAYER`. Participant.life es `ALIVE` o `ELIMINATED`. Participant.connection es `CONNECTED` o `DISCONNECTED`. Match.phase es `LOBBY`, `ROLE_REVEAL`, `NIGHT`, `DAY`, `DISCUSSION`, `VOTING`, `VOTING_RESULTS` o `GAME_OVER`.
- [ ] T008 [P] Exportar esquemas Zod de nombre, código, fase y comandos en `packages/validators/src/index.ts`, con el nombre de 2 a 24 caracteres tras recortar
- [ ] T009 [P] Exportar las ocho fases y los códigos de rechazo de `contracts/realtime.md` en `packages/shared/src/index.ts`
- [ ] T010 [P] Crear `apps/api/.env.example` y `apps/web/.env.example` con `DATABASE_URL`, `WEB_ORIGIN` y `API_PORT`
- [ ] T011 [P] Crear el esqueleto de transiciones de las ocho fases en `packages/game-rules/src/phases.ts`. Satisface el Principio I.
- [ ] T012 Implementar el cliente Prisma en `apps/api/src/database/prisma.service.ts`
- [ ] T013 Implementar token opaco, cookie `ww_session` `HttpOnly` `SameSite=Lax` y hash del código de recuperación en `apps/api/src/modules/players/session.service.ts`. Satisface el Principio IV.
- [ ] T014 Rechazar el handshake de Socket.IO sin token válido en `apps/api/src/gateways/match.gateway.ts`. Satisface el Principio II.
- [ ] T015 Implementar el orden validar, autorizar, aplicar, persistir y emitir en `apps/api/src/game-engine/command-pipeline.ts`. Satisface el Principio I.
- [ ] T016 Traducir los códigos de rechazo a mensajes en español en `apps/api/src/common/errors.ts`

**Checkpoint**: Hay base de datos, sesión y un canal que aún no conduce una partida.

---

## Phase 3: User Story 1 - Reunir la sala (Priority: P1) 🎯 MVP

**Goal**: El Game Master crea una sala con código y QR. Los jugadores entran
con su nombre, ven la lista y recuperan el asiento si se corta la red.

**Independent Test**: Crear una sala, unir dos navegadores por QR y por
código, cortar la red de uno y ver el mismo asiento al volver.

### Tests for User Story 1

- [ ] T017 [P] [US1] Cubrir `POST /rooms`, `POST /rooms/join`, `POST /rooms/recover` y `GET /rooms/:code` en `apps/api/test/rooms.contract.spec.ts`, incluidos `room_not_found`, `name_taken`, `name_invalid`, `room_full` y dos salas que no comparten jugadores
- [ ] T018 [P] [US1] Cubrir el recorte y el límite de 2 a 24 caracteres en `packages/validators/src/room.spec.ts`

### Implementation for User Story 1

- [ ] T019 [US1] Persistir sala y participantes en `apps/api/src/modules/rooms/room.repository.ts`
- [ ] T020 [US1] Implementar los cuatro endpoints de `contracts/http.md` en `apps/api/src/modules/rooms/rooms.controller.ts`. El jugador 31 recibe `room_full`. Un código inexistente no revela otras salas.
- [ ] T021 [US1] Conservar el asiento al desconectar y devolver el mismo participante con el token o con el código de recuperación en `apps/api/src/modules/players/session.service.ts`. Satisface el Principio IV.
- [ ] T022 [US1] Emitir `room:updated` y aceptar `room:expel` y `room:close` en `apps/api/src/gateways/match.gateway.ts`
- [ ] T023 [P] [US1] Crear la pantalla de alta del Game Master en `apps/web/src/routes/index.tsx`
- [ ] T024 [P] [US1] Crear la entrada por código, con el código ya relleno si viene del QR, en `apps/web/src/routes/unirse.$code.tsx`
- [ ] T025 [US1] Mostrar participantes, cantidad, conexión y Game Master en `apps/web/src/features/lobby/lobby-screen.tsx`
- [ ] T026 [US1] Añadir expulsar y cerrar sala en `apps/web/src/features/lobby/gm-lobby-controls.tsx`
- [ ] T027 [US1] Mostrar una sola vez el código de recuperación en `apps/web/src/features/lobby/recovery-panel.tsx`
- [ ] T028 [US1] Abrir Socket.IO con la cookie de sesión y aplicar `room:updated` sin recargar en `apps/web/src/lib/realtime.ts`. Satisface el Principio II.

**Checkpoint**: Una sala se puede compartir y recuperar sin roles ni fases.

---

## Phase 4: User Story 2 - Repartir roles en privado (Priority: P2)

**Goal**: El reparto clásico se asigna al azar, se puede corregir, y cada
jugador ve solo su tarjeta durante toda la partida.

**Independent Test**: Con ocho jugadores, cada dispositivo muestra un único
rol y el panel del Game Master muestra los ocho.

### Tests for User Story 2

- [ ] T029 [P] [US2] Afirmar que la proyección de un jugador no incluye el rol de otro en `apps/api/test/projection.spec.ts`. Satisface el Principio III.

### Implementation for User Story 2

- [ ] T030 [P] [US2] Declarar el catálogo clásico en `packages/game-rules/src/catalog.ts` con identificador, nombre, bando `VILLAGE` o `WEREWOLF`, descripción, objetivo, habilidades, instrucciones, condiciones y `nightPriority` opcional. Cupido queda en `VILLAGE`.
- [ ] T031 [P] [US2] Dibujar la tarjeta con nombre, icono, descripción, objetivo, habilidades, instrucciones y condiciones en `apps/web/src/features/roles/role-card.tsx`
- [ ] T032 [US2] Implementar `roles:deal` y `match:start` en `apps/api/src/modules/roles/roles.service.ts`. Rechazar con `role_count` si el número de roles no coincide con los sentados, y cerrar el alta al empezar.
- [ ] T033 [US2] Emitir `role:private` solo al dueño y `gm:table` solo al Game Master en `apps/api/src/gateways/projections.ts`. Satisface el Principio III.
- [ ] T034 [US2] Mostrar nombre, rol, vida y conexión en `apps/web/src/features/game-master/player-table.tsx`
- [ ] T035 [US2] Repartir al azar, corregir una ficha y empezar en `apps/web/src/features/lobby/role-setup.tsx`. Empezar queda indisponible si las cantidades no coinciden.
- [ ] T036 [US2] Dejar la tarjeta a un gesto de distancia en cualquier fase en `apps/web/src/features/roles/role-drawer.tsx`

**Checkpoint**: Los roles viajan en privado y la mesa ve el reparto.

---

## Phase 5: User Story 3 - Conducir la noche y el día (Priority: P3)

**Goal**: El Game Master avanza las fases. El inicio del jugador cambia con
la fase. El ritmo manual no avanza solo. El asistido cierra la noche cuando
lo obligatorio está listo.

**Independent Test**: Recorrer noche, día y discusión. Un aldeano no puede
enviar nada. Abrir la votación desde la noche no cambia la fase.

### Tests for User Story 3

- [ ] T037 [P] [US3] Cubrir `wrong_phase` y `pending_required` en `packages/game-rules/src/transitions.spec.ts`. Satisface el Principio I.

### Implementation for User Story 3

- [ ] T038 [US3] Implementar la tabla de transiciones de `data-model.md` en `packages/game-rules/src/transitions.ts`. `DISCUSSION` es el único origen válido de `VOTING`.
- [ ] T039 [US3] Implementar ritmo `MANUAL` por defecto y `ASSISTED` en `packages/game-rules/src/pace.ts`. En manual la fase no cambia sola. En asistido, la noche pasa a día al completarse la última acción obligatoria. Satisface el Principio VI.
- [ ] T040 [US3] Aceptar `phase:advance` en `apps/api/src/modules/games/phase.service.ts` y persistir la fase antes de emitir `match:updated`
- [ ] T041 [US3] Anotar eventos con audiencia `TABLE` o `GAME_MASTER` en `apps/api/src/modules/games/event-log.ts`. El registro de un jugador no recibe secretos de rol.
- [ ] T042 [US3] Guardar `discussionEndsAt` con valor inicial 180 segundos en `apps/api/src/modules/games/timers.ts`. El cliente solo dibuja ese instante.
- [ ] T043 [US3] Componer estado, mandos de fase, acciones pendientes y registro en `apps/web/src/features/game-master/dashboard.tsx`. Un mando rechazado muestra el mensaje y no cambia la fase local.
- [ ] T044 [US3] Cambiar el inicio del jugador según la fase en `apps/web/src/features/player/player-home.tsx`. De noche, un aldeano ve la espera y ningún envío.

**Checkpoint**: La mesa y los jugadores comparten fase y temporizador.

---

## Phase 6: User Story 4 - Usar habilidades de noche (Priority: P4)

**Goal**: Cada rol actúa solo dentro de sus reglas y el amanecer publica
únicamente el resultado.

**Independent Test**: Jugar una noche con los ocho roles, cubrir a la víctima
de los lobos y comprobar que la vidente es la única que recibe su
investigación.

### Tests for User Story 4

- [ ] T045 [P] [US4] Cubrir mayoría de lobos, empate sin víctima, pociones de un uso, protector sin repetir objetivo, Cupido en la primera noche y disparo del cazador en `packages/game-rules/src/night.spec.ts`

### Implementation for User Story 4

- [ ] T046 [US4] Resolver la noche en este orden en `packages/game-rules/src/night.ts`: enlace de Cupido, protección, elección de los lobos, investigación, pociones, juicio de la niña, muertes, cadena de enamorados y disparo del cazador. Protección y curación anulan a la víctima de los lobos. El veneno elimina a otro vivo.
- [ ] T047 [US4] Aplicar las habilidades del catálogo en `packages/game-rules/src/abilities.ts`. Obligatorias: la elección de cada lobo vivo y el enlace de Cupido en la ronda 1. Opcionales: vidente, bruja, protector y niña. La bruja tiene una curación y un veneno por partida. El cazador dispone de 30 segundos. Una mirada sin juicio queda `CANCELLED`.
- [ ] T048 [US4] Aceptar `night:submit`, `night:pass`, `peek:judge` y `hunter:shoot` en `apps/api/src/modules/games/night.service.ts`, con `wrong_role`, `illegal_target`, `ability_spent` y `eliminated`
- [ ] T049 [US4] Mostrar solo la acción legal de ese rol en `apps/web/src/features/player/night-actions.tsx`. Satisface el Principio VII.
- [ ] T050 [US4] Listar habilidad, jugador y estado pendiente o completada en `apps/web/src/features/game-master/pending-actions.tsx`, distinguiendo lo obligatorio de lo opcional

**Checkpoint**: Una noche completa se resuelve en el servidor y se ve en la mesa.

---

## Phase 7: User Story 5 - Votar, eliminar y cerrar (Priority: P5)

**Goal**: Votación secreta con confirmación, empates sin eliminación y un
ganador cuando un bando cumple su condición.

**Independent Test**: Desde una discusión activa, votar en varios
dispositivos, empatar sin muerte y después llegar a una victoria que todos
ven.

### Tests for User Story 5

- [ ] T051 [P] [US5] Cubrir voto bloqueado, cambio solo si la sala lo permite, abstención, empate y el orden de victoria en `packages/game-rules/src/voting.spec.ts`

### Implementation for User Story 5

- [ ] T052 [US5] Implementar el voto secreto en `packages/game-rules/src/voting.ts`. Exige confirmación. Con `voteChangeAllowed` desactivado, el segundo voto confirmado devuelve `vote_locked`. En empate, o sin un único líder, no hay eliminado. El temporizador inicial es 60 segundos.
- [ ] T053 [US5] Evaluar victoria en `packages/game-rules/src/victory.ts`: primero `LOVERS` si son los dos únicos vivos, después `VILLAGE` si no queda un lobo, después `WEREWOLF` si los lobos vivos igualan o superan al resto.
- [ ] T054 [US5] Aceptar `vote:cast`, cerrar por tiempo y respetar `ON_CLOSE` o `AFTER_PROCESSING` en `apps/api/src/modules/voting/voting.service.ts`. El progreso del Game Master no incluye el sentido del voto antes de la revelación.
- [ ] T055 [US5] Pedir confirmación, bloquear el voto enviado y dibujar el tiempo restante en `apps/web/src/features/voting/vote-panel.tsx`
- [ ] T056 [US5] Publicar el rol del eliminado y el ganador, sin revelar a los vivos, en `apps/web/src/features/player/resolution.tsx`

**Checkpoint**: La línea base de lanzamiento, historias 1 a 5, puede nombrar un ganador.

---

## Phase 8: User Story 6 - Recordar la partida y preparar la siguiente (Priority: P6)

**Goal**: El historial completo queda para el Game Master y una configuración
guardada abre la sala siguiente. Un rol nuevo no cambia las fases.

**Independent Test**: Terminar una partida, abrir su historial, guardar la
configuración y crear otra sala que la reutilice.

### Tests for User Story 6

- [ ] T057 [P] [US6] Añadir un rol de prueba y afirmar que el orden de fases no cambia en `packages/game-rules/src/catalog-extension.spec.ts`. Satisface el Principio V.

### Implementation for User Story 6

- [ ] T058 [US6] Leer el historial ordenado por `sequence` en `apps/api/src/modules/games/history.service.ts`, con acciones nocturnas, votos agregados y eliminaciones
- [ ] T059 [US6] Guardar y reaplicar nombre, tiempos, cambio de voto, revelación, ritmo y mezcla de roles en `apps/api/src/modules/game-master/presets.service.ts`
- [ ] T060 [US6] Mostrar el historial de una partida terminada en `apps/web/src/features/game-master/history.tsx`
- [ ] T061 [US6] Elegir una configuración guardada al crear la sala en `apps/web/src/features/lobby/preset-picker.tsx`

**Checkpoint**: La ampliación posterior a la línea base queda usable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Cierre visual, privacidad de punta a punta y la guía de
`quickstart.md`.

- [ ] T062 [P] Aplicar el tema oscuro de fantasía medieval y el texto en español en `apps/web/src/styles.css` y en los literales de `apps/web/src/features/`
- [ ] T063 [P] Automatizar los escenarios de `specs/001-werewolf-online/quickstart.md` en `apps/web/e2e/quickstart.spec.ts`, a 390 píxeles de ancho y en escritorio
- [ ] T064 Revisar que ningún evento de jugador incluya investigación ajena ni voto no revelado en `apps/api/test/privacy.spec.ts`. Satisface el Principio III.
- [ ] T065 Documentar instalación, variables y `pnpm dev` en `README.md`
- [ ] T066 Ejecutar las comprobaciones de `specs/001-werewolf-online/quickstart.md` y anotar el resultado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: empieza de inmediato.
- **Foundational (Phase 2)**: depende del setup y bloquea todas las historias.
- **Historias (Phase 3 en adelante)**: dependen de la fundación. Van en orden
  P1 → P6, o en paralelo si quien implementa no toca los mismos archivos.
- **Polish (Phase 9)**: depende de las historias que se quieran dar por
  cerradas. La línea base exige hasta la Phase 7.

### User Story Dependencies

- **User Story 1 (P1)**: solo depende de la fundación.
- **User Story 2 (P2)**: usa la sala de la historia 1 para sentar jugadores.
- **User Story 3 (P3)**: usa el reparto de la historia 2 para saber quién puede actuar.
- **User Story 4 (P4)**: usa las fases de la historia 3.
- **User Story 5 (P5)**: usa la discusión abierta por la historia 3.
- **User Story 6 (P6)**: lee eventos y configuración que las historias anteriores ya escriben.

### Within Each User Story

- El test de la historia se escribe primero y debe fallar.
- El paquete de reglas precede al servicio Nest.
- El servicio precede a la pantalla.
- La historia se comprueba antes de pasar a la siguiente prioridad.

### Parallel Opportunities

- T002, T003, T004 y T005 pueden ir juntas.
- T008, T009, T010 y T011 pueden ir juntas. No dependen del esquema de T007.
- T017 con T018. T023 con T024. T030 con T031.
- T037, T045, T051 y T057 están en archivos distintos y pueden escribirse en
  paralelo una vez que exista `packages/game-rules`, aunque conviene
  ejecutarlos en el orden de la historia.

---

## Parallel Example: User Story 1

```bash
# Tests de la historia 1, en paralelo:
# T017 apps/api/test/rooms.contract.spec.ts
# T018 packages/validators/src/room.spec.ts

# Pantallas de alta, en paralelo:
# T023 apps/web/src/routes/index.tsx
# T024 apps/web/src/routes/unirse.$code.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Cerrar Phase 1 y Phase 2.
2. Cerrar Phase 3.
3. Parar y probar la sala con dos navegadores, QR, expulsión y reconexión.
4. La línea base de lanzamiento sigue en las historias 2 a 5. La historia 1
   ya se puede mostrar sola.

### Incremental Delivery

1. Fundación lista.
2. Historia 1: la mesa se reúne.
3. Historia 2: el rol queda en privado.
4. Historia 3: la mesa conduce las fases.
5. Historia 4: la noche tiene consecuencias.
6. Historia 5: hay votación y ganador. Aquí se cumple el lanzamiento.
7. Historia 6: historial y configuración para la siguiente sala.

### Parallel Team Strategy

Con la fundación cerrada:

- Una persona puede tomar las reglas puras (`packages/game-rules`).
- Otra, los servicios Nest y el gateway.
- Otra, las pantallas de `apps/web`.

Cada historia se integra cuando sus tres capas coinciden en el mismo contrato.

---

## Notes

- Hay 66 tareas: T001–T066.
- Setup: 6. Fundación: 10. US1: 12. US2: 8. US3: 8. US4: 6. US5: 6. US6: 5. Cierre: 5.
- El lanzamiento jugable termina en T056. T057–T066 amplían y pulen.
- Redis, un segundo juego y los roles fuera del clásico no tienen tarea.
