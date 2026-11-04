import { MAX_PLAYERS, MIN_PLAYERS, type RoleId } from "@werewolf/shared";

export function classicComposition(playerCount: number): RoleId[] {
  if (playerCount < MIN_PLAYERS) {
    throw new Error(`Se necesitan al menos ${MIN_PLAYERS} jugadores`);
  }
  if (playerCount > MAX_PLAYERS) {
    throw new Error(`El cupo es ${MAX_PLAYERS} jugadores`);
  }

  const wolfCount =
    playerCount <= 6 ? 1 : playerCount <= 9 ? 2 : playerCount <= 12 ? 3 : playerCount <= 17 ? 4 : playerCount <= 22 ? 5 : 6;

  const roles: RoleId[] = Array.from({ length: wolfCount }, () => "werewolf");
  roles.push("seer", "witch");
  if (playerCount >= 6) roles.push("hunter");
  if (playerCount >= 7) roles.push("cupid");
  if (playerCount >= 8) roles.push("little_girl", "protector");
  while (roles.length < playerCount) {
    roles.push("villager");
  }
  return roles.slice(0, playerCount);
}

export function shuffleRoles(roles: RoleId[], random = Math.random): RoleId[] {
  const copy = [...roles];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
  }
  return copy;
}
