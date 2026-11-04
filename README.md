# Werewolf Online

Motor de partidas de deducción social en el navegador. El Game Master crea una sala, comparte un código o un QR, y cada jugador ve solo su rol. El servidor decide las reglas; los teléfonos solo muestran el estado.

## Requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL es opcional en local. Sin `DATABASE_URL` la API usa memoria. Con Docker:

```bash
docker compose up -d
```

Copia `.env.example` a `.env` si quieres persistir en Postgres.

## Desarrollo

```bash
pnpm install
pnpm test
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

En la red local, abre la web desde la IP de la máquina para que el QR funcione en los teléfonos.

## Entregas

- V1 sala, QR, sesión y lobby en vivo
- V2 roles privados, fases y panel del Game Master
- V3 noche, votación y ganador
- V4 historial y configuraciones reutilizables

## Pruebas

```bash
pnpm test:rules
pnpm --filter @werewolf/api test
```
