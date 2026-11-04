# Contract: UI surfaces

Tres superficies. Comparten la fase y la lista pública. Ninguna calcula
muertes ni acepta una acción que el contrato de tiempo real haya rechazado.

La presentación es mobile first, en español, con fantasía medieval oscura.

## Entrada

- Crear sala pide el nombre del Game Master.
- Unirse pide código, o llega con el código ya puesto si se abrió el QR.
- Después del nombre, se muestra una vez el código de recuperación.

## Sala de espera

Visible para todos: código, QR y enlace en el dispositivo del Game Master,
nombres, cantidad, conexión y quién es el Game Master.

Solo el Game Master: expulsar, cerrar, armar el reparto clásico, repartir al
azar, corregir una ficha, aplicar una configuración guardada y empezar.
Empezar permanece indisponible si el número de roles no coincide con los
sentados.

## Inicio del jugador

La tarjeta propia está siempre a un gesto de distancia. El resto de la
pantalla depende de la fase.

| Fase | Qué muestra | Qué puede enviar |
| --- | --- | --- |
| Revelación | La tarjeta y la espera a la noche. | Nada. |
| Noche | La instrucción de su rol. | Solo sus habilidades de noche. El aldeano no tiene envío. |
| Día | Muertes públicas y el rol de quien murió. | Nada. |
| Discusión | El temporizador común. | Nada. |
| Votación | Vivos, confirmar, tiempo restante, aviso de voto secreto. | Un voto o una abstención. |
| Resultado | El resultado ya revelado, o la espera si el Game Master aún no lo procesa. | Nada, salvo el disparo si esa persona es el cazador y el plazo sigue abierto. |
| Terminada | El ganador. | Nada. La tarjeta propia sigue disponible. |

## Panel del Game Master

Cinco bloques en la misma vista, apilados en el teléfono:

1. Estado: cantidad, conectados, fase, ronda, temporizador, ritmo manual o asistido.
2. Fases: iniciar noche, cerrar noche, iniciar discusión, iniciar votación, cerrar votación, ejecutar resultado. Un mando ilegal permanece visible y, si se usa, muestra el rechazo sin cambiar la pantalla de fase.
3. Jugadores: nombre, rol, vida, conexión, y expulsar mientras la sala lo permita.
4. Acciones pendientes: habilidad, jugador y estado. Lo obligatorio se distingue de lo opcional.
5. Registro: eventos de la mesa y los secretos de esa partida.

También aquí: juzgar la mirada de la niña, guardar la configuración y cerrar la sala.

## Lo que no aparece

- Un jugador no tiene los cinco bloques del Game Master.
- El Game Master no recibe una tarjeta de rol propio.
- El progreso de votación cuenta cuántos confirmaron, no a quién, hasta que la política de revelación lo permite.
