# Research: Werewolf Online

## 1. Web y API en procesos distintos

**Decision**: `apps/web` es TanStack Start (React, TanStack Router, Vite 8) y solo
presenta estado. `apps/api` es NestJS y es el único dueño de salas, sesiones,
fases y reglas. El navegador crea y recupera la sesión por HTTP, y sigue la
partida por Socket.IO.

**Rationale**: La constitution fija ese stack y prohíbe que el cliente decida
qué es legal. TanStack Start también sabe ejecutar funciones de servidor. Si
esas funciones resolvieran la noche o la votación, habría dos motores. El
paquete `@tanstack/react-start` actual (1.x, octubre 2026) exige Vite 8.

**Alternatives considered**: Usar las server functions de Start como backend
del juego. Se rechaza porque duplica el motor y rompe el Principio I. Un SPA
con solo TanStack Router se rechaza porque la constitution pide TanStack Start.

## 2. Reglas puras y adaptador Nest

**Decision**: `packages/game-rules` contiene la máquina de fases, el catálogo
de roles y la resolución, sin Nest ni base de datos. `apps/api/src/game-engine`
carga el estado, llama al paquete, persiste el resultado y pide el aviso a la
sala.

**Rationale**: El Principio V pide roles modulares fuera de condiciones
dispersas. El Principio VIII pide que salas y transporte ignoren los nombres
de los roles. Un paquete puro se prueba sin levantar el servidor.

**Alternatives considered**: Escribir las reglas dentro de los servicios Nest.
Se rechaza porque un rol nuevo obligaría a tocar transporte y persistencia.

## 3. Persistencia sin Redis

**Decision**: PostgreSQL guarda salas, participantes, partidas, acciones,
votos y eventos. El proceso Nest conserva en memoria la partida caliente de
cada sala y escribe en PostgreSQL cada acción aceptada. Redis no se instala
en esta versión.

**Rationale**: La constitution permite una sola instancia de NestJS y
PostgreSQL, y exige Redis solo antes de repartir conexiones entre instancias.
El write-through permite reconstruir la partida si el proceso reinicia.

**Alternatives considered**: Redis desde el primer día. Se rechaza porque
añade un servicio que la línea base no necesita. Estado solo en memoria. Se
rechaza porque una caída borraría roles y votos.

## 4. Acceso a PostgreSQL

**Decision**: Prisma, con el esquema en `apps/api/prisma/schema.prisma` y el
módulo Nest en `apps/api/src/database`.

**Rationale**: El esquema queda explícito, las migraciones son repetibles y
los tipos acompañan a TypeScript. Encaja con un solo almacén relacional.

**Alternatives considered**: TypeORM, más cercano a los ejemplos de Nest, se
rechaza porque el esquema de una partida es más claro en un archivo Prisma.
Drizzle se rechaza para no abrir otra variante sin una ventaja exigida por la
constitution.

## 5. Sesión sin cuenta

**Decision**: Al crear o unirse, la API devuelve un token de sesión opaco y un
código de recuperación de un solo uso visible. El token viaja en una cookie
`HttpOnly` `SameSite=Lax` para el mismo navegador. El código de recuperación
permite pedir otro token desde otro navegador. En la base solo se guardan
hashes. El handshake de Socket.IO exige el token.

**Rationale**: Cumple el Principio IV sin cuentas. El mismo navegador vuelve
solo. Otro dispositivo necesita el secreto que se mostró al sentarse.

**Alternatives considered**: Guardar el token en `localStorage`. Se rechaza
porque cualquier script de la página podría leerlo. Una cuenta de usuario. La
spec la deja fuera.

## 6. Contrato en tiempo real

**Decision**: Socket.IO con el adaptador de Nest. Cada sala es una room con el
identificador de la partida. El gateway proyecta un estado distinto para el
Game Master y para cada jugador antes de emitir. Un evento aceptado sigue
este orden: autorizar, aplicar en `game-rules`, persistir, registrar, emitir.

**Rationale**: Es el transporte fijado por la constitution. La proyección por
destinatario es la garantía del Principio III, no un filtro de la interfaz.

