import {
  ABILITY_IDS,
  GAME_PHASES,
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
  PACE_MODES,
  ROLE_IDS,
} from "@werewolf/shared";
import { z } from "zod";

export const playerNameSchema = z
  .string()
  .trim()
  .min(MIN_NAME_LENGTH, "El nombre debe tener entre 2 y 24 caracteres")
  .max(MAX_NAME_LENGTH, "El nombre debe tener entre 2 y 24 caracteres")
  .refine((value) => value.trim().length >= MIN_NAME_LENGTH, {
    message: "El nombre debe tener entre 2 y 24 caracteres",
  });

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/, "Código de sala no válido");

export const recoveryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/, "Código de recuperación no válido");

export const createRoomSchema = z.object({
  configId: z.string().optional(),
});

export const joinRoomSchema = z.object({
  code: roomCodeSchema,
  name: playerNameSchema,
});

export const rejoinSchema = z.object({
  token: z.string().min(16).optional(),
  recoveryCode: recoveryCodeSchema.optional(),
}).refine((value) => Boolean(value.token || value.recoveryCode), {
  message: "Falta el token o el código de recuperación",
});

export const kickSchema = z.object({
  participantId: z.string().min(1),
});

export const assignRolesSchema = z.object({
  roles: z.array(z.enum(ROLE_IDS)).optional(),
});

export const correctRoleSchema = z.object({
  participantId: z.string().min(1),
  roleId: z.enum(ROLE_IDS),
});

export const advancePhaseSchema = z.object({
  to: z.enum(GAME_PHASES),
});

export const setPaceSchema = z.object({
  paceMode: z.enum(PACE_MODES),
});

export const nightActionSchema = z.object({
  abilityId: z.enum(ABILITY_IDS),
  targetId: z.string().nullable().optional(),
  secondTargetId: z.string().nullable().optional(),
});

export const voteSchema = z.object({
  targetId: z.string().nullable(),
});

export const hunterSchema = z.object({
  targetId: z.string().nullable(),
});

export const judgeGirlSchema = z.object({
  discovered: z.boolean(),
});

export const saveConfigSchema = z.object({
  name: z.string().trim().min(2).max(40),
});

export const applyConfigSchema = z.object({
  configId: z.string().min(1),
});
