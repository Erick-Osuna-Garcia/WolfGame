# Feature Specification: Werewolf Online

**Feature Branch**: `001-werewolf-online`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Werewolf Online, un juego multijugador de deducción social en el navegador. El Game Master crea una sala, comparte QR o código, y conduce fases, roles y votaciones. Cada jugador ve solo su rol y las acciones que le corresponden. Todos permanecen sincronizados sin recargar ni instalar nada."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reunir la sala (Priority: P1)

El Game Master abre una sala desde el navegador, obtiene un código corto y un QR, y los jugadores entran con su nombre. En la sala de espera todos ven quién está, cuántos son y quién dirige. Si alguien pierde la conexión, conserva su asiento y vuelve con el mismo nombre.

**Why this priority**: Sin una sala compartida no hay partida. Esta historia ya permite que un grupo se reúna desde sus teléfonos.

**Independent Test**: Crear una sala, unir al menos dos teléfonos por QR y por código, cortar la conexión de uno y recuperar el mismo asiento.

**Acceptance Scenarios**:

1. **Given** un Game Master en la página de inicio, **When** crea una sala, **Then** recibe un código legible y un QR que abren esa misma sala.
2. **Given** un código o QR válido y una sala que aún no empezó, **When** una persona escribe un nombre libre y confirma, **Then** aparece en la lista de todos los dispositivos unidos.
3. **Given** un nombre ya usado en la sala, **When** otra persona intenta usarlo, **Then** la entrada se rechaza y se le pide otro nombre.
4. **Given** un jugador unido, **When** su dispositivo pierde la conexión y vuelve antes de que cierre la sala, **Then** recupera el mismo asiento, el mismo nombre y no ocupa un cupo nuevo.
5. **Given** una sala con jugadores, **When** el Game Master expulsa a uno, **Then** esa persona deja de ver la sala y desaparece de la lista.
6. **Given** una sala abierta, **When** el Game Master la cierra, **Then** nadie más puede entrar y los participantes ven que la sesión terminó.

---

### User Story 2 - Repartir roles en privado (Priority: P2)

El Game Master elige el reparto clásico, lo asigna al azar y puede corregirlo antes de empezar. Al iniciar, cada jugador recibe su tarjeta de rol y puede consultarla durante toda la partida. El Game Master ve todos los roles. Ningún jugador ve el de otro.

**Why this priority**: El secreto del rol es el juego. La reunión de la historia 1 no necesita roles para ser útil; esta historia añade el reparto privado.

**Independent Test**: Con una sala de ocho jugadores, asignar roles al azar, comprobar en cada dispositivo que solo aparece el rol propio y en el panel del Game Master que aparecen los ocho.

**Acceptance Scenarios**:

1. **Given** una sala en espera con jugadores sentados, **When** el Game Master arma un reparto cuya cantidad coincide con los sentados y empieza, **Then** la partida pasa a la revelación y cada jugador ve solo su tarjeta.
2. **Given** un reparto que no coincide con la cantidad de sentados, **When** el Game Master intenta empezar, **Then** la partida no empieza y se indica cuántos roles faltan o sobran.
3. **Given** una partida ya empezada, **When** un jugador abre su tarjeta en cualquier fase posterior, **Then** sigue viendo nombre, imagen o icono, descripción, objetivo, habilidades, instrucciones y condiciones especiales de su rol.
4. **Given** una partida en curso, **When** un jugador inspecciona la información disponible en su dispositivo, **Then** no puede ver el rol, la habilidad privada ni el voto secreto de otro jugador.
5. **Given** el panel del Game Master, **When** consulta la tabla de jugadores, **Then** ve nombre, rol, estado vital y conexión de cada uno.

---

### User Story 3 - Conducir la noche y el día (Priority: P3)

El Game Master avanza la partida por fases. Cada jugador ve en su inicio solo lo que corresponde a la fase y a su rol. El panel del Game Master muestra el estado, las acciones pendientes y un registro de lo que ya ocurrió. El ritmo lo marca el Game Master. Si activó el modo asistido, la noche puede cerrarse sola cuando las acciones obligatorias están hechas.

