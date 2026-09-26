import { Meters, MetersPerSecondSquared } from "../../units";
import { NedVector } from "../../vectors";
import type { GravityModel } from "./GravityModel";

/**
 * Gravity with the same strength everywhere, pointing straight down (+D).
 * Good enough for anything that stays within a few km of the ground.
 */
export class ConstantGravity implements GravityModel {
  /** Standard gravity, g₀ (exact, by definition). */
  static readonly STANDARD = new MetersPerSecondSquared(9.80665);

  constructor(public readonly g: MetersPerSecondSquared = ConstantGravity.STANDARD) {}

  gravityAt(_positionNed: NedVector<Meters>): NedVector<MetersPerSecondSquared> {
    const zero = new MetersPerSecondSquared(0);
    return new NedVector(zero, zero, this.g);
  }
}