**Alternatives considered**: Server-Sent Events. Se rechaza porque la
constitution fija Socket.IO y el cliente también envía acciones. Un canal
único con el estado completo. Se rechaza porque filtraría roles ajenos.

## 7. Validación compartida

**Decision**: `packages/validators` exporta esquemas Zod de comandos, fases y
límites. La API los usa en HTTP y en cada evento de socket. La web los usa
antes de enviar, como ayuda, sin valor de autorización.

**Rationale**: El mismo límite (nombre de 2 a 24 caracteres, cupo 30, fase
conocida) no debe escribirse dos veces. La decisión legal sigue en el motor.

**Alternatives considered**: class-validator solo en Nest. Se rechaza porque
el cliente quedaría con reglas copiadas a mano.

## 8. Cupido cuenta como pueblo

**Decision**: Aldeano, Vidente, Bruja, Cazador, Protector y Niña son
`VILLAGE`. Hombre lobo es `WEREWOLF`. Cupido es `VILLAGE` para la paridad de
victoria. El enlace de enamorados es una capa aparte y se evalúa antes que
los bandos.

**Rationale**: Si Cupido fuera neutral y siguiera vivo, la cuenta de lobos
contra no lobos cambiaría sin que la spec lo pida. La victoria de enamorados
ya tiene su propia regla.

**Alternatives considered**: Cupido `NEUTRAL`. Se rechaza para esta versión
clásica. El bando neutral queda en el contrato del rol para una variante
futura.

## 9. Cierre de la noche

**Decision**: En modo manual, pasar de noche a día se rechaza mientras quede
una acción obligatoria pendiente. Las acciones opcionales no bloquean. Al
cerrar, una mirada de la niña sin juicio se anula. En modo asistido, la noche
pasa a día cuando la última acción obligatoria se confirma.

**Rationale**: Une FR-020, FR-023, FR-024, FR-030 y FR-047. El Game Master no
es arrastrado por las acciones opcionales, y tampoco abre el día con lobos
que aún no eligieron.

**Alternatives considered**: Permitir que el Game Master cierre la noche con
lobos pendientes y contarlos como abstención. Se rechaza porque la spec trata
esa elección como obligatoria.

## 10. Pruebas

**Decision**: Vitest en `packages/game-rules`, `packages/validators` y
`apps/web`. Jest con `@nestjs/testing` en `apps/api`. Playwright para los
recorridos de `quickstart.md`.

**Rationale**: Las reglas se prueban como funciones puras. La API se prueba
con el arnés de Nest. El navegador prueba la reunión, el secreto y la
sincronización que la spec mide.

**Alternatives considered**: Un solo ejecutor para todo. Se rechaza en la API
porque el arnés oficial de Nest es Jest. Probar las reglas solo desde la API.
Se rechaza porque un fallo de fase quedaría escondido detrás de HTTP.

## 11. Interfaz

**Decision**: Tailwind CSS 4, mobile first, paleta oscura de fantasía
medieval. El QR se dibuja en el navegador a partir de la URL de entrada que
devuelve la API. La interfaz y los errores visibles están en español.

**Rationale**: La spec pide teléfono, español y atmósfera. El QR no necesita
una imagen guardada en el servidor.

**Alternatives considered**: Una librería de componentes clara y genérica. Se
rechaza como base visual porque empuja a una interfaz de panel administrativo
y no a la atmósfera pedida.

## 12. Espacio de trabajo

**Decision**: pnpm workspaces. Paquetes `@werewolf/web`, `@werewolf/api`,
`@werewolf/shared`, `@werewolf/game-rules` y `@werewolf/validators`. Node.js 24.

**Rationale**: El monorepo de la constitution necesita instalar una vez y
enlazar los tres paquetes compartidos. Node 24 es la línea actual de soporte
largo en la fecha de este plan.

**Alternatives considered**: npm workspaces. Sirve, y se rechaza solo porque
pnpm aísla mejor las dependencias entre apps. Turborepo se deja para cuando
el tiempo de build lo pida.