**Why this priority**: Con roles repartidos, el grupo necesita un conductor y una pantalla que diga qué pasa ahora. Las habilidades concretas y la votación llegan en las historias siguientes.

**Independent Test**: Empezar una partida, recorrer noche, día y discusión, y comprobar que un aldeano solo ve espera, que un cambio de fase aparece en todos los dispositivos y que una transición ilegal no ocurre.

**Acceptance Scenarios**:

1. **Given** la revelación de roles terminada, **When** el Game Master inicia la noche, **Then** todos los dispositivos muestran la noche y el número de ronda, sin recargar.
2. **Given** la noche en curso, **When** el Game Master intenta abrir la votación, **Then** la fase no cambia y ve la razón.
3. **Given** acciones obligatorias de la noche sin completar y el modo manual, **When** el Game Master mira el panel, **Then** ve cuáles están completas y cuáles pendientes, y la fase no avanza sola.
4. **Given** el modo asistido activo y todas las acciones obligatorias completas, **When** la última acción obligatoria se confirma, **Then** la noche termina y comienza el día.
5. **Given** el modo manual, **When** todas las acciones obligatorias ya están completas, **Then** la noche sigue hasta que el Game Master la cierra.
6. **Given** cualquier cambio de fase aceptado, **When** queda registrado, **Then** el registro del Game Master lo muestra y el registro visible para jugadores no incluye secretos de rol.

---

### User Story 4 - Usar habilidades de noche (Priority: P4)

Durante la noche cada rol actúa solo dentro de sus reglas. Los hombres lobo eligen una víctima, la vidente investiga, la bruja usa sus pociones, el protector cubre a alguien, Cupido enlaza en la primera noche, la niña puede intentar mirar y el cazador dispara si muere. Los aldeanos esperan. Al amanecer la partida anuncia solo el resultado público.

**Why this priority**: Las fases de la historia 3 ordenan el tiempo. Esta historia llena la noche con las acciones que deciden quién sigue vivo.

**Independent Test**: Jugar una noche con los ocho roles clásicos vivos, resolver protección, veneno y enlace, y comprobar que cada jugador solo pudo usar su habilidad.

**Acceptance Scenarios**:

1. **Given** una noche con hombres lobo vivos, **When** cada lobo confirma un objetivo, **Then** la víctima de la noche es quien reúne más votos de lobo y los aldeanos no ven esa elección.
2. **Given** un empate entre objetivos de los lobos, **When** cierra la noche, **Then** no hay víctima de los lobos esa noche.
3. **Given** la vidente viva, **When** investiga a un jugador, **Then** recibe en privado si esa persona es hombre lobo o no, y nadie más recibe ese dato.
4. **Given** la bruja con poción de curación, **When** es de noche después de la elección de los lobos, **Then** puede salvar a la víctima propuesta, envenenar a otro vivo, hacer ambas cosas si le quedan las dos pociones, o pasar.
5. **Given** el protector, **When** intenta proteger al mismo jugador que protegió la noche anterior, **Then** la partida rechaza ese objetivo.
6. **Given** Cupido en la primera noche, **When** enlaza a dos jugadores, **Then** esos dos conocen el enlace y, si uno muere después, el otro muere con él.
7. **Given** la niña pide mirar durante la fase de los lobos, **When** el Game Master la marca como descubierta, **Then** muere al amanecer. **When** la marca como a salvo, **Then** ella conoce la identidad de los lobos y el resto no.
8. **Given** el cazador es eliminado, **When** elige a un jugador vivo dentro del tiempo, **Then** ese jugador también queda eliminado.
9. **Given** un aldeano durante la noche, **When** mira su inicio, **Then** no tiene ninguna acción que enviar y ve que debe esperar.

---

### User Story 5 - Votar, eliminar y cerrar (Priority: P5)

Tras la discusión, el Game Master abre una votación secreta con tiempo común. Cada vivo confirma su voto una vez. Al cerrar, se anuncia el resultado según la regla de la sala, se elimina a quien corresponda y, si un bando ya cumplió su objetivo, la partida nombra un ganador.

**Why this priority**: La noche cambia el pueblo. La votación es la otra mitad de la partida y cierra el ciclo hasta que hay un ganador. El lanzamiento jugable incluye de la historia 1 a esta.

