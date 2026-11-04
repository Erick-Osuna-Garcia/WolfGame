import { describe, expect, it } from "vitest";
import { classicComposition } from "../src/index";

describe("classicComposition", () => {
  it("rejects fewer than 5 and more than 30 players", () => {
    expect(() => classicComposition(4)).toThrow(/5/);
    expect(() => classicComposition(31)).toThrow(/30/);
  });

  it("returns exactly as many roles as seated players", () => {
    for (let count = 5; count <= 30; count += 1) {
      expect(classicComposition(count)).toHaveLength(count);
    }
  });

  it("uses the eight classic roles for 8 players", () => {
    expect(classicComposition(8).sort()).toEqual(
      ["cupid", "hunter", "little_girl", "protector", "seer", "werewolf", "werewolf", "witch"].sort(),
    );
  });
});
