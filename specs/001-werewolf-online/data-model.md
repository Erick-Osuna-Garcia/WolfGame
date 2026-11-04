# Data Model: Werewolf Online

Los límites citados entre comillas salen de la spec. Los identificadores de
fase son los del gobierno del proyecto.

## Room

Sala de espera o partida.

| Campo | Regla |
| --- | --- |
| id | Identificador interno. |
| code | 6 caracteres del alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Único. |
| status | `OPEN`, `IN_PROGRESS`, `CLOSED`. |
| gameMasterId | El participante que la creó. Uno por sala. |
| capacity | 30 jugadores, sin contar al Game Master. |
| settingsId | Configuración efectiva. |
| createdAt, closedAt | Cierre conserva el historial y no nombra ganador. |

Relaciones: un Game Master, muchos participantes, una partida como máximo, muchos eventos.

## Participant

| Campo | Regla |
| --- | --- |
| id | Identificador interno. |
| roomId | Sala. |
| kind | `GAME_MASTER` o `PLAYER`. El Game Master no tiene rol de juego y no vota. |
| displayName | Obligatorio para un jugador. Se recorta. Longitud de 2 a 24. No solo espacios. Único en la sala sin distinguir mayúsculas. |
| life | `ALIVE` o `ELIMINATED`. El Game Master no usa este campo. |
| connection | `CONNECTED` o `DISCONNECTED`. Desconectar no borra la fila. |
| sessionTokenHash | Hash del token vigente. |
| recoveryCodeHash | Hash del código de recuperación mostrado una vez. |
| seatedAt, eliminatedAt | |

Índice único: `(roomId, displayName normalizado)` para jugadores.

## RoleDefinition

Ficha de catálogo. No es el rol asignado a una persona.

| Campo | Regla |
| --- | --- |
| id | Estable: `villager`, `werewolf`, `seer`, `witch`, `hunter`, `cupid`, `little_girl`, `guardian`. |
| name | Nombre visible en español. |
| team | `VILLAGE`, `WEREWOLF` o `NEUTRAL`. En el clásico, solo el lobo usa `WEREWOLF`. Cupido usa `VILLAGE`. |
| description, objective, instructions, specialConditions | Texto de la tarjeta. |
| icon | Imagen o icono. |
| nightPriority | Entero opcional. Menor actúa antes. |
| abilities | Lista de AbilityDefinition. |

Añadir una fila no cambia el orden de fases.

### Catálogo clásico

| Rol | Bando | Prioridad nocturna | Habilidad |
| --- | --- | --- | --- |
| Aldeano | VILLAGE | — | Ninguna. De noche espera. |
| Hombre lobo | WEREWOLF | 30 | `werewolf-kill`, noche, exige objetivo vivo, una vez por noche. |
| Vidente | VILLAGE | 40 | `seer-investigate`, noche, exige objetivo vivo, una vez por noche. Opcional. |
| Bruja | VILLAGE | 50 | `witch-heal` y `witch-poison`, noche, un uso de cada una por partida. Curar no exige elegir: actúa sobre la víctima propuesta. Veneno exige otro vivo. Opcional. |
| Protector | VILLAGE | 20 | `guardian-protect`, noche, exige objetivo vivo, no el mismo que la noche anterior. Opcional. |
| Cupido | VILLAGE | 10 | `cupid-link`, solo la primera noche, dos objetivos distintos. Obligatoria si sigue vivo. |
| Niña | VILLAGE | — | `little-girl-peek`, noche, sin objetivo. La resuelve el Game Master. Opcional. |
| Cazador | VILLAGE | — | `hunter-shot`, al ser eliminado, un objetivo vivo, 30 segundos. |

## AbilityDefinition

| Campo | Regla |
| --- | --- |
| id, name, description | |
| phase | `DAY` o `NIGHT`. |
| requiresTarget | Sí o no. |
| usesPerGame | Vacío si no hay límite de partida. Curación y veneno valen 1. |
| required | Sí solo para la elección de cada lobo vivo y para el enlace de Cupido en la primera noche. |

## RoomSettings

| Campo | Valor inicial |
| --- | --- |
| pace | `MANUAL`. También `ASSISTED`. |
| voteChangeAllowed | Desactivado. |
| reveal | `AFTER_PROCESSING`. También `ON_CLOSE`. |
| discussionSeconds | 180. |
| votingSeconds | 60. |
| hunterSeconds | 30. |
| roleIds | Multiconjunto que debe coincidir con los sentados antes de empezar. |