**Independent Test**: Con una discusión activa, votar desde varios dispositivos, empatar una vez, eliminar en la siguiente y llegar a una condición de victoria.

**Acceptance Scenarios**:

1. **Given** una discusión activa, **When** el Game Master inicia la votación, **Then** cada jugador vivo ve a los demás vivos, confirma su voto y deja de poder cambiarlo si el cambio no estaba permitido.
2. **Given** la votación abierta, **When** un eliminado o un jugador que ya confirmó intenta votar de nuevo, **Then** la partida rechaza ese voto.
3. **Given** el cambio de voto permitido en la sala, **When** un vivo confirma un voto distinto antes del cierre, **Then** solo cuenta el último voto confirmado.
4. **Given** un empate o una mayoría de abstenciones, **When** la votación cierra, **Then** nadie es eliminado por el pueblo.
5. **Given** un único jugador con más votos, **When** el Game Master ejecuta el resultado, **Then** ese jugador queda eliminado, su rol se revela en público y todos ven el mismo resultado.
6. **Given** que ya no queda ningún hombre lobo vivo, **When** se resuelven las muertes, **Then** la partida termina y gana el pueblo.
7. **Given** que los hombres lobo vivos igualan o superan al resto de vivos que no son lobo, y los enamorados no son los únicos supervivientes, **When** se resuelven las muertes, **Then** la partida termina y ganan los hombres lobo.
8. **Given** que los dos enamorados son los únicos vivos, **When** se comprueba el fin, **Then** ganan los enamorados, aunque sean de bandos distintos.

---

### User Story 6 - Recordar la partida y preparar la siguiente (Priority: P6)

Al terminar, el Game Master puede releer el historial completo. Antes de una sala nueva puede guardar una configuración: mezcla de roles, tiempos, cambio de voto, revelación y modo asistido. El catálogo puede crecer más allá de los ocho roles clásicos sin cambiar el orden de las fases.

**Why this priority**: La línea base ya se puede jugar con las historias 1 a 5. Esta historia evita reconfigurar desde cero y deja entrar variantes.

**Independent Test**: Terminar una partida, abrir su historial, guardar una configuración y crear otra sala que la reutilice. Añadir un rol de prueba al catálogo y comprobar que las fases conocidas siguen en el mismo orden.

**Acceptance Scenarios**:

1. **Given** una partida terminada, **When** el Game Master abre su historial, **Then** ve en orden el inicio, cada fase, las acciones nocturnas, los votos agregados según la regla de revelación y las eliminaciones.
2. **Given** una configuración guardada, **When** el Game Master crea otra sala y la elige, **Then** la nueva sala nace con esos tiempos, esa política de voto y ese modo de ritmo.
3. **Given** un rol nuevo en el catálogo, **When** se juega una partida que lo incluye, **Then** el rol actúa solo en su fase declarada y el recorrido de fases no cambia.

---

### Edge Cases

