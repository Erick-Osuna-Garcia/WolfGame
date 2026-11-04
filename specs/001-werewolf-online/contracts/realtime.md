# Contract: realtime match

Transporte: Socket.IO, namespace `/match`. El handshake envía el token de
sesión. Si falta o no es válido, la conexión se rechaza.

El servidor une el socket a la room `match:<matchId>` cuando la partida
existe, o `room:<roomId>` mientras espera. Cada emisión usa la proyección de
`data-model.md` para ese participante. Un payload de jugador no incluye el
rol, la investigación ni el voto de otra persona.

Orden de un comando aceptado: validar el esquema, autorizar al emisor,
aplicar `packages/game-rules`, persistir, escribir el evento, emitir.

Un comando rechazado no cambia la fase. El servidor emite `command:rejected`
solo al emisor: `{ "code", "message" }`.

## Cliente → servidor

| Evento | Quién | Cuerpo |
| --- | --- | --- |
| `room:expel` | Game Master | `{ "participantId" }` |
| `room:close` | Game Master | `{}` |
| `settings:apply` | Game Master, solo en `LOBBY` | Tiempos, ritmo, cambio de voto, revelación y lista de roles |
| `roles:deal` | Game Master, solo en `LOBBY` | `{ "mode": "random" }` o `{ "mode": "manual", "assignments": [{ "participantId", "roleId" }] }` |
| `match:start` | Game Master | `{}` |
| `phase:advance` | Game Master | `{ "to": "NIGHT" \| "DAY" \| "DISCUSSION" \| "VOTING" \| "VOTING_RESULTS" }` |
| `night:submit` | Jugador vivo con esa habilidad | `{ "abilityId", "targetIds": [] }` |
| `night:pass` | Jugador con habilidad opcional | `{ "abilityId" }` |
| `peek:judge` | Game Master | `{ "caught": true \| false }` |
| `hunter:shoot` | Cazador eliminado, durante `HUNTER_SHOT` | `{ "targetId" }` |
| `vote:cast` | Jugador vivo en `VOTING` | `{ "targetId" }` o `{ "abstain": true }` |
| `preset:save` | Game Master | `{ "name" }` sobre la configuración actual |

## Servidor → cliente

| Evento | Destino | Contenido |
| --- | --- | --- |
| `state:sync` | El socket que acaba de autorizarse | Proyección completa de ese participante. |
| `room:updated` | Toda la sala | Lista pública, cupo, admisión, conexión. Sin roles. |
| `match:updated` | Cada socket, ya proyectado | Fase, ronda, temporizador, acciones legales de ese jugador, vida pública. |
| `role:private` | Solo el jugador dueño | Su tarjeta. También se reenvía al reconectar. |
| `gm:table` | Solo el Game Master | Roles, acciones pendientes, progreso de votación sin sentido del voto. |
| `seer:result` | Solo la vidente | `{ "targetId", "isWerewolf" }` |
| `witch:victim` | Solo la bruja, de noche | La víctima propuesta, o vacío si los lobos empataron. |
| `lovers:linked` | Solo cada enamorado | El otro nombre. |
| `vote:closed` | Toda la sala, según la política | Con `ON_CLOSE`, el resultado al cerrar. Con `AFTER_PROCESSING`, solo el aviso de que el Game Master aún no lo ejecuta. |
| `match:resolved` | Toda la sala | Eliminaciones públicas, rol del eliminado, ganador si lo hay. |
| `event:appended` | Según `audience` | Un evento nuevo. |
| `command:rejected` | Solo el emisor | Código y mensaje en español. |

## Códigos de rechazo

| Código | Regla |
| --- | --- |
| `not_game_master` | Un jugador pidió un mando de la mesa. |
| `not_seated` | El token no tiene asiento. |
| `eliminated` | Un eliminado vota o usa una habilidad. |
| `wrong_phase` | La acción no pertenece a la fase, incluida la votación fuera de `DISCUSSION` al intentar abrirla. |
| `pending_required` | Noche a día, o una noche nueva, con una acción obligatoria pendiente. |
| `role_count` | El reparto no coincide con los sentados. |
| `wrong_role` | La habilidad no es de su rol. |
| `illegal_target` | Eliminado, fuera de la sala, la misma persona, o el protegido de anoche. |
| `ability_spent` | Poción agotada o habilidad ya usada en esa noche. |
| `vote_locked` | Segundo voto con el cambio desactivado. |
| `admission_closed` | Alta cuando la partida ya empezó o la sala está llena o cerrada. |

## Temporizadores

El servidor guarda `votingEndsAt`, `discussionEndsAt` y `hunterEndsAt`. El
cliente solo dibuja el instante. Al llegar la hora, el proceso de la API
cierra la votación o cancela el disparo, aunque ningún navegador siga abierto
en esa pantalla.
