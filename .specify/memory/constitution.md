<!--
Sync Impact Report
- Version change: unratified template → 1.0.0 (initial ratification)
- Principles added:
  - I. Motor de juego autoritativo
  - II. Sincronización en tiempo real
  - III. Conocimiento privado
  - IV. Participación sin cuenta ni instalación
  - V. Roles modulares
  - VI. El Game Master marca el ritmo
  - VII. Dos experiencias, un estado
  - VIII. Plataforma de partidas
- Sections added:
  - Restricciones técnicas
  - Entrega y compuertas de calidad
- Sections removed: none
- Template placeholders replaced: project name, principle slots expanded from
  five to eight, both body sections, governance rules, version, and dates
- Deferred items: none
-->

# Werewolf Online Constitution

## Core Principles

### I. Motor de juego autoritativo

Las reglas, la máquina de estados y el estado de cada partida MUST vivir en un
GameEngine del backend. El frontend representa ese estado. El backend decide
qué transición y qué acción son legales.

- Toda transición de fase MUST validarse en el servidor antes de aplicarse.
- Una votación MUST rechazarse si no hay una discusión activa.
- Una noche nueva MUST rechazarse mientras queden acciones obligatorias sin
  procesar.
- Un jugador eliminado MUST NOT votar ni usar habilidades.
- Un jugador MUST NOT votar dos veces en la misma votación, salvo que la regla
  activa permita cambiar el voto y el cambio ocurra antes del cierre.
- Un jugador MUST NOT ejecutar una habilidad que no pertenezca a su rol y a la
  fase actual.

Rationale: varios dispositivos comparten una partida. Si el cliente decide la
legalidad, la partida se desincroniza y un jugador puede actuar fuera de rol.

### II. Sincronización en tiempo real

Cada dispositivo unido a una sala MUST recibir los cambios de estado sin
recarga manual.

- Una acción del Game Master MUST seguir este orden: solicitud, verificación de
  permiso, cambio de estado, registro del evento y notificación a la sala.
- El reloj de votación y de discusión MUST pertenecer al servidor.
- La interfaz MUST actualizarse a partir del evento de estado, no de una
  suposición local.

Rationale: la partida es un motor multijugador. Una pantalla que solo cambia
al recargar no cumple el producto.

### III. Conocimiento privado

Cada jugador MUST ver únicamente su rol y la información pública de la fase.
El Game Master MUST poder consultar todos los roles.

- La tarjeta de rol MUST permanecer disponible durante toda la partida, ligada
  a la sesión de ese jugador.
- El servidor MUST NOT incluir el rol, la habilidad o el voto de otro jugador
  en el estado enviado a un cliente que no sea el Game Master.
- El voto MUST ser secreto hasta que la regla activa y el Game Master publiquen
  el resultado.
- El registro de eventos visible para jugadores MUST omitir secretos de rol.
  El registro del Game Master MAY incluirlos.

Rationale: el juego se rompe si un cliente puede leer información que las
reglas reservan a otro participante.

### IV. Participación sin cuenta ni instalación

Unirse MUST funcionar en el navegador, sin instalar una aplicación y sin crear
una cuenta.

- La entrada MUST aceptar código de sala o QR.
- Cada participante MUST recibir un identificador de sesión y un token de
  acceso privado.
- Una desconexión temporal MUST NOT sacar al jugador de la partida.
- La reconexión con el mismo token MUST restaurar al mismo participante, su rol
  y sus acciones ya confirmadas.

Rationale: la partida ocurre en la misma sala física. Pedir cuentas o una
instalación impide que el grupo empiece.

### V. Roles modulares

Los roles MUST definirse como módulos de datos, fuera de las condiciones
dispersas del GameEngine.

- Cada rol MUST declarar identificador, nombre, bando (`VILLAGE`, `WEREWOLF` o
  `NEUTRAL`), descripción, objetivo, habilidades y, si actúa de noche,
  prioridad nocturna.
- Cada habilidad MUST declarar identificador, nombre, descripción, fase (`DAY`
  o `NIGHT`), si exige objetivo y los usos por partida cuando el límite exista.
- Añadir un rol MUST NOT exigir reescribir la máquina de fases.
- La primera configuración MUST ser Werewolf clásico. El mismo contrato MUST
  admitir después variantes y partidas personalizadas.

Rationale: los roles cambian seguido. El flujo de la partida no.

### VI. El Game Master marca el ritmo

El Game Master MUST decidir cuándo avanza la fase principal. El sistema MUST
vigilar acciones pendientes y temporizadores, y MUST NOT avanzar la fase por su
cuenta salvo que el Game Master haya activado el modo asistido.

- En modo manual, el cumplimiento de las acciones MUST quedar visible y la fase
  MUST permanecer hasta que el Game Master avance.
- En modo asistido, la noche MAY cerrarse solo cuando el Game Master lo
  configuró y cada rol activo con acción obligatoria ya actuó.
- El Game Master MUST poder expulsar, asignar roles, iniciar, cerrar la sala y
  resolver resultados. Cada una de esas operaciones MUST autorizarse en el
  servidor.

Rationale: el ritmo de una partida presencial lo lleva una persona. El sistema
informa y espera su decisión.

### VII. Dos experiencias, un estado

La aplicación MUST ofrecer dos experiencias sobre el mismo estado autoritativo.

- El jugador MUST ver una interfaz privada: rol, instrucciones de la fase y
  solo las acciones que su rol puede ejecutar ahora.
- El Game Master MUST ver un panel con estado de la partida, control de fases,
  administración de jugadores, acciones pendientes y registro de eventos.