- El jugador 31 es rechazado con un mensaje claro. El cupo es 30 jugadores más un Game Master.
- Quien escanea el QR después del inicio ve que la partida ya empezó y no entra como jugador nuevo.
- Un código inexistente, cerrado o mal escrito no revela si hay otras salas.
- Si el Game Master pierde la conexión, la fase no avanza sola y, al volver, recupera el panel con el mismo estado.
- Si un jugador se desconecta durante la votación, su voto confirmado se conserva. Si no confirmó, cuenta como abstención al cierre.
- Si el tiempo de votación llega a cero, la votación cierra con los votos ya confirmados.
- Si el cazador no elige a tiempo, muere sin disparar.
- Si la niña pidió mirar y el Game Master cierra la noche sin juzgarla, la mirada se anula y ella no obtiene información.
- Cupido no puede enlazar a una persona consigo misma ni enlazar en una noche que no sea la primera.
- La bruja no puede usar una poción agotada.
- Proteger, investigar, envenenar o votar a un eliminado se rechaza.
- Dos salas abiertas a la vez no mezclan jugadores, roles ni eventos.
- Cerrar la sala a mitad de la partida termina la sesión para todos y no nombra un ganador de juego. El historial conserva lo ocurrido hasta ese momento.
- Un nombre de solo espacios, de un carácter o de más de 24 caracteres se rechaza.
- El Game Master no ocupa un rol y no vota.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir que una persona cree una sala y quede como único Game Master, sin jugar un rol.
- **FR-002**: El sistema MUST entregar un código corto, legible en voz alta, y un QR que abran esa sala.
- **FR-003**: Una persona MUST poder unirse desde el navegador con el código o el QR, sin crear una cuenta y sin instalar una aplicación.
- **FR-004**: El jugador MUST elegir un nombre de 2 a 24 caracteres, único en la sala, antes de ocupar un asiento.
- **FR-005**: La sala de espera MUST mostrar participantes, cantidad, conexión y quién es el Game Master.
- **FR-006**: El Game Master MUST poder expulsar a un participante y cerrar la sala.
- **FR-007**: Una desconexión MUST NOT liberar el asiento. Al volver, la misma persona MUST recuperar nombre, rol y acciones ya confirmadas.
- **FR-008**: Cada participante MUST recibir, al unirse, un código de recuperación privado que permite volver desde otro navegador. Sin ese código, otro dispositivo MUST NOT ocupar su asiento.
- **FR-009**: El mismo navegador MUST poder recuperar la sesión sin pedir de nuevo el código de recuperación.
- **FR-010**: Una sala MUST aceptar hasta 30 jugadores además del Game Master, y MUST rechazar al siguiente.
- **FR-011**: Dos salas simultáneas MUST permanecer aisladas.
- **FR-012**: El Game Master MUST poder armar el reparto clásico y asignarlo al azar, y MUST poder corregirlo antes de empezar.
- **FR-013**: La partida MUST NOT empezar si la cantidad de roles no coincide con los jugadores sentados.
- **FR-014**: Al empezar, cada jugador MUST ver solo su tarjeta de rol, y MUST poder abrirla durante toda la partida.
- **FR-015**: La tarjeta MUST mostrar nombre, imagen o icono, descripción, objetivo, habilidades, instrucciones de uso y condiciones especiales.
- **FR-016**: El Game Master MUST ver el rol de todos. Un jugador MUST NOT recibir el rol, la investigación ni el voto secreto de otro.
- **FR-017**: El catálogo inicial MUST incluir Aldeano, Hombre lobo, Vidente, Bruja, Cazador, Cupido, Niña y Protector, con los bandos pueblo, hombres lobo o neutral.
- **FR-018**: Incorporar un rol nuevo MUST NOT cambiar el orden de las fases.
- **FR-019**: Las fases MUST recorrer, en este orden: sala de espera, revelación de roles, noche, día, discusión, votación, resultado de la votación y, cuando corresponda, partida terminada. Tras el resultado, el ciclo MUST volver a la noche hasta que la partida termine.
- **FR-020**: El Game Master MUST iniciar cada transición principal. La partida MUST rechazar, sin cambiar de fase, una votación sin discusión activa, una noche nueva con acciones obligatorias sin procesar, y cualquier acción de un eliminado.
- **FR-021**: El inicio de cada jugador MUST mostrar solo las acciones legales para su rol y la fase actual. Un aldeano de noche MUST ver espera y ninguna acción.
- **FR-022**: El panel del Game Master MUST mostrar jugadores conectados, cantidad, fase, ronda, temporizador, estado de acciones, tabla de jugadores, acciones pendientes y registro de eventos.
- **FR-023**: El modo de ritmo MUST ser manual por defecto. En modo manual la fase MUST NOT avanzar sola.
- **FR-024**: Si el Game Master activó el modo asistido, la noche MAY cerrarse en el momento en que todas las acciones obligatorias queden completas.
- **FR-025**: Los hombres lobo vivos MUST elegir objetivo cada noche. La víctima es la más votada entre ellos. Un empate MUST dejar la noche sin víctima de los lobos.
- **FR-026**: La vidente MUST poder investigar a un vivo por noche y recibir en privado si es hombre lobo o no.
- **FR-027**: La bruja MUST tener una curación y un veneno por partida. MUST ver a la víctima propuesta por los lobos antes de decidir. MUST poder pasar. MUST NOT usar una poción agotada.
- **FR-028**: El protector MUST poder cubrir a un vivo por noche y MUST NOT repetir el mismo objetivo dos noches seguidas.
- **FR-029**: Cupido, solo en la primera noche, MUST enlazar a dos jugadores distintos. Si uno muere, el otro MUST morir. Los enamorados MUST conocer el enlace.
- **FR-030**: La niña MAY pedir mirar a los lobos. El Game Master MUST registrar si fue descubierta. Si lo fue, muere al amanecer. Si no, conoce a los lobos. Si la noche cierra sin juicio, la mirada se anula.
- **FR-031**: El cazador, al ser eliminado, MUST poder elegir a un vivo para llevarse consigo. Si no elige a tiempo, no dispara.
- **FR-032**: El orden de resolución de la noche MUST ser: enlace de Cupido, protección, elección de los lobos, investigación, pociones, juicio de la niña y, al amanecer, muertes, cadena de enamorados y disparo del cazador.
- **FR-033**: La protección y la curación MUST anular la víctima de los lobos. El veneno MUST eliminar a otro vivo aunque la víctima de los lobos se salve.
- **FR-034**: Discusión y votación MUST compartir un temporizador único de la partida, fijado por el Game Master. Los valores iniciales MUST ser 3 minutos de discusión y 60 segundos de votación.
- **FR-035**: El voto MUST ser secreto, MUST exigir confirmación y, por defecto, MUST quedar bloqueado después de confirmar.
- **FR-036**: El cambio de voto MUST estar desactivado salvo que el Game Master lo active para esa sala. Si está activo, solo el último voto confirmado antes del cierre MUST contar.
- **FR-037**: Un jugador MUST poder abstenerse. Un empate, o una mayoría de abstenciones sin un único líder, MUST NOT eliminar a nadie.
- **FR-038**: El Game Master MUST ver el progreso de la votación sin ver el sentido del voto hasta la revelación. MUST poder revelar el resultado al cerrar o solo después de procesarlo.
- **FR-039**: Al ejecutar el resultado, el rol del eliminado MUST hacerse público. Los roles de quienes siguen vivos MUST permanecer ocultos.
- **FR-040**: El pueblo MUST ganar cuando no quede ningún hombre lobo vivo. Los hombres lobo MUST ganar cuando los lobos vivos igualen o superen al resto de vivos no lobos. Los enamorados MUST ganar si son los dos únicos vivos. La condición de enamorados MUST evaluarse antes que la de los bandos.
- **FR-041**: El registro del Game Master MUST anotar inicio, fases, acciones nocturnas, votos agregados según la regla de revelación y eliminaciones. El registro de un jugador MUST omitir secretos que no le correspondan.
- **FR-042**: Después de terminar, el Game Master MUST poder consultar el historial completo de esa partida.
- **FR-043**: El Game Master MUST poder guardar una configuración de sala con mezcla de roles, tiempos, cambio de voto, política de revelación y modo de ritmo, y reutilizarla en una sala nueva.
- **FR-044**: La interfaz MUST estar en español y MUST poder usarse con comodidad en un teléfono, con una presentación moderna de fantasía medieval oscura.
- **FR-045**: Toda acción aceptada del Game Master MUST verse reflejada en los dispositivos unidos sin recarga manual.
- **FR-046**: Unirse MUST dejar de estar disponible en cuanto la partida empieza.
- **FR-047**: Las acciones obligatorias de la noche MUST ser la elección de cada hombre lobo vivo y, en la primera noche, el enlace de Cupido si está vivo. Vidente, bruja, protector y niña MUST ser opcionales y MUST NOT bloquear el modo asistido.

