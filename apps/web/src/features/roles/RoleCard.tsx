import type { RoleDefinition } from "@werewolf/shared";

export function RoleCard({ role }: { role: RoleDefinition }) {
  return (
    <article className="panel role-card stack">
      <p className="muted">{role.icon} Tu rol</p>
      <h2>{role.name}</h2>
      <p>{role.description}</p>
      <p><strong>Objetivo:</strong> {role.objective}</p>
      {role.abilities.length > 0 && (
        <div>
          <strong>Habilidades</strong>
          <ul>
            {role.abilities.map((ability) => (
              <li key={ability.id}>{ability.name}: {ability.description}</li>
            ))}
          </ul>
        </div>
      )}
      <p><strong>Instrucciones:</strong> {role.instructions}</p>
      <p className="muted">{role.specialConditions}</p>
    </article>
  );
}