Una configuración guardada puede reutilizarse en otra sala. Pertenece al Game
Master que la guardó.

## Match

| Campo | Regla |
| --- | --- |
| id, roomId | Una partida por sala. |
| phase | `LOBBY`, `ROLE_REVEAL`, `NIGHT`, `DAY`, `DISCUSSION`, `VOTING`, `VOTING_RESULTS`, `GAME_OVER`. |
| round | Entero. La primera noche es la ronda 1. |
| winner | Vacío, `VILLAGE`, `WEREWOLF` o `LOVERS`. |
| resolution | Vacío o `HUNTER_SHOT`. No es una fase nueva. La fase visible no cambia hasta resolver o agotar el tiempo. |

## Assignment

| Campo | Regla |
| --- | --- |
| matchId, participantId | Un rol por jugador. |
| roleId | Del catálogo. |
| abilityUses | Usos restantes. La bruja empieza con curación 1 y veneno 1. |

El estado enviado a un jugador incluye solo su Assignment.

## NightAction

| Campo | Regla |
| --- | --- |
| matchId, round, actorId, abilityId | |
| targetIds | Cero, uno o dos, según la habilidad. Todos vivos y de la sala. |
| status | `PENDING`, `COMPLETED`, `CANCELLED`. |
| privateResult | Solo para la vidente: si el objetivo es hombre lobo o no. No sale en el estado de otros jugadores. |

## VoteRound y Vote

VoteRound: partida, ronda, instante de cierre, política de revelación.

Vote: un votante vivo, `targetId` o abstención, confirmado. Con el cambio
desactivado, un segundo voto confirmado se rechaza. Con el cambio activo, solo
el último confirmado antes del cierre cuenta. El sentido no se incluye en el
estado de otro jugador ni en el progreso del Game Master.

## Event

| Campo | Regla |
| --- | --- |
| matchId, sequence, type, payload, audience | |
| audience | `TABLE` o `GAME_MASTER`. |

El registro de un jugador solo recibe `TABLE` y lo que ya es suyo. El del
Game Master recibe ambos.

## Transiciones

| Desde | Hacia | Quién | Rechazo |
| --- | --- | --- | --- |
| LOBBY | ROLE_REVEAL | Game Master, al empezar | El número de roles no coincide con los sentados. Alguien intenta unirse después: la admisión queda cerrada. |
| ROLE_REVEAL | NIGHT | Game Master | — |
| NIGHT | DAY | Game Master, o el modo asistido al completar lo obligatorio | Queda una acción obligatoria `PENDING`. |
| DAY | DISCUSSION | Game Master | — |
| DISCUSSION | VOTING | Game Master | La fase actual no es DISCUSSION. |
| VOTING | VOTING_RESULTS | Game Master o el temporizador en cero | — |
| VOTING_RESULTS | NIGHT | Game Master, tras ejecutar el resultado y si no hay ganador | Queda el disparo del cazador sin resolver, o ya hay ganador. |
| VOTING_RESULTS | GAME_OVER | La condición de victoria, después de ejecutar | — |
| NIGHT o DAY, durante la resolución | misma fase con `resolution = HUNTER_SHOT` | El cazador fue eliminado | El objetivo no está vivo. A los 30 segundos, el disparo se cancela y la resolución sigue. |
| Cualquiera en juego | CLOSED en la sala | Game Master cierra | No se escribe ganador. |

Orden al pasar de NIGHT a DAY: enlace ya hecho, protección, votos de lobos,
investigación, pociones, juicio de la niña, muertes, cadena de enamorados,
disparo del cazador si la muerte lo activa.

Victoria, en este orden: si los dos enamorados son los únicos vivos, `LOVERS`.
Si no queda ningún lobo vivo, `VILLAGE`. Si los lobos vivos igualan o superan
a los demás vivos, `WEREWOLF`.

## Proyecciones

- **Jugador**: sala, fase, ronda, lista pública de nombres y estado vital, su tarjeta, sus acciones legales, su voto ya confirmado sin el de los demás, eventos `TABLE`.
- **Game Master**: todo lo anterior para cada jugador, más rol de cada uno, acciones pendientes, progreso de votación sin el sentido del voto hasta la revelación, y eventos de ambas audiencias.
- **Desconectado**: la fila permanece. Al presentar el mismo token, o un token nuevo canjeado con el código de recuperación, la proyección vuelve a ser la de ese participante.