### Key Entities

- **Sala**: Partida en preparación o en curso. Tiene código, QR, Game Master, cupo, configuración y estado de admisión.
- **Participante**: Game Master o jugador. Tiene nombre, conexión, código de recuperación y, si es jugador, estado vital.
- **Rol**: Ficha del catálogo con nombre, imagen o icono, bando, descripción, objetivo, habilidades, instrucciones y condiciones. Un jugador recibe un rol al empezar.
- **Habilidad**: Acción de un rol, usable de día o de noche, con o sin objetivo, y con un límite de usos por partida cuando corresponde.
- **Configuración de sala**: Decisiones reutilizables de tiempos, cambio de voto, revelación, modo de ritmo y mezcla de roles.
- **Fase**: Momento actual de la partida y número de ronda.
- **Acción nocturna**: Elección confirmada de un rol en una noche, con objetivo cuando la habilidad lo exige y con estado pendiente o completada.
- **Votación**: Ronda diurna con temporizador, votos secretos confirmados, abstenciones y política de revelación.
- **Evento**: Hecho ordenado del registro. Puede ser visible para todos o solo para el Game Master.
- **Resultado**: Eliminaciones del amanecer o de la votación, y el ganador cuando la partida termina.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un Game Master crea una sala y obtiene código y QR en menos de 60 segundos desde que abre la página.
- **SC-002**: Un jugador pasa del escaneo del QR a aparecer en la sala de espera en menos de 30 segundos.
- **SC-003**: Con 15 dispositivos en la misma sala, un cambio de fase aceptado se ve en todos en menos de 2 segundos, sin recargar.
- **SC-004**: Un grupo de 10 a 15 dispositivos completa una partida clásica, con roles privados, noche, votación y un ganador anunciado.
- **SC-005**: En la revisión de una partida completa, ningún dispositivo que no sea el del Game Master mostró el rol oculto de otro jugador ni un voto aún no revelado.
- **SC-006**: Un jugador que pierde la conexión hasta 2 minutos vuelve al mismo asiento, con el mismo nombre, sin ocupar otro cupo.
- **SC-007**: El 100% de los intentos de votar sin discusión, votar dos veces con el cambio desactivado, actuar estando eliminado o usar una habilidad de otro rol dejan la fase igual y muestran el motivo.
- **SC-008**: Durante la noche, el Game Master identifica qué acciones obligatorias faltan mirando solo su panel, sin preguntar en la mesa.
- **SC-009**: La sala número 30 acepta al jugador y la sala rechaza al 31 con un mensaje claro.
- **SC-010**: Dos salas abiertas a la vez no muestran, en ninguna pantalla, jugadores ni eventos de la otra.
- **SC-011**: En una prueba con personas que no conocen la interfaz, al menos 9 de cada 10 dicen en menos de 10 segundos cuál es la fase y si les toca actuar.
- **SC-012**: El Game Master reutiliza una configuración guardada y la nueva sala abre con esos valores, sin volver a introducirlos.

