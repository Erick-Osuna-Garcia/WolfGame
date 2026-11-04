# Contract: HTTP session

Base: la API Nest. La web no autoriza con estas respuestas. Solo obtiene una
sesión. Todos los cuerpos se validan con `packages/validators` antes de tocar
el motor.

Los errores usan `{ "code", "message" }`. `message` está en español.

## `POST /rooms`

Crea la sala y sienta al Game Master.

Request: `{ "displayName": "3 a 24 caracteres tras recortar" }`

Response `201`:

```json
{
  "roomId": "uuid",
  "code": "6 caracteres del alfabeto sin 0, O, 1 ni I",
  "joinPath": "/unirse/<code>",
  "sessionToken": "opaco",
  "recoveryCode": "visible una sola vez"
}
```

La cookie `ww_session` lleva el mismo token, `HttpOnly`, `SameSite=Lax`.

## `POST /rooms/join`

Request: `{ "code", "displayName" }`

Response `201`: `roomId`, `participantId`, `sessionToken`, `recoveryCode`, y
la cookie.

Errores:

| Código | Cuándo |
| --- | --- |
| `room_not_found` | El código no existe. La respuesta no dice si otras salas existen. |
| `room_closed` | La sala está cerrada. |
| `match_started` | La partida ya empezó. |
| `name_taken` | El nombre ya está en la sala. |
| `name_invalid` | Fuera de 2 a 24 caracteres, o solo espacios. |
| `room_full` | Ya hay 30 jugadores. |

## `POST /rooms/recover`

Request: `{ "recoveryCode" }`

Response `200`: nuevo `sessionToken`, cookie nueva, y el tipo de participante.
El código anterior queda invalidado y se entrega uno nuevo, también una sola
vez.

Error `recovery_invalid` si el código no corresponde a un asiento.

## `GET /rooms/:code`

Response `200`: `{ "admission": "OPEN" | "IN_PROGRESS" | "CLOSED" }`.

`404` con `room_not_found` si el código no existe. No incluye jugadores ni
roles.

## Autorización posterior

HTTP no avanza fases ni acepta votos. Eso ocurre en el contrato de tiempo
real, con el token de esta sesión.