- Lobby, inicio del jugador y panel del Game Master MUST reflejar la misma fase
  y la misma lista de participantes.

Rationale: mezclar el panel del Game Master con la vista del jugador filtra
información y complica el control de la mesa.

### VIII. Plataforma de partidas

El núcleo MUST separarse de las reglas de Werewolf para poder alojar después
otro juego de deducción social sin rehacer salas, sesiones ni tiempo real.

- El administrador de salas, la identidad de sesión, el transporte en tiempo
  real y el panel de control MUST ignorar los nombres de los roles.
- Las reglas de Werewolf MUST vivir en el módulo de roles y en el paquete de
  reglas.
- Un segundo juego MUST poder añadirse como otro paquete de reglas que reutilice
  salas, sesiones y sincronización.

Rationale: el producto es un motor de partidas multijugador. Werewolf es la
primera configuración, no el límite de la arquitectura.

## Restricciones técnicas

El stack de la primera versión queda fijado así:

- Frontend: React y TypeScript sobre TanStack Start. La interfaz MUST ser
  mobile first.
- Backend: Node.js y NestJS. El GameEngine MUST ser un módulo independiente
  dentro de la API.
- Tiempo real: Socket.IO.
- Persistencia: PostgreSQL para partidas, jugadores e historial.
- Validación: Zod en los eventos y en los datos compartidos por cliente y
  servidor.
- Redis MUST NOT ser requisito del despliegue de una sola instancia. Redis MUST
  incorporarse antes de repartir conexiones o estado efímero entre varias
  instancias de la API.

La estructura del repositorio MUST ser:

- `apps/web` para rutas, componentes y las áreas lobby, player, game-master,
  voting y roles.
- `apps/api` para rooms, players, games, roles, voting, game-master,
  game-engine, gateways y database.
- `packages/shared`, `packages/game-rules` y `packages/validators` para el
  contrato compartido.

Capacidad:

- Cada sala MUST diseñarse para 15 a 30 jugadores más un Game Master.
- El sistema MUST permitir varias salas independientes a la vez.
- Cientos de usuarios simultáneos en muchas salas es un objetivo posterior y
  no es compuerta de la línea base.

La máquina de estados MUST usar estas fases: `LOBBY`, `ROLE_REVEAL`, `NIGHT`,
`DAY`, `DISCUSSION`, `VOTING`, `VOTING_RESULTS` y `GAME_OVER`. Después de la
primera resolución, el ciclo vuelve a `NIGHT` hasta `GAME_OVER`.

El módulo de votación MUST cubrir voto secreto, confirmación antes de enviar,
bloqueo al confirmar, cambio de voto solo si la regla activa lo permite,
temporizador de servidor, progreso visible para el Game Master, resultado
público o privado según la regla, empates y abstenciones.

La dirección visual MUST ser una interfaz moderna con temática de fantasía
medieval oscura: legible en el teléfono, con bosque, luna y misterio como
atmósfera, y usable por completo desde el navegador.

## Entrega y compuertas de calidad

La línea base jugable MUST permitir, en una misma partida: crear la sala,
conectar de 10 a 15 dispositivos, asignar roles al azar, mostrar cada rol solo
a su jugador, iniciar y cerrar fases desde el Game Master, ejecutar acciones
nocturnas, votar, sincronizar todos los dispositivos, terminar la partida y
nombrar un ganador.

El trabajo se ordena en cuatro entregas. Ninguna entrega puede aplazar un
principio ya aplicable.

- V1, multijugador: crear sala, unirse por QR o código, lobby y sincronización.
  La sesión y la reconexión del Principio IV aplican en esta entrega.
- V2, motor: asignación de roles, fases, noche, día y panel del Game Master.
- V3, interacción: habilidades, votaciones, eliminación y resultados.
- V4, ampliación: historial consultable, configuraciones personalizadas y roles
  más allá del clásico. La reconexión no espera a esta entrega.

Compuertas de revisión:

- Un cambio que mueva la legalidad de una acción al cliente, revele el rol de
  otro jugador o avance una fase sin validación del servidor MUST rechazarse.
- Toda especificación, plan y tarea que toque estado de partida, privacidad o
  fases MUST indicar qué principio satisface.
- Redis, un segundo juego o un rol fuera del clásico MUST justificarse contra
  la entrega en curso.
- El registro de eventos MUST anotar inicio, cambios de fase, acciones
  nocturnas, votos agregados según la regla de revelación y eliminaciones.

## Governance

Esta constitution manda sobre la práctica informal y sobre cualquier documento
que la contradiga. Si una especificación, un plan o una tarea entran en
conflicto con un principio, se corrige el documento. El principio permanece.

Procedimiento de enmienda:

- Toda enmienda MUST documentar el motivo, el principio afectado y, si cambia
  una regla ya usada por una especificación, el plan de migración.
- MAJOR: se elimina o se redefine un principio de forma incompatible.
- MINOR: se agrega un principio o se amplía una regla de manera material.
- PATCH: aclaración, redacción o corrección sin cambio de norma.
- La fecha de última enmienda MUST usar el formato YYYY-MM-DD.
- Una enmienda MUST quedar escrita en este archivo antes de usarse como
  criterio de revisión.

Cumplimiento:

- Cada revisión de especificación, plan, tareas y cambios de código MUST
  comprobar estos principios.
- La complejidad extra MUST justificarse. Una sola instancia de NestJS y
  PostgreSQL basta hasta que haga falta más de una instancia.
- La guía de desarrollo vigente es `.specify/memory/constitution.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-03 | **Last Amended**: 2026-11-03