## Assumptions

- El Game Master dirige y no recibe rol. Hay un solo Game Master por sala, que es quien la crea. No se transfiere ese papel en esta versión.
- La línea base de lanzamiento es la suma de las historias 1 a 5. La historia 1 se puede demostrar sola. El lanzamiento no se considera completo hasta que una partida puede nombrar un ganador.
- La historia 6, el historial posterior y las configuraciones guardadas, amplía la línea base y no bloquea la primera partida jugable.
- Un segundo juego de deducción social queda fuera de esta especificación. Las salas, las sesiones y la sincronización se describen sin depender del nombre de un rol para que una partida futura pueda reutilizarlas.
- Cientos de personas a la vez, en muchas salas, no son condición de esta versión. Sí lo son 30 jugadores en una sala y más de una sala a la vez.
- Los valores iniciales de una sala nueva son: ritmo manual, cambio de voto desactivado, revelación del resultado al procesarlo, discusión de 3 minutos, votación de 60 segundos y disparo del cazador de 30 segundos.
- Al morir, el rol del eliminado se revela. Los vivos conservan el secreto.
- El código de sala evita caracteres ambiguos y se puede dictar. El QR abre directamente la entrada de esa sala.
- El texto de la interfaz está en español.
- La presentación es moderna, legible en el teléfono y con atmósfera de fantasía medieval oscura.
- Los nombres de fase que usa el gobierno del proyecto corresponden así: sala de espera es LOBBY, revelación de roles es ROLE_REVEAL, noche es NIGHT, día es DAY, discusión es DISCUSSION, votación es VOTING, resultado de la votación es VOTING_RESULTS y partida terminada es GAME_OVER.
- No hay cuentas, perfiles entre partidas ni aplicación instalable.
- Si se cierra la sala a mitad del juego, no hay ganador. El historial de lo ya ocurrido se conserva para el Game Master.
